import React, { useState, useEffect, useMemo } from 'react';
import { 
  Box, Container, Typography, Grid, Stack, 
  Tabs, Tab, TextField, InputAdornment, 
  IconButton, Button, Slider, FormControl, 
  FormLabel, RadioGroup, FormControlLabel, 
  Radio, Checkbox, Select, MenuItem, 
  InputLabel, Drawer, useTheme, useMediaQuery,
  Skeleton, Alert, Badge, Divider, Chip, Card, CardContent
} from '@mui/material';
import { 
  Search, Filter, X, SlidersHorizontal, 
  MapPin, Star, DollarSign, Calendar, 
  CheckCircle2, Store, Camera, Utensils, 
  Flower2, Scissors, Music, Heart, 
  ChevronRight, ArrowRight, LayoutGrid, 
  ListFilter, Sparkles, AlertCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useSelector } from 'react-redux';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { RootState } from '@/app/store/store';
import vendorService from '../services/vendorService';
import weddingService from '@/features/wedding/services/weddingService';
import { connectSocket } from '@/shared/hooks/useRealtimeUpdates';

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
  'Ampara',
  'Anuradhapura',
  'Badulla',
  'Batticaloa',
  'Colombo',
  'Galle',
  'Gampaha',
  'Hambantota',
  'Jaffna',
  'Kalutara',
  'Kandy',
  'Kegalle',
  'Kurunegala',
  'Mannar',
  'Matale',
  'Matara',
  'Monaragala',
  'Mullaitivu',
  'Nuwara Eliya',
  'Polonnaruwa',
  'Puttalam',
  'Ratnapura',
  'Trincomalee',
  'Vavuniya'
];

const FALLBACK_VENDOR_IMAGE = 'https://picsum.photos/seed/vendor-marketplace/800/600';
const CATEGORY_LABELS: Record<string, string> = {
  Attire: 'Bridal Wear',
  Decor: 'Decoration',
  Music: 'Entertainment',
  Planner: 'Wedding Planner',
};

const CATEGORY_MATCHERS: Record<string, string[]> = {
  venue: ['Venue'],
  photography: ['Photography'],
  catering: ['Catering'],
  decoration: ['Decor', 'Decoration'],
  attire: ['Attire', 'Bridal Wear'],
  makeup: ['Makeup'],
  entertainment: ['Music', 'Entertainment'],
};

const CATEGORY_BUDGET_KEYS: Record<string, string[]> = {
  venue: ['Venue'],
  photography: ['Photography'],
  catering: ['Catering'],
  decoration: ['Decor', 'Decoration'],
  attire: ['Attire', 'Bridal Wear'],
  makeup: ['Beauty', 'Makeup'],
  entertainment: ['Others', 'Entertainment', 'Music'],
};

const normalizeBudgetCategory = (value: string) => value.trim().toLowerCase();

function buildBudgetSummary(project: any) {
  const expenses = Array.isArray(project?.expenses) ? project.expenses : [];
  const byCategory = project?.byCategory && typeof project.byCategory === 'object' ? project.byCategory : {};
  const allocationCandidates = [
    project?.budgetAllocations,
    project?.allocations,
    project?.categoryAllocations,
    project?.budget?.allocations,
    byCategory,
  ];

  const allocatedByCategory: Record<string, number> = {};
  const spentByCategory: Record<string, number> = {};

  expenses.forEach((expense: any) => {
    const key = normalizeBudgetCategory(String(expense?.category || 'Others'));
    spentByCategory[key] = (spentByCategory[key] || 0) + Number(expense?.amount || 0);
  });

  if (byCategory && typeof byCategory === 'object') {
    Object.entries(byCategory).forEach(([category, details]: [string, any]) => {
      const key = normalizeBudgetCategory(category);
      const spent = Number(details?.spent ?? 0);
      const allocated = Number(details?.allocated ?? 0);
      if (!Number.isNaN(spent) && spent > 0) {
        spentByCategory[key] = (spentByCategory[key] || 0) + spent;
      }
      if (!Number.isNaN(allocated) && allocated > 0) {
        allocatedByCategory[key] = (allocatedByCategory[key] || 0) + allocated;
      }
    });
  }

  allocationCandidates.forEach((candidate: any) => {
    if (!candidate) return;

    if (Array.isArray(candidate)) {
      candidate.forEach((item: any) => {
        const categoryName = item?.category || item?.name;
        if (!categoryName) return;
        const key = normalizeBudgetCategory(String(categoryName));
        const value = Number(item?.allocated ?? item?.amount ?? item?.budget ?? 0);
        if (!Number.isNaN(value) && value > 0) {
          allocatedByCategory[key] = (allocatedByCategory[key] || 0) + value;
        }
      });
      return;
    }

    if (typeof candidate === 'object') {
      Object.entries(candidate).forEach(([category, rawValue]: [string, any]) => {
        const key = normalizeBudgetCategory(category);
        const value = Number(
          typeof rawValue === 'number'
            ? rawValue
            : rawValue?.allocated ?? rawValue?.amount ?? rawValue?.budget ?? 0
        );
        if (!Number.isNaN(value) && value > 0) {
          allocatedByCategory[key] = (allocatedByCategory[key] || 0) + value;
        }
      });
    }
  });

  const totalBudget = Number(project?.totalBudget || 0);
  const totalSpent = Object.values(spentByCategory).reduce((sum, value) => sum + Number(value || 0), 0);

  return {
    totalBudget,
    totalSpent,
    hasExpenseData: expenses.length > 0 || totalSpent > 0,
    spentByCategory,
    allocatedByCategory,
  };
}

