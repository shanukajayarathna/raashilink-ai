import React, { useState } from 'react';
import { 
  Box, 
  Typography, 
  Paper, 
  Grid, 
  TextField, 
  Button, 
  MenuItem, 
  Chip, 
  IconButton, 
  Divider,
  alpha,
  useTheme,
  Autocomplete,
  InputAdornment
} from '@mui/material';
import { 
  Save, 
  Plus, 
  Trash2, 
  MapPin, 
  Briefcase, 
  DollarSign, 
  Info,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

const COLORS = {
  primary: '#8B1A2E',
  secondary: '#C9A84C',
  accent: '#1A6B72',
  background: '#FAF7F2',
  textPrimary: '#1C1C1C',
  textSecondary: '#555555',
};

const SRI_LANKAN_DISTRICTS = [
  'Colombo', 'Gampaha', 'Kalutara', 'Kandy', 'Matale', 'Nuwara Eliya', 
  'Galle', 'Matara', 'Hambantota', 'Jaffna', 'Kilinochchi', 'Mannar', 
  'Vavuniya', 'Mullaitivu', 'Batticaloa', 'Ampara', 'Trincomalee', 
  'Kurunegala', 'Puttalam', 'Anuradhapura', 'Polonnaruwa', 'Badulla', 
  'Moneragala', 'Ratnapura', 'Kegalle'
];

interface PricingPackage {
  id: string;
  name: string;
  price: string;
  features: string[];
}

export default function ProfileManagement() {
  const [businessInfo, setBusinessInfo] = useState({
    name: 'Royal Ceylon Photography',
    category: 'Photography',
    description: 'We specialize in capturing the most precious moments of your life with a blend of traditional and modern styles. With over 10 years of experience in Sri Lankan weddings, we ensure every detail is preserved beautifully.',
    serviceAreas: ['Colombo', 'Gampaha', 'Kandy', 'Galle']
  });

  const [packages, setPackages] = useState<PricingPackage[]>([
    { id: '1', name: 'Basic Package', price: '150,000', features: ['6 Hours Coverage', '1 Photographer', 'Digital Album'] },
    { id: '2', name: 'Standard Package', price: '250,000', features: ['10 Hours Coverage', '2 Photographers', 'Physical Album', 'Pre-shoot'] },
    { id: '3', name: 'Premium Package', price: '450,000', features: ['Full Day Coverage', '3 Photographers', 'Cinematic Video', 'Luxury Album', 'Pre-shoot'] },
  ]);

  const addPackage = () => {
    const newPkg: PricingPackage = {
      id: Date.now().toString(),
      name: 'New Package',
      price: '0',
      features: ['Feature 1']
    };
    setPackages([...packages, newPkg]);
  };

  const removePackage = (id: string) => {
    setPackages(packages.filter(p => p.id !== id));
  };

  const updatePackage = (id: string, field: keyof PricingPackage, value: any) => {
    setPackages(packages.map(p => p.id === id ? { ...p, [field]: value } : p));
  };

  return (
    <Box>
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box>
          <Typography variant="h5" sx={{ fontFamily: 'Playfair Display', fontWeight: 700, color: COLORS.primary }}>
            Profile Management
          </Typography>
          <Typography variant="body2" color="textSecondary">
            Update your business information, service areas, and pricing packages.
          </Typography>
        </Box>
        <Button 
          variant="contained" 
          startIcon={<Save size={18} />}
          sx={{ bgcolor: COLORS.primary, borderRadius: '12px', px: 4, '&:hover': { bgcolor: '#6b1423' } }}
        >
          Save Changes
        </Button>
      </Box>

      <Grid container spacing={4}>
        {/* Business Details */}
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
                  onChange={(e) => setBusinessInfo({ ...businessInfo, name: e.target.value })}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField 
                  select 
                  label="Category" 
                  fullWidth 
                  value={businessInfo.category}
                  onChange={(e) => setBusinessInfo({ ...businessInfo, category: e.target.value })}
                >
                  <MenuItem value="Photography">Photography</MenuItem>
                  <MenuItem value="Videography">Videography</MenuItem>
                  <MenuItem value="Catering">Catering</MenuItem>
                  <MenuItem value="Venue">Venue</MenuItem>
                  <MenuItem value="Makeup Artist">Makeup Artist</MenuItem>
                  <MenuItem value="Wedding Planner">Wedding Planner</MenuItem>
                </TextField>
              </Grid>
              <Grid size={{ xs: 12 }}>
                <TextField 
                  label="Business Description" 
                  fullWidth 
                  multiline 
                  rows={4} 
                  value={businessInfo.description}
                  onChange={(e) => setBusinessInfo({ ...businessInfo, description: e.target.value })}
                />
              </Grid>
              <Grid size={{ xs: 12 }}>
                <Autocomplete
                  multiple
                  options={SRI_LANKAN_DISTRICTS}
                  value={businessInfo.serviceAreas}
                  onChange={(_, newValue) => setBusinessInfo({ ...businessInfo, serviceAreas: newValue })}
                  renderInput={(params) => (
                    <TextField {...params} label="Service Areas (Districts)" placeholder="Select districts" />
                  )}
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

          {/* Pricing Packages */}
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
            
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              <AnimatePresence>
                {packages.map((pkg) => (
                  <motion.div
                    key={pkg.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.2 }}
                  >
                    <Paper elevation={0} sx={{ p: 3, borderRadius: '16px', border: '1px solid rgba(0,0,0,0.08)', position: 'relative' }}>
                      <IconButton 
                        onClick={() => removePackage(pkg.id)}
                        sx={{ position: 'absolute', top: 12, right: 12, color: 'error.main', bgcolor: 'rgba(211, 47, 47, 0.05)' }}
                      >
                        <Trash2 size={18} />
                      </IconButton>
                      <Grid container spacing={3}>
                        <Grid size={{ xs: 12, md: 8 }}>
                          <TextField 
                            label="Package Name" 
                            fullWidth 
                            size="small" 
                            value={pkg.name}
                            onChange={(e) => updatePackage(pkg.id, 'name', e.target.value)}
                            sx={{ mb: 2 }}
                          />
                          <TextField 
                            label="Features (Comma separated)" 
                            fullWidth 
                            multiline 
                            rows={2} 
                            size="small" 
                            value={pkg.features.join(', ')}
                            onChange={(e) => updatePackage(pkg.id, 'features', e.target.value.split(',').map(f => f.trim()))}
                          />
                        </Grid>
                        <Grid size={{ xs: 12, md: 4 }}>
                          <TextField 
                            label="Price (LKR)" 
                            fullWidth 
                            size="small" 
                            value={pkg.price}
                            onChange={(e) => updatePackage(pkg.id, 'price', e.target.value)}
                            InputProps={{
                              startAdornment: <InputAdornment position="start">LKR</InputAdornment>
                            }}
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

        {/* Profile Preview / Tips */}
        <Grid size={{ xs: 12, lg: 5 }}>
          <Paper elevation={0} sx={{ p: 4, borderRadius: '20px', border: '1px solid rgba(139,26,46,0.08)', bgcolor: alpha(COLORS.secondary, 0.05), position: 'sticky', top: 90 }}>
            <Typography variant="h6" sx={{ fontWeight: 700, mb: 3 }}>Profile Strength</Typography>
            <Box sx={{ mb: 4 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="body2" sx={{ fontWeight: 600 }}>Completion Score</Typography>
                <Typography variant="body2" sx={{ fontWeight: 700 }}>85%</Typography>
              </Box>
              <Box sx={{ height: 10, width: '100%', bgcolor: 'rgba(0,0,0,0.05)', borderRadius: 5, overflow: 'hidden' }}>
                <Box sx={{ height: '100%', width: '85%', bgcolor: COLORS.primary, borderRadius: 5 }} />
              </Box>
            </Box>

            <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 2 }}>Recommended Actions:</Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {[
                { text: 'Add at least 10 portfolio photos', done: true },
                { text: 'Complete your business description', done: true },
                { text: 'Add at least 3 pricing packages', done: true },
                { text: 'Verify your business license', done: false },
                { text: 'Collect 5 more reviews', done: false },
              ].map((item, i) => (
                <Box key={i} sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                  {item.done ? (
                    <CheckCircle2 size={18} color="#2e7d32" />
                  ) : (
                    <AlertCircle size={18} color={COLORS.secondary} />
                  )}
                  <Typography variant="body2" sx={{ color: item.done ? 'textSecondary' : COLORS.textPrimary, fontWeight: item.done ? 400 : 600 }}>
                    {item.text}
                  </Typography>
                </Box>
              ))}
            </Box>

            <Divider sx={{ my: 4 }} />

            <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 2 }}>Why complete your profile?</Typography>
            <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
              Completed profiles receive up to <strong>4x more inquiries</strong> than incomplete ones. Couples trust vendors who provide detailed information and clear pricing.
            </Typography>
            <Button 
              variant="text" 
              sx={{ color: COLORS.primary, fontWeight: 700, textTransform: 'none', p: 0 }}
            >
              View Profile as Couple
            </Button>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
}

