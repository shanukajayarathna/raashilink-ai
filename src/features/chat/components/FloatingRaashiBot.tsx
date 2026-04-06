import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  IconButton,
  Avatar,
  Typography,
  Stack,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import {
  X,
  Flower2,
  Minus,
  Maximize2,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
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

export default function FloatingRaashiBot() {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  return (
    <Box sx={{ position: 'fixed', bottom: 24, right: 24, zIndex: 1000 }}>
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
              width: isMobile ? 'calc(100vw - 48px)' : 380,
              height: isMinimized ? 60 : 500,
              display: 'flex',
              flexDirection: 'column',
              boxShadow: '0 8px 32px rgba(139,26,46,0.15)',
              borderRadius: 24,
              overflow: 'hidden',
              backgroundColor: 'white',
              border: `1px solid ${COLORS.primary}20`,
            }}
          >
            <ChatInterface 
              isCompact 
              onClose={() => setIsOpen(false)} 
              initialMessages={[
                {
                  id: 'welcome',
                  role: 'bot',
                  content: "Namaste! 🌺 I'm RaashiBot, your Sri Lankan wedding assistant. How can I help you explore RaashiLink.AI today?",
                  timestamp: new Date().toISOString(),
                }
              ]}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Toggle Button */}
      <motion.div
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
      >
        <IconButton
          onClick={() => setIsOpen(!isOpen)}
          sx={{
            width: 60,
            height: 60,
            bgcolor: COLORS.primary,
            color: 'white',
            boxShadow: '0 4px 20px rgba(139,26,46,0.3)',
            '&:hover': { bgcolor: '#6B1423' },
            position: 'relative'
          }}
        >
          {isOpen ? <X size={28} /> : <Flower2 size={28} />}
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
                color: COLORS.primary
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

