from django.db import models


class Note(models.Model):
    class NoteType(models.TextChoices):
        NOTE = 'note', 'Note'
        TASK = 'task', 'Task'

    content = models.TextField()
    type = models.CharField(
        max_length=10,
        choices=NoteType.choices,
        default=NoteType.NOTE,
    )
    urgent = models.BooleanField(default=False)
    important = models.BooleanField(default=False)
    remind_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return self.content[:50]
