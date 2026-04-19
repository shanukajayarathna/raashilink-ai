import React from 'react';
import {
  Drawer,
  Box,
  Typography,
  IconButton,
  Stack,
  Chip,
  LinearProgress,
  Divider,
  Button,
  Grid,
  CircularProgress,
  Alert,
  Avatar,
} from '@mui/material';
import {
  X, Heart, MessageCircle, MapPin, Star, Sparkles, Brain, Leaf,
  User, Ruler, BookOpen, Church, Globe, Briefcase, Cigarette, Wine, Utensils,
} from 'lucide-react';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, ResponsiveContainer } from 'recharts';
import { motion, AnimatePresence } from 'motion/react';
import matchService from '../services/matchService';

interface MatchDetailPanelProps {
  matchId: string | null;
  open: boolean;
  onClose: () => void;
  onSendMessage: (id: string) => void;
  onExpressInterest: (id: string) => void;
  previewImage?: string | null;
  previewScore?: number | null;
  previewBand?: string | null;
  onScoreResolved?: (id: string, score: number, band: string) => void;
}

export default function MatchDetailPanel({
  matchId,
  open,
  onClose,
  onSendMessage,
  onExpressInterest,
  previewImage,
  previewScore,
  previewBand,
  onScoreResolved,
}: MatchDetailPanelProps) {
  const [activePhoto, setActivePhoto] = React.useState(0);
  const [detail, setDetail] = React.useState<any>(null);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [imageError, setImageError] = React.useState(false);
  const [showNotMatchedAlert, setShowNotMatchedAlert] = React.useState(false);

  React.useEffect(() => {
    if (!open || !matchId) return;

    let isMounted = true;

    const loadDetail = async () => {
      setLoading(true);
      setError(null);

      try {
        const response = await matchService.getMatchDetail(matchId);
        if (isMounted) {
          setDetail(response.data);
          setActivePhoto(0);
          setImageError(false);
          // Notify parent so the card in the list updates to the real score
          if (onScoreResolved && response.data?.score != null && response.data?.band) {
            onScoreResolved(matchId, response.data.score, response.data.band);
          }
        }
      } catch (err: any) {
        if (isMounted) {
          setError(err.response?.data?.message || 'Failed to load match details.');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadDetail();

    return () => {
      isMounted = false;
    };
  }, [open, matchId]);

  if (!matchId) return null;

  const validPhotos = (detail?.photos || []).filter(Boolean);
  const mainPic = detail?.profileImage || detail?.profilePic || previewImage || null;
  const availablePhotos = !imageError && (validPhotos.length ? validPhotos : mainPic ? [mainPic] : []);
  const hasPhoto = availablePhotos && availablePhotos.length > 0;
  // Use detail score once loaded, fall back to card's score while loading
  const displayScore = detail?.score ?? previewScore ?? null;
  const displayBand = detail?.band ?? previewBand ?? null;
  const hobbies = detail?.lifestyle?.hobbies || [];
  const displayAge = typeof detail?.age === 'number' ? `, ${detail.age}` : '';

  // Helper to display "Not provided" for empty values
  const val = (v: any) => (v && String(v).trim() && v !== 'Not provided' ? v : 'Not provided');

  // Profile details grid items
  const profileDetails = detail ? [
    { icon: <User size={15} />, label: 'Gender', value: val(detail.gender) },
    { icon: <Ruler size={15} />, label: 'Height', value: (() => { const h = val(detail.height); if (h === 'Not provided') return h; const n = String(h).replace(/\s*cm$/i, '').trim(); return n ? `${n} cm` : h; })() },
    { icon: <Globe size={15} />, label: 'Ethnicity', value: val(detail.ethnicity) },
    { icon: <BookOpen size={15} />, label: 'Education', value: val(detail.education) },
    { icon: <Church size={15} />, label: 'Religion', value: val(detail.religion) },
    { icon: <Briefcase size={15} />, label: 'Occupation', value: val(detail.job) },
  ] : [];

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      PaperProps={{
        sx: {
          width: { xs: '100%', sm: 500, md: 600 },
          bgcolor: 'background.default',
          borderTopLeftRadius: { xs: 24, sm: 0 },
          borderBottomLeftRadius: { xs: 24, sm: 0 },
          overflow: 'hidden',
        },
      }}
    >
      <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
        <Box
          sx={{
            p: 2,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            bgcolor: 'white',
            borderBottom: '1px solid',
            borderColor: 'divider',
          }}
        >
          <Typography variant="h6" sx={{ fontFamily: 'FONTS.heading', fontWeight: 'bold', color: 'primary.main' }}>
            Profile Details
          </Typography>
          <IconButton onClick={onClose}>
            <X size={20} />
          </IconButton>
        </Box>

        <Box sx={{ flex: 1, overflowY: 'auto', p: 3, display: 'flex', flexDirection: 'column', gap: 2.5 }}>
          {loading && (
            <Box sx={{ py: 12, textAlign: 'center' }}>
              <CircularProgress />
            </Box>
          )}

          {!loading && error && <Alert severity="error">{error}</Alert>}

          {!loading && !error && detail && (
            <>
              {/* ── Hero: profile photo ───────────────────────────────── */}
              <Box sx={{ position: 'relative', borderRadius: 5, overflow: 'hidden', width: '100%', aspectRatio: '1 / 0.85', minHeight: 260, bgcolor: 'grey.200' }}>
                {hasPhoto ? (
                  <>
                    <AnimatePresence mode="wait">
                      <motion.img
                        key={activePhoto}
                        src={availablePhotos[activePhoto]}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'top center' }}
                        referrerPolicy="no-referrer"
                        onError={() => setImageError(true)}
                      />
                    </AnimatePresence>
                  </>
                ) : (
                  /* No photo — large avatar */
                  <Box
                    sx={{
                      height: '100%',
                      background: 'linear-gradient(135deg, #8B1A2E 0%, #C9A84C 100%)',
                      display: 'flex',
                      alignItems: 'center', justifyContent: 'center',
                    }}
                  >
                    <Avatar
                      sx={{
                        width: 100, height: 100,
                        bgcolor: 'rgba(255,255,255,0.15)',
                        fontSize: '2.5rem', fontWeight: 800, color: '#fff',
                        border: '3px solid rgba(255,255,255,0.35)',
                      }}
                    >
                      {detail.initials || 'RL'}
                    </Avatar>
                  </Box>
                )}

                {/* Photo dots */}
                {availablePhotos.length > 1 && (
                  <Box sx={{ position: 'absolute', bottom: 10, left: 0, right: 0, display: 'flex', justifyContent: 'center', gap: 1 }}>
                    {availablePhotos.map((_: string, index: number) => (
                      <Box
                        key={index}
                        onClick={() => setActivePhoto(index)}
                        sx={{
                          width: 7, height: 7, borderRadius: '50%',
                          bgcolor: activePhoto === index ? 'secondary.main' : 'rgba(255,255,255,0.6)',
                          cursor: 'pointer',
                        }}
                      />
                    ))}
                  </Box>
                )}

                {/* Compatibility badge */}
                <Box
                  sx={{
                    position: 'absolute', top: 12, right: 12,
                    width: 56, height: 56, borderRadius: '50%',
                    background: 'linear-gradient(135deg, #8B1A2E, #C9A84C)',
                    display: 'flex', flexDirection: 'column',
                    alignItems: 'center', justifyContent: 'center',
                    boxShadow: '0 3px 12px rgba(0,0,0,0.3)',
                  }}
                >
                  <Typography sx={{ fontSize: '1rem', fontWeight: 900, color: '#fff', lineHeight: 1 }}>
                    {displayScore ?? '—'}
                  </Typography>
                  <Typography sx={{ fontSize: '0.55rem', color: 'rgba(255,255,255,0.9)' }}>%</Typography>
                </Box>
              </Box>

              {/* ── Name, tagline, location + band chips ─────────────── */}
              <Box>
                <Typography variant="h5" sx={{ fontWeight: 800, lineHeight: 1.2, color: 'text.primary' }}>
                  {detail.name}{displayAge}
                </Typography>
                {detail.tagline && detail.tagline !== 'Not provided' && (
                  <Typography variant="body2" sx={{ color: 'text.secondary', fontStyle: 'italic', mt: 0.5 }}>
                    "{detail.tagline}"
                  </Typography>
                )}
                {detail.location && detail.location !== 'Not provided' && (
                  <Stack direction="row" spacing={0.5} alignItems="center" sx={{ mt: 0.5 }}>
                    <MapPin size={13} color="text.secondary" />
                    <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                      {detail.location}
                    </Typography>
                  </Stack>
                )}
                <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
                  <Chip
                    label={displayBand ?? detail.band}
                    size="small"
                    sx={{ bgcolor: 'secondary.main', color: 'primary.main', fontWeight: 700, fontSize: '0.7rem' }}
                  />
                  {detail.mutualMatch && (
                    <Chip
                      icon={<Heart size={12} fill="currentColor" />}
                      label="Mutual Match"
                      size="small"
                      sx={{ bgcolor: '#fce4ec', color: '#c62828', fontWeight: 700, fontSize: '0.7rem' }}
                    />
                  )}
                </Stack>
              </Box>

              {/* ── Bio ────────────────────────────────────────────────── */}
              {detail.bio && detail.bio !== 'Not provided' && (
                <Box sx={{ p: 2.5, bgcolor: 'primary.50', borderRadius: 4 }}>
                  <Typography variant="body2" sx={{ color: 'text.secondary', lineHeight: 1.7, fontStyle: 'italic' }}>
                    "{detail.bio}"
                  </Typography>
                </Box>
              )}

              <Divider />

              {/* ── Profile Details grid ───────────────────────────────── */}
              <Box>
                <Typography
                  variant="subtitle1"
                  sx={{ fontWeight: 700, color: 'primary.main', mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}
                >
                  <User size={18} /> Profile Details
                </Typography>
                <Grid container spacing={1.5}>
                  {profileDetails.map((item) => (
                    <Grid size={{ xs: 6 }} key={item.label}>
                      <Box
                        sx={{
                          p: 1.8, bgcolor: 'white', borderRadius: 3,
                          border: '1px solid', borderColor: 'divider',
                        }}
                      >
                        <Stack direction="row" spacing={0.8} alignItems="center" sx={{ mb: 0.5, color: 'primary.main' }}>
                          {item.icon}
                          <Typography variant="caption" sx={{ fontWeight: 700, color: 'text.secondary', textTransform: 'uppercase', letterSpacing: 0.5, fontSize: '0.6rem' }}>
                            {item.label}
                          </Typography>
                        </Stack>
                        <Typography
                          variant="body2"
                          sx={{
                            fontWeight: item.value === 'Not provided' ? 400 : 600,
                            color: item.value === 'Not provided' ? 'text.disabled' : 'text.primary',
                            fontSize: '0.82rem',
                          }}
                        >
                          {item.value}
                        </Typography>
                      </Box>
                    </Grid>
                  ))}
                </Grid>
              </Box>

              <Divider />

              <Box>
                <Typography variant="subtitle1" sx={{ fontWeight: 'bold', color: 'primary.main', mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Sparkles size={18} /> Compatibility Breakdown
                </Typography>
                <Stack spacing={2.5}>
                  {detail.dimensions.map((dimension: any) => (
                    <Box key={dimension.label}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                        <Typography variant="caption" sx={{ fontWeight: 'bold', color: 'text.secondary' }}>
                          {dimension.label}
                        </Typography>
                        <Typography variant="caption" sx={{ fontWeight: 'bold', color: 'primary.main' }}>
                          {dimension.value}%
                        </Typography>
                      </Box>
                      <LinearProgress
                        variant="determinate"
                        value={dimension.value}
                        sx={{
                          height: 6,
                          borderRadius: 3,
                          bgcolor: 'primary.50',
                          '& .MuiLinearProgress-bar': { bgcolor: 'primary.main' },
                        }}
                      />
                    </Box>
                  ))}
                </Stack>
              </Box>

              <Box sx={{ bgcolor: 'white', p: 3, borderRadius: 6, border: '1px solid', borderColor: 'divider' }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 'bold', color: 'primary.main', mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Brain size={18} /> Personality Traits
                </Typography>
                <Box sx={{ height: 250, width: '100%' }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <RadarChart cx="50%" cy="50%" outerRadius="80%" data={detail.traits}>
                      <PolarGrid stroke="#eee" />
                      <PolarAngleAxis dataKey="subject" tick={{ fontSize: 10, fill: '#555' }} />
                      <Radar name="Match" dataKey="A" stroke="#8B1A2E" fill="#8B1A2E" fillOpacity={0.4} />
                    </RadarChart>
                  </ResponsiveContainer>
                </Box>
              </Box>

              <Box>
                <Typography variant="subtitle1" sx={{ fontWeight: 'bold', color: 'primary.main', mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Star size={18} /> Astrological Profile
                </Typography>
                <Grid container spacing={2}>
                  {[
                    { label: 'Rashi', value: detail.horoscope.rashi },
                    { label: 'Nakshatra', value: detail.horoscope.nakshatra },
                    { label: 'Gana', value: detail.horoscope.gana },
                    { label: 'Ascendant', value: detail.horoscope.ascendant },
                  ].map((item) => (
                    <Grid size={{ xs: 6, md: 3 }} key={item.label}>
                      <Box sx={{ p: 2, bgcolor: 'primary.50', borderRadius: 4, textAlign: 'center' }}>
                        <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mb: 0.5 }}>
                          {item.label}
                        </Typography>
                        <Typography variant="body2" sx={{ fontWeight: 'bold', color: 'primary.main' }}>
                          {item.value}
                        </Typography>
                      </Box>
                    </Grid>
                  ))}
                </Grid>
              </Box>

              <Box>
                <Typography variant="subtitle1" sx={{ fontWeight: 'bold', color: 'primary.main', mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Leaf size={18} /> Lifestyle
                </Typography>
                <Stack spacing={2.5}>
                  <Box>
                    <Typography variant="caption" sx={{ fontWeight: 700, color: 'text.secondary', display: 'block', mb: 1, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                      Hobbies & Interests
                    </Typography>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                      {hobbies.length > 0
                        ? hobbies.map((hobby: string) => (
                            <Chip key={hobby} label={hobby} size="small" variant="outlined" />
                          ))
                        : <Typography variant="body2" sx={{ color: 'text.disabled' }}>Not provided</Typography>}
                    </Box>
                  </Box>

                  {/* Lifestyle quick-facts row */}
                  <Grid container spacing={1.5}>
                    {[
                      { icon: <Utensils size={13} />, label: 'Diet', value: val(detail.lifestyle.diet) },
                      { icon: <Cigarette size={13} />, label: 'Smoking', value: val(detail.lifestyle.smoking) },
                      { icon: <Wine size={13} />, label: 'Drinking', value: val(detail.lifestyle.drinking) },
                      { icon: <Briefcase size={13} />, label: 'Career', value: val(detail.lifestyle.career) },
                      { icon: <Heart size={13} />, label: 'Family Plans', value: val(detail.lifestyle.familyPlans) },
                    ].map((item) => (
                      <Grid size={{ xs: 6 }} key={item.label}>
                        <Box sx={{ p: 1.5, bgcolor: 'white', borderRadius: 3, border: '1px solid', borderColor: 'divider' }}>
                          <Stack direction="row" spacing={0.6} alignItems="center" sx={{ mb: 0.4, color: 'primary.main' }}>
                            {item.icon}
                            <Typography variant="caption" sx={{ fontWeight: 700, color: 'text.secondary', textTransform: 'uppercase', letterSpacing: 0.4, fontSize: '0.6rem' }}>
                              {item.label}
                            </Typography>
                          </Stack>
                          <Typography
                            variant="body2"
                            sx={{
                              fontWeight: item.value === 'Not provided' ? 400 : 600,
                              color: item.value === 'Not provided' ? 'text.disabled' : 'text.primary',
                              fontSize: '0.82rem',
                            }}
                          >
                            {item.value}
                          </Typography>
                        </Box>
                      </Grid>
                    ))}
                  </Grid>
                </Stack>
              </Box>
            </>
          )}
        </Box>

        <Box sx={{ p: 3, bgcolor: 'white', borderTop: '1px solid', borderColor: 'divider' }}>
          {showNotMatchedAlert && (
            <Alert
              severity="info"
              onClose={() => setShowNotMatchedAlert(false)}
              sx={{ mb: 2, borderRadius: 2, fontSize: '0.82rem' }}
            >
              You can't message yet — you're not matched. Accept their interest or wait for them to accept yours.
            </Alert>
          )}
          <Stack direction="row" spacing={2}>
            <Button
              fullWidth
              variant="contained"
              startIcon={<Heart size={18} />}
              onClick={() => detail && onExpressInterest(detail.id)}
              disabled={!detail}
              sx={{
                bgcolor: 'secondary.main',
                color: 'primary.main',
                fontWeight: 'bold',
                borderRadius: 3,
                py: 1.5,
                '&:hover': { bgcolor: 'secondary.dark' },
              }}
            >
              Interest
            </Button>
            <Button
              fullWidth
              variant="outlined"
              startIcon={<MessageCircle size={18} />}
              onClick={() => {
                if (!detail) return;
                if (detail.mutualMatch) {
                  onSendMessage(detail.id);
                } else {
                  setShowNotMatchedAlert(true);
                }
              }}
              disabled={!detail}
              sx={{
                borderColor: 'primary.light',
                color: 'primary.main',
                fontWeight: 'bold',
                borderRadius: 3,
                py: 1.5,
                '&:hover': { borderColor: 'primary.main', bgcolor: 'primary.50' },
              }}
            >
              Message
            </Button>
          </Stack>
        </Box>
      </Box>
    </Drawer>
  );
}
