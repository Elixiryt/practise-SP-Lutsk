from django.db import models

# Create your models here.
class Book(models.Model):
    title = models.CharField(max_length=256, verbose_name="Назва книги")
    author = models.CharField(max_length=256, verbose_name="Автор")
    genre = models.CharField(max_length=100, verbose_name="Жанр")
    publication_year = models.IntegerField(verbose_name="Рік видання")
    description = models.TextField(blank=True, null=True, verbose_name="Опис")
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.title} ({self.publication_year}) - {self.author}"