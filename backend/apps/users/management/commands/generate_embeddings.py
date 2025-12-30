import time
import os
from django.core.management.base import BaseCommand
from django.conf import settings
from apps.users.models import UserProfile
import google.generativeai as genai
from dotenv import load_dotenv

load_dotenv()

api_key = os.environ.get("GEMINI_API_KEY")

if not api_key:
    print("CẢNH BÁO: Chưa cấu hình GEMINI_API_KEY trong file .env")
else:
    genai.configure(api_key=api_key)

class Command(BaseCommand):
    help = 'Tạo embedding cho UserProfile sử dụng Google Gemini'

    def handle(self, *args, **kwargs):
        if not api_key:
            self.stdout.write(self.style.ERROR("Chưa cấu hình GOOGLE_API_KEY!"))
            return

        genai.configure(api_key=api_key)

        profiles = UserProfile.objects.filter(profile_vector__isnull=True).select_related('user')
        
        total = profiles.count()
        self.stdout.write(f"Tìm thấy {total} UserProfile cần tạo vector...")

        for i, profile in enumerate(profiles):
            try:
                interests_qs = profile.user.interests.all()
                interests_str = ", ".join([i.keyword for i in interests_qs])
                text_content = f"""
                Job Title: {profile.current_job_title or 'Unknown'}
                Education: {profile.get_education_level_display() or 'Unknown'}
                Bio: {profile.bio or ''}
                MBTI: {profile.mbti_result or ''}
                Holland Code: {profile.holland_result or ''}
                Interests: {interests_str}
                """.strip()

                if len(text_content) < 20: 
                    self.stdout.write(self.style.WARNING(f"Skipping User {profile.user.email} (Not enough info)"))
                    continue

                result = genai.embed_content(
                    model="models/text-embedding-004",
                    content=text_content,
                    task_type="retrieval_document",
                    title=f"Profile of {profile.user.full_name}" 
                )

                profile.profile_vector = result['embedding']
                profile.save()

                self.stdout.write(self.style.SUCCESS(f"[{i+1}/{total}] OK: {profile.user.email}"))
                
                time.sleep(0.5) 

            except Exception as e:
                self.stdout.write(self.style.ERROR(f"Lỗi tại User {profile.user_id}: {str(e)}"))

        self.stdout.write(self.style.SUCCESS("Hoàn tất quá trình embedding User!"))