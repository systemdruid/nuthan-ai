from rest_framework import generics, status
from rest_framework.views import APIView
from rest_framework.response import Response
from .models import Note, Tag, NoteTag
from .serializers import NoteSerializer, NoteQuerySerializer, TagSerializer
from .ai_service import find_relevant_notes, classify_note, tag_note


def _apply_ai_tags(note, content):
    """Replace AI-sourced tag associations; user-assigned tags are untouched."""
    NoteTag.objects.filter(note=note, source=NoteTag.Source.AI).delete()
    for name in tag_note(content):
        tag, _ = Tag.objects.get_or_create(name=name)
        NoteTag.objects.get_or_create(note=note, tag=tag, defaults={'source': NoteTag.Source.AI})


class TagListView(generics.ListAPIView):
    serializer_class = TagSerializer

    def get_queryset(self):
        search = self.request.query_params.get('search', '').strip()
        qs = Tag.objects.all()
        if search:
            qs = qs.filter(name__icontains=search)
        return qs.order_by('name')[:20]


class TagConvertToUserView(APIView):
    def post(self, request, pk):
        try:
            tag = Tag.objects.get(pk=pk)
        except Tag.DoesNotExist:
            return Response(status=status.HTTP_404_NOT_FOUND)
        updated = NoteTag.objects.filter(tag=tag, source=NoteTag.Source.AI).update(
            source=NoteTag.Source.USER
        )
        return Response({'tag': tag.name, 'updated_associations': updated})


class NoteListCreateView(generics.ListCreateAPIView):
    queryset = Note.objects.all()
    serializer_class = NoteSerializer

    def perform_create(self, serializer):
        classification = classify_note(serializer.validated_data.get('content', ''))
        note = serializer.save(**classification)

        # Apply user-provided tags first
        for name in self.request.data.get('tag_names', []):
            name = name.lower().strip()
            if name:
                tag, _ = Tag.objects.get_or_create(name=name)
                NoteTag.objects.get_or_create(note=note, tag=tag, defaults={'source': NoteTag.Source.USER})

        # AI tags fill in the rest (won't overwrite user tags due to unique_together)
        _apply_ai_tags(note, note.content)


class NoteDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Note.objects.all()
    serializer_class = NoteSerializer
    http_method_names = ['get', 'patch', 'delete']

    def perform_update(self, serializer):
        note = serializer.save()
        if 'tag_names' in self.request.data:
            NoteTag.objects.filter(note=note, source=NoteTag.Source.USER).delete()
            for name in self.request.data['tag_names']:
                name = name.lower().strip()
                if name:
                    tag, _ = Tag.objects.get_or_create(name=name)
                    NoteTag.objects.get_or_create(note=note, tag=tag, defaults={'source': NoteTag.Source.USER})


class NoteRetagAllView(APIView):
    def post(self, request):
        notes = Note.objects.all()
        for note in notes:
            _apply_ai_tags(note, note.content)
        return Response({"retagged": notes.count()})


class NoteQueryView(APIView):
    def post(self, request):
        serializer = NoteQuerySerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        query = serializer.validated_data['query']
        all_notes = Note.objects.all()

        relevant_ids, explanation = find_relevant_notes(all_notes, query)

        relevant_notes = Note.objects.filter(id__in=relevant_ids)
        note_serializer = NoteSerializer(relevant_notes, many=True)

        return Response({
            "relevant_notes": note_serializer.data,
            "explanation": explanation,
        })
