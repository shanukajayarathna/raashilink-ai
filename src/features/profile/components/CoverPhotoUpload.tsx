import React, { useEffect, useMemo, useRef, useState } from 'react';
import { 
  Box, 
  Typography, 
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
import { Camera, Upload, Check, Trash2 } from 'lucide-react';
import { Stack } from '@mui/material';
import ImageCropper from '../../../shared/components/ImageCropper';

interface CoverPhotoUploadProps {
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

export default function CoverPhotoUpload({
  currentPhoto,
  onUpload,
  onRemove,
  isUploading = false,
  isRemoving = false,
}: CoverPhotoUploadProps) {
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

      const file = new File([blob], 'cover-photo.jpg', { type: 'image/jpeg' });

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
    <>
      <IconButton 
        onClick={() => setOpen(true)}
        sx={{ 
          position: 'absolute', 
          top: 16, 
          right: 16, 
          bgcolor: 'rgba(255,255,255,0.2)', 
          color: 'white', 
          '&:hover': { bgcolor: 'rgba(255,255,255,0.3)' },
          zIndex: 2
        }}
      >
        {isUploading ? <CircularProgress size={20} color="inherit" /> : <Camera size={20} />}
      </IconButton>

      <Dialog 
        open={open} 
        onClose={handleClose}
        PaperProps={{
          sx: { borderRadius: 4, width: '100%', maxWidth: 600 }
        }}
      >
        <DialogTitle sx={{ fontFamily: 'Playfair Display', fontWeight: 800, color: COLORS.primary }}>
          Update Cover Photo
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, py: 2 }}>
            {uploadError && <Alert severity="error" sx={{ width: '100%' }}>{uploadError}</Alert>}
            {!selectedFile ? (
              <Box 
                sx={{ 
                  width: 500, 
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
                  <Typography variant="h6" sx={{ fontWeight: 700 }}>Select Cover Photo</Typography>
                  <Typography variant="caption">JPG, PNG or GIF. Under 6 MB. Recommended: 1200x400px</Typography>
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
                <Box
                  component="img"
                  src={croppedImage || previewUrl || currentPhoto || undefined}
                  alt="Cover preview"
                  sx={{
                    width: '100%',
                    maxWidth: 500,
                    height: 180,
                    objectFit: 'cover',
                    borderRadius: 2,
                    border: `2px solid ${COLORS.secondary}`
                  }}
                />
                <Typography variant="body2" sx={{ color: COLORS.textSecondary, textAlign: 'center' }}>
                  Preview your cropped cover image before saving it to your profile.
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
              aspectRatio={3}
              cropShape="rect"
              title="Crop Cover Photo"
              uploading={isUploading}
              maxOutputWidth={1200}
              maxOutputHeight={400}
              outputQuality={0.82}
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
                {isRemoving ? 'Removing...' : 'Remove Cover'}
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
              {isUploading ? 'Uploading...' : 'Save Cover Photo'}
            </Button>
          </Stack>
        </DialogActions>
      </Dialog>
    </>
  );
}