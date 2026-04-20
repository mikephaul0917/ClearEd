import React, { useState, useEffect, useRef } from "react";
import Dialog from "@mui/material/Dialog";
import DialogContent from "@mui/material/DialogContent";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import TextField from "@mui/material/TextField";
import Box from "@mui/material/Box";
import FormControlLabel from "@mui/material/FormControlLabel";
import Switch from "@mui/material/Switch";
import Alert from "@mui/material/Alert";
import CircularProgress from "@mui/material/CircularProgress";
import IconButton from "@mui/material/IconButton";
import CloseIcon from "@mui/icons-material/Close";
import BookIcon from "@mui/icons-material/Book";
import ArrowDropDownIcon from "@mui/icons-material/ArrowDropDown";
import AddIcon from "@mui/icons-material/Add";
import FormatBoldIcon from "@mui/icons-material/FormatBold";
import FormatItalicIcon from "@mui/icons-material/FormatItalic";
import FormatUnderlinedIcon from "@mui/icons-material/FormatUnderlined";
import FormatListBulletedIcon from "@mui/icons-material/FormatListBulleted";
import FormatStrikethroughIcon from "@mui/icons-material/FormatStrikethrough";
import Select from "@mui/material/Select";
import MenuItem from "@mui/material/MenuItem";
import Chip from "@mui/material/Chip";
import PeopleOutlineIcon from "@mui/icons-material/PeopleOutline";
import Divider from "@mui/material/Divider";
import { clearanceService } from "../../services";
import AssignToModal from "./AssignToModal";
import AddLinkModal from "./AddLinkModal";

/**
 * CreateMaterialModal Component
 * Full-screen Google Classroom style modal for creating replacing the generic dialog.
 */

interface CreateMaterialModalProps {
    open: boolean;
    onClose: () => void;
    organizationId: string;
    organizationName?: string;
    students?: any[];
    editData?: any;
    joinCode?: string;
    onCreated?: () => void;
    isEdit?: boolean;
    institutionId: string;
    termId: string;
}

