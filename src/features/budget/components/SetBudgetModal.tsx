import React, { useState, useMemo, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Box,
  Typography,
  Stack,
  TextField,
  Button,
  Grid,
  IconButton,
  Divider,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  LinearProgress,
  useTheme,
  useMediaQuery,
  Alert,
  Tooltip,
} from '@mui/material';
import {
  X,
  Sparkles,
  DollarSign,
  Calculator,
  CheckCircle2,
  AlertCircle,
  TrendingUp,
  Info,
  ArrowRight,
  Save,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import weddingService from '@/features/wedding/services/weddingService';

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

interface CategoryAllocation {
  name: string;
  allocated: number;
  spent: number;
}

interface SetBudgetModalProps {
  open: boolean;
  onClose: () => void;
  totalBudget: number;
  categories: CategoryAllocation[];
  onSave: (newCategories: CategoryAllocation[]) => void;
}

export default function SetBudgetModal({ open, onClose, totalBudget, categories, onSave }: SetBudgetModalProps) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [localCategories, setLocalCategories] = useState<CategoryAllocation[]>([]);
  const [isAiLoading, setIsAiLoading] = useState(false);

  useEffect(() => {
    if (open) {
      setLocalCategories(JSON.parse(JSON.stringify(categories)));
    }
  }, [open, categories]);

  const totalAllocated = useMemo(() => {
    return localCategories.reduce((acc, cat) => acc + cat.allocated, 0);
  }, [localCategories]);

  const remainingBalance = totalBudget - totalAllocated;
  const isOverBudget = totalAllocated > totalBudget;

  const handleAllocationChange = (index: number, value: string) => {
    const numericValue = parseInt(value.replace(/[^0-9]/g, '')) || 0;
    const newList = [...localCategories];
    newList[index].allocated = numericValue;
    setLocalCategories(newList);
  };

  const handleAiSuggest = async () => {
    setIsAiLoading(true);
    try {
      // Standard Sri Lankan wedding percentage split
      const suggestions: Record<string, number> = {
        Venue: 0.35,
        Catering: 0.20,
        Photography: 0.15,
        Decoration: 0.10,
        Attire: 0.10,
        Others: 0.10,
      };

      const suggestedCategories = localCategories.map(cat => {
        const pct = suggestions[cat.name];
        if (pct !== undefined) {
          return { ...cat, allocated: Math.round(totalBudget * pct) };
        }
        return cat;
      });

      setLocalCategories(suggestedCategories);
    } catch (err) {
      console.error(err);
    } finally {
      setIsAiLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      const allocations = localCategories.reduce((acc, cat) => {
        acc[cat.name] = cat.allocated;
        return acc;
      }, {} as Record<string, number>);
      await weddingService.saveAllocations(allocations);
    } catch (err) {
      console.error('Failed to save allocations', err);
    }
    onSave(localCategories);
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth="md"
      PaperProps={{ sx: { borderRadius: 6, overflow: 'hidden' } }}
    >
      <DialogTitle sx={{ 
        p: 3, 
        bgcolor: COLORS.primary, 
        color: 'white',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <Box>
          <Typography variant="h6" sx={{ fontWeight: 800, fontFamily: 'Playfair Display' }}>
            Set Budget by Category
          </Typography>
          <Typography variant="caption" sx={{ opacity: 0.8 }}>
            Total Budget: <strong>LKR {totalBudget.toLocaleString()}</strong>
          </Typography>
        </Box>
        <IconButton onClick={onClose} sx={{ color: 'white' }}>
          <X size={20} />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ p: 4 }}>
        <Stack spacing={4} sx={{ mt: 1 }}>
          <Box sx={{ p: 3, borderRadius: 4, bgcolor: isOverBudget ? `${COLORS.error}10` : `${COLORS.cream}`, border: '1px solid', borderColor: isOverBudget ? COLORS.error : 'divider' }}>
            <Stack direction="row" justifyContent="space-between" alignItems="center">
              <Box>
                <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 700, display: 'block', mb: 0.5 }}>
                  Balance Remaining
                </Typography>
                <Typography variant="h5" sx={{ fontWeight: 800, color: isOverBudget ? COLORS.error : COLORS.success }}>
                  LKR {remainingBalance.toLocaleString()}
                </Typography>
              </Box>
              <Button
                variant="contained"
                startIcon={isAiLoading ? <CircularProgress size={18} color="inherit" /> : <Sparkles size={18} />}
                onClick={handleAiSuggest}
                disabled={isAiLoading}
                sx={{
                  bgcolor: COLORS.accent,
                  borderRadius: 3,
                  fontWeight: 700,
                  textTransform: 'none',
                  '&:hover': { bgcolor: '#14565C' }
                }}
              >
                {isAiLoading ? 'AI Suggesting...' : 'Let AI Suggest'}
              </Button>
            </Stack>
            <LinearProgress
              variant="determinate"
              value={Math.min((totalAllocated / totalBudget) * 100, 100)}
              sx={{
                mt: 2,
                height: 8,
                borderRadius: 4,
                bgcolor: 'rgba(0,0,0,0.05)',
                '& .MuiLinearProgress-bar': { bgcolor: isOverBudget ? COLORS.error : COLORS.primary }
              }}
            />
          </Box>

          {isOverBudget && (
            <Alert severity="error" icon={<AlertCircle size={18} />} sx={{ borderRadius: 3 }}>
              You have allocated <strong>LKR {Math.abs(remainingBalance).toLocaleString()}</strong> more than your total budget.
            </Alert>
          )}

          <TableContainer component={Paper} sx={{ borderRadius: 4, border: '1px solid', borderColor: 'divider', boxShadow: 'none' }}>
            <Table size="small">
              <TableHead sx={{ bgcolor: COLORS.cream }}>
                <TableRow>
                  <TableCell sx={{ fontWeight: 800, color: COLORS.primary }}>Category</TableCell>
                  <TableCell sx={{ fontWeight: 800, color: COLORS.primary }}>Allocation (LKR)</TableCell>
                  <TableCell sx={{ fontWeight: 800, color: COLORS.primary }}>% of Total</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {localCategories.map((cat, i) => (
                  <TableRow key={i}>
                    <TableCell sx={{ fontWeight: 700 }}>{cat.name}</TableCell>
                    <TableCell>
                      <TextField
                        size="small"
                        value={cat.allocated.toLocaleString()}
                        onChange={(e) => handleAllocationChange(i, e.target.value)}
                        placeholder="0"
                        InputProps={{
                          startAdornment: <Typography variant="caption" sx={{ mr: 1, fontWeight: 700, color: 'text.secondary' }}>LKR</Typography>,
                          sx: { borderRadius: 2, fontWeight: 700 }
                        }}
                        sx={{ width: 180 }}
                      />
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" sx={{ fontWeight: 700, color: COLORS.textSecondary }}>
                        {Math.round((cat.allocated / totalBudget) * 100)}%
                      </Typography>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Stack>
      </DialogContent>

      <DialogActions sx={{ p: 4, pt: 0 }}>
        <Button onClick={onClose} sx={{ color: 'text.secondary', fontWeight: 700 }}>Cancel</Button>
        <Button
          variant="contained"
          onClick={handleSave}
          disabled={isOverBudget}
          startIcon={<Save size={18} />}
          sx={{
            bgcolor: COLORS.primary,
            borderRadius: 3,
            px: 4,
            fontWeight: 700,
            '&:hover': { bgcolor: '#6B1423' }
          }}
        >
          Save Allocations
        </Button>
      </DialogActions>
    </Dialog>
  );
}

const CircularProgress = ({ size, color }: any) => (
  <Box sx={{ display: 'inline-flex', mr: 1 }}>
    <LinearProgress sx={{ width: size, height: 2, borderRadius: 1 }} />
  </Box>
);

