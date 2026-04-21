import React, { useState, useEffect, useMemo } from 'react';
import { Box, Typography, Button, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, LinearProgress, CircularProgress, Chip, Dialog, DialogTitle, DialogContent, DialogActions, IconButton, Checkbox, Menu, MenuItem, Avatar, Divider } from '@mui/material';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import VisibilityIcon from '@mui/icons-material/Visibility';
import CloseIcon from '@mui/icons-material/Close';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import LockOpenIcon from '@mui/icons-material/LockOpen';
import UndoIcon from '@mui/icons-material/Undo';
import { motion, AnimatePresence } from 'framer-motion';
import { clearanceService, api } from '../../services';
import SignatureModal from './SignatureModal';
import StudentProgress from '../../pages/student/StudentProgress';
import { getInitials, getAbsoluteUrl } from "../../utils/avatarUtils";
import GenericConfirmationModal from '../modals/GenericConfirmationModal';

const COLORS = {
    teal: '#0E7490',
    textPrimary: '#1E293B',
    textSecondary: '#64748B',
    border: '#F1F5F9',
    surface: '#FFFFFF',
    black: '#3c4043'
};

const fontStack = '"Google Sans", "Product Sans", Roboto, sans-serif';

const StatusPill = ({ status }: { status: string }) => {
    const getStyle = (s: string) => {
        switch (s?.toLowerCase()) {
            case 'completed':
            case 'officer_cleared':
                return { color: '#0D9488', bg: '#F0FDFA', label: s === 'completed' ? 'Finalized' : 'Cleared' };
            case 'pending':
            case 'in_progress':
                return { color: '#D97706', bg: '#FFFBEB', label: s === 'pending' ? 'Pending' : 'In Progress' };
            case 'rejected':
                return { color: '#DC2626', bg: '#FEF2F2', label: 'Rejected' };
            default:
                return { color: '#64748B', bg: '#F8FAFC', label: 'Not Started' };
        }
    };

    const style = getStyle(status);

    return (
        <Box sx={{
            display: 'inline-flex',
            alignItems: 'center',
            px: 1.5,
            py: 0.5,
            borderRadius: '999px',
            bgcolor: style.bg,
            color: style.color,
            fontSize: '0.75rem',
            fontWeight: 700,
            letterSpacing: '0.01em',
            border: `1px solid ${style.color}20`
        }}>
            {style.label}
        </Box>
    );
};

// Note: Ensure that the Empty State illustration reflects an empty grades view
const EmptyStateSvg = () => (
    <svg width="200" height="200" viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M50 140C40 140 35 120 35 100C35 80 40 60 50 60L150 60C160 60 165 80 165 100C165 120 160 140 150 140L50 140Z" fill="#F8FAFC" stroke="#94A3B8" strokeWidth="2" />
        <path d="M60 70H90V130H60V70Z" fill="#64748B" />
        <circle cx="70" cy="80" r="4" fill="#F8FAFC" />
        <circle cx="80" cy="80" r="4" fill="#F8FAFC" />
        <circle cx="70" cy="95" r="4" fill="#F8FAFC" />
        <circle cx="80" cy="95" r="4" fill="#F8FAFC" />
        <circle cx="70" cy="110" r="4" fill="#F8FAFC" />
        <circle cx="80" cy="110" r="4" fill="#F8FAFC" />
        <path d="M100 95C100 85 120 85 130 95C140 105 120 115 100 105" fill="#94A3B8" />
        <circle cx="107" cy="95" r="2" fill="#F8FAFC" />
        <circle cx="115" cy="80" r="3" fill="#E2E8F0" />
        <circle cx="125" cy="70" r="4" fill="#E2E8F0" />
        <circle cx="135" cy="85" r="3" fill="#E2E8F0" />
        <path d="M140 110C140 100 155 100 155 110" stroke="#94A3B8" strokeWidth="2" fill="none"/>
        <path d="M20 140H180" stroke="#E2E8F0" strokeWidth="4" strokeLinecap="round" />
    </svg>
);

interface OfficerMarksTabProps {
    organizationId: string;
}

