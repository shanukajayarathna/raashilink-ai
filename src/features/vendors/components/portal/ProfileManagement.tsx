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
  Stack,
  Switch,
  TextField,
  Typography,
  alpha,
} from '@mui/material';
import { AnimatePresence, motion } from 'framer-motion';
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
import vendorService from '../../services/vendorService';
import userService from '@/features/profile/services/userService';

const COLORS = {
  primary: '#8B1A2E',
  secondary: '#C4A35A',
  textPrimary: '#2C1810',
  accent: '#F5ECD7',
};

const VENDOR_CATEGORIES = [
  'Photography',
  'Videography',
  'Catering',
  'Venue',
  'Florist',
  'Music & Entertainment',
  'Decoration',
  'Wedding Cake',
  'Bridal Wear',
  'Grooming',
  'Jewellery',
  'Transportation',
  'Invitation & Stationery',
  'Makeup & Beauty',
  'Event Planning',
  'Other',
];

const SRI_LANKAN_DISTRICTS = [
  'Ampara', 'Anuradhapura', 'Badulla', 'Batticaloa', 'Colombo',
  'Galle', 'Gampaha', 'Hambantota', 'Jaffna', 'Kalutara',
  'Kandy', 'Kegalle', 'Kilinochchi', 'Kurunegala', 'Mannar',
  'Matale', 'Matara', 'Monaragala', 'Mullaitivu', 'Nuwara Eliya',
  'Polonnaruwa', 'Puttalam', 'Ratnapura', 'Trincomalee', 'Vavuniya',
];

interface ProfileManagementProps {
  vendorData: any;
  onSaved: (updated: any) => void;
}

interface BusinessInfo {
  name: string;
  category: string;
  description: string;
  city: string;
  address: string;
  contactPhone: string;
  contactEmail: string;
  website: string;
  pricingMin: string;
  pricingMax: string;
  serviceAreas: string[];
}

interface PricingPackage {
  packageId: string;
  name: string;
  description: string;
  price: string;
  durationHours: string;
  isActive: boolean;
}

function buildBusinessInfo(vendorData: any): BusinessInfo {
  return {
    name: vendorData?.businessName || '',
    category: vendorData?.category || '',
    description: vendorData?.vendorProfile?.description || '',
    city: vendorData?.vendorProfile?.city || '',
    address: vendorData?.vendorProfile?.address || '',
    contactPhone: vendorData?.vendorProfile?.contactPhone || '',
    contactEmail: vendorData?.vendorProfile?.contactEmail || '',
    website: vendorData?.vendorProfile?.website || '',
    pricingMin: vendorData?.vendorProfile?.pricingMin?.toString() || '',
    pricingMax: vendorData?.vendorProfile?.pricingMax?.toString() || '',
    serviceAreas: vendorData?.vendorProfile?.serviceAreas || [],
  };
}

function buildPackages(vendorData: any): PricingPackage[] {
  const raw = vendorData?.vendorProfile?.packages || [];
  return raw.map((p: any) => ({
    packageId: p._id || p.packageId || Math.random().toString(36).slice(2),
    name: p.name || '',
    description: p.description || '',
    price: p.price?.toString() || '',
    durationHours: p.durationHours?.toString() || '',
    isActive: p.isActive !== false,
  }));
}

