import React, { useState, useEffect, useRef } from 'react';
import {
  Box, Typography, Stack, Avatar, TextField, IconButton,
  List, ListItem, ListItemButton, ListItemAvatar, ListItemText,
  Divider, CircularProgress, useTheme, useMediaQuery,
} from '@mui/material';
import { Send, ArrowLeft, MessageCircle } from 'lucide-react';
import { useSelector } from 'react-redux';
import { RootState } from '@/app/store/store';
import api from '@/shared/config/axiosConfig';
import { markSentPreview } from '@/shared/lib/sentMsgTracker';
import { useLocation } from 'react-router-dom';

interface Conversation {
  id: string;
  title: string;
  otherUserId: string;
  preview: string;
  date: string;
}

interface Message {
  id: string;
  senderId: string;
  content: string;
  createdAt: string;
}

export default function MessagesPage() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const currentUser = useSelector((state: RootState) => state.auth.user);
  const currentUserId = (currentUser as any)?._id || (currentUser as any)?.id || '';
  const location = useLocation();
  const deepLinkConvId = (location.state as any)?.conversationId as string | undefined;

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConv, setSelectedConv] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loadingConvs, setLoadingConvs] = useState(true);
  const [loadingMsgs, setLoadingMsgs] = useState(false);
  const [sending, setSending] = useState(false);
  const [showList, setShowList] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const prevMsgIdsRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    api.get('/chat/conversations')
      .then((res: any) => {
        const items: Conversation[] = res.data.data.items || [];
        setConversations(items);
        // Auto-select conversation if navigated here from a notification
        if (deepLinkConvId) {
          const target = items.find((c) => c.id === deepLinkConvId);
          if (target) {
            setSelectedConv(target);
            if (isMobile) setShowList(false);
          }
        }
      })
      .catch(() => {})
      .finally(() => setLoadingConvs(false));
  // deepLinkConvId intentionally only used on mount
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
      ) : conversations.length === 0 ? (
        <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', p: 4, gap: 2 }}>
          <MessageCircle size={48} color="#ccc" />
          <Typography variant="body2" color="text.secondary" textAlign="center">
            No conversations yet. Express interest in someone and they'll show up here once it's mutual!
          </Typography>
        </Box>
      ) : (
        <List disablePadding sx={{ flex: 1, overflowY: 'auto' }}>
          {conversations.map((conv) => (
            <React.Fragment key={conv.id}>
              <ListItem disablePadding>
                <ListItemButton
                  selected={selectedConv?.id === conv.id}
                  onClick={() => handleSelectConv(conv)}
                  sx={{ py: 1.5, px: 2, '&.Mui-selected': { bgcolor: 'primary.50' } }}
                >
                  <ListItemAvatar>
                    <Avatar sx={{ bgcolor: 'primary.main', width: 44, height: 44 }}>
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
        <Avatar sx={{ bgcolor: 'primary.main', width: 40, height: 40 }}>
          {initials(selectedConv.title)}
        </Avatar>
        <Box>
          <Typography variant="subtitle1" sx={{ fontWeight: 700, lineHeight: 1.2 }}>
            {selectedConv.title}
          </Typography>
          <Typography variant="caption" color="text.secondary">Mutual match</Typography>
        </Box>
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
            const myInitials = initials((currentUser as any)?.name || (currentUser as any)?.personalInfo?.name || 'Me');
            const theirInitials = initials(selectedConv.title);
            return (
              <Box
                key={msg.id}
                sx={{ display: 'flex', alignItems: 'flex-end', gap: 0.75, justifyContent: isMine ? 'flex-end' : 'flex-start' }}
              >
                {/* Other person's avatar — left side */}
                {!isMine && (
                  <Avatar
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
  );
}
