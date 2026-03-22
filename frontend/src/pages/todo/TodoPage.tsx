import React, { useState, useEffect, useCallback } from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Tabs from "@mui/material/Tabs";
import Tab from "@mui/material/Tab";
import Container from "@mui/material/Container";
import CircularProgress from "@mui/material/CircularProgress";
import Alert from "@mui/material/Alert";
import TodoItem from "../../components/todo/TodoItem";
import { useAuth } from "../../hooks/useAuth";
import { clearanceService } from "../../services";
import SubmissionModal from "../../components/stream/SubmissionModal";
import ReviewSubmissionsModal from "../../components/stream/ReviewSubmissionsModal";
import { EmptyState } from "../../components/layout/EmptyState";
import Button from "@mui/material/Button";

import Accordion from "@mui/material/Accordion";
import AccordionSummary from "@mui/material/AccordionSummary";
import AccordionDetails from "@mui/material/AccordionDetails";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import Select from "@mui/material/Select";
import MenuItem from "@mui/material/MenuItem";
import FormControl from "@mui/material/FormControl";
import { styled } from "@mui/material/styles";

interface TabPanelProps {
    children?: React.ReactNode;
    index: number;
    value: number;
}

function TabPanel(props: TabPanelProps) {
    const { children, value, index, ...other } = props;
    return (
        <div
            role="tabpanel"
            hidden={value !== index}
            {...other}
            style={{ minHeight: 400 }}
        >
            {value === index && <Box sx={{ pt: 3, pb: 6 }}>{children}</Box>}
        </div>
    );
}

