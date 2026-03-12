from django.urls import path, include

urlpatterns = [
    path('api/notes/', include('notes.urls')),
    path('api/tags/', include('notes.tag_urls')),
]
