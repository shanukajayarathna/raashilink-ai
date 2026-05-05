import React, { useState, useEffect } from 'react';
import { 
  Box, Container, Typography, Grid, Stack, 
  Tabs, Tab, Button, IconButton, Chip, 
  Rating, Avatar, Divider, Card, CardContent,
  useTheme, useMediaQuery, Skeleton, Alert,
  ImageList, ImageListItem, Modal, Backdrop,
  Fade, LinearProgress, TextField
} from '@mui/material';
import { 
  Heart, MapPin, CheckCircle2, Star, 
  ChevronLeft, ExternalLink, MessageSquare,
  Facebook, Instagram, Globe, Phone,
  Mail, Clock, Briefcase, Users,
  Camera, Play, ArrowRight, Share2,
  Quote, Info, DollarSign, Package, X
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { RootState } from '@/app/store/store';
import vendorService from '../services/vendorService';
import weddingService from '@/features/wedding/services/weddingService';
import { connectSocket } from '@/shared/hooks/useRealtimeUpdates';

// Sub-components
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

const FALLBACK_VENDOR_IMAGE = 'https://picsum.photos/seed/vendor-detail/1920/1080';

function mapVendorDetail(vendor: any, reviewsPayload: any) {
  const portfolioImages = Array.isArray(vendor?.portfolioImages) ? vendor.portfolioImages : [];
  const reviews = Array.isArray(reviewsPayload?.data?.reviews) ? reviewsPayload.data.reviews : vendor?.reviews || [];
  const ratingValue = Number(reviewsPayload?.data?.ratings?.average || vendor?.ratings?.average || 0);
  const reviewCount = Number(reviewsPayload?.data?.ratings?.count || vendor?.ratings?.count || reviews.length || 0);
  const minPrice = Number(vendor?.pricingRange?.min || 0);
  const maxPrice = Number(vendor?.pricingRange?.max || 0);
  const serviceArea = Array.isArray(vendor?.serviceArea) && vendor.serviceArea.length > 0 ? vendor.serviceArea : ['Sri Lanka'];
  const services = Array.isArray(vendor?.featuredServices) && vendor.featuredServices.length > 0
    ? vendor.featuredServices
    : [vendor?.category, ...serviceArea.slice(0, 2)].filter(Boolean);

  const requestPackages = Array.isArray(vendor?.packages)
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

  const summaryPackages = Array.isArray(vendor?.packageSummary)
    ? vendor.packageSummary.filter(Boolean).map((item: string, index: number) => ({
        id: `summary-${index + 1}`,
        packageId: `summary-${index + 1}`,
        name: String(item),
        description: '',
        price: 0,
        currency: 'LKR',
        durationHours: 0,
      }))
    : [];

  const quotePackages = requestPackages.length > 0 ? requestPackages : summaryPackages;
  const pricingPackages = quotePackages.length > 0
    ? quotePackages.map((item: any) => ({
        name: item.name,
        price: item.price > 0 ? `${item.currency || 'LKR'} ${Number(item.price).toLocaleString()}` : 'Custom Quote',
        includes: [
          ...(item.description ? [item.description] : []),
          ...(item.durationHours > 0 ? [`Duration: ${item.durationHours} hrs`] : []),
          ...(services.slice(0, 2)),
        ],
      }))
    : [
        {
          name: 'Custom Package',
          price: 'Custom Quote',
          includes: ['Service details on request', 'Planning consultation', 'Event-day coordination'],
        },
      ];

  return {
    id: String(vendor?.id || vendor?._id || ''),
    name: vendor?.businessName || 'Wedding Vendor',
    category: vendor?.category || 'Vendor',
    rating: Number.isFinite(ratingValue) ? Number(ratingValue.toFixed(1)) : 0,
    reviewCount,
    location: vendor?.city || serviceArea.join(', '),
    priceRange: `LKR ${minPrice.toLocaleString()} — ${maxPrice.toLocaleString()}`,
    description: vendor?.description || 'Professional wedding services tailored for your celebration.',
    image: portfolioImages[0] || FALLBACK_VENDOR_IMAGE,
    logo: portfolioImages[0] || FALLBACK_VENDOR_IMAGE,
    verified: Boolean(vendor?.verified),
    popular: Boolean(vendor?.verified && reviewCount > 2),
    isFavorite: false,
    experience: vendor?.responseTime || `${Math.max(1, reviewCount)}+ Reviews`,
    teamSize: vendor?.capacity?.maxGuests ? `Up to ${vendor.capacity.maxGuests} guests` : `${Math.max(1, serviceArea.length)}+ Areas`,
    coverage: serviceArea,
    hours: vendor?.responseTime || 'Contact for latest availability',
    social: {
      facebook: '',
      instagram: '',
      website: '',
    },
    services: services.length > 0 ? services : ['Wedding Services'],
    portfolio: portfolioImages.map((url: string) => ({ type: 'image', url })),
    packages: quotePackages,
    packageSummary: (vendor?.packageSummary || []).filter(Boolean),
    pricingPackages,
    reviews: reviews.map((review: any, index: number) => ({
      id: review?._id || index + 1,
      user: typeof review?.reviewerId === 'string' ? review.reviewerId : `Client ${index + 1}`,
      rating: Number(review?.rating || 0),
      date: review?.createdAt ? new Date(review.createdAt).toLocaleDateString() : 'Recently',
      comment: review?.comment || 'Verified review from a RaashiLink customer.',
      response: null,
    })),
    contactPhone: vendor?.contactPhone || 'Available on request',
    contactEmail: vendor?.contactEmail || vendor?.owner?.email || 'Not listed',
    website: vendor?.website || '',
    city: vendor?.city || '',
    address: vendor?.address || '',
    serviceAreaDistricts: serviceArea,
    priceRange: minPrice > 0 || maxPrice > 0 ? `LKR ${minPrice.toLocaleString()} — LKR ${maxPrice.toLocaleString()}` : 'Custom Quote',
  };
}

export default function VendorDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [activeTab, setActiveTab] = useState(0);
  const [loading, setLoading] = useState(true);
  const [vendor, setVendor] = useState<any>(null);
  const [isQuoteModalOpen, setIsQuoteModalOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [planningAccessGranted, setPlanningAccessGranted] = useState(false);
  const [planningCheckLoading, setPlanningCheckLoading] = useState(true);
  const { user, token } = useSelector((state: RootState) => state.auth);

  useEffect(() => {
    const fetchVendorDetail = async () => {
      setLoading(true);
      try {
        const [detailResponse, reviewsResponse] = await Promise.all([
          vendorService.getVendorDetail(String(id)),
          vendorService.getReviews(String(id)),
        ]);
        setVendor(mapVendorDetail(detailResponse?.data, reviewsResponse));
      } catch (err) {
        console.error('Failed to load vendor detail', err);
        setVendor(null);
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchVendorDetail();
    } else {
      setLoading(false);
      setVendor(null);
    }
  }, [id]);

  useEffect(() => {
    const fetchPlanningAccess = async () => {
      if (!token) {
        setPlanningAccessGranted(false);
        setPlanningCheckLoading(false);
        return;
      }
      try {
        const projectResponse = await weddingService.getProject();
        const project = projectResponse?.data;
        const isCoupled = Array.isArray(project?.coupleUserIds) && project.coupleUserIds.length >= 2;
        setPlanningAccessGranted(isCoupled);
      } catch {
        setPlanningAccessGranted(false);
      } finally {
        setPlanningCheckLoading(false);
      }
    };

    fetchPlanningAccess();
  }, [token]);

  useEffect(() => {
    if (planningCheckLoading || planningAccessGranted) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [planningCheckLoading, planningAccessGranted]);

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

  if (loading) return <LoadingState />;
  if (!vendor) return <ErrorState />;

  return (
    <Box sx={{ bgcolor: COLORS.cream, minHeight: '100vh', pb: 10, position: 'relative' }}>
      {/* Hero Header */}
      <Box sx={{ position: 'relative', height: { xs: 300, md: 500 }, overflow: 'hidden' }}>
        <Box 
          component="img" 
          src={vendor.image} 
          sx={{ width: '100%', height: '100%', objectFit: 'cover' }}
          referrerPolicy="no-referrer"
        />
        <Box sx={{ 
          position: 'absolute', 
          inset: 0, 
          background: 'linear-gradient(to bottom, rgba(0,0,0,0.2), rgba(0,0,0,0.7))' 
        }} />
        
        <Container maxWidth="xl" sx={{ height: '100%', position: 'relative', zIndex: 2 }}>
          <Stack direction="row" spacing={2} sx={{ position: 'absolute', top: 100, left: 16 }}>
            <IconButton 
              onClick={() => navigate(-1)} 
              sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: 'white', '&:hover': { bgcolor: 'rgba(255,255,255,0.3)' } }}
            >
              <ChevronLeft size={24} />
            </IconButton>
          </Stack>

          <Box sx={{ position: 'absolute', bottom: 40, left: 16, right: 16 }}>
            <Stack direction={{ xs: 'column', md: 'row' }} spacing={3} alignItems={{ xs: 'flex-start', md: 'center' }}>
              <Avatar 
                src={vendor.logo} 
                sx={{ width: 100, height: 100, border: '4px solid white', boxShadow: '0 4px 20px rgba(0,0,0,0.2)' }} 
              />
              <Box sx={{ color: 'white', flexGrow: 1 }}>
                <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
                  <Typography variant="h3" sx={{ fontWeight: 800, fontFamily: 'Playfair Display' }}>
                    {vendor.name}
                  </Typography>
                  {vendor.verified && <CheckCircle2 size={24} color={COLORS.secondary} />}
                </Stack>
                <Stack direction="row" spacing={3} flexWrap="wrap">
                  <Stack direction="row" spacing={1} alignItems="center">
                    <MapPin size={18} />
                    <Typography variant="body1">{vendor.location}</Typography>
                  </Stack>
                  <Stack direction="row" spacing={1} alignItems="center">
                    <Star size={18} fill={COLORS.secondary} color={COLORS.secondary} />
                    <Typography variant="body1" sx={{ fontWeight: 700 }}>{vendor.rating} ({vendor.reviewCount} reviews)</Typography>
                  </Stack>
                </Stack>
              </Box>
              <Stack direction="row" spacing={2}>
                <Button 
                  variant="contained" 
                  onClick={() => setIsQuoteModalOpen(true)}
                  sx={{ bgcolor: COLORS.secondary, color: COLORS.primary, borderRadius: 3, px: 4, fontWeight: 700 }}
                >
                  Request Quote
                </Button>
                <IconButton sx={{ bgcolor: 'white', color: COLORS.error, '&:hover': { bgcolor: 'white' } }}>
                  <Heart size={24} fill={vendor.isFavorite ? COLORS.error : 'none'} />
                </IconButton>
              </Stack>
            </Stack>
          </Box>
        </Container>
      </Box>

      {/* Tabs Section */}
      <Box sx={{ bgcolor: 'white', borderBottom: '1px solid', borderColor: 'divider', position: 'sticky', top: 0, zIndex: 100 }}>
        <Container maxWidth="xl">
          <Tabs 
            value={activeTab} 
            onChange={(_, v) => setActiveTab(v)}
            sx={{
              '& .MuiTabs-indicator': { bgcolor: COLORS.secondary, height: 3 },
              '& .MuiTab-root': { 
                textTransform: 'none', 
                fontWeight: 700, 
                fontSize: '1rem',
                color: COLORS.textSecondary,
                minHeight: 64,
                px: 4,
                '&.Mui-selected': { color: COLORS.primary }
              }
            }}
          >
            <Tab label="Portfolio" />
            <Tab label="About" />
            <Tab label="Reviews" />
            <Tab label="Pricing" />
          </Tabs>
        </Container>
      </Box>

      <Container maxWidth="xl" sx={{ mt: 6 }}>
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
          >
            {activeTab === 0 && <PortfolioTab portfolio={vendor.portfolio} onImageClick={setSelectedImage} />}
            {activeTab === 1 && <AboutTab vendor={vendor} />}
            {activeTab === 2 && <ReviewsTab reviews={vendor.reviews} rating={vendor.rating} count={vendor.reviewCount} />}
            {activeTab === 3 && <PricingTab packages={vendor.pricingPackages} onRequestQuote={() => setIsQuoteModalOpen(true)} />}
          </motion.div>
        </AnimatePresence>
      </Container>

      {/* Lightbox Modal */}
      <Modal
        open={!!selectedImage}
        onClose={() => setSelectedImage(null)}
        closeAfterTransition
        BackdropComponent={Backdrop}
        BackdropProps={{ timeout: 500, sx: { bgcolor: 'rgba(0,0,0,0.9)' } }}
      >
        <Fade in={!!selectedImage}>
          <Box sx={{ 
            position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
            maxWidth: '90vw', maxHeight: '90vh', outline: 'none'
          }}>
            <IconButton 
              onClick={() => setSelectedImage(null)} 
              sx={{ position: 'absolute', top: -40, right: -40, color: 'white' }}
            >
              <X size={32} />
            </IconButton>
            <Box 
              component="img" 
              src={selectedImage || ''} 
              sx={{ width: '100%', height: '100%', objectFit: 'contain', borderRadius: 4 }}
              referrerPolicy="no-referrer"
            />
          </Box>
        </Fade>
      </Modal>

      <QuoteRequestModal 
        open={isQuoteModalOpen} 
        onClose={() => setIsQuoteModalOpen(false)} 
        vendor={vendor}
        weddingDate={user?.weddingProject?.weddingDate ? new Date(user.weddingProject.weddingDate).toISOString().split('T')[0] : ''}
        userPhone={user?.phone || ''}
        userEmail={user?.email || ''}
        userName={user?.name || user?.firstName || ''}
        remainingBudget={Number((user as any)?.weddingProject?.totalBudget || 0)}
      />

      {!planningCheckLoading && !planningAccessGranted && (
        <Box
          sx={{
            position: 'fixed',
            top: '64px',
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 1099,
            backdropFilter: 'blur(8px)',
            WebkitBackdropFilter: 'blur(8px)',
            bgcolor: 'rgba(18, 12, 6, 0.25)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            p: 3,
          }}
        >
          <Card sx={{ maxWidth: 560, borderRadius: 5, border: '1px solid #E6C87E', boxShadow: '0 16px 40px rgba(0,0,0,0.18)' }}>
            <CardContent sx={{ p: 4, textAlign: 'center' }}>
              <Typography variant="h5" sx={{ fontWeight: 900, color: COLORS.primary, mb: 1 }}>
                Vendor details are locked
              </Typography>
              <Typography variant="body1" sx={{ color: COLORS.textSecondary }}>
                This page unlocks after both partners accept wedding planning together.
              </Typography>
              <Button
                variant="contained"
                onClick={() => navigate('/messages')}
                sx={{ mt: 3, bgcolor: COLORS.primary, borderRadius: 3, fontWeight: 700, textTransform: 'none' }}
              >
                Go to Messages to Send/Accept Invite
              </Button>
            </CardContent>
          </Card>
        </Box>
      )}
    </Box>
  );
}

// --- Tab Components ---

function PortfolioTab({ portfolio, onImageClick }: any) {
  if (!Array.isArray(portfolio) || portfolio.length === 0) {
    return (
      <Box>
        <Typography variant="h5" sx={{ fontWeight: 800, fontFamily: 'Playfair Display', mb: 4, color: COLORS.primary }}>
          Portfolio Gallery
        </Typography>
        <Alert severity="info" sx={{ borderRadius: 3 }}>
          This vendor has not uploaded portfolio images yet.
        </Alert>
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h5" sx={{ fontWeight: 800, fontFamily: 'Playfair Display', mb: 4, color: COLORS.primary }}>
        Portfolio Gallery
      </Typography>
      <ImageList variant="masonry" cols={3} gap={16}>
        {portfolio.map((item: any, i: number) => (
          <ImageListItem key={i} sx={{ cursor: 'pointer', overflow: 'hidden', borderRadius: 4 }}>
            <Box 
              component="img" 
              src={item.url} 
              onClick={() => onImageClick(item.url)}
              sx={{ 
                width: '100%', 
                transition: 'transform 0.3s ease',
                '&:hover': { transform: 'scale(1.05)' }
              }}
              referrerPolicy="no-referrer"
            />
          </ImageListItem>
        ))}
      </ImageList>
    </Box>
  );
}

function AboutTab({ vendor }: any) {
  return (
    <Grid container spacing={6}>
      <Grid size={{ xs: 12, md: 8 }}>
        {/* Description */}
        <Card sx={{ borderRadius: 6, p: 4, mb: 4 }}>
          <Typography variant="h5" sx={{ fontWeight: 800, fontFamily: 'Playfair Display', mb: 3, color: COLORS.primary }}>
            About the Business
          </Typography>
          <Typography variant="body1" sx={{ color: 'text.secondary', lineHeight: 1.8, mb: 4 }}>
            {vendor.description}
          </Typography>

          <Typography variant="h6" sx={{ fontWeight: 800, mb: 2 }}>Services Offered</Typography>
          <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap sx={{ mb: 4 }}>
            {vendor.services.map((service: string) => (
              <Chip key={service} label={service} sx={{ bgcolor: `${COLORS.accent}10`, color: COLORS.accent, fontWeight: 700, borderRadius: 2 }} />
            ))}
          </Stack>

          <Divider sx={{ my: 4 }} />

          {/* Business detail stats row */}
          <Grid container spacing={4}>
            <Grid size={{ xs: 6, sm: 3 }}>
              <Stack spacing={1}>
                <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 700 }}>CATEGORY</Typography>
                <Stack direction="row" spacing={1} alignItems="center">
                  <Briefcase size={18} color={COLORS.secondary} />
                  <Typography variant="body2" sx={{ fontWeight: 800 }}>{vendor.category}</Typography>
                </Stack>
              </Stack>
            </Grid>
            <Grid size={{ xs: 6, sm: 3 }}>
              <Stack spacing={1}>
                <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 700 }}>CITY</Typography>
                <Stack direction="row" spacing={1} alignItems="center">
                  <MapPin size={18} color={COLORS.secondary} />
                  <Typography variant="body2" sx={{ fontWeight: 800 }}>{vendor.city || vendor.location}</Typography>
                </Stack>
              </Stack>
            </Grid>
            <Grid size={{ xs: 6, sm: 3 }}>
              <Stack spacing={1}>
                <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 700 }}>COVERAGE</Typography>
                <Stack direction="row" spacing={1} alignItems="center">
                  <MapPin size={18} color={COLORS.secondary} />
                  <Typography variant="body2" sx={{ fontWeight: 800 }}>{vendor.serviceAreaDistricts.length} Districts</Typography>
                </Stack>
              </Stack>
            </Grid>
          </Grid>
        </Card>

        {/* Location & Address */}
        {(vendor.address || vendor.city) && (
          <Card sx={{ borderRadius: 6, p: 4, mb: 4 }}>
            <Typography variant="h6" sx={{ fontWeight: 800, mb: 3, display: 'flex', alignItems: 'center', gap: 1 }}>
              <MapPin size={20} color={COLORS.primary} /> Location
            </Typography>
            <Stack spacing={2}>
              {vendor.city && (
                <Stack direction="row" spacing={2} alignItems="center">
                  <Typography variant="body2" sx={{ color: 'text.secondary', minWidth: 60 }}>City:</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 700 }}>{vendor.city}</Typography>
                </Stack>
              )}
              {vendor.address && (
                <Stack direction="row" spacing={2} alignItems="flex-start">
                  <Typography variant="body2" sx={{ color: 'text.secondary', minWidth: 60 }}>Address:</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 700 }}>{vendor.address}</Typography>
                </Stack>
              )}
            </Stack>
          </Card>
        )}

        {/* Service Areas */}
        {vendor.serviceAreaDistricts.length > 0 && (
          <Card sx={{ borderRadius: 6, p: 4 }}>
            <Typography variant="h6" sx={{ fontWeight: 800, mb: 3 }}>Service Areas</Typography>
            <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
              {vendor.serviceAreaDistricts.map((district: string) => (
                <Chip
                  key={district}
                  label={district}
                  icon={<MapPin size={14} />}
                  sx={{ bgcolor: `${COLORS.primary}10`, color: COLORS.primary, fontWeight: 600, borderRadius: 2 }}
                />
              ))}
            </Stack>
          </Card>
        )}
      </Grid>

      <Grid size={{ xs: 12, md: 4 }}>
        <Card sx={{ borderRadius: 6, p: 4, position: 'sticky', top: 100 }}>
          <Typography variant="h6" sx={{ fontWeight: 800, mb: 3 }}>Contact Information</Typography>
          <Stack spacing={3}>
            {vendor.contactPhone && vendor.contactPhone !== 'Available on request' && (
              <Stack direction="row" spacing={2} alignItems="center">
                <Box sx={{ p: 1, bgcolor: `${COLORS.primary}10`, color: COLORS.primary, borderRadius: 2 }}>
                  <Phone size={20} />
                </Box>
                <Box>
                  <Typography variant="caption" sx={{ color: 'text.secondary' }}>Phone Number</Typography>
                  <Typography
                    component="a"
                    href={`tel:${vendor.contactPhone}`}
                    variant="body2"
                    sx={{ fontWeight: 700, color: 'inherit', textDecoration: 'none', display: 'block', '&:hover': { color: COLORS.primary } }}
                  >
                    {vendor.contactPhone}
                  </Typography>
                </Box>
              </Stack>
            )}
            {vendor.contactEmail && vendor.contactEmail !== 'Not listed' && (
              <Stack direction="row" spacing={2} alignItems="center">
                <Box sx={{ p: 1, bgcolor: `${COLORS.primary}10`, color: COLORS.primary, borderRadius: 2 }}>
                  <Mail size={20} />
                </Box>
                <Box>
                  <Typography variant="caption" sx={{ color: 'text.secondary' }}>Email Address</Typography>
                  <Typography
                    component="a"
                    href={`mailto:${vendor.contactEmail}`}
                    variant="body2"
                    sx={{ fontWeight: 700, color: 'inherit', textDecoration: 'none', display: 'block', '&:hover': { color: COLORS.primary } }}
                  >
                    {vendor.contactEmail}
                  </Typography>
                </Box>
              </Stack>
            )}
            {vendor.website && (
              <Stack direction="row" spacing={2} alignItems="center">
                <Box sx={{ p: 1, bgcolor: `${COLORS.primary}10`, color: COLORS.primary, borderRadius: 2 }}>
                  <Globe size={20} />
                </Box>
                <Box>
                  <Typography variant="caption" sx={{ color: 'text.secondary' }}>Website</Typography>
                  <Typography
                    component="a"
                    href={vendor.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    variant="body2"
                    sx={{ fontWeight: 700, color: COLORS.primary, textDecoration: 'none', display: 'block', '&:hover': { textDecoration: 'underline' } }}
                  >
                    {vendor.website.replace(/^https?:\/\//i, '')}
                  </Typography>
                </Box>
              </Stack>
            )}
          </Stack>
        </Card>
      </Grid>
    </Grid>
  );
}

function ReviewsTab({ reviews, rating, count }: any) {
  return (
    <Grid container spacing={6}>
      <Grid size={{ xs: 12, md: 4 }}>
        <Card sx={{ borderRadius: 6, p: 4, position: 'sticky', top: 100 }}>
          <Typography variant="h6" sx={{ fontWeight: 800, mb: 1 }}>Overall Rating</Typography>
          <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 4 }}>
            <Typography variant="h2" sx={{ fontWeight: 800, color: COLORS.primary }}>{rating}</Typography>
            <Box>
              <Rating value={rating} precision={0.1} readOnly sx={{ color: COLORS.secondary }} />
              <Typography variant="body2" sx={{ color: 'text.secondary' }}>Based on {count} reviews</Typography>
            </Box>
          </Stack>

          <Stack spacing={1.5}>
            {[5, 4, 3, 2, 1].map((star) => (
              <Stack key={star} direction="row" spacing={2} alignItems="center">
                <Typography variant="caption" sx={{ minWidth: 20, fontWeight: 700 }}>{star}★</Typography>
                <LinearProgress 
                  variant="determinate" 
                  value={star === 5 ? 80 : star === 4 ? 15 : 5} 
                  sx={{ flexGrow: 1, height: 8, borderRadius: 4, bgcolor: 'rgba(0,0,0,0.05)', '& .MuiLinearProgress-bar': { bgcolor: COLORS.secondary } }} 
                />
                <Typography variant="caption" sx={{ minWidth: 30, color: 'text.secondary' }}>{star === 5 ? '80%' : star === 4 ? '15%' : '5%'}</Typography>
              </Stack>
            ))}
          </Stack>

          <Button 
            fullWidth 
            variant="outlined" 
            sx={{ mt: 4, borderRadius: 3, borderColor: COLORS.primary, color: COLORS.primary, fontWeight: 700 }}
          >
            Write a Review
          </Button>
        </Card>
      </Grid>

      <Grid size={{ xs: 12, md: 8 }}>
        <Stack spacing={3}>
          {reviews.map((review: any) => (
            <Card key={review.id} sx={{ borderRadius: 6, p: 4 }}>
              <Stack direction="row" justifyContent="space-between" alignItems="flex-start" sx={{ mb: 2 }}>
                <Stack direction="row" spacing={2} alignItems="center">
                  <Avatar sx={{ bgcolor: COLORS.primary }}>{review.user[0]}</Avatar>
                  <Box>
                    <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>{review.user}</Typography>
                    <Typography variant="caption" sx={{ color: 'text.secondary' }}>{review.date}</Typography>
                  </Box>
                </Stack>
                <Rating value={review.rating} size="small" readOnly sx={{ color: COLORS.secondary }} />
              </Stack>
              <Typography variant="body2" sx={{ color: 'text.secondary', lineHeight: 1.6, mb: 3 }}>
                "{review.comment}"
              </Typography>
              {review.response && (
                <Box sx={{ p: 3, bgcolor: `${COLORS.cream}`, borderRadius: 4, borderLeft: `4px solid ${COLORS.secondary}` }}>
                  <Typography variant="caption" sx={{ fontWeight: 800, color: COLORS.secondary, display: 'block', mb: 1 }}>VENDOR RESPONSE</Typography>
                  <Typography variant="body2" sx={{ fontStyle: 'italic' }}>{review.response}</Typography>
                </Box>
              )}
            </Card>
          ))}
        </Stack>
      </Grid>
    </Grid>
  );
}

