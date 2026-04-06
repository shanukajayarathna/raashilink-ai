import React, { useState, useEffect } from 'react';
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
  Tooltip
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
  X
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { RootState } from '@/app/store/store';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Radar, 
  RadarChart, 
  PolarGrid, 
  PolarAngleAxis, 
  PolarRadiusAxis, 
  ResponsiveContainer 
} from 'recharts';
import ProfilePhotoUpload from '../components/ProfilePhotoUpload';
import userService from '../services/userService';

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

export default function UserProfile() {
  const navigate = useNavigate();
  const { user, token } = useSelector((state: RootState) => state.auth);
  const [tabValue, setTabValue] = useState(0);
  const [loading, setLoading] = useState(false);
  const [profileData, setProfileData] = useState<any>(null);

  useEffect(() => {
    const fetchProfile = async () => {
      setLoading(true);
      try {
        const response = await userService.getProfile();
        setProfileData(response);
      } catch (err) {
        console.error('Failed to fetch profile:', err);
        // Mock data for demo
        setProfileData({
          name: user?.name || 'Shanuka Jayarathna',
          age: 28,
          tagline: "Building the future, one line of code at a time.",
          location: "Colombo, Western Province",
          completion: 75,
          status: "Online Now",
          bio: "I'm a passionate software engineer who loves exploring new technologies and building meaningful products. In my free time, I enjoy traveling across Sri Lanka, photography, and playing cricket. I value family traditions and am looking for a partner who shares similar values and a zest for life.",
          personalInfo: {
            height: "5'10\"",
            education: "BSc in Computer Science",
            occupation: "Senior Software Engineer",
            religion: "Buddhist",
            ethnicity: "Sinhalese",
            languages: ['Sinhala', 'English', 'Tamil']
          },
          personality: [
            { subject: 'Openness', A: 85, fullMark: 100 },
            { subject: 'Conscientiousness', A: 75, fullMark: 100 },
            { subject: 'Extraversion', A: 65, fullMark: 100 },
            { subject: 'Agreeableness', A: 80, fullMark: 100 },
            { subject: 'Neuroticism', A: 40, fullMark: 100 },
          ],
          astrology: {
            birthDate: "Nov 15, 1995",
            birthTime: "08:30 AM",
            birthPlace: "Colombo, SL",
            rashi: "Scorpio",
            nakshatra: "Jyeshtha",
            ascendant: "Aries",
            sunSign: "Scorpio",
            luckyColors: ['#8B1A2E', '#C9A84C'],
            auspiciousDays: ['Tuesday', 'Thursday'],
            favorablePartners: ['Aries', 'Leo', 'Sagittarius']
          },
          lifestyle: {
            hobbies: [
              { label: 'Music', icon: '🎵' },
              { label: 'Cooking', icon: '🍳' },
              { label: 'Travel', icon: '✈️' },
              { label: 'Reading', icon: '📚' }
            ],
            exercise: 'Regularly',
            diet: 'Non-veg',
            smoking: 'Never',
            drinking: 'Never',
            careerAmbitions: 'Tech Entrepreneur',
            familyPlans: 'Want children, 2 kids ideally',
            socialPreference: 65
          },
          photos: [
            { id: 1, url: 'https://picsum.photos/seed/p1/400/400', isMain: true },
            { id: 2, url: 'https://picsum.photos/seed/p2/400/400', isMain: false },
            { id: 3, url: 'https://picsum.photos/seed/p3/400/400', isMain: false },
            { id: 4, url: 'https://picsum.photos/seed/p4/400/400', isMain: false },
          ],
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

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handlePhotoUpload = async (file: File) => {
    // API call to upload photo
    console.log('Uploading photo:', file);
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
            background: `linear-gradient(135deg, ${COLORS.primary} 0%, ${COLORS.secondary} 100%)`,
            position: 'relative',
            overflow: 'hidden'
          }}
        >
          <Box sx={{ position: 'absolute', inset: 0, opacity: 0.1, backgroundImage: 'radial-gradient(circle, #fff 1px, transparent 1px)', backgroundSize: '20px 20px' }} />
          <IconButton 
            sx={{ position: 'absolute', top: 16, right: 16, bgcolor: 'rgba(255,255,255,0.2)', color: 'white', '&:hover': { bgcolor: 'rgba(255,255,255,0.3)' } }}
          >
            <Camera size={20} />
          </IconButton>
        </Box>

        {/* Profile Info Area */}
        <Box sx={{ px: { xs: 3, md: 6 }, pb: 4, pt: { xs: 8, md: 2 }, position: 'relative' }}>
          {/* Profile Photo - Offset */}
          <Box sx={{ position: 'absolute', top: { xs: -60, md: -80 }, left: { xs: '50%', md: 48 }, transform: { xs: 'translateX(-50%)', md: 'none' } }}>
            <ProfilePhotoUpload 
              currentPhoto={profileData.photos.find((p: any) => p.isMain)?.url} 
              onUpload={handlePhotoUpload} 
            />
          </Box>

          <Box sx={{ ml: { xs: 0, md: 24 }, mt: { xs: 2, md: 0 }, textAlign: { xs: 'center', md: 'left' } }}>
            <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, justifyContent: 'space-between', alignItems: { xs: 'center', md: 'flex-start' }, gap: 2 }}>
              <Box>
                <Typography variant="h3" sx={{ fontFamily: 'Playfair Display', fontWeight: 900, color: COLORS.primary }}>
                  {profileData.name}, {profileData.age}
                </Typography>
                <Typography variant="body1" sx={{ color: COLORS.textSecondary, mb: 1, display: 'flex', alignItems: 'center', justifyContent: { xs: 'center', md: 'flex-start' }, gap: 0.5 }}>
                  <MapPin size={16} /> {profileData.location} 📍
                </Typography>
                <Typography variant="subtitle1" sx={{ fontStyle: 'italic', color: COLORS.textSecondary, fontWeight: 500 }}>
                  "{profileData.tagline}"
                </Typography>
              </Box>
              
              <Stack direction="row" spacing={2} alignItems="center">
                <Box sx={{ textAlign: 'right', display: { xs: 'none', md: 'block' } }}>
                  <Typography variant="caption" sx={{ fontWeight: 800, color: COLORS.accent, display: 'flex', alignItems: 'center', gap: 0.5, justifyContent: 'flex-end' }}>
                    <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: '#4CAF50' }} /> {profileData.status}
                  </Typography>
                  <Box sx={{ mt: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Typography variant="caption" sx={{ fontWeight: 700 }}>Profile Strength</Typography>
                    <Chip 
                      label={`${profileData.completion}% Complete`} 
                      size="small" 
                      sx={{ bgcolor: alpha(COLORS.primary, 0.1), color: COLORS.primary, fontWeight: 800, fontSize: '0.65rem' }} 
                    />
                  </Box>
                </Box>
                <Button 
                  variant="contained" 
                  onClick={() => navigate('/edit-profile')}
                  startIcon={<Edit3 size={18} />}
                  sx={{ 
                    bgcolor: COLORS.primary, 
                    borderRadius: '12px', 
                    px: 4, 
                    py: 1.5,
                    fontWeight: 800,
                    boxShadow: '0 4px 12px rgba(139,26,46,0.2)',
                    '&:hover': { bgcolor: '#6B1424' }
                  }}
                >
                  Edit Profile
                </Button>
              </Stack>
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
                    <Typography variant="body1" sx={{ color: COLORS.textSecondary, lineHeight: 1.8 }}>
                      {profileData.bio}
                    </Typography>
                    
                    <Divider sx={{ my: 4 }} />
                    
                    <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 800, color: COLORS.textPrimary, display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Languages size={18} /> Languages Spoken
                    </Typography>
                    <Stack direction="row" spacing={1}>
                      {profileData.personalInfo.languages.map((lang: string) => (
                        <Chip key={lang} label={lang} sx={{ bgcolor: COLORS.cream, fontWeight: 700, color: COLORS.primary }} />
                      ))}
                    </Stack>
                  </Paper>

                  <Paper sx={{ p: 4, borderRadius: '24px', boxShadow: '0 2px 16px rgba(0,0,0,0.03)' }}>
                    <Typography variant="h6" sx={{ mb: 3, fontWeight: 800, color: COLORS.primary }}>Personal Information</Typography>
                    <Grid container spacing={3}>
                      {[
                        { label: 'Age', value: profileData.age, icon: <Calendar size={18} /> },
                        { label: 'Height', value: profileData.personalInfo.height, icon: <Activity size={18} /> },
                        { label: 'Education', value: profileData.personalInfo.education, icon: <GraduationCap size={18} /> },
                        { label: 'Occupation', value: profileData.personalInfo.occupation, icon: <Briefcase size={18} /> },
                        { label: 'Religion', value: profileData.personalInfo.religion, icon: <Heart size={18} /> },
                        { label: 'Ethnicity', value: profileData.personalInfo.ethnicity, icon: <Users size={18} /> },
                      ].map((item, i) => (
                        <Grid size={{ xs: 12, sm: 6 }} key={i}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, p: 2, bgcolor: alpha(COLORS.cream, 0.5), borderRadius: '16px' }}>
                            <Box sx={{ color: COLORS.primary }}>{item.icon}</Box>
                            <Box>
                              <Typography variant="caption" sx={{ color: COLORS.textSecondary, fontWeight: 700, textTransform: 'uppercase' }}>{item.label}</Typography>
                              <Typography variant="body2" sx={{ fontWeight: 800, color: COLORS.textPrimary }}>{item.value}</Typography>
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
                        <Typography variant="body1" sx={{ fontWeight: 800 }}>{profileData.astrology.birthDate}</Typography>
                      </Box>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <Clock size={20} color={COLORS.secondary} />
                      <Box>
                        <Typography variant="caption" sx={{ color: COLORS.textSecondary, fontWeight: 700 }}>Time of Birth</Typography>
                        <Typography variant="body1" sx={{ fontWeight: 800 }}>{profileData.astrology.birthTime}</Typography>
                      </Box>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <MapPin size={20} color={COLORS.secondary} />
                      <Box>
                        <Typography variant="caption" sx={{ color: COLORS.textSecondary, fontWeight: 700 }}>Place of Birth</Typography>
                        <Typography variant="body1" sx={{ fontWeight: 800 }}>{profileData.astrology.birthPlace}</Typography>
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
                      <Stack direction="row" spacing={1}>
                        {profileData.astrology.luckyColors.map((color: string) => (
                          <Box key={color} sx={{ width: 32, height: 32, borderRadius: '50%', bgcolor: color, border: '2px solid white', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }} />
                        ))}
                      </Stack>
                    </Box>
                    <Box>
                      <Typography variant="subtitle2" sx={{ fontWeight: 800, mb: 1.5, color: COLORS.textPrimary }}>Auspicious Days</Typography>
                      <Stack direction="row" spacing={1}>
                        {profileData.astrology.auspiciousDays.map((day: string) => (
                          <Chip key={day} label={day} size="small" sx={{ bgcolor: COLORS.accent, color: 'white', fontWeight: 700 }} />
                        ))}
                      </Stack>
                    </Box>
                    <Box>
                      <Typography variant="subtitle2" sx={{ fontWeight: 800, mb: 1.5, color: COLORS.textPrimary }}>Favorable Partners</Typography>
                      <Typography variant="body2" sx={{ color: COLORS.textSecondary, fontWeight: 600 }}>
                        Compatible with <span style={{ color: COLORS.primary, fontWeight: 800 }}>{profileData.astrology.favorablePartners.join(', ')}</span>
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
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.5 }}>
                    {profileData.lifestyle.hobbies.map((hobby: any) => (
                      <Chip 
                        key={hobby.label} 
                        label={`${hobby.icon} ${hobby.label}`} 
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
                    ))}
                  </Box>

                  <Divider sx={{ my: 4 }} />

                  <Typography variant="h6" sx={{ mb: 3, fontWeight: 800, color: COLORS.primary }}>Daily Habits</Typography>
                  <Grid container spacing={2}>
                    {[
                      { label: 'Exercise', value: profileData.lifestyle.exercise, icon: <Activity size={18} /> },
                      { label: 'Diet', value: profileData.lifestyle.diet, icon: <Coffee size={18} /> },
                      { label: 'Smoking', value: profileData.lifestyle.smoking, icon: <X size={18} /> },
                      { label: 'Drinking', value: profileData.lifestyle.drinking, icon: <X size={18} /> },
                    ].map((item, i) => (
                      <Grid size={{ xs: 6 }} key={i}>
                        <Box sx={{ p: 2, bgcolor: alpha(COLORS.accent, 0.05), borderRadius: '16px' }}>
                          <Typography variant="caption" sx={{ color: COLORS.textSecondary, fontWeight: 700, display: 'block', mb: 0.5 }}>{item.label}</Typography>
                          <Typography variant="body2" sx={{ fontWeight: 800, color: COLORS.accent }}>{item.value}</Typography>
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
                        <Typography variant="body1" sx={{ fontWeight: 800 }}>{profileData.lifestyle.careerAmbitions}</Typography>
                      </Box>
                      <Box>
                        <Typography variant="caption" sx={{ color: COLORS.textSecondary, fontWeight: 700, display: 'block', mb: 0.5 }}>Family Plans</Typography>
                        <Typography variant="body1" sx={{ fontWeight: 800 }}>{profileData.lifestyle.familyPlans}</Typography>
                      </Box>
                    </Stack>
                  </Paper>

                  <Paper sx={{ p: 4, borderRadius: '24px', boxShadow: '0 2px 16px rgba(0,0,0,0.03)' }}>
                    <Typography variant="h6" sx={{ mb: 3, fontWeight: 800, color: COLORS.primary }}>Social Preferences</Typography>
                    <Box sx={{ px: 2, pt: 2 }}>
                      <Slider
                        disabled
                        value={profileData.lifestyle.socialPreference}
                        sx={{ color: COLORS.secondary }}
                      />
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1 }}>
                        <Typography variant="caption" sx={{ fontWeight: 700, color: COLORS.textSecondary }}>Introvert</Typography>
                        <Typography variant="caption" sx={{ fontWeight: 700, color: COLORS.textSecondary }}>Extrovert</Typography>
                      </Box>
                      <Typography variant="body2" sx={{ mt: 2, textAlign: 'center', fontWeight: 800, color: COLORS.secondary }}>
                        {profileData.lifestyle.socialPreference > 50 ? 'Leans towards Extrovert' : 'Leans towards Introvert'}
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
                sx={{ borderRadius: '12px', color: COLORS.accent, borderColor: COLORS.accent, fontWeight: 700 }}
              >
                Upload New
              </Button>
            </Box>
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
                      <IconButton sx={{ bgcolor: 'white', color: 'error.main', '&:hover': { bgcolor: 'error.main', color: 'white' } }}>
                        <Trash2 size={20} />
                      </IconButton>
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
                      <Switch checked={profileData.privacy.showLastSeen} color="primary" />
                    </Box>
                    <Divider />
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Box>
                        <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>Show my horoscope to matches</Typography>
                        <Typography variant="body2" sx={{ color: COLORS.textSecondary }}>Matches can view your detailed birth chart</Typography>
                      </Box>
                      <Switch checked={profileData.privacy.showHoroscope} color="primary" />
                    </Box>
                    <Divider />
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Box>
                        <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>Show my phone number to matches</Typography>
                        <Typography variant="body2" sx={{ color: COLORS.textSecondary }}>Verified matches can see your contact number</Typography>
                      </Box>
                      <Switch checked={profileData.privacy.showPhone} color="primary" />
                    </Box>
                    
                    <Box sx={{ mt: 2 }}>
                      <Typography variant="subtitle1" sx={{ fontWeight: 800, mb: 2 }}>Who can message me</Typography>
                      <Stack direction="row" spacing={1}>
                        {['Everyone', 'Matches Only', 'No One'].map(option => (
                          <Chip 
                            key={option} 
                            label={option} 
                            onClick={() => {}}
                            sx={{ 
                              bgcolor: profileData.privacy.whoCanMessage === option ? COLORS.primary : COLORS.cream,
                              color: profileData.privacy.whoCanMessage === option ? 'white' : COLORS.primary,
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
                            onClick={() => {}}
                            sx={{ 
                              bgcolor: profileData.privacy.whoCanSeePhotos === option ? COLORS.primary : COLORS.cream,
                              color: profileData.privacy.whoCanSeePhotos === option ? 'white' : COLORS.primary,
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


