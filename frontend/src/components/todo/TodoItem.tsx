import React from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Chip from "@mui/material/Chip";
import Avatar from "@mui/material/Avatar";
import AssignmentIcon from "@mui/icons-material/Assignment";
import { useNavigate } from "react-router-dom";

interface TodoItemProps {
    reqId: string;
    orgId: string;
    title: string;
    organizationName: string;
    dueDate?: string;
    status: string;
    isOfficer?: boolean;
}

const TodoItem: React.FC<TodoItemProps> = ({
    reqId,
    orgId,
    title,
    organizationName,
    dueDate,
    status,
    isOfficer,
}) => {
    const nav = useNavigate();

    const getStatusConfig = () => {
        switch (status) {
            case "approved":
                return { label: "Approved", color: "success", bgcolor: "#ECFDF5" };
            case "pending":
                return { label: "Pending", color: "warning", bgcolor: "#FFFBEB" };
            case "rejected":
            case "resubmission_required":
                return { label: "Needs Correction", color: "error", bgcolor: "#FEF2F2" };
            case "missing":
                return { label: "Missing", color: "error", bgcolor: "#FEF2F2" };
            default:
                return { label: "Assigned", color: "default", bgcolor: "#F8FAFC" };
        }
    };

    const statusConfig = getStatusConfig();

    return (
        <Box
            onClick={() => nav(`/organization/${orgId}/requirement/${reqId}`)}
            sx={{
                display: 'flex',
                alignItems: 'flex-start',
                py: 2,
                borderBottom: '1px solid #f1f3f4',
                '&:hover': { bgcolor: '#f8f9fa' },
                cursor: 'pointer',
                px: 1,
                borderRadius: 1
            }}
        >
            <Avatar sx={{ bgcolor: '#f1f3f4', width: 40, height: 40, mr: 2 }}>
                <AssignmentIcon sx={{ color: '#5f6368', fontSize: 24 }} />
            </Avatar>

            <Box sx={{ flex: 1, minWidth: 0, pt: 0.5 }}>
                <Typography sx={{ color: '#3c4043', fontWeight: 500, fontSize: '0.875rem', mb: 0.5, textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                    {title}
                </Typography>
                <Typography sx={{ color: '#5f6368', fontSize: '0.75rem' }}>
                    {organizationName} {dueDate ? `• Due ${dueDate}` : ''}
                </Typography>
            </Box>

            <Box sx={{ display: 'flex', alignItems: 'flex-start', pt: 0.5, pr: 1 }}>
                {status !== 'not_started' && (
                    <Chip
                        label={statusConfig.label}
                        size="small"
                        sx={{
                            fontWeight: 600,
                            fontSize: '0.75rem',
                            bgcolor: statusConfig.bgcolor,
                            color: `${statusConfig.color}.main`,
                            border: `1px solid transparent`,
                        }}
                    />
                )}
            </Box>
        </Box>
    );
};

export default TodoItem;
