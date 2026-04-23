import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Link, useNavigate, useLocation, Outlet } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { Avatar, useMediaQuery, useTheme } from '@mui/material';
import { RootState } from '@/app/store/store';
import { logout } from '@/features/auth/store/authSlice';
import { 
  Menu, X, Bell, User, LogOut, 
  Heart, Calendar, Calculator, MessageSquare, 
  LayoutDashboard, Star, MapPin, Search, MessageCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '@/shared/lib/utils';
import FloatingRaashiBot from '@/features/chat/components/FloatingRaashiBot';
import NotificationPanel from '@/features/notifications/components/NotificationPanel';
import notificationService, { type AppNotification } from '@/features/notifications/services/notificationService';
import { playInterestSound, playMatchSound, playMessageSound, playWeddingInviteSound } from '@/features/notifications/utils/sounds';;
import api from '@/shared/config/axiosConfig';
import { connectSocket } from '@/shared/hooks/useRealtimeUpdates';
import { consumeSentPreview } from '@/shared/lib/sentMsgTracker';

// Persist which conversation previews the user has already acknowledged,
// so we don't re-fire notifications for old messages on every login.
const getSeenPreviews = (uid: string): Record<string, string> => {
  try { return JSON.parse(localStorage.getItem(`rl_seen_${uid}`) || '{}'); } catch { return {}; }
};
const saveSeenPreviews = (uid: string, map: Record<string, string>) => {
  try { localStorage.setItem(`rl_seen_${uid}`, JSON.stringify(map)); } catch {}
};

export default function MainLayout({ children }: { children?: React.ReactNode }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifLoading, setNotifLoading] = useState(false);
  const bellRef = useRef<HTMLButtonElement>(null);
  const prevIdsRef = useRef<Set<string>>(new Set());
  const convPrevRef = useRef<Record<string, string>>({});
  const convSeeded = useRef(false);
  const clientMsgCountRef = useRef(0);
  const [msgNotif, setMsgNotif] = useState<{ name: string; content: string; conversationId?: string } | null>(null);
  const [eventNotif, setEventNotif] = useState<{ icon: string; title: string; body: string; path?: string; color?: string } | null>(null);
  const eventNotifTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const notifTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();
  const { user, token } = useSelector((state: RootState) => state.auth);
  const currentUserId = (user as any)?._id || (user as any)?.id || '';
  const theme = useTheme();
  const isLargeScreen = useMediaQuery(theme.breakpoints.up('lg'));
  const isCouple = user?.profileType === 'couple';
  const avatarSrc = user?.profilePic || user?.photos?.find?.((photo: any) => photo?.isMain)?.url || undefined;

  const fetchNotifications = useCallback(async (silent = false) => {
    if (!token) return;
    if (!silent) setNotifLoading(true);
    try {
      const data = await notificationService.getAll();
      // Preserve client-side message_received notifs already in state (added by conv poller)
      setNotifications((prev) => {
        const clientMsgNotifs = prev.filter((n) => n.type === 'message_received');
        return [...clientMsgNotifs, ...data.notifications];
      });
      setUnreadCount(data.unreadCount + clientMsgCountRef.current);
      const currentIds = new Set(data.notifications.map((n) => n.id));
      const newOnes = data.notifications.filter((n) => !prevIdsRef.current.has(n.id));
      if (prevIdsRef.current.size > 0 && newOnes.length > 0) {
        const hasMatch = newOnes.some((n) => n.type === 'mutual_match');
        if (hasMatch) playMatchSound();
        else playInterestSound();
      }
      prevIdsRef.current = currentIds;
    } catch {
      // silent fail
    } finally {
      if (!silent) setNotifLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchNotifications();
    if (!token) return;
    const interval = setInterval(() => fetchNotifications(true), 30_000);
    return () => clearInterval(interval);
  }, [fetchNotifications, token]);

  // ── Real-time notification bell updates ──────────────────────────────────
  // Listen to match/interest socket events and immediately refresh the bell
  // so both parties see notifications without waiting for the 30s poll.
  useEffect(() => {
    if (!token) return;
    const socket = connectSocket(token);

    const onMutualMatch = (payload: any) => {
      fetchNotifications(true);
      window.dispatchEvent(new CustomEvent('app:refresh'));
      playMatchSound();
      showEventNotifRef.current('🎉', "It's a Match!", `You and ${payload.fromUserName || 'someone'} are now connected!`, '/messages', '#f59e0b');
    };
    const onInterestReceived = (payload: any) => {
      fetchNotifications(true);
      window.dispatchEvent(new CustomEvent('app:refresh'));
      playInterestSound();
      showEventNotifRef.current('💛', `${payload.fromUserName || 'Someone'} liked you!`, 'They expressed interest in you — check your matches.', '/matches', '#f59e0b');
    };
    const onInterestAccepted = (payload: any) => {
      fetchNotifications(true);
      window.dispatchEvent(new CustomEvent('app:refresh'));
      playInterestSound();
      showEventNotifRef.current('🥳', `${payload.fromUserName || 'Someone'} accepted your interest!`, 'You can now message each other.', '/messages', '#16a34a');
    };
    const onInterestDeclined = (payload: any) => {
      fetchNotifications(true);
      window.dispatchEvent(new CustomEvent('app:refresh'));
      showEventNotifRef.current('💔', 'Interest declined', `${payload.fromUserName || 'Someone'} has declined your interest.`, '/matches', '#6b7280');
    };
    const onMatchRemoved = () => {
      fetchNotifications(true);
      window.dispatchEvent(new CustomEvent('app:refresh'));
      showEventNotifRef.current('👋', 'Match removed', 'Someone removed you from their matches.', '/matches', '#6b7280');
    };

    socket.on('interest_received', onInterestReceived);
    socket.on('mutual_match', onMutualMatch);
    socket.on('interest_accepted', onInterestAccepted);
    socket.on('interest_declined', onInterestDeclined);
    socket.on('match_removed', onMatchRemoved);

    // Real-time server-pushed notifications (e.g. wedding invites)
    const onNotification = (payload: AppNotification) => {
      window.dispatchEvent(new CustomEvent('app:refresh'));
      setNotifications((prev) => {
        if (prev.some((n) => n.id === payload.id)) return prev;
        return [payload, ...prev];
      });
      setUnreadCount((c) => c + 1);
      if (payload.type === 'wedding_invite') {
        playWeddingInviteSound();
        showEventNotifRef.current('💍', `${payload.fromUserName} invited you!`, 'Plan your wedding together — tap to accept.', '/wedding', '#be185d');
      } else if (payload.type === 'wedding_accepted') {
        playWeddingInviteSound();
        showEventNotifRef.current('🎉', `${payload.fromUserName} accepted your invite!`, 'Your wedding project is now shared. Time to start planning!', '/wedding', '#be185d');
        window.dispatchEvent(new CustomEvent('wedding:partnerAccepted'));
      } else if (payload.type === 'engagement_invite') {
        playInterestSound();
        showEventNotifRef.current('💎', `${payload.fromUserName} proposed an engagement!`, 'Tap to view and respond to the proposal.', '/messages', '#C9A84C');
      } else if (payload.type === 'engagement_accepted') {
        playMatchSound();
        showEventNotifRef.current('💍', `${payload.fromUserName} accepted your proposal!`, 'You are now engaged — celebrate and start planning!', '/messages', '#C9A84C');
      } else if (payload.type === 'engagement_cancelled') {
        showEventNotifRef.current('💔', 'Engagement cancelled', `${payload.fromUserName} has cancelled the engagement.`, '/messages', '#6b7280');
      } else if (payload.type === 'interest_accepted') {
        playInterestSound();
        showEventNotifRef.current('🥳', `${payload.fromUserName} accepted your interest!`, 'You can now message each other.', '/messages', '#16a34a');
      } else if (payload.type === 'interest_declined') {
        showEventNotifRef.current('💔', 'Interest declined', `${payload.fromUserName} has declined your interest.`, '/matches', '#6b7280');
      } else if (payload.type === 'match_removed') {
        showEventNotifRef.current('👋', 'Match removed', `${payload.fromUserName} removed you from their matches.`, '/matches', '#6b7280');
      } else if (payload.type === 'mutual_match') {
        playMatchSound();
        showEventNotifRef.current('🎉', "It's a Match!", `You and ${payload.fromUserName} are now connected!`, '/messages', '#f59e0b');
      } else {
        playInterestSound();
      }
    };
    socket.on('notification', onNotification);

    // Listen for acceptee-side wedding accept (dispatched from WeddingDashboard)
    const onWeddingAcceptedSelf = (e: Event) => {
      const { inviterName } = (e as CustomEvent).detail ?? {};
      playWeddingInviteSound();
      showEventNotifRef.current('🎉', 'Wedding invite accepted!', `You and ${inviterName || 'your partner'} are now planning together!`, '/wedding', '#be185d');
    };
    window.addEventListener('wedding:accepted', onWeddingAcceptedSelf);

    // When the other user removes the match, their wedding project gets reset
    const onWeddingReset = () => {
      showEventNotifRef.current('💔', 'Wedding project reset', 'Your match removed you — your wedding project has been reset.', '/wedding', '#6b7280');
      window.dispatchEvent(new CustomEvent('wedding:reset'));
      window.dispatchEvent(new CustomEvent('app:refresh'));
    };
    socket.on('wedding_reset', onWeddingReset);

    return () => {
      socket.off('interest_received', onInterestReceived);
      socket.off('mutual_match', onMutualMatch);
      socket.off('interest_accepted', onInterestAccepted);
      socket.off('interest_declined', onInterestDeclined);
      socket.off('match_removed', onMatchRemoved);
      socket.off('notification', onNotification);
      socket.off('wedding_reset', onWeddingReset);
      window.removeEventListener('wedding:accepted', onWeddingAcceptedSelf);
    };
  }, [token, fetchNotifications]);

  const handleMarkRead = async (id: string) => {
    const notif = notifications.find((n) => n.id === id);
    if (notif?.type === 'message_received') {
      clientMsgCountRef.current = Math.max(0, clientMsgCountRef.current - 1);
      // Persist the seen state so this notification doesn't re-fire on next login
      if (notif.conversationId && currentUserId) {
        const seenMap = getSeenPreviews(currentUserId);
        seenMap[notif.conversationId] = notif.preview || convPrevRef.current[notif.conversationId] || '';
        saveSeenPreviews(currentUserId, seenMap);
      }
    } else {
      await notificationService.markRead(id);
    }
    setNotifications((prev) => prev.filter((n) => n.id !== id));
    setUnreadCount((c) => Math.max(0, c - 1));
  };

  const handleMarkAllRead = async () => {
    await notificationService.markAllRead();
    // Persist all current previews as seen so message notifs don't re-fire on next login
    if (currentUserId) {
      const seenMap = { ...convPrevRef.current };
      // Also capture any message_received notifs in state (in case first poll hasn't fired yet)
      notifications.forEach((n) => {
        if (n.type === 'message_received' && n.conversationId && n.preview) {
          seenMap[n.conversationId] = n.preview;
        }
      });
      saveSeenPreviews(currentUserId, seenMap);
    }
    clientMsgCountRef.current = 0;
    setNotifications([]);
    setUnreadCount(0);
  };

  // When user navigates to /messages, silently remove all mutual_match + message_received notifications
  useEffect(() => {
    if (location.pathname !== '/messages') return;
    // Always save current previews as seen when the user opens /messages
    if (currentUserId && Object.keys(convPrevRef.current).length > 0) {
      saveSeenPreviews(currentUserId, { ...convPrevRef.current });
    }
    const toRemove = notifications.filter((n) => n.type === 'mutual_match' || n.type === 'message_received');
    if (toRemove.length === 0) return;
    // Only call markAllRead for real DB notifications (not client-side msg ones)
    const dbOnes = toRemove.filter((n) => !n.id.startsWith('msg-'));
    if (dbOnes.length > 0) notificationService.markAllRead().catch(() => {});
    clientMsgCountRef.current = 0;
    setNotifications((prev) => prev.filter((n) => n.type !== 'mutual_match' && n.type !== 'message_received'));
    setUnreadCount((c) => Math.max(0, c - toRemove.length));
    // Mark all current previews as seen so they don't re-fire on next login
    if (currentUserId) {
      const seenMap = { ...convPrevRef.current };
      toRemove.forEach((n) => {
        if (n.type === 'message_received' && n.conversationId && n.preview) {
          seenMap[n.conversationId] = n.preview;
        }
      });
      saveSeenPreviews(currentUserId, seenMap);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname]);

  const partnerNavItems = [
    { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { name: 'Matches', path: '/matches', icon: Heart },
    { name: 'Messages', path: '/messages', icon: MessageCircle },
    { name: 'Horoscope', path: '/horoscope', icon: Star },
    { name: 'Wedding', path: '/wedding', icon: Calendar },
    { name: 'Vendors', path: '/vendors', icon: Search },
    { name: 'Honeymoon', path: '/honeymoon', icon: MapPin },
  ];
  const coupleNavItems = [
    { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { name: 'Horoscope', path: '/horoscope', icon: Star },
    { name: 'Wedding', path: '/wedding', icon: Calendar },
    { name: 'Vendors', path: '/vendors', icon: Search },
    { name: 'Honeymoon', path: '/honeymoon', icon: MapPin },
  ];
  const navItems = isCouple ? coupleNavItems : partnerNavItems;

  const handleLogout = () => {
    // Save all current previews as seen before logging out so they don't re-fire on next login
    if (currentUserId) saveSeenPreviews(currentUserId, { ...convPrevRef.current });
    dispatch(logout());
    navigate('/');
  };

  const initials = (name: string) =>
    name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);

  const showMsgNotif = useCallback((name: string, content: string, conversationId?: string) => {
    if (notifTimerRef.current) clearTimeout(notifTimerRef.current);
    setMsgNotif({ name, content, conversationId });
    notifTimerRef.current = setTimeout(() => setMsgNotif(null), 4500);
  }, []);

  const showEventNotif = useCallback((icon: string, title: string, body: string, path?: string, color?: string) => {
    if (eventNotifTimerRef.current) clearTimeout(eventNotifTimerRef.current);
    setEventNotif({ icon, title, body, path, color });
    eventNotifTimerRef.current = setTimeout(() => setEventNotif(null), 6000);
  }, []);

  const showEventNotifRef = useRef(showEventNotif);
  useEffect(() => { showEventNotifRef.current = showEventNotif; }, [showEventNotif]);

  // Poll conversations globally so message notifications fire on every page
  useEffect(() => {
    if (!token) return;
    // Reset seed state on every (re-)login so the localStorage check always runs fresh
    convSeeded.current = false;
    convPrevRef.current = {};
    const poll = async () => {
      try {
        const res: any = await api.get('/chat/conversations');
        const fresh: Array<{ id: string; title: string; otherUserId: string | null; preview: string; lastSenderId: string | null }> = res.data?.data?.items || [];
        if (!convSeeded.current) {
          const map: Record<string, string> = {};
          const pendingMsgNotifs: AppNotification[] = [];
          const seenMap = getSeenPreviews(currentUserId);
          fresh.forEach((c) => {
            map[c.id] = c.preview;
            // Only notify if the last sender is someone else AND the preview
            // is different from what the user last acknowledged (i.e. a new unseen message).
            if (c.lastSenderId && c.lastSenderId !== currentUserId && c.preview !== seenMap[c.id]) {
              pendingMsgNotifs.push({
                id: `msg-${c.id}`,
                type: 'message_received',
                fromUserId: c.otherUserId || '',
                fromUserName: c.title,
                fromUserProfilePic: null,
                conversationId: c.id,
                read: false,
                createdAt: new Date().toISOString(),
                preview: c.preview,
              });
            }
          });
          convPrevRef.current = map;
          convSeeded.current = true;
          // For conversations that had NO new message, mark them as seen now
          // so they never fire on the next login either.
          if (currentUserId) {
            const pendingIds = new Set(pendingMsgNotifs.map((n) => n.conversationId));
            const updatedSeen = { ...seenMap };
            Object.entries(map).forEach(([convId, preview]) => {
              if (!pendingIds.has(convId)) updatedSeen[convId] = preview;
            });
            saveSeenPreviews(currentUserId, updatedSeen);
          }
          if (pendingMsgNotifs.length > 0) {
            setNotifications((prev) => [...pendingMsgNotifs, ...prev]);
            setUnreadCount((count) => count + pendingMsgNotifs.length);
            clientMsgCountRef.current += pendingMsgNotifs.length;
            playMessageSound();
            showMsgNotif(pendingMsgNotifs[0].fromUserName, pendingMsgNotifs[0].preview ?? '', pendingMsgNotifs[0].conversationId ?? undefined);
          }
          return;
        }
        let notifName = '';
        let notifContent = '';
        let notifConvId = '';
        let notifUserId = '';
        fresh.forEach((c) => {
          const known = convPrevRef.current[c.id];
          if (known !== undefined && c.preview !== known && !consumeSentPreview(c.id, c.preview)) {
            notifName = c.title;
            notifContent = c.preview;
            notifConvId = c.id;
            notifUserId = c.otherUserId || '';
          }
          convPrevRef.current[c.id] = c.preview;
        });
        if (notifName) {
          // Add to bell as well as popup
          const liveNotif: AppNotification = {
            id: `msg-live-${Date.now()}`,
            type: 'message_received',
            fromUserId: notifUserId,
            fromUserName: notifName,
            fromUserProfilePic: null,
            conversationId: notifConvId,
            read: false,
            createdAt: new Date().toISOString(),
            preview: notifContent,
          };
          setNotifications((prev) => [liveNotif, ...prev]);
          setUnreadCount((count) => count + 1);
          clientMsgCountRef.current += 1;
          playMessageSound();
          showMsgNotif(notifName, notifContent, notifConvId);
        }
      } catch {
        // silent
      }
    };
    poll();
    const interval = setInterval(poll, 5000);
    return () => clearInterval(interval);
  }, [token, currentUserId, showMsgNotif]);

  if (!token) return <>{children || <Outlet />}</>;

  return (
    <div className="min-h-screen bg-cream relative flex flex-col">
      {/* Fixed Background Layer to prevent flicker on route change */}
      <div className="fixed inset-0 mandala-bg opacity-[0.4] pointer-events-none z-0" />
      
      {/* Top Navigation */}
      <header className="fixed top-0 left-0 right-0 h-16 bg-white/80 backdrop-blur-md border-b border-primary/10 z-50 px-4 md:px-8 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="p-2 hover:bg-primary/5 rounded-lg lg:hidden"
          >
            <Menu className="w-6 h-6 text-primary" />
          </button>
          <Link to="/dashboard" className="flex items-center gap-2">
            <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center">
              <Star className="w-6 h-6 text-secondary" />
            </div>
            <span className="text-xl font-serif font-bold text-primary hidden sm:block">RaashiLink.AI</span>
          </Link>
        </div>

        <div className="flex items-center gap-2 md:gap-4">
          <div className="hidden lg:flex items-center gap-1">
            {navItems.map((item) => (
              <Link 
                key={item.path}
                to={item.path}
                className={cn(
                  "px-3 py-2 rounded-full text-sm font-medium transition-colors whitespace-nowrap",
                  location.pathname === item.path 
                    ? "bg-primary text-white" 
                    : "text-textSecondary hover:bg-primary/5 hover:text-primary"
                )}
              >
                {item.name}
              </Link>
            ))}
          </div>

          <button
            ref={bellRef}
            onClick={() => { setIsNotifOpen((o) => !o); setIsUserMenuOpen(false); }}
            className="p-2 hover:bg-primary/5 rounded-full relative transition-colors"
            aria-label="Notifications"
          >
            <Bell className={`w-6 h-6 ${unreadCount > 0 ? 'text-primary' : 'text-textSecondary'}`} />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 min-w-[18px] h-[18px] bg-red-500 rounded-full flex items-center justify-center text-white text-[10px] font-bold border-2 border-white px-0.5">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          <div className="relative">
            <button 
              onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
              className="flex items-center gap-2 p-1 hover:bg-primary/5 rounded-full transition-colors"
            >
              <Avatar
                src={avatarSrc}
                alt={user?.name || 'User'}
                sx={{
                  width: 36,
                  height: 36,
                  bgcolor: 'rgba(201,168,76,0.2)',
                  color: '#8B1A2E',
                  border: '1px solid rgba(201,168,76,0.3)',
                }}
              >
                {!avatarSrc && <User className="w-5 h-5 text-primary" />}
              </Avatar>
            </button>

            <AnimatePresence>
              {isUserMenuOpen && (
                <>
                  <div 
                    className="fixed inset-0 z-40" 
                    onClick={() => setIsUserMenuOpen(false)}
                  />
                  <motion.div 
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-xl border border-primary/10 py-2 z-50"
                  >
                    <div className="px-4 py-3 border-b border-primary/5">
                      <p className="text-sm font-semibold text-textPrimary">{user?.name || 'User'}</p>
                      <p className="text-xs text-textSecondary truncate">{user?.email || 'user@example.com'}</p>
                    </div>
                    <Link to="/profile" onClick={() => setIsUserMenuOpen(false)} className="flex items-center gap-3 px-4 py-2 text-sm text-textSecondary hover:bg-primary/5 hover:text-primary transition-colors">
                      <User className="w-4 h-4" /> Profile
                    </Link>
                    <button 
                      onClick={handleLogout}
                      className="w-full flex items-center gap-3 px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                    >
                      <LogOut className="w-4 h-4" /> Logout
                    </button>
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>
        </div>
      </header>

      {/* Mobile Sidebar */}
      <AnimatePresence>
        {isSidebarOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsSidebarOpen(false)}
              className="fixed inset-0 bg-black/20 backdrop-blur-sm z-[60] lg:hidden"
            />
            <motion.aside 
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              className="fixed top-0 left-0 bottom-0 w-72 bg-white z-[70] lg:hidden shadow-2xl flex flex-col"
            >
              <div className="p-6 flex items-center justify-between border-b border-primary/5">
                <div className="flex items-center gap-2">
                  <Star className="w-6 h-6 text-secondary" />
                  <span className="text-xl font-serif font-bold text-primary">RaashiLink</span>
                </div>
                <button onClick={() => setIsSidebarOpen(false)}>
                  <X className="w-6 h-6 text-textSecondary" />
                </button>
              </div>
              <nav className="flex-1 p-4 space-y-1">
                {navItems.map((item) => (
                  <Link 
                    key={item.path}
                    to={item.path}
                    onClick={() => setIsSidebarOpen(false)}
                    className={cn(
                      "flex items-center gap-4 px-4 py-3 rounded-xl text-sm font-medium transition-all",
                      location.pathname === item.path 
                        ? "bg-primary text-white shadow-lg shadow-primary/20" 
                        : "text-textSecondary hover:bg-primary/5 hover:text-primary"
                    )}
                  >
                    <item.icon className="w-5 h-5" />
                    {item.name}
                  </Link>
                ))}
              </nav>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <main className="flex-1 pt-24 pb-12 px-4 md:px-8 w-full">
        <div className="max-w-7xl mx-auto">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
          >
            {children || <Outlet />}
          </motion.div>
        </div>
      </main>

      {/* Floating RaashiBot */}
      <FloatingRaashiBot />

      {/* Notification Panel */}
      <NotificationPanel
        open={isNotifOpen}
        onClose={() => setIsNotifOpen(false)}
        notifications={notifications}
        loading={notifLoading}
        onMarkRead={handleMarkRead}
        onMarkAllRead={handleMarkAllRead}
        anchorRef={bellRef}
      />

      {/* WhatsApp-style message notification toast */}
      <AnimatePresence>
        {msgNotif && (
          <motion.div
            key="msg-toast"
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -14, scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 380, damping: 28 }}
            style={{ position: 'fixed', top: 72, right: 20, zIndex: 9999, maxWidth: 340, minWidth: 260 }}
          >
            <div
              className="flex items-center gap-3 bg-white rounded-2xl shadow-2xl border-l-4 border-primary p-3 cursor-pointer"
              onClick={() => { setMsgNotif(null); navigate('/messages', { state: { conversationId: msgNotif.conversationId } }); }}
            >
              <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                {initials(msgNotif.name)}
              </div>
              <div className="flex-1 overflow-hidden">
                <p className="text-sm font-bold text-textPrimary leading-tight">{msgNotif.name}</p>
                <p className="text-xs text-textSecondary truncate">{msgNotif.content}</p>
              </div>
              <button
                className="flex-shrink-0 text-textSecondary hover:text-textPrimary transition-colors"
                onClick={(e) => { e.stopPropagation(); setMsgNotif(null); }}
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Event notification toast (wedding invite / accept) */}
      <AnimatePresence>
        {eventNotif && (
          <motion.div
            key="event-toast"
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -14, scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 380, damping: 28 }}
            style={{ position: 'fixed', top: msgNotif ? 128 : 72, right: 20, zIndex: 9998, maxWidth: 360, minWidth: 280 }}
          >
            <div
              className="flex items-center gap-3 bg-white rounded-2xl shadow-2xl border-l-4 p-3 cursor-pointer"
              style={{ borderLeftColor: eventNotif.color || '#be185d' }}
              onClick={() => { setEventNotif(null); if (eventNotif.path) navigate(eventNotif.path); }}
            >
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center text-xl flex-shrink-0"
                style={{ background: `linear-gradient(135deg, ${eventNotif.color ? eventNotif.color + '22' : '#fce7f3'}, ${eventNotif.color ? eventNotif.color + '33' : '#ffe4e6'})` }}
              >
                {eventNotif.icon}
              </div>
              <div className="flex-1 overflow-hidden">
                <p className="text-sm font-bold leading-tight" style={{ color: eventNotif.color || '#be185d' }}>{eventNotif.title}</p>
                <p className="text-xs text-textSecondary mt-0.5">{eventNotif.body}</p>
              </div>
              <button
                className="flex-shrink-0 text-textSecondary hover:text-textPrimary transition-colors"
                onClick={(e) => { e.stopPropagation(); setEventNotif(null); }}
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Mobile Bottom Nav */}
      <nav className="fixed bottom-0 left-0 right-0 h-16 bg-white border-t border-primary/10 z-50 md:hidden flex items-center justify-around px-2">
        {navItems.slice(0, 5).map((item) => (
          <Link 
            key={item.path}
            to={item.path}
            className={cn(
              "flex flex-col items-center gap-1 p-2 transition-colors",
              location.pathname === item.path ? "text-primary" : "text-textSecondary"
            )}
          >
            <item.icon className="w-5 h-5" />
            <span className="text-[10px] font-medium">{item.name}</span>
          </Link>
        ))}
      </nav>
    </div>
  );
}


