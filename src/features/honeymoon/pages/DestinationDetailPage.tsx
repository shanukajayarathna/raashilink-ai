import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Stack,
  Tabs,
  Tab,
  Grid,
  Paper,
  Button,
  IconButton,
  Chip,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  useTheme,
  useMediaQuery,
  alpha,
  Skeleton,
} from '@mui/material';
import {
  ChevronDown,
  MapPin,
  Calendar,
  Thermometer,
  CloudRain,
  Sparkles,
  Plane,
  CreditCard,
  ShieldCheck,
  ExternalLink,
  ArrowLeft,
  Heart,
  Waves,
  Utensils,
  Sun,
  Camera,
  Music,
  Tent,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

const COLORS = {
  primary: '#8B1A2E',
  secondary: '#C9A84C',
  accent: '#1A6B72',
  cream: '#FAF7F2',
  white: '#FFFFFF',
  textPrimary: '#1C1C1C',
  textSecondary: '#555555',
};

const iconMap: { [key: string]: React.ReactNode } = {
  Swimming: <Waves size={20} />,
  'Couples Spa': <Sparkles size={20} />,
  'Fine Dining': <Utensils size={20} />,
  'Sunset Views': <Sun size={20} />,
  Photography: <Camera size={20} />,
  'Sunset Cruise': <Waves size={20} />,
  Snorkeling: <Waves size={20} />,
  'Nightlife': <Music size={20} />,
  'Safari': <Tent size={20} />,
};

const CLIMATE_DATA = [
  { month: 'Jan', temp: 28, rain: 20 },
  { month: 'Feb', temp: 29, rain: 15 },
  { month: 'Mar', temp: 30, rain: 30 },
  { month: 'Apr', temp: 31, rain: 50 },
  { month: 'May', temp: 30, rain: 120 },
  { month: 'Jun', temp: 29, rain: 150 },
  { month: 'Jul', temp: 28, rain: 140 },
  { month: 'Aug', temp: 28, rain: 130 },
  { month: 'Sep', temp: 29, rain: 110 },
  { month: 'Oct', temp: 30, rain: 90 },
  { month: 'Nov', temp: 29, rain: 60 },
  { month: 'Dec', temp: 28, rain: 40 },
];

export default function DestinationDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [tabValue, setTabValue] = useState(0);
  const [loading, setLoading] = useState(true);
  const [isSaved, setIsSaved] = useState(false);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  useEffect(() => {
    // Simulate API fetch
    const timer = setTimeout(() => setLoading(false), 1200);
    return () => clearTimeout(timer);
  }, [id]);

  if (loading) {
    return (
      <Box sx={{ bgcolor: COLORS.cream, minHeight: '100vh', pt: 12 }}>
        <Container maxWidth="lg">
          <Skeleton variant="rectangular" height={400} sx={{ borderRadius: 6, mb: 4 }} />
          <Grid container spacing={4}>
            <Grid size={{ xs: 12, md: 8 }}>
              <Skeleton variant="text" height={60} width="60%" sx={{ mb: 2 }} />
              <Skeleton variant="text" height={30} width="40%" sx={{ mb: 4 }} />
              <Skeleton variant="rectangular" height={300} sx={{ borderRadius: 4 }} />
            </Grid>
            <Grid size={{ xs: 12, md: 4 }}>
              <Skeleton variant="rectangular" height={500} sx={{ borderRadius: 4 }} />
            </Grid>
          </Grid>
        </Container>
      </Box>
    );
  }

  // Mock Data
  const destination = {
    id: '1',
    name: 'Maldives',
    region: 'South Asia',
    country: 'Maldives',
    images: [
      'https://picsum.photos/seed/maldives1/1200/600',
      'https://picsum.photos/seed/maldives2/1200/600',
      'https://picsum.photos/seed/maldives3/1200/600',
    ],
    bestTime: 'November to April',
    aiReason: "We recommend the Maldives because it perfectly matches your 'Beach Paradise' vibe and 'Luxury' budget. Its secluded overwater villas provide the ultimate romantic privacy you're looking for.",
    highlights: ['Overwater Villas', 'Crystal Clear Lagoons', 'Private Island Dining', 'Underwater Spa'],
    activities: ['Sunset Cruise', 'Snorkeling', 'Couples Spa', 'Fine Dining'],
    itinerary: [
      { day: 1, title: 'Arrival & Sunset Dinner', desc: 'Arrive at Velana International Airport, take a scenic seaplane to your resort. Enjoy a private candlelit dinner on the beach.' },
      { day: 2, title: 'Lagoon Exploration & Spa', desc: 'Morning snorkeling in the house reef. Afternoon couples massage at the underwater spa. Evening cocktails at the overwater bar.' },
      { day: 3, title: 'Sandbank Picnic', desc: 'Take a private boat to a secluded sandbank for a gourmet picnic. Enjoy swimming and sunbathing in total privacy.' },
    ],
    travelInfo: {
      visa: 'Free 30-day visa on arrival for Sri Lankan passport holders.',
      airlines: [
        { name: 'SriLankan Airlines', price: 'USD 250+' },
        { name: 'Emirates', price: 'USD 350+' },
        { name: 'Qatar Airways', price: 'USD 400+' },
      ],
      currency: 'Maldivian Rufiyaa (MVR), but USD is widely accepted in resorts.',
      safety: 'Very safe for tourists. Resorts are isolated and secure.',
    }
  };

  return (
    <Box sx={{ bgcolor: COLORS.cream, minHeight: '100vh', pb: 8 }}>
      {/* Hero Carousel Section */}
      <Box sx={{ position: 'relative', height: { xs: 300, md: 500 }, overflow: 'hidden' }}>
        <motion.img
          initial={{ scale: 1.1 }}
          animate={{ scale: 1 }}
          transition={{ duration: 10, repeat: Infinity, repeatType: 'reverse' }}
          src={destination.images[0]}
          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
        />
        <Box sx={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: 'linear-gradient(to bottom, rgba(0,0,0,0.3) 0%, transparent 40%, rgba(0,0,0,0.7) 100%)' }} />
        
        <Container maxWidth="lg" sx={{ position: 'absolute', bottom: 40, left: '50%', transform: 'translateX(-50%)', zIndex: 2 }}>
          <Stack direction="row" spacing={2} alignItems="flex-end" justifyContent="space-between">
            <Box>
              <Stack direction="row" spacing={1} alignItems="center" sx={{ color: alpha(COLORS.white, 0.9), mb: 1 }}>
                <MapPin size={18} />
                <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>{destination.region}, {destination.country}</Typography>
              </Stack>
              <Typography variant="h2" sx={{ color: 'white', fontWeight: 900, fontFamily: 'Playfair Display', mb: 1 }}>{destination.name}</Typography>
              <Chip
                icon={<Calendar size={14} color="white" />}
                label={`Best Time: ${destination.bestTime}`}
                sx={{ bgcolor: alpha(COLORS.accent, 0.9), color: 'white', fontWeight: 700, borderRadius: 2 }}
              />
            </Box>
            <Stack direction="row" spacing={2}>
              <IconButton
                onClick={() => setIsSaved(!isSaved)}
                sx={{ bgcolor: 'white', color: isSaved ? COLORS.primary : COLORS.textSecondary, '&:hover': { bgcolor: alpha(COLORS.white, 0.9) } }}
              >
                <Heart size={24} fill={isSaved ? COLORS.primary : 'none'} />
              </IconButton>
              <Button
                variant="contained"
                startIcon={<Plane size={20} />}
                sx={{ bgcolor: COLORS.primary, borderRadius: 3, px: 4, py: 1.5, fontWeight: 800, textTransform: 'none', '&:hover': { bgcolor: '#6B1423' } }}
              >
                Book Now
              </Button>
            </Stack>
          </Stack>
        </Container>

        <IconButton
          onClick={() => navigate(-1)}
          sx={{ position: 'absolute', top: 100, left: 24, bgcolor: 'rgba(255,255,255,0.2)', color: 'white', backdropFilter: 'blur(8px)', '&:hover': { bgcolor: 'rgba(255,255,255,0.3)' } }}
        >
          <ArrowLeft size={24} />
        </IconButton>
      </Box>

      {/* Tabs Section */}
      <Container maxWidth="lg" sx={{ mt: -4, position: 'relative', zIndex: 3 }}>
        <Paper sx={{ borderRadius: 4, overflow: 'hidden', boxShadow: '0 12px 32px rgba(0,0,0,0.1)' }}>
          <Tabs
            value={tabValue}
            onChange={(_, val) => setTabValue(val)}
            variant="fullWidth"
            sx={{
              bgcolor: 'white',
              '& .MuiTabs-indicator': { height: 4, borderRadius: '4px 4px 0 0', bgcolor: COLORS.primary },
              '& .MuiTab-root': { py: 3, fontWeight: 800, color: COLORS.textSecondary, '&.Mui-selected': { color: COLORS.primary } }
            }}
          >
            <Tab label="Overview" />
            <Tab label="Sample Itinerary" />
            <Tab label="Travel Info" />
          </Tabs>

          <Box sx={{ p: { xs: 3, md: 6 }, bgcolor: 'white' }}>
            <AnimatePresence mode="wait">
              {tabValue === 0 && (
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
                  <Grid container spacing={6}>
                    <Grid size={{ xs: 12, md: 7 }}>
                      <Box sx={{ mb: 6, p: 3, borderRadius: 4, bgcolor: alpha(COLORS.accent, 0.05), border: `1px dashed ${COLORS.accent}` }}>
                        <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 2, color: COLORS.accent }}>
                          <Sparkles size={24} />
                          <Typography variant="h6" sx={{ fontWeight: 800 }}>Why We Recommend This</Typography>
                        </Stack>
                        <Typography variant="body1" sx={{ color: COLORS.textSecondary, lineHeight: 1.8 }}>{destination.aiReason}</Typography>
                      </Box>

                      <Typography variant="h5" sx={{ fontWeight: 800, mb: 3, fontFamily: 'Playfair Display' }}>Climate Overview</Typography>
                      <Box sx={{ height: 300, width: '100%', mb: 6 }}>
                        <ResponsiveContainer>
                          <AreaChart data={CLIMATE_DATA}>
                            <defs>
                              <linearGradient id="colorTemp" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor={COLORS.secondary} stopOpacity={0.8}/>
                                <stop offset="95%" stopColor={COLORS.secondary} stopOpacity={0}/>
                              </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={alpha(COLORS.textSecondary, 0.1)} />
                            <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 12, fontWeight: 600 }} />
                            <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fontWeight: 600 }} />
                            <Tooltip contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 8px 24px rgba(0,0,0,0.1)' }} />
                            <Area type="monotone" dataKey="temp" stroke={COLORS.secondary} fillOpacity={1} fill="url(#colorTemp)" name="Temperature (°C)" />
                            <Area type="monotone" dataKey="rain" stroke={COLORS.accent} fill={alpha(COLORS.accent, 0.1)} name="Rainfall (mm)" />
                          </AreaChart>
                        </ResponsiveContainer>
                      </Box>

                      <Typography variant="h5" sx={{ fontWeight: 800, mb: 3, fontFamily: 'Playfair Display' }}>Must-See Highlights</Typography>
                      <Grid container spacing={2}>
                        {destination.highlights.map((h, i) => (
                          <Grid size={{ xs: 12, sm: 6 }} key={i}>
                            <Stack direction="row" spacing={2} alignItems="center" sx={{ p: 2, borderRadius: 3, bgcolor: COLORS.cream }}>
                              <Box sx={{ p: 1, borderRadius: 2, bgcolor: 'white', color: COLORS.primary }}><Sparkles size={18} /></Box>
                              <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>{h}</Typography>
                            </Stack>
                          </Grid>
                        ))}
                      </Grid>
                    </Grid>

                    <Grid size={{ xs: 12, md: 5 }}>
                      <Typography variant="h5" sx={{ fontWeight: 800, mb: 3, fontFamily: 'Playfair Display' }}>Couple Activities</Typography>
                      <Grid container spacing={2}>
                        {destination.activities.map((a, i) => (
                          <Grid size={6} key={i}>
                            <Paper elevation={0} sx={{ p: 3, textAlign: 'center', borderRadius: 4, border: '1px solid', borderColor: 'divider', transition: 'all 0.3s ease', '&:hover': { transform: 'translateY(-4px)', borderColor: COLORS.primary, bgcolor: alpha(COLORS.primary, 0.02) } }}>
                              <Box sx={{ color: COLORS.primary, mb: 1.5 }}>{iconMap[a] || <Sparkles size={24} />}</Box>
                              <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>{a}</Typography>
                            </Paper>
                          </Grid>
                        ))}
                      </Grid>
                    </Grid>
                  </Grid>
                </motion.div>
              )}

              {tabValue === 1 && (
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
                  <Stack spacing={3}>
                    {destination.itinerary.map((item, i) => (
                      <Accordion key={i} defaultExpanded={i === 0} sx={{ borderRadius: 4, '&:before': { display: 'none' }, boxShadow: 'none', border: '1px solid', borderColor: 'divider', overflow: 'hidden' }}>
                        <AccordionSummary expandIcon={<ChevronDown size={20} />} sx={{ p: 3, bgcolor: i === 0 ? alpha(COLORS.primary, 0.02) : 'white' }}>
                          <Stack direction="row" spacing={3} alignItems="center">
                            <Box sx={{ width: 48, height: 48, borderRadius: '50%', bgcolor: COLORS.primary, color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: '1.2rem' }}>{item.day}</Box>
                            <Typography variant="h6" sx={{ fontWeight: 800 }}>{item.title}</Typography>
                          </Stack>
                        </AccordionSummary>
                        <AccordionDetails sx={{ p: 4, pt: 0 }}>
                          <Typography variant="body1" sx={{ color: COLORS.textSecondary, lineHeight: 1.8 }}>{item.desc}</Typography>
                          <Button variant="outlined" size="small" sx={{ mt: 3, borderRadius: 2, textTransform: 'none', fontWeight: 700, borderColor: COLORS.primary, color: COLORS.primary }}>Edit Day {item.day}</Button>
                        </AccordionDetails>
                      </Accordion>
                    ))}
                    <Box sx={{ textAlign: 'center', pt: 4 }}>
                      <Button variant="contained" sx={{ bgcolor: COLORS.accent, borderRadius: 3, px: 6, py: 2, fontWeight: 800, textTransform: 'none', '&:hover': { bgcolor: '#145258' } }}>Customize This Itinerary</Button>
                    </Box>
                  </Stack>
                </motion.div>
              )}

              {tabValue === 2 && (
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
                  <Grid container spacing={4}>
                    <Grid size={{ xs: 12, md: 6 }}>
                      <Stack spacing={4}>
                        <Box>
                          <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 2, color: COLORS.primary }}>
                            <ShieldCheck size={24} />
                            <Typography variant="h6" sx={{ fontWeight: 800 }}>Visa Requirements</Typography>
                          </Stack>
                          <Typography variant="body1" sx={{ color: COLORS.textSecondary, lineHeight: 1.8 }}>{destination.travelInfo.visa}</Typography>
                        </Box>
                        <Box>
                          <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 2, color: COLORS.primary }}>
                            <Plane size={24} />
                            <Typography variant="h6" sx={{ fontWeight: 800 }}>Best Airlines from Colombo</Typography>
                          </Stack>
                          <Stack spacing={2}>
                            {destination.travelInfo.airlines.map((a, i) => (
                              <Stack key={i} direction="row" justifyContent="space-between" alignItems="center" sx={{ p: 2, borderRadius: 2, bgcolor: COLORS.cream }}>
                                <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>{a.name}</Typography>
                                <Typography variant="subtitle2" sx={{ fontWeight: 800, color: COLORS.primary }}>{a.price}</Typography>
                              </Stack>
                            ))}
                          </Stack>
                        </Box>
                      </Stack>
                    </Grid>
                    <Grid size={{ xs: 12, md: 6 }}>
                      <Stack spacing={4}>
                        <Box>
                          <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 2, color: COLORS.primary }}>
                            <CreditCard size={24} />
                            <Typography variant="h6" sx={{ fontWeight: 800 }}>Currency & Money</Typography>
                          </Stack>
                          <Typography variant="body1" sx={{ color: COLORS.textSecondary, lineHeight: 1.8 }}>{destination.travelInfo.currency}</Typography>
                        </Box>
                        <Box>
                          <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 2, color: COLORS.primary }}>
                            <ShieldCheck size={24} />
                            <Typography variant="h6" sx={{ fontWeight: 800 }}>Health & Safety</Typography>
                          </Stack>
                          <Typography variant="body1" sx={{ color: COLORS.textSecondary, lineHeight: 1.8 }}>{destination.travelInfo.safety}</Typography>
                        </Box>
                        <Button
                          fullWidth
                          variant="contained"
                          endIcon={<ExternalLink size={20} />}
                          sx={{ bgcolor: COLORS.secondary, borderRadius: 3, py: 2, fontWeight: 800, textTransform: 'none', '&:hover': { bgcolor: '#B09342' } }}
                        >
                          Book via External Partner
                        </Button>
                      </Stack>
                    </Grid>
                  </Grid>
                </motion.div>
              )}
            </AnimatePresence>
          </Box>
        </Paper>
      </Container>
    </Box>
  );
}

