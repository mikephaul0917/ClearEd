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
}

const OrganizationBoard: React.FC<OrganizationBoardProps> = ({
    organizations,
    loading = false,
    onCardClick
}) => {
    const [filterMode, setFilterMode] = useState<'active' | 'archived'>('active');

    const activeOrgs = organizations.filter(org => org.status === "active");
    const archivedOrgs = organizations.filter(org => org.status === "archived");

    // Determine which organizations to show based on the toggle
    const displayedOrgs = filterMode === 'active' ? activeOrgs : archivedOrgs;

    if (loading) {
        return (
            <Box p={4} textAlign="center">
                <Typography color="text.secondary">Loading your organizations...</Typography>
                {/* We could add skeletons here later */}
            </Box>
        );
    }

    if (organizations.length === 0) {
        return (
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
                    No organizations yet
                </Typography>
                <Typography color="text.secondary" sx={{ mb: 3 }}>
                    Join an organization using a code provided by your institution.
                </Typography>
                <Box>
                    {/* Join code button would go here */}
                </Box>
            </Box>
        );
    }

    return (
        <Box>
            <Box sx={{ mb: 6 }}>
                <Box display="flex" alignItems="center" justifyContent="space-between" mb={3} flexWrap="wrap" gap={2}>
                    <Typography variant="h5" fontWeight={700} color="#0F172A">
                        {filterMode === 'active' ? 'Active Organizations' : 'Archived Organizations'}
                    </Typography>

                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Typography variant="body2" color="text.secondary">
                            {filterMode === 'active' ? `${activeOrgs.length} Ongoing` : `${archivedOrgs.length} Past terms`}
                        </Typography>

                        <Box sx={{
                            display: 'flex',
                            bgcolor: '#f8fafc',
                            borderRadius: '999px',
                            border: '1px solid #e2e8f0',
                            p: 0.5
                        }}>
                            <Button
                                onClick={() => setFilterMode('active')}
                                sx={{
                                    px: 3, py: 0.5, borderRadius: '999px', textTransform: 'none', fontWeight: 700, fontSize: 14,
                                    color: filterMode === 'active' ? '#fff' : '#64748b',
                                    bgcolor: filterMode === 'active' ? '#0f172a' : 'transparent',
                                    '&:hover': { bgcolor: filterMode === 'active' ? '#0f172a' : 'rgba(0,0,0,0.04)' }
                                }}
                            >
                                Active
                            </Button>
                            <Button
                                onClick={() => setFilterMode('archived')}
                                sx={{
                                    px: 3, py: 0.5, borderRadius: '999px', textTransform: 'none', fontWeight: 700, fontSize: 14,
                                    color: filterMode === 'archived' ? '#fff' : '#64748b',
                                    bgcolor: filterMode === 'archived' ? '#0f172a' : 'transparent',
                                    '&:hover': { bgcolor: filterMode === 'archived' ? '#0f172a' : 'rgba(0,0,0,0.04)' }
                                }}
                            >
                                Archived
                            </Button>
                        </Box>
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
                            p: 6,
                            textAlign: "center",
                            bgcolor: "#f8fafc",
                            borderRadius: 4,
                            border: "1px dashed #cbd5e1"
                        }}
                    >
                        <Typography variant="h6" fontWeight={600} color="#64748b">
                            No {filterMode} organizations
                        </Typography>
                    </Box>
                )}
            </Box>
        </Box>
    );
};

export default OrganizationBoard;
