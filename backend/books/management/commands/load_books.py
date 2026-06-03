import urllib.request
import json
from django.core.management.base import BaseCommand
from books.models import Book

class Command(BaseCommand):
    help = 'Парсить книги з OpenLibrary API та зберігає їх у базу даних'

    def handle(self, *args, **kwargs):
        self.stdout.write("Звернення до OpenLibrary API... Це може зайняти кілька секунд.")
        
        # Змінили пошуковий запит на більш стабільний
        url = "https://openlibrary.org/search.json?q=fantasy&limit=50"
        
        try:
            with urllib.request.urlopen(url) as response:
                data = json.loads(response.read().decode())
                
            books_created = 0
            
            for doc in data.get('docs', []):
                title = doc.get('title', 'Невідома назва')[:250]
                
                # Максимально безпечний спосіб дістати автора
                raw_authors = doc.get('author_name')
                if isinstance(raw_authors, list) and len(raw_authors) > 0:
                    authors = ", ".join(raw_authors)[:250]
                elif isinstance(raw_authors, str):
                    authors = raw_authors[:250]
                else:
                    authors = "Невідомий автор"
                    
                genre = "Фентезі" 
                pub_year = doc.get('first_publish_year', 2000)
                
                book, created = Book.objects.get_or_create(
                    title=title,
                    defaults={
                        'author': authors,
                        'genre': genre,
                        'publication_year': pub_year 
                    }
                )
                
                if created:
                    books_created += 1
                    
            self.stdout.write(self.style.SUCCESS(f'Успіх! Додано {books_created} нових книг до бази.'))

        except Exception as e:
            self.stdout.write(self.style.ERROR(f'Сталася помилка під час парсингу: {e}'))