import React, { useState, useEffect, useRef } from "react";
import Dialog from "@mui/material/Dialog";
import DialogContent from "@mui/material/DialogContent";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import TextField from "@mui/material/TextField";
import Box from "@mui/material/Box";
import Alert from "@mui/material/Alert";
import CircularProgress from "@mui/material/CircularProgress";
import IconButton from "@mui/material/IconButton";
import CloseIcon from "@mui/icons-material/Close";
import HelpOutlineIcon from "@mui/icons-material/HelpOutline";
import AddIcon from "@mui/icons-material/Add";
import FileUploadOutlinedIcon from "@mui/icons-material/FileUploadOutlined";
import LinkIcon from "@mui/icons-material/Link";
import FormatBoldIcon from "@mui/icons-material/FormatBold";
import FormatItalicIcon from "@mui/icons-material/FormatItalic";
import FormatUnderlinedIcon from "@mui/icons-material/FormatUnderlined";
import FormatListBulletedIcon from "@mui/icons-material/FormatListBulleted";
import FormatStrikethroughIcon from "@mui/icons-material/FormatStrikethrough";
import Select from "@mui/material/Select";
import MenuItem from "@mui/material/MenuItem";
import Checkbox from "@mui/material/Checkbox";
import FormControlLabel from "@mui/material/FormControlLabel";
import PeopleOutlineIcon from "@mui/icons-material/PeopleOutline";
import ArrowDropDownIcon from "@mui/icons-material/ArrowDropDown";
import { clearanceService } from "../../services";
import AssignToModal from "./AssignToModal";

/**
 * CreatePollModal Component
 * Full-screen Google Classroom style modal for creating a Poll / Question
 */

interface CreatePollModalProps {
    open: boolean;
    onClose: () => void;
    organizationId: string;
    organizationName?: string;
    students?: any[];
    onCreated?: () => void;
    isEdit?: boolean;
    editData?: any;
}

