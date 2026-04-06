import React, { useState } from 'react';
import { 
  Box, Slider, Chip, FormControl, InputLabel, Select, MenuItem, 
  Typography, Button, Drawer, IconButton, useMediaQuery, useTheme,
  Stack, Divider
} from '@mui/material';
import { Filter, X, RotateCcw } from 'lucide-react';
import { DISTRICTS, RELIGIONS } from '@/shared/constants';

interface FilterBarProps {
  onFilterChange: (filters: any) => void;
  onReset: () => void;
}

export default function FilterBar({ onFilterChange, onReset }: FilterBarProps) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [isOpen, setIsOpen] = useState(false);
  
  const [ageRange, setAgeRange] = useState<number[]>([18, 50]);
  const [selectedReligions, setSelectedReligions] = useState<string[]>([]);
  const [district, setDistrict] = useState('');
  const [heightRange, setHeightRange] = useState<number[]>([140, 200]);
  const [sortBy, setSortBy] = useState('compatibility');

  const handleApply = () => {
    onFilterChange({
      ageRange,
      religions: selectedReligions,
      district,
      heightRange,
      sortBy
    });
    setIsOpen(false);
  };

  const handleReset = () => {
    setAgeRange([18, 50]);
    setSelectedReligions([]);
    setDistrict('');
    setHeightRange([140, 200]);
    setSortBy('compatibility');
    onReset();
  };

  const toggleReligion = (religion: string) => {
    setSelectedReligions(prev => 
      prev.includes(religion) 
        ? prev.filter(r => r !== religion) 
        : [...prev, religion]
    );
  };

  const FilterContent = () => (
    <Box sx={{ p: { xs: 3, md: 0 }, width: { xs: '100%', md: 'auto' } }}>
      <Stack direction={{ xs: 'column', md: 'row' }} spacing={3} alignItems={{ md: 'center' }}>
        {/* Age Filter */}
        <Box sx={{ minWidth: 200 }}>
          <Typography variant="caption" sx={{ fontWeight: 'bold', color: 'primary.main', mb: 1, display: 'block', textTransform: 'uppercase' }}>
            Age Range: {ageRange[0]} - {ageRange[1]}
          </Typography>
          <Slider
            value={ageRange}
            onChange={(_, newValue) => setAgeRange(newValue as number[])}
            valueLabelDisplay="auto"
            min={18}
            max={50}
            size="small"
            sx={{ color: 'secondary.main' }}
          />
        </Box>

        {/* Religion Filter */}
        <Box sx={{ flex: 1 }}>
          <Typography variant="caption" sx={{ fontWeight: 'bold', color: 'primary.main', mb: 1, display: 'block', textTransform: 'uppercase' }}>
            Religion
          </Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
            {RELIGIONS.map(r => (
              <Chip
                key={r}
                label={r}
                onClick={() => toggleReligion(r)}
                variant={selectedReligions.includes(r) ? 'filled' : 'outlined'}
                size="small"
                sx={{ 
                  bgcolor: selectedReligions.includes(r) ? 'primary.main' : 'transparent',
                  color: selectedReligions.includes(r) ? 'white' : 'text.secondary',
                  borderColor: 'primary.light',
                  '&:hover': { bgcolor: selectedReligions.includes(r) ? 'primary.dark' : 'primary.50' }
                }}
              />
            ))}
          </Box>
        </Box>

        {/* District Filter */}
        <FormControl size="small" sx={{ minWidth: 150 }}>
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

        {/* Sort By */}
        <FormControl size="small" sx={{ minWidth: 150 }}>
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
        <Stack direction="row" spacing={2} alignItems="center">
          <Button 
            variant="text" 
            startIcon={<RotateCcw size={16} />}
            onClick={handleReset}
            sx={{ color: 'text.secondary', fontSize: '0.75rem', fontWeight: 'bold' }}
          >
            Reset
          </Button>
          <Button 
            variant="contained" 
            onClick={handleApply}
            sx={{ 
              bgcolor: 'secondary.main', 
              color: 'primary.main',
              fontWeight: 'bold',
              borderRadius: 3,
              px: 3,
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
      bgcolor: 'white', 
      p: 2, 
      borderRadius: 6, 
      border: '1px solid',
      borderColor: 'divider',
      boxShadow: '0 4px 20px rgba(139,26,46,0.05)',
      mb: 4
    }}>
      {isMobile ? (
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 'bold', color: 'primary.main' }}>
            Matches for you
          </Typography>
          <Button 
            startIcon={<Filter size={18} />}
            onClick={() => setIsOpen(true)}
            sx={{ color: 'primary.main', fontWeight: 'bold' }}
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
            <FilterContent />
          </Drawer>
        </Box>
      ) : (
        <FilterContent />
      )}
    </Box>
  );
}


