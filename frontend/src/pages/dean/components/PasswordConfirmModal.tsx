import React from 'react';
import {
  Dialog,
  DialogContent,
  Box,
  Typography,
  TextField,
  InputAdornment,
  IconButton,
  Button,
  CircularProgress
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import LockIcon from '@mui/icons-material/Lock';

interface PasswordConfirmModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: (password: string) => void;
  loading?: boolean;
}

const fontStack = '"Google Sans", "Product Sans", Roboto, sans-serif';

export default function PasswordConfirmModal({ open, onClose, onConfirm, loading }: PasswordConfirmModalProps) {
  const [password, setPassword] = React.useState('');

  const handleConfirm = () => {
    if (!password) return;
    onConfirm(password);
  };

  // Reset password when modal closes
  React.useEffect(() => {
    if (!open) setPassword('');
  }, [open]);

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth="xs"
      PaperProps={{
        sx: {
          borderRadius: '24px',
          p: 0,
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
          overflow: 'hidden'
        }
      }}
    >
      <DialogContent sx={{ p: 0, display: 'flex', flexDirection: 'column' }}>
        {/* Header Section */}
        <Box sx={{ p: 3, pt: 4, position: 'relative', bgcolor: '#FFF' }}>
          <IconButton
            onClick={onClose}
            sx={{
              position: 'absolute',
              top: 16,
              right: 16,
              color: '#98A2B3',
              '&:hover': {
                color: '#667085',
                bgcolor: '#F9FAFB'
              }
            }}
          >
            <CloseIcon sx={{ fontSize: '1.25rem' }} />
          </IconButton>
          <Box>
            <Typography sx={{ fontWeight: 800, fontSize: '1.25rem', color: '#101828', fontFamily: fontStack, mb: 0.5 }}>
              Confirm Password Change
            </Typography>
            <Typography sx={{ fontSize: '0.8125rem', color: '#475467', fontFamily: fontStack, lineHeight: 1.3 }}>
              Please enter your current password to authorize this update. This is required to keep your account secure.
            </Typography>
          </Box>
        </Box>

        {/* Input Section */}
        <Box sx={{ px: 3, pb: 4, mt: 1 }}>
          <Typography sx={{ fontSize: '0.875rem', fontWeight: 600, color: '#344054', mb: 1.5 }}>
            Current Password
          </Typography>
          <TextField
            fullWidth
            type="password"
            placeholder="Enter current password..."
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            variant="outlined"
            size="small"
            autoFocus
            onKeyDown={(e) => e.key === 'Enter' && handleConfirm()}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <LockIcon sx={{ color: '#667085', fontSize: '1.25rem' }} />
                </InputAdornment>
              ),
              sx: {
                borderRadius: '12px',
                bgcolor: '#FFF',
                fontFamily: fontStack,
                color: '#101828',
                boxShadow: '0 1px 2px rgba(16, 24, 40, 0.05)',
                '& fieldset': { borderColor: '#D0D5DD' },
              }
            }}
          />
        </Box>

        {/* Footer Section */}
        <Box sx={{ p: 2, px: 3, borderTop: '1px solid #F2F4F7', display: 'flex', gap: 1.5, bgcolor: '#FFF' }}>
          <Button
            fullWidth
            variant="contained"
            disabled={loading || !password}
            onClick={handleConfirm}
            sx={{
              bgcolor: '#0E1217',
              color: '#FFFFFF',
              borderRadius: '100px',
              textTransform: 'none',
              fontWeight: 700,
              fontSize: '0.95rem',
              fontFamily: fontStack,
              py: 1.5,
              px: 4,
              boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              '&:hover': { 
                bgcolor: '#1C2127',
                transform: 'translateY(-2px)',
                boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.15), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
              },
              '&:active': {
                transform: 'translateY(0)',
                boxShadow: '0 5px 10px -3px rgba(0, 0, 0, 0.1)'
              },
              '&.Mui-disabled': {
                bgcolor: '#0E1217',
                opacity: 0.8,
                color: '#FFFFFF'
              }
            }}
          >
            {loading ? (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                <CircularProgress size={18} sx={{ color: '#FFFFFF' }} thickness={6} />
                <span>Updating...</span>
              </Box>
            ) : (
              'Confirm Update'
            )}
          </Button>
        </Box>
      </DialogContent>
    </Dialog>
  );
}
