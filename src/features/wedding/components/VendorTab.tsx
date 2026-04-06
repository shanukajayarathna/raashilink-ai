import React, { useState } from 'react';
import { 
  Box, Typography, Grid, Card, CardContent, 
  Stack, Button, IconButton, TextField, 
  MenuItem, Select, FormControl, InputLabel,
  Avatar, Chip, Rating, Divider, Badge,
  useTheme, useMediaQuery, Dialog, DialogTitle,
  DialogContent, DialogActions, Alert
} from '@mui/material';
import { 
  Search, Filter, MapPin, Phone, Mail, 
  CheckCircle2, Star, DollarSign, MessageSquare,
  ArrowRight, Heart, ExternalLink, Info
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

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

const MOCK_VENDORS = [
  { id: 1, name: 'Galle Face Hotel', category: 'Venue', rating: 4.8, price: '$$$', location: 'Colombo 03', image: 'https://picsum.photos/seed/venue1/400/300', booked: true, status: 'Confirmed' },
  { id: 2, name: 'Dimitri Photography', category: 'Photography', rating: 4.9, price: '$$', location: 'Mount Lavinia', image: 'https://picsum.photos/seed/photo1/400/300', booked: true, status: 'Confirmed' },
  { id: 3, name: 'Royal Catering', category: 'Catering', rating: 4.5, price: '$$', location: 'Colombo 07', image: 'https://picsum.photos/seed/catering1/400/300', booked: false },
  { id: 4, name: 'Floral Dreams', category: 'Decoration', rating: 4.7, price: '$', location: 'Negombo', image: 'https://picsum.photos/seed/decor1/400/300', booked: false },
  { id: 5, name: 'Glamour Makeup', category: 'Makeup', rating: 4.6, price: '$$', location: 'Kandy', image: 'https://picsum.photos/seed/makeup1/400/300', booked: false },
  { id: 6, name: 'The Sound Crew', category: 'Entertainment', rating: 4.4, price: '$$', location: 'Colombo 05', image: 'https://picsum.photos/seed/dj1/400/300', booked: false },
];

export default function VendorTab() {
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All');
  const [isQuoteModalOpen, setIsQuoteModalOpen] = useState(false);
  const [selectedVendor, setSelectedVendor] = useState<any>(null);

  const bookedVendors = MOCK_VENDORS.filter(v => v.booked);
  const availableVendors = MOCK_VENDORS.filter(v => !v.booked && (category === 'All' || v.category === category));

  const handleRequestQuote = (vendor: any) => {
    setSelectedVendor(vendor);
    setIsQuoteModalOpen(true);
  };

  return (
    <Box>
      {/* My Booked Vendors Section */}
      <Box sx={{ mb: 6 }}>
        <Typography variant="h6" sx={{ fontWeight: 800, color: COLORS.primary, mb: 3, fontFamily: 'Playfair Display', display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <CheckCircle2 size={24} color={COLORS.success} />
          My Booked Vendors
        </Typography>
        <Grid container spacing={3}>
          {bookedVendors.map((vendor, i) => (
            <Grid key={vendor.id} size={{ xs: 12, md: 6 }}>
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
                <CardContent sx={{ p: 0 }}>
                  <Grid container>
                    <Grid size={{ xs: 4 }}>
                      <Box 
                        component="img" 
                        src={vendor.image} 
                        sx={{ width: '100%', height: '100%', objectFit: 'cover', minHeight: 140 }}
                        referrerPolicy="no-referrer"
                      />
                    </Grid>
                    <Grid size={{ xs: 8 }} sx={{ p: 3 }}>
                      <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
                        <Box>
                          <Chip 
                            label={vendor.category} 
                            size="small" 
                            sx={{ bgcolor: COLORS.primary, color: 'white', fontWeight: 700, mb: 1, fontSize: '0.65rem' }} 
                          />
                          <Typography variant="h6" sx={{ fontWeight: 800, color: COLORS.textPrimary }}>{vendor.name}</Typography>
                        </Box>
                        <Chip 
                          label={vendor.status} 
                          size="small" 
                          sx={{ bgcolor: COLORS.success, color: 'white', fontWeight: 800, fontSize: '0.7rem' }} 
                        />
                      </Stack>
                      <Stack direction="row" spacing={3} sx={{ mt: 2 }}>
                        <Box>
                          <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block' }}>Agreed Price</Typography>
                          <Typography variant="subtitle2" sx={{ fontWeight: 700, color: COLORS.primary }}>LKR 250,000</Typography>
                        </Box>
                        <Box>
                          <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block' }}>Contact</Typography>
                          <Stack direction="row" spacing={1}>
                            <IconButton size="small" sx={{ p: 0.5, color: COLORS.accent }}><Phone size={14} /></IconButton>
                            <IconButton size="small" sx={{ p: 0.5, color: COLORS.accent }}><Mail size={14} /></IconButton>
                          </Stack>
                        </Box>
                      </Stack>
                    </Grid>
                  </Grid>
                </CardContent>
              </MotionCard>
            </Grid>
          ))}
        </Grid>
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
          <Button 
            variant="outlined" 
            startIcon={<Filter size={18} />}
            sx={{ height: 56, borderRadius: 4, px: 3, color: COLORS.textPrimary, borderColor: 'divider', fontWeight: 700 }}
          >
            Filters
          </Button>
        </Stack>
      </Box>

      {/* Vendor Grid */}
      <Grid container spacing={3}>
        {availableVendors.map((vendor, i) => (
          <Grid key={vendor.id} size={{ xs: 12, sm: 6, lg: 4 }}>
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
              <Box sx={{ position: 'relative', height: 200 }}>
                <Box 
                  component="img" 
                  src={vendor.image} 
                  sx={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  referrerPolicy="no-referrer"
                />
                <Box sx={{ 
                  position: 'absolute', 
                  top: 12, 
                  right: 12, 
                  bgcolor: 'rgba(255,255,255,0.9)', 
                  px: 1, 
                  py: 0.5, 
                  borderRadius: 2,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 0.5,
                  boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
                }}>
                  <Star size={14} fill={COLORS.secondary} color={COLORS.secondary} />
                  <Typography variant="caption" sx={{ fontWeight: 800 }}>{vendor.rating}</Typography>
                </Box>
                <IconButton 
                  sx={{ 
                    position: 'absolute', 
                    top: 12, 
                    left: 12, 
                    bgcolor: 'rgba(0,0,0,0.3)', 
                    color: 'white',
                    '&:hover': { bgcolor: 'rgba(0,0,0,0.5)' }
                  }}
                >
                  <Heart size={18} />
                </IconButton>
              </Box>
              <CardContent sx={{ p: 3, flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
                <Stack direction="row" justifyContent="space-between" alignItems="flex-start" sx={{ mb: 1 }}>
                  <Typography variant="subtitle2" sx={{ color: COLORS.accent, fontWeight: 800, textTransform: 'uppercase', letterSpacing: 1 }}>
                    {vendor.category}
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 700, color: COLORS.success }}>{vendor.price}</Typography>
                </Stack>
                <Typography variant="h6" sx={{ fontWeight: 800, color: COLORS.textPrimary, mb: 1 }}>{vendor.name}</Typography>
                <Stack direction="row" spacing={1} alignItems="center" sx={{ color: 'text.secondary', mb: 3 }}>
                  <MapPin size={14} />
                  <Typography variant="caption">{vendor.location}</Typography>
                </Stack>
                <Box sx={{ mt: 'auto' }}>
                  <Button 
                    fullWidth 
                    variant="contained" 
                    onClick={() => handleRequestQuote(vendor)}
                    sx={{ 
                      bgcolor: COLORS.primary, 
                      borderRadius: 3, 
                      fontWeight: 700, 
                      textTransform: 'none',
                      py: 1.2
                    }}
                  >
                    Request Quote
                  </Button>
                </Box>
              </CardContent>
            </MotionCard>
          </Grid>
        ))}
      </Grid>

      {/* Quote Modal */}
      <Dialog open={isQuoteModalOpen} onClose={() => setIsQuoteModalOpen(false)} fullWidth maxWidth="sm" PaperProps={{ sx: { borderRadius: 6 } }}>
        <DialogTitle sx={{ fontWeight: 800, fontFamily: 'Playfair Display', color: COLORS.primary }}>Request a Quote</DialogTitle>
        <DialogContent>
          {selectedVendor && (
            <Stack spacing={3} sx={{ mt: 1 }}>
              <Alert icon={<Info size={18} />} severity="info" sx={{ borderRadius: 3 }}>
                You are requesting a quote from <strong>{selectedVendor.name}</strong> for your wedding on <strong>Dec 28, 2025</strong>.
              </Alert>
              <TextField fullWidth label="Service Details" multiline rows={4} placeholder="Tell the vendor about your requirements..." />
              <Grid container spacing={2}>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField fullWidth label="Estimated Guests" type="number" />
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField fullWidth label="Budget Range (LKR)" placeholder="e.g. 100,000 - 150,000" />
                </Grid>
              </Grid>
            </Stack>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
          <Button onClick={() => setIsQuoteModalOpen(false)} sx={{ color: 'text.secondary', fontWeight: 700 }}>Cancel</Button>
          <Button variant="contained" sx={{ bgcolor: COLORS.primary, borderRadius: 3, px: 4, fontWeight: 700 }}>Send Request</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

const MotionCard = motion(Card);

