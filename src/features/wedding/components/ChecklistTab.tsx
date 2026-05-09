import React, { useMemo, useState } from 'react';
import {
  Box,
  Typography,
  Stack,
  Button,
  IconButton,
  Checkbox,
  Chip,
  LinearProgress,
  Card,
  CardContent,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Tabs,
  Tab,
  Tooltip,
  Grid,
  CircularProgress,
  Alert,
} from '@mui/material';
import {
  Plus,
  Sparkles,
  CheckCircle2,
  Trash2,
  Edit3,
  GripVertical,
  Search,
  Calendar,
  User,
  Square,
  CheckSquare,
} from 'lucide-react';
import { motion } from 'motion/react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import weddingService from '../services/weddingService';
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
  warning: '#ED6C02',
};

const CATEGORIES = [
  'Venue & Catering',
  'Photography',
  'Decorations',
  'Attire',
  'Invitations',
  'Beauty',
  'Logistics',
];

interface Task {
  id: string;
  title: string;
  category: string;
  assignedTo: string;
  rawAssignedTo: string;
  due: string;
  status: 'completed' | 'pending' | 'overdue';
  apiIndex: number;
}

interface ChecklistTabProps {
  checklist?: any[];
  onChecklistChange?: (updated: any[]) => void;
  readOnly?: boolean;
  currentUserId?: string;
  partnerId?: string;
  project?: any;
  budget?: any;
  couple?: any;
  setGlobalLoading?: (state: { open: boolean; message: string }) => void;
}

