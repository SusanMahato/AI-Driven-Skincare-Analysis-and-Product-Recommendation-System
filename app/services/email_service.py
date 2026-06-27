import resend
from app.core.config import settings

resend.api_key = settings.RESEND_API_KEY

def send_verification_email(email: str, full_name: str, token: str):
    
    verification_url = f"http://192.168.18.129:3000/verify-email?token={token}"
    
    resend.Emails.send({
        "from": "SkinCare AI <noreply@susanmahato.com.np>",
        "to": email,
        "subject": "Verify your SkinCare AI account",
        "html": f"""
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h1 style="color: #f43f5e;">SkinCare AI</h1>
            <h2>Hi {full_name}, welcome!</h2>
            <p>Please verify your email address to get started with your personalized skincare journey.</p>
            <a href="{verification_url}" 
               style="background-color: #f43f5e; color: white; padding: 12px 24px; 
                      text-decoration: none; border-radius: 8px; display: inline-block; margin: 20px 0;">
                Verify Email Address
            </a>
            <p style="color: #666; font-size: 14px;">This link expires in 24 hours.</p>
            <p style="color: #666; font-size: 14px;">If you didn't create an account, ignore this email.</p>
        </div>
        """
    })

def send_password_reset_email(email: str, full_name: str, otp: str):
    resend.Emails.send({
         "from": "SkinCare AI <noreply@susanmahato.com.np>",
        "to": email,
        "subject": "Reset your SkinCare AI password",
        "html": f"""
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h1 style="color: #f43f5e;">SkinCare AI</h1>
            <h2>Hi {full_name}, reset your password</h2>
            <p>Use this OTP to reset your password. It expires in 10 minutes.</p>
            <div style="background-color: #f9f9f9; border: 2px solid #f43f5e; border-radius: 8px; 
                        padding: 20px; text-align: center; margin: 20px 0;">
                <h1 style="color: #f43f5e; letter-spacing: 8px; font-size: 36px;">{otp}</h1>
            </div>
            <p style="color: #666; font-size: 14px;">If you didn't request this, ignore this email.</p>
        </div>
        """
    })