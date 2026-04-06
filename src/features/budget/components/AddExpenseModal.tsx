import React, { useState } from 'react';
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
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  IconButton,
  Divider,
  Autocomplete,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import {
  X,
  Plus,
  DollarSign,
  Calendar,
  Store,
  FileText,
  Upload,
  CheckCircle2,
  AlertCircle,
  Receipt,
  Camera,
  Utensils,
  Flower2,
  Scissors,
  Music,
  Sparkles,
  LayoutGrid,
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
  warning: '#ED6C02',
};

const CATEGORIES = [
  { id: 'Venue', name: 'Venue', icon: <Store size={18} /> },
  { id: 'Catering', name: 'Catering', icon: <Utensils size={18} /> },
  { id: 'Photography', name: 'Photography', icon: <Camera size={18} /> },
  { id: 'Decoration', name: 'Decoration', icon: <Flower2 size={18} /> },
  { id: 'Attire', name: 'Bridal Wear', icon: <Scissors size={18} /> },
  { id: 'Entertainment', name: 'Entertainment', icon: <Music size={18} /> },
  { id: 'Others', name: 'Others', icon: <LayoutGrid size={18} /> },
];

const MOCK_VENDORS = [
  'Galle Face Hotel',
  'Dimitri Photography',
  'Royal Catering Services',
  'Floral Dreams by Niro',
  'Glamour Bridal Wear',
  'The Sound Crew',
];

interface AddExpenseModalProps {
  open: boolean;
  onClose: () => void;
  onAdd: (expense: any) => void;
}

