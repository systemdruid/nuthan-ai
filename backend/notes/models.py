from django.conf import settings
from django.db import models


class Tag(models.Model):
    name = models.CharField(max_length=50, unique=True)

    def __str__(self):
        return self.name


class Note(models.Model):
    class NoteType(models.TextChoices):
        NOTE = 'note', 'Note'
        TASK = 'task', 'Task'

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        null=True,
        on_delete=models.CASCADE,
        related_name='notes',
    )
    content = models.TextField()
    type = models.CharField(
        max_length=10,
        choices=NoteType.choices,
        default=NoteType.NOTE,
    )
    remind_at = models.DateTimeField(null=True, blank=True)
    tags = models.ManyToManyField(Tag, through='NoteTag', blank=True, related_name='notes')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return self.content[:50]


class NoteTag(models.Model):
    class Source(models.TextChoices):
        USER = 'user', 'User'
        AI = 'ai', 'AI'

    note = models.ForeignKey(Note, on_delete=models.CASCADE)
    tag = models.ForeignKey(Tag, on_delete=models.CASCADE)
    source = models.CharField(max_length=10, choices=Source.choices, default=Source.AI)

    class Meta:
        unique_together = ('note', 'tag')
