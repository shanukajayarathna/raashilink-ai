import React, { useState, useEffect } from 'react';
import { Box, Container, Stack, Typography, Button, useTheme, useMediaQuery } from '@mui/material';
import { Link, useLocation } from 'react-router-dom';
import { MARKETING_COLORS as COLORS } from '../constants/colors';

export default function MarketingHeader() {
  const [isScrolled, setIsScrolled] = useState(typeof window !== 'undefined' ? window.scrollY > 50 : false);
  const location = useLocation();
  const isHomePage = location.pathname === '/';
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Always show solid background if not on homepage or if scrolled
  const showSolidBg = !isHomePage || isScrolled;
  const authButtonSx = {
    bgcolor: COLORS.secondary,
    color: COLORS.primary,
    fontWeight: 800,
    borderRadius: '12px',
    px: 3,
    boxShadow: showSolidBg ? 'none' : '0 10px 20px rgba(201,168,76,0.3)',
    '&:hover': {
      bgcolor: COLORS.white,
      color: COLORS.primary,
      transform: 'translateY(-2px)'
    }
  };

  return (
    <Box
      sx={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 1000,
        transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
        py: showSolidBg ? 1 : 2,
        bgcolor: showSolidBg ? 'rgba(255, 255, 255, 0.95)' : 'transparent',
        backdropFilter: showSolidBg ? 'blur(12px)' : 'none',
        boxShadow: showSolidBg ? '0 10px 30px rgba(0,0,0,0.08)' : 'none',
      }}
    >
      <Container sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Stack 
          direction="row" 
          spacing={1} 
          alignItems="center" 
          component={Link} 
          to="/"
          sx={{ textDecoration: 'none', position: 'relative', height: 48 }}
        >
          <Box
            component="img"
            src="/RaashiLink_Logo.png"
            alt="RaashiLink Logo"
            sx={{ 
              width: 100, 
              height: 100, 
              objectFit: 'contain',
              position: 'absolute',
              left: -25,
              top: '50%',
              transform: 'translateY(-50%)',
              filter: showSolidBg 
                ? 'drop-shadow(0 4px 8px rgba(0,0,0,0.1))' 
                : 'brightness(0) invert(1) drop-shadow(0 0 15px rgba(255,255,255,0.5))',
              transition: 'all 0.4s ease'
            }}
          />
          <Typography variant="h5" sx={{ 
            ml: '50px !important',
            color: showSolidBg ? COLORS.primary : 'white', 
            fontWeight: 900, 
            fontFamily: 'Playfair Display',
            letterSpacing: '-0.5px',
            textShadow: showSolidBg ? 'none' : '0 2px 15px rgba(0,0,0,0.4)',
            transition: 'all 0.4s ease'
          }}>
            RaashiLink.AI
          </Typography>
        </Stack>

        <Stack direction="row" spacing={5} alignItems="center" sx={{ display: { xs: 'none', md: 'flex' } }}>
          {[
            { label: 'Features', path: '/features' },
            { label: 'How it Works', path: '/how-it-works' },
            { label: 'About Us', path: '/about-us' }
          ].map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Typography 
                key={item.label} 
                variant="body2" 
                component={Link}
                to={item.path}
                sx={{ 
                  color: showSolidBg ? (isActive ? COLORS.primary : COLORS.textPrimary) : 'white', 
                  fontWeight: isActive ? 800 : 600, 
                  cursor: 'pointer',
                  textDecoration: 'none',
                  position: 'relative',
                  textShadow: showSolidBg ? 'none' : '0 1px 8px rgba(0,0,0,0.3)',
                  transition: '0.3s',
                  '&:after': {
                    content: '""',
                    position: 'absolute',
                    bottom: -4,
                    left: 0,
                    width: isActive ? '100%' : 0,
                    height: 2,
                    bgcolor: COLORS.secondary,
                    transition: 'width 0.3s ease'
                  },
                  '&:hover': { 
                    color: COLORS.secondary,
                    '&:after': { width: '100%' }
                  }
                }}
              >
                {item.label}
              </Typography>
            );
          })}
          
          <Stack direction="row" spacing={2}>
            <Button 
              component={Link} 
              to="/login" 
              variant="contained"
              sx={authButtonSx}
            >
              Login
            </Button>
            <Button 
              component={Link} 
              to="/register" 
              variant="contained" 
              sx={authButtonSx}
            >
              Register
            </Button>
          </Stack>
        </Stack>
      </Container>
    </Box>
  );
}
