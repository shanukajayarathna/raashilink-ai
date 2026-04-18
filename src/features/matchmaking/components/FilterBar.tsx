import React, { useState } from 'react';
import { 
  Box, Slider, Chip, FormControl, InputLabel, Select, MenuItem, 
  Typography, Button, Drawer, IconButton, useMediaQuery, useTheme, TextField, InputAdornment,
  Stack, Divider
} from '@mui/material';
import { Filter, X, RotateCcw, Search } from 'lucide-react';
import { DISTRICTS, RELIGIONS } from '@/shared/constants';

interface FilterBarProps {
  onFilterChange: (filters: any) => void;
  onReset: () => void;
}

export default function FilterBar({ onFilterChange, onReset }: FilterBarProps) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [isOpen, setIsOpen] = useState(false);
  
  const [ageRange, setAgeRange] = useState<number[]>([18, 90]);
  const [selectedReligions, setSelectedReligions] = useState<string[]>([]);
  const [district, setDistrict] = useState('');
  const [gender, setGender] = useState('');
  const [heightRange, setHeightRange] = useState<number[]>([140, 200]);
  const [sortBy, setSortBy] = useState('compatibility');
  const [search, setSearch] = useState('');
  const activeFilterCount = [
    search.trim().length > 0,
    selectedReligions.length > 0,
    district !== '',
    gender !== '',
    ageRange[0] !== 18 || ageRange[1] !== 90,
    heightRange[0] !== 140 || heightRange[1] !== 200,
    sortBy !== 'compatibility',
  ].filter(Boolean).length;

  const handleApply = () => {
    onFilterChange({
      ageRange,
      religions: selectedReligions,
      district,
      gender,
      heightRange,
      sortBy,
      search,
    });
    setIsOpen(false);
  };

  const handleReset = () => {
    setAgeRange([18, 90]);
    setSelectedReligions([]);
    setDistrict('');
    setGender('');
    setHeightRange([140, 200]);
    setSortBy('compatibility');
    setSearch('');
    onReset();
  };

  const toggleReligion = (religion: string) => {
    setSelectedReligions(prev => 
      prev.includes(religion) 
        ? prev.filter(r => r !== religion) 
        : [...prev, religion]
    );
  };

  const renderFilterContent = () => (
    <Box sx={{ p: { xs: 2, md: 0 }, width: '100%' }}>
      <Stack direction={{ xs: 'column', lg: 'row' }} spacing={2} alignItems={{ lg: 'center' }} useFlexGap flexWrap="wrap">
        {/* Search */}
        <TextField
          size="small"
          label="Search"
          placeholder="Name, city, job"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              handleApply();
            }
          }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Search size={16} />
              </InputAdornment>
            ),
          }}
          sx={{ minWidth: { xs: '100%', sm: 220 }, maxWidth: { lg: 260 } }}
        />

        {/* Age Filter */}
        <Box sx={{ minWidth: { xs: '100%', sm: 220 }, maxWidth: { lg: 260 } }}>
          <Typography variant="caption" sx={{ fontWeight: 700, color: 'text.secondary', mb: 0.5, display: 'block' }}>
            Age Range: {ageRange[0]} - {ageRange[1]}
          </Typography>
          <Stack direction="row" spacing={1} sx={{ mb: 1 }}>
            <TextField
              size="small"
              label="Min"
              type="number"
              value={ageRange[0]}
              onChange={(e) => {
                const value = Number(e.target.value);
                if (!Number.isFinite(value)) return;
                setAgeRange([Math.max(18, Math.min(value, ageRange[1])), ageRange[1]]);
              }}
              inputProps={{ min: 18, max: 90 }}
              sx={{ width: 76 }}
            />
            <TextField
              size="small"
              label="Max"
              type="number"
              value={ageRange[1]}
              onChange={(e) => {
                const value = Number(e.target.value);
                if (!Number.isFinite(value)) return;
                setAgeRange([ageRange[0], Math.min(90, Math.max(value, ageRange[0]))]);
              }}
              inputProps={{ min: 18, max: 90 }}
              sx={{ width: 76 }}
            />
          </Stack>
          <Slider
            value={ageRange}
            onChange={(_, newValue) => setAgeRange(newValue as number[])}
            valueLabelDisplay="auto"
            min={18}
            max={90}
            size="small"
            sx={{ color: 'secondary.main', py: 0.5 }}
          />
        </Box>

        {/* Religion Filter */}
        <FormControl size="small" sx={{ minWidth: { xs: '100%', sm: 200 }, maxWidth: { lg: 240 } }}>
          <InputLabel>Religion</InputLabel>
          <Select
            multiple
            value={selectedReligions}
            label="Religion"
            onChange={(e) => setSelectedReligions(typeof e.target.value === 'string' ? e.target.value.split(',') : e.target.value)}
            renderValue={(selected) => (
              <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'nowrap', overflow: 'hidden' }}>
                {(selected as string[]).slice(0, 2).map((value) => (
                  <Chip key={value} label={value} size="small" sx={{ height: 20 }} />
                ))}
                {(selected as string[]).length > 2 ? (
                  <Typography variant="caption" sx={{ alignSelf: 'center', color: 'text.secondary' }}>
                    +{(selected as string[]).length - 2}
                  </Typography>
                ) : null}
              </Box>
            )}
            sx={{ borderRadius: 2 }}
          >
            {RELIGIONS.map((r) => (
              <MenuItem key={r} value={r}>{r}</MenuItem>
            ))}
          </Select>
        </FormControl>

        {/* District Filter */}
        <FormControl size="small" sx={{ minWidth: { xs: '100%', sm: 170 } }}>
          <InputLabel>District</InputLabel>
          <Select
            value={district}
            label="District"
            onChange={(e) => setDistrict(e.target.value)}
            sx={{ borderRadius: 2 }}
          >
            <MenuItem value="">All Districts</MenuItem>
            {DISTRICTS.map(d => (
              <MenuItem key={d} value={d}>{d}</MenuItem>
            ))}
          </Select>
        </FormControl>

        {/* Gender Filter */}
        <FormControl size="small" sx={{ minWidth: { xs: '100%', sm: 170 } }}>
          <InputLabel>Gender</InputLabel>
          <Select
            value={gender}
            label="Gender"
            onChange={(e) => setGender(e.target.value)}
            sx={{ borderRadius: 2 }}
          >
            <MenuItem value="">All Genders</MenuItem>
            <MenuItem value="male">Male</MenuItem>
            <MenuItem value="female">Female</MenuItem>
            <MenuItem value="non-binary">Non-binary</MenuItem>
            <MenuItem value="prefer_not_to_say">Prefer not to say</MenuItem>
          </Select>
        </FormControl>

        {/* Sort By */}
        <FormControl size="small" sx={{ minWidth: { xs: '100%', sm: 170 } }}>
          <InputLabel>Sort By</InputLabel>
          <Select
            value={sortBy}
            label="Sort By"
            onChange={(e) => setSortBy(e.target.value)}
            sx={{ borderRadius: 2 }}
          >
            <MenuItem value="compatibility">Compatibility Score</MenuItem>
            <MenuItem value="newest">Newest First</MenuItem>
            <MenuItem value="active">Recently Active</MenuItem>
          </Select>
        </FormControl>

        {/* Actions */}
        <Stack direction="row" spacing={1} alignItems="center" sx={{ ml: { lg: 'auto' } }}>
          <Button 
            variant="text" 
            startIcon={<RotateCcw size={16} />}
            onClick={handleReset}
            sx={{ color: 'text.secondary', fontSize: '0.75rem', fontWeight: 700, minWidth: 80 }}
          >
            Reset
          </Button>
          <Button 
            variant="contained" 
            onClick={handleApply}
            sx={{ 
              bgcolor: 'secondary.main', 
              color: 'primary.main',
              fontWeight: 700,
              borderRadius: 2,
              px: 2.5,
              '&:hover': { bgcolor: 'secondary.dark' }
            }}
          >
            Apply
          </Button>
        </Stack>
      </Stack>
    </Box>
  );

  return (
    <Box sx={{ 
      background: 'linear-gradient(180deg, rgba(255,255,255,0.98) 0%, rgba(250,247,242,0.9) 100%)', 
      p: { xs: 2, md: 3 }, 
      borderRadius: 4, 
      border: '1px solid',
      borderColor: 'divider',
      boxShadow: '0 10px 24px rgba(10,16,24,0.06)',
      mb: 3
    }}>
      {isMobile ? (
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 'bold', color: 'primary.main' }}>
            Matches for you
          </Typography>
          <Button 
            startIcon={<Filter size={18} />}
            onClick={() => setIsOpen(true)}
            sx={{ color: 'primary.main', fontWeight: 700, borderRadius: 2, px: 2 }}
          >
            Filters
          </Button>
          <Drawer
            anchor="bottom"
            open={isOpen}
            onClose={() => setIsOpen(false)}
            PaperProps={{
              sx: { borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: '80vh' }
            }}
          >
            <Box sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="h6" sx={{ fontFamily: 'FONTS.heading', fontWeight: 'bold' }}>Filters</Typography>
              <IconButton onClick={() => setIsOpen(false)}><X size={20} /></IconButton>
            </Box>
            <Divider />
            {renderFilterContent()}
          </Drawer>
        </Box>
      ) : (
        <>
          <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 1.5 }}>
            <Box>
              <Typography variant="subtitle1" sx={{ fontWeight: 800, color: 'primary.main', lineHeight: 1.1 }}>
                Search & Filters
              </Typography>
              <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                Refine matches by preferences and profile details
              </Typography>
            </Box>
            <Chip
              size="small"
              label={activeFilterCount === 0 ? 'No active filters' : `${activeFilterCount} active filters`}
              sx={{
                height: 24,
                fontWeight: 700,
                bgcolor: activeFilterCount > 0 ? 'secondary.main' : 'primary.50',
                color: activeFilterCount > 0 ? 'primary.main' : 'text.secondary',
              }}
            />
          </Stack>
          <Divider sx={{ mb: 2 }} />
          {renderFilterContent()}
        </>
      )}
    </Box>
  );
}


