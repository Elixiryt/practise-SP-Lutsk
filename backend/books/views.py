from django.contrib.auth.models import User
from django_filters.rest_framework import DjangoFilterBackend
from django.http import HttpResponse
import requests
import openpyxl
from rest_framework import filters, generics
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAdminUser, IsAuthenticated
from rest_framework.response import Response

from .models import Book
from .serializers import BookSerializer, RegistrationSerializer


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
    permission_classes = [AllowAny]  # ВИПРАВЛЕНО: додано літеру 's' в кінець

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

    if not request.user.check_password(old_password):
        return Response({'error': 'Неправильний старий пароль'}, status=400)

    request.user.set_password(new_password)
    request.user.save()
    return Response({'message': 'Пароль успішно змінено'})

@api_view(['POST'])
@permission_classes([IsAdminUser])  # Дозволено ТІЛЬКИ адміністраторам
def scrape_books(request):
    search_query = request.data.get('query', 'programming')
    try:
        count = int(request.data.get('count', 10))
    except ValueError:
        count = 10
    
    url = f'https://openlibrary.org/search.json?q={search_query}&limit={count}'
    
    try:
        response = requests.get(url)
        data = response.json()
        
        books_added = 0
        for doc in data.get('docs', []):
            title = doc.get('title', 'Невідома назва')
            
            author_names = doc.get('author_name', ['Невідомий autor'])
            author = author_names[0] if author_names else 'Невідомий автор'
            
            publish_year = doc.get('first_publish_year', 2024)
            genre = search_query.capitalize()
            
            if not Book.objects.filter(title=title).exists():
                Book.objects.create(
                    title=title[:200],  # Захист від довгих назв
                    author=author[:150],
                    genre=genre[:50],
                    publication_year=publish_year
                )
                books_added += 1

        return Response({
            'message': f'Магія спрацювала! Знайдено та збережено {books_added} реальних книг за запитом "{search_query}".'
        })
        
    except Exception as e:
        return Response({'error': str(e)}, status=500)

@api_view(['GET'])
@permission_classes([IsAdminUser])
def export_excel(request):
   # Отримуємо параметри
    search_query = request.GET.get('search', '')
    genre = request.GET.get('genre__icontains', '') # Переконайтеся, що на фронті ключ такий самий
    min_year = request.GET.get('publication_year__gte', '')
    max_year = request.GET.get('publication_year__lte', '')

    # Для дебагу (подивіться в термінал, коли натиснете кнопку)
    print(f"DEBUG: Search={search_query}, Genre={genre}, Min={min_year}, Max={max_year}")

    books = Book.objects.all()
    
    # Використовуємо .strip(), щоб прибрати випадкові пробіли
    if search_query and search_query.strip():
        books = books.filter(title__icontains=search_query)
    if genre and genre.strip():
        books = books.filter(genre__icontains=genre)
    if min_year and min_year.strip():
        books = books.filter(publication_year__gte=min_year)
    if max_year and max_year.strip():
        books = books.filter(publication_year__lte=max_year)

    # 3. ПРИМУСОВА ІНІЦІАЛІЗАЦІЯ (Тут була проблема)
    wb = openpyxl.Workbook()
    ws = wb.active
    ws.title = "Звіт по книгах"

    # 4. Заголовки
    headers = ['ID', 'Назва книги', 'Автор', 'Жанр', 'Рік видання']
    ws.append(headers)

    # 5. Дані
    for book in books:
        ws.append([book.id, book.title, book.author, book.genre, book.publication_year])

    # 6. Формування відповіді
    response = HttpResponse(
        content_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    )
    response['Content-Disposition'] = 'attachment; filename="library_report.xlsx"'
    
    wb.save(response)
    return response