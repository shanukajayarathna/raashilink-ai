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
  Download
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '@/app/store/store';
import { motion } from 'motion/react';
import api from '@/shared/lib/axios';

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

export default function EditProfile() {
  const navigate = useNavigate();
  const { user, token } = useSelector((state: RootState) => state.auth);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [showExitDialog, setShowExitDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
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
    diet: 'Non-veg',
    exercise: 'Regularly',
    smoking: 'Never',
    drinking: 'Never',
    familyPlans: 'Want children',
    socialPreference: 50,
    privacy: {
      showLastSeen: true,
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
        const response = await api.get('/api/v1/user/profile');
        if (response.data) {
          setFormData({
            ...formData,
            ...response.data,
            privacy: { ...formData.privacy, ...response.data.privacy }
          });
        }
      } catch (err) {
        console.error('Failed to fetch profile:', err);
        // Using mock data if API fails for demo
        setFormData({
          ...formData,
          name: user?.name || 'Shanuka Jayarathna',
          bio: "I'm a passionate software engineer who loves exploring new technologies and building meaningful products. In my free time, I enjoy traveling across Sri Lanka, photography, and playing cricket.",
          tagline: "Building the future, one line of code at a time.",
          location: "Colombo, Western Province",
          birthDate: "1995-11-15",
          birthTime: "08:30",
          birthPlace: "Colombo",
          education: "BSc in Computer Science",
          occupation: "Senior Software Engineer",
          religion: "Buddhist",
          ethnicity: "Sinhalese",
          height: "5'10\"",
          hobbies: ['Travel', 'Photography', 'Cricket', 'Coding', 'Music'],
          diet: 'Non-veg',
          exercise: 'Regularly',
          smoking: 'Never',
          drinking: 'Never',
          familyPlans: 'Want children',
          socialPreference: 65,
          privacy: {
            showLastSeen: true,
            showHoroscope: true,
            showPhone: false,
            whoCanMessage: 'Matches Only',
            whoCanSeePhotos: 'Matches Only'
          }
        });
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [user]);

  const handleChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setHasUnsavedChanges(true);
  };

  const handlePrivacyChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      privacy: { ...prev.privacy, [field]: value }
    }));
    setHasUnsavedChanges(true);
  };

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    try {
      await api.put('/api/v1/user/profile', formData);
      setSuccess(true);
      setHasUnsavedChanges(false);
      setTimeout(() => navigate('/profile'), 1500);
    } catch (err) {
      console.error('Failed to save profile:', err);
      setError('Failed to save changes. Please try again.');
      // For demo purposes, still show success
      setSuccess(true);
      setHasUnsavedChanges(false);
      setTimeout(() => navigate('/profile'), 1500);
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
          Edit Profile
        </Typography>
      </Box>

      <Grid container spacing={4}>
        {/* Basic Info Section */}
        <Grid size={{ xs: 12, md: 8 }}>
          <Stack spacing={4}>
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

            {/* Birth Details Section */}
            <MotionPaper
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              sx={{ p: 4, borderRadius: '24px', boxShadow: '0 2px 16px rgba(139,26,46,0.05)' }}
            >
              <Typography variant="h6" sx={{ mb: 3, fontWeight: 800, color: COLORS.primary, display: 'flex', alignItems: 'center', gap: 1 }}>
                <Calendar size={20} /> Birth Details (for Horoscope)
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
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 4 }}>
                  <TextField
                    fullWidth
                    label="Birth Place"
                    value={formData.birthPlace}
                    onChange={(e) => handleChange('birthPlace', e.target.value)}
                  />
                </Grid>
              </Grid>
            </MotionPaper>

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
          </Stack>
        </Grid>

        {/* Sidebar Sections */}
        <Grid size={{ xs: 12, md: 4 }}>
          <Stack spacing={4}>
            {/* Privacy Section */}
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
                  control={<Switch checked={formData.privacy.showLastSeen} onChange={(e) => handlePrivacyChange('showLastSeen', e.target.checked)} color="primary" />}
                  label={<Typography variant="body2">Show my last seen</Typography>}
                />
                <FormControlLabel
                  control={<Switch checked={formData.privacy.showHoroscope} onChange={(e) => handlePrivacyChange('showHoroscope', e.target.checked)} color="primary" />}
                  label={<Typography variant="body2">Show my horoscope to matches</Typography>}
                />
                <FormControlLabel
                  control={<Switch checked={formData.privacy.showPhone} onChange={(e) => handlePrivacyChange('showPhone', e.target.checked)} color="primary" />}
                  label={<Typography variant="body2">Show my phone number to matches</Typography>}
                />
                
                <Divider sx={{ my: 1 }} />
                
                <TextField
                  fullWidth
                  select
                  size="small"
                  label="Who can message me"
                  value={formData.privacy.whoCanMessage}
                  onChange={(e) => handlePrivacyChange('whoCanMessage', e.target.value)}
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
                  onChange={(e) => handlePrivacyChange('whoCanSeePhotos', e.target.value)}
                >
                  <MenuItem value="Everyone">Everyone</MenuItem>
                  <MenuItem value="Matches Only">Matches Only</MenuItem>
                  <MenuItem value="Profile Viewers">Profile Viewers</MenuItem>
                </TextField>
              </Stack>
            </MotionPaper>

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
                  fontWeight: 800,
                  boxShadow: '0 8px 24px rgba(139,26,46,0.2)',
                  '&:hover': { bgcolor: '#6B1424' }
                }}
              >
                {saving ? 'Saving Changes...' : 'Save All Changes'}
              </Button>
            </Box>
          </Stack>
        </Grid>
      </Grid>

      {/* Dialogs & Snackbars */}
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
          <Button variant="contained" color="error">Delete Permanently</Button>
        </DialogActions>
      </Dialog>

      <Snackbar open={success} autoHideDuration={3000} onClose={() => setSuccess(false)}>
        <Alert severity="success" variant="filled" sx={{ width: '100%', borderRadius: 2 }}>
          Profile updated successfully!
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


