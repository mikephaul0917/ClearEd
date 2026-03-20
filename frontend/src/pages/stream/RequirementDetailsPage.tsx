import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
    Box, Typography, Avatar, Divider, Tabs, Tab, Container,
    CircularProgress, IconButton, TextField, Button, Paper,
    List, ListItem, ListItemAvatar, ListItemText, Chip, Alert,
    InputBase, ClickAwayListener, RadioGroup, Radio, FormControlLabel
} from "@mui/material";
import AssignmentIcon from "@mui/icons-material/Assignment";
import LiveHelpIcon from "@mui/icons-material/LiveHelp";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import SendIcon from "@mui/icons-material/Send";
import SendOutlinedIcon from "@mui/icons-material/SendOutlined";
import FormatBoldIcon from "@mui/icons-material/FormatBold";
import FormatItalicIcon from "@mui/icons-material/FormatItalic";
import FormatUnderlinedIcon from "@mui/icons-material/FormatUnderlined";
import FormatListBulletedIcon from "@mui/icons-material/FormatListBulleted";
import FormatClearIcon from "@mui/icons-material/FormatClear";
import PersonIcon from "@mui/icons-material/Person";
import CheckIcon from "@mui/icons-material/Check";
import ClearIcon from "@mui/icons-material/Clear";
import FileOpenIcon from "@mui/icons-material/FileOpen";
import Checkbox from "@mui/material/Checkbox";
import Select from "@mui/material/Select";
import MenuItem from "@mui/material/MenuItem";
import Switch from "@mui/material/Switch";
import ArrowDropDownIcon from "@mui/icons-material/ArrowDropDown";
import GroupIcon from "@mui/icons-material/GroupOutlined";
import LinkIcon from "@mui/icons-material/Link";
import AttachmentIcon from "@mui/icons-material/Attachment";
import Menu from "@mui/material/Menu";
import Snackbar from "@mui/material/Snackbar";
import CloseIcon from "@mui/icons-material/Close";

import RoleLayout from "../../components/layout/RoleLayout";
import CreateRequirementModal from "../../components/stream/CreateRequirementModal";
import CreateFormModal from "../../components/stream/CreateFormModal";
import CreatePollModal from "../../components/stream/CreatePollModal";
import CreateMaterialModal from "../../components/stream/CreateMaterialModal";
import { useAuth } from "../../hooks/useAuth";
import { api, clearanceService, organizationService } from "../../services";

const getFileLabel = (file: any) => {
    if (file.type === 'Drive') return 'Google Drive';
    if (file.type === 'YouTube') return 'YouTube video';
    if (file.type === 'Link') return 'Link';
    
    const name = (file.name || '').toLowerCase();
    if (name.endsWith('.pdf')) return 'PDF';
    if (name.endsWith('.doc') || name.endsWith('.docx')) return 'Microsoft Word';
    if (name.endsWith('.xls') || name.endsWith('.xlsx')) return 'Microsoft Excel';
    if (name.endsWith('.ppt') || name.endsWith('.pptx')) return 'Microsoft PowerPoint';
    if (name.match(/\.(jpg|jpeg|png|gif|webp|svg)$/)) return 'Image';
    if (name.match(/\.(mp4|webm|avi|mov)$/)) return 'Video';
    if (name.endsWith('.zip') || name.endsWith('.rar')) return 'Archive';
    
    return 'File';
};

const getAbsoluteUrl = (url: string) => {
    if (!url) return '';
    const normalizedUrl = url.replace(/\\/g, '/');
    if (normalizedUrl.startsWith('http://') || normalizedUrl.startsWith('https://')) return normalizedUrl;
    // @ts-ignore
    let baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
    baseUrl = baseUrl.replace(/\/api$/, '');
    return `${baseUrl}${normalizedUrl.startsWith('/') ? '' : '/'}${normalizedUrl}`;
};

