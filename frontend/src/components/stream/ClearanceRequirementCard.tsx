import React, { useState } from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Paper from "@mui/material/Paper";
import Button from "@mui/material/Button";
import Avatar from "@mui/material/Avatar";
import Chip from "@mui/material/Chip";
import Collapse from "@mui/material/Collapse";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import Snackbar from "@mui/material/Snackbar";
import Divider from "@mui/material/Divider";
import IconButton from "@mui/material/IconButton";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import CloseIcon from "@mui/icons-material/Close";
import AssignmentIcon from "@mui/icons-material/Assignment";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import AttachmentIcon from "@mui/icons-material/Attachment";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import ErrorIcon from "@mui/icons-material/Error";
import ScheduleIcon from "@mui/icons-material/Schedule";
import AnnouncementIcon from "@mui/icons-material/Announcement";
import FactCheckIcon from "@mui/icons-material/FactCheck";
import HelpOutlineIcon from "@mui/icons-material/HelpOutline";
import BookIcon from "@mui/icons-material/Book";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import ChatBubbleOutlineIcon from "@mui/icons-material/ChatBubbleOutline";
import LinkIcon from "@mui/icons-material/Link";
import SendIcon from "@mui/icons-material/Send";
import SendOutlinedIcon from "@mui/icons-material/SendOutlined";
import FormatBoldIcon from "@mui/icons-material/FormatBold";
import FormatItalicIcon from "@mui/icons-material/FormatItalic";
import FormatUnderlinedIcon from "@mui/icons-material/FormatUnderlined";
import FormatListBulletedIcon from "@mui/icons-material/FormatListBulleted";
import FormatClearIcon from "@mui/icons-material/FormatClear";
import CircularProgress from "@mui/material/CircularProgress";
import TextField from "@mui/material/TextField";
import ClickAwayListener from "@mui/material/ClickAwayListener";
import InputBase from "@mui/material/InputBase";
import { useEffect } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { clearanceService } from "../../services";

/**
 * ClearanceRequirementCard Component
 * Displays a requirement in a Google Classroom-style stream item.
 */

export interface Attachment {
    name: string;
    url: string;
    type: string;
}

export interface ClearanceRequirementCardProps {
    id: string;
    title: string;
    description: string;
    instructions?: string;
    attachments?: Attachment[];
    status: "not_started" | "pending" | "approved" | "rejected" | "resubmission_required";
    isMandatory: boolean;
    isAnnouncement?: boolean;
    type?: string;
    author?: {
        fullName: string;
        profilePicture?: string;
    };
    submittedAt?: string;
    createdAt?: string;
    rejectionReason?: string;
    stats?: {
        pending: number;
        approved: number;
        rejected: number;
        totalMembers?: number;
    };
    dueDate?: string;
    points?: string;
    onAction?: (id: string) => void;
    onEdit?: (id: string) => void;
    onDelete?: (id: string) => void;
}

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

