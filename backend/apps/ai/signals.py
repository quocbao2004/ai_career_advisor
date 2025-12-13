from django.db.models.signals import post_save
from django.dispatch import receiver
from .models import KnowledgeBase
import google.generativeai as genai
import os

def generate_embedding(text):
    if not text:
        return None
    try:
        result = genai.embed_content(
            model="models/text-embedding-004",
            content=text,
            task_type="retrieval_document"
        )
        return result['embedding']
    except Exception as e:
        print(f"Lỗi embedding: {e}")
        return None

@receiver(post_save, sender=KnowledgeBase)
def update_knowledge_embedding(sender, instance, created, **kwargs):
    """
    Tự động chạy khi KnowledgeBase được Insert hoặc Update.
    """
    
    if created or not instance.embedding: 
        vector = generate_embedding(instance.content_text)
        if vector:
            KnowledgeBase.objects.filter(pk=instance.pk).update(embedding=vector)
            print(f"Đã tạo embedding cho: {instance.content_text[:20]}...")