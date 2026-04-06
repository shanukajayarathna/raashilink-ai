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
} from '@mui/material';
import { X, Heart, MessageCircle, MapPin, Star, Sparkles, Brain, Leaf } from 'lucide-react';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, ResponsiveContainer } from 'recharts';
import { motion, AnimatePresence } from 'motion/react';
import matchService from '../services/matchService';

interface MatchDetailPanelProps {
  matchId: string | null;
  open: boolean;
  onClose: () => void;
  onSendMessage: (id: string) => void;
  onExpressInterest: (id: string) => void;
}

export default function MatchDetailPanel({
  matchId,
  open,
  onClose,
  onSendMessage,
  onExpressInterest,
}: MatchDetailPanelProps) {
  const [activePhoto, setActivePhoto] = React.useState(0);
  const [detail, setDetail] = React.useState<any>(null);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

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

        <Box sx={{ flex: 1, overflowY: 'auto', p: 3, display: 'flex', flexDirection: 'column', gap: 4 }}>
          {loading && (
            <Box sx={{ py: 12, textAlign: 'center' }}>
              <CircularProgress />
            </Box>
          )}

          {!loading && error && <Alert severity="error">{error}</Alert>}

          {!loading && !error && detail && (
            <>
              <Box sx={{ position: 'relative', borderRadius: 6, overflow: 'hidden', mb: 4 }}>
                <Box sx={{ position: 'relative', pt: '100%' }}>
                  <AnimatePresence mode="wait">
                    <motion.img
                      key={activePhoto}
                      src={detail.photos[activePhoto]}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="absolute inset-0 w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                  </AnimatePresence>
                </Box>
                <Box sx={{ position: 'absolute', bottom: 16, left: 0, right: 0, display: 'flex', justifyContent: 'center', gap: 1 }}>
                  {detail.photos.map((_: string, index: number) => (
                    <Box
                      key={index}
                      onClick={() => setActivePhoto(index)}
                      sx={{
                        width: 8,
                        height: 8,
                        borderRadius: '50%',
                        bgcolor: activePhoto === index ? 'secondary.main' : 'white',
                        cursor: 'pointer',
                        boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
                      }}
                    />
                  ))}
                </Box>
              </Box>

              <Box sx={{ mb: 4 }}>
                <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
                  <Box>
                    <Typography variant="h4" sx={{ fontFamily: 'FONTS.heading', fontWeight: 'bold', color: 'primary.main' }}>
                      {detail.name}, {detail.age}
                    </Typography>
                    <Stack direction="row" spacing={1} alignItems="center" sx={{ color: 'text.secondary', mt: 0.5 }}>
                      <MapPin size={14} />
                      <Typography variant="body2">{detail.location}</Typography>
                    </Stack>
                  </Box>
                  <Box sx={{ textAlign: 'right' }}>
                    <Typography variant="h4" sx={{ color: 'secondary.main', fontWeight: 'bold', fontFamily: 'FONTS.heading' }}>
                      {detail.score}%
                    </Typography>
                    <Chip label={detail.band} size="small" sx={{ bgcolor: 'secondary.main', color: 'primary.main', fontWeight: 'bold', fontSize: '0.65rem' }} />
                  </Box>
                </Stack>
                <Typography variant="body2" sx={{ mt: 3, color: 'text.secondary', lineHeight: 1.6 }}>
                  {detail.bio}
                </Typography>
              </Box>

              <Divider sx={{ my: 4 }} />

              <Box sx={{ mb: 4 }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 'bold', color: 'primary.main', mb: 3, display: 'flex', alignItems: 'center', gap: 1 }}>
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

              <Box sx={{ mb: 4, bgcolor: 'white', p: 3, borderRadius: 6, border: '1px solid', borderColor: 'divider' }}>
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

              <Box sx={{ mb: 4 }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 'bold', color: 'primary.main', mb: 3, display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Star size={18} /> Astrological Profile
                </Typography>
                <Grid container spacing={2}>
                  {[
                    { label: 'Rashi', value: detail.horoscope.rashi },
                    { label: 'Nakshatra', value: detail.horoscope.nakshatra },
                    { label: 'Ascendant', value: detail.horoscope.ascendant },
                  ].map((item) => (
                    <Grid size={{ xs: 4 }} key={item.label}>
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

              <Box sx={{ mb: 4 }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 'bold', color: 'primary.main', mb: 3, display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Leaf size={18} /> Lifestyle & Career
                </Typography>
                <Stack spacing={3}>
                  <Box>
                    <Typography variant="caption" sx={{ fontWeight: 'bold', color: 'text.secondary', display: 'block', mb: 1 }}>
                      Hobbies & Interests
                    </Typography>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                      {detail.lifestyle.hobbies.map((hobby: string) => (
                        <Chip key={hobby} label={hobby} size="small" variant="outlined" />
                      ))}
                    </Box>
                  </Box>
                  <Box>
                    <Typography variant="caption" sx={{ fontWeight: 'bold', color: 'text.secondary', display: 'block', mb: 0.5 }}>
                      Career
                    </Typography>
                    <Typography variant="body2" sx={{ color: 'primary.main' }}>
                      {detail.lifestyle.career}
                    </Typography>
                  </Box>
                  <Box>
                    <Typography variant="caption" sx={{ fontWeight: 'bold', color: 'text.secondary', display: 'block', mb: 0.5 }}>
                      Family Plans
                    </Typography>
                    <Typography variant="body2" sx={{ color: 'primary.main' }}>
                      {detail.lifestyle.familyPlans}
                    </Typography>
                  </Box>
                </Stack>
              </Box>
            </>
          )}
        </Box>

        <Box sx={{ p: 3, bgcolor: 'white', borderTop: '1px solid', borderColor: 'divider' }}>
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
              onClick={() => detail && onSendMessage(detail.id)}
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
