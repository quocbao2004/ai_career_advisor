# Service để tạo embedding cho Course model sử dụng Gemini AI
import os
import time
import google.generativeai as genai
from dotenv import load_dotenv
from apps.career.models import Course

# Load biến môi trường từ file .env
load_dotenv()

# Cấu hình Gemini API
api_key = os.environ.get("GEMINI_API_KEY")
if api_key:
    genai.configure(api_key=api_key)


def create_course_embedding_text(course):
    """
    Gộp các fields của Course thành 1 đoạn text để tạo embedding
    Sử dụng: title, provider, description, url, price, duration_hours, level
    
    Returns:
        str: Text đã được format, ngăn cách bởi ' | '
    """
    parts = []
    
    if course.title:
        parts.append(f"Tiêu đề: {course.title}")
    
    if course.provider:
        parts.append(f"Nhà cung cấp: {course.provider}")
    
    if course.description:
        parts.append(f"Mô tả: {course.description}")
    
    if course.url:
        parts.append(f"URL: {course.url}")
    
    if course.price is not None:
        parts.append(f"Giá: {course.price}")
    
    if course.duration_hours:
        parts.append(f"Thời lượng: {course.duration_hours} giờ")
    
    if course.level:
        parts.append(f"Cấp độ: {course.level}")
    
    # Gộp tất cả các phần lại, ngăn cách bởi ' | '
    return " | ".join(parts)


def get_course_embedding(text):
    """
    Gọi Gemini API để tạo embedding vector (768 chiều) từ text
    
    Args:
        text: Chuỗi text cần embedding
        
    Returns:
        list: Vector embedding 768 chiều, hoặc None nếu lỗi
    """
    if not text:
        return None
    
    # Làm sạch text: bỏ xuống dòng, trim khoảng trắng
    text = text.replace("\n", " ").strip()
    
    try:
        result = genai.embed_content(
            model="models/text-embedding-004",
            content=text,
            task_type="retrieval_document",
            title="Course Embedding"
        )
        return result['embedding']
    except Exception as e:
        print(f"Lỗi tạo embedding: {e}")
        return None


def embed_course(course_id):
    """
    Tạo embedding cho 1 khóa học cụ thể
    
    Args:
        course_id: ID của course cần embedding
        
    Returns:
        bool: True nếu thành công, False nếu thất bại
    """
    try:
        # Lấy course từ database
        course = Course.objects.get(id=course_id)
        
        # Tạo text và embedding
        text = create_course_embedding_text(course)
        embedding = get_course_embedding(text)
        
        # Lưu vào database nếu thành công
        if embedding:
            course.embedding = embedding
            course.save(update_fields=['embedding'])
            return True
        return False
    except Course.DoesNotExist:
        print(f"Không tìm thấy course ID: {course_id}")
        return False
    except Exception as e:
        print(f"Lỗi: {e}")
        return False


def embed_courses_batch(batch_size=50, delay_between_batches=5, re_embed=False):
    """
    Tạo embedding cho nhiều courses theo batch (tránh rate limit của API)
    
    Args:
        batch_size: Số lượng courses xử lý mỗi batch (mặc định: 50)
        delay_between_batches: Thời gian nghỉ giữa các batch, đơn vị: giây (mặc định: 5s)
        re_embed: False = chỉ embedding courses chưa có (khuyến nghị)
                 True = embedding lại tất cả courses
                 
    Returns:
        dict: {'total': tổng số, 'success': số thành công, 'failed': số thất bại}
        
    Usage:
        embed_courses_batch()  # Embedding courses chưa có
        embed_courses_batch(re_embed=True)  # Embedding lại tất cả
    """
    # Lấy danh sách courses cần embedding
    if re_embed:
        courses = Course.objects.all()  # Embedding lại tất cả
    else:
        courses = Course.objects.filter(embedding__isnull=True)  # Chỉ lấy chưa có
    
    total = courses.count()
    
    # Kiểm tra có courses nào cần xử lý không
    if total == 0:
        print("Tất cả courses đã có embedding")
        return {'total': 0, 'success': 0, 'failed': 0}
    
    success = 0
    failed = 0
    batches = (total + batch_size - 1) // batch_size  # Tính số batch cần xử lý
    
    print(f"Tìm thấy {total} courses cần embedding")
    print(f"Sẽ xử lý {batches} batch, mỗi batch {batch_size} courses\n")
    
    # Xử lý từng batch
    for batch_num in range(batches):
        start_idx = batch_num * batch_size
        end_idx = min(start_idx + batch_size, total)
        batch_courses = courses[start_idx:end_idx]
        
        print(f"{'='*50}")
        print(f"BATCH {batch_num + 1}/{batches} (courses {start_idx + 1}-{end_idx})")
        print(f"{'='*50}")
        
        # Xử lý từng course trong batch
        for i, course in enumerate(batch_courses, start_idx + 1):
            try:
                print(f"[{i}/{total}] {course.title[:50]}...")
                
                # Tạo text và embedding
                text = create_course_embedding_text(course)
                embedding = get_course_embedding(text)
                
                # Lưu vào database nếu thành công
                if embedding:
                    course.embedding = embedding
                    course.save(update_fields=['embedding'])
                    success += 1
                else:
                    failed += 1
                
                # Delay 0.5s giữa mỗi request để tránh rate limit
                time.sleep(0.5)
                
            except Exception as e:
                failed += 1
                continue
        
        # Nghỉ giữa các batch
        if batch_num < batches - 1:
            print(f"\nNghỉ {delay_between_batches}s trước batch tiếp theo...")
            time.sleep(delay_between_batches)
    
    print(f"\n{'='*60}")
    print(f"HOÀN THÀNH: {success}/{total} thành công, {failed} thất bại")
    print(f"{'='*60}")
    return {'total': total, 'success': success, 'failed': failed}


def check_embedding_status():
    """
    Kiểm tra trạng thái embedding của courses trong database
    
    Returns:
        dict: {
            'total': tổng số courses,
            'with_embedding': số courses đã có embedding,
            'without_embedding': số courses chưa có embedding,
            'percentage': % đã có embedding
        }
    """
    total = Course.objects.count()
    without_embedding = Course.objects.filter(embedding__isnull=True).count()
    with_embedding = total - without_embedding
    percentage = (with_embedding / total * 100) if total > 0 else 0
    
    return {
        'total': total,
        'with_embedding': with_embedding,
        'without_embedding': without_embedding,
        'percentage': round(percentage, 1)
    }


def fix_missing_embeddings(batch_size=50, delay_between_batches=5):
    """
    Tự động fix các courses thiếu embedding
    
    Returns:
        dict hoặc None nếu không có gì cần fix
    """
    status = check_embedding_status()
    
    if status['without_embedding'] == 0:
        print("✓ Tất cả courses đã có embedding!")
        return None
    
    print(f"⚠️  Phát hiện {status['without_embedding']} courses thiếu embedding")
    print(f"Bắt đầu fix...")
    
    return embed_courses_batch(
        batch_size=batch_size,
        delay_between_batches=delay_between_batches,
        re_embed=False
    )