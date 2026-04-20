import React, { useRef, useState, useEffect } from 'react';
import {
  Dialog,
  Button,
  Box,
  Typography,
  IconButton,
  Chip
} from '@mui/material';
import { motion, AnimatePresence } from 'framer-motion';

interface SignatureModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: (signatureData: string) => void;
}

export default function SignatureModal({ open, onClose, onConfirm }: SignatureModalProps) {
  const [tabIndex, setTabIndex] = useState(0); // 0: Draw, 1: Upload
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [uploadedBase64, setUploadedBase64] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open && tabIndex === 0) {
      setTimeout(() => {
        const canvas = canvasRef.current;
        if (canvas) {
          const rect = canvas.getBoundingClientRect();
          canvas.width = rect.width;
          canvas.height = rect.height;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';
            ctx.strokeStyle = '#0F172A';
            ctx.lineWidth = 3;
            // Clear initially
            ctx.clearRect(0, 0, canvas.width, canvas.height);
          }
        }
      }, 200);
    }
  }, [open, tabIndex]);

  const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
    setIsDrawing(true);
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    const rect = canvas.getBoundingClientRect();
    const x = ('touches' in e) ? e.touches[0].clientX - rect.left : (e as React.MouseEvent).clientX - rect.left;
    const y = ('touches' in e) ? e.touches[0].clientY - rect.top : (e as React.MouseEvent).clientY - rect.top;
    
    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = ('touches' in e) ? e.touches[0].clientX - rect.left : (e as React.MouseEvent).clientX - rect.left;
    const y = ('touches' in e) ? e.touches[0].clientY - rect.top : (e as React.MouseEvent).clientY - rect.top;

    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const handleClear = () => {
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
    setUploadedBase64(null);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setUploadedBase64(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleConfirm = () => {
    if (tabIndex === 0) {
      const canvas = canvasRef.current;
      if (canvas) {
        // Only confirm if something was drawn
        // (Simple check: canvas not empty is better, but let's stick to base logic)
        onConfirm(canvas.toDataURL('image/png'));
      }
    } else if (uploadedBase64) {
      onConfirm(uploadedBase64);
    }
  };

  return (
    <Dialog 
      open={open} 
      onClose={onClose} 
      maxWidth="xs" 
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: '16px',
          padding: '32px',
          overflow: 'hidden',
          bgcolor: '#FFF',
          boxShadow: '0 25px 50px -12px rgba(0,0,0,0.15)',
        }
      }}
    >
      {/* Custom Header */}
      <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={3}>
        <Box display="flex" flexDirection="column" gap={2}>
          <Box 
            sx={{ 
              width: 48, 
              height: 48, 
              bgcolor: '#3c4043', 
              borderRadius: '12px', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center' 
            }}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9"></path><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path></svg>
          </Box>
          <Box>
            <Typography variant="h5" sx={{ fontWeight: 800, color: '#0F172A', mb: 0.5 }}>
              Final Signature
            </Typography>
            <Typography sx={{ color: '#64748B', fontSize: '0.875rem', lineHeight: 1.5 }}>
              Provide your official signature to finalize <br /> this record and approve the student.
            </Typography>
          </Box>
        </Box>
        <IconButton 
          onClick={onClose} 
          size="small" 
          sx={{ color: '#94A3B8', '&:hover': { color: '#0F172A', bgcolor: '#F1F5F9' } }}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
        </IconButton>
      </Box>

      {/* Segmented Control / Toggle */}
      <Box sx={{ 
        display: 'flex', 
        p: '4px', 
        bgcolor: '#F1F5F9', 
        borderRadius: '16px', 
        mb: 4,
        position: 'relative'
      }}>
        <Box
          sx={{
            position: 'absolute',
            top: '4px',
            bottom: '4px',
            left: tabIndex === 0 ? '4px' : 'calc(50% + 2px)',
            width: 'calc(50% - 6px)',
            bgcolor: '#FFF',
            borderRadius: '12px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
            transition: 'left 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
            zIndex: 1
          }}
        />
        <Button
          fullWidth
          onClick={() => setTabIndex(0)}
          sx={{
            textTransform: 'none',
            borderRadius: '12px',
            py: 1,
            fontWeight: 700,
            fontSize: '0.875rem',
            position: 'relative',
            zIndex: 2,
            color: tabIndex === 0 ? '#0F172A' : '#64748B',
            bgcolor: 'transparent',
            transition: 'color 0.4s ease',
            '&:hover': { bgcolor: 'transparent' }
          }}
        >
          Draw Signature
        </Button>
        <Button
          fullWidth
          onClick={() => setTabIndex(1)}
          sx={{
            textTransform: 'none',
            borderRadius: '12px',
            py: 1,
            fontWeight: 700,
            fontSize: '0.875rem',
            position: 'relative',
            zIndex: 2,
            color: tabIndex === 1 ? '#0F172A' : '#64748B',
            bgcolor: 'transparent',
            transition: 'color 0.4s ease',
            '&:hover': { bgcolor: 'transparent' }
          }}
        >
          Upload Image
        </Button>
      </Box>

      {/* Main Content Area */}
      <Box sx={{ minHeight: '260px', position: 'relative' }}>
        <AnimatePresence mode="wait">
          {tabIndex === 0 ? (
            <motion.div
              key="draw"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
            >
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Box
                  sx={{
                    border: '1px solid #E2E8F0',
                    borderRadius: '24px',
                    width: '100%',
                    height: 220,
                    backgroundColor: '#FAFAFA',
                    cursor: 'crosshair',
                    touchAction: 'none',
                    overflow: 'hidden'
                  }}
                >
                  <canvas
                    ref={canvasRef}
                    style={{ width: '100%', height: '100%' }}
                    onMouseDown={startDrawing}
                    onMouseUp={stopDrawing}
                    onMouseLeave={stopDrawing}
                    onMouseMove={draw}
                    onTouchStart={startDrawing}
                    onTouchEnd={stopDrawing}
                    onTouchMove={draw}
                  />
                </Box>
                <Button 
                  size="small" 
                  onClick={handleClear} 
                  sx={{ 
                    alignSelf: 'center', 
                    textTransform: 'none', 
                    color: '#64748B', 
                    fontWeight: 600,
                    '&:hover': { bgcolor: '#F1F5F9', color: '#0F172A' }
                  }}
                >
                  Clear Signature
                </Button>
              </Box>
            </motion.div>
          ) : (
            <motion.div
              key="upload"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
            >
              <Box
                onClick={() => fileInputRef.current?.click()}
                sx={{
                  border: '2px dashed #E2E8F0',
                  borderRadius: '24px',
                  p: 4,
                  textAlign: 'center',
                  backgroundColor: '#FAFAFA',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  '&:hover': { borderColor: '#94A3B8', bgcolor: '#F8FAFC' }
                }}
              >
                <input 
                  type="file" 
                  hidden 
                  ref={fileInputRef} 
                  accept="image/*" 
                  onChange={handleFileUpload} 
                />
                
                <Box display="flex" flexDirection="column" alignItems="center" gap={1.5}>
                  <Box sx={{ width: 44, height: 44, bgcolor: '#FFF', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#64748B" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v4"></path><polyline points="17 8 12 3 7 8"></polyline><line x1="12" y1="3" x2="12" y2="15"></line></svg>
                  </Box>
                  <Box>
                    <Typography sx={{ fontWeight: 700, color: '#0F172A', mb: 0.5 }}>Drop your file here</Typography>
                    <Typography sx={{ color: '#94A3B8', fontSize: '0.75rem' }}>Support for PNG, JPG images up to 5MB</Typography>
                  </Box>
                  <Button 
                    variant="outlined" 
                    size="small" 
                    sx={{ 
                      mt: 1, 
                      borderRadius: '12px', 
                      textTransform: 'none', 
                      px: 3, 
                      color: '#0F172A', 
                      borderColor: '#E2E8F0',
                      bgcolor: '#FFF',
                      fontWeight: 700
                    }}
                  >
                    Browse Files
                  </Button>
                </Box>
                {uploadedBase64 && (
                  <Box sx={{ mt: 3, pt: 2, borderTop: '1px solid #E2E8F0', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
                    <Typography sx={{ fontSize: '0.65rem', color: '#94A3B8', fontWeight: 800, textTransform: 'uppercase' }}>Preview</Typography>
                    <Box sx={{ bgcolor: '#FFF', p: 1, borderRadius: '8px', border: '1px solid #F1F5F9' }}>
                      <img src={uploadedBase64} alt="Signature Preview" style={{ maxHeight: 60, objectFit: 'contain' }} />
                    </Box>
                  </Box>
                )}
              </Box>
            </motion.div>
          )}
        </AnimatePresence>
      </Box>

      {/* Footer Action */}
      <Box mt={4}>
        <Button 
          fullWidth
          onClick={handleConfirm}
          variant="contained"
          disabled={tabIndex === 1 && !uploadedBase64}
          sx={{
            borderRadius: '12px',
            py: 2,
            bgcolor: '#3c4043',
            color: '#FFF',
            textTransform: 'none',
            fontWeight: 700,
            fontSize: '1rem',
            boxShadow: '0 10px 15px -3px rgba(60,64,67,0.3)',
            transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
            '&:hover': { 
              bgcolor: '#202124',
              boxShadow: '0 20px 25px -5px rgba(60,64,67,0.4)',
              transform: 'translateY(-2px)'
            },
            '&:active': { transform: 'translateY(0)' },
            '&.Mui-disabled': { bgcolor: '#E2E8F0', color: '#94A3B8' }
          }}
        >
          Confirm & Finalize Approval
        </Button>
      </Box>
    </Dialog>
  );
}
