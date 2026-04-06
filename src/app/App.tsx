import React, { useMemo } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Provider, useSelector } from 'react-redux';
import { CssBaseline, ThemeProvider } from '@mui/material';
import { store, RootState } from '@/app/store/store';
import MainLayout from '@/shared/components/layout/MainLayout';
import LandingPage from '@/features/marketing/pages/LandingPage';
import LoginPage from '@/features/auth/pages/LoginPage';
import RegisterPage from '@/features/auth/pages/RegisterPage';
import ForgotPasswordPage from '@/features/auth/pages/ForgotPasswordPage';
import UserDashboard from '@/features/dashboard/pages/UserDashboard';
import HoroscopeView from '@/features/horoscope/pages/HoroscopeView';
import MatchRecommendations from '@/features/matchmaking/pages/MatchRecommendations';
import WeddingDashboard from '@/features/wedding/pages/WeddingDashboard';
import AIChatbot from '@/features/chat/pages/AIChatbot';
import BudgetPlanner from '@/features/budget/pages/BudgetPlanner';
import HoneymoonDestinations from '@/features/honeymoon/pages/HoneymoonDestinations';
import DestinationDetail from '@/features/honeymoon/pages/DestinationDetailPage';
import UserProfile from '@/features/profile/pages/UserProfile';
import EditProfile from '@/features/profile/pages/EditProfile';
import VendorMarketplace from '@/features/vendors/pages/VendorMarketplace';
import VendorDetailPage from '@/features/vendors/pages/VendorDetailPage';
import AdminDashboard from '@/features/admin/pages/AdminDashboard';
import VendorPortal from '@/features/vendors/pages/VendorPortal';
import createAppTheme from '@/theme/theme';
import Toast from '@/components/Toast';
import LoadingOverlay from '@/components/LoadingOverlay';

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { token } = useSelector((state: RootState) => state.auth);
  if (!token) return <Navigate to="/login" replace />;
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
  const isAdmin = role === 'admin' || user?.role === 'admin' || user?.email === 'shanukajayarathna876@gmail.com';
  
  if (!isAdmin) {
    return <Navigate to="/dashboard" replace />;
  }
  
  return <>{children}</>;
};

function AppShell() {
  const mode = useSelector((state: RootState) => state.ui.theme);
  const theme = useMemo(() => createAppTheme(mode), [mode]);

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Router>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          
          {/* User Routes with MainLayout */}
          <Route element={<MainLayout />}>
            <Route path="/dashboard" element={<ProtectedRoute><UserDashboard /></ProtectedRoute>} />
            <Route path="/horoscope" element={<ProtectedRoute><HoroscopeView /></ProtectedRoute>} />
            <Route path="/matches" element={<ProtectedRoute><MatchRecommendations /></ProtectedRoute>} />
            <Route path="/wedding" element={<ProtectedRoute><WeddingDashboard /></ProtectedRoute>} />
            <Route path="/chat" element={<ProtectedRoute><AIChatbot /></ProtectedRoute>} />
            <Route path="/budget" element={<ProtectedRoute><BudgetPlanner /></ProtectedRoute>} />
            <Route path="/honeymoon" element={<ProtectedRoute><HoneymoonDestinations /></ProtectedRoute>} />
            <Route path="/honeymoon/:id" element={<ProtectedRoute><DestinationDetail /></ProtectedRoute>} />
            <Route path="/profile" element={<ProtectedRoute><UserProfile /></ProtectedRoute>} />
            <Route path="/edit-profile" element={<ProtectedRoute><EditProfile /></ProtectedRoute>} />
            <Route path="/vendors" element={<ProtectedRoute><VendorMarketplace /></ProtectedRoute>} />
            <Route path="/vendors/:id" element={<ProtectedRoute><VendorDetailPage /></ProtectedRoute>} />
          </Route>
          
          {/* Admin Routes */}
          <Route path="/admin" element={<AdminProtectedRoute><AdminDashboard /></AdminProtectedRoute>} />
          
          {/* Vendor Routes */}
          <Route path="/vendor/*" element={<VendorProtectedRoute><VendorPortal /></VendorProtectedRoute>} />
          
          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
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


