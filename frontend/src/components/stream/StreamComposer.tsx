import React, { useState, useRef } from "react";
import Box from "@mui/material/Box";
import Paper from "@mui/material/Paper";
import Avatar from "@mui/material/Avatar";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import IconButton from "@mui/material/IconButton";
import Divider from "@mui/material/Divider";
import Collapse from "@mui/material/Collapse";
import CircularProgress from "@mui/material/CircularProgress";
import Alert from "@mui/material/Alert";
import AddIcon from "@mui/icons-material/Add";
import FormatBoldIcon from "@mui/icons-material/FormatBold";
import FormatItalicIcon from "@mui/icons-material/FormatItalic";
import FormatUnderlinedIcon from "@mui/icons-material/FormatUnderlined";
import FormatListBulletedIcon from "@mui/icons-material/FormatListBulleted";
import CloseIcon from "@mui/icons-material/Close";
import AssignmentIcon from "@mui/icons-material/Assignment";
import Tooltip from "@mui/material/Tooltip";
import AddToDriveIcon from "@mui/icons-material/AddToDrive";
import YouTubeIcon from "@mui/icons-material/YouTube";
import FileUploadOutlinedIcon from "@mui/icons-material/FileUploadOutlined";
import LinkIcon from "@mui/icons-material/Link";
import { clearanceService } from "../../services";
import AddResourceModal from "../modals/AddResourceModal";

interface StreamComposerProps {
    organizationId: string;
    onCreated: () => void;
    userAvatarUrl?: string;
}

