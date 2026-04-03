import { BrowserRouter, Routes, Route, useNavigate, useLocation } from 'react-router-dom'
import { useEffect, useState, useCallback } from 'react'
import AnonProvider, { useAnon } from './context/AnonContext'
import SocketProvider from './context/SocketContext'
import { useSocketContext } from './context/SocketContext'
import registerPush from './services/pushService'
import Home from './pages/Home'
import CreatePost from './pages/CreatePost'
import PostDetail from './pages/PostDetail'
import MyPosts from './pages/MyPosts'
import ChatRequests from './pages/ChatRequests'
import Chat from './pages/Chat'
import Therapist from './pages/Therapist'
import BottomNav from './components/BottomNav'
import DMInbox from './components/DMInbox'
import SplashScreen from './components/SplashScreen'
import RecoveryModal from './components/RecoveryModal'

function RecoveryModalHost() {
  const { showRecoveryModal } = useAnon()
  if (!showRecoveryModal) return null
  return <RecoveryModal />
}

function PushBootstrap() {
  const { anonId } = useAnon()

  useEffect(() => {
    if (!anonId) return
    ;(async () => {
      try {
        await registerPush(anonId)
      } catch {
        /* fail silently — push is optional */
      }
    })()
  }, [anonId])

  return null
}

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
      <DMInbox />
      {showBottomNav && <BottomNav />}
    </div>
  )
}

const SPLASH_SEEN_KEY = 'dump_splash_seen'

function App() {
  const [splashDone, setSplashDone] = useState(() => {
    try {
      return localStorage.getItem(SPLASH_SEEN_KEY) === 'true'
    } catch {
      return false
    }
  })

  const finishSplash = useCallback(() => {
    try {
      localStorage.setItem(SPLASH_SEEN_KEY, 'true')
    } catch {
      /* ignore */
    }
    setSplashDone(true)
  }, [])

  return (
    <>
      {!splashDone && <SplashScreen onComplete={finishSplash} />}
      {splashDone && (
        <BrowserRouter>
          <AnonProvider>
            <SocketProvider>
              <PushBootstrap />
              <RecoveryModalHost />
              <AppRoutes />
            </SocketProvider>
          </AnonProvider>
        </BrowserRouter>
      )}
    </>
  )
}

export default App