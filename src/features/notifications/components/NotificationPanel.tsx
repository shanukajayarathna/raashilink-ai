import React from 'react';
import {
  Box, Typography, Avatar, IconButton, Divider,
  CircularProgress, Tooltip,
} from '@mui/material';
import { Heart, Sparkles, CheckCheck, X, MessageCircle, HeartOff, HeartHandshake, CalendarHeart, UserMinus } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import type { AppNotification } from '../services/notificationService';

interface Props {
  open: boolean;
  onClose: () => void;
  notifications: AppNotification[];
  loading: boolean;
  onMarkRead: (id: string) => void;
  onMarkAllRead: () => void;
  anchorRef: React.RefObject<HTMLButtonElement>;
}

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

function initials(name: string) {
  return name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);
}

export default function NotificationPanel({
  open, onClose, notifications, loading, onMarkRead, onMarkAllRead, anchorRef,
}: Props) {
  const navigate = useNavigate();
  // Only ever show unread — read ones are removed from state by the parent
  const unread = notifications.length;

  const handleClick = (n: AppNotification) => {
    onMarkRead(n.id);
    onClose();
    if (n.type === 'mutual_match' || n.type === 'message_received') {
      navigate('/messages', { state: { conversationId: n.conversationId } });
    } else if (n.type === 'wedding_invite' || n.type === 'wedding_accepted' || n.type === 'wedding_planning_unlocked' || n.type === 'wedding_cancelled') {
      navigate('/wedding');
    } else if (n.type === 'interest_declined' || n.type === 'match_removed') {
      // No navigation needed — just dismiss
    } else {
      navigate(`/matches?user=${n.fromUserId}`);
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <div className="fixed inset-0 z-40" onClick={onClose} />

          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ duration: 0.18 }}
            style={{
              position: 'fixed',
              top: 68,
              right: 16,
              zIndex: 1300,
              width: 360,
              maxHeight: '80vh',
              display: 'flex',
              flexDirection: 'column',
              borderRadius: 16,
              overflow: 'hidden',
              boxShadow: '0 20px 60px rgba(0,0,0,0.15)',
              background: 'white',
              border: '1px solid rgba(139,26,46,0.1)',
            }}
          >
            {/* Header */}
            <Box sx={{ px: 2.5, py: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid', borderColor: 'divider', flexShrink: 0 }}>
              <Box>
                <Typography variant="subtitle1" sx={{ fontWeight: 700, color: 'primary.main' }}>
                  Notifications
                </Typography>
                {unread > 0 && (
                  <Typography variant="caption" color="text.secondary">
                    {unread} unread
                  </Typography>
                )}
              </Box>
              <Box sx={{ display: 'flex', gap: 0.5 }}>
                {unread > 0 && (
                  <Tooltip title="Mark all read">
                    <IconButton size="small" onClick={onMarkAllRead} sx={{ color: 'primary.main' }}>
                      <CheckCheck size={16} />
                    </IconButton>
                  </Tooltip>
                )}
                <IconButton size="small" onClick={onClose}>
                  <X size={16} />
                </IconButton>
              </Box>
            </Box>

            {/* Body */}
            <Box sx={{ overflowY: 'auto', flex: 1 }}>
              {loading ? (
                <Box sx={{ py: 6, display: 'flex', justifyContent: 'center' }}>
                  <CircularProgress size={28} />
                </Box>
              ) : notifications.length === 0 ? (
                <Box sx={{ py: 8, textAlign: 'center', color: 'text.secondary' }}>
                  <Heart size={40} strokeWidth={1.5} style={{ margin: '0 auto 12px', opacity: 0.3 }} />
                  <Typography variant="body2">All caught up!</Typography>
                  <Typography variant="caption">No unread notifications</Typography>
                </Box>
              ) : (
                <AnimatePresence initial={false}>
                  {notifications.map((n, i) => (
                    <motion.div
                      key={n.id}
                      initial={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0, overflow: 'hidden' }}
                      transition={{ duration: 0.22 }}
                    >
                      <Box
                        onClick={() => handleClick(n)}
                        sx={{
                          display: 'flex',
                          gap: 1.5,
                          px: 2.5,
                          py: 1.75,
                          cursor: 'pointer',
                          bgcolor: 'rgba(139,26,46,0.04)',
                          transition: 'background 0.15s',
                          '&:hover': { bgcolor: 'rgba(139,26,46,0.08)' },
                          position: 'relative',
                        }}
                      >
                      {/* Unread dot */}
                      <Box sx={{
                        position: 'absolute',
                        left: 8,
                        top: '50%',
                        transform: 'translateY(-50%)',
                        width: 6,
                        height: 6,
                        borderRadius: '50%',
                        bgcolor: 'primary.main',
                      }} />

                      {/* Avatar with badge */}
                      <Box sx={{ position: 'relative', flexShrink: 0 }}>
                        <Avatar
                          src={n.fromUserProfilePic || undefined}
                          sx={{ width: 44, height: 44, bgcolor: 'primary.main', fontSize: 14 }}
                        >
                          {initials(n.fromUserName)}
                        </Avatar>
                        <Box sx={{
                          position: 'absolute',
                          bottom: -2,
                          right: -2,
                          width: 20,
                          height: 20,
                          borderRadius: '50%',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          bgcolor: n.type === 'mutual_match' ? '#f59e0b' : n.type === 'message_received' ? '#2563eb' : n.type === 'interest_accepted' ? '#16a34a' : (n.type === 'interest_declined' || n.type === 'match_removed' || n.type === 'wedding_cancelled') ? '#6b7280' : (n.type === 'wedding_invite' || n.type === 'wedding_accepted' || n.type === 'wedding_planning_unlocked') ? '#be185d' : '#8B1A2E',
                          border: '2px solid white',
                        }}>
                          {n.type === 'mutual_match'
                            ? <Sparkles size={10} color="white" />
                            : n.type === 'message_received'
                            ? <MessageCircle size={10} color="white" />
                            : n.type === 'interest_accepted'
                            ? <HeartHandshake size={10} color="white" />
                            : n.type === 'interest_declined'
                            ? <HeartOff size={10} color="white" />
                            : n.type === 'match_removed'
                            ? <UserMinus size={10} color="white" />
                            : n.type === 'wedding_invite'
                            ? <CalendarHeart size={10} color="white" />
                            : n.type === 'wedding_accepted'
                            ? <CalendarHeart size={10} color="white" />
                            : n.type === 'wedding_planning_unlocked'
                            ? <CalendarHeart size={10} color="white" />
                            : n.type === 'wedding_cancelled'
                            ? <HeartOff size={10} color="white" />
                            : <Heart size={10} color="white" fill="white" />
                          }
                        </Box>
                      </Box>

                      {/* Text */}
                      <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Typography variant="body2" sx={{ fontWeight: 600, lineHeight: 1.4 }}>
                          {n.type === 'mutual_match' ? (
                            <>
                              <span style={{ color: '#8B1A2E' }}>{n.fromUserName}</span>
                              {' '}& you are a mutual match!{' '}
                              <span style={{ color: '#f59e0b' }}>✨</span>
                            </>
                          ) : n.type === 'message_received' ? (
                            <>
                              <span style={{ color: '#2563eb' }}>{n.fromUserName}</span>
                              {' '}sent you a message
                            </>
                          ) : n.type === 'interest_accepted' ? (
                            <>
                              <span style={{ color: '#16a34a' }}>{n.fromUserName}</span>
                              {' '}accepted your interest!{' '}
                              <span style={{ color: '#16a34a' }}>🎉</span>
                            </>
                          ) : n.type === 'interest_declined' ? (
                            <>
                              <span style={{ color: '#6b7280' }}>{n.fromUserName}</span>
                              {' '}declined your interest
                            </>
                          ) : n.type === 'match_removed' ? (
                            <>
                              <span style={{ color: '#6b7280' }}>{n.fromUserName}</span>
                              {' '}removed you from their matches
                            </>
                          ) : n.type === 'wedding_invite' ? (
                            <>
                              <span style={{ color: '#be185d' }}>{n.fromUserName}</span>
                              {' '}invited you to plan your wedding together! 💍
                            </>
                          ) : n.type === 'wedding_accepted' ? (
                            <>
                              <span style={{ color: '#be185d' }}>{n.fromUserName}</span>
                              {' '}accepted your wedding invite! 🎉
                            </>
                          ) : n.type === 'wedding_planning_unlocked' ? (
                            <>
                              <span style={{ color: '#be185d' }}>{n.fromUserName}</span>
                              {' '}& you can now plan your wedding together! 🎊
                            </>
                          ) : n.type === 'wedding_cancelled' ? (
                            <>
                              <span style={{ color: '#6b7280' }}>{n.metadata?.cancelledBySelf ? 'You' : (n.fromUserName || 'This user')}</span>
                              {n.metadata?.isDecline ? ' declined the wedding invite' : ' cancelled wedding planning'}
                            </>
                          ) : (
                            <>
                              <span style={{ color: '#8B1A2E' }}>{n.fromUserName}</span>
                              {' '}expressed interest in you
                            </>
                          )}
                        </Typography>
                        {n.type === 'message_received' && n.preview && (
                          <Typography variant="caption" color="text.secondary"
                            sx={{ display: 'block', mt: 0.25, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 200 }}>
                            {n.preview}
                          </Typography>
                        )}
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
                          <Typography variant="caption" color="text.secondary">
                            {timeAgo(n.createdAt)}
                          </Typography>
                          {n.type === 'mutual_match' ? (
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, color: '#f59e0b' }}>
                              <MessageCircle size={11} />
                              <Typography variant="caption" sx={{ color: '#f59e0b', fontWeight: 600 }}>
                                Tap to chat
                              </Typography>
                            </Box>
                          ) : n.type === 'message_received' ? (
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, color: '#2563eb' }}>
                              <MessageCircle size={11} />
                              <Typography variant="caption" sx={{ color: '#2563eb', fontWeight: 600 }}>
                                Tap to reply
                              </Typography>
                            </Box>
                          ) : n.type === 'interest_accepted' ? (
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, color: '#16a34a' }}>
                              <HeartHandshake size={11} />
                              <Typography variant="caption" sx={{ color: '#16a34a', fontWeight: 600 }}>
                                View profile
                              </Typography>
                            </Box>
                          ) : n.type === 'interest_declined' ? (
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, color: '#6b7280' }}>
                              <HeartOff size={11} />
                              <Typography variant="caption" sx={{ color: '#6b7280', fontWeight: 600 }}>
                                Tap to dismiss
                              </Typography>
                            </Box>
                          ) : n.type === 'match_removed' ? (
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, color: '#6b7280' }}>
                              <HeartOff size={11} />
                              <Typography variant="caption" sx={{ color: '#6b7280', fontWeight: 600 }}>
                                Tap to dismiss
                              </Typography>
                            </Box>
                          ) : (n.type === 'wedding_invite' || n.type === 'wedding_accepted' || n.type === 'wedding_planning_unlocked') ? (
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, color: '#be185d' }}>
                              <CalendarHeart size={11} />
                              <Typography variant="caption" sx={{ color: '#be185d', fontWeight: 600 }}>
                                {n.type === 'wedding_invite' ? 'Accept on Wedding page' : 'Go to Wedding page'}
                              </Typography>
                            </Box>
                          ) : n.type === 'wedding_cancelled' ? (
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, color: '#6b7280' }}>
                              <HeartOff size={11} />
                              <Typography variant="caption" sx={{ color: '#6b7280', fontWeight: 600 }}>
                                Go to Wedding page
                              </Typography>
                            </Box>
                          ) : (
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                              <Heart size={11} color="#8B1A2E" />
                              <Typography variant="caption" sx={{ color: '#8B1A2E', fontWeight: 600 }}>
                                View profile
                              </Typography>
                            </Box>
                          )}
                        </Box>
                      </Box>
                    </Box>
                    {i < notifications.length - 1 && <Divider sx={{ mx: 2.5 }} />}
                    </motion.div>
                  ))}
                </AnimatePresence>
              )}
            </Box>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
