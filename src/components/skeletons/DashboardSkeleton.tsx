import React from 'react';
import { Grid, Paper, Skeleton, Stack } from '@mui/material';

function WidgetSkeleton({ tall = false }: { tall?: boolean }) {
  return (
    <Paper sx={{ p: 3, borderRadius: 3 }}>
      <Stack spacing={1.5}>
        <Skeleton variant="text" width="45%" height={30} className="animate-shimmer" />
        <Skeleton variant="text" width="72%" className="animate-shimmer" />
        <Skeleton variant="rounded" height={tall ? 180 : 96} className="animate-shimmer" />
      </Stack>
    </Paper>
  );
}

export default function DashboardSkeleton() {
  return (
    <Grid container spacing={3} className="animate-fadeInUp">
      <Grid size={{ xs: 12, md: 4 }}>
        <WidgetSkeleton />
      </Grid>
      <Grid size={{ xs: 12, md: 4 }}>
        <WidgetSkeleton tall />
      </Grid>
      <Grid size={{ xs: 12, md: 4 }}>
        <WidgetSkeleton />
      </Grid>
      <Grid size={{ xs: 12, md: 4 }}>
        <WidgetSkeleton tall />
      </Grid>
      <Grid size={{ xs: 12, md: 4 }}>
        <WidgetSkeleton />
      </Grid>
      <Grid size={{ xs: 12, md: 4 }}>
        <WidgetSkeleton />
      </Grid>
    </Grid>
  );
}
