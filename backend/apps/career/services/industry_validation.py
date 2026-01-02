from __future__ import annotations

from typing import Any

from django.core.exceptions import ValidationError


VALID_HOLLAND = {"R", "I", "A", "S", "E", "C"}


def is_valid_mbti(code: Any) -> bool:
    if not isinstance(code, str):
        return False
    code = code.strip().upper()
    if len(code) != 4:
        return False
    return (
        code[0] in {"E", "I"}
        and code[1] in {"S", "N"}
        and code[2] in {"T", "F"}
        and code[3] in {"J", "P"}
    )


def is_valid_holland_letter(letter: Any) -> bool:
    if not isinstance(letter, str):
        return False
    return letter.strip().upper() in VALID_HOLLAND


def ensure_numeric_score(value: Any) -> float:
    if isinstance(value, bool):
        raise ValidationError("Score phải là số (ví dụ 80 hoặc 80.5).")
    try:
        if isinstance(value, (int, float)):
            return float(value)
        return float(str(value).strip())
    except Exception:
        raise ValidationError("Score phải là số (ví dụ 80 hoặc 80.5).")


def normalize_industry_maps(
    *,
    mbti_map: Any,
    holland_map: Any,
    enforce_score_range_0_100: bool = True,
) -> tuple[dict[str, float], dict[str, float]]:

    errors: dict[str, list[str] | str] = {}

    # --- mbti_map ---
    if mbti_map is None:
        mbti_map = {}
    if not isinstance(mbti_map, dict):
        errors["mbti_map"] = 'mbti_map phải là JSON object (ví dụ {"INTJ": 90}).'
        normalized_mbti_map: dict[str, float] = {}
    else:
        normalized_mbti_map = {}
        for raw_key, raw_value in mbti_map.items():
            key = str(raw_key).strip().upper()
            if not is_valid_mbti(key):
                errors.setdefault("mbti_map", []).append(
                    f'Mã MBTI không hợp lệ: "{raw_key}". Ví dụ hợp lệ: "INTJ", "ENFP".'
                )
                continue
            try:
                score = ensure_numeric_score(raw_value)
            except ValidationError as e:
                errors.setdefault("mbti_map", []).append(
                    f'Điểm MBTI cho "{key}" không hợp lệ: {e.message}'
                )
                continue
            if enforce_score_range_0_100 and (score < 0 or score > 100):
                errors.setdefault("mbti_map", []).append(
                    f'Điểm MBTI cho "{key}" nên nằm trong 0-100 (đang là {score}).'
                )
                continue
            normalized_mbti_map[key] = score

    # --- holland_map ---
    if holland_map is None:
        holland_map = {}
    if not isinstance(holland_map, dict):
        errors["holland_map"] = 'holland_map phải là JSON object (ví dụ {"R": 40, "I": 90}).'
        normalized_holland_map: dict[str, float] = {}
    else:
        normalized_holland_map = {}
        for raw_key, raw_value in holland_map.items():
            key = str(raw_key).strip().upper()
            if not is_valid_holland_letter(key):
                errors.setdefault("holland_map", []).append(
                    f'Ký tự Holland không hợp lệ: "{raw_key}". Chỉ dùng R, I, A, S, E, C.'
                )
                continue
            try:
                score = ensure_numeric_score(raw_value)
            except ValidationError as e:
                errors.setdefault("holland_map", []).append(
                    f'Điểm Holland cho "{key}" không hợp lệ: {e.message}'
                )
                continue
            if enforce_score_range_0_100 and (score < 0 or score > 100):
                errors.setdefault("holland_map", []).append(
                    f'Điểm Holland cho "{key}" nên nằm trong 0-100 (đang là {score}).'
                )
                continue
            normalized_holland_map[key] = score

    if errors:
        raise ValidationError(errors)

    return normalized_mbti_map, normalized_holland_map


def sanitize_industry_maps(
    *,
    mbti_map: Any,
    holland_map: Any,
) -> tuple[dict[str, float], dict[str, float]]:

    normalized_mbti_map: dict[str, float] = {}
    if isinstance(mbti_map, dict):
        for raw_key, raw_value in mbti_map.items():
            key = str(raw_key).strip().upper()
            if not is_valid_mbti(key):
                continue
            try:
                score = ensure_numeric_score(raw_value)
            except ValidationError:
                continue
            normalized_mbti_map[key] = score

    normalized_holland_map: dict[str, float] = {}
    if isinstance(holland_map, dict):
        for raw_key, raw_value in holland_map.items():
            key = str(raw_key).strip().upper()
            if not is_valid_holland_letter(key):
                continue
            try:
                score = ensure_numeric_score(raw_value)
            except ValidationError:
                continue
            normalized_holland_map[key] = score

    return normalized_mbti_map, normalized_holland_map
