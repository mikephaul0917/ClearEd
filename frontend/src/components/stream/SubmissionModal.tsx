import React, { useState } from "react";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import Box from "@mui/material/Box";
import TextField from "@mui/material/TextField";
import IconButton from "@mui/material/IconButton";
import CloseIcon from "@mui/icons-material/Close";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import DeleteIcon from "@mui/icons-material/Delete";
import InsertDriveFileIcon from "@mui/icons-material/InsertDriveFile";
import Alert from "@mui/material/Alert";
import Chip from "@mui/material/Chip";
import CircularProgress from "@mui/material/CircularProgress";
import { clearanceService } from "../../services";

/**
 * SubmissionModal Component
 * Allows students to upload files and submit their work for a requirement.
 */

interface SubmissionModalProps {
    open: boolean;
    onClose: () => void;
    requirementId: string;
    organizationId: string;
    requirementTitle: string;
    status: "not_started" | "pending" | "approved" | "rejected" | "resubmission_required";
    existingFiles?: any[];
    onSubmitted?: () => void;
}

const SubmissionModal: React.FC<SubmissionModalProps> = ({
    open,
    onClose,
    requirementId,
    organizationId,
    requirementTitle,
    status,
    existingFiles = [],
    onSubmitted
}) => {
    const [files, setFiles] = useState<File[]>([]);
    const [studentNotes, setStudentNotes] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            const newFiles = Array.from(e.target.files);
            setFiles([...files, ...newFiles]);
        }
    };

    const removeFile = (index: number) => {
        setFiles(files.filter((_, i) => i !== index));
    };

    const handleSubmit = async () => {
        if (files.length === 0 && existingFiles.length === 0) {
            setError("Please upload at least one file.");
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const formData = new FormData();
            formData.append("clearanceRequirementId", requirementId);
            formData.append("organizationId", organizationId);
            formData.append("studentNotes", studentNotes);
            files.forEach(file => {
                formData.append("files", file);
            });

            // Call real API
            await clearanceService.submitRequirement(formData);

            onSubmitted?.();
            onClose();
            setFiles([]);
            setStudentNotes("");
        } catch (err: any) {
            setError(err.response?.data?.message || "Failed to submit work. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog
            open={open}
            onClose={onClose}
            maxWidth="sm"
            fullWidth
            PaperProps={{ sx: { borderRadius: "14px" } }}
        >
            <DialogTitle sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontWeight: 800 }}>
                {requirementTitle}
                <IconButton onClick={onClose} size="small">
                    <CloseIcon />
                </IconButton>
            </DialogTitle>

            <DialogContent dividers>
                {error && (
                    <Alert severity="error" sx={{ mb: 2, borderRadius: "14px" }}>
                        {error}
                    </Alert>
                )}

                <Box sx={{ mb: 3 }}>
                    <Typography variant="subtitle2" fontWeight={700} gutterBottom>
                        Your Work
                    </Typography>

                    {/* File List */}
                    <Box sx={{ display: "flex", flexDirection: "column", gap: 1, mb: 2 }}>
                        {(existingFiles.length > 0 || files.length > 0) ? (
                            <>
                                {existingFiles.map((file, idx) => (
                                    <Box
                                        key={`ext-${idx}`}
                                        sx={{
                                            p: 1.5,
                                            display: "flex",
                                            alignItems: "center",
                                            justifyContent: "space-between",
                                            border: "1px solid #E2E8F0",
                                            borderRadius: "6px",
                                            bgcolor: "#F8FAFC"
                                        }}
                                    >
                                        <Box display="flex" alignItems="center" gap={1.5}>
                                            <InsertDriveFileIcon color="primary" />
                                            <Typography variant="body2" fontWeight={600}>
                                                {file.originalName}
                                            </Typography>
                                        </Box>
                                        <Chip label="Submitted" size="small" />
                                    </Box>
                                ))}
                                {files.map((file, idx) => (
                                    <Box
                                        key={`new-${idx}`}
                                        sx={{
                                            p: 1.5,
                                            display: "flex",
                                            alignItems: "center",
                                            justifyContent: "space-between",
                                            border: "1px dashed #2563EB",
                                            borderRadius: "6px",
                                            bgcolor: "#EFF6FF"
                                        }}
                                    >
                                        <Box display="flex" alignItems="center" gap={1.5}>
                                            <InsertDriveFileIcon sx={{ color: "#2563EB" }} />
                                            <Typography variant="body2" fontWeight={600} color="#1E40AF">
                                                {file.name}
                                            </Typography>
                                        </Box>
                                        <IconButton size="small" onClick={() => removeFile(idx)} sx={{ color: "#EF4444" }}>
                                            <DeleteIcon fontSize="small" />
                                        </IconButton>
                                    </Box>
                                ))}
                            </>
                        ) : (
                            <Box
                                sx={{
                                    py: 4,
                                    display: "flex",
                                    flexDirection: "column",
                                    alignItems: "center",
                                    border: "2px dashed #E2E8F0",
                                    borderRadius: "10px",
                                    bgcolor: "#F8FAFC"
                                }}
                            >
                                <CloudUploadIcon sx={{ fontSize: 40, color: "#94A3B8", mb: 1 }} />
                                <Typography color="text.secondary" variant="body2">
                                    No files attached
                                </Typography>
                            </Box>
                        )}
                    </Box>

                    {/* Upload Button */}
                    <input
                        type="file"
                        id="file-upload"
                        multiple
                        style={{ display: "none" }}
                        onChange={handleFileChange}
                    />
                    <label htmlFor="file-upload">
                        <Button
                            component="span"
                            fullWidth
                            variant="outlined"
                            startIcon={<CloudUploadIcon />}
                            sx={{
                                textTransform: 'none',
                                borderStyle: 'dashed',
                                borderRadius: "8px",
                                py: 1
                            }}
                        >
                            Add File
                        </Button>
                    </label>
                </Box>

                <Box>
                    <Typography variant="subtitle2" fontWeight={700} gutterBottom>
                        Notes
                    </Typography>
                    <TextField
                        fullWidth
                        multiline
                        rows={3}
                        placeholder="Add a comment to your officer..."
                        value={studentNotes}
                        onChange={(e) => setStudentNotes(e.target.value)}
                        variant="outlined"
                        sx={{
                            "& .MuiOutlinedInput-root": {
                                borderRadius: 2
                            }
                        }}
                    />
                </Box>
            </DialogContent>

            <DialogActions sx={{ p: 3 }}>
                <Button onClick={onClose} sx={{ textTransform: 'none', fontWeight: 600, color: "#64748B" }}>
                    Cancel
                </Button>

                {status === "approved" ? (
                    <Button
                        disabled
                        variant="contained"
                        sx={{ bgcolor: "rgba(176, 224, 230, 0.4) !important", color: "#0E7490 !important", borderRadius: "8px", px: 4, textTransform: "none", fontWeight: 700 }}
                    >
                        Approved
                    </Button>
                ) : status === "pending" ? (
                    <Box sx={{ display: "flex", gap: 1 }}>
                        <Typography variant="caption" color="text.secondary" sx={{ alignSelf: "center", mr: 1 }}>
                            Work turned in
                        </Typography>
                        <Button
                            variant="outlined"
                            disabled={loading}
                            sx={{ textTransform: "none", borderRadius: "8px", borderColor: "#EF4444", color: "#EF4444", "&:hover": { bgcolor: "#FEF2F2", borderColor: "#EF4444" } }}
                        >
                            Unsubmit
                        </Button>
                    </Box>
                ) : (
                    <Button
                        onClick={handleSubmit}
                        variant="contained"
                        disabled={loading || files.length === 0}
                        sx={{
                            textTransform: 'none',
                            fontWeight: 700,
                            bgcolor: "#0F172A",
                            px: 4,
                            borderRadius: "8px",
                            "&:hover": { bgcolor: "#1E293B" }
                        }}
                    >
                        {loading ? <CircularProgress size={24} color="inherit" /> : status === "rejected" || status === "resubmission_required" ? "Resubmit" : "Turn In"}
                    </Button>
                )}
            </DialogActions>
        </Dialog>
    );
};

export default SubmissionModal;
