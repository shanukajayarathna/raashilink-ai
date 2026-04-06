import React, { useState, useEffect } from 'react';
import { 
  Box, Container, Typography, Grid, Stack, 
  Tabs, Tab, TextField, InputAdornment, 
  IconButton, Button, Slider, FormControl, 
  FormLabel, RadioGroup, FormControlLabel, 
  Radio, Checkbox, Select, MenuItem, 
  InputLabel, Drawer, useTheme, useMediaQuery,
  Skeleton, Alert, Badge, Divider, Chip
} from '@mui/material';
import { 
  Search, Filter, X, SlidersHorizontal, 
  MapPin, Star, DollarSign, Calendar, 
  CheckCircle2, Store, Camera, Utensils, 
  Flower2, Scissors, Music, Heart, 
  ChevronRight, ArrowRight, LayoutGrid, 
  ListFilter, Sparkles
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useSelector } from 'react-redux';
import { RootState } from '@/app/store/store';
import axios from 'axios';

// Sub-components
import VendorCard from '../components/VendorCard';
import QuoteRequestModal from '../components/QuoteRequestModal';

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
  { id: 'all', name: 'All', icon: <LayoutGrid size={20} /> },
  { id: 'venue', name: 'Venue', icon: <Store size={20} /> },
  { id: 'photography', name: 'Photography', icon: <Camera size={20} /> },
  { id: 'catering', name: 'Catering', icon: <Utensils size={20} /> },
  { id: 'decoration', name: 'Decoration', icon: <Flower2 size={20} /> },
  { id: 'attire', name: 'Bridal Wear', icon: <Scissors size={20} /> },
  { id: 'makeup', name: 'Makeup', icon: <Sparkles size={20} /> },
  { id: 'entertainment', name: 'Entertainment', icon: <Music size={20} /> },
];

const DISTRICTS = [
  'Colombo', 'Kandy', 'Galle', 'Matara', 'Jaffna', 'Negombo', 'Kurunegala', 'Ratnapura'
];

const MOCK_VENDORS = [
  {
    id: '1',
    name: 'Galle Face Hotel',
    category: 'Venue',
    rating: 4.8,
    reviewCount: 124,
    location: 'Colombo 03, Western Province',
    priceRange: 'LKR 250,000 — 800,000',
    description: 'A historic hotel offering grand ballrooms and stunning ocean views for a truly majestic Sri Lankan wedding experience.',
    image: 'https://picsum.photos/seed/galleface/800/600',
    portfolio: [
      'https://picsum.photos/seed/gf1/400/400',
      'https://picsum.photos/seed/gf2/400/400',
      'https://picsum.photos/seed/gf3/400/400'
    ],
    verified: true,
    popular: true,
    isFavorite: true
  },
  {
    id: '2',
    name: 'Dimitri Photography',
    category: 'Photography',
    rating: 4.9,
    reviewCount: 86,
    location: 'Mount Lavinia, Western Province',
    priceRange: 'LKR 120,000 — 350,000',
    description: 'Specializing in cinematic wedding storytelling and candid moments that capture the soul of your special day.',
    image: 'https://picsum.photos/seed/dimitri/800/600',
    portfolio: [
      'https://picsum.photos/seed/dp1/400/400',
      'https://picsum.photos/seed/dp2/400/400',
      'https://picsum.photos/seed/dp3/400/400'
    ],
    verified: true,
    popular: true
  },
  {
    id: '3',
    name: 'Royal Catering Services',
    category: 'Catering',
    rating: 4.7,
    reviewCount: 52,
    location: 'Colombo 07, Western Province',
    priceRange: 'LKR 1,500 — 4,500 per plate',
    description: 'Authentic Sri Lankan flavors and international cuisines prepared with the finest ingredients for your grand banquet.',
    image: 'https://picsum.photos/seed/royalcat/800/600',
    portfolio: [
      'https://picsum.photos/seed/rc1/400/400',
      'https://picsum.photos/seed/rc2/400/400',
      'https://picsum.photos/seed/rc3/400/400'
    ],
    verified: false
  },
  {
    id: '4',
    name: 'Floral Dreams by Niro',
    category: 'Decoration',
    rating: 4.6,
    reviewCount: 38,
    location: 'Negombo, Western Province',
    priceRange: 'LKR 80,000 — 250,000',
    description: 'Transforming spaces into magical floral wonderlands with bespoke designs that reflect your unique personality.',
    image: 'https://picsum.photos/seed/floralniro/800/600',
    portfolio: [
      'https://picsum.photos/seed/fn1/400/400',
      'https://picsum.photos/seed/fn2/400/400',
      'https://picsum.photos/seed/fn3/400/400'
    ],
    verified: true
  },
  {
    id: '5',
    name: 'Glamour Bridal Wear',
    category: 'Bridal Wear',
    rating: 4.5,
    reviewCount: 45,
    location: 'Kandy, Central Province',
    priceRange: 'LKR 45,000 — 150,000',
    description: 'Exquisite bridal sarees and custom-tailored suits that blend traditional elegance with modern sophistication.',
    image: 'https://picsum.photos/seed/glamour/800/600',
    portfolio: [
      'https://picsum.photos/seed/gb1/400/400',
      'https://picsum.photos/seed/gb2/400/400',
      'https://picsum.photos/seed/gb3/400/400'
    ],
    verified: true
  },
  {
    id: '6',
    name: 'The Sound Crew',
    category: 'Entertainment',
    rating: 4.4,
    reviewCount: 29,
    location: 'Colombo 05, Western Province',
    priceRange: 'LKR 35,000 — 90,000',
    description: 'Professional DJs and live bands that keep the energy high and the dance floor packed all night long.',
    image: 'https://picsum.photos/seed/soundcrew/800/600',
    portfolio: [
      'https://picsum.photos/seed/sc1/400/400',
      'https://picsum.photos/seed/sc2/400/400',
      'https://picsum.photos/seed/sc3/400/400'
    ],
    verified: false
  }
];

