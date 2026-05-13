import React, { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Backdrop,
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  Grid,
  IconButton,
  MenuItem,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { CheckCircle2, Info, Package, Phone, TrendingDown, TrendingUp, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Slide } from '@mui/material';
import { TransitionProps } from '@mui/material/transitions';
import vendorService from '../services/vendorService';
import weddingService from '@/features/wedding/services/weddingService';

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
  remainingBudget?: number;
  onSubmitSuccess?: () => void;
  mode?: 'marketplace' | 'wedding';
}

function getVendorPackages(vendor: any) {
  if (Array.isArray(vendor?.packages) && vendor.packages.length > 0) {
    const real = vendor.packages
      .filter((item: any) => item && item.name)
      .map((item: any, index: number) => ({
        id: String(item.id || item.packageId || `pkg-${index + 1}`),
        name: String(item.name),
        description: String(item.description || ''),
        price: Number(item.price || 0),
        currency: String(item.currency || 'LKR'),
        durationHours: Number(item.durationHours || 0),
      }));
    if (real.length > 0) return { packages: real, hasReal: true };
  }

  if (Array.isArray(vendor?.packageSummary) && vendor.packageSummary.length > 0) {
    const summary = vendor.packageSummary.filter(Boolean).map((name: string, index: number) => ({
      id: `summary-${index + 1}`,
      name,
      description: '',
      price: 0,
      currency: 'LKR',
      durationHours: 0,
    }));
    if (summary.length > 0) return { packages: summary, hasReal: false };
  }

  return { packages: [], hasReal: false };
}

const VENDOR_CATEGORY_TO_EXPENSE: Record<string, string> = {
  Venue: 'Venue',
  Photography: 'Photography',
  Catering: 'Catering',
  Decoration: 'Decoration',
  Attire: 'Attire',
  Makeup: 'Beauty',
  Entertainment: 'Others',
  Videography: 'Photography',
  Florist: 'Decoration',
  Transport: 'Logistics',
};

const buildInitialState = (weddingDate?: string, userPhone?: string, userEmail?: string, userName?: string) => ({
  eventType: 'Wedding',
  date: weddingDate || '',
  guestCount: '',
  location: '',
  venueName: '',
  preferredPackage: '',
  coverageHours: '',
  requirements: '',
  phone: userPhone || '',
  email: userEmail || '',
  contactName: userName || '',
  preferredContactMethod: 'phone',
});

const Transition = React.forwardRef(function Transition(
  props: TransitionProps & {
    children: React.ReactElement<any, any>;
  },
  ref: React.Ref<unknown>,
) {
  return <Slide direction="up" ref={ref} {...props} />;
});

