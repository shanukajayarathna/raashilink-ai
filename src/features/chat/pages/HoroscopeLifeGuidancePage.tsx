import React, { useRef } from 'react';
import { Box, Paper, Typography, Stack, Chip } from '@mui/material';
import { Sparkles, Flower2 } from 'lucide-react';
import { useSelector } from 'react-redux';
import { RootState } from '@/app/store/store';
import ChatInterface, { type ChatInterfaceHandle } from '../components/ChatInterface';

const COLORS = {
  primary: '#8B1A2E',
  secondary: '#C9A84C',
  cream: '#FAF7F2',
  textSecondary: '#555555',
};

const STARTER_PROMPTS = [
  'What does my horoscope say about my life direction this year?',
  'Based on my moon sign and nakshatra, what should I focus on this month?',
  'What are my emotional strengths and blind spots according to my chart?',
  'When is a good time window for important decisions in the next 30 days?',
  'What career themes are highlighted for me right now based on transits?',
  'How can I improve my relationships and communication patterns?',
  'Suggest practical remedies or habits based on my horoscope.',
];

export default function HoroscopeLifeGuidancePage() {
  const chatRef = useRef<ChatInterfaceHandle | null>(null);
  const currentUser = useSelector((state: RootState) => state.auth.user as any);
  const firstName = (currentUser?.firstName || currentUser?.personalInfo?.firstName || '').trim();
  const introMessage = firstName
    ? `Ayubowan ${firstName}. I am your horoscope life guide. Ask me anything about your life path, strengths, timing, relationships, or remedies based on your chart.`
    : 'Ayubowan. I am your horoscope life guide. Ask me anything about your life path, strengths, timing, relationships, or remedies based on your chart.';

  return (
    <Box sx={{ 
      height: 'calc(1000vh - 50px)', 
      maxHeight: 'calc(100vh - 64px)',
      bgcolor: COLORS.cream, 
      p: { xs: 1.5, md: 2 }, 
      display: 'flex', 
      flexDirection: 'column',
      overflow: 'hidden',
      position: 'relative'
    }}>
      <Paper
        elevation={0}
        sx={{
          borderRadius: '20px',
          p: { xs: 1.5, md: 2 },
          mb: 1.5,
          border: '1px solid rgba(139,26,46,0.08)',
          background: 'linear-gradient(135deg, rgba(139,26,46,0.05) 0%, rgba(201,168,76,0.16) 100%)',
          flexShrink: 0
        }}
      >
        <Stack direction="row" spacing={1.2} alignItems="center" sx={{ mb: 0.5 }}>
          <Sparkles size={18} color={COLORS.primary} />
          <Typography variant="h6" sx={{ fontFamily: 'Playfair Display', fontWeight: 800, color: COLORS.primary }}>
            Ask AI About Your Life
          </Typography>
        </Stack>

        <Typography variant="body2" sx={{ color: COLORS.textSecondary, mb: 1, fontSize: '0.85rem' }}>
          RaashiBot uses your birth details and horoscope profile to answer personal life questions with practical guidance.
        </Typography>

        <Stack direction="row" spacing={0.75} useFlexGap flexWrap="wrap">
          {STARTER_PROMPTS.map((prompt) => (
            <Chip
              key={prompt}
              icon={<Flower2 size={12} />}
              label={prompt}
              variant="outlined"
              size="small"
              onClick={() => chatRef.current?.sendMessage(prompt)}
              sx={{ 
                borderColor: COLORS.secondary, 
                color: COLORS.primary, 
                bgcolor: 'rgba(255,255,255,0.65)',
                fontSize: '0.75rem',
                '& .MuiChip-label': { px: 1 }
              }}
            />
          ))}
        </Stack>
      </Paper>

      <Paper
        sx={{
          flexGrow: 1,
          borderRadius: '20px',
          overflow: 'hidden',
          minHeight: 0,
          border: '1px solid rgba(139,26,46,0.08)',
          boxShadow: '0 18px 45px rgba(139,26,46,0.10)',
        }}
      >
        <ChatInterface
          ref={chatRef}
          language="en"
          firstName={firstName}
          initialMessages={[
            {
              id: 'life-guide-1',
              role: 'bot',
              content: introMessage,
              timestamp: new Date().toISOString(),
            },
          ]}
        />
      </Paper>
    </Box>
  );
}
