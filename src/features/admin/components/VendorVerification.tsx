import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Grid,
  Card,
  CardContent,
  CardActions,
  Button,
  Chip,
  Avatar,
  Stack,
  Divider,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  IconButton,
  Badge,
  Tooltip,
  Skeleton,
  Alert,
  Tabs,
  Tab,
} from '@mui/material';
import {
  CheckCircle2,
  XCircle,
  AlertCircle,
  FileText,
  UserCheck,
  Image,
  DollarSign,
  Briefcase,
  ExternalLink,
  MessageSquare,
  Clock,
  ShieldCheck,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

// Design System Constants
const COLORS = {
  primary: '#8B1A2E',
  secondary: '#C9A84C',
  accent: '#1A6B72',
  background: '#FAF7F2',
  white: '#FFFFFF',
  textPrimary: '#1C1C1C',
  textSecondary: '#555555',
  success: '#2E7D32',
  error: '#D32F2F',
  warning: '#ED6C02',
};

// Mock Data for Pending Vendors
const PENDING_VENDORS = [
  {
    id: 1,
    businessName: 'Golden Weddings Sri Lanka',
    category: 'Wedding Planner',
    submittedDate: '2023-10-20',
    avatar: 'https://i.pravatar.cc/150?u=v1',
    documents: ['Business Registration', 'ID Proof', 'Portfolio'],
    criteria: [
      { label: 'Business registration uploaded', status: 'success' },
      { label: 'Identity verified', status: 'success' },
      { label: 'Portfolio reviewed', status: 'success' },
      { label: 'Price list submitted', status: 'pending' },
    ],
  },
  {
    id: 2,
    businessName: 'Royal Catering Services',
    category: 'Catering',
    submittedDate: '2023-10-22',
    avatar: 'https://i.pravatar.cc/150?u=v2',
    documents: ['Food Safety License', 'Business Registration'],
    criteria: [
      { label: 'Business registration uploaded', status: 'success' },
      { label: 'Identity verified', status: 'pending' },
      { label: 'Portfolio reviewed', status: 'pending' },
      { label: 'Price list submitted', status: 'success' },
    ],
  },
];

const VendorVerification: React.FC = () => {
  const [activeTab, setActiveTab] = useState(0);
  const [loading, setLoading] = useState(true);
  const [vendors, setVendors] = useState(PENDING_VENDORS);

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 800);
    return () => clearTimeout(timer);
  }, []);

  const handleApprove = (id: number) => {
    setVendors(vendors.filter((v) => v.id !== id));
    // In real app, call API: PUT /api/v1/admin/vendors/:id/verify
  };

  const handleReject = (id: number) => {
    setVendors(vendors.filter((v) => v.id !== id));
  };

  const renderPendingQueue = () => (
    <Grid container spacing={3}>
      {vendors.length === 0 ? (
        <Grid size={{ xs: 12 }}>
          <Box sx={{ textAlign: 'center', py: 8 }}>
            <CheckCircle2 size={64} color={COLORS.success} style={{ opacity: 0.5, marginBottom: 16 }} />
            <Typography variant="h6" color="textSecondary">No pending verification requests</Typography>
          </Box>
        </Grid>
      ) : (
        vendors.map((vendor) => (
          <Grid size={{ xs: 12, lg: 6 }} key={vendor.id}>
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.3 }}>
              <Card sx={{ borderRadius: '16px', boxShadow: '0 4px 20px rgba(0,0,0,0.05)', overflow: 'visible', position: 'relative' }}>
                <CardContent sx={{ p: 3 }}>
                  <Box sx={{ display: 'flex', gap: 3, mb: 3 }}>
                    <Avatar src={vendor.avatar} sx={{ width: 80, height: 80, border: `4px solid ${COLORS.background}` }} />
                    <Box sx={{ flexGrow: 1 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <Box>
                          <Typography variant="h6" sx={{ fontWeight: 800, color: COLORS.primary }}>{vendor.businessName}</Typography>
                          <Chip label={vendor.category} size="small" sx={{ bgcolor: `${COLORS.accent}15`, color: COLORS.accent, fontWeight: 700, mt: 0.5 }} />
                        </Box>
                        <Box sx={{ textAlign: 'right' }}>
                          <Typography variant="caption" sx={{ color: COLORS.textSecondary, display: 'flex', alignItems: 'center', gap: 0.5 }}>
                            <Clock size={12} /> Submitted {vendor.submittedDate}
                          </Typography>
                        </Box>
                      </Box>
                    </Box>
                  </Box>

                  <Divider sx={{ mb: 3 }} />

                  <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 2, color: COLORS.textPrimary }}>Verification Checklist</Typography>
                  <Grid container spacing={2}>
                    {vendor.criteria.map((item, idx) => (
                      <Grid size={{ xs: 12, sm: 6 }} key={idx}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                          {item.status === 'success' ? (
                            <CheckCircle2 size={18} color={COLORS.success} />
                          ) : item.status === 'pending' ? (
                            <AlertCircle size={18} color={COLORS.warning} />
                          ) : (
                            <XCircle size={18} color={COLORS.error} />
                          )}
                          <Typography variant="body2" sx={{ color: item.status === 'pending' ? COLORS.textSecondary : COLORS.textPrimary }}>
                            {item.label}
                          </Typography>
                        </Box>
                      </Grid>
                    ))}
                  </Grid>

                  <Box sx={{ mt: 3, p: 2, bgcolor: COLORS.background, borderRadius: '12px' }}>
                    <Typography variant="caption" sx={{ fontWeight: 700, color: COLORS.textSecondary, textTransform: 'uppercase', display: 'block', mb: 1 }}>
                      Uploaded Documents
                    </Typography>
                    <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                      {vendor.documents.map((doc, idx) => (
                        <Chip
                          key={idx}
                          icon={<FileText size={14} />}
                          label={doc}
                          size="small"
                          onClick={() => {}}
                          sx={{ bgcolor: 'white', border: '1px solid #e0e0e0', '&:hover': { bgcolor: '#f5f5f5' } }}
                        />
                      ))}
                    </Stack>
                  </Box>
                </CardContent>
                <CardActions sx={{ p: 3, pt: 0, justifyContent: 'space-between' }}>
                  <Button startIcon={<MessageSquare size={18} />} sx={{ color: COLORS.textSecondary }}>Request Info</Button>
                  <Stack direction="row" spacing={2}>
                    <Button
                      variant="outlined"
                      color="error"
                      onClick={() => handleReject(vendor.id)}
                      sx={{ borderRadius: '8px' }}
                    >
                      Reject
                    </Button>
                    <Button
                      variant="contained"
                      onClick={() => handleApprove(vendor.id)}
                      sx={{ bgcolor: COLORS.success, '&:hover': { bgcolor: '#1B5E20' }, borderRadius: '8px' }}
                    >
                      Approve Vendor
                    </Button>
                  </Stack>
                </CardActions>
              </Card>
            </motion.div>
          </Grid>
        ))
      )}
    </Grid>
  );

  return (
    <Box>
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box>
          <Typography variant="h6" sx={{ fontWeight: 700, fontFamily: 'Playfair Display' }}>Vendor Verification</Typography>
          <Typography variant="body2" sx={{ color: COLORS.textSecondary }}>Manage and approve platform vendors</Typography>
        </Box>
        <Tabs value={activeTab} onChange={(_, val) => setActiveTab(val)} sx={{ '& .MuiTabs-indicator': { bgcolor: COLORS.primary } }}>
          <Tab label={<Badge badgeContent={vendors.length} color="error" sx={{ '& .MuiBadge-badge': { right: -10, top: 0 } }}>Pending Queue</Badge>} />
          <Tab label="Verified Vendors" />
          <Tab label="Rejected / Suspended" />
        </Tabs>
      </Box>

      <AnimatePresence mode="wait">
        {loading ? (
          <Grid container spacing={3}>
            {[1, 2].map((i) => (
              <Grid size={{ xs: 12, lg: 6 }} key={i}>
                <Skeleton variant="rectangular" height={350} sx={{ borderRadius: '16px' }} />
              </Grid>
            ))}
          </Grid>
        ) : (
          <Box key={activeTab}>
            {activeTab === 0 ? renderPendingQueue() : (
              <Paper sx={{ p: 8, textAlign: 'center', borderRadius: '16px' }}>
                <ShieldCheck size={64} color={COLORS.accent} style={{ opacity: 0.3, marginBottom: 16 }} />
                <Typography variant="h6" color="textSecondary">Detailed vendor list is coming soon</Typography>
              </Paper>
            )}
          </Box>
        )}
      </AnimatePresence>
    </Box>
  );
};

export default VendorVerification;

