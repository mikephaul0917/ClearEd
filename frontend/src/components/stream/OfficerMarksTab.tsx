import React, { useState, useEffect, useMemo } from 'react';
import { Box, Typography, Button, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, LinearProgress, CircularProgress, Chip, Dialog, DialogTitle, DialogContent, DialogActions, IconButton } from '@mui/material';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import VisibilityIcon from '@mui/icons-material/Visibility';
import CloseIcon from '@mui/icons-material/Close';
import { clearanceService, api } from '../../services';
import SignatureModal from './SignatureModal';
import StudentProgress from '../../pages/student/StudentProgress';

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

    // View Modal State
    const [viewStudentModalOpen, setViewStudentModalOpen] = useState(false);
    const [viewedStudentName, setViewedStudentName] = useState("");
    const [viewedStudentId, setViewedStudentId] = useState<string | null>(null);
    const [viewedStudentInfo, setViewedStudentInfo] = useState<any>(null);

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

    const handleOpenSignatureModal = (studentId: string) => {
        setSelectedStudentId(studentId);
        setSignatureModalOpen(true);
    };

    const handleConfirmClearance = async (signatureData: string) => {
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

    const handleViewStudent = async (req: any) => {
        const studentId = req.student?._id;
        if (!studentId) return;
        
        setViewedStudentName(req.student?.fullName || "Student");
        setViewedStudentId(studentId);
        setViewedStudentInfo(req.student);
        setViewStudentModalOpen(true);
    };

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
                <Button 
                    startIcon={<PersonAddIcon />} 
                    sx={{ textTransform: 'none', color: '#1a73e8', fontWeight: 500 }}
                >
                    Invite students
                </Button>
            </Box>
        );
    }

    return (
        <Box sx={{ p: 2 }}>
            <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid #e0e0e0', borderRadius: 2 }}>
                <Table>
                    <TableHead sx={{ bgcolor: '#f8f9fa' }}>
                        <TableRow>
                            <TableCell sx={{ fontWeight: 600 }}>Student</TableCell>
                            <TableCell sx={{ fontWeight: 600 }}>Email</TableCell>
                            <TableCell sx={{ fontWeight: 600 }}>Progress</TableCell>
                            <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
                            <TableCell sx={{ fontWeight: 600, align: 'right' }}>Actions</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {requests.map((req) => (
                            <TableRow key={req.id} hover>
                                <TableCell>{req.student?.fullName || 'Unknown Student'}</TableCell>
                                <TableCell>{req.student?.email}</TableCell>
                                <TableCell>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                        <Box sx={{ width: '100%', mr: 1 }}>
                                            <LinearProgress 
                                                variant="determinate" 
                                                value={req.progress.total > 0 ? (req.progress.completed / req.progress.total) * 100 : 0} 
                                                sx={{ height: 8, borderRadius: 4, bgcolor: '#e2e8f0', '& .MuiLinearProgress-bar': { bgcolor: '#10b981' } }}
                                            />
                                        </Box>
                                        <Box sx={{ minWidth: 35 }}>
                                            <Typography variant="body2" color="text.secondary">
                                                {req.progress.completed}/{req.progress.total}
                                            </Typography>
                                        </Box>
                                    </Box>
                                </TableCell>
                                <TableCell>
                                    {req.status === 'completed' && <Chip label="Finalized (Admin)" size="small" sx={{ bgcolor: '#dcfce7', color: '#166534', fontWeight: 600 }} />}
                                    {req.status === 'officer_cleared' && <Chip label="Cleared by Officer" size="small" sx={{ bgcolor: '#e0e7ff', color: '#3730a3', fontWeight: 600 }} />}
                                    {req.status === 'in_progress' && <Chip label="In Progress" size="small" sx={{ bgcolor: '#fef9c3', color: '#854d0e', fontWeight: 600 }} />}
                                    {req.status === 'pending' && <Chip label="Pending" size="small" sx={{ bgcolor: '#f1f5f9', color: '#475569', fontWeight: 600 }} />}
                                    {req.status === 'rejected' && <Chip label="Rejected" size="small" sx={{ bgcolor: '#fee2e2', color: '#991b1b', fontWeight: 600 }} />}
                                    {req.status === 'not_started' && <Chip label="Not Started" size="small" sx={{ bgcolor: '#f1f5f9', color: '#64748b', fontWeight: 600 }} />}
                                </TableCell>
                                <TableCell sx={{ align: 'right', textAlign: 'right' }}>
                                    <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
                                        <Button
                                            variant="outlined"
                                            size="small"
                                            startIcon={<VisibilityIcon />}
                                            onClick={() => handleViewStudent(req)}
                                            sx={{
                                                textTransform: 'none',
                                                fontWeight: 600,
                                                borderColor: '#e2e8f0',
                                                color: '#475569',
                                                '&:hover': { bgcolor: '#f1f5f9', borderColor: '#cbd5e1' }
                                            }}
                                        >
                                            View
                                        </Button>
                                        <Button
                                            variant="contained"
                                            size="small"
                                            startIcon={<CheckCircleIcon />}
                                            disabled={req.status === 'officer_cleared' || req.status === 'completed'}
                                            onClick={() => handleOpenSignatureModal(req.student?._id)}
                                            sx={{ 
                                                textTransform: 'none', 
                                                fontWeight: 600,
                                                bgcolor: req.status === 'officer_cleared' || req.status === 'completed' ? '#e2e8f0' : '#0ea5e9',
                                                color: req.status === 'officer_cleared' || req.status === 'completed' ? '#94a3b8' : '#fff',
                                                '&:hover': { bgcolor: '#0284c7' },
                                                boxShadow: 'none',
                                                '&.Mui-disabled': { bgcolor: '#e2e8f0', color: '#94a3b8' }
                                            }}
                                        >
                                            {req.status === 'officer_cleared' || req.status === 'completed' ? 'Cleared' : 'Mark as Cleared'}
                                        </Button>
                                    </Box>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>

            <SignatureModal 
                open={signatureModalOpen} 
                onClose={() => {
                    setSignatureModalOpen(false);
                    setSelectedStudentId(null);
                }} 
                onConfirm={handleConfirmClearance} 
            />

            {/* View Student Timeline Modal */}
            <Dialog open={viewStudentModalOpen} onClose={() => setViewStudentModalOpen(false)} maxWidth="lg" fullWidth>
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
        </Box>
    );
};

export default OfficerMarksTab;