const RequirementDetailsPage: React.FC = () => {
    const { orgId, reqId } = useParams<{ orgId: string; reqId: string }>();
    const navigate = useNavigate();
    const { user } = useAuth();

    const [loading, setLoading] = useState(true);
    const [tabValue, setTabValue] = useState(0);
    const [requirement, setRequirement] = useState<any>(null);
    const [membership, setMembership] = useState<any>(null);
    const [organization, setOrganization] = useState<any>(null);
    const [students, setStudents] = useState<any[]>([]);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isEditFormModalOpen, setIsEditFormModalOpen] = useState(false);
    const [isEditPollModalOpen, setIsEditPollModalOpen] = useState(false);
    const [isEditMaterialModalOpen, setIsEditMaterialModalOpen] = useState(false);

    // Comments state
    const [comments, setComments] = useState<any[]>([]);
    const [newComment, setNewComment] = useState("");
    const [isSubmittingComment, setIsSubmittingComment] = useState(false);
    const [isCommentFocused, setIsCommentFocused] = useState(false);

    // Menu state
    const [menuAnchorEl, setMenuAnchorEl] = useState<null | HTMLElement>(null);
    const [snackbarOpen, setSnackbarOpen] = useState(false);

    const handleMenuClick = (event: React.MouseEvent<HTMLButtonElement>) => {
        setMenuAnchorEl(event.currentTarget);
    };
    const handleMenuClose = () => {
        setMenuAnchorEl(null);
    };
    const handleCopyLink = () => {
        navigator.clipboard.writeText(window.location.href);
        setSnackbarOpen(true);
        handleMenuClose();
    };

    const handleEditClick = () => {
        handleMenuClose();
        if (requirement?.type === 'form') {
            setIsEditFormModalOpen(true);
        } else if (requirement?.type === 'poll') {
            setIsEditPollModalOpen(true);
        } else if (requirement?.type === 'material') {
            setIsEditMaterialModalOpen(true);
        } else {
            setIsEditModalOpen(true);
        }
    };

    const handleDeleteClick = async () => {
        handleMenuClose();
        if (!window.confirm("Are you sure you want to delete this?")) return;
        try {
            await clearanceService.deleteRequirement(reqId as string);
            navigate(`/organization/${orgId}`);
        } catch (error) {
            console.error("Failed to delete item:", error);
            alert("Failed to delete item");
        }
    };

    // Submissions state (Officer only)
    const [submissions, setSubmissions] = useState<any[]>([]);
    const [selectedSub, setSelectedSub] = useState<any>(null);
    const [loadingSubmissions, setLoadingSubmissions] = useState(false);
    const [subRemarks, setSubRemarks] = useState("");
    const [subActionState, setSubActionState] = useState<'idle' | 'loading' | 'success'>('idle');
    const [subError, setSubError] = useState<string | null>(null);

    const handleFileClick = (file: any) => {
        if (file.type === 'YouTube' || file.type === 'Link' || file.type === 'Drive') {
            window.open(file.url, "_blank");
            return;
        }
        
        const absoluteUrl = getAbsoluteUrl(file.url);
        const link = document.createElement('a');
        link.href = absoluteUrl;
        link.download = file.name || 'download';
        link.target = "_blank";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

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
            setOrganization(data.organization);
            setMembership(data.membership);
            const isUserOfficer = data.membership?.role === 'officer' || user?.role === 'admin' || user?.role === 'super_admin';

            if (isUserOfficer) {
                try {
                    const membersData = await organizationService.getMembers(orgId as string);
                    const memberList = membersData.data || membersData.members || [];
                    const studentsOnly = memberList.filter((m: any) => m.role === "member");
                    setStudents(studentsOnly);
                } catch (err) {
                    console.error("Failed to fetch members for AssignTo:", err);
                }
            }

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
                        TabIndicatorProps={{ sx: { bgcolor: "#000", height: 3 } }}
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
                                color: "#000 !important"
                            }
                        }}
                    >
                        <Tab label={['poll', 'form'].includes(requirement?.type) ? "Question" : "Instructions"} />
                        {isOfficer && <Tab label={['poll', 'form'].includes(requirement?.type) ? "Students' answers" : "Member submission"} />}
                    </Tabs>
                </Box>

                <Box sx={{ py: 4, px: { xs: 2, md: 0 } }}>
                    {tabValue === 0 && (
                        <Container maxWidth="md" sx={{ px: 0 }}>
                            <Box sx={{ display: "flex", gap: 3, mb: 3 }}>
                                <Avatar sx={{ bgcolor: "#5f6368", width: 44, height: 44, mt: 0.5 }}>
                                    {['poll', 'form'].includes(requirement?.type) ? <LiveHelpIcon /> : <AssignmentIcon />}
                                </Avatar>
                                <Box sx={{ flex: 1 }}>
                                    <Box display="flex" justifyContent="space-between" alignItems="flex-start">
                                        <Typography variant="h4" sx={{ fontWeight: 400, color: "#000", mb: 1, fontSize: "1.75rem", letterSpacing: 0 }}>
                                            {requirement.title}
                                        </Typography>
                                        <IconButton 
                                            size="small" 
                                            sx={{ color: "#5f6368", bgcolor: menuAnchorEl ? "rgba(0, 0, 0, 0.08)" : "transparent" }}
                                            onClick={handleMenuClick}
                                        >
                                            <MoreVertIcon />
                                        </IconButton>
                                        <Menu
                                            anchorEl={menuAnchorEl}
                                            open={Boolean(menuAnchorEl)}
                                            onClose={handleMenuClose}
                                            PaperProps={{
                                                elevation: 2,
                                                sx: { minWidth: 160, borderRadius: '8px', mt: 0.5, '& .MuiList-root': { py: 1 }, '& .MuiMenuItem-root': { py: 1.5, px: 3, typography: 'body2', color: '#3c4043' } }
                                            }}
                                            transformOrigin={{ horizontal: 'right', vertical: 'top' }}
                                            anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
                                        >
                                            {isOfficer && <MenuItem onClick={handleEditClick}>Edit</MenuItem>}
                                            {isOfficer && <MenuItem onClick={handleDeleteClick}>Delete</MenuItem>}
                                            <MenuItem onClick={handleCopyLink}>Copy link</MenuItem>
                                        </Menu>
                                        <Snackbar open={snackbarOpen} autoHideDuration={3000} onClose={() => setSnackbarOpen(false)} message="Link copied" />
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

                            {requirement?.type === 'poll' && requirement.options && requirement.options.length > 0 && (
                                <Box sx={{ ml: { xs: 0, sm: 8.5 }, mb: 4 }}>
                                    <RadioGroup>
                                        {requirement.options.map((opt: string, idx: number) => (
                                            <FormControlLabel 
                                                key={idx} 
                                                value={opt} 
                                                control={<Radio color="primary" sx={{ '&.Mui-checked': { color: '#1a73e8' }, color: '#5f6368' }} />} 
                                                label={<Typography variant="body2" sx={{ color: "#3c4043", ml: 1, my: 0.5 }}>{opt}</Typography>} 
                                                disabled 
                                                sx={{ mb: 1, '.MuiFormControlLabel-label.Mui-disabled': { color: '#3c4043' }, '.MuiRadio-root.Mui-disabled': { color: '#bdc1c6' } }}
                                            />
                                        ))}
                                    </RadioGroup>
                                </Box>
                            )}

                            {requirement.attachments && requirement.attachments.length > 0 && (
                                <Box sx={{ ml: { xs: 0, sm: 8.5 }, mb: 4 }}>
                                    <Box display="flex" flexWrap="wrap" gap={2}>
                                        {requirement.attachments.map((file: any, idx: number) => (
                                            <Box
                                                key={idx}
                                                onClick={() => handleFileClick(file)}
                                                sx={{
                                                    width: { xs: "100%", sm: "calc(50% - 8px)" },
                                                    minWidth: { xs: 0, sm: 260 },
                                                    display: "flex",
                                                    borderRadius: "8px",
                                                    border: "1px solid #dadce0",
                                                    overflow: "hidden",
                                                    cursor: "pointer",
                                                    bgcolor: "#fff",
                                                    transition: "box-shadow 0.2s ease, background-color 0.2s ease",
                                                    "&:hover": { bgcolor: "#f1f3f4" }
                                                }}
                                            >
                                                {/* Text Container (Left Column) */}
                                                <Box sx={{ px: 2, display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden', justifyContent: 'center', borderRight: '1px solid #dadce0', height: 72 }}>
                                                    <Typography 
                                                        variant="body2" 
                                                        className="att-title"
                                                        sx={{ 
                                                            color: "#3c4043", 
                                                            fontWeight: 500, 
                                                            fontSize: "0.875rem",
                                                            textOverflow: "ellipsis", 
                                                            overflow: "hidden", 
                                                            whiteSpace: "nowrap",
                                                            lineHeight: 1.2,
                                                            "&:hover": { textDecoration: "underline" }
                                                        }}
                                                    >
                                                        {file.name}
                                                    </Typography>
                                                    <Typography variant="caption" sx={{ color: "#5f6368", fontSize: "0.75rem", mt: 0.5, textOverflow: "ellipsis", overflow: "hidden", whiteSpace: "nowrap" }}>
                                                        {getFileLabel(file)}
                                                    </Typography>
                                                </Box>

                                                {/* Icon Container (Right Column) */}
                                                <Box sx={{ 
                                                    width: 72, 
                                                    height: 72, 
                                                    display: 'flex', 
                                                    alignItems: 'center', 
                                                    justifyContent: 'center', 
                                                    bgcolor: '#f8f9fa',
                                                    flexShrink: 0,
                                                    borderLeft: '1px solid #dadce0',
                                                    overflow: 'hidden'
                                                }}>
                                                    {file.type === 'Drive' ? <img src="https://upload.wikimedia.org/wikipedia/commons/d/da/Google_Drive_logo.png" style={{ width: 24, height: 24, objectFit: 'contain' }} alt="Drive" /> :
                                                     file.type === 'YouTube' ? <img src="https://upload.wikimedia.org/wikipedia/commons/0/09/YouTube_full-color_icon_%282017%29.svg" style={{ width: 32, height: 24, objectFit: 'contain' }} alt="YouTube" /> :
                                                     file.type === 'Link' ? <LinkIcon sx={{ color: '#5f6368', fontSize: 28 }} /> :
                                                     (getFileLabel(file) === 'Image' ? <img src={getAbsoluteUrl(file.url)} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="Preview" /> :
                                                     <AttachmentIcon sx={{ color: '#1a73e8', fontSize: 28 }} />)}
                                                </Box>
                                            </Box>
                                        ))}
                                    </Box>
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
                                            <Avatar src={comment.userId?.profilePicture} sx={{ width: 32, height: 32, bgcolor: "#5f6368", fontSize: "1rem" }}>
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

                                <ClickAwayListener onClickAway={() => { if (!newComment.trim()) setIsCommentFocused(false); }}>
                                    <Box sx={{ display: "flex", alignItems: "flex-start", gap: 2 }}>
                                        <Avatar src={(user as any)?.profilePicture} sx={{ width: 32, height: 32, bgcolor: "#5f6368", fontSize: "1rem", mt: 0.5 }}>
                                            {(user as any)?.firstName?.charAt(0) || (user as any)?.fullName?.charAt(0) || user?.username?.charAt(0) || "U"}
                                        </Avatar>
                                        
                                        <Box sx={{ flex: 1, display: "flex", alignItems: "flex-end", gap: 1 }}>
                                            <Box 
                                                sx={{ 
                                                    flex: 1, 
                                                    border: `1px solid ${isCommentFocused ? '#1a73e8' : '#dadce0'}`, 
                                                    borderRadius: "24px", 
                                                    bgcolor: "#fff",
                                                    px: 2,
                                                    py: isCommentFocused ? 1.5 : 0.5,
                                                    minHeight: isCommentFocused ? 80 : 40,
                                                    display: 'flex',
                                                    flexDirection: 'column',
                                                    transition: 'all 0.2s',
                                                    boxShadow: isCommentFocused ? '0 1px 2px 0 rgba(60,64,67,0.3), 0 1px 3px 1px rgba(60,64,67,0.15)' : 'none'
                                                }}
                                                onClick={() => !isCommentFocused && setIsCommentFocused(true)}
                                            >
                                                <InputBase
                                                    fullWidth
                                                    multiline={isCommentFocused}
                                                    minRows={isCommentFocused ? 2 : 1}
                                                    placeholder="Add class comment..."
                                                    value={newComment}
                                                    onChange={(e) => setNewComment(e.target.value)}
                                                    onFocus={() => setIsCommentFocused(true)}
                                                    onKeyDown={(e) => {
                                                        if (e.key === 'Enter' && !e.shiftKey) {
                                                            e.preventDefault();
                                                            handleAddComment();
                                                            setIsCommentFocused(false);
                                                        }
                                                    }}
                                                    sx={{ 
                                                        typography: 'body2',
                                                        '& .MuiInputBase-input': { 
                                                            py: 0.5,
                                                            fontSize: '0.875rem' 
                                                        } 
                                                    }}
                                                />
                                                {isCommentFocused && (
                                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 'auto', pt: 1 }}>
                                                        <IconButton size="small" sx={{ p: 0.5, color: '#5f6368' }}><FormatBoldIcon fontSize="small" /></IconButton>
                                                        <IconButton size="small" sx={{ p: 0.5, color: '#5f6368' }}><FormatItalicIcon fontSize="small" /></IconButton>
                                                        <IconButton size="small" sx={{ p: 0.5, color: '#5f6368' }}><FormatUnderlinedIcon fontSize="small" /></IconButton>
                                                        <IconButton size="small" sx={{ p: 0.5, color: '#5f6368' }}><FormatListBulletedIcon fontSize="small" /></IconButton>
                                                        <IconButton size="small" sx={{ p: 0.5, color: '#5f6368' }}><FormatClearIcon fontSize="small" /></IconButton>
                                                    </Box>
                                                )}
                                            </Box>
                                            
                                            <IconButton
                                                onClick={() => {
                                                    handleAddComment();
                                                    setIsCommentFocused(false);
                                                }}
                                                disabled={!newComment.trim() || isSubmittingComment}
                                                sx={{
                                                    color: newComment.trim() ? "#1a73e8" : "#ccc",
                                                    p: 1,
                                                    mb: 0.5,
                                                    display: (isCommentFocused || newComment.trim() !== "") ? 'inline-flex' : 'none'
                                                }}
                                            >
                                                {isSubmittingComment ? <CircularProgress size={20} /> : <SendOutlinedIcon />}
                                            </IconButton>
                                        </Box>
                                    </Box>
                                </ClickAwayListener>
                            </Box>
                        </Container>
                    )}

                    {isOfficer && (
                        <>
                            <CreateRequirementModal
                                open={isEditModalOpen}
                                onClose={() => setIsEditModalOpen(false)}
                                organizationId={orgId as string}
                                organizationName={organization?.name || ""}
                                students={students}
                                onCreated={() => {
                                    setIsEditModalOpen(false);
                                    fetchData();
                                }}
                                isEdit={true}
                                editData={requirement}
                            />
                            <CreateFormModal
                                open={isEditFormModalOpen}
                                onClose={() => setIsEditFormModalOpen(false)}
                                organizationId={orgId as string}
                                organizationName={organization?.name || ""}
                                students={students}
                                onCreated={() => {
                                    setIsEditFormModalOpen(false);
                                    fetchData();
                                }}
                                isEdit={true}
                                editData={requirement}
                            />
                            <CreatePollModal
                                open={isEditPollModalOpen}
                                onClose={() => setIsEditPollModalOpen(false)}
                                organizationId={orgId as string}
                                organizationName={organization?.name || ""}
                                students={students}
                                onCreated={() => {
                                    setIsEditPollModalOpen(false);
                                    fetchData();
                                }}
                                isEdit={true}
                                editData={requirement}
                            />
                            <CreateMaterialModal
                                open={isEditMaterialModalOpen}
                                onClose={() => setIsEditMaterialModalOpen(false)}
                                organizationId={orgId as string}
                                organizationName={organization?.name || ""}
                                students={students}
                                onCreated={() => {
                                    setIsEditMaterialModalOpen(false);
                                    fetchData();
                                }}
                                isEdit={true}
                                editData={requirement}
                            />
                        </>
                    )}

                    {isOfficer && tabValue === 1 && (
                        <Box sx={{ display: "flex", flexDirection: "column", height: "calc(100vh - 120px)", borderTop: "1px solid #e0e0e0" }}>
                            {/* Top Action Bar */}
                            <Box sx={{ display: "flex", alignItems: "center", borderBottom: "1px solid #e0e0e0", height: 56 }}>
                                {/* Left Section (300px width) */}
                                <Box sx={{ width: 300, borderRight: "1px solid #e0e0e0", height: "100%", display: "flex", alignItems: "center", px: 2, gap: 1 }}>
                                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                        <Button disabled variant="contained" sx={{ textTransform: 'none', borderRadius: '4px 0 0 4px', bgcolor: '#f1f3f4', color: '#3c4043', boxShadow: 'none', px: 2, '&.Mui-disabled': { bgcolor: '#f1f3f4', color: 'rgba(0,0,0,0.38)' } }}>
                                            Return
                                        </Button>
                                        <Button disabled variant="contained" sx={{ minWidth: 0, padding: '6px 4px', borderRadius: '0 4px 4px 0', bgcolor: '#f1f3f4', boxShadow: 'none', borderLeft: '1px solid rgba(0,0,0,0.1)', '&.Mui-disabled': { bgcolor: '#f1f3f4' } }}>
                                            <ArrowDropDownIcon fontSize="small" />
                                        </Button>
                                    </Box>
                                </Box>
                                {/* Right Section */}
                                <Box sx={{ flex: 1, px: 3, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                                </Box>
                            </Box>

                            {/* Main Content Area */}
                            <Box sx={{ display: "flex", flex: 1, overflow: "hidden" }}>
                                {/* Left Sidebar: Student List */}
                                <Box sx={{ width: 300, borderRight: "1px solid #e0e0e0", overflowY: "auto", bgcolor: "#fff", display: "flex", flexDirection: "column" }}>
                                    <Box sx={{ p: 2, borderBottom: "1px solid #e0e0e0" }}>
                                        <Box display="flex" alignItems="center" gap={1.5} mb={2}>
                                            <Checkbox size="small" color="primary" defaultChecked />
                                            <GroupIcon sx={{ color: '#5f6368', fontSize: 20 }} />
                                            <Typography variant="body2" sx={{ fontWeight: 500, color: '#3c4043' }}>All members</Typography>
                                        </Box>
                                        <Select
                                            size="small"
                                            fullWidth
                                            defaultValue="status"
                                            sx={{ '& .MuiOutlinedInput-notchedOutline': { borderColor: 'transparent' }, bgcolor: '#f1f3f4', borderRadius: 1, typography: 'body2' }}
                                        >
                                            <MenuItem value="status">Sort by status</MenuItem>
                                            <MenuItem value="surname">Sort by surname</MenuItem>
                                            <MenuItem value="firstName">Sort by first name</MenuItem>
                                        </Select>
                                    </Box>
                                    {/* Submissions List */}
                                    <Box sx={{ flex: 1, overflowY: "auto" }}>
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
                                </Box>

                                {/* Right Panel: Submission Details / Overview */}
                                <Box sx={{ flex: 1, overflowY: "auto", bgcolor: "#fff", p: selectedSub ? 4 : 0 }}>
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
                                                        {subActionState === 'loading' ? 'Approving...' : subActionState === 'success' ? 'Approved!' : 'Approve'}
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
                                        <Box sx={{ p: 4, pt: 5 }}>
                                            <Typography variant="h5" sx={{ color: "#3c4043", mb: 4, fontWeight: 400 }}>{requirement.title}</Typography>

                                            <Box display="flex" gap={4} mb={4}>
                                                <Box>
                                                    <Typography variant="h2" sx={{ fontWeight: 400, color: "#3c4043", mb: 0.5, lineHeight: 1 }}>
                                                        {submissions.filter(s => s.status === 'pending' || s.status === 'approved' || s.status === 'resubmission_required').length}
                                                    </Typography>
                                                    <Typography variant="body2" color="text.secondary">Handed in</Typography>
                                                </Box>
                                                <Box sx={{ borderLeft: "1px solid #e0e0e0", pl: 4 }}>
                                                    <Typography variant="h2" sx={{ fontWeight: 400, color: "#3c4043", mb: 0.5, lineHeight: 1 }}>
                                                        {membership?.totalMembers || submissions.length || 0}
                                                    </Typography>
                                                    <Typography variant="body2" color="text.secondary">Assigned</Typography>
                                                </Box>
                                            </Box>

                                            <Box display="flex" alignItems="center" gap={1} mb={4}>
                                                <Switch defaultChecked color="primary" size="small" />
                                                <Typography variant="body2" color="text.secondary">Accepting submissions</Typography>
                                            </Box>

                                            <Box mb={8}>
                                                <Select
                                                    size="small"
                                                    defaultValue="all"
                                                    sx={{ 
                                                        '& .MuiOutlinedInput-notchedOutline': { borderColor: 'transparent' }, 
                                                        typography: 'body2',
                                                        color: '#3c4043',
                                                        fontWeight: 500,
                                                        '.MuiSelect-select': { pl: 0, py: 0.5 }
                                                    }}
                                                    IconComponent={(props) => <ArrowDropDownIcon {...props} sx={{ color: '#5f6368', ml: 0.5 }} />}
                                                >
                                                    <MenuItem value="all">All</MenuItem>
                                                    <MenuItem value="handed_in" disabled>Handed in</MenuItem>
                                                    <MenuItem value="assigned" disabled>Assigned</MenuItem>
                                                    <MenuItem value="marked" disabled>Marked</MenuItem>
                                                </Select>
                                            </Box>

                                            {submissions.length === 0 && (
                                                <Box display="flex" flexDirection="column" alignItems="center" justifyContent="center" mt={4}>
                                                    <Typography variant="h6" color="text.secondary">
                                                        Empty
                                                    </Typography>
                                                    <Typography variant="body2" color="text.secondary" align="center">
                                                        This hasn't been assigned to any members
                                                    </Typography>
                                                </Box>
                                            )}
                                        </Box>
                                    )}
                                </Box>
                            </Box>
                        </Box>
                    )}
                </Box>
            </Container>

        </RoleLayout>
    );
};

export default RequirementDetailsPage;
