from django.conf import settings
from django.contrib.auth.models import User
from google.oauth2 import id_token
from google.auth.transport import requests as google_requests
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny
from rest_framework_simplejwt.tokens import RefreshToken


class GoogleLoginView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        credential = request.data.get('credential')
        if not credential:
            return Response({'error': 'credential required'}, status=400)

        try:
            id_info = id_token.verify_oauth2_token(
                credential,
                google_requests.Request(),
                settings.GOOGLE_CLIENT_ID,
            )
        except ValueError as e:
            return Response({'error': str(e)}, status=400)

        email = id_info['email']
        name = id_info.get('name', email)
        parts = name.split(' ', 1)

        user, _ = User.objects.get_or_create(
            username=email,
            defaults={
                'email': email,
                'first_name': parts[0],
                'last_name': parts[1] if len(parts) > 1 else '',
            },
        )

        refresh = RefreshToken.for_user(user)
        return Response({
            'access': str(refresh.access_token),
            'refresh': str(refresh),
            'user': {'email': email, 'name': name},
        })
