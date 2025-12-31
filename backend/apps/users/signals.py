# from django.db.models.signals import post_save
# from django.dispatch import receiver
# from apps.users.models import User, UserProfile
# from django.db import IntegrityError
# import logging

# logger = logging.getLogger(__name__)


# @receiver(post_save, sender=User)
# def create_user_profile(sender, instance, created, **kwargs):
#     """
#     Tự động tạo UserProfile khi User được tạo
#     """
#     if created:
#         try:
#             # Dùng get_or_create để tránh lỗi duplicate key
#             profile, profile_created = UserProfile.objects.get_or_create(user=instance)
#             if profile_created:
#                 logger.info(f"UserProfile created for user: {instance.email}")
#             else:
#                 logger.info(f"UserProfile already exists for user: {instance.email}")
#         except Exception as e:
#             logger.error(f"Error creating UserProfile for {instance.email}: {e}")


# @receiver(post_save, sender=User)
# def save_user_profile(sender, instance, created, **kwargs):
#     """
#     Đảm bảo UserProfile tồn tại khi User được lưu (backup signal)
#     """
#     if not created:  # Chỉ chạy khi update, không chạy khi create để tránh conflict với signal trên
#         try:
#             # Kiểm tra an toàn bằng query thay vì hasattr
#             if not UserProfile.objects.filter(user=instance).exists():
#                 UserProfile.objects.create(user=instance)
#                 logger.info(f"UserProfile created (on save) for user: {instance.email}")
#         except IntegrityError:
#             # Profile đã tồn tại, bỏ qua
#             pass
#         except Exception as e:
#             logger.error(f"Error ensuring UserProfile for {instance.email}: {e}")
