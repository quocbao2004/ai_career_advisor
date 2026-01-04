from django.apps import AppConfig

class AiConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'apps.ai'
    def ready(self):
        import apps.users.management.commands.generate_embeddings
        import apps.ai.signals
