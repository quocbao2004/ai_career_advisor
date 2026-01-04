from django import forms
from django.contrib import admin

from apps.career.models import Industry, Career, Course
from apps.career.services.industry_validation import normalize_industry_maps


class IndustryAdminForm(forms.ModelForm):
	def clean(self):
		cleaned_data = super().clean()

		normalized_mbti_map, normalized_holland_map = normalize_industry_maps(
			mbti_map=cleaned_data.get("mbti_map"),
			holland_map=cleaned_data.get("holland_map"),
			enforce_score_range_0_100=True,
		)
		cleaned_data["mbti_map"] = normalized_mbti_map
		cleaned_data["holland_map"] = normalized_holland_map
		return cleaned_data

	class Meta:
		model = Industry
		fields = "__all__"


@admin.register(Industry)
class IndustryAdmin(admin.ModelAdmin):
	form = IndustryAdminForm
	list_display = ("name", "mbti_map", "holland_map", "created_at")
	search_fields = ("name",)
	list_filter = ("created_at",)


@admin.register(Career)
class CareerAdmin(admin.ModelAdmin):
	list_display = ("title", "level", "industry")
	search_fields = ("title", "description")
	list_filter = ("industry",)


@admin.register(Course)
class CourseAdmin(admin.ModelAdmin):
	list_display = ("title", "provider", "level")
	search_fields = ("title", "provider")
