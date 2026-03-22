import { BrowserRouter, Routes, Route } from 'react-router-dom'
import AnonProvider from './context/AnonContext'
import Home from './pages/Home'
import CreatePost from './pages/CreatePost'

function App() {
  return (
    <BrowserRouter>
      <AnonProvider>
        <div style={{ background: 'var(--bg)', minHeight: '100vh' }}>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/create" element={<CreatePost />} />
          </Routes>
        </div>
      </AnonProvider>
    </BrowserRouter>
  )
}

export default App