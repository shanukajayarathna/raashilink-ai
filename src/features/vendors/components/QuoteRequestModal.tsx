import React, { useState, useEffect } from 'react';
import { 
  Dialog, DialogTitle, DialogContent, DialogActions, 
  Box, Typography, Stack, TextField, Button, 
  Grid, MenuItem, Select, FormControl, InputLabel,
  Alert, IconButton, Divider
} from '@mui/material';
import { 
  Calendar, Users, Phone, MessageSquare, 
  X, Info, CheckCircle2, DollarSign 
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import vendorService from '../services/vendorService';

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

interface QuoteRequestModalProps {
  open: boolean;
  onClose: () => void;
  vendor: any;
  weddingDate?: string;
  userPhone?: string;
}

export default function QuoteRequestModal({ open, onClose, vendor, weddingDate = '2025-12-28', userPhone = '+94 77 123 4567' }: QuoteRequestModalProps) {
  const [formData, setFormData] = useState({
    date: weddingDate,
    eventType: 'Wedding',
    guestCount: '',
    budget: '',
    requirements: '',
    phone: userPhone
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [submitError, setSubmitError] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | { name?: string; value: unknown }>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name as string]: value }));
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    setSubmitError('');

    try {
      const parsedBudget = Number(String(formData.budget || '').replace(/[^\d]/g, '')) || 0;
      await vendorService.submitQuote({
        vendorId: vendor?.id,
        category: vendor?.category,
        quotedAmount: parsedBudget,
        message: formData.requirements,
      });
      setIsSuccess(true);
    } catch (err) {
      console.error('Failed to submit vendor quote request', err);
      setSubmitError('Failed to send the quote request. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReset = () => {
    setIsSuccess(false);
    onClose();
  };

  return (
    <Dialog 
      open={open} 
      onClose={onClose} 
      fullWidth 
      maxWidth="sm" 
      PaperProps={{ sx: { borderRadius: 6, overflow: 'hidden' } }}
    >
      <AnimatePresence mode="wait">
        {!isSuccess ? (
          <motion.div
            key="form"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
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
                  Request a Quote
                </Typography>
                <Typography variant="caption" sx={{ opacity: 0.8 }}>
                  Sending request to <strong>{vendor?.name}</strong>
                </Typography>
              </Box>
              <IconButton onClick={onClose} sx={{ color: 'white' }}>
                <X size={20} />
              </IconButton>
            </DialogTitle>

            <DialogContent sx={{ p: 4 }}>
              <Stack spacing={3} sx={{ mt: 1 }}>
                <Alert icon={<Info size={18} />} severity="info" sx={{ borderRadius: 3, bgcolor: `${COLORS.accent}10`, color: COLORS.accent, border: `1px solid ${COLORS.accent}20` }}>
                  Your wedding details are pre-filled to save time.
                </Alert>

                {submitError ? (
                  <Alert severity="error" sx={{ borderRadius: 3 }}>
                    {submitError}
                  </Alert>
                ) : null}

                <Grid container spacing={2}>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <TextField 
                      fullWidth 
                      label="Wedding Date" 
                      type="date" 
                      name="date"
                      value={formData.date}
                      onChange={handleChange}
                      InputLabelProps={{ shrink: true }} 
                    />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <FormControl fullWidth>
                      <InputLabel>Event Type</InputLabel>
                      <Select 
                        label="Event Type" 
                        name="eventType"
                        value={formData.eventType}
                        onChange={handleChange as any}
                      >
                        <MenuItem value="Wedding">Wedding</MenuItem>
                        <MenuItem value="Engagement">Engagement</MenuItem>
                        <MenuItem value="Homecoming">Homecoming</MenuItem>
                        <MenuItem value="Pre-shoot">Pre-shoot</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                </Grid>

                <Grid container spacing={2}>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <TextField 
                      fullWidth 
                      label="Estimated Guests" 
                      type="number" 
                      name="guestCount"
                      value={formData.guestCount}
                      onChange={handleChange}
                      placeholder="e.g. 250"
                      InputProps={{ startAdornment: <Users size={16} style={{ marginRight: 8, color: COLORS.textSecondary }} /> }}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <TextField 
                      fullWidth 
                      label="Budget Range (LKR)" 
                      name="budget"
                      value={formData.budget}
                      onChange={handleChange}
                      placeholder="e.g. 100k - 150k"
                      InputProps={{ startAdornment: <DollarSign size={16} style={{ marginRight: 8, color: COLORS.textSecondary }} /> }}
                    />
                  </Grid>
                </Grid>

                <TextField 
                  fullWidth 
                  label="Specific Requirements" 
                  name="requirements"
                  value={formData.requirements}
                  onChange={handleChange}
                  multiline 
                  rows={4} 
                  placeholder="Tell the vendor about your vision, themes, or any special requests..." 
                />

                <TextField 
                  fullWidth 
                  label="Your Contact Number" 
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  InputProps={{ startAdornment: <Phone size={16} style={{ marginRight: 8, color: COLORS.textSecondary }} /> }}
                />
              </Stack>
            </DialogContent>

            <DialogActions sx={{ p: 4, pt: 0 }}>
              <Button onClick={onClose} sx={{ color: 'text.secondary', fontWeight: 700 }}>Cancel</Button>
              <Button 
                variant="contained" 
                onClick={handleSubmit}
                disabled={isSubmitting}
                sx={{ 
                  bgcolor: COLORS.primary, 
                  borderRadius: 3, 
                  px: 4, 
                  fontWeight: 700,
                  '&:hover': { bgcolor: '#6B1423' }
                }}
              >
                {isSubmitting ? 'Sending Request...' : 'Submit Request'}
              </Button>
            </DialogActions>
          </motion.div>
        ) : (
          <motion.div
            key="success"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4 }}
            style={{ padding: '48px', textAlign: 'center' }}
          >
            <Box sx={{ 
              width: 80, 
              height: 80, 
              bgcolor: `${COLORS.success}15`, 
              color: COLORS.success, 
              borderRadius: '50%', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              mx: 'auto',
              mb: 3
            }}>
              <CheckCircle2 size={48} />
            </Box>
            <Typography variant="h5" sx={{ fontWeight: 800, fontFamily: 'Playfair Display', color: COLORS.primary, mb: 1 }}>
              Request Sent!
            </Typography>
            <Typography variant="body1" sx={{ color: 'text.secondary', mb: 4 }}>
              Your quote request has been sent to <strong>{vendor?.name}</strong>. They will get back to you shortly via the platform or your contact number.
            </Typography>
            <Button 
              variant="contained" 
              fullWidth 
              onClick={handleReset}
              sx={{ bgcolor: COLORS.primary, borderRadius: 3, fontWeight: 700 }}
            >
              Back to Marketplace
            </Button>
          </motion.div>
        )}
      </AnimatePresence>
    </Dialog>
  );
}

