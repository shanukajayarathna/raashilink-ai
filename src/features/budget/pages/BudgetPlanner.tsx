import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Box,
  Container,
  Typography,
  Grid,
  Card,
  CardContent,
  Stack,
  IconButton,
  Button,
  TextField,
  CircularProgress,
  ToggleButtonGroup,
  ToggleButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Fab,
  useTheme,
  useMediaQuery,
  Skeleton,
  InputAdornment,
  Tooltip,
  Divider,
} from '@mui/material';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip as RechartsTooltip,
  Legend,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from 'recharts';
import {
  Plus,
  Edit3,
  DollarSign,
  TrendingUp,
  Wallet,
  PieChart as PieChartIcon,
  BarChart3,
  Table as TableIcon,
  Search,
  Filter,
  Receipt,
  Trash2,
  Sparkles,
  AlertCircle,
  CheckCircle2,
  ChevronRight,
  ArrowRight,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useSelector } from 'react-redux';
import { RootState } from '@/app/store/store';
import weddingService from '@/features/wedding/services/weddingService';

// Sub-components
import AddExpenseModal from '../components/AddExpenseModal';
import SetBudgetModal from '../components/SetBudgetModal';
import BudgetAdvice from '../components/BudgetAdvice';

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
  warning: '#ED6C02',
};

const CATEGORY_COLORS = {
  Venue: '#8B1A2E',
  Catering: '#C9A84C',
  Photography: '#1A6B72',
  Decoration: '#6A1B9A',
  Attire: '#FF7043',
  Invitations: '#00ACC1',
  Beauty: '#EC407A',
  Logistics: '#5D4037',
  Others: '#78909C',
};

function buildBudgetViewModel(budgetPayload: any) {
  const summary = budgetPayload?.data || {};
  const expenses = Array.isArray(summary.expenses) ? summary.expenses : [];
  const byCategory: Record<string, any> = summary.byCategory || {};
  const totalBudget = Number(summary.totalBudget || 0);

  // Prefer byCategory from the API (includes allocations)
  let categories: { name: string; allocated: number; spent: number }[];
  if (Object.keys(byCategory).length > 0) {
    categories = Object.entries(byCategory).map(([name, data]: [string, any]) => ({
      name,
      allocated: Number(data.allocated || 0),
      spent: Number(data.spent || 0),
    }));
  } else {
    // Fallback: derive from expenses
    const grouped = expenses.reduce((acc: Record<string, number>, expense: any) => {
      const category = expense?.category || 'Others';
      acc[category] = (acc[category] || 0) + Number(expense?.amount || 0);
      return acc;
    }, {});
    categories = Object.entries(grouped).map(([name, spent]) => ({
      name,
      allocated: 0,
      spent: spent as number,
    }));
  }

  if (categories.length === 0) {
    categories = [{ name: 'Budget', allocated: totalBudget, spent: Number(summary.totalSpent || 0) }];
  }

  return {
    totalBudget,
    categories,
    expenses: expenses.map((expense: any, index: number) => ({
      id: expense?._id || String(index + 1),
      index,
      date: expense?.date
        ? new Date(expense.date).toISOString().split('T')[0]
        : new Date().toISOString().split('T')[0],
      category: expense?.category || 'Others',
      description: expense?.description || expense?.title || 'Wedding expense',
      amount: Number(expense?.amount || 0),
      hasReceipt: !!expense?.receiptUrl,
    })),
  };
}

