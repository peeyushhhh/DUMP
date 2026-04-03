import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell } from 'lucide-react';
import { useAnon } from '../context/AnonContext';
import { useSocketContext } from '../context/SocketContext';
import {
  getNotifications,
  markAllNotificationsRead,
  markNotificationRead,
} from '../services/notificationService';

function timeAgo(dateStr) {
  const date = new Date(dateStr);
  const now = new Date();
  const seconds = Math.floor((now - date) / 1000);
  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} ${minutes === 1 ? 'minute' : 'minutes'} ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} ${hours === 1 ? 'hour' : 'hours'} ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days} ${days === 1 ? 'day' : 'days'} ago`;
  const weeks = Math.floor(days / 7);
  return `${weeks} ${weeks === 1 ? 'week' : 'weeks'} ago`;
}

const COPY = {
  comment_on_post: 'someone commented on your dump',
  reply_on_comment: 'someone replied to your comment',
};

export default function NotificationBell() {
  const navigate = useNavigate();
  const { anonId } = useAnon();
  const {
    socket,
    unreadNotifCount,
    setUnreadNotifCount,
    refreshUnreadNotifCount,
  } = useSocketContext();
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [markingAll, setMarkingAll] = useState(false);
  const panelRef = useRef(null);
  const toggleRef = useRef(null);

  const loadList = () => {
    if (!anonId) return;
    setLoading(true);
    getNotifications(anonId)
      .then((body) => {
        const list = body?.data?.notifications ?? [];
        setItems(Array.isArray(list) ? list : []);
        setUnreadNotifCount(list.length);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (!open || !anonId) return;
    loadList();
  }, [open, anonId]);

  useEffect(() => {
    const s = socket?.current;
    if (!s || !anonId) return;

    const onNew = (payload) => {
      const n = payload?.notification;
      if (!n || n.recipientId !== anonId) return;
      if (open) {
        setItems((prev) => [n, ...prev].filter((x, i, arr) => arr.findIndex((y) => y._id === x._id) === i).slice(0, 20));
      }
    };

    s.on('new_notification', onNew);
    return () => s.off('new_notification', onNew);
  }, [socket, anonId, open]);

  useEffect(() => {
    if (!open) return;

    const handleMouseDown = (event) => {
      const panelEl = panelRef.current;
      const toggleEl = toggleRef.current;
      if (!panelEl || !toggleEl) return;
      const target = event.target;
      if (panelEl.contains(target) || toggleEl.contains(target)) return;
      setOpen(false);
    };

    const handleKeyDown = (event) => {
      if (event.key === 'Escape' || event.key === 'Esc') {
        setOpen(false);
      }
    };

    document.addEventListener('mousedown', handleMouseDown);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleMouseDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [open]);

  const handleMarkAllRead = async () => {
    if (!anonId || markingAll) return;
    setMarkingAll(true);
    try {
      await markAllNotificationsRead(anonId);
      setItems([]);
      setUnreadNotifCount(0);
    } catch {
      refreshUnreadNotifCount();
    } finally {
      setMarkingAll(false);
    }
  };

  const handleItemClick = async (n) => {
    if (!anonId || !n?.postId) return;
    const pid = typeof n.postId === 'object' ? n.postId._id ?? n.postId : n.postId;
    try {
      await markNotificationRead(n._id, anonId);
      setItems((prev) => prev.filter((x) => x._id !== n._id));
      setUnreadNotifCount((c) => Math.max(0, c - 1));
    } catch {
      /* still navigate */
    }
    setOpen(false);
    navigate(`/post/${pid}`);
  };

  return (
    <div style={{ position: 'relative' }}>
      <button
        ref={toggleRef}
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label="Notifications"
        style={{
          background: 'none',
          border: 'none',
          color: 'var(--text-secondary)',
          cursor: 'pointer',
          padding: '6px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
        }}
      >
        <Bell size={18} strokeWidth={1.75} />
        {unreadNotifCount > 0 && (
          <span
            style={{
              position: 'absolute',
              top: '2px',
              right: '2px',
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              background: '#ef4444',
              border: '2px solid var(--bg)',
            }}
          />
        )}
      </button>

      {open && (
        <>
          <div
            onClick={() => setOpen(false)}
            style={{
              position: 'fixed',
              inset: 0,
              zIndex: 1998,
              background: 'rgba(0,0,0,0.4)',
              backdropFilter: 'blur(2px)',
            }}
          />
          <div
            ref={panelRef}
            style={{
              position: 'fixed',
              top: '56px',
              right: '16px',
              width: '300px',
              zIndex: 1999,
              background: 'var(--bg-elevated, #0f0f14)',
              border: '1px solid var(--border)',
              borderRadius: '16px',
              boxShadow: '0 16px 48px rgba(0,0,0,0.6)',
              overflow: 'hidden',
              animation: 'notifSlideDown 180ms ease both',
            }}
          >
            <style>{`
              @keyframes notifSlideDown {
                from { opacity: 0; transform: translateY(-8px) scale(0.96); }
                to { opacity: 1; transform: translateY(0) scale(1); }
              }
            `}</style>

            <div
              style={{
                padding: '12px 14px 10px',
                borderBottom: '1px solid var(--border)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '8px',
              }}
            >
              <div style={{ flex: 1, minWidth: 0 }}>
                <p
                  style={{
                    fontSize: '0.68rem',
                    color: 'var(--accent)',
                    fontWeight: 600,
                    letterSpacing: '0.08em',
                    textTransform: 'uppercase',
                    margin: 0,
                  }}
                >
                  notifications
                </p>
                <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', margin: '2px 0 0' }}>
                  {items.length} unread
                </p>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                {items.length > 0 && (
                  <button
                    type="button"
                    disabled={markingAll}
                    onClick={handleMarkAllRead}
                    style={{
                      background: 'var(--bg-hover)',
                      border: '1px solid var(--border)',
                      color: 'var(--text-primary)',
                      fontSize: '0.72rem',
                      padding: '5px 10px',
                      borderRadius: '8px',
                      cursor: markingAll ? 'not-allowed' : 'pointer',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    mark all read
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'var(--text-muted)',
                    cursor: 'pointer',
                    fontSize: '1rem',
                    lineHeight: 1,
                    padding: '4px',
                  }}
                >
                  ✕
                </button>
              </div>
            </div>

            <div style={{ maxHeight: '320px', overflowY: 'auto' }}>
              {loading && (
                <p style={{ padding: '14px', color: 'var(--text-muted)', fontSize: '0.82rem', margin: 0 }}>
                  loading…
                </p>
              )}
              {!loading && items.length === 0 && (
                <p style={{ padding: '14px', color: 'var(--text-muted)', fontSize: '0.82rem', margin: 0 }}>
                  you&apos;re all caught up
                </p>
              )}
              {!loading &&
                items.map((n, i) => (
                  <button
                    key={n._id}
                    type="button"
                    onClick={() => handleItemClick(n)}
                    style={{
                      display: 'block',
                      width: '100%',
                      textAlign: 'left',
                      padding: '11px 14px',
                      borderBottom: i < items.length - 1 ? '1px solid var(--border)' : 'none',
                      background: 'transparent',
                      borderLeft: 'none',
                      borderRight: 'none',
                      borderTop: 'none',
                      cursor: 'pointer',
                      transition: 'background 150ms ease',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = 'var(--bg-hover)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'transparent';
                    }}
                  >
                    <p
                      style={{
                        fontSize: '0.82rem',
                        color: 'var(--text-primary)',
                        margin: 0,
                        lineHeight: 1.45,
                        fontWeight: 500,
                      }}
                    >
                      {COPY[n.type] ?? 'new activity'}
                    </p>
                    <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', margin: '6px 0 0' }}>
                      {timeAgo(n.createdAt)}
                    </p>
                  </button>
                ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
