import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Typography,
  Grid,
  Button,
  CircularProgress,
  Skeleton,
  Stack,
  Alert,
  Container,
} from '@mui/material';
import { motion } from 'motion/react';
import { ChevronRight, RefreshCw, SearchX } from 'lucide-react';
import FilterBar from '../components/FilterBar';
import MatchCard from '../components/MatchCard';
import MatchDetailPanel from '../components/MatchDetailPanel';
import MessageModal from '../components/MessageModal';
import matchService from '../services/matchService';
import chatService from '@/features/chat/services/chatService';
import { useDispatch } from 'react-redux';
import { showToast } from '@/app/store/uiSlice';

export default function MatchRecommendations() {
  const dispatch = useDispatch();
  const [matches, setMatches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [didYouMean, setDidYouMean] = useState<string[]>([]);
  const [selectedMatchId, setSelectedMatchId] = useState<string | null>(null);
  const [detailPanelOpen, setDetailPanelOpen] = useState(false);
  const [messageModalOpen, setMessageModalOpen] = useState(false);
  const [messageRecipient, setMessageRecipient] = useState<{ id: string | null; name: string }>({
    id: null,
    name: '',
  });

  const [filters, setFilters] = useState({
    ageRange: [18, 90],
    religions: [],
    district: '',
    gender: '',
    heightRange: [140, 200],
    sortBy: 'compatibility',
    search: '',
  });

  const bestMatch = matches.length > 0 ? matches[0] : null;

  const fetchMatches = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await matchService.getRecommendations({ ...filters, refresh: true });
      setMatches(response.data.items || []);
      setDidYouMean(response.data.didYouMean || []);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load recommendations. Please try again.');
      setDidYouMean([]);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchMatches();
  }, [fetchMatches]);

  const handleResetFilters = () => {
    setFilters({
      ageRange: [18, 90],
      religions: [],
      district: '',
      gender: '',
      heightRange: [140, 200],
      sortBy: 'compatibility',
      search: '',
    });
  };

  const handleViewProfile = (id: string) => {
    setSelectedMatchId(id);
    setDetailPanelOpen(true);
  };

  const handleExpressInterest = async (id: string) => {
    try {
      const response = await matchService.expressInterest(id);
      dispatch(showToast({ type: response.data.matched ? 'success' : 'info', message: response.data.message }));
      await fetchMatches();
    } catch (err: any) {
      dispatch(showToast({ type: 'error', message: err.response?.data?.message || 'Failed to express interest.' }));
    }
  };

  const handleOpenMessageModal = (id: string) => {
    const match = matches.find((entry) => entry.id === id);
    if (!match) return;

    setMessageRecipient({ id: match.id, name: match.name });
    setMessageModalOpen(true);
  };

  const handleSendMessage = async (content: string) => {
    if (!messageRecipient.id) return;

    await chatService.sendMessage({
      recipientId: messageRecipient.id,
      content,
    });

    dispatch(showToast({ type: 'success', message: `Message sent to ${messageRecipient.name}.` }));
  };

  const renderSkeletons = () => (
    <Grid container spacing={4}>
      {[...Array(6)].map((_, index) => (
        <Grid size={{ xs: 12, sm: 6, lg: 4 }} key={index}>
          <Box sx={{ bgcolor: 'white', borderRadius: 6, overflow: 'hidden', border: '1px solid', borderColor: 'divider' }}>
            <Skeleton variant="rectangular" width="100%" height={300} animation="wave" />
            <Box sx={{ p: 3, display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Skeleton variant="text" width="60%" height={32} />
              <Skeleton variant="text" width="40%" height={20} />
              <Stack direction="row" spacing={2} sx={{ mt: 2 }}>
                <Skeleton variant="rectangular" width="100%" height={40} sx={{ borderRadius: 3 }} />
                <Skeleton variant="rectangular" width="100%" height={40} sx={{ borderRadius: 3 }} />
              </Stack>
            </Box>
          </Box>
        </Grid>
      ))}
    </Grid>
  );

  const renderEmptyState = () => (
    <Box sx={{ textAlign: 'center', py: 12, px: 3 }}>
      <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ duration: 0.5 }}>
        <Box
          sx={{
            width: 120,
            height: 120,
            bgcolor: 'primary.50',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            mx: 'auto',
            mb: 4,
            color: 'primary.main',
          }}
        >
          <SearchX size={64} />
        </Box>
      </motion.div>
      <Typography variant="h5" sx={{ fontFamily: 'FONTS.heading', fontWeight: 'bold', color: 'primary.main', mb: 2 }}>
        No matches found
      </Typography>
      <Typography variant="body1" sx={{ color: 'text.secondary', maxWidth: 500, mx: 'auto', mb: 4 }}>
        We could not find any matches with your current filters. Try adjusting your preferences.
      </Typography>
      {filters.search.trim().length > 0 && didYouMean.length > 0 && (
        <Typography variant="body2" sx={{ color: 'primary.main', fontWeight: 700, mb: 2 }}>
          Did you mean: {didYouMean.join(', ')}?
        </Typography>
      )}
      <Button variant="contained" onClick={handleResetFilters} sx={{ bgcolor: 'primary.main', color: 'white', borderRadius: 3, px: 4, fontWeight: 'bold' }}>
        Reset All Filters
      </Button>
    </Box>
  );

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Box sx={{ mb: 6 }}>
        <Typography variant="h3" sx={{ fontFamily: 'FONTS.heading', fontWeight: 'bold', color: 'primary.main', mb: 1 }}>
          Match Recommendations
        </Typography>
        <Typography variant="body1" sx={{ color: 'text.secondary' }}>
          Discover partners aligned with your stars, values, and lifestyle.
        </Typography>
      </Box>

      <FilterBar onFilterChange={setFilters} onReset={handleResetFilters} />

      {error && (
        <Alert
          severity="error"
          sx={{ mb: 4, borderRadius: 4 }}
          action={
            <Button color="inherit" size="small" onClick={fetchMatches} startIcon={<RefreshCw size={16} />}>
              Retry
            </Button>
          }
        >
          {error}
        </Alert>
      )}

      <Box sx={{ position: 'relative', minHeight: 400 }}>
        {loading ? (
          renderSkeletons()
        ) : matches.length === 0 ? (
          renderEmptyState()
        ) : (
          <>
            {bestMatch && (
              <Box
                sx={{
                  mb: 4,
                  p: { xs: 2.5, md: 3 },
                  borderRadius: 5,
                  background: 'linear-gradient(120deg, rgba(139,26,46,0.1), rgba(201,168,76,0.18))',
                  border: '1px solid',
                  borderColor: 'secondary.main',
                }}
              >
                <Typography variant="overline" sx={{ color: 'primary.main', fontWeight: 800, letterSpacing: 1.2 }}>
                  Best Match Right Now
                </Typography>
                <Typography variant="h5" sx={{ color: 'primary.main', fontWeight: 800, mt: 0.5 }}>
                  {bestMatch.name}{bestMatch.age ? `, ${bestMatch.age}` : ''}
                </Typography>
                <Typography variant="body2" sx={{ color: 'text.secondary', mt: 0.5 }}>
                  {bestMatch.score}% compatibility based on astrology, personality, lifestyle, and family values.
                </Typography>
                <Stack direction="row" spacing={1.5} sx={{ mt: 2 }}>
                  <Button variant="contained" onClick={() => handleViewProfile(bestMatch.id)}>
                    View Best Match
                  </Button>
                  <Button variant="outlined" onClick={() => handleExpressInterest(bestMatch.id)}>
                    Express Interest
                  </Button>
                </Stack>
              </Box>
            )}

            <Grid container spacing={4}>
              {matches.map((match) => (
                <Grid size={{ xs: 12, sm: 6, lg: 4 }} key={match.id}>
                  <MatchCard
                    match={match}
                    onViewProfile={handleViewProfile}
                    onExpressInterest={handleExpressInterest}
                    onSendMessage={handleOpenMessageModal}
                  />
                </Grid>
              ))}
            </Grid>

            <Box sx={{ mt: 8, textAlign: 'center' }}>
              <Typography variant="caption" sx={{ display: 'block', mb: 2, color: 'text.secondary', fontWeight: 'bold' }}>
                Showing {matches.length} compatible profiles
              </Typography>
              <Button
                variant="outlined"
                onClick={fetchMatches}
                disabled={loading}
                endIcon={loading ? <CircularProgress size={16} /> : <ChevronRight size={18} />}
                sx={{
                  borderColor: 'primary.light',
                  color: 'primary.main',
                  borderRadius: 8,
                  px: 6,
                  py: 1.5,
                  fontWeight: 'bold',
                  '&:hover': { borderColor: 'primary.main', bgcolor: 'primary.50' },
                }}
              >
                Refresh Matches
              </Button>
            </Box>
          </>
        )}
      </Box>

      <MatchDetailPanel
        matchId={selectedMatchId}
        open={detailPanelOpen}
        onClose={() => setDetailPanelOpen(false)}
        onSendMessage={handleOpenMessageModal}
        onExpressInterest={handleExpressInterest}
      />

      <MessageModal
        open={messageModalOpen}
        onClose={() => setMessageModalOpen(false)}
        recipientName={messageRecipient.name}
        recipientId={messageRecipient.id}
        onSend={handleSendMessage}
      />
    </Container>
  );
}
