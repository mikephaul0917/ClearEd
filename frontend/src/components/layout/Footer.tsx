import React from 'react';
import { Box, Typography, Link as MuiLink, IconButton, useTheme, useMediaQuery } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import FacebookIcon from '@mui/icons-material/Facebook';
import InstagramIcon from '@mui/icons-material/Instagram';

// Custom TikTok Icon
const TikTokIcon = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.06-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.03 1.4-.27 2.8-.93 4.05-.68 1.29-1.84 2.36-3.25 2.86-1.97.77-4.3.6-6.18-.5-1.48-.87-2.59-2.35-2.99-4.04-.41-1.64-.15-3.48.72-4.96.88-1.5 2.45-2.59 4.17-2.89.28-.05.57-.08.85-.09.01 1.48-.01 2.94.02 4.42-.79.13-1.5.6-1.9 1.27-.45.75-.46 1.7-.1 2.47.39.85 1.22 1.46 2.15 1.59.93.13 1.91-.21 2.53-.9.46-.51.68-1.18.66-1.85-.03-3.41-.01-6.82-.02-10.24 0-2.36.01-4.72-.01-7.08z" />
    </svg>
);

const Footer = () => {
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
    const fontStack = "'Plus Jakarta Sans', 'Inter', sans-serif";

    const footerStyles = {
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 1000,
        height: isMobile ? 'auto' : '48px',
        backgroundColor: 'rgba(255, 255, 255, 0.8)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        borderTop: '1px solid rgba(229, 231, 235, 0.5)',
        display: { xs: 'none', sm: 'flex' },
        alignItems: 'center',
        justifyContent: 'space-between',
        px: { xs: 2, sm: 4 },
        py: isMobile ? 1.5 : 0,
        flexDirection: isMobile ? 'column' : 'row',
        gap: isMobile ? 1 : 0,
        boxShadow: '0 -4px 12px rgba(0, 0, 0, 0.03)',
    };

    const textStyle = {
        fontFamily: fontStack,
        fontSize: '0.75rem',
        color: '#64748B',
        display: 'flex',
        alignItems: 'center',
        gap: 1.5,
        flexWrap: 'wrap',
    };

    const linkStyle = {
        color: '#2D3748',
        textDecoration: 'none',
        fontWeight: 500,
        '&:hover': {
            color: '#1A202C',
            textDecoration: 'underline',
        },
    };

    const dotStyle = {
        width: '3px',
        height: '3px',
        borderRadius: '50%',
        backgroundColor: '#CBD5E0',
    };

    return (
        <Box component="footer" sx={footerStyles}>
            {/* Left Side */}
            <Box sx={textStyle}>
                <Typography sx={{ fontSize: '0.75rem', fontWeight: 500, color: '#94A3B8' }}>
                    ClearEd v0.1.0-beta
                </Typography>
                {!isMobile && <Box sx={dotStyle} />}
                <MuiLink component={RouterLink} to="/terms" sx={linkStyle}>Terms of Service</MuiLink>
                {!isMobile && <Box sx={dotStyle} />}
                <MuiLink component={RouterLink} to="/privacy" sx={linkStyle}>Privacy Policy</MuiLink>
                {!isMobile && <Box sx={dotStyle} />}
                <MuiLink component={RouterLink} to="/cookies" sx={linkStyle}>Cookie Policy</MuiLink>
            </Box>

            {/* Right Side */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Typography sx={{ 
                    fontFamily: fontStack, 
                    fontSize: '0.75rem', 
                    color: '#475569', 
                    fontWeight: 500 
                }}>
                    Developed by <span style={{ fontWeight: 700, color: '#1E293B' }}>Mike Phaul Banderada, Errolle Ardiente, and Brad Del Moro</span>
                </Typography>
                
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <IconButton size="small" sx={{ color: '#475569', '&:hover': { color: '#1877F2' } }}>
                        <FacebookIcon sx={{ fontSize: 18 }} />
                    </IconButton>
                    <IconButton size="small" sx={{ color: '#475569', '&:hover': { color: '#E4405F' } }}>
                        <InstagramIcon sx={{ fontSize: 18 }} />
                    </IconButton>
                    <IconButton size="small" sx={{ color: '#475569', '&:hover': { color: '#000000' } }}>
                        <TikTokIcon />
                    </IconButton>
                </Box>
            </Box>
        </Box>
    );
};

export default Footer;
