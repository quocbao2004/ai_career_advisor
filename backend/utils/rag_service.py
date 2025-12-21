import google.generativeai as genai
from django.conf import settings
from apps.ai.models import KnowledgeBase
from django.db.models.signals import post_save

def generate_embedding(text):
    """Chuyển text thành vector 768 chiều dùng Gemini"""
    result = genai.embed_content(
        model="models/text-embedding-004",
        content=text,
        task_type="retrieval_document",
        title="Embedding for RAG"
    )
    return result['embedding']

def search_knowledge_base(query_text, limit=3):
    """Tìm kiếm thông tin liên quan trong DB"""
    # 1. Embed câu hỏi của user
    query_vector = genai.embed_content(
        model="models/text-embedding-004",
        content=query_text,
        task_type="retrieval_query"
    )['embedding']

    results = KnowledgeBase.objects.order_by(
        KnowledgeBase.embedding.cosine_distance(query_vector)
    )[:limit]
    
    return results

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