export default function ProfileManagement({ vendorData, onSaved }: ProfileManagementProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [businessInfo, setBusinessInfo] = useState<BusinessInfo>(() => buildBusinessInfo(vendorData));
  const [packages, setPackages] = useState<PricingPackage[]>(() => buildPackages(vendorData));
  const [saving, setSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [saveError, setSaveError] = useState('');

  const [accountEmail, setAccountEmail] = useState('');
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

  const hasUserEdited = useRef(false);

  useEffect(() => {
    if (!hasUserEdited.current) {
      setBusinessInfo(buildBusinessInfo(vendorData));
      setPackages(buildPackages(vendorData));
    }
  }, [vendorData]);

  const handleInfoChange = (patch: Partial<BusinessInfo>) => {
    hasUserEdited.current = true;
    setBusinessInfo((prev) => ({ ...prev, ...patch }));
  };

  const addPackage = () => {
    hasUserEdited.current = true;
    setPackages((prev) => [
      ...prev,
      { packageId: Math.random().toString(36).slice(2), name: '', description: '', price: '', durationHours: '', isActive: true },
    ]);
  };

  const updatePackage = (id: string, field: keyof PricingPackage, value: any) => {
    hasUserEdited.current = true;
    setPackages((prev) => prev.map((p) => (p.packageId === id ? { ...p, [field]: value } : p)));
  };

  const removePackage = (id: string) => {
    hasUserEdited.current = true;
    setPackages((prev) => prev.filter((p) => p.packageId !== id));
  };

  const startEditing = () => {
    setSaveStatus('idle');
    setIsEditing(true);
  };

  const cancelEditing = () => {
    hasUserEdited.current = false;
    setBusinessInfo(buildBusinessInfo(vendorData));
    setPackages(buildPackages(vendorData));
    setSaveStatus('idle');
    setSaveError('');
    setAccountEmail('');
    setEmailCurrentPassword('');
    setEmailError('');
    setEmailSuccess('');
    setPasswordCurrent('');
    setPasswordNew('');
    setPasswordConfirm('');
    setPasswordError('');
    setPasswordSuccess('');
    setIsEditing(false);
  };

  const handleSave = async () => {
    setSaving(true);
    setSaveStatus('idle');
    try {
      const payload = {
        businessName: businessInfo.name,
        category: businessInfo.category,
        description: businessInfo.description,
        city: businessInfo.city,
        address: businessInfo.address,
        contactPhone: businessInfo.contactPhone,
        contactEmail: businessInfo.contactEmail,
        website: businessInfo.website,
        pricingMin: businessInfo.pricingMin ? Number(businessInfo.pricingMin) : undefined,
        pricingMax: businessInfo.pricingMax ? Number(businessInfo.pricingMax) : undefined,
        serviceAreas: businessInfo.serviceAreas,
        packages: packages.map((p) => ({
          _id: p.packageId,
          name: p.name,
          description: p.description,
          price: p.price ? Number(p.price) : 0,
          durationHours: p.durationHours ? Number(p.durationHours) : 0,
          isActive: p.isActive,
        })),
      };
      const res = await vendorService.updateVendorProfile(payload);
      hasUserEdited.current = false;
      setSaveStatus('success');
      onSaved(res?.vendor || res);
      setTimeout(() => setIsEditing(false), 800);
    } catch (err: any) {
      setSaveStatus('error');
      setSaveError(err?.response?.data?.message || 'Failed to save profile.');
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateAccountEmail = async () => {
    setEmailError('');
    setEmailSuccess('');
    if (!accountEmail || !emailCurrentPassword) { setEmailError('Please fill in both fields.'); return; }
    setEmailSaving(true);
    try {
      await userService.updateContactEmail({ newEmail: accountEmail, currentPassword: emailCurrentPassword });
      setEmailSuccess('Login email updated successfully.');
      setAccountEmail('');
      setEmailCurrentPassword('');
    } catch (err: any) {
      setEmailError(err?.response?.data?.message || 'Failed to update email.');
    } finally {
      setEmailSaving(false);
    }
  };

  const handleChangePassword = async () => {
    setPasswordError('');
    setPasswordSuccess('');
    if (!passwordCurrent || !passwordNew || !passwordConfirm) { setPasswordError('Please fill in all password fields.'); return; }
    if (passwordNew !== passwordConfirm) { setPasswordError('New passwords do not match.'); return; }
    setPasswordSaving(true);
    try {
      await userService.changePassword({ currentPassword: passwordCurrent, newPassword: passwordNew });
      setPasswordSuccess('Password changed successfully.');
      setPasswordCurrent(''); setPasswordNew(''); setPasswordConfirm('');
    } catch (err: any) {
      setPasswordError(err?.response?.data?.message || 'Failed to change password.');
    } finally {
      setPasswordSaving(false);
    }
  };

  const computeStrength = () => {
    let score = 0;
    if (businessInfo.name) score += 10;
    if (businessInfo.category) score += 10;
    if (businessInfo.description.length > 30) score += 15;
    if (businessInfo.contactPhone) score += 10;
    if (businessInfo.contactEmail) score += 10;
    if (businessInfo.city) score += 10;
    if (businessInfo.serviceAreas.length > 0) score += 10;
    if (packages.length >= 1) score += 10;
    if (packages.length >= 3) score += 10;
    if (businessInfo.pricingMin && businessInfo.pricingMax) score += 5;
    return Math.min(score, 100);
  };

  const strength = computeStrength();

  const strengthSidebar = (
    <Paper elevation={0} sx={{ p: 4, borderRadius: '20px', border: '1px solid rgba(139,26,46,0.08)', bgcolor: alpha(COLORS.secondary, 0.05), position: 'sticky', top: 90 }}>
      <Typography variant="h6" sx={{ fontWeight: 700, mb: 3 }}>Profile Strength</Typography>
      <Box sx={{ mb: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
          <Typography variant="body2" sx={{ fontWeight: 600 }}>Completion Score</Typography>
          <Typography variant="body2" sx={{ fontWeight: 700, color: strength >= 70 ? '#2e7d32' : COLORS.primary }}>{strength}%</Typography>
        </Box>
        <Box sx={{ height: 10, width: '100%', bgcolor: 'rgba(0,0,0,0.05)', borderRadius: 5, overflow: 'hidden' }}>
          <Box sx={{ height: '100%', width: `${strength}%`, bgcolor: strength >= 70 ? '#2e7d32' : COLORS.primary, borderRadius: 5, transition: 'width 0.4s ease' }} />
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
            <Typography variant="body2" sx={{ color: item.done ? 'text.secondary' : COLORS.textPrimary, fontWeight: item.done ? 400 : 600 }}>
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
  );

  if (!isEditing) {
    return (
      <Box>
        <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 2, flexWrap: 'wrap' }}>
          <Box>
            <Typography variant="h5" sx={{ fontFamily: 'Playfair Display', fontWeight: 700, color: COLORS.primary }}>Profile Management</Typography>
            <Typography variant="body2" color="textSecondary">Review your business profile. Click Edit Profile to make changes.</Typography>
          </Box>
          <Button variant="contained" startIcon={<Briefcase size={18} />} onClick={startEditing}
            sx={{ bgcolor: COLORS.primary, borderRadius: '12px', px: 4, textTransform: 'none', '&:hover': { bgcolor: '#6b1423' } }}>
            Edit Profile
          </Button>
        </Box>

        <Grid container spacing={3} sx={{ mb: 3 }}>
          <Grid size={{ xs: 12, md: 6, lg: 4 }}>
            <Paper elevation={0} sx={{ p: 3, borderRadius: '18px', border: '1px solid rgba(139,26,46,0.08)' }}>
              <Typography variant="caption" color="textSecondary" sx={{ textTransform: 'uppercase', fontWeight: 700 }}>Business Name</Typography>
              <Typography variant="h6" sx={{ fontWeight: 700, mt: 0.5 }}>{businessInfo.name || 'Not set'}</Typography>
            </Paper>
          </Grid>
          <Grid size={{ xs: 12, md: 6, lg: 4 }}>
            <Paper elevation={0} sx={{ p: 3, borderRadius: '18px', border: '1px solid rgba(139,26,46,0.08)' }}>
              <Typography variant="caption" color="textSecondary" sx={{ textTransform: 'uppercase', fontWeight: 700 }}>Category</Typography>
              <Typography variant="h6" sx={{ fontWeight: 700, mt: 0.5 }}>{businessInfo.category || 'Not set'}</Typography>
            </Paper>
          </Grid>
          <Grid size={{ xs: 12, md: 6, lg: 4 }}>
            <Paper elevation={0} sx={{ p: 3, borderRadius: '18px', border: '1px solid rgba(139,26,46,0.08)' }}>
              <Typography variant="caption" color="textSecondary" sx={{ textTransform: 'uppercase', fontWeight: 700 }}>Profile Strength</Typography>
              <Typography variant="h6" sx={{ fontWeight: 700, mt: 0.5, color: strength >= 70 ? '#2e7d32' : COLORS.primary }}>{strength}%</Typography>
            </Paper>
          </Grid>
        </Grid>

        <Grid container spacing={4}>
          <Grid size={{ xs: 12, lg: 7 }}>
            <Paper elevation={0} sx={{ p: 4, borderRadius: '20px', border: '1px solid rgba(139,26,46,0.08)' }}>
              <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>Business Details</Typography>
              <Stack spacing={1.5}>
                <Typography variant="body2"><strong>Description:</strong> {businessInfo.description || 'Not set'}</Typography>
                <Typography variant="body2"><strong>City:</strong> {businessInfo.city || 'Not set'}</Typography>
                <Typography variant="body2"><strong>Address:</strong> {businessInfo.address || 'Not set'}</Typography>
                <Typography variant="body2"><strong>Service Areas:</strong> {businessInfo.serviceAreas.length > 0 ? businessInfo.serviceAreas.join(', ') : 'Not set'}</Typography>
              </Stack>
            </Paper>

            <Paper elevation={0} sx={{ p: 4, borderRadius: '20px', border: '1px solid rgba(139,26,46,0.08)', mt: 3 }}>
              <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>Contact & Pricing</Typography>
              <Stack spacing={1.5}>
                <Typography variant="body2"><strong>Phone:</strong> {businessInfo.contactPhone || 'Not set'}</Typography>
                <Typography variant="body2"><strong>Email:</strong> {businessInfo.contactEmail || 'Not set'}</Typography>
                <Typography variant="body2"><strong>Website:</strong> {businessInfo.website || 'Not set'}</Typography>
                <Typography variant="body2"><strong>Price Range:</strong> {businessInfo.pricingMin && businessInfo.pricingMax ? `LKR ${businessInfo.pricingMin} – LKR ${businessInfo.pricingMax}` : 'Not set'}</Typography>
              </Stack>
            </Paper>

            <Paper elevation={0} sx={{ p: 4, borderRadius: '20px', border: '1px solid rgba(139,26,46,0.08)', mt: 3 }}>
              <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>Pricing Packages</Typography>
              {packages.length === 0 ? (
                <Typography variant="body2" color="textSecondary">No pricing packages added yet.</Typography>
              ) : (
                <Stack spacing={2}>
                  {packages.map((pkg) => (
                    <Paper key={pkg.packageId} variant="outlined" sx={{ p: 2, borderRadius: '14px', bgcolor: pkg.isActive ? 'white' : 'rgba(0,0,0,0.02)', opacity: pkg.isActive ? 1 : 0.65 }}>
                      <Stack direction="row" justifyContent="space-between" alignItems="center" spacing={2}>
                        <Box>
                          <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>{pkg.name || 'Untitled package'}</Typography>
                          <Typography variant="caption" color="textSecondary">{pkg.description || 'No description added'}</Typography>
                        </Box>
                        <Box sx={{ textAlign: 'right' }}>
                          <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>LKR {pkg.price || '0'}</Typography>
                          <Typography variant="caption" color="textSecondary">{pkg.durationHours || '0'} hours • {pkg.isActive ? 'Active' : 'Hidden'}</Typography>
                        </Box>
                      </Stack>
                    </Paper>
                  ))}
                </Stack>
              )}
            </Paper>
          </Grid>
          <Grid size={{ xs: 12, lg: 5 }}>{strengthSidebar}</Grid>
        </Grid>
      </Box>
    );
  }

  return (
    <Box>
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 2, flexWrap: 'wrap' }}>
        <Box>
          <Typography variant="h5" sx={{ fontFamily: 'Playfair Display', fontWeight: 700, color: COLORS.primary }}>Profile Management</Typography>
          <Typography variant="body2" color="textSecondary">Update your business information, contact details, and pricing packages.</Typography>
        </Box>
        <Stack direction="row" spacing={1.5}>
          <Button variant="outlined" onClick={cancelEditing} disabled={saving}
            sx={{ borderColor: COLORS.primary, color: COLORS.primary, borderRadius: '12px', px: 3, textTransform: 'none' }}>
            Cancel
          </Button>
          <Button variant="contained" startIcon={saving ? <CircularProgress size={16} color="inherit" /> : <Save size={18} />}
            onClick={handleSave} disabled={saving}
            sx={{ bgcolor: COLORS.primary, borderRadius: '12px', px: 4, textTransform: 'none', '&:hover': { bgcolor: '#6b1423' } }}>
            {saving ? 'Saving...' : 'Save Changes'}
          </Button>
        </Stack>
      </Box>

      {saveStatus === 'success' && <Alert severity="success" sx={{ mb: 3, borderRadius: '12px' }}>Profile updated successfully.</Alert>}
      {saveStatus === 'error' && <Alert severity="error" sx={{ mb: 3, borderRadius: '12px' }}>{saveError}</Alert>}

      <Grid container spacing={4}>
        <Grid size={{ xs: 12, lg: 7 }}>
          <Paper elevation={0} sx={{ p: 4, borderRadius: '20px', border: '1px solid rgba(139,26,46,0.08)' }}>
            <Typography variant="h6" sx={{ fontWeight: 700, mb: 3, display: 'flex', alignItems: 'center', gap: 1 }}>
              <Briefcase size={20} color={COLORS.primary} /> Business Details
            </Typography>
            <Grid container spacing={3}>
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField label="Business Name" fullWidth value={businessInfo.name} onChange={(e) => handleInfoChange({ name: e.target.value })} />
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField select label="Category" fullWidth value={businessInfo.category} onChange={(e) => handleInfoChange({ category: e.target.value })}>
                  {VENDOR_CATEGORIES.map((item) => <MenuItem key={item} value={item}>{item}</MenuItem>)}
                </TextField>
              </Grid>
              <Grid size={{ xs: 12 }}>
                <TextField label="Business Description" fullWidth multiline rows={4} value={businessInfo.description} onChange={(e) => handleInfoChange({ description: e.target.value })} />
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField label="City" fullWidth value={businessInfo.city} onChange={(e) => handleInfoChange({ city: e.target.value })}
                  InputProps={{ startAdornment: <InputAdornment position="start"><MapPin size={16} /></InputAdornment> }} />
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField label="Address" fullWidth value={businessInfo.address} onChange={(e) => handleInfoChange({ address: e.target.value })} />
              </Grid>
              <Grid size={{ xs: 12 }}>
                <Autocomplete multiple options={SRI_LANKAN_DISTRICTS} value={businessInfo.serviceAreas}
                  onChange={(_, value) => handleInfoChange({ serviceAreas: value })}
                  renderInput={(params) => <TextField {...params} label="Service Areas (Districts)" placeholder="Select districts" />}
                  renderTags={(value, getTagProps) => value.map((option, index) => (
                    <Chip label={option} {...getTagProps({ index })} sx={{ bgcolor: alpha(COLORS.primary, 0.1), color: COLORS.primary, fontWeight: 600 }} />
                  ))} />
              </Grid>
            </Grid>
          </Paper>

          <Paper elevation={0} sx={{ p: 4, borderRadius: '20px', border: '1px solid rgba(139,26,46,0.08)', mt: 3 }}>
            <Typography variant="h6" sx={{ fontWeight: 700, mb: 3, display: 'flex', alignItems: 'center', gap: 1 }}>
              <Phone size={20} color={COLORS.primary} /> Contact & Pricing Range
            </Typography>
            <Grid container spacing={3}>
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField label="Contact Phone" fullWidth value={businessInfo.contactPhone} onChange={(e) => handleInfoChange({ contactPhone: e.target.value })}
                  InputProps={{ startAdornment: <InputAdornment position="start"><Phone size={16} /></InputAdornment> }} />
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField label="Contact Email" fullWidth value={businessInfo.contactEmail} onChange={(e) => handleInfoChange({ contactEmail: e.target.value })}
                  InputProps={{ startAdornment: <InputAdornment position="start"><Mail size={16} /></InputAdornment> }} />
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField label="Website" fullWidth value={businessInfo.website} onChange={(e) => handleInfoChange({ website: e.target.value })}
                  InputProps={{ startAdornment: <InputAdornment position="start"><Globe size={16} /></InputAdornment> }} />
              </Grid>
              <Grid size={{ xs: 6, md: 3 }}>
                <TextField label="Min Price (LKR)" fullWidth type="number" value={businessInfo.pricingMin} onChange={(e) => handleInfoChange({ pricingMin: e.target.value })} />
              </Grid>
              <Grid size={{ xs: 6, md: 3 }}>
                <TextField label="Max Price (LKR)" fullWidth type="number" value={businessInfo.pricingMax} onChange={(e) => handleInfoChange({ pricingMax: e.target.value })} />
              </Grid>
            </Grid>
          </Paper>

          <Paper elevation={0} sx={{ p: 4, borderRadius: '20px', border: '1px solid rgba(139,26,46,0.08)', mt: 3 }}>
            <Typography variant="h6" sx={{ fontWeight: 700, mb: 3 }}>Account Settings</Typography>
            <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1.5 }}>Change Login Email</Typography>
            <Grid container spacing={2}>
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField label="New Login Email" fullWidth value={accountEmail} onChange={(e) => setAccountEmail(e.target.value)}
                  InputProps={{ startAdornment: <InputAdornment position="start"><Mail size={16} /></InputAdornment> }} />
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField label="Current Password" type="password" fullWidth value={emailCurrentPassword} onChange={(e) => setEmailCurrentPassword(e.target.value)} />
              </Grid>
              <Grid size={{ xs: 12 }}>
                <Button variant="outlined" onClick={handleUpdateAccountEmail} disabled={emailSaving}
                  sx={{ borderColor: COLORS.primary, color: COLORS.primary, borderRadius: '10px', textTransform: 'none' }}>
                  {emailSaving ? 'Updating Email...' : 'Update Email'}
                </Button>
              </Grid>
            </Grid>
            {emailError && <Alert severity="error" sx={{ mt: 2, borderRadius: '10px' }}>{emailError}</Alert>}
            {emailSuccess && <Alert severity="success" sx={{ mt: 2, borderRadius: '10px' }}>{emailSuccess}</Alert>}

            <Divider sx={{ my: 3 }} />
            <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1.5 }}>Change Password</Typography>
            <Grid container spacing={2}>
              <Grid size={{ xs: 12, md: 4 }}>
                <TextField label="Current Password" type="password" fullWidth value={passwordCurrent} onChange={(e) => setPasswordCurrent(e.target.value)} />
              </Grid>
              <Grid size={{ xs: 12, md: 4 }}>
                <TextField label="New Password" type="password" fullWidth value={passwordNew} onChange={(e) => setPasswordNew(e.target.value)} />
              </Grid>
              <Grid size={{ xs: 12, md: 4 }}>
                <TextField label="Confirm New Password" type="password" fullWidth value={passwordConfirm} onChange={(e) => setPasswordConfirm(e.target.value)} />
              </Grid>
              <Grid size={{ xs: 12 }}>
                <Button variant="outlined" onClick={handleChangePassword} disabled={passwordSaving}
                  sx={{ borderColor: COLORS.primary, color: COLORS.primary, borderRadius: '10px', textTransform: 'none' }}>
                  {passwordSaving ? 'Changing Password...' : 'Change Password'}
                </Button>
              </Grid>
            </Grid>
            {passwordError && <Alert severity="error" sx={{ mt: 2, borderRadius: '10px' }}>{passwordError}</Alert>}
            {passwordSuccess && <Alert severity="success" sx={{ mt: 2, borderRadius: '10px' }}>{passwordSuccess}</Alert>}
          </Paper>

          <Box sx={{ mt: 4 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
              <Typography variant="h6" sx={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: 1 }}>
                <DollarSign size={20} color={COLORS.primary} /> Pricing Packages
              </Typography>
              <Button variant="outlined" startIcon={<Plus size={18} />} onClick={addPackage}
                sx={{ color: COLORS.primary, borderColor: COLORS.primary, borderRadius: '10px', textTransform: 'none' }}>
                Add Package
              </Button>
            </Box>

            {packages.length === 0 && (
              <Paper elevation={0} sx={{ p: 3, borderRadius: '16px', border: '1px dashed rgba(0,0,0,0.15)', textAlign: 'center' }}>
                <Typography variant="body2" color="textSecondary">No packages yet. Click "Add Package" to create your first pricing package.</Typography>
              </Paper>
            )}

            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              <AnimatePresence>
                {packages.map((pkg) => (
                  <motion.div key={pkg.packageId} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }} transition={{ duration: 0.2 }}>
                    <Paper elevation={0} sx={{ p: 3, borderRadius: '16px', border: `1px solid ${pkg.isActive ? 'rgba(139,26,46,0.15)' : 'rgba(0,0,0,0.08)'}`, opacity: pkg.isActive ? 1 : 0.6, position: 'relative' }}>
                      <Box sx={{ position: 'absolute', top: 12, right: 12, display: 'flex', gap: 1, alignItems: 'center' }}>
                        <FormControlLabel
                          control={<Switch size="small" checked={pkg.isActive} onChange={(e) => updatePackage(pkg.packageId, 'isActive', e.target.checked)} />}
                          label={<Typography variant="caption">{pkg.isActive ? 'Active' : 'Hidden'}</Typography>}
                        />
                        <IconButton onClick={() => removePackage(pkg.packageId)} size="small" sx={{ color: 'error.main', bgcolor: 'rgba(211,47,47,0.05)' }}>
                          <Trash2 size={16} />
                        </IconButton>
                      </Box>
                      <Grid container spacing={2} sx={{ pr: 16 }}>
                        <Grid size={{ xs: 12, md: 8 }}>
                          <TextField label="Package Name" fullWidth size="small" value={pkg.name} onChange={(e) => updatePackage(pkg.packageId, 'name', e.target.value)} sx={{ mb: 2 }} />
                          <TextField label="Description" fullWidth multiline rows={2} size="small" value={pkg.description} onChange={(e) => updatePackage(pkg.packageId, 'description', e.target.value)} />
                        </Grid>
                        <Grid size={{ xs: 12, md: 4 }}>
                          <TextField label="Price (LKR)" fullWidth size="small" type="number" value={pkg.price} onChange={(e) => updatePackage(pkg.packageId, 'price', e.target.value)}
                            InputProps={{ startAdornment: <InputAdornment position="start">LKR</InputAdornment> }} sx={{ mb: 2 }} />
                          <TextField label="Duration (hours)" fullWidth size="small" type="number" value={pkg.durationHours} onChange={(e) => updatePackage(pkg.packageId, 'durationHours', e.target.value)} />
                        </Grid>
                      </Grid>
                    </Paper>
                  </motion.div>
                ))}
              </AnimatePresence>
            </Box>
          </Box>
        </Grid>

        <Grid size={{ xs: 12, lg: 5 }}>{strengthSidebar}</Grid>
      </Grid>
    </Box>
  );
}
