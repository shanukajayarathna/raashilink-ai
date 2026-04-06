import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Grid,
  Paper,
  Button,
  TextField,
  Autocomplete,
  InputAdornment,
  CircularProgress,
  Skeleton,
  Stack,
  Divider,
  Alert,
} from '@mui/material';
import { Search, TrendingUp, Home, People as Users, InfoOutlined, Refresh, Share } from '@mui/icons-material';
import { motion, AnimatePresence } from 'motion/react';
import { useSelector } from 'react-redux';
import { RootState } from '@/app/store/store';
import BirthChartWheel from '../components/BirthChartWheel';
import CompatibilityScores from '../components/CompatibilityScores';
import horoscopeService from '../services/horoscopeService';
import matchService from '@/features/matchmaking/services/matchService';

const COLORS = {
  primary: '#8B1A2E',
  secondary: '#C9A84C',
  accent: '#1A6B72',
  background: '#FAF7F2',
  textSecondary: '#555555',
};

const HoroscopeView = () => {
  const { user } = useSelector((state: RootState) => state.auth);
  const [isLoading, setIsLoading] = useState(true);
  const [isCalculating, setIsCalculating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [chartData, setChartData] = useState<any>(null);
  const [selectedMatch, setSelectedMatch] = useState<any>(null);
  const [compatibilityResult, setCompatibilityResult] = useState<any>(null);
  const [matches, setMatches] = useState<any[]>([]);

  const fetchData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [chartRes, matchesRes] = await Promise.all([
        horoscopeService.getMyChart(),
        matchService.getRecommendations(),
      ]);

      setChartData(chartRes.data);
      setMatches((matchesRes.data.items || []).map((match: any) => ({
        id: match.id,
        name: match.name,
        photo: match.img,
        sign: match.moonSign,
      })));
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load horoscope data. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCalculate = async () => {
    if (!selectedMatch) return;

    setIsCalculating(true);
    setCompatibilityResult(null);
    setError(null);

    try {
      const response = await horoscopeService.calculateCompatibility(selectedMatch.id);
      setCompatibilityResult(response.data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Calculation failed. Please try again.');
    } finally {
      setIsCalculating(false);
    }
  };

  if (isLoading) {
    return (
      <Box sx={{ p: 4 }}>
        <Skeleton variant="text" width={400} height={60} sx={{ mb: 4 }} />
        <Grid container spacing={4}>
          <Grid size={{ xs: 12, md: 6 }}>
            <Skeleton variant="circular" width={400} height={400} sx={{ mx: 'auto' }} />
          </Grid>
          <Grid size={{ xs: 12, md: 6 }}>
            <Skeleton variant="rectangular" height={400} sx={{ borderRadius: '24px' }} />
          </Grid>
        </Grid>
      </Box>
    );
  }

  return (
    <Box sx={{ p: { xs: 2, md: 4 }, maxWidth: '1200px', mx: 'auto' }}>
      <Box sx={{ mb: 6, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Typography variant="h3" sx={{ fontFamily: 'Playfair Display', fontWeight: 800, color: COLORS.primary, mb: 1 }}>
            Your Vedic Birth Chart
          </Typography>
          <Typography variant="body1" sx={{ color: COLORS.textSecondary }}>
            Calculated from the birth details stored in your RaashiLink profile.
          </Typography>
        </Box>
        <Stack direction="row" spacing={2}>
          <Button variant="outlined" startIcon={<Refresh />} onClick={fetchData} sx={{ borderRadius: '12px', borderColor: COLORS.secondary, color: COLORS.secondary }}>
            Refresh
          </Button>
          <Button variant="contained" startIcon={<Share />} sx={{ borderRadius: '12px', bgcolor: COLORS.primary }}>
            Share Chart
          </Button>
        </Stack>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 4, borderRadius: '12px' }}>{error}</Alert>}

      {chartData && (
        <Grid container spacing={6}>
          <Grid size={{ xs: 12, lg: 6 }}>
            <Paper
              sx={{
                p: 4,
                borderRadius: '40px',
                bgcolor: 'white',
                boxShadow: '0 10px 40px rgba(139,26,46,0.05)',
                border: '1px solid',
                borderColor: COLORS.background,
              }}
            >
              <BirthChartWheel planets={chartData.planets} ascendant={chartData.summary.ascendant} />

              <Grid container spacing={2} sx={{ mt: 4 }}>
                {[
                  { label: 'Moon Sign (Rashi)', value: chartData.summary.moonSign },
                  { label: 'Nakshatra', value: chartData.summary.nakshatra },
                  { label: 'Ascendant', value: chartData.summary.ascendant },
                  { label: 'Sun Sign', value: chartData.summary.sunSign },
                ].map((pill) => (
                  <Grid size={{ xs: 6 }} key={pill.label}>
                    <Box sx={{ p: 2, bgcolor: COLORS.background, borderRadius: '16px', textAlign: 'center' }}>
                      <Typography variant="caption" sx={{ color: COLORS.textSecondary, fontWeight: 700, display: 'block', mb: 0.5 }}>
                        {pill.label}
                      </Typography>
                      <Typography variant="body1" sx={{ fontWeight: 800, color: COLORS.primary }}>
                        {pill.value}
                      </Typography>
                    </Box>
                  </Grid>
                ))}
              </Grid>

              <Box sx={{ mt: 4 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 800, color: 'text.primary', mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                  <TrendingUp sx={{ fontSize: 18, color: COLORS.accent }} /> Planetary Positions
                </Typography>
                <Box sx={{ maxHeight: 200, overflowY: 'auto', pr: 1 }}>
                  {chartData.positions.map((position: any, index: number) => (
                    <Box key={index} sx={{ display: 'flex', justifyContent: 'space-between', py: 1, borderBottom: `1px solid ${COLORS.background}` }}>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>{position.planet}</Typography>
                      <Typography variant="body2" sx={{ color: COLORS.textSecondary }}>
                        {position.sign} | {position.house} | {position.degree}
                      </Typography>
                    </Box>
                  ))}
                </Box>
              </Box>
            </Paper>
          </Grid>

          <Grid size={{ xs: 12, lg: 6 }}>
            <Paper
              sx={{
                p: 4,
                borderRadius: '40px',
                bgcolor: 'white',
                boxShadow: '0 10px 40px rgba(139,26,46,0.05)',
                border: '1px solid',
                borderColor: COLORS.background,
                height: '100%',
              }}
            >
              <Typography variant="h5" sx={{ fontFamily: 'Playfair Display', fontWeight: 700, mb: 4, color: COLORS.primary }}>
                Check Compatibility With
              </Typography>

              <Stack spacing={4}>
                <Box>
                  <Typography variant="body2" sx={{ fontWeight: 700, mb: 1, color: COLORS.textSecondary }}>
                    Select from your matches
                  </Typography>
                  <Autocomplete
                    options={matches}
                    getOptionLabel={(option) => option.name}
                    onChange={(_, newValue) => setSelectedMatch(newValue)}
                    renderOption={(props, option) => (
                      <Box component="li" {...props} sx={{ display: 'flex', gap: 2, p: 1 }}>
                        <Box component="img" src={option.photo} sx={{ width: 40, height: 40, borderRadius: '50%' }} />
                        <Box>
                          <Typography variant="body2" sx={{ fontWeight: 700 }}>{option.name}</Typography>
                          <Typography variant="caption" sx={{ color: COLORS.textSecondary }}>{option.sign} Moon Sign</Typography>
                        </Box>
                      </Box>
                    )}
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        placeholder="Search partner name..."
                        InputProps={{
                          ...params.InputProps,
                          startAdornment: (
                            <InputAdornment position="start">
                              <Search sx={{ color: COLORS.textSecondary }} />
                            </InputAdornment>
                          ),
                          sx: { borderRadius: '16px' },
                        }}
                      />
                    )}
                  />
                </Box>

                <Divider />

                <Button
                  fullWidth
                  variant="contained"
                  size="large"
                  onClick={handleCalculate}
                  disabled={!selectedMatch || isCalculating}
                  sx={{
                    py: 2,
                    borderRadius: '16px',
                    bgcolor: COLORS.secondary,
                    color: COLORS.primary,
                    fontWeight: 800,
                    '&:hover': { bgcolor: '#B89740' },
                    boxShadow: '0 8px 24px rgba(201,168,76,0.3)',
                  }}
                >
                  {isCalculating ? <CircularProgress size={24} color="inherit" /> : 'Calculate Compatibility'}
                </Button>
              </Stack>
            </Paper>
          </Grid>
        </Grid>
      )}

      <AnimatePresence>
        {compatibilityResult && (
          <motion.div initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 40 }} transition={{ duration: 0.8 }}>
            <CompatibilityScores
              overallScore={compatibilityResult.overallScore}
              dimensions={compatibilityResult.dimensions}
              userA={compatibilityResult.userA || { name: user?.name || 'You' }}
              userB={compatibilityResult.userB}
            />
          </motion.div>
        )}
      </AnimatePresence>

      <Box sx={{ mt: 8, p: 4, bgcolor: 'white', borderRadius: '24px', border: '1px solid', borderColor: COLORS.background, textAlign: 'center' }}>
        <Typography variant="body2" sx={{ color: COLORS.textSecondary, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
          <InfoOutlined sx={{ fontSize: 16 }} />
          Our compatibility engine combines Ashtakoota Milan with personality and lifestyle analysis for a full matchmaking score.
        </Typography>
      </Box>
    </Box>
  );
};

export default HoroscopeView;
