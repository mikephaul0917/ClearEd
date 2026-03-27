import React from "react";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import Box from "@mui/material/Box";
import PersonAddAltIcon from "@mui/icons-material/PersonAddAlt";
import { getAbsoluteUrl } from "../../utils/avatarUtils";

import Checkbox from "@mui/material/Checkbox";
import FormControlLabel from "@mui/material/FormControlLabel";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import Avatar from "@mui/material/Avatar";

interface AssignToModalProps {
    open: boolean;
    onClose: () => void;
    students?: any[];
    selectedIds: string[];
    onToggle: (id: string) => void;
    onToggleAll: () => void;
}

const AssignToModal: React.FC<AssignToModalProps> = ({ 
    open, 
    onClose, 
    students = [],
    selectedIds,
    onToggle,
    onToggleAll
}) => {
    const isAllSelected = students.length > 0 && selectedIds.length === students.length;
    const isIndeterminate = selectedIds.length > 0 && selectedIds.length < students.length;

    return (
        <Dialog
            open={open}
            onClose={onClose}
            maxWidth="sm"
            fullWidth
            PaperProps={{
                sx: {
                    borderRadius: 2,
                    boxShadow: "0 24px 38px 3px rgba(0,0,0,0.14), 0 9px 46px 8px rgba(0,0,0,0.12), 0 11px 15px -7px rgba(0,0,0,0.2)",
                }
            }}
        >
            <DialogTitle sx={{
                color: "#3c4043",
                fontWeight: 400,
                fontSize: "1.125rem",
                pb: 1,
                borderBottom: "1px solid #e0e0e0"
            }}>
                Assign to
            </DialogTitle>

            <DialogContent sx={{ p: 0 }}>
                {students.length === 0 ? (
                    <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", py: 6 }}>
                        {/* Empty State Illustration SVG matching Google Classroom styling (book and sleeping cat/animal) */}
                        <Box sx={{ mb: 3 }}>
                            <svg width="200" height="120" viewBox="0 0 200 120" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <g opacity="0.6">
                                    {/* Plant / decorative */}
                                    <path d="M48 60 C42 55, 38 65, 48 70 M48 70 C54 65, 58 55, 48 60" fill="#e8eaed" />
                                    <path d="M48 45 C42 40, 38 50, 48 55 M48 55 C54 50, 58 40, 48 45" fill="#e8eaed" />
                                    <line x1="48" y1="45" x2="48" y2="75" stroke="#e8eaed" strokeWidth="2" strokeLinecap="round" />

                                    {/* Paper */}
                                    <path d="M40 90 L60 90 L50 100 L30 100 Z" fill="#dadce0" />
                                </g>

                                {/* Books */}
                                <path d="M60 85 L150 85 L130 95 L40 95 Z" fill="#fff" stroke="#5f6368" strokeWidth="1.5" strokeLinejoin="round" />
                                <path d="M150 85 L150 95 L130 105 L40 105 L60 95" fill="#fff" stroke="#5f6368" strokeWidth="1.5" strokeLinejoin="round" />
                                <path d="M40 95 L40 105" stroke="#5f6368" strokeWidth="1.5" />
                                <path d="M150 90 L130 100" stroke="#5f6368" strokeWidth="1" />
                                <path d="M150 87 L130 97" stroke="#5f6368" strokeWidth="1" />
                                <path d="M50 85 L135 85 L115 95 L30 95 Z" fill="#5f6368" />

                                {/* Pencil */}
                                <path d="M85 105 L115 100 L115 104 L85 109 Z" fill="#e8eaed" stroke="#5f6368" strokeWidth="1.5" strokeLinejoin="round" />
                                <path d="M85 105 L75 108 L85 109 Z" fill="#5f6368" />
                                <path d="M115 100 L120 99 M115 104 L120 103 M120 99 L120 103" stroke="#5f6368" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />

                                {/* Cat/Mouse Character */}
                                <path d="M65 80 C65 60, 85 40, 105 40 C125 40, 130 50, 135 60 L140 55 L138 65 L145 62 L140 70 C140 75, 130 80, 120 80 Z" fill="#fff" stroke="#5f6368" strokeWidth="2" strokeLinejoin="round" />
                                {/* Tail */}
                                <path d="M65 80 C50 80, 45 90, 60 90" fill="none" stroke="#5f6368" strokeWidth="2" strokeLinecap="round" />
                                {/* Face details */}
                                <circle cx="128" cy="62" r="1.5" fill="#5f6368" />
                                <circle cx="138" cy="65" r="1.5" fill="#5f6368" />
                                <path d="M132 66 L134 68 L136 66" fill="none" stroke="#5f6368" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                        </Box>

                        <Typography sx={{ color: "#202124", fontWeight: 500, fontSize: "1rem", mb: 3 }}>
                            There are no members in this class
                        </Typography>

                        <Button
                            startIcon={<PersonAddAltIcon />}
                            sx={{
                                textTransform: "none",
                                fontWeight: 500,
                                color: "#1a73e8",
                                "&:hover": { bgcolor: "rgba(26,115,232,0.04)" }
                            }}
                        >
                            Invite members
                        </Button>
                    </Box>
                ) : (
                    <Box>
                        {/* Select All Checkbox */}
                        <Box sx={{ p: 2, borderBottom: "1px solid #e0e0e0" }}>
                            <FormControlLabel
                                control={
                                    <Checkbox
                                        checked={isAllSelected}
                                        indeterminate={isIndeterminate}
                                        onChange={onToggleAll}
                                        color="primary"
                                    />
                                }
                                label={
                                    <Typography sx={{ fontWeight: 500, color: "#3c4043" }}>
                                        All members
                                    </Typography>
                                }
                            />
                        </Box>

                        {/* Student List */}
                        <List sx={{ pt: 0, pb: 0, maxHeight: 400, overflowY: "auto" }}>
                            {students.map((student) => {
                                // OrganizationMember uses `userId` to populate the User object
                                const userObj = student.userId || student.user;
                                const id = userObj?._id || student._id;
                                const isSelected = selectedIds.includes(id);
                                const fullName = userObj?.fullName || `${userObj?.firstName || ''} ${userObj?.lastName || ''}`.trim() || 'Unknown Member';
                                
                                return (
                                    <ListItem 
                                        key={id} 
                                        // @ts-ignore
                                        button="true"
                                        onClick={() => onToggle(id)}
                                        sx={{ 
                                            borderBottom: "1px solid #f1f3f4",
                                            "&:hover": { bgcolor: "#f8f9fa", cursor: "pointer" }
                                        }}
                                    >
                                        <Checkbox
                                            checked={isSelected}
                                            tabIndex={-1}
                                            disableRipple
                                            color="primary"
                                        />
                                        <Avatar 
                                            src={getAbsoluteUrl(userObj?.avatarUrl)} 
                                            alt={fullName}
                                            sx={{ width: 32, height: 32, mr: 2, ml: 1, bgcolor: "#1967d2" }}
                                        >
                                            {fullName.charAt(0).toUpperCase()}
                                        </Avatar>
                                        <Typography sx={{ color: "#3c4043", fontSize: "0.875rem" }}>
                                            {fullName}
                                        </Typography>
                                    </ListItem>
                                );
                            })}
                        </List>
                    </Box>
                )}
            </DialogContent>

            <DialogActions sx={{ p: 2, borderTop: "1px solid #e0e0e0" }}>
                <Button
                    variant="contained"
                    onClick={onClose}
                    sx={{
                        textTransform: "none",
                        bgcolor: "#1a73e8",
                        color: "white",
                        fontWeight: 500,
                        borderRadius: 20,
                        px: 3,
                        boxShadow: "none",
                        "&:hover": { bgcolor: "#1557b0", boxShadow: "none" }
                    }}
                >
                    Done
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default AssignToModal;
