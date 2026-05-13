import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Container, 
  Typography, 
  Paper, 
  Grid, 
  TextField, 
  Button, 
  MenuItem, 
  Autocomplete,
  Stack, 
  IconButton, 
  Divider,
  Switch,
  FormControlLabel,
  Slider,
  Chip,
  Alert,
  Snackbar,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
  InputAdornment,
  alpha
} from '@mui/material';
import { 
  Save, 
  X, 
  ChevronLeft, 
  MapPin, 
  Calendar, 
  Clock, 
  Briefcase, 
  GraduationCap,
  Heart,
  Shield,
  User,
  Trash2,
  Download,
  Mail,
  Phone,
  Lock,
  Eye,
  EyeOff,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '@/app/store/store';
import { logout, updateUser } from '@/features/auth/store/authSlice';
import { motion } from 'motion/react';
import userService from '../services/userService';
import { buildEditProfileFormData, buildProfileUpdatePayload } from '../utils/profileData';

const COLORS = {
  primary: '#8B1A2E',
  secondary: '#C9A84C',
  accent: '#1A6B72',
  cream: '#FAF7F2',
  white: '#FFFFFF',
  textPrimary: '#1C1C1C',
  textSecondary: '#555555',
};

const MotionPaper = motion(Paper);
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

function normalizeLocationText(value: string) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

export default function EditProfile() {
  const navigate = useNavigate();
  const { user, token } = useSelector((state: RootState) => state.auth);
  const isHoroscopeSeeker = user?.profileType === 'horoscope_seeker' || user?.userType === 'horoscope_seeker';
  const dispatch = useDispatch();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [savingPrivacyField, setSavingPrivacyField] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [showExitDialog, setShowExitDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [birthPlaceSuggestions, setBirthPlaceSuggestions] = useState<string[]>([]);
  const [loadingBirthPlaceSuggestions, setLoadingBirthPlaceSuggestions] = useState(false);
  const preventTimeWheelChange = (event: React.WheelEvent<HTMLInputElement>) => {
    event.currentTarget.blur();
  };

  // Contact & security state
  const [contactInfo, setContactInfo] = useState({ email: '', phone: '' });
  const [showEmailDialog, setShowEmailDialog] = useState(false);
  const [showPhoneDialog, setShowPhoneDialog] = useState(false);
  const [showPasswordDialog, setShowPasswordDialog] = useState(false);
  const [emailForm, setEmailForm] = useState({ newEmail: '', currentPassword: '' });
  const [emailDialogError, setEmailDialogError] = useState('');
  const [emailDialogSaving, setEmailDialogSaving] = useState(false);
  const [phoneForm, setPhoneForm] = useState({ newPhone: '' });
  const [phoneDialogError, setPhoneDialogError] = useState('');
  const [phoneDialogSaving, setPhoneDialogSaving] = useState(false);
  const [passwordForm, setPasswordForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [passwordDialogError, setPasswordDialogError] = useState('');
  const [passwordDialogSaving, setPasswordDialogSaving] = useState(false);
  const [showCurrentPw, setShowCurrentPw] = useState(false);
  const [showNewPw, setShowNewPw] = useState(false);
  const [showConfirmPw, setShowConfirmPw] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  const [formData, setFormData] = useState({
    name: '',
    firstName: '',
    lastName: '',
    bio: '',
    tagline: '',
    location: '',
    birthDate: '',
    birthTime: '',
    birthPlace: '',
    education: '',
    occupation: '',
    religion: '',
    ethnicity: '',
    height: '',
    hobbies: [] as string[],
    seekingGender: '',
    diet: 'Non-veg',
    exercise: 'Regularly',
    smoking: 'Never',
    drinking: 'Never',
    familyPlans: 'Want children',
    socialPreference: 50,
    privacy: {
      showHoroscope: true,
      showPhone: false,
      whoCanMessage: 'Matches Only',
      whoCanSeePhotos: 'Matches Only'
    }
  });

  useEffect(() => {
    const fetchProfile = async () => {
      setLoading(true);
      try {
        const response = await userService.getProfile();
        setFormData((prev) => ({
          ...prev,
          ...buildEditProfileFormData(response),
        }));
        setContactInfo({
          email: response.verification?.email || user?.email || '',
          phone: response.verification?.phone || response.personalInfo?.phone || '',
        });
      } catch (err) {
        console.error('Failed to fetch profile:', err);
        setError('Failed to load profile data. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [user?.id, user?._id]);

  useEffect(() => {
    const query = String(formData.birthPlace || '').trim();
    const normalizedQuery = normalizeLocationText(query);

    if (!query) {
      setBirthPlaceSuggestions([]);
      setLoadingBirthPlaceSuggestions(false);
      return;
    }

    const timer = window.setTimeout(async () => {
      setLoadingBirthPlaceSuggestions(true);
      try {
        const suggestions: string[] = await userService.searchBirthPlaces(query, 5);
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
  }, [formData.birthPlace]);

  const handleChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setHasUnsavedChanges(true);
  };

  const handlePrivacyChange = async (field: string, value: any) => {
    const previousValue = formData.privacy[field as keyof typeof formData.privacy];

    // Optimistic UI update for real-time toggle/select behavior.
    setFormData((prev) => ({
      ...prev,
      privacy: { ...prev.privacy, [field]: value },
    }));
    setSavingPrivacyField(field);

    try {
      const response = await userService.updateProfile({
        privacy: { [field]: value },
      });
      dispatch(updateUser(response));
      setSuccessMessage('Privacy setting updated.');
      setSuccess(true);
    } catch (err) {
      console.error('Failed to update privacy setting:', err);
      // Revert on failure to keep UI consistent with backend state.
      setFormData((prev) => ({
        ...prev,
        privacy: { ...prev.privacy, [field]: previousValue },
      }));
      setError('Failed to update privacy setting. Please try again.');
    } finally {
      setSavingPrivacyField(null);
    }
  };

  const handleUpdateEmail = async () => {
    setEmailDialogError('');
    if (!emailForm.newEmail || !emailForm.currentPassword) {
      setEmailDialogError('All fields are required');
      return;
    }
    setEmailDialogSaving(true);
    try {
      const res = await userService.updateContactEmail(emailForm);
      setContactInfo(prev => ({ ...prev, email: res.email }));
      dispatch(updateUser({ email: res.email }));
      setShowEmailDialog(false);
      setEmailForm({ newEmail: '', currentPassword: '' });
      setSuccessMessage('Email updated. Please verify your new email address.');
      setSuccess(true);
    } catch (err: any) {
      setEmailDialogError(err.response?.data?.message || 'Failed to update email');
    } finally {
      setEmailDialogSaving(false);
    }
  };

  const handleUpdatePhone = async () => {
    setPhoneDialogError('');
    if (!phoneForm.newPhone) {
      setPhoneDialogError('Phone number is required');
      return;
    }
    setPhoneDialogSaving(true);
    try {
      const res = await userService.updateContactPhone(phoneForm);
      setContactInfo(prev => ({ ...prev, phone: res.phone }));
      dispatch(updateUser({ phone: res.phone }));
      setShowPhoneDialog(false);
      setPhoneForm({ newPhone: '' });
      setSuccessMessage('Phone number updated. Please verify your new number.');
      setSuccess(true);
    } catch (err: any) {
      setPhoneDialogError(err.response?.data?.message || 'Failed to update phone number');
    } finally {
      setPhoneDialogSaving(false);
    }
  };

  const handleChangePassword = async () => {
    setPasswordDialogError('');
    if (!passwordForm.currentPassword || !passwordForm.newPassword || !passwordForm.confirmPassword) {
      setPasswordDialogError('All fields are required');
      return;
    }
    if (passwordForm.newPassword.length < 8) {
      setPasswordDialogError('New password must be at least 8 characters');
      return;
    }
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordDialogError('New passwords do not match');
      return;
    }
    setPasswordDialogSaving(true);
    try {
      await userService.changePassword({
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword,
      });
      setShowPasswordDialog(false);
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setShowCurrentPw(false);
      setShowNewPw(false);
      setShowConfirmPw(false);
      setSuccessMessage('Password changed successfully.');
      setSuccess(true);
    } catch (err: any) {
      setPasswordDialogError(err.response?.data?.message || 'Failed to change password');
    } finally {
      setPasswordDialogSaving(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    try {
      const fullPayload = buildProfileUpdatePayload(formData);
      const seekerFirstName = String(formData.firstName || '').trim();
      const seekerLastName = String(formData.lastName || '').trim();
      const seekerFullName = [seekerFirstName, seekerLastName].filter(Boolean).join(' ').trim();
      const seekerPayload = {
        name: seekerFullName || fullPayload.name,
        personalInfo: {
          firstName: seekerFirstName,
          lastName: seekerLastName,
        },
        birthDate: fullPayload.birthDate,
        birthTime: fullPayload.birthTime,
        birthPlace: fullPayload.birthPlace,
        knownBirthTime: fullPayload.knownBirthTime,
      };

      const response = await userService.updateProfile(isHoroscopeSeeker ? seekerPayload : fullPayload);
      setFormData((prev) => ({
        ...prev,
        ...buildEditProfileFormData(response),
      }));
      dispatch(updateUser(response));
      setSuccess(true);
      setSuccessMessage('Profile updated successfully!');
      setHasUnsavedChanges(false);
      setTimeout(() => navigate('/profile'), 1500);
    } catch (err) {
      console.error('Failed to save profile:', err);
      setError('Failed to save changes. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    if (hasUnsavedChanges) {
      setShowExitDialog(true);
    } else {
      navigate('/profile');
    }
  };

  const handleDeleteAccount = async () => {
    try {
      setSaving(true);
      await userService.deleteAccount();
      
      // Dispatch logout to clear Redux state
      dispatch(logout());
      
      // Navigate to login page
      navigate('/login');
    } catch (error: any) {
      setError(error.response?.data?.message || 'Failed to delete account. Please try again.');
    } finally {
      setSaving(false);
      setShowDeleteDialog(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '80vh' }}>
        <CircularProgress sx={{ color: COLORS.primary }} />
      </Box>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box sx={{ mb: 4, display: 'flex', alignItems: 'center', gap: 2 }}>
        <IconButton onClick={handleCancel} sx={{ color: COLORS.primary }}>
          <ChevronLeft />
        </IconButton>
        <Typography variant="h4" sx={{ fontFamily: 'Playfair Display', fontWeight: 800, color: COLORS.primary }}>
          {isHoroscopeSeeker ? 'Edit Horoscope Profile' : 'Edit Profile'}
        </Typography>
      </Box>

      {isHoroscopeSeeker && (
        <Alert
          severity="info"
          sx={{
            mb: 3,
            borderRadius: 3,
            backgroundColor: alpha(COLORS.secondary, 0.12),
            color: COLORS.textPrimary,
          }}
        >
          These settings are tailored for horoscope seekers. Only registration details are editable here.
        </Alert>
      )}

      <Grid container spacing={4}>
        {/* Basic Info Section */}
        <Grid size={{ xs: 12, md: 8 }}>
          <Stack spacing={4}>
            {isHoroscopeSeeker && (
              <MotionPaper
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                sx={{ p: 4, borderRadius: '24px', boxShadow: '0 2px 16px rgba(139,26,46,0.05)' }}
              >
                <Typography variant="h6" sx={{ mb: 3, fontWeight: 800, color: COLORS.primary, display: 'flex', alignItems: 'center', gap: 1 }}>
                  <User size={20} /> Profile Name
                </Typography>
                <Grid container spacing={3}>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <TextField
                      fullWidth
                      label="First Name"
                      value={formData.firstName}
                      onChange={(e) => handleChange('firstName', e.target.value)}
                      variant="outlined"
                    />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <TextField
                      fullWidth
                      label="Last Name"
                      value={formData.lastName}
                      onChange={(e) => handleChange('lastName', e.target.value)}
                      variant="outlined"
                    />
                  </Grid>
                </Grid>
              </MotionPaper>
            )}

            {!isHoroscopeSeeker && (
              <MotionPaper
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                sx={{ p: 4, borderRadius: '24px', boxShadow: '0 2px 16px rgba(139,26,46,0.05)' }}
              >
                <Typography variant="h6" sx={{ mb: 3, fontWeight: 800, color: COLORS.primary, display: 'flex', alignItems: 'center', gap: 1 }}>
                  <User size={20} /> Basic Information
                </Typography>
                <Grid container spacing={3}>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <TextField
                      fullWidth
                      label="Full Name"
                      value={formData.name}
                      onChange={(e) => handleChange('name', e.target.value)}
                      variant="outlined"
                    />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <TextField
                      fullWidth
                      label="Tagline"
                      placeholder="Short bio for your profile"
                      value={formData.tagline}
                      onChange={(e) => handleChange('tagline', e.target.value)}
                      variant="outlined"
                    />
                  </Grid>
                  <Grid size={{ xs: 12 }}>
                    <TextField
                      fullWidth
                      label="About Me"
                      multiline
                      rows={4}
                      value={formData.bio}
                      onChange={(e) => handleChange('bio', e.target.value)}
                      variant="outlined"
                    />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <TextField
                      fullWidth
                      label="Location"
                      value={formData.location}
                      onChange={(e) => handleChange('location', e.target.value)}
                      InputProps={{ startAdornment: <MapPin size={18} style={{ marginRight: 8, color: COLORS.textSecondary }} /> }}
                    />
                  </Grid>
                </Grid>
              </MotionPaper>
            )}

            {/* Birth Details Section */}
            <MotionPaper
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              sx={{ p: 4, borderRadius: '24px', boxShadow: '0 2px 16px rgba(139,26,46,0.05)' }}
            >
              <Typography variant="h6" sx={{ mb: 3, fontWeight: 800, color: COLORS.primary, display: 'flex', alignItems: 'center', gap: 1 }}>
                <Calendar size={20} /> Registration Birth Details
              </Typography>
              <Grid container spacing={3}>
                <Grid size={{ xs: 12, sm: 4 }}>
                  <TextField
                    fullWidth
                    label="Birth Date"
                    type="date"
                    value={formData.birthDate}
                    onChange={(e) => handleChange('birthDate', e.target.value)}
                    InputLabelProps={{ shrink: true }}
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 4 }}>
                  <TextField
                    fullWidth
                    label="Birth Time"
                    type="time"
                    value={formData.birthTime}
                    onChange={(e) => handleChange('birthTime', e.target.value)}
                    InputLabelProps={{ shrink: true }}
                    inputProps={{ step: 60, onWheel: preventTimeWheelChange }}
                    helperText="Tip: Use the clock picker or keyboard arrow keys for precise time selection."
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 4 }}>
                  <Autocomplete
                    freeSolo
                    filterOptions={(options) => options}
                    options={birthPlaceSuggestions}
                    loading={loadingBirthPlaceSuggestions}
                    value={formData.birthPlace}
                    onChange={(_, value) => handleChange('birthPlace', value || '')}
                    onInputChange={(_, value) => handleChange('birthPlace', value || '')}
                    noOptionsText="No matching Sri Lankan places found"
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        fullWidth
                        label="Town / Village / City of Birth"
                        placeholder="e.g. Akuressa, Wellawaya, Point Pedro"
                        helperText="Start typing to get the top matching Sri Lankan towns and villages from OpenStreetMap."
                        InputProps={{
                          ...params.InputProps,
                          endAdornment: (
                            <>
                              {loadingBirthPlaceSuggestions ? <CircularProgress color="inherit" size={18} sx={{ mr: 1 }} /> : null}
                              {params.InputProps.endAdornment}
                            </>
                          ),
                        }}
                      />
                    )}
                  />
                </Grid>
              </Grid>
            </MotionPaper>

            {!isHoroscopeSeeker && (
              <>
                {/* Professional & Education Section */}
                <MotionPaper
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  sx={{ p: 4, borderRadius: '24px', boxShadow: '0 2px 16px rgba(139,26,46,0.05)' }}
                >
                  <Typography variant="h6" sx={{ mb: 3, fontWeight: 800, color: COLORS.primary, display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Briefcase size={20} /> Education & Career
                  </Typography>
                  <Grid container spacing={3}>
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <TextField
                        fullWidth
                        label="Education"
                        value={formData.education}
                        onChange={(e) => handleChange('education', e.target.value)}
                        InputProps={{ startAdornment: <GraduationCap size={18} style={{ marginRight: 8, color: COLORS.textSecondary }} /> }}
                      />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <TextField
                        fullWidth
                        label="Occupation"
                        value={formData.occupation}
                        onChange={(e) => handleChange('occupation', e.target.value)}
                        InputProps={{ startAdornment: <Briefcase size={18} style={{ marginRight: 8, color: COLORS.textSecondary }} /> }}
                      />
                    </Grid>
                  </Grid>
                </MotionPaper>

                {/* Lifestyle Section */}
                <MotionPaper
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  sx={{ p: 4, borderRadius: '24px', boxShadow: '0 2px 16px rgba(139,26,46,0.05)' }}
                >
                  <Typography variant="h6" sx={{ mb: 3, fontWeight: 800, color: COLORS.primary, display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Heart size={20} /> Lifestyle Preferences
                  </Typography>
                  <Grid container spacing={3}>
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <TextField
                        fullWidth
                        select
                        label="Diet Preference"
                        value={formData.diet}
                        onChange={(e) => handleChange('diet', e.target.value)}
                      >
                        <MenuItem value="Vegetarian">Vegetarian</MenuItem>
                        <MenuItem value="Non-veg">Non-veg</MenuItem>
                        <MenuItem value="Vegan">Vegan</MenuItem>
                      </TextField>
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <TextField
                        fullWidth
                        select
                        label="Exercise"
                        value={formData.exercise}
                        onChange={(e) => handleChange('exercise', e.target.value)}
                      >
                        <MenuItem value="Daily">Daily</MenuItem>
                        <MenuItem value="Regularly">Regularly</MenuItem>
                        <MenuItem value="Occasionally">Occasionally</MenuItem>
                        <MenuItem value="Never">Never</MenuItem>
                      </TextField>
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <TextField
                        fullWidth
                        select
                        label="Smoking"
                        value={formData.smoking}
                        onChange={(e) => handleChange('smoking', e.target.value)}
                      >
                        <MenuItem value="Never">Never</MenuItem>
                        <MenuItem value="Occasionally">Occasionally</MenuItem>
                        <MenuItem value="Regularly">Regularly</MenuItem>
                      </TextField>
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <TextField
                        fullWidth
                        select
                        label="Drinking"
                        value={formData.drinking}
                        onChange={(e) => handleChange('drinking', e.target.value)}
                      >
                        <MenuItem value="Never">Never</MenuItem>
                        <MenuItem value="Occasionally">Occasionally</MenuItem>
                        <MenuItem value="Regularly">Regularly</MenuItem>
                      </TextField>
                    </Grid>
                    <Grid size={{ xs: 12 }}>
                      <Typography variant="subtitle2" sx={{ mb: 1, color: COLORS.textSecondary }}>Social Preference (Introvert vs Extrovert)</Typography>
                      <Slider
                        value={formData.socialPreference}
                        onChange={(_, val) => handleChange('socialPreference', val)}
                        sx={{ color: COLORS.accent }}
                      />
                      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Typography variant="caption">Introvert</Typography>
                        <Typography variant="caption">Extrovert</Typography>
                      </Box>
                    </Grid>
                  </Grid>
                </MotionPaper>
              </>
            )}
          </Stack>
        </Grid>

        {/* Sidebar Sections */}
        <Grid size={{ xs: 12, md: 4 }}>
          <Stack spacing={4}>

            {/* Contact & Security Section — moved to top for easy access */}
            <MotionPaper
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.05 }}
              sx={{ p: 4, borderRadius: '24px', boxShadow: '0 2px 16px rgba(139,26,46,0.05)' }}
            >
              <Typography variant="h6" sx={{ mb: 3, fontWeight: 800, color: COLORS.primary, display: 'flex', alignItems: 'center', gap: 1 }}>
                <Lock size={20} /> Contact & Security
              </Typography>
              <Stack spacing={2}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', p: 1.5, borderRadius: 2, bgcolor: alpha(COLORS.primary, 0.04) }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, minWidth: 0 }}>
                    <Mail size={16} color={COLORS.primary} style={{ flexShrink: 0 }} />
                    <Box sx={{ minWidth: 0 }}>
                      <Typography variant="caption" sx={{ color: COLORS.textSecondary, display: 'block' }}>Email</Typography>
                      <Typography variant="body2" sx={{ fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {contactInfo.email || 'Not set'}
                      </Typography>
                    </Box>
                  </Box>
                  <Button size="small" variant="outlined" onClick={() => { setEmailForm({ newEmail: '', currentPassword: '' }); setEmailDialogError(''); setShowEmailDialog(true); }} sx={{ ml: 1, flexShrink: 0, borderColor: COLORS.primary, color: COLORS.primary, borderRadius: 2, fontSize: '0.72rem' }}>
                    Change
                  </Button>
                </Box>

                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', p: 1.5, borderRadius: 2, bgcolor: alpha(COLORS.primary, 0.04) }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, minWidth: 0 }}>
                    <Phone size={16} color={COLORS.primary} style={{ flexShrink: 0 }} />
                    <Box sx={{ minWidth: 0 }}>
                      <Typography variant="caption" sx={{ color: COLORS.textSecondary, display: 'block' }}>Phone</Typography>
                      <Typography variant="body2" sx={{ fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {contactInfo.phone || 'Not set'}
                      </Typography>
                    </Box>
                  </Box>
                  <Button size="small" variant="outlined" onClick={() => { setPhoneForm({ newPhone: '' }); setPhoneDialogError(''); setShowPhoneDialog(true); }} sx={{ ml: 1, flexShrink: 0, borderColor: COLORS.primary, color: COLORS.primary, borderRadius: 2, fontSize: '0.72rem' }}>
                    Change
                  </Button>
                </Box>

                <Button fullWidth variant="outlined" startIcon={<Lock size={16} />} onClick={() => { setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' }); setPasswordDialogError(''); setShowCurrentPw(false); setShowNewPw(false); setShowConfirmPw(false); setShowPasswordDialog(true); }} sx={{ borderRadius: 2, mt: 1, borderColor: COLORS.accent, color: COLORS.accent }}>
                  Change Password
                </Button>
              </Stack>
            </MotionPaper>

            {!isHoroscopeSeeker && (
              <MotionPaper
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                sx={{ p: 4, borderRadius: '24px', boxShadow: '0 2px 16px rgba(139,26,46,0.05)' }}
              >
                <Typography variant="h6" sx={{ mb: 3, fontWeight: 800, color: COLORS.primary, display: 'flex', alignItems: 'center', gap: 1 }}>
                  <User size={20} /> Identity & Verification
                </Typography>
                <Stack spacing={2}>
                  <TextField
                    fullWidth
                    select
                    label="I am looking for"
                    value={formData.seekingGender}
                    onChange={(e) => handleChange('seekingGender', e.target.value)}
                    helperText="Controls which gender appears in your matches and top match."
                  >
                    <MenuItem value="">No preference (show all)</MenuItem>
                    <MenuItem value="female">Women</MenuItem>
                    <MenuItem value="male">Men</MenuItem>
                    <MenuItem value="non-binary">Non-binary</MenuItem>
                    <MenuItem value="any">Any gender</MenuItem>
                  </TextField>

                  <TextField
                    fullWidth
                    select
                    label="Religion"
                    value={formData.religion}
                    onChange={(e) => handleChange('religion', e.target.value)}
                    helperText="Saved under your user profile for matching and profile display."
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
                    onChange={(e) => handleChange('ethnicity', e.target.value)}
                    helperText="Choose the option that best matches your Sri Lankan background, or select Other."
                  >
                    {SRI_LANKAN_ETHNICITIES.map((option) => (
                      <MenuItem key={option} value={option}>{option}</MenuItem>
                    ))}
                  </TextField>
                </Stack>
              </MotionPaper>
            )}

            {/* Privacy Section */}
            {!isHoroscopeSeeker && (
              <MotionPaper
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                sx={{ p: 4, borderRadius: '24px', boxShadow: '0 2px 16px rgba(139,26,46,0.05)' }}
              >
                <Typography variant="h6" sx={{ mb: 3, fontWeight: 800, color: COLORS.primary, display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Shield size={20} /> Privacy Settings
                </Typography>
                <Stack spacing={2}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={formData.privacy.showHoroscope}
                      onChange={(e) => { void handlePrivacyChange('showHoroscope', e.target.checked); }}
                      color="primary"
                      disabled={saving || savingPrivacyField === 'showHoroscope'}
                    />
                  }
                  label={<Typography variant="body2">Show my horoscope to matches</Typography>}
                />
                <FormControlLabel
                  control={
                    <Switch
                      checked={formData.privacy.showPhone}
                      onChange={(e) => { void handlePrivacyChange('showPhone', e.target.checked); }}
                      color="primary"
                      disabled={saving || savingPrivacyField === 'showPhone'}
                    />
                  }
                  label={<Typography variant="body2">Show my phone number to matches</Typography>}
                />
                
                <Divider sx={{ my: 1 }} />
                
                <TextField
                  fullWidth
                  select
                  size="small"
                  label="Who can message me"
                  value={formData.privacy.whoCanMessage}
                  onChange={(e) => { void handlePrivacyChange('whoCanMessage', e.target.value); }}
                  disabled={saving || savingPrivacyField === 'whoCanMessage'}
                >
                  <MenuItem value="Everyone">Everyone</MenuItem>
                  <MenuItem value="Matches Only">Matches Only</MenuItem>
                  <MenuItem value="No One">No One</MenuItem>
                </TextField>

                <TextField
                  fullWidth
                  select
                  size="small"
                  label="Who can see my photos"
                  value={formData.privacy.whoCanSeePhotos}
                  onChange={(e) => { void handlePrivacyChange('whoCanSeePhotos', e.target.value); }}
                  disabled={saving || savingPrivacyField === 'whoCanSeePhotos'}
                >
                  <MenuItem value="Everyone">Everyone</MenuItem>
                  <MenuItem value="Matches Only">Matches Only</MenuItem>
                  <MenuItem value="Profile Viewers">Profile Viewers</MenuItem>
                </TextField>
                </Stack>
              </MotionPaper>
            )}

            {/* Account Actions */}
            <MotionPaper
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
              sx={{ p: 4, borderRadius: '24px', boxShadow: '0 2px 16px rgba(139,26,46,0.05)' }}
            >
              <Typography variant="h6" sx={{ mb: 3, fontWeight: 800, color: COLORS.primary }}>
                Account Actions
              </Typography>
              <Stack spacing={2}>
                <Button 
                  fullWidth 
                  variant="outlined" 
                  startIcon={<Download size={18} />}
                  sx={{ borderRadius: 2, color: COLORS.accent, borderColor: COLORS.accent }}
                >
                  Download My Data
                </Button>
                <Button 
                  fullWidth 
                  variant="outlined" 
                  color="error"
                  onClick={() => setShowDeleteDialog(true)}
                  startIcon={<Trash2 size={18} />}
                  sx={{ borderRadius: 2 }}
                >
                  Delete Account
                </Button>
              </Stack>
            </MotionPaper>

            {/* Save Button Sticky */}
            <Box sx={{ position: 'sticky', bottom: 24, zIndex: 10 }}>
              <Button
                fullWidth
                variant="contained"
                size="large"
                onClick={handleSave}
                disabled={saving || !hasUnsavedChanges}
                startIcon={saving ? <CircularProgress size={20} color="inherit" /> : <Save size={20} />}
                sx={{ 
                  bgcolor: COLORS.primary, 
                  borderRadius: '16px', 
                  py: 2, 
                  minHeight: 64,
                  minWidth: 220,
                  fontWeight: 800,
                  boxShadow: '0 8px 24px rgba(139,26,46,0.2)',
                  '&:hover': { bgcolor: '#6B1424' }
                }}
              >
                Save All Changes
              </Button>
            </Box>
          </Stack>
        </Grid>
      </Grid>

      {/* Dialogs & Snackbars */}
      {/* Change Email Dialog */}
      <Dialog open={showEmailDialog} onClose={() => setShowEmailDialog(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 800, color: COLORS.primary }}>Change Email Address</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <Typography variant="body2" color="text.secondary">
              Enter your new email address and confirm with your current password. You will need to verify the new email.
            </Typography>
            <TextField
              fullWidth
              label="New Email Address"
              type="email"
              value={emailForm.newEmail}
              onChange={(e) => setEmailForm(prev => ({ ...prev, newEmail: e.target.value }))}
              InputProps={{ startAdornment: <InputAdornment position="start"><Mail size={16} /></InputAdornment> }}
            />
            <TextField
              fullWidth
              label="Current Password"
              type="password"
              value={emailForm.currentPassword}
              onChange={(e) => setEmailForm(prev => ({ ...prev, currentPassword: e.target.value }))}
              InputProps={{ startAdornment: <InputAdornment position="start"><Lock size={16} /></InputAdornment> }}
            />
            {emailDialogError && <Alert severity="error" sx={{ borderRadius: 2 }}>{emailDialogError}</Alert>}
          </Stack>
        </DialogContent>
        <DialogActions sx={{ p: 3, pt: 1 }}>
          <Button onClick={() => setShowEmailDialog(false)} sx={{ color: COLORS.textSecondary }}>Cancel</Button>
          <Button variant="contained" onClick={handleUpdateEmail} disabled={emailDialogSaving} sx={{ bgcolor: COLORS.primary, '&:hover': { bgcolor: '#6B1424' }, minWidth: 152, minHeight: 36 }}>
            {emailDialogSaving ? <CircularProgress size={20} color="inherit" /> : 'Update Email'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Change Phone Dialog */}
      <Dialog open={showPhoneDialog} onClose={() => setShowPhoneDialog(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 800, color: COLORS.primary }}>Change Phone Number</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <Typography variant="body2" color="text.secondary">
              Enter your new Sri Lankan mobile number (e.g. 0771234567). You will need to verify it after updating.
            </Typography>
            <TextField
              fullWidth
              label="New Phone Number"
              type="tel"
              placeholder="07XXXXXXXX"
              value={phoneForm.newPhone}
              onChange={(e) => setPhoneForm({ newPhone: e.target.value })}
              InputProps={{ startAdornment: <InputAdornment position="start"><Phone size={16} /></InputAdornment> }}
            />
            {phoneDialogError && <Alert severity="error" sx={{ borderRadius: 2 }}>{phoneDialogError}</Alert>}
          </Stack>
        </DialogContent>
        <DialogActions sx={{ p: 3, pt: 1 }}>
          <Button onClick={() => setShowPhoneDialog(false)} sx={{ color: COLORS.textSecondary }}>Cancel</Button>
          <Button variant="contained" onClick={handleUpdatePhone} disabled={phoneDialogSaving} sx={{ bgcolor: COLORS.primary, '&:hover': { bgcolor: '#6B1424' }, minWidth: 152, minHeight: 36 }}>
            {phoneDialogSaving ? <CircularProgress size={20} color="inherit" /> : 'Update Phone'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Change Password Dialog */}
      <Dialog open={showPasswordDialog} onClose={() => setShowPasswordDialog(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 800, color: COLORS.primary }}>Change Password</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            {user?.verification?.hasPassword === false ? (
              <Alert severity="info" sx={{ borderRadius: 2 }}>
                You registered via Google and haven't set a password yet. To set a password for your account, please use the <strong>Forgot Password</strong> flow from the login page.
              </Alert>
            ) : (
              <Typography variant="body2" color="text.secondary">
                Choose a strong password of at least 8 characters.
              </Typography>
            )}
            <TextField
              fullWidth
              label="Current Password"
              type={showCurrentPw ? 'text' : 'password'}
              value={passwordForm.currentPassword}
              onChange={(e) => setPasswordForm(prev => ({ ...prev, currentPassword: e.target.value }))}
              InputProps={{
                startAdornment: <InputAdornment position="start"><Lock size={16} /></InputAdornment>,
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton size="small" onClick={() => setShowCurrentPw(v => !v)}>
                      {showCurrentPw ? <EyeOff size={16} /> : <Eye size={16} />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />
            <TextField
              fullWidth
              label="New Password"
              type={showNewPw ? 'text' : 'password'}
              value={passwordForm.newPassword}
              onChange={(e) => setPasswordForm(prev => ({ ...prev, newPassword: e.target.value }))}
              helperText="Min. 8 characters"
              InputProps={{
                startAdornment: <InputAdornment position="start"><Lock size={16} /></InputAdornment>,
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton size="small" onClick={() => setShowNewPw(v => !v)}>
                      {showNewPw ? <EyeOff size={16} /> : <Eye size={16} />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />
            <TextField
              fullWidth
              label="Confirm New Password"
              type={showConfirmPw ? 'text' : 'password'}
              value={passwordForm.confirmPassword}
              onChange={(e) => setPasswordForm(prev => ({ ...prev, confirmPassword: e.target.value }))}
              InputProps={{
                startAdornment: <InputAdornment position="start"><Lock size={16} /></InputAdornment>,
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton size="small" onClick={() => setShowConfirmPw(v => !v)}>
                      {showConfirmPw ? <EyeOff size={16} /> : <Eye size={16} />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />
            {passwordDialogError && <Alert severity="error" sx={{ borderRadius: 2 }}>{passwordDialogError}</Alert>}
          </Stack>
        </DialogContent>
        <DialogActions sx={{ p: 3, pt: 1 }}>
          <Button onClick={() => setShowPasswordDialog(false)} sx={{ color: COLORS.textSecondary }}>Cancel</Button>
          <Button variant="contained" onClick={handleChangePassword} disabled={passwordDialogSaving} sx={{ bgcolor: COLORS.primary, '&:hover': { bgcolor: '#6B1424' }, minWidth: 168, minHeight: 36 }}>
            {passwordDialogSaving ? <CircularProgress size={20} color="inherit" /> : 'Change Password'}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={showExitDialog} onClose={() => setShowExitDialog(false)}>
        <DialogTitle sx={{ fontWeight: 800 }}>Unsaved Changes</DialogTitle>
        <DialogContent>
          <Typography>You have unsaved changes. Are you sure you want to leave without saving?</Typography>
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
          <Button onClick={() => setShowExitDialog(false)} sx={{ color: COLORS.textSecondary }}>Stay</Button>
          <Button onClick={() => navigate('/profile')} variant="contained" sx={{ bgcolor: COLORS.primary }}>Leave</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={showDeleteDialog} onClose={() => setShowDeleteDialog(false)}>
        <DialogTitle sx={{ fontWeight: 800, color: 'error.main' }}>Delete Account</DialogTitle>
        <DialogContent>
          <Typography>This action is permanent and cannot be undone. All your data, matches, and messages will be permanently deleted.</Typography>
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
          <Button onClick={() => setShowDeleteDialog(false)} sx={{ color: COLORS.textSecondary }}>Cancel</Button>
          <Button 
            variant="contained" 
            color="error" 
            onClick={handleDeleteAccount}
            disabled={saving}
          >
            {saving ? 'Deleting...' : 'Delete Permanently'}
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar open={success} autoHideDuration={4000} onClose={() => setSuccess(false)}>
        <Alert severity="success" variant="filled" sx={{ width: '100%', borderRadius: 2 }}>
          {successMessage || 'Profile updated successfully!'}
        </Alert>
      </Snackbar>

      <Snackbar open={!!error} autoHideDuration={5000} onClose={() => setError(null)}>
        <Alert severity="error" variant="filled" sx={{ width: '100%', borderRadius: 2 }}>
          {error}
        </Alert>
      </Snackbar>
    </Container>
  );
}


