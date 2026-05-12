import React from 'react';
import { Box, Container, Typography, Grid, Stack, Card, CardContent, Divider, Chip } from '@mui/material';
import MarketingHeader from '../components/MarketingHeader';
import MarketingFooter from '../components/MarketingFooter';
import { MARKETING_COLORS as COLORS } from '../constants/colors';

const PageHero = ({ title }: { title: string }) => (
  <Box sx={{ bgcolor: COLORS.primary, pt: 20, pb: 12, color: 'white', textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
    <Box sx={{ position: 'absolute', inset: 0, opacity: 0.1, backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)', backgroundSize: '30px 30px' }} />
    <Container sx={{ position: 'relative', zIndex: 1 }}>
      <Typography variant="h2" sx={{ fontFamily: 'Playfair Display', fontWeight: 700, mb: 2 }}>{title}</Typography>
      <Box sx={{ width: 80, height: 4, bgcolor: COLORS.secondary, mx: 'auto', borderRadius: 2 }} />
    </Container>
  </Box>
);

export default function AboutUsPage() {
  const heroHighlights = [
    'Smart Matchmaking + Cultural Compatibility',
    'Guided Planning from First Chat to Wedding Day',
    'One Platform for Couples, Families, and Vendors',
  ];

  const values = [
    {
      title: 'Cultural Intelligence',
      desc: 'We combine local relationship traditions with modern product design so families and couples can make decisions with confidence.',
    },
    {
      title: 'Product Reliability',
      desc: 'From profile onboarding to wedding execution, every flow is designed for speed, clarity, and predictable outcomes.',
    },
    {
      title: 'Human-Centered AI',
      desc: 'Our intelligence features support better choices while keeping people in control of what matters most.',
    },
  ];

  const trustPillars = [
    {
      title: 'Privacy & Control',
      desc: 'Personal profile data, preferences, and planning details are managed with strict access rules and clear user control.',
    },
    {
      title: 'End-to-End Platform',
      desc: 'Matchmaking, astrology insights, chat, vendor discovery, and planning live in one connected experience.',
    },
    {
      title: 'Built for Real Outcomes',
      desc: 'Our focus is practical progress: better conversations, better matches, and better wedding execution.',
    },
  ];

  return (
    <Box sx={{ bgcolor: 'white' }}>
      <MarketingHeader />
      <PageHero title="About Us" />

      <Container sx={{ py: { xs: 6, md: 8 } }}>
        <Grid container spacing={{ xs: 4, md: 7 }} alignItems="stretch">
          <Grid size={{ xs: 12, md: 6 }}>
            <Stack spacing={2}>
              <Typography variant="overline" sx={{ color: COLORS.secondary, fontWeight: 900, letterSpacing: 2 }}>
                WHO WE ARE
              </Typography>
              <Typography variant="h3" sx={{ fontFamily: 'Playfair Display', fontWeight: 700, color: COLORS.primary }}>
                A Modern Relationship & Wedding Intelligence Platform
              </Typography>
              <Typography variant="body1" sx={{ color: COLORS.textSecondary, lineHeight: 1.85 }}>
                RaashiLink.AI helps people move from discovery to commitment with less confusion and more confidence.
                We unite trusted cultural practices, intelligent guidance, and high-quality digital workflows in one
                commercial platform built for real life decisions.
              </Typography>
              <Typography variant="body1" sx={{ color: COLORS.textSecondary, lineHeight: 1.85 }}>
                Our mission is simple: deliver a premium, reliable experience for matchmaking and wedding planning,
                while preserving the values and context that matter to Sri Lankan users and families.
              </Typography>

              <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap" sx={{ pt: 1 }}>
                <Chip label="Commercial Platform" sx={{ bgcolor: 'rgba(139,26,46,0.1)', color: COLORS.primary, fontWeight: 700 }} />
                <Chip label="AI-Powered Guidance" sx={{ bgcolor: 'rgba(139,26,46,0.1)', color: COLORS.primary, fontWeight: 700 }} />
                <Chip label="Sri Lankan Market Focus" sx={{ bgcolor: 'rgba(139,26,46,0.1)', color: COLORS.primary, fontWeight: 700 }} />
              </Stack>
            </Stack>
          </Grid>

          <Grid size={{ xs: 12, md: 6 }}>
            <Box sx={{ borderRadius: '24px', overflow: 'hidden', height: { xs: 260, md: '100%' }, minHeight: { md: 380 }, position: 'relative' }}>
              <Box
                component="img"
                src="https://images.unsplash.com/photo-1606800052052-a08af7148866?auto=format&fit=crop&w=900&q=80"
                alt="Traditional Sri Lankan wedding decorations"
                sx={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
              />
              <Box
                sx={{
                  position: 'absolute',
                  bottom: 0,
                  left: 0,
                  right: 0,
                  background: 'linear-gradient(to top, rgba(139,26,46,0.9) 0%, rgba(139,26,46,0.58) 48%, transparent 100%)',
                  p: { xs: 2.5, md: 3 },
                }}
              >
                <Stack spacing={1.1}>
                  {heroHighlights.map((line) => (
                    <Box
                      key={line}
                      sx={{
                        px: 1.4,
                        py: 0.7,
                        borderRadius: '12px',
                        border: '1px solid rgba(255,255,255,0.38)',
                        bgcolor: 'rgba(255,255,255,0.16)',
                        boxShadow: '0 0 22px rgba(201,168,76,0.3)',
                        backdropFilter: 'blur(3px)',
                      }}
                    >
                      <Typography variant="body2" sx={{ color: 'white', fontWeight: 800, letterSpacing: 0.2 }}>
                        {line}
                      </Typography>
                    </Box>
                  ))}
                </Stack>
              </Box>
            </Box>
          </Grid>
        </Grid>

        <Box
          sx={{
            '@keyframes missionGlowPulse': {
              '0%': {
                boxShadow: '0 0 0 1px rgba(201,168,76,0.16), 0 18px 44px rgba(139,26,46,0.12), 0 0 34px rgba(201,168,76,0.16)',
              },
              '50%': {
                boxShadow: '0 0 0 1px rgba(201,168,76,0.24), 0 20px 48px rgba(139,26,46,0.16), 0 0 58px rgba(201,168,76,0.3)',
              },
              '100%': {
                boxShadow: '0 0 0 1px rgba(201,168,76,0.16), 0 18px 44px rgba(139,26,46,0.12), 0 0 34px rgba(201,168,76,0.16)',
              },
            },
            mt: { xs: 4, md: 5 },
            mb: { xs: 2, md: 3 },
            p: { xs: 2.5, md: 3.5 },
            borderRadius: '20px',
            position: 'relative',
            overflow: 'hidden',
            border: '1px solid rgba(201,168,76,0.35)',
            background: 'linear-gradient(120deg, rgba(139,26,46,0.08) 0%, rgba(201,168,76,0.14) 55%, rgba(26,107,114,0.08) 100%)',
            boxShadow: '0 0 0 1px rgba(201,168,76,0.16), 0 18px 44px rgba(139,26,46,0.12), 0 0 44px rgba(201,168,76,0.22)',
            animation: 'missionGlowPulse 4s ease-in-out infinite',
          }}
        >
          <Box
            sx={{
              position: 'absolute',
              inset: '-30% 45% auto -10%',
              height: 180,
              background: 'radial-gradient(circle, rgba(201,168,76,0.28) 0%, rgba(201,168,76,0) 70%)',
              pointerEvents: 'none',
            }}
          />
          <Stack spacing={1} sx={{ position: 'relative', zIndex: 1 }}>
            <Typography variant="overline" sx={{ color: COLORS.primary, fontWeight: 900, letterSpacing: 2 }}>
              OUR MISSION
            </Typography>
            <Typography variant="h5" sx={{ fontFamily: 'Playfair Display', fontWeight: 700, color: COLORS.primary, lineHeight: 1.4 }}>
              To help every couple make confident relationship and wedding decisions through trusted guidance, cultural relevance, and world-class digital experience.
            </Typography>
          </Stack>
        </Box>

        <Divider sx={{ my: { xs: 4, md: 5 } }} />

        <Typography variant="h4" sx={{ textAlign: 'center', fontFamily: 'Playfair Display', fontWeight: 700, color: COLORS.primary, mb: 4 }}>
          Core Principles
        </Typography>

        <Grid container spacing={3} alignItems="stretch">
          {values.map((value) => (
            <Grid size={{ xs: 12, md: 4 }} key={value.title} sx={{ display: 'flex' }}>
              <Card sx={{ flex: 1, borderRadius: '20px', border: '1px solid rgba(0,0,0,0.06)', boxShadow: '0 8px 22px rgba(16,24,40,0.06)' }}>
                <CardContent sx={{ p: 3.2, display: 'flex', flexDirection: 'column' }}>
                  <Typography variant="h6" sx={{ fontWeight: 800, color: COLORS.primary, mb: 1.25 }}>
                    {value.title}
                  </Typography>
                  <Typography variant="body2" sx={{ color: COLORS.textSecondary, lineHeight: 1.75 }}>
                    {value.desc}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>

        <Divider sx={{ my: { xs: 4, md: 5 } }} />

        <Typography variant="h4" sx={{ textAlign: 'center', fontFamily: 'Playfair Display', fontWeight: 700, color: COLORS.primary, mb: 4 }}>
          Why Clients Choose RaashiLink.AI
        </Typography>

        <Grid container spacing={3} alignItems="stretch">
          {trustPillars.map((pillar) => (
            <Grid size={{ xs: 12, md: 4 }} key={pillar.title} sx={{ display: 'flex' }}>
              <Card sx={{ flex: 1, borderRadius: '20px', border: '1px solid rgba(0,0,0,0.06)', boxShadow: '0 8px 22px rgba(16,24,40,0.06)' }}>
                <CardContent sx={{ p: 3.2, display: 'flex', flexDirection: 'column' }}>
                  <Typography variant="h6" sx={{ fontWeight: 800, color: COLORS.primary, mb: 1.25 }}>
                    {pillar.title}
                  </Typography>
                  <Typography variant="body2" sx={{ color: COLORS.textSecondary, lineHeight: 1.75 }}>
                    {pillar.desc}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>

        {/* Sri Lankan Wedding Visual */}
        <Box sx={{ mt: { xs: 4, md: 5 }, borderRadius: '24px', overflow: 'hidden', position: 'relative', height: { xs: 180, md: 240 } }}>
          <Box
            component="img"
            src="https://images.unsplash.com/photo-1465495976277-4387d4b0b4c6?auto=format&fit=crop&w=1400&q=80"
            alt="Sri Lankan wedding flowers and ceremony"
            sx={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
          />
          <Box
            sx={{
              position: 'absolute',
              inset: 0,
              background: 'rgba(139,26,46,0.45)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              textAlign: 'center',
            }}
          >
            <Typography variant="h5" sx={{ color: 'white', fontFamily: 'Playfair Display', fontWeight: 700, px: 3, maxWidth: 600, lineHeight: 1.5 }}>
              Trusted by Modern Couples. Built for Real-World Commitment.
            </Typography>
          </Box>
        </Box>
      </Container>

      <MarketingFooter />
    </Box>
  );
}
