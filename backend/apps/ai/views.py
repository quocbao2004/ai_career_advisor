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


@api_view(['GET'])
@permission_classes([IsAdminOrUser])
def get_learning_paths_for_chat(request):
    """Generate 3 learning paths for chat UI (button format)"""
    from apps.ai.services.career_advice_service import generate_learning_paths_for_chat, AdviceParams, _safe_int, _clamp

    raw_paths = request.query_params.get('paths', '3')
    raw_courses = request.query_params.get('coursesPerPath', None)
    params = AdviceParams(
        paths=_clamp(_safe_int(raw_paths, 3), 2, 3),
        courses_per_path=_clamp(_safe_int(raw_courses, 6), 3, 10),
    )

    result = generate_learning_paths_for_chat(request.user, params)
    
    if not result.get('success'):
        return Response(result, status=status.HTTP_400_BAD_REQUEST)
    
    return Response(result.get('data'), status=status.HTTP_200_OK)


@api_view(['POST'])
@permission_classes([IsAdminOrUser])
def chat_message(request):
    user = request.user
    session_id = request.data.get('session_id')
    prompt = request.data.get('prompt')
    model_key = request.data.get('model', 'gemini-2.5-flash')
    intent_learning_paths = _to_bool(request.data.get('intent_learning_paths'))
    
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
    if not intent_learning_paths:
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

    extra_messages = []
    if intent_learning_paths:
        from apps.ai.services.career_advice_service import AdviceParams, generate_learning_paths_for_chat

        params = AdviceParams(paths=3, courses_per_path=6)
        result = generate_learning_paths_for_chat(user, params)
        if result.get('success'):
            payload = {
                "type": "learning_paths",
                "payload": result.get("data"),
            }
            ChatMessage.objects.create(
                session=session,
                role='assistant',
                content=json.dumps(payload, ensure_ascii=False),
            )
            extra_messages.append(payload)
        else:
            payload = {
                "type": "learning_paths_error",
                "payload": {
                    "message": result.get("message") or "Chưa thể tạo lộ trình học.",
                    "missing_fields": result.get("missing_fields") or [],
                    "missing_fields_readable": result.get("missing_fields_readable") or [],
                },
            }
            ChatMessage.objects.create(
                session=session,
                role='assistant',
                content=json.dumps(payload, ensure_ascii=False),
            )
            extra_messages.append(payload)
    
    return Response({
        "response": ai_response_text,
        "session_id": session.id,
        "session_title": session.title,
        "new_session": new_session,
        "extra_messages": extra_messages,
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
