"""Add onboarding-test mapping columns to industries.

This migration intentionally avoids introducing new tables.
"""

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("career", "0001_initial"),
    ]

    operations = [
        migrations.AddField(
            model_name="industry",
            name="mbti_codes",
            field=models.JSONField(blank=True, default=list),
        ),
        migrations.AddField(
            model_name="industry",
            name="holland_codes",
            field=models.JSONField(blank=True, default=list),
        ),
    ]
