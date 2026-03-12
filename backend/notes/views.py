from rest_framework import generics, status
from rest_framework.views import APIView
from rest_framework.response import Response
from .models import Note, Tag
from .serializers import NoteSerializer, NoteQuerySerializer
from .ai_service import find_relevant_notes, classify_note, tag_note


def _apply_ai_tags(note, content):
    """Generate AI tags for a note, replacing any previously AI-assigned tags."""
    tag_names = tag_note(content)
    ai_tags = []
    for name in tag_names:
        tag, _ = Tag.objects.get_or_create(name=name, defaults={'source': Tag.Source.AI})
        ai_tags.append(tag)
    # Remove old AI tags, keep user tags, then add new AI tags
    note.tags.remove(*note.tags.filter(source=Tag.Source.AI))
    note.tags.add(*ai_tags)


class NoteListCreateView(generics.ListCreateAPIView):
    queryset = Note.objects.all()
    serializer_class = NoteSerializer

    def perform_create(self, serializer):
        classification = classify_note(serializer.validated_data.get('content', ''))
        note = serializer.save(**classification)
        _apply_ai_tags(note, note.content)


class NoteDetailView(generics.RetrieveDestroyAPIView):
    queryset = Note.objects.all()
    serializer_class = NoteSerializer


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
