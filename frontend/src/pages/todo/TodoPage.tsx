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
        if (items.length === 0) {
            return renderEmptyState(type);
        }

        return items.map((item) => (
            <TodoItem
                key={item._id}
                id={item._id}
                title={isOfficer ? item.requirementTitle : item.title}
                organizationName={isOfficer ? item.organizationName : (item.organizationId?.name || "Organization")}
                status={item.status || "not_started"}
                isOfficer={isOfficer}
                onAction={() => handleAction(item)}
            />
        ));
    };

    return (
        <Container maxWidth="lg" sx={{ py: { xs: 2, md: 6 } }}>
            <Box sx={{ mb: 4 }}>
                <Typography variant="h4" sx={{ fontWeight: 800, mb: 1, color: '#0F172A', fontFamily: "'Inter', 'Plus Jakarta Sans', 'Montserrat', sans-serif" }}>
                    To-Do List
                </Typography>
                <Typography sx={{ color: '#64748B', mb: 4 }}>
                    {isOfficer
                        ? "Review student submissions and manage clearances."
                        : "Track your clearance requirements and submissions."}
                </Typography>

                <Box sx={{ borderBottom: 1, borderColor: "divider", mb: 3 }}>
                    <Tabs
                        value={tabValue}
                        onChange={(_, val) => setTabValue(val)}
                        textColor="inherit"
                        indicatorColor="primary"
                        sx={{
                            "& .MuiTabs-flexContainer": {
                                gap: 1
                            },
                            "& .MuiTab-root": {
                                textTransform: "none",
                                fontWeight: 600,
                                minWidth: 'auto',
                                px: 2,
                                py: 1.5,
                                fontSize: "0.9375rem",
                                color: "#64748B",
                                borderRadius: '8px 8px 0 0',
                                transition: 'all 0.2s',
                                '&:hover': {
                                    backgroundColor: '#F8FAFC',
                                    color: '#0F172A'
                                },
                                '&.Mui-selected': {
                                    color: '#0F172A',
                                    fontWeight: 700
                                }
                            },
                            "& .MuiTabs-indicator": {
                                height: 3,
                                borderRadius: "3px 3px 0 0",
                                bgcolor: "#0F172A"
                            }
                        }}
                    >
                        <Tab
                            label={
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    Assigned
                                    <Box sx={{ bgcolor: tabValue === 0 ? '#DBEAFE' : '#F1F5F9', color: tabValue === 0 ? '#1D4ED8' : '#475569', px: 1, py: 0.25, borderRadius: 9999, fontSize: '0.75rem', fontWeight: 700 }}>
                                        {todoData.assigned.length}
                                    </Box>
                                </Box>
                            }
                        />
                        <Tab
                            label={
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    Missing
                                    <Box sx={{ bgcolor: tabValue === 1 ? '#DBEAFE' : '#F1F5F9', color: tabValue === 1 ? '#1D4ED8' : '#475569', px: 1, py: 0.25, borderRadius: 9999, fontSize: '0.75rem', fontWeight: 700 }}>
                                        {todoData.missing.length}
                                    </Box>
                                </Box>
                            }
                        />
                        <Tab
                            label={
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    Done
                                    <Box sx={{ bgcolor: tabValue === 2 ? '#DBEAFE' : '#F1F5F9', color: tabValue === 2 ? '#1D4ED8' : '#475569', px: 1, py: 0.25, borderRadius: 9999, fontSize: '0.75rem', fontWeight: 700 }}>
                                        {todoData.done.length}
                                    </Box>
                                </Box>
                            }
                        />
                    </Tabs>
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
