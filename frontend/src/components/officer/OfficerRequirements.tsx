import { useEffect, useMemo, useState, useCallback } from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Paper from "@mui/material/Paper";
import TextField from "@mui/material/TextField";
import Button from "@mui/material/Button";
import IconButton from "@mui/material/IconButton";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import Chip from "@mui/material/Chip";
import Switch from "@mui/material/Switch";
import InputAdornment from "@mui/material/InputAdornment";
import Skeleton from "@mui/material/Skeleton";
import Tooltip from "@mui/material/Tooltip";
import { AddCircle, Delete, Business } from "@mui/icons-material";
import { signatoryService, organizationService, SignatoryRequirement } from "../../services";
import Swal from "sweetalert2";

interface Org {
    _id: string;
    name: string;
    code: string;
}

export default function OfficerRequirements() {
    const [requirements, setRequirements] = useState<SignatoryRequirement[]>([]);
    const [myOrgs, setMyOrgs] = useState<Org[]>([]);
    const [query, setQuery] = useState("");
    const [loading, setLoading] = useState(true);
    const [dialogMode, setDialogMode] = useState<"add" | "edit" | null>(null);
    const [activeReq, setActiveReq] = useState<Partial<SignatoryRequirement>>({
        title: "",
        description: "",
        isMandatory: true,
        requiredFiles: []
    });
    const [activeOrgId, setActiveOrgId] = useState<string>("");

    const [reqMenuAnchor, setReqMenuAnchor] = useState<null | HTMLElement>(null);
    const [reqMenuItem, setReqMenuItem] = useState<SignatoryRequirement | null>(null);
    const [saving, setSaving] = useState(false);

    // Bento tokens
    const COLORS = {
        black: '#0a0a0a',
        textSecondary: '#64748B',
        border: '#E2E8F0',
        cardRadius: '16px',
        pageBg: '#F9FAFB',
        teal: '#5fcca0',
    };
    const fontStack = '"Google Sans", "Product Sans", Roboto, sans-serif';

    const fetchAll = useCallback(async () => {
        setLoading(true);
        try {
            const [reqData, orgData] = await Promise.all([
                signatoryService.getRequirements(),
                organizationService.getMyOrganizations()
            ]);
            setRequirements(reqData.requirements || []);
            setMyOrgs(orgData.organizations || []);
        } catch (error) {
            console.error("Failed to fetch data:", error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { fetchAll(); }, [fetchAll]);

    const filtered = useMemo(() => {
        const q = query.trim().toLowerCase();
        if (!q) return requirements;
        return requirements.filter(r =>
            r.title.toLowerCase().includes(q) ||
            r.description.toLowerCase().includes(q) ||
            r.organizationId.name.toLowerCase().includes(q)
        );
    }, [requirements, query]);

    const openAdd = (orgId: string) => {
        setActiveOrgId(orgId);
        setActiveReq({ title: "", description: "", isMandatory: true, requiredFiles: [] });
        setDialogMode("add");
    };

    const openEdit = (req: SignatoryRequirement) => {
        setActiveReq({
            _id: req._id,
            title: req.title,
            description: req.description,
            isMandatory: req.isMandatory,
            requiredFiles: req.requiredFiles
        });
        setDialogMode("edit");
    };

    const closeDialog = () => {
        setDialogMode(null);
        setActiveReq({ title: "", description: "", isMandatory: true, requiredFiles: [] });
        setActiveOrgId("");
    };

    const openReqMenu = (evt: React.MouseEvent<HTMLButtonElement>, req: SignatoryRequirement) => {
        setReqMenuAnchor(evt.currentTarget);
        setReqMenuItem(req);
    };

    const closeReqMenu = () => {
        setReqMenuAnchor(null);
        setReqMenuItem(null);
    };

    const saveReq = async () => {
        if (!activeReq.title?.trim()) {
            Swal.fire("Required", "Please provide a requirement title", "warning");
            return;
        }
        setSaving(true);
        try {
            if (dialogMode === "add") {
                await signatoryService.createRequirement({
                    organizationId: activeOrgId as any,
                    title: activeReq.title,
                    description: activeReq.description,
                    isMandatory: activeReq.isMandatory,
                    requiredFiles: activeReq.requiredFiles || []
                });
                Swal.fire("Success", "Requirement added successfully", "success");
            } else if (dialogMode === "edit" && activeReq._id) {
                await signatoryService.updateRequirement(activeReq._id, {
                    title: activeReq.title,
                    description: activeReq.description,
                    isMandatory: activeReq.isMandatory,
                    requiredFiles: activeReq.requiredFiles || []
                });
                Swal.fire("Success", "Requirement updated successfully", "success");
            }
            closeDialog();
            fetchAll();
        } catch (error: any) {
            Swal.fire("Error", "Failed to save requirement", "error");
        } finally {
            setSaving(false);
        }
    };

    const removeReq = async (reqId: string) => {
        try {
            const res = await Swal.fire({
                title: "Delete Requirement?",
                text: "This action cannot be undone.",
                icon: "warning",
                showCancelButton: true,
                confirmButtonText: "Delete",
                confirmButtonColor: "#EF4444"
            });
            if (res.isConfirmed) {
                await signatoryService.deleteRequirement(reqId);
                Swal.fire("Deleted", "Requirement has been removed", "success");
                fetchAll();
            }
        } catch (error) {
            Swal.fire("Error", "Failed to delete requirement", "error");
        }
    };

    return (
        <Box sx={{ fontFamily: fontStack }}>
            <Typography variant="h4" sx={{ fontWeight: 800, mb: 1, color: COLORS.black }}>Clearance Rules</Typography>
            <Typography sx={{ color: COLORS.textSecondary, mb: 4 }}>Define what students need to accomplish for your organization</Typography>

            <Paper sx={{ p: 3, borderRadius: COLORS.cardRadius, boxShadow: "none", border: `1px solid ${COLORS.border}` }}>
                <Box display="flex" alignItems="center" justifyContent="space-between" flexWrap="wrap" gap={1.5} mb={3}>
                    {loading ? (
                        <Skeleton variant="rounded" width={360} height={40} sx={{ borderRadius: '12px' }} />
                    ) : (
                        <TextField
                            placeholder="Search requirements..."
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            InputProps={{
                                startAdornment: (
                                    <InputAdornment position="start">
                                        <Box aria-hidden sx={{ width: 16, height: 16 }}>
                                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                <circle cx="11" cy="11" r="7" stroke="#64748B" strokeWidth="2" />
                                                <path d="M20 20l-3.5-3.5" stroke="#64748B" strokeWidth="2" strokeLinecap="round" />
                                            </svg>
                                        </Box>
                                    </InputAdornment>
                                )
                            }}
                            sx={{
                                width: { xs: "100%", sm: 360 },
                                '& .MuiOutlinedInput-root': { borderRadius: '12px' }
                            }}
                        />
                    )}

                    {!loading && myOrgs.length > 0 && (
                        <Button
                            variant="contained"
                            startIcon={<AddCircle />}
                            onClick={() => openAdd(myOrgs[0]._id)}
                            sx={{
                                backgroundColor: COLORS.black,
                                borderRadius: '12px',
                                textTransform: 'none',
                                fontWeight: 600,
                                px: 3,
                                '&:hover': { backgroundColor: '#222' }
                            }}
                        >
                            New Rule
                        </Button>
                    )}
                </Box>

                {loading ? (
                    <Box display="grid" gridTemplateColumns={{ xs: "1fr", md: "repeat(2, 1fr)", lg: "repeat(3, 1fr)" }} gap={3}>
                        {[1, 2, 3].map((i) => (
                            <Box key={i} sx={{ border: `1px solid ${COLORS.border}`, borderRadius: COLORS.cardRadius, p: 3 }}>
                                <Skeleton width="60%" height={32} sx={{ mb: 1 }} />
                                <Skeleton width="40%" height={20} sx={{ mb: 2 }} />
                                <Skeleton variant="rounded" height={60} sx={{ borderRadius: '8px' }} />
                            </Box>
                        ))}
                    </Box>
                ) : filtered.length === 0 ? (
                    <Box sx={{ textAlign: 'center', py: 8 }}>
                        <Typography color="textSecondary">No requirements found.</Typography>
                    </Box>
                ) : (
                    <Box display="grid" gridTemplateColumns={{ xs: "1fr", md: "repeat(2, 1fr)", lg: "repeat(3, 1fr)" }} gap={3}>
                        {filtered.map((req) => (
                            <Box
                                key={req._id}
                                sx={{
                                    backgroundColor: "#FFFFFF",
                                    border: `1px solid ${COLORS.border}`,
                                    borderRadius: COLORS.cardRadius,
                                    p: 3,
                                    display: "flex",
                                    flexDirection: "column",
                                    transition: 'all 0.2s ease',
                                    '&:hover': { transform: 'translateY(-2px)', boxShadow: '0 12px 24px rgba(0,0,0,0.04)', borderColor: '#CBD5E1' }
                                }}
                            >
                                <Box display="flex" alignItems="center" justifyContent="space-between" mb={1.5}>
                                    <Typography variant="h6" sx={{ fontWeight: 800, color: '#0F172A' }}>{req.title}</Typography>
                                    <IconButton size="small" onClick={(e) => openReqMenu(e, req)}>
                                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                            <circle cx="12" cy="5" r="2" fill="#94A3B8" />
                                            <circle cx="12" cy="12" r="2" fill="#94A3B8" />
                                            <circle cx="12" cy="19" r="2" fill="#94A3B8" />
                                        </svg>
                                    </IconButton>
                                </Box>

                                <Box display="flex" alignItems="center" gap={1} mb={2}>
                                    <Business sx={{ fontSize: 14, color: COLORS.textSecondary }} />
                                    <Typography sx={{ fontSize: 12, color: COLORS.textSecondary, fontWeight: 600 }}>
                                        {req.organizationId.name}
                                    </Typography>
                                </Box>

                                <Typography sx={{ color: "#64748B", fontSize: 13, lineHeight: 1.5, mb: 2, flex: 1 }}>
                                    {req.description}
                                </Typography>

                                <Box display="flex" gap={1}>
                                    {req.isMandatory && (
                                        <Chip label="Mandatory" size="small" sx={{ fontSize: 10, fontWeight: 700, backgroundColor: '#FEE2E2', color: '#991B1B' }} />
                                    )}
                                    {req.requiredFiles && req.requiredFiles.length > 0 && (
                                        <Chip label="Upload Required" size="small" sx={{ fontSize: 10, fontWeight: 700, backgroundColor: '#DBEAFE', color: '#1E40AF' }} />
                                    )}
                                    {req.isActive ? (
                                        <Chip label="Active" size="small" sx={{ fontSize: 10, fontWeight: 700, backgroundColor: '#DCFCE7', color: '#166534' }} />
                                    ) : (
                                        <Chip label="Inactive" size="small" sx={{ fontSize: 10, fontWeight: 700, backgroundColor: '#F1F5F9', color: '#475569' }} />
                                    )}
                                </Box>
                            </Box>
                        ))}
                    </Box>
                )}
            </Paper>

            <Menu
                anchorEl={reqMenuAnchor}
                open={!!reqMenuAnchor}
                onClose={closeReqMenu}
                anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
                transformOrigin={{ vertical: "top", horizontal: "right" }}
                PaperProps={{ sx: { borderRadius: '12px', mt: 1, boxShadow: '0 4px 20px rgba(0,0,0,0.1)', minWidth: 140 } }}
            >
                <MenuItem onClick={() => { if (reqMenuItem) openEdit(reqMenuItem); closeReqMenu(); }}>
                    <Typography sx={{ fontWeight: 600, fontSize: 13, fontFamily: fontStack }}>Edit Rule</Typography>
                </MenuItem>
                <MenuItem onClick={() => { if (reqMenuItem) removeReq(reqMenuItem._id); closeReqMenu(); }} sx={{ color: "#EF4444" }}>
                    <Typography sx={{ fontWeight: 600, fontSize: 13, fontFamily: fontStack }}>Delete Rule</Typography>
                </MenuItem>
            </Menu>

            <Dialog
                open={!!dialogMode}
                onClose={closeDialog}
                fullWidth
                maxWidth="sm"
                PaperProps={{ sx: { borderRadius: '20px', p: 1 } }}
            >
                <DialogTitle sx={{ fontWeight: 800, fontSize: '1.25rem', fontFamily: fontStack }}>
                    {dialogMode === "add" ? "Add New Rule" : "Edit Rule"}
                </DialogTitle>
                <DialogContent>
                    <Box display="flex" flexDirection="column" gap={3} sx={{ mt: 1 }}>
                        <Box>
                            <Typography variant="caption" sx={{ fontWeight: 700, color: COLORS.textSecondary, mb: 1, display: 'block' }}>
                                RULE TITLE
                            </Typography>
                            <TextField
                                fullWidth
                                placeholder="e.g., Return all borrowed books"
                                value={activeReq.title}
                                onChange={(e) => setActiveReq(v => ({ ...v, title: e.target.value }))}
                                sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px' } }}
                            />
                        </Box>
                        <Box>
                            <Typography variant="caption" sx={{ fontWeight: 700, color: COLORS.textSecondary, mb: 1, display: 'block' }}>
                                DESCRIPTION
                            </Typography>
                            <TextField
                                fullWidth
                                multiline
                                rows={3}
                                placeholder="Explain what the student needs to do..."
                                value={activeReq.description}
                                onChange={(e) => setActiveReq(v => ({ ...v, description: e.target.value }))}
                                sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px' } }}
                            />
                        </Box>
                        <Box display="flex" alignItems="center" justifyContent="space-between" sx={{ p: 2, backgroundColor: '#F8FAFC', borderRadius: '12px' }}>
                            <Box>
                                <Typography sx={{ fontWeight: 600, fontSize: '0.9rem' }}>Mandatory Requirement</Typography>
                                <Typography sx={{ fontSize: '0.75rem', color: '#64748B' }}>Students cannot be cleared without this</Typography>
                            </Box>
                            <Switch
                                checked={activeReq.isMandatory}
                                onChange={(e) => setActiveReq(v => ({ ...v, isMandatory: e.target.checked }))}
                                sx={{
                                    '& .MuiSwitch-switchBase.Mui-checked': { color: COLORS.black },
                                    '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': { backgroundColor: COLORS.black }
                                }}
                            />
                        </Box>

                        <Box display="flex" alignItems="center" justifyContent="space-between" sx={{ p: 2, backgroundColor: '#F8FAFC', borderRadius: '12px' }}>
                            <Box>
                                <Typography sx={{ fontWeight: 600, fontSize: '0.9rem' }}>Upload Required</Typography>
                                <Typography sx={{ fontSize: '0.75rem', color: '#64748B' }}>Students must upload a document for this</Typography>
                            </Box>
                            <Switch
                                checked={(activeReq.requiredFiles || []).length > 0}
                                onChange={(e) => setActiveReq(v => ({ ...v, requiredFiles: e.target.checked ? ["File"] : [] }))}
                                sx={{
                                    '& .MuiSwitch-switchBase.Mui-checked': { color: COLORS.black },
                                    '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': { backgroundColor: COLORS.black }
                                }}
                            />
                        </Box>
                    </Box>
                </DialogContent>
                <DialogActions sx={{ p: 3, gap: 1 }}>
                    <Button onClick={closeDialog} sx={{ color: '#64748B', textTransform: 'none', fontWeight: 600, fontFamily: fontStack }}>
                        Cancel
                    </Button>
                    <Button
                        onClick={saveReq}
                        variant="contained"
                        disabled={saving}
                        sx={{
                            backgroundColor: COLORS.black,
                            borderRadius: '12px',
                            px: 4,
                            py: 1,
                            textTransform: 'none',
                            fontWeight: 600,
                            fontFamily: fontStack,
                            '&:hover': { backgroundColor: '#222' }
                        }}
                    >
                        {saving ? "Saving..." : "Save Rule"}
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
}
