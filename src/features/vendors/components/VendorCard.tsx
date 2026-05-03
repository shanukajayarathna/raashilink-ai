import React from 'react';
import { 
  Card, CardContent, Box, Typography, Chip, 
  Stack, IconButton, Rating, Button, 
  useTheme, useMediaQuery, Grid
} from '@mui/material';
import { 
  Heart, MapPin, CheckCircle2, Star, 
  ChevronRight, ExternalLink, MessageSquare 
} from 'lucide-react';
import { motion } from 'motion/react';
import { Link } from 'react-router-dom';

const COLORS = {
  primary: '#8B1A2E',
  secondary: '#C9A84C',
  accent: '#1A6B72',
  cream: '#FAF7F2',
  white: '#FFFFFF',
  textPrimary: '#1C1C1C',
  textSecondary: '#555555',
  success: '#2E7D32',
  error: '#D32F2F',
  warning: '#ED6C02'
};

interface VendorCardProps {
  vendor: {
    id: string | number;
    name: string;
    category: string;
    rating: number;
    reviewCount: number;
    location: string;
    priceRange: string;
    description: string;
    image: string;
    portfolio: string[];
    verified: boolean;
    popular?: boolean;
    isFavorite?: boolean;
    city?: string;
    serviceArea?: string[];
    minPrice?: number;
    maxPrice?: number;
    availabilityCalendar?: any[];
  };
  onRequestQuote: (vendor: any) => void;
  disabled?: boolean;
}

const MotionCard = motion(Card);

export default function VendorCard({ vendor, onRequestQuote, disabled }: VendorCardProps) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  return (
    <MotionBox
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -8 }}
      transition={{ duration: 0.3 }}
    >
      <Card sx={{ 
        borderRadius: 6, 
        overflow: 'hidden', 
        border: '1px solid', 
        borderColor: 'divider',
        boxShadow: '0 4px 20px rgba(0,0,0,0.03)',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        position: 'relative'
      }}>
        {/* Popular Badge */}
        {vendor.popular && (
          <Box sx={{ 
            position: 'absolute', 
            top: 12, 
            left: 12, 
            zIndex: 2,
            bgcolor: COLORS.accent,
            color: 'white',
            px: 1.5,
            py: 0.5,
            borderRadius: 2,
            fontSize: '0.7rem',
            fontWeight: 800,
            boxShadow: '0 4px 10px rgba(0,0,0,0.2)'
          }}>
            POPULAR
          </Box>
        )}

        {/* Favorite Button */}
        <IconButton 
          sx={{ 
            position: 'absolute', 
            top: 12, 
            right: 12, 
            zIndex: 2,
            bgcolor: 'rgba(255,255,255,0.8)',
            backdropFilter: 'blur(4px)',
            color: vendor.isFavorite ? COLORS.error : COLORS.textSecondary,
            '&:hover': { bgcolor: 'white', color: COLORS.error }
          }}
        >
          <Heart size={18} fill={vendor.isFavorite ? COLORS.error : 'none'} />
        </IconButton>

        {/* Hero Image */}
        <Box sx={{ position: 'relative', height: 200, overflow: 'hidden' }}>
          <Box 
            component="img" 
            src={vendor.image} 
            sx={{ width: '100%', height: '100%', objectFit: 'cover' }}
            referrerPolicy="no-referrer"
          />
          {vendor.verified && (
            <Box sx={{ 
              position: 'absolute', 
              bottom: 12, 
              left: 12, 
              bgcolor: 'rgba(255,255,255,0.9)', 
              px: 1.5, 
              py: 0.5, 
              borderRadius: 10,
              display: 'flex',
              alignItems: 'center',
              gap: 0.5,
              boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
            }}>
              <CheckCircle2 size={14} color={COLORS.secondary} />
              <Typography variant="caption" sx={{ fontWeight: 800, color: COLORS.primary }}>Verified</Typography>
            </Box>
          )}
        </Box>

        <CardContent sx={{ p: 3, flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
          <Stack direction="row" justifyContent="space-between" alignItems="flex-start" sx={{ mb: 1 }}>
            <Typography variant="caption" sx={{ color: COLORS.accent, fontWeight: 800, textTransform: 'uppercase', letterSpacing: 1 }}>
              {vendor.category}
            </Typography>
            <Stack direction="row" spacing={0.5} alignItems="center">
              <Star size={14} fill={COLORS.secondary} color={COLORS.secondary} />
              <Typography variant="caption" sx={{ fontWeight: 800 }}>{vendor.rating}</Typography>
              <Typography variant="caption" sx={{ color: 'text.secondary' }}>({vendor.reviewCount})</Typography>
            </Stack>
          </Stack>

          <Typography variant="h6" sx={{ fontWeight: 800, color: COLORS.textPrimary, mb: 1, lineHeight: 1.2 }}>
            {vendor.name}
          </Typography>

          <Stack direction="row" spacing={1} alignItems="center" sx={{ color: 'text.secondary', mb: 1 }}>
            <MapPin size={14} />
            <Typography variant="caption">{vendor.location}</Typography>
          </Stack>

          <Typography variant="subtitle2" sx={{ fontWeight: 700, color: COLORS.primary, mb: 2 }}>
            {vendor.priceRange}
          </Typography>

          <Typography 
            variant="body2" 
            sx={{ 
              color: 'text.secondary', 
              mb: 3, 
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
              lineHeight: 1.6
            }}
          >
            {vendor.description}
          </Typography>

          {/* Portfolio Thumbnails */}
          <Stack direction="row" spacing={1} sx={{ mb: 3, overflowX: 'auto', pb: 1, '&::-webkit-scrollbar': { display: 'none' } }}>
            {vendor.portfolio.map((img, i) => (
              <Box 
                key={i} 
                component="img" 
                src={img} 
                sx={{ width: 60, height: 60, borderRadius: 2, objectFit: 'cover', flexShrink: 0 }}
                referrerPolicy="no-referrer"
              />
            ))}
          </Stack>

          <Box sx={{ mt: 'auto' }}>
            <Grid container spacing={1.5}>
              <Grid size={{ xs: 6 }}>
                <Button 
                  fullWidth 
                  variant="contained" 
                  onClick={() => onRequestQuote(vendor)}
                  disabled={disabled}
                  sx={{ 
                    bgcolor: COLORS.secondary, 
                    color: COLORS.primary,
                    borderRadius: 3, 
                    fontWeight: 700, 
                    textTransform: 'none',
                    '&:hover': { bgcolor: '#B89740' }
                  }}
                >
                  Quote
                </Button>
              </Grid>
              <Grid size={{ xs: 6 }}>
                <Button 
                  fullWidth 
                  variant="outlined" 
                  component={Link}
                  to={`/vendors/${vendor.id}`}
                  sx={{ 
                    borderColor: COLORS.primary, 
                    color: COLORS.primary,
                    borderRadius: 3, 
                    fontWeight: 700, 
                    textTransform: 'none',
                    '&:hover': { borderColor: COLORS.primary, bgcolor: `${COLORS.primary}05` }
                  }}
                >
                  Portfolio
                </Button>
              </Grid>
            </Grid>
          </Box>
        </CardContent>
      </Card>
    </MotionBox>
  );
}

const MotionBox = motion(Box);

