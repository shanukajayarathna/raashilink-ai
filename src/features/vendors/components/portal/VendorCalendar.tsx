import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  Paper, 
  Grid, 
  IconButton, 
  Button, 
  Tooltip,
  useTheme,
  alpha,
  Divider,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControlLabel,
  Radio,
  RadioGroup,
  CircularProgress,
  Alert,
} from '@mui/material';
import { 
  ChevronLeft, 
  ChevronRight, 
  Calendar as CalendarIcon, 
  CheckCircle2, 
  XCircle, 
  Clock,
  Info,
  MapPin,
  User
} from 'lucide-react';
import { 
  format, 
  addMonths, 
  subMonths, 
  startOfMonth, 
  endOfMonth, 
  startOfWeek, 
  endOfWeek, 
  isSameMonth, 
  isSameDay, 
  addDays, 
  eachDayOfInterval,
  isToday
} from 'date-fns';
import { motion, AnimatePresence } from 'motion/react';
import vendorService from '../../services/vendorService';

const COLORS = {
  primary: '#8B1A2E',
  secondary: '#C9A84C',
  accent: '#1A6B72',
  background: '#FAF7F2',
  textPrimary: '#1C1C1C',
  textSecondary: '#555555',
  available: '#2e7d32',
  booked: '#d32f2f',
  unavailable: '#757575'
};

interface CalendarEvent {
  date: Date;
  type: 'available' | 'booked' | 'unavailable';
  title?: string;
  coupleName?: string;
}

interface VendorCalendarProps {
  quotes?: any[];
  availabilityCalendar?: Array<{ date: string; status: 'available' | 'booked' | 'blocked' }>;
}

