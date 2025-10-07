from flask import Blueprint, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from .extensions import db
from .models import User, Medication, MedicationLog, Appointment, HealthRecord
from sqlalchemy import func, extract
from datetime import date, datetime, timedelta
from collections import defaultdict

stats_bp = Blueprint('stats', __name__, url_prefix='/api/stats')

@stats_bp.route('/caregiver_dashboard/<int:elder_id>', methods=['GET'])
@jwt_required()
def get_caregiver_dashboard_stats(elder_id):
    current_user_id = get_jwt_identity()
    caregiver = User.query.get(current_user_id)
    elder = User.query.get(elder_id)
    
    # ตรวจสอบสิทธิ์
    if not caregiver or caregiver.role not in ['caregiver', 'osm'] or not elder or elder not in caregiver.managed_elders:
        return jsonify(msg="Permission denied or elder not found"), 403

    today = date.today()
    
    # --- 1. สรุปการกินยาของวันนี้ (ปรับปรุง Query ให้แม่นยำขึ้น) ---
    meds_today_query = Medication.query.filter(
        Medication.user_id == elder_id,
        Medication.start_date <= today,
        (Medication.end_date == None) | (Medication.end_date >= today)
    )
    meds_today_ids = [m.id for m in meds_today_query.all()]
    total_meds_today = len(meds_today_ids)
    
    taken_count = 0
    if total_meds_today > 0:
        taken_count = MedicationLog.query.filter(
            MedicationLog.medication_id.in_(meds_today_ids),
            func.date(MedicationLog.taken_at) == today
        ).count()
    
    missed_count = total_meds_today - taken_count
            
    # --- 2. ยอดรวมการกินยา (Pie Chart) ---
    adherence_percentage = (taken_count / total_meds_today * 100) if total_meds_today > 0 else 0

    # --- 3. สถิติ 7 วันย้อนหลัง (Line Chart) ---
    seven_days_ago = today - timedelta(days=6)
    daily_logs = db.session.query(
        func.date(MedicationLog.taken_at).label('log_date'),
        func.count(MedicationLog.id).label('log_count')
    ).filter(
        MedicationLog.user_id == elder_id,
        MedicationLog.taken_at >= seven_days_ago
    ).group_by('log_date').all()
    
    # สร้าง Dictionary เพื่อให้ง่ายต่อการ map ข้อมูล
    log_dict = {log.log_date: log.log_count for log in daily_logs}
    
    chart_labels_dt = [(seven_days_ago + timedelta(days=i)) for i in range(7)]
    # TODO: แปลงเป็นชื่อวันภาษาไทยถ้าต้องการ
    chart_labels = [dt.strftime('%a') for dt in chart_labels_dt]
    chart_data = [log_dict.get(dt.isoformat(), 0) for dt in chart_labels_dt]

    # --- 4. การนัดพบแพทย์ถัดไป ---
    next_appointment = Appointment.query.filter(
        Appointment.user_id == elder_id,
        Appointment.appointment_datetime >= datetime.utcnow()
    ).order_by(Appointment.appointment_datetime.asc()).first()
    
    return jsonify({
        "summary_today": { "taken": taken_count, "missed": missed_count },
        "adherence": { "percentage": round(adherence_percentage) },
        "weekly_chart": { "labels": chart_labels, "data": chart_data },
        "next_appointment": {
            "title": next_appointment.title,
            "location": next_appointment.location,
            "doctor": next_appointment.doctor_name,
            "datetime": next_appointment.appointment_datetime.strftime('%d/%m/%y เวลา: %H:%M น.')
        } if next_appointment else None,
        # TODO: เพิ่ม "latest_notifications"
        "latest_notifications": [] 
    }), 200

@stats_bp.route('/osm_monthly_summary', methods=['GET'])
@jwt_required()
def get_osm_monthly_summary():
    current_user_id = get_jwt_identity()
    osm_user = User.query.get(current_user_id)
    
    if not osm_user or osm_user.role != 'osm':
        return jsonify(msg="Permission denied"), 403

    today = date.today()
    current_month = today.month
    current_year = today.year

    # ใช้ผู้สูงอายุที่ดูแลอยู่ (Managed Elders)
    managed_elders = osm_user.managed_elders.all()
    managed_elders_ids = [elder.id for elder in managed_elders]

    if not managed_elders_ids:
        # --- *** จุดที่แก้ไข 1: ส่ง Key ให้ครบถ้วน *** ---
        return jsonify({
            "summary": {"normal": 0, "at_risk": 0, "follow_up": 0},
            "follow_up_elders": [],
            "at_risk_elders": []
        }), 200

    # ดึงข้อมูลสุขภาพเฉพาะของผู้สูงอายุในความดูแล
    records = HealthRecord.query.filter(
        HealthRecord.user_id.in_(managed_elders_ids),
        extract('year', HealthRecord.record_date) == current_year,
        extract('month', HealthRecord.record_date) == current_month
    ).all()

    # --- คำนวณกลุ่มเสี่ยง ---
    SYSTOLIC_HIGH = 140
    DIASTOLIC_HIGH = 90
    risk_counts = defaultdict(int)
    for record in records:
        is_risky = False
        if record.systolic_bp and record.systolic_bp >= SYSTOLIC_HIGH:
            is_risky = True
        if record.diastolic_bp and record.diastolic_bp >= DIASTOLIC_HIGH:
            is_risky = True
        if is_risky:
            risk_counts[record.user_id] += 1

    # --- จัดกลุ่มผู้สูงอายุ ---
    follow_up_ids = {elder_id for elder_id, count in risk_counts.items() if count >= 2}
    at_risk_ids = {elder_id for elder_id, count in risk_counts.items() if count == 1}
    
    follow_up_count = len(follow_up_ids)
    at_risk_count = len(at_risk_ids)
    normal_count = len(managed_elders_ids) - follow_up_count - at_risk_count

    # --- *** จุดที่แก้ไข 2: ดึงข้อมูลของทั้งสองกลุ่ม *** ---
    
    # ดึงข้อมูล "กลุ่มที่ต้องติดตาม" (Follow-up)
    follow_up_elders_info = []
    if follow_up_ids:
        follow_up_users = User.query.filter(User.id.in_(list(follow_up_ids))).all()
        for user in follow_up_users:
            follow_up_elders_info.append({
                "id": user.id,
                "full_name": f"{user.first_name} {user.last_name}",
                "risk_count": risk_counts.get(user.id, 0)
            })

    # ดึงข้อมูล "กลุ่มเสี่ยง" (At-risk)
    at_risk_elders_info = []
    if at_risk_ids:
        at_risk_users = User.query.filter(User.id.in_(list(at_risk_ids))).all()
        for user in at_risk_users:
            at_risk_elders_info.append({
                "id": user.id,
                "full_name": f"{user.first_name} {user.last_name}",
                "risk_count": risk_counts.get(user.id, 0)
            })

    # --- *** จุดที่แก้ไข 3: ส่งข้อมูลกลับใน Format ใหม่ *** ---
    return jsonify({
        "summary": {
            "normal": normal_count,
            "at_risk": at_risk_count,
            "follow_up": follow_up_count
        },
        "follow_up_elders": follow_up_elders_info,
        "at_risk_elders": at_risk_elders_info
    }), 200
