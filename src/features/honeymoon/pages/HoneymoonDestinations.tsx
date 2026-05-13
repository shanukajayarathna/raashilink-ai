import React, { useState, useEffect } from 'react';
import {
  Box,
  Backdrop,
  Container,
  Typography,
  Stack,
  Grid,
  Paper,
  Button,
  Chip,
  alpha,
  useTheme,
  useMediaQuery,
  Card,
  CardContent,
  ToggleButtonGroup,
  ToggleButton,
  Alert,
  CircularProgress,
} from '@mui/material';
import {
  Sparkles,
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
import { useNavigate } from 'react-router-dom';
import honeymoonService from '../services/honeymoonService';
import DestinationCard from '../components/DestinationCard';
import WorldMapView from '../components/WorldMapView';
import { useSelector } from 'react-redux';
import { RootState } from '@/app/store/store';
import weddingService from '@/features/wedding/services/weddingService';
import { connectSocket } from '@/shared/hooks/useRealtimeUpdates';

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
  { id: 'budget', title: 'Budget', range: 'LKR 100,000 - 250,000', icon: <Wallet size={24} /> },
  { id: 'mid', title: 'Mid-range', range: 'LKR 250,000 - 500,000', icon: <Wallet size={24} /> },
  { id: 'luxury', title: 'Luxury', range: 'LKR 500,000+', icon: <Sparkles size={24} /> },
];

const DURATIONS = [
  { id: 'short', title: 'Long weekend', range: '3-4 days' },
  { id: 'week', title: 'One week', range: '7 days' },
  { id: 'long', title: 'Two weeks', range: '14 days' },
];

const FALLBACK_DESTINATION_IMAGE = 'https://picsum.photos/seed/honeymoon-default/800/600';

function mapDestinationType(activityTags: string[] = []): 'beach' | 'nature' | 'culture' {
  if (activityTags.some((tag) => /beach|island|sea|surf|swim/i.test(tag))) return 'beach';
  if (activityTags.some((tag) => /mountain|nature|forest|wildlife|hike|adventure/i.test(tag))) return 'nature';
  return 'culture';
}

function mapDestinationCard(destination: any, index: number) {
  const activityTags = Array.isArray(destination?.activityTags) ? destination.activityTags.filter(Boolean) : [];
  const highlights = Array.isArray(destination?.highlights) ? destination.highlights : [];
  const type = mapDestinationType(activityTags);
  const priceRange = destination?.priceRangeLKR || { min: 150000, max: 300000 };
  const avgPrice = Math.floor((priceRange.min + priceRange.max) / 2);

  return {
    id: String(destination?._id || destination?.id || index + 1),
    name: destination?.region || destination?.country || 'Romantic Escape',
    region: destination?.region || 'Scenic Region',
    country: destination?.country || 'Sri Lanka',
    image: destination?.image || FALLBACK_DESTINATION_IMAGE,
    tags: [
      ...activityTags.slice(0, 2).map((tag: string) => tag.replace(/[-_]/g, ' ')),
      destination?.budgetTier || 'curated',
    ],
    budget: avgPrice,
    bestSeason: destination?.bestSeason || 'All year',
    description: destination?.description || 'A romantic getaway curated for couples.',
    matchScore: Math.max(72, 96 - index * 4),
    highlights: highlights.slice(0, 4).map((label: string) => ({ icon: 'Sparkles', label })),
    contactPhone: destination?.contactPhone || '',
    contactEmail: destination?.contactEmail || '',
    x: 18 + ((index * 17) % 62),
    y: 22 + ((index * 11) % 46),
    type,
  };
}

export default function HoneymoonDestinations() {
  const navigate = useNavigate();
  const [showQuiz, setShowQuiz] = useState(true);
  const [viewMode, setViewMode] = useState<'grid' | 'map'>('grid');
  const [loading, setLoading] = useState(false);
  const [destinations, setDestinations] = useState<any[]>([]);
  const [preferences, setPreferences] = useState({
    vibe: '',
    budget: '',
    duration: '',
  });
  const [planningAccessGranted, setPlanningAccessGranted] = useState(false);
  const [planningCheckLoading, setPlanningCheckLoading] = useState(true);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const { token } = useSelector((state: RootState) => state.auth);

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

  const handleGetRecommendations = async () => {
    if (!preferences.vibe || !preferences.budget || !preferences.duration) return;
    setLoading(true);

    try {
      const budgetTier = preferences.budget === 'mid' ? 'mid-range' : preferences.budget;
      const response = await honeymoonService.getDestinations({
        country: 'Sri Lanka',
        activity: preferences.vibe,
        budgetTier,
      });

      const items = Array.isArray(response?.data?.items) ? response.data.items : [];
      setDestinations(items.map((item: any, index: number) => mapDestinationCard(item, index)));
      setShowQuiz(false);
    } catch (err) {
      console.error('Failed to load honeymoon recommendations', err);
      setDestinations([]);
      setShowQuiz(false);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ bgcolor: COLORS.cream, minHeight: '100vh', pt: 6, pb: 8, position: 'relative' }}>
      <Box>
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
                <Typography variant="h6" sx={{ color: COLORS.textSecondary, maxWidth: 600, mx: 'auto', mb: 3 }}>
                  Explore romantic destinations in Sri Lanka. Answer a few quick questions and we will suggest the best spots for your trip.
                </Typography>
                <Chip 
                  label="Optional Feature" 
                  size="small"
                  sx={{ bgcolor: alpha(COLORS.secondary, 0.1), color: COLORS.secondary, fontWeight: 700 }}
                />
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
                    {loading ? 'Curating...' : 'Show Recommendations'}
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
                  <Button
                    startIcon={<ArrowRight size={18} style={{ transform: 'rotate(180deg)' }} />}
                    onClick={() => setShowQuiz(true)}
                    sx={{ mb: 2, color: COLORS.primary, fontWeight: 700, textTransform: 'none', p: 0 }}
                  >
                    Back to preferences
                  </Button>
                  <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 1 }}>
                    <Typography variant="h3" sx={{ fontWeight: 900, fontFamily: 'Playfair Display', color: COLORS.primary }}>
                      Top Picks for You
                    </Typography>
                    <Chip
                      icon={<Sparkles size={14} color="white" />}
                      label="Sri Lanka Picks"
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
                      {destinations.map((dest, index) => (
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
                    <WorldMapView destinations={destinations} />
                  </motion.div>
                )}
              </AnimatePresence>

              <Box sx={{ textAlign: 'center', mt: 8 }}>
                <Button
                  variant="outlined"
                  onClick={() => setShowQuiz(true)}
                  sx={{ borderRadius: 3, px: 4, borderColor: COLORS.primary, color: COLORS.primary, fontWeight: 700, textTransform: 'none' }}
                >
                  ← Back to preferences
                </Button>
              </Box>
            </motion.div>
          )}
        </AnimatePresence>
      </Container>

      </Box>

      <Backdrop
        open={loading}
        sx={{
          zIndex: (theme) => theme.zIndex.modal + 2,
          backdropFilter: 'blur(5px)',
          backgroundColor: 'rgba(20,20,20,0.22)',
          color: '#fff',
          flexDirection: 'column',
          gap: 1,
        }}
      >
        <CircularProgress color="inherit" />
        <Typography variant="body2" sx={{ fontWeight: 600 }}>Curating honeymoon options...</Typography>
      </Backdrop>
    </Box>
  );
}


