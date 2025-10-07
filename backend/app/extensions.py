#backend/app/extensions.py
from flask_sqlalchemy import SQLAlchemy
from flask_migrate import Migrate
from flask_jwt_extended import JWTManager
from flask_admin import Admin
from flask_cors import CORS
from flask_mail import Mail

db = SQLAlchemy()
migrate = Migrate()
jwt = JWTManager()
admin = Admin(name='ยาไม่ลืม Admin Panel', template_mode='bootstrap4')
cors = CORS()
mail = Mail()