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
  Quote, Info, DollarSign, Package
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { RootState } from '@/app/store/store';

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

const MOCK_VENDOR_DETAIL = {
  id: '1',
  name: 'Galle Face Hotel',
  category: 'Venue',
  rating: 4.8,
  reviewCount: 124,
  location: 'Colombo 03, Western Province',
  priceRange: 'LKR 250,000 — 800,000',
  description: 'A historic hotel offering grand ballrooms and stunning ocean views for a truly majestic Sri Lankan wedding experience. Established in 1864, the Galle Face Hotel is one of the oldest hotels east of Suez. It is a colonial-style hotel located at 2, Galle Road, Colombo 03, Sri Lanka. The hotel is a member of the Galle Face Hotel Group and is a historic landmark in the city of Colombo.',
  image: 'https://picsum.photos/seed/galleface/1920/1080',
  logo: 'https://picsum.photos/seed/gflogo/200/200',
  verified: true,
  popular: true,
  isFavorite: true,
  experience: '150+ Years',
  teamSize: '500+ Staff',
  coverage: ['Colombo', 'Negombo', 'Kalutara'],
  hours: 'Open 24/7',
  social: {
    facebook: 'https://facebook.com/gallefacehotel',
    instagram: 'https://instagram.com/gallefacehotel',
    website: 'https://gallefacehotel.com'
  },
  services: ['Wedding Ballrooms', 'Outdoor Lawn', 'Catering', 'Accommodation', 'Event Planning', 'Valet Parking'],
  portfolio: [
    { type: 'image', url: 'https://picsum.photos/seed/gf_p1/800/800' },
    { type: 'image', url: 'https://picsum.photos/seed/gf_p2/800/800' },
    { type: 'image', url: 'https://picsum.photos/seed/gf_p3/800/800' },
    { type: 'image', url: 'https://picsum.photos/seed/gf_p4/800/800' },
    { type: 'image', url: 'https://picsum.photos/seed/gf_p5/800/800' },
    { type: 'image', url: 'https://picsum.photos/seed/gf_p6/800/800' },
  ],
  packages: [
    {
      name: 'Silver Package',
      price: 'LKR 250,000',
      includes: ['Ballroom for 4 hours', 'Standard Buffet Menu', 'Basic Decoration', 'Welcome Drinks']
    },
    {
      name: 'Gold Package',
      price: 'LKR 450,000',
      includes: ['Ballroom for 6 hours', 'Premium Buffet Menu', 'Enhanced Decoration', 'Bridal Suite', 'Cake Structure']
    },
    {
      name: 'Platinum Package',
      price: 'LKR 800,000',
      includes: ['Grand Ballroom for 8 hours', 'Luxury Buffet Menu', 'Full Floral Decoration', 'Presidential Suite', 'Live Band', 'Photography']
    }
  ],
  reviews: [
    {
      id: 1,
      user: 'Shanuka J.',
      rating: 5,
      date: '2 months ago',
      comment: 'Absolutely stunning venue! The staff was incredibly helpful and the food was top-notch. Our wedding was a dream come true.',
      response: 'Thank you Shanuka! It was a pleasure hosting your special day.'
    },
    {
      id: 2,
      user: 'Kavindi P.',
      rating: 4,
      date: '5 months ago',
      comment: 'Beautiful location, but the coordination could have been slightly better. Overall a great experience.',
      response: 'We appreciate your feedback Kavindi. We are working on improving our coordination services.'
    }
  ]
};

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

  useEffect(() => {
    const fetchVendorDetail = async () => {
      setLoading(true);
      try {
        // Simulating API call to GET /api/v1/vendors/:id
        await new Promise(resolve => setTimeout(resolve, 1500));
        setVendor(MOCK_VENDOR_DETAIL);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchVendorDetail();
  }, [id]);

  if (loading) return <LoadingState />;
  if (!vendor) return <ErrorState />;

  return (
    <Box sx={{ bgcolor: COLORS.cream, minHeight: '100vh', pb: 10 }}>
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
            {activeTab === 3 && <PricingTab packages={vendor.packages} onRequestQuote={() => setIsQuoteModalOpen(true)} />}
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
      />
    </Box>
  );
}

// --- Tab Components ---

function PortfolioTab({ portfolio, onImageClick }: any) {
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

          <Grid container spacing={4}>
            <Grid size={{ xs: 6, sm: 3 }}>
              <Stack spacing={1}>
                <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 700 }}>EXPERIENCE</Typography>
                <Stack direction="row" spacing={1} alignItems="center">
                  <Briefcase size={18} color={COLORS.secondary} />
                  <Typography variant="body2" sx={{ fontWeight: 800 }}>{vendor.experience}</Typography>
                </Stack>
              </Stack>
            </Grid>
            <Grid size={{ xs: 6, sm: 3 }}>
              <Stack spacing={1}>
                <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 700 }}>TEAM SIZE</Typography>
                <Stack direction="row" spacing={1} alignItems="center">
                  <Users size={18} color={COLORS.secondary} />
                  <Typography variant="body2" sx={{ fontWeight: 800 }}>{vendor.teamSize}</Typography>
                </Stack>
              </Stack>
            </Grid>
            <Grid size={{ xs: 6, sm: 3 }}>
              <Stack spacing={1}>
                <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 700 }}>HOURS</Typography>
                <Stack direction="row" spacing={1} alignItems="center">
                  <Clock size={18} color={COLORS.secondary} />
                  <Typography variant="body2" sx={{ fontWeight: 800 }}>{vendor.hours}</Typography>
                </Stack>
              </Stack>
            </Grid>
            <Grid size={{ xs: 6, sm: 3 }}>
              <Stack spacing={1}>
                <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 700 }}>COVERAGE</Typography>
                <Stack direction="row" spacing={1} alignItems="center">
                  <MapPin size={18} color={COLORS.secondary} />
                  <Typography variant="body2" sx={{ fontWeight: 800 }}>{vendor.coverage.length} Districts</Typography>
                </Stack>
              </Stack>
            </Grid>
          </Grid>
        </Card>
      </Grid>

      <Grid size={{ xs: 12, md: 4 }}>
        <Card sx={{ borderRadius: 6, p: 4, position: 'sticky', top: 100 }}>
          <Typography variant="h6" sx={{ fontWeight: 800, mb: 3 }}>Contact Information</Typography>
          <Stack spacing={3}>
            <Stack direction="row" spacing={2} alignItems="center">
              <Box sx={{ p: 1, bgcolor: `${COLORS.primary}10`, color: COLORS.primary, borderRadius: 2 }}>
                <Phone size={20} />
              </Box>
              <Box>
                <Typography variant="caption" sx={{ color: 'text.secondary' }}>Phone Number</Typography>
                <Typography variant="body2" sx={{ fontWeight: 700 }}>+94 11 234 5678</Typography>
              </Box>
            </Stack>
            <Stack direction="row" spacing={2} alignItems="center">
              <Box sx={{ p: 1, bgcolor: `${COLORS.primary}10`, color: COLORS.primary, borderRadius: 2 }}>
                <Mail size={20} />
              </Box>
              <Box>
                <Typography variant="caption" sx={{ color: 'text.secondary' }}>Email Address</Typography>
                <Typography variant="body2" sx={{ fontWeight: 700 }}>events@gallefacehotel.com</Typography>
              </Box>
            </Stack>
            <Stack direction="row" spacing={2} alignItems="center">
              <Box sx={{ p: 1, bgcolor: `${COLORS.primary}10`, color: COLORS.primary, borderRadius: 2 }}>
                <Globe size={20} />
              </Box>
              <Box>
                <Typography variant="caption" sx={{ color: 'text.secondary' }}>Website</Typography>
                <Typography variant="body2" sx={{ fontWeight: 700 }}>www.gallefacehotel.com</Typography>
              </Box>
            </Stack>

            <Divider />

            <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>Social Media</Typography>
            <Stack direction="row" spacing={2}>
              <IconButton sx={{ bgcolor: `${COLORS.accent}10`, color: COLORS.accent }}><Facebook size={20} /></IconButton>
              <IconButton sx={{ bgcolor: `${COLORS.accent}10`, color: COLORS.accent }}><Instagram size={20} /></IconButton>
            </Stack>
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

const X = ({ size, color }: any) => (
  <Box sx={{ display: 'flex', justifyContent: 'center' }}>
    <CheckCircle2 size={size} color={color} style={{ transform: 'rotate(45deg)' }} />
  </Box>
);


