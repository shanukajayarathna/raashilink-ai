import React, { useState, useRef } from 'react';
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
  alpha
} from '@mui/material';
import { Camera, Upload, Check } from 'lucide-react';
import { Stack } from '@mui/material';
import ImageCropper from '../../../shared/components/ImageCropper';

interface CoverPhotoUploadProps {
  currentPhoto?: string;
  onUpload: (file: File) => Promise<void>;
  isUploading?: boolean;
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

export default function CoverPhotoUpload({ currentPhoto, onUpload, isUploading = false }: CoverPhotoUploadProps) {
  const [open, setOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [croppedImage, setCroppedImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (file: File) => {
    setSelectedFile(file);
  };

  const handleCropComplete = (croppedImageData: string) => {
    setCroppedImage(croppedImageData);
  };

  const handleUpload = async () => {
    if (croppedImage) {
      // Convert base64 to blob
      const response = await fetch(croppedImage);
      const blob = await response.blob();
      const file = new File([blob], 'cover-photo.jpg', { type: 'image/jpeg' });
      
      await onUpload(file);
      setOpen(false);
      setSelectedFile(null);
      setCroppedImage(null);
    }
  };

  const handleClose = () => {
    setOpen(false);
    setSelectedFile(null);
    setCroppedImage(null);
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
                  <Typography variant="caption">JPG, PNG or GIF. Max 5MB. Recommended: 1200x400px</Typography>
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
              <ImageCropper
                image={URL.createObjectURL(selectedFile)}
                onCropComplete={handleCropComplete}
                aspect={3}
                cropShape="rect"
              />
            )}
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
          <Button onClick={handleClose} sx={{ color: COLORS.textSecondary, fontWeight: 700 }}>Cancel</Button>
          <Button 
            onClick={handleUpload} 
            disabled={!croppedImage || isUploading}
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
        </DialogActions>
      </Dialog>
    </>
  );
}