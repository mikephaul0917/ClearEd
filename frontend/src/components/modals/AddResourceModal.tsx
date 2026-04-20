import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  Box,
  Typography,
  Button,
  TextField,
  IconButton,
  InputAdornment
} from '@mui/material';
import { motion, AnimatePresence } from 'framer-motion';
import CloseIcon from '@mui/icons-material/Close';
import LinkIcon from '@mui/icons-material/Link';
import YouTubeIcon from '@mui/icons-material/YouTube';
import AddToDriveIcon from '@mui/icons-material/AddToDrive';

interface AddResourceModalProps {
  open: boolean;
  onClose: () => void;
  onAdd: (url: string) => void;
  type: 'Drive' | 'YouTube' | 'Link';
}

const AddResourceModal: React.FC<AddResourceModalProps> = ({
  open,
  onClose,
  onAdd,
  type
}) => {
  const [url, setUrl] = useState('');
  const [error, setError] = useState('');

  // Reset state when modal opens
  useEffect(() => {
    if (open) {
      setUrl('');
      setError('');
    }
  }, [open]);

  const handleAdd = () => {
    if (!url.trim()) {
      setError('Please enter a valid link');
      return;
    }

    let processedUrl = url.trim();
    if (!processedUrl.startsWith('http://') && !processedUrl.startsWith('https://')) {
      processedUrl = 'https://' + processedUrl;
    }

    onAdd(processedUrl);
    onClose();
  };

  const getModalConfig = () => {
    switch (type) {
      case 'Drive':
        return {
          title: 'Add Drive Resource',
          description: 'Please enter the drive link below to attach it as a resource.',
          label: 'Drive Link',
          icon: <AddToDriveIcon sx={{ color: '#5F6368' }} />,
          placeholder: 'Enter drive link...'
        };
      case 'YouTube':
        return {
          title: 'Add YouTube Video',
          description: 'Paste a YouTube video URL to share it with your organization.',
          label: 'YouTube Link',
          icon: <YouTubeIcon sx={{ color: '#EA4335' }} />,
          placeholder: 'Enter YouTube link...'
        };
      default:
        return {
          title: 'Add External Link',
          description: 'Attach a web link to provide additional context or resources.',
          label: 'Link',
          icon: <LinkIcon sx={{ color: '#0E7490' }} />,
          placeholder: 'Enter web link...'
        };
    }
  };

  const config = getModalConfig();

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="xs"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: "8px",
          width: "100%",
          maxWidth: "500px",
          p: 2,
          overflow: 'visible',
          bgcolor: '#FFF',
          boxShadow: '0 25px 70px -12px rgba(0,0,0,0.18)',
          position: 'relative'
        }
      }}
    >
      <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
        <IconButton
          onClick={onClose}
          size="small"
          sx={{
            color: '#5F6368',
            '&:hover': { bgcolor: '#F1F3F4' }
          }}
        >
          <CloseIcon />
        </IconButton>
      </Box>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 15 }}
            transition={{ duration: 0.35, ease: [0.4, 0, 0.2, 1] }}
          >
            <DialogContent sx={{ pt: 1, px: 4, pb: 4 }}>
              <Typography
                variant="h5"
                sx={{
                  fontWeight: 600,
                  color: '#202124',
                  mb: 2,
                  fontFamily: "'Google Sans', 'Product Sans', sans-serif"
                }}
              >
                {config.title}
              </Typography>

              <Typography
                sx={{
                  color: '#5F6368',
                  fontSize: "0.9375rem",
                  lineHeight: 1.6,
                  mb: 4,
                  fontWeight: 400,
                  fontFamily: "'Google Sans', 'Product Sans', sans-serif"
                }}
              >
                {config.description}
              </Typography>

              <Box sx={{ mb: 4 }}>
                <Typography
                  variant="subtitle2"
                  sx={{
                    fontWeight: 600,
                    color: '#202124',
                    mb: 1.5,
                    ml: 0.5
                  }}
                >
                  {config.label}
                </Typography>
                <TextField
                  fullWidth
                  variant="outlined"
                  placeholder={config.placeholder}
                  value={url}
                  onChange={(e) => {
                    setUrl(e.target.value);
                    if (error) setError('');
                  }}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') handleAdd();
                  }}
                  error={!!error}
                  helperText={error}
                  autoFocus
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        {config.icon}
                      </InputAdornment>
                    ),
                    sx: {
                      borderRadius: '4px',
                      height: '56px',
                      fontSize: '0.95rem',
                      '& .MuiOutlinedInput-notchedOutline': {
                        borderColor: '#dadce0',
                        borderWidth: '1.5px'
                      },
                      '&:hover .MuiOutlinedInput-notchedOutline': {
                        borderColor: '#0D9488'
                      },
                      '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                        borderColor: '#0D9488',
                        borderWidth: '2px'
                      }
                    }
                  }}
                />
              </Box>

              <Button
                fullWidth
                onClick={handleAdd}
                variant="contained"
                disabled={!url.trim()}
                sx={{
                  borderRadius: '4px',
                  py: 2,
                  bgcolor: url.trim() ? '#3c4043' : '#e8eaed',
                  color: url.trim() ? '#FFF' : '#9aa0a6',
                  textTransform: 'none',
                  fontWeight: 600,
                  fontSize: '1rem',
                  boxShadow: 'none',
                  '&:hover': {
                    bgcolor: url.trim() ? '#202124' : '#e8eaed',
                    boxShadow: 'none',
                    transform: url.trim() ? 'translateY(-1px)' : 'none'
                  },
                  '&.Mui-disabled': {
                    bgcolor: '#e8eaed',
                    color: '#9aa0a6'
                  },
                  transition: 'all 0.25s ease'
                }}
              >
                Add Resource
              </Button>
            </DialogContent>
          </motion.div>
        )}
      </AnimatePresence>
    </Dialog>
  );
};

export default AddResourceModal;
