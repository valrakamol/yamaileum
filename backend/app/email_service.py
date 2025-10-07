# backend/app/email_service.py
import os
from threading import Thread
from flask import current_app

# --- Import ที่จำเป็นสำหรับ SendGrid ---
from sendgrid import SendGridAPIClient
from sendgrid.helpers.mail import Mail

def send_async_email(app, message):
    """
    ฟังก์ชันสำหรับส่งอีเมลใน background thread เพื่อไม่ให้ request หลักต้องรอ
    """
    # app_context() จำเป็นเพื่อให้สามารถเข้าถึง current_app.config ได้ใน thread ใหม่
    with app.app_context():
        try:
            # --- *** จุดที่แก้ไขสำคัญ: อ่านค่า API Key จาก os.environ โดยตรง *** ---
            api_key = os.environ.get('SENDGRID_API_KEY')
            
            # ตรวจสอบว่ามี API Key อยู่จริงหรือไม่
            if not api_key:
                print("FATAL ERROR: SENDGRID_API_KEY environment variable not set on the server.")
                return

            # สร้าง client และส่งอีเมล
            sendgrid_client = SendGridAPIClient(api_key)
            response = sendgrid_client.send(message)
            
            # แสดง Log ผลลัพธ์การส่ง
            print(f"SendGrid response status code: {response.status_code}")
            if response.status_code >= 400:
                print(f"SendGrid response body: {response.body}")

        except Exception as e:
            # แสดง Exception จริงๆ เพื่อให้ดีบักได้ง่ายขึ้น
            print(f"An exception occurred while sending SendGrid email: {e}")

def send_email(subject, recipients, text_body, html_body=None):
    """
    ฟังก์ชันหลักสำหรับสร้างและส่งอีเมลโดยใช้ SendGrid
    """
    # ตรวจสอบว่า recipients เป็น list
    if not isinstance(recipients, list):
        recipients = [recipients]
    
    # ดึงชื่อและอีเมลผู้ส่งจาก config
    sender_config = current_app.config.get('MAIL_DEFAULT_SENDER')
    if not sender_config:
        print("Error: MAIL_DEFAULT_SENDER is not configured.")
        return

    # สร้าง Message object ของ SendGrid
    message = Mail(
        from_email=sender_config,
        to_emails=recipients,
        subject=subject,
        plain_text_content=text_body,
        html_content=html_body) # สามารถใส่ HTML เพื่อทำอีเมลให้สวยงามได้

    # สร้าง Thread ใหม่เพื่อส่งอีเมลแบบ Asynchronous
    app = current_app._get_current_object()
    Thread(target=send_async_email, args=(app, message)).start()
    print(f"Email task created for subject: '{subject}' to {recipients}")
