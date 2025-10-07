#backend/app/auth.py
from flask import Blueprint, request, jsonify
from .models import User
from .extensions import db
from flask_jwt_extended import create_access_token,set_access_cookies, unset_jwt_cookies
from flask import render_template, redirect, url_for, flash, make_response, request
from flask_mail import Message
from itsdangerous import URLSafeTimedSerializer
from flask import current_app
from .extensions import mail 

# สร้าง Blueprint
auth_bp = Blueprint('auth', __name__, url_prefix='/api/auth')
admin_auth_bp = Blueprint('admin_auth', __name__, url_prefix='/admin')

def generate_reset_token(user_id):
    serializer = URLSafeTimedSerializer(current_app.config['SECRET_KEY'])
    return serializer.dumps(user_id, salt='password-reset-salt')

def verify_reset_token(token, max_age=3600): # 1 hour
    serializer = URLSafeTimedSerializer(current_app.config['SECRET_KEY'])
    try:
        user_id = serializer.loads(token, salt='password-reset-salt', max_age=max_age)
    except:
        return None
    return user_id

@auth_bp.route('/request_reset_password', methods=['POST'])
def request_reset_password():
    data = request.json
    email = data.get('email')
    user = User.query.filter_by(email=email).first()

    if user:
        token = generate_reset_token(user.id)
        # *** สำคัญ: เปลี่ยน FRONTEND_URL ให้เป็น URL ของ Web App ของคุณ ***
        reset_url = f"http://localhost:5173/reset-password/{token}"
        
        msg = Message('Password Reset Request',
                      sender=current_app.config['MAIL_DEFAULT_SENDER'],
                      recipients=[user.email])
        msg.body = f'''To reset your password, visit the following link:
{reset_url}

If you did not make this request then simply ignore this email and no changes will be made.
'''
        mail.send(msg)
        return jsonify(msg="An email has been sent with instructions to reset your password."), 200
    
    # ส่ง 200 เหมือนกันเพื่อป้องกันการเดาอีเมลในระบบ
    return jsonify(msg="If an account with that email exists, an email has been sent."), 200

@auth_bp.route('/reset_password/<token>', methods=['POST'])
def reset_password(token):
    user_id = verify_reset_token(token)
    if user_id is None:
        return jsonify(msg="That is an invalid or expired token"), 400

    user = User.query.get(user_id)
    if user is None:
        return jsonify(msg="User not found"), 404

    data = request.json
    password = data.get('password')
    if not password:
        return jsonify(msg="Password is required"), 400
    
    user.set_password(password)
    db.session.commit()
    return jsonify(msg="Your password has been updated!"), 200

# -----------------------------------------------------------------------------
# Endpoint สำหรับการสมัครสมาชิก (สำหรับผู้ดูแล/อสม.)
# -----------------------------------------------------------------------------
@auth_bp.route('/register', methods=['POST'])
def register():
    data = request.json
    username = data.get('username')
    email = data.get('email')
    password = data.get('password')
    first_name = data.get('first_name')
    last_name = data.get('last_name')
    role = data.get('role')
    avatar_url = data.get('avatar_url')

    if not all([username, email, password, first_name, last_name, role]): # <-- 2. ตรวจสอบ email
        return jsonify({"msg": "กรุณากรอกข้อมูลให้ครบถ้วน"}), 400
    
    if User.query.filter_by(username=username).first():
        return jsonify({"msg": "ชื่อผู้ใช้นี้ถูกใช้ไปแล้ว"}), 409

    if User.query.filter_by(email=email).first():
        return jsonify({"msg": "อีเมลนี้ถูกใช้ไปแล้ว"}), 409

    if role not in ['caregiver', 'osm']:
        return jsonify({"msg": "สิทธิ์บทบาทไม่ถูกต้องสำหรับการลงทะเบียนด้วยตนเอง"}), 400
    
    # ประกาศตัวแปรก่อน แล้วค่อยกำหนดค่าใน if-elif
    initial_status = ''
    success_message = ''

    if role == 'caregiver':
        initial_status = 'active'
    elif role == 'osm':
        initial_status = 'pending'

    # สร้าง User ใหม่
    new_user = User(
        username=username,
        email=email,
        first_name=first_name,
        last_name=last_name,
        role=role,
        status=initial_status,
        avatar_url=avatar_url 
    )
    new_user.set_password(password)
    
    db.session.add(new_user)
    db.session.commit()

    if role == 'caregiver':
        return jsonify({"msg": f"User '{username}' การลงทะเบียนสำเร็จ!"}), 201
    else: # role == 'osm'
        return jsonify({"msg": "การลงทะเบียนสำเร็จ! โปรดส่งข้อมูลทางอีเมล \n valrakamol.kh.65@ubu.ac.th \n และรออนุมัติเพื่อยืนยันว่าเป็นอสม "}), 201

# -----------------------------------------------------------------------------
# Endpoint สำหรับการเข้าสู่ระบบ (สำหรับทุก Role)
# -----------------------------------------------------------------------------
@auth_bp.route('/login', methods=['POST'])
def login():
    data = request.json
    username = data.get('username')
    password = data.get('password')

    if not username or not password:
        return jsonify({"msg": "กรุณากรอกชื่อผู้ใช้และรหัสผ่านให้ครบถ้วน"}), 400

    user = User.query.filter_by(username=username).first()

    if user and user.check_password(password):
        if user.status != 'active':
            return jsonify({"msg": f"บัญชีของคุณยังไม่ได้รับการอนุมัติหรือถูกระงับ"}), 403
        
        additional_claims = {
            "role": user.role,
            "username": user.username,
            "full_name": f"{user.first_name} {user.last_name}",
            "avatar_url": user.avatar_url
        }
        access_token = create_access_token(identity=user.id, additional_claims=additional_claims)
        
        return jsonify(access_token=access_token), 200

    return jsonify({"msg": "ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง"}), 401

@admin_auth_bp.route('/login', methods=['GET', 'POST'])
def admin_login():
    if request.method == 'POST':
        username = request.form.get('username')
        password = request.form.get('password')
        
        user = User.query.filter_by(username=username).first()
        
        if user and user.check_password(password) and user.role == 'admin':
            access_token = create_access_token(identity=user.id)
            # เรา redirect ไปที่ 'admin.index' ซึ่งคือหน้าแรกของ Flask-Admin
            response = make_response(redirect(url_for('admin.index')))
            set_access_cookies(response, access_token)
            return response
        else:
            flash('ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง หรือไม่ใช่บัญชีผู้ดูแลระบบ')

    return render_template('admin/login.html')

@admin_auth_bp.route('/logout')
def admin_logout():
    # แก้ไข url_for ให้ถูกต้องด้วย
    response = make_response(redirect(url_for('admin_auth.admin_login')))
    unset_jwt_cookies(response)
    return response