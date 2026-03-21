import React, { useRef, useState, useEffect } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Button, Box, Typography, Tab, Tabs, IconButton
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';

interface SignatureModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: (signatureData: string) => void;
}

export default function SignatureModal({ open, onClose, onConfirm }: SignatureModalProps) {
  const [tabIndex, setTabIndex] = useState(0);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [uploadedBase64, setUploadedBase64] = useState<string | null>(null);

  useEffect(() => {
    if (open && tabIndex === 0) {
      setTimeout(() => {
        const canvas = canvasRef.current;
        if (canvas) {
          // Adjust canvas coordinate space to match its visual size
          const rect = canvas.getBoundingClientRect();
          canvas.width = rect.width;
          canvas.height = rect.height;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.fillStyle = 'white';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
          }
        }
      }, 100);
    }
  }, [open, tabIndex]);

  const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
    setIsDrawing(true);
    draw(e);
  };

  const stopDrawing = () => {
    setIsDrawing(false);
    const ctx = canvasRef.current?.getContext('2d');
    if (ctx) ctx.beginPath();
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    let x = 0, y = 0;
    if ('touches' in e) {
      x = e.touches[0].clientX - rect.left;
      y = e.touches[0].clientY - rect.top;
    } else {
      x = (e as React.MouseEvent).clientX - rect.left;
      y = (e as React.MouseEvent).clientY - rect.top;
    }

    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.strokeStyle = '#000000';
    ctx.lineTo(x, y);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const handleClear = () => {
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }
    }
    setUploadedBase64(null);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setUploadedBase64(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleConfirm = () => {
    if (tabIndex === 0) {
      const canvas = canvasRef.current;
      if (canvas) {
        onConfirm(canvas.toDataURL('image/png'));
      }
    } else {
      if (uploadedBase64) {
        onConfirm(uploadedBase64);
      }
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h6" sx={{ fontWeight: 'bold' }}>Require Officer Signature</Typography>
        <IconButton onClick={onClose} size="small"><CloseIcon /></IconButton>
      </DialogTitle>
      <DialogContent dividers>
        <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
          Please provide your signature to clear this student. This signature will appear on their clearance slip.
        </Typography>
        
        <Tabs value={tabIndex} onChange={(e, v) => setTabIndex(v)} sx={{ mb: 2 }}>
          <Tab label="Draw Signature" />
          <Tab label="Upload Image" />
        </Tabs>

        {tabIndex === 0 && (
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <Box
              sx={{
                border: '1px dashed #ccc',
                borderRadius: 2,
                width: '100%',
                height: 200,
                backgroundColor: '#fafafa',
                cursor: 'crosshair',
                touchAction: 'none'
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
            <Button size="small" variant="text" onClick={handleClear} sx={{ mt: 1, textTransform: 'none' }}>
              Clear Canvas
            </Button>
          </Box>
        )}

        {tabIndex === 1 && (
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', p: 3, border: '1px dashed #ccc', borderRadius: 2 }}>
            <Button variant="outlined" component="label" sx={{ textTransform: 'none', mb: 2 }}>
              Select Signature Image
              <input type="file" hidden accept="image/*" onChange={handleFileUpload} />
            </Button>
            {uploadedBase64 && (
              <Box sx={{ mt: 2, textAlign: 'center' }}>
                <Typography variant="caption" display="block" sx={{ mb: 1 }}>Preview:</Typography>
                <img src={uploadedBase64} alt="Signature Preview" style={{ maxHeight: 100, border: '1px solid #eee' }} />
              </Box>
            )}
          </Box>
        )}
      </DialogContent>
      <DialogActions sx={{ p: 2 }}>
        <Button onClick={onClose} sx={{ textTransform: 'none', color: '#64748B' }}>Cancel</Button>
        <Button 
          variant="contained" 
          onClick={handleConfirm} 
          disabled={tabIndex === 1 && !uploadedBase64}
          sx={{ textTransform: 'none', bgcolor: '#0ea5e9' }}
        >
          Sign & Clear Student
        </Button>
      </DialogActions>
    </Dialog>
  );
}
