import React, { useState } from 'react';
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
}

export default function BookingsManager() {
  const [bookings, setBookings] = useState<Booking[]>([
    {
      id: '1',
      coupleName: 'Amila & Dilini',
      eventDate: '2025-12-15',
      venue: 'Grand Hyatt, Colombo',
      amount: 'LKR 350,000',
      paymentStatus: 'Partial',
      status: 'Confirmed',
      email: 'amila.d@gmail.com',
      phone: '+94 77 123 4567'
    },
    {
      id: '2',
      coupleName: 'Saman & Kumari',
      eventDate: '2026-01-20',
      venue: 'Earl\'s Regency, Kandy',
      amount: 'LKR 200,000',
      paymentStatus: 'Paid',
      status: 'Confirmed',
      email: 'saman.k@gmail.com',
      phone: '+94 71 987 6543'
    },
    {
      id: '3',
      coupleName: 'Kasun & Erandi',
      eventDate: '2025-11-05',
      venue: 'Jetwing Lighthouse, Galle',
      amount: 'LKR 450,000',
      paymentStatus: 'Pending',
      status: 'Confirmed',
      email: 'kasun.e@gmail.com',
      phone: '+94 76 555 1212'
    }
  ]);

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
              <Typography variant="h4" sx={{ fontWeight: 700, color: COLORS.primary }}>12</Typography>
            </Box>
            <Divider orientation="vertical" flexItem sx={{ display: { xs: 'none', md: 'block' } }} />
            <Box>
              <Typography variant="caption" color="textSecondary" sx={{ fontWeight: 600, textTransform: 'uppercase' }}>Upcoming Events</Typography>
              <Typography variant="h4" sx={{ fontWeight: 700, color: COLORS.accent }}>8</Typography>
            </Box>
            <Divider orientation="vertical" flexItem sx={{ display: { xs: 'none', md: 'block' } }} />
            <Box>
              <Typography variant="caption" color="textSecondary" sx={{ fontWeight: 600, textTransform: 'uppercase' }}>Total Revenue</Typography>
              <Typography variant="h4" sx={{ fontWeight: 700, color: '#2e7d32' }}>LKR 2.4M</Typography>
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
                  <TableRow key={booking.id} hover sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
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
            <Typography variant="h6" sx={{ fontWeight: 700, mb: 3 }}>Active Booking</Typography>
            <Box sx={{ textAlign: 'center', mb: 3 }}>
              <Avatar sx={{ width: 80, height: 80, mx: 'auto', mb: 2, bgcolor: alpha(COLORS.primary, 0.1), color: COLORS.primary }}>
                <User size={40} />
              </Avatar>
              <Typography variant="h6" sx={{ fontWeight: 700 }}>Amila & Dilini</Typography>
              <Typography variant="body2" color="textSecondary">Wedding Photography • Dec 15, 2025</Typography>
            </Box>
            
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mb: 4 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, p: 2, borderRadius: '12px', bgcolor: 'rgba(0,0,0,0.02)' }}>
                <Phone size={18} color={COLORS.primary} />
                <Box>
                  <Typography variant="caption" color="textSecondary">Phone Number</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>+94 77 123 4567</Typography>
                </Box>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, p: 2, borderRadius: '12px', bgcolor: 'rgba(0,0,0,0.02)' }}>
                <Mail size={18} color={COLORS.primary} />
                <Box>
                  <Typography variant="caption" color="textSecondary">Email Address</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>amila.d@gmail.com</Typography>
                </Box>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, p: 2, borderRadius: '12px', bgcolor: 'rgba(0,0,0,0.02)' }}>
                <MapPin size={18} color={COLORS.primary} />
                <Box>
                  <Typography variant="caption" color="textSecondary">Venue</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>Grand Hyatt, Colombo</Typography>
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
          </Paper>
        </Grid>

        <Grid size={{ xs: 12, lg: 8 }}>
          <Paper elevation={0} sx={{ p: 3, borderRadius: '20px', border: '1px solid rgba(139,26,46,0.08)', height: '100%' }}>
            <Typography variant="h6" sx={{ fontWeight: 700, mb: 3 }}>Upcoming Schedule</Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {[
                { date: 'Nov 05', event: 'Wedding Photography', couple: 'Kasun & Erandi', location: 'Galle' },
                { date: 'Dec 15', event: 'Wedding Photography', couple: 'Amila & Dilini', location: 'Colombo' },
                { date: 'Jan 20', event: 'Wedding Photography', couple: 'Saman & Kumari', location: 'Kandy' },
              ].map((item, i) => (
                <Box key={i} sx={{ display: 'flex', alignItems: 'center', gap: 3, p: 2, borderRadius: '16px', border: '1px solid rgba(0,0,0,0.05)', '&:hover': { bgcolor: 'rgba(0,0,0,0.02)' } }}>
                  <Box sx={{ textAlign: 'center', minWidth: 60, p: 1, borderRadius: '10px', bgcolor: alpha(COLORS.primary, 0.05), color: COLORS.primary }}>
                    <Typography variant="h6" sx={{ fontWeight: 800, lineHeight: 1 }}>{item.date.split(' ')[1]}</Typography>
                    <Typography variant="caption" sx={{ fontWeight: 700, textTransform: 'uppercase' }}>{item.date.split(' ')[0]}</Typography>
                  </Box>
                  <Box sx={{ flexGrow: 1 }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>{item.couple}</Typography>
                    <Typography variant="body2" color="textSecondary">{item.event}</Typography>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, color: COLORS.textSecondary }}>
                    <MapPin size={14} />
                    <Typography variant="caption" sx={{ fontWeight: 600 }}>{item.location}</Typography>
                  </Box>
                  <IconButton size="small">
                    <ChevronRight size={20} />
                  </IconButton>
                </Box>
              ))}
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
}

