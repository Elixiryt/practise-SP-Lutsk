import { useState, useEffect } from 'react'
import './App.css'

function App() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [token, setToken] = useState(localStorage.getItem('access_token') || null)

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