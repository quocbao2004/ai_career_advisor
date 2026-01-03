import time
import os
from django.core.management.base import BaseCommand
from django.conf import settings
from apps.users.models import UserProfile, UserSkill 
import google.generativeai as genai
from dotenv import load_dotenv

load_dotenv()

api_key = os.environ.get("GEMINI_API_KEY")

class Command(BaseCommand):
    help = 'Tạo embedding cho cả UserProfile và từng UserSkill'

    def handle(self, *args, **kwargs):
        if not api_key:
            self.stdout.write(self.style.ERROR("Chưa cấu hình GEMINI_API_KEY!"))
            return

        genai.configure(api_key=api_key)

        # ====================================================
        # PHẦN 1: EMBEDDING CHO TỪNG SKILL RIÊNG LẺ (Cái bạn đang cần)
        # ====================================================
        skills = UserSkill.objects.filter(embedding__isnull=True)
        total_skills = skills.count()
        
        if total_skills > 0:
            self.stdout.write(self.style.WARNING(f"--- Bắt đầu tạo vector cho {total_skills} UserSkill ---"))
            
            for i, skill in enumerate(skills):
                try:
                    # Tạo vector cho tên kỹ năng (VD: "Python Programming")
                    # Task type là 'retrieval_document' vì lưu vào DB
                    result = genai.embed_content(
                        model="models/text-embedding-004",
                        content=skill.skill_name,
                        task_type="retrieval_document",
                        title=f"Skill: {skill.skill_name}"
                    )
                    
                    skill.embedding = result['embedding']
                    skill.save()
                    
                    self.stdout.write(f"Skill [{i+1}/{total_skills}]: {skill.skill_name} -> OK")
                    time.sleep(0.3) # Sleep nhẹ

                except Exception as e:
                    self.stdout.write(self.style.ERROR(f"Lỗi Skill ID {skill.id}: {e}"))
        else:
            self.stdout.write("Toàn bộ UserSkill đã có vector, bỏ qua phần này.")

        self.stdout.write("--------------------------------------------------")

        # ====================================================
        # PHẦN 2: EMBEDDING TỔNG HỢP CHO USER PROFILE (RAG)
        # ====================================================
        profiles = UserProfile.objects.filter(profile_vector__isnull=True)\
            .select_related('user')\
            .prefetch_related('user__interests', 'user__skills')
        
        total_profiles = profiles.count()
        
        if total_profiles > 0:
            self.stdout.write(self.style.WARNING(f"--- Bắt đầu tạo vector tổng hợp cho {total_profiles} UserProfile ---"))

            for i, profile in enumerate(profiles):
                try:
                    # Lấy text skills
                    skills_qs = profile.user.skills.all()
                    skills_str = ", ".join([f"{s.skill_name} (Lv {s.proficiency_level})" for s in skills_qs])
                    
                    # Lấy text interests
                    interests_qs = profile.user.interests.all()
                    interests_str = ", ".join([i.keyword for i in interests_qs])

                    text_content = f"""
                    Job: {profile.current_job_title}
                    Edu: {profile.get_education_level_display()}
                    Bio: {profile.bio}
                    Skills: {skills_str}
                    Interests: {interests_str}
                    """.strip()

                    if len(text_content) < 10: continue

                    result = genai.embed_content(
                        model="models/text-embedding-004",
                        content=text_content,
                        task_type="retrieval_document",
                        title=f"Profile: {profile.user.email}"
                    )

                    profile.profile_vector = result['embedding']
                    profile.save()

                    self.stdout.write(self.style.SUCCESS(f"Profile [{i+1}/{total_profiles}]: {profile.user.email} -> OK"))
                    time.sleep(0.5)

                except Exception as e:
                    self.stdout.write(self.style.ERROR(f"Lỗi Profile {profile.id}: {e}"))
        else:
             self.stdout.write("Toàn bộ UserProfile đã có vector.")

        self.stdout.write(self.style.SUCCESS("\n=== HOÀN TẤT TOÀN BỘ ==="))