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
import { playInterestSound, playMatchSound, playMessageSound } from '@/features/notifications/utils/sounds';;
import api from '@/shared/config/axiosConfig';
import { consumeSentPreview } from '@/shared/lib/sentMsgTracker';

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

  const handleMarkRead = async (id: string) => {
    const notif = notifications.find((n) => n.id === id);
    if (notif?.type === 'message_received') {
      clientMsgCountRef.current = Math.max(0, clientMsgCountRef.current - 1);
    } else {
      await notificationService.markRead(id);
    }
    setNotifications((prev) => prev.filter((n) => n.id !== id));
    setUnreadCount((c) => Math.max(0, c - 1));
  };

  const handleMarkAllRead = async () => {
    await notificationService.markAllRead();
    setNotifications([]);
    setUnreadCount(0);
  };

  // When user navigates to /messages, silently remove all mutual_match + message_received notifications
  useEffect(() => {
    if (location.pathname !== '/messages') return;
    const toRemove = notifications.filter((n) => n.type === 'mutual_match' || n.type === 'message_received');
    if (toRemove.length === 0) return;
    // Only call markAllRead for real DB notifications (not client-side msg ones)
    const dbOnes = toRemove.filter((n) => !n.id.startsWith('msg-'));
    if (dbOnes.length > 0) notificationService.markAllRead().catch(() => {});
    clientMsgCountRef.current = 0;
    setNotifications((prev) => prev.filter((n) => n.type !== 'mutual_match' && n.type !== 'message_received'));
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
    { name: 'Budget', path: '/budget', icon: Calculator },
    { name: 'Honeymoon', path: '/honeymoon', icon: MapPin },
    { name: 'RaashiBot', path: '/chat', icon: MessageSquare },
  ];
  const coupleNavItems = [
    { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { name: 'Horoscope', path: '/horoscope', icon: Star },
    { name: 'Wedding', path: '/wedding', icon: Calendar },
    { name: 'Vendors', path: '/vendors', icon: Search },
    { name: 'Budget', path: '/budget', icon: Calculator },
    { name: 'Honeymoon', path: '/honeymoon', icon: MapPin },
    { name: 'RaashiBot', path: '/chat', icon: MessageSquare },
  ];
  const navItems = isCouple ? coupleNavItems : partnerNavItems;

  const handleLogout = () => {
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

  // Poll conversations globally so message notifications fire on every page
  useEffect(() => {
    if (!token) return;
    const poll = async () => {
      try {
        const res: any = await api.get('/chat/conversations');
        const fresh: Array<{ id: string; title: string; otherUserId: string | null; preview: string; lastSenderId: string | null }> = res.data?.data?.items || [];
        if (!convSeeded.current) {
          const map: Record<string, string> = {};
          const pendingMsgNotifs: AppNotification[] = [];
          fresh.forEach((c) => {
            map[c.id] = c.preview;
            // If the last sender is someone else, this is an unread message
            if (c.lastSenderId && c.lastSenderId !== currentUserId) {
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
            className="p-2 hover:bg-primary/5 rounded-lg md:hidden"
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
          <div className="hidden md:flex items-center gap-1">
            {navItems.slice(0, isLargeScreen ? 7 : 4).map((item) => (
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
              className="fixed inset-0 bg-black/20 backdrop-blur-sm z-[60] md:hidden"
            />
            <motion.aside 
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              className="fixed top-0 left-0 bottom-0 w-72 bg-white z-[70] md:hidden shadow-2xl flex flex-col"
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


