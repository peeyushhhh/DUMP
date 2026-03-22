import { BrowserRouter, Routes, Route } from 'react-router-dom'
import AnonProvider from './context/AnonContext'
import SocketProvider from './context/SocketContext'
import Home from './pages/Home'
import CreatePost from './pages/CreatePost'
import PostDetail from './pages/PostDetail'
import MyPosts from './pages/MyPosts'
import ChatRequests from './pages/ChatRequests'
import Chat from './pages/Chat'

function App() {
  return (
    <BrowserRouter>
      <AnonProvider>
        <SocketProvider>
          <div style={{ background: 'var(--bg)', minHeight: '100vh' }}>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/create" element={<CreatePost />} />
              <Route path="/post/:id" element={<PostDetail />} />
              <Route path="/my-posts" element={<MyPosts />} />
              <Route path="/chat-requests" element={<ChatRequests />} />
              <Route path="/chat/:roomId" element={<Chat />} />
            </Routes>
          </div>
        </SocketProvider>
      </AnonProvider>
    </BrowserRouter>
  )
}

export default App