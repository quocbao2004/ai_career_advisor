import os
from dotenv import load_dotenv

# Load file .env
load_dotenv()

key = os.environ.get("GEMINI_API_KEY")

if key:
    print(f"Key hiện tại trong máy: {key[:5]}...*****")
    print(f"Độ dài key: {len(key)}")
else:
    print("❌ Không tìm thấy Key nào cả!")