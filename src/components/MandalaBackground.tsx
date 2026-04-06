import React from 'react';
import { Box, SxProps, Theme } from '@mui/material';

interface MandalaBackgroundProps {
  size?: number | string;
  opacity?: number;
  rotate?: boolean;
  color?: string;
  sx?: SxProps<Theme>;
}

/**
 * Subtle decorative mandala texture for culturally grounded page backgrounds.
 */
export default function MandalaBackground({
  size = 320,
  opacity = 0.05,
  rotate = true,
  color = '#8B1A2E',
  sx = {},
}: MandalaBackgroundProps) {
  return (
    <Box
      aria-hidden="true"
      className={rotate ? 'animate-mandalaRotate' : undefined}
      sx={{
        position: 'absolute',
        inset: 'auto',
        width: size,
        height: size,
        opacity,
        pointerEvents: 'none',
        zIndex: 0,
        ...sx,
      }}
    >
      <svg viewBox="0 0 200 200" width="100%" height="100%" fill="none">
        <circle cx="100" cy="100" r="86" stroke={color} strokeWidth="1.2" />
        <circle cx="100" cy="100" r="62" stroke={color} strokeWidth="1" strokeDasharray="4 5" />
        <circle cx="100" cy="100" r="34" stroke={color} strokeWidth="1" strokeDasharray="3 4" />
        {[...Array(12)].map((_, index) => {
          const angle = (index * Math.PI) / 6;
          const x = 100 + Math.cos(angle) * 62;
          const y = 100 + Math.sin(angle) * 62;
          const petalX = 100 + Math.cos(angle) * 86;
          const petalY = 100 + Math.sin(angle) * 86;

          return (
            <g key={index}>
              <path
                d={`M100 100 Q ${x} ${y} ${petalX} ${petalY} Q ${x + Math.sin(angle) * 8} ${y - Math.cos(angle) * 8} 100 100`}
                stroke={color}
                strokeWidth="1"
              />
              <circle cx={petalX} cy={petalY} r="4" fill={color} />
            </g>
          );
        })}
        {[...Array(8)].map((_, index) => {
          const angle = (index * Math.PI) / 4;
          const x1 = 100 + Math.cos(angle) * 20;
          const y1 = 100 + Math.sin(angle) * 20;
          const x2 = 100 + Math.cos(angle) * 96;
          const y2 = 100 + Math.sin(angle) * 96;

          return (
            <line
              key={`line-${index}`}
              x1={x1}
              y1={y1}
              x2={x2}
              y2={y2}
              stroke={color}
              strokeWidth="0.8"
              strokeDasharray="2 6"
            />
          );
        })}
        <path
          d="M100 70 C110 86 126 90 142 100 C126 110 110 114 100 130 C90 114 74 110 58 100 C74 90 90 86 100 70 Z"
          stroke={color}
          strokeWidth="1.1"
        />
        <circle cx="100" cy="100" r="8" fill={color} />
      </svg>
    </Box>
  );
}
