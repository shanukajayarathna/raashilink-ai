import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  Paper, 
  Grid, 
  IconButton, 
  Button, 
  Tooltip,
  useTheme,
  alpha,
  Divider,
  Skeleton,
  List,
  ListItem,
  ListItemText,
  ListItemIcon
} from '@mui/material';
import { 
  BarChart3, 
  TrendingUp, 
  TrendingDown, 
  Users, 
  MessageSquare, 
  CheckCircle2, 
  DollarSign,
  Search,
  ArrowUpRight,
  Star
} from 'lucide-react';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip as RechartsTooltip, 
  ResponsiveContainer, 
  AreaChart, 
  Area,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  Legend
} from 'recharts';
import { motion } from 'motion/react';

const COLORS = {
  primary: '#8B1A2E',
  secondary: '#C9A84C',
  accent: '#1A6B72',
  background: '#FAF7F2',
  textPrimary: '#1C1C1C',
  textSecondary: '#555555',
  chartColors: ['#8B1A2E', '#C9A84C', '#1A6B72', '#2e7d32', '#d32f2f']
};

const viewData = [
  { name: 'Week 1', views: 400, quotes: 24 },
  { name: 'Week 2', views: 300, quotes: 13 },
  { name: 'Week 3', views: 200, quotes: 98 },
  { name: 'Week 4', views: 278, quotes: 39 },
  { name: 'Week 5', views: 189, quotes: 48 },
  { name: 'Week 6', views: 239, quotes: 38 },
  { name: 'Week 7', views: 349, quotes: 43 },
];

const revenueData = [
  { name: 'Jan', amount: 450000 },
  { name: 'Feb', amount: 520000 },
  { name: 'Mar', amount: 380000 },
  { name: 'Apr', amount: 610000 },
  { name: 'May', amount: 480000 },
  { name: 'Jun', amount: 590000 },
];

const reviewData = [
  { name: '5 Stars', value: 85 },
  { name: '4 Stars', value: 10 },
  { name: '3 Stars', value: 3 },
  { name: '2 Stars', value: 1 },
  { name: '1 Star', value: 1 },
];

const keywords = [
  'Wedding photography Colombo',
  'Traditional Kandyan wedding',
  'Galle Face wedding shoot',
  'Best wedding photographer Sri Lanka',
  'Budget wedding photography',
  'Cinematic wedding video'
];

