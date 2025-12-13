import google.generativeai as genai

# Dán API Key của bạn vào đây
genai.configure(api_key="AIzaSyDQTzCU65UPlgdNtwcjWH20R-ShRmKM828")

print("--- DANH SÁCH MODEL BẠN ĐƯỢC DÙNG ---")
for m in genai.list_models():
    # Chỉ lấy những model hỗ trợ tạo nội dung (chat)
    if 'generateContent' in m.supported_generation_methods:
        print(f"Tên model: {m.name}")