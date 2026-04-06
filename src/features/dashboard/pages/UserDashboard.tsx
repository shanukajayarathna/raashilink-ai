import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Grid, 
  Typography, 
  Paper, 
  Avatar, 
  Button, 
  Chip, 
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
  ChatBubbleOutline as MessageSquare, 
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
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '@/app/store/store';
import api from '@/shared/lib/axios';
import DashboardSkeleton from '@/components/skeletons/DashboardSkeleton';
import userService from '@/features/profile/services/userService';
import { showToast } from '@/app/store/uiSlice';
import { updateUser } from '@/features/auth/store/authSlice';
import CoupleDashboard from '@/features/dashboard/pages/CoupleDashboard';

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

const WidgetHeader = ({ title, action }: { title: string; action?: React.ReactNode }) => (
  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
    <Typography variant="h6" sx={{ fontFamily: 'Playfair Display', fontWeight: 700, color: COLORS.primary }}>
      {title}
    </Typography>
    {action}
  </Box>
);

// --- Sub-Components ---

const ProfileCompletionRing = ({ percentage, missingItems }: { percentage: number; missingItems: string[] }) => {
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
            {missingItems.map((item, index) => (
              <Chip 
                key={index} 
                label={item} 
                size="small" 
                onClick={() => {}} 
                sx={{ 
                  bgcolor: 'rgba(139,26,46,0.05)', 
                  color: COLORS.primary, 
                  fontSize: '0.65rem',
                  fontWeight: 700,
                  '&:hover': { bgcolor: 'rgba(139,26,46,0.1)' }
                }} 
              />
            ))}
          </Stack>
        </Box>
      </Box>
    </MotionPaper>
  );
};

