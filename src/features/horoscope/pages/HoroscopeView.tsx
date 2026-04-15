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
  Avatar,
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
  WbSunny,
  NightsStay,
  FlashOn,
  Favorite,
  Palette,
  CalendarMonth,
  Psychology,
  Bolt,
  Spa,
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'motion/react';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '@/app/store/store';
import { AppDispatch } from '@/app/store/store';
import { fetchMyChart, calculateCompatibility, clearCompatibility } from '../store/horoscopeSlice';
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

const RULING_PLANETS: Record<string, string> = {
  Aries: 'Mars', Taurus: 'Venus', Gemini: 'Mercury', Cancer: 'Moon',
  Leo: 'Sun', Virgo: 'Mercury', Libra: 'Venus', Scorpio: 'Mars',
  Sagittarius: 'Jupiter', Capricorn: 'Saturn', Aquarius: 'Saturn', Pisces: 'Jupiter',
};

const ZODIAC_SYMBOLS_MAP: Record<string, string> = {
  Aries: '♈', Taurus: '♉', Gemini: '♊', Cancer: '♋',
  Leo: '♌', Virgo: '♍', Libra: '♎', Scorpio: '♏',
  Sagittarius: '♐', Capricorn: '♑', Aquarius: '♒', Pisces: '♓',
};

const INSIGHT_ACCENTS = ['#8B1A2E', '#1A6B72', '#C9A84C', '#4A148C', '#1565C0', '#2E7D32'] as const;
const INSIGHT_ICONS   = [AutoAwesome, WbSunny, NightsStay, Bolt, Favorite, Spa, FlashOn, Psychology] as const;

