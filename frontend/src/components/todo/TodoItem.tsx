import React from "react";
import Box from "@mui/material/Box";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import Avatar from "@mui/material/Avatar";
import AssignmentIcon from "@mui/icons-material/Assignment";
import BusinessIcon from "@mui/icons-material/Business";
import AccessTimeIcon from "@mui/icons-material/AccessTime";

interface TodoItemProps {
    id: string;
    title: string;
    organizationName: string;
    dueDate?: string;
    status: string;
    isOfficer?: boolean;
    onAction: (id: string) => void;
}

const TodoItem: React.FC<TodoItemProps> = ({
    id,
    title,
    organizationName,
    dueDate,
    status,
    isOfficer,
    onAction
}) => {
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
        <Paper
            elevation={0}
            sx={{
                p: { xs: 2, sm: 3 },
                mb: 2,
                borderRadius: 3,
                border: "1px solid #E2E8F0",
                display: "flex",
                flexDirection: { xs: "column", sm: "row" },
                alignItems: { xs: "flex-start", sm: "center" },
                gap: 2,
                transition: "0.2s",
                "&:hover": {
                    borderColor: "#CBD5E1",
                    boxShadow: "0 4px 12px rgba(0,0,0,0.03)"
                }
            }}
        >
            <Avatar sx={{ bgcolor: "#0F172A", width: 44, height: 44 }}>
                <AssignmentIcon />
            </Avatar>

            <Box sx={{ flex: 1, minWidth: 0 }}>
                <Typography variant="subtitle1" fontWeight={700} noWrap sx={{ mb: 0.5 }}>
                    {title}
                </Typography>
                <Box display="flex" alignItems="center" gap={1.5}>
                    <Box display="flex" alignItems="center" gap={0.5}>
                        <BusinessIcon sx={{ fontSize: 14, color: "#64748B" }} />
                        <Typography variant="caption" color="text.secondary" fontWeight={600}>
                            {organizationName}
                        </Typography>
                    </Box>
                    {dueDate && (
                        <Box display="flex" alignItems="center" gap={0.5}>
                            <AccessTimeIcon sx={{ fontSize: 14, color: "#EF4444" }} />
                            <Typography variant="caption" color="#EF4444" fontWeight={700}>
                                {dueDate}
                            </Typography>
                        </Box>
                    )}
                </Box>
            </Box>

            <Box
                sx={{
                    display: "flex",
                    alignItems: "center",
                    width: { xs: "100%", sm: "auto" },
                    justifyContent: "space-between",
                    gap: 3
                }}
            >
                <Chip
                    label={statusConfig.label}
                    size="small"
                    sx={{
                        fontWeight: 800,
                        fontSize: 10,
                        bgcolor: statusConfig.bgcolor,
                        color: `${statusConfig.color}.main`,
                        border: `1px solid transparent`,
                    }}
                />

                <Button
                    variant="contained"
                    onClick={() => onAction(id)}
                    sx={{
                        textTransform: "none",
                        borderRadius: 2,
                        bgcolor: "#0F172A",
                        fontWeight: 700,
                        px: 3,
                        "&:hover": { bgcolor: "#1E293B" }
                    }}
                >
                    {isOfficer ? "Review" : status === "approved" ? "View" : "Open"}
                </Button>
            </Box>
        </Paper>
    );
};

export default TodoItem;
