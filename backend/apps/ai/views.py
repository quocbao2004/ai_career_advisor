import google.generativeai as genai
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework import status
import os
from utils.permissions import IsAdminOrUser
from dotenv import load_dotenv
load_dotenv()

GEMINI_API_KEY = os.getenv('GEMINI_API_KEY')
genai.configure(api_key=GEMINI_API_KEY)
        
@api_view(['POST'])
@permission_classes([IsAdminOrUser])
def chat(request):
    user_input = request.data.get('prompt')
    
    if not user_input:
        return Response(
            {"error": "Vui lòng nhập nội dung câu hỏi (prompt)."}, 
            status=status.HTTP_400_BAD_REQUEST
        )

    try:
        current_user = request.user
        user_name = current_user.full_name if current_user.is_authenticated else "Bạn"
        
        system_instruction = f"""
        Đóng vai: Bạn là một chuyên gia tư vấn nghề nghiệp (AI Career Advisor) hàng đầu trong lĩnh vực tư vấn tâm lý, việc làm cho học sinh, sinh viên
        Đối tượng tư vấn: Người dùng tên là {user_name}.
        Nhiệm vụ:
        - Tư vấn lộ trình học tập, phát triển kỹ năng lập trình (Hard skill/Soft skill).
        - Gợi ý sửa CV, phỏng vấn xin việc.
        - Giọng văn: Chuyên nghiệp nhưng thân thiện, khích lệ.
        - Nếu câu hỏi không liên quan đến nghề nghiệp/công nghệ, hãy từ chối lịch sự.
        
        Câu hỏi của người dùng: "{user_input}"
        """
        model = genai.GenerativeModel('gemini-2.5-flash')
        
        response = model.generate_content(system_instruction)

        return Response({
            "response": response.text,
            "status": "success"
        }, status=status.HTTP_200_OK)

    except Exception as e:
        print(f"Gemini Error: {str(e)}")
        return Response(
            {
                "error": "Hệ thống AI đang bận hoặc gặp sự cố.",
                "message": str(e)
            }, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )