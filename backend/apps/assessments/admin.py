from django.contrib import admin
from django.utils.html import format_html
from apps.users.models import PersonalityTest


@admin.register(PersonalityTest)
class PersonalityTestAdmin(admin.ModelAdmin):
    """Admin cho Personality Test Results"""
    
    list_display = ['id', 'user_email', 'user_name', 'test_type_display', 'result_code', 'taken_at']
    list_filter = ['test_type', 'taken_at']
    search_fields = ['user__email', 'user__full_name', 'summary_code']
    readonly_fields = ['id', 'raw_result', 'taken_at']
    ordering = ['-taken_at']
    
    fieldsets = (
        ('User Information', {
            'fields': ('id', 'user')
        }),
        ('Assessment Details', {
            'fields': ('test_type', 'summary_code')
        }),
        ('Results', {
            'fields': ('raw_result',),
            'classes': ('collapse',)
        }),
        ('Timestamps', {
            'fields': ('taken_at',),
            'classes': ('collapse',)
        })
    )
    
    def user_email(self, obj):
        return obj.user.email
    user_email.short_description = 'User Email'
    
    def user_name(self, obj):
        return obj.user.full_name if obj.user.full_name else obj.user.email
    user_name.short_description = 'User Name'
    
    def test_type_display(self, obj):
        if obj.test_type == 'HOLLAND':
            color = '#059669'  # Green
            label = 'Holland'
        elif obj.test_type == 'MBTI':
            color = '#4f46e5'  # Indigo
            label = 'MBTI'
        else:
            color = '#6c757d'  # Gray
            label = obj.test_type
        
        return format_html(
            '<span style="background-color: {}; color: white; padding: 3px 10px; border-radius: 3px;">{}</span>',
            color,
            label
        )
    test_type_display.short_description = 'Test Type'
    
    def result_code(self, obj):
        if obj.summary_code:
            if obj.test_type == 'HOLLAND':
                color = '#059669'
            else:
                color = '#4f46e5'
            
            return format_html(
                '<span style="background-color: {}; color: white; padding: 3px 8px; border-radius: 3px; font-weight: bold;">{}</span>',
                color,
                obj.summary_code
            )
        return '-'
    result_code.short_description = 'Result Code'

