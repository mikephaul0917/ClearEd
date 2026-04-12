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
                return { label: "Approved", color: "#0D9488", bgcolor: "#F0FDFA" };
            case "pending":
                return { label: "Pending", color: "#D97706", bgcolor: "#FFFBEB" };
            case "rejected":
            case "resubmission_required":
                return { label: "Needs Correction", color: "#DC2626", bgcolor: "#FEF2F2" };
            case "missing":
                return { label: "Missing", color: "#DC2626", bgcolor: "#FEF2F2" };
            default:
                return { label: "Assigned", color: "#475569", bgcolor: "#F8FAFC" };
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

            <Box sx={{ display: 'flex', alignItems: 'flex-start', pt: 0.8, pr: 1 }}>
                {status !== 'not_started' && (
                    <Box sx={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        px: 1.5,
                        py: 0.5,
                        borderRadius: '999px',
                        bgcolor: statusConfig.bgcolor,
                        color: statusConfig.color,
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        letterSpacing: '0.01em',
                        border: `1px solid ${statusConfig.color}20`
                    }}>
                        {statusConfig.label}
                    </Box>
                )}
            </Box>
        </Box>
    );
};

export default TodoItem;
