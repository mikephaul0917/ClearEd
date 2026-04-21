import React, { useState, useEffect } from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Paper from "@mui/material/Paper";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import ListItemAvatar from "@mui/material/ListItemAvatar";
import ListItemText from "@mui/material/ListItemText";
import Avatar from "@mui/material/Avatar";
import IconButton from "@mui/material/IconButton";
import Chip from "@mui/material/Chip";
import CircularProgress from "@mui/material/CircularProgress";
import Divider from "@mui/material/Divider";
import Tooltip from "@mui/material/Tooltip";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import PersonRemoveIcon from "@mui/icons-material/PersonRemove";
import { organizationService } from "../../services";
import { getAbsoluteUrl, getInitials } from "../../utils/avatarUtils";
import { useAuth } from "../../contexts/AuthContext";
import GenericConfirmationModal from "../modals/GenericConfirmationModal";

interface MembersListProps {
    organizationId: string;
    isOfficer: boolean;
    isAdmin: boolean;
}

const MembersList: React.FC<MembersListProps> = ({ organizationId, isOfficer, isAdmin }) => {
    const [members, setMembers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [removingId, setRemovingId] = useState<string | null>(null);
    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
    const [menuTargetId, setMenuTargetId] = useState<string | null>(null);
    const [isRemoveModalOpen, setIsRemoveModalOpen] = useState(false);

    const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, userId: string) => {
        setAnchorEl(event.currentTarget);
        setMenuTargetId(userId);
    };

    const handleMenuClose = () => {
        setAnchorEl(null);
        setMenuTargetId(null);
    };

    const handleRemoveClick = () => {
        if (menuTargetId) {
            handleRemoveMember(menuTargetId);
        }
        handleMenuClose();
    };

    const fetchMembers = async () => {
        try {
            setLoading(true);
            const data = await organizationService.getMembers(organizationId);
            // Handle both { data: [] } and { members: [] } API structures
            const membersList = data?.data || data?.members || [];
            setMembers(membersList);
        } catch (error) {
            console.error("Failed to fetch members:", error);
            setMembers([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchMembers();
    }, [organizationId]);

    const handleRemoveMember = (userId: string) => {
        setMemberToRemoveId(userId);
        setIsRemoveModalOpen(true);
    };

    const [memberToRemoveId, setMemberToRemoveId] = useState<string | null>(null);

    const confirmRemoveMember = async () => {
        if (!memberToRemoveId) return;
        try {
            setRemovingId(memberToRemoveId);
            await organizationService.removeMember(organizationId, memberToRemoveId);
            setMembers(prev => prev.filter(m => m.userId._id !== memberToRemoveId));
            setIsRemoveModalOpen(false);
            setMemberToRemoveId(null);
        } catch (error) {
            console.error("Failed to remove member:", error);
            alert("Failed to remove member. You might not have permission.");
        } finally {
            setRemovingId(null);
        }
    };

    const { user } = useAuth();
    const [fullUser, setFullUser] = useState<any>(() => {
        const str = localStorage.getItem("user");
        return str ? JSON.parse(str) : null;
    });

    useEffect(() => {
        const handleStorageChange = (e: StorageEvent) => {
            if (e.key === 'user' && e.newValue) {
                setFullUser(JSON.parse(e.newValue));
            }
        };
        window.addEventListener('storage', handleStorageChange);
        return () => window.removeEventListener('storage', handleStorageChange);
    }, []);

    if (loading) {
        return (
            <Box display="flex" justifyContent="center" py={4}>
                <CircularProgress size={32} />
            </Box>
        );
    }

    const activeMembers = (members || []).filter(m => m.userId && m.userId.enabled !== false);
    const officers = activeMembers.filter(m => m.role === 'officer' && m.userId?.role !== 'admin' && m.userId?.role !== 'super_admin');
    const students = activeMembers.filter(m => m.role === 'member');

    const canManage = isOfficer || isAdmin;

    return (
        <Box>
            {/* Officers Section */}
            <Typography variant="h6" fontWeight={700} sx={{ mb: 2, color: "#0F172A" }}>
                Officers
            </Typography>
            <Paper elevation={0} sx={{ borderRadius: 3, border: "1px solid #E2E8F0", overflow: "hidden", mb: 4 }}>
                <List disablePadding>
                    {officers.map((member, index) => {
                        const currentId = (user as any)?.id || fullUser?._id || fullUser?.id;
                        const memberId = member.userId?._id || member.userId?.id || (typeof member.userId === 'string' ? member.userId : null);
                        const isCurrentUser = !!currentId && currentId === memberId;

                        const memberUser = isCurrentUser ? { ...member.userId, ...fullUser } : member.userId;
                        const avatarSrc = memberUser?.avatarUrl || "";

                        return (
                            <React.Fragment key={member._id}>
                                <ListItem sx={{ py: { xs: 1.5, sm: 2 }, px: { xs: 2, sm: 2 } }}>
                                    <ListItemAvatar sx={{ minWidth: { xs: 48, sm: 56 } }}>
                                        <Avatar 
                                            src={getAbsoluteUrl(avatarSrc)}
                                            sx={{ 
                                                bgcolor: "#5F6368", 
                                                color: "#FFFFFF",
                                                fontWeight: 700,
                                                fontSize: '0.75rem',
                                                width: { xs: 32, sm: 40 },
                                                height: { xs: 32, sm: 40 }
                                            }}
                                        >
                                            {getInitials(memberUser?.fullName, memberUser?.email)}
                                        </Avatar>
                                    </ListItemAvatar>
                                    <ListItemText
                                        primary={
                                            <Typography fontWeight={600} sx={{ fontSize: { xs: '0.875rem', sm: '1rem' }, display: 'flex', alignItems: 'center', flexWrap: 'wrap' }}>
                                                {memberUser?.fullName}
                                            </Typography>
                                        }
                                        secondary={
                                            <Typography variant="body2" sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' }, color: 'text.secondary', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                {memberUser?.email}
                                            </Typography>
                                        }
                                    />
                                </ListItem>
                                {index < officers.length - 1 && <Divider />}
                            </React.Fragment>
                        );
                    })}
                    {officers.length === 0 && (
                        <ListItem>
                            <Typography color="text.secondary">No officers found.</Typography>
                        </ListItem>
                    )}
                </List>
            </Paper>

            {/* Students Section */}
            <Box display="flex" flexDirection={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems={{ xs: 'flex-start', sm: 'center' }} mb={2} gap={1}>
                <Typography variant="h6" fontWeight={700} sx={{ color: "#0F172A", fontSize: { xs: '1.1rem', sm: '1.25rem' } }}>
                    Students
                </Typography>
                <Typography variant="body2" color="text.secondary">
                    {students.length} members
                </Typography>
            </Box>
            <Paper elevation={0} sx={{ borderRadius: 3, border: "1px solid #E2E8F0", overflow: "hidden" }}>
                <List disablePadding>
                    {students.map((member, index) => {
                        const currentId = (user as any)?.id || fullUser?._id || fullUser?.id;
                        const memberId = member.userId?._id || member.userId?.id || (typeof member.userId === 'string' ? member.userId : null);
                        const isCurrentUser = !!currentId && currentId === memberId;

                        const memberUser = isCurrentUser ? { ...member.userId, ...fullUser } : member.userId;
                        const avatarSrc = memberUser?.avatarUrl || "";
                                        
                        return (
                            <React.Fragment key={member._id}>
                                <ListItem sx={{ py: { xs: 1.5, sm: 2 }, px: { xs: 2, sm: 2 } }}>
                                    <ListItemAvatar sx={{ minWidth: { xs: 48, sm: 56 } }}>
                                        <Avatar 
                                            src={getAbsoluteUrl(avatarSrc)}
                                            sx={{ 
                                                bgcolor: "#5F6368", 
                                                color: "#FFFFFF",
                                                fontWeight: 700,
                                                fontSize: '0.75rem',
                                                width: { xs: 32, sm: 40 },
                                                height: { xs: 32, sm: 40 }
                                            }}
                                        >
                                            {getInitials(memberUser?.fullName, memberUser?.email)}
                                        </Avatar>
                                    </ListItemAvatar>
                                    <ListItemText
                                        primary={<Typography fontWeight={600} sx={{ fontSize: { xs: '0.875rem', sm: '1rem' } }}>{memberUser?.fullName}</Typography>}
                                        secondary={
                                            <Box component="span" display="flex" flexDirection="column" sx={{ minWidth: 0 }}>
                                                <Typography variant="caption" color="text.secondary" sx={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                    {memberUser?.email}
                                                </Typography>
                                                {memberUser?.studentId && (
                                                    <Typography variant="caption" fontWeight={700}>{memberUser?.studentId}</Typography>
                                                )}
                                            </Box>
                                        }
                                        sx={{ minWidth: 0 }}
                                    />
                                    {canManage && (
                                        <IconButton
                                            edge="end"
                                            onClick={(e) => handleMenuOpen(e, memberUser?._id || member.userId?._id)}
                                            size="small"
                                            sx={{ color: "#64748B" }}
                                        >
                                            <MoreVertIcon fontSize="small" />
                                        </IconButton>
                                    )}
                                </ListItem>
                                {index < students.length - 1 && <Divider />}
                            </React.Fragment>
                        );
                    })}
                    {students.length === 0 && (
                        <ListItem sx={{ py: 4, textAlign: "center", display: "block" }}>
                            <Typography color="text.secondary">No members have joined yet.</Typography>
                        </ListItem>
                    )}
                </List>
            </Paper>
            <Menu
                anchorEl={anchorEl}
                open={Boolean(anchorEl)}
                onClose={handleMenuClose}
                PaperProps={{
                    elevation: 0,
                    sx: {
                        minWidth: 160,
                        borderRadius: "12px",
                        mt: 0.5,
                        border: "1px solid #E2E8F0",
                        "& .MuiMenuItem-root": {
                            py: 1.5,
                            px: 2,
                            typography: 'body2',
                            color: "#3c4043",
                            "&:hover": { bgcolor: "#f1f3f4" }
                        }
                    }
                }}
                transformOrigin={{ horizontal: 'right', vertical: 'top' }}
                anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
            >
                <MenuItem onClick={handleRemoveClick} sx={{ color: "#d93025 !important" }}>
                    <PersonRemoveIcon sx={{ fontSize: 18, mr: 1.5, color: "#d93025" }} />
                    Remove member
                </MenuItem>
            </Menu>

            <GenericConfirmationModal
                open={isRemoveModalOpen}
                onClose={() => {
                    setIsRemoveModalOpen(false);
                    setMemberToRemoveId(null);
                }}
                onConfirm={confirmRemoveMember}
                title="Remove Member?"
                description="Are you sure you want to remove this member from the organization? They will no longer have access to requirements and submissions."
                confirmText="Yes, Remove"
                loading={!!removingId}
            />
        </Box>
    );
};

export default MembersList;
