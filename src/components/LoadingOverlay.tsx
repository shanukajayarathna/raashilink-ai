import React from 'react';
import { Backdrop, Box, Typography } from '@mui/material';
import { useSelector } from 'react-redux';
import { RootState } from '@/app/store/store';

/**
 * Global loading overlay for high-friction flows such as auth and major app fetches.
 */
export default function LoadingOverlay() {
  const globalLoading = useSelector((state: RootState) => state.ui.globalLoading);

  return (
    <Backdrop
      open={globalLoading}
      sx={{
        zIndex: (theme) => theme.zIndex.modal + 20,
        bgcolor: 'rgba(28, 28, 28, 0.58)',
        backdropFilter: 'blur(6px)',
        flexDirection: 'column',
        gap: 2.5,
      }}
    >
      <Box
        className="animate-float"
        sx={{
          width: 132,
          height: 132,
          display: 'grid',
          placeItems: 'center',
          borderRadius: '50%',
          bgcolor: 'rgba(250,247,242,0.08)',
          border: '1px solid rgba(255,255,255,0.12)',
        }}
      >
        <svg viewBox="0 0 200 200" width="100" height="100" fill="none">
          <circle
            cx="100"
            cy="100"
            r="70"
            stroke="#C9A84C"
            strokeWidth="3"
            strokeDasharray="440"
            className="animate-drawCircle"
          />
          {[...Array(8)].map((_, index) => {
            const angle = (index * Math.PI) / 4;
            const x = 100 + Math.cos(angle) * 50;
            const y = 100 + Math.sin(angle) * 50;

            return (
              <path
                key={index}
                d={`M100 100 Q ${x} ${y} ${100 + Math.cos(angle) * 78} ${100 + Math.sin(angle) * 78}`}
                stroke="#8B1A2E"
                strokeWidth="4"
                strokeLinecap="round"
              />
            );
          })}
          <circle cx="100" cy="100" r="10" fill="#1A6B72" className="animate-pulse-soft" />
        </svg>
      </Box>

      <Typography
        variant="h6"
        sx={{
          color: '#FFFFFF',
          fontFamily: '"Playfair Display", serif',
          letterSpacing: '0.02em',
        }}
      >
        Loading
        <Box component="span" sx={{ display: 'inline-flex', ml: 0.5 }}>
          <Box component="span" className="animate-pulse-soft" sx={{ animationDelay: '0s' }}>.</Box>
          <Box component="span" className="animate-pulse-soft" sx={{ animationDelay: '0.2s' }}>.</Box>
          <Box component="span" className="animate-pulse-soft" sx={{ animationDelay: '0.4s' }}>.</Box>
        </Box>
      </Typography>
    </Backdrop>
  );
}