export default function BudgetPlanner() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const token = useSelector((state: RootState) => state.auth.token);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState('doughnut');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isSetBudgetModalOpen, setIsSetBudgetModalOpen] = useState(false);
  const [budgetData, setBudgetData] = useState<any>(null);
  const [tempTotal, setTempTotal] = useState('0');
  const [isEditingTotal, setIsEditingTotal] = useState(false);
  const fetchBudget = useCallback(async () => {
    setLoading(true);
    try {
      const response = await weddingService.getBudget();
      const viewModel = buildBudgetViewModel(response);
      setBudgetData(viewModel);
      setTempTotal(viewModel.totalBudget.toString());
    } catch (err) {
      console.error('Failed to load budget details', err);
      const emptyViewModel = buildBudgetViewModel({ data: { totalBudget: 0, totalSpent: 0, expenses: [] } });
      setBudgetData(emptyViewModel);
      setTempTotal('0');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (token) {
      fetchBudget();
      return;
    }
    const emptyViewModel = buildBudgetViewModel({ data: { totalBudget: 0, totalSpent: 0, expenses: [] } });
    setBudgetData(emptyViewModel);
    setTempTotal('0');
    setLoading(false);
  }, [token, fetchBudget]);

  const stats = useMemo(() => {
    if (!budgetData) return null;
    const totalSpent = budgetData.categories.reduce((acc: number, cat: any) => acc + cat.spent, 0);
    const remaining = budgetData.totalBudget - totalSpent;
    const usedPercent = Math.round((totalSpent / budgetData.totalBudget) * 100);
    return { totalSpent, remaining, usedPercent };
  }, [budgetData]);

  const handleUpdateTotal = async () => {
    const nextTotal = Number.parseInt(tempTotal, 10) || 0;

    try {
      await weddingService.updateProject({ totalBudget: nextTotal });
      setBudgetData((prev: any) => ({ ...prev, totalBudget: nextTotal }));
    } catch (error) {
      console.error('Failed to update total budget', error);
    } finally {
      setIsEditingTotal(false);
    }
  };

  if (loading) return <BudgetSkeleton />;

  return (
    <Container maxWidth="xl" sx={{ py: 4, pb: 12 }}>
      {/* Header Section */}
      <Box sx={{ mb: 6 }}>
        <Typography variant="h4" sx={{ fontWeight: 800, fontFamily: 'Playfair Display', color: COLORS.primary, mb: 4 }}>
          Wedding Budget Planner
        </Typography>

        <Grid container spacing={3}>
          <MetricCard
            title="Total Budget"
            value={
              isEditingTotal ? (
                <TextField
                  size="small"
                  value={tempTotal}
                  onChange={(e) => setTempTotal(e.target.value)}
                  onBlur={handleUpdateTotal}
                  onKeyPress={(e) => e.key === 'Enter' && handleUpdateTotal()}
                  autoFocus
                  InputProps={{
                    startAdornment: <InputAdornment position="start">LKR</InputAdornment>,
                  }}
                  sx={{ width: 200 }}
                />
              ) : (
                `LKR ${budgetData.totalBudget.toLocaleString()}`
              )
            }
            icon={<Wallet size={24} />}
            color={COLORS.primary}
            action={!isEditingTotal && <IconButton size="small" onClick={() => setIsEditingTotal(true)}><Edit3 size={16} /></IconButton>}
            delay={0.1}
          />
          <MetricCard
            title="Total Spent"
            value={`LKR ${stats?.totalSpent.toLocaleString()}`}
            icon={<TrendingUp size={24} />}
            color={COLORS.accent}
            delay={0.2}
          />
          <MetricCard
            title="Remaining Balance"
            value={`LKR ${stats?.remaining.toLocaleString()}`}
            icon={<DollarSign size={24} />}
            color={COLORS.success}
            delay={0.3}
          />
          <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
            <MotionBox
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.5 }}
            >
              <Card sx={{ borderRadius: 6, border: '1px solid', borderColor: 'divider', height: '100%', position: 'relative', overflow: 'hidden' }}>
                <CardContent sx={{ p: 3, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Box>
                    <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600, display: 'block', mb: 0.5 }}>
                      Budget Used %
                    </Typography>
                    <Typography variant="h5" sx={{ fontWeight: 800, color: COLORS.textPrimary }}>
                      {stats?.usedPercent}%
                    </Typography>
                  </Box>
                  <Box sx={{ position: 'relative', display: 'inline-flex' }}>
                    <CircularProgress
                      variant="determinate"
                      value={stats?.usedPercent}
                      size={60}
                      thickness={5}
                      sx={{ color: stats?.usedPercent && stats.usedPercent > 90 ? COLORS.error : COLORS.primary }}
                    />
                    <Box
                      sx={{
                        top: 0,
                        left: 0,
                        bottom: 0,
                        right: 0,
                        position: 'absolute',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <Typography variant="caption" component="div" color="text.secondary" sx={{ fontWeight: 700 }}>
                        {stats?.usedPercent}%
                      </Typography>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </MotionBox>
          </Grid>
        </Grid>
      </Box>

      <Grid container spacing={4}>
        {/* Main Chart Section */}
        <Grid size={{ xs: 12, lg: 8 }}>
          <Card sx={{ borderRadius: 6, border: '1px solid', borderColor: 'divider', mb: 4 }}>
            <CardContent sx={{ p: 4 }}>
              <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 4 }}>
                <Typography variant="h6" sx={{ fontWeight: 800, color: COLORS.primary, fontFamily: 'Playfair Display' }}>
                  Spending Overview
                </Typography>
                <ToggleButtonGroup
                  value={viewMode}
                  exclusive
                  onChange={(_, val) => val && setViewMode(val)}
                  size="small"
                  sx={{
                    '& .MuiToggleButton-root': {
                      px: 2,
                      borderRadius: 3,
                      textTransform: 'none',
                      fontWeight: 700,
                      '&.Mui-selected': { bgcolor: COLORS.primary, color: 'white', '&:hover': { bgcolor: '#6B1423' } }
                    }
                  }}
                >
                  <ToggleButton value="doughnut"><PieChartIcon size={18} style={{ marginRight: 8 }} /> Doughnut</ToggleButton>
                  <ToggleButton value="bar"><BarChart3 size={18} style={{ marginRight: 8 }} /> Bar Chart</ToggleButton>
                  <ToggleButton value="table"><TableIcon size={18} style={{ marginRight: 8 }} /> Table</ToggleButton>
                </ToggleButtonGroup>
              </Stack>

              <AnimatePresence mode="wait">
                {viewMode === 'doughnut' && (
                  <MotionBox
                    key="doughnut"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    sx={{ height: 400, width: '100%', position: 'relative' }}
                  >
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={budgetData.categories}
                          cx="50%"
                          cy="50%"
                          innerRadius={100}
                          outerRadius={140}
                          paddingAngle={5}
                          dataKey="spent"
                          nameKey="name"
                          animationBegin={0}
                          animationDuration={1500}
                        >
                          {budgetData.categories.map((entry: any, index: number) => (
                            <Cell key={`cell-${index}`} fill={CATEGORY_COLORS[entry.name as keyof typeof CATEGORY_COLORS] || COLORS.primary} />
                          ))}
                        </Pie>
                        <RechartsTooltip
                          contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}
                          formatter={(value: number) => `LKR ${value.toLocaleString()}`}
                        />
                        <Legend verticalAlign="bottom" height={36} />
                      </PieChart>
                    </ResponsiveContainer>
                    <Box sx={{
                      position: 'absolute',
                      top: '50%',
                      left: '50%',
                      transform: 'translate(-50%, -50%)',
                      textAlign: 'center'
                    }}>
                      <Typography variant="h6" sx={{ fontWeight: 800, color: COLORS.primary }}>
                        LKR {stats?.remaining.toLocaleString()}
                      </Typography>
                      <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600 }}>
                        Remaining
                      </Typography>
                    </Box>
                  </MotionBox>
                )}

                {viewMode === 'bar' && (
                  <MotionBox
                    key="bar"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 20 }}
                    sx={{ height: 400, width: '100%' }}
                  >
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={budgetData.categories} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: COLORS.textSecondary, fontSize: 12 }} />
                        <YAxis axisLine={false} tickLine={false} tick={{ fill: COLORS.textSecondary, fontSize: 12 }} />
                        <RechartsTooltip
                          cursor={{ fill: `${COLORS.cream}50` }}
                          contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}
                        />
                        <Legend verticalAlign="top" align="right" iconType="circle" wrapperStyle={{ paddingBottom: 20 }} />
                        <Bar dataKey="allocated" fill={COLORS.secondary} radius={[4, 4, 0, 0]} name="Allocated" />
                        <Bar dataKey="spent" fill={COLORS.primary} radius={[4, 4, 0, 0]} name="Spent" />
                      </BarChart>
                    </ResponsiveContainer>
                  </MotionBox>
                )}

                {viewMode === 'table' && (
                  <MotionBox
                    key="table"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                  >
                    <CategoryTable categories={budgetData.categories} />
                  </MotionBox>
                )}
              </AnimatePresence>
            </CardContent>
          </Card>

          {/* Expense Log */}
          <Card sx={{ borderRadius: 6, border: '1px solid', borderColor: 'divider' }}>
            <CardContent sx={{ p: 4 }}>
              <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems={{ xs: 'flex-start', sm: 'center' }} spacing={2} sx={{ mb: 4 }}>
                <Typography variant="h6" sx={{ fontWeight: 800, color: COLORS.primary, fontFamily: 'Playfair Display' }}>
                  Expense Log
                </Typography>
                <Stack direction="row" spacing={2}>
                  <TextField
                    size="small"
                    placeholder="Search expenses..."
                    InputProps={{
                      startAdornment: <Search size={16} style={{ marginRight: 8, color: COLORS.textSecondary }} />,
                      sx: { borderRadius: 3, bgcolor: COLORS.cream }
                    }}
                  />
                  <Button variant="outlined" startIcon={<Filter size={16} />} sx={{ borderRadius: 3, textTransform: 'none', fontWeight: 700, color: COLORS.textPrimary, borderColor: 'divider' }}>
                    Filter
                  </Button>
                </Stack>
              </Stack>

              <ExpenseList expenses={budgetData.expenses} onDelete={fetchBudget} />
            </CardContent>
          </Card>
        </Grid>

        {/* AI Budget Advisor Panel */}
        <Grid size={{ xs: 12, lg: 4 }}>
          <BudgetAdvice />
          
          <Button
            fullWidth
            variant="contained"
            startIcon={<Sparkles size={18} />}
            onClick={() => setIsSetBudgetModalOpen(true)}
            sx={{
              mt: 4,
              py: 2,
              borderRadius: 4,
              bgcolor: COLORS.primary,
              fontWeight: 800,
              fontFamily: 'Playfair Display',
              boxShadow: '0 10px 20px rgba(139,26,46,0.2)',
              '&:hover': { bgcolor: '#6B1423' }
            }}
          >
            Set Budget by Category
          </Button>
        </Grid>
      </Grid>

      {/* Floating Add Expense Button */}
      <Fab
        color="primary"
        aria-label="add"
        onClick={() => setIsAddModalOpen(true)}
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

      {/* Modals */}
      <AddExpenseModal
        open={isAddModalOpen}
        onClose={async () => {
          setIsAddModalOpen(false);
          await fetchBudget();
        }}
        onAdd={async () => {
          await fetchBudget();
        }}
      />
      <SetBudgetModal
        open={isSetBudgetModalOpen}
        onClose={() => setIsSetBudgetModalOpen(false)}
        totalBudget={budgetData.totalBudget}
        categories={budgetData.categories}
        onSave={async (newCategories: any) => {
          setBudgetData((prev: any) => ({ ...prev, categories: newCategories }));
          setIsSetBudgetModalOpen(false);
          await fetchBudget();
        }}
      />
    </Container>
  );
}

