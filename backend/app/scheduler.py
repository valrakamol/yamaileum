# backend/app/scheduler.py
import os
from apscheduler.schedulers.background import BackgroundScheduler
from datetime import datetime, date, timedelta
from sqlalchemy import func
from flask import current_app

from .models import User, Medication, MedicationLog, Notification, SystemSetting, Appointment
from .extensions import db
from .email_service import send_email


def create_internal_notification(user_id, message, link_to=None):
    """ฟังก์ชันช่วยสำหรับสร้าง Notification ในฐานข้อมูลของเราเองเพื่อเป็น Log"""
    notif = Notification(user_id=user_id, message=message, link_to=link_to)
    db.session.add(notif)


def format_minutes_to_readable_time(minutes):
    """
    แปลงนาทีรวมเป็น "X ชั่วโมง Y นาที" หรือ "Y นาที"
    """
    if minutes < 1:
        return "สักครู่"
    if minutes < 60:
        return f"{minutes} นาที"
    
    hours = minutes // 60
    remaining_minutes = minutes % 60
    
    if remaining_minutes == 0:
        return f"{hours} ชั่วโมง"
    
    return f"{hours} ชั่วโมง {remaining_minutes} นาที"


def check_medicine_schedule(app):
    """
    Job ที่ทำงานทุกนาทีเพื่อส่งการแจ้งเตือนการทานยาผ่าน "อีเมล"
    """
    with app.app_context():
        now = datetime.now()
        today = now.date()

        try:
            reminder_before_min = int(SystemSetting.query.filter_by(key='REMINDER_BEFORE_MINUTES').first().value)
            alert_after_min = int(SystemSetting.query.filter_by(key='ALERT_AFTER_MINUTES').first().value)
        except (AttributeError, ValueError):
            reminder_before_min = 15
            alert_after_min = 15
        
        meds_for_today = Medication.query.filter(
            Medication.start_date <= today,
            (Medication.end_date.is_(None)) | (Medication.end_date >= today)
        ).all()

        for med in meds_for_today:
            try:
                med_time_obj = datetime.strptime(med.time_to_take, '%H:%M').time()
                med_datetime_today = datetime.combine(today, med_time_obj)
            except ValueError:
                continue

            log_exists_today = MedicationLog.query.filter(
                MedicationLog.medication_id == med.id, 
                db.func.date(MedicationLog.taken_at) == today
            ).first()

            if log_exists_today:
                continue

            elder = med.patient
            elder_name = f"{elder.first_name} {elder.last_name}"
            med_info_str = f"{med.name} ({med.time_to_take})"

            # A. แจ้งเตือนล่วงหน้า
            time_until_med = (med_datetime_today - now).total_seconds() / 60
            if reminder_before_min - 1 < time_until_med <= reminder_before_min:
                pre_reminder_log = f"แจ้งเตือนล่วงหน้า: {med_info_str}"
                notif_sent_today = Notification.query.filter(
                    Notification.message == pre_reminder_log,
                    db.func.date(Notification.created_at) == today,
                    (Notification.user_id == elder.id) | (Notification.user_id.in_([m.id for m in elder.managers]))
                ).first()

                if not notif_sent_today:
                    # ส่งหาผู้สูงอายุ
                    if elder.email:
                        send_email(
                            subject=f"เตรียมตัวทานยาในอีก {reminder_before_min} นาที",
                            recipients=[elder.email],
                            text_body=f"สวัสดีคุณ {elder.first_name},\n\nในอีกประมาณ {reminder_before_min} นาที จะถึงเวลาทานยา '{med.name}' ({med.time_to_take} น.) กรุณาเตรียมตัวให้พร้อมนะคะ"
                        )
                        create_internal_notification(elder.id, pre_reminder_log)

            # B. แจ้งเตือนเมื่อ "ถึงเวลาพอดี"
            if now.hour == med_datetime_today.hour and now.minute == med_datetime_today.minute:
                # ส่งอีเมลหาผู้สูงอายุ
                if elder.email:
                    send_email(
                        subject=f"🔔 ได้เวลาทานยา: {med.name}",
                        recipients=[elder.email],
                        text_body=f"สวัสดีคุณ {elder.first_name},\n\nถึงเวลาทานยา '{med.name}' แล้วค่ะ\nเวลา: {med.time_to_take} น."
                    )

                # ส่งอีเมลหาผู้ดูแลและ อสม. ทุกคน
                manager_emails = [manager.email for manager in elder.managers if manager.email]
                if manager_emails:
                    send_email(
                        subject=f"🔔 แจ้งเตือน: ถึงเวลาทานยาของ {elder_name}",
                        recipients=manager_emails,
                        text_body=f"ถึงเวลาที่คุณ {elder_name} ต้องทานยา '{med_info_str}'\nกรุณาตรวจสอบและติดตามการทานยา"
                    )

            # C. แจ้งเตือนซ้ำ (ยาขาด)
            minutes_passed = (now - med_datetime_today).total_seconds() / 60
            if minutes_passed > 0 and (int(minutes_passed) % alert_after_min == 0):
                last_minute_start = now.replace(second=0, microsecond=0) - timedelta(minutes=1)
                reminder_message_log = f"ยาขาด (เตือนซ้ำ): {med_info_str} ของ {elder_name}"
                
                notif_sent_recently = Notification.query.filter(
                    Notification.message.like(f"%{reminder_message_log}%"),
                    Notification.created_at >= last_minute_start
                ).first()

                if not notif_sent_recently:
                    readable_time_passed = format_minutes_to_readable_time(int(minutes_passed))
                    
                    # ส่งหาผู้ดูแล
                    manager_emails = [manager.email for manager in elder.managers if manager.email]
                    if manager_emails:
                        send_email(
                            subject=f"🚨 ยาขาด (เตือนซ้ำ)! : {elder_name}",
                            recipients=manager_emails,
                            text_body=f"แจ้งเตือน: คุณ {elder_name} ยังไม่กดยืนยันการทานยา '{med_info_str}' ซึ่งเลยเวลามาแล้วประมาณ {readable_time_passed}"
                        )
                    
                    # ส่งหาผู้สูงอายุ
                    if elder.email:
                        send_email(
                            subject=f"🚨 ลืมทานยา (เตือนซ้ำ): {med.name}",
                            recipients=[elder.email],
                            text_body=f"สวัสดีคุณ {elder.first_name},\n\nระบบตรวจพบว่าคุณอาจจะยังไม่ได้ทานยา '{med.name}' ของเวลา {med.time_to_take} น.\n\nกรุณาตรวจสอบและกดยืนยันในเว็บแอปพลิเคชันด้วยนะคะ"
                        )
                    
                    for manager in elder.managers:
                        create_internal_notification(manager.id, reminder_message_log)

        db.session.commit()


