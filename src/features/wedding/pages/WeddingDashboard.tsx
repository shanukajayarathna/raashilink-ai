import React, { useState, useEffect } from 'react';
import { 
  Box, Container, Typography, Grid, Card, CardContent, 
  Tabs, Tab, Button, Stack, Avatar, IconButton, 
  LinearProgress, useTheme, useMediaQuery, Skeleton,
  Tooltip, Badge
} from '@mui/material';
import { 
  Heart, Calendar, MapPin, Edit3, Camera, 
  CheckCircle2, DollarSign, Users, LayoutDashboard,
  ClipboardList, Store, BarChart3, Milestone,
  TrendingUp, AlertCircle, Plus, Sparkles,
  ChevronRight, ArrowRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useSelector } from 'react-redux';
import { RootState } from '@/app/store/store';
import weddingService from '../services/weddingService';

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

const DEFAULT_WEDDING_HERO_IMAGE = 'https://picsum.photos/seed/wedding-hero/1200/600';

function buildWeddingDashboardData(project: any, budgetSummary: any, vendorsPayload: any, user: any) {
  const checklist = Array.isArray(project?.checklist) ? project.checklist : [];
  const bookedVendors = Array.isArray(project?.vendors)
    ? project.vendors.filter((entry: any) => ['requested', 'booked'].includes(entry?.status)).length
    : 0;
  const totalVendors = vendorsPayload?.data?.total || vendorsPayload?.data?.items?.length || 0;
  const completedTasks = checklist.filter((item: any) => item?.completed).length;
  const partner1 = user?.firstName || user?.name?.split(' ')?.[0] || 'You';
  const partner2 = user?.weddingProject?.partnerName || 'Partner';
  const weddingDateValue =
    project?.weddingDate || user?.weddingProject?.weddingDate || new Date(Date.now() + 180 * 24 * 60 * 60 * 1000).toISOString();

  return {
    couple: {
      partner1,
      partner2,
      date: new Date(weddingDateValue).toISOString().split('T')[0],
      venue: project?.venueId ? 'Venue selected' : 'Venue planning in progress',
      heroImage: user?.coverPhoto || user?.profilePic || DEFAULT_WEDDING_HERO_IMAGE,
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

  const { token, user } = useSelector((state: RootState) => state.auth);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [projectResponse, budgetResponse, vendorsResponse] = await Promise.all([
          weddingService.getProject(),
          weddingService.getBudget(),
          weddingService.getVendors(),
        ]);

        setWeddingData(
          buildWeddingDashboardData(projectResponse?.data, budgetResponse, vendorsResponse, user)
        );
        setError(null);
      } catch (err) {
        console.error('Failed to load wedding details', err);
        setError('Failed to load wedding details. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    if (token) {
      fetchData();
      return;
    }

    setWeddingData(buildWeddingDashboardData(null, null, null, user));
    setLoading(false);
  }, [token, user]);

  const handleTabChange = (_: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  if (loading) return <WeddingSkeleton />;
  if (error) return <WeddingError error={error} onRetry={() => window.location.reload()} />;

  const { couple, stats } = weddingData;
  const daysToGo = Math.ceil((new Date(couple.date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
  const isOverBudget = stats.spentSoFar > stats.totalBudget;

  return (
    <Container maxWidth="xl" sx={{ py: 4, pb: 10 }}>
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
        <Box 
          component="img" 
          src={couple.heroImage} 
          sx={{ width: '100%', height: '100%', objectFit: 'cover' }}
          referrerPolicy="no-referrer"
        />
        <Box sx={{ 
          position: 'absolute', 
          inset: 0, 
          background: 'linear-gradient(to top, rgba(0,0,0,0.8) 0%, rgba(0,0,0,0.2) 60%, transparent 100%)',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'flex-end',
          p: { xs: 3, md: 6 }
        }}>
          <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 1 }}>
            <Typography variant="h2" sx={{ 
              fontFamily: 'Playfair Display', 
              fontWeight: 700, 
              color: 'white',
              fontSize: { xs: '2.5rem', md: '4.5rem' }
            }}>
              {couple.partner1}
            </Typography>
            <Heart size={isMobile ? 24 : 40} fill={COLORS.secondary} color={COLORS.secondary} />
            <Typography variant="h2" sx={{ 
              fontFamily: 'Playfair Display', 
              fontWeight: 700, 
              color: 'white',
              fontSize: { xs: '2.5rem', md: '4.5rem' }
            }}>
              {couple.partner2}
            </Typography>
          </Stack>
          
          <Stack direction={{ xs: 'column', md: 'row' }} spacing={{ xs: 1, md: 4 }} alignItems={{ xs: 'flex-start', md: 'center' }}>
            <Stack direction="row" spacing={1} alignItems="center" sx={{ color: 'rgba(255,255,255,0.9)' }}>
              <Calendar size={18} />
              <Typography variant="h6" sx={{ fontWeight: 600 }}>December 28, 2025</Typography>
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

          <Button 
            variant="contained" 
            startIcon={<Camera size={18} />}
            sx={{ 
              position: 'absolute', 
              top: 20, 
              right: 20, 
              bgcolor: 'rgba(255,255,255,0.2)', 
              backdropFilter: 'blur(10px)',
              color: 'white',
              '&:hover': { bgcolor: 'rgba(255,255,255,0.3)' }
            }}
          >
            Update Photo
          </Button>
        </Box>
      </MotionBox>

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
          {activeTab === 0 && <OverviewTab data={weddingData} onSwitchTab={setActiveTab} />}
          {activeTab === 1 && <ChecklistTab />}
          {activeTab === 2 && <VendorTab />}
          {activeTab === 3 && <BudgetTab />}
          {activeTab === 4 && <TimelineTab />}
        </motion.div>
      </AnimatePresence>
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
const Chip = ({ label, size, sx }: any) => (
  <Box sx={{ 
    px: 1.5, 
    py: 0.5, 
    borderRadius: 10, 
    fontSize: '0.75rem', 
    display: 'inline-flex', 
    alignItems: 'center',
    ...sx 
  }}>
    {label}
  </Box>
);