const CreateMaterialModal: React.FC<CreateMaterialModalProps> = ({
    open,
    onClose,
    organizationId,
    organizationName = "Organization",
    students = [],
    onCreated,
    isEdit = false,
    editData = null,
    joinCode,
    institutionId,
    termId
}) => {
    const [title, setTitle] = useState("");
    const [instructions, setInstructions] = useState("");
    const [topic, setTopic] = useState("No topic");
    const [isCreatingTopic, setIsCreatingTopic] = useState(false);
    const [newTopic, setNewTopic] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
    const [selectedIds, setSelectedIds] = useState<string[]>([]);
    const [attachments, setAttachments] = useState<Array<{ type: string, file?: File, url?: string, name: string }>>([]);
    const [activeFormats, setActiveFormats] = useState({
        bold: false,
        italic: false,
        underline: false,
        strikeThrough: false,
        insertUnorderedList: false
    });
    const [linkModal, setLinkModal] = useState<{
        open: boolean;
        type: string;
        title: string;
        description: string;
        placeholder: string;
    }>({
        open: false,
        type: "Link",
        title: "",
        description: "",
        placeholder: ""
    });
    const editorRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (open) {
            if (isEdit && editData) {
                setTitle(editData.title || "");
                setInstructions(editData.instructions || "");
                setTopic(editData.topic || "No topic");

                // if there's already an editor loaded, set its innerHTML
                if (editorRef.current) {
                    editorRef.current.innerHTML = editData.instructions || "";
                }

                // For pre-selected students
                if (editData.assignedTo && editData.assignedTo.length > 0) {
                    setSelectedIds(editData.assignedTo.map((a: any) => a._id || a));
                } else if (students && students.length > 0) {
                    setSelectedIds(students.map(s => s.userId?._id || s.user?._id || s._id));
                }

                if (editData.attachments && Array.isArray(editData.attachments)) {
                    setAttachments(editData.attachments.map((a: any) => ({ ...a, type: a.type || 'Link' })));
                } else {
                    setAttachments([]);
                }
            } else {
                // Not edit mode, ensure default select all students
                if (students && students.length > 0) {
                    setSelectedIds(students.map(s => s.userId?._id || s.user?._id || s._id));
                }
            }
        }
    }, [open, isEdit, editData, students]);

    const handleToggleAllAssign = () => {
        if (selectedIds.length === students.length) {
            setSelectedIds([]); // Deselect all
        } else {
            setSelectedIds(students.map(s => s.userId?._id || s.user?._id || s._id)); // Select all
        }
    };

    const handleToggleAssign = (id: string) => {
        setSelectedIds(prev =>
            prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
        );
    };

    const getAssignText = () => {
        if (students.length === 0) return "All members";
        if (selectedIds.length === students.length) return "All members";
        if (selectedIds.length === 1) {
            const student = students.find(s => (s.userId?._id || s.user?._id || s._id) === selectedIds[0]);
            const userObj = student?.userId || student?.user;
            if (userObj) {
                return userObj.fullName || `${userObj.firstName || ''} ${userObj.lastName || ''}`.trim() || '1 member';
            }
            return "1 member";
        }
        return `${selectedIds.length} members`;
    };

    const handleCreate = async () => {
        if (!title.trim()) {
            setError("Title is required.");
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const finalTopic = isCreatingTopic ? newTopic : (topic === "No topic" ? undefined : topic);

            const formData = new FormData();
            formData.append('title', title);
            formData.append('description', title); // Using title as fallback description
            formData.append('instructions', instructions);
            if (finalTopic) formData.append('topic', finalTopic);
            formData.append('organizationId', organizationId);
            if (institutionId) formData.append('institutionId', institutionId);
            if (termId) formData.append('termId', termId);
            formData.append('isAnnouncement', 'false');
            formData.append('type', 'material');

            if (selectedIds.length !== students.length && selectedIds.length > 0) {
                selectedIds.forEach(id => formData.append('assignedTo', id));
            }

            // Handle URL Attachments
            const urlAttachments = attachments.filter(a => !a.file).map(a => ({ name: a.name, url: a.url, type: a.type }));
            if (urlAttachments.length > 0) {
                formData.append('attachments', JSON.stringify(urlAttachments));
            }

            // Handle File Uploads
            attachments.filter(a => a.file).forEach(a => {
                formData.append('files', a.file as Blob);
            });

            if (isEdit && editData) {
                await clearanceService.updateRequirement(editData._id, formData);
            } else {
                await clearanceService.createRequirement(formData);
            }

            onCreated?.();
            handleClose();
        } catch (err: any) {
            setError(err.response?.data?.message || "Failed to create requirement. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    const handleUrlAttachment = (promptText: string, type: string) => {
        setLinkModal({
            open: true,
            type,
            title: `Add ${type} Resource`,
            description: `Please enter the ${type === 'Link' ? '' : type.toLowerCase() + ' '}link below to attach it as a resource.`,
            placeholder: `${type} Link`
        });
    };

    const onAddLinkResource = (url: string) => {
        let parsedUrl = url.trim();
        if (!parsedUrl.startsWith('http://') && !parsedUrl.startsWith('https://')) {
            parsedUrl = 'https://' + parsedUrl;
        }
        setAttachments(prev => [...prev, { type: linkModal.type, url: parsedUrl, name: parsedUrl }]);
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
        // Reset the input so the same file could be selected again if it were deleted
        e.target.value = '';
    };

    const handleFormat = (e: React.MouseEvent, command: string) => {
        e.preventDefault();
        document.execCommand(command, false);
        checkFormatState();
        if (editorRef.current) {
            setInstructions(editorRef.current.innerHTML);
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
        setTitle("");
        setInstructions("");
        if (editorRef.current) {
            editorRef.current.innerHTML = "";
        }
        setTopic("No topic");
        setIsCreatingTopic(false);
        setNewTopic("");
        setAttachments([]);
        setError(null);
        onClose();
    };

    return (
        <Dialog
            open={open}
            onClose={handleClose}
            fullScreen
            PaperProps={{ sx: { bgcolor: "#f8f9fa" } }}
        >
            {/* Header */}
            <Box
                sx={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    px: { xs: 1.5, sm: 3 },
                    py: { xs: 1, sm: 2 },
                    bgcolor: "white",
                    borderBottom: "1px solid #e0e0e0",
                    position: 'sticky',
                    top: 0,
                    zIndex: 1100
                }}
            >
                <Box display="flex" alignItems="center" gap={{ xs: 1, sm: 2 }}>
                    <IconButton edge="start" color="inherit" onClick={handleClose} aria-label="close">
                        <CloseIcon sx={{ color: "#5f6368" }} />
                    </IconButton>
                    <Box display="flex" alignItems="center" gap={1.5} sx={{ color: "#5f6368", bgcolor: "#f1f3f4", p: 1, borderRadius: 1 }}>
                        <BookIcon sx={{ color: "#0D9488", fontSize: { xs: 20, sm: 24 } }} />
                    </Box>
                    <Typography variant="h6" sx={{ color: "#3c4043", fontWeight: 400, fontSize: { xs: "1.125rem", sm: "1.375rem" } }}>
                        Material
                    </Typography>
                </Box>

                <Box display="flex" alignItems="center" gap={2}>
                    <Button
                        variant="contained"
                        onClick={handleCreate}
                        disabled={loading || !title.trim()}
                        sx={{
                            bgcolor: "#3c4043",
                            color: "white",
                            textTransform: "none",
                            fontWeight: 500,
                            borderRadius: '8px',
                            px: { xs: 2.5, sm: 3 },
                            boxShadow: "none",
                            "&:hover": { bgcolor: "#202124", boxShadow: "none" },
                            "&.Mui-disabled": { bgcolor: "#e8eaed", color: "#9aa0a6" }
                        }}
                    >
                        {loading ? <CircularProgress size={20} color="inherit" /> : (isEdit ? "Save" : "Assign")}
                    </Button>
                </Box>
            </Box>

            <DialogContent sx={{ p: 0, display: "flex", flexDirection: { xs: 'column', md: 'row' }, height: "calc(100vh - 69px)", overflow: 'hidden' }}>
                {/* Main Content Area (Left) */}
                <Box sx={{ flex: 1, p: { xs: 1.5, sm: 4 }, overflowY: "auto", display: 'flex', justifyContent: 'center' }}>
                    <Box sx={{ maxWidth: 800, width: "100%", display: "flex", flexDirection: "column", gap: { xs: 2, md: 3 } }}>

                        {error && (
                            <Alert severity="error" sx={{ borderRadius: 2 }}>
                                {error}
                            </Alert>
                        )}

                        {/* Title and Instructions Card */}
                        <Box sx={{ bgcolor: "white", borderRadius: 2, p: 0, border: "1px solid #dadce0", overflow: "visible" }}>
                            {/* Title Input */}
                            <Box sx={{ p: { xs: 2, sm: 3 }, bgcolor: "#f1f3f4", borderBottom: "1px solid #dadce0" }}>
                                <TextField
                                    fullWidth
                                    placeholder="Title"
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                    variant="standard"
                                    InputProps={{
                                        disableUnderline: true,
                                        sx: { fontSize: "1.25rem", color: "#3c4043", '& ::placeholder': { color: '#80868b', opacity: 1 } }
                                    }}
                                />
                            </Box>

                            {/* Formatting Toolbar */}
                            <Box sx={{ display: "flex", gap: 0.5, px: 2, py: 1, borderBottom: "1px solid #dadce0" }}>
                                <IconButton size="small" sx={{ color: activeFormats.bold ? "#0D9488" : "#5f6368", bgcolor: activeFormats.bold ? "#e8f0fe" : "transparent" }} onMouseDown={(e) => handleFormat(e, "bold")}><FormatBoldIcon fontSize="small" /></IconButton>
                                <IconButton size="small" sx={{ color: activeFormats.italic ? "#0D9488" : "#5f6368", bgcolor: activeFormats.italic ? "#e8f0fe" : "transparent" }} onMouseDown={(e) => handleFormat(e, "italic")}><FormatItalicIcon fontSize="small" /></IconButton>
                                <IconButton size="small" sx={{ color: activeFormats.underline ? "#0D9488" : "#5f6368", bgcolor: activeFormats.underline ? "#e8f0fe" : "transparent" }} onMouseDown={(e) => handleFormat(e, "underline")}><FormatUnderlinedIcon fontSize="small" /></IconButton>
                                <IconButton size="small" sx={{ color: activeFormats.insertUnorderedList ? "#0D9488" : "#5f6368", bgcolor: activeFormats.insertUnorderedList ? "#e8f0fe" : "transparent" }} onMouseDown={(e) => handleFormat(e, "insertUnorderedList")}><FormatListBulletedIcon fontSize="small" /></IconButton>
                                <IconButton size="small" sx={{ color: activeFormats.strikeThrough ? "#0D9488" : "#5f6368", bgcolor: activeFormats.strikeThrough ? "#e8f0fe" : "transparent" }} onMouseDown={(e) => handleFormat(e, "strikeThrough")}><FormatStrikethroughIcon fontSize="small" /></IconButton>
                            </Box>

                            {/* Instructions Input */}
                            <Box sx={{ p: 3 }}>
                                <Box
                                    ref={editorRef}
                                    contentEditable
                                    suppressContentEditableWarning
                                    onInput={(e) => setInstructions(e.currentTarget.innerHTML)}
                                    onKeyUp={checkFormatState}
                                    onMouseUp={checkFormatState}
                                    sx={{
                                        minHeight: "150px",
                                        outline: "none",
                                        fontSize: "0.9375rem",
                                        color: "#3c4043",
                                        fontFamily: '"Roboto","Helvetica","Arial",sans-serif',
                                        "&:empty:before": {
                                            content: '"Instructions (optional)"',
                                            color: "#80868b",
                                            pointerEvents: "none",
                                            display: "block",
                                        }
                                    }}
                                />
                            </Box>
                        </Box>

                        {/* Attachments Card (Placeholder for now) */}
                        <Box sx={{ bgcolor: "white", borderRadius: 2, p: { xs: 2, sm: 3 }, border: "1px solid #dadce0" }}>
                            <Typography sx={{ fontSize: "0.875rem", fontWeight: 500, color: "#3c4043", mb: 2 }}>
                                Attach
                            </Typography>
                            <Box sx={{ display: "flex", gap: 3, justifyContent: "center", py: 2 }}>
                                {[
                                    { src: "https://upload.wikimedia.org/wikipedia/commons/d/da/Google_Drive_logo.png", label: "Drive", action: () => handleUrlAttachment('Drive link', 'Drive') },
                                    { src: "https://upload.wikimedia.org/wikipedia/commons/0/09/YouTube_full-color_icon_%282017%29.svg", label: "YouTube", action: () => handleUrlAttachment('YouTube link', 'YouTube') },
                                    { icon: <Box component="span" sx={{ fontSize: 24 }}>↑</Box>, label: "Upload", isIcon: true, action: () => document.getElementById('requirement-file-upload-input')?.click() },
                                    { icon: <Box component="span" sx={{ fontSize: 24 }}>🔗</Box>, label: "Link", isIcon: true, action: () => handleUrlAttachment('External link', 'Link') }
                                ].map((item, index) => (
                                    <Box key={index} onClick={item.action} sx={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 1, cursor: "pointer", "&:hover": { opacity: 0.8 } }}>
                                        <Box sx={{ width: 48, height: 48, borderRadius: "50%", border: "1px solid #dadce0", display: "flex", alignItems: "center", justifyContent: "center", bgcolor: "white" }}>
                                            {item.isIcon ? item.icon : <img src={item.src} alt={item.label} style={{ width: 24, height: 24 }} />}
                                        </Box>
                                        <Typography sx={{ fontSize: "0.75rem", color: "#3c4043", fontWeight: 500 }}>{item.label}</Typography>
                                    </Box>
                                ))}
                                <input
                                    type="file"
                                    id="requirement-file-upload-input"
                                    multiple
                                    style={{ display: 'none' }}
                                    onChange={handleFileUpload}
                                />
                            </Box>

                            {/* Render Attachments */}
                            {attachments.length > 0 && (
                                <Box sx={{ mt: 3, display: 'flex', flexDirection: 'column', gap: 1 }}>
                                    <Typography sx={{ fontSize: "0.875rem", fontWeight: 500, color: "#3c4043", mb: 1 }}>Selected Attachments</Typography>
                                    {attachments.map((att, idx) => (
                                        <Box key={idx} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', p: 1.5, border: '1px solid #dadce0', borderRadius: 1 }}>
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, overflow: 'hidden' }}>
                                                {att.type === 'Drive' ? <img src="https://upload.wikimedia.org/wikipedia/commons/d/da/Google_Drive_logo.png" width={20} alt="Drive" /> :
                                                    att.type === 'YouTube' ? <img src="https://upload.wikimedia.org/wikipedia/commons/0/09/YouTube_full-color_icon_%282017%29.svg" width={20} alt="YouTube" /> :
                                                        att.type === 'Link' ? <Box component="span" sx={{ fontSize: 20 }}>🔗</Box> :
                                                            <BookIcon sx={{ color: "#0D9488", fontSize: 20 }} />}
                                                <Typography sx={{ fontSize: "0.875rem", color: "#0D9488", fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
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
                        </Box>

                    </Box>
                </Box>

                {/* Settings Sidebar (Right) */}
                <Box sx={{
                    width: { xs: '100%', md: 300 },
                    bgcolor: "white",
                    borderLeft: { md: "1px solid #e0e0e0" },
                    borderTop: { xs: "1px solid #e0e0e0", md: "none" },
                    p: { xs: 2, sm: 3 },
                    display: "flex",
                    flexDirection: "column",
                    gap: 3,
                    overflowY: "auto",
                    maxHeight: { xs: '250px', md: 'none' }
                }}>

                    {/* For */}
                    <Box>
                        <Typography sx={{ fontSize: "0.875rem", fontWeight: 500, color: "#3c4043", mb: 1 }}>For</Typography>
                        <Select
                            fullWidth
                            size="small"
                            value={organizationId}
                            sx={{ bgcolor: "#f1f3f4", '& .MuiOutlinedInput-notchedOutline': { border: 'none' }, borderRadius: 1 }}
                        >
                            <MenuItem value={organizationId}>{organizationName || "Current Organization"}</MenuItem>
                        </Select>
                    </Box>

                    {/* Assign To */}
                    <Box>
                        <Typography sx={{ fontSize: "0.875rem", fontWeight: 500, color: "#3c4043", mb: 1 }}>Assign to</Typography>
                        <Button
                            variant="outlined"
                            fullWidth
                            startIcon={<PeopleOutlineIcon sx={{ color: "#0D9488" }} />}
                            onClick={() => setIsAssignModalOpen(true)}
                            sx={{
                                justifyContent: "flex-start",
                                borderColor: "#dadce0",
                                color: "#0D9488",
                                textTransform: "none",
                                fontWeight: 500,
                                borderRadius: 10,
                                py: 1
                            }}
                        >
                            {getAssignText()}
                        </Button>
                    </Box>


                    <Divider />

                    {/* Topic */}
                    <Box>
                        <Typography sx={{ fontSize: "0.875rem", fontWeight: 500, color: "#3c4043", mb: 1 }}>Topic</Typography>
                        {isCreatingTopic ? (
                            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                                <Box sx={{ position: "relative", bgcolor: "#f1f3f4", borderRadius: "4px 4px 0 0", borderBottom: "2px solid #0D9488", width: "100%", display: "flex", alignItems: "center" }}>
                                    <TextField
                                        fullWidth
                                        variant="standard"
                                        value={newTopic}
                                        onChange={(e) => {
                                            if (e.target.value.length <= 100) {
                                                setNewTopic(e.target.value);
                                            }
                                        }}
                                        autoFocus
                                        InputProps={{
                                            disableUnderline: true,
                                            sx: { fontSize: "0.875rem", color: "#3c4043", p: 1.5, pl: 2 }
                                        }}
                                    />
                                    <IconButton
                                        size="small"
                                        onClick={() => {
                                            setIsCreatingTopic(false);
                                            setNewTopic("");
                                            setTopic("No topic");
                                        }}
                                        sx={{ mr: 1, color: "#5f6368" }}
                                    >
                                        <CloseIcon fontSize="small" />
                                    </IconButton>
                                </Box>
                                <Typography sx={{ fontSize: "0.75rem", color: "#5f6368", mt: 0.5 }}>
                                    {newTopic.length}/100
                                </Typography>
                            </Box>
                        ) : (
                            <Select
                                fullWidth
                                size="small"
                                value={topic}
                                onChange={(e) => {
                                    if (e.target.value === "Create topic") {
                                        setIsCreatingTopic(true);
                                    } else {
                                        setTopic(e.target.value);
                                    }
                                }}
                                sx={{ bgcolor: "#f1f3f4", '& .MuiOutlinedInput-notchedOutline': { border: 'none' }, borderRadius: 1 }}
                            >
                                <MenuItem value="No topic">No topic</MenuItem>
                                <MenuItem value="Create topic">Create topic</MenuItem>
                            </Select>
                        )}
                    </Box>

                </Box>
            </DialogContent>

            {/* Assign To Sub-Modal */}
            <AssignToModal
                open={isAssignModalOpen}
                onClose={() => setIsAssignModalOpen(false)}
                students={students}
                selectedIds={selectedIds}
                onToggle={handleToggleAssign}
                onToggleAll={handleToggleAllAssign}
                joinCode={joinCode}
            />

            <AddLinkModal
                open={linkModal.open}
                onClose={() => setLinkModal(prev => ({ ...prev, open: false }))}
                onAdd={onAddLinkResource}
                title={linkModal.title}
                description={linkModal.description}
                placeholder={linkModal.placeholder}
            />
        </Dialog>
    );
};

export default CreateMaterialModal;

