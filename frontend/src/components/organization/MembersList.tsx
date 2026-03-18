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
import PersonRemoveIcon from "@mui/icons-material/PersonRemove";
import Divider from "@mui/material/Divider";
import Tooltip from "@mui/material/Tooltip";
import { organizationService } from "../../services";

interface MembersListProps {
    organizationId: string;
    isOfficer: boolean;
    isAdmin: boolean;
}

const MembersList: React.FC<MembersListProps> = ({ organizationId, isOfficer, isAdmin }) => {
    const [members, setMembers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [removingId, setRemovingId] = useState<string | null>(null);

    const fetchMembers = async () => {
        try {
            setLoading(true);
            const data = await organizationService.getMembers(organizationId);
            setMembers(data.data);
        } catch (error) {
            console.error("Failed to fetch members:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchMembers();
    }, [organizationId]);

    const handleRemoveMember = async (userId: string) => {
        if (!window.confirm("Are you sure you want to remove this member?")) return;

        try {
            setRemovingId(userId);
            await organizationService.removeMember(organizationId, userId);
            setMembers(prev => prev.filter(m => m.userId._id !== userId));
        } catch (error) {
            console.error("Failed to remove member:", error);
            alert("Failed to remove member. You might not have permission.");
        } finally {
            setRemovingId(null);
        }
    };

    if (loading) {
        return (
            <Box display="flex" justifyContent="center" py={4}>
                <CircularProgress size={32} />
            </Box>
        );
    }

    const officers = members.filter(m => m.role === 'officer');
    const students = members.filter(m => m.role === 'member');

    const canManage = isOfficer || isAdmin;

    return (
        <Box>
            {/* Officers Section */}
            <Typography variant="h6" fontWeight={700} sx={{ mb: 2, color: "#0F172A" }}>
                Officers
            </Typography>
            <Paper elevation={0} sx={{ borderRadius: 3, border: "1px solid #E2E8F0", overflow: "hidden", mb: 4 }}>
                <List disablePadding>
                    {officers.map((member, index) => (
                        <React.Fragment key={member._id}>
                            <ListItem sx={{ py: 2 }}>
                                <ListItemAvatar>
                                    <Avatar sx={{ bgcolor: "#F1F5F9", color: "#0F172A" }}>
                                        {member.userId.fullName.charAt(0)}
                                    </Avatar>
                                </ListItemAvatar>
                                <ListItemText
                                    primary={
                                        <Typography fontWeight={600}>
                                            {member.userId.fullName}
                                            {member.userId.role === 'officer' && (
                                                <Chip label="Officer" size="small" sx={{ ml: 1, height: 20, fontSize: "0.7rem", bgcolor: "#E0F2FE", color: "#0369A1" }} />
                                            )}
                                        </Typography>
                                    }
                                    secondary={member.userId.email}
                                />
                                {canManage && member.userId.role !== 'admin' && member.userId.role !== 'super_admin' && (
                                    <Tooltip title="Remove Member">
                                        <IconButton
                                            edge="end"
                                            onClick={() => handleRemoveMember(member.userId._id)}
                                            disabled={removingId === member.userId._id}
                                            color="error"
                                        >
                                            <PersonRemoveIcon />
                                        </IconButton>
                                    </Tooltip>
                                )}
                            </ListItem>
                            {index < officers.length - 1 && <Divider />}
                        </React.Fragment>
                    ))}
                    {officers.length === 0 && (
                        <ListItem>
                            <Typography color="text.secondary">No officers found.</Typography>
                        </ListItem>
                    )}
                </List>
            </Paper>

            {/* Students Section */}
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                <Typography variant="h6" fontWeight={700} sx={{ color: "#0F172A" }}>
                    Students
                </Typography>
                <Typography variant="body2" color="text.secondary">
                    {students.length} members
                </Typography>
            </Box>
            <Paper elevation={0} sx={{ borderRadius: 3, border: "1px solid #E2E8F0", overflow: "hidden" }}>
                <List disablePadding>
                    {students.map((member, index) => (
                        <React.Fragment key={member._id}>
                            <ListItem sx={{ py: 2 }}>
                                <ListItemAvatar>
                                    <Avatar sx={{ bgcolor: "#F8FAFC", color: "#64748B" }}>
                                        {member.userId.studentId?.charAt(0) || member.userId.fullName.charAt(0)}
                                    </Avatar>
                                </ListItemAvatar>
                                <ListItemText
                                    primary={<Typography fontWeight={600}>{member.userId.fullName}</Typography>}
                                    secondary={
                                        <Box component="span" display="flex" flexDirection="column">
                                            <Typography variant="caption" color="text.secondary">{member.userId.email}</Typography>
                                            {member.userId.studentId && (
                                                <Typography variant="caption" fontWeight={700}>{member.userId.studentId}</Typography>
                                            )}
                                        </Box>
                                    }
                                />
                                {canManage && (
                                    <Tooltip title="Remove Member">
                                        <IconButton
                                            edge="end"
                                            onClick={() => handleRemoveMember(member.userId._id)}
                                            disabled={removingId === member.userId._id}
                                            color="error"
                                            size="small"
                                        >
                                            <PersonRemoveIcon />
                                        </IconButton>
                                    </Tooltip>
                                )}
                            </ListItem>
                            {index < students.length - 1 && <Divider />}
                        </React.Fragment>
                    ))}
                    {students.length === 0 && (
                        <ListItem sx={{ py: 4, textAlign: "center", display: "block" }}>
                            <Typography color="text.secondary">No members have joined yet.</Typography>
                        </ListItem>
                    )}
                </List>
            </Paper>
        </Box>
    );
};

export default MembersList;