export default function VendorMarketplace() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [activeCategory, setActiveCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [vendors, setVendors] = useState<any[]>([]);
  const [selectedVendor, setSelectedVendor] = useState<any>(null);
  const [isQuoteModalOpen, setIsQuoteModalOpen] = useState(false);

  // Filter States
  const [priceRange, setPriceRange] = useState<number[]>([0, 500000]);
  const [minRating, setMinRating] = useState('4');
  const [selectedDistricts, setSelectedDistricts] = useState<string[]>([]);
  const [availableOnly, setAvailableOnly] = useState(false);

  const { token } = useSelector((state: RootState) => state.auth);

  useEffect(() => {
    const fetchVendors = async () => {
      setLoading(true);
      try {
        // Simulating API call to GET /api/v1/vendors
        await new Promise(resolve => setTimeout(resolve, 1500));
        setVendors(MOCK_VENDORS);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchVendors();
  }, [token]);

  const handleCategoryChange = (_: React.SyntheticEvent, newValue: string) => {
    setActiveCategory(newValue);
  };

  const handleRequestQuote = (vendor: any) => {
    setSelectedVendor(vendor);
    setIsQuoteModalOpen(true);
  };

  const handleResetFilters = () => {
    setPriceRange([0, 500000]);
    setMinRating('4');
    setSelectedDistricts([]);
    setAvailableOnly(false);
  };

  const filteredVendors = vendors.filter(v => {
    const matchesCategory = activeCategory === 'all' || v.category.toLowerCase().includes(activeCategory.toLowerCase());
    const matchesSearch = v.name.toLowerCase().includes(searchQuery.toLowerCase()) || v.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRating = v.rating >= parseFloat(minRating);
    return matchesCategory && matchesSearch && matchesRating;
  });

  return (
    <Box sx={{ bgcolor: COLORS.cream, minHeight: '100vh', pb: 10 }}>
      {/* Hero Section & Category Tabs */}
      <Box sx={{ bgcolor: COLORS.white, pt: 12, pb: 2, borderBottom: '1px solid', borderColor: 'divider', position: 'sticky', top: 0, zIndex: 100 }}>
        <Container maxWidth="xl">
          <Stack direction={{ xs: 'column', md: 'row' }} spacing={3} alignItems="center" sx={{ mb: 4 }}>
            <Box sx={{ flexGrow: 1 }}>
              <Typography variant="h4" sx={{ fontWeight: 800, fontFamily: 'Playfair Display', color: COLORS.primary, mb: 1 }}>
                Vendor Marketplace
              </Typography>
              <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                Discover and book the finest wedding professionals in Sri Lanka.
              </Typography>
            </Box>
            <Stack direction="row" spacing={2} sx={{ width: { xs: '100%', md: 'auto' } }}>
              <TextField 
                fullWidth 
                placeholder="Search vendors..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                InputProps={{ 
                  startAdornment: <Search size={18} style={{ marginRight: 10, color: COLORS.textSecondary }} />,
                  sx: { borderRadius: 4, bgcolor: `${COLORS.cream}50` }
                }}
                sx={{ minWidth: { md: 350 } }}
              />
              <Button 
                variant="outlined" 
                startIcon={<SlidersHorizontal size={18} />}
                onClick={() => setIsFilterOpen(true)}
                sx={{ 
                  borderRadius: 4, 
                  px: 3, 
                  color: COLORS.textPrimary, 
                  borderColor: 'divider', 
                  fontWeight: 700,
                  display: { md: 'none' }
                }}
              >
                Filters
              </Button>
            </Stack>
          </Stack>

          <Tabs 
            value={activeCategory} 
            onChange={handleCategoryChange} 
            variant="scrollable" 
            scrollButtons="auto"
            sx={{
              '& .MuiTabs-indicator': { bgcolor: COLORS.secondary, height: 3 },
              '& .MuiTab-root': { 
                textTransform: 'none', 
                fontWeight: 700, 
                fontSize: '0.95rem',
                color: COLORS.textSecondary,
                minHeight: 60,
                px: 3,
                '&.Mui-selected': { color: COLORS.primary }
              }
            }}
          >
            {CATEGORIES.map(cat => (
              <Tab 
                key={cat.id} 
                value={cat.id} 
                icon={cat.icon} 
                iconPosition="start" 
                label={cat.name} 
              />
            ))}
          </Tabs>
        </Container>
      </Box>

      <Container maxWidth="xl" sx={{ mt: 6 }}>
        <Grid container spacing={4}>
          {/* Sidebar Filter (Desktop) */}
          {!isMobile && (
            <Grid size={{ md: 3 }}>
              <Box sx={{ position: 'sticky', top: 180 }}>
                <FilterSidebar 
                  priceRange={priceRange} 
                  setPriceRange={setPriceRange}
                  minRating={minRating}
                  setMinRating={setMinRating}
                  selectedDistricts={selectedDistricts}
                  setSelectedDistricts={setSelectedDistricts}
                  availableOnly={availableOnly}
                  setAvailableOnly={setAvailableOnly}
                  onReset={handleResetFilters}
                />
              </Box>
            </Grid>
          )}

          {/* Vendor Grid */}
          <Grid size={{ xs: 12, md: 9 }}>
            {loading ? (
              <Grid container spacing={3}>
                {[...Array(6)].map((_, i) => (
                  <Grid size={{ xs: 12, sm: 6, lg: 4 }} key={i}>
                    <Skeleton variant="rectangular" height={450} sx={{ borderRadius: 6 }} />
                  </Grid>
                ))}
              </Grid>
            ) : filteredVendors.length > 0 ? (
              <Grid container spacing={3}>
                {filteredVendors.map((vendor, i) => (
                  <Grid size={{ xs: 12, sm: 6, lg: 4 }} key={vendor.id}>
                    <VendorCard vendor={vendor} onRequestQuote={handleRequestQuote} />
                  </Grid>
                ))}
              </Grid>
            ) : (
              <Box sx={{ textAlign: 'center', py: 12 }}>
                <AlertCircle size={64} color={COLORS.textSecondary} style={{ marginBottom: 24, opacity: 0.5 }} />
                <Typography variant="h5" sx={{ fontWeight: 800, color: COLORS.textPrimary, mb: 1 }}>No vendors found</Typography>
                <Typography variant="body1" sx={{ color: 'text.secondary', mb: 4 }}>Try adjusting your filters or search query.</Typography>
                <Button variant="contained" onClick={handleResetFilters} sx={{ bgcolor: COLORS.primary, borderRadius: 3 }}>
                  Reset All Filters
                </Button>
              </Box>
            )}
          </Grid>
        </Grid>
      </Container>

      {/* Mobile Filter Drawer */}
      <Drawer
        anchor="bottom"
        open={isFilterOpen}
        onClose={() => setIsFilterOpen(false)}
        PaperProps={{ sx: { borderRadius: '24px 24px 0 0', maxHeight: '90vh' } }}
      >
        <Box sx={{ p: 4 }}>
          <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 4 }}>
            <Typography variant="h6" sx={{ fontWeight: 800, color: COLORS.primary }}>Filters</Typography>
            <IconButton onClick={() => setIsFilterOpen(false)}><X size={24} /></IconButton>
          </Stack>
          <FilterSidebar 
            priceRange={priceRange} 
            setPriceRange={setPriceRange}
            minRating={minRating}
            setMinRating={setMinRating}
            selectedDistricts={selectedDistricts}
            setSelectedDistricts={setSelectedDistricts}
            availableOnly={availableOnly}
            setAvailableOnly={setAvailableOnly}
            onReset={handleResetFilters}
          />
          <Button 
            fullWidth 
            variant="contained" 
            onClick={() => setIsFilterOpen(false)}
            sx={{ mt: 4, bgcolor: COLORS.primary, py: 1.5, borderRadius: 3, fontWeight: 700 }}
          >
            Apply Filters
          </Button>
        </Box>
      </Drawer>

      {/* Quote Modal */}
      <QuoteRequestModal 
        open={isQuoteModalOpen} 
        onClose={() => setIsQuoteModalOpen(false)} 
        vendor={selectedVendor} 
      />
    </Box>
  );
}

