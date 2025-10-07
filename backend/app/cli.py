#backend/app/cli.py
import click
import getpass
from flask.cli import with_appcontext

# Import 'db' object จาก extensions.py
from .extensions import db
# Import 'User' model จาก models.py
from .models import User

# --- 1. สร้าง Command Group หลัก ---
# เราจะใช้ชื่อ 'admin' เป็นชื่อกลุ่มของคำสั่ง
# เวลาเรียกใช้: flask admin <command>
@click.group('admin')
def admin_cli():
    """Custom commands for application administration."""
    pass


# --- 2. สร้าง Command ย่อย: 'list-pending' ---
@admin_cli.command('list-pending')
@with_appcontext # Decorator นี้สำคัญมากเพื่อให้ command นี้เข้าถึง DB ได้
def list_pending_users():
    """Lists all users with a 'pending' status."""
    pending_users = User.query.filter_by(status='pending').all()
    
    if not pending_users:
        click.echo("No pending users found.")
        return
    
    click.echo("--- Pending Users for Approval ---")
    # จัดรูปแบบการแสดงผลให้สวยงาม
    click.echo(f"{'ID':<4} | {'Username':<20} | {'Role':<12} | {'Name'}")
    click.echo("-" * 60)
    for user in pending_users:
        click.echo(
            f"{user.id:<4} | {user.username:<20} | {user.role:<12} | {user.first_name} {user.last_name}"
        )
    click.echo("------------------------------------")


# --- 3. สร้าง Command ย่อย: 'approve' ---
@admin_cli.command('approve')
@click.argument("user_id", type=int)
@with_appcontext
def approve_user(user_id):
    """Approves a user by setting their status to 'active'."""
    user = User.query.get(user_id)
    
    if not user:
        click.echo(f"Error: User with ID {user_id} not found.")
        return
    
    if user.status != 'pending':
        click.echo(f"Warning: User '{user.username}' is not in 'pending' status (current: {user.status}).")

    user.status = 'active'
    db.session.commit()
    click.echo(f"Success: User '{user.username}' (ID: {user.id}) has been approved and is now active.")


# --- 4. สร้าง Command ย่อย: 'create-admin' ---
@admin_cli.command('create-admin')
@with_appcontext
def create_admin():
    """Creates a new admin user."""
    click.echo("--- Create New Admin User ---")
    
    username = click.prompt("Enter admin username")
    # --- *** 1. เพิ่มการรับค่า email *** ---
    email = click.prompt("Enter admin email")
    first_name = click.prompt("Enter first name")
    last_name = click.prompt("Enter last name")
    password = getpass.getpass("Enter password: ")
    confirm_password = getpass.getpass("Confirm password: ")

    if password != confirm_password:
        click.echo("Error: Passwords do not match.")
        return

    if User.query.filter_by(username=username).first():
        click.echo(f"Error: Username '{username}' already exists.")
        return
        
    # --- *** 2. เพิ่มการตรวจสอบ email ซ้ำ *** ---
    if User.query.filter_by(email=email).first():
        click.echo(f"Error: Email '{email}' already exists.")
        return

    admin_user = User(
        username=username,
        email=email,  # <-- 3. เพิ่ม email ตอนสร้าง User
        first_name=first_name,
        last_name=last_name,
        role='admin',
        status='active' 
    )
    admin_user.set_password(password)

    db.session.add(admin_user)
    db.session.commit()
    
    click.echo(f"Success! Admin user '{username}' has been created.")