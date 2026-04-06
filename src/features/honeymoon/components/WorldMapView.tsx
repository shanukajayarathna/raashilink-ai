import React, { useState } from 'react';
import {
  Box,
  Typography,
  Paper,
  IconButton,
  Tooltip,
  alpha,
  useTheme,
  useMediaQuery,
  Card,
  CardMedia,
  CardContent,
  Button,
  Stack,
} from '@mui/material';
import {
  MapPin,
  X,
  ArrowRight,
  Sparkles,
  Heart,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
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

interface DestinationPin {
  id: string;
  name: string;
  country: string;
  x: number; // Percentage from left
  y: number; // Percentage from top
  type: 'beach' | 'nature' | 'culture';
  image: string;
  budget: number;
}

const PIN_COLORS = {
  beach: '#2196F3',
  nature: '#4CAF50',
  culture: '#FF9800',
};

interface WorldMapViewProps {
  destinations: DestinationPin[];
}

export default function WorldMapView({ destinations }: WorldMapViewProps) {
  const [selectedPin, setSelectedPin] = useState<DestinationPin | null>(null);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const navigate = useNavigate();

  return (
    <Box sx={{ position: 'relative', width: '100%', height: isMobile ? 400 : 600, bgcolor: '#E3F2FD', borderRadius: 6, overflow: 'hidden', border: '8px solid white', boxShadow: '0 12px 32px rgba(0,0,0,0.05)' }}>
      {/* Simple SVG World Map Placeholder */}
      <svg
        viewBox="0 0 1000 500"
        style={{ width: '100%', height: '100%', fill: '#CFD8DC', stroke: '#FFFFFF', strokeWidth: 0.5 }}
      >
        {/* Simplified World Map Paths */}
        <path d="M150,100 Q200,80 250,120 T350,150 L380,250 Q300,350 200,300 Z" fill="#B0BEC5" /> {/* N. America */}
        <path d="M300,350 Q350,450 400,480 L450,400 Q400,300 350,320 Z" fill="#B0BEC5" /> {/* S. America */}
        <path d="M500,150 Q550,100 650,120 T750,100 L800,200 Q700,250 600,220 Z" fill="#B0BEC5" /> {/* Eurasia */}
        <path d="M520,250 Q580,220 650,280 T600,450 L550,400 Q500,350 520,250 Z" fill="#B0BEC5" /> {/* Africa */}
        <path d="M800,350 Q850,320 900,380 T850,450 L800,420 Z" fill="#B0BEC5" /> {/* Australia */}
        
        {/* Grid Lines */}
        <line x1="0" y1="250" x2="1000" y2="250" stroke={alpha('#FFFFFF', 0.5)} strokeDasharray="5,5" />
      </svg>

      {/* Destination Pins */}
      {destinations.map((pin) => (
        <motion.div
          key={pin.id}
          initial={{ scale: 0, y: -20 }}
          animate={{ scale: 1, y: 0 }}
          transition={{ type: 'spring', damping: 12, stiffness: 200, delay: Math.random() * 0.5 }}
          style={{
            position: 'absolute',
            left: `${pin.x}%`,
            top: `${pin.y}%`,
            transform: 'translate(-50%, -100%)',
            zIndex: selectedPin?.id === pin.id ? 10 : 1,
          }}
        >
          <Tooltip title={pin.name} arrow>
            <IconButton
              onClick={() => setSelectedPin(pin)}
              sx={{
                p: 0.5,
                bgcolor: 'white',
                color: PIN_COLORS[pin.type],
                boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                border: `2px solid ${PIN_COLORS[pin.type]}`,
                '&:hover': { transform: 'scale(1.2)', bgcolor: 'white' },
                transition: 'transform 0.2s ease',
              }}
            >
              <MapPin size={isMobile ? 16 : 24} fill={PIN_COLORS[pin.type]} />
            </IconButton>
          </Tooltip>
        </motion.div>
      ))}

      {/* Mini Card Overlay */}
      <AnimatePresence>
        {selectedPin && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            style={{
              position: 'absolute',
              top: 24,
              right: 24,
              width: isMobile ? 'calc(100% - 48px)' : 300,
              zIndex: 20,
            }}
          >
            <Card sx={{ borderRadius: 4, overflow: 'hidden', boxShadow: '0 12px 40px rgba(0,0,0,0.2)' }}>
              <Box sx={{ position: 'relative', height: 140 }}>
                <CardMedia component="img" image={selectedPin.image} sx={{ height: '100%' }} />
                <IconButton
                  size="small"
                  onClick={() => setSelectedPin(null)}
                  sx={{ position: 'absolute', top: 8, right: 8, bgcolor: 'rgba(0,0,0,0.5)', color: 'white', '&:hover': { bgcolor: 'rgba(0,0,0,0.7)' } }}
                >
                  <X size={16} />
                </IconButton>
                <Box sx={{ position: 'absolute', bottom: 8, left: 8, bgcolor: alpha(COLORS.accent, 0.9), color: 'white', px: 1, py: 0.2, borderRadius: 1, display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <Sparkles size={12} />
                  <Typography variant="caption" sx={{ fontWeight: 800 }}>AI Recommended</Typography>
                </Box>
              </Box>
              <CardContent sx={{ p: 2 }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 800, color: COLORS.textPrimary, mb: 0.5 }}>{selectedPin.name}</Typography>
                <Typography variant="caption" sx={{ color: COLORS.textSecondary, display: 'block', mb: 1.5 }}>{selectedPin.country}</Typography>
                <Stack direction="row" spacing={1} alignItems="center" justifyContent="space-between">
                  <Typography variant="subtitle2" sx={{ color: COLORS.primary, fontWeight: 800 }}>From ${selectedPin.budget}</Typography>
                  <Button
                    size="small"
                    variant="contained"
                    onClick={() => navigate(`/honeymoon/${selectedPin.id}`)}
                    sx={{ bgcolor: COLORS.primary, borderRadius: 2, textTransform: 'none', fontSize: '0.75rem' }}
                  >
                    Details
                  </Button>
                </Stack>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Legend */}
      <Paper sx={{ position: 'absolute', bottom: 16, left: 16, p: 1.5, borderRadius: 3, display: 'flex', gap: 2, backdropFilter: 'blur(8px)', bgcolor: alpha('#FFFFFF', 0.9) }}>
        {Object.entries(PIN_COLORS).map(([type, color]) => (
          <Stack key={type} direction="row" spacing={1} alignItems="center">
            <Box sx={{ width: 12, height: 12, borderRadius: '50%', bgcolor: color }} />
            <Typography variant="caption" sx={{ fontWeight: 700, textTransform: 'capitalize' }}>{type}</Typography>
          </Stack>
        ))}
      </Paper>
    </Box>
  );
}

