import os
import time
import uuid
from datetime import datetime, timezone, timedelta
import psycopg2
import psycopg2.extras
import schedule
from dotenv import load_dotenv
import resend

# Load environment variables
load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")
RESEND_API_KEY = os.getenv("RESEND_API_KEY")
FROM_EMAIL = os.getenv("FROM_EMAIL")

resend.api_key = RESEND_API_KEY

def send_reminder_email(email, name, group_name, due_date, type_str):
    if type_str == "24h_reminder":
        subject = "Payment Due Tomorrow ⏰"
        body = f"Your Equb contribution for {group_name} is due in 24 hours."
    elif type_str == "late_warning":
        subject = "Late Payment Warning ⚠️"
        body = f"Your Equb contribution for {group_name} was due 1 hour ago. Please pay as soon as possible."
    elif type_str == "round_winner":
        subject = "You won this round! 🎉"
        body = f"Congratulations! You are the payout winner for {group_name}."
    else:
        return False

    try:
        resend.Emails.send({
            "from": FROM_EMAIL,
            "to": email,
            "subject": subject,
            "html": f"<p>{body}</p>"
        })
        print(f"Sent {type_str} email to {email}")
        return True
    except Exception as e:
        print(f"Failed to send email to {email}: {e}")
        return False

def check_and_send_reminders():
    print(f"[{datetime.now(timezone.utc).isoformat()}] Running check_and_send_reminders...")
    try:
        conn = psycopg2.connect(DATABASE_URL)
        cursor = conn.cursor(cursor_factory=psycopg2.extras.DictCursor)
        
        # Query groups with nextDueDate
        cursor.execute('SELECT id, name, "nextDueDate" FROM "Group" WHERE "nextDueDate" IS NOT NULL')
        groups = cursor.fetchall()
        
        now = datetime.now(timezone.utc)
        
        for group in groups:
            group_id = group['id']
            group_name = group['name']
            next_due_date = group['nextDueDate']
            
            # Ensure next_due_date is timezone aware
            if next_due_date.tzinfo is None:
                next_due_date = next_due_date.replace(tzinfo=timezone.utc)
                
            time_diff = next_due_date - now
            total_hours_diff = time_diff.total_seconds() / 3600.0
            
            email_type = None
            
            # If nextDueDate is within the next 25 hours but more than 23 hours away -> 24h_reminder
            if 23 < total_hours_diff <= 25:
                email_type = "24h_reminder"
            # If nextDueDate has passed by more than 1 hour but less than 2 hours -> late_warning
            elif -2 <= total_hours_diff < -1:
                email_type = "late_warning"
                
            if email_type:
                # Query members with email
                cursor.execute('SELECT "walletAddress", email FROM "Member" WHERE "groupId" = %s AND email IS NOT NULL', (group_id,))
                members = cursor.fetchall()
                
                for member in members:
                    wallet_address = member['walletAddress']
                    email = member['email']
                    
                    success = send_reminder_email(email, "Member", group_name, next_due_date, email_type)
                    
                    # Insert notification record
                    new_id = str(uuid.uuid4())
                    sent_at = datetime.now(timezone.utc) if success else None
                    status = 'SENT' if success else 'FAILED'
                    
                    cursor.execute('''
                        INSERT INTO "Notification" (id, "walletAddress", "groupId", type, status, "sentAt", "createdAt", "updatedAt")
                        VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
                    ''', (
                        new_id,
                        wallet_address,
                        group_id,
                        'PAYMENT_REMINDER',
                        status,
                        sent_at,
                        datetime.now(timezone.utc),
                        datetime.now(timezone.utc)
                    ))
                    
        conn.commit()
        cursor.close()
        conn.close()
    except Exception as e:
        print(f"Error in check_and_send_reminders: {e}")

# Run every hour
schedule.every().hour.do(check_and_send_reminders)

if __name__ == "__main__":
    print(f"[{datetime.now(timezone.utc).isoformat()}] Scheduler started. Running every hour.")
    # Run once immediately on start
    check_and_send_reminders()
    while True:
        schedule.run_pending()
        time.sleep(60)
