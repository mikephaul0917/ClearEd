import React from 'react';
import { Dialog, Box, Typography, Button } from '@mui/material';
import { motion, AnimatePresence } from 'framer-motion';

interface ActivateTermConfirmModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  termName?: string;
  loading?: boolean;
}

const ActivateTermConfirmModal: React.FC<ActivateTermConfirmModalProps> = ({
  open,
  onClose,
  onConfirm,
  termName = "this academic term",
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
          borderRadius: '14px',
          padding: '40px 32px',
          overflow: 'hidden',
          bgcolor: '#FFF',
          boxShadow: '0 25px 50px -12px rgba(0,0,0,0.15)',
          textAlign: 'center'
        }
      }}
    >
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
          >
            <Box display="flex" flexDirection="column" alignItems="center" gap={2}>
              {/* Header Context */}
              <Typography
                variant="h4"
                sx={{
                  fontWeight: 800,
                  color: '#0F172A',
                  fontSize: '1.75rem',
                  lineHeight: 1.2,
                  mb: 1,
                  fontFamily: '"Google Sans", "Product Sans", Roboto, sans-serif'
                }}
              >
                Are You Sure <br /> Want To Activate?
              </Typography>

              <Typography
                sx={{
                  color: '#64748B',
                  fontSize: '0.95rem',
                  lineHeight: 1.5,
                  mb: 3,
                  px: 1,
                  fontFamily: '"Google Sans", "Product Sans", Roboto, sans-serif'
                }}
              >
                You are about to activate <strong>{termName}</strong>. This will set it as the active term for the entire institution and deactivate all other terms.
              </Typography>

              <Box sx={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                <Button
                  fullWidth
                  onClick={onConfirm}
                  disabled={loading}
                  variant="contained"
                  sx={{
                    borderRadius: '8px',
                    py: 2,
                    bgcolor: '#3c4043', 
                    color: '#FFF',
                    textTransform: 'none',
                    fontWeight: 700,
                    fontSize: '1.1rem',
                    boxShadow: '0 10px 15px -3px rgba(60, 64, 67, 0.3)',
                    '&:hover': {
                      bgcolor: '#2d3034',
                      boxShadow: '0 20px 25px -5px rgba(60, 64, 67, 0.4)',
                      transform: 'translateY(-1px)'
                    },
                    '&:active': { transform: 'translateY(0)' },
                    transition: 'all 0.2s ease-in-out',
                    fontFamily: '"Google Sans", "Product Sans", Roboto, sans-serif'
                  }}
                >
                  {loading ? 'Processing...' : "Yes, Activate"}
                </Button>

                <Button
                  fullWidth
                  onClick={onClose}
                  disabled={loading}
                  variant="text"
                  sx={{
                    textTransform: 'none',
                    fontWeight: 700,
                    fontSize: '1rem',
                    color: '#64748B',
                    '&:hover': {
                      bgcolor: 'transparent',
                      color: '#475569',
                      transform: 'scale(1.02)'
                    },
                    transition: 'all 0.2s ease',
                    fontFamily: '"Google Sans", "Product Sans", Roboto, sans-serif'
                  }}
                >
                  Not Now
                </Button>
              </Box>
            </Box>
          </motion.div>
        )}
      </AnimatePresence>
    </Dialog>
  );
};

export default ActivateTermConfirmModal;
