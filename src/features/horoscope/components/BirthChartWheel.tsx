import React from 'react';
import { Box, Typography, Tooltip, useTheme } from '@mui/material';
import { motion } from 'motion/react';

// Design Constants
const COLORS = {
  primary: '#8B1A2E',
  secondary: '#C9A84C',
  accent: '#1A6B72',
  background: '#FAF7F2',
  white: '#FFFFFF',
  textPrimary: '#1C1C1C',
  textSecondary: '#555555',
};

interface Planet {
  name: string;
  symbol: string;
  sign: string;
  degree: string;
  house: number;
  color: string;
}

interface BirthChartWheelProps {
  planets: Planet[];
  ascendant: string;
}

const ZODIAC_SIGNS = [
  { name: 'Aries', symbol: '♈' },
  { name: 'Taurus', symbol: '♉' },
  { name: 'Gemini', symbol: '♊' },
  { name: 'Cancer', symbol: '♋' },
  { name: 'Leo', symbol: '♌' },
  { name: 'Virgo', symbol: '♍' },
  { name: 'Libra', symbol: '♎' },
  { name: 'Scorpio', symbol: '♏' },
  { name: 'Sagittarius', symbol: '♐' },
  { name: 'Capricorn', symbol: '♑' },
  { name: 'Aquarius', symbol: '♒' },
  { name: 'Pisces', symbol: '♓' },
];

const BirthChartWheel: React.FC<BirthChartWheelProps> = ({ planets, ascendant }) => {
  const theme = useTheme();

  // Helper to calculate planet position on the wheel
  const getPlanetPos = (house: number, offset: number = 0) => {
    // Each house is 30 degrees. House 1 starts at 180 degrees (left side)
    const angle = (house - 1) * 30 + 15 + offset;
    const radius = 35; // Inner radius for planets
    const x = 50 + radius * Math.cos((angle * Math.PI) / 180);
    const y = 50 + radius * Math.sin((angle * Math.PI) / 180);
    return { x, y };
  };

  return (
    <Box sx={{ 
      position: 'relative', 
      width: '100%', 
      maxWidth: '450px', 
      aspectRatio: '1/1',
      mx: 'auto',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    }}>
      {/* Decorative Mandala Background */}
      <Box sx={{
        position: 'absolute',
        width: '110%',
        height: '110%',
        opacity: 0.05,
        backgroundImage: `url("data:image/svg+xml,%3Csvg width='100' height='100' viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M50 0 L60 40 L100 50 L60 60 L50 100 L40 60 L0 50 L40 40 Z' fill='%238B1A2E' /%3E%3C/svg%3E")`,
        backgroundSize: '100% 100%',
        animation: 'spin 60s linear infinite',
        '@keyframes spin': {
          from: { transform: 'rotate(0deg)' },
          to: { transform: 'rotate(360deg)' }
        }
      }} />

      <motion.svg 
        viewBox="0 0 100 100" 
        initial={{ rotate: -90, scale: 0.8, opacity: 0 }}
        animate={{ rotate: 0, scale: 1, opacity: 1 }}
        transition={{ duration: 1.5, ease: "easeOut" }}
        style={{ width: '100%', height: '100%', zIndex: 1 }}
      >
        {/* Outer Ring */}
        <circle cx="50" cy="50" r="48" fill="none" stroke={COLORS.primary} strokeWidth="0.5" />
        <circle cx="50" cy="50" r="40" fill="none" stroke={COLORS.primary} strokeWidth="0.2" strokeDasharray="1 1" />
        
        {/* House Dividers & Labels */}
        {[...Array(12)].map((_, i) => {
          const angle = i * 30;
          const x1 = 50 + 40 * Math.cos((angle * Math.PI) / 180);
          const y1 = 50 + 40 * Math.sin((angle * Math.PI) / 180);
          const x2 = 50 + 48 * Math.cos((angle * Math.PI) / 180);
          const y2 = 50 + 48 * Math.sin((angle * Math.PI) / 180);
          
          const labelAngle = angle + 15;
          const lx = 50 + 44 * Math.cos((labelAngle * Math.PI) / 180);
          const ly = 50 + 44 * Math.sin((labelAngle * Math.PI) / 180);
          
          const sign = ZODIAC_SIGNS[i];
          const isAscendant = sign.name === ascendant;

          return (
            <g key={i}>
              <line x1={x1} y1={y1} x2={x2} y2={y2} stroke={COLORS.primary} strokeWidth="0.3" />
              {isAscendant && (
                <path 
                  d={`M ${50 + 48 * Math.cos((angle * Math.PI) / 180)} ${50 + 48 * Math.sin((angle * Math.PI) / 180)} 
                     A 48 48 0 0 1 ${50 + 48 * Math.cos(((angle + 30) * Math.PI) / 180)} ${50 + 48 * Math.sin(((angle + 30) * Math.PI) / 180)}
                     L ${50 + 40 * Math.cos(((angle + 30) * Math.PI) / 180)} ${50 + 40 * Math.sin(((angle + 30) * Math.PI) / 180)}
                     A 40 40 0 0 0 ${50 + 40 * Math.cos((angle * Math.PI) / 180)} ${50 + 40 * Math.sin((angle * Math.PI) / 180)} Z`}
                  fill={COLORS.secondary}
                  fillOpacity="0.2"
                  stroke={COLORS.secondary}
                  strokeWidth="0.5"
                />
              )}
              <text 
                x={lx} 
                y={ly} 
                textAnchor="middle" 
                dy=".3em" 
                style={{ fontSize: '3px', fill: isAscendant ? COLORS.primary : COLORS.textSecondary, fontWeight: isAscendant ? 'bold' : 'normal' }}
              >
                {sign.symbol} {sign.name.substring(0, 3)}
              </text>
            </g>
          );
        })}

        {/* Inner Circle */}
        <circle cx="50" cy="50" r="30" fill="white" stroke={COLORS.primary} strokeWidth="0.2" />
        <text x="50" y="50" textAnchor="middle" dy=".3em" style={{ fontSize: '4px', fill: COLORS.primary, fontWeight: 'bold', fontFamily: 'Playfair Display' }}>
          ASC
        </text>

        {/* Planets */}
        {planets.map((planet, idx) => {
          const pos = getPlanetPos(planet.house, (idx - 4) * 2); // Slight offset to avoid overlap
          return (
            <Tooltip 
              key={planet.name} 
              title={`${planet.name}: ${planet.sign} ${planet.degree} (${planet.house} House)`}
              arrow
              placement="top"
            >
              <g style={{ cursor: 'pointer' }}>
                <circle 
                  cx={pos.x} 
                  cy={pos.y} 
                  r="1.8" 
                  fill={planet.color} 
                  stroke="white" 
                  strokeWidth="0.3" 
                />
                <text 
                  x={pos.x} 
                  y={pos.y + 4} 
                  textAnchor="middle" 
                  style={{ fontSize: '2.5px', fill: COLORS.textPrimary, fontWeight: 'bold' }}
                >
                  {planet.symbol}
                </text>
              </g>
            </Tooltip>
          );
        })}
      </motion.svg>
    </Box>
  );
};

export default BirthChartWheel;

