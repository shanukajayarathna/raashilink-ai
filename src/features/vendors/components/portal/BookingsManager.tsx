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
  alpha,
  useTheme,
  Tooltip,
  Badge,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow
} from '@mui/material';
import { 
  Calendar, 
  MapPin, 
  DollarSign, 
  CheckCircle2, 
  Clock, 
  User, 
  MessageSquare, 
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

const COLORS = {
  primary: '#8B1A2E',
  secondary: '#C9A84C',
  accent: '#1A6B72',
  background: '#FAF7F2',
  textPrimary: '#1C1C1C',
  textSecondary: '#555555',
};

interface Booking {
  id: string;
  coupleName: string;
  eventDate: string;
  venue: string;
  amount: string;
  paymentStatus: 'Paid' | 'Partial' | 'Pending';
  status: 'Confirmed' | 'Completed' | 'Cancelled';
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
        paymentStatus: 'Pending',
        status: 'Confirmed',
        email: q.contactEmail || '',
        phone: q.contactPhone || '',
        raw: q
      };
    });

  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(bookings[0] || null);

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

  const getPaymentChip = (status: string) => {
    const configs: any = {
      Paid: { color: '#2e7d32', bg: 'rgba(46, 125, 50, 0.1)' },
      Partial: { color: COLORS.secondary, bg: alpha(COLORS.secondary, 0.1) },
      Pending: { color: '#d32f2f', bg: 'rgba(211, 47, 47, 0.1)' }
    };
    const config = configs[status];
    return (
      <Chip 
        label={status} 
        size="small"
        sx={{ 
          bgcolor: config.bg, 
          color: config.color, 
          fontWeight: 700,
          borderRadius: '6px',
          fontSize: '0.7rem'
        }} 
      />
    );
  };

  return (
    <Box>
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
                  <TableCell align="right" sx={{ fontWeight: 700 }}>Actions</TableCell>
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
                      {getPaymentChip(booking.paymentStatus)}
                    </TableCell>
                    <TableCell>
                      <Chip 
                        label={booking.status} 
                        size="small" 
                        sx={{ bgcolor: alpha(COLORS.accent, 0.1), color: COLORS.accent, fontWeight: 700, borderRadius: '6px' }} 
                      />
                    </TableCell>
                    <TableCell align="right">
                      <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
                        <Tooltip title="Contact Couple">
                          <IconButton size="small" sx={{ color: COLORS.primary, bgcolor: alpha(COLORS.primary, 0.05) }}>
                            <MessageSquare size={16} />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="View Details">
                          <IconButton size="small" sx={{ color: COLORS.textSecondary, bgcolor: 'rgba(0,0,0,0.05)' }}>
                            <ExternalLink size={16} />
                          </IconButton>
                        </Tooltip>
                      </Box>
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
            <Typography variant="h6" sx={{ fontWeight: 700, mb: 3 }}>Selected Booking</Typography>
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
                
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mb: 4 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, p: 2, borderRadius: '12px', bgcolor: 'rgba(0,0,0,0.02)' }}>
                    <Phone size={18} color={COLORS.primary} />
                    <Box>
                      <Typography variant="caption" color="textSecondary">Phone Number</Typography>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>{selectedBooking.phone || 'Not provided'}</Typography>
                    </Box>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, p: 2, borderRadius: '12px', bgcolor: 'rgba(0,0,0,0.02)' }}>
                    <Mail size={18} color={COLORS.primary} />
                    <Box>
                      <Typography variant="caption" color="textSecondary">Email Address</Typography>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>{selectedBooking.email || 'Not provided'}</Typography>
                    </Box>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, p: 2, borderRadius: '12px', bgcolor: 'rgba(0,0,0,0.02)' }}>
                    <MapPin size={18} color={COLORS.primary} />
                    <Box>
                      <Typography variant="caption" color="textSecondary">Venue</Typography>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>{selectedBooking.venue}</Typography>
                    </Box>
                  </Box>
                </Box>

                <Button 
                  variant="contained" 
                  fullWidth 
                  startIcon={<MessageSquare size={18} />}
                  sx={{ 
                    bgcolor: COLORS.primary, 
                    borderRadius: '12px', 
                    py: 1.5,
                    fontWeight: 600,
                    textTransform: 'none',
                    '&:hover': { bgcolor: '#6b1423' }
                  }}
                >
                  Send Message to Couple
                </Button>
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

