import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
    Box, Typography, Avatar, Divider, Tabs, Tab, Container,
    CircularProgress, IconButton, TextField, Button, Paper,
    List, ListItem, ListItemAvatar, ListItemText, Chip, Alert
} from "@mui/material";
import AssignmentIcon from "@mui/icons-material/Assignment";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import SendIcon from "@mui/icons-material/Send";
import PersonIcon from "@mui/icons-material/Person";
import CheckIcon from "@mui/icons-material/Check";
import ClearIcon from "@mui/icons-material/Clear";
import FileOpenIcon from "@mui/icons-material/FileOpen";
import RoleLayout from "../../components/layout/RoleLayout";
import { useAuth } from "../../hooks/useAuth";
import { api, clearanceService, organizationService } from "../../services";

export default function RequirementDetailsPage() {
    const { orgId, reqId } = useParams<{ orgId: string; reqId: string }>();
    const navigate = useNavigate();
    const { user } = useAuth();

    const [loading, setLoading] = useState(true);
    const [tabValue, setTabValue] = useState(0);
    const [requirement, setRequirement] = useState<any>(null);
    const [membership, setMembership] = useState<any>(null);
    
    // Comments state
    const [comments, setComments] = useState<any[]>([]);
    const [newComment, setNewComment] = useState("");
    const [isSubmittingComment, setIsSubmittingComment] = useState(false);

    // Submissions state (Officer only)
    const [submissions, setSubmissions] = useState<any[]>([]);
    const [selectedSub, setSelectedSub] = useState<any>(null);
    const [loadingSubmissions, setLoadingSubmissions] = useState(false);
    const [subRemarks, setSubRemarks] = useState("");
    const [subActionState, setSubActionState] = useState<'idle' | 'loading' | 'success'>('idle');
    const [subError, setSubError] = useState<string | null>(null);

    const isOfficer = membership?.role === 'officer' || user?.role === 'admin' || user?.role === 'super_admin';

    useEffect(() => {
        if (!orgId || !reqId) return;
        fetchData();
        fetchComments();
    }, [orgId, reqId]);

    const fetchData = async () => {
        setLoading(true);
        try {
            // Check membership
            const data = await organizationService.getOrganization(orgId as string);
            setMembership(data.membership);
            const isUserOfficer = data.membership?.role === 'officer' || user?.role === 'admin' || user?.role === 'super_admin';

            // Get requirement
            const reqData = await clearanceService.getRequirementById(reqId as string);
            setRequirement(reqData.data);

            if (isUserOfficer) {
                fetchOfficerSubmissions();
            }
        } catch (error) {
            console.error("Failed to fetch requirement details:", error);
        } finally {
            setLoading(false);
        }
    };

    const fetchComments = async () => {
        try {
            const data = await clearanceService.getComments(reqId as string);
            setComments(data);
        } catch (error) {
            console.error("Failed to fetch comments", error);
        }
    };

    const fetchOfficerSubmissions = async () => {
        setLoadingSubmissions(true);
        try {
            const data = await clearanceService.getOfficerRequirementSubmissions(reqId as string);
            setSubmissions(data.data);
        } catch (err) {
            console.error("Failed to fetch submissions", err);
        } finally {
            setLoadingSubmissions(false);
        }
    };

    const handleAddComment = async () => {
        if (!newComment.trim()) return;
        setIsSubmittingComment(true);
        try {
            const added = await clearanceService.createComment(reqId as string, newComment);
            setComments(prev => [...prev, added.comment]);
            setNewComment("");
        } catch (error) {
            console.error("Failed to add comment", error);
        } finally {
            setIsSubmittingComment(false);
        }
    };

    const handleReview = async (decision: "approved" | "rejected") => {
        if (!selectedSub) return;
        if (decision === "rejected" && !subRemarks.trim()) {
            setSubError("Remarks are required for rejection.");
            return;
        }

        setSubActionState('loading');
        setSubError(null);
        try {
            await clearanceService.reviewSubmission(selectedSub._id, decision, subRemarks);
            setSubActionState('success');

            setTimeout(async () => {
                await fetchOfficerSubmissions();
                setSelectedSub(null);
                setSubRemarks("");
                setSubActionState('idle');
            }, 800);
        } catch (err: any) {
            setSubActionState('idle');
            setSubError(err.response?.data?.message || "Failed to process review.");
        }
    };

    const downloadFile = (filename: string, originalName: string) => {
        window.open(`${api.defaults.baseURL}/clearance-items/download/${filename}`, "_blank");
    };

    if (loading) {
        return (
            <RoleLayout>
                <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
                    <CircularProgress />
                </Box>
            </RoleLayout>
        );
    }

    if (!requirement) {
        return (
            <RoleLayout>
                <Container maxWidth="md" sx={{ mt: 8, textAlign: "center" }}>
                    <Typography variant="h5" color="text.secondary">Requirement not found.</Typography>
                    <Button onClick={() => navigate(`/organization/${orgId}`)} sx={{ mt: 2 }}>Back to Stream</Button>
                </Container>
            </RoleLayout>
        );
    }

    return (
        <RoleLayout>
            <Container maxWidth="lg" sx={{ px: { xs: 0, md: 3 } }}>
                <Box sx={{ borderBottom: 1, borderColor: "divider" }}>
                    <Tabs
                        value={tabValue}
                        onChange={(_, v) => setTabValue(v)}
                        textColor="inherit"
                        TabIndicatorProps={{ sx: { bgcolor: "#1a73e8", height: 3 } }}
                        sx={{
                            px: { xs: 2, md: 0 },
                            "& .MuiTab-root": {
                                textTransform: "none",
                                fontWeight: 600,
                                fontSize: "0.875rem",
                                minWidth: 100,
                                color: "#5f6368"
                            },
                            "& .Mui-selected": {
                                color: "#1a73e8 !important"
                            }
                        }}
                    >
                        <Tab label="Instructions" />
                        {isOfficer && <Tab label="Student work" />}
                    </Tabs>
                </Box>

                <Box sx={{ py: 4, px: { xs: 2, md: 0 } }}>
                    {tabValue === 0 && (
                        <Container maxWidth="md" sx={{ px: 0 }}>
                            <Box sx={{ display: "flex", gap: 3, mb: 3 }}>
                                <Avatar sx={{ bgcolor: "#1a73e8", width: 44, height: 44, mt: 0.5 }}>
                                    <AssignmentIcon />
                                </Avatar>
                                <Box sx={{ flex: 1 }}>
                                    <Box display="flex" justifyContent="space-between" alignItems="flex-start">
                                        <Typography variant="h4" sx={{ fontWeight: 400, color: "#1a73e8", mb: 1, fontSize: "1.75rem", letterSpacing: 0 }}>
                                            {requirement.title}
                                        </Typography>
                                        <IconButton size="small" sx={{ color: "#5f6368" }}>
                                            <MoreVertIcon />
                                        </IconButton>
                                    </Box>
                                    
                                    <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1.5 }}>
                                        <Typography variant="body2" sx={{ color: "#5f6368", fontWeight: 500, fontSize: "0.875rem" }}>
                                            {requirement.createdBy?.fullName || "Author"}
                                        </Typography>
                                        <Typography variant="body2" sx={{ color: "#5f6368", fontSize: "0.875rem" }}>•</Typography>
                                        <Typography variant="body2" sx={{ color: "#5f6368", fontSize: "0.875rem" }}>
                                            {requirement.createdAt ? new Date(requirement.createdAt).toLocaleDateString([], { day: 'numeric', month: 'short' }) : "Date"}
                                        </Typography>
                                    </Box>

                                    <Typography variant="body2" sx={{ color: "#3c4043", fontWeight: 500, fontSize: "0.875rem" }}>
                                        {requirement.points ? (requirement.points === 'Ungraded' ? 'Ungraded' : `${requirement.points} points`) : "100 points"}
                                    </Typography>
                                </Box>
                            </Box>

                            <Divider sx={{ mb: 4, borderColor: "#dadce0" }} />

                            <Typography
                                variant="body1"
                                sx={{
                                    whiteSpace: "pre-wrap",
                                    fontFamily: "'Roboto', 'Inter', sans-serif",
                                    color: "#3c4043",
                                    lineHeight: 1.6,
                                    mb: 4,
                                    ml: { xs: 0, sm: 8.5 }
                                }}
                                dangerouslySetInnerHTML={{ __html: requirement.description }}
                            />

                            {requirement.instructions && (
                                <Box sx={{ ml: { xs: 0, sm: 8.5 }, mb: 4 }}>
                                    <Typography
                                        variant="body1"
                                        color="#3c4043"
                                        sx={{ whiteSpace: "pre-wrap", fontFamily: "'Roboto', 'Inter', sans-serif", lineHeight: 1.6 }}
                                        dangerouslySetInnerHTML={{ __html: requirement.instructions }}
                                    />
                                </Box>
                            )}

                            <Divider sx={{ mb: 4, borderColor: "#dadce0" }} />

                            {/* Comments Section */}
                            <Box sx={{ ml: { xs: 0, sm: 8.5 } }}>
                                <Box display="flex" alignItems="center" gap={1} mb={3}>
                                    <PersonIcon sx={{ color: "#5f6368", fontSize: 20 }} />
                                    <Typography sx={{ color: "#3c4043", fontWeight: 500, fontSize: "0.875rem" }}>
                                        Class comments
                                    </Typography>
                                </Box>

                                <Box sx={{ display: "flex", flexDirection: "column", gap: 3, mb: 4 }}>
                                    {comments.map((comment: any) => (
                                        <Box key={comment._id} sx={{ display: "flex", gap: 2 }}>
                                            <Avatar src={comment.userId?.profilePicture} sx={{ width: 32, height: 32, bgcolor: "#1a73e8", fontSize: "1rem" }}>
                                                {comment.userId?.fullName?.charAt(0) || "U"}
                                            </Avatar>
                                            <Box>
                                                <Box display="flex" alignItems="center" gap={1}>
                                                    <Typography variant="subtitle2" sx={{ fontWeight: 500, color: "#3c4043", fontSize: "0.875rem" }}>
                                                        {comment.userId?.fullName}
                                                    </Typography>
                                                    <Typography variant="caption" sx={{ color: "#5f6368" }}>
                                                        {new Date(comment.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                    </Typography>
                                                </Box>
                                                <Typography variant="body2" sx={{ color: "#3c4043", mt: 0.5 }}>
                                                    {comment.content}
                                                </Typography>
                                            </Box>
                                        </Box>
                                    ))}
                                </Box>

                                <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                                    <Avatar src={(user as any)?.profilePicture} sx={{ width: 32, height: 32, bgcolor: "#9c27b0", fontSize: "1rem" }}>
                                        {(user as any)?.firstName?.charAt(0) || (user as any)?.fullName?.charAt(0) || user?.username?.charAt(0) || "U"}
                                    </Avatar>
                                    <Box sx={{ flex: 1, position: "relative" }}>
                                        <TextField
                                            fullWidth
                                            placeholder="Add class comment..."
                                            variant="outlined"
                                            size="small"
                                            value={newComment}
                                            onChange={(e) => setNewComment(e.target.value)}
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter' && !e.shiftKey) {
                                                    e.preventDefault();
                                                    handleAddComment();
                                                }
                                            }}
                                            sx={{
                                                "& .MuiOutlinedInput-root": {
                                                    borderRadius: "24px",
                                                    bgcolor: "#fff",
                                                    borderColor: "#dadce0",
                                                    "& fieldset": { borderColor: "#dadce0" },
                                                    "&:hover fieldset": { borderColor: "#cce0ff" },
                                                    "&.Mui-focused fieldset": { borderColor: "#1a73e8" },
                                                    pr: 5
                                                }
                                            }}
                                        />
                                        <IconButton 
                                            size="small" 
                                            onClick={handleAddComment}
                                            disabled={!newComment.trim() || isSubmittingComment}
                                            sx={{ 
                                                position: "absolute", 
                                                right: 4, 
                                                top: '50%',
                                                transform: 'translateY(-50%)',
                                                color: newComment.trim() ? "#1a73e8" : "#ccc"
                                            }}
                                        >
                                            {isSubmittingComment ? <CircularProgress size={20} /> : <SendIcon fontSize="small" />}
                                        </IconButton>
                                    </Box>
                                </Box>
                            </Box>
                        </Container>
                    )}

                    {isOfficer && tabValue === 1 && (
                        <Box sx={{ display: "flex", height: "calc(100vh - 200px)", border: "1px solid #E2E8F0", borderRadius: 3, overflow: "hidden" }}>
                            {/* Left Sidebar: Student List */}
                            <Box sx={{ width: 300, borderRight: "1px solid #E2E8F0", overflowY: "auto", bgcolor: "#F8FAFC" }}>
                                {loadingSubmissions ? (
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
                                                        borderLeft: selectedSub?._id === sub._id ? "4px solid #1a73e8" : "4px solid transparent"
                                                    }}
                                                >
                                                    <ListItemAvatar>
                                                        <Avatar sx={{ bgcolor: sub.status === 'approved' ? "#10B981" : "#64748B" }}>
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
                                                                    bgcolor: sub.status === 'approved' ? "#ECFDF5" : sub.status === 'pending' ? "#FFFBEB" : "#FEF2F2",
                                                                    color: sub.status === 'approved' ? "#10B981" : sub.status === 'pending' ? "#F59E0B" : "#EF4444"
                                                                }}
                                                            />
                                                        }
                                                        primaryTypographyProps={{ fontWeight: 600, variant: "body2", color: '#3c4043' }}
                                                    />
                                                </ListItem>
                                                <Divider />
                                            </React.Fragment>
                                        ))}
                                    </List>
                                )}
                            </Box>

                            {/* Right Panel: Submission Details */}
                            <Box sx={{ flex: 1, p: 4, overflowY: "auto", bgcolor: "#fff" }}>
                                {selectedSub ? (
                                    <Box>
                                        <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={3}>
                                            <Box>
                                                <Typography variant="h6" fontWeight={700} color="#3c4043">
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

                                        {subError && <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>{subError}</Alert>}

                                        <Box sx={{ mb: 4 }}>
                                            <Typography variant="subtitle2" fontWeight={600} gutterBottom color="#3c4043">Student Notes</Typography>
                                            <Paper variant="outlined" sx={{ p: 2, bgcolor: "#F8FAFC", borderRadius: 2 }}>
                                                <Typography variant="body2" color="#3c4043">
                                                    {selectedSub.studentNotes || "No notes provided."}
                                                </Typography>
                                            </Paper>
                                        </Box>

                                        <Box sx={{ mb: 4 }}>
                                            <Typography variant="subtitle2" fontWeight={600} gutterBottom color="#3c4043">Attachments</Typography>
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
                                                        <Typography variant="body2" fontWeight={500} color="#3c4043">{file.originalName}</Typography>
                                                    </Paper>
                                                ))}
                                            </Box>
                                        </Box>

                                        <Divider sx={{ my: 4 }} />

                                        <Box>
                                            <Typography variant="subtitle2" fontWeight={600} gutterBottom color="#3c4043">Review Action</Typography>
                                            <TextField
                                                fullWidth
                                                multiline
                                                rows={3}
                                                placeholder="Add remarks or feedback for the student..."
                                                value={subRemarks}
                                                onChange={(e) => setSubRemarks(e.target.value)}
                                                sx={{ mb: 3, "& .MuiOutlinedInput-root": { borderRadius: 2 } }}
                                            />

                                            <Box display="flex" gap={2}>
                                                <Button
                                                    fullWidth
                                                    startIcon={subActionState !== "loading" && subActionState !== "success" ? <CheckIcon /> : undefined}
                                                    onClick={() => handleReview("approved")}
                                                    disabled={subActionState !== "idle" || selectedSub.status === 'approved'}
                                                    sx={{
                                                        borderRadius: "8px",
                                                        textTransform: "none",
                                                        py: 1,
                                                        fontWeight: 600,
                                                        backgroundColor: subActionState === 'success' ? '#10b981' : '#1a73e8',
                                                        color: '#FFFFFF',
                                                        '&:hover': { backgroundColor: subActionState === 'success' ? '#10b981' : '#1557b0' },
                                                        '&.Mui-disabled': { backgroundColor: subActionState === 'success' ? '#10b981' : '#E2E8F0', color: subActionState === 'success' ? '#FFFFFF' : '#94A3B8' }
                                                    }}
                                                >
                                                    {subActionState === 'loading' && <CircularProgress size={16} color="inherit" sx={{ mr: 1 }}/>}
                                                    {subActionState === 'idle' ? "Approve" : subActionState === 'loading' ? 'Approving...' : 'Approved!'}
                                                </Button>
                                                <Button
                                                    fullWidth
                                                    startIcon={subActionState !== "loading" && subActionState !== "success" ? <ClearIcon /> : undefined}
                                                    onClick={() => handleReview("rejected")}
                                                    disabled={subActionState !== "idle" || selectedSub.status === 'approved' || !subRemarks.trim()}
                                                    sx={{
                                                        borderRadius: "8px",
                                                        textTransform: "none",
                                                        py: 1,
                                                        fontWeight: 600,
                                                        border: '1.5px solid #EF4444',
                                                        color: '#EF4444',
                                                        backgroundColor: 'transparent',
                                                        '&:hover': { backgroundColor: '#FEF2F2', borderColor: '#DC2626' },
                                                        '&.Mui-disabled': { borderColor: subActionState === 'success' ? '#EF4444' : '#E2E8F0', color: subActionState === 'success' ? '#EF4444' : '#94A3B8' }
                                                    }}
                                                >
                                                    Reject
                                                </Button>
                                            </Box>
                                        </Box>
                                        {selectedSub.status === 'approved' && (
                                            <Typography variant="caption" color="success.main" display="block" sx={{ mt: 2, textAlign: "center", fontWeight: 600 }}>
                                                This submission has been approved.
                                            </Typography>
                                        )}
                                    </Box>
                                ) : (
                                    <Box display="flex" flexDirection="column" alignItems="center" justifyContent="center" sx={{ height: "100%", opacity: 0.5 }}>
                                        <PersonIcon sx={{ fontSize: 64, mb: 1, color: "#94A3B8" }} />
                                        <Typography color="#64748B">Select a student submission to review</Typography>
                                    </Box>
                                )}
                            </Box>
                        </Box>
                    )}
                </Box>
            </Container>
        </RoleLayout>
    );
}
