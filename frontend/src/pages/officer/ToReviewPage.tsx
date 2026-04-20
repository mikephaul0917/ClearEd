import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
    Box, Typography, Container, Tabs, Tab, Select, MenuItem,
    Accordion, AccordionSummary, AccordionDetails, Avatar,
    IconButton, Divider, CircularProgress, Menu, ListItemIcon, ListItemText,
    Skeleton
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import AssignmentIcon from "@mui/icons-material/Assignment";
import LiveHelpIcon from "@mui/icons-material/LiveHelp";
import BookIcon from "@mui/icons-material/Book";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import HistoryIcon from "@mui/icons-material/History";
import { api, organizationService } from "../../services";

export default function ToReviewPage() {
    const nav = useNavigate();
    const [tabValue, setTabValue] = useState(0);
    const [selectedOrg, setSelectedOrg] = useState("all");
    const [organizations, setOrganizations] = useState<any[]>([]);
    const [requirements, setRequirements] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [isInitialLoad, setIsInitialLoad] = useState(true);
    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
    const [menuReq, setMenuReq] = useState<any>(null);

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            // Fetch orgs
            const orgsRes = await organizationService.getMyOrganizations();
            if (orgsRes && orgsRes.organizations) {
                const officers = orgsRes.organizations.filter((org: any) => 
                    org.membership?.role === 'officer' && org.status === 'active'
                );
                setOrganizations(officers);
            }

            // Fetch all requirements for the officer
            const reqRes = await api.get("/signatory/requirements");
            setRequirements(reqRes.data.requirements || []);
        } catch (err) {
            console.error("Failed to load To Review data", err);
        } finally {
            setLoading(false);
            setIsInitialLoad(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);


    const filteredRequirements = useMemo(() => {
        if (selectedOrg === "all") {
            return requirements;
        }
        return requirements.filter(r => r.organizationId?._id === selectedOrg);
    }, [requirements, selectedOrg]);

    const toReviewReqs = useMemo(() => {
        return filteredRequirements.filter(r => {
            const pending = r.stats?.pending || 0;
            const marked = (r.stats?.approved || 0) + (r.stats?.rejected || 0);
            return !r.isReviewed && (pending > 0 || marked === 0);
        });
    }, [filteredRequirements]);

    const reviewedReqs = useMemo(() => {
        return filteredRequirements.filter(r => {
            const pending = r.stats?.pending || 0;
            const marked = (r.stats?.approved || 0) + (r.stats?.rejected || 0);
            return r.isReviewed || (pending === 0 && marked > 0);
        });
    }, [filteredRequirements]);

    const noDueDateReqs = useMemo(() => {
        return toReviewReqs.filter(r => !r.dueDate);
    }, [toReviewReqs]);

    const workInProgressReqs = useMemo(() => {
        return toReviewReqs.filter(r => r.dueDate);
    }, [toReviewReqs]);

    const renderRequirementItem = (req: any) => {
        const Icon = req.type === 'poll' ? LiveHelpIcon : req.type === 'material' ? BookIcon : AssignmentIcon;
        const orgName = req.organizationId?.name || "Unknown Organization";

        // Date formatting
        const createdAt = new Date(req.createdAt);
        const today = new Date();
        const isToday = createdAt.getDate() === today.getDate() && createdAt.getMonth() === today.getMonth() && createdAt.getFullYear() === today.getFullYear();
        const dateStr = isToday ? "Today" : createdAt.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });

        const pending = req.stats?.pending || 0;
        const marked = (req.stats?.approved || 0) + (req.stats?.rejected || 0);
        const assigned = pending + marked;

        return (
            <Box
                key={req._id}
                sx={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    py: { xs: 2.5, sm: 2 },
                    borderBottom: '1px solid #f1f3f4',
                    '&:hover': { bgcolor: '#f8f9fa' },
                    cursor: 'pointer',
                    px: { xs: 1.5, sm: 1 },
                    borderRadius: 1
                }}
                onClick={() => nav(`/organization/${req.organizationId?._id}/requirement/${req._id}`)}
            >
                <Avatar sx={{ bgcolor: '#f1f3f4', width: { xs: 32, sm: 40 }, height: { xs: 32, sm: 40 }, mr: { xs: 1.5, sm: 2 }, mt: 0.5 }}>
                    <Icon sx={{ color: '#5f6368', fontSize: { xs: 18, sm: 24 } }} />
                </Avatar>

                <Box sx={{ flex: 1, minWidth: 0 }}>
                    {/* Top Row: Title & Info */}
                    <Box sx={{ mb: { xs: 2, sm: 0 }, display: 'flex', flexDirection: { xs: 'column', sm: 'row' } }}>
                        <Box sx={{ flex: 1, minWidth: 0 }}>
                            <Typography sx={{ color: '#3c4043', fontWeight: 600, fontSize: { xs: '0.9rem', sm: '0.875rem' }, mb: 0.25, pr: 2 }}>
                                {req.title}
                            </Typography>
                            <Typography sx={{ color: '#5f6368', fontSize: '0.75rem', mb: { xs: 1.5, sm: 0 } }}>
                                {orgName} • Posted {dateStr}
                            </Typography>
                        </Box>

                        {/* Stats Row: Stacks on mobile, stays right on desktop */}
                        <Box sx={{ 
                            display: 'flex', 
                            gap: { xs: 0, sm: 4 }, 
                            pr: { xs: 0, sm: 2 }, 
                            textAlign: 'center',
                            justifyContent: { xs: 'space-between', sm: 'flex-end' },
                            width: { xs: '100%', sm: 'auto' },
                            pt: { xs: 1, sm: 0 },
                            borderTop: { xs: '1px solid #f1f3f4', sm: 'none' }
                        }}>
                            <Box sx={{ flex: { xs: 1, sm: 'none' }, py: { xs: 1, sm: 0 } }}>
                                <Typography sx={{ fontSize: { xs: '1.25rem', sm: '1.75rem' }, color: '#3c4043', lineHeight: 1, fontWeight: 500 }}>{pending}</Typography>
                                <Typography sx={{ fontSize: '10px', color: '#5f6368', mt: 0.5, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Handed in</Typography>
                            </Box>
                            <Box sx={{ 
                                flex: { xs: 1, sm: 'none' }, 
                                py: { xs: 1, sm: 0 },
                                borderLeft: '1px solid #dadce0', 
                                pl: { xs: 0, sm: 4 } 
                            }}>
                                <Typography sx={{ fontSize: { xs: '1.25rem', sm: '1.75rem' }, color: '#3c4043', lineHeight: 1, fontWeight: 500 }}>{assigned}</Typography>
                                <Typography sx={{ fontSize: '10px', color: '#5f6368', mt: 0.5, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Assigned</Typography>
                            </Box>
                            <Box sx={{ 
                                flex: { xs: 1, sm: 'none' }, 
                                py: { xs: 1, sm: 0 },
                                borderLeft: '1px solid #dadce0', 
                                pl: { xs: 0, sm: 4 } 
                            }}>
                                <Typography sx={{ fontSize: { xs: '1.25rem', sm: '1.75rem' }, color: '#3c4043', lineHeight: 1, fontWeight: 500 }}>{marked}</Typography>
                                <Typography sx={{ fontSize: '10px', color: '#5f6368', mt: 0.5, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Marked</Typography>
                            </Box>
                        </Box>
                    </Box>
                </Box>

                <IconButton 
                    size="small" 
                    sx={{ color: '#5f6368', ml: 1, mt: 0.25 }} 
                    onClick={(e) => {
                        e.stopPropagation();
                        setAnchorEl(e.currentTarget);
                        setMenuReq(req);
                    }}
                >
                    <MoreVertIcon fontSize="small" />
                </IconButton>
            </Box>
        );
    };

    const handleMenuClose = () => {
        setAnchorEl(null);
        setMenuReq(null);
    };

    const handleToggleReviewed = async () => {
        if (!menuReq) return;
        try {
            await api.put(`/signatory/requirements/${menuReq._id}`, {
                isReviewed: tabValue === 0
            });
            handleMenuClose();
            fetchData();
        } catch (err) {
            console.error("Failed to update reviewed status", err);
        }
    };

    return (
        <Box sx={{ minHeight: '100vh', bgcolor: '#F9FAFB' }}>
            <Box sx={{ 
                borderBottom: 1, 
                borderColor: "divider", 
                mb: { xs: 3, md: 4 },
                bgcolor: '#F9FAFB',
                position: 'sticky',
                top: 0,
                zIndex: 10,
            }}>
                <Container maxWidth="lg" sx={{ px: { xs: 0, md: 3 } }}>
                    <Tabs
                        value={tabValue}
                        onChange={(_, v) => setTabValue(v)}
                        textColor="primary"
                        variant="standard"
                        TabIndicatorProps={{ 
                            sx: { 
                                bgcolor: "#0D9488", 
                                height: 3, 
                                borderTopLeftRadius: 3, 
                                borderTopRightRadius: 3 
                            } 
                        }}
                        sx={{
                            "& .MuiTab-root": {
                                textTransform: "none",
                                fontWeight: 600,
                                fontSize: "0.9375rem",
                                minWidth: { xs: 100, md: 120 },
                                py: 2.5,
                                color: "#5f6368",
                                transition: 'all 0.2s ease',
                                "&:hover": {
                                    color: "#0D9488",
                                    bgcolor: "rgba(13, 148, 136, 0.04)"
                                }
                            },
                            "& .Mui-selected": {
                                color: "#0D9488 !important",
                            }
                        }}
                    >
                        <Tab label="To review" />
                        <Tab label="Reviewed" />
                    </Tabs>
                </Container>
            </Box>

            <Container maxWidth="lg" sx={{ px: { xs: 2, md: 3 } }}>
                <Box sx={{ mt: { xs: 2, md: 0 } }}>
                    <Select
                        value={selectedOrg}
                        onChange={(e) => setSelectedOrg(e.target.value)}
                        size="small"
                        sx={{
                            width: { xs: '100%', sm: 280 },
                            mb: 4,
                            borderRadius: '8px',
                            color: '#3c4043',
                            bgcolor: '#fff',
                            '& .MuiOutlinedInput-notchedOutline': {
                                borderColor: '#dadce0',
                                borderWidth: 1
                            },
                            '&:hover .MuiOutlinedInput-notchedOutline': {
                                borderColor: '#202124',
                            },
                            '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                                borderColor: '#0D9488',
                                borderWidth: 2
                            }
                        }}
                    >
                        <MenuItem value="all">All organizations</MenuItem>
                        {organizations.map(org => (
                            <MenuItem key={org._id} value={org._id}>{org.name}</MenuItem>
                        ))}
                    </Select>

                    {loading && isInitialLoad ? (
                        <Box pb={8}>
                            <Skeleton variant="rectangular" width="100%" height={40} sx={{ width: { xs: '100%', sm: 250 }, mb: 4, borderRadius: '8px', bgcolor: "#f1f3f4" }} />
                            {[1, 2].map((group) => (
                                <Box key={group} sx={{ mb: 4 }}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', py: 1, mb: 1 }}>
                                        <Skeleton variant="text" width="40%" height={32} sx={{ bgcolor: "#f1f3f4", mr: 'auto' }} />
                                    </Box>
                                    <Divider sx={{ mb: 1 }} />
                                    {[1, 2].map((i) => (
                                        <Box key={i} sx={{ py: 2, borderBottom: '1px solid #f1f3f4' }}>
                                            <Box sx={{ display: 'flex', mb: 2 }}>
                                                <Skeleton variant="circular" width={32} height={32} sx={{ bgcolor: "#f1f3f4", mr: 2 }} />
                                                <Box sx={{ flex: 1 }}>
                                                    <Skeleton variant="text" width="60%" height={24} sx={{ bgcolor: "#f1f3f4" }} />
                                                    <Skeleton variant="text" width="30%" height={20} sx={{ bgcolor: "#f1f3f4" }} />
                                                </Box>
                                            </Box>
                                            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                                {[1, 2, 3].map(s => <Skeleton key={s} variant="rectangular" width="30%" height={50} sx={{ borderRadius: 1, bgcolor: "#f1f3f4" }} />)}
                                            </Box>
                                        </Box>
                                    ))}
                                </Box>
                            ))}
                        </Box>
                    ) : tabValue === 0 ? (
                        <Box pb={8}>
                            <Accordion
                                disableGutters
                                elevation={0}
                                defaultExpanded
                                sx={{
                                    '&:before': { display: 'none' },
                                    bgcolor: 'transparent',
                                    ...(noDueDateReqs.length === 0 && { mb: 2 })
                                }}
                            >
                                <AccordionSummary
                                    expandIcon={<ExpandMoreIcon sx={{ color: '#5f6368' }} />}
                                    sx={{ px: 0, minHeight: '48px', '& .MuiAccordionSummary-content': { my: 1, alignItems: 'center' } }}
                                >
                                    <Typography variant="h6" sx={{ color: '#3c4043', fontWeight: 600, flex: 1, fontSize: '1rem' }}>
                                        No due date
                                    </Typography>
                                    <Box sx={{ bgcolor: '#f1f3f4', px: 1, py: 0.25, borderRadius: 1, mr: 1 }}>
                                        <Typography variant="body2" sx={{ color: '#3c4043', fontWeight: 700, fontSize: '0.75rem' }}>
                                            {noDueDateReqs.length}
                                        </Typography>
                                    </Box>
                                </AccordionSummary>
                                <AccordionDetails sx={{ px: 0, py: 0 }}>
                                    <Box sx={{ borderTop: '1px solid #f1f3f4' }}>
                                        {noDueDateReqs.map(renderRequirementItem)}
                                    </Box>
                                </AccordionDetails>
                            </Accordion>

                            <Box sx={{ height: 24 }} />

                            <Accordion
                                disableGutters
                                elevation={0}
                                defaultExpanded
                                sx={{
                                    '&:before': { display: 'none' },
                                    bgcolor: 'transparent'
                                }}
                            >
                                <AccordionSummary
                                    expandIcon={<ExpandMoreIcon sx={{ color: '#5f6368' }} />}
                                    sx={{ px: 0, minHeight: '48px', '& .MuiAccordionSummary-content': { my: 1, alignItems: 'center' } }}
                                >
                                    <Typography variant="h6" sx={{ color: '#3c4043', fontWeight: 600, flex: 1, fontSize: '1rem' }}>
                                        Work in progress
                                    </Typography>
                                    <Box sx={{ bgcolor: '#f1f3f4', px: 1, py: 0.25, borderRadius: 1, mr: 1 }}>
                                        <Typography variant="body2" sx={{ color: '#3c4043', fontWeight: 700, fontSize: '0.75rem' }}>
                                            {workInProgressReqs.length}
                                        </Typography>
                                    </Box>
                                </AccordionSummary>
                                <AccordionDetails sx={{ px: 0, py: 0 }}>
                                    <Box sx={{ borderTop: '1px solid #f1f3f4' }}>
                                        {workInProgressReqs.map(renderRequirementItem)}
                                    </Box>
                                </AccordionDetails>
                            </Accordion>
                        </Box>
                    ) : tabValue === 1 && reviewedReqs.length === 0 ? (
                        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', pt: 12, pb: 10, textAlign: 'center' }}>
                            <Typography sx={{ color: '#3c4043', mb: 1, fontWeight: 600, fontSize: '1.1rem' }}>
                                No reviewed work yet
                            </Typography>
                            <Typography sx={{ color: '#5f6368', fontSize: '0.875rem', maxWidth: 400 }}>
                                Assignments move here automatically when there are no more pending student submissions left to review.
                            </Typography>
                        </Box>
                    ) : tabValue === 1 ? (
                        <Box pb={8}>
                            <Accordion
                                disableGutters
                                elevation={0}
                                defaultExpanded
                                sx={{
                                    '&:before': { display: 'none' },
                                    bgcolor: 'transparent'
                                }}
                            >
                                <AccordionSummary
                                    expandIcon={<ExpandMoreIcon sx={{ color: '#5f6368' }} />}
                                    sx={{ px: 0, minHeight: '48px', '& .MuiAccordionSummary-content': { my: 1, alignItems: 'center' } }}
                                >
                                    <Typography variant="h6" sx={{ color: '#3c4043', fontWeight: 600, flex: 1, fontSize: '1rem' }}>
                                        Completed Reviews
                                    </Typography>
                                    <Box sx={{ bgcolor: '#f1f3f4', px: 1, py: 0.25, borderRadius: 1, mr: 1 }}>
                                        <Typography variant="body2" sx={{ color: '#3c4043', fontWeight: 700, fontSize: '0.75rem' }}>
                                            {reviewedReqs.length}
                                        </Typography>
                                    </Box>
                                </AccordionSummary>
                                <AccordionDetails sx={{ px: 0, py: 0 }}>
                                    <Box sx={{ borderTop: '1px solid #f1f3f4' }}>
                                        {reviewedReqs.map(renderRequirementItem)}
                                    </Box>
                                </AccordionDetails>
                            </Accordion>
                        </Box>
                    ) : null}
                </Box>
            </Container>

            <Menu
                anchorEl={anchorEl}
                open={Boolean(anchorEl)}
                onClose={handleMenuClose}
                transformOrigin={{ horizontal: 'right', vertical: 'top' }}
                anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
                PaperProps={{
                    elevation: 0,
                    sx: { 
                        minWidth: 200, 
                        borderRadius: 2, 
                        mt: 0.5,
                        border: "1px solid #e0e0e0",
                        boxShadow: "0 4px 12px rgba(0,0,0,0.05)"
                    }
                }}
            >
                <MenuItem onClick={handleToggleReviewed} sx={{ py: 1.5 }}>
                    <ListItemIcon>
                        <HistoryIcon fontSize="small" />
                    </ListItemIcon>
                    <ListItemText 
                        primaryTypographyProps={{ fontWeight: 600, fontSize: "0.875rem", color: "#3c4043" }}
                    >
                        {tabValue === 1 ? "Mark as not reviewed" : "Mark as reviewed"}
                    </ListItemText>
                </MenuItem>
            </Menu>
        </Box>
    );
}

// Helper to use media queries
function useMediaQuery(query: string) {
    const [matches, setMatches] = useState(window.matchMedia(query).matches);
    useEffect(() => {
        const media = window.matchMedia(query);
        if (media.matches !== matches) setMatches(media.matches);
        const listener = () => setMatches(media.matches);
        media.addListener(listener);
        return () => media.removeListener(listener);
    }, [matches, query]);
    return matches;
}
