import React, { useState, useCallback, useRef } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Slider,
  Typography,
  IconButton,
  Stack,
  CircularProgress,
  Alert
} from '@mui/material';
import {
  ZoomIn,
  ZoomOut,
  RotateCw,
  RotateCcw,
  Crop,
  Check,
  X,
  Upload
} from 'lucide-react';
import Cropper from 'react-easy-crop';
import type { Area, Point } from 'react-easy-crop';

interface ImageCropperProps {
  open: boolean;
  onClose: () => void;
  imageSrc: string | null;
  onCropComplete: (croppedImage: string) => void;
  aspectRatio?: number; // width/height ratio
  cropShape?: 'rect' | 'round';
  title?: string;
  uploading?: boolean;
  maxOutputWidth?: number;
  maxOutputHeight?: number;
  outputQuality?: number;
}

const MIN_ZOOM = 1;
const MAX_ZOOM = 4;
const ZOOM_SLIDER_STEP = 0.01;
const ZOOM_BUTTON_STEP = 0.05;
const ZOOM_SPEED = 0.15;

function clampZoom(value: number) {
  return Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, Number(value.toFixed(2))));
}

const ImageCropper: React.FC<ImageCropperProps> = ({
  open,
  onClose,
  imageSrc,
  onCropComplete,
  aspectRatio = 1,
  cropShape = 'round',
  title = 'Crop Image',
  uploading = false,
  maxOutputWidth = 1080,
  maxOutputHeight = 1080,
  outputQuality = 0.82,
}) => {
  const [crop, setCrop] = useState<Point>({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [croppedImage, setCroppedImage] = useState<string | null>(null);

  const onCropChange = useCallback((crop: Point) => {
    setCrop(crop);
  }, []);

  const onZoomChange = useCallback((nextZoom: number) => {
    setZoom(clampZoom(nextZoom));
  }, []);

  const adjustZoom = useCallback((delta: number) => {
    setZoom((currentZoom) => clampZoom(currentZoom + delta));
  }, []);

  const onRotationChange = useCallback((rotation: number) => {
    setRotation(rotation);
  }, []);

  const onCropAreaChange = useCallback((croppedArea: Area, croppedAreaPixels: Area) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const createCroppedImage = useCallback(async (): Promise<string | null> => {
    if (!imageSrc || !croppedAreaPixels) return null;

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    const image = new Image();
    image.crossOrigin = 'anonymous';

    return new Promise((resolve) => {
      image.onload = () => {
        const { width, height, x, y } = croppedAreaPixels;
        const scale = Math.min(1, maxOutputWidth / width, maxOutputHeight / height);
        const outputWidth = Math.max(1, Math.round(width * scale));
        const outputHeight = Math.max(1, Math.round(height * scale));

        canvas.width = outputWidth;
        canvas.height = outputHeight;

        ctx.save();

        // Move to center of canvas
        ctx.translate(outputWidth / 2, outputHeight / 2);

        // Rotate
        ctx.rotate((rotation * Math.PI) / 180);

        // Draw the cropped image
        ctx.drawImage(
          image,
          x,
          y,
          width,
          height,
          -outputWidth / 2,
          -outputHeight / 2,
          outputWidth,
          outputHeight
        );

        ctx.restore();

        const croppedImageUrl = canvas.toDataURL('image/jpeg', outputQuality);
        resolve(croppedImageUrl);
      };

      image.src = imageSrc;
    });
  }, [croppedAreaPixels, imageSrc, maxOutputHeight, maxOutputWidth, outputQuality, rotation]);

  const handlePreview = async () => {
    const cropped = await createCroppedImage();
    if (cropped) {
      setCroppedImage(cropped);
    }
  };

  const handleConfirm = async () => {
    const cropped = await createCroppedImage();
    if (cropped) {
      onCropComplete(cropped);
      handleClose();
    }
  };

  const handleClose = () => {
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    setRotation(0);
    setCroppedAreaPixels(null);
    setCroppedImage(null);
    onClose();
  };

  if (!imageSrc) return null;

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: { height: '90vh', maxHeight: '90vh' }
      }}
    >
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <Crop size={20} />
        {title}
      </DialogTitle>

      <DialogContent sx={{ p: 0, display: 'flex', flexDirection: 'column', height: '100%' }}>
        <Box sx={{ flex: 1, position: 'relative', bgcolor: 'black' }}>
          <Cropper
            image={imageSrc}
            crop={crop}
            zoom={zoom}
            minZoom={MIN_ZOOM}
            maxZoom={MAX_ZOOM}
            zoomSpeed={ZOOM_SPEED}
            aspect={aspectRatio}
            rotation={rotation}
            cropShape={cropShape}
            onCropChange={onCropChange}
            onZoomChange={onZoomChange}
            onRotationChange={onRotationChange}
            onCropAreaChange={onCropAreaChange}
            showGrid={false}
            style={{
              containerStyle: { height: '100%', width: '100%' },
              cropAreaStyle: {
                border: '2px solid #8B1A2E',
                color: 'rgba(139, 26, 46, 0.5)'
              }
            }}
          />
        </Box>

        {/* Controls */}
        <Box sx={{ p: 3, borderTop: 1, borderColor: 'divider' }}>
          <Stack spacing={3}>
            {/* Zoom Control */}
            <Box>
              <Typography variant="subtitle2" sx={{ mb: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
                <ZoomIn size={16} />
                Zoom
              </Typography>
              <Stack direction="row" spacing={1} alignItems="center">
                <IconButton
                  size="small"
                  onClick={() => adjustZoom(-ZOOM_BUTTON_STEP)}
                  disabled={zoom <= MIN_ZOOM}
                >
                  <ZoomOut size={16} />
                </IconButton>
                <Slider
                  value={zoom}
                  min={MIN_ZOOM}
                  max={MAX_ZOOM}
                  step={ZOOM_SLIDER_STEP}
                  onChange={(_, value) => setZoom(clampZoom(value as number))}
                  valueLabelDisplay="auto"
                  valueLabelFormat={(value) => `${value.toFixed(2)}x`}
                  sx={{ flex: 1 }}
                />
                <IconButton
                  size="small"
                  onClick={() => adjustZoom(ZOOM_BUTTON_STEP)}
                  disabled={zoom >= MAX_ZOOM}
                >
                  <ZoomIn size={16} />
                </IconButton>
                <Typography variant="caption" sx={{ minWidth: 48, textAlign: 'right' }}>
                  {zoom.toFixed(2)}x
                </Typography>
              </Stack>
            </Box>

            {/* Rotation Control */}
            <Box>
              <Typography variant="subtitle2" sx={{ mb: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
                <RotateCw size={16} />
                Rotation
              </Typography>
              <Stack direction="row" spacing={2} alignItems="center">
                <RotateCcw size={16} />
                <Slider
                  value={rotation}
                  min={-180}
                  max={180}
                  step={1}
                  onChange={(_, value) => setRotation(value as number)}
                  sx={{ flex: 1 }}
                />
                <RotateCw size={16} />
                <Typography variant="caption" sx={{ minWidth: 35 }}>
                  {rotation}°
                </Typography>
              </Stack>
            </Box>

            {/* Preview */}
            {croppedImage && (
              <Alert severity="info" sx={{ mt: 2 }}>
                <Typography variant="body2">
                  Preview of how your image will appear:
                </Typography>
                <Box
                  component="img"
                  src={croppedImage}
                  sx={{
                    mt: 1,
                    maxWidth: '100%',
                    maxHeight: 100,
                    borderRadius: cropShape === 'round' ? '50%' : 1,
                    border: '2px solid #8B1A2E'
                  }}
                  alt="Preview"
                />
              </Alert>
            )}
          </Stack>
        </Box>
      </DialogContent>

      <DialogActions sx={{ p: 3, borderTop: 1, borderColor: 'divider' }}>
        <Button
          onClick={handlePreview}
          variant="outlined"
          disabled={uploading}
          sx={{ mr: 1 }}
        >
          Preview
        </Button>
        <Button onClick={handleClose} disabled={uploading}>
          Cancel
        </Button>
        <Button
          onClick={handleConfirm}
          variant="contained"
          disabled={uploading}
          startIcon={uploading ? <CircularProgress size={16} /> : <Check />}
          sx={{ bgcolor: '#8B1A2E', '&:hover': { bgcolor: '#6B1424' } }}
        >
          {uploading ? 'Uploading...' : 'Confirm Upload'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ImageCropper;