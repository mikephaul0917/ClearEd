import React, { useState, useEffect } from "react";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import Button from "@mui/material/Button";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import Box from "@mui/material/Box";
import TextField from "@mui/material/TextField";
import IconButton from "@mui/material/IconButton";
import CloseIcon from "@mui/icons-material/Close";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import ListItemText from "@mui/material/ListItemText";
import ListItemAvatar from "@mui/material/ListItemAvatar";
import Avatar from "@mui/material/Avatar";
import PersonIcon from "@mui/icons-material/Person";
import Divider from "@mui/material/Divider";
import Chip from "@mui/material/Chip";
import Alert from "@mui/material/Alert";
import CircularProgress from "@mui/material/CircularProgress";
import FileOpenIcon from "@mui/icons-material/FileOpen";
import CheckIcon from "@mui/icons-material/Check";
import ClearIcon from "@mui/icons-material/Clear";
import { api, clearanceService } from "../../services";

interface ReviewSubmissionsModalProps {
    open: boolean;
    onClose: () => void;
    requirementId: string;
    requirementTitle: string;
    onReviewComplete?: () => void;
}

const ReviewSubmissionsModal: React.FC<ReviewSubmissionsModalProps> = ({
    open,
    onClose,
    requirementId,
    requirementTitle,
    onReviewComplete
}) => {
    const [submissions, setSubmissions] = useState<any[]>([]);
    const [selectedSub, setSelectedSub] = useState<any>(null);
    const [loading, setLoading] = useState(false);
    const [actionState, setActionState] = useState<'idle' | 'loading' | 'success'>('idle');
    const [confirmRejectOpen, setConfirmRejectOpen] = useState(false);
    const [remarks, setRemarks] = useState("");
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (open && requirementId) {
            fetchSubmissions();
        }
    }, [open, requirementId]);

    const fetchSubmissions = async () => {
        setLoading(true);
        setError(null);
        try {
            const data = await clearanceService.getOfficerRequirementSubmissions(requirementId);
            setSubmissions(data.data);
            if (data.data.length > 0) {
                // DON'T auto-select, let officer choose
            }
        } catch (err: any) {
            setError(err.response?.data?.message || "Failed to fetch submissions.");
        } finally {
            setLoading(false);
        }
    };

    const handleReview = async (decision: "approved" | "rejected") => {
        if (!selectedSub) return;
        if (decision === "rejected" && !remarks.trim()) {
            setError("Remarks are required for rejection.");
            return;
        }

        setActionState('loading');
        setError(null);
        try {
            await clearanceService.reviewSubmission(selectedSub._id, decision, remarks);
            setActionState('success');

            // Brief hold on success state
            setTimeout(async () => {
                await fetchSubmissions();
                setSelectedSub(null);
                setRemarks("");
                setConfirmRejectOpen(false);
                setActionState('idle');
                onReviewComplete?.();
            }, 800);

        } catch (err: any) {
            setActionState('idle');
            setError(err.response?.data?.message || "Failed to process review.");
        }
    };

    const triggerReject = () => {
        if (!remarks.trim()) {
            setError("Remarks are required for rejection.");
            return;
        }
        setConfirmRejectOpen(true);
    };

    const downloadFile = (filename: string, originalName: string) => {
        window.open(`${api.defaults.baseURL}/clearance-items/download/${filename}`, "_blank");
    };

    return (
        <React.Fragment>
            <Dialog
                open={open}
                onClose={onClose}
                maxWidth="md"
                fullWidth
                PaperProps={{ sx: { borderRadius: 3, minHeight: "60vh" } }}
            >
                <DialogTitle sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontWeight: 800 }}>
                    Review: {requirementTitle}
                    <IconButton onClick={onClose} size="small">
                        <CloseIcon />
                    </IconButton>
                </DialogTitle>

                <DialogContent dividers sx={{ p: 0, display: "flex", height: "60vh" }}>
                    {/* Left Sidebar: Student List */}
                    <Box sx={{ width: 300, borderRight: "1px solid #E2E8F0", overflowY: "auto", bgcolor: "#F8FAFC" }}>
                        {loading ? (
                            <Box display="flex" justifyContent="center" p={4}><CircularProgress size={24} /></Box>
                        ) : submissions.length === 0 ? (
                            <Box sx={{ p: 3, textAlign: "center" }}>
                                <Typography variant="body2" color="text.secondary">No submissions yet.</Typography>
                            </Box>
                        ) : (
                            <List disablePadding>
                                {submissions.map((sub) => (
                                    <React.Fragment key={sub._id}>
                                        <ListItem
                                            button
                                            onClick={() => setSelectedSub(sub)}
                                            selected={selectedSub?._id === sub._id}
                                            sx={{
                                                py: 2,
                                                borderLeft: selectedSub?._id === sub._id ? "4px solid #0F172A" : "4px solid transparent"
                                            }}
                                        >
                                            <ListItemAvatar>
                                                <Avatar sx={{ bgcolor: sub.status === 'approved' ? "rgba(176, 224, 230, 0.4)" : "#64748B" }}>
                                                    <PersonIcon />
                                                </Avatar>
                                            </ListItemAvatar>
                                            <ListItemText
                                                primary={sub.userId?.fullName || "Student"}
                                                secondary={
                                                    <Chip
                                                        label={sub.status.toUpperCase()}
                                                        size="small"
                                                        sx={{
                                                            height: 16,
                                                            fontSize: 9,
                                                            mt: 0.5,
                                                            bgcolor: sub.status === 'approved' ? "rgba(176, 224, 230, 0.2)" : sub.status === 'pending' ? "#FFFBEB" : "#FEF2F2",
                                                            color: sub.status === 'approved' ? "#0E7490" : sub.status === 'pending' ? "#F59E0B" : "#EF4444"
                                                        }}
                                                    />
                                                }
                                                primaryTypographyProps={{ fontWeight: 700, variant: "body2" }}
                                            />
                                        </ListItem>
                                        <Divider />
                                    </React.Fragment>
                                ))}
                            </List>
                        )}
                    </Box>

                    {/* Right Panel: Submission Details */}
                    <Box sx={{ flex: 1, p: 4, overflowY: "auto" }}>
                        {selectedSub ? (
                            <Box>
                                <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={3}>
                                    <Box>
                                        <Typography variant="h6" fontWeight={800}>
                                            {selectedSub.userId?.fullName}
                                        </Typography>
                                        <Typography variant="body2" color="text.secondary">
                                            Student ID: {selectedSub.userId?.studentId || "N/A"}
                                        </Typography>
                                    </Box>
                                    <Typography variant="caption" color="text.secondary">
                                        Submitted {new Date(selectedSub.submittedAt).toLocaleString()}
                                    </Typography>
                                </Box>

                                {error && <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>{error}</Alert>}

                                <Box sx={{ mb: 4 }}>
                                    <Typography variant="subtitle2" fontWeight={700} gutterBottom>Student Notes</Typography>
                                    <Paper variant="outlined" sx={{ p: 2, bgcolor: "#F8FAFC", borderRadius: 2 }}>
                                        <Typography variant="body2">
                                            {selectedSub.studentNotes || "No notes provided."}
                                        </Typography>
                                    </Paper>
                                </Box>

                                <Box sx={{ mb: 4 }}>
                                    <Typography variant="subtitle2" fontWeight={700} gutterBottom>Attachments</Typography>
                                    <Box display="flex" flexWrap="wrap" gap={1.5}>
                                        {selectedSub.files.map((file: any, idx: number) => (
                                            <Paper
                                                key={idx}
                                                variant="outlined"
                                                sx={{
                                                    p: 1.5,
                                                    display: "flex",
                                                    alignItems: "center",
                                                    gap: 1.5,
                                                    cursor: "pointer",
                                                    borderRadius: 2,
                                                    "&:hover": { bgcolor: "#F1F5F9" }
                                                }}
                                                onClick={() => downloadFile(file.filename, file.originalName)}
                                            >
                                                <FileOpenIcon color="primary" fontSize="small" />
                                                <Typography variant="body2" fontWeight={600}>{file.originalName}</Typography>
                                            </Paper>
                                        ))}
                                    </Box>
                                </Box>

                                <Divider sx={{ my: 4 }} />

                                <Box>
                                    <Typography variant="subtitle2" fontWeight={700} gutterBottom>Review Action</Typography>
                                    <TextField
                                        fullWidth
                                        multiline
                                        rows={3}
                                        placeholder="Add remarks or feedback for the student..."
                                        value={remarks}
                                        onChange={(e) => setRemarks(e.target.value)}
                                        sx={{ mb: 3, "& .MuiOutlinedInput-root": { borderRadius: 2 } }}
                                    />

                                    <Button
                                        fullWidth
                                        startIcon={actionState !== "loading" && actionState !== "success" ? <CheckIcon /> : undefined}
                                        onClick={() => handleReview("approved")}
                                        disabled={actionState !== "idle" || selectedSub.status === 'approved'}
                                        sx={{
                                            borderRadius: "8px",
                                            textTransform: "none",
                                            py: 1.5,
                                            fontWeight: 600,
                                            fontFamily: '"Google Sans", "Product Sans", Roboto, sans-serif',
                                            display: 'flex', gap: 1, alignItems: 'center',
                                            transition: 'all 0.2s ease',
                                            backgroundColor: actionState === 'success' ? '#10b981' : '#0a0a0a',
                                            color: '#FFFFFF',
                                            '&:hover': { backgroundColor: actionState === 'success' ? '#10b981' : '#222' },
                                            '&.Mui-disabled': { backgroundColor: actionState === 'success' ? '#10b981' : '#E2E8F0', color: actionState === 'success' ? '#FFFFFF' : '#94A3B8' }
                                        }}
                                    >
                                        {actionState === 'loading' && <CircularProgress size={16} color="inherit" />}
                                        {actionState === 'success' && <CheckIcon fontSize="small" />}
                                        {actionState === 'idle' ? "Approve Submission" : actionState === 'loading' ? 'Approving...' : 'Approved!'}
                                    </Button>
                                    <Button
                                        fullWidth
                                        startIcon={actionState !== "loading" && actionState !== "success" ? <ClearIcon /> : undefined}
                                        onClick={triggerReject}
                                        disabled={actionState !== "idle" || selectedSub.status === 'approved' || !remarks.trim()}
                                        sx={{
                                            borderRadius: "8px",
                                            textTransform: "none",
                                            py: 1.5,
                                            fontWeight: 600,
                                            fontFamily: '"Google Sans", "Product Sans", Roboto, sans-serif',
                                            display: 'flex', gap: 1, alignItems: 'center',
                                            border: '1.5px solid #EF4444',
                                            color: '#EF4444',
                                            backgroundColor: 'transparent',
                                            transition: 'all 0.2s ease',
                                            '&:hover': { backgroundColor: '#FEF2F2', borderColor: '#DC2626' },
                                            '&.Mui-disabled': { borderColor: actionState === 'success' ? '#EF4444' : '#E2E8F0', color: actionState === 'success' ? '#EF4444' : '#94A3B8' }
                                        }}
                                    >
                                        Reject / Needs Work
                                    </Button>
                                </Box>
                                {selectedSub.status === 'approved' && (
                                    <Typography variant="caption" color="success.main" display="block" sx={{ mt: 1, textAlign: "center", fontWeight: 700 }}>
                                        This submission has already been approved.
                                    </Typography>
                                )}
                            </Box>
                        ) : (
                            <Box display="flex" flexDirection="column" alignItems="center" justifyContent="center" sx={{ height: "100%", opacity: 0.5 }}>
                                <PersonIcon sx={{ fontSize: 64, mb: 1 }} />
                                <Typography>Select a student submission to review</Typography>
                            </Box>
                        )}
                    </Box>
                </DialogContent>
            </Dialog>

            {/* Reject Confirmation Dialog */}
            <Dialog
                open={confirmRejectOpen}
                onClose={() => setConfirmRejectOpen(false)}
                PaperProps={{
                    sx: { borderRadius: 3, p: 1 }
                }}
            >
                <DialogTitle sx={{ fontWeight: 800 }}>Confirm Rejection</DialogTitle>
                <DialogContent>
                    <Typography variant="body2" color="text.secondary" mb={2}>
                        Are you sure you want to reject this submission? The student will be notified and asked to resubmit.
                    </Typography>
                    <Paper variant="outlined" sx={{ p: 2, bgcolor: "#FEF2F2", borderColor: "#FCA5A5", borderRadius: 2 }}>
                        <Typography variant="caption" fontWeight={700} color="error" display="block" gutterBottom>Remarks to send:</Typography>
                        <Typography variant="body2" color="#7F1D1D">{remarks}</Typography>
                    </Paper>
                </DialogContent>
                <DialogActions sx={{ px: 3, pb: 3 }}>
                    <Button
                        onClick={() => setConfirmRejectOpen(false)}
                        disabled={actionState !== "idle"}
                        sx={{
                            fontFamily: '"Google Sans", "Product Sans", Roboto, sans-serif',
                            fontWeight: 600, textTransform: "none", borderRadius: "999px", color: "#64748B"
                        }}
                    >
                        Cancel
                    </Button>
                    <Button
                        onClick={() => handleReview("rejected")}
                        disabled={actionState !== "idle"}
                        sx={{
                            fontFamily: '"Google Sans", "Product Sans", Roboto, sans-serif',
                            fontWeight: 600, textTransform: "none", borderRadius: "999px", px: 3,
                            display: 'flex', gap: 1, alignItems: 'center', transition: 'all 0.2s ease',
                            ...(actionState === 'success' ? {
                                backgroundColor: '#EF4444', color: '#FFFFFF', border: '1.5px solid #EF4444'
                            } : {
                                border: '1.5px solid #EF4444', color: '#EF4444', backgroundColor: 'transparent',
                                '&:hover': { backgroundColor: '#FEF2F2', borderColor: '#DC2626' }
                            }),
                            '&.Mui-disabled': {
                                borderColor: actionState === 'success' ? '#EF4444' : '#E2E8F0',
                                color: actionState === 'success' ? '#FFFFFF' : '#94A3B8',
                                backgroundColor: actionState === 'success' ? '#EF4444' : 'transparent',
                            }
                        }}
                    >
                        {actionState === 'loading' && <CircularProgress size={16} color="inherit" />}
                        {actionState === 'success' && <CheckIcon fontSize="small" />}
                        {actionState === 'idle' ? "Confirm Reject" : actionState === 'loading' ? 'Rejecting...' : 'Rejected'}
                    </Button>
                </DialogActions>
            </Dialog>
        </React.Fragment>
    );
};

export default ReviewSubmissionsModal;
