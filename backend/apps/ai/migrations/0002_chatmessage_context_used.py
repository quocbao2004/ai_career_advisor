from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('ai', '0001_initial'),
    ]

    operations = [
        migrations.SeparateDatabaseAndState(
            database_operations=[
                migrations.RunSQL(
                    sql=(
                        "ALTER TABLE chat_messages "
                        "ADD COLUMN IF NOT EXISTS context_used jsonb NOT NULL DEFAULT '[]'::jsonb;"
                    ),
                    reverse_sql=(
                        "ALTER TABLE chat_messages "
                        "DROP COLUMN IF EXISTS context_used;"
                    ),
                )
            ],
            state_operations=[
                migrations.AddField(
                    model_name='chatmessage',
                    name='context_used',
                    field=models.JSONField(blank=True, default=list),
                )
            ],
        )
    ]