const HEX_COLOR_NAMES: Record<string, string> = {
  '#E53935': 'Red',       '#FF7043': 'Deep Orange', '#43A047': 'Green',
  '#8D6E63': 'Brown',     '#FDD835': 'Yellow',      '#29B6F6': 'Sky Blue',
  '#90CAF9': 'Pale Blue', '#F8BBD0': 'Blush Pink',  '#FB8C00': 'Orange',
  '#66BB6A': 'Mint',      '#26A69A': 'Teal',        '#EC407A': 'Pink',
  '#AB47BC': 'Violet',    '#8E24AA': 'Purple',       '#D32F2F': 'Crimson',
  '#1E88E5': 'Blue',      '#FFA726': 'Amber',        '#546E7A': 'Slate',
  '#26C6DA': 'Cyan',      '#5C6BC0': 'Indigo',       '#42A5F5': 'Light Blue',
  '#7E57C2': 'Lavender',  '#8B1A2E': 'Maroon',       '#C9A84C': 'Gold',
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
  const [compatibilityError, setCompatibilityError] = useState<string | null>(null);
  const lastAutoFetchKeyRef = useRef('');
  const compatibilityResultsRef = useRef<HTMLDivElement>(null);

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
        const matchesRes = await matchService.getMutualMatches();
        setMatches(
          (matchesRes.data.items || []).map((match: any) => ({
            id: match.id,
            name: match.name,
            photo: match.img || null,
            sign: match.moonSign,
            initials: match.initials || match.name?.slice(0, 2).toUpperCase() || '??',
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
    setCompatibilityError(null);
    try {
      await dispatch(calculateCompatibility({ userAId: String(user._id), userBId: selectedMatch.id })).unwrap();
      setTimeout(() => {
        compatibilityResultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 150);
    } catch (err: any) {
      setCompatibilityError(typeof err === 'string' ? err : err?.message || 'Failed to calculate compatibility');
    }
  };

  const handleReset = () => {
    dispatch(clearCompatibility());
    setSelectedMatch(null);
    setCompatibilityError(null);
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
                    value={selectedMatch}
                    getOptionLabel={(option) => option.name}
                    onChange={(_, newValue) => { setSelectedMatch(newValue); setCompatibilityError(null); dispatch(clearCompatibility()); }}
                    renderOption={(props, option) => (
                      <Box component="li" {...props} sx={{ display: 'flex', alignItems: 'center', gap: 1.5, px: 1.5, py: 1 }}>
                        <Avatar
                          src={option.photo || undefined}
                          alt={option.name}
                          sx={{
                            width: 44, height: 44, flexShrink: 0,
                            bgcolor: alpha(COLORS.primary, 0.15),
                            color: COLORS.primary,
                            fontWeight: 800, fontSize: '0.85rem',
                            border: `2px solid ${alpha(COLORS.secondary, 0.5)}`,
                          }}
                        >
                          {option.initials}
                        </Avatar>
                        <Box sx={{ minWidth: 0 }}>
                          <Stack direction="row" alignItems="center" spacing={0.75}>
                            <Typography variant="body2" sx={{ fontWeight: 700 }} noWrap>{option.name}</Typography>
                            <Chip
                              label="Mutual"
                              size="small"
                              sx={{ height: 16, fontSize: '0.6rem', fontWeight: 800,
                                bgcolor: alpha(COLORS.accent, 0.12), color: COLORS.accent,
                                borderRadius: '5px', px: 0.5 }}
                            />
                          </Stack>
                          <Typography variant="caption" sx={{ color: COLORS.textSecondary, fontFamily: LANGUAGE_FONT_FAMILY[language] }} noWrap>
                            {translateHoroscopeValue(option.sign, language)} · {texts.moonSign}
                          </Typography>
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

                {compatibilityError && (
                  <Alert severity="error" sx={{ borderRadius: '12px' }}>
                    {compatibilityError}
                  </Alert>
                )}
              </Stack>
            </Paper>
          </Grid>

          <AnimatePresence>
            {compatibility?.dimensions?.length > 0 && (
              <Grid size={{ xs: 12 }}>
                <motion.div
                  ref={compatibilityResultsRef}
                  initial={{ opacity: 0, y: 24 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 24 }}
                  transition={{ duration: 0.5 }}
                >
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                    <Typography variant="h5" sx={{ fontFamily: LANGUAGE_FONT_FAMILY[language], fontWeight: 700, color: COLORS.primary }}>
                      Compatibility Results
                    </Typography>
                    <Button
                      variant="outlined"
                      startIcon={<Close />}
                      onClick={handleReset}
                      sx={{ borderRadius: '12px', borderColor: COLORS.primary, color: COLORS.primary, fontWeight: 700 }}
                    >
                      Compare Another
                    </Button>
                  </Box>
                  <CompatibilityScores
                    overallScore={compatibility.overallScore}
                    dimensions={compatibility.dimensions}
                    userA={{
                      name: compatibility.userA?.name || user?.name || 'You',
                      photo: compatibility.userA?.photo || (user as any)?.profilePic || null,
                      sign: compatibility.userA?.sign || '',
                    }}
                    userB={{
                      name: compatibility.userB?.name || selectedMatch?.name || 'Match',
                      photo: compatibility.userB?.photo || selectedMatch?.photo || null,
                      sign: compatibility.userB?.sign || selectedMatch?.sign || '',
                    }}
                    explanation={compatibility.explanation}
                  />
                </motion.div>
              </Grid>
            )}
          </AnimatePresence>

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
                    boxShadow: '0 10px 32px rgba(139,26,46,0.06)',
                    border: '1px solid',
                    borderColor: COLORS.background,
                    height: '100%',
                  }}
                >
                  {/* ── Header row with ruling-planet badge ── */}
                  <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 0.5 }}>
                    <Typography variant="h6" sx={{ fontWeight: 800, color: COLORS.primary, fontFamily: LANGUAGE_FONT_FAMILY[language] }}>
                      ✨ {texts.readingHighlights}
                    </Typography>
                    {chartSummary?.ascendant && RULING_PLANETS[chartSummary.ascendant] && (
                      <Chip
                        icon={<WbSunny sx={{ fontSize: '13px !important' }} />}
                        label={`${RULING_PLANETS[chartSummary.ascendant]} Ruled`}
                        size="small"
                        sx={{
                          bgcolor: alpha(COLORS.primary, 0.08),
                          color: COLORS.primary,
                          fontWeight: 800,
                          fontSize: '0.68rem',
                          borderRadius: '10px',
                          border: `1px solid ${alpha(COLORS.primary, 0.18)}`,
                        }}
                      />
                    )}
                  </Stack>

                  {/* ── Panchanga mini-row (Tithi · Yoga) ── */}
                  {(chartDetails?.tithi || chartDetails?.yoga) && (
                    <Stack direction="row" spacing={0.75} flexWrap="wrap" useFlexGap sx={{ mb: 2, mt: 1.25 }}>
                      {chartDetails?.tithi && (
                        <Chip
                          icon={<NightsStay sx={{ fontSize: '13px !important' }} />}
                          label={chartDetails.tithi}
                          size="small"
                          variant="outlined"
                          sx={{ borderColor: alpha(COLORS.accent, 0.4), color: COLORS.accent, fontWeight: 700, fontSize: '0.7rem', borderRadius: '9px' }}
                        />
                      )}
                      {chartDetails?.yoga && (
                        <Chip
                          icon={<Spa sx={{ fontSize: '13px !important' }} />}
                          label={chartDetails.yoga}
                          size="small"
                          variant="outlined"
                          sx={{ borderColor: alpha(COLORS.secondary, 0.5), color: '#7A6020', fontWeight: 700, fontSize: '0.7rem', borderRadius: '9px' }}
                        />
                      )}
                      {chartDetails?.karana && (
                        <Chip
                          icon={<Bolt sx={{ fontSize: '13px !important' }} />}
                          label={chartDetails.karana}
                          size="small"
                          variant="outlined"
                          sx={{ borderColor: alpha('#4A148C', 0.35), color: '#4A148C', fontWeight: 700, fontSize: '0.7rem', borderRadius: '9px' }}
                        />
                      )}
                    </Stack>
                  )}

                  {/* ── Insight cards (staggered animation) ── */}
                  <Stack spacing={1.25}
                    sx={{
                      mt: chartDetails?.tithi || chartDetails?.yoga ? 0 : 2,
                      maxHeight: 340,
                      overflowY: 'auto',
                      pr: 0.5,
                      '&::-webkit-scrollbar': { width: '4px' },
                      '&::-webkit-scrollbar-thumb': { bgcolor: alpha(COLORS.primary, 0.2), borderRadius: '4px' },
                    }}
                  >
                    {readingHighlights.length ? (
                      readingHighlights.map((insight: string, index: number) => {
                        const accent  = INSIGHT_ACCENTS[index % INSIGHT_ACCENTS.length];
                        const IconEl  = INSIGHT_ICONS[index % INSIGHT_ICONS.length];
                        return (
                          <motion.div
                            key={`${index}-${insight.slice(0, 12)}`}
                            initial={{ opacity: 0, x: -14 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.07, duration: 0.4, ease: 'easeOut' }}
                          >
                            <Box
                              sx={{
                                p: '12px 14px',
                                borderRadius: '16px',
                                background: `linear-gradient(135deg, ${alpha(accent, 0.07)} 0%, ${alpha(accent, 0.02)} 100%)`,
                                borderLeft: `4px solid ${accent}`,
                                display: 'flex',
                                gap: 1.5,
                                alignItems: 'flex-start',
                              }}
                            >
                              <Box
                                sx={{
                                  width: 30, height: 30,
                                  borderRadius: '9px',
                                  bgcolor: alpha(accent, 0.13),
                                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                                  flexShrink: 0, mt: '1px',
                                }}
                              >
                                <IconEl sx={{ fontSize: 15, color: accent }} />
                              </Box>
                              <Typography
                                variant="body2"
                                sx={{ color: '#2C2C2C', lineHeight: 1.7, fontWeight: 500, fontFamily: LANGUAGE_FONT_FAMILY[language] }}
                              >
                                {insight}
                              </Typography>
                            </Box>
                          </motion.div>
                        );
                      })
                    ) : (
                      <Box sx={{ p: 2, borderRadius: '14px', bgcolor: alpha(COLORS.primary, 0.04), borderLeft: `4px solid ${alpha(COLORS.primary, 0.35)}` }}>
                        <Typography variant="body2" sx={{ color: COLORS.textSecondary, fontFamily: LANGUAGE_FONT_FAMILY[language] }}>
                          {accuracyNotice || texts.pending}
                        </Typography>
                      </Box>
                    )}
                  </Stack>

                  <Divider sx={{ my: 2, borderColor: alpha(COLORS.primary, 0.06) }} />

                  {/* ── Lucky Colours ── */}
                  {!!luckyColors.length && (
                    <Box sx={{ mb: 2.25 }}>
                      <Stack direction="row" alignItems="center" spacing={0.75} sx={{ mb: 1 }}>
                        <Palette sx={{ fontSize: 14, color: COLORS.textSecondary }} />
                        <Typography variant="caption" sx={{ color: COLORS.textSecondary, fontWeight: 700, letterSpacing: '0.5px', fontFamily: LANGUAGE_FONT_FAMILY[language] }}>
                          LUCKY COLOURS
                        </Typography>
                      </Stack>
                      <Stack direction="row" spacing={1.5} flexWrap="wrap" useFlexGap>
                        {luckyColors.map((color: string) => (
                          <Stack key={color} alignItems="center" spacing={0.5}>
                            <Box
                              sx={{
                                width: 38, height: 38,
                                borderRadius: '12px',
                                bgcolor: color,
                                boxShadow: `0 4px 14px ${color}77`,
                                border: '3px solid #fff',
                                transition: 'transform 0.2s',
                                '&:hover': { transform: 'scale(1.18)' },
                              }}
                            />
                            <Typography
                              variant="caption"
                              sx={{ fontSize: '0.62rem', fontWeight: 700, color: COLORS.textSecondary, lineHeight: 1.1, textAlign: 'center' }}
                            >
                              {HEX_COLOR_NAMES[color] ?? color}
                            </Typography>
                          </Stack>
                        ))}
                      </Stack>
                    </Box>
                  )}

                  {/* ── Auspicious Days ── */}
                  {!!auspiciousDays.length && (
                    <Box sx={{ mb: 2.25 }}>
                      <Stack direction="row" alignItems="center" spacing={0.75} sx={{ mb: 1 }}>
                        <CalendarMonth sx={{ fontSize: 14, color: COLORS.accent }} />
                        <Typography variant="caption" sx={{ color: COLORS.textSecondary, fontWeight: 700, letterSpacing: '0.5px', fontFamily: LANGUAGE_FONT_FAMILY[language] }}>
                          AUSPICIOUS DAYS
                        </Typography>
                      </Stack>
                      <Stack direction="row" spacing={0.75} flexWrap="wrap" useFlexGap>
                        {auspiciousDays.map((day: string) => (
                          <Chip
                            key={day}
                            label={day}
                            size="small"
                            sx={{
                              bgcolor: alpha(COLORS.accent, 0.1),
                              color: COLORS.accent,
                              fontWeight: 800,
                              fontSize: '0.72rem',
                              borderRadius: '10px',
                              border: `1px solid ${alpha(COLORS.accent, 0.28)}`,
                            }}
                          />
                        ))}
                      </Stack>
                    </Box>
                  )}

                  {/* ── Favorable Signs ── */}
                  {!!favorablePartners.length && (
                    <Box sx={{ mb: 2.25 }}>
                      <Stack direction="row" alignItems="center" spacing={0.75} sx={{ mb: 1 }}>
                        <Favorite sx={{ fontSize: 14, color: COLORS.primary }} />
                        <Typography variant="caption" sx={{ color: COLORS.textSecondary, fontWeight: 700, letterSpacing: '0.5px', fontFamily: LANGUAGE_FONT_FAMILY[language] }}>
                          FAVORABLE SIGNS
                        </Typography>
                      </Stack>
                      <Stack direction="row" spacing={0.75} flexWrap="wrap" useFlexGap>
                        {favorablePartners.map((sign: string) => (
                          <Chip
                            key={sign}
                            label={`${ZODIAC_SYMBOLS_MAP[sign] ?? ''} ${sign}`}
                            size="small"
                            sx={{
                              bgcolor: alpha(COLORS.primary, 0.07),
                              color: COLORS.primary,
                              fontWeight: 800,
                              fontSize: '0.72rem',
                              borderRadius: '10px',
                              border: `1px solid ${alpha(COLORS.primary, 0.15)}`,
                            }}
                          />
                        ))}
                      </Stack>
                    </Box>
                  )}

                  {/* ── Personal Horoscope Facts ── */}
                  {!!profileFacts.length && (
                    <Box>
                      <Stack direction="row" alignItems="center" spacing={0.75} sx={{ mb: 1 }}>
                        <Psychology sx={{ fontSize: 14, color: '#7A6020' }} />
                        <Typography variant="caption" sx={{ color: COLORS.textSecondary, fontWeight: 700, letterSpacing: '0.5px', fontFamily: LANGUAGE_FONT_FAMILY[language] }}>
                          PERSONAL HOROSCOPE FACTS
                        </Typography>
                      </Stack>
                      <Stack spacing={0.9}>
                        {profileFacts.map((fact: string, index: number) => (
                          <Stack key={`${fact}-${index}`} direction="row" spacing={1.25} alignItems="flex-start">
                            <Box
                              sx={{
                                minWidth: 22, height: 22,
                                borderRadius: '7px',
                                background: `linear-gradient(135deg, ${alpha(COLORS.secondary, 0.35)}, ${alpha(COLORS.secondary, 0.15)})`,
                                color: COLORS.primary,
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                fontSize: '10px', fontWeight: 900, flexShrink: 0,
                              }}
                            >
                              {index + 1}
                            </Box>
                            <Typography variant="body2" sx={{ color: '#3C3C3C', lineHeight: 1.65, fontFamily: LANGUAGE_FONT_FAMILY[language] }}>
                              {fact}
                            </Typography>
                          </Stack>
                        ))}
                      </Stack>
                    </Box>
                  )}
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


    </Box>
  );
};

export default HoroscopeView;
