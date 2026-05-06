import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Typography,
  TextField,
  InputAdornment,
  IconButton,
  Chip,
  Avatar,
  Button,
  Menu,
  MenuItem,
  Stack,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  Checkbox,
  Tooltip,
  Skeleton,
  Alert,
  Grid,
  Divider,
} from '@mui/material';
import {
  Search,
  MoreVertical,
  Download,
  Eye,
  ShieldPlus,
  Trash2,
  Mail,
  Calendar,
  Clock,
} from 'lucide-react';
import { motion } from 'motion/react';
import adminService from '../services/adminService';

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

const resolveAvatarSrc = (...sources: any[]) => {
  for (const source of sources) {
    if (!source || typeof source !== 'string') continue;
    const value = source.trim();
    if (!value) continue;
    if (/^(https?:)?\/\//i.test(value) || value.startsWith('data:') || value.startsWith('blob:')) {
      return value;
    }
    return value.startsWith('/') ? value : `/${value}`;
  }
  return '';
};

const UsersTable: React.FC = () => {
  const [users, setUsers] = useState<any[]>([]);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [roleFilter, setRoleFilter] = useState('all');
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalUsers, setTotalUsers] = useState(0);
  const [error, setError] = useState('');
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [adminDialogOpen, setAdminDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [adminForm, setAdminForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    password: '',
  });

  useEffect(() => {
    void loadUsers();
  }, [page, rowsPerPage, roleFilter, statusFilter, searchQuery]);

  const loadUsers = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await adminService.getUsers(page + 1, rowsPerPage, roleFilter, statusFilter, searchQuery);
      setUsers(response?.data?.items || []);
      setTotalUsers(response?.data?.total || 0);
    } catch (err: any) {
      setUsers([]);
      setTotalUsers(0);
      setError(err?.response?.data?.message || 'Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const resetAdminForm = () => {
    setAdminForm({
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      password: '',
    });
  };

  const handleCreateAdmin = async () => {
    try {
      setSubmitting(true);
      setError('');
      await adminService.createAdminUser(adminForm);
      setAdminDialogOpen(false);
      resetAdminForm();
      setPage(0);
      await loadUsers();
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to create admin user');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteUser = async () => {
    if (!selectedUser?.id) {
      return;
    }

      try {
      setSubmitting(true);
      setError('');
      await adminService.deleteUser(selectedUser.id);
      setDeleteDialogOpen(false);
      handleMenuClose();
      await loadUsers();
      } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to delete user');
      } finally {
      setSubmitting(false);
      }
  };

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(event.target.value);
    setPage(0);
  };

  const handleStatusFilterChange = (event: any) => {
    setStatusFilter(event.target.value);
    setPage(0);
  };

  const handleRoleFilterChange = (event: any) => {
    setRoleFilter(event.target.value);
    setPage(0);
  };

  const handleSelectAll = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.checked) {
      setSelectedUsers(users.map((u) => u.id));
    } else {
      setSelectedUsers([]);
    }
  };

  const handleSelectOne = (id: string) => {
    if (selectedUsers.includes(id)) {
      setSelectedUsers(selectedUsers.filter((uid) => uid !== id));
    } else {
      setSelectedUsers([...selectedUsers, id]);
    }
  };

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, user: any) => {
    setAnchorEl(event.currentTarget);
    setSelectedUser(user);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleViewDetail = () => {
    setDetailModalOpen(true);
    handleMenuClose();
  };

  const openDeleteDialog = () => {
    setDeleteDialogOpen(true);
    handleMenuClose();
  };

  const roleLabelMap: Record<string, string> = {
    user: 'User',
    vendor: 'Vendor',
    admin: 'Admin',
    horoscope_seeker: 'Horoscope Seeker',
  };

  const statusLabelMap: Record<string, string> = {
    active: 'Active',
    unverified: 'Unverified',
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return COLORS.success;
      case 'unverified': return COLORS.warning;
      default: return COLORS.textSecondary;
    }
  };

  const formatDate = (value: string) => {
    if (!value) return 'N/A';
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? 'N/A' : date.toLocaleDateString();
  };

  const formatTime = (value: string) => {
    if (!value) return 'N/A';
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? 'N/A' : date.toLocaleString();
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5 }}>
      <Paper sx={{ p: 3, borderRadius: '16px', boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}>
        {/* Header & Actions */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 2 }}>
          <Typography variant="h6" sx={{ fontWeight: 700, fontFamily: 'Playfair Display' }}>
            User Management
          </Typography>
          <Stack direction="row" spacing={2}>
            <Button
              variant="outlined"
              startIcon={<Download size={18} />}
              sx={{ color: COLORS.accent, borderColor: COLORS.accent, '&:hover': { borderColor: COLORS.accent, bgcolor: `${COLORS.accent}05` } }}
            >
              Export CSV
            </Button>
            <Button
              variant="contained"
              startIcon={<ShieldPlus size={18} />}
              onClick={() => setAdminDialogOpen(true)}
              sx={{ bgcolor: COLORS.primary, '&:hover': { bgcolor: '#6D1524' } }}
            >
              Add Admin
            </Button>
          </Stack>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {/* Filters */}
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid size={{ xs: 12, md: 4 }}>
            <TextField
              fullWidth
              placeholder="Search by name or email..."
              value={searchQuery}
              onChange={handleSearchChange}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Search size={20} color={COLORS.textSecondary} />
                  </InputAdornment>
                ),
              }}
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px' } }}
            />
          </Grid>
          <Grid size={{ xs: 6, md: 2 }}>
            <FormControl fullWidth sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px' } }}>
              <InputLabel>Status</InputLabel>
              <Select value={statusFilter} label="Status" onChange={handleStatusFilterChange}>
                <MenuItem value="all">All Status</MenuItem>
                <MenuItem value="active">Active</MenuItem>
                <MenuItem value="unverified">Unverified</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid size={{ xs: 6, md: 2 }}>
            <FormControl fullWidth sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px' } }}>
              <InputLabel>Role</InputLabel>
              <Select value={roleFilter} label="Role" onChange={handleRoleFilterChange}>
                <MenuItem value="all">All Roles</MenuItem>
                <MenuItem value="user">User</MenuItem>
                <MenuItem value="horoscope_seeker">Horoscope Seeker</MenuItem>
                <MenuItem value="vendor">Vendor</MenuItem>
                <MenuItem value="admin">Admin</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid size={{ xs: 12, md: 4 }} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>
            {selectedUsers.length > 0 && (
              <Stack direction="row" spacing={1}>
                <Typography variant="body2" sx={{ mr: 1, fontWeight: 600 }}>{selectedUsers.length} selected</Typography>
              </Stack>
            )}
          </Grid>
        </Grid>

        {/* Table */}
        <TableContainer>
          <Table sx={{ minWidth: 800 }}>
            <TableHead sx={{ bgcolor: COLORS.background }}>
              <TableRow>
                <TableCell padding="checkbox">
                  <Checkbox
                    indeterminate={selectedUsers.length > 0 && selectedUsers.length < users.length}
                    checked={users.length > 0 && selectedUsers.length === users.length}
                    onChange={handleSelectAll}
                  />
                </TableCell>
                <TableCell sx={{ fontWeight: 700 }}>User</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Role</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Status</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Registered</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Last Active</TableCell>
                <TableCell align="right" sx={{ fontWeight: 700 }}>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell padding="checkbox"><Skeleton variant="rectangular" width={20} height={20} /></TableCell>
                    <TableCell><Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}><Skeleton variant="circular" width={40} height={40} /><Skeleton variant="text" width={100} /></Box></TableCell>
                    <TableCell><Skeleton variant="text" width={60} /></TableCell>
                    <TableCell><Skeleton variant="text" width={80} /></TableCell>
                    <TableCell><Skeleton variant="text" width={100} /></TableCell>
                    <TableCell><Skeleton variant="text" width={80} /></TableCell>
                    <TableCell align="right"><Skeleton variant="circular" width={30} height={30} /></TableCell>
                  </TableRow>
                ))
              ) : (
                users.map((user) => (
                  <TableRow key={user.id} hover sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                    <TableCell padding="checkbox">
                      <Checkbox
                        checked={selectedUsers.includes(user.id)}
                        onChange={() => handleSelectOne(user.id)}
                      />
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Avatar src={resolveAvatarSrc(user.profilePic, user.personalInfo?.profilePic)} sx={{ width: 40, height: 40, border: `2px solid ${COLORS.background}` }} />
                        <Box>
                          <Typography variant="body2" sx={{ fontWeight: 700 }}>{user.name}</Typography>
                          <Typography variant="caption" sx={{ color: COLORS.textSecondary }}>{user.email}</Typography>
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell>
                      {(() => {
                        const effectiveRole = user.role === 'user' && user.userType === 'horoscope_seeker'
                          ? 'horoscope_seeker'
                          : user.role;
                        const isAdmin = effectiveRole === 'admin';
                        const isVendor = effectiveRole === 'vendor';
                        const isHoroscopeSeeker = effectiveRole === 'horoscope_seeker';

                        return (
                      <Chip
                        label={roleLabelMap[effectiveRole] || effectiveRole}
                        size="small"
                        sx={{
                          bgcolor: isAdmin
                            ? `${COLORS.primary}15`
                            : isVendor
                              ? `${COLORS.accent}15`
                              : isHoroscopeSeeker
                                ? `${COLORS.secondary}22`
                                : '#f0f0f0',
                          color: isAdmin
                            ? COLORS.primary
                            : isVendor
                              ? COLORS.accent
                              : isHoroscopeSeeker
                                ? '#8D6E1A'
                                : COLORS.textSecondary,
                          fontWeight: 700,
                        }}
                      />
                        );
                      })()}
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: getStatusColor(user.status) }} />
                        <Typography variant="body2" sx={{ fontWeight: 500 }}>{statusLabelMap[user.status] || user.status}</Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" sx={{ color: COLORS.textSecondary }}>{formatDate(user.registeredAt)}</Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" sx={{ color: COLORS.textSecondary }}>{formatTime(user.lastActiveAt)}</Typography>
                    </TableCell>
                    <TableCell align="right">
                      <IconButton onClick={(e) => handleMenuOpen(e, user)}>
                        <MoreVertical size={20} />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>

        <TablePagination
          rowsPerPageOptions={[5, 10, 25]}
          component="div"
          count={totalUsers}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={(_, newPage) => setPage(newPage)}
          onRowsPerPageChange={(e) => {
            setRowsPerPage(parseInt(e.target.value, 10));
            setPage(0);
          }}
        />
      </Paper>

      {/* Action Menu */}
      <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={handleMenuClose}>
        <MenuItem onClick={handleViewDetail} sx={{ gap: 1.5 }}><Eye size={16} /> View Profile</MenuItem>
        <MenuItem onClick={openDeleteDialog} sx={{ gap: 1.5, color: COLORS.error }}><Trash2 size={16} /> Remove User</MenuItem>
      </Menu>

      <Dialog open={adminDialogOpen} onClose={() => setAdminDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontFamily: 'Playfair Display', fontWeight: 700 }}>Create Admin</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 0.5 }}>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField fullWidth label="First Name" value={adminForm.firstName} onChange={(e) => setAdminForm((current) => ({ ...current, firstName: e.target.value }))} />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField fullWidth label="Last Name" value={adminForm.lastName} onChange={(e) => setAdminForm((current) => ({ ...current, lastName: e.target.value }))} />
            </Grid>
            <Grid size={{ xs: 12 }}>
              <TextField fullWidth label="Email" type="email" value={adminForm.email} onChange={(e) => setAdminForm((current) => ({ ...current, email: e.target.value }))} />
            </Grid>
            <Grid size={{ xs: 12 }}>
              <TextField fullWidth label="Phone" placeholder="0771234567" value={adminForm.phone} onChange={(e) => setAdminForm((current) => ({ ...current, phone: e.target.value }))} />
            </Grid>
            <Grid size={{ xs: 12 }}>
              <TextField fullWidth label="Password" type="password" value={adminForm.password} onChange={(e) => setAdminForm((current) => ({ ...current, password: e.target.value }))} helperText="Minimum 8 characters" />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAdminDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleCreateAdmin} disabled={submitting} sx={{ bgcolor: COLORS.primary, '&:hover': { bgcolor: '#6D1524' } }}>
            Create Admin
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>Remove User</DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ color: COLORS.textSecondary }}>
            Remove {selectedUser?.name || 'this user'} from the platform? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
          <Button color="error" variant="contained" onClick={handleDeleteUser} disabled={submitting}>
            Remove
          </Button>
        </DialogActions>
      </Dialog>

      {/* User Detail Modal */}
      <Dialog open={detailModalOpen} onClose={() => setDetailModalOpen(false)} maxWidth="sm" fullWidth>
        {selectedUser && (
          <>
            <DialogTitle sx={{ fontFamily: 'Playfair Display', fontWeight: 700, pb: 1 }}>User Details</DialogTitle>
            <DialogContent>
              <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mb: 4, mt: 2 }}>
                <Avatar src={resolveAvatarSrc(selectedUser.profilePic, selectedUser.personalInfo?.profilePic)} sx={{ width: 100, height: 100, mb: 2, border: `4px solid ${COLORS.background}` }} />
                <Typography variant="h5" sx={{ fontWeight: 800 }}>{selectedUser.name}</Typography>
                <Chip
                  label={roleLabelMap[selectedUser.role === 'user' && selectedUser.userType === 'horoscope_seeker' ? 'horoscope_seeker' : selectedUser.role] || selectedUser.role}
                  sx={{ mt: 1, bgcolor: COLORS.secondary, color: COLORS.primary, fontWeight: 700 }}
                />
              </Box>
              <Grid container spacing={3}>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <Stack spacing={0.5}>
                    <Typography variant="caption" color="textSecondary">Email Address</Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Mail size={16} color={COLORS.accent} />
                      <Typography variant="body2">{selectedUser.email}</Typography>
                    </Box>
                  </Stack>
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <Stack spacing={0.5}>
                    <Typography variant="caption" color="textSecondary">Status</Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: getStatusColor(selectedUser.status) }} />
                      <Typography variant="body2">{statusLabelMap[selectedUser.status] || selectedUser.status}</Typography>
                    </Box>
                  </Stack>
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <Stack spacing={0.5}>
                    <Typography variant="caption" color="textSecondary">Registered On</Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Calendar size={16} color={COLORS.accent} />
                      <Typography variant="body2">{formatDate(selectedUser.registeredAt)}</Typography>
                    </Box>
                  </Stack>
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <Stack spacing={0.5}>
                    <Typography variant="caption" color="textSecondary">Last Activity</Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Clock size={16} color={COLORS.accent} />
                      <Typography variant="body2">{formatTime(selectedUser.lastActiveAt)}</Typography>
                    </Box>
                  </Stack>
                </Grid>
              </Grid>
            </DialogContent>
            <DialogActions sx={{ p: 3 }}>
              <Button onClick={() => setDetailModalOpen(false)} variant="outlined">Close</Button>
            </DialogActions>
          </>
        )}
      </Dialog>
    </motion.div>
  );
};

export default UsersTable;

