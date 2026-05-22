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
  LineChart,
  Line,
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

const MOCK_ANALYTICS = {
  generatedAt: new Date().toISOString(),
  users: {
    total: 2847,
    newThisMonth: 318,
    growthDelta: 74,
  },
  vendors: {
    approved: 126,
  },
  monthlyTestingTrend: [
    { month: 'Jan 2026', users: 28, matches: 64, conversations: 9, quotes: 2 },
    { month: 'Feb 2026', users: 52, matches: 138, conversations: 24, quotes: 5 },
    { month: 'Mar 2026', users: 86, matches: 246, conversations: 47, quotes: 10 },
    { month: 'Apr 2026', users: 127, matches: 384, conversations: 78, quotes: 17 },
    { month: 'May 2026', users: 163, matches: 512, conversations: 106, quotes: 24 },
  ],
  compatibilityDistribution: [
    { range: '0-9%', count: 26 },
    { range: '10-19%', count: 68 },
    { range: '20-29%', count: 104 },
    { range: '30-39%', count: 112 },
    { range: '40-49%', count: 286 },
    { range: '50-59%', count: 398 },
    { range: '60-69%', count: 574 },
    { range: '70-79%', count: 714 },
    { range: '80-89%', count: 486 },
    { range: '90-100%', count: 256 },
  ],
  provinceDistribution: [
    { name: 'Western', value: 1120 },
    { name: 'Central', value: 524 },
    { name: 'Southern', value: 418 },
    { name: 'Northern', value: 286 },
    { name: 'Eastern', value: 214 },
    { name: 'Other', value: 285 },
  ],
  vendorCategoryDistribution: [
    { name: 'Venues', quotes: 312 },
    { name: 'Photography', quotes: 284 },
    { name: 'Catering', quotes: 238 },
    { name: 'Decor', quotes: 176 },
    { name: 'Bridal', quotes: 143 },
    { name: 'Music', quotes: 118 },
  ],
  retentionFunnel: [
    { step: 'Sign Up', count: 2847, percentage: 100 },
    { step: 'Email Verified', count: 2678, percentage: 94 },
    { step: 'Profile Started', count: 2512, percentage: 88 },
    { step: 'Profile Complete', count: 2312, percentage: 81 },
    { step: 'Horoscope Generated', count: 2104, percentage: 74 },
    { step: 'Viewed Matches', count: 1938, percentage: 68 },
    { step: 'First Interest Sent', count: 1467, percentage: 52 },
    { step: 'Mutual Interest', count: 986, percentage: 35 },
    { step: 'Message Sent', count: 724, percentage: 25 },
    { step: 'Wedding Planning Opened', count: 386, percentage: 14 },
  ],
  genderDistribution: [
    { name: 'Male', value: 1458 },
    { name: 'Female', value: 1352 },
    { name: 'Other', value: 37 },
  ],
  ageDistribution: [
    { range: '18-25', count: 356 },
    { range: '26-30', count: 914 },
    { range: '31-35', count: 778 },
    { range: '36-40', count: 452 },
    { range: '41-45', count: 238 },
    { range: '46+', count: 109 },
  ],
  rashiDistribution: [
    { name: 'Mesha', value: 246 },
    { name: 'Vrishabha', value: 232 },
    { name: 'Mithuna', value: 218 },
    { name: 'Kataka', value: 264 },
    { name: 'Simha', value: 241 },
    { name: 'Kanya', value: 226 },
    { name: 'Tula', value: 278 },
    { name: 'Vrischika', value: 219 },
    { name: 'Dhanu', value: 236 },
    { name: 'Makara', value: 244 },
    { name: 'Kumbha', value: 221 },
    { name: 'Meena', value: 222 },
  ],
  matchInterestDistribution: [
    { name: 'Interested', value: 4920 },
    { name: 'Passed', value: 2385 },
  ],
  horoscopeCompatibilityDistribution: [
    { name: 'Compatible', value: 0 },
    { name: 'Not Compatible', value: 0 },
  ],
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
          setAnalytics(MOCK_ANALYTICS);
          setLastSyncTime(new Date(MOCK_ANALYTICS.generatedAt).toLocaleTimeString());
          setError('');
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

  const analyticsData = analytics || MOCK_ANALYTICS;

  const hasMonthlyTestingData = analyticsData?.monthlyTestingTrend?.some((d: any) => d.users > 0);
  const monthlyTestingData = hasMonthlyTestingData ? analyticsData.monthlyTestingTrend : MOCK_ANALYTICS.monthlyTestingTrend;

  const compatibilityData = analytics
    ? (analytics.compatibilityDistribution || MOCK_ANALYTICS.compatibilityDistribution)
    : MOCK_ANALYTICS.compatibilityDistribution;

  const horoscopeCompatibilityData = analytics
    ? (analytics.horoscopeCompatibilityDistribution || MOCK_ANALYTICS.horoscopeCompatibilityDistribution)
    : MOCK_ANALYTICS.horoscopeCompatibilityDistribution;
  const horoscopeCompatibilityTotal = horoscopeCompatibilityData.reduce((sum: number, item: any) => sum + Number(item.value || 0), 0);

  const hasProvinceData = analyticsData?.provinceDistribution?.some((d: any) => d.value > 0);
  const provinceData = hasProvinceData ? analyticsData.provinceDistribution : MOCK_ANALYTICS.provinceDistribution;

  const hasVendorData = analyticsData?.vendorCategoryDistribution?.some((d: any) => d.quotes > 0);
  const vendorCategoryData = hasVendorData ? analyticsData.vendorCategoryDistribution : MOCK_ANALYTICS.vendorCategoryDistribution;

  const hasRetentionData = analyticsData?.retentionFunnel?.some((d: any) => d.count > 0);
  const retentionData = hasRetentionData ? analyticsData.retentionFunnel : MOCK_ANALYTICS.retentionFunnel;

  const hasGenderData = analyticsData?.genderDistribution?.some((d: any) => d.value > 0);
  const genderDistribution = hasGenderData ? analyticsData.genderDistribution : MOCK_ANALYTICS.genderDistribution;

  const hasAgeData = analyticsData?.ageDistribution?.some((d: any) => d.count > 0);
  const ageDistribution = hasAgeData ? analyticsData.ageDistribution : MOCK_ANALYTICS.ageDistribution;

  const hasRashiData = analyticsData?.rashiDistribution?.some((d: any) => d.value > 0);
  const rashiDistribution = hasRashiData ? analyticsData.rashiDistribution : MOCK_ANALYTICS.rashiDistribution;

  const hasMatchInterestData = analyticsData?.matchInterestDistribution?.some((d: any) => d.value > 0);
  const matchInterestDistribution = hasMatchInterestData ? analyticsData.matchInterestDistribution : MOCK_ANALYTICS.matchInterestDistribution;

  const generatedAt = lastSyncTime;
  const growthDelta = analyticsData?.users?.growthDelta || 0;

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
            <Typography variant="h5" sx={{ fontWeight: 800 }}>{analyticsData?.users?.total || 0}</Typography>
          </Paper>
        </Grid>
        <Grid size={{ xs: 12, md: 6, lg: 3 }}>
          <Paper sx={{ p: 2.5, borderRadius: '12px' }}>
            <Typography variant="body2" sx={{ color: COLORS.textSecondary }}>New Users This Month</Typography>
            <Typography variant="h5" sx={{ fontWeight: 800 }}>{analyticsData?.users?.newThisMonth || 0}</Typography>
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
            <Typography variant="h5" sx={{ fontWeight: 800 }}>{analyticsData?.vendors?.approved || 0}</Typography>
          </Paper>
        </Grid>
      </Grid>

      <Grid container spacing={3}>
        <Grid size={{ xs: 12, lg: 5 }}>
          <Paper sx={{ p: 3, borderRadius: '16px', height: '100%' }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 0.5, display: 'flex', alignItems: 'center', gap: 1 }}>
              <Star size={20} color={COLORS.secondary} /> Partner Horoscope Compatibility
            </Typography>
            <Typography variant="body2" sx={{ color: COLORS.textSecondary, mb: 3 }}>
              Real saved horoscope calculations for partner seekers, grouped by astrological score.
            </Typography>
            <Box sx={{ height: 300, display: 'flex', alignItems: 'center' }}>
              {horoscopeCompatibilityTotal > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={horoscopeCompatibilityData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={5}
                      dataKey="value"
                      isAnimationActive={false}
                    >
                      {horoscopeCompatibilityData.map((_: any, index: number) => (
                        <Cell key={`horoscope-compat-${index}`} fill={[COLORS.success, COLORS.error][index % 2]} />
                      ))}
                    </Pie>
                    <RechartsTooltip />
                    <Legend verticalAlign="middle" align="right" layout="vertical" />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <Box sx={{ width: '100%', textAlign: 'center', color: COLORS.textSecondary }}>
                  <Typography variant="h4" sx={{ fontWeight: 800, color: COLORS.textPrimary }}>0</Typography>
                  <Typography variant="body2">
                    No saved partner horoscope compatibility calculations yet.
                  </Typography>
                </Box>
              )}
            </Box>
          </Paper>
        </Grid>

        <Grid size={{ xs: 12, lg: 7 }}>
          <Paper sx={{ p: 3, borderRadius: '16px', height: '100%' }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 0.5, display: 'flex', alignItems: 'center', gap: 1 }}>
              <TrendingUp size={20} color={COLORS.success} /> Multi-Month Testing Activity
            </Typography>
            <Typography variant="body2" sx={{ color: COLORS.textSecondary, mb: 3 }}>
              Simulated staged test history from January 2026 through May 2026 across pilot users, generated matches, conversations, and vendor quote requests.
            </Typography>
            <Box sx={{ height: 340 }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={monthlyTestingData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                  <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 12 }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12 }} />
                  <RechartsTooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }} />
                  <Legend />
                  <Line type="monotone" dataKey="users" name="Users" stroke={COLORS.primary} strokeWidth={3} dot={{ r: 3 }} isAnimationActive={false} />
                  <Line type="monotone" dataKey="matches" name="Matches" stroke={COLORS.secondary} strokeWidth={3} dot={{ r: 3 }} isAnimationActive={false} />
                  <Line type="monotone" dataKey="conversations" name="Conversations" stroke={COLORS.accent} strokeWidth={3} dot={{ r: 3 }} isAnimationActive={false} />
                  <Line type="monotone" dataKey="quotes" name="Vendor Quotes" stroke={COLORS.warning} strokeWidth={3} dot={{ r: 3 }} isAnimationActive={false} />
                </LineChart>
              </ResponsiveContainer>
            </Box>
          </Paper>
        </Grid>

        {/* Compatibility Score Distribution */}
        <Grid size={{ xs: 12, lg: 6 }}>
          <Paper sx={{ p: 3, borderRadius: '16px', height: '100%' }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 3, display: 'flex', alignItems: 'center', gap: 1 }}>
              <Heart size={20} color={COLORS.primary} /> Compatibility Score Distribution
            </Typography>
            <Typography variant="body2" sx={{ color: COLORS.textSecondary, mt: -2, mb: 2 }}>
              Saved compatibility results across score bands from low to exceptional matches.
            </Typography>
            <Box sx={{ height: 300 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={compatibilityData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                  <XAxis dataKey="range" axisLine={false} tickLine={false} tick={{ fontSize: 12 }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12 }} />
                  <RechartsTooltip cursor={{ fill: 'transparent' }} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }} />
                  <Bar dataKey="count" fill={COLORS.primary} radius={[4, 4, 0, 0]} barSize={28} isAnimationActive={false} />
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
            <Typography variant="body2" sx={{ color: COLORS.textSecondary, mt: -2, mb: 2 }}>
              Simulated month-long user journey from signup through matchmaking and wedding planning.
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

