from django.db import migrations, models


class Migration(migrations.Migration):

    initial = True

    dependencies = [
    ]

    operations = [
        migrations.CreateModel(
            name='Book',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('title', models.CharField(max_length=256, verbose_name='Назва книги')),
                ('author', models.CharField(max_length=256, verbose_name='Автор')),
                ('genre', models.CharField(max_length=100, verbose_name='Жанр')),
                ('publication_year', models.IntegerField(verbose_name='Рік видання')),
                ('description', models.TextField(blank=True, null=True, verbose_name='Опис')),
                ('created_at', models.DateTimeField(auto_now_add=True)),
            ],
            options={
                'ordering': ['-created_at'],
            },
        ),
    ]
