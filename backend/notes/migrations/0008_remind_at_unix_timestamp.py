from django.db import migrations, models


def datetime_to_unix(apps, schema_editor):
    Note = apps.get_model('notes', 'Note')
    for note in Note.objects.filter(remind_at_dt__isnull=False):
        note.remind_at = int(note.remind_at_dt.timestamp())
        note.save(update_fields=['remind_at'])


class Migration(migrations.Migration):

    dependencies = [
        ('notes', '0007_note_user'),
    ]

    operations = [
        migrations.RenameField(
            model_name='note',
            old_name='remind_at',
            new_name='remind_at_dt',
        ),
        migrations.AddField(
            model_name='note',
            name='remind_at',
            field=models.BigIntegerField(null=True, blank=True),
        ),
        migrations.RunPython(datetime_to_unix, migrations.RunPython.noop),
        migrations.RemoveField(
            model_name='note',
            name='remind_at_dt',
        ),
    ]
