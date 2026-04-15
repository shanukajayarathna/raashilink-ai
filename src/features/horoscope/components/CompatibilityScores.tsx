import React, { useState } from 'react';
import { 
  Box, 
  Typography, 
  Grid, 
  Paper, 
  LinearProgress, 
  IconButton, 
  Collapse, 
  Stack, 
  Chip,
  Avatar,
  Divider
} from '@mui/material';
import { 
  ExpandMore, 
  ExpandLess, 
  CheckCircle, 
  InfoOutlined, 
  Star, 
  Favorite, 
  TrendingUp, 
  Shield, 
  Home, 
  People as Users,
  AutoAwesome as Sparkles
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'motion/react';

// Design Constants
const COLORS = {
  primary: '#8B1A2E',
  secondary: '#C9A84C',
  accent: '#1A6B72',
  background: '#FAF7F2',
  white: '#FFFFFF',
  textPrimary: '#1C1C1C',
  textSecondary: '#555555',
  success: '#4CAF50',
  warning: '#FF9800',
  error: '#F44336'
};

interface SubScore {
  name: string;
  score: number;
  max: number;
  status: 'success' | 'warning' | 'error';
  description?: string;
}

interface Dimension {
  id: string;
  name: string;
  icon: React.ReactNode;
  score: number;
  max: number;
  explanation: string;
  subScores?: SubScore[];
}

interface CompatibilityScoresProps {
  overallScore: number;
  dimensions: Dimension[];
  userA: { name: string; photo: string; sign: string };
  userB: { name: string; photo: string; sign: string };
  explanation?: string;
}

const CompatibilityScores: React.FC<CompatibilityScoresProps> = ({ overallScore, dimensions, userA, userB, explanation }) => {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const getScoreColor = (score: number, max: number) => {
    const percentage = (score / max) * 100;
    if (percentage >= 80) return COLORS.secondary;
    if (percentage >= 50) return COLORS.warning;
    return COLORS.error;
  };

  const getStatusBadge = (score: number) => {
    if (score >= 80) return { label: 'EXCELLENT COMPATIBILITY', color: COLORS.success };
    if (score >= 60) return { label: 'GOOD COMPATIBILITY', color: COLORS.secondary };
    if (score >= 40) return { label: 'MODERATE COMPATIBILITY', color: COLORS.warning };
    return { label: 'LOW COMPATIBILITY', color: COLORS.error };
  };

  const badge = getStatusBadge(overallScore);

  return (
    <Box>
      {/* Overall Score Section */}
      <Grid container spacing={4} alignItems="center" sx={{ mb: 8 }}>
        <Grid size={{ xs: 12, md: 5 }} sx={{ display: 'flex', justifyContent: 'center' }}>
          <Box sx={{ position: 'relative', width: 240, height: 240 }}>
            <svg viewBox="0 0 100 100" style={{ transform: 'rotate(-90deg)', width: '100%', height: '100%' }}>
              <circle cx="50" cy="50" r="45" fill="none" stroke={COLORS.background} strokeWidth="8" />
              <motion.circle 
                cx="50" cy="50" r="45" 
                fill="none" 
                stroke={COLORS.secondary} 
                strokeWidth="8" 
                strokeLinecap="round"
                initial={{ strokeDasharray: "0 283" }}
                animate={{ strokeDasharray: `${(overallScore / 100) * 283} 283` }}
                transition={{ duration: 2, ease: "easeOut" }}
              />
            </svg>
            <Box sx={{ 
              position: 'absolute', 
              top: '50%', 
              left: '50%', 
              transform: 'translate(-50%, -50%)', 
              textAlign: 'center' 
            }}>
              <Typography variant="h2" sx={{ fontFamily: 'Playfair Display', fontWeight: 800, color: COLORS.primary }}>
                {overallScore}
              </Typography>
              <Typography variant="body2" sx={{ color: COLORS.textSecondary, fontWeight: 700 }}>
                / 100
              </Typography>
            </Box>
          </Box>
        </Grid>
        
        <Grid size={{ xs: 12, md: 7 }}>
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
          >
            <Chip 
              label={badge.label} 
              sx={{ 
                bgcolor: badge.color, 
                color: 'white', 
                fontWeight: 800, 
                mb: 2,
                px: 2,
                height: 32,
                fontSize: '0.75rem'
              }} 
            />
            <Typography variant="h4" sx={{ fontFamily: 'Playfair Display', fontWeight: 700, mb: 2, color: COLORS.textPrimary }}>
              A Cosmic Connection
            </Typography>
            <Typography variant="body1" sx={{ color: COLORS.textSecondary, mb: 3, lineHeight: 1.8 }}>
              {explanation || 'Based on the Vedic Ashtakoota system and the RaashiAI comparison engine, this score reflects astrological, personality, lifestyle, and family alignment.'}
            </Typography>
            <Stack direction="row" spacing={1} alignItems="center">
              <Sparkles sx={{ color: COLORS.secondary, fontSize: 18 }} />
              <Typography variant="caption" sx={{ color: COLORS.textSecondary, fontWeight: 600 }}>
                Powered by RaashiAI Match Engine
              </Typography>
            </Stack>
          </motion.div>
        </Grid>
      </Grid>

      {/* Comparison View */}
      <Box sx={{ mb: 8 }}>
        <Typography variant="h6" sx={{ fontFamily: 'Playfair Display', fontWeight: 700, mb: 4, textAlign: 'center' }}>
          Chart Comparison
        </Typography>
        <Grid container spacing={3}>
          {[userA, userB].map((user, idx) => (
            <Grid size={{ xs: 12, md: 6 }} key={idx}>
              <Paper sx={{ 
                p: 3, 
                borderRadius: '24px', 
                bgcolor: 'white', 
                border: '1px solid',
                borderColor: COLORS.background,
                display: 'flex',
                alignItems: 'center',
                gap: 3
              }}>
                <Avatar
                  src={user.photo || undefined}
                  alt={user.name}
                  sx={{
                    width: 64, height: 64,
                    border: `2px solid ${COLORS.secondary}`,
                    bgcolor: `${COLORS.primary}22`,
                    color: COLORS.primary,
                    fontWeight: 800,
                    fontSize: '1.2rem',
                  }}
                >
                  {!user.photo && user.name ? user.name.slice(0, 2).toUpperCase() : null}
                </Avatar>
                <Box>
                  <Typography variant="subtitle1" sx={{ fontWeight: 800, color: COLORS.primary }}>{user.name}</Typography>
                  <Typography variant="body2" sx={{ color: COLORS.textSecondary }}>{user.sign} Moon Sign</Typography>
                  <Box sx={{ mt: 1, display: 'flex', gap: 1 }}>
                    <Chip label="Manglik: No" size="small" sx={{ fontSize: '10px', height: 20 }} />
                    <Chip label="Gana: Deva" size="small" sx={{ fontSize: '10px', height: 20 }} />
                  </Box>
                </Box>
              </Paper>
            </Grid>
          ))}
        </Grid>
      </Box>

      {/* Dimension Breakdown */}
      <Stack spacing={3}>
        {dimensions.map((dim, idx) => (
          <motion.div
            key={dim.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
          >
            <Paper sx={{ 
              p: 3, 
              borderRadius: '24px', 
              bgcolor: 'white', 
              border: '1px solid',
              borderColor: COLORS.background,
              overflow: 'hidden'
            }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Box sx={{ 
                    width: 40, 
                    height: 40, 
                    borderRadius: '12px', 
                    bgcolor: `${COLORS.secondary}15`, 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center',
                    color: COLORS.secondary
                  }}>
                    {dim.icon}
                  </Box>
                  <Box>
                    <Typography variant="subtitle1" sx={{ fontWeight: 800, color: COLORS.textPrimary }}>
                      {dim.name} ({dim.max} points)
                    </Typography>
                    <Typography variant="caption" sx={{ color: COLORS.textSecondary }}>
                      {dim.score}/{dim.max} points achieved
                    </Typography>
                  </Box>
                </Box>
                <Box sx={{ textAlign: 'right' }}>
                  <Typography variant="h6" sx={{ fontWeight: 800, color: getScoreColor(dim.score, dim.max) }}>
                    {Math.round((dim.score / dim.max) * 100)}%
                  </Typography>
                  <IconButton 
                    size="small" 
                    onClick={() => setExpandedId(expandedId === dim.id ? null : dim.id)}
                    sx={{ color: COLORS.textSecondary }}
                  >
                    {expandedId === dim.id ? <ExpandLess /> : <ExpandMore />}
                  </IconButton>
                </Box>
              </Box>
              
              <Box sx={{ position: 'relative', height: 8, bgcolor: COLORS.background, borderRadius: 4, mb: 1 }}>
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${(dim.score / dim.max) * 100}%` }}
                  transition={{ duration: 1.5, ease: "easeOut" }}
                  style={{ 
                    height: '100%', 
                    backgroundColor: getScoreColor(dim.score, dim.max), 
                    borderRadius: 4 
                  }} 
                />
              </Box>

              <Collapse in={expandedId === dim.id}>
                <Box sx={{ mt: 3, pt: 3, borderTop: `1px dashed ${COLORS.background}` }}>
                  <Box sx={{ 
                    p: 3, 
                    bgcolor: COLORS.background, 
                    borderRadius: '16px', 
                    mb: 3,
                    position: 'relative'
                  }}>
                    <Sparkles sx={{ position: 'absolute', top: 12, right: 12, color: COLORS.secondary, opacity: 0.5 }} />
                    <Typography variant="body2" sx={{ color: COLORS.textSecondary, fontStyle: 'italic', lineHeight: 1.8 }}>
                      "{dim.explanation}"
                    </Typography>
                  </Box>

                  {dim.subScores && (
                    <Grid container spacing={2}>
                      {dim.subScores.map((sub, sIdx) => (
                        <Grid size={{ xs: 6, sm: 4, md: 3 }} key={sIdx}>
                          <Box sx={{ p: 2, border: '1px solid', borderColor: COLORS.background, borderRadius: '12px', textAlign: 'center' }}>
                            <Typography variant="caption" sx={{ display: 'block', color: COLORS.textSecondary, fontWeight: 700, mb: 0.5 }}>
                              {sub.name}
                            </Typography>
                            <Typography variant="body2" sx={{ fontWeight: 800, color: COLORS.primary }}>
                              {sub.score}/{sub.max} {sub.score === sub.max && <CheckCircle sx={{ fontSize: 12, color: COLORS.success, ml: 0.5 }} />}
                            </Typography>
                          </Box>
                        </Grid>
                      ))}
                    </Grid>
                  )}
                </Box>
              </Collapse>
            </Paper>
          </motion.div>
        ))}
      </Stack>
    </Box>
  );
};

export default CompatibilityScores;

