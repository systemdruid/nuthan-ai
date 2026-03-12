from rest_framework import serializers
from .models import Note, Tag


class TagSerializer(serializers.ModelSerializer):
    class Meta:
        model = Tag
        fields = ['id', 'name']


class NoteSerializer(serializers.ModelSerializer):
    tags = serializers.SerializerMethodField()

    def get_tags(self, obj):
        return [
            {'id': nt.tag.id, 'name': nt.tag.name, 'source': nt.source}
            for nt in obj.notetag_set.select_related('tag').all()
        ]

    class Meta:
        model = Note
        fields = ['id', 'content', 'type', 'remind_at', 'tags', 'created_at', 'updated_at']
        read_only_fields = ['id', 'tags', 'created_at', 'updated_at']


class NoteQuerySerializer(serializers.Serializer):
    query = serializers.CharField(max_length=1000)
