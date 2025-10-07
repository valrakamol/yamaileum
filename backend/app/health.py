# backend/app/health.py
from flask import Blueprint, request, jsonify
from .models import User, HealthRecord, Notification
from .extensions import db
from flask_jwt_extended import jwt_required, get_jwt, get_jwt_identity
from datetime import datetime
from calendar import monthrange

# Import ฟังก์ชันส่งอีเมล
from .email_service import send_email

health_bp = Blueprint('health', __name__, url_prefix='/api/health')


# -----------------------------------------------------------------------------
# Endpoint สำหรับ อสม. เพื่อบันทึกข้อมูลสุขภาพของผู้สูงอายุ
# -----------------------------------------------------------------------------
@health_bp.route('/record/add', methods=['POST'])
@jwt_required()
def add_health_record():
    current_user_id = get_jwt_identity()
    claims = get_jwt()
    
    if claims.get('role') != 'osm':
        return jsonify(msg="สิทธิ์ไม่เพียงพอ: เฉพาะ อสม. เท่านั้นที่สามารถบันทึกข้อมูลได้"), 403

    # --- *** จุดที่แก้ไข: ประกาศ data ก่อนเรียกใช้ *** ---
    data = request.json
    elder_id = data.get('elder_id')
    
    if not elder_id:
        return jsonify(msg="กรุณาระบุรหัสผู้สูงอายุ"), 400

    osm_user = User.query.get(current_user_id)
    elder = User.query.filter_by(id=elder_id, role='elder').first()

    # ตรวจสอบว่า osm_user และ elder มีตัวตนในระบบหรือไม่
    if not osm_user or not elder:
        return jsonify(msg="ไม่พบผู้ใช้ อสม. หรือผู้สูงอายุรายนี้"), 404
    
    new_record = HealthRecord(
        systolic_bp=data.get('systolic_bp'),
        diastolic_bp=data.get('diastolic_bp'),
        weight=data.get('weight'),
        pulse=data.get('pulse'),
        notes=data.get('notes'),
        user_id=elder.id,
        recorded_by_id=osm_user.id
    )
    db.session.add(new_record)

    # --- Logic การตรวจสอบและแจ้งเตือนค่าผิดปกติ ---
    alerts = []
    SYSTOLIC_HIGH = 140
    DIASTOLIC_HIGH = 90
    PULSE_LOW = 50
    PULSE_HIGH = 100

    if new_record.systolic_bp and new_record.systolic_bp >= SYSTOLIC_HIGH:
        alerts.append(f"ความดันตัวบนสูงผิดปกติ ({new_record.systolic_bp})")
    if new_record.diastolic_bp and new_record.diastolic_bp >= DIASTOLIC_HIGH:
        alerts.append(f"ความดันตัวล่างสูงผิดปกติ ({new_record.diastolic_bp})")
    if new_record.pulse:
        if new_record.pulse <= PULSE_LOW:
            alerts.append(f"ชีพจรต่ำผิดปกติ ({new_record.pulse})")
        elif new_record.pulse >= PULSE_HIGH:
            alerts.append(f"ชีพจรสูงผิดปกติ ({new_record.pulse})")

    # ถ้ามีค่าผิดปกติ ให้ส่งอีเมลแจ้งเตือน
    if alerts:
        elder_name = f"{elder.first_name} {elder.last_name}"
        alert_details = "\n".join([f"- {a}" for a in alerts])

        # ก. ส่งอีเมลหาผู้ดูแลและ อสม. ทุกคน
        manager_emails = [manager.email for manager in elder.managers if manager.email]
        if manager_emails:
            subject = f"🚨 แจ้งเตือนสุขภาพผิดปกติ: {elder_name}"
            body = (
                f"ตรวจพบค่าสุขภาพที่อาจผิดปกติของคุณ {elder_name} ที่บันทึกเมื่อ {datetime.now().strftime('%d/%m/%Y %H:%M')}:\n\n"
                f"{alert_details}\n\n"
                f"กรุณาตรวจสอบและให้คำแนะนำเพิ่มเติม"
            )
            send_email(subject, manager_emails, body)

        # ข. ส่งอีเมลหาผู้สูงอายุ (ถ้ามีอีเมล)
        if elder.email:
            subject = f"🚨 แจ้งเตือนค่าสุขภาพของคุณ"
            body = (
                f"สวัสดีคุณ {elder.first_name},\n\n"
                f"จากการบันทึกข้อมูลสุขภาพล่าสุด พบว่าท่านมีค่าบางอย่างที่ควรให้ความสนใจเป็นพิเศษ:\n\n"
                f"{alert_details}\n\n"
                f"แนะนำให้พักผ่อนและปรึกษาผู้ดูแลหรือแพทย์หากมีอาการผิดปกติค่ะ"
            )
            send_email(subject, [elder.email], body)

        # (สร้าง Notification log ในระบบ)
        alert_message_log = f"แจ้งเตือนสุขภาพ ({elder_name}): {', '.join(alerts)}"
        for manager in elder.managers:
            notif = Notification(user_id=manager.id, message=alert_message_log)
            db.session.add(notif)
            
    db.session.commit()

    return jsonify(msg="เพิ่มข้อมูลสุขภาพสำเร็จแล้ว"), 201

# -----------------------------------------------------------------------------
# Endpoint สำหรับผู้ดูแล/อสม. เพื่อดึงประวัติข้อมูลสุขภาพ
# -----------------------------------------------------------------------------
@health_bp.route('/records/elder/<int:elder_id>', methods=['GET'])
@jwt_required()
def get_health_records_for_elder(elder_id):
    current_user_id = get_jwt_identity()
    claims = get_jwt()
    
    if claims.get('role') not in ['caregiver', 'osm', 'elder']:
        return jsonify(msg="สิทธิ์ไม่เพียงพอ"), 403

    viewer = User.query.get(current_user_id)
    elder_to_view = User.query.filter_by(id=elder_id, role='elder').first()
    
    if claims.get('role') == 'elder':
        if elder_id != current_user_id:
            return jsonify(msg="ไม่ได้รับอนุญาตให้เข้าถึงข้อมูลสุขภาพของผู้อื่น"), 403
    elif claims.get('role') == 'caregiver':
        if not viewer or not elder_to_view or elder_to_view not in viewer.managed_elders:
            return jsonify(msg="ไม่ได้รับอนุญาตให้เข้าถึงข้อมูลสุขภาพของผู้สูงอายุรายนี้"), 403
    # ถ้าเป็น 'osm' จะสามารถเข้าถึงได้ทุกคน (ตาม Logic ที่แก้ไขไปก่อนหน้า)

    month = request.args.get('month', type=int)
    year = request.args.get('year', type=int)

    query = HealthRecord.query.filter_by(user_id=elder_id)
    if month and year:
        start_date = datetime(year, month, 1)
        end_day = monthrange(year, month)[1]
        end_date = datetime(year, month, end_day, 23, 59, 59)
        query = query.filter(HealthRecord.record_date >= start_date, HealthRecord.record_date <= end_date)

    records = query.order_by(HealthRecord.record_date.desc()).all()
    result = [
        {
            'id': rec.id, 
            'systolic_bp': rec.systolic_bp, 
            'diastolic_bp': rec.diastolic_bp, 
            'weight': rec.weight, 
            'pulse': rec.pulse,
            'notes': rec.notes, 
            'recorded_at': rec.record_date.strftime('%Y-%m-%d %H:%M')
        } for rec in records
    ]
    return jsonify(records=result), 200