import React, { useState } from 'react';
import { 
  Box, Typography, Stack, Button, IconButton, 
  Card, CardContent, Collapse, Chip, Divider,
  useTheme, useMediaQuery, Avatar, AvatarGroup,
  Tooltip
} from '@mui/material';
import { 
  Calendar, CheckCircle2, Circle, ChevronDown, 
  ChevronUp, Heart, Plus, Milestone, 
  Clock, ArrowRight, Sparkles, MapPin,
  Camera, Music, Utensils, Scissors
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

function buildTimeline(weddingDate: Date) {
  const wd = weddingDate.getTime();
  const fmt = (d: Date) => d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  const addDays = (ms: number, days: number) => new Date(ms - days * 24 * 60 * 60 * 1000);
  const now = Date.now();

  const milestones = [
    {
      id: 1, timeframe: '6 Months Out', date: fmt(addDays(wd, 180)),
      ts: wd - 180 * 86400000,
      icon: <MapPin size={20} />,
      tasks: [
        { title: 'Book Venue & Catering', completed: false },
        { title: 'Hire Photographer', completed: false },
        { title: 'Set Wedding Budget', completed: false },
      ],
    },
    {
      id: 2, timeframe: '3 Months Out', date: fmt(addDays(wd, 90)),
      ts: wd - 90 * 86400000,
      icon: <Calendar size={20} />,
      tasks: [
        { title: 'Send Invitations', completed: false },
        { title: 'Book Florist', completed: false },
        { title: 'Dress & Suit Fittings', completed: false },
      ],
    },
    {
      id: 3, timeframe: '1 Month Out', date: fmt(addDays(wd, 30)),
      ts: wd - 30 * 86400000,
      icon: <Utensils size={20} />,
      tasks: [
        { title: 'Final Guest Count', completed: false },
        { title: 'Confirm All Vendors', completed: false },
        { title: 'Marriage License', completed: false },
      ],
    },
    {
      id: 4, timeframe: '1 Week Out', date: fmt(addDays(wd, 7)),
      ts: wd - 7 * 86400000,
      icon: <Scissors size={20} />,
      tasks: [
        { title: 'Final Payments', completed: false },
        { title: 'Pickup Attire', completed: false },
        { title: 'Beauty Appointments', completed: false },
      ],
    },
    {
      id: 5, timeframe: 'Wedding Day', date: fmt(weddingDate),
      ts: wd,
      icon: <Heart size={20} />,
      tasks: [{ title: 'The Big Day! ❤', completed: false }],
    },
  ];

  return milestones.map(m => ({
    ...m,
    status: now > m.ts + 86400000 ? 'completed' : now > m.ts - 14 * 86400000 ? 'in-progress' : 'pending',
  }));
}

export default function TimelineTab({ weddingDate }: { weddingDate?: string }) {
  const parsedDate = weddingDate ? new Date(weddingDate) : new Date(Date.now() + 180 * 24 * 60 * 60 * 1000);
  const timeline = buildTimeline(parsedDate);
  const currentIdx = timeline.findIndex(m => m.status === 'in-progress');
  const [expandedId, setExpandedId] = useState<number | null>(timeline[currentIdx >= 0 ? currentIdx : 0]?.id ?? null);

  return (
    <Box sx={{ maxWidth: 800, mx: 'auto', py: 4 }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 6 }}>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 800, color: COLORS.primary, fontFamily: 'Playfair Display' }}>
            Wedding Roadmap
          </Typography>
          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
            Your journey to the big day, step by step.
          </Typography>
        </Box>
        <Button 
          variant="outlined" 
          startIcon={<Plus size={18} />}
          sx={{ borderRadius: 3, color: COLORS.primary, borderColor: COLORS.primary, fontWeight: 700 }}
        >
          Add Milestone
        </Button>
      </Stack>

      <Box sx={{ position: 'relative' }}>
        {/* Vertical Line */}
        <Box sx={{ 
          position: 'absolute', 
          left: { xs: 20, sm: 40 }, 
          top: 0, 
          bottom: 0, 
          width: 4, 
          bgcolor: `${COLORS.secondary}20`,
          borderRadius: 2,
          zIndex: 0
        }} />

        <Stack spacing={4}>
          {timeline.map((milestone, i) => (
            <TimelineItem 
              key={milestone.id} 
              milestone={milestone} 
              isExpanded={expandedId === milestone.id}
              onToggle={() => setExpandedId(expandedId === milestone.id ? null : milestone.id)}
              delay={i * 0.1}
            />
          ))}
        </Stack>
      </Box>
    </Box>
  );
}