const ClearanceRequirementCard: React.FC<ClearanceRequirementCardProps> = ({
    id,
    title,
    description,
    instructions,
    attachments = [],
    status,
    isMandatory,
    isAnnouncement = false,
    type = 'requirement',
    author,
    submittedAt,
    createdAt,
    rejectionReason,
    stats,
    dueDate,
    points,
    onAction,
    onEdit,
    onDelete
}) => {
    const [expanded, setExpanded] = useState(false);
    const [menuAnchorEl, setMenuAnchorEl] = useState<null | HTMLElement>(null);
    const [snackbarOpen, setSnackbarOpen] = useState(false);
    const { user } = useAuth();
    const [comments, setComments] = useState<any[]>([]);
    const [newComment, setNewComment] = useState("");
    const [isSubmittingComment, setIsSubmittingComment] = useState(false);
    const [showComments, setShowComments] = useState(false);
    const [loadingComments, setLoadingComments] = useState(false);
    const [isCommentFocused, setIsCommentFocused] = useState(false);
    
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

    const currentUserStr = localStorage.getItem("user");
    const currentUser = currentUserStr ? JSON.parse(currentUserStr) : null;

    useEffect(() => {
        if (showComments) {
            fetchComments();
        }
    }, [showComments, id]);

    const fetchComments = async () => {
        setLoadingComments(true);
        try {
            const data = await clearanceService.getComments(id);
            setComments(data);
        } catch (error) {
            console.error("Failed to fetch comments", error);
        } finally {
            setLoadingComments(false);
        }
    };

    const handleAddComment = async () => {
        if (!newComment.trim()) return;
        setIsSubmittingComment(true);
        try {
            const added = await clearanceService.createComment(id, newComment);
            setComments(prev => [...prev, added.comment]);
            setNewComment("");
        } catch (error) {
            console.error("Failed to add comment", error);
        } finally {
            setIsSubmittingComment(false);
        }
    };

    const openMenu = Boolean(menuAnchorEl);
    const handleMenuClick = (event: React.MouseEvent<HTMLButtonElement>) => {
        event.stopPropagation();
        setMenuAnchorEl(event.currentTarget);
    };
    const handleMenuClose = () => {
        setMenuAnchorEl(null);
    };
    const handleCopyLink = (event: React.MouseEvent) => {
        event.stopPropagation();
        navigator.clipboard.writeText(window.location.href);
        setSnackbarOpen(true);
        handleMenuClose();
    };
    const handleEditClick = (event: React.MouseEvent) => {
        event.stopPropagation();
        if (onEdit) onEdit(id);
        handleMenuClose();
    };
    const handleDeleteClick = (event: React.MouseEvent) => {
        event.stopPropagation();
        if (onDelete) onDelete(id);
        handleMenuClose();
    };

    const renderSharedMenus = () => (
        <>
            <Menu
                anchorEl={menuAnchorEl}
                open={openMenu}
                onClose={handleMenuClose}
                onClick={(e) => e.stopPropagation()}
                PaperProps={{
                    elevation: 2,
                    sx: { minWidth: 160, borderRadius: '8px', mt: 0.5, '& .MuiList-root': { py: 1 }, '& .MuiMenuItem-root': { py: 1.5, px: 3, typography: 'body2', color: '#3c4043' } }
                }}
                transformOrigin={{ horizontal: 'right', vertical: 'top' }}
                anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
            >
                <MenuItem onClick={handleEditClick}>Edit</MenuItem>
                <MenuItem onClick={handleDeleteClick}>Delete</MenuItem>
                <MenuItem onClick={handleCopyLink}>Copy link</MenuItem>
            </Menu>
            <Snackbar
                open={snackbarOpen}
                autoHideDuration={3000}
                onClose={() => setSnackbarOpen(false)}
                message="Link copied"
                onClick={(e) => e.stopPropagation()}
            />
        </>
    );

    const renderCommentsSection = () => (
        <Box sx={{ bgcolor: "#fff", borderTop: "1px solid #dadce0" }}>
            <Box sx={{ px: 2, py: 1.5, display: "flex", alignItems: "center" }}>
                <Button
                    variant="text"
                    startIcon={<ChatBubbleOutlineIcon sx={{ fontSize: 18 }} />}
                    onClick={() => setShowComments(!showComments)}
                    sx={{ 
                        color: "#1967d2", 
                        textTransform: "none", 
                        fontWeight: 500, 
                        borderRadius: 20,
                        fontSize: "0.875rem",
                        px: 2,
                        "&:hover": { bgcolor: "rgba(25, 103, 210, 0.04)" }
                    }}
                >
                    {comments.length > 0 ? `${comments.length} class comment${comments.length > 1 ? 's' : ''}` : "Add class comment"}
                </Button>
            </Box>
            <Collapse in={showComments}>
                <Box sx={{ px: 3, pb: 2 }}>
                    {loadingComments ? (
                        <Box display="flex" justifyContent="center" py={2}>
                            <CircularProgress size={24} />
                        </Box>
                    ) : (
                        <Box sx={{ display: "flex", flexDirection: "column", gap: 2, mb: 2 }}>
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
                    )}
                    <ClickAwayListener onClickAway={() => { if (!newComment.trim()) setIsCommentFocused(false); }}>
                        <Box sx={{ display: "flex", alignItems: "flex-start", gap: 2, mt: 1 }}>
                            <Avatar src={currentUser?.profilePicture} sx={{ width: 32, height: 32, bgcolor: "#5f6368", fontSize: "1rem", mt: 0.5 }}>
                                {currentUser?.firstName?.charAt(0) || currentUser?.fullName?.charAt(0) || "U"}
                            </Avatar>
                            
                            <Box sx={{ flex: 1, display: "flex", alignItems: "flex-end", gap: 1 }}>
                                <Box 
                                    sx={{ 
                                        flex: 1, 
                                        border: `1px solid ${isCommentFocused ? '#1a73e8' : '#dadce0'}`, 
                                        borderRadius: "24px", 
                                        bgcolor: "#f1f3f4",
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
            </Collapse>
        </Box>
    );

    const getStatusConfig = () => {
        if (type === 'announcement' || isAnnouncement) {
            return { label: "Announcement", color: "#3B82F6", icon: <AnnouncementIcon sx={{ fontSize: 16 }} />, bgcolor: "#EFF6FF" };
        }
        if (type === 'form') {
            return { label: "Form", color: "#8B5CF6", icon: <FactCheckIcon sx={{ fontSize: 16 }} />, bgcolor: "#F5F3FF" };
        }
        if (type === 'poll') {
            return { label: "Poll", color: "#14B8A6", icon: <HelpOutlineIcon sx={{ fontSize: 16 }} />, bgcolor: "#F0FDFA" };
        }
        if (type === 'material') {
            return { label: "Material", color: "#8B5CF6", icon: <BookIcon sx={{ fontSize: 16 }} />, bgcolor: "#F5F3FF" }; // Same color space as form for now
        }
        
        // Default requirements behavior
        switch (status) {
            case "approved":
                return { label: "Approved", color: "#10B981", icon: <CheckCircleIcon sx={{ fontSize: 16 }} />, bgcolor: "#ECFDF5" };
            case "pending":
                return { label: "Pending", color: "#F59E0B", icon: <ScheduleIcon sx={{ fontSize: 16 }} />, bgcolor: "#FFFBEB" };
            case "rejected":
            case "resubmission_required":
                return { label: "Needs Correction", color: "#EF4444", icon: <ErrorIcon sx={{ fontSize: 16 }} />, bgcolor: "#FEF2F2" };
            default:
                return { label: "Assigned", color: "#64748B", icon: null, bgcolor: "#F8FAFC" };
        }
    };
    
    // Determine the large leading Avatar Icon and Color
    const getAvatarConfig = () => {
        if (type === 'announcement' || isAnnouncement) return { icon: <AnnouncementIcon />, color: "#5f6368" };
        if (type === 'form') return { icon: <FactCheckIcon />, color: "#5f6368" };
        if (type === 'poll') return { icon: <HelpOutlineIcon />, color: "#5f6368" };
        if (type === 'material') return { icon: <BookIcon />, color: "#5f6368" };
        
        // Default requirement logic
        return { icon: <AssignmentIcon />, color: "#5f6368" };
    };
    
    const avatarConfig = getAvatarConfig();
    const statusConfig = getStatusConfig();
    
    // ANNOUNCEMENT SPECIFIC GOOGLE CLASSROOM LAYOUT
    if (type === 'announcement' || isAnnouncement) {
        return (
            <>
                <Paper
                    elevation={0}
                    sx={{
                        bgcolor: "#f1f3f4",
                        borderRadius: "8px",
                        border: "1px solid rgba(0,0,0,0.1)",
                        mb: 2,
                        p: 0,
                        overflow: "hidden",
                        transition: "all 0.2s ease",
                        "&:hover": {
                            boxShadow: "0 1px 3px rgba(0,0,0,0.12), 0 1px 2px rgba(0,0,0,0.24)",
                        }
                    }}
                >
                    <Box sx={{ px: { xs: 2, sm: 3 }, py: { xs: 1.5, sm: 2 }, display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                        <Box display="flex" gap={3} alignItems="center">
                            <Avatar 
                                src={author?.profilePicture} 
                                sx={{ bgcolor: "#5f6368", width: 40, height: 40, fontSize: "1.2rem" }}
                            >
                                {author?.fullName?.charAt(0) || "U"}
                            </Avatar>
                            <Box>
                                <Typography variant="subtitle2" sx={{ fontWeight: 500, color: "#3c4043", fontSize: "0.875rem", fontFamily: "'Google Sans', 'Inter', sans-serif" }}>
                                    {author ? author.fullName : "User"}
                                </Typography>
                                <Typography variant="caption" sx={{ color: "#5f6368", fontSize: "0.75rem" }}>
                                    {createdAt ? new Date(createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "Time"}
                                </Typography>
                            </Box>
                        </Box>
                        <IconButton size="small" sx={{ color: "#5f6368", bgcolor: menuAnchorEl && openMenu ? "rgba(0, 0, 0, 0.08)" : "transparent" }} onClick={handleMenuClick}>
                            <MoreVertIcon fontSize="small" />
                        </IconButton>
                    </Box>
                    
                    <Box sx={{ px: { xs: 2, sm: 3 }, pb: { xs: 2, sm: 3 } }}>
                        <Typography
                            variant="body2"
                            sx={{
                                whiteSpace: "pre-wrap",
                                fontFamily: "'Roboto', 'Inter', sans-serif",
                                fontSize: "0.875rem",
                                color: "#3c4043",
                                lineHeight: 1.5
                            }}
                            dangerouslySetInnerHTML={{ __html: description }}
                        />
                        
                        {attachments.length > 0 && (
                            <Box sx={{ mt: 2, display: "flex", flexWrap: "wrap", gap: 2 }}>
                                {attachments.map((file, idx) => (
                                    <Box
                                        key={idx}
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
                                        onClick={() => handleFileClick(file)}
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
                        )}
                    </Box>
                    {renderCommentsSection()}
                    {renderSharedMenus()}
                </Paper>
                </>
        );
    }

    return (
        <>
            <Paper
                elevation={0}
                sx={{
                    bgcolor: expanded ? "#f8f9fa" : "#fff",
                    borderRadius: "8px",
                    border: "1px solid #dadce0",
                    mb: 2,
                    overflow: "hidden",
                    transition: "all 0.3s cubic-bezier(0.4,0,0.2,1)",
                    "&:hover": {
                        boxShadow: expanded ? "none" : "0 1px 2px 0 rgba(60,64,67,0.3), 0 1px 3px 1px rgba(60,64,67,0.15)",
                    }
                }}
            >
                {/* Summary/Header Row */}
                <Box
                    sx={{
                        px: { xs: 2, sm: 3 },
                        py: { xs: 1.5, sm: 2 },
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        cursor: "pointer",
                        bgcolor: expanded ? "#f1f3f4" : "transparent",
                        border: expanded ? "2px solid #1a73e8" : "2px solid transparent",
                        borderRadius: expanded ? "8px" : "0",
                        transition: "border 0.15s ease",
                        boxSizing: 'border-box'
                    }}
                    onClick={() => setExpanded(!expanded)}
                >
                    <Box sx={{ display: "flex", alignItems: "center", gap: 3, flex: 1 }}>
                        <Avatar sx={{ bgcolor: avatarConfig.color, width: 40, height: 40 }}>
                            {avatarConfig.icon}
                        </Avatar>

                        <Typography
                            variant="subtitle1"
                            sx={{
                                fontWeight: 500,
                                lineHeight: 1.3,
                                fontFamily: "'Google Sans', 'Roboto', 'Inter', sans-serif",
                                fontSize: "1rem",
                                color: "#3c4043"
                            }}
                        >
                            {title}
                        </Typography>
                    </Box>

                    <Box sx={{ display: "flex", alignItems: "center", gap: { xs: 1, sm: 2 } }}>
                        <Typography
                            variant="caption"
                            sx={{
                                color: "#5f6368",
                                fontFamily: "'Roboto', 'Inter', sans-serif",
                                fontSize: "0.875rem",
                                display: { xs: 'none', sm: 'block' }
                            }}
                        >
                            {createdAt ? `Posted ${new Date(createdAt).toLocaleDateString() === new Date().toLocaleDateString() ? 'Today' : new Date(createdAt).toLocaleDateString()}` : "Posted Yesterday"}
                        </Typography>
                        <IconButton
                            size="small"
                            onClick={handleMenuClick}
                            sx={{ color: "#5f6368", mr: -1, bgcolor: menuAnchorEl && openMenu ? "rgba(0, 0, 0, 0.08)" : "transparent" }}
                        >
                            <MoreVertIcon />
                        </IconButton>
                    </Box>
                </Box>

                {/* Expandable Content */}
                <Collapse in={expanded}>
                    <Box sx={{ p: 0 }}>
                        {/* Top Row: Details & Stats */}
                        <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, p: { xs: 2, sm: 3 }, pt: 3, gap: 4 }}>
                            {/* Left Side: Instructions */}
                            <Box sx={{ flex: 1 }}>
                                {type !== 'material' && (
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 3 }}>
                                        <Typography
                                            variant="caption"
                                            sx={{
                                                color: "#3c4043",
                                                fontFamily: "'Roboto', 'Inter', sans-serif",
                                                fontWeight: 500,
                                                fontSize: "0.875rem",
                                            }}
                                        >
                                            {points ? (points === 'Ungraded' ? 'Ungraded' : `${points} points`) : "100 points"}
                                        </Typography>
                                        
                                        <Typography variant="caption" sx={{ color: '#5f6368', fontWeight: 500 }}>•</Typography>
                                        
                                        <Typography
                                            variant="caption"
                                            sx={{
                                                color: "#3c4043",
                                                fontFamily: "'Roboto', 'Inter', sans-serif",
                                                fontWeight: 500,
                                                fontSize: "0.875rem",
                                            }}
                                        >
                                            {dueDate ? `Due ${new Date(dueDate).toLocaleString([], { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}` : "No due date"}
                                        </Typography>
                                    </Box>
                                )}

                                <Typography
                                    variant="body2"
                                    sx={{
                                        mb: 3,
                                        whiteSpace: "pre-wrap",
                                        fontFamily: "'Roboto', 'Inter', sans-serif",
                                        fontSize: "0.875rem",
                                        color: "#3c4043",
                                        lineHeight: 1.6
                                    }}
                                    dangerouslySetInnerHTML={{ __html: description }}
                                />

                                {instructions && instructions !== description && (
                                    <Box sx={{ mb: 3 }}>
                                        <Typography
                                            variant="body2"
                                            color="#3c4043"
                                            sx={{ whiteSpace: "pre-wrap", fontFamily: "'Roboto', 'Inter', sans-serif", lineHeight: 1.6 }}
                                            dangerouslySetInnerHTML={{ __html: instructions }}
                                        />
                                    </Box>
                                )}

                                {attachments.length > 0 && (
                                    <Box sx={{ mb: 3 }}>
                                        <Box display="flex" flexWrap="wrap" gap={2}>
                                            {attachments.map((file, idx) => (
                                                <Box
                                                    key={idx}
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
                                                    onClick={() => handleFileClick(file)}
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
                            </Box>

                            {/* Right Side: Stats Block */}
                            {type !== 'announcement' && !isAnnouncement && type !== 'material' && (
                                <Box sx={{ display: 'flex', gap: 4, pl: { md: 4 }, pr: 2, pt: 0, height: 'fit-content' }}>
                                    <Box sx={{ display: 'flex', flexDirection: 'column', borderLeft: '1px solid #e0e0e0', pl: 3 }}>
                                        <Typography variant="h2" sx={{ fontWeight: 400, color: "#3c4043", mb: 0.5, lineHeight: 1, fontSize: '2.5rem' }}>
                                            {stats?.approved || 0}
                                        </Typography>
                                        <Typography variant="body2" sx={{ color: "#5f6368", fontSize: "0.875rem" }}>
                                            Handed in
                                        </Typography>
                                    </Box>
                                    <Box sx={{ display: 'flex', flexDirection: 'column', borderLeft: '1px solid #e0e0e0', pl: 3 }}>
                                        <Typography variant="h2" sx={{ fontWeight: 400, color: "#3c4043", mb: 0.5, lineHeight: 1, fontSize: '2.5rem' }}>
                                            {(stats?.totalMembers || 0) - (stats?.approved || 0)}
                                        </Typography>
                                        <Typography variant="body2" sx={{ color: "#5f6368", fontSize: "0.875rem" }}>
                                            Assigned
                                        </Typography>
                                    </Box>
                                </Box>
                            )}
                        </Box>

                        <Divider sx={{ borderColor: '#e0e0e0' }} />

                        {/* Bottom Row: View Instructions Action */}
                        <Box sx={{ px: { xs: 2, sm: 3 }, py: 2 }}>
                            <Button
                                variant="text"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    if (onAction) onAction(id);
                                }}
                                sx={{
                                    color: "#1a73e8",
                                    textTransform: "none",
                                    fontWeight: 500,
                                    fontSize: "0.875rem",
                                    minWidth: 'auto',
                                    p: 0,
                                    '&:hover': { bgcolor: 'transparent', textDecoration: 'underline' }
                                }}
                            >
                                View instructions
                            </Button>
                        </Box>
                    </Box>
                </Collapse>
                {renderSharedMenus()}
            </Paper>

        </>
    );
};

export default ClearanceRequirementCard;
