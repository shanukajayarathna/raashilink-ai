import React from 'react';
import {
  Box,
  Typography,
  Stack,
  Chip,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  ListItemIcon,
  Divider,
  Button,
  Select,
  MenuItem,
  FormControl,
  Avatar,
  IconButton,
  useTheme,
} from '@mui/material';
import {
  MessageSquare,
  History,
  Trash2,
  Search,
  Sparkles,
  Heart,
  Calendar,
  Wallet,
  MapPin,
  Camera,
  Languages,
  Flower2,
} from 'lucide-react';
import { motion } from 'motion/react';

const COLORS = {
  primary: '#8B1A2E',
  secondary: '#C9A84C',
  accent: '#1A6B72',
  cream: '#FAF7F2',
  white: '#FFFFFF',
  textPrimary: '#1C1C1C',
  textSecondary: '#555555',
  error: '#D32F2F',
};

const QUICK_TOPICS = {
  en: [
    { label: "🔍 Find matches for me", icon: <Heart size={16} /> },
    { label: "💒 Help plan my wedding", icon: <Calendar size={16} /> },
    { label: "🌺 Explain my horoscope", icon: <Flower2 size={16} /> },
    { label: "💰 Budget advice", icon: <Wallet size={16} /> },
    { label: "🏛 Find a venue in Colombo", icon: <MapPin size={16} /> },
    { label: "📸 Best photographers?", icon: <Camera size={16} /> },
  ],
  si: [
    { label: "🔍 මට ගැලපෙන සහකරුවන් සොයන්න", icon: <Heart size={16} /> },
    { label: "💒 මගේ විවාහය සැලසුම් කිරීමට උදවු වන්න", icon: <Calendar size={16} /> },
    { label: "🌺 මගේ කේන්දරය පැහැදිලි කරන්න", icon: <Flower2 size={16} /> },
    { label: "💰 අයවැය උපදෙස්", icon: <Wallet size={16} /> },
    { label: "🏛 කොළඹින් උත්සව ශාලාවක් සොයන්න", icon: <MapPin size={16} /> },
    { label: "📸 හොඳම ඡායාරූප ශිල්පීන්?", icon: <Camera size={16} /> },
  ],
  ta: [
    { label: "🔍 எனக்கான பொருத்தங்களைத் தேடுங்கள்", icon: <Heart size={16} /> },
    { label: "💒 எனது திருமணத்தைத் திட்டமிட உதவுங்கள்", icon: <Calendar size={16} /> },
    { label: "🌺 எனது ஜாதகத்தை விளக்குங்கள்", icon: <Flower2 size={16} /> },
    { label: "💰 பட்ஜெட் ஆலோசனை", icon: <Wallet size={16} /> },
    { label: "🏛 கொழும்பில் ஒரு மண்டபத்தைத் தேடுங்கள்", icon: <MapPin size={16} /> },
    { label: "📸 சிறந்த புகைப்படக் கலைஞர்கள்?", icon: <Camera size={16} /> },
  ]
};

interface ChatSidebarProps {
  language: 'en' | 'si' | 'ta';
  onLanguageChange: (lang: 'en' | 'si' | 'ta') => void;
  onTopicClick: (topic: string) => void;
  history: any[];
  onClearChat: () => void;
}

