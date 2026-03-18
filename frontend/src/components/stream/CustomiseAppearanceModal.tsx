import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  IconButton,
  Divider,
  TextField,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import ImageOutlinedIcon from '@mui/icons-material/ImageOutlined';
import UploadFileOutlinedIcon from '@mui/icons-material/UploadFileOutlined';
import CheckIcon from '@mui/icons-material/Check';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import AddIcon from '@mui/icons-material/Add';

// Preset gallery of Google Classroom style banners
const PRESET_BANNERS = [
  'https://gstatic.com/classroom/themes/img_read.jpg',
  'https://gstatic.com/classroom/themes/img_code.jpg',
  'https://gstatic.com/classroom/themes/img_breakfast.jpg',
  'https://gstatic.com/classroom/themes/img_bookclub.jpg',
  'https://gstatic.com/classroom/themes/Honors.jpg',
  'https://gstatic.com/classroom/themes/Math.jpg',
  'https://gstatic.com/classroom/themes/Physics.jpg',
  'https://gstatic.com/classroom/themes/Chemistry.jpg'
];

export interface CustomiseAppearanceModalProps {
  open: boolean;
  onClose: () => void;
  currentThemeColor: string;
  currentHeaderImage: string | null;
  onSave: (themeColor: string, headerImage: string | null) => Promise<void>;
}

const THEME_COLORS = [
  '#1967d2', // Blue (default)
  '#188038', // Green
  '#c5221f', // Red
  '#d50000', // Crimson
  '#f29900', // Orange
  '#007b83', // Teal
  '#8e24aa', // Purple
  '#3f51b5', // Indigo
];

