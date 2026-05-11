import React, { Suspense, lazy, useMemo, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { Provider, useSelector } from 'react-redux';
import { Box, CircularProgress, CssBaseline, ThemeProvider } from '@mui/material';
import { store, RootState } from '@/app/store/store';
const MainLayout = lazy(() => import('@/shared/components/layout/MainLayout'));
const LandingPage = lazy(() => import('@/features/marketing/pages/LandingPage'));
const LoginPage = lazy(() => import('@/features/auth/pages/LoginPage'));
const RegisterPage = lazy(() => import('@/features/auth/pages/RegisterPage'));
const ForgotPasswordPage = lazy(() => import('@/features/auth/pages/ForgotPasswordPage'));
const DashboardRouter = lazy(() => import('@/features/dashboard/pages/DashboardRouter'));
const FeaturesPage = lazy(() => import('@/features/marketing/pages/FeaturesPage'));
const HowItWorksPage = lazy(() => import('@/features/marketing/pages/HowItWorksPage'));
const AboutUsPage = lazy(() => import('@/features/marketing/pages/AboutUsPage'));
const HoroscopeView = lazy(() => import('@/features/horoscope/pages/HoroscopeView'));
const MatchRecommendations = lazy(() => import('@/features/matchmaking/pages/MatchRecommendations'));
const WeddingDashboard = lazy(() => import('@/features/wedding/pages/WeddingDashboard'));
const AIChatbot = lazy(() => import('@/features/chat/pages/AIChatbot'));
const HoroscopeLifeGuidancePage = lazy(() => import('@/features/chat/pages/HoroscopeLifeGuidancePage'));
const MessagesPage = lazy(() => import('@/features/chat/pages/MessagesPage'));
const HoneymoonDestinations = lazy(() => import('@/features/honeymoon/pages/HoneymoonDestinations'));
const DestinationDetail = lazy(() => import('@/features/honeymoon/pages/DestinationDetailPage'));
const UserProfile = lazy(() => import('@/features/profile/pages/UserProfile'));
const EditProfile = lazy(() => import('@/features/profile/pages/EditProfile'));
const VendorMarketplace = lazy(() => import('@/features/vendors/pages/VendorMarketplace'));
const VendorDetailPage = lazy(() => import('@/features/vendors/pages/VendorDetailPage'));
const AdminDashboard = lazy(() => import('@/features/admin/pages/AdminDashboard'));
const VendorPortal = lazy(() => import('@/features/vendors/pages/VendorPortal'));
import createAppTheme from '@/theme/theme';
import Toast from '@/components/Toast';
import LoadingOverlay from '@/components/LoadingOverlay';

const RouteFallback = () => (
  <Box
    sx={{
      minHeight: '40vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    }}
  >
    <CircularProgress size={32} />
  </Box>
);

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { token } = useSelector((state: RootState) => state.auth);
  if (!token) return <Navigate to="/login" replace />;
  return <>{children}</>;
};

const NonHoroscopeSeekerRoute = ({ children }: { children: React.ReactNode }) => {
  const { token, user } = useSelector((state: RootState) => state.auth);
  const location = useLocation();

  if (!token) return <Navigate to="/login" replace />;

  const isHoroscopeSeeker = user?.profileType === 'horoscope_seeker' || user?.userType === 'horoscope_seeker';
  if (isHoroscopeSeeker) {
    return <Navigate to="/horoscope" replace state={{ from: location.pathname }} />;
  }

  return <>{children}</>;
};

const VendorProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { token, role, user } = useSelector((state: RootState) => state.auth);
  
  if (!token) return <Navigate to="/login" replace />;
  
  const isVendor = role === 'vendor' || user?.role === 'vendor';
  
  if (!isVendor) {
    return <Navigate to="/dashboard" replace />;
  }
  
  return <>{children}</>;
};

const AdminProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { token, role, user } = useSelector((state: RootState) => state.auth);
  
  if (!token) return <Navigate to="/login" replace />;
  
  // Allow if role is admin OR if it's the developer's email
  const isAdmin = role === 'admin' || user?.role === 'admin' || user?.email === 'admin@gmail.com';
  
  if (!isAdmin) {
    return <Navigate to="/dashboard" replace />;
  }
  
  return <>{children}</>;
};

function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
}

function AppShell() {
  const mode = useSelector((state: RootState) => state.ui.theme);
  const theme = useMemo(() => createAppTheme(mode), [mode]);

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Router>
        <ScrollToTop />
        <Suspense fallback={<RouteFallback />}>
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/register/horoscope-seeker" element={<RegisterPage />} />
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />
            <Route path="/features" element={<FeaturesPage />} />
            <Route path="/how-it-works" element={<HowItWorksPage />} />
            <Route path="/about-us" element={<AboutUsPage />} />
            
            {/* User Routes with MainLayout */}
            <Route element={<MainLayout />}>
              <Route path="/dashboard" element={<ProtectedRoute><DashboardRouter /></ProtectedRoute>} />
              <Route path="/horoscope" element={<ProtectedRoute><HoroscopeView /></ProtectedRoute>} />
              <Route path="/life-guidance" element={<ProtectedRoute><HoroscopeLifeGuidancePage /></ProtectedRoute>} />
              <Route path="/matches" element={<NonHoroscopeSeekerRoute><MatchRecommendations /></NonHoroscopeSeekerRoute>} />
              <Route path="/wedding" element={<NonHoroscopeSeekerRoute><WeddingDashboard /></NonHoroscopeSeekerRoute>} />
              <Route path="/chat" element={<NonHoroscopeSeekerRoute><AIChatbot /></NonHoroscopeSeekerRoute>} />
              <Route path="/messages" element={<NonHoroscopeSeekerRoute><MessagesPage /></NonHoroscopeSeekerRoute>} />
              <Route path="/budget" element={<Navigate to="/wedding" replace />} />
              <Route path="/honeymoon" element={<NonHoroscopeSeekerRoute><HoneymoonDestinations /></NonHoroscopeSeekerRoute>} />
              <Route path="/honeymoon/:id" element={<NonHoroscopeSeekerRoute><DestinationDetail /></NonHoroscopeSeekerRoute>} />
              <Route path="/profile" element={<ProtectedRoute><UserProfile /></ProtectedRoute>} />
              <Route path="/profile/edit" element={<ProtectedRoute><EditProfile /></ProtectedRoute>} />
              <Route path="/edit-profile" element={<Navigate to="/profile/edit" replace />} />
              <Route path="/settings" element={<Navigate to="/profile" replace />} />
              <Route path="/vendors" element={<NonHoroscopeSeekerRoute><VendorMarketplace /></NonHoroscopeSeekerRoute>} />
              <Route path="/vendors/:id" element={<NonHoroscopeSeekerRoute><VendorDetailPage /></NonHoroscopeSeekerRoute>} />
            </Route>
            
            {/* Admin Routes */}
            <Route path="/admin" element={<AdminProtectedRoute><AdminDashboard /></AdminProtectedRoute>} />
            
            {/* Vendor Routes */}
            <Route path="/vendor/*" element={<VendorProtectedRoute><VendorPortal /></VendorProtectedRoute>} />
            
            {/* Fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
        <Toast />
        <LoadingOverlay />
      </Router>
    </ThemeProvider>
  );
}

export default function App() {
  return (
    <Provider store={store}>
      <AppShell />
    </Provider>
  );
}

