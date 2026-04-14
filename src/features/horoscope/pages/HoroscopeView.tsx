import React, { useEffect, useRef, useState } from 'react';
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
  alpha,
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
import { setLanguage } from '@/app/store/uiSlice';
import BirthChartWheel from '../components/BirthChartWheel';
import CompatibilityScores from '../components/CompatibilityScores';
import matchService from '@/features/matchmaking/services/matchService';
import userService from '@/features/profile/services/userService';
import {
  HOROSCOPE_LANGUAGE_OPTIONS,
  HOROSCOPE_TEXT,
  LANGUAGE_FONT_FAMILY,
  type HoroscopeLanguage,
  formatNakshatraPada,
  translateHoroscopeValue,
  translateHouseLabel,
  translatePlanetName,
  translateZodiacSign,
} from '../utils/horoscopeLocalization';

const COLORS = {
  primary: '#8B1A2E',
  secondary: '#C9A84C',
  accent: '#1A6B72',
  background: '#FAF7F2',
  textSecondary: '#555555',
};

const formatAccuracyMessage = (missingFields: string[], language: HoroscopeLanguage) => {
  if (!missingFields.length) return null;

  const fieldLabels = {
    en: {
      'birth date': 'birth date',
      'birth place': 'birth place',
      'exact birth time': 'exact birth time',
    },
    si: {
      'birth date': 'උපන් දිනය',
      'birth place': 'උපන් ස්ථානය',
      'exact birth time': 'නිවැරදි උපන් වේලාව',
    },
    ta: {
      'birth date': 'பிறந்த தேதி',
      'birth place': 'பிறந்த இடம்',
      'exact birth time': 'சரியான பிறந்த நேரம்',
    },
  } as const;

  const localizedMissing = missingFields.map((field) => fieldLabels[language][field as keyof typeof fieldLabels.en] || field);

  if (missingFields.length === 1 && missingFields[0] === 'exact birth time') {
    return {
      en: 'Your chart is using an approximate 12:00 birth time because the exact time is missing, so ascendant and house placements may be less accurate.',
      si: 'නිවැරදි උපන් වේලාව නොමැති නිසා ඔබගේ කේන්දරය අනුමාන 12:00 වේලාවක් භාවිතා කරයි. ඒ නිසා ලග්නය සහ භාව ස්ථාන අඩු නිරවද්‍ය විය හැක.',
      ta: 'சரியான பிறந்த நேரம் இல்லை என்பதால் உங்கள் ஜாதகம் கணிக்கப்பட்ட 12:00 நேரத்தை பயன்படுத்துகிறது. அதனால் லக்னமும் பாவ நிலைகளும் குறைந்த துல்லியமாக இருக்கலாம்.',
    }[language];
  }

  return {
    en: `Some birth details are still missing (${localizedMissing.join(', ')}). Any horoscope generated without them may be less accurate.`,
    si: `සමහර උපන් විස්තර තවමත් හිඟයි (${localizedMissing.join(', ')}). ඒවා නොමැතිව ගණනය කරන හෝරාව අඩු නිරවද්‍ය විය හැක.`,
    ta: `சில பிறப்பு விவரங்கள் இன்னும் இல்லை (${localizedMissing.join(', ')}). அவற்றின்றி உருவாகும் ஜாதகம் குறைந்த துல்லியமாக இருக்கலாம்.`,
  }[language];
};

const toSafeDateInputValue = (value: unknown) => {
  if (!value) return '';

  const parsed = value instanceof Date ? value : new Date(String(value));
  return Number.isNaN(parsed.getTime()) ? '' : parsed.toISOString().split('T')[0];
};

const formatSafeDisplayDate = (value: unknown, locale = 'en-LK') => {
  if (!value) return null;

  const parsed = value instanceof Date ? value : new Date(String(value));
  return Number.isNaN(parsed.getTime()) ? null : parsed.toLocaleDateString(locale);
};

