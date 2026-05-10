import React, { useMemo, useState } from 'react';
import { Box, Container, Grid, Typography, Stack, IconButton, Divider, Button, TextField } from '@mui/material';
import { Link } from 'react-router-dom';
import { Facebook, Instagram, Twitter, LinkedIn, Mail, LocationOn } from '@mui/icons-material';
import { MARKETING_COLORS as COLORS } from '../constants/colors';

export default function MarketingFooter() {
  const [email, setEmail] = useState('');

  const newsletterHref = useMemo(() => {
    const safeEmail = email.trim();
    const body = safeEmail
      ? `Please add ${safeEmail} to the RaashiLink.AI newsletter.`
      : 'Please add me to the RaashiLink.AI newsletter.';
    return `mailto:hello@raashilink.ai?subject=${encodeURIComponent('Newsletter Subscription')}&body=${encodeURIComponent(body)}`;
  }, [email]);

  const socialLinks = [
    { icon: Facebook, href: 'https://www.facebook.com', label: 'Facebook' },
    { icon: Instagram, href: 'https://www.instagram.com', label: 'Instagram' },
    { icon: Twitter, href: 'https://x.com', label: 'X' },
    { icon: LinkedIn, href: 'https://www.linkedin.com', label: 'LinkedIn' },
  ];

  return (
    <Box sx={{ bgcolor: COLORS.cream, pt: { xs: 7, md: 8 }, pb: { xs: 4, md: 5 }, borderTop: '1px solid rgba(0,0,0,0.06)' }}>
      <Container maxWidth="lg">
        <Grid container spacing={{ xs: 4, md: 5 }} alignItems="flex-start">
          {/* Brand & Social Column - Left */}
          <Grid item xs={12} md={3.5}>
            <Stack spacing={2.25}>
              <Stack direction="row" spacing={1.5} alignItems="center">
                <Box
                  component="img"
                  src="/RaashiLink_Logo.png"
                  alt="RaashiLink Logo"
                  sx={{ width: 64, height: 64, objectFit: 'contain', ml: -1.5 }}
                />
                <Typography variant="h5" sx={{ color: COLORS.primary, fontWeight: 900, letterSpacing: -0.5 }}>
                  RaashiLink.AI
                </Typography>
              </Stack>
              <Typography variant="caption" sx={{ color: COLORS.primary, fontWeight: 700, letterSpacing: 0.15 }}>
                හදවත් දෙකක්, එක ගමනක්.
              </Typography>
              <Typography variant="body2" sx={{ color: COLORS.textSecondary, lineHeight: 1.6, display: 'block' }}>
                Smart matchmaking and wedding planning built for Sri Lankan couples.
              </Typography>
              <Stack direction="row" spacing={1.5}>
                {socialLinks.map(({ icon: Icon, href, label }) => (
                  <IconButton 
                    key={label}
                    size="small" 
                    component="a"
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={label}
                    sx={{ 
                      color: COLORS.primary, 
                      bgcolor: 'white',
                      width: 32,
                      height: 32,
                      boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
                      '&:hover': { bgcolor: COLORS.primary, color: 'white' }
                    }}
                  >
                    <Icon sx={{ fontSize: 16 }} />
                  </IconButton>
                ))}
              </Stack>
            </Stack>
          </Grid>

          {/* Links Section - Middle */}
          <Grid item xs={12} md={4.5}>
            <Grid container spacing={2} justifyContent="flex-start">
              {/* Platform Links */}
              <Grid item xs={6}>
                <Typography variant="subtitle2" sx={{ fontWeight: 900, color: COLORS.textPrimary, mb: 2, display: 'block', letterSpacing: 1, textTransform: 'uppercase' }}>
                  Platform
                </Typography>
                <Stack spacing={1.5}>
                  {[
                    { label: 'Features', path: '/features' },
                    { label: 'How it Works', path: '/how-it-works' },
                    { label: 'About Us', path: '/about-us' }
                  ].map((link) => (
                    <Typography 
                      key={link.label}
                      variant="body2" 
                      component={Link} 
                      to={link.path}
                      sx={{
                        color: COLORS.textSecondary,
                        textDecoration: 'none',
                        transition: 'color 0.2s ease, transform 0.2s ease',
                        display: 'inline-block',
                        '&:hover': { color: COLORS.primary, transform: 'translateX(4px)' },
                      }}
                    >
                      {link.label}
                    </Typography>
                  ))}
                </Stack>
              </Grid>

              {/* Company Links */}
              <Grid item xs={6}>
                <Typography variant="subtitle2" sx={{ fontWeight: 900, color: COLORS.textPrimary, mb: 2, display: 'block', letterSpacing: 1, textTransform: 'uppercase' }}>
                  Company
                </Typography>
                <Stack spacing={1.5}>
                  {[
                    { label: 'Find a Match', path: '/register' },
                    { label: 'Vendor Sign Up', path: '/register' },
                    { label: 'Login', path: '/login' }
                  ].map((link) => (
                    <Typography 
                      key={link.label}
                      variant="body2" 
                      component={Link} 
                      to={link.path}
                      sx={{
                        color: COLORS.textSecondary,
                        textDecoration: 'none',
                        transition: 'color 0.2s ease, transform 0.2s ease',
                        display: 'inline-block',
                        '&:hover': { color: COLORS.primary, transform: 'translateX(4px)' },
                      }}
                    >
                      {link.label}
                    </Typography>
                  ))}
                </Stack>
              </Grid>
            </Grid>
          </Grid>

          {/* Newsletter Column - Right */}
          <Grid item xs={12} md={4} sx={{ display: 'flex', justifyContent: { xs: 'flex-start', md: 'flex-end' } }}>
            <Box sx={{ width: '100%', maxWidth: 380, bgcolor: 'rgba(139,26,46,0.04)', p: 3, borderRadius: '20px', border: '1px solid rgba(139,26,46,0.08)' }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 900, color: COLORS.primary, mb: 1, letterSpacing: -0.5 }}>
                Stay Updated
              </Typography>
              <Typography variant="caption" sx={{ color: COLORS.textSecondary, mb: 2, display: 'block' }}>
                Get occasional updates on features, wedding ideas, and planning tips.
              </Typography>
              <Stack direction="row" spacing={1}>
                <TextField 
                  placeholder="Email address" 
                  variant="outlined" 
                  size="small" 
                  fullWidth
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  sx={{ 
                    '& .MuiOutlinedInput-root': { 
                      bgcolor: 'white', 
                      borderRadius: '10px',
                      fontSize: '0.8rem',
                      '& fieldset': { borderColor: 'rgba(0,0,0,0.1)' }
                    } 
                  }} 
                />
                <Button 
                  component="a"
                  href={newsletterHref}
                  aria-label="Join newsletter"
                  variant="contained" 
                  sx={{ 
                    bgcolor: COLORS.primary, 
                    color: 'white', 
                    px: 3, 
                    borderRadius: '10px',
                    fontWeight: 800,
                    textTransform: 'none',
                    '&:hover': { bgcolor: '#6B1422' }
                  }}
                >
                  Join
                </Button>
              </Stack>
            </Box>
          </Grid>
        </Grid>

        <Divider sx={{ my: { xs: 4, md: 5 }, opacity: 0.08 }} />

        <Stack direction={{ xs: 'column', md: 'row' }} justifyContent="space-between" alignItems="center" spacing={2}>
          <Typography variant="caption" sx={{ color: COLORS.textSecondary, fontWeight: 500 }}>
            © 2026 RaashiLink.AI. Engineering happily ever after.
          </Typography>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={{ xs: 1, sm: 3 }} alignItems={{ xs: 'center', sm: 'flex-start' }}>
            <Stack direction="row" spacing={1} alignItems="center">
              <Mail sx={{ fontSize: 14, color: COLORS.secondary }} />
              <Typography component="a" href="mailto:hello@raashilink.ai" variant="caption" sx={{ color: COLORS.textSecondary, textDecoration: 'none' }}>
                hello@raashilink.ai
              </Typography>
            </Stack>
            <Stack direction="row" spacing={1} alignItems="center">
              <LocationOn sx={{ fontSize: 14, color: COLORS.secondary }} />
              <Typography variant="caption" sx={{ color: COLORS.textSecondary }}>Colombo, Sri Lanka</Typography>
            </Stack>
          </Stack>
        </Stack>
      </Container>
    </Box>
  );
}
