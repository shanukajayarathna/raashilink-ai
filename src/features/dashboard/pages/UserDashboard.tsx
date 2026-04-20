import React, { useState, useEffect, useCallback } from 'react';
import { 
  Box, 
  Grid, 
  Typography, 
  Paper, 
  Avatar, 
  Button, 
  Chip, 
  CircularProgress,
  LinearProgress, 
  IconButton, 
  Drawer, 
  List, 
  ListItem, 
  ListItemText, 
  ListItemIcon,
  Skeleton,
  Stack,
  Tooltip,
  Badge,
  useTheme,
  useMediaQuery,
  alpha,
  Alert,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  TextField
} from '@mui/material';
import { 
  Favorite, 
  Notifications, 
  CheckCircle, 
  CalendarToday as CalendarMonth, 
  LocationOn, 
  TrendingUp, 
  Store as Storefront, 
  AccessTime, 
  InfoOutlined,
  MoreVert,
  ArrowForward,
  Close,
  CheckCircleOutline,
  RadioButtonUnchecked,
  Circle,
  Map as MapIcon,
  FlightTakeoff,
  VerifiedUser,
  Email,
  Phone
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'motion/react';
import { 
  LineChart, 
  Line, 
  ResponsiveContainer, 
  XAxis, 
  YAxis, 
  Tooltip as RechartsTooltip 
} from 'recharts';
import { MessageCircle, UserMinus, Send, Inbox, UserCheck, UserX, Eye } from 'lucide-react';
import MatchDetailPanel from '@/features/matchmaking/components/MatchDetailPanel';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '@/app/store/store';
import axiosInstance from '@/shared/config/axiosConfig';
import DashboardSkeleton from '@/components/skeletons/DashboardSkeleton';
import userService from '@/features/profile/services/userService';
import matchService from '@/features/matchmaking/services/matchService';
import weddingService from '@/features/wedding/services/weddingService';
import { showToast } from '@/app/store/uiSlice';
import { updateUser } from '@/features/auth/store/authSlice';
import CoupleDashboard from '@/features/dashboard/pages/CoupleDashboard';
import { translateZodiacSign } from '@/features/horoscope/utils/horoscopeLocalization';
import { computeMissingItems } from '@/features/profile/utils/profileData';
import { useRealtimeUpdates } from '@/shared/hooks/useRealtimeUpdates';

// Design System Constants
const COLORS = {
  primary: '#8B1A2E',
  secondary: '#C9A84C',
  accent: '#1A6B72',
  background: '#FAF7F2',
  white: '#FFFFFF',
  textPrimary: '#1C1C1C',
  textSecondary: '#555555',
};

// --- Helper Components ---

const MotionBox = motion(Box);
const MotionPaper = motion(Paper);

function buildWeeklyActivity(total: number) {
  const labels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const base = Math.max(0, total);
  return labels.map((day, index) => ({
    day,
    views: Math.max(0, Math.round((base * (index + 1)) / labels.length)),
  }));
}

function formatTopMatch(match: any) {
  if (!match) return null;

  return {
    id: match.id || match._id,
    name: match.name,
    age: match.age,
    location: match.location,
    photo: match.img,
    compatibility: match.score,
    scores: {
      astrological: match.compatibility?.astroScore ?? 0,
      personality: match.compatibility?.personalityScore ?? 0,
      lifestyle: match.compatibility?.lifestyleScore ?? 0,
      family: match.compatibility?.familyScore ?? 0,
    },
    band: match.band || 'GOOD',
  };
}

function formatWeddingStatus(project: any, budget: any) {
  const weddingDate = project?.weddingDate ? new Date(project.weddingDate) : null;
  const daysToGo = weddingDate
    ? Math.max(0, Math.ceil((weddingDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
    : 0;

  return {
    daysToGo,
    venue: project?.venueId ? 'Venue selected' : 'Venue not selected yet',
    budget: {
      spent: Number(budget?.totalSpent || 0),
      total: Number(budget?.totalBudget || 0),
    },
    checklist: (project?.checklist || []).slice(0, 3).map((item: any, index: number) => ({
      id: item._id || index + 1,
      task: item.title,
      completed: Boolean(item.completed),
    })),
  };
}

function formatVendors(vendors: any[]) {
  return (vendors || []).slice(0, 3).map((vendor) => ({
    id: vendor._id,
    name: vendor.businessName,
    category: vendor.category,
    rating: Number(vendor.ratings?.average || 0).toFixed(1),
    photo: vendor.portfolioImages?.[0] || '',
  }));
}

function resolveProfilePic(...sources: any[]) {
  for (const source of sources) {
    if (!source) continue;

    if (source.profilePic) {
      return source.profilePic;
    }

    if (Array.isArray(source.photos) && source.photos.length > 0) {
      const mainPhoto = source.photos.find((photo: any) => photo?.isMain)?.url || source.photos[0]?.url;
      if (mainPhoto) {
        return mainPhoto;
      }
    }
  }

  return null;
}

const WidgetHeader = ({ title, action }: { title: string; action?: React.ReactNode }) => (
  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
    <Typography variant="h6" sx={{ fontFamily: 'Playfair Display', fontWeight: 700, color: COLORS.primary }}>
      {title}
    </Typography>
    {action}
  </Box>
);

// --- Sub-Components ---

// Map missing item label → profile tab index and optional section hint
const MISSING_ITEM_NAV: Record<string, { tab: number; path?: string }> = {
  'Add Profile Photo':   { tab: 0 },
  'Add Short Bio':       { tab: 0 },
  'Add Tagline':         { tab: 0 },
  'Add Location':        { tab: 0 },
  'Add Height':          { tab: 0 },
  'Add Ethnicity':       { tab: 0 },
  'Add Date of Birth':   { tab: 1 },
  'Add Birth Place':     { tab: 1 },
  'Generate Horoscope':  { tab: 1, path: '/horoscope' },
  'Add Education':       { tab: 0 },
  'Add Profession':      { tab: 0 },
  'Add Religion':        { tab: 0 },
  'Add Diet':            { tab: 2 },
  'Add Smoking Habit':   { tab: 2 },
  'Add Drinking Habit':  { tab: 2 },
  'Add Languages':       { tab: 0 },
  'Add Hobbies':         { tab: 2 },
  'Verify Email':        { tab: 0 },
  'Verify Phone':        { tab: 0 },
};

const ProfileCompletionRing = ({ percentage, missingItems, onNavigate }: { percentage: number; missingItems: string[]; onNavigate: (tab: number, path?: string) => void }) => {
  const radius = 36;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percentage / 100) * circumference;

  return (
    <MotionPaper
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      sx={{ p: 3, borderRadius: '24px', height: '100%', bgcolor: COLORS.white, boxShadow: '0 2px 16px rgba(139,26,46,0.08)' }}
    >
      <WidgetHeader title="Profile Completion" />
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
        <Box sx={{ position: 'relative', width: 100, height: 100 }}>
          <svg width="100" height="100" style={{ transform: 'rotate(-90deg)' }}>
            <circle cx="50" cy="50" r={radius} fill="none" stroke="#FAF7F2" strokeWidth="8" />
            <motion.circle
              cx="50"
              cy="50"
              r={radius}
              fill="none"
              stroke={COLORS.secondary}
              strokeWidth="8"
              strokeDasharray={circumference}
              initial={{ strokeDashoffset: circumference }}
              animate={{ strokeDashoffset: offset }}
              transition={{ duration: 1.5, ease: "easeOut" }}
            />
          </svg>
          <Box sx={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Typography variant="h5" sx={{ fontWeight: 800, color: COLORS.primary }}>{percentage}%</Typography>
          </Box>
        </Box>
        <Box>
          <Typography variant="body2" sx={{ color: COLORS.textSecondary, mb: 1 }}>
            Complete your profile for better matches
          </Typography>
          <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
            {missingItems.map((item, index) => {
              const nav = MISSING_ITEM_NAV[item];
              return (
                <Chip
                  key={index}
                  label={item}
                  size="small"
                  onClick={() => nav && onNavigate(nav.tab, nav.path)}
                  sx={{
                    bgcolor: 'rgba(139,26,46,0.05)',
                    color: COLORS.primary,
                    fontSize: '0.65rem',
                    fontWeight: 700,
                    cursor: nav ? 'pointer' : 'default',
                    '&:hover': { bgcolor: 'rgba(139,26,46,0.1)' }
                  }}
                />
              );
            })}
          </Stack>
        </Box>
      </Box>
    </MotionPaper>
  );
};

const TopMatchCard = ({ match, loading, onViewMatch, onExpressInterest }: { match: any; loading?: boolean; onViewMatch?: (id: string) => void; onExpressInterest?: (id: string) => Promise<void> }) => {
  const [expressingInterest, setExpressingInterest] = React.useState(false);
  if (loading) {
    return (
      <MotionPaper
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        sx={{ p: 3, borderRadius: '24px', height: '100%', bgcolor: COLORS.white, boxShadow: '0 2px 16px rgba(139,26,46,0.08)' }}
      >
        <WidgetHeader title="Today's Top Match" />
        <Stack spacing={2}>
          <Skeleton variant="rectangular" width="100%" height={140} sx={{ borderRadius: '20px' }} />
          <Skeleton width="60%" />
          <Skeleton width="40%" />
          <Skeleton width="80%" />
        </Stack>
      </MotionPaper>
    );
  }

  if (!match) {
    return (
      <MotionPaper
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        sx={{ p: 3, borderRadius: '24px', height: '100%', bgcolor: COLORS.white, boxShadow: '0 2px 16px rgba(139,26,46,0.08)' }}
      >
        <WidgetHeader title="Today's Top Match" />
        <Typography variant="body2" sx={{ color: COLORS.textSecondary }}>
          No live recommendations are available yet. Complete more profile details and check back after new matches are generated.
        </Typography>
      </MotionPaper>
    );
  }

  return (
    <MotionPaper
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.1 }}
      whileHover={{ y: -4, boxShadow: '0 8px 32px rgba(139,26,46,0.12)' }}
      sx={{ p: 3, borderRadius: '24px', height: '100%', bgcolor: COLORS.white, position: 'relative', overflow: 'hidden' }}
    >
      <Box sx={{ position: 'absolute', top: 16, right: 16 }}>
        <Chip 
          label={match.band} 
          size="small" 
          sx={{ bgcolor: '#E8F5E9', color: '#2E7D32', fontWeight: 800, fontSize: '0.65rem' }} 
        />
      </Box>
      
      <WidgetHeader title="Today's Top Match" />
      
      <Grid container spacing={3} alignItems="center">
        <Grid size={{ xs: 12, sm: 4 }} sx={{ display: 'flex', justifyContent: 'center' }}>
          <Box sx={{ 
            p: 0.5, 
            borderRadius: '50%', 
            background: `linear-gradient(45deg, ${COLORS.primary}, ${COLORS.secondary})` 
          }}>
            <Avatar 
              src={match.photo} 
              sx={{ width: 120, height: 120, border: '4px solid white' }} 
            />
          </Box>
        </Grid>
        
        <Grid size={{ xs: 12, sm: 8 }}>
          <Typography variant="h5" sx={{ fontWeight: 800, color: COLORS.textPrimary }}>
            {match.name}, {match.age}
          </Typography>
          <Typography variant="body2" sx={{ color: COLORS.textSecondary, display: 'flex', alignItems: 'center', gap: 0.5, mb: 2 }}>
            <LocationOn sx={{ fontSize: 16 }} /> {match.location}
          </Typography>
          
          <Box sx={{ mb: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
              <Typography variant="caption" sx={{ fontWeight: 700 }}>Compatibility Score</Typography>
              <Typography variant="caption" sx={{ fontWeight: 800, color: COLORS.accent }}>{match.compatibility}%</Typography>
            </Box>
            <Box sx={{ height: 8, bgcolor: '#F0F0F0', borderRadius: 4, overflow: 'hidden' }}>
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${match.compatibility}%` }}
                transition={{ duration: 1, delay: 0.5 }}
                style={{ height: '100%', backgroundColor: COLORS.accent }}
              />
            </Box>
          </Box>
          
          <Grid container spacing={1}>
            {[
              { label: 'Astrological', icon: '♈', score: match.scores.astrological },
              { label: 'Personality', icon: '🧠', score: match.scores.personality },
              { label: 'Lifestyle', icon: '🌿', score: match.scores.lifestyle },
              { label: 'Family Values', icon: '👨‍👩‍👧', score: match.scores.family }
            ].map((dim, idx) => (
              <Grid size={{ xs: 6 }} key={idx}>
                <Box sx={{ p: 1, bgcolor: COLORS.background, borderRadius: '12px', display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Typography sx={{ fontSize: '1rem' }}>{dim.icon}</Typography>
                  <Box>
                    <Typography variant="caption" sx={{ display: 'block', fontSize: '0.6rem', color: COLORS.textSecondary, lineHeight: 1 }}>{dim.label}</Typography>
                    <Typography variant="caption" sx={{ fontWeight: 800, color: COLORS.primary }}>{dim.score}%</Typography>
                  </Box>
                </Box>
              </Grid>
            ))}
          </Grid>
        </Grid>
      </Grid>
      
      <Stack direction="row" spacing={2} sx={{ mt: 3 }}>
        <Button 
          fullWidth 
          variant="contained"
          onClick={() => match?.id && onViewMatch?.(match.id)}
          sx={{ 
            bgcolor: COLORS.primary, 
            borderRadius: '12px', 
            fontWeight: 700,
            '&:hover': { bgcolor: '#6B1424' }
          }}
        >
          View Match
        </Button>
        <Button 
          fullWidth 
          variant="outlined" 
          startIcon={expressingInterest ? <CircularProgress size={14} color="inherit" /> : <Favorite />}
          disabled={expressingInterest}
          onClick={async () => {
            if (!match?.id || !onExpressInterest) return;
            setExpressingInterest(true);
            try { await onExpressInterest(match.id); } finally { setExpressingInterest(false); }
          }}
          sx={{ 
            borderColor: COLORS.primary, 
            color: COLORS.primary, 
            borderRadius: '12px', 
            fontWeight: 700,
            '&:hover': { borderColor: '#6B1424', bgcolor: 'rgba(139,26,46,0.05)' }
          }}
        >
          Express Interest
        </Button>
      </Stack>
    </MotionPaper>
  );
};

const MatchStats = ({ stats, loading }: { stats: any; loading?: boolean }) => {
  if (loading) {
    return (
      <MotionPaper
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        sx={{ p: 3, borderRadius: '24px', height: '100%', bgcolor: COLORS.white, boxShadow: '0 2px 16px rgba(139,26,46,0.08)' }}
      >
        <WidgetHeader title="Match Stats" />
        <Stack spacing={2}>
          <Skeleton width="40%" />
          <Skeleton width="100%" height={90} sx={{ borderRadius: '20px' }} />
        </Stack>
      </MotionPaper>
    );
  }

  return (
    <MotionPaper
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.2 }}
      sx={{ p: 3, borderRadius: '24px', height: '100%', bgcolor: COLORS.white, boxShadow: '0 2px 16px rgba(139,26,46,0.08)' }}
    >
      <WidgetHeader title="Match Stats" />
      <Grid container spacing={2}>
        {[
          { label: "Today's Matches", value: stats.todayMatches, color: COLORS.primary },
          { label: "Mutual Matches", value: stats.mutualInterests, color: COLORS.secondary },
          { label: "Interests Received", value: stats.interestReceived ?? 0, color: COLORS.accent }
        ].map((stat, idx) => (
          <Grid size={{ xs: 4 }} key={idx} sx={{ textAlign: 'center' }}>
            <motion.div
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.3 + idx * 0.1 }}
            >
              <Typography variant="h4" sx={{ fontWeight: 800, color: stat.color }}>{stat.value}</Typography>
              <Typography variant="caption" sx={{ color: COLORS.textSecondary, fontSize: '0.65rem', display: 'block', lineHeight: 1.2 }}>{stat.label}</Typography>
            </motion.div>
          </Grid>
        ))}
      </Grid>
      
      <Box sx={{ height: 100, mt: 3 }}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={stats.weeklyActivity}>
            <Line 
              type="monotone" 
              dataKey="views" 
              stroke={COLORS.primary} 
              strokeWidth={3} 
              dot={false} 
              animationDuration={2000}
            />
            <RechartsTooltip 
              contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
              labelStyle={{ fontWeight: 700 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </Box>
    </MotionPaper>
  );
};

const VerificationSetupCard = ({
  verification,
  email,
  phone,
  onRequestOtp,
  onOpenVerify,
  busyChannel,
}: {
  verification: any;
  email: string;
  phone?: string;
  onRequestOtp: (channel: 'email' | 'phone') => Promise<void>;
  onOpenVerify: (channel: 'email' | 'phone') => void;
  busyChannel: 'email' | 'phone' | null;
}) => {
  // Show card only if there are unverified channels
  const emailNeedsVerification = !verification?.emailVerified;
  const phoneNeedsVerification = phone && !verification?.phoneVerified;
  
  if (!emailNeedsVerification && !phoneNeedsVerification) {
    return null;
  }

  return (
    <MotionPaper
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.05 }}
      sx={{ p: 3, borderRadius: '24px', bgcolor: COLORS.white, boxShadow: '0 2px 16px rgba(139,26,46,0.08)' }}
    >
      <WidgetHeader title="Complete Account Setup" />
      <Alert severity="warning" sx={{ mb: 2, borderRadius: '12px' }}>
        Your profile is active, but some verification steps are still pending.
      </Alert>
      <Stack spacing={2}>
        <Box sx={{ p: 2, borderRadius: '16px', bgcolor: COLORS.background }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
            <Email sx={{ color: COLORS.primary }} />
            <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
              Email Verification
            </Typography>
            <Chip
              size="small"
              label={verification?.emailVerified ? 'Verified' : 'Pending'}
              sx={{
                ml: 'auto',
                bgcolor: verification?.emailVerified ? '#E8F5E9' : '#FFF3E0',
                color: verification?.emailVerified ? '#2E7D32' : '#B26A00',
                fontWeight: 700,
              }}
            />
          </Box>
          <Typography variant="body2" sx={{ color: COLORS.textSecondary, mb: 1.5 }}>
            {email || 'No email available'}
          </Typography>
          {emailNeedsVerification && (
            <Stack direction="row" spacing={1}>
              <Button
                variant="outlined"
                onClick={() => onRequestOtp('email')}
                disabled={busyChannel === 'email'}
                sx={{ borderRadius: '10px' }}
              >
                {busyChannel === 'email' ? 'Sending...' : 'Send OTP'}
              </Button>
              <Button variant="contained" onClick={() => onOpenVerify('email')} sx={{ borderRadius: '10px', bgcolor: COLORS.primary }}>
                Enter OTP
              </Button>
            </Stack>
          )}
        </Box>

        {phone && (
          <Box sx={{ p: 2, borderRadius: '16px', bgcolor: COLORS.background }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
              <Phone sx={{ color: COLORS.accent }} />
              <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                Phone Verification
              </Typography>
              <Chip
                size="small"
                label={verification?.phoneVerified ? 'Verified' : 'Pending'}
                sx={{
                  ml: 'auto',
                  bgcolor: verification?.phoneVerified ? '#E8F5E9' : '#FFF3E0',
                  color: verification?.phoneVerified ? '#2E7D32' : '#B26A00',
                  fontWeight: 700,
                }}
              />
            </Box>
            <Typography variant="body2" sx={{ color: COLORS.textSecondary, mb: 1.5 }}>
              {phone}
            </Typography>
            {phoneNeedsVerification && (
              <Stack direction="row" spacing={1}>
                <Button
                  variant="outlined"
                  onClick={() => onRequestOtp('phone')}
                  disabled={busyChannel === 'phone'}
                  sx={{ borderRadius: '10px' }}
                >
                  {busyChannel === 'phone' ? 'Sending...' : 'Send OTP'}
                </Button>
                <Button variant="contained" onClick={() => onOpenVerify('phone')} sx={{ borderRadius: '10px', bgcolor: COLORS.primary }}>
                  Enter OTP
                </Button>
              </Stack>
            )}
          </Box>
        )}
      </Stack>
    </MotionPaper>
  );
};

const WeddingProjectStatus = ({ status }: { status: any }) => {
  const totalBudget = Number(status.budget.total || 0);
  const spentBudget = Number(status.budget.spent || 0);
  const budgetProgress = totalBudget > 0 ? (spentBudget / totalBudget) * 100 : 0;

  return (
    <MotionPaper
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.3 }}
      sx={{ p: 3, borderRadius: '24px', height: '100%', bgcolor: COLORS.white, boxShadow: '0 2px 16px rgba(139,26,46,0.08)' }}
    >
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
        <Typography variant="h6" sx={{ fontFamily: 'Playfair Display', fontWeight: 700, color: COLORS.primary }}>
          Wedding Project
        </Typography>
        <Box sx={{ textAlign: 'right' }}>
          <Typography variant="h4" sx={{ fontWeight: 900, color: COLORS.secondary, lineHeight: 1 }}>
            {status.daysToGo}
          </Typography>
          <Typography variant="caption" sx={{ fontWeight: 700, color: COLORS.textSecondary }}>Days to Go</Typography>
        </Box>
      </Box>
      
      <Stack spacing={2}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <LocationOn sx={{ color: COLORS.accent, fontSize: 20 }} />
          <Typography variant="body2" sx={{ fontWeight: 600 }}>{status.venue}</Typography>
        </Box>
        
        <Box>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
            <Typography variant="caption" sx={{ color: COLORS.textSecondary }}>Budget Utilization</Typography>
            <Typography variant="caption" sx={{ fontWeight: 700 }}>LKR {spentBudget.toLocaleString()} / {totalBudget.toLocaleString()}</Typography>
          </Box>
          <LinearProgress 
            variant="determinate" 
            value={budgetProgress}
            sx={{ 
              height: 8, 
              borderRadius: 4, 
              bgcolor: '#F0F0F0',
              '& .MuiLinearProgress-bar': { bgcolor: COLORS.secondary }
            }} 
          />
        </Box>
        
        <Box>
          <Typography variant="caption" sx={{ fontWeight: 700, display: 'block', mb: 1 }}>Next Steps</Typography>
          <Stack spacing={1}>
            {status.checklist.length > 0 ? status.checklist.map((item: any) => (
              <Box key={item.id} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                {item.completed ? 
                  <CheckCircleOutline sx={{ color: COLORS.accent, fontSize: 18 }} /> : 
                  <RadioButtonUnchecked sx={{ color: COLORS.textSecondary, fontSize: 18 }} />
                }
                <Typography variant="body2" sx={{ 
                  color: item.completed ? COLORS.textSecondary : COLORS.textPrimary,
                  textDecoration: item.completed ? 'line-through' : 'none'
                }}>
                  {item.task}
                </Typography>
              </Box>
            )) : (
              <Typography variant="body2" sx={{ color: COLORS.textSecondary }}>
                No wedding tasks yet. Add your first task in the wedding dashboard.
              </Typography>
            )}
          </Stack>
        </Box>
        
        <Button 
          variant="text" 
          endIcon={<ArrowForward />} 
          sx={{ color: COLORS.primary, fontWeight: 700, alignSelf: 'flex-start', p: 0 }}
        >
          Go to Wedding Dashboard
        </Button>
      </Stack>
    </MotionPaper>
  );
};

const VendorRecommendations = ({ vendors, loading }: { vendors: any[]; loading?: boolean }) => {
  if (loading) {
    return (
      <MotionPaper
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.5 }}
        sx={{ p: 3, borderRadius: '24px', height: '100%', bgcolor: COLORS.white, boxShadow: '0 2px 16px rgba(139,26,46,0.08)' }}
      >
        <WidgetHeader title="Recommended Vendors" />
        <Stack spacing={2}>
          <Skeleton width="50%" />
          {[...Array(3)].map((_, index) => (
            <Box key={index} sx={{ display: 'flex', alignItems: 'center', gap: 2, p: 1.5, borderRadius: '16px', border: '1px solid #F0F0F0' }}>
              <Skeleton variant="circular" width={50} height={50} />
              <Box sx={{ flex: 1 }}>
                <Skeleton width="60%" />
                <Skeleton width="40%" />
              </Box>
            </Box>
          ))}
        </Stack>
      </MotionPaper>
    );
  }

  return (
    <MotionPaper
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.5 }}
      sx={{ p: 3, borderRadius: '24px', height: '100%', bgcolor: COLORS.white, boxShadow: '0 2px 16px rgba(139,26,46,0.08)' }}
    >
      <WidgetHeader title="Recommended Vendors" />
      <Stack spacing={2}>
        {vendors.length > 0 ? vendors.map((vendor) => (
          <Box key={vendor.id} sx={{ display: 'flex', alignItems: 'center', gap: 2, p: 1.5, borderRadius: '16px', border: '1px solid #F0F0F0', '&:hover': { bgcolor: COLORS.background } }}>
            <Avatar src={vendor.photo} variant="rounded" sx={{ width: 50, height: 50 }} />
            <Box sx={{ flex: 1 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 700, lineHeight: 1.2 }}>{vendor.name}</Typography>
              <Typography variant="caption" sx={{ color: COLORS.textSecondary }}>{vendor.category}</Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <Typography variant="caption" sx={{ fontWeight: 800, color: COLORS.secondary }}>{vendor.rating}</Typography>
                <Box sx={{ display: 'flex' }}>
                  {[1, 2, 3, 4, 5].map((s) => (
                    <Typography key={s} sx={{ fontSize: '0.6rem', color: COLORS.secondary }}>★</Typography>
                  ))}
                </Box>
              </Box>
            </Box>
            <IconButton size="small"><ArrowForward sx={{ fontSize: 16 }} /></IconButton>
          </Box>
        )) : (
          <Typography variant="body2" sx={{ color: COLORS.textSecondary }}>
            No verified vendors available right now.
          </Typography>
        )}
        <Button 
          variant="text" 
          endIcon={<ArrowForward />} 
          sx={{ color: COLORS.primary, fontWeight: 700, alignSelf: 'center', mt: 1 }}
        >
          View All Vendors
        </Button>
      </Stack>
    </MotionPaper>
  );
};

const HoneymoonWidget = () => {
  const navigate = useNavigate();
  return (
    <MotionPaper
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.6 }}
      whileHover={{ y: -4, boxShadow: '0 8px 32px rgba(26,107,114,0.12)' }}
      sx={{ p: 3, borderRadius: '24px', height: '100%', bgcolor: COLORS.white, border: `1px solid ${alpha(COLORS.accent, 0.1)}` }}
    >
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6" sx={{ fontFamily: 'Playfair Display', fontWeight: 700, color: COLORS.accent }}>
          Honeymoon Planning
        </Typography>
        <MapIcon sx={{ color: COLORS.accent, opacity: 0.5 }} />
      </Box>
      
      <Box sx={{ position: 'relative', height: 140, borderRadius: '16px', overflow: 'hidden', mb: 2 }}>
        <img 
          src="https://picsum.photos/seed/maldives/400/200" 
          alt="Honeymoon" 
          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          referrerPolicy="no-referrer"
        />
        <Box sx={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.6), transparent)', display: 'flex', alignItems: 'flex-end', p: 2 }}>
          <Typography variant="subtitle2" sx={{ color: 'white', fontWeight: 700 }}>
            Discover Romantic Getaways
          </Typography>
        </Box>
      </Box>
      
      <Typography variant="body2" sx={{ color: COLORS.textSecondary, mb: 3 }}>
        Let our AI find the perfect destination based on your preferences.
      </Typography>
      
      <Button 
        fullWidth 
        variant="contained"
        onClick={() => navigate('/honeymoon')}
        startIcon={<FlightTakeoff />}
        sx={{ 
          bgcolor: COLORS.accent, 
          borderRadius: '12px', 
          fontWeight: 700,
          '&:hover': { bgcolor: '#14565C' }
        }}
      >
        Explore Destinations
      </Button>
    </MotionPaper>
  );
};

// --- Main Component ---

export default function UserDashboard() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const { user } = useSelector((state: RootState) => state.auth);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  if (user?.profileType === 'couple') {
    return <CoupleDashboard />;
  }
  
  const [loading, setLoading] = useState(true);
  const [widgetLoading, setWidgetLoading] = useState(true);
  // Verification state — starts unverified (show banner) and is updated solely
  // by its own dedicated effect. Never overwritten by main data loading.
  const [verificationLoaded, setVerificationLoaded] = useState(false);
  const [verificationStatus, setVerificationStatus] = useState({
    emailVerified: false,
    phoneVerified: false,
    email: user?.email || '',
    phone: user?.phone || '',
  });
  const [mutualMatches, setMutualMatches] = useState<any[]>([]);
  const [mutualMatchesLoading, setMutualMatchesLoading] = useState(true);
  const [removingMatchId, setRemovingMatchId] = useState<string | null>(null);
  const [removeConfirm, setRemoveConfirm] = useState<{ matchId: string; matchName: string; hasWedding: boolean } | null>(null);
  const [pendingSent, setPendingSent] = useState<any[]>([]);
  const [pendingReceived, setPendingReceived] = useState<any[]>([]);
  const [selectedInterestId, setSelectedInterestId] = useState<string | null>(null);
  const [selectedInterestImg, setSelectedInterestImg] = useState<string | null>(null);
  const [interestDetailOpen, setInterestDetailOpen] = useState(false);
  const [pendingLoading, setPendingLoading] = useState(true);
  const [data, setData] = useState<any>(() => {
    const userData = user || JSON.parse(localStorage.getItem('user') || 'null') || {};
    return {
      summary: {
        name: userData.firstName || userData.name || 'User',
        nakshatra: 'Pending',
        gana: 'Pending',
        ascendant: 'Pending',
        auspiciousTime: 'Calculating...',
        profileCompletion: 75,
        missingItems: ['Add Profile Photo', 'Complete Personality Quiz'],
        matchStats: {
          todayMatches: 0,
          mutualInterests: 0,
          profileViews: 0,
          weeklyActivity: buildWeeklyActivity(0),
        },
      },
      profilePic: resolveProfilePic(userData),
      email: userData.email || '',
      phone: userData.phone || '',
      todayMatch: null,
      weddingStatus: formatWeddingStatus(null, null),
      chatbot: {
        lastMessage: 'Your horoscope matching for the new profile is ready!',
        online: true,
      },
      vendors: [],
      // Start null – the profile API fetch is the authoritative source.
      // Using userData.verification here would surface a stale cached value.
      verification: null,
      notifications: [
        { id: 1, text: 'Dashboard is updating your recommendations…', time: 'now', read: false },
      ],
    };
  });
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [verifyDialog, setVerifyDialog] = useState<{ open: boolean; channel: 'email' | 'phone' | null }>({
    open: false,
    channel: null,
  });
  const [otpValue, setOtpValue] = useState('');
  const [busyChannel, setBusyChannel] = useState<'email' | 'phone' | null>(null);
  const [verifying, setVerifying] = useState(false);
  const [liveTime, setLiveTime] = useState(new Date());
  const liveProfilePic = resolveProfilePic(user, data);

  useEffect(() => {
    const timer = setInterval(() => setLiveTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // ── Lightweight refresh fns (for real-time events) ──────────────────────
  const refreshMutualMatches = useCallback(async () => {
    try {
      const res = await axiosInstance.get('/matches/mutual');
      setMutualMatches(res.data?.data?.items || []);
    } catch { /* silent */ }
  }, []);

  const refreshPendingInterests = useCallback(async () => {
    try {
      const res = await axiosInstance.get('/matches/pending');
      setPendingSent(res.data?.data?.sent || []);
      setPendingReceived(res.data?.data?.received || []);
    } catch { /* silent */ }
  }, []);

  // ── Real-time socket events ──────────────────────────────────────────────
  useRealtimeUpdates({
    onInterestReceived: (data) => {
      if (data.senderCard) {
        setPendingReceived((p) => {
          if (p.some((m) => m.id === data.senderCard.id)) return p;
          return [data.senderCard, ...p];
        });
      } else {
        refreshPendingInterests();
      }
    },
    onMutualMatch: (data) => {
      // Clear from both directions — could be in pendingSent or pendingReceived
      setPendingSent((p) => p.filter((m) => m.id !== data.fromUserId));
      setPendingReceived((p) => p.filter((m) => m.id !== data.fromUserId));
      refreshMutualMatches();
    },
    onMatchRemoved: (data) => {
      // Remove from pending lists immediately — they withdrew their interest
      setPendingReceived((p) => p.filter((m) => m.id !== data.byUserId));
      setPendingSent((p) => p.filter((m) => m.id !== data.byUserId));
      refreshMutualMatches();
    },
    onInterestAccepted: (data) => {
      setPendingSent((p) => p.filter((m) => m.id !== data.fromUserId));
      dispatch(showToast({ type: 'success', message: `${data.fromUserName} accepted your interest! 🎉` }));
      refreshMutualMatches();
    },
    onInterestDeclined: (data) => {
      setPendingSent((p) => p.filter((m) => m.id !== data.fromUserId));
      dispatch(showToast({ type: 'info', message: `${data.fromUserName} has declined your interest.` }));
    },
  });

  useEffect(() => {
    let mounted = true;

    const fetchProfile = async () => {
      try {
        const [profileResult, chartResult] = await Promise.allSettled([
          userService.getProfile({ includeMedia: false }),
          axiosInstance.get('/horoscope/my-chart'),
        ]);

        if (!mounted) return;

        const profile = profileResult.status === 'fulfilled' ? profileResult.value : null;
        const chartSummary =
          chartResult.status === 'fulfilled'
            ? chartResult.value.data?.data?.summary || chartResult.value.data?.summary || null
            : null;
        const nextProfilePic = resolveProfilePic(profile, user);

        setData((prev: any) => ({
          ...prev,
          summary: {
            ...prev.summary,
            name: user?.firstName || profile?.name || 'User',
            nakshatra: chartSummary?.nakshatra || profile?.astrology?.nakshatra || 'Pending',
            gana: chartSummary?.gana || profile?.astrology?.gana || prev.summary.gana || 'Pending',
            ascendant: chartSummary?.ascendant || profile?.astrology?.ascendant || prev.summary.ascendant || 'Pending',
            auspiciousTime: chartSummary?.auspiciousTime || prev.summary.auspiciousTime || 'Calculating...',
            profileCompletion: profile?.completion || prev.summary.profileCompletion,
            missingItems: profile
              ? computeMissingItems({ ...profile, profilePic: nextProfilePic || profile?.profilePic })
              : prev.summary.missingItems,
          },
          profilePic: nextProfilePic || prev.profilePic || null,
          email: user?.email || profile?.email || '',
          phone: user?.phone || profile?.personalInfo?.phone || '',
          verification: profile?.verification || prev.verification,
        }));

        // Set verification status from the profile already fetched
        if (profile?.verification !== undefined) {
          const v = profile.verification;
          setVerificationStatus({
            emailVerified: Boolean(v?.emailVerified),
            phoneVerified: Boolean(v?.phoneVerified),
            email: v?.email || user?.email || '',
            phone: v?.phone || profile?.personalInfo?.phone || user?.phone || '',
          });
        }
      } catch (error) {
        console.error('Error fetching dashboard profile', error);
      }
    };

    // Phase 2: mutual matches + pending interests — fast DB queries, unblocks the interest rows quickly
    const fetchInterests = async () => {
      try {
        const [mutualRes, pendingRes] = await Promise.allSettled([
          axiosInstance.get('/matches/mutual'),
          axiosInstance.get('/matches/pending'),
        ]);
        if (!mounted) return;
        if (mutualRes.status === 'fulfilled')
          setMutualMatches(mutualRes.value.data?.data?.items || []);
        if (pendingRes.status === 'fulfilled') {
          const sent = pendingRes.value.data?.data?.sent || [];
          const received = pendingRes.value.data?.data?.received || [];
          setPendingSent(sent);
          setPendingReceived(received);
          setData((prev: any) => ({
            ...prev,
            summary: {
              ...prev.summary,
              matchStats: {
                ...prev.summary.matchStats,
                mutualInterests: mutualRes.status === 'fulfilled'
                  ? (mutualRes.value.data?.data?.items || []).length
                  : prev.summary.matchStats.mutualInterests,
                interestReceived: received.length,
              },
            },
          }));
        }
      } catch { /* silent */ } finally {
        if (mounted) {
          setMutualMatchesLoading(false);
          setPendingLoading(false);
        }
      }
    };

    // Phase 3: heavier secondary widgets (recommendations involve Python computation)
    const fetchWidgets = async () => {
      try {
        const [recommendationsResponse, weddingProjectResponse, budgetResponse, vendorsResponse] =
          await Promise.allSettled([
            axiosInstance.get('/matches/recommendations', { params: { pageSize: 4, fast: true } }),
            axiosInstance.get('/wedding/project'),
            axiosInstance.get('/wedding/budget'),
            axiosInstance.get('/wedding/vendors'),
          ]);

        if (!mounted) return;

        const recommendationItems =
          recommendationsResponse.status === 'fulfilled'
            ? recommendationsResponse.value.data?.data?.items || []
            : [];
        const topMatch = formatTopMatch(recommendationItems[0]);
        const mutualInterests = recommendationItems.filter((item: any) => item.mutualMatch).length;

        const weddingProject =
          weddingProjectResponse.status === 'fulfilled'
            ? weddingProjectResponse.value.data?.data
            : null;
        const budget =
          budgetResponse.status === 'fulfilled'
            ? budgetResponse.value.data?.data
            : null;

        const vendorItems =
          vendorsResponse.status === 'fulfilled'
            ? vendorsResponse.value.data?.data?.items || []
            : [];

        setData((prev: any) => ({
          ...prev,
          todayMatch: topMatch,
          weddingStatus: formatWeddingStatus(weddingProject, budget),
          vendors: formatVendors(vendorItems),
          summary: {
            ...prev.summary,
            matchStats: {
              todayMatches: recommendationItems.length,
              mutualInterests: prev.summary.matchStats.mutualInterests,
              interestReceived: prev.summary.matchStats.interestReceived ?? 0,
              weeklyActivity: buildWeeklyActivity(recommendationItems.length),
            },
          },
          notifications: [
            { id: 1, text: 'Dashboard synced with your live profile', time: 'now', read: false },
          ],
        }));
      } catch (error) {
        console.error('Error fetching dashboard widgets', error);
      } finally {
        if (mounted) setWidgetLoading(false);
      }
    };

    // profile unblocks the page; interests + widgets load concurrently in background
    fetchProfile().finally(() => {
      if (mounted) {
        setLoading(false);
        setVerificationLoaded(true);
      }
    });
    void fetchInterests();
    void fetchWidgets();

    return () => {
      mounted = false;
    };
  }, [dispatch]);

  // Update profile picture when user state changes
  useEffect(() => {
    setData((prev: any) => ({
      ...prev,
      profilePic: liveProfilePic || prev.profilePic,
    }));
  }, [liveProfilePic]);

  // Update other user data when user state changes
  useEffect(() => {
    if (user) {
      // Recompute missing items from the updated Redux user state (e.g. after saving profile)
      // only when the user object carries a full profile (indicated by a tagline or bio field).
      const hasProfileData = user.tagline !== undefined || user.bio !== undefined;
      const updatedMissingItems = hasProfileData ? computeMissingItems(user) : null;

      setData((prev: any) => ({
        ...prev,
        summary: {
          ...prev.summary,
          name: user.firstName || user.name || prev.summary.name,
          ...(updatedMissingItems !== null && { missingItems: updatedMissingItems }),
          ...(user.completion !== undefined && { profileCompletion: user.completion }),
        },
        email: user.email || prev.email,
        phone: user.phone || prev.phone,
        // Do NOT overwrite verification here – the profile API fetch returns the
        // authoritative value straight from the DB. Using the Redux user object
        // (populated at login time) would silently restore a stale emailVerified:true
        // value every time the component re-renders.
      }));
    }
  }, [user]);

  const handleRemoveMatch = async (matchId: string) => {
    const match = mutualMatches.find((m) => m.id === matchId);
    const matchName = match?.name || 'this person';
    // Check if they share an active wedding project
    let hasWedding = false;
    try {
      const proj = await weddingService.getProject();
      const couple: any[] = proj?.data?.coupleUserIds || [];
      // Only warn if it's a genuine shared project (2+ users) AND the match is one of them
      if (couple.length >= 2) {
        hasWedding = couple.some((u: any) => (typeof u === 'object' ? String(u._id) : String(u)) === matchId);
      }
    } catch { /* ignore */ }
    setRemoveConfirm({ matchId, matchName, hasWedding });
  };

  const confirmRemoveMatch = async () => {
    if (!removeConfirm) return;
    const { matchId } = removeConfirm;
    setRemoveConfirm(null);
    setRemovingMatchId(matchId);
    try {
      await matchService.undoInterest(matchId);
      setMutualMatches((prev) => prev.filter((m) => m.id !== matchId));
      dispatch(showToast({ type: 'success', message: 'Match removed.' }));
    } catch (err: any) {
      dispatch(showToast({ type: 'error', message: err.response?.data?.message || 'Failed to remove match.' }));
    } finally {
      setRemovingMatchId(null);
    }
  };

  const handleRequestVerificationOtp = async (channel: 'email' | 'phone') => {
    try {
      setBusyChannel(channel);
      const response = await userService.requestVerificationOtp(channel);
      dispatch(
        showToast({
          type: 'success',
          message: response.devOtp
            ? `OTP sent. Development OTP: ${response.devOtp}`
            : response.message || 'Verification OTP sent successfully.',
        })
      );
    } catch (error: any) {
      dispatch(showToast({ type: 'error', message: error.response?.data?.message || 'Failed to send OTP.' }));
    } finally {
      setBusyChannel(null);
    }
  };

  const handleConfirmVerification = async () => {
    if (!verifyDialog.channel) return;
    if (otpValue.trim().length !== 6) {
      dispatch(showToast({ type: 'error', message: 'Enter a valid 6-digit OTP.' }));
      return;
    }

    try {
      setVerifying(true);
      const response = await userService.confirmVerificationOtp({
        channel: verifyDialog.channel,
        otp: otpValue.trim(),
      });

      setData((prev: any) => ({
        ...prev,
        verification: {
          ...prev.verification,
          ...response.verification,
        },
        summary: {
          ...prev.summary,
          missingItems: (prev.summary?.missingItems || []).filter(
            (item: string) =>
              item !== (verifyDialog.channel === 'email' ? 'Verify Email' : 'Verify Phone')
          ),
        },
      }));

      // Keep dedicated verificationStatus in sync
      setVerificationStatus((prev) => prev ? { ...prev, ...response.verification } : response.verification);

      dispatch(
        updateUser({
          verification: {
            ...(user?.verification || {}),
            ...response.verification,
          },
        })
      );
      dispatch(showToast({ type: 'success', message: response.message || 'Verification completed.' }));
      setVerifyDialog({ open: false, channel: null });
      setOtpValue('');
    } catch (error: any) {
      dispatch(showToast({ type: 'error', message: error.response?.data?.message || 'Failed to verify OTP.' }));
    } finally {
      setVerifying(false);
    }
  };

  const getGregorianDate = () => {
    const options: Intl.DateTimeFormatOptions = { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' };
    return liveTime.toLocaleDateString('en-US', options);
  };

  const getGreeting = () => {
    const hour = liveTime.getHours();
    if (hour >= 5 && hour < 12) return 'Good morning';
    if (hour >= 12 && hour < 17) return 'Good afternoon';
    if (hour >= 17 && hour < 21) return 'Good evening';
    return 'Good night';
  };

  const getLiveTimeString = () => {
    return liveTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true });
  };

  if (loading) {
    return (
      <Box sx={{ p: { xs: 2, md: 4 }, bgcolor: COLORS.background, minHeight: '100vh' }}>
        {/* Show verification banner during loading only if we already know status */}
        {verificationLoaded && (!verificationStatus.emailVerified || !verificationStatus.phoneVerified) && (
          <Box sx={{ mb: 3 }}>
            <VerificationSetupCard
              verification={verificationStatus}
              email={verificationStatus.email || user?.email || ''}
              phone={verificationStatus.phone || user?.phone || ''}
              onRequestOtp={handleRequestVerificationOtp}
              onOpenVerify={(channel) => {
                setVerifyDialog({ open: true, channel });
                setOtpValue('');
              }}
              busyChannel={busyChannel}
            />
          </Box>
        )}
        <Skeleton variant="text" width={300} height={60} sx={{ mb: 4 }} />
        <DashboardSkeleton />
      </Box>
    );
  }

  return (
    <Box sx={{ p: { xs: 2, md: 4 }, bgcolor: COLORS.background, minHeight: '100vh', position: 'relative' }}>
      {/* Header Section */}
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: { xs: 1, md: 3 }, flexWrap: 'wrap' }}>
        <Avatar
          src={liveProfilePic || undefined}
          alt={data.summary.name}
          sx={{ width: 64, height: 64, border: `3px solid ${alpha(COLORS.secondary, 0.5)}`, boxShadow: '0 8px 24px rgba(139,26,46,0.12)', flexShrink: 0, bgcolor: alpha(COLORS.secondary, 0.16), color: COLORS.primary, fontWeight: 700 }}
        >
          {data.summary.name?.charAt(0) || 'U'}
        </Avatar>
        <MotionBox
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8 }}
          sx={{ display: 'flex', flexDirection: 'column', gap: 1, flex: 1, minWidth: 0 }}
        >
          <Typography variant="h4" sx={{ fontFamily: 'Playfair Display', fontWeight: 700, color: COLORS.primary, wordWrap: 'break-word', overflowWrap: 'break-word', whiteSpace: 'normal' }}>
            {getGreeting()}, {data.summary.name} ✨
          </Typography>
          <Stack direction="row" spacing={1} alignItems="center" sx={{ flexWrap: 'wrap', gap: 1 }}>
            <Typography variant="body2" sx={{ color: COLORS.textSecondary, fontSize: '0.875rem', whiteSpace: 'nowrap' }}>
              {getGregorianDate()} ·{' '}
              <Box component="span" sx={{ fontFamily: 'monospace', fontVariantNumeric: 'tabular-nums', display: 'inline-block', minWidth: '7.5ch' }}>
                {getLiveTimeString()}
              </Box>{' '}|
            </Typography>
            <Chip label={`${data.summary.nakshatra} Nakshatra`} size="small" sx={{ bgcolor: COLORS.secondary, color: COLORS.primary, fontWeight: 700, height: 24 }} />
            <Chip
              label={`Gana: ${data.summary.gana}`}
              size="small"
              sx={{ bgcolor: alpha(COLORS.accent, 0.12), color: COLORS.accent, fontWeight: 800, height: 24 }}
            />
            <Chip
              label={`ලග්නය (Ascendant): ${
                data.summary.ascendant && data.summary.ascendant !== 'Pending'
                  ? `${translateZodiacSign(data.summary.ascendant, 'si')} (${data.summary.ascendant})`
                  : 'බලාපොරොත්තු වේ (Pending)'
              }`}
              size="small"
              sx={{
                bgcolor: alpha(COLORS.primary, 0.08),
                color: COLORS.primary,
                fontWeight: 800,
                height: 26,
                '& .MuiChip-label': {
                  fontFamily: '"Noto Sans Sinhala", "Iskoola Pota", "Segoe UI", sans-serif',
                },
              }}
            />
          </Stack>
          <Typography variant="caption" sx={{ color: COLORS.accent, fontWeight: 700 }}>
            Your auspicious time today: {data.summary.auspiciousTime}
          </Typography>
        </MotionBox>
        
        <IconButton 
          onClick={() => setDrawerOpen(true)}
          sx={{ bgcolor: COLORS.white, boxShadow: '0 4px 12px rgba(0,0,0,0.05)', flexShrink: 0 }}
        >
          <Badge badgeContent={data.notifications.filter((n: any) => !n.read).length} color="error">
            <Notifications sx={{ color: COLORS.primary }} />
          </Badge>
        </IconButton>
      </Box>

      {/* Grid Layout */}
      <Grid container spacing={3}>
        {verificationLoaded && (!verificationStatus.emailVerified || !verificationStatus.phoneVerified) && (
          <Grid size={{ xs: 12 }}>
            <VerificationSetupCard
              verification={verificationStatus}
              email={verificationStatus.email || data.email}
              phone={verificationStatus.phone || data.phone}
              onRequestOtp={handleRequestVerificationOtp}
              onOpenVerify={(channel) => {
                setVerifyDialog({ open: true, channel });
                setOtpValue('');
              }}
              busyChannel={busyChannel}
            />
          </Grid>
        )}
        {/* Row 1 */}
        <Grid size={{ xs: 12, md: 4 }}>
          <ProfileCompletionRing
            percentage={data.summary.profileCompletion}
            missingItems={data.summary.missingItems}
            onNavigate={(tab, path) => path ? navigate(path) : navigate(`/profile?tab=${tab}&edit=true`)}
          />
        </Grid>
        <Grid size={{ xs: 12, md: 4 }}>
          <TopMatchCard
            match={data.todayMatch}
            loading={widgetLoading}
            onViewMatch={(id) => navigate(`/matches?view=${id}`)}
            onExpressInterest={async (id) => {
              try {
                await matchService.expressInterest(id);
                dispatch(showToast({ type: 'success', message: 'Interest expressed! 💌' }));
                void refreshPendingInterests();
              } catch (err: any) {
                dispatch(showToast({ type: 'error', message: err.response?.data?.message || 'Failed to express interest.' }));
              }
            }}
          />
        </Grid>
        <Grid size={{ xs: 12, md: 4 }}>
          <MatchStats stats={data.summary.matchStats} loading={widgetLoading} />
        </Grid>

        {/* Row 2 */}
        <Grid size={{ xs: 12, md: 4 }}>
          <WeddingProjectStatus status={data.weddingStatus} />
        </Grid>
        <Grid size={{ xs: 12, md: 4 }}>
          <HoneymoonWidget />
        </Grid>
        <Grid size={{ xs: 12, md: 4 }}>
          <VendorRecommendations vendors={data.vendors} loading={widgetLoading} />
        </Grid>

        {/* Mutual Matches — shown above account setup */}
        {(mutualMatchesLoading || mutualMatches.length > 0) && (
          <Grid size={{ xs: 12 }} sx={{ order: -2 }}>
            <Box
              sx={{
                bgcolor: COLORS.white,
                borderRadius: '24px',
                p: { xs: 2.5, md: 3 },
                border: `1.5px solid rgba(201,168,76,0.35)`,
                boxShadow: '0 4px 24px rgba(139,26,46,0.06)',
              }}
            >
              {/* Header */}
              <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 2.5 }}>
                <Stack direction="row" alignItems="center" spacing={1.5}>
                  <Box
                    sx={{
                      width: 32, height: 32, borderRadius: '50%',
                      background: `linear-gradient(135deg, ${COLORS.primary} 0%, ${COLORS.secondary} 100%)`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}
                  >
                    <Favorite sx={{ fontSize: 16, color: '#fff' }} />
                  </Box>
                  <Typography sx={{ fontFamily: 'Playfair Display', fontWeight: 700, color: COLORS.primary, fontSize: '1.1rem' }}>
                    Mutual Matches
                  </Typography>
                  {!mutualMatchesLoading && mutualMatches.length > 0 && (
                    <Chip
                      label={mutualMatches.length}
                      size="small"
                      sx={{ bgcolor: COLORS.primary, color: '#fff', fontWeight: 700, height: 20, '& .MuiChip-label': { px: 1 } }}
                    />
                  )}
                </Stack>
                <Button
                  size="small"
                  endIcon={<ArrowForward sx={{ fontSize: 16 }} />}
                  onClick={() => navigate('/matches')}
                  sx={{ color: COLORS.primary, fontWeight: 700, textTransform: 'none', fontSize: '0.8rem' }}
                >
                  View All
                </Button>
              </Stack>

              {mutualMatchesLoading ? (
                <Stack direction="row" spacing={2} sx={{ overflowX: 'auto', pb: 1 }}>
                  {[...Array(4)].map((_, i) => (
                    <Box key={i} sx={{ minWidth: 200, flexShrink: 0 }}>
                      <Skeleton variant="rectangular" height={130} sx={{ borderRadius: 3 }} />
                    </Box>
                  ))}
                </Stack>
              ) : (
                <Stack direction="row" spacing={2} sx={{ overflowX: 'auto', pb: 1, scrollbarWidth: 'thin' }}>
                  {mutualMatches.map((match, idx) => {
                    const initials = match.initials || match.name?.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2) || '??';
                    const isRemoving = removingMatchId === match.id;
                    return (
                      <motion.div
                        key={match.id}
                        initial={{ opacity: 0, scale: 0.92 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.88 }}
                        transition={{ duration: 0.3, delay: idx * 0.06 }}
                        style={{ flexShrink: 0 }}
                      >
                        <Box
                          sx={{
                            minWidth: 200,
                            bgcolor: COLORS.background,
                            borderRadius: 4,
                            border: `1px solid rgba(201,168,76,0.25)`,
                            p: 2,
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            gap: 1,
                            position: 'relative',
                            transition: 'box-shadow 0.2s',
                            '&:hover': { boxShadow: '0 4px 16px rgba(139,26,46,0.12)' },
                          }}
                        >
                          {/* Compatibility badge */}
                          <Box
                            sx={{
                              position: 'absolute', top: 10, right: 10,
                              bgcolor: COLORS.primary, color: '#fff',
                              borderRadius: 2, px: 1, py: 0.3,
                              fontSize: '0.65rem', fontWeight: 700, lineHeight: 1.4,
                            }}
                          >
                            {match.score ?? '—'}%
                          </Box>

                          <Avatar
                            src={match.img || undefined}
                            sx={{
                              width: 56, height: 56,
                              background: `linear-gradient(135deg, ${COLORS.primary}, ${COLORS.secondary})`,
                              fontWeight: 700, color: '#fff', fontSize: '1.1rem',
                              border: `2px solid rgba(201,168,76,0.4)`,
                            }}
                          >
                            {initials}
                          </Avatar>
                          <Typography sx={{ fontWeight: 700, color: COLORS.textPrimary, fontSize: '0.9rem', textAlign: 'center', lineHeight: 1.2 }} noWrap>
                            {match.name}{match.age ? `, ${match.age}` : ''}
                          </Typography>
                          {match.location && (
                            <Stack direction="row" spacing={0.4} alignItems="center">
                              <LocationOn sx={{ fontSize: 12, color: '#999' }} />
                              <Typography variant="caption" sx={{ color: '#888' }} noWrap>{match.location}</Typography>
                            </Stack>
                          )}

                          <Stack direction="row" spacing={1} sx={{ mt: 0.5, width: '100%' }}>
                            <Tooltip title="Send a message">
                              <IconButton
                                size="small"
                                onClick={() => navigate('/messages', {
                                  state: {
                                    conversationId: match.conversationId || undefined,
                                    openUserId: match.id,
                                    openUserName: match.name,
                                  }
                                })}
                                sx={{
                                  flex: 1, borderRadius: 2,
                                  bgcolor: COLORS.primary, color: '#fff',
                                  '&:hover': { bgcolor: '#6e1526' },
                                }}
                              >
                                <MessageCircle size={15} />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Remove match">
                              <IconButton
                                size="small"
                                disabled={isRemoving}
                                onClick={() => handleRemoveMatch(match.id)}
                                sx={{
                                  flex: 1, borderRadius: 2,
                                  border: `1px solid rgba(211,47,47,0.5)`,
                                  color: '#d32f2f',
                                  '&:hover': { bgcolor: 'rgba(211,47,47,0.08)' },
                                }}
                              >
                                {isRemoving ? <Skeleton variant="circular" width={15} height={15} /> : <UserMinus size={15} />}
                              </IconButton>
                            </Tooltip>
                          </Stack>
                        </Box>
                      </motion.div>
                    );
                  })}
                </Stack>
              )}
            </Box>
          </Grid>
        )}

        {/* Pending Interests — shown above account setup */}
        {(pendingLoading || pendingSent.length > 0 || pendingReceived.length > 0) && (
          <Grid size={{ xs: 12 }} sx={{ order: -1 }}>
            <Box
              sx={{
                bgcolor: COLORS.white, borderRadius: '24px',
                p: { xs: 2.5, md: 3 },
                border: '1.5px solid rgba(26,107,114,0.2)',
                boxShadow: '0 4px 24px rgba(26,107,114,0.06)',
              }}
            >
              {/* Header */}
              <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 2.5 }}>
                <Stack direction="row" alignItems="center" spacing={1.5}>
                  <Box
                    sx={{
                      width: 32, height: 32, borderRadius: '50%',
                      background: 'linear-gradient(135deg, #1A6B72 0%, #C9A84C 100%)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}
                  >
                    <Send size={15} color="#fff" />
                  </Box>
                  <Typography sx={{ fontFamily: 'Playfair Display', fontWeight: 700, color: '#1A6B72', fontSize: '1.1rem' }}>
                    Pending Interests
                  </Typography>
                  {!pendingLoading && (pendingSent.length + pendingReceived.length) > 0 && (
                    <Chip
                      label={pendingSent.length + pendingReceived.length}
                      size="small"
                      sx={{ bgcolor: '#1A6B72', color: '#fff', fontWeight: 700, height: 20, '& .MuiChip-label': { px: 1 } }}
                    />
                  )}
                </Stack>
                <Button
                  size="small"
                  endIcon={<ArrowForward sx={{ fontSize: 16 }} />}
                  onClick={() => navigate('/matches')}
                  sx={{ color: '#1A6B72', fontWeight: 700, textTransform: 'none', fontSize: '0.8rem' }}
                >
                  Manage
                </Button>
              </Stack>

              {pendingLoading ? (
                <Stack direction="row" spacing={2} sx={{ overflowX: 'auto', pb: 1 }}>
                  {[...Array(4)].map((_, i) => (
                    <Box key={i} sx={{ minWidth: 170, flexShrink: 0 }}>
                      <Skeleton variant="rectangular" height={120} sx={{ borderRadius: 3 }} />
                    </Box>
                  ))}
                </Stack>
              ) : (
                <Box>
                  {/* Received sub-row */}
                  {pendingReceived.length > 0 && (
                    <Box sx={{ mb: pendingSent.length > 0 ? 3 : 0 }}>
                      <Stack direction="row" alignItems="center" spacing={0.8} sx={{ mb: 1.5 }}>
                        <Inbox size={13} color={COLORS.primary} />
                        <Typography variant="caption" sx={{ fontWeight: 700, color: COLORS.primary, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                          Received ({pendingReceived.length})
                        </Typography>
                      </Stack>
                      <Stack direction="row" spacing={2} sx={{ overflowX: 'auto', pb: 1, scrollbarWidth: 'thin' }}>
                        {pendingReceived.map((match) => {
                          const initials = match.initials || '??';
                          return (
                            <Box
                              key={match.id}
                              sx={{
                                minWidth: 175, flexShrink: 0,
                                bgcolor: COLORS.background, borderRadius: 3,
                                border: `1px solid rgba(139,26,46,0.2)`,
                                overflow: 'hidden',
                              }}
                            >
                              {/* Profile picture hero */}
                              <Box sx={{ position: 'relative', width: '100%', pt: '75%', bgcolor: alpha(COLORS.primary, 0.08) }}>
                                {match.img ? (
                                  <Box
                                    component="img"
                                    src={match.img}
                                    alt={match.name}
                                    referrerPolicy="no-referrer"
                                    sx={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }}
                                  />
                                ) : (
                                  <Box sx={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <Avatar sx={{ width: 64, height: 64, bgcolor: COLORS.primary, fontWeight: 700, color: '#fff', fontSize: '1.4rem' }}>
                                      {initials}
                                    </Avatar>
                                  </Box>
                                )}
                                {/* Gradient name overlay */}
                                <Box sx={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.65) 0%, transparent 55%)' }} />
                                <Box sx={{ position: 'absolute', bottom: 0, left: 0, right: 0, p: 1 }}>
                                  <Typography sx={{ fontWeight: 700, fontSize: '0.78rem', color: '#fff', lineHeight: 1.2 }} noWrap>
                                    {match.name}{match.age ? `, ${match.age}` : ''}
                                  </Typography>
                                  {match.location && match.location !== 'Not provided' && (
                                    <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.8)', fontSize: '0.65rem' }} noWrap>{match.location}</Typography>
                                  )}
                                </Box>
                              </Box>
                              <Box sx={{ p: 1.2 }}>
                                <Stack direction="row" spacing={0.8}>
                                <Tooltip title="Accept interest">
                                  <IconButton
                                    size="small"
                                    onClick={async () => {
                                      try {
                                        const res = await matchService.expressInterest(match.id);
                                        setPendingReceived((p) => p.filter((m) => m.id !== match.id));
                                        if (res.data?.matched) {
                                          setMutualMatches((p) => [...p, match]);
                                          dispatch(showToast({ type: 'success', message: 'Mutual match unlocked!' }));
                                        } else {
                                          dispatch(showToast({ type: 'success', message: 'Interest sent back!' }));
                                        }
                                      } catch { dispatch(showToast({ type: 'error', message: 'Failed.' })); }
                                    }}
                                    sx={{ flex: 1, borderRadius: 2, bgcolor: COLORS.primary, color: '#fff', '&:hover': { bgcolor: '#6e1526' } }}
                                  >
                                    <UserCheck size={14} />
                                  </IconButton>
                                </Tooltip>
                                <Tooltip title="Decline">
                                  <IconButton
                                    size="small"
                                    onClick={async () => {
                                      try {
                                        await matchService.declineInterest(match.id);
                                        setPendingReceived((p) => p.filter((m) => m.id !== match.id));
                                        dispatch(showToast({ type: 'info', message: 'Interest declined.' }));
                                      } catch { dispatch(showToast({ type: 'error', message: 'Failed.' })); }
                                    }}
                                    sx={{ flex: 1, borderRadius: 2, border: `1px solid rgba(211,47,47,0.5)`, color: '#d32f2f', '&:hover': { bgcolor: 'rgba(211,47,47,0.08)' } }}
                                  >
                                    <UserX size={14} />
                                  </IconButton>
                                </Tooltip>
                                <Tooltip title="View Profile">
                                  <IconButton
                                    size="small"
                                    onClick={() => { setSelectedInterestId(match.id); setSelectedInterestImg(match.img || null); setInterestDetailOpen(true); }}
                                    sx={{ flex: 1, borderRadius: 2, border: `1px solid rgba(26,107,114,0.5)`, color: '#1A6B72', '&:hover': { bgcolor: 'rgba(26,107,114,0.08)' } }}
                                  >
                                    <Eye size={14} />
                                  </IconButton>
                                </Tooltip>
                              </Stack>
                              </Box>
                            </Box>
                          );
                        })}
                      </Stack>
                    </Box>
                  )}

                  {/* Sent sub-row */}
                  {pendingSent.length > 0 && (
                    <Box>
                      <Stack direction="row" alignItems="center" spacing={0.8} sx={{ mb: 1.5 }}>
                        <Send size={13} color="#1A6B72" />
                        <Typography variant="caption" sx={{ fontWeight: 700, color: '#1A6B72', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                          Sent ({pendingSent.length}) · Awaiting response
                        </Typography>
                      </Stack>
                      <Stack direction="row" spacing={2} sx={{ overflowX: 'auto', pb: 1, scrollbarWidth: 'thin' }}>
                        {pendingSent.map((match) => {
                          const initials = match.initials || '??';
                          return (
                            <Box
                              key={match.id}
                              sx={{
                                minWidth: 155, flexShrink: 0,
                                bgcolor: COLORS.background, borderRadius: 3,
                                border: `1px solid rgba(26,107,114,0.2)`,
                                overflow: 'hidden',
                              }}
                            >
                              {/* Profile picture hero */}
                              <Box sx={{ position: 'relative', width: '100%', pt: '75%', bgcolor: 'rgba(26,107,114,0.08)' }}>
                                {match.img ? (
                                  <Box
                                    component="img"
                                    src={match.img}
                                    alt={match.name}
                                    referrerPolicy="no-referrer"
                                    sx={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'top center' }}
                                  />
                                ) : (
                                  <Box sx={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <Avatar sx={{ width: 56, height: 56, bgcolor: '#1A6B72', fontWeight: 700, color: '#fff', fontSize: '1.2rem' }}>
                                      {initials}
                                    </Avatar>
                                  </Box>
                                )}
                                <Box sx={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.65) 0%, transparent 55%)' }} />
                                <Box sx={{ position: 'absolute', bottom: 0, left: 0, right: 0, p: 1 }}>
                                  <Typography sx={{ fontWeight: 700, fontSize: '0.78rem', color: '#fff', lineHeight: 1.2 }} noWrap>
                                    {match.name}{match.age ? `, ${match.age}` : ''}
                                  </Typography>
                                  {match.location && match.location !== 'Not provided' && (
                                    <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.8)', fontSize: '0.65rem' }} noWrap>{match.location}</Typography>
                                  )}
                                </Box>
                              </Box>
                              <Box sx={{ p: 1.2 }}>
                                <Tooltip title="Withdraw interest">
                                  <IconButton
                                    size="small"
                                    onClick={async () => {
                                      try {
                                        await matchService.undoInterest(match.id);
                                        setPendingSent((p) => p.filter((m) => m.id !== match.id));
                                        dispatch(showToast({ type: 'info', message: 'Interest withdrawn.' }));
                                      } catch { dispatch(showToast({ type: 'error', message: 'Failed.' })); }
                                    }}
                                    sx={{ width: '100%', borderRadius: 2, border: `1px solid rgba(211,47,47,0.4)`, color: '#d32f2f', '&:hover': { bgcolor: 'rgba(211,47,47,0.08)' } }}
                                  >
                                    <UserMinus size={14} />
                                  </IconButton>
                                </Tooltip>
                              </Box>
                            </Box>
                          );
                        })}
                      </Stack>
                    </Box>
                  )}
                </Box>
              )}
            </Box>
          </Grid>
        )}
      </Grid>

      {/* Notification Drawer */}
      <Drawer
        anchor="right"
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        PaperProps={{
          sx: { width: { xs: '100%', sm: 350 }, p: 3, bgcolor: COLORS.background }
        }}
      >
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h6" sx={{ fontFamily: 'Playfair Display', fontWeight: 700, color: COLORS.primary }}>
            Recent Activity
          </Typography>
          <IconButton onClick={() => setDrawerOpen(false)}><Close /></IconButton>
        </Box>
        
        <List sx={{ p: 0 }}>
          {data.notifications.map((notif: any) => (
            <ListItem 
              key={notif.id} 
              sx={{ 
                mb: 2, 
                bgcolor: COLORS.white, 
                borderRadius: '16px', 
                boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
                borderLeft: notif.read ? 'none' : `4px solid ${COLORS.primary}`
              }}
            >
              <ListItemIcon sx={{ minWidth: 40 }}>
                {notif.text.includes('liked') ? <Favorite sx={{ color: COLORS.primary }} /> : 
                 notif.text.includes('match') ? <TrendingUp sx={{ color: COLORS.accent }} /> : 
                 <CalendarMonth sx={{ color: COLORS.secondary }} />}
              </ListItemIcon>
              <ListItemText 
                primary={notif.text} 
                secondary={notif.time}
                primaryTypographyProps={{ variant: 'body2', fontWeight: notif.read ? 400 : 700 }}
                secondaryTypographyProps={{ variant: 'caption' }}
              />
              {!notif.read && <Circle sx={{ fontSize: 8, color: COLORS.primary }} />}
            </ListItem>
          ))}
        </List>
        
        <Button fullWidth sx={{ mt: 2, color: COLORS.primary, fontWeight: 700 }}>
          Mark all as read
        </Button>
      </Drawer>

      {/* Decorative Background Motif */}
      <Box sx={{ 
        position: 'fixed', 
        bottom: -50, 
        right: -50, 
        width: 300, 
        height: 300, 
        opacity: 0.03, 
        zIndex: -1,
        backgroundImage: `url("data:image/svg+xml,%3Csvg width='100' height='100' viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M50 0 L60 40 L100 50 L60 60 L50 100 L40 60 L0 50 L40 40 Z' fill='%238B1A2E' /%3E%3C/svg%3E")`,
        backgroundSize: '100px 100px'
      }} />

      <Dialog open={verifyDialog.open} onClose={() => setVerifyDialog({ open: false, channel: null })} fullWidth maxWidth="xs">
        <DialogTitle sx={{ fontFamily: 'Playfair Display', fontWeight: 700 }}>
          Verify {verifyDialog.channel === 'email' ? 'Email' : 'Phone'}
        </DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ pt: 1 }}>
            <Typography variant="body2" sx={{ color: COLORS.textSecondary }}>
              Enter the 6-digit OTP sent to your {verifyDialog.channel}.
            </Typography>
            <TextField
              fullWidth
              label="OTP"
              value={otpValue}
              onChange={(event) => setOtpValue(event.target.value.replace(/\D/g, '').slice(0, 6))}
            />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button onClick={() => setVerifyDialog({ open: false, channel: null })}>Cancel</Button>
          <Button variant="contained" onClick={handleConfirmVerification} disabled={verifying} sx={{ bgcolor: COLORS.primary }}>
            {verifying ? 'Verifying...' : 'Verify'}
          </Button>
        </DialogActions>
      </Dialog>

      <MatchDetailPanel
        matchId={selectedInterestId}
        open={interestDetailOpen}
        onClose={() => setInterestDetailOpen(false)}
        previewImage={selectedInterestImg}
        onSendMessage={(id) => { setInterestDetailOpen(false); navigate('/messages', { state: { openUserId: id } }); }}
        onExpressInterest={async (id) => {
          try {
            const res = await matchService.expressInterest(id);
            setPendingReceived((p) => p.filter((m) => m.id !== id));
            if (res.data?.matched) {
              dispatch(showToast({ type: 'success', message: 'Mutual match unlocked!' }));
            } else {
              dispatch(showToast({ type: 'success', message: 'Interest sent back!' }));
            }
            setInterestDetailOpen(false);
          } catch { dispatch(showToast({ type: 'error', message: 'Failed.' })); }
        }}
      />

      {/* Remove match confirmation dialog */}
      <Dialog open={!!removeConfirm} onClose={() => setRemoveConfirm(null)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 700, color: '#d32f2f' }}>Remove Match?</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary">
            Are you sure you want to remove <strong>{removeConfirm?.matchName}</strong> from your matches?
            This will also delete your conversation and all messages.
          </Typography>
          {removeConfirm?.hasWedding && (
            <Box sx={{ mt: 2, p: 1.5, borderRadius: 2, bgcolor: '#fff3cd', border: '1px solid #ffc107' }}>
              <Typography variant="body2" sx={{ fontWeight: 700, color: '#856404' }}>
                ⚠️ Shared Wedding Project
              </Typography>
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
                You and {removeConfirm.matchName} have an accepted wedding project together.
                Removing this match will <strong>reset the shared wedding project</strong> for both of you.
              </Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setRemoveConfirm(null)}>Cancel</Button>
          <Button
            variant="contained"
            color="error"
            onClick={confirmRemoveMatch}
            sx={{ fontWeight: 700, textTransform: 'none' }}
          >
            Yes, Remove
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
