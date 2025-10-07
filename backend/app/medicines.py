#backend/app/medicines.py
import os
import time
from werkzeug.utils import secure_filename
from flask import current_app
from flask import Blueprint, request, jsonify
from .models import User, Medication, MedicationLog, MasterMedicine
from .extensions import db
from flask_jwt_extended import jwt_required, get_jwt_identity
from datetime import datetime, date
from firebase_admin import db as firebase_db


medicines_bp = Blueprint('medicines', __name__, url_prefix='/api/medicines')

UPLOAD_FOLDER = 'uploads/medicines' 
ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg'}

def allowed_file(filename):
    return '.' in filename and \
           filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

# -----------------------------------------------------------------------------
# Endpoint สำหรับผู้ดูแล (Caregiver) เพื่อเพิ่มยาให้ผู้สูงอายุ
# -----------------------------------------------------------------------------
@medicines_bp.route('/add', methods=['POST'])
@jwt_required()
def add_medication():
    current_user_id = get_jwt_identity()
    caregiver = User.query.get(current_user_id)

    if not caregiver or caregiver.role != 'caregiver':
        return jsonify(msg="การอนุญาตถูกปฏิเสธ"), 403

    data = request.json
    elder_id = data.get('elder_id')
    
    if not elder_id:
        return jsonify(msg="จำเป็นต้องระบุรหัสผู้สูงอายุ (Elder ID)"), 400

    elder = User.query.filter_by(id=elder_id, role='elder').first()
    if not elder:
        return jsonify(msg=f"ไม่พบผู้สูงอายุที่มีรหัส {elder_id}"), 404

    if elder not in caregiver.managed_elders:
        return jsonify(msg=f"คุณไม่ได้รับสิทธิ์ในการจัดการผู้สูงอายุรหัส {elder_id}"), 403
    
    # --- *** ส่วนที่แก้ไขทั้งหมด *** ---

    name = data.get('name')
    times_list = data.get('times_to_take') 
    start_date_str = data.get('start_date')
    
    if not all([name, times_list, start_date_str]):
        return jsonify(msg="ขาดข้อมูลที่จำเป็น (ชื่อยา, เวลา, วันที่เริ่มต้น)"), 400

    try:
        start_date_obj = datetime.strptime(start_date_str, '%Y-%m-%d').date()
        end_date_str = data.get('end_date')
        end_date_obj = datetime.strptime(end_date_str, '%Y-%m-%d').date() if end_date_str else None
    except ValueError:
        return jsonify(msg="รูปแบบวันที่ไม่ถูกต้อง (ต้องการ YYYY-MM-DD)"), 400

    # วน Loop สร้างยาใหม่สำหรับ **แต่ละเวลาที่เลือก**
    for time_str in times_list:
        # ตรวจสอบ Format ของเวลา "HH:MM"
        try:
            datetime.strptime(time_str, '%H:%M')
        except ValueError:
            print(f"Invalid time format skipped: {time_str}")
            continue

        # สร้าง Object Medication สำหรับเวลานั้นๆ
        new_med = Medication(
            user_id=elder.id, 
            added_by_id=caregiver.id, 
            name=name,
            # --- *** จุดที่แก้ไขสำคัญ *** ---
            # บันทึกเป็น String "HH:MM" ลงฐานข้อมูลโดยตรง ตาม Model ที่แก้ไขแล้ว
            time_to_take=time_str,
            # ---------------------------
            dosage=data.get('dosage'),
            meal_instruction=data.get('meal_instruction'),
            start_date=start_date_obj, 
            end_date=end_date_obj,
            image_url=data.get('image_url')
        )
        db.session.add(new_med)
    
    db.session.commit()
    
    return jsonify(msg=f"เพิ่มยา '{name}' สำเร็จแล้ว"), 201

