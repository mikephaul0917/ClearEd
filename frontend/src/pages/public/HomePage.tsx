import React, { useState, useEffect } from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import IconButton from "@mui/material/IconButton";
import Tooltip from "@mui/material/Tooltip";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import AddIcon from "@mui/icons-material/Add";
import BusinessIcon from "@mui/icons-material/Business";
import { useNavigate } from "react-router-dom";
import OrganizationBoard from "../../components/organization/OrganizationBoard";
import JoinOrganizationModal from "../../components/organization/JoinOrganizationModal";
import CreateOrganizationModal from "../../components/organization/CreateOrganizationModal";
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
    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
    const openMenu = Boolean(anchorEl);

    const isAdmin = user?.role === "admin" || user?.role === "super_admin";
    const isOfficerOrAdmin = isAdmin || user?.role === "officer";

    const handleMenuClick = (event: React.MouseEvent<HTMLElement>) => {
        setAnchorEl(event.currentTarget);
    };

    const handleMenuClose = () => {
        setAnchorEl(null);
    };

    const handleJoinClick = () => {
        handleMenuClose();
        setIsJoinModalOpen(true);
    };

    const handleCreateClick = () => {
        handleMenuClose();
        setIsCreateModalOpen(true);
    };

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
                    termName: org.termId 
                        ? `${org.termId.semester} ${org.termId.academicYear}`
                        : "Current Term",
                    institutionName: user?.institutionId || "Institution",
                    color: org.themeColor || (org.membership?.role === 'officer' ? "#2563EB" : "#1E293B"),
                    headerImage: org.headerImage
                }));
            setOrganizations(activeOrgs);
        } catch (error) {
            console.error("Failed to fetch organizations", error);
        } finally {
            // Add deliberate delay for premium feel
            setTimeout(() => {
                setLoading(false);
            }, 2000);
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
        <>
            <Box sx={{ maxWidth: 1200, mx: "auto", px: { xs: 2, md: 4 }, pb: { xs: 2, md: 4 }, pt: 0 }}>
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
                    onRefresh={fetchOrgs}
                    isAdmin={isAdmin}
                    headerAction={
                        <Box display="flex" gap={1.5} flexDirection="row" alignItems="center" flexWrap="wrap">
                            <Tooltip title="Create or join a class" arrow placement="top">
                                <IconButton
                                    onClick={handleMenuClick}
                                    sx={{
                                        position: { xs: 'fixed', sm: 'relative' },
                                        bottom: { xs: 40, sm: 'auto' },
                                        right: { xs: 40, sm: 'auto' },
                                        zIndex: 1000,
                                        bgcolor: "#3c4043",
                                        color: "#FFFFFF",
                                        border: "none",
                                        borderRadius: { xs: "16px", sm: "10px" },
                                        width: { xs: 56, sm: 42 },
                                        height: { xs: 56, sm: 42 },
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        p: 0,
                                        boxShadow: "0 10px 30px rgba(0, 0, 0, 0.25), 0 4px 10px rgba(0, 0, 0, 0.1)",
                                        transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                                        "&:hover": {
                                            bgcolor: "#202124",
                                            boxShadow: "0 15px 40px rgba(0, 0, 0, 0.35)",
                                            transform: "translateY(-4px) scale(1.02)"
                                        }
                                    }}
                                >
                                    <AddIcon sx={{ fontSize: { xs: 28, sm: 24 } }} />
                                </IconButton>
                            </Tooltip>
                            <Menu
                                anchorEl={anchorEl}
                                open={openMenu}
                                onClose={handleMenuClose}
                                transformOrigin={{ horizontal: 'right', vertical: 'top' }}
                                anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
                                PaperProps={{
                                    elevation: 0,
                                    sx: {
                                        overflow: 'visible',
                                        filter: 'drop-shadow(0px 4px 20px rgba(0,0,0,0.1))',
                                        mt: 0.5,
                                        borderRadius: '8px',
                                        minWidth: 160,
                                        py: 0.5,
                                        '& .MuiMenuItem-root': {
                                            fontFamily: '"Google Sans", "Product Sans", Roboto, sans-serif',
                                            py: 1.5,
                                            px: 2.5,
                                            fontSize: '0.95rem',
                                            fontWeight: 500,
                                            color: '#3c4043',
                                            transition: 'background-color 0.2s',
                                            '&:hover': {
                                                bgcolor: 'rgba(0, 0, 0, 0.04)',
                                            }
                                        }
                                    },
                                }}
                            >
                                <MenuItem onClick={handleJoinClick}>
                                    Join org
                                </MenuItem>
                                {isOfficerOrAdmin && (
                                    <MenuItem onClick={handleCreateClick}>
                                        Create org
                                    </MenuItem>
                                )}
                            </Menu>
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
        </>
    );
};

export default HomePage;
