import React, { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Avatar,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid,
  Paper,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import {
  CalendarMonth,
  Favorite,
  Paid,
  Search,
  TravelExplore,
  VerifiedUser,
  AutoAwesome,
} from '@mui/icons-material';
import { motion } from 'motion/react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { RootState } from '@/app/store/store';
import { showToast } from '@/app/store/uiSlice';
import { updateUser } from '@/features/auth/store/authSlice';
import userService from '@/features/profile/services/userService';
import DashboardSkeleton from '@/components/skeletons/DashboardSkeleton';

const COLORS = {
  primary: '#8B1A2E',
  secondary: '#C9A84C',
  accent: '#1A6B72',
  background: '#FAF7F2',
  white: '#FFFFFF',
  textPrimary: '#1C1C1C',
  textSecondary: '#555555',
};

const MotionBox = motion(Box);

function formatWeddingDate(value?: string | null) {
  if (!value) return 'Date not set';
  return new Date(value).toLocaleDateString('en-LK', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

function VerificationPanel({
  verification,
  email,
  phone,
  onRequestOtp,
  onOpenVerify,
  busyChannel,
}: {
  verification: any;
  email: string;
  phone: string;
  onRequestOtp: (channel: 'email' | 'phone') => Promise<void>;
  onOpenVerify: (channel: 'email' | 'phone') => void;
  busyChannel: 'email' | 'phone' | null;
}) {
  // Show verification panel if email or phone is not verified
  const emailNeeded = !verification?.emailVerified;
  const phoneNeeded = phone && !verification?.phoneVerified;
  
  if (!emailNeeded && !phoneNeeded) {
    return null;
  }

  return (
    <Paper sx={{ p: 3, borderRadius: '24px', mb: 3, boxShadow: '0 2px 16px rgba(139,26,46,0.08)' }}>
      <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} justifyContent="space-between" alignItems={{ xs: 'flex-start', md: 'center' }}>
        <Box>
          <Typography variant="h6" sx={{ fontFamily: 'Playfair Display', fontWeight: 700, color: COLORS.primary }}>
            Pending Verification
          </Typography>
          <Typography variant="body2" sx={{ color: COLORS.textSecondary, mt: 0.5 }}>
            Your account is active. Verify your contact details when convenient.
          </Typography>
        </Box>
        <Chip icon={<VerifiedUser />} label="Action Needed" sx={{ bgcolor: '#FFF3E0', color: '#B26A00', fontWeight: 700 }} />
      </Stack>

      <Stack spacing={2} sx={{ mt: 3 }}>
        {emailNeeded && (
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} alignItems={{ xs: 'flex-start', sm: 'center' }}>
            <Typography variant="body2" sx={{ minWidth: 220, color: COLORS.textPrimary }}>
              Verify email: {email || 'Not available'}
            </Typography>
            <Button variant="outlined" onClick={() => onRequestOtp('email')} disabled={busyChannel === 'email'} sx={{ borderRadius: '10px' }}>
              {busyChannel === 'email' ? 'Sending...' : 'Send OTP'}
            </Button>
            <Button variant="contained" onClick={() => onOpenVerify('email')} sx={{ borderRadius: '10px', bgcolor: COLORS.primary }}>
              Enter OTP
            </Button>
          </Stack>
        )}

        {phoneNeeded && (
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} alignItems={{ xs: 'flex-start', sm: 'center' }}>
            <Typography variant="body2" sx={{ minWidth: 220, color: COLORS.textPrimary }}>
              Verify phone: {phone || 'Not available'}
            </Typography>
            <Button variant="outlined" onClick={() => onRequestOtp('phone')} disabled={busyChannel === 'phone'} sx={{ borderRadius: '10px' }}>
              {busyChannel === 'phone' ? 'Sending...' : 'Send OTP'}
            </Button>
            <Button variant="contained" onClick={() => onOpenVerify('phone')} sx={{ borderRadius: '10px', bgcolor: COLORS.primary }}>
              Enter OTP
            </Button>
          </Stack>
        )}
      </Stack>
    </Paper>
  );
}

