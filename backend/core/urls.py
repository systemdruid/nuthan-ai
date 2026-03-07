from django.urls import path, include

urlpatterns = [
    path('api/notes/', include('notes.urls')),
]
