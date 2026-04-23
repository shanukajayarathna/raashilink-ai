import React, { useState, useEffect, useRef } from 'react';
import { 
  Box, 
  Container, 
  Typography, 
  Button, 
  Grid, 
  Card, 
  CardContent, 
  Avatar, 
  IconButton, 
  Stack, 
  Divider,
  useTheme,
  useMediaQuery,
  Tab,
  Tabs
} from '@mui/material';
import { 
  Favorite, 
  Star, 
  CalendarMonth, 
  Search, 
  ArrowForward, 
  KeyboardArrowLeft, 
  KeyboardArrowRight,
  AccountCircle,
  AutoGraph,
  Calculate,
  CheckCircle,
  Facebook,
  Instagram,
  Twitter,
  LinkedIn
} from '@mui/icons-material';
import { motion, AnimatePresence, useScroll, useTransform } from 'motion/react';
import { 
  PieChart, 
  Pie, 
  Cell, 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip 
} from 'recharts';
import { Link } from 'react-router-dom';

// --- Theme Constants ---
const COLORS = {
  primary: '#8B1A2E',
  secondary: '#C9A84C',
  accent: '#1A6B72',
  cream: '#FAF7F2',
  white: '#FFFFFF',
  textPrimary: '#1C1C1C',
  textSecondary: '#555555',
};

// --- Framer Motion Components ---
const MotionBox = motion(Box);
const MotionTypography = motion(Typography);
const MotionGrid = motion(Grid);
const MotionCard = motion(Card);

// --- Sub-components ---

const LandingHeader = () => {
  const [isScrolled, setIsScrolled] = useState(typeof window !== 'undefined' ? window.scrollY > 50 : false);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <Box
      sx={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 1000,
        transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
        py: isScrolled ? 1.5 : 3,
        bgcolor: isScrolled ? 'rgba(255, 255, 255, 0.95)' : 'transparent',
        backdropFilter: isScrolled ? 'blur(12px)' : 'none',
        borderBottom: isScrolled ? `1px solid ${COLORS.primary}15` : 'none',
        boxShadow: isScrolled ? '0 4px 20px rgba(0,0,0,0.05)' : 'none',
      }}
    >
      <Container sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Stack direction="row" spacing={2} alignItems="center" sx={{ flexGrow: 1 }}>
          <Box sx={{ 
            width: 42, 
            height: 42, 
            bgcolor: COLORS.primary, 
            borderRadius: '12px', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            boxShadow: isScrolled ? 'none' : '0 8px 16px rgba(0,0,0,0.2)',
            transform: 'rotate(-5deg)'
          }}>
            <Star sx={{ color: COLORS.secondary, fontSize: 24 }} />
          </Box>
          <Typography variant="h5" sx={{ 
            color: isScrolled ? COLORS.primary : 'white', 
            fontWeight: 900, 
            fontFamily: 'Playfair Display',
            letterSpacing: '-0.5px',
            textShadow: isScrolled ? 'none' : '0 2px 15px rgba(0,0,0,0.4)'
          }}>
            RaashiLink.AI
          </Typography>
        </Stack>
        <Stack direction="row" spacing={5} alignItems="center" sx={{ display: { xs: 'none', md: 'flex' } }}>
          {['Features', 'How it Works', 'Testimonials'].map((item) => (
            <Typography 
              key={item} 
              variant="body2" 
              sx={{ 
                color: isScrolled ? COLORS.textPrimary : 'white', 
                fontWeight: 600, 
                cursor: 'pointer',
                position: 'relative',
                textShadow: isScrolled ? 'none' : '0 1px 8px rgba(0,0,0,0.3)',
                '&:after': {
                  content: '""',
                  position: 'absolute',
                  bottom: -4,
                  left: 0,
                  width: 0,
                  height: 2,
                  bgcolor: COLORS.secondary,
                  transition: 'width 0.3s ease'
                },
                '&:hover': { 
                  color: COLORS.secondary,
                  '&:after': { width: '100%' }
                }
              }}
            >
              {item}
            </Typography>
          ))}
          <Button 
            component={Link} 
            to="/login" 
            variant="contained" 
            sx={{ 
              bgcolor: COLORS.secondary, 
              color: COLORS.primary, 
              fontWeight: 800,
              borderRadius: '12px',
              px: 4,
              py: 1,
              boxShadow: isScrolled ? 'none' : '0 10px 20px rgba(201,168,76,0.3)',
              '&:hover': {
                bgcolor: COLORS.white,
                color: COLORS.primary,
                transform: 'translateY(-2px)'
              },
              transition: 'all 0.3s ease'
            }}
          >
            Login
          </Button>
        </Stack>
      </Container>
    </Box>
  );
};

