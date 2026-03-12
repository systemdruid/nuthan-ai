from django.db import migrations, models
import django.db.models.deletion


def migrate_tags_to_through(apps, schema_editor):
    """Copy existing implicit M2M associations to NoteTag with source='ai'."""
    Note = apps.get_model('notes', 'Note')
    NoteTag = apps.get_model('notes', 'NoteTag')
    for note in Note.objects.prefetch_related('tags').all():
        for tag in note.tags.all():
            NoteTag.objects.get_or_create(note=note, tag=tag, defaults={'source': 'ai'})


class Migration(migrations.Migration):

    dependencies = [
        ('notes', '0004_tag_note_tags'),
    ]

    operations = [
        # 1. Create the through model
        migrations.CreateModel(
            name='NoteTag',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('source', models.CharField(
                    choices=[('user', 'User'), ('ai', 'AI')],
                    default='ai',
                    max_length=10,
                )),
                ('note', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to='notes.note')),
                ('tag', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to='notes.tag')),
            ],
            options={
                'unique_together': {('note', 'tag')},
            },
        ),
        # 2. Migrate existing data to the through model
        migrations.RunPython(migrate_tags_to_through, migrations.RunPython.noop),
        # 3. Remove the old implicit M2M field (drops notes_note_tags table)
        migrations.RemoveField(
            model_name='note',
            name='tags',
        ),
        # 4. Add the new M2M field using the through model
        migrations.AddField(
            model_name='note',
            name='tags',
            field=models.ManyToManyField(blank=True, related_name='notes', through='notes.NoteTag', to='notes.tag'),
        ),
        # 5. Remove source from Tag (it now lives on NoteTag)
        migrations.RemoveField(
            model_name='tag',
            name='source',
        ),
    ]
