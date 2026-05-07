import React from 'react';
import {
  Box,
  Typography,
  Avatar,
  Stack,
  Card,
  CardContent,
  Grid,
  Button,
  Checkbox,
  FormControlLabel,
  useTheme,
} from '@mui/material';
import {
  Flower2,
  User,
  Star,
  MapPin,
  ExternalLink,
  CheckCircle2,
  TrendingUp,
} from 'lucide-react';
import { motion } from 'motion/react';
import ReactMarkdown from 'react-markdown';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip as RechartsTooltip,
} from 'recharts';

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
};

interface ChatMessageProps {
  message: {
    id: string;
    role: 'user' | 'bot';
    content: string;
    type?: 'text' | 'match' | 'vendor' | 'budget' | 'horoscope' | 'checklist';
    data?: any;
    timestamp: string;
  };
  isCompact?: boolean;
  userAvatarSrc?: string;
}

export default function ChatMessage({ message, isCompact, userAvatarSrc }: ChatMessageProps) {
  const isBot = message.role === 'bot';
  const theme = useTheme();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
    >
      <Box
        sx={{
          display: 'flex',
          flexDirection: isBot ? 'row' : 'row-reverse',
          alignItems: 'flex-start',
          mb: isCompact ? 1.5 : 3,
          gap: 1.5,
        }}
      >
        {/* Avatar */}
        <Avatar
          src={!isBot ? userAvatarSrc : undefined}
          sx={{
            width: isCompact ? 28 : 36,
            height: isCompact ? 28 : 36,
            bgcolor: isBot ? 'white' : COLORS.secondary,
            color: isBot ? COLORS.primary : 'white',
            border: isBot ? `1px solid ${COLORS.primary}20` : 'none',
            boxShadow: isBot ? '0 2px 8px rgba(0,0,0,0.05)' : 'none',
          }}
        >
          {isBot ? <Flower2 size={isCompact ? 16 : 20} /> : <User size={isCompact ? 16 : 20} />}
        </Avatar>

        {/* Message Bubble */}
        <Box sx={{ maxWidth: isCompact ? '85%' : '75%', minWidth: isCompact ? '60px' : '100px' }}>
          <Box
            sx={{
              p: isCompact ? 1.5 : 2,
              borderRadius: isBot ? '0 16px 16px 16px' : '16px 0 16px 16px',
              bgcolor: isBot ? 'white' : COLORS.primary,
              background: isBot ? 'white' : `linear-gradient(135deg, ${COLORS.secondary} 0%, ${COLORS.primary} 100%)`,
              color: isBot ? COLORS.textPrimary : 'white',
              boxShadow: isBot ? '0 2px 16px rgba(139,26,46,0.05)' : '0 4px 16px rgba(139,26,46,0.15)',
              position: 'relative',
              fontSize: isCompact ? '0.8rem' : 'inherit',
            }}
          >
            <Box
              sx={{
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word',
                color: isBot ? COLORS.textPrimary : 'white',
                '& p': { m: 0, mb: '0.3em', lineHeight: 1.55 },
                '& p:last-child': { mb: 0 },
                '& a': { color: isBot ? COLORS.primary : '#FFF9C4', textDecoration: 'underline' },
                '& code': { bgcolor: isBot ? 'rgba(0,0,0,0.07)' : 'rgba(255,255,255,0.22)', color: 'inherit', px: '4px', py: '1px', borderRadius: '3px', fontSize: '0.88em', fontFamily: 'monospace' },
                '& pre': { bgcolor: isBot ? 'rgba(0,0,0,0.07)' : 'rgba(255,255,255,0.12)', p: 1, borderRadius: 1, overflowX: 'auto', my: '0.4em', '& code': { bgcolor: 'transparent', p: 0 } },
                '& strong': { fontWeight: 700, color: 'inherit' },
                '& em': { fontStyle: 'italic', color: 'inherit' },
                '& ul, & ol': { pl: '1.4em', my: '0.3em' },
                '& li': { color: 'inherit', mb: '0.15em', lineHeight: 1.5 },
                '& h1, & h2, & h3, & h4': { color: isBot ? COLORS.primary : 'white', fontWeight: 700, lineHeight: 1.3, mt: '0.4em', mb: '0.2em' },
                '& blockquote': { borderLeft: `3px solid ${isBot ? COLORS.secondary : 'rgba(255,255,255,0.45)'}`, pl: '0.75em', ml: 0, my: '0.3em', color: 'inherit', opacity: 0.9 },
                '& hr': { border: 'none', borderTop: `1px solid ${isBot ? COLORS.primary + '25' : 'rgba(255,255,255,0.25)'}`, my: '0.5em' },
                '& table': { borderCollapse: 'collapse', width: '100%', my: '0.4em' },
                '& th': { bgcolor: isBot ? COLORS.primary + '12' : 'rgba(255,255,255,0.15)', fontWeight: 700 },
                '& th, & td': { border: `1px solid ${isBot ? 'rgba(0,0,0,0.12)' : 'rgba(255,255,255,0.25)'}`, px: '0.5em', py: '0.3em', color: 'inherit', fontSize: '0.9em' },
              }}
            >
              <ReactMarkdown>{message.content}</ReactMarkdown>
            </Box>

            {/* Special Content Rendering */}
            {message.type === 'match' && <MatchCard data={message.data} isCompact={isCompact} />}
            {message.type === 'vendor' && <VendorCard data={message.data} isCompact={isCompact} />}
            {message.type === 'budget' && <BudgetMiniChart data={message.data} isCompact={isCompact} />}
            {message.type === 'horoscope' && <HoroscopeSummary data={message.data} isCompact={isCompact} />}
            {message.type === 'checklist' && <Checklist data={message.data} isCompact={isCompact} />}
          </Box>
          
          <Typography
            variant="caption"
            sx={{
              display: 'block',
              mt: 0.5,
              textAlign: isBot ? 'left' : 'right',
              color: 'text.secondary',
              fontWeight: 600,
              fontSize: '0.65rem',
            }}
          >
            {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </Typography>
        </Box>
      </Box>
    </motion.div>
  );
}

