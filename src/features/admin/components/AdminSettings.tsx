import React, { useEffect, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Paper,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import adminService from '../services/adminService';
import ProfilePhotoUpload from '@/features/profile/components/ProfilePhotoUpload';

const COLORS = {
  primary: '#8B1A2E',
  textSecondary: '#555555',
  success: '#2E7D32',
};

const AdminSettings: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [savingName, setSavingName] = useState(false);
  const [savingEmail, setSavingEmail] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [savingPhoto, setSavingPhoto] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [photoUrl, setPhotoUrl] = useState('');

  const [newEmail, setNewEmail] = useState('');
  const [emailPassword, setEmailPassword] = useState('');

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');

  const loadAdminProfile = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await adminService.getAdminProfile();
      setName(response?.name || '');
      setEmail(response?.verification?.email || response?.email || '');
      setNewEmail(response?.verification?.email || response?.email || '');
      setPhotoUrl(response?.profilePic || '');
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to load admin profile');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAdminProfile();
  }, []);

  const onSaveName = async () => {
    if (!name.trim()) {
      setError('Name is required');
      return;
    }

    try {
      setSavingName(true);
      setError('');
      await adminService.updateAdminProfileName(name.trim());
      setSuccess('Admin name updated successfully');
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to update name');
    } finally {
      setSavingName(false);
    }
  };

  const onSaveEmail = async () => {
    if (!newEmail.trim() || !emailPassword) {
      setError('New email and current password are required');
      return;
    }

    try {
      setSavingEmail(true);
      setError('');
      await adminService.updateAdminEmail(emailPassword, newEmail.trim());
      setEmail(newEmail.trim());
      setEmailPassword('');
      setSuccess('Admin email updated successfully');
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to update email');
    } finally {
      setSavingEmail(false);
    }
  };

  const onSavePassword = async () => {
    if (!currentPassword || !newPassword) {
      setError('Current password and new password are required');
      return;
    }

    try {
      setSavingPassword(true);
      setError('');
      await adminService.updateAdminPassword(currentPassword, newPassword);
      setCurrentPassword('');
      setNewPassword('');
      setSuccess('Admin password updated successfully');
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to update password');
    } finally {
      setSavingPassword(false);
    }
  };

  const onUploadPhoto = async (file: File) => {
    if (!file) return;

    try {
      setSavingPhoto(true);
      setError('');
      await adminService.uploadAdminPhoto(file);
      setSuccess('Admin photo updated successfully');
      await loadAdminProfile();
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to upload photo');
    } finally {
      setSavingPhoto(false);
    }
  };

  const onRemovePhoto = async () => {
    try {
      setSavingPhoto(true);
      setError('');
      await adminService.removeAdminPhoto();
      setSuccess('Admin photo removed successfully');
      await loadAdminProfile();
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to remove photo');
    } finally {
      setSavingPhoto(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
        <CircularProgress sx={{ color: COLORS.primary }} />
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h6" sx={{ fontWeight: 700, fontFamily: 'Playfair Display', mb: 1 }}>
        Admin Settings
      </Typography>
      <Typography variant="body2" sx={{ color: COLORS.textSecondary, mb: 3 }}>
        Update admin name, email, password, and profile photo.
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess('')}>
          {success}
        </Alert>
      )}

      <Stack spacing={3}>
        <Paper sx={{ p: 3, borderRadius: '12px' }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 2 }}>
            Profile Photo
          </Typography>
          <ProfilePhotoUpload
            currentPhoto={photoUrl}
            onUpload={onUploadPhoto}
            onRemove={onRemovePhoto}
            isUploading={savingPhoto}
            isRemoving={savingPhoto}
          />
        </Paper>

        <Paper sx={{ p: 3, borderRadius: '12px' }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 2 }}>
            Basic Information
          </Typography>
          <Stack spacing={2}>
            <TextField
              label="Admin Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              fullWidth
            />
            <Button variant="contained" onClick={onSaveName} disabled={savingName} sx={{ width: 'fit-content', bgcolor: COLORS.primary }}>
              {savingName ? 'Saving...' : 'Save Name'}
            </Button>
          </Stack>
        </Paper>

        <Paper sx={{ p: 3, borderRadius: '12px' }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 2 }}>
            Change Email
          </Typography>
          <Stack spacing={2}>
            <TextField label="Current Email" value={email} fullWidth disabled />
            <TextField label="New Email" value={newEmail} onChange={(e) => setNewEmail(e.target.value)} fullWidth />
            <TextField
              label="Current Password"
              type="password"
              value={emailPassword}
              onChange={(e) => setEmailPassword(e.target.value)}
              fullWidth
            />
            <Button variant="contained" onClick={onSaveEmail} disabled={savingEmail} sx={{ width: 'fit-content', bgcolor: COLORS.primary }}>
              {savingEmail ? 'Saving...' : 'Save Email'}
            </Button>
          </Stack>
        </Paper>

        <Paper sx={{ p: 3, borderRadius: '12px' }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 2 }}>
            Change Password
          </Typography>
          <Stack spacing={2}>
            <TextField
              label="Current Password"
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              fullWidth
            />
            <TextField
              label="New Password"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              fullWidth
            />
            <Button
              variant="contained"
              onClick={onSavePassword}
              disabled={savingPassword}
              sx={{ width: 'fit-content', bgcolor: COLORS.success }}
            >
              {savingPassword ? 'Saving...' : 'Save Password'}
            </Button>
          </Stack>
        </Paper>
      </Stack>
    </Box>
  );
};

export default AdminSettings;
