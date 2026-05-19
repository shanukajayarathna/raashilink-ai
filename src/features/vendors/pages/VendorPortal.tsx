import React, { useState, useEffect, useCallback, useRef } from 'react';
import { 
  Box, 
  Container, 
  Grid, 
  Typography, 
  Paper, 
  Tabs, 
  Tab, 
  IconButton, 
  Avatar, 
  Menu, 
  MenuItem, 
  Divider,
  ListItemIcon,
  Tooltip,
  Badge,
  useTheme,
  useMediaQuery,
  Skeleton,
  Button,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Stack,
  Chip,
} from '@mui/material';
import { 
  LayoutDashboard, 
  Image as ImageIcon, 
  MessageSquare, 
  Calendar, 
  BarChart3, 
  LogOut, 
  Bell,
  User,
  CheckCircle2,
  Clock,
  Star,
  Eye,
  TrendingUp,
  Briefcase
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { RootState } from '@/app/store/store';
import { logout, updateUser } from '@/features/auth/store/authSlice';
import userService from '@/features/profile/services/userService';
import { showToast } from '@/app/store/uiSlice';
import notificationService, { type AppNotification } from '@/features/notifications/services/notificationService';
import vendorService from '../services/vendorService';
import { formatDistanceToNow } from 'date-fns';
import { connectSocket } from '@/shared/hooks/useRealtimeUpdates';

// Sub-components
import PortfolioUpload from '../components/portal/PortfolioUpload';
import QuoteInbox from '../components/portal/QuoteInbox';
import VendorCalendar from '../components/portal/VendorCalendar';
import AnalyticsView from '../components/portal/AnalyticsView';
import ProfileManagement from '../components/portal/ProfileManagement';
import BookingsManager from '../components/portal/BookingsManager';

const DRAWER_WIDTH = 260;

const COLORS = {
  primary: '#8B1A2E',
  secondary: '#C9A84C',
  accent: '#1A6B72',
  background: '#FAF7F2',
  textPrimary: '#1C1C1C',
  textSecondary: '#555555',
};

const StatCard = ({ title, value, icon: Icon, trend, color }: any) => (
  <Paper
    elevation={0}
    sx={{
      p: 3,
      borderRadius: '16px',
      border: '1px solid rgba(139,26,46,0.08)',
      boxShadow: '0 2px 16px rgba(139,26,46,0.04)',
      display: 'flex',
      alignItems: 'center',
      gap: 2,
      position: 'relative',
      overflow: 'hidden',
      '&::after': {
        content: '""',
        position: 'absolute',
        top: 0,
        right: 0,
        width: '40px',
        height: '40px',
        background: `linear-gradient(135deg, transparent 50%, ${color}10 50%)`,
      }
    }}
  >
    <Box
      sx={{
        width: 48,
        height: 48,
        borderRadius: '12px',
        bgcolor: `${color}15`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: color
      }}
    >
      <Icon size={24} />
    </Box>
    <Box>
      <Typography variant="body2" color="textSecondary" sx={{ fontWeight: 500, mb: 0.5 }}>
        {title}
      </Typography>
      <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 1 }}>
        <Typography variant="h5" sx={{ fontWeight: 700, color: COLORS.textPrimary }}>
          {value}
        </Typography>
        {trend && (
          <Typography variant="caption" sx={{ color: 'success.main', fontWeight: 600, display: 'flex', alignItems: 'center' }}>
            <TrendingUp size={12} style={{ marginRight: 2 }} /> {trend}
          </Typography>
        )}
      </Box>
    </Box>
  </Paper>
);

