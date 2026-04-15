import React, { useState } from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Grid from "@mui/material/Grid";
import Button from "@mui/material/Button";
import Divider from "@mui/material/Divider";
import OrganizationCard, { OrganizationCardProps } from "./OrganizationCard";
import Skeleton from "@mui/material/Skeleton";

/**
 * OrganizationBoard Component
 * Renders a list of organizations grouped by their status (Active first).
 */

interface OrganizationBoardProps {
    organizations: OrganizationCardProps[];
    loading?: boolean;
    onCardClick?: (id: string) => void;
    title?: string;
    description?: string;
    emptyTitle?: string;
    emptyMessage?: string;
    headerAction?: React.ReactNode;
    icon?: React.ReactNode;
    iconBgColor?: string;
    iconColor?: string;
    onRefresh?: () => void;
    isAdmin?: boolean;
}

const OrganizationBoard: React.FC<OrganizationBoardProps> = ({
    organizations,
    loading = false,
    onCardClick,
    title = "Active Organizations",
    description,
    emptyTitle = "No organizations yet",
    emptyMessage = "Join an organization using a code provided by your institution.",
    headerAction,
    icon,
    iconBgColor,
    iconColor,
    onRefresh,
    isAdmin = false
}) => {
    // Rely on exactly what is passed via the organizations prop
    const displayedOrgs = organizations;

    if (loading) {
        return (
            <Box>
                <Box sx={{ mb: 6 }}>
                    <Box display="flex" alignItems="flex-start" justifyContent="space-between" mb={4} flexWrap="wrap" gap={2}>
                        <Box>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: description ? 0.5 : 0 }}>
                                {icon && (
                                    <Skeleton variant="circular" width={40} height={40} />
                                )}
                                <Skeleton variant="text" width={200} height={40} sx={{ bgcolor: "#eaebec" }} />
                            </Box>
                            {description && (
                                <Skeleton variant="text" width={300} height={20} sx={{ mt: 1, bgcolor: "#eaebec" }} />
                            )}
                        </Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                            <Skeleton variant="rectangular" width={120} height={40} sx={{ borderRadius: "10px", bgcolor: "#eaebec" }} />
                        </Box>
                    </Box>

                    <Grid container spacing={3}>
                        {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                            <Grid item key={i} xs={12} sm={6} md={4} lg={3}>
                                <Box sx={{
                                    width: "100%",
                                    maxWidth: { xs: 280, sm: 320 },
                                    mx: 'auto',
                                    aspectRatio: "1/1",
                                    position: "relative"
                                }}>
                                    {/* Header Skeleton */}
                                    <Box sx={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, borderRadius: "32px", overflow: "hidden", bgcolor: "#FFFFFF", border: '1px solid #eaebec' }}>
                                        <Box sx={{ height: "100%", display: 'flex', alignItems: 'flex-start', justifyContent: 'center', pt: 6 }}>
                                            <Skeleton variant="circular" width={60} height={60} sx={{ bgcolor: "#eaebec" }} />
                                        </Box>
                                    </Box>
 
                                    {/* Content Overlay Skeleton */}
                                    <Box sx={{
                                        position: "absolute",
                                        bottom: 0,
                                        left: -6,
                                        right: -6,
                                        bgcolor: "#FFFFFF",
                                        p: { xs: "28px 20px 32px", sm: "20px" },
                                        minHeight: { xs: "140px", sm: "auto" },
                                        borderRadius: "24px",
                                        boxShadow: "0 12px 32px rgba(0,0,0,0.06)",
                                        display: "flex",
                                        flexDirection: "column",
                                        zIndex: 3,
                                        border: '1px solid #F1F5F9'
                                    }}>
                                        <Skeleton variant="text" width="70%" height={32} sx={{ bgcolor: "#eaebec" }} />
                                        <Box sx={{ display: 'flex', gap: 1.5, mt: 2 }}>
                                            <Skeleton variant="rectangular" width={100} height={32} sx={{ borderRadius: "100px", bgcolor: "#eaebec" }} />
                                            <Skeleton variant="rectangular" width={80} height={32} sx={{ borderRadius: "20px", bgcolor: "#eaebec" }} />
                                        </Box>
                                    </Box>
                                </Box>
                            </Grid>
                        ))}
                    </Grid>
                </Box>
            </Box>
        );
    }

    return (
        <Box>
            <Box sx={{ mb: 6 }}>
                <Box display="flex" alignItems="flex-start" justifyContent="space-between" mb={4} flexWrap="wrap" gap={2}>
                    <Box>
                        {title && (
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: description ? 0.5 : 0 }}>
                                {icon && (
                                    <Box sx={{
                                        bgcolor: iconBgColor || '#F1F5F9',
                                        color: iconColor || '#475569',
                                        p: { xs: 0.5, sm: 1 },
                                        borderRadius: 2,
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center'
                                    }}>
                                        {icon}
                                    </Box>
                                )}
                                <Typography variant="h4" sx={{
                                    fontWeight: 600,
                                    color: '#000',
                                    fontFamily: '"Google Sans", "Product Sans", Roboto, sans-serif',
                                    letterSpacing: { xs: '-0.5px', sm: '-1.5px' },
                                    fontSize: { xs: '1.25rem', sm: '1.75rem', md: '1.875rem' },
                                    lineHeight: 1.2
                                }}>
                                    {title}
                                </Typography>
                            </Box>
                        )}
                        {description && (
                            <Typography variant="body1" sx={{
                                color: '#6B7280',
                                fontSize: { xs: '0.8rem', sm: '0.95rem' },
                                fontFamily: '"Google Sans", "Product Sans", Roboto, sans-serif'
                            }}>
                                {description}
                            </Typography>
                        )}
                    </Box>

                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        {headerAction}
                    </Box>
                </Box>

                {displayedOrgs.length > 0 ? (
                    <Grid container spacing={3}>
                        {displayedOrgs.map((org) => (
                            <Grid item key={org.id} xs={12} sm={6} md={4} lg={3}>
                                <OrganizationCard 
                                    {...org} 
                                    onClick={onCardClick} 
                                    onRefresh={onRefresh}
                                    isAdmin={isAdmin}
                                />
                            </Grid>
                        ))}
                    </Grid>
                ) : (
                    <Box
                        sx={{
                            p: 8,
                            textAlign: "center",
                            bgcolor: "white",
                            borderRadius: 4,
                            border: "2px dashed #E2E8F0"
                        }}
                    >
                        <Typography variant="h5" fontWeight={600} gutterBottom>
                            {emptyTitle}
                        </Typography>
                        <Typography color="text.secondary" sx={{ mb: 3 }}>
                            {emptyMessage}
                        </Typography>
                    </Box>
                )}
            </Box>
        </Box>
    );
};

export default OrganizationBoard;
