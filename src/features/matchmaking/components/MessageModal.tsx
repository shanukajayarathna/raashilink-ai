import React, { useState } from 'react';
import { 
  Dialog, DialogTitle, DialogContent, DialogActions, 
  Button, TextField, Typography, Box, IconButton, 
  CircularProgress, Stack
} from '@mui/material';
import { X, Send, MessageSquare } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface MessageModalProps {
  open: boolean;
  onClose: () => void;
  recipientName: string;
  recipientId: string | null;
  onSend: (content: string) => Promise<void>;
}

export default function MessageModal({ open, onClose, recipientName, recipientId, onSend }: MessageModalProps) {
  const [message, setMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const maxChars = 500;

  const handleSend = async () => {
    if (!message.trim() || isSending) return;
    
    setIsSending(true);
    setError(null);
    try {
      await onSend(message);
      setMessage('');
      onClose();
    } catch (err) {
      setError('Failed to send message. Please try again.');
    } finally {
      setIsSending(false);
    }
  };

  return (
    <Dialog 
      open={open} 
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: { borderRadius: 6, p: 1 }
      }}
    >
      <DialogTitle sx={{ m: 0, p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Stack direction="row" spacing={1.5} alignItems="center">
          <Box sx={{ p: 1, bgcolor: 'primary.50', borderRadius: 2, color: 'primary.main' }}>
            <MessageSquare size={20} />
          </Box>
          <Typography variant="h6" sx={{ fontFamily: 'FONTS.heading', fontWeight: 'bold', color: 'primary.main' }}>
            Message to {recipientName}
          </Typography>
        </Stack>
        <IconButton onClick={onClose} size="small">
          <X size={20} />
        </IconButton>
      </DialogTitle>

      <DialogContent>
        <Typography variant="body2" sx={{ mb: 3, color: 'text.secondary' }}>
          Start your conversation with a warm introduction. Mention something you liked about their profile!
        </Typography>
        
        <TextField
          fullWidth
          multiline
          rows={6}
          placeholder="Write your introduction..."
          value={message}
          onChange={(e) => setMessage(e.target.value.slice(0, maxChars))}
          error={!!error}
          helperText={error}
          sx={{
            '& .MuiOutlinedInput-root': {
              borderRadius: 4,
              bgcolor: 'background.default',
              '& fieldset': { borderColor: 'divider' },
              '&:hover fieldset': { borderColor: 'primary.light' },
            }
          }}
        />
        
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 1 }}>
          <Typography 
            variant="caption" 
            sx={{ 
              color: message.length >= maxChars ? 'error.main' : 'text.secondary',
              fontWeight: 'bold'
            }}
          >
            {message.length} / {maxChars}
          </Typography>
        </Box>
      </DialogContent>

      <DialogActions sx={{ p: 3, pt: 1 }}>
        <Button 
          onClick={onClose} 
          sx={{ color: 'text.secondary', fontWeight: 'bold', textTransform: 'none' }}
        >
          Cancel
        </Button>
        <Button
          variant="contained"
          onClick={handleSend}
          disabled={!message.trim() || isSending}
          startIcon={isSending ? <CircularProgress size={16} color="inherit" /> : <Send size={16} />}
          sx={{ 
            bgcolor: 'primary.main', 
            color: 'white',
            fontWeight: 'bold',
            borderRadius: 3,
            px: 4,
            py: 1.2,
            '&:hover': { bgcolor: 'primary.dark' },
            '&.Mui-disabled': { bgcolor: 'primary.light', color: 'white', opacity: 0.7 }
          }}
        >
          {isSending ? 'Sending...' : 'Send Message'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