// --- Helper Components ---

function MetricCard({ title, value, icon, color, action, delay }: any) {
  return (
    <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
      <MotionBox
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay, duration: 0.5 }}
      >
        <Card sx={{ borderRadius: 6, border: '1px solid', borderColor: 'divider', height: '100%' }}>
          <CardContent sx={{ p: 3 }}>
            <Stack direction="row" justifyContent="space-between" alignItems="flex-start" sx={{ mb: 2 }}>
              <Box sx={{ p: 1.5, borderRadius: 4, bgcolor: `${color}10`, color: color }}>
                {icon}
              </Box>
              {action}
            </Stack>
            <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600, display: 'block', mb: 0.5 }}>
              {title}
            </Typography>
            <Typography variant="h5" sx={{ fontWeight: 800, color: COLORS.textPrimary }}>
              {value}
            </Typography>
          </CardContent>
        </Card>
      </MotionBox>
    </Grid>
  );
}

function CategoryTable({ categories }: { categories: any[] }) {
  return (
    <TableContainer component={Paper} sx={{ borderRadius: 4, border: '1px solid', borderColor: 'divider', boxShadow: 'none', overflow: 'hidden' }}>
      <Table size="small">
        <TableHead sx={{ bgcolor: COLORS.cream }}>
          <TableRow>
            <TableCell sx={{ fontWeight: 800, color: COLORS.primary }}>Category</TableCell>
            <TableCell sx={{ fontWeight: 800, color: COLORS.primary }}>Allocated</TableCell>
            <TableCell sx={{ fontWeight: 800, color: COLORS.primary }}>Spent</TableCell>
            <TableCell sx={{ fontWeight: 800, color: COLORS.primary }}>Remaining</TableCell>
            <TableCell sx={{ fontWeight: 800, color: COLORS.primary }}>% Used</TableCell>
            <TableCell sx={{ fontWeight: 800, color: COLORS.primary }}>Status</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {categories.map((cat, i) => {
            const remaining = cat.allocated - cat.spent;
            const isOver = cat.spent > cat.allocated && cat.allocated > 0;
            const usedPct = cat.allocated > 0 ? Math.round((cat.spent / cat.allocated) * 100) : cat.spent > 0 ? 100 : 0;
            const isWarning = usedPct >= 80 && !isOver;

            return (
              <TableRow key={i}>
                <TableCell sx={{ fontWeight: 700 }}>{cat.name}</TableCell>
                <TableCell>LKR {cat.allocated.toLocaleString()}</TableCell>
                <TableCell sx={{ color: isOver ? COLORS.error : 'inherit' }}>LKR {cat.spent.toLocaleString()}</TableCell>
                <TableCell sx={{ color: remaining < 0 ? COLORS.error : COLORS.success, fontWeight: 700 }}>
                  LKR {remaining.toLocaleString()}
                </TableCell>
                <TableCell sx={{ fontWeight: 700 }}>{usedPct}%</TableCell>
                <TableCell>
                  <Chip
                    label={isOver ? 'Over' : isWarning ? 'Warning' : 'On track'}
                    size="small"
                    sx={{
                      fontWeight: 800,
                      fontSize: '0.65rem',
                      bgcolor: isOver ? `${COLORS.error}15` : isWarning ? `${COLORS.warning}15` : `${COLORS.success}15`,
                      color: isOver ? COLORS.error : isWarning ? COLORS.warning : COLORS.success,
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
  );
}

function ExpenseList({ expenses, onDelete }: { expenses: any[]; onDelete?: () => void }) {
  const [deletingId, setDeletingId] = React.useState<string | null>(null);

  const handleDelete = async (expense: any) => {
    setDeletingId(expense.id);
    try {
      await weddingService.deleteExpense(expense.index);
      onDelete?.();
    } catch (err) {
      console.error('Failed to delete expense', err);
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <Stack spacing={2}>
      {expenses.map((expense, i) => (
        <MotionBox
          key={expense.id}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: i * 0.1 }}
          sx={{
            p: 2,
            borderRadius: 4,
            bgcolor: 'white',
            border: '1px solid',
            borderColor: 'divider',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            '&:hover': { borderColor: COLORS.secondary, bgcolor: `${COLORS.cream}50` },
            transition: 'all 0.2s ease'
          }}
        >
          <Stack direction="row" spacing={3} alignItems="center">
            <Box sx={{ textAlign: 'center', minWidth: 60 }}>
              <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 700, display: 'block' }}>
                {new Date(expense.date).toLocaleDateString('en-US', { month: 'short' })}
              </Typography>
              <Typography variant="h6" sx={{ fontWeight: 800, color: COLORS.primary, lineHeight: 1 }}>
                {new Date(expense.date).getDate()}
              </Typography>
            </Box>
            <Divider orientation="vertical" flexItem />
            <Box>
              <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 0.5 }}>
                <Chip
                  label={expense.category}
                  size="small"
                  sx={{
                    height: 20,
                    fontSize: '0.65rem',
                    fontWeight: 800,
                    bgcolor: `${CATEGORY_COLORS[expense.category as keyof typeof CATEGORY_COLORS] || COLORS.primary}15`,
                    color: CATEGORY_COLORS[expense.category as keyof typeof CATEGORY_COLORS] || COLORS.primary
                  }}
                />
                <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>{expense.description}</Typography>
              </Stack>
              <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                LKR {expense.amount.toLocaleString()}
              </Typography>
            </Box>
          </Stack>
          <Stack direction="row" spacing={1}>
            {expense.hasReceipt && (
              <Tooltip title="View Receipt">
                <IconButton size="small" sx={{ color: COLORS.accent }}>
                  <Receipt size={18} />
                </IconButton>
              </Tooltip>
            )}
            <IconButton
              size="small"
              disabled={deletingId === expense.id}
              onClick={() => handleDelete(expense)}
              sx={{ color: COLORS.error }}
            >
              {deletingId === expense.id ? <CircularProgress size={18} /> : <Trash2 size={18} />}
            </IconButton>
          </Stack>
        </MotionBox>
      ))}
    </Stack>
  );
}

function BudgetSkeleton() {
  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Skeleton variant="text" width={300} height={60} sx={{ mb: 4 }} />
      <Grid container spacing={3} sx={{ mb: 6 }}>
        {[...Array(4)].map((_, i) => (
          <Grid size={{ xs: 12, sm: 6, lg: 3 }} key={i}>
            <Skeleton variant="rectangular" height={120} sx={{ borderRadius: 6 }} />
          </Grid>
        ))}
      </Grid>
      <Grid container spacing={4}>
        <Grid size={{ xs: 12, lg: 8 }}>
          <Skeleton variant="rectangular" height={450} sx={{ borderRadius: 6, mb: 4 }} />
          <Skeleton variant="rectangular" height={400} sx={{ borderRadius: 6 }} />
        </Grid>
        <Grid size={{ xs: 12, lg: 4 }}>
          <Skeleton variant="rectangular" height={600} sx={{ borderRadius: 6 }} />
        </Grid>
      </Grid>
    </Container>
  );
}

const MotionBox = motion(Box);


