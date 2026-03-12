from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('notes', '0002_remove_note_title'),
    ]

    operations = [
        migrations.AddField(
            model_name='note',
            name='type',
            field=models.CharField(
                choices=[('note', 'Note'), ('task', 'Task')],
                default='note',
                max_length=10,
            ),
        ),
        migrations.AddField(
            model_name='note',
            name='urgent',
            field=models.BooleanField(default=False),
        ),
        migrations.AddField(
            model_name='note',
            name='important',
            field=models.BooleanField(default=False),
        ),
        migrations.AddField(
            model_name='note',
            name='remind_at',
            field=models.DateTimeField(blank=True, null=True),
        ),
    ]
