import React from 'react';
import { Box, Container, Typography, Grid, Stack, Button, Card, CardContent } from '@mui/material';
import { Link } from 'react-router-dom';
import { AccountCircle, Star, Favorite, CalendarMonth, Checklist, Store, TravelExplore } from '@mui/icons-material';
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

export default function HowItWorksPage() {
  const steps = [
    {
      icon: <AccountCircle />,
      title: 'Create Your Profile',
      desc: 'Register with your personal details and birth data. This powers horoscope calculations and recommendation quality from day one.',
    },
    {
      icon: <Star />,
      title: 'Review Compatibility',
      desc: 'Get astrology-backed and AI-enhanced match suggestions, including compatibility signals before starting conversations.',
    },
    {
      icon: <Favorite />,
      title: 'Connect Through Mutual Interest',
      desc: 'Messaging unlocks after mutual interest, giving a safer and more intentional way to start real conversations.',
    },
    {
      icon: <Checklist />,
      title: 'Plan Together',
      desc: 'Once matched, use wedding planning tools such as budget, checklists, and shared milestones in one place.',
    },
    {
      icon: <Store />,
      title: 'Book Trusted Vendors',
      desc: 'Discover verified vendors, compare options, and track requests through the integrated marketplace workflow.',
    },
    {
      icon: <TravelExplore />,
      title: 'Extend To Honeymoon Planning',
      desc: 'Continue the journey with destination recommendations and planning support for post-wedding travel.',
    },
  ];

  return (
    <Box sx={{ bgcolor: 'white' }}>
      <MarketingHeader />
      <PageHero title="How It Works" />

      <Container sx={{ py: { xs: 10, md: 12 } }}>
        <Stack spacing={2} sx={{ textAlign: 'center', mb: { xs: 6, md: 8 } }}>
          <Typography variant="overline" sx={{ color: COLORS.secondary, letterSpacing: 2, fontWeight: 800 }}>
            END-TO-END FLOW
          </Typography>
          <Typography variant="h4" sx={{ fontFamily: 'Playfair Display', fontWeight: 700, color: COLORS.primary }}>
            From First Match To Wedding Execution
          </Typography>
          <Typography variant="body1" sx={{ color: COLORS.textSecondary, maxWidth: 860, mx: 'auto' }}>
            RaashiLink.AI guides users through a practical sequence: discover compatibility, build trust, collaborate,
            and execute wedding decisions with less friction.
          </Typography>
        </Stack>

        <Grid container spacing={3}>
          {steps.map((step, idx) => (
            <Grid item xs={12} md={6} key={step.title}>
              <Card sx={{ height: '100%', borderRadius: '20px', border: '1px solid rgba(0,0,0,0.06)', boxShadow: '0 8px 24px rgba(16,24,40,0.06)' }}>
                <CardContent sx={{ p: 3.25, height: '100%', display: 'flex', gap: 2 }}>
                  <Box
                    sx={{
                      width: 46,
                      height: 46,
                      flexShrink: 0,
                      borderRadius: '12px',
                      bgcolor: 'rgba(139,26,46,0.1)',
                      color: COLORS.primary,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    {step.icon}
                  </Box>
                  <Box>
                    <Typography variant="caption" sx={{ color: COLORS.secondary, fontWeight: 800, letterSpacing: 1 }}>
                      STEP {String(idx + 1).padStart(2, '0')}
                    </Typography>
                    <Typography variant="h6" sx={{ mt: 0.5, mb: 1, fontWeight: 800, color: COLORS.textPrimary }}>
                      {step.title}
                    </Typography>
                    <Typography variant="body2" sx={{ color: COLORS.textSecondary, lineHeight: 1.7 }}>
                      {step.desc}
                    </Typography>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>

        <Box sx={{ mt: { xs: 8, md: 10 }, p: { xs: 3, md: 4 }, bgcolor: COLORS.cream, borderRadius: '20px', border: '1px solid rgba(0,0,0,0.05)' }}>
          <Typography variant="h6" sx={{ fontWeight: 800, mb: 1, color: COLORS.primary }}>
            Why this workflow works
          </Typography>
          <Typography variant="body2" sx={{ color: COLORS.textSecondary, lineHeight: 1.8 }}>
            Each stage removes uncertainty before moving forward. Users gain compatibility clarity first, then communicate,
            then plan and purchase, which improves confidence and reduces decision overload.
          </Typography>
        </Box>

        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} justifyContent="center" sx={{ mt: 6 }}>
          <Button component={Link} to="/register" variant="contained" sx={{ bgcolor: COLORS.secondary, color: COLORS.primary, fontWeight: 800, px: 5, py: 1.3, borderRadius: '28px' }}>
            Start Your Journey
          </Button>
          <Button component={Link} to="/features" variant="outlined" sx={{ borderColor: COLORS.primary, color: COLORS.primary, fontWeight: 700, px: 4.5, py: 1.3, borderRadius: '28px' }}>
            View Platform Features
          </Button>
        </Stack>
      </Container>

      <MarketingFooter />
    </Box>
  );
}
