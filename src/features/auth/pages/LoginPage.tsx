import React, { useState } from 'react';
import { 
  Box, 
  Typography, 
  TextField, 
  Button, 
  Grid, 
  Paper, 
  Divider, 
  IconButton, 
  InputAdornment,
  Alert,
  CircularProgress,
  Stack
} from '@mui/material';
import { 
  Visibility, 
  VisibilityOff, 
  Google, 
  ArrowForward,
  ArrowBack,
  LockOutlined,
  MailOutline
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'motion/react';
import { useNavigate, Link } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { setCredentials } from '@/features/auth/store/authSlice';
import { setLoading, showToast } from '@/app/store/uiSlice';
import authService from '@/features/auth/services/authService';
import MandalaBackground from '@/components/MandalaBackground';

// --- Design Constants ---
const COLORS = {
  primary: '#8B1A2E',
  secondary: '#C9A84C',
  accent: '#1A6B72',
  cream: '#FAF7F2',
  white: '#FFFFFF',
  textPrimary: '#1C1C1C',
  textSecondary: '#555555',
};

const MotionBox = motion(Box);
const MotionPaper = motion(Paper);

const stripInvisibleChars = (value: string) => value.replace(/[\u200B-\u200D\uFEFF]/g, '');
const normalizeLoginIdentifier = (value: string) => stripInvisibleChars(String(value || '')).replace(/\s+/g, '').trim();
const normalizeLoginPassword = (value: string) => stripInvisibleChars(String(value || '')).trim();

const LoginPage = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  
  // Form State
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [shake, setShake] = useState(false);
  const [isVendorUser, setIsVendorUser] = useState(false);

  // Validation
  const [errors, setErrors] = useState({ email: '', password: '' });

  const validate = () => {
    const normalizedIdentifier = normalizeLoginIdentifier(formData.email);
    const normalizedPassword = normalizeLoginPassword(formData.password);
    let tempErrors = { email: '', password: '' };
    let isValid = true;

    if (!normalizedIdentifier) {
      tempErrors.email = 'Email or Phone is required';
      isValid = false;
    } else if (!/\S+@\S+\.\S+/.test(normalizedIdentifier) && !/^\+?[0-9\s-]{9,16}$/.test(normalizedIdentifier)) {
      tempErrors.email = 'Enter a valid email or phone number';
      isValid = false;
    }

    if (!normalizedPassword) {
      tempErrors.password = 'Password is required';
      isValid = false;
    } else if (normalizedPassword.length < 8) {
      tempErrors.password = 'Password must be at least 8 characters';
      isValid = false;
    }

    setErrors(tempErrors);
    return isValid;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const normalizedCredentials = {
      email: normalizeLoginIdentifier(formData.email),
      password: normalizeLoginPassword(formData.password),
    };

    if (
      normalizedCredentials.email !== formData.email ||
      normalizedCredentials.password !== formData.password
    ) {
      setFormData(normalizedCredentials);
    }
    
    if (!validate()) {
      setShake(true);
      setTimeout(() => setShake(false), 500);
      return;
    }

    setIsLoading(true);
    dispatch(setLoading(true));
    try {
      const response = await authService.login(normalizedCredentials);
      const role = response.role || response.user?.role || (isVendorUser ? 'vendor' : 'user');

      if (role === 'vendor' && !isVendorUser) {
        const message = 'Enable Vendor account type to log in to a vendor account.';
        setError(message);
        dispatch(showToast({ type: 'error', message }));
        return;
      }

      dispatch(setCredentials(response));
      setSuccess(true);
      let targetPath = '/dashboard';
      if (role === 'admin') targetPath = '/admin';
      else if (role === 'vendor') targetPath = '/vendor';
      else if (response.user?.profileType === 'horoscope_seeker') targetPath = '/horoscope';
      
      setTimeout(() => navigate(targetPath), 600);
    } catch (err: any) {
      const status = err.response?.status;
      const isStartupDelay =
        err.code === 'ERR_NETWORK' ||
        err.code === 'ECONNABORTED' ||
        err.code === 'ECONNREFUSED' ||
        [502, 503, 504].includes(status);

      const message = isStartupDelay
        ? 'The API server is still starting. Please wait a few seconds and try again.'
        : err.response?.data?.message || 'Invalid credentials. Please try again.';
      setError(message);
      dispatch(showToast({ type: 'error', message }));
      setShake(true);
      setTimeout(() => setShake(false), 500);
    } finally {
      setIsLoading(false);
      dispatch(setLoading(false));
    }
  };

  return (
    <Box sx={{ 
      minHeight: '100vh', 
      width: '100%',
      display: 'flex', 
      bgcolor: COLORS.cream,
      overflow: 'hidden'
    }}>
      <Grid container sx={{ minHeight: '100vh', width: '100%' }}>
        {/* Left Side: Decorative */}
        <Grid size={{ xs: 12, md: 6 }} sx={{ 
          display: { xs: 'none', md: 'flex' },
          bgcolor: COLORS.primary,
          backgroundImage: 'linear-gradient(rgba(139, 26, 46, 0.85), rgba(139, 26, 46, 0.85)), url("https://bolenbliss.com/storage/blog/featured/weddings-in-sri-lanka/sri-lankan-fusion-wedding-in-california.jpg")',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          position: 'relative',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          color: 'white',
          p: 5,
          overflow: 'hidden'
        }}>
          <MandalaBackground
            size="150%"
            opacity={0.1}
            color={COLORS.secondary}
            sx={{ top: '-25%', left: '-25%' }}
          />
          
          <MotionBox
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            sx={{ zIndex: 1, textAlign: 'center', mt: -12 }}
          >
            <Box
              sx={{ 
                display: 'flex', 
                flexDirection: 'column', 
                alignItems: 'center',
                mt: -10,
                mb: -12
              }}
            >
              <Box
                component="img"
                src="/RaashiLink_Logo.png"
                alt="RaashiLink Logo"
                sx={{ 
                  width: 400, 
                  height: 400, 
                  objectFit: 'contain',
                  filter: 'brightness(0) invert(1) drop-shadow(0 12px 24px rgba(0,0,0,0.3))'
                }}
              />
            </Box>
            <Typography variant="h2" sx={{ 
              fontFamily: 'Playfair Display', 
              fontWeight: 700, 
              mb: 0,
              color: COLORS.secondary
            }}>
              RaashiLink.AI
            </Typography>
            <Typography variant="h4" sx={{ 
              fontFamily: 'Playfair Display', 
              fontStyle: 'italic',
              mb: 2,
              maxWidth: '500px'
            }}>
              "A successful marriage requires falling in love many times, always with the same person."
            </Typography>
            <Typography variant="subtitle1" sx={{ opacity: 0.8 }}>
              Find your cosmic connection today.
            </Typography>
          </MotionBox>
        </Grid>

        {/* Right Side: Form */}
        <Grid size={{ xs: 12, md: 6 }} sx={{ 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center',
          p: { xs: 2, md: 6 },
          width: '100%'
        }}>
          <AnimatePresence mode="wait">
            {!success ? (
              <MotionPaper
                key="login-form"
                initial={{ opacity: 0, x: 50 }}
                animate={{ 
                  opacity: 1, 
                  x: shake ? [-5, 5, -5, 5, 0] : 0
                }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.5 }}
                elevation={0}
                sx={{ 
                  width: '100%', 
                  maxWidth: '450px', 
                  p: 4, 
                  mx: 0.5,
                  borderRadius: '24px',
                  bgcolor: 'white',
                  boxShadow: '0 10px 40px rgba(139,26,46,0.05)',
                  border: shake ? `2px solid ${COLORS.primary}` : '2px solid transparent'
                }}
              >
                <Typography variant="h4" sx={{ 
                  fontFamily: 'Playfair Display', 
                  fontWeight: 700, 
                  mb: 1,
                  color: COLORS.primary 
                }}>
                  Welcome Back
                </Typography>
                <Typography variant="body2" sx={{ color: COLORS.textSecondary, mb: 4 }}>
                  Please enter your details to continue your journey.
                </Typography>

                {error && (
                  <Alert severity="error" sx={{ mb: 3, borderRadius: '12px' }}>
                    {error}
                  </Alert>
                )}

                <form onSubmit={handleSubmit}>
                  <Stack spacing={3}>
                    <TextField
                      fullWidth
                      label="Email or Phone Number"
                      variant="outlined"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      error={!!errors.email}
                      helperText={errors.email}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <MailOutline sx={{ color: COLORS.textSecondary }} />
                          </InputAdornment>
                        ),
                        sx: { borderRadius: '12px' }
                      }}
                    />

                    <TextField
                      fullWidth
                      label="Password"
                      type={showPassword ? 'text' : 'password'}
                      variant="outlined"
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      error={!!errors.password}
                      helperText={errors.password}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <LockOutlined sx={{ color: COLORS.textSecondary }} />
                          </InputAdornment>
                        ),
                        endAdornment: (
                          <InputAdornment position="end">
                            <IconButton onClick={() => setShowPassword(!showPassword)} edge="end">
                              {showPassword ? <VisibilityOff /> : <Visibility />}
                            </IconButton>
                          </InputAdornment>
                        ),
                        sx: { borderRadius: '12px' }
                      }}
                    />

                    <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                      <Typography 
                        component={Link} 
                        to="/forgot-password" 
                        variant="body2" 
                        sx={{ 
                          color: COLORS.accent, 
                          textDecoration: 'none',
                          fontWeight: 600,
                          '&:hover': { textDecoration: 'underline' }
                        }}
                      >
                        Forgot Password?
                      </Typography>
                    </Box>

                    <Button
                      fullWidth
                      type="submit"
                      variant="contained"
                      disabled={isLoading}
                      sx={{ 
                        bgcolor: COLORS.primary,
                        color: 'white',
                        py: 1.5,
                        borderRadius: '12px',
                        fontWeight: 700,
                        fontSize: '1rem',
                        '&:hover': { bgcolor: '#6B1424' },
                        boxShadow: '0 4px 12px rgba(139,26,46,0.2)'
                      }}
                    >
                      {isLoading ? <CircularProgress size={24} color="inherit" /> : 'Login'}
                    </Button>

                    <Divider sx={{ my: 2 }}>
                      <Typography variant="body2" sx={{ color: COLORS.textSecondary }}>or</Typography>
                    </Divider>

                    <Button
                      fullWidth
                      variant="outlined"
                      startIcon={<Google />}
                      disabled
                      sx={{ 
                        py: 1.5,
                        borderRadius: '12px',
                        borderColor: '#ddd',
                        color: COLORS.textPrimary,
                        fontWeight: 600,
                        '&:hover': { borderColor: COLORS.primary, bgcolor: 'rgba(139,26,46,0.02)' }
                      }}
                    >
                      Google Login Coming Soon
                    </Button>

                    <Box sx={{ textAlign: 'center', mt: 2 }}>
                      <Typography variant="body2" sx={{ color: COLORS.textSecondary, mb: 1, fontWeight: 600 }}>
                        Account type (optional)
                      </Typography>
                      <Button
                        size="small"
                        variant={isVendorUser ? 'contained' : 'outlined'}
                        onClick={() => setIsVendorUser((prev) => !prev)}
                        sx={{
                          borderRadius: '20px',
                          textTransform: 'none',
                          px: 2.5,
                          ...(isVendorUser
                            ? {
                                bgcolor: COLORS.primary,
                                color: 'white',
                                '&:hover': { bgcolor: '#6B1424' },
                              }
                            : {
                                borderColor: COLORS.primary,
                                color: COLORS.primary,
                                '&:hover': { borderColor: COLORS.primary, bgcolor: 'rgba(139,26,46,0.04)' },
                              }),
                        }}
                      >
                        Vendor
                      </Button>
                    </Box>

                    <Box sx={{ textAlign: 'center', mt: 2 }}>
                      <Typography variant="body2" sx={{ color: COLORS.textSecondary }}>
                        Don't have an account?{' '}
                        <Typography 
                          component={Link} 
                          to="/register"
                          state={{ from: 'login' }}
                          sx={{ 
                            color: COLORS.primary, 
                            fontWeight: 700, 
                            textDecoration: 'none',
                            '&:hover': { textDecoration: 'underline' }
                          }}
                        >
                          Register Now
                        </Typography>
                      </Typography>
                    </Box>

                    <Box
                      sx={{
                        mt: 2,
                        p: 2,
                        borderRadius: '14px',
                        border: `1px solid ${COLORS.secondary}`,
                        bgcolor: 'rgba(201,168,76,0.12)',
                        textAlign: 'center',
                      }}
                    >
                      <Typography variant="body2" sx={{ color: COLORS.textPrimary }}>
                        Want only horoscope insights?{' '}
                        <Typography
                          component={Link}
                          to="/register/horoscope-seeker"
                          state={{ from: 'login' }}
                          sx={{
                            color: COLORS.primary,
                            fontWeight: 800,
                            textDecoration: 'none',
                            '&:hover': { textDecoration: 'underline' }
                          }}
                        >
                          Register to see your horoscope and ask AI about your life
                        </Typography>
                      </Typography>
                    </Box>

                    <Box sx={{ textAlign: 'center', mt: 3 }}>
                      <Button
                        component={Link}
                        to="/"
                        variant="outlined"
                        startIcon={<ArrowBack />}
                        sx={{
                          borderRadius: '14px',
                          borderColor: '#ddd',
                          color: COLORS.textPrimary,
                          fontWeight: 700,
                          textTransform: 'none',
                          '&:hover': { bgcolor: 'rgba(139,26,46,0.04)', borderColor: COLORS.primary }
                        }}
                      >
                        Back to Home
                      </Button>
                    </Box>
                  </Stack>
                </form>
              </MotionPaper>
            ) : (
              <MotionBox
                key="success-animation"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                sx={{ textAlign: 'center' }}
              >
                <Box sx={{ 
                  width: 80, 
                  height: 80, 
                  bgcolor: '#4CAF50', 
                  borderRadius: '50%', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  mx: 'auto',
                  mb: 3,
                  boxShadow: '0 0 20px rgba(76,175,80,0.4)'
                }}>
                  <ArrowForward sx={{ color: 'white', fontSize: 40 }} />
                </Box>
                <Typography variant="h4" sx={{ fontFamily: 'Playfair Display', fontWeight: 700, mb: 1 }}>
                  Success!
                </Typography>
                <Typography variant="body1" sx={{ color: COLORS.textSecondary }}>
                  Redirecting to your dashboard...
                </Typography>
              </MotionBox>
            )}
          </AnimatePresence>
        </Grid>
      </Grid>
    </Box>
  );
};

export default LoginPage;