export default function ChatSidebar({
  language,
  onLanguageChange,
  onTopicClick,
  history,
  onClearChat
}: ChatSidebarProps) {
  const theme = useTheme();
  const topics = QUICK_TOPICS[language];

  return (
    <Box
      sx={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        bgcolor: COLORS.white,
        borderRight: '1px solid',
        borderColor: 'divider',
      }}
    >
      {/* Sidebar Header */}
      <Box sx={{ p: 3, bgcolor: COLORS.cream }}>
        <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 3 }}>
          <Box sx={{ position: 'relative' }}>
            <motion.div
              animate={{
                scale: [1, 1.1, 1],
                opacity: [0.5, 0.8, 0.5],
              }}
              transition={{
                duration: 3,
                repeat: Infinity,
                ease: "easeInOut"
              }}
              style={{
                position: 'absolute',
                top: -4,
                left: -4,
                right: -4,
                bottom: -4,
                borderRadius: '50%',
                border: `2px solid ${COLORS.primary}`,
              }}
            />
            <Avatar
              sx={{
                width: 48,
                height: 48,
                bgcolor: COLORS.primary,
                color: 'white',
                boxShadow: '0 4px 12px rgba(139,26,46,0.2)'
              }}
            >
              <Flower2 size={28} />
            </Avatar>
          </Box>
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 800, fontFamily: 'Playfair Display', color: COLORS.primary }}>
              RaashiBot
            </Typography>
            <Typography variant="caption" sx={{ color: COLORS.textSecondary, fontWeight: 600 }}>
              AI Wedding Assistant
            </Typography>
          </Box>
        </Stack>

        <FormControl fullWidth size="small">
          <Select
            value={language}
            onChange={(e) => onLanguageChange(e.target.value as any)}
            sx={{
              borderRadius: 3,
              bgcolor: 'white',
              '& .MuiSelect-select': {
                display: 'flex',
                alignItems: 'center',
                gap: 1,
                fontWeight: 700,
                fontSize: '0.875rem'
              }
            }}
            startAdornment={<Languages size={16} style={{ marginRight: 8, color: COLORS.primary }} />}
          >
            <MenuItem value="en">English</MenuItem>
            <MenuItem value="si">සිංහල</MenuItem>
            <MenuItem value="ta">தமிழ்</MenuItem>
          </Select>
        </FormControl>
      </Box>

      {/* Quick Topics */}
      <Box sx={{ p: 2, flexShrink: 0 }}>
        <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 700, mb: 1.5, display: 'block', px: 1 }}>
          QUICK TOPICS
        </Typography>
        <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap" sx={{ px: 1 }}>
          {topics.map((topic, index) => (
            <motion.div
              key={index}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Chip
                label={topic.label}
                onClick={() => onTopicClick(topic.label)}
                sx={{
                  borderRadius: 2,
                  fontWeight: 600,
                  fontSize: '0.75rem',
                  bgcolor: COLORS.cream,
                  color: COLORS.textPrimary,
                  border: '1px solid transparent',
                  '&:hover': {
                    bgcolor: 'white',
                    borderColor: COLORS.secondary,
                    color: COLORS.primary,
                  }
                }}
              />
            </motion.div>
          ))}
        </Stack>
      </Box>

      <Divider sx={{ my: 1 }} />

      {/* Chat History */}
      <Box sx={{ flex: 1, overflowY: 'auto', p: 2 }}>
        <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2, px: 1 }}>
          <History size={14} color={COLORS.textSecondary} />
          <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 700 }}>
            CHAT HISTORY
          </Typography>
        </Stack>
        
        <List sx={{ p: 0 }}>
          {history.length > 0 ? (
            history.map((chat) => (
              <ListItem key={chat.id} disablePadding sx={{ mb: 0.5 }}>
                <ListItemButton
                  sx={{
                    borderRadius: 3,
                    '&:hover': { bgcolor: COLORS.cream }
                  }}
                >
                  <ListItemIcon sx={{ minWidth: 36 }}>
                    <MessageSquare size={18} color={COLORS.primary} />
                  </ListItemIcon>
                  <ListItemText
                    primary={chat.title}
                    secondary={chat.date}
                    primaryTypographyProps={{
                      variant: 'body2',
                      fontWeight: 700,
                      noWrap: true,
                      color: COLORS.textPrimary
                    }}
                    secondaryTypographyProps={{
                      variant: 'caption',
                      fontWeight: 500
                    }}
                  />
                </ListItemButton>
              </ListItem>
            ))
          ) : (
            <Box sx={{ p: 4, textAlign: 'center' }}>
              <Typography variant="caption" sx={{ color: 'text.secondary', fontStyle: 'italic' }}>
                No previous chats
              </Typography>
            </Box>
          )}
        </List>
      </Box>

      {/* Footer Actions */}
      <Box sx={{ p: 1.5, borderTop: '1px solid', borderColor: 'divider' }}>
        <Button
          fullWidth
          variant="text"
          startIcon={<Trash2 size={18} />}
          onClick={onClearChat}
          sx={{
            borderRadius: 3,
            color: COLORS.error,
            fontWeight: 700,
            textTransform: 'none',
            '&:hover': { bgcolor: `${COLORS.error}10` }
          }}
        >
          Clear Chat
        </Button>
      </Box>
    </Box>
  );
}

