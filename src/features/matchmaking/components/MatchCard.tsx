import React from 'react';
import { 
  Box, Typography, Avatar, Chip, Button, IconButton, 
  Tooltip, Badge, useTheme, useMediaQuery, Stack
} from '@mui/material';
import { 
  Heart, MessageCircle, MapPin, Briefcase, 
  GraduationCap, Star, Sparkles, Brain, Leaf
} from 'lucide-react';
import { motion } from 'motion/react';
import { cn } from '@/shared/lib/utils';

interface MatchCardProps {
  match: any;
  onViewProfile: (id: string) => void;
  onExpressInterest: (id: string) => void;
  onSendMessage: (id: string) => void;
}

export default function MatchCard({ match, onViewProfile, onExpressInterest, onSendMessage }: MatchCardProps) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  
  const getBandColor = (band: string) => {
    switch (band) {
      case 'EXCELLENT': return '#C9A84C'; // Gold
      case 'GOOD': return '#4CAF50'; // Green
      case 'MODERATE': return '#FF9800'; // Orange
      default: return '#555555';
    }
  };

  const bandColor = getBandColor(match.band);
  const hasImage = Boolean(match.img);
  const displayAge = typeof match.age === 'number' ? `, ${match.age}` : '';
  const displayBio = match.bio || 'No bio available yet.';

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -8 }}
      className="group relative bg-white rounded-[2.5rem] border border-primary/5 shadow-sm overflow-hidden hover:shadow-xl transition-all duration-300"
    >
      {/* Profile Image Section */}
      <Box sx={{ position: 'relative', pt: '100%', overflow: 'hidden' }}>
        {hasImage ? (
          <img 
            src={match.img} 
            alt={match.name} 
            className="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
            referrerPolicy="no-referrer"
          />
        ) : (
          <Box
            sx={{
              position: 'absolute',
              inset: 0,
              bgcolor: 'primary.main',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
            }}
          >
            <Typography variant="h2" sx={{ fontWeight: 800, letterSpacing: 1.5 }}>
              {match.initials || 'RL'}
            </Typography>
          </Box>
        )}
        <Box sx={{ 
          position: 'absolute', 
          inset: 0, 
          background: 'linear-gradient(to top, rgba(0,0,0,0.7) 0%, transparent 40%, transparent 100%)' 
        }} />
        
        {/* Online Indicator */}
        <Box sx={{ position: 'absolute', top: 16, left: 16 }}>
          <Badge
            overlap="circular"
            anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
            variant="dot"
            sx={{
              '& .MuiBadge-badge': {
                backgroundColor: match.isOnline ? '#44b700' : '#bdbdbd',
                color: match.isOnline ? '#44b700' : '#bdbdbd',
                boxShadow: `0 0 0 2px ${theme.palette.background.paper}`,
                '&::after': match.isOnline ? {
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: '100%',
                  borderRadius: '50%',
                  animation: 'ripple 1.2s infinite ease-in-out',
                  border: '1px solid currentColor',
                  content: '""',
                } : {},
              },
              '@keyframes ripple': {
                '0%': { transform: 'scale(.8)', opacity: 1 },
                '100%': { transform: 'scale(2.4)', opacity: 0 },
              },
            }}
          >
            <Avatar 
              sx={{ 
                width: 48, 
                height: 48, 
                border: `3px solid ${bandColor}`,
                p: 0.5,
                bgcolor: 'white'
              }}
            >
              {hasImage ? (
                <img src={match.img} alt={match.name} className="w-full h-full rounded-full object-cover" />
              ) : (
                <Typography variant="subtitle1" sx={{ fontWeight: 700, color: 'primary.main' }}>
                  {match.initials || 'RL'}
                </Typography>
              )}
            </Avatar>
          </Badge>
        </Box>

        {/* Compatibility Badge */}
        <Box sx={{ position: 'absolute', top: 16, right: 16 }}>
          <Chip
            label={match.band}
            size="small"
            sx={{ 
              bgcolor: `${bandColor}CC`, 
              color: 'white', 
              fontWeight: 'bold',
              backdropFilter: 'blur(4px)',
              fontSize: '0.65rem',
              letterSpacing: '0.05em'
            }}
          />
        </Box>

        {/* Name & Basic Info Overlay */}
        <Box sx={{ position: 'absolute', bottom: 16, left: 16, right: 16, color: 'white' }}>
          <Typography variant="h6" sx={{ fontFamily: 'FONTS.heading', fontWeight: 'bold', mb: 0.5 }}>
            {match.name}{displayAge}
          </Typography>
          <Stack direction="row" spacing={1} alignItems="center">
            <MapPin size={12} />
            <Typography variant="caption" sx={{ opacity: 0.8 }}>{match.location}</Typography>
          </Stack>
        </Box>
      </Box>

      {/* Details Section */}
      <Box sx={{ p: 3, display: 'flex', flexDirection: 'column', gap: 2 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Box>
            <Typography variant="h4" sx={{ color: bandColor, fontWeight: 'bold', fontFamily: 'FONTS.heading', lineHeight: 1 }}>
              {match.score}%
            </Typography>
            <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
              Compatible
            </Typography>
          </Box>
          
          <Stack direction="row" spacing={1}>
            <Tooltip title="Stars Aligned">
              <Box sx={{ p: 1, bgcolor: 'primary.50', borderRadius: '12px', color: 'primary.main' }}>
                <Sparkles size={16} />
              </Box>
            </Tooltip>
            <Tooltip title="Similar Personality">
              <Box sx={{ p: 1, bgcolor: 'primary.50', borderRadius: '12px', color: 'primary.main' }}>
                <Brain size={16} />
              </Box>
            </Tooltip>
            <Tooltip title="Lifestyle Match">
              <Box sx={{ p: 1, bgcolor: 'primary.50', borderRadius: '12px', color: 'primary.main' }}>
                <Leaf size={16} />
              </Box>
            </Tooltip>
          </Stack>
        </Box>

        <Stack spacing={1} sx={{ mb: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Briefcase size={14} className="text-primary/40" />
            <Typography variant="body2" sx={{ color: 'text.secondary', fontSize: '0.8rem' }}>{match.job}</Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <GraduationCap size={14} className="text-primary/40" />
            <Typography variant="body2" sx={{ color: 'text.secondary', fontSize: '0.8rem' }}>{match.education}</Typography>
          </Box>
        </Stack>

        <Stack direction="row" spacing={1.5}>
          <Button
            fullWidth
            variant="contained"
            startIcon={<Heart size={16} />}
            onClick={() => onExpressInterest(match.id)}
            sx={{ 
              bgcolor: 'secondary.main', 
              color: 'primary.main',
              fontWeight: 'bold',
              borderRadius: 3,
              py: 1.2,
              '&:hover': { bgcolor: 'secondary.dark' }
            }}
          >
            Interest
          </Button>
          <Button
            fullWidth
            variant="outlined"
            onClick={() => onViewProfile(match.id)}
            sx={{ 
              borderColor: 'primary.light', 
              color: 'primary.main',
              fontWeight: 'bold',
              borderRadius: 3,
              py: 1.2,
              '&:hover': { borderColor: 'primary.main', bgcolor: 'primary.50' }
            }}
          >
            View
          </Button>
        </Stack>
      </Box>
    </motion.div>
  );
}


