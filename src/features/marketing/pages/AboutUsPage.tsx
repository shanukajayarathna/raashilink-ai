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
  const highlights = [
    {
      title: 'Individual Final Year Project',
      desc: 'RaashiLink.AI is developed as an individual university final year project by KGST Jayarathna.',
    },
    {
      title: 'Academic Supervision',
      desc: 'Project guidance and supervision are provided by Ms. Sanuli Weerasinghe throughout design and implementation.',
    },
    {
      title: 'Domain Consultation',
      desc: 'Astrological direction and practical validation were supported by specialists in the horoscope field in Horana.',
    },
  ];

  const values = [
    {
      title: 'Cultural Relevance',
      desc: 'The platform aligns modern UX with Sri Lankan marriage expectations and astrology-centered decision making.',
    },
    {
      title: 'Engineering Discipline',
      desc: 'Architecture is modular across auth, matching, messaging, wedding planning, vendors, and analytics workflows.',
    },
    {
      title: 'Practical Impact',
      desc: 'The objective is to reduce friction from first discovery to wedding planning with one integrated product flow.',
    },
  ];

  return (
    <Box sx={{ bgcolor: 'white' }}>
      <MarketingHeader />
      <PageHero title="About Us" />

      <Container sx={{ py: { xs: 10, md: 12 } }}>
        <Grid container spacing={{ xs: 4, md: 7 }} alignItems="stretch">
          <Grid item xs={12} md={6}>
            <Stack spacing={2}>
              <Typography variant="overline" sx={{ color: COLORS.secondary, fontWeight: 900, letterSpacing: 2 }}>
                PROJECT CONTEXT
              </Typography>
              <Typography variant="h3" sx={{ fontFamily: 'Playfair Display', fontWeight: 700, color: COLORS.primary }}>
                Built As A Focused Academic Product
              </Typography>
              <Typography variant="body1" sx={{ color: COLORS.textSecondary, lineHeight: 1.85 }}>
                This platform was designed and developed as an individual university final year project by KGST Jayarathna.
                It is not presented as group work. The implementation combines software engineering, product design,
                and domain-led decision support for matchmaking and wedding planning.
              </Typography>
              <Typography variant="body1" sx={{ color: COLORS.textSecondary, lineHeight: 1.85 }}>
                Academic supervision was provided by Ms. Sanuli Weerasinghe, and domain-level insights were informed by
                horoscope specialists in Horana to keep astrological flows grounded in local practice.
              </Typography>

              <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap" sx={{ pt: 1 }}>
                <Chip label="Final Year Project" sx={{ bgcolor: 'rgba(139,26,46,0.1)', color: COLORS.primary, fontWeight: 700 }} />
                <Chip label="Individual Development" sx={{ bgcolor: 'rgba(139,26,46,0.1)', color: COLORS.primary, fontWeight: 700 }} />
                <Chip label="Sri Lankan Context" sx={{ bgcolor: 'rgba(139,26,46,0.1)', color: COLORS.primary, fontWeight: 700 }} />
              </Stack>
            </Stack>
          </Grid>

          <Grid item xs={12} md={6}>
            <Card sx={{ borderRadius: '24px', border: '1px solid rgba(0,0,0,0.06)', boxShadow: '0 12px 30px rgba(16,24,40,0.08)', height: '100%' }}>
              <CardContent sx={{ p: { xs: 3, md: 4 }, height: '100%' }}>
                <Typography variant="h6" sx={{ fontWeight: 800, color: COLORS.primary, mb: 2 }}>
                  Project Statement
                </Typography>
                <Typography variant="body2" sx={{ color: COLORS.textSecondary, lineHeight: 1.8, mb: 2 }}>
                  RaashiLink.AI demonstrates how data-driven recommendations, secure communication, and cultural logic
                  can be combined into a coherent digital journey for modern Sri Lankan users.
                </Typography>
                <Divider sx={{ my: 2 }} />
                <Stack spacing={1.5}>
                  <Typography variant="body2" sx={{ color: COLORS.textSecondary }}>
                    • Developed by: KGST Jayarathna
                  </Typography>
                  <Typography variant="body2" sx={{ color: COLORS.textSecondary }}>
                    • Supervisor: Ms. Sanuli Weerasinghe
                  </Typography>
                  <Typography variant="body2" sx={{ color: COLORS.textSecondary }}>
                    • Domain support: Horoscope specialists (Horana)
                  </Typography>
                </Stack>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        <Divider sx={{ my: { xs: 8, md: 10 } }} />

        <Typography variant="h4" sx={{ textAlign: 'center', fontFamily: 'Playfair Display', fontWeight: 700, color: COLORS.primary, mb: 6 }}>
          Core Principles
        </Typography>

        <Grid container spacing={3} alignItems="stretch">
          {values.map((value) => (
            <Grid item xs={12} md={4} key={value.title}>
              <Card sx={{ borderRadius: '20px', border: '1px solid rgba(0,0,0,0.06)', boxShadow: '0 8px 22px rgba(16,24,40,0.06)', height: '100%' }}>
                <CardContent sx={{ p: 3.2, minHeight: 220, display: 'flex', flexDirection: 'column' }}>
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
      </Container>

      <MarketingFooter />
    </Box>
  );
}
