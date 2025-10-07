# backend/app/email_service.py
import os
from threading import Thread
from flask import current_app
# --- เปลี่ยนมาใช้ SendGrid ---
from sendgrid import SendGridAPIClient
from sendgrid.helpers.mail import Mail

def send_async_email(app, message):
    with app.app_context():
        try:
            sendgrid_client = SendGridAPIClient(app.config['SENDGRID_API_KEY'])
            response = sendgrid_client.send(message)
            print(f"SendGrid response: {response.status_code}")
        except Exception as e:
            print(f"Error sending SendGrid email: {e}")

def send_email(subject, recipients, text_body, html_body=None):
    if not isinstance(recipients, list):
        recipients = [recipients]
    
    # สร้าง Message object ของ SendGrid
    message = Mail(
        from_email=current_app.config['MAIL_DEFAULT_SENDER'],
        to_emails=recipients,
        subject=subject,
        plain_text_content=text_body,
        html_content=html_body)

    Thread(target=send_async_email, args=(current_app._get_current_object(), message)).start()
