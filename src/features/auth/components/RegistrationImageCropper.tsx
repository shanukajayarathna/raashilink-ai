import React, { useState, useCallback } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  IconButton,
  Stack,
  Alert
} from '@mui/material';
import {
  ZoomIn,
  ZoomOut,
  RotateCw,
  RotateCcw,
  Check,
  X
} from 'lucide-react';
import Cropper from 'react-easy-crop';
import { Area, Point } from 'react-easy-crop/types';

interface RegistrationImageCropperProps {
  open: boolean;
  onClose: () => void;
  imageFile: File | null;
  onCropComplete: (croppedImage: string) => void;
  aspectRatio?: number;
  cropShape?: 'rect' | 'round';
  title?: string;
}

const RegistrationImageCropper: React.FC<RegistrationImageCropperProps> = ({
  open,
  onClose,
  imageFile,
  onCropComplete,
  aspectRatio = 1,
  cropShape = 'round',
  title = 'Crop Image'
}) => {
  const [crop, setCrop] = useState<Point>({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const onCropChange = useCallback((crop: Point) => {
    setCrop(crop);
  }, []);

  const onZoomChange = useCallback((zoom: number) => {
    setZoom(zoom);
  }, []);

  const onCropAreaChange = useCallback((croppedArea: Area, croppedAreaPixels: Area) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const createCroppedImage = useCallback(async (): Promise<string | null> => {
    if (!imageFile || !croppedAreaPixels) return null;

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    const img = new Image();
    img.crossOrigin = 'anonymous';

    return new Promise((resolve) => {
      img.onload = () => {
        const { width, height, x, y } = croppedAreaPixels;

        canvas.width = width;
        canvas.height = height;

        ctx.save();

        // Move to center of canvas
        ctx.translate(width / 2, height / 2);

        // Rotate
        ctx.rotate((rotation * Math.PI) / 180);

        // Draw the cropped image
        ctx.drawImage(
          img,
          x, y, width, height,  // Source rectangle
          -width / 2, -height / 2, width, height  // Destination rectangle
        );

        ctx.restore();

        const croppedImageUrl = canvas.toDataURL('image/jpeg', 0.9);
        resolve(croppedImageUrl);
      };

      const reader = new FileReader();
      reader.onload = (e) => {
        img.src = e.target?.result as string;
      };
      reader.readAsDataURL(imageFile);
    });
  }, [imageFile, croppedAreaPixels, rotation]);

  const handleCropComplete = async () => {
    setIsProcessing(true);
    try {
      const croppedImage = await createCroppedImage();
      if (croppedImage) {
        onCropComplete(croppedImage);
        onClose();
      }
    } catch (error) {
      console.error('Error cropping image:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRotate = (degrees: number) => {
    setRotation((prev) => (prev + degrees) % 360);
  };

  const handleClose = () => {
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    setRotation(0);
    setCroppedAreaPixels(null);
    onClose();
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: { borderRadius: 3 }
      }}
    >
      <DialogTitle sx={{
        fontFamily: 'Playfair Display',
        fontWeight: 800,
        color: '#8B1A2E',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        {title}
        <IconButton onClick={handleClose} size="small">
          <X size={20} />
        </IconButton>
      </DialogTitle>

      <DialogContent>
        <Box sx={{ width: '100%', mb: 3 }}>
          {/* Cropper Container */}
          <Box sx={{ position: 'relative', width: '100%', height: 400, mb: 2 }}>
            {imageFile && (
              <Cropper
                image={URL.createObjectURL(imageFile)}
                crop={crop}
                zoom={zoom}
                aspect={aspectRatio}
                rotation={rotation}
                cropShape={cropShape}
                onCropChange={onCropChange}
                onZoomChange={onZoomChange}
                onCropAreaChange={onCropAreaChange}
                showGrid={false}
              />
            )}
          </Box>

          {/* Controls */}
          <Stack spacing={2}>
            {/* Zoom Control */}
            <Box>
              <Typography variant="body2" sx={{ mb: 1, fontWeight: 600, color: '#555555' }}>
                Zoom
              </Typography>
              <Stack direction="row" spacing={1} alignItems="center">
                <IconButton
                  size="small"
                  onClick={() => setZoom(Math.max(1, zoom - 0.1))}
                  disabled={zoom <= 1}
                  sx={{ color: '#8B1A2E' }}
                >
                  <ZoomOut size={16} />
                </IconButton>
                <Box sx={{ flex: 1, px: 1 }}>
                  <input
                    type="range"
                    min={1}
                    max={3}
                    step={0.1}
                    value={zoom}
                    onChange={(e) => setZoom(Number(e.target.value))}
                    style={{ width: '100%' }}
                  />
                </Box>
                <IconButton
                  size="small"
                  onClick={() => setZoom(Math.min(3, zoom + 0.1))}
                  disabled={zoom >= 3}
                  sx={{ color: '#8B1A2E' }}
                >
                  <ZoomIn size={16} />
                </IconButton>
              </Stack>
            </Box>

            {/* Rotation Control */}
            <Box>
              <Typography variant="body2" sx={{ mb: 1, fontWeight: 600, color: '#555555' }}>
                Rotation
              </Typography>
              <Stack direction="row" spacing={1}>
                <Button
                  variant="outlined"
                  size="small"
                  onClick={() => handleRotate(-90)}
                  startIcon={<RotateCcw size={16} />}
                  sx={{
                    borderColor: '#C9A84C',
                    color: '#8B1A2E',
                    '&:hover': { borderColor: '#8B1A2E', bgcolor: 'rgba(139,26,46,0.04)' }
                  }}
                >
                  -90°
                </Button>
                <Button
                  variant="outlined"
                  size="small"
                  onClick={() => handleRotate(90)}
                  startIcon={<RotateCw size={16} />}
                  sx={{
                    borderColor: '#C9A84C',
                    color: '#8B1A2E',
                    '&:hover': { borderColor: '#8B1A2E', bgcolor: 'rgba(139,26,46,0.04)' }
                  }}
                >
                  +90°
                </Button>
              </Stack>
            </Box>
          </Stack>
        </Box>
      </DialogContent>

      <DialogActions sx={{ p: 3, pt: 0 }}>
        <Button
          onClick={handleClose}
          sx={{ color: '#555555', fontWeight: 700 }}
        >
          Cancel
        </Button>
        <Button
          onClick={handleCropComplete}
          disabled={isProcessing}
          variant="contained"
          startIcon={isProcessing ? undefined : <Check size={16} />}
          sx={{
            bgcolor: '#8B1A2E',
            '&:hover': { bgcolor: '#6B1424' },
            fontWeight: 800,
            px: 4
          }}
        >
          {isProcessing ? 'Processing...' : 'Apply Crop'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default RegistrationImageCropper;