import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  Box,
  Container,
  Typography,
  Stack,
  TextField,
  IconButton,
  Button,
  Avatar,
  Drawer,
  useTheme,
  useMediaQuery,
  Divider,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Badge,
  Paper,
  InputAdornment,
  Tooltip,
  CircularProgress,
} from '@mui/material';
import {
  Send,
  Mic,
  Paperclip,
  Smile,
  MoreVertical,
  Plus,
  Trash2,
  Languages,
  Flower2,
  Menu as MenuIcon,
  X,
  Sparkles,
  Heart,
  Calendar,
  Wallet,
  MapPin,
  Camera,
  ChevronRight,
  ArrowRight,
  Bot,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useSelector } from 'react-redux';
import { RootState } from '@/app/store/store';
import axios from 'axios';

// Components
import ChatSidebar from '../components/ChatSidebar';
import ChatInterface from '../components/ChatInterface';

// --- Theme Constants ---
const COLORS = {
  primary: '#8B1A2E',
  secondary: '#C9A84C',
  accent: '#1A6B72',
  cream: '#FAF7F2',
  white: '#FFFFFF',
  textPrimary: '#1C1C1C',
  textSecondary: '#555555',
  success: '#2E7D32',
  error: '#D32F2F',
  warning: '#ED6C02',
};

const MOCK_HISTORY = [
  { id: '1', title: 'Wedding Planning in Colombo', date: 'Yesterday' },
  { id: '2', title: 'Horoscope Compatibility Check', date: '2 days ago' },
  { id: '3', title: 'Budget Advice for 200 Guests', date: 'Last week' },
];

export default function AIChatbot() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [isSidebarOpen, setIsSidebarOpen] = useState(!isMobile);
  const [language, setLanguage] = useState<'en' | 'si' | 'ta'>('en');
  const [chatKey, setChatKey] = useState(0); // Used to reset ChatInterface

  const handleLanguageChange = (lang: 'en' | 'si' | 'ta') => {
    setLanguage(lang);
  };

  const handleClearChat = () => {
    setChatKey(prev => prev + 1);
  };

  return (
    <Box sx={{ height: 'calc(100vh - 64px)', display: 'flex', bgcolor: COLORS.cream, overflow: 'hidden' }}>
      {/* Sidebar - Desktop */}
      {!isMobile && (
        <Box sx={{ width: 320, flexShrink: 0 }}>
          <ChatSidebar
            language={language}
            onLanguageChange={handleLanguageChange}
            onTopicClick={(topic) => {}} // Topics handled inside ChatInterface now or via ref
            history={MOCK_HISTORY}
            onClearChat={handleClearChat}
          />
        </Box>
      )}

      {/* Sidebar - Mobile Drawer */}
      <Drawer
        anchor="left"
        open={isMobile && isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        PaperProps={{ sx: { width: 280 } }}
      >
        <ChatSidebar
          language={language}
          onLanguageChange={handleLanguageChange}
          onTopicClick={(topic) => { setIsSidebarOpen(false); }}
          history={MOCK_HISTORY}
          onClearChat={handleClearChat}
        />
      </Drawer>

      {/* Main Chat Area */}
      <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', position: 'relative' }}>
        {/* Chat Header */}
        <Paper
          elevation={0}
          sx={{
            p: 2,
            borderBottom: '1px solid',
            borderColor: 'divider',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            bgcolor: 'white',
            zIndex: 10
          }}
        >
          <Stack direction="row" spacing={2} alignItems="center">
            {isMobile && (
              <IconButton onClick={() => setIsSidebarOpen(true)}>
                <MenuIcon size={20} />
              </IconButton>
            )}
            <Box sx={{ position: 'relative' }}>
              <motion.div
                animate={{
                  boxShadow: ['0 0 0 0px rgba(139,26,46,0.4)', '0 0 0 10px rgba(139,26,46,0)', '0 0 0 0px rgba(139,26,46,0)'],
                }}
                transition={{ duration: 2, repeat: Infinity }}
                style={{ borderRadius: '50%' }}
              >
                <Avatar sx={{ bgcolor: COLORS.primary, width: 40, height: 40 }}>
                  <Flower2 size={24} />
                </Avatar>
              </motion.div>
              <Box sx={{
                position: 'absolute',
                bottom: 0,
                right: 0,
                width: 12,
                height: 12,
                bgcolor: COLORS.success,
                borderRadius: '50%',
                border: '2px solid white'
              }} />
            </Box>
            <Box>
              <Typography variant="subtitle1" sx={{ fontWeight: 800, color: COLORS.primary, lineHeight: 1.2 }}>
                RaashiBot
              </Typography>
              <Typography variant="caption" sx={{ color: COLORS.textSecondary, fontWeight: 600 }}>
                Online • Powered by GPT-4
              </Typography>
            </Box>
          </Stack>

          <Stack direction="row" spacing={1}>
            <Tooltip title="New Chat">
              <IconButton onClick={handleClearChat}>
                <Plus size={20} />
              </IconButton>
            </Tooltip>
            <IconButton>
              <MoreVertical size={20} />
            </IconButton>
          </Stack>
        </Paper>

        <Box sx={{ flex: 1, overflow: 'hidden' }}>
          <ChatInterface key={chatKey} />
        </Box>
      </Box>
    </Box>
  );
}