const TopMatchCard = ({ match }: { match: any }) => {
  if (!match) return null;

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
          startIcon={<Favorite />}
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

const MatchStats = ({ stats }: { stats: any }) => {
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
          { label: "Mutual Interests", value: stats.mutualInterests, color: COLORS.secondary },
          { label: "Profile Views", value: stats.profileViews, color: COLORS.accent }
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
  onRequestOtp,
  onOpenVerify,
  busyChannel,
}: {
  verification: any;
  onRequestOtp: (channel: 'email' | 'phone') => Promise<void>;
  onOpenVerify: (channel: 'email' | 'phone') => void;
  busyChannel: 'email' | 'phone' | null;
}) => (
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
            label={verification.emailVerified ? 'Verified' : 'Pending'}
            sx={{
              ml: 'auto',
              bgcolor: verification.emailVerified ? '#E8F5E9' : '#FFF3E0',
              color: verification.emailVerified ? '#2E7D32' : '#B26A00',
              fontWeight: 700,
            }}
          />
        </Box>
        <Typography variant="body2" sx={{ color: COLORS.textSecondary, mb: 1.5 }}>
          {verification.email || 'No email available'}
        </Typography>
        {!verification.emailVerified && (
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

      {verification.phone && (
        <Box sx={{ p: 2, borderRadius: '16px', bgcolor: COLORS.background }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
            <Phone sx={{ color: COLORS.accent }} />
            <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
              Phone Verification
            </Typography>
            <Chip
              size="small"
              label={verification.phoneVerified ? 'Verified' : 'Pending'}
              sx={{
                ml: 'auto',
                bgcolor: verification.phoneVerified ? '#E8F5E9' : '#FFF3E0',
                color: verification.phoneVerified ? '#2E7D32' : '#B26A00',
                fontWeight: 700,
              }}
            />
          </Box>
          <Typography variant="body2" sx={{ color: COLORS.textSecondary, mb: 1.5 }}>
            {verification.phone}
          </Typography>
          {!verification.phoneVerified && (
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

const WeddingProjectStatus = ({ status }: { status: any }) => {
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
            <Typography variant="caption" sx={{ fontWeight: 700 }}>LKR {status.budget.spent.toLocaleString()} / {status.budget.total.toLocaleString()}</Typography>
          </Box>
          <LinearProgress 
            variant="determinate" 
            value={(status.budget.spent / status.budget.total) * 100} 
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
            {status.checklist.map((item: any) => (
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
            ))}
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

const ChatbotQuickAccess = ({ chatbot }: { chatbot: any }) => {
  return (
    <MotionPaper
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.4 }}
      sx={{ p: 3, borderRadius: '24px', height: '100%', bgcolor: COLORS.primary, color: 'white', position: 'relative', overflow: 'hidden' }}
    >
      <Box sx={{ position: 'relative', zIndex: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
          <Badge 
            overlap="circular" 
            anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
            variant="dot"
            sx={{ '& .MuiBadge-badge': { bgcolor: '#4CAF50', border: '2px solid #8B1A2E' } }}
          >
            <Avatar sx={{ bgcolor: COLORS.secondary, color: COLORS.primary }}>
              <MessageSquare />
            </Avatar>
          </Badge>
          <Box>
            <Typography variant="subtitle1" sx={{ fontWeight: 700, lineHeight: 1.2 }}>RaashiBot</Typography>
            <Typography variant="caption" sx={{ opacity: 0.7 }}>Online</Typography>
          </Box>
        </Box>
        
        <Typography variant="body2" sx={{ opacity: 0.9, mb: 3, fontStyle: 'italic' }}>
          "{chatbot.lastMessage}"
        </Typography>
        
        <motion.div
          animate={{ scale: [1, 1.05, 1] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <Button 
            fullWidth 
            variant="contained" 
            sx={{ 
              bgcolor: COLORS.secondary, 
              color: COLORS.primary, 
              fontWeight: 800,
              borderRadius: '12px',
              '&:hover': { bgcolor: '#B89740' }
            }}
          >
            Chat with RaashiBot
          </Button>
        </motion.div>
      </Box>
      
      <MessageSquare sx={{ position: 'absolute', right: -20, bottom: -20, fontSize: 120, opacity: 0.05 }} />
    </MotionPaper>
  );
};

const VendorRecommendations = ({ vendors }: { vendors: any[] }) => {
  return (
    <MotionPaper
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.5 }}
      sx={{ p: 3, borderRadius: '24px', height: '100%', bgcolor: COLORS.white, boxShadow: '0 2px 16px rgba(139,26,46,0.08)' }}
    >
      <WidgetHeader title="Recommended Vendors" />
      <Stack spacing={2}>
        {vendors.map((vendor) => (
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
        ))}
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

  if (user?.profileType === 'couple') {
    return <CoupleDashboard />;
  }
  
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [verifyDialog, setVerifyDialog] = useState<{ open: boolean; channel: 'email' | 'phone' | null }>({
    open: false,
    channel: null,
  });
  const [otpValue, setOtpValue] = useState('');
  const [busyChannel, setBusyChannel] = useState<'email' | 'phone' | null>(null);
  const [verifying, setVerifying] = useState(false);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const profile = await userService.getProfile();
        // In a real app, we would call these endpoints
        // const [summary, matches, wedding] = await Promise.all([
        //   api.get('/api/v1/dashboard/summary'),
        //   api.get('/api/v1/matches/today'),
        //   api.get('/api/v1/wedding/status')
        // ]);
        
        // Mocking API delay
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        setData({
          summary: {
            name: user?.firstName || "Shanuka",
            nakshatra: profile.verification?.emailVerified || profile.verification?.phoneVerified
              ? (profile.astrology?.nakshatra || "Pending")
              : (profile.astrology?.nakshatra || "Pending"),
            auspiciousTime: "10:30 AM - 12:00 PM",
            profileCompletion: profile.completion || 75,
            missingItems: profile.verification?.missingItems || ["Add Profile Photo", "Complete Personality Quiz"],
            matchStats: {
              todayMatches: 12,
              mutualInterests: 5,
              profileViews: 48,
              weeklyActivity: [
                { day: 'Mon', views: 24 },
                { day: 'Tue', views: 32 },
                { day: 'Wed', views: 45 },
                { day: 'Thu', views: 48 },
                { day: 'Fri', views: 38 },
                { day: 'Sat', views: 52 },
                { day: 'Sun', views: 41 },
              ]
            }
          },
          todayMatch: {
            name: "Kavindi Jayawardena",
            age: 24,
            location: "Colombo",
            photo: "https://picsum.photos/seed/kavindi/200/200",
            compatibility: 87,
            scores: {
              astrological: 87,
              personality: 92,
              lifestyle: 85,
              family: 88
            },
            band: "EXCELLENT"
          },
          weddingStatus: {
            daysToGo: 127,
            venue: "Galle Face Hotel",
            budget: {
              spent: 450000,
              total: 800000
            },
            checklist: [
              { id: 1, task: "Book photographer", completed: false },
              { id: 2, task: "Select Venue", completed: true },
              { id: 3, task: "Finalize Guest List", completed: false }
            ]
          },
          chatbot: {
            lastMessage: "Your horoscope matching for the new profile is ready!",
            online: true
          },
          vendors: [
            { id: 1, name: "Studio 3000", category: "Photography", rating: 4.8, photo: "https://picsum.photos/seed/studio/100/100" },
            { id: 2, name: "Lassana Flora", category: "Decor", rating: 4.9, photo: "https://picsum.photos/seed/flora/100/100" }
          ],
          verification: profile.verification,
          notifications: [
            { id: 1, text: "Kavindi liked your profile", time: "2h ago", read: false },
            { id: 2, text: "New match recommendation", time: "5h ago", read: true },
            { id: 3, text: "Wedding checklist reminder: Book photographer", time: "1d ago", read: false }
          ]
        });
        setLoading(false);
      } catch (error) {
        console.error("Error fetching dashboard data", error);
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [user]);

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
    return new Date().toLocaleDateString('en-US', options);
  };

  if (loading) {
    return (
      <Box sx={{ p: 4, bgcolor: COLORS.background, minHeight: '100vh' }}>
        <Skeleton variant="text" width={300} height={60} sx={{ mb: 4 }} />
        <DashboardSkeleton />
      </Box>
    );
  }

  return (
    <Box sx={{ p: { xs: 2, md: 4 }, bgcolor: COLORS.background, minHeight: '100vh', position: 'relative' }}>
      {/* Header Section */}
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <MotionBox
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8 }}
        >
          <Typography variant="h4" sx={{ fontFamily: 'Playfair Display', fontWeight: 700, color: COLORS.primary, mb: 1 }}>
            Good morning, {data.summary.name} ✨
          </Typography>
          <Stack direction="row" spacing={2} alignItems="center">
            <Box sx={{ color: COLORS.textSecondary, fontSize: '0.875rem', display: 'flex', alignItems: 'center', gap: 1 }}>
              {getGregorianDate()} | <Chip label={`${data.summary.nakshatra} Nakshatra`} size="small" sx={{ bgcolor: COLORS.secondary, color: COLORS.primary, fontWeight: 700, height: 20 }} />
            </Box>
          </Stack>
          <Typography variant="caption" sx={{ color: COLORS.accent, fontWeight: 700, mt: 1, display: 'block' }}>
            Your auspicious time today: {data.summary.auspiciousTime}
          </Typography>
        </MotionBox>
        
        <IconButton 
          onClick={() => setDrawerOpen(true)}
          sx={{ bgcolor: COLORS.white, boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}
        >
          <Badge badgeContent={data.notifications.filter((n: any) => !n.read).length} color="error">
            <Notifications sx={{ color: COLORS.primary }} />
          </Badge>
        </IconButton>
      </Box>

      {/* Grid Layout */}
      <Grid container spacing={3}>
        {data.verification && (!data.verification.emailVerified || !data.verification.phoneVerified) && (
          <Grid size={{ xs: 12 }}>
            <VerificationSetupCard
              verification={data.verification}
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
          <ProfileCompletionRing percentage={data.summary.profileCompletion} missingItems={data.summary.missingItems} />
        </Grid>
        <Grid size={{ xs: 12, md: 4 }}>
          <TopMatchCard match={data.todayMatch} />
        </Grid>
        <Grid size={{ xs: 12, md: 4 }}>
          <MatchStats stats={data.summary.matchStats} />
        </Grid>

        {/* Row 2 */}
        <Grid size={{ xs: 12, md: 4 }}>
          <WeddingProjectStatus status={data.weddingStatus} />
        </Grid>
        <Grid size={{ xs: 12, md: 4 }}>
          <HoneymoonWidget />
        </Grid>
        <Grid size={{ xs: 12, md: 4 }}>
          <VendorRecommendations vendors={data.vendors} />
        </Grid>

        {/* Row 3 */}
        <Grid size={{ xs: 12, md: 4 }}>
          <ChatbotQuickAccess chatbot={data.chatbot} />
        </Grid>
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
    </Box>
  );
}


