import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Box, Typography, Stack, Avatar, TextField, IconButton,
  List, ListItem, ListItemButton, ListItemAvatar, ListItemText,
  Divider, CircularProgress, useTheme, useMediaQuery,
  Dialog, DialogTitle, DialogContent, DialogActions, Button, Chip, Tooltip,
  Snackbar, Alert, Backdrop
} from '@mui/material';
import { Send, ArrowLeft, MessageCircle, Trash2, PlusCircle, Heart, AlertCircle } from 'lucide-react';
import { useSelector } from 'react-redux';
import { RootState } from '@/app/store/store';
import api from '@/shared/config/axiosConfig';
import { markSentPreview } from '@/shared/lib/sentMsgTracker';
import { useLocation, useNavigate } from 'react-router-dom';
import { useRealtimeUpdates, connectSocket } from '@/shared/hooks/useRealtimeUpdates';
import weddingService from '@/features/wedding/services/weddingService';

interface Conversation {
  id: string;
  title: string;
  otherUserId: string;
  img?: string | null;
  preview: string;
  date: string;
  lastSenderId?: string | null;
}

interface Message {
  id: string;
  senderId: string;
  content: string;
  createdAt: string;
}

interface MutualMatch {
  id: string;
  name: string;
  initials: string;
  img: string | null;
}

