import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Grid,
  CircularProgress,
  Alert,
} from '@mui/material';
import {
  TrendingUp,
  Heart,
  Store,
  MapPin,
  Users,
  Star,
  Activity,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';
import { motion } from 'motion/react';
import adminService from '../services/adminService';

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

const CHART_COLORS = [COLORS.primary, COLORS.secondary, COLORS.accent, '#4A148C', '#004D40', '#BF360C'];

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

const AdminAnalytics: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [analytics, setAnalytics] = useState<any>(null);
  const [lastSyncTime, setLastSyncTime] = useState('N/A');

  useEffect(() => {
    let mounted = true;

    const loadAnalytics = async (showSpinner = true) => {
      try {
        if (showSpinner) {
          setLoading(true);
        }
        setError('');
        const response = await adminService.getAnalytics();
        if (mounted) {
          const newData = response?.data || null;
          if (newData?.generatedAt) {
            setLastSyncTime(new Date(newData.generatedAt).toLocaleTimeString());
          }
          setAnalytics((prev: any) => {
            if (isDeepEqual(prev, newData)) {
              return prev;
            }
            return newData;
          });
        }
      } catch (err: any) {
        if (mounted) {
          setError(err?.response?.data?.message || 'Failed to load analytics');
        }
      } finally {
        if (mounted) {
          if (showSpinner) {
            setLoading(false);
          }
        }
      }
    };

    void loadAnalytics(true);
    const interval = setInterval(() => {
      void loadAnalytics(false);
    }, 15000);

    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, []);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
        <CircularProgress sx={{ color: COLORS.primary }} />
      </Box>
    );
  }

  const compatibilityData = analytics?.compatibilityDistribution || [];
  const provinceData = analytics?.provinceDistribution || [];
  const vendorCategoryData = analytics?.vendorCategoryDistribution || [];
  const retentionData = analytics?.retentionFunnel || [];
  const genderDistribution = analytics?.genderDistribution || [];
  const ageDistribution = analytics?.ageDistribution || [];
  const rashiDistribution = analytics?.rashiDistribution || [];
  const matchInterestDistribution = analytics?.matchInterestDistribution || [];

  const generatedAt = lastSyncTime;
  const growthDelta = analytics?.users?.growthDelta || 0;

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Typography variant="h6" sx={{ fontWeight: 700, fontFamily: 'Playfair Display' }}>Platform Analytics</Typography>
          <Typography variant="body2" sx={{ color: COLORS.textSecondary }}>
            Real-time data refreshes every 15 seconds. Last sync: {generatedAt}
          </Typography>
        </Box>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid size={{ xs: 12, md: 6, lg: 3 }}>
          <Paper sx={{ p: 2.5, borderRadius: '12px' }}>
            <Typography variant="body2" sx={{ color: COLORS.textSecondary }}>Total Users</Typography>
            <Typography variant="h5" sx={{ fontWeight: 800 }}>{analytics?.users?.total || 0}</Typography>
          </Paper>
        </Grid>
        <Grid size={{ xs: 12, md: 6, lg: 3 }}>
          <Paper sx={{ p: 2.5, borderRadius: '12px' }}>
            <Typography variant="body2" sx={{ color: COLORS.textSecondary }}>New Users This Month</Typography>
            <Typography variant="h5" sx={{ fontWeight: 800 }}>{analytics?.users?.newThisMonth || 0}</Typography>
          </Paper>
        </Grid>
        <Grid size={{ xs: 12, md: 6, lg: 3 }}>
          <Paper sx={{ p: 2.5, borderRadius: '12px' }}>
            <Typography variant="body2" sx={{ color: COLORS.textSecondary }}>Growth Delta</Typography>
            <Typography variant="h5" sx={{ fontWeight: 800, color: growthDelta >= 0 ? COLORS.success : COLORS.error }}>
              {growthDelta >= 0 ? '+' : ''}{growthDelta}
            </Typography>
          </Paper>
        </Grid>
        <Grid size={{ xs: 12, md: 6, lg: 3 }}>
          <Paper sx={{ p: 2.5, borderRadius: '12px' }}>
            <Typography variant="body2" sx={{ color: COLORS.textSecondary }}>Approved Vendors</Typography>
            <Typography variant="h5" sx={{ fontWeight: 800 }}>{analytics?.vendors?.approved || 0}</Typography>
          </Paper>
        </Grid>
      </Grid>

      <Grid container spacing={3}>
        {/* Compatibility Score Distribution */}
        <Grid size={{ xs: 12, lg: 6 }}>
          <Paper sx={{ p: 3, borderRadius: '16px', height: '100%' }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 3, display: 'flex', alignItems: 'center', gap: 1 }}>
              <Heart size={20} color={COLORS.primary} /> Compatibility Score Distribution
            </Typography>
            <Box sx={{ height: 300 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={compatibilityData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                  <XAxis dataKey="range" axisLine={false} tickLine={false} tick={{ fontSize: 12 }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12 }} />
                  <RechartsTooltip cursor={{ fill: 'transparent' }} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }} />
                  <Bar dataKey="count" fill={COLORS.primary} radius={[4, 4, 0, 0]} barSize={40} isAnimationActive={false} />
                </BarChart>
              </ResponsiveContainer>
            </Box>
          </Paper>
        </Grid>

        {/* Geographic Distribution */}
        <Grid size={{ xs: 12, lg: 6 }}>
          <Paper sx={{ p: 3, borderRadius: '16px', height: '100%' }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 3, display: 'flex', alignItems: 'center', gap: 1 }}>
              <MapPin size={20} color={COLORS.accent} /> Geographic Distribution (Provinces)
            </Typography>
            <Box sx={{ height: 300, display: 'flex', alignItems: 'center' }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={provinceData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={5}
                    dataKey="value"
                    isAnimationActive={false}
                  >
                    {provinceData.map((_: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                    ))}
                  </Pie>
                  <RechartsTooltip />
                  <Legend verticalAlign="middle" align="right" layout="vertical" />
                </PieChart>
              </ResponsiveContainer>
            </Box>
          </Paper>
        </Grid>

        {/* Popular Wedding Categories */}
        <Grid size={{ xs: 12, lg: 7 }}>
          <Paper sx={{ p: 3, borderRadius: '16px', height: '100%' }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 3, display: 'flex', alignItems: 'center', gap: 1 }}>
              <Store size={20} color={COLORS.secondary} /> Popular Wedding Categories (Quotes)
            </Typography>
            <Box sx={{ height: 350 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={vendorCategoryData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f0f0f0" />
                  <XAxis type="number" hide />
                  <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} width={100} tick={{ fontSize: 12 }} />
                  <RechartsTooltip cursor={{ fill: 'transparent' }} />
                  <Bar dataKey="quotes" fill={COLORS.accent} radius={[0, 4, 4, 0]} barSize={24} isAnimationActive={false} />
                </BarChart>
              </ResponsiveContainer>
            </Box>
          </Paper>
        </Grid>

        {/* User Retention Funnel */}
        <Grid size={{ xs: 12, lg: 5 }}>
          <Paper sx={{ p: 3, borderRadius: '16px', height: '100%' }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 3, display: 'flex', alignItems: 'center', gap: 1 }}>
              <TrendingUp size={20} color={COLORS.success} /> User Retention Funnel
            </Typography>
            <Box sx={{ mt: 2 }}>
              {retentionData.map((item: any, index: number) => (
                <Box key={index} sx={{ mb: 2.5 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>{item.step}</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 700, color: COLORS.primary }}>{item.percentage}%</Typography>
                  </Box>
                  <Box sx={{ width: '100%', height: 12, bgcolor: '#f0f0f0', borderRadius: '6px', overflow: 'hidden' }}>
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${item.percentage}%` }}
                      transition={{ duration: 1, delay: index * 0.1 }}
                      style={{ height: '100%', backgroundColor: COLORS.primary, borderRadius: '6px' }}
                    />
                  </Box>
                  <Typography variant="caption" sx={{ color: COLORS.textSecondary, mt: 0.5, display: 'block' }}>
                    {item.count} users reached this stage
                  </Typography>
                </Box>
              ))}
            </Box>
          </Paper>
        </Grid>

        {/* User Gender Ratio */}
        <Grid size={{ xs: 12, lg: 6 }}>
          <Paper sx={{ p: 3, borderRadius: '16px', height: '100%' }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 3, display: 'flex', alignItems: 'center', gap: 1 }}>
              <Users size={20} color={COLORS.primary} /> User Gender Ratio
            </Typography>
            <Box sx={{ height: 300, display: 'flex', alignItems: 'center' }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={genderDistribution}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={5}
                    dataKey="value"
                    isAnimationActive={false}
                  >
                    {genderDistribution.map((_: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={CHART_COLORS[(index + 2) % CHART_COLORS.length]} />
                    ))}
                  </Pie>
                  <RechartsTooltip />
                  <Legend verticalAlign="middle" align="right" layout="vertical" />
                </PieChart>
              </ResponsiveContainer>
            </Box>
          </Paper>
        </Grid>

        {/* Match Interest Breakdown */}
        <Grid size={{ xs: 12, lg: 6 }}>
          <Paper sx={{ p: 3, borderRadius: '16px', height: '100%' }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 3, display: 'flex', alignItems: 'center', gap: 1 }}>
              <Heart size={20} color={COLORS.primary} /> Match Interest Breakdown
            </Typography>
            <Box sx={{ height: 300, display: 'flex', alignItems: 'center' }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={matchInterestDistribution}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={5}
                    dataKey="value"
                    isAnimationActive={false}
                  >
                    {matchInterestDistribution.map((_: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={[COLORS.primary, COLORS.secondary][index % 2]} />
                    ))}
                  </Pie>
                  <RechartsTooltip />
                  <Legend verticalAlign="middle" align="right" layout="vertical" />
                </PieChart>
              </ResponsiveContainer>
            </Box>
          </Paper>
        </Grid>

        {/* Age Group Demographics */}
        <Grid size={{ xs: 12, lg: 6 }}>
          <Paper sx={{ p: 3, borderRadius: '16px', height: '100%' }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 3, display: 'flex', alignItems: 'center', gap: 1 }}>
              <Activity size={20} color={COLORS.accent} /> Age Group Demographics
            </Typography>
            <Box sx={{ height: 300 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={ageDistribution}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                  <XAxis dataKey="range" axisLine={false} tickLine={false} tick={{ fontSize: 12 }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12 }} />
                  <RechartsTooltip cursor={{ fill: 'transparent' }} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }} />
                  <Bar dataKey="count" fill={COLORS.accent} radius={[4, 4, 0, 0]} barSize={40} isAnimationActive={false} />
                </BarChart>
              </ResponsiveContainer>
            </Box>
          </Paper>
        </Grid>

        {/* Horoscope Rashi Distribution */}
        <Grid size={{ xs: 12, lg: 6 }}>
          <Paper sx={{ p: 3, borderRadius: '16px', height: '100%' }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 3, display: 'flex', alignItems: 'center', gap: 1 }}>
              <Star size={20} color={COLORS.secondary} /> Horoscope Rashi Distribution
            </Typography>
            <Box sx={{ height: 300 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={rashiDistribution} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f0f0f0" />
                  <XAxis type="number" hide />
                  <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} width={100} tick={{ fontSize: 12 }} />
                  <RechartsTooltip cursor={{ fill: 'transparent' }} />
                  <Bar dataKey="value" fill={COLORS.secondary} radius={[0, 4, 4, 0]} barSize={16} isAnimationActive={false} />
                </BarChart>
              </ResponsiveContainer>
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </motion.div>
  );
};

export default React.memo(AdminAnalytics);

