from apps.career.models import Career, Industry
from apps.courses.models import Course
from apps.users.models import User, MasterSkill


class Admin_Repository:
    def count_users(self):
        return User.objects.filter(is_active=True).count()
    def count_industries(self):
        return Industry.objects.count()
    def count_careers(self):
        return Career.objects.count()
    def count_courses(self):
        return Course.objects.count()
    def count_skills(self):
        return MasterSkill.objects.count()
