from rest_framework import generics, status
from rest_framework.views import APIView
from rest_framework.response import Response
from .models import Note
from .serializers import NoteSerializer, NoteQuerySerializer
from .ai_service import find_relevant_notes, classify_note


class NoteListCreateView(generics.ListCreateAPIView):
    queryset = Note.objects.all()
    serializer_class = NoteSerializer

    def perform_create(self, serializer):
        classification = classify_note(serializer.validated_data.get('content', ''))
        serializer.save(**classification)


class NoteDetailView(generics.RetrieveDestroyAPIView):
    queryset = Note.objects.all()
    serializer_class = NoteSerializer


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
