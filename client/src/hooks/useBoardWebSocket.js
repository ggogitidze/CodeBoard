import { useEffect, useRef } from 'react';

export function useBoardWebSocket({ sessionId, guestName, onRemoteUpdate, onConnect, onError }) {
  const wsRef = useRef(null);

  // Send a message to the server
  const send = (type, payload) => {
    if (wsRef.current && wsRef.current.readyState === 1) {
      wsRef.current.send(JSON.stringify({ type, payload, sessionId, guestName }));
    }
  };

  useEffect(() => {
    if (!sessionId || !guestName) return;
    let ws;
    let reconnectTimeout;
    function connect() {
      ws = new window.WebSocket(`ws://localhost:8080/ws/board/${sessionId}`);
      wsRef.current = ws;
      ws.onopen = () => {
        // Join session
        send('join', { guestName });
        if (onConnect) onConnect();
      };
      ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data);
          if (msg.type === 'update' && onRemoteUpdate) {
            onRemoteUpdate(msg.payload);
          }
        } catch {}
      };
      ws.onclose = () => {
        // Try to reconnect after 1s
        reconnectTimeout = setTimeout(connect, 1000);
      };
      ws.onerror = (err) => {
        if (process.env.NODE_ENV === 'production') {
          // Suppress WebSocket errors in production
          return;
        }
        if (onError) onError(err.message || 'WebSocket error');
        ws.close();
      };
    }
    connect();
    return () => {
      if (ws) ws.close();
      if (reconnectTimeout) clearTimeout(reconnectTimeout);
    };
    // eslint-disable-next-line
  }, [sessionId, guestName]);

  return { send };
} 