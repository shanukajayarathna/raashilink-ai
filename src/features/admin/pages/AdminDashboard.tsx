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
  Tooltip,
  Badge,
  CircularProgress,
  Alert,
} from '@mui/material';
import {
  LayoutDashboard,
  Users,
  Store,
  HeartHandshake,
  CalendarDays,
  BarChart3,
  Settings,
  Menu,
  Bell,
  LogOut,
  TrendingUp,
  ArrowUpRight,
  History,
  CheckCircle2,
  XCircle,
  AlertCircle,
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

// Mock Data for Overview
const KpiData = [
  { title: 'Total Users', value: '12,450', growth: '+15%', icon: <Users size={24} />, color: COLORS.primary },
  { title: 'Active Vendors', value: '234', growth: '+8%', icon: <Store size={24} />, color: COLORS.accent },
  { title: 'Matches This Month', value: '127', growth: '+23%', icon: <HeartHandshake size={24} />, color: COLORS.secondary },
  { title: 'Revenue (LKR)', value: '450,000', growth: '+12%', icon: <TrendingUp size={24} />, color: COLORS.success },
];

const UserGrowthData = [
  { month: 'Oct', registered: 400, active: 240 },
  { month: 'Nov', registered: 600, active: 380 },
  { month: 'Dec', registered: 800, active: 520 },
  { month: 'Jan', registered: 1100, active: 750 },
  { month: 'Feb', registered: 1400, active: 980 },
  { month: 'Mar', registered: 1800, active: 1250 },
];

const RecentActivity = [
  { id: 1, type: 'user', icon: <Users size={16} />, text: 'New user "Amara Silva" registered', time: '2 mins ago', status: 'success' },
  { id: 2, type: 'vendor', icon: <Store size={16} />, text: 'Vendor "Golden Weddings" submitted verification', time: '15 mins ago', status: 'warning' },
  { id: 3, type: 'match', icon: <HeartHandshake size={16} />, text: 'New successful match: Kasun & Dilini', time: '1 hour ago', status: 'success' },
  { id: 4, type: 'report', icon: <AlertCircle size={16} />, text: 'User report: Inappropriate content', time: '3 hours ago', status: 'error' },
];

const AdminDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState('Overview');
  const [mobileOpen, setMobileOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [overviewData, setOverviewData] = useState<any>(null);
  const theme = useTheme();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const user = useSelector((state: RootState) => state.auth.user);

  useEffect(() => {
    const loadOverview = async () => {
      try {
        setLoading(true);
        const response = await adminService.getOverview();
        setOverviewData(response?.data || null);
      } catch (error) {
        console.error('Failed to load admin overview', error);
        setOverviewData(null);
      } finally {
        setLoading(false);
      }
    };

    loadOverview();
  }, []);

  const handleSignOut = () => {
    dispatch(logout());
    navigate('/login');
  };

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const navItems = [
    { name: 'Overview', icon: <LayoutDashboard size={20} /> },
    { name: 'Users', icon: <Users size={20} /> },
    { name: 'Vendors', icon: <Store size={20} /> },
    { name: 'Matches', icon: <HeartHandshake size={20} /> },
    { name: 'Wedding Projects', icon: <CalendarDays size={20} /> },
    { name: 'Analytics', icon: <BarChart3 size={20} /> },
    { name: 'Settings', icon: <Settings size={20} /> },
  ];

  const kpiData = overviewData?.kpis || KpiData;
  const userGrowthData = overviewData?.growthData || UserGrowthData;
  const recentActivity = overviewData?.recentActivity || RecentActivity;

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
              {activeTab === item.name && (
                <motion.div layoutId="active-pill" style={{ width: 4, height: 20, backgroundColor: COLORS.secondary, borderRadius: 2 }} />
              )}
            </ListItemButton>
          </ListItem>
        ))}
      </List>
      <Box sx={{ p: 3, mt: 'auto', bgcolor: 'rgba(0,0,0,0.2)' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
          <Avatar sx={{ bgcolor: COLORS.secondary, color: COLORS.primary, fontWeight: 700 }}>
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

        {/* Charts Section */}
        <Grid size={{ xs: 12, lg: 8 }}>
          <Paper sx={{ p: 3, borderRadius: '16px', height: '100%' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
              <Typography variant="h6" sx={{ fontWeight: 700, fontFamily: 'Playfair Display' }}>User Growth & Activity</Typography>
              <Stack direction="row" spacing={1}>
                <Chip label="Registered" size="small" sx={{ bgcolor: COLORS.primary, color: 'white' }} />
                <Chip label="Active" size="small" sx={{ bgcolor: COLORS.accent, color: 'white' }} />
              </Stack>
            </Box>
            <Box sx={{ height: 350, width: '100%' }}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={userGrowthData}>
                  <defs>
                    <linearGradient id="colorReg" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={COLORS.primary} stopOpacity={0.1}/>
                      <stop offset="95%" stopColor={COLORS.primary} stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorAct" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={COLORS.accent} stopOpacity={0.1}/>
                      <stop offset="95%" stopColor={COLORS.accent} stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                  <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: COLORS.textSecondary, fontSize: 12 }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: COLORS.textSecondary, fontSize: 12 }} />
                  <RechartsTooltip
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}
                  />
                  <Area type="monotone" dataKey="registered" stroke={COLORS.primary} strokeWidth={3} fillOpacity={1} fill="url(#colorReg)" />
                  <Area type="monotone" dataKey="active" stroke={COLORS.accent} strokeWidth={3} fillOpacity={1} fill="url(#colorAct)" />
                </AreaChart>
              </ResponsiveContainer>
            </Box>
          </Paper>
        </Grid>

        {/* Activity Feed */}
        <Grid size={{ xs: 12, lg: 4 }}>
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
            </List>
            <Box sx={{ mt: 2, p: 2, bgcolor: COLORS.background, borderRadius: '12px', display: 'flex', alignItems: 'center', gap: 2 }}>
              <History size={20} color={COLORS.textSecondary} />
              <Typography variant="body2" sx={{ color: COLORS.textSecondary }}>
                Last backup completed 4 hours ago
              </Typography>
            </Box>
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
        return <VendorVerification />;
      case 'Analytics':
        return <AdminAnalytics />;
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
            <Stack direction="row" spacing={1}>
              <Tooltip title="Notifications">
                <IconButton sx={{ bgcolor: 'white', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
                  <Badge variant="dot" color="error">
                    <Bell size={20} />
                  </Badge>
                </IconButton>
              </Tooltip>
              <Tooltip title="Settings">
                <IconButton sx={{ bgcolor: 'white', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
                  <Settings size={20} />
                </IconButton>
              </Tooltip>
            </Stack>
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


