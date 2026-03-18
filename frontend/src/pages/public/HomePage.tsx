import React, { useState, useEffect } from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import { useNavigate } from "react-router-dom";
import OrganizationBoard from "../../components/organization/OrganizationBoard";
import JoinOrganizationModal from "../../components/organization/JoinOrganizationModal";
import CreateOrganizationModal from "../../components/organization/CreateOrganizationModal";
import RoleLayout from "../../components/layout/RoleLayout";
import { useAuth } from "../../hooks/useAuth";
import { organizationService } from "../../services";
import { OrganizationCardProps } from "../../components/organization/OrganizationCard";

/**
 * HomePage Component
 * The main landing page after login for Students and Officers.
 * Shows all organizations they are part of.
 */

const HomePage: React.FC = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [organizations, setOrganizations] = useState<OrganizationCardProps[]>([]);
    const [loading, setLoading] = useState(true);
    const [isJoinModalOpen, setIsJoinModalOpen] = useState(false);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

    const isAdmin = user?.role === "admin" || user?.role === "super_admin";

    const fetchOrgs = async () => {
        try {
            setLoading(true);
            const data = await organizationService.getMyOrganizations();
            const orgs = data.organizations.map((org: any) => ({
                id: org._id,
                name: org.name,
                description: org.description,
                role: org.membership?.role || "member",
                status: org.status,
                termName: org.termId ? `${org.termId.semester} ${org.termId.academicYear}` : "Current Term",
                institutionName: user?.institutionId || "Institution",
                color: org.themeColor || (org.status === 'archived' ? "#64748B" : (org.membership?.role === 'officer' ? "#2563EB" : "#1E293B")),
                headerImage: org.headerImage
            }));
            setOrganizations(orgs);
        } catch (error) {
            console.error("Failed to fetch organizations", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchOrgs();
    }, []);

    const handleCardClick = (id: string) => {
        navigate(`/organization/${id}`);
    };

    if (!user) return null;

    return (
        <RoleLayout>
            <Box sx={{ maxWidth: 1200, mx: "auto" }}>
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={4} flexDirection={{ xs: 'column', sm: 'row' }} gap={{ xs: 2, sm: 0 }}>
                    <Box>
                        <Typography variant="h4" fontWeight={800} color="#0F172A" gutterBottom>
                            Home
                        </Typography>
                        <Typography color="text.secondary">
                            Welcome back, {user.username || "User"}. Here are your organizations.
                        </Typography>
                    </Box>
                    <Box display="flex" gap={2} flexDirection={{ xs: 'column', sm: 'row' }} width={{ xs: '100%', sm: 'auto' }}>
                        {isAdmin && (
                            <Button
                                variant="outlined"
                                onClick={() => setIsCreateModalOpen(true)}
                                sx={{
                                    borderColor: "#0F172A",
                                    color: "#0F172A",
                                    borderRadius: "10px",
                                    textTransform: "none",
                                    px: 3,
                                    fontWeight: 700,
                                    "&:hover": { borderColor: "#1E293B", bgcolor: "rgba(15, 23, 42, 0.04)" }
                                }}
                            >
                                Create Organization
                            </Button>
                        )}
                        <Button
                            variant="contained"
                            onClick={() => setIsJoinModalOpen(true)}
                            sx={{
                                bgcolor: "#0F172A",
                                borderRadius: "10px",
                                textTransform: "none",
                                px: 3,
                                fontWeight: 700,
                                "&:hover": { bgcolor: "#1E293B" }
                            }}
                        >
                            Join Organization
                        </Button>
                    </Box>
                </Box>

                <OrganizationBoard
                    organizations={organizations}
                    loading={loading}
                    onCardClick={handleCardClick}
                />

                <JoinOrganizationModal
                    open={isJoinModalOpen}
                    onClose={() => setIsJoinModalOpen(false)}
                    onJoined={fetchOrgs}
                />

                <CreateOrganizationModal
                    open={isCreateModalOpen}
                    onClose={() => setIsCreateModalOpen(false)}
                    onCreated={fetchOrgs}
                />
            </Box>
        </RoleLayout>
    );
};

export default HomePage;
