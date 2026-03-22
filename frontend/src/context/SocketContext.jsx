import { createContext, useContext, useEffect, useState } from 'react';
import useSocket from '../hooks/useSocket';
import { useAnon } from './AnonContext';
import { getPendingRequests } from '../services/chatService';

const SocketContext = createContext(null);

export function SocketProvider({ children }) {
  const { anonId } = useAnon();
  const socketRef = useSocket(anonId);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [notifications, setNotifications] = useState(0);
  const [acceptedRoomId, setAcceptedRoomId] = useState(null);
  const [declinedRequestId, setDeclinedRequestId] = useState(null);

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
    };

    const handleRequestDeclined = ({ requestId }) => {
      setDeclinedRequestId(requestId);
      setPendingRequests((prev) => prev.filter((r) => r._id !== requestId));
      setNotifications((prev) => Math.max(0, prev - 1));
    };

    socket.on('request_received', handleRequestReceived);
    socket.on('request_accepted', handleRequestAccepted);
    socket.on('request_declined', handleRequestDeclined);

    return () => {
      socket.off('request_received', handleRequestReceived);
      socket.off('request_accepted', handleRequestAccepted);
      socket.off('request_declined', handleRequestDeclined);
    };
  }, [socketRef, anonId]);

  const value = {
    socket: socketRef,
    pendingRequests,
    notifications,
    setPendingRequests,
    setNotifications,
    acceptedRoomId,
    setAcceptedRoomId,
    declinedRequestId,
    setDeclinedRequestId,
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
