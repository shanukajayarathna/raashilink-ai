import React, { useEffect, useState } from 'react';
import { 
  Box, 
  Typography, 
  Paper, 
  Grid, 
  Button, 
  Chip, 
  Avatar, 
  IconButton, 
  Divider,
  TextField,
  alpha,
  useTheme,
  Tooltip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow
} from '@mui/material';
import {
  Backdrop,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
} from '@mui/material';
import { 
  Calendar, 
  MapPin, 
  DollarSign, 
  CheckCircle2, 
  Clock, 
  User, 
  MoreVertical,
  Filter,
  Search,
  ChevronRight,
  Phone,
  Mail,
  ExternalLink
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { format } from 'date-fns';
import vendorService from '../../services/vendorService';

const COLORS = {
  primary: '#8B1A2E',
  secondary: '#C9A84C',
  accent: '#1A6B72',
  background: '#FAF7F2',
  textPrimary: '#1C1C1C',
  textSecondary: '#555555',
};

const PAYMENT_STATUS_COLORS: Record<string, { color: string; bg: string }> = {
  paid:    { color: '#2e7d32', bg: 'rgba(46,125,50,0.1)' },
  partial: { color: COLORS.secondary, bg: alpha(COLORS.secondary, 0.1) },
  pending: { color: '#d32f2f', bg: 'rgba(211,47,47,0.1)' },
};

interface Booking {
  id: string;
  coupleName: string;
  eventDate: string;
  venue: string;
  amount: string;
  paymentStatus: string;
  status: string;
  email: string;
  phone: string;
  raw: any;
}

interface BookingsManagerProps {
  quotes?: any[];
}

export default function BookingsManager({ quotes = [] }: BookingsManagerProps) {
  const bookings: Booking[] = quotes
    .filter(q => q.status === 'accepted')
    .map(q => {
      const d = q.weddingDate ? new Date(q.weddingDate) : null;
      const isValidDate = d && !isNaN(d.getTime());
      return {
        id: q.id,
        coupleName: q.coupleName,
        eventDate: isValidDate ? format(d, 'yyyy-MM-dd') : 'Date Pending',
        venue: q.venueName || q.location || 'Location Pending',
        amount: `LKR ${Number(q.response?.price || 0).toLocaleString()}`,
        paymentStatus: q.paymentStatus || 'pending',
        status: 'Confirmed',
        email: q.contactEmail || '',
        phone: q.contactPhone || '',
        raw: q
      };
    });

  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(bookings[0] || null);
  const [cancelConfirm, setCancelConfirm] = useState<Booking | null>(null);
  const [cancelReason, setCancelReason] = useState('');
  const [cancelling, setCancelling] = useState(false);
  const [paymentUpdating, setPaymentUpdating] = useState<string | null>(null);
  const [localPaymentStatus, setLocalPaymentStatus] = useState<Record<string, string>>({});

  useEffect(() => {
    if (bookings.length === 0) {
      setSelectedBooking(null);
      return;
    }

    setSelectedBooking((prev) => {
      if (!prev) return bookings[0];
      return bookings.find((item) => item.id === prev.id) || bookings[0];
    });
  }, [bookings]);

  const handlePaymentStatusChange = async (bookingId: string, newStatus: string) => {
    setPaymentUpdating(bookingId);
    setLocalPaymentStatus(prev => ({ ...prev, [bookingId]: newStatus }));
    try {
      await vendorService.updateQuoteRequest(bookingId, { paymentStatus: newStatus });
    } catch {
      setLocalPaymentStatus(prev => {
        const copy = { ...prev };
        delete copy[bookingId];
        return copy;
      });
    } finally {
      setPaymentUpdating(null);
    }
  };

  const handleCancelBooking = async () => {
    if (!cancelConfirm) return;
    setCancelling(true);
    try {
      await vendorService.updateQuoteRequest(cancelConfirm.id, {
        status: 'cancelled_by_vendor',
        message: cancelReason.trim() || 'Cancelled by vendor',
      });
      setCancelConfirm(null);
      setCancelReason('');
      setSelectedBooking(null);
      window.dispatchEvent(new CustomEvent('vendor:quote_arrived'));
    } catch {
      // silent — list will refresh on next poll
    } finally {
      setCancelling(false);
    }
  };

  const getPaymentChip = (bookingId: string, rawStatus: string) => {
    const ps = localPaymentStatus[bookingId] || rawStatus || 'pending';
    const cfg = PAYMENT_STATUS_COLORS[ps] || PAYMENT_STATUS_COLORS.pending;
    const label = ps.charAt(0).toUpperCase() + ps.slice(1);
    return (
      <Chip
        label={label}
        size="small"
        sx={{ bgcolor: cfg.bg, color: cfg.color, fontWeight: 700, borderRadius: '6px', fontSize: '0.7rem' }}
      />
    );
  };

  return (
    <Box>
      {/* Blur overlay while cancelling */}
      <Backdrop open={cancelling} sx={{ zIndex: theme => theme.zIndex.modal + 1, backdropFilter: 'blur(4px)', bgcolor: 'rgba(0,0,0,0.3)' }}>
        <CircularProgress sx={{ color: 'white' }} />
      </Backdrop>

      {/* Cancel confirmation dialog */}
      <Dialog open={!!cancelConfirm} onClose={() => !cancelling && setCancelConfirm(null)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontFamily: 'Playfair Display', fontWeight: 700 }}>Cancel Booking?</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to cancel the booking for <strong>{cancelConfirm?.coupleName}</strong>? The couple will be notified immediately and the booking will be reset.
          </Typography>
          <TextField
            fullWidth
            multiline
            minRows={3}
            label="Cancellation reason"
            placeholder="Share the reason for cancellation (visible to the couple)."
            value={cancelReason}
            onChange={(e) => setCancelReason(e.target.value)}
            sx={{ mt: 2 }}
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button
            onClick={() => {
              setCancelConfirm(null);
              setCancelReason('');
            }}
            disabled={cancelling}
            sx={{ textTransform: 'none' }}
          >
            Keep Booking
          </Button>
          <Button
            variant="contained"
            onClick={handleCancelBooking}
            disabled={cancelling}
            sx={{ bgcolor: '#d32f2f', textTransform: 'none', '&:hover': { bgcolor: '#b71c1c' } }}
          >
            {cancelling ? <CircularProgress size={18} sx={{ color: 'white' }} /> : 'Confirm Cancellation'}
          </Button>
        </DialogActions>
      </Dialog>

      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box>
          <Typography variant="h5" sx={{ fontFamily: 'Playfair Display', fontWeight: 700, color: COLORS.primary }}>
            Bookings Manager
          </Typography>
          <Typography variant="body2" color="textSecondary">
            Manage your confirmed wedding bookings and track payments.
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1.5 }}>
          <Button 
            variant="outlined" 
            startIcon={<Calendar size={18} />}
            sx={{ color: COLORS.primary, borderColor: COLORS.primary, borderRadius: '10px', textTransform: 'none' }}
          >
            Calendar View
          </Button>
          <Button 
            variant="contained" 
            startIcon={<Filter size={18} />}
            sx={{ bgcolor: COLORS.primary, borderRadius: '10px', textTransform: 'none', '&:hover': { bgcolor: '#6b1423' } }}
          >
            Filter
          </Button>
        </Box>
      </Box>

      <Grid container spacing={3}>
        {/* Summary Stats */}
        <Grid size={{ xs: 12 }}>
          <Paper elevation={0} sx={{ p: 3, borderRadius: '20px', border: '1px solid rgba(139,26,46,0.08)', display: 'flex', gap: { xs: 2, md: 6 }, flexWrap: 'wrap' }}>
            <Box>
              <Typography variant="caption" color="textSecondary" sx={{ fontWeight: 600, textTransform: 'uppercase' }}>Total Bookings</Typography>
              <Typography variant="h4" sx={{ fontWeight: 700, color: COLORS.primary }}>{bookings.length}</Typography>
            </Box>
            <Divider orientation="vertical" flexItem sx={{ display: { xs: 'none', md: 'block' } }} />
            <Box>
              <Typography variant="caption" color="textSecondary" sx={{ fontWeight: 600, textTransform: 'uppercase' }}>Upcoming Events</Typography>
              <Typography variant="h4" sx={{ fontWeight: 700, color: COLORS.accent }}>
                {bookings.filter((b) => {
                  const d = new Date(b.eventDate);
                  return !Number.isNaN(d.getTime()) && d >= new Date();
                }).length}
              </Typography>
            </Box>
            <Divider orientation="vertical" flexItem sx={{ display: { xs: 'none', md: 'block' } }} />
            <Box>
              <Typography variant="caption" color="textSecondary" sx={{ fontWeight: 600, textTransform: 'uppercase' }}>Confirmed Revenue</Typography>
              <Typography variant="h4" sx={{ fontWeight: 700, color: '#2e7d32' }}>
                LKR {(bookings.reduce((sum, b) => sum + Number(b.raw.response?.price || 0), 0) / 1000000).toFixed(1)}M
              </Typography>
            </Box>
          </Paper>
        </Grid>

        {/* Bookings Table */}
        <Grid size={{ xs: 12 }}>
          <TableContainer component={Paper} elevation={0} sx={{ borderRadius: '20px', border: '1px solid rgba(0,0,0,0.08)', overflow: 'hidden' }}>
            <Table>
              <TableHead sx={{ bgcolor: 'rgba(0,0,0,0.02)' }}>
                <TableRow>
                  <TableCell sx={{ fontWeight: 700 }}>Couple</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Event Date</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Venue</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Amount</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Payment</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Status</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {bookings.map((booking) => (
                  <TableRow
                    key={booking.id}
                    hover
                    onClick={() => setSelectedBooking(booking)}
                    sx={{
                      '&:last-child td, &:last-child th': { border: 0 },
                      cursor: 'pointer',
                      bgcolor: selectedBooking?.id === booking.id ? alpha(COLORS.primary, 0.04) : 'transparent',
                    }}
                  >
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                        <Avatar sx={{ width: 32, height: 32, bgcolor: alpha(COLORS.primary, 0.1), color: COLORS.primary, fontSize: '0.8rem', fontWeight: 700 }}>
                          {booking.coupleName.charAt(0)}
                        </Avatar>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>{booking.coupleName}</Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" sx={{ fontWeight: 500 }}>{booking.eventDate}</Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" color="textSecondary" sx={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{booking.venue}</Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>{booking.amount}</Typography>
                    </TableCell>
                    <TableCell>
                      {getPaymentChip(booking.id, booking.paymentStatus)}
                    </TableCell>
                    <TableCell>
                      <Chip 
                        label={booking.status} 
                        size="small" 
                        sx={{ bgcolor: alpha(COLORS.accent, 0.1), color: COLORS.accent, fontWeight: 700, borderRadius: '6px' }} 
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Grid>

        {/* Detailed View / Contact Section */}
        <Grid size={{ xs: 12, lg: 4 }}>
          <Paper elevation={0} sx={{ p: 3, borderRadius: '20px', border: '1px solid rgba(139,26,46,0.08)', height: '100%' }}>
            <Typography variant="h6" sx={{ fontWeight: 700, mb: 3 }}>Booking Details</Typography>
            {selectedBooking ? (
              <>
                <Box sx={{ textAlign: 'center', mb: 3 }}>
                  <Avatar sx={{ width: 80, height: 80, mx: 'auto', mb: 2, bgcolor: alpha(COLORS.primary, 0.1), color: COLORS.primary }}>
                    <User size={40} />
                  </Avatar>
                  <Typography variant="h6" sx={{ fontWeight: 700 }}>{selectedBooking.coupleName}</Typography>
                  <Typography variant="body2" color="textSecondary">
                    Wedding • {selectedBooking.eventDate !== 'Date Pending' ? format(new Date(selectedBooking.eventDate), 'MMM dd, yyyy') : 'Date Pending'}
                  </Typography>
                </Box>
                
                {/* Contact links */}
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, mb: 3 }}>
                  {selectedBooking.phone ? (
                    <Box component="a" href={`tel:${selectedBooking.phone}`}
                      sx={{ display: 'flex', alignItems: 'center', gap: 2, p: 2, borderRadius: '12px', bgcolor: 'rgba(0,0,0,0.02)', textDecoration: 'none', color: 'inherit', '&:hover': { bgcolor: alpha(COLORS.primary, 0.05) } }}>
                      <Phone size={18} color={COLORS.primary} />
                      <Box>
                        <Typography variant="caption" color="textSecondary">Phone</Typography>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>{selectedBooking.phone}</Typography>
                      </Box>
                    </Box>
                  ) : (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, p: 2, borderRadius: '12px', bgcolor: 'rgba(0,0,0,0.02)' }}>
                      <Phone size={18} color={COLORS.textSecondary} />
                      <Typography variant="body2" color="textSecondary">Phone not provided</Typography>
                    </Box>
                  )}
                  {selectedBooking.email ? (
                    <Box component="a" href={`mailto:${selectedBooking.email}`}
                      sx={{ display: 'flex', alignItems: 'center', gap: 2, p: 2, borderRadius: '12px', bgcolor: 'rgba(0,0,0,0.02)', textDecoration: 'none', color: 'inherit', '&:hover': { bgcolor: alpha(COLORS.primary, 0.05) } }}>
                      <Mail size={18} color={COLORS.primary} />
                      <Box>
                        <Typography variant="caption" color="textSecondary">Email</Typography>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>{selectedBooking.email}</Typography>
                      </Box>
                    </Box>
                  ) : (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, p: 2, borderRadius: '12px', bgcolor: 'rgba(0,0,0,0.02)' }}>
                      <Mail size={18} color={COLORS.textSecondary} />
                      <Typography variant="body2" color="textSecondary">Email not provided</Typography>
                    </Box>
                  )}
                </Box>

                {/* Payment Status */}
                <FormControl fullWidth size="small" sx={{ mb: 2 }}>
                  <InputLabel>Payment Status</InputLabel>
                  <Select
                    label="Payment Status"
                    value={localPaymentStatus[selectedBooking.id] || selectedBooking.paymentStatus || 'pending'}
                    disabled={paymentUpdating === selectedBooking.id}
                    onChange={e => handlePaymentStatusChange(selectedBooking.id, e.target.value)}
                  >
                    <MenuItem value="pending">Pending</MenuItem>
                    <MenuItem value="partial">Partial</MenuItem>
                    <MenuItem value="paid">Paid</MenuItem>
                  </Select>
                </FormControl>

                <Divider sx={{ my: 2 }} />

                {/* Cancel Booking */}
                <Button fullWidth variant="outlined"
                  onClick={() => {
                    setCancelConfirm(selectedBooking);
                    setCancelReason('');
                  }}
                  sx={{ color: '#d32f2f', borderColor: '#d32f2f', borderRadius: '12px', textTransform: 'none', fontWeight: 700, '&:hover': { bgcolor: 'rgba(211,47,47,0.05)', borderColor: '#b71c1c' } }}>
                  Cancel This Booking
                </Button>
                <Typography variant="caption" color="textSecondary" sx={{ display: 'block', textAlign: 'center', mt: 1 }}>
                  The couple will be notified immediately.
                </Typography>
              </>
            ) : (
              <Typography variant="body2" color="textSecondary" sx={{ textAlign: 'center', py: 4 }}>
                Select a booking from the list to view details.
              </Typography>
            )}
          </Paper>
        </Grid>

        <Grid size={{ xs: 12, lg: 8 }}>
          <Paper elevation={0} sx={{ p: 3, borderRadius: '20px', border: '1px solid rgba(139,26,46,0.08)', height: '100%' }}>
            <Typography variant="h6" sx={{ fontWeight: 700, mb: 3 }}>Upcoming Schedule</Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {bookings.length > 0 ? bookings.slice(0, 5).map((item, i) => (
                <Box key={i} 
                  onClick={() => setSelectedBooking(item)}
                  sx={{ display: 'flex', alignItems: 'center', gap: 3, p: 2, borderRadius: '16px', border: '1px solid rgba(0,0,0,0.05)', cursor: 'pointer', '&:hover': { bgcolor: 'rgba(0,0,0,0.02)' } }}
                >
                  <Box sx={{ textAlign: 'center', minWidth: 60, p: 1, borderRadius: '10px', bgcolor: alpha(COLORS.primary, 0.05), color: COLORS.primary }}>
                    <Typography variant="h6" sx={{ fontWeight: 800, lineHeight: 1 }}>
                      {item.eventDate !== 'Date Pending' ? format(new Date(item.eventDate), 'dd') : '--'}
                    </Typography>
                    <Typography variant="caption" sx={{ fontWeight: 700, textTransform: 'uppercase' }}>
                      {item.eventDate !== 'Date Pending' ? format(new Date(item.eventDate), 'MMM') : 'TBD'}
                    </Typography>
                  </Box>
                  <Box sx={{ flexGrow: 1 }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>{item.coupleName}</Typography>
                    <Typography variant="body2" color="textSecondary">{item.venue}</Typography>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, color: COLORS.textSecondary }}>
                    <MapPin size={14} />
                    <Typography variant="caption" sx={{ fontWeight: 600 }}>{item.venue.split(',')[0]}</Typography>
                  </Box>
                  <IconButton size="small">
                    <ChevronRight size={20} />
                  </IconButton>
                </Box>
              )) : (
                <Typography variant="body2" color="textSecondary" sx={{ textAlign: 'center', py: 4 }}>
                  No upcoming bookings found.
                </Typography>
              )}
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
}

