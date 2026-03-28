import React from 'react';
import { Dialog, Box, Typography, Button, IconButton } from '@mui/material';
import { motion, AnimatePresence } from 'framer-motion';

interface RevokeApprovalModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  studentName?: string;
  loading?: boolean;
}

const RevokeApprovalModal: React.FC<RevokeApprovalModalProps> = ({ 
  open, 
  onClose, 
  onConfirm, 
  studentName = "this student",
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
          borderRadius: '32px',
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
                  mb: 1
                }}
              >
                Are You Sure <br /> Want To Revoke?
              </Typography>

              <Typography 
                sx={{ 
                  color: '#64748B', 
                  fontSize: '0.95rem', 
                  lineHeight: 1.5,
                  mb: 3,
                  px: 1
                }}
              >
                You are about to revoke the final approval for <strong>{studentName}</strong>. This status will be reverted to pending.
              </Typography>

              <Box sx={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                <Button
                  fullWidth
                  onClick={onConfirm}
                  disabled={loading}
                  variant="contained"
                  sx={{
                    borderRadius: '999px',
                    py: 2,
                    bgcolor: '#0F172A', // Premium Black/Slate
                    color: '#FFF',
                    textTransform: 'none',
                    fontWeight: 700,
                    fontSize: '1.1rem',
                    boxShadow: '0 10px 15px -3px rgba(15, 23, 42, 0.3)',
                    '&:hover': {
                      bgcolor: '#1E293B',
                      boxShadow: '0 20px 25px -5px rgba(15, 23, 42, 0.4)',
                      transform: 'translateY(-1px)'
                    },
                    '&:active': { transform: 'translateY(0)' },
                    transition: 'all 0.2s ease-in-out'
                  }}
                >
                  {loading ? 'Processing...' : "Yes, Revoke"}
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
                    color: '#64748B', // Neutral Gray
                    '&:hover': {
                      bgcolor: 'transparent',
                      color: '#475569',
                      transform: 'scale(1.02)'
                    },
                    transition: 'all 0.2s ease'
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

export default RevokeApprovalModal;