const SectionTitle = ({ title, subtitle }: { title: string; subtitle?: string }) => (
  <Box sx={{ textAlign: 'center', mb: 8 }}>
    <MotionTypography
      variant="h2"
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      sx={{ 
        fontFamily: 'Playfair Display', 
        fontWeight: 700, 
        color: COLORS.primary,
        mb: 2,
        fontSize: { xs: '2.5rem', md: '3.5rem' }
      }}
    >
      {title}
    </MotionTypography>
    {subtitle && (
      <MotionTypography
        variant="body1"
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ delay: 0.2 }}
        sx={{ color: COLORS.textSecondary, maxWidth: '600px', mx: 'auto' }}
      >
        {subtitle}
      </MotionTypography>
    )}
  </Box>
);

const FloatingProfileCard = ({ name, age, match, delay, top, left, right, rotate }: any) => (
  <MotionBox
    initial={{ opacity: 0, scale: 0.8 }}
    animate={{ 
      opacity: 1, 
      scale: 1,
      y: [0, -15, 0],
      rotate: [rotate, rotate + 2, rotate]
    }}
    transition={{ 
      opacity: { duration: 1, delay },
      scale: { duration: 1, delay },
      y: { duration: 4, repeat: Infinity, ease: "easeInOut" },
      rotate: { duration: 5, repeat: Infinity, ease: "easeInOut" }
    }}
    sx={{
      position: 'absolute',
      top,
      left,
      right,
      width: 200,
      p: 2,
      bgcolor: 'white',
      borderRadius: '20px',
      boxShadow: '0 25px 60px rgba(0,0,0,0.2)',
      border: `1px solid ${COLORS.cream}`,
      zIndex: 20,
      display: { xs: 'none', lg: 'block' }
    }}
  >
    <Stack direction="row" spacing={2} alignItems="center">
      <Avatar sx={{ bgcolor: COLORS.secondary, fontWeight: 700 }}>{name[0]}</Avatar>
      <Box>
        <Typography variant="subtitle2" sx={{ fontWeight: 800, color: COLORS.textPrimary }}>{name}, {age}</Typography>
        <Typography variant="caption" sx={{ color: COLORS.accent, fontWeight: 600 }}>{match}% Match</Typography>
      </Box>
    </Stack>
  </MotionBox>
);

const StepCard = ({ number, icon, title, description, delay }: any) => (
  <Grid
    size={{ xs: 12, sm: 6, md: 3 }}
  >
    <MotionBox
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay, duration: 0.6 }}
      sx={{ position: 'relative', textAlign: 'center', p: 3 }}
    >
      <Typography
        variant="h1"
        sx={{
          position: 'absolute',
          top: -20,
          left: '50%',
          transform: 'translateX(-50%)',
          fontSize: '6rem',
          fontWeight: 900,
          color: COLORS.secondary,
          opacity: 0.1,
          zIndex: 0
        }}
      >
        {number}
      </Typography>
      <Box
        sx={{
          width: 80,
          height: 80,
          borderRadius: '50%',
          bgcolor: 'white',
          boxShadow: '0 4px 20px rgba(139,26,46,0.1)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          mx: 'auto',
          mb: 3,
          color: COLORS.primary,
          position: 'relative',
          zIndex: 1
        }}
      >
        {icon}
      </Box>
      <Typography variant="h6" sx={{ fontWeight: 700, mb: 1, color: COLORS.primary }}>
        {title}
      </Typography>
      <Typography variant="body2" sx={{ color: COLORS.textSecondary }}>
        {description}
      </Typography>
    </MotionBox>
  </Grid>
);

