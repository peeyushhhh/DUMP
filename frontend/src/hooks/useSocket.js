import { useEffect, useRef } from 'react';
import { io } from 'socket.io-client';

export default function useSocket(anonId) {
  const socketRef = useRef(null);

  useEffect(() => {
    const baseUrl = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/api\/v1\/?$/, '') || 'http://localhost:5000';
    const socket = io(baseUrl);

    socket.on('connect', () => {
      if (anonId) {
        socket.emit('register', anonId);
      }
    });

    if (anonId && socket.connected) {
      socket.emit('register', anonId);
    }

    socketRef.current = socket;

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [anonId]);

  return socketRef;
}
