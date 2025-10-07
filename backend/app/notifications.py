#backend/app/notifications.py
from flask import Blueprint, jsonify, request
from .models import Notification, User
from .extensions import db
from flask_jwt_extended import jwt_required, get_jwt_identity # type: ignore

notifications_bp = Blueprint('notifications', __name__, url_prefix='/api/notifications')

@notifications_bp.route('/my_notifications', methods=['GET'])
@jwt_required()
def get_my_notifications():
    current_user_identity = get_jwt_identity()
    user_id = current_user_identity
    notifications = Notification.query.filter_by(user_id=user_id).order_by(Notification.created_at.desc()).all()
    result = [{'id': n.id, 'message': n.message, 'is_read': n.is_read, 'link_to': n.link_to, 'created_at': n.created_at.strftime('%Y-%m-%d %H:%M')} for n in notifications]
    return jsonify(notifications=result), 200

@notifications_bp.route('/unread_count', methods=['GET'])
@jwt_required()
def get_unread_count():
    current_user_identity = get_jwt_identity()
    user_id = current_user_identity
    count = Notification.query.filter_by(user_id=user_id, is_read=False).count()
    return jsonify(unread_count=count), 200

@notifications_bp.route('/mark_read', methods=['POST'])
@jwt_required()
def mark_notifications_as_read():
    current_user_identity = get_jwt_identity()
    user_id = current_user_identity
    
    data = request.get_json()
    notification_ids = data.get('ids', [])

    if not notification_ids:
        notifications_to_update = Notification.query.filter_by(user_id=user_id, is_read=False)
    else:
        notifications_to_update = Notification.query.filter(
            Notification.id.in_(notification_ids),
            Notification.user_id == user_id
        )
    
    updated_count = notifications_to_update.update({'is_read': True}, synchronize_session=False)
    db.session.commit()
    return jsonify(msg=f"ทำเครื่องหมายแจ้งเตือนจำนวน {updated_count} รายการว่าอ่านแล้ว"), 200