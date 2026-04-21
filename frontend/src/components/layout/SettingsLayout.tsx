import React from 'react';
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import TextField from "@mui/material/TextField";
import Button from "@mui/material/Button";
import Divider from "@mui/material/Divider";
import Avatar from "@mui/material/Avatar";
import Grid from "@mui/material/Grid";
import { useTheme, useMediaQuery, SvgIconProps, Skeleton, Menu, MenuItem, ListItemIcon, ListItemText, IconButton } from "@mui/material";
import ManageAccountsIcon from "@mui/icons-material/ManageAccounts";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import PhotoCameraIcon from "@mui/icons-material/PhotoCamera";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import { RiUserSettingsLine } from "react-icons/ri";

interface SettingsHeaderProps {
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  icon?: React.ReactElement<SvgIconProps>;
}

export const SettingsHeader: React.FC<SettingsHeaderProps> = ({ title, subtitle }) => {
  return (
    <Box sx={{ mb: 4, px: { xs: 0, sm: 1 } }}>
      <Typography variant="h5" sx={{ 
        fontWeight: 800, 
        color: '#0F172A', 
        mb: 0.5,
        fontSize: { xs: '1.25rem', sm: '1.5rem' } 
      }}>
        {title}
      </Typography>
      {subtitle && (
        <Typography variant="body2" sx={{ color: '#64748B', fontWeight: 500, fontSize: { xs: '0.8125rem', sm: '0.875rem' } }}>
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
  label: React.ReactNode;
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

export const ProfilePictureSection: React.FC<ProfilePictureSectionProps> = ({ avatarUrl, initials, onFileSelect, onDelete }) => {
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
  const menuOpen = Boolean(anchorEl);

  const handleMenuClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleUploadClick = () => {
    handleMenuClose();
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleDeleteClick = () => {
    handleMenuClose();
    if (onDelete) {
      onDelete();
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && onFileSelect) {
      onFileSelect(file);
    }
  };

  return (
    <Box sx={{ position: 'relative', width: 'fit-content', mb: 4, mx: { xs: 'auto', sm: 0 } }}>
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
            width: { xs: 100, sm: 80 },
            height: { xs: 100, sm: 80 },
            fontSize: { xs: '2.25rem', sm: '1.75rem' },
            bgcolor: '#5f6368',
            color: '#FFFFFF',
            fontWeight: 700,
            border: 'none',
          }}
        >
          {initials}
        </Avatar>

        {/* Action Button - Ellipsis Menu */}
        <Box sx={{ position: 'absolute', bottom: -4, right: -4 }}>
          <IconButton
            onClick={handleMenuClick}
            sx={{
              width: 32,
              height: 32,
              bgcolor: '#FFF',
              border: '1px solid #E2E8F0',
              boxShadow: '0 2px 8px rgba(0,0,0,0.12)',
              '&:hover': { bgcolor: '#F8FAFC' }
            }}
          >
            <MoreVertIcon sx={{ fontSize: 18, color: '#64748B' }} />
          </IconButton>
        </Box>

        <Menu
          anchorEl={anchorEl}
          open={menuOpen}
          onClose={handleMenuClose}
          elevation={0}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
          transformOrigin={{ vertical: 'top', horizontal: 'right' }}
          PaperProps={{
            sx: {
              mt: 1,
              borderRadius: '12px',
              minWidth: 180,
              border: '1px solid #F1F5F9',
              boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1), 0 4px 6px -2px rgba(0,0,0,0.05)',
              '& .MuiMenuItem-root': {
                px: 2,
                py: 1.25,
                fontSize: '0.875rem',
                fontWeight: 600,
                color: '#1E293B',
                gap: 1.5,
                '&:hover': { bgcolor: '#F8FAFC' }
              }
            }
          }}
        >
          <MenuItem onClick={handleUploadClick}>
            <ListItemIcon sx={{ minWidth: 'auto !important', color: '#64748B' }}>
              <PhotoCameraIcon sx={{ fontSize: 18 }} />
            </ListItemIcon>
            <ListItemText primary="Upload New Photo" />
          </MenuItem>
          {avatarUrl && onDelete && (
            <MenuItem onClick={handleDeleteClick} sx={{ color: '#DC2626 !important' }}>
              <ListItemIcon sx={{ minWidth: 'auto !important', color: '#DC2626' }}>
                <DeleteOutlineIcon sx={{ fontSize: 18 }} />
              </ListItemIcon>
              <ListItemText primary="Remove Photo" />
            </MenuItem>
          )}
        </Menu>
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
      pb: { xs: 4, md: 8 },
    }}>
      <Box sx={{
        bgcolor: '#FFF',
        borderRadius: { xs: '16px', sm: '24px' },
        p: { xs: 2, sm: 3, md: 4 },
        boxShadow: '0 20px 50px rgba(0,0,0,0.08)',
        border: '1px solid #F8FAFC'
      }}>
        {children}
      </Box>
    </Box>
  );
};

interface SettingsActionsProps {
  children: React.ReactNode;
  showBorder?: boolean;
}

export const SettingsActions: React.FC<SettingsActionsProps> = ({ children, showBorder = true }) => {
  return (
    <Box sx={{ 
      display: 'flex', 
      flexDirection: { xs: 'column', sm: 'row' },
      gap: 2, 
      mt: showBorder ? 6 : 4, 
      pt: showBorder ? 4 : 0, 
      borderTop: showBorder ? '1px solid #F1F5F9' : 'none',
      px: { xs: 0, sm: 0 }
    }}>
      {React.Children.map(children, (child) => (
        <Box sx={{ width: { xs: '100%', sm: 'auto' } }}>
          {child}
        </Box>
      ))}
    </Box>
  );
};

