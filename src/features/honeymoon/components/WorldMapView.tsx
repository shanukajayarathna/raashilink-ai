import React, { useState, useMemo } from 'react';
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
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

// Fix default marker icons when bundling with Vite/Webpack.
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

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
  coordinates?: {
    lat: number;
    lng: number;
  };
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

function MapBounds({ destinations }: { destinations: DestinationPin[] }) {
  const map = useMap();

  const bounds = useMemo(() =>
    destinations
      .filter((dest) => dest.coordinates?.lat != null && dest.coordinates?.lng != null)
      .map((dest) => [dest.coordinates!.lat, dest.coordinates!.lng] as [number, number]),
    [destinations]
  );

  if (bounds.length === 0) {
    map.setView([7.8731, 80.7718], 7);
  } else if (bounds.length === 1) {
    map.setView(bounds[0], 8);
  } else {
    map.fitBounds(bounds, { padding: [40, 40] });
  }

  return null;
}

export default function WorldMapView({ destinations }: WorldMapViewProps) {
  const [selectedPin, setSelectedPin] = useState<DestinationPin | null>(null);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const navigate = useNavigate();

  const mapDestinations = destinations.filter(
    (dest) => dest.coordinates?.lat != null && dest.coordinates?.lng != null
  );

  if (!Array.isArray(destinations) || destinations.length === 0 || mapDestinations.length === 0) {
    return (
      <Box sx={{ width: '100%', height: isMobile ? 320 : 500, bgcolor: '#E3F2FD', borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', border: '8px solid white', boxShadow: '0 12px 32px rgba(0,0,0,0.05)' }}>
        <Typography variant="h6" sx={{ color: COLORS.textSecondary, textAlign: 'center', px: 3 }}>
          No locations are available on the map yet. Try a different preference or refresh the recommendations.
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ position: 'relative', width: '100%', height: isMobile ? 400 : 600, bgcolor: '#E3F2FD', borderRadius: 6, overflow: 'hidden', border: '8px solid white', boxShadow: '0 12px 32px rgba(0,0,0,0.05)', '& .leaflet-control-attribution': { display: 'none !important' } }}>
      <MapContainer
        center={[7.8731, 80.7718]}
        zoom={7}
        scrollWheelZoom
        attributionControl={false}
        style={{ width: '100%', height: '100%' }}
      >
        <TileLayer
          attribution=""
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <MapBounds destinations={mapDestinations} />

        {mapDestinations.map((pin) => (
          <Marker
            key={pin.id}
            position={[pin.coordinates!.lat, pin.coordinates!.lng]}
            eventHandlers={{
              click: () => setSelectedPin(pin),
            }}
          >
            <Popup>
              <Box>
                <Typography sx={{ fontWeight: 700 }}>{pin.name}</Typography>
                <Typography variant="body2" sx={{ color: COLORS.textSecondary }}>{pin.country}</Typography>
                <Button
                  size="small"
                  sx={{ mt: 1, textTransform: 'none' }}
                  onClick={() => navigate(`/honeymoon/${pin.id}`)}
                >
                  View details
                </Button>
              </Box>
            </Popup>
          </Marker>
        ))}
      </MapContainer>

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

