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
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import DeleteIcon from "@mui/icons-material/Delete";
import InsertDriveFileIcon from "@mui/icons-material/InsertDriveFile";
import PersonIcon from "@mui/icons-material/Person";
import BookIcon from "@mui/icons-material/Book";
import CheckIcon from "@mui/icons-material/Check";
import ClearIcon from "@mui/icons-material/Clear";
import FileOpenIcon from "@mui/icons-material/FileOpen";
import AddIcon from "@mui/icons-material/Add";
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

import CreateRequirementModal from "../../components/stream/CreateRequirementModal";
import CreateFormModal from "../../components/stream/CreateFormModal";
import CreatePollModal from "../../components/stream/CreatePollModal";
import CreateMaterialModal from "../../components/stream/CreateMaterialModal";
import { useAuth } from "../../hooks/useAuth";
import { api, clearanceService, organizationService } from "../../services";
import { getAbsoluteUrl, getInitials } from "../../utils/avatarUtils";

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


const RequirementDetailsPage: React.FC = () => {
    const { orgId, reqId } = useParams<{ orgId: string; reqId: string }>();
    const navigate = useNavigate();
    const { user } = useAuth();
    const [fullUser, setFullUser] = useState(() => JSON.parse(localStorage.getItem('user') || '{}'));
    const userInitial = getInitials(fullUser?.fullName || fullUser?.firstName, user?.email);

    useEffect(() => {
        const handleStorageChange = () => {
            setFullUser(JSON.parse(localStorage.getItem('user') || '{}'));
        };
        window.addEventListener('storage', handleStorageChange);
        return () => window.removeEventListener('storage', handleStorageChange);
    }, []);

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

    // Private Comments state
    const [privateComments, setPrivateComments] = useState<any[]>([]);
    const [newPrivateComment, setNewPrivateComment] = useState("");
    const [isSubmittingPrivateComment, setIsSubmittingPrivateComment] = useState(false);
    const [isPrivateCommentFocused, setIsPrivateCommentFocused] = useState(false);

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

    // Student specific submission state
    const [studentFiles, setStudentFiles] = useState<File[]>([]);
    const [studentNotesText, setStudentNotesText] = useState("");
    const [isSubmittingWork, setIsSubmittingWork] = useState(false);
    const [studentSubError, setStudentSubError] = useState<string | null>(null);

    const handleStudentFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            setStudentFiles([...studentFiles, ...Array.from(e.target.files)]);
        }
    };

    const removeStudentFile = (index: number) => {
        setStudentFiles(studentFiles.filter((_, i) => i !== index));
    };

    const handleStudentSubmit = async () => {
        const existingFiles = requirement?.submission?.files || [];
        if (requirement?.requiredFiles?.includes('File') && studentFiles.length === 0 && existingFiles.length === 0) {
            setStudentSubError("Please upload at least one file. This requirement mandates an attachment.");
            return;
        }

        setIsSubmittingWork(true);
        setStudentSubError(null);

        try {
            const formData = new FormData();
            formData.append("clearanceRequirementId", reqId as string);
            formData.append("organizationId", orgId as string);
            formData.append("studentNotes", studentNotesText);
            studentFiles.forEach(file => {
                formData.append("files", file);
            });

            await clearanceService.submitRequirement(formData);
            await fetchData();
            setStudentFiles([]);
            setStudentNotesText("");
        } catch (err: any) {
            setStudentSubError(err.response?.data?.message || "Failed to submit work. Please try again.");
        } finally {
            setIsSubmittingWork(false);
        }
    };

    const handleFileClick = (file: any) => {
        if (file.type === 'YouTube' || file.type === 'Link' || file.type === 'Drive') {
            window.open(file.url, "_blank");
            return;
        }
        
        const absoluteUrl = getAbsoluteUrl(file.url);
        if (!absoluteUrl) return;

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

    // For students (member role), fetch their private comments once membership is loaded
    useEffect(() => {
        if (!orgId || !reqId || !user || !membership) return;
        if (!isOfficer) {
            fetchPrivateComments((user as any)._id || (user as any).id);
        }
    }, [orgId, reqId, user, membership, isOfficer]);

    // For officers, fetch private comments when a submission is selected
    useEffect(() => {
        if (isOfficer) {
            if (selectedSub && selectedSub.userId) {
                fetchPrivateComments(selectedSub.userId._id || selectedSub.userId.id);
            } else {
                setPrivateComments([]);
            }
        }
    }, [selectedSub, isOfficer]);

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

    const fetchPrivateComments = async (studentId: string) => {
        try {
            const data = await clearanceService.getPrivateComments(reqId as string, studentId);
            setPrivateComments(data);
        } catch (error) {
            console.error("Failed to fetch private comments", error);
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

    const handleAddPrivateComment = async (studentId: string) => {
        if (!newPrivateComment.trim()) return;
        setIsSubmittingPrivateComment(true);
        try {
            const added = await clearanceService.createPrivateComment(reqId as string, studentId, newPrivateComment);
            setPrivateComments(prev => [...prev, added.comment]);
            setNewPrivateComment("");
        } catch (error) {
            console.error("Failed to add private comment", error);
        } finally {
            setIsSubmittingPrivateComment(false);
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
            <>
                <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
                    <CircularProgress />
                </Box>
            </>
        );
    }

    if (!requirement) {
        return (
            <>
                <Container maxWidth="md" sx={{ mt: 8, textAlign: "center" }}>
                    <Typography variant="h5" color="text.secondary">Requirement not found.</Typography>
                    <Button onClick={() => navigate(`/organization/${orgId}`)} sx={{ mt: 2 }}>Back to Stream</Button>
                </Container>
            </>
        );
    }

    return (
        <>
            <Container maxWidth="lg" sx={{ px: { xs: 0, md: 3 } }}>
                {requirement?.type !== 'material' && isOfficer && (
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
                            <Tab label={requirement?.type === 'poll' ? "Question" : "Instructions"} />
                            {isOfficer && <Tab label={requirement?.type === 'poll' ? "Students' answers" : "Member submission"} />}
                        </Tabs>
                    </Box>
                )}

                <Box sx={{ py: 4, px: { xs: 2, md: 0 } }}>
                    {tabValue === 0 && (
                        <Container maxWidth="lg" sx={{ px: 0, display: "flex", gap: { xs: 3, md: 4 }, flexDirection: { xs: "column", md: "row" }, alignItems: 'flex-start' }}>
                            <Box sx={{ flex: 1, minWidth: 0, order: { xs: 2, md: 1 } }}>
                            <Box sx={{ display: "flex", gap: 3, mb: 3 }}>
                                <Avatar sx={{ bgcolor: "#5f6368", width: 44, height: 44, mt: 0.5 }}>
                                    {requirement?.type === 'poll' ? <LiveHelpIcon /> : requirement?.type === 'material' ? <BookIcon /> : <AssignmentIcon />}
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

                                    {requirement?.type !== 'material' && (
                                        <Box display="flex" justifyContent="space-between" alignItems="center" width="100%">
                                            <Typography variant="body2" sx={{ color: "#3c4043", fontWeight: 500, fontSize: "0.875rem" }}>
                                                {requirement.points ? (requirement.points === 'Ungraded' ? 'Ungraded' : `${requirement.points} points`) : "100 points"}
                                            </Typography>
                                            {requirement.dueDate && (
                                                <Typography variant="body2" sx={{ color: "#3c4043", fontWeight: 500, fontSize: "0.875rem" }}>
                                                    Due {new Date(requirement.dueDate).toLocaleDateString([], { month: 'short', day: 'numeric' })}{new Date(requirement.dueDate).getHours() === 23 && new Date(requirement.dueDate).getMinutes() === 59 ? '' : `, ${new Date(requirement.dueDate).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}`}
                                                </Typography>
                                            )}
                                        </Box>
                                    )}
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

                            {requirement.instructions && requirement.instructions !== requirement.description && (
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
                                                        {file.url?.includes('docs.google.com/forms') ? "Google Forms" : getFileLabel(file)}
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
                                                     file.url?.includes('docs.google.com/forms') ? (
                                                         <Box sx={{ width: '100%', height: '100%', bgcolor: '#f0ebf8', display: 'flex', alignItems: 'center', justifyContent: 'center', p: 1 }}>
                                                             <Box sx={{ bgcolor: '#fff', width: '100%', height: '100%', borderRadius: '4px', borderTop: '6px solid #673ab7', boxShadow: '0 1px 3px rgba(0,0,0,0.12)', p: 0.5 }}>
                                                                <Box sx={{ width: '60%', height: 4, bgcolor: '#dadce0', mb: 1, borderRadius: 1 }} />
                                                                <Box sx={{ width: '40%', height: 4, bgcolor: '#dadce0', borderRadius: 1 }} />
                                                             </Box>
                                                         </Box>
                                                     ) :
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
                                <Box display="flex" alignItems="center" gap={1} mb={comments.length > 0 ? 3 : 2}>
                                    <GroupIcon sx={{ color: "#5f6368", fontSize: 20 }} />
                                    <Typography sx={{ color: "#3c4043", fontWeight: 500, fontSize: "0.875rem" }}>
                                        Class comments
                                    </Typography>
                                </Box>

                                <Box sx={{ display: "flex", flexDirection: "column", gap: 3, mb: comments.length > 0 ? 4 : 0 }}>
                                        {comments.map((comment: any) => {
                                            // Robust ID comparison
                                            const currentId = (user as any)?.id || fullUser?._id || fullUser?.id;
                                            const commentAuthorId = comment.userId?._id || comment.userId?.id || (typeof comment.userId === 'string' ? comment.userId : null);
                                            const isCurrentUser = !!currentId && currentId === commentAuthorId;

                                            // Matching logic refined
                                            const commentUser = isCurrentUser ? { ...comment.userId, ...fullUser } : comment.userId;
                                            
                                            // Fallback string matches the one used in the input area
                                            const avatarSrc = commentUser?.avatarUrl || "";

                                            return (
                                                <Box key={comment._id} sx={{ display: "flex", gap: 2 }}>
                                                    <Avatar 
                                                        src={getAbsoluteUrl(avatarSrc)} 
                                                        sx={{ 
                                                            width: 32, 
                                                            height: 32, 
                                                            bgcolor: "#020617", 
                                                            color: "#FFFFFF",
                                                            fontSize: "0.875rem",
                                                            fontWeight: 800,
                                                            textShadow: '-0.5px 0 0 rgba(0,255,255,0.4), 0.5px 0 0 rgba(255,165,0,0.4)'
                                                        }}
                                                    >
                                                        {getInitials(commentUser?.fullName, commentUser?.email)}
                                                    </Avatar>
                                                    <Box>
                                                        <Box display="flex" alignItems="center" gap={1}>
                                                            <Typography variant="subtitle2" sx={{ fontWeight: 500, color: "#3c4043", fontSize: "0.875rem" }}>
                                                                {commentUser?.fullName}
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
                                            );
                                        })}
                                </Box>

                                <ClickAwayListener onClickAway={() => { if (!newComment.trim()) setIsCommentFocused(false); }}>
                                    <Box sx={{ display: "flex", alignItems: "flex-start", gap: 2 }}>
                                        <Avatar 
                                            src={getAbsoluteUrl(fullUser?.avatarUrl)} 
                                            sx={{ 
                                                width: 32, 
                                                height: 32, 
                                                bgcolor: "#020617", 
                                                color: "#FFFFFF",
                                                fontSize: "0.875rem", 
                                                fontWeight: 800,
                                                textShadow: '-0.5px 0 0 rgba(0,255,255,0.4), 0.5px 0 0 rgba(255,165,0,0.4)',
                                                mt: 0.5 
                                            }}
                                        >
                                            {userInitial}
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
                        </Box>
                            
                            {/* Right Column: Student Submission Card */}
                            {!isOfficer && requirement?.type !== 'material' && (
                                <Box sx={{ width: { xs: "100%", md: 320 }, flexShrink: 0, order: { xs: 1, md: 2 } }}>
                                    <Paper elevation={0} sx={{ border: "1px solid #dadce0", borderRadius: 2, mb: 3, overflow: "hidden" }}>
                                        <Box sx={{ p: 2.5, pb: 2, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                            <Typography variant="h6" sx={{ fontSize: "1.25rem", color: "#3c4043", fontWeight: 400 }}>
                                                Your submission
                                            </Typography>
                                            <Typography variant="body2" sx={{ 
                                                color: requirement?.submission?.status === "approved" ? "#0E7490" : 
                                                       requirement?.submission?.status === "pending" ? "#188038" : 
                                                       requirement?.submission?.status === "rejected" ? "#EF4444" : 
                                                       (requirement?.dueDate && new Date(requirement.dueDate) < new Date()) ? "#d93025" : "#188038", 
                                                fontWeight: 500 
                                            }}>
                                                {requirement?.submission?.status === "approved" ? "Approved" : 
                                                 requirement?.submission?.status === "pending" ? "Turned in" : 
                                                 requirement?.submission?.status === "rejected" ? "Returned" : 
                                                 (requirement?.dueDate && new Date(requirement.dueDate) < new Date()) ? "Missing" : "Assigned"}
                                            </Typography>
                                        </Box>
                                        
                                        <Box sx={{ px: 2.5, pb: 2.5 }}>
                                            {/* File List */}
                                            <Box sx={{ display: "flex", flexDirection: "column", gap: 1, mb: 2 }}>
                                                {((requirement?.submission?.files || []).length > 0 || studentFiles.length > 0) ? (
                                                    <>
                                                        {(requirement?.submission?.files || []).map((file: any, idx: number) => (
                                                            <Box
                                                                key={`ext-${idx}`}
                                                                sx={{ p: 1.5, display: "flex", alignItems: "center", justifyContent: "space-between", border: "1px solid #dadce0", borderRadius: 1.5, cursor: "pointer", "&:hover": { bgcolor: "#f8f9fa" } }}
                                                                onClick={() => {
                                                                    window.open(`${api.defaults.baseURL}/clearance-items/download/${file.filename}`, "_blank");
                                                                }}
                                                            >
                                                                <Box display="flex" alignItems="center" gap={1.5} sx={{ overflow: "hidden" }}>
                                                                    <Box sx={{ width: 32, height: 32, bgcolor: "#f1f3f4", borderRadius: 1, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                                                                        <InsertDriveFileIcon sx={{ color: "#1a73e8", fontSize: 20 }} />
                                                                    </Box>
                                                                    <Box sx={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
                                                                        <Typography variant="body2" sx={{ fontWeight: 500, color: "#3c4043", textOverflow: "ellipsis", overflow: "hidden", whiteSpace: "nowrap" }}>
                                                                            {file.originalName}
                                                                        </Typography>
                                                                        <Typography variant="caption" sx={{ color: "#5f6368" }}>File</Typography>
                                                                    </Box>
                                                                </Box>
                                                            </Box>
                                                        ))}
                                                        {studentFiles.map((file, idx) => (
                                                            <Box
                                                                key={`new-${idx}`}
                                                                sx={{ p: 1.5, display: "flex", alignItems: "center", justifyContent: "space-between", border: "1px solid #dadce0", borderRadius: 1.5 }}
                                                            >
                                                                <Box display="flex" alignItems="center" gap={1.5} sx={{ overflow: "hidden" }}>
                                                                    <Box sx={{ width: 32, height: 32, bgcolor: "#f1f3f4", borderRadius: 1, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                                                                        <InsertDriveFileIcon sx={{ color: "#1a73e8", fontSize: 20 }} />
                                                                    </Box>
                                                                    <Typography variant="body2" sx={{ fontWeight: 500, color: "#3c4043", textOverflow: "ellipsis", overflow: "hidden", whiteSpace: "nowrap" }}>
                                                                        {file.name}
                                                                    </Typography>
                                                                </Box>
                                                                <IconButton size="small" onClick={() => removeStudentFile(idx)} sx={{ color: "#5f6368" }}>
                                                                    <CloseIcon fontSize="small" />
                                                                </IconButton>
                                                            </Box>
                                                        ))}
                                                    </>
                                                ) : null}
                                            </Box>
                                            
                                            {/* Action Buttons */}
                                            {requirement?.submission?.status === "approved" ? (
                                                <Button fullWidth disabled variant="contained" sx={{ textTransform: "none", fontWeight: 500, fontSize: '0.875rem', py: 1, borderRadius: 1, boxShadow: 'none', '&.Mui-disabled': { bgcolor: '#e0e0e0', color: '#9aa0a6' } }}>
                                                    Approved
                                                </Button>
                                            ) : requirement?.submission?.status === "pending" ? (
                                                <Button fullWidth variant="outlined" disabled={isSubmittingWork} sx={{ textTransform: "none", fontSize: '0.875rem', borderRadius: 1, py: 1, borderColor: "#dadce0", color: "#1a73e8", fontWeight: 500, "&:hover": { bgcolor: "rgba(26,115,232,0.04)" } }}>
                                                    Unsubmit
                                                </Button>
                                            ) : (
                                                <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
                                                    <input type="file" id="file-upload" multiple style={{ display: "none" }} onChange={handleStudentFileChange} />
                                                    <label htmlFor="file-upload" style={{ width: '100%' }}>
                                                        <Button component="span" fullWidth variant="outlined" startIcon={<AddIcon />} sx={{ textTransform: 'none', borderRadius: 1, py: 1, fontSize: '0.875rem', borderColor: "#dadce0", color: "#1a73e8", fontWeight: 500, "&:hover": { bgcolor: "rgba(26,115,232,0.04)", borderColor: "#dadce0" } }}>
                                                            Add or create
                                                        </Button>
                                                    </label>
                                                    
                                                    <Button onClick={handleStudentSubmit} variant="contained" disabled={isSubmittingWork || (requirement?.requiredFiles?.includes('File') && studentFiles.length === 0 && (requirement?.submission?.files || []).length === 0)} sx={{ textTransform: 'none', fontWeight: 500, fontSize: '0.875rem', py: 1, bgcolor: "#000", color: "#fff", borderRadius: 1, boxShadow: 'none', "&:hover": { bgcolor: "#333", boxShadow: '0 1px 2px 0 rgba(60,64,67,0.3)' }, '&.Mui-disabled': { bgcolor: '#e0e0e0', color: '#9aa0a6' } }}>
                                                        {isSubmittingWork ? <CircularProgress size={24} color="inherit" /> : requirement?.submission?.status === "rejected" || requirement?.submission?.status === "resubmission_required" ? "Resubmit" : "Mark as done"}
                                                    </Button>
                                                </Box>
                                            )}
                                        </Box>
                                    </Paper>
                                    
                                    {studentSubError && (
                                        <Alert severity="error" sx={{ mb: 3, borderRadius: '14px' }}>{studentSubError}</Alert>
                                    )}
                                    
                                    {/* Private Comments Card */}
                                    <Paper elevation={0} sx={{ border: "1px solid #dadce0", borderRadius: 2, overflow: "hidden" }}>
                                        <Box sx={{ px: 2.5, py: 1.5, display: "flex", alignItems: "center", gap: 1 }}>
                                            <PersonIcon sx={{ color: "#5f6368", fontSize: 20 }} />
                                            <Typography variant="body2" sx={{ color: "#3c4043", fontWeight: 500 }}>
                                                Private comments
                                            </Typography>
                                        </Box>
                                        
                                        <Box sx={{ px: 2.5, pb: 2.5, display: "flex", flexDirection: "column", gap: 2 }}>
                                            {/* Render Private Comments List */}
                                            {privateComments.map((comment: any) => {
                                                const currentId = (user as any)?.id || fullUser?._id || fullUser?.id;
                                                const commentAuthorId = comment.userId?._id || comment.userId?.id || (typeof comment.userId === 'string' ? comment.userId : null);
                                                const isCurrentUser = !!currentId && currentId === commentAuthorId;

                                                const commentUser = isCurrentUser ? { ...comment.userId, ...fullUser } : comment.userId;
                                                const avatarSrc = commentUser?.avatarUrl || "";
                                                
                                                return (
                                                    <Box key={comment._id} sx={{ display: "flex", gap: 1.5 }}>
                                                        <Avatar 
                                                            src={getAbsoluteUrl(avatarSrc)} 
                                                            sx={{ width: 28, height: 28, bgcolor: "#5f6368", fontSize: "0.875rem" }}
                                                        >
                                                            {getInitials(commentUser?.fullName)}
                                                        </Avatar>
                                                        <Box>
                                                            <Box display="flex" alignItems="center" gap={1}>
                                                                <Typography variant="subtitle2" sx={{ fontWeight: 500, color: "#3c4043", fontSize: "0.8125rem" }}>
                                                                    {commentUser?.fullName}
                                                                </Typography>
                                                                <Typography variant="caption" sx={{ color: "#5f6368", fontSize: "0.75rem" }}>
                                                                    {new Date(comment.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                                </Typography>
                                                            </Box>
                                                            <Typography variant="body2" sx={{ color: "#3c4043", mt: 0.25, fontSize: "0.875rem" }}>
                                                                {comment.content}
                                                            </Typography>
                                                        </Box>
                                                    </Box>
                                                );
                                            })}

                                            {/* Input Area */}
                                            <ClickAwayListener onClickAway={() => { if (!newPrivateComment.trim()) setIsPrivateCommentFocused(false); }}>
                                                <Box sx={{ display: "flex", alignItems: "flex-start", gap: 1.5, mt: privateComments.length > 0 ? 1 : 0 }}>
                                                <Avatar 
                                                    src={getAbsoluteUrl(fullUser?.avatarUrl)} 
                                                    sx={{ 
                                                        width: 28, 
                                                        height: 28, 
                                                        bgcolor: "#020617", 
                                                        color: "#FFFFFF",
                                                        fontSize: "0.75rem", 
                                                        fontWeight: 800,
                                                        textShadow: '-0.5px 0 0 rgba(0,255,255,0.4), 0.5px 0 0 rgba(255,165,0,0.4)',
                                                        mt: 0.5 
                                                    }}
                                                >
                                                        {userInitial}
                                                    </Avatar>
                                                    <Box sx={{ flex: 1, display: "flex", alignItems: "flex-end", gap: 1 }}>
                                                        <Box 
                                                            sx={{ 
                                                                flex: 1, 
                                                                border: `1px solid ${isPrivateCommentFocused ? '#1a73e8' : '#dadce0'}`, 
                                                                borderRadius: "24px", 
                                                                bgcolor: "#fff",
                                                                px: 2,
                                                                py: isPrivateCommentFocused ? 1.5 : 0.5,
                                                                minHeight: isPrivateCommentFocused ? 80 : 40,
                                                                display: 'flex',
                                                                flexDirection: 'column',
                                                                transition: 'all 0.2s',
                                                                boxShadow: isPrivateCommentFocused ? '0 1px 2px 0 rgba(60,64,67,0.3), 0 1px 3px 1px rgba(60,64,67,0.15)' : 'none',
                                                                cursor: isPrivateCommentFocused ? 'text' : 'pointer'
                                                            }}
                                                            onClick={() => !isPrivateCommentFocused && setIsPrivateCommentFocused(true)}
                                                        >
                                                            <InputBase
                                                                fullWidth
                                                                multiline={isPrivateCommentFocused}
                                                                minRows={isPrivateCommentFocused ? 2 : 1}
                                                                placeholder={`Add private comment to ${requirement?.createdBy?.fullName || "Officer"}...`}
                                                                value={newPrivateComment}
                                                                onChange={(e) => setNewPrivateComment(e.target.value)}
                                                                onFocus={() => setIsPrivateCommentFocused(true)}
                                                                onKeyDown={(e) => {
                                                                    if (e.key === 'Enter' && !e.shiftKey) {
                                                                        e.preventDefault();
                                                                        handleAddPrivateComment((user as any)._id || (user as any).id);
                                                                        setIsPrivateCommentFocused(false);
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
                                                            {isPrivateCommentFocused && (
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
                                                                handleAddPrivateComment((user as any)._id || (user as any).id);
                                                                setIsPrivateCommentFocused(false);
                                                            }}
                                                            disabled={!newPrivateComment.trim() || isSubmittingPrivateComment}
                                                            sx={{
                                                                color: newPrivateComment.trim() ? "#1a73e8" : "#ccc",
                                                                p: 0.5,
                                                                mb: 0.5,
                                                                display: (isPrivateCommentFocused || newPrivateComment.trim() !== "") ? 'inline-flex' : 'none'
                                                            }}
                                                        >
                                                            {isSubmittingPrivateComment ? <CircularProgress size={20} /> : <SendOutlinedIcon fontSize="small" />}
                                                        </IconButton>
                                                    </Box>
                                                </Box>
                                            </ClickAwayListener>
                                        </Box>
                                    </Paper>
                                </Box>
                            )}
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
                                                        {submissions.map((sub) => {
                                                            // Robust ID comparison
                                                            const currentId = (user as any)?.id || fullUser?._id || fullUser?.id;
                                                            const subAuthorId = sub.userId?._id || sub.userId?.id || (typeof sub.userId === 'string' ? sub.userId : null);
                                                            const isCurrentUser = !!currentId && currentId === subAuthorId;

                                                            const subUser = isCurrentUser ? { ...sub.userId, ...fullUser } : sub.userId;
                                                            const avatarSrc = subUser?.avatarUrl || "";

                                                            return (
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
                                                                            <Avatar 
                                                                                src={getAbsoluteUrl(avatarSrc)}
                                                                                sx={{ 
                                                                                    bgcolor: sub.status === 'approved' ? "rgba(176, 224, 230, 0.4)" : "#020617",
                                                                                    color: "#FFFFFF",
                                                                                    width: 40,
                                                                                    height: 40,
                                                                                    fontWeight: 800,
                                                                                    textShadow: '-1px 0 0 rgba(0,255,255,0.4), 1px 0 0 rgba(255,165,0,0.4)'
                                                                                }}
                                                                            >
                                                                                {getInitials(subUser?.fullName, subUser?.email)}
                                                                            </Avatar>
                                                                        </ListItemAvatar>
                                                                        <ListItemText
                                                                            primary={subUser?.fullName || "Student"}
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
                                                                            primaryTypographyProps={{ fontWeight: 600, variant: "body2", color: '#3c4043' }}
                                                                        />
                                                                    </ListItem>
                                                                    <Divider />
                                                                </React.Fragment>
                                                            );
                                                        })}
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

                                            {subError && <Alert severity="error" sx={{ mb: 3, borderRadius: '14px' }}>{subError}</Alert>}

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
                                                            backgroundColor: subActionState === 'success' || selectedSub.status === 'approved' ? '#fff' : '#000',
                                                            color: subActionState === 'success' || selectedSub.status === 'approved' ? '#000' : '#fff',
                                                            border: subActionState === 'success' || selectedSub.status === 'approved' ? '1px solid #000' : 'none',
                                                            '&:hover': { backgroundColor: subActionState === 'success' || selectedSub.status === 'approved' ? '#f8f9fa' : '#333' },
                                                            '&.Mui-disabled': { 
                                                                backgroundColor: subActionState === 'success' || selectedSub.status === 'approved' ? '#fff' : '#E2E8F0', 
                                                                color: subActionState === 'success' || selectedSub.status === 'approved' ? '#000' : '#94A3B8',
                                                                border: subActionState === 'success' || selectedSub.status === 'approved' ? '1px solid #000' : 'none',
                                                            }
                                                        }}
                                                    >
                                                        {subActionState === 'loading' ? 'Approving...' : subActionState === 'success' || selectedSub.status === 'approved' ? 'Approved' : 'Approve'}
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

                                            <Divider sx={{ my: 4 }} />

                                            {/* Private Comments for Officer */}
                                            <Box>
                                                <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}>
                                                    <PersonIcon sx={{ color: "#5f6368", fontSize: 20 }} />
                                                    <Typography variant="subtitle2" fontWeight={600} color="#3c4043">
                                                        Private comments
                                                    </Typography>
                                                </Box>
                                                
                                                <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                                                    {/* Render Private Comments List */}
                                                    {privateComments.map((comment: any) => {
                                                        const currentId = (user as any)?.id || fullUser?._id || fullUser?.id;
                                                        const commentAuthorId = comment.userId?._id || comment.userId?.id || (typeof comment.userId === 'string' ? comment.userId : null);
                                                        const isCurrentUser = !!currentId && currentId === commentAuthorId;

                                                        const commentUser = isCurrentUser ? { ...comment.userId, ...fullUser } : comment.userId;
                                                        const avatarSrc = commentUser?.avatarUrl || "";
                                                        
                                                        return (
                                                            <Box key={comment._id} sx={{ display: "flex", gap: 1.5 }}>
                                                                <Avatar 
                                                                    src={getAbsoluteUrl(avatarSrc)} 
                                                                    sx={{ 
                                                                        width: 28, 
                                                                        height: 28, 
                                                                        bgcolor: "#020617", 
                                                                        color: "#FFFFFF",
                                                                        fontSize: "0.75rem",
                                                                        fontWeight: 800,
                                                                        textShadow: '-0.5px 0 0 rgba(0,255,255,0.4), 0.5px 0 0 rgba(255,165,0,0.4)'
                                                                    }}
                                                                >
                                                                    {getInitials(commentUser?.fullName)}
                                                                </Avatar>
                                                                <Box>
                                                                    <Box display="flex" alignItems="center" gap={1}>
                                                                        <Typography variant="subtitle2" sx={{ fontWeight: 500, color: "#3c4043", fontSize: "0.8125rem" }}>
                                                                            {commentUser?.fullName}
                                                                        </Typography>
                                                                        <Typography variant="caption" sx={{ color: "#5f6368", fontSize: "0.75rem" }}>
                                                                            {new Date(comment.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                                        </Typography>
                                                                    </Box>
                                                                    <Typography variant="body2" sx={{ color: "#3c4043", mt: 0.25, fontSize: "0.875rem" }}>
                                                                        {comment.content}
                                                                    </Typography>
                                                                </Box>
                                                            </Box>
                                                        );
                                                    })}

                                                    {/* Input Area */}
                                                    <ClickAwayListener onClickAway={() => { if (!newPrivateComment.trim()) setIsPrivateCommentFocused(false); }}>
                                                        <Box sx={{ display: "flex", alignItems: "flex-start", gap: 1.5, mt: privateComments.length > 0 ? 1 : 0 }}>
                                                            <Avatar 
                                                                src={getAbsoluteUrl(fullUser?.avatarUrl)} 
                                                                sx={{ 
                                                                    width: 28, 
                                                                    height: 28, 
                                                                    bgcolor: "#020617", 
                                                                    color: "#FFFFFF",
                                                                    fontSize: "0.75rem", 
                                                                    fontWeight: 800,
                                                                    textShadow: '-0.5px 0 0 rgba(0,255,255,0.4), 0.5px 0 0 rgba(255,165,0,0.4)',
                                                                    mt: 0.5 
                                                                }}
                                                            >
                                                                {userInitial}
                                                            </Avatar>
                                                            <Box sx={{ flex: 1, display: "flex", alignItems: "flex-end", gap: 1 }}>
                                                                <Box 
                                                                    sx={{ 
                                                                        flex: 1, 
                                                                        border: `1px solid ${isPrivateCommentFocused ? '#1a73e8' : '#dadce0'}`, 
                                                                        borderRadius: "24px", 
                                                                        bgcolor: "#fff",
                                                                        px: 2,
                                                                        py: isPrivateCommentFocused ? 1.5 : 0.5,
                                                                        minHeight: isPrivateCommentFocused ? 80 : 40,
                                                                        display: 'flex',
                                                                        flexDirection: 'column',
                                                                        transition: 'all 0.2s',
                                                                        boxShadow: isPrivateCommentFocused ? '0 1px 2px 0 rgba(60,64,67,0.3), 0 1px 3px 1px rgba(60,64,67,0.15)' : 'none',
                                                                        cursor: isPrivateCommentFocused ? 'text' : 'pointer'
                                                                    }}
                                                                    onClick={() => !isPrivateCommentFocused && setIsPrivateCommentFocused(true)}
                                                                >
                                                                    <InputBase
                                                                        fullWidth
                                                                        multiline={isPrivateCommentFocused}
                                                                        minRows={isPrivateCommentFocused ? 2 : 1}
                                                                        placeholder={`Add private comment to ${selectedSub.userId?.firstName || selectedSub.userId?.fullName || "student"}...`}
                                                                        value={newPrivateComment}
                                                                        onChange={(e) => setNewPrivateComment(e.target.value)}
                                                                        onFocus={() => setIsPrivateCommentFocused(true)}
                                                                        onKeyDown={(e) => {
                                                                            if (e.key === 'Enter' && !e.shiftKey) {
                                                                                e.preventDefault();
                                                                                handleAddPrivateComment(selectedSub.userId._id || selectedSub.userId.id);
                                                                                setIsPrivateCommentFocused(false);
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
                                                                    {isPrivateCommentFocused && (
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
                                                                        handleAddPrivateComment(selectedSub.userId._id || selectedSub.userId.id);
                                                                        setIsPrivateCommentFocused(false);
                                                                    }}
                                                                    disabled={!newPrivateComment.trim() || isSubmittingPrivateComment}
                                                                    sx={{
                                                                        color: newPrivateComment.trim() ? "#1a73e8" : "#ccc",
                                                                        p: 0.5,
                                                                        mb: 0.5,
                                                                        display: (isPrivateCommentFocused || newPrivateComment.trim() !== "") ? 'inline-flex' : 'none'
                                                                    }}
                                                                >
                                                                    {isSubmittingPrivateComment ? <CircularProgress size={20} /> : <SendOutlinedIcon fontSize="small" />}
                                                                </IconButton>
                                                            </Box>
                                                        </Box>
                                                    </ClickAwayListener>
                                                </Box>
                                            </Box>
                                        </Box>
                                    ) : (
                                        <Box sx={{ p: 4, pt: 5 }}>
                                            <Typography variant="h5" sx={{ color: "#3c4043", mb: 4, fontWeight: 400 }}>{requirement.title}</Typography>

                                            <Box display="flex" gap={4} mb={4}>
                                                <Box>
                                                    <Typography variant="h2" sx={{ fontWeight: 400, color: "#3c4043", mb: 0.5, lineHeight: 1 }}>
                                                        {submissions.filter(s => s.status === 'approved').length}
                                                    </Typography>
                                                    <Typography variant="body2" color="text.secondary">Handed in</Typography>
                                                </Box>
                                                <Box sx={{ borderLeft: "1px solid #e0e0e0", pl: 4 }}>
                                                    <Typography variant="h2" sx={{ fontWeight: 400, color: "#3c4043", mb: 0.5, lineHeight: 1 }}>
                                                        {(membership?.totalMembers || submissions.length || 0) - submissions.filter(s => s.status === 'approved').length}
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

        </>
    );
};

export default RequirementDetailsPage;
