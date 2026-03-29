import React from 'react';
import Dialog from "@mui/material/Dialog";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import { motion } from "framer-motion";

interface SuccessModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  description: string;
}

const SuccessModal: React.FC<SuccessModalProps> = ({ open, onClose, title, description }) => {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth="xs"
      PaperProps={{
        sx: {
          borderRadius: '32px',
          padding: '40px',
          textAlign: 'center',
          boxShadow: '0 25px 50px -12px rgba(0,0,0,0.15)',
          overflow: 'hidden',
          bgcolor: '#FFF'
        }
      }}
    >
      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        {/* Animated Checkmark Icon with Glow */}
        <Box sx={{ position: 'relative', mb: 4, width: 100, height: 100 }}>
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={open ? { scale: 1, opacity: 1 } : { scale: 0, opacity: 0 }}
            transition={{ type: "spring", stiffness: 260, damping: 20, delay: 0.1 }}
            style={{
              width: '100%',
              height: '100%',
              borderRadius: '50%',
              background: '#B0E0E6',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 10px 30px rgba(176, 224, 230, 0.4)',
              zIndex: 2,
              position: 'relative'
            }}
          >
            <motion.svg
              width="50"
              height="50"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#FFF"
              strokeWidth="4"
              strokeLinecap="round"
              strokeLinejoin="round"
              initial={{ pathLength: 0 }}
              animate={open ? { pathLength: 1 } : { pathLength: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
            >
              <polyline points="20 6 9 17 4 12" />
            </motion.svg>
          </motion.div>
          
          {/* Pulsing Glow Effect */}
          {open && (
            <motion.div
              animate={{ scale: [1, 1.25, 1], opacity: [0.3, 0.5, 0.3] }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
              style={{
                position: 'absolute',
                top: -15,
                left: -15,
                right: -15,
                bottom: -15,
                borderRadius: '50%',
                background: 'radial-gradient(circle, rgba(176, 224, 230, 0.4) 0%, rgba(176, 224, 230, 0) 70%)',
                zIndex: 1
              }}
            />
          )}
        </Box>

        <Typography variant="h5" sx={{ fontWeight: 800, color: '#0F172A', mb: 1.5 }}>
          {title}
        </Typography>
        
        <Typography sx={{ color: '#64748B', fontSize: '1rem', lineHeight: 1.5, mb: 4, px: 1, fontWeight: 500 }}>
          {description}
        </Typography>

        <Button
          fullWidth
          onClick={onClose}
          sx={{
            py: 2,
            borderRadius: '16px',
            bgcolor: '#F1F5F9',
            color: '#475569',
            textTransform: 'none',
            fontWeight: 700,
            fontSize: '1rem',
            '&:hover': {
              bgcolor: '#E2E8F0',
              color: '#0F172A'
            },
            transition: 'all 0.2s'
          }}
        >
          Close
        </Button>
      </Box>
    </Dialog>
  );
};

export default SuccessModal;