export default function CoupleDashboard() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { user } = useSelector((state: RootState) => state.auth);
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<any>(null);
  const [verifyDialog, setVerifyDialog] = useState<{ open: boolean; channel: 'email' | 'phone' | null }>({
    open: false,
    channel: null,
  });
  const [otpValue, setOtpValue] = useState('');
  const [busyChannel, setBusyChannel] = useState<'email' | 'phone' | null>(null);
  const [verifying, setVerifying] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      setLoading(true);
      try {
        const response = await userService.getProfile({ includeMedia: false });
        setProfile(response);
        dispatch(updateUser({ profilePic: response.profilePic || null }));
      } catch (error) {
        console.error('Failed to load couple dashboard profile', error);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, []);

  const daysToGo = useMemo(() => {
    if (!profile?.weddingProject?.weddingDate) return null;
    return Math.max(
      0,
      Math.ceil((new Date(profile.weddingProject.weddingDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    );
  }, [profile]);

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
    if (!verifyDialog.channel || otpValue.trim().length !== 6) {
      dispatch(showToast({ type: 'error', message: 'Enter a valid 6-digit OTP.' }));
      return;
    }

    try {
      setVerifying(true);
      const response = await userService.confirmVerificationOtp({
        channel: verifyDialog.channel,
        otp: otpValue.trim(),
      });

      setProfile((prev: any) => ({
        ...prev,
        verification: {
          ...prev?.verification,
          ...response.verification,
        },
      }));
      dispatch(updateUser({ verification: { ...(user?.verification || {}), ...response.verification } }));
      dispatch(showToast({ type: 'success', message: response.message || 'Verification completed.' }));
      setVerifyDialog({ open: false, channel: null });
      setOtpValue('');
    } catch (error: any) {
      dispatch(showToast({ type: 'error', message: error.response?.data?.message || 'Failed to verify OTP.' }));
    } finally {
      setVerifying(false);
    }
  };

  if (loading || !profile) {
    return (
      <Box sx={{ p: 4, bgcolor: COLORS.background, minHeight: '100vh' }}>
        <DashboardSkeleton />
      </Box>
    );
  }

  const partnerName = profile.weddingProject?.partnerName || 'Your Partner';
  const cards = [
    {
      title: 'Wedding Planning',
      description: 'Manage checklist, timeline, venue planning, and couple progress.',
      icon: <CalendarMonth sx={{ fontSize: 28, color: COLORS.primary }} />,
      action: () => navigate('/wedding'),
      cta: 'Open Wedding Dashboard',
    },
    {
      title: 'Budget Planner',
      description: 'Track your wedding spend, remaining budget, and category-level costs.',
      icon: <Paid sx={{ fontSize: 28, color: COLORS.secondary }} />,
      action: () => navigate('/wedding'),
      cta: 'Manage Budget',
    },
    {
      title: 'Vendor Booking',
      description: 'Browse photographers, caterers, venues, and other wedding vendors.',
      icon: <Search sx={{ fontSize: 28, color: COLORS.accent }} />,
      action: () => navigate('/vendors'),
      cta: 'Find Vendors',
    },
    {
      title: 'Horoscope Check',
      description: 'Review your horoscope and check couple compatibility when needed.',
      icon: <AutoAwesome sx={{ fontSize: 28, color: COLORS.primary }} />,
      action: () => navigate('/horoscope'),
      cta: 'View Horoscope Tools',
    },
    {
      title: 'Honeymoon Ideas',
      description: 'Explore destinations once your wedding planning is underway.',
      icon: <TravelExplore sx={{ fontSize: 28, color: COLORS.accent }} />,
      action: () => navigate('/honeymoon'),
      cta: 'Explore Destinations',
    },
  ];

  return (
    <Box sx={{ p: { xs: 2, md: 4 }, bgcolor: COLORS.background, minHeight: '100vh' }}>
      <MotionBox
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        sx={{
          p: { xs: 3, md: 5 },
          mb: 4,
          borderRadius: '32px',
          background: `linear-gradient(135deg, ${COLORS.primary} 0%, #B43B4E 60%, ${COLORS.secondary} 100%)`,
          color: 'white',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <Box sx={{ position: 'absolute', top: -20, right: -20, opacity: 0.1 }}>
          <Favorite sx={{ fontSize: 180 }} />
        </Box>
        <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 2 }}>
          <Avatar
            src={profile.profilePic || undefined}
            alt={user?.name || 'User'}
            sx={{ width: 68, height: 68, border: '3px solid rgba(255,255,255,0.5)' }}
          />
          <Box>
        <Typography variant="overline" sx={{ letterSpacing: 2, opacity: 0.85 }}>
          Engaged Couple Dashboard
        </Typography>
        <Typography variant="h3" sx={{ fontFamily: 'Playfair Display', fontWeight: 700, mt: 1, mb: 1 }}>
          {user?.firstName || 'You'} and {partnerName}
        </Typography>
          </Box>
        </Stack>
        <Typography variant="body1" sx={{ maxWidth: 720, opacity: 0.92 }}>
          This space is focused on planning your wedding journey. Match discovery is hidden for couple accounts because your priority is now planning, coordination, and optional horoscope review.
        </Typography>

        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} sx={{ mt: 3 }}>
          <Chip
            label={`Wedding Date: ${formatWeddingDate(profile.weddingProject?.weddingDate)}`}
            sx={{ bgcolor: 'rgba(255,255,255,0.15)', color: 'white', fontWeight: 700 }}
          />
          {daysToGo !== null && (
            <Chip
              label={`${daysToGo} days to go`}
              sx={{ bgcolor: 'rgba(255,255,255,0.15)', color: 'white', fontWeight: 700 }}
            />
          )}
          {profile.weddingProject?.budget && (
            <Chip
              label={`Budget: ${profile.weddingProject.budget}`}
              sx={{ bgcolor: 'rgba(255,255,255,0.15)', color: 'white', fontWeight: 700 }}
            />
          )}
        </Stack>
      </MotionBox>

      <VerificationPanel
        verification={profile.verification}
        email={profile.email}
        phone={profile.personalInfo?.phone}
        onRequestOtp={handleRequestVerificationOtp}
        onOpenVerify={(channel) => {
          setVerifyDialog({ open: true, channel });
          setOtpValue('');
        }}
        busyChannel={busyChannel}
      />

      <Alert severity="info" sx={{ mb: 3, borderRadius: '16px' }}>
        Horoscope compatibility remains available for couples, but match cards, interests, and discovery are intentionally hidden for this account type.
      </Alert>

      <Grid container spacing={3}>
        {cards.map((card, index) => (
          <Grid size={{ xs: 12, md: 6, xl: 4 }} key={card.title}>
            <MotionBox initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: index * 0.08 }}>
              <Card sx={{ borderRadius: '24px', height: '100%', boxShadow: '0 2px 16px rgba(139,26,46,0.08)' }}>
                <CardContent sx={{ p: 3.5 }}>
                  <Box sx={{ mb: 2 }}>{card.icon}</Box>
                  <Typography variant="h6" sx={{ fontFamily: 'Playfair Display', fontWeight: 700, color: COLORS.primary, mb: 1 }}>
                    {card.title}
                  </Typography>
                  <Typography variant="body2" sx={{ color: COLORS.textSecondary, minHeight: 66, mb: 3 }}>
                    {card.description}
                  </Typography>
                  <Button variant="contained" onClick={card.action} sx={{ borderRadius: '12px', bgcolor: COLORS.primary }}>
                    {card.cta}
                  </Button>
                </CardContent>
              </Card>
            </MotionBox>
          </Grid>
        ))}
      </Grid>

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
