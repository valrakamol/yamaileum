from flask import Blueprint, jsonify
from flask_jwt_extended import verify_jwt_in_request
from .extensions import db
from .models import MedicationLog, User, Appointment, MasterMedicine, Medication
from sqlalchemy import func
from datetime import date, timedelta

# สร้าง Blueprint สำหรับ API ที่ใช้ในหน้า Admin Panel เท่านั้น
admin_api_bp = Blueprint('admin_api', __name__, url_prefix='/api/admin')

def admin_required():
    """
    ฟังก์ชันช่วยสำหรับตรวจสอบสิทธิ์ Admin จาก JWT Cookie
    จะถูกเรียกใช้ในทุก Endpoint ของ Blueprint นี้
    """
    try:
        # ตรวจสอบว่ามี JWT ที่ถูกต้องใน Cookie หรือไม่
        verify_jwt_in_request(locations=['cookies'])
        # (คุณสามารถเพิ่มการตรวจสอบ role == 'admin' ที่นี่ได้อีกชั้นเพื่อความปลอดภัยสูงสุด)
    except Exception as e:
        # ส่งต่อ Exception เพื่อให้ Flask จัดการเป็น 401 Unauthorized
        raise e

@admin_api_bp.route('/stats/medication_adherence')
def medication_adherence_stats():
    """
    คำนวณสถิติการทานยา 7 วันย้อนหลัง
    """
    # --- *** จุดที่แก้ไข *** ---
    # เรียกใช้ฟังก์ชันตรวจสอบสิทธิ์ก่อนทำงาน
    try:
        admin_required()
    except Exception:
        return jsonify(msg="Authentication required"), 401

    today = date.today()
    seven_days_ago = today - timedelta(days=6)

    # Query จำนวนการ log การทานยาในแต่ละวัน
    daily_logs = db.session.query(
        func.date(MedicationLog.taken_at).label('log_date'),
        func.count(MedicationLog.id).label('log_count')
    ).filter(
        MedicationLog.taken_at >= seven_days_ago,
        MedicationLog.status == 'taken'
    ).group_by('log_date').order_by('log_date').all()

    # เตรียมข้อมูลสำหรับกราฟ
    labels = [(seven_days_ago + timedelta(days=i)).strftime('%Y-%m-%d') for i in range(7)]
    data = [0] * 7

    for log in daily_logs:
        # แปลง date object จาก query ให้เป็น string เพื่อเปรียบเทียบ
        log_date_str = log.log_date.isoformat()
        try:
            index = labels.index(log_date_str)
            data[index] = log.log_count
        except ValueError:
            pass

    return jsonify({
        "labels": labels,
        "data": data,
        "title": "จำนวนการยืนยันการทานยา (7 วันย้อนหลัง)"
    })

@admin_api_bp.route('/stats/user_overview')
def user_overview_stats():
    """
    ดึงข้อมูลสรุปภาพรวมจำนวนผู้ใช้ในระบบ
    """
    try:
        admin_required() # ตรวจสอบสิทธิ์ก่อน
    except Exception:
        return jsonify(msg="Authentication required"), 401

    total_users = User.query.count()
    caregiver_count = User.query.filter_by(role='caregiver').count()
    osm_count = User.query.filter_by(role='osm').count()
    elder_count = User.query.filter_by(role='elder').count()
    pending_count = User.query.filter_by(status='pending').count()
    
    return jsonify({
        "total": total_users,
        "caregiver": caregiver_count,
        "osm": osm_count,
        "elder": elder_count,
        "pending": pending_count
    })

@admin_api_bp.route('/stats/medicine_form_distribution')
def medicine_form_stats():
    """
    คำนวณสถิติรูปแบบยา (เม็ด, น้ำ, etc.) ที่ถูกสั่งจ่ายให้ผู้ป่วย
    """
    try:
        admin_required()
    except Exception:
        return jsonify(msg="Authentication required"), 401
    
    # Query เพื่อนับจำนวนยาในแต่ละรูปแบบ (form)
    # เราจะ Join ตาราง Medication กับ MasterMedicine เพื่อเอารูปแบบยามา
    form_counts = db.session.query(
        MasterMedicine.form,
        func.count(Medication.id)
    ).join(
        MasterMedicine, MasterMedicine.name == Medication.name
    ).group_by(MasterMedicine.form).order_by(func.count(Medication.id).desc()).all()

    labels = [item[0] if item[0] else 'ไม่ระบุ' for item in form_counts]
    data = [item[1] for item in form_counts]

    return jsonify({
        "labels": labels,
        "data": data,
        "title": "สัดส่วนรูปแบบยาที่สั่งจ่าย"
    })


# --- *** 2. API ใหม่สำหรับกราฟแท่ง: จำนวนการนัดหมายในแต่ละเดือน *** ---
@admin_api_bp.route('/stats/appointments_per_month')
def appointments_per_month_stats():
    """
    คำนวณจำนวนการนัดหมายทั้งหมดในแต่ละเดือนของปีปัจจุบัน
    """
    try:
        admin_required()
    except Exception:
        return jsonify(msg="Authentication required"), 401
    
    current_year = date.today().year
    
    # Query เพื่อนับจำนวนนัดหมายในแต่ละเดือนของปีปัจจุบัน
    monthly_counts = db.session.query(
        func.strftime('%m', Appointment.appointment_datetime).label('month'),
        func.count(Appointment.id).label('count')
    ).filter(
        func.strftime('%Y', Appointment.appointment_datetime) == str(current_year)
    ).group_by('month').order_by('month').all()
    
    # เตรียมข้อมูลสำหรับกราฟ
    # สร้าง list 12 เดือน (0-11)
    labels = ["ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.", "ก.ค.", "ส.ค.", "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค."]
    data = [0] * 12

    for item in monthly_counts:
        # เดือนที่ได้จาก query จะเป็น string '01', '02', ...
        # เราต้องแปลงเป็น index ของ list (0-11)
        month_index = int(item.month) - 1
        if 0 <= month_index < 12:
            data[month_index] = item.count

    return jsonify({
        "labels": labels,
        "data": data,
        "title": f"จำนวนการนัดหมายรายเดือน (ปี {current_year + 543})"
    })