import React from 'react';
import { Box } from '@mui/material';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
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

interface DestinationMapViewProps {
  latitude: number;
  longitude: number;
  name: string;
  region: string;
  country: string;
  height?: number | string;
}

export default function DestinationMapView({
  latitude,
  longitude,
  name,
  region,
  country,
  height = 520,
}: DestinationMapViewProps) {
  return (
    <Box sx={{ borderRadius: 3, overflow: 'hidden', border: '1px solid rgba(0,0,0,0.12)' }}>
      <MapContainer
        center={[latitude, longitude]}
        zoom={11}
        scrollWheelZoom
        style={{ height: typeof height === 'number' ? `${height}px` : height, width: '100%' }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <Marker position={[latitude, longitude]}>
          <Popup>
            <strong>{name}</strong>
            <br />
            {region}, {country}
          </Popup>
        </Marker>
      </MapContainer>
    </Box>
  );
}
