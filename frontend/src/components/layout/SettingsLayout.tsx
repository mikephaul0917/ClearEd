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
import { RiUserSettingsLine } from "react-icons/ri";

interface SettingsHeaderProps {
  title: string;
  subtitle?: string;
  icon?: React.ReactElement<SvgIconProps>;
}

export const SettingsHeader: React.FC<SettingsHeaderProps> = ({ title, subtitle }) => {
  return (
    <Box sx={{ mb: 4, px: 1 }}>
      <Typography variant="h5" sx={{ fontWeight: 800, color: '#0F172A', mb: 0.5 }}>
        {title}
      </Typography>
      {subtitle && (
        <Typography variant="body2" sx={{ color: '#64748B', fontWeight: 500 }}>
          {subtitle}
        </Typography>
      )}
    </Box>
  );
};

interface SettingsSectionProps {
  children: React.ReactNode;
}

export const SettingsSection: React.FC<SettingsSectionProps> = ({ children }) => {
  return (
    <Box sx={{ mb: 4 }}>
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
        {children}
      </Box>
    </Box>
  );
};

interface SettingsFieldProps {
  label: string;
  children: React.ReactNode;
  fullWidth?: boolean;
  labelAction?: React.ReactNode;
}

export const SettingsField: React.FC<SettingsFieldProps> = ({ label, children, fullWidth = true, labelAction }) => {
  return (
    <Box sx={{ width: fullWidth ? '100%' : 'auto' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
        <Typography sx={{ fontWeight: 600, fontSize: '0.875rem', color: '#64748B' }}>
          {label}
        </Typography>
        {labelAction && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            {labelAction}
          </Box>
        )}
      </Box>
      {children}
    </Box>
  );
};

export const SettingsRow: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <Grid container spacing={{ xs: 3, md: 4 }}>
      {React.Children.map(children, (child) => (
        <Grid item xs={12} md={6}>
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

export const ProfilePictureSection: React.FC<ProfilePictureSectionProps> = ({ avatarUrl, initials, onFileSelect }) => {
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleUploadClick = () => {
    if (fileInputRef.current) {
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
    <Box sx={{ position: 'relative', width: 'fit-content', mb: 4 }}>
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        style={{ display: 'none' }}
        accept="image/*"
      />
      <Box sx={{ position: 'relative' }}>
        <Avatar
          src={avatarUrl}
          sx={{
            width: 80,
            height: 80,
            fontSize: '1.75rem',
            bgcolor: '#0F172A',
            color: '#FFFFFF',
            fontWeight: 800,
            border: '4px solid #FFF',
            boxShadow: '0 4px 12px rgba(0,0,0,0.08)'
          }}
        >
          {initials}
        </Avatar>
        <Box
          onClick={handleUploadClick}
          sx={{
            position: 'absolute',
            bottom: 0,
            right: 0,
            width: 32,
            height: 32,
            bgcolor: '#FFF',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
            cursor: 'pointer',
            border: '1px solid #E2E8F0',
            transition: 'all 0.2s',
            zIndex: 2,
            '&:hover': {
              transform: 'scale(1.1)',
              bgcolor: '#F8FAFC'
            }
          }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#64748B" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"></path>
            <circle cx="12" cy="13" r="4"></circle>
          </svg>
        </Box>
      </Box>
    </Box>
  );
};

export const SettingsContainer: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <Box sx={{
      maxWidth: '850px',
      mx: 'auto',
      px: { xs: 1.5, sm: 3, md: 4 },
      pt: { xs: 2, md: 4 },
      pb: { xs: 4, md: 8 },
    }}>
      <Box sx={{
        bgcolor: '#FFF',
        borderRadius: '24px',
        p: { xs: 2.5, sm: 3, md: 4 },
        boxShadow: '0 20px 50px rgba(0,0,0,0.08)',
        border: '1px solid #F8FAFC'
      }}>
        {children}
      </Box>
    </Box>
  );
};