def check_appointment_reminder(app):
    """
    Job ที่ทำงานทุกวัน (ตอนเช้า) เพื่อส่งการแจ้งเตือนสำหรับนัดหมายใน "วันพรุ่งนี้" ผ่านอีเมล
    """
    with app.app_context():
        tomorrow = date.today() + timedelta(days=1)
        
        appointments_tomorrow = Appointment.query.filter(
            func.date(Appointment.appointment_datetime) == tomorrow
        ).all()

        print(f"Found {len(appointments_tomorrow)} appointments for tomorrow ({tomorrow}).")

        for appt in appointments_tomorrow:
            elder = appt.patient
            elder_name = f"{elder.first_name} {elder.last_name}"
            appt_time_str = appt.appointment_datetime.strftime('%H:%M น.')
            
            # ส่งอีเมลหาผู้ดูแลและ อสม. ทุกคน
            manager_emails = [manager.email for manager in elder.managers if manager.email]
            if manager_emails:
                send_email(
                    subject=f"🗓️ แจ้งเตือนนัดหมายวันพรุ่งนี้ของ {elder_name}",
                    recipients=manager_emails,
                    text_body=(
                        f"แจ้งเตือน: คุณ {elder_name} มีนัดหมายในวันพรุ่งนี้\n\n"
                        f"เรื่อง: {appt.title}\n"
                        f"เวลา: {appt_time_str}\n"
                        f"สถานที่: {appt.location}"
                    )
                )
            
            # ส่งอีเมลหาผู้สูงอายุ (ถ้ามี)
            if elder.email:
                send_email(
                    subject=f'🗓️ แจ้งเตือนนัดหมายวันพรุ่งนี้: {appt.title}',
                    recipients=[elder.email],
                    text_body=(
                        f"สวัสดีคุณ {elder.first_name},\n\n"
                        f"ขอแจ้งเตือนว่าท่านมีนัดหมายในวันพรุ่งนี้ ({tomorrow.strftime('%d/%m/%Y')})\n\n"
                        f"เรื่อง: {appt.title}\n"
                        f"เวลา: {appt_time_str}\n"
                        f"สถานที่: {appt.location}\n\n"
                        f"กรุณาเตรียมตัวล่วงหน้าค่ะ"
                    )
                )
        db.session.commit() # Commit notification logs if any were created inside send_email


def init_scheduler(app):
    """สร้างและเริ่มการทำงานของ Scheduler"""
    scheduler = BackgroundScheduler(daemon=True)
    
    scheduler.add_job(
        func=check_medicine_schedule, 
        args=[app], 
        trigger="interval", 
        minutes=1,
        id='check_medicine_schedule_job',
        replace_existing=True
    )
    
    scheduler.add_job(
        func=check_appointment_reminder,
        args=[app],
        trigger='cron',
        hour=7,
        minute=0,
        id='check_appointment_reminder_job',
        replace_existing=True
    )

    scheduler.start()
    print("ตัวจัดตารางแจ้งเตือน (Email) ได้เริ่มทำงานเรียบร้อยแล้ว")