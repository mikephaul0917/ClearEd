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
import AssignmentIcon from "@mui/icons-material/Assignment";
import AddIcon from "@mui/icons-material/Add";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import HelpOutlineIcon from "@mui/icons-material/HelpOutline";
import FileUploadOutlinedIcon from "@mui/icons-material/FileUploadOutlined";
import LinkIcon from "@mui/icons-material/Link";
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
 * CreateFormModal Component
 * Full-screen Google Classroom style modal for creating a Poll
 */

interface CreateFormModalProps {
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

const CreateFormModal: React.FC<CreateFormModalProps> = ({
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
    const [question, setQuestion] = useState("");
    const [instructions, setInstructions] = useState("");
    const [topic, setTopic] = useState("No topic");
    const [isCreatingTopic, setIsCreatingTopic] = useState(false);
    const [newTopic, setNewTopic] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
    const [selectedIds, setSelectedIds] = useState<string[]>([]);
    const [attachments, setAttachments] = useState<Array<{ type: string, file?: File, url?: string, name: string }>>([]);
    const [status, setStatus] = useState("Pending");
    const [dueDate, setDueDate] = useState<string>("");
    const [showBlankQuiz, setShowBlankQuiz] = useState(true);
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

    useEffect(() => {
        if (open) {
            if (isEdit && editData) {
                setQuestion(editData.title || "");
                setInstructions(editData.instructions || "");
                setTopic(editData.topic || "No topic");
                setStatus(editData.status || "Pending");
                setDueDate(editData.dueDate || "");

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
            setError("Title is required.");
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const finalTopic = isCreatingTopic ? newTopic : (topic === "No topic" ? undefined : topic);

            const formData = new FormData();
            formData.append('title', question);
            formData.append('description', instructions || "Form Assignment");
            formData.append('instructions', instructions);
            if (finalTopic) formData.append('topic', finalTopic);
            formData.append('organizationId', organizationId);
            if (institutionId) formData.append('institutionId', institutionId);
            if (termId) formData.append('termId', termId);
            formData.append('type', 'form');
            formData.append('status', status);
            if (dueDate) formData.append('dueDate', dueDate);

            if (selectedIds.length !== students.length && selectedIds.length > 0) {
                formData.append('assignedTo', JSON.stringify(selectedIds));
            }

            const urlAttachments = attachments.filter(a => !a.file).map(a => ({ name: a.name, url: a.url, type: a.type }));
            // For now, attaching the Blank Quiz URL directly since we don't have a Google Forms API connection
            const formAttachment = { name: "Blank Quiz", url: "https://docs.google.com/forms", type: "Link" };
            formData.append('attachments', JSON.stringify([formAttachment, ...urlAttachments]));

            attachments.filter(a => a.file).forEach(a => {
                formData.append('files', a.file as Blob);
            });

            // Note: Since we reused the Poll endpoint but removed options, it might fail compilation on the backend
            // In a real scenario, we'll want to build a "Forms" backend or route this through regular Requirements
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
        setDueDate("");
        setStatus("Pending");
        setError(null);
        setAttachments([]);
        setShowBlankQuiz(true);
        onClose();
    };

    const handleUrlAttachment = (promptMsg: string, type: string) => {
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
        let name = linkModal.type + " Attachment";
        try { name = new URL(parsedUrl).hostname; } catch (e) { }
        setAttachments(prev => [...prev, { type: linkModal.type, url: parsedUrl, name }]);
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
    };

    return (
        <Dialog fullScreen open={open} onClose={handleClose} PaperProps={{ sx: { bgcolor: "#f8f9fa" } }}>
            {/* Nav Bar */}
            <Box sx={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                px: { xs: 1.5, sm: 2 }, py: { xs: 1, sm: 1.5 }, bgcolor: '#fff', borderBottom: '1px solid #e0e0e0', position: 'sticky', top: 0, zIndex: 1100
            }}>
                <Box display="flex" alignItems="center" gap={{ xs: 1, sm: 2 }}>
                    <IconButton onClick={handleClose} size="small"><CloseIcon /></IconButton>
                    <Box display="flex" alignItems="center" gap={1.5}>
                        <Box sx={{
                            width: { xs: 32, sm: 36 },
                            height: { xs: 32, sm: 36 },
                            borderRadius: '50%',
                            bgcolor: '#e8f0fe',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                        }}>
                            <AssignmentIcon sx={{ color: '#0D9488', fontSize: { xs: 18, sm: 20 } }} />
                        </Box>
                        <Box>
                            <Typography sx={{ fontWeight: 500, fontSize: { xs: "1rem", sm: "1.125rem" }, color: "#202124", lineHeight: 1.2 }}>Form</Typography>
                        </Box>
                    </Box>
                </Box>
                <Box display="flex" alignItems="center" gap={2}>
                    <Button onClick={handleCreate} disabled={loading || !question.trim()} variant="contained"
                        sx={{ bgcolor: "#3c4043", color: "#fff", textTransform: "none", fontWeight: 500, borderRadius: "20px", px: { xs: 2.5, sm: 3 }, '&:hover': { bgcolor: "#202124" } }}>
                        {loading ? <CircularProgress size={24} color="inherit" /> : (isEdit ? "Save" : "Assign")}
                    </Button>
                </Box>
            </Box>

            <DialogContent sx={{
                p: 0,
                display: 'flex',
                flexDirection: { xs: 'column', md: 'row' },
                height: 'calc(100vh - 69px)',
                overflow: 'hidden',
                bgcolor: '#f8f9fa'
            }}>
                {/* Left Content Area */}
                <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', gap: { xs: 2, md: 3 }, p: { xs: 1.5, md: 4 }, overflowY: 'auto' }}>
                    {error && <Alert severity="error">{error}</Alert>}

                    {/* Question & Instructions Box */}
                    <Box sx={{ bgcolor: '#fff', borderRadius: '8px', border: '1px solid #dadce0', overflow: 'visible' }}>
                        <Box sx={{ p: { xs: 2, sm: 3 }, display: 'flex', flexDirection: 'column', gap: { xs: 2, md: 3 } }}>
                            <TextField
                                fullWidth variant="filled" label="Title" required
                                value={question} onChange={(e) => setQuestion(e.target.value)}
                                InputProps={{
                                    disableUnderline: true,
                                    sx: { bgcolor: '#f1f3f4', borderRadius: '4px', '&.Mui-focused': { bgcolor: '#e8eaed' } }
                                }}
                            />

                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                                <Box sx={{ display: 'flex', gap: 0.5, px: 1 }}>
                                    {[
                                        { icon: <FormatBoldIcon fontSize="small" />, id: 'bold' },
                                        { icon: <FormatItalicIcon fontSize="small" />, id: 'italic' },
                                        { icon: <FormatUnderlinedIcon fontSize="small" />, id: 'underline' },
                                        { icon: <FormatListBulletedIcon fontSize="small" />, id: 'list' },
                                        { icon: <FormatStrikethroughIcon fontSize="small" />, id: 'strike' },
                                    ].map((fmt) => (
                                        <IconButton key={fmt.id} size="small" sx={{ color: "#5f6368", p: 0.5 }}>{fmt.icon}</IconButton>
                                    ))}
                                </Box>
                                <TextField
                                    fullWidth variant="filled" label="Instructions (optional)" multiline minRows={4}
                                    value={instructions} onChange={(e) => setInstructions(e.target.value)}
                                    InputProps={{
                                        disableUnderline: true,
                                        sx: { bgcolor: '#f1f3f4', borderRadius: '4px', '&.Mui-focused': { bgcolor: '#e8eaed' } }
                                    }}
                                />
                            </Box>
                        </Box>

                        {/* Blank Quiz Element */}
                        {showBlankQuiz && (
                            <Box sx={{ p: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid #dadce0', borderBottom: '1px solid #dadce0' }}>
                                <Box display="flex" alignItems="center" gap={2}>
                                    <Box sx={{
                                        width: 48, height: 48, borderRadius: '4px', bgcolor: '#f1f3f4',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid #dadce0'
                                    }}>
                                        <AssignmentIcon sx={{ color: '#673ab7', fontSize: 24 }} />
                                    </Box>
                                    <Box>
                                        <Typography
                                            component="a"
                                            href="https://docs.google.com/forms/u/0/create"
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            sx={{ fontSize: '0.875rem', fontWeight: 500, color: '#0D9488', textDecoration: 'underline', cursor: 'pointer', display: 'block', '&:hover': { color: '#1557b0' } }}
                                        >
                                            Blank Quiz
                                        </Typography>
                                        <Typography sx={{ fontSize: '0.75rem', color: '#5f6368' }}>Google Forms</Typography>
                                    </Box>
                                </Box>
                                <IconButton size="small" onClick={() => setShowBlankQuiz(false)}>
                                    <CloseIcon fontSize="small" />
                                </IconButton>
                            </Box>
                        )}
                    </Box>

                    {/* Attachments Area */}
                    <Box sx={{ bgcolor: '#fff', borderRadius: '8px', border: '1px solid #dadce0', p: 3 }}>
                        <Typography sx={{ fontSize: '0.875rem', fontWeight: 500, color: '#3c4043', mb: 2 }}>Attach</Typography>
                        <Box display="flex" gap={3} flexWrap="wrap" justifyContent="center">
                            {[
                                { src: "https://upload.wikimedia.org/wikipedia/commons/d/da/Google_Drive_logo.png", label: "Drive", action: () => handleUrlAttachment('Drive link', 'Drive') },
                                { src: "https://upload.wikimedia.org/wikipedia/commons/0/09/YouTube_full-color_icon_%282017%29.svg", label: "YouTube", action: () => handleUrlAttachment('YouTube link', 'YouTube') },
                                { icon: <FileUploadOutlinedIcon sx={{ fontSize: 24, color: '#5f6368' }} />, label: "Upload", isIcon: true, action: () => document.getElementById('poll-file-upload-input')?.click() },
                                { icon: <LinkIcon sx={{ fontSize: 24, color: '#5f6368' }} />, label: "Link", isIcon: true, action: () => handleUrlAttachment('External link', 'Link') }
                            ].map((item, index) => (
                                <Box key={index} display="flex" flexDirection="column" alignItems="center" gap={1} sx={{ cursor: 'pointer', '&:hover': { opacity: 0.8 } }} onClick={item.action}>
                                    <Box sx={{ width: 48, height: 48, borderRadius: '50%', border: '1px solid #dadce0', display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: '#fff' }}>
                                        {item.isIcon ? item.icon : <img src={item.src} alt={item.label} style={{ width: 24, height: 24, objectFit: 'contain' }} />}
                                    </Box>
                                    <Typography sx={{ fontSize: '0.875rem', color: '#3c4043', fontWeight: 400 }}>{item.label}</Typography>
                                </Box>
                            ))}
                            <input type="file" id="poll-file-upload-input" multiple style={{ display: 'none' }} onChange={handleFileUpload} />
                        </Box>

                        {attachments.length > 0 && (
                            <Box mt={3} display="flex" flexDirection="column" gap={1}>
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

                {/* Right Settings Sidebar */}
                <Box sx={{
                    width: { xs: '100%', md: 300 },
                    flexShrink: 0,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 3,
                    p: { xs: 2, md: 3 },
                    borderLeft: { md: '1px solid #dadce0' },
                    borderTop: { xs: '1px solid #dadce0', md: 'none' },
                    bgcolor: '#fff',
                    overflowY: 'auto',
                    maxHeight: { xs: '250px', md: 'none' }
                }}>
                    {/* For Field */}
                    <Box>
                        <Typography sx={{ fontSize: '0.875rem', fontWeight: 500, color: '#3c4043', mb: 1 }}>For</Typography>
                        <Select
                            fullWidth
                            value={organizationId}
                            displayEmpty
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
                            startIcon={<PeopleOutlineIcon sx={{ color: '#0D9488' }} />}
                            sx={{
                                color: '#0D9488',
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
                            sx={{
                                height: 48,
                                width: { xs: '100%', md: '50%' },
                                bgcolor: '#e8eaed',
                                color: '#3c4043',
                                borderRadius: '4px 4px 0 0',
                                '.MuiOutlinedInput-notchedOutline': { border: 'none', borderBottom: '1px solid #5f6368' },
                                '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderBottom: '2px solid #0D9488' },
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
                                sx={{
                                    height: 48,
                                    bgcolor: '#e8eaed',
                                    color: '#3c4043',
                                    borderRadius: '4px 4px 0 0',
                                    '.MuiOutlinedInput-notchedOutline': { border: 'none', borderBottom: '1px solid #5f6368' },
                                    '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderBottom: '2px solid #0D9488' },
                                    '&:hover': { bgcolor: '#dadce0' }
                                }}
                            >
                                <MenuItem value="No topic">No topic</MenuItem>
                                <MenuItem value="create_new" sx={{ borderTop: '1px solid #e0e0e0' }}>Create topic</MenuItem>
                            </Select>
                        ) : (
                            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                                <Box sx={{ position: "relative", bgcolor: "#f1f3f4", borderRadius: "4px 4px 0 0", borderBottom: "2px solid #0D9488", width: "100%", display: "flex", alignItems: "center" }}>
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



                    {/* Spacer and Help Icon */}
                    <Box sx={{ flexGrow: 1, display: 'flex', alignItems: 'flex-end', justifyContent: 'flex-end', mt: 4 }}>
                        <IconButton>
                            <HelpOutlineIcon sx={{ color: '#5f6368' }} />
                        </IconButton>
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

export default CreateFormModal;