export default function AddExpenseModal({ open, onClose, onAdd }: AddExpenseModalProps) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [formData, setFormData] = useState({
    category: '',
    description: '',
    amount: '',
    date: new Date().toISOString().split('T')[0],
    vendor: '',
    notes: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [receiptFile, setReceiptFile] = useState<File | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | { name?: string; value: unknown }>) => {
    const { name, value } = e.target;
    if (name === 'amount') {
      // Format as currency as typing
      const numericValue = value.toString().replace(/[^0-9]/g, '');
      setFormData(prev => ({ ...prev, [name as string]: numericValue }));
    } else {
      setFormData(prev => ({ ...prev, [name as string]: value }));
    }
  };

  const handleSubmit = async () => {
    if (!formData.category || !formData.description || !formData.amount) return;

    setIsSubmitting(true);
    try {
      // Simulating API call to POST /api/v1/wedding/expense/add
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      const newExpense = {
        id: Math.random(),
        date: formData.date,
        category: formData.category,
        description: formData.description,
        amount: parseInt(formData.amount),
        hasReceipt: !!receiptFile,
      };
      
      onAdd(newExpense);
      setFormData({
        category: '',
        description: '',
        amount: '',
        date: new Date().toISOString().split('T')[0],
        vendor: '',
        notes: '',
      });
      setReceiptFile(null);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatAmount = (val: string) => {
    if (!val) return '';
    return parseInt(val).toLocaleString();
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth="sm"
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
            Add New Expense
          </Typography>
          <Typography variant="caption" sx={{ opacity: 0.8 }}>
            Keep track of your wedding spending.
          </Typography>
        </Box>
        <IconButton onClick={onClose} sx={{ color: 'white' }}>
          <X size={20} />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ p: 4 }}>
        <Stack spacing={3} sx={{ mt: 1 }}>
          <Grid container spacing={2}>
            <Grid size={{ xs: 12, sm: 6 }}>
              <FormControl fullWidth>
                <InputLabel>Category</InputLabel>
                <Select
                  name="category"
                  value={formData.category}
                  onChange={handleChange as any}
                  label="Category"
                  sx={{ borderRadius: 3 }}
                >
                  {CATEGORIES.map(cat => (
                    <MenuItem key={cat.id} value={cat.id}>
                      <Stack direction="row" spacing={1.5} alignItems="center">
                        <Box sx={{ color: COLORS.primary }}>{cat.icon}</Box>
                        <Typography variant="body2">{cat.name}</Typography>
                      </Stack>
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                label="Amount (LKR)"
                name="amount"
                value={formatAmount(formData.amount)}
                onChange={handleChange}
                placeholder="e.g. 50,000"
                InputProps={{
                  startAdornment: <Typography variant="body2" sx={{ mr: 1, fontWeight: 700, color: COLORS.textSecondary }}>LKR</Typography>,
                  sx: { borderRadius: 3 }
                }}
              />
            </Grid>
          </Grid>

          <TextField
            fullWidth
            label="Description"
            name="description"
            value={formData.description}
            onChange={handleChange}
            placeholder="e.g. Advance payment for flowers"
            sx={{ '& .MuiOutlinedInput-root': { borderRadius: 3 } }}
          />

          <Grid container spacing={2}>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                type="date"
                label="Date"
                name="date"
                value={formData.date}
                onChange={handleChange}
                InputLabelProps={{ shrink: true }}
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: 3 } }}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <Autocomplete
                options={MOCK_VENDORS}
                value={formData.vendor}
                onChange={(_, val) => setFormData(prev => ({ ...prev, vendor: val || '' }))}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Paid to Vendor"
                    placeholder="Select vendor"
                    sx={{ '& .MuiOutlinedInput-root': { borderRadius: 3 } }}
                  />
                )}
              />
            </Grid>
          </Grid>

          <Box>
            <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 700, mb: 1, display: 'block' }}>
              Receipt / Invoice
            </Typography>
            <Box
              sx={{
                border: '2px dashed',
                borderColor: receiptFile ? COLORS.success : 'divider',
                borderRadius: 4,
                p: 3,
                textAlign: 'center',
                bgcolor: receiptFile ? `${COLORS.success}05` : `${COLORS.cream}30`,
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                '&:hover': { borderColor: COLORS.primary, bgcolor: `${COLORS.cream}50` }
              }}
              onClick={() => document.getElementById('receipt-upload')?.click()}
            >
              <input
                type="file"
                id="receipt-upload"
                hidden
                onChange={(e) => setReceiptFile(e.target.files?.[0] || null)}
              />
              {receiptFile ? (
                <Stack spacing={1} alignItems="center">
                  <CheckCircle2 size={32} color={COLORS.success} />
                  <Typography variant="body2" sx={{ fontWeight: 700, color: COLORS.success }}>
                    {receiptFile.name}
                  </Typography>
                  <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                    Click to change file
                  </Typography>
                </Stack>
              ) : (
                <Stack spacing={1} alignItems="center">
                  <Upload size={32} color={COLORS.textSecondary} />
                  <Typography variant="body2" sx={{ fontWeight: 700 }}>
                    Upload Receipt
                  </Typography>
                  <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                    Drag & drop or click to browse
                  </Typography>
                </Stack>
              )}
            </Box>
          </Box>

          <TextField
            fullWidth
            label="Note / Memo"
            name="notes"
            value={formData.notes}
            onChange={handleChange}
            multiline
            rows={3}
            placeholder="Any additional details..."
            sx={{ '& .MuiOutlinedInput-root': { borderRadius: 3 } }}
          />
        </Stack>
      </DialogContent>

      <DialogActions sx={{ p: 4, pt: 0 }}>
        <Button onClick={onClose} sx={{ color: 'text.secondary', fontWeight: 700 }}>Cancel</Button>
        <Button
          variant="contained"
          onClick={handleSubmit}
          disabled={isSubmitting || !formData.category || !formData.description || !formData.amount}
          sx={{
            bgcolor: COLORS.primary,
            borderRadius: 3,
            px: 4,
            fontWeight: 700,
            '&:hover': { bgcolor: '#6B1423' }
          }}
        >
          {isSubmitting ? 'Saving...' : 'Save Expense'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

