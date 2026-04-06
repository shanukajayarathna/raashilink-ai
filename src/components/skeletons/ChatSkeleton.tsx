import React from 'react';
import { Box, Paper, Skeleton, Stack } from '@mui/material';

function Bubble({ align = 'left' }: { align?: 'left' | 'right' }) {
  const isRight = align === 'right';

  return (
    <Box sx={{ display: 'flex', justifyContent: isRight ? 'flex-end' : 'flex-start' }}>
      <Skeleton
        variant="rounded"
        className="animate-shimmer"
        sx={{
          width: { xs: '76%', sm: '58%' },
          height: 56,
          borderRadius: 3,
        }}
      />
    </Box>
  );
}

export default function ChatSkeleton() {
  return (
    <Paper className="animate-fadeInUp" sx={{ p: 3, borderRadius: 3 }}>
      <Stack spacing={2}>
        <Bubble align="left" />
        <Bubble align="right" />
        <Bubble align="left" />
        <Bubble align="right" />
        <Skeleton variant="rounded" height={52} className="animate-shimmer" sx={{ mt: 2, borderRadius: 3 }} />
      </Stack>
    </Paper>
  );
}
