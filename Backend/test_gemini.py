import os
from dotenv import load_dotenv
import google.generativeai as genai

load_dotenv('.env')

API_KEY = os.getenv("GEMINI_API_KEY")
print(f"API Key: {API_KEY[:5]}...{API_KEY[-5:]}" if API_KEY else "No API Key found")

try:
    genai.configure(api_key=API_KEY)
    model = genai.GenerativeModel('gemini-flash-latest')
    response = model.generate_content("Hello")
    print("Success:", response.text)
except Exception as e:
    import traceback
    traceback.print_exc()
    import traceback
    traceback.print_exc()
