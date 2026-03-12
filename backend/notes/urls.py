from django.urls import path
from .views import NoteListCreateView, NoteDetailView, NoteQueryView, NoteRetagAllView, TagListView

urlpatterns = [
    path('tags/', TagListView.as_view(), name='tag-list'),
    path('query/', NoteQueryView.as_view(), name='note-query'),
    path('retag-all/', NoteRetagAllView.as_view(), name='note-retag-all'),
    path('<int:pk>/', NoteDetailView.as_view(), name='note-detail'),
    path('', NoteListCreateView.as_view(), name='note-list-create'),
]
