import React, { useState, useEffect } from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import IconButton from "@mui/material/IconButton";
import Tooltip from "@mui/material/Tooltip";
import AddIcon from "@mui/icons-material/Add";
import BusinessIcon from "@mui/icons-material/Business";
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
            const activeOrgs = data.organizations
                .filter((org: any) => org.status === 'active')
                .map((org: any) => ({
                    id: org._id,
                    name: org.name,
                    description: org.description,
                    role: org.membership?.role || "member",
                    status: org.status,
                    termName: org.termId ? `${org.termId.semester} ${org.termId.academicYear}` : "Current Term",
                    institutionName: user?.institutionId || "Institution",
                    color: org.themeColor || (org.membership?.role === 'officer' ? "#2563EB" : "#1E293B"),
                    headerImage: org.headerImage
                }));
            setOrganizations(activeOrgs);
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
            <Box sx={{ maxWidth: 1200, mx: "auto", p: { xs: 2, md: 4 } }}>
                <OrganizationBoard
                    organizations={organizations}
                    loading={loading}
                    onCardClick={handleCardClick}
                    title="Active Organizations"
                    description="Classes and groups you are currently part of."
                    emptyTitle="No active organizations"
                    emptyMessage="Join an organization using a code provided by your institution."
                    icon={<BusinessIcon />}
                    iconBgColor="#F1F5F9"
                    iconColor="#475569"
                    headerAction={
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
                            <Tooltip title="Join Organization" arrow placement="top">
                                <IconButton
                                    onClick={() => setIsJoinModalOpen(true)}
                                    sx={{
                                        bgcolor: "#FFFFFF",
                                        color: "#0F172A",
                                        border: "1px solid #0F172A",
                                        borderRadius: "10px",
                                        width: 42,
                                        height: 42,
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        p: 0,
                                        "&:hover": { bgcolor: "#F1F5F9" }
                                    }}
                                >
                                    <AddIcon />
                                </IconButton>
                            </Tooltip>
                        </Box>
                    }
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
