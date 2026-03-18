import React, { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Container from "@mui/material/Container";
import Paper from "@mui/material/Paper";
import Button from "@mui/material/Button";
import Avatar from "@mui/material/Avatar";
import Divider from "@mui/material/Divider";
import CircularProgress from "@mui/material/CircularProgress";
import AddIcon from "@mui/icons-material/Add";
import Tabs from "@mui/material/Tabs";
import Tab from "@mui/material/Tab";
import Tooltip from "@mui/material/Tooltip";
import IconButton from "@mui/material/IconButton";
import ListItemIcon from "@mui/material/ListItemIcon";
import ListItemText from "@mui/material/ListItemText";
import AssignmentIcon from "@mui/icons-material/Assignment"; // Clearance Requirement
import FactCheckIcon from "@mui/icons-material/FactCheck"; // Verification Form
import HelpOutlineIcon from "@mui/icons-material/HelpOutline"; // Inquiry / Clarification
import BookIcon from "@mui/icons-material/Book"; // Guidelines / Documents
import SettingsBackupRestoreIcon from "@mui/icons-material/SettingsBackupRestore"; // Reuse Requirement
import ArchiveIcon from "@mui/icons-material/Archive";
import Chip from "@mui/material/Chip";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import Snackbar from "@mui/material/Snackbar";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import FullscreenIcon from "@mui/icons-material/Fullscreen";
import EditIcon from "@mui/icons-material/Edit";

import RoleLayout from "../../components/layout/RoleLayout";
import ClearanceRequirementCard from "../../components/stream/ClearanceRequirementCard";
import SubmissionModal from "../../components/stream/SubmissionModal";
import CreateRequirementModal from "../../components/stream/CreateRequirementModal";
import StreamComposer from "../../components/stream/StreamComposer";
import CreateFormModal from "../../components/stream/CreateFormModal";
import CreatePollModal from "../../components/stream/CreatePollModal";
import CreateMaterialModal from "../../components/stream/CreateMaterialModal";
import ReviewSubmissionsModal from "../../components/stream/ReviewSubmissionsModal";
import CustomiseAppearanceModal from "../../components/stream/CustomiseAppearanceModal";
import MembersList from "../../components/organization/MembersList";
import { useAuth } from "../../hooks/useAuth";
import { organizationService, clearanceService, api } from "../../services";

/**
 * StreamPage Component
 * The central view for a specific organization's activities and requirements.
 */

const StreamPage: React.FC = () => {
    const { orgId } = useParams<{ orgId: string }>();
    const { user } = useAuth();
    const navigate = useNavigate();

    const [org, setOrg] = useState<any>(null);
    const [membership, setMembership] = useState<any>(null);
    const [students, setStudents] = useState<any[]>([]); // New state for AssignTo modal
    const [requirements, setRequirements] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    // Edit State
    const [isEditMode, setIsEditMode] = useState(false);
    const [editData, setEditData] = useState<any>(null);

    // UI State
    const [selectedReq, setSelectedReq] = useState<any>(null);
    const [isSubmissionModalOpen, setIsSubmissionModalOpen] = useState(false);
    const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isCreateFormModalOpen, setIsCreateFormModalOpen] = useState(false);
    const [isCreatePollModalOpen, setIsCreatePollModalOpen] = useState(false);
    const [isCreateMaterialModalOpen, setIsCreateMaterialModalOpen] = useState(false);
    const [isCustomiseModalOpen, setIsCustomiseModalOpen] = useState(false);
    const [tabValue, setTabValue] = useState(0);
    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
    const [createMenuAnchorEl, setCreateMenuAnchorEl] = useState<null | HTMLElement>(null);
    const [snackbarMessage, setSnackbarMessage] = useState("");

    const isAdmin = user?.role === 'admin' || user?.role === 'super_admin';
    const isOfficer = membership?.role === 'officer';

    // Theme values (default matching the previous dark slate color, or you can use standard Google Classroom colors)
    const [themeColor, setThemeColor] = useState<string>(org?.themeColor || '#0F172A');
    const [headerImage, setHeaderImage] = useState<string | null>(org?.headerImage || null);

    const fetchData = useCallback(async () => {
        if (!orgId) return;

        try {
            setLoading(true);

            // 1. Fetch Org details and membership
            const data = await organizationService.getOrganization(orgId);
            setOrg(data.organization);
            setMembership(data.membership);
            
            // Sync theme values from org if available, defaulting to previous slate color
            if (data.organization?.themeColor) setThemeColor(data.organization.themeColor);
            else setThemeColor('#0F172A');
            
            if (data.organization?.headerImage) setHeaderImage(data.organization.headerImage);

            // 1.5 Fetch Members
            try {
                const membersData = await organizationService.getMembers(orgId);
                const memberList = membersData.data || membersData.members || [];
                const studentsOnly = memberList.filter((m: any) => m.role === "member");
                setStudents(studentsOnly);
            } catch (err) {
                console.error("Failed to fetch members for AssignTo:", err);
            }

            // 2. Fetch Requirements
            const response = await clearanceService.getRequirements(orgId);
            // Handle both { requirements: [] } and { data: [] } API structures
            const reqs = response.requirements || response.data || [];

            // Map submission status to top-level status for the card
            const mappedReqs = reqs.map((r: any) => ({
                ...r,
                status: r.status || r.submission?.status || "not_started"
            }));

            // Sort newest first
            mappedReqs.sort((a: any, b: any) => {
                const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
                const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
                return dateB - dateA;
            });

            setRequirements(mappedReqs);
        } catch (error) {
            console.error("Failed to fetch stream data:", error);
        } finally {
            setLoading(false);
        }
    }, [orgId]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleAction = (id: string) => {
        const req = requirements.find(r => r._id === id);
        if (req) {
            setSelectedReq(req);
            if (isOfficer) {
                setIsReviewModalOpen(true);
            } else {
                setIsSubmissionModalOpen(true);
            }
        }
    };

    const handleDeleteRequirement = async (id: string) => {
        if (!window.confirm("Are you sure you want to delete this?")) return;
        try {
            await clearanceService.deleteRequirement(id);
            setSnackbarMessage("Item deleted successfully");
            fetchData();
        } catch (error) {
            console.error("Failed to delete item:", error);
            setSnackbarMessage("Failed to delete item");
        }
    };

    const handleEditRequirement = (id: string) => {
        const req = requirements.find(r => r._id === id);
        if (req) {
            setEditData(req);
            setIsEditMode(true);
            if (req.type === 'form') {
                setIsCreateFormModalOpen(true);
            } else if (req.type === 'poll') {
                setIsCreatePollModalOpen(true);
            } else if (req.type === 'material') {
                setIsCreateMaterialModalOpen(true);
            } else {
                // Default to requirement modal for requirement, etc
                setIsCreateModalOpen(true);
            }
        }
    };

    const handleArchive = async () => {
        if (!orgId || !window.confirm("Are you sure you want to archive this organization? Students will no longer be able to submit requirements.")) return;

        try {
            await organizationService.archiveOrganization(orgId);
            alert("Organization archived successfully.");
            fetchData();
        } catch (error) {
            console.error("Failed to archive organization:", error);
            alert("Failed to archive organization.");
        }
    };

    const handleMenuClick = (event: React.MouseEvent<HTMLButtonElement>) => {
        setAnchorEl(event.currentTarget);
    };

    const handleMenuClose = () => {
        setAnchorEl(null);
    };

    const handleCreateMenuClick = (event: React.MouseEvent<HTMLButtonElement>) => {
        setIsEditMode(false);
        setEditData(null);
        setCreateMenuAnchorEl(event.currentTarget);
    };

    const handleCreateMenuClose = () => {
        setCreateMenuAnchorEl(null);
    };

    const handleCopyInviteLink = () => {
        if (org) {
            const inviteLink = `${window.location.origin}/join?code=${org.joinCode}`;
            navigator.clipboard.writeText(inviteLink);
            setSnackbarMessage("Invite link copied");
        }
        handleMenuClose();
    };

    const handleCopyClassCode = () => {
        if (org) {
            navigator.clipboard.writeText(org.joinCode);
            setSnackbarMessage("Org code copied");
        }
        handleMenuClose();
    };

    const handleSaveAppearance = async (newColor: string, newImage: string | null) => {
        try {
            if (!orgId) return;
            await api.put(`/organizations/${orgId}/appearance`, { themeColor: newColor, headerImage: newImage });
            setThemeColor(newColor);
            setHeaderImage(newImage);
            setSnackbarMessage("Appearance updated");
            setOrg((prev: any) => ({ ...prev, themeColor: newColor, headerImage: newImage }));
        } catch (error) {
            console.error("Failed to update appearance:", error);
            setSnackbarMessage("Failed to update appearance");
        }
    };

    if (loading) {
        return (
            <RoleLayout>
                <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
                    <CircularProgress />
                </Box>
            </RoleLayout>
        );
    }

    if (!org) {
        return (
            <RoleLayout>
                <Container maxWidth="md" sx={{ mt: 8, textAlign: "center" }}>
                    <Typography variant="h5" color="text.secondary">Organization not found.</Typography>
                    <Button onClick={() => navigate("/home")} sx={{ mt: 2 }}>Back to Home</Button>
                </Container>
            </RoleLayout>
        );
    }

    return (
        <RoleLayout>
            <Container maxWidth="md">
                {/* Organization Banner */}
                <Paper
                    elevation={0}
                    sx={{
                        borderRadius: 3,
                        bgcolor: themeColor,
                        backgroundImage: headerImage ? `url(${headerImage})` : 'none',
                        backgroundSize: 'cover',
                        backgroundPosition: 'center',
                        p: { xs: 3, md: 5 },
                        mb: 4,
                        color: "white",
                        position: "relative",
                        overflow: "hidden"
                    }}
                >
                    <Box sx={{ position: "relative", zIndex: 1, display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                        <Box>
                            <Typography variant="h3" fontWeight={800} gutterBottom sx={{ fontSize: { xs: "1.75rem", md: "2.5rem" } }}>
                                {org.name}
                            </Typography>
                            <Box display="flex" gap={2} alignItems="center">
                                <Typography variant="subtitle1" sx={{ opacity: 0.9 }}>
                                    {org.termId ? `${org.termId.semester} ${org.termId.academicYear}` : "Academic Term"}
                                </Typography>
                                <Divider orientation="vertical" flexItem sx={{ bgcolor: "rgba(255,255,255,0.3)" }} />
                                <Typography variant="subtitle1" sx={{ opacity: 0.9 }}>
                                    {org.institutionId?.name || "Institution"}
                                </Typography>
                                {org.status === 'archived' && (
                                    <Chip label="Archived" size="small" sx={{ bgcolor: "rgba(255,255,255,0.2)", color: "white", ml: 1 }} />
                                )}
                            </Box>
                        </Box>
                        {isAdmin && org.status !== 'archived' && (
                            <Box sx={{ display: 'flex', gap: 1 }}>
                                {isOfficer && (
                                    <Button
                                        variant="contained"
                                        startIcon={<EditIcon sx={{ fontSize: 18 }} />}
                                        onClick={() => setIsCustomiseModalOpen(true)}
                                        sx={{
                                            bgcolor: "white",
                                            color: "#1967d2",
                                            fontWeight: 500,
                                            textTransform: "none",
                                            borderRadius: 20,
                                            px: 2,
                                            mr: 1,
                                            "&:hover": {
                                                bgcolor: "#f8f9fa"
                                            }
                                        }}
                                    >
                                        Customise
                                    </Button>
                                )}
                                <Tooltip title="Archive Organization">
                                    <IconButton onClick={handleArchive} sx={{ color: "white", bgcolor: "rgba(255,255,255,0.1)", "&:hover": { bgcolor: "rgba(255,255,255,0.2)" } }}>
                                        <ArchiveIcon />
                                    </IconButton>
                                </Tooltip>
                            </Box>
                        )}
                        {isOfficer && !isAdmin && org.status !== 'archived' && (
                             <Button
                                 variant="contained"
                                 startIcon={<EditIcon sx={{ fontSize: 18 }} />}
                                 onClick={() => setIsCustomiseModalOpen(true)}
                                 sx={{
                                     bgcolor: "white",
                                     color: "#1967d2",
                                     fontWeight: 500,
                                     textTransform: "none",
                                     borderRadius: 20,
                                     px: 2,
                                     "&:hover": {
                                         bgcolor: "#f8f9fa"
                                     }
                                 }}
                             >
                                 Customise
                             </Button>
                        )}
                    </Box>

                    {/* Decorative element */}
                    <Box sx={{
                        position: "absolute",
                        right: -50,
                        bottom: -50,
                        width: 200,
                        height: 200,
                        borderRadius: "50%",
                        bgcolor: "rgba(255,255,255,0.05)"
                    }} />
                </Paper>

                {/* Tabs */}
                <Box sx={{ borderBottom: 1, borderColor: "divider", mb: 4 }}>
                    <Tabs
                        value={tabValue}
                        onChange={(_, v) => setTabValue(v)}
                        textColor="inherit"
                        TabIndicatorProps={{ sx: { bgcolor: "#0F172A", height: 3 } }}
                        sx={{
                            "& .MuiTab-root": {
                                textTransform: "none",
                                fontWeight: 700,
                                fontSize: "1rem",
                                minWidth: 100,
                                py: 1.5
                            },
                            "& .Mui-selected": {
                                color: "#0F172A"
                            }
                        }}
                    >
                        <Tab label="Stream" />
                        <Tab label="Requirements" />
                        <Tab label="People" />
                    </Tabs>
                </Box>

                {tabValue === 0 ? (
                    <Box sx={{ display: "flex", flexDirection: { xs: "column", md: "row" }, gap: 4 }}>
                        {/* Left Side: Stats/Quick Info */}
                        <Box sx={{ width: { xs: "100%", md: 240 }, flexShrink: 0, display: 'flex', flexDirection: 'column', gap: 3 }}>
                            {/* Org Code Box (Officer only) */}
                            {isOfficer && org?.status !== 'archived' && (
                                <Paper sx={{ p: 2, borderRadius: 2, border: "1px solid #E2E8F0", display: 'flex', flexDirection: 'column' }} elevation={0}>
                                    <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                                        <Typography variant="subtitle2" fontWeight={700} sx={{ fontFamily: "'Inter', 'Plus Jakarta Sans', 'Montserrat', sans-serif" }}>
                                            Org code
                                        </Typography>
                                        <IconButton size="small" onClick={handleMenuClick}>
                                            <MoreVertIcon fontSize="small" />
                                        </IconButton>
                                        <Menu
                                            anchorEl={anchorEl}
                                            open={Boolean(anchorEl)}
                                            onClose={handleMenuClose}
                                            anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                                            transformOrigin={{ vertical: 'top', horizontal: 'right' }}
                                            PaperProps={{
                                                elevation: 3,
                                                sx: { mt: 1, minWidth: 200, borderRadius: 2 }
                                            }}
                                        >
                                            <MenuItem onClick={handleCopyInviteLink} sx={{ fontSize: '0.875rem', py: 1.5 }}>Copy org invite link</MenuItem>
                                            <MenuItem onClick={handleCopyClassCode} sx={{ fontSize: '0.875rem', py: 1.5 }}>Copy org code</MenuItem>
                                            <MenuItem onClick={handleMenuClose} sx={{ fontSize: '0.875rem', py: 1.5 }}>Reset org code</MenuItem>
                                            <MenuItem onClick={handleMenuClose} sx={{ fontSize: '0.875rem', py: 1.5 }}>Turn off</MenuItem>
                                        </Menu>
                                    </Box>
                                    <Box display="flex" alignItems="center" gap={1}>
                                        <Typography variant="h5" sx={{ fontFamily: "'Inter', 'Plus Jakarta Sans', 'Montserrat', sans-serif", color: '#0F172A', fontWeight: 400, letterSpacing: 1 }}>
                                            {org.joinCode}
                                        </Typography>
                                        <IconButton size="small" sx={{ color: '#1967d2' }}>
                                            <FullscreenIcon fontSize="small" />
                                        </IconButton>
                                    </Box>
                                </Paper>
                            )}

                            <Paper sx={{ p: 2, borderRadius: 2, border: "1px solid #E2E8F0" }} elevation={0}>
                                <Typography variant="subtitle2" fontWeight={700} gutterBottom sx={{ fontFamily: "'Inter', 'Plus Jakarta Sans', 'Montserrat', sans-serif" }}>
                                    Upcoming
                                </Typography>
                                <Typography variant="body2" sx={{ mb: 2, color: "#64748B", fontFamily: "'Inter', 'Plus Jakarta Sans', 'Montserrat', sans-serif" }}>
                                    {requirements.filter(r => r.status !== 'approved' && !r.isAnnouncement).length} items to complete
                                </Typography>
                                <Button
                                    variant="text"
                                    size="small"
                                    sx={{ textTransform: 'none', fontWeight: 700, p: 0, fontFamily: "'Inter', 'Plus Jakarta Sans', 'Montserrat', sans-serif" }}
                                    onClick={() => navigate("/student/progress")}
                                >
                                    View all
                                </Button>
                            </Paper>
                        </Box>

                        {/* Right Side: Stream Content */}
                        <Box sx={{ flex: 1 }}>
                            {/* Announce Area (Officer only) */}
                            {isOfficer && org.status !== 'archived' && (
                                <StreamComposer 
                                    organizationId={org._id}
                                    onCreated={fetchData}
                                />
                            )}

                            {/* Stream Feed */}
                            {requirements.length > 0 ? (
                                requirements.map((req) => (
                                    <ClearanceRequirementCard
                                        key={req._id}
                                        id={req._id}
                                        title={req.title}
                                        description={req.description}
                                        instructions={req.instructions}
                                        status={req.status}
                                        isMandatory={req.isMandatory}
                                        isAnnouncement={req.isAnnouncement}
                                        type={req.type}
                                        author={req.createdBy}
                                        stats={isOfficer ? req.stats : undefined}
                                        createdAt={req.createdAt}
                                        onAction={handleAction}
                                        onEdit={isOfficer ? handleEditRequirement : undefined}
                                        onDelete={isOfficer || isAdmin ? handleDeleteRequirement : undefined}
                                    />
                                ))
                            ) : (
                                <Box sx={{ textAlign: "center", py: 8 }}>
                                    <Typography color="text.secondary">No items posted in the stream yet.</Typography>
                                </Box>
                            )}
                        </Box>
                    </Box>
                ) : tabValue === 1 ? (
                    <Box sx={{ pb: 8 }}>
                        {/* Create Button (Officer only) */}
                        {isOfficer && org.status !== 'archived' && (
                            <Box sx={{ mb: 3 }}>
                                <Button
                                    variant="contained"
                                    startIcon={<AddIcon />}
                                    onClick={handleCreateMenuClick}
                                    sx={{
                                        borderRadius: 20,
                                        bgcolor: "#1967d2",
                                        textTransform: "none",
                                        fontWeight: 600,
                                        fontSize: "0.875rem",
                                        px: 3,
                                        py: 1.2,
                                        boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
                                        '&:hover': { bgcolor: '#1557b0', boxShadow: '0 4px 8px rgba(0,0,0,0.2)' }
                                    }}
                                >
                                    Create
                                </Button>
                                <Menu
                                    anchorEl={createMenuAnchorEl}
                                    open={Boolean(createMenuAnchorEl)}
                                    onClose={handleCreateMenuClose}
                                    anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
                                    transformOrigin={{ vertical: 'top', horizontal: 'left' }}
                                    PaperProps={{
                                        elevation: 3,
                                        sx: { mt: 1, minWidth: 260, borderRadius: 2, py: 1 }
                                    }}
                                >
                                    <MenuItem 
                                        onClick={() => { handleCreateMenuClose(); setIsCreateModalOpen(true); }} 
                                        sx={{ py: 1.5 }}
                                    >
                                        <ListItemIcon sx={{ color: "#3c4043", minWidth: 40 }}><AssignmentIcon /></ListItemIcon>
                                        <ListItemText primaryTypographyProps={{ fontWeight: 500, fontSize: "0.9375rem", color: "#3c4043" }}>Clearance Requirement</ListItemText>
                                    </MenuItem>
                                    <MenuItem onClick={() => { handleCreateMenuClose(); setIsCreateFormModalOpen(true); }}>
                                        <ListItemIcon><FactCheckIcon fontSize="small" sx={{ color: "#5f6368" }} /></ListItemIcon>
                                        <ListItemText primaryTypographyProps={{ fontWeight: 500, fontSize: "0.9375rem", color: "#3c4043" }}>Create Form</ListItemText>
                                    </MenuItem>
                                    <MenuItem onClick={() => { handleCreateMenuClose(); setIsCreatePollModalOpen(true); }} sx={{ py: 1.5 }}>
                                        <ListItemIcon sx={{ color: "#3c4043", minWidth: 40 }}><HelpOutlineIcon /></ListItemIcon>
                                        <ListItemText primaryTypographyProps={{ fontWeight: 500, fontSize: "0.9375rem", color: "#3c4043" }}>Create Poll</ListItemText>
                                    </MenuItem>
                                    <MenuItem onClick={() => { handleCreateMenuClose(); setIsCreateMaterialModalOpen(true); }} sx={{ py: 1.5 }}>
                                        <ListItemIcon sx={{ color: "#3c4043", minWidth: 40 }}><BookIcon /></ListItemIcon>
                                        <ListItemText primaryTypographyProps={{ fontWeight: 500, fontSize: "0.9375rem", color: "#3c4043" }}>Guidelines / Documents</ListItemText>
                                    </MenuItem>
                                </Menu>
                            </Box>
                        )}
                        
                        {/* Actionable Work Items List */}
                        {requirements.filter(req => !req.isAnnouncement && req.type !== 'announcement' && req.type !== 'material').length > 0 ? (
                            requirements.filter(req => !req.isAnnouncement && req.type !== 'announcement' && req.type !== 'material').map((req) => (
                                <ClearanceRequirementCard
                                    key={req._id}
                                    id={req._id}
                                    title={req.title}
                                    description={req.description}
                                    instructions={req.instructions}
                                    status={req.status}
                                    isMandatory={req.isMandatory}
                                    isAnnouncement={req.isAnnouncement}
                                    type={req.type}
                                    author={req.createdBy}
                                    stats={isOfficer ? req.stats : undefined}
                                    createdAt={req.createdAt}
                                    onAction={handleAction}
                                    onEdit={isOfficer ? handleEditRequirement : undefined}
                                    onDelete={isOfficer || isAdmin ? handleDeleteRequirement : undefined}
                                />
                            ))
                        ) : (
                            <Box sx={{ textAlign: "center", py: 8 }}>
                                <Typography color="text.secondary">No actionable requirements posted yet.</Typography>
                            </Box>
                        )}
                    </Box>
                ) : (
                    <Box sx={{ pb: 8 }}>
                        <MembersList
                            organizationId={orgId || ""}
                            isOfficer={isOfficer}
                            isAdmin={isAdmin}
                        />
                    </Box>
                )}

                {/* Modals */}
                <SubmissionModal
                    open={isSubmissionModalOpen}
                    onClose={() => setIsSubmissionModalOpen(false)}
                    requirementId={selectedReq?._id || ""}
                    organizationId={orgId || ""}
                    requirementTitle={selectedReq?.title || ""}
                    status={selectedReq?.status || "not_started"}
                    existingFiles={selectedReq?.files || []}
                    onSubmitted={fetchData}
                />

                <ReviewSubmissionsModal
                    open={isReviewModalOpen}
                    onClose={() => setIsReviewModalOpen(false)}
                    requirementId={selectedReq?._id || ""}
                    requirementTitle={selectedReq?.title || ""}
                    onReviewComplete={fetchData}
                />

                <CreateRequirementModal
                    open={isCreateModalOpen}
                    onClose={() => {
                        setIsCreateModalOpen(false);
                        setIsEditMode(false);
                        setEditData(null);
                    }}
                    organizationId={orgId || ""}
                    organizationName={org?.name}
                    students={students}
                    onCreated={fetchData}
                    isEdit={isEditMode}
                    editData={editData}
                />

                <CreateFormModal
                    open={isCreateFormModalOpen}
                    onClose={() => {
                        setIsCreateFormModalOpen(false);
                        setIsEditMode(false);
                        setEditData(null);
                    }}
                    organizationId={orgId || ""}
                    organizationName={org?.name}
                    students={students}
                    onCreated={fetchData}
                    isEdit={isEditMode}
                    editData={editData}
                />

                <CreatePollModal
                    open={isCreatePollModalOpen}
                    onClose={() => {
                        setIsCreatePollModalOpen(false);
                        setIsEditMode(false);
                        setEditData(null);
                    }}
                    organizationId={orgId || ""}
                    organizationName={org?.name}
                    students={students}
                    onCreated={fetchData}
                    isEdit={isEditMode}
                    editData={editData}
                />

                <CreateMaterialModal
                    open={isCreateMaterialModalOpen}
                    onClose={() => {
                        setIsCreateMaterialModalOpen(false);
                        setIsEditMode(false);
                        setEditData(null);
                    }}
                    organizationId={orgId || ""}
                    organizationName={org?.name}
                    students={students}
                    onCreated={fetchData}
                    isEdit={isEditMode}
                    editData={editData}
                />

                <CustomiseAppearanceModal
                    open={isCustomiseModalOpen}
                    onClose={() => setIsCustomiseModalOpen(false)}
                    currentThemeColor={themeColor}
                    currentHeaderImage={headerImage}
                    onSave={handleSaveAppearance}
                />
                
                <Snackbar
                    open={Boolean(snackbarMessage)}
                    autoHideDuration={3000}
                    onClose={() => setSnackbarMessage("")}
                    message={snackbarMessage}
                />
            </Container>
        </RoleLayout>
    );
};

export default StreamPage;
