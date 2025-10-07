# backend/app/admin_views.py
from flask_admin.contrib.sqla import ModelView
from flask_admin import BaseView, expose
from flask import redirect, url_for, request, flash
from flask_jwt_extended import get_jwt_identity, verify_jwt_in_request
from flask_wtf import FlaskForm
from wtforms import StringField, TextAreaField, SelectField, PasswordField
from wtforms.validators import DataRequired, Optional
from .extensions import db
from .email_service import send_email
import wtforms

# -----------------------------------------------------------------------------
# Base View สำหรับ Admin (มีระบบตรวจสอบสิทธิ์ และ ปิด CSRF)
# -----------------------------------------------------------------------------
class ProtectedAdminView(ModelView):
    # ปิดการป้องกัน CSRF โดยการใช้ FlaskForm พื้นฐาน
    form_base_class = FlaskForm

    def is_accessible(self):
        """ตรวจสอบสิทธิ์ Admin โดยใช้ JWT Cookie"""
        try:
            # ตรวจสอบว่ามี JWT ใน cookie หรือไม่
            verify_jwt_in_request(locations=['cookies'])
            current_user_id = get_jwt_identity()
            # Import model ภายในฟังก์ชันเพื่อป้องกัน Circular Import
            from .models import User
            user = User.query.get(current_user_id)
            return user.role == 'admin'
        except Exception:
            return False

    def inaccessible_callback(self, name, **kwargs):
        """ถ้าไม่มีสิทธิ์ ให้ Redirect ไปหน้า Login ของ Admin"""
        return redirect(url_for('admin_auth.admin_login', next=request.url))
# -----------------------------------------------------------------------------
# Custom Form สำหรับ MasterMedicine
# -----------------------------------------------------------------------------

class MasterMedicineForm(FlaskForm):
    name = StringField('Name', validators=[DataRequired(message="กรุณากรอกชื่อยา")])
    form = SelectField(
        'Form',
        choices=[
            ('เม็ด', 'เม็ด'),
            ('แคปซูล', 'แคปซูล'),
            ('ช้อนชา', 'ช้อนชา'),
            ('ช้อนโต๊ะ', 'ช้อนโต๊ะ'),
            ('มิลลิกรัม', 'มิลลิกรัม'),
            ('cc', 'cc'),
            ('ผง', 'ผง')
        ],
        validators=[DataRequired(message="กรุณาเลือกรูปแบบยา")]
    )
    description = TextAreaField('Description')

class UserForm(FlaskForm):
    username = StringField('Username', validators=[DataRequired()])
    email = StringField('Email', validators=[DataRequired()])
    first_name = StringField('First Name', validators=[DataRequired()])
    last_name = StringField('Last Name', validators=[DataRequired()])
    role = SelectField('Role', choices=[
        ('admin', 'Admin'), ('caregiver', 'Caregiver'),
        ('osm', 'OSM'), ('elder', 'Elder')
    ], validators=[DataRequired()])
    status = SelectField('Status', choices=[
        ('active', 'Active'), ('pending', 'Pending')
    ], validators=[DataRequired()])
    password_new = PasswordField('New Password', validators=[Optional()])

