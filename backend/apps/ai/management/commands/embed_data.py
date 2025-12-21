from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from apps.ai.models import KnowledgeBase
from apps.courses.models import Course
from apps.career.models import Career, Industry, MasterSkill
from utils.ai_service import get_embedding

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

    def process_industries(self):
        self.stdout.write("-> Đang xử lý Industries...")
        for item in Industry.objects.all():
            content = f"Ngành nghề: {item.name}. Mô tả tổng quan: {item.description}"
            self.save_to_knowledge_base(item.id, 'industry', content, {"name": item.name})

    def process_skills(self):
        self.stdout.write("-> Đang xử lý Master Skills...")
        for item in MasterSkill.objects.all():
            content = (
                f"Kỹ năng: {item.skill_name}. "
                f"Loại kỹ năng: {item.type}. " 
                f"Mô tả: {item.description}"
            )
            self.save_to_knowledge_base(item.id, 'skill', content, {"name": item.skill_name})

    def process_careers(self):
        self.stdout.write("-> Đang xử lý Careers...")
        for item in Career.objects.all():
            industry_name = item.industry.name if item.industry else "Chưa phân loại"
            salary_info = f"từ {item.salary_min:,.0f} đến {item.salary_max:,.0f} VNĐ" if item.salary_min else "thỏa thuận"
            
            content = (
                f"Vị trí công việc: {item.title} ({item.level}). "
                f"Thuộc ngành: {industry_name}. "
                f"Mức lương tham khảo: {salary_info}. "
                f"Mô tả công việc: {item.description}"
            )
            
            metadata = {
                "title": item.title,
                "level": item.level,
                "salary_min": str(item.salary_min),
                "salary_max": str(item.salary_max)
            }
            self.save_to_knowledge_base(item.id, 'career', content, metadata)

    def process_courses(self):
        self.stdout.write("-> Đang xử lý Courses...")
        for item in Course.objects.all():
            content = (
                f"Khóa học: {item.title}. "
                f"Cung cấp bởi: {item.provider}. "
                f"Giá học phí: {item.price}. "
                f"Nội dung khóa học: {item.description}"
            )
            metadata = {"title": item.title, "url": item.url}
            self.save_to_knowledge_base(item.id, 'course', content, metadata)

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

    def process_users(self):
        self.stdout.write("-> Đang xử lý User Profiles...")
        # Lấy user đang hoạt động
        users = User.objects.filter(is_active=True)

        for user in users:
            # Lấy kỹ năng (nếu có bảng UserSkill)
            skill_list = "Chưa cập nhật"
            if UserSkill:
                try:
                    user_skills = UserSkill.objects.filter(user=user).select_related('skill')
                    skills = [us.skill.skill_name for us in user_skills if us.skill]
                    if skills:
                        skill_list = ", ".join(skills)
                except Exception:
                    pass

            # Tạo nội dung Text
            content = (
                f"Hồ sơ người dùng: {user.full_name}. "
                f"Vai trò: {user.role}. "
                f"Công việc hiện tại: {user.current_job_title or 'Chưa rõ'}. "
                f"Trình độ học vấn: {user.education_level or 'Chưa rõ'}. "
                f"Kỹ năng sở hữu: {skill_list}. "
                f"Email liên hệ: {user.email}." 
            )

            metadata = {
                "user_id": str(user.id),
                "role": user.role,
                "full_name": user.full_name,
                "email": user.email
            }

            self.save_to_knowledge_base(user.id, 'user_profile', content, metadata)

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