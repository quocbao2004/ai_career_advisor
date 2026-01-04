import json

from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework import status
from django.shortcuts import get_object_or_404
from utils.permissions import IsAdminOrUser, IsAdminUser
from apps.ai.services.ai_service import create_full_prompt_chat, call_gemini_with_config
from apps.ai.models import ChatSession, ChatMessage, AIPromptConfig
from apps.ai.serializers import ChatMessageSerializer, ChatSessionSerializer, AIPromptConfigSerializer


def _to_bool(value):
    if isinstance(value, bool):
        return value
    if value is None:
        return False
    s = str(value).strip().lower()
    return s in {"1", "true", "yes", "y", "on"}


@api_view(['POST'])
@permission_classes([IsAdminOrUser])
def chat_message(request):
    user = request.user
    session_id = request.data.get('session_id')
    prompt = request.data.get('prompt')
    model_key = request.data.get('model', 'gemini-2.5-flash')
    
    if not prompt:
        return Response({"message": "Vui lòng nhập nội dung"}, status=400)

    new_session = False
    if session_id:
        session = get_object_or_404(ChatSession, id=session_id, user=user)
    else:
        title = prompt[:50] + "..."
        session = ChatSession.objects.create(user=user, title=title)
        new_session = True

    ChatMessage.objects.create(session=session, role='user', content=prompt)

    ai_response_text = ""
    try:
        full_prompt = create_full_prompt_chat(prompt, session, user)
        response = call_gemini_with_config(full_prompt, model_key)

        if response and response.parts:
            ai_response_text = response.text
        else:
            ai_response_text = "Xin lỗi, hệ thống AI đang bận."

    except Exception as e:
            print(f"View Error: {e}")
            ai_response_text = "Đã xảy ra lỗi hệ thống."

    ChatMessage.objects.create(session=session, role='assistant', content=ai_response_text)

    return Response({
        "response": ai_response_text,
        "session_id": session.id,
        "session_title": session.title,
        "new_session": new_session,
    })

@api_view(['GET'])
@permission_classes([IsAdminOrUser])
def get_chat_sessions(request):
    data = ChatSession.objects.filter(user=request.user).order_by("-created_at")
    serializer = ChatSessionSerializer(data, many=True)
    return Response({"data": serializer.data, "message": "OK"}, status=200)

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
    if request.method == 'PATCH':
        session.title = request.data.get('title')
        session.save()
        return Response({"message": "Cập nhật thành công", "title": session.title})
    elif request.method == 'DELETE':
        session.delete()
        return Response({"message": "Đã xóa hội thoại"}, status=200)

@api_view(['GET', 'POST'])
@permission_classes([IsAdminUser])
def ai_config(request):
    if request.method == 'GET':
        configs = AIPromptConfig.objects.all().order_by('-is_active', '-created_at')
        serializer = AIPromptConfigSerializer(configs, many=True)
        return Response(serializer.data)
    elif request.method == 'POST':
        serializer = AIPromptConfigSerializer(data=request.data)
        if serializer.is_valid():
            # Tự động tắt config cũ
            if request.data.get('is_active'):
                 AIPromptConfig.objects.filter(is_active=True).update(is_active=False)
            serializer.save()
            return Response({"message": "Thành công", "data": serializer.data}, status=201)
        return Response(serializer.errors, status=400)

@api_view(['POST'])
@permission_classes([IsAdminUser])
def activate_ai_config(request, pk):
    config = get_object_or_404(AIPromptConfig, pk=pk)
    AIPromptConfig.objects.filter(is_active=True).update(is_active=False)
    config.is_active = True
    config.save()
    return Response({"message": f"Đã kích hoạt: {config.name}"}, status=200)
