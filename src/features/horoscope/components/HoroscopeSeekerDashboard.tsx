import React, { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  alpha,
  Avatar,
  Box,
  Button,
  Chip,
  Grid,
  Paper,
  Stack,
  Typography,
} from '@mui/material';
import {
  AccessTime,
  AutoAwesome,
  CalendarMonth,
  CheckCircle,
  Email,
  EditOutlined,
  Phone,
  Print,
  Refresh,
  TrendingUp,
  VerifiedUser,
  WarningAmber,
} from '@mui/icons-material';
import BirthChartWheel from './BirthChartWheel';
import {
  LANGUAGE_FONT_FAMILY,
  type HoroscopeLanguage,
  translateHoroscopeValue,
  translatePlanetName,
} from '../utils/horoscopeLocalization';

const COLORS = {
  primary: '#8B1A2E',
  secondary: '#C9A84C',
  accent: '#1A6B72',
  background: '#FAF7F2',
  textSecondary: '#555555',
};

const LUCKY_COLOR_HEX: Record<string, string> = {
  red: '#E53935',
  maroon: '#8B1A2E',
  pink: '#EC407A',
  orange: '#FB8C00',
  yellow: '#FDD835',
  gold: '#C9A84C',
  green: '#43A047',
  mint: '#66BB6A',
  teal: '#26A69A',
  blue: '#1E88E5',
  'light blue': '#42A5F5',
  indigo: '#5C6BC0',
  purple: '#8E24AA',
  violet: '#AB47BC',
  brown: '#8D6E63',
  black: '#1C1C1C',
  white: '#FFFFFF',
  gray: '#9E9E9E',
};

const HEX_TO_COLOR_NAME: Record<string, string> = {
  '#E53935': 'Red',
  '#FF7043': 'Deep Orange',
  '#43A047': 'Green',
  '#8D6E63': 'Brown',
  '#FDD835': 'Yellow',
  '#29B6F6': 'Sky Blue',
  '#90CAF9': 'Pale Blue',
  '#F8BBD0': 'Blush Pink',
  '#FB8C00': 'Orange',
  '#66BB6A': 'Mint',
  '#26A69A': 'Teal',
  '#EC407A': 'Pink',
  '#AB47BC': 'Violet',
  '#8E24AA': 'Purple',
  '#D32F2F': 'Crimson',
  '#1E88E5': 'Blue',
  '#FFA726': 'Amber',
  '#546E7A': 'Slate',
  '#26C6DA': 'Cyan',
  '#5C6BC0': 'Indigo',
  '#42A5F5': 'Light Blue',
  '#7E57C2': 'Lavender',
  '#8B1A2E': 'Maroon',
  '#C9A84C': 'Gold',
};

type Props = {
  user: any;
  language: HoroscopeLanguage;
  texts: any;
  chartSummary: any;
  chartDetails: any;
  chartHouses: any[];
  chartPlanets: any[];
  chartPositions: any[];
  readingHighlights: any[];
  profileHighlights: any;
  chartMeta: any;
  storedBirthDate: string;
  storedBirthTime: string;
  storedBirthPlace: string;
  storedKnownBirthTime: boolean;
  accuracyNotice: string | null;
  hasCriticalBirthDetailsMissing: boolean;
  error: string | null;
  birthFeedback: { type: 'success' | 'warning'; message: string } | null;
  verification: {
    emailVerified: boolean;
    phoneVerified: boolean;
  };
  verificationEmail: string;
  verificationPhone: string;
  verificationBusyChannel: 'email' | 'phone' | null;
  onRefresh: () => void;
  onRequestVerificationOtp: (channel: 'email' | 'phone') => void;
  onOpenVerifyDialog: (channel: 'email' | 'phone') => void;
  onOpenEditor: () => void;
  onPrint: () => void;
};

