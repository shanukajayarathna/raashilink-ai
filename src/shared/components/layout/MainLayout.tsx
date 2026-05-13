import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Link, useNavigate, useLocation, Outlet } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { Avatar, useMediaQuery, useTheme } from '@mui/material';
import { RootState } from '@/app/store/store';
import { logout, fetchProfile } from '@/features/auth/store/authSlice';
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

export default function MainLayout({ children }: { children?: React.ReactNode }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifLoading, setNotifLoading] = useState(false);
  const bellRef = useRef<HTMLButtonElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const prevIdsRef = useRef<Set<string>>(new Set());
  const activeConversationIdRef = useRef<string | null>(null);
  const [msgNotif, setMsgNotif] = useState<{ name: string; content: string; conversationId?: string } | null>(null);
  const [eventNotif, setEventNotif] = useState<{ icon: string; title: string; body: string; path?: string; color?: string } | null>(null);
  const [pendingMatchCount, setPendingMatchCount] = useState(0);
  const [pendingWeddingAcceptCount, setPendingWeddingAcceptCount] = useState(0);
  const eventNotifTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const notifTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
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
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();
  const { user, token } = useSelector((state: RootState) => state.auth);
  const currentUserId = (user as any)?._id || (user as any)?.id || '';
  const theme = useTheme();
  const isLargeScreen = useMediaQuery(theme.breakpoints.up('lg'));
  const isCouple = user?.profileType === 'couple';
  const isHoroscopeSeeker = user?.profileType === 'horoscope_seeker' || user?.userType === 'horoscope_seeker';
  const avatarSrc = resolveAvatarSrc(
    user?.profilePic,
    user?.personalInfo?.profilePic,
    user?.photos?.find?.((photo: any) => photo?.isMain)?.url,
    user?.photos?.[0]?.url
  );

  const fetchPendingMatchCount = useCallback(async () => {
    if (!token) return;
    try {
      const res: any = await api.get('/matches/pending');
      setPendingMatchCount((res.data?.data?.received || []).length);
    } catch {
      // silent fail
    }
  }, [token]);

  const fetchPendingWeddingCount = useCallback(async () => {
    if (!token) return;
    try {
      const res: any = await api.get('/wedding/couple/pending-invite');
      setPendingWeddingAcceptCount(res.data?.data ? 1 : 0);
    } catch {
      // silent fail
    }
  }, [token]);

  const pendingMessageActionCount = notifications.filter(
    (n) => n.type === 'message_received'
  ).length;

  const shouldSuppressMessageNotif = useCallback((conversationId?: string | null) => {
    if (location.pathname !== '/messages') return false;
    if (!conversationId) return true;
    // When user is on the chat screen, suppress message popups/bell inserts entirely.
    return true;
  }, [location.pathname]);

  const isPathActive = useCallback((path: string) => {
    return location.pathname === path || location.pathname.startsWith(`${path}/`);
  }, [location.pathname]);

  const getNavBadgeCount = (path: string) => {
    // Do not show badge when the user is already in that section.
    if (isPathActive(path) && path !== '/messages') return 0;
    if (path === '/matches') return pendingMatchCount;
    if (path === '/messages') return pendingMessageActionCount;
    if (path === '/wedding') return pendingWeddingAcceptCount;
    return 0;
  };

  const fetchNotifications = useCallback(async (silent = false) => {
    if (!token) return;
    if (!silent) setNotifLoading(true);
    try {
      const data = await notificationService.getAll();
      setNotifications(data.notifications);
      setUnreadCount(data.unreadCount);
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

  // Re-hydrate profile photos from the API on every mount.
  // Photos are stored as data-URIs in the DB and cannot be persisted to
  // localStorage, so they must be re-fetched whenever the page loads.
  useEffect(() => {
    if (token) {
      (dispatch as any)(fetchProfile());
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  useEffect(() => {
    fetchNotifications();
    fetchPendingMatchCount();
    fetchPendingWeddingCount();
    if (!token) return;
    const interval = setInterval(() => fetchNotifications(true), 30_000);
    const pendingInterval = setInterval(() => fetchPendingMatchCount(), 30_000);
    const pendingWeddingInterval = setInterval(() => fetchPendingWeddingCount(), 30_000);
    return () => {
      clearInterval(interval);
      clearInterval(pendingInterval);
      clearInterval(pendingWeddingInterval);
    };
  }, [fetchNotifications, fetchPendingMatchCount, fetchPendingWeddingCount, token]);

  // Close the profile menu when clicking anywhere outside it or pressing Escape.
  useEffect(() => {
    if (!isUserMenuOpen) return;

    const handlePointerDown = (event: MouseEvent | TouchEvent) => {
      const target = event.target as Node | null;
      if (!target) return;
      if (userMenuRef.current?.contains(target)) return;
      setIsUserMenuOpen(false);
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setIsUserMenuOpen(false);
    };

    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('touchstart', handlePointerDown, { passive: true });
    document.addEventListener('keydown', handleEscape);

    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('touchstart', handlePointerDown);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isUserMenuOpen]);

  useEffect(() => {
    const onAppRefresh = () => {
      fetchNotifications(true);
      fetchPendingMatchCount();
      fetchPendingWeddingCount();
    };
    window.addEventListener('app:refresh', onAppRefresh);
    return () => {
      window.removeEventListener('app:refresh', onAppRefresh);
    };
  }, [fetchNotifications, fetchPendingMatchCount, fetchPendingWeddingCount]);

  // Refresh only notification-related state (used by MessagesPage to avoid visible full-page refreshes)
  useEffect(() => {
    const onNotificationsRefresh = () => {
      fetchNotifications(true);
      fetchPendingMatchCount();
      fetchPendingWeddingCount();
    };
    window.addEventListener('notifications:refresh', onNotificationsRefresh as EventListener);
    return () => {
      window.removeEventListener('notifications:refresh', onNotificationsRefresh as EventListener);
    };
  }, [fetchNotifications, fetchPendingMatchCount, fetchPendingWeddingCount]);

  useEffect(() => {
    const onActiveConversation = (event: Event) => {
      const detail = (event as CustomEvent<{ conversationId?: string | null }>).detail;
      const conversationId = detail?.conversationId || null;
      activeConversationIdRef.current = conversationId;

      if (!conversationId) return;

      setNotifications((prev) => {
        const next = prev.filter((n) => {
          const isMsg = n.type === 'message_received' && n.conversationId === conversationId;
          return !isMsg;
        });
        const removed = prev.length - next.length;
        if (removed > 0) {
          setUnreadCount((count) => Math.max(0, count - removed));
        }
        return next;
      });
    };

    window.addEventListener('chat:activeConversation', onActiveConversation as EventListener);
    return () => {
      window.removeEventListener('chat:activeConversation', onActiveConversation as EventListener);
    };
  }, [currentUserId]);

  // ── Real-time notification bell updates ──────────────────────────────────
  // Listen to match/interest socket events and immediately refresh the bell
  // so both parties see notifications without waiting for the 30s poll.
  useEffect(() => {
    if (!token) return;
    const socket = connectSocket(token);

    const onMutualMatch = (payload: any) => {
      fetchNotifications(true);
      fetchPendingMatchCount();
      fetchPendingWeddingCount();
      window.dispatchEvent(new CustomEvent('app:refresh'));
      playMatchSound();
      showEventNotifRef.current('🎉', "It's a Match!", `You and ${payload.fromUserName || 'someone'} are now connected!`, '/messages', '#f59e0b');
    };
    const onInterestReceived = (payload: any) => {
      fetchNotifications(true);
      fetchPendingMatchCount();
      fetchPendingWeddingCount();
      window.dispatchEvent(new CustomEvent('app:refresh'));
      playInterestSound();
      showEventNotifRef.current('💛', `${payload.fromUserName || 'Someone'} liked you!`, 'They expressed interest in you — check your matches.', '/matches', '#f59e0b');
    };
    const onInterestAccepted = (payload: any) => {
      fetchNotifications(true);
      fetchPendingMatchCount();
      fetchPendingWeddingCount();
      window.dispatchEvent(new CustomEvent('app:refresh'));
      playInterestSound();
      showEventNotifRef.current('🥳', `${payload.fromUserName || 'Someone'} accepted your interest!`, 'You can now message each other.', '/messages', '#16a34a');
    };
    const onInterestDeclined = (payload: any) => {
      fetchNotifications(true);
      fetchPendingMatchCount();
      fetchPendingWeddingCount();
      window.dispatchEvent(new CustomEvent('app:refresh'));
      playInterestSound();
      showEventNotifRef.current('💔', 'Interest declined', `${payload.fromUserName || 'Someone'} has declined your interest.`, '/matches', '#6b7280');
    };
    const onMatchRemoved = (payload: any) => {
      fetchNotifications(true);
      fetchPendingMatchCount();
      fetchPendingWeddingCount();
      window.dispatchEvent(new CustomEvent('app:refresh'));
      const removedBy = payload?.byUserName || 'Someone';
      showEventNotifRef.current('👋', 'Match removed', `${removedBy} removed you from their matches.`, '/matches', '#6b7280');
    };
    const onProfileUpdated = (payload: any) => {
      if (!payload?.userId) return;
      window.dispatchEvent(new CustomEvent('app:refresh'));
    };

    socket.on('interest_received', onInterestReceived);
    socket.on('mutual_match', onMutualMatch);
    socket.on('interest_accepted', onInterestAccepted);
    socket.on('interest_declined', onInterestDeclined);
    socket.on('match_removed', onMatchRemoved);
    socket.on('profile_updated', onProfileUpdated);

    // Real-time server-pushed notifications (e.g. wedding invites)
    const onNotification = (payload: AppNotification) => {
      if (payload.type === 'message_received' && shouldSuppressMessageNotif(payload.conversationId)) {
        if (payload.id) {
          notificationService.markRead(payload.id).catch(() => {});
        }
        return;
      }
      let inserted = false;
      setNotifications((prev) => {
        if (prev.some((n) => n.id === payload.id)) return prev;
        inserted = true;
        return [payload, ...prev];
      });
      if (!inserted) return;
      setUnreadCount((c) => c + 1);
      if (payload.type === 'message_received') {
        playMessageSound();
        showMsgNotif(payload.fromUserName || 'New message', payload.preview || '', payload.conversationId || undefined);
        return;
      }
      // Avoid triggering full app refreshes for simple chat messages.
      // Non-message notifications can still request a refresh for other pages.
      window.dispatchEvent(new CustomEvent('app:refresh'));
      fetchPendingWeddingCount();
      if (payload.type === 'wedding_invite') {
        playWeddingInviteSound();
        showEventNotifRef.current('💍', `${payload.fromUserName} invited you!`, 'Plan your wedding together — tap to accept.', '/wedding', '#be185d');
      } else if (payload.type === 'wedding_accepted') {
        playWeddingInviteSound();
        showEventNotifRef.current('🎉', `${payload.fromUserName} accepted your invite!`, 'Your wedding project is now shared. Time to start planning!', '/wedding', '#be185d');
        window.dispatchEvent(new CustomEvent('wedding:partnerAccepted'));
      } else if (payload.type === 'wedding_planning_unlocked') {
        playWeddingInviteSound();
        showEventNotifRef.current('🎊', 'Wedding planning unlocked!', `You and ${payload.fromUserName} can now plan your wedding together!`, '/wedding', '#be185d');
        window.dispatchEvent(new CustomEvent('planning:unlocked'));
      } else if (payload.type === 'wedding_cancelled') {
        playInterestSound();
        const cancelledBySelf = Boolean(payload?.metadata?.cancelledBySelf);
        const isDecline = Boolean(payload?.metadata?.isDecline);
        const actorName = payload?.fromUserName || 'This user';
        const verb = isDecline ? 'declined the wedding invite' : 'cancelled the wedding plan';
        showEventNotifRef.current(
          '💔',
          isDecline ? 'Wedding invite declined' : 'Wedding planning cancelled',
          cancelledBySelf
            ? `You ${verb}. To plan again, send a new invite.`
            : `${actorName} ${verb}. To plan again, send a new invite.`,
          '/wedding',
          '#6b7280'
        );
      } else if (payload.type === 'interest_accepted') {
        playInterestSound();
        showEventNotifRef.current('🥳', `${payload.fromUserName} accepted your interest!`, 'You can now message each other.', '/messages', '#16a34a');
      } else if (payload.type === 'interest_declined') {
        playInterestSound();
        showEventNotifRef.current('💔', 'Interest declined', `${payload.fromUserName} has declined your interest.`, '/matches', '#6b7280');
      } else if (payload.type === 'match_removed') {
        showEventNotifRef.current('👋', 'Match removed', `${payload.fromUserName} removed you from their matches.`, '/matches', '#6b7280');
      } else if (payload.type === 'mutual_match') {
        playMatchSound();
        showEventNotifRef.current('🎉', "It's a Match!", `You and ${payload.fromUserName} are now connected!`, '/messages', '#f59e0b');
      } else if (payload.type === 'vendor_booking_cancelled') {
        const vendorName = payload.vendorName || 'Your vendor';
        showEventNotifRef.current('❌', 'Booking Cancelled', `${vendorName} has cancelled your booking. Please contact them for more information.`, '/wedding', '#d32f2f');
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
    const onWeddingReset = (payload: any) => {
      const cancelledBySelf = Boolean(payload?.cancelledBySelf);
      const isDecline = Boolean(payload?.isDecline);
      const resetterName = payload?.resetterName || 'This user';
      const verb = isDecline ? 'declined the wedding invite' : 'cancelled the wedding plan';
      showEventNotifRef.current(
        '💔',
        isDecline ? 'Wedding invite declined' : 'Wedding project reset',
        cancelledBySelf
          ? `You ${verb}. To plan again, send a new invite.`
          : `${resetterName} ${verb}. To plan again, send a new invite.`,
        '/wedding',
        '#6b7280'
      );
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
      socket.off('profile_updated', onProfileUpdated);
      socket.off('notification', onNotification);
      socket.off('wedding_reset', onWeddingReset);
      window.removeEventListener('wedding:accepted', onWeddingAcceptedSelf);
    };
  }, [token, fetchNotifications, fetchPendingMatchCount, fetchPendingWeddingCount, shouldSuppressMessageNotif, showMsgNotif]);

  const handleMarkRead = async (id: string) => {
    await notificationService.markRead(id);
    setNotifications((prev) => prev.filter((n) => n.id !== id));
    setUnreadCount((c) => Math.max(0, c - 1));
  };

  const handleMarkAllRead = async () => {
    await notificationService.markAllRead();
    setNotifications([]);
    setUnreadCount(0);
  };

  // When user navigates to /messages, silently remove mutual_match notifications.
  // Message notifications should remain until the user opens that specific conversation.
  useEffect(() => {
    if (location.pathname !== '/messages') return;
    const toRemove = notifications.filter((n) => n.type === 'mutual_match');
    if (toRemove.length === 0) return;
    // Only call markAllRead for real DB notifications (not client-side msg ones)
    const dbOnes = toRemove.filter((n) => !n.id.startsWith('msg-'));
    if (dbOnes.length > 0) notificationService.markAllRead().catch(() => {});
    setNotifications((prev) => prev.filter((n) => n.type !== 'mutual_match'));
    setUnreadCount((c) => Math.max(0, c - toRemove.length));
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
  const horoscopeSeekerNavItems = [
    { name: 'Dashboard', path: '/horoscope', icon: Star },
    { name: 'Life AI', path: '/life-guidance', icon: MessageSquare },
  ];
  const navItems = isHoroscopeSeeker
    ? horoscopeSeekerNavItems
    : isCouple
      ? coupleNavItems
      : partnerNavItems;

  const handleLogout = () => {
    dispatch(logout());
    navigate('/');
  };

  const initials = (name: string) =>
    name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);
  useEffect(() => { showEventNotifRef.current = showEventNotif; }, [showEventNotif]);

  if (!token) return <>{children || <Outlet />}</>;

  return (
    <div className="min-h-screen bg-cream relative flex flex-col">
      {/* Fixed Background Layer to prevent flicker on route change */}
      <div className="fixed inset-0 mandala-bg opacity-[0.4] pointer-events-none z-0" />
      
      {/* Top Navigation */}
      <header className="fixed top-0 left-0 right-0 h-16 bg-white/80 backdrop-blur-md border-b border-primary/10 z-[1100] px-4 md:px-8 flex items-center justify-between">
        <div className="flex items-center gap-0">
          <button 
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="p-2 hover:bg-primary/5 rounded-lg lg:hidden"
          >
            <Menu className="w-6 h-6 text-primary" />
          </button>
          <Link to="/dashboard" className="flex items-center gap-0">
            <img 
              src="/RaashiLink_Logo.png" 
              alt="RaashiLink Logo" 
              className="w-20 h-20 object-contain drop-shadow-md -mr-6 -ml-2"
            />
            <span className="text-lg xl:text-xl font-serif font-bold text-primary hidden sm:block">RaashiLink.AI</span>
          </Link>
        </div>

        <div className="flex items-center gap-2 md:gap-4">
          <div className="hidden lg:flex items-center gap-0.5 xl:gap-1">
            {navItems.map((item) => (
              <Link 
                key={item.path}
                to={item.path}
                className={cn(
                      "px-2 xl:px-3 py-2 rounded-full text-[13px] xl:text-sm font-medium transition-colors whitespace-nowrap inline-flex items-center gap-1 xl:gap-1.5",
                  location.pathname === item.path 
                    ? "bg-primary text-white" 
                    : "text-textSecondary hover:bg-primary/5 hover:text-primary"
                )}
              >
                    <span>{item.name}</span>
                    {getNavBadgeCount(item.path) > 0 && (
                      <span className={cn(
                        "min-w-[16px] h-[16px] rounded-full text-[10px] font-bold px-1 inline-flex items-center justify-center",
                        location.pathname === item.path ? "bg-white text-primary" : "bg-red-500 text-white"
                      )}>
                        {getNavBadgeCount(item.path) > 9 ? '9+' : getNavBadgeCount(item.path)}
                      </span>
                    )}
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

          <div ref={userMenuRef} className="relative">
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
                <motion.div 
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-xl border border-primary/10 py-2 z-[1200]"
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
              className="fixed top-0 left-0 bottom-0 w-72 bg-cream mandala-bg z-[70] lg:hidden shadow-2xl flex flex-col"
            >
              <div className="p-6 flex items-center justify-between border-b border-primary/5 bg-primary/5">
                <span className="text-lg font-serif font-bold text-primary">Menu Navigation</span>
                <button 
                  onClick={() => setIsSidebarOpen(false)}
                  className="p-2 hover:bg-primary/10 rounded-full transition-colors"
                >
                  <X className="w-6 h-6 text-primary" />
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
                    <span>{item.name}</span>
                    {getNavBadgeCount(item.path) > 0 && (
                      <span className="ml-auto min-w-[18px] h-[18px] rounded-full bg-red-500 text-white text-[10px] font-bold px-1 inline-flex items-center justify-center">
                        {getNavBadgeCount(item.path) > 9 ? '9+' : getNavBadgeCount(item.path)}
                      </span>
                    )}
                  </Link>
                ))}
              </nav>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <main className="flex-1 pt-[50px] pb-12 px-4 md:px-8 w-full">
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
      {!isHoroscopeSeeker && <FloatingRaashiBot />}

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
            <span className="relative">
              <item.icon className="w-5 h-5" />
              {getNavBadgeCount(item.path) > 0 && (
                <span className="absolute -top-2 -right-2 min-w-[14px] h-[14px] rounded-full bg-red-500 text-white text-[9px] font-bold px-[2px] inline-flex items-center justify-center">
                  {getNavBadgeCount(item.path) > 9 ? '9+' : getNavBadgeCount(item.path)}
                </span>
              )}
            </span>
            <span className="text-[10px] font-medium">{item.name}</span>
          </Link>
        ))}
      </nav>
    </div>
  );
}
