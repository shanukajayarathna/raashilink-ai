import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Box, Typography, Stack, Avatar, TextField, IconButton,
  List, ListItem, ListItemButton, ListItemAvatar, ListItemText,
  Divider, CircularProgress, useTheme, useMediaQuery,
  Dialog, DialogTitle, DialogContent, DialogActions, Button, Chip, Tooltip,
  Snackbar, Alert,
} from '@mui/material';
import { Send, ArrowLeft, MessageCircle, Trash2, PlusCircle, Heart, Diamond, X } from 'lucide-react';
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
  const deepLinkEngagementProposerId = (location.state as any)?.engagementProposerId as string | undefined;
  const deepLinkEngagedUserId = (location.state as any)?.engagedUserId as string | undefined;

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
  const [openingConvFor, setOpeningConvFor] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [showList, setShowList] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const prevMsgIdsRef = useRef<Set<string>>(new Set());
  const isInitialMount = useRef(true);
  const [deleteTarget, setDeleteTarget] = useState<Conversation | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [weddingInviteOpen, setWeddingInviteOpen] = useState(false);
  const [sendingInvite, setSendingInvite] = useState(false);
  const [inviteSnack, setInviteSnack] = useState<{ open: boolean; msg: string; severity: 'success' | 'error' }>({ open: false, msg: '', severity: 'success' });
  const [engagementOpen, setEngagementOpen] = useState(false);
  const [proposingEngagement, setProposingEngagement] = useState(false);
  // Track which partner we are engaged with (disables the propose button)
  const [engagedWithUserId, setEngagedWithUserId] = useState<string | null>(deepLinkEngagedUserId ?? null);
  // Track who sent the engagement proposal (null when not in 'proposed' state)
  const [engagementProposerId, setEngagementProposerId] = useState<string | null>(null);
  const [cancellingEngagement, setCancellingEngagement] = useState(false);
  // Wedding planning status with the current conversation partner
  const [weddingStatus, setWeddingStatus] = useState<'none' | 'invited' | 'coupled'>('none');
  const [cancellingWedding, setCancellingWedding] = useState(false);
  // Banner shown when partner sent us an engagement proposal
  const [engagementBannerUserId, setEngagementBannerUserId] = useState<string | null>(null);
  const [acceptingEngagement, setAcceptingEngagement] = useState(false);

  const refreshConversationsList = useCallback(async () => {
    try {
      const convRes: any = await api.get('/chat/conversations');
      const items: Conversation[] = convRes.data?.data?.items || [];
      setConversations(items);
      setSelectedConv((current) => {
        if (!current) return current;
        const stillExists = items.find((c) => c.id === current.id);
        if (stillExists) return stillExists;
        setMessages([]);
        setEngagedWithUserId(null);
        setEngagementProposerId(null);
        setEngagementBannerUserId(null);
        setWeddingStatus('none');
        if (isMobile) setShowList(true);
        return null;
      });
    } catch {
      // silent
    }
  }, [isMobile]);

  const refreshJourneyState = useCallback(async () => {
    if (!selectedConv) {
      setEngagedWithUserId(null);
      setEngagementProposerId(null);
      setWeddingStatus('none');
      return;
    }

    try {
      const engagementRes: any = await api.get(`/matches/${selectedConv.otherUserId}/engagement`);
      const { status, proposerId } = engagementRes.data?.data || {};
      setEngagedWithUserId(status === 'accepted' ? selectedConv.otherUserId : null);
      setEngagementProposerId(status === 'proposed' ? (proposerId || null) : null);
    } catch {
      // silent
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

  // Fetch persistent engagement status from DB whenever conversation changes
  useEffect(() => {
    refreshJourneyState();
  }, [refreshJourneyState]);

  useEffect(() => {
    const onAppRefresh = () => {
      refreshJourneyState();
      refreshConversationsList();
    };
    window.addEventListener('app:refresh', onAppRefresh);
    return () => {
      window.removeEventListener('app:refresh', onAppRefresh);
    };
  }, [refreshJourneyState, refreshConversationsList]);

  // Show engagement acceptance banner — set from navigation state (notification click)
  // or from unread notifications when a conversation is selected.
  useEffect(() => {
    if (!selectedConv) return;
    // If we arrived here from an engagement_invite notification, show banner immediately
    if (deepLinkEngagementProposerId && deepLinkEngagementProposerId === selectedConv.otherUserId) {
      setEngagementBannerUserId(selectedConv.otherUserId);
      return;
    }
    // Fallback: check unread notifications (covers landing directly on messages page)
    // Skip if already engaged — the invite was already handled
    if (engagedWithUserId === selectedConv.otherUserId) {
      setEngagementBannerUserId(null);
      return;
    }
    api.get('/notifications').then((res: any) => {
      const items: any[] = res.data?.data?.notifications || [];
      const invite = items.find(
        (n) => n.type === 'engagement_invite' && n.fromUserId === selectedConv.otherUserId
      );
      setEngagementBannerUserId(invite ? selectedConv.otherUserId : null);
    }).catch(() => setEngagementBannerUserId(null));
  }, [selectedConv, deepLinkEngagementProposerId, engagedWithUserId]);

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
      const contacts: MutualMatch[] = rawMatches.map((m: any) => ({
        id: m.id,
        name: m.name,
        initials: m.initials || m.name?.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2) || '??',
        img: m.img || null,
      }));
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

  // Handle re-navigation to this page while it's already mounted (e.g. clicking a notification
  // when the user is already on /messages). location.key changes on every navigate() call.
  useEffect(() => {
    if (isInitialMount.current) { isInitialMount.current = false; return; }
    if (!deepLinkConvId && !deepLinkUserId) return;

    const doNav = async () => {
      // Refresh conversations first so we have an up-to-date list
      let items = conversations;
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
    if (!selectedConv) return;
    setLoadingMsgs(true);
    api.get(`/chat/${selectedConv.id}/history`)
      .then((res: any) => {
        const fetched: Message[] = res.data.data.messages || [];
        setMessages(fetched);
        // Seed known IDs so the first poll doesn't re-fire sound
        prevMsgIdsRef.current = new Set(fetched.map((m) => m.id));
      })
      .catch(() => {})
      .finally(() => setLoadingMsgs(false));
  }, [selectedConv]);

  // Poll active conversation every 5s to keep messages fresh
  useEffect(() => {
    if (!selectedConv) return;
    const interval = setInterval(async () => {
      try {
        const res: any = await api.get(`/chat/${selectedConv.id}/history`);
        const fetched: Message[] = res.data.data.messages || [];
        const hasNew = fetched.some((m) => !prevMsgIdsRef.current.has(m.id));
        if (hasNew) {
          prevMsgIdsRef.current = new Set(fetched.map((m) => m.id));
          setMessages(fetched);
        }
      } catch {
        // silent
      }
    }, 5000);
    return () => clearInterval(interval);
  }, [selectedConv]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSelectConv = (conv: Conversation) => {
    setSelectedConv(conv);
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
          prev.map((m) => (m.id === optimistic.id ? { ...m, id: real.id } : m))
        );
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

  // Real-time: add new mutual match + handle engagement events without page refresh
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
    // Partner sent us an engagement proposal — show the accept banner instantly
    onEngagementInvite: (data) => {
      if (!data.fromUserId) return;
      setEngagementProposerId(data.fromUserId);
      setSelectedConv((conv) => {
        if (conv && conv.otherUserId === data.fromUserId) {
          setEngagementBannerUserId(data.fromUserId);
        }
        return conv;
      });
      if (!selectedConv) {
        const target = conversations.find((c) => c.otherUserId === data.fromUserId);
        if (target) {
          setSelectedConv(target);
          setEngagementBannerUserId(data.fromUserId);
          if (isMobile) setShowList(false);
        }
      }
      setInviteSnack({ open: true, msg: `${data.fromUserName} proposed engagement. Open this chat to accept.`, severity: 'success' });
    },
    // Partner accepted our proposal — mark button as engaged instantly
    onEngagementAccepted: (data) => {
      if (!data.fromUserId) return;
      setEngagedWithUserId(data.fromUserId);
      setEngagementProposerId(null);
      setInviteSnack({
        open: true,
        msg: `${data.fromUserName} accepted your engagement proposal! 💎 Start planning your wedding together.`,
        severity: 'success',
      });
      setSelectedConv((conv) => {
        if (conv && conv.otherUserId === data.fromUserId) {
          setTimeout(() => setWeddingInviteOpen(true), 400);
        }
        return conv;
      });
    },
    // Either party cancelled — reset engagement state in real time
    onEngagementCancelled: (data) => {
      if (!data.fromUserId) return;
      setSelectedConv((conv) => {
        if (conv && conv.otherUserId === data.fromUserId) {
          setEngagedWithUserId(null);
          setEngagementProposerId(null);
          setEngagementBannerUserId(null);
          setInviteSnack({ open: true, msg: `${data.fromUserName} cancelled the engagement.`, severity: 'error' });
        }
        return conv;
      });
    },
    onMatchRemoved: (data) => {
      if (!data.byUserId) return;
      setConversations((prev) => prev.filter((c) => c.otherUserId !== data.byUserId));
      setSelectedConv((conv) => {
        if (conv && conv.otherUserId === data.byUserId) {
          setMessages([]);
          setEngagedWithUserId(null);
          setEngagementProposerId(null);
          setEngagementBannerUserId(null);
          setWeddingStatus('none');
          if (isMobile) setShowList(true);
          setInviteSnack({ open: true, msg: 'This match was removed. You are back to searching for a partner.', severity: 'error' });
          return null;
        }
        return conv;
      });
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

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const initials = (name: string) =>
    name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);

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
            {conversations.map((conv) => (
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
                  </ListItemButton>
                </ListItem>
                <Divider component="li" />
              </React.Fragment>
            ))}
          </List>

              {eligibleMatches.length > 0 && (
            <Box sx={{ mt: 'auto', borderTop: '1px solid', borderColor: 'divider' }}>
              <Box sx={{ px: 2, pt: 1.5, pb: 0.5, display: 'flex', alignItems: 'center', gap: 1 }}>
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

      {/* Journey step-action bar */}
      {(() => {
        const isEngaged = engagedWithUserId === selectedConv.otherUserId;
        const iProposed = !isEngaged && engagementProposerId === currentUserId;
        const theyProposed = !isEngaged && engagementProposerId === selectedConv.otherUserId;
        return (
          <Box sx={{
            px: 2, py: 1, bgcolor: '#FAFAFA', borderBottom: '1px solid', borderColor: 'divider',
            display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap',
          }}>
            <Typography variant="caption" color="text.disabled" sx={{ mr: 0.5 }}>Next step:</Typography>

            {/* Step 2: Engagement */}
            {isEngaged ? (
              <>
                <Chip
                  icon={<Diamond size={12} fill="white" color="white" />}
                  label="Engaged 💎"
                  size="small"
                  sx={{ bgcolor: '#C9A84C', color: 'white', fontWeight: 700, fontSize: '0.72rem',
                    '& .MuiChip-icon': { color: 'white' } }}
                />
                <Tooltip title="Undo engagement">
                  <IconButton
                    size="small"
                    disabled={cancellingEngagement}
                    onClick={async () => {
                      setCancellingEngagement(true);
                      try {
                        await api.delete(`/matches/${selectedConv.otherUserId}/engagement`);
                        setEngagedWithUserId(null);
                        setEngagementProposerId(null);
                        setInviteSnack({ open: true, msg: 'Engagement cancelled.', severity: 'error' });
                      } catch {
                        setInviteSnack({ open: true, msg: 'Failed to cancel. Try again.', severity: 'error' });
                      } finally {
                        setCancellingEngagement(false);
                      }
                    }}
                    sx={{ color: 'text.disabled', p: 0.25 }}
                  >
                    {cancellingEngagement ? <CircularProgress size={12} /> : <X size={13} />}
                  </IconButton>
                </Tooltip>
              </>
            ) : iProposed ? (
              <>
                <Chip
                  icon={<Diamond size={12} color="#C9A84C" />}
                  label="⏳ Waiting for response…"
                  size="small"
                  variant="outlined"
                  sx={{ color: '#C9A84C', borderColor: '#C9A84C', fontSize: '0.72rem',
                    '& .MuiChip-icon': { color: '#C9A84C' } }}
                />
                <Tooltip title="Cancel proposal">
                  <IconButton
                    size="small"
                    disabled={cancellingEngagement}
                    onClick={async () => {
                      setCancellingEngagement(true);
                      try {
                        await api.delete(`/matches/${selectedConv.otherUserId}/engagement`);
                        setEngagementProposerId(null);
                        setInviteSnack({ open: true, msg: 'Proposal cancelled.', severity: 'error' });
                      } catch {
                        setInviteSnack({ open: true, msg: 'Failed to cancel. Try again.', severity: 'error' });
                      } finally {
                        setCancellingEngagement(false);
                      }
                    }}
                    sx={{ color: 'text.disabled', p: 0.25 }}
                  >
                    {cancellingEngagement ? <CircularProgress size={12} /> : <X size={13} />}
                  </IconButton>
                </Tooltip>
              </>
            ) : theyProposed ? (
              <Chip
                icon={<Diamond size={12} color="#C9A84C" />}
                label="Engagement proposal received — accept below ↓"
                size="small"
                variant="outlined"
                sx={{ color: '#C9A84C', borderColor: '#C9A84C', fontSize: '0.72rem',
                  '& .MuiChip-icon': { color: '#C9A84C' } }}
              />
            ) : (
              <Chip
                icon={<Diamond size={12} color="#C9A84C" />}
                label="Propose Engagement"
                size="small"
                variant="outlined"
                clickable
                onClick={() => setEngagementOpen(true)}
                sx={{ color: '#C9A84C', borderColor: '#C9A84C', fontSize: '0.72rem', cursor: 'pointer',
                  '&:hover': { bgcolor: '#FFF8E7' },
                  '& .MuiChip-icon': { color: '#C9A84C' } }}
              />
            )}

            <Typography variant="caption" color="text.disabled">›</Typography>

            {/* Step 3: Wedding */}
            {isEngaged && weddingStatus === 'coupled' ? (
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
                    onClick={async () => {
                      setCancellingWedding(true);
                      try {
                        await weddingService.resetWedding();
                        setWeddingStatus('none');
                        setInviteSnack({ open: true, msg: 'Left the shared wedding plan.', severity: 'error' });
                      } catch {
                        setInviteSnack({ open: true, msg: 'Failed to leave. Try again.', severity: 'error' });
                      } finally {
                        setCancellingWedding(false);
                      }
                    }}
                    sx={{ color: 'text.disabled', p: 0.25 }}
                  >
                    {cancellingWedding ? <CircularProgress size={12} /> : <X size={13} />}
                  </IconButton>
                </Tooltip>
              </>
            ) : isEngaged && weddingStatus === 'invited' ? (
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
                    onClick={async () => {
                      setCancellingWedding(true);
                      try {
                        await weddingService.resetWedding();
                        setWeddingStatus('none');
                        setInviteSnack({ open: true, msg: 'Wedding invite cancelled.', severity: 'error' });
                      } catch {
                        setInviteSnack({ open: true, msg: 'Failed to cancel. Try again.', severity: 'error' });
                      } finally {
                        setCancellingWedding(false);
                      }
                    }}
                    sx={{ color: 'text.disabled', p: 0.25 }}
                  >
                    {cancellingWedding ? <CircularProgress size={12} /> : <X size={13} />}
                  </IconButton>
                </Tooltip>
              </>
            ) : isEngaged ? (
              <Chip
                icon={<Heart size={12} color="white" />}
                label="Plan Wedding Together 💒"
                size="small"
                clickable
                onClick={() => setWeddingInviteOpen(true)}
                sx={{ bgcolor: '#8B1A2E', color: 'white', fontWeight: 700, fontSize: '0.72rem', cursor: 'pointer',
                  '&:hover': { bgcolor: '#6B1422' },
                  '& .MuiChip-icon': { color: 'white' } }}
              />
            ) : (
              <Tooltip title="Complete the engagement step first">
                <span>
                  <Chip
                    icon={<Heart size={12} />}
                    label="Plan Wedding"
                    size="small"
                    disabled
                    sx={{ fontSize: '0.72rem' }}
                  />
                </span>
              </Tooltip>
            )}
          </Box>
        );
      })()}

      {/* Engagement acceptance banner */}
      {engagementBannerUserId === selectedConv.otherUserId && (
        <Box sx={{ px: 2, py: 1.25, bgcolor: '#FFF8E7', borderBottom: '1px solid #F0D88A', display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Diamond size={18} color="#C9A84C" />
          <Box sx={{ flex: 1 }}>
            <Typography variant="body2" sx={{ fontWeight: 700, color: '#7A6020' }}>
              {selectedConv.title} proposed engagement! 💎
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Accept to move forward together, or decline to keep chatting.
            </Typography>
          </Box>
          <Button
            size="small"
            variant="contained"
            disabled={acceptingEngagement || cancellingEngagement}
            onClick={async () => {
              setAcceptingEngagement(true);
              try {
                await api.post(`/matches/${selectedConv.otherUserId}/engagement/accept`);
                setEngagementBannerUserId(null);
                setEngagedWithUserId(selectedConv.otherUserId);
                setEngagementProposerId(null);
                // Don't open the wedding dialog here — the proposer receives the
                // engagement_accepted socket event and will be prompted to plan.
                // The acceptor gets the wedding step bar to act when ready.
                setInviteSnack({ open: true, msg: 'Engagement accepted! 💎 You can plan your wedding together now.', severity: 'success' });
              } catch {
                setInviteSnack({ open: true, msg: 'Failed to accept. Please try again.', severity: 'error' });
              } finally {
                setAcceptingEngagement(false);
              }
            }}
            startIcon={acceptingEngagement ? <CircularProgress size={12} color="inherit" /> : <Diamond size={12} />}
            sx={{ bgcolor: '#C9A84C', '&:hover': { bgcolor: '#A8883E' }, color: 'white', flexShrink: 0, fontSize: '0.72rem' }}
          >
            {acceptingEngagement ? 'Accepting…' : 'Accept 💎'}
          </Button>
          <Button
            size="small"
            variant="outlined"
            color="error"
            disabled={acceptingEngagement || cancellingEngagement}
            onClick={async () => {
              setCancellingEngagement(true);
              try {
                await api.delete(`/matches/${selectedConv.otherUserId}/engagement`);
                setEngagementBannerUserId(null);
                setEngagementProposerId(null);
                setInviteSnack({ open: true, msg: 'Engagement proposal declined.', severity: 'error' });
              } catch {
                setInviteSnack({ open: true, msg: 'Failed to decline. Try again.', severity: 'error' });
              } finally {
                setCancellingEngagement(false);
              }
            }}
            sx={{ flexShrink: 0, fontSize: '0.72rem' }}
          >
            {cancellingEngagement ? <CircularProgress size={12} /> : 'Decline'}
          </Button>
        </Box>
      )}

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
      <Box sx={{ p: 2, borderTop: '1px solid', borderColor: 'divider' }}>
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
      <Box sx={{ height: 'calc(100vh - 80px)', display: 'flex', overflow: 'hidden', bgcolor: 'background.paper', borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
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
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
            Congratulations on your engagement! 💎
          </Typography>
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
              try {
                await weddingService.invitePartner(selectedConv.otherUserId);
                setWeddingStatus('invited');
                setInviteSnack({ open: true, msg: `Invitation sent to ${selectedConv.title}! They need to accept to link your wedding project.`, severity: 'success' });
                setWeddingInviteOpen(false);
              } catch {
                setInviteSnack({ open: true, msg: 'Failed to send invitation. Please try again.', severity: 'error' });
              } finally {
                setSendingInvite(false);
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

      {/* Engagement Proposal Dialog */}
      <Dialog open={engagementOpen} onClose={() => !proposingEngagement && setEngagementOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: 1 }}>
          <Diamond size={20} color="#C9A84C" />
          Propose Engagement
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
            Send <strong>{selectedConv?.title}</strong> a formal engagement proposal. This is the next step after chatting — confirming you'd both like to move forward together.
          </Typography>
          <Typography variant="caption" color="text.secondary">
            They'll receive a notification to accept. Once confirmed, you can both start planning your wedding together.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setEngagementOpen(false)} disabled={proposingEngagement}>Cancel</Button>
          <Button
            variant="contained"
            onClick={async () => {
              if (!selectedConv) return;
              setProposingEngagement(true);
              try {
                await api.post(`/matches/${selectedConv.otherUserId}/engagement/propose`);
                setEngagementProposerId(currentUserId);
                setInviteSnack({ open: true, msg: `Engagement proposal sent to ${selectedConv.title}! Waiting for their response.`, severity: 'success' });
                setEngagementOpen(false);
              } catch {
                setInviteSnack({ open: true, msg: 'Failed to send proposal. Please try again.', severity: 'error' });
              } finally {
                setProposingEngagement(false);
              }
            }}
            disabled={proposingEngagement}
            startIcon={proposingEngagement ? <CircularProgress size={14} color="inherit" /> : <Diamond size={14} />}
            sx={{ bgcolor: '#C9A84C', '&:hover': { bgcolor: '#A8883E' }, color: 'white' }}
          >
            {proposingEngagement ? 'Sending…' : 'Send Proposal'}
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
    </>
  );
}
