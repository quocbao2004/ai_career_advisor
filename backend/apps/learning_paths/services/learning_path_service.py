
import json
import re
from apps.ai.services.ai_service import get_embedding
from apps.career.models import Course
from pgvector.django import CosineDistance

def _clean_json_string(json_str):
    if not json_str: return "[]"
    clean_str = re.sub(r'```json\s*', '', json_str)
    clean_str = re.sub(r'```', '', clean_str)
    return clean_str.strip()

def _find_matching_course(step_description):
    try:
        step_vector = get_embedding(step_description, task_type="retrieval_query")
        if not step_vector: return None

        match = Course.objects.annotate(
            distance=CosineDistance('embedding', step_vector)
        ).order_by('distance').first()

        if match and match.distance < 0.45: 
            return match
    except Exception as e:
        print(f"Vector matching error: {e}")
    return None