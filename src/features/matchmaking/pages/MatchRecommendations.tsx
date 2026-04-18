import React, { useState, useEffect, useCallback, useRef } from 'react';
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
  Avatar,
  Chip,
  Divider,
  Tooltip,
} from '@mui/material';
import { motion } from 'motion/react';
import { ChevronRight, RefreshCw, SearchX, Heart, MessageCircle, UserMinus, MapPin, Sparkles, Send, Inbox, UserCheck, UserX, Clock } from 'lucide-react';
import FilterBar from '../components/FilterBar';
import MatchCard from '../components/MatchCard';
import MatchDetailPanel from '../components/MatchDetailPanel';
import MessageModal from '../components/MessageModal';
import matchService from '../services/matchService';
import chatService from '@/features/chat/services/chatService';
import { useDispatch } from 'react-redux';
import { showToast } from '@/app/store/uiSlice';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useRealtimeUpdates } from '@/shared/hooks/useRealtimeUpdates';

export default function MatchRecommendations() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [matches, setMatches] = useState<any[]>([]);
  const [mutualMatches, setMutualMatches] = useState<any[]>([]);
  const [mutualLoading, setMutualLoading] = useState(true);
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [pendingSent, setPendingSent] = useState<any[]>([]);
  const [pendingReceived, setPendingReceived] = useState<any[]>([]);
  const [pendingLoading, setPendingLoading] = useState(true);
  const [acceptingId, setAcceptingId] = useState<string | null>(null);
  const [decliningId, setDecliningId] = useState<string | null>(null);
  const [withdrawingId, setWithdrawingId] = useState<string | null>(null);
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

  const fetchMatches = useCallback(async (forceRefresh = false) => {
    setLoading(true);
    setError(null);

    try {
      const response = await matchService.getRecommendations(
        forceRefresh ? { ...filters, refresh: true } : filters
      );
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

  // Fetch mutual matches once on mount (independent of recommendation filters)
  useEffect(() => {
    let active = true;
    setMutualLoading(true);
    matchService.getMutualMatches()
      .then((res: any) => { if (active) setMutualMatches(res.data?.items || []); })
      .catch(() => { if (active) setMutualMatches([]); })
      .finally(() => { if (active) setMutualLoading(false); });
    return () => { active = false; };
  }, []);

  // Helper to (re-)fetch pending interests
  const fetchPending = useCallback(() => {
    let active = true;
    setPendingLoading(true);
    matchService.getPendingInterests()
      .then((res: any) => {
        if (active) {
          setPendingSent(res.data?.sent || []);
          setPendingReceived(res.data?.received || []);
        }
      })
      .catch(() => { if (active) { setPendingSent([]); setPendingReceived([]); } })
      .finally(() => { if (active) setPendingLoading(false); });
    return () => { active = false; };
  }, []);

  useEffect(() => { const cleanup = fetchPending(); return cleanup; }, [fetchPending]);

  // ── Real-time socket events ──────────────────────────────────────────────
  const refreshMutualMatches = useCallback(() => {
    matchService.getMutualMatches()
      .then((res: any) => setMutualMatches(res.data?.items || []))
      .catch(() => {});
  }, []);

  useRealtimeUpdates({
    onInterestReceived: (data) => {
      if (data.senderCard) {
        // Directly push the card into pendingReceived — no API round-trip needed
        setPendingReceived((prev) => {
          if (prev.some((m) => m.id === data.senderCard.id)) return prev;
          return [data.senderCard, ...prev];
        });
      } else {
        fetchPending();
      }
    },
    onMutualMatch: (data) => {
      // The other user may have been in pendingSent (we sent interest and they accepted)
      // OR in pendingReceived (they sent first and we just accepted) — clear both.
      setPendingSent((prev) => prev.filter((m) => m.id !== data.fromUserId));
      setPendingReceived((prev) => prev.filter((m) => m.id !== data.fromUserId));
      refreshMutualMatches();
    },
    onMatchRemoved: () => refreshMutualMatches(),
    onInterestAccepted: (data) => {
      setPendingSent((prev) => prev.filter((m) => m.id !== data.fromUserId));
      dispatch(showToast({ type: 'success', message: `${data.fromUserName} accepted your interest! 🎉` }));
      refreshMutualMatches();
    },
    onInterestDeclined: (data) => {
      setPendingSent((prev) => prev.filter((m) => m.id !== data.fromUserId));
      dispatch(showToast({ type: 'info', message: `${data.fromUserName} has declined your interest.` }));
    },
  });

  const handleRemoveInterest = async (id: string) => {
    setRemovingId(id);
    try {
      await matchService.undoInterest(id);
      setMutualMatches((prev) => prev.filter((m) => m.id !== id));
      dispatch(showToast({ type: 'success', message: 'Match removed successfully.' }));
      fetchMatches();
    } catch (err: any) {
      dispatch(showToast({ type: 'error', message: err.response?.data?.message || 'Failed to remove match.' }));
    } finally {
      setRemovingId(null);
    }
  };

  const handleWithdrawInterest = async (id: string) => {
    setWithdrawingId(id);
    try {
      await matchService.undoInterest(id);
      setPendingSent((prev) => prev.filter((m) => m.id !== id));
      dispatch(showToast({ type: 'info', message: 'Interest withdrawn.' }));
      fetchMatches();
    } catch (err: any) {
      dispatch(showToast({ type: 'error', message: err.response?.data?.message || 'Failed to withdraw interest.' }));
    } finally {
      setWithdrawingId(null);
    }
  };

  const handleAcceptInterest = async (id: string) => {
    setAcceptingId(id);
    try {
      const res = await matchService.expressInterest(id);
      setPendingReceived((prev) => prev.filter((m) => m.id !== id));
      // Refresh mutual if it became a match
      if (res.data?.matched) {
        matchService.getMutualMatches().then((r: any) => setMutualMatches(r.data?.items || [])).catch(() => {});
        dispatch(showToast({ type: 'success', message: res.data.message || 'Mutual match! You can now chat.' }));
      } else {
        dispatch(showToast({ type: 'success', message: 'Interest sent back!' }));
      }
    } catch (err: any) {
      dispatch(showToast({ type: 'error', message: err.response?.data?.message || 'Failed to accept interest.' }));
    } finally {
      setAcceptingId(null);
    }
  };

  const handleDeclineInterest = async (id: string) => {
    setDecliningId(id);
    try {
      await matchService.declineInterest(id);
      setPendingReceived((prev) => prev.filter((m) => m.id !== id));
      dispatch(showToast({ type: 'info', message: 'Interest declined.' }));
    } catch (err: any) {
      dispatch(showToast({ type: 'error', message: err.response?.data?.message || 'Failed to decline interest.' }));
    } finally {
      setDecliningId(null);
    }
  };

  const handledUserParam = useRef<string | null>(null);

  // Auto-open detail panel when navigated from a notification (?user=<id>)
  // Only fires once per unique ?user= value to avoid re-opening after state updates
  useEffect(() => {
    const userId = searchParams.get('user');
    if (userId && userId !== handledUserParam.current && matches.length > 0) {
      handledUserParam.current = userId;
      setSelectedMatchId(userId);
      setDetailPanelOpen(true);
    }
  }, [matches, searchParams]);

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
      const matchData = matches.find((m) => m.id === id);

      // Optimistically remove from recommendations immediately
      setMatches((prev) => prev.filter((m) => m.id !== id));

      if (response.data.matched) {
        // Became a mutual match — add to mutual section
        if (matchData) {
          setMutualMatches((prev) => [
            ...prev,
            { ...matchData, conversationId: response.data.conversationId ?? null },
          ]);
        }
        dispatch(showToast({ type: 'success', message: response.data.message }));
      } else {
        // Pending interest sent — add to the "Interest Sent" section immediately
        if (matchData) {
          setPendingSent((prev) => [
            ...prev,
            {
              id: matchData.id,
              name: matchData.name,
              initials: matchData.initials,
              age: matchData.age,
              location: matchData.location,
              img: matchData.img,
              sentAt: new Date().toISOString(),
            },
          ]);
        }
        dispatch(showToast({ type: 'info', message: response.data.message }));
      }

      // Close the detail panel if it was showing this profile
      if (selectedMatchId === id) {
        setDetailPanelOpen(false);
      }
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

      {/* ── Mutual Matches Section ─────────────────────────────────── */}
      {(mutualLoading || mutualMatches.length > 0) && (
        <Box sx={{ mb: 3 }}>
          {/* Section header */}
          <Stack direction="row" alignItems="center" spacing={1.5} sx={{ mb: 3 }}>
            <Box
              sx={{
                width: 36, height: 36, borderRadius: '50%',
                background: 'linear-gradient(135deg, #8B1A2E 0%, #C9A84C 100%)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}
            >
              <Heart size={18} color="#fff" fill="#fff" />
            </Box>
            <Typography variant="h5" sx={{ fontWeight: 800, color: 'primary.main' }}>
              Mutual Matches
            </Typography>
            {!mutualLoading && (
              <Chip
                label={mutualMatches.length}
                size="small"
                sx={{
                  bgcolor: 'primary.main', color: '#fff', fontWeight: 700,
                  height: 22, '& .MuiChip-label': { px: 1.2 },
                }}
              />
            )}
            <Typography variant="body2" sx={{ color: 'text.secondary', fontStyle: 'italic' }}>
              You both said yes ✨
            </Typography>
          </Stack>

          {mutualLoading ? (
            <Grid container spacing={3}>
              {[...Array(3)].map((_, i) => (
                <Grid size={{ xs: 12, sm: 6, md: 4 }} key={i}>
                  <Box sx={{ bgcolor: 'white', borderRadius: 4, p: 3, border: '1px solid', borderColor: 'divider' }}>
                    <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 2 }}>
                      <Skeleton variant="circular" width={56} height={56} />
                      <Box sx={{ flex: 1 }}>
                        <Skeleton variant="text" width="70%" height={24} />
                        <Skeleton variant="text" width="50%" height={18} />
                      </Box>
                    </Stack>
                    <Skeleton variant="rectangular" height={36} sx={{ borderRadius: 2 }} />
                  </Box>
                </Grid>
              ))}
            </Grid>
          ) : (
            <Grid container spacing={3}>
              {mutualMatches.map((match, idx) => {
                const initials = match.initials || match.name?.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2) || '??';
                const isRemoving = removingId === match.id;
                return (
                  <Grid size={{ xs: 12, sm: 6, md: 4 }} key={match.id}>
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      transition={{ duration: 0.35, delay: idx * 0.07 }}
                    >
                      <Box
                        sx={{
                          bgcolor: 'white',
                          borderRadius: 5,
                          overflow: 'hidden',
                          border: '1.5px solid',
                          borderColor: 'rgba(201,168,76,0.4)',
                          boxShadow: '0 4px 24px rgba(139,26,46,0.07)',
                          transition: 'box-shadow 0.2s, transform 0.2s',
                          '&:hover': { boxShadow: '0 8px 32px rgba(139,26,46,0.14)', transform: 'translateY(-3px)' },
                        }}
                      >
                        {/* Card Header */}
                        <Box
                          sx={{
                            px: 3, pt: 3, pb: 2.5,
                            background: 'linear-gradient(135deg, rgba(139,26,46,0.06) 0%, rgba(201,168,76,0.12) 100%)',
                            borderBottom: '1px solid rgba(201,168,76,0.2)',
                          }}
                        >
                          <Stack direction="row" spacing={2} alignItems="center">
                            <Avatar
                              src={match.img || undefined}
                              sx={{
                                width: 60, height: 60,
                                background: 'linear-gradient(135deg, #8B1A2E 0%, #C9A84C 100%)',
                                fontSize: '1.2rem', fontWeight: 700, color: '#fff',
                                border: '2.5px solid rgba(201,168,76,0.5)',
                              }}
                            >
                              {initials}
                            </Avatar>
                            <Box sx={{ flex: 1, minWidth: 0 }}>
                              <Typography
                                variant="h6"
                                sx={{ fontWeight: 800, color: 'primary.main', lineHeight: 1.2, mb: 0.3 }}
                                noWrap
                              >
                                {match.name}{match.age ? `, ${match.age}` : ''}
                              </Typography>
                              {match.location && (
                                <Stack direction="row" spacing={0.4} alignItems="center">
                                  <MapPin size={12} color="#888" />
                                  <Typography variant="caption" sx={{ color: 'text.secondary' }} noWrap>
                                    {match.location}
                                  </Typography>
                                </Stack>
                              )}
                            </Box>
                            <Tooltip title="Compatibility score">
                              <Box
                                sx={{
                                  minWidth: 48, height: 48, borderRadius: '50%',
                                  background: 'linear-gradient(135deg, #8B1A2E, #C9A84C)',
                                  display: 'flex', flexDirection: 'column',
                                  alignItems: 'center', justifyContent: 'center',
                                  boxShadow: '0 2px 8px rgba(139,26,46,0.3)',
                                  flexShrink: 0,
                                }}
                              >
                                <Typography sx={{ fontSize: '0.75rem', fontWeight: 900, color: '#fff', lineHeight: 1.1 }}>
                                  {match.score ?? '—'}
                                </Typography>
                                <Typography sx={{ fontSize: '0.5rem', color: 'rgba(255,255,255,0.85)', letterSpacing: 0.5 }}>
                                  %
                                </Typography>
                              </Box>
                            </Tooltip>
                          </Stack>
                        </Box>

                        {/* Card Body */}
                        <Box sx={{ px: 3, py: 2.5 }}>
                          <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 0.8 }}>
                            <Sparkles size={13} color="#C9A84C" />
                            <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                              {match.band || 'Compatible'} compatibility
                            </Typography>
                          </Stack>
                          {match.moonSign && match.moonSign !== 'Pending' && (
                            <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mb: 0.5 }}>
                              🌙 {match.moonSign}
                            </Typography>
                          )}
                          {match.ascendant && match.ascendant !== 'Pending' && (
                            <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mb: 1 }}>
                              ⬆️ {match.ascendant} Lagna
                            </Typography>
                          )}

                          <Stack direction="row" spacing={1} sx={{ mt: 2 }}>
                            <Button
                              variant="contained"
                              size="small"
                              startIcon={<MessageCircle size={14} />}
                              onClick={() => navigate('/messages', { state: { openUserId: match.id, openUserName: match.name } })}
                              sx={{
                                flex: 1, borderRadius: 3, fontWeight: 700, fontSize: '0.78rem',
                                bgcolor: 'primary.main', color: '#fff',
                                '&:hover': { bgcolor: '#6e1526' },
                                textTransform: 'none',
                              }}
                            >
                              Message
                            </Button>
                            <Button
                              variant="outlined"
                              size="small"
                              startIcon={isRemoving ? <CircularProgress size={12} color="inherit" /> : <UserMinus size={14} />}
                              disabled={isRemoving}
                              onClick={() => handleRemoveInterest(match.id)}
                              sx={{
                                flex: 1, borderRadius: 3, fontWeight: 700, fontSize: '0.78rem',
                                borderColor: 'error.main', color: 'error.main',
                                '&:hover': { bgcolor: 'error.50', borderColor: 'error.dark' },
                                textTransform: 'none',
                              }}
                            >
                              Remove
                            </Button>
                          </Stack>
                        </Box>
                      </Box>
                    </motion.div>
                  </Grid>
                );
              })}
            </Grid>
          )}

        </Box>
      )}

      {/* ── Pending Interests Section ─────────────────────────────── */}
      {(pendingLoading || pendingSent.length > 0 || pendingReceived.length > 0) && (
        <Box sx={{ mb: 3 }}>
          {/* Section header */}
          <Stack direction="row" alignItems="center" spacing={1.5} sx={{ mb: 3 }}>
            <Box
              sx={{
                width: 36, height: 36, borderRadius: '50%',
                background: 'linear-gradient(135deg, #1A6B72 0%, #C9A84C 100%)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}
            >
              <Clock size={18} color="#fff" />
            </Box>
            <Typography variant="h5" sx={{ fontWeight: 800, color: 'text.primary' }}>
              Pending Interests
            </Typography>
            {!pendingLoading && (
              <Chip
                label={pendingSent.length + pendingReceived.length}
                size="small"
                sx={{ bgcolor: '#1A6B72', color: '#fff', fontWeight: 700, height: 22, '& .MuiChip-label': { px: 1.2 } }}
              />
            )}
          </Stack>

          {pendingLoading ? (
            <Grid container spacing={3}>
              {[...Array(4)].map((_, i) => (
                <Grid size={{ xs: 12, sm: 6, md: 4 }} key={i}>
                  <Box sx={{ bgcolor: 'white', borderRadius: 4, p: 3, border: '1px solid', borderColor: 'divider' }}>
                    <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 2 }}>
                      <Skeleton variant="circular" width={52} height={52} />
                      <Box sx={{ flex: 1 }}><Skeleton variant="text" width="65%" height={22} /><Skeleton variant="text" width="45%" height={16} /></Box>
                    </Stack>
                    <Skeleton variant="rectangular" height={36} sx={{ borderRadius: 2 }} />
                  </Box>
                </Grid>
              ))}
            </Grid>
          ) : (
            <Grid container spacing={4}>
              {/* Interests Received */}
              {pendingReceived.length > 0 && (
                <Grid size={{ xs: 12 }}>
                  <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2 }}>
                    <Inbox size={16} color="#8B1A2E" />
                    <Typography variant="subtitle1" sx={{ fontWeight: 700, color: 'primary.main' }}>
                      Interest Received
                    </Typography>
                    <Chip label={pendingReceived.length} size="small" sx={{ bgcolor: 'primary.50', color: 'primary.main', fontWeight: 700, height: 20, '& .MuiChip-label': { px: 1 } }} />
                  </Stack>
                  <Grid container spacing={2.5}>
                    {pendingReceived.map((match, idx) => {
                      const initials = match.initials || '??';
                      const isAccepting = acceptingId === match.id;
                      const isDeclining = decliningId === match.id;
                      return (
                        <Grid size={{ xs: 12, sm: 6, md: 4 }} key={match.id}>
                          <motion.div
                            initial={{ opacity: 0, y: 16 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            transition={{ duration: 0.3, delay: idx * 0.06 }}
                          >
                            <Box
                              sx={{
                                bgcolor: 'white', borderRadius: 5, overflow: 'hidden',
                                border: '1.5px solid rgba(139,26,46,0.25)',
                                boxShadow: '0 2px 16px rgba(139,26,46,0.06)',
                                transition: 'box-shadow 0.2s, transform 0.2s',
                                '&:hover': { boxShadow: '0 6px 24px rgba(139,26,46,0.12)', transform: 'translateY(-2px)' },
                              }}
                            >
                              <Box sx={{ px: 2.5, pt: 2.5, pb: 2, background: 'linear-gradient(135deg, rgba(139,26,46,0.07) 0%, rgba(201,168,76,0.1) 100%)' }}>
                                <Stack direction="row" spacing={1.5} alignItems="center">
                                  <Avatar
                                    src={match.img || undefined}
                                    sx={{ width: 52, height: 52, bgcolor: 'primary.main', fontWeight: 700, color: '#fff', border: '2px solid rgba(139,26,46,0.3)' }}
                                  >
                                    {initials}
                                  </Avatar>
                                  <Box sx={{ flex: 1, minWidth: 0 }}>
                                    <Typography variant="subtitle2" sx={{ fontWeight: 800, color: 'primary.main' }} noWrap>
                                      {match.name}{match.age ? `, ${match.age}` : ''}
                                    </Typography>
                                    {match.location && match.location !== 'Not provided' && (
                                      <Stack direction="row" spacing={0.4} alignItems="center">
                                        <MapPin size={11} color="#888" />
                                        <Typography variant="caption" sx={{ color: 'text.secondary' }} noWrap>{match.location}</Typography>
                                      </Stack>
                                    )}
                                    {match.job && match.job !== 'Not provided' && (
                                      <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block' }} noWrap>{match.job}</Typography>
                                    )}
                                  </Box>
                                  <Chip
                                    label="Interested"
                                    size="small"
                                    icon={<Heart size={10} fill="currentColor" />}
                                    sx={{ bgcolor: '#fce4ec', color: '#c62828', fontWeight: 700, fontSize: '0.65rem', '& .MuiChip-icon': { ml: 0.5 } }}
                                  />
                                </Stack>
                              </Box>
                              <Box sx={{ px: 2.5, py: 1.8 }}>
                                {match.moonSign && match.moonSign !== 'Pending' && (
                                  <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mb: 0.5 }}>
                                    🌙 {match.moonSign}
                                  </Typography>
                                )}
                                {match.ascendant && match.ascendant !== 'Pending' && (
                                  <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mb: 1 }}>
                                    ⬆️ {match.ascendant} Lagna
                                  </Typography>
                                )}
                                <Stack direction="row" spacing={1}>
                                  <Button
                                    variant="contained" size="small" fullWidth
                                    startIcon={isAccepting ? <CircularProgress size={12} color="inherit" /> : <UserCheck size={14} />}
                                    disabled={isAccepting || isDeclining}
                                    onClick={() => handleAcceptInterest(match.id)}
                                    sx={{ borderRadius: 3, fontWeight: 700, fontSize: '0.78rem', bgcolor: 'primary.main', '&:hover': { bgcolor: '#6e1526' }, textTransform: 'none' }}
                                  >
                                    Accept
                                  </Button>
                                  <Button
                                    variant="outlined" size="small" fullWidth
                                    startIcon={isDeclining ? <CircularProgress size={12} color="inherit" /> : <UserX size={14} />}
                                    disabled={isAccepting || isDeclining}
                                    onClick={() => handleDeclineInterest(match.id)}
                                    sx={{ borderRadius: 3, fontWeight: 700, fontSize: '0.78rem', borderColor: 'error.main', color: 'error.main', '&:hover': { bgcolor: 'error.50' }, textTransform: 'none' }}
                                  >
                                    Decline
                                  </Button>
                                </Stack>
                                <Button
                                  variant="text" size="small" fullWidth
                                  onClick={() => handleViewProfile(match.id)}
                                  sx={{ borderRadius: 3, fontWeight: 700, fontSize: '0.75rem', color: 'text.secondary', textTransform: 'none', mt: 0.5 }}
                                >
                                  View Profile
                                </Button>
                              </Box>
                            </Box>
                          </motion.div>
                        </Grid>
                      );
                    })}
                  </Grid>
                </Grid>
              )}

              {/* Interests Sent */}
              {pendingSent.length > 0 && (
                <Grid size={{ xs: 12 }}>
                  <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2 }}>
                    <Send size={16} color="#1A6B72" />
                    <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#1A6B72' }}>
                      Interest Sent
                    </Typography>
                    <Chip label={pendingSent.length} size="small" sx={{ bgcolor: 'rgba(26,107,114,0.1)', color: '#1A6B72', fontWeight: 700, height: 20, '& .MuiChip-label': { px: 1 } }} />
                    <Typography variant="caption" sx={{ color: 'text.secondary', fontStyle: 'italic' }}>Awaiting response</Typography>
                  </Stack>
                  <Grid container spacing={2.5}>
                    {pendingSent.map((match, idx) => {
                      const initials = match.initials || '??';
                      const isWithdrawing = withdrawingId === match.id;
                      return (
                        <Grid size={{ xs: 12, sm: 6, md: 4 }} key={match.id}>
                          <motion.div
                            initial={{ opacity: 0, y: 16 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.3, delay: idx * 0.06 }}
                          >
                            <Box
                              sx={{
                                bgcolor: 'white', borderRadius: 5, overflow: 'hidden',
                                border: '1.5px solid rgba(26,107,114,0.25)',
                                boxShadow: '0 2px 16px rgba(26,107,114,0.06)',
                                transition: 'box-shadow 0.2s, transform 0.2s',
                                '&:hover': { boxShadow: '0 6px 24px rgba(26,107,114,0.12)', transform: 'translateY(-2px)' },
                              }}
                            >
                              <Box sx={{ px: 2.5, pt: 2.5, pb: 2, background: 'linear-gradient(135deg, rgba(26,107,114,0.07) 0%, rgba(201,168,76,0.1) 100%)' }}>
                                <Stack direction="row" spacing={1.5} alignItems="center">
                                  <Avatar
                                    src={match.img || undefined}
                                    sx={{ width: 52, height: 52, bgcolor: '#1A6B72', fontWeight: 700, color: '#fff', border: '2px solid rgba(26,107,114,0.3)' }}
                                  >
                                    {initials}
                                  </Avatar>
                                  <Box sx={{ flex: 1, minWidth: 0 }}>
                                    <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#1A6B72' }} noWrap>
                                      {match.name}{match.age ? `, ${match.age}` : ''}
                                    </Typography>
                                    {match.location && match.location !== 'Not provided' && (
                                      <Stack direction="row" spacing={0.4} alignItems="center">
                                        <MapPin size={11} color="#888" />
                                        <Typography variant="caption" sx={{ color: 'text.secondary' }} noWrap>{match.location}</Typography>
                                      </Stack>
                                    )}
                                    {match.job && match.job !== 'Not provided' && (
                                      <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block' }} noWrap>{match.job}</Typography>
                                    )}
                                  </Box>
                                  <Chip
                                    label="Sent"
                                    size="small"
                                    icon={<Send size={10} />}
                                    sx={{ bgcolor: 'rgba(26,107,114,0.12)', color: '#1A6B72', fontWeight: 700, fontSize: '0.65rem', '& .MuiChip-icon': { ml: 0.5 } }}
                                  />
                                </Stack>
                              </Box>
                              <Box sx={{ px: 2.5, py: 1.8 }}>
                                {match.moonSign && match.moonSign !== 'Pending' && (
                                  <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mb: 0.5 }}>
                                    🌙 {match.moonSign}
                                  </Typography>
                                )}
                                {match.ascendant && match.ascendant !== 'Pending' && (
                                  <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mb: 1 }}>
                                    ⬆️ {match.ascendant} Lagna
                                  </Typography>
                                )}
                                <Button
                                  variant="outlined" size="small" fullWidth
                                  startIcon={isWithdrawing ? <CircularProgress size={12} color="inherit" /> : <UserMinus size={14} />}
                                  disabled={isWithdrawing}
                                  onClick={() => handleWithdrawInterest(match.id)}
                                  sx={{ borderRadius: 3, fontWeight: 700, fontSize: '0.78rem', borderColor: 'error.main', color: 'error.main', '&:hover': { bgcolor: 'error.50' }, textTransform: 'none' }}
                                >
                                  Withdraw Interest
                                </Button>
                              </Box>
                            </Box>
                          </motion.div>
                        </Grid>
                      );
                    })}
                  </Grid>
                </Grid>
              )}
            </Grid>
          )}

        </Box>
      )}

      <FilterBar onFilterChange={setFilters} onReset={handleResetFilters} />

      {error && (
        <Alert
          severity="error"
          sx={{ mb: 4, borderRadius: 4 }}
          action={
            <Button color="inherit" size="small" onClick={() => fetchMatches(true)} startIcon={<RefreshCw size={16} />}>
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
                onClick={() => fetchMatches(true)}
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
