import { useState, useEffect, use } from 'react'
import './App.css'

function App() {
  const [view, setView] = useState('login')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  //Інформація про акк
  const [token, setToken] = useState(localStorage.getItem('access_token') || null)
  const [isAdmin, setIsAdmin] = useState(false)
  const [userProfile, setUserProfile] = useState(null)

  //Інформація про книги
  const [newTitle, setNewTitle] = useState('')
  const [newAuthor, setNewAuthor] = useState('')
  const [newGenre, setNewGenre] = useState('')
  const [newYear, setNewYear] = useState('')

  //Дані для відновлення паролю
  const [email, setEmail] = useState('')
  const [resetToken, setResetToken] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [message, setMessage] = useState('')

  //для списку книг
  const [selectedBook, setSelectedBook] = useState(null)
  const [books, setBooks] = useState([])
  const [loading, setLoading] = useState(false) // Початково краще false
  const [error, setError] = useState(null)
  const [currentUrl, setCurrentUrl] = useState('http://localhost:8000/api/books/')
  const [nextUrl, setNextUrl] = useState(null)
  const [prevUrl, setPrevUrl] = useState(null)

  //для dropdown меню
  const [suggestions, setSuggestions] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [genreSuggestions, setGenreSuggestions] = useState([]);
  const [showGenreDropdown, setShowGenreDropdown] = useState(false);

  //для пошуку
  const [searchQuery, setSearchQuery] = useState('')
  const [filterGenre, setFilterGenre] = useState('')
  const [minYear, setMinYear] = useState('')
  const [maxYear, setMaxYear] = useState('')

  //зміна паролю в кабінеті
  const [oldPassword, setOldPassword] = useState('')
  const [profileNewPassword, setProfileNewPassword] = useState('')
  const [profileMessage, setProfileMessage] = useState('')
  const [profileError, setProfileError] = useState('')

  //для парсингу
  const [isScraping, setIsScraping] = useState(false)
  const [scrapeQuery, setScrapeQuery] = useState('Python');
  const [scrapeCount, setScrapeCount] = useState(5); 
  const [showScrapeMenu, setShowScrapeMenu] = useState(false);

  //dropdown меню для парсингу
  const [scrapeSuggestions, setScrapeSuggestions] = useState([]);
  const [showScrapeDropdown, setShowScrapeDropdown] = useState(false);
  const OPEN_LIBRARY_SUBJECTS = [
    "Python", "Linux", "Java", "JavaScript", "C++", "PHP",
    "Programming", "Computer Science", "Artificial Intelligence",
    "Science Fiction", "Fantasy", "Mystery", "Romance", "Horror",
    "History", "Psychology", "Business", "Art", "Cooking"
  ];
  const availableScrapeGenres = OPEN_LIBRARY_SUBJECTS.filter(g => 
    g.toLowerCase().includes(scrapeQuery.toLowerCase())
  );

  //логі
  const handleLogin = async (e) => {
    e.preventDefault(); //не перезавантажує сторінку
    try {
      const response = await fetch('http://localhost:8000/api/token/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });

      if (!response.ok) throw new Error('Неправильний логін або пароль');

      const data = await response.json();
      setToken(data.access);
      localStorage.setItem('access_token', data.access);
      setError(null);
    } catch (err) {
      setError(err.message);
    }
  }

  //для заявки на зміну паролю(забув пароль)
  const handleForgotPassword = async (e) => {
    e.preventDefault();
    setError(null);
    setMessage('');
    try {
      const response = await fetch('http://localhost:8000/api/password_reset/', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({email})
      });
      
      if (!response.ok) throw new Error('Користувача з такою поштою не найдено');

      setMessage('Токен відправлено')
      setView('reset')
      setEmail('')
    } catch (err) {
      setError(err.message)
    }
  }

  //підтвердження зміни паролю (забув пароль)
  const handleConfirmReset = async (e) => {
    e.preventDefault();
    setError(null);
    setMessage('');
    try {
      const response = await fetch('http://localhost:8000/api/password_reset/confirm/', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({ token:resetToken, password:newPassword})
      });

      if (!response.ok) throw new Error('Недійсний пароль, або занадто простий пароль');

      setMessage('Зміна паролю пройшла успішно, тепер ви можете увійти')
      setView('login')
      setPassword('')
      setNewPassword('')
    } catch(err) {
      setError(err.message)
    }
  }

  //реєстрація
  const handleRegistration = async (e) => {
    e.preventDefault();
    setError(null);
    setMessage('')

    if (password !== confirmPassword) {
      console.log("Паролі не збігаються")
      setError('Паролі не збігаються!');
      return;
    }

    try {
      const response = await fetch('http://localhost:8000/api/register/', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({username, email, password})
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.username ? 'Такий юзернейм вже існує' : 'Помилка реєстрації');
      }

      setMessage('Реєстрація успішна. Тепер ви можете увійти')
      setView('login')
      setPassword('')
      setEmail('')
      setConfirmPassword('')
    } catch(err) {
      setError(err.message)
    }
  }

  //для логаут
  const handleLogout = () => {
    setToken(null);
    localStorage.removeItem('access_token'); 
    setBooks([]);
    
    setView('login'); // Примусово повертаємо форму входу
    setError(null);   // Очищаємо старі червоні помилки (як той NetworkError)
    setUsername('');
    setPassword('');
  }

  //перегляд деталей книги
  const handleViewDetails = async (bookId) => {
    try {
      const response = await fetch(`http://localhost:8000/api/books/${bookId}/`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();

      if (response.ok) {
        setSelectedBook(data);
        setView('bookDetails');
      } else {
        setError('Невдалось завантажити деталі книги');
      } 
    } catch (err) {
      setError('Помилка мережі');
    }  
  }

  //додавання книги
  const handleAddBook = async (e) => {
    e.preventDefault();
    setError(null)
    setMessage('')

    try {
      const response = await fetch('http://localhost:8000/api/books/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          title: newTitle,
          author: newAuthor,
          genre: newGenre,
          publication_year: newYear
        })
      });

      if (!response.ok) {
        throw Error('Помилка при додаванні книги. Перевірте дані.');
      }

      alert('Книгу успішно додано!');

      setNewTitle(''); setNewAuthor(''); setNewGenre(''); setNewYear('');

      setView('books')
      setCurrentUrl('http://localhost:8000/api/books/')
    } catch (err) {
      setError(err.message)
    }
  }

  //видалення книг
  const handleDeleteBook = async (bookId) => {
    if (!window.confirm('Ви впевнені що хочете видалити цю книгу назавжди?')) {
      return;
    }

    try {
      const response = await fetch(`http://localhost:8000/api/books/${bookId}/`, {
        method: 'DELETE',
        headers: {'Authorization': `Bearer ${token}`}
      });

      if (response.status === 403) {
        throw new Error('У вас немає прав адміністратора для видалення книг!');
      }
      if (!response.ok && response.status !== 204) {
        throw new Error('Помилка при видаленні книги.')
      }

      alert('Книга видалена успішно');

      setView('books')
      loadBooks();
    } catch(err) {
      setError(err.message);
    }
  }

  //зміна даних книги
  const handleUpdateBook = async (e) => {
    e.preventDefault();
    setError(null);

    try {
      const response = await fetch(`http://localhost:8000/api/books/${selectedBook.id}/`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          title: newTitle,
          author: newAuthor,
          genre: newGenre,
          publication_year: newYear
        })
      });

      if (response.status === 403) {
        throw new Error('У вас немає прав адміністратора для редагування книги!')
      }
      if (!response.ok) {
        throw new Error('Помилка при оновленні криги. Перевірте дані.')
      }

      alert('Книгу успішно оновлено!');

      setNewTitle(''); setNewAuthor(''); setNewGenre(''); setNewYear('');

      setView('books');
      loadBooks();
    } catch (err) {
      setError(err.message)
    }
  }

  //завантаження списку книг
  const loadBooks = () => {
    if (!token) return;

    setLoading(true)
    fetch(currentUrl, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })
      .then(response => {
        if (response.status === 401) {
          handleLogout();
          throw new Error('Ваш сеанс закінчився, увійдіть знову')
        }
        if (!response.ok) throw new Error('Не вдалось завантажити дані з сервера')
        return response.json()
      })
      .then(data => {
        setBooks(data.results)
        setNextUrl(data.next)
        setPrevUrl(data.previous)
        setLoading(false)
      })
      .catch(err => {
        setError(err.message)
        setLoading(false)
      })
  }

  //пошук
  const handleSearch = (e) => {
    e.preventDefault();

    const params = new URLSearchParams();

    if (searchQuery) params.append('search', searchQuery);
    if (filterGenre) params.append('genre__icontains', filterGenre);
    if (minYear) params.append('publication_year__gte', minYear);
    if (maxYear) params.append('publication_year__lte', maxYear);

    setCurrentUrl(`http://localhost:8000/api/books/?${params.toString()}`);
  }

  //скидання фільтрів
  const handleResetFilters = (e) => {
    e.preventDefault();

    setSearchQuery('')
    setFilterGenre('')
    setMinYear('')
    setMaxYear('')
  }

  //зміна паролю в кабінеті
  const handleChangePassword = async (e) => {
    e.preventDefault();
    setProfileError('');
    setProfileMessage('');

    try {
      const response = await fetch('http://localhost:8000/api/change-password/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          old_password: oldPassword,
          new_password: profileNewPassword
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Помилка при зміні пароля');
      }

      setProfileMessage('Пароль успішно змінено!');
      setOldPassword('');
      setProfileNewPassword('');
    } catch (err) {
      setProfileError(err.message);
    }
  }

  //парсинг
  const handleScrape = async (e) => {
    e.preventDefault(); // Зупиняємо перезавантаження сторінки
    setIsScraping(true);
    
    try {
      const response = await fetch('http://localhost:8000/api/scrape/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json', // Обов'язково вказуємо, що шлемо JSON
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          query: scrapeQuery,
          count: scrapeCount
        })
      });
      
      const data = await response.json();
      
      if (!response.ok) throw new Error(data.error || 'Помилка при парсингу');
      
      alert(data.message);
      setShowScrapeMenu(false); // Ховаємо меню після успіху
      loadBooks(); // Оновлюємо список
      
    } catch (err) {
      alert(`Помилка: ${err.message}`);
    } finally {
      setIsScraping(false);
    }
  }

  //експорт в ексель
  const handleExportExcel = async () => {
    const params = new URLSearchParams();
    
    if (searchQuery) params.append('search', searchQuery);
    if (filterGenre) params.append('genre__icontains', filterGenre);
    if (minYear) params.append('publication_year__gte', minYear);
    if (maxYear) params.append('publication_year__lte', maxYear);

    console.log("DEBUG: Експорт з параметрами:", params.toString());

    try {
      const response = await fetch(`http://localhost:8000/api/export-excel/?${params.toString()}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.status === 403) throw new Error('Тільки адміністратор має доступ!');
      if (!response.ok) throw new Error('Не вдалося сформувати Excel-звіт');

      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.setAttribute('download', 'library_report.xlsx');
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      alert(err.message);
    }
  }

  //завантаження списку книг
  useEffect(() => {
    loadBooks();
  }, [currentUrl, token]);

  //завантаження профілю
  useEffect(() => {
    if (!token) {
      setIsAdmin(false);
      setUserProfile(null);
      return;
    };

    fetch('http://localhost:8000/api/me', {
      headers: {'Authorization': `Bearer ${token}`}
    })
      .then(response => {
        if (!response.ok) throw new Error('Помилка сервера при отриманні профілю');
        return response.json();
      })
      .then(data => {
        if (data) {
          setIsAdmin(data.is_staff);
          setUserProfile(data); 
        }
      })
      .catch(err => {
        console.error('Не вдалося завантажити профіль:', err);
        setUserProfile({ username: 'Помилка', email: 'Помилка', is_staff: false }); 
      });
  }, [token]);

  //дропдаун меню для пошуку
  useEffect(() => {
    if (searchQuery.trim().length < 2) {
      setSuggestions([]);
      setShowDropdown(false);
      return;
    }

    const fetchSuggestions = async () => {
      try {
        const response = await fetch(`http://localhost:8000/api/books/?search=${searchQuery}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (response.ok) {
          const data = await response.json();
          setSuggestions(data.results.slice(0, 5)); 
          setShowDropdown(true);
        }
      } catch (err) {
        console.error("Помилка живого пошуку:", err);
      }
    };

    const timeoutId = setTimeout(() => {
      fetchSuggestions();
    }, 300);
    return () => clearTimeout(timeoutId);
  }, [searchQuery, token]);

  //дропдаун меню для жанрів
  useEffect(() => {
    const fetchGenreSuggestions = async () => {
      try {
        const url = filterGenre.trim() 
          ? `http://localhost:8000/api/books/?genre__icontains=${filterGenre}`
          : `http://localhost:8000/api/books/`;
          
        const response = await fetch(url, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (response.ok) {
          const data = await response.json();
          const uniqueGenres = [...new Set(data.results.map(book => book.genre).filter(Boolean))];
          setGenreSuggestions(uniqueGenres.slice(0, 5)); 
        }
      } catch (err) {
        console.error("Помилка пошуку жанрів:", err);
      }
    };

    const delay = filterGenre.trim() ? 300 : 0;
    const timeoutId = setTimeout(() => fetchGenreSuggestions(), delay);
    
    return () => clearTimeout(timeoutId);
  }, [filterGenre, token]);

  if (loading && books.length === 0 && token) return <div className="status-message">Завантаження книг...</div>//завантаження книг
  if (error && token) return <div className='status-message error'>Помилка: {error}</div>//вивід помилки на екран

  //якщо немає токену виводить логін
  if (!token) {
    return (
      <div className='app-container'>
        <div className='login-box'>
          {view === 'login' && (
            <>
              <h1>Вхід в бібліотеку</h1>
              <form onSubmit={handleLogin} className='login-form'>
                <input
                  type='text'
                  placeholder='Введіть ваш юзернейм'
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                />
                <input
                  type='password'
                  placeholder='Введіть пароль'
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <button type='submit'>Увійти</button>
              </form>
              <button className='text-link' onClick={() => {setView('forgot'); setError(null)}}>Забули пароль</button>  
              <button className='text-link' onClick={() => {setView('register'); setError(null)}}>Немає аккаунта. Зареєструйтесь</button>
            </>
          )}
          
          {/*виведення екрану відновлення паролю*/}
          {view === 'forgot' && (
            <>
              <h1>Відновлення паролю</h1>
              <p>Введіть вашу електронну пошту, і ми надішлемо вам код підтвердження.</p>
              <form onSubmit={handleForgotPassword} className='login-form'>
                <input type='email' placeholder='Введіть вашу пошту' value={email} onChange={(e) => setEmail(e.target.value)} required/>
                <button type='submit'>надіслати код</button>
              </form>
              <button className='text-link' onClick={() => {setView('login'); setError(null);}}>Повернутися до входу</button>
            </>
          )}

          {/*підтвердження відновлення паролю*/}
          {view === 'reset' && (
            <>
              <h1>Введіть новий пароль</h1>
              {message && <p className='succes'>{message}</p>}
              <form onSubmit={handleConfirmReset} className='login-form'>
                <input type='text' placeholder='Введіть код з пошти' value={resetToken} onChange={(e) => setResetToken(e.target.value)} required/>
                <input type='password' placeholder='Введіть новий паролю' value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required/>
                <button type='submit'>Змінити пароль</button>
              </form>
              <button className='text-link' onClick={() => {setView('login'); setError(null);}}>Повернутись до входу</button>
            </>
          )}

          {/*реєстрація*/}
          {view === 'register' && (
            <>
              <h1>Реєстрація</h1>
              <form onSubmit={handleRegistration} className='login-form'>
                <input
                  type='text'
                  placeholder='Введіть ваш юзернейм'
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                />
                <input
                  type='email'
                  placeholder='Введіть вашу пошту'
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
                <input
                  type='password'
                  placeholder='Введіть ваш пароль'
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <input
                  type='password'
                  placeholder='Повторіть пароль'
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                />
                <button type='submit'>Зареєструватись</button>
              </form>
              <button className='text-link' onClick={() => {setView('login'); setError(null)}}>Вже є аккаунт? Увійти</button>
            </>
          )}
          {error && <p className='error'>{error}</p>}
        </div>
      </div>
    );
  }

//запускає список книг якщо є токен
return (
    <div className='app-container'>
      <div className='header-flex'>
        <h1>Моя бібліотека</h1>
        <div>
          {isAdmin && (
            <>
              {showScrapeMenu ? (
                <form onSubmit={handleScrape} style={{display: 'inline-flex', gap: '5px', alignItems: 'center', marginRight: '10px'}}>
                  
                  <div style={{ position: 'relative' }}>
                    <input 
                      type="text" 
                      value={scrapeQuery} 
                      onChange={e => setScrapeQuery(e.target.value)} 
                      onBlur={() => setTimeout(() => setShowScrapeDropdown(false), 200)}
                      onFocus={() => setShowScrapeDropdown(true)} // Показуємо всі одразу при кліку
                      placeholder="Тема (напр. Python)" 
                      style={{padding: '7px', width: '130px', borderRadius: '4px', border: '1px solid #ccc', boxSizing: 'border-box'}} 
                      required 
                    />
                    
                    {showScrapeDropdown && availableScrapeGenres.length > 0 && (
                      <ul style={{
                        position: 'absolute', top: '100%', left: 0, right: 0,
                        background: 'white', border: '1px solid #ccc', borderRadius: '5px',
                        listStyle: 'none', padding: 0, margin: '5px 0 0 0',
                        boxShadow: '0 5px 15px rgba(0,0,0,0.1)', zIndex: 1000, overflow: 'hidden', maxHeight: '200px', overflowY: 'auto'
                      }}>
                        {availableScrapeGenres.map((genre, index) => (
                          <li 
                            key={index}
                            onClick={() => { setScrapeQuery(genre); setShowScrapeDropdown(false); }}
                            onMouseEnter={(e) => e.target.style.backgroundColor = '#f1f2f6'}
                            onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
                            style={{ padding: '8px 10px', cursor: 'pointer', borderBottom: '1px solid #eee', fontSize: '14px' }}
                          >
                            <strong style={{color: '#2c3e50'}}>{genre}</strong>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>

                  <input type="number" value={scrapeCount} onChange={e => setScrapeCount(e.target.value)} placeholder="К-сть" style={{padding: '7px', width: '60px', borderRadius: '4px', border: '1px solid #ccc'}} required min="1" max="50"/>
                  <button type="submit" disabled={isScraping} className='logout-btn logout-btn--purple' style={{margin: 0}}>{isScraping ? 'Завантажується...' : 'Запуск'}</button>
                  <button type="button" onClick={() => setShowScrapeMenu(false)} className='logout-btn' style={{margin: 0, padding: '8px 12px'}}>✕</button>
                </form>
              ) : (
                <button onClick={() => setShowScrapeMenu(true)} className='logout-btn logout-btn--purple'>Розумний парсер</button>
              )}

              <button onClick={() => {setView('addBook'); setError(null);}} className='logout-btn logout-btn--green'>+ Додати нову книгу</button>
            </>
          )}
          
          <button onClick={() => setView('profile')} className='logout-btn logout-btn--blue'>Мій профіль</button>
        </div>
      </div>

      {loading && books.length === 0 ? (
        <div className='status-message'>Завантаження книг...</div>
      ) : error ? (
        <div className='status-message error'>Помилка: {error}</div>
      ) : (
        <>
        {/*перегляд деталей про книгу*/}
          {view === 'bookDetails' && selectedBook ? (
            <div className="details-card">
              <button onClick={() => setView('books')} className="back-btn"> ← Назад до списку</button>
              {isAdmin && (
                  <div>
                    <button 
                      onClick={() => {
                        setNewTitle(selectedBook.title);
                        setNewAuthor(selectedBook.author);
                        setNewGenre(selectedBook.genre);
                        setNewYear(selectedBook.publication_year);
                        setView('editBook');
                      }} 
                      className="detail-btn detail-btn--edit"
                    >Редагувати</button>

                    <button 
                      onClick={() => handleDeleteBook(selectedBook.id)} 
                      className="detail-btn detail-btn--delete"
                    >Видалити</button>
                  </div>
                )}
              
              <h2 className="details-title">{selectedBook.title}</h2>
              <p className="details-author">Автор: {selectedBook.author}</p>
              
              <div className="details-meta">
                <span className="meta-badge">{selectedBook.publication_year} рік</span>
                <span className="meta-badge">{selectedBook.genre}</span>
              </div>
            </div>

          //додавання книги   
          ) : view === 'addBook' ? (
            <div className="login-box" style={{ maxWidth: '500px' }}>
              <button onClick={() => setView('books')} className="back-btn" style={{marginBottom: '15px'}}>← Назад до списку</button>
              <h2>Додати нову книгу</h2>
              
              <form onSubmit={handleAddBook} className="login-form">
                <input type="text" placeholder="Назва книги" value={newTitle} onChange={(e) => setNewTitle(e.target.value)} required />
                <input type="text" placeholder="Автор" value={newAuthor} onChange={(e) => setNewAuthor(e.target.value)} required />
                <input type="text" placeholder="Жанр" value={newGenre} onChange={(e) => setNewGenre(e.target.value)} required />
                <input type="number" placeholder="Рік видання" value={newYear} onChange={(e) => setNewYear(e.target.value)} required />
                <button type="submit">Зберегти книгу</button>
              </form>
            </div>

          //редагування книги
          ) : view === 'editBook' ? (
            <div className='login-box' style={{maxWidth: '500px'}}>
              <button onClick={() => setView('bookDetails')} className='back-btn' style={{marginBottom: '15px'}}>← Скасувати і повернутись</button>
              <h2>Редагувати книгу</h2>

              <form onSubmit={handleUpdateBook} className='login-form'>
                <input type='text' placeholder='Назва книги' value={newTitle} onChange={(e) => setNewTitle(e.target.value)} required/>
                <input type='text' placeholder='Автор' value={newAuthor} onChange={(e) => setNewAuthor(e.target.value)} required/>
                <input type='text' placeholder='Жанр' value={newGenre} onChange={(e) => setNewGenre(e.target.value)}required/>
                <input type='number' placeholder='Рік видання' value={newYear} onChange={(e) => setNewYear(e.target.value)} required/>
                <button type='submit' style={{backgroundColor: '#f39c12'}}>Оновити дані</button>
              </form>
            </div>
          
          //кабінет
          ) : view === 'profile' ? (
            <div className='details-card' style={{maxWidth: '600px', margin: '0 auto', marginTop: '20px'}}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
                  <button onClick={() => setView('books')} className="back-btn" style={{ marginBottom: 0 }}>
                    ← Назад до бібліотеки
                  </button>
                  
                  <button onClick={handleLogout} className="logout-btn logout-btn--danger" style={{ marginTop: 0 }}>
                    Вийти з аккаунта
                  </button>
                </div>
               <h2>Мій профіль</h2>

               {userProfile ? (
                 <>
                  <div style={{marginTop: '20px', fontSize: '18px', lineHeight: '1.6', alignItems: 'center'}}>
                    <p><strong>Юзернейм:</strong> {userProfile.username}</p>
                    <p><strong>Email:</strong> {userProfile.email}</p>
                    <p>
                      <strong>Cтатус:</strong>
                      {userProfile.is_staff ? (
                        <span style={{color: '#e74c3c', fontWeight: 'bold'}}> Адміністратор</span>
                      ) : (
                        <span style={{color: '#2ecc71', fontWeight: 'bold'}}> Читач</span>
                      )}
                    </p>
                  </div>

                  <div style={{ marginTop: '30px', paddingTop: '20px', borderTop: '1px solid #eee', textAlign: 'center'}}>
                    <h3>Змінити пароль</h3>
                    
                    {profileMessage && <p className="success" style={{color: '#2ecc71'}}>{profileMessage}</p>}
                    {profileError && <p className="error" style={{color: '#e74c3c'}}>{profileError}</p>}
                    
                    <form onSubmit={handleChangePassword} style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxWidth: '300px', marginTop: '10px', alignItems: 'center'}}>
                      <input 
                        type="password" 
                        placeholder="Старий пароль" 
                        value={oldPassword} 
                        onChange={(e) => setOldPassword(e.target.value)} 
                        required 
                        style={{ padding: '8px', borderRadius: '5px', border: '1px solid #ccc' }}
                      />
                      <input 
                        type="password" 
                        placeholder="Новий пароль" 
                        value={profileNewPassword} 
                        onChange={(e) => setProfileNewPassword(e.target.value)} 
                        required 
                        style={{ padding: '8px', borderRadius: '5px', border: '1px solid #ccc' }}
                      />
                      <button type="submit" style={{ backgroundColor: '#34495e', color: 'white', padding: '10px', borderRadius: '5px', border: 'none', cursor: 'pointer' }}>
                        Оновити пароль
                      </button>
                    </form>
                  </div>
                </>
               ) : (
                <p>Завантаження даних...</p>
               )}
            </div>
          ) : (
            <>
              {/*сам список книг*/}
              <div className='filter-panel'>
                <form onSubmit={handleSearch} className='filter-form'>
                  <div style={{ position: 'relative', flex: '1', minWidth: '200px' }}>
                    <input 
                      type='text' 
                      placeholder='Пошук за назвою чи автором...' 
                      value={searchQuery} 
                      onChange={(e) => setSearchQuery(e.target.value)} 
                      onBlur={() => setTimeout(() => setShowDropdown(false), 200)} 
                      onFocus={() => { if (suggestions && suggestions.length > 0) setShowDropdown(true) }} 
                      className='filter-input large'
                      style={{ width: '100%', boxSizing: 'border-box' }}
                    />
                    {showDropdown && suggestions && suggestions.length > 0 && (
                      <ul style={{
                        position: 'absolute', top: '100%', left: 0, right: 0,
                        background: 'white', border: '1px solid #ccc', borderRadius: '5px',
                        listStyle: 'none', padding: 0, margin: '5px 0 0 0',
                        boxShadow: '0 5px 15px rgba(0,0,0,0.1)', zIndex: 1000, overflow: 'hidden'
                      }}>
                        {suggestions.map(book => (
                          <li 
                            key={book.id}
                            onClick={() => {
                              setSearchQuery(book.title); 
                              setShowDropdown(false);     
                            }}
                            onMouseEnter={(e) => e.target.style.backgroundColor = '#f1f2f6'}
                            onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
                            style={{ padding: '10px 15px', cursor: 'pointer', borderBottom: '1px solid #eee', transition: 'background 0.2s' }}
                          >
                            <strong style={{color: '#2c3e50'}}>{book.title}</strong> 
                            <span style={{color: '#7f8c8d', fontSize: '0.9em', marginLeft: '5px'}}>— {book.author}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>

                  <div style={{ position: 'relative', width: '150px' }}>
                    <input 
                      type='text' 
                      placeholder='Жанр...' 
                      value={filterGenre} 
                      onChange={(e) => setFilterGenre(e.target.value)} 
                      onBlur={() => setTimeout(() => setShowGenreDropdown(false), 200)} 
                      onFocus={() => setShowGenreDropdown(true)} 
                      className='filter-input small'
                      style={{ width: '100%', boxSizing: 'border-box' }}
                    />
                    
                    {showGenreDropdown && genreSuggestions && genreSuggestions.length > 0 && (
                      <ul style={{
                        position: 'absolute', top: '100%', left: 0, right: 0,
                        background: 'white', border: '1px solid #ccc', borderRadius: '5px',
                        listStyle: 'none', padding: 0, margin: '5px 0 0 0',
                        boxShadow: '0 5px 15px rgba(0,0,0,0.1)', zIndex: 1000, overflow: 'hidden'
                      }}>
                        {genreSuggestions.map((genre, index) => (
                          <li 
                            key={index}
                            onClick={() => {
                              setFilterGenre(genre); 
                              setShowGenreDropdown(false);     
                            }}
                            onMouseEnter={(e) => e.target.style.backgroundColor = '#f1f2f6'}
                            onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
                            style={{ padding: '10px 15px', cursor: 'pointer', borderBottom: '1px solid #eee', transition: 'background 0.2s' }}
                          >
                            <strong style={{color: '#2c3e50'}}>{genre}</strong>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                  <input type='number' placeholder='Рік від' value={minYear} onChange={(e) => setMinYear(e.target.value)} className='filter-input small'/>
                  <input type='number' placeholder='Рік до' value={maxYear} onChange={(e) => setMaxYear(e.target.value)} className='filter-input small'/>
                  
                  <button type='submit' className='filter-btn primary'>Шукати</button>
                  <button type='button' onClick={handleResetFilters} className='filter-btn secondary'>Скинути</button>
                  
                  {isAdmin && (
                    <button 
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        handleExportExcel();
                      }} 
                      className='filter-btn' 
                      style={{ backgroundColor: '#27ae60', color: 'white', marginLeft: 'auto' }}
                    >
                      В Excel
                    </button>
                  )}
                </form>
              </div>
              <div className='books-list'>
                {books.map(book => (
                  <div key={book.id} className='book-row'>
                    <div className='book-row-info'>
                      <span className='book-row-title'>{book.title}</span>
                      <span className='book-row-meta'>
                        <span>{book.author}</span>
                        <span className='book-row-dot'>·</span>
                        <span>{book.genre}</span>
                        <span className='book-row-dot'>·</span>
                        <span className='book-row-year'>{book.publication_year}</span>
                      </span>
                    </div>
                    <div className='book-row-actions'>
                      {isAdmin && (
                        <button onClick={() => handleDeleteBook(book.id)} className='row-btn row-btn--danger'>Видалити</button>
                      )}
                      <button onClick={() => handleViewDetails(book.id)} className='row-btn'>Детальніше</button>
                    </div>
                  </div>
                ))}
              </div>
              <div className='pagination'>
                <button disabled={!prevUrl} onClick={() => setCurrentUrl(prevUrl)}>Попередня сторінка</button>
                <button disabled={!nextUrl} onClick={() => setCurrentUrl(nextUrl)}>Наступна сторінка</button>
              </div>
            </>
          )}
        </>
      )}
    </div>
  )
}

export default App