function safeJsonArrayFromText(text: string): any[] {
  const raw = String(text || '').trim();
  if (!raw) return [];

  const fenced = raw.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const candidate = fenced?.[1] || raw;

  const firstBracket = candidate.indexOf('[');
  const lastBracket = candidate.lastIndexOf(']');
  const jsonSlice = firstBracket >= 0 && lastBracket > firstBracket ? candidate.slice(firstBracket, lastBracket + 1) : candidate;

  try {
    const parsed = JSON.parse(jsonSlice);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function normalizeAssignedTo(value: any, currentUserId?: string, partnerId?: string) {
  const normalized = String(value || 'both').trim().toLowerCase();
  if ((normalized === 'you' || normalized === 'self' || normalized === 'me') && currentUserId) {
    return currentUserId;
  }
  if ((normalized === 'partner' || normalized === 'spouse') && partnerId) {
    return partnerId;
  }
  return 'Both';
}

function inferCategory(item: any) {
  if (item?.category) return item.category;
  const title = String(item?.title || '').toLowerCase();
  if (title.includes('venue') || title.includes('cater')) return 'Venue & Catering';
  if (title.includes('photo') || title.includes('video')) return 'Photography';
  if (title.includes('decor') || title.includes('flor')) return 'Decorations';
  if (title.includes('dress') || title.includes('attire') || title.includes('suit')) return 'Attire';
  if (title.includes('invite')) return 'Invitations';
  if (title.includes('beauty') || title.includes('makeup') || title.includes('mehendi')) return 'Beauty';
  return 'Logistics';
}

function buildTasks(checklist: any[], currentUserId?: string, partnerId?: string): Task[] {
  const now = new Date();
  return checklist.map((item: any, idx: number) => {
    let status: Task['status'] = item.completed ? 'completed' : 'pending';
    if (!item.completed && item.dueDate && new Date(item.dueDate) < now) {
      status = 'overdue';
    }

    let displayAssignedTo = item.assignedTo || 'Both';
    if (currentUserId && String(item.assignedTo) === String(currentUserId)) displayAssignedTo = 'You';
    else if (partnerId && String(item.assignedTo) === String(partnerId)) displayAssignedTo = 'Partner';

    return {
      id: `task-${idx}`,
      title: item.title,
      category: inferCategory(item),
      assignedTo: displayAssignedTo,
      rawAssignedTo: item.assignedTo || 'Both',
      due: item.dueDate
        ? new Date(item.dueDate).toLocaleDateString('en-GB', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
          })
        : '-',
      status,
      apiIndex: idx,
    };
  });
}

const EMPTY_TASK = {
  title: '',
  category: CATEGORIES[0],
  assignedTo: 'Both',
  due: '',
};

const MotionCard = motion(Card);

export default function ChecklistTab({ checklist: initialChecklist, onChecklistChange, readOnly, currentUserId, partnerId, project, budget, couple, setGlobalLoading }: ChecklistTabProps) {
  const [checklist, setChecklist] = useState<any[]>(() => initialChecklist || []);
  const [tasks, setTasks] = useState<Task[]>(() => buildTasks(initialChecklist || [], currentUserId, partnerId));
  const [filter, setFilter] = useState('All');
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [isAISuggesting, setIsAISuggesting] = useState(false);
  const [aiSuggestError, setAiSuggestError] = useState('');
  const [togglingIdx, setTogglingIdx] = useState<number | null>(null);
  const [deletingIdx, setDeletingIdx] = useState<number | null>(null);
  const [editingTaskIndex, setEditingTaskIndex] = useState<number | null>(null);
  const [taskForm, setTaskForm] = useState(EMPTY_TASK);
  const [addingTask, setAddingTask] = useState(false);
  const [savingEdit, setSavingEdit] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<Task | null>(null);
  const [clearAllConfirm, setClearAllConfirm] = useState(false);
  const [selectedIndices, setSelectedIndices] = useState<number[]>([]);
  const [isBulkActionLoading, setIsBulkActionLoading] = useState(false);

  React.useEffect(() => {
    const nextChecklist = initialChecklist || [];
    setChecklist(nextChecklist);
    setTasks(buildTasks(nextChecklist, currentUserId, partnerId));
  }, [initialChecklist, currentUserId, partnerId]);

  const applyChecklist = (updatedChecklist: any[]) => {
    setChecklist(updatedChecklist);
    setTasks(buildTasks(updatedChecklist, currentUserId, partnerId));
    onChecklistChange?.(updatedChecklist);
  };

  const refreshChecklistFromServer = async () => {
    const project = await weddingService.getProject();
    const fresh = project?.data?.checklist || [];
    applyChecklist(fresh);
  };

  const filteredTasks = useMemo(() => {
    return tasks
      .filter((task) => {
        if (filter === 'All') return true;
        if (filter === 'Pending') return task.status === 'pending';
        if (filter === 'Completed') return task.status === 'completed';
        if (filter === 'Overdue') return task.status === 'overdue';
        return true;
      })
      .filter((task) => {
        if (!search.trim()) return true;
        return task.title.toLowerCase().includes(search.trim().toLowerCase());
      });
  }, [filter, search, tasks]);

  const handleToggleTask = async (task: Task) => {
    if (readOnly) return;
    setTogglingIdx(task.apiIndex);
    const previousChecklist = [...checklist];
    const updatedChecklist = checklist.map((item, idx) =>
      idx === task.apiIndex ? { ...item, completed: !item.completed } : item
    );
    applyChecklist(updatedChecklist);
    try {
      await weddingService.toggleTask(task.apiIndex);
    } catch {
      applyChecklist(previousChecklist);
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

  const resetTaskForm = () => {
    setTaskForm(EMPTY_TASK);
    setEditingTaskIndex(null);
  };

  const handleAddTask = async () => {
    if (!taskForm.title.trim()) return;
    setAddingTask(true);
    if (setGlobalLoading) setGlobalLoading({ open: true, message: 'Adding Task...' });
    try {
      await weddingService.addTask({
        title: taskForm.title.trim(),
        category: taskForm.category,
        assignedTo: taskForm.assignedTo,
        dueDate: taskForm.due || undefined,
      });
      await refreshChecklistFromServer();
      setIsModalOpen(false);
      resetTaskForm();
    } catch {
      // silent
    } finally {
      setAddingTask(false);
      if (setGlobalLoading) setGlobalLoading({ open: false, message: '' });
    }
  };

  const handleAISuggest = async () => {
    setAiSuggestError('');
    setIsAISuggesting(true);

    try {
      const expenseList = Array.isArray(budget?.expenses)
        ? budget.expenses
        : Array.isArray(project?.expenses)
          ? project.expenses
          : [];
      const spentByCategory = expenseList.reduce((acc: Record<string, number>, item: any) => {
        if (!item) return acc;
        const cat = String(item.category || 'Others');
        acc[cat] = (acc[cat] || 0) + Number(item.amount || 0);
        return acc;
      }, {});

      const checklistSnapshot = (Array.isArray(checklist) ? checklist : [])
        .slice(0, 20)
        .map((item: any) => ({
          title: item?.title,
          completed: Boolean(item?.completed),
          dueDate: item?.dueDate || null,
          assignedTo: item?.assignedTo || 'Both',
          category: inferCategory(item),
        }));

      const context = {
        weddingDate: project?.weddingDate || couple?.date || null,
        venue: typeof project?.venueId === 'object'
          ? (project?.venueId?.businessName || project?.venueId?.name || null)
          : project?.venueId || couple?.venue || null,
        totalBudget: Number(budget?.totalBudget || project?.totalBudget || 0),
        totalSpent: Number(budget?.totalSpent || 0),
        spentByCategory,
        checklist: checklistSnapshot,
        couple: {
          partner1: couple?.partner1 || 'You',
          partner2: couple?.partner2 || 'Partner',
        },
      };

      const response = await chatService.sendAssistantMessage({
        message:
          'Generate exactly 3 high-impact wedding checklist tasks based on the provided context. Consider wedding date urgency, venue status, budget pressure, and current checklist gaps. Return ONLY a JSON array, no markdown. Each item must include: title (string), category (one of ' +
          CATEGORIES.join(', ') +
          "), assignedTo ('you'|'partner'|'both'), dueDate (YYYY-MM-DD or null). Context: " +
          JSON.stringify(context),
        language: 'en',
        history: [],
      });

      const parsed = safeJsonArrayFromText(response?.data?.reply || '');
      const existingTitles = new Set((checklist || []).map((item: any) => String(item?.title || '').trim().toLowerCase()));
      const deduped = parsed
        .filter((item: any) => item && typeof item.title === 'string' && item.title.trim())
        .filter((item: any) => !existingTitles.has(String(item.title).trim().toLowerCase()))
        .slice(0, 3)
        .map((item: any) => ({
          title: String(item.title).trim(),
          category: CATEGORIES.includes(String(item.category || '').trim()) ? String(item.category).trim() : 'Logistics',
          assignedTo: normalizeAssignedTo(item.assignedTo, currentUserId, partnerId),
          dueDate: item.dueDate && /^\d{4}-\d{2}-\d{2}$/.test(String(item.dueDate)) ? String(item.dueDate) : undefined,
        }));

      if (deduped.length === 0) {
        setAiSuggestError('AI did not return usable new tasks. Please try again after updating wedding details.');
        return;
      }

      for (const suggestion of deduped) {
        await weddingService.addTask(suggestion);
      }
      await refreshChecklistFromServer();
    } catch {
      setAiSuggestError('Failed to fetch AI suggestions. Please try again.');
    } finally {
      setIsAISuggesting(false);
    }
  };

  const openEditTask = (task: Task) => {
    const sourceItem = checklist[task.apiIndex];
    setEditingTaskIndex(task.apiIndex);
    setTaskForm({
      title: task.title,
      category: task.category,
      assignedTo: task.rawAssignedTo,
      due: sourceItem?.dueDate ? new Date(sourceItem.dueDate).toISOString().split('T')[0] : '',
    });
    setEditModalOpen(true);
  };

  const handleEditTask = async () => {
    if (editingTaskIndex === null || !taskForm.title.trim()) return;
    setSavingEdit(true);
    if (setGlobalLoading) setGlobalLoading({ open: true, message: 'Saving Changes...' });
    const previousChecklist = [...checklist];
    const updatedChecklist = checklist.map((item, idx) =>
      idx === editingTaskIndex
        ? {
            ...item,
            title: taskForm.title.trim(),
            category: taskForm.category,
            assignedTo: taskForm.assignedTo,
            dueDate: taskForm.due || undefined,
          }
        : item
    );
    applyChecklist(updatedChecklist);

    try {
      await weddingService.updateTask(editingTaskIndex, {
        title: taskForm.title.trim(),
        category: taskForm.category,
        assignedTo: taskForm.assignedTo,
        dueDate: taskForm.due || undefined,
      });
      await refreshChecklistFromServer();
      setEditModalOpen(false);
      resetTaskForm();
    } catch {
      applyChecklist(previousChecklist);
    } finally {
      setSavingEdit(false);
      if (setGlobalLoading) setGlobalLoading({ open: false, message: '' });
    }
  };

  const handleDeleteTask = async (task: Task, confirmed = false) => {
    if (!confirmed) { setDeleteConfirm(task); return; }
    setDeleteConfirm(null);
    setDeletingIdx(task.apiIndex);
    if (setGlobalLoading) setGlobalLoading({ open: true, message: 'Deleting Task...' });
    const previousChecklist = [...checklist];
    const updatedChecklist = checklist.filter((_, idx) => idx !== task.apiIndex);
    applyChecklist(updatedChecklist);
    try {
      await weddingService.deleteTask(task.apiIndex);
      await refreshChecklistFromServer();
    } catch {
      applyChecklist(previousChecklist);
    } finally {
      setDeletingIdx(null);
      if (setGlobalLoading) setGlobalLoading({ open: false, message: '' });
    }
  };

  const handleClearAll = async () => {
    if (readOnly) return;
    setIsBulkActionLoading(true);
    try {
      await weddingService.clearAllTasks();
      applyChecklist([]);
      setClearAllConfirm(false);
      setSelectedIndices([]); // reset selection
    } catch {
      // silent
    } finally {
      setIsBulkActionLoading(false);
    }
  };

  const handleDeleteSelected = async () => {
    if (readOnly || selectedIndices.length === 0) return;
    setIsBulkActionLoading(true);
    const previousChecklist = [...checklist];
    const updatedChecklist = checklist.filter((_, idx) => !selectedIndices.includes(idx));
    applyChecklist(updatedChecklist);
    try {
      await weddingService.deleteMultipleTasks(selectedIndices);
      setSelectedIndices([]);
    } catch {
      applyChecklist(previousChecklist);
    } finally {
      setIsBulkActionLoading(false);
    }
  };

  const toggleSelect = (apiIndex: number) => {
    setSelectedIndices(prev => 
      prev.includes(apiIndex) ? prev.filter(i => i !== apiIndex) : [...prev, apiIndex]
    );
  };

  const confirmDelete = () => {
    if (deleteConfirm) handleDeleteTask(deleteConfirm, true);
  };

  const progress = tasks.length > 0
    ? Math.round((tasks.filter((t) => t.status === 'completed').length / tasks.length) * 100)
    : 0;

  return (
    <Box>
      <Card sx={{ borderRadius: 6, mb: 4, bgcolor: COLORS.primary, color: 'white' }}>
        <CardContent sx={{ p: 4 }}>
          <Stack
            direction={{ xs: 'column', sm: 'row' }}
            justifyContent="space-between"
            alignItems={{ xs: 'flex-start', sm: 'center' }}
            spacing={2}
            sx={{ mb: 3 }}
          >
            <Box>
              <Typography variant="h5" sx={{ fontWeight: 800, fontFamily: 'Playfair Display' }}>
                Wedding Checklist
              </Typography>
              <Typography variant="body2" sx={{ opacity: 0.8 }}>
                {tasks.filter((t) => t.status === 'completed').length} of {tasks.length} tasks completed
              </Typography>
            </Box>
              <Stack direction="row" spacing={1.5}>
                {!readOnly && tasks.length > 0 && (
                  <Button
                    variant="outlined"
                    startIcon={<Trash2 size={18} />}
                    onClick={() => setClearAllConfirm(true)}
                    sx={{
                      color: 'white',
                      borderColor: 'rgba(255,255,255,0.3)',
                      borderRadius: 3,
                      fontWeight: 700,
                      textTransform: 'none',
                      '&:hover': { bgcolor: 'rgba(255,255,255,0.1)', borderColor: 'white' },
                    }}
                  >
                    Clear All
                  </Button>
                )}
                <Button
                  variant="contained"
                  startIcon={<Sparkles size={18} />}
                  onClick={handleAISuggest}
                  disabled={isAISuggesting || readOnly}
                  sx={{
                    bgcolor: COLORS.secondary,
                    color: COLORS.primary,
                    fontWeight: 700,
                    borderRadius: 3,
                    textTransform: 'none',
                    '&:hover': { bgcolor: '#B89740' },
                  }}
                >
                  {isAISuggesting ? 'Suggesting...' : 'AI Suggest'}
                </Button>
                <Button
                  variant="contained"
                  startIcon={<Plus size={18} />}
                  onClick={() => !readOnly && setIsModalOpen(true)}
                  disabled={readOnly}
                  sx={{
                    bgcolor: 'white',
                    color: COLORS.primary,
                    borderRadius: 3,
                    fontWeight: 700,
                    textTransform: 'none',
                    '&:hover': { bgcolor: '#f0f0f0' },
                  }}
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
                '& .MuiLinearProgress-bar': { bgcolor: COLORS.secondary },
              }}
            />
            <Typography variant="caption" sx={{ position: 'absolute', right: 0, top: -20, fontWeight: 700 }}>
              {progress}% Complete
            </Typography>
          </Box>
        </CardContent>
      </Card>

      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ mb: 4 }} alignItems="center">
        <Tabs
          value={filter}
          onChange={(_, value) => setFilter(value)}
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
              '&.Mui-selected': { bgcolor: COLORS.primary, color: 'white' },
            },
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
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          size="small"
          InputProps={{
            startAdornment: <Search size={16} style={{ marginRight: 8, color: COLORS.textSecondary }} />,
          }}
          sx={{ bgcolor: 'white', borderRadius: 3, minWidth: 250 }}
        />
      </Stack>

      {aiSuggestError && (
        <Alert severity="warning" sx={{ mb: 3, borderRadius: 3 }}>
          {aiSuggestError}
        </Alert>
      )}

      {selectedIndices.length > 0 && (
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
          <Alert 
            severity="warning" 
            sx={{ mb: 3, borderRadius: 4, display: 'flex', alignItems: 'center' }}
            action={
              <Button 
                color="error" 
                variant="contained" 
                size="small" 
                onClick={handleDeleteSelected}
                disabled={isBulkActionLoading}
                startIcon={isBulkActionLoading ? <CircularProgress size={14} color="inherit" /> : <Trash2 size={14} />}
                sx={{ borderRadius: 2, fontWeight: 800, textTransform: 'none' }}
              >
                Delete Selected ({selectedIndices.length})
              </Button>
            }
          >
            Bulk Actions: You have selected {selectedIndices.length} tasks.
          </Alert>
        </motion.div>
      )}

      <Box sx={{ minHeight: 600 }}>
      {tasks.length === 0 ? (
        <Box sx={{ py: 8, textAlign: 'center', color: 'text.secondary' }}>
          <CheckCircle2 size={48} opacity={0.3} style={{ margin: '0 auto 12px' }} />
          <Typography variant="body1" fontWeight={600}>No tasks yet</Typography>
          <Typography variant="body2">Add your first task or use AI Suggest to get started.</Typography>
        </Box>
      ) : filteredTasks.length === 0 ? (
        <Box sx={{ py: 12, textAlign: 'center', color: 'text.secondary' }}>
          <Search size={48} opacity={0.3} style={{ margin: '0 auto 12px' }} />
          <Typography variant="body1" fontWeight={600}>No matches found</Typography>
          <Typography variant="body2">Try a different filter or search term.</Typography>
        </Box>
      ) : (
        <DragDropContext onDragEnd={handleDragEnd}>
          <Droppable droppableId="checklist">
            {(provided) => (
              <Stack {...provided.droppableProps} ref={provided.innerRef} spacing={2}>
                {CATEGORIES.map((category) => {
                  const categoryTasks = filteredTasks.filter((t) => t.category === category);
                  if (categoryTasks.length === 0) return null;

                  return (
                    <Box key={category} sx={{ mb: 2 }}>
                      <Typography
                        variant="subtitle2"
                        sx={{
                          fontWeight: 800,
                          color: COLORS.primary,
                          mb: 2,
                          px: 1,
                          display: 'flex',
                          alignItems: 'center',
                          gap: 1,
                        }}
                      >
                        <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: COLORS.secondary }} />
                        {category}
                      </Typography>

                      <Stack spacing={1.5}>
                        {categoryTasks.map((task, index) => (
                          <Draggable key={task.id} draggableId={task.id} index={index}>
                            {(dragProvided, snapshot) => (
                              <MotionCard
                                ref={dragProvided.innerRef}
                                {...dragProvided.draggableProps}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                sx={{
                                  borderRadius: 4,
                                  border: '1px solid',
                                  borderColor: snapshot.isDragging ? COLORS.secondary : 'divider',
                                  boxShadow: snapshot.isDragging ? '0 10px 30px rgba(0,0,0,0.1)' : 'none',
                                  transition: 'all 0.2s ease',
                                  bgcolor: task.status === 'completed' ? `${COLORS.cream}50` : 'white',
                                }}
                              >
                                <CardContent sx={{ p: '12px 16px !important', display: 'flex', alignItems: 'center', gap: 2 }}>
                                  <Box {...dragProvided.dragHandleProps} sx={{ color: 'text.disabled', cursor: 'grab' }}>
                                    <GripVertical size={20} />
                                  </Box>

                                    {!readOnly && (
                                      <Tooltip title="Select for bulk action">
                                        <Checkbox 
                                          size="small"
                                          checked={selectedIndices.includes(task.apiIndex)}
                                          onChange={() => toggleSelect(task.apiIndex)}
                                          icon={<Square size={18} />}
                                          checkedIcon={<CheckSquare size={18} />}
                                          sx={{ mr: 1, color: 'text.disabled', '&.Mui-checked': { color: COLORS.error } }}
                                        />
                                      </Tooltip>
                                    )}
                                    {togglingIdx === task.apiIndex ? (
                                      <CircularProgress size={20} sx={{ mx: 1.5, color: COLORS.primary }} />
                                    ) : (
                                      <Tooltip title={task.status === 'completed' ? "Mark as pending" : "Mark as completed"}>
                                        <IconButton
                                          onClick={() => handleToggleTask(task)}
                                          disabled={readOnly}
                                          sx={{ 
                                            p: 1,
                                            color: task.status === 'completed' ? COLORS.success : 'text.disabled',
                                            '&:hover': { bgcolor: `${COLORS.success}10` }
                                          }}
                                        >
                                          <CheckCircle2 size={24} fill={task.status === 'completed' ? COLORS.success : 'transparent'} />
                                        </IconButton>
                                      </Tooltip>
                                    )}

                                  <Box sx={{ flexGrow: 1 }}>
                                    <Typography
                                      variant="body1"
                                      sx={{
                                        fontWeight: 600,
                                        color: task.status === 'completed' ? 'text.disabled' : 'text.primary',
                                        textDecoration: task.status === 'completed' ? 'line-through' : 'none',
                                        transition: 'all 0.3s ease',
                                      }}
                                    >
                                      {task.title}
                                    </Typography>

                                    <Stack direction="row" spacing={2} alignItems="center" sx={{ mt: 0.5 }}>
                                      <Typography variant="caption" sx={{ color: 'text.secondary', display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                        <User size={12} /> {task.assignedTo}
                                      </Typography>
                                      <Typography
                                        variant="caption"
                                        sx={{
                                          color: task.status === 'overdue' ? COLORS.error : 'text.secondary',
                                          display: 'flex',
                                          alignItems: 'center',
                                          gap: 0.5,
                                          fontWeight: task.status === 'overdue' ? 700 : 400,
                                        }}
                                      >
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
                                      bgcolor:
                                        task.status === 'completed'
                                          ? `${COLORS.success}15`
                                          : task.status === 'overdue'
                                            ? `${COLORS.error}15`
                                            : `${COLORS.warning}15`,
                                      color:
                                        task.status === 'completed'
                                          ? COLORS.success
                                          : task.status === 'overdue'
                                            ? COLORS.error
                                            : COLORS.warning,
                                      border: 'none',
                                    }}
                                  />

                                  <Stack direction="row" spacing={0.5}>
                                    <Tooltip title={readOnly ? "Locked" : "Edit task"}>
                                      <span>
                                        <IconButton
                                          size="small"
                                          disabled={savingEdit || deletingIdx === task.apiIndex || readOnly}
                                          onClick={() => openEditTask(task)}
                                          sx={{ color: COLORS.primary }}
                                        >
                                          <Edit3 size={15} />
                                        </IconButton>
                                      </span>
                                    </Tooltip>
                                    <Tooltip title={readOnly ? "Locked" : "Delete task"}>
                                      <span>
                                        <IconButton
                                          size="small"
                                          disabled={deletingIdx === task.apiIndex || readOnly}
                                          onClick={() => setDeleteConfirm(task)}
                                          sx={{ color: COLORS.error }}
                                        >
                                          {deletingIdx === task.apiIndex ? (
                                            <CircularProgress size={14} color="inherit" />
                                          ) : (
                                            <Trash2 size={15} />
                                          )}
                                        </IconButton>
                                      </span>
                                    </Tooltip>
                                  </Stack>
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
      )}
      </Box>

      {/* Clear All Confirmation Dialog */}
      <Dialog open={clearAllConfirm} onClose={() => !isBulkActionLoading && setClearAllConfirm(false)} maxWidth="xs" fullWidth PaperProps={{ sx: { borderRadius: 4 } }}>
        <DialogTitle sx={{ fontWeight: 800, color: COLORS.error }}>Clear Checklist?</DialogTitle>
        <DialogContent>
          <Typography variant="body2">
            This will permanently delete <strong>all tasks</strong> in your checklist. This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setClearAllConfirm(false)} disabled={isBulkActionLoading}>Cancel</Button>
          <Button variant="contained" color="error" disabled={isBulkActionLoading}
            onClick={handleClearAll}
            startIcon={isBulkActionLoading ? <CircularProgress size={14} color="inherit" /> : undefined}
            sx={{ borderRadius: 3, fontWeight: 700 }}>
            Clear Everything
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!deleteConfirm} onClose={() => deletingIdx === null && setDeleteConfirm(null)} maxWidth="xs" fullWidth PaperProps={{ sx: { borderRadius: 4 } }}>
        <DialogTitle sx={{ fontWeight: 800, color: COLORS.error }}>Delete Task?</DialogTitle>
        <DialogContent>
          <Typography variant="body2">
            Are you sure you want to delete <strong>"{deleteConfirm?.title}"</strong>? This cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setDeleteConfirm(null)} disabled={deletingIdx !== null}>Cancel</Button>
          <Button variant="contained" color="error" onClick={confirmDelete} disabled={deletingIdx !== null}
            startIcon={deletingIdx !== null ? <CircularProgress size={14} color="inherit" /> : undefined}
            sx={{ borderRadius: 3, fontWeight: 700, minWidth: 108, minHeight: 36 }}>
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={isModalOpen}
        onClose={() => !addingTask && setIsModalOpen(false)}
        fullWidth
        maxWidth="sm"
        PaperProps={{ sx: { borderRadius: 6 } }}
      >
        <DialogTitle sx={{ fontWeight: 800, fontFamily: 'Playfair Display', color: COLORS.primary }}>
          Add New Task
        </DialogTitle>
        <DialogContent>
          <Stack spacing={3} sx={{ mt: 1 }}>
            <TextField
              fullWidth
              label="Task Name"
              placeholder="e.g. Book Florist"
              value={taskForm.title}
              onChange={(e) => setTaskForm((t) => ({ ...t, title: e.target.value }))}
            />
            <Grid container spacing={2}>
              <Grid size={{ xs: 12, sm: 6 }}>
                <FormControl fullWidth>
                  <InputLabel>Category</InputLabel>
                  <Select
                    label="Category"
                    value={taskForm.category}
                    onChange={(e) => setTaskForm((t) => ({ ...t, category: e.target.value }))}
                  >
                    {CATEGORIES.map((cat) => (
                      <MenuItem key={cat} value={cat}>{cat}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <FormControl fullWidth>
                  <InputLabel>Assigned To</InputLabel>
                  <Select
                    label="Assigned To"
                    value={taskForm.assignedTo}
                    onChange={(e) => setTaskForm((t) => ({ ...t, assignedTo: e.target.value }))}
                  >
                    {currentUserId && <MenuItem value={currentUserId}>You</MenuItem>}
                    {partnerId && <MenuItem value={partnerId}>Partner</MenuItem>}
                    <MenuItem value="Both">Both</MenuItem>
                    {['You', 'Partner'].includes(taskForm.assignedTo) && (
                      <MenuItem value={taskForm.assignedTo} sx={{ display: 'none' }}>{taskForm.assignedTo}</MenuItem>
                    )}
                  </Select>
                </FormControl>
              </Grid>
            </Grid>
            <TextField
              fullWidth
              type="date"
              label="Due Date"
              InputLabelProps={{ shrink: true }}
              value={taskForm.due}
              onChange={(e) => setTaskForm((t) => ({ ...t, due: e.target.value }))}
            />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
          <Button onClick={() => setIsModalOpen(false)} disabled={addingTask} sx={{ color: 'text.secondary', fontWeight: 700 }}>
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleAddTask}
            disabled={addingTask || !taskForm.title.trim()}
            startIcon={addingTask ? <CircularProgress size={14} color="inherit" /> : undefined}
            sx={{ bgcolor: COLORS.primary, borderRadius: 3, px: 4, fontWeight: 700 }}
          >
            {addingTask ? 'Adding...' : 'Add Task'}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={editModalOpen}
        onClose={() => !savingEdit && setEditModalOpen(false)}
        fullWidth
        maxWidth="sm"
        PaperProps={{ sx: { borderRadius: 6 } }}
      >
        <DialogTitle sx={{ fontWeight: 800, fontFamily: 'Playfair Display', color: COLORS.primary }}>
          Edit Task
        </DialogTitle>
        <DialogContent>
          <Stack spacing={3} sx={{ mt: 1 }}>
            <TextField
              fullWidth
              label="Task Name"
              value={taskForm.title}
              onChange={(e) => setTaskForm((t) => ({ ...t, title: e.target.value }))}
            />
            <Grid container spacing={2}>
              <Grid size={{ xs: 12, sm: 6 }}>
                <FormControl fullWidth>
                  <InputLabel>Category</InputLabel>
                  <Select
                    label="Category"
                    value={taskForm.category}
                    onChange={(e) => setTaskForm((t) => ({ ...t, category: e.target.value }))}
                  >
                    {CATEGORIES.map((cat) => (
                      <MenuItem key={cat} value={cat}>{cat}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <FormControl fullWidth>
                  <InputLabel>Assigned To</InputLabel>
                  <Select
                    label="Assigned To"
                    value={taskForm.assignedTo}
                    onChange={(e) => setTaskForm((t) => ({ ...t, assignedTo: e.target.value }))}
                  >
                    {currentUserId && <MenuItem value={currentUserId}>You</MenuItem>}
                    {partnerId && <MenuItem value={partnerId}>Partner</MenuItem>}
                    <MenuItem value="Both">Both</MenuItem>
                    {['You', 'Partner'].includes(taskForm.assignedTo) && (
                      <MenuItem value={taskForm.assignedTo} sx={{ display: 'none' }}>{taskForm.assignedTo}</MenuItem>
                    )}
                  </Select>
                </FormControl>
              </Grid>
            </Grid>
            <TextField
              fullWidth
              type="date"
              label="Due Date"
              InputLabelProps={{ shrink: true }}
              value={taskForm.due}
              onChange={(e) => setTaskForm((t) => ({ ...t, due: e.target.value }))}
            />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
          <Button onClick={() => setEditModalOpen(false)} disabled={savingEdit} sx={{ color: 'text.secondary', fontWeight: 700 }}>
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleEditTask}
            disabled={savingEdit || !taskForm.title.trim()}
            startIcon={savingEdit ? <CircularProgress size={14} color="inherit" /> : undefined}
            sx={{ bgcolor: COLORS.primary, borderRadius: 3, px: 4, fontWeight: 700 }}
          >
            {savingEdit ? 'Saving...' : 'Save Changes'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
