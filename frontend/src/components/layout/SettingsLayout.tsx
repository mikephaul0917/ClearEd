import React from 'react';
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import TextField from "@mui/material/TextField";
import Button from "@mui/material/Button";
import Divider from "@mui/material/Divider";
import Avatar from "@mui/material/Avatar";
import Grid from "@mui/material/Grid";
import { useTheme, useMediaQuery, SvgIconProps } from "@mui/material";
import ManageAccountsIcon from "@mui/icons-material/ManageAccounts";

interface SettingsHeaderProps {
  title: string;
  subtitle?: string;
  icon?: React.ReactElement<SvgIconProps>;
}

export const SettingsHeader: React.FC<SettingsHeaderProps> = ({ title, subtitle, icon }) => {
  return (
    <Box sx={{ mb: 6, display: 'flex', alignItems: 'flex-start', gap: 2.5 }}>
      <Box sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: 48,
        height: 48,
        borderRadius: '12px',
        bgcolor: '#F1F5F9', // Light slate/blue background from image
        color: '#475569', // Dark slate color from image
        flexShrink: 0,
        mt: 0.5
      }}>
        {icon || <ManageAccountsIcon sx={{ fontSize: 24 }} />}
      </Box>
      <Box>
        <Typography variant="h4" sx={{ fontWeight: 800, color: '#000', mb: 0.5 }}>
          {title}
        </Typography>
        {subtitle && (
          <Typography variant="body1" sx={{ color: '#6B7280', fontSize: '1.05rem' }}>
            {subtitle}
          </Typography>
        )}
      </Box>
    </Box>
  );
};

interface SettingsSectionProps {
  children: React.ReactNode;
}

export const SettingsSection: React.FC<SettingsSectionProps> = ({ children }) => {
  return (
    <Box sx={{ mb: 6 }}>
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        {children}
      </Box>
    </Box>
  );
};

interface SettingsFieldProps {
  label: string;
  children: React.ReactNode;
  fullWidth?: boolean;
}

export const SettingsField: React.FC<SettingsFieldProps> = ({ label, children, fullWidth = true }) => {
  return (
    <Box sx={{ width: fullWidth ? '100%' : 'auto' }}>
      <Typography sx={{ mb: 1.5, fontWeight: 500, fontSize: '0.875rem', color: '#374151' }}>
        {label}
      </Typography>
      {children}
    </Box>
  );
};

export const SettingsRow: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <Grid container spacing={4}>
      {React.Children.map(children, (child) => (
        <Grid item xs={12} sm={6}>
          {child}
        </Grid>
      ))}
    </Grid>
  );
};

interface ProfilePictureSectionProps {
  avatarUrl?: string;
  initials: string;
  onUpload?: () => void;
  onFileSelect?: (file: File) => void;
  onDelete?: () => void;
}

export const ProfilePictureSection: React.FC<ProfilePictureSectionProps> = ({ avatarUrl, initials, onUpload, onFileSelect, onDelete }) => {
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleUploadClick = () => {
    if (onUpload) {
      onUpload();
    } else if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && onFileSelect) {
      onFileSelect(file);
    }
  };

  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 3, mb: 4 }}>
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        style={{ display: 'none' }}
        accept="image/*"
      />
      <Avatar
        src={avatarUrl}
        sx={{
          width: 80,
          height: 80,
          fontSize: '1.5rem',
          bgcolor: '#0F172A10',
          color: '#374151',
          border: '1px solid #E5E7EB'
        }}
      >
        {initials}
      </Avatar>
      <Box>
        <Typography sx={{ fontWeight: 600, fontSize: '1rem', mb: 0.5 }}>
          Profile picture
        </Typography>
        <Typography variant="body2" sx={{ color: '#6B7280', mb: 1.5 }}>
          PNG, JPEG under 15MB
        </Typography>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            variant="outlined"
            size="small"
            onClick={handleUploadClick}
            sx={{
              textTransform: 'none',
              borderRadius: '8px',
              borderColor: '#D1D5DB',
              color: '#374151',
              fontWeight: 600,
              '&:hover': {
                borderColor: '#9CA3AF',
                bgcolor: '#F9FAFB'
              }
            }}
          >
            Upload new picture
          </Button>
          <Button
            variant="text"
            size="small"
            onClick={onDelete}
            sx={{
              textTransform: 'none',
              borderRadius: '8px',
              color: '#374151',
              fontWeight: 600,
              '&:hover': {
                bgcolor: '#F3F4F6'
              }
            }}
          >
            Delete
          </Button>
        </Box>
      </Box>
    </Box>
  );
};

export const SettingsContainer: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const theme = useTheme();
  const isSmallMobile = useMediaQuery(theme.breakpoints.down('sm'));

  return (
    <Box sx={{
      maxWidth: '800px',
      mx: 'auto',
      px: isSmallMobile ? 2 : 4,
      py: isSmallMobile ? 4 : 8,
    }}>
      {children}
    </Box>
  );
};
