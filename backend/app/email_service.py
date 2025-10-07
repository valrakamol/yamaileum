# backend/app/email_service.py
from flask_mail import Message
from flask import current_app
from .extensions import mail
from threading import Thread

def send_async_email(app, msg):
    """ฟังก์ชันสำหรับส่งอีเมลใน background thread เพื่อไม่ให้แอปค้าง"""
    with app.app_context():
        try:
            mail.send(msg)
            print(f"Successfully sent email: '{msg.subject}' to {msg.recipients}")
        except Exception as e:
            print(f"Error sending async email to {msg.recipients}: {e}")

def send_email(subject, recipients, text_body, html_body=None):
    """ฟังก์ชันหลักสำหรับสร้างและส่งอีเมล"""
    if not recipients:
        return # ไม่ทำอะไรถ้าไม่มีผู้รับ

    if not isinstance(recipients, list):
        recipients = [recipients]
    
    msg = Message(
        subject,
        sender=current_app.config['MAIL_DEFAULT_SENDER'],
        recipients=recipients
    )
    msg.body = text_body
    msg.html = html_body

    # สร้าง Thread ใหม่เพื่อส่งอีเมล
    app = current_app._get_current_object()
    Thread(target=send_async_email, args=(app, msg)).start()