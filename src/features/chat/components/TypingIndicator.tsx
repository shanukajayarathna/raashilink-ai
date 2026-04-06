import React from 'react';
import { Box, Stack } from '@mui/material';
import { motion } from 'motion/react';

const COLORS = {
  primary: '#8B1A2E',
  secondary: '#C9A84C',
};

export default function TypingIndicator() {
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', p: 1.5, bgcolor: 'white', borderRadius: 4, width: 'fit-content', ml: 1, boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
      <Stack direction="row" spacing={0.5}>
        {[0, 1, 2].map((i) => (
          <motion.div
            key={i}
            animate={{
              scale: [1, 1.5, 1],
              opacity: [0.4, 1, 0.4],
            }}
            transition={{
              duration: 0.8,
              repeat: Infinity,
              delay: i * 0.2,
              ease: "easeInOut"
            }}
            style={{
              width: 6,
              height: 6,
              borderRadius: '50%',
              backgroundColor: COLORS.primary,
            }}
          />
        ))}
      </Stack>
    </Box>
  );
}

