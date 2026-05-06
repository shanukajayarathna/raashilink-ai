import React from 'react';
import { useSelector } from 'react-redux';
import { Navigate } from 'react-router-dom';
import { RootState } from '@/app/store/store';
import UserDashboard from './UserDashboard';
import CoupleDashboard from './CoupleDashboard';

/**
 * Smart router that displays the correct dashboard based on user type
 * - Couple users see CoupleDashboard (wedding-focused)
 * - Partner users see UserDashboard (matchmaking-focused)
 */
export default function DashboardRouter() {
  const { user } = useSelector((state: RootState) => state.auth);

  if (user?.profileType === 'horoscope_seeker') {
    return <Navigate to="/horoscope" replace />;
  }

  // Determine if user is a couple based on wedding project
  const isCouple = user?.profileType === 'couple' || !!user?.weddingProject?.partnerName;

  return isCouple ? <CoupleDashboard /> : <UserDashboard />;
}
