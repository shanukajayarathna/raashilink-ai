import React, { useState, useEffect, useRef, useImperativeHandle, forwardRef } from 'react';
import {
  Box,
  Container,
  Typography,
  Stack,
  TextField,
  IconButton,
  Avatar,
  Paper,
  InputAdornment,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import { useSelector } from 'react-redux';
import { RootState } from '@/app/store/store';
import {
  Send,
  Mic,
  Flower2,
  Heart,
  Calendar,
  Wallet,
  X,
  ZoomIn,
  ZoomOut,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import chatService from '../services/chatService';
import ChatMessage from './ChatMessage';
import TypingIndicator from './TypingIndicator';

const COLORS = {
  primary: '#8B1A2E',
  secondary: '#C9A84C',
  accent: '#1A6B72',
  cream: '#FAF7F2',
  white: '#FFFFFF',
  textPrimary: '#1C1C1C',
  textSecondary: '#555555',
  success: '#2E7D32',
};

const BG_ANIM = {
  '@keyframes raashiFloat': {
    '0%': { transform: 'translate3d(0,0,0) scale(1)' },
    '50%': { transform: 'translate3d(-1.5%, -1%, 0) scale(1.03)' },
    '100%': { transform: 'translate3d(0,0,0) scale(1)' },
  },
};

const WELCOME_TOPICS = [
  { id: 'matchmaking', title: 'Matchmaking', icon: <Heart size={24} />, color: COLORS.primary, desc: 'Find your perfect life partner' },
  { id: 'horoscope', title: 'Horoscope', icon: <Flower2 size={24} />, color: COLORS.secondary, desc: 'Compatibility & predictions' },
  { id: 'wedding', title: 'Wedding', icon: <Calendar size={24} />, color: COLORS.accent, desc: 'Plan your dream ceremony' },
  { id: 'budget', title: 'Budget', icon: <Wallet size={24} />, color: '#6A1B9A', desc: 'Manage your wedding finances' },
];

interface ChatInterfaceProps {
  isCompact?: boolean;
  onClose?: () => void;
  onScaleUp?: () => void;
  onScaleDown?: () => void;
  initialMessages?: any[];
  language?: 'en' | 'si' | 'ta';
  firstName?: string;
  sessionKey?: string;
}

export type ChatInterfaceHandle = {
  sendMessage: (text: string) => void;
};

const resolveAvatarSrc = (...sources: any[]) => {
  for (const source of sources) {
    if (!source || typeof source !== 'string') continue;
    const value = source.trim();
    if (!value) continue;
    if (/^(https?:)?\/\//i.test(value) || value.startsWith('data:') || value.startsWith('blob:')) {
      return value;
    }
    return value.startsWith('/') ? value : `/${value}`;
  }
  return undefined;
};

const ChatInterface = forwardRef<ChatInterfaceHandle, ChatInterfaceProps>(function ChatInterface(
  { isCompact, onClose, onScaleUp, onScaleDown, initialMessages = [], language = 'en', firstName = '', sessionKey },
  ref
) {
  const currentUser = useSelector((state: RootState) => state.auth.user as any);
  const userAvatarSrc = resolveAvatarSrc(
    currentUser?.profilePic,
    currentUser?.personalInfo?.profilePic,
    currentUser?.photos?.find?.((photo: any) => photo?.isMain)?.url,
    currentUser?.photos?.[0]?.url
  );

  const [messages, setMessages] = useState<any[]>(() => {
    if (sessionKey) {
      try {
        const stored = sessionStorage.getItem(`raashibot_${sessionKey}`);
        if (stored) {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed) && parsed.length > 0) return parsed;
        }
      } catch { /* ignore */ }
    }
    return initialMessages;
  });
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isWelcomeState, setIsWelcomeState] = useState(() => {
    if (sessionKey) {
      try {
        const stored = sessionStorage.getItem(`raashibot_${sessionKey}`);
        if (stored) {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed) && parsed.length > 0) return false;
        }
      } catch { /* ignore */ }
    }
    return initialMessages.length === 0;
  });
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const messagesEndRef = useRef<null | HTMLDivElement>(null);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  // Persist messages to sessionStorage whenever they change
  useEffect(() => {
    if (!sessionKey || messages.length === 0) return;
    try {
      sessionStorage.setItem(`raashibot_${sessionKey}`, JSON.stringify(messages));
    } catch { /* ignore */ }
  }, [messages, sessionKey]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  const placeholders = {
    en: "Ask anything about matchmaking, weddings...",
    si: "සහකරුවන් සෙවීම, විවාහ සැලසුම් ගැන ඕනෑම දෙයක් අසන්න...",
    ta: "திருமணப் பொருத்தங்கள், திருமணங்கள் பற்றி எதையும் கேளுங்கள்..."
  };

  const handleSendMessage = async (text?: string) => {
    const messageText = (text ?? inputText).trim();
    if (!messageText) return;

    const userMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: messageText,
      timestamp: new Date().toISOString(),
    };

    const botMessageId = (Date.now() + 1).toString();
    setMessages((prev) => [
      ...prev,
      userMessage,
      {
        id: botMessageId,
        role: 'bot',
        content: '',
        timestamp: new Date().toISOString(),
      },
    ]);

    setInputText('');
    setIsWelcomeState(false);
    setIsTyping(true);

    try {
      // Build conversation history for context
      const history = messages
        .filter((msg) => msg.role === 'user' || msg.role === 'bot')
        .slice(-10) // Last 5 turns
        .map((msg) => ({
          role: msg.role === 'bot' ? 'assistant' : 'user',
          content: msg.content,
        }));

      // Call streaming message service
      await chatService.sendStreamingMessage(messageText, language, history, (chunk) => {
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === botMessageId ? { ...msg, content: msg.content + chunk } : msg
          )
        );
      });

      setIsTyping(false);
    } catch (err) {
      setIsTyping(false);
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === botMessageId
            ? { ...msg, content: 'Sorry, I could not reach the assistant. Please try again later.' }
            : msg
        )
      );
    }
  };

  useImperativeHandle(ref, () => ({
    sendMessage: (text: string) => {
      handleSendMessage(text);
    },
  }));

  const handleVoiceInput = () => {
    if (!('webkitSpeechRecognition' in window)) return;
    // @ts-ignore
    const recognition = new window.webkitSpeechRecognition();
    recognition.lang = language === 'en' ? 'en-US' : language === 'si' ? 'si-LK' : 'ta-LK';
    recognition.start();
    recognition.onresult = (event: any) => setInputText(event.results[0][0].transcript);
  };

  return (
    <Box
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        bgcolor: COLORS.cream,
        overflow: 'hidden',
        position: 'relative',
        ...BG_ANIM,
      }}
    >
      {/* Animated background artwork */}
      <Box
        aria-hidden
        sx={{
          position: 'absolute',
          inset: 0,
          backgroundImage: `url(/raashibot-bg.svg)`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          opacity: 0.9,
          filter: 'saturate(1.05)',
          animation: 'raashiFloat 14s ease-in-out infinite',
          transformOrigin: 'center',
          zIndex: 0,
        }}
      />
      {/* Contrast veil */}
      <Box
        aria-hidden
        sx={{
          position: 'absolute',
          inset: 0,
          background:
            'linear-gradient(180deg, rgba(250,247,242,0.75) 0%, rgba(250,247,242,0.55) 40%, rgba(250,247,242,0.82) 100%)',
          zIndex: 0,
        }}
      />
      {/* Optional Header for Compact Mode */}
      {isCompact && (
        <Paper elevation={0} sx={{ p: 1.5, borderBottom: '1px solid', borderColor: `${COLORS.primary}40`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', bgcolor: COLORS.primary, color: 'white', flexShrink: 0, position: 'relative', zIndex: 2 }}>
          <Stack direction="row" spacing={1.5} alignItems="center">
            <Avatar sx={{ width: 32, height: 32, bgcolor: 'white', color: COLORS.primary }}>
              <Flower2 size={20} />
            </Avatar>
            <Box>
              <Typography variant="subtitle2" sx={{ fontWeight: 800, lineHeight: 1.2, color: 'white' }}>RaashiBot</Typography>
              <Typography variant="caption" sx={{ opacity: 0.85, color: 'white', display: 'block' }}>Online Assistant</Typography>
            </Box>
          </Stack>
          <Stack direction="row" spacing={0.25} alignItems="center">
            {onScaleDown && (
              <IconButton size="small" sx={{ color: 'white', opacity: 0.85, '&:hover': { opacity: 1, bgcolor: 'rgba(255,255,255,0.15)' } }} onClick={onScaleDown} title="Shrink">
                <ZoomOut size={15} />
              </IconButton>
            )}
            {onScaleUp && (
              <IconButton size="small" sx={{ color: 'white', opacity: 0.85, '&:hover': { opacity: 1, bgcolor: 'rgba(255,255,255,0.15)' } }} onClick={onScaleUp} title="Expand">
                <ZoomIn size={15} />
              </IconButton>
            )}
            <IconButton size="small" sx={{ color: 'white', '&:hover': { bgcolor: 'rgba(255,255,255,0.15)' } }} onClick={onClose}><X size={18} /></IconButton>
          </Stack>
        </Paper>
      )}

      {/* Messages Area */}
      <Box
        sx={{
          flex: 1,
          overflowY: 'auto',
          p: isCompact ? 2 : 4,
          display: 'flex',
          flexDirection: 'column',
          gap: 2,
          position: 'relative',
          zIndex: 1,
        }}
      >
        <AnimatePresence>
          {isWelcomeState && (
            <WelcomeScreen
              isCompact={isCompact}
              firstName={firstName}
              onTopicClick={(topic) => handleSendMessage(topic)}
            />
          )}
          {messages.map((msg) => (
            <ChatMessage key={msg.id} message={msg} isCompact={isCompact} userAvatarSrc={userAvatarSrc} />
          ))}
          {isTyping && (
            <motion.div
              key="typing-indicator"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 8 }}
            >
              <TypingIndicator />
            </motion.div>
          )}
        </AnimatePresence>
        <div ref={messagesEndRef} />
      </Box>

      {/* Input Area */}
      <Box
        sx={{
          p: isCompact ? 1 : 1.5,
          bgcolor: 'rgba(255,255,255,0.9)',
          backdropFilter: 'blur(10px)',
          borderTop: '1px solid',
          borderColor: 'divider',
          position: 'relative',
          zIndex: 2,
        }}
      >
        <Container maxWidth={isCompact ? false : "md"} disableGutters={isCompact}>
          <Stack direction="row" spacing={1} alignItems="flex-end">
            <TextField
              fullWidth
              multiline
              maxRows={4}
              placeholder={placeholders[language]}
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage();
                }
              }}
              InputProps={{
                sx: {
                  borderRadius: 4,
                  bgcolor: 'rgba(250,247,242,0.9)',
                  '& fieldset': { border: 'none' },
                  px: 2,
                  py: 1,
                  fontSize: isCompact ? '0.85rem' : '0.95rem',
                },
                endAdornment: !isCompact && (
                  <InputAdornment position="end">
                    <Typography variant="caption" sx={{ color: 'text.secondary', mr: 1 }}>{inputText.length}/500</Typography>
                  </InputAdornment>
                )
              }}
            />
            <Stack direction="row" spacing={0.5}>
              <IconButton onClick={handleVoiceInput} sx={{ mb: 0.5, bgcolor: `${COLORS.secondary}15`, color: COLORS.secondary }}><Mic size={isCompact ? 18 : 20} /></IconButton>
              <IconButton disabled={!inputText.trim()} onClick={() => handleSendMessage()} sx={{ mb: 0.5, bgcolor: inputText.trim() ? COLORS.primary : 'divider', color: 'white' }}><Send size={isCompact ? 18 : 20} /></IconButton>
            </Stack>
          </Stack>
        </Container>
      </Box>
    </Box>
  );
});

