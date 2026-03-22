import { useNavigate } from 'react-router-dom';
import { useAnon } from '../context/AnonContext';
import { useSocketContext } from '../context/SocketContext';
import { acceptRequest, declineRequest } from '../services/chatService';
import Navbar from '../components/Navbar';

export default function ChatRequests() {
  const { anonId } = useAnon();
  const {
    pendingRequests,
    setPendingRequests,
    setNotifications,
    socket,
  } = useSocketContext();
  const navigate = useNavigate();

  const handleAccept = async (request) => {
    try {
      const res = await acceptRequest(request._id, anonId);
      const chatRoom = res.data?.chatRoom;
      if (chatRoom && socket?.current) {
        socket.current.emit('request_accepted', {
          requestId: request._id,
          requesterId: request.requesterId,
          roomId: chatRoom._id,
        });
      }
      setPendingRequests((prev) => prev.filter((r) => r._id !== request._id));
      setNotifications((prev) => Math.max(0, prev - 1));
      navigate(`/chat/${chatRoom._id}`);
    } catch {
      // Handle error
    }
  };

  const handleDecline = async (request) => {
    try {
      await declineRequest(request._id, anonId);
      if (socket?.current) {
        socket.current.emit('request_declined', {
          requestId: request._id,
          requesterId: request.requesterId,
        });
      }
      setPendingRequests((prev) => prev.filter((r) => r._id !== request._id));
      setNotifications((prev) => Math.max(0, prev - 1));
    } catch {
      // Handle error
    }
  };

  const getContentSnippet = (post) => {
    if (!post?.content) return '';
    return post.content.length > 100
      ? `${post.content.slice(0, 100)}...`
      : post.content;
  };

  return (
    <>
      <Navbar />
      <div
        style={{
          minHeight: '100vh',
          background: 'var(--bg)',
          padding: '2rem',
          paddingTop: '100px',
          maxWidth: '640px',
          margin: '0 auto',
        }}
      >
        <h1
          style={{
            color: 'var(--text-primary)',
            fontSize: '1.75rem',
            fontWeight: 600,
            marginBottom: '0.25rem',
          }}
        >
          chat requests
        </h1>
        <p
          style={{
            color: 'var(--text-muted)',
            fontSize: '0.875rem',
            marginBottom: '1.5rem',
          }}
        >
          people who want to talk privately
        </p>

        {pendingRequests.length === 0 ? (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              minHeight: '120px',
              color: 'var(--text-muted)',
            }}
          >
            no pending requests
          </div>
        ) : (
          pendingRequests.map((request) => {
            const post = request.postId;
            const snippet = getContentSnippet(post);
            return (
              <div
                key={request._id}
                style={{
                  background: 'var(--bg-card)',
                  padding: '1.25rem',
                  borderRadius: '8px',
                  marginBottom: '1rem',
                  borderLeft: '3px solid var(--accent)',
                }}
              >
                <p
                  style={{
                    color: 'var(--text-primary)',
                    fontSize: '0.95rem',
                    lineHeight: 1.5,
                    marginBottom: '0.5rem',
                  }}
                >
                  {snippet || 'Post'}
                </p>
                <p
                  style={{
                    color: 'var(--text-muted)',
                    fontSize: '0.8rem',
                    marginBottom: '1rem',
                  }}
                >
                  wants to talk privately
                </p>
                <div style={{ display: 'flex', gap: '0.75rem' }}>
                  <button
                    type="button"
                    onClick={() => handleAccept(request)}
                    style={{
                      background: 'var(--accent)',
                      color: 'var(--text-primary)',
                      border: 'none',
                      padding: '0.5rem 1rem',
                      borderRadius: '6px',
                      fontSize: '0.9rem',
                      cursor: 'pointer',
                    }}
                  >
                    accept
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDecline(request)}
                    style={{
                      background: 'transparent',
                      color: 'var(--danger)',
                      border: '1px solid var(--danger)',
                      padding: '0.5rem 1rem',
                      borderRadius: '6px',
                      fontSize: '0.9rem',
                      cursor: 'pointer',
                    }}
                  >
                    decline
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </>
  );
}
