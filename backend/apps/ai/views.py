import google.generativeai as genai
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework import status
from django.db import connection
from django.shortcuts import get_object_or_404
import os
from utils.permissions import IsAdminOrUser
from utils.ai_service import get_embedding
from apps.ai.models import ChatMessage, ChatSession 
from dotenv import load_dotenv

from .models import ChatSession, ChatMessage, KnowledgeBase
from .serializers import ChatMessageSerializer, ChatSessionSerializer

load_dotenv()

GEMINI_API_KEY = os.getenv('GEMINI_API_KEY')
if GEMINI_API_KEY:
    genai.configure(api_key=GEMINI_API_KEY)

@api_view(['GET'])
@permission_classes([IsAdminOrUser])
def get_chat_sessions(request):
    data = ChatSession.objects.filter(user=request.user).order_by("-created_at")
    serializer = ChatSessionSerializer(data, many=True)
    return Response({
        "data": serializer.data,
        "message": "OK"
    }, status=status.HTTP_200_OK)

@api_view(['GET'])
@permission_classes([IsAdminOrUser])
def get_session_messages(request, session_id):
    session = get_object_or_404(ChatSession, id=session_id, user=request.user)
    data = ChatMessage.objects.filter(session=session).order_by('created_at')
    serializer = ChatMessageSerializer(data, many=True)
    return Response(serializer.data)

@api_view(['PATCH', 'DELETE'])
@permission_classes([IsAdminOrUser])
def manage_session(request, session_id):
    session = get_object_or_404(ChatSession, id=session_id, user=request.user)
    # Rename tiêu đề
    if request.method == 'PATCH':
        new_title = request.data.get('title')
        if new_title:
            session.title = new_title
            session.save()
            return Response({"message": "Cập nhật thành công", "title": session.title})
        return Response({"error": "Tiêu đề không hợp lệ"}, status=400)

    # Xóa Session
    elif request.method == 'DELETE':
        session.delete()
        return Response({"message": "Đã xóa hội thoại"}, status=200)

@api_view(['POST'])
@permission_classes([IsAdminOrUser])
def chat_message(request):
    user = request.user
    session_id = request.data.get('session_id')
    prompt = request.data.get('prompt')

    if not prompt:
        return Response({"message": "Vui lòng nhập nội dung tin nhắn"}, status=400)

    # XỬ LÝ SESSION 
    new_session_created = False
    if session_id:
        session = get_object_or_404(ChatSession, id=session_id, user=user)
    else:
        title = prompt[:50] + "..." if len(prompt) > 50 else prompt
        session = ChatSession.objects.create(user=user, title=title)
        new_session_created = True

    # LƯU TIN NHẮN USER
    ChatMessage.objects.create(session=session, role='user', content=prompt)

    # LOGIC AI
    ai_response_text = ""
    
    try:
        # LẤY THÔNG TIN CÁ NHÂN HÓA
        user_skills = "Chưa cập nhật"
        current_job = getattr(user, 'current_job_title', 'Chưa rõ')
        education = getattr(user, 'education_level', 'Chưa rõ')
        
        user_profile_context = f"""
        - Tên: {user.full_name or 'Người dùng'}
        - Công việc hiện tại: {current_job}
        - Trình độ học vấn: {education}
        - Kỹ năng nổi bật: {user_skills}
        """

        # LẤY LỊCH SỬ CHAT (HISTORY)
        history_msgs = ChatMessage.objects.filter(session=session).order_by('created_at')[:10]
        chat_history_text = "\n".join([f"- {'User' if m.role == 'user' else 'Advisor'}: {m.content}" for m in history_msgs])

        # TÌM KIẾM RAG (CONTEXT)
        embedding_vector = get_embedding(prompt)
        rag_context = ""

        full_prompt = f"""
### VAI TRÒ CỦA BẠN
Bạn là **AI Career Advisor** - một chuyên gia tư vấn nghề nghiệp cao cấp, tận tâm và sâu sắc. Nhiệm vụ của bạn là giúp người dùng định hướng sự nghiệp, phát triển kỹ năng và giải quyết các vướng mắc trong công việc.

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

### CÂU HỎI HIỆN TẠI CỦA NGƯỜI DÙNG
"{prompt}"

### CÂU TRẢ LỜI CỦA BẠN:
"""

        # GỌI GEMINI MODEL
        model = genai.GenerativeModel('gemini-2.5-flash')
        response = model.generate_content(full_prompt)
        
        if response and response.parts:
            ai_response_text = response.text
        else:
            ai_response_text = "Xin lỗi, tôi chưa thể xử lý yêu cầu này lúc này. Bạn có thể hỏi lại theo cách khác không?"

    except Exception as e:
        import traceback
        traceback.print_exc()
        ai_response_text = "Hệ thống đang gặp sự cố gián đoạn. Vui lòng thử lại sau giây lát."

    # LƯU & TRẢ VỀ
    ChatMessage.objects.create(session=session, role='assistant', content=ai_response_text)
    
    return Response({
        "response": ai_response_text,
        "session_id": session.id,
        "session_title": session.title,
        "new_session": new_session_created
    }, status=200)