// --- Specialized Content Components ---

function MatchCard({ data, isCompact }: { data: any; isCompact?: boolean }) {
  return (
    <Card sx={{ mt: 2, borderRadius: 3, border: `1px solid ${COLORS.primary}10`, boxShadow: 'none' }}>
      <CardContent sx={{ p: isCompact ? 1.5 : 2 }}>
        <Stack direction="row" spacing={isCompact ? 1 : 2} alignItems="center">
          <Avatar src={data.image} sx={{ width: isCompact ? 40 : 60, height: isCompact ? 40 : 60, borderRadius: 2 }} />
          <Box sx={{ flex: 1 }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 800, color: COLORS.primary, fontSize: isCompact ? '0.75rem' : 'inherit' }}>{data.name}</Typography>
            <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', fontSize: isCompact ? '0.65rem' : 'inherit' }}>{data.age} • {data.location}</Typography>
            <Stack direction="row" spacing={1} sx={{ mt: 0.5 }}>
              <Star size={isCompact ? 10 : 12} color={COLORS.secondary} fill={COLORS.secondary} />
              <Typography variant="caption" sx={{ fontWeight: 700, color: COLORS.secondary, fontSize: isCompact ? '0.65rem' : 'inherit' }}>{data.matchScore}% Match</Typography>
            </Stack>
          </Box>
          {!isCompact && (
            <Button variant="outlined" size="small" sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 700, px: 2 }}>
              View
            </Button>
          )}
        </Stack>
      </CardContent>
    </Card>
  );
}

function VendorCard({ data, isCompact }: { data: any; isCompact?: boolean }) {
  return (
    <Card sx={{ mt: 2, borderRadius: 3, border: `1px solid ${COLORS.primary}10`, boxShadow: 'none' }}>
      <CardContent sx={{ p: isCompact ? 1.5 : 2 }}>
        <Stack direction="row" spacing={isCompact ? 1 : 2} alignItems="center">
          <Avatar src={data.image} sx={{ width: isCompact ? 40 : 60, height: isCompact ? 40 : 60, borderRadius: 2 }} />
          <Box sx={{ flex: 1 }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 800, color: COLORS.primary, fontSize: isCompact ? '0.75rem' : 'inherit' }}>{data.name}</Typography>
            <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', fontSize: isCompact ? '0.65rem' : 'inherit' }}>{data.category} • {data.location}</Typography>
            <Typography variant="caption" sx={{ fontWeight: 700, color: COLORS.accent, display: 'block', fontSize: isCompact ? '0.65rem' : 'inherit' }}>From LKR {data.price}</Typography>
          </Box>
          {!isCompact && (
            <Button variant="contained" size="small" sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 700, px: 2, bgcolor: COLORS.primary }}>
              Book
            </Button>
          )}
        </Stack>
      </CardContent>
    </Card>
  );
}

