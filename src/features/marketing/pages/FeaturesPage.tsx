import React from 'react';
import { motion } from 'motion/react';
import {
  Box,
  Container,
  Typography,
  Grid,
  Stack,
  Button,
  Card,
  CardContent,
  Chip,
  Divider,
} from '@mui/material';
import { Link } from 'react-router-dom';
import {
  Calculate,
  AutoGraph,
  CalendarMonth,
  Security,
  Message,
  Hub,
  VerifiedUser,
  Notifications,
  Store,
  Insights,
  Psychology,
} from '@mui/icons-material';
import MarketingHeader from '../components/MarketingHeader';
import MarketingFooter from '../components/MarketingFooter';
import { MARKETING_COLORS as COLORS } from '../constants/colors';

const PageHero = ({ title }: { title: string }) => (
  <Box
    sx={{
      bgcolor: COLORS.primary,
      pt: 20,
      pb: 12,
      color: 'white',
      textAlign: 'center',
      position: 'relative',
      overflow: 'hidden',
    }}
  >
    <Box
      sx={{
        position: 'absolute',
        inset: 0,
        opacity: 0.1,
        backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)',
        backgroundSize: '30px 30px',
      }}
    />
    <Container sx={{ position: 'relative', zIndex: 1 }}>
      <Typography variant="h2" sx={{ fontFamily: 'Playfair Display', fontWeight: 700, mb: 2 }}>
        {title}
      </Typography>
      <Box sx={{ width: 80, height: 4, bgcolor: COLORS.secondary, mx: 'auto', borderRadius: 2 }} />
    </Container>
  </Box>
);

