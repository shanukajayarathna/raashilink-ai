import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  IconButton,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import {
  Flower2,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useSelector } from 'react-redux';
import { RootState } from '@/app/store/store';
import ChatInterface from './ChatInterface';

const COLORS = {
  primary: '#8B1A2E',
  secondary: '#C9A84C',
  accent: '#1A6B72',
  cream: '#FAF7F2',
  white: '#FFFFFF',
  textPrimary: '#1C1C1C',
  textSecondary: '#555555',
  success: '#2E7D32',
};

const SIZES = [
  { width: 380, height: 500 },
  { width: 520, height: 650 },
  { width: 700, height: 800 },
];

export default function FloatingRaashiBot() {
  const [isOpen, setIsOpen] = useState(false);
  const [sizeIndex, setSizeIndex] = useState(1);
  const containerRef = useRef<HTMLDivElement>(null);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const currentUser = useSelector((state: RootState) => state.auth.user as any);
  const isAuthenticated = useSelector((state: RootState) => state.auth.isAuthenticated);
  const userId = (currentUser?._id || currentUser?.id || 'guest') as string;
  const firstName = (currentUser?.firstName || currentUser?.personalInfo?.firstName || '').trim();


  // Starter prompts for horoscope/life guidance
  const STARTER_PROMPTS = [
    'What does my horoscope say about my life direction this year?',
    'Based on my moon sign and nakshatra, what should I focus on this month?',
    'What are my emotional strengths and blind spots according to my chart?',
    'When is a good time window for important decisions in the next 30 days?',
    'What career themes are highlighted for me right now based on transits?',
    'How can I improve my relationships and communication patterns?',
    'Suggest practical remedies or habits based on my horoscope.',
  ];

  // Enhanced welcome text for both wedding and horoscope/life guidance
  const welcomeText = "Here are some things you can try:";

  // Detect logout → close panel and clear this user's chat from sessionStorage
  const prevUserIdRef = useRef<string | null>(null);
  const prevAuthRef = useRef(isAuthenticated);
  useEffect(() => {
    if (prevAuthRef.current && !isAuthenticated) {
      // User just logged out
      setIsOpen(false);
      if (prevUserIdRef.current) {
        sessionStorage.removeItem(`raashibot_${prevUserIdRef.current}`);
        prevUserIdRef.current = null;
      }
    }
    prevAuthRef.current = isAuthenticated;
    if (isAuthenticated && userId !== 'guest') {
      prevUserIdRef.current = userId;
    }
  }, [isAuthenticated, userId]);

  // Click outside to close
  useEffect(() => {
    if (!isOpen) return;
    function handleMouseDown(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleMouseDown);
    return () => document.removeEventListener('mousedown', handleMouseDown);
  }, [isOpen]);

  const size = SIZES[sizeIndex];
  const panelWidth = isMobile ? 'calc(100vw - 48px)' : size.width;
  const panelHeight = size.height;

  return (
    <Box ref={containerRef} sx={{ position: 'fixed', bottom: 24, right: 24, zIndex: 1000 }}>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.8 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.8 }}
            style={{
              position: 'absolute',
              bottom: 80,
              right: 0,
              width: panelWidth,
              height: panelHeight,
              display: 'flex',
              flexDirection: 'column',
              boxShadow: '0 8px 32px rgba(139,26,46,0.18)',
              borderRadius: 24,
              overflow: 'hidden',
              backgroundColor: 'white',
              border: `1px solid ${COLORS.primary}20`,
              transition: 'width 0.25s ease, height 0.25s ease',
            }}
          >
            <ChatInterface
              key={userId}
              isCompact
              onClose={() => setIsOpen(false)}
              onScaleUp={sizeIndex < SIZES.length - 1 ? () => setSizeIndex((i) => i + 1) : undefined}
              onScaleDown={sizeIndex > 0 ? () => setSizeIndex((i) => i - 1) : undefined}
              firstName={firstName}
              sessionKey={userId}
              initialMessages={[]}
              starterPrompts={STARTER_PROMPTS}
              welcomeText={welcomeText}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Toggle Button */}
      <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
        <IconButton
          onClick={() => setIsOpen((v) => !v)}
          sx={{
            width: 60,
            height: 60,
            bgcolor: COLORS.primary,
            color: 'white',
            boxShadow: '0 4px 20px rgba(139,26,46,0.3)',
            '&:hover': { bgcolor: '#6B1423' },
            position: 'relative',
          }}
        >
          <Flower2 size={28} />
          {!isOpen && (
            <Box
              sx={{
                position: 'absolute',
                top: -2,
                right: -2,
                width: 18,
                height: 18,
                bgcolor: COLORS.secondary,
                borderRadius: '50%',
                border: '2px solid white',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '10px',
                fontWeight: 800,
                color: COLORS.primary,
              }}
            >
              1
            </Box>
          )}
        </IconButton>
      </motion.div>
    </Box>
  );
}

