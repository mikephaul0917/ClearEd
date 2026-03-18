import React from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Grid from "@mui/material/Grid";
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
    const activeOrgs = organizations.filter(org => org.status === "active");
    const archivedOrgs = organizations.filter(org => org.status === "archived");

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
            {/* Active Organizations */}
            {activeOrgs.length > 0 && (
                <Box sx={{ mb: 6 }}>
                    <Box display="flex" alignItems="center" justifyContent="space-between" mb={3}>
                        <Typography variant="h5" fontWeight={700} color="#0F172A">
                            Active Organizations
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            {activeOrgs.length} Ongoing
                        </Typography>
                    </Box>
                    <Grid container spacing={3}>
                        {activeOrgs.map((org) => (
                            <Grid item key={org.id} xs={12} sm={6} md={4} lg={3}>
                                <OrganizationCard {...org} onClick={onCardClick} />
                            </Grid>
                        ))}
                    </Grid>
                </Box>
            )}

            {/* Archived Organizations */}
            {archivedOrgs.length > 0 && (
                <Box>
                    <Divider sx={{ mb: 4 }} />
                    <Box display="flex" alignItems="center" justifyContent="space-between" mb={3}>
                        <Typography variant="h5" fontWeight={700} color="#64748B">
                            Archived
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            Past terms
                        </Typography>
                    </Box>
                    <Grid container spacing={3}>
                        {archivedOrgs.map((org) => (
                            <Grid item key={org.id} xs={12} sm={6} md={4} lg={3}>
                                <OrganizationCard {...org} onClick={onCardClick} />
                            </Grid>
                        ))}
                    </Grid>
                </Box>
            )}
        </Box>
    );
};

export default OrganizationBoard;