const FeatureShowcase = () => {
  const [activeTab, setActiveTab] = useState(0);

  const features = [
    {
      title: "AI Horoscope Engine",
      description: "Advanced Vedic algorithms calculating birth charts with precision.",
      component: (
        <Box sx={{ width: '100%', height: 300, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <MotionBox
            animate={{ rotate: 360 }}
            transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
            sx={{ width: 250, height: 250, position: 'relative' }}
          >
            <svg viewBox="0 0 100 100" style={{ width: '100%', height: '100%' }}>
              <circle cx="50" cy="50" r="48" fill="none" stroke={COLORS.secondary} strokeWidth="0.5" />
              <circle cx="50" cy="50" r="35" fill="none" stroke={COLORS.secondary} strokeWidth="0.5" strokeDasharray="2 2" />
              {[...Array(12)].map((_, i) => (
                <line 
                  key={i}
                  x1="50" y1="50" 
                  x2={50 + 48 * Math.cos((i * 30 * Math.PI) / 180)} 
                  y2={50 + 48 * Math.sin((i * 30 * Math.PI) / 180)} 
                  stroke={COLORS.secondary} strokeWidth="0.5" 
                />
              ))}
              <text x="50" y="50" textAnchor="middle" dy=".3em" style={{ fontSize: 4, fill: COLORS.primary, fontWeight: 'bold' }}>ASC</text>
            </svg>
          </MotionBox>
        </Box>
      )
    },
    {
      title: "Smart Matchmaking",
      description: "Beyond stars — we match based on personality, lifestyle, and shared values.",
      component: (
        <Box sx={{ width: '100%', height: 300, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Box sx={{ textAlign: 'center' }}>
            <MotionBox
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 100 }}
              sx={{ 
                width: 150, 
                height: 150, 
                borderRadius: '50%', 
                border: `8px solid ${COLORS.secondary}`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                mb: 2
              }}
            >
              <Typography variant="h3" sx={{ fontWeight: 900, color: COLORS.primary }}>87%</Typography>
            </MotionBox>
            <Typography variant="subtitle1" sx={{ fontWeight: 700, color: COLORS.accent }}>Compatibility Score</Typography>
          </Box>
        </Box>
      )
    },
    {
      title: "Wedding Planning Hub",
      description: "Manage your budget, checklist, and vendors in one beautiful dashboard.",
      component: (
        <Box sx={{ width: '100%', height: 300 }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={[
              { name: 'Venue', value: 400 },
              { name: 'Photo', value: 300 },
              { name: 'Decor', value: 500 },
              { name: 'Food', value: 700 },
            ]}>
              <XAxis dataKey="name" hide />
              <YAxis hide />
              <Tooltip />
              <Bar dataKey="value" fill={COLORS.primary} radius={[10, 10, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Box>
      )
    }
  ];

  return (
    <Container sx={{ py: 12 }}>
      <Grid container spacing={8} alignItems="center">
        <Grid size={{ xs: 12, md: 6 }}>
          <MotionBox
            initial={{ opacity: 0, x: -40 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
          >
            <Typography variant="h3" sx={{ fontFamily: 'Playfair Display', fontWeight: 700, color: COLORS.primary, mb: 4 }}>
              Intelligent Features for <br /> Modern Couples
            </Typography>
            <Tabs 
              value={activeTab} 
              onChange={(_, v) => setActiveTab(v)}
              sx={{ 
                mb: 4,
                '& .MuiTabs-indicator': { bgcolor: COLORS.secondary },
                '& .MuiTab-root': { color: COLORS.textSecondary, fontWeight: 600 },
                '& .Mui-selected': { color: COLORS.primary }
              }}
            >
              <Tab label="Horoscope" />
              <Tab label="Matchmaking" />
              <Tab label="Planning" />
            </Tabs>
            <Box sx={{ minHeight: 240 }}>
              <AnimatePresence mode="wait">
                <MotionBox
                  key={activeTab}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.3 }}
                >
                  <Typography variant="h5" sx={{ fontWeight: 700, mb: 2, color: COLORS.textPrimary }}>
                    {features[activeTab].title}
                  </Typography>
                  <Typography variant="body1" sx={{ color: COLORS.textSecondary, mb: 4 }}>
                    {features[activeTab].description}
                  </Typography>
                  <Button 
                    variant="outlined" 
                    sx={{ 
                      borderColor: COLORS.primary, 
                      color: COLORS.primary,
                      borderRadius: '24px',
                      px: 4
                    }}
                  >
                    Learn More
                  </Button>
                </MotionBox>
              </AnimatePresence>
            </Box>
          </MotionBox>
        </Grid>
        <Grid size={{ xs: 12, md: 6 }}>
          <MotionBox
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            sx={{
              bgcolor: 'white',
              borderRadius: '40px',
              p: 4,
              boxShadow: '0 20px 60px rgba(0,0,0,0.05)',
              border: `1px solid ${COLORS.cream}`,
              minHeight: 400,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <AnimatePresence mode="wait">
              <MotionBox
                key={activeTab}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.3 }}
                sx={{ width: '100%', display: 'flex', justifyContent: 'center' }}
              >
                {features[activeTab].component}
              </MotionBox>
            </AnimatePresence>
          </MotionBox>
        </Grid>
      </Grid>
    </Container>
  );
};
;

const Testimonials = () => {
  const [index, setIndex] = useState(0);
  const reviews = [
    { name: "Kasun & Imali", text: "RaashiLink found us the perfect match. The horoscope compatibility was spot on!", role: "Engaged Couple" },
    { name: "Nimal Perera", text: "As a vendor, this platform has transformed how I reach premium clients in Sri Lanka.", role: "Photographer" },
    { name: "Dilini Silva", text: "The AI chatbot helped me plan my entire budget in just one afternoon. Amazing tool!", role: "Bride-to-be" }
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setIndex((prev) => (prev + 1) % reviews.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  return (
    <Box sx={{ py: 12, bgcolor: COLORS.cream }}>
      <Container maxWidth="md">
        <SectionTitle title="Voices of Love" subtitle="Hear from the couples and vendors who have found success with RaashiLink.AI" />
        <Box sx={{ position: 'relative', minHeight: 250 }}>
          <AnimatePresence mode="wait">
            <MotionBox
              key={index}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.5 }}
              sx={{ textAlign: 'center' }}
            >
              <Avatar sx={{ width: 80, height: 80, mx: 'auto', mb: 3, bgcolor: COLORS.primary }}>
                {reviews[index].name[0]}
              </Avatar>
              <Typography variant="h5" sx={{ fontStyle: 'italic', mb: 3, color: COLORS.textPrimary }}>
                "{reviews[index].text}"
              </Typography>
              <Typography variant="subtitle1" sx={{ fontWeight: 700, color: COLORS.primary }}>
                {reviews[index].name}
              </Typography>
              <Typography variant="caption" sx={{ color: COLORS.textSecondary }}>
                {reviews[index].role}
              </Typography>
            </MotionBox>
          </AnimatePresence>
          <Stack direction="row" spacing={1} justifyContent="center" sx={{ mt: 4 }}>
            {reviews.map((_, i) => (
              <Box 
                key={i} 
                onClick={() => setIndex(i)}
                sx={{ 
                  width: 10, 
                  height: 10, 
                  borderRadius: '50%', 
                  bgcolor: i === index ? COLORS.primary : COLORS.secondary,
                  cursor: 'pointer',
                  transition: '0.3s'
                }} 
              />
            ))}
          </Stack>
        </Box>
      </Container>
    </Box>
  );
};

const ImageGallery = () => {
  const images = [
    {
      url: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcR605huzSbivNR5GqJ5HG3cv63_zZif7uETuQ&s",
      title: "Traditional Kandyan Bride",
      description: "The timeless elegance of Sri Lankan wedding traditions."
    },
    {
      url: "https://assets.roar.media/Life/2017/07/Cover-Image.jpg?w=1200",
      title: "The Poruwa Ceremony",
      description: "Sacred rituals that bind two souls together in harmony."
    },
    {
      url: "https://thumbs.dreamstime.com/b/exquisite-floral-archway-wedding-stage-decor-lush-greenery-soft-drapes-stunning-wedding-stage-backdrop-adorned-412493550.jpg",
      title: "Exquisite Floral Decor",
      description: "Transforming venues into magical, auspicious spaces."
    },
    {
      url: "https://wp.onethreeonefour.com/wp-content/uploads/2019/01/Screenshot-2019-01-03-at-12.57.24-PM-770x509.png",
      title: "Grand Wedding Celebrations",
      description: "Unforgettable moments shared with family and friends."
    },
    {
      url: "https://media-cdn.tripadvisor.com/media/photo-s/1b/3e/1b/ba/a-happy-couple-in-ella.jpg",
      title: "The Happy Couple",
      description: "Starting a new journey filled with love and prosperity."
    },
    {
      url: "https://static.wixstatic.com/media/13710d_20e0b02bd1fc466ea884d9ab5b2aae65~mv2.jpg/v1/fill/w_735,h_490,al_c,q_85,enc_avif,quality_auto/13710d_20e0b02bd1fc466ea884d9ab5b2aae65~mv2.jpg",
      title: "Sacred Vows",
      description: "The moment two hearts become one forever."
    }
  ];

  return (
    <Box sx={{ py: 16, bgcolor: COLORS.white }}>
      <Container>
        <SectionTitle 
          title="Traditions & Elegance" 
          subtitle="Experience the beauty of Sri Lankan weddings through our curated gallery of moments that define a lifetime."
        />
        <Grid container spacing={3}>
          {images.map((img, i) => (
            <Grid key={i} size={{ xs: 12, sm: 6, md: 4 }}>
              <MotionBox
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1, duration: 0.6 }}
                whileHover={{ y: -12 }}
                sx={{
                  position: 'relative',
                  height: 400,
                  borderRadius: '32px',
                  overflow: 'hidden',
                  cursor: 'pointer',
                  boxShadow: '0 20px 40px rgba(0,0,0,0.12)',
                  border: `1px solid ${COLORS.cream}`
                }}
              >
                <Box
                  component="img"
                  src={img.url}
                  alt={img.title}
                  referrerPolicy="no-referrer"
                  sx={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                    transition: 'transform 0.8s cubic-bezier(0.4, 0, 0.2, 1)',
                    '&:hover': {
                      transform: 'scale(1.1)'
                    }
                  }}
                />
                <Box
                  sx={{
                    position: 'absolute',
                    inset: 0,
                    background: 'linear-gradient(to top, rgba(139,26,46,0.9) 0%, rgba(0,0,0,0.2) 50%, transparent 100%)',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'flex-end',
                    p: 4,
                    color: 'white',
                    opacity: 0.9,
                    transition: 'opacity 0.3s ease',
                    '&:hover': { opacity: 1 }
                  }}
                >
                  <Typography variant="h6" sx={{ fontWeight: 800, mb: 1, fontFamily: 'Playfair Display' }}>{img.title}</Typography>
                  <Typography variant="body2" sx={{ opacity: 0.9, lineHeight: 1.4 }}>{img.description}</Typography>
                </Box>
              </MotionBox>
            </Grid>
          ))}
        </Grid>
      </Container>
    </Box>
  );
};

// --- Main Page Component ---

const HERO_CAROUSEL_IMAGES = [
  "https://www.yamu.lk/wp-content/uploads/2023/07/WhatsApp-Image-2023-07-10-at-3.41.05-PM.jpeg",
  "https://do6raq9h04ex.cloudfront.net/sites/6/2024/06/1920x1080_0003_1.jpg",
  "https://www.eatsandretreats.com/travel/wp-content/uploads/2018/09/shutterstock_1012448875-1.jpg",
  "https://stanburyphotography.co.uk/wp-content/uploads/2018/11/sri-lanka-destination-wedding-photographers-048-1.jpg",
];

export default function LandingPage() {
  const { scrollYProgress } = useScroll();
  const heroOpacity = useTransform(scrollYProgress, [0, 0.2], [1, 0]);
  const heroScale = useTransform(scrollYProgress, [0, 0.2], [1, 0.95]);

  const [bgIndex, setBgIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setBgIndex((prev) => (prev + 1) % HERO_CAROUSEL_IMAGES.length);
    }, 6000);
    return () => clearInterval(interval);
  }, []);

  return (
    <Box sx={{ overflowX: 'hidden' }}>
      <LandingHeader />
      {/* Hero Section */}
      <Box
        sx={{
          height: '100vh',
          position: 'relative',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          bgcolor: COLORS.primary,
          overflow: 'hidden',
          color: 'white'
        }}
      >
        {/* Background Carousel */}
        <Box sx={{ position: 'absolute', inset: 0, zIndex: 0 }}>
          <AnimatePresence>
            <MotionBox
              key={bgIndex}
              initial={{ opacity: 0.6, scale: 1.1 }}
              animate={{ opacity: 0.6, scale: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 2 }}
              sx={{
                position: 'absolute',
                inset: 0,
                backgroundImage: `url(${HERO_CAROUSEL_IMAGES[bgIndex]})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
              }}
            />
          </AnimatePresence>
        </Box>

        {/* Animated Mandala Background */}
        <Box
          sx={{
            position: 'absolute',
            inset: 0,
            opacity: 0.1,
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='100' height='100' viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M50 0 L60 40 L100 50 L60 60 L50 100 L40 60 L0 50 L40 40 Z' fill='%23C9A84C' /%3E%3C/svg%3E")`,
            backgroundSize: '100px 100px',
            animation: 'ticker 60s linear infinite',
            zIndex: 1
          }}
        />
        <Box
          sx={{
            position: 'absolute',
            inset: 0,
            background: `linear-gradient(135deg, ${COLORS.primary} 0%, rgba(0,0,0,0.7) 100%)`,
            zIndex: 1,
            opacity: 0.8
          }}
        />

        {/* Floating Cards */}
        <FloatingProfileCard name="Kavindi" age={24} match={92} delay={0.5} top="20%" left="5%" rotate={-5} />
        <FloatingProfileCard name="Shanuka" age={28} match={88} delay={0.7} top="65%" left="10%" rotate={5} />
        <FloatingProfileCard name="Amali" age={26} match={95} delay={0.9} top="25%" right="5%" rotate={10} />

        <Container sx={{ position: 'relative', zIndex: 2, textAlign: 'center' }}>
          <MotionBox style={{ opacity: heroOpacity, scale: heroScale }}>
            <MotionTypography
              variant="h1"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              sx={{ 
                fontFamily: 'Playfair Display', 
                fontWeight: 700, 
                fontSize: { xs: '3rem', md: '5rem' },
                mb: 3,
                lineHeight: 1.1,
                textShadow: '0 4px 20px rgba(0,0,0,0.3)'
              }}
            >
              Find Your Perfect Match. <br />
              Plan Your Perfect Wedding.
            </MotionTypography>
            <MotionTypography
              variant="h5"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              sx={{ 
                mb: 6, 
                opacity: 0.9, 
                fontWeight: 400, 
                maxWidth: '800px', 
                mx: 'auto',
                textShadow: '0 2px 10px rgba(0,0,0,0.2)'
              }}
            >
              AI-powered matchmaking with Vedic horoscope compatibility, <br /> built specifically for Sri Lanka.
            </MotionTypography>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={3} justifyContent="center">
              <Button
                component={Link}
                to="/register"
                variant="contained"
                size="large"
                sx={{
                  bgcolor: COLORS.secondary,
                  color: COLORS.primary,
                  fontWeight: 700,
                  px: 6,
                  py: 2,
                  borderRadius: '30px',
                  '&:hover': { bgcolor: '#B89740' }
                }}
              >
                Find My Match
              </Button>
              <Button
                component={Link}
                to="/register"
                variant="outlined"
                size="large"
                sx={{
                  borderColor: 'white',
                  color: 'white',
                  fontWeight: 700,
                  px: 6,
                  py: 2,
                  borderRadius: '30px',
                  '&:hover': { borderColor: COLORS.secondary, color: COLORS.secondary }
                }}
              >
                Plan My Wedding
              </Button>
            </Stack>
          </MotionBox>
        </Container>

        {/* Stats Ticker */}
        <Box
          sx={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            bgcolor: 'rgba(0,0,0,0.3)',
            backdropFilter: 'blur(10px)',
            py: 2,
            overflow: 'hidden',
            zIndex: 3
          }}
        >
          <Box className="animate-ticker" sx={{ display: 'flex', whiteSpace: 'nowrap', gap: 8 }}>
            {[...Array(2)].map((_, i) => (
              <Stack key={i} direction="row" spacing={8} alignItems="center">
                <Typography variant="button" sx={{ fontWeight: 700, letterSpacing: 2 }}>
                  180,000+ Marriages in Sri Lanka Annually
                </Typography>
                <Star sx={{ color: COLORS.secondary }} />
                <Typography variant="button" sx={{ fontWeight: 700, letterSpacing: 2 }}>
                  87% Consult Astrology
                </Typography>
                <Star sx={{ color: COLORS.secondary }} />
                <Typography variant="button" sx={{ fontWeight: 700, letterSpacing: 2 }}>
                  LKR 50 Billion Wedding Industry
                </Typography>
                <Star sx={{ color: COLORS.secondary }} />
              </Stack>
            ))}
          </Box>
        </Box>
      </Box>

      {/* How It Works Section */}
      <Box sx={{ py: 16, bgcolor: COLORS.white }}>
        <Container>
          <SectionTitle 
            title="Your Journey from Match to Wedding Day" 
            subtitle="We guide you through every step of the traditional Sri Lankan matchmaking process with modern AI tools."
          />
          <Grid container spacing={4} sx={{ position: 'relative' }}>
            {/* Connecting Line */}
            <Box 
              sx={{ 
                position: 'absolute', 
                top: '40%', 
                left: '10%', 
                right: '10%', 
                height: '2px', 
                bgcolor: COLORS.cream, 
                zIndex: 0,
                display: { xs: 'none', md: 'block' }
              }} 
            />
            <StepCard number="01" icon={<AccountCircle fontSize="large" />} title="Create Profile" description="Share your details and birth information for our AI engine." delay={0.1} />
            <StepCard number="02" icon={<Star fontSize="large" />} title="Horoscope Check" description="Get instant Vedic compatibility scores with potential matches." delay={0.2} />
            <StepCard number="03" icon={<Favorite fontSize="large" />} title="Find Your Match" description="Connect with verified profiles that align with your stars." delay={0.3} />
            <StepCard number="04" icon={<CalendarMonth fontSize="large" />} title="Plan Your Wedding" description="Book vendors and manage your budget in one place." delay={0.4} />
          </Grid>
        </Container>
      </Box>

      {/* Features Showcase */}
      <FeatureShowcase />

      {/* Image Gallery */}
      <ImageGallery />

      {/* Testimonials */}
      <Testimonials />

      {/* Vendor CTA */}
      <Box sx={{ py: 12, bgcolor: COLORS.primary, color: 'white', textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
        <Box sx={{ position: 'absolute', inset: 0, opacity: 0.05, backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)', backgroundSize: '20px 20px' }} />
        <Container maxWidth="sm" sx={{ position: 'relative', zIndex: 1 }}>
          <Typography variant="h3" sx={{ fontFamily: 'Playfair Display', mb: 3 }}>Are you a wedding vendor?</Typography>
          <Typography variant="body1" sx={{ mb: 6, opacity: 0.8 }}>
            Join Sri Lanka's fastest-growing wedding ecosystem. Reach couples who are ready to book and grow your business with our smart lead management.
          </Typography>
          <Stack direction="row" spacing={2} justifyContent="center" sx={{ mb: 6 }}>
            <CheckCircle sx={{ color: COLORS.secondary }} /> <Typography variant="body2">Verified Leads</Typography>
            <CheckCircle sx={{ color: COLORS.secondary }} /> <Typography variant="body2">Smart Analytics</Typography>
            <CheckCircle sx={{ color: COLORS.secondary }} /> <Typography variant="body2">Zero Commission</Typography>
          </Stack>
          <Button 
            variant="contained" 
            sx={{ 
              bgcolor: COLORS.secondary, 
              color: COLORS.primary, 
              fontWeight: 700, 
              px: 6, 
              py: 2, 
              borderRadius: '30px' 
            }}
          >
            Join as Vendor
          </Button>
        </Container>
      </Box>

      {/* Footer */}
      <Box sx={{ py: 8, bgcolor: COLORS.cream, borderTop: `1px solid rgba(0,0,0,0.05)` }}>
        <Container>
          <Grid container spacing={8}>
            <Grid size={{ xs: 12, md: 4 }}>
              <Typography variant="h5" sx={{ color: COLORS.primary, fontWeight: 900, mb: 2 }}>RaashiLink.AI</Typography>
              <Typography variant="body2" sx={{ color: COLORS.textSecondary, mb: 3 }}>
                Intelligent matchmaking and wedding planning for the modern Sri Lankan. <br />
                සෑම පියවරකදීම ඔබ සමඟයි.
              </Typography>
              <Stack direction="row" spacing={2}>
                <IconButton size="small" sx={{ color: COLORS.primary }}><Facebook /></IconButton>
                <IconButton size="small" sx={{ color: COLORS.primary }}><Instagram /></IconButton>
                <IconButton size="small" sx={{ color: COLORS.primary }}><Twitter /></IconButton>
                <IconButton size="small" sx={{ color: COLORS.primary }}><LinkedIn /></IconButton>
              </Stack>
            </Grid>
            <Grid size={{ xs: 6, md: 2 }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 3 }}>Platform</Typography>
              <Stack spacing={1}>
                <Link to="#" style={{ textDecoration: 'none', color: COLORS.textSecondary, fontSize: '14px' }}>Matchmaking</Link>
                <Link to="#" style={{ textDecoration: 'none', color: COLORS.textSecondary, fontSize: '14px' }}>Horoscope</Link>
                <Link to="#" style={{ textDecoration: 'none', color: COLORS.textSecondary, fontSize: '14px' }}>Wedding Planning</Link>
              </Stack>
            </Grid>
            <Grid size={{ xs: 6, md: 2 }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 3 }}>Company</Typography>
              <Stack spacing={1}>
                <Link to="#" style={{ textDecoration: 'none', color: COLORS.textSecondary, fontSize: '14px' }}>About Us</Link>
                <Link to="#" style={{ textDecoration: 'none', color: COLORS.textSecondary, fontSize: '14px' }}>Contact</Link>
                <Link to="#" style={{ textDecoration: 'none', color: COLORS.textSecondary, fontSize: '14px' }}>Privacy Policy</Link>
              </Stack>
            </Grid>
            <Grid size={{ xs: 12, md: 4 }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 3 }}>Newsletter</Typography>
              <Typography variant="body2" sx={{ color: COLORS.textSecondary, mb: 2 }}>Get the latest wedding trends and tips.</Typography>
              <Stack direction="row" spacing={1}>
                <Box component="input" placeholder="Email address" sx={{ flex: 1, p: 1.5, borderRadius: '8px', border: `1px solid ${COLORS.secondary}`, bgcolor: 'white' }} />
                <Button variant="contained" sx={{ bgcolor: COLORS.primary }}>Join</Button>
              </Stack>
            </Grid>
          </Grid>
          <Divider sx={{ my: 6 }} />
          <Typography variant="body2" sx={{ textAlign: 'center', color: COLORS.textSecondary }}>
            Made with ❤️ for Sri Lanka | © 2026 RaashiLink.AI
          </Typography>
        </Container>
      </Box>
    </Box>
  );
}

