import React from 'react';
import { Dialog, Box, Typography, Button } from '@mui/material';
import { motion, AnimatePresence } from 'framer-motion';

interface GenericConfirmationModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string | React.ReactNode;
  description: string | React.ReactNode;
  confirmText: string;
  cancelText?: string;
  loading?: boolean;
}

const GenericConfirmationModal: React.FC<GenericConfirmationModalProps> = ({
  open,
  onClose,
  onConfirm,
  title,
  description,
  confirmText,
  cancelText = "Not Now",
  loading = false
}) => {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="xs"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: { xs: '24px', sm: '32px' },
          padding: { xs: '32px 20px', sm: '48px 32px' },
          overflow: 'hidden',
          bgcolor: '#FFF',
          boxShadow: '0 25px 70px -12px rgba(0,0,0,0.18)',
          textAlign: 'center',
          maxWidth: '440px',
          mx: { xs: 2, sm: 'auto' }
        }
      }}
    >
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 15 }}
            transition={{ duration: 0.35, ease: [0.4, 0, 0.2, 1] }}
          >
            <Box display="flex" flexDirection="column" alignItems="center" gap={{ xs: 2.5, sm: 3 }}>
              <Typography
                sx={{
                  fontWeight: 900,
                  color: '#1E293B',
                  fontSize: { xs: '24px', sm: '28px' },
                  lineHeight: 1.2,
                  mb: 0.5,
                  letterSpacing: '-0.03em',
                  fontFamily: '"Google Sans", "Product Sans", Roboto, sans-serif'
                }}
              >
                {title}
              </Typography>
 
              <Typography
                sx={{
                  color: '#64748B',
                  fontSize: { xs: '14px', sm: '16px' },
                  lineHeight: 1.5,
                  mb: { xs: 3, sm: 4 },
                  px: { xs: 1, sm: 2 },
                  fontWeight: 500,
                  fontFamily: '"Google Sans", "Product Sans", Roboto, sans-serif'
                }}
              >
                {description}
              </Typography>
 
              <Box sx={{ width: '100%', display: 'flex', flexDirection: 'column', gap: { xs: 1.5, sm: 2 } }}>
                <Button
                  fullWidth
                  onClick={onConfirm}
                  disabled={loading}
                  variant="contained"
                  sx={{
                    borderRadius: '16px',
                    py: { xs: 1.8, sm: 2.2 },
                    bgcolor: '#3c4043', 
                    color: '#FFF',
                    textTransform: 'none',
                    fontWeight: 800,
                    fontSize: { xs: '16px', sm: '18px' },
                    letterSpacing: '-0.01em',
                    boxShadow: '0 12px 24px -6px rgba(15, 23, 42, 0.3)',
                    '&:hover': {
                      bgcolor: '#202124',
                      boxShadow: '0 20px 35px -10px rgba(15, 23, 42, 0.4)',
                      transform: 'translateY(-2px)'
                    },
                    '&:active': { transform: 'translateY(0)' },
                    transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
                    fontFamily: '"Google Sans", "Product Sans", Roboto, sans-serif'
                  }}
                >
                  {loading ? 'Processing...' : confirmText}
                </Button>
 
                <Button
                  fullWidth
                  onClick={onClose}
                  disabled={loading}
                  variant="text"
                  sx={{
                    textTransform: 'none',
                    fontWeight: 800,
                    fontSize: '16px',
                    color: '#64748B',
                    py: 1,
                    '&:hover': {
                      bgcolor: 'transparent',
                      color: '#1E293B',
                      transform: 'scale(1.02)'
                    },
                    transition: 'all 0.2s ease',
                    fontFamily: '"Google Sans", "Product Sans", Roboto, sans-serif'
                  }}
                >
                  {cancelText}
                </Button>
              </Box>
            </Box>
          </motion.div>
        )}
      </AnimatePresence>
    </Dialog>
  );
};

export default GenericConfirmationModal;
