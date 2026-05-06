import React from 'react';
import { Box, Paper, Typography, Stack, Chip } from '@mui/material';
import { Sparkles, Flower2 } from 'lucide-react';
import ChatInterface from '../components/ChatInterface';

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
  'Suggest practical remedies or habits based on my horoscope.',
];

export default function HoroscopeLifeGuidancePage() {
  return (
    <Box sx={{ minHeight: 'calc(100vh - 64px)', bgcolor: COLORS.cream, p: { xs: 2, md: 3 } }}>
      <Paper
        elevation={0}
        sx={{
          borderRadius: '20px',
          p: { xs: 2, md: 3 },
          mb: 2,
          border: '1px solid rgba(139,26,46,0.08)',
          background: 'linear-gradient(135deg, rgba(139,26,46,0.05) 0%, rgba(201,168,76,0.16) 100%)',
        }}
      >
        <Stack direction="row" spacing={1.2} alignItems="center" sx={{ mb: 1 }}>
          <Sparkles size={20} color={COLORS.primary} />
          <Typography variant="h5" sx={{ fontFamily: 'Playfair Display', fontWeight: 800, color: COLORS.primary }}>
            Ask AI About Your Life
          </Typography>
        </Stack>

        <Typography variant="body2" sx={{ color: COLORS.textSecondary, mb: 1.5 }}>
          RaashiBot uses your birth details and horoscope profile to answer personal life questions with practical guidance.
        </Typography>

        <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
          {STARTER_PROMPTS.map((prompt) => (
            <Chip
              key={prompt}
              icon={<Flower2 size={14} />}
              label={prompt}
              variant="outlined"
              sx={{ borderColor: COLORS.secondary, color: COLORS.primary, bgcolor: 'rgba(255,255,255,0.65)' }}
            />
          ))}
        </Stack>
      </Paper>

      <Paper sx={{ height: 'calc(100vh - 250px)', minHeight: 420, borderRadius: '20px', overflow: 'hidden' }}>
        <ChatInterface
          language="en"
          initialMessages={[
            {
              id: 'life-guide-1',
              role: 'bot',
              content:
                'Namaste. I am your horoscope life guide. Ask me anything about your life path, strengths, timing, relationships, or remedies based on your chart.',
              timestamp: new Date().toISOString(),
            },
          ]}
        />
      </Paper>
    </Box>
  );
}