export default ChatInterface;

function WelcomeScreen({ onTopicClick, isCompact, firstName }: { onTopicClick: (topic: string) => void; isCompact?: boolean; firstName?: string }) {
  const heading = firstName?.trim() ? `Ayubowan ${firstName.trim()}! I'm RaashiBot` : "Ayubowan! I'm RaashiBot";

  return (
    <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', textAlign: 'center', padding: '20px' }}>
      <motion.div animate={{ rotate: 360 }} transition={{ duration: 20, repeat: Infinity, ease: "linear" }} style={{ marginBottom: isCompact ? '12px' : '24px' }}>
        <Flower2 size={isCompact ? 48 : 80} color={COLORS.primary} strokeWidth={1} />
      </motion.div>
      <Typography variant={isCompact ? "h6" : "h4"} sx={{ fontWeight: 800, fontFamily: 'Playfair Display', color: COLORS.primary, mb: 1 }}>{heading}</Typography>
      {!isCompact && <Typography variant="body1" sx={{ color: COLORS.textSecondary, maxWidth: 500, mb: 6 }}>I can help you find your perfect match, understand your horoscope, and plan your wedding.</Typography>}
      <Stack direction={isCompact ? "column" : "row"} spacing={isCompact ? 1 : 2} sx={{ width: '100%', maxWidth: 800 }}>
        {WELCOME_TOPICS.map((topic, i) => (
          <Paper key={topic.id} elevation={0} onClick={() => onTopicClick(topic.title)} sx={{ p: isCompact ? 1.5 : 3, borderRadius: 4, border: '1px solid', borderColor: 'divider', cursor: 'pointer', transition: 'all 0.3s ease', display: 'flex', flexDirection: isCompact ? 'row' : 'column', alignItems: 'center', gap: isCompact ? 2 : 0, '&:hover': { borderColor: topic.color, bgcolor: `${topic.color}05` } }}>
            <Box sx={{ p: 1, borderRadius: 2, bgcolor: `${topic.color}15`, color: topic.color, mb: isCompact ? 0 : 2 }}>{topic.icon}</Box>
            <Box sx={{ textAlign: isCompact ? 'left' : 'center' }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 800, color: COLORS.textPrimary }}>{topic.title}</Typography>
              {!isCompact && <Typography variant="caption" sx={{ color: COLORS.textSecondary }}>{topic.desc}</Typography>}
            </Box>
          </Paper>
        ))}
      </Stack>
    </motion.div>
  );
}
