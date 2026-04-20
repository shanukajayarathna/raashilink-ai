import React, { useState } from 'react';
import { 
  Box, Typography, Grid, Card, CardContent, 
  Stack, Button, IconButton, TextField, 
  MenuItem, Select, FormControl, InputLabel,
  Table, TableBody, TableCell, TableContainer, 
  TableHead, TableRow, Paper, LinearProgress,
  Dialog, DialogTitle, DialogContent, DialogActions,
  Fab, useTheme, useMediaQuery, Alert, Tooltip, Chip, CircularProgress
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
import weddingService from '../services/weddingService';

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

const CATEGORY_COLORS = ['#8B1A2E','#C9A84C','#1A6B72','#4CAF50','#FF9800','#9C27B0','#2196F3','#F44336','#607D8B'];

const CATEGORIES = [
  'Venue', 'Catering', 'Photography', 'Decor', 'Attire', 'Logistics', 'Beauty', 'Invitations', 'Others'
];

interface BudgetTabProps {
  totalBudget?: number;
  totalSpent?: number;
  expenses?: any[];
  onExpenseAdded?: () => void;
}

export default function BudgetTab({ totalBudget = 0, totalSpent = 0, expenses = [], onExpenseAdded }: BudgetTabProps) {
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  const [newExpense, setNewExpense] = useState({ title: '', category: CATEGORIES[0], amount: '', notes: '' });
  const [addingExpense, setAddingExpense] = useState(false);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  // Build per-category breakdown from real expenses
  const categoryMap: Record<string, number> = {};
  expenses.forEach((e: any) => {
    const cat = e.category || 'Others';
    categoryMap[cat] = (categoryMap[cat] || 0) + Number(e.amount || 0);
  });
  const chartData = Object.entries(categoryMap).map(([category, spent], i) => ({
    category,
    spent,
    color: CATEGORY_COLORS[i % CATEGORY_COLORS.length],
  }));

  const remaining = Math.max(0, totalBudget - totalSpent);
  const variancePct = totalBudget > 0 ? Math.round(((totalBudget - totalSpent) / totalBudget) * 100) : 0;
  const isOverBudget = totalSpent > totalBudget;

  const handleAddExpense = async () => {
    if (!newExpense.title.trim() || !newExpense.amount) return;
    setAddingExpense(true);
    try {
      await weddingService.addExpense({
        title: newExpense.title.trim(),
        category: newExpense.category,
        amount: Number(newExpense.amount),
        notes: newExpense.notes,
      });
      onExpenseAdded?.();
      setIsExpenseModalOpen(false);
      setNewExpense({ title: '', category: CATEGORIES[0], amount: '', notes: '' });
    } catch { /* silent */ }
    finally { setAddingExpense(false); }
  };


  return (
    <Box>
      {/* Budget Summary Cards */}
      <Grid container spacing={3} sx={{ mb: 6 }}>
        <SummaryCard 
          title="Total Budget" 
          value={`LKR ${totalBudget.toLocaleString()}`} 
          icon={<DollarSign size={24} />} 
          color={COLORS.primary}
          delay={0.1}
        />
        <SummaryCard 
          title="Total Spent" 
          value={`LKR ${totalSpent.toLocaleString()}`} 
          icon={<TrendingUp size={24} />} 
          color={COLORS.accent}
          delay={0.2}
        />
        <SummaryCard 
          title="Remaining" 
          value={`LKR ${remaining.toLocaleString()}`} 
          icon={<TrendingDown size={24} />} 
          color={isOverBudget ? COLORS.error : COLORS.success}
          delay={0.3}
        />
        <SummaryCard 
          title="Budget Used" 
          value={`${100 - variancePct}%`} 
          icon={isOverBudget ? <ArrowUpRight size={24} /> : <ArrowDownRight size={24} />}
          color={isOverBudget ? COLORS.error : COLORS.success}
          subtitle={isOverBudget ? 'Over Budget' : `${variancePct}% remaining`}
          delay={0.4}
        />
      </Grid>

      {/* Allocation Chart */}
      <Card sx={{ borderRadius: 6, border: '1px solid', borderColor: 'divider', mb: 6 }}>
        <CardContent sx={{ p: 4 }}>
          <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 4 }}>
            <Typography variant="h6" sx={{ fontWeight: 800, color: COLORS.primary, fontFamily: 'Playfair Display' }}>
              Spending by Category
            </Typography>
          </Stack>
          {chartData.length === 0 ? (
            <Box sx={{ py: 8, textAlign: 'center', color: 'text.secondary' }}>
              <DollarSign size={40} opacity={0.3} style={{ margin: '0 auto 8px' }} />
              <Typography variant="body2">No expenses yet. Add your first expense below.</Typography>
            </Box>
          ) : (
          <Box sx={{ height: 300, width: '100%' }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 10, right: 30, left: 10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                <XAxis dataKey="category" axisLine={false} tickLine={false} tick={{ fill: COLORS.textSecondary, fontSize: 12 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: COLORS.textSecondary, fontSize: 12 }} />
                <ChartTooltip 
                  cursor={{ fill: `${COLORS.cream}50` }}
                  contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}
                  formatter={(v: number) => `LKR ${v.toLocaleString()}`}
                />
                <Bar dataKey="spent" radius={[4, 4, 0, 0]} name="Spent" fill={COLORS.primary} />
              </BarChart>
            </ResponsiveContainer>
          </Box>
          )}
        </CardContent>
      </Card>

      {/* Expense List Table */}
      <Typography variant="h6" sx={{ fontWeight: 800, color: COLORS.primary, mb: 3, fontFamily: 'Playfair Display' }}>
        All Expenses
      </Typography>
      {expenses.length === 0 ? (
        <Box sx={{ py: 6, textAlign: 'center', color: 'text.secondary', mb: 6 }}>
          <Receipt size={40} opacity={0.3} style={{ margin: '0 auto 8px' }} />
          <Typography variant="body2">No expenses logged yet.</Typography>
        </Box>
      ) : (
      <TableContainer component={Paper} sx={{ borderRadius: 6, border: '1px solid', borderColor: 'divider', boxShadow: 'none', mb: 6, overflow: 'hidden' }}>
        <Table>
          <TableHead sx={{ bgcolor: COLORS.cream }}>
            <TableRow>
              <TableCell sx={{ fontWeight: 800, color: COLORS.primary }}>Title</TableCell>
              <TableCell sx={{ fontWeight: 800, color: COLORS.primary }}>Category</TableCell>
              <TableCell sx={{ fontWeight: 800, color: COLORS.primary }}>Amount (LKR)</TableCell>
              <TableCell sx={{ fontWeight: 800, color: COLORS.primary }}>Paid</TableCell>
              <TableCell sx={{ fontWeight: 800, color: COLORS.primary }}>Notes</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {expenses.map((e: any, i: number) => (
              <TableRow key={i} sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                <TableCell sx={{ fontWeight: 700 }}>{e.title}</TableCell>
                <TableCell>
                  <Chip label={e.category} size="small" sx={{ fontWeight: 700, bgcolor: `${COLORS.primary}10`, color: COLORS.primary, border: 'none', fontSize: '0.7rem' }} />
                </TableCell>
                <TableCell sx={{ fontWeight: 700 }}>{Number(e.amount).toLocaleString()}</TableCell>
                <TableCell>
                  {e.paid ? <CheckCircle2 size={18} color={COLORS.success} /> : <AlertCircle size={18} color={COLORS.warning} />}
                </TableCell>
                <TableCell sx={{ color: 'text.secondary', fontSize: '0.8rem' }}>{e.notes || '—'}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
      )}

      {/* Floating Add Expense Button */}
      <Fab 
        color="primary" 
        aria-label="add expense" 
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
            <TextField fullWidth label="Title" placeholder="e.g. Advance payment for flowers" value={newExpense.title} onChange={(e) => setNewExpense(x => ({ ...x, title: e.target.value }))} />
            <FormControl fullWidth>
              <InputLabel>Category</InputLabel>
              <Select label="Category" value={newExpense.category} onChange={(e) => setNewExpense(x => ({ ...x, category: e.target.value }))}>
                {CATEGORIES.map(cat => <MenuItem key={cat} value={cat}>{cat}</MenuItem>)}
              </Select>
            </FormControl>
            <TextField fullWidth label="Amount (LKR)" type="number" value={newExpense.amount} onChange={(e) => setNewExpense(x => ({ ...x, amount: e.target.value }))} inputProps={{ min: 0 }} />
            <TextField fullWidth label="Notes (optional)" multiline rows={2} value={newExpense.notes} onChange={(e) => setNewExpense(x => ({ ...x, notes: e.target.value }))} />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
          <Button onClick={() => setIsExpenseModalOpen(false)} disabled={addingExpense} sx={{ color: 'text.secondary', fontWeight: 700 }}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleAddExpense}
            disabled={addingExpense || !newExpense.title.trim() || !newExpense.amount}
            startIcon={addingExpense ? <CircularProgress size={14} color="inherit" /> : undefined}
            sx={{ bgcolor: COLORS.primary, borderRadius: 3, px: 4, fontWeight: 700 }}
          >
            {addingExpense ? 'Adding...' : 'Add Expense'}
          </Button>
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

const MotionBox = motion(Box);
