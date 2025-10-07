#backend/app/models.py
from .extensions import db
from werkzeug.security import generate_password_hash, check_password_hash
from datetime import datetime

manager_elder_link = db.Table('manager_elder_link',
    db.Column('manager_id', db.Integer, db.ForeignKey('user.id'), primary_key=True),
    db.Column('elder_id', db.Integer, db.ForeignKey('user.id'), primary_key=True)
)

class User(db.Model):
    __tablename__ = 'user'
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=True)
    password_hash = db.Column(db.String(256), nullable=False)
    first_name = db.Column(db.String(100), nullable=False)
    last_name = db.Column(db.String(100), nullable=False)
    role = db.Column(db.String(20), nullable=False)
    status = db.Column(db.String(20), nullable=False, default='pending')
    fcm_token = db.Column(db.String(255), nullable=True, unique=True)
    avatar_url = db.Column(db.String(255), nullable=True)
    managed_elders = db.relationship('User', secondary=manager_elder_link, primaryjoin=(manager_elder_link.c.manager_id == id), secondaryjoin=(manager_elder_link.c.elder_id == id), backref=db.backref('managers', lazy='dynamic'), lazy='dynamic')
    appointments = db.relationship('Appointment', foreign_keys='Appointment.user_id', lazy='dynamic', cascade="all, delete-orphan")
    
    def set_password(self, password):
        self.password_hash = generate_password_hash(password)

    def check_password(self, password):
        return check_password_hash(self.password_hash, password)
    
    def __str__(self):
        # ให้แสดงผลเป็น username (หรือ full_name ก็ได้ถ้าต้องการ)
        return self.username

class Medication(db.Model):
    __tablename__ = 'medication'
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    added_by_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    name = db.Column(db.String(100), nullable=False)
    dosage = db.Column(db.String(100), nullable=True)
    meal_instruction = db.Column(db.String(100), nullable=True)
    time_to_take = db.Column(db.String(100), nullable=False)
    start_date = db.Column(db.Date, nullable=False)
    end_date = db.Column(db.Date, nullable=True)
    image_url = db.Column(db.String(255), nullable=True)
    patient = db.relationship('User', backref=db.backref('medications', cascade="all, delete-orphan"), foreign_keys=[user_id])
    logs = db.relationship('MedicationLog', backref='medication_info', lazy='dynamic', cascade="all, delete-orphan")

class MasterMedicine(db.Model):
    __tablename__ = 'master_medicine'
    id = db.Column(db.Integer, primary_key=True)
    # เก็บชื่อยาที่ไม่ซ้ำกัน
    name = db.Column(db.String(150), unique=True, nullable=False)
    # เก็บรูปแบบยา เช่น "เม็ด", "น้ำ", "แคปซูล"
    form = db.Column(db.String(50), nullable=True)
    description = db.Column(db.Text, nullable=True)

    def __repr__(self):
        return f'<MasterMedicine {self.name}>'

class MedicationLog(db.Model):
    __tablename__ = 'medication_log'
    id = db.Column(db.Integer, primary_key=True)
    medication_id = db.Column(db.Integer, db.ForeignKey('medication.id'), nullable=False)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    taken_at = db.Column(db.DateTime, default=datetime.utcnow)
    status = db.Column(db.String(20), default='taken', nullable=False)

    # --- *** เพิ่ม relationship นี้เข้าไป *** ---
    # สร้าง relationship ชื่อ "patient" กลับไปยัง User ที่เป็นเจ้าของ log นี้
    patient = db.relationship('User', foreign_keys=[user_id])
class HealthRecord(db.Model):
    __tablename__ = 'health_record'
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    recorded_by_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    patient = db.relationship('User',backref=db.backref('health_records', cascade="all, delete-orphan"), foreign_keys=[user_id])
    record_date = db.Column(db.DateTime, default=datetime.utcnow)
    systolic_bp = db.Column(db.Integer)
    diastolic_bp = db.Column(db.Integer)
    weight = db.Column(db.Float)
    pulse = db.Column(db.Integer)
    notes = db.Column(db.Text, nullable=True)

class Notification(db.Model):
    __tablename__ = 'notification'
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    message = db.Column(db.String(255), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    is_read = db.Column(db.Boolean, default=False)
    link_to = db.Column(db.String(255), nullable=True)

    # เพิ่ม cascade="all, delete-orphan" เข้าไปใน backref
    recipient = db.relationship(
        'User', 
        backref=db.backref('notifications', cascade="all, delete-orphan"), 
        foreign_keys=[user_id]
    )

class Appointment(db.Model):
    __tablename__ = 'appointment'
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    added_by_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    title = db.Column(db.String(150), nullable=False)
    doctor_name = db.Column(db.String(100), nullable=True)
    location = db.Column(db.String(200), nullable=False)
    appointment_datetime = db.Column(db.DateTime, nullable=False)
    notes = db.Column(db.Text, nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    status = db.Column(db.String(20), nullable=False, default='pending') 
    patient = db.relationship('User', backref=db.backref('appointments_backref', cascade="all, delete-orphan"), foreign_keys=[user_id])

class MasterData(db.Model):
    __tablename__ = 'master_data'
    id = db.Column(db.Integer, primary_key=True)
    # ประเภทของข้อมูล: 'medicine_name', 'disease_name', etc.
    category = db.Column(db.String(50), nullable=False) 
    # ค่าของข้อมูล
    value = db.Column(db.String(255), nullable=False)
    # ข้อมูลเพิ่มเติม (เก็บเป็น JSON)
    details = db.Column(db.Text, nullable=True) 
    is_active = db.Column(db.Boolean, default=True)

class SystemSetting(db.Model):
    __tablename__ = 'system_setting'
    # ใช้ key เป็น Primary Key เพื่อให้มีแค่ค่าเดียว
    key = db.Column(db.String(50), primary_key=True) 
    value = db.Column(db.Text, nullable=False)
    description = db.Column(db.String(255), nullable=True)