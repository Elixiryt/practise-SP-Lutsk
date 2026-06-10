from rest_framework import generics, filters
from .models import Book
from .serializers import BookSerializer, RegistrationSerializer
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from django.contrib.auth.models import User
from django_filters.rest_framework import DjangoFilterBackend

class BookListCreateView(generics.ListCreateAPIView):
    queryset = Book.objects.all()
    serializer_class = BookSerializer
    permission_classes = [IsAuthenticated]

    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = {
        'genre': ['icontains'],
        'publication_year': ['gte', 'lte']
    }
    search_fields = ['title', 'author', 'genre']
    ordering_fields = ['publication_year', 'created_at']
    
class BookDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Book.objects.all()
    serializer_class = BookSerializer
    permission_classes = [IsAuthenticated]
    
class RegisterView(generics.CreateAPIView):
    queryset = User.objects.all()
    serializer_class = RegistrationSerializer
    permission_class = [AllowAny]

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def current_user(request):
    return Response({
        'username': request.user.username,
        'email': request.user.email,
        'is_staff': request.user.is_staff
    })

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def change_password(request):
    old_password = request.data.get('old_password')
    new_password = request.data.get('new_password')

    # Перевіряємо, чи правильно введено старий пароль
    if not request.user.check_password(old_password):
        return Response({'error': 'Неправильний старий пароль'}, status=400)

    # Встановлюємо новий пароль і зберігаємо
    request.user.set_password(new_password)
    request.user.save()
    
    return Response({'message': 'Пароль успішно змінено'})