# -----------------------------------------------------------------------------
# View สำหรับจัดการ "User" โดยเฉพาะ
# -----------------------------------------------------------------------------
class UserAdminView(ProtectedAdminView):
    # (column_list, searchable, filters เหมือนเดิม)
    column_list = ('id', 'username', 'email', 'first_name', 'last_name', 'role', 'status')
    column_searchable_list = ('username', 'first_name', 'last_name', 'email')
    column_filters = ('role', 'status')
    form = UserForm
    
    column_searchable_list = ('username', 'first_name', 'last_name', 'email')
    column_filters = ('role', 'status')
    form = UserForm

    # 3. override on_model_change ให้ไม่มีการจัดการไฟล์
    def on_model_change(self, form, model, is_created):
        # --- 1. ตรวจสอบว่านี่เป็นการ Edit (ไม่ใช่ Create) ---
        if not is_created:
            # --- 2. ตรวจสอบการเปลี่ยนแปลงของ 'status' ---
            # `model._sa_instance_state.committed_state` จะเก็บค่าของ object ก่อนที่จะถูกแก้ไข
            old_status = model._sa_instance_state.committed_state.get('status', None)
            new_status = form.status.data

            # --- 3. Logic การส่งอีเมล (เหมือนเดิม) ---
            if (old_status == 'pending' and new_status == 'active' and model.role == 'osm'):
                if model.email:
                    try:
                        subject = "✅ บัญชี อสม. ของคุณได้รับการอนุมัติแล้ว"
                        body = (
                            f"สวัสดีคุณ {model.first_name},\n\n"
                            f"บัญชี อสม. ของคุณในแอปพลิเคชัน 'ยาไม่ลืม' ได้รับการอนุมัติเรียบร้อยแล้ว\n"
                            f"ตอนนี้คุณสามารถเข้าสู่ระบบเพื่อเริ่มใช้งานได้ทันที"
                        )
                        send_email(subject, [model.email], body)
                        flash(f"ส่งอีเมลแจ้งเตือนการอนุมัติไปยัง {model.username} เรียบร้อยแล้ว", 'success')
                    except Exception as e:
                        flash(f"ไม่สามารถส่งอีเมลแจ้งเตือนได้: {e}", 'error')
        
        # --- 4. จัดการรหัสผ่าน (เหมือนเดิม) ---
        if form.password_new.data:
            model.set_password(form.password_new.data)
        elif is_created and not form.password_new.data:
            raise wtforms.validators.ValidationError('Password is required for new users.')
            
    # 4. (ทางเลือก) ทำให้ฟอร์ม Edit ง่ายขึ้น
    def edit_form(self, obj):
        form = super(UserAdminView, self).edit_form(obj)
        form.username.render_kw = {'readonly': True}
        return form

# -----------------------------------------------------------------------------
# View สำหรับ Model อื่นๆ ที่ต้องการการปรับแต่งเล็กน้อย
# -----------------------------------------------------------------------------
class MedicationLogAdminView(ProtectedAdminView):
    column_list = ('id', 'patient.username', 'medication_info.name', 'status', 'taken_at')
    column_filters = ('status',)
    column_searchable_list = ('patient.username', 'medication_info.name')
    can_create = False
    can_edit = False

class NotificationAdminView(ProtectedAdminView):
    column_list = ('id', 'recipient.username', 'message', 'is_read', 'created_at')
    column_filters = ('is_read',)
    column_searchable_list = ('recipient.username', 'message')
    can_create = False
    can_edit = False
    
class SystemSettingAdminView(ProtectedAdminView):
    541
    can_delete = False
    column_list = ('key', 'value', 'description')
    
    # --- *** แก้ไข: เปลี่ยนเป็น List เพื่อความปลอดภัย *** ---
    form_columns = ['value']
    
    form_widget_args = { 
        'key': {'readonly': True}, 
        'description': {'readonly': True} 
    }
    def get_form(self):
        form = super().get_form()
        # ทำให้ฟิลด์ description เป็น TextAreaField
        form.description = TextAreaField('Description')
        return form
# -----------------------------------------------------------------------------
# View สำหรับจัดการ "Medication" โดยเฉพาะ
# -----------------------------------------------------------------------------
class MedicationAdminView(ProtectedAdminView):
    # กำหนดคอลัมน์ที่จะแสดงในหน้า List (เอา image_url ออก)
    column_list = [
        'name',
        'patient', # แสดงชื่อผู้ป่วย
        'dosage',
        'meal_instruction',
        'time_to_take',
        'start_date',
        'end_date'
    ]
    
    # ทำให้สามารถค้นหาตามชื่อยาและชื่อผู้ป่วยได้
    column_searchable_list = ('name', 'patient.username')
    
    # เพิ่ม Filter ตามผู้ป่วย
    column_filters = ('patient',)

    can_create = False
    can_edit = False

