import React, { useState } from 'react';
import { 
  Box, Typography, Grid, Card, CardContent, 
  Stack, Button, IconButton, TextField, 
  MenuItem, Select, FormControl, InputLabel,
  Avatar, Chip, Rating, Divider, Badge,
  useTheme, useMediaQuery, Dialog, DialogTitle,
  DialogContent, DialogActions, Alert, CircularProgress
} from '@mui/material';
import { 
  Search, Filter, MapPin, Phone, Mail, 
  CheckCircle2, Star, DollarSign, MessageSquare,
  ArrowRight, Heart, ExternalLink, Info
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import weddingService from '../services/weddingService';

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

const CATEGORIES = [
  'Venue', 'Catering', 'Photography', 'Decoration', 
  'Attire', 'Entertainment', 'Makeup'
];

const STATUS_COLORS: Record<string, string> = {
  shortlisted: COLORS.warning,
  requested: COLORS.accent,
  booked: COLORS.success,
  cancelled: COLORS.error,
};

interface VendorTabProps {
  vendors?: any[];          // full vendor list from API (Vendor model)
  bookedVendorIds?: any[];  // project.vendors entries with status
  onStatusChange?: () => void;
}

export default function VendorTab({ vendors = [], bookedVendorIds = [], onStatusChange }: VendorTabProps) {
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All');
  const [isQuoteModalOpen, setIsQuoteModalOpen] = useState(false);
  const [selectedVendor, setSelectedVendor] = useState<any>(null);
  const [quoteAmount, setQuoteAmount] = useState('');
  const [sendingQuote, setSendingQuote] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState<string | null>(null);

  // Build status map from project.vendors
  const statusMap: Record<string, { status: string; quotedAmount: number }> = {};
  bookedVendorIds.forEach((bv: any) => {
    statusMap[String(bv.vendorId)] = { status: bv.status, quotedAmount: bv.quotedAmount };
  });

  const bookedVendors = vendors.filter((v: any) => {
    const s = statusMap[String(v._id)];
    return s && ['requested', 'booked'].includes(s.status);
  });
  const availableVendors = vendors.filter((v: any) => {
    const s = statusMap[String(v._id)];
    const notBooked = !s || s.status === 'shortlisted' || s.status === 'cancelled';
    const matchCategory = category === 'All' || v.category === category;
    const matchSearch = !search || v.name?.toLowerCase().includes(search.toLowerCase());
    return notBooked && matchCategory && matchSearch;
  });

  const handleRequestQuote = (vendor: any) => {
    setSelectedVendor(vendor);
    setQuoteAmount('');
    setIsQuoteModalOpen(true);
  };

  const handleSendQuote = async () => {
    if (!selectedVendor) return;
    setSendingQuote(true);
    try {
      await weddingService.requestQuote({
        vendorId: selectedVendor._id,
        quotedAmount: Number(quoteAmount) || 0,
        category: selectedVendor.category,
      });
      onStatusChange?.();
      setIsQuoteModalOpen(false);
    } catch { /* silent */ }
    finally { setSendingQuote(false); }
  };

  const handleStatusChange = async (vendorId: string, newStatus: string) => {
    setUpdatingStatus(vendorId);
    try {
      await weddingService.updateVendorStatus(vendorId, newStatus);
      onStatusChange?.();
    } catch { /* silent */ }
    finally { setUpdatingStatus(null); }
  };

  return (
    <Box>
      {/* My Booked Vendors Section */}
      <Box sx={{ mb: 6 }}>
        <Typography variant="h6" sx={{ fontWeight: 800, color: COLORS.primary, mb: 3, fontFamily: 'Playfair Display', display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <CheckCircle2 size={24} color={COLORS.success} />
          My Booked Vendors
        </Typography>
        {bookedVendors.length === 0 ? (
          <Box sx={{ py: 4, textAlign: 'center', color: 'text.secondary' }}>
            <Typography variant="body2">No vendors booked yet. Request a quote below to get started.</Typography>
          </Box>
        ) : (
        <Grid container spacing={3}>
          {bookedVendors.map((vendor: any, i: number) => {
            const entry = statusMap[String(vendor._id)];
            return (
              <Grid key={vendor._id} size={{ xs: 12, md: 6 }}>
                <MotionCard
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                  sx={{ 
                    borderRadius: 6, 
                    border: '1px solid', 
                    borderColor: `${COLORS.success}30`,
                    bgcolor: `${COLORS.success}05`,
                    overflow: 'hidden'
                  }}
                >
                  <CardContent sx={{ p: 3 }}>
                    <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
                      <Box>
                        <Chip 
                          label={vendor.category} 
                          size="small" 
                          sx={{ bgcolor: COLORS.primary, color: 'white', fontWeight: 700, mb: 1, fontSize: '0.65rem' }} 
                        />
                        <Typography variant="h6" sx={{ fontWeight: 800, color: COLORS.textPrimary }}>{vendor.name}</Typography>
                        <Typography variant="caption" color="text.secondary">{vendor.city || vendor.location || ''}</Typography>
                      </Box>
                      <Chip 
                        label={entry?.status?.toUpperCase()} 
                        size="small" 
                        sx={{ bgcolor: STATUS_COLORS[entry?.status] || COLORS.accent, color: 'white', fontWeight: 800, fontSize: '0.7rem' }} 
                      />
                    </Stack>
                    <Stack direction="row" spacing={1} sx={{ mt: 2 }}>
                      {entry?.status === 'requested' && (
                        <Button
                          size="small"
                          variant="contained"
                          disabled={updatingStatus === String(vendor._id)}
                          onClick={() => handleStatusChange(String(vendor._id), 'booked')}
                          startIcon={updatingStatus === String(vendor._id) ? <CircularProgress size={12} color="inherit" /> : undefined}
                          sx={{ bgcolor: COLORS.success, fontSize: '0.75rem', textTransform: 'none', fontWeight: 700 }}
                        >
                          Mark Booked
                        </Button>
                      )}
                      {entry?.status !== 'cancelled' && (
                        <Button
                          size="small"
                          variant="outlined"
                          disabled={updatingStatus === String(vendor._id)}
                          onClick={() => handleStatusChange(String(vendor._id), 'cancelled')}
                          sx={{ color: COLORS.error, borderColor: COLORS.error, fontSize: '0.75rem', textTransform: 'none', fontWeight: 700 }}
                        >
                          Cancel
                        </Button>
                      )}
                    </Stack>
                    {entry?.quotedAmount > 0 && (
                      <Typography variant="caption" sx={{ mt: 1, display: 'block', color: 'text.secondary' }}>
                        Quoted: LKR {Number(entry.quotedAmount).toLocaleString()}
                      </Typography>
                    )}
                  </CardContent>
                </MotionCard>
              </Grid>
            );
          })}
        </Grid>
        )}
      </Box>

      <Divider sx={{ mb: 6, borderStyle: 'dashed' }} />

      {/* Search & Filters */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h6" sx={{ fontWeight: 800, color: COLORS.primary, mb: 3, fontFamily: 'Playfair Display' }}>
          Find More Vendors
        </Typography>
        <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} alignItems="center">
          <TextField 
            fullWidth 
            placeholder="Search by name or service..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            InputProps={{ startAdornment: <Search size={18} style={{ marginRight: 10, color: COLORS.textSecondary }} /> }}
            sx={{ bgcolor: 'white', borderRadius: 4 }}
          />
          <FormControl sx={{ minWidth: 200 }}>
            <InputLabel>Category</InputLabel>
            <Select 
              value={category} 
              onChange={(e) => setCategory(e.target.value)} 
              label="Category"
              sx={{ bgcolor: 'white', borderRadius: 4 }}
            >
              <MenuItem value="All">All Categories</MenuItem>
              {CATEGORIES.map(cat => <MenuItem key={cat} value={cat}>{cat}</MenuItem>)}
            </Select>
          </FormControl>
        </Stack>
      </Box>

      {/* Vendor Grid */}
      {availableVendors.length === 0 ? (
        <Box sx={{ py: 6, textAlign: 'center', color: 'text.secondary' }}>
          <Typography variant="body2">No vendors found. Try a different category or search.</Typography>
        </Box>
      ) : (
      <Grid container spacing={3}>
        {availableVendors.map((vendor: any, i: number) => (
          <Grid key={vendor._id} size={{ xs: 12, sm: 6, lg: 4 }}>
            <MotionCard
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.05 }}
              whileHover={{ y: -8 }}
              sx={{ 
                borderRadius: 6, 
                border: '1px solid', 
                borderColor: 'divider',
                overflow: 'hidden',
                height: '100%',
                display: 'flex',
                flexDirection: 'column'
              }}
            >
              <Box sx={{ position: 'relative', height: 200, bgcolor: `${COLORS.primary}10`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {vendor.photos?.[0] ? (
                  <Box component="img" src={vendor.photos[0]} sx={{ width: '100%', height: '100%', objectFit: 'cover' }} referrerPolicy="no-referrer" />
                ) : (
                  <Typography variant="h3" sx={{ color: COLORS.primary, opacity: 0.2, fontFamily: 'Playfair Display' }}>{vendor.name?.[0]}</Typography>
                )}
                {vendor.ratings?.average && (
                  <Box sx={{ position: 'absolute', top: 12, right: 12, bgcolor: 'rgba(255,255,255,0.9)', px: 1, py: 0.5, borderRadius: 2, display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <Star size={14} fill={COLORS.secondary} color={COLORS.secondary} />
                    <Typography variant="caption" sx={{ fontWeight: 800 }}>{vendor.ratings.average.toFixed(1)}</Typography>
                  </Box>
                )}
              </Box>
              <CardContent sx={{ p: 3, flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
                <Stack direction="row" justifyContent="space-between" alignItems="flex-start" sx={{ mb: 1 }}>
                  <Typography variant="subtitle2" sx={{ color: COLORS.accent, fontWeight: 800, textTransform: 'uppercase', letterSpacing: 1, fontSize: '0.7rem' }}>
                    {vendor.category}
                  </Typography>
                </Stack>
                <Typography variant="h6" sx={{ fontWeight: 800, color: COLORS.textPrimary, mb: 1 }}>{vendor.name}</Typography>
                {vendor.city && (
                  <Stack direction="row" spacing={1} alignItems="center" sx={{ color: 'text.secondary', mb: 2 }}>
                    <MapPin size={14} />
                    <Typography variant="caption">{vendor.city}</Typography>
                  </Stack>
                )}
                <Box sx={{ mt: 'auto' }}>
                  <Button 
                    fullWidth 
                    variant="contained" 
                    onClick={() => handleRequestQuote(vendor)}
                    sx={{ bgcolor: COLORS.primary, borderRadius: 3, fontWeight: 700, textTransform: 'none', py: 1.2 }}
                  >
                    Request Quote
                  </Button>
                </Box>
              </CardContent>
            </MotionCard>
          </Grid>
        ))}
      </Grid>
      )}

      {/* Quote Modal */}
      <Dialog open={isQuoteModalOpen} onClose={() => setIsQuoteModalOpen(false)} fullWidth maxWidth="sm" PaperProps={{ sx: { borderRadius: 6 } }}>
        <DialogTitle sx={{ fontWeight: 800, fontFamily: 'Playfair Display', color: COLORS.primary }}>Request a Quote</DialogTitle>
        <DialogContent>
          {selectedVendor && (
            <Stack spacing={3} sx={{ mt: 1 }}>
              <Alert icon={<Info size={18} />} severity="info" sx={{ borderRadius: 3 }}>
                Requesting a quote from <strong>{selectedVendor.name}</strong>
              </Alert>
              <TextField
                fullWidth
                label="Quoted Amount (LKR, optional)"
                type="number"
                value={quoteAmount}
                onChange={(e) => setQuoteAmount(e.target.value)}
                inputProps={{ min: 0 }}
              />
            </Stack>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
          <Button onClick={() => setIsQuoteModalOpen(false)} disabled={sendingQuote} sx={{ color: 'text.secondary', fontWeight: 700 }}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleSendQuote}
            disabled={sendingQuote}
            startIcon={sendingQuote ? <CircularProgress size={14} color="inherit" /> : undefined}
            sx={{ bgcolor: COLORS.primary, borderRadius: 3, px: 4, fontWeight: 700 }}
          >
            {sendingQuote ? 'Sending...' : 'Send Request'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

const MotionCard = motion(Card);
