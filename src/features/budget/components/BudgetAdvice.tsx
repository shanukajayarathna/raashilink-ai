import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Stack,
  TextField,
  Button,
  IconButton,
  Card,
  CardContent,
  Avatar,
  Divider,
  Tooltip,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import {
  Sparkles,
  Send,
  AlertCircle,
  Lightbulb,
  ArrowRight,
  TrendingUp,
  TrendingDown,
  Info,
  Bot,
  ChevronRight,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import weddingService from '@/features/wedding/services/weddingService';

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

const TIP_COLORS = [COLORS.warning, COLORS.accent, COLORS.success];
const TIP_ICONS = [<AlertCircle size={18} />, <Lightbulb size={18} />, <TrendingDown size={18} />];

export default function BudgetAdvice() {
  const [query, setQuery] = useState('');
  const [isAsking, setIsAsking] = useState(false);
  const [aiResponse, setAiResponse] = useState<string | null>(null);
  const [tips, setTips] = useState<string[]>([]);
  const [loadingTips, setLoadingTips] = useState(true);

  useEffect(() => {
    const fetchTips = async () => {
      setLoadingTips(true);
      try {
        const data = await weddingService.getAiBudgetTips();
        setTips(data);
      } catch {
        setTips([
          'Book your venue and catering at least 9 months in advance to lock in the best rates.',
          'Source floral decorations from Pettah wholesale market for up to 40% savings.',
          'Keep a 10-15% buffer for last-minute Sri Lankan wedding expenses.',
        ]);
      } finally {
        setLoadingTips(false);
      }
    };
    fetchTips();
  }, []);

  const handleAsk = async () => {
    if (!query) return;
    setIsAsking(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      setAiResponse(`Based on your current budget, ${query.toLowerCase().includes('cater') ? 'consider reducing your catering cost by limiting the guest list or opting for a buffet-style service instead of plated meals.' : 'I recommend prioritising Venue and Catering as they typically account for 50-60% of a Sri Lankan wedding budget. Explore local suppliers and book early for the best rates.'}`);
    } catch (err) {
      console.error(err);
    } finally {
      setIsAsking(false);
      setQuery('');
    }
  };

  return (
    <Card sx={{ borderRadius: 6, border: '1px solid', borderColor: 'divider', bgcolor: COLORS.white, overflow: 'hidden' }}>
      <Box sx={{ p: 3, bgcolor: COLORS.primary, color: 'white', display: 'flex', alignItems: 'center', gap: 2 }}>
        <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: 'white' }}>
          <Bot size={24} />
        </Avatar>
        <Box>
          <Typography variant="h6" sx={{ fontWeight: 800, fontFamily: 'Playfair Display' }}>
            Budget Advisor 🤖
          </Typography>
          <Typography variant="caption" sx={{ opacity: 0.8 }}>
            Real-time AI financial guidance
          </Typography>
        </Box>
      </Box>

      <CardContent sx={{ p: 3 }}>
        <Stack spacing={3}>
          <AnimatePresence>
            {loadingTips ? (
              [0, 1, 2].map(i => (
                <Box key={i} sx={{ height: 72, borderRadius: 4, bgcolor: 'divider', opacity: 0.4, animation: 'pulse 1.5s ease-in-out infinite' }} />
              ))
            ) : (
              tips.map((tipText, i) => (
                <MotionBox
                  key={i}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.1 }}
                  sx={{
                    p: 2,
                    borderRadius: 4,
                    bgcolor: `${TIP_COLORS[i]}08`,
                    border: '1px solid',
                    borderColor: `${TIP_COLORS[i]}20`,
                    position: 'relative',
                    overflow: 'hidden'
                  }}
                >
                  <Stack direction="row" spacing={2} alignItems="flex-start">
                    <Box sx={{ color: TIP_COLORS[i], mt: 0.5 }}>
                      {TIP_ICONS[i]}
                    </Box>
                    <Typography variant="body2" sx={{ color: 'text.secondary', lineHeight: 1.5 }}>
                      {tipText}
                    </Typography>
                  </Stack>
                </MotionBox>
              ))
            )}
          </AnimatePresence>

          {aiResponse && (
            <MotionBox
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              sx={{ p: 2, borderRadius: 4, bgcolor: `${COLORS.secondary}10`, border: '1px solid', borderColor: COLORS.secondary }}
            >
              <Typography variant="caption" sx={{ fontWeight: 800, color: COLORS.secondary, display: 'block', mb: 1 }}>
                AI SUGGESTION
              </Typography>
              <Typography variant="body2" sx={{ fontStyle: 'italic', color: COLORS.textPrimary }}>
                "{aiResponse}"
              </Typography>
            </MotionBox>
          )}

          <Divider />

          <Box>
            <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 700, mb: 1.5, display: 'block' }}>
              Ask AI for Advice
            </Typography>
            <TextField
              fullWidth
              size="small"
              placeholder="e.g. How to save on catering?"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleAsk()}
              disabled={isAsking}
              InputProps={{
                endAdornment: (
                  <IconButton 
                    onClick={handleAsk} 
                    disabled={!query || isAsking}
                    sx={{ color: COLORS.primary }}
                  >
                    {isAsking ? <CircularProgress size={18} /> : <Send size={18} />}
                  </IconButton>
                ),
                sx: { borderRadius: 3, bgcolor: COLORS.cream }
              }}
            />
          </Box>
        </Stack>
      </CardContent>
    </Card>
  );
}

const MotionBox = motion(Box);
const CircularProgress = ({ size }: any) => (
  <Box sx={{ width: size, height: size, borderRadius: '50%', border: '2px solid', borderColor: COLORS.primary, borderTopColor: 'transparent', animation: 'spin 1s linear infinite' }}>
    <style>{`
      @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }
    `}</style>
  </Box>
);

