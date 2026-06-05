import { useState, useEffect} from 'react'
import './App.css'

function App() {
  const [books, setBooks] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  
  const [currentUrl, setCurrentUrl] = useState('http://localhost:8000/api/books/')
  const [nextUrl, setNextUrl] = useState(null)
  const [prevUrl, setPrevUrl] = useState(null)

  useEffect(() => {
    setLoading(true)
    fetch(currentUrl)
      .then(response => {
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
  }, [currentUrl])

  if (loading) return <div className="status-message">Завантаження книг</div>
  if (error) return <div className='status-message error'>Помилка: {error}</div>

  return (
    <div className='app-container'>
      <h1>Моя бібліотека</h1>
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
        <button
          disabled = {!prevUrl}
          onClick={() => setCurrentUrl(prevUrl)}
        >
          Попередня сторінка
        </button>
        <button
          disabled = {!nextUrl}
          onClick={() => setCurrentUrl(nextUrl)}
        >
          Наступна сторінка
        </button>
      </div>
    </div>

  )
}

export default App