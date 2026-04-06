import React, { useState, useRef } from 'react';
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
  alpha
} from '@mui/material';
import { Camera, Upload, X, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Stack } from '@mui/material';

interface ProfilePhotoUploadProps {
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

export default function ProfilePhotoUpload({ currentPhoto, onUpload, isUploading = false }: ProfilePhotoUploadProps) {
  const [open, setOpen] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUpload = async () => {
    if (selectedFile) {
      await onUpload(selectedFile);
      setOpen(false);
      setPreview(null);
      setSelectedFile(null);
    }
  };

  const handleClose = () => {
    setOpen(false);
    setPreview(null);
    setSelectedFile(null);
  };

  return (
    <Box sx={{ position: 'relative', display: 'inline-block' }}>
      <Box sx={{ position: 'relative', group: 'true' }}>
        <Avatar
          src={currentPhoto}
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
          sx: { borderRadius: 4, width: '100%', maxWidth: 400 }
        }}
      >
        <DialogTitle sx={{ fontFamily: 'Playfair Display', fontWeight: 800, color: COLORS.primary }}>
          Update Profile Photo
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, py: 2 }}>
            <Box 
              sx={{ 
                width: 200, 
                height: 200, 
                borderRadius: '50%', 
                border: `2px dashed ${COLORS.secondary}`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                overflow: 'hidden',
                position: 'relative',
                bgcolor: alpha(COLORS.secondary, 0.05)
              }}
            >
              {preview ? (
                <img src={preview} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                <Stack alignItems="center" spacing={1} sx={{ color: COLORS.textSecondary }}>
                  <Upload size={40} />
                  <Typography variant="caption" sx={{ fontWeight: 700 }}>Click to select</Typography>
                </Stack>
              )}
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept="image/*"
                style={{ position: 'absolute', inset: 0, opacity: 0, cursor: 'pointer' }}
              />
            </Box>
            <Typography variant="body2" sx={{ color: COLORS.textSecondary, textAlign: 'center' }}>
              Upload a clear photo of yourself. JPG, PNG or GIF. Max 5MB.
            </Typography>
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
          <Button onClick={handleClose} sx={{ color: COLORS.textSecondary, fontWeight: 700 }}>Cancel</Button>
          <Button 
            onClick={handleUpload} 
            disabled={!selectedFile || isUploading}
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
        </DialogActions>
      </Dialog>
    </Box>
  );
}

