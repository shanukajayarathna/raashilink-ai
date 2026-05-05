import React, { useCallback, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Grid,
  IconButton,
  LinearProgress,
  Paper,
  Tooltip,
  Typography,
  alpha,
} from '@mui/material';
import { Image as ImageIcon, Trash2, Upload, X } from 'lucide-react';
import { useDropzone } from 'react-dropzone';
import { AnimatePresence, motion } from 'motion/react';
import vendorService from '../../services/vendorService';

const COLORS = {
  primary: '#8B1A2E',
  secondary: '#C9A84C',
  accent: '#1A6B72',
  background: '#FAF7F2',
  textPrimary: '#1C1C1C',
  textSecondary: '#555555',
};

const MAX_IMAGE_SIZE_BYTES = 8 * 1024 * 1024;

interface PendingFile {
  file: File;
  preview: string;
  progress: number;
  status: 'pending' | 'uploading' | 'done' | 'error';
  errorMsg?: string;
}

interface PortfolioUploadProps {
  portfolioImages?: string[];
  onUpdate?: (images: string[]) => void;
}

export default function PortfolioUpload({
  portfolioImages = [],
  onUpdate,
}: PortfolioUploadProps) {
  const [pending, setPending] = useState<PendingFile[]>([]);
  const [existingImages, setExistingImages] = useState<string[]>(portfolioImages);
  const [deletingUrl, setDeletingUrl] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState('');

  React.useEffect(() => {
    setExistingImages(portfolioImages);
  }, [portfolioImages]);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    setUploadError('');

    const newPending: PendingFile[] = acceptedFiles.map((file) => ({
      file,
      preview: URL.createObjectURL(file),
      progress: 0,
      status: 'pending',
    }));

    setPending((prev) => [...prev, ...newPending]);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/*': ['.jpeg', '.jpg', '.png', '.webp'] },
    maxSize: MAX_IMAGE_SIZE_BYTES,
  });

  const removePending = (preview: string) => {
    setPending((prev) => {
      const item = prev.find((f) => f.preview === preview);
      if (item) {
        URL.revokeObjectURL(item.preview);
      }
      return prev.filter((f) => f.preview !== preview);
    });
  };

  const handleUploadAll = async () => {
    const toUpload = pending.filter((p) => p.status === 'pending' || p.status === 'error');
    if (toUpload.length === 0) {
      return;
    }

    setPending((prev) =>
      prev.map((p) =>
        p.status === 'pending' || p.status === 'error'
          ? { ...p, status: 'uploading', progress: 0 }
          : p
      )
    );

    try {
      const response = await vendorService.uploadPortfolioImages(
        toUpload.map((p) => p.file),
        (percent: number) => {
          setPending((prev) =>
            prev.map((p) => (p.status === 'uploading' ? { ...p, progress: percent } : p))
          );
        }
      );

      const newImages: string[] = response?.data?.portfolioImages || [];
      setExistingImages(newImages);
      onUpdate?.(newImages);

      setPending((prev) =>
        prev.map((p) => (p.status === 'uploading' ? { ...p, status: 'done', progress: 100 } : p))
      );

      setTimeout(() => {
        setPending((prev) => {
          prev
            .filter((p) => p.status === 'done')
            .forEach((p) => URL.revokeObjectURL(p.preview));
          return prev.filter((p) => p.status !== 'done');
        });
      }, 1500);
    } catch (err: any) {
      setUploadError(err?.response?.data?.message || err?.message || 'Upload failed. Please try again.');
      setPending((prev) =>
        prev.map((p) => (p.status === 'uploading' ? { ...p, status: 'error', progress: 0 } : p))
      );
    }
  };

  const handleDeleteExisting = async (imageUrl: string) => {
    setDeletingUrl(imageUrl);
    try {
      const response = await vendorService.removePortfolioImage(imageUrl);
      const newImages: string[] = response?.data?.portfolioImages || [];
      setExistingImages(newImages);
      onUpdate?.(newImages);
    } catch (err: any) {
      setUploadError(err?.response?.data?.message || err?.message || 'Failed to delete image.');
    } finally {
      setDeletingUrl(null);
    }
  };

  const hasPending = pending.some((p) => p.status === 'pending' || p.status === 'error');

  return (
    <Box>
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box>
          <Typography
            variant="h5"
            sx={{ fontFamily: 'Playfair Display', fontWeight: 700, color: COLORS.primary }}
          >
            Portfolio Management
          </Typography>
          <Typography variant="body2" color="textSecondary">
            Showcase your best work to potential couples. High-quality images attract more bookings.
          </Typography>
        </Box>
        {hasPending && (
          <Button
            variant="contained"
            startIcon={<Upload size={18} />}
            onClick={handleUploadAll}
            sx={{ bgcolor: COLORS.primary, borderRadius: '12px', px: 3, '&:hover': { bgcolor: '#6b1423' } }}
          >
            Upload All
          </Button>
        )}
      </Box>

      {uploadError && (
        <Alert severity="error" sx={{ mb: 3, borderRadius: '12px' }} onClose={() => setUploadError('')}>
          {uploadError}
        </Alert>
      )}

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
          '&:hover': { bgcolor: alpha(COLORS.primary, 0.02), borderColor: COLORS.primary },
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
            mb: 2,
          }}
        >
          <Upload size={32} />
        </Box>
        <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
          {isDragActive ? 'Drop the files here' : 'Drag & drop photos here'}
        </Typography>
        <Typography variant="body2" color="textSecondary" sx={{ mb: 3 }}>
          Support for JPG, PNG, WebP (under 8 MB per file)
        </Typography>
        <Button
          variant="outlined"
          sx={{
            color: COLORS.primary,
            borderColor: COLORS.primary,
            borderRadius: '10px',
            textTransform: 'none',
            px: 4,
            '&:hover': { borderColor: COLORS.primary, bgcolor: alpha(COLORS.primary, 0.05) },
          }}
        >
          Browse Files
        </Button>
      </Paper>

      {pending.length > 0 && (
        <Box sx={{ mt: 4 }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2 }}>
            Queued ({pending.length})
          </Typography>
          <Grid container spacing={2}>
            <AnimatePresence>
              {pending.map((item) => (
                <Grid size={{ xs: 12, sm: 6, md: 4, lg: 3 }} key={item.preview}>
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
                        border: `1px solid ${item.status === 'error' ? '#d32f2f' : 'rgba(0,0,0,0.08)'}`,
                        position: 'relative',
                        overflow: 'hidden',
                      }}
                    >
                      <Box
                        sx={{
                          width: '100%',
                          height: 140,
                          borderRadius: '12px',
                          overflow: 'hidden',
                          mb: 1.5,
                          position: 'relative',
                        }}
                      >
                        <img
                          src={item.preview}
                          alt={item.file.name}
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        />
                        {(item.status === 'pending' || item.status === 'error') && (
                          <IconButton
                            size="small"
                            onClick={() => removePending(item.preview)}
                            sx={{
                              position: 'absolute',
                              top: 8,
                              right: 8,
                              bgcolor: 'rgba(0,0,0,0.5)',
                              color: 'white',
                              '&:hover': { bgcolor: 'rgba(0,0,0,0.7)' },
                            }}
                          >
                            <X size={16} />
                          </IconButton>
                        )}
                      </Box>
                      <Box sx={{ px: 0.5 }}>
                        <Typography
                          variant="caption"
                          sx={{
                            fontWeight: 600,
                            display: 'block',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                            mb: 0.5,
                          }}
                        >
                          {item.file.name}
                        </Typography>
                        {item.status === 'uploading' || item.status === 'done' ? (
                          <LinearProgress
                            variant="determinate"
                            value={item.progress}
                            sx={{
                              height: 6,
                              borderRadius: 3,
                              bgcolor: 'rgba(0,0,0,0.05)',
                              '& .MuiLinearProgress-bar': {
                                bgcolor: item.status === 'done' ? '#2e7d32' : COLORS.primary,
                              },
                            }}
                          />
                        ) : item.status === 'error' ? (
                          <Typography variant="caption" color="error">
                            {item.errorMsg || 'Upload failed'}
                          </Typography>
                        ) : (
                          <Typography variant="caption" color="textSecondary">
                            Ready to upload
                          </Typography>
                        )}
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
          Portfolio ({existingImages.length} {existingImages.length === 1 ? 'photo' : 'photos'})
        </Typography>
        {existingImages.length === 0 ? (
          <Typography variant="body2" color="textSecondary" sx={{ textAlign: 'center', py: 4 }}>
            No portfolio images yet. Upload photos above to showcase your work.
          </Typography>
        ) : (
          <Grid container spacing={3}>
            {existingImages.map((url, i) => (
              <Grid size={{ xs: 12, sm: 6, md: 4, lg: 3 }} key={url}>
                <Paper
                  elevation={0}
                  sx={{
                    borderRadius: '16px',
                    overflow: 'hidden',
                    border: '1px solid rgba(0,0,0,0.05)',
                    '&:hover .overlay': { opacity: 1 },
                  }}
                >
                  <Box sx={{ position: 'relative', height: 200 }}>
                    <img
                      src={url}
                      alt={`Portfolio ${i + 1}`}
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
                        transition: 'opacity 0.2s ease-in-out',
                      }}
                    >
                      <Tooltip title="View full size">
                        <IconButton
                          component="a"
                          href={url}
                          target="_blank"
                          rel="noopener noreferrer"
                          sx={{
                            color: 'white',
                            bgcolor: 'rgba(255,255,255,0.2)',
                            '&:hover': { bgcolor: 'rgba(255,255,255,0.3)' },
                          }}
                        >
                          <ImageIcon size={20} />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Delete image">
                        <IconButton
                          onClick={() => handleDeleteExisting(url)}
                          disabled={deletingUrl === url}
                          sx={{
                            color: 'white',
                            bgcolor: 'rgba(211,47,47,0.4)',
                            '&:hover': { bgcolor: 'rgba(211,47,47,0.6)' },
                          }}
                        >
                          {deletingUrl === url ? (
                            <CircularProgress size={20} sx={{ color: 'white' }} />
                          ) : (
                            <Trash2 size={20} />
                          )}
                        </IconButton>
                      </Tooltip>
                    </Box>
                  </Box>
                  <Box sx={{ p: 2 }}>
                    <Typography variant="caption" color="textSecondary">
                      Photo {i + 1}
                    </Typography>
                  </Box>
                </Paper>
              </Grid>
            ))}
          </Grid>
        )}
      </Box>
    </Box>
  );
}
