import React, { useState } from 'react';
import { Link, useNavigate, useLocation, Outlet } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { useMediaQuery, useTheme } from '@mui/material';
import { RootState } from '@/app/store/store';
import { logout } from '@/features/auth/store/authSlice';
import { 
  Menu, X, Bell, User, LogOut, Settings, 
  Heart, Calendar, Calculator, MessageSquare, 
  LayoutDashboard, Star, MapPin, Search
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '@/shared/lib/utils';
import FloatingRaashiBot from '@/features/chat/components/FloatingRaashiBot';

export default function MainLayout({ children }: { children?: React.ReactNode }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();
  const { user, token } = useSelector((state: RootState) => state.auth);
  const theme = useTheme();
  const isLargeScreen = useMediaQuery(theme.breakpoints.up('lg'));
  const isCouple = user?.profileType === 'couple';

  const partnerNavItems = [
    { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { name: 'Matches', path: '/matches', icon: Heart },
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

  if (!token) return <>{children || <Outlet />}</>;

  return (
    <div className="min-h-screen bg-cream relative">
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

          <button className="p-2 hover:bg-primary/5 rounded-full relative">
            <Bell className="w-6 h-6 text-textSecondary" />
            <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
          </button>

          <div className="relative">
            <button 
              onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
              className="flex items-center gap-2 p-1 hover:bg-primary/5 rounded-full transition-colors"
            >
              <div className="w-9 h-9 bg-secondary/20 rounded-full flex items-center justify-center border border-secondary/30">
                <User className="w-5 h-5 text-primary" />
              </div>
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
                    <Link to="/profile" className="flex items-center gap-3 px-4 py-2 text-sm text-textSecondary hover:bg-primary/5 hover:text-primary transition-colors">
                      <User className="w-4 h-4" /> Profile
                    </Link>
                    <Link to="/settings" className="flex items-center gap-3 px-4 py-2 text-sm text-textSecondary hover:bg-primary/5 hover:text-primary transition-colors">
                      <Settings className="w-4 h-4" /> Settings
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
      <main className="pt-24 pb-12 px-4 md:px-8 max-w-7xl mx-auto">
        {children || <Outlet />}
      </main>

      {/* Floating RaashiBot */}
      <FloatingRaashiBot />

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