const TodoPage: React.FC = () => {
    const { user } = useAuth();
    const isOfficer = user?.role === "officer";

    const [tabValue, setTabValue] = useState(0);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [todoData, setTodoData] = useState<any>({ assigned: [], missing: [], done: [] });

    // Modal state
    const [selectedItem, setSelectedItem] = useState<any>(null);
    const [isSubmissionOpen, setIsSubmissionOpen] = useState(false);
    const [isReviewOpen, setIsReviewOpen] = useState(false);

    // Filter state
    const [selectedOrg, setSelectedOrg] = useState<string>("all");

    // Extract unique organizations from all tabs
    const allOrganizations = React.useMemo(() => {
        const orgMap = new Map();
        const allItems = [...todoData.assigned, ...todoData.missing, ...todoData.done];
        
        allItems.forEach(item => {
            const orgName = isOfficer ? item.organizationName : (item.organizationId?.name || "Organization");
            const orgId = isOfficer ? item.organizationId : (item.organizationId?._id || item.organizationId || orgName);
            
            if (orgId && !orgMap.has(orgId)) {
                orgMap.set(orgId, orgName);
            }
        });
        
        return Array.from(orgMap.entries()).map(([id, name]) => ({ id, name }));
    }, [todoData, isOfficer]);

    const fetchData = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            if (isOfficer) {
                // Officer logic: Assigned = Pending reviews
                const data = await clearanceService.getOfficerSubmissions();
                const submissions = data.data;
                setTodoData({
                    assigned: submissions.filter((s: any) => s.status === 'pending'),
                    missing: [], // No strict "missing" for officers yet
                    done: submissions.filter((s: any) => s.status === 'approved' || s.status === 'rejected')
                });
            } else {
                // Student logic
                const data = await clearanceService.getStudentTodo();
                const { assigned, missing, done } = data.todoList;
                setTodoData({ assigned, missing, done });
            }
        } catch (err: any) {
            setError(err.response?.data?.message || "Failed to fetch to-do items.");
        } finally {
            setLoading(false);
        }
    }, [isOfficer]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleAction = (item: any) => {
        setSelectedItem(item);
        if (isOfficer) {
            setIsReviewOpen(true);
        } else {
            setIsSubmissionOpen(true);
        }
    };

    const renderEmptyState = (type: 'assigned' | 'missing' | 'done') => {
        if (isOfficer) {
            switch (type) {
                case 'assigned':
                    return (
                        <EmptyState
                            title="You're all caught up!"
                            description="There are currently no student submissions waiting for your review. Great job staying on top of things."
                        />
                    );
                case 'missing':
                    return (
                        <EmptyState
                            title="No missing items"
                            description="There are no missing requirements in your queue."
                        />
                    );
                case 'done':
                    return (
                        <EmptyState
                            title="No reviews completed yet"
                            description="Once you approve or reject student submissions, they will appear here for your reference."
                        />
                    );
            }
        } else {
            switch (type) {
                case 'assigned':
                    return (
                        <EmptyState
                            title="You're all caught up!"
                            description="You have no pending tasks to complete at the moment. Take a deep breath and enjoy your day."
                        />
                    );
                case 'missing':
                    return (
                        <EmptyState
                            title="Looking good!"
                            description="You don't have any missing or overdue requirements. Keep up the great work!"
                        />
                    );
                case 'done':
                    return (
                        <EmptyState
                            title="Nothing completed yet"
                            description="You haven't completed any requirements yet. Check your assigned tasks to get started."
                            action={
                                <Button
                                    variant="outlined"
                                    onClick={() => setTabValue(0)}
                                    sx={{ textTransform: 'none', borderRadius: 2, fontWeight: 600, mt: 1 }}
                                >
                                    View Assigned Tasks
                                </Button>
                            }
                        />
                    );
            }
        }
    };

    const renderList = (items: any[], type: 'assigned' | 'missing' | 'done') => {
        // Filter by organization
        const filteredItems = items.filter(item => {
            if (selectedOrg === "all") return true;
            const itemOrgId = isOfficer ? item.organizationId : (item.organizationId?._id || item.organizationId);
            const itemOrgName = isOfficer ? item.organizationName : (item.organizationId?.name || "Organization");
            return itemOrgId === selectedOrg || itemOrgName === selectedOrg;
        });

        if (filteredItems.length === 0) {
            return renderEmptyState(type);
        }

        // Group by pseudo due dates
        let groups: Record<string, any[]> = {};

        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        
        // Find start of this week (Sunday)
        const startOfThisWeek = new Date(today);
        startOfThisWeek.setDate(today.getDate() - today.getDay());
        
        const endOfThisWeek = new Date(startOfThisWeek);
        endOfThisWeek.setDate(startOfThisWeek.getDate() + 6);
        endOfThisWeek.setHours(23, 59, 59, 999);

        const startOfNextWeek = new Date(endOfThisWeek);
        startOfNextWeek.setDate(endOfThisWeek.getDate() + 1);
        startOfNextWeek.setHours(0, 0, 0, 0);

        const endOfNextWeek = new Date(startOfNextWeek);
        endOfNextWeek.setDate(startOfNextWeek.getDate() + 6);
        endOfNextWeek.setHours(23, 59, 59, 999);

        const startOfLastWeek = new Date(startOfThisWeek);
        startOfLastWeek.setDate(startOfThisWeek.getDate() - 7);
        startOfLastWeek.setHours(0, 0, 0, 0);

        if (type === 'assigned') {
            groups = { noDueDate: [], thisWeek: [], nextWeek: [], later: [] };
            filteredItems.forEach(item => {
                const dueDateStr = isOfficer ? item.dueDate : item.requirement?.dueDate;
                if (!dueDateStr) {
                    groups.noDueDate.push(item);
                } else {
                    const dueDate = new Date(dueDateStr);
                    if (dueDate >= startOfThisWeek && dueDate <= endOfThisWeek) groups.thisWeek.push(item);
                    else if (dueDate >= startOfNextWeek && dueDate <= endOfNextWeek) groups.nextWeek.push(item);
                    else if (dueDate > endOfNextWeek) groups.later.push(item);
                    else groups.noDueDate.push(item); // Fallback for past items still assigned
                }
            });
        } else if (type === 'missing') {
            groups = { thisWeek: [], lastWeek: [], earlier: [] };
            filteredItems.forEach(item => {
                const dueDateStr = isOfficer ? item.dueDate : item.requirement?.dueDate;
                if (!dueDateStr) {
                    groups.earlier.push(item);
                } else {
                    const dueDate = new Date(dueDateStr);
                    if (dueDate >= startOfThisWeek && dueDate <= endOfThisWeek) groups.thisWeek.push(item);
                    else if (dueDate >= startOfLastWeek && dueDate < startOfThisWeek) groups.lastWeek.push(item);
                    else groups.earlier.push(item);
                }
            });
        } else if (type === 'done') {
            groups = { noDueDate: [], thisWeek: [], lastWeek: [], earlier: [] };
            filteredItems.forEach(item => {
                const dueDateStr = isOfficer ? item.dueDate : item.requirement?.dueDate;
                if (!dueDateStr) {
                    groups.noDueDate.push(item);
                } else {
                    const dueDate = new Date(dueDateStr);
                    if (dueDate >= startOfThisWeek && dueDate <= endOfThisWeek) groups.thisWeek.push(item);
                    else if (dueDate >= startOfLastWeek && dueDate < startOfThisWeek) groups.lastWeek.push(item);
                    else if (dueDate < startOfLastWeek) groups.earlier.push(item);
                    else groups.noDueDate.push(item); // Fallback for future done items
                }
            });
        }

        // Common Accordion styles
        const accordionSx = {
            boxShadow: 'none',
            '&:before': { display: 'none' },
            borderBottom: '1px solid #E5E7EB',
            '&.Mui-expanded': { margin: 0 }
        };

        const renderAccordion = (title: string, groupItems: any[], defaultExpanded: boolean = false) => {
            const count = groupItems.length;
            return (
                <Accordion sx={accordionSx} defaultExpanded={defaultExpanded}>
                    <AccordionSummary
                        expandIcon={<ExpandMoreIcon sx={{ color: '#5F6368' }} />}
                        sx={{
                            px: 1,
                            minHeight: 64,
                            '&.Mui-expanded': { minHeight: 64 },
                            '& .MuiAccordionSummary-content': { alignItems: 'center', m: 0, '&.Mui-expanded': { m: 0 } }
                        }}
                    >
                        <Typography sx={{ fontSize: '1.25rem', color: '#3C4043', ml: 1, flex: 1, fontFamily: "'Google Sans', Roboto, Arial, sans-serif" }}>
                            {title}
                        </Typography>
                        <Typography sx={{ color: count > 0 ? '#1A73E8' : '#3C4043', mr: 2, fontSize: '0.875rem' }}>
                            {count}
                        </Typography>
                    </AccordionSummary>
                    <AccordionDetails sx={{ px: 2, pb: 3, pt: 0 }}>
                        {groupItems.map((item) => {
                            const title = isOfficer ? item.requirementTitle : (item.requirement?.title || item.title);
                            const orgName = isOfficer ? item.organizationName : (item.requirement?.organization || item.organizationId?.name || "Organization");
                            const id = isOfficer ? item._id : (item.requirement?.id || item._id);
                            const dueDateStr = isOfficer ? item.dueDate : item.requirement?.dueDate;
                            const formattedDueDate = dueDateStr ? new Date(dueDateStr).toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' }) : undefined;

                            return (
                                <TodoItem
                                    key={id}
                                    id={id}
                                    title={title}
                                    organizationName={orgName}
                                    dueDate={formattedDueDate}
                                    status={item.status || "not_started"}
                                    isOfficer={isOfficer}
                                    onAction={() => handleAction(item)}
                                />
                            );
                        })}
                    </AccordionDetails>
                </Accordion>
            );
        };

        return (
            <Box sx={{ mt: 2 }}>
                {type === 'assigned' && (
                    <>
                        {renderAccordion('No due date', groups.noDueDate, true)}
                        {renderAccordion('This week', groups.thisWeek, false)}
                        {renderAccordion('Next week', groups.nextWeek, false)}
                        {renderAccordion('Later', groups.later, false)}
                    </>
                )}
                {type === 'missing' && (
                    <>
                        {renderAccordion('This week', groups.thisWeek, false)}
                        {renderAccordion('Last week', groups.lastWeek, false)}
                        {renderAccordion('Earlier', groups.earlier, true)}
                    </>
                )}
                {type === 'done' && (
                    <>
                        {renderAccordion('No due date', groups.noDueDate, true)}
                        {renderAccordion('This week', groups.thisWeek, false)}
                        {renderAccordion('Last week', groups.lastWeek, false)}
                        {renderAccordion('Earlier', groups.earlier, false)}
                    </>
                )}
            </Box>
        );
    };

    return (
        <Container maxWidth="lg" sx={{ py: { xs: 2, md: 4 } }}>
            <Box sx={{ mb: 2 }}>
                <Box sx={{ borderBottom: 1, borderColor: "divider", mb: 4 }}>
                    <Tabs
                        value={tabValue}
                        onChange={(_, val) => setTabValue(val)}
                        textColor="inherit"
                        indicatorColor="primary"
                        sx={{
                            minHeight: 48,
                            "& .MuiTabs-flexContainer": {
                                gap: 3
                            },
                            "& .MuiTab-root": {
                                textTransform: "none",
                                fontWeight: 500,
                                minWidth: 'auto',
                                px: 0,
                                py: 1.5,
                                mr: 4,
                                fontSize: "0.875rem",
                                color: "#5F6368", // Google dark grey
                                fontFamily: "'Google Sans', Roboto, Arial, sans-serif",
                                transition: 'color 0.2s',
                                '&:hover': {
                                    color: '#202124' // darker grey on hover
                                },
                                '&.Mui-selected': {
                                    color: '#000', // Black
                                    fontWeight: 500
                                }
                            },
                            "& .MuiTabs-indicator": {
                                height: 3,
                                borderRadius: "3px 3px 0 0",
                                bgcolor: "#000" // Black indicator
                            }
                        }}
                    >
                        <Tab label="Assigned" />
                        <Tab label="Missing" />
                        <Tab label="Done" />
                    </Tabs>
                </Box>

                <Box sx={{ px: 1, mb: 4 }}>
                    <FormControl size="small" sx={{ minWidth: 200 }}>
                        <Select
                            value={selectedOrg}
                            onChange={(e) => setSelectedOrg(e.target.value)}
                            displayEmpty
                            sx={{
                                color: '#3C4043',
                                fontSize: '0.875rem',
                                '& .MuiOutlinedInput-notchedOutline': {
                                    borderColor: '#1A73E8', // Blue border
                                    borderWidth: 1,
                                    borderRadius: '4px'
                                },
                                '&:hover .MuiOutlinedInput-notchedOutline': {
                                    borderColor: '#1A73E8'
                                },
                                '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                                    borderColor: '#1A73E8',
                                    borderWidth: 2
                                },
                                '& .MuiSelect-select': {
                                    py: 1,
                                    px: 2
                                },
                                '& .MuiSvgIcon-root': {
                                    color: '#1A73E8' // blue dropdown arrow
                                }
                            }}
                        >
                            <MenuItem value="all" sx={{ fontSize: '0.875rem' }}>All classes</MenuItem>
                            {allOrganizations.map(org => (
                                <MenuItem key={org.id} value={org.id} sx={{ fontSize: '0.875rem' }}>
                                    {org.name}
                                </MenuItem>
                            ))}
                        </Select>
                    </FormControl>
                </Box>

                {error && <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>{error}</Alert>}
            </Box>

            {loading ? (
                <Box display="flex" justifyContent="center" py={12}>
                    <CircularProgress color="inherit" />
                </Box>
            ) : (
                <>
                    <TabPanel value={tabValue} index={0}>
                        {renderList(todoData.assigned, 'assigned')}
                    </TabPanel>
                    <TabPanel value={tabValue} index={1}>
                        {renderList(todoData.missing, 'missing')}
                    </TabPanel>
                    <TabPanel value={tabValue} index={2}>
                        {renderList(todoData.done, 'done')}
                    </TabPanel>
                </>
            )}

            {/* Modals for actions */}
            {!isOfficer && selectedItem && (
                <SubmissionModal
                    open={isSubmissionOpen}
                    onClose={() => setIsSubmissionOpen(false)}
                    requirementId={selectedItem._id}
                    organizationId={selectedItem.organizationId?._id || selectedItem.organizationId}
                    requirementTitle={selectedItem.title}
                    status={selectedItem.status || "not_started"}
                    existingFiles={selectedItem.files || []}
                    onSubmitted={fetchData}
                />
            )}

            {isOfficer && selectedItem && (
                <ReviewSubmissionsModal
                    open={isReviewOpen}
                    onClose={() => setIsReviewOpen(false)}
                    requirementId={selectedItem.clearanceRequirementId?._id || selectedItem.clearanceRequirementId}
                    requirementTitle={selectedItem.requirementTitle}
                    onReviewComplete={fetchData}
                />
            )}
        </Container>
    );
};

export default TodoPage;
