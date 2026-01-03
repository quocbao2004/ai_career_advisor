from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from django.db.models import Q

# Import Models
from apps.ai.models import KnowledgeBase, ContentType
from apps.career.models import Career, Industry, Course
from apps.ai.services.ai_service import get_embedding

# Cố gắng import User related models
try:
    from apps.users.models import UserSkill, UserProfile, UserInterest
except ImportError:
    UserSkill = UserProfile = UserInterest = None

User = get_user_model()

class Command(BaseCommand):
    help = 'Quét TOÀN BỘ dữ liệu (Database + Static Info + Users) và tạo Vector Embedding'

    def handle(self, *args, **kwargs):
        self.stdout.write(self.style.WARNING("=== BẮT ĐẦU TIẾN TRÌNH EMBEDDING TOÀN BỘ HỆ THỐNG ==="))

        # Tùy chọn: Xóa sạch KnowledgeBase cũ để làm mới (Uncomment nếu cần)
        # self.stdout.write("-> Đang xóa dữ liệu KnowledgeBase cũ...")
        # KnowledgeBase.objects.all().delete()
        
        # --- PHẦN 1: DỮ LIỆU HỆ THỐNG ---
        self.process_industries()
        self.process_skills()   # Embed cho bảng UserSkill
        self.process_careers()  # Embed cho bảng Career + KnowledgeBase
        self.process_courses()  # Embed cho bảng Course + KnowledgeBase

        # --- PHẦN 2: DỮ LIỆU TĨNH ---
        self.process_static_website_data()

        # --- PHẦN 3: DỮ LIỆU NGƯỜI DÙNG ---
        self.process_users()    # Embed cho UserProfile + KnowledgeBase (Private)

        self.stdout.write(self.style.SUCCESS('=== HOÀN TẤT! DỮ LIỆU ĐÃ SẴN SÀNG CHO RAG ==='))

    # ---------------------------------------------------------
    # 1. PROCESS INDUSTRIES
    # ---------------------------------------------------------
    def process_industries(self):
        self.stdout.write("-> 1. Đang xử lý Industries...")
        industries = Industry.objects.all()
        for ind in industries:
            text = f"Ngành nghề: {ind.name}. Mô tả: {ind.description}"
            # Industry thường ít khi search trực tiếp trong RAG, nhưng lưu vào cũng tốt
            self.save_to_knowledge_base(
                ref_id=ind.id,
                type_enum=ContentType.GENERAL_ADVICE, # Hoặc tạo type mới nếu muốn
                text=text,
                metadata={"title": ind.name, "type": "industry"}
            )

    # ---------------------------------------------------------
    # 2. PROCESS SKILLS (Cập nhật vector cho bảng UserSkill)
    # ---------------------------------------------------------
    def process_skills(self):
        if not UserSkill: return
        self.stdout.write("-> 2. Đang xử lý User Skills (Cập nhật vector nội bộ)...")
        
        # Chỉ lấy những skill chưa có embedding để tiết kiệm token
        skills = UserSkill.objects.filter(embedding__isnull=True)
        count = skills.count()
        self.stdout.write(f"   Tìm thấy {count} skill chưa có vector.")

        for skill in skills:
            # Embed tên skill + level
            text = f"{skill.skill_name} level {skill.proficiency_level}"
            vector = get_embedding(text)
            if vector:
                skill.embedding = vector
                skill.save()
                # Lưu ý: UserSkill thường KHÔNG lưu vào KnowledgeBase chung 
                # vì nó quá vụn vặt, ta chỉ lưu vector vào chính bảng UserSkill để matching.

    # ---------------------------------------------------------
    # 3. PROCESS CAREERS
    # ---------------------------------------------------------
    def process_careers(self):
        self.stdout.write("-> 3. Đang xử lý Careers...")
        careers = Career.objects.all()
        for career in careers:
            # Tạo nội dung text đại diện
            text_content = (
                f"Nghề nghiệp: {career.title}\n"
                f"Cấp độ: {career.level}\n"
                f"Mô tả: {career.description}\n"
                f"Mức lương: {career.salary_min} - {career.salary_max}\n"
                f"Triển vọng: {career.future_outlook}"
            )
            
            # Lấy vector
            vector = get_embedding(text_content, task_type="retrieval_document")
            
            if vector:
                # A. Cập nhật vào chính bảng Career (cho Matching)
                career.embedding = vector
                career.save()

                # B. Cập nhật vào KnowledgeBase (cho Chatbot RAG)
                self.save_to_knowledge_base_with_vector(
                    ref_id=career.id,
                    type_enum=ContentType.CAREER,
                    text=text_content,
                    vector=vector,
                    metadata={
                        "title": career.title,
                        "salary_min": float(career.salary_min) if career.salary_min else 0,
                        "type": "career"
                    }
                )

    # ---------------------------------------------------------
    # 4. PROCESS COURSES
    # ---------------------------------------------------------
    def process_courses(self):
        self.stdout.write("-> 4. Đang xử lý Courses...")
        courses = Course.objects.all()
        for course in courses:
            text_content = (
                f"Khóa học: {course.title}\n"
                f"Nguồn: {course.provider}\n"
                f"Mô tả: {course.description}\n"
                f"Trình độ: {course.level}\n"
                f"Thời lượng: {course.duration_hours} giờ"
            )

            vector = get_embedding(text_content, task_type="retrieval_document")

            if vector:
                # A. Update Model Course
                course.embedding = vector
                course.save()

                # B. Update KnowledgeBase
                self.save_to_knowledge_base_with_vector(
                    ref_id=course.id,
                    type_enum=ContentType.COURSE,
                    text=text_content,
                    vector=vector,
                    metadata={
                        "title": course.title,
                        "provider": course.provider,
                        "url": course.url,
                        "type": "course"
                    }
                )

    # ---------------------------------------------------------
    # 5. PROCESS USERS (Quan trọng: Bảo mật)
    # ---------------------------------------------------------
    def process_users(self):
        self.stdout.write("-> 5. Đang xử lý User Profiles...")
        users = User.objects.filter(is_active=True)
        
        for user in users:
            try:
                profile = getattr(user, 'profile', None)
                if not profile: continue

                # 1. Gom dữ liệu
                job = profile.current_job_title or "Chưa có việc làm"
                edu = profile.education_level or "Chưa cập nhật"
                
                # Lấy Skills
                skills_qs = getattr(user, 'skills', [])
                skills_str = ", ".join([f"{s.skill_name} (Lv{s.proficiency_level})" for s in skills_qs.all()]) if skills_qs else ""
                
                # Lấy Interests
                interests_qs = getattr(user, 'interests', [])
                inter_str = ", ".join([i.keyword for i in interests_qs.all()]) if interests_qs else ""

                full_text = (
                    f"Hồ sơ người dùng {user.full_name}:\n"
                    f"- Công việc: {job}. Học vấn: {edu}.\n"
                    f"- Kỹ năng: {skills_str}.\n"
                    f"- Sở thích: {inter_str}."
                )

                # 2. Tạo vector
                vector = get_embedding(full_text, task_type="retrieval_document")

                if vector:
                    # A. Update UserProfile
                    UserProfile.objects.filter(id=profile.id).update(profile_vector=vector)

                    # B. Update KnowledgeBase (Loại USER_CONTEXT)
                    # QUAN TRỌNG: Metadata phải có user_id
                    self.save_to_knowledge_base_with_vector(
                        ref_id=user.id,
                        type_enum=ContentType.USER_CONTEXT, # Đảm bảo model đã có enum này
                        text=full_text,
                        vector=vector,
                        metadata={
                            "user_id": str(user.id),  # Key bảo mật
                            "type": "private_profile",
                            "name": user.full_name
                        }
                    )
            except Exception as e:
                self.stdout.write(self.style.ERROR(f"Lỗi user {user.email}: {e}"))

    # ---------------------------------------------------------
    # 6. STATIC DATA
    # ---------------------------------------------------------
    def process_static_website_data(self):
        self.stdout.write("-> 6. Đang xử lý Static Website Data...")
        static_data = [
            {
                "id": "static_about_us",
                "type": ContentType.GENERAL_ADVICE,
                "text": "Giới thiệu: Đây là hệ thống AI Career Advisor, chuyên cung cấp lộ trình nghề nghiệp cá nhân hóa.",
                "meta": {"section": "About Us"}
            },
            {
                "id": "static_contact",
                "type": ContentType.GENERAL_ADVICE,
                "text": "Thông tin liên hệ: Email hỗ trợ support@careeradvisor.vn, Hotline 1900-xxxx.",
                "meta": {"section": "Contact"}
            },
             # Thêm các prompt hệ thống vào vector DB để AI hiểu luật chơi cũng là 1 ý hay
        ]

        for item in static_data:
            self.save_to_knowledge_base(
                ref_id=item["id"],
                type_enum=item["type"],
                text=item["text"],
                metadata=item["meta"]
            )

    # ---------------------------------------------------------
    # UTILS: SAVE FUNCTION
    # ---------------------------------------------------------
    def save_to_knowledge_base(self, ref_id, type_enum, text, metadata):
        """Hàm này tự gọi API embedding rồi lưu"""
        text = text.replace("\n", " ").strip()
        if not text: return

        # Kiểm tra trùng lặp cơ bản (Nếu muốn update đè thì bỏ check này)
        # if KnowledgeBase.objects.filter(reference_id=str(ref_id), content_type=type_enum).exists():
        #     return

        vector = get_embedding(text, task_type="retrieval_document")
        if vector:
            self.save_to_knowledge_base_with_vector(ref_id, type_enum, text, vector, metadata)

    def save_to_knowledge_base_with_vector(self, ref_id, type_enum, text, vector, metadata):
        """Hàm này lưu khi đã có sẵn vector (để tránh gọi API 2 lần)"""
        KnowledgeBase.objects.update_or_create(
            content_type=type_enum,
            reference_id=str(ref_id),
            defaults={
                'content_text': text,
                'embedding': vector,
                'metadata': metadata
            }
        )
        # In ra log gọn hơn
        title = metadata.get('title') or metadata.get('name') or str(ref_id)
        self.stdout.write(f"   + [OK] {type_enum}: {title}")