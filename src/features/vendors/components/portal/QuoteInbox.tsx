import React, { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Avatar,
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  Grid,
  MenuItem,
  Paper,
  Skeleton,
  Stack,
  TextField,
  Typography,
  alpha,
} from '@mui/material';

import {
  Calendar,
  CheckCircle2,
  Clock,
  DollarSign,
  MapPin,
  MessageSquare,
  Phone,
  Search,
  User,
  XCircle,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import vendorService from '../../services/vendorService';

const COLORS = {
  primary: '#8B1A2E',
  secondary: '#C9A84C',
  accent: '#1A6B72',
  background: '#FAF7F2',
  textPrimary: '#1C1C1C',
  textSecondary: '#555555',
};

type QuoteStatus = 'new' | 'responded' | 'accepted' | 'declined';

interface QuoteRequest {
  id: string;
  coupleName: string;
  weddingDate: string;
  location: string;
  venueName?: string;
  budget: string;
  guestCount: number;
  selectedPackageId?: string;
  selectedPackageName?: string;
  preferredPackage?: string;
  coverageHours?: number;
  requirements: string;
  contactEmail?: string;
  contactPhone?: string;
  preferredContactMethod?: string;
  status: QuoteStatus;
  createdAt: string;
  response?: {
    price?: number;
    packageName?: string;
    message?: string;
    scheduledStart?: string;
    scheduledEnd?: string;
    respondedAt?: string;
  } | null;
}

export default function QuoteInbox() {
  const [quotes, setQuotes] = useState<QuoteRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedQuote, setSelectedQuote] = useState<QuoteRequest | null>(null);
  const [isQuoteModalOpen, setIsQuoteModalOpen] = useState(false);
  const [isDeclineModalOpen, setIsDeclineModalOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | QuoteStatus>('all');
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [quoteForm, setQuoteForm] = useState({
    price: '',
    packageName: 'Custom Quote',
    message: '',
    scheduledDate: '',
    startTime: '10:00',
    endTime: '14:00',
  });

  const fetchQuotes = async () => {
    try {
      setLoading(true);
      const response = await vendorService.getQuoteInbox();
      setQuotes(Array.isArray(response?.data?.items) ? response.data.items : []);
    } catch (error) {
      console.error('Failed to load quote inbox', error);
      setQuotes([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQuotes();

    const intervalId = window.setInterval(() => {
      fetchQuotes();
    }, 15000);

    const handleRefresh = () => {
      fetchQuotes();
    };

    window.addEventListener('focus', handleRefresh);
    window.addEventListener('app:refresh', handleRefresh as EventListener);

    return () => {
      window.clearInterval(intervalId);
      window.removeEventListener('focus', handleRefresh);
      window.removeEventListener('app:refresh', handleRefresh as EventListener);
    };
  }, []);

  const filteredQuotes = useMemo(() => {
    return quotes.filter((quote) => {
      const matchesSearch =
        !search ||
        quote.coupleName.toLowerCase().includes(search.toLowerCase()) ||
        quote.location.toLowerCase().includes(search.toLowerCase()) ||
        quote.requirements.toLowerCase().includes(search.toLowerCase());
      const matchesStatus = statusFilter === 'all' || quote.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [quotes, search, statusFilter]);

  const handleApprove = async () => {
    if (!selectedQuote) return;
    if (!quoteForm.scheduledDate || !quoteForm.startTime || !quoteForm.endTime) return;
    setSubmitting(true);
    setSubmitError('');
    try {
      await vendorService.updateQuoteRequest(selectedQuote.id, {
        status: 'accepted',
        price: Number(quoteForm.price || 0),
        packageName: quoteForm.packageName,
        message: quoteForm.message,
        scheduledDate: quoteForm.scheduledDate,
        startTime: quoteForm.startTime,
        endTime: quoteForm.endTime,
      });
      setIsQuoteModalOpen(false);
      setSelectedQuote(null);
      await fetchQuotes();
    } catch (error: any) {
      setSubmitError(error?.response?.data?.message || error?.message || 'Failed to confirm booking. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDecline = async () => {
    if (!selectedQuote) return;
    setSubmitting(true);
    setSubmitError('');
    try {
      await vendorService.updateQuoteRequest(selectedQuote.id, {
        status: 'declined',
        message: quoteForm.message || 'Declined by vendor',
      });
      setIsDeclineModalOpen(false);
      setSelectedQuote(null);
      await fetchQuotes();
    } catch (error: any) {
      setSubmitError(error?.response?.data?.message || error?.message || 'Failed to decline. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusChip = (status: QuoteStatus) => {
    const configs = {
      new: { label: 'New Request', color: COLORS.primary, icon: <Clock size={14} />, bg: alpha(COLORS.primary, 0.1) },
      responded: { label: 'Responded', color: COLORS.accent, icon: <CheckCircle2 size={14} />, bg: alpha(COLORS.accent, 0.1) },
      accepted: { label: 'Accepted', color: '#2e7d32', icon: <CheckCircle2 size={14} />, bg: 'rgba(46, 125, 50, 0.1)' },
      declined: { label: 'Declined', color: '#d32f2f', icon: <XCircle size={14} />, bg: 'rgba(211, 47, 47, 0.1)' },
    } as const;

    const config = configs[status];
    return <Chip label={config.label} icon={config.icon} sx={{ bgcolor: config.bg, color: config.color, fontWeight: 600, borderRadius: '8px', '& .MuiChip-icon': { color: 'inherit' } }} />;
  };

  if (loading) {
    return (
      <Box>
        <Skeleton variant="text" width={220} height={40} sx={{ mb: 2 }} />
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} variant="rectangular" height={180} sx={{ borderRadius: '16px', mb: 2 }} />
        ))}
      </Box>
    );
  }

  return (
    <Box>
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
        <Box>
          <Typography variant="h5" sx={{ fontFamily: 'Playfair Display', fontWeight: 700, color: COLORS.primary }}>
            Quote Requests Inbox
          </Typography>
          <Typography variant="body2" color="textSecondary">
            Real quote requests sent from couples in the marketplace and wedding planner.
          </Typography>
        </Box>
        <Stack direction="row" spacing={1.5} sx={{ flexWrap: 'wrap' }}>
          <Paper elevation={0} sx={{ p: 1, borderRadius: '10px', border: '1px solid rgba(0,0,0,0.08)', display: 'flex', alignItems: 'center', gap: 1 }}>
            <Search size={18} color={COLORS.textSecondary} />
            <TextField placeholder="Search couples..." variant="standard" value={search} onChange={(e) => setSearch(e.target.value)} InputProps={{ disableUnderline: true }} sx={{ width: 200 }} />
          </Paper>
          <TextField select size="small" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as any)} sx={{ minWidth: 160, bgcolor: 'white' }}>
            <MenuItem value="all">All statuses</MenuItem>
            <MenuItem value="new">New</MenuItem>
            <MenuItem value="responded">Responded</MenuItem>
            <MenuItem value="accepted">Accepted</MenuItem>
            <MenuItem value="declined">Declined</MenuItem>
          </TextField>
        </Stack>
      </Box>

      {filteredQuotes.length === 0 ? (
        <Alert severity="info" sx={{ borderRadius: 3 }}>
          No quote requests matched your current filters.
        </Alert>
      ) : (
        <Grid container spacing={2}>
          <AnimatePresence>
            {filteredQuotes.map((quote) => (
              <Grid size={{ xs: 12 }} key={quote.id}>
                <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} transition={{ duration: 0.2 }}>
                  <Paper elevation={0} sx={{ p: 3, borderRadius: '16px', border: '1px solid rgba(139,26,46,0.08)', boxShadow: '0 2px 16px rgba(139,26,46,0.04)' }}>
                    <Grid container spacing={3} alignItems="center">
                      <Grid size={{ xs: 12, md: 4 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                          <Avatar sx={{ width: 56, height: 56, bgcolor: alpha(COLORS.primary, 0.1), color: COLORS.primary }}>
                            <User size={28} />
                          </Avatar>
                          <Box>
                            <Typography variant="h6" sx={{ fontWeight: 700 }}>{quote.coupleName}</Typography>
                            <Typography variant="caption" color="textSecondary" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                              <Clock size={12} /> Received {new Date(quote.createdAt).toLocaleDateString()}
                            </Typography>
                          </Box>
                        </Box>
                      </Grid>

                      <Grid size={{ xs: 12, md: 5 }}>
                        <Grid container spacing={2}>
                          <Grid size={{ xs: 6 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, color: COLORS.textSecondary }}>
                              <Calendar size={16} color={COLORS.primary} />
                              <Typography variant="body2">{quote.weddingDate ? new Date(quote.weddingDate).toLocaleDateString() : 'Not set'}</Typography>
                            </Box>
                          </Grid>
                          <Grid size={{ xs: 6 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, color: COLORS.textSecondary }}>
                              <MapPin size={16} color={COLORS.primary} />
                              <Typography variant="body2">{quote.location || 'Location pending'}</Typography>
                            </Box>
                          </Grid>
                          <Grid size={{ xs: 6 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, color: COLORS.textSecondary }}>
                              <DollarSign size={16} color={COLORS.primary} />
                              <Typography variant="body2" sx={{ fontWeight: 600 }}>{quote.budget}</Typography>
                            </Box>
                          </Grid>
                          <Grid size={{ xs: 6 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, color: COLORS.textSecondary }}>
                              <Phone size={16} color={COLORS.primary} />
                              <Typography variant="body2">{quote.contactPhone || 'No phone provided'}</Typography>
                            </Box>
                          </Grid>
                        </Grid>
                      </Grid>

                      <Grid size={{ xs: 12, md: 3 }} sx={{ display: 'flex', flexDirection: 'column', alignItems: { md: 'flex-end' }, gap: 2 }}>
                        {getStatusChip(quote.status)}
                        <Box sx={{ display: 'flex', gap: 1 }}>
                          {quote.status === 'new' || quote.status === 'responded' ? (
                            <>
                              <Button
                                variant="contained"
                                size="small"
                                onClick={() => {
                                  setSelectedQuote(quote);
                                  setQuoteForm({
                                    price: quote.response?.price ? String(quote.response.price) : '',
                                    packageName: quote.selectedPackageName || quote.preferredPackage || 'Custom Quote',
                                    message: quote.response?.message || '',
                                    scheduledDate: quote.weddingDate ? new Date(quote.weddingDate).toISOString().split('T')[0] : '',
                                    startTime: '10:00',
                                    endTime: '14:00',
                                  });
                                  setIsQuoteModalOpen(true);
                                }}
                                sx={{ bgcolor: COLORS.primary, borderRadius: '8px', textTransform: 'none', '&:hover': { bgcolor: '#6b1423' } }}
                              >
                                Approve & Confirm
                              </Button>
                              <Button
                                variant="outlined"
                                size="small"
                                onClick={() => {
                                  setSelectedQuote(quote);
                                  setQuoteForm({ price: '', packageName: '', message: '', scheduledDate: '', startTime: '10:00', endTime: '14:00' });
                                  setIsDeclineModalOpen(true);
                                }}
                                sx={{ color: COLORS.textSecondary, borderColor: 'rgba(0,0,0,0.1)', borderRadius: '8px', textTransform: 'none' }}
                              >
                                Decline
                              </Button>
                            </>
                          ) : null}
                        </Box>
                      </Grid>

                      <Grid size={{ xs: 12 }}>
                        <Divider sx={{ my: 1, borderStyle: 'dashed' }} />
                        <Stack spacing={1}>
                          {quote.venueName ? <Typography variant="body2" sx={{ color: COLORS.textSecondary }}><strong>Venue:</strong> {quote.venueName}</Typography> : null}
                          {quote.guestCount ? <Typography variant="body2" sx={{ color: COLORS.textSecondary }}><strong>Guests:</strong> {quote.guestCount}</Typography> : null}
                          {quote.coverageHours ? <Typography variant="body2" sx={{ color: COLORS.textSecondary }}><strong>Coverage:</strong> {quote.coverageHours} hours</Typography> : null}
                          {quote.selectedPackageName || quote.preferredPackage ? <Typography variant="body2" sx={{ color: COLORS.textSecondary }}><strong>Requested package:</strong> {quote.selectedPackageName || quote.preferredPackage}</Typography> : null}
                          {quote.response?.scheduledStart ? (
                            <Typography variant="body2" sx={{ color: COLORS.textSecondary }}><strong>Confirmed slot:</strong> {new Date(quote.response.scheduledStart).toLocaleString()}</Typography>
                          ) : null}
                          <Typography variant="body2" sx={{ color: COLORS.textSecondary, fontStyle: 'italic' }}>
                            "{quote.requirements || 'No extra requirements added.'}"
                          </Typography>
                          {quote.response?.message ? (
                            <Box sx={{ mt: 1, p: 2, borderRadius: 2, bgcolor: alpha(COLORS.accent, 0.08) }}>
                              <Typography variant="caption" sx={{ fontWeight: 700, color: COLORS.accent }}>Your last response</Typography>
                              <Typography variant="body2" sx={{ color: COLORS.textSecondary }}>{quote.response.message}</Typography>
                            </Box>
                          ) : null}
                        </Stack>
                      </Grid>
                    </Grid>
                  </Paper>
                </motion.div>
              </Grid>
            ))}
          </AnimatePresence>
        </Grid>
      )}

      <Dialog open={isQuoteModalOpen} onClose={() => setIsQuoteModalOpen(false)} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: '20px', p: 1 } }}>
        <DialogTitle sx={{ fontWeight: 700, fontFamily: 'Playfair Display', color: COLORS.primary }}>
          Approve Request for {selectedQuote?.coupleName}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2, display: 'flex', flexDirection: 'column', gap: 3 }}>
            <TextField label="Quoted Price (LKR)" fullWidth value={quoteForm.price} onChange={(e) => setQuoteForm({ ...quoteForm, price: e.target.value })} placeholder="e.g. 250000" />
            <TextField label="Package Name" fullWidth value={quoteForm.packageName} onChange={(e) => setQuoteForm({ ...quoteForm, packageName: e.target.value })} />
            <Grid container spacing={2}>
              <Grid size={{ xs: 12, sm: 4 }}>
                <TextField label="Event Date" type="date" fullWidth value={quoteForm.scheduledDate} onChange={(e) => setQuoteForm({ ...quoteForm, scheduledDate: e.target.value })} InputLabelProps={{ shrink: true }} />
              </Grid>
              <Grid size={{ xs: 12, sm: 4 }}>
                <TextField label="Start Time" type="time" fullWidth value={quoteForm.startTime} onChange={(e) => setQuoteForm({ ...quoteForm, startTime: e.target.value })} InputLabelProps={{ shrink: true }} />
              </Grid>
              <Grid size={{ xs: 12, sm: 4 }}>
                <TextField label="End Time" type="time" fullWidth value={quoteForm.endTime} onChange={(e) => setQuoteForm({ ...quoteForm, endTime: e.target.value })} InputLabelProps={{ shrink: true }} />
              </Grid>
            </Grid>
            <TextField label="Personal Message" fullWidth multiline rows={4} value={quoteForm.message} onChange={(e) => setQuoteForm({ ...quoteForm, message: e.target.value })} placeholder="Describe what is included, any limits, and next steps." />
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 3, flexDirection: 'column', alignItems: 'stretch', gap: 1 }}>
          {submitError && (
            <Alert severity="error" sx={{ borderRadius: '10px', mb: 1 }} onClose={() => setSubmitError('')}>{submitError}</Alert>
          )}
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
            <Button onClick={() => setIsQuoteModalOpen(false)} sx={{ color: COLORS.textSecondary }}>Cancel</Button>
            <Button variant="contained" onClick={handleApprove} disabled={submitting} startIcon={<MessageSquare size={18} />} sx={{ bgcolor: COLORS.primary, borderRadius: '10px', px: 4, '&:hover': { bgcolor: '#6b1423' } }}>
              {submitting ? 'Confirming...' : 'Confirm Booking'}
            </Button>
          </Box>
        </DialogActions>
      </Dialog>

      <Dialog open={isDeclineModalOpen} onClose={() => setIsDeclineModalOpen(false)} maxWidth="xs" fullWidth PaperProps={{ sx: { borderRadius: '20px', p: 1 } }}>
        <DialogTitle sx={{ fontWeight: 700, color: '#d32f2f' }}>
          Decline Request
        </DialogTitle>
        <DialogContent>
          <TextField
            label="Reason"
            fullWidth
            multiline
            minRows={3}
            value={quoteForm.message}
            onChange={(e) => setQuoteForm({ ...quoteForm, message: e.target.value })}
            placeholder="Tell the couple why you are declining."
            sx={{ mt: 1 }}
          />
        </DialogContent>
        <DialogActions sx={{ p: 3, flexDirection: 'column', alignItems: 'stretch', gap: 1 }}>
          {submitError && (
            <Alert severity="error" sx={{ borderRadius: '10px', mb: 1 }} onClose={() => setSubmitError('')}>{submitError}</Alert>
          )}
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
            <Button onClick={() => setIsDeclineModalOpen(false)} sx={{ color: COLORS.textSecondary }}>Cancel</Button>
            <Button variant="contained" onClick={handleDecline} disabled={submitting} sx={{ bgcolor: '#d32f2f', borderRadius: '10px', px: 4, '&:hover': { bgcolor: '#b71c1c' } }}>
              {submitting ? 'Declining...' : 'Decline'}
            </Button>
          </Box>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
