import React, { useState, useEffect } from 'react';
import { 
  Box, Container, Typography, Grid, Card, CardContent, 
  Tabs, Tab, Button, Stack, Avatar, IconButton, 
  LinearProgress, useTheme, useMediaQuery, Skeleton,
  Tooltip, Badge, Alert, CircularProgress, Chip,
  Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, InputAdornment
} from '@mui/material';
import { 
  Heart, Calendar, MapPin, Edit3, Camera, 
  CheckCircle2, DollarSign, Users, LayoutDashboard,
  ClipboardList, Store, BarChart3, Milestone,
  TrendingUp, AlertCircle, Plus, Sparkles,
  ChevronRight, ArrowRight, XCircle, PartyPopper
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useSelector } from 'react-redux';
import { RootState } from '@/app/store/store';
import weddingService from '../services/weddingService';
import { connectSocket } from '@/shared/hooks/useRealtimeUpdates';

// Sub-components
import OverviewTab from '../components/OverviewTab';
import ChecklistTab from '../components/ChecklistTab';
import VendorTab from '../components/VendorTab';
import BudgetTab from '../components/BudgetTab';
import TimelineTab from '../components/TimelineTab';

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
  warning: '#ED6C02'
};

const DEFAULT_WEDDING_HERO_IMAGE = 'https://images.unsplash.com/photo-1519225421980-715cb0215aed?w=1400&q=85&fit=crop';

function buildWeddingDashboardData(project: any, budgetSummary: any, vendorsPayload: any, user: any) {
  const checklist = Array.isArray(project?.checklist) ? project.checklist : [];
  const bookedVendors = Array.isArray(project?.vendors)
    ? project.vendors.filter((entry: any) => ['requested', 'booked'].includes(entry?.status)).length
    : 0;
  const totalVendors = vendorsPayload?.data?.total || vendorsPayload?.data?.items?.length || 0;
  const completedTasks = checklist.filter((item: any) => item?.completed).length;
  const partner1 = user?.firstName || user?.name?.split(' ')?.[0] || 'You';
  const partner1Pic: string | null = user?.profilePic || user?.coverPhoto || null;
  // Redux user has 'id' (from sanitizeUser); Mongoose populated docs expose both 'id' and '_id'
  const currentUserId = String(user?.id || user?._id || '');
  const otherUser = Array.isArray(project?.coupleUserIds)
    ? project.coupleUserIds.find((u: any) => {
        if (!u || typeof u !== 'object') return false;
        const uid = String(u._id || u.id || '');
        return uid && uid !== currentUserId;
      })
    : null;
  const partner2 = otherUser?.firstName || otherUser?.personalInfo?.firstName || otherUser?.name?.split(' ')?.[0] || 'Partner';
  const partner2Pic: string | null = otherUser?.profilePic || otherUser?.personalInfo?.profilePic || null;
  const isCoupledProject = Array.isArray(project?.coupleUserIds) && project.coupleUserIds.length >= 2;
  const weddingDateValue =
    project?.weddingDate || user?.weddingProject?.weddingDate || new Date(Date.now() + 180 * 24 * 60 * 60 * 1000).toISOString();

  return {
    couple: {
      partner1,
      partner2,
      partner1Pic,
      partner2Pic,
      isCoupled: isCoupledProject,
      date: new Date(weddingDateValue).toISOString().split('T')[0],
      venue: project?.venueId ? 'Venue selected' : 'Venue planning in progress',
      // When coupled use partner's pic as hero bg if no dedicated cover photo
      heroImage: user?.coverPhoto || (isCoupledProject ? partner2Pic : null) || user?.profilePic || DEFAULT_WEDDING_HERO_IMAGE,
    },
    stats: {
      totalBudget: Number(budgetSummary?.data?.totalBudget || project?.totalBudget || 0),
      spentSoFar: Number(budgetSummary?.data?.totalSpent || 0),
      vendorsBooked: bookedVendors,
      totalVendors,
      checklistProgress: checklist.length > 0 ? Math.round((completedTasks / checklist.length) * 100) : 0,
      totalTasks: checklist.length,
    },
  };
}