// Normalize date to YYYY-MM-DD format (handles ISO strings and Date objects)
const normalizeDate = (dateVal: any): string => {
  if (!dateVal) return '';
  const d = new Date(dateVal);
  if (Number.isNaN(d.getTime())) return '';
  return d.toISOString().split('T')[0];
};

function mapVendorCard(vendor: any) {
  const portfolio = Array.isArray(vendor?.portfolioImages) ? vendor.portfolioImages : [];
  const packages = Array.isArray(vendor?.packages)
    ? vendor.packages
        .filter((item: any) => item && item.name)
        .map((item: any, index: number) => ({
          id: String(item.id || item.packageId || `pkg-${index + 1}`),
          packageId: String(item.packageId || item.id || `pkg-${index + 1}`),
          name: String(item.name),
          description: String(item.description || ''),
          price: Number(item.price || 0),
          currency: String(item.currency || 'LKR'),
          durationHours: Number(item.durationHours || 0),
        }))
    : [];
  const packageSummary = Array.isArray(vendor?.packageSummary) ? vendor.packageSummary : [];
  const minPrice = Number(vendor?.pricingRange?.min || 0);
  const maxPrice = Number(vendor?.pricingRange?.max || 0);
  const category = CATEGORY_LABELS[vendor?.category] || vendor?.category || 'Vendor';
  const availabilityCalendar = Array.isArray(vendor?.availabilityCalendar)
    ? vendor.availabilityCalendar
        .map((entry: any) => {
          const normalizedDate = normalizeDate(entry?.date);
          if (!normalizedDate) return null;
          return {
            date: normalizedDate,
            status: entry?.status || 'available',
          };
        })
        .filter(Boolean)
    : [];

  return {
    id: String(vendor?.id || vendor?._id || ''),
    name: vendor?.businessName || vendor?.owner?.name || 'Wedding Vendor',
    category,
    rating: Number(vendor?.ratings?.average || 0),
    reviewCount: Number(vendor?.ratings?.count || vendor?.reviews?.length || 0),
    location: vendor?.city || (Array.isArray(vendor?.serviceArea) && vendor.serviceArea.length > 0 ? vendor.serviceArea.join(', ') : 'Sri Lanka'),
    priceRange: `LKR ${minPrice.toLocaleString()} — ${maxPrice.toLocaleString()}`,
    description: vendor?.description || 'Professional wedding services for your celebration.',
    image: portfolio[0] || FALLBACK_VENDOR_IMAGE,
    portfolio,
    packages,
    packageSummary,
    verified: Boolean(vendor?.verified),
    popular: Boolean(vendor?.verified && Number(vendor?.ratings?.count || 0) >= 3),
    isFavorite: false,
    city: vendor?.city || '',
    serviceArea: Array.isArray(vendor?.serviceArea) ? vendor.serviceArea : [],
    minPrice,
    maxPrice,
    availabilityCalendar,
  };
}

