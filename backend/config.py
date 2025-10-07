#backend/config.py
import os
import secrets
from dotenv import load_dotenv
from datetime import timedelta

# โหลดค่าจากไฟล์ .env (ถ้ามี) ซึ่งสะดวกมากตอนพัฒนา
load_dotenv()

# หาตำแหน่งของ Directory ที่ไฟล์ config.py นี้อยู่ (คือโฟลเดอร์ backend)
basedir = os.path.abspath(os.path.dirname(__file__))

class Config:
    """
    คลาสการตั้งค่าพื้นฐาน (Base Configuration)
    การตั้งค่าทั้งหมดจะสืบทอดจากคลาสนี้
    """
    # --- ค่าลับพื้นฐาน ---
    # ใช้ค่าจาก Environment Variable ก่อน, ถ้าไม่มีให้สร้างค่าสุ่มขึ้นมา
    SECRET_KEY = os.environ.get('SECRET_KEY') or secrets.token_hex(24)
    JWT_SECRET_KEY = os.environ.get('JWT_SECRET_KEY') or secrets.token_hex(24)
    
    # --- การตั้งค่า SQLAlchemy ---
    SQLALCHEMY_TRACK_MODIFICATIONS = False

    # --- การตั้งค่า Firebase ---
    # Path ไปยังไฟล์ service account key ที่ควรจะอยู่ในโฟลเดอร์ instance
    FIREBASE_SERVICE_ACCOUNT_KEY = os.path.join(basedir, 'instance', 'service-account-key.json')
    
    # URL ของ Firebase Realtime Database
    # **สำคัญ:** คุณต้องไปกำหนดค่านี้ใน instance/config.py หรือ .env อีกที
    FIREBASE_DATABASE_URL = os.environ.get('FIREBASE_DATABASE_URL') or 'https://your-project-id-default-rtdb.firebaseio.com/'

    # --- การตั้งค่า Flask-JWT-Extended ---
    # กำหนดให้ Access Token ที่ใช้กับ Admin Panel (ผ่าน Cookie) มีอายุ 1 วัน
    JWT_ACCESS_TOKEN_EXPIRES = timedelta(days=1)
    JWT_TOKEN_LOCATION = ["headers"]
    JWT_COOKIE_CSRF_PROTECT = False
    

class DevelopmentConfig(Config):
    """
    การตั้งค่าสำหรับตอนพัฒนา (Development Environment)
    """
    DEBUG = True
    # กำหนดให้ใช้ฐานข้อมูล SQLite ชื่อ dev_database.db ที่อยู่ในโฟลเดอร์ instance
    SQLALCHEMY_DATABASE_URI = 'sqlite:///' + os.path.join(basedir, 'instance', 'dev_database.db')


class ProductionConfig(Config):
    """
    การตั้งค่าสำหรับตอนใช้งานจริง (Production Environment)
    """
    DEBUG = False
    # บน Production เราจะดึงค่าทั้งหมดมาจาก Environment Variables ที่ตั้งค่าไว้บน Render
    SECRET_KEY = os.environ.get('SECRET_KEY')
    JWT_SECRET_KEY = os.environ.get('JWT_SECRET_KEY')
    SQLALCHEMY_DATABASE_URI = os.environ.get('DATABASE_URL')
    
    # --- *** จุดที่แก้ไขสำคัญ: แปลง URL ของ PostgreSQL *** ---
    # Render ให้ DATABASE_URL มาในรูปแบบ "postgres://"
    # แต่ SQLAlchemy เวอร์ชันใหม่ๆ ต้องการ "postgresql://"
    if SQLALCHEMY_DATABASE_URI and SQLALCHEMY_DATABASE_URI.startswith("postgres://"):
        SQLALCHEMY_DATABASE_URI = SQLALCHEMY_DATABASE_URI.replace("postgres://", "postgresql://", 1)
        
    # (ค่า Firebase และอื่นๆ สามารถดึงมาจาก Environment Variable ได้เช่นกัน)
    FIREBASE_DATABASE_URL = os.environ.get('FIREBASE_DATABASE_URL')


# Dictionary สำหรับให้ Application Factory เลือกใช้ Config
config = {
    'development': DevelopmentConfig,
    'production': ProductionConfig,
    'default': DevelopmentConfig # กำหนดให้ 'development' เป็นค่าเริ่มต้น
}