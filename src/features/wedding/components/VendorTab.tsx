import React, { useState, useEffect, useRef } from 'react';
import { 
  Box, Typography, Grid, Card, CardContent, 
  Stack, Button, TextField, 
  MenuItem, Select, FormControl, InputLabel,
  Chip, Divider, Pagination,
  Tooltip, IconButton
} from '@mui/material';
import { 
  Search, MapPin, CheckCircle2, Star, Info, Send
} from 'lucide-react';
import { motion } from 'motion/react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import weddingService from '../services/weddingService';
import { RootState } from '@/app/store/store';
import QuoteRequestModal from '@/features/vendors/components/QuoteRequestModal';

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
  warning: '#ED6C02',
  info: '#0288D1'
};

const CATEGORIES = [
  'Venue', 'Catering', 'Photography', 'Decoration', 
  'Attire', 'Entertainment', 'Makeup'
];

const CATEGORY_ALIASES: Record<string, string[]> = {
  Venue: ['Venue'],
  Catering: ['Catering'],
  Photography: ['Photography'],
  Decoration: ['Decor', 'Decoration'],
  Attire: ['Attire', 'Bridal Wear'],
  Entertainment: ['Music', 'Entertainment'],
  Makeup: ['Makeup'],
};

const STATUS_COLORS: Record<string, string> = {
  shortlisted: COLORS.warning,
  requested: COLORS.accent,
  booked: COLORS.success,
  cancelled: COLORS.error,
};

