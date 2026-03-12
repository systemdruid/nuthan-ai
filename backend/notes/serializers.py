from rest_framework import serializers
from .models import Note, Tag


class TagSerializer(serializers.ModelSerializer):
    class Meta:
        model = Tag
        fields = ['id', 'name', 'source']


class NoteSerializer(serializers.ModelSerializer):
    tags = TagSerializer(many=True, read_only=True)

    class Meta:
        model = Note
        fields = ['id', 'content', 'type', 'urgent', 'important', 'remind_at', 'tags', 'created_at', 'updated_at']
        read_only_fields = ['id', 'tags', 'created_at', 'updated_at']


class NoteQuerySerializer(serializers.Serializer):
    query = serializers.CharField(max_length=1000)