type TrendCard = {
  title: string;
  value: string;
  description?: string;
  tone: string;
  series: number[];
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

const getColorHex = (value: string) => {
  const cleaned = String(value || '').trim();
  if (!cleaned) return '#D9D9D9';
  if (/^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(cleaned)) return cleaned;
  return LUCKY_COLOR_HEX[cleaned.toLowerCase()] || '#D9D9D9';
};

const toColorName = (value: string) => {
  const cleaned = String(value || '').trim();
  if (!cleaned) return 'Not available';
  if (/^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(cleaned)) {
    return HEX_TO_COLOR_NAME[cleaned.toUpperCase()] || 'Custom Color';
  }
  return cleaned;
};

export default function HoroscopeSeekerDashboard({
  user,
  language,
  texts,
  chartSummary,
  chartDetails,
  chartHouses,
  chartPlanets,
  chartPositions,
  readingHighlights,
  profileHighlights,
  chartMeta,
  storedBirthDate,
  storedBirthTime,
  storedBirthPlace,
  storedKnownBirthTime,
  accuracyNotice,
  hasCriticalBirthDetailsMissing,
  error,
  birthFeedback,
  verification,
  verificationEmail,
  verificationPhone,
  verificationBusyChannel,
  onRefresh,
  onRequestVerificationOtp,
  onOpenVerifyDialog,
  onOpenEditor,
  onPrint,
}: Props) {
  const [liveTime, setLiveTime] = useState(() => new Date());

  useEffect(() => {
    const timer = window.setInterval(() => setLiveTime(new Date()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  const greeting = useMemo(() => {
    const hour = liveTime.getHours();
    if (hour >= 5 && hour < 12) return 'Good morning';
    if (hour >= 12 && hour < 17) return 'Good afternoon';
    if (hour >= 17 && hour < 21) return 'Good evening';
    return 'Good night';
  }, [liveTime]);

  const headerDate = liveTime.toLocaleDateString('en-US', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  const headerTime = liveTime.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true,
  });

  const avatarSrc = resolveAvatarSrc(
    user?.profilePic,
    user?.personalInfo?.profilePic,
    user?.photos?.find?.((photo: any) => photo?.isMain)?.url,
    user?.photos?.[0]?.url
  );

  const insightItems = (readingHighlights || []).slice(0, 6);
  const luckyColors = profileHighlights?.luckyColors || [];
  const auspiciousDays = profileHighlights?.auspiciousDays || [];
  const favorablePartners = profileHighlights?.favorablePartners || [];
  const profileFacts = profileHighlights?.profileFacts || [];
  const chartGrade = chartSummary?.chartGrade;
  const chartGradeGood = chartGrade?.grade === 'Excellent' || chartGrade?.grade === 'Good';
  const chartGradeColor = chartGradeGood ? COLORS.accent : '#C62828';
  const emailNeedsVerification = !verification?.emailVerified;
  const phoneNeedsVerification = Boolean(verificationPhone) && !verification?.phoneVerified;
  const hasPendingVerification = emailNeedsVerification || phoneNeedsVerification;
  const getEmotionalInsight = (sign: string) => {
    const insights: Record<string, string> = {
      Aries: 'Dynamic and impulsive emotional drive.',
      Taurus: 'Stable and grounded emotional needs.',
      Gemini: 'Versatile and curious emotional expression.',
      Cancer: 'Highly intuitive and sensitive emotional state.',
      Leo: 'Warm and expressive emotional confidence.',
      Virgo: 'Analytical and practical emotional approach.',
      Libra: 'Harmonious and social emotional focus.',
      Scorpio: 'Intense and transformative emotional energy.',
      Sagittarius: 'Optimistic and freedom-seeking emotional outlook.',
      Capricorn: 'Disciplined and reserved emotional structure.',
      Aquarius: 'Original and independent emotional perspective.',
      Pisces: 'Compassionate and imaginative emotional depth.',
    };
    return insights[sign] || 'Emotional patterns influenced by your moon sign.';
  };

  const getVitalityInsight = (sign: string) => {
    const insights: Record<string, string> = {
      Aries: 'High physical energy and assertive drive.',
      Taurus: 'Steady endurance and physical persistence.',
      Gemini: 'Mental vitality and adaptive energy.',
      Cancer: 'Nurturing energy tied to emotional comfort.',
      Leo: 'Radiant vitality and strong creative presence.',
      Virgo: 'Focused energy on health and refinement.',
      Libra: 'Balanced energy through social interaction.',
      Scorpio: 'Resilient and regenerative life force.',
      Sagittarius: 'Expansive and adventurous energy levels.',
      Capricorn: 'Ambitious and disciplined physical focus.',
      Aquarius: 'Unique and community-oriented vitality.',
      Pisces: 'Sensitive and spiritually-attuned energy.',
    };
    return insights[sign] || 'Core vitality shaped by your solar placement.';
  };

  const getCommunicationInsight = (sign: string) => {
    const insights: Record<string, string> = {
      Aries: 'Direct and forceful communication style.',
      Taurus: 'Deliberate and practical verbal expression.',
      Gemini: 'Quick-witted and highly versatile dialogue.',
      Cancer: 'Empathetic and protective communication.',
      Leo: 'Dramatic and authoritative self-expression.',
      Virgo: 'Precise and detailed information sharing.',
      Libra: 'Diplomatic and persuasive conversationalist.',
      Scorpio: 'Profound and investigative mental focus.',
      Sagittarius: 'Honest and philosophically-driven speech.',
      Capricorn: 'Structured and serious intellectual tone.',
      Aquarius: 'Innovative and unconventional thinking.',
      Pisces: 'Poetic and intuitive mental processing.',
    };
    return insights[sign] || 'Communication patterns based on your mercury sign.';
  };

  const generateStableSeries = (seed: string, length = 7) => {
    let hash = 0;
    for (let i = 0; i < seed.length; i++) {
      hash = (hash << 5) - hash + seed.charCodeAt(i);
      hash |= 0;
    }
    const result = [];
    let current = Math.abs(hash % 100);
    for (let i = 0; i < length; i++) {
      result.push(current);
      current = Math.abs((current * 13 + 7) % 100);
    }
    return result;
  };

  const moonSign = chartSummary?.moonSign || '';
  const sunSign = chartSummary?.sunSign || '';
  const mercurySign = chartPositions.find((p: any) => p.planet === 'Mercury')?.sign || '';
  const venusSign = chartPositions.find((p: any) => p.planet === 'Venus')?.sign || '';

  const trendCards: TrendCard[] = [
    {
      title: 'Planetary Balance',
      value: chartGrade?.grade || 'Pending',
      description: chartGrade?.summary || 'Overall harmony of your natal placements.',
      tone: COLORS.accent,
      series: generateStableSeries(chartGrade?.grade || 'balance'),
    },
    {
      title: 'Emotional Rhythm',
      value: translateHoroscopeValue(moonSign || texts.pending, language),
      description: getEmotionalInsight(moonSign),
      tone: '#1565C0',
      series: generateStableSeries(moonSign + 'moon'),
    },
    {
      title: 'Vitality Level',
      value: translateHoroscopeValue(sunSign || texts.pending, language),
      description: getVitalityInsight(sunSign),
      tone: '#E65100',
      series: generateStableSeries(sunSign + 'sun'),
    },
    {
      title: 'Mental Clarity',
      value: translateHoroscopeValue(mercurySign || texts.pending, language),
      description: getCommunicationInsight(mercurySign),
      tone: '#00838F',
      series: generateStableSeries(mercurySign + 'mercury'),
    },
    {
      title: 'Focus Strength',
      value: chartSummary?.auspiciousTime || texts.pending,
      description: 'Your daily peak for important decisions.',
      tone: '#7A6020',
      series: generateStableSeries(chartSummary?.auspiciousTime || 'focus'),
    },
  ];

  const scrollToSection = (id: string) => {
    const section = document.getElementById(id);
    if (section) {
      section.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const buildSparkPath = (series: number[], width: number, height: number) => {
    const max = Math.max(...series);
    const min = Math.min(...series);
    const range = max - min || 1;

    return series
      .map((point, index) => {
        const x = (index / (series.length - 1)) * width;
        const y = height - ((point - min) / range) * height;
        return `${index === 0 ? 'M' : 'L'}${x.toFixed(2)},${y.toFixed(2)}`;
      })
      .join(' ');
  };

  return (
    <Box sx={{ p: { xs: 2, md: 4 }, maxWidth: 1360, mx: 'auto', minHeight: '100vh', bgcolor: alpha(COLORS.background, 0.85), position: 'relative' }}>
      <Paper
        sx={{
          p: { xs: 2, md: 3 },
          mb: 3,
          borderRadius: '24px',
          background: 'linear-gradient(135deg, rgba(139,26,46,0.08) 0%, rgba(201,168,76,0.18) 100%)',
          border: '1px solid rgba(139,26,46,0.14)',
          boxShadow: '0 12px 30px rgba(139,26,46,0.08)',
        }}
      >
        <Stack direction={{ xs: 'column', lg: 'row' }} spacing={2} alignItems={{ xs: 'flex-start', lg: 'center' }} justifyContent="space-between">
          <Stack direction="row" spacing={2} alignItems="center" sx={{ minWidth: 0 }}>
            <Avatar
              src={avatarSrc}
              alt={user?.name || 'Seeker'}
              sx={{
                width: 68,
                height: 68,
                border: `3px solid ${alpha(COLORS.secondary, 0.55)}`,
                bgcolor: alpha(COLORS.secondary, 0.2),
                color: COLORS.primary,
                fontWeight: 800,
                boxShadow: '0 8px 24px rgba(139,26,46,0.14)',
              }}
            >
              {(user?.name || 'S').charAt(0).toUpperCase()}
            </Avatar>
            <Box sx={{ minWidth: 0 }}>
              <Typography variant="h4" sx={{ fontFamily: 'Playfair Display', fontWeight: 800, color: COLORS.primary, lineHeight: 1.15 }}>
                {greeting}, {(user?.name || 'Seeker').split(' ')[0]}
              </Typography>
              <Typography variant="body2" sx={{ color: COLORS.textSecondary, mt: 0.5 }}>
                Your Horoscope Dashboard
              </Typography>
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} useFlexGap flexWrap="wrap" sx={{ mt: 1.25, width: '100%', minWidth: 0, alignItems: { xs: 'stretch', sm: 'center' } }}>
                <Box sx={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 0.75, px: 1.25, py: 0.6, width: { xs: '100%', sm: 'auto' }, maxWidth: '100%', minWidth: 0, boxSizing: 'border-box', overflow: 'hidden', borderRadius: { xs: '16px', sm: '999px' }, bgcolor: alpha(COLORS.accent, 0.1), border: `1px solid ${alpha(COLORS.accent, 0.24)}` }}>
                  <CalendarMonth sx={{ fontSize: 16, color: COLORS.accent }} />
                  <Typography variant="body2" sx={{ color: COLORS.accent, fontWeight: 700, overflowWrap: 'anywhere', minWidth: 0, flex: '1 1 auto' }}>{headerDate}</Typography>
                  <Box component="span" sx={{ color: COLORS.accent, fontWeight: 800, fontFamily: 'monospace', fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap', display: 'inline-block', flexBasis: { xs: '100%', sm: 'auto' } }}>
                    {headerTime}
                  </Box>
                </Box>
                <Chip label={`${chartSummary?.nakshatra || texts.pending} Nakshatra`} sx={{ bgcolor: COLORS.secondary, color: COLORS.primary, fontWeight: 700, maxWidth: '100%', height: 'auto', '& .MuiChip-label': { whiteSpace: 'normal', lineHeight: 1.2, py: 0.5, overflowWrap: 'anywhere' } }} />
                <Chip label={`Gana: ${translateHoroscopeValue(chartSummary?.gana || texts.pending, language)}`} sx={{ bgcolor: alpha(COLORS.accent, 0.12), color: COLORS.accent, fontWeight: 800, maxWidth: '100%', height: 'auto', '& .MuiChip-label': { whiteSpace: 'normal', lineHeight: 1.2, py: 0.5, overflowWrap: 'anywhere' } }} />
                <Chip label={`ලග්නය (Ascendant): ${chartSummary?.ascendant ? translateHoroscopeValue(chartSummary.ascendant, language) + ' (' + chartSummary.ascendant + ')' : texts.pending}`} sx={{ bgcolor: alpha(COLORS.primary, 0.08), color: COLORS.primary, fontWeight: 800, maxWidth: '100%', height: 'auto', '& .MuiChip-label': { fontFamily: '"Noto Sans Sinhala", "Iskoola Pota", "Segoe UI", sans-serif', whiteSpace: 'normal', lineHeight: 1.2, py: 0.5, overflowWrap: 'anywhere' } }} />
                <Chip label={`Today's Focus: ${chartSummary?.auspiciousTime || texts.pending}`} sx={{ bgcolor: alpha(COLORS.secondary, 0.22), color: COLORS.primary, fontWeight: 800, maxWidth: '100%', height: 'auto', '& .MuiChip-label': { whiteSpace: 'normal', lineHeight: 1.2, py: 0.5, overflowWrap: 'anywhere' } }} />
              </Stack>
            </Box>
          </Stack>

          <Stack direction={{ xs: 'row', md: 'row' }} spacing={1} sx={{ width: { xs: '100%', lg: 'auto' }, justifyContent: { xs: 'space-between', lg: 'flex-end' } }}>
            <Button variant="outlined" startIcon={<Refresh />} onClick={onRefresh} sx={{ borderRadius: '12px', borderColor: COLORS.secondary, color: COLORS.secondary }}>
              Refresh
            </Button>
            <Button variant="outlined" startIcon={<EditOutlined />} onClick={onOpenEditor} sx={{ borderRadius: '12px', borderColor: COLORS.primary, color: COLORS.primary }}>
              Birth Details
            </Button>
            <Button variant="outlined" startIcon={<Print />} onClick={onPrint} sx={{ borderRadius: '12px' }}>
              Print
            </Button>
          </Stack>
        </Stack>
      </Paper>

      {error && <Alert severity="error" sx={{ mb: 2, borderRadius: '12px' }}>{error}</Alert>}
      {birthFeedback && <Alert severity={birthFeedback.type} sx={{ mb: 2, borderRadius: '12px' }}>{birthFeedback.message}</Alert>}
      {accuracyNotice && (
        <Alert severity={hasCriticalBirthDetailsMissing ? 'info' : 'warning'} sx={{ mb: 2, borderRadius: '12px' }}>
          {accuracyNotice}
        </Alert>
      )}

      {hasPendingVerification && (
        <Paper sx={{ p: 3, borderRadius: '20px', mb: 3.5, border: `1px solid ${alpha('#B26A00', 0.24)}`, bgcolor: '#FFFBF2' }}>
          <Stack direction={{ xs: 'column', md: 'row' }} spacing={1.5} justifyContent="space-between" alignItems={{ xs: 'flex-start', md: 'center' }}>
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 800, color: COLORS.primary }}>
                Pending Verification
              </Typography>
              <Typography variant="body2" sx={{ color: COLORS.textSecondary, mt: 0.4 }}>
                Verify your contact details to keep your account fully secure.
              </Typography>
            </Box>
            <Chip icon={<VerifiedUser />} label="Action Needed" sx={{ bgcolor: '#FFF3E0', color: '#B26A00', fontWeight: 700 }} />
          </Stack>

          <Stack spacing={2} sx={{ mt: 2.25 }}>
            {emailNeedsVerification && (
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.25} alignItems={{ xs: 'flex-start', sm: 'center' }}>
                <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 1, minWidth: { sm: 280 } }}>
                  <Email sx={{ color: COLORS.primary, fontSize: 18 }} />
                  <Typography variant="body2" sx={{ color: COLORS.textPrimary }}>
                    Verify email: {verificationEmail || 'Not available'}
                  </Typography>
                </Box>
                <Button
                  variant="outlined"
                  onClick={() => onRequestVerificationOtp('email')}
                  disabled={verificationBusyChannel === 'email'}
                  sx={{ borderRadius: '10px' }}
                >
                  {verificationBusyChannel === 'email' ? 'Sending...' : 'Send OTP'}
                </Button>
                <Button
                  variant="contained"
                  onClick={() => onOpenVerifyDialog('email')}
                  sx={{ borderRadius: '10px', bgcolor: COLORS.primary }}
                >
                  Enter OTP
                </Button>
              </Stack>
            )}

            {phoneNeedsVerification && (
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.25} alignItems={{ xs: 'flex-start', sm: 'center' }}>
                <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 1, minWidth: { sm: 280 } }}>
                  <Phone sx={{ color: COLORS.accent, fontSize: 18 }} />
                  <Typography variant="body2" sx={{ color: COLORS.textPrimary }}>
                    Verify phone: {verificationPhone}
                  </Typography>
                </Box>
                <Button
                  variant="outlined"
                  onClick={() => onRequestVerificationOtp('phone')}
                  disabled={verificationBusyChannel === 'phone'}
                  sx={{ borderRadius: '10px' }}
                >
                  {verificationBusyChannel === 'phone' ? 'Sending...' : 'Send OTP'}
                </Button>
                <Button
                  variant="contained"
                  onClick={() => onOpenVerifyDialog('phone')}
                  sx={{ borderRadius: '10px', bgcolor: COLORS.primary }}
                >
                  Enter OTP
                </Button>
              </Stack>
            )}
          </Stack>
        </Paper>
      )}

      <Grid container spacing={3} alignItems="flex-start">
        <Grid size={{ xs: 12 }}>
          <Grid container spacing={2} sx={{ mb: 2.5 }}>
            <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
              <Paper
                sx={{
                  p: 2,
                  borderRadius: '16px',
                  border: `1px solid ${alpha(chartGradeColor, 0.25)}`,
                  bgcolor: alpha(chartGradeColor, 0.06),
                  height: '100%',
                }}
              >
                <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 0.75 }}>
                  {chartGradeGood ? <CheckCircle sx={{ fontSize: 18, color: chartGradeColor }} /> : <WarningAmber sx={{ fontSize: 18, color: chartGradeColor }} />}
                  <Typography variant="caption" sx={{ fontWeight: 800, color: chartGradeColor, letterSpacing: 0.7 }}>
                    CHART QUALITY
                  </Typography>
                </Stack>
                <Typography variant="h6" sx={{ fontWeight: 900, color: chartGradeColor, lineHeight: 1.1 }}>
                  {chartGrade?.grade || 'Pending'}
                </Typography>
                <Typography variant="caption" sx={{ color: COLORS.textSecondary }}>
                  {chartGrade?.summary || 'Quality details will appear after chart refresh.'}
                </Typography>
              </Paper>
            </Grid>

            <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
              <Paper sx={{ p: 2, borderRadius: '16px', border: `1px solid ${alpha(COLORS.primary, 0.14)}`, height: '100%' }}>
                <Typography variant="caption" sx={{ fontWeight: 800, color: COLORS.textSecondary, letterSpacing: 0.7 }}>
                  ASCENDANT
                </Typography>
                <Typography variant="h6" sx={{ fontWeight: 900, color: COLORS.primary, mt: 0.4 }}>
                  {translateHoroscopeValue(chartSummary?.ascendant || texts.pending, language)}
                </Typography>
              </Paper>
            </Grid>

            <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
              <Paper sx={{ p: 2, borderRadius: '16px', border: `1px solid ${alpha(COLORS.secondary, 0.2)}`, bgcolor: alpha(COLORS.secondary, 0.08), height: '100%' }}>
                <Typography variant="caption" sx={{ fontWeight: 800, color: '#7A6020', letterSpacing: 0.7 }}>
                  NAKSHATRA
                </Typography>
                <Typography variant="h6" sx={{ fontWeight: 900, color: COLORS.primary, mt: 0.4 }}>
                  {translateHoroscopeValue(chartSummary?.nakshatra || texts.pending, language)}
                </Typography>
              </Paper>
            </Grid>

            <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
              <Paper sx={{ p: 2, borderRadius: '16px', border: `1px solid ${alpha(COLORS.accent, 0.2)}`, bgcolor: alpha(COLORS.accent, 0.06), height: '100%' }}>
                <Typography variant="caption" sx={{ fontWeight: 800, color: COLORS.accent, letterSpacing: 0.7 }}>
                  TODAYS FOCUS
                </Typography>
                <Typography variant="h6" sx={{ fontWeight: 900, color: COLORS.accent, mt: 0.4 }}>
                  {chartSummary?.auspiciousTime || texts.pending}
                </Typography>
              </Paper>
            </Grid>
          </Grid>

          <Grid container spacing={3}>
            <Grid size={{ xs: 12, xl: 8 }}>
              <Paper id="seeker-chart" sx={{ p: { xs: 2, md: 3 }, borderRadius: '24px', border: '1px solid', borderColor: COLORS.background, boxShadow: '0 8px 28px rgba(139,26,46,0.05)' }}>
                <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 2 }}>
                  <AutoAwesome sx={{ fontSize: 18, color: COLORS.primary }} />
                  <Typography variant="h6" sx={{ fontWeight: 800, color: COLORS.primary, fontFamily: LANGUAGE_FONT_FAMILY[language] }}>
                    Birth Chart Overview
                  </Typography>
                </Stack>
                <BirthChartWheel planets={chartPlanets} ascendant={chartSummary?.ascendant || texts.pending} language={language} />

                <Grid container spacing={1.5} sx={{ mt: 2 }}>
                  {[
                    { label: 'Moon Sign', value: translateHoroscopeValue(chartSummary?.moonSign || texts.pending, language) },
                    { label: 'Nakshatra', value: translateHoroscopeValue(chartSummary?.nakshatra || texts.pending, language) },
                    { label: 'Ascendant', value: translateHoroscopeValue(chartSummary?.ascendant || texts.pending, language) },
                    { label: 'Sun Sign', value: translateHoroscopeValue(chartSummary?.sunSign || texts.pending, language) },
                  ].map((item) => (
                    <Grid size={{ xs: 12, sm: 6 }} key={item.label}>
                      <Box sx={{ p: 1.5, borderRadius: '14px', bgcolor: COLORS.background }}>
                        <Typography variant="caption" sx={{ display: 'block', color: COLORS.textSecondary, fontWeight: 700 }}>{item.label}</Typography>
                        <Typography variant="body1" sx={{ color: COLORS.primary, fontWeight: 800 }}>{item.value}</Typography>
                      </Box>
                    </Grid>
                  ))}
                </Grid>
              </Paper>
            </Grid>

            <Grid size={{ xs: 12, xl: 4 }}>
              <Paper
                id="seeker-trends"
                sx={{
                  p: 3,
                  borderRadius: '24px',
                  border: '1px solid',
                  borderColor: alpha(COLORS.primary, 0.08),
                  background: `linear-gradient(180deg, #FFFFFF 0%, ${alpha(COLORS.background, 0.4)} 100%)`,
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                }}
              >
                <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 2.5 }}>
                  <TrendingUp sx={{ fontSize: 20, color: COLORS.primary }} />
                  <Typography variant="h6" sx={{ fontWeight: 800, color: COLORS.primary }}>
                    Trend Signals
                  </Typography>
                </Stack>

                <Stack spacing={2} sx={{ flexGrow: 1 }}>
                  {trendCards.map((card) => (
                    <Box
                      key={card.title}
                      sx={{
                        p: 2,
                        borderRadius: '16px',
                        bgcolor: alpha(card.tone, 0.04),
                        border: `1px solid ${alpha(card.tone, 0.15)}`,
                        transition: 'transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out',
                        '&:hover': {
                          transform: 'translateY(-2px)',
                          boxShadow: `0 4px 12px ${alpha(card.tone, 0.1)}`,
                        },
                      }}
                    >
                      <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 1 }}>
                        <Box>
                          <Typography variant="caption" sx={{ color: COLORS.textSecondary, fontWeight: 800, letterSpacing: 0.5, display: 'block' }}>
                            {card.title.toUpperCase()}
                          </Typography>
                          <Typography variant="body1" sx={{ color: card.tone, fontWeight: 900 }}>
                            {card.value}
                          </Typography>
                        </Box>
                        <svg viewBox="0 0 80 30" width="80" height="30" preserveAspectRatio="none" aria-hidden>
                          <path
                            d={buildSparkPath(card.series, 80, 30)}
                            fill="none"
                            stroke={card.tone}
                            strokeWidth="2.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                      </Stack>
                      {card.description && (
                        <Typography variant="caption" sx={{ color: COLORS.textSecondary, lineHeight: 1.4, display: 'block', mt: 0.5 }}>
                          {card.description}
                        </Typography>
                      )}
                    </Box>
                  ))}
                </Stack>

                <Box sx={{ mt: 3, pt: 2, borderTop: `1px dashed ${alpha(COLORS.primary, 0.1)}` }}>
                  <Typography variant="caption" sx={{ color: COLORS.textSecondary, fontStyle: 'italic', display: 'block', textAlign: 'center' }}>
                    Derived from your unique planetary configurations at birth.
                  </Typography>
                </Box>
              </Paper>
            </Grid>

            <Grid size={{ xs: 12, lg: 7 }} sx={{ order: { xs: 3, lg: 1 } }}>
              <Paper id="seeker-planets" sx={{ p: 2.5, borderRadius: '20px', border: '1px solid', borderColor: COLORS.background }}>
                <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1.5 }}>
                  <TrendingUp sx={{ fontSize: 18, color: COLORS.accent }} />
                  <Typography variant="subtitle1" sx={{ fontWeight: 800, color: COLORS.primary }}>Planetary Positions</Typography>
                </Stack>
                <Stack spacing={1}>
                  {chartPositions.slice(0, 10).map((position: any) => (
                    <Box key={`${position.planet}-${position.house}-${position.sign}`} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', py: 1, borderBottom: `1px solid ${alpha(COLORS.primary, 0.08)}` }}>
                      <Typography variant="body2" sx={{ fontWeight: 700 }}>{translatePlanetName(position.planet, language)}</Typography>
                      <Typography variant="body2" sx={{ color: COLORS.textSecondary }}>
                        {translateHoroscopeValue(position.sign, language)} | H{position.house} | {position.degree}
                      </Typography>
                    </Box>
                  ))}
                </Stack>
              </Paper>

              <Paper sx={{ p: 2.5, mt: 2, borderRadius: '20px', border: '1px solid', borderColor: COLORS.background }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 800, color: COLORS.primary, mb: 1.5, fontFamily: LANGUAGE_FONT_FAMILY[language] }}>
                  Traditional Sri Lankan Horoscope Details
                </Typography>

                <Grid container spacing={1.25}>
                  {[
                    { label: texts.gana || 'Gana', value: translateHoroscopeValue(chartDetails?.gana || texts.pending, language) },
                    { label: texts.nakshatraPada || 'Nakshatra Pada', value: chartDetails?.nakshatraPada ? `Pada ${chartDetails.nakshatraPada}` : texts.pending },
                    { label: texts.ascendant || 'Ascendant', value: translateHoroscopeValue(chartSummary?.ascendant || texts.pending, language) },
                    { label: texts.tithi || 'Tithi', value: translateHoroscopeValue(chartDetails?.tithi || texts.pending, language) },
                    { label: texts.paksha || 'Paksha', value: translateHoroscopeValue(chartDetails?.paksha || texts.pending, language) },
                    { label: texts.yoga || 'Yoga', value: translateHoroscopeValue(chartDetails?.yoga || texts.pending, language) },
                    { label: texts.karana || 'Karana', value: translateHoroscopeValue(chartDetails?.karana || texts.pending, language) },
                    { label: texts.vedicDay || 'Vedic Day', value: translateHoroscopeValue(chartDetails?.vedicDay || texts.pending, language) },
                  ].map((item) => (
                    <Grid size={{ xs: 12, sm: 6 }} key={item.label}>
                      <Box sx={{ p: 1.3, borderRadius: '12px', bgcolor: COLORS.background, height: '100%' }}>
                        <Typography variant="caption" sx={{ display: 'block', color: COLORS.textSecondary, fontWeight: 700 }}>
                          {item.label}
                        </Typography>
                        <Typography variant="body2" sx={{ color: COLORS.primary, fontWeight: 800 }}>
                          {item.value}
                        </Typography>
                      </Box>
                    </Grid>
                  ))}
                </Grid>

                {!!chartHouses?.length && (
                  <Box sx={{ mt: 1.75 }}>
                    <Typography variant="caption" sx={{ color: COLORS.textSecondary, fontWeight: 700, display: 'block', mb: 0.75 }}>
                      House Overview
                    </Typography>
                    <Grid container spacing={1}>
                      {chartHouses.slice(0, 6).map((house: any) => (
                        <Grid size={{ xs: 12, sm: 6, md: 4 }} key={`house-${house.house}-${house.sign}`}>
                          <Box sx={{ p: 1.1, borderRadius: '10px', border: `1px solid ${alpha(COLORS.primary, 0.12)}` }}>
                            <Typography variant="caption" sx={{ color: COLORS.textSecondary, fontWeight: 700 }}>
                              H{house.house}
                            </Typography>
                            <Typography variant="body2" sx={{ color: COLORS.primary, fontWeight: 800 }}>
                              {translateHoroscopeValue(house.sign, language)}
                            </Typography>
                          </Box>
                        </Grid>
                      ))}
                    </Grid>
                  </Box>
                )}
              </Paper>
            </Grid>

            <Grid size={{ xs: 12, lg: 5 }} sx={{ order: { xs: 2, lg: 2 } }}>
              <Stack spacing={2}>
                <Paper id="seeker-snapshot" sx={{ p: 2.5, borderRadius: '20px', border: '1px solid', borderColor: COLORS.background }}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 800, color: COLORS.primary, mb: 1 }}>Birth Snapshot</Typography>
                  <Stack spacing={1}>
                    <Chip label={`Date: ${storedBirthDate || texts.birthDateNeeded}`} variant="outlined" />
                    <Chip label={`Time: ${storedKnownBirthTime ? (storedBirthTime || texts.birthTimeNeeded) : 'Approximate (12:00 used)'}`} variant="outlined" />
                    <Chip label={`Place: ${storedBirthPlace || texts.birthPlaceNeeded}`} variant="outlined" />
                    <Chip label={`Last refreshed: ${chartMeta?.generatedAt ? new Date(chartMeta.generatedAt).toLocaleDateString('en-LK') : 'recently'}`} icon={<AutoAwesome />} sx={{ bgcolor: alpha(COLORS.secondary, 0.16), color: COLORS.primary, fontWeight: 700 }} />
                  </Stack>
                </Paper>

                <Paper id="seeker-highlights" sx={{ p: 2.5, borderRadius: '20px', border: '1px solid', borderColor: COLORS.background }}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 800, color: COLORS.primary, mb: 1 }}>Profile Highlights</Typography>
                  <Stack spacing={1.5}>
                    <Box>
                      <Typography variant="caption" sx={{ display: 'block', color: COLORS.textSecondary, fontWeight: 800, letterSpacing: 0.5, mb: 0.5 }}>
                        Lucky Colors
                      </Typography>
                      <Typography variant="caption" sx={{ display: 'block', color: COLORS.textSecondary, mb: 0.8 }}>
                        Colors considered supportive for your daily choices and personal energy.
                      </Typography>
                      <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
                        {(luckyColors.length ? luckyColors : ['Not available']).map((value: string) => (
                          <Chip
                            key={`color-${value}`}
                            label={toColorName(value)}
                            size="small"
                            avatar={
                              <Avatar
                                sx={{
                                  width: 18,
                                  height: 18,
                                  bgcolor: getColorHex(value),
                                  border: '1px solid rgba(0,0,0,0.16)',
                                }}
                              />
                            }
                            sx={{ bgcolor: alpha(COLORS.accent, 0.1), color: COLORS.accent, fontWeight: 700 }}
                          />
                        ))}
                      </Stack>
                    </Box>

                    <Box>
                      <Typography variant="caption" sx={{ display: 'block', color: COLORS.textSecondary, fontWeight: 800, letterSpacing: 0.5, mb: 0.5 }}>
                        Auspicious Days
                      </Typography>
                      <Typography variant="caption" sx={{ display: 'block', color: COLORS.textSecondary, mb: 0.8 }}>
                        Days that are generally better aligned for important activities.
                      </Typography>
                      <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
                        {(auspiciousDays.length ? auspiciousDays : ['Not available']).map((value: string) => (
                          <Chip key={`day-${value}`} label={value} size="small" sx={{ bgcolor: alpha(COLORS.secondary, 0.2), color: COLORS.primary, fontWeight: 700 }} />
                        ))}
                      </Stack>
                    </Box>

                    <Box>
                      <Typography variant="caption" sx={{ display: 'block', color: COLORS.textSecondary, fontWeight: 800, letterSpacing: 0.5, mb: 0.5 }}>
                        Favorable Partner Signs
                      </Typography>
                      <Typography variant="caption" sx={{ display: 'block', color: COLORS.textSecondary, mb: 0.8 }}>
                        Signs that may naturally align better with your chart tendencies.
                      </Typography>
                      <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
                        {(favorablePartners.length ? favorablePartners : ['Not available']).map((value: string) => (
                          <Chip key={`partner-${value}`} label={value} size="small" sx={{ bgcolor: alpha(COLORS.primary, 0.1), color: COLORS.primary, fontWeight: 700 }} />
                        ))}
                      </Stack>
                    </Box>

                    <Box>
                      <Typography variant="caption" sx={{ display: 'block', color: COLORS.textSecondary, fontWeight: 800, letterSpacing: 0.5, mb: 0.5 }}>
                        Personal Notes
                      </Typography>
                      <Typography variant="caption" sx={{ display: 'block', color: COLORS.textSecondary, mb: 0.8 }}>
                        Quick horoscope-based notes generated from your profile.
                      </Typography>
                      <Stack spacing={0.9}>
                        {(profileFacts.length ? profileFacts : ['Not available']).map((value: string) => (
                          <Box
                            key={`fact-${value}`}
                            sx={{
                              p: 1.1,
                              borderRadius: '10px',
                              bgcolor: alpha('#1565C0', 0.08),
                              border: `1px solid ${alpha('#1565C0', 0.22)}`,
                            }}
                          >
                            <Typography variant="body2" sx={{ color: '#0F4FA8', lineHeight: 1.55 }}>
                              {value}
                            </Typography>
                          </Box>
                        ))}
                      </Stack>
                    </Box>
                  </Stack>
                </Paper>
              </Stack>
            </Grid>

            <Grid size={{ xs: 12 }} sx={{ order: 4 }}>
              <Paper id="seeker-insights" sx={{ p: 2.5, borderRadius: '20px', border: '1px solid', borderColor: COLORS.background }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 800, color: COLORS.primary, mb: 1.5 }}>Today's Insights</Typography>
                <Grid container spacing={1.25}>
                  {(insightItems.length ? insightItems : ['Your chart is loading personalized insights.']).map((insight: any, idx: number) => (
                    <Grid size={{ xs: 12, md: 6 }} key={typeof insight === 'string' ? insight : `insight-${idx}`}>
                      <Box sx={{ p: 1.5, borderRadius: '12px', bgcolor: alpha(COLORS.primary, 0.04), border: `1px solid ${alpha(COLORS.primary, 0.12)}` }}>
                        <Typography variant="body2" sx={{ color: COLORS.textSecondary }}>
                          {typeof insight === 'string' ? insight : insight?.text || insight?.title || 'Insight available in your chart.'}
                        </Typography>
                      </Box>
                    </Grid>
                  ))}
                </Grid>
              </Paper>
            </Grid>
          </Grid>
        </Grid>
      </Grid>
    </Box>
  );
}
