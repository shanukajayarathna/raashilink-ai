import React, { useEffect, useRef, useState } from 'react';
import {
  Alert,
  Autocomplete,
  Box,
  Button,
  Chip,
  CircularProgress,
  Divider,
  FormControlLabel,
  Grid,
  IconButton,
  InputAdornment,
  MenuItem,
  Paper,
  Switch,
  TextField,
  Typography,
  alpha,
} from '@mui/material';
import {
  AlertCircle,
  Briefcase,
  CheckCircle2,
  DollarSign,
  Globe,
  Mail,
  MapPin,
  Phone,
  Plus,
  Save,
  Trash2,
} from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import vendorService from '../../services/vendorService';
import userService from '@/features/profile/services/userService';

const COLORS = {
  primary: '#8B1A2E',
  secondary: '#C9A84C',
  textPrimary: '#1C1C1C',
};

const SRI_LANKAN_DISTRICTS = [
  'Colombo', 'Gampaha', 'Kalutara', 'Kandy', 'Matale', 'Nuwara Eliya',
  'Galle', 'Matara', 'Hambantota', 'Jaffna', 'Kilinochchi', 'Mannar',
  'Vavuniya', 'Mullaitivu', 'Batticaloa', 'Ampara', 'Trincomalee',
  'Kurunegala', 'Puttalam', 'Anuradhapura', 'Polonnaruwa', 'Badulla',
  'Moneragala', 'Ratnapura', 'Kegalle',
];

const VENDOR_CATEGORIES = [
  'Photography', 'Catering', 'Venue', 'Attire', 'Music',
  'Decor', 'Planner', 'Travel', 'Makeup',
];

interface VendorPackage {
  packageId: string;
  name: string;
  description: string;
  price: string;
  currency: string;
  durationHours: string;
  isActive: boolean;
}

interface ProfileManagementProps {
  vendorData?: any;
  onSaved?: (updated: any) => void;
}

function buildPackages(data: any): VendorPackage[] {
  const raw = data?.vendorProfile?.packages || data?.packages;
  if (Array.isArray(raw) && raw.length > 0) {
    return raw.map((p: any, idx: number) => ({
      packageId: p.packageId || p.id || `pkg-${idx + 1}`,
      name: p.name || '',
      description: p.description || '',
      price: String(p.price || '0'),
      currency: p.currency || 'LKR',
      durationHours: String(p.durationHours || '0'),
      isActive: p.isActive !== false,
    }));
  }
  return [];
}

function computeStrength(info: any, pkgs: VendorPackage[]): number {
  let score = 0;
  if (info.name) score += 15;
  if (info.category) score += 10;
  if (info.description && info.description.length > 30) score += 15;
  if (info.serviceAreas.length > 0) score += 10;
  if (info.city) score += 5;
  if (info.contactPhone) score += 10;
  if (info.contactEmail) score += 10;
  if (pkgs.length >= 1) score += 10;
  if (pkgs.length >= 3) score += 10;
  if (info.pricingMin && info.pricingMax) score += 5;
  return Math.min(score, 100);
}

