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
  DialogActions,
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
  Print,
  Warning,
  CheckCircle,
  AccessTime,
  NavigateNext,
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'motion/react';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '@/app/store/store';
import { AppDispatch } from '@/app/store/store';
import { fetchMyChart, calculateCompatibility, clearCompatibility } from '../store/horoscopeSlice';
import { fetchProfile, updateUser } from '@/features/auth/store/authSlice';
import { setLanguage, showToast } from '@/app/store/uiSlice';
import BirthChartWheel from '../components/BirthChartWheel';
import HoroscopeSeekerDashboard from '../components/HoroscopeSeekerDashboard';
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

const resolveAvatarSrc = (...sources: any[]) => {
  for (const source of sources) {
    if (!source || typeof source !== 'string') continue;
    const value = source.trim();
    if (!value) continue;
    if (/^(https?:)?\/\//i.test(value) || value.startsWith('data:') || value.startsWith('blob:')) {
      return value;
    }
    return value.startsWith('/') ? value : `/${value}`;
  }
  return undefined;
};

const HoroscopeView = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { user } = useSelector((state: RootState) => state.auth);
  const isHoroscopeSeeker = user?.profileType === 'horoscope_seeker' || user?.userType === 'horoscope_seeker';
  const [liveTime, setLiveTime] = useState(() => new Date());
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
  const [verificationStatus, setVerificationStatus] = useState({
    emailVerified: Boolean(user?.verification?.emailVerified),
    phoneVerified: Boolean(user?.verification?.phoneVerified),
  });
  const [verificationContact, setVerificationContact] = useState({
    email: user?.verification?.email || user?.email || '',
    phone: user?.verification?.phone || user?.personalInfo?.phone || user?.phone || '',
  });
  const [verifyDialog, setVerifyDialog] = useState<{ open: boolean; channel: 'email' | 'phone' | null }>({
    open: false,
    channel: null,
  });
  const [otpValue, setOtpValue] = useState('');
  const [verificationBusyChannel, setVerificationBusyChannel] = useState<'email' | 'phone' | null>(null);
  const [verifying, setVerifying] = useState(false);
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
  const seekerAvatarSrc = resolveAvatarSrc(
    user?.profilePic,
    user?.personalInfo?.profilePic,
    user?.photos?.find?.((photo: any) => photo?.isMain)?.url,
    user?.photos?.[0]?.url
  );

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
  const hasRightColumnContent = Boolean(
    chartDetails?.dasaInfo?.current ||
    (chartSummary?.marriageWindow?.length || 0) > 0 ||
    chartSummary?.seventhHouseAnalysis ||
    chartSummary?.venusSummary ||
    chartSummary?.jupiterSummary ||
    !isHoroscopeSeeker
  );
  const chartProfileSignature = [
    String(user?._id || ''),
    String(storedBirthDate || ''),
    normalizedStoredBirthPlace,
    storedKnownBirthTime ? 'known' : 'unknown',
    storedKnownBirthTime ? String(storedBirthTime || '') : '',
  ].join('|');

  const getGreeting = () => {
    const hour = liveTime.getHours();
    if (hour >= 5 && hour < 12) return 'Good morning';
    if (hour >= 12 && hour < 17) return 'Good afternoon';
    if (hour >= 17 && hour < 21) return 'Good evening';
    return 'Good night';
  };

  const getGregorianDate = () => {
    const options: Intl.DateTimeFormatOptions = {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    };
    return liveTime.toLocaleDateString('en-US', options);
  };

  const getLiveTimeString = () => {
    return liveTime.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true,
    });
  };
  const chartNeedsRefresh = Boolean(
    myChart && (
      !generatedFrom ||
      String(chartMeta?.userId || '') !== String(user?._id || '') ||
      (generatedFrom.birthDate || '') !== (storedBirthDate || '') ||
      Number(chartMeta?.calculationVersion || 1) < 4 ||
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
    const timer = window.setInterval(() => setLiveTime(new Date()), 1000);
    return () => window.clearInterval(timer);
  }, []);

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
    if (isHoroscopeSeeker) {
      setMatches([]);
      setLoadingMatches(false);
      return;
    }

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
  }, [isHoroscopeSeeker]);

  useEffect(() => {
    if (!isHoroscopeSeeker) return;

    const fetchVerificationState = async () => {
      try {
        const response = await userService.getProfile({ includeMedia: false });
        const latestVerification = {
          emailVerified: Boolean(response?.verification?.emailVerified),
          phoneVerified: Boolean(response?.verification?.phoneVerified),
        };

        setVerificationStatus(latestVerification);
        setVerificationContact({
          email: response?.verification?.email || response?.email || user?.email || '',
          phone: response?.verification?.phone || response?.personalInfo?.phone || user?.phone || '',
        });

        dispatch(updateUser({
          verification: { ...(user?.verification || {}), ...latestVerification },
        }));
      } catch (fetchError) {
        console.error('Failed to load horoscope seeker verification state:', fetchError);
      }
    };

    fetchVerificationState();
  }, [dispatch, isHoroscopeSeeker, user?._id]);

  const handleCalculate = async () => {
    if (!selectedMatch || !user) return;
    setCompatibilityError(null);
    try {
      await dispatch(calculateCompatibility({ userAId: String(user._id), userBId: selectedMatch.id, forceRefresh: true })).unwrap();
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

  const handleRequestVerificationOtp = async (channel: 'email' | 'phone') => {
    try {
      setVerificationBusyChannel(channel);
      const response = await userService.requestVerificationOtp(channel);
      dispatch(
        showToast({
          type: 'success',
          message: response.devOtp
            ? `OTP sent. Development OTP: ${response.devOtp}`
            : response.message || 'Verification OTP sent successfully.',
        })
      );
    } catch (otpError: any) {
      dispatch(showToast({ type: 'error', message: otpError.response?.data?.message || 'Failed to send OTP.' }));
    } finally {
      setVerificationBusyChannel(null);
    }
  };

  const handleConfirmVerification = async () => {
    if (!verifyDialog.channel || otpValue.trim().length !== 6) {
      dispatch(showToast({ type: 'error', message: 'Enter a valid 6-digit OTP.' }));
      return;
    }

    try {
      setVerifying(true);
      const response = await userService.confirmVerificationOtp({
        channel: verifyDialog.channel,
        otp: otpValue.trim(),
      });

      const nextVerification = {
        ...verificationStatus,
        ...response.verification,
      };

      setVerificationStatus(nextVerification);
      dispatch(updateUser({ verification: { ...(user?.verification || {}), ...nextVerification } }));
      dispatch(showToast({ type: 'success', message: response.message || 'Verification completed.' }));
      setVerifyDialog({ open: false, channel: null });
      setOtpValue('');
    } catch (verifyError: any) {
      dispatch(showToast({ type: 'error', message: verifyError.response?.data?.message || 'Failed to verify OTP.' }));
    } finally {
      setVerifying(false);
    }
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
      setEditorOpen(false);
      await dispatch(fetchMyChart({ force: true })).unwrap();

      setBirthFeedback({
        type: birthForm.knowsBirthTime ? 'success' : 'warning',
        message: birthForm.knowsBirthTime ? texts.refreshSuccess : texts.refreshApproximate,
      });
    } catch (saveError: any) {
      setBirthFormError(saveError?.response?.data?.message || saveError?.message || 'Unable to update your birth details right now.');
    } finally {
      setIsSavingBirthDetails(false);
    }
  };

  if (isLoading || isChartDataSettling) {
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

  if (isHoroscopeSeeker) {
    return (
      <>
        <HoroscopeSeekerDashboard
          user={user}
          language={language}
          texts={texts}
          chartSummary={chartSummary}
          chartDetails={chartDetails}
          chartHouses={chartHouses}
          chartPlanets={chartPlanets}
          chartPositions={chartPositions}
          readingHighlights={readingHighlights}
          profileHighlights={profileHighlights}
          chartMeta={chartMeta}
          storedBirthDate={storedBirthDate}
          storedBirthTime={storedBirthTime}
          storedBirthPlace={storedBirthPlace}
          storedKnownBirthTime={storedKnownBirthTime}
          accuracyNotice={accuracyNotice}
          hasCriticalBirthDetailsMissing={hasCriticalBirthDetailsMissing}
          error={error}
          birthFeedback={birthFeedback}
          verification={verificationStatus}
          verificationEmail={verificationContact.email}
          verificationPhone={verificationContact.phone}
          verificationBusyChannel={verificationBusyChannel}
          onRefresh={() => dispatch(fetchMyChart({ force: true }))}
          onRequestVerificationOtp={handleRequestVerificationOtp}
          onOpenVerifyDialog={(channel) => {
            setVerifyDialog({ open: true, channel });
            setOtpValue('');
          }}
          onOpenEditor={openEditor}
          onPrint={() => window.print()}
        />

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

        <Dialog open={verifyDialog.open} onClose={() => !verifying && setVerifyDialog({ open: false, channel: null })} maxWidth="xs" fullWidth>
          <DialogTitle sx={{ fontWeight: 800, color: COLORS.primary }}>
            Verify {verifyDialog.channel === 'email' ? 'Email' : 'Phone'}
          </DialogTitle>
          <DialogContent>
            <Typography variant="body2" sx={{ color: COLORS.textSecondary, mb: 2 }}>
              Enter the 6-digit OTP sent to your {verifyDialog.channel}.
            </Typography>
            <TextField
              fullWidth
              label="OTP"
              value={otpValue}
              onChange={(event) => setOtpValue(event.target.value.replace(/\D/g, '').slice(0, 6))}
              inputProps={{ maxLength: 6, inputMode: 'numeric', pattern: '[0-9]*' }}
            />
          </DialogContent>
          <DialogActions sx={{ p: 2.5 }}>
            <Button onClick={() => setVerifyDialog({ open: false, channel: null })} disabled={verifying}>Cancel</Button>
            <Button
              variant="contained"
              onClick={handleConfirmVerification}
              disabled={verifying}
              sx={{ bgcolor: COLORS.primary, '&:hover': { bgcolor: '#6B1424' } }}
            >
              {verifying ? 'Verifying...' : 'Verify'}
            </Button>
          </DialogActions>
        </Dialog>
      </>
    );
  }

  return (
    <Box sx={{ p: { xs: 2, md: 4 }, maxWidth: '1200px', mx: 'auto' }}>
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 2 }}>
        <Box sx={{ flex: '1 1 420px', minWidth: 0, minHeight: { xs: 'auto', md: 88 } }}>
          <Typography variant="h3" sx={{ fontFamily: 'Playfair Display', fontWeight: 800, color: COLORS.primary, mb: 1 }}>
            {isHoroscopeSeeker ? 'Horoscope Dashboard' : texts.birthChartTitle}
          </Typography>
          <Typography variant="body1" sx={{ color: COLORS.textSecondary, fontFamily: LANGUAGE_FONT_FAMILY[language] }}>
            {texts.calculatedFromProfile}
          </Typography>
        </Box>
        <Stack
          spacing={1.5}
          alignItems={{ xs: 'stretch', md: 'flex-end' }}
          sx={{ width: { xs: '100%', md: 'auto' }, flexShrink: 0 }}
        >
          {/* Action buttons */}
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} justifyContent={{ xs: 'flex-start', md: 'flex-end' }}>
            <Button
              variant="outlined"
              startIcon={<Refresh />}
              onClick={() => dispatch(fetchMyChart({ force: true }))}
              sx={{
                borderRadius: '12px',
                borderColor: COLORS.secondary,
                color: COLORS.secondary,
                fontFamily: LANGUAGE_FONT_FAMILY[language],
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
                whiteSpace: 'nowrap',
              }}
            >
              {texts.shareChart}
            </Button>
            <Button
              variant="outlined"
              startIcon={<Print />}
              onClick={() => window.print()}
              sx={{
                borderRadius: '12px',
                borderColor: COLORS.textSecondary,
                color: COLORS.textSecondary,
                fontFamily: LANGUAGE_FONT_FAMILY[language],
                whiteSpace: 'nowrap',
              }}
            >
              Print / Save PDF
            </Button>
          </Stack>

          {/* Language selector */}
          <Stack
            direction="row"
            spacing={1}
            alignItems="center"
            justifyContent={{ xs: 'flex-start', md: 'flex-end' }}
            sx={{
              flexWrap: 'nowrap',
              overflowX: 'auto',
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

      {isHoroscopeSeeker && (
        <Paper
          sx={{
            p: { xs: 2, md: 2.5 },
            mb: 3,
            borderRadius: '22px',
            background: 'linear-gradient(135deg, rgba(139,26,46,0.06) 0%, rgba(201,168,76,0.14) 100%)',
            border: '1px solid rgba(139,26,46,0.14)',
            boxShadow: '0 10px 28px rgba(139,26,46,0.08)',
          }}
        >
          <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} alignItems={{ xs: 'flex-start', md: 'center' }}>
            <Avatar
              src={seekerAvatarSrc}
              alt={user?.name || 'Seeker'}
              sx={{
                width: 64,
                height: 64,
                border: `3px solid ${alpha(COLORS.secondary, 0.5)}`,
                boxShadow: '0 8px 24px rgba(139,26,46,0.12)',
                bgcolor: alpha(COLORS.secondary, 0.16),
                color: COLORS.primary,
                fontWeight: 700,
                flexShrink: 0,
              }}
            >
              {(user?.name || 'S').charAt(0).toUpperCase()}
            </Avatar>

            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography variant="h5" sx={{ fontFamily: 'Playfair Display', fontWeight: 800, color: COLORS.primary, mb: 1 }}>
                {getGreeting()}, {user?.name || 'Seeker'}
              </Typography>
              <Stack direction="row" spacing={1} alignItems="center" useFlexGap flexWrap="wrap">
                <Box
                  sx={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 0.75,
                    px: 1.5,
                    py: 0.7,
                    borderRadius: '999px',
                    bgcolor: alpha(COLORS.accent, 0.1),
                    border: `1px solid ${alpha(COLORS.accent, 0.22)}`,
                  }}
                >
                  <Typography variant="body2" sx={{ color: COLORS.accent, fontWeight: 700 }}>
                    {getGregorianDate()} ·
                  </Typography>
                  <Box
                    component="span"
                    sx={{
                      color: COLORS.accent,
                      fontWeight: 800,
                      fontFamily: 'monospace',
                      fontVariantNumeric: 'tabular-nums',
                      display: 'inline-block',
                      minWidth: '11ch',
                      textAlign: 'left',
                    }}
                  >
                    {getLiveTimeString()}
                  </Box>
                </Box>
                <Chip
                  label={`Nakshatra: ${translateHoroscopeValue(chartSummary?.nakshatra || texts.pending, language)}`}
                  sx={{ bgcolor: alpha(COLORS.secondary, 0.2), color: COLORS.primary, fontWeight: 700 }}
                />
                <Chip
                  label={`Gana: ${translateHoroscopeValue(chartSummary?.gana || texts.pending, language)}`}
                  sx={{ bgcolor: alpha(COLORS.accent, 0.12), color: COLORS.accent, fontWeight: 800 }}
                />
                <Chip
                  label={`Ascendant: ${translateHoroscopeValue(chartSummary?.ascendant || texts.pending, language)}`}
                  sx={{ bgcolor: alpha(COLORS.primary, 0.08), color: COLORS.primary, fontWeight: 800 }}
                />
                <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 1, px: 1.5, py: 0.7, borderRadius: '999px', bgcolor: alpha(COLORS.accent, 0.06), border: `1px solid ${alpha(COLORS.accent, 0.2)}` }}>
                  <AccessTime sx={{ fontSize: 16, color: COLORS.accent }} />
                  <Typography variant="body2" sx={{ color: COLORS.accent, fontWeight: 700 }}>
                    Today's Focus: {chartSummary?.auspiciousTime || texts.pending}
                  </Typography>
                </Box>
              </Stack>
            </Box>
          </Stack>
        </Paper>
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

      {/* ── Chart Grade Banner ── */}
      {chartSummary?.chartGrade && (
        <Box
          sx={{
            mb: 3, p: 2.5, borderRadius: '20px',
            background: chartSummary.chartGrade.grade === 'Excellent'
              ? `linear-gradient(135deg, ${alpha(COLORS.accent, 0.12)}, ${alpha(COLORS.accent, 0.05)})`
              : chartSummary.chartGrade.grade === 'Good'
              ? `linear-gradient(135deg, ${alpha(COLORS.secondary, 0.14)}, ${alpha(COLORS.secondary, 0.05)})`
              : chartSummary.chartGrade.grade === 'Moderate'
              ? `linear-gradient(135deg, ${alpha('#FF6F00', 0.1)}, ${alpha('#FF6F00', 0.03)})`
              : `linear-gradient(135deg, ${alpha('#D32F2F', 0.08)}, ${alpha('#D32F2F', 0.02)})`,
            border: `1.5px solid ${
              chartSummary.chartGrade.grade === 'Excellent' ? alpha(COLORS.accent, 0.4)
              : chartSummary.chartGrade.grade === 'Good' ? alpha(COLORS.secondary, 0.4)
              : chartSummary.chartGrade.grade === 'Moderate' ? alpha('#FF6F00', 0.35)
              : alpha('#D32F2F', 0.3)
            }`,
          }}
        >
          <Stack direction={{ xs: 'column', sm: 'row' }} alignItems={{ xs: 'flex-start', sm: 'center' }} justifyContent="space-between" spacing={1.5} flexWrap="wrap">
            <Stack direction="row" alignItems="center" spacing={1.5}>
              {chartSummary.chartGrade.grade === 'Excellent' || chartSummary.chartGrade.grade === 'Good'
                ? <CheckCircle sx={{ color: chartSummary.chartGrade.grade === 'Excellent' ? COLORS.accent : COLORS.secondary, fontSize: 28 }} />
                : <Warning sx={{ color: chartSummary.chartGrade.grade === 'Moderate' ? '#E65100' : '#D32F2F', fontSize: 28 }} />}
              <Box>
                <Typography variant="overline" sx={{ fontWeight: 800, letterSpacing: 1.5, color: COLORS.textSecondary, fontSize: '0.62rem' }}>CHART QUALITY FOR MARRIAGE</Typography>
                <Typography variant="h6" sx={{ fontWeight: 900, color: COLORS.primary, lineHeight: 1.2, fontFamily: LANGUAGE_FONT_FAMILY[language] }}>
                  {chartSummary.chartGrade.grade} &mdash; {chartSummary.chartGrade.summary}
                </Typography>
              </Box>
            </Stack>
            <Stack direction="row" spacing={0.75} flexWrap="wrap" useFlexGap>
              {chartSummary.chartGrade.strengths?.map((s: string) => (
                <Chip key={s} label={s} size="small" sx={{ bgcolor: alpha(COLORS.accent, 0.12), color: COLORS.accent, fontWeight: 700, fontSize: '0.65rem', borderRadius: '8px', border: `1px solid ${alpha(COLORS.accent, 0.3)}` }} />
              ))}
              {chartSummary.chartGrade.issues?.map((s: string) => (
                <Chip key={s} label={s} size="small" sx={{ bgcolor: alpha('#D32F2F', 0.08), color: '#C62828', fontWeight: 700, fontSize: '0.65rem', borderRadius: '8px', border: `1px solid ${alpha('#D32F2F', 0.25)}` }} />
              ))}
            </Stack>
          </Stack>
        </Box>
      )}

      {chartSummary && (
        <Grid container spacing={6} alignItems="flex-start">
          <Grid size={{ xs: 12, lg: hasRightColumnContent ? 6 : 12 }}>
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

              <Grid container spacing={2} sx={{ mt: 2 }}>
                {[
                  { label: texts.moonSign, value: translateHoroscopeValue(chartSummary?.moonSign || texts.pending, language), highlight: false },
                  { label: texts.nakshatra, value: translateHoroscopeValue(chartSummary?.nakshatra || texts.pending, language), highlight: false },
                  { label: texts.gana, value: translateHoroscopeValue(chartSummary?.gana || texts.pending, language), highlight: false },
                  { label: texts.nakshatraPada, value: chartSummary?.nakshatraPada ? `Pada ${chartSummary.nakshatraPada}` : texts.pending, highlight: false },
                  { label: texts.ascendant, value: translateHoroscopeValue(chartSummary?.ascendant || texts.pending, language), highlight: true },
                  { label: texts.sunSign, value: translateHoroscopeValue(chartSummary?.sunSign || texts.pending, language), highlight: false },
                ].map((pill) => (
                  <Grid size={{ xs: 6 }} key={pill.label}>
                    <Box
                      sx={{
                        p: 2,
                        bgcolor: pill.highlight ? COLORS.primary : COLORS.background,
                        borderRadius: '16px',
                        textAlign: 'center',
                        minHeight: 96,
                        height: '100%',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'center',
                        boxShadow: pill.highlight ? '0 4px 16px rgba(139,26,46,0.25)' : 'none',
                        position: 'relative',
                        overflow: 'hidden',
                        '&::after': pill.highlight ? {
                          content: '"✦"',
                          position: 'absolute',
                          top: 6,
                          right: 10,
                          fontSize: '10px',
                          color: 'rgba(255,255,255,0.5)',
                        } : {},
                      }}
                    >
                      <Typography
                        variant="caption"
                        sx={{
                          color: pill.highlight ? 'rgba(255,255,255,0.75)' : COLORS.textSecondary,
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
                          color: pill.highlight ? '#fff' : COLORS.primary,
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

              {/* ── Rajju / Nadi / Yoni / Rasi Lord chips ── */}
              {(chartSummary?.rajju || chartSummary?.nadi || chartSummary?.yoni) && (
                <Box sx={{ mt: 2.5 }}>
                  <Typography variant="caption" sx={{ fontWeight: 700, color: COLORS.textSecondary, letterSpacing: '0.5px', display: 'block', mb: 1 }}>PORUTHAM IDENTIFIERS</Typography>
                  <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                    {chartSummary.rajju && (
                      <Box sx={{ flex: 1, minWidth: 100, p: 1.5, borderRadius: '12px', bgcolor: alpha(COLORS.primary, 0.06), border: `1px solid ${alpha(COLORS.primary, 0.15)}`, textAlign: 'center' }}>
                        <Typography variant="caption" sx={{ display: 'block', fontWeight: 700, color: COLORS.textSecondary, fontSize: '0.6rem', letterSpacing: '0.5px' }}>RAJJU</Typography>
                        <Typography variant="body2" sx={{ fontWeight: 900, color: COLORS.primary }}>{chartSummary.rajju}</Typography>
                        <Typography variant="caption" sx={{ fontSize: '0.58rem', color: COLORS.textSecondary }}>Same Rajju = prohibited</Typography>
                      </Box>
                    )}
                    {chartSummary.nadi && (
                      <Box sx={{ flex: 1, minWidth: 100, p: 1.5, borderRadius: '12px', bgcolor: alpha('#1565C0', 0.06), border: `1px solid ${alpha('#1565C0', 0.2)}`, textAlign: 'center' }}>
                        <Typography variant="caption" sx={{ display: 'block', fontWeight: 700, color: '#1565C0', fontSize: '0.6rem', letterSpacing: '0.5px' }}>NADI</Typography>
                        <Typography variant="body2" sx={{ fontWeight: 900, color: '#1565C0' }}>{chartSummary.nadi}</Typography>
                        <Typography variant="caption" sx={{ fontSize: '0.58rem', color: COLORS.textSecondary }}>Same Nadi = prohibited</Typography>
                      </Box>
                    )}
                    {chartSummary.yoni && (
                      <Box sx={{ flex: 1, minWidth: 100, p: 1.5, borderRadius: '12px', bgcolor: alpha('#AD1457', 0.05), border: `1px solid ${alpha('#AD1457', 0.2)}`, textAlign: 'center' }}>
                        <Typography variant="caption" sx={{ display: 'block', fontWeight: 700, color: '#AD1457', fontSize: '0.6rem', letterSpacing: '0.5px' }}>YONI</Typography>
                        <Typography variant="body2" sx={{ fontWeight: 900, color: '#AD1457' }}>{chartSummary.yoni}</Typography>
                        <Typography variant="caption" sx={{ fontSize: '0.58rem', color: COLORS.textSecondary }}>Animal symbol</Typography>
                      </Box>
                    )}
                    {chartSummary.rasiLord && (
                      <Box sx={{ flex: 1, minWidth: 100, p: 1.5, borderRadius: '12px', bgcolor: alpha(COLORS.secondary, 0.08), border: `1px solid ${alpha(COLORS.secondary, 0.3)}`, textAlign: 'center' }}>
                        <Typography variant="caption" sx={{ display: 'block', fontWeight: 700, color: '#7A6020', fontSize: '0.6rem', letterSpacing: '0.5px' }}>RASI LORD</Typography>
                        <Typography variant="body2" sx={{ fontWeight: 900, color: '#7A6020' }}>{chartSummary.rasiLord}</Typography>
                        <Typography variant="caption" sx={{ fontSize: '0.58rem', color: COLORS.textSecondary }}>Moon sign ruler</Typography>
                      </Box>
                    )}
                  </Stack>
                </Box>
              )}

              {/* ── Manglik + Kala Sarpa Dosha badges ── */}
              {(chartSummary?.manglik || chartSummary?.kalaSarpaDosha?.present) && (
                <Stack direction="row" spacing={1.5} flexWrap="wrap" useFlexGap sx={{ mt: 3 }}>
                  {chartSummary?.manglik && chartSummary.manglik !== 'Pending' && (
                    <Box
                      sx={{
                        flex: 1,
                        minWidth: 160,
                        p: 2,
                        borderRadius: '16px',
                        border: `2px solid ${chartSummary.manglikPresent ? '#D32F2F' : alpha(COLORS.accent, 0.4)}`,
                        bgcolor: chartSummary.manglikPresent ? alpha('#D32F2F', 0.06) : alpha(COLORS.accent, 0.06),
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1.5,
                      }}
                    >
                      {chartSummary.manglikPresent
                        ? <Warning sx={{ color: '#D32F2F', fontSize: 22, flexShrink: 0 }} />
                        : <CheckCircle sx={{ color: COLORS.accent, fontSize: 22, flexShrink: 0 }} />}
                      <Box>
                        <Typography variant="caption" sx={{ fontWeight: 700, color: COLORS.textSecondary, display: 'block', lineHeight: 1.2, fontFamily: LANGUAGE_FONT_FAMILY[language] }}>Manglik / Kuja Dosha</Typography>
                        <Stack direction="row" alignItems="center" spacing={0.75} flexWrap="wrap">
                          <Typography variant="body2" sx={{ fontWeight: 800, color: chartSummary.manglikPresent ? '#D32F2F' : COLORS.accent, lineHeight: 1.3 }}>{chartSummary.manglik}</Typography>
                          {chartSummary.manglikSeverity && (
                            <Chip
                              label={chartSummary.manglikSeverity}
                              size="small"
                              sx={{
                                height: 16, fontSize: '0.6rem', fontWeight: 800, borderRadius: '5px', px: 0.5,
                                bgcolor: chartSummary.manglikSeverity === 'Full' ? alpha('#D32F2F', 0.15) : chartSummary.manglikSeverity === 'High' ? alpha('#FF6F00', 0.15) : alpha('#F57F17', 0.15),
                                color: chartSummary.manglikSeverity === 'Full' ? '#D32F2F' : chartSummary.manglikSeverity === 'High' ? '#E65100' : '#F57F17',
                              }}
                            />
                          )}
                        </Stack>
                        {chartSummary.manglikPresent && (
                          <Typography variant="caption" sx={{ color: COLORS.textSecondary, fontSize: '0.65rem' }}>Match with another Manglik to cancel dosha</Typography>
                        )}
                      </Box>
                    </Box>
                  )}
                  {chartSummary?.kalaSarpaDosha?.present && (
                    <Box
                      sx={{
                        flex: 1,
                        minWidth: 160,
                        p: 2,
                        borderRadius: '16px',
                        border: `2px solid ${alpha('#7B1FA2', 0.5)}`,
                        bgcolor: alpha('#7B1FA2', 0.06),
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1.5,
                      }}
                    >
                      <Warning sx={{ color: '#7B1FA2', fontSize: 22, flexShrink: 0 }} />
                      <Box>
                        <Typography variant="caption" sx={{ fontWeight: 700, color: COLORS.textSecondary, display: 'block', lineHeight: 1.2, fontFamily: LANGUAGE_FONT_FAMILY[language] }}>Kala Sarpa Dosha</Typography>
                        <Typography variant="body2" sx={{ fontWeight: 800, color: '#7B1FA2', lineHeight: 1.3 }}>{chartSummary.kalaSarpaDosha.name} ({texts.ascendant}: {chartSummary.kalaSarpaDosha.rahuHouse})</Typography>
                        <Typography variant="caption" sx={{ color: COLORS.textSecondary, fontSize: '0.65rem' }}>All planets between Rahu-Ketu axis</Typography>
                      </Box>
                    </Box>
                  )}
                  {chartSummary?.sadeSati?.present && (
                    <Box
                      sx={{
                        flex: 1,
                        minWidth: 160,
                        p: 2,
                        borderRadius: '16px',
                        border: `2px solid ${alpha('#1565C0', 0.5)}`,
                        bgcolor: alpha('#1565C0', 0.05),
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1.5,
                      }}
                    >
                      <Warning sx={{ color: '#1565C0', fontSize: 22, flexShrink: 0 }} />
                      <Box>
                        <Typography variant="caption" sx={{ fontWeight: 700, color: COLORS.textSecondary, display: 'block', lineHeight: 1.2, fontFamily: LANGUAGE_FONT_FAMILY[language] }}>Sade Sati</Typography>
                        <Typography variant="body2" sx={{ fontWeight: 800, color: '#1565C0', lineHeight: 1.3 }}>{chartSummary.sadeSati.phase} Phase</Typography>
                        <Typography variant="caption" sx={{ color: COLORS.textSecondary, fontSize: '0.65rem' }}>Saturn transiting {chartSummary.sadeSati.saturnTransitSign} — consult astrologer for timing</Typography>
                      </Box>
                    </Box>
                  )}
                  {chartSummary?.sadeSati?.ashtamaShani && !chartSummary?.sadeSati?.present && (
                    <Box
                      sx={{
                        flex: 1,
                        minWidth: 160,
                        p: 2,
                        borderRadius: '16px',
                        border: `2px solid ${alpha('#FF6F00', 0.4)}`,
                        bgcolor: alpha('#FF6F00', 0.05),
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1.5,
                      }}
                    >
                      <Warning sx={{ color: '#FF6F00', fontSize: 22, flexShrink: 0 }} />
                      <Box>
                        <Typography variant="caption" sx={{ fontWeight: 700, color: COLORS.textSecondary, display: 'block', lineHeight: 1.2, fontFamily: LANGUAGE_FONT_FAMILY[language] }}>Ashtama Shani</Typography>
                        <Typography variant="body2" sx={{ fontWeight: 800, color: '#FF6F00', lineHeight: 1.3 }}>Saturn in 8th from Moon</Typography>
                        <Typography variant="caption" sx={{ color: COLORS.textSecondary, fontSize: '0.65rem' }}>Caution advised for marriage timing</Typography>
                      </Box>
                    </Box>
                  )}
                </Stack>
              )}

              <Box sx={{ mt: 4 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 800, color: 'text.primary', mb: 2, display: 'flex', alignItems: 'center', gap: 1, fontFamily: LANGUAGE_FONT_FAMILY[language] }}>
                  <TrendingUp sx={{ fontSize: 18, color: COLORS.accent }} /> {texts.planetaryPositions}
                </Typography>
                <Box sx={{ pr: 0.5 }}>
                  {chartPositions.map((position: any, index: number) => {
                    const dignityColor: Record<string, string> = { Exalted: COLORS.accent, Debilitated: '#D32F2F', 'Own Sign': COLORS.secondary };
                    const dc = dignityColor[position.dignity] || 'transparent';
                    return (
                      <Box key={index} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', py: 0.9, borderBottom: `1px solid ${COLORS.background}`, gap: 1 }}>
                        <Stack direction="row" alignItems="center" spacing={0.75}>
                          <Typography variant="body2" sx={{ fontWeight: 600, fontFamily: LANGUAGE_FONT_FAMILY[language] }}>{translatePlanetName(position.planet, language)}</Typography>
                          {position.retrograde && (
                            <Typography component="span" sx={{ fontSize: '0.65rem', fontWeight: 900, color: '#E53935', lineHeight: 1 }} title="Retrograde">℞</Typography>
                          )}
                          {position.dignity && position.dignity !== 'Normal' && (
                            <Chip label={position.dignity} size="small" sx={{ height: 16, fontSize: '0.6rem', fontWeight: 800, bgcolor: alpha(dc, 0.12), color: dc, borderRadius: '5px', px: 0.5 }} />
                          )}
                        </Stack>
                        <Stack direction="row" alignItems="center" spacing={0.5}>
                          {position.navamsha && (
                            <Typography variant="caption" sx={{ color: alpha(COLORS.textSecondary, 0.7), fontSize: '0.65rem', fontStyle: 'italic' }}>D9:{position.navamsha.slice(0,3)}</Typography>
                          )}
                          <Typography variant="body2" sx={{ color: COLORS.textSecondary, fontFamily: LANGUAGE_FONT_FAMILY[language], fontSize: '0.78rem' }}>
                            {translateHoroscopeValue(position.sign, language)} | {translateHouseLabel(position.house, language)} | {position.degree}
                          </Typography>
                        </Stack>
                      </Box>
                    );
                  })}
                </Box>
              </Box>
            </Paper>
          </Grid>

          {hasRightColumnContent && (
          <Grid size={{ xs: 12, lg: 6 }}>
            <Stack spacing={3}>

            {/* ── Dasa / Mahadasa Panel ── */}
            {chartDetails?.dasaInfo?.current && (
              <Paper sx={{ p: 3, borderRadius: '28px', bgcolor: 'white', boxShadow: '0 6px 24px rgba(139,26,46,0.06)', border: '1px solid', borderColor: COLORS.background }}>
                <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2 }}>
                  <AccessTime sx={{ fontSize: 18, color: COLORS.secondary }} />
                  <Typography variant="subtitle1" sx={{ fontWeight: 800, color: COLORS.primary, fontFamily: LANGUAGE_FONT_FAMILY[language] }}>Vimshottari Dasha</Typography>
                  <Chip label="Marriage Timing" size="small" sx={{ ml: 'auto', bgcolor: alpha(COLORS.secondary, 0.12), color: '#7A6020', fontWeight: 700, fontSize: '0.62rem', borderRadius: '8px' }} />
                </Stack>
                <Box sx={{ p: 2, borderRadius: '16px', bgcolor: alpha(COLORS.primary, 0.06), border: `2px solid ${alpha(COLORS.primary, 0.18)}`, mb: 2 }}>
                  <Typography variant="caption" sx={{ color: COLORS.textSecondary, fontWeight: 700, display: 'block', mb: 0.5, fontFamily: LANGUAGE_FONT_FAMILY[language] }}>CURRENT MAHADASA</Typography>
                  <Stack direction="row" alignItems="center" justifyContent="space-between" flexWrap="wrap" gap={1}>
                    <Typography variant="h5" sx={{ fontWeight: 900, color: COLORS.primary, fontFamily: LANGUAGE_FONT_FAMILY[language] }}>{chartDetails.dasaInfo.current.lord} Dasha</Typography>
                    <Chip label={`${chartDetails.dasaInfo.current.yearsRemaining} yrs remaining`} size="small" sx={{ bgcolor: COLORS.primary, color: 'white', fontWeight: 800, borderRadius: '10px' }} />
                  </Stack>
                  <Typography variant="caption" sx={{ color: COLORS.textSecondary, fontFamily: LANGUAGE_FONT_FAMILY[language] }}>
                    {chartDetails.dasaInfo.current.start} – {chartDetails.dasaInfo.current.end}
                  </Typography>
                </Box>
                {chartDetails.dasaInfo.upcoming?.length > 0 && (
                  <Stack direction="row" spacing={1}>
                    {chartDetails.dasaInfo.upcoming.map((d: any, i: number) => (
                      <Box key={i} sx={{ flex: 1, p: 1.5, borderRadius: '12px', bgcolor: COLORS.background, textAlign: 'center' }}>
                        <Stack direction="row" alignItems="center" justifyContent="center" spacing={0.5}><NavigateNext sx={{ fontSize: 14, color: COLORS.textSecondary }} /><Typography variant="caption" sx={{ fontWeight: 700, color: COLORS.textSecondary, fontFamily: LANGUAGE_FONT_FAMILY[language] }}>Next</Typography></Stack>
                        <Typography variant="body2" sx={{ fontWeight: 800, color: COLORS.primary }}>{d.lord}</Typography>
                        <Typography variant="caption" sx={{ color: COLORS.textSecondary }}>{d.years} yrs</Typography>
                      </Box>
                    ))}
                  </Stack>
                )}

                {/* ── Antardasha Sub-period ── */}
                {chartDetails?.antardasha?.current && (
                  <Box sx={{ mt: 2, p: 2, borderRadius: '14px', bgcolor: alpha(COLORS.secondary, 0.07), border: `1px solid ${alpha(COLORS.secondary, 0.3)}` }}>
                    <Typography variant="caption" sx={{ fontWeight: 700, color: '#7A6020', display: 'block', mb: 0.75, letterSpacing: '0.5px' }}>CURRENT ANTARDASHA (SUB-PERIOD)</Typography>
                    <Stack direction="row" alignItems="center" justifyContent="space-between" flexWrap="wrap" gap={0.75}>
                      <Typography variant="body1" sx={{ fontWeight: 900, color: COLORS.primary }}>
                        {chartDetails.dasaInfo.current.lord}/{chartDetails.antardasha.current.lord}
                      </Typography>
                      <Chip label={`${chartDetails.antardasha.current.daysRemaining}d left`} size="small" sx={{ bgcolor: alpha(COLORS.secondary, 0.2), color: '#7A6020', fontWeight: 800, borderRadius: '8px', height: 18, fontSize: '0.62rem' }} />
                    </Stack>
                    <Typography variant="caption" sx={{ color: COLORS.textSecondary }}>{chartDetails.antardasha.current.start} – {chartDetails.antardasha.current.end}</Typography>
                    {chartDetails.antardasha.next && (
                      <Typography variant="caption" sx={{ display: 'block', mt: 0.5, color: alpha(COLORS.textSecondary, 0.8) }}>Next: {chartDetails.antardasha.next.lord} Antardasha from {chartDetails.antardasha.next.start}</Typography>
                    )}
                  </Box>
                )}

                {/* ── Muhurtha Readiness ── */}
                {(() => {
                  const AUSPICIOUS_LORDS = new Set(['Venus', 'Jupiter', 'Moon', 'Mercury']);
                  const CAUTION_LORDS = new Set(['Saturn', 'Rahu', 'Ketu', 'Mars']);
                  const lord = chartDetails.dasaInfo.current?.lord;
                  const isAuspicious = AUSPICIOUS_LORDS.has(lord);
                  const isCaution = CAUTION_LORDS.has(lord);
                  return (
                    <Box sx={{
                      mt: 2, p: 2, borderRadius: '14px',
                      bgcolor: isAuspicious ? alpha(COLORS.accent, 0.08) : isCaution ? alpha('#D32F2F', 0.05) : alpha(COLORS.primary, 0.05),
                      border: `1.5px solid ${isAuspicious ? alpha(COLORS.accent, 0.4) : isCaution ? alpha('#D32F2F', 0.3) : alpha(COLORS.primary, 0.2)}`,
                    }}>
                      <Typography variant="caption" sx={{ fontWeight: 700, color: COLORS.textSecondary, display: 'block', mb: 0.5, letterSpacing: '0.5px' }}>MUHURTHA READINESS</Typography>
                      <Stack direction="row" alignItems="center" spacing={1}>
                        {isAuspicious
                          ? <CheckCircle sx={{ color: COLORS.accent, fontSize: 18 }} />
                          : <Warning sx={{ color: isCaution ? '#D32F2F' : '#FF6F00', fontSize: 18 }} />}
                        <Typography variant="body2" sx={{ fontWeight: 800, color: isAuspicious ? COLORS.accent : isCaution ? '#D32F2F' : '#FF6F00' }}>
                          {isAuspicious ? `${lord} Dasha — Auspicious for marriage` : isCaution ? `${lord} Dasha — Consult astrologer before fixing wedding date` : `${lord} Dasha — Neutral period`}
                        </Typography>
                      </Stack>
                    </Box>
                  );
                })()}
              </Paper>
            )}

            {/* ── Marriage Window Panel ── */}
            {chartSummary?.marriageWindow?.length > 0 && (
              <Paper sx={{ p: 3, borderRadius: '28px', bgcolor: 'white', boxShadow: '0 6px 24px rgba(139,26,46,0.06)', border: '1px solid', borderColor: COLORS.background }}>
                <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2 }}>
                  <Favorite sx={{ fontSize: 18, color: COLORS.accent }} />
                  <Typography variant="subtitle1" sx={{ fontWeight: 800, color: COLORS.primary, fontFamily: LANGUAGE_FONT_FAMILY[language] }}>Auspicious Marriage Window</Typography>
                  <Chip label="Dasha-based" size="small" sx={{ ml: 'auto', bgcolor: alpha(COLORS.accent, 0.1), color: COLORS.accent, fontWeight: 700, fontSize: '0.62rem', borderRadius: '8px' }} />
                </Stack>
                <Stack spacing={1}>
                  {chartSummary.marriageWindow.map((w: any, i: number) => (
                    <Box key={i} sx={{ p: 2, borderRadius: '14px', bgcolor: i === 0 ? alpha(COLORS.accent, 0.07) : alpha(COLORS.background, 0.6), border: `1.5px solid ${i === 0 ? alpha(COLORS.accent, 0.35) : alpha(COLORS.primary, 0.1)}` }}>
                      <Stack direction="row" alignItems="center" justifyContent="space-between" flexWrap="wrap" gap={0.75}>
                        <Stack direction="row" alignItems="center" spacing={1}>
                          <Chip label={w.note} size="small" sx={{ height: 16, fontSize: '0.58rem', fontWeight: 800, borderRadius: '5px', bgcolor: i === 0 ? COLORS.accent : alpha(COLORS.primary, 0.12), color: i === 0 ? 'white' : COLORS.primary }} />
                          <Typography variant="body2" sx={{ fontWeight: 900, color: COLORS.primary }}>{w.lord} Dasha</Typography>
                        </Stack>
                        <Typography variant="caption" sx={{ color: COLORS.textSecondary, fontWeight: 600 }}>{w.start} – {w.end}</Typography>
                      </Stack>
                    </Box>
                  ))}
                </Stack>
                <Typography variant="caption" sx={{ display: 'block', mt: 1.5, color: COLORS.textSecondary, fontSize: '0.65rem' }}>Based on Vimshottari Dasha sequence. Consult an astrologer to confirm Muhurtha.</Typography>
              </Paper>
            )}

            {/* ── 7th House Lord + Venus/Jupiter Panel ── */}
            {(chartSummary?.seventhHouseAnalysis || chartSummary?.venusSummary || chartSummary?.jupiterSummary) && (
              <Paper sx={{ p: 3, borderRadius: '28px', bgcolor: 'white', boxShadow: '0 6px 24px rgba(139,26,46,0.06)', border: '1px solid', borderColor: COLORS.background }}>
                <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2 }}>
                  <Favorite sx={{ fontSize: 18, color: COLORS.primary }} />
                  <Typography variant="subtitle1" sx={{ fontWeight: 800, color: COLORS.primary, fontFamily: LANGUAGE_FONT_FAMILY[language] }}>Marriage Significators</Typography>
                  <Chip label="Key for match" size="small" sx={{ ml: 'auto', bgcolor: alpha(COLORS.primary, 0.08), color: COLORS.primary, fontWeight: 700, fontSize: '0.62rem', borderRadius: '8px' }} />
                </Stack>

                <Stack spacing={1.5}>
                  {/* 7th House Lord */}
                  {chartSummary?.seventhHouseAnalysis && (
                    <Box sx={{ p: 2, borderRadius: '14px', bgcolor: alpha(COLORS.secondary, 0.08), border: `1.5px solid ${alpha(COLORS.secondary, 0.35)}` }}>
                      <Typography variant="caption" sx={{ fontWeight: 700, color: '#7A6020', display: 'block', mb: 0.75, letterSpacing: '0.5px' }}>7TH HOUSE (MARRIAGE) LORD</Typography>
                      <Stack direction="row" alignItems="flex-start" justifyContent="space-between" flexWrap="wrap" gap={1}>
                        <Box>
                          <Typography variant="body1" sx={{ fontWeight: 900, color: COLORS.primary }}>
                            {chartSummary.seventhHouseAnalysis.lord}
                            {chartSummary.seventhHouseAnalysis.lordRetrograde && (
                              <Typography component="span" sx={{ fontSize: '0.75rem', fontWeight: 900, color: '#E53935', ml: 0.5 }}>℞</Typography>
                            )}
                          </Typography>
                          <Typography variant="caption" sx={{ color: COLORS.textSecondary }}>
                            7th sign: {translateHoroscopeValue(chartSummary.seventhHouseAnalysis.sign, language)}
                          </Typography>
                        </Box>
                        <Stack alignItems="flex-end" spacing={0.5}>
                          <Typography variant="caption" sx={{ fontWeight: 700, color: COLORS.textSecondary }}>
                            Placed in {chartSummary.seventhHouseAnalysis.lordHouse ? `House ${chartSummary.seventhHouseAnalysis.lordHouse}` : '—'} · {translateHoroscopeValue(chartSummary.seventhHouseAnalysis.lordSign || '', language)}
                          </Typography>
                          {chartSummary.seventhHouseAnalysis.lordDignity && chartSummary.seventhHouseAnalysis.lordDignity !== 'Normal' && (
                            <Chip
                              label={chartSummary.seventhHouseAnalysis.lordDignity}
                              size="small"
                              sx={{
                                height: 17, fontSize: '0.62rem', fontWeight: 800, borderRadius: '6px',
                                bgcolor: chartSummary.seventhHouseAnalysis.lordDignity === 'Exalted' ? alpha(COLORS.accent, 0.15) : alpha('#D32F2F', 0.12),
                                color: chartSummary.seventhHouseAnalysis.lordDignity === 'Exalted' ? COLORS.accent : '#D32F2F',
                              }}
                            />
                          )}
                        </Stack>
                      </Stack>
                    </Box>
                  )}

                  {/* Venus (marriage significator for men, love for women) */}
                  {chartSummary?.venusSummary && (
                    <Box sx={{ p: 2, borderRadius: '14px', bgcolor: alpha('#EC407A', 0.05), border: `1.5px solid ${alpha('#EC407A', 0.3)}` }}>
                      <Typography variant="caption" sx={{ fontWeight: 700, color: '#AD1457', display: 'block', mb: 0.75, letterSpacing: '0.5px' }}>VENUS — MARRIAGE &amp; LOVE SIGNIFICATOR</Typography>
                      <Stack direction="row" alignItems="center" justifyContent="space-between" flexWrap="wrap" gap={1}>
                        <Stack direction="row" alignItems="center" spacing={0.75}>
                          <Typography variant="body1" sx={{ fontWeight: 900, color: '#AD1457' }}>
                            {translateHoroscopeValue(chartSummary.venusSummary.sign, language)}
                          </Typography>
                          {chartSummary.venusSummary.retrograde && (
                            <Typography component="span" sx={{ fontSize: '0.75rem', fontWeight: 900, color: '#E53935' }}>℞</Typography>
                          )}
                        </Stack>
                        <Stack direction="row" spacing={0.75} alignItems="center" flexWrap="wrap">
                          <Chip label={`H${chartSummary.venusSummary.house}`} size="small" sx={{ height: 17, fontSize: '0.62rem', fontWeight: 800, borderRadius: '6px', bgcolor: alpha('#EC407A', 0.1), color: '#AD1457' }} />
                          {chartSummary.venusSummary.dignity && chartSummary.venusSummary.dignity !== 'Normal' && (
                            <Chip label={chartSummary.venusSummary.dignity} size="small" sx={{ height: 17, fontSize: '0.62rem', fontWeight: 800, borderRadius: '6px', bgcolor: chartSummary.venusSummary.dignity === 'Exalted' ? alpha(COLORS.accent, 0.15) : alpha('#D32F2F', 0.12), color: chartSummary.venusSummary.dignity === 'Exalted' ? COLORS.accent : '#D32F2F' }} />
                          )}
                          {chartSummary.venusSummary.navamsha && (
                            <Chip label={`D9: ${chartSummary.venusSummary.navamsha}`} size="small" sx={{ height: 17, fontSize: '0.62rem', fontWeight: 700, borderRadius: '6px', bgcolor: 'transparent', border: `1px solid ${alpha('#EC407A', 0.4)}`, color: '#AD1457' }} />
                          )}
                        </Stack>
                      </Stack>
                    </Box>
                  )}

                  {/* Jupiter (husband significator for women, blessings for men) */}
                  {chartSummary?.jupiterSummary && (
                    <Box sx={{ p: 2, borderRadius: '14px', bgcolor: alpha('#F57F17', 0.05), border: `1.5px solid ${alpha('#F57F17', 0.3)}` }}>
                      <Typography variant="caption" sx={{ fontWeight: 700, color: '#E65100', display: 'block', mb: 0.75, letterSpacing: '0.5px' }}>JUPITER (GURU) — HUSBAND &amp; BLESSINGS SIGNIFICATOR</Typography>
                      <Stack direction="row" alignItems="center" justifyContent="space-between" flexWrap="wrap" gap={1}>
                        <Stack direction="row" alignItems="center" spacing={0.75}>
                          <Typography variant="body1" sx={{ fontWeight: 900, color: '#E65100' }}>
                            {translateHoroscopeValue(chartSummary.jupiterSummary.sign, language)}
                          </Typography>
                          {chartSummary.jupiterSummary.retrograde && (
                            <Typography component="span" sx={{ fontSize: '0.75rem', fontWeight: 900, color: '#E53935' }}>℞</Typography>
                          )}
                        </Stack>
                        <Stack direction="row" spacing={0.75} alignItems="center" flexWrap="wrap">
                          <Chip label={`H${chartSummary.jupiterSummary.house}`} size="small" sx={{ height: 17, fontSize: '0.62rem', fontWeight: 800, borderRadius: '6px', bgcolor: alpha('#F57F17', 0.12), color: '#E65100' }} />
                          {chartSummary.jupiterSummary.dignity && chartSummary.jupiterSummary.dignity !== 'Normal' && (
                            <Chip label={chartSummary.jupiterSummary.dignity} size="small" sx={{ height: 17, fontSize: '0.62rem', fontWeight: 800, borderRadius: '6px', bgcolor: chartSummary.jupiterSummary.dignity === 'Exalted' ? alpha(COLORS.accent, 0.15) : alpha('#D32F2F', 0.12), color: chartSummary.jupiterSummary.dignity === 'Exalted' ? COLORS.accent : '#D32F2F' }} />
                          )}
                          {chartSummary.jupiterSummary.navamsha && (
                            <Chip label={`D9: ${chartSummary.jupiterSummary.navamsha}`} size="small" sx={{ height: 17, fontSize: '0.62rem', fontWeight: 700, borderRadius: '6px', bgcolor: 'transparent', border: `1px solid ${alpha('#F57F17', 0.4)}`, color: '#E65100' }} />
                          )}
                        </Stack>
                      </Stack>
                    </Box>
                  )}

                  {/* Navamsha (D9) ascendant note */}
                  {chartSummary?.ascendantNavamsha && (
                    <Box sx={{ p: 1.5, borderRadius: '12px', bgcolor: alpha(COLORS.primary, 0.04), border: `1px dashed ${alpha(COLORS.primary, 0.25)}` }}>
                      <Typography variant="caption" sx={{ color: COLORS.textSecondary, fontWeight: 700, letterSpacing: '0.5px' }}>NAVAMSHA (D9) ASCENDANT</Typography>
                      <Typography variant="body2" sx={{ fontWeight: 800, color: COLORS.primary, mt: 0.25 }}>{translateHoroscopeValue(chartSummary.ascendantNavamsha, language)}</Typography>
                      <Typography variant="caption" sx={{ color: COLORS.textSecondary, fontSize: '0.65rem' }}>Used in marriage chart analysis (D9 Lagna)</Typography>
                    </Box>
                  )}
                </Stack>
              </Paper>
            )}

            {!isHoroscopeSeeker && (
              <Paper
                sx={{
                  p: 3,
                  borderRadius: '40px',
                  bgcolor: 'white',
                  boxShadow: '0 10px 40px rgba(139,26,46,0.05)',
                  border: '1px solid',
                  borderColor: COLORS.background,
                }}
              >
                <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 2 }}>
                  <Typography variant="h5" sx={{ fontFamily: LANGUAGE_FONT_FAMILY[language], fontWeight: 700, color: COLORS.primary }}>
                    {texts.checkCompatibilityWith}
                  </Typography>
                </Stack>

                <Stack spacing={2}>
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
            )}
            </Stack>{/* end right-column Stack */}
          </Grid>
          )}

          <AnimatePresence>
            {!isHoroscopeSeeker && compatibility?.dimensions?.length > 0 && (
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
                      gana: compatibility.userA?.gana || 'Pending',
                      manglik: compatibility.userA?.manglik || 'Pending',
                    }}
                    userB={{
                      name: compatibility.userB?.name || selectedMatch?.name || 'Match',
                      photo: compatibility.userB?.photo || selectedMatch?.photo || null,
                      sign: compatibility.userB?.sign || selectedMatch?.sign || '',
                      gana: compatibility.userB?.gana || 'Pending',
                      manglik: compatibility.userB?.manglik || 'Pending',
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
                      { label: texts.gana, value: translateHoroscopeValue(chartDetails?.gana || texts.pending, language) },
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

                  {/* ── Porutham Self-Profile ── */}
                  {(chartSummary?.rajju || chartSummary?.nadi || chartSummary?.yoni) && (
                    <Box sx={{ mt: 3, p: 2.5, borderRadius: '18px', bgcolor: alpha(COLORS.secondary, 0.06), border: `1.5px solid ${alpha(COLORS.secondary, 0.3)}` }}>
                      <Typography variant="overline" sx={{ fontWeight: 800, letterSpacing: 1.5, color: '#7A6020', fontSize: '0.65rem', display: 'block', mb: 1.5 }}>PORUTHAM SELF REFERENCE</Typography>
                      <Grid container spacing={1.25}>
                        {[
                          { label: 'Gana', value: chartDetails?.gana || '—', note: 'Personality class' },
                          { label: 'Rajju', value: chartSummary.rajju, note: 'Same = prohibited' },
                          { label: 'Nadi', value: chartSummary.nadi, note: 'Same = prohibited' },
                          { label: 'Yoni', value: chartSummary.yoni, note: 'Animal symbol' },
                        ].map((row) => (
                          <Grid size={{ xs: 6 }} key={row.label}>
                            <Box sx={{ p: 1.5, borderRadius: '12px', bgcolor: alpha(COLORS.secondary, 0.08), textAlign: 'center' }}>
                              <Typography variant="caption" sx={{ display: 'block', fontWeight: 800, color: '#7A6020', fontSize: '0.62rem', letterSpacing: '0.5px' }}>{row.label}</Typography>
                              <Typography variant="body2" sx={{ fontWeight: 900, color: COLORS.primary, mt: 0.25 }}>{row.value}</Typography>
                              <Typography variant="caption" sx={{ fontSize: '0.58rem', color: COLORS.textSecondary }}>{row.note}</Typography>
                            </Box>
                          </Grid>
                        ))}
                      </Grid>
                      <Typography variant="caption" sx={{ display: 'block', mt: 1.5, color: COLORS.textSecondary, fontSize: '0.62rem' }}>Share these values when checking partner Porutham compatibility.</Typography>
                    </Box>
                  )}

                  {!!chartHouses.length && (
                    <Box sx={{ mt: 3 }}>
                      <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1.5 }}>
                        <Typography variant="subtitle2" sx={{ fontWeight: 800, color: 'text.primary', fontFamily: LANGUAGE_FONT_FAMILY[language] }}>
                          {texts.houseOverview}
                        </Typography>
                        <Chip label="★ Marriage-relevant" size="small" sx={{ height: 16, fontSize: '0.6rem', fontWeight: 800, bgcolor: alpha(COLORS.secondary, 0.15), color: '#7A6020', borderRadius: '6px' }} />
                      </Stack>
                      <Grid container spacing={1.25}>
                        {chartHouses.map((house: any) => {
                          const MARRIAGE_HOUSES = new Set([1, 5, 7, 8]);
                          const isMarriage = MARRIAGE_HOUSES.has(Number(house.house));
                          const MARRIAGE_LABELS: Record<number, string> = { 1: 'Self', 5: 'Romance', 7: 'Marriage', 8: 'Longevity' };
                          return (
                          <Grid size={{ xs: 12, sm: 6, md: 4 }} key={`${house.house}-${house.sign}`}>
                            <Box sx={{
                              p: 1.5, borderRadius: '14px', height: '100%',
                              border: isMarriage ? `2px solid ${alpha(COLORS.secondary, 0.6)}` : '1px solid rgba(139,26,46,0.08)',
                              bgcolor: isMarriage ? alpha(COLORS.secondary, 0.06) : 'transparent',
                              position: 'relative',
                            }}>
                              {isMarriage && (
                                <Chip label={MARRIAGE_LABELS[Number(house.house)]} size="small"
                                  sx={{ position: 'absolute', top: 5, right: 5, height: 14, fontSize: '0.55rem', fontWeight: 900,
                                    bgcolor: COLORS.secondary, color: COLORS.primary, borderRadius: '5px', px: 0.25 }} />
                              )}
                              <Typography variant="caption" sx={{ display: 'block', color: isMarriage ? '#7A6020' : COLORS.textSecondary, fontWeight: 700, fontFamily: LANGUAGE_FONT_FAMILY[language] }}>
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
                          );
                        })}
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
                  <Stack spacing={1.25} sx={{ mt: chartDetails?.tithi || chartDetails?.yoga ? 0 : 2 }}>
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
                              role="img"
                              aria-label={`Lucky colour: ${HEX_COLOR_NAMES[color] ?? color}`}
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
