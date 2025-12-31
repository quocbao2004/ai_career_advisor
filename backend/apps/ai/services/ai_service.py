import os
import google.generativeai as genai
from django.conf import settings
from dotenv import load_dotenv
from apps.ai.models import KnowledgeBase
from pgvector.django import CosineDistance
from apps.ai.models import ChatMessage, ChatSession, KnowledgeBase

load_dotenv()

api_key = os.environ.get("GEMINI_API_KEY")

if not api_key:
    print("CẢNH BÁO: Chưa cấu hình GEMINI_API_KEY trong file .env")
else:
    genai.configure(api_key=api_key)

def get_embedding(text, task_type="retrieval_query"):
    """
    Tạo vector embedding chuẩn Google Gemini.
    """
    if not text:
        return None
        
    text = text.replace("\n", " ").strip()
    
    try:
        if task_type == "retrieval_document":
            result = genai.embed_content(
                model="models/text-embedding-004",
                content=text,
                task_type=task_type,
                title="Embedded Document"
            )
        else:
            result = genai.embed_content(
                model="models/text-embedding-004",
                content=text,
                task_type=task_type
            )
        
        return result['embedding']
        
    except Exception as e:
        print(f"Lỗi tạo embedding với Gemini: {e}")
        return None

def search_vector_db(query_embedding, top_k=5):
    if not query_embedding:
        return []
    
    try:
        
        results = KnowledgeBase.objects.annotate(
            distance=CosineDistance('embedding', query_embedding)
        ).order_by('distance')[:top_k]
        return [doc.content_text for doc in results]

    except Exception as e:
        print(f"Lỗi truy vấn Vector DB: {e}")


def get_info_user(user, is_profile_missing):
    user_skills = getattr(user, 'skills', "Chưa cập nhật")
    current_job = getattr(user.profile, 'current_job_title', None)
    education = getattr(user, 'education_level', None)

    
    if not current_job or not education:
        is_profile_missing = True
        
    user_profile_context = f"""
        - Tên: {user.full_name or 'Người dùng'}
        - Công việc hiện tại: {current_job}
        - Trình độ học vấn: {education}
        - Kỹ năng nổi bật: {user_skills}
        """
    return user_profile_context, is_profile_missing

def get_history_message(session):
    history_msgs = ChatMessage.objects.filter(session=session).order_by('-created_at')[:10]
    chat_history_text = "\n".join([f"- {'User' if m.role == 'user' else 'Advisor'}: {m.content}" for m in history_msgs])
    return chat_history_text

def create_rag_context(prompt):
    embedding_vector = get_embedding(prompt)
    if embedding_vector:
        rag_docs = search_vector_db(embedding_vector, 5)
        if rag_docs:
            context_content = "\n".join([f"- {doc}" for doc in rag_docs])
            rag_context = f"""
                Dưới đây là các thông tin chuyên môn được tìm thấy trong cơ sở dữ liệu, 
                hãy ưu tiên sử dụng nó để trả lời:
                {context_content}
                """
            return rag_context

