import React, { useState, useCallback } from 'react';
import { 
  Box, 
  Typography, 
  Paper, 
  Grid, 
  IconButton, 
  Button, 
  LinearProgress, 
  Tooltip,
  useTheme,
  alpha
} from '@mui/material';
import { 
  Upload, 
  X, 
  Image as ImageIcon, 
  FileText, 
  CheckCircle2, 
  AlertCircle,
  Plus,
  Trash2
} from 'lucide-react';
import { useDropzone } from 'react-dropzone';
import { motion, AnimatePresence } from 'motion/react';

const COLORS = {
  primary: '#8B1A2E',
  secondary: '#C9A84C',
  accent: '#1A6B72',
  background: '#FAF7F2',
  textPrimary: '#1C1C1C',
  textSecondary: '#555555',
};
const MAX_IMAGE_SIZE_BYTES = (6 * 1024 * 1024) - 1;

interface FileWithPreview extends File {
  preview: string;
  progress: number;
  status: 'uploading' | 'completed' | 'error';
}

export default function PortfolioUpload() {
  const [files, setFiles] = useState<FileWithPreview[]>([]);
  const theme = useTheme();

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const newFiles = acceptedFiles.map(file => Object.assign(file, {
      preview: URL.createObjectURL(file),
      progress: 0,
      status: 'uploading' as const
    }));

    setFiles(prev => [...prev, ...newFiles]);

    // Simulate upload for each file
    newFiles.forEach(file => {
      let progress = 0;
      const interval = setInterval(() => {
        progress += Math.random() * 30;
        if (progress >= 100) {
          progress = 100;
          clearInterval(interval);
          setFiles(prev => prev.map(f => 
            f.name === file.name ? { ...f, progress: 100, status: 'completed' } : f
          ));
        } else {
          setFiles(prev => prev.map(f => 
            f.name === file.name ? { ...f, progress } : f
          ));
        }
      }, 500);
    });
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.webp']
    },
    maxSize: MAX_IMAGE_SIZE_BYTES
  });

  const removeFile = (fileName: string) => {
    setFiles(prev => prev.filter(f => f.name !== fileName));
  };

  return (
    <Box>
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box>
          <Typography variant="h5" sx={{ fontFamily: 'Playfair Display', fontWeight: 700, color: COLORS.primary }}>
            Portfolio Management
          </Typography>
          <Typography variant="body2" color="textSecondary">
            Showcase your best work to potential couples. High-quality images attract more bookings.
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<Plus size={18} />}
          sx={{
            bgcolor: COLORS.primary,
            borderRadius: '12px',
            textTransform: 'none',
            px: 3,
            '&:hover': { bgcolor: '#6b1423' }
          }}
        >
          Add Album
        </Button>
      </Box>

      <Paper
        {...getRootProps()}
        elevation={0}
        sx={{
          p: 6,
          borderRadius: '20px',
          border: `2px dashed ${isDragActive ? COLORS.primary : 'rgba(139,26,46,0.15)'}`,
          bgcolor: isDragActive ? alpha(COLORS.primary, 0.05) : 'white',
          textAlign: 'center',
          cursor: 'pointer',
          transition: 'all 0.2s ease-in-out',
          '&:hover': {
            bgcolor: alpha(COLORS.primary, 0.02),
            borderColor: COLORS.primary
          }
        }}
      >
        <input {...getInputProps()} />
        <Box
          sx={{
            width: 64,
            height: 64,
            borderRadius: '50%',
            bgcolor: `${COLORS.primary}10`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: COLORS.primary,
            mx: 'auto',
            mb: 2
          }}
        >
          <Upload size={32} />
        </Box>
        <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
          {isDragActive ? 'Drop the files here' : 'Drag & drop photos here'}
        </Typography>
        <Typography variant="body2" color="textSecondary" sx={{ mb: 3 }}>
          Support for JPG, PNG, WebP (under 6 MB per file)
        </Typography>
        <Button
          variant="outlined"
          sx={{
            color: COLORS.primary,
            borderColor: COLORS.primary,
            borderRadius: '10px',
            textTransform: 'none',
            px: 4,
            '&:hover': {
              borderColor: COLORS.primary,
              bgcolor: alpha(COLORS.primary, 0.05)
            }
          }}
        >
          Browse Files
        </Button>
      </Paper>

      {files.length > 0 && (
        <Box sx={{ mt: 4 }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2 }}>
            Uploading Files ({files.length})
          </Typography>
          <Grid container spacing={2}>
            <AnimatePresence>
              {files.map((file, index) => (
                <Grid size={{ xs: 12, sm: 6, md: 4, lg: 3 }} key={file.name}>
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{ duration: 0.2 }}
                  >
                    <Paper
                      elevation={0}
                      sx={{
                        p: 1.5,
                        borderRadius: '16px',
                        border: '1px solid rgba(0,0,0,0.08)',
                        position: 'relative',
                        overflow: 'hidden'
                      }}
                    >
                      <Box
                        sx={{
                          width: '100%',
                          height: 140,
                          borderRadius: '12px',
                          overflow: 'hidden',
                          mb: 1.5,
                          position: 'relative'
                        }}
                      >
                        <img
                          src={file.preview}
                          alt={file.name}
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                          onLoad={() => URL.revokeObjectURL(file.preview)}
                        />
                        <IconButton
                          size="small"
                          onClick={(e) => { e.stopPropagation(); removeFile(file.name); }}
                          sx={{
                            position: 'absolute',
                            top: 8,
                            right: 8,
                            bgcolor: 'rgba(0,0,0,0.5)',
                            color: 'white',
                            '&:hover': { bgcolor: 'rgba(0,0,0,0.7)' }
                          }}
                        >
                          <X size={16} />
                        </IconButton>
                      </Box>
                      
                      <Box sx={{ px: 0.5 }}>
                        <Typography variant="caption" sx={{ fontWeight: 600, display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', mb: 0.5 }}>
                          {file.name}
                        </Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Box sx={{ flexGrow: 1 }}>
                            <LinearProgress 
                              variant="determinate" 
                              value={file.progress} 
                              sx={{ 
                                height: 6, 
                                borderRadius: 3,
                                bgcolor: 'rgba(0,0,0,0.05)',
                                '& .MuiLinearProgress-bar': {
                                  bgcolor: file.status === 'completed' ? '#2e7d32' : COLORS.primary
                                }
                              }}
                            />
                          </Box>
                          {file.status === 'completed' ? (
                            <CheckCircle2 size={16} color="#2e7d32" />
                          ) : (
                            <Typography variant="caption" color="textSecondary">
                              {Math.round(file.progress)}%
                            </Typography>
                          )}
                        </Box>
                      </Box>
                    </Paper>
                  </motion.div>
                </Grid>
              ))}
            </AnimatePresence>
          </Grid>
        </Box>
      )}

      <Box sx={{ mt: 6 }}>
        <Typography variant="h6" sx={{ fontWeight: 600, mb: 3 }}>
          Existing Portfolio
        </Typography>
        <Grid container spacing={3}>
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Grid size={{ xs: 12, sm: 6, md: 4, lg: 3 }} key={i}>
              <Paper
                elevation={0}
                sx={{
                  borderRadius: '16px',
                  overflow: 'hidden',
                  border: '1px solid rgba(0,0,0,0.05)',
                  '&:hover .overlay': { opacity: 1 }
                }}
              >
                <Box sx={{ position: 'relative', height: 200 }}>
                  <img
                    src={`https://picsum.photos/seed/portfolio${i}/400/300`}
                    alt={`Portfolio ${i}`}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                  <Box
                    className="overlay"
                    sx={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      right: 0,
                      bottom: 0,
                      bgcolor: 'rgba(0,0,0,0.4)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 1.5,
                      opacity: 0,
                      transition: 'opacity 0.2s ease-in-out'
                    }}
                  >
                    <IconButton sx={{ color: 'white', bgcolor: 'rgba(255,255,255,0.2)', '&:hover': { bgcolor: 'rgba(255,255,255,0.3)' } }}>
                      <ImageIcon size={20} />
                    </IconButton>
                    <IconButton sx={{ color: 'white', bgcolor: 'rgba(211, 47, 47, 0.4)', '&:hover': { bgcolor: 'rgba(211, 47, 47, 0.6)' } }}>
                      <Trash2 size={20} />
                    </IconButton>
                  </Box>
                </Box>
                <Box sx={{ p: 2 }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>Wedding at Galle Face</Typography>
                  <Typography variant="caption" color="textSecondary">12 Photos • Oct 2025</Typography>
                </Box>
              </Paper>
            </Grid>
          ))}
        </Grid>
      </Box>
    </Box>
  );
}

