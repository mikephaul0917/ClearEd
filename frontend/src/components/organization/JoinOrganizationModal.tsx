import React, { useState } from "react";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import Button from "@mui/material/Button";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import Box from "@mui/material/Box";
import Alert from "@mui/material/Alert";
import CircularProgress from "@mui/material/CircularProgress";
import { organizationService } from "../../services";

/**
 * JoinOrganizationModal Component
 * Allows students/officers to join an organization using a 6-character code.
 */

interface JoinOrganizationModalProps {
    open: boolean;
    onClose: () => void;
    onJoined?: () => void;
}

const JoinOrganizationModal: React.FC<JoinOrganizationModalProps> = ({
    open,
    onClose,
    onJoined
}) => {
    const [joinCode, setJoinCode] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    const handleJoin = async () => {
        if (!joinCode.trim()) {
            setError("Please enter a valid join code.");
            return;
        }

        setLoading(true);
        setError(null);

        try {
            await organizationService.joinOrganization(joinCode.trim().toUpperCase());

            setSuccess(true);
            setTimeout(() => {
                setSuccess(false);
                setJoinCode("");
                onJoined?.();
                onClose();
            }, 2000);
        } catch (err: any) {
            const message = err.response?.data?.message || "Failed to join organization. Please check the code and try again.";
            setError(message);
        } finally {
            setLoading(false);
        }
    };

    const handleClose = () => {
        if (!loading) {
            setJoinCode("");
            setError(null);
            setSuccess(false);
            onClose();
        }
    };

    return (
        <Dialog
            open={open}
            onClose={handleClose}
            maxWidth="xs"
            fullWidth
            PaperProps={{
                sx: { borderRadius: 3, p: 1 }
            }}
        >
            <DialogTitle sx={{ fontWeight: 800, fontSize: 24, pb: 1 }}>
                Join Organization
            </DialogTitle>

            <DialogContent>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                    Ask your organization officer for the 6-character join code, then enter it below.
                </Typography>

                {error && (
                    <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>
                        {error}
                    </Alert>
                )
                }

                {success && (
                    <Alert severity="success" sx={{ mb: 2, borderRadius: 2 }}>
                        Successfully joined! Redirecting...
                    </Alert>
                )}

                <TextField
                    fullWidth
                    label="Join Code"
                    placeholder="e.g. AB1234"
                    value={joinCode}
                    onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                    disabled={loading || success}
                    inputProps={{
                        maxLength: 10,
                        style: { textTransform: 'uppercase', fontWeight: 700, letterSpacing: 2, fontSize: 18, textAlign: 'center' }
                    }}
                    autoFocus
                    variant="outlined"
                    sx={{
                        "& .MuiOutlinedInput-root": {
                            borderRadius: 2,
                            bgcolor: "#F8FAFC"
                        }
                    }}
                />

                <Box sx={{ mt: 2, p: 2, bgcolor: "#F1F5F9", borderRadius: 2 }}>
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', fontWeight: 600, mb: 0.5 }}>
                        To sign in with a join code:
                    </Typography>
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                        • Use an authorized account from your institution.
                    </Typography>
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                        • Code is not case-sensitive.
                    </Typography>
                </Box>
            </DialogContent>

            <DialogActions sx={{ px: 3, pb: 2 }}>
                <Button
                    onClick={handleClose}
                    disabled={loading}
                    sx={{ textTransform: 'none', color: "#64748B", fontWeight: 600 }}
                >
                    Cancel
                </Button>
                <Button
                    onClick={handleJoin}
                    variant="contained"
                    disabled={loading || success || !joinCode}
                    sx={{
                        textTransform: 'none',
                        bgcolor: "#0F172A",
                        borderRadius: 2,
                        px: 4,
                        fontWeight: 600,
                        "&:hover": { bgcolor: "#1E293B" }
                    }}
                >
                    {loading ? <CircularProgress size={24} color="inherit" /> : "Join"}
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default JoinOrganizationModal;