const MotionBox = motion(Box);
export default function FeaturesPage() {
  const featureList = [
    {
      icon: <Calculate />,
      title: 'Vedic Horoscope Engine',
      desc: 'Swiss Ephemeris-backed horoscope calculations and compatibility flows designed for Sri Lankan matchmaking.',
      path: '/horoscope',
    },
    {
      icon: <AutoGraph />,
      title: 'AI Match Recommendations',
      desc: 'Collaborative filtering and preference scoring surface stronger partner recommendations over time.',
      path: '/matches',
    },
    {
      icon: <Message />,
      title: 'Mutual-Match Messaging',
      desc: 'Messaging unlocks after mutual interest, with conversation history, real-time delivery, and unread tracking.',
      path: '/messages',
    },
    {
      icon: <CalendarMonth />,
      title: 'Wedding Project Hub',
      desc: 'Manage budget, tasks, vendors, and planning status in one connected workspace for both partners.',
      path: '/wedding',
    },
    {
      icon: <Store />,
      title: 'Vendor Marketplace',
      desc: 'Explore vendors by category, location, pricing, and availability, then request and manage quotes.',
      path: '/vendors',
    },
    // {
    //   icon: <Psychology />,
    //   title: 'AI Life Guidance',
    //   desc: 'Chat-based assistant for relationship and planning guidance with language-aware, streaming responses.',
    //   path: '/life-guidance',
    // },
    {
      icon: <Notifications />,
      title: 'Realtime Notifications',
      desc: 'Socket-powered events for messages, invites, approvals, and workflow updates across the platform.',
      path: '/dashboard',
    },
    {
      icon: <VerifiedUser />,
      title: 'Vendor Approval Workflow',
      desc: 'Document-led vendor onboarding with admin review states for safer discovery and booking decisions.',
      path: '/register',
    },
    {
      icon: <Hub />,
      title: 'Integrated Platform Modules',
      desc: 'Auth, matchmaking, chat, vendors, wedding, honeymoon, and profile systems work as one product journey.',
      path: '/how-it-works',
    },
  ];

  const standards = [
    {
      title: 'Safety by Product Design',
      desc: 'Mutual-interest messaging, role-based access, and approval workflows reduce misuse and protect users.',
      icon: <Security sx={{ color: COLORS.primary }} />,
    },
    {
      title: 'Operational Reliability',
      desc: 'Background jobs, optional Redis caching, and resilient startup behavior keep core flows stable.',
      icon: <Insights sx={{ color: COLORS.primary }} />,
    },
    {
      title: 'Real-time User Experience',
      desc: 'Socket events and event-driven notifications keep both partners and vendors in sync without manual refreshes.',
      icon: <Notifications sx={{ color: COLORS.primary }} />,
    },
  ];

  const stack = [
    'React + Vite',
    'Node.js + Express',
    'MongoDB',
    'Socket.IO',
    'Redis (optional cache)',
    'Python recommendation engine',
    'Swiss Ephemeris compatibility engine',
    'Role-based admin/vendor controls',
  ];

  return (
    <Box sx={{ bgcolor: 'white' }}>
      <MarketingHeader />
      <PageHero title="Platform Features" />

      <MotionBox
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7 }}
      >
        <Container sx={{ py: { xs: 6, md: 8 } }}>
        <Stack spacing={2} sx={{ textAlign: 'center', mb: { xs: 4, md: 5 } }}>
          <Typography variant="overline" sx={{ color: COLORS.secondary, letterSpacing: 2, fontWeight: 800 }}>
            PRODUCT CAPABILITIES
          </Typography>
          <Typography variant="h4" sx={{ fontFamily: 'Playfair Display', fontWeight: 700, color: COLORS.primary }}>
            Built As A Full Match-To-Marriage Platform
          </Typography>
          <Typography variant="body1" sx={{ color: COLORS.textSecondary, maxWidth: 880, mx: 'auto' }}>
            RaashiLink.AI combines astrology, recommendations, secure communication, wedding planning,
            and vendor operations into one connected product experience.
          </Typography>
        </Stack>

        <Grid container spacing={3}>
          {featureList.map((f) => (
            <Grid size={{ xs: 12, sm: 4, md: 4 }} key={f.title} sx={{ display: 'flex' }}>
              <Card
                sx={{
                  flex: 1,
                  borderRadius: '20px',
                  border: '1px solid rgba(0,0,0,0.06)',
                  boxShadow: '0 8px 24px rgba(16,24,40,0.06)',
                  transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                  '&:hover': { transform: 'translateY(-4px)', boxShadow: '0 16px 30px rgba(16,24,40,0.12)' },
                }}
              >
                <CardContent sx={{ p: 3, flex: 1, display: 'flex', flexDirection: 'column' }}>
                  <Box
                    sx={{
                      width: 52,
                      height: 52,
                      bgcolor: 'rgba(139,26,46,0.1)',
                      borderRadius: '14px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: COLORS.primary,
                      mb: 2.25,
                    }}
                  >
                    {f.icon}
                  </Box>
                  <Typography variant="h6" sx={{ fontWeight: 800, mb: 1.25, color: COLORS.textPrimary }}>
                    {f.title}
                  </Typography>
                  <Typography variant="body2" sx={{ color: COLORS.textSecondary, lineHeight: 1.7, mb: 2, flexGrow: 1 }}>
                    {f.desc}
                  </Typography>
                  <Button
                    component={Link}
                    to={f.path}
                    size="small"
                    sx={{ p: 0, minWidth: 0, color: COLORS.primary, fontWeight: 700, textTransform: 'none', alignSelf: 'flex-start' }}
                  >
                    Explore
                  </Button>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>

        {/* Sri Lankan Wedding Photo Banner */}
        <Box
          sx={{
            mt: { xs: 5, md: 6 },
            borderRadius: '24px',
            overflow: 'hidden',
            position: 'relative',
            height: { xs: 200, md: 300 },
          }}
        >
          <Box
            component="img"
            src="https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=1400&q=80"
            alt="Sri Lankan wedding ceremony"
            sx={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
          />
          <Box
            sx={{
              position: 'absolute',
              inset: 0,
              background: 'linear-gradient(to right, rgba(139,26,46,0.72) 0%, rgba(139,26,46,0.15) 60%, transparent 100%)',
              display: 'flex',
              alignItems: 'center',
              pl: { xs: 3, md: 6 },
            }}
          >
            <Box sx={{ maxWidth: 400 }}>
              <Typography variant="h5" sx={{ color: 'white', fontFamily: 'Playfair Display', fontWeight: 700, mb: 1.5, lineHeight: 1.4 }}>
                Bringing Together Sri Lankan Traditions &amp; Modern Technology
              </Typography>
              <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.88)', lineHeight: 1.7 }}>
                Every feature is designed with Sri Lankan marriage customs, astrology, and cultural expectations at its core.
              </Typography>
            </Box>
          </Box>
        </Box>

        <Divider sx={{ my: { xs: 4, md: 5 } }} />

        <Grid container spacing={4} alignItems="stretch">
          <Grid size={{ xs: 12, md: 7 }}>
            <Typography variant="h5" sx={{ fontFamily: 'Playfair Display', fontWeight: 700, color: COLORS.primary, mb: 3 }}>
              Platform Standards
            </Typography>
            <Stack spacing={2.5}>
              {standards.map((item) => (
                <Card key={item.title} sx={{ borderRadius: '16px', border: '1px solid rgba(0,0,0,0.06)', boxShadow: 'none' }}>
                  <CardContent sx={{ p: 2.5 }}>
                    <Stack direction="row" spacing={2} alignItems="flex-start">
                      <Box sx={{ mt: 0.25 }}>{item.icon}</Box>
                      <Box>
                        <Typography variant="subtitle1" sx={{ fontWeight: 800, color: COLORS.textPrimary, mb: 0.5 }}>
                          {item.title}
                        </Typography>
                        <Typography variant="body2" sx={{ color: COLORS.textSecondary, lineHeight: 1.7 }}>
                          {item.desc}
                        </Typography>
                      </Box>
                    </Stack>
                  </CardContent>
                </Card>
              ))}
            </Stack>
          </Grid>

          <Grid size={{ xs: 12, md: 5 }}>
            <Card
              sx={{
                borderRadius: '18px',
                border: '1px solid rgba(0,0,0,0.06)',
                boxShadow: '0 8px 24px rgba(16,24,40,0.06)',
                height: '100%',
              }}
            >
              <CardContent sx={{ p: 3 }}>
                <Typography variant="h6" sx={{ fontWeight: 800, color: COLORS.primary, mb: 2 }}>
                  Technical Backbone
                </Typography>
                <Typography variant="body2" sx={{ color: COLORS.textSecondary, mb: 2.5, lineHeight: 1.7 }}>
                  The product is architected as modular domains across frontend and backend, allowing independent
                  feature growth without breaking the end-to-end user journey.
                </Typography>
                <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
                  {stack.map((item) => (
                    <Chip
                      key={item}
                      label={item}
                      size="small"
                      sx={{ bgcolor: 'rgba(139,26,46,0.08)', color: COLORS.primary, fontWeight: 700 }}
                    />
                  ))}
                </Stack>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
        </Container>
      </MotionBox>

      <MotionBox
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, delay: 0.2 }}
      >
        <Box sx={{ py: { xs: 6, md: 8 }, bgcolor: COLORS.primary, color: 'white' }}>
          <Container maxWidth="md" sx={{ textAlign: 'center' }}>
            <Typography variant="h3" sx={{ fontFamily: 'Playfair Display', mb: 2.5 }}>
              Ready to explore the full journey?
            </Typography>
            <Typography variant="body1" sx={{ mb: 3, opacity: 0.86 }}>
              Create your account and move from compatibility checks to real conversations and wedding planning,
              all inside one platform.
            </Typography>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} justifyContent="center">
              <Button
                component={Link}
                to="/register"
                variant="contained"
                sx={{ bgcolor: COLORS.secondary, color: COLORS.primary, fontWeight: 800, px: 5, py: 1.4, borderRadius: '30px' }}
              >
                Create Account
              </Button>
              <Button
                component={Link}
                to="/how-it-works"
                variant="outlined"
                sx={{ borderColor: 'rgba(255,255,255,0.75)', color: 'white', fontWeight: 700, px: 4.5, py: 1.4, borderRadius: '30px' }}
              >
                See How It Works
              </Button>
            </Stack>
          </Container>
        </Box>
      </MotionBox>
      <MarketingFooter />
    </Box>
  );
}
