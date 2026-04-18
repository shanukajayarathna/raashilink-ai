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
  InputAdornment,
  Autocomplete,
  Backdrop,
  Fade,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Snackbar,
  Alert
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
  Edit,
  Mail,
  Phone,
  Lock,
  Eye,
  EyeOff
} from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '@/app/store/store';
import { logout, updateUser } from '@/features/auth/store/authSlice';
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
import horoscopeService from '../../horoscope/services/horoscopeService';
import { fetchMyChart } from '../../horoscope/store/horoscopeSlice';
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
const HOBBIES_SUGGESTIONS = [
  'Reading', 'Writing', 'Cooking', 'Baking', 'Travel', 'Photography', 'Painting', 'Drawing',
  'Music', 'Playing Guitar', 'Singing', 'Dancing', 'Yoga', 'Meditation', 'Fitness', 'Running',
  'Cycling', 'Swimming', 'Hiking', 'Trekking', 'Cricket', 'Football', 'Badminton', 'Tennis',
  'Chess', 'Gaming', 'Gardening', 'Volunteering', 'Movies', 'Theatre', 'Poetry', 'Blogging',
  'Coding', 'DIY Crafts', 'Pottery', 'Embroidery', 'Bird Watching', 'Astronomy', 'Fishing',
  'Surfing', 'Martial Arts', 'Skating', 'Calligraphy', 'Fashion', 'Interior Design', 'Astrology',
];
const PERSONALITY_QUIZ_QUESTIONS = [
  'I enjoy meeting new people',
  'I prefer organized plans',
  'I am easily stressed',
  'I enjoy creative activities',
  'I am helpful and unselfish',
  'I am talkative and outgoing',
  'I am reliable and hardworking',
  'I am curious about many things',
  'I am forgiving of others',
  'I am calm and emotionally stable',
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
const GENDER_OPTIONS = [
  { value: 'male', label: 'Male' },
  { value: 'female', label: 'Female' },
  { value: 'non-binary', label: 'Non-binary' },
  { value: 'prefer_not_to_say', label: 'Prefer not to say' },
];

function formatGenderDisplay(value: any) {
  if (value === undefined || value === null) return 'Not provided';

  const normalized = String(value).trim();
  if (!normalized) return 'Not provided';

  const knownOption = GENDER_OPTIONS.find((option) => option.value === normalized.toLowerCase());
  if (knownOption) return knownOption.label;

  return normalized.charAt(0).toUpperCase() + normalized.slice(1);
}

const LANGUAGE_OPTIONS = [
  'Sinhala',
  'Tamil',
  'English',
  'Arabic',
  'Chinese',
  'French',
  'German',
  'Hindi',
  'Italian',
  'Japanese',
  'Korean',
  'Malay',
  'Mandarin',
  'Portuguese',
  'Russian',
  'Spanish',
  'Telugu',
  'Thai',
  'Turkish',
  'Urdu',
];

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

function formatLocationDisplay(location: any) {
  const normalized = typeof location === 'string' ? location.trim() : '';
  if (!normalized || normalized.toLowerCase() === 'not provided') {
    return 'Location not provided';
  }

  return /sri lanka/i.test(normalized) ? normalized : `${normalized}, Sri Lanka`;
}

function buildPersonalityChartFromAnswers(answers: any[], fallbackData: any[]) {
  const safe = Array.isArray(answers) && answers.length >= 10
    ? answers.slice(0, 10).map((value) => Math.max(1, Math.min(5, Number(value) || 3)))
    : null;

  if (!safe) return Array.isArray(fallbackData) ? fallbackData : [];

  const average = (values: number[]) => values.reduce((sum, value) => sum + value, 0) / values.length;
  const toPercent = (score: number) => Math.round(((score - 1) / 4) * 100);

  return [
    { subject: 'Openness', A: toPercent(average([safe[3], safe[7]])), fullMark: 100 },
    { subject: 'Conscientiousness', A: toPercent(average([safe[1], safe[6]])), fullMark: 100 },
    { subject: 'Extraversion', A: toPercent(average([safe[0], safe[5]])), fullMark: 100 },
    { subject: 'Agreeableness', A: toPercent(average([safe[4], safe[8]])), fullMark: 100 },
    { subject: 'Neuroticism', A: toPercent(average([safe[2], 6 - safe[9]])), fullMark: 100 },
  ];
}

export default function UserProfile() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, token } = useSelector((state: RootState) => state.auth);  const dispatch = useDispatch();
  const searchParams = new URLSearchParams(location.search);
  const initialTab = parseInt(searchParams.get('tab') || '0', 10);
  const initialEdit = searchParams.get('edit') === 'true';
  const [tabValue, setTabValue] = useState(isNaN(initialTab) ? 0 : Math.min(initialTab, 4));
  const [loading, setLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [profileData, setProfileData] = useState<any>(null);
  const [editing, setEditing] = useState(initialEdit);
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
  const [locationSuggestions, setLocationSuggestions] = useState<string[]>([]);
  const [loadingLocationSuggestions, setLoadingLocationSuggestions] = useState(false);
  const [birthPlaceSuggestions, setBirthPlaceSuggestions] = useState<string[]>([]);
  const [loadingBirthPlaceSuggestions, setLoadingBirthPlaceSuggestions] = useState(false);
  const [exportingData, setExportingData] = useState(false);
  const [deletingAccount, setDeletingAccount] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  // Contact & Security
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
  const [contactSuccessMessage, setContactSuccessMessage] = useState('');
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
    const query = String(editData.location || '').trim();

    if (!editing) {
      setLocationSuggestions([]);
      setLoadingLocationSuggestions(false);
      return;
    }

    if (!query) {
      setLocationSuggestions([]);
      setLoadingLocationSuggestions(false);
      return;
    }

    const timer = window.setTimeout(async () => {
      setLoadingLocationSuggestions(true);
      try {
        const suggestions = await userService.searchBirthPlaces(query, 5);
        setLocationSuggestions(suggestions);
      } catch (lookupError) {
        console.error('Location suggestion lookup failed:', lookupError);
        setLocationSuggestions([]);
      } finally {
        setLoadingLocationSuggestions(false);
      }
    }, 300);

    return () => window.clearTimeout(timer);
  }, [editData.location, editing]);

  useEffect(() => {
    const query = String(editData.birthPlace || '').trim();

    if (!editing) {
      setBirthPlaceSuggestions([]);
      setLoadingBirthPlaceSuggestions(false);
      return;
    }

    if (query.length < 2) {
      setBirthPlaceSuggestions(query ? [query] : []);
      setLoadingBirthPlaceSuggestions(false);
      return;
    }

    const timer = window.setTimeout(async () => {
      setLoadingBirthPlaceSuggestions(true);
      try {
        const suggestions = await userService.searchBirthPlaces(query, 5);
        setBirthPlaceSuggestions(Array.from(new Set([query, ...suggestions])));
      } catch (lookupError) {
        console.error('Birth place suggestion lookup failed:', lookupError);
        setBirthPlaceSuggestions(query ? [query] : []);
      } finally {
        setLoadingBirthPlaceSuggestions(false);
      }
    }, 250);

    return () => window.clearTimeout(timer);
  }, [editData.birthPlace, editing]);

  const mergeAuthFallbacks = (profile: any) => {
    const next = { ...profile };
    const currentEthnicity = next?.personalInfo?.ethnicity;
    const fallbackEthnicity = user?.ethnicity || user?.personalInfo?.ethnicity || '';

    if ((!currentEthnicity || String(currentEthnicity).trim() === '') && fallbackEthnicity) {
      next.ethnicity = fallbackEthnicity;
      next.personalInfo = {
        ...(next.personalInfo || {}),
        ethnicity: fallbackEthnicity,
      };
    }

    return next;
  };

  useEffect(() => {
    const fetchProfile = async () => {
      setLoading(true);
      try {
        const response = await userService.getProfile();
        const normalized = mergeAuthFallbacks(normalizeProfileData(response));
        setProfileData(normalized);
        setEditData(normalized);
        setContactInfo({
          email: response.verification?.email || user?.email || '',
          phone: response.verification?.phone || response.personalInfo?.phone || '',
        });
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
            gender: user?.personalInfo?.gender || user?.gender || 'Not provided',
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
            gana: 'Not provided',
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
    if (isSaving) return;
    setIsSaving(true);
    try {
      const previousBirthDate = String(profileData?.birthDate || '').trim();
      const previousBirthTime = String(profileData?.birthTime || '').trim();
      const previousBirthPlace = String(profileData?.birthPlace || '').trim();

      const nextBirthDate = String(editData?.birthDate || '').trim();
      const nextBirthTime = String(editData?.birthTime || '').trim();
      const nextBirthPlace = String(editData?.birthPlace || '').trim();

      const birthDetailsChanged =
        previousBirthDate !== nextBirthDate ||
        previousBirthTime !== nextBirthTime ||
        previousBirthPlace !== nextBirthPlace;

      const response = await userService.updateProfile(buildProfileUpdatePayload(editData));
      let latestProfile = response;

      if (birthDetailsChanged && nextBirthDate && nextBirthPlace) {
        try {
          // Update horoscope source data first, then reload profile so astrology cards update immediately.
          await horoscopeService.generateMyChart();
          await dispatch(fetchMyChart({ force: true }));
          latestProfile = await userService.getProfile();
        } catch (horoscopeError) {
          console.error('Horoscope refresh failed after birth-detail update:', horoscopeError);
          dispatch(showToast({
            type: 'error',
            message: 'Birth details were saved, but horoscope refresh failed. Please try again.',
          }));
        }
      }

      const normalized = mergeAuthFallbacks(normalizeProfileData(latestProfile));
      setProfileData(normalized);
      setEditData(normalized);
      setEditing(false);
      dispatch(updateUser(normalized));
      dispatch(showToast({ type: 'success', message: 'Profile updated successfully!' }));
    } catch (err) {
      console.error('Failed to update profile:', err);
      dispatch(showToast({ type: 'error', message: 'Failed to update profile. Please try again.' }));
    } finally {
      setIsSaving(false);
    }
  };

  const handleStartEdit = () => {
    if (!profileData) return;
    setEditData(normalizeProfileData(profileData));
    setEditing(true);
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
      const normalized = mergeAuthFallbacks(normalizeProfileData(uploadResponse));
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
      const normalized = mergeAuthFallbacks(normalizeProfileData(response));
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

  const handleExportData = async () => {
    if (exportingData) return;

    try {
      setExportingData(true);
      const response = await userService.exportData();
      const fileContent = JSON.stringify(response?.data || response, null, 2);
      const blob = new Blob([fileContent], { type: 'application/json' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      const stamp = new Date().toISOString().replace(/[:.]/g, '-');

      link.href = url;
      link.download = `raashilink-data-export-${stamp}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      dispatch(showToast({ type: 'success', message: 'Your data export has been downloaded.' }));
    } catch (error: any) {
      dispatch(showToast({ type: 'error', message: error?.response?.data?.message || 'Failed to download your data export.' }));
    } finally {
      setExportingData(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (deletingAccount) return;
    setDeleteDialogOpen(true);
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
      setContactSuccessMessage('Email updated. Please verify your new email address.');
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
      setContactSuccessMessage('Phone number updated. Please verify your new number.');
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
      setContactSuccessMessage('Password changed successfully.');
    } catch (err: any) {
      setPasswordDialogError(err.response?.data?.message || 'Failed to change password');
    } finally {
      setPasswordDialogSaving(false);
    }
  };

  const handlePersonalityAnswerChange = (index: number, value: number | number[]) => {
    const nextValue = Array.isArray(value) ? value[0] : value;
    const normalizedValue = Math.max(1, Math.min(5, Math.round(nextValue || 3)));
    const existingAnswers = Array.isArray(editData.personalityAnswers)
      ? [...editData.personalityAnswers]
      : new Array(10).fill(3);

    existingAnswers[index] = normalizedValue;

    setEditData({
      ...editData,
      personalityAnswers: existingAnswers,
      personality: buildPersonalityChartFromAnswers(existingAnswers, editData.personality || profileData.personality),
    });
  };

  const handleConfirmDeleteAccount = async () => {
    if (deletingAccount) return;

    try {
      setDeletingAccount(true);
      await userService.deleteAccount();
      setDeleteDialogOpen(false);
      dispatch(logout());
      dispatch(showToast({ type: 'success', message: 'Account deleted permanently.' }));
      navigate('/login', { replace: true });
    } catch (error: any) {
      dispatch(showToast({ type: 'error', message: error?.response?.data?.message || 'Failed to delete account.' }));
      setDeletingAccount(false);
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

  const personalityChartData = editing
    ? buildPersonalityChartFromAnswers(editData.personalityAnswers, editData.personality || profileData.personality)
    : profileData.personality;

  return (
    <>
      {/* Save overlay — blocks interaction with a blurred fade during DB write */}
      <Backdrop
        open={isSaving}
        sx={{
          zIndex: (theme) => theme.zIndex.modal + 10,
          bgcolor: 'rgba(20, 10, 10, 0.45)',
          backdropFilter: 'blur(4px)',
          flexDirection: 'column',
          gap: 2,
        }}
      >
        <Fade in={isSaving}>
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
              Saving your profile…
            </Typography>
          </Box>
        </Fade>
      </Backdrop>

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
                      disabled={isSaving}
                      sx={{ borderRadius: '12px', fontWeight: 700, whiteSpace: 'nowrap', minWidth: 96 }}
                    >
                      Cancel
                    </Button>
                    <Button 
                      variant="contained" 
                      onClick={handleSaveProfile}
                      disabled={isSaving}
                      startIcon={isSaving ? <CircularProgress size={16} sx={{ color: 'inherit' }} /> : null}
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
                      {isSaving ? 'Saving…' : 'Save Changes'}
                    </Button>
                  </>
                ) : (
                  <Button 
                    variant="contained" 
                    onClick={handleStartEdit}
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
                        <Autocomplete
                          freeSolo
                          options={locationSuggestions}
                          loading={loadingLocationSuggestions}
                          inputValue={editData.location || ''}
                          onInputChange={(_, value) => setEditData({ ...editData, location: value })}
                          onChange={(_, value) => setEditData({ ...editData, location: typeof value === 'string' ? value : value || '' })}
                          filterOptions={(options) => options}
                          noOptionsText={editData.location ? 'No nearby town or village found' : 'Type a nearby town or village'}
                          renderInput={(params) => (
                            <TextField
                              {...params}
                              fullWidth
                              label="Location"
                              placeholder="Enter nearest town or village"
                              helperText="Use your nearest town or village only. Full address is not needed."
                              sx={{ mb: 2 }}
                            />
                          )}
                        />
                        <TextField
                          fullWidth
                          multiline
                          rows={4}
                          value={editData.bio || ''}
                          onChange={(e) => setEditData({ ...editData, bio: e.target.value })}
                          placeholder="Tell us about yourself..."
                          sx={{ mb: 2 }}
                        />
                      </>
                    ) : (
                      <>
                        <Typography variant="body2" sx={{ color: COLORS.textSecondary, mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                          <MapPin size={16} /> {formatLocationDisplay(profileData.location)}
                        </Typography>
                        <Typography variant="body1" sx={{ color: COLORS.textSecondary, lineHeight: 1.8, mb: 3 }}>
                          {profileData.bio}
                        </Typography>
                      </>
                    )}
                    
                    <Divider sx={{ my: editing ? 2 : 4 }} />
                    
                    <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 800, color: COLORS.textPrimary, display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Languages size={18} /> Languages Spoken
                    </Typography>
                    {editing ? (
                      <Autocomplete
                        multiple
                        freeSolo
                        options={LANGUAGE_OPTIONS}
                        value={Array.isArray(editData.personalInfo?.languages) ? editData.personalInfo.languages : []}
                        onChange={(_, newValue) => {
                          const normalized = newValue
                            .map((item) => String(item).trim())
                            .filter(Boolean)
                            .filter((item, idx, arr) => arr.findIndex((v) => v.toLowerCase() === item.toLowerCase()) === idx);

                          setEditData({
                            ...editData,
                            personalInfo: {
                              ...editData.personalInfo,
                              languages: normalized,
                            },
                          });
                        }}
                        filterOptions={(options, { inputValue }) => {
                          const needle = inputValue.trim().toLowerCase();
                          if (!needle) return options.slice(0, 5);
                          return options.filter((option) => option.toLowerCase().startsWith(needle)).slice(0, 5);
                        }}
                        renderInput={(params) => (
                          <TextField
                            {...params}
                            placeholder="Type language (e.g., Sinhala, English, Tamil)"
                          />
                        )}
                        sx={{ mb: 1 }}
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
                        { label: 'Gender', value: formatGenderDisplay(profileData.personalInfo.gender), key: 'personalInfo.gender', icon: <User size={18} /> },
                        { label: 'Height', value: (() => { const h = profileData.personalInfo.height; if (!h || h === 'Not provided') return h; const n = String(h).replace(/\s*cm$/i, '').trim(); return n ? `${n} cm` : h; })(), key: 'personalInfo.height', icon: <Activity size={18} /> },
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
                                ) : item.key === 'personalInfo.gender' ? (
                                  <TextField
                                    fullWidth
                                    size="small"
                                    select
                                    value={editData.personalInfo?.gender || ''}
                                    onChange={(e) => setEditData({
                                      ...editData,
                                      personalInfo: {
                                        ...editData.personalInfo,
                                        gender: e.target.value,
                                      },
                                    })}
                                    sx={{ mt: 0.5 }}
                                  >
                                    <MenuItem value="">Select gender</MenuItem>
                                    {GENDER_OPTIONS.map((option) => (
                                      <MenuItem key={option.value} value={option.value}>{option.label}</MenuItem>
                                    ))}
                                  </TextField>
                                ) : item.key === 'personalInfo.height' ? (
                                  <TextField
                                    fullWidth
                                    size="small"
                                    type="number"
                                    value={String(editData.personalInfo?.height || '').replace(/\s*cm$/i, '').trim()}
                                    onChange={(e) => setEditData({
                                      ...editData,
                                      personalInfo: {
                                        ...editData.personalInfo,
                                        height: e.target.value ? `${e.target.value} cm` : '',
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
                                    select
                                    value={editData.personalInfo?.religion || ''}
                                    onChange={(e) => setEditData({
                                      ...editData,
                                      personalInfo: {
                                        ...editData.personalInfo,
                                        religion: e.target.value,
                                      },
                                    })}
                                    sx={{ mt: 0.5 }}
                                  >
                                    <MenuItem value="">Select religion</MenuItem>
                                    {SRI_LANKAN_RELIGIONS.map((option) => (
                                      <MenuItem key={option} value={option}>{option}</MenuItem>
                                    ))}
                                  </TextField>
                                ) : (
                                  <TextField
                                    fullWidth
                                    size="small"
                                    select
                                    value={editData.personalInfo?.ethnicity || ''}
                                    onChange={(e) => setEditData({
                                      ...editData,
                                      personalInfo: {
                                        ...editData.personalInfo,
                                        ethnicity: e.target.value,
                                      },
                                    })}
                                    sx={{ mt: 0.5 }}
                                  >
                                    <MenuItem value="">Select ethnicity</MenuItem>
                                    {SRI_LANKAN_ETHNICITIES.map((option) => (
                                      <MenuItem key={option} value={option}>{option}</MenuItem>
                                    ))}
                                  </TextField>
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

                  {/* Contact & Security */}
                  <Paper sx={{ p: 4, borderRadius: '24px', boxShadow: '0 2px 16px rgba(0,0,0,0.03)' }}>
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
                  </Paper>
                </Stack>
              </Grid>

              <Grid size={{ xs: 12, md: 5 }}>
                <Paper sx={{ p: 4, borderRadius: '24px', boxShadow: '0 2px 16px rgba(0,0,0,0.03)', height: '100%' }}>
                  <Typography variant="h6" sx={{ mb: 1, fontWeight: 800, color: COLORS.primary }}>Personality Traits</Typography>
                  <Typography variant="caption" sx={{ color: COLORS.textSecondary, mb: 4, display: 'block' }}>
                    {editing ? 'Retake the Big Five quiz to update your personality profile.' : 'Based on your Big Five personality quiz results'}
                  </Typography>
                  
                  <Box sx={{ height: 300, width: '100%', mt: 2 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <RadarChart cx="50%" cy="50%" outerRadius="80%" data={personalityChartData}>
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
                    {personalityChartData.map((trait: any) => (
                      <Box key={trait.subject} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Typography variant="body2" sx={{ fontWeight: 700, color: COLORS.textSecondary }}>{trait.subject}</Typography>
                        <Typography variant="body2" sx={{ fontWeight: 800, color: COLORS.primary }}>{(trait.A / 20).toFixed(1)}/5.0</Typography>
                      </Box>
                    ))}
                  </Stack>

                  {editing && (
                    <Stack spacing={3} sx={{ mt: 4, pt: 3, borderTop: `1px solid ${alpha(COLORS.primary, 0.12)}` }}>
                      {PERSONALITY_QUIZ_QUESTIONS.map((question, index) => (
                        <Box key={question}>
                          <Typography variant="body2" sx={{ fontWeight: 700, color: COLORS.textPrimary, mb: 1 }}>
                            {index + 1}. {question}
                          </Typography>
                          <Stack direction="row" spacing={2} alignItems="center">
                            <Typography variant="caption" sx={{ minWidth: 50, color: COLORS.textSecondary }}>Disagree</Typography>
                            <Slider
                              value={Array.isArray(editData.personalityAnswers) ? editData.personalityAnswers[index] ?? 3 : 3}
                              onChange={(_, value) => handlePersonalityAnswerChange(index, value)}
                              min={1}
                              max={5}
                              step={1}
                              marks
                              sx={{ color: COLORS.primary }}
                            />
                            <Typography variant="caption" sx={{ minWidth: 34, color: COLORS.textSecondary }}>Agree</Typography>
                          </Stack>
                        </Box>
                      ))}
                    </Stack>
                  )}
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
                    <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
                      <Calendar size={20} color={COLORS.secondary} />
                      <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Typography variant="caption" sx={{ color: COLORS.textSecondary, fontWeight: 700 }}>Date of Birth</Typography>
                        {editing ? (
                          <TextField
                            fullWidth
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
                    <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
                      <Clock size={20} color={COLORS.secondary} />
                      <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Typography variant="caption" sx={{ color: COLORS.textSecondary, fontWeight: 700 }}>Time of Birth</Typography>
                        {editing ? (
                          <TextField
                            fullWidth
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
                    <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
                      <MapPin size={20} color={COLORS.secondary} />
                      <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Typography variant="caption" sx={{ color: COLORS.textSecondary, fontWeight: 700 }}>Place of Birth</Typography>
                        {editing ? (
                          <Autocomplete
                            freeSolo
                            options={birthPlaceSuggestions}
                            loading={loadingBirthPlaceSuggestions}
                            inputValue={editData.birthPlace || ''}
                            onInputChange={(_, value) => setEditData({ ...editData, birthPlace: value })}
                            onChange={(_, value) => setEditData({ ...editData, birthPlace: typeof value === 'string' ? value : value || '' })}
                            filterOptions={(options) => options}
                            noOptionsText={editData.birthPlace ? 'No matching places found' : 'Type at least 2 letters'}
                            renderInput={(params) => (
                              <TextField
                                {...params}
                                fullWidth
                                size="small"
                                placeholder="Nearest town or village"
                                sx={{ mt: 0.5 }}
                              />
                            )}
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
                      { label: 'Gana', value: profileData.astrology.gana || 'Not provided' },
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
                <Paper sx={{ p: 4, borderRadius: '24px', boxShadow: '0 2px 16px rgba(0,0,0,0.03)' }}>
                  <Typography variant="h6" sx={{ mb: 3, fontWeight: 800, color: COLORS.primary }}>Horoscope Highlights</Typography>

                  <Stack spacing={3}>
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
                      <Typography variant="subtitle2" sx={{ fontWeight: 800, mb: 1.5, color: COLORS.textPrimary }}>Favorable Signs</Typography>
                      <Typography variant="body2" sx={{ color: COLORS.textSecondary, fontWeight: 600 }}>
                        {profileData.astrology.favorablePartners.length > 0
                          ? <>Compatible with <span style={{ color: COLORS.primary, fontWeight: 800 }}>{profileData.astrology.favorablePartners.join(', ')}</span></>
                          : 'No partner guidance available yet.'}
                      </Typography>
                    </Box>
                    <Box>
                      <Typography variant="subtitle2" sx={{ fontWeight: 800, mb: 1.5, color: COLORS.textPrimary }}>Personal Horoscope Facts</Typography>
                      {profileData.astrology.profileFacts?.length > 0 ? (
                        <Stack spacing={1.2}>
                          {profileData.astrology.profileFacts.map((fact: string, index: number) => (
                            <Typography key={`${fact}-${index}`} variant="body2" sx={{ color: COLORS.textSecondary, lineHeight: 1.6 }}>
                              • {fact}
                            </Typography>
                          ))}
                        </Stack>
                      ) : (
                        <Typography variant="body2" sx={{ color: COLORS.textSecondary }}>
                          Update your birth details and save to generate personalized horoscope facts.
                        </Typography>
                      )}
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
                    <Autocomplete
                      multiple
                      freeSolo
                      options={HOBBIES_SUGGESTIONS}
                      value={editData.lifestyle?.hobbies || []}
                      onChange={(_e, newValue) => setEditData({
                        ...editData,
                        lifestyle: {
                          ...editData.lifestyle,
                          hobbies: newValue.map((v: string) => v.trim()).filter(Boolean),
                        }
                      })}
                      renderTags={(value, getTagProps) =>
                        value.map((option: string, index: number) => {
                          const tagProps = getTagProps({ index });
                          return (
                            <Chip
                              key={option}
                              label={option}
                              size="small"
                              {...tagProps}
                              sx={{ bgcolor: 'rgba(139,26,46,0.08)', color: COLORS.primary, fontWeight: 700 }}
                            />
                          );
                        })
                      }
                      renderInput={(params) => (
                        <TextField
                          {...params}
                          placeholder="Type or select hobbies..."
                          helperText="Type a hobby and press Enter, or pick from suggestions"
                        />
                      )}
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
                      onClick={handleExportData}
                      disabled={exportingData || deletingAccount}
                      sx={{ borderRadius: '12px', color: COLORS.accent, borderColor: COLORS.accent, fontWeight: 700 }}
                    >
                      {exportingData ? 'Preparing Download…' : 'Download My Data (JSON)'}
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
                      onClick={handleDeleteAccount}
                      disabled={deletingAccount || exportingData}
                      sx={{ borderRadius: '12px', fontWeight: 800, boxShadow: '0 4px 12px rgba(211,47,47,0.2)' }}
                    >
                      {deletingAccount ? 'Deleting Account…' : 'Delete My Account'}
                    </Button>
                  </Paper>
                </Stack>
              </Grid>
            </Grid>
          </CustomTabPanel>
        </MotionBox>
      </AnimatePresence>
    </Container>

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
        <Button variant="contained" onClick={handleUpdateEmail} disabled={emailDialogSaving} sx={{ bgcolor: COLORS.primary, '&:hover': { bgcolor: '#6B1424' } }}>
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
        <Button variant="contained" onClick={handleUpdatePhone} disabled={phoneDialogSaving} sx={{ bgcolor: COLORS.primary, '&:hover': { bgcolor: '#6B1424' } }}>
          {phoneDialogSaving ? <CircularProgress size={20} color="inherit" /> : 'Update Phone'}
        </Button>
      </DialogActions>
    </Dialog>

    {/* Change Password Dialog */}
    <Dialog open={showPasswordDialog} onClose={() => setShowPasswordDialog(false)} maxWidth="xs" fullWidth>
      <DialogTitle sx={{ fontWeight: 800, color: COLORS.primary }}>Change Password</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ mt: 1 }}>
          <Typography variant="body2" color="text.secondary">
            Choose a strong password of at least 8 characters.
          </Typography>
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
        <Button variant="contained" onClick={handleChangePassword} disabled={passwordDialogSaving} sx={{ bgcolor: COLORS.primary, '&:hover': { bgcolor: '#6B1424' } }}>
          {passwordDialogSaving ? <CircularProgress size={20} color="inherit" /> : 'Change Password'}
        </Button>
      </DialogActions>
    </Dialog>

    {/* Contact success snackbar */}
    <Snackbar
      open={!!contactSuccessMessage}
      autoHideDuration={4000}
      onClose={() => setContactSuccessMessage('')}
      anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
    >
      <Alert severity="success" variant="filled" sx={{ width: '100%', borderRadius: 2 }} onClose={() => setContactSuccessMessage('')}>
        {contactSuccessMessage}
      </Alert>
    </Snackbar>

    <Dialog
      open={deleteDialogOpen}
      onClose={() => !deletingAccount && setDeleteDialogOpen(false)}
      fullWidth
      maxWidth="xs"
      PaperProps={{
        sx: {
          borderRadius: '20px',
          border: `1px solid ${alpha('#D32F2F', 0.25)}`,
          boxShadow: '0 18px 42px rgba(139,26,46,0.2)',
        },
      }}
    >
      <DialogTitle sx={{ fontWeight: 900, color: 'error.main', pb: 1 }}>
        Confirm Account Deletion
      </DialogTitle>
      <DialogContent>
        <Typography variant="body2" sx={{ color: COLORS.textSecondary, lineHeight: 1.7 }}>
          This action is permanent. Your profile, matches, messages, and horoscope data will be erased from the database and cannot be restored.
        </Typography>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 3, pt: 1, gap: 1 }}>
        <Button
          variant="outlined"
          onClick={() => setDeleteDialogOpen(false)}
          disabled={deletingAccount}
          sx={{ borderRadius: '10px', fontWeight: 700 }}
        >
          Cancel
        </Button>
        <Button
          variant="contained"
          color="error"
          onClick={handleConfirmDeleteAccount}
          disabled={deletingAccount}
          sx={{ borderRadius: '10px', fontWeight: 800, minWidth: 160 }}
        >
          {deletingAccount ? 'Deleting Account…' : 'Yes, Delete Permanently'}
        </Button>
      </DialogActions>
    </Dialog>
    </>
  );
}
