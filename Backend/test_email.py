import os
import resend
from dotenv import load_dotenv

load_dotenv()

resend.api_key = os.getenv("RESEND")
print(f"Using API Key: {resend.api_key[:10]}...")

try:
    params = {
        "from": os.getenv("RESEND_FROM_EMAIL", "onboarding@resend.dev"),
        "to": "ankurbag700@gmail.com", # Hardcoded for test since seen in screenshot
        "subject": "Test Email from Avento",
        "html": "<strong>It works!</strong>"
    }
    print(f"Sending with params: {params}")
    r = resend.Emails.send(params)
    print(f"Success! Response: {r}")
except Exception as e:
    print(f"Failed: {e}")
