import React from 'react';
import { Dialog, Box, Typography, Button, CircularProgress } from '@mui/material';
import { motion, AnimatePresence } from 'framer-motion';

interface ConfirmationModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description: React.ReactNode;
  confirmText?: string;
  cancelText?: string;
  loading?: boolean;
}

const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  open,
  onClose,
  onConfirm,
  title,
  description,
  confirmText = "Yes, Confirm",
  cancelText = "Not Now",
  loading = false
}) => {
  return (
    <Dialog
      open={open}
      onClose={loading ? undefined : onClose}
      maxWidth="xs"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: '40px',
          padding: '48px 32px 40px 32px',
          overflow: 'hidden',
          bgcolor: '#FFF',
          boxShadow: '0 25px 50px -12px rgba(0,0,0,0.15)',
          textAlign: 'center'
        }
      }}
    >
      <AnimatePresence mode="wait">
        {open && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 15 }}
            transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
          >
            <Box display="flex" flexDirection="column" alignItems="center" gap={4}>
              <Box>
                <Typography
                  variant="h4"
                  sx={{
                    fontWeight: 850,
                    color: '#0F172A',
                    mb: 4,
                    fontSize: '1.85rem',
                    letterSpacing: '-0.03em',
                    lineHeight: 1.2,
                    fontFamily: '"Google Sans", "Product Sans", Roboto, sans-serif'
                  }}
                >
                  {title}
                </Typography>
                <Typography
                  sx={{
                    color: '#64748B',
                    fontSize: '0.95rem',
                    lineHeight: 1.6,
                    px: 1,
                    fontWeight: 500,
                    fontFamily: '"Google Sans", "Product Sans", Roboto, sans-serif'
                  }}
                >
                  {description}
                </Typography>
              </Box>

              <Box sx={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 1.5, mt: 1 }}>
                <Button
                  fullWidth
                  onClick={onConfirm}
                  disabled={loading}
                  sx={{
                    borderRadius: '99px',
                    py: 2,
                    bgcolor: '#0F172A',
                    color: '#FFF',
                    textTransform: 'none',
                    fontWeight: 800,
                    fontSize: '1.05rem',
                    boxShadow: '0 10px 25px rgba(15, 23, 42, 0.3)',
                    '&:hover': {
                      bgcolor: '#1E293B',
                      transform: 'translateY(-2px)',
                      boxShadow: '0 15px 30px rgba(15, 23, 42, 0.4)'
                    },
                    '&:disabled': {
                      bgcolor: '#94A3B8',
                      color: '#FFF'
                    },
                    transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)'
                  }}
                >
                  {loading ? <CircularProgress size={24} sx={{ color: '#FFF' }} /> : confirmText}
                </Button>

                <Button
                  fullWidth
                  onClick={onClose}
                  disabled={loading}
                  sx={{
                    borderRadius: '99px',
                    py: 1.5,
                    color: '#64748B',
                    textTransform: 'none',
                    fontWeight: 800,
                    fontSize: '1.05rem',
                    '&:hover': {
                      bgcolor: 'rgba(241, 245, 249, 0.7)',
                      color: '#0F172A'
                    },
                    transition: 'all 0.2s ease'
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

export default ConfirmationModal;