# -----------------------------------------------------------------------------
# Endpoint สำหรับผู้สูงอายุเพื่อดึงรายการยาของ "ตัวเอง"
# -----------------------------------------------------------------------------
@medicines_bp.route('/my_medications', methods=['GET'])
@jwt_required()
def get_my_medications():
    current_user_id = get_jwt_identity()
    user = User.query.get(current_user_id)

    if not user or user.role != 'elder':
        return jsonify(msg="สิทธิ์ในการดูข้อมูลยาเป็นของผู้สูงอายุแต่ละคนเท่านั้น"), 403

    meds = Medication.query.filter_by(user_id=current_user_id).order_by(Medication.time_to_take).all()
    today = date.today()
    med_list = []
    for med in meds:
        if med.start_date <= today and (med.end_date is None or med.end_date >= today):
            # ตรวจสอบว่ามียาตัวนี้ถูก log ไว้ใน "วันนี้" หรือไม่
            log_today = MedicationLog.query.filter(
                MedicationLog.medication_id == med.id,
                db.func.date(MedicationLog.taken_at) == today
            ).first()
            
            med_list.append({
                'id': med.id, 
                'name': med.name, 
                # --- *** จุดที่แก้ไข *** ---
                'time_to_take': med.time_to_take,  # เอา .strftime('%H:%M') ออก
                # -------------------------
                'is_taken_today': log_today is not None,
                'dosage': med.dosage,
                'meal_instruction': med.meal_instruction,
                'image_url': med.image_url
            })
            
    return jsonify(medications=med_list), 200

# -----------------------------------------------------------------------------
# Endpoint สำหรับผู้ดูแล/อสม. เพื่อดึงรายการยาของผู้สูงอายุที่ตนดูแล
# -----------------------------------------------------------------------------
@medicines_bp.route('/elder/<int:elder_id>', methods=['GET'])
@jwt_required()
def get_medicines_for_elder_by_manager(elder_id):
    current_user_id = get_jwt_identity()
    manager = User.query.get(current_user_id)
    elder = User.query.filter_by(id=elder_id, role='elder').first()

    if not manager or manager.role not in ['caregiver', 'osm']:
        return jsonify(msg="Permission denied."), 403
    
    if not elder or elder not in manager.managed_elders:
        return jsonify(msg="Elder not found or you do not manage this elder."), 404

    meds = Medication.query.filter_by(user_id=elder_id).order_by(Medication.time_to_take).all()
    today = date.today()
    
    med_list = []
    for med in meds:
        # --- *** 1. เพิ่ม Logic การตรวจสอบสถานะ *** ---
        # ตรวจสอบว่ามียาตัวนี้ถูก log ไว้ใน "วันนี้" หรือไม่
        log_today = MedicationLog.query.filter(
            MedicationLog.medication_id == med.id,
            db.func.date(MedicationLog.taken_at) == today
        ).first()

        med_list.append({
            'id': med.id,
            'name': med.name,
            'dosage': med.dosage,
            'meal_instruction': med.meal_instruction,
            'time_to_take': med.time_to_take,
            'start_date': med.start_date.isoformat(),
            'end_date': med.end_date.isoformat() if med.end_date else None,
            'image_url': med.image_url,
            'is_taken_today': log_today is not None # <-- 2. ส่งสถานะไปด้วย
        })

    return jsonify(medicines=med_list), 200

# -----------------------------------------------------------------------------
# Endpoint ลบยา
# -----------------------------------------------------------------------------
@medicines_bp.route('/delete/<int:medication_id>', methods=['DELETE'])
@jwt_required()
def delete_medication(medication_id):
    current_user_id = get_jwt_identity()
    manager = User.query.get(current_user_id)
    
    if not manager or manager.role not in ['caregiver', 'osm']:
        return jsonify(msg="Permission denied."), 403

    # ค้นหายาที่ต้องการลบ
    med_to_delete = Medication.query.get(medication_id)
    
    if not med_to_delete:
        return jsonify(msg="Medication not found."), 404

    # ตรวจสอบสิทธิ์: manager ต้องเป็นคนดูแลผู้สูงอายุที่เป็นเจ้าของยานี้
    elder = User.query.get(med_to_delete.user_id)
    if not elder or elder not in manager.managed_elders:
        return jsonify(msg="You are not authorized to delete this medication."), 403

    # ทำการลบข้อมูล
    db.session.delete(med_to_delete)
    db.session.commit()
    
    return jsonify(msg="Medication deleted successfully."), 200

