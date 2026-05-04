import React from 'react';
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

interface AnalyticsViewProps {
  quoteItems?: any[];
  vendorProfile?: any;
}

function buildRevenueData(quoteItems: any[]) {
  const monthMap: Record<string, number> = {};
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  quoteItems
    .filter((q) => q.status === 'accepted' && q.response?.price)
    .forEach((q) => {
      const d = q.weddingDate ? new Date(q.weddingDate) : new Date(q.createdAt);
      if (isNaN(d.getTime())) return;
      const key = months[d.getMonth()];
      monthMap[key] = (monthMap[key] || 0) + Number(q.response.price || 0);
    });
  return months
    .filter((m) => monthMap[m] !== undefined)
    .map((name) => ({ name, amount: monthMap[name] }));
}

function buildReviewData(reviews: any[]) {
  const counts = [0, 0, 0, 0, 0]; // index 0 = 1 star, index 4 = 5 stars
  reviews.forEach((r) => {
    const idx = Math.round(r.rating) - 1;
    if (idx >= 0 && idx < 5) counts[idx]++;
  });
  const total = counts.reduce((a, b) => a + b, 0) || 1;
  return [
    { name: '5 Stars', value: Math.round((counts[4] / total) * 100) },
    { name: '4 Stars', value: Math.round((counts[3] / total) * 100) },
    { name: '3 Stars', value: Math.round((counts[2] / total) * 100) },
    { name: '2 Stars', value: Math.round((counts[1] / total) * 100) },
    { name: '1 Star', value: Math.round((counts[0] / total) * 100) },
  ];
}

export default function AnalyticsView({ quoteItems = [], vendorProfile = null }: AnalyticsViewProps) {
  const reviews: any[] = vendorProfile?.reviews || [];
  const reviewData = buildReviewData(reviews);
  const revenueData = buildRevenueData(quoteItems);

  const totalQuotes = quoteItems.length;
  const acceptedQuotes = quoteItems.filter((q) => q.status === 'accepted').length;
  const respondedQuotes = quoteItems.filter((q) => q.status === 'responded').length;
  const totalRevenue = quoteItems
    .filter((q) => q.status === 'accepted')
    .reduce((sum, q) => sum + Number(q.response?.price || 0), 0);

  // Build weekly quote trend for the chart
  const weeklyData = (() => {
    const weeks: Record<string, { name: string; views: number; quotes: number }> = {};
    quoteItems.forEach((q) => {
      const d = q.createdAt ? new Date(q.createdAt) : new Date();
      const weekNum = Math.floor(d.getDate() / 7) + 1;
      const key = `Week ${weekNum}`;
      if (!weeks[key]) weeks[key] = { name: key, views: 0, quotes: 0 };
      weeks[key].quotes += 1;
    });
    const data = Object.values(weeks);
    return data.length > 0 ? data : [{ name: 'Week 1', views: 0, quotes: 0 }];
  })();

  const keywords = [
    ...(vendorProfile?.category ? [`${vendorProfile.category} in ${vendorProfile.city || 'Sri Lanka'}`] : []),
    ...(vendorProfile?.serviceArea || []).map((a: string) => `Wedding ${vendorProfile?.category || 'vendor'} ${a}`),
    'RaashiLink wedding vendor',
  ].slice(0, 6);

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
            <Typography variant="h6" sx={{ fontWeight: 700, mb: 3 }}>Quote Activity (by Week)</Typography>
            <Box sx={{ height: 300, width: '100%' }}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={weeklyData}>
                  <defs>
                    <linearGradient id="colorQuotes" x1="0" y1="0" x2="0" y2="1">
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
                  <Area type="monotone" dataKey="quotes" name="Quote Requests" stroke={COLORS.primary} strokeWidth={3} fillOpacity={1} fill="url(#colorQuotes)" />
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
                { label: 'Total Quotes Received', value: String(totalQuotes), percent: 100, color: COLORS.accent },
                { label: 'Responded', value: String(respondedQuotes + acceptedQuotes), percent: totalQuotes > 0 ? Math.round(((respondedQuotes + acceptedQuotes) / totalQuotes) * 100) : 0, color: COLORS.primary },
                { label: 'Confirmed Bookings', value: String(acceptedQuotes), percent: totalQuotes > 0 ? Math.round((acceptedQuotes / totalQuotes) * 100) : 0, color: '#2e7d32' },
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
                    {item.percent}% of total quotes
                  </Typography>
                </Box>
              ))}
            </Box>
          </Paper>
        </Grid>

        {/* Revenue Chart */}
        <Grid size={{ xs: 12, lg: 6 }}>
          <Paper elevation={0} sx={{ p: 3, borderRadius: '20px', border: '1px solid rgba(139,26,46,0.08)', height: '100%' }}>
            <Typography variant="h6" sx={{ fontWeight: 700, mb: 3 }}>
              Revenue Trend (LKR) — Total: LKR {totalRevenue.toLocaleString()}
            </Typography>
            <Box sx={{ height: 300, width: '100%' }}>
              {revenueData.length === 0 ? (
                <Typography variant="body2" color="textSecondary" sx={{ textAlign: 'center', py: 8 }}>
                  No confirmed booking revenue yet.
                </Typography>
              ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={revenueData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(0,0,0,0.05)" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: COLORS.textSecondary }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: COLORS.textSecondary }} />
                  <RechartsTooltip 
                    cursor={{ fill: 'rgba(0,0,0,0.02)' }}
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}
                  />
                  <Bar dataKey="amount" name="Revenue (LKR)" fill={COLORS.primary} radius={[6, 6, 0, 0]} barSize={40} />
                </BarChart>
              </ResponsiveContainer>
              )}
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

