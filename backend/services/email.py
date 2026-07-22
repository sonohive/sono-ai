import resend
from core.config import settings

resend.api_key = settings.RESEND_API_KEY

def send_welcome_email(to_email: str, name: str):
    if not settings.RESEND_API_KEY:
        print("Resend API key not configured. Skipping welcome email.")
        return
        
    try:
        params = {
            "from": "Sono AI <hello@sonoai.app>", # Update with your verified domain
            "to": [to_email],
            "subject": "Welcome to Sono AI!",
            "html": f"<strong>Hello {name or 'there'},</strong><br><br>Welcome to Sono AI, your new ultrasound companion.",
        }
        resend.Emails.send(params)
    except Exception as e:
        print(f"Error sending email: {e}")

def send_password_reset_email(to_email: str, token: str):
    if not settings.RESEND_API_KEY:
        print("Resend API key not configured. Skipping password reset email.")
        return
        
    # Example reset link
    reset_link = f"http://localhost:5173/reset-password?token={token}"
    
    try:
        params = {
            "from": "Sono AI <hello@sonoai.app>", # Update with your verified domain
            "to": [to_email],
            "subject": "Reset your password",
            "html": f"<p>Click the link below to reset your password:</p><p><a href='{reset_link}'>Reset Password</a></p>",
        }
        resend.Emails.send(params)
    except Exception as e:
        print(f"Error sending email: {e}")
