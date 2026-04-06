import React, { useState } from 'react';
import { 
  Box, Typography, Grid, Card, CardContent, 
  Stack, Button, IconButton, TextField, 
  MenuItem, Select, FormControl, InputLabel,
  Table, TableBody, TableCell, TableContainer, 
  TableHead, TableRow, Paper, LinearProgress,
  Dialog, DialogTitle, DialogContent, DialogActions,
  Fab, useTheme, useMediaQuery, Alert, Tooltip, Chip
} from '@mui/material';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, 
  Tooltip as ChartTooltip, Legend, ResponsiveContainer 
} from 'recharts';
import { 
  Plus, TrendingUp, TrendingDown, DollarSign, 
  AlertCircle, CheckCircle2, Sparkles, Receipt,
  ArrowUpRight, ArrowDownRight, Edit3, Trash2,
  Filter, Download
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

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

const MOCK_BUDGET_SUMMARY = {
  totalBudget: 800000,
  totalSpent: 312000,
  remaining: 488000,
  variance: -12.5 // % under budget
};

const MOCK_BUDGET_DATA = [
  { category: 'Venue', allocated: 250000, spent: 200000, status: 'On Track', color: COLORS.success },
  { category: 'Catering', allocated: 150000, spent: 180000, status: 'Overspent', color: COLORS.error },
  { category: 'Photography', allocated: 120000, spent: 60000, status: 'On Track', color: COLORS.success },
  { category: 'Decor', allocated: 100000, spent: 40000, status: 'On Track', color: COLORS.success },
  { category: 'Attire', allocated: 100000, spent: 20000, status: 'On Track', color: COLORS.success },
  { category: 'Logistics', allocated: 80000, spent: 12000, status: 'On Track', color: COLORS.success },
];

const CATEGORIES = [
  'Venue', 'Catering', 'Photography', 'Decor', 'Attire', 'Logistics', 'Beauty', 'Invitations', 'Others'
];

export default function BudgetTab() {
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  return (
    <Box>
      {/* Budget Summary Cards */}
      <Grid container spacing={3} sx={{ mb: 6 }}>
        <SummaryCard 
          title="Total Budget" 
          value={`LKR ${MOCK_BUDGET_SUMMARY.totalBudget.toLocaleString()}`} 
          icon={<DollarSign size={24} />} 
          color={COLORS.primary}
          delay={0.1}
        />
        <SummaryCard 
          title="Total Spent" 
          value={`LKR ${MOCK_BUDGET_SUMMARY.totalSpent.toLocaleString()}`} 
          icon={<TrendingUp size={24} />} 
          color={COLORS.accent}
          delay={0.2}
        />
        <SummaryCard 
          title="Remaining" 
          value={`LKR ${MOCK_BUDGET_SUMMARY.remaining.toLocaleString()}`} 
          icon={<TrendingDown size={24} />} 
          color={COLORS.success}
          delay={0.3}
        />
        <SummaryCard 
          title="Budget Variance" 
          value={`${MOCK_BUDGET_SUMMARY.variance}%`} 
          icon={<ArrowDownRight size={24} />} 
          color={COLORS.success}
          subtitle="Under Budget"
          delay={0.4}
        />
      </Grid>

      {/* Allocation Chart */}
      <Card sx={{ borderRadius: 6, border: '1px solid', borderColor: 'divider', mb: 6 }}>
        <CardContent sx={{ p: 4 }}>
          <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 4 }}>
            <Typography variant="h6" sx={{ fontWeight: 800, color: COLORS.primary, fontFamily: 'Playfair Display' }}>
              Allocated vs Spent per Category
            </Typography>
            <Button 
              variant="outlined" 
              startIcon={<Download size={18} />}
              sx={{ borderRadius: 3, textTransform: 'none', fontWeight: 700, color: COLORS.textPrimary, borderColor: 'divider' }}
            >
              Export Report
            </Button>
          </Stack>
          <Box sx={{ height: 400, width: '100%' }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={MOCK_BUDGET_DATA} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                <XAxis dataKey="category" axisLine={false} tickLine={false} tick={{ fill: COLORS.textSecondary, fontSize: 12 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: COLORS.textSecondary, fontSize: 12 }} />
                <ChartTooltip 
                  cursor={{ fill: `${COLORS.cream}50` }}
                  contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}
                />
                <Legend verticalAlign="top" align="right" iconType="circle" wrapperStyle={{ paddingBottom: 20 }} />
                <Bar dataKey="allocated" fill={COLORS.secondary} radius={[4, 4, 0, 0]} name="Allocated" />
                <Bar dataKey="spent" fill={COLORS.primary} radius={[4, 4, 0, 0]} name="Spent" />
              </BarChart>
            </ResponsiveContainer>
          </Box>
        </CardContent>
      </Card>

      {/* Category Breakdown Table */}
      <Typography variant="h6" sx={{ fontWeight: 800, color: COLORS.primary, mb: 3, fontFamily: 'Playfair Display' }}>
        Category Breakdown
      </Typography>
      <TableContainer component={Paper} sx={{ borderRadius: 6, border: '1px solid', borderColor: 'divider', boxShadow: 'none', mb: 6, overflow: 'hidden' }}>
        <Table>
          <TableHead sx={{ bgcolor: COLORS.cream }}>
            <TableRow>
              <TableCell sx={{ fontWeight: 800, color: COLORS.primary }}>Category</TableCell>
              <TableCell sx={{ fontWeight: 800, color: COLORS.primary }}>Allocated (LKR)</TableCell>
              <TableCell sx={{ fontWeight: 800, color: COLORS.primary }}>Spent (LKR)</TableCell>
              <TableCell sx={{ fontWeight: 800, color: COLORS.primary }}>Remaining</TableCell>
              <TableCell sx={{ fontWeight: 800, color: COLORS.primary }}>% Used</TableCell>
              <TableCell sx={{ fontWeight: 800, color: COLORS.primary }}>Status</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {MOCK_BUDGET_DATA.map((row, i) => {
              const remaining = row.allocated - row.spent;
              const percentUsed = Math.round((row.spent / row.allocated) * 100);
              const isOver = row.spent > row.allocated;

              return (
                <TableRow key={i} sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                  <TableCell sx={{ fontWeight: 700, color: COLORS.textPrimary }}>{row.category}</TableCell>
                  <TableCell>{row.allocated.toLocaleString()}</TableCell>
                  <TableCell sx={{ color: isOver ? COLORS.error : 'inherit', fontWeight: isOver ? 700 : 400 }}>
                    {row.spent.toLocaleString()}
                  </TableCell>
                  <TableCell sx={{ color: remaining < 0 ? COLORS.error : COLORS.success, fontWeight: 700 }}>
                    {remaining.toLocaleString()}
                  </TableCell>
                  <TableCell sx={{ width: 150 }}>
                    <Stack direction="row" spacing={1} alignItems="center">
                      <LinearProgress 
                        variant="determinate" 
                        value={Math.min(percentUsed, 100)} 
                        sx={{ 
                          flexGrow: 1, 
                          height: 6, 
                          borderRadius: 3, 
                          bgcolor: `${row.color}15`,
                          '& .MuiLinearProgress-bar': { bgcolor: row.color }
                        }} 
                      />
                      <Typography variant="caption" sx={{ fontWeight: 700 }}>{percentUsed}%</Typography>
                    </Stack>
                  </TableCell>
                  <TableCell>
                    <Chip 
                      label={row.status} 
                      size="small" 
                      sx={{ 
                        fontWeight: 800, 
                        fontSize: '0.7rem',
                        bgcolor: `${row.color}15`,
                        color: row.color,
                        border: 'none'
                      }} 
                    />
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>

      {/* AI Budget Tips Section */}
      <Box sx={{ mb: 10 }}>
        <Typography variant="h6" sx={{ fontWeight: 800, color: COLORS.primary, mb: 3, fontFamily: 'Playfair Display', display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Sparkles size={24} color={COLORS.secondary} />
          AI Budget Recommendations
        </Typography>
        <Grid container spacing={3}>
          <Grid size={{ xs: 12, md: 4 }}>
            <TipCard 
              title="Catering Alert" 
              desc="You're 20% over budget on Catering. Consider reducing the number of appetizers or switching to a buffet style to save LKR 40,000."
              type="warning"
            />
          </Grid>
          <Grid size={{ xs: 12, md: 4 }}>
            <TipCard 
              title="Venue Savings" 
              desc="Great job! You saved LKR 50,000 on the venue. We recommend reallocating this to your 'Photography' fund for a better package."
              type="success"
            />
          </Grid>
          <Grid size={{ xs: 12, md: 4 }}>
            <TipCard 
              title="Decoration Tip" 
              desc="Local seasonal flowers can reduce your decoration costs by 15-20%. Ask your florist for 'Araliya' or 'Lotus' options."
              type="info"
            />
          </Grid>
        </Grid>
      </Box>

      {/* Floating Add Expense Button */}
      <Fab 
        color="primary" 
        aria-label="add" 
        onClick={() => setIsExpenseModalOpen(true)}
        sx={{ 
          position: 'fixed', 
          bottom: { xs: 24, sm: 32 }, 
          left: { xs: 24, sm: 32 }, 
          bgcolor: COLORS.primary,
          '&:hover': { bgcolor: '#6B1423' },
          boxShadow: '0 10px 30px rgba(139,26,46,0.3)'
        }}
      >
        <Plus size={24} />
      </Fab>

      {/* Add Expense Modal */}
      <Dialog open={isExpenseModalOpen} onClose={() => setIsExpenseModalOpen(false)} fullWidth maxWidth="sm" PaperProps={{ sx: { borderRadius: 6 } }}>
        <DialogTitle sx={{ fontWeight: 800, fontFamily: 'Playfair Display', color: COLORS.primary }}>Add New Expense</DialogTitle>
        <DialogContent>
          <Stack spacing={3} sx={{ mt: 1 }}>
            <FormControl fullWidth>
              <InputLabel>Category</InputLabel>
              <Select label="Category">
                {CATEGORIES.map(cat => <MenuItem key={cat} value={cat}>{cat}</MenuItem>)}
              </Select>
            </FormControl>
            <TextField fullWidth label="Description" placeholder="e.g. Advance payment for flowers" />
            <Grid container spacing={2}>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField fullWidth label="Amount (LKR)" type="number" />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField fullWidth type="date" label="Date" InputLabelProps={{ shrink: true }} />
              </Grid>
            </Grid>
            <Button 
              variant="outlined" 
              fullWidth 
              startIcon={<Receipt size={18} />}
              sx={{ borderStyle: 'dashed', py: 2, borderRadius: 3, color: COLORS.textSecondary }}
            >
              Upload Receipt Photo
            </Button>
          </Stack>
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
          <Button onClick={() => setIsExpenseModalOpen(false)} sx={{ color: 'text.secondary', fontWeight: 700 }}>Cancel</Button>
          <Button variant="contained" sx={{ bgcolor: COLORS.primary, borderRadius: 3, px: 4, fontWeight: 700 }}>Add Expense</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

// --- Helper Components ---

function SummaryCard({ title, value, icon, color, subtitle, delay }: any) {
  return (
    <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
      <MotionBox
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay, duration: 0.5 }}
      >
        <Card sx={{ borderRadius: 6, border: '1px solid', borderColor: 'divider', height: '100%' }}>
          <CardContent sx={{ p: 3 }}>
            <Stack direction="row" spacing={2} alignItems="center">
              <Box sx={{ p: 1.5, borderRadius: 4, bgcolor: `${color}10`, color: color }}>
                {icon}
              </Box>
              <Box>
                <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600, display: 'block' }}>
                  {title}
                </Typography>
                <Typography variant="h6" sx={{ fontWeight: 800, color: COLORS.textPrimary }}>
                  {value}
                </Typography>
                {subtitle && (
                  <Typography variant="caption" sx={{ color: color, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    {subtitle}
                  </Typography>
                )}
              </Box>
            </Stack>
          </CardContent>
        </Card>
      </MotionBox>
    </Grid>
  );
}

function TipCard({ title, desc, type }: any) {
  const color = type === 'warning' ? COLORS.error : type === 'success' ? COLORS.success : COLORS.accent;
  return (
    <Card sx={{ borderRadius: 6, border: '1px solid', borderColor: `${color}20`, bgcolor: `${color}05`, height: '100%' }}>
      <CardContent sx={{ p: 3 }}>
        <Stack direction="row" spacing={1.5} alignItems="flex-start">
          <Box sx={{ p: 1, borderRadius: 2, bgcolor: 'white', color: color, boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
            {type === 'warning' ? <AlertCircle size={20} /> : type === 'success' ? <CheckCircle2 size={20} /> : <Sparkles size={20} />}
          </Box>
          <Box>
            <Typography variant="subtitle2" sx={{ fontWeight: 800, color: color }}>{title}</Typography>
            <Typography variant="body2" sx={{ color: COLORS.textSecondary, mt: 0.5, lineHeight: 1.6 }}>{desc}</Typography>
          </Box>
        </Stack>
      </CardContent>
    </Card>
  );
}

const MotionBox = motion(Box);

