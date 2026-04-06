import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  Paper, 
  Grid, 
  Button, 
  Chip, 
  Avatar, 
  IconButton, 
  Dialog, 
  DialogTitle, 
  DialogContent, 
  DialogActions, 
  TextField, 
  MenuItem,
  Skeleton,
  Badge,
  Divider,
  useTheme,
  alpha
} from '@mui/material';
import { 
  MessageSquare, 
  Calendar, 
  MapPin, 
  DollarSign, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Send,
  MoreVertical,
  Filter,
  Search,
  User,
  ChevronRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

const COLORS = {
  primary: '#8B1A2E',
  secondary: '#C9A84C',
  accent: '#1A6B72',
  background: '#FAF7F2',
  textPrimary: '#1C1C1C',
  textSecondary: '#555555',
};

interface QuoteRequest {
  id: string;
  coupleName: string;
  weddingDate: string;
  location: string;
  budget: string;
  requirements: string;
  status: 'new' | 'responded' | 'accepted' | 'declined';
  createdAt: string;
}

export default function QuoteInbox() {
  const [quotes, setQuotes] = useState<QuoteRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedQuote, setSelectedQuote] = useState<QuoteRequest | null>(null);
  const [isQuoteModalOpen, setIsQuoteModalOpen] = useState(false);
  const [isDeclineModalOpen, setIsDeclineModalOpen] = useState(false);
  const [quoteForm, setQuoteForm] = useState({
    price: '',
    package: 'Standard',
    message: ''
  });

  useEffect(() => {
    // Simulate API fetch
    setTimeout(() => {
      setQuotes([
        {
          id: '1',
          coupleName: 'Amila & Dilini',
          weddingDate: '2025-12-15',
          location: 'Colombo',
          budget: 'LKR 250,000 - 350,000',
          requirements: 'Full day photography, including homecoming and pre-shoot.',
          status: 'new',
          createdAt: '2025-04-01'
        },
        {
          id: '2',
          coupleName: 'Saman & Kumari',
          weddingDate: '2026-01-20',
          location: 'Kandy',
          budget: 'LKR 150,000 - 200,000',
          requirements: 'Traditional Kandyan wedding photography.',
          status: 'responded',
          createdAt: '2025-03-28'
        },
        {
          id: '3',
          coupleName: 'Kasun & Erandi',
          weddingDate: '2025-11-05',
          location: 'Galle',
          budget: 'LKR 300,000+',
          requirements: 'Cinematic video and photography for a beach wedding.',
          status: 'new',
          createdAt: '2025-04-03'
        }
      ]);
      setLoading(false);
    }, 1000);
  }, []);

  const handleSendQuote = () => {
    if (!selectedQuote) return;
    setQuotes(prev => prev.map(q => 
      q.id === selectedQuote.id ? { ...q, status: 'responded' } : q
    ));
    setIsQuoteModalOpen(false);
    setSelectedQuote(null);
  };

  const handleDecline = () => {
    if (!selectedQuote) return;
    setQuotes(prev => prev.map(q => 
      q.id === selectedQuote.id ? { ...q, status: 'declined' } : q
    ));
    setIsDeclineModalOpen(false);
    setSelectedQuote(null);
  };

  const getStatusChip = (status: string) => {
    const configs: any = {
      new: { label: 'New Request', color: COLORS.primary, icon: <Clock size={14} />, bg: alpha(COLORS.primary, 0.1) },
      responded: { label: 'Responded', color: COLORS.accent, icon: <CheckCircle2 size={14} />, bg: alpha(COLORS.accent, 0.1) },
      accepted: { label: 'Accepted', color: '#2e7d32', icon: <CheckCircle2 size={14} />, bg: 'rgba(46, 125, 50, 0.1)' },
      declined: { label: 'Declined', color: '#d32f2f', icon: <XCircle size={14} />, bg: 'rgba(211, 47, 47, 0.1)' }
    };
    const config = configs[status] || configs.new;
    return (
      <Chip 
        label={config.label} 
        icon={config.icon}
        sx={{ 
          bgcolor: config.bg, 
          color: config.color, 
          fontWeight: 600,
          borderRadius: '8px',
          '& .MuiChip-icon': { color: 'inherit' }
        }} 
      />
    );
  };

  if (loading) return (
    <Box>
      <Skeleton variant="text" width={200} height={40} sx={{ mb: 2 }} />
      {[1, 2, 3].map(i => (
        <Skeleton key={i} variant="rectangular" height={150} sx={{ borderRadius: '16px', mb: 2 }} />
      ))}
    </Box>
  );

  return (
    <Box>
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box>
          <Typography variant="h5" sx={{ fontFamily: 'Playfair Display', fontWeight: 700, color: COLORS.primary }}>
            Quote Requests Inbox
          </Typography>
          <Typography variant="body2" color="textSecondary">
            Manage and respond to wedding service inquiries from couples.
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1.5 }}>
          <Paper elevation={0} sx={{ p: 1, borderRadius: '10px', border: '1px solid rgba(0,0,0,0.08)', display: 'flex', alignItems: 'center', gap: 1 }}>
            <Search size={18} color={COLORS.textSecondary} />
            <TextField 
              placeholder="Search couples..." 
              variant="standard" 
              InputProps={{ disableUnderline: true }}
              sx={{ width: 200 }}
            />
          </Paper>
          <IconButton sx={{ bgcolor: 'white', border: '1px solid rgba(0,0,0,0.08)', borderRadius: '10px' }}>
            <Filter size={18} />
          </IconButton>
        </Box>
      </Box>

      <Grid container spacing={2}>
        <AnimatePresence>
          {quotes.map((quote) => (
            <Grid size={{ xs: 12 }} key={quote.id}>
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.2 }}
              >
                <Paper
                  elevation={0}
                  sx={{
                    p: 3,
                    borderRadius: '16px',
                    border: '1px solid rgba(139,26,46,0.08)',
                    boxShadow: '0 2px 16px rgba(139,26,46,0.04)',
                    transition: 'all 0.2s',
                    '&:hover': {
                      boxShadow: '0 4px 20px rgba(139,26,46,0.08)',
                      borderColor: alpha(COLORS.primary, 0.2)
                    }
                  }}
                >
                  <Grid container spacing={3} alignItems="center">
                    <Grid size={{ xs: 12, md: 4 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Avatar sx={{ width: 56, height: 56, bgcolor: alpha(COLORS.primary, 0.1), color: COLORS.primary }}>
                          <User size={28} />
                        </Avatar>
                        <Box>
                          <Typography variant="h6" sx={{ fontWeight: 700 }}>{quote.coupleName}</Typography>
                          <Typography variant="caption" color="textSecondary" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                            <Clock size={12} /> Received {quote.createdAt}
                          </Typography>
                        </Box>
                      </Box>
                    </Grid>

                    <Grid size={{ xs: 12, md: 5 }}>
                      <Grid container spacing={2}>
                        <Grid size={{ xs: 6 }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, color: COLORS.textSecondary }}>
                            <Calendar size={16} color={COLORS.primary} />
                            <Typography variant="body2">{quote.weddingDate}</Typography>
                          </Box>
                        </Grid>
                        <Grid size={{ xs: 6 }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, color: COLORS.textSecondary }}>
                            <MapPin size={16} color={COLORS.primary} />
                            <Typography variant="body2">{quote.location}</Typography>
                          </Box>
                        </Grid>
                        <Grid size={{ xs: 12 }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, color: COLORS.textSecondary }}>
                            <DollarSign size={16} color={COLORS.primary} />
                            <Typography variant="body2" sx={{ fontWeight: 600 }}>{quote.budget}</Typography>
                          </Box>
                        </Grid>
                      </Grid>
                    </Grid>

                    <Grid size={{ xs: 12, md: 3 }} sx={{ display: 'flex', flexDirection: 'column', alignItems: { md: 'flex-end' }, gap: 2 }}>
                      {getStatusChip(quote.status)}
                      <Box sx={{ display: 'flex', gap: 1 }}>
                        {quote.status === 'new' ? (
                          <>
                            <Button
                              variant="contained"
                              size="small"
                              onClick={() => { setSelectedQuote(quote); setIsQuoteModalOpen(true); }}
                              sx={{ 
                                bgcolor: COLORS.primary, 
                                borderRadius: '8px', 
                                textTransform: 'none',
                                '&:hover': { bgcolor: '#6b1423' }
                              }}
                            >
                              Send Quote
                            </Button>
                            <Button
                              variant="outlined"
                              size="small"
                              onClick={() => { setSelectedQuote(quote); setIsDeclineModalOpen(true); }}
                              sx={{ 
                                color: COLORS.textSecondary, 
                                borderColor: 'rgba(0,0,0,0.1)', 
                                borderRadius: '8px', 
                                textTransform: 'none',
                                '&:hover': { borderColor: COLORS.primary, color: COLORS.primary }
                              }}
                            >
                              Decline
                            </Button>
                          </>
                        ) : (
                          <Button
                            variant="text"
                            size="small"
                            endIcon={<ChevronRight size={16} />}
                            sx={{ color: COLORS.primary, fontWeight: 600, textTransform: 'none' }}
                          >
                            View Details
                          </Button>
                        )}
                      </Box>
                    </Grid>

                    <Grid size={{ xs: 12 }}>
                      <Divider sx={{ my: 1, borderStyle: 'dashed' }} />
                      <Typography variant="body2" sx={{ color: COLORS.textSecondary, fontStyle: 'italic' }}>
                        "{quote.requirements}"
                      </Typography>
                    </Grid>
                  </Grid>
                </Paper>
              </motion.div>
            </Grid>
          ))}
        </AnimatePresence>
      </Grid>

      {/* Send Quote Modal */}
      <Dialog 
        open={isQuoteModalOpen} 
        onClose={() => setIsQuoteModalOpen(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{ sx: { borderRadius: '20px', p: 1 } }}
      >
        <DialogTitle sx={{ fontWeight: 700, fontFamily: 'Playfair Display', color: COLORS.primary }}>
          Send Quote to {selectedQuote?.coupleName}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2, display: 'flex', flexDirection: 'column', gap: 3 }}>
            <TextField
              label="Quoted Price (LKR)"
              fullWidth
              value={quoteForm.price}
              onChange={(e) => setQuoteForm({ ...quoteForm, price: e.target.value })}
              placeholder="e.g. 250,000"
              InputProps={{ startAdornment: <DollarSign size={18} style={{ marginRight: 8 }} /> }}
            />
            <TextField
              select
              label="Select Package"
              fullWidth
              value={quoteForm.package}
              onChange={(e) => setQuoteForm({ ...quoteForm, package: e.target.value })}
            >
              <MenuItem value="Basic">Basic Package</MenuItem>
              <MenuItem value="Standard">Standard Package</MenuItem>
              <MenuItem value="Premium">Premium Package</MenuItem>
              <MenuItem value="Custom">Custom Quote</MenuItem>
            </TextField>
            <TextField
              label="Personal Message"
              fullWidth
              multiline
              rows={4}
              value={quoteForm.message}
              onChange={(e) => setQuoteForm({ ...quoteForm, message: e.target.value })}
              placeholder="Describe what's included in this quote..."
            />
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
          <Button onClick={() => setIsQuoteModalOpen(false)} sx={{ color: COLORS.textSecondary }}>Cancel</Button>
          <Button 
            variant="contained" 
            onClick={handleSendQuote}
            startIcon={<Send size={18} />}
            sx={{ bgcolor: COLORS.primary, borderRadius: '10px', px: 4, '&:hover': { bgcolor: '#6b1423' } }}
          >
            Send Quote
          </Button>
        </DialogActions>
      </Dialog>

      {/* Decline Modal */}
      <Dialog 
        open={isDeclineModalOpen} 
        onClose={() => setIsDeclineModalOpen(false)}
        maxWidth="xs"
        fullWidth
        PaperProps={{ sx: { borderRadius: '20px', p: 1 } }}
      >
        <DialogTitle sx={{ fontWeight: 700, color: '#d32f2f' }}>
          Decline Request
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="textSecondary" sx={{ mb: 3 }}>
            Please select a reason for declining this request. This helps us improve your matching.
          </Typography>
          <TextField
            select
            label="Reason"
            fullWidth
            defaultValue="Not available on this date"
          >
            <MenuItem value="Not available on this date">Not available on this date</MenuItem>
            <MenuItem value="Budget too low">Budget too low</MenuItem>
            <MenuItem value="Location too far">Location too far</MenuItem>
            <MenuItem value="Service not offered">Service not offered</MenuItem>
            <MenuItem value="Other">Other</MenuItem>
          </TextField>
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
          <Button onClick={() => setIsDeclineModalOpen(false)} sx={{ color: COLORS.textSecondary }}>Cancel</Button>
          <Button 
            variant="contained" 
            onClick={handleDecline}
            sx={{ bgcolor: '#d32f2f', borderRadius: '10px', px: 4, '&:hover': { bgcolor: '#b71c1c' } }}
          >
            Decline
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

