import React, { useEffect } from 'react';
import { Alert, AlertTitle, Box, IconButton, Paper, Snackbar, Stack, Typography } from '@mui/material';
import CheckCircleRoundedIcon from '@mui/icons-material/CheckCircleRounded';
import ErrorRoundedIcon from '@mui/icons-material/ErrorRounded';
import InfoRoundedIcon from '@mui/icons-material/InfoRounded';
import WarningAmberRoundedIcon from '@mui/icons-material/WarningAmberRounded';
import CloseRoundedIcon from '@mui/icons-material/CloseRounded';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '@/app/store/store';
import { dismissNotification } from '@/app/store/uiSlice';

const iconMap = {
  success: <CheckCircleRoundedIcon />,
  error: <ErrorRoundedIcon />,
  warning: <WarningAmberRoundedIcon />,
  info: <InfoRoundedIcon />,
};

const accentMap = {
  success: '#2E7D32',
  error: '#C62828',
  warning: '#C9A84C',
  info: '#1A6B72',
};

/**
 * Global stacked toast notifications driven by Redux UI state.
 */
export default function Toast() {
  const dispatch = useDispatch();
  const notifications = useSelector((state: RootState) => state.ui.notifications);

  useEffect(() => {
    const timers = notifications.map((notification) =>
      window.setTimeout(() => {
        dispatch(dismissNotification(notification.id));
      }, 4000)
    );

    return () => {
      timers.forEach((timer) => window.clearTimeout(timer));
    };
  }, [dispatch, notifications]);

  return (
    <Box
      sx={{
        position: 'fixed',
        right: 16,
        bottom: 16,
        zIndex: 1600,
        maxWidth: { xs: 'calc(100vw - 32px)', sm: 420 },
        width: '100%',
      }}
    >
      <Stack spacing={1.5}>
        {notifications.map((notification) => (
          <Snackbar
            key={notification.id}
            open
            anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
            sx={{ position: 'static', transform: 'none' }}
          >
            <Paper
              className="animate-slideInRight"
              elevation={0}
              sx={{
                width: '100%',
                overflow: 'hidden',
                borderRadius: 3,
                border: `1px solid ${accentMap[notification.type]}20`,
                boxShadow: '0 12px 30px rgba(28, 28, 28, 0.14)',
              }}
            >
              <Alert
                severity={notification.type}
                variant="filled"
                icon={iconMap[notification.type]}
                action={
                  <IconButton
                    size="small"
                    aria-label="Dismiss notification"
                    onClick={() => dispatch(dismissNotification(notification.id))}
                    sx={{ color: 'inherit' }}
                  >
                    <CloseRoundedIcon fontSize="small" />
                  </IconButton>
                }
                sx={{
                  alignItems: 'flex-start',
                  bgcolor: accentMap[notification.type],
                  color: notification.type === 'warning' ? '#1C1C1C' : '#FFFFFF',
                  '& .MuiAlert-icon': {
                    color: 'inherit',
                    mt: 0.25,
                  },
                }}
              >
                <AlertTitle sx={{ mb: 0.25, fontWeight: 700, fontFamily: '"Inter", sans-serif' }}>
                  {notification.type.charAt(0).toUpperCase() + notification.type.slice(1)}
                </AlertTitle>
                <Typography variant="body2" sx={{ color: 'inherit' }}>
                  {notification.message}
                </Typography>
              </Alert>
            </Paper>
          </Snackbar>
        ))}
      </Stack>
    </Box>
  );
}