export default function AnalyticsView() {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setTimeout(() => setLoading(false), 1000);
  }, []);

  if (loading) return <Skeleton variant="rectangular" height={600} sx={{ borderRadius: '20px' }} />;

  return (
    <Box>
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box>
          <Typography variant="h5" sx={{ fontFamily: 'Playfair Display', fontWeight: 700, color: COLORS.primary }}>
            Business Analytics
          </Typography>
          <Typography variant="body2" color="textSecondary">
            Track your performance, conversion rates, and revenue trends.
          </Typography>
        </Box>
        <Button 
          variant="outlined" 
          startIcon={<ArrowUpRight size={18} />}
          sx={{ color: COLORS.primary, borderColor: COLORS.primary, borderRadius: '10px', textTransform: 'none' }}
        >
          Export Report
        </Button>
      </Box>

      <Grid container spacing={3}>
        {/* Profile Views Trend */}
        <Grid size={{ xs: 12, lg: 8 }}>
          <Paper elevation={0} sx={{ p: 3, borderRadius: '20px', border: '1px solid rgba(139,26,46,0.08)', height: '100%' }}>
            <Typography variant="h6" sx={{ fontWeight: 700, mb: 3 }}>Profile Views & Quotes (Last 30 Days)</Typography>
            <Box sx={{ height: 300, width: '100%' }}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={viewData}>
                  <defs>
                    <linearGradient id="colorViews" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={COLORS.primary} stopOpacity={0.1}/>
                      <stop offset="95%" stopColor={COLORS.primary} stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(0,0,0,0.05)" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: COLORS.textSecondary }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: COLORS.textSecondary }} />
                  <RechartsTooltip 
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}
                  />
                  <Area type="monotone" dataKey="views" stroke={COLORS.primary} strokeWidth={3} fillOpacity={1} fill="url(#colorViews)" />
                  <Area type="monotone" dataKey="quotes" stroke={COLORS.secondary} strokeWidth={3} fillOpacity={0} />
                </AreaChart>
              </ResponsiveContainer>
            </Box>
          </Paper>
        </Grid>

        {/* Conversion Funnel */}
        <Grid size={{ xs: 12, lg: 4 }}>
          <Paper elevation={0} sx={{ p: 3, borderRadius: '20px', border: '1px solid rgba(139,26,46,0.08)', height: '100%' }}>
            <Typography variant="h6" sx={{ fontWeight: 700, mb: 3 }}>Conversion Funnel</Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              {[
                { label: 'Profile Views', value: '1,240', percent: 100, color: COLORS.accent },
                { label: 'Quote Requests', value: '48', percent: 3.8, color: COLORS.primary },
                { label: 'Confirmed Bookings', value: '12', percent: 0.9, color: '#2e7d32' },
              ].map((item, i) => (
                <Box key={i}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>{item.label}</Typography>
                    <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>{item.value}</Typography>
                  </Box>
                  <Box sx={{ height: 12, width: '100%', bgcolor: 'rgba(0,0,0,0.05)', borderRadius: 6, overflow: 'hidden' }}>
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${item.percent}%` }}
                      transition={{ duration: 1, delay: i * 0.2 }}
                      style={{ height: '100%', backgroundColor: item.color, borderRadius: 6 }}
                    />
                  </Box>
                  <Typography variant="caption" color="textSecondary" sx={{ mt: 0.5, display: 'block' }}>
                    {item.percent}% of total views
                  </Typography>
                </Box>
              ))}
            </Box>
          </Paper>
        </Grid>

        {/* Revenue Chart */}
        <Grid size={{ xs: 12, lg: 6 }}>
          <Paper elevation={0} sx={{ p: 3, borderRadius: '20px', border: '1px solid rgba(139,26,46,0.08)', height: '100%' }}>
            <Typography variant="h6" sx={{ fontWeight: 700, mb: 3 }}>Revenue Trend (LKR)</Typography>
            <Box sx={{ height: 300, width: '100%' }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={revenueData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(0,0,0,0.05)" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: COLORS.textSecondary }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: COLORS.textSecondary }} />
                  <RechartsTooltip 
                    cursor={{ fill: 'rgba(0,0,0,0.02)' }}
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}
                  />
                  <Bar dataKey="amount" fill={COLORS.primary} radius={[6, 6, 0, 0]} barSize={40} />
                </BarChart>
              </ResponsiveContainer>
            </Box>
          </Paper>
        </Grid>

        {/* Review Breakdown */}
        <Grid size={{ xs: 12, lg: 3 }}>
          <Paper elevation={0} sx={{ p: 3, borderRadius: '20px', border: '1px solid rgba(139,26,46,0.08)', height: '100%' }}>
            <Typography variant="h6" sx={{ fontWeight: 700, mb: 3 }}>Review Breakdown</Typography>
            <Box sx={{ height: 200, width: '100%' }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={reviewData}
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {reviewData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS.chartColors[index % COLORS.chartColors.length]} />
                    ))}
                  </Pie>
                  <RechartsTooltip />
                </PieChart>
              </ResponsiveContainer>
            </Box>
            <Box sx={{ mt: 2 }}>
              {reviewData.slice(0, 3).map((item, i) => (
                <Box key={i} sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                  <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: COLORS.chartColors[i] }} />
                  <Typography variant="caption" sx={{ fontWeight: 600 }}>{item.name}</Typography>
                  <Typography variant="caption" color="textSecondary" sx={{ ml: 'auto' }}>{item.value}%</Typography>
                </Box>
              ))}
            </Box>
          </Paper>
        </Grid>

        {/* Top Keywords */}
        <Grid size={{ xs: 12, lg: 3 }}>
          <Paper elevation={0} sx={{ p: 3, borderRadius: '20px', border: '1px solid rgba(139,26,46,0.08)', height: '100%' }}>
            <Typography variant="h6" sx={{ fontWeight: 700, mb: 3 }}>Top Search Keywords</Typography>
            <List sx={{ p: 0 }}>
              {keywords.map((keyword, i) => (
                <ListItem key={i} sx={{ px: 0, py: 1 }}>
                  <ListItemIcon sx={{ minWidth: 32 }}>
                    <Search size={16} color={COLORS.primary} />
                  </ListItemIcon>
                  <ListItemText 
                    primary={keyword} 
                    primaryTypographyProps={{ variant: 'body2', fontWeight: 500 }}
                  />
                </ListItem>
              ))}
            </List>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
}