interface VendorTabProps {
  vendors?: any[];          // full vendor list from API (Vendor model)
  bookedVendorIds?: any[];  // project.vendors entries with status
  expenses?: any[];         // project.expenses for budget filtering
  totalBudget?: number;     // project.totalBudget for fallback filtering
  onStatusChange?: () => void | Promise<void>;
  readOnly?: boolean;
}
export default function VendorTab({ vendors = [], bookedVendorIds = [], expenses = [], totalBudget = 0, onStatusChange, readOnly }: VendorTabProps) {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All');
  const [vendorPage, setVendorPage] = useState(1);
  const VENDORS_PER_PAGE = 6; // 2 rows × 3 columns
   const [isQuoteModalOpen, setIsQuoteModalOpen] = useState(false);
  const [selectedVendor, setSelectedVendor] = useState<any>(null);
  const [updatingStatus, setUpdatingStatus] = useState<string | null>(null);
  const [localBookedVendorIds, setLocalBookedVendorIds] = useState<any[]>(Array.isArray(bookedVendorIds) ? bookedVendorIds : []);
  const vendorSectionRef = useRef<HTMLDivElement>(null);
  const { user } = useSelector((state: RootState) => state.auth);

  useEffect(() => {
    setLocalBookedVendorIds(Array.isArray(bookedVendorIds) ? bookedVendorIds.filter(Boolean) : []);
  }, [bookedVendorIds]);

  const safeVendors = Array.isArray(vendors) ? vendors.filter(Boolean) : [];
  const safeExpenses = Array.isArray(expenses) ? expenses.filter(Boolean) : [];

  // Build status map from project.vendors
  const statusMap: Record<string, { status: string; quotedAmount: number; selectedPackageName?: string; confirmedStart?: string; confirmedEnd?: string }> = {};
  localBookedVendorIds.forEach((bv: any) => {
    if (!bv) return;
    const vendorId = typeof bv?.vendorId === 'object' ? String(bv.vendorId?._id || bv.vendorId?.id || '') : String(bv?.vendorId || '');
    if (vendorId) {
      statusMap[vendorId] = {
        status: bv?.status,
        quotedAmount: Number(bv?.quotedAmount || 0),
        selectedPackageName: bv?.selectedPackageName || '',
        confirmedStart: bv?.confirmedStart || '',
        confirmedEnd: bv?.confirmedEnd || '',
      };
    }
  });

  const bookedVendors = safeVendors.filter((v: any) => {
    if (!v?._id) return false;
    const s = statusMap[String(v._id)];
    return s && ['requested', 'booked'].includes(s.status);
  });
  const availableVendors = safeVendors.filter((v: any) => {
    if (!v?._id) return false;
    const s = statusMap[String(v._id)];
    const notBooked = !s || s.status === 'shortlisted' || s.status === 'cancelled';
    const allowedCategories = CATEGORY_ALIASES[category] || [category];
    const matchesCategory = category === 'All' || allowedCategories.includes(v.category);
    const displayName = String(v.businessName || v.name || '');
    const matchSearch = !search || displayName.toLowerCase().includes(search.toLowerCase());

    // Budget filtering
    const categoryToExpenseMap: Record<string, string> = {
      Venue: 'Venue',
      Photography: 'Photography',
      Catering: 'Catering',
      Decoration: 'Decor',
      Attire: 'Attire',
      Makeup: 'Beauty',
      Entertainment: 'Others'
    };
    const expenseCategory = categoryToExpenseMap[category];
    let budgetLimit = 0;
    if (expenseCategory) {
      budgetLimit = safeExpenses
        .filter((e: any) => e && e.category === expenseCategory)
        .reduce((sum, e) => sum + Number(e.amount || 0), 0);
      
      // Fallback: If no manual allocation, use percentage of total budget
      if (!budgetLimit && totalBudget > 0) {
        const fallbackPercentages: Record<string, number> = {
          Venue: 0.25,
          Catering: 0.20,
          Photography: 0.15,
          Decoration: 0.10,
          Attire: 0.10,
          Makeup: 0.05,
          Entertainment: 0.05
        };
        const percentage = fallbackPercentages[category];
        if (percentage) {
          budgetLimit = totalBudget * percentage;
        }
      }
    }
    const matchBudget = !budgetLimit || Number(v.pricingRange?.min || 0) <= budgetLimit;

    return notBooked && matchesCategory && matchSearch && matchBudget;
  });

  useEffect(() => {
    setVendorPage(1);
  }, [search, category]);

  const totalVendorPages = Math.ceil(availableVendors.length / VENDORS_PER_PAGE);
  const pagedVendors = availableVendors.slice((vendorPage - 1) * VENDORS_PER_PAGE, vendorPage * VENDORS_PER_PAGE);

  const handleRequestQuote = (vendor: any) => {
    if (readOnly) return;
    setSelectedVendor(vendor);
    setIsQuoteModalOpen(true);
  };

  const handleStatusChange = async (vendorId: string, newStatus: string) => {
    setUpdatingStatus(vendorId);
    const previous = localBookedVendorIds;
    setLocalBookedVendorIds((curr) => curr.map((entry: any) => {
      const entryVendorId = typeof entry?.vendorId === 'object'
        ? String(entry.vendorId?._id || entry.vendorId?.id || '')
        : String(entry?.vendorId || '');
      if (entryVendorId !== vendorId) return entry;
      return { ...entry, status: newStatus };
    }));

    try {
      await weddingService.updateVendorStatus(vendorId, newStatus);
      await onStatusChange?.();
    } catch {
      setLocalBookedVendorIds(previous);
    }
    finally { setUpdatingStatus(null); }
  };

  return (
    <Box>
      {/* My Booked Vendors Section */}
      <Box sx={{ mb: 6 }}>
        <Typography variant="h6" sx={{ fontWeight: 800, color: COLORS.primary, mb: 3, fontFamily: 'Playfair Display', display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <CheckCircle2 size={24} color={COLORS.success} />
          My Booked Vendors
          <Tooltip title="Vendors you've requested quotes from or booked. They receive your requests instantly in their dedicated Vendor Portal.">
            <IconButton size="small" sx={{ ml: 0.5, color: 'text.secondary' }}>
              <Info size={16} />
            </IconButton>
          </Tooltip>
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
                    <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 2 }}>
                      <Box sx={{ width: 64, height: 64, borderRadius: 3, overflow: 'hidden', bgcolor: `${COLORS.primary}10`, flexShrink: 0 }}>
                        {vendor.portfolioImages?.[0] ? (
                          <Box component="img" src={vendor.portfolioImages[0]} sx={{ width: '100%', height: '100%', objectFit: 'cover' }} referrerPolicy="no-referrer" />
                        ) : null}
                      </Box>
                      <Box sx={{ minWidth: 0, flex: 1 }}>
                        <Chip 
                          label={vendor.category} 
                          size="small" 
                          sx={{ bgcolor: COLORS.primary, color: 'white', fontWeight: 700, mb: 1, fontSize: '0.65rem' }} 
                        />
                        <Typography variant="h6" sx={{ fontWeight: 800, color: COLORS.textPrimary }}>{vendor.businessName || vendor.name}</Typography>
                        <Typography variant="caption" color="text.secondary">{vendor.city || vendor.location || vendor.serviceArea?.[0] || ''}</Typography>
                        {entry?.status === 'requested' && (
                          <Box sx={{ mt: 1, display: 'flex', alignItems: 'center', gap: 0.5, color: COLORS.accent }}>
                            <Send size={12} />
                            <Typography variant="caption" sx={{ fontWeight: 600 }}>Sent to Vendor Portal</Typography>
                          </Box>
                        )}
                      </Box>
                      <Tooltip title={entry?.status === 'requested' ? "The vendor has received your request in their portal and will respond with a quote soon." : "Vendor Status"}>
                        <Chip 
                          label={entry?.status?.toUpperCase()} 
                          size="small" 
                          sx={{ bgcolor: STATUS_COLORS[entry?.status] || COLORS.accent, color: 'white', fontWeight: 800, fontSize: '0.7rem' }} 
                        />
                      </Tooltip>
                    </Stack>
                    <Stack direction="row" spacing={1} sx={{ mt: 2 }}>
                      {entry?.status !== 'cancelled' && (
                        <Button
                          size="small"
                          variant="outlined"
                          disabled={updatingStatus === String(vendor._id) || readOnly}
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
                    {entry?.selectedPackageName ? (
                      <Typography variant="caption" sx={{ mt: 0.5, display: 'block', color: 'text.secondary' }}>
                        Package: {entry.selectedPackageName}
                      </Typography>
                    ) : null}
                    {entry?.confirmedStart ? (
                      <Typography variant="caption" sx={{ mt: 0.5, display: 'block', color: 'text.secondary' }}>
                        Confirmed Slot: {new Date(entry.confirmedStart).toLocaleString()}
                        {entry?.confirmedEnd ? ` - ${new Date(entry.confirmedEnd).toLocaleTimeString()}` : ''}
                      </Typography>
                    ) : null}
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
      <Box ref={vendorSectionRef} sx={{ mb: 4 }}>
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
      <>
      <Grid container spacing={3}>
        {pagedVendors.map((vendor: any, i: number) => (
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
                {vendor.portfolioImages?.[0] ? (
                  <Box component="img" src={vendor.portfolioImages[0]} sx={{ width: '100%', height: '100%', objectFit: 'cover' }} referrerPolicy="no-referrer" />
                ) : (
                  <Typography variant="h3" sx={{ color: COLORS.primary, opacity: 0.2, fontFamily: 'Playfair Display' }}>{(vendor.businessName || vendor.name)?.[0]}</Typography>
                )}
                {vendor.ratings?.average && (
                  <Box sx={{ position: 'absolute', top: 12, right: 12, bgcolor: 'rgba(255,255,255,0.9)', px: 1, py: 0.5, borderRadius: 2, display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <Star size={14} fill={COLORS.secondary} color={COLORS.secondary} />
                    <Typography variant="caption" sx={{ fontWeight: 800 }}>{Number(vendor.ratings.average || 0).toFixed(1)}</Typography>
                  </Box>
                )}
              </Box>
              <CardContent sx={{ p: 3, flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
                <Stack direction="row" justifyContent="space-between" alignItems="flex-start" sx={{ mb: 1 }}>
                  <Typography variant="subtitle2" sx={{ color: COLORS.accent, fontWeight: 800, textTransform: 'uppercase', letterSpacing: 1, fontSize: '0.7rem' }}>
                    {vendor.category}
                  </Typography>
                </Stack>
                <Typography variant="h6" sx={{ fontWeight: 800, color: COLORS.textPrimary, mb: 1 }}>{vendor.businessName || vendor.name}</Typography>
                {(vendor.city || vendor.serviceArea?.[0]) && (
                  <Stack direction="row" spacing={1} alignItems="center" sx={{ color: 'text.secondary', mb: 2 }}>
                    <MapPin size={14} />
                    <Typography variant="caption">{vendor.city || vendor.serviceArea?.[0]}</Typography>
                  </Stack>
                )}
                <Stack direction="row" spacing={1} sx={{ mt: 'auto' }}>
                  <Button 
                    variant="contained" 
                    onClick={() => handleRequestQuote(vendor)}
                    disabled={readOnly}
                    sx={{ flex: 2, bgcolor: COLORS.primary, borderRadius: 3, fontWeight: 700, textTransform: 'none', py: 1.2 }}
                  >
                    Request Quote
                  </Button>
                  <Button 
                    variant="outlined" 
                    onClick={() => navigate(`/vendors?search=${encodeURIComponent(vendor.businessName || vendor.name)}`)}
                    sx={{ flex: 1, color: COLORS.primary, borderColor: COLORS.primary, borderRadius: 3, fontWeight: 700, textTransform: 'none', py: 1.2, fontSize: '0.75rem' }}
                  >
                    More Details
                  </Button>
                </Stack>
              </CardContent>
            </MotionCard>
          </Grid>
        ))}
      </Grid>
      {totalVendorPages > 1 && (
        <Stack alignItems="center" sx={{ mt: 4 }}>
          <Pagination
            count={totalVendorPages}
            page={vendorPage}
            onChange={(_, page) => { 
              setVendorPage(page); 
              vendorSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }}
            color="primary"
            sx={{
              '& .MuiPaginationItem-root': { fontWeight: 700, borderRadius: 2 },
              '& .Mui-selected': { bgcolor: '#8B1A2E !important', color: 'white' },
            }}
          />
          <Typography variant="caption" color="text.secondary" sx={{ mt: 1 }}>
            Showing {(vendorPage - 1) * VENDORS_PER_PAGE + 1}–{Math.min(vendorPage * VENDORS_PER_PAGE, availableVendors.length)} of {availableVendors.length} vendors
          </Typography>
        </Stack>
      )}
      </>
      )}
      <QuoteRequestModal
        open={isQuoteModalOpen}
        mode="wedding"
        onClose={() => {
          setIsQuoteModalOpen(false);
        }}
        vendor={selectedVendor ? {
          id: selectedVendor._id,
          name: selectedVendor.businessName || selectedVendor.name,
          category: selectedVendor.category,
          location: selectedVendor.city || selectedVendor.location || (Array.isArray(selectedVendor.serviceArea) ? selectedVendor.serviceArea[0] : ''),
          pricingRange: selectedVendor.pricingRange,
          packages: selectedVendor.packages || selectedVendor.packageSummary || [],
          packageSummary: selectedVendor.packageSummary || [],
        } : null}
        weddingDate={(() => {
          const dVal = user?.weddingProject?.weddingDate || '';
          if (!dVal) return '';
          const d = new Date(dVal);
          return isNaN(d.getTime()) ? '' : d.toISOString().split('T')[0];
        })()}
        userPhone={user?.phone || ''}
        userEmail={user?.email || ''}
        userName={user?.name || user?.firstName || ''}
        remainingBudget={Math.max(0, totalBudget - localBookedVendorIds.reduce((sum: number, bv: any) => sum + Number(bv?.quotedAmount || 0), 0))}
        onSubmitSuccess={() => {
          setIsQuoteModalOpen(false);
          onStatusChange?.();
        }}
      />
    </Box>
  );
}

const MotionCard = motion(Card);
