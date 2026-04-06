import React, { useState } from 'react';
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  InputAdornment,
  Paper,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { ArrowBack, LockOutlined, MailOutline, Password, PhoneIphone } from '@mui/icons-material';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { useDispatch } from 'react-redux';
import MandalaBackground from '@/components/MandalaBackground';
import authService from '@/features/auth/services/authService';
import { showToast } from '@/app/store/uiSlice';

const COLORS = {
  primary: '#8B1A2E',
  secondary: '#C9A84C',
  accent: '#1A6B72',
  cream: '#FAF7F2',
  textSecondary: '#555555',
};

const MotionPaper = motion(Paper);

const ForgotPasswordPage = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [step, setStep] = useState<'request' | 'reset'>('request');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    identifier: '',
    otp: '',
    password: '',
    confirmPassword: '',
  });

  const isValidIdentifier = (value: string) =>
    /\S+@\S+\.\S+/.test(value) || /^\+?[0-9\s-]{9,16}$/.test(value);

  const handleRequestOtp = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);

    if (!isValidIdentifier(formData.identifier)) {
      setError('Enter a valid email address or phone number.');
      return;
    }

    setIsLoading(true);
    try {
      const response = await authService.forgotPassword(formData.identifier);
      setStep('reset');
      dispatch(
        showToast({
          type: 'success',
          message: response.devOtp
            ? `Password reset OTP sent. Development OTP: ${response.devOtp}`
            : response.message || 'Password reset OTP sent successfully.',
        })
      );
    } catch (err: any) {
      const message = err.response?.data?.message || 'Failed to send password reset OTP.';
      setError(message);
      dispatch(showToast({ type: 'error', message }));
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);

    if (formData.otp.trim().length !== 6) {
      setError('Enter the 6-digit OTP.');
      return;
    }

    if (formData.password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setIsLoading(true);
    try {
      const response = await authService.resetPassword(formData);
      dispatch(showToast({ type: 'success', message: response.message || 'Password reset successfully.' }));
      navigate('/login');
    } catch (err: any) {
      const message = err.response?.data?.message || 'Failed to reset password.';
      setError(message);
      dispatch(showToast({ type: 'error', message }));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        bgcolor: COLORS.cream,
        px: 2,
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <MandalaBackground size={420} sx={{ top: -90, right: -110 }} />
      <MandalaBackground size={320} opacity={0.035} sx={{ bottom: -80, left: -80 }} />

      <MotionPaper
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        elevation={0}
        sx={{
          width: '100%',
          maxWidth: 520,
          p: { xs: 3, sm: 4 },
          borderRadius: '28px',
          boxShadow: '0 20px 60px rgba(139,26,46,0.08)',
          position: 'relative',
          zIndex: 1,
        }}
      >
        <Button
          component={Link}
          to="/login"
          startIcon={<ArrowBack />}
          sx={{ mb: 3, color: COLORS.accent, fontWeight: 700 }}
        >
          Back to Login
        </Button>

        <Typography
          variant="h4"
          sx={{ fontFamily: 'Playfair Display', fontWeight: 700, color: COLORS.primary, mb: 1 }}
        >
          {step === 'request' ? 'Reset Your Password' : 'Set a New Password'}
        </Typography>
        <Typography variant="body2" sx={{ color: COLORS.textSecondary, mb: 4 }}>
          {step === 'request'
            ? 'Enter your registered email address or phone number to receive a reset OTP.'
            : 'Enter the OTP you received, then choose a new password.'}
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 3, borderRadius: '12px' }}>
            {error}
          </Alert>
        )}

        <form onSubmit={step === 'request' ? handleRequestOtp : handleResetPassword}>
          <Stack spacing={3}>
            <TextField
              fullWidth
              label="Email or Phone Number"
              value={formData.identifier}
              disabled={step === 'reset'}
              onChange={(event) => setFormData((prev) => ({ ...prev, identifier: event.target.value }))}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    {formData.identifier.includes('@') ? <MailOutline /> : <PhoneIphone />}
                  </InputAdornment>
                ),
                sx: { borderRadius: '12px' },
              }}
            />

            {step === 'reset' && (
              <>
                <TextField
                  fullWidth
                  label="OTP"
                  value={formData.otp}
                  onChange={(event) =>
                    setFormData((prev) => ({ ...prev, otp: event.target.value.replace(/\D/g, '').slice(0, 6) }))
                  }
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Password />
                      </InputAdornment>
                    ),
                    sx: { borderRadius: '12px' },
                  }}
                />
                <TextField
                  fullWidth
                  label="New Password"
                  type="password"
                  value={formData.password}
                  onChange={(event) => setFormData((prev) => ({ ...prev, password: event.target.value }))}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <LockOutlined />
                      </InputAdornment>
                    ),
                    sx: { borderRadius: '12px' },
                  }}
                />
                <TextField
                  fullWidth
                  label="Confirm New Password"
                  type="password"
                  value={formData.confirmPassword}
                  onChange={(event) =>
                    setFormData((prev) => ({ ...prev, confirmPassword: event.target.value }))
                  }
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <LockOutlined />
                      </InputAdornment>
                    ),
                    sx: { borderRadius: '12px' },
                  }}
                />
              </>
            )}

            <Button
              type="submit"
              variant="contained"
              disabled={isLoading}
              sx={{
                bgcolor: COLORS.primary,
                color: 'white',
                py: 1.5,
                borderRadius: '12px',
                fontWeight: 700,
                '&:hover': { bgcolor: '#6B1424' },
              }}
            >
              {isLoading ? (
                <CircularProgress size={24} color="inherit" />
              ) : step === 'request' ? (
                'Send Reset OTP'
              ) : (
                'Update Password'
              )}
            </Button>

            {step === 'reset' && (
              <Button
                type="button"
                variant="text"
                onClick={() => setStep('request')}
                sx={{ color: COLORS.accent, fontWeight: 700 }}
              >
                Use a different email or phone
              </Button>
            )}
          </Stack>
        </form>
      </MotionPaper>
    </Box>
  );
};

export default ForgotPasswordPage;
