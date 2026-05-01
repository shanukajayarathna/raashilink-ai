import React from 'react';
import { Backdrop, Fade, Box, CircularProgress, Typography } from '@mui/material';

type BlockingBackdropProps = {
  open: boolean;
  message?: string;
};

export default function BlockingBackdrop({ open, message = 'Working…' }: BlockingBackdropProps) {
  return (
    <Backdrop
      open={open}
      sx={{
        zIndex: (theme) => theme.zIndex.modal + 20,
        bgcolor: 'rgba(20, 10, 10, 0.45)',
        backdropFilter: 'blur(4px)',
        flexDirection: 'column',
        gap: 2,
      }}
    >
      <Fade in={open}>
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
          <CircularProgress size={52} sx={{ color: '#C9A84C' }} thickness={3.5} />
          <Typography
            sx={{
              color: '#FAF7F2',
              fontWeight: 700,
              fontSize: '1.05rem',
              letterSpacing: '0.02em',
            }}
          >
            {message}
          </Typography>
        </Box>
      </Fade>
    </Backdrop>
  );
}

