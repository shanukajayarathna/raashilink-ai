import React, { useEffect, useMemo, useRef, useState } from 'react';
import { 
  Box, 
  Typography, 
  Avatar, 
  IconButton, 
  Button, 
  Dialog, 
  DialogTitle, 
  DialogContent, 
  DialogActions,
  CircularProgress,
  Alert,
  alpha
} from '@mui/material';
import { Camera, Upload, X, Check, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Stack } from '@mui/material';
import ImageCropper from '../../../shared/components/ImageCropper';

interface ProfilePhotoUploadProps {
  currentPhoto?: string;
  onUpload: (file: File) => Promise<void>;
  onRemove?: () => Promise<void>;
  isUploading?: boolean;
  isRemoving?: boolean;
}

const COLORS = {
  primary: '#8B1A2E',
  secondary: '#C9A84C',
  accent: '#1A6B72',
  cream: '#FAF7F2',
  white: '#FFFFFF',
  textPrimary: '#1C1C1C',
  textSecondary: '#555555',
};
const MAX_IMAGE_SIZE_BYTES = (6 * 1024 * 1024) - 1;

export default function ProfilePhotoUpload({
  currentPhoto,
  onUpload,
  onRemove,
  isUploading = false,
  isRemoving = false,
}: ProfilePhotoUploadProps) {
  const [open, setOpen] = useState(false);
  const [cropperOpen, setCropperOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [croppedImage, setCroppedImage] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const previewUrl = useMemo(() => (selectedFile ? URL.createObjectURL(selectedFile) : null), [selectedFile]);

  useEffect(() => () => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
  }, [previewUrl]);

  const handleFileSelect = (file: File) => {
    if (file.size >= MAX_IMAGE_SIZE_BYTES) {
      setUploadError('Please choose an image under 6 MB.');
      return;
    }

    setUploadError(null);
    setCroppedImage(null);
    setSelectedFile(file);
    setCropperOpen(true);
  };

  const handleCropComplete = (croppedImageData: string) => {
    setCroppedImage(croppedImageData);
    setCropperOpen(false);
  };

  const handleCropperClose = () => {
    setCropperOpen(false);
  };

  const handleUpload = async () => {
    if (!croppedImage && selectedFile) {
      setCropperOpen(true);
      return;
    }

    if (croppedImage) {
      const response = await fetch(croppedImage);
      const blob = await response.blob();
      if (blob.size >= MAX_IMAGE_SIZE_BYTES) {
        setUploadError('The cropped image is still too large. Please crop more tightly or choose a smaller image.');
        return;
      }

      const file = new File([blob], 'profile-photo.jpg', { type: 'image/jpeg' });

      await onUpload(file);
      handleClose();
    }
  };

  const handleRemove = async () => {
    if (!onRemove) return;
    await onRemove();
    handleClose();
  };

  const handleClose = () => {
    setOpen(false);
    setCropperOpen(false);
    setSelectedFile(null);
    setCroppedImage(null);
    setUploadError(null);
  };

  return (
    <Box sx={{ position: 'relative', display: 'inline-block' }}>
      <Box sx={{ position: 'relative', group: 'true' }}>
        <Avatar
          src={croppedImage || currentPhoto}
          sx={{ 
            width: { xs: 120, md: 160 }, 
            height: { xs: 120, md: 160 }, 
            border: '4px solid white',
            boxShadow: '0 8px 32px rgba(139,26,46,0.15)',
            bgcolor: COLORS.cream
          }}
        />
        <IconButton
          onClick={() => setOpen(true)}
          sx={{
            position: 'absolute',
            bottom: 8,
            right: 8,
            bgcolor: COLORS.secondary,
            color: COLORS.primary,
            boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
            '&:hover': { bgcolor: alpha(COLORS.secondary, 0.9), transform: 'scale(1.1)' },
            transition: 'all 0.2s ease'
          }}
        >
          <Camera size={20} />
        </IconButton>
      </Box>

      <Dialog 
        open={open} 
        onClose={handleClose}
        PaperProps={{
          sx: { borderRadius: 4, width: '100%', maxWidth: 500 }
        }}
      >
        <DialogTitle sx={{ fontFamily: 'Playfair Display', fontWeight: 800, color: COLORS.primary }}>
          Update Profile Photo
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, py: 2 }}>
            {uploadError && <Alert severity="error" sx={{ width: '100%' }}>{uploadError}</Alert>}
            {!selectedFile ? (
              <Box 
                sx={{ 
                  width: 300, 
                  height: 200, 
                  borderRadius: 2, 
                  border: `2px dashed ${COLORS.secondary}`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  bgcolor: alpha(COLORS.secondary, 0.05),
                  '&:hover': { bgcolor: alpha(COLORS.secondary, 0.1) }
                }}
                onClick={() => fileInputRef.current?.click()}
              >
                <Stack alignItems="center" spacing={1} sx={{ color: COLORS.textSecondary }}>
                  <Upload size={40} />
                  <Typography variant="h6" sx={{ fontWeight: 700 }}>Select Photo</Typography>
                  <Typography variant="caption">JPG, PNG or GIF. Under 6 MB.</Typography>
                </Stack>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleFileSelect(file);
                  }}
                  accept="image/*"
                  style={{ display: 'none' }}
                />
              </Box>
            ) : (
              <Stack spacing={2} alignItems="center" sx={{ width: '100%' }}>
                <Avatar
                  src={croppedImage || previewUrl || currentPhoto}
                  sx={{
                    width: 140,
                    height: 140,
                    border: `4px solid ${COLORS.secondary}`,
                    boxShadow: '0 8px 24px rgba(139,26,46,0.12)'
                  }}
                />
                <Typography variant="body2" sx={{ color: COLORS.textSecondary, textAlign: 'center' }}>
                  This is how your cropped photo will appear in the profile picture placeholder.
                </Typography>
                <Stack direction="row" spacing={1}>
                  <Button variant="outlined" onClick={() => setCropperOpen(true)}>
                    Adjust Crop
                  </Button>
                  <Button variant="text" onClick={() => fileInputRef.current?.click()}>
                    Choose Another
                  </Button>
                </Stack>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleFileSelect(file);
                  }}
                  accept="image/*"
                  style={{ display: 'none' }}
                />
              </Stack>
            )}

            <ImageCropper
              open={cropperOpen && Boolean(selectedFile)}
              onClose={handleCropperClose}
              imageSrc={previewUrl}
              onCropComplete={handleCropComplete}
              aspectRatio={1}
              cropShape="round"
              title="Crop Profile Photo"
              uploading={isUploading}
              maxOutputWidth={720}
              maxOutputHeight={720}
              outputQuality={0.85}
            />
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 3, justifyContent: 'space-between' }}>
          <Box>
            {currentPhoto && onRemove && (
              <Button
                onClick={handleRemove}
                color="error"
                disabled={isUploading || isRemoving}
                startIcon={isRemoving ? <CircularProgress size={16} color="inherit" /> : <Trash2 size={18} />}
                sx={{ fontWeight: 700 }}
              >
                {isRemoving ? 'Removing...' : 'Remove Photo'}
              </Button>
            )}
          </Box>
          <Stack direction="row" spacing={1}>
            <Button onClick={handleClose} sx={{ color: COLORS.textSecondary, fontWeight: 700 }}>Cancel</Button>
            <Button 
              onClick={handleUpload} 
              disabled={!selectedFile || !croppedImage || isUploading || isRemoving}
              variant="contained"
              startIcon={isUploading ? <CircularProgress size={20} /> : <Check size={20} />}
              sx={{ 
                bgcolor: COLORS.primary, 
                borderRadius: 2, 
                px: 4,
                fontWeight: 800,
                '&:hover': { bgcolor: '#6B1424' }
              }}
            >
              {isUploading ? 'Uploading...' : 'Save Photo'}
            </Button>
          </Stack>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

