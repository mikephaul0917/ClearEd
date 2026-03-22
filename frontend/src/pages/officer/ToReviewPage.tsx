import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
    Box, Typography, Container, Tabs, Tab, Select, MenuItem,
    Accordion, AccordionSummary, AccordionDetails, Avatar,
    IconButton, Divider, CircularProgress
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import AssignmentIcon from "@mui/icons-material/Assignment";
import LiveHelpIcon from "@mui/icons-material/LiveHelp";
import BookIcon from "@mui/icons-material/Book";
import RoleLayout from "../../components/layout/RoleLayout";
import { api, organizationService } from "../../services";

export default function ToReviewPage() {
    const nav = useNavigate();
    const [tabValue, setTabValue] = useState(0);
    const [selectedOrg, setSelectedOrg] = useState("all");
    const [organizations, setOrganizations] = useState<any[]>([]);
    const [requirements, setRequirements] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                // Fetch orgs
                const orgsRes = await organizationService.getMyOrganizations();
                if (orgsRes && orgsRes.organizations) {
                    const officers = orgsRes.organizations.filter((org: any) => org.membership?.role === 'officer');
                    setOrganizations(officers);
                }

                // Fetch all requirements for the officer
                const reqRes = await api.get("/signatory/requirements");
                setRequirements(reqRes.data.requirements || []);
            } catch (err) {
                console.error("Failed to load To Review data", err);
            }
            setLoading(false);
        };
        fetchData();
    }, []);

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
            return pending > 0 || marked === 0;
        });
    }, [filteredRequirements]);

    const reviewedReqs = useMemo(() => {
        return filteredRequirements.filter(r => {
            const pending = r.stats?.pending || 0;
            const marked = (r.stats?.approved || 0) + (r.stats?.rejected || 0);
            return pending === 0 && marked > 0;
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
        const orgName = req.organizationId?.name || "Unknown Class";

        // Date formatting
        const createdAt = new Date(req.createdAt);
        const today = new Date();
        const isToday = createdAt.getDate() === today.getDate() && createdAt.getMonth() === today.getMonth() && createdAt.getFullYear() === today.getFullYear();
        const dateStr = isToday ? "Today" : createdAt.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });

        const pending = req.stats?.pending || 0;
        const marked = (req.stats?.approved || 0) + (req.stats?.rejected || 0);
        const assigned = pending + marked; // Simplify assigned logic assuming every member has one submission or count of actual assignments pending. Or if Assigned implies total class members, we don't have that yet, so Handed In + Marked + Missing. We'll mirror current logic.

        return (
            <Box
                key={req._id}
                sx={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    py: 2,
                    borderBottom: '1px solid #f1f3f4',
                    '&:hover': { bgcolor: '#f8f9fa' },
                    cursor: 'pointer',
                    px: 1,
                    borderRadius: 1
                }}
                onClick={() => nav(`/organization/${req.organizationId?._id}/requirement/${req._id}`)}
            >
                <Avatar sx={{ bgcolor: '#f1f3f4', width: 40, height: 40, mr: 2 }}>
                    <Icon sx={{ color: '#5f6368', fontSize: 24 }} />
                </Avatar>

                <Box sx={{ flex: 1, minWidth: 0, pt: 0.5 }}>
                    <Typography sx={{ color: '#3c4043', fontWeight: 500, fontSize: '0.875rem', mb: 0.5, textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                        {req.title}
                    </Typography>
                    <Typography sx={{ color: '#5f6368', fontSize: '0.75rem' }}>
                        {orgName} • Posted {dateStr}
                    </Typography>
                </Box>

                <Box sx={{ display: 'flex', gap: { xs: 2, sm: 4 }, pr: 2, textAlign: 'center' }}>
                    <Box>
                        <Typography sx={{ fontSize: '2rem', color: '#3c4043', lineHeight: 1, fontWeight: 400 }}>{pending}</Typography>
                        <Typography sx={{ fontSize: '0.75rem', color: '#5f6368', mt: 0.5 }}>Handed in</Typography>
                    </Box>
                    <Box sx={{ borderLeft: '1px solid #dadce0', pl: { xs: 2, sm: 4 } }}>
                        <Typography sx={{ fontSize: '2rem', color: '#3c4043', lineHeight: 1, fontWeight: 400 }}>{assigned}</Typography>
                        <Typography sx={{ fontSize: '0.75rem', color: '#5f6368', mt: 0.5 }}>Assigned</Typography>
                    </Box>
                    <Box sx={{ borderLeft: '1px solid #dadce0', pl: { xs: 2, sm: 4 } }}>
                        <Typography sx={{ fontSize: '2rem', color: '#3c4043', lineHeight: 1, fontWeight: 400 }}>{marked}</Typography>
                        <Typography sx={{ fontSize: '0.75rem', color: '#5f6368', mt: 0.5 }}>Marked</Typography>
                    </Box>
                </Box>

                <IconButton size="small" sx={{ color: '#5f6368', mt: 1 }} onClick={(e) => e.stopPropagation()}>
                    <MoreVertIcon fontSize="small" />
                </IconButton>
            </Box>
        );
    };

    return (
        <RoleLayout>
            <Container maxWidth="lg" sx={{ px: { xs: 0, md: 3 } }}>
                <Box sx={{ borderBottom: 1, borderColor: "divider", mb: 4 }}>
                    <Tabs
                        value={tabValue}
                        onChange={(_, v) => setTabValue(v)}
                        textColor="primary"
                        TabIndicatorProps={{ sx: { bgcolor: "black", height: 3, borderTopLeftRadius: 3, borderTopRightRadius: 3 } }}
                        sx={{
                            px: { xs: 2, md: 0 },
                            "& .MuiTab-root": {
                                textTransform: "none",
                                fontWeight: 500,
                                fontSize: "0.875rem",
                                minWidth: 100,
                                color: "black"
                            },
                            "& .Mui-selected": {
                                color: "black !important"
                            }
                        }}
                    >
                        <Tab label="To review" />
                        <Tab label="Reviewed" />
                    </Tabs>
                </Box>

                <Box sx={{ px: { xs: 2, md: 0 } }}>
                    <Select
                        value={selectedOrg}
                        onChange={(e) => setSelectedOrg(e.target.value)}
                        size="small"
                        sx={{
                            width: 250,
                            mb: 4,
                            borderRadius: '4px',
                            color: '#3c4043',
                            '& .MuiOutlinedInput-notchedOutline': {
                                borderColor: '#1a73e8',
                                borderWidth: 2
                            },
                            '&:hover .MuiOutlinedInput-notchedOutline': {
                                borderColor: '#1a73e8',
                            },
                            '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                                borderColor: '#1a73e8',
                            }
                        }}
                    >
                        <MenuItem value="all">All classes</MenuItem>
                        {organizations.map(org => (
                            <MenuItem key={org._id} value={org._id}>{org.name}</MenuItem>
                        ))}
                    </Select>

                    {loading ? (
                        <Box display="flex" justifyContent="center" py={8}>
                            <CircularProgress />
                        </Box>
                    ) : tabValue === 0 ? (
                        <Box pb={8}>
                            {/* No Due Date Accordion */}
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
                                    <Typography variant="h6" sx={{ color: '#3c4043', fontWeight: 400, flex: 1, fontSize: '1.25rem' }}>
                                        No due date
                                    </Typography>
                                    <Typography variant="body2" sx={{ color: 'black', fontWeight: 500, mr: 1, fontSize: '0.875rem' }}>
                                        {noDueDateReqs.length}
                                    </Typography>
                                </AccordionSummary>
                                <AccordionDetails sx={{ px: 0, py: 0 }}>
                                    <Box sx={{ borderTop: '1px solid #f1f3f4' }}>
                                        {noDueDateReqs.map(renderRequirementItem)}
                                    </Box>
                                </AccordionDetails>
                            </Accordion>

                            <Box sx={{ height: 24 }} />

                            {/* Work in progress Accordion */}
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
                                    <Typography variant="h6" sx={{ color: '#3c4043', fontWeight: 400, flex: 1, fontSize: '1.25rem' }}>
                                        Work in progress
                                    </Typography>
                                    <Typography variant="body2" sx={{ color: '#5f6368', fontWeight: 500, mr: 1, fontSize: '0.875rem' }}>
                                        {workInProgressReqs.length}
                                    </Typography>
                                </AccordionSummary>
                                <AccordionDetails sx={{ px: 0, py: 0 }}>
                                    <Box sx={{ borderTop: '1px solid #f1f3f4' }}>
                                        {workInProgressReqs.map(renderRequirementItem)}
                                    </Box>
                                </AccordionDetails>
                            </Accordion>
                        </Box>
                    ) : tabValue === 1 && reviewedReqs.length === 0 ? (
                        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', pt: 12, pb: 10 }}>
                            <Typography sx={{ color: '#3c4043', mb: 1, fontWeight: 500, fontSize: '1rem' }}>
                                No reviewed work yet
                            </Typography>
                            <Typography sx={{ color: '#5f6368', fontSize: '0.875rem' }}>
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
                                    <Typography variant="h6" sx={{ color: '#3c4043', fontWeight: 400, flex: 1, fontSize: '1.25rem' }}>
                                        Completed Reviews
                                    </Typography>
                                    <Typography variant="body2" sx={{ color: '#5f6368', fontWeight: 500, mr: 1, fontSize: '0.875rem' }}>
                                        {reviewedReqs.length}
                                    </Typography>
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
        </RoleLayout>
    );
}
