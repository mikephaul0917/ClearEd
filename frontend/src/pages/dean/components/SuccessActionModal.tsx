import React from 'react';
import { Dialog, Box, Typography, Button } from '@mui/material';
import { motion, AnimatePresence } from 'framer-motion';
import CheckIcon from '@mui/icons-material/Check';

interface SuccessActionModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  description: string;
}

const SuccessActionModal: React.FC<SuccessActionModalProps> = ({ open, onClose, title, description }) => {
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
              {/* Perfectly Refined 3D Ambient Icon Section */}
              <Box sx={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                
                {/* 1. Large Ambient Aura Glow */}
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
                      background: 'radial-gradient(circle, rgba(176, 224, 230, 0.2) 0%, rgba(176, 224, 230, 0) 70%)',
                      filter: 'blur(16px)',
                      zIndex: 1
                    }}
                  />
                </motion.div>

                {/* 2. Soft Inner Glass Ring */}
                <Box
                  sx={{
                    position: 'absolute',
                    width: 110,
                    height: 110,
                    borderRadius: '50%',
                    bgcolor: 'rgba(176, 224, 230, 0.1)',
                    border: '1px solid rgba(176, 224, 230, 0.2)',
                    zIndex: 2
                  }}
                />

                {/* 3. Main Crisp 3D Circle */}
                <Box
                  sx={{
                    position: 'absolute',
                    width: 78,
                    height: 78,
                    borderRadius: '50%',
                    bgcolor: '#B0E0E6', // Powder Blue
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    border: '3px solid rgba(255, 255, 255, 0.3)', // Subtle rim
                    boxShadow: `
                      0 10px 25px rgba(176, 224, 230, 0.4),
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
                    <motion.path
                      d="M20 6L9 17L4 12"
                      initial={{ pathLength: 0, opacity: 0 }}
                      animate={{ pathLength: 1, opacity: 1 }}
                      transition={{ 
                        delay: 0.5, 
                        duration: 0.8, 
                        ease: [0.4, 0, 0.2, 1] 
                      }}
                    />
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
