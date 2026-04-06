import React, { useState } from 'react';
import { 
  Box, Typography, Stack, Button, IconButton, 
  Checkbox, Chip, LinearProgress, Card, CardContent,
  Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, MenuItem, Select, FormControl, InputLabel,
  useTheme, useMediaQuery, Tabs, Tab, Badge,
  Tooltip, Grid
} from '@mui/material';
import { 
  Plus, Sparkles, Filter, MoreVertical, 
  Calendar, User, AlertCircle, CheckCircle2,
  Trash2, Edit3, GripVertical, Search
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';

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

const INITIAL_TASKS = [
  { id: '1', title: 'Book Galle Face Hotel', category: 'Venue & Catering', assignedTo: 'Shanuka', due: '2025-05-15', status: 'completed' },
  { id: '2', title: 'Finalize Menu with Chef', category: 'Venue & Catering', assignedTo: 'Kavindi', due: '2025-06-20', status: 'pending' },
  { id: '3', title: 'Hire Wedding Photographer', category: 'Photography', assignedTo: 'Shanuka', due: '2025-05-30', status: 'completed' },
  { id: '4', title: 'Engagement Shoot', category: 'Photography', assignedTo: 'Both', due: '2025-07-10', status: 'pending' },
  { id: '5', title: 'Order Saree & Suit', category: 'Attire', assignedTo: 'Kavindi', due: '2025-06-01', status: 'pending' },
  { id: '6', title: 'Send Save the Dates', category: 'Invitations', assignedTo: 'Both', due: '2025-04-15', status: 'overdue' },
];

export default function ChecklistTab() {
  const [tasks, setTasks] = useState(INITIAL_TASKS);
  const [filter, setFilter] = useState('All');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isAISuggesting, setIsAISuggesting] = useState(false);

  const filteredTasks = tasks.filter(task => {
    if (filter === 'All') return true;
    if (filter === 'Pending') return task.status === 'pending';
    if (filter === 'Completed') return task.status === 'completed';
    if (filter === 'Overdue') return task.status === 'overdue';
    return true;
  });

  const handleToggleTask = (id: string) => {
    setTasks(prev => prev.map(task => 
      task.id === id 
        ? { ...task, status: task.status === 'completed' ? 'pending' : 'completed' } 
        : task
    ));
  };

  const handleDragEnd = (result: any) => {
    if (!result.destination) return;
    const items = Array.from(tasks);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);
    setTasks(items);
  };

  const handleAISuggest = async () => {
    setIsAISuggesting(true);
    // Simulating API call to /api/v1/wedding/ai-checklist
    await new Promise(resolve => setTimeout(resolve, 2000));
    const aiTasks = [
      { id: Date.now().toString(), title: 'Book Traditional Dancers', category: 'Logistics', assignedTo: 'Both', due: '2025-08-15', status: 'pending' },
      { id: (Date.now() + 1).toString(), title: 'Finalize Poruwa Decor', category: 'Decorations', assignedTo: 'Kavindi', due: '2025-09-01', status: 'pending' },
    ];
    setTasks(prev => [...prev, ...aiTasks]);
    setIsAISuggesting(false);
  };

  const progress = Math.round((tasks.filter(t => t.status === 'completed').length / tasks.length) * 100);

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
                startIcon={isAISuggesting ? <Sparkles size={18} className="animate-pulse" /> : <Sparkles size={18} />}
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

      {/* Task List with DnD */}
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
                                <Checkbox 
                                  checked={task.status === 'completed'} 
                                  onChange={() => handleToggleTask(task.id)}
                                  sx={{ color: COLORS.primary, '&.Mui-checked': { color: COLORS.success } }}
                                />
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
                                <IconButton size="small">
                                  <MoreVertical size={18} />
                                </IconButton>
                              </CardContent>
                            </MotionCard>
                          )}
                        </Draggable>
                      ))}
                    </Stack>
                  </Box>
                );
              })}
              {provided.placeholder}
            </Stack>
          )}
        </Droppable>
      </DragDropContext>

      {/* Add Task Modal */}
      <Dialog open={isModalOpen} onClose={() => setIsModalOpen(false)} fullWidth maxWidth="sm" PaperProps={{ sx: { borderRadius: 6 } }}>
        <DialogTitle sx={{ fontWeight: 800, fontFamily: 'Playfair Display', color: COLORS.primary }}>Add New Task</DialogTitle>
        <DialogContent>
          <Stack spacing={3} sx={{ mt: 1 }}>
            <TextField fullWidth label="Task Name" placeholder="e.g. Book Florist" />
            <Grid container spacing={2}>
              <Grid size={{ xs: 12, sm: 6 }}>
                <FormControl fullWidth>
                  <InputLabel>Category</InputLabel>
                  <Select label="Category">
                    {CATEGORIES.map(cat => <MenuItem key={cat} value={cat}>{cat}</MenuItem>)}
                  </Select>
                </FormControl>
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <FormControl fullWidth>
                  <InputLabel>Assigned To</InputLabel>
                  <Select label="Assigned To">
                    <MenuItem value="Shanuka">Shanuka</MenuItem>
                    <MenuItem value="Kavindi">Kavindi</MenuItem>
                    <MenuItem value="Both">Both</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
            </Grid>
            <TextField fullWidth type="date" label="Due Date" InputLabelProps={{ shrink: true }} />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
          <Button onClick={() => setIsModalOpen(false)} sx={{ color: 'text.secondary', fontWeight: 700 }}>Cancel</Button>
          <Button variant="contained" sx={{ bgcolor: COLORS.primary, borderRadius: 3, px: 4, fontWeight: 700 }}>Add Task</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

const MotionCard = motion(Card);

