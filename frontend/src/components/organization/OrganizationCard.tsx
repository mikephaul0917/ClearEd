import React, { useState } from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Paper from "@mui/material/Paper";
import Chip from "@mui/material/Chip";
import Avatar from "@mui/material/Avatar";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import Button from "@mui/material/Button";
import IconButton from "@mui/material/IconButton";
import CloseIcon from "@mui/icons-material/Close";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import ListItemIcon from "@mui/material/ListItemIcon";
import ArchiveIcon from "@mui/icons-material/Archive";
import UnarchiveIcon from "@mui/icons-material/Unarchive";
import LogoutIcon from "@mui/icons-material/Logout";
import { organizationService } from "../../services/organization.service";
import GenericConfirmationModal from "../modals/GenericConfirmationModal";

/**
 * OrganizationCard Component
 * Displays essential organization info in a card format (Google Classroom style).
 */
export interface OrganizationCardProps {
    id: string;
    name: string;
    description?: string;
    role: "member" | "officer";
    status: "active" | "archived";
    termName: string;
    institutionName: string;
    color?: string; // Optional brand color for the header
    headerImage?: string | null; // Optional header image banner
    onClick?: (id: string) => void;
    onRefresh?: () => void;
    isAdmin?: boolean;
}

const OrganizationCard: React.FC<OrganizationCardProps> = ({
    id,
    name,
    description,
    role,
    status,
    termName,
    institutionName,
    color = "#0F172A",
    headerImage,
    onClick,
    onRefresh,
    isAdmin = false
}) => {
    const [open, setOpen] = useState(false);
    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
    const [isArchiveModalOpen, setIsArchiveModalOpen] = useState(false);
    const [isUnarchiveModalOpen, setIsUnarchiveModalOpen] = useState(false);
    const [isLeaveModalOpen, setIsLeaveModalOpen] = useState(false);
    const [isActionLoading, setIsActionLoading] = useState(false);

    const handleMenuOpen = (e: React.MouseEvent<HTMLButtonElement>) => {
        e.stopPropagation();
        setAnchorEl(e.currentTarget);
    };

    const handleMenuClose = (e?: React.MouseEvent) => {
        if (e) e.stopPropagation();
        setAnchorEl(null);
    };

    const handleArchiveClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        setIsArchiveModalOpen(true);
        handleMenuClose();
    };

    const handleUnarchiveClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        setIsUnarchiveModalOpen(true);
        handleMenuClose();
    };

    const handleLeaveClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        setIsLeaveModalOpen(true);
        handleMenuClose();
    };

    const handleArchiveConfirm = async () => {
        setIsActionLoading(true);
        try {
            await organizationService.archiveOrganization(id);
            onRefresh?.();
        } catch (error) {
            console.error("Failed to archive organization:", error);
        } finally {
            setIsActionLoading(false);
            setIsArchiveModalOpen(false);
        }
    };

    const handleUnarchiveConfirm = async () => {
        setIsActionLoading(true);
        try {
            await organizationService.unarchiveOrganization(id);
            onRefresh?.();
        } catch (error) {
            console.error("Failed to unarchive organization:", error);
        } finally {
            setIsActionLoading(false);
            setIsUnarchiveModalOpen(false);
        }
    };

    const handleLeaveConfirm = async () => {
        setIsActionLoading(true);
        try {
            await organizationService.leaveOrganization(id);
            onRefresh?.();
        } catch (error) {
            console.error("Failed to leave organization:", error);
        } finally {
            setIsActionLoading(false);
            setIsLeaveModalOpen(false);
        }
    };

    const handleLearnMore = (e: React.MouseEvent) => {
        e.stopPropagation();
        setOpen(true);
    };

    const handleClose = (event?: React.SyntheticEvent | {}, reason?: string) => {
        if (event && "stopPropagation" in event) {
            (event as React.SyntheticEvent).stopPropagation();
        }
        setOpen(false);
    };

    return (
        <>
            <Box
                onClick={() => onClick?.(id)}
                sx={{
                    width: "100%",
                    maxWidth: { xs: 280, sm: 320 },
                    mx: 'auto',
                    aspectRatio: "1/1",
                    cursor: "pointer",
                    position: "relative",
                    transition: "all 0.4s cubic-bezier(0.4, 0, 0.2, 1)",
                    opacity: status === "archived" ? 0.7 : 1,
                }}
            >
                {/* Header Background Container (Rounded and Clipped) */}
                <Box
                    sx={{
                        position: "absolute",
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        borderRadius: "32px",
                        overflow: "hidden",
                        bgcolor: "#FFFFFF",
                        boxShadow: "0 10px 30px rgba(0,0,0,0.04)",
                        border: "1px solid #F1F5F9",
                    }}
                >
                    {/* Header Section */}
                    <Box
                        className="card-header"
                        sx={{
                            height: "60%",
                            bgcolor: color,
                            backgroundImage: headerImage ? `url(${headerImage})` : 'none',
                            backgroundSize: 'cover',
                            backgroundPosition: 'center',
                            display: 'flex',
                            alignItems: 'flex-start',
                            justifyContent: 'center',
                            pt: 6,
                        }}
                    >
                        <Box
                            className="icon-box"
                            sx={{
                                width: 60,
                                height: 60,
                                bgcolor: "#FFFFFF",
                                borderRadius: "50%",
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                boxShadow: "0 8px 20px rgba(0,0,0,0.12)",
                                transition: "all 0.4s cubic-bezier(0.4, 0, 0.2, 1)",
                                zIndex: 2
                            }}
                        >
                            <Avatar
                                sx={{
                                    width: 32,
                                    height: 32,
                                    bgcolor: "transparent",
                                    color: color,
                                    fontWeight: 800,
                                    fontSize: 18,
                                    fontFamily: '"Google Sans", "Product Sans", Roboto, sans-serif'
                                }}
                            >
                                {name.charAt(0)}
                            </Avatar>
                        </Box>

                        {/* Top Right Ellipsis Button */}
                        <IconButton
                            size="small"
                            onClick={handleMenuOpen}
                            sx={{
                                position: "absolute",
                                top: 24,
                                right: 24,
                                color: "#FFFFFF",
                                bgcolor: "rgba(255, 255, 255, 0.25)",
                                backdropFilter: "blur(8px)",
                                border: "1px solid rgba(255, 255, 255, 0.3)",
                                zIndex: 10,
                                "&:hover": {
                                    bgcolor: "rgba(255, 255, 255, 0.4)",
                                }
                            }}
                        >
                            <MoreVertIcon fontSize="small" />
                        </IconButton>
                    </Box>
                </Box>

                {/* Sliding Content Overlay (Floating Panel - Wider than header) */}
                <Box
                    className="content-overlay"
                    sx={{
                        position: "absolute",
                        bottom: 0,
                        left: -6,
                        right: -6,
                        bgcolor: "#FFFFFF",
                        p: { xs: "28px 20px 32px", sm: "20px" },
                        minHeight: { xs: "140px", sm: "auto" },
                        borderRadius: "24px",
                        boxShadow: "0 12px 32px rgba(0,0,0,0.12)",
                        transition: "all 0.4s cubic-bezier(0.4, 0, 0.2, 1)",
                        display: "flex",
                        flexDirection: "column",
                        zIndex: 3,
                        "&:hover": {
                            transform: "translateY(-6px)",
                            "& .card-description": {
                                maxHeight: "100px",
                                opacity: 1,
                                mt: 2
                            }
                        }
                    }}
                >
                    <Typography
                        sx={{
                            fontSize: "1.25rem",
                            fontWeight: 800,
                            color: "#1F2937",
                            fontFamily: '"Google Sans", "Product Sans", Roboto, sans-serif',
                            display: "-webkit-box",
                            WebkitLineClamp: 1,
                            WebkitBoxOrient: "vertical",
                            overflow: "hidden"
                        }}
                    >
                        {name}
                    </Typography>

                    <Menu
                        anchorEl={anchorEl}
                        open={Boolean(anchorEl)}
                        onClose={() => handleMenuClose()}
                        onClick={(e) => e.stopPropagation()}
                        PaperProps={{
                            elevation: 3,
                            sx: {
                                borderRadius: "12px",
                                mt: 0.5,
                                minWidth: 160,
                                border: "1px solid #F1F5F9"
                            }
                        }}
                        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
                        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
                    >
                        {(role === 'officer' || isAdmin) && status !== 'archived' && (
                            <MenuItem onClick={handleArchiveClick} sx={{ py: 1.5, gap: 1.5 }}>
                                <ListItemIcon sx={{ minWidth: "auto !important" }}>
                                    <ArchiveIcon fontSize="small" />
                                </ListItemIcon>
                                <Typography variant="body2" fontWeight={600}>Archive</Typography>
                            </MenuItem>
                        )}
                        {(role === 'officer' || isAdmin) && status === 'archived' && (
                            <MenuItem onClick={handleUnarchiveClick} sx={{ py: 1.5, gap: 1.5 }}>
                                <ListItemIcon sx={{ minWidth: "auto !important" }}>
                                    <UnarchiveIcon fontSize="small" />
                                </ListItemIcon>
                                <Typography variant="body2" fontWeight={600}>Unarchive</Typography>
                            </MenuItem>
                        )}
                        {(role === 'member' || role === 'officer') && (
                            <MenuItem onClick={handleLeaveClick} sx={{ py: 1.5, gap: 1.5, color: "#DC2626" }}>
                                <ListItemIcon sx={{ minWidth: "auto !important", color: "inherit" }}>
                                    <LogoutIcon fontSize="small" />
                                </ListItemIcon>
                                <Typography variant="body2" fontWeight={600}>Leave Organization</Typography>
                            </MenuItem>
                        )}
                    </Menu>

                    <Box
                        className="card-description"
                        sx={{
                            maxHeight: 0,
                            opacity: 0,
                            transition: "all 0.4s cubic-bezier(0.4, 0, 0.2, 1)",
                            overflow: "hidden"
                        }}
                    >
                        <Typography
                            sx={{
                                fontSize: "0.875rem",
                                color: "#6B7280",
                                lineHeight: 1.5,
                                fontFamily: '"Google Sans", "Product Sans", Roboto, sans-serif',
                                display: "-webkit-box",
                                WebkitLineClamp: 3,
                                WebkitBoxOrient: "vertical",
                                overflow: "hidden",
                            }}
                        >
                            {description || "Join this organization to access exclusive content and tools for your clearance process."}
                        </Typography>
                    </Box>

                    {/* Footer Section - Pills (Always visible) */}
                    <Box sx={{ display: 'flex', gap: 1.5, mt: 2 }}>
                        <Box
                            onClick={handleLearnMore}
                            className="learn-more-btn"
                            sx={{
                                px: 3,
                                py: 1,
                                bgcolor: "#FFFFFF",
                                borderRadius: "100px",
                                border: "1px solid #E5E7EB",
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                boxShadow: "0 8px 24px rgba(0, 0, 0, 0.04)",
                                transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                                cursor: "pointer",
                                "&:hover": {
                                    bgcolor: "#FAFAFA",
                                    boxShadow: "0 12px 32px rgba(0, 0, 0, 0.08)",
                                    transform: "translateY(-1px)"
                                }
                            }}
                        >
                            <Typography sx={{ fontSize: "0.8rem", fontWeight: 600, color: "#000000", fontFamily: '"Google Sans", "Product Sans", Roboto, sans-serif', whiteSpace: 'nowrap' }}>
                                Learn more
                            </Typography>
                        </Box>
                        <Box
                            sx={{
                                px: 3,
                                py: 1,
                                flex: 1,
                                bgcolor: "rgba(176, 224, 230, 0.2)",
                                borderRadius: "20px",
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                            }}
                        >
                            <Typography sx={{ fontSize: "0.75rem", fontWeight: 700, color: "#0D9488", fontFamily: '"Google Sans", "Product Sans", Roboto, sans-serif', textTransform: 'capitalize' }}>
                                {role}
                            </Typography>
                        </Box>
                    </Box>
                </Box>
            </Box>

            {/* Modal for Full Description */}
            <Dialog
                open={open}
                onClose={handleClose}
                onClick={(e) => e.stopPropagation()}
                PaperProps={{
                    sx: {
                        borderRadius: "14px",
                        padding: "8px",
                        maxWidth: "500px",
                        width: "100%"
                    }
                }}
            >
                <DialogTitle sx={{ m: 0, p: 2, pr: 6, fontWeight: 800, fontSize: "1.5rem", fontFamily: '"Google Sans", "Product Sans", Roboto, sans-serif' }}>
                    {name}
                    <IconButton
                        onClick={handleClose}
                        sx={{
                            position: "absolute",
                            right: 16,
                            top: 16,
                            color: (theme) => theme.palette.grey[500],
                        }}
                    >
                        <CloseIcon />
                    </IconButton>
                </DialogTitle>
                <DialogContent sx={{ p: 2 }}>
                    <Typography sx={{ color: "#4B5563", lineHeight: 1.6, fontFamily: '"Google Sans", "Product Sans", Roboto, sans-serif' }}>
                        {description || "Join this organization to access exclusive content and tools for your clearance process."}
                    </Typography>
                    <Box sx={{ mt: 3, display: 'flex', gap: 2 }}>
                        <Box sx={{ p: 1.5, bgcolor: "#F8FAFC", borderRadius: "6px", flex: 1 }}>
                            <Typography sx={{ fontSize: 11, fontWeight: 700, color: "#94A3B8", textTransform: 'uppercase', mb: 0.5 }}>Role</Typography>
                            <Typography sx={{ fontWeight: 700, textTransform: 'capitalize' }}>{role}</Typography>
                        </Box>
                        <Box sx={{ p: 1.5, bgcolor: "#F8FAFC", borderRadius: "6px", flex: 1 }}>
                            <Typography sx={{ fontSize: 11, fontWeight: 700, color: "#94A3B8", textTransform: 'uppercase', mb: 0.5 }}>Term</Typography>
                            <Typography sx={{ fontWeight: 700 }}>{termName}</Typography>
                        </Box>
                    </Box>
                </DialogContent>

            </Dialog>

            <GenericConfirmationModal
                open={isArchiveModalOpen}
                onClose={() => setIsArchiveModalOpen(false)}
                onConfirm={handleArchiveConfirm}
                title="Archive Organization?"
                description={`Are you sure you want to archive "${name}"? This will hide it from active dashboards for all members.`}
                confirmText="Archive"
                loading={isActionLoading}
            />

            <GenericConfirmationModal
                open={isUnarchiveModalOpen}
                onClose={() => setIsUnarchiveModalOpen(false)}
                onConfirm={handleUnarchiveConfirm}
                title="Unarchive Organization?"
                description={`Are you sure you want to unarchive "${name}"? This will return it to the active organizations dashboard.`}
                confirmText="Unarchive"
                loading={isActionLoading}
            />

            <GenericConfirmationModal
                open={isLeaveModalOpen}
                onClose={() => setIsLeaveModalOpen(false)}
                onConfirm={handleLeaveConfirm}
                title="Leave Organization?"
                description={`Are you sure you want to leave "${name}"? You will need an invite code to join again.`}
                confirmText="Leave"
                loading={isActionLoading}
            />
        </>
    );
};

export default OrganizationCard;
