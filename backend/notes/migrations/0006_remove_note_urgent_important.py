from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ('notes', '0005_notetag_through_model'),
    ]

    operations = [
        migrations.RemoveField(
            model_name='note',
            name='urgent',
        ),
        migrations.RemoveField(
            model_name='note',
            name='important',
        ),
    ]