export default function WeddingDashboard() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [activeTab, setActiveTab] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [weddingData, setWeddingData] = useState<any>(null);
  const [rawProject, setRawProject] = useState<any>(null);
  const [rawBudget, setRawBudget] = useState<any>(null);
  const [rawVendors, setRawVendors] = useState<any[]>([]);
  const [pendingInvite, setPendingInvite] = useState<{ inviterId: string; inviterName: string; inviterProfilePic: string | null } | null>(null);
  const [acceptingInvite, setAcceptingInvite] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [stopConfirm, setStopConfirm] = useState(false);
  // Onboarding quick-setup state
  const [setupDateOpen, setSetupDateOpen] = useState(false);
  const [setupBudgetOpen, setSetupBudgetOpen] = useState(false);
  const [setupDate, setSetupDate] = useState('');
  const [setupBudget, setSetupBudget] = useState('');
  const [savingSetup, setSavingSetup] = useState(false);
  const [onboardingDismissed, setOnboardingDismissed] = useState(() => {
    try { return localStorage.getItem('wedding_onboarding_dismissed') === '1'; } catch { return false; }
  });

  const { token, user } = useSelector((state: RootState) => state.auth);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [projectResponse, budgetResponse, vendorsResponse, pendingInviteData] = await Promise.all([
        weddingService.getProject(),
        weddingService.getBudget(),
        weddingService.getVendors(),
        weddingService.getPendingInvite().catch(() => null),
      ]);

      const project = projectResponse?.data;
      const budget = budgetResponse?.data;
      const vendorList = vendorsResponse?.data?.items || [];

      setRawProject(project);
      setRawBudget(budget);
      setRawVendors(vendorList);
      setPendingInvite(pendingInviteData);
      setWeddingData(
        buildWeddingDashboardData(project, budgetResponse, vendorsResponse, user)
      );
      setError(null);
    } catch (err) {
      console.error('Failed to load wedding details', err);
      setError('Failed to load wedding details. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleResetWedding = async () => {
    setResetting(true);
    try {
      await weddingService.resetWedding();
      setStopConfirm(false);
      setPendingInvite(null);
      // Reset onboarding so the next partner pairing starts fresh
      try { localStorage.removeItem('wedding_onboarding_dismissed'); } catch { /* ignore */ }
      setOnboardingDismissed(false);
      await fetchData();
      window.dispatchEvent(new CustomEvent('wedding:reset'));
    } catch (err) {
      console.error('Failed to reset wedding', err);
    } finally {
      setResetting(false);
    }
  };

  const handleAcceptInvite = async () => {
    if (!pendingInvite) return;
    setAcceptingInvite(true);
    try {
      await weddingService.acceptInvite(pendingInvite.inviterId);
      setPendingInvite(null);
      await fetchData();
      // Show a celebration popup for the acceptee too
      window.dispatchEvent(new CustomEvent('wedding:accepted', {
        detail: { inviterName: pendingInvite.inviterName },
      }));
    } catch (err) {
      console.error('Failed to accept invite', err);
    } finally {
      setAcceptingInvite(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchData();
      return;
    }
    setRawProject(null);
    setRawBudget(null);
    setRawVendors([]);
    setWeddingData(buildWeddingDashboardData(null, null, null, user));
    setLoading(false);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, user]);

  // Refresh when the inviter's partner accepts (socket event dispatched from MainLayout)
  useEffect(() => {
    const onPartnerAccepted = () => fetchData();
    const onReset = () => fetchData();
    window.addEventListener('wedding:partnerAccepted', onPartnerAccepted);
    window.addEventListener('wedding:reset', onReset);
    return () => {
      window.removeEventListener('wedding:partnerAccepted', onPartnerAccepted);
      window.removeEventListener('wedding:reset', onReset);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Real-time: refresh on all wedding socket events
  useEffect(() => {
    if (!token) return;
    const socket = connectSocket(token);
    const onRefresh = () => fetchData();
    socket.on('wedding_updated', onRefresh);
    socket.on('wedding_invite', onRefresh);    // invitee's dashboard refreshes when invite arrives
    socket.on('wedding_accepted', onRefresh);  // inviter's dashboard refreshes when accepted
    socket.on('wedding_reset', onRefresh);     // both dashboards refresh on dissolution
    return () => {
      socket.off('wedding_updated', onRefresh);
      socket.off('wedding_invite', onRefresh);
      socket.off('wedding_accepted', onRefresh);
      socket.off('wedding_reset', onRefresh);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const handleTabChange = (_: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  if (loading) return <WeddingSkeleton />;
  if (error) return <WeddingError error={error} onRetry={() => window.location.reload()} />;

  const { couple, stats } = weddingData;
  const daysToGo = Math.ceil((new Date(couple.date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
  const isOverBudget = stats.spentSoFar > stats.totalBudget;
  const isCoupled = Array.isArray(rawProject?.coupleUserIds) && rawProject.coupleUserIds.length >= 2;
  // True only for the person who SENT the invite — not for the one receiving it
  const currentUserId = String(user?.id || user?._id || '');
  const hasSentInvite =
    !isCoupled &&
    !pendingInvite &&  // invitee (who has an incoming invite) never sees this as their own outgoing invite
    rawProject?.pendingInvite?.status === 'pending' &&
    String(rawProject?.pendingInvite?.inviteeId) !== currentUserId; // guard: must not be the invitee

  return (
    <Container maxWidth="xl" sx={{ py: 4, pb: 10 }}>
      {/* Next-step banner: engaged but wedding project not yet linked */}
      {!pendingInvite && !isCoupled && !hasSentInvite && (
        <Alert
          icon={<Heart size={20} />}
          severity="success"
          sx={{
            mb: 3, borderRadius: 4, alignItems: 'center',
            bgcolor: '#FFF8E7', border: '1px solid #F0D88A',
            '& .MuiAlert-icon': { color: '#C9A84C' },
            '& .MuiAlert-message': { width: '100%' },
          }}
          action={
            <Button
              size="small"
              variant="contained"
              onClick={() => window.history.back()}
              sx={{ bgcolor: '#C9A84C', '&:hover': { bgcolor: '#A8883E' }, color: 'white', borderRadius: 3, fontWeight: 700, textTransform: 'none', px: 2, whiteSpace: 'nowrap' }}
            >
              Go to Messages
            </Button>
          }
        >
          <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#7A6020' }}>
            💎 You're engaged! Next step: invite your partner to plan together
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Go to your chat with your partner → tap the ❤️ button → send a Wedding Invite. Once they accept, you'll share this dashboard.
          </Typography>
        </Alert>
      )}

      {/* Pending Wedding Invite Banner */}
      {pendingInvite && (
        <Alert
          icon={<Heart size={20} />}
          severity="info"
          sx={{
            mb: 3, borderRadius: 4, alignItems: 'center',
            bgcolor: `${COLORS.primary}10`, border: `1px solid ${COLORS.primary}30`,
            '& .MuiAlert-icon': { color: COLORS.primary },
          }}
          action={
            <Stack direction="row" spacing={1}>
              <Button
                size="small"
                variant="contained"
                disabled={acceptingInvite}
                onClick={handleAcceptInvite}
                sx={{ bgcolor: COLORS.primary, borderRadius: 3, fontWeight: 700, textTransform: 'none', px: 2 }}
              >
                {acceptingInvite ? <CircularProgress size={16} color="inherit" /> : 'Accept'}
              </Button>
              <Button
                size="small"
                disabled={acceptingInvite}
                onClick={async () => {
                  try { await weddingService.resetWedding(); } catch { /* ignore */ }
                  setPendingInvite(null);
                }}
                sx={{ color: 'text.secondary', borderRadius: 3, fontWeight: 700, textTransform: 'none' }}
              >
                Decline
              </Button>
            </Stack>
          }
        >
          <Stack direction="row" spacing={1.5} alignItems="center">
            <Avatar src={pendingInvite.inviterProfilePic || undefined} sx={{ width: 32, height: 32, bgcolor: COLORS.primary, fontSize: 12 }}>
              {pendingInvite.inviterName?.[0]?.toUpperCase()}
            </Avatar>
            <Box>
              <Typography variant="subtitle2" sx={{ fontWeight: 800, color: COLORS.primary }}>
                {pendingInvite.inviterName} invited you to plan your wedding together!
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Accept to merge your wedding projects and start planning as a couple.
              </Typography>
            </Box>
          </Stack>
        </Alert>
      )}

      {/* ── Getting Started Onboarding (newly coupled, nothing set up yet) ── */}
      {isCoupled && !onboardingDismissed && stats.totalBudget === 0 && stats.totalTasks === 0 && (
        <Card sx={{ mb: 4, borderRadius: 4, border: '2px solid #C9A84C', bgcolor: '#FFFDF5', boxShadow: '0 4px 20px rgba(201,168,76,0.15)' }}>
          <CardContent sx={{ p: 3 }}>
            <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 2 }}>
              <Stack direction="row" alignItems="center" spacing={1.5}>
                <PartyPopper size={28} color="#C9A84C" />
                <Box>
                  <Typography variant="h6" sx={{ fontWeight: 800, color: '#7A6020', lineHeight: 1.1 }}>
                    You're planning together! 🎉
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Start with these 4 steps to get your wedding organised
                  </Typography>
                </Box>
              </Stack>
              <Tooltip title="Dismiss">
                <IconButton size="small" onClick={() => {
                  localStorage.setItem('wedding_onboarding_dismissed', '1');
                  setOnboardingDismissed(true);
                }}>
                  <XCircle size={18} color="#aaa" />
                </IconButton>
              </Tooltip>
            </Stack>

            <Grid container spacing={2}>
              {/* Step 1: Set wedding date */}
              <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                <Card
                  onClick={() => setSetupDateOpen(true)}
                  sx={{ borderRadius: 3, border: '1px solid #E8D9A0', cursor: 'pointer', transition: 'all 0.2s',
                    '&:hover': { borderColor: '#C9A84C', boxShadow: '0 4px 16px rgba(201,168,76,0.2)', transform: 'translateY(-2px)' } }}
                >
                  <CardContent sx={{ p: 2.5, textAlign: 'center' }}>
                    <Box sx={{ width: 48, height: 48, borderRadius: '50%', bgcolor: '#FFF8E7', display: 'flex', alignItems: 'center', justifyContent: 'center', mx: 'auto', mb: 1.5 }}>
                      <Calendar size={24} color="#C9A84C" />
                    </Box>
                    <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#7A6020', mb: 0.5 }}>Set Wedding Date</Typography>
                    <Typography variant="caption" color="text.secondary">Pick your big day</Typography>
                    <Box sx={{ mt: 1.5 }}>
                      <Chip label="Start" size="small" sx={{ bgcolor: '#C9A84C', color: 'white', fontWeight: 700, fontSize: '0.7rem' }} />
                    </Box>
                  </CardContent>
                </Card>
              </Grid>

              {/* Step 2: Set budget */}
              <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                <Card
                  onClick={() => setSetupBudgetOpen(true)}
                  sx={{ borderRadius: 3, border: '1px solid #E8D9A0', cursor: 'pointer', transition: 'all 0.2s',
                    '&:hover': { borderColor: '#C9A84C', boxShadow: '0 4px 16px rgba(201,168,76,0.2)', transform: 'translateY(-2px)' } }}
                >
                  <CardContent sx={{ p: 2.5, textAlign: 'center' }}>
                    <Box sx={{ width: 48, height: 48, borderRadius: '50%', bgcolor: '#FFF8E7', display: 'flex', alignItems: 'center', justifyContent: 'center', mx: 'auto', mb: 1.5 }}>
                      <DollarSign size={24} color="#C9A84C" />
                    </Box>
                    <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#7A6020', mb: 0.5 }}>Set Total Budget</Typography>
                    <Typography variant="caption" color="text.secondary">Define your spend limit</Typography>
                    <Box sx={{ mt: 1.5 }}>
                      <Chip label="Start" size="small" sx={{ bgcolor: '#C9A84C', color: 'white', fontWeight: 700, fontSize: '0.7rem' }} />
                    </Box>
                  </CardContent>
                </Card>
              </Grid>

              {/* Step 3: Add checklist tasks */}
              <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                <Card
                  onClick={() => setActiveTab(1)}
                  sx={{ borderRadius: 3, border: '1px solid #E8D9A0', cursor: 'pointer', transition: 'all 0.2s',
                    '&:hover': { borderColor: '#C9A84C', boxShadow: '0 4px 16px rgba(201,168,76,0.2)', transform: 'translateY(-2px)' } }}
                >
                  <CardContent sx={{ p: 2.5, textAlign: 'center' }}>
                    <Box sx={{ width: 48, height: 48, borderRadius: '50%', bgcolor: '#FFF8E7', display: 'flex', alignItems: 'center', justifyContent: 'center', mx: 'auto', mb: 1.5 }}>
                      <ClipboardList size={24} color="#C9A84C" />
                    </Box>
                    <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#7A6020', mb: 0.5 }}>Build Checklist</Typography>
                    <Typography variant="caption" color="text.secondary">Add tasks or use AI suggestions</Typography>
                    <Box sx={{ mt: 1.5 }}>
                      <Chip label="Go to Checklist" size="small" sx={{ bgcolor: '#C9A84C', color: 'white', fontWeight: 700, fontSize: '0.7rem' }} />
                    </Box>
                  </CardContent>
                </Card>
              </Grid>

              {/* Step 4: Browse vendors */}
              <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                <Card
                  onClick={() => setActiveTab(2)}
                  sx={{ borderRadius: 3, border: '1px solid #E8D9A0', cursor: 'pointer', transition: 'all 0.2s',
                    '&:hover': { borderColor: '#C9A84C', boxShadow: '0 4px 16px rgba(201,168,76,0.2)', transform: 'translateY(-2px)' } }}
                >
                  <CardContent sx={{ p: 2.5, textAlign: 'center' }}>
                    <Box sx={{ width: 48, height: 48, borderRadius: '50%', bgcolor: '#FFF8E7', display: 'flex', alignItems: 'center', justifyContent: 'center', mx: 'auto', mb: 1.5 }}>
                      <Store size={24} color="#C9A84C" />
                    </Box>
                    <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#7A6020', mb: 0.5 }}>Browse Vendors</Typography>
                    <Typography variant="caption" color="text.secondary">Photographers, venues & more</Typography>
                    <Box sx={{ mt: 1.5 }}>
                      <Chip label="Browse" size="small" sx={{ bgcolor: '#C9A84C', color: 'white', fontWeight: 700, fontSize: '0.7rem' }} />
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      )}

      {/* ── Set Wedding Date Dialog ── */}
      <Dialog open={setupDateOpen} onClose={() => !savingSetup && setSetupDateOpen(false)} maxWidth="xs" fullWidth PaperProps={{ sx: { borderRadius: 4 } }}>
        <DialogTitle sx={{ fontWeight: 800, display: 'flex', alignItems: 'center', gap: 1 }}>
          <Calendar size={20} color="#C9A84C" /> Set Your Wedding Date
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            This date will be shown on your shared dashboard and used to calculate your planning timeline.
          </Typography>
          <TextField
            fullWidth type="date" label="Wedding Date" value={setupDate}
            onChange={(e) => setSetupDate(e.target.value)}
            InputLabelProps={{ shrink: true }}
            inputProps={{ min: new Date().toISOString().split('T')[0] }}
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setSetupDateOpen(false)} disabled={savingSetup}>Cancel</Button>
          <Button variant="contained" disabled={!setupDate || savingSetup}
            onClick={async () => {
              setSavingSetup(true);
              try {
                await weddingService.updateProject({ weddingDate: setupDate });
                setSetupDateOpen(false);
                setSetupDate('');
                await fetchData();
              } catch { /* ignore */ } finally { setSavingSetup(false); }
            }}
            sx={{ bgcolor: '#C9A84C', '&:hover': { bgcolor: '#A8883E' } }}
          >
            {savingSetup ? <CircularProgress size={16} color="inherit" /> : 'Save Date'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* ── Set Budget Dialog ── */}
      <Dialog open={setupBudgetOpen} onClose={() => !savingSetup && setSetupBudgetOpen(false)} maxWidth="xs" fullWidth PaperProps={{ sx: { borderRadius: 4 } }}>
        <DialogTitle sx={{ fontWeight: 800, display: 'flex', alignItems: 'center', gap: 1 }}>
          <DollarSign size={20} color="#C9A84C" /> Set Total Budget
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Your total wedding budget in LKR. You can update this any time from the Budget tab.
          </Typography>
          <TextField
            fullWidth type="number" label="Total Budget (LKR)" value={setupBudget}
            onChange={(e) => setSetupBudget(e.target.value)}
            InputProps={{ startAdornment: <InputAdornment position="start">LKR</InputAdornment> }}
            inputProps={{ min: 0 }}
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setSetupBudgetOpen(false)} disabled={savingSetup}>Cancel</Button>
          <Button variant="contained" disabled={!setupBudget || Number(setupBudget) <= 0 || savingSetup}
            onClick={async () => {
              setSavingSetup(true);
              try {
                await weddingService.updateProject({ totalBudget: Number(setupBudget) });
                setSetupBudgetOpen(false);
                setSetupBudget('');
                await fetchData();
              } catch { /* ignore */ } finally { setSavingSetup(false); }
            }}
            sx={{ bgcolor: '#C9A84C', '&:hover': { bgcolor: '#A8883E' } }}
          >
            {savingSetup ? <CircularProgress size={16} color="inherit" /> : 'Save Budget'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Hero Section */}
      <MotionBox
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        sx={{ 
          position: 'relative', 
          borderRadius: 8, 
          overflow: 'hidden', 
          mb: 6,
          height: { xs: 300, md: 400 },
          boxShadow: '0 20px 40px rgba(0,0,0,0.1)'
        }}
      >
        {/* Hero background — split when coupled, single photo otherwise */}
        {couple.isCoupled && couple.partner2Pic ? (
          <Box sx={{ width: '100%', height: '100%', display: 'flex' }}>
            <Box
              component="img"
              src={couple.partner1Pic || DEFAULT_WEDDING_HERO_IMAGE}
              sx={{ width: '50%', height: '100%', objectFit: 'cover', objectPosition: 'center top' }}
              referrerPolicy="no-referrer"
            />
            <Box
              component="img"
              src={couple.partner2Pic}
              sx={{ width: '50%', height: '100%', objectFit: 'cover', objectPosition: 'center top' }}
              referrerPolicy="no-referrer"
            />
          </Box>
        ) : (
          <Box
            component="img"
            src={couple.heroImage}
            sx={{ width: '100%', height: '100%', objectFit: 'cover' }}
            referrerPolicy="no-referrer"
          />
        )}
        <Box sx={{ 
          position: 'absolute', 
          inset: 0, 
          background: 'linear-gradient(to top, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.35) 55%, rgba(0,0,0,0.1) 100%)',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'flex-end',
          p: { xs: 3, md: 6 }
        }}>
          {/* Couple avatars + names */}
          <Stack direction="row" alignItems="center" spacing={{ xs: 1.5, md: 3 }} sx={{ mb: 1.5 }}>
            {/* Partner 1 */}
            <Stack alignItems="center" spacing={0.5}>
              <Avatar
                src={couple.partner1Pic || undefined}
                sx={{
                  width: { xs: 56, md: 80 },
                  height: { xs: 56, md: 80 },
                  border: '3px solid rgba(255,255,255,0.9)',
                  boxShadow: '0 4px 16px rgba(0,0,0,0.4)',
                  bgcolor: COLORS.primary,
                  fontSize: { xs: '1.4rem', md: '2rem' },
                }}
              >
                {couple.partner1[0]?.toUpperCase()}
              </Avatar>
              <Typography variant="h5" sx={{
                fontFamily: 'Playfair Display',
                fontWeight: 700,
                color: 'white',
                fontSize: { xs: '1.4rem', md: '2.2rem' },
                textShadow: '0 2px 8px rgba(0,0,0,0.6)',
              }}>
                {couple.partner1}
              </Typography>
            </Stack>

            <Stack alignItems="center" spacing={0.5} sx={{ pb: { xs: 3, md: 5 } }}>
              <Heart size={isMobile ? 22 : 32} fill={COLORS.secondary} color={COLORS.secondary} />
            </Stack>

            {/* Partner 2 */}
            <Stack alignItems="center" spacing={0.5}>
              <Avatar
                src={couple.partner2Pic || undefined}
                sx={{
                  width: { xs: 56, md: 80 },
                  height: { xs: 56, md: 80 },
                  border: '3px solid rgba(255,255,255,0.9)',
                  boxShadow: '0 4px 16px rgba(0,0,0,0.4)',
                  bgcolor: COLORS.accent,
                  fontSize: { xs: '1.4rem', md: '2rem' },
                }}
              >
                {couple.partner2[0]?.toUpperCase()}
              </Avatar>
              <Typography variant="h5" sx={{
                fontFamily: 'Playfair Display',
                fontWeight: 700,
                color: 'white',
                fontSize: { xs: '1.4rem', md: '2.2rem' },
                textShadow: '0 2px 8px rgba(0,0,0,0.6)',
              }}>
                {couple.partner2}
              </Typography>
            </Stack>
          </Stack>
          
          <Stack direction={{ xs: 'column', md: 'row' }} spacing={{ xs: 1, md: 4 }} alignItems={{ xs: 'flex-start', md: 'center' }}>
            <Stack direction="row" spacing={1} alignItems="center" sx={{ color: 'rgba(255,255,255,0.9)' }}>
              <Calendar size={18} />
              <Typography variant="h6" sx={{ fontWeight: 600 }}>{new Date(couple.date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</Typography>
              <Chip 
                label={`${daysToGo} days to go`} 
                size="small" 
                sx={{ bgcolor: COLORS.secondary, color: COLORS.primary, fontWeight: 700, ml: 2 }} 
              />
            </Stack>
            <Stack direction="row" spacing={1} alignItems="center" sx={{ color: 'rgba(255,255,255,0.9)' }}>
              <MapPin size={18} />
              <Typography variant="body1">{couple.venue}</Typography>
            </Stack>
          </Stack>
        </Box>
      </MotionBox>

      {/* ── Planning Controls bar (only when coupled) ── */}
      {(isCoupled || hasSentInvite) && (
        <AnimatePresence>
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.3 }}
          >
            <Box
              sx={{
                mb: 4, px: 3, py: 2,
                borderRadius: 4,
                bgcolor: '#FAFAFA',
                border: '1px solid rgba(0,0,0,0.07)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: 2,
              }}
            >
              <Stack direction="row" alignItems="center" spacing={1.5}>
                <Heart size={18} color="#C9A84C" fill="#C9A84C" />
                <Typography variant="body2" sx={{ fontWeight: 600, color: 'text.secondary' }}>
                  {isCoupled ? `Planning with ${couple.partner2}` : 'Invitation pending…'}
                </Typography>
              </Stack>

              <Stack direction="row" spacing={1.5} flexWrap="wrap">
                {/* Show getting started guide again */}
                {isCoupled && (
                  <Button
                    size="small"
                    variant="outlined"
                    startIcon={<Sparkles size={14} />}
                    onClick={() => {
                      try { localStorage.removeItem('wedding_onboarding_dismissed'); } catch { /* ignore */ }
                      setOnboardingDismissed(false);
                    }}
                    sx={{
                      borderRadius: 3, textTransform: 'none', fontWeight: 700,
                      borderColor: '#C9A84C', color: '#7A6020',
                      '&:hover': { bgcolor: '#FFF8E7', borderColor: '#A8883E' },
                    }}
                  >
                    Show Setup Guide
                  </Button>
                )}

                {/* Stop planning together */}
                {!stopConfirm ? (
                  <Button
                    size="small"
                    variant="outlined"
                    color="error"
                    startIcon={<XCircle size={14} />}
                    onClick={() => setStopConfirm(true)}
                    sx={{ borderRadius: 3, textTransform: 'none', fontWeight: 700 }}
                  >
                    {isCoupled ? 'Stop Planning Together' : 'Cancel Invitation'}
                  </Button>
                ) : (
                  <Stack direction="row" spacing={1} alignItems="center">
                    <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600 }}>
                      Are you sure?
                    </Typography>
                    <Button
                      size="small"
                      variant="contained"
                      color="error"
                      disabled={resetting}
                      onClick={handleResetWedding}
                      sx={{ borderRadius: 3, textTransform: 'none', fontWeight: 700, minWidth: 80 }}
                    >
                      {resetting ? <CircularProgress size={14} color="inherit" /> : 'Yes, stop'}
                    </Button>
                    <Button
                      size="small"
                      variant="text"
                      disabled={resetting}
                      onClick={() => setStopConfirm(false)}
                      sx={{ borderRadius: 3, textTransform: 'none', fontWeight: 700 }}
                    >
                      Keep
                    </Button>
                  </Stack>
                )}
              </Stack>
            </Box>
          </motion.div>
        </AnimatePresence>
      )}

      {/* Stat Cards */}
      <Grid container spacing={3} sx={{ mb: 6 }}>
        <StatCard 
          title="Total Budget" 
          value={`LKR ${stats.totalBudget.toLocaleString()}`} 
          icon={<DollarSign size={24} />} 
          color={COLORS.primary}
          action={<IconButton size="small"><Edit3 size={16} /></IconButton>}
          delay={0.1}
        />
        <StatCard 
          title="Spent So Far" 
          value={`LKR ${stats.spentSoFar.toLocaleString()}`} 
          icon={<TrendingUp size={24} />} 
          color={isOverBudget ? COLORS.error : COLORS.success}
          subtitle={isOverBudget ? "Over Budget" : "Under Budget"}
          delay={0.2}
        />
        <StatCard 
          title="Vendors Booked" 
          value={`${stats.vendorsBooked}/${stats.totalVendors}`} 
          icon={<Store size={24} />} 
          color={COLORS.accent}
          progress={(stats.vendorsBooked / stats.totalVendors) * 100}
          delay={0.3}
        />
        <StatCard 
          title="Checklist Progress" 
          value={`${stats.checklistProgress}/${stats.totalTasks}`} 
          icon={<ClipboardList size={24} />} 
          color={COLORS.secondary}
          progress={(stats.checklistProgress / stats.totalTasks) * 100}
          delay={0.4}
        />
      </Grid>

      {/* Navigation Tabs */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 4 }}>
        <Tabs 
          value={activeTab} 
          onChange={handleTabChange} 
          variant={isMobile ? "scrollable" : "fullWidth"}
          scrollButtons="auto"
          sx={{
            '& .MuiTabs-indicator': { bgcolor: COLORS.primary, height: 3 },
            '& .MuiTab-root': { 
              textTransform: 'none', 
              fontWeight: 700, 
              fontSize: '1rem',
              color: COLORS.textSecondary,
              '&.Mui-selected': { color: COLORS.primary }
            }
          }}
        >
          <Tab icon={<LayoutDashboard size={18} />} iconPosition="start" label="Overview" />
          <Tab icon={<ClipboardList size={18} />} iconPosition="start" label="Checklist" />
          <Tab icon={<Store size={18} />} iconPosition="start" label="Vendors" />
          <Tab icon={<BarChart3 size={18} />} iconPosition="start" label="Budget" />
          <Tab icon={<Milestone size={18} />} iconPosition="start" label="Timeline" />
        </Tabs>
      </Box>

      {/* Tab Content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, x: 10 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -10 }}
          transition={{ duration: 0.3 }}
        >
          {activeTab === 0 && <OverviewTab data={weddingData} onSwitchTab={setActiveTab} project={rawProject} budget={rawBudget} />}
          {activeTab === 1 && <ChecklistTab checklist={rawProject?.checklist || []} onChecklistChange={(updated) => setRawProject((p: any) => ({ ...p, checklist: updated }))} />}
          {activeTab === 2 && <VendorTab vendors={rawVendors} bookedVendorIds={rawProject?.vendors || []} onStatusChange={fetchData} />}
          {activeTab === 3 && <BudgetTab totalBudget={rawBudget?.totalBudget || rawProject?.totalBudget || 0} totalSpent={rawBudget?.totalSpent || 0} expenses={rawProject?.expenses || []} onExpenseAdded={fetchData} />}
          {activeTab === 4 && <TimelineTab weddingDate={rawProject?.weddingDate || couple.date} />}
        </motion.div>
      </AnimatePresence>

      {/* Reset / Cancel Wedding Confirmation Dialog — removed, inline confirm used instead */}
    </Container>
  );
}

// --- Helper Components ---

function StatCard({ title, value, icon, color, subtitle, action, progress, delay }: any) {
  return (
    <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
      <MotionBox
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay, duration: 0.5 }}
      >
        <Card sx={{ 
          borderRadius: 6, 
          border: '1px solid', 
          borderColor: 'divider',
          boxShadow: '0 4px 20px rgba(0,0,0,0.03)',
          height: '100%'
        }}>
          <CardContent sx={{ p: 3 }}>
            <Stack direction="row" justifyContent="space-between" alignItems="flex-start" sx={{ mb: 2 }}>
              <Box sx={{ 
                p: 1.5, 
                borderRadius: 4, 
                bgcolor: `${color}10`, 
                color: color,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                {icon}
              </Box>
              {action}
            </Stack>
            <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600, display: 'block', mb: 0.5 }}>
              {title}
            </Typography>
            <Typography variant="h5" sx={{ fontWeight: 800, color: COLORS.textPrimary, mb: 1 }}>
              {value}
            </Typography>
            {subtitle && (
              <Typography variant="caption" sx={{ color: color, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 0.5 }}>
                {color === COLORS.error ? <AlertCircle size={12} /> : <CheckCircle2 size={12} />}
                {subtitle}
              </Typography>
            )}
            {progress !== undefined && (
              <Box sx={{ mt: 2 }}>
                <LinearProgress 
                  variant="determinate" 
                  value={progress} 
                  sx={{ 
                    height: 6, 
                    borderRadius: 3, 
                    bgcolor: `${color}10`,
                    '& .MuiLinearProgress-bar': { bgcolor: color }
                  }} 
                />
              </Box>
            )}
          </CardContent>
        </Card>
      </MotionBox>
    </Grid>
  );
}

function WeddingSkeleton() {
  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Skeleton variant="rectangular" height={400} sx={{ borderRadius: 8, mb: 6 }} />
      <Grid container spacing={3} sx={{ mb: 6 }}>
        {[...Array(4)].map((_, i) => (
          <Grid size={{ xs: 12, sm: 6, lg: 3 }} key={i}>
            <Skeleton variant="rectangular" height={160} sx={{ borderRadius: 6 }} />
          </Grid>
        ))}
      </Grid>
      <Skeleton variant="text" height={60} sx={{ mb: 4 }} />
      <Skeleton variant="rectangular" height={600} sx={{ borderRadius: 6 }} />
    </Container>
  );
}

function WeddingError({ error, onRetry }: { error: string, onRetry: () => void }) {
  return (
    <Container sx={{ py: 12, textAlign: 'center' }}>
      <AlertCircle size={64} color={COLORS.error} style={{ marginBottom: 24 }} />
      <Typography variant="h5" sx={{ mb: 2, fontWeight: 700 }}>Oops! Something went wrong</Typography>
      <Typography variant="body1" sx={{ color: 'text.secondary', mb: 4 }}>{error}</Typography>
      <Button variant="contained" onClick={onRetry} sx={{ bgcolor: COLORS.primary }}>
        Try Again
      </Button>
    </Container>
  );
}

const MotionBox = motion(Box);