const HoroscopeView = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { user } = useSelector((state: RootState) => state.auth);
  const language = useSelector((state: RootState) => state.ui.language);
  const texts = HOROSCOPE_TEXT[language];
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
  const lastAutoFetchKeyRef = useRef('');

  const chartSummary = myChart?.summary;
  const chartDetails = myChart?.details;
  const chartPlanets = myChart?.planets ?? [];
  const chartPositions = myChart?.positions ?? [];
  const chartHouses = myChart?.houses ?? [];
  const readingHighlights = myChart?.insights ?? [];
  const profileHighlights = myChart?.highlights;
  const luckyColors = profileHighlights?.luckyColors ?? [];
  const auspiciousDays = profileHighlights?.auspiciousDays ?? [];
  const favorablePartners = profileHighlights?.favorablePartners ?? [];
  const profileFacts = profileHighlights?.profileFacts ?? [];
  const chartMeta = myChart?.meta;

  const storedBirthDate =
    chartMeta?.generatedFrom?.birthDate ||
    toSafeDateInputValue(user?.birthDate) ||
    toSafeDateInputValue(user?.birthData?.dateOfBirth);
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

  const accuracyNotice = formatAccuracyMessage(missingBirthFields, language);
  const hasCriticalBirthDetailsMissing = missingBirthFields.some((field) => field !== 'exact birth time');
  const needsProfileRefresh = !user?.birthData?.dateOfBirth || !user?.birthData?.placeOfBirth?.city;
  const waitingForStructuredBirthData = Boolean(
    needsProfileRefresh && (toSafeDateInputValue(user?.birthDate) || String(user?.birthPlace || '').trim())
  );
  const generatedFrom = chartMeta?.generatedFrom;
  const normalizedStoredBirthPlace = String(storedBirthPlace || '').trim().toLowerCase();
  const normalizedGeneratedBirthPlace = String(generatedFrom?.birthPlace || '').trim().toLowerCase();
  const chartProfileSignature = [
    String(user?._id || ''),
    String(storedBirthDate || ''),
    normalizedStoredBirthPlace,
    storedKnownBirthTime ? 'known' : 'unknown',
    storedKnownBirthTime ? String(storedBirthTime || '') : '',
  ].join('|');
  const chartNeedsRefresh = Boolean(
    myChart && (
      !generatedFrom ||
      String(chartMeta?.userId || '') !== String(user?._id || '') ||
      (generatedFrom.birthDate || '') !== (storedBirthDate || '') ||
      Number(chartMeta?.calculationVersion || 1) < 3 ||
      normalizedGeneratedBirthPlace !== normalizedStoredBirthPlace ||
      Boolean(generatedFrom.knownBirthTime !== false) !== Boolean(storedKnownBirthTime) ||
      (storedKnownBirthTime && (generatedFrom.birthTime || '') !== (storedBirthTime || ''))
    )
  );
  const isChartDataSettling = Boolean(
    waitingForStructuredBirthData ||
    (!hasCriticalBirthDetailsMissing && !myChart && !error)
  );

  useEffect(() => {
    if (needsProfileRefresh) {
      dispatch(fetchProfile());
    }
  }, [dispatch, user?.birthData?.dateOfBirth, user?.birthData?.placeOfBirth?.city]);

  useEffect(() => {
    if (waitingForStructuredBirthData || hasCriticalBirthDetailsMissing) {
      return;
    }

    const shouldForceRefresh = Boolean(myChart && chartNeedsRefresh);
    const shouldFetch = !myChart || shouldForceRefresh;

    if (!shouldFetch) {
      return;
    }

    const autoFetchKey = `${chartProfileSignature}|${shouldForceRefresh ? 'force' : 'normal'}`;
    if (lastAutoFetchKeyRef.current === autoFetchKey) {
      return;
    }

    lastAutoFetchKeyRef.current = autoFetchKey;
    dispatch(fetchMyChart({ force: shouldForceRefresh }));
  }, [dispatch, myChart, hasCriticalBirthDetailsMissing, chartNeedsRefresh, waitingForStructuredBirthData, chartProfileSignature]);

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

  const handleLanguageChange = (nextLanguage: HoroscopeLanguage) => {
    if (nextLanguage !== language) {
      dispatch(setLanguage(nextLanguage));
    }
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
      await dispatch(fetchMyChart({ force: true })).unwrap();

      setBirthFeedback({
        type: birthForm.knowsBirthTime ? 'success' : 'warning',
        message: birthForm.knowsBirthTime ? texts.refreshSuccess : texts.refreshApproximate,
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
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 2 }}>
        <Box sx={{ flex: '1 1 420px', minWidth: 0, minHeight: { xs: 'auto', md: 88 } }}>
          <Typography variant="h3" sx={{ fontFamily: 'Playfair Display', fontWeight: 800, color: COLORS.primary, mb: 1 }}>
            {texts.birthChartTitle}
          </Typography>
          <Typography variant="body1" sx={{ color: COLORS.textSecondary, fontFamily: LANGUAGE_FONT_FAMILY[language] }}>
            {texts.calculatedFromProfile}
          </Typography>
        </Box>
        <Stack
          spacing={1.5}
          alignItems={{ xs: 'stretch', md: 'flex-end' }}
          sx={{ width: { xs: '100%', md: 'auto' }, minWidth: { md: 460 }, flexShrink: 0 }}
        >
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
            <Button
              variant="outlined"
              startIcon={<Refresh />}
              onClick={() => dispatch(fetchMyChart({ force: true }))}
              sx={{
                borderRadius: '12px',
                borderColor: COLORS.secondary,
                color: COLORS.secondary,
                fontFamily: LANGUAGE_FONT_FAMILY[language],
                width: { xs: '100%', sm: 220 },
                justifyContent: 'center',
                whiteSpace: 'nowrap',
              }}
            >
              {texts.refresh}
            </Button>
            <Button
              variant="contained"
              startIcon={<Share />}
              sx={{
                borderRadius: '12px',
                bgcolor: COLORS.primary,
                fontFamily: LANGUAGE_FONT_FAMILY[language],
                width: { xs: '100%', sm: 220 },
                justifyContent: 'center',
                whiteSpace: 'nowrap',
              }}
            >
              {texts.shareChart}
            </Button>
          </Stack>
          <Stack
            direction="row"
            spacing={1}
            alignItems="center"
            justifyContent={{ xs: 'flex-start', md: 'flex-end' }}
            sx={{
              flexWrap: 'nowrap',
              overflowX: 'auto',
              pb: 0.5,
              '&::-webkit-scrollbar': { display: 'none' },
            }}
          >
            <Typography variant="caption" sx={{ color: COLORS.textSecondary, fontWeight: 700, mr: 0.5, fontFamily: LANGUAGE_FONT_FAMILY[language], flexShrink: 0 }}>
              {texts.language}
            </Typography>
            {HOROSCOPE_LANGUAGE_OPTIONS.map((option) => (
              <Chip
                key={option.value}
                label={option.label}
                clickable
                onClick={() => handleLanguageChange(option.value)}
                color={language === option.value ? 'primary' : 'default'}
                variant={language === option.value ? 'filled' : 'outlined'}
                sx={{
                  fontWeight: 700,
                  fontFamily: LANGUAGE_FONT_FAMILY[option.value],
                  minWidth: 82,
                  height: 34,
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              />
            ))}
          </Stack>
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
            <Typography variant="overline" sx={{ letterSpacing: 1.5, fontWeight: 800, color: COLORS.accent, fontFamily: LANGUAGE_FONT_FAMILY[language] }}>
              {texts.premiumAccuracyControl}
            </Typography>
            <Typography variant="h6" sx={{ fontWeight: 800, color: COLORS.primary, mb: 1, fontFamily: LANGUAGE_FONT_FAMILY[language] }}>
              {texts.editBirthDetailsReload}
            </Typography>
            <Typography variant="body2" sx={{ color: COLORS.textSecondary, mb: 2, fontFamily: LANGUAGE_FONT_FAMILY[language] }}>
              {texts.editBirthDetailsDescription}
            </Typography>
            <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
              <Chip icon={<CakeOutlined />} label={storedBirthDate || texts.birthDateNeeded} sx={{ bgcolor: 'white', fontFamily: LANGUAGE_FONT_FAMILY[language] }} />
              <Chip
                icon={<AccessTimeOutlined />}
                label={storedKnownBirthTime ? storedBirthTime || texts.birthTimeNeeded : texts.approximateTimeLabel}
                sx={{ bgcolor: 'white', fontFamily: LANGUAGE_FONT_FAMILY[language] }}
              />
              <Chip icon={<PlaceOutlined />} label={storedBirthPlace || texts.birthPlaceNeeded} sx={{ bgcolor: 'white', fontFamily: LANGUAGE_FONT_FAMILY[language] }} />
              {chartMeta?.generatedAt && (
                <Chip
                  icon={<AutoAwesome />}
                  label={`${texts.lastRefreshed} ${formatSafeDisplayDate(chartMeta.generatedAt, 'en-LK') || 'recently'}`}
                  sx={{ bgcolor: 'white', fontFamily: LANGUAGE_FONT_FAMILY[language] }}
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
              width: { xs: '100%', sm: 220 },
              whiteSpace: 'nowrap',
              bgcolor: COLORS.primary,
              boxShadow: '0 10px 24px rgba(139,26,46,0.2)',
            }}
          >
            {texts.editReload}
          </Button>
        </Stack>
      </Paper>

      {!isLoading && !isChartDataSettling && !chartSummary && (
        <Paper sx={{ p: 4, mb: 4, borderRadius: '24px', textAlign: 'center', bgcolor: 'white' }}>
          <Typography variant="h6" sx={{ fontWeight: 800, color: COLORS.primary, mb: 1, fontFamily: LANGUAGE_FONT_FAMILY[language] }}>
            {texts.horoscopeNeedsDetails}
          </Typography>
          <Typography variant="body2" sx={{ color: COLORS.textSecondary, mb: 3, fontFamily: LANGUAGE_FONT_FAMILY[language] }}>
            {texts.horoscopeNeedsDetailsDescription}
          </Typography>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} justifyContent="center">
            <Button variant="contained" onClick={openEditor} sx={{ borderRadius: '12px', bgcolor: COLORS.primary, fontFamily: LANGUAGE_FONT_FAMILY[language] }}>
              {texts.addBirthDetails}
            </Button>
            <Button variant="outlined" href="/edit-profile" sx={{ borderRadius: '12px', borderColor: COLORS.secondary, color: COLORS.secondary, fontFamily: LANGUAGE_FONT_FAMILY[language] }}>
              {texts.openFullProfile}
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
              <BirthChartWheel planets={chartPlanets} ascendant={chartSummary?.ascendant || texts.pending} language={language} />

              <Grid container spacing={2} sx={{ mt: 4 }}>
                {[
                  { label: texts.moonSign, value: translateHoroscopeValue(chartSummary?.moonSign || texts.pending, language) },
                  { label: texts.nakshatra, value: translateHoroscopeValue(chartSummary?.nakshatra || texts.pending, language) },
                  { label: texts.ascendant, value: translateHoroscopeValue(chartSummary?.ascendant || texts.pending, language) },
                  { label: texts.sunSign, value: translateHoroscopeValue(chartSummary?.sunSign || texts.pending, language) },
                ].map((pill) => (
                  <Grid size={{ xs: 6 }} key={pill.label}>
                    <Box
                      sx={{
                        p: 2,
                        bgcolor: COLORS.background,
                        borderRadius: '16px',
                        textAlign: 'center',
                        minHeight: 96,
                        height: '100%',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'center',
                      }}
                    >
                      <Typography
                        variant="caption"
                        sx={{
                          color: COLORS.textSecondary,
                          fontWeight: 700,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          mb: 0.5,
                          minHeight: 34,
                          lineHeight: 1.3,
                          fontFamily: LANGUAGE_FONT_FAMILY[language],
                        }}
                      >
                        {pill.label}
                      </Typography>
                      <Typography
                        variant="body1"
                        sx={{
                          fontWeight: 800,
                          color: COLORS.primary,
                          fontFamily: LANGUAGE_FONT_FAMILY[language],
                          minHeight: 24,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          lineHeight: 1.25,
                        }}
                      >
                        {pill.value}
                      </Typography>
                    </Box>
                  </Grid>
                ))}
              </Grid>

              <Box sx={{ mt: 4 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 800, color: 'text.primary', mb: 2, display: 'flex', alignItems: 'center', gap: 1, fontFamily: LANGUAGE_FONT_FAMILY[language] }}>
                  <TrendingUp sx={{ fontSize: 18, color: COLORS.accent }} /> {texts.planetaryPositions}
                </Typography>
                <Box sx={{ maxHeight: 200, overflowY: 'auto', pr: 1 }}>
                  {chartPositions.map((position: any, index: number) => (
                    <Box key={index} sx={{ display: 'flex', justifyContent: 'space-between', py: 1, borderBottom: `1px solid ${COLORS.background}` }}>
                      <Typography variant="body2" sx={{ fontWeight: 600, fontFamily: LANGUAGE_FONT_FAMILY[language] }}>{translatePlanetName(position.planet, language)}</Typography>
                      <Typography variant="body2" sx={{ color: COLORS.textSecondary, fontFamily: LANGUAGE_FONT_FAMILY[language] }}>
                        {translateHoroscopeValue(position.sign, language)} | {translateHouseLabel(position.house, language)} | {position.degree}
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
              <Typography variant="h5" sx={{ fontFamily: LANGUAGE_FONT_FAMILY[language], fontWeight: 700, mb: 4, color: COLORS.primary }}>
                {texts.checkCompatibilityWith}
              </Typography>

              <Stack spacing={4}>
                <Box>
                  <Typography variant="body2" sx={{ fontWeight: 700, mb: 1, color: COLORS.textSecondary, fontFamily: LANGUAGE_FONT_FAMILY[language] }}>
                    {texts.selectFromMatches}
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
                          <Typography variant="caption" sx={{ color: COLORS.textSecondary, fontFamily: LANGUAGE_FONT_FAMILY[language] }}>{translateHoroscopeValue(option.sign, language)} · {texts.moonSign}</Typography>
                        </Box>
                      </Box>
                    )}
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        placeholder={texts.searchPartnerName}
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
                  {isCalculating ? <CircularProgress size={24} color="inherit" /> : texts.calculateCompatibility}
                </Button>
              </Stack>
            </Paper>
          </Grid>

          <Grid size={{ xs: 12 }}>
            <Grid container spacing={4}>
              <Grid size={{ xs: 12, lg: 7 }}>
                <Paper
                  sx={{
                    p: 3,
                    borderRadius: '28px',
                    bgcolor: 'white',
                    boxShadow: '0 10px 32px rgba(139,26,46,0.05)',
                    border: '1px solid',
                    borderColor: COLORS.background,
                  }}
                >
                  <Typography variant="h6" sx={{ fontWeight: 800, color: COLORS.primary, mb: 2, fontFamily: LANGUAGE_FONT_FAMILY[language] }}>
                    {texts.traditionalDetails}
                  </Typography>

                  <Grid container spacing={1.5}>
                    {[
                      { label: texts.nakshatraPada, value: formatNakshatraPada(chartDetails?.nakshatraPada, language) },
                      { label: texts.ascendant, value: `${translateHoroscopeValue(chartSummary?.ascendant || texts.pending, language)}${chartDetails?.ascendantDegree && chartDetails.ascendantDegree !== 'Pending' ? ` • ${chartDetails.ascendantDegree}` : ''}` },
                      { label: texts.tithi, value: translateHoroscopeValue(chartDetails?.tithi || texts.pending, language) },
                      { label: texts.paksha, value: translateHoroscopeValue(chartDetails?.paksha || texts.pending, language) },
                      { label: texts.yoga, value: translateHoroscopeValue(chartDetails?.yoga || texts.pending, language) },
                      { label: texts.karana, value: translateHoroscopeValue(chartDetails?.karana || texts.pending, language) },
                      { label: texts.vedicDay, value: translateHoroscopeValue(chartDetails?.vedicDay || texts.pending, language) },
                      { label: texts.ayanamsa, value: translateHoroscopeValue(chartDetails?.ayanamsa || 'Lahiri', language) },
                      { label: texts.chartType, value: translateHoroscopeValue(chartDetails?.chartType || 'Sri Lankan Vedic / Sidereal', language) },
                      { label: texts.timeZone, value: chartDetails?.timezone || chartMeta?.timezone || 'Asia/Colombo' },
                    ].map((item) => (
                      <Grid size={{ xs: 12, sm: 6 }} key={item.label}>
                        <Box sx={{ p: 1.5, borderRadius: '14px', bgcolor: COLORS.background, height: '100%' }}>
                          <Typography variant="caption" sx={{ display: 'block', mb: 0.5, color: COLORS.textSecondary, fontWeight: 700, fontFamily: LANGUAGE_FONT_FAMILY[language] }}>
                            {item.label}
                          </Typography>
                          <Typography variant="body2" sx={{ color: COLORS.primary, fontWeight: 800, fontFamily: LANGUAGE_FONT_FAMILY[language] }}>
                            {item.value}
                          </Typography>
                        </Box>
                      </Grid>
                    ))}
                  </Grid>

                  {!!chartHouses.length && (
                    <Box sx={{ mt: 3 }}>
                      <Typography variant="subtitle2" sx={{ fontWeight: 800, color: 'text.primary', mb: 1.5, fontFamily: LANGUAGE_FONT_FAMILY[language] }}>
                        {texts.houseOverview}
                      </Typography>
                      <Grid container spacing={1.25}>
                        {chartHouses.map((house: any) => (
                          <Grid size={{ xs: 12, sm: 6, md: 4 }} key={`${house.house}-${house.sign}`}>
                            <Box sx={{ p: 1.5, borderRadius: '14px', border: '1px solid rgba(139,26,46,0.08)', height: '100%' }}>
                              <Typography variant="caption" sx={{ display: 'block', color: COLORS.textSecondary, fontWeight: 700, fontFamily: LANGUAGE_FONT_FAMILY[language] }}>
                                {translateHouseLabel(house.house, language)}
                              </Typography>
                              <Typography variant="body2" sx={{ color: COLORS.primary, fontWeight: 800, fontFamily: LANGUAGE_FONT_FAMILY[language] }}>
                                {translateHoroscopeValue(house.sign, language)}
                              </Typography>
                              <Typography variant="caption" sx={{ display: 'block', mt: 0.5, color: COLORS.textSecondary, fontFamily: LANGUAGE_FONT_FAMILY[language] }}>
                                {house.occupants?.length
                                  ? `${texts.occupiedBy}: ${house.occupants.map((planet: string) => translatePlanetName(planet, language)).join(', ')}`
                                  : texts.empty}
                              </Typography>
                            </Box>
                          </Grid>
                        ))}
                      </Grid>
                    </Box>
                  )}
                </Paper>
              </Grid>

              <Grid size={{ xs: 12, lg: 5 }}>
                <Paper
                  sx={{
                    p: 3,
                    borderRadius: '28px',
                    bgcolor: 'white',
                    boxShadow: '0 10px 32px rgba(139,26,46,0.05)',
                    border: '1px solid',
                    borderColor: COLORS.background,
                    height: '100%',
                  }}
                >
                  <Typography variant="h6" sx={{ fontWeight: 800, color: COLORS.primary, mb: 2, fontFamily: LANGUAGE_FONT_FAMILY[language] }}>
                    {texts.readingHighlights}
                  </Typography>
                  <Stack spacing={1.25}>
                    {readingHighlights.length ? (
                      readingHighlights.map((insight: string, index: number) => (
                        <Alert
                          key={`${index}-${insight.slice(0, 12)}`}
                          icon={<AutoAwesome fontSize="inherit" />}
                          severity="info"
                          sx={{ borderRadius: '14px', '& .MuiAlert-message': { fontFamily: LANGUAGE_FONT_FAMILY[language] } }}
                        >
                          {insight}
                        </Alert>
                      ))
                    ) : (
                      <Alert severity="info" sx={{ borderRadius: '14px', '& .MuiAlert-message': { fontFamily: LANGUAGE_FONT_FAMILY[language] } }}>
                        {accuracyNotice || texts.pending}
                      </Alert>
                    )}

                    {!!luckyColors.length && (
                      <Box sx={{ mt: 1.5 }}>
                        <Typography variant="caption" sx={{ display: 'block', color: COLORS.textSecondary, fontWeight: 700, mb: 0.75, fontFamily: LANGUAGE_FONT_FAMILY[language] }}>
                          Lucky Colors
                        </Typography>
                        <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                          {luckyColors.map((color: string) => (
                            <Box
                              key={color}
                              sx={{
                                width: 24,
                                height: 24,
                                borderRadius: '999px',
                                bgcolor: color,
                                border: '2px solid #fff',
                                boxShadow: '0 2px 8px rgba(0,0,0,0.12)',
                              }}
                            />
                          ))}
                        </Stack>
                      </Box>
                    )}

                    {!!auspiciousDays.length && (
                      <Box sx={{ mt: 1.5 }}>
                        <Typography variant="caption" sx={{ display: 'block', color: COLORS.textSecondary, fontWeight: 700, mb: 0.75, fontFamily: LANGUAGE_FONT_FAMILY[language] }}>
                          Auspicious Days
                        </Typography>
                        <Stack direction="row" spacing={0.8} flexWrap="wrap" useFlexGap>
                          {auspiciousDays.map((day: string) => (
                            <Chip key={day} label={day} size="small" sx={{ bgcolor: alpha(COLORS.accent, 0.12), color: COLORS.accent, fontWeight: 700 }} />
                          ))}
                        </Stack>
                      </Box>
                    )}

                    {!!favorablePartners.length && (
                      <Box sx={{ mt: 1.5 }}>
                        <Typography variant="caption" sx={{ display: 'block', color: COLORS.textSecondary, fontWeight: 700, mb: 0.75, fontFamily: LANGUAGE_FONT_FAMILY[language] }}>
                          Favorable Signs
                        </Typography>
                        <Typography variant="body2" sx={{ color: COLORS.textSecondary, fontFamily: LANGUAGE_FONT_FAMILY[language] }}>
                          {favorablePartners.join(', ')}
                        </Typography>
                      </Box>
                    )}

                    {!!profileFacts.length && (
                      <Box sx={{ mt: 1.5 }}>
                        <Typography variant="caption" sx={{ display: 'block', color: COLORS.textSecondary, fontWeight: 700, mb: 0.75, fontFamily: LANGUAGE_FONT_FAMILY[language] }}>
                          Personal Horoscope Facts
                        </Typography>
                        <Stack spacing={0.8}>
                          {profileFacts.map((fact: string, index: number) => (
                            <Typography key={`${fact}-${index}`} variant="body2" sx={{ color: COLORS.textSecondary, lineHeight: 1.55, fontFamily: LANGUAGE_FONT_FAMILY[language] }}>
                              • {fact}
                            </Typography>
                          ))}
                        </Stack>
                      </Box>
                    )}
                  </Stack>
                </Paper>
              </Grid>
            </Grid>
          </Grid>
        </Grid>
      )}

      <Dialog open={editorOpen} onClose={() => !isSavingBirthDetails && setEditorOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle sx={{ pb: 1 }}>
          <Stack direction="row" justifyContent="space-between" alignItems="flex-start" spacing={2}>
            <Box>
              <Typography variant="overline" sx={{ fontWeight: 800, letterSpacing: 1.5, color: COLORS.accent, fontFamily: LANGUAGE_FONT_FAMILY[language] }}>
                {texts.horoscopeUpdate}
              </Typography>
              <Typography variant="h5" sx={{ fontWeight: 800, color: COLORS.primary, fontFamily: LANGUAGE_FONT_FAMILY[language] }}>
                {texts.editBirthDetails}
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
            <Typography variant="body2" sx={{ color: 'text.primary', fontWeight: 600, fontFamily: LANGUAGE_FONT_FAMILY[language] }}>
              {texts.dialogDescription}
            </Typography>
            <Typography variant="caption" sx={{ display: 'block', mt: 0.75, color: COLORS.textSecondary, fontFamily: LANGUAGE_FONT_FAMILY[language] }}>
              {texts.enterBirthTimeHelp}
            </Typography>
          </Paper>

          {birthFormError && (
            <Alert severity="error" sx={{ mb: 2, borderRadius: '12px' }}>
              {birthFormError}
            </Alert>
          )}

          <Stack spacing={2.5}>
            <TextField
              label={texts.birthDate}
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
              label={texts.unknownBirthTime}
            />

            <TextField
              label={texts.birthTime}
              type="time"
              value={birthForm.birthTime}
              onChange={(event) => setBirthForm((current) => ({ ...current, birthTime: event.target.value }))}
              InputLabelProps={{ shrink: true }}
              disabled={!birthForm.knowsBirthTime}
              helperText={
                birthForm.knowsBirthTime
                  ? texts.enterBirthTimeHelp
                  : texts.approximateTimeHelp
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
                  label={texts.birthPlace}
                  placeholder={texts.birthPlace}
                  helperText={texts.birthPlaceHelp}
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
              <Button variant="text" onClick={() => setEditorOpen(false)} disabled={isSavingBirthDetails} sx={{ fontFamily: LANGUAGE_FONT_FAMILY[language] }}>
                {texts.cancel}
              </Button>
              <Button
                variant="contained"
                onClick={handleSaveBirthDetails}
                disabled={isSavingBirthDetails}
                sx={{ borderRadius: '12px', bgcolor: COLORS.primary, fontFamily: LANGUAGE_FONT_FAMILY[language] }}
              >
                {isSavingBirthDetails ? <CircularProgress size={22} color="inherit" /> : texts.saveReload}
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
