import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Container, 
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
  Stack,
  Stepper,
  Step,
  StepLabel,
  Card,
  CardContent,
  Slider,
  Tooltip,
  Autocomplete,
  Checkbox,
  FormControlLabel,
  LinearProgress,
  useTheme,
  useMediaQuery,
  Avatar,
  Badge,
  MenuItem,
  Select,
  FormControl,
  InputLabel
} from '@mui/material';
import { 
  Visibility, 
  VisibilityOff, 
  ArrowForward,
  ArrowBack,
  InfoOutlined,
  LocationOn,
  CheckCircle,
  HighlightOff,
  AccountCircle,
  Favorite,
  Storefront,
  AccessTime,
  CalendarMonth,
  LockOutlined,
  MailOutline,
  PhoneIphone,
  PhotoCamera,
  CloudUpload,
  AutoAwesome
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'motion/react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { setLoading, showToast } from '@/app/store/uiSlice';
import authService from '@/features/auth/services/authService';
import MandalaBackground from '@/components/MandalaBackground';
import RegistrationImageCropper from '@/features/auth/components/RegistrationImageCropper';

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

const SRI_LANKA_MOBILE_REGEX = /^7\d{8}$/;
const MAX_IMAGE_SIZE_BYTES = (6 * 1024 * 1024) - 1;
const BIRTH_CHART_MESSAGES = [
  'Finding your birth place…',
  'Calculating your chart…',
  'Almost ready…',
];
const SRI_LANKAN_RELIGIONS = ['Buddhist', 'Hindu', 'Muslim', 'Christian', 'Catholic', 'Other'];
const SRI_LANKAN_ETHNICITIES = [
  'Sinhalese',
  'Sri Lankan Tamil',
  'Indian Tamil',
  'Sri Lankan Moor',
  'Burgher',
  'Malay',
  'Vedda',
  'Other',
];

function normalizeSriLankanPhoneInput(value: string) {
  const digits = value.replace(/\D/g, '');
  if (!digits) return '';

  if (digits.startsWith('94')) {
    return digits.slice(2, 11);
  }

  if (digits.startsWith('0')) {
    return digits.slice(1, 10);
  }

  return digits.slice(0, 9);
}

function isValidSriLankanPhoneInput(value: string) {
  return SRI_LANKA_MOBILE_REGEX.test(normalizeSriLankanPhoneInput(value));
}

function normalizeLocationText(value: string) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

const MotionBox = motion(Box);
const MotionCard = motion(Card);

const RegisterPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const cameFromLogin = location.state?.from === 'login';
  const isHoroscopeOnlyPath = location.pathname === '/register/horoscope-seeker';
  const backTarget = cameFromLogin ? '/login' : '/';
  const backLabel = cameFromLogin ? 'Back to Login' : 'Back to Home';
  
  const [activeStep, setActiveStep] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [otpSending, setOtpSending] = useState(false);
  const [otpRequested, setOtpRequested] = useState(false);
  const [errorDetails, setErrorDetails] = useState<string[]>([]);
  const [fieldErrors, setFieldErrors] = useState<{[key: string]: string}>({});

  const [formData, setFormData] = useState({
    // Step 1
    role: isHoroscopeOnlyPath ? 'horoscope_seeker' : '',
    // Step 2
    firstName: '',
    lastName: '',
    gender: '',
    seekingGender: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    profilePic: null as string | null,
    // Role Specific
    partnerName: '',
    weddingDate: '',
    budget: '',
    businessName: '',
    businessCategory: '',
    portfolioUrl: '',
    businessRegistrationNumber: '',
    socialLinks: {
      facebook: '',
      instagram: '',
      linkedin: '',
      twitter: '',
      website: '',
    },
    documents: [] as Array<{ type: string; url: string; fileName: string }>,
    // Step 3 (Partner only)
    dob: '',
    tob: '',
    pob: '',
    unknownTime: false,
    // Step 4 (Partner only)
    personality: [3, 3, 3, 3, 3, 3, 3, 3, 3, 3],
    // Final Step
    visibility: 'Everyone',
    religion: '',
    ethnicity: '',
    locationRadius: 50,
    terms: false,
    otp: ['', '', '', '', '', '']
  });

  // Handle role selection from URL query params
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const roleParam = params.get('role');
    if (roleParam && ['partner', 'couple', 'vendor', 'horoscope_seeker'].includes(roleParam)) {
      setFormData(prev => ({ ...prev, role: roleParam }));
    }
  }, [location.search]);

  useEffect(() => {
    if (isHoroscopeOnlyPath) {
      setFormData((prev) => ({ ...prev, role: 'horoscope_seeker' }));
    }
  }, [isHoroscopeOnlyPath]);

  const [showPassword, setShowPassword] = useState(false);
  const [selectedProfileImageFile, setSelectedProfileImageFile] = useState<File | null>(null);
  const [vendorDocumentFiles, setVendorDocumentFiles] = useState<File[]>([]);
  const [profileImageCropOpen, setProfileImageCropOpen] = useState(false);
  const [chartMessageIndex, setChartMessageIndex] = useState(0);
  const [passwordStrength, setPasswordStrength] = useState(0);
  const [availability, setAvailability] = useState({
    emailAvailable: null as boolean | null,
    phoneAvailable: null as boolean | null,
    checking: false,
  });
  const [birthPlaceSuggestions, setBirthPlaceSuggestions] = useState<string[]>([]);
  const [loadingBirthPlaceSuggestions, setLoadingBirthPlaceSuggestions] = useState(false);

  // Debounced availability check
  useEffect(() => {
    const checkAvail = async () => {
      if (!formData.email && !formData.phone) {
        setAvailability({ emailAvailable: null, phoneAvailable: null, checking: false });
        return;
      }

      setAvailability((prev) => ({ ...prev, checking: true }));
      try {
        const response = await authService.checkAvailability(
          formData.email || undefined,
          formData.phone || undefined
        );
        setAvailability({
          emailAvailable: response?.emailAvailable ?? null,
          phoneAvailable: response?.phoneAvailable ?? null,
          checking: false,
        });
      } catch (error) {
        console.error('Error checking availability:', error);
        setAvailability((prev) => ({ ...prev, checking: false }));
      }
    };

    const timer = setTimeout(checkAvail, 500); // Debounce 500ms
    return () => clearTimeout(timer);
  }, [formData.email, formData.phone]);

  useEffect(() => {
    const query = String(formData.pob || '').trim();
    const normalizedQuery = normalizeLocationText(query);

    if (!query) {
      setBirthPlaceSuggestions([]);
      setLoadingBirthPlaceSuggestions(false);
      return;
    }

    const timer = window.setTimeout(async () => {
      setLoadingBirthPlaceSuggestions(true);
      try {
        const suggestions: string[] = await authService.searchBirthPlaces(query, 5);
        const remotePrefixMatches = suggestions
          .filter((place) => normalizeLocationText(place).startsWith(normalizedQuery))
          .slice(0, 5);

        setBirthPlaceSuggestions(
          remotePrefixMatches.length > 0
            ? remotePrefixMatches
            : []
        );
      } catch (lookupError) {
        console.error('Birth place suggestion lookup failed:', lookupError);
        setBirthPlaceSuggestions([]);
      } finally {
        setLoadingBirthPlaceSuggestions(false);
      }
    }, 300);

    return () => window.clearTimeout(timer);
  }, [formData.pob]);

  const getSteps = () => {
    const baseSteps = ['Account Type', 'Basic Info'];
    if (formData.role === 'partner') {
      return [...baseSteps, 'Birth Details', 'Personality', 'Finalize'];
    } else if (formData.role === 'horoscope_seeker') {
      return [...baseSteps, 'Birth Details'];
    } else if (formData.role === 'couple') {
      return [...baseSteps, 'Wedding Details', 'Finalize'];
    } else if (formData.role === 'vendor') {
      return [...baseSteps, 'Business Details', 'Finalize'];
    }
    return [...baseSteps, 'Details', 'Finalize'];
  };

  const steps = getSteps();
  const birthPreviewStarted = Boolean(formData.dob || formData.tob || formData.pob || formData.unknownTime);
  const birthPreviewActive = Boolean(formData.dob && formData.pob && (formData.tob || formData.unknownTime));
  const normalizedPhoneInput = normalizeSriLankanPhoneInput(formData.phone);
  const phoneHasInput = normalizedPhoneInput.length > 0;
  const phoneIsValid = isValidSriLankanPhoneInput(formData.phone);
  const phoneHelperText = availability.phoneAvailable === false
    ? 'Already registered'
    : availability.phoneAvailable === true && phoneIsValid
      ? 'Valid Sri Lankan mobile number'
      : phoneHasInput && !phoneIsValid
        ? 'Enter 9 mobile digits after +94, or type 0771234567'
        : 'Sri Lankan mobile only';

  const handleProfilePicChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size >= MAX_IMAGE_SIZE_BYTES) {
        setError('Profile picture must be under 6 MB.');
        return;
      }

      if (!file.type.startsWith('image/')) {
        setError('Please select a valid image file.');
        return;
      }

      setSelectedProfileImageFile(file);
      setProfileImageCropOpen(true);
      setError(null);
    }
  };

  const handleProfilePicCropComplete = (croppedImage: string) => {
    setFormData((prev) => ({ ...prev, profilePic: croppedImage }));
    setSelectedProfileImageFile(null);
    setProfileImageCropOpen(false);
    setError(null);
  };

  const handleProfilePicCropClose = () => {
    setSelectedProfileImageFile(null);
    setProfileImageCropOpen(false);
  };

  const [passwordMatch, setPasswordMatch] = useState(false);

  useEffect(() => {
    if (!birthPreviewActive) {
      setChartMessageIndex(0);
      return;
    }

    const interval = window.setInterval(() => {
      setChartMessageIndex((prev) => (prev + 1) % BIRTH_CHART_MESSAGES.length);
    }, 1500);

    return () => window.clearInterval(interval);
  }, [birthPreviewActive]);

  // Password strength calculation
  useEffect(() => {
    let strength = 0;
    if (formData.password.length >= 8) strength += 25;
    if (/[A-Z]/.test(formData.password)) strength += 25;
    if (/[0-9]/.test(formData.password)) strength += 25;
    if (/[^A-Za-z0-9]/.test(formData.password)) strength += 25;
    setPasswordStrength(strength);
  }, [formData.password]);

  // Password match check
  useEffect(() => {
    setPasswordMatch(formData.password === formData.confirmPassword && formData.confirmPassword.length > 0);
  }, [formData.password, formData.confirmPassword]);

  const handleNext = () => {
    const validationError = validateCurrentStep();
    if (validationError) {
      setError(validationError);
      setErrorDetails([]);
      return;
    }

    setError(null);
    setErrorDetails([]);
    setFieldErrors({});
    if (activeStep < steps.length - 1) {
      setActiveStep((prev) => prev + 1);
      window.scrollTo(0, 0);
    } else {
      handleSubmit();
    }
  };

  const handleBack = () => {
    setActiveStep((prev) => prev - 1);
    window.scrollTo(0, 0);
  };

  const validateCurrentStep = () => {
    const currentStepLabel = steps[activeStep];
    const newFieldErrors: {[key: string]: string} = {};

    if (currentStepLabel === 'Basic Info') {
      if (!formData.firstName || !formData.lastName || !formData.email || !formData.phone) {
        if (!formData.firstName) newFieldErrors.firstName = 'Required';
        if (!formData.lastName) newFieldErrors.lastName = 'Required';
        if (!formData.email) newFieldErrors.email = 'Required';
        if (!formData.phone) newFieldErrors.phone = 'Required';
        return 'First name, last name, email, and phone number are required.';
      }
      if (!/\S+@\S+\.\S+/.test(formData.email)) {
        newFieldErrors.email = 'Invalid email format';
        return 'Please enter a valid email address.';
      }
      if (!phoneIsValid) {
        newFieldErrors.phone = 'Invalid Sri Lankan mobile number';
        return 'Please enter a valid Sri Lankan mobile number.';
      }
      // Check availability
      if (availability.emailAvailable === false) {
        newFieldErrors.email = 'Already registered';
        return 'This email is already registered. Please use a different email.';
      }
      if (availability.phoneAvailable === false) {
        newFieldErrors.phone = 'Already registered';
        return 'This phone number is already registered. Please use a different number.';
      }
      if (!formData.password || formData.password.length < 8) {
        newFieldErrors.password = 'Must be at least 8 characters';
        return 'Password must be at least 8 characters.';
      }
      if (formData.role === 'partner' && !formData.gender) {
        newFieldErrors.gender = 'Required for matchmaking';
        return 'Please select your gender.';
      }
      if (formData.password !== formData.confirmPassword) {
        newFieldErrors.confirmPassword = 'Passwords do not match';
        return 'Passwords do not match.';
      }
    }

    if (currentStepLabel === 'Birth Details') {
      if (!formData.dob) {
        newFieldErrors.dob = 'Required';
        return 'Date of birth is required.';
      }
      if (!formData.pob) {
        newFieldErrors.pob = 'Required';
        return 'Place of birth is required.';
      }
      if (!formData.unknownTime && !formData.tob) {
        newFieldErrors.tob = 'Required unless unknown';
        return 'Time of birth is required unless marked unknown.';
      }
    }

    if (currentStepLabel === 'Wedding Details') {
      if (!formData.partnerName) {
        newFieldErrors.partnerName = 'Required';
        return 'Partner name is required.';
      }
      if (!formData.weddingDate) {
        newFieldErrors.weddingDate = 'Required';
        return 'Wedding date is required.';
      }
    }

    if (currentStepLabel === 'Business Details') {
      if (!formData.businessName) {
        newFieldErrors.businessName = 'Required';
        return 'Business name is required.';
      }
      if (!formData.businessCategory) {
        newFieldErrors.businessCategory = 'Required';
        return 'Business category is required.';
      }
      if (!formData.businessRegistrationNumber?.trim()) {
        newFieldErrors.businessRegistrationNumber = 'Required';
        return 'Business registration number is required.';
      }
      if (vendorDocumentFiles.length === 0) {
        return 'Please upload at least one business document.';
      }
    }

    if (currentStepLabel === 'Finalize') {
      if (!formData.terms) {
        return 'You must accept the terms to continue.';
      }
      const otpValue = formData.otp.join('');
      if (otpValue.length > 0 && otpValue.length !== 6) {
        return 'If you enter OTP now, it must be a full 6-digit code.';
      }
    }

    setFieldErrors(newFieldErrors);
    return Object.keys(newFieldErrors).length > 0 ? 'Please correct the highlighted fields.' : null;
  };

  const handleSendOtp = async () => {
    const basicValidation = ['firstName', 'lastName', 'email', 'phone', 'password'].every(
      (field) => Boolean((formData as any)[field])
    );

    if (!basicValidation) {
      setError('Complete your basic information before requesting OTP.');
      setErrorDetails([]);
      return;
    }

    setOtpSending(true);
    setError(null);
    setErrorDetails([]);
    try {
      const response = await authService.requestRegistrationOtp({
        email: formData.email,
        phone: `+94${normalizedPhoneInput}`,
      });
      setOtpRequested(true);
      dispatch(showToast({
        type: 'success',
        message:
          response.devOtp
            ? `OTP sent. Development OTP: ${response.devOtp}`
            : 'OTP sent successfully.',
      }));
    } catch (err: any) {
      const message = err.response?.data?.message || 'Failed to send OTP.';
      setError(message);
      setErrorDetails(Array.isArray(err.response?.data?.details) ? err.response.data.details : []);
      dispatch(showToast({ type: 'error', message }));
    } finally {
      setOtpSending(false);
    }
  };

  const handleSubmit = async () => {
    setIsLoading(true);
    setError(null);
    setErrorDetails([]);
    dispatch(setLoading(true));
    try {
      // Clean up form data before sending to backend
      const cleanedData: Record<string, unknown> = {
        role: formData.role,
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        gender: formData.gender || undefined,
        seekingGender: formData.seekingGender || undefined,
        email: formData.email.toLowerCase().trim(),
        phone: `+94${normalizedPhoneInput}`,
        password: formData.password,
        confirmPassword: formData.confirmPassword,
        terms: formData.terms,
        visibility: formData.visibility,
        religion: formData.religion.trim(),
        ethnicity: formData.ethnicity.trim(),
        locationRadius: formData.locationRadius,
        otp: formData.otp,
        ...(formData.profilePic && { profilePic: formData.profilePic }),
      };

      // Add role-specific fields
      if (formData.role === 'partner' || formData.role === 'horoscope_seeker') {
        cleanedData.dob = formData.dob;
        cleanedData.tob = formData.unknownTime ? '12:00' : formData.tob;
        cleanedData.pob = formData.pob;
        cleanedData.unknownTime = formData.unknownTime;
        if (formData.role === 'partner') {
          cleanedData.personality = formData.personality;
        }
      } else if (formData.role === 'couple') {
        cleanedData.partnerName = formData.partnerName.trim();
        cleanedData.weddingDate = formData.weddingDate;
        cleanedData.budget = formData.budget;
      } else if (formData.role === 'vendor') {
        cleanedData.businessName = formData.businessName.trim();
        cleanedData.businessCategory = formData.businessCategory;
        cleanedData.portfolioUrl = formData.portfolioUrl.trim();
        cleanedData.businessRegistrationNumber = formData.businessRegistrationNumber.trim();
        cleanedData.socialLinks = formData.socialLinks;
      }

      const registerPayload = (() => {
        if (formData.role !== 'vendor') {
          return cleanedData;
        }

        const multipartData = new FormData();
        Object.entries(cleanedData).forEach(([key, value]) => {
          if (value === undefined || value === null) return;

          if (Array.isArray(value) || typeof value === 'object') {
            multipartData.append(key, JSON.stringify(value));
            return;
          }

          multipartData.append(key, String(value));
        });

        multipartData.append(
          'documentsMeta',
          JSON.stringify(formData.documents.map((doc) => ({ type: doc.type, fileName: doc.fileName })))
        );
        vendorDocumentFiles.forEach((file) => multipartData.append('vendorDocuments', file));

        return multipartData;
      })();

      await authService.register(registerPayload);
      setSuccess(true);
      dispatch(showToast({ type: 'success', message: 'Registration completed. Please log in with your credentials.' }));
      setTimeout(() => navigate('/login'), 1000);
    } catch (err: any) {
      const details = Array.isArray(err.response?.data?.details) ? err.response.data.details : [];
      const message =
        err.response?.data?.message ||
        (err.code === 'ERR_NETWORK'
          ? 'Could not reach the server. Check that the backend is running and try again.'
          : 'Registration failed. Please check the highlighted details.');
      setError(message);
      setErrorDetails(details);
      dispatch(showToast({ type: 'error', message }));
    } finally {
      setIsLoading(false);
      dispatch(setLoading(false));
    }
  };

  const renderAccountType = () => (
    <MotionBox
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5 }}
    >
      <Typography variant="h5" sx={{ fontFamily: 'Playfair Display', fontWeight: 700, mb: 4, textAlign: 'center' }}>
        Choose Your Journey
      </Typography>
      <Grid container spacing={3}>
        {[
          { id: 'partner', title: 'Looking for a Partner', icon: <Favorite />, benefits: ['AI Matchmaking', 'Horoscope Check', 'Personality Matching'] },
          { id: 'couple', title: 'Engaged Couple', icon: <AccountCircle />, benefits: ['Wedding Planning', 'Budget Management', 'Vendor Search'] },
          { id: 'vendor', title: 'Wedding Vendor', icon: <Storefront />, benefits: ['Reach Clients', 'Portfolio Showcase', 'Booking Management'] },
          {
            id: 'horoscope_seeker',
            title: 'Horoscope Seeker',
            icon: <AutoAwesome />,
            benefits: ['Personal Horoscope', 'AI Life Guidance', 'Download Insights']
          }
        ].map((role) => (
          <Grid size={{ xs: 12, md: 6, lg: 3 }} key={role.id}>
            <MotionCard
              whileHover={{ y: -10 }}
              onClick={() => setFormData({ ...formData, role: role.id })}
              sx={{ 
                cursor: 'pointer',
                height: '100%',
                borderRadius: '24px',
                border: formData.role === role.id 
                  ? `3px solid ${COLORS.secondary}` 
                  : `1px solid #E0E0E0`,
                boxShadow: formData.role === role.id 
                  ? `0 12px 30px rgba(201,168,76,0.25)` 
                  : '0 4px 12px rgba(0,0,0,0.03)',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                bgcolor: formData.role === role.id ? 'rgba(201,168,76,0.08)' : 'white',
                '&:hover': {
                  borderColor: formData.role === role.id ? COLORS.secondary : COLORS.primary,
                  boxShadow: '0 12px 24px rgba(139,26,46,0.08)'
                }
              }}
            >
              <CardContent sx={{ textAlign: 'center', p: 4 }}>
                <Box sx={{ 
                  width: 60, 
                  height: 60, 
                  bgcolor: formData.role === role.id ? COLORS.secondary : COLORS.cream, 
                  borderRadius: '50%', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  mx: 'auto',
                  mb: 3,
                  color: formData.role === role.id ? 'white' : COLORS.primary
                }}>
                  {role.icon}
                </Box>
                <Typography variant="h6" sx={{ fontWeight: 800, mb: 2 }}>{role.title}</Typography>
                <Stack spacing={1} sx={{ textAlign: 'left' }}>
                  {role.benefits.map((b, i) => (
                    <Box key={i} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <CheckCircle sx={{ fontSize: 16, color: COLORS.accent }} />
                      <Typography variant="caption" sx={{ color: COLORS.textSecondary }}>{b}</Typography>
                    </Box>
                  ))}
                </Stack>
              </CardContent>
            </MotionCard>
          </Grid>
        ))}
      </Grid>
    </MotionBox>
  );

  const renderBasicInfo = () => (
    <MotionBox
      initial={{ opacity: 0, x: 50 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.5 }}
    >
      <Typography variant="h5" sx={{ fontFamily: 'Playfair Display', fontWeight: 700, mb: 4, textAlign: 'center' }}>
        Basic Information
      </Typography>
      
      <Box sx={{ display: 'flex', justifyContent: 'center', mb: 6 }}>
        <>
          <Badge
            overlap="circular"
            anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
            badgeContent={
              <IconButton
                component="label"
                sx={{ 
                  bgcolor: COLORS.primary, 
                  color: 'white',
                  '&:hover': { bgcolor: COLORS.secondary }
                }}
              >
                <PhotoCamera />
                <input hidden accept="image/*" type="file" onChange={handleProfilePicChange} />
              </IconButton>
            }
          >
            <Avatar 
              src={formData.profilePic || undefined} 
              sx={{ width: 120, height: 120, border: `4px solid ${COLORS.cream}`, boxShadow: '0 8px 24px rgba(0,0,0,0.1)' }}
            >
              {!formData.profilePic && <AccountCircle sx={{ fontSize: 80 }} />}
            </Avatar>
          </Badge>

          <RegistrationImageCropper
            open={profileImageCropOpen}
            onClose={handleProfilePicCropClose}
            imageFile={selectedProfileImageFile}
            onCropComplete={handleProfilePicCropComplete}
            cropShape="round"
            aspectRatio={1}
            title="Crop Profile Picture"
          />
        </>
      </Box>

      <Grid container spacing={3}>
        <Grid size={{ xs: 12, sm: 6 }}>
          <TextField fullWidth label="First Name" value={formData.firstName} onChange={(e) => setFormData({ ...formData, firstName: e.target.value })} sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px' } }} error={!!fieldErrors.firstName} helperText={fieldErrors.firstName} />
        </Grid>
        <Grid size={{ xs: 12, sm: 6 }}>
          <TextField fullWidth label="Last Name" value={formData.lastName} onChange={(e) => setFormData({ ...formData, lastName: e.target.value })} sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px' } }} error={!!fieldErrors.lastName} helperText={fieldErrors.lastName} />
        </Grid>
        {formData.role === 'partner' && (
          <Grid size={{ xs: 12, sm: 6 }}>
            <FormControl fullWidth sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px' } }} error={!!fieldErrors.gender}>
              <InputLabel>Gender</InputLabel>
              <Select
                value={formData.gender}
                label="Gender"
                onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
              >
                <MenuItem value="male">Male</MenuItem>
                <MenuItem value="female">Female</MenuItem>
                <MenuItem value="non-binary">Non-binary</MenuItem>
                <MenuItem value="prefer_not_to_say">Prefer not to say</MenuItem>
              </Select>
            </FormControl>
          </Grid>
        )}
        {formData.role === 'partner' && (
          <Grid size={{ xs: 12, sm: 6 }}>
            <FormControl fullWidth sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px' } }}>
              <InputLabel>I am looking for</InputLabel>
              <Select
                value={formData.seekingGender}
                label="I am looking for"
                onChange={(e) => setFormData({ ...formData, seekingGender: e.target.value })}
              >
                <MenuItem value="">No preference</MenuItem>
                <MenuItem value="female">Women</MenuItem>
                <MenuItem value="male">Men</MenuItem>
                <MenuItem value="non-binary">Non-binary</MenuItem>
                <MenuItem value="any">Any gender</MenuItem>
              </Select>
            </FormControl>
          </Grid>
        )}
        <Grid size={{ xs: 12 }}>
          <TextField 
            fullWidth 
            label="Email Address" 
            type="email" 
            value={formData.email} 
            onChange={(e) => setFormData({ ...formData, email: e.target.value })} 
            InputProps={{ 
              startAdornment: <InputAdornment position="start"><MailOutline /></InputAdornment>,
              endAdornment: formData.email && (
                <InputAdornment position="end">
                  {availability.checking ? (
                    <CircularProgress size={20} />
                  ) : availability.emailAvailable === true ? (
                    <CheckCircle sx={{ color: '#4CAF50' }} />
                  ) : availability.emailAvailable === false ? (
                    <HighlightOff sx={{ color: '#F44336' }} />
                  ) : null}
                </InputAdornment>
              )
            }} 
            sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px' } }}
            error={!!fieldErrors.email}
            helperText={fieldErrors.email || (availability.emailAvailable === false ? '❌ Already registered' : availability.emailAvailable === true ? '✓ Available' : '')}
          />
        </Grid>
        <Grid size={{ xs: 12 }}>
          <TextField 
            fullWidth 
            label="Phone Number" 
            placeholder="771234567" 
            value={normalizedPhoneInput} 
            onChange={(e) => setFormData({ ...formData, phone: normalizeSriLankanPhoneInput(e.target.value) })} 
            InputProps={{ 
              startAdornment: (
                <InputAdornment position="start">
                  <PhoneIphone sx={{ mr: 1 }} />
                  +94
                </InputAdornment>
              ),
              endAdornment: normalizedPhoneInput && (
                <InputAdornment position="end">
                  {availability.checking ? (
                    <CircularProgress size={20} />
                  ) : availability.phoneAvailable === true && phoneIsValid ? (
                    <CheckCircle sx={{ color: '#4CAF50' }} />
                  ) : availability.phoneAvailable === false || !phoneIsValid ? (
                    <HighlightOff sx={{ color: '#F44336' }} />
                  ) : null}
                </InputAdornment>
              )
            }} 
            sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px' } }}
            error={phoneHasInput && (!phoneIsValid || availability.phoneAvailable === false || !!fieldErrors.phone)}
            helperText={fieldErrors.phone || phoneHelperText}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6 }}>
          <TextField fullWidth label="Password" type={showPassword ? 'text' : 'password'} value={formData.password} onChange={(e) => setFormData({ ...formData, password: e.target.value })} InputProps={{ startAdornment: <InputAdornment position="start"><LockOutlined /></InputAdornment>, endAdornment: <InputAdornment position="end"><IconButton onClick={() => setShowPassword(!showPassword)}>{showPassword ? <VisibilityOff /> : <Visibility />}</IconButton></InputAdornment> }} sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px' } }} error={!!fieldErrors.password} helperText={fieldErrors.password} />
          <Box sx={{ mt: 1 }}>
            <LinearProgress variant="determinate" value={passwordStrength} sx={{ height: 6, borderRadius: 3, bgcolor: '#eee', '& .MuiLinearProgress-bar': { bgcolor: passwordStrength < 50 ? '#F44336' : passwordStrength < 100 ? '#FFC107' : '#4CAF50' } }} />
            <Typography variant="caption" sx={{ color: COLORS.textSecondary }}>Strength: {passwordStrength < 50 ? 'Weak' : passwordStrength < 100 ? 'Medium' : 'Strong'}</Typography>
          </Box>
        </Grid>
        <Grid size={{ xs: 12, sm: 6 }}>
          <TextField fullWidth label="Confirm Password" type="password" value={formData.confirmPassword} onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })} InputProps={{ startAdornment: <InputAdornment position="start"><LockOutlined /></InputAdornment>, endAdornment: formData.confirmPassword && ( <InputAdornment position="end"> {passwordMatch ? <CheckCircle sx={{ color: '#4CAF50' }} /> : <HighlightOff sx={{ color: '#F44336' }} />} </InputAdornment> ) }} sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px' } }} error={!!fieldErrors.confirmPassword} helperText={fieldErrors.confirmPassword || (formData.confirmPassword ? (passwordMatch ? '✓ Passwords match' : '✗ Passwords do not match') : '')} />
        </Grid>
      </Grid>
    </MotionBox>
  );

  const renderBirthDetails = () => (
    <MotionBox
      initial={{ opacity: 0, x: 50 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.5 }}
    >
      <Typography variant="h5" sx={{ fontFamily: 'Playfair Display', fontWeight: 700, mb: 2, textAlign: 'center' }}>
        Birth Details
      </Typography>
      <Typography variant="body2" sx={{ color: COLORS.textSecondary, mb: 4, textAlign: 'center' }}>
        Used for your personalized Vedic horoscope calculation.
        <Tooltip title="Why do we need this? → For your personalized Vedic horoscope calculation">
          <IconButton size="small"><InfoOutlined fontSize="small" /></IconButton>
        </Tooltip>
      </Typography>
      <Grid container spacing={4}>
        <Grid size={{ xs: 12, md: 6 }}>
          <Stack spacing={3}>
            <TextField fullWidth type="date" label="Date of Birth" InputLabelProps={{ shrink: true }} value={formData.dob} onChange={(e) => setFormData({ ...formData, dob: e.target.value })} InputProps={{ startAdornment: <InputAdornment position="start"><CalendarMonth /></InputAdornment> }} sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px' } }} error={!!fieldErrors.dob} helperText={fieldErrors.dob} />
            <Box>
              <TextField fullWidth type="time" label="Time of Birth" disabled={formData.unknownTime} InputLabelProps={{ shrink: true }} value={formData.tob} onChange={(e) => setFormData({ ...formData, tob: e.target.value })} InputProps={{ startAdornment: <InputAdornment position="start"><AccessTime /></InputAdornment> }} sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px' } }} error={!!fieldErrors.tob} helperText={fieldErrors.tob} />
              <FormControlLabel control={<Checkbox checked={formData.unknownTime} onChange={(e) => setFormData({ ...formData, unknownTime: e.target.checked })} />} label="I don't know my exact birth time" />
              {formData.unknownTime && (
                <Alert severity="warning" sx={{ mt: 1.5, borderRadius: '12px' }}>
                  We can still generate your horoscope using an approximate time, but the accuracy of the ascendant and house placements may be lower.
                </Alert>
              )}
            </Box>
            <Autocomplete
              freeSolo
              filterOptions={(options) => options}
              options={birthPlaceSuggestions}
              loading={loadingBirthPlaceSuggestions}
              value={formData.pob}
              onChange={(_, v) => setFormData((prev) => ({ ...prev, pob: v || '' }))}
              onInputChange={(_, v) => setFormData((prev) => ({ ...prev, pob: v || '' }))}
              noOptionsText="No matching Sri Lankan places found"
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Town / Village / City of Birth"
                  placeholder="Type any Sri Lankan birthplace"
                  InputProps={{
                    ...params.InputProps,
                    startAdornment: <InputAdornment position="start"><LocationOn /></InputAdornment>,
                    endAdornment: (
                      <>
                        {loadingBirthPlaceSuggestions ? <CircularProgress color="inherit" size={18} sx={{ mr: 1 }} /> : null}
                        {params.InputProps.endAdornment}
                      </>
                    ),
                  }}
                  sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px' } }}
                  error={!!fieldErrors.pob}
                  helperText={fieldErrors.pob || 'Start typing and we will suggest the top Sri Lankan towns and cities using OpenStreetMap.'}
                />
              )}
            />
          </Stack>
        </Grid>
        <Grid size={{ xs: 12, md: 6 }}>
          <Paper
            sx={{
              p: 3,
              borderRadius: '24px',
              bgcolor: COLORS.cream,
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              border: `1px dashed ${COLORS.secondary}`,
            }}
          >
            <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 700 }}>
              Birth Chart Preview
            </Typography>

            <Box sx={{ width: 190, height: 190, position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {birthPreviewActive && (
                <CircularProgress
                  size={170}
                  thickness={2.5}
                  sx={{
                    position: 'absolute',
                    color: COLORS.primary,
                    opacity: 0.35,
                  }}
                />
              )}

              <motion.div
                animate={birthPreviewActive ? { scale: [1, 1.04, 1] } : { scale: 1 }}
                transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut' }}
                style={{
                  width: 130,
                  height: 130,
                  borderRadius: 18,
                  border: `1px solid ${COLORS.secondary}`,
                  background: 'rgba(255,255,255,0.85)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 10px 24px rgba(139,26,46,0.08)'
                }}
              >
                <motion.svg
                  viewBox="0 0 100 100"
                  style={{ width: '88%', height: '88%' }}
                  animate={birthPreviewActive ? { opacity: [0.55, 1, 0.55] } : { opacity: 0.55 }}
                  transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut' }}
                >
                  <rect x="8" y="8" width="84" height="84" fill="none" stroke={COLORS.secondary} strokeWidth="1.3" />
                  <line x1="8" y1="8" x2="92" y2="92" stroke={COLORS.secondary} strokeWidth="1.3" />
                  <line x1="92" y1="8" x2="8" y2="92" stroke={COLORS.secondary} strokeWidth="1.3" />
                  <line x1="50" y1="8" x2="92" y2="50" stroke={COLORS.secondary} strokeWidth="1.3" />
                  <line x1="92" y1="50" x2="50" y2="92" stroke={COLORS.secondary} strokeWidth="1.3" />
                  <line x1="50" y1="92" x2="8" y2="50" stroke={COLORS.secondary} strokeWidth="1.3" />
                  <line x1="8" y1="50" x2="50" y2="8" stroke={COLORS.secondary} strokeWidth="1.3" />
                </motion.svg>
              </motion.div>
            </Box>

            <Typography variant="caption" sx={{ mt: 2, color: COLORS.textSecondary, textAlign: 'center', display: 'block' }}>
              {!birthPreviewStarted
                ? 'Add your birth date, time, and birthplace to start the preview.'
                : birthPreviewActive
                  ? BIRTH_CHART_MESSAGES[chartMessageIndex]
                  : 'Complete the remaining birth details to start the calculation.'}
            </Typography>
          </Paper>
        </Grid>
      </Grid>
    </MotionBox>
  );

  const renderPersonalityQuiz = () => (
    <MotionBox
      initial={{ opacity: 0, x: 50 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.5 }}
    >
      <Typography variant="h5" sx={{ fontFamily: 'Playfair Display', fontWeight: 700, mb: 2, textAlign: 'center' }}>
        Personality Quiz
      </Typography>
      <Typography variant="body2" sx={{ color: COLORS.textSecondary, mb: 4, textAlign: 'center' }}>
        Help us understand your personality for better matching.
      </Typography>
      <Stack spacing={4}>
        {[
          "I enjoy meeting new people",
          "I prefer organized plans",
          "I am easily stressed",
          "I enjoy creative activities",
          "I am helpful and unselfish",
          "I am talkative and outgoing",
          "I am reliable and hardworking",
          "I am curious about many things",
          "I am forgiving of others",
          "I am calm and emotionally stable"
        ].map((q, i) => (
          <Box key={i}>
            <Typography variant="body1" sx={{ fontWeight: 600, mb: 1 }}>{i + 1}. {q}</Typography>
            <Stack direction="row" spacing={2} alignItems="center">
              <Typography variant="caption">Disagree</Typography>
              <Slider value={formData.personality[i]} onChange={(_, v) => {
                const newP = [...formData.personality];
                newP[i] = v as number;
                setFormData({ ...formData, personality: newP });
              }} min={1} max={5} step={1} marks sx={{ color: COLORS.primary }} />
              <Typography variant="caption">Agree</Typography>
            </Stack>
          </Box>
        ))}
      </Stack>
      <Box sx={{ mt: 6 }}>
        <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 700 }}>Personality Profile</Typography>
        <Grid container spacing={2}>
          {['Extraversion', 'Conscientiousness', 'Neuroticism', 'Openness', 'Agreeableness'].map((trait, i) => (
            <Grid size={{ xs: 12 }} key={trait}>
              <Typography variant="caption">{trait}</Typography>
              <LinearProgress variant="determinate" value={formData.personality[i] * 20} sx={{ height: 8, borderRadius: 4, bgcolor: '#eee', '& .MuiLinearProgress-bar': { bgcolor: COLORS.accent } }} />
            </Grid>
          ))}
        </Grid>
      </Box>
    </MotionBox>
  );

  const renderWeddingDetails = () => (
    <MotionBox
      initial={{ opacity: 0, x: 50 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.5 }}
    >
      <Typography variant="h5" sx={{ fontFamily: 'Playfair Display', fontWeight: 700, mb: 4, textAlign: 'center' }}>
        Wedding Details
      </Typography>
      <Grid container spacing={3}>
        <Grid size={{ xs: 12 }}>
          <TextField fullWidth label="Partner's Name" value={formData.partnerName} onChange={(e) => setFormData({ ...formData, partnerName: e.target.value })} sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px' } }} error={!!fieldErrors.partnerName} helperText={fieldErrors.partnerName} />
        </Grid>
        <Grid size={{ xs: 12, sm: 6 }}>
          <TextField fullWidth type="date" label="Planned Wedding Date" InputLabelProps={{ shrink: true }} value={formData.weddingDate} onChange={(e) => setFormData({ ...formData, weddingDate: e.target.value })} sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px' } }} error={!!fieldErrors.weddingDate} helperText={fieldErrors.weddingDate} />
        </Grid>
        <Grid size={{ xs: 12, sm: 6 }}>
          <FormControl fullWidth sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px' } }}>
            <InputLabel>Estimated Budget (LKR)</InputLabel>
            <Select value={formData.budget} label="Estimated Budget (LKR)" onChange={(e) => setFormData({ ...formData, budget: e.target.value })}>
              <MenuItem value="< 1M">Less than 1 Million</MenuItem>
              <MenuItem value="1M - 3M">1 - 3 Million</MenuItem>
              <MenuItem value="3M - 5M">3 - 5 Million</MenuItem>
              <MenuItem value="> 5M">More than 5 Million</MenuItem>
            </Select>
          </FormControl>
        </Grid>
      </Grid>
    </MotionBox>
  );

  const renderBusinessDetails = () => (
    <MotionBox
      initial={{ opacity: 0, x: 50 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.5 }}
    >
      <Typography variant="h5" sx={{ fontFamily: 'Playfair Display', fontWeight: 700, mb: 4, textAlign: 'center' }}>
        Business Details & Verification
      </Typography>
      <Grid container spacing={3}>
        {/* Basic Business Info */}
        <Grid size={{ xs: 12 }}>
          <TextField 
            fullWidth 
            label="Business Name" 
            value={formData.businessName} 
            onChange={(e) => setFormData({ ...formData, businessName: e.target.value })} 
            sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px' } }} 
            error={!!fieldErrors.businessName} 
            helperText={fieldErrors.businessName} 
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6 }}>
          <FormControl fullWidth sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px' } }} error={!!fieldErrors.businessCategory}>
            <InputLabel>Business Category</InputLabel>
            <Select value={formData.businessCategory} label="Business Category" onChange={(e) => setFormData({ ...formData, businessCategory: e.target.value })}>
              <MenuItem value="Photography">Photography</MenuItem>
              <MenuItem value="Catering">Catering</MenuItem>
              <MenuItem value="Venue">Venue</MenuItem>
              <MenuItem value="Attire">Attire & Jewelry</MenuItem>
              <MenuItem value="Music">Music & Entertainment</MenuItem>
              <MenuItem value="Decor">Decor & Flowers</MenuItem>
              <MenuItem value="Planner">Wedding Planner</MenuItem>
              <MenuItem value="Travel">Travel & Honeymoon</MenuItem>
              <MenuItem value="Makeup">Makeup & Beauty</MenuItem>
            </Select>
            {fieldErrors.businessCategory && <Typography variant="caption" sx={{ color: 'error.main', ml: 2 }}>{fieldErrors.businessCategory}</Typography>}
          </FormControl>
        </Grid>
        <Grid size={{ xs: 12, sm: 6 }}>
          <TextField 
            fullWidth 
            label="Business Registration Number" 
            placeholder="e.g., REG-2024-001" 
            value={formData.businessRegistrationNumber} 
            onChange={(e) => setFormData({ ...formData, businessRegistrationNumber: e.target.value })} 
            sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px' } }} 
            error={!!fieldErrors.businessRegistrationNumber} 
            helperText={fieldErrors.businessRegistrationNumber || 'Required for verification'} 
          />
        </Grid>
        <Grid size={{ xs: 12 }}>
          <TextField 
            fullWidth 
            label="Portfolio / Website URL" 
            value={formData.portfolioUrl} 
            onChange={(e) => setFormData({ ...formData, portfolioUrl: e.target.value })} 
            InputProps={{ startAdornment: <InputAdornment position="start"><CloudUpload /></InputAdornment> }} 
            sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px' } }} 
          />
        </Grid>

        {/* Social Links */}
        <Grid size={{ xs: 12 }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 2 }}>Social Media Links (Optional)</Typography>
        </Grid>
        <Grid size={{ xs: 12, sm: 6 }}>
          <TextField 
            fullWidth 
            label="Facebook" 
            placeholder="https://facebook.com/yourpage" 
            value={formData.socialLinks.facebook} 
            onChange={(e) => setFormData({ ...formData, socialLinks: { ...formData.socialLinks, facebook: e.target.value } })} 
            sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px' } }} 
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6 }}>
          <TextField 
            fullWidth 
            label="Instagram" 
            placeholder="https://instagram.com/yourprofile" 
            value={formData.socialLinks.instagram} 
            onChange={(e) => setFormData({ ...formData, socialLinks: { ...formData.socialLinks, instagram: e.target.value } })} 
            sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px' } }} 
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6 }}>
          <TextField 
            fullWidth 
            label="LinkedIn" 
            placeholder="https://linkedin.com/company/yourcompany" 
            value={formData.socialLinks.linkedin} 
            onChange={(e) => setFormData({ ...formData, socialLinks: { ...formData.socialLinks, linkedin: e.target.value } })} 
            sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px' } }} 
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6 }}>
          <TextField 
            fullWidth 
            label="Twitter" 
            placeholder="https://twitter.com/yourhandle" 
            value={formData.socialLinks.twitter} 
            onChange={(e) => setFormData({ ...formData, socialLinks: { ...formData.socialLinks, twitter: e.target.value } })} 
            sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px' } }} 
          />
        </Grid>
        <Grid size={{ xs: 12 }}>
          <TextField 
            fullWidth 
            label="Business Website" 
            placeholder="https://yourbusiness.com" 
            value={formData.socialLinks.website} 
            onChange={(e) => setFormData({ ...formData, socialLinks: { ...formData.socialLinks, website: e.target.value } })} 
            sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px' } }} 
          />
        </Grid>

        {/* Document Upload */}
        <Grid size={{ xs: 12 }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 2 }}>Upload Business Documents *</Typography>
          <Paper sx={{ p: 3, borderRadius: '12px', border: `2px dashed ${COLORS.accent}`, cursor: 'pointer', textAlign: 'center', bgcolor: `${COLORS.accent}05` }}>
            <CloudUpload sx={{ fontSize: 40, color: COLORS.accent, mb: 1 }} />
            <Typography variant="body2" sx={{ fontWeight: 600, mb: 1 }}>
              Upload Documents
            </Typography>
            <Typography variant="caption" sx={{ color: COLORS.textSecondary }}>
              Business Registration, Tax Certificate, License, Insurance, etc.
            </Typography>
            <input 
              type="file" 
              multiple 
              accept="application/pdf,image/*,.doc,.docx"
              onChange={(e) => {
                const files = Array.from(e.target.files || []);
                const newDocs = files.map((file) => ({
                  type: 'business_registration',
                  url: URL.createObjectURL(file),
                  fileName: file.name,
                }));
                setVendorDocumentFiles((prev) => [...prev, ...files]);
                setFormData({ ...formData, documents: [...formData.documents, ...newDocs] });
                e.currentTarget.value = '';
              }}
              style={{ display: 'none', cursor: 'pointer' }}
              id="doc-upload"
            />
            <Box component="label" htmlFor="doc-upload" sx={{ cursor: 'pointer', display: 'block' }}>
              <Button 
                variant="contained" 
                sx={{ mt: 2, bgcolor: COLORS.accent, borderRadius: '8px' }}
                component="span"
              >
                Choose Files
              </Button>
            </Box>
          </Paper>
        </Grid>

        {/* Uploaded Documents List */}
        {formData.documents.length > 0 && (
          <Grid size={{ xs: 12 }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 2 }}>Uploaded Documents ({formData.documents.length})</Typography>
            <Stack spacing={1}>
              {formData.documents.map((doc, idx) => (
                <Box 
                  key={idx} 
                  sx={{ 
                    p: 2, 
                    bgcolor: COLORS.cream, 
                    borderRadius: '8px', 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center' 
                  }}
                >
                  <Box>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>{doc.fileName}</Typography>
                    <Typography variant="caption" sx={{ color: COLORS.textSecondary }}>Document uploaded</Typography>
                  </Box>
                  <Button 
                    size="small" 
                    color="error"
                    onClick={() => {
                      const nextDocs = formData.documents.filter((_, i) => i !== idx);
                      const nextFiles = vendorDocumentFiles.filter((_, i) => i !== idx);
                      const removedDoc = formData.documents[idx];
                      if (removedDoc?.url) {
                        URL.revokeObjectURL(removedDoc.url);
                      }
                      setVendorDocumentFiles(nextFiles);
                      setFormData({ ...formData, documents: nextDocs });
                    }}
                  >
                    Remove
                  </Button>
                </Box>
              ))}
            </Stack>
          </Grid>
        )}
      </Grid>
    </MotionBox>
  );

  const renderFinalize = () => (
    <MotionBox
      initial={{ opacity: 0, x: 50 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.5 }}
    >
      <Typography variant="h5" sx={{ fontFamily: 'Playfair Display', fontWeight: 700, mb: 4, textAlign: 'center' }}>
        Privacy & Verification
      </Typography>
      <Grid container spacing={4}>
        <Grid size={{ xs: 12, md: 6 }}>
          <Stack spacing={3}>
            <Autocomplete options={['Everyone', 'Matches Only', 'Private']} renderInput={(params) => <TextField {...params} label="Who can see your profile?" sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px' } }} />} value={formData.visibility} onChange={(_, v) => setFormData({ ...formData, visibility: v || 'Everyone' })} />
            <TextField
              fullWidth
              select
              label="Religion"
              value={formData.religion}
              onChange={(e) => setFormData({ ...formData, religion: e.target.value })}
              helperText="Saved to your user profile for better cultural matching."
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px' } }}
            >
              {SRI_LANKAN_RELIGIONS.map((option) => (
                <MenuItem key={option} value={option}>{option}</MenuItem>
              ))}
            </TextField>
            <TextField
              fullWidth
              select
              label="Ethnicity"
              value={formData.ethnicity}
              onChange={(e) => setFormData({ ...formData, ethnicity: e.target.value })}
              helperText="Saved to your user profile and can be changed later."
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px' } }}
            >
              {SRI_LANKAN_ETHNICITIES.map((option) => (
                <MenuItem key={option} value={option}>{option}</MenuItem>
              ))}
            </TextField>
            <Box>
              <Typography variant="caption">Location Radius: {formData.locationRadius}km</Typography>
              <Slider value={formData.locationRadius} onChange={(_, v) => setFormData({ ...formData, locationRadius: v as number })} min={5} max={200} sx={{ color: COLORS.accent }} />
            </Box>
          </Stack>
        </Grid>
        <Grid size={{ xs: 12, md: 6 }}>
          <Paper sx={{ p: 3, borderRadius: '24px', bgcolor: COLORS.cream }}>
            <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 700 }}>Optional Verification</Typography>
            <Typography variant="caption" sx={{ display: 'block', mb: 2 }}>
              Verify your account now for immediate access, or skip and verify later from your dashboard.
            </Typography>
            <Button
              variant="outlined"
              onClick={handleSendOtp}
              disabled={otpSending}
              sx={{ mb: 2, borderRadius: '10px' }}
            >
              {otpSending ? 'Sending OTP...' : otpRequested ? 'Resend OTP' : 'Send Verification OTP'}
            </Button>
            <Stack direction="row" spacing={1} justifyContent="center">
              {formData.otp.map((digit, i) => (
                <TextField key={i} value={digit} onChange={(e) => {
                  const val = e.target.value.slice(-1);
                  const newOtp = [...formData.otp];
                  newOtp[i] = val;
                  setFormData({ ...formData, otp: newOtp });
                  if (val && i < 5) {
                    const next = document.getElementById(`otp-${i + 1}`);
                    next?.focus();
                  }
                }} id={`otp-${i}`} variant="outlined" sx={{ width: 60, '& .MuiOutlinedInput-root': { borderRadius: '8px', textAlign: 'center' } }} inputProps={{ style: { textAlign: 'center' } }} />
              ))}
            </Stack>
            <Typography variant="caption" sx={{ display: 'block', mt: 2, color: COLORS.textSecondary }}>
              Enter OTP only if you requested one now. Your account will still be created without OTP verification.
            </Typography>
            <Box sx={{ mt: 4 }}>
              <FormControlLabel control={<Checkbox checked={formData.terms} onChange={(e) => setFormData({ ...formData, terms: e.target.checked })} />} label={<Typography variant="caption">I agree to the Terms of Service and Privacy Policy</Typography>} />
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </MotionBox>
  );

  const renderStepContent = (step: number) => {
    const currentStepLabel = steps[step];

    switch (currentStepLabel) {
      case 'Account Type':
        return renderAccountType();
      case 'Basic Info':
        return renderBasicInfo();
      case 'Birth Details':
        return renderBirthDetails();
      case 'Personality':
        return renderPersonalityQuiz();
      case 'Wedding Details':
        return renderWeddingDetails();
      case 'Business Details':
        return renderBusinessDetails();
      case 'Finalize':
        return renderFinalize();
      default:
        return null;
    }
  };

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: COLORS.cream, pt: 2, pb: 6, position: 'relative', overflow: 'hidden' }}>
      <MandalaBackground size={420} sx={{ top: -100, right: -120 }} />
      <MandalaBackground size={320} opacity={0.035} sx={{ bottom: -80, left: -80 }} />
      <Container maxWidth="lg">
        <MotionBox
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          sx={{ mb: -1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0 }}
        >
          <Box
            component="img"
            src="/RaashiLink_Logo.png"
            alt="RaashiLink Logo"
            sx={{ 
              width: 220, 
              height: 220, 
              mr: -6,
              objectFit: 'contain'
            }}
          />
          <Box sx={{ textAlign: 'left' }}>
            <Typography variant="h3" sx={{ fontFamily: 'Playfair Display', fontWeight: 700, color: COLORS.primary, mb: 0 }}>
              Join RaashiLink.AI
            </Typography>
            <Typography variant="body1" sx={{ color: COLORS.textSecondary }}>
              Start your journey towards a cosmic connection.
            </Typography>
          </Box>
        </MotionBox>

        <Paper elevation={0} sx={{ p: { xs: 3, md: 6 }, borderRadius: '32px', boxShadow: '0 20px 60px rgba(139,26,46,0.05)', position: 'relative', overflow: 'hidden', minHeight: 680 }}>
          {/* Progress Indicator */}
          <Box sx={{ mb: 6 }}>
            <Stepper activeStep={activeStep} alternativeLabel={!isMobile}>
              {steps.map((label) => (
                <Step key={label} sx={{ '& .MuiStepLabel-label': { color: COLORS.textSecondary }, '& .Mui-active .MuiStepLabel-label': { color: COLORS.primary, fontWeight: 700 }, '& .Mui-completed .MuiStepLabel-label': { color: COLORS.accent } }}>
                  <StepLabel>{label}</StepLabel>
                </Step>
              ))}
            </Stepper>
            <LinearProgress variant="determinate" value={((activeStep + 1) / steps.length) * 100} sx={{ mt: 4, height: 4, borderRadius: 2, bgcolor: '#eee', '& .MuiLinearProgress-bar': { bgcolor: COLORS.secondary } }} />
          </Box>

          <AnimatePresence mode="wait">
            {success ? (
              <MotionBox
                key="success"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                sx={{ textAlign: 'center', py: 8 }}
              >
                <CheckCircle sx={{ fontSize: 80, color: '#4CAF50', mb: 3 }} />
                <Typography variant="h4" sx={{ fontFamily: 'Playfair Display', fontWeight: 700, mb: 2 }}>Registration Complete!</Typography>
                <Typography variant="body1" sx={{ color: COLORS.textSecondary }}>Welcome to the family. Redirecting you now...</Typography>
              </MotionBox>
            ) : (
              <Box key={activeStep} sx={{ minHeight: 450 }}>
                {renderStepContent(activeStep)}
                
                {error && (
                  <Alert severity="error" sx={{ mt: 4, borderRadius: '12px' }}>
                    <Typography variant="body2" sx={{ fontWeight: 700, mb: errorDetails.length > 0 ? 1 : 0 }}>
                      {error}
                    </Typography>
                    {errorDetails.length > 0 && (
                      <Box component="ul" sx={{ pl: 2, my: 0 }}>
                        {errorDetails.map((detail) => (
                          <Typography key={detail} component="li" variant="body2">
                            {detail}
                          </Typography>
                        ))}
                      </Box>
                    )}
                  </Alert>
                )}

                <Stack 
                  direction="row" 
                  spacing={2} 
                  justifyContent={activeStep === 0 ? "flex-end" : "space-between"} 
                  sx={{ mt: 8 }}
                >
                  {activeStep > 0 && (
                    <Button
                      disabled={isLoading}
                      onClick={handleBack}
                      startIcon={<ArrowBack />}
                      sx={{ color: COLORS.textSecondary, fontWeight: 700 }}
                    >
                      Back
                    </Button>
                  )}
                  <Button
                    variant="contained"
                    onClick={handleNext}
                    disabled={isLoading || (activeStep === 0 && !formData.role)}
                    endIcon={isLoading ? <CircularProgress size={20} color="inherit" /> : <ArrowForward />}
                    sx={{ 
                      bgcolor: COLORS.primary, 
                      color: 'white', 
                      px: 6, 
                      py: 1.5, 
                      borderRadius: '12px', 
                      fontWeight: 700,
                      '&:hover': { bgcolor: '#6B1424' }
                    }}
                  >
                    {activeStep === steps.length - 1 ? 'Complete Registration' : 'Continue'}
                  </Button>
                </Stack>
              </Box>
            )}
          </AnimatePresence>
        </Paper>

        <Box sx={{ textAlign: 'center', mt: 4 }}>          
          <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="center" alignItems="center" spacing={2}>
            <Button
              component={Link}
              to={backTarget}
              startIcon={<ArrowBack />}
              sx={{
                color: COLORS.textPrimary,
                borderColor: '#ddd',
                borderRadius: '14px',
                textTransform: 'none',
                px: 3,
                py: 1.2,
                '&:hover': { bgcolor: 'rgba(139,26,46,0.04)', borderColor: COLORS.primary }
              }}
              variant="outlined"
            >
              {backLabel}
            </Button>

            <Typography variant="body2" sx={{ color: COLORS.textSecondary }}>
              Already have an account?{' '}
              <Typography component={Link} to="/login" sx={{ color: COLORS.primary, fontWeight: 700, textDecoration: 'none' }}>
                Login here
              </Typography>
            </Typography>
          </Stack>
        </Box>
      </Container>
    </Box>
  );
};

export default RegisterPage;
