import React, { useState, useEffect, useCallback } from "react";
import { useTheme, useMediaQuery } from "@mui/material";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Tabs from "@mui/material/Tabs";
import Tab from "@mui/material/Tab";
import Container from "@mui/material/Container";
import CircularProgress from "@mui/material/CircularProgress";
import Skeleton from "@mui/material/Skeleton";
import Divider from "@mui/material/Divider";
import Alert from "@mui/material/Alert";
import TodoItem from "../../components/todo/TodoItem";
import { useAuth } from "../../hooks/useAuth";
import { clearanceService } from "../../services";
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

    const [tabValue, setTabValue] = useState(0);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [todoData, setTodoData] = useState<any>({ assigned: [], missing: [], done: [] });

    // Filter state
    const [selectedOrg, setSelectedOrg] = useState<string>("all");

    // Extract unique organizations from all tabs
    const allOrganizations = React.useMemo(() => {
        const orgMap = new Map();
        const allItems = [...todoData.assigned, ...todoData.missing, ...todoData.done];

        allItems.forEach(item => {
            const orgName = item.organizationId?.name || "Organization";
            const orgId = item.organizationId?._id || item.organizationId || orgName;

            if (orgId && !orgMap.has(orgId)) {
                orgMap.set(orgId, orgName);
            }
        });

        return Array.from(orgMap.entries()).map(([id, name]) => ({ id, name }));
    }, [todoData]);

    const fetchData = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            // Unify logic: To-do page always shows student requirements
            const data = await clearanceService.getStudentTodo();
            if (data?.todoList) {
                const { assigned, missing, done } = data.todoList;
                setTodoData({ assigned, missing, done });
            } else {
                setTodoData({ assigned: [], missing: [], done: [] });
            }
        } catch (err: any) {
            setError(err.response?.data?.message || "Failed to fetch to-do items.");
        } finally {
            // Add deliberate delay for premium feel
            setTimeout(() => {
                setLoading(false);
            }, 2000);
        }
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    // Trigger skeleton on tab change for premium feel
    useEffect(() => {
        setLoading(true);
        const timer = setTimeout(() => {
            setLoading(false);
        }, 2000);
        return () => clearTimeout(timer);
    }, [tabValue]);

    const renderEmptyState = (type: 'assigned' | 'missing' | 'done') => {
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
            default: return null;
        }
    };

    const renderList = (items: any[], type: 'assigned' | 'missing' | 'done') => {
        // Filter by organization
        const filteredItems = items.filter(item => {
            if (selectedOrg === "all") return true;
            const itemOrgId = item.organizationId?._id || item.organizationId;
            const itemOrgName = item.organizationId?.name || "Organization";
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
                const dueDateStr = item.requirement?.dueDate;
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
                const dueDateStr = item.requirement?.dueDate;
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
                const dueDateStr = item.requirement?.dueDate;
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
            bgcolor: '#F9FAFB',
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
                        <Typography sx={{ color: count > 0 ? '#0E7490' : '#3C4043', mr: 2, fontSize: '0.875rem' }}>
                            {count}
                        </Typography>
                    </AccordionSummary>
                    <AccordionDetails sx={{ px: 2, pb: 3, pt: 0 }}>
                        {groupItems.map((item) => {
                            const title = item.requirement?.title || item.title;
                            const orgName = item.requirement?.organization || item.organizationId?.name || "Organization";
                            const id = item.requirement?.id || item._id;
                            const dueDateStr = item.requirement?.dueDate;
                            const formattedDueDate = dueDateStr ? new Date(dueDateStr).toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' }) : undefined;

                            const reqId = item.requirement?._id || item.requirement?.id || item._id;
                            const orgId = item.requirement?.organizationId || item.organizationId?._id || item.organizationId;

                            return (
                                <TodoItem
                                    key={id}
                                    reqId={reqId}
                                    orgId={orgId}
                                    title={title}
                                    organizationName={orgName}
                                    dueDate={formattedDueDate}
                                    status={item.status || "not_started"}
                                    isOfficer={false} // Todo list is for personal student fulfillment
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

    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
    const isTablet = useMediaQuery(theme.breakpoints.down('md'));

    return (
        <Box sx={{ bgcolor: '#F9FAFB', minHeight: '100vh', pt: 0, pb: 8 }}>
            <Container maxWidth="lg" sx={{ px: { xs: 0, md: 4 } }}>
                <Box sx={{ mb: 2 }}>
                    <Box sx={{ borderBottom: 1, borderColor: "divider", mb: 4 }}>
                        <Tabs
                            value={tabValue}
                            onChange={(_, val) => setTabValue(val)}
                            textColor="inherit"
                            indicatorColor="primary"
                            variant={isMobile ? "fullWidth" : "standard"}
                            sx={{
                                minHeight: 48,
                                px: { xs: 0, sm: 1 },
                                "& .MuiTabs-flexContainer": {
                                    gap: { xs: 0, sm: 2 }
                                },
                                "& .MuiTab-root": {
                                    textTransform: "none",
                                    fontWeight: 500,
                                    minWidth: 'auto',
                                    px: 0,
                                    py: 1.5,
                                    mr: { xs: 0, sm: 3 },
                                    fontSize: "0.875rem",
                                    color: "#5F6368", // Google dark grey
                                    fontFamily: "'Google Sans', Roboto, Arial, sans-serif",
                                    transition: 'color 0.2s',
                                    '&:hover': {
                                        color: '#202124' // darker grey on hover
                                    },
                                    '&.Mui-selected': {
                                        color: '#0D9488', // Dark teal
                                        fontWeight: 500
                                    }
                                },
                                "& .MuiTabs-indicator": {
                                    height: 3,
                                    borderRadius: "3px 3px 0 0",
                                    bgcolor: "#0D9488" // Dark teal indicator
                                }
                            }}
                        >
                            <Tab label="Assigned" />
                            <Tab label="Missing" />
                            <Tab label="Done" />
                        </Tabs>
                    </Box>

                    <Box sx={{ px: { xs: 2, sm: 1 }, mb: 4 }}>
                        <FormControl size="small" sx={{ width: { xs: '100%', sm: 'auto' }, minWidth: 200 }}>
                            <Select
                                value={selectedOrg}
                                onChange={(e) => setSelectedOrg(e.target.value)}
                                displayEmpty
                                sx={{
                                    bgcolor: '#F9FAFB',
                                    color: '#3C4043',
                                    '& .MuiOutlinedInput-notchedOutline': {
                                        borderColor: '#dadce0', // Gray border default
                                        borderWidth: 1,
                                        borderRadius: '4px'
                                    },
                                    '&:hover .MuiOutlinedInput-notchedOutline': {
                                        borderColor: '#202124' // Dark hover
                                    },
                                    '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                                        borderColor: '#0D9488', // Dark teal when focused
                                        borderWidth: 2
                                    },
                                    '& .MuiSelect-select': {
                                        py: 1,
                                        px: 2
                                    },
                                    '& .MuiSvgIcon-root': {
                                        color: '#5f6368' // Gray dropdown arrow
                                    }
                                }}
                            >
                                <MenuItem value="all" sx={{ fontSize: '0.875rem' }}>All organizations</MenuItem>
                                {allOrganizations.map(org => (
                                    <MenuItem key={org.id} value={org.id} sx={{ fontSize: '0.875rem' }}>
                                        {org.name}
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                    </Box>

                    {error && <Alert severity="error" sx={{ mb: 3, borderRadius: '14px', mx: { xs: 2, sm: 0 } }}>{error}</Alert>}
                </Box>

                {loading ? (
                    <Box sx={{ mt: 2 }}>
                        {/* Skeleton Filter Box */}
                        <Box sx={{ px: 1, mb: 4, opacity: 0.5 }}>
                            <Skeleton variant="rectangular" width={200} height={40} sx={{ borderRadius: '6px', bgcolor: "#eaebec" }} />
                        </Box>

                        {/* Accordion Skeletons */}
                        {[1, 2, 3].map((i) => (
                            <Box key={i} sx={{
                                bgcolor: '#F9FAFB',
                                borderBottom: '1px solid #E5E7EB',
                                py: 2.5,
                                px: 2,
                                display: 'flex',
                                alignItems: 'center'
                            }}>
                                <Skeleton variant="text" width="20%" height={32} sx={{ bgcolor: "#eaebec", mr: 'auto' }} />
                                <Skeleton variant="text" width={20} height={24} sx={{ bgcolor: "#eaebec", mr: 4 }} />
                                <Skeleton variant="circular" width={20} height={20} sx={{ bgcolor: "#eaebec" }} />
                            </Box>
                        ))}

                        {/* Expanded Items Skeleton (simulating one open group) */}
                        <Box sx={{ px: 2, pt: 2 }}>
                            {[1, 2].map((i) => (
                                <Box key={i} sx={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 2,
                                    mb: 3,
                                    p: 2,
                                    bgcolor: 'white',
                                    borderRadius: '12px',
                                    border: '1px solid #F1F5F9'
                                }}>
                                    <Skeleton variant="circular" width={40} height={40} sx={{ bgcolor: "#eaebec" }} />
                                    <Box sx={{ flex: 1 }}>
                                        <Skeleton variant="text" width="60%" height={24} sx={{ bgcolor: "#eaebec", mb: 0.5 }} />
                                        <Skeleton variant="text" width="30%" height={16} sx={{ bgcolor: "#eaebec" }} />
                                    </Box>
                                    <Skeleton variant="rectangular" width={80} height={24} sx={{ borderRadius: '999px', bgcolor: "#eaebec" }} />
                                </Box>
                            ))}
                        </Box>
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
            </Container>
        </Box>
    );
};

export default TodoPage;
