import React, { useState, useEffect } from "react";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import Button from "@mui/material/Button";
import TextField from "@mui/material/TextField";
import FormControl from "@mui/material/FormControl";
import InputLabel from "@mui/material/InputLabel";
import Select from "@mui/material/Select";
import MenuItem from "@mui/material/MenuItem";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Alert from "@mui/material/Alert";
import CircularProgress from "@mui/material/CircularProgress";
import Grid from "@mui/material/Grid";
import { organizationService } from "../../services";

interface CreateOrganizationModalProps {
    open: boolean;
    onClose: () => void;
    onCreated: () => void;
}

const CreateOrganizationModal: React.FC<CreateOrganizationModalProps> = ({ open, onClose, onCreated }) => {
    const [name, setName] = useState("");
    const [description, setDescription] = useState("");
    const [signatoryName, setSignatoryName] = useState("");
    const [termId, setTermId] = useState("");
    const [terms, setTerms] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [fetchingTerms, setFetchingTerms] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (open) {
            fetchTerms();
        }
    }, [open]);

    const fetchTerms = async () => {
        setFetchingTerms(true);
        try {
            const data = await organizationService.getTerms();
            const termData = data.data;
            setTerms(termData);

            // Auto-select active term if any
            const activeTerm = termData.find((t: any) => t.isActive);
            if (activeTerm) {
                setTermId(activeTerm._id);
            }
        } catch (err: any) {
            console.error("Failed to fetch terms", err);
        } finally {
            setFetchingTerms(false);
        }
    };

    const handleSubmit = async () => {
        if (!name || !termId) {
            setError("Name and Term are required.");
            return;
        }

        setLoading(true);
        setError(null);
        try {
            await organizationService.createOrganization({
                name,
                description,
                signatoryName,
                termId
            });
            onCreated();
            window.dispatchEvent(new CustomEvent('refresh-sidebar'));
            handleClose();
        } catch (err: any) {
            setError(err.response?.data?.message || "Failed to create organization.");
        } finally {
            setLoading(false);
        }
    };

    const handleClose = () => {
        setName("");
        setDescription("");
        setSignatoryName("");
        setTermId("");
        setError(null);
        onClose();
    };

    // Custom Label Component for consistent styling
    const FieldLabel = ({ children }: { children: React.ReactNode }) => (
        <Typography
            variant="body2"
            sx={{
                fontWeight: 700,
                color: "#1e293b",
                mb: 1,
                fontFamily: '"Google Sans", "Product Sans", Roboto, sans-serif'
            }}
        >
            {children}
        </Typography>
    );

    return (
        <Dialog
            open={open}
            onClose={handleClose}
            maxWidth="sm"
            fullWidth
            PaperProps={{
                sx: {
                    borderRadius: 3,
                    p: 1
                }
            }}
        >
            <DialogTitle sx={{ pt: 3, pb: 1 }}>
                <Typography
                    variant="h5"
                    sx={{
                        fontWeight: 800,
                        color: "#0f172a",
                        fontFamily: '"Google Sans", "Product Sans", Roboto, sans-serif'
                    }}
                >
                    New Organization
                </Typography>
                <Typography
                    variant="body2"
                    sx={{
                        color: "#64748b",
                        fontFamily: '"Google Sans", "Product Sans", Roboto, sans-serif',
                        fontWeight: 500,
                        mt: 0.5
                    }}
                >
                    Establish a new institutional office for the clearance workflow.
                </Typography>
            </DialogTitle>

            <DialogContent sx={{ mt: 1 }}>
                <Box display="flex" flexDirection="column" gap={3}>
                    {error && <Alert severity="error" sx={{ borderRadius: "12px" }}>{error}</Alert>}

                    <Box>
                        <FieldLabel>Full Name</FieldLabel>
                        <TextField
                            placeholder="e.g. Registrar's Office"
                            fullWidth
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            sx={{
                                "& .MuiOutlinedInput-root": {
                                    borderRadius: 2,
                                    bgcolor: "#fcfdfe"
                                }
                            }}
                            required
                        />
                    </Box>

                    <Box>
                        <FieldLabel>Internal Description</FieldLabel>
                        <TextField
                            placeholder="Briefly describe the purpose of this organization..."
                            multiline
                            rows={3}
                            fullWidth
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            sx={{
                                "& .MuiOutlinedInput-root": {
                                    borderRadius: 2,
                                    bgcolor: "#fcfdfe"
                                }
                            }}
                        />
                    </Box>

                    <Grid container spacing={2}>
                        <Grid item xs={6}>
                            <FieldLabel>System Signatory</FieldLabel>
                            <TextField
                                placeholder="e.g. Juan Dela Cruz"
                                fullWidth
                                value={signatoryName}
                                onChange={(e) => setSignatoryName(e.target.value)}
                                sx={{
                                    "& .MuiOutlinedInput-root": {
                                        borderRadius: 2,
                                        bgcolor: "#fcfdfe"
                                    }
                                }}
                            />
                        </Grid>
                        <Grid item xs={6}>
                            <FieldLabel>Access Code</FieldLabel>
                            <TextField
                                fullWidth
                                value="AUTO-GEN"
                                disabled
                                sx={{
                                    "& .MuiOutlinedInput-root": {
                                        borderRadius: 2,
                                        bgcolor: "#f8fafc",
                                        "& input": {
                                            fontWeight: 700,
                                            color: "#94a3b8"
                                        }
                                    }
                                }}
                            />
                        </Grid>
                    </Grid>

                    <Box>
                        <FieldLabel>Academic Term</FieldLabel>
                        <FormControl fullWidth required>
                            <Select
                                value={termId}
                                onChange={(e) => setTermId(e.target.value)}
                                disabled={fetchingTerms}
                                sx={{ borderRadius: 2, bgcolor: "#fcfdfe" }}
                            >
                                {terms.map((term) => (
                                    <MenuItem key={term._id} value={term._id} sx={{ fontFamily: '"Google Sans", sans-serif' }}>
                                        {term.semester} - {term.academicYear} {term.isActive && "(Active)"}
                                    </MenuItem>
                                ))}
                            </Select>
                            {fetchingTerms && <CircularProgress size={20} sx={{ mt: 1, alignSelf: "center" }} />}
                            {terms.length === 0 && !fetchingTerms && (
                                <Typography variant="caption" color="error" sx={{ mt: 1 }}>
                                    No terms found. Please create a term in Admin Settings first.
                                </Typography>
                            )}
                        </FormControl>
                    </Box>

                </Box>
            </DialogContent>

            <DialogActions sx={{ p: 4, pt: 2, display: "flex", justifyContent: "flex-end", gap: 2 }}>
                <Button
                    onClick={handleClose}
                    sx={{
                        fontWeight: 700,
                        color: "#64748b",
                        textTransform: "none",
                        fontSize: "1rem",
                        "&:hover": { bgcolor: "transparent", color: "#0f172a" }
                    }}
                >
                    Go Back
                </Button>
                <Button
                    onClick={handleSubmit}
                    variant="contained"
                    disabled={loading || terms.length === 0}
                    sx={{
                        bgcolor: "#3c4043",
                        color: "#ffffff",
                        fontWeight: 700,
                        borderRadius: "8px",
                        px: 4,
                        py: 1.5,
                        textTransform: "none",
                        fontSize: "1rem",
                        boxShadow: "0 4px 12px rgba(15, 23, 42, 0.2)",
                        "&:hover": {
                            bgcolor: "#0f172a",
                            boxShadow: "0 6px 16px rgba(15, 23, 42, 0.3)"
                        },
                        "&.Mui-disabled": {
                            bgcolor: "#e2e8f0",
                            color: "#94a3b8"
                        }
                    }}
                >
                    {loading ? <CircularProgress size={24} color="inherit" /> : "Confirm Creation"}
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default CreateOrganizationModal;
