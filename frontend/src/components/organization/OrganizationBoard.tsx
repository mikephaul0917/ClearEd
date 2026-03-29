import React, { useState } from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Grid from "@mui/material/Grid";
import Button from "@mui/material/Button";
import Divider from "@mui/material/Divider";
import OrganizationCard, { OrganizationCardProps } from "./OrganizationCard";

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
    iconColor
}) => {
    // Rely on exactly what is passed via the organizations prop
    const displayedOrgs = organizations;

    if (loading) {
        return (
            <Box p={4} textAlign="center">
                <Typography color="text.secondary">Loading your organizations...</Typography>
                {/* We could add skeletons here later */}
            </Box>
        );
    }

    return (
        <Box>
            <Box sx={{ mb: 6 }}>
                <Box display="flex" alignItems="flex-start" justifyContent="space-between" mb={4} flexWrap="wrap" gap={2}>
                    <Box>
                        {title && (
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: description ? 1 : 0 }}>
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
                                    fontWeight: 800, 
                                    color: '#000', 
                                    fontFamily: "'Plus Jakarta Sans', 'Inter', sans-serif", 
                                    letterSpacing: { xs: '-0.5px', sm: '-1.5px' },
                                    fontSize: { xs: '1.5rem', sm: '2rem', md: '2.125rem' }
                                }}>
                                    {title}
                                </Typography>
                            </Box>
                        )}
                        {description && (
                            <Typography variant="body1" sx={{ 
                                color: '#6B7280', 
                                fontSize: { xs: '0.9rem', sm: '1.05rem' },
                                fontFamily: "'Inter', sans-serif" 
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
                                <OrganizationCard {...org} onClick={onCardClick} />
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
