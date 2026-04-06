import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Grid,
  Button,
  Stack,
  IconButton,
  Tooltip,
  CircularProgress,
  Divider,
} from '@mui/material';
import {
  Download,
  Filter,
  Calendar,
  TrendingUp,
  Users,
  Heart,
  Store,
  MapPin,
  PieChart as PieChartIcon,
  BarChart as BarChartIcon,
  ArrowUpRight,
  ArrowDownRight,
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
  LineChart,
  Line,
  AreaChart,
  Area,
  Legend,
} from 'recharts';
import { motion } from 'motion/react';

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

// Mock Data for Analytics
const CompatibilityData = [
  { range: '80-100%', count: 120 },
  { range: '60-79%', count: 450 },
  { range: '40-59%', count: 320 },
  { range: '20-39%', count: 150 },
  { range: '0-19%', count: 45 },
];

const ProvinceData = [
  { name: 'Western', value: 4500 },
  { name: 'Central', value: 2100 },
  { name: 'Southern', value: 1800 },
  { name: 'Northern', value: 1200 },
  { name: 'Eastern', value: 900 },
  { name: 'Other', value: 1950 },
];

const VendorCategoryData = [
  { name: 'Photography', quotes: 850 },
  { name: 'Catering', quotes: 720 },
  { name: 'Venues', quotes: 680 },
  { name: 'Attire', quotes: 450 },
  { name: 'Jewelry', quotes: 320 },
  { name: 'Music', quotes: 280 },
];

const RetentionData = [
  { step: 'Registered', count: 1000, percentage: 100 },
  { step: 'Profile Complete', count: 850, percentage: 85 },
  { step: 'First Match', count: 620, percentage: 62 },
  { step: 'Mutual Interest', count: 410, percentage: 41 },
  { step: 'Message Sent', count: 280, percentage: 28 },
];

const AdminAnalytics: React.FC = () => {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 1000);
    return () => clearTimeout(timer);
  }, []);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
        <CircularProgress sx={{ color: COLORS.primary }} />
      </Box>
    );
  }

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Typography variant="h6" sx={{ fontWeight: 700, fontFamily: 'Playfair Display' }}>Platform Analytics</Typography>
          <Typography variant="body2" sx={{ color: COLORS.textSecondary }}>Deep dive into user behavior and platform growth</Typography>
        </Box>
        <Stack direction="row" spacing={2}>
          <Button variant="outlined" startIcon={<Calendar size={18} />} sx={{ borderRadius: '8px' }}>Last 30 Days</Button>
          <Button variant="outlined" startIcon={<Filter size={18} />} sx={{ borderRadius: '8px' }}>Filters</Button>
          <Button variant="contained" startIcon={<Download size={18} />} sx={{ bgcolor: COLORS.primary, borderRadius: '8px' }}>Export PDF</Button>
        </Stack>
      </Box>

      <Grid container spacing={3}>
        {/* Compatibility Score Distribution */}
        <Grid size={{ xs: 12, lg: 6 }}>
          <Paper sx={{ p: 3, borderRadius: '16px', height: '100%' }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 3, display: 'flex', alignItems: 'center', gap: 1 }}>
              <Heart size={20} color={COLORS.primary} /> Compatibility Score Distribution
            </Typography>
            <Box sx={{ height: 300 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={CompatibilityData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                  <XAxis dataKey="range" axisLine={false} tickLine={false} tick={{ fontSize: 12 }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12 }} />
                  <RechartsTooltip cursor={{ fill: 'transparent' }} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }} />
                  <Bar dataKey="count" fill={COLORS.primary} radius={[4, 4, 0, 0]} barSize={40} />
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
                    data={ProvinceData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {ProvinceData.map((_, index) => (
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
                <BarChart data={VendorCategoryData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f0f0f0" />
                  <XAxis type="number" hide />
                  <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} width={100} tick={{ fontSize: 12 }} />
                  <RechartsTooltip cursor={{ fill: 'transparent' }} />
                  <Bar dataKey="quotes" fill={COLORS.accent} radius={[0, 4, 4, 0]} barSize={24} />
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
              {RetentionData.map((item, index) => (
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
      </Grid>
    </motion.div>
  );
};

export default AdminAnalytics;

