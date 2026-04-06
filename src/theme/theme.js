import { alpha, createTheme, responsiveFontSizes } from '@mui/material/styles';

const commonTokens = {
  primary: '#8B1A2E',
  secondary: '#C9A84C',
  accent: '#1A6B72',
  cream: '#FAF7F2',
  white: '#FFFFFF',
  textPrimary: '#1C1C1C',
  textSecondary: '#555555',
  radiusCard: 12,
  radiusInput: 8,
  radiusPill: 24,
  shadowCard: '0 2px 16px rgba(139,26,46,0.08)',
};

const getPalette = (mode) => {
  const isDark = mode === 'dark';

  return {
    mode,
    primary: {
      main: commonTokens.primary,
      light: '#A73A4E',
      dark: '#65111F',
      contrastText: commonTokens.white,
    },
    secondary: {
      main: commonTokens.secondary,
      light: '#D9BB68',
      dark: '#9E7E2D',
      contrastText: commonTokens.primary,
    },
    info: {
      main: commonTokens.accent,
      light: '#3B8D93',
      dark: '#14555B',
      contrastText: commonTokens.white,
    },
    warning: {
      main: commonTokens.secondary,
      light: '#E4C983',
      dark: '#96761F',
      contrastText: commonTokens.primary,
    },
    success: {
      main: '#2E7D32',
      light: '#4CAF50',
      dark: '#1B5E20',
      contrastText: commonTokens.white,
    },
    error: {
      main: '#C62828',
      light: '#EF5350',
      dark: '#8E0000',
      contrastText: commonTokens.white,
    },
    background: {
      default: isDark ? '#1A1616' : commonTokens.cream,
      paper: isDark ? '#241D1E' : commonTokens.white,
    },
    text: {
      primary: isDark ? '#F5EDE7' : commonTokens.textPrimary,
      secondary: isDark ? '#D0C2BC' : commonTokens.textSecondary,
    },
    divider: isDark ? alpha('#FFFFFF', 0.08) : alpha(commonTokens.primary, 0.08),
    raashi: commonTokens,
  };
};

export const createAppTheme = (mode = 'light') => {
  const theme = createTheme({
    palette: getPalette(mode),
    shape: {
      borderRadius: commonTokens.radiusCard,
    },
    typography: {
      fontFamily: '"Inter", system-ui, sans-serif',
      h1: {
        fontFamily: '"Playfair Display", serif',
        fontWeight: 700,
        letterSpacing: '-0.02em',
      },
      h2: {
        fontFamily: '"Playfair Display", serif',
        fontWeight: 700,
        letterSpacing: '-0.02em',
      },
      h3: {
        fontFamily: '"Playfair Display", serif',
        fontWeight: 700,
      },
      h4: {
        fontFamily: '"Playfair Display", serif',
        fontWeight: 700,
      },
      h5: {
        fontFamily: '"Playfair Display", serif',
        fontWeight: 600,
      },
      h6: {
        fontFamily: '"Playfair Display", serif',
        fontWeight: 600,
      },
      body1: {
        fontFamily: '"Inter", system-ui, sans-serif',
        lineHeight: 1.7,
      },
      body2: {
        fontFamily: '"Inter", system-ui, sans-serif',
        lineHeight: 1.6,
      },
      button: {
        fontFamily: '"Inter", system-ui, sans-serif',
        fontWeight: 700,
        textTransform: 'none',
      },
    },
    breakpoints: {
      values: {
        xs: 0,
        sm: 480,
        md: 768,
        lg: 1200,
        xl: 1536,
      },
    },
    components: {
      MuiCssBaseline: {
        styleOverrides: {
          body: {
            backgroundColor: mode === 'dark' ? '#1A1616' : commonTokens.cream,
            color: mode === 'dark' ? '#F5EDE7' : commonTokens.textPrimary,
          },
          '#root': {
            minHeight: '100vh',
          },
        },
      },
      MuiButton: {
        defaultProps: {
          disableElevation: true,
        },
        styleOverrides: {
          root: {
            borderRadius: commonTokens.radiusInput,
            paddingInline: 18,
            paddingBlock: 10,
            transition: 'transform 0.2s ease, background-color 0.2s ease, box-shadow 0.2s ease',
            '&:hover': {
              transform: 'translateY(-1px)',
            },
          },
          containedPrimary: {
            boxShadow: commonTokens.shadowCard,
          },
          containedSecondary: {
            color: commonTokens.primary,
          },
        },
      },
      MuiCard: {
        styleOverrides: {
          root: {
            borderRadius: commonTokens.radiusCard,
            boxShadow: commonTokens.shadowCard,
            border: `1px solid ${alpha(commonTokens.primary, 0.06)}`,
          },
        },
      },
      MuiPaper: {
        styleOverrides: {
          rounded: {
            borderRadius: commonTokens.radiusCard,
          },
        },
      },
      MuiTextField: {
        defaultProps: {
          variant: 'outlined',
        },
      },
      MuiOutlinedInput: {
        styleOverrides: {
          root: {
            borderRadius: commonTokens.radiusInput,
            backgroundColor: alpha(commonTokens.white, mode === 'dark' ? 0.03 : 0.85),
            '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
              borderColor: commonTokens.secondary,
              boxShadow: `0 0 0 3px ${alpha(commonTokens.secondary, 0.16)}`,
            },
          },
          notchedOutline: {
            borderColor: alpha(commonTokens.primary, 0.12),
          },
        },
      },
      MuiChip: {
        styleOverrides: {
          root: {
            borderRadius: commonTokens.radiusPill,
            fontWeight: 700,
          },
          filled: {
            backgroundColor: alpha(commonTokens.secondary, 0.16),
            color: commonTokens.primary,
          },
        },
      },
      MuiSkeleton: {
        styleOverrides: {
          root: {
            transform: 'none',
            backgroundColor: alpha(commonTokens.primary, 0.08),
          },
        },
      },
    },
  });

  return responsiveFontSizes(theme);
};

export default createAppTheme;
