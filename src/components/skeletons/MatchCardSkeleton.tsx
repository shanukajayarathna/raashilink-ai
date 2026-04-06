import React from 'react';
import { Box, Card, CardContent, Skeleton, Stack } from '@mui/material';

export default function MatchCardSkeleton() {
  return (
    <Card
      className="animate-fadeInUp"
      sx={{
        borderRadius: 3,
        overflow: 'hidden',
      }}
    >
      <Box sx={{ position: 'relative', pt: '110%' }}>
        <Skeleton variant="rectangular" className="animate-shimmer" sx={{ position: 'absolute', inset: 0 }} />
      </Box>
      <CardContent sx={{ p: 3 }}>
        <Stack spacing={2}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Box sx={{ flex: 1 }}>
              <Skeleton variant="text" width="70%" height={34} className="animate-shimmer" />
              <Skeleton variant="text" width="40%" height={20} className="animate-shimmer" />
            </Box>
            <Skeleton variant="rounded" width={72} height={28} className="animate-shimmer" />
          </Box>
          <Stack spacing={1.2}>
            <Skeleton variant="text" width="80%" className="animate-shimmer" />
            <Skeleton variant="text" width="64%" className="animate-shimmer" />
          </Stack>
          <Box sx={{ display: 'flex', gap: 1.5 }}>
            <Skeleton variant="rounded" width="100%" height={42} className="animate-shimmer" />
            <Skeleton variant="rounded" width="100%" height={42} className="animate-shimmer" />
          </Box>
        </Stack>
      </CardContent>
    </Card>
  );
}
