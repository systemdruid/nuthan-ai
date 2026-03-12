from django.urls import path
from .views import TagListView, TagConvertToUserView

urlpatterns = [
    path('<int:pk>/convert-to-user/', TagConvertToUserView.as_view(), name='tag-convert-to-user'),
    path('', TagListView.as_view(), name='tag-list'),
]
