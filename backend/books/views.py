from rest_framework import generics
from .models import Book
from .serializers import BookSerializer # <--- Виправляємо тут
from .permissions import IsAdminOrReadOnly

class BookListCreateView(generics.ListCreateAPIView):
    queryset = Book.objects.all()
    serializer_class = BookSerializer # <--- І перевірте, чи правильно тут
    permission_classes = [IsAdminOrReadOnly]

class BookDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Book.objects.all()
    serializer_class = BookSerializer # <--- І тут
    permission_classes = [IsAdminOrReadOnly]