export const SettingsSkeleton: React.FC<{ mode?: 'student' | 'officer' }> = ({ mode = 'officer' }) => {
    return (
        <SettingsContainer>
            {/* Header Skeleton */}
            <Box sx={{ mb: 4, px: { xs: 0, sm: 1 } }}>
                <Skeleton variant="text" width="40%" height={40} sx={{ bgcolor: 'rgba(0,0,0,0.06)', mb: 0.5, borderRadius: '4px' }} />
                <Skeleton variant="text" width="60%" height={24} sx={{ bgcolor: 'rgba(0,0,0,0.04)', borderRadius: '4px' }} />
            </Box>

            {/* Profile Section Skeleton */}
            <Box sx={{ mb: 6, px: 1, display: 'flex', justifyContent: { xs: 'center', sm: 'flex-start' } }}>
                <Skeleton variant="circular" width={80} height={80} sx={{ bgcolor: 'rgba(0,0,0,0.05)' }} />
            </Box>

            {/* Specialized Field Skeletons */}
            {mode === 'student' ? (
                <>
                    {/* Name Section */}
                    <Box sx={{ mb: 4 }}>
                        <Grid container spacing={{ xs: 3, md: 4 }}>
                            {[1, 2].map((i) => (
                                <Grid item xs={12} md={6} key={i}>
                                    <Skeleton variant="text" width="30%" height={20} sx={{ bgcolor: 'rgba(0,0,0,0.04)', mb: 1 }} />
                                    <Skeleton variant="rectangular" width="100%" height={56} sx={{ bgcolor: 'rgba(0,0,0,0.03)', borderRadius: '12px' }} />
                                </Grid>
                            ))}
                        </Grid>
                    </Box>
                    {/* Email Section */}
                    <Box sx={{ mb: 4 }}>
                        <Skeleton variant="text" width="15%" height={20} sx={{ bgcolor: 'rgba(0,0,0,0.04)', mb: 1 }} />
                        <Skeleton variant="rectangular" width="100%" height={56} sx={{ bgcolor: 'rgba(0,0,0,0.03)', borderRadius: '12px' }} />
                    </Box>
                    {/* Academic Info Section */}
                    <Box sx={{ mb: 4 }}>
                        <Grid container spacing={{ xs: 3, md: 4 }} sx={{ mb: 3 }}>
                            {[1, 2].map((i) => (
                                <Grid item xs={12} md={6} key={i}>
                                    <Skeleton variant="text" width="30%" height={20} sx={{ bgcolor: 'rgba(0,0,0,0.04)', mb: 1 }} />
                                    <Skeleton variant="rectangular" width="100%" height={56} sx={{ bgcolor: 'rgba(0,0,0,0.03)', borderRadius: '12px' }} />
                                </Grid>
                            ))}
                        </Grid>
                        <Grid container spacing={{ xs: 3, md: 4 }}>
                            {[1, 2].map((i) => (
                                <Grid item xs={12} md={6} key={i}>
                                    <Skeleton variant="text" width="30%" height={20} sx={{ bgcolor: 'rgba(0,0,0,0.04)', mb: 1 }} />
                                    <Skeleton variant="rectangular" width="100%" height={56} sx={{ bgcolor: 'rgba(0,0,0,0.03)', borderRadius: '12px' }} />
                                </Grid>
                            ))}
                        </Grid>
                    </Box>
                    {/* Password Section */}
                    <Box sx={{ mb: 4 }}>
                        <Grid container spacing={{ xs: 3, md: 4 }}>
                            {[1, 2].map((i) => (
                                <Grid item xs={12} md={6} key={i}>
                                    <Skeleton variant="text" width="30%" height={20} sx={{ bgcolor: 'rgba(0,0,0,0.04)', mb: 1 }} />
                                    <Skeleton variant="rectangular" width="100%" height={56} sx={{ bgcolor: 'rgba(0,0,0,0.03)', borderRadius: '12px' }} />
                                </Grid>
                            ))}
                        </Grid>
                    </Box>
                </>
            ) : (
                <>
                    {/* Generic / Officer Layout (3 rows of 2 fields) */}
                    {[1, 2, 3].map((section) => (
                        <Box key={section} sx={{ mb: 4 }}>
                            <Grid container spacing={{ xs: 3, md: 4 }}>
                                {[1, 2].map((field) => (
                                    <Grid item xs={12} md={6} key={field}>
                                        <Box>
                                            <Skeleton variant="text" width="30%" height={20} sx={{ bgcolor: 'rgba(0,0,0,0.04)', mb: 1 }} />
                                            <Skeleton variant="rectangular" width="100%" height={56} sx={{ bgcolor: 'rgba(0,0,0,0.03)', borderRadius: '12px' }} />
                                        </Box>
                                    </Grid>
                                ))}
                            </Grid>
                        </Box>
                    ))}
                </>
            )}

            {/* Actions Skeleton */}
            <Box sx={{ 
                display: 'flex', 
                flexDirection: { xs: 'column', sm: 'row' },
                gap: 2, 
                mt: mode === 'officer' ? 6 : 4, 
                pt: mode === 'officer' ? 4 : 0, 
                borderTop: mode === 'officer' ? '1px solid #F1F5F9' : 'none',
                px: 1 
            }}>
                <Skeleton variant="rectangular" height={48} sx={{ bgcolor: 'rgba(0,0,0,0.05)', borderRadius: '8px', width: { xs: '100%', sm: 140 } }} />
                <Skeleton variant="rectangular" height={48} sx={{ bgcolor: 'rgba(0,0,0,0.05)', borderRadius: '8px', width: { xs: '100%', sm: 160 } }} />
            </Box>
        </SettingsContainer>
    );
};
