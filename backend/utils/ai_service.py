import os
import google.generativeai as genai
from django.conf import settings
from dotenv import load_dotenv

load_dotenv()

api_key = os.environ.get("GEMINI_API_KEY")

if not api_key:
    print("CẢNH BÁO: Chưa cấu hình GEMINI_API_KEY trong file .env")
else:
    genai.configure(api_key=api_key)

def get_embedding(text):
    if not text:
        return None
        
    text = text.replace("\n", " ").strip()
    
    try:
        result = genai.embed_content(
            model="models/text-embedding-004",
            content=text,
            task_type="retrieval_document", # Đánh dấu đây là dữ liệu để lưu trữ
            title="Embedding Data" # title cho document
        )
        
        return result['embedding']
        
    except Exception as e:
        print(f"Lỗi tạo embedding với Gemini: {e}")
        return None