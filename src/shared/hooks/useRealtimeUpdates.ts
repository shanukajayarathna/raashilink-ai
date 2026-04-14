import { useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';

// ─── Module-level singleton ────────────────────────────────────────────────
let _socket: Socket | null = null;

function resolveSocketHost(): string {
  if (typeof window === 'undefined') return '';
  const { hostname, protocol } = window.location;
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    return 'http://localhost:5000';
  }
  // In production the Socket.io server lives on the same origin
  return `${protocol}//${window.location.host}`;
}

export function connectSocket(token: string): Socket {
  if (_socket?.connected) return _socket;
  if (_socket) {
    // Reconnect with updated auth
    (_socket as any).auth = { token };
    _socket.connect();
    return _socket;
  }
  _socket = io(resolveSocketHost(), {
    auth: { token },
    transports: ['websocket', 'polling'],
    reconnection: true,
    reconnectionAttempts: 10,
    reconnectionDelay: 2000,
  });
  return _socket;
}

export function getSocket(): Socket | null {
  return _socket;
}

export function disconnectSocket(): void {
  _socket?.disconnect();
  _socket = null;
}

// ─── Events ────────────────────────────────────────────────────────────────
export type RealtimeEvent =
  | 'interest_received'   // You received a new pending interest
  | 'mutual_match'        // A new mutual match was created (you're one of the parties)
  | 'match_removed';      // Someone removed you from their matches

export type RealtimeCallbacks = {
  /** Fired when another user sends you a pending interest */
  onInterestReceived?: (data: { fromUserId: string; fromUserName: string; fromUserProfilePic: string | null }) => void;
  /** Fired for both parties when a mutual match is formed */
  onMutualMatch?: (data: { fromUserId: string; fromUserName: string; fromUserProfilePic: string | null; conversationId: string | null }) => void;
  /** Fired when someone removes you from their mutual matches */
  onMatchRemoved?: (data: { byUserId: string }) => void;
};

/**
 * Subscribe to real-time match/interest events for the logged-in user.
 *
 * Call this once per page. The underlying socket is a singleton so multiple
 * subscribers on different pages work independently without duplicate connections.
 */
export function useRealtimeUpdates(callbacks: RealtimeCallbacks) {
  // Use a ref so the effect closure never captures stale callbacks
  const cbRef = useRef<RealtimeCallbacks>(callbacks);
  cbRef.current = callbacks;

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return;

    const socket = connectSocket(token);

    const onInterestReceived = (d: any) => cbRef.current.onInterestReceived?.(d);
    const onMutualMatch = (d: any) => cbRef.current.onMutualMatch?.(d);
    const onMatchRemoved = (d: any) => cbRef.current.onMatchRemoved?.(d);

    socket.on('interest_received', onInterestReceived);
    socket.on('mutual_match', onMutualMatch);
    socket.on('match_removed', onMatchRemoved);

    return () => {
      socket.off('interest_received', onInterestReceived);
      socket.off('mutual_match', onMutualMatch);
      socket.off('match_removed', onMatchRemoved);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}