export default function MessagesPage() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const currentUser = useSelector((state: RootState) => state.auth.user);
  const currentUserId = (currentUser as any)?._id || (currentUser as any)?.id || '';
  const location = useLocation();
  const navigate = useNavigate();
  const deepLinkConvId = (location.state as any)?.conversationId as string | undefined;
  const deepLinkUserId = (location.state as any)?.openUserId as string | undefined;
  const deepLinkStartConv = Boolean((location.state as any)?.startConversation);

  const [conversations, setConversations] = useState<Conversation[]>([]);
  // All mutual matches — full list regardless of whether a conversation exists
  const [allMutualMatches, setAllMutualMatches] = useState<MutualMatch[]>([]);
  // Derived: mutual matches that don't have an active conversation (eligible to start chat)
  const eligibleMatches = allMutualMatches.filter(
    (m) => !conversations.some((c) => c.otherUserId === m.id),
  );
  const [selectedConv, setSelectedConv] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loadingConvs, setLoadingConvs] = useState(true);
  const [loadingMsgs, setLoadingMsgs] = useState(false);
  const [unreadByConv, setUnreadByConv] = useState<Record<string, number>>({});
  const [openingConvFor, setOpeningConvFor] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [showList, setShowList] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const prevMsgIdsRef = useRef<Set<string>>(new Set());
  const selectedConvIdRef = useRef<string | null>(null);
  const isInitialMount = useRef(true);
  const [deleteTarget, setDeleteTarget] = useState<Conversation | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [weddingInviteOpen, setWeddingInviteOpen] = useState(false);
  const [sendingInvite, setSendingInvite] = useState(false);
  const [inviteSnack, setInviteSnack] = useState<{ open: boolean; msg: string; severity: 'success' | 'error' }>({ open: false, msg: '', severity: 'success' });
  // Wedding planning status with the current conversation partner
  const [weddingStatus, setWeddingStatus] = useState<'none' | 'invited' | 'coupled'>('none');
  const [cancellingWedding, setCancellingWedding] = useState(false);
  const [resetDialogOpen, setResetDialogOpen] = useState(false);
  const [globalLoading, setGlobalLoading] = useState({ open: false, message: '' });
  const selectedConversationId = selectedConv?.id || null;

  const mapMutualMatch = useCallback((match: any): MutualMatch => ({
    id: match.id,
    name: match.name,
    initials: match.initials || match.name?.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2) || '??',
    img: match.img || null,
  } as MutualMatch), []);

  const refreshMutualMatches = useCallback(async () => {
    try {
      const matchesRes: any = await api.get('/matches/mutual');
      const contacts: MutualMatch[] = (matchesRes.data?.data?.items || []).map(mapMutualMatch);
      setAllMutualMatches(contacts);
      return contacts;
    } catch {
      return [] as MutualMatch[];
    }
  }, [mapMutualMatch]);

  const refreshConversationsList = useCallback(async () => {
    try {
      const convRes: any = await api.get('/chat/conversations');
      const items: Conversation[] = convRes.data?.data?.items || [];
      setConversations(items);
      setSelectedConv((current) => {
        if (!current) return current;
        const stillExists = items.find((c) => c.id === current.id);
        if (stillExists) return { ...current, ...stillExists };
        setMessages([]);
        setWeddingStatus('none');
        if (isMobile) setShowList(true);
        return null;
      });
    } catch {
      // silent
    }
  }, [isMobile]);

  const clearUnreadForConversation = useCallback((conversationId?: string | null) => {
    if (!conversationId) return;
    setUnreadByConv((prev) => {
      if (!prev[conversationId]) return prev;
      const next = { ...prev };
      delete next[conversationId];
      return next;
    });
  }, []);

  const syncUnreadFromServer = useCallback(async () => {
    try {
      const res: any = await api.get('/notifications');
      const items: any[] = res.data?.data?.notifications || [];
      const grouped = items.reduce((acc: Record<string, number>, n: any) => {
        if (n?.type !== 'message_received' || !n?.conversationId) return acc;
        acc[n.conversationId] = (acc[n.conversationId] || 0) + 1;
        return acc;
      }, {});
      setUnreadByConv(grouped);
    } catch {
      // silent
    }
  }, []);

  const markConversationAsRead = useCallback(async (conversationId?: string | null) => {
    if (!conversationId) return;
    clearUnreadForConversation(conversationId);
    try {
      const res: any = await api.get('/notifications');
      const items: any[] = res.data?.data?.notifications || [];
      const ids = items
        .filter((n) => n?.type === 'message_received' && n?.conversationId === conversationId)
        .map((n) => n.id)
        .filter(Boolean);
      if (ids.length > 0) {
        await Promise.all(ids.map((id) => api.patch(`/notifications/${id}/read`).catch(() => {})));
      }
      // Only refresh notification counters; don't refresh the whole app.
      window.dispatchEvent(new CustomEvent('notifications:refresh'));
    } catch {
      // silent
    }
  }, [clearUnreadForConversation]);

  const refreshJourneyState = useCallback(async () => {
    if (!selectedConv) {
      setWeddingStatus('none');
      return;
    }

    try {
      const weddingRes: any = await weddingService.getProject();
      const project = weddingRes?.data;
      if (!project) { setWeddingStatus('none'); return; }
      const isCoupled = Array.isArray(project.coupleUserIds) && project.coupleUserIds.length >= 2 &&
        project.coupleUserIds.some((u: any) => {
          const uid = typeof u === 'object' ? (u._id || u.id) : u;
          return String(uid) === String(selectedConv.otherUserId);
        });
      if (isCoupled) { setWeddingStatus('coupled'); return; }
      const isInvited = project.pendingInvite?.status === 'pending';
      setWeddingStatus(isInvited ? 'invited' : 'none');
    } catch {
      setWeddingStatus('none');
    }
  }, [selectedConv]);

  // Fetch wedding journey status from DB whenever conversation changes
  useEffect(() => {
    refreshJourneyState();
  }, [refreshJourneyState]);

  useEffect(() => {
    const onAppRefresh = () => {
      refreshJourneyState();
      refreshConversationsList();
      refreshMutualMatches();
    };
    window.addEventListener('app:refresh', onAppRefresh);
    return () => {
      window.removeEventListener('app:refresh', onAppRefresh);
    };
  }, [refreshJourneyState, refreshConversationsList, refreshMutualMatches]);

  /** Find an existing conversation by partner userId, or call the server to create one */
  const getOrOpenConversation = useCallback(async (userId: string): Promise<Conversation | null> => {
    // Check local state first — no round-trip if it already exists
    const existing = conversations.find((c) => c.otherUserId === userId);
    if (existing) return existing;

    setOpeningConvFor(userId);
    try {
      const res: any = await api.post('/chat/conversations/open', { userId });
      const conv: Conversation = res.data.data.conversation;
      // Add to list (deduplicated by id)
      setConversations((prev) => {
        if (prev.some((c) => c.id === conv.id)) return prev;
        return [conv, ...prev];
      });
      return conv;
    } catch {
      return null;
    } finally {
      setOpeningConvFor(null);
    }
  }, [conversations]);

  useEffect(() => {
    // Fetch conversations and mutual matches in parallel
    Promise.all([
      api.get('/chat/conversations'),
      api.get('/matches/mutual'),
    ]).then(async ([convRes, matchRes]: any[]) => {
      const items: Conversation[] = convRes.data.data.items || [];
      setConversations(items);

      // Build mutual matches list — only those without an existing conversation
      const rawMatches: any[] = matchRes.data?.data?.items || [];
      const contacts: MutualMatch[] = rawMatches.map(mapMutualMatch);
      // Store full list — eligibleMatches derived state handles filtering
      setAllMutualMatches(contacts);

      // ── Auto-select from navigation state ──
      if (deepLinkConvId) {
        const target = items.find((c) => c.id === deepLinkConvId);
        if (target) { setSelectedConv(target); if (isMobile) setShowList(false); }
      } else if (deepLinkUserId) {
        // Find existing conv or open one only if the caller explicitly requested it
        const existing = items.find((c) => c.otherUserId === deepLinkUserId);
        if (existing) {
          setSelectedConv(existing);
          if (isMobile) setShowList(false);
        } else if (deepLinkStartConv) {
          // Only create a conversation when the user clicked "Message" on a tile
          setOpeningConvFor(deepLinkUserId);
          try {
            const r: any = await api.post('/chat/conversations/open', { userId: deepLinkUserId });
            const conv: Conversation = r.data.data.conversation;
            setConversations((prev) => prev.some((c) => c.id === conv.id) ? prev : [conv, ...prev]);
            setSelectedConv(conv);
            if (isMobile) setShowList(false);
          } catch { /* mutual match may not exist — fail silently */ }
          finally { setOpeningConvFor(null); }
          // else: deepLinkUserId without startConversation → person appears in Eligible Chats, no auto-open
        }
      }
    })
    .catch(() => {})
    .finally(() => setLoadingConvs(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    syncUnreadFromServer();
  }, [syncUnreadFromServer]);


  // Handle re-navigation to this page while it's already mounted (e.g. clicking a notification
  // when the user is already on /messages). location.key changes on every navigate() call.
  useEffect(() => {
    if (isInitialMount.current) { isInitialMount.current = false; return; }
    if (!deepLinkConvId && !deepLinkUserId) return;

    const doNav = async () => {
      // Use in-memory conversations first to avoid unnecessary UI resets.
      let items = conversations;

      if (deepLinkConvId) {
        const target = items.find((c) => c.id === deepLinkConvId);
        if (target) { setSelectedConv(target); if (isMobile) setShowList(false); return; }
      }
      if (deepLinkUserId) {
        const existing = items.find((c) => c.otherUserId === deepLinkUserId);
        if (existing) {
          setSelectedConv(existing);
          if (isMobile) setShowList(false);
          return;
        }
      }

      // Only fetch if we couldn't resolve target from local state.
      try {
        const res: any = await api.get('/chat/conversations');
        items = res.data?.data?.items || conversations;
        setConversations(items);
      } catch { /* use cached */ }

      if (deepLinkConvId) {
        const target = items.find((c) => c.id === deepLinkConvId);
        if (target) { setSelectedConv(target); if (isMobile) setShowList(false); return; }
      }
      if (deepLinkUserId) {
        const existing = items.find((c) => c.otherUserId === deepLinkUserId);
        if (existing) {
          setSelectedConv(existing);
          if (isMobile) setShowList(false);
        } else if (deepLinkStartConv) {
          setOpeningConvFor(deepLinkUserId);
          try {
            const r: any = await api.post('/chat/conversations/open', { userId: deepLinkUserId });
            const conv: Conversation = r.data.data.conversation;
            setConversations((prev) => prev.some((c) => c.id === conv.id) ? prev : [conv, ...prev]);
            setSelectedConv(conv);
            if (isMobile) setShowList(false);
          } catch { /* fail silently */ }
          finally { setOpeningConvFor(null); }
        }
      }
    };
    doNav();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.key]);

  /** Start or open an existing conversation with a mutual match contact */
  const handleStartChat = async (match: MutualMatch) => {
    const conv = await getOrOpenConversation(match.id);
    if (!conv) return;
    // No need to remove from allMutualMatches — eligibleMatches derived state handles exclusion
    setSelectedConv(conv);
    if (isMobile) setShowList(false);
  };

  useEffect(() => {
    if (!selectedConversationId) return;
    let isActive = true;
    setLoadingMsgs(true);
    api.get(`/chat/${selectedConversationId}/history`)
      .then((res: any) => {
        if (!isActive) return;
        const fetched: Message[] = res.data.data.messages || [];
        setMessages(fetched);
        // Seed known IDs so the first poll doesn't re-fire sound
        prevMsgIdsRef.current = new Set(fetched.map((m) => m.id));
      })
      .catch(() => {})
      .finally(() => {
        if (isActive) setLoadingMsgs(false);
      });
    return () => {
      isActive = false;
    };
  }, [selectedConversationId]);

  useEffect(() => {
    selectedConvIdRef.current = selectedConversationId;
  }, [selectedConversationId]);

  useEffect(() => {
    const conversationId = selectedConversationId;
    window.dispatchEvent(new CustomEvent('chat:activeConversation', { detail: { conversationId } }));
    if (conversationId) {
      markConversationAsRead(conversationId);
    }
    return () => {
      window.dispatchEvent(new CustomEvent('chat:activeConversation', { detail: { conversationId: null } }));
    };
  }, [selectedConversationId, markConversationAsRead]);

  // Poll active conversation every 5s to keep messages fresh
  useEffect(() => {
    if (!selectedConversationId) return;
    const interval = setInterval(async () => {
      try {
        const res: any = await api.get(`/chat/${selectedConversationId}/history`);
        const fetched: Message[] = res.data.data.messages || [];
        const incoming = fetched.filter((m) => !prevMsgIdsRef.current.has(m.id));
        if (incoming.length === 0) return;
        incoming.forEach((m) => prevMsgIdsRef.current.add(m.id));
        setMessages((prev) => {
          const existingIds = new Set(prev.map((m) => m.id));
          const toAppend = incoming.filter((m) => !existingIds.has(m.id));
          if (toAppend.length === 0) return prev;
          return [...prev, ...toAppend];
        });
      } catch {
        // silent
      }
    }, 5000);
    return () => clearInterval(interval);
  }, [selectedConversationId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSelectConv = (conv: Conversation) => {
    setSelectedConv(conv);
    clearUnreadForConversation(conv.id);
    if (isMobile) setShowList(false);
  };

  const handleDeleteConv = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await api.delete(`/chat/conversations/${deleteTarget.id}`);
      // Removing from conversations automatically re-exposes the user in eligibleMatches
      // if they are still a mutual match — no extra state manipulation needed
      setConversations((prev) => prev.filter((c) => c.id !== deleteTarget.id));
      if (selectedConv?.id === deleteTarget.id) {
        setSelectedConv(null);
        setMessages([]);
        if (isMobile) setShowList(true);
      }
    } catch {
      // silent
    } finally {
      setDeleting(false);
      setDeleteTarget(null);
    }
  };

  const handleSend = async () => {
    if (!newMessage.trim() || !selectedConv || sending) return;
    const content = newMessage.trim();
    setNewMessage('');
    setSending(true);

    // Optimistically add the message
    const optimistic: Message = {
      id: `tmp-${Date.now()}`,
      senderId: currentUserId,
      content,
      createdAt: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, optimistic]);

    try {
      const resp = await api.post('/chat/messages', {
        recipientId: selectedConv.otherUserId,
        content,
      });
      // Replace optimistic message with real one if returned
      const real = resp.data?.data?.message;
      if (real) {
        setMessages((prev) =>
          prev.map((m) => (m.id === optimistic.id
            ? {
                ...m,
                id: real.id,
                senderId: String(real.senderId || currentUserId || optimistic.senderId),
                createdAt: real.createdAt || optimistic.createdAt,
              }
            : m))
        );
        if (real.id) prevMsgIdsRef.current.add(String(real.id));
      }
      // Refresh conversation preview
      markSentPreview(selectedConv.id, content);
      setConversations((prev) =>
        prev.map((c) => (c.id === selectedConv.id ? { ...c, preview: content } : c))
      );
    } catch {
      // Remove optimistic on failure
      setMessages((prev) => prev.filter((m) => m.id !== optimistic.id));
      setNewMessage(content);
    } finally {
      setSending(false);
    }
  };

  // Real-time: add new mutual match + handle match removal without page refresh
  useRealtimeUpdates({
    onMutualMatch: (data) => {
      if (!data.fromUserId) return;
      setAllMutualMatches((prev) => {
        if (prev.some((m) => m.id === data.fromUserId)) return prev;
        const name = data.fromUserName || 'Mutual Match';
        return [
          ...prev,
          {
            id: data.fromUserId,
            name,
            initials: name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2),
            img: data.fromUserProfilePic || null,
          },
        ];
      });
    },
    onMatchRemoved: (data) => {
      if (!data.byUserId) return;
      setAllMutualMatches((prev) => prev.filter((m) => m.id !== data.byUserId));
      setConversations((prev) => prev.filter((c) => c.otherUserId !== data.byUserId));
      setSelectedConv((conv) => {
        if (conv && conv.otherUserId === data.byUserId) {
          setMessages([]);
          setWeddingStatus('none');
          if (isMobile) setShowList(true);
          const removedBy = data.byUserName || 'Your match';
          setInviteSnack({ open: true, msg: `${removedBy} removed this match. You are back to searching for a partner.`, severity: 'error' });
          return null;
        }
        return conv;
      });
      refreshMutualMatches();
    },
  });

  // wedding socket: real-time status updates
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return;
    const socket = connectSocket(token);
    const onReset = () => {
      setWeddingStatus('none');
      setInviteSnack({ open: true, msg: 'The wedding planning was cancelled by the other party.', severity: 'error' });
    };
    const onAccepted = () => {
      setWeddingStatus('coupled');
    };
    socket.on('wedding_reset', onReset);
    socket.on('wedding_accepted', onAccepted);
    return () => {
      socket.off('wedding_reset', onReset);
      socket.off('wedding_accepted', onAccepted);
    };
  }, []);

  // chat socket: live message updates for both ends without refresh
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token || !currentUserId) return;
    const socket = connectSocket(token);

    const onMessageSent = (payload: any) => {
      const conversationId = String(payload?.conversationId || '');
      if (!conversationId) return;
      const senderId = String(payload?.senderId || '');
      const content = String(payload?.content || '');
      const createdAt = payload?.createdAt || new Date().toISOString();

      let missingConversation = false;
      let missingOtherUserId = '';
      setConversations((prev) => {
        const idx = prev.findIndex((c) => c.id === conversationId);
        if (idx === -1) {
          missingConversation = true;
          const isMine = senderId === String(currentUserId);
          missingOtherUserId = isMine ? String(payload?.receiverId || '') : senderId;
          return prev;
        }
        const current = prev[idx];
        const updated: Conversation = {
          ...current,
          preview: content,
          date: new Date(createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
          lastSenderId: senderId,
        };
        return [updated, ...prev.filter((c) => c.id !== conversationId)];
      });

      const isMine = senderId === String(currentUserId);
      const isActiveConversation = selectedConvIdRef.current === conversationId;

      // If this user had deleted/cleared the conversation, recreate it silently so it appears again.
      if (missingConversation && missingOtherUserId) {
        api.post('/chat/conversations/open', { userId: missingOtherUserId })
          .then((res: any) => {
            const conv = res.data?.data?.conversation as Conversation | undefined;
            if (!conv?.id) return;
            setConversations((list) => [conv, ...list.filter((c) => c.id !== conv.id)]);
            // Only auto-open if user isn't currently inside another chat
            setSelectedConv((current) => {
              if (current) return current;
              if (isMobile) setShowList(false);
              return conv;
            });
          })
          .catch(() => {});
      }

      if (!isMine && isActiveConversation) {
        setMessages((prev) => {
          const messageId = String(payload?.id || '');
          if (messageId && prev.some((m) => m.id === messageId)) return prev;
          if (messageId) prevMsgIdsRef.current.add(messageId);
          return [...prev, { id: messageId || `live-${Date.now()}`, senderId, content, createdAt }];
        });
        clearUnreadForConversation(conversationId);
        markConversationAsRead(conversationId);
        return;
      }

      if (!isMine && !isActiveConversation) {
        setUnreadByConv((prev) => ({ ...prev, [conversationId]: (prev[conversationId] || 0) + 1 }));
      }
    };

    socket.on('message_sent', onMessageSent);
    return () => {
      socket.off('message_sent', onMessageSent);
    };
  }, [currentUserId, clearUnreadForConversation, markConversationAsRead]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const initials = (name?: string | null) => {
    const safe = String(name || '').trim();
    if (!safe) return '??';
    return safe.split(/\s+/).map((n) => n[0] || '').join('').toUpperCase().slice(0, 2);
  };

  const formatTime = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const conversationList = (
    <Box sx={{ width: isMobile ? '100%' : 320, borderRight: '1px solid', borderColor: 'divider', display: 'flex', flexDirection: 'column', height: '100%' }}>
      <Box sx={{ p: 2.5, borderBottom: '1px solid', borderColor: 'divider' }}>
        <Typography variant="h6" sx={{ fontWeight: 700, color: 'primary.main' }}>
          Messages
        </Typography>
        <Typography variant="caption" color="text.secondary">
          {conversations.length} conversation{conversations.length !== 1 ? 's' : ''}
        </Typography>
      </Box>
      {loadingConvs ? (
        <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <CircularProgress size={28} />
        </Box>
      ) : conversations.length === 0 && eligibleMatches.length === 0 ? (
        <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', p: 4, gap: 2 }}>
          <MessageCircle size={48} color="#ccc" />
          <Typography variant="body2" color="text.secondary" textAlign="center">
            No conversations yet. Express interest in someone and they'll show up here once it's mutual!
          </Typography>
        </Box>
      ) : (
        <Box sx={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
          <List disablePadding>
            {conversations.filter(Boolean).map((conv) => (
              <React.Fragment key={conv.id}>
                <ListItem
                  disablePadding
                  secondaryAction={
                    <IconButton
                      size="small"
                      onClick={(e) => { e.stopPropagation(); setDeleteTarget(conv); }}
                      sx={{ opacity: 0, transition: 'opacity 0.15s', color: 'error.main', '.MuiListItem-root:hover &': { opacity: 1 } }}
                      aria-label="Delete conversation"
                    >
                      <Trash2 size={15} />
                    </IconButton>
                  }
                >
                  <ListItemButton
                    selected={selectedConv?.id === conv.id}
                    onClick={() => handleSelectConv(conv)}
                    sx={{ py: 1.5, px: 2, pr: 5, '&.Mui-selected': { bgcolor: 'primary.50' } }}
                  >
                    <ListItemAvatar>
                      <Avatar src={conv.img || undefined} sx={{ bgcolor: 'primary.main', width: 44, height: 44 }}>
                        {initials(conv.title)}
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText
                      primary={<Typography variant="subtitle2" sx={{ fontWeight: 600 }}>{conv.title}</Typography>}
                      secondary={
                        <Typography variant="caption" color="text.secondary" noWrap sx={{ display: 'block', maxWidth: 180 }}>
                          {conv.preview}
                        </Typography>
                      }
                    />
                    <Typography variant="caption" color="text.secondary" sx={{ ml: 1, flexShrink: 0 }}>
                      {conv.date}
                    </Typography>
                    {(unreadByConv[conv.id] || 0) > 0 && (
                      <Chip
                        label={unreadByConv[conv.id] > 99 ? '99+' : unreadByConv[conv.id]}
                        size="small"
                        color="primary"
                        sx={{ ml: 1, height: 18, fontSize: '0.65rem', fontWeight: 700 }}
                      />
                    )}
                  </ListItemButton>
                </ListItem>
                <Divider component="li" />
              </React.Fragment>
            ))}
          </List>

              {eligibleMatches.length > 0 && (
            <Box sx={{ mt: 'auto', borderTop: '1px solid', borderColor: 'divider' }}>
              <Box sx={{ px: 2, pt: 1, pb: 0.5, display: 'flex', alignItems: 'center', gap: 1 }}>
                <Typography variant="caption" sx={{ fontWeight: 700, color: 'text.secondary', letterSpacing: '0.06em' }}>
                  ELIGIBLE CHATS
                </Typography>
                <Chip label={eligibleMatches.length} size="small" color="primary" sx={{ height: 16, fontSize: '0.65rem' }} />
              </Box>
              <List disablePadding>
                {eligibleMatches.map((match) => (
                  <ListItem
                    key={match.id}
                    disablePadding
                    secondaryAction={
                      <Tooltip title="Start chat">
                        <IconButton
                          size="small"
                          disabled={openingConvFor === match.id}
                          onClick={() => handleStartChat(match)}
                          sx={{ color: 'primary.main' }}
                        >
                          {openingConvFor === match.id
                            ? <CircularProgress size={16} />
                            : <PlusCircle size={18} />}
                        </IconButton>
                      </Tooltip>
                    }
                  >
                    <ListItemButton sx={{ py: 1, px: 2, pr: 6, pointerEvents: 'none' }}>
                      <ListItemAvatar>
                        <Avatar
                          src={match.img || undefined}
                          sx={{ bgcolor: 'secondary.main', width: 40, height: 40, fontSize: '0.85rem' }}
                        >
                          {match.initials}
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary={<Typography variant="subtitle2" sx={{ fontWeight: 600 }}>{match.name}</Typography>}
                        secondary={<Typography variant="caption" color="text.secondary">Matched — tap + to chat</Typography>}
                      />
                    </ListItemButton>
                  </ListItem>
                ))}
              </List>
            </Box>
          )}
        </Box>
      )}
    </Box>
  );

  const chatArea = selectedConv ? (
    <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Header */}
      <Box sx={{ p: 2, borderBottom: '1px solid', borderColor: 'divider', display: 'flex', alignItems: 'center', gap: 1.5 }}>
        {isMobile && (
          <IconButton size="small" onClick={() => setShowList(true)}>
            <ArrowLeft size={20} />
          </IconButton>
        )}
        <Avatar src={selectedConv.img || undefined} sx={{ bgcolor: 'primary.main', width: 40, height: 40 }}>
          {initials(selectedConv.title)}
        </Avatar>
        <Box sx={{ flex: 1 }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 700, lineHeight: 1.2 }}>
            {selectedConv.title}
          </Typography>
          <Typography variant="caption" color="text.secondary">Mutual match</Typography>
        </Box>
        <IconButton
          size="small"
          onClick={() => setDeleteTarget(selectedConv)}
          sx={{ color: 'error.main' }}
          aria-label="Delete conversation"
        >
          <Trash2 size={18} />
        </IconButton>
      </Box>

      {/* Wedding planning action bar */}
      <Box sx={{
        px: 2, py: 1, bgcolor: '#FAFAFA', borderBottom: '1px solid', borderColor: 'divider',
        display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap',
      }}>
        <Typography variant="caption" color="text.disabled" sx={{ mr: 0.5 }}>Wedding planning:</Typography>

        {weddingStatus === 'coupled' ? (
          <>
            <Chip
              icon={<Heart size={12} color="white" />}
              label="Planning Together 💒"
              size="small"
              sx={{ bgcolor: '#8B1A2E', color: 'white', fontWeight: 700, fontSize: '0.72rem',
                '& .MuiChip-icon': { color: 'white' } }}
            />
            <Tooltip title="Leave wedding plan">
              <IconButton
                size="small"
                disabled={cancellingWedding}
                onClick={() => setResetDialogOpen(true)}
                sx={{ color: 'text.disabled', p: 0.25 }}
              >
                {cancellingWedding ? <CircularProgress size={12} /> : '✕'}
              </IconButton>
            </Tooltip>
          </>
        ) : weddingStatus === 'invited' ? (
          <>
            <Chip
              icon={<Heart size={12} color="#8B1A2E" />}
              label="⏳ Invite sent…"
              size="small"
              variant="outlined"
              sx={{ color: '#8B1A2E', borderColor: '#8B1A2E', fontSize: '0.72rem',
                '& .MuiChip-icon': { color: '#8B1A2E' } }}
            />
            <Tooltip title="Cancel invite">
              <IconButton
                size="small"
                disabled={cancellingWedding}
                onClick={() => setResetDialogOpen(true)}
                sx={{ color: 'text.disabled', p: 0.25 }}
              >
                {cancellingWedding ? <CircularProgress size={12} /> : '✕'}
              </IconButton>
            </Tooltip>
          </>
        ) : (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, py: 0.5 }}>
            <Typography variant="caption" sx={{ fontWeight: 700, color: 'primary.main', opacity: 0.9 }}>
              Ready to take the next step?
            </Typography>
            <Chip
              icon={<Heart size={16} color="white" />}
              label="Plan Wedding Together 💒"
              onClick={() => setWeddingInviteOpen(true)}
              sx={{ 
                bgcolor: '#8B1A2E', 
                color: 'white', 
                fontWeight: 800, 
                fontSize: '0.8rem', 
                height: 36,
                px: 1,
                borderRadius: '10px',
                cursor: 'pointer',
                boxShadow: '0 4px 12px rgba(139,26,46,0.2)',
                animation: 'pulseGlow 2s infinite',
                transition: 'all 0.2s ease',
                '&:hover': { 
                  bgcolor: '#6B1422', 
                  transform: 'scale(1.05)',
                  boxShadow: '0 6px 16px rgba(139,26,46,0.3)'
                },
                '& .MuiChip-icon': { color: 'white' },
                '@keyframes pulseGlow': {
                  '0%': { boxShadow: '0 0 0 0 rgba(139, 26, 46, 0.6)' },
                  '70%': { boxShadow: '0 0 0 10px rgba(139, 26, 46, 0)' },
                  '100%': { boxShadow: '0 0 0 0 rgba(139, 26, 46, 0)' },
                }
              }}
            />
          </Box>
        )}
      </Box>

      {/* Messages */}
      <Box sx={{ flex: 1, overflowY: 'auto', p: 2, display: 'flex', flexDirection: 'column', gap: 1 }}>
        {loadingMsgs ? (
          <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <CircularProgress size={28} />
          </Box>
        ) : messages.length === 0 ? (
          <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Typography variant="body2" color="text.secondary">No messages yet. Say hello!</Typography>
          </Box>
        ) : (
          messages.map((msg, idx) => {
            const isMine = String(msg.senderId) === String(currentUserId);
            // Only show avatar on the last consecutive message from the same sender
            const isLastInGroup = idx === messages.length - 1 ||
              String(messages[idx + 1].senderId) !== String(msg.senderId);
            const myPic = (currentUser as any)?.profilePic || undefined;
            const myInitials = initials((currentUser as any)?.name || (currentUser as any)?.personalInfo?.name || 'Me');
            const theirPic = selectedConv.img || undefined;
            const theirInitials = initials(selectedConv.title);
            return (
              <Box
                key={msg.id}
                sx={{ display: 'flex', alignItems: 'flex-end', gap: 0.75, justifyContent: isMine ? 'flex-end' : 'flex-start' }}
              >
                {/* Other person's avatar — left side */}
                {!isMine && (
                  <Avatar
                    src={theirPic}
                    sx={{
                      width: 28, height: 28, fontSize: '0.65rem',
                      bgcolor: 'primary.main',
                      visibility: isLastInGroup ? 'visible' : 'hidden',
                      flexShrink: 0,
                    }}
                  >
                    {theirInitials}
                  </Avatar>
                )}

                <Box
                  sx={{
                    maxWidth: '68%',
                    px: 2,
                    py: 1,
                    borderRadius: isMine ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
                    bgcolor: isMine ? 'primary.main' : 'grey.100',
                    color: isMine ? 'white' : 'text.primary',
                  }}
                >
                  <Typography variant="body2">{msg.content}</Typography>
                  <Typography variant="caption" sx={{ opacity: 0.7, display: 'block', textAlign: 'right', mt: 0.25, fontSize: '0.65rem' }}>
                    {formatTime(msg.createdAt)}
                  </Typography>
                </Box>

                {/* My avatar — right side */}
                {isMine && (
                  <Avatar
                    src={myPic}
                    sx={{
                      width: 28, height: 28, fontSize: '0.65rem',
                      bgcolor: 'secondary.main',
                      visibility: isLastInGroup ? 'visible' : 'hidden',
                      flexShrink: 0,
                    }}
                  >
                    {myInitials}
                  </Avatar>
                )}
              </Box>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </Box>

      {/* Input */}
      <Box sx={{ p: 1.5, borderTop: '1px solid', borderColor: 'divider' }}>
        <Stack direction="row" spacing={1} alignItems="flex-end">
          <TextField
            fullWidth
            multiline
            maxRows={4}
            placeholder="Type a message…"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            size="small"
            sx={{ '& .MuiOutlinedInput-root': { borderRadius: 3 } }}
          />
          <IconButton
            onClick={handleSend}
            disabled={!newMessage.trim() || sending}
            sx={{ bgcolor: 'primary.main', color: 'white', '&:hover': { bgcolor: 'primary.dark' }, '&.Mui-disabled': { bgcolor: 'grey.200' } }}
          >
            {sending ? <CircularProgress size={18} sx={{ color: 'white' }} /> : <Send size={18} />}
          </IconButton>
        </Stack>
      </Box>
    </Box>
  ) : (
    <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 2, color: 'text.secondary' }}>
      <MessageCircle size={56} />
      <Typography variant="h6">Select a conversation</Typography>
      <Typography variant="body2">Choose someone from the list to start chatting</Typography>
    </Box>
  );

  return (
    <>
      <Box
        sx={{
          mt: 5, // 4px top margin to visually balance with 5px header gap
          height: { xs: 'calc(100vh - 220px)', md: 'calc(100vh - 260px)' },
          minHeight: 520,
          display: 'flex',
          overflow: 'hidden',
          bgcolor: 'background.paper',
          borderRadius: 2,
          border: '1px solid',
          borderColor: 'divider',
        }}
      >
        {isMobile ? (
          <>
            {showList && conversationList}
            {!showList && selectedConv && chatArea}
          </>
        ) : (
          <>
            {conversationList}
            {chatArea}
          </>
        )}
      </Box>

      {/* Wedding Invite Dialog */}
      <Dialog open={weddingInviteOpen} onClose={() => !sendingInvite && setWeddingInviteOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: 1 }}>
          <Heart size={20} color="#8B1A2E" />
          Start Planning Your Wedding 🎉
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary">
            Send <strong>{selectedConv?.title}</strong> an invitation to start planning your wedding together on RaashiLink. You'll both share a wedding dashboard, checklist, budget, and vendor list.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setWeddingInviteOpen(false)} disabled={sendingInvite}>Cancel</Button>
          <Button
            variant="contained"
            onClick={async () => {
              if (!selectedConv) return;
              setSendingInvite(true);
              setGlobalLoading({ open: true, message: 'Sending invitation...' });
              try {
                const res: any = await weddingService.invitePartner(selectedConv.otherUserId);
                if (res.autoConfirmed) {
                  setWeddingStatus('coupled');
                  setInviteSnack({ open: true, msg: `You and ${selectedConv.title} are now planning together! 💒`, severity: 'success' });
                } else {
                  setWeddingStatus('invited');
                  setInviteSnack({ open: true, msg: `Invitation sent to ${selectedConv.title}! They need to accept to link your wedding project.`, severity: 'success' });
                }
                setWeddingInviteOpen(false);
              } catch {
                setInviteSnack({ open: true, msg: 'Failed to send invitation. Please try again.', severity: 'error' });
              } finally {
                setSendingInvite(false);
                setGlobalLoading({ open: false, message: '' });
              }
            }}
            disabled={sendingInvite}
            startIcon={sendingInvite ? <CircularProgress size={14} color="inherit" /> : <Heart size={14} />}
            sx={{ bgcolor: '#8B1A2E', '&:hover': { bgcolor: '#6B1422' } }}
          >
            {sendingInvite ? 'Sending…' : 'Send Invite'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Reset Wedding Confirmation Dialog */}
      <Dialog open={resetDialogOpen} onClose={() => !cancellingWedding && setResetDialogOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: 1 }}>
          <AlertCircle size={20} color={theme.palette.error.main} />
          {weddingStatus === 'invited' ? 'Cancel Invitation?' : 'Reset Wedding Plan?'}
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary">
            {weddingStatus === 'invited' 
              ? 'This will cancel and reset the current wedding planning invite. To start planning again later, you must send a new wedding invite. Continue?'
              : 'This will reset the current wedding plan for both users. If you want to plan together again, you must send a new wedding invite. Continue?'
            }
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setResetDialogOpen(false)} disabled={cancellingWedding}>Keep</Button>
          <Button
            variant="contained"
            color="error"
            onClick={async () => {
              setCancellingWedding(true);
              setGlobalLoading({ open: true, message: 'Resetting wedding plan...' });
              try {
                await weddingService.resetWedding();
                setWeddingStatus('none');
                setInviteSnack({ 
                  open: true, 
                  msg: weddingStatus === 'invited' ? 'Wedding planning invite cancelled.' : 'Wedding plan reset.', 
                  severity: 'error' 
                });
                setResetDialogOpen(false);
              } catch {
                setInviteSnack({ open: true, msg: 'Failed to reset. Try again.', severity: 'error' });
              } finally {
                setCancellingWedding(false);
                setGlobalLoading({ open: false, message: '' });
              }
            }}
            disabled={cancellingWedding}
            startIcon={cancellingWedding ? <CircularProgress size={14} color="inherit" /> : <Trash2 size={14} />}
          >
            {cancellingWedding ? 'Resetting…' : 'Yes, Reset'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete confirmation dialog */}
      <Dialog open={!!deleteTarget} onClose={() => !deleting && setDeleteTarget(null)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>Delete conversation?</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary">
            This will permanently delete your conversation with <strong>{deleteTarget?.title}</strong> and all messages. This cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setDeleteTarget(null)} disabled={deleting}>Cancel</Button>
          <Button
            variant="contained"
            color="error"
            onClick={handleDeleteConv}
            disabled={deleting}
            startIcon={deleting ? <CircularProgress size={14} color="inherit" /> : <Trash2 size={14} />}
          >
            {deleting ? 'Deleting…' : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={inviteSnack.open}
        autoHideDuration={6000}
        onClose={() => setInviteSnack((s) => ({ ...s, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert severity={inviteSnack.severity} onClose={() => setInviteSnack((s) => ({ ...s, open: false }))} sx={{ width: '100%' }}>
          {inviteSnack.msg}
        </Alert>
      </Snackbar>

      {/* Global Loading Backdrop */}
      <Backdrop
        sx={{ color: '#fff', zIndex: (theme) => theme.zIndex.modal + 999, flexDirection: 'column', gap: 2 }}
        open={globalLoading.open}
      >
        <CircularProgress color="inherit" />
        <Typography variant="h6" sx={{ fontWeight: 600 }}>{globalLoading.message}</Typography>
      </Backdrop>
    </>
  );
}