# -----------------------------------------------------------------------------
# Endpoint สำหรับผู้สูงอายุเพื่อบันทึกการทานยา
# -----------------------------------------------------------------------------
@medicines_bp.route('/log/take', methods=['POST'])
@jwt_required()
def log_medication_taken():
    current_user_id = get_jwt_identity()
    user = User.query.get(current_user_id)

    if not user or user.role != 'elder':
        return jsonify(msg="สิทธิ์ในการบันทึกการทานยามีเฉพาะผู้สูงอายุเท่านั้น"), 403

    data = request.json
    medication_id = data.get('medication_id')
    med_to_log = Medication.query.filter_by(id=medication_id, user_id=current_user_id).first()
    if not med_to_log:
        return jsonify(msg="ไม่พบรายการยาดังกล่าว"), 404

    log = MedicationLog(medication_id=medication_id, user_id=current_user_id, status='taken')
    db.session.add(log)
    db.session.commit()

    try:
        today_str = date.today().isoformat()
        ref = firebase_db.reference(f'med_status/{log.user_id}/{today_str}/{log.medication_id}')
        ref.set({'taken': True, 'name': med_to_log.name, 'time': med_to_log.time_to_take.strftime('%H:%M'), 'timestamp': datetime.utcnow().isoformat()})
    except Exception as e:
        print(f"เกิดข้อผิดพลาดในการบันทึกข้อมูลไปยัง Firebase RTDB: {e}")

    return jsonify(msg=f"การรับประทานยา '{med_to_log.name}' ได้ถูกบันทึกแล้ว"), 200

# -----------------------------------------------------------------------------
# Endpoint สำหรับผู้ดูแล/อสม. เพื่อดูประวัติการทานยาของผู้สูงอายุ
# -----------------------------------------------------------------------------
@medicines_bp.route('/logs/elder/<int:elder_id>', methods=['GET'])
@jwt_required()
def get_medication_logs_for_elder(elder_id):
    current_user_id = get_jwt_identity()
    viewer = User.query.get(current_user_id)
    elder = User.query.filter_by(id=elder_id, role='elder').first()

    if not elder or elder not in viewer.managed_elders:
        return jsonify(msg="ไม่พบข้อมูลผู้สูงอายุ หรือคุณไม่ได้รับอนุญาตให้เข้าถึงข้อมูลนี้"), 404

    logs = db.session.query(MedicationLog, Medication).join(Medication, MedicationLog.medication_id == Medication.id).filter(MedicationLog.user_id == elder_id).order_by(MedicationLog.taken_at.desc()).limit(50).all()
    log_list = [{'log_id': log.id, 'medication_name': med.name, 'status': log.status, 'logged_at': log.taken_at.strftime('%Y-%m-%d %H:%M:%S')} for log, med in logs]
    return jsonify(logs=log_list), 200

@medicines_bp.route('/upload_image', methods=['POST'])
@jwt_required()
def upload_medicine_image():
    if 'file' not in request.files:
        return jsonify(msg="No file part"), 400
    file = request.files['file']
    if file.filename == '':
        return jsonify(msg="No selected file"), 400

    if file and allowed_file(file.filename):
        # สร้างชื่อไฟล์ที่ไม่ซ้ำกัน
        filename = secure_filename(file.filename)
        unique_filename = f"{get_jwt_identity()}_{int(time.time())}_{filename}"
        
        # สร้าง Path เต็มและตรวจสอบว่ามีโฟลเดอร์อยู่
        upload_path = os.path.join(current_app.root_path, '..', UPLOAD_FOLDER)
        os.makedirs(upload_path, exist_ok=True)
        
        # บันทึกไฟล์
        file.save(os.path.join(upload_path, unique_filename))

        # สร้าง URL ที่จะส่งกลับไปให้ Frontend
        # เราจะสร้าง Endpoint /uploads/<filename> เพื่อให้เข้าถึงไฟล์ได้
        file_url = f'/{UPLOAD_FOLDER}/{unique_filename}'
        
        return jsonify(image_url=file_url), 200
    
    return jsonify(msg="File type not allowed"), 400