# -----------------------------------------------------------------------------
# View สำหรับจัดการ "Appointment" โดยเฉพาะ
# -----------------------------------------------------------------------------
class AppointmentAdminView(ProtectedAdminView):
    # --- *** จุดแก้ไขสำคัญ *** ---
    # เพิ่ม 'patient.username' เพื่อแสดงชื่อผู้ใช้ของผู้สูงอายุ
    column_list = ('id', 'patient.username', 'title', 'location', 'appointment_datetime')
    
    # ทำให้สามารถค้นหาจากชื่อผู้ใช้และหัวข้อได้
    column_searchable_list = ('patient.username', 'title', 'location')
    
    # เพิ่ม Filter ด้านข้างสำหรับค้นหาตามผู้ป่วย
    column_filters = ('patient',)

    can_create = False
    can_edit = False

# -----------------------------------------------------------------------------
# View สำหรับจัดการ "HealthRecord" โดยเฉพาะ
# -----------------------------------------------------------------------------
class HealthRecordAdminView(ProtectedAdminView):
    # --- *** จุดแก้ไขสำคัญ *** ---
    # เพิ่ม 'patient.username' เพื่อแสดงชื่อผู้ใช้ของผู้สูงอายุ
    column_list = ('id', 'patient.username', 'record_date', 'systolic_bp', 'diastolic_bp', 'weight', 'pulse')
    
    # ทำให้สามารถค้นหาจากชื่อผู้ใช้ได้
    column_searchable_list = ('patient.username',)
    
    # เพิ่ม Filter ด้านข้างสำหรับค้นหาตามผู้ป่วย
    column_filters = ('patient',)

    # เราไม่ต้องการให้แอดมินสร้าง/แก้ไขข้อมูลสุขภาพโดยตรงจากหน้านี้
    can_create = False
    can_edit = False

# -----------------------------------------------------------------------------
# View แบบ Custom ที่ไม่ผูกกับ Model โดยตรง
# -----------------------------------------------------------------------------
class CustomProtectedView(BaseView):
    def is_accessible(self):
        try:
            verify_jwt_in_request(locations=['cookies'])
            current_user_id = get_jwt_identity()
            from .models import User
            user = User.query.get(current_user_id)
            return user and user.role == 'admin'
        except Exception:
            return False

    def inaccessible_callback(self, name, **kwargs):
        return redirect(url_for('admin_auth.admin_login'))

class StatsDashboardView(CustomProtectedView):
    @expose('/')
    def index(self):
        return self.render('admin/stats_dashboard.html')



# -----------------------------------------------------------------------------
# ฟังก์ชันสำหรับลงทะเบียน Views ทั้งหมด
# -----------------------------------------------------------------------------
def register_views(admin, db):
    """ฟังก์ชันนี้จะถูกเรียกจาก __init__.py เพื่อลงทะเบียน Admin Views ทั้งหมด"""
    from .models import User, Medication, HealthRecord, MedicationLog, Appointment, SystemSetting, Notification
    
    # Custom Views
    admin.add_view(StatsDashboardView(name="Statistics", endpoint="admin_stats", category="Dashboard"))
    # Model Views
    admin.add_view(UserAdminView(User, db.session, name="Users", endpoint="admin_user", category="Management"))
    admin.add_view(ProtectedAdminView(Medication, db.session, name="Medications", endpoint="admin_medication", category="Management"))
    admin.add_view(ProtectedAdminView(HealthRecord, db.session, name="Health Records", endpoint="admin_healthrecord", category="Management"))
    admin.add_view(ProtectedAdminView(Appointment, db.session, name="Appointments", endpoint="admin_appointment", category="Management"))
    admin.add_view(SystemSettingAdminView(SystemSetting, db.session, name="System Settings", endpoint="admin_settings", category="Configuration"))

    # Log Views
    admin.add_view(MedicationLogAdminView(MedicationLog, db.session, name="Medication Logs", endpoint="admin_medlog", category="Logs"))
    admin.add_view(NotificationAdminView(Notification, db.session, name="Notifications Log", endpoint="admin_notification", category="Logs"))
