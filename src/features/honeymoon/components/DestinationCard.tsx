import React from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  CardMedia,
  Chip,
  Stack,
  Button,
  IconButton,
  Rating,
  useTheme,
  alpha,
} from '@mui/material';
import {
  Heart,
  ArrowRight,
  MapPin,
  Thermometer,
  Waves,
  Utensils,
  Sparkles,
  Sun,
  Camera,
} from 'lucide-react';
import { motion } from 'motion/react';
import { useNavigate } from 'react-router-dom';

const COLORS = {
  primary: '#8B1A2E',
  secondary: '#C9A84C',
  accent: '#1A6B72',
  cream: '#FAF7F2',
  white: '#FFFFFF',
  textPrimary: '#1C1C1C',
  textSecondary: '#555555',
};

interface DestinationCardProps {
  destination: {
    id: string;
    name: string;
    region: string;
    country: string;
    image: string;
    tags: string[];
    budget: number;
    bestSeason: string;
    description: string;
    matchScore: number;
    highlights: { icon: string; label: string }[];
  };
  index: number;
}

const iconMap: { [key: string]: React.ReactNode } = {
  Swimming: <Waves size={16} />,
  'Couples Spa': <Sparkles size={16} />,
  'Fine Dining': <Utensils size={16} />,
  'Sunset Views': <Sun size={16} />,
  Photography: <Camera size={16} />,
};

export default function DestinationCard({ destination, index }: DestinationCardProps) {
  const theme = useTheme();
  const navigate = useNavigate();
  const [isSaved, setIsSaved] = React.useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
    >
      <Card
        sx={{
          borderRadius: 4,
          overflow: 'hidden',
          boxShadow: '0 4px 20px rgba(139,26,46,0.08)',
          transition: 'transform 0.3s ease, box-shadow 0.3s ease',
          '&:hover': {
            transform: 'translateY(-8px)',
            boxShadow: '0 12px 32px rgba(139,26,46,0.15)',
          },
          position: 'relative',
        }}
      >
        {/* Match Score Badge */}
        <Box
          sx={{
            position: 'absolute',
            top: 16,
            left: 16,
            zIndex: 2,
            bgcolor: alpha(COLORS.accent, 0.9),
            color: 'white',
            px: 1.5,
            py: 0.5,
            borderRadius: 10,
            display: 'flex',
            alignItems: 'center',
            gap: 0.5,
            backdropFilter: 'blur(4px)',
            boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
          }}
        >
          <Sparkles size={14} />
          <Typography variant="caption" sx={{ fontWeight: 800 }}>
            {destination.matchScore}% Match
          </Typography>
        </Box>

        {/* Save Button */}
        <IconButton
          onClick={(e) => {
            e.stopPropagation();
            setIsSaved(!isSaved);
          }}
          sx={{
            position: 'absolute',
            top: 16,
            right: 16,
            zIndex: 2,
            bgcolor: 'white',
            color: isSaved ? COLORS.primary : COLORS.textSecondary,
            '&:hover': { bgcolor: alpha(COLORS.white, 0.9) },
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
          }}
        >
          <Heart size={20} fill={isSaved ? COLORS.primary : 'none'} />
        </IconButton>

        {/* Image Section */}
        <Box sx={{ position: 'relative', height: 240, overflow: 'hidden' }}>
          <CardMedia
            component="img"
            image={destination.image}
            alt={destination.name}
            sx={{
              height: '100%',
              transition: 'transform 0.5s ease',
              '&:hover': { transform: 'scale(1.1)' },
            }}
          />
          <Box
            sx={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
              height: '60%',
              background: 'linear-gradient(to top, rgba(0,0,0,0.8) 0%, transparent 100%)',
              p: 2,
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'flex-end',
            }}
          >
            <Typography variant="h5" sx={{ color: 'white', fontWeight: 800, fontFamily: 'Playfair Display' }}>
              {destination.name}
            </Typography>
            <Stack direction="row" spacing={1} alignItems="center" sx={{ color: alpha(COLORS.white, 0.8) }}>
              <MapPin size={14} />
              <Typography variant="caption" sx={{ fontWeight: 600 }}>
                {destination.region}, {destination.country}
              </Typography>
            </Stack>
          </Box>
        </Box>

        {/* Content Section */}
        <CardContent sx={{ p: 3 }}>
          <Stack direction="row" spacing={1} sx={{ mb: 2 }} flexWrap="wrap" useFlexGap>
            {destination.tags.map((tag) => (
              <Chip
                key={tag}
                label={tag}
                size="small"
                sx={{
                  bgcolor: alpha(COLORS.primary, 0.05),
                  color: COLORS.primary,
                  fontWeight: 700,
                  fontSize: '0.65rem',
                  borderRadius: 1,
                }}
              />
            ))}
            <Chip
              label={`From USD ${destination.budget.toLocaleString()}`}
              size="small"
              sx={{
                bgcolor: alpha(COLORS.secondary, 0.1),
                color: COLORS.secondary,
                fontWeight: 800,
                fontSize: '0.65rem',
                borderRadius: 1,
              }}
            />
            <Chip
              label={`Best: ${destination.bestSeason}`}
              size="small"
              sx={{
                bgcolor: alpha(COLORS.accent, 0.1),
                color: COLORS.accent,
                fontWeight: 700,
                fontSize: '0.65rem',
                borderRadius: 1,
              }}
            />
          </Stack>

          <Typography variant="body2" sx={{ color: COLORS.textSecondary, mb: 2, lineHeight: 1.6, height: 40, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
            {destination.description}
          </Typography>

          <Stack direction="row" spacing={2} sx={{ mb: 3 }}>
            {destination.highlights.slice(0, 4).map((highlight, i) => (
              <Tooltip key={i} title={highlight.label}>
                <Box sx={{ color: COLORS.textSecondary, display: 'flex', alignItems: 'center' }}>
                  {iconMap[highlight.label] || <Sparkles size={16} />}
                </Box>
              </Tooltip>
            ))}
          </Stack>

          <Button
            fullWidth
            variant="contained"
            onClick={() => navigate(`/honeymoon/${destination.id}`)}
            endIcon={<ArrowRight size={18} />}
            sx={{
              bgcolor: COLORS.primary,
              borderRadius: 3,
              py: 1.2,
              fontWeight: 700,
              textTransform: 'none',
              '&:hover': { bgcolor: '#6B1423' },
            }}
          >
            View Details
          </Button>
        </CardContent>
      </Card>
    </motion.div>
  );
}

import { Tooltip } from '@mui/material';

