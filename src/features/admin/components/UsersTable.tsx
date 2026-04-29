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
  Filter,
  MoreVertical,
  UserPlus,
  Download,
  Trash2,
  ShieldAlert,
  Eye,
  UserCheck,
  Mail,
  Calendar,
  Clock,
} from 'lucide-react';
import { motion } from 'motion/react';

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

// Mock Data for Users
const MOCK_USERS = Array.from({ length: 50 }, (_, i) => ({
  id: i + 1,
  name: `User ${i + 1}`,
  email: `user${i + 1}@example.com`,
  role: i % 5 === 0 ? 'Admin' : i % 3 === 0 ? 'Vendor' : 'User',
  status: i % 10 === 0 ? 'Suspended' : i % 7 === 0 ? 'Unverified' : 'Active',
  registeredDate: '2023-10-15',
  lastActive: '2 hours ago',
  avatar: `https://i.pravatar.cc/150?u=${i + 1}`,
}));

const UsersTable: React.FC = () => {
  const [users, setUsers] = useState<any[]>(MOCK_USERS);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [roleFilter, setRoleFilter] = useState('All');
  const [selectedUsers, setSelectedUsers] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [detailModalOpen, setDetailModalOpen] = useState(false);

  useEffect(() => {
    // For now, simulating with mock data
    // In production, replace with: adminService.getUsers(page + 1, rowsPerPage, roleFilter, searchQuery)
    const timer = setTimeout(() => setLoading(false), 800);
    return () => clearTimeout(timer);
  }, [page, roleFilter, searchQuery]);

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

  const handleSelectOne = (id: number) => {
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

  const filteredUsers = users.filter((user) => {
    const matchesSearch = user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'All' || user.status === statusFilter;
    const matchesRole = roleFilter === 'All' || user.role === roleFilter;
    return matchesSearch && matchesStatus && matchesRole;
  });

  const paginatedUsers = filteredUsers.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Active': return COLORS.success;
      case 'Suspended': return COLORS.error;
      case 'Unverified': return COLORS.warning;
      default: return COLORS.textSecondary;
    }
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
              startIcon={<UserPlus size={18} />}
              sx={{ bgcolor: COLORS.primary, '&:hover': { bgcolor: '#6B1423' } }}
            >
              Add New User
            </Button>
          </Stack>
        </Box>

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
                <MenuItem value="All">All Status</MenuItem>
                <MenuItem value="Active">Active</MenuItem>
                <MenuItem value="Suspended">Suspended</MenuItem>
                <MenuItem value="Unverified">Unverified</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid size={{ xs: 6, md: 2 }}>
            <FormControl fullWidth sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px' } }}>
              <InputLabel>Role</InputLabel>
              <Select value={roleFilter} label="Role" onChange={handleRoleFilterChange}>
                <MenuItem value="All">All Roles</MenuItem>
                <MenuItem value="User">User</MenuItem>
                <MenuItem value="Vendor">Vendor</MenuItem>
                <MenuItem value="Admin">Admin</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid size={{ xs: 12, md: 4 }} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>
            {selectedUsers.length > 0 && (
              <Stack direction="row" spacing={1}>
                <Typography variant="body2" sx={{ mr: 1, fontWeight: 600 }}>{selectedUsers.length} selected</Typography>
                <Button size="small" color="error" startIcon={<Trash2 size={16} />}>Delete</Button>
                <Button size="small" color="warning" startIcon={<ShieldAlert size={16} />}>Suspend</Button>
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
                paginatedUsers.map((user) => (
                  <TableRow key={user.id} hover sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                    <TableCell padding="checkbox">
                      <Checkbox
                        checked={selectedUsers.includes(user.id)}
                        onChange={() => handleSelectOne(user.id)}
                      />
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Avatar src={user.avatar} sx={{ width: 40, height: 40, border: `2px solid ${COLORS.background}` }} />
                        <Box>
                          <Typography variant="body2" sx={{ fontWeight: 700 }}>{user.name}</Typography>
                          <Typography variant="caption" sx={{ color: COLORS.textSecondary }}>{user.email}</Typography>
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={user.role}
                        size="small"
                        sx={{
                          bgcolor: user.role === 'Admin' ? `${COLORS.primary}15` : user.role === 'Vendor' ? `${COLORS.accent}15` : '#f0f0f0',
                          color: user.role === 'Admin' ? COLORS.primary : user.role === 'Vendor' ? COLORS.accent : COLORS.textSecondary,
                          fontWeight: 700,
                        }}
                      />
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: getStatusColor(user.status) }} />
                        <Typography variant="body2" sx={{ fontWeight: 500 }}>{user.status}</Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" sx={{ color: COLORS.textSecondary }}>{user.registeredDate}</Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" sx={{ color: COLORS.textSecondary }}>{user.lastActive}</Typography>
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
          count={filteredUsers.length}
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
        <MenuItem onClick={handleMenuClose} sx={{ gap: 1.5 }}><UserCheck size={16} /> Verify User</MenuItem>
        <MenuItem onClick={handleMenuClose} sx={{ gap: 1.5 }}><ShieldAlert size={16} color={COLORS.warning} /> Suspend</MenuItem>
        <Divider />
        <MenuItem onClick={handleMenuClose} sx={{ gap: 1.5, color: COLORS.error }}><Trash2 size={16} /> Delete</MenuItem>
      </Menu>

      {/* User Detail Modal */}
      <Dialog open={detailModalOpen} onClose={() => setDetailModalOpen(false)} maxWidth="sm" fullWidth>
        {selectedUser && (
          <>
            <DialogTitle sx={{ fontFamily: 'Playfair Display', fontWeight: 700, pb: 1 }}>User Details</DialogTitle>
            <DialogContent>
              <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mb: 4, mt: 2 }}>
                <Avatar src={selectedUser.avatar} sx={{ width: 100, height: 100, mb: 2, border: `4px solid ${COLORS.background}` }} />
                <Typography variant="h5" sx={{ fontWeight: 800 }}>{selectedUser.name}</Typography>
                <Chip label={selectedUser.role} sx={{ mt: 1, bgcolor: COLORS.secondary, color: COLORS.primary, fontWeight: 700 }} />
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
                      <Typography variant="body2">{selectedUser.status}</Typography>
                    </Box>
                  </Stack>
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <Stack spacing={0.5}>
                    <Typography variant="caption" color="textSecondary">Registered On</Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Calendar size={16} color={COLORS.accent} />
                      <Typography variant="body2">{selectedUser.registeredDate}</Typography>
                    </Box>
                  </Stack>
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <Stack spacing={0.5}>
                    <Typography variant="caption" color="textSecondary">Last Activity</Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Clock size={16} color={COLORS.accent} />
                      <Typography variant="body2">{selectedUser.lastActive}</Typography>
                    </Box>
                  </Stack>
                </Grid>
              </Grid>
            </DialogContent>
            <DialogActions sx={{ p: 3 }}>
              <Button onClick={() => setDetailModalOpen(false)} variant="outlined">Close</Button>
              <Button variant="contained" sx={{ bgcolor: COLORS.primary }}>Edit User</Button>
            </DialogActions>
          </>
        )}
      </Dialog>
    </motion.div>
  );
};

export default UsersTable;

