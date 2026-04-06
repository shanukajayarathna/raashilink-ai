import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Stack,
  Grid,
  Paper,
  Button,
  IconButton,
  Chip,
  alpha,
  useTheme,
  useMediaQuery,
  Skeleton,
  ToggleButtonGroup,
  ToggleButton,
  Fade,
} from '@mui/material';
import {
  Sparkles,
  Heart,
  Calendar,
  Wallet,
  Map as MapIcon,
  LayoutGrid,
  ArrowRight,
  Waves,
  Mountain,
  Building2,
  Trees,
  Home,
  CheckCircle2,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import axios from 'axios';
import DestinationCard from '../components/DestinationCard';
import WorldMapView from '../components/WorldMapView';

const COLORS = {
  primary: '#8B1A2E',
  secondary: '#C9A84C',
  accent: '#1A6B72',
  cream: '#FAF7F2',
  white: '#FFFFFF',
  textPrimary: '#1C1C1C',
  textSecondary: '#555555',
};

const VIBES = [
  { id: 'beach', title: 'Beach Paradise', icon: <Waves size={32} />, color: '#2196F3' },
  { id: 'mountain', title: 'Mountain Adventure', icon: <Mountain size={32} />, color: '#4CAF50' },
  { id: 'city', title: 'City Culture', icon: <Building2 size={32} />, color: '#FF9800' },
  { id: 'wildlife', title: 'Wildlife Safari', icon: <Trees size={32} />, color: '#795548' },
  { id: 'rural', title: 'Romantic Rural', icon: <Home size={32} />, color: '#673AB7' },
];

const BUDGET_TIERS = [
  { id: 'budget', title: 'Budget', range: 'USD 1,000-2,500', icon: <Wallet size={24} /> },
  { id: 'mid', title: 'Mid-range', range: 'USD 2,500-5,000', icon: <Wallet size={24} /> },
  { id: 'luxury', title: 'Luxury', range: 'USD 5,000+', icon: <Sparkles size={24} /> },
];

const DURATIONS = [
  { id: 'short', title: 'Long weekend', range: '3-4 days' },
  { id: 'week', title: 'One week', range: '7 days' },
  { id: 'long', title: 'Two weeks', range: '14 days' },
];

const MOCK_DESTINATIONS = [
  {
    id: '1',
    name: 'Maldives',
    region: 'South Asia',
    country: 'Maldives',
    image: 'https://picsum.photos/seed/maldives/800/600',
    tags: ['🏖 Beach', '🌺 Romantic', '🌡 28°C avg'],
    budget: 2400,
    bestSeason: 'Nov-Apr',
    description: 'Escape to a tropical paradise with overwater villas and crystal clear lagoons. Perfect for couples seeking privacy and luxury.',
    matchScore: 95,
    highlights: [{ icon: 'Waves', label: 'Swimming' }, { icon: 'Sparkles', label: 'Couples Spa' }, { icon: 'Utensils', label: 'Fine Dining' }, { icon: 'Sun', label: 'Sunset Views' }],
    x: 65, y: 65, type: 'beach' as const,
  },
  {
    id: '2',
    name: 'Santorini',
    region: 'Cyclades',
    country: 'Greece',
    image: 'https://picsum.photos/seed/santorini/800/600',
    tags: ['🏛 Culture', '🌅 Sunset', '🌡 24°C avg'],
    budget: 3500,
    bestSeason: 'May-Oct',
    description: 'Famous for its stunning sunsets and white-washed buildings. Explore volcanic beaches and ancient ruins with your partner.',
    matchScore: 88,
    highlights: [{ icon: 'Sun', label: 'Sunset Views' }, { icon: 'Camera', label: 'Photography' }, { icon: 'Utensils', label: 'Fine Dining' }],
    x: 55, y: 25, type: 'culture' as const,
  },
  {
    id: '3',
    name: 'Bali',
    region: 'Ubud',
    country: 'Indonesia',
    image: 'https://picsum.photos/seed/bali/800/600',
    tags: ['🌴 Nature', '🧘 Spiritual', '🌡 29°C avg'],
    budget: 1800,
    bestSeason: 'Apr-Oct',
    description: 'A spiritual haven with lush jungles and vibrant culture. Experience traditional Balinese hospitality and serene landscapes.',
    matchScore: 92,
    highlights: [{ icon: 'Trees', label: 'Nature' }, { icon: 'Sparkles', label: 'Couples Spa' }, { icon: 'Utensils', label: 'Fine Dining' }],
    x: 80, y: 70, type: 'nature' as const,
  },
];

export default function HoneymoonDestinations() {
  const [showQuiz, setShowQuiz] = useState(true);
  const [viewMode, setViewMode] = useState<'grid' | 'map'>('grid');
  const [loading, setLoading] = useState(false);
  const [preferences, setPreferences] = useState({
    vibe: '',
    budget: '',
    duration: '',
  });
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const handleGetRecommendations = async () => {
    if (!preferences.vibe || !preferences.budget || !preferences.duration) return;
    setLoading(true);
    // Simulate API call
    try {
      // await axios.post(`${process.env.REACT_APP_API_URL}/api/v1/honeymoon/preferences`, preferences);
      await new Promise(resolve => setTimeout(resolve, 2000));
      setShowQuiz(false);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ bgcolor: COLORS.cream, minHeight: '100vh', pt: 12, pb: 8 }}>
      <Container maxWidth="lg">
        <AnimatePresence mode="wait">
          {showQuiz ? (
            <motion.div
              key="quiz"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.6 }}
            >
              <Box sx={{ textAlign: 'center', mb: 8 }}>
                <Typography variant="h2" sx={{ fontWeight: 900, fontFamily: 'Playfair Display', color: COLORS.primary, mb: 2 }}>
                  Let's find your perfect honeymoon
                </Typography>
                <Typography variant="h6" sx={{ color: COLORS.textSecondary, maxWidth: 600, mx: 'auto' }}>
                  Answer 3 quick questions and our AI will curate the most romantic destinations for your first journey as a couple.
                </Typography>
              </Box>

              <Stack spacing={6}>
                {/* Vibe Selector */}
                <Box>
                  <Typography variant="h5" sx={{ fontWeight: 800, mb: 3, textAlign: 'center' }}>1. What's your ideal vibe?</Typography>
                  <Grid container spacing={2}>
                    {VIBES.map((v) => (
                      <Grid size={{ xs: 6, sm: 4, md: 2.4 }} key={v.id}>
                        <Paper
                          elevation={0}
                          onClick={() => setPreferences({ ...preferences, vibe: v.id })}
                          sx={{
                            p: 3,
                            borderRadius: 4,
                            textAlign: 'center',
                            cursor: 'pointer',
                            border: '2px solid',
                            borderColor: preferences.vibe === v.id ? COLORS.primary : 'transparent',
                            bgcolor: preferences.vibe === v.id ? alpha(COLORS.primary, 0.05) : 'white',
                            transition: 'all 0.3s ease',
                            '&:hover': { transform: 'translateY(-8px)', boxShadow: '0 8px 24px rgba(0,0,0,0.05)' },
                          }}
                        >
                          <Box sx={{ color: preferences.vibe === v.id ? COLORS.primary : COLORS.textSecondary, mb: 2 }}>{v.icon}</Box>
                          <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>{v.title}</Typography>
                          {preferences.vibe === v.id && (
                            <Box sx={{ position: 'absolute', top: 8, right: 8, color: COLORS.primary }}><CheckCircle2 size={16} /></Box>
                          )}
                        </Paper>
                      </Grid>
                    ))}
                  </Grid>
                </Box>

                {/* Budget Selector */}
                <Box>
                  <Typography variant="h5" sx={{ fontWeight: 800, mb: 3, textAlign: 'center' }}>2. What's your budget tier?</Typography>
                  <Grid container spacing={3}>
                    {BUDGET_TIERS.map((b) => (
                      <Grid size={{ xs: 12, md: 4 }} key={b.id}>
                        <Paper
                          elevation={0}
                          onClick={() => setPreferences({ ...preferences, budget: b.id })}
                          sx={{
                            p: 4,
                            borderRadius: 4,
                            cursor: 'pointer',
                            border: '2px solid',
                            borderColor: preferences.budget === b.id ? COLORS.primary : 'transparent',
                            bgcolor: preferences.budget === b.id ? alpha(COLORS.primary, 0.05) : 'white',
                            transition: 'all 0.3s ease',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 3,
                            '&:hover': { transform: 'scale(1.02)', boxShadow: '0 8px 24px rgba(0,0,0,0.05)' },
                          }}
                        >
                          <Box sx={{ p: 2, borderRadius: 3, bgcolor: alpha(COLORS.secondary, 0.1), color: COLORS.secondary }}>{b.icon}</Box>
                          <Box>
                            <Typography variant="h6" sx={{ fontWeight: 800 }}>{b.title}</Typography>
                            <Typography variant="body2" sx={{ color: COLORS.textSecondary }}>{b.range}</Typography>
                          </Box>
                        </Paper>
                      </Grid>
                    ))}
                  </Grid>
                </Box>

                {/* Duration Selector */}
                <Box>
                  <Typography variant="h5" sx={{ fontWeight: 800, mb: 3, textAlign: 'center' }}>3. How long is the getaway?</Typography>
                  <Grid container spacing={3}>
                    {DURATIONS.map((d) => (
                      <Grid size={{ xs: 12, md: 4 }} key={d.id}>
                        <Paper
                          elevation={0}
                          onClick={() => setPreferences({ ...preferences, duration: d.id })}
                          sx={{
                            p: 3,
                            borderRadius: 4,
                            textAlign: 'center',
                            cursor: 'pointer',
                            border: '2px solid',
                            borderColor: preferences.duration === d.id ? COLORS.primary : 'transparent',
                            bgcolor: preferences.duration === d.id ? alpha(COLORS.primary, 0.05) : 'white',
                            transition: 'all 0.3s ease',
                            '&:hover': { bgcolor: alpha(COLORS.primary, 0.02) },
                          }}
                        >
                          <Typography variant="h6" sx={{ fontWeight: 800, mb: 0.5 }}>{d.title}</Typography>
                          <Typography variant="body2" sx={{ color: COLORS.textSecondary }}>{d.range}</Typography>
                        </Paper>
                      </Grid>
                    ))}
                  </Grid>
                </Box>

                <Box sx={{ textAlign: 'center', pt: 4 }}>
                  <Button
                    variant="contained"
                    size="large"
                    disabled={!preferences.vibe || !preferences.budget || !preferences.duration || loading}
                    onClick={handleGetRecommendations}
                    endIcon={loading ? null : <ArrowRight size={24} />}
                    sx={{
                      bgcolor: COLORS.primary,
                      borderRadius: 4,
                      px: 8,
                      py: 2,
                      fontWeight: 900,
                      fontSize: '1.2rem',
                      textTransform: 'none',
                      boxShadow: '0 8px 32px rgba(139,26,46,0.3)',
                      '&:hover': { bgcolor: '#6B1423' },
                    }}
                  >
                    {loading ? 'AI is Curating...' : 'Get AI Recommendations'}
                  </Button>
                </Box>
              </Stack>
            </motion.div>
          ) : (
            <motion.div
              key="recommendations"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6 }}
            >
              <Stack direction={{ xs: 'column', md: 'row' }} justifyContent="space-between" alignItems={{ xs: 'flex-start', md: 'center' }} sx={{ mb: 6 }} spacing={2}>
                <Box>
                  <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 1 }}>
                    <Typography variant="h3" sx={{ fontWeight: 900, fontFamily: 'Playfair Display', color: COLORS.primary }}>
                      Top Picks for You
                    </Typography>
                    <Chip
                      icon={<Sparkles size={14} color="white" />}
                      label="AI Curated"
                      sx={{ bgcolor: COLORS.accent, color: 'white', fontWeight: 800, height: 28 }}
                    />
                  </Stack>
                  <Typography variant="body1" sx={{ color: COLORS.textSecondary }}>
                    Based on your preference for <b>{preferences.vibe}</b> vibes and <b>{preferences.budget}</b> budget.
                  </Typography>
                </Box>

                <ToggleButtonGroup
                  value={viewMode}
                  exclusive
                  onChange={(_, val) => val && setViewMode(val)}
                  sx={{ bgcolor: 'white', borderRadius: 3, p: 0.5, boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}
                >
                  <ToggleButton value="grid" sx={{ borderRadius: 2, px: 3, border: 'none', '&.Mui-selected': { bgcolor: alpha(COLORS.primary, 0.1), color: COLORS.primary } }}>
                    <LayoutGrid size={20} style={{ marginRight: 8 }} /> Grid
                  </ToggleButton>
                  <ToggleButton value="map" sx={{ borderRadius: 2, px: 3, border: 'none', '&.Mui-selected': { bgcolor: alpha(COLORS.primary, 0.1), color: COLORS.primary } }}>
                    <MapIcon size={20} style={{ marginRight: 8 }} /> Map
                  </ToggleButton>
                </ToggleButtonGroup>
              </Stack>

              <AnimatePresence mode="wait">
                {viewMode === 'grid' ? (
                  <motion.div
                    key="grid-view"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                  >
                    <Grid container spacing={4}>
                      {MOCK_DESTINATIONS.map((dest, index) => (
                        <Grid size={{ xs: 12, md: 6 }} key={dest.id}>
                          <DestinationCard destination={dest} index={index} />
                        </Grid>
                      ))}
                    </Grid>
                  </motion.div>
                ) : (
                  <motion.div
                    key="map-view"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                  >
                    <WorldMapView destinations={MOCK_DESTINATIONS} />
                  </motion.div>
                )}
              </AnimatePresence>

              <Box sx={{ textAlign: 'center', mt: 8 }}>
                <Button
                  variant="outlined"
                  onClick={() => setShowQuiz(true)}
                  sx={{ borderRadius: 3, px: 4, borderColor: COLORS.primary, color: COLORS.primary, fontWeight: 700, textTransform: 'none' }}
                >
                  Retake Preference Quiz
                </Button>
              </Box>
            </motion.div>
          )}
        </AnimatePresence>
      </Container>
    </Box>
  );
}


