import React from 'react';
import { Dialog, Box, Typography, Button } from '@mui/material';
import { motion, AnimatePresence } from 'framer-motion';

export type ModalMode = 'success' | 'denied' | 'error';

interface SuccessActionModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  description: string;
  mode?: ModalMode;
}

const SuccessActionModal: React.FC<SuccessActionModalProps> = ({ open, onClose, title, description, mode = 'success' }) => {
  // Mode-based configurations
  const config = {
    success: {
      color: '#B0E0E6', // Powder Blue
      glow: 'rgba(176, 224, 230, 0.4)',
      icon: (
        <motion.path
          d="M20 6L9 17L4 12"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: 1, opacity: 1 }}
          transition={{ delay: 0.5, duration: 0.8, ease: [0.4, 0, 0.2, 1] }}
        />
      )
    },
    denied: {
      color: '#FFB380', // Peach/Orange
      glow: 'rgba(255, 179, 128, 0.4)',
      icon: (
        <>
          <motion.line
            x1="12" y1="8" x2="12" y2="15"
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ pathLength: 1, opacity: 1 }}
            transition={{ delay: 0.5, duration: 0.8 }}
          />
          <motion.circle
            cx="12" cy="18" r="0.5"
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.8, duration: 0.3 }}
          />
        </>
      )
    },
    error: {
      color: '#FF8989', // Soft Red
      glow: 'rgba(255, 137, 137, 0.4)',
      icon: (
        <>
          <motion.line
            x1="18" y1="6" x2="6" y2="18"
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ pathLength: 1, opacity: 1 }}
            transition={{ delay: 0.5, duration: 0.4 }}
          />
          <motion.line
            x1="6" y1="6" x2="18" y2="18"
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ pathLength: 1, opacity: 1 }}
            transition={{ delay: 0.7, duration: 0.4 }}
          />
        </>
      )
    }
  }[mode];

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="xs"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: '32px',
          padding: '48px 32px 32px 32px',
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
            initial={{ opacity: 0, scale: 0.9, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 15 }}
            transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
          >
            <Box display="flex" flexDirection="column" alignItems="center" gap={4}>
              <Box sx={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <motion.div
                  initial={{ opacity: 0, scale: 0.7 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.1, duration: 0.6 }}
                >
                  <Box
                    sx={{
                      width: 160,
                      height: 160,
                      borderRadius: '50%',
                      background: `radial-gradient(circle, ${config.glow} 0%, rgba(176, 224, 230, 0) 70%)`,
                      filter: 'blur(16px)',
                      zIndex: 1
                    }}
                  />
                </motion.div>

                <Box
                  sx={{
                    position: 'absolute',
                    width: 110,
                    height: 110,
                    borderRadius: '50%',
                    bgcolor: config.glow.replace('0.4', '0.1'),
                    border: `1px solid ${config.glow.replace('0.4', '0.2')}`,
                    zIndex: 2
                  }}
                />

                <Box
                  sx={{
                    position: 'absolute',
                    width: 78,
                    height: 78,
                    borderRadius: '50%',
                    bgcolor: config.color,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    border: '3px solid rgba(255, 255, 255, 0.3)',
                    boxShadow: `
                      0 10px 25px ${config.glow},
                      inset 0 -4px 6px rgba(0, 0, 0, 0.05)
                    `,
                    zIndex: 3
                  }}
                >
                  <svg
                    width="42"
                    height="42"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="#FFFFFF"
                    strokeWidth="3.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    style={{ filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.15))' }}
                  >
                    {config.icon}
                  </svg>
                </Box>
              </Box>

              <Box>
                <Typography
                  variant="h5"
                  sx={{
                    fontWeight: 750,
                    color: '#0a0a0a',
                    mb: 1,
                    fontSize: '1.45rem',
                    letterSpacing: '-0.02em',
                    fontFamily: "'Inter', sans-serif"
                  }}
                >
                  {title}
                </Typography>
                <Typography
                  sx={{
                    color: '#64748B',
                    fontSize: '0.9rem',
                    lineHeight: 1.55,
                    px: 3,
                    fontWeight: 500,
                    fontFamily: "'Inter', sans-serif"
                  }}
                >
                  {description}
                </Typography>
              </Box>

              <Button
                fullWidth
                onClick={onClose}
                sx={{
                  mt: 1,
                  borderRadius: '16px',
                  py: 1.8,
                  bgcolor: 'rgba(241, 245, 249, 0.7)',
                  color: '#64748B',
                  textTransform: 'none',
                  fontWeight: 700,
                  fontSize: '1rem',
                  '&:hover': {
                    bgcolor: 'rgba(226, 232, 240, 0.9)',
                    color: '#0F172A'
                  },
                  transition: 'all 0.25s ease-in-out'
                }}
              >
                Close
              </Button>
            </Box>
          </motion.div>
        )}
      </AnimatePresence>
    </Dialog>
  );
};

export default SuccessActionModal;