def create_full_prompt_chat(is_profile_missing ,user_profile_context, chat_history_text, prompt, rag_context, current_job):
    if is_profile_missing:
        full_prompt = f"""
        Bạn là **AI Career Advisor**. Bạn nhận thấy User **chưa cập nhật hồ sơ** (Công việc/Học vấn).
        MỤC TIÊU CỦA BẠN LÚC NÀY:
            1. Đừng vội trả lời kiến thức chuyên sâu. Hãy đóng vai người dẫn đường thân thiện.
            2. Chào họ (nếu đây là tin nhắn đầu) và giải thích rằng để tư vấn tốt, bạn cần hiểu họ.
            3. Đặt 2-3 câu hỏi ngắn gọn để khai thác thông tin (Ví dụ: "Bạn quan tâm lĩnh vực nào?", "Bạn đã từng làm công việc gì chưa?").
            4. Giọng điệu: Nhiệt tình, khích lệ (như một người anh/chị đi trước).
            5. Nhắc họ cập nhật thông tin trên website để bạn hỗ trợ tốt hơn. 
            6. Trả lời ngắn gọn, dễ hiểu
            Thông tin hiện có: {user_profile_context}

            LỊCH SỬ CHAT (Context):
                {chat_history_text}

            USER VỪA NÓI: "{prompt}"
            """
    else:
        full_prompt = f"""
        ### VAI TRÒ CỦA BẠN
        Bạn là **AI Career Advisor** - một chuyên gia tư vấn nghề nghiệp cao cấp, tận tâm và sâu sắc. 
        Nhiệm vụ của bạn là giúp người dùng định hướng sự nghiệp, phát triển kỹ năng và giải quyết các vướng mắc trong công việc.

        ### THÔNG TIN NGƯỜI DÙNG (USER PROFILE)
        Hãy sử dụng thông tin này để cá nhân hóa câu trả lời:
        {user_profile_context}

        ### DỮ LIỆU CHUYÊN MÔN (RAG CONTEXT)
        Sử dụng thông tin sau làm cơ sở chính xác để trả lời (nếu liên quan):
        {rag_context or 'Không có dữ liệu chuyên môn cụ thể, hãy dùng kiến thức tổng quát.'}

        ### LỊCH SỬ TRÒ CHUYỆN
        {chat_history_text}

        ### YÊU CẦU TRẢ LỜI (INSTRUCTIONS)
        1. **Phân tích sâu:** Đừng chỉ trả lời bề mặt. Hãy phân tích câu hỏi dựa trên *Profile* và *Lịch sử chat* của người dùng.
        2. **Cá nhân hóa:** Xưng hô phù hợp, nhắc lại bối cảnh của người dùng (ví dụ: "Với kinh nghiệm làm {current_job} của bạn...").
        3. **Hành động cụ thể:** Luôn đưa ra lời khuyên có thể thực hiện được (Actionable insights), ví dụ: lộ trình học, kỹ năng cần bổ sung, hoặc sửa CV.
        4. **Phong cách:** Chuyên nghiệp nhưng gần gũi (Mentor tone). Khích lệ người dùng.
        5. **Dữ liệu:** Nếu thông tin trong 'RAG CONTEXT' trả lời được câu hỏi, hãy ưu tiên dùng nó. Nếu không, hãy dùng kiến thức rộng của bạn nhưng phải đảm bảo chính xác.
        6. **Định dạng:** Sử dụng Markdown (Bold, List, Heading) để trình bày rõ ràng, dễ đọc.
        7. **TUYỆT ĐỐI KHÔNG TRẢ LỜI NHỮNG THÔNG TIN NGOÀI LĨNH VỰC LIÊN QUAN NGHỀ NGHIỆP NHƯ: Hôm nay ăn gì, trời hôm nay đẹp nhỉ, giải phương trình này,...
        ### NGUYÊN TẮC TRẢ LỜI (BẮT BUỘC)
        1.  **KHÔNG DONG DÀI:** Trả lời trực diện, súc tích. Tránh những đoạn văn mở bài/kết bài sáo rỗng (như "Cảm ơn câu hỏi...", "Tôi rất vui...").
        2.  **CẤU TRÚC RÕ RÀNG:** Sử dụng **Gạch đầu dòng (Bullet points)** để chia nhỏ ý. Người dùng không muốn đọc những đoạn văn dài ngoằng ("Wall of text").
        3.  **NHIỆT TÌNH & QUAN TÂM:** Dùng giọng văn khích lệ, thấu hiểu khó khăn của người dùng (Empathy), nhưng vẫn chuyên nghiệp.
        4.  **DẪN DẮT (GUIDING):** Đừng chỉ đưa thông tin. Hãy **chọn lọc** thông tin quan trọng nhất với bối cảnh hiện tại của user.
        5.  **ACTION-ORIENTED:** Luôn kết thúc bằng 1 câu hỏi gợi mở hoặc 1 bước hành động cụ thể tiếp theo để user biết phải làm gì.

        ### CÂU HỎI HIỆN TẠI CỦA NGƯỜI DÙNG
        "{prompt}"

        ### CÂU TRẢ LỜI CỦA BẠN:
        """
    return full_prompt