export default function VendorMarketplace() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [activeCategory, setActiveCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [vendors, setVendors] = useState<any[]>([]);
  const [selectedVendor, setSelectedVendor] = useState<any>(null);
  const [isQuoteModalOpen, setIsQuoteModalOpen] = useState(false);
  const [planningAccessGranted, setPlanningAccessGranted] = useState(false);
  const [planningCheckLoading, setPlanningCheckLoading] = useState(true);

  // Filter States
  const [minRating, setMinRating] = useState('0');
  const [selectedDistricts, setSelectedDistricts] = useState<string[]>([]);
  const [availableOnly, setAvailableOnly] = useState(false);
  const [rawProject, setRawProject] = useState<any>(null);

  const { token, user } = useSelector((state: RootState) => state.auth);

  useEffect(() => {
    const fetchVendors = async () => {
      setLoading(true);
      try {
        const [response, projectResponse] = await Promise.all([
          vendorService.searchVendors(),
          weddingService.getProject().catch(() => null),
        ]);
        const items = Array.isArray(response?.data?.items) ? response.data.items : [];
        const project = projectResponse?.data;
        setRawProject(project);

        const isCoupled = Array.isArray(project?.coupleUserIds) && project.coupleUserIds.length >= 2;
        setPlanningAccessGranted(isCoupled);
        setVendors(items.map(mapVendorCard));
      } catch (err) {
        console.error('Failed to load vendors', err);
        setPlanningAccessGranted(false);
        setVendors([]);
      } finally {
        setLoading(false);
        setPlanningCheckLoading(false);
      }
    };

    if (token) {
      fetchVendors();
      return;
    }

    setVendors([]);
    setPlanningAccessGranted(false);
    setPlanningCheckLoading(false);
    setLoading(false);
  }, [token]);

  useEffect(() => {
    const search = searchParams.get('search');
    if (search) {
      setSearchQuery(search);
    }
  }, [searchParams]);

  useEffect(() => {
    // Ensure scrolling is enabled
    document.body.style.overflow = 'auto';
    document.documentElement.style.overflow = 'auto';
  }, []);

  // Unlock immediately when partner accepts the wedding invite
  useEffect(() => {
    if (!token) return;
    const checkAccess = async () => {
      try {
        const projectResponse = await weddingService.getProject();
        const project = projectResponse?.data;
        const isCoupled = Array.isArray(project?.coupleUserIds) && project.coupleUserIds.length >= 2;
        if (isCoupled) setPlanningAccessGranted(true);
      } catch { /* silent */ }
    };
    const socket = connectSocket(token);
    socket.on('planning_unlocked', checkAccess);
    window.addEventListener('planning:unlocked', checkAccess);
    return () => {
      socket.off('planning_unlocked', checkAccess);
      window.removeEventListener('planning:unlocked', checkAccess);
    };
  }, [token]);

  const handleCategoryChange = (_: React.SyntheticEvent, newValue: string) => {
    setActiveCategory(newValue);
  };

  const handleRequestQuote = (vendor: any) => {
    setSelectedVendor(vendor);
    setIsQuoteModalOpen(true);
  };

  const handleResetFilters = () => {
    setMinRating('0');
    setSelectedDistricts([]);
    setAvailableOnly(false);
  };

  const weddingDateKey = normalizeDate(user?.weddingProject?.weddingDate);

  const normalizeDistrict = (value: string) => value.trim().toLowerCase();

  const budgetSummary = useMemo(() => buildBudgetSummary(rawProject), [rawProject]);

  const categoryBudgetGuidance = useMemo(() => {
    if (activeCategory === 'all') {
      return {
        categoryLabel: '',
        limit: null as number | null,
        mode: null as 'allocation' | 'total' | null,
      };
    }

    const categoryLabels = CATEGORY_BUDGET_KEYS[activeCategory] || [];
    const normalizedKeys = categoryLabels.map(normalizeBudgetCategory);
    const allocated = normalizedKeys.reduce((sum, key) => sum + Number(budgetSummary.allocatedByCategory[key] || 0), 0);
    const spent = normalizedKeys.reduce((sum, key) => sum + Number(budgetSummary.spentByCategory[key] || 0), 0);
    const totalBudget = Number(budgetSummary.totalBudget || 0);

    if (allocated > 0) {
      return {
        categoryLabel: categoryLabels[0] || activeCategory,
        limit: Math.max(0, allocated - spent),
        mode: 'allocation' as const,
      };
    }

    if (totalBudget > 0) {
      return {
        categoryLabel: categoryLabels[0] || activeCategory,
        limit: totalBudget,
        mode: 'total' as const,
      };
    }

    return {
      categoryLabel: categoryLabels[0] || activeCategory,
      limit: null,
      mode: null,
    };
  }, [activeCategory, budgetSummary]);

  const filteredVendors = vendors.filter(v => {
    const allowedCategories = CATEGORY_MATCHERS[activeCategory] || [];
    const matchesCategory = activeCategory === 'all' || allowedCategories.includes(v.category);
    const matchesSearch = v.name.toLowerCase().includes(searchQuery.toLowerCase()) || v.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRating = v.rating >= parseFloat(minRating);

    const budgetLimit = categoryBudgetGuidance.limit;
    const matchesPrice =
      activeCategory === 'all' ||
      !budgetLimit ||
      budgetLimit <= 0 ||
      Number(v.minPrice || 0) <= budgetLimit;

    const vendorDistricts = [v.city, ...(Array.isArray(v.serviceArea) ? v.serviceArea : [])]
      .filter(Boolean)
      .map((d: string) => normalizeDistrict(d));
    const matchesDistrict =
      selectedDistricts.length === 0 ||
      selectedDistricts.some((district) => vendorDistricts.includes(normalizeDistrict(district)));

    // Availability check: if box unchecked or no wedding date, show all; otherwise check calendar
    const matchesAvailability = !availableOnly || !weddingDateKey || (() => {
      const dayEntry = Array.isArray(v.availabilityCalendar)
        ? v.availabilityCalendar.find((entry: any) => {
            const entryDate = normalizeDate(entry?.date);
            return entryDate === weddingDateKey;
          })
        : null;
      // If no explicit entry, assume available; if entry exists, check status
      if (!dayEntry) return true;
      return dayEntry.status === 'available';
    })();

    return matchesCategory && matchesSearch && matchesRating && matchesPrice && matchesDistrict && matchesAvailability;
  });

  return (
    <Box sx={{ bgcolor: COLORS.cream, minHeight: '100vh', pb: 10, position: 'relative' }}>
      <Box>
      {/* Hero Section & Category Tabs */}
      <Box sx={{ bgcolor: COLORS.white, pt: 6, pb: 2, borderBottom: '1px solid', borderColor: 'divider', position: 'sticky', top: 0, zIndex: 100 }}>
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
        {activeCategory !== 'all' && categoryBudgetGuidance.limit && (
          <Alert 
            severity="success" 
            icon={<Sparkles size={18} />}
            sx={{ mb: 4, borderRadius: 4, border: '1px solid rgba(46, 125, 50, 0.2)' }}
          >
            <Typography variant="body2" sx={{ fontWeight: 700 }}>
              {categoryBudgetGuidance.mode === 'allocation'
                ? `Showing affordable vendors for ${categoryBudgetGuidance.categoryLabel} based on your remaining allocation: LKR ${categoryBudgetGuidance.limit.toLocaleString()}`
                : `No category allocation found. Showing ${categoryBudgetGuidance.categoryLabel} vendors compatible with your total budget: LKR ${categoryBudgetGuidance.limit.toLocaleString()}`
              }
            </Typography>
          </Alert>
        )}
        <Grid container spacing={4}>
          {/* Sidebar Filter (Desktop) */}
          {!isMobile && (
            <Grid size={{ md: 3 }}>
              <Box sx={{ position: 'sticky', top: 180 }}>
                <FilterSidebar 
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
            {!planningAccessGranted && !planningCheckLoading && (
              <Alert 
                severity="info" 
                icon={<Sparkles size={20} color={COLORS.primary} />}
                sx={{ 
                  mb: 4, 
                  borderRadius: 4, 
                  bgcolor: '#FFF8E7', 
                  border: '1px solid #E6C87E',
                  '& .MuiAlert-message': { width: '100%' }
                }}
              >
                <Typography variant="subtitle2" sx={{ fontWeight: 800, color: COLORS.primary }}>
                  Explore & Discover Vendors
                </Typography>
                <Typography variant="caption" color="textSecondary" sx={{ display: 'block', mb: 1 }}>
                  You can browse and view portfolios now. The ability to request quotes and book vendors will unlock once both partners accept the wedding invite.
                </Typography>
                <Button 
                  size="small" 
                  onClick={() => navigate('/messages')}
                  sx={{ color: COLORS.primary, fontWeight: 700, textTransform: 'none', p: 0 }}
                >
                  Go to Messages to invite partner →
                </Button>
              </Alert>
            )}
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
                    <VendorCard vendor={vendor} onRequestQuote={handleRequestQuote} disabled={!planningAccessGranted} />
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
        weddingDate={(() => {
          const dVal = user?.weddingProject?.weddingDate || '';
          if (!dVal) return '';
          const d = new Date(dVal);
          return isNaN(d.getTime()) ? '' : d.toISOString().split('T')[0];
        })()}
        userPhone={user?.phone || ''}
        userEmail={user?.email || ''}
        userName={user?.name || user?.firstName || ''}
        remainingBudget={Math.max(0, (budgetSummary.totalBudget || 0) - (budgetSummary.totalSpent || 0))}
      />
      </Box>

      {/* Full screen lock overlay removed for better exploration experience */}
    </Box>
  );
}

// --- Helper Components ---

function FilterSidebar({ 
  minRating, setMinRating, 
  selectedDistricts, setSelectedDistricts, availableOnly, setAvailableOnly, onReset 
}: any) {
  return (
    <Stack spacing={4}>

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
