import React from 'react';
import { Card, CardContent, Skeleton, Stack } from '@mui/material';

export default function VendorCardSkeleton() {
  return (
    <Card className="animate-fadeInUp" sx={{ borderRadius: 3, overflow: 'hidden' }}>
      <Skeleton variant="rectangular" height={180} className="animate-shimmer" />
      <CardContent sx={{ p: 3 }}>
        <Stack spacing={1.25}>
          <Skeleton variant="text" width="66%" height={32} className="animate-shimmer" />
          <Skeleton variant="text" width="42%" className="animate-shimmer" />
          <Skeleton variant="text" width="84%" className="animate-shimmer" />
          <Skeleton variant="rounded" width={140} height={32} className="animate-shimmer" sx={{ mt: 1 }} />
        </Stack>
      </CardContent>
    </Card>
  );
}