export default function ProfileManagement({ vendorData, onSaved }: ProfileManagementProps) {
  const profile = vendorData?.vendorProfile || vendorData || {};

  const [businessInfo, setBusinessInfo] = useState({
    name: vendorData?.businessName || profile.businessName || '',
    category: vendorData?.category || profile.category || '',
    description: profile.description || '',
    city: profile.city || '',
    address: profile.address || '',
    contactPhone: profile.contactPhone || '',
    contactEmail: profile.contactEmail || '',
    website: profile.website || '',
    pricingMin: String(profile.pricingRange?.min || ''),
    pricingMax: String(profile.pricingRange?.max || ''),
    serviceAreas: Array.isArray(profile.serviceArea) ? profile.serviceArea : [],
  });

  const [packages, setPackages] = useState<VendorPackage[]>(() => buildPackages(vendorData));
  const hasUserEdited = useRef(false);
  const [saving, setSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [saveError, setSaveError] = useState('');
  const [accountEmail, setAccountEmail] = useState(vendorData?.accountEmail || '');
  const [emailCurrentPassword, setEmailCurrentPassword] = useState('');
  const [emailSaving, setEmailSaving] = useState(false);
  const [emailError, setEmailError] = useState('');
  const [emailSuccess, setEmailSuccess] = useState('');
  const [passwordCurrent, setPasswordCurrent] = useState('');
  const [passwordNew, setPasswordNew] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');

  useEffect(() => {
    // Skip re-sync if the user has unsaved edits in progress
    if (hasUserEdited.current) return;
    const data = vendorData?.vendorProfile || vendorData || {};
    setBusinessInfo({
      name: vendorData?.businessName || data.businessName || '',
      category: vendorData?.category || data.category || '',
      description: data.description || '',
      city: data.city || '',
      address: data.address || '',
      contactPhone: data.contactPhone || '',
      contactEmail: data.contactEmail || '',
      website: data.website || '',
      pricingMin: String(data.pricingRange?.min || ''),
      pricingMax: String(data.pricingRange?.max || ''),
      serviceAreas: Array.isArray(data.serviceArea) ? data.serviceArea : [],
    });
    setPackages(buildPackages(vendorData));
    setAccountEmail(vendorData?.accountEmail || '');
  }, [vendorData]);

  const handleUpdateAccountEmail = async () => {
    setEmailError('');
    setEmailSuccess('');
    if (!accountEmail || !emailCurrentPassword) {
      setEmailError('New email and current password are required.');
      return;
    }

    setEmailSaving(true);
    try {
      const response = await userService.updateContactEmail({
        newEmail: accountEmail,
        currentPassword: emailCurrentPassword,
      });
      setAccountEmail(response?.email || accountEmail);
      setEmailCurrentPassword('');
      setEmailSuccess(response?.message || 'Email updated successfully.');
    } catch (error: any) {
      setEmailError(error?.response?.data?.message || error?.message || 'Failed to update email');
    } finally {
      setEmailSaving(false);
    }
  };

  const handleChangePassword = async () => {
    setPasswordError('');
    setPasswordSuccess('');

    if (!passwordCurrent || !passwordNew || !passwordConfirm) {
      setPasswordError('Current password, new password, and confirmation are required.');
      return;
    }
    if (passwordNew.length < 8) {
      setPasswordError('New password must be at least 8 characters long.');
      return;
    }
    if (passwordNew !== passwordConfirm) {
      setPasswordError('New password and confirm password do not match.');
      return;
    }

    setPasswordSaving(true);
    try {
      const response = await userService.changePassword({
        currentPassword: passwordCurrent,
        newPassword: passwordNew,
      });
      setPasswordCurrent('');
      setPasswordNew('');
      setPasswordConfirm('');
      setPasswordSuccess(response?.message || 'Password changed successfully.');
    } catch (error: any) {
      setPasswordError(error?.response?.data?.message || error?.message || 'Failed to change password');
    } finally {
      setPasswordSaving(false);
    }
  };

  const handleInfoChange = (patch: Partial<typeof businessInfo>) => {
    hasUserEdited.current = true;
    setBusinessInfo((prev) => ({ ...prev, ...patch }));
  };

  const addPackage = () => {
    hasUserEdited.current = true;
    setPackages((prev) => [
      ...prev,
      {
        packageId: `pkg-${Date.now()}`,
        name: '',
        description: '',
        price: '0',
        currency: 'LKR',
        durationHours: '0',
        isActive: true,
      },
    ]);
  };

  const removePackage = (packageId: string) => {
    hasUserEdited.current = true;
    setPackages((prev) => prev.filter((item) => item.packageId !== packageId));
  };

  const updatePackage = (packageId: string, field: keyof VendorPackage, value: any) => {
    hasUserEdited.current = true;
    setPackages((prev) => prev.map((item) => (item.packageId === packageId ? { ...item, [field]: value } : item)));
  };

  const handleSave = async () => {
    setSaving(true);
    setSaveStatus('idle');
    setSaveError('');

    try {
      const payload: any = {
        businessName: businessInfo.name,
        category: businessInfo.category,
        description: businessInfo.description,
        city: businessInfo.city,
        address: businessInfo.address,
        contactPhone: businessInfo.contactPhone,
        contactEmail: businessInfo.contactEmail,
        website: (() => {
          const w = businessInfo.website.trim();
          if (!w) return '';
          return /^https?:\/\//i.test(w) ? w : `https://${w}`;
        })(),
        serviceArea: businessInfo.serviceAreas,
        packages: packages
          .filter((item) => item.name.trim().length > 0)
          .map((item) => ({
            packageId: item.packageId,
            name: item.name,
            description: item.description,
            price: Number(item.price) || 0,
            currency: item.currency || 'LKR',
            durationHours: Number(item.durationHours) || 0,
            isActive: item.isActive,
          })),
      };

      if (businessInfo.pricingMin && businessInfo.pricingMax) {
        payload.pricingRange = {
          min: Number(businessInfo.pricingMin) || 0,
          max: Number(businessInfo.pricingMax) || 0,
        };
      }

      const response = await vendorService.updateVendorProfile(payload);
      setSaveStatus('success');
      hasUserEdited.current = false;
      onSaved?.(response?.data || null);
      setTimeout(() => setSaveStatus('idle'), 3500);
    } catch (error: any) {
      setSaveStatus('error');
      setSaveError(error?.response?.data?.message || error?.message || 'Failed to save profile changes');
    } finally {
      setSaving(false);
    }
  };

  const strength = computeStrength(businessInfo, packages);

  return (
    <Box>
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <Box>
          <Typography variant="h5" sx={{ fontFamily: 'Playfair Display', fontWeight: 700, color: COLORS.primary }}>
            Profile Management
          </Typography>
          <Typography variant="body2" color="textSecondary">
            Update your business information, contact details, and pricing packages.
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={saving ? <CircularProgress size={16} color="inherit" /> : <Save size={18} />}
          onClick={handleSave}
          disabled={saving}
          sx={{ bgcolor: COLORS.primary, borderRadius: '12px', px: 4, '&:hover': { bgcolor: '#6b1423' } }}
        >
          {saving ? 'Saving...' : 'Save Changes'}
        </Button>
      </Box>

      {saveStatus === 'success' ? (
        <Alert severity="success" sx={{ mb: 3, borderRadius: '12px' }}>
          Profile updated successfully.
        </Alert>
      ) : null}
      {saveStatus === 'error' ? (
        <Alert severity="error" sx={{ mb: 3, borderRadius: '12px' }}>
          {saveError}
        </Alert>
      ) : null}

      <Grid container spacing={4}>
        <Grid size={{ xs: 12, lg: 7 }}>
          <Paper elevation={0} sx={{ p: 4, borderRadius: '20px', border: '1px solid rgba(139,26,46,0.08)' }}>
            <Typography variant="h6" sx={{ fontWeight: 700, mb: 3, display: 'flex', alignItems: 'center', gap: 1 }}>
              <Briefcase size={20} color={COLORS.primary} /> Business Details
            </Typography>
            <Grid container spacing={3}>
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField
                  label="Business Name"
                  fullWidth
                  value={businessInfo.name}
                  onChange={(e) => handleInfoChange({ name: e.target.value })}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField
                  select
                  label="Category"
                  fullWidth
                  value={businessInfo.category}
                  onChange={(e) => handleInfoChange({ category: e.target.value })}
                >
                  {VENDOR_CATEGORIES.map((item) => (
                    <MenuItem key={item} value={item}>{item}</MenuItem>
                  ))}
                </TextField>
              </Grid>
              <Grid size={{ xs: 12 }}>
                <TextField
                  label="Business Description"
                  fullWidth
                  multiline
                  rows={4}
                  value={businessInfo.description}
                  onChange={(e) => handleInfoChange({ description: e.target.value })}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField
                  label="City"
                  fullWidth
                  value={businessInfo.city}
                  onChange={(e) => handleInfoChange({ city: e.target.value })}
                  InputProps={{ startAdornment: <InputAdornment position="start"><MapPin size={16} /></InputAdornment> }}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField
                  label="Address"
                  fullWidth
                  value={businessInfo.address}
                  onChange={(e) => handleInfoChange({ address: e.target.value })}
                />
              </Grid>
              <Grid size={{ xs: 12 }}>
                <Autocomplete
                  multiple
                  options={SRI_LANKAN_DISTRICTS}
                  value={businessInfo.serviceAreas}
                  onChange={(_, value) => handleInfoChange({ serviceAreas: value })}
                  renderInput={(params) => <TextField {...params} label="Service Areas (Districts)" placeholder="Select districts" />}
                  renderTags={(value, getTagProps) =>
                    value.map((option, index) => (
                      <Chip
                        label={option}
                        {...getTagProps({ index })}
                        sx={{ bgcolor: alpha(COLORS.primary, 0.1), color: COLORS.primary, fontWeight: 600 }}
                      />
                    ))
                  }
                />
              </Grid>
            </Grid>
          </Paper>

          <Paper elevation={0} sx={{ p: 4, borderRadius: '20px', border: '1px solid rgba(139,26,46,0.08)', mt: 3 }}>
            <Typography variant="h6" sx={{ fontWeight: 700, mb: 3, display: 'flex', alignItems: 'center', gap: 1 }}>
              <Phone size={20} color={COLORS.primary} /> Contact & Pricing Range
            </Typography>
            <Grid container spacing={3}>
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField
                  label="Contact Phone"
                  fullWidth
                  value={businessInfo.contactPhone}
                  onChange={(e) => handleInfoChange({ contactPhone: e.target.value })}
                  InputProps={{ startAdornment: <InputAdornment position="start"><Phone size={16} /></InputAdornment> }}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField
                  label="Contact Email"
                  fullWidth
                  value={businessInfo.contactEmail}
                  onChange={(e) => handleInfoChange({ contactEmail: e.target.value })}
                  InputProps={{ startAdornment: <InputAdornment position="start"><Mail size={16} /></InputAdornment> }}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField
                  label="Website"
                  fullWidth
                  value={businessInfo.website}
                  onChange={(e) => handleInfoChange({ website: e.target.value })}
                  InputProps={{ startAdornment: <InputAdornment position="start"><Globe size={16} /></InputAdornment> }}
                />
              </Grid>
              <Grid size={{ xs: 6, md: 3 }}>
                <TextField
                  label="Min Price (LKR)"
                  fullWidth
                  type="number"
                  value={businessInfo.pricingMin}
                  onChange={(e) => handleInfoChange({ pricingMin: e.target.value })}
                />
              </Grid>
              <Grid size={{ xs: 6, md: 3 }}>
                <TextField
                  label="Max Price (LKR)"
                  fullWidth
                  type="number"
                  value={businessInfo.pricingMax}
                  onChange={(e) => handleInfoChange({ pricingMax: e.target.value })}
                />
              </Grid>
            </Grid>
          </Paper>

          <Paper elevation={0} sx={{ p: 4, borderRadius: '20px', border: '1px solid rgba(139,26,46,0.08)', mt: 3 }}>
            <Typography variant="h6" sx={{ fontWeight: 700, mb: 3 }}>
              Account Settings
            </Typography>

            <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1.5 }}>
              Change Login Email
            </Typography>
            <Grid container spacing={2}>
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField
                  label="New Login Email"
                  fullWidth
                  value={accountEmail}
                  onChange={(e) => setAccountEmail(e.target.value)}
                  InputProps={{ startAdornment: <InputAdornment position="start"><Mail size={16} /></InputAdornment> }}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField
                  label="Current Password"
                  type="password"
                  fullWidth
                  value={emailCurrentPassword}
                  onChange={(e) => setEmailCurrentPassword(e.target.value)}
                />
              </Grid>
              <Grid size={{ xs: 12 }}>
                <Button
                  variant="outlined"
                  onClick={handleUpdateAccountEmail}
                  disabled={emailSaving}
                  sx={{ borderColor: COLORS.primary, color: COLORS.primary, borderRadius: '10px', textTransform: 'none' }}
                >
                  {emailSaving ? 'Updating Email...' : 'Update Email'}
                </Button>
              </Grid>
            </Grid>
            {emailError ? <Alert severity="error" sx={{ mt: 2, borderRadius: '10px' }}>{emailError}</Alert> : null}
            {emailSuccess ? <Alert severity="success" sx={{ mt: 2, borderRadius: '10px' }}>{emailSuccess}</Alert> : null}

            <Divider sx={{ my: 3 }} />

            <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1.5 }}>
              Change Password
            </Typography>
            <Grid container spacing={2}>
              <Grid size={{ xs: 12, md: 4 }}>
                <TextField
                  label="Current Password"
                  type="password"
                  fullWidth
                  value={passwordCurrent}
                  onChange={(e) => setPasswordCurrent(e.target.value)}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 4 }}>
                <TextField
                  label="New Password"
                  type="password"
                  fullWidth
                  value={passwordNew}
                  onChange={(e) => setPasswordNew(e.target.value)}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 4 }}>
                <TextField
                  label="Confirm New Password"
                  type="password"
                  fullWidth
                  value={passwordConfirm}
                  onChange={(e) => setPasswordConfirm(e.target.value)}
                />
              </Grid>
              <Grid size={{ xs: 12 }}>
                <Button
                  variant="outlined"
                  onClick={handleChangePassword}
                  disabled={passwordSaving}
                  sx={{ borderColor: COLORS.primary, color: COLORS.primary, borderRadius: '10px', textTransform: 'none' }}
                >
                  {passwordSaving ? 'Changing Password...' : 'Change Password'}
                </Button>
              </Grid>
            </Grid>
            {passwordError ? <Alert severity="error" sx={{ mt: 2, borderRadius: '10px' }}>{passwordError}</Alert> : null}
            {passwordSuccess ? <Alert severity="success" sx={{ mt: 2, borderRadius: '10px' }}>{passwordSuccess}</Alert> : null}
          </Paper>

          <Box sx={{ mt: 4 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
              <Typography variant="h6" sx={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: 1 }}>
                <DollarSign size={20} color={COLORS.primary} /> Pricing Packages
              </Typography>
              <Button
                variant="outlined"
                startIcon={<Plus size={18} />}
                onClick={addPackage}
                sx={{ color: COLORS.primary, borderColor: COLORS.primary, borderRadius: '10px', textTransform: 'none' }}
              >
                Add Package
              </Button>
            </Box>

            {packages.length === 0 ? (
              <Paper elevation={0} sx={{ p: 3, borderRadius: '16px', border: '1px dashed rgba(0,0,0,0.15)', textAlign: 'center' }}>
                <Typography variant="body2" color="textSecondary">
                  No packages yet. Click "Add Package" to create your first pricing package.
                </Typography>
              </Paper>
            ) : null}

            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              <AnimatePresence>
                {packages.map((pkg) => (
                  <motion.div
                    key={pkg.packageId}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.2 }}
                  >
                    <Paper
                      elevation={0}
                      sx={{
                        p: 3,
                        borderRadius: '16px',
                        border: `1px solid ${pkg.isActive ? 'rgba(139,26,46,0.15)' : 'rgba(0,0,0,0.08)'}`,
                        opacity: pkg.isActive ? 1 : 0.6,
                        position: 'relative',
                      }}
                    >
                      <Box sx={{ position: 'absolute', top: 12, right: 12, display: 'flex', gap: 1, alignItems: 'center' }}>
                        <FormControlLabel
                          control={<Switch size="small" checked={pkg.isActive} onChange={(e) => updatePackage(pkg.packageId, 'isActive', e.target.checked)} />}
                          label={<Typography variant="caption">{pkg.isActive ? 'Active' : 'Hidden'}</Typography>}
                        />
                        <IconButton
                          onClick={() => removePackage(pkg.packageId)}
                          size="small"
                          sx={{ color: 'error.main', bgcolor: 'rgba(211,47,47,0.05)' }}
                        >
                          <Trash2 size={16} />
                        </IconButton>
                      </Box>

                      <Grid container spacing={2} sx={{ pr: 16 }}>
                        <Grid size={{ xs: 12, md: 8 }}>
                          <TextField
                            label="Package Name"
                            fullWidth
                            size="small"
                            value={pkg.name}
                            onChange={(e) => updatePackage(pkg.packageId, 'name', e.target.value)}
                            sx={{ mb: 2 }}
                          />
                          <TextField
                            label="Description"
                            fullWidth
                            multiline
                            rows={2}
                            size="small"
                            value={pkg.description}
                            onChange={(e) => updatePackage(pkg.packageId, 'description', e.target.value)}
                          />
                        </Grid>
                        <Grid size={{ xs: 12, md: 4 }}>
                          <TextField
                            label="Price (LKR)"
                            fullWidth
                            size="small"
                            type="number"
                            value={pkg.price}
                            onChange={(e) => updatePackage(pkg.packageId, 'price', e.target.value)}
                            InputProps={{ startAdornment: <InputAdornment position="start">LKR</InputAdornment> }}
                            sx={{ mb: 2 }}
                          />
                          <TextField
                            label="Duration (hours)"
                            fullWidth
                            size="small"
                            type="number"
                            value={pkg.durationHours}
                            onChange={(e) => updatePackage(pkg.packageId, 'durationHours', e.target.value)}
                          />
                        </Grid>
                      </Grid>
                    </Paper>
                  </motion.div>
                ))}
              </AnimatePresence>
            </Box>
          </Box>
        </Grid>

        <Grid size={{ xs: 12, lg: 5 }}>
          <Paper
            elevation={0}
            sx={{
              p: 4,
              borderRadius: '20px',
              border: '1px solid rgba(139,26,46,0.08)',
              bgcolor: alpha(COLORS.secondary, 0.05),
              position: 'sticky',
              top: 90,
            }}
          >
            <Typography variant="h6" sx={{ fontWeight: 700, mb: 3 }}>Profile Strength</Typography>
            <Box sx={{ mb: 4 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="body2" sx={{ fontWeight: 600 }}>Completion Score</Typography>
                <Typography variant="body2" sx={{ fontWeight: 700, color: strength >= 70 ? '#2e7d32' : COLORS.primary }}>
                  {strength}%
                </Typography>
              </Box>
              <Box sx={{ height: 10, width: '100%', bgcolor: 'rgba(0,0,0,0.05)', borderRadius: 5, overflow: 'hidden' }}>
                <Box
                  sx={{
                    height: '100%',
                    width: `${strength}%`,
                    bgcolor: strength >= 70 ? '#2e7d32' : COLORS.primary,
                    borderRadius: 5,
                    transition: 'width 0.4s ease',
                  }}
                />
              </Box>
            </Box>

            <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 2 }}>Checklist:</Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {[
                { text: 'Business name added', done: !!businessInfo.name },
                { text: 'Category selected', done: !!businessInfo.category },
                { text: 'Description written (30+ chars)', done: businessInfo.description.length > 30 },
                { text: 'Contact phone added', done: !!businessInfo.contactPhone },
                { text: 'Contact email added', done: !!businessInfo.contactEmail },
                { text: 'City / location set', done: !!businessInfo.city },
                { text: 'Service areas selected', done: businessInfo.serviceAreas.length > 0 },
                { text: 'At least 1 pricing package', done: packages.length >= 1 },
                { text: 'At least 3 pricing packages', done: packages.length >= 3 },
                { text: 'Price range set', done: !!businessInfo.pricingMin && !!businessInfo.pricingMax },
              ].map((item, index) => (
                <Box key={index} sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                  {item.done ? <CheckCircle2 size={18} color="#2e7d32" /> : <AlertCircle size={18} color={COLORS.secondary} />}
                  <Typography
                    variant="body2"
                    sx={{ color: item.done ? 'text.secondary' : COLORS.textPrimary, fontWeight: item.done ? 400 : 600 }}
                  >
                    {item.text}
                  </Typography>
                </Box>
              ))}
            </Box>

            <Divider sx={{ my: 4 }} />
            <Typography variant="body2" color="textSecondary">
              Completed profiles receive up to <strong>4x more inquiries</strong>. Couples trust vendors with detailed info and clear pricing.
            </Typography>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
}
