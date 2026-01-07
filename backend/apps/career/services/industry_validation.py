from __future__ import annotations
from typing import Any
from django.core.exceptions import ValidationError

# Các ký tự Holland hợp lệ
VALID_HOLLAND = {"R", "I", "A", "S", "E", "C"}

# Kiểm tra mã MBTI có hợp lệ không (4 ký tự, đúng vị trí)
def is_valid_mbti(code: Any) -> bool:
    # Kiểm tra kiểu dữ liệu
    if not isinstance(code, str):
        return False
    # Chuẩn hóa chuỗi
    code = code.strip().upper()
    # Kiểm tra độ dài
    if len(code) != 4:
        return False
    # Kiểm tra từng vị trí
    return (
        code[0] in {"E", "I"}
        and code[1] in {"S", "N"}
        and code[2] in {"T", "F"}
        and code[3] in {"J", "P"}
    )

# Kiểm tra ký tự Holland có hợp lệ không
def is_valid_holland_letter(letter: Any) -> bool:
    # Kiểm tra kiểu dữ liệu
    if not isinstance(letter, str):
        return False
    # Kiểm tra trong tập hợp hợp lệ
    return letter.strip().upper() in VALID_HOLLAND

# Chuyển đổi giá trị thành số float, raise lỗi nếu không hợp lệ
def ensure_numeric_score(value: Any) -> float:
    # Không chấp nhận boolean
    if isinstance(value, bool):
        raise ValidationError("Score phải là số (ví dụ 80 hoặc 80.5).")
    try:
        # Nếu đã là số, chuyển thành float
        if isinstance(value, (int, float)):
            return float(value)
        # Nếu là chuỗi, chuyển thành float
        return float(str(value).strip())
    except Exception:
        raise ValidationError("Score phải là số (ví dụ 80 hoặc 80.5).")


        raise ValidationError("Score phải là số (ví dụ 80 hoặc 80.5).")


# Chuẩn hóa và validate các map ngành nghề cho MBTI và Holland
def normalize_industry_maps(
    *,
    mbti_map: Any,
    holland_map: Any,
    enforce_score_range_0_100: bool = True,
) -> tuple[dict[str, float], dict[str, float]]:

    # Thu thập lỗi validation
    errors: dict[str, list[str] | str] = {}

    # Xử lý mbti_map
    if mbti_map is None:
        mbti_map = {}
    if not isinstance(mbti_map, dict):
        errors["mbti_map"] = 'mbti_map phải là JSON object (ví dụ {"INTJ": 90}).'
        normalized_mbti_map: dict[str, float] = {}
    else:
        normalized_mbti_map = {}
        for raw_key, raw_value in mbti_map.items():
            # Chuẩn hóa key
            key = str(raw_key).strip().upper()
            # Kiểm tra mã MBTI hợp lệ
            if not is_valid_mbti(key):
                errors.setdefault("mbti_map", []).append(
                    f'Mã MBTI không hợp lệ: "{raw_key}". Ví dụ hợp lệ: "INTJ", "ENFP".'
                )
                continue
            try:
                # Chuyển đổi điểm thành số
                score = ensure_numeric_score(raw_value)
            except ValidationError as e:
                errors.setdefault("mbti_map", []).append(
                    f'Điểm MBTI cho "{key}" không hợp lệ: {e.message}'
                )
                continue
            # Kiểm tra phạm vi điểm nếu yêu cầu
            if enforce_score_range_0_100 and (score < 0 or score > 100):
                errors.setdefault("mbti_map", []).append(
                    f'Điểm MBTI cho "{key}" nên nằm trong 0-100 (đang là {score}).'
                )
                continue
            normalized_mbti_map[key] = score

    # Xử lý holland_map
    if holland_map is None:
        holland_map = {}
    if not isinstance(holland_map, dict):
        errors["holland_map"] = 'holland_map phải là JSON object (ví dụ {"R": 40, "I": 90}).'
        normalized_holland_map: dict[str, float] = {}
    else:
        normalized_holland_map = {}
        for raw_key, raw_value in holland_map.items():
            # Chuẩn hóa key
            key = str(raw_key).strip().upper()
            # Kiểm tra ký tự Holland hợp lệ
            if not is_valid_holland_letter(key):
                errors.setdefault("holland_map", []).append(
                    f'Ký tự Holland không hợp lệ: "{raw_key}". Chỉ dùng R, I, A, S, E, C.'
                )
                continue
            try:
                # Chuyển đổi điểm thành số
                score = ensure_numeric_score(raw_value)
            except ValidationError as e:
                errors.setdefault("holland_map", []).append(
                    f'Điểm Holland cho "{key}" không hợp lệ: {e.message}'
                )
                continue
            # Kiểm tra phạm vi điểm nếu yêu cầu
            if enforce_score_range_0_100 and (score < 0 or score > 100):
                errors.setdefault("holland_map", []).append(
                    f'Điểm Holland cho "{key}" nên nằm trong 0-100 (đang là {score}).'
                )
                continue
            normalized_holland_map[key] = score

    # Nếu có lỗi, raise ValidationError
    if errors:
        raise ValidationError(errors)

    return normalized_mbti_map, normalized_holland_map


# Làm sạch các map ngành nghề, bỏ qua dữ liệu không hợp lệ
def sanitize_industry_maps(
    *,
    mbti_map: Any,
    holland_map: Any,
) -> tuple[dict[str, float], dict[str, float]]:

    # Xử lý mbti_map
    normalized_mbti_map: dict[str, float] = {}
    if isinstance(mbti_map, dict):
        for raw_key, raw_value in mbti_map.items():
            # Chuẩn hóa key
            key = str(raw_key).strip().upper()
            # Bỏ qua nếu không hợp lệ
            if not is_valid_mbti(key):
                continue
            try:
                # Chuyển đổi điểm
                score = ensure_numeric_score(raw_value)
            except ValidationError:
                continue
            normalized_mbti_map[key] = score

    # Xử lý holland_map
    normalized_holland_map: dict[str, float] = {}
    if isinstance(holland_map, dict):
        for raw_key, raw_value in holland_map.items():
            # Chuẩn hóa key
            key = str(raw_key).strip().upper()
            # Bỏ qua nếu không hợp lệ
            if not is_valid_holland_letter(key):
                continue
            try:
                # Chuyển đổi điểm
                score = ensure_numeric_score(raw_value)
            except ValidationError:
                continue
            normalized_holland_map[key] = score

    return normalized_mbti_map, normalized_holland_map
