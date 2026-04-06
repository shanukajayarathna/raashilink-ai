import React, { useState } from 'react';
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

const MOCK_TIPS = [
  {
    id: 1,
    type: 'warning',
    icon: <AlertCircle size={18} />,
    title: 'Catering Alert',
    message: 'Catering is 20% over budget. Consider reducing guest count by 30 to save ~LKR 45,000.',
    color: COLORS.error,
  },
  {
    id: 2,
    type: 'info',
    icon: <Lightbulb size={18} />,
    title: 'Photography Tip',
    message: 'Photography allocation is 40% unused. Reallocate LKR 20,000 to Decoration?',
    color: COLORS.accent,
  },
  {
    id: 3,
    type: 'success',
    icon: <TrendingDown size={18} />,
    title: 'Venue Savings',
    message: 'Great job! You saved LKR 50,000 on the venue. We recommend reallocating this to your "Photography" fund for a better package.',
    color: COLORS.success,
  }
];

export default function BudgetAdvice() {
  const [query, setQuery] = useState('');
  const [isAsking, setIsAsking] = useState(false);
  const [aiResponse, setAiResponse] = useState<string | null>(null);

  const handleAsk = async () => {
    if (!query) return;
    setIsAsking(true);
    try {
      // Simulating AI call
      await new Promise(resolve => setTimeout(resolve, 2000));
      setAiResponse("Based on your current budget, I recommend prioritizing the Venue and Catering as they typically account for 50-60% of total costs in Sri Lankan weddings. You might want to explore local flower options to save on Decoration.");
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
            {MOCK_TIPS.map((tip, i) => (
              <MotionBox
                key={tip.id}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.1 }}
                sx={{
                  p: 2,
                  borderRadius: 4,
                  bgcolor: `${tip.color}08`,
                  border: '1px solid',
                  borderColor: `${tip.color}20`,
                  position: 'relative',
                  overflow: 'hidden'
                }}
              >
                <Stack direction="row" spacing={2} alignItems="flex-start">
                  <Box sx={{ color: tip.color, mt: 0.5 }}>
                    {tip.icon}
                  </Box>
                  <Box>
                    <Typography variant="subtitle2" sx={{ fontWeight: 800, color: tip.color, mb: 0.5 }}>
                      {tip.title}
                    </Typography>
                    <Typography variant="body2" sx={{ color: 'text.secondary', lineHeight: 1.5 }}>
                      {tip.message}
                    </Typography>
                  </Box>
                </Stack>
                <IconButton size="small" sx={{ position: 'absolute', top: 8, right: 8, color: tip.color, opacity: 0.5 }}>
                  <ChevronRight size={16} />
                </IconButton>
              </MotionBox>
            ))}
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

