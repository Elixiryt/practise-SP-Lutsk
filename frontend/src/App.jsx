import { useState, useEffect } from 'react'
import './App.css'

function App() {
  const [view, setView] = useState('login')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [token, setToken] = useState(localStorage.getItem('access_token') || null)

  const [email, setEmail] = useState('')
  const [resetToken, setResetToken] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [message, setMessage] = useState('')

  const [books, setBooks] = useState([])
  const [loading, setLoading] = useState(false) // Початково краще false
  const [error, setError] = useState(null)
  const [currentUrl, setCurrentUrl] = useState('http://localhost:8000/api/books/')
  const [nextUrl, setNextUrl] = useState(null)
  const [prevUrl, setPrevUrl] = useState(null)

  const handleLogin = async (e) => {
    e.preventDefault();
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

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    setError(null);
    setMessage('');
    try {
      const response = await fetch('http:/localhost:8000/password_reset/', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({email})
      });
      
      if (!response.ok) throw new Error('Користувача з такою поштою не найдено');

      setMessage('Токен відправлено')
      setView('reset')
    } catch (err) {
      setError(err.message)
    }
  }

  const handleConfirmReset = async (e) => {
    e.preventDefault;
    setError(null);
    setMessage('');
    try {
      const respponse = await('http:/localhost:8000/password_reset/confirm/', {
        method: 'POST',
        header: {'Content-Type': 'application/json'},
        body: JSON.stringify({ token:resetToken, password:newPassword})
      });

      if (!token) throw new Error('Недійсний пароль, або занадто простий пароль');

      setMessage('Зміна паролю пройшла успішно, тепер ви можете увійти')
      setView(login)
      setPassword('')
    } catch(err) {
      setError(err.message)
    }
  }

  const handleLogout = () => {
    setToken(null);
    localStorage.removeItem('access_token'); // Краще повністю видаляти токен
    setBooks([]);
  }

  useEffect(() => {
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
  }, [currentUrl, token]);

  if (loading && books.length === 0 && token) return <div className="status-message">Завантаження книг...</div>
  if (error && token) return <div className='status-message error'>Помилка: {error}</div>

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
            </>
          )}
          
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

          {error && <p className='error'>{error}</p>}
        </div>
      </div>
    );
  }

  return (
    <div className='app-container'>
      <div className='header-flex'>
        <h1>Моя бібліотека</h1>
        <button onClick={handleLogout} className='logout-btn'>Вийти з аккаунта</button>
      </div>

      {loading && books.length === 0 ? (
        <div className='status-message'>Завантаження книг...</div>
      ) : error ? (
        <div className='status-message error'>Помилка: {error}</div>
      ) : (
        <>
          <div className='books-grid'>
            {books.map(book => (
              <div key={book.id} className='book-card'>
                <h2>{book.title}</h2>
                <p><strong>Aвтор: </strong>{book.author}</p>
                <p><strong>Жанр: </strong>{book.genre}</p>
                <p className='year'><strong>Рік: </strong>{book.publication_year}</p>
              </div>
            ))}
          </div>
          <div className='pagination'>
            <button disabled={!prevUrl} onClick={() => setCurrentUrl(prevUrl)}>Попередня сторінка</button>
            <button disabled={!nextUrl} onClick={() => setCurrentUrl(nextUrl)}>Наступна сторінка</button>
          </div>
        </>
      )}
    </div>
  )
}

export default App