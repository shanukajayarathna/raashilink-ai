import React from 'react';
import { Box, Paper, Skeleton, Stack } from '@mui/material';

export default function ProfileSkeleton() {
  return (
    <Paper className="animate-fadeInUp" sx={{ p: 3, borderRadius: 3 }}>
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={3} alignItems={{ xs: 'flex-start', sm: 'center' }}>
        <Skeleton variant="circular" width={112} height={112} className="animate-shimmer" />
        <Box sx={{ flex: 1, width: '100%' }}>
          <Skeleton variant="text" width="48%" height={40} className="animate-shimmer" />
          <Skeleton variant="text" width="68%" className="animate-shimmer" />
          <Skeleton variant="text" width="56%" className="animate-shimmer" />
          <Stack direction="row" spacing={1.5} sx={{ mt: 2 }}>
            <Skeleton variant="rounded" width={120} height={38} className="animate-shimmer" />
            <Skeleton variant="rounded" width={120} height={38} className="animate-shimmer" />
          </Stack>
        </Box>
      </Stack>
    </Paper>
  );
}
