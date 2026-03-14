from django.urls import path, include
from .auth_views import GoogleLoginView

urlpatterns = [
    path('api/auth/google/', GoogleLoginView.as_view()),
    path('api/notes/', include('notes.urls')),
    path('api/tags/', include('notes.tag_urls')),
]
