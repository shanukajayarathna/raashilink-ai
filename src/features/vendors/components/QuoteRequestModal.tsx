import React, { useEffect, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid,
  IconButton,
  MenuItem,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { CheckCircle2, Info, Phone, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import vendorService from '../services/vendorService';

const COLORS = {
  primary: '#8B1A2E',
  secondary: '#C9A84C',
  accent: '#1A6B72',
  success: '#2E7D32',
  textSecondary: '#555555',
};

interface QuoteRequestModalProps {
  open: boolean;
  onClose: () => void;
  vendor: any;
  weddingDate?: string;
  userPhone?: string;
  userEmail?: string;
  userName?: string;
  onSubmitSuccess?: () => void;
}

const buildInitialState = (weddingDate?: string, userPhone?: string, userEmail?: string, userName?: string) => ({
  eventType: 'Wedding',
  date: weddingDate || '',
  guestCount: '',
  location: '',
  venueName: '',
  preferredPackage: '',
  coverageHours: '',
  budgetMin: '',
  budgetMax: '',
  requirements: '',
  phone: userPhone || '',
  email: userEmail || '',
  contactName: userName || '',
  preferredContactMethod: 'platform',
});

export default function QuoteRequestModal({
  open,
  onClose,
  vendor,
  weddingDate,
  userPhone,
  userEmail,
  userName,
  onSubmitSuccess,
}: QuoteRequestModalProps) {
  const [formData, setFormData] = useState(buildInitialState(weddingDate, userPhone, userEmail, userName));
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [submitError, setSubmitError] = useState('');

  useEffect(() => {
    if (open) {
      setFormData(buildInitialState(weddingDate, userPhone, userEmail, userName));
      setIsSuccess(false);
      setSubmitError('');
    }
  }, [open, weddingDate, userPhone, userEmail, userName]);

  const handleChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async () => {
    if (!vendor?.id) return;
    if (!formData.date || !formData.guestCount || !formData.location || !formData.contactName || !formData.phone) {
      setSubmitError('Wedding date, guest count, location, contact name, and phone are required.');
      return;
    }

    setIsSubmitting(true);
    setSubmitError('');

    try {
      await vendorService.submitQuote({
        vendorId: vendor.id,
        category: vendor.category,
        eventType: formData.eventType,
        weddingDate: formData.date,
        guestCount: Number(formData.guestCount || 0),
        location: formData.location,
        venueName: formData.venueName,
        preferredPackage: formData.preferredPackage,
        coverageHours: Number(formData.coverageHours || 0),
        budgetMin: Number(formData.budgetMin || 0),
        budgetMax: Number(formData.budgetMax || 0),
        contactName: formData.contactName,
        contactEmail: formData.email,
        contactPhone: formData.phone,
        preferredContactMethod: formData.preferredContactMethod,
        message: formData.requirements,
      });
      setIsSuccess(true);
      onSubmitSuccess?.();
    } catch (err) {
      console.error('Failed to submit vendor quote request', err);
      setSubmitError('Failed to send the quote request. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="md" PaperProps={{ sx: { borderRadius: 6, overflow: 'hidden' } }}>
      <AnimatePresence mode="wait">
        {!isSuccess ? (
          <motion.div
            key="form"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.25 }}
          >
            <DialogTitle
              sx={{
                p: 3,
                bgcolor: COLORS.primary,
                color: 'white',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <Box>
                <Typography variant="h6" sx={{ fontWeight: 800, fontFamily: 'Playfair Display' }}>
                  Request a Quote
                </Typography>
                <Typography variant="caption" sx={{ opacity: 0.85 }}>
                  Send detailed wedding requirements to {vendor?.name || vendor?.businessName || 'this vendor'}
                </Typography>
              </Box>
              <IconButton onClick={onClose} sx={{ color: 'white' }}>
                <X size={20} />
              </IconButton>
            </DialogTitle>

            <DialogContent sx={{ p: 4 }}>
              <Stack spacing={3} sx={{ mt: 1 }}>
                <Alert icon={<Info size={18} />} severity="info" sx={{ borderRadius: 3 }}>
                  This request goes directly to the vendor portal inbox with your event and contact details.
                </Alert>

                {submitError ? <Alert severity="error" sx={{ borderRadius: 3 }}>{submitError}</Alert> : null}

                <Grid container spacing={2}>
                  <Grid size={{ xs: 12, sm: 4 }}>
                    <TextField select fullWidth label="Event Type" value={formData.eventType} onChange={(e) => handleChange('eventType', e.target.value)}>
                      {['Wedding', 'Engagement', 'Homecoming', 'Pre-shoot'].map((option) => (
                        <MenuItem key={option} value={option}>{option}</MenuItem>
                      ))}
                    </TextField>
                  </Grid>
                  <Grid size={{ xs: 12, sm: 4 }}>
                    <TextField fullWidth label="Wedding Date" type="date" value={formData.date} onChange={(e) => handleChange('date', e.target.value)} InputLabelProps={{ shrink: true }} />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 4 }}>
                    <TextField fullWidth label="Estimated Guests" type="number" value={formData.guestCount} onChange={(e) => handleChange('guestCount', e.target.value)} inputProps={{ min: 0 }} />
                  </Grid>
                </Grid>

                <Grid container spacing={2}>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <TextField fullWidth label="Wedding City / Location" value={formData.location} onChange={(e) => handleChange('location', e.target.value)} placeholder="Colombo, Kandy, Galle..." />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <TextField fullWidth label="Venue Name (if decided)" value={formData.venueName} onChange={(e) => handleChange('venueName', e.target.value)} />
                  </Grid>
                </Grid>

                <Grid container spacing={2}>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <TextField fullWidth label="Preferred Package / Service" value={formData.preferredPackage} onChange={(e) => handleChange('preferredPackage', e.target.value)} placeholder="Full day package, ballroom hall, buffet menu..." />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <TextField fullWidth label="Coverage / Service Hours" type="number" value={formData.coverageHours} onChange={(e) => handleChange('coverageHours', e.target.value)} inputProps={{ min: 0 }} />
                  </Grid>
                </Grid>

                <Grid container spacing={2}>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <TextField fullWidth label="Budget Min (LKR)" type="number" value={formData.budgetMin} onChange={(e) => handleChange('budgetMin', e.target.value)} inputProps={{ min: 0 }} />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <TextField fullWidth label="Budget Max (LKR)" type="number" value={formData.budgetMax} onChange={(e) => handleChange('budgetMax', e.target.value)} inputProps={{ min: 0 }} />
                  </Grid>
                </Grid>

                <TextField
                  fullWidth
                  label="Requirements"
                  multiline
                  minRows={4}
                  value={formData.requirements}
                  onChange={(e) => handleChange('requirements', e.target.value)}
                  placeholder="Theme, must-have shots, cuisine preferences, timing, decor colours, logistics, or anything the vendor needs to know."
                />

                <Grid container spacing={2}>
                  <Grid size={{ xs: 12, sm: 4 }}>
                    <TextField fullWidth label="Contact Name" value={formData.contactName} onChange={(e) => handleChange('contactName', e.target.value)} />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 4 }}>
                    <TextField fullWidth label="Phone" value={formData.phone} onChange={(e) => handleChange('phone', e.target.value)} InputProps={{ startAdornment: <Phone size={16} style={{ marginRight: 8, color: COLORS.textSecondary }} /> }} />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 4 }}>
                    <TextField fullWidth label="Email" value={formData.email} onChange={(e) => handleChange('email', e.target.value)} />
                  </Grid>
                </Grid>

                <TextField select fullWidth label="Preferred Contact Method" value={formData.preferredContactMethod} onChange={(e) => handleChange('preferredContactMethod', e.target.value)}>
                  <MenuItem value="platform">Platform inbox</MenuItem>
                  <MenuItem value="phone">Phone call</MenuItem>
                  <MenuItem value="email">Email</MenuItem>
                  <MenuItem value="whatsapp">WhatsApp</MenuItem>
                </TextField>
              </Stack>
            </DialogContent>

            <DialogActions sx={{ p: 4, pt: 0 }}>
              <Button onClick={onClose} sx={{ color: 'text.secondary', fontWeight: 700 }}>Cancel</Button>
              <Button variant="contained" onClick={handleSubmit} disabled={isSubmitting} sx={{ bgcolor: COLORS.primary, borderRadius: 3, px: 4, fontWeight: 700 }}>
                {isSubmitting ? 'Sending Request...' : 'Submit Request'}
              </Button>
            </DialogActions>
          </motion.div>
        ) : (
          <motion.div
            key="success"
            initial={{ opacity: 0, scale: 0.92 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.25 }}
            style={{ padding: '48px', textAlign: 'center' }}
          >
            <Box sx={{ width: 80, height: 80, bgcolor: `${COLORS.success}15`, color: COLORS.success, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', mx: 'auto', mb: 3 }}>
              <CheckCircle2 size={48} />
            </Box>
            <Typography variant="h5" sx={{ fontWeight: 800, fontFamily: 'Playfair Display', color: COLORS.primary, mb: 1 }}>
              Request Sent
            </Typography>
            <Typography variant="body1" sx={{ color: 'text.secondary', mb: 4 }}>
              The vendor now has your full quote brief in their profile inbox.
            </Typography>
            <Button variant="contained" fullWidth onClick={onClose} sx={{ bgcolor: COLORS.primary, borderRadius: 3, fontWeight: 700 }}>
              Close
            </Button>
          </motion.div>
        )}
      </AnimatePresence>
    </Dialog>
  );
}
