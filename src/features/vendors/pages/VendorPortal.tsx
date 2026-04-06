import React, { useState, useEffect } from 'react';
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
  Button
} from '@mui/material';
import { 
  LayoutDashboard, 
  Image as ImageIcon, 
  MessageSquare, 
  Calendar, 
  BarChart3, 
  Settings, 
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
import { logout } from '@/features/auth/store/authSlice';
import axios from 'axios';

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
  
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user, token } = useSelector((state: RootState) => state.auth);

  useEffect(() => {
    // Simulate API fetch
    const fetchData = async () => {
      try {
        setLoading(true);
        // In real app: const response = await axios.get(`${process.env.REACT_APP_API_URL}/api/v1/vendor/profile`, { headers: { Authorization: `Bearer ${token}` } });
        // setVendorData(response.data);
        
        // Mock data
        setTimeout(() => {
          setVendorData({
            businessName: "Royal Ceylon Photography",
            category: "Photography",
            stats: {
              views: "1,240",
              quotes: "48",
              bookings: "12",
              rating: "4.9"
            }
          });
          setLoading(false);
        }, 1000);
      } catch (error) {
        console.error("Error fetching vendor data", error);
        setLoading(false);
      }
    };

    fetchData();
  }, [token]);

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

  const tabs = [
    { label: 'Dashboard', icon: <LayoutDashboard size={20} />, component: <DashboardOverview stats={vendorData?.stats} /> },
    { label: 'Quotes', icon: <MessageSquare size={20} />, component: <QuoteInbox /> },
    { label: 'Bookings', icon: <CheckCircle2 size={20} />, component: <BookingsManager /> },
    { label: 'Calendar', icon: <Calendar size={20} />, component: <VendorCalendar /> },
    { label: 'Portfolio', icon: <ImageIcon size={20} />, component: <PortfolioUpload /> },
    { label: 'Profile', icon: <User size={20} />, component: <ProfileManagement /> },
    { label: 'Analytics', icon: <BarChart3 size={20} />, component: <AnalyticsView /> },
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
          <Box sx={{ p: 3, display: 'flex', alignItems: 'center', gap: 2 }}>
            <Box
              sx={{
                width: 40,
                height: 40,
                bgcolor: COLORS.primary,
                borderRadius: '10px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: COLORS.secondary
              }}
            >
              <Star size={24} />
            </Box>
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
                {tab.label}
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
            <Tooltip title="Notifications">
              <IconButton size="small" sx={{ bgcolor: 'rgba(0,0,0,0.03)' }}>
                <Badge variant="dot" color="error">
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
                sx={{ 
                  width: 36, 
                  height: 36, 
                  bgcolor: COLORS.primary,
                  fontSize: '0.9rem',
                  fontWeight: 600
                }}
              >
                {vendorData?.businessName?.charAt(0) || 'V'}
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
        <Container maxWidth="xl" sx={{ py: 4, flexGrow: 1 }}>
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              {tabs[activeTab].component}
            </motion.div>
          </AnimatePresence>
        </Container>

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
                {tab.icon}
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
        <MenuItem onClick={() => { handleMenuClose(); setActiveTab(5); }}>
          <ListItemIcon><User size={18} /></ListItemIcon>
          Profile
        </MenuItem>
        <MenuItem onClick={() => { handleMenuClose(); setActiveTab(6); }}>
          <ListItemIcon><Settings size={18} /></ListItemIcon>
          Settings
        </MenuItem>
        <Divider />
        <MenuItem onClick={handleLogout} sx={{ color: 'error.main' }}>
          <ListItemIcon><LogOut size={18} color="#d32f2f" /></ListItemIcon>
          Logout
        </MenuItem>
      </Menu>
    </Box>
  );
}

const DashboardOverview = ({ stats }: any) => {
  if (!stats) return (
    <Grid container spacing={3}>
      {[1, 2, 3, 4].map((i) => (
        <Grid size={{ xs: 12, sm: 6, lg: 3 }} key={i}>
          <Skeleton variant="rectangular" height={100} sx={{ borderRadius: '16px' }} />
        </Grid>
      ))}
    </Grid>
  );

  return (
    <Box>
      <Typography variant="h5" sx={{ fontFamily: 'Playfair Display', fontWeight: 700, mb: 3, color: COLORS.primary }}>
        Welcome back!
      </Typography>
      
      <Grid container spacing={3}>
        <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
          <StatCard 
            title="Profile Views" 
            value={stats.views} 
            icon={Eye} 
            trend="+12%" 
            color={COLORS.accent} 
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
          <StatCard 
            title="Quote Requests" 
            value={stats.quotes} 
            icon={MessageSquare} 
            trend="+5%" 
            color={COLORS.primary} 
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
          <StatCard 
            title="Confirmed Bookings" 
            value={stats.bookings} 
            icon={CheckCircle2} 
            trend="+2" 
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
              {[
                { type: 'quote', title: 'New Quote Request', desc: 'Amila & Dilini requested a quote for Wedding Photography.', time: '2 hours ago', icon: MessageSquare, color: COLORS.primary },
                { type: 'booking', title: 'Booking Confirmed', desc: 'Saman & Kumari confirmed their booking for Dec 15th.', time: '5 hours ago', icon: CheckCircle2, color: '#2e7d32' },
                { type: 'review', title: 'New Review', desc: 'Kasun left a 5-star review: "Amazing service!"', time: 'Yesterday', icon: Star, color: COLORS.secondary },
              ].map((item, i) => (
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
              ))}
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