const CreatePollModal: React.FC<CreatePollModalProps> = ({
    open,
    onClose,
    organizationId,
    organizationName = "Organization",
    students = [],
    onCreated,
    isEdit = false,
    editData = null
}) => {
    const [question, setQuestion] = useState("");
    const [instructions, setInstructions] = useState("");
    const [pollType, setPollType] = useState("Short answer");
    const [topic, setTopic] = useState("No topic");
    const [isCreatingTopic, setIsCreatingTopic] = useState(false);
    const [newTopic, setNewTopic] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
    const [options, setOptions] = useState<string[]>(["Option 1"]);
    const [selectedIds, setSelectedIds] = useState<string[]>([]);
    const [attachments, setAttachments] = useState<Array<{ type: string, file?: File, url?: string, name: string }>>([]);
    const [status, setStatus] = useState("Pending");
    const [dueDate, setDueDate] = useState<string>("");
    const [studentsCanReply, setStudentsCanReply] = useState(true);
    const [studentsCanEdit, setStudentsCanEdit] = useState(false);

    useEffect(() => {
        if (open) {
            if (isEdit && editData) {
                setQuestion(editData.title || "");
                setInstructions(editData.instructions || "");
                setTopic(editData.topic || "No topic");
                setDueDate(editData.dueDate || "");
                setStatus(editData.status || "Pending");
                if (editData.options && editData.options.length > 0) {
                    setOptions(editData.options);
                } else {
                    setOptions(["Option 1"]);
                }

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
                if (students && students.length > 0) {
                    setSelectedIds(students.map(s => s.userId?._id || s.user?._id || s._id));
                }
            }
        }
    }, [open, isEdit, editData, students]);

    const handleToggleAllAssign = () => {
        if (selectedIds.length === students.length) {
            setSelectedIds([]);
        } else {
            setSelectedIds(students.map(s => s.userId?._id || s.user?._id || s._id));
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
                return userObj.fullName || `${userObj.firstName || ''} ${userObj.lastName || ''}`.trim() || '1 student';
            }
            return "1 student";
        }
        return `${selectedIds.length} students`;
    };

    const handleCreate = async () => {
        if (!question.trim()) {
            setError("Question is required.");
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const finalTopic = isCreatingTopic ? newTopic : (topic === "No topic" ? undefined : topic);

            const formData = new FormData();
            formData.append('title', question);
            formData.append('description', pollType);
            formData.append('instructions', instructions);
            if (finalTopic) formData.append('topic', finalTopic);
            formData.append('organizationId', organizationId);
            formData.append('type', 'poll');
            formData.append('status', status);
            if (dueDate) formData.append('dueDate', dueDate);

            if (selectedIds.length !== students.length && selectedIds.length > 0) {
                formData.append('assignedTo', JSON.stringify(selectedIds));
            }

            if (pollType === "Multiple choice") {
                const validOptions = options.filter(opt => opt.trim() !== "");
                if (validOptions.length > 0) {
                    formData.append('options', JSON.stringify(validOptions));
                }
            }

            const urlAttachments = attachments.filter(a => !a.file).map(a => ({ name: a.name, url: a.url, type: a.type }));
            if (urlAttachments.length > 0) {
                formData.append('attachments', JSON.stringify(urlAttachments));
            }

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
            setError(err.message || "Failed to create poll. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    const handleClose = () => {
        setQuestion("");
        setInstructions("");
        setTopic("No topic");
        setIsCreatingTopic(false);
        setNewTopic("");
        setStatus("Pending");
        setDueDate("");
        setStudentsCanReply(true);
        setStudentsCanEdit(false);
        setError(null);
        setAttachments([]);
        setOptions(["Option 1"]);
        onClose();
    };

    const handleUrlAttachment = (promptMsg: string, type: string) => {
        const url = window.prompt(`Enter ${promptMsg} URL:`);
        if (url) {
            let name = type + " Attachment";
            try { name = new URL(url).hostname; } catch (e) { }
            setAttachments(prev => [...prev, { type, url, name }]);
        }
    };

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            const newFiles = Array.from(e.target.files).map(file => ({
                type: 'File',
                file,
                name: file.name
            }));
            setAttachments(prev => [...prev, ...newFiles]);
        }
        e.target.value = '';
    };

    return (
        <Dialog fullScreen open={open} onClose={handleClose} PaperProps={{ sx: { bgcolor: "#f8f9fa", backgroundImage: 'none' } }}>
            {/* Header / Nav Bar */}
            <Box sx={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                px: 2, py: 1.5, bgcolor: '#fff', borderBottom: '1px solid #e0e0e0', position: 'sticky', top: 0, zIndex: 1100
            }}>
                <Box display="flex" alignItems="center" gap={2}>
                    <IconButton onClick={handleClose} size="small" sx={{ color: "#5f6368" }}><CloseIcon /></IconButton>
                    <Box display="flex" alignItems="center" gap={1.5}>
                        <Box sx={{ width: 36, height: 36, borderRadius: '4px', bgcolor: '#f1f3f4', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <HelpOutlineIcon sx={{ color: '#5f6368', fontSize: 24 }} />
                        </Box>
                        <Box>
                            <Typography sx={{ fontWeight: 400, fontSize: "1.375rem", color: "#3c4043", lineHeight: 1.2 }}>Poll</Typography>
                        </Box>
                    </Box>
                </Box>
                <Box display="flex" alignItems="center" gap={2}>
                    <Button onClick={handleCreate} disabled={loading || !question.trim()} variant="contained"
                        sx={{ bgcolor: "#1a73e8", color: "#fff", textTransform: "none", fontWeight: 500, borderRadius: "20px", px: 4, '&:hover': { bgcolor: "#1557b0" }, boxShadow: 'none' }}>
                        {loading ? <CircularProgress size={24} color="inherit" /> : (isEdit ? "Save" : "Ask")}
                    </Button>
                </Box>
            </Box>

            <DialogContent sx={{ p: 0, display: 'flex', flexDirection: { xs: 'column', md: 'row' }, height: 'calc(100vh - 65px)', overflow: 'hidden' }}>
                {/* Left Content Area (Main) */}
                <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 3, p: { xs: 2, md: 4, lg: 6 }, pb: 10, overflowY: 'auto', alignItems: 'center' }}>
                    <Box sx={{ width: '100%', maxWidth: '800px', display: 'flex', flexDirection: 'column', gap: 3 }}>
                        {error && <Alert severity="error">{error}</Alert>}

                        {/* Question Input Card */}
                        <Box sx={{ bgcolor: '#fff', borderRadius: '8px', border: '1px solid #dadce0', p: 3, display: 'flex', flexDirection: 'column', gap: 2 }}>
                            {/* Top Row: Question & Type */}
                            <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-start' }}>
                                <Box sx={{ flex: 1 }}>
                                    <TextField
                                        fullWidth
                                        variant="filled"
                                        placeholder="Question"
                                        value={question}
                                        onChange={(e) => setQuestion(e.target.value)}
                                        InputProps={{
                                            disableUnderline: true,
                                            sx: { bgcolor: '#f1f3f4', borderRadius: '4px 4px 0 0', pt: 2, pb: 1, borderBottom: '1px solid #5f6368', '&.Mui-focused': { borderBottom: '2px solid #1a73e8', bgcolor: '#f1f3f4' } }
                                        }}
                                    />
                                    <Typography variant="caption" sx={{ color: '#5f6368', mt: 0.5, display: 'block' }}>*Required</Typography>
                                </Box>
                                <Box sx={{ width: 220 }}>
                                    <Select
                                        fullWidth
                                        value={pollType}
                                        onChange={(e) => setPollType(e.target.value)}
                                        IconComponent={ArrowDropDownIcon}
                                        sx={{
                                            bgcolor: '#e8eaed',
                                            borderRadius: '4px',
                                            height: 56,
                                            '.MuiOutlinedInput-notchedOutline': { border: 'none' },
                                            '&:hover': { bgcolor: '#dadce0' }
                                        }}
                                    >
                                        <Typography variant="caption" sx={{ px: 2, pt: 1, color: '#5f6368', display: 'block' }}>Question type</Typography>
                                        <MenuItem value="Short answer" sx={{ py: 1.5 }}>Short answer</MenuItem>
                                        <MenuItem value="Multiple choice" sx={{ py: 1.5 }}>Multiple choice</MenuItem>
                                    </Select>
                                </Box>
                            </Box>

                            {/* Center Row: Instructions */}
                            <Box sx={{ mt: 2 }}>
                                <TextField
                                    fullWidth
                                    variant="standard"
                                    placeholder="Instructions (optional)"
                                    multiline
                                    minRows={4}
                                    value={instructions}
                                    onChange={(e) => setInstructions(e.target.value)}
                                    InputProps={{
                                        disableUnderline: true,
                                        sx: { bgcolor: '#fff', py: 1 }
                                    }}
                                />
                            </Box>

                            {/* Options Area (Only for Multiple choice) */}
                            {pollType === "Multiple choice" && (
                                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, mt: 1 }}>
                                    {options.map((opt, idx) => (
                                        <Box key={idx} sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                            <Box sx={{ width: 22, height: 22, borderRadius: '50%', border: '2px solid #bdc1c6', flexShrink: 0 }} />
                                            <TextField
                                                fullWidth
                                                variant="filled"
                                                placeholder={`Option ${idx + 1}`}
                                                value={opt}
                                                onChange={(e) => {
                                                    const newOpts = [...options];
                                                    newOpts[idx] = e.target.value;
                                                    setOptions(newOpts);
                                                }}
                                                InputProps={{
                                                    disableUnderline: true,
                                                    sx: { bgcolor: '#f1f3f4', borderRadius: '4px', borderBottom: '1px solid #5f6368', '&.Mui-focused': { borderBottom: '2px solid #1a73e8', bgcolor: '#f1f3f4' } },
                                                    endAdornment: options.length > 1 && (
                                                        <IconButton size="small" onClick={() => setOptions(options.filter((_, i) => i !== idx))} sx={{ color: '#5f6368' }}>
                                                            <CloseIcon fontSize="small" />
                                                        </IconButton>
                                                    )
                                                }}
                                            />
                                        </Box>
                                    ))}
                                    <Button
                                        startIcon={<AddIcon />}
                                        onClick={() => setOptions([...options, `Option ${options.length + 1}`])}
                                        sx={{ alignSelf: 'flex-start', color: '#1a73e8', textTransform: 'none', fontWeight: 500, mt: 0.5, pt: 1, pb: 1, pl: 1, pr: 2, borderRadius: '4px', '&:hover': { bgcolor: '#f8f9fa' } }}
                                        disableRipple
                                    >
                                        Add option
                                    </Button>
                                </Box>
                            )}

                            {/* Bottom Row: Formatting */}
                            <Box sx={{ display: 'flex', gap: 0.5, borderTop: '1px solid #f1f3f4', pt: 1, mt: 1 }}>
                                {[
                                    { icon: <FormatBoldIcon fontSize="small" />, id: 'bold' },
                                    { icon: <FormatItalicIcon fontSize="small" />, id: 'italic' },
                                    { icon: <FormatUnderlinedIcon fontSize="small" />, id: 'underline' },
                                    { icon: <FormatListBulletedIcon fontSize="small" />, id: 'list' },
                                    { icon: <FormatStrikethroughIcon fontSize="small" />, id: 'strike' },
                                ].map((fmt) => (
                                    <IconButton key={fmt.id} size="small" sx={{ color: "#5f6368", p: 1, '&:hover': { bgcolor: '#f1f3f4' } }}>{fmt.icon}</IconButton>
                                ))}
                            </Box>
                        </Box>

                        {/* Attachments Card */}
                        <Box sx={{ bgcolor: '#fff', borderRadius: '8px', border: '1px solid #dadce0', p: 3 }}>
                            <Typography sx={{ fontSize: '0.875rem', fontWeight: 500, color: '#3c4043', mb: 3 }}>Attach</Typography>
                            <Box display="flex" gap={4} flexWrap="wrap" justifyContent="center">
                                {[
                                    { src: "https://upload.wikimedia.org/wikipedia/commons/d/da/Google_Drive_logo.png", label: "Drive", action: () => handleUrlAttachment('Drive link', 'Drive') },
                                    { src: "https://upload.wikimedia.org/wikipedia/commons/0/09/YouTube_full-color_icon_%282017%29.svg", label: "YouTube", action: () => handleUrlAttachment('YouTube link', 'YouTube') },
                                    { icon: <FileUploadOutlinedIcon sx={{ fontSize: 24, color: '#5f6368' }} />, label: "Upload", isIcon: true, outlineColor: '#dadce0', action: () => document.getElementById('poll-file-upload-input')?.click() },
                                    { icon: <LinkIcon sx={{ fontSize: 24, color: '#5f6368' }} />, label: "Link", isIcon: true, outlineColor: '#dadce0', action: () => handleUrlAttachment('External link', 'Link') }
                                ].map((item, index) => (
                                    <Box key={index} display="flex" flexDirection="column" alignItems="center" gap={1} sx={{ cursor: 'pointer', '&:hover': { opacity: 0.8 } }} onClick={item.action}>
                                        <Box sx={{ width: 48, height: 48, borderRadius: '50%', border: `1px solid ${item.outlineColor || '#dadce0'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: '#fff' }}>
                                            {item.isIcon ? item.icon : <img src={item.src} alt={item.label} style={{ width: 24, height: 24, objectFit: 'contain' }} />}
                                        </Box>
                                        <Typography sx={{ fontSize: '0.875rem', color: '#3c4043', fontWeight: 400 }}>{item.label}</Typography>
                                    </Box>
                                ))}
                                <input type="file" id="poll-file-upload-input" multiple style={{ display: 'none' }} onChange={handleFileUpload} />
                            </Box>

                            {attachments.length > 0 && (
                                <Box mt={4} display="flex" flexDirection="column" gap={1}>
                                    {attachments.map((attach, idx) => (
                                        <Box key={idx} display="flex" alignItems="center" justifyContent="space-between" sx={{ p: 1.5, border: '1px solid #e0e0e0', borderRadius: '8px' }}>
                                            <Box display="flex" alignItems="center" gap={1.5}>
                                                <Typography sx={{ fontSize: '0.875rem', fontWeight: 500, color: '#3c4043' }} noWrap>{attach.name}</Typography>
                                            </Box>
                                            <IconButton size="small" onClick={() => setAttachments(prev => prev.filter((_, i) => i !== idx))}><CloseIcon fontSize="small" /></IconButton>
                                        </Box>
                                    ))}
                                </Box>
                            )}
                        </Box>
                    </Box>
                </Box>

                {/* Right Settings Sidebar */}
                <Box sx={{
                    width: { xs: '100%', md: 300 }, flexShrink: 0, display: 'flex', flexDirection: 'column', gap: 3,
                    p: { xs: 2, md: 3 }, borderLeft: { md: '1px solid #dadce0' }, bgcolor: '#fff', overflowY: 'auto'
                }}>
                    {/* For Field */}
                    <Box>
                        <Typography sx={{ fontSize: '0.875rem', fontWeight: 500, color: '#3c4043', mb: 1 }}>For</Typography>
                        <Select
                            fullWidth
                            value={organizationId}
                            displayEmpty
                            IconComponent={ArrowDropDownIcon}
                            sx={{
                                height: 48,
                                bgcolor: '#f8f9fa',
                                color: '#5f6368',
                                borderRadius: '4px',
                                '.MuiOutlinedInput-notchedOutline': { border: 'none' },
                                '&:hover': { bgcolor: '#f1f3f4' }
                            }}
                        >
                            <MenuItem value={organizationId}>{organizationName || "Organization"}</MenuItem>
                        </Select>
                    </Box>

                    {/* Assign To Field */}
                    <Box>
                        <Typography sx={{ fontSize: '0.875rem', fontWeight: 500, color: '#3c4043', mb: 1 }}>Assign to</Typography>
                        <Button
                            variant="outlined"
                            fullWidth
                            onClick={() => setIsAssignModalOpen(true)}
                            startIcon={<PeopleOutlineIcon sx={{ color: '#1a73e8' }} />}
                            sx={{
                                color: '#1a73e8',
                                borderColor: '#dadce0',
                                borderRadius: '24px',
                                textTransform: 'none',
                                fontWeight: 500,
                                height: 48,
                                '&:hover': { bgcolor: '#f8f9fa', borderColor: '#dadce0' }
                            }}
                        >
                            {getAssignText()}
                        </Button>
                    </Box>

                    {/* Status Field */}
                    <Box>
                        <Typography sx={{ fontSize: '0.875rem', fontWeight: 500, color: '#3c4043', mb: 1 }}>Status</Typography>
                        <Select
                            value={status}
                            onChange={(e) => setStatus(e.target.value)}
                            displayEmpty
                            IconComponent={ArrowDropDownIcon}
                            sx={{
                                height: 48,
                                width: '50%',
                                minWidth: '120px',
                                bgcolor: '#e8eaed',
                                color: '#3c4043',
                                borderRadius: '4px 4px 0 0',
                                '.MuiOutlinedInput-notchedOutline': { border: 'none', borderBottom: '1px solid #5f6368' },
                                '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderBottom: '2px solid #1a73e8' },
                                '&:hover': { bgcolor: '#dadce0' }
                            }}
                        >
                            <MenuItem value="Pending">Pending</MenuItem>
                            <MenuItem value="Approved">Approved</MenuItem>
                            <MenuItem value="Rejected">Rejected</MenuItem>
                            <MenuItem value="Completed">Completed</MenuItem>
                        </Select>
                    </Box>

                    {/* Due Date Field */}
                    <Box>
                        <Typography sx={{ fontSize: '0.875rem', fontWeight: 500, color: '#3c4043', mb: 1 }}>Due</Typography>
                        <TextField
                            fullWidth
                            type="datetime-local"
                            value={dueDate}
                            onChange={(e) => setDueDate(e.target.value)}
                            size="small"
                            sx={{
                                height: 48,
                                bgcolor: '#f8f9fa',
                                color: '#3c4043',
                                borderRadius: '4px',
                                '& .MuiOutlinedInput-notchedOutline': { border: 'none' },
                                '&:hover': { bgcolor: '#f1f3f4' }
                            }}
                            InputLabelProps={{ shrink: true }}
                        />
                    </Box>

                    {/* Topic Field */}
                    <Box>
                        <Typography sx={{ fontSize: '0.875rem', fontWeight: 500, color: '#3c4043', mb: 1 }}>Topic</Typography>
                        {!isCreatingTopic ? (
                            <Select
                                fullWidth
                                value={topic}
                                onChange={(e) => {
                                    if (e.target.value === "create_new") {
                                        setIsCreatingTopic(true);
                                    } else {
                                        setTopic(e.target.value as string);
                                    }
                                }}
                                displayEmpty
                                IconComponent={ArrowDropDownIcon}
                                sx={{
                                    height: 48,
                                    bgcolor: '#e8eaed',
                                    color: '#3c4043',
                                    borderRadius: '4px 4px 0 0',
                                    '.MuiOutlinedInput-notchedOutline': { border: 'none', borderBottom: '1px solid #5f6368' },
                                    '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderBottom: '2px solid #1a73e8' },
                                    '&:hover': { bgcolor: '#dadce0' }
                                }}
                            >
                                <MenuItem value="No topic">No topic</MenuItem>
                                <MenuItem value="create_new" sx={{ borderTop: '1px solid #e0e0e0' }}>Create topic</MenuItem>
                            </Select>
                        ) : (
                            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                                <Box sx={{ position: "relative", bgcolor: "#f1f3f4", borderRadius: "4px 4px 0 0", borderBottom: "2px solid #1a73e8", width: "100%", display: "flex", alignItems: "center" }}>
                                    <TextField
                                        fullWidth
                                        variant="standard"
                                        placeholder="Topic name"
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
                        )}
                    </Box>

                    {/* Permissions Checkboxes */}
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, mt: 1 }}>
                        <FormControlLabel
                            control={<Checkbox checked={studentsCanReply} onChange={(e) => setStudentsCanReply(e.target.checked)} color="primary" sx={{ color: '#5f6368', '&.Mui-checked': { color: '#1a73e8' } }} />}
                            label={<Typography sx={{ fontSize: '0.875rem', color: '#3c4043' }}>Students can reply to each other</Typography>}
                        />
                        <FormControlLabel
                            control={<Checkbox checked={studentsCanEdit} onChange={(e) => setStudentsCanEdit(e.target.checked)} color="primary" sx={{ color: '#5f6368', '&.Mui-checked': { color: '#1a73e8' } }} />}
                            label={<Typography sx={{ fontSize: '0.875rem', color: '#3c4043' }}>Students can edit answer</Typography>}
                        />
                    </Box>
                </Box>
            </DialogContent>

            <AssignToModal
                open={isAssignModalOpen}
                onClose={() => setIsAssignModalOpen(false)}
                students={students}
                selectedIds={selectedIds}
                onToggleAll={handleToggleAllAssign}
                onToggle={handleToggleAssign}
            />
        </Dialog>
    );
};

export default CreatePollModal;