export default function QuoteRequestModal({
  open,
  onClose,
  vendor,
  weddingDate,
  userPhone,
  userEmail,
  userName,
  remainingBudget = 0,
  onSubmitSuccess,
  mode = 'marketplace',
}: QuoteRequestModalProps) {
  const { packages: packageOptions, hasReal: hasRealPackages } = useMemo(() => getVendorPackages(vendor), [vendor]);
  const [formData, setFormData] = useState(buildInitialState(weddingDate, userPhone, userEmail, userName));
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const selectedPackage = useMemo(
    () => packageOptions.find((item) => item.id === formData.preferredPackage),
    [packageOptions, formData.preferredPackage]
  );
  const hasLockedCoverageHours = Number(selectedPackage?.durationHours || 0) > 0;

  useEffect(() => {
    if (open) {
      const initial = buildInitialState(weddingDate, userPhone, userEmail, userName);
      
      // If it's a venue vendor, auto-fill the venue and location
      if (vendor?.category === 'Venue') {
        initial.venueName = vendor.name || vendor.businessName || '';
        initial.location = vendor.location || vendor.city || '';
      }

      if (packageOptions.length > 0) {
        initial.preferredPackage = packageOptions[0].id;
      }

      setFormData(initial);
      setIsSuccess(false);
      setSubmitError('');
    }
  }, [open, weddingDate, userPhone, userEmail, userName, vendor, packageOptions]);

  const handleChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  useEffect(() => {
    if (!open || !hasLockedCoverageHours) return;

    const lockedHours = String(Number(selectedPackage?.durationHours || 0));
    setFormData((prev) => (prev.coverageHours === lockedHours ? prev : { ...prev, coverageHours: lockedHours }));
  }, [open, hasLockedCoverageHours, selectedPackage?.durationHours]);

  const handleSubmit = async () => {
    if (!vendor?.id) return;
    if (!formData.date || !formData.guestCount || !formData.location || !formData.contactName || !formData.phone) {
      setSubmitError('Wedding date, guest count, location, contact name, and phone are required.');
      return;
    }

    setIsSubmitting(true);
    setSubmitError('');

    try {
      const payload = {
        vendorId: vendor.id,
        category: vendor.category,
        eventType: formData.eventType,
        weddingDate: formData.date,
        guestCount: Number(formData.guestCount || 0),
        location: formData.location,
        venueName: formData.venueName,
        preferredPackage: selectedPackage?.name || formData.preferredPackage,
        selectedPackageId: selectedPackage?.id || '',
        selectedPackageName: selectedPackage?.name || formData.preferredPackage,
        coverageHours: Number(formData.coverageHours || selectedPackage?.durationHours || 0),
        budgetMin: selectedPackage?.price || vendor?.pricingRange?.min || 0,
        budgetMax: selectedPackage?.price || vendor?.pricingRange?.max || 0,
        contactName: formData.contactName,
        contactEmail: formData.email,
        contactPhone: formData.phone,
        preferredContactMethod: formData.preferredContactMethod,
        requirements: formData.requirements,
      };

      if (mode === 'wedding') {
        await weddingService.requestQuote(payload);
      } else {
        await vendorService.submitQuote({
          ...payload,
          message: formData.requirements,
        });
      }

      // Auto-add a budget expense if the selected package has a price
      if (selectedPackage?.price && selectedPackage.price > 0) {
        const expenseCategory = VENDOR_CATEGORY_TO_EXPENSE[vendor?.category || ''] || 'Others';
        try {
          await weddingService.addExpense({
            title: `${selectedPackage.name} — ${vendor?.name || vendor?.businessName || vendor?.category}`,
            category: expenseCategory,
            amount: selectedPackage.price,
            paid: false,
            notes: `Auto-added when requesting quote. ${selectedPackage.description || ''}`.trim(),
          });
        } catch {
          // Non-critical: expense add failure shouldn't block the success flow
        }
      }

      setIsSuccess(true);
      // Trigger full dashboard refresh so AI Budget Tip updates in real-time
      setTimeout(() => {
        window.dispatchEvent(new CustomEvent('wedding:quote_submitted'));
        onSubmitSuccess?.();
      }, 500);
    } catch (err) {
      console.error('Failed to submit vendor quote request', err);
      setSubmitError((err as any)?.response?.data?.message || (err as any)?.message || 'Failed to send the quote request. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog 
      open={open} 
      onClose={isSubmitting ? undefined : onClose} 
      fullWidth 
      maxWidth="md" 
      TransitionComponent={Transition}
      PaperProps={{ 
        sx: { 
          borderRadius: 6, 
          overflow: 'hidden',
          bgcolor: isSuccess ? 'white' : 'white' // Ensure consistent bg
        } 
      }}
    >
      <AnimatePresence mode="wait">
        {!isSuccess ? (
          <motion.div
            key="form"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
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
                  This request goes directly to the vendor with your event and contact details.
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
                    <TextField
                      fullWidth
                      label="Wedding Date"
                      type="date"
                      value={formData.date}
                      onChange={(e) => !weddingDate && handleChange('date', e.target.value)}
                      disabled={!!weddingDate}
                      readOnly={!!weddingDate}
                      slotProps={{ htmlInput: { readOnly: !!weddingDate } }}
                      InputLabelProps={{ shrink: true }}
                      helperText={weddingDate ? 'Fixed from your wedding plan' : ''}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 4 }}>
                    <TextField fullWidth label="Estimated Guests" type="number" value={formData.guestCount} onChange={(e) => handleChange('guestCount', e.target.value)} inputProps={{ min: 0 }} />
                  </Grid>
                </Grid>

                <Grid container spacing={2}>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <TextField 
                      fullWidth 
                      label="Wedding City / Location" 
                      value={formData.location} 
                      onChange={(e) => handleChange('location', e.target.value)} 
                      placeholder="Colombo, Kandy, Galle..." 
                      disabled={vendor?.category === 'Venue' && !!vendor?.location} 
                    />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <TextField 
                      fullWidth 
                      label="Venue Name (if decided)" 
                      value={formData.venueName} 
                      onChange={(e) => handleChange('venueName', e.target.value)} 
                      disabled={vendor?.category === 'Venue' && !!vendor?.name} 
                    />
                  </Grid>
                </Grid>

                {/* Package Selection */}
                <Grid container spacing={2}>
                  <Grid size={{ xs: 12, sm: packageOptions.length > 0 ? 8 : 12 }}>
                    {hasRealPackages ? (
                      <TextField
                        select
                        fullWidth
                        label="Select Package"
                        value={formData.preferredPackage}
                        onChange={(e) => handleChange('preferredPackage', e.target.value)}
                        SelectProps={{
                          renderValue: (selected) => {
                            const pkg = packageOptions.find((p) => p.id === selected);
                            if (!pkg) return '';
                            return `${pkg.name}${pkg.price > 0 ? ` — LKR ${pkg.price.toLocaleString()}` : ''}`;
                          },
                        }}
                      >
                        {packageOptions.map((pkg) => (
                          <MenuItem key={pkg.id} value={pkg.id} sx={{ alignItems: 'flex-start', py: 1.5 }}>
                            <Box>
                              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 4 }}>
                                <Typography variant="body2" fontWeight={700}>{pkg.name}</Typography>
                                {pkg.price > 0 && (
                                  <Typography variant="body2" fontWeight={800} color={COLORS.primary}>
                                    LKR {pkg.price.toLocaleString()}
                                  </Typography>
                                )}
                              </Box>
                              {pkg.description && (
                                <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 0.25, maxWidth: 420, whiteSpace: 'normal' }}>
                                  {pkg.description}
                                </Typography>
                              )}
                              {pkg.durationHours > 0 && (
                                <Typography variant="caption" color="text.secondary" sx={{ mt: 0.25 }}>
                                  Duration: {pkg.durationHours} hrs
                                </Typography>
                              )}
                            </Box>
                          </MenuItem>
                        ))}
                      </TextField>
                    ) : (
                      <TextField
                        fullWidth
                        label="Preferred Package / Service"
                        value={formData.preferredPackage}
                        onChange={(e) => handleChange('preferredPackage', e.target.value)}
                        placeholder="Full day package, ballroom hall, buffet menu..."
                        disabled={packageOptions.length === 0}
                        helperText={packageOptions.length === 0 ? 'This vendor has not added packages yet.' : undefined}
                      />
                    )}
                  </Grid>
                  <Grid size={{ xs: 12, sm: packageOptions.length > 0 ? 4 : 6 }}>
                    <TextField
                      fullWidth
                      label="Coverage / Service Hours"
                      type="number"
                      value={formData.coverageHours}
                      onChange={(e) => handleChange('coverageHours', e.target.value)}
                      inputProps={{ min: 0 }}
                      placeholder="e.g. 8"
                      disabled={hasLockedCoverageHours}
                      helperText={hasLockedCoverageHours ? `Locked to package duration: ${selectedPackage?.durationHours} hrs` : undefined}
                    />
                  </Grid>
                </Grid>

                {/* Budget Insight Panel */}
                {(() => {
                  const selectedPkg = packageOptions.find((p) => p.id === formData.preferredPackage);
                  const packagePrice = selectedPkg?.price || 0;
                  const hasBudget = remainingBudget > 0;
                  const hasPackagePrice = packagePrice > 0;
                  if (!hasPackagePrice && !hasBudget) return null;
                  const afterBooking = hasBudget ? remainingBudget - packagePrice : null;
                  const isAffordable = afterBooking === null || afterBooking >= 0;
                  return (
                    <Box sx={{ borderRadius: 3, bgcolor: isAffordable ? 'rgba(26,107,114,0.05)' : 'rgba(211,47,47,0.05)', border: `1px solid ${isAffordable ? 'rgba(26,107,114,0.2)' : 'rgba(211,47,47,0.25)'}`, p: 2.5 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
                        <Package size={16} color={COLORS.primary} />
                        <Typography variant="subtitle2" fontWeight={700} color={COLORS.primary}>
                          Remaining Budget
                        </Typography>
                      </Box>
                      <Stack spacing={1}>
                        {hasPackagePrice && (
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Typography variant="body2" color="text.secondary">Selected package price</Typography>
                            <Typography variant="body2" fontWeight={700}>LKR {packagePrice.toLocaleString()}</Typography>
                          </Box>
                        )}
                        {hasBudget && (
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Typography variant="body2" color="text.secondary">Remaining wedding budget</Typography>
                            <Typography variant="body2" fontWeight={700}>LKR {remainingBudget.toLocaleString()}</Typography>
                          </Box>
                        )}
                        {hasPackagePrice && hasBudget && (
                          <>
                            <Divider sx={{ my: 0.5 }} />
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                                {isAffordable
                                  ? <TrendingUp size={15} color={COLORS.accent} />
                                  : <TrendingDown size={15} color="#d32f2f" />}
                                <Typography variant="body2" fontWeight={600}>
                                  {isAffordable ? 'Budget remaining after booking' : 'Over budget by'}
                                </Typography>
                              </Box>
                              <Typography variant="body2" fontWeight={800} color={isAffordable ? COLORS.accent : '#d32f2f'}>
                                LKR {Math.abs(afterBooking!).toLocaleString()}
                              </Typography>
                            </Box>
                            {!isAffordable && (
                              <Typography variant="caption" color="error">
                                This package exceeds your remaining wedding budget. Consider choosing a different package or reviewing your budget.
                              </Typography>
                            )}
                          </>
                        )}
                        {hasPackagePrice && !hasBudget && (
                          <Typography variant="caption" color="text.secondary">
                            Set your wedding budget in the dashboard to see how this package fits your plan.
                          </Typography>
                        )}
                        {hasPackagePrice && (
                          <Typography variant="caption" sx={{ color: COLORS.accent, mt: 0.5 }}>
                            Submitting this request will add this package as a pending expense in your Budget tab.
                          </Typography>
                        )}
                      </Stack>
                    </Box>
                  );
                })()}

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
            <Typography variant="body1" sx={{ color: 'text.secondary', mb: 2 }}>
              The vendor now has your full quote brief.
            </Typography>
            {packageOptions.find((p) => p.id === formData.preferredPackage)?.price ? (
              <Typography variant="body2" sx={{ color: COLORS.accent, mb: 3 }}>
                The selected package has been added as a pending expense in your Budget tab.
              </Typography>
            ) : (
              <Box sx={{ mb: 3 }} />
            )}
            <Button variant="contained" fullWidth onClick={onClose} sx={{ bgcolor: COLORS.primary, borderRadius: 3, fontWeight: 700 }}>
              Close
            </Button>
          </motion.div>
        )}
      </AnimatePresence>

      <Backdrop
        open={isSubmitting}
        sx={{
          zIndex: (theme) => theme.zIndex.modal + 5,
          backdropFilter: 'blur(5px)',
          backgroundColor: 'rgba(20,20,20,0.25)',
          color: '#fff',
          flexDirection: 'column',
          gap: 1,
        }}
      >
        <CircularProgress color="inherit" />
        <Typography variant="body2" sx={{ fontWeight: 600 }}>Sending request...</Typography>
      </Backdrop>
    </Dialog>
  );
}
