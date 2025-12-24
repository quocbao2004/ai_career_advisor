import os
import google.generativeai as genai
from django.conf import settings
from dotenv import load_dotenv
from apps.ai.models import KnowledgeBase

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
    
# Tìm nghĩa tương đồng
def search_vector_db(query_embedding, top_k = 5):
    if not query_embedding:
        return []
    
    try:
        data = KnowledgeBase.objects.alias('embedding', query_embedding).order_by('distance')[:top_k]
        return [doc.content for doc in data]
    except Exception as e:
        print(f"Lỗi get embedding với Gemini: {e}")
        return []