export default function VendorCalendar({ quotes = [], availabilityCalendar = [] }: VendorCalendarProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [statusType, setStatusType] = useState<'available' | 'booked' | 'unavailable'>('available');
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');
  
  const [events, setEvents] = useState<CalendarEvent[]>([]);

  // Initialize events from persisted calendar + accepted quotes
  useEffect(() => {
    const persistedEvents: CalendarEvent[] = availabilityCalendar
      .map((entry) => {
        const d = new Date(entry.date);
        if (isNaN(d.getTime())) return null;
        // Map 'blocked' → 'unavailable' for display
        const type = entry.status === 'blocked' ? 'unavailable' : (entry.status as 'available' | 'booked');
        return { date: d, type } as CalendarEvent;
      })
      .filter((e): e is CalendarEvent => e !== null);

    const quoteEvents: CalendarEvent[] = quotes
      .filter((q) => q.status === 'accepted' && (q.response?.scheduledStart || q.weddingDate))
      .map((q) => {
        const d = new Date(q.response?.scheduledStart || q.weddingDate);
        if (isNaN(d.getTime())) return null;
        return {
          date: d,
          type: 'booked' as const,
          title: 'Wedding Event',
          coupleName: q.coupleName,
        };
      })
      .filter((e): e is CalendarEvent => e !== null);

    // Merge: quote events take priority over persisted calendar entries for same date
    const merged = [...persistedEvents];
    for (const qe of quoteEvents) {
      const idx = merged.findIndex((e) => isSameDay(e.date, qe.date));
      if (idx >= 0) {
        merged[idx] = qe;
      } else {
        merged.push(qe);
      }
    }
    setEvents(merged);
  }, [availabilityCalendar, quotes]);

  const nextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));
  const prevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));

  const onDateClick = (day: Date) => {
    setSelectedDate(day);
    const existingEvent = events.find(e => isSameDay(e.date, day));
    if (existingEvent) {
      setStatusType(existingEvent.type);
    } else {
      setStatusType('available');
    }
    setSaveError('');
    setIsModalOpen(true);
  };

  const handleSaveStatus = async () => {
    if (!selectedDate) return;
    setSaving(true);
    setSaveError('');

    const updatedEvents = (() => {
      const filtered = events.filter(e => !isSameDay(e.date, selectedDate));
      return [...filtered, { date: selectedDate, type: statusType }];
    })();

    // Map to the backend format (unavailable → blocked)
    const calendarPayload = updatedEvents.map((e) => ({
      date: e.date.toISOString(),
      status: e.type === 'unavailable' ? 'blocked' : e.type,
    }));

    try {
      await vendorService.updateVendorProfile({ availabilityCalendar: calendarPayload });
      setEvents(updatedEvents);
      setIsModalOpen(false);
    } catch (err: any) {
      setSaveError(err?.response?.data?.message || err?.message || 'Failed to save. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const renderHeader = () => (
    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
      <Box>
        <Typography variant="h5" sx={{ fontFamily: 'Playfair Display', fontWeight: 700, color: COLORS.primary }}>
          Availability Calendar
        </Typography>
        <Typography variant="body2" color="textSecondary">
          Manage your schedule and mark dates as booked or unavailable.
        </Typography>
      </Box>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
        <IconButton onClick={prevMonth} sx={{ bgcolor: 'white', border: '1px solid rgba(0,0,0,0.08)' }}>
          <ChevronLeft size={20} />
        </IconButton>
        <Typography variant="h6" sx={{ fontWeight: 700, minWidth: 160, textAlign: 'center' }}>
          {format(currentMonth, 'MMMM yyyy')}
        </Typography>
        <IconButton onClick={nextMonth} sx={{ bgcolor: 'white', border: '1px solid rgba(0,0,0,0.08)' }}>
          <ChevronRight size={20} />
        </IconButton>
      </Box>
    </Box>
  );

  const renderDays = () => {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    return (
      <Grid container sx={{ mb: 1 }}>
        {days.map((day, i) => (
          <Grid size="grow" key={i} sx={{ textAlign: 'center' }}>
            <Typography variant="caption" sx={{ fontWeight: 700, color: COLORS.textSecondary, textTransform: 'uppercase', letterSpacing: 1 }}>
              {day}
            </Typography>
          </Grid>
        ))}
      </Grid>
    );
  };

  const renderCells = () => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(monthStart);
    const startDate = startOfWeek(monthStart);
    const endDate = endOfWeek(monthEnd);

    const rows = [];
    let days = [];
    let day = startDate;

    while (day <= endDate) {
      for (let i = 0; i < 7; i++) {
        const formattedDate = format(day, 'd');
        const cloneDay = day;
        const event = events.find(e => isSameDay(e.date, cloneDay));
        
        days.push(
          <Grid 
            size="grow" 
            key={day.toString()} 
            onClick={() => onDateClick(cloneDay)}
            sx={{ 
              height: { xs: 80, md: 120 },
              border: '1px solid rgba(0,0,0,0.04)',
              bgcolor: !isSameMonth(day, monthStart) ? 'rgba(0,0,0,0.02)' : 'white',
              cursor: 'pointer',
              p: 1,
              transition: 'all 0.2s',
              position: 'relative',
              '&:hover': {
                bgcolor: alpha(COLORS.primary, 0.02),
                zIndex: 1
              }
            }}
          >
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <Typography 
                variant="body2" 
                sx={{ 
                  fontWeight: isToday(day) ? 700 : 500,
                  color: isToday(day) ? COLORS.primary : !isSameMonth(day, monthStart) ? '#ccc' : COLORS.textPrimary,
                  width: 28,
                  height: 28,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: '50%',
                  bgcolor: isToday(day) ? alpha(COLORS.primary, 0.1) : 'transparent'
                }}
              >
                {formattedDate}
              </Typography>
              {event && (
                <Box 
                  sx={{ 
                    width: 8, 
                    height: 8, 
                    borderRadius: '50%', 
                    bgcolor: COLORS[event.type] 
                  }} 
                />
              )}
            </Box>
            
            {event && (
              <Box 
                sx={{ 
                  mt: 1, 
                  p: 0.5, 
                  borderRadius: '4px', 
                  bgcolor: alpha(COLORS[event.type], 0.1),
                  borderLeft: `3px solid ${COLORS[event.type]}`,
                  display: { xs: 'none', md: 'block' }
                }}
              >
                <Typography variant="caption" sx={{ fontWeight: 600, color: COLORS[event.type], display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {event.title || event.type.charAt(0).toUpperCase() + event.type.slice(1)}
                </Typography>
                {event.coupleName && (
                  <Typography variant="caption" sx={{ fontSize: '0.65rem', color: COLORS.textSecondary, display: 'block' }}>
                    {event.coupleName}
                  </Typography>
                )}
              </Box>
            )}
          </Grid>
        );
        day = addDays(day, 1);
      }
      rows.push(
        <Grid container key={day.toString()}>
          {days}
        </Grid>
      );
      days = [];
    }
    return <Box sx={{ borderRadius: '16px', overflow: 'hidden', border: '1px solid rgba(0,0,0,0.08)' }}>{rows}</Box>;
  };

  return (
    <Box>
      {renderHeader()}
      
      <Paper elevation={0} sx={{ p: 3, borderRadius: '20px', border: '1px solid rgba(139,26,46,0.08)', boxShadow: '0 2px 16px rgba(139,26,46,0.04)' }}>
        <Box sx={{ mb: 3, display: 'flex', gap: 3, flexWrap: 'wrap' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Box sx={{ width: 12, height: 12, borderRadius: '50%', bgcolor: COLORS.available }} />
            <Typography variant="caption" sx={{ fontWeight: 600 }}>Available</Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Box sx={{ width: 12, height: 12, borderRadius: '50%', bgcolor: COLORS.booked }} />
            <Typography variant="caption" sx={{ fontWeight: 600 }}>Booked</Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Box sx={{ width: 12, height: 12, borderRadius: '50%', bgcolor: COLORS.unavailable }} />
            <Typography variant="caption" sx={{ fontWeight: 600 }}>Unavailable</Typography>
          </Box>
        </Box>

        {renderDays()}
        {renderCells()}
      </Paper>

      <Grid container spacing={3} sx={{ mt: 2 }}>
        <Grid size={{ xs: 12, md: 6 }}>
          <Paper elevation={0} sx={{ p: 3, borderRadius: '16px', border: '1px solid rgba(0,0,0,0.08)', height: '100%' }}>
            <Typography variant="h6" sx={{ fontWeight: 700, mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
              <Info size={20} color={COLORS.primary} /> Upcoming Bookings
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {events.filter(e => e.type === 'booked').map((event, i) => (
                <Box key={i} sx={{ p: 2, borderRadius: '12px', bgcolor: alpha(COLORS.booked, 0.05), borderLeft: `4px solid ${COLORS.booked}` }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>{event.coupleName}</Typography>
                  <Typography variant="body2" color="textSecondary">{event.title}</Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mt: 1 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, color: COLORS.textSecondary }}>
                      <CalendarIcon size={14} />
                      <Typography variant="caption">{format(event.date, 'MMM dd, yyyy')}</Typography>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, color: COLORS.textSecondary }}>
                      <MapPin size={14} />
                      <Typography variant="caption">Grand Hyatt, Colombo</Typography>
                    </Box>
                  </Box>
                </Box>
              ))}
            </Box>
          </Paper>
        </Grid>
        <Grid size={{ xs: 12, md: 6 }}>
          <Paper elevation={0} sx={{ p: 3, borderRadius: '16px', border: '1px solid rgba(0,0,0,0.08)', height: '100%', bgcolor: alpha(COLORS.secondary, 0.05) }}>
            <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>Calendar Sync</Typography>
            <Typography variant="body2" color="textSecondary" sx={{ mb: 3 }}>
              Sync your RaashiLink calendar with Google Calendar or iCal to keep all your bookings in one place.
            </Typography>
            <Button 
              variant="outlined" 
              fullWidth 
              sx={{ 
                borderRadius: '10px', 
                color: COLORS.primary, 
                borderColor: COLORS.primary,
                textTransform: 'none',
                fontWeight: 600,
                mb: 2
              }}
            >
              Connect Google Calendar
            </Button>
            <Button 
              variant="outlined" 
              fullWidth 
              sx={{ 
                borderRadius: '10px', 
                color: COLORS.primary, 
                borderColor: COLORS.primary,
                textTransform: 'none',
                fontWeight: 600
              }}
            >
              Export iCal Link
            </Button>
          </Paper>
        </Grid>
      </Grid>

      {/* Date Status Modal */}
      <Dialog 
        open={isModalOpen} 
        onClose={() => setIsModalOpen(false)}
        PaperProps={{ sx: { borderRadius: '20px', p: 1, minWidth: 320 } }}
      >
        <DialogTitle sx={{ fontWeight: 700, color: COLORS.primary }}>
          Set Status for {selectedDate && format(selectedDate, 'MMM dd, yyyy')}
        </DialogTitle>
        <DialogContent>
          <RadioGroup
            value={statusType}
            onChange={(e) => setStatusType(e.target.value as any)}
            sx={{ mt: 1 }}
          >
            <Paper 
              elevation={0} 
              sx={{ 
                p: 2, 
                mb: 1.5, 
                borderRadius: '12px', 
                border: '1px solid',
                borderColor: statusType === 'available' ? COLORS.available : 'rgba(0,0,0,0.08)',
                bgcolor: statusType === 'available' ? alpha(COLORS.available, 0.05) : 'transparent'
              }}
            >
              <FormControlLabel 
                value="available" 
                control={<Radio color="success" />} 
                label={
                  <Box>
                    <Typography variant="subtitle2" sx={{ fontWeight: 700, color: COLORS.available }}>Available</Typography>
                    <Typography variant="caption" color="textSecondary">Couples can send quote requests for this date.</Typography>
                  </Box>
                } 
              />
            </Paper>
            <Paper 
              elevation={0} 
              sx={{ 
                p: 2, 
                mb: 1.5, 
                borderRadius: '12px', 
                border: '1px solid',
                borderColor: statusType === 'booked' ? COLORS.booked : 'rgba(0,0,0,0.08)',
                bgcolor: statusType === 'booked' ? alpha(COLORS.booked, 0.05) : 'transparent'
              }}
            >
              <FormControlLabel 
                value="booked" 
                control={<Radio color="error" />} 
                label={
                  <Box>
                    <Typography variant="subtitle2" sx={{ fontWeight: 700, color: COLORS.booked }}>Booked</Typography>
                    <Typography variant="caption" color="textSecondary">Mark as booked manually or via external booking.</Typography>
                  </Box>
                } 
              />
            </Paper>
            <Paper 
              elevation={0} 
              sx={{ 
                p: 2, 
                borderRadius: '12px', 
                border: '1px solid',
                borderColor: statusType === 'unavailable' ? COLORS.unavailable : 'rgba(0,0,0,0.08)',
                bgcolor: statusType === 'unavailable' ? alpha(COLORS.unavailable, 0.05) : 'transparent'
              }}
            >
              <FormControlLabel 
                value="unavailable" 
                control={<Radio sx={{ color: COLORS.unavailable, '&.Mui-checked': { color: COLORS.unavailable } }} />} 
                label={
                  <Box>
                    <Typography variant="subtitle2" sx={{ fontWeight: 700, color: COLORS.unavailable }}>Unavailable</Typography>
                    <Typography variant="caption" color="textSecondary">Personal time off or not working on this day.</Typography>
                  </Box>
                } 
              />
            </Paper>
          </RadioGroup>
        </DialogContent>
        <DialogActions sx={{ p: 3, flexDirection: 'column', alignItems: 'stretch', gap: 1 }}>
          {saveError && (
            <Alert severity="error" sx={{ borderRadius: '10px', mb: 1 }}>{saveError}</Alert>
          )}
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
            <Button onClick={() => setIsModalOpen(false)} disabled={saving} sx={{ color: COLORS.textSecondary }}>Cancel</Button>
            <Button 
              variant="contained" 
              onClick={handleSaveStatus}
              disabled={saving}
              startIcon={saving ? <CircularProgress size={16} color="inherit" /> : undefined}
              sx={{ bgcolor: COLORS.primary, borderRadius: '10px', px: 4, '&:hover': { bgcolor: '#6b1423' } }}
            >
              {saving ? 'Saving...' : 'Save Status'}
            </Button>
          </Box>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

