#backend/run.py
import os
from dotenv import load_dotenv

# โหลด Environment Variables จากไฟล์ .env ก่อนเสมอ
# เพื่อให้แน่ใจว่าค่า FLASK_CONFIG (ถ้ามี) ถูกโหลดก่อน create_app
load_dotenv()

# --- 1. Import ที่จำเป็น ---
# Import เฉพาะ Application Factory จาก package 'app'
from app import create_app
# Import dictionary 'config' จากไฟล์ config.py
from config import config

# --- 2. เลือก Configuration ---
# อ่านค่า Environment Variable 'FLASK_CONFIG'
# ถ้าไม่มี, ให้ใช้ 'default' (ซึ่งเราตั้งให้เป็น 'development' ใน config.py)
config_name = os.getenv('FLASK_CONFIG') or 'default'

# --- 3. สร้าง Application Instance ---
# เรียกใช้ Application Factory พร้อมกับ "Config Object" ที่ถูกต้อง
# app instance นี้จะถูกใช้โดย Flask CLI (เช่น flask db) และ WSGI server
app = create_app(config[config_name])

# --- 4. จุดเริ่มต้นการรัน Development Server ---
# ใช้ `if __name__ == '__main__':` เพื่อให้แน่ใจว่าส่วนนี้จะทำงาน
# ก็ต่อเมื่อไฟล์นี้ถูกรันโดยตรง (เช่น `python run.py`)
if __name__ == '__main__':
    # host='0.0.0.0' เพื่ออนุญาตให้เครื่องอื่นในเครือข่ายเดียวกันเชื่อมต่อได้
    # debug=True จะถูกควบคุมโดย config ที่เราเลือก (DevelopmentConfig จะเป็น True)
    app.run(host='0.0.0.0', port=5000)