#backend/app/appointments.py
from flask import Blueprint, request, jsonify
from .models import User, Appointment
from .extensions import db, mail
from flask_mail import Message
from flask_jwt_extended import jwt_required, get_jwt_identity
from datetime import datetime
from flask import current_app
from .email_service import send_email


appointments_bp = Blueprint('appointments', __name__, url_prefix='/api/appointments')

# --- Endpoint สำหรับผู้ดูแล (Caregiver) ---

@appointments_bp.route('/add', methods=['POST'])
@jwt_required()
def add_appointment():
    current_user_id = get_jwt_identity()
    caregiver = User.query.get(current_user_id)

    if not caregiver or caregiver.role != 'caregiver':
        return jsonify(msg="Permission denied"), 403

    data = request.json
    elder_id = data.get('elder_id')
    title = data.get('title')
    location = data.get('location')
    appointment_datetime_str = data.get('appointment_datetime') # Format: "YYYY-MM-DD HH:MM"

    if not all([elder_id, title, location, appointment_datetime_str]):
        return jsonify(msg="Missing required fields"), 400

    elder = User.query.filter_by(id=elder_id, role='elder').first()
    if not elder or elder not in caregiver.managed_elders:
        return jsonify(msg="Elder not found or you do not manage this elder"), 404

    try:
        appointment_dt = datetime.strptime(appointment_datetime_str, '%Y-%m-%d %H:%M')
    except ValueError:
        return jsonify(msg="Invalid datetime format. Use YYYY-MM-DD HH:MM"), 400
        
    new_appointment = Appointment(
        user_id=elder.id,
        added_by_id=caregiver.id,
        title=title,
        location=location,
        appointment_datetime=appointment_dt,
        doctor_name=data.get('doctor_name'),
        notes=data.get('notes')
    )
    db.session.add(new_appointment)
    db.session.commit()
    
    return jsonify(msg="Appointment added successfully"), 201

# --- Endpoint สำหรับผู้สูงอายุ ---

@appointments_bp.route('/my_appointments', methods=['GET'])
@jwt_required()
def get_my_appointments():
    current_user_id = get_jwt_identity()
    user = User.query.get(current_user_id)

    if not user or user.role != 'elder':
        return jsonify(msg="Permission denied"), 403

    # ดึงนัดหมายในอนาคตทั้งหมด เรียงตามวันที่ใกล้ที่สุดก่อน
    now = datetime.utcnow()
    appointments = Appointment.query.filter(
        Appointment.user_id == current_user_id,
        Appointment.appointment_datetime >= now
    ).order_by(Appointment.appointment_datetime.asc()).all()

    appointment_list = [
        {
            "id": app.id,
            "title": app.title,
            "location": app.location,
            "datetime": app.appointment_datetime.strftime('%Y-%m-%d %H:%M'),
            "doctor": app.doctor_name,
            "notes": app.notes
        } for app in appointments
    ]
    
    return jsonify(appointments=appointment_list), 200

@appointments_bp.route('/elder/<int:elder_id>', methods=['GET'])
@jwt_required()
def get_appointments_for_elder_by_manager(elder_id):
    current_user_id = get_jwt_identity()
    manager = User.query.get(current_user_id)
    elder = User.query.filter_by(id=elder_id, role='elder').first()

    if not manager or manager.role not in ['caregiver', 'osm']:
        return jsonify(msg="Permission denied."), 403
    
    if not elder or elder not in manager.managed_elders:
        return jsonify(msg="Elder not found or you do not manage this elder."), 404

    now = datetime.utcnow()
    appointments = Appointment.query.filter(
        Appointment.user_id == elder_id,
        Appointment.appointment_datetime >= now
    ).order_by(Appointment.appointment_datetime.asc()).all()

    appointment_list = [
        {
            "id": app.id,
            "title": app.title,
            "location": app.location,
            "datetime": app.appointment_datetime.strftime('%Y-%m-%d %H:%M'),
            "doctor": app.doctor_name,  # <-- เพิ่มบรรทัดนี้
            "notes": app.notes,
            "status": app.status          # <-- เพิ่มบรรทัดนี้ไปด้วยเลย
        } for app in appointments
    ]
    return jsonify(appointments=appointment_list), 200

@appointments_bp.route('/delete/<int:appointment_id>', methods=['DELETE'])
@jwt_required()
def delete_appointment(appointment_id):
    current_user_id = get_jwt_identity()
    manager = User.query.get(current_user_id)
    
    if not manager or manager.role not in ['caregiver', 'osm']:
        return jsonify(msg="Permission denied."), 403

    app_to_delete = Appointment.query.get(appointment_id)
    
    if not app_to_delete:
        return jsonify(msg="Appointment not found."), 404

    elder = User.query.get(app_to_delete.user_id)
    if not elder or elder not in manager.managed_elders:
        return jsonify(msg="You are not authorized to delete this appointment."), 403

    db.session.delete(app_to_delete)
    db.session.commit()
    
    return jsonify(msg="Appointment deleted successfully."), 200

