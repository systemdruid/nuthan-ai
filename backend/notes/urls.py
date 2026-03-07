from django.urls import path
from .views import NoteListCreateView, NoteDetailView, NoteQueryView

urlpatterns = [
    path('query/', NoteQueryView.as_view(), name='note-query'),
    path('<int:pk>/', NoteDetailView.as_view(), name='note-detail'),
    path('', NoteListCreateView.as_view(), name='note-list-create'),
]
