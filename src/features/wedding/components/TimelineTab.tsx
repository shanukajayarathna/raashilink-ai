import React, { useState } from 'react';
import { 
  Box, Typography, Stack, Button, IconButton, 
  Card, CardContent, Collapse, Chip, LinearProgress,
  Dialog, DialogTitle, DialogContent, DialogActions, TextField, CircularProgress,
  Tooltip
} from '@mui/material';
import { 
  Calendar, CheckCircle2, Circle, ChevronDown, 
  ChevronUp, Heart, Plus, MapPin,
  Utensils, Scissors, Sparkles
} from 'lucide-react';
import { motion } from 'motion/react';
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

function buildTimeline(weddingDate: Date) {
  const wd = weddingDate.getTime();
  const fmt = (d: Date) => d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  const sub = (days: number) => new Date(wd - days * 86400000);
  const now = Date.now();

  const milestones = [
    {
      id: 1, timeframe: '12 Months Out', date: fmt(sub(365)), ts: wd - 365 * 86400000,
      icon: <Sparkles size={20} />, color: '#9C27B0',
      taskTemplates: ['Set wedding date & guest count', 'Define wedding style & theme', 'Start venue research'],
    },
    {
      id: 2, timeframe: '9 Months Out', date: fmt(sub(270)), ts: wd - 270 * 86400000,
      icon: <MapPin size={20} />, color: COLORS.primary,
      taskTemplates: ['Book venue & catering', 'Hire photographer & videographer', 'Set total wedding budget'],
    },
    {
      id: 3, timeframe: '6 Months Out', date: fmt(sub(180)), ts: wd - 180 * 86400000,
      icon: <Calendar size={20} />, color: COLORS.accent,
      taskTemplates: ['Book florist & decor', 'Dress & suit fittings', 'Book music / DJ'],
    },
    {
      id: 4, timeframe: '3 Months Out', date: fmt(sub(90)), ts: wd - 90 * 86400000,
      icon: <Utensils size={20} />, color: '#FF9800',
      taskTemplates: ['Send invitations', 'Plan honeymoon', 'Confirm menu with caterer'],
    },
    {
      id: 5, timeframe: '1 Month Out', date: fmt(sub(30)), ts: wd - 30 * 86400000,
      icon: <Scissors size={20} />, color: '#2196F3',
      taskTemplates: ['Final guest count', 'Confirm all vendors', 'Marriage license'],
    },
    {
      id: 6, timeframe: '1 Week Out', date: fmt(sub(7)), ts: wd - 7 * 86400000,
      icon: <CheckCircle2 size={20} />, color: COLORS.success,
      taskTemplates: ['Final payments', 'Pickup attire', 'Beauty appointments'],
    },
    {
      id: 7, timeframe: 'Wedding Day 🎉', date: fmt(weddingDate), ts: wd,
      icon: <Heart size={20} />, color: COLORS.secondary,
      taskTemplates: ['The Big Day! ❤️'],
    },
  ];

  return milestones.map(m => ({
    ...m,
    status: now > m.ts + 86400000 ? 'completed' : now > m.ts - 14 * 86400000 ? 'in-progress' : 'pending',
  }));
}

interface TimelineTabProps {
  weddingDate?: string;
  checklist?: any[];
  onChecklistChange?: () => void;
}

export default function TimelineTab({ weddingDate, checklist = [], onChecklistChange }: TimelineTabProps) {
  const parsedDate = weddingDate ? new Date(weddingDate) : new Date(Date.now() + 365 * 24 * 60 * 60 * 1000);
  const timeline = buildTimeline(parsedDate);
  const currentIdx = timeline.findIndex(m => m.status === 'in-progress');
  const [expandedId, setExpandedId] = useState<number | null>(timeline[currentIdx >= 0 ? currentIdx : 0]?.id ?? 1);
  const [togglingIdx, setTogglingIdx] = useState<number | null>(null);
  const [addTaskModal, setAddTaskModal] = useState<{ open: boolean; title: string; saving: boolean }>({ open: false, title: '', saving: false });

  const totalTasks = checklist.length;
  const completedTasks = checklist.filter((t: any) => t.completed).length;
  const overallProgress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  const findTaskIdx = (title: string) =>
    checklist.findIndex((t: any) => t.title?.toLowerCase().trim() === title.toLowerCase().trim());

  const handleToggleTask = async (taskTitle: string) => {
    const idx = findTaskIdx(taskTitle);
    if (idx === -1) return;
    setTogglingIdx(idx);
    try {
      await weddingService.toggleTask(idx);
      onChecklistChange?.();
    } catch { /* silent */ }
    finally { setTogglingIdx(null); }
  };

  const handleAddToChecklist = async () => {
    if (!addTaskModal.title.trim()) return;
    setAddTaskModal(s => ({ ...s, saving: true }));
    try {
      await weddingService.addTask({ title: addTaskModal.title.trim() });
      onChecklistChange?.();
      setAddTaskModal({ open: false, title: '', saving: false });
    } catch { /* silent */ }
    finally { setAddTaskModal(s => ({ ...s, saving: false })); }
  };

  return (
    <Box sx={{ maxWidth: 860, mx: 'auto', py: 4 }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 4 }}>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 800, color: COLORS.primary, fontFamily: 'Playfair Display' }}>
            Wedding Roadmap
          </Typography>
          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
            Your journey to the big day, step by step.
          </Typography>
        </Box>
        <Button variant="contained" startIcon={<Plus size={18} />}
          onClick={() => setAddTaskModal({ open: true, title: '', saving: false })}
          sx={{ bgcolor: COLORS.primary, borderRadius: 3, fontWeight: 700, textTransform: 'none', '&:hover': { bgcolor: '#6B1423' } }}>
          Add Task
        </Button>
      </Stack>

      {/* Overall progress */}
      <Card sx={{ borderRadius: 4, border: '1px solid', borderColor: 'divider', mb: 5 }}>
        <CardContent sx={{ p: 3 }}>
          <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>Overall Progress</Typography>
            <Typography variant="subtitle2" sx={{ fontWeight: 800, color: COLORS.primary }}>{completedTasks}/{totalTasks} tasks</Typography>
          </Stack>
          <LinearProgress variant="determinate" value={overallProgress}
            sx={{ height: 10, borderRadius: 5, bgcolor: `${COLORS.primary}15`, '& .MuiLinearProgress-bar': { bgcolor: COLORS.primary, borderRadius: 5 } }} />
          <Typography variant="caption" sx={{ color: 'text.secondary', mt: 0.5, display: 'block' }}>
            {overallProgress}% complete{totalTasks === 0 ? ' — add tasks from the checklist tab or use the + buttons below' : ''}
          </Typography>
        </CardContent>
      </Card>

      {/* Timeline milestones */}
      <Box sx={{ position: 'relative' }}>
        <Box sx={{ position: 'absolute', left: { xs: 20, sm: 40 }, top: 22, bottom: 22, width: 4, bgcolor: `${COLORS.secondary}25`, borderRadius: 2, zIndex: 0 }} />
        <Stack spacing={3}>
          {timeline.map((milestone, i) => {
            const isCompleted = milestone.status === 'completed';
            const isInProgress = milestone.status === 'in-progress';
            const isExpanded = expandedId === milestone.id;

            const milestoneItems = milestone.taskTemplates.map(t => ({
              title: t,
              idx: findTaskIdx(t),
              completed: findTaskIdx(t) >= 0 ? !!checklist[findTaskIdx(t)]?.completed : false,
              inChecklist: findTaskIdx(t) >= 0,
            }));
            const doneCount = milestoneItems.filter(t => t.completed).length;
            const addedCount = milestoneItems.filter(t => t.inChecklist).length;

            return (
              <MotionBox key={milestone.id} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.07, duration: 0.4 }}
                sx={{ position: 'relative', zIndex: 1, pl: { xs: 7, sm: 12 } }}>
                {/* Node */}
                <Box sx={{
                  position: 'absolute', left: { xs: 0, sm: 20 }, top: 0,
                  width: 44, height: 44, borderRadius: '50%',
                  bgcolor: isCompleted ? COLORS.success : isInProgress ? milestone.color : 'white',
                  border: '4px solid',
                  borderColor: isCompleted ? `${COLORS.success}30` : isInProgress ? `${milestone.color}30` : `${COLORS.secondary}30`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: isCompleted || isInProgress ? 'white' : milestone.color,
                  boxShadow: '0 4px 12px rgba(0,0,0,0.1)', transition: 'all 0.3s',
                }}>
                  {isCompleted ? <CheckCircle2 size={22} /> : milestone.icon}
                </Box>

                <Card onClick={() => setExpandedId(isExpanded ? null : milestone.id)}
                  sx={{
                    borderRadius: 5, border: '1.5px solid', cursor: 'pointer', transition: 'all 0.25s',
                    borderColor: isInProgress ? COLORS.secondary : isCompleted ? `${COLORS.success}30` : 'divider',
                    boxShadow: isInProgress ? '0 8px 24px rgba(201,168,76,0.12)' : 'none',
                    '&:hover': { borderColor: COLORS.secondary, bgcolor: `${COLORS.cream}40` },
                  }}>
                  <CardContent sx={{ p: 3 }}>
                    <Stack direction="row" justifyContent="space-between" alignItems="center">
                      <Box sx={{ flex: 1 }}>
                        <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 0.5 }}>
                          <Typography variant="caption" sx={{ fontWeight: 800, color: milestone.color, textTransform: 'uppercase', letterSpacing: 1 }}>
                            {milestone.timeframe}
                          </Typography>
                          {isInProgress && <Chip label="Now" size="small" sx={{ height: 18, fontSize: '0.6rem', fontWeight: 800, bgcolor: `${COLORS.secondary}20`, color: COLORS.secondary }} />}
                          {isCompleted && <Chip label="Done" size="small" sx={{ height: 18, fontSize: '0.6rem', fontWeight: 800, bgcolor: `${COLORS.success}15`, color: COLORS.success }} />}
                        </Stack>
                        <Typography variant="h6" sx={{ fontWeight: 800, color: COLORS.textPrimary, mb: 0.5 }}>{milestone.date}</Typography>
                        {addedCount > 0 && (
                          <Typography variant="caption" sx={{ color: doneCount === addedCount ? COLORS.success : 'text.secondary', fontWeight: 600 }}>
                            {doneCount}/{addedCount} tasks done
                          </Typography>
                        )}
                      </Box>
                      <Box sx={{ color: 'text.secondary' }}>
                        {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                      </Box>
                    </Stack>

                    <Collapse in={isExpanded}>
                      <Box sx={{ mt: 3, pt: 3, borderTop: '1px solid', borderColor: 'divider' }}>
                        <Typography variant="caption" sx={{ fontWeight: 700, color: 'text.secondary', mb: 2, display: 'block', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                          Suggested tasks for this phase
                        </Typography>
                        <Stack spacing={1.5}>
                          {milestoneItems.map((task, ti) => (
                            <Stack key={ti} direction="row" spacing={1.5} alignItems="center"
                              sx={{
                                p: 1.5, borderRadius: 3, border: '1px solid', transition: 'all 0.2s',
                                bgcolor: task.completed ? `${COLORS.success}08` : task.inChecklist ? `${COLORS.primary}05` : 'transparent',
                                borderColor: task.completed ? `${COLORS.success}20` : task.inChecklist ? `${COLORS.primary}15` : 'divider',
                              }}>
                              <Tooltip title={task.inChecklist ? (task.completed ? 'Mark incomplete' : 'Mark complete') : 'Not in your checklist yet'}>
                                <span>
                                  <IconButton size="small" disabled={!task.inChecklist || togglingIdx === task.idx}
                                    onClick={(e) => { e.stopPropagation(); handleToggleTask(task.title); }}
                                    sx={{ color: task.completed ? COLORS.success : task.inChecklist ? 'text.secondary' : 'text.disabled', p: 0.25 }}>
                                    {togglingIdx === task.idx
                                      ? <CircularProgress size={16} color="inherit" />
                                      : task.completed ? <CheckCircle2 size={20} /> : <Circle size={20} />}
                                  </IconButton>
                                </span>
                              </Tooltip>
                              <Typography variant="body2" sx={{ flex: 1, fontWeight: 500,
                                color: task.completed ? 'text.disabled' : 'text.primary',
                                textDecoration: task.completed ? 'line-through' : 'none' }}>
                                {task.title}
                              </Typography>
                              {!task.inChecklist && (
                                <Tooltip title="Add to checklist">
                                  <IconButton size="small" onClick={(e) => { e.stopPropagation(); setAddTaskModal({ open: true, title: task.title, saving: false }); }}
                                    sx={{ color: COLORS.primary, p: 0.25 }}>
                                    <Plus size={16} />
                                  </IconButton>
                                </Tooltip>
                              )}
                            </Stack>
                          ))}
                        </Stack>
                      </Box>
                    </Collapse>
                  </CardContent>
                </Card>
              </MotionBox>
            );
          })}
        </Stack>
      </Box>

      {/* Add Task Dialog */}
      <Dialog open={addTaskModal.open} onClose={() => !addTaskModal.saving && setAddTaskModal(s => ({ ...s, open: false }))} maxWidth="xs" fullWidth PaperProps={{ sx: { borderRadius: 4 } }}>
        <DialogTitle sx={{ fontWeight: 800, display: 'flex', alignItems: 'center', gap: 1 }}>
          <Plus size={20} color={COLORS.primary} /> Add to Checklist
        </DialogTitle>
        <DialogContent>
          <TextField fullWidth autoFocus label="Task title" value={addTaskModal.title}
            onChange={(e) => setAddTaskModal(s => ({ ...s, title: e.target.value }))}
            onKeyDown={(e) => e.key === 'Enter' && handleAddToChecklist()}
            sx={{ mt: 1 }} />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setAddTaskModal(s => ({ ...s, open: false }))} disabled={addTaskModal.saving}>Cancel</Button>
          <Button variant="contained" disabled={!addTaskModal.title.trim() || addTaskModal.saving}
            onClick={handleAddToChecklist}
            sx={{ bgcolor: COLORS.primary, '&:hover': { bgcolor: '#6B1423' } }}>
            {addTaskModal.saving ? <CircularProgress size={16} color="inherit" /> : 'Add Task'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

const MotionBox = motion(Box);