export default function CustomiseAppearanceModal({
  open,
  onClose,
  currentThemeColor,
  currentHeaderImage,
  onSave,
}: CustomiseAppearanceModalProps) {
  const [selectedColor, setSelectedColor] = useState(currentThemeColor || THEME_COLORS[0]);
  const [selectedImage, setSelectedImage] = useState<string | null>(currentHeaderImage);
  const [isSaving, setIsSaving] = useState(false);
  const [showGallery, setShowGallery] = useState(false);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        alert("File is too large. Maximum size is 5MB.");
        return;
      }
      
      const reader = new FileReader();
      reader.onloadend = () => {
        setSelectedImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleColorSelect = (color: string) => {
    setSelectedColor(color);
    setSelectedImage(null); // When selecting a raw color, Google Classroom typically clears the image
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);
      await onSave(selectedColor, selectedImage);
      onClose();
    } catch (error) {
      console.error('Failed to save appearance settings', error);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
      <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', pb: 1 }}>
        <Typography variant="h6" fontWeight={500}>
          {showGallery ? "Select header image" : "Customise appearance"}
        </Typography>
        <IconButton onClick={onClose} size="small">
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ p: '0 !important' }}>
        {showGallery ? (
          <Box sx={{ px: 3, pt: 1, pb: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                <IconButton onClick={() => setShowGallery(false)} sx={{ mr: 1, ml: -1 }}>
                    <ArrowBackIcon />
                </IconButton>
                <Typography variant="body1" fontWeight={500}>Gallery</Typography>
            </Box>
            <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 2 }}>
                {PRESET_BANNERS.map((url, idx) => (
                    <Box
                      key={idx}
                      onClick={() => {
                          setSelectedImage(url);
                          setShowGallery(false);
                      }}
                      sx={{
                          height: 80,
                          borderRadius: 2,
                          backgroundImage: `url(${url})`,
                          backgroundSize: 'cover',
                          backgroundPosition: 'center',
                          cursor: 'pointer',
                          transition: 'transform 0.2s',
                          border: selectedImage === url ? '3px solid #1a73e8' : 'none',
                          '&:hover': { opacity: 0.9, transform: 'scale(1.02)' }
                      }}
                    />
                ))}
            </Box>
          </Box>
        ) : (
        <Box sx={{ px: 3, pt: 1, pb: 3 }}>
          {/* Header Preview Container */}
          <Box
            sx={{
              height: 120,
              borderRadius: 2,
              mb: 3,
              bgcolor: selectedColor,
              backgroundImage: selectedImage ? `url(${selectedImage})` : 'none',
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          />

          {/* Select Image */}
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
            <Typography variant="body2" color="text.secondary" fontWeight={500}>
              Select stream header image
            </Typography>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button
                variant="text"
                startIcon={<ImageOutlinedIcon />}
                onClick={() => setShowGallery(true)}
                sx={{
                  bgcolor: '#e8f0fe',
                  color: '#1967d2',
                  textTransform: 'none',
                  borderRadius: 20,
                  px: 2,
                  '&:hover': { bgcolor: '#d2e3fc' },
                }}
              >
                Select photo
              </Button>
              <Button
                variant="text"
                startIcon={<UploadFileOutlinedIcon />}
                component="label"
                sx={{
                  bgcolor: '#e8f0fe',
                  color: '#1967d2',
                  textTransform: 'none',
                  borderRadius: 20,
                  px: 2,
                  '&:hover': { bgcolor: '#d2e3fc' },
                }}
              >
                Upload photo
                <input type="file" hidden accept="image/*" onChange={handleFileUpload} />
              </Button>
            </Box>
          </Box>

          <Divider sx={{ mb: 3 }} />

          {/* Theme Color */}
          <Box>
            <Typography variant="body2" color="text.secondary" fontWeight={500} mb={1.5}>
              Select theme colour
            </Typography>
            <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap' }}>
              {THEME_COLORS.map((color) => (
                <Box
                  key={color}
                  onClick={() => handleColorSelect(color)}
                  sx={{
                    width: 40,
                    height: 40,
                    borderRadius: '50%',
                    bgcolor: color,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    border: selectedColor === color && !selectedImage ? '2px solid #1a73e8' : '2px solid transparent',
                    boxShadow: selectedColor === color && !selectedImage ? '0 0 0 2px #fff inset' : 'none',
                  }}
                >
                  {selectedColor === color && !selectedImage && <CheckIcon sx={{ color: '#fff', fontSize: 20 }} />}
                </Box>
              ))}
              
              <Box
                component="label"
                title="Custom Color"
                sx={{
                  width: 40,
                  height: 40,
                  borderRadius: '50%',
                  bgcolor: !THEME_COLORS.includes(selectedColor) ? selectedColor : '#f1f3f4',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: !THEME_COLORS.includes(selectedColor) && !selectedImage ? '2px solid #1a73e8' : '2px solid transparent',
                  boxShadow: !THEME_COLORS.includes(selectedColor) && !selectedImage ? '0 0 0 2px #fff inset' : 'none',
                  position: 'relative',
                  overflow: 'hidden'
                }}
              >
                <input
                  type="color"
                  value={selectedColor.length === 7 ? selectedColor : '#000000'}
                  onChange={(e) => handleColorSelect(e.target.value)}
                  style={{
                    position: 'absolute',
                    opacity: 0,
                    width: '100%',
                    height: '100%',
                    cursor: 'pointer'
                  }}
                />
                {(!THEME_COLORS.includes(selectedColor) && !selectedImage) ? (
                  <CheckIcon sx={{ color: '#fff', fontSize: 20 }} />
                ) : (
                  <AddIcon sx={{ color: '#5f6368', fontSize: 24 }} />
                )}
              </Box>
            </Box>

            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mt: 3 }}>
                <Typography variant="body2" color="text.secondary" fontWeight={500}>
                  Custom hex colour:
                </Typography>
                <TextField 
                  size="small" 
                  value={selectedColor} 
                  onChange={(e) => handleColorSelect(e.target.value)}
                  sx={{ width: 120 }}
                  inputProps={{ maxLength: 7 }}
                />
            </Box>
          </Box>
        </Box>
        )}
      </DialogContent>

      <DialogActions sx={{ p: 2, pt: 0 }}>
        {showGallery ? (
            <Box flex={1} />
        ) : (
            <>
        <Button onClick={onClose} sx={{ textTransform: 'none', color: '#1a73e8', fontWeight: 500 }}>
          Cancel
        </Button>
        <Button
          onClick={handleSave}
          disabled={isSaving}
          sx={{ textTransform: 'none', color: '#1a73e8', fontWeight: 500 }}
        >
          {isSaving ? 'Saving...' : 'Save'}
        </Button>
        </>
        )}
      </DialogActions>
    </Dialog>
  );
}
