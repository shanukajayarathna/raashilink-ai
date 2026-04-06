import React from 'react';
import { 
  Box, Grid, Typography, Card, CardContent, 
  Stack, Button, IconButton, useTheme, useMediaQuery,
  LinearProgress, Divider, Avatar
} from '@mui/material';
import { 
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend 
} from 'recharts';
import { 
  Plus, ChevronRight, Calendar, CheckCircle2, 
  ArrowRight, Sparkles, TrendingUp, AlertCircle
} from 'lucide-react';
import { motion } from 'motion/react';

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

const MOCK_BUDGET_DATA = [
  { name: 'Venue', value: 250000 },
  { name: 'Catering', value: 180000 },
  { name: 'Photography', value: 120000 },
  { name: 'Decor', value: 90000 },
  { name: 'Attire', value: 160000 },
];

const MOCK_TASKS = [
  { id: 1, title: 'Finalize Guest List', due: '2025-05-15', category: 'Logistics', status: 'pending' },
  { id: 2, title: 'Book Photographer', due: '2025-05-20', category: 'Photography', status: 'pending' },
  { id: 3, title: 'Order Invitations', due: '2025-06-01', category: 'Invitations', status: 'pending' },
  { id: 4, title: 'Cake Tasting', due: '2025-06-10', category: 'Catering', status: 'pending' },
  { id: 5, title: 'Select Florist', due: '2025-06-15', category: 'Decorations', status: 'pending' },
];

export default function OverviewTab({ data, onSwitchTab }: { data: any, onSwitchTab: (idx: number) => void }) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

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

              <Box sx={{ height: 300, width: '100%' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={MOCK_BUDGET_DATA}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {MOCK_BUDGET_DATA.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}
                      formatter={(value: number) => `LKR ${value.toLocaleString()}`}
                    />
                    <Legend verticalAlign="bottom" height={36} />
                  </PieChart>
                </ResponsiveContainer>
              </Box>

              <Box sx={{ mt: 4, p: 3, bgcolor: COLORS.cream, borderRadius: 4, border: '1px dashed', borderColor: COLORS.secondary }}>
                <Stack direction="row" spacing={2} alignItems="center">
                  <Box sx={{ p: 1, bgcolor: 'white', borderRadius: '50%', color: COLORS.secondary }}>
                    <Sparkles size={20} />
                  </Box>
                  <Box>
                    <Typography variant="subtitle2" sx={{ fontWeight: 800, color: COLORS.primary }}>AI Budget Tip</Typography>
                    <Typography variant="body2" sx={{ color: COLORS.textSecondary }}>
                      You've allocated 31% to Venue. Consider reducing decoration budget by 15% to stay within your total goal.
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
                  sx={{ bgcolor: COLORS.primary, borderRadius: 3, fontWeight: 700, textTransform: 'none' }}
                >
                  Quick Add
                </Button>
              </Stack>

              <Stack spacing={2}>
                {MOCK_TASKS.map((task, i) => (
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