function BudgetMiniChart({ data, isCompact }: { data: any; isCompact?: boolean }) {
  const chartData = [
    { name: 'Spent', value: data.spent },
    { name: 'Remaining', value: data.remaining },
  ];
  const CHART_COLORS = [COLORS.primary, COLORS.secondary];

  return (
    <Box sx={{ mt: 2, p: isCompact ? 1 : 2, bgcolor: COLORS.cream, borderRadius: 3, textAlign: 'center' }}>
      <Typography variant="caption" sx={{ fontWeight: 800, color: COLORS.primary, mb: 1, display: 'block', fontSize: isCompact ? '0.65rem' : 'inherit' }}>
        Budget Breakdown
      </Typography>
      <Box sx={{ height: isCompact ? 80 : 120 }}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={chartData}
              innerRadius={isCompact ? 20 : 30}
              outerRadius={isCompact ? 35 : 50}
              paddingAngle={5}
              dataKey="value"
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
              ))}
            </Pie>
            <RechartsTooltip />
          </PieChart>
        </ResponsiveContainer>
      </Box>
      <Stack direction="row" justifyContent="space-around" sx={{ mt: 1 }}>
        <Box>
          <Typography variant="caption" sx={{ display: 'block', color: 'text.secondary', fontSize: '0.6rem' }}>Spent</Typography>
          <Typography variant="subtitle2" sx={{ fontWeight: 800, fontSize: isCompact ? '0.7rem' : 'inherit' }}>LKR {data.spent.toLocaleString()}</Typography>
        </Box>
        <Box>
          <Typography variant="caption" sx={{ display: 'block', color: 'text.secondary', fontSize: '0.6rem' }}>Rem.</Typography>
          <Typography variant="subtitle2" sx={{ fontWeight: 800, fontSize: isCompact ? '0.7rem' : 'inherit' }}>LKR {data.remaining.toLocaleString()}</Typography>
        </Box>
      </Stack>
    </Box>
  );
}

function HoroscopeSummary({ data, isCompact }: { data: any; isCompact?: boolean }) {
  return (
    <Box sx={{ mt: 2, p: isCompact ? 1.5 : 2, bgcolor: COLORS.cream, borderRadius: 3, borderLeft: `4px solid ${COLORS.secondary}` }}>
      <Typography variant="subtitle2" sx={{ fontWeight: 800, color: COLORS.primary, mb: 1, fontSize: isCompact ? '0.75rem' : 'inherit' }}>
        {data.sign} Horoscope
      </Typography>
      <Grid container spacing={1}>
        {data.traits.map((trait: string, i: number) => (
          <Grid size={{ xs: 6 }} key={i}>
            <Stack direction="row" spacing={1} alignItems="center">
              <CheckCircle2 size={isCompact ? 10 : 12} color={COLORS.success} />
              <Typography variant="caption" sx={{ fontWeight: 600, fontSize: isCompact ? '0.65rem' : 'inherit' }}>{trait}</Typography>
            </Stack>
          </Grid>
        ))}
      </Grid>
      <Typography variant="caption" sx={{ display: 'block', mt: 1, fontStyle: 'italic', color: 'text.secondary', fontSize: isCompact ? '0.6rem' : 'inherit' }}>
        "{data.summary}"
      </Typography>
    </Box>
  );
}

function Checklist({ data, isCompact }: { data: any; isCompact?: boolean }) {
  return (
    <Box sx={{ mt: 2, p: isCompact ? 1.5 : 2, bgcolor: COLORS.cream, borderRadius: 3 }}>
      <Typography variant="subtitle2" sx={{ fontWeight: 800, color: COLORS.primary, mb: 1, fontSize: isCompact ? '0.75rem' : 'inherit' }}>
        {data.title}
      </Typography>
      <Stack spacing={0.5}>
        {data.items.map((item: any, i: number) => (
          <FormControlLabel
            key={i}
            control={<Checkbox size="small" checked={item.completed} sx={{ color: COLORS.primary, '&.Mui-checked': { color: COLORS.primary } }} />}
            label={<Typography variant="caption" sx={{ fontWeight: 600, fontSize: isCompact ? '0.65rem' : 'inherit' }}>{item.label}</Typography>}
          />
        ))}
      </Stack>
    </Box>
  );
}

const COLORS_SUCCESS = '#2E7D32';