// --- Helper Components ---

function FilterSidebar({ 
  priceRange, setPriceRange, minRating, setMinRating, 
  selectedDistricts, setSelectedDistricts, availableOnly, setAvailableOnly, onReset 
}: any) {
  return (
    <Stack spacing={4}>
      <Box>
        <Typography variant="subtitle2" sx={{ fontWeight: 800, mb: 2, color: COLORS.textPrimary }}>Price Range (LKR)</Typography>
        <Slider
          value={priceRange}
          onChange={(_, v) => setPriceRange(v as any)}
          valueLabelDisplay="auto"
          min={0}
          max={500000}
          step={10000}
          sx={{ color: COLORS.primary }}
        />
        <Stack direction="row" justifyContent="space-between">
          <Typography variant="caption" sx={{ color: 'text.secondary' }}>0</Typography>
          <Typography variant="caption" sx={{ color: 'text.secondary' }}>500,000+</Typography>
        </Stack>
      </Box>

      <Divider />

      <Box>
        <Typography variant="subtitle2" sx={{ fontWeight: 800, mb: 2, color: COLORS.textPrimary }}>Minimum Rating</Typography>
        <RadioGroup value={minRating} onChange={(e) => setMinRating(e.target.value)}>
          <FormControlLabel value="4.5" control={<Radio sx={{ color: COLORS.primary, '&.Mui-checked': { color: COLORS.primary } }} />} label="4.5+ ★ (Excellent)" />
          <FormControlLabel value="4" control={<Radio sx={{ color: COLORS.primary, '&.Mui-checked': { color: COLORS.primary } }} />} label="4.0+ ★ (Very Good)" />
          <FormControlLabel value="3" control={<Radio sx={{ color: COLORS.primary, '&.Mui-checked': { color: COLORS.primary } }} />} label="3.0+ ★ (Good)" />
        </RadioGroup>
      </Box>

      <Divider />

      <Box>
        <Typography variant="subtitle2" sx={{ fontWeight: 800, mb: 2, color: COLORS.textPrimary }}>District</Typography>
        <FormControl fullWidth size="small">
          <Select
            multiple
            value={selectedDistricts}
            onChange={(e) => setSelectedDistricts(typeof e.target.value === 'string' ? e.target.value.split(',') : e.target.value)}
            renderValue={(selected) => (
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                {selected.map((value: any) => (
                  <Chip key={value} label={value} size="small" />
                ))}
              </Box>
            )}
            sx={{ borderRadius: 3 }}
          >
            {DISTRICTS.map((name) => (
              <MenuItem key={name} value={name}>{name}</MenuItem>
            ))}
          </Select>
        </FormControl>
      </Box>

      <Divider />

      <Box>
        <FormControlLabel
          control={<Checkbox checked={availableOnly} onChange={(e) => setAvailableOnly(e.target.checked)} sx={{ color: COLORS.primary, '&.Mui-checked': { color: COLORS.primary } }} />}
          label={<Typography variant="body2" sx={{ fontWeight: 600 }}>Available on my wedding date</Typography>}
        />
      </Box>

      <Button 
        fullWidth 
        variant="text" 
        onClick={onReset}
        sx={{ color: COLORS.textSecondary, fontWeight: 700, textTransform: 'none' }}
      >
        Reset All Filters
      </Button>
    </Stack>
  );
}

const AlertCircle = ({ size, color, style }: any) => (
  <Box sx={{ display: 'flex', justifyContent: 'center', ...style }}>
    <CheckCircle2 size={size} color={color} />
  </Box>
);


