import React, { useState, useRef } from "react";
import Dialog from "@mui/material/Dialog";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import TextField from "@mui/material/TextField";
import Box from "@mui/material/Box";
import Divider from "@mui/material/Divider";
import Chip from "@mui/material/Chip";
import Alert from "@mui/material/Alert";
import CircularProgress from "@mui/material/CircularProgress";
import IconButton from "@mui/material/IconButton";
import PeopleOutlineIcon from "@mui/icons-material/PeopleOutline";
import FormatBoldIcon from "@mui/icons-material/FormatBold";
import FormatItalicIcon from "@mui/icons-material/FormatItalic";
import FormatUnderlinedIcon from "@mui/icons-material/FormatUnderlined";
import FormatListBulletedIcon from "@mui/icons-material/FormatListBulleted";
import FormatStrikethroughIcon from "@mui/icons-material/FormatStrikethrough";
import { clearanceService } from "../../services";

/**
 * CreateAnnouncementModal Component
 * Google Classroom-style announcement creation modal for the Stream tab.
 */

interface CreateAnnouncementModalProps {
    open: boolean;
    onClose: () => void;
    organizationId: string;
    organizationName?: string;
    onCreated?: () => void;
}

const CreateAnnouncementModal: React.FC<CreateAnnouncementModalProps> = ({
    open,
    onClose,
    organizationId,
    organizationName = "Organization",
    onCreated
}) => {
    const [content, setContent] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [activeFormats, setActiveFormats] = useState({
        bold: false,
        italic: false,
        underline: false,
        strikeThrough: false,
        insertUnorderedList: false
    });
    const editorRef = useRef<HTMLDivElement>(null);

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
            await clearanceService.createRequirement({
                title: titleContent.length > 60 ? titleContent.substring(0, 60) + "..." : titleContent,
                description: content,
                instructions: "",
                organizationId,
                isMandatory: false,
                isAnnouncement: true,
                type: 'announcement',
                requiredFiles: []
            });

            onCreated?.();
            handleClose();
        } catch (err: any) {
            setError(err.response?.data?.message || "Failed to post announcement.");
        } finally {
            setLoading(false);
        }
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
            strikeThrough: document.queryCommandState("strikeThrough"),
            insertUnorderedList: document.queryCommandState("insertUnorderedList")
        });
    };

    const handleClose = () => {
        setContent("");
        if (editorRef.current) {
            editorRef.current.innerHTML = "";
        }
        setError(null);
        onClose();
    };

    return (
        <Dialog
            open={open}
            onClose={handleClose}
            maxWidth="sm"
            fullWidth
            PaperProps={{
                sx: {
                    borderRadius: 3,
                    overflow: "hidden"
                }
            }}
        >
            {/* Title */}
            <Box sx={{ px: 3, pt: 3, pb: 1.5 }}>
                <Typography
                    variant="h5"
                    sx={{
                        fontWeight: 400,
                        fontFamily: "'Google Sans', 'Inter', sans-serif",
                        color: "#3c4043",
                        fontSize: "1.375rem"
                    }}
                >
                    Announcement
                </Typography>
            </Box>

            <Divider />

            <DialogContent sx={{ p: 0 }}>
                {error && (
                    <Alert severity="error" sx={{ mx: 3, mt: 2, borderRadius: 2 }}>
                        {error}
                    </Alert>
                )}

                {/* "For" Section */}
                <Box sx={{ px: 3, pt: 2.5, pb: 1.5 }}>
                    <Typography
                        variant="body2"
                        sx={{
                            color: "#5f6368",
                            fontSize: "0.75rem",
                            fontWeight: 500,
                            mb: 1
                        }}
                    >
                        For
                    </Typography>
                    <Box display="flex" alignItems="center" gap={1.5}>
                        <Chip
                            label={organizationName}
                            variant="outlined"
                            sx={{
                                borderRadius: "4px",
                                borderColor: "#dadce0",
                                color: "#3c4043",
                                fontWeight: 400,
                                fontSize: "0.875rem",
                                height: 36,
                                '& .MuiChip-label': { px: 1.5 }
                            }}
                        />
                        <Chip
                            icon={<PeopleOutlineIcon sx={{ fontSize: 18 }} />}
                            label="All students"
                            variant="outlined"
                            sx={{
                                borderRadius: 20,
                                borderColor: "#1967d2",
                                color: "#1967d2",
                                fontWeight: 500,
                                fontSize: "0.875rem",
                                height: 36,
                                '& .MuiChip-icon': { color: '#1967d2' },
                                '& .MuiChip-label': { px: 1 }
                            }}
                        />
                    </Box>
                </Box>

                {/* Text Area */}
                <Box
                    sx={{
                        mx: 3,
                        mt: 1,
                        mb: 0,
                        bgcolor: "#e8eaed40",
                        borderRadius: 2,
                        overflow: "hidden"
                    }}
                >
                    <Box
                        ref={editorRef}
                        contentEditable
                        suppressContentEditableWarning
                        onInput={(e) => setContent(e.currentTarget.innerHTML)}
                        onKeyUp={checkFormatState}
                        onMouseUp={checkFormatState}
                        sx={{
                            minHeight: "120px",
                            outline: "none",
                            p: 2,
                            fontFamily: "'Google Sans', 'Inter', sans-serif",
                            fontSize: "0.9375rem",
                            color: "#3c4043",
                            "&:empty:before": {
                                content: '"Announce something to your class"',
                                color: "#1967d2",
                                pointerEvents: "none",
                                display: "block",
                            }
                        }}
                    />

                    {/* Formatting Toolbar */}
                    <Box
                        sx={{
                            display: "flex",
                            gap: 0.5,
                            px: 1,
                            py: 0.5,
                            borderTop: "1px solid #dadce0"
                        }}
                    >
                        <IconButton size="small" sx={{ color: activeFormats.bold ? "#1a73e8" : "#5f6368", bgcolor: activeFormats.bold ? "#e8f0fe" : "transparent" }} onMouseDown={(e) => handleFormat(e, "bold")}>
                            <FormatBoldIcon fontSize="small" />
                        </IconButton>
                        <IconButton size="small" sx={{ color: activeFormats.italic ? "#1a73e8" : "#5f6368", bgcolor: activeFormats.italic ? "#e8f0fe" : "transparent" }} onMouseDown={(e) => handleFormat(e, "italic")}>
                            <FormatItalicIcon fontSize="small" />
                        </IconButton>
                        <IconButton size="small" sx={{ color: activeFormats.underline ? "#1a73e8" : "#5f6368", bgcolor: activeFormats.underline ? "#e8f0fe" : "transparent" }} onMouseDown={(e) => handleFormat(e, "underline")}>
                            <FormatUnderlinedIcon fontSize="small" />
                        </IconButton>
                        <IconButton size="small" sx={{ color: activeFormats.insertUnorderedList ? "#1a73e8" : "#5f6368", bgcolor: activeFormats.insertUnorderedList ? "#e8f0fe" : "transparent" }} onMouseDown={(e) => handleFormat(e, "insertUnorderedList")}>
                            <FormatListBulletedIcon fontSize="small" />
                        </IconButton>
                        <IconButton size="small" sx={{ color: activeFormats.strikeThrough ? "#1a73e8" : "#5f6368", bgcolor: activeFormats.strikeThrough ? "#e8f0fe" : "transparent" }} onMouseDown={(e) => handleFormat(e, "strikeThrough")}>
                            <FormatStrikethroughIcon fontSize="small" />
                        </IconButton>
                    </Box>
                </Box>
            </DialogContent>

            <DialogActions
                sx={{
                    px: 3,
                    py: 2,
                    justifyContent: "flex-end",
                    gap: 1
                }}
            >
                <Button
                    onClick={handleClose}
                    sx={{
                        textTransform: "none",
                        fontWeight: 500,
                        color: "#1967d2",
                        fontSize: "0.875rem",
                        '&:hover': { bgcolor: "#e8f0fe" }
                    }}
                >
                    Cancel
                </Button>
                <Button
                    onClick={handlePost}
                    variant="contained"
                    disabled={loading || !content.trim()}
                    sx={{
                        textTransform: "none",
                        fontWeight: 500,
                        bgcolor: !content.trim() ? "#dadce0" : "#1967d2",
                        color: !content.trim() ? "#80868b" : "#fff",
                        borderRadius: 20,
                        px: 3,
                        fontSize: "0.875rem",
                        boxShadow: "none",
                        "&:hover": {
                            bgcolor: !content.trim() ? "#dadce0" : "#1557b0",
                            boxShadow: "none"
                        },
                        "&.Mui-disabled": {
                            bgcolor: "#dadce0",
                            color: "#80868b"
                        }
                    }}
                >
                    {loading ? <CircularProgress size={20} color="inherit" /> : "Post"}
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default CreateAnnouncementModal;
