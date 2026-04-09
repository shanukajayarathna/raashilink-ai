import React, { useEffect, useState } from 'react';
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
  Chip,
  Dialog,
  DialogContent,
  DialogTitle,
  IconButton,
  Checkbox,
  FormControlLabel,
} from '@mui/material';
import {
  Search,
  TrendingUp,
  Refresh,
  Share,
  EditOutlined,
  AutoAwesome,
  Close,
  CakeOutlined,
  AccessTimeOutlined,
  PlaceOutlined,
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'motion/react';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '@/app/store/store';
import { AppDispatch } from '@/app/store/store';
import { fetchMyChart, calculateCompatibility } from '../store/horoscopeSlice';
import { fetchProfile, updateUser } from '@/features/auth/store/authSlice';
import BirthChartWheel from '../components/BirthChartWheel';
import CompatibilityScores from '../components/CompatibilityScores';
import matchService from '@/features/matchmaking/services/matchService';
import userService from '@/features/profile/services/userService';

const COLORS = {
  primary: '#8B1A2E',
  secondary: '#C9A84C',
  accent: '#1A6B72',
  background: '#FAF7F2',
  textSecondary: '#555555',
};

const formatAccuracyMessage = (missingFields: string[]) => {
  if (!missingFields.length) return null;

  if (missingFields.length === 1 && missingFields[0] === 'exact birth time') {
    return 'Your chart is using an approximate 12:00 birth time because the exact time is missing, so ascendant and house placements may be less accurate.';
  }

  return `Some birth details are still missing (${missingFields.join(', ')}). Any horoscope generated without them may be less accurate.`;
};

const HoroscopeView = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { user } = useSelector((state: RootState) => state.auth);
  const { myChart, compatibility, isLoading, isCalculating, error } = useSelector((state: RootState) => state.horoscope);
  const [selectedMatch, setSelectedMatch] = useState<any>(null);
  const [matches, setMatches] = useState<any[]>([]);
  const [loadingMatches, setLoadingMatches] = useState(true);
  const [editorOpen, setEditorOpen] = useState(false);
  const [birthPlaceOptions, setBirthPlaceOptions] = useState<string[]>([]);
  const [birthPlaceLoading, setBirthPlaceLoading] = useState(false);
  const [isSavingBirthDetails, setIsSavingBirthDetails] = useState(false);
  const [birthFormError, setBirthFormError] = useState<string | null>(null);
  const [birthFeedback, setBirthFeedback] = useState<{ type: 'success' | 'warning'; message: string } | null>(null);
  const [birthForm, setBirthForm] = useState({
    birthDate: '',
    birthTime: '',
    birthPlace: '',
    knowsBirthTime: true,
  });

  const chartSummary = myChart?.summary;
  const chartPlanets = myChart?.planets ?? [];
  const chartPositions = myChart?.positions ?? [];
  const chartMeta = myChart?.meta;

  const storedBirthDate =
    chartMeta?.generatedFrom?.birthDate ||
    user?.birthDate ||
    (user?.birthData?.dateOfBirth ? new Date(user.birthData.dateOfBirth).toISOString().split('T')[0] : '');
  const storedBirthPlace =
    chartMeta?.generatedFrom?.birthPlace || user?.birthPlace || user?.birthData?.placeOfBirth?.city || '';
  const rawStoredBirthTime = chartMeta?.generatedFrom?.birthTime || user?.birthTime || user?.birthData?.timeOfBirth || '';
  const storedKnownBirthTime =
    typeof chartMeta?.generatedFrom?.knownBirthTime === 'boolean'
      ? chartMeta.generatedFrom.knownBirthTime
      : typeof user?.knownBirthTime === 'boolean'
        ? user.knownBirthTime
        : typeof user?.birthData?.knownBirthTime === 'boolean'
          ? user.birthData.knownBirthTime !== false
          : Boolean(rawStoredBirthTime);
  const storedBirthTime = storedKnownBirthTime ? rawStoredBirthTime : '';

  const missingBirthFields: string[] = [];
  if (!storedBirthDate) missingBirthFields.push('birth date');
  if (!storedBirthPlace) missingBirthFields.push('birth place');
  if (!storedKnownBirthTime) missingBirthFields.push('exact birth time');

  const accuracyNotice = chartMeta?.accuracyNote || formatAccuracyMessage(missingBirthFields);
  const hasCriticalBirthDetailsMissing = missingBirthFields.some((field) => field !== 'exact birth time');

  useEffect(() => {
    dispatch(fetchProfile());
  }, [dispatch]);

  useEffect(() => {
    if (!myChart) {
      dispatch(fetchMyChart());
    }
  }, [dispatch, myChart]);

  useEffect(() => {
    setBirthForm({
      birthDate: storedBirthDate,
      birthTime: storedBirthTime,
      birthPlace: storedBirthPlace,
      knowsBirthTime: storedKnownBirthTime,
    });
  }, [storedBirthDate, storedBirthPlace, storedBirthTime, storedKnownBirthTime]);

  useEffect(() => {
    if (!editorOpen) return;

    const query = birthForm.birthPlace.trim();
    if (query.length < 2) {
      setBirthPlaceOptions(query ? [query] : []);
      return;
    }

    const timeoutId = window.setTimeout(async () => {
      setBirthPlaceLoading(true);
      try {
        const suggestions = await userService.searchBirthPlaces(query, 5);
        const labels = suggestions
          .map((item: any) => item.label || item.city || item.name)
          .filter(Boolean);
        setBirthPlaceOptions(Array.from(new Set([query, ...labels])));
      } catch {
        setBirthPlaceOptions(query ? [query] : []);
      } finally {
        setBirthPlaceLoading(false);
      }
    }, 250);

    return () => window.clearTimeout(timeoutId);
  }, [birthForm.birthPlace, editorOpen]);

  useEffect(() => {
    const fetchMatches = async () => {
      setLoadingMatches(true);
      try {
        const matchesRes = await matchService.getRecommendations();
        setMatches(
          (matchesRes.data.items || []).map((match: any) => ({
            id: match.id,
            name: match.name,
            photo: match.img,
            sign: match.moonSign,
          }))
        );
      } catch (err) {
        console.error('Failed to load matches', err);
      } finally {
        setLoadingMatches(false);
      }
    };

    fetchMatches();
  }, []);

  const handleCalculate = async () => {
    if (!selectedMatch || !user) return;
    dispatch(calculateCompatibility({ userAId: String(user._id), userBId: selectedMatch.id }));
  };

  const openEditor = () => {
    setBirthFormError(null);
    setEditorOpen(true);
  };

  const handleSaveBirthDetails = async () => {
    const trimmedBirthPlace = birthForm.birthPlace.trim();

    if (!birthForm.birthDate || !trimmedBirthPlace) {
      setBirthFormError('Birth date and birth place are required to refresh your horoscope.');
      return;
    }

    if (birthForm.knowsBirthTime && !birthForm.birthTime) {
      setBirthFormError('Please enter your birth time or mark it as unknown.');
      return;
    }

    setBirthFormError(null);
    setBirthFeedback(null);
    setIsSavingBirthDetails(true);

    try {
      const updatedProfile = await userService.updateProfile({
        birthDate: birthForm.birthDate,
        birthTime: birthForm.knowsBirthTime ? birthForm.birthTime : '',
        birthPlace: trimmedBirthPlace,
        knownBirthTime: birthForm.knowsBirthTime,
      });

      dispatch(updateUser(updatedProfile));
      await dispatch(fetchMyChart()).unwrap();

      setBirthFeedback({
        type: birthForm.knowsBirthTime ? 'success' : 'warning',
        message: birthForm.knowsBirthTime
          ? 'Birth details saved and your horoscope has been reloaded.'
          : 'Birth details saved and your horoscope has been reloaded using an approximate 12:00 birth time.',
      });
      setEditorOpen(false);
    } catch (saveError: any) {
      setBirthFormError(saveError?.response?.data?.message || saveError?.message || 'Unable to update your birth details right now.');
    } finally {
      setIsSavingBirthDetails(false);
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
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Typography variant="h3" sx={{ fontFamily: 'Playfair Display', fontWeight: 800, color: COLORS.primary, mb: 1 }}>
            Your Vedic Birth Chart
          </Typography>
          <Typography variant="body1" sx={{ color: COLORS.textSecondary }}>
            Calculated from the birth details stored in your RaashiLink profile.
          </Typography>
        </Box>
        <Stack direction="row" spacing={2}>
          <Button
            variant="outlined"
            startIcon={<Refresh />}
            onClick={() => dispatch(fetchMyChart())}
            sx={{ borderRadius: '12px', borderColor: COLORS.secondary, color: COLORS.secondary }}
          >
            Refresh
          </Button>
          <Button variant="contained" startIcon={<Share />} sx={{ borderRadius: '12px', bgcolor: COLORS.primary }}>
            Share Chart
          </Button>
        </Stack>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3, borderRadius: '12px' }}>
          {error}
        </Alert>
      )}

      {birthFeedback && (
        <Alert severity={birthFeedback.type} sx={{ mb: 3, borderRadius: '12px' }}>
          {birthFeedback.message}
        </Alert>
      )}

      {accuracyNotice && (
        <Alert severity={hasCriticalBirthDetailsMissing ? 'info' : 'warning'} sx={{ mb: 3, borderRadius: '12px' }}>
          {accuracyNotice}
        </Alert>
      )}

      <Paper
        sx={{
          p: { xs: 2.5, md: 3 },
          mb: 4,
          borderRadius: '28px',
          background: 'linear-gradient(135deg, rgba(139,26,46,0.05) 0%, rgba(201,168,76,0.18) 100%)',
          border: '1px solid rgba(201,168,76,0.28)',
          boxShadow: '0 14px 36px rgba(139,26,46,0.08)',
        }}
      >
        <Stack direction={{ xs: 'column', md: 'row' }} spacing={3} justifyContent="space-between" alignItems={{ xs: 'flex-start', md: 'center' }}>
          <Box>
            <Typography variant="overline" sx={{ letterSpacing: 1.5, fontWeight: 800, color: COLORS.accent }}>
              Premium accuracy control
            </Typography>
            <Typography variant="h6" sx={{ fontWeight: 800, color: COLORS.primary, mb: 1 }}>
              Edit birth details and reload your horoscope instantly
            </Typography>
            <Typography variant="body2" sx={{ color: COLORS.textSecondary, mb: 2 }}>
              If your birth information changes, update it here and your saved database record plus horoscope chart will refresh together.
            </Typography>
            <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
              <Chip icon={<CakeOutlined />} label={storedBirthDate || 'Birth date needed'} sx={{ bgcolor: 'white' }} />
              <Chip
                icon={<AccessTimeOutlined />}
                label={storedKnownBirthTime ? storedBirthTime || 'Birth time needed' : 'Approximate 12:00 time'}
                sx={{ bgcolor: 'white' }}
              />
              <Chip icon={<PlaceOutlined />} label={storedBirthPlace || 'Birth place needed'} sx={{ bgcolor: 'white' }} />
              {chartMeta?.generatedAt && (
                <Chip
                  icon={<AutoAwesome />}
                  label={`Last refreshed ${new Date(chartMeta.generatedAt).toLocaleDateString('en-LK')}`}
                  sx={{ bgcolor: 'white' }}
                />
              )}
            </Stack>
          </Box>

          <Button
            variant="contained"
            startIcon={<EditOutlined />}
            onClick={openEditor}
            sx={{
              borderRadius: '14px',
              px: 2.5,
              py: 1.2,
              bgcolor: COLORS.primary,
              boxShadow: '0 10px 24px rgba(139,26,46,0.2)',
            }}
          >
            Edit & Reload
          </Button>
        </Stack>
      </Paper>

      {!isLoading && !chartSummary && (
        <Paper sx={{ p: 4, mb: 4, borderRadius: '24px', textAlign: 'center', bgcolor: 'white' }}>
          <Typography variant="h6" sx={{ fontWeight: 800, color: COLORS.primary, mb: 1 }}>
            Your horoscope needs complete birth details
          </Typography>
          <Typography variant="body2" sx={{ color: COLORS.textSecondary, mb: 3 }}>
            Add your birth date and birth place here. If your exact time is unknown, we can still generate a chart, but the results will be marked as less accurate.
          </Typography>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} justifyContent="center">
            <Button variant="contained" onClick={openEditor} sx={{ borderRadius: '12px', bgcolor: COLORS.primary }}>
              Add Birth Details
            </Button>
            <Button variant="outlined" href="/edit-profile" sx={{ borderRadius: '12px', borderColor: COLORS.secondary, color: COLORS.secondary }}>
              Open Full Profile
            </Button>
          </Stack>
        </Paper>
      )}

      {chartSummary && (
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
              <BirthChartWheel planets={chartPlanets} ascendant={chartSummary?.ascendant || 'Pending'} />

              <Grid container spacing={2} sx={{ mt: 4 }}>
                {[
                  { label: 'Moon Sign (Rashi)', value: chartSummary?.moonSign || 'Pending' },
                  { label: 'Nakshatra', value: chartSummary?.nakshatra || 'Pending' },
                  { label: 'Ascendant', value: chartSummary?.ascendant || 'Pending' },
                  { label: 'Sun Sign', value: chartSummary?.sunSign || 'Pending' },
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
                  {chartPositions.map((position: any, index: number) => (
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
                    loading={loadingMatches}
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
                          endAdornment: (
                            <>
                              {loadingMatches ? <CircularProgress size={18} sx={{ mr: 1 }} /> : null}
                              {params.InputProps.endAdornment}
                            </>
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

      <Dialog open={editorOpen} onClose={() => !isSavingBirthDetails && setEditorOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle sx={{ pb: 1 }}>
          <Stack direction="row" justifyContent="space-between" alignItems="flex-start" spacing={2}>
            <Box>
              <Typography variant="overline" sx={{ fontWeight: 800, letterSpacing: 1.5, color: COLORS.accent }}>
                Horoscope update
              </Typography>
              <Typography variant="h5" sx={{ fontWeight: 800, color: COLORS.primary }}>
                Edit birth details
              </Typography>
            </Box>
            <IconButton onClick={() => setEditorOpen(false)} disabled={isSavingBirthDetails}>
              <Close />
            </IconButton>
          </Stack>
        </DialogTitle>

        <DialogContent sx={{ pb: 3 }}>
          <Paper
            sx={{
              p: 2,
              mb: 3,
              borderRadius: '18px',
              background: 'linear-gradient(135deg, rgba(26,107,114,0.08) 0%, rgba(201,168,76,0.18) 100%)',
            }}
          >
            <Typography variant="body2" sx={{ color: 'text.primary', fontWeight: 600 }}>
              Save your updated birth details here and the horoscope section will reload with the latest chart.
            </Typography>
            <Typography variant="caption" sx={{ display: 'block', mt: 0.75, color: COLORS.textSecondary }}>
              If the exact birth time is unknown, we will still generate the chart using an approximate 12:00 PM time and show an accuracy notice.
            </Typography>
          </Paper>

          {birthFormError && (
            <Alert severity="error" sx={{ mb: 2, borderRadius: '12px' }}>
              {birthFormError}
            </Alert>
          )}

          <Stack spacing={2.5}>
            <TextField
              label="Birth date"
              type="date"
              value={birthForm.birthDate}
              onChange={(event) => setBirthForm((current) => ({ ...current, birthDate: event.target.value }))}
              InputLabelProps={{ shrink: true }}
              fullWidth
            />

            <FormControlLabel
              control={
                <Checkbox
                  checked={!birthForm.knowsBirthTime}
                  onChange={(event) =>
                    setBirthForm((current) => ({
                      ...current,
                      knowsBirthTime: !event.target.checked,
                      birthTime: event.target.checked ? '' : current.birthTime,
                    }))
                  }
                  sx={{ color: COLORS.primary }}
                />
              }
              label="I don't know my exact birth time"
            />

            <TextField
              label="Birth time"
              type="time"
              value={birthForm.birthTime}
              onChange={(event) => setBirthForm((current) => ({ ...current, birthTime: event.target.value }))}
              InputLabelProps={{ shrink: true }}
              disabled={!birthForm.knowsBirthTime}
              helperText={
                birthForm.knowsBirthTime
                  ? 'Enter the time as accurately as possible for the best horoscope.'
                  : 'We will use 12:00 PM as an approximation, so some chart details may be less accurate.'
              }
              fullWidth
            />

            <Autocomplete
              freeSolo
              options={birthPlaceOptions}
              inputValue={birthForm.birthPlace}
              onInputChange={(_, newValue) => setBirthForm((current) => ({ ...current, birthPlace: newValue }))}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Birth place"
                  placeholder="Start typing a Sri Lankan town or village"
                  helperText="Top OpenStreetMap suggestions will appear while you type."
                  InputProps={{
                    ...params.InputProps,
                    endAdornment: (
                      <>
                        {birthPlaceLoading ? <CircularProgress size={18} sx={{ mr: 1 }} /> : null}
                        {params.InputProps.endAdornment}
                      </>
                    ),
                  }}
                />
              )}
            />

            <Stack direction={{ xs: 'column-reverse', sm: 'row' }} spacing={1.5} justifyContent="flex-end">
              <Button variant="text" onClick={() => setEditorOpen(false)} disabled={isSavingBirthDetails}>
                Cancel
              </Button>
              <Button
                variant="contained"
                onClick={handleSaveBirthDetails}
                disabled={isSavingBirthDetails}
                sx={{ borderRadius: '12px', bgcolor: COLORS.primary }}
              >
                {isSavingBirthDetails ? <CircularProgress size={22} color="inherit" /> : 'Save & Reload Horoscope'}
              </Button>
            </Stack>
          </Stack>
        </DialogContent>
      </Dialog>

      <AnimatePresence>
        {compatibility?.dimensions?.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 40 }} transition={{ duration: 0.8 }}>
            <CompatibilityScores
              overallScore={compatibility.overallScore}
              dimensions={compatibility.dimensions}
              userA={compatibility.userA || { name: user?.name || 'You' }}
              userB={compatibility.userB || { name: 'Match' }}
              explanation={compatibility.explanation}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </Box>
  );
};

export default HoroscopeView;
