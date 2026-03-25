import { BrowserRouter, Routes, Route, useNavigate, useLocation } from 'react-router-dom'
import { useEffect } from 'react'
import AnonProvider from './context/AnonContext'
import SocketProvider from './context/SocketContext'
import { useSocketContext } from './context/SocketContext'
import Home from './pages/Home'
import CreatePost from './pages/CreatePost'
import PostDetail from './pages/PostDetail'
import MyPosts from './pages/MyPosts'
import ChatRequests from './pages/ChatRequests'
import Chat from './pages/Chat'
import Therapist from './pages/Therapist'
import BottomNav from './components/BottomNav'
import DMInbox from './components/DMInbox'

function AppRoutes() {
  const navigate = useNavigate()
  const location = useLocation()
  const { acceptedRoomId, setAcceptedRoomId, registerRoom } = useSocketContext()

  useEffect(() => {
    if (acceptedRoomId) {
      registerRoom(acceptedRoomId)
      navigate(`/chat/${acceptedRoomId}`)
      setAcceptedRoomId(null)
    }
  }, [acceptedRoomId])

  const showBottomNav =
    ['/', '/create', '/my-posts', '/therapist'].includes(location.pathname) ||
    location.pathname.startsWith('/post/')

  return (
    <div style={{ background: 'var(--bg)', minHeight: '100vh' }}>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/create" element={<CreatePost />} />
        <Route path="/post/:id" element={<PostDetail />} />
        <Route path="/my-posts" element={<MyPosts />} />
        <Route path="/chat-requests" element={<ChatRequests />} />
        <Route path="/chat/:roomId" element={<Chat />} />
        <Route path="/therapist" element={<Therapist />} />
      </Routes>

      {/* Global DM inbox bubble — always mounted, hides itself on chat pages */}
      <DMInbox />

      {showBottomNav && <BottomNav />}
    </div>
  )
}

function App() {
  return (
    <BrowserRouter>
      <AnonProvider>
        <SocketProvider>
          <AppRoutes />
        </SocketProvider>
      </AnonProvider>
    </BrowserRouter>
  )
}

export default App