const StreamComposer: React.FC<StreamComposerProps> = ({ organizationId, onCreated, userAvatarUrl }) => {
    const [isExpanded, setIsExpanded] = useState(false);
    const [content, setContent] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const editorRef = useRef<HTMLDivElement>(null);

    // Modal state for attachments
    const [resourceModal, setResourceModal] = useState<{
        open: boolean;
        type: 'Drive' | 'YouTube' | 'Link';
    }>({
        open: false,
        type: 'Link'
    });

    const [activeFormats, setActiveFormats] = useState({
        bold: false,
        italic: false,
        underline: false,
        insertUnorderedList: false
    });

    // Attachments State
    const [attachments, setAttachments] = useState<Array<{ type: string, file?: File, url?: string, name: string }>>([]);

    const handleExpand = () => {
        setIsExpanded(true);
        setTimeout(() => {
            editorRef.current?.focus();
        }, 100);
    };

    const handleCancel = () => {
        setIsExpanded(false);
        setContent("");
        if (editorRef.current) {
            editorRef.current.innerHTML = "";
        }
        setAttachments([]);
        setError(null);
    };

    const handlePost = async () => {
        const strippedContent = content.replace(/<[^>]+>/g, '').trim();
        if (!strippedContent) {
            setError("Please write something to announce.");
            return;
        }

        setLoading(true);
        setError(null);

        const titleContent = strippedContent || 'Announcement';

        try {
            const formData = new FormData();
            formData.append('title', titleContent.length > 60 ? titleContent.substring(0, 60) + "..." : titleContent);
            formData.append('description', content);
            formData.append('instructions', "");
            formData.append('organizationId', organizationId);
            formData.append('isMandatory', 'false');
            formData.append('isAnnouncement', 'true');
            formData.append('type', 'announcement');

            // Handle URL Attachments
            const urlAttachments = attachments.filter(a => !a.file).map(a => ({ name: a.name, url: a.url, type: a.type }));
            if (urlAttachments.length > 0) {
                formData.append('attachments', JSON.stringify(urlAttachments));
            }

            // Handle File Uploads
            attachments.filter(a => a.file).forEach(a => {
                formData.append('files', a.file as Blob);
            });

            await clearanceService.createRequirement(formData as any);

            onCreated();
            handleCancel();
        } catch (err: any) {
            setError(err.response?.data?.message || "Failed to post announcement.");
        } finally {
            setLoading(false);
        }
    };

    const handleUrlAttachment = (type: 'Drive' | 'YouTube' | 'Link') => {
        setResourceModal({ open: true, type });
    };

    const handleModalAdd = (url: string) => {
        const type = resourceModal.type;
        setAttachments(prev => [...prev, { type, url, name: url }]);
    };

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            const newFiles = Array.from(e.target.files).map(file => ({
                type: 'File',
                file,
                name: file.name
            }));
            setAttachments(prev => [...prev, ...newFiles]);
        }
        e.target.value = '';
    };

    const handleFormat = (e: React.MouseEvent, command: string) => {
        e.preventDefault();
        document.execCommand(command, false);
        checkFormatState();
        if (editorRef.current) {
            setContent(editorRef.current.innerHTML);
        }
        editorRef.current?.focus();
    };

    const checkFormatState = () => {
        setActiveFormats({
            bold: document.queryCommandState("bold"),
            italic: document.queryCommandState("italic"),
            underline: document.queryCommandState("underline"),
            insertUnorderedList: document.queryCommandState("insertUnorderedList")
        });
    };

    if (!isExpanded) {
        return (
            <Paper
                elevation={0}
                sx={{
                    px: { xs: 2, sm: 3 },
                    py: 2,
                    mb: 2,
                    borderRadius: "8px",
                    border: "1px solid #dadce0",
                    display: "flex",
                    alignItems: "center",
                    gap: { xs: 1.5, sm: 3 },
                    cursor: "pointer",
                    transition: "all 0.2s ease",
                    "&:hover": {
                        borderColor: "rgba(0,0,0,0.12)",
                    }
                }}
                onClick={handleExpand}
            >
                <Avatar src={userAvatarUrl} sx={{ bgcolor: "#F1F3F4", color: "#5F6368", width: 40, height: 40 }}>
                    <AddIcon />
                </Avatar>
                <Typography
                    sx={{
                        color: "#3c4043",
                        fontFamily: "'Google Sans', 'Inter', sans-serif",
                        fontSize: "0.875rem",
                        fontWeight: 500
                    }}
                >
                    Announce something to your organization...
                </Typography>
            </Paper>
        );
    }

    return (
        <Paper
            elevation={0}
            sx={{
                mb: 2,
                borderRadius: "8px",
                border: "1px solid #dadce0",

                overflow: "hidden"
            }}
        >
            <Box sx={{ p: 2 }}>
                {error && (
                    <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>
                        {error}
                    </Alert>
                )}

                {/* Rich Text Editor */}
                <Box
                    sx={{
                        bgcolor: "#f1f3f4",
                        borderRadius: "8px",
                        position: "relative",
                        border: "1px solid transparent",
                        "&:focus-within": {
                            borderColor: "#0E7490",
                            bgcolor: "#fff"
                        }
                    }}
                >
                    <Box
                        ref={editorRef}
                        contentEditable
                        onInput={(e) => setContent(e.currentTarget.innerHTML)}
                        onKeyUp={checkFormatState}
                        onMouseUp={checkFormatState}
                        sx={{
                            minHeight: "100px",
                            p: 2,
                            outline: "none",
                            fontSize: "0.875rem",
                            fontFamily: "'Roboto', 'Inter', sans-serif",
                            color: "#3c4043",
                            "&:empty:before": {
                                content: '"Announce something to your organization..."',
                                color: "#5f6368",
                                pointerEvents: "none",
                                display: "block"
                            }
                        }}
                    />

                    {/* Toolbar */}
                    <Box sx={{ p: 0.5, display: "flex", borderTop: "1px solid rgba(0,0,0,0.06)" }}>
                        <IconButton
                            size="small"
                            onMouseDown={(e) => handleFormat(e, "bold")}
                            color={activeFormats.bold ? "primary" : "default"}
                            sx={{ color: activeFormats.bold ? "#0E7490" : "#5f6368" }}
                        >
                            <FormatBoldIcon fontSize="small" />
                        </IconButton>
                        <IconButton
                            size="small"
                            onMouseDown={(e) => handleFormat(e, "italic")}
                            color={activeFormats.italic ? "primary" : "default"}
                            sx={{ color: activeFormats.italic ? "#0E7490" : "#5f6368" }}
                        >
                            <FormatItalicIcon fontSize="small" />
                        </IconButton>
                        <IconButton
                            size="small"
                            onMouseDown={(e) => handleFormat(e, "underline")}
                            color={activeFormats.underline ? "primary" : "default"}
                            sx={{ color: activeFormats.underline ? "#0E7490" : "#5f6368" }}
                        >
                            <FormatUnderlinedIcon fontSize="small" />
                        </IconButton>
                        <IconButton
                            size="small"
                            onMouseDown={(e) => handleFormat(e, "insertUnorderedList")}
                            color={activeFormats.insertUnorderedList ? "primary" : "default"}
                            sx={{ color: activeFormats.insertUnorderedList ? "#0E7490" : "#5f6368", ml: 1 }}
                        >
                            <FormatListBulletedIcon fontSize="small" />
                        </IconButton>
                    </Box>
                </Box>
            </Box>

            {/* Actions */}

            {/* Render Attachments */}
            {attachments.length > 0 && (
                <Box sx={{ px: 2, pb: 2, display: 'flex', flexDirection: 'column', gap: 1 }}>
                    <Typography sx={{ fontSize: "0.875rem", fontWeight: 500, color: "#3c4043", mb: 0.5 }}>Attached Files</Typography>
                    {attachments.map((att, idx) => (
                        <Box key={idx} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', p: 1.5, border: '1px solid #dadce0', borderRadius: 1 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, overflow: 'hidden' }}>
                                {att.type === 'Drive' ? <img src="https://upload.wikimedia.org/wikipedia/commons/d/da/Google_Drive_logo.png" width={20} alt="Drive" /> :
                                    att.type === 'YouTube' ? <img src="https://upload.wikimedia.org/wikipedia/commons/0/09/YouTube_full-color_icon_%282017%29.svg" width={20} alt="YouTube" /> :
                                        att.type === 'Link' ? <Box component="span" sx={{ fontSize: 20 }}>🔗</Box> :
                                            <AssignmentIcon sx={{ color: "#0E7490", fontSize: 20 }} />}
                                <Typography sx={{ fontSize: "0.875rem", color: "#0E7490", fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                    {att.name}
                                </Typography>
                            </Box>
                            <IconButton size="small" onClick={() => setAttachments(prev => prev.filter((_, i) => i !== idx))}>
                                <CloseIcon fontSize="small" sx={{ color: "#5f6368" }} />
                            </IconButton>
                        </Box>
                    ))}
                </Box>
            )}

            <Box sx={{
                px: 2,
                py: 1.5,
                display: "flex",
                flexDirection: { xs: "column", sm: "row" },
                justifyContent: "space-between",
                alignItems: { xs: "stretch", sm: "center" },
                bgcolor: "#fff",
                borderTop: "1px solid rgba(0,0,0,0.06)",
                gap: 2
            }}>
                {/* Attachment Tools */}
                <Box sx={{ display: "flex", gap: 1, justifyContent: { xs: "center", sm: "flex-start" } }}>
                    <Tooltip title="Add Google Drive file">
                        <IconButton size="small" onClick={() => handleUrlAttachment('Drive')} sx={{ border: "1px solid #dadce0", width: 40, height: 40 }}>
                            <AddToDriveIcon sx={{ color: "#5f6368", fontSize: 22 }} />
                        </IconButton>
                    </Tooltip>
                    <Tooltip title="Add YouTube video">
                        <IconButton size="small" onClick={() => handleUrlAttachment('YouTube')} sx={{ border: "1px solid #dadce0", width: 40, height: 40 }}>
                            <YouTubeIcon sx={{ color: "#5f6368", fontSize: 22 }} />
                        </IconButton>
                    </Tooltip>
                    <Tooltip title="Upload file">
                        <IconButton size="small" onClick={() => document.getElementById('composer-file-upload')?.click()} sx={{ border: "1px solid #dadce0", width: 40, height: 40 }}>
                            <FileUploadOutlinedIcon sx={{ color: "#5f6368", fontSize: 22 }} />
                        </IconButton>
                    </Tooltip>
                    <Tooltip title="Add link">
                        <IconButton size="small" onClick={() => handleUrlAttachment('Link')} sx={{ border: "1px solid #dadce0", width: 40, height: 40 }}>
                            <LinkIcon sx={{ color: "#5f6368", fontSize: 22 }} />
                        </IconButton>
                    </Tooltip>
                    <input
                        type="file"
                        id="composer-file-upload"
                        multiple
                        style={{ display: 'none' }}
                        onChange={handleFileUpload}
                    />
                </Box>

                {/* Submit Actions */}
                <Box sx={{ display: "flex", gap: 1, justifyContent: { xs: "flex-end", sm: "flex-start" } }}>
                    <Button
                        variant="text"
                        onClick={handleCancel}
                        disabled={loading}
                        sx={{
                            color: "#5f6368",
                            textTransform: "none",
                            fontWeight: 500,
                            borderRadius: 1
                        }}
                    >
                        Cancel
                    </Button>
                    <Button
                        variant="contained"
                        onClick={handlePost}
                        disabled={loading || content.replace(/<[^>]+>/g, '').trim().length === 0}
                        sx={{
                            bgcolor: "#3c4043",
                            color: "white",
                            textTransform: "none",
                            fontWeight: 500,
                            borderRadius: 1,
                            px: 3,
                            boxShadow: "none",
                            "&:hover": {
                                bgcolor: "#202124",
                                boxShadow: "0 1px 2px 0 rgba(60,64,67,0.3)"
                            },
                            "&:disabled": {
                                bgcolor: "rgba(0,0,0,0.12)",
                                color: "rgba(0,0,0,0.38)"
                            }
                        }}
                    >
                        {loading ? <CircularProgress size={20} color="inherit" /> : "Post"}
                    </Button>
                </Box>
            </Box>

            <AddResourceModal
                open={resourceModal.open}
                type={resourceModal.type}
                onClose={() => setResourceModal(prev => ({ ...prev, open: false }))}
                onAdd={handleModalAdd}
            />
        </Paper>
    );
};

export default StreamComposer;
