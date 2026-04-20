import React, { useState, useEffect } from "react";
import Dialog from "@mui/material/Dialog";
import DialogContent from "@mui/material/DialogContent";
import Typography from "@mui/material/Typography";
import TextField from "@mui/material/TextField";
import Button from "@mui/material/Button";
import Box from "@mui/material/Box";
import IconButton from "@mui/material/IconButton";
import CloseIcon from "@mui/icons-material/Close";
import LinkIcon from "@mui/icons-material/Link";
import InputAdornment from "@mui/material/InputAdornment";

interface AddLinkModalProps {
    open: boolean;
    onClose: () => void;
    onAdd: (url: string) => void;
    title: string;
    description: string;
    placeholder: string;
}

const AddLinkModal: React.FC<AddLinkModalProps> = ({
    open,
    onClose,
    onAdd,
    title,
    description,
    placeholder
}) => {
    const [url, setUrl] = useState("");

    useEffect(() => {
        if (open) {
            setUrl("");
        }
    }, [open]);

    const handleAdd = () => {
        if (url.trim()) {
            onAdd(url.trim());
            onClose();
        }
    };

    return (
        <Dialog
            open={open}
            onClose={onClose}
            PaperProps={{
                sx: {
                    borderRadius: "8px",
                    width: "100%",
                    maxWidth: "500px",
                    p: 2
                }
            }}
        >
            <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                <IconButton onClick={onClose} size="small" sx={{ color: "#5f6368" }}>
                    <CloseIcon />
                </IconButton>
            </Box>
            <DialogContent sx={{ pt: 1, px: 4, pb: 4 }}>
                <Typography variant="h5" sx={{ fontWeight: 600, color: "#202124", mb: 2 }}>
                    {title}
                </Typography>
                <Typography sx={{ color: "#5f6368", mb: 4, fontSize: "0.9375rem" }}>
                    {description}
                </Typography>

                <Box sx={{ mb: 4 }}>
                    <Typography
                        variant="subtitle2"
                        sx={{ fontWeight: 600, color: "#202124", mb: 1.5, ml: 0.5 }}
                    >
                        {placeholder}
                    </Typography>
                    <TextField
                        fullWidth
                        placeholder={`Enter ${placeholder.toLowerCase()}...`}
                        value={url}
                        onChange={(e) => setUrl(e.target.value)}
                        autoFocus
                        onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
                        InputProps={{
                            startAdornment: (
                                <InputAdornment position="start">
                                    <LinkIcon sx={{ color: "#5f6368" }} />
                                </InputAdornment>
                            ),
                            sx: {
                                borderRadius: "4px",
                                bgcolor: "#fff",
                                '& .MuiOutlinedInput-notchedOutline': {
                                    borderColor: "#dadce0",
                                    borderWidth: "1.5px"
                                },
                                '&:hover .MuiOutlinedInput-notchedOutline': {
                                    borderColor: "#0D9488"
                                },
                                '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                                    borderColor: "#0D9488"
                                }
                            }
                        }}
                    />
                </Box>

                <Button
                    fullWidth
                    variant="contained"
                    onClick={handleAdd}
                    disabled={!url.trim()}
                    sx={{
                        bgcolor: "#3c4043",
                        color: "white",
                        py: 2,
                        borderRadius: "4px",
                        textTransform: "none",
                        fontSize: "1rem",
                        fontWeight: 600,
                        boxShadow: "none",
                        "&:hover": {
                            bgcolor: "#202124",
                            boxShadow: "none"
                        },
                        "&.Mui-disabled": {
                            bgcolor: "#e8eaed",
                            color: "#9aa0a6"
                        }
                    }}
                >
                    Add Resource
                </Button>
            </DialogContent>
        </Dialog>
    );
};

export default AddLinkModal;
