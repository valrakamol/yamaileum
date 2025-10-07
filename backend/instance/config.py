# backend/instance/config.py

# ไฟล์นี้มีไว้สำหรับเก็บค่าลับ (secrets) เท่านั้น
# และจะถูกเรียกใช้เพื่อเขียนทับค่า default ที่อยู่ใน config.py หลัก
# ไฟล์นี้จะต้องไม่ถูก commit ขึ้น Git

# --- ค่าลับสำหรับ Flask และ JWT ---
# กำหนดค่าคงที่ที่ไม่ซ้ำกันและคาดเดายาก
SECRET_KEY = 'YOUR_UNIQUE_AND_SECRET_FLASK_KEY_HERE'
JWT_SECRET_KEY = 'YOUR_UNIQUE_AND_DIFFERENT_JWT_KEY_HERE'


# --- *** จุดที่เพิ่มเข้ามา *** ---
# --- การตั้งค่า Google Chat Webhook ---
# นำ URL ที่คัดลอกมาจาก Google Chat Space มาวางที่นี่
MAIL_SERVER = 'smtp.googlemail.com'
MAIL_PORT = 587
MAIL_USE_TLS = True
# --- สำคัญ: ใช้ Environment Variables สำหรับ Username และ Password ---
MAIL_USERNAME = 'valrakamol.kh.65@ubu.ac.th' # ใส่อีเมล Gmail ของคุณ
MAIL_PASSWORD = 'goidpzmojfcopvuv'       # ใส่ App Password ที่สร้างจาก Google
MAIL_DEFAULT_SENDER = ('ยาไม่ลืม','valrakamol.kh.65@ubu.ac.th')

# --- การตั้งค่า Firebase (ยังคงเก็บไว้เผื่อใช้งานในอนาคต) ---
# URL ของ Firebase Realtime Database ที่ถูกต้องของคุณ
FIREBASE_DATABASE_URL = 'https://medicine-is-not-forgotten-default-rtdb.asia-southeast1.firebasedatabase.app/'

# ไม่ต้องกำหนด SQLALCHEMY_DATABASE_URI และ FIREBASE_SERVICE_ACCOUNT_KEY ที่นี่
# เพราะ path ของมันถูกจัดการโดย config.py หลักอยู่แล้ว
# หน้าที่ของคุณคือแค่วางไฟล์ service-account-key.json และไฟล์ .db ไว้ในโฟลเดอร์นี้