export default function VendorPortal() {
  const [activeTab, setActiveTab] = useState(0);
  const [loading, setLoading] = useState(true);
  const [vendorData, setVendorData] = useState<any>(null);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [notifAnchorEl, setNotifAnchorEl] = useState<null | HTMLElement>(null);
  const [quoteNotifications, setQuoteNotifications] = useState<AppNotification[]>([]);
  const [verifyDialog, setVerifyDialog] = useState<{ open: boolean; channel: 'email' | 'phone' | null }>({
    open: false,
    channel: null,
  });
  const [otpValue, setOtpValue] = useState('');
  const [busyChannel, setBusyChannel] = useState<'email' | 'phone' | null>(null);
  const [verifying, setVerifying] = useState(false);
  const [approvalError, setApprovalError] = useState<string | null>(null);
  
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user, token } = useSelector((state: RootState) => state.auth);
  const activeTabRef = useRef(activeTab);
  const unreadQuoteCount = quoteNotifications.length;

  useEffect(() => {
    activeTabRef.current = activeTab;
  }, [activeTab]);

  const fetchQuoteNotifications = useCallback(async () => {
    try {
      const data = await notificationService.getAll();
      const unreadQuotes = (data.notifications || []).filter((n) => n.type === 'vendor_quote_request');
      setQuoteNotifications(unreadQuotes);
    } catch {
      // silent
    }
  }, []);

  const markQuoteNotificationsAsRead = useCallback(async (ids?: string[]) => {
    const targetIds = ids && ids.length > 0 ? ids : quoteNotifications.map((n) => n.id);
    if (targetIds.length === 0) return;
    try {
      await Promise.all(targetIds.map((id) => notificationService.markRead(id).catch(() => {})));
    } finally {
      setQuoteNotifications((prev) => prev.filter((n) => !targetIds.includes(n.id)));
    }
  }, [quoteNotifications]);

  const fetchVendorData = useCallback(async (options?: { showLoader?: boolean }) => {
    const showLoader = options?.showLoader === true;
    try {
      if (showLoader) {
        setLoading(true);
      }

      const [profileResponse, quoteInbox] = await Promise.all([
        vendorService.getVendorProfile(),
        vendorService.getQuoteInbox().catch(() => ({ data: { items: [] } })),
      ]);
      const ownProfile = profileResponse?.data || {};
      const quoteItems = Array.isArray(quoteInbox?.data?.items) ? quoteInbox.data.items : [];

      const activity = quoteItems.map((q: any) => ({
        type: 'quote',
        title: q.status === 'new' ? 'New Quote Request' : q.status === 'responded' ? 'Quote Sent' : q.status === 'accepted' ? 'Booking Confirmed' : 'Quote Declined',
        desc: q.status === 'new'
          ? `${q.coupleName} requested a quote for ${q.venueName || 'your service'}.`
          : q.status === 'accepted'
          ? `Congratulations! ${q.coupleName} confirmed their booking.`
          : `Update on quote for ${q.coupleName}.`,
        time: q.createdAt ? formatDistanceToNow(new Date(q.createdAt)) + ' ago' : 'Recently',
        icon: q.status === 'accepted' ? CheckCircle2 : MessageSquare,
        color: q.status === 'accepted' ? '#2e7d32' : COLORS.primary,
        rawDate: q.createdAt ? new Date(q.createdAt) : new Date()
      })).sort((a: any, b: any) => b.rawDate.getTime() - a.rawDate.getTime()).slice(0, 5);

      setVendorData({
        businessName: ownProfile.businessName || user?.name || 'Vendor Account',
        category: ownProfile.category || 'Vendor',
        accountEmail: user?.email || '',
        stats: {
          views: String(ownProfile.reviews?.length || 0),
          quotes: String(quoteItems.filter((q: any) => q.status === 'new').length),
          bookings: String(quoteItems.filter((item: any) => item?.status === 'accepted').length),
          rating: Number(ownProfile.ratings?.average || 0).toFixed(1),
        },
        activity,
        quoteItems,
        vendorProfile: ownProfile,
        verification: {
          ...(user?.verification || {}),
          vendorVerified: Boolean(ownProfile.verified),
        },
      });
    } catch (error) {
      console.error('Error fetching vendor data', error);
      
      // Check if the error is due to pending/rejected approval status
      const errorStatus = (error as any)?.response?.status;
      const errorMessage = (error as any)?.response?.data?.message || '';
      
      if (errorStatus === 403 && errorMessage.includes('pending')) {
        setApprovalError('pending');
        setVendorData(null);
        return;
      }
      
      if (errorStatus === 403 && errorMessage.includes('rejected')) {
        setApprovalError('rejected');
        setVendorData(null);
        return;
      }
      
      setVendorData((prev: any) => prev || {
          businessName: user?.vendorProfile?.businessName || user?.name || 'Vendor Account',
          category: user?.vendorProfile?.businessCategory || 'Vendor',
          accountEmail: user?.email || '',
          stats: {
            views: '0',
            quotes: '0',
            bookings: '0',
            rating: Number(user?.vendorProfile?.rating || 0).toFixed(1),
          },
          vendorProfile: user?.vendorProfile || null,
          verification: user?.verification || {},
        });
    } finally {
      if (showLoader) {
        setLoading(false);
      }
    }
  }, [user]);

  useEffect(() => {
    if (token) {
      fetchVendorData({ showLoader: true });
      fetchQuoteNotifications();

      const intervalId = window.setInterval(() => {
        fetchVendorData();
        fetchQuoteNotifications();
      }, 15000);

      const handleRefresh = () => {
        fetchVendorData();
        fetchQuoteNotifications();
      };

      window.addEventListener('focus', handleRefresh);
      window.addEventListener('app:refresh', handleRefresh as EventListener);

      const socket = connectSocket(token);
      const onVendorQuoteRequest = () => {
        fetchVendorData();
        // Silently refresh QuoteInbox list without showing skeleton
        window.dispatchEvent(new CustomEvent('vendor:quote_arrived'));
      };
      const onQuoteRequestUpdated = () => {
        fetchVendorData();
        window.dispatchEvent(new CustomEvent('vendor:quote_arrived'));
      };
      const onNotification = (payload: AppNotification) => {
        if (payload?.type !== 'vendor_quote_request' && payload?.type !== 'vendor_booking_cancelled') return;

        if (activeTabRef.current === 1) {
          notificationService.markRead(payload.id).catch(() => {});
          // Still trigger silent refresh of the open Quotes tab
          window.dispatchEvent(new CustomEvent('vendor:quote_arrived'));
          return;
        }

        setQuoteNotifications((prev) => {
          if (prev.some((n) => n.id === payload.id)) return prev;
          return [payload, ...prev];
        });
        dispatch(showToast({
          type: 'info',
          message:
            payload?.type === 'vendor_booking_cancelled'
              ? `${payload.fromUserName || 'A user'} cancelled a booking request.`
              : `${payload.fromUserName || 'A user'} sent a new quote request.`,
        }));
        window.dispatchEvent(new CustomEvent('vendor:quote_arrived'));
      };
      socket.on('vendor_quote_request', onVendorQuoteRequest);
      socket.on('quote_request_updated', onQuoteRequestUpdated);
      socket.on('notification', onNotification);

      return () => {
        window.clearInterval(intervalId);
        window.removeEventListener('focus', handleRefresh);
        window.removeEventListener('app:refresh', handleRefresh as EventListener);
        socket.off('vendor_quote_request', onVendorQuoteRequest);
        socket.off('quote_request_updated', onQuoteRequestUpdated);
        socket.off('notification', onNotification);
      };
    }

    setLoading(false);
  }, [token, fetchVendorData, fetchQuoteNotifications, dispatch]);

  useEffect(() => {
    if (activeTab === 1 && unreadQuoteCount > 0) {
      markQuoteNotificationsAsRead();
    }
  }, [activeTab, unreadQuoteCount, markQuoteNotificationsAsRead]);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', bgcolor: COLORS.background }}>
        <Skeleton variant="rectangular" width="100%" height="100%" />
      </Box>
    );
  }

  if (approvalError) {
    return (
      <Dialog open={true} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: '20px' } }}>
        <DialogContent sx={{ pt: 4, textAlign: 'center' }}>
          <Box sx={{ mb: 3 }}>
            <Typography variant="h5" sx={{ fontWeight: 700, color: COLORS.primary, mb: 2 }}>
              {approvalError === 'pending' ? '⏳ Application Under Review' : '❌ Application Rejected'}
            </Typography>
            <Typography variant="body2" color="textSecondary" sx={{ lineHeight: 1.6, mb: 3 }}>
              {approvalError === 'pending'
                ? "Your vendor profile is currently under review by our admin team. We're carefully evaluating your business to ensure the best experience for our customers. This typically takes 1-2 business days."
                : 'Unfortunately, your vendor application has been rejected. Please review the requirements and reapply if you believe this is an error.'}
            </Typography>
          </Box>
          
          <Box
            sx={{
              bgcolor: '#FFF3E0',
              borderLeft: `4px solid ${COLORS.secondary}`,
              p: 2.5,
              borderRadius: '8px',
              mb: 3,
              textAlign: 'left'
            }}
          >
            <Typography variant="subtitle2" sx={{ fontWeight: 700, color: COLORS.primary, mb: 1 }}>
              📧 Need Help?
            </Typography>
            <Typography variant="body2" sx={{ color: COLORS.textSecondary, mb: 1 }}>
              For more details about your application status or to get assistance, please email us:
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1.5 }}>
              <Typography
                component="a"
                href="mailto:raashilink@ai.lk"
                sx={{
                  fontWeight: 600,
                  color: COLORS.secondary,
                  textDecoration: 'none',
                  '&:hover': { textDecoration: 'underline' }
                }}
              >
                raashilink@ai.lk
              </Typography>
            </Box>
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button
            fullWidth
            variant="contained"
            onClick={() => {
              dispatch(logout());
              navigate('/login');
            }}
            sx={{ bgcolor: COLORS.primary, '&:hover': { bgcolor: '#6b1423' } }}
          >
            Return to Login
          </Button>
        </DialogActions>
      </Dialog>
    );
  }

  if (!vendorData) {
    return (
      <Box sx={{ p: 4, textAlign: 'center' }}>
        <Alert severity="error">Failed to load vendor profile. Please try logging in again.</Alert>
      </Box>
    );
  }

  const handleLogout = () => {
    dispatch(logout());
    navigate('/login');
  };

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleNotificationsOpen = (event: React.MouseEvent<HTMLElement>) => {
    setNotifAnchorEl(event.currentTarget);
  };

  const handleNotificationsClose = () => {
    setNotifAnchorEl(null);
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

      const nextVerification = {
        ...(vendorData?.verification || {}),
        ...(response?.verification || {}),
      };

      setVendorData((prev: any) => ({
        ...prev,
        verification: nextVerification,
      }));
      dispatch(updateUser({ verification: { ...(user?.verification || {}), ...nextVerification } }));
      dispatch(showToast({ type: 'success', message: response.message || 'Verification completed.' }));

      setVerifyDialog({ open: false, channel: null });
      setOtpValue('');
    } catch (error: any) {
      dispatch(showToast({ type: 'error', message: error.response?.data?.message || 'Failed to verify OTP.' }));
    } finally {
      setVerifying(false);
    }
  };

  const tabs = [
    { label: 'Dashboard', icon: <LayoutDashboard size={20} /> },
    { label: 'Quotes', icon: <MessageSquare size={20} /> },
    { label: 'Bookings', icon: <CheckCircle2 size={20} /> },
    { label: 'Calendar', icon: <Calendar size={20} /> },
    { label: 'Portfolio', icon: <ImageIcon size={20} /> },
    { label: 'Profile', icon: <User size={20} /> },
    { label: 'Analytics', icon: <BarChart3 size={20} /> },
  ];

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: COLORS.background }}>
      {/* Sidebar */}
      {!isMobile && (
        <Paper
          elevation={0}
          sx={{
            width: DRAWER_WIDTH,
            height: '100vh',
            position: 'fixed',
            left: 0,
            top: 0,
            borderRadius: 0,
            borderRight: '1px solid rgba(139,26,46,0.08)',
            display: 'flex',
            flexDirection: 'column',
            zIndex: 1200,
            bgcolor: 'white'
          }}
        >
          <Box sx={{ p: 3, display: 'flex', alignItems: 'center', gap: 0 }}>
            <Box
              component="img"
              src="/RaashiLink_Logo.png"
              alt="RaashiLink Logo"
              sx={{
                width: 60,
                height: 60,
                mr: -2.5,
                objectFit: 'contain',
                filter: 'drop-shadow(0 4px 6px rgba(0,0,0,0.1))'
              }}
            />
            <Typography variant="h6" sx={{ fontFamily: 'Playfair Display', fontWeight: 700, color: COLORS.primary }}>
              RaashiLink
            </Typography>
          </Box>

          <Box sx={{ px: 2, mt: 2, flexGrow: 1 }}>
            {tabs.map((tab, index) => (
              <Button
                key={index}
                fullWidth
                onClick={() => setActiveTab(index)}
                startIcon={tab.icon}
                sx={{
                  justifyContent: 'flex-start',
                  px: 2,
                  py: 1.5,
                  mb: 1,
                  borderRadius: '12px',
                  color: activeTab === index ? COLORS.primary : COLORS.textSecondary,
                  bgcolor: activeTab === index ? `${COLORS.primary}10` : 'transparent',
                  fontWeight: activeTab === index ? 600 : 500,
                  textTransform: 'none',
                  '&:hover': {
                    bgcolor: activeTab === index ? `${COLORS.primary}15` : 'rgba(0,0,0,0.04)',
                  }
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <span>{tab.label}</span>
                  {index === 1 && unreadQuoteCount > 0 && (
                    <Chip
                      label={unreadQuoteCount > 99 ? '99+' : unreadQuoteCount}
                      size="small"
                      sx={{
                        height: 18,
                        fontSize: '0.65rem',
                        fontWeight: 700,
                        bgcolor: activeTab === index ? COLORS.primary : 'error.main',
                        color: 'white',
                      }}
                    />
                  )}
                </Box>
              </Button>
            ))}
          </Box>

          <Box sx={{ p: 2, borderTop: '1px solid rgba(0,0,0,0.05)' }}>
            <Button
              fullWidth
              onClick={handleLogout}
              startIcon={<LogOut size={20} />}
              sx={{
                justifyContent: 'flex-start',
                px: 2,
                py: 1.5,
                borderRadius: '12px',
                color: '#d32f2f',
                fontWeight: 500,
                textTransform: 'none',
                '&:hover': { bgcolor: 'rgba(211, 47, 47, 0.05)' }
              }}
            >
              Logout
            </Button>
          </Box>
        </Paper>
      )}

      {/* Main Content Area */}
      <Box
        sx={{
          flexGrow: 1,
          ml: isMobile ? 0 : `${DRAWER_WIDTH}px`,
          width: isMobile ? '100%' : `calc(100% - ${DRAWER_WIDTH}px)`,
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column'
        }}
      >
        {/* Header */}
        <Box
          sx={{
            height: 70,
            bgcolor: 'white',
            borderBottom: '1px solid rgba(139,26,46,0.08)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            px: { xs: 2, md: 4 },
            position: 'sticky',
            top: 0,
            zIndex: 1100
          }}
        >
          <Typography variant="h6" sx={{ fontWeight: 600, color: COLORS.textPrimary }}>
            {tabs[activeTab].label}
          </Typography>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Tooltip title="Quote Notifications">
              <IconButton size="small" sx={{ bgcolor: 'rgba(0,0,0,0.03)' }} onClick={handleNotificationsOpen}>
                <Badge badgeContent={unreadQuoteCount > 99 ? '99+' : unreadQuoteCount} color="error">
                  <Bell size={20} />
                </Badge>
              </IconButton>
            </Tooltip>
            
            <Divider orientation="vertical" flexItem sx={{ height: 24, my: 'auto' }} />
            
            <Box 
              onClick={handleMenuOpen}
              sx={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: 1.5, 
                cursor: 'pointer',
                p: 0.5,
                borderRadius: '24px',
                '&:hover': { bgcolor: 'rgba(0,0,0,0.03)' }
              }}
            >
              <Avatar 
                src={user?.profilePic || user?.personalInfo?.profilePic || undefined}
                sx={{ 
                  width: 36, 
                  height: 36, 
                  bgcolor: COLORS.primary,
                  fontSize: '0.9rem',
                  fontWeight: 600
                }}
              >
                {!user?.profilePic && !user?.personalInfo?.profilePic && (vendorData?.businessName?.charAt(0) || 'V')}
              </Avatar>
              {!isMobile && (
                <Box>
                  <Typography variant="body2" sx={{ fontWeight: 600, lineHeight: 1.2 }}>
                    {vendorData?.businessName || 'Vendor'}
                  </Typography>
                  <Typography variant="caption" color="textSecondary">
                    {vendorData?.category || 'Service Provider'}
                  </Typography>
                </Box>
              )}
            </Box>
          </Box>
        </Box>

        {/* Content */}
        <Box sx={{ flex: 1, overflowY: 'auto', p: { xs: 2, md: 4 } }}>
          <Box sx={{ maxWidth: '1400px', mx: 'auto' }}>
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
              >
                {activeTab === 0 && (
                  <DashboardOverview
                    stats={vendorData.stats}
                    activity={vendorData.activity}
                    vendorProfile={vendorData.vendorProfile}
                    verification={vendorData.verification}
                    onRequestOtp={handleRequestVerificationOtp}
                    onOpenVerify={(channel: 'email' | 'phone') => {
                      setVerifyDialog({ open: true, channel });
                      setOtpValue('');
                    }}
                    busyChannel={busyChannel}
                  />
                )}
                {activeTab === 1 && <QuoteInbox />}
                {activeTab === 2 && <BookingsManager quotes={vendorData.quoteItems || []} />}
                {activeTab === 3 && (
                  <VendorCalendar
                    quotes={vendorData.quoteItems || []}
                    availabilityCalendar={vendorData.vendorProfile?.availabilityCalendar || []}
                  />
                )}
                {activeTab === 4 && (
                  <PortfolioUpload
                    portfolioImages={vendorData.vendorProfile?.portfolioImages || []}
                    onUpdate={(images) =>
                      setVendorData((prev: any) => ({
                        ...prev,
                        vendorProfile: { ...(prev?.vendorProfile || {}), portfolioImages: images },
                      }))
                    }
                  />
                )}
                {activeTab === 5 && (
                  <ProfileManagement
                    vendorData={vendorData}
                    onSaved={(updated) =>
                      setVendorData((prev: any) => ({
                        ...prev,
                        businessName: updated?.businessName || prev?.businessName,
                        category: updated?.category || prev?.category,
                        vendorProfile: {
                          ...(prev?.vendorProfile || {}),
                          ...(updated || {}),
                        },
                      }))
                    }
                  />
                )}
                {activeTab === 6 && (
                  <AnalyticsView
                    quoteItems={vendorData.quoteItems || []}
                    vendorProfile={vendorData.vendorProfile || null}
                  />
                )}
              </motion.div>
            </AnimatePresence>
          </Box>
        </Box>

        {/* Mobile Bottom Navigation */}
        {isMobile && (
          <Paper
            elevation={10}
            sx={{
              position: 'fixed',
              bottom: 0,
              left: 0,
              right: 0,
              borderRadius: 0,
              zIndex: 1200,
              display: 'flex',
              justifyContent: 'space-around',
              py: 1,
              bgcolor: 'white',
              borderTop: '1px solid rgba(0,0,0,0.05)'
            }}
          >
            {tabs.slice(0, 5).map((tab, index) => (
              <IconButton
                key={index}
                onClick={() => setActiveTab(index)}
                sx={{
                  color: activeTab === index ? COLORS.primary : COLORS.textSecondary,
                  flexDirection: 'column',
                  gap: 0.5
                }}
              >
                <Badge badgeContent={index === 1 && unreadQuoteCount > 0 ? (unreadQuoteCount > 99 ? '99+' : unreadQuoteCount) : 0} color="error">
                  {tab.icon}
                </Badge>
                <Typography variant="caption" sx={{ fontSize: '0.65rem', fontWeight: activeTab === index ? 600 : 500 }}>
                  {tab.label}
                </Typography>
              </IconButton>
            ))}
          </Paper>
        )}
      </Box>

      {/* User Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
        PaperProps={{
          sx: {
            mt: 1.5,
            borderRadius: '12px',
            minWidth: 180,
            boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
            border: '1px solid rgba(0,0,0,0.05)'
          }
        }}
      >
        <MenuItem onClick={handleLogout} sx={{ color: 'error.main' }}>
          <ListItemIcon><LogOut size={18} color="#d32f2f" /></ListItemIcon>
          Logout
        </MenuItem>
      </Menu>

      <Menu
        anchorEl={notifAnchorEl}
        open={Boolean(notifAnchorEl)}
        onClose={handleNotificationsClose}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
        PaperProps={{
          sx: {
            mt: 1.5,
            borderRadius: '12px',
            minWidth: 320,
            maxWidth: 380,
            boxShadow: '0 6px 24px rgba(0,0,0,0.12)',
            border: '1px solid rgba(0,0,0,0.06)',
          },
        }}
      >
        <Box sx={{ px: 2, py: 1.5, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>Quote Notifications</Typography>
          {unreadQuoteCount > 0 && (
            <Button
              size="small"
              onClick={async () => {
                await markQuoteNotificationsAsRead();
              }}
              sx={{ textTransform: 'none', fontWeight: 600 }}
            >
              Mark all read
            </Button>
          )}
        </Box>
        <Divider />
        {quoteNotifications.length === 0 ? (
          <Box sx={{ px: 2, py: 2.5 }}>
            <Typography variant="body2" color="textSecondary">No unread quote notifications.</Typography>
          </Box>
        ) : (
          quoteNotifications.map((notif) => (
            <MenuItem
              key={notif.id}
              onClick={async () => {
                setActiveTab(1);
                await markQuoteNotificationsAsRead([notif.id]);
                handleNotificationsClose();
              }}
              sx={{ alignItems: 'flex-start', py: 1.25 }}
            >
              <ListItemIcon sx={{ minWidth: 34, mt: 0.25 }}>
                <MessageSquare size={16} color={COLORS.primary} />
              </ListItemIcon>
              <Box>
                <Typography variant="body2" sx={{ fontWeight: 600, lineHeight: 1.35 }}>
                  {notif.fromUserName || 'A user'} sent a quote request
                </Typography>
                <Typography variant="caption" color="textSecondary" sx={{ display: 'block', mt: 0.3 }}>
                  {(notif as any)?.metadata?.preview || 'Open Quotes to review details.'}
                </Typography>
              </Box>
            </MenuItem>
          ))
        )}
      </Menu>

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
          <Button
            variant="contained"
            onClick={handleConfirmVerification}
            disabled={verifying}
            sx={{ bgcolor: COLORS.primary, '&:hover': { bgcolor: '#6b1423' } }}
          >
            {verifying ? 'Verifying...' : 'Verify'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export const DashboardOverview = ({
  stats,
  activity,
  vendorProfile,
  verification,
  onRequestOtp,
  onOpenVerify,
  busyChannel,
}: any) => {
  if (!stats) return (
    <Grid container spacing={3}>
      {[1, 2, 3, 4].map((i) => (
        <Grid size={{ xs: 12, sm: 6, lg: 3 }} key={i}>
          <Skeleton variant="rectangular" height={100} sx={{ borderRadius: '16px' }} />
        </Grid>
      ))}
    </Grid>
  );

  const showVerificationAlert = !verification?.emailVerified || !verification?.phoneVerified;
  const businessNotVerified = !verification?.vendorVerified;

  return (
    <Box>
      <Typography variant="h5" sx={{ fontFamily: 'Playfair Display', fontWeight: 700, mb: 3, color: COLORS.primary }}>
        Welcome back!
      </Typography>

      {/* Verification Status Alerts */}
      {(showVerificationAlert || businessNotVerified) && (
        <Box sx={{ mb: 3, display: 'flex', flexDirection: 'column', gap: 2 }}>
          {businessNotVerified && (
            <Alert severity="warning" sx={{ borderRadius: '16px', mb: 2 }}>
              <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5 }}>
                🔍 Business Verification Pending
              </Typography>
              <Typography variant="caption" sx={{ display: 'block', lineHeight: 1.5 }}>
                Your business profile is pending admin verification. You can still accept bookings, but full profile visibility will be enabled once verified.
              </Typography>
            </Alert>
          )}
          {showVerificationAlert && (
            <Alert severity="info" sx={{ borderRadius: '16px' }}>
              <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5 }}>
                ⚠️ Contact Verification Pending
              </Typography>
              <Typography variant="caption" sx={{ display: 'block', lineHeight: 1.5 }}>
                {!verification?.emailVerified && 'Email '}{!verification?.emailVerified && !verification?.phoneVerified && '& '}{!verification?.phoneVerified && 'phone '} verification needed to unlock contact features.
              </Typography>
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} sx={{ mt: 1.5 }}>
                {!verification?.emailVerified && (
                  <>
                    <Button
                      size="small"
                      variant="outlined"
                      onClick={() => onRequestOtp?.('email')}
                      disabled={busyChannel === 'email'}
                    >
                      {busyChannel === 'email' ? 'Sending...' : 'Send Email OTP'}
                    </Button>
                    <Button size="small" variant="contained" onClick={() => onOpenVerify?.('email')} sx={{ bgcolor: COLORS.primary }}>
                      Verify Email
                    </Button>
                  </>
                )}
                {!verification?.phoneVerified && (
                  <>
                    <Button
                      size="small"
                      variant="outlined"
                      onClick={() => onRequestOtp?.('phone')}
                      disabled={busyChannel === 'phone'}
                    >
                      {busyChannel === 'phone' ? 'Sending...' : 'Send Phone OTP'}
                    </Button>
                    <Button size="small" variant="contained" onClick={() => onOpenVerify?.('phone')} sx={{ bgcolor: COLORS.primary }}>
                      Verify Phone
                    </Button>
                  </>
                )}
              </Stack>
            </Alert>
          )}
        </Box>
      )}

      <Grid container spacing={3}>
        <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
          <StatCard 
            title="Profile Views" 
            value={stats.views} 
            icon={Eye} 
            color={COLORS.accent} 
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
          <StatCard 
            title="Quote Requests" 
            value={stats.quotes} 
            icon={MessageSquare} 
            color={COLORS.primary} 
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
          <StatCard 
            title="Bookings" 
            value={stats.bookings} 
            icon={Briefcase} 
            color="#2e7d32" 
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
          <StatCard 
            title="Average Rating" 
            value={stats.rating} 
            icon={Star} 
            color={COLORS.secondary} 
          />
        </Grid>
      </Grid>

      <Grid container spacing={3} sx={{ mt: 1 }}>
        <Grid size={{ xs: 12, lg: 8 }}>
          <Paper elevation={0} sx={{ p: 3, borderRadius: '16px', border: '1px solid rgba(139,26,46,0.08)', height: '100%' }}>
            <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>Recent Activity</Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {activity.length > 0 ? activity.map((item: any, i: number) => (
                <Box key={i} sx={{ display: 'flex', gap: 2, p: 2, borderRadius: '12px', bgcolor: 'rgba(0,0,0,0.02)' }}>
                  <Box sx={{ width: 40, height: 40, borderRadius: '10px', bgcolor: `${item.color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: item.color }}>
                    <item.icon size={20} />
                  </Box>
                  <Box sx={{ flexGrow: 1 }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>{item.title}</Typography>
                    <Typography variant="body2" color="textSecondary">{item.desc}</Typography>
                    <Typography variant="caption" color="textSecondary" sx={{ display: 'block', mt: 0.5 }}>{item.time}</Typography>
                  </Box>
                </Box>
              )) : (
                <Typography variant="body2" color="textSecondary" sx={{ textAlign: 'center', py: 4 }}>
                  No recent activity found.
                </Typography>
              )}
            </Box>
          </Paper>
        </Grid>
        <Grid size={{ xs: 12, lg: 4 }}>
          <Paper elevation={0} sx={{ p: 3, borderRadius: '16px', border: '1px solid rgba(139,26,46,0.08)', height: '100%', bgcolor: COLORS.primary, color: 'white' }}>
            <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>Quick Tips</Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Typography variant="body2" sx={{ opacity: 0.9 }}>
                • Update your portfolio regularly to attract more couples.
              </Typography>
              <Typography variant="body2" sx={{ opacity: 0.9 }}>
                • Respond to quotes within 24 hours to increase conversion.
              </Typography>
              <Typography variant="body2" sx={{ opacity: 0.9 }}>
                • Mark your unavailable dates in the calendar to avoid conflicts.
              </Typography>
              <Button 
                variant="contained" 
                sx={{ 
                  mt: 2, 
                  bgcolor: COLORS.secondary, 
                  color: COLORS.primary,
                  fontWeight: 600,
                  '&:hover': { bgcolor: '#b89a42' }
                }}
              >
                View Resources
              </Button>
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