@appointments_bp.route('/update_status/<int:appointment_id>', methods=['POST'])
@jwt_required()
def update_appointment_status(appointment_id):
    current_user_id = get_jwt_identity()
    user = User.query.get(current_user_id)
    
    appointment = Appointment.query.get(appointment_id)

    if not appointment:
        return jsonify(msg="Appointment not found."), 404

    # ตรวจสอบสิทธิ์: เฉพาะเจ้าของนัด หรือผู้ดูแลเท่านั้นที่อัปเดตได้
    if user.id != appointment.user_id and user not in appointment.patient.managers:
        return jsonify(msg="Permission denied."), 403

    data = request.json
    new_status = data.get('status') # เช่น 'confirmed', 'postponed'
    if not new_status in ['confirmed', 'cancelled', 'pending']: # ตรวจสอบค่าที่อนุญาต
        return jsonify(msg="Invalid status value"), 400

    if not new_status:
        return jsonify(msg="Status is required."), 400

    # ในตอนนี้เราจะแค่บันทึกใน 'notes' ก่อน
    # ในอนาคตสามารถเพิ่มคอลัมน์ 'status' ใน Model ได้
    timestamp = datetime.utcnow().strftime('%Y-%m-%d %H:%M')
    appointment.notes = (appointment.notes or "") + f"\n[{timestamp}] Status updated to: {new_status} by {user.role}"
    appointment.status = new_status

    db.session.commit()

    # แจ้งเตือนผู้ดูแล
    if user.role == 'elder':
        for manager in appointment.patient.managers:
            # TODO: สร้าง Notification ใน DB และส่ง FCM
            pass
    
    return jsonify(msg=f"Appointment status updated to '{new_status}'."), 200

@appointments_bp.route('/update/<int:appointment_id>', methods=['POST'])
@jwt_required()
def update_appointment(appointment_id):
    current_user_id = get_jwt_identity()
    manager = User.query.get(current_user_id)
    
    if not manager or manager.role not in ['caregiver', 'osm']:
        return jsonify(msg="Permission denied."), 403

    app_to_update = Appointment.query.get_or_404(appointment_id)
    
    elder = User.query.get(app_to_update.user_id)
    if not elder or elder not in manager.managed_elders:
        return jsonify(msg="You are not authorized to update this appointment."), 403

    data = request.json
    appointment_datetime_str = data.get('appointment_datetime')

    if not all([data.get('title'), data.get('location'), appointment_datetime_str]):
        return jsonify(msg="Missing required fields"), 400

    try:
        new_datetime = datetime.strptime(appointment_datetime_str, '%Y-%m-%d %H:%M')
    except ValueError:
        return jsonify(msg="Invalid datetime format. Use YYYY-MM-DD HH:MM"), 400

    old_datetime_str = app_to_update.appointment_datetime.strftime('%d/%m/%Y เวลา %H:%M น.')

    app_to_update.title = data.get('title')
    app_to_update.location = data.get('location')
    app_to_update.doctor_name = data.get('doctor_name')
    app_to_update.notes = data.get('notes')
    app_to_update.appointment_datetime = new_datetime

    db.session.commit()
    
    # --- *** 3. เปลี่ยน Logic การแจ้งเตือนเป็นการส่งอีเมล *** ---
    elder_name = f"{elder.first_name} {elder.last_name}"
    new_datetime_str = new_datetime.strftime('%d/%m/%Y เวลา %H:%M น.')
    
    # ก. ส่งอีเมลหาผู้ดูแลและ อสม. ทุกคน
    manager_emails = [m.email for m in elder.managers if m.email]
    if manager_emails:
        subject = f"🔄 อัปเดตการนัดหมายของ {elder_name}"
        body = (
            f"การนัดหมายเรื่อง '{app_to_update.title}' ของคุณ {elder_name} มีการเปลี่ยนแปลง:\n\n"
            f"จากเดิม: {old_datetime_str}\n"
            f"เป็น: {new_datetime_str}\n"
            f"สถานที่: {app_to_update.location}"
        )
        send_email(subject, manager_emails, body)
    
    # ข. ส่งอีเมลหาผู้สูงอายุ (ถ้ามี)
    if elder.email:
        subject = f'🔄 อัปเดตการนัดหมาย: {app_to_update.title}'
        body = (
            f"สวัสดีคุณ {elder.first_name},\n\n"
            f"การนัดหมายเรื่อง '{app_to_update.title}' ของคุณมีการเปลี่ยนแปลง\n"
            f"จากเดิมวันที่: {old_datetime_str}\n"
            f"เป็นวันที่ใหม่: {new_datetime_str}\n\n"
            f"สถานที่: {app_to_update.location}"
        )
        send_email(subject, [elder.email], body)

    return jsonify(msg="Appointment updated successfully."), 200

@appointments_bp.route('/details/<int:appointment_id>', methods=['GET'])
@jwt_required()
def get_appointment_details(appointment_id):
    current_user_id = get_jwt_identity()
    manager = User.query.get(current_user_id)
    
    app_details = Appointment.query.get_or_404(appointment_id)
    
    # ตรวจสอบสิทธิ์
    elder = User.query.get(app_details.user_id)
    if not manager or manager.role not in ['caregiver', 'osm'] or elder not in manager.managed_elders:
        return jsonify(msg="Permission denied"), 403

    return jsonify({
        "id": app_details.id,
        "title": app_details.title,
        "location": app_details.location,
        "datetime": app_details.appointment_datetime.strftime('%Y-%m-%d %H:%M'),
        "doctor_name": app_details.doctor_name,
        "notes": app_details.notes
    }), 200