const OfficerMarksTab: React.FC<OfficerMarksTabProps> = ({ organizationId }) => {
    const [loading, setLoading] = useState(true);
    const [requests, setRequests] = useState<any[]>([]);
    const [signatureModalOpen, setSignatureModalOpen] = useState(false);
    const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);
    const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([]);
    const [isBulkAction, setIsBulkAction] = useState(false);

    // View Modal State
    const [viewStudentModalOpen, setViewStudentModalOpen] = useState(false);
    const [viewedStudentName, setViewedStudentName] = useState("");
    const [viewedStudentId, setViewedStudentId] = useState<string | null>(null);
    const [viewedStudentInfo, setViewedStudentInfo] = useState<any>(null);

    // Actions Menu State
    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
    const [activeReq, setActiveReq] = useState<any>(null);

    const handleMenuOpen = (event: React.MouseEvent<HTMLButtonElement>, req: any) => {
        setAnchorEl(event.currentTarget);
        setActiveReq(req);
    };

    const handleMenuClose = () => {
        setAnchorEl(null);
        setActiveReq(null);
    };

    const fetchOverview = async () => {
        try {
            setLoading(true);
            const data = await clearanceService.getOrganizationClearanceOverview(organizationId);
            setRequests(data.requests || []);
        } catch (error) {
            console.error('Failed to fetch clearance overview:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (organizationId) {
            fetchOverview();
        }
    }, [organizationId]);

    useEffect(() => {
        const handleClear = () => setSelectedStudentIds([]);
        window.addEventListener('clear-bulk-selections', handleClear);
        return () => window.removeEventListener('clear-bulk-selections', handleClear);
    }, []);

    const [isRevokeModalOpen, setIsRevokeModalOpen] = useState(false);
    const [isBulkRevokeModalOpen, setIsBulkRevokeModalOpen] = useState(false);
    const [revokeTargetId, setRevokeTargetId] = useState<string | null>(null);
    const [isActionLoading, setIsActionLoading] = useState(false);

    const handleOpenSignatureModal = (studentId: string) => {
        setSelectedStudentId(studentId);
        setSignatureModalOpen(true);
    };

    const handleConfirmClearance = async (signatureData: string) => {
        if (isBulkAction) {
            if (selectedStudentIds.length === 0) return;
            try {
                await clearanceService.bulkMarkAsOfficerCleared(organizationId, selectedStudentIds, signatureData);
                setSignatureModalOpen(false);
                setSelectedStudentIds([]);
                setIsBulkAction(false);
                fetchOverview();
            } catch (error) {
                console.error('Failed to mark students as cleared', error);
                alert('Failed to mark students as cleared. Some students may not have approved requirements.');
            }
            return;
        }

        if (!selectedStudentId) return;
        try {
            await clearanceService.markAsOfficerCleared(organizationId, selectedStudentId, signatureData);
            setSignatureModalOpen(false);
            setSelectedStudentId(null);
            fetchOverview();
        } catch (error) {
            console.error('Failed to mark student as cleared', error);
            alert('Failed to mark student as cleared. Ensure all requirements have been approved.');
        }
    };

    const handleRevokeClearance = (studentId: string) => {
        setRevokeTargetId(studentId);
        setIsRevokeModalOpen(true);
    };

    const confirmRevoke = async () => {
        if (!revokeTargetId) return;
        try {
            setIsActionLoading(true);
            await clearanceService.revokeOfficerClearance(organizationId, revokeTargetId);
            fetchOverview();
            setIsRevokeModalOpen(false);
            setRevokeTargetId(null);
        } catch (error: any) {
            console.error('Failed to revoke clearance', error);
            alert(error.response?.data?.message || 'Failed to revoke clearance');
        } finally {
            setIsActionLoading(false);
        }
    };

    const handleBulkRevoke = () => {
        if (selectedStudentIds.length === 0) return;
        setIsBulkRevokeModalOpen(true);
    };

    const confirmBulkRevoke = async () => {
        try {
            setIsActionLoading(true);
            const response = await clearanceService.bulkRevokeOfficerClearance(organizationId, selectedStudentIds);
            alert(response.message);
            setSelectedStudentIds([]);
            fetchOverview();
            setIsBulkRevokeModalOpen(false);
        } catch (error: any) {
            console.error('Failed to revoke clearances', error);
            alert(error.response?.data?.message || 'Failed to revoke clearances');
        } finally {
            setIsActionLoading(false);
        }
    };

    const toggleSelectAll = () => {
        // Updated logic to include those that can be REVOKED as well
        const selectableStudents = requests.map(r => r.student?._id).filter(Boolean);
        
        if (selectedStudentIds.length === selectableStudents.length && selectableStudents.length > 0) {
            setSelectedStudentIds([]);
        } else {
            setSelectedStudentIds(selectableStudents);
        }
    };

    const toggleSelect = (id: string) => {
        setSelectedStudentIds(prev => 
            prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
        );
    };

    const handleBulkClear = () => {
        setIsBulkAction(true);
        setSignatureModalOpen(true);
    };

    const handleViewStudent = async (req: any) => {
        const studentId = req.student?._id;
        if (!studentId) return;
        
        setViewedStudentName(req.student?.fullName || "Student");
        setViewedStudentId(studentId);
        setViewedStudentInfo(req.student);
        setViewStudentModalOpen(true);
    };

    const selectedRequests = useMemo(() => 
        requests.filter(r => selectedStudentIds.includes(r.student?._id)),
        [requests, selectedStudentIds]
    );

    const canBulkClear = useMemo(() => 
        selectedRequests.some(r => r.status !== 'officer_cleared' && r.status !== 'completed'),
    [selectedRequests]);

    const canBulkRevoke = useMemo(() => 
        selectedRequests.some(r => r.status === 'officer_cleared' || r.status === 'completed'),
    [selectedRequests]);

    if (loading) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="40vh">
                <CircularProgress />
            </Box>
        );
    }

    if (requests.length === 0) {
        return (
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', textAlign: 'center' }}>
                <EmptyStateSvg />
                <Typography variant="body1" sx={{ color: '#3c4043', fontWeight: 500, my: 2 }}>
                    This is where you'll view and manage grades
                </Typography>
            </Box>
        );
    }

    return (
        <Box sx={{ p: { xs: 0, sm: 2, md: 3 } }}>
            <TableContainer component={Paper} elevation={0} sx={{ 
                border: `1px solid ${COLORS.border}`, 
                borderRadius: '16px', 
                overflow: 'hidden'
            }}>
                <Table>
                    <TableHead>
                        <TableRow>
                            <TableCell padding="checkbox" sx={{ bgcolor: '#F8FAFC', borderBottom: `1px solid ${COLORS.border}`, width: 48 }}>
                                <Checkbox 
                                    size="small" 
                                    sx={{ color: '#CBD5E1', '&.Mui-checked': { color: COLORS.teal } }}
                                    checked={
                                        requests.filter(r => r.status !== 'officer_cleared' && r.status !== 'completed').length > 0 &&
                                        selectedStudentIds.length === requests.filter(r => r.status !== 'officer_cleared' && r.status !== 'completed').length
                                    }
                                    indeterminate={
                                        selectedStudentIds.length > 0 && 
                                        selectedStudentIds.length < requests.filter(r => r.status !== 'officer_cleared' && r.status !== 'completed').length
                                    }
                                    onChange={toggleSelectAll}
                                />
                            </TableCell>
                            <TableCell sx={{ 
                                bgcolor: '#F8FAFC',
                                color: COLORS.textSecondary, 
                                fontWeight: 700, 
                                fontSize: '0.725rem', 
                                textTransform: 'uppercase', 
                                letterSpacing: '0.05em',
                                fontFamily: fontStack,
                                borderBottom: `1px solid ${COLORS.border}`,
                                py: 2
                            }}>
                                Student
                            </TableCell>
                            <TableCell sx={{ 
                                bgcolor: '#F8FAFC',
                                color: COLORS.textSecondary, 
                                fontWeight: 700, 
                                fontSize: '0.725rem', 
                                textTransform: 'uppercase', 
                                letterSpacing: '0.05em', 
                                fontFamily: fontStack,
                                borderBottom: `1px solid ${COLORS.border}`,
                                py: 2,
                                display: { xs: 'none', md: 'table-cell' }
                            }}>
                                Email Address
                            </TableCell>
                            <TableCell sx={{ 
                                bgcolor: '#F8FAFC',
                                color: COLORS.textSecondary, 
                                fontWeight: 700, 
                                fontSize: '0.725rem', 
                                textTransform: 'uppercase', 
                                letterSpacing: '0.05em',
                                fontFamily: fontStack,
                                borderBottom: `1px solid ${COLORS.border}`,
                                py: 2,
                                display: { xs: 'none', sm: 'table-cell' }
                            }}>
                                Progress
                            </TableCell>
                            <TableCell sx={{ 
                                bgcolor: '#F8FAFC',
                                color: COLORS.textSecondary, 
                                fontWeight: 700, 
                                fontSize: '0.725rem', 
                                textTransform: 'uppercase', 
                                letterSpacing: '0.05em',
                                fontFamily: fontStack,
                                borderBottom: `1px solid ${COLORS.border}`,
                                py: 2
                            }}>
                                Status
                            </TableCell>
                            <TableCell align="right" sx={{ bgcolor: '#F8FAFC', borderBottom: `1px solid ${COLORS.border}`, width: 50 }} />
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {requests.map((req) => (
                            <TableRow 
                                key={req.id} 
                                hover 
                                sx={{ 
                                    '&:last-child td': { border: 0 },
                                    transition: 'background-color 0.2s ease',
                                    '&:hover': { bgcolor: '#F8FAFC !important' }
                                }}
                            >
                                <TableCell padding="checkbox">
                                    <Checkbox 
                                        size="small" 
                                        sx={{ color: '#E2E8F0', '&.Mui-checked': { color: COLORS.teal } }}
                                        checked={selectedStudentIds.includes(req.student?._id)}
                                        onChange={() => toggleSelect(req.student?._id)}
                                    />
                                </TableCell>
                                <TableCell>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                        <Avatar 
                                            src={getAbsoluteUrl(req.student?.avatarUrl || req.student?.profilePicture)}
                                            sx={{ 
                                                width: 32, 
                                                height: 32, 
                                                bgcolor: '#5F6368', 
                                                fontSize: '0.75rem', 
                                                fontWeight: 700 
                                            }}
                                        >
                                            {getInitials(req.student?.fullName || 'U')}
                                        </Avatar>
                                        <Typography sx={{ 
                                            fontWeight: 600, 
                                            fontSize: '0.875rem', 
                                            color: COLORS.textPrimary,
                                            fontFamily: fontStack
                                        }}>
                                            {req.student?.fullName || 'Unknown Student'}
                                        </Typography>
                                    </Box>
                                </TableCell>
                                <TableCell sx={{ display: { xs: 'none', md: 'table-cell' }, color: COLORS.textSecondary, fontSize: '0.875rem', fontFamily: fontStack }}>
                                    {req.student?.email}
                                </TableCell>
                                <TableCell sx={{ display: { xs: 'none', sm: 'table-cell' } }}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, minWidth: 100 }}>
                                        <Box sx={{ flexGrow: 1 }}>
                                            <LinearProgress 
                                                variant="determinate" 
                                                value={req.progress.total > 0 ? (req.progress.completed / req.progress.total) * 100 : 0} 
                                                sx={{ 
                                                    height: 6, 
                                                    borderRadius: 3, 
                                                    bgcolor: '#F1F5F9',
                                                    '& .MuiLinearProgress-bar': { bgcolor: COLORS.teal } 
                                                }}
                                            />
                                        </Box>
                                        <Typography sx={{ fontSize: '0.75rem', fontWeight: 700, color: COLORS.textSecondary }}>
                                            {req.progress.completed}/{req.progress.total}
                                        </Typography>
                                    </Box>
                                </TableCell>
                                <TableCell>
                                    <StatusPill status={req.status} />
                                </TableCell>
                                <TableCell align="right">
                                    <IconButton size="small" onClick={(e) => handleMenuOpen(e, req)}>
                                        <MoreVertIcon sx={{ color: COLORS.textSecondary, fontSize: 20 }} />
                                    </IconButton>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>

            <Menu
                anchorEl={anchorEl}
                open={Boolean(anchorEl)}
                onClose={handleMenuClose}
                elevation={0}
                PaperProps={{
                    sx: {
                        borderRadius: '12px',
                        minWidth: 150,
                        border: '1px solid #F1F5F9',
                        '& .MuiMenuItem-root': {
                            fontSize: '0.875rem',
                            fontWeight: 600,
                            color: COLORS.textPrimary,
                            py: 1.25,
                            gap: 1.5
                        }
                    }
                }}
            >
                <MenuItem onClick={() => { handleViewStudent(activeReq); handleMenuClose(); }}>
                    <VisibilityIcon sx={{ fontSize: 18, color: COLORS.textSecondary }} />
                    View Details
                </MenuItem>
                <MenuItem 
                    onClick={() => { handleOpenSignatureModal(activeReq.student?._id); handleMenuClose(); }}
                    disabled={activeReq?.status === 'officer_cleared' || activeReq?.status === 'completed'}
                >
                    <CheckCircleIcon sx={{ fontSize: 18, color: activeReq?.status === 'officer_cleared' || activeReq?.status === 'completed' ? '#CBD5E1' : COLORS.teal }} />
                    {activeReq?.status === 'officer_cleared' || activeReq?.status === 'completed' ? 'Already Cleared' : 'Mark as Cleared'}
                </MenuItem>
                {(activeReq?.status === 'officer_cleared' || activeReq?.status === 'completed') && (
                    <MenuItem onClick={() => { handleRevokeClearance(activeReq.student?._id); handleMenuClose(); }} sx={{ color: '#DC2626 !important' }}>
                        <UndoIcon sx={{ fontSize: 18, color: '#DC2626' }} />
                        Revoke Clearance
                    </MenuItem>
                )}
            </Menu>

            <SignatureModal 
                open={signatureModalOpen} 
                onClose={() => {
                    setSignatureModalOpen(false);
                    setSelectedStudentId(null);
                }} 
                onConfirm={handleConfirmClearance} 
            />

            {/* View Student Timeline Modal */}
            <Dialog 
                open={viewStudentModalOpen} 
                onClose={() => setViewStudentModalOpen(false)} 
                maxWidth="lg" 
                fullWidth
                fullScreen={window.innerWidth < 600}
            >
                <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="h6" fontWeight={700}>
                        Clearance Overview: {viewedStudentName}
                    </Typography>
                    <IconButton onClick={() => setViewStudentModalOpen(false)}>
                        <CloseIcon />
                    </IconButton>
                </DialogTitle>
                <DialogContent dividers sx={{ p: 0, bgcolor: '#f4f6f8' }}>
                    {viewedStudentId && (
                        <StudentProgress 
                            organizationId={null} 
                            studentId={viewedStudentId} 
                            studentInfo={viewedStudentInfo} 
                            readOnly={true} 
                        />
                    )}
                </DialogContent>
                <DialogActions sx={{ p: 2 }}>
                    <Button onClick={() => setViewStudentModalOpen(false)} sx={{ color: '#475569', fontWeight: 600 }}>
                        Close
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Bulk Actions Overlay - Root Level for Viewport Centering */}
            <AnimatePresence>
                {selectedStudentIds.length > 0 && (
                    <Box
                        component={motion.div}
                        initial={{ y: 100, opacity: 0, x: '-50%' }}
                        animate={{ y: 0, opacity: 1, x: '-50%' }}
                        exit={{ y: 100, opacity: 0, x: '-50%' }}
                        sx={{
                            position: 'fixed',
                            bottom: { xs: 24, sm: 80 },
                            left: '50%',
                            width: { xs: 'calc(100% - 32px)', sm: 'auto' },
                            maxWidth: '95vw',
                            bgcolor: '#3c4043',
                            color: '#FFF',
                            py: { xs: 1.25, sm: 2 },
                            px: { xs: 2.5, sm: 3 },
                            borderRadius: '20px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: { xs: 1, sm: 3 },
                            boxShadow: '0 10px 40px rgba(0,0,0,0.3)',
                            zIndex: 9999
                        }}
                    >
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexShrink: 0 }}>
                            <Typography sx={{ fontWeight: 800, fontSize: { xs: 11, sm: 13 }, letterSpacing: '0.01em', whiteSpace: 'nowrap' }}>
                                {selectedStudentIds.length} {selectedStudentIds.length === 1 ? 'student' : 'students'}
                                <Box component="span" sx={{ display: { xs: 'none', sm: 'inline' } }}> selected</Box>
                            </Typography>
                        </Box>
                        <Divider orientation="vertical" flexItem sx={{ bgcolor: 'rgba(255,255,255,0.15)', height: 20, my: 'auto' }} />
                        <Box sx={{ display: 'flex', gap: { xs: 0, sm: 1 } }}>
                            <Button
                                variant="text"
                                size="small"
                                onClick={handleBulkClear}
                                disabled={!canBulkClear}
                                sx={{ 
                                    color: canBulkClear ? '#FFF' : 'rgba(255,255,255,0.3)', 
                                    textTransform: 'none', 
                                    fontWeight: 700,
                                    fontSize: '0.8125rem',
                                    bgcolor: 'transparent',
                                    px: { xs: 0.75, sm: 1.5 },
                                    minWidth: { xs: 0, sm: 'auto' },
                                    borderRadius: '8px',
                                    '&:hover': { bgcolor: 'rgba(255,255,255,0.08)' },
                                    '&.Mui-disabled': { color: 'rgba(255,255,255,0.2)' }
                                }}
                            >
                                <CheckCircleIcon sx={{ fontSize: 18 }} />
                                <Box component="span" sx={{ display: { xs: 'none', sm: 'block' }, ml: 1 }}>Mark as Cleared</Box>
                            </Button>
                            <Button
                                variant="text"
                                size="small"
                                onClick={handleBulkRevoke}
                                disabled={!canBulkRevoke}
                                sx={{ 
                                    color: canBulkRevoke ? '#FFF' : 'rgba(255,255,255,0.3)', 
                                    textTransform: 'none', 
                                    fontWeight: 700,
                                    fontSize: '0.8125rem',
                                    bgcolor: 'transparent',
                                    px: { xs: 0.75, sm: 1.5 },
                                    minWidth: { xs: 0, sm: 'auto' },
                                    borderRadius: '8px',
                                    '&:hover': { bgcolor: 'rgba(255,255,255,0.08)' },
                                    '&.Mui-disabled': { color: 'rgba(255,255,255,0.2)' }
                                }}
                            >
                                <UndoIcon sx={{ fontSize: 18 }} />
                                <Box component="span" sx={{ display: { xs: 'none', sm: 'block' }, ml: 1 }}>Revoke</Box>
                            </Button>
                        </Box>
                    </Box>
                )}
            </AnimatePresence>

            <GenericConfirmationModal
                open={isRevokeModalOpen}
                onClose={() => {
                    setIsRevokeModalOpen(false);
                    setRevokeTargetId(null);
                }}
                onConfirm={confirmRevoke}
                title="Revoke Clearance?"
                description="Are you sure you want to revoke this student's clearance? They will need to fulfill the requirements again."
                confirmText="Yes, Revoke"
                loading={isActionLoading}
            />

            <GenericConfirmationModal
                open={isBulkRevokeModalOpen}
                onClose={() => setIsBulkRevokeModalOpen(false)}
                onConfirm={confirmBulkRevoke}
                title="Bulk Revoke Clearance?"
                description={`Are you sure you want to revoke clearance for ${selectedStudentIds.length} selected students?`}
                confirmText="Yes, Revoke All"
                loading={isActionLoading}
            />
        </Box>
    );
};

export default OfficerMarksTab;
