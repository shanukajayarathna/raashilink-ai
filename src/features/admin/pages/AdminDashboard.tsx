import React, { useState, useEffect } from 'react';
import {
  Box,
  Drawer,
  AppBar,
  Toolbar,
  List,
  Typography,
  Divider,
  IconButton,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Container,
  Grid,
  Paper,
  Avatar,
  Chip,
  Button,
  Stack,
  useTheme,
  useMediaQuery,
  Badge,
  CircularProgress,
  Alert,
} from '@mui/material';
import {
  LayoutDashboard,
  Users,
  Store,
  BarChart3,
  Settings,
  Menu,
  LogOut,
  TrendingUp,
  ArrowUpRight,
  History,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Star,
  Heart,
  Activity,
  ShieldCheck,
  Zap,
} from 'lucide-react';
import { motion, AnimatePresence, LayoutGroup } from 'motion/react';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '@/app/store/store';
import { logout } from '@/features/auth/store/authSlice';
import { useNavigate } from 'react-router-dom';
import adminService from '../services/adminService';
import UsersTable from '../components/UsersTable';
import VendorVerification from '../components/VendorVerification';
import AdminAnalytics from '../components/AdminAnalytics';
import AdminSettings from '../components/AdminSettings';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
} from 'recharts';

// Design System Constants
const COLORS = {
  primary: '#8B1A2E',
  secondary: '#C9A84C',
  accent: '#1A6B72',
  background: '#FAF7F2',
  white: '#FFFFFF',
  textPrimary: '#1C1C1C',
  textSecondary: '#555555',
  success: '#2E7D32',
  error: '#D32F2F',
  warning: '#ED6C02',
};

const DRAWER_WIDTH = 280;

const resolveAvatarSrc = (...sources: any[]) => {
  for (const source of sources) {
    if (!source || typeof source !== 'string') continue;
    const value = source.trim();
    if (!value) continue;
    if (/^(https?:)?\/\//i.test(value) || value.startsWith('data:') || value.startsWith('blob:')) {
      return value;
    }
    return value.startsWith('/') ? value : `/${value}`;
  }
  return undefined;
};

const isDeepEqual = (obj1: any, obj2: any): boolean => {
  if (obj1 === obj2) return true;
  if (obj1 == null || obj2 == null) return false;
  if (typeof obj1 !== 'object' || typeof obj2 !== 'object') return false;

  const keys1 = Object.keys(obj1).filter(k => k !== 'generatedAt');
  const keys2 = Object.keys(obj2).filter(k => k !== 'generatedAt');

  if (keys1.length !== keys2.length) return false;

  for (const key of keys1) {
    if (!keys2.includes(key)) return false;
    if (!isDeepEqual(obj1[key], obj2[key])) return false;
  }

  return true;
};

const AdminDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState('Overview');
  const [mobileOpen, setMobileOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [overviewData, setOverviewData] = useState<any>(null);
  const [overviewError, setOverviewError] = useState('');
  const [userGrowthPeriod, setUserGrowthPeriod] = useState<'daily' | 'monthly'>('monthly');
  const [matchTrendsPeriod, setMatchTrendsPeriod] = useState<'daily' | 'monthly'>('monthly');
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastOverviewSyncTime, setLastOverviewSyncTime] = useState('N/A');
  const theme = useTheme();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const user = useSelector((state: RootState) => state.auth.user);
  const adminAvatarSrc = resolveAvatarSrc(
    user?.profilePic,
    user?.personalInfo?.profilePic,
    user?.photos?.find?.((photo: any) => photo?.isMain)?.url,
    user?.photos?.[0]?.url
  );

  const loadOverview = async (showSpinner = true) => {
    try {
      if (showSpinner) {
        setLoading(true);
      } else {
        setIsSyncing(true);
      }
      setOverviewError('');
      const response = await adminService.getOverview();
      const newData = response?.data || null;
      if (newData?.generatedAt) {
        setLastOverviewSyncTime(new Date(newData.generatedAt).toLocaleTimeString());
      }
      setOverviewData((prev: any) => {
        if (isDeepEqual(prev, newData)) {
          return prev;
        }
        return newData;
      });
    } catch (error: any) {
      console.error('Failed to load admin overview', error);
      if (showSpinner) {
        setOverviewData(null);
      }
      setOverviewError(error?.response?.data?.message || 'Failed to load overview');
    } finally {
      if (showSpinner) {
        setLoading(false);
      } else {
        setIsSyncing(false);
      }
    }
  };

  useEffect(() => {
    void loadOverview(true);

    const interval = setInterval(() => {
      void loadOverview(false);
    }, 15000);

    return () => clearInterval(interval);
  }, []);

  const handleSignOut = () => {
    dispatch(logout());
    navigate('/login');
  };

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const pendingVendorCount = Number(overviewData?.summary?.pendingVendors || 0);

  const navItems = [
    { name: 'Overview', icon: <LayoutDashboard size={20} /> },
    { name: 'Users', icon: <Users size={20} /> },
    { name: 'Vendors', icon: <Store size={20} />, badgeCount: pendingVendorCount },
    { name: 'Analytics', icon: <BarChart3 size={20} /> },
    { name: 'Settings', icon: <Settings size={20} /> },
  ];

  const kpiIconMap: Record<string, React.ReactNode> = {
    'Total Users': <Users size={24} />,
    'Horoscope Seekers': <Star size={24} />,
    'Couples': <Heart size={24} />,
    'Partners': <Users size={24} />,
    'Active Vendors': <Store size={24} />,
    'Pending Vendors': <AlertCircle size={24} />,
    'Verified Users': <ShieldCheck size={24} />,
    'Mutual Matches': <Heart size={24} />,
    'Matches This Month': <TrendingUp size={24} />,
    'Total Matches': <TrendingUp size={24} />,
    'Wedding Projects': <CheckCircle2 size={24} />,
    'Revenue (LKR)': <TrendingUp size={24} />,
  };

  const kpiData = (overviewData?.kpis || []).map((kpi: any) => ({
    ...kpi,
    icon: kpi.icon || kpiIconMap[kpi.title] || <TrendingUp size={24} />,
    color: kpi.color || COLORS.primary,
  }));
  const userGrowthData = overviewData?.growthData || [];
  const recentActivity = (overviewData?.recentActivity || []).map((activity: any) => ({
    ...activity,
    icon:
      activity.icon ||
      (activity.type === 'vendor'
        ? <Store size={16} />
        : activity.type === 'match'
          ? <TrendingUp size={16} />
          : <Users size={16} />),
  }));

  const drawer = (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', bgcolor: COLORS.primary, color: 'white' }}>
      <Box sx={{ p: 3, display: 'flex', alignItems: 'center', gap: 0 }}>
        <Box
          component="img"
          src="/RaashiLink_Logo.png"
          alt="RaashiLink Logo"
          sx={{ 
            height: 60, 
            mr: -3,
            filter: 'brightness(0) invert(1) drop-shadow(0 0 8px rgba(201, 168, 76, 0.4))' 
          }}
        />
        <Typography variant="h6" sx={{ fontFamily: 'Playfair Display', fontWeight: 700, letterSpacing: 1 }}>
          RaashiLink Admin
        </Typography>
      </Box>
      <Divider sx={{ bgcolor: 'rgba(255,255,255,0.1)' }} />
      <List sx={{ flexGrow: 1, px: 2, pt: 2 }}>
        {navItems.map((item) => (
          <ListItem key={item.name} disablePadding sx={{ mb: 1 }}>
            <ListItemButton
              onClick={() => {
                setActiveTab(item.name);
                if (isMobile) setMobileOpen(false);
              }}
              sx={{
                borderRadius: '12px',
                bgcolor: activeTab === item.name ? 'rgba(255,255,255,0.15)' : 'transparent',
                '&:hover': { bgcolor: 'rgba(255,255,255,0.1)' },
                transition: 'all 0.2s',
              }}
            >
              <ListItemIcon sx={{ color: activeTab === item.name ? COLORS.secondary : 'white', minWidth: 45 }}>
                {item.icon}
              </ListItemIcon>
              <ListItemText
                primary={item.name}
                primaryTypographyProps={{
                  fontWeight: activeTab === item.name ? 600 : 400,
                  fontSize: '0.95rem',
                }}
              />
              {item.badgeCount > 0 && (
                <Badge
                  badgeContent={item.badgeCount}
                  color="warning"
                  sx={{ mr: 3, '& .MuiBadge-badge': { fontWeight: 700 } }}
                />
              )}
              {activeTab === item.name && (
                <motion.div layoutId="active-pill" style={{ width: 4, height: 20, backgroundColor: COLORS.secondary, borderRadius: 2 }} />
              )}
            </ListItemButton>
          </ListItem>
        ))}
      </List>
      <Box sx={{ p: 3, mt: 'auto', bgcolor: 'rgba(0,0,0,0.2)' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
          <Avatar src={adminAvatarSrc} sx={{ bgcolor: COLORS.secondary, color: COLORS.primary, fontWeight: 700 }}>
            {user?.name?.charAt(0) || 'A'}
          </Avatar>
          <Box>
            <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>{user?.name || 'Admin User'}</Typography>
            <Chip label="Super Admin" size="small" sx={{ height: 20, fontSize: '0.65rem', bgcolor: COLORS.secondary, color: COLORS.primary, fontWeight: 700 }} />
          </Box>
        </Box>
        <Button
          fullWidth
          variant="outlined"
          startIcon={<LogOut size={16} />}
          onClick={handleSignOut}
          sx={{ color: 'white', borderColor: 'rgba(255,255,255,0.3)', '&:hover': { borderColor: 'white', bgcolor: 'rgba(255,255,255,0.05)' } }}
        >
          Sign Out
        </Button>
      </Box>
    </Box>
  );

  const renderOverview = () => (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
        {overviewError && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {overviewError}
          </Alert>
        )}
        <Grid container spacing={3}>
          {kpiData.map((kpi, index) => (
            <Grid size={{ xs: 12, sm: 6, lg: 3 }} key={index}>
              <Paper
              sx={{
                p: 3,
                borderRadius: '16px',
                boxShadow: '0 4px 20px rgba(0,0,0,0.05)',
                display: 'flex',
                flexDirection: 'column',
                position: 'relative',
                overflow: 'hidden',
                '&::after': {
                  content: '""',
                  position: 'absolute',
                  top: 0,
                  right: 0,
                  width: '100px',
                  height: '100px',
                  background: `radial-gradient(circle at top right, ${kpi.color}15, transparent)`,
                  borderRadius: '0 0 0 100%',
                }
              }}
            >
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Box sx={{ p: 1.5, borderRadius: '12px', bgcolor: `${kpi.color}15`, color: kpi.color }}>
                  {kpi.icon}
                </Box>
                <Chip
                  label={kpi.growth}
                  size="small"
                  icon={<ArrowUpRight size={12} />}
                  sx={{ height: 24, bgcolor: `${COLORS.success}15`, color: COLORS.success, fontWeight: 700, '& .MuiChip-icon': { color: 'inherit' } }}
                />
              </Box>
              <Typography variant="h4" sx={{ fontWeight: 800, mb: 0.5 }}>{kpi.value}</Typography>
              <Typography variant="body2" sx={{ color: COLORS.textSecondary, fontWeight: 500 }}>{kpi.title}</Typography>
            </Paper>
          </Grid>
        ))}

        {/* Charts Section: User Growth & Activity */}
        <Grid size={{ xs: 12, lg: 6 }}>
          <Paper sx={{ p: 3, borderRadius: '16px', height: '100%' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 2 }}>
              <Box>
                <Typography variant="h6" sx={{ fontWeight: 700, fontFamily: 'Playfair Display' }}>User Growth & Activity</Typography>
                <Stack direction="row" spacing={1} sx={{ mt: 0.5 }}>
                  <Chip label="Registered" size="small" sx={{ bgcolor: COLORS.primary, color: 'white', height: 20, fontSize: '0.75rem' }} />
                  <Chip label="Active" size="small" sx={{ bgcolor: COLORS.accent, color: 'white', height: 20, fontSize: '0.75rem' }} />
                </Stack>
              </Box>
              <Stack direction="row" spacing={0.5} sx={{ bgcolor: '#F0EBE1', p: 0.5, borderRadius: '20px' }}>
                <Button 
                  size="small" 
                  onClick={() => setUserGrowthPeriod('daily')} 
                  sx={{ 
                    borderRadius: '16px', 
                    px: 2, 
                    py: 0.5,
                    fontSize: '0.75rem',
                    textTransform: 'none',
                    bgcolor: userGrowthPeriod === 'daily' ? 'white' : 'transparent',
                    color: userGrowthPeriod === 'daily' ? COLORS.primary : COLORS.textSecondary,
                    boxShadow: userGrowthPeriod === 'daily' ? '0 2px 8px rgba(0,0,0,0.1)' : 'none',
                    '&:hover': { bgcolor: userGrowthPeriod === 'daily' ? 'white' : 'rgba(0,0,0,0.05)' }
                  }}
                >
                  Daily
                </Button>
                <Button 
                  size="small" 
                  onClick={() => setUserGrowthPeriod('monthly')} 
                  sx={{ 
                    borderRadius: '16px', 
                    px: 2, 
                    py: 0.5,
                    fontSize: '0.75rem',
                    textTransform: 'none',
                    bgcolor: userGrowthPeriod === 'monthly' ? 'white' : 'transparent',
                    color: userGrowthPeriod === 'monthly' ? COLORS.primary : COLORS.textSecondary,
                    boxShadow: userGrowthPeriod === 'monthly' ? '0 2px 8px rgba(0,0,0,0.1)' : 'none',
                    '&:hover': { bgcolor: userGrowthPeriod === 'monthly' ? 'white' : 'rgba(0,0,0,0.05)' }
                  }}
                >
                  Monthly
                </Button>
              </Stack>
            </Box>
            <Box sx={{ height: 320, width: '100%' }}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={userGrowthPeriod === 'daily' ? (overviewData?.dailyGrowthData || []) : (overviewData?.growthData || [])}>
                  <defs>
                    <linearGradient id="colorReg" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={COLORS.primary} stopOpacity={0.15}/>
                      <stop offset="95%" stopColor={COLORS.primary} stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorAct" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={COLORS.accent} stopOpacity={0.15}/>
                      <stop offset="95%" stopColor={COLORS.accent} stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2dcd0" />
                  <XAxis 
                    dataKey={userGrowthPeriod === 'daily' ? 'date' : 'month'} 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: COLORS.textSecondary, fontSize: 11 }} 
                  />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: COLORS.textSecondary, fontSize: 11 }} />
                  <RechartsTooltip
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)', background: '#fff' }}
                  />
                  <Area type="monotone" dataKey="registered" name="Registered" stroke={COLORS.primary} strokeWidth={3} fillOpacity={1} fill="url(#colorReg)" isAnimationActive={false} />
                  <Area type="monotone" dataKey="active" name="Active" stroke={COLORS.accent} strokeWidth={3} fillOpacity={1} fill="url(#colorAct)" isAnimationActive={false} />
                </AreaChart>
              </ResponsiveContainer>
            </Box>
          </Paper>
        </Grid>

        {/* Charts Section: Match Trends */}
        <Grid size={{ xs: 12, lg: 6 }}>
          <Paper sx={{ p: 3, borderRadius: '16px', height: '100%' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 2 }}>
              <Box>
                <Typography variant="h6" sx={{ fontWeight: 700, fontFamily: 'Playfair Display' }}>Match Trends</Typography>
                <Typography variant="caption" sx={{ color: COLORS.textSecondary, display: 'block', mt: 0.5 }}>
                  Matrimonial compatibility matching volume
                </Typography>
              </Box>
              <Stack direction="row" spacing={0.5} sx={{ bgcolor: '#F0EBE1', p: 0.5, borderRadius: '20px' }}>
                <Button 
                  size="small" 
                  onClick={() => setMatchTrendsPeriod('daily')} 
                  sx={{ 
                    borderRadius: '16px', 
                    px: 2, 
                    py: 0.5,
                    fontSize: '0.75rem',
                    textTransform: 'none',
                    bgcolor: matchTrendsPeriod === 'daily' ? 'white' : 'transparent',
                    color: matchTrendsPeriod === 'daily' ? COLORS.primary : COLORS.textSecondary,
                    boxShadow: matchTrendsPeriod === 'daily' ? '0 2px 8px rgba(0,0,0,0.1)' : 'none',
                    '&:hover': { bgcolor: matchTrendsPeriod === 'daily' ? 'white' : 'rgba(0,0,0,0.05)' }
                  }}
                >
                  Daily
                </Button>
                <Button 
                  size="small" 
                  onClick={() => setMatchTrendsPeriod('monthly')} 
                  sx={{ 
                    borderRadius: '16px', 
                    px: 2, 
                    py: 0.5,
                    fontSize: '0.75rem',
                    textTransform: 'none',
                    bgcolor: matchTrendsPeriod === 'monthly' ? 'white' : 'transparent',
                    color: matchTrendsPeriod === 'monthly' ? COLORS.primary : COLORS.textSecondary,
                    boxShadow: matchTrendsPeriod === 'monthly' ? '0 2px 8px rgba(0,0,0,0.1)' : 'none',
                    '&:hover': { bgcolor: matchTrendsPeriod === 'monthly' ? 'white' : 'rgba(0,0,0,0.05)' }
                  }}
                >
                  Monthly
                </Button>
              </Stack>
            </Box>
            <Box sx={{ height: 320, width: '100%' }}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={matchTrendsPeriod === 'daily' ? (overviewData?.dailyMatchData || []) : (overviewData?.matchGrowthData || [])}>
                  <defs>
                    <linearGradient id="colorMatches" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={COLORS.secondary} stopOpacity={0.25}/>
                      <stop offset="95%" stopColor={COLORS.secondary} stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2dcd0" />
                  <XAxis 
                    dataKey={matchTrendsPeriod === 'daily' ? 'date' : 'month'} 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: COLORS.textSecondary, fontSize: 11 }} 
                  />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: COLORS.textSecondary, fontSize: 11 }} />
                  <RechartsTooltip
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)', background: '#fff' }}
                  />
                  <Area type="monotone" dataKey="matches" name="Matches Generated" stroke={COLORS.secondary} strokeWidth={3} fillOpacity={1} fill="url(#colorMatches)" isAnimationActive={false} />
                </AreaChart>
              </ResponsiveContainer>
            </Box>
          </Paper>
        </Grid>

        {/* Activity Feed */}
        <Grid size={{ xs: 12, lg: 6 }}>
          <Paper sx={{ p: 3, borderRadius: '16px', height: '100%' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
              <Typography variant="h6" sx={{ fontWeight: 700, fontFamily: 'Playfair Display' }}>Recent Activity</Typography>
              <Button size="small" sx={{ color: COLORS.accent }}>View All</Button>
            </Box>
            <List disablePadding>
              {recentActivity.map((activity, index) => (
                <ListItem
                  key={activity.id}
                  disablePadding
                  sx={{
                    mb: 2,
                    pb: 2,
                    borderBottom: index !== recentActivity.length - 1 ? '1px solid #f0f0f0' : 'none'
                  }}
                >
                  <Box sx={{ display: 'flex', gap: 2, width: '100%' }}>
                    <Box
                      sx={{
                        p: 1,
                        borderRadius: '10px',
                        bgcolor: activity.status === 'success' ? '#E8F5E9' : activity.status === 'warning' ? '#FFF3E0' : '#FFEBEE',
                        color: activity.status === 'success' ? COLORS.success : activity.status === 'warning' ? COLORS.warning : COLORS.error,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        height: 36,
                        width: 36,
                      }}
                    >
                      {activity.icon}
                    </Box>
                    <Box sx={{ flexGrow: 1 }}>
                      <Typography variant="body2" sx={{ fontWeight: 600, color: COLORS.textPrimary }}>
                        {activity.text}
                      </Typography>
                      <Typography variant="caption" sx={{ color: COLORS.textSecondary }}>
                        {activity.time}
                      </Typography>
                    </Box>
                    <IconButton size="small">
                      <ArrowUpRight size={16} />
                    </IconButton>
                  </Box>
                </ListItem>
              ))}
              {recentActivity.length === 0 && (
                <Typography variant="body2" sx={{ color: COLORS.textSecondary }}>
                  No recent activity found.
                </Typography>
              )}
            </List>
            <Box sx={{ mt: 2, p: 2, bgcolor: COLORS.background, borderRadius: '12px', display: 'flex', alignItems: 'center', gap: 2 }}>
              <History size={20} color={COLORS.textSecondary} />
              <Typography variant="body2" sx={{ color: COLORS.textSecondary, display: 'flex', alignItems: 'center', gap: 1 }}>
                Last sync: {lastOverviewSyncTime}
                {isSyncing && <CircularProgress size={12} sx={{ color: COLORS.primary }} />}
              </Typography>
            </Box>
          </Paper>
        </Grid>

        {/* System Health / Live Monitor */}
        <Grid size={{ xs: 12, lg: 6 }}>
          <Paper sx={{ p: 3, borderRadius: '16px', height: '100%', display: 'flex', flexDirection: 'column' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
              <Typography variant="h6" sx={{ fontWeight: 700, fontFamily: 'Playfair Display' }}>System Live Monitor</Typography>
              <Chip 
                icon={<Activity size={12} color={COLORS.success} />} 
                label="All Systems Live" 
                size="small" 
                sx={{ bgcolor: '#E8F5E9', color: COLORS.success, fontWeight: 700 }} 
              />
            </Box>
            
            <Stack spacing={2} sx={{ flexGrow: 1 }}>
              <Box sx={{ p: 2, bgcolor: COLORS.background, borderRadius: '12px', border: '1px solid rgba(201, 168, 76, 0.2)' }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 700, color: COLORS.primary, mb: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Zap size={16} /> Real-Time Telemetry
                </Typography>
                <Grid container spacing={2}>
                  <Grid size={{ xs: 6 }}>
                    <Typography variant="caption" color="textSecondary" sx={{ display: 'block' }}>Active Polling Frequency</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>15s Background Intervals</Typography>
                  </Grid>
                  <Grid size={{ xs: 6 }}>
                    <Typography variant="caption" color="textSecondary" sx={{ display: 'block' }}>Server Link</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 600, color: COLORS.success }}>Operational</Typography>
                  </Grid>
                </Grid>
              </Box>

              <Box sx={{ display: 'flex', gap: 2, height: '100%' }}>
                <Paper 
                  variant="outlined" 
                  onClick={() => setActiveTab('Users')}
                  sx={{ 
                    p: 2.5, 
                    flex: 1, 
                    borderRadius: '12px', 
                    cursor: 'pointer', 
                    textAlign: 'center',
                    border: '1px solid rgba(0,0,0,0.06)',
                    transition: 'all 0.2s',
                    '&:hover': {
                      borderColor: COLORS.primary,
                      bgcolor: 'rgba(139, 26, 46, 0.02)',
                      transform: 'translateY(-2px)'
                    }
                  }}
                >
                  <Users size={24} color={COLORS.primary} style={{ margin: '0 auto 8px' }} />
                  <Typography variant="body2" sx={{ fontWeight: 700 }}>Manage Users</Typography>
                  <Typography variant="caption" color="textSecondary">Verify profiles & details</Typography>
                </Paper>
                
                <Paper 
                  variant="outlined" 
                  onClick={() => setActiveTab('Vendors')}
                  sx={{ 
                    p: 2.5, 
                    flex: 1, 
                    borderRadius: '12px', 
                    cursor: 'pointer', 
                    textAlign: 'center',
                    border: '1px solid rgba(0,0,0,0.06)',
                    transition: 'all 0.2s',
                    '&:hover': {
                      borderColor: COLORS.accent,
                      bgcolor: 'rgba(26, 107, 114, 0.02)',
                      transform: 'translateY(-2px)'
                    }
                  }}
                >
                  <Store size={24} color={COLORS.accent} style={{ margin: '0 auto 8px' }} />
                  <Typography variant="body2" sx={{ fontWeight: 700 }}>Verify Vendors</Typography>
                  <Typography variant="caption" color="textSecondary">
                    {pendingVendorCount} pending approval
                  </Typography>
                </Paper>
              </Box>
            </Stack>
          </Paper>
        </Grid>
      </Grid>
    </motion.div>
  );

  const renderContent = () => {
    if (loading) {
      return (
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
          <CircularProgress sx={{ color: COLORS.primary }} />
        </Box>
      );
    }

    switch (activeTab) {
      case 'Overview':
        return renderOverview();
      case 'Users':
        return <UsersTable />;
      case 'Vendors':
        return <VendorVerification pendingCount={pendingVendorCount} onStatusChange={loadOverview} />;
      case 'Analytics':
        return <AdminAnalytics />;
      case 'Settings':
        return <AdminSettings />;
      default:
        return (
          <Box sx={{ p: 4, textAlign: 'center' }}>
            <Typography variant="h5" color="textSecondary">Section "{activeTab}" is under development</Typography>
          </Box>
        );
    }
  };

  return (
    <LayoutGroup>
      <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: COLORS.background }}>
      {/* Sidebar for Desktop */}
      <Box
        component="nav"
        sx={{ width: { md: DRAWER_WIDTH }, flexShrink: { md: 0 } }}
      >
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{ keepMounted: true }}
          sx={{
            display: { xs: 'block', md: 'none' },
            '& .MuiDrawer-paper': { boxSizing: 'border-box', width: DRAWER_WIDTH, border: 'none' },
          }}
        >
          {drawer}
        </Drawer>
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: 'none', md: 'block' },
            '& .MuiDrawer-paper': { boxSizing: 'border-box', width: DRAWER_WIDTH, border: 'none' },
          }}
          open
        >
          {drawer}
        </Drawer>
      </Box>

      {/* Main Content */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: { xs: 2, md: 3 },
          width: { md: `calc(100% - ${DRAWER_WIDTH}px)` },
        }}
      >
        <AppBar
          position="sticky"
          elevation={0}
          sx={{
            bgcolor: 'transparent',
            color: COLORS.textPrimary,
            mb: 3,
          }}
        >
          <Toolbar sx={{ px: '0 !important' }}>
            <IconButton
              color="inherit"
              edge="start"
              onClick={handleDrawerToggle}
              sx={{ mr: 2, display: { md: 'none' } }}
            >
              <Menu />
            </IconButton>
            <Box sx={{ flexGrow: 1 }}>
              <Typography variant="h5" sx={{ fontWeight: 800, fontFamily: 'Playfair Display', color: COLORS.primary }}>
                {activeTab}
              </Typography>
              <Typography variant="body2" sx={{ color: COLORS.textSecondary }}>
                Welcome back, Admin. Here's what's happening today.
              </Typography>
            </Box>
          </Toolbar>
        </AppBar>

        <Container maxWidth="xl" sx={{ px: '0 !important' }}>
          <AnimatePresence mode="wait">
            <Box key={activeTab}>
              {renderContent()}
            </Box>
          </AnimatePresence>
        </Container>
      </Box>
    </Box>
    </LayoutGroup>
  );
};

export default AdminDashboard;


