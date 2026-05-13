import React, { useEffect, useState } from 'react';
import {
  Alert,
  Avatar,
  Box,
  Button,
  Card,
  CardActions,
  CardContent,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  Grid,
  IconButton,
  Skeleton,
  Stack,
  Tab,
  Tabs,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import { CheckCircle2, Clock, ExternalLink, FileText, MessageSquare } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import adminService from '../services/adminService';

const COLORS = {
  primary: '#8B1A2E',
  secondary: '#C9A84C',
  accent: '#1A6B72',
  background: '#FAF7F2',
  textPrimary: '#1C1C1C',
  textSecondary: '#555555',
  success: '#2E7D32',
  error: '#D32F2F',
  warning: '#ED6C02',
};

type VendorVerificationProps = {
  pendingCount?: number;
  onStatusChange?: () => void | Promise<void>;
};

const VendorVerification: React.FC<VendorVerificationProps> = ({ pendingCount = 0, onStatusChange }) => {
  const [activeTab, setActiveTab] = useState(0);
  const [loading, setLoading] = useState(true);
  const [vendors, setVendors] = useState<any[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogType, setDialogType] = useState<'approve' | 'reject'>('approve');
  const [selectedVendor, setSelectedVendor] = useState<any>(null);
  const [dialogInput, setDialogInput] = useState('');
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState('');
  const [noteDialogOpen, setNoteDialogOpen] = useState(false);
  const [noteInput, setNoteInput] = useState('');
  const [savingNote, setSavingNote] = useState(false);

  const statusByTab = ['pending', 'approved', 'rejected'];
  const currentStatus = statusByTab[activeTab] || 'pending';

  useEffect(() => {
    void loadVendors();
  }, [page, activeTab]);

  const loadVendors = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await adminService.getPendingVendors(page, 10, currentStatus);
      setVendors(response.data.items);
      setTotalPages(response.data.pages);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load vendors');
      setVendors([]);
    } finally {
      setLoading(false);
    }
  };

  const openApproveDialog = (vendor: any) => {
    setSelectedVendor(vendor);
    setDialogType('approve');
    setDialogInput('');
    setDialogOpen(true);
  };

  const openRejectDialog = (vendor: any) => {
    setSelectedVendor(vendor);
    setDialogType('reject');
    setDialogInput('');
    setDialogOpen(true);
  };

  const handleApprove = async () => {
    if (!selectedVendor) return;

    try {
      setProcessing(true);
      await adminService.approveVendor(selectedVendor.id, dialogInput);
      setDialogOpen(false);
      await loadVendors();
      await onStatusChange?.();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to approve vendor');
    } finally {
      setProcessing(false);
    }
  };

  const handleReject = async () => {
    if (!selectedVendor || !dialogInput.trim()) {
      setError('Please provide a rejection reason');
      return;
    }

    try {
      setProcessing(true);
      await adminService.rejectVendor(selectedVendor.id, dialogInput);
      setDialogOpen(false);
      await loadVendors();
      await onStatusChange?.();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to reject vendor');
    } finally {
      setProcessing(false);
    }
  };

  const handleSetPending = async (vendor: any) => {
    try {
      setProcessing(true);
      await adminService.updateVendorStatus(vendor.id, 'pending', 'Moved back to pending review');
      await loadVendors();
      await onStatusChange?.();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to update vendor status');
    } finally {
      setProcessing(false);
    }
  };

  const openNoteDialog = (vendor: any) => {
    setSelectedVendor(vendor);
    setNoteInput(vendor.adminNotes || '');
    setNoteDialogOpen(true);
  };

  const handleSaveNote = async () => {
    if (!selectedVendor) return;

    try {
      setSavingNote(true);
      await adminService.updateVendorStatus(selectedVendor.id, selectedVendor.approvalStatus, noteInput);
      setNoteDialogOpen(false);
      await loadVendors();
      setError('');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to save note');
    } finally {
      setSavingNote(false);
    }
  };

  const renderPendingQueue = () => (
    <>
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      <Grid container spacing={3}>
        {vendors.length === 0 ? (
          <Grid size={{ xs: 12 }}>
            <Box sx={{ textAlign: 'center', py: 8 }}>
              <CheckCircle2 size={64} color={COLORS.success} style={{ opacity: 0.5, marginBottom: 16 }} />
              <Typography variant="h6" color="textSecondary">
                No {currentStatus} vendors found
              </Typography>
            </Box>
          </Grid>
        ) : (
          vendors.map((vendor) => (
            <Grid size={{ xs: 12, lg: 6 }} key={vendor.id}>
              <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.3 }}>
                <Card sx={{ borderRadius: '16px', border: `1px solid ${COLORS.secondary}33` }}>
                  <CardContent sx={{ p: 3 }}>
                    <Box sx={{ display: 'flex', gap: 3, mb: 3 }}>
                      <Avatar sx={{ width: 80, height: 80, border: `4px solid ${COLORS.background}`, bgcolor: COLORS.primary }}>
                        {vendor.ownerName?.charAt(0) || 'V'}
                      </Avatar>

                      <Box sx={{ flexGrow: 1 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                          <Box>
                            <Typography variant="h6" sx={{ fontWeight: 800, color: COLORS.primary }}>
                              {vendor.businessName}
                            </Typography>
                            <Chip
                              label={vendor.category}
                              size="small"
                              sx={{ bgcolor: `${COLORS.accent}15`, color: COLORS.accent, fontWeight: 700, mt: 0.5 }}
                            />
                            <Chip
                              label={vendor.approvalStatus}
                              size="small"
                              sx={{
                                ml: 1,
                                bgcolor:
                                  vendor.approvalStatus === 'approved'
                                    ? `${COLORS.success}15`
                                    : vendor.approvalStatus === 'rejected'
                                      ? `${COLORS.error}15`
                                      : `${COLORS.warning}15`,
                                color:
                                  vendor.approvalStatus === 'approved'
                                    ? COLORS.success
                                    : vendor.approvalStatus === 'rejected'
                                      ? COLORS.error
                                      : COLORS.warning,
                                fontWeight: 700,
                                mt: 0.5,
                                textTransform: 'capitalize',
                              }}
                            />
                            <Typography variant="caption" sx={{ color: COLORS.textSecondary, display: 'block', mt: 1 }}>
                              Owner: {vendor.ownerName}
                            </Typography>
                          </Box>

                          <Box sx={{ textAlign: 'right' }}>
                            <Typography
                              variant="caption"
                              sx={{ color: COLORS.textSecondary, display: 'flex', alignItems: 'center', gap: 0.5 }}
                            >
                              <Clock size={12} /> {new Date(vendor.createdAt).toLocaleDateString()}
                            </Typography>
                          </Box>
                        </Box>
                      </Box>
                    </Box>

                    <Divider sx={{ mb: 3 }} />

                    <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 2, color: COLORS.textPrimary }}>
                      Business Details
                    </Typography>
                    <Stack spacing={1} sx={{ mb: 3 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Typography variant="caption" sx={{ color: COLORS.textSecondary }}>
                          Registration #
                        </Typography>
                        <Typography variant="caption" sx={{ fontWeight: 600 }}>
                          {vendor.businessRegistrationNumber || 'N/A'}
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Typography variant="caption" sx={{ color: COLORS.textSecondary }}>
                          Email
                        </Typography>
                        <Typography variant="caption" sx={{ fontWeight: 600 }}>
                          {vendor.ownerEmail}
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Typography variant="caption" sx={{ color: COLORS.textSecondary }}>
                          Phone
                        </Typography>
                        <Typography variant="caption" sx={{ fontWeight: 600 }}>
                          {vendor.ownerPhone}
                        </Typography>
                      </Box>
                    </Stack>

                    {vendor.adminNotes && (
                      <Box
                        sx={{
                          p: 2,
                          mb: 3,
                          bgcolor: `${COLORS.secondary}10`,
                          borderLeft: `4px solid ${COLORS.secondary}`,
                          borderRadius: '8px',
                        }}
                      >
                        <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1, color: COLORS.primary }}>
                          Admin Notes
                        </Typography>
                        <Typography variant="body2" sx={{ color: COLORS.textSecondary, whiteSpace: 'pre-wrap', lineHeight: 1.6 }}>
                          {vendor.adminNotes}
                        </Typography>
                      </Box>
                    )}

                    {vendor.socialLinks && Object.keys(vendor.socialLinks).length > 0 && (
                      <>
                        <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 2, color: COLORS.textPrimary }}>
                          Social Links
                        </Typography>
                        <Stack direction="row" spacing={1} sx={{ mb: 3 }}>
                          {Object.entries(vendor.socialLinks).map(([platform, url]: [string, any]) =>
                            url ? (
                              <Tooltip key={platform} title={platform}>
                                <IconButton
                                  size="small"
                                  onClick={() => window.open(url, '_blank')}
                                  sx={{ color: COLORS.accent }}
                                >
                                  <ExternalLink size={16} />
                                </IconButton>
                              </Tooltip>
                            ) : null,
                          )}
                        </Stack>
                      </>
                    )}

                    {vendor.documents && vendor.documents.length > 0 && (
                      <>
                        <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 2, color: COLORS.textPrimary }}>
                          Submitted Documents
                        </Typography>
                        <Stack spacing={1} sx={{ mb: 3 }}>
                          {vendor.documents.map((doc: any, idx: number) => (
                            <Box
                              key={idx}
                              sx={{
                                p: 1.5,
                                bgcolor: COLORS.background,
                                borderRadius: '8px',
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                              }}
                            >
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <FileText size={16} color={COLORS.accent} />
                                <Box>
                                  <Typography variant="caption" sx={{ fontWeight: 600, display: 'block' }}>
                                    {doc.type?.replace(/_/g, ' ').toUpperCase()}
                                  </Typography>
                                  <Typography variant="caption" sx={{ color: COLORS.textSecondary }}>
                                    {doc.fileName || 'Document'}
                                  </Typography>
                                </Box>
                              </Box>
                              <IconButton size="small" onClick={() => window.open(doc.url, '_blank')} sx={{ color: COLORS.accent }}>
                                <ExternalLink size={16} />
                              </IconButton>
                            </Box>
                          ))}
                        </Stack>
                      </>
                    )}
                  </CardContent>

                  <CardActions sx={{ p: 3, pt: 0, justifyContent: 'space-between' }}>
                    <Button
                      startIcon={<MessageSquare size={18} />}
                      sx={{ color: COLORS.textSecondary }}
                      onClick={() => openNoteDialog(vendor)}
                      disabled={processing || savingNote}
                    >
                      {vendor.adminNotes ? 'Edit Note' : 'Add Note'}
                    </Button>

                    <Stack direction="row" spacing={2}>
                      {vendor.approvalStatus !== 'pending' && (
                        <Button
                          variant="outlined"
                          onClick={() => handleSetPending(vendor)}
                          disabled={processing}
                          sx={{ borderRadius: '8px' }}
                        >
                          Mark Pending
                        </Button>
                      )}

                      <Button
                        variant="outlined"
                        color="error"
                        onClick={() => openRejectDialog(vendor)}
                        disabled={processing || vendor.approvalStatus === 'rejected'}
                        sx={{ borderRadius: '8px' }}
                      >
                        Reject
                      </Button>

                      <Button
                        variant="contained"
                        onClick={() => openApproveDialog(vendor)}
                        disabled={processing || vendor.approvalStatus === 'approved'}
                        sx={{ bgcolor: COLORS.success, '&:hover': { bgcolor: '#1B5E20' }, borderRadius: '8px' }}
                      >
                        Approve
                      </Button>
                    </Stack>
                  </CardActions>
                </Card>
              </motion.div>
            </Grid>
          ))
        )}
      </Grid>

      {totalPages > 1 && (
        <Box sx={{ mt: 4, display: 'flex', justifyContent: 'center', gap: 2 }}>
          <Button disabled={page === 1} onClick={() => setPage(page - 1)}>
            Previous
          </Button>
          <Typography sx={{ alignSelf: 'center' }}>Page {page} of {totalPages}</Typography>
          <Button disabled={page === totalPages} onClick={() => setPage(page + 1)}>
            Next
          </Button>
        </Box>
      )}
    </>
  );

  return (
    <Box>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h6" sx={{ fontWeight: 700, fontFamily: 'Playfair Display', mb: 1 }}>
          Vendor Verification
        </Typography>
        <Typography variant="body2" sx={{ color: COLORS.textSecondary }}>
          Manage existing vendors and change approval status
        </Typography>

        <Tabs
          value={activeTab}
          onChange={(_event, value) => {
            setActiveTab(value);
            setPage(1);
          }}
          sx={{
            mt: 2,
            '& .MuiTabs-indicator': { bgcolor: COLORS.secondary, height: 3, borderRadius: '3px 3px 0 0' },
            '& .MuiTab-root': {
              textTransform: 'none',
              fontWeight: 700,
              minHeight: 48,
              fontSize: '0.9rem',
              color: COLORS.textSecondary,
              '&.Mui-selected': { color: COLORS.primary },
            },
          }}
        >
          <Tab label={pendingCount > 0 ? `Pending (${pendingCount})` : 'Pending'} />
          <Tab label="Approved" />
          <Tab label="Rejected" />
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
          renderPendingQueue()
        )}
      </AnimatePresence>

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)}>
        <DialogTitle>{dialogType === 'approve' ? 'Approve Vendor' : 'Reject Vendor'}</DialogTitle>
        <DialogContent>
          {dialogType === 'approve' ? (
            <>
              <Typography variant="body2" sx={{ mb: 2 }}>
                Are you sure you want to approve <strong>{selectedVendor?.businessName}</strong>?
              </Typography>
              <TextField
                fullWidth
                label="Notes (optional)"
                multiline
                rows={3}
                value={dialogInput}
                onChange={(e) => setDialogInput(e.target.value)}
                placeholder="Add any notes about the approval..."
              />
            </>
          ) : (
            <>
              <Typography variant="body2" sx={{ mb: 2 }}>
                Please provide a reason for rejecting <strong>{selectedVendor?.businessName}</strong>.
              </Typography>
              <TextField
                fullWidth
                label="Rejection reason"
                multiline
                rows={3}
                value={dialogInput}
                onChange={(e) => setDialogInput(e.target.value)}
                placeholder="Explain why this vendor is being rejected..."
                error={!dialogInput.trim() && dialogInput !== ''}
              />
            </>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={dialogType === 'approve' ? handleApprove : handleReject}
            disabled={processing || (dialogType === 'reject' && !dialogInput.trim())}
            variant="contained"
            sx={{ bgcolor: dialogType === 'approve' ? COLORS.success : COLORS.error }}
          >
            {processing ? 'Processing...' : dialogType === 'approve' ? 'Approve' : 'Reject'}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={noteDialogOpen} onClose={() => setNoteDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          {selectedVendor?.adminNotes ? 'Edit Note' : 'Add Note'} - {selectedVendor?.businessName}
        </DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            fullWidth
            multiline
            rows={5}
            value={noteInput}
            onChange={(e) => setNoteInput(e.target.value)}
            placeholder="Add admin notes about this vendor..."
            sx={{ mt: 2 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setNoteDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleSaveNote} disabled={savingNote} variant="contained" sx={{ bgcolor: COLORS.primary }}>
            {savingNote ? 'Saving...' : 'Save Note'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default VendorVerification;