// --- Helper Components ---

function TimelineItem({ milestone, isExpanded, onToggle, delay }: any) {
  const isCompleted = milestone.status === 'completed';
  const isInProgress = milestone.status === 'in-progress';

  return (
    <MotionBox
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay, duration: 0.5 }}
      sx={{ position: 'relative', zIndex: 1, pl: { xs: 6, sm: 10 } }}
    >
      {/* Node Icon */}
      <Box sx={{ 
        position: 'absolute', 
        left: { xs: 0, sm: 20 }, 
        top: 0, 
        width: 44, 
        height: 44, 
        borderRadius: '50%', 
        bgcolor: isCompleted ? COLORS.success : isInProgress ? COLORS.primary : 'white',
        border: '4px solid',
        borderColor: isCompleted ? `${COLORS.success}20` : isInProgress ? `${COLORS.primary}20` : `${COLORS.secondary}20`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: isCompleted || isInProgress ? 'white' : COLORS.secondary,
        boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
        transition: 'all 0.3s ease'
      }}>
        {isCompleted ? <CheckCircle2 size={24} /> : milestone.icon}
      </Box>

      <Card 
        sx={{ 
          borderRadius: 6, 
          border: '1px solid', 
          borderColor: isInProgress ? COLORS.secondary : 'divider',
          boxShadow: isInProgress ? '0 10px 30px rgba(201,168,76,0.1)' : 'none',
          cursor: 'pointer',
          transition: 'all 0.3s ease',
          '&:hover': { borderColor: COLORS.secondary, bgcolor: `${COLORS.cream}30` }
        }}
        onClick={onToggle}
      >
        <CardContent sx={{ p: 3 }}>
          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <Box>
              <Typography variant="caption" sx={{ fontWeight: 800, color: COLORS.secondary, textTransform: 'uppercase', letterSpacing: 1 }}>
                {milestone.timeframe}
              </Typography>
              <Typography variant="h6" sx={{ fontWeight: 800, color: COLORS.textPrimary }}>
                {milestone.date}
              </Typography>
            </Box>
            <Stack direction="row" spacing={2} alignItems="center">
              <Chip 
                label={milestone.status.toUpperCase()} 
                size="small" 
                sx={{ 
                  fontWeight: 800, 
                  fontSize: '0.65rem',
                  bgcolor: isCompleted ? `${COLORS.success}15` : isInProgress ? `${COLORS.primary}15` : 'rgba(0,0,0,0.05)',
                  color: isCompleted ? COLORS.success : isInProgress ? COLORS.primary : 'text.disabled'
                }} 
              />
              {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
            </Stack>
          </Stack>

          <Collapse in={isExpanded}>
            <Box sx={{ mt: 3, pt: 3, borderTop: '1px solid', borderColor: 'divider' }}>
              <Stack spacing={2}>
                {milestone.tasks.map((task: any, i: number) => (
                  <Stack key={i} direction="row" spacing={2} alignItems="center">
                    <Box sx={{ 
                      width: 20, 
                      height: 20, 
                      borderRadius: '50%', 
                      border: '2px solid', 
                      borderColor: task.completed ? COLORS.success : 'divider',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: COLORS.success
                    }}>
                      {task.completed && <CheckCircle2 size={12} />}
                    </Box>
                    <Typography variant="body2" sx={{ 
                      color: task.completed ? 'text.disabled' : 'text.primary',
                      textDecoration: task.completed ? 'line-through' : 'none',
                      fontWeight: 500
                    }}>
                      {task.title}
                    </Typography>
                  </Stack>
                ))}
              </Stack>
              
              <Button 
                size="small" 
                sx={{ mt: 3, color: COLORS.primary, fontWeight: 700, textTransform: 'none' }}
                endIcon={<ArrowRight size={16} />}
              >
                Manage Tasks
              </Button>
            </Box>
          </Collapse>
        </CardContent>
      </Card>
    </MotionBox>
  );
}

const MotionBox = motion(Box);