function PricingTab({ packages, onRequestQuote }: any) {
  return (
    <Box>
      <Typography variant="h5" sx={{ fontWeight: 800, fontFamily: 'Playfair Display', mb: 4, color: COLORS.primary }}>
        Available Packages
      </Typography>
      <Grid container spacing={4}>
        {packages.map((pkg: any, i: number) => (
          <Grid size={{ xs: 12, md: 4 }} key={i}>
            <Card sx={{ 
              borderRadius: 6, 
              p: 4, 
              height: '100%', 
              display: 'flex', 
              flexDirection: 'column',
              border: i === 1 ? `2px solid ${COLORS.secondary}` : 'none',
              transform: i === 1 ? 'scale(1.05)' : 'none',
              zIndex: i === 1 ? 2 : 1,
              position: 'relative'
            }}>
              {i === 1 && (
                <Box sx={{ position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%) translateY(-50%)', bgcolor: COLORS.secondary, color: 'white', px: 2, py: 0.5, borderRadius: 2, fontSize: '0.75rem', fontWeight: 800 }}>
                  MOST POPULAR
                </Box>
              )}
              <Typography variant="h6" sx={{ fontWeight: 800, mb: 1 }}>{pkg.name}</Typography>
              <Typography variant="h4" sx={{ fontWeight: 800, color: COLORS.primary, mb: 3 }}>{pkg.price}</Typography>
              
              <Stack spacing={2} sx={{ mb: 4, flexGrow: 1 }}>
                {pkg.includes.map((item: string, j: number) => (
                  <Stack key={j} direction="row" spacing={1} alignItems="center">
                    <CheckCircle2 size={16} color={COLORS.success} />
                    <Typography variant="body2">{item}</Typography>
                  </Stack>
                ))}
              </Stack>

              <Button 
                fullWidth 
                variant={i === 1 ? "contained" : "outlined"} 
                onClick={onRequestQuote}
                sx={{ 
                  borderRadius: 3, 
                  bgcolor: i === 1 ? COLORS.primary : 'transparent',
                  borderColor: COLORS.primary,
                  color: i === 1 ? 'white' : COLORS.primary,
                  fontWeight: 700
                }}
              >
                Select Package
              </Button>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Card sx={{ mt: 8, p: 4, borderRadius: 6, bgcolor: COLORS.primary, color: 'white' }}>
        <Stack direction={{ xs: 'column', md: 'row' }} spacing={4} alignItems="center" justifyContent="space-between">
          <Box>
            <Typography variant="h5" sx={{ fontWeight: 800, fontFamily: 'Playfair Display', mb: 1 }}>Need a Custom Quote?</Typography>
            <Typography variant="body1" sx={{ opacity: 0.8 }}>Tell us about your specific requirements and we'll create a bespoke package just for you.</Typography>
          </Box>
          <Button 
            variant="contained" 
            onClick={onRequestQuote}
            sx={{ bgcolor: COLORS.secondary, color: COLORS.primary, px: 6, py: 1.5, borderRadius: 3, fontWeight: 800, '&:hover': { bgcolor: '#B89740' } }}
          >
            Request Custom Quote
          </Button>
        </Stack>
      </Card>
    </Box>
  );
}

// --- Loading & Error States ---

function LoadingState() {
  return (
    <Box sx={{ pt: 12 }}>
      <Skeleton variant="rectangular" height={500} />
      <Container maxWidth="xl" sx={{ mt: 6 }}>
        <Grid container spacing={6}>
          <Grid size={{ xs: 12, md: 8 }}>
            <Skeleton variant="rectangular" height={400} sx={{ borderRadius: 6, mb: 4 }} />
            <Skeleton variant="rectangular" height={200} sx={{ borderRadius: 6 }} />
          </Grid>
          <Grid size={{ xs: 12, md: 4 }}>
            <Skeleton variant="rectangular" height={400} sx={{ borderRadius: 6 }} />
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
}

function ErrorState() {
  return (
    <Container sx={{ py: 20, textAlign: 'center' }}>
      <Typography variant="h4" sx={{ mb: 2 }}>Oops! Vendor not found.</Typography>
      <Button component={Link} to="/vendors" variant="contained" sx={{ bgcolor: COLORS.primary }}>
        Back to Marketplace
      </Button>
    </Container>
  );
}
