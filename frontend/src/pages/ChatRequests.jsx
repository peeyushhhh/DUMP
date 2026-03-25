import { useNavigate } from 'react-router-dom';
import { useAnon } from '../context/AnonContext';
import { useSocketContext } from '../context/SocketContext';
import { acceptRequest, declineRequest } from '../services/chatService';
import Navbar from '../components/Navbar';

export default function ChatRequests() {
  const { anonId } = useAnon();
  const { pendingRequests, setPendingRequests, setNotifications, socket, registerRoom } = useSocketContext();
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
      // Register room on the accepting side too
      if (chatRoom?._id) {
        registerRoom(chatRoom._id);
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
    return post.content.length > 100 ? `${post.content.slice(0, 100)}...` : post.content;
  };

  return (
    <>
      <Navbar />
      <main className="page-wrap fade-up">

        {/* Header */}
        <section className="glass-card" style={{ padding: '1rem', marginBottom: '1rem' }}>
          <p className="section-kicker" style={{ marginBottom: '6px' }}>inbox</p>
          <h1 style={{ color: 'var(--text-primary)', fontSize: '1.4rem', fontWeight: 600, marginBottom: '0.2rem' }}>
            chat requests
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
            people who want to talk privately · chats last 24h
          </p>
        </section>

        {/* Count */}
        {pendingRequests.length > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
            <h2 className="section-kicker">pending</h2>
            <span style={{
              background: 'rgba(139,92,246,0.15)',
              color: 'var(--accent)',
              fontSize: '0.72rem',
              fontWeight: 700,
              padding: '2px 8px',
              borderRadius: '999px',
              border: '1px solid rgba(139,92,246,0.25)',
            }}>
              {pendingRequests.length}
            </span>
          </div>
        )}

        {/* Empty state */}
        {pendingRequests.length === 0 && (
          <div className="glass-card" style={{ padding: '3rem', textAlign: 'center' }}>
            <div style={{ fontSize: '2rem', marginBottom: '0.75rem' }}>📭</div>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
              no pending requests right now
            </p>
          </div>
        )}

        {/* Request cards */}
        {pendingRequests.map((request) => {
          const post = request.postId;
          const snippet = getContentSnippet(post);
          return (
            <article
              key={request._id}
              className="glass-card"
              style={{
                padding: '1.1rem',
                marginBottom: '0.65rem',
                borderLeft: '3px solid var(--accent)',
              }}
            >
              {/* Post snippet */}
              {snippet && (
                <p style={{
                  color: 'var(--text-secondary)',
                  fontSize: '0.875rem',
                  lineHeight: 1.55,
                  marginBottom: '0.5rem',
                  fontStyle: 'italic',
                  borderLeft: '2px solid var(--border)',
                  paddingLeft: '10px',
                }}>
                  "{snippet}"
                </p>
              )}

              <p style={{ color: 'var(--text-muted)', fontSize: '0.78rem', marginBottom: '1rem' }}>
                someone wants to talk privately about this
              </p>

              <div style={{ display: 'flex', gap: '0.6rem' }}>
                <button
                  type="button"
                  onClick={() => handleAccept(request)}
                  className="primary-btn"
                  style={{ fontSize: '0.85rem', padding: '0.5rem 1.25rem' }}
                >
                  accept
                </button>
                <button
                  type="button"
                  onClick={() => handleDecline(request)}
                  style={{
                    background: 'transparent',
                    color: 'var(--danger)',
                    border: '1px solid rgba(239,68,68,0.35)',
                    padding: '0.5rem 1.1rem',
                    borderRadius: '10px',
                    fontSize: '0.85rem',
                    cursor: 'pointer',
                    transition: 'border-color 150ms ease, background 150ms ease',
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(239,68,68,0.08)'}
                  onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                >
                  decline
                </button>
              </div>
            </article>
          );
        })}

      </main>
    </>
  );
}