import React, { useState } from 'react';
import { 
  Box, Typography, Stack, Button, IconButton, 
  Checkbox, Chip, LinearProgress, Card, CardContent,
  Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, MenuItem, Select, FormControl, InputLabel,
  useTheme, useMediaQuery, Tabs, Tab, Badge,
  Tooltip, Grid, CircularProgress
} from '@mui/material';
import { 
  Plus, Sparkles, Filter, MoreVertical, 
  Calendar, User, AlertCircle, CheckCircle2,
  Trash2, Edit3, GripVertical, Search
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
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

const CATEGORIES = [
  'Venue & Catering', 'Photography', 'Decorations', 
  'Attire', 'Invitations', 'Beauty', 'Logistics'
];

interface Task {
  id: string;
  title: string;
  category: string;
  assignedTo: string;
  due: string;
  status: 'completed' | 'pending' | 'overdue';
  apiIndex: number;
}

function buildTasks(checklist: any[]): Task[] {
  const now = new Date();
  return checklist.map((item: any, idx: number) => {
    let status: Task['status'] = item.completed ? 'completed' : 'pending';
    if (!item.completed && item.dueDate && new Date(item.dueDate) < now) {
      status = 'overdue';
    }
    return {
      id: `task-${idx}`,
      title: item.title,
      category: item.assignedTo ? 'Logistics' : 'Logistics',
      assignedTo: item.assignedTo || 'Both',
      due: item.dueDate ? new Date(item.dueDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '—',
      status,
      apiIndex: idx,
    };
  });
}

export default function ChecklistTab({ checklist: initialChecklist, onChecklistChange }: { checklist?: any[], onChecklistChange?: (updated: any[]) => void }) {
  const [tasks, setTasks] = useState<Task[]>(() => buildTasks(initialChecklist || []));
  const [filter, setFilter] = useState('All');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isAISuggesting, setIsAISuggesting] = useState(false);
  const [togglingIdx, setTogglingIdx] = useState<number | null>(null);
  const [newTask, setNewTask] = useState({ title: '', category: CATEGORIES[0], assignedTo: 'Both', due: '' });
  const [addingTask, setAddingTask] = useState(false);

  // Sync when parent passes fresh checklist
  React.useEffect(() => {
    setTasks(buildTasks(initialChecklist || []));
  }, [initialChecklist]);

  const filteredTasks = tasks.filter(task => {
    if (filter === 'All') return true;
    if (filter === 'Pending') return task.status === 'pending';
    if (filter === 'Completed') return task.status === 'completed';
    if (filter === 'Overdue') return task.status === 'overdue';
    return true;
  });

  const handleToggleTask = async (task: Task) => {
    setTogglingIdx(task.apiIndex);
    try {
      await weddingService.toggleTask(task.apiIndex);
      setTasks(prev => prev.map(t =>
        t.apiIndex === task.apiIndex
          ? { ...t, status: t.status === 'completed' ? 'pending' : 'completed' }
          : t
      ));
    } catch {
      // silently fail — optimistic update not applied
    } finally {
      setTogglingIdx(null);
    }
  };

  const handleDragEnd = (result: any) => {
    if (!result.destination) return;
    const items = Array.from(tasks);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);
    setTasks(items);
  };

  const handleAddTask = async () => {
    if (!newTask.title.trim()) return;
    setAddingTask(true);
    try {
      await weddingService.addTask({
        title: newTask.title.trim(),
        assignedTo: newTask.assignedTo,
        dueDate: newTask.due || undefined,
      });
      // Reload project to get fresh checklist with correct indexes
      const projectRes = await weddingService.getProject();
      const fresh = buildTasks(projectRes?.data?.checklist || []);
      setTasks(fresh);
      onChecklistChange?.(projectRes?.data?.checklist || []);
      setIsModalOpen(false);
      setNewTask({ title: '', category: CATEGORIES[0], assignedTo: 'Both', due: '' });
    } catch {
      // silent
    } finally {
      setAddingTask(false);
    }
  };

  const handleAISuggest = async () => {
    setIsAISuggesting(true);
    await new Promise(resolve => setTimeout(resolve, 1500));
    const aiSuggestions = [
      { title: 'Book Traditional Dancers', assignedTo: 'Both', dueDate: undefined },
      { title: 'Finalize Poruwa Decor', assignedTo: 'Partner', dueDate: undefined },
      { title: 'Confirm Mehendi Artist', assignedTo: 'You', dueDate: undefined },
    ];
    try {
      for (const s of aiSuggestions) {
        await weddingService.addTask(s);
      }
      const projectRes = await weddingService.getProject();
      setTasks(buildTasks(projectRes?.data?.checklist || []));
      onChecklistChange?.(projectRes?.data?.checklist || []);
    } catch { /* silent */ }
    setIsAISuggesting(false);
  };

  const progress = tasks.length > 0 ? Math.round((tasks.filter(t => t.status === 'completed').length / tasks.length) * 100) : 0;

  return (
    <Box>
      {/* Header & Progress */}
      <Card sx={{ borderRadius: 6, mb: 4, bgcolor: COLORS.primary, color: 'white' }}>
        <CardContent sx={{ p: 4 }}>
          <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems={{ xs: 'flex-start', sm: 'center' }} spacing={2} sx={{ mb: 3 }}>
            <Box>
              <Typography variant="h5" sx={{ fontWeight: 800, fontFamily: 'Playfair Display' }}>Wedding Checklist</Typography>
              <Typography variant="body2" sx={{ opacity: 0.8 }}>{tasks.filter(t => t.status === 'completed').length} of {tasks.length} tasks completed</Typography>
            </Box>
            <Stack direction="row" spacing={2}>
              <Button 
                variant="contained" 
                startIcon={isAISuggesting ? <Sparkles size={18} /> : <Sparkles size={18} />}
                onClick={handleAISuggest}
                disabled={isAISuggesting}
                sx={{ 
                  bgcolor: COLORS.secondary, 
                  color: COLORS.primary, 
                  fontWeight: 700, 
                  borderRadius: 3,
                  '&:hover': { bgcolor: '#B89740' }
                }}
              >
                {isAISuggesting ? 'AI Suggesting...' : 'AI Suggest Tasks'}
              </Button>
              <Button 
                variant="outlined" 
                startIcon={<Plus size={18} />}
                onClick={() => setIsModalOpen(true)}
                sx={{ color: 'white', borderColor: 'rgba(255,255,255,0.3)', borderRadius: 3, fontWeight: 700 }}
              >
                Add Task
              </Button>
            </Stack>
          </Stack>
          <Box sx={{ position: 'relative', pt: 1 }}>
            <LinearProgress 
              variant="determinate" 
              value={progress} 
              sx={{ 
                height: 10, 
                borderRadius: 5, 
                bgcolor: 'rgba(255,255,255,0.1)',
                '& .MuiLinearProgress-bar': { bgcolor: COLORS.secondary }
              }} 
            />
            <Typography variant="caption" sx={{ position: 'absolute', right: 0, top: -20, fontWeight: 700 }}>
              {progress}% Complete
            </Typography>
          </Box>
        </CardContent>
      </Card>

      {/* Filters */}
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ mb: 4 }} alignItems="center">
        <Tabs 
          value={filter} 
          onChange={(_, v) => setFilter(v)}
          sx={{ 
            bgcolor: 'white', 
            borderRadius: 4,
            p: 0.5, 
            border: '1px solid', 
            borderColor: 'divider',
            '& .MuiTabs-indicator': { display: 'none' },
            '& .MuiTab-root': { 
              minHeight: 36, 
              borderRadius: 3, 
              px: 3, 
              textTransform: 'none', 
              fontWeight: 700,
              '&.Mui-selected': { bgcolor: COLORS.primary, color: 'white' }
            }
          }}
        >
          <Tab value="All" label="All" />
          <Tab value="Pending" label="Pending" />
          <Tab value="Completed" label="Completed" />
          <Tab value="Overdue" label="Overdue" />
        </Tabs>
        <Box sx={{ flexGrow: 1 }} />
        <TextField 
          placeholder="Search tasks..." 
          size="small" 
          InputProps={{ startAdornment: <Search size={16} style={{ marginRight: 8, color: COLORS.textSecondary }} /> }}
          sx={{ bgcolor: 'white', borderRadius: 3, minWidth: 250 }}
        />
      </Stack>

      {tasks.length === 0 ? (
        <Box sx={{ py: 8, textAlign: 'center', color: 'text.secondary' }}>
          <CheckCircle2 size={48} opacity={0.3} style={{ margin: '0 auto 12px' }} />
          <Typography variant="body1" fontWeight={600}>No tasks yet</Typography>
          <Typography variant="body2">Add your first task or use AI Suggest to get started.</Typography>
        </Box>
      ) : (
      <DragDropContext onDragEnd={handleDragEnd}>
        <Droppable droppableId="checklist">
          {(provided) => (
            <Stack {...provided.droppableProps} ref={provided.innerRef} spacing={2}>
              {CATEGORIES.map(category => {
                const categoryTasks = filteredTasks.filter(t => t.category === category);
                if (categoryTasks.length === 0) return null;
                return (
                  <Box key={category} sx={{ mb: 2 }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 800, color: COLORS.primary, mb: 2, px: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: COLORS.secondary }} />
                      {category}
                    </Typography>
                    <Stack spacing={1.5}>
                      {categoryTasks.map((task, index) => (
                        <Draggable key={task.id} draggableId={task.id} index={index}>
                          {(provided, snapshot) => (
                            <MotionCard
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              sx={{ 
                                borderRadius: 4, 
                                border: '1px solid', 
                                borderColor: snapshot.isDragging ? COLORS.secondary : 'divider',
                                boxShadow: snapshot.isDragging ? '0 10px 30px rgba(0,0,0,0.1)' : 'none',
                                transition: 'all 0.2s ease',
                                bgcolor: task.status === 'completed' ? `${COLORS.cream}50` : 'white'
                              }}
                            >
                              <CardContent sx={{ p: '12px 16px !important', display: 'flex', alignItems: 'center', gap: 2 }}>
                                <Box {...provided.dragHandleProps} sx={{ color: 'text.disabled', cursor: 'grab' }}>
                                  <GripVertical size={20} />
                                </Box>
                                {togglingIdx === task.apiIndex ? (
                                  <CircularProgress size={20} sx={{ color: COLORS.primary }} />
                                ) : (
                                  <Checkbox 
                                    checked={task.status === 'completed'} 
                                    onChange={() => handleToggleTask(task)}
                                    sx={{ color: COLORS.primary, '&.Mui-checked': { color: COLORS.success } }}
                                  />
                                )}
                                <Box sx={{ flexGrow: 1 }}>
                                  <Typography 
                                    variant="body1" 
                                    sx={{ 
                                      fontWeight: 600, 
                                      color: task.status === 'completed' ? 'text.disabled' : 'text.primary',
                                      textDecoration: task.status === 'completed' ? 'line-through' : 'none',
                                      transition: 'all 0.3s ease'
                                    }}
                                  >
                                    {task.title}
                                  </Typography>
                                  <Stack direction="row" spacing={2} alignItems="center" sx={{ mt: 0.5 }}>
                                    <Typography variant="caption" sx={{ color: 'text.secondary', display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                      <User size={12} /> {task.assignedTo}
                                    </Typography>
                                    <Typography variant="caption" sx={{ color: task.status === 'overdue' ? COLORS.error : 'text.secondary', display: 'flex', alignItems: 'center', gap: 0.5, fontWeight: task.status === 'overdue' ? 700 : 400 }}>
                                      <Calendar size={12} /> {task.due}
                                    </Typography>
                                  </Stack>
                                </Box>
                                <Chip 
                                  label={task.status.toUpperCase()} 
                                  size="small" 
                                  sx={{ 
                                    fontWeight: 800, 
                                    fontSize: '0.65rem',
                                    bgcolor: task.status === 'completed' ? `${COLORS.success}15` : task.status === 'overdue' ? `${COLORS.error}15` : `${COLORS.warning}15`,
                                    color: task.status === 'completed' ? COLORS.success : task.status === 'overdue' ? COLORS.error : COLORS.warning,
                                    border: 'none'
                                  }} 
                                />
                              </CardContent>
                            </MotionCard>
                          )}
                        </Draggable>
                      ))}
                    </Stack>
                  </Box>
                );
              })}
              {/* Uncategorized / all tasks if no category matches */}
              {filteredTasks.filter(t => !CATEGORIES.includes(t.category)).map((task, index) => (
                <Draggable key={task.id} draggableId={task.id} index={index}>
                  {(provided, snapshot) => (
                    <MotionCard
                      ref={provided.innerRef}
                      {...provided.draggableProps}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      sx={{ borderRadius: 4, border: '1px solid', borderColor: snapshot.isDragging ? COLORS.secondary : 'divider', bgcolor: task.status === 'completed' ? `${COLORS.cream}50` : 'white' }}
                    >
                      <CardContent sx={{ p: '12px 16px !important', display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Box {...provided.dragHandleProps} sx={{ color: 'text.disabled', cursor: 'grab' }}><GripVertical size={20} /></Box>
                        {togglingIdx === task.apiIndex ? (
                          <CircularProgress size={20} sx={{ color: COLORS.primary }} />
                        ) : (
                          <Checkbox checked={task.status === 'completed'} onChange={() => handleToggleTask(task)} sx={{ color: COLORS.primary, '&.Mui-checked': { color: COLORS.success } }} />
                        )}
                        <Box sx={{ flexGrow: 1 }}>
                          <Typography variant="body1" sx={{ fontWeight: 600, color: task.status === 'completed' ? 'text.disabled' : 'text.primary', textDecoration: task.status === 'completed' ? 'line-through' : 'none' }}>
                            {task.title}
                          </Typography>
                          <Stack direction="row" spacing={2} alignItems="center" sx={{ mt: 0.5 }}>
                            <Typography variant="caption" sx={{ color: 'text.secondary', display: 'flex', alignItems: 'center', gap: 0.5 }}><User size={12} /> {task.assignedTo}</Typography>
                            <Typography variant="caption" sx={{ color: task.status === 'overdue' ? COLORS.error : 'text.secondary', display: 'flex', alignItems: 'center', gap: 0.5 }}><Calendar size={12} /> {task.due}</Typography>
                          </Stack>
                        </Box>
                        <Chip label={task.status.toUpperCase()} size="small" sx={{ fontWeight: 800, fontSize: '0.65rem', bgcolor: task.status === 'completed' ? `${COLORS.success}15` : `${COLORS.warning}15`, color: task.status === 'completed' ? COLORS.success : COLORS.warning, border: 'none' }} />
                      </CardContent>
                    </MotionCard>
                  )}
                </Draggable>
              ))}
              {provided.placeholder}
            </Stack>
          )}
        </Droppable>
      </DragDropContext>
      )}

      {/* Add Task Modal */}
      <Dialog open={isModalOpen} onClose={() => setIsModalOpen(false)} fullWidth maxWidth="sm" PaperProps={{ sx: { borderRadius: 6 } }}>
        <DialogTitle sx={{ fontWeight: 800, fontFamily: 'Playfair Display', color: COLORS.primary }}>Add New Task</DialogTitle>
        <DialogContent>
          <Stack spacing={3} sx={{ mt: 1 }}>
            <TextField fullWidth label="Task Name" placeholder="e.g. Book Florist" value={newTask.title} onChange={(e) => setNewTask(t => ({ ...t, title: e.target.value }))} />
            <Grid container spacing={2}>
              <Grid size={{ xs: 12, sm: 6 }}>
                <FormControl fullWidth>
                  <InputLabel>Category</InputLabel>
                  <Select label="Category" value={newTask.category} onChange={(e) => setNewTask(t => ({ ...t, category: e.target.value }))}>
                    {CATEGORIES.map(cat => <MenuItem key={cat} value={cat}>{cat}</MenuItem>)}
                  </Select>
                </FormControl>
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <FormControl fullWidth>
                  <InputLabel>Assigned To</InputLabel>
                  <Select label="Assigned To" value={newTask.assignedTo} onChange={(e) => setNewTask(t => ({ ...t, assignedTo: e.target.value }))}>
                    <MenuItem value="You">You</MenuItem>
                    <MenuItem value="Partner">Partner</MenuItem>
                    <MenuItem value="Both">Both</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
            </Grid>
            <TextField fullWidth type="date" label="Due Date" InputLabelProps={{ shrink: true }} value={newTask.due} onChange={(e) => setNewTask(t => ({ ...t, due: e.target.value }))} />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
          <Button onClick={() => setIsModalOpen(false)} disabled={addingTask} sx={{ color: 'text.secondary', fontWeight: 700 }}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleAddTask}
            disabled={addingTask || !newTask.title.trim()}
            startIcon={addingTask ? <CircularProgress size={14} color="inherit" /> : undefined}
            sx={{ bgcolor: COLORS.primary, borderRadius: 3, px: 4, fontWeight: 700 }}
          >
            {addingTask ? 'Adding...' : 'Add Task'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

const MotionCard = motion(Card);


