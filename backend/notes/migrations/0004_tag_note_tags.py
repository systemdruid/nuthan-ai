from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('notes', '0003_note_type_urgent_important_remind_at'),
    ]

    operations = [
        migrations.CreateModel(
            name='Tag',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('name', models.CharField(max_length=50, unique=True)),
                ('source', models.CharField(
                    choices=[('user', 'User'), ('ai', 'AI')],
                    default='ai',
                    max_length=10,
                )),
            ],
        ),
        migrations.AddField(
            model_name='note',
            name='tags',
            field=models.ManyToManyField(blank=True, related_name='notes', to='notes.tag'),
        ),
    ]
