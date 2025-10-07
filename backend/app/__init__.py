#backend/app/__init__.py
import os
from flask import Flask, g, send_from_directory
import firebase_admin
from firebase_admin import credentials
from flask_jwt_extended import get_jwt_identity, verify_jwt_in_request 
from .extensions import db, migrate, jwt, admin, cors, mail


def create_app(config_object):
    """
    Application Factory Function.
    สร้างและตั้งค่า Flask application instance.
    """
    app = Flask(__name__, instance_relative_config=True)
    app.config.from_object(config_object)
    app.config.from_pyfile('config.py', silent=True)

    @app.context_processor
    def inject_user():
        """
        Injects a 'current_user' variable into all templates.
        This function runs before rendering any template.
        """
        try:
            # ตรวจสอบ JWT ใน cookie
            verify_jwt_in_request(locations=['cookies'], optional=True)
            current_user_id = get_jwt_identity()
            if current_user_id:
                from .models import User
                user = User.query.get(current_user_id)
                if user:
                    # ทำให้ template รู้จัก current_user
                    user.is_authenticated = True
                    return dict(current_user=user)
        except Exception:
            pass # ถ้ามี error ใดๆ ก็แค่ไม่ส่ง current_user เข้าไป
        
        # ถ้าไม่มี token หรือหา user ไม่เจอ
        from collections import namedtuple
        UserProxy = namedtuple('UserProxy', ['is_authenticated'])
        return dict(current_user=UserProxy(is_authenticated=False))
    
    @app.route('/uploads/avatars/<path:filename>')
    def uploaded_avatar(filename):
        path = os.path.abspath(os.path.join(app.root_path, '..', 'uploads/avatars'))
        return send_from_directory(path, filename)

    @app.route('/uploads/medicines/<path:filename>')
    def uploaded_medicine_image(filename):
        path = os.path.abspath(os.path.join(app.root_path, '..', 'uploads/medicines'))
        return send_from_directory(path, filename)
    
    # 3. khởi tạo Extensions ด้วย app instance
    register_extensions(app)
    
    # 4. Register ส่วนประกอบต่างๆ ของแอป
    register_blueprints(app)
    register_admin_views(app)
    register_shell_context(app)
    register_cli_commands(app)
    
    # 5. khởi tạo Services ภายนอก
    initialize_services(app)

    return app

def register_extensions(app):
    """Register Flask extensions."""
    db.init_app(app)
    migrate.init_app(app, db)
    jwt.init_app(app)
    admin.init_app(app)
    cors.init_app(app, resources={r"/api/*": {"origins": "*"}})
    mail.init_app(app)

def register_blueprints(app):
    """Register Flask blueprints."""
    # Import blueprints ที่นี่เพื่อป้องกัน Circular Import
    from . import auth, users, medicines, health, appointments, notifications, admin_api, stats
    
    app.register_blueprint(auth.auth_bp)
    app.register_blueprint(auth.admin_auth_bp) # อย่าลืม register admin_auth
    app.register_blueprint(users.users_bp)
    app.register_blueprint(medicines.medicines_bp)
    app.register_blueprint(health.health_bp)
    app.register_blueprint(appointments.appointments_bp)
    app.register_blueprint(notifications.notifications_bp)
    app.register_blueprint(admin_api.admin_api_bp)
    app.register_blueprint(stats.stats_bp)
        
def register_shell_context(app):
    """Register shell context objects."""
    def shell_context():
        from .models import User, Medication, HealthRecord, MedicationLog, Notification, Appointment, SystemSetting, MasterData
        return dict(
            db=db, User=User, Medication=Medication, 
            HealthRecord=HealthRecord, MedicationLog=MedicationLog, 
            Notification=Notification, Appointment=Appointment,
            SystemSetting=SystemSetting, MasterData=MasterData
        )
    app.shell_context_processor(shell_context)

def register_cli_commands(app):
    """Register Click commands."""
    from . import cli
    app.cli.add_command(cli.admin_cli)

def initialize_services(app):
    """Initialize other services like Firebase and Scheduler."""
    with app.app_context():
        if not firebase_admin._apps:
            try:
                service_account_key_path = app.config.get('FIREBASE_SERVICE_ACCOUNT_KEY')
                if service_account_key_path and os.path.exists(service_account_key_path):
                    cred = credentials.Certificate(service_account_key_path)
                    firebase_admin.initialize_app(cred, {'databaseURL': app.config.get('FIREBASE_DATABASE_URL')})
                    print("Firebase Admin SDK initialized successfully.")
                else:
                    print(f"Firebase Service Account Key not found or not configured.")
            except Exception as e:
                print(f"Failed to initialize Firebase Admin SDK: {e}")

    if os.environ.get("WERKZEUG_RUN_MAIN") == "true":
        from .scheduler import init_scheduler
        init_scheduler(app)

def register_admin_views(app):
    """
    ฟังก์ชันสำหรับลงทะเบียน Views ของ Flask-Admin
    """
    with app.app_context():
        # 1. Import Models ทั้งหมดที่จำเป็น
        from .models import (
            User, Medication, HealthRecord, MedicationLog, Appointment, 
            Notification, SystemSetting
        )
        
        # 2. Import Views ทั้งหมดที่จำเป็นจาก admin_views.py
        from .admin_views import (
            ProtectedAdminView, StatsDashboardView, UserAdminView, 
            MedicationLogAdminView, NotificationAdminView, SystemSettingAdminView, 
            HealthRecordAdminView, AppointmentAdminView, MedicationAdminView
        )
       
        # 3. ลงทะเบียน Views แต่ละอัน
        admin.add_view(StatsDashboardView(name="Statistics", endpoint="admin_stats", category="Dashboard"))

        # Management Category
        admin.add_view(UserAdminView(User, db.session, name="Users", endpoint="admin_user", category="Management"))
        admin.add_view(MedicationAdminView(Medication, db.session, name="Medications", endpoint="admin_medication", category="Management"))
        admin.add_view(HealthRecordAdminView(HealthRecord, db.session, name="Health Records", endpoint="admin_healthrecord", category="Management"))
        admin.add_view(AppointmentAdminView(Appointment, db.session, name="Appointments", endpoint="admin_appointment", category="Management"))

        # Configuration Category
        admin.add_view(SystemSettingAdminView(SystemSetting, db.session, name="System Settings", endpoint="admin_settings", category="Configuration"))

        # Logs Category
        admin.add_view(MedicationLogAdminView(MedicationLog, db.session, name="Medication Logs", endpoint="admin_medlog", category="Logs"))
        admin.add_view(NotificationAdminView(Notification, db.session, name="Notifications Log", endpoint="admin_notification", category="Logs"))