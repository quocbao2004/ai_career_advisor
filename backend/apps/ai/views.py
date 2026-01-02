import google.generativeai as genai
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework import status
from django.db import connection
from django.shortcuts import get_object_or_404
import os
from utils.permissions import IsAdminOrUser
from apps.ai.services.ai_service import get_embedding, search_vector_db,create_full_prompt_chat, create_rag_context, get_history_message, get_info_user
from apps.ai.models import ChatMessage, ChatSession 
from dotenv import load_dotenv

from .models import ChatSession, ChatMessage, KnowledgeBase
from .serializers import ChatMessageSerializer, ChatSessionSerializer
from apps.ai.services.career_advice_service import AdviceParams, get_ai_advice_payload



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
    model_key = request.data.get('model', 'gemini-2.5-flash')
    if not prompt:
        return Response({"message": "Vui lòng nhập nội dung tin nhắn"}, status=400)
    print(session_id)
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
        # LẤY THÔNG TIN CÁ NHÂN 
        is_profile_missing = False
        try:
            profile = user.profile
        except:
            from apps.users.models import UserProfile
            profile, _ = UserProfile.objects.get_or_create(user=user)
        
        current_job = getattr(profile, 'current_job_title', None)
        user_profile_context, is_profile_missing = get_info_user(user, is_profile_missing=is_profile_missing)

        # LẤY LỊCH SỬ CHAT (HISTORY)
        chat_history_text = get_history_message(session=session)
        
        rag_context = ""
        try:  
            rag_context = create_rag_context(prompt=prompt)
        except Exception as e:
            rag_context = ""
        
        full_prompt = create_full_prompt_chat(is_profile_missing, user_profile_context=user_profile_context, chat_history_text=chat_history_text,prompt=prompt,rag_context=rag_context, current_job=current_job)

        # GỌI GEMINI MODEL
        model = genai.GenerativeModel(model_key)
        response = model.generate_content(full_prompt)
        
        if response and response.parts:
            ai_response_text = response.text
        else:
            ai_response_text = "Xin lỗi, tôi chưa thể xử lý yêu cầu này lúc này. Bạn có thể hỏi lại theo cách khác không?"

    except Exception as e:
        import traceback
        traceback.print_exc()
        ai_response_text = "Hệ thống đang gặp sự cố gián đoạn. Vui lòng thử lại sau giây lát."

    ChatMessage.objects.create(session=session, role='assistant', content=ai_response_text)
    
    return Response({
        "response": ai_response_text,
        "session_id": session.id,
        "session_title": session.title,
        "new_session": new_session_created
    }, status=200)


@api_view(['GET'])
@permission_classes([IsAdminOrUser])
def get_ai_advice(request):
    """Trả về tư vấn nghề nghiệp + 2-3 lộ trình học (khóa học lấy từ DB)."""
    params = AdviceParams(
        paths=min(3, max(2, int(request.query_params.get('paths', 3) or 3))),
        courses_per_path=min(10, max(3, int(request.query_params.get('courses_per_path', 6) or 6))),
    )

    payload = get_ai_advice_payload(request.user, params=params)
    if not payload.get('success'):
        return Response(payload, status=status.HTTP_400_BAD_REQUEST)
    return Response(payload, status=status.HTTP_200_OK)

