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
        updated = NoteTag.objects.filter(
            tag=tag,
            source=NoteTag.Source.AI,
            note__user=request.user,
        ).update(source=NoteTag.Source.USER)
        return Response({'tag': tag.name, 'updated_associations': updated})


class NoteListCreateView(generics.ListCreateAPIView):
    serializer_class = NoteSerializer

    def get_queryset(self):
        return Note.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        classification = classify_note(serializer.validated_data.get('content', ''))
        # Don't let AI override a remind_at the user explicitly set
        if serializer.validated_data.get('remind_at'):
            classification.pop('remind_at', None)
        note = serializer.save(user=self.request.user, **classification)

        for name in self.request.data.get('tag_names', []):
            name = name.lower().strip()
            if name:
                tag, _ = Tag.objects.get_or_create(name=name)
                NoteTag.objects.get_or_create(note=note, tag=tag, defaults={'source': NoteTag.Source.USER})


class NoteDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = NoteSerializer
    http_method_names = ['get', 'patch', 'delete']

    def get_queryset(self):
        return Note.objects.filter(user=self.request.user)

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
        notes = Note.objects.filter(user=request.user)
        for note in notes:
            _apply_ai_tags(note, note.content)
        return Response({"retagged": notes.count()})


class NoteQueryView(APIView):
    def post(self, request):
        serializer = NoteQuerySerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        query = serializer.validated_data['query']
        all_notes = Note.objects.filter(user=request.user)

        relevant_ids, explanation = find_relevant_notes(all_notes, query)

        relevant_notes = Note.objects.filter(id__in=relevant_ids, user=request.user)
        note_serializer = NoteSerializer(relevant_notes, many=True)

        return Response({
            "relevant_notes": note_serializer.data,
            "explanation": explanation,
        })
