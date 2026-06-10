from rest_framework import generics, filters
from .models import Book
from .serializers import BookSerializer, RegistrationSerializer
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from django.contrib.auth.models import User
from django_filters.rest_framework import DjangoFilterBackend
import requests
from bs4 import BeautifulSoup
from rest_framework.permissions import IsAdminUser

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

@api_view(['POST'])
@permission_classes([IsAdminUser]) # Дозволяємо запускати парсинг ТІЛЬКИ адміністраторам
def scrape_books(request):
    url = 'http://books.toscrape.com/'
    
    try:
        response = requests.get(url)
        # Використовуємо BeautifulSoup для розбору HTML
        soup = BeautifulSoup(response.content, 'html.parser')
        
        # На цьому сайті всі книги лежать у тегах <article class="product_pod">
        articles = soup.find_all('article', class_='product_pod')
        
        books_added = 0
        for article in articles:
            # Витягуємо назву книги з атрибута title в посиланні
            title = article.h3.a['title']
            
            # Оскільки на цьому тестовому сайті немає авторів і років, ми ставимо заглушки, 
            # щоб база даних не сварилася на порожні поля
            author = "Невідомий автор (Scraped)"
            genre = "Різне"
            publication_year = 2024
            
            # Перевіряємо, чи немає вже такої книги в базі, щоб не створювати дублікати
            if not Book.objects.filter(title=title).exists():
                Book.objects.create(
                    title=title,
                    author=author,
                    genre=genre,
                    publication_year=publication_year
                )
                books_added += 1

        return Response({'message': f'Парсинг завершено! Додано {books_added} нових книг.'})
        
    except Exception as e:
        return Response({'error': str(e)}, status=500)

@api_view(['POST'])
@permission_classes([IsAdminUser])
def scrape_books(request):
    # 1. Отримуємо параметри від React (що шукати і скільки)
    search_query = request.data.get('query', 'programming')
    count = int(request.data.get('count', 10))
    
    # 2. Робимо запит до реальної бази книг Open Library
    url = f'https://openlibrary.org/search.json?q={search_query}&limit={count}'
    
    try:
        response = requests.get(url)
        data = response.json()
        
        books_added = 0
        # 3. Перебираємо отримані книги
        for doc in data.get('docs', []):
            title = doc.get('title', 'Невідома назва')
            
            # Беремо першого автора зі списку (якщо є)
            author_names = doc.get('author_name', ['Невідомий автор'])
            author = author_names[0] if author_names else 'Невідомий автор'
            
            # Беремо рік першого видання
            publish_year = doc.get('first_publish_year', 2024)
            
            # Жанр ставимо той, який шукав користувач
            genre = search_query.capitalize()
            
            # 4. Зберігаємо в базу, якщо такої книги ще немає
            if not Book.objects.filter(title=title).exists():
                Book.objects.create(
                    title=title[:200], # Захист від занадто довгих назв
                    author=author[:150],
                    genre=genre[:50],
                    publication_year=publish_year
                )
                books_added += 1

        return Response({'message': f'Магія спрацювала! Знайдено та збережено {books_added} реальних книг за запитом "{search_query}".'})
        
    except Exception as e:
        return Response({'error': str(e)}, status=500)