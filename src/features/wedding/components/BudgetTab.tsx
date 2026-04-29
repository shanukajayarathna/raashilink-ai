import React, { useState } from 'react';
import { 
  Box, Typography, Grid, Card, CardContent, 
  Stack, Button, IconButton, TextField, 
  MenuItem, Select, FormControl, InputLabel,
  Table, TableBody, TableCell, TableContainer, 
  TableHead, TableRow, Paper, LinearProgress,
  Dialog, DialogTitle, DialogContent, DialogActions,
  Fab, useTheme, useMediaQuery, Alert, Tooltip, Chip, CircularProgress, Switch
} from '@mui/material';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, 
  Tooltip as ChartTooltip, Legend, ResponsiveContainer 
} from 'recharts';
import { 
  Plus, TrendingUp, TrendingDown, DollarSign, 
  AlertCircle, CheckCircle2, Sparkles, Receipt,
  ArrowUpRight, ArrowDownRight, Edit3, Trash2,
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

const EMPTY_EXPENSE = { title: '', category: CATEGORIES[0], amount: '', notes: '', paid: false };

interface BudgetTabProps {
  totalBudget?: number;
  totalSpent?: number;
  expenses?: any[];
  onExpenseAdded?: () => void;
  onBudgetUpdated?: () => void;
}

export default function BudgetTab({ totalBudget = 0, totalSpent = 0, expenses = [], onExpenseAdded, onBudgetUpdated }: BudgetTabProps) {
  const [expenseModal, setExpenseModal] = useState<{ open: boolean; mode: 'add' | 'edit'; index: number | null }>({ open: false, mode: 'add', index: null });
  const [form, setForm] = useState<any>(EMPTY_EXPENSE);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<number | null>(null);
  const [togglingPaid, setTogglingPaid] = useState<number | null>(null);
  const [budgetDialogOpen, setBudgetDialogOpen] = useState(false);
  const [budgetInput, setBudgetInput] = useState(String(totalBudget));
  const [savingBudget, setSavingBudget] = useState(false);
    const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

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

  const openAdd = () => { setForm(EMPTY_EXPENSE); setExpenseModal({ open: true, mode: 'add', index: null }); };
  const openEdit = (idx: number) => {
    const e = expenses[idx];
    setForm({ title: e.title, category: e.category || CATEGORIES[0], amount: String(e.amount), notes: e.notes || '', paid: !!e.paid });
    setExpenseModal({ open: true, mode: 'edit', index: idx });
  };

  const handleSave = async () => {
    if (!form.title.trim() || !form.amount) return;
    setSaving(true);
    try {
      if (expenseModal.mode === 'add') {
        await weddingService.addExpense({ title: form.title.trim(), category: form.category, amount: Number(form.amount), notes: form.notes, paid: !!form.paid });
      } else if (expenseModal.index !== null) {
        await weddingService.updateExpense(expenseModal.index, { title: form.title.trim(), category: form.category, amount: Number(form.amount), notes: form.notes, paid: form.paid });
      }
      onExpenseAdded?.();
      setExpenseModal({ open: false, mode: 'add', index: null });
    } catch { /* silent */ }
    finally { setSaving(false); }
  };

  const handleDelete = async (idx: number, confirmed = false) => {
    if (!confirmed) { setDeleteConfirm(idx); return; }
    setDeleteConfirm(null);
    setDeleting(idx);
    try {
      await weddingService.deleteExpense(idx);
      onExpenseAdded?.();
    } catch { /* silent */ }
    finally { setDeleting(null); }
  };

  const handleTogglePaid = async (idx: number, paid: boolean, expense: any) => {
    setTogglingPaid(idx);
    try {
      await weddingService.updateExpense(idx, {
        title: expense.title,
        category: expense.category,
        amount: Number(expense.amount),
        notes: expense.notes,
        paid,
      });
      onExpenseAdded?.();
    } catch {
      // silent
    } finally {
      setTogglingPaid(null);
    }
  };

  const handleSaveBudget = async () => {
    setSavingBudget(true);
    try {
      await weddingService.updateProject({ totalBudget: Number(budgetInput) || 0 });
      onBudgetUpdated?.();
      setBudgetDialogOpen(false);
    } catch { /* silent */ }
    finally { setSavingBudget(false); }
  };

  return (
    <Box>
      {/* Budget Summary Cards */}
      <Grid container spacing={3} sx={{ mb: 6 }}>
        <SummaryCard title="Total Budget" value={`LKR ${totalBudget.toLocaleString()}`} icon={<DollarSign size={24} />} color={COLORS.primary} delay={0.1}
          action={<Tooltip title="Edit budget"><IconButton size="small" onClick={() => { setBudgetInput(String(totalBudget)); setBudgetDialogOpen(true); }} sx={{ color: COLORS.primary }}><Edit3 size={14} /></IconButton></Tooltip>} />
        <SummaryCard title="Total Spent" value={`LKR ${totalSpent.toLocaleString()}`} icon={<TrendingUp size={24} />} color={COLORS.accent} delay={0.2} />
        <SummaryCard title="Remaining" value={`LKR ${remaining.toLocaleString()}`} icon={<TrendingDown size={24} />} color={isOverBudget ? COLORS.error : COLORS.success} delay={0.3} />
        <SummaryCard title="Budget Used" value={`${100 - variancePct}%`} icon={isOverBudget ? <ArrowUpRight size={24} /> : <ArrowDownRight size={24} />} color={isOverBudget ? COLORS.error : COLORS.success} subtitle={isOverBudget ? 'Over Budget' : `${variancePct}% remaining`} delay={0.4} />
      </Grid>

      {/* Allocation Chart */}
      <Card sx={{ borderRadius: 6, border: '1px solid', borderColor: 'divider', mb: 6 }}>
        <CardContent sx={{ p: 4 }}>
          <Typography variant="h6" sx={{ fontWeight: 800, color: COLORS.primary, fontFamily: 'Playfair Display', mb: 4 }}>
            Spending by Category
          </Typography>
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
                  <ChartTooltip cursor={{ fill: `${COLORS.cream}50` }} contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }} formatter={(v: number) => `LKR ${v.toLocaleString()}`} />
                  <Bar dataKey="spent" radius={[4, 4, 0, 0]} name="Spent" fill={COLORS.primary} />
                </BarChart>
              </ResponsiveContainer>
            </Box>
          )}
        </CardContent>
      </Card>

      {/* Expense List Table */}
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
        <Typography variant="h6" sx={{ fontWeight: 800, color: COLORS.primary, fontFamily: 'Playfair Display' }}>
          All Expenses
        </Typography>
        <Button variant="contained" startIcon={<Plus size={18} />} onClick={openAdd}
          sx={{ bgcolor: COLORS.primary, borderRadius: 3, fontWeight: 700, textTransform: 'none', '&:hover': { bgcolor: '#6B1423' } }}>
          Add Expense
        </Button>
      </Stack>
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
                <TableCell sx={{ fontWeight: 800, color: COLORS.primary }} align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {expenses.map((e: any, i: number) => (
                <TableRow key={i} sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                  <TableCell sx={{ fontWeight: 700 }}>{e.title}</TableCell>
                  <TableCell>
                    <Chip label={e.category} size="small" sx={{ fontWeight: 700, bgcolor: `${COLORS.primary}10`, color: COLORS.primary, fontSize: '0.7rem' }} />
                  </TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>{Number(e.amount).toLocaleString()}</TableCell>
                  <TableCell>
                    <Stack direction="row" spacing={1} alignItems="center">
                      <Switch
                        size="small"
                        color="success"
                        checked={!!e.paid}
                        disabled={togglingPaid === i}
                        onChange={(evt) => handleTogglePaid(i, evt.target.checked, e)}
                      />
                      {togglingPaid === i ? (
                        <CircularProgress size={14} color="inherit" />
                      ) : e.paid ? (
                        <CheckCircle2 size={16} color={COLORS.success} />
                      ) : (
                        <AlertCircle size={16} color={COLORS.warning} />
                      )}
                    </Stack>
                  </TableCell>
                  <TableCell sx={{ color: 'text.secondary', fontSize: '0.8rem' }}>{e.notes || '—'}</TableCell>
                  <TableCell align="right">
                    <Stack direction="row" spacing={0.5} justifyContent="flex-end">
                      <Tooltip title="Edit">
                        <IconButton size="small" onClick={() => openEdit(i)} sx={{ color: COLORS.primary }}>
                          <Edit3 size={15} />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Delete">
                        <IconButton size="small" disabled={deleting === i} onClick={() => setDeleteConfirm(i)} sx={{ color: COLORS.error }}>
                          {deleting === i ? <CircularProgress size={14} color="inherit" /> : <Trash2 size={15} />}
                        </IconButton>
                      </Tooltip>
                    </Stack>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteConfirm !== null} onClose={() => deleting === null && setDeleteConfirm(null)} maxWidth="xs" fullWidth PaperProps={{ sx: { borderRadius: 4 } }}>
        <DialogTitle sx={{ fontWeight: 800, color: COLORS.error }}>Delete Expense?</DialogTitle>
        <DialogContent>
          <Typography variant="body2">
            Are you sure you want to delete <strong>"{deleteConfirm !== null ? expenses[deleteConfirm]?.title : ''}"</strong>? This cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setDeleteConfirm(null)} disabled={deleting !== null}>Cancel</Button>
          <Button variant="contained" color="error" disabled={deleting !== null}
            onClick={() => deleteConfirm !== null && handleDelete(deleteConfirm, true)}
            startIcon={deleting !== null ? <CircularProgress size={14} color="inherit" /> : undefined}
            sx={{ borderRadius: 3, fontWeight: 700, minWidth: 108, minHeight: 36 }}>
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      {/* Add / Edit Expense Dialog */}
      <Dialog open={expenseModal.open} onClose={() => !saving && setExpenseModal(s => ({ ...s, open: false }))} fullWidth maxWidth="sm" PaperProps={{ sx: { borderRadius: 6 } }}>
        <DialogTitle sx={{ fontWeight: 800, fontFamily: 'Playfair Display', color: COLORS.primary }}>
          {expenseModal.mode === 'add' ? 'Add New Expense' : 'Edit Expense'}
        </DialogTitle>
        <DialogContent>
          <Stack spacing={3} sx={{ mt: 1 }}>
            <TextField fullWidth label="Title" placeholder="e.g. Advance payment for flowers" value={form.title} onChange={(e) => setForm((x: any) => ({ ...x, title: e.target.value }))} />
            <FormControl fullWidth>
              <InputLabel>Category</InputLabel>
              <Select label="Category" value={form.category} onChange={(e) => setForm((x: any) => ({ ...x, category: e.target.value }))}>
                {CATEGORIES.map(cat => <MenuItem key={cat} value={cat}>{cat}</MenuItem>)}
              </Select>
            </FormControl>
            <TextField fullWidth label="Amount (LKR)" type="number" value={form.amount} onChange={(e) => setForm((x: any) => ({ ...x, amount: e.target.value }))} inputProps={{ min: 0 }} />
            <TextField fullWidth label="Notes (optional)" multiline rows={2} value={form.notes} onChange={(e) => setForm((x: any) => ({ ...x, notes: e.target.value }))} />
            <Stack direction="row" alignItems="center" spacing={1}>
              <Typography variant="body2" sx={{ fontWeight: 600 }}>Mark as Paid</Typography>
              <Switch checked={!!form.paid} onChange={(e) => setForm((x: any) => ({ ...x, paid: e.target.checked }))} color="success" />
            </Stack>
          </Stack>
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
          <Button onClick={() => setExpenseModal(s => ({ ...s, open: false }))} disabled={saving} sx={{ color: 'text.secondary', fontWeight: 700 }}>Cancel</Button>
          <Button variant="contained" onClick={handleSave} disabled={saving || !form.title.trim() || !form.amount}
            startIcon={saving ? <CircularProgress size={14} color="inherit" /> : undefined}
            sx={{ bgcolor: COLORS.primary, borderRadius: 3, px: 4, fontWeight: 700 }}>
            {saving ? 'Saving…' : expenseModal.mode === 'add' ? 'Add Expense' : 'Save Changes'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Edit Total Budget Dialog */}
      <Dialog open={budgetDialogOpen} onClose={() => !savingBudget && setBudgetDialogOpen(false)} maxWidth="xs" fullWidth PaperProps={{ sx: { borderRadius: 6 } }}>
        <DialogTitle sx={{ fontWeight: 800, fontFamily: 'Playfair Display', color: COLORS.primary }}>Set Total Budget</DialogTitle>
        <DialogContent>
          <TextField fullWidth autoFocus label="Total Budget (LKR)" type="number" value={budgetInput}
            onChange={(e) => setBudgetInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSaveBudget()}
            inputProps={{ min: 0 }} sx={{ mt: 1 }} />
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
          <Button onClick={() => setBudgetDialogOpen(false)} disabled={savingBudget} sx={{ color: 'text.secondary', fontWeight: 700 }}>Cancel</Button>
          <Button variant="contained" onClick={handleSaveBudget} disabled={savingBudget}
            startIcon={savingBudget ? <CircularProgress size={14} color="inherit" /> : undefined}
            sx={{ bgcolor: COLORS.primary, borderRadius: 3, px: 4, fontWeight: 700 }}>
            {savingBudget ? 'Saving…' : 'Save'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

// --- Helper Components ---

function SummaryCard({ title, value, icon, color, subtitle, delay, action }: any) {
  return (
    <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
      <MotionBox initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay, duration: 0.5 }}>
        <Card sx={{ borderRadius: 6, border: '1px solid', borderColor: 'divider', height: '100%' }}>
          <CardContent sx={{ p: 3 }}>
            <Stack direction="row" spacing={2} alignItems="center">
              <Box sx={{ p: 1.5, borderRadius: 4, bgcolor: `${color}10`, color: color }}>{icon}</Box>
              <Box sx={{ flex: 1 }}>
                <Stack direction="row" alignItems="center" spacing={0.5}>
                  <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600, display: 'block' }}>{title}</Typography>
                  {action}
                </Stack>
                <Typography variant="h6" sx={{ fontWeight: 800, color: COLORS.textPrimary }}>{value}</Typography>
                {subtitle && <Typography variant="caption" sx={{ color, fontWeight: 700 }}>{subtitle}</Typography>}
              </Box>
            </Stack>
          </CardContent>
        </Card>
      </MotionBox>
    </Grid>
  );
}

const MotionBox = motion(Box);

