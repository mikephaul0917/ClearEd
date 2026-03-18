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
import { organizationService } from "../../services";

interface CreateOrganizationModalProps {
    open: boolean;
    onClose: () => void;
    onCreated: () => void;
}

const CreateOrganizationModal: React.FC<CreateOrganizationModalProps> = ({ open, onClose, onCreated }) => {
    const [name, setName] = useState("");
    const [description, setDescription] = useState("");
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
                termId
            });
            onCreated();
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
        setTermId("");
        setError(null);
        onClose();
    };

    return (
        <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
            <DialogTitle sx={{ fontWeight: 800 }}>Create New Organization</DialogTitle>
            <DialogContent>
                <Box display="flex" flexDirection="column" gap={3} mt={1}>
                    {error && <Alert severity="error">{error}</Alert>}

                    <TextField
                        label="Organization Name"
                        placeholder="e.g. Society of Computer Science"
                        fullWidth
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        required
                    />

                    <TextField
                        label="Description"
                        placeholder="Briefly describe the purpose of this organization"
                        multiline
                        rows={3}
                        fullWidth
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                    />

                    <FormControl fullWidth required>
                        <InputLabel>Academic Term</InputLabel>
                        <Select
                            value={termId}
                            label="Academic Term"
                            onChange={(e) => setTermId(e.target.value)}
                            disabled={fetchingTerms}
                        >
                            {terms.map((term) => (
                                <MenuItem key={term._id} value={term._id}>
                                    {term.semester} - {term.academicYear} {term.isActive && "(Active)"}
                                </MenuItem>
                            ))}
                        </Select>
                        {fetchingTerms && <CircularProgress size={20} sx={{ mt: 1 }} />}
                        {terms.length === 0 && !fetchingTerms && (
                            <Typography variant="caption" color="error" sx={{ mt: 1 }}>
                                No terms found. Please create a term in Admin Settings first.
                            </Typography>
                        )}
                    </FormControl>
                </Box>
            </DialogContent>
            <DialogActions sx={{ p: 3 }}>
                <Button onClick={handleClose} color="inherit" sx={{ fontWeight: 700 }}>
                    Cancel
                </Button>
                <Button
                    onClick={handleSubmit}
                    variant="contained"
                    disabled={loading || terms.length === 0}
                    sx={{
                        bgcolor: "#0F172A",
                        fontWeight: 700,
                        "&:hover": { bgcolor: "#1E293B" }
                    }}
                >
                    {loading ? <CircularProgress size={24} color="inherit" /> : "Create Organization"}
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default CreateOrganizationModal;
