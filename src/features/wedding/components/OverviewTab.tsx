import React from 'react';
import { 
  Box, Grid, Typography, Card, CardContent, 
  Stack, Button, IconButton, useTheme, useMediaQuery,
  LinearProgress, Divider, Avatar, CircularProgress
} from '@mui/material';
import { 
  PieChart, Pie, Cell, Tooltip, Legend 
} from 'recharts';
import { 
  Plus, ChevronRight, Calendar, CheckCircle2, 
  ArrowRight, Sparkles, TrendingUp, AlertCircle
} from 'lucide-react';
import { motion } from 'motion/react';
import chatService from '@/features/chat/services/chatService';

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

const CHART_COLORS = [COLORS.primary, COLORS.secondary, COLORS.accent, '#4CAF50', '#FF9800', '#9C27B0'];

export default function OverviewTab({ data, onSwitchTab, project, budget }: { data: any, onSwitchTab: (idx: number) => void, project?: any, budget?: any }) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const chartWidth = isMobile ? 280 : 420;
  const chartHeight = isMobile ? 240 : 280;
  const [aiTip, setAiTip] = React.useState('Analyzing your latest wedding budget and plan details...');
  const [aiTipLoading, setAiTipLoading] = React.useState(false);

  // Build budget chart data from real expenses grouped by category, or fall back to empty
  const expenses: any[] = Array.isArray(budget?.expenses) ? budget.expenses : (Array.isArray(project?.expenses) ? project.expenses : []);
  const budgetChartData = expenses.length > 0
    ? Object.entries(
        expenses.reduce((acc: Record<string, number>, e: any) => {
          if (!e) return acc;
          acc[e.category] = (acc[e.category] || 0) + Number(e.amount || 0);
          return acc;
        }, {})
      ).map(([name, value]) => ({ name, value }))
    : [];

  // Upcoming pending tasks from real checklist
  const checklist: any[] = Array.isArray(project?.checklist) ? project.checklist : [];
  const upcomingTasks = checklist
    .filter((t: any) => t && !t.completed)
    .slice(0, 5)
    .map((t: any, i: number) => ({
      id: String(i),
      title: t.title,
      due: t.dueDate ? new Date(t.dueDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : 'No due date',
      category: t.assignedTo || 'General',
    }));

  const aiContextKey = React.useMemo(() => {
    const spentByCategory = expenses.reduce((acc: Record<string, number>, e: any) => {
      if (!e) return acc;
      const cat = String(e.category || 'Others');
      acc[cat] = (acc[cat] || 0) + Number(e.amount || 0);
      return acc;
    }, {});
    return JSON.stringify({
      weddingDate: project?.weddingDate || data?.couple?.date || null,
      venue: typeof project?.venueId === 'object' ? (project?.venueId?.businessName || project?.venueId?.name || null) : project?.venueId || data?.couple?.venue || null,
      totalBudget: Number(budget?.totalBudget || project?.totalBudget || 0),
      totalSpent: Number(budget?.totalSpent || 0),
      checklistTotal: checklist.length,
      checklistDone: checklist.filter((t: any) => t?.completed).length,
      expenseCount: expenses.length,
      spentByCategory,
    });
  }, [budget?.totalBudget, budget?.totalSpent, checklist, data?.couple?.date, data?.couple?.venue, expenses, project?.totalBudget, project?.venueId, project?.weddingDate]);

  React.useEffect(() => {
    let cancelled = false;

    const fetchBudgetTip = async () => {
      try {
        setAiTipLoading(true);
        const context = JSON.parse(aiContextKey);
        const response = await chatService.sendAssistantMessage({
          message:
            'You are generating a single practical wedding budget tip. Use ONLY the provided wedding context and return one concise actionable tip in 1-2 sentences. Mention one concrete number when possible (LKR or percentage). Do not add markdown bullets. Context: ' +
            JSON.stringify(context),
          language: 'en',
          history: [],
        });
        const reply = String(response?.data?.reply || '').trim();
        if (!cancelled) {
          setAiTip(reply || 'Your latest plan looks balanced. Review the top spending category this week and reallocate 5-10% to remaining high-priority tasks.');
        }
      } catch {
        if (!cancelled) {
          setAiTip('Track your top two spending categories against your remaining budget and adjust early to avoid last-minute overages.');
        }
      } finally {
        if (!cancelled) setAiTipLoading(false);
      }
    };

    fetchBudgetTip();
    return () => {
      cancelled = true;
    };
  }, [aiContextKey]);

  return (
    <Grid container spacing={4}>
      {/* Left Column: Budget Overview */}
      <Grid size={{ xs: 12, md: 6 }}>
        <MotionBox
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Card sx={{ borderRadius: 6, border: '1px solid', borderColor: 'divider', height: '100%' }}>
            <CardContent sx={{ p: 4 }}>
              <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 4 }}>
                <Typography variant="h6" sx={{ fontWeight: 800, color: COLORS.primary, fontFamily: 'Playfair Display' }}>
                  Budget Allocation
                </Typography>
                <Button 
                  size="small" 
                  endIcon={<ArrowRight size={16} />}
                  onClick={() => onSwitchTab(3)}
                  sx={{ color: COLORS.primary, fontWeight: 700, textTransform: 'none' }}
                >
                  View Details
                </Button>
              </Stack>

              <Box sx={{ height: 300, width: '100%', minWidth: 0 }}>
                {budgetChartData.length === 0 ? (
                  <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 2, color: 'text.secondary' }}>
                    <TrendingUp size={40} opacity={0.3} />
                    <Typography variant="body2">No expenses logged yet. Add expenses in the Budget tab.</Typography>
                  </Box>
                ) : (
                <Box sx={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <PieChart width={chartWidth} height={chartHeight}>
                    <Pie
                      data={budgetChartData}
                      cx="50%"
                      cy="50%"
                      innerRadius={isMobile ? 45 : 60}
                      outerRadius={isMobile ? 78 : 100}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {budgetChartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}
                      formatter={(value: number) => `LKR ${value.toLocaleString()}`}
                    />
                    <Legend verticalAlign="bottom" height={36} />
                  </PieChart>
                </Box>
                )}
              </Box>

              <Box sx={{ mt: 2, p: 3, bgcolor: COLORS.cream, borderRadius: 4, border: '1px dashed', borderColor: COLORS.secondary }}>
                <Stack direction="row" spacing={2} alignItems="center">
                  <Box sx={{ p: 1, bgcolor: 'white', borderRadius: '50%', color: COLORS.secondary }}>
                    <Sparkles size={20} />
                  </Box>
                  <Box>
                    <Stack direction="row" spacing={1} alignItems="center">
                      <Typography variant="subtitle2" sx={{ fontWeight: 800, color: COLORS.primary }}>AI Budget Tip</Typography>
                      {aiTipLoading && <CircularProgress size={14} sx={{ color: COLORS.secondary }} />}
                    </Stack>
                    <Typography variant="body2" sx={{ color: COLORS.textSecondary }}>
                      {aiTip}
                    </Typography>
                  </Box>
                </Stack>
              </Box>
            </CardContent>
          </Card>
        </MotionBox>
      </Grid>

      {/* Right Column: Upcoming Tasks */}
      <Grid size={{ xs: 12, md: 6 }}>
        <MotionBox
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Card sx={{ borderRadius: 6, border: '1px solid', borderColor: 'divider', height: '100%' }}>
            <CardContent sx={{ p: 4 }}>
              <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 4 }}>
                <Typography variant="h6" sx={{ fontWeight: 800, color: COLORS.primary, fontFamily: 'Playfair Display' }}>
                  Upcoming Tasks
                </Typography>
                <Button 
                  variant="contained" 
                  size="small" 
                  startIcon={<Plus size={16} />}
                  onClick={() => onSwitchTab(1)}
                  sx={{ bgcolor: COLORS.primary, borderRadius: 3, fontWeight: 700, textTransform: 'none' }}
                >
                  Quick Add
                </Button>
              </Stack>

              <Stack spacing={2}>
                {upcomingTasks.length === 0 ? (
                  <Box sx={{ py: 4, textAlign: 'center', color: 'text.secondary' }}>
                    <CheckCircle2 size={40} opacity={0.3} style={{ margin: '0 auto 8px' }} />
                    <Typography variant="body2">All tasks done, or none added yet!</Typography>
                    <Button size="small" onClick={() => onSwitchTab(1)} sx={{ mt: 1, color: COLORS.primary, fontWeight: 700, textTransform: 'none' }}>
                      Go to Checklist
                    </Button>
                  </Box>
                ) : upcomingTasks.map((task, i) => (
                  <MotionBox
                    key={task.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
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
                    <Stack direction="row" spacing={2} alignItems="center">
                      <Box sx={{ 
                        width: 40, 
                        height: 40, 
                        borderRadius: 3, 
                        bgcolor: `${COLORS.primary}10`, 
                        color: COLORS.primary,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}>
                        <Calendar size={20} />
                      </Box>
                      <Box>
                        <Typography variant="subtitle2" sx={{ fontWeight: 700, color: COLORS.textPrimary }}>
                          {task.title}
                        </Typography>
                        <Typography variant="caption" sx={{ color: 'text.secondary', display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          Due: {task.due} • {task.category}
                        </Typography>
                      </Box>
                    </Stack>
                    <IconButton size="small" sx={{ color: COLORS.secondary }}>
                      <ChevronRight size={20} />
                    </IconButton>
                  </MotionBox>
                ))}
              </Stack>

              <Button 
                fullWidth 
                variant="text" 
                onClick={() => onSwitchTab(1)}
                sx={{ mt: 3, color: COLORS.primary, fontWeight: 700, textTransform: 'none' }}
                endIcon={<ArrowRight size={16} />}
              >
                View Full Checklist
              </Button>
            </CardContent>
          </Card>
        </MotionBox>
      </Grid>
    </Grid>
  );
}

const MotionBox = motion(Box);

