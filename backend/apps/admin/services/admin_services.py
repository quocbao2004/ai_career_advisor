from apps.admin.repositories.admin_repo import Admin_Repository

class AdminServices():

    def __init__(self):
        self.repo = Admin_Repository

    def get_dashboard_stats(self):
        return {
            "total_users": self.repo.count_users(),
            "total_industries": self.repo.count_industries(),
            "total_careers": self.repo.count_careers(),
            "total_courses": self.repo.count_courses(),
        }