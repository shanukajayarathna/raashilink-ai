import React, { useEffect, useMemo, useRef, useState } from 'react';
import { 
  Box, 
  Container, 
  Typography, 
  Paper, 
  Grid, 
  Avatar, 
  Button, 
  Tabs, 
  Tab, 
  Chip, 
  Stack, 
  IconButton, 
  Divider,
  Switch,
  FormControlLabel,
  Slider,
  Skeleton,
  alpha,
  Tooltip,
  TextField,
  Card,
  CardContent,
  CardHeader,
  LinearProgress,
  CircularProgress,
  MenuItem,
  InputAdornment
} from '@mui/material';
import { 
  MapPin, 
  Calendar, 
  Clock, 
  Briefcase, 
  GraduationCap,
  Heart,
  Shield,
  User,
  Camera,
  Edit3,
  Star,
  Trash2,
  Download,
  Plus,
  CheckCircle2,
  Languages,
  Activity,
  Coffee,
  Users,
  X,
  Edit
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '@/app/store/store';
import { updateUser } from '@/features/auth/store/authSlice';
import { showToast } from '@/app/store/uiSlice';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Radar, 
  RadarChart, 
  PolarGrid, 
  PolarAngleAxis, 
  PolarRadiusAxis, 
  ResponsiveContainer 
} from 'recharts';
import CoverPhotoUpload from '../components/CoverPhotoUpload';
import ProfilePhotoUpload from '../components/ProfilePhotoUpload';
import userService from '../services/userService';
import { buildProfileUpdatePayload, formatProfileValue, normalizeProfileData } from '../utils/profileData';
import ImageCropper from '@/shared/components/ImageCropper';

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
const MotionBox = motion(Box);
const AGE_OPTIONS = Array.from({ length: 73 }, (_, index) => 18 + index);
const HEIGHT_MIN_CM = 120;
const HEIGHT_MAX_CM = 230;
const EDUCATION_OPTIONS = [
  'O/L',
  'A/L',
  'Diploma',
  'Higher Diploma',
  'Bachelor Degree',
  'Master Degree',
  'Doctorate',
  'Professional Qualification',
  'Other',
];
const EXERCISE_OPTIONS = ['Daily', 'Regularly', 'Occasionally', 'Rarely', 'Never'];
const DIET_OPTIONS = ['Vegetarian', 'Non-veg', 'Vegan', 'Pescatarian', 'Other'];
const SMOKING_OPTIONS = ['Never', 'Occasionally', 'Regularly'];
const DRINKING_OPTIONS = ['Never', 'Occasionally', 'Regularly'];

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function CustomTabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`profile-tabpanel-${index}`}
      aria-labelledby={`profile-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ py: 4 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

function getProfileDisplayName(profile: any) {
  const candidates = [
    profile?.name,
    [profile?.personalInfo?.firstName, profile?.personalInfo?.lastName].filter(Boolean).join(' ').trim(),
  ];

  const resolved = candidates.find((value) => {
    if (typeof value !== 'string') return false;
    const normalized = value.trim();
    return normalized.length > 0 && normalized.toLowerCase() !== 'not provided';
  });

  return resolved || 'User';
}

function getProfileHeroTitle(profile: any) {
  const name = getProfileDisplayName(profile);
  const age = profile?.age;

  if (age === undefined || age === null || age === '' || age === 'Not provided') {
    return name;
  }

  return `${name}, ${age}`;
}

export default function UserProfile() {
  const navigate = useNavigate();
  const { user, token } = useSelector((state: RootState) => state.auth);  const dispatch = useDispatch();  const [tabValue, setTabValue] = useState(0);
  const [loading, setLoading] = useState(false);
  const [profileData, setProfileData] = useState<any>(null);
  const [editing, setEditing] = useState(false);
  const [editData, setEditData] = useState<any>({});
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);
  const [removingPhoto, setRemovingPhoto] = useState(false);
  const [removingCover, setRemovingCover] = useState(false);
  const [uploadingGalleryPhoto, setUploadingGalleryPhoto] = useState(false);
  const [removingGalleryPhotoId, setRemovingGalleryPhotoId] = useState<number | null>(null);
  const [galleryCropperOpen, setGalleryCropperOpen] = useState(false);
  const [gallerySelectedFile, setGallerySelectedFile] = useState<File | null>(null);
  const [galleryCroppedImage, setGalleryCroppedImage] = useState<string | null>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);
  const galleryPreviewUrl = useMemo(
    () => (gallerySelectedFile ? URL.createObjectURL(gallerySelectedFile) : null),
    [gallerySelectedFile]
  );

  useEffect(() => () => {
    if (galleryPreviewUrl) {
      URL.revokeObjectURL(galleryPreviewUrl);
    }
  }, [galleryPreviewUrl]);

  useEffect(() => {
    const fetchProfile = async () => {
      setLoading(true);
      try {
        const response = await userService.getProfile();
        const normalized = normalizeProfileData(response);
        setProfileData(normalized);
        setEditData(normalized);
      } catch (err) {
        console.error('Failed to fetch profile:', err);
        // Fallback to user data
        const fallbackProfile = normalizeProfileData({
          name: user?.name || 'User',
          age: user?.age || null,
          tagline: user?.tagline || 'Building a meaningful future through shared values.',
          location: user?.location || 'Sri Lanka',
          completion: 75,
          status: "Online Now",
          bio: user?.bio || '',
          coverPhoto: user?.coverPhoto || null,
          profilePic: user?.profilePic || null,
          personalInfo: {
            firstName: user?.personalInfo?.firstName || 'Not provided',
            lastName: user?.personalInfo?.lastName || 'Not provided',
            phone: user?.phone || 'Not provided',
            age: user?.age || 'Not provided',
            gender: user?.gender || 'Not provided',
            height: user?.height || 'Not provided',
            education: user?.lifestyle?.educationLevel || 'Not provided',
            occupation: user?.lifestyle?.professionType || 'Not provided',
            religion: user?.lifestyle?.religion || 'Not provided',
            ethnicity: user?.ethnicity || 'Not provided',
            languages: user?.lifestyle?.languages || ['Not provided'],
          },
          astrology: {
            birthDate: 'Not provided',
            birthTime: 'Not provided',
            birthPlace: 'Not provided',
            rashi: 'Not provided',
            nakshatra: 'Not provided',
            ascendant: 'Not provided',
            sunSign: 'Not provided',
            luckyColors: ['#8B1A2E', '#C9A84C'],
            auspiciousDays: ['Tuesday', 'Thursday'],
            favorablePartners: ['Aries', 'Leo', 'Sagittarius']
          },
          lifestyle: {
            hobbies: user?.lifestyle?.hobbies || ['Not provided'],
            exercise: 'Regularly',
            diet: user?.lifestyle?.diet || 'Not provided',
            smoking: user?.lifestyle?.smoking || 'Not provided',
            drinking: user?.lifestyle?.drinking || 'Not provided',
            careerAmbitions: user?.lifestyle?.professionType || 'Not provided',
            familyPlans: 'Looking for a serious long-term relationship',
            socialPreference: 65
          },
          photos: [],
          privacy: {
            showLastSeen: true,
            showHoroscope: true,
            showPhone: false,
            whoCanMessage: 'Matches Only',
            whoCanSeePhotos: 'Matches Only'
          }
        });
        setProfileData(fallbackProfile);
        setEditData(fallbackProfile);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [user?.id, user?._id]);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handlePhotoUpload = async (file: File) => {
    try {
      setUploadingPhoto(true);
      const formData = new FormData();
      formData.append('photo', file);

      const response = await userService.uploadPhoto(formData);

      if (response && response.profilePic) {
        const nextPhotos = [
          { url: response.profilePic, isMain: true },
          ...((user?.photos || []).filter((photo: any) => !photo?.isMain)),
        ];

        dispatch(updateUser({ profilePic: response.profilePic, photos: nextPhotos }));
        setProfileData((prev: any) => {
          if (!prev) {
            return null;
          }

          const remainingPhotos = prev.photos?.filter((p: any) => !p.isMain) || [];
          return {
            ...prev,
            profilePic: response.profilePic,
            photos: [{ id: 1, url: response.profilePic, isMain: true }, ...remainingPhotos],
          };
        });
        setEditData((prev: any) => ({
          ...prev,
          profilePic: response.profilePic,
        }));
      }

      dispatch(showToast({ type: 'success', message: 'Profile picture updated successfully!' }));
    } catch (error: any) {
      console.error('Error uploading photo:', error);
      dispatch(showToast({ type: 'error', message: error.response?.data?.message || 'Failed to upload photo. Please try again.' }));
    } finally {
      setUploadingPhoto(false);
    }
  };

  const handleCoverPhotoUpload = async (file: File) => {
    setUploadingCover(true);
    try {
      const response = await userService.uploadCoverPhoto(file);

      if (response?.coverPhoto) {
        dispatch(updateUser({ coverPhoto: response.coverPhoto }));
        setProfileData((prev: any) => ({
          ...prev,
          coverPhoto: response.coverPhoto
        }));
        setEditData((prev: any) => ({
          ...prev,
          coverPhoto: response.coverPhoto
        }));
      }

      dispatch(showToast({ type: 'success', message: response?.message || 'Cover photo updated successfully!' }));
    } catch (err: any) {
      console.error('Failed to upload cover photo:', err);
      dispatch(showToast({ type: 'error', message: err.response?.data?.message || 'Failed to upload cover photo. Please try again.' }));
    } finally {
      setUploadingCover(false);
    }
  };

  const handlePhotoRemove = async () => {
    setRemovingPhoto(true);
    try {
      const response = await userService.removePhoto();
      dispatch(updateUser({ profilePic: response?.profilePic || null, photos: response?.photos || [] }));
      setProfileData((prev: any) => prev ? {
        ...prev,
        profilePic: response?.profilePic || null,
        photos: (response?.photos || []).map((photo: any, index: number) => ({
          id: index + 1,
          url: photo.url,
          isMain: photo.isMain,
        })),
      } : prev);
      setEditData((prev: any) => ({
        ...prev,
        profilePic: response?.profilePic || null,
      }));
      dispatch(showToast({ type: 'success', message: response?.message || 'Profile photo removed successfully!' }));
    } catch (err: any) {
      console.error('Failed to remove profile photo:', err);
      dispatch(showToast({ type: 'error', message: err.response?.data?.message || 'Failed to remove profile photo. Please try again.' }));
    } finally {
      setRemovingPhoto(false);
    }
  };

  const handleCoverPhotoRemove = async () => {
    setRemovingCover(true);
    try {
      const response = await userService.removeCoverPhoto();
      dispatch(updateUser({ coverPhoto: null }));
      setProfileData((prev: any) => prev ? {
        ...prev,
        coverPhoto: null,
      } : prev);
      setEditData((prev: any) => ({
        ...prev,
        coverPhoto: null,
      }));
      dispatch(showToast({ type: 'success', message: response?.message || 'Cover photo removed successfully!' }));
    } catch (err: any) {
      console.error('Failed to remove cover photo:', err);
      dispatch(showToast({ type: 'error', message: err.response?.data?.message || 'Failed to remove cover photo. Please try again.' }));
    } finally {
      setRemovingCover(false);
    }
  };

  const handleSaveProfile = async () => {
    try {
      const response = await userService.updateProfile(buildProfileUpdatePayload(editData));
      const normalized = normalizeProfileData(response);
      setProfileData(normalized);
      setEditData(normalized);
      setEditing(false);
      dispatch(updateUser(normalized));
      dispatch(showToast({ type: 'success', message: 'Profile updated successfully!' }));
    } catch (err) {
      console.error('Failed to update profile:', err);
      dispatch(showToast({ type: 'error', message: 'Failed to update profile. Please try again.' }));
    }
  };

  const handleCancelEdit = () => {
    setEditData(normalizeProfileData(profileData));
    setEditing(false);
  };

  const handleGalleryFileSelect = (file?: File | null) => {
    if (!file) return;
    setGallerySelectedFile(file);
    setGalleryCroppedImage(null);
    setGalleryCropperOpen(true);
  };

  const handleGalleryCropComplete = (croppedImage: string) => {
    setGalleryCroppedImage(croppedImage);
    setGalleryCropperOpen(false);
  };

  const handleGalleryUpload = async () => {
    if (!galleryCroppedImage) return;

    try {
      setUploadingGalleryPhoto(true);
      const response = await fetch(galleryCroppedImage);
      const blob = await response.blob();
      const file = new File([blob], `gallery-${Date.now()}.jpg`, { type: 'image/jpeg' });
      const formData = new FormData();
      formData.append('photo', file);

      const uploadResponse = await userService.uploadGalleryPhoto(formData);
      const normalized = normalizeProfileData(uploadResponse);
      setProfileData(normalized);
      setEditData(normalized);
      dispatch(updateUser(normalized));
      dispatch(showToast({ type: 'success', message: uploadResponse?.message || 'Photo uploaded successfully.' }));
      setGallerySelectedFile(null);
      setGalleryCroppedImage(null);
      setGalleryCropperOpen(false);
    } catch (error: any) {
      dispatch(showToast({ type: 'error', message: error.response?.data?.message || 'Failed to upload gallery photo.' }));
    } finally {
      setUploadingGalleryPhoto(false);
    }
  };

  const handleGalleryPhotoRemove = async (photoId: number) => {
    try {
      setRemovingGalleryPhotoId(photoId);
      const response = await userService.removeGalleryPhoto(photoId);
      const normalized = normalizeProfileData(response);
      setProfileData(normalized);
      setEditData(normalized);
      dispatch(updateUser(normalized));
      dispatch(showToast({ type: 'success', message: response?.message || 'Photo removed successfully.' }));
    } catch (error: any) {
      dispatch(showToast({ type: 'error', message: error.response?.data?.message || 'Failed to remove photo.' }));
    } finally {
      setRemovingGalleryPhotoId(null);
    }
  };

  if (loading || !profileData) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Skeleton variant="rectangular" height={300} sx={{ borderRadius: 8, mb: 4 }} />
        <Skeleton variant="text" width="60%" height={60} sx={{ mb: 2 }} />
        <Skeleton variant="text" width="40%" height={40} sx={{ mb: 4 }} />
        <Grid container spacing={4}>
          <Grid size={{ xs: 12, md: 8 }}>
            <Skeleton variant="rectangular" height={400} sx={{ borderRadius: 6 }} />
          </Grid>
          <Grid size={{ xs: 12, md: 4 }}>
            <Skeleton variant="rectangular" height={400} sx={{ borderRadius: 6 }} />
          </Grid>
        </Grid>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4, pb: 10 }}>
      {/* Hero Section */}
      <MotionPaper
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        sx={{ 
          position: 'relative', 
          borderRadius: '32px', 
          overflow: 'hidden',
          boxShadow: '0 8px 32px rgba(139,26,46,0.1)',
          mb: 4,
          bgcolor: COLORS.white
        }}
      >
        {/* Cover Photo */}
        <Box 
          sx={{ 
            height: { xs: 180, md: 280 }, 
            background: profileData.coverPhoto 
              ? `url(${profileData.coverPhoto}) center/cover no-repeat`
              : `linear-gradient(135deg, ${COLORS.primary} 0%, ${COLORS.secondary} 100%)`,
            position: 'relative',
            overflow: 'hidden'
          }}
        >
          <Box sx={{ position: 'absolute', inset: 0, opacity: 0.1, backgroundImage: 'radial-gradient(circle, #fff 1px, transparent 1px)', backgroundSize: '20px 20px' }} />
          <CoverPhotoUpload 
            currentPhoto={profileData.coverPhoto}
            onUpload={handleCoverPhotoUpload}
            onRemove={handleCoverPhotoRemove}
            isUploading={uploadingCover}
            isRemoving={removingCover}
          />
        </Box>

        {/* Profile Info Area */}
        <Box sx={{ px: { xs: 3, md: 6 }, pb: 4, pt: { xs: 8, md: 2 }, position: 'relative' }}>
          {/* Profile Photo - Offset */}
          <Box sx={{ position: 'absolute', top: { xs: -60, md: -80 }, left: { xs: '50%', md: 48 }, transform: { xs: 'translateX(-50%)', md: 'none' } }}>
            <ProfilePhotoUpload 
              currentPhoto={profileData.profilePic || profileData.photos.find((p: any) => p.isMain)?.url} 
              onUpload={handlePhotoUpload}
              onRemove={handlePhotoRemove}
              isUploading={uploadingPhoto}
              isRemoving={removingPhoto}
            />
          </Box>

          <Box sx={{ ml: { xs: 0, md: 24 }, mt: { xs: 2, md: 0 }, textAlign: { xs: 'center', md: 'left' } }}>
            <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, justifyContent: 'space-between', alignItems: { xs: 'center', md: 'flex-start' }, gap: 2, minHeight: { md: 96 } }}>
              <Box sx={{ flex: 1, minWidth: 0, width: '100%' }}>
                <Typography
                  variant="h3"
                  sx={{
                    fontFamily: 'Playfair Display',
                    fontWeight: 900,
                    color: COLORS.primary,
                    whiteSpace: { xs: 'normal', md: 'nowrap' },
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}
                >
                  {getProfileHeroTitle(profileData)}
                </Typography>
                <Typography variant="body1" sx={{ color: COLORS.textSecondary, mb: 1, display: 'flex', alignItems: 'center', justifyContent: { xs: 'center', md: 'flex-start' }, gap: 0.5 }}>
                  <MapPin size={16} /> {profileData.location} 📍
                </Typography>
                <Typography variant="subtitle1" sx={{ fontStyle: 'italic', color: COLORS.textSecondary, fontWeight: 500 }}>
                  "{profileData.tagline}"
                </Typography>
              </Box>
              
              <Box sx={{ width: { xs: '100%', md: 320 }, flexShrink: 0 }}>
                <Box sx={{ textAlign: 'right', minHeight: 42, display: { xs: 'none', md: 'block' } }}>
                  <Typography variant="caption" sx={{ fontWeight: 800, color: COLORS.accent, display: 'flex', alignItems: 'center', gap: 0.5, justifyContent: 'flex-end' }}>
                    <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: '#4CAF50' }} /> {profileData.status}
                  </Typography>
                  <Box sx={{ mt: 1, display: 'flex', alignItems: 'center', gap: 1, justifyContent: 'flex-end' }}>
                    <Typography variant="caption" sx={{ fontWeight: 700 }}>Profile Strength</Typography>
                    <Chip 
                      label={`${profileData.completion}% Complete`} 
                      size="small" 
                      sx={{ bgcolor: alpha(COLORS.primary, 0.1), color: COLORS.primary, fontWeight: 800, fontSize: '0.65rem' }} 
                    />
                  </Box>
                </Box>
                <Stack
                  direction="row"
                  spacing={2}
                  alignItems="center"
                  justifyContent={{ xs: 'center', md: 'flex-end' }}
                  sx={{ width: '100%', minHeight: 56, mt: { xs: 0, md: 2 }, flexWrap: 'nowrap' }}
                >
                {editing ? (
                  <>
                    <Button 
                      variant="outlined" 
                      onClick={handleCancelEdit}
                      sx={{ borderRadius: '12px', fontWeight: 700, whiteSpace: 'nowrap', minWidth: 96 }}
                    >
                      Cancel
                    </Button>
                    <Button 
                      variant="contained" 
                      onClick={handleSaveProfile}
                      sx={{ 
                        bgcolor: COLORS.primary, 
                        borderRadius: '12px', 
                        px: 4, 
                        py: 1.5,
                        minWidth: 150,
                        whiteSpace: 'nowrap',
                        fontWeight: 800,
                        boxShadow: '0 4px 12px rgba(139,26,46,0.2)',
                        '&:hover': { bgcolor: '#6B1424' }
                      }}
                    >
                      Save Changes
                    </Button>
                  </>
                ) : (
                  <Button 
                    variant="contained" 
                    onClick={() => setEditing(true)}
                    startIcon={<Edit3 size={18} />}
                    sx={{ 
                      bgcolor: COLORS.primary, 
                      borderRadius: '12px', 
                      px: 4, 
                      py: 1.5,
                      minWidth: 150,
                      whiteSpace: 'nowrap',
                      fontWeight: 800,
                      boxShadow: '0 4px 12px rgba(139,26,46,0.2)',
                      '&:hover': { bgcolor: '#6B1424' }
                    }}
                  >
                    Edit Profile
                  </Button>
                )}
                </Stack>
              </Box>
            </Box>
          </Box>
        </Box>

        {/* Tabs Navigation */}
        <Box sx={{ borderTop: '1px solid #F0F0F0', px: { xs: 1, md: 6 } }}>
          <Tabs 
            value={tabValue} 
            onChange={handleTabChange} 
            variant="scrollable"
            scrollButtons="auto"
            sx={{
              '& .MuiTabs-indicator': { bgcolor: COLORS.primary, height: 3 },
              '& .MuiTab-root': { 
                fontWeight: 800, 
                textTransform: 'none', 
                fontSize: '0.95rem',
                minWidth: 100,
                color: COLORS.textSecondary,
                py: 3,
                '&.Mui-selected': { color: COLORS.primary }
              }
            }}
          >
            <Tab label="About" />
            <Tab label="Astrology" />
            <Tab label="Lifestyle" />
            <Tab label="Photos" />
            <Tab label="Privacy" />
          </Tabs>
        </Box>
      </MotionPaper>

      {/* Tab Panels */}
      <AnimatePresence mode="wait">
        <MotionBox
          key={tabValue}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.2 }}
        >
          <CustomTabPanel value={tabValue} index={0}>
            <Grid container spacing={4}>
              <Grid size={{ xs: 12, md: 7 }}>
                <Stack spacing={4}>
                  <Paper sx={{ p: 4, borderRadius: '24px', boxShadow: '0 2px 16px rgba(0,0,0,0.03)' }}>
                    <Typography variant="h6" sx={{ mb: 3, fontWeight: 800, color: COLORS.primary }}>About Me</Typography>
                    {editing ? (
                      <>
                        <Grid container spacing={2} sx={{ mb: 2 }}>
                          <Grid size={{ xs: 12, sm: 6 }}>
                            <TextField
                              fullWidth
                              label="First Name"
                              value={editData.personalInfo?.firstName || ''}
                              onChange={(e) => setEditData({
                                ...editData,
                                personalInfo: {
                                  ...editData.personalInfo,
                                  firstName: e.target.value,
                                },
                              })}
                            />
                          </Grid>
                          <Grid size={{ xs: 12, sm: 6 }}>
                            <TextField
                              fullWidth
                              label="Last Name"
                              value={editData.personalInfo?.lastName || ''}
                              onChange={(e) => setEditData({
                                ...editData,
                                personalInfo: {
                                  ...editData.personalInfo,
                                  lastName: e.target.value,
                                },
                              })}
                            />
                          </Grid>
                        </Grid>
                        <TextField
                          fullWidth
                          label="Tagline"
                          value={editData.tagline || ''}
                          onChange={(e) => setEditData({ ...editData, tagline: e.target.value })}
                          placeholder="A short line that describes you"
                          sx={{ mb: 2 }}
                        />
                        <TextField
                          fullWidth
                          multiline
                          rows={4}
                          value={editData.bio || ''}
                          onChange={(e) => setEditData({ ...editData, bio: e.target.value })}
                          placeholder="Tell us about yourself..."
                          sx={{ mb: 3 }}
                        />
                      </>
                    ) : (
                      <Typography variant="body1" sx={{ color: COLORS.textSecondary, lineHeight: 1.8, mb: 3 }}>
                        {profileData.bio}
                      </Typography>
                    )}
                    
                    <Divider sx={{ my: 4 }} />
                    
                    <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 800, color: COLORS.textPrimary, display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Languages size={18} /> Languages Spoken
                    </Typography>
                    {editing ? (
                      <TextField
                        fullWidth
                        value={editData.personalInfo?.languages?.join(', ') || ''}
                        onChange={(e) => setEditData({
                          ...editData,
                          personalInfo: {
                            ...editData.personalInfo,
                            languages: e.target.value.split(',').map((l: string) => l.trim())
                          }
                        })}
                        placeholder="e.g., Sinhala, English, Tamil"
                        sx={{ mb: 2 }}
                      />
                    ) : (
                      profileData.personalInfo.languages.length > 0 ? (
                        <Stack direction="row" spacing={1}>
                          {profileData.personalInfo.languages.map((lang: string) => (
                            <Chip key={lang} label={lang} sx={{ bgcolor: COLORS.cream, fontWeight: 700, color: COLORS.primary }} />
                          ))}
                        </Stack>
                      ) : (
                        <Typography variant="body2" sx={{ color: COLORS.textSecondary }}>
                          Not provided
                        </Typography>
                      )
                    )}
                  </Paper>

                  <Paper sx={{ p: 4, borderRadius: '24px', boxShadow: '0 2px 16px rgba(0,0,0,0.03)' }}>
                    <Typography variant="h6" sx={{ mb: 3, fontWeight: 800, color: COLORS.primary }}>Personal Information</Typography>
                    <Grid container spacing={3}>
                      {[
                        { label: 'Age', value: profileData.age, key: 'age', icon: <Calendar size={18} /> },
                        { label: 'Height', value: profileData.personalInfo.height, key: 'personalInfo.height', icon: <Activity size={18} /> },
                        { label: 'Education', value: profileData.personalInfo.education, key: 'personalInfo.education', icon: <GraduationCap size={18} /> },
                        { label: 'Occupation', value: profileData.personalInfo.occupation, key: 'personalInfo.occupation', icon: <Briefcase size={18} /> },
                        { label: 'Religion', value: profileData.personalInfo.religion, key: 'personalInfo.religion', icon: <Heart size={18} /> },
                        { label: 'Ethnicity', value: profileData.personalInfo.ethnicity, key: 'personalInfo.ethnicity', icon: <Users size={18} /> },
                      ].map((item, i) => (
                        <Grid size={{ xs: 12, sm: 6 }} key={i}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, p: 2, bgcolor: alpha(COLORS.cream, 0.5), borderRadius: '16px' }}>
                            <Box sx={{ color: COLORS.primary }}>{item.icon}</Box>
                            <Box sx={{ flex: 1 }}>
                              <Typography variant="caption" sx={{ color: COLORS.textSecondary, fontWeight: 700, textTransform: 'uppercase' }}>{item.label}</Typography>
                              {editing ? (
                                item.key === 'age' ? (
                                  <TextField
                                    fullWidth
                                    size="small"
                                    select
                                    value={editData.age || ''}
                                    onChange={(e) => setEditData({ ...editData, age: e.target.value ? Number(e.target.value) : '' })}
                                    sx={{ mt: 0.5 }}
                                  >
                                    <MenuItem value="">Select age</MenuItem>
                                    {AGE_OPTIONS.map((age) => (
                                      <MenuItem key={age} value={age}>{age}</MenuItem>
                                    ))}
                                  </TextField>
                                ) : item.key === 'personalInfo.height' ? (
                                  <TextField
                                    fullWidth
                                    size="small"
                                    type="number"
                                    value={editData.personalInfo?.height || ''}
                                    onChange={(e) => setEditData({
                                      ...editData,
                                      personalInfo: {
                                        ...editData.personalInfo,
                                        height: e.target.value,
                                      },
                                    })}
                                    inputProps={{ min: HEIGHT_MIN_CM, max: HEIGHT_MAX_CM, step: 1 }}
                                    InputProps={{ endAdornment: <InputAdornment position="end">cm</InputAdornment> }}
                                    sx={{ mt: 0.5 }}
                                  />
                                ) : item.key === 'personalInfo.education' ? (
                                  <TextField
                                    fullWidth
                                    size="small"
                                    select
                                    value={editData.personalInfo?.education || ''}
                                    onChange={(e) => setEditData({
                                      ...editData,
                                      personalInfo: {
                                        ...editData.personalInfo,
                                        education: e.target.value,
                                      },
                                    })}
                                    sx={{ mt: 0.5 }}
                                  >
                                    <MenuItem value="">Select education</MenuItem>
                                    {EDUCATION_OPTIONS.map((option) => (
                                      <MenuItem key={option} value={option}>{option}</MenuItem>
                                    ))}
                                  </TextField>
                                ) : item.key === 'personalInfo.occupation' ? (
                                  <TextField
                                    fullWidth
                                    size="small"
                                    multiline
                                    minRows={2}
                                    value={editData.personalInfo?.occupation || ''}
                                    onChange={(e) => setEditData({
                                      ...editData,
                                      personalInfo: {
                                        ...editData.personalInfo,
                                        occupation: e.target.value,
                                      },
                                    })}
                                    sx={{ mt: 0.5 }}
                                  />
                                ) : item.key === 'personalInfo.religion' ? (
                                  <TextField
                                    fullWidth
                                    size="small"
                                    value={profileData.personalInfo?.religion || ''}
                                    disabled
                                    helperText="Uses your registration value"
                                    sx={{ mt: 0.5 }}
                                  />
                                ) : (
                                  <TextField
                                    fullWidth
                                    size="small"
                                    value={profileData.personalInfo?.ethnicity || ''}
                                    disabled
                                    helperText="Uses your registration value"
                                    sx={{ mt: 0.5 }}
                                  />
                                )
                              ) : (
                                <Typography variant="body2" sx={{ fontWeight: 800, color: COLORS.textPrimary }}>{formatProfileValue(item.value)}</Typography>
                              )}
                            </Box>
                          </Box>
                        </Grid>
                      ))}
                    </Grid>
                  </Paper>
                </Stack>
              </Grid>

              <Grid size={{ xs: 12, md: 5 }}>
                <Paper sx={{ p: 4, borderRadius: '24px', boxShadow: '0 2px 16px rgba(0,0,0,0.03)', height: '100%' }}>
                  <Typography variant="h6" sx={{ mb: 1, fontWeight: 800, color: COLORS.primary }}>Personality Traits</Typography>
                  <Typography variant="caption" sx={{ color: COLORS.textSecondary, mb: 4, display: 'block' }}>Based on your Big Five personality quiz results</Typography>
                  
                  <Box sx={{ height: 300, width: '100%', mt: 2 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <RadarChart cx="50%" cy="50%" outerRadius="80%" data={profileData.personality}>
                        <PolarGrid stroke={alpha(COLORS.primary, 0.1)} />
                        <PolarAngleAxis dataKey="subject" tick={{ fill: COLORS.textSecondary, fontSize: 10, fontWeight: 700 }} />
                        <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                        <Radar
                          name="Personality"
                          dataKey="A"
                          stroke={COLORS.primary}
                          fill={COLORS.primary}
                          fillOpacity={0.4}
                        />
                      </RadarChart>
                    </ResponsiveContainer>
                  </Box>

                  <Stack spacing={2} sx={{ mt: 4 }}>
                    {profileData.personality.map((trait: any) => (
                      <Box key={trait.subject} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Typography variant="body2" sx={{ fontWeight: 700, color: COLORS.textSecondary }}>{trait.subject}</Typography>
                        <Typography variant="body2" sx={{ fontWeight: 800, color: COLORS.primary }}>{(trait.A / 20).toFixed(1)}/5.0</Typography>
                      </Box>
                    ))}
                  </Stack>
                </Paper>
              </Grid>
            </Grid>
          </CustomTabPanel>

          <CustomTabPanel value={tabValue} index={1}>
            <Grid container spacing={4}>
              <Grid size={{ xs: 12, md: 6 }}>
                <Paper sx={{ p: 4, borderRadius: '24px', boxShadow: '0 2px 16px rgba(0,0,0,0.03)' }}>
                  <Typography variant="h6" sx={{ mb: 3, fontWeight: 800, color: COLORS.primary }}>Birth Details</Typography>
                  <Stack spacing={3}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <Calendar size={20} color={COLORS.secondary} />
                      <Box>
                        <Typography variant="caption" sx={{ color: COLORS.textSecondary, fontWeight: 700 }}>Date of Birth</Typography>
                        {editing ? (
                          <TextField
                            type="date"
                            size="small"
                            value={editData.birthDate || ''}
                            onChange={(e) => setEditData({ ...editData, birthDate: e.target.value })}
                            InputLabelProps={{ shrink: true }}
                            sx={{ mt: 0.5 }}
                          />
                        ) : (
                          <Typography variant="body1" sx={{ fontWeight: 800 }}>{profileData.astrology.birthDate}</Typography>
                        )}
                      </Box>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <Clock size={20} color={COLORS.secondary} />
                      <Box>
                        <Typography variant="caption" sx={{ color: COLORS.textSecondary, fontWeight: 700 }}>Time of Birth</Typography>
                        {editing ? (
                          <TextField
                            type="time"
                            size="small"
                            value={editData.birthTime || ''}
                            onChange={(e) => setEditData({ ...editData, birthTime: e.target.value })}
                            InputLabelProps={{ shrink: true }}
                            sx={{ mt: 0.5 }}
                          />
                        ) : (
                          <Typography variant="body1" sx={{ fontWeight: 800 }}>{profileData.astrology.birthTime}</Typography>
                        )}
                      </Box>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <MapPin size={20} color={COLORS.secondary} />
                      <Box>
                        <Typography variant="caption" sx={{ color: COLORS.textSecondary, fontWeight: 700 }}>Place of Birth</Typography>
                        {editing ? (
                          <TextField
                            size="small"
                            value={editData.birthPlace || ''}
                            onChange={(e) => setEditData({ ...editData, birthPlace: e.target.value })}
                            sx={{ mt: 0.5 }}
                          />
                        ) : (
                          <Typography variant="body1" sx={{ fontWeight: 800 }}>{profileData.astrology.birthPlace}</Typography>
                        )}
                      </Box>
                    </Box>
                  </Stack>

                  <Divider sx={{ my: 4 }} />

                  <Typography variant="h6" sx={{ mb: 3, fontWeight: 800, color: COLORS.primary }}>Key Astrological Details</Typography>
                  <Grid container spacing={2}>
                    {[
                      { label: 'Rashi (Moon Sign)', value: profileData.astrology.rashi },
                      { label: 'Nakshatra', value: profileData.astrology.nakshatra },
                      { label: 'Ascendant', value: profileData.astrology.ascendant },
                      { label: 'Sun Sign', value: profileData.astrology.sunSign },
                    ].map((item, i) => (
                      <Grid size={{ xs: 6 }} key={i}>
                        <Box sx={{ p: 2, bgcolor: alpha(COLORS.secondary, 0.05), borderRadius: '16px', border: `1px solid ${alpha(COLORS.secondary, 0.1)}` }}>
                          <Typography variant="caption" sx={{ color: COLORS.textSecondary, fontWeight: 700, display: 'block', mb: 0.5 }}>{item.label}</Typography>
                          <Typography variant="subtitle1" sx={{ fontWeight: 900, color: COLORS.primary, fontFamily: 'Playfair Display' }}>{item.value}</Typography>
                        </Box>
                      </Grid>
                    ))}
                  </Grid>
                </Paper>
              </Grid>

              <Grid size={{ xs: 12, md: 6 }}>
                <Paper sx={{ p: 4, borderRadius: '24px', boxShadow: '0 2px 16px rgba(0,0,0,0.03)', textAlign: 'center' }}>
                  <Typography variant="h6" sx={{ mb: 4, fontWeight: 800, color: COLORS.primary }}>Birth Chart Wheel</Typography>
                  <Box sx={{ position: 'relative', width: '100%', maxWidth: 300, mx: 'auto', mb: 4 }}>
                    {/* Placeholder for SVG Birth Chart */}
                    <Box 
                      component="svg" 
                      viewBox="0 0 100 100" 
                      sx={{ width: '100%', height: 'auto', filter: 'drop-shadow(0 4px 12px rgba(139,26,46,0.1))' }}
                    >
                      <circle cx="50" cy="50" r="48" fill="none" stroke={COLORS.primary} strokeWidth="0.5" />
                      <circle cx="50" cy="50" r="35" fill="none" stroke={COLORS.secondary} strokeWidth="0.3" strokeDasharray="1 1" />
                      {[...Array(12)].map((_, i) => {
                        const angle = i * 30;
                        const x1 = 50 + 35 * Math.cos((angle * Math.PI) / 180);
                        const y1 = 50 + 35 * Math.sin((angle * Math.PI) / 180);
                        const x2 = 50 + 48 * Math.cos((angle * Math.PI) / 180);
                        const y2 = 50 + 48 * Math.sin((angle * Math.PI) / 180);
                        return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke={COLORS.primary} strokeWidth="0.2" />;
                      })}
                      <text x="50" y="50" textAnchor="middle" dy=".3em" fontSize="5" fontWeight="bold" fill={COLORS.primary}>KUNDLI</text>
                    </Box>
                  </Box>

                  <Stack spacing={3} sx={{ textAlign: 'left' }}>
                    <Box>
                      <Typography variant="subtitle2" sx={{ fontWeight: 800, mb: 1.5, color: COLORS.textPrimary }}>Lucky Colors</Typography>
                      {profileData.astrology.luckyColors.length > 0 ? (
                        <Stack direction="row" spacing={1}>
                          {profileData.astrology.luckyColors.map((color: string) => (
                            <Box key={color} sx={{ width: 32, height: 32, borderRadius: '50%', bgcolor: color, border: '2px solid white', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }} />
                          ))}
                        </Stack>
                      ) : (
                        <Typography variant="body2" sx={{ color: COLORS.textSecondary }}>No personalized color guidance available yet.</Typography>
                      )}
                    </Box>
                    <Box>
                      <Typography variant="subtitle2" sx={{ fontWeight: 800, mb: 1.5, color: COLORS.textPrimary }}>Auspicious Days</Typography>
                      {profileData.astrology.auspiciousDays.length > 0 ? (
                        <Stack direction="row" spacing={1}>
                          {profileData.astrology.auspiciousDays.map((day: string) => (
                            <Chip key={day} label={day} size="small" sx={{ bgcolor: COLORS.accent, color: 'white', fontWeight: 700 }} />
                          ))}
                        </Stack>
                      ) : (
                        <Typography variant="body2" sx={{ color: COLORS.textSecondary }}>No auspicious day data available yet.</Typography>
                      )}
                    </Box>
                    <Box>
                      <Typography variant="subtitle2" sx={{ fontWeight: 800, mb: 1.5, color: COLORS.textPrimary }}>Favorable Partners</Typography>
                      <Typography variant="body2" sx={{ color: COLORS.textSecondary, fontWeight: 600 }}>
                        {profileData.astrology.favorablePartners.length > 0
                          ? <>Compatible with <span style={{ color: COLORS.primary, fontWeight: 800 }}>{profileData.astrology.favorablePartners.join(', ')}</span></>
                          : 'No partner guidance available yet.'}
                      </Typography>
                    </Box>
                  </Stack>
                </Paper>
              </Grid>
            </Grid>
          </CustomTabPanel>

          <CustomTabPanel value={tabValue} index={2}>
            <Grid container spacing={4}>
              <Grid size={{ xs: 12, md: 6 }}>
                <Paper sx={{ p: 4, borderRadius: '24px', boxShadow: '0 2px 16px rgba(0,0,0,0.03)' }}>
                  <Typography variant="h6" sx={{ mb: 3, fontWeight: 800, color: COLORS.primary }}>Hobbies & Interests</Typography>
                  {editing ? (
                    <TextField
                      fullWidth
                      multiline
                      rows={2}
                      value={editData.lifestyle?.hobbies?.join(', ') || ''}
                      onChange={(e) => setEditData({
                        ...editData,
                        lifestyle: {
                          ...editData.lifestyle,
                          hobbies: e.target.value.split(',').map((h: string) => h.trim()).filter(Boolean)
                        }
                      })}
                      placeholder="e.g., Music, Cooking, Travel, Reading"
                      sx={{ mb: 3 }}
                    />
                  ) : (
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.5, mb: 3 }}>
                      {profileData.lifestyle.hobbies.length > 0 ? profileData.lifestyle.hobbies.map((hobby: string) => (
                        <Chip 
                          key={hobby} 
                          label={hobby} 
                          sx={{ 
                            px: 1, 
                            py: 2.5, 
                            borderRadius: '12px', 
                            bgcolor: COLORS.cream, 
                            fontWeight: 700, 
                            color: COLORS.primary,
                            border: `1px solid ${alpha(COLORS.primary, 0.1)}`
                          }} 
                        />
                      )) : (
                        <Typography variant="body2" sx={{ color: COLORS.textSecondary }}>
                          No hobbies added yet.
                        </Typography>
                      )}
                    </Box>
                  )}

                  <Divider sx={{ my: 4 }} />

                  <Typography variant="h6" sx={{ mb: 3, fontWeight: 800, color: COLORS.primary }}>Daily Habits</Typography>
                  <Grid container spacing={2}>
                    {[
                      { label: 'Exercise', value: profileData.lifestyle.exercise, key: 'exercise', icon: <Activity size={18} /> },
                      { label: 'Diet', value: profileData.lifestyle.diet, key: 'diet', icon: <Coffee size={18} /> },
                      { label: 'Smoking', value: profileData.lifestyle.smoking, key: 'smoking', icon: <X size={18} /> },
                      { label: 'Drinking', value: profileData.lifestyle.drinking, key: 'drinking', icon: <X size={18} /> },
                    ].map((item, i) => (
                      <Grid size={{ xs: 6 }} key={i}>
                        <Box sx={{ p: 2, bgcolor: alpha(COLORS.accent, 0.05), borderRadius: '16px' }}>
                          <Typography variant="caption" sx={{ color: COLORS.textSecondary, fontWeight: 700, display: 'block', mb: 0.5 }}>{item.label}</Typography>
                          {editing ? (
                            <TextField
                              fullWidth
                              size="small"
                              select
                              value={editData.lifestyle?.[item.key] || ''}
                              onChange={(e) => setEditData({
                                ...editData,
                                lifestyle: {
                                  ...editData.lifestyle,
                                  [item.key]: e.target.value,
                                },
                              })}
                              sx={{ mt: 0.5 }}
                            >
                              <MenuItem value="">Select</MenuItem>
                              {(item.key === 'exercise'
                                ? EXERCISE_OPTIONS
                                : item.key === 'diet'
                                  ? DIET_OPTIONS
                                  : item.key === 'smoking'
                                    ? SMOKING_OPTIONS
                                    : DRINKING_OPTIONS
                              ).map((option) => (
                                <MenuItem key={option} value={option}>{option}</MenuItem>
                              ))}
                            </TextField>
                          ) : (
                            <Typography variant="body2" sx={{ fontWeight: 800, color: COLORS.accent }}>{item.value}</Typography>
                          )}
                        </Box>
                      </Grid>
                    ))}
                  </Grid>
                </Paper>
              </Grid>

              <Grid size={{ xs: 12, md: 6 }}>
                <Stack spacing={4}>
                  <Paper sx={{ p: 4, borderRadius: '24px', boxShadow: '0 2px 16px rgba(0,0,0,0.03)' }}>
                    <Typography variant="h6" sx={{ mb: 3, fontWeight: 800, color: COLORS.primary }}>Future & Family</Typography>
                    <Stack spacing={3}>
                      <Box>
                        <Typography variant="caption" sx={{ color: COLORS.textSecondary, fontWeight: 700, display: 'block', mb: 0.5 }}>Career Ambitions</Typography>
                        {editing ? (
                          <TextField
                            fullWidth
                            value={editData.lifestyle?.careerAmbitions || ''}
                            onChange={(e) => setEditData({
                              ...editData,
                              lifestyle: {
                                ...editData.lifestyle,
                                careerAmbitions: e.target.value
                              }
                            })}
                          />
                        ) : (
                          <Typography variant="body1" sx={{ fontWeight: 800 }}>{profileData.lifestyle.careerAmbitions}</Typography>
                        )}
                      </Box>
                      <Box>
                        <Typography variant="caption" sx={{ color: COLORS.textSecondary, fontWeight: 700, display: 'block', mb: 0.5 }}>Family Plans</Typography>
                        {editing ? (
                          <TextField
                            fullWidth
                            value={editData.lifestyle?.familyPlans || ''}
                            onChange={(e) => setEditData({
                              ...editData,
                              lifestyle: {
                                ...editData.lifestyle,
                                familyPlans: e.target.value
                              }
                            })}
                          />
                        ) : (
                          <Typography variant="body1" sx={{ fontWeight: 800 }}>{profileData.lifestyle.familyPlans}</Typography>
                        )}
                      </Box>
                    </Stack>
                  </Paper>

                  <Paper sx={{ p: 4, borderRadius: '24px', boxShadow: '0 2px 16px rgba(0,0,0,0.03)' }}>
                    <Typography variant="h6" sx={{ mb: 3, fontWeight: 800, color: COLORS.primary }}>Social Preferences</Typography>
                    <Box sx={{ px: 2, pt: 2 }}>
                      <Slider
                        disabled={!editing}
                        value={editing ? (editData.lifestyle?.socialPreference ?? 50) : profileData.lifestyle.socialPreference}
                        onChange={(_, value) => {
                          const nextValue = Array.isArray(value) ? value[0] : value;
                          if (!editing) return;
                          setEditData({
                            ...editData,
                            lifestyle: {
                              ...editData.lifestyle,
                              socialPreference: nextValue,
                            },
                          });
                        }}
                        sx={{ color: COLORS.secondary }}
                      />
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1 }}>
                        <Typography variant="caption" sx={{ fontWeight: 700, color: COLORS.textSecondary }}>Introvert</Typography>
                        <Typography variant="caption" sx={{ fontWeight: 700, color: COLORS.textSecondary }}>Extrovert</Typography>
                      </Box>
                      <Typography variant="body2" sx={{ mt: 2, textAlign: 'center', fontWeight: 800, color: COLORS.secondary }}>
                        {(editing ? (editData.lifestyle?.socialPreference ?? 50) : profileData.lifestyle.socialPreference) > 50
                          ? 'Leans towards Extrovert'
                          : 'Leans towards Introvert'}
                      </Typography>
                    </Box>
                  </Paper>
                </Stack>
              </Grid>
            </Grid>
          </CustomTabPanel>

          <CustomTabPanel value={tabValue} index={3}>
            <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="h6" sx={{ fontWeight: 800, color: COLORS.primary }}>Photo Gallery</Typography>
              <Button 
                variant="outlined" 
                startIcon={<Plus size={18} />}
                onClick={() => galleryInputRef.current?.click()}
                disabled={uploadingGalleryPhoto}
                sx={{ borderRadius: '12px', color: COLORS.accent, borderColor: COLORS.accent, fontWeight: 700 }}
              >
                {uploadingGalleryPhoto ? 'Uploading...' : 'Upload New'}
              </Button>
              <input
                ref={galleryInputRef}
                type="file"
                accept="image/*"
                style={{ display: 'none' }}
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  handleGalleryFileSelect(file);
                  if (e.currentTarget) {
                    e.currentTarget.value = '';
                  }
                }}
              />
            </Box>
            <ImageCropper
              open={galleryCropperOpen && Boolean(gallerySelectedFile)}
              onClose={() => setGalleryCropperOpen(false)}
              imageSrc={galleryPreviewUrl}
              onCropComplete={handleGalleryCropComplete}
              cropShape="rect"
              aspectRatio={1}
              title="Crop Gallery Photo"
              uploading={uploadingGalleryPhoto}
              maxOutputWidth={1080}
              maxOutputHeight={1080}
              outputQuality={0.9}
            />
            {galleryCroppedImage && (
              <Box sx={{ mb: 3, p: 2, borderRadius: '12px', border: `1px solid ${alpha(COLORS.primary, 0.2)}`, bgcolor: alpha(COLORS.primary, 0.03), display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 2 }}>
                <Typography variant="body2" sx={{ color: COLORS.textSecondary }}>
                  Cropped image ready.
                </Typography>
                <Stack direction="row" spacing={1}>
                  <Button size="small" onClick={() => setGalleryCropperOpen(true)}>Adjust Crop</Button>
                  <Button size="small" variant="contained" onClick={handleGalleryUpload} disabled={uploadingGalleryPhoto} sx={{ bgcolor: COLORS.primary, '&:hover': { bgcolor: '#6B1424' } }}>
                    Save Photo
                  </Button>
                </Stack>
              </Box>
            )}
            <Grid container spacing={3}>
              {profileData.photos.map((photo: any) => (
                <Grid size={{ xs: 12, sm: 6, md: 4 }} key={photo.id}>
                  <MotionBox
                    whileHover={{ y: -8 }}
                    sx={{ 
                      position: 'relative', 
                      borderRadius: '24px', 
                      overflow: 'hidden', 
                      aspectRatio: '1/1',
                      boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
                      group: 'true'
                    }}
                  >
                    <img 
                      src={photo.url} 
                      alt="Gallery" 
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                      referrerPolicy="no-referrer"
                    />
                    
                    {photo.isMain && (
                      <Box sx={{ position: 'absolute', top: 12, left: 12, bgcolor: COLORS.secondary, color: 'white', px: 1.5, py: 0.5, borderRadius: '8px', display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <Star size={14} fill="white" />
                        <Typography variant="caption" sx={{ fontWeight: 800 }}>Main</Typography>
                      </Box>
                    )}

                    <Box 
                      className="photo-overlay"
                      sx={{ 
                        position: 'absolute', 
                        inset: 0, 
                        bgcolor: 'rgba(0,0,0,0.4)', 
                        opacity: 0, 
                        transition: 'opacity 0.3s ease',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 2,
                        '&:hover': { opacity: 1 }
                      }}
                    >
                      {!photo.isMain && (
                        <IconButton sx={{ bgcolor: 'white', color: COLORS.secondary, '&:hover': { bgcolor: COLORS.secondary, color: 'white' } }}>
                          <Star size={20} />
                        </IconButton>
                      )}
                      {photo.isMain ? (
                        <IconButton
                          onClick={handlePhotoRemove}
                          disabled={removingPhoto}
                          sx={{ bgcolor: 'white', color: 'error.main', '&:hover': { bgcolor: 'error.main', color: 'white' } }}
                        >
                          {removingPhoto ? <CircularProgress size={18} color="inherit" /> : <Trash2 size={20} />}
                        </IconButton>
                      ) : (
                        <IconButton
                          onClick={() => handleGalleryPhotoRemove(photo.id)}
                          disabled={removingGalleryPhotoId === photo.id}
                          sx={{ bgcolor: 'white', color: 'error.main', '&:hover': { bgcolor: 'error.main', color: 'white' } }}
                        >
                          {removingGalleryPhotoId === photo.id ? <CircularProgress size={18} color="inherit" /> : <Trash2 size={20} />}
                        </IconButton>
                      )}
                    </Box>
                  </MotionBox>
                </Grid>
              ))}
            </Grid>
          </CustomTabPanel>

          <CustomTabPanel value={tabValue} index={4}>
            <Grid container spacing={4}>
              <Grid size={{ xs: 12, md: 7 }}>
                <Paper sx={{ p: 4, borderRadius: '24px', boxShadow: '0 2px 16px rgba(0,0,0,0.03)' }}>
                  <Typography variant="h6" sx={{ mb: 4, fontWeight: 800, color: COLORS.primary }}>Privacy Controls</Typography>
                  <Stack spacing={3}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Box>
                        <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>Show my last seen</Typography>
                        <Typography variant="body2" sx={{ color: COLORS.textSecondary }}>Allow others to see when you were last active</Typography>
                      </Box>
                      <Switch 
                        checked={editing ? editData.privacy?.showLastSeen || false : profileData.privacy.showLastSeen} 
                        onChange={(e) => editing && setEditData({
                          ...editData,
                          privacy: { ...editData.privacy, showLastSeen: e.target.checked }
                        })}
                        disabled={!editing}
                        color="primary" 
                      />
                    </Box>
                    <Divider />
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Box>
                        <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>Show my horoscope to matches</Typography>
                        <Typography variant="body2" sx={{ color: COLORS.textSecondary }}>Matches can view your detailed birth chart</Typography>
                      </Box>
                      <Switch 
                        checked={editing ? editData.privacy?.showHoroscope || false : profileData.privacy.showHoroscope} 
                        onChange={(e) => editing && setEditData({
                          ...editData,
                          privacy: { ...editData.privacy, showHoroscope: e.target.checked }
                        })}
                        disabled={!editing}
                        color="primary" 
                      />
                    </Box>
                    <Divider />
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Box>
                        <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>Show my phone number to matches</Typography>
                        <Typography variant="body2" sx={{ color: COLORS.textSecondary }}>Verified matches can see your contact number</Typography>
                      </Box>
                      <Switch 
                        checked={editing ? editData.privacy?.showPhone || false : profileData.privacy.showPhone} 
                        onChange={(e) => editing && setEditData({
                          ...editData,
                          privacy: { ...editData.privacy, showPhone: e.target.checked }
                        })}
                        disabled={!editing}
                        color="primary" 
                      />
                    </Box>
                    
                    <Box sx={{ mt: 2 }}>
                      <Typography variant="subtitle1" sx={{ fontWeight: 800, mb: 2 }}>Who can message me</Typography>
                      <Stack direction="row" spacing={1}>
                        {['Everyone', 'Matches Only', 'No One'].map(option => (
                          <Chip 
                            key={option} 
                            label={option} 
                            onClick={() => editing && setEditData({
                              ...editData,
                              privacy: { ...editData.privacy, whoCanMessage: option }
                            })}
                            sx={{ 
                              bgcolor: (editing ? editData.privacy?.whoCanMessage : profileData.privacy.whoCanMessage) === option ? COLORS.primary : COLORS.cream,
                              color: (editing ? editData.privacy?.whoCanMessage : profileData.privacy.whoCanMessage) === option ? 'white' : COLORS.primary,
                              fontWeight: 700
                            }} 
                          />
                        ))}
                      </Stack>
                    </Box>

                    <Box sx={{ mt: 2 }}>
                      <Typography variant="subtitle1" sx={{ fontWeight: 800, mb: 2 }}>Who can see my photos</Typography>
                      <Stack direction="row" spacing={1}>
                        {['Everyone', 'Matches Only', 'Profile Viewers'].map(option => (
                          <Chip 
                            key={option} 
                            label={option} 
                            onClick={() => editing && setEditData({
                              ...editData,
                              privacy: { ...editData.privacy, whoCanSeePhotos: option }
                            })}
                            sx={{ 
                              bgcolor: (editing ? editData.privacy?.whoCanSeePhotos : profileData.privacy.whoCanSeePhotos) === option ? COLORS.primary : COLORS.cream,
                              color: (editing ? editData.privacy?.whoCanSeePhotos : profileData.privacy.whoCanSeePhotos) === option ? 'white' : COLORS.primary,
                              fontWeight: 700
                            }} 
                          />
                        ))}
                      </Stack>
                    </Box>
                  </Stack>
                </Paper>
              </Grid>

              <Grid size={{ xs: 12, md: 5 }}>
                <Stack spacing={4}>
                  <Paper sx={{ p: 4, borderRadius: '24px', boxShadow: '0 2px 16px rgba(0,0,0,0.03)', border: `1px solid ${alpha(COLORS.accent, 0.1)}` }}>
                    <Typography variant="h6" sx={{ mb: 2, fontWeight: 800, color: COLORS.accent }}>Data & Privacy</Typography>
                    <Typography variant="body2" sx={{ color: COLORS.textSecondary, mb: 3 }}>
                      In compliance with GDPR and local data protection laws, you can download all your personal data stored on RaashiLink.AI.
                    </Typography>
                    <Button 
                      fullWidth 
                      variant="outlined" 
                      startIcon={<Download size={18} />}
                      sx={{ borderRadius: '12px', color: COLORS.accent, borderColor: COLORS.accent, fontWeight: 700 }}
                    >
                      Download My Data (JSON)
                    </Button>
                  </Paper>

                  <Paper sx={{ p: 4, borderRadius: '24px', boxShadow: '0 2px 16px rgba(0,0,0,0.03)', border: '1px solid #FFE5E5' }}>
                    <Typography variant="h6" sx={{ mb: 2, fontWeight: 800, color: 'error.main' }}>Danger Zone</Typography>
                    <Typography variant="body2" sx={{ color: COLORS.textSecondary, mb: 3 }}>
                      Deleting your account is permanent. All your matches, messages, and horoscope data will be lost forever.
                    </Typography>
                    <Button 
                      fullWidth 
                      variant="contained" 
                      color="error"
                      startIcon={<Trash2 size={18} />}
                      sx={{ borderRadius: '12px', fontWeight: 800, boxShadow: '0 4px 12px rgba(211,47,47,0.2)' }}
                    >
                      Delete My Account
                    </Button>
                  </Paper>
                </Stack>
              </Grid>
            </Grid>
          </CustomTabPanel>
        </MotionBox>
      </AnimatePresence>
    </Container>
  );
}


