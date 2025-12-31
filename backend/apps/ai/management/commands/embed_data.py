from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from apps.ai.models import KnowledgeBase
from apps.career.models import Career, Industry, Course
from apps.ai.services.ai_service import get_embedding

# Cố gắng import UserSkill, nếu chưa có model này thì bỏ qua
try:
    from apps.users.models import UserSkill
except ImportError:
    UserSkill = None

User = get_user_model()

class Command(BaseCommand):
    help = 'Quét TOÀN BỘ dữ liệu (Database + Static Info + Users) và tạo Vector Embedding'

    def handle(self, *args, **kwargs):
        self.stdout.write(self.style.WARNING("Bắt đầu tiến trình Embedding toàn bộ hệ thống..."))

        # 1. Xóa dữ liệu cũ (Tùy chọn: Bật lên nếu muốn làm sạch DB trước khi chạy)
        # KnowledgeBase.objects.all().delete()
        
        # --- PHẦN 1: DỮ LIỆU HỆ THỐNG ---
        self.process_industries()
        self.process_skills()
        self.process_careers()
        self.process_courses()

        # --- PHẦN 2: DỮ LIỆU TĨNH (INFO WEBSITE, FAQ) ---
        self.process_static_website_data()

        # --- PHẦN 3: DỮ LIỆU NGƯỜI DÙNG ---
        self.process_users()

        self.stdout.write(self.style.SUCCESS('HOÀN TẤT! Dữ liệu đã sẵn sàng cho RAG.'))

    # ---------------------------------------------------------
    # CÁC HÀM XỬ LÝ CHI TIẾT (BẠN ĐANG THIẾU CÁC HÀM NÀY)
    # ---------------------------------------------------------

    def process_static_website_data(self):
        self.stdout.write("-> Đang xử lý Static Website Data (FAQ, About)...")
        static_data = [
            {
                "id": "static_about_us",
                "type": "general_advice",
                "text": "Giới thiệu: Đây là hệ thống AI Career Advisor, chuyên cung cấp lộ trình nghề nghiệp cá nhân hóa.",
                "meta": {"section": "About Us"}
            },
            {
                "id": "static_contact",
                "type": "general_advice",
                "text": "Thông tin liên hệ: Email hỗ trợ support@careeradvisor.vn, Hotline 1900-xxxx.",
                "meta": {"section": "Contact"}
            },
            {
                "id": "static_faq_1",
                "type": "general_advice",
                "text": "Hỏi: Làm sao để tạo lộ trình học tập? Đáp: Bạn cần làm bài test tính cách MBTI/Holland trước.",
                "meta": {"section": "FAQ"}
            }
        ]

        for item in static_data:
            self.save_to_knowledge_base(
                ref_id=item["id"],
                type_enum=item["type"],
                text=item["text"],
                metadata=item["meta"]
            )

  
    # ---------------------------------------------------------
    # HÀM LƯU CHUNG (QUAN TRỌNG)
    # ---------------------------------------------------------
    def save_to_knowledge_base(self, ref_id, type_enum, text, metadata):
        text = text.replace("\n", " ").strip()
        if not text: return

        # Kiểm tra tồn tại để tránh duplicate
        if KnowledgeBase.objects.filter(reference_id=str(ref_id), content_type=type_enum).exists():
            return

        vector = get_embedding(text)
        if vector:
            KnowledgeBase.objects.create(
                content_type=type_enum,
                reference_id=str(ref_id),
                content_text=text,
                embedding=vector,
                metadata=metadata
            )
            print(f"   + Đã embed: [{type_enum}] {metadata.get('title', metadata.get('name', metadata.get('full_name', ref_id)))}")