import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import useSocket from '../hooks/useSocket';
import { useAnon } from './AnonContext';
import { getPendingRequests } from '../services/chatService';
import { getNotifications } from '../services/notificationService';

const SocketContext = createContext(null);

const ROOMS_KEY = 'dump_active_rooms';
const ROOM_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

function loadRooms() {
  try {
    const raw = localStorage.getItem(ROOMS_KEY);
    if (!raw) return [];
    const rooms = JSON.parse(raw);
    const now = Date.now();
    return rooms.filter((r) => now - r.createdAt < ROOM_TTL_MS);
  } catch {
    return [];
  }
}

function saveRooms(rooms) {
  try {
    localStorage.setItem(ROOMS_KEY, JSON.stringify(rooms));
  } catch {}
}

export function SocketProvider({ children }) {
  const { anonId } = useAnon();
  const socketRef = useSocket(anonId);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [notifications, setNotifications] = useState(0);
  const [unreadNotifCount, setUnreadNotifCount] = useState(0);
  const [acceptedRoomId, setAcceptedRoomId] = useState(null);
  const [declinedRequestId, setDeclinedRequestId] = useState(null);
  const [activeRooms, setActiveRoomsState] = useState(() => loadRooms());

  // Persist rooms to localStorage whenever they change
  const setActiveRooms = useCallback((updater) => {
    setActiveRoomsState((prev) => {
      const next = typeof updater === 'function' ? updater(prev) : updater;
      saveRooms(next);
      return next;
    });
  }, []);

  // Add or update a room in the active list
  const registerRoom = useCallback((roomId, meta = {}) => {
    setActiveRooms((prev) => {
      const exists = prev.find((r) => r.roomId === roomId);
      if (exists) return prev;
      return [
        ...prev,
        {
          roomId,
          createdAt: Date.now(),
          lastMessage: null,
          unread: 0,
          ...meta,
        },
      ];
    });
  }, [setActiveRooms]);

  // Update last message preview for a room
  const updateRoomLastMessage = useCallback((roomId, text) => {
    setActiveRooms((prev) =>
      prev.map((r) =>
        r.roomId === roomId
          ? { ...r, lastMessage: text, lastAt: Date.now() }
          : r
      )
    );
  }, [setActiveRooms]);

  // Mark room as read
  const markRoomRead = useCallback((roomId) => {
    setActiveRooms((prev) =>
      prev.map((r) => (r.roomId === roomId ? { ...r, unread: 0 } : r))
    );
  }, [setActiveRooms]);

  // Remove a room
  const removeRoom = useCallback((roomId) => {
    setActiveRooms((prev) => prev.filter((r) => r.roomId !== roomId));
  }, [setActiveRooms]);

  const refreshUnreadNotifCount = useCallback(() => {
    if (!anonId) return;
    getNotifications(anonId)
      .then((body) => {
        const list = body?.data?.notifications ?? [];
        setUnreadNotifCount(Array.isArray(list) ? list.length : 0);
      })
      .catch(() => {});
  }, [anonId]);

  useEffect(() => {
    if (!anonId) return;
    getPendingRequests(anonId)
      .then((res) => {
        const requests = res.data?.requests ?? [];
        setPendingRequests(requests);
        setNotifications(requests.length);
      })
      .catch(() => {});
  }, [anonId]);

  useEffect(() => {
    refreshUnreadNotifCount();
  }, [refreshUnreadNotifCount]);

  useEffect(() => {
    const socket = socketRef.current;
    if (!socket) return;

    const handleRequestReceived = async () => {
      try {
        const res = await getPendingRequests(anonId);
        const requests = res.data?.requests ?? [];
        setPendingRequests(requests);
        setNotifications(requests.length);
      } catch {
        setNotifications((prev) => prev + 1);
      }
    };

    const handleRequestAccepted = ({ roomId }) => {
      setAcceptedRoomId(roomId);
      registerRoom(roomId);
    };

    const handleRequestDeclined = ({ requestId }) => {
      setDeclinedRequestId(requestId);
      setPendingRequests((prev) => prev.filter((r) => r._id !== requestId));
      setNotifications((prev) => Math.max(0, prev - 1));
    };

    // Track incoming messages for unread counts + previews
    const handleReceiveMessage = (message) => {
      setActiveRooms((prev) =>
        prev.map((r) => {
          if (r.roomId !== message.roomId) return r;
          return {
            ...r,
            lastMessage: message.text,
            lastAt: Date.now(),
            // Don't increment unread here — Chat.jsx will handle it when not focused
          };
        })
      );
    };

    const handleNewNotification = (payload) => {
      const n = payload?.notification;
      if (!n || n.recipientId !== anonId) return;
      setUnreadNotifCount((c) => c + 1);
    };

    socket.on('request_received', handleRequestReceived);
    socket.on('request_accepted', handleRequestAccepted);
    socket.on('request_declined', handleRequestDeclined);
    socket.on('receive_message', handleReceiveMessage);
    socket.on('new_notification', handleNewNotification);

    return () => {
      socket.off('request_received', handleRequestReceived);
      socket.off('request_accepted', handleRequestAccepted);
      socket.off('request_declined', handleRequestDeclined);
      socket.off('receive_message', handleReceiveMessage);
      socket.off('new_notification', handleNewNotification);
    };
  }, [socketRef, anonId, registerRoom, setActiveRooms]);

  const value = {
    socket: socketRef,
    pendingRequests,
    notifications,
    setPendingRequests,
    setNotifications,
    unreadNotifCount,
    setUnreadNotifCount,
    refreshUnreadNotifCount,
    acceptedRoomId,
    setAcceptedRoomId,
    declinedRequestId,
    setDeclinedRequestId,
    activeRooms,
    registerRoom,
    updateRoomLastMessage,
    markRoomRead,
    removeRoom,
  };

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  );
}

export function useSocketContext() {
  return useContext(SocketContext);
}

export default SocketProvider;
