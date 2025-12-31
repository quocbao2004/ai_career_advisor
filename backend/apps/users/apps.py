from django.apps import AppConfig


class UsersConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'apps.users'
    
    def ready(self):
        import apps.users.signals  # Import signals để đăng ký
        import apps.users.management.commands.generate_embeddings