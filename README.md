# ยาไม่ลืม - ระบบช่วยเตือนรับประทานยาและติดตามสุขภาพผู้สูงอายุ

โปรเจกต์นี้พัฒนาด้วย:

- Backend: Flask REST API
- Frontend: Kivy + KivyMD สำหรับผู้ใช้งาน Android (ผู้สูงอายุ, ผู้ดูแล, อสม.)
- ฟีเจอร์: แจ้งเตือนกินยา, บันทึกสุขภาพ, นัดหมายแพทย์, Dashboard ข้อมูลสุขภาพ, รองรับบทบาทผู้ใช้หลายประเภท

---

## 🎯 ความสามารถหลัก

- ผู้สูงอายุสามารถ “ยืนยันการรับประทานยา” ได้ด้วยตนเอง
- ผู้ดูแล/อสม. บันทึกสุขภาพ (เช่น น้ำหนัก ความดัน)
- Dashboard กราฟสุขภาพย้อนหลัง
- ระบบ Login / Register พร้อม JWT Token
- รองรับ Firebase Cloud Messaging (FCM) สำหรับ Push Notification (เฉพาะ Android)

---

## 🛠 เทคโนโลยีที่ใช้

| Layer     | Technology            |
|-----------|------------------------|
| Backend   | Flask, SQLAlchemy, JWT, SQLite |
| Frontend  | Kivy, KivyMD, Plyer, PyJWT |
| Graph     | kivy_garden.graph      |
| Notification | Firebase (ผ่าน Plyer) |

---

## 🚀 วิธีติดตั้ง

### 1. ติดตั้ง dependencies

# Windows
venv\Scripts\activate
# macOS/Linux
source venv/bin/activate

pip install -r requirements.txt

## 🧪 การรันระบบ

# เปิด 2 terminal พร้อมกัน

# Terminal 1: Backend (Flask)
cd backend
venv\Scripts\activate
python run.py

# Terminal 2: Frontend (Kivy)
cd frontend
venv\Scripts\activate
python main.py

# เข้วadmin 
รันbackend เสร็จเข้าลิ้ง โดยกด ctrl+click  (ลิ้งทีมีชื่อว่าhttp://127.0.0.1:5000)
ิเพิ่มคำว่า/admin ใน url 
รหัสadmin 
Valrakamol65
admin1234

## 📁 โครงสร้างโปรเจกต์
project-root/
├── backend/
├── frontend/
│   ├── main.py
│   ├── screens/
│   ├── widgets/
│   └── kv/
├── requirements.txt
└── README.md

## 🙏 ผู้พัฒนา
โครงงานวิชาโปรเจกต์
นางสาววรกมล คำแสนราช
นักศึกษาชั้นปีที่ 4
คณะวิทยาศาสตร์
สาขาเทคโนโลยีสารสนเทศและการสื่อสาร
มหาวิทยาลัยอุบลราชธานี