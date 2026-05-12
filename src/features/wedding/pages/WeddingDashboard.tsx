import React, { useState, useEffect, useCallback, useRef } from 'react';
import { 
  Box, Container, Typography, Grid, Card, CardContent, 
  Tabs, Tab, Button, Stack, Avatar, IconButton, 
  LinearProgress, useTheme, useMediaQuery, Skeleton,
  Tooltip, Badge, Alert, CircularProgress, Chip,
  Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, InputAdornment, Backdrop
} from '@mui/material';
import { 
  Heart, Calendar, MapPin, Edit3, Camera, 
  CheckCircle2, DollarSign, Users, LayoutDashboard,
  ClipboardList, Store, BarChart3, Milestone,
  TrendingUp, AlertCircle, Plus, Sparkles,
  ChevronRight, ArrowRight, XCircle, PartyPopper, Trash2, FileText
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { RootState } from '@/app/store/store';
import weddingService from '../services/weddingService';
import { connectSocket } from '@/shared/hooks/useRealtimeUpdates';
import { generateWeddingReport } from '../utils/weddingReportGenerator';

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

const ONBOARDING_STEPS_KEY = 'wedding_onboarding_steps';
const ONBOARDING_DISMISSED_KEY = 'wedding_onboarding_dismissed';
const emptyOnboardingSteps = {
  date: false,
  budget: false,
  checklist: false,
  vendors: false,
};

const handleFormatNumber = (val: string) => {
  if (!val) return '';
  const rawValue = val.replace(/\D/g, '');
  if (!rawValue) return '';
  return Number(rawValue).toLocaleString('en-US');
};

function buildCoupleOnboardingKey(project: any) {
  const ids = Array.isArray(project?.coupleUserIds)
    ? project.coupleUserIds
        .map((u: any) => String(typeof u === 'object' ? (u?._id || u?.id || '') : u || ''))
        .filter(Boolean)
        .sort()
    : [];
  return ids.length >= 2 ? ids.join(':') : null;
}

function buildWeddingDashboardData(project: any, budgetSummary: any, vendorsPayload: any, user: any) {
  const checklist = Array.isArray(project?.checklist) ? project.checklist.filter(Boolean) : [];
  const bookedVendors = Array.isArray(project?.vendors)
    ? project.vendors.filter((entry: any) => entry && ['requested', 'booked'].includes(entry?.status)).length
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

  const venueName =
    typeof project?.venueId === 'object'
      ? project?.venueId?.businessName || project?.venueId?.name || null
      : null;
  return {
    couple: {
      partner1,
      partner2,
      partner1Pic,
      partner2Pic,
      isCoupled: isCoupledProject,
      date: new Date(weddingDateValue).toISOString().split('T')[0],
      venue: venueName || (project?.venueId ? 'Venue selected' : 'Venue planning in progress'),
      // Always use the same default cover image for consistent UX/privacy.
      heroImage: DEFAULT_WEDDING_HERO_IMAGE,
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
  const todayDateString = new Date().toISOString().split('T')[0];
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState(0);
  const [loading, setLoading] = useState(true);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [weddingData, setWeddingData] = useState<any>(null);
  const [rawProject, setRawProject] = useState<any>(null);
  const [rawBudget, setRawBudget] = useState<any>(null);
  const [rawVendors, setRawVendors] = useState<any[]>([]);
  const [pendingInvite, setPendingInvite] = useState<{ inviterId: string; inviterName: string; inviterProfilePic: string | null } | null>(null);
  const [acceptingInvite, setAcceptingInvite] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [resetDialogOpen, setResetDialogOpen] = useState(false);
  const [globalLoading, setGlobalLoading] = useState({ open: false, message: '' });
  // Onboarding quick-setup state
  const [setupDateOpen, setSetupDateOpen] = useState(false);
  const [setupBudgetOpen, setSetupBudgetOpen] = useState(false);
  const [setupDate, setSetupDate] = useState('');
  const [setupBudget, setSetupBudget] = useState('');
  const [savingSetup, setSavingSetup] = useState(false);
  const [onboardingDismissed, setOnboardingDismissed] = useState(false);
  const [onboardingSteps, setOnboardingSteps] = useState(emptyOnboardingSteps);
  const [onboardingCoupleKey, setOnboardingCoupleKey] = useState<string | null>(null);
  const [planningAccessGranted, setPlanningAccessGranted] = useState(false);
  const wasCoupledRef = useRef(false);
  const tabsAnchorRef = useRef<HTMLDivElement | null>(null);

  const [editBudgetOpen, setEditBudgetOpen] = useState(false);
  const [editBudgetValue, setEditBudgetValue] = useState('');
  const [savingBudget, setSavingBudget] = useState(false);
  const [accessNoticeTick, setAccessNoticeTick] = useState(0);

  const { token, user } = useSelector((state: RootState) => state.auth);

  const fetchData = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const [projectResponse, budgetResponse, vendorsResponse, pendingInviteData] = await Promise.all([
        weddingService.getProject().catch(() => ({ data: null })),
        weddingService.getBudget().catch(() => ({ data: null })),
        weddingService.getVendors().catch(() => ({ data: { items: [] } })),
        weddingService.getPendingInvite().catch(() => null),
      ]);

      const project = projectResponse?.data;
      const budget = budgetResponse?.data;
      const vendorList = vendorsResponse?.data?.items || [];

      setRawProject(project);
      setRawBudget(budget);
      setRawVendors(vendorList);
      setPendingInvite(pendingInviteData);
      
      if (project) {
        const couples = project.coupleUserIds || [];
        const isCoupled = couples.length >= 2;
        setPlanningAccessGranted(isCoupled);
      }

      setWeddingData(
        buildWeddingDashboardData(project, budgetResponse, vendorsResponse, user)
      );
      setError(null);
    } catch (err) {
      console.error('Failed to load wedding details', err);
      if (!silent) {
        setError('Failed to load wedding details. Please try again.');
      }
    } finally {
      setLoading(false);
      setIsInitialLoad(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  // Lightweight partial refresh helpers — update local state only, no full page reload
  const refreshBudget = useCallback(async () => {
    try {
      const budgetResponse = await weddingService.getBudget();
      const budget = budgetResponse?.data;
      setRawBudget(budget);
      
      // Also update project if it contains budget info
      if (budget?.expenses) {
        setRawProject((prev: any) => prev ? { ...prev, expenses: budget.expenses, totalBudget: budget.totalBudget } : prev);
      }

      setWeddingData((prev: any) => prev ? {
        ...prev,
        stats: { 
          ...prev.stats, 
          totalBudget: Number(budget?.totalBudget || 0), 
          spentSoFar: Number(budget?.totalSpent || 0) 
        }
      } : prev);
    } catch (err) {
      console.warn('Failed to refresh budget', err);
    }
  }, []);

  const refreshChecklist = useCallback(async () => {
    try {
      const projectResponse = await weddingService.getProject();
      const checklist = projectResponse?.data?.checklist || [];
      setRawProject((p: any) => ({ ...p, checklist }));
      setWeddingData((prev: any) => {
        if (!prev) return prev;
        const completedTasks = checklist.filter((item: any) => item?.completed).length;
        return {
          ...prev,
          stats: {
            ...prev.stats,
            checklistProgress: checklist.length > 0 ? Math.round((completedTasks / checklist.length) * 100) : 0,
            totalTasks: checklist.length,
          },
        };
      });
    } catch { /* silent */ }
  }, []);

  const refreshVendors = useCallback(async () => {
    try {
      const projectResponse = await weddingService.getProject();
      const project = projectResponse?.data || {};
      const vendors = projectResponse?.data?.vendors || [];
      const bookedVendors = Array.isArray(vendors)
        ? vendors.filter((entry: any) => ['requested', 'booked'].includes(entry?.status)).length
        : 0;
      const venueName =
        typeof project?.venueId === 'object'
          ? project?.venueId?.businessName || project?.venueId?.name || null
          : null;

      setRawProject((p: any) => ({ ...p, vendors, venueId: project?.venueId }));
      setWeddingData((prev: any) => prev ? {
        ...prev,
        couple: {
          ...prev.couple,
          venue: venueName || (project?.venueId ? 'Venue selected' : 'Venue planning in progress'),
        },
        stats: {
          ...prev.stats,
          vendorsBooked: bookedVendors,
        },
      } : prev);
    } catch { /* silent */ }
  }, []);

  const handleResetWedding = async () => {
    setResetting(true);
    setGlobalLoading({ open: true, message: 'Resetting wedding plan...' });
    try {
      await weddingService.resetWedding();
      setResetDialogOpen(false);
      setPendingInvite(null);
      // Reset onboarding so the next partner pairing starts fresh
      try {
        if (onboardingCoupleKey) {
          localStorage.removeItem(`${ONBOARDING_DISMISSED_KEY}:${onboardingCoupleKey}`);
          localStorage.removeItem(`${ONBOARDING_STEPS_KEY}:${onboardingCoupleKey}`);
        }
      } catch { /* ignore */ }
      setOnboardingDismissed(false);
      setOnboardingSteps(emptyOnboardingSteps);
      setOnboardingCoupleKey(null);
      
      // Force a clean state before fetching new solo data
      setPlanningAccessGranted(false);
      await fetchData();
      
      window.dispatchEvent(new CustomEvent('wedding:reset'));
    } catch (err) {
      console.error('Failed to reset wedding', err);
    } finally {
      setResetting(false);
      setGlobalLoading({ open: false, message: '' });
    }
  };

  const handleAcceptInvite = async () => {
    if (!pendingInvite) return;
    setAcceptingInvite(true);
    setGlobalLoading({ open: true, message: 'Accepting invitation...' });
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
      setGlobalLoading({ open: false, message: '' });
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

  useEffect(() => {
    const isCoupledProject = Array.isArray(rawProject?.coupleUserIds) && rawProject.coupleUserIds.length >= 2;
    if (!isCoupledProject) {
      wasCoupledRef.current = false;
      setOnboardingCoupleKey(null);
      setOnboardingDismissed(false);
      setOnboardingSteps(emptyOnboardingSteps);
      return;
    }

    const key = buildCoupleOnboardingKey(rawProject);
    if (!key) return;

    const justBecameCoupled = !wasCoupledRef.current;
    wasCoupledRef.current = true;

    if (justBecameCoupled) {
      try {
        localStorage.removeItem(`${ONBOARDING_DISMISSED_KEY}:${key}`);
        localStorage.removeItem(`${ONBOARDING_STEPS_KEY}:${key}`);
      } catch { /* ignore */ }
      setOnboardingCoupleKey(key);
      setOnboardingDismissed(false);
      setOnboardingSteps(emptyOnboardingSteps);
      return;
    }

    setOnboardingCoupleKey(key);

    try {
      const dismissedRaw = localStorage.getItem(`${ONBOARDING_DISMISSED_KEY}:${key}`);
      const stepsRaw = localStorage.getItem(`${ONBOARDING_STEPS_KEY}:${key}`);
      const parsed = stepsRaw ? JSON.parse(stepsRaw) : null;

      setOnboardingDismissed(dismissedRaw === '1');
      setOnboardingSteps({
        date: Boolean(parsed?.date),
        budget: Boolean(parsed?.budget),
        checklist: Boolean(parsed?.checklist),
        vendors: Boolean(parsed?.vendors),
      });
    } catch {
      setOnboardingDismissed(false);
      setOnboardingSteps(emptyOnboardingSteps);
    }
  }, [rawProject]);

  // Refresh when the inviter's partner accepts (socket event dispatched from MainLayout)
  useEffect(() => {
    const onPartnerAccepted = () => fetchData(true);
    const onReset = () => {
      setRawProject(null);
      setRawBudget(null);
      setRawVendors([]);
      setWeddingData(buildWeddingDashboardData(null, null, null, user));
      setPlanningAccessGranted(false);
      fetchData(true);
    };
    const onAppRefresh = () => fetchData(true);
    window.addEventListener('wedding:partnerAccepted', onPartnerAccepted);
    window.addEventListener('wedding:reset', onReset);
    window.addEventListener('app:refresh', onAppRefresh);
    return () => {
      window.removeEventListener('wedding:partnerAccepted', onPartnerAccepted);
      window.removeEventListener('wedding:reset', onReset);
      window.removeEventListener('app:refresh', onAppRefresh);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchDataFromPartner = useCallback(() => {
    // Always refresh all data when a partner makes a change to ensure both ends are perfectly in sync
    fetchData(true);
  }, [fetchData]);

  // Real-time: refresh on all wedding socket events
  useEffect(() => {
    if (!token) return;
    const socket = connectSocket(token);
    socket.on('wedding_updated', fetchDataFromPartner);
    socket.on('wedding_invite', () => fetchData(true));    // invitee's dashboard refreshes when invite arrives
    socket.on('wedding_accepted', () => fetchData(true));  // inviter's dashboard refreshes when accepted
    socket.on('wedding_reset', () => fetchData(true));     // both dashboards refresh on dissolution
    // Vendor accepts/declines a quote — update the booked vendors section silently
    socket.on('quote_request_updated', () => refreshVendors());
    return () => {
      socket.off('wedding_updated', fetchDataFromPartner);
      socket.off('wedding_invite', fetchData);
      socket.off('wedding_accepted', fetchData);
      socket.off('wedding_reset', fetchData);
      socket.off('quote_request_updated');
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, fetchDataFromPartner]);

  // Listen for quote submission to refresh budget and AI tip in real-time
  useEffect(() => {
    const handleQuoteSubmitted = () => {
      fetchData(true); // silent refresh so AI Budget Tip updates in real-time
    };
    window.addEventListener('wedding:quote_submitted', handleQuoteSubmitted);
    return () => window.removeEventListener('wedding:quote_submitted', handleQuoteSubmitted);
  }, [fetchData]);

  const handleTabChange = (_: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  const handleDownloadReport = () => {
    if (!weddingData) return;
    
    setGlobalLoading({ open: true, message: 'Generating Wedding Report...' });
    
    try {
      const reportData = {
        couple: {
          partner1: weddingData.couple.partner1,
          partner2: weddingData.couple.partner2,
          date: weddingData.couple.date,
        },
        stats: {
          totalBudget: weddingData.stats.totalBudget,
          totalSpent: weddingData.stats.totalSpent,
          remaining: weddingData.stats.totalBudget - weddingData.stats.totalSpent,
          progress: weddingData.stats.overallProgress,
          daysLeft: weddingData.stats.daysLeft,
        },
        expenses: rawProject?.expenses || [],
        checklist: rawProject?.checklist || [],
      };
      
      generateWeddingReport(reportData);
    } catch (err) {
      console.error('PDF generation failed:', err);
    } finally {
      setGlobalLoading({ open: false, message: '' });
    }
  };

  const handleSwitchTabFromOverview = (tabIndex: number) => {
    setActiveTab(tabIndex);
  };

  const markOnboardingStep = useCallback((step: keyof typeof emptyOnboardingSteps) => {
    setOnboardingSteps((prev) => {
      if (prev[step]) return prev;
      const next = { ...prev, [step]: true };
      try {
        if (onboardingCoupleKey) {
          localStorage.setItem(`${ONBOARDING_STEPS_KEY}:${onboardingCoupleKey}`, JSON.stringify(next));
        }
      } catch { /* ignore */ }
      const allClicked = Object.values(next).every(Boolean);
      if (allClicked) {
        try {
          if (onboardingCoupleKey) {
            localStorage.setItem(`${ONBOARDING_DISMISSED_KEY}:${onboardingCoupleKey}`, '1');
          }
        } catch { /* ignore */ }
        setOnboardingDismissed(true);
      }
      return next;
    });
  }, [onboardingCoupleKey]);

  const goToTabFromOnboarding = useCallback((tabIndex: number, step: keyof typeof emptyOnboardingSteps) => {
    markOnboardingStep(step);
    setActiveTab(tabIndex);
    requestAnimationFrame(() => {
      tabsAnchorRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  }, [markOnboardingStep]);

  if (loading && isInitialLoad) return <WeddingSkeleton />;
  if (error) return <WeddingError error={error} onRetry={() => window.location.reload()} />;

  const { couple, stats } = weddingData;
  const daysToGo = Math.ceil((new Date(couple.date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
  const isOverBudget = stats.spentSoFar > stats.totalBudget;
  const isCoupled = Array.isArray(rawProject?.coupleUserIds) && rawProject.coupleUserIds.length >= 2;
  const hasPartner1HeroPic = Boolean(couple.partner1Pic);
  const hasPartner2HeroPic = Boolean(couple.partner2Pic);
  const useSplitHeroCover = Boolean(isCoupled && (hasPartner1HeroPic || hasPartner2HeroPic));
  // True only for the person who SENT the invite — not for the one receiving it
  const currentUserId = String(user?.id || user?._id || '');
  const hasSentInvite =
    !isCoupled &&
    !pendingInvite &&  // invitee (who has an incoming invite) never sees this as their own outgoing invite
    rawProject?.pendingInvite?.status === 'pending' &&
    rawProject?.pendingInvite?.inviteeId != null &&              // guard: must have a real invitee (not a default null)
    String(rawProject?.pendingInvite?.inviteeId) !== currentUserId; // guard: must not be the invitee

  return (
    <Container maxWidth="xl" sx={{ py: 4, pb: 10 }}>
      {/* Page Title & Actions */}
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 4 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 900, color: COLORS.primary, fontFamily: 'Playfair Display', letterSpacing: -0.5 }}>
            Wedding Planner
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Manage your budget, checklist, and vendors in one place.
          </Typography>
        </Box>
        {isMobile && (
          <Tooltip title="Download PDF Report">
            <IconButton 
              onClick={handleDownloadReport}
              sx={{ color: COLORS.primary, bgcolor: `${COLORS.primary}10`, '&:hover': { bgcolor: `${COLORS.primary}20` } }}
            >
              <FileText size={24} />
            </IconButton>
          </Tooltip>
        )}
      </Stack>
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
                sx={{ bgcolor: COLORS.primary, borderRadius: 3, fontWeight: 700, textTransform: 'none', px: 2, minWidth: 92, minHeight: 32 }}
              >
                {acceptingInvite ? <CircularProgress size={16} color="inherit" /> : 'Accept'}
              </Button>
              <Button
                size="small"
                disabled={acceptingInvite || globalLoading.open}
                onClick={async () => {
                  setGlobalLoading({ open: true, message: 'Declining invitation...' });
                  try { await weddingService.resetWedding(); } catch { /* ignore */ }
                  setPendingInvite(null);
                  setGlobalLoading({ open: false, message: '' });
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

      {!planningAccessGranted && (
        <Alert
          key={accessNoticeTick}
          severity="warning"
          sx={{
            mb: 3,
            borderRadius: 4,
            border: '1px solid #F0D88A',
            bgcolor: '#FFF9EC',
          }}
        >
          <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#7A6020' }}>
            Editing is locked until both partners accept wedding planning together.
          </Typography>
          <Typography variant="caption" color="text.secondary">
            You can view the overview now. Checklist, vendors, budget, and timeline will unlock after mutual acceptance.
          </Typography>
        </Alert>
      )}

      {/* ── Getting Started Onboarding (newly coupled, nothing set up yet) ── */}
      {isCoupled && !onboardingDismissed && (
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
                    if (onboardingCoupleKey) {
                      localStorage.setItem(`${ONBOARDING_DISMISSED_KEY}:${onboardingCoupleKey}`, '1');
                    }
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
                  onClick={() => {
                    markOnboardingStep('date');
                    setSetupDateOpen(true);
                  }}
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
                  onClick={() => {
                    markOnboardingStep('budget');
                    setSetupBudgetOpen(true);
                  }}
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
                  onClick={() => goToTabFromOnboarding(1, 'checklist')}
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
                  onClick={() => goToTabFromOnboarding(2, 'vendors')}
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
            inputProps={{ min: todayDateString }}
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setSetupDateOpen(false)} disabled={savingSetup}>Cancel</Button>
          <Button variant="contained" disabled={!setupDate || savingSetup}
            onClick={async () => {
              if (setupDate < todayDateString) {
                setError('Wedding date must be today or a future date.');
                return;
              }

              setGlobalLoading({ open: true, message: 'Saving Wedding Date...' });
              try {
                await weddingService.updateProject({ weddingDate: setupDate });
                setSetupDateOpen(false);
                setSetupDate('');
                setRawProject((prev: any) => prev ? ({ ...prev, weddingDate: setupDate }) : prev);
                setWeddingData((prev: any) => prev ? ({
                  ...prev,
                  couple: {
                    ...prev.couple,
                    date: setupDate,
                  },
                }) : prev);
              } catch { /* ignore */ } finally { setGlobalLoading({ open: false, message: '' }); }
            }}
            sx={{ bgcolor: '#C9A84C', '&:hover': { bgcolor: '#A8883E' }, minWidth: 120, minHeight: 36 }}
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
            fullWidth type="text" label="Total Budget (LKR)" value={setupBudget}
            onChange={(e) => setSetupBudget(handleFormatNumber(e.target.value))}
            InputProps={{ startAdornment: <InputAdornment position="start">LKR</InputAdornment> }}
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setSetupBudgetOpen(false)} disabled={savingSetup}>Cancel</Button>
          <Button variant="contained" disabled={!setupBudget || Number(setupBudget.replace(/,/g, '')) <= 0 || savingSetup}
            onClick={async () => {
              setGlobalLoading({ open: true, message: 'Saving Total Budget...' });
              try {
                const numVal = Number(setupBudget.replace(/,/g, ''));
                await weddingService.updateProject({ totalBudget: numVal });
                setSetupBudgetOpen(false);
                setSetupBudget('');
                setRawProject((prev: any) => prev ? ({ ...prev, totalBudget: numVal }) : prev);
                setWeddingData((prev: any) => prev ? ({
                  ...prev,
                  stats: {
                    ...prev.stats,
                    totalBudget: numVal,
                  },
                }) : prev);
              } catch { /* ignore */ } finally { setGlobalLoading({ open: false, message: '' }); }
            }}
            sx={{ bgcolor: '#C9A84C', '&:hover': { bgcolor: '#A8883E' }, minWidth: 136, minHeight: 36 }}
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
        {/* When both partners have photos, show a split cover; otherwise use the default image. */}
        {useSplitHeroCover ? (
          <Box
            sx={{
              width: '100%',
              height: '100%',
              position: 'relative',
            }}
          >
            <Box
              sx={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '50%',
                height: '100%',
                backgroundImage: `url(${hasPartner1HeroPic ? couple.partner1Pic : couple.heroImage})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                backgroundRepeat: 'no-repeat',
              }}
            />
            <Box
              sx={{
                position: 'absolute',
                top: 0,
                right: 0,
                width: '50%',
                height: '100%',
                backgroundImage: `url(${hasPartner2HeroPic ? couple.partner2Pic : couple.heroImage})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                backgroundRepeat: 'no-repeat',
              }}
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
              {isCoupled && (
                <Tooltip title="Edit wedding date">
                  <IconButton
                    size="small"
                    onClick={() => {
                      setSetupDate(new Date(couple.date).toISOString().split('T')[0]);
                      setSetupDateOpen(true);
                    }}
                    sx={{ color: 'rgba(255,255,255,0.8)', '&:hover': { color: '#fff', bgcolor: 'rgba(255,255,255,0.15)' } }}
                  >
                    <Edit3 size={14} />
                  </IconButton>
                </Tooltip>
              )}
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
                      try {
                        if (onboardingCoupleKey) {
                          localStorage.removeItem(`${ONBOARDING_DISMISSED_KEY}:${onboardingCoupleKey}`);
                          localStorage.removeItem(`${ONBOARDING_STEPS_KEY}:${onboardingCoupleKey}`);
                        }
                      } catch { /* ignore */ }
                      setOnboardingSteps(emptyOnboardingSteps);
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
                <Button
                  size="small"
                  variant="outlined"
                  color="error"
                  startIcon={<XCircle size={14} />}
                  onClick={() => setResetDialogOpen(true)}
                  sx={{ borderRadius: 3, textTransform: 'none', fontWeight: 700 }}
                >
                  {isCoupled ? 'Stop Planning Together' : 'Cancel Invitation'}
                </Button>
              </Stack>
            </Box>
          </motion.div>
        </AnimatePresence>
      )}
      {/* Planning Locked / Exploration Mode Notice */}
      {!planningAccessGranted && !loading && (
        <Alert 
          severity="info" 
          icon={<Sparkles size={20} color={COLORS.primary} />}
          sx={{ 
            mb: 4, 
            borderRadius: 4, 
            bgcolor: '#FFF8E7', 
            border: '1px solid #E6C87E',
            '& .MuiAlert-message': { width: '100%' }
          }}
        >
          <Typography variant="subtitle2" sx={{ fontWeight: 800, color: COLORS.primary }}>
            Planning Exploration Mode
          </Typography>
          <Typography variant="body2" color="textSecondary" sx={{ mb: 1 }}>
            You are exploring the planning dashboard in read-only mode. To unlock collaborative features (checklist edits, budget management, and vendor booking), you need to send a wedding planning invitation to your partner.
          </Typography>
          <Button 
            variant="contained"
            size="small"
            onClick={() => navigate('/messages')}
            sx={{ bgcolor: COLORS.primary, borderRadius: 2, fontWeight: 700, textTransform: 'none', px: 3 }}
          >
            Go to Messages to Send Invite
          </Button>
        </Alert>
      )}

      {/* Stat Cards */}
      <Grid container spacing={3} sx={{ mb: 6 }}>
        <StatCard 
          title="Total Budget" 
          value={`LKR ${stats.totalBudget.toLocaleString()}`} 
          icon={<DollarSign size={24} />} 
          color={COLORS.primary}
          action={
            <Tooltip title="Edit budget">
              <IconButton
                size="small"
                onClick={() => {
                  if (!planningAccessGranted) {
                    setAccessNoticeTick(Date.now());
                    return;
                  }
                  setEditBudgetValue(String(stats.totalBudget));
                  setEditBudgetOpen(true);
                }}
              >
                <Edit3 size={16} />
              </IconButton>
            </Tooltip>
          }
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
      <Box ref={tabsAnchorRef} sx={{ borderBottom: 1, borderColor: 'divider', mb: 4, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Tabs 
          value={activeTab} 
          onChange={handleTabChange} 
          variant={isMobile ? "scrollable" : "standard"}
          scrollButtons="auto"
          sx={{
            flex: 1,
            '& .MuiTabs-indicator': { bgcolor: COLORS.primary, height: 3 },
            '& .MuiTab-root': { 
              textTransform: 'none', 
              fontWeight: 700, 
              fontSize: '0.95rem',
              color: COLORS.textSecondary,
              minWidth: isMobile ? 'auto' : 120,
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

        {!isMobile && (
          <Button
            size="small"
            startIcon={<FileText size={18} />}
            onClick={handleDownloadReport}
            sx={{ 
              ml: 2, 
              mb: 1, 
              color: COLORS.primary, 
              borderColor: COLORS.primary,
              fontWeight: 700,
              borderRadius: 2,
              px: 2,
              whiteSpace: 'nowrap',
              '&:hover': { bgcolor: `${COLORS.primary}08`, borderColor: COLORS.primary }
            }}
            variant="outlined"
          >
            Download Report
          </Button>
        )}
      </Box>

      {/* Tab Content */}
      <Box sx={{ minHeight: 700, position: 'relative' }}>
        <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.35, ease: [0.4, 0, 0.2, 1] }}
        >
          {activeTab === 0 && <OverviewTab data={weddingData} onSwitchTab={handleSwitchTabFromOverview} project={rawProject} budget={rawBudget} />}
          {activeTab === 1 && <ChecklistTab readOnly={!planningAccessGranted} checklist={rawProject?.checklist || []} onChecklistChange={(updated) => setRawProject((p: any) => ({ ...p, checklist: updated }))} currentUserId={currentUserId} partnerId={isCoupled ? rawProject?.coupleUserIds?.map((u: any) => String(typeof u === 'object' ? (u?._id || u?.id || '') : u || '')).find((id: string) => id !== currentUserId) : undefined} project={rawProject} budget={rawBudget} couple={weddingData?.couple} setGlobalLoading={setGlobalLoading} />}
          {activeTab === 2 && <VendorTab readOnly={!planningAccessGranted} vendors={rawVendors} bookedVendorIds={rawProject?.vendors || []} expenses={rawProject?.expenses || []} totalBudget={rawProject?.totalBudget || 0} weddingDate={rawProject?.weddingDate || ''} onStatusChange={refreshVendors} />}
          {activeTab === 3 && (
            <BudgetTab 
              readOnly={!planningAccessGranted} 
              totalBudget={rawBudget?.totalBudget ?? rawProject?.totalBudget ?? 0} 
              totalSpent={rawBudget?.totalSpent ?? 0} 
              expenses={rawBudget?.expenses ?? rawProject?.expenses ?? []} 
              onExpenseAdded={refreshBudget} 
              onBudgetUpdated={refreshBudget} 
              setGlobalLoading={setGlobalLoading}
            />
          )}
          {activeTab === 4 && <TimelineTab 
            readOnly={!planningAccessGranted} 
            weddingDate={rawProject?.weddingDate || couple.date} 
            checklist={rawProject?.checklist || []} 
            onChecklistChange={(updated: any[]) => setRawProject((p: any) => ({ ...p, checklist: updated }))} 
            setGlobalLoading={setGlobalLoading}
            currentUserId={currentUserId}
            partnerId={isCoupled ? rawProject?.coupleUserIds?.map((u: any) => String(typeof u === 'object' ? (u?._id || u?.id || '') : u || '')).find((id: string) => id !== currentUserId) : undefined}
          />}
        </motion.div>
      </AnimatePresence>
    </Box>

      {/* Edit Total Budget Dialog */}
      <Dialog open={editBudgetOpen} onClose={() => !savingBudget && setEditBudgetOpen(false)} maxWidth="xs" fullWidth PaperProps={{ sx: { borderRadius: 4 } }}>
        <DialogTitle sx={{ fontWeight: 800, display: 'flex', alignItems: 'center', gap: 1 }}>
          <DollarSign size={20} color="#C9A84C" /> Edit Total Budget
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Update your total wedding budget. This affects the budget overview and spending breakdown.
          </Typography>
          <TextField
            fullWidth type="text" label="Total Budget (LKR)" value={editBudgetValue}
            onChange={(e) => setEditBudgetValue(handleFormatNumber(e.target.value))}
            InputProps={{ startAdornment: <InputAdornment position="start">LKR</InputAdornment> }}
            autoFocus
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setEditBudgetOpen(false)} disabled={savingBudget}>Cancel</Button>
          <Button variant="contained" disabled={!editBudgetValue || Number(editBudgetValue.replace(/,/g, '')) < 0 || savingBudget}
            onClick={async () => {
              setGlobalLoading({ open: true, message: 'Updating Total Budget...' });
              try {
                const numVal = Number(editBudgetValue.replace(/,/g, ''));
                await weddingService.updateProject({ totalBudget: numVal });
                setEditBudgetOpen(false);
                setRawProject((prev: any) => prev ? ({ ...prev, totalBudget: numVal }) : prev);
                setWeddingData((prev: any) => prev ? ({
                  ...prev,
                  stats: {
                    ...prev.stats,
                    totalBudget: numVal,
                  },
                }) : prev);
              } catch { /* ignore */ } finally { setGlobalLoading({ open: false, message: '' }); }
            }}
            sx={{ bgcolor: '#C9A84C', '&:hover': { bgcolor: '#A8883E' } }}
          >
            {savingBudget ? <CircularProgress size={16} color="inherit" /> : 'Save Budget'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Reset Wedding Confirmation Dialog */}
      <Dialog open={resetDialogOpen} onClose={() => !resetting && setResetDialogOpen(false)} maxWidth="xs" fullWidth PaperProps={{ sx: { borderRadius: 4 } }}>
        <DialogTitle sx={{ fontWeight: 800, display: 'flex', alignItems: 'center', gap: 1 }}>
          <AlertCircle size={20} color={COLORS.error} />
          {isCoupled ? 'Stop Planning Together?' : 'Cancel Invitation?'}
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary">
            {isCoupled 
              ? 'This will reset your shared wedding plan for both you and your partner. To plan together again later, you must send a new wedding invite. Continue?'
              : 'This will cancel your pending wedding invitation. You can always send a new one later if you change your mind.'
            }
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setResetDialogOpen(false)} disabled={resetting}>Keep</Button>
          <Button
            variant="contained"
            color="error"
            onClick={async () => {
              setResetDialogOpen(false);
              await handleResetWedding();
            }}
            disabled={resetting}
            startIcon={resetting ? <CircularProgress size={14} color="inherit" /> : <Trash2 size={14} />}
            sx={{ borderRadius: 3, textTransform: 'none', fontWeight: 700 }}
          >
            {resetting ? 'Resetting…' : 'Yes, Reset'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Global Loading Backdrop */}
      <Backdrop
        sx={{ color: '#fff', zIndex: (theme) => theme.zIndex.modal + 999, flexDirection: 'column', gap: 2 }}
        open={globalLoading.open}
      >
        <CircularProgress color="inherit" />
        <Typography variant="h6" sx={{ fontWeight: 600 }}>{globalLoading.message}</Typography>
      </Backdrop>
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
