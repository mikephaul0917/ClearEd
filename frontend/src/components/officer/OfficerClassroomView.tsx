import React, { useState, useEffect, useMemo } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Avatar,
  Grid,
  Divider,
  Button,
  Chip,
  IconButton,
  Tooltip,
  CircularProgress,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Checkbox,
  Select,
  MenuItem,
  useTheme,
  useMediaQuery,
  TextField,
  InputAdornment
} from '@mui/material';
import {
  Search as SearchIcon,
  FilterList as FilterIcon,
  Refresh as RefreshIcon,
  Description as FileIcon,
  GetApp as DownloadIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  MoreVert as MoreIcon,
  Folder as FolderIcon,
  Person as PersonIcon,
  ChevronRight as ChevronRightIcon
} from '@mui/icons-material';
import { api } from '../../services';
import ReviewSubmissionsModal from '../stream/ReviewSubmissionsModal';

interface Submission {
  _id: string;
  studentId?: {
    _id: string;
    fullName: string;
    email: string;
    studentNumber?: string;
    studentId?: string;
    course?: string;
    name?: string;
  };
  userId?: {
    _id: string;
    fullName: string;
    email: string;
    studentNumber?: string;
    studentId?: string;
    course?: string;
    name?: string;
  };
  student?: {
    _id: string;
    fullName: string;
    email: string;
    studentNumber?: string;
    studentId?: string;
    course?: string;
    name?: string;
  };
  clearanceItemId?: {
    _id: string;
    title: string;
    description: string;
  };
  clearanceRequirementId?: {
    _id: string;
    title: string;
  };
  files: Array<{
    filename: string;
    originalName: string;
  }>;
  status: 'pending' | 'approved' | 'rejected' | 'returned' | 'done';
  submittedAt: string;
}

export default function OfficerClassroomView() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const [loading, setLoading] = useState(true);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [selectedSubmission, setSelectedSubmission] = useState<any>(null);

  useEffect(() => {
    fetchSubmissions();
  }, []);

  const fetchSubmissions = async () => {
    setLoading(true);
    try {
      // Use the more inclusive endpoint that returns all statuses
      const response = await api.get('/clearance-items/officer/submissions');
      setSubmissions(response.data.data || []);
    } catch (error) {
      console.error('Failed to fetch submissions:', error);
    } finally {
      setLoading(false);
    }
  };

  // Group submissions by student
  const students = useMemo(() => {
    const studentMap: Record<string, any> = {};

    submissions.forEach(sub => {
      // Handle different field names for student/user ID
      const studentObj = sub.studentId || sub.userId || sub.student;
      if (!studentObj?._id) return;

      const sId = studentObj._id;
      const sName = studentObj.fullName || studentObj.name || "Unknown Student";
      const sNum = studentObj.studentNumber || studentObj.studentId || "N/A";

      if (!studentMap[sId]) {
        studentMap[sId] = {
          id: sId,
          name: sName,
          studentNumber: sNum,
          submissions: [],
          status: 'approved' // Default to approved, downgrade if pending/rejected found
        };
      }
      studentMap[sId].submissions.push(sub);

      const subStatus = (sub.status || '').toLowerCase();
      // If any is pending or rejected, that takes precedence in the sidebar summary
      if (subStatus === 'pending' || subStatus === 'rejected') {
        studentMap[sId].status = subStatus;
      }
    });

    return Object.values(studentMap).filter((s: any) =>
      s.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [submissions, searchQuery]);

  const stats = useMemo(() => {
    const turnedIn = submissions.filter(s => (s.status || '').toLowerCase() === 'pending').length;
    const graded = submissions.filter(s => ['approved', 'rejected', 'done'].includes((s.status || '').toLowerCase())).length;
    const total = submissions.length;

    return { turnedIn, assigned: total, graded };
  }, [submissions]);

  const handleReviewClick = (submission: Submission) => {
    // Again, handle potential field name differences
    const reqObj = submission.clearanceItemId || submission.clearanceRequirementId;
    setSelectedSubmission({
      clearanceRequirementId: { _id: reqObj?._id },
      requirementTitle: reqObj?.title || 'Requirement'
    });
    setReviewModalOpen(true);
  };

  const handleStatusChange = async (studentId: string, newStatus: string) => {
    const targetStatus = newStatus.toLowerCase();
    if (targetStatus === 'pending') return;

    try {
      const studentSubmissions = submissions.filter(s => {
        const sMatch = (s.studentId?._id === studentId || s.userId?._id === studentId);
        return sMatch;
      });
      for (const sub of studentSubmissions) {
        await api.post('/clearance/officer/review', {
          submissionId: sub._id,
          action: targetStatus,
          notes: `Status updated via classroom grid by officer.`
        });
      }
      fetchSubmissions();
    } catch (error) {
      console.error('Failed to update status:', error);
    }
  };

  const getStatusColor = (status: string) => {
    const s = (status || '').toLowerCase();
    switch (s) {
      case 'approved': return '#059669';
      case 'rejected': return '#DC2626';
      case 'returned': return '#D97706';
      default: return '#64748B';
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
        <CircularProgress sx={{ color: '#0F172A' }} />
      </Box>
    );
  }

  return (
    <Box sx={{
      display: 'flex',
      flexDirection: 'column',
      height: 'calc(100vh - 120px)',
      bgcolor: '#FFFFFF',
      borderRadius: '16px',
      overflow: 'hidden',
      border: '1px solid #E2E8F0',
      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
    }}>
      {/* ── Header Row ────────────────────────────────────────── */}
      <Box sx={{ p: 2.5, borderBottom: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', justifyContent: 'space-between', bgcolor: '#F8FAFC' }}>
        <Box sx={{ display: 'flex', gap: 4 }}>
          <Box>
            <Typography sx={{ fontSize: 32, fontWeight: 300, color: '#0F172A', lineHeight: 1 }}>{stats.turnedIn}</Typography>
            <Typography sx={{ fontSize: 12, fontWeight: 600, color: '#64748B', textTransform: 'uppercase', mt: 0.5 }}>Turned in</Typography>
          </Box>
          <Divider orientation="vertical" flexItem sx={{ borderStyle: 'dashed' }} />
          <Box>
            <Typography sx={{ fontSize: 32, fontWeight: 300, color: '#0F172A', lineHeight: 1 }}>{stats.assigned}</Typography>
            <Typography sx={{ fontSize: 12, fontWeight: 600, color: '#64748B', textTransform: 'uppercase', mt: 0.5 }}>Assigned</Typography>
          </Box>
          <Divider orientation="vertical" flexItem sx={{ borderStyle: 'dashed' }} />
          <Box>
            <Typography sx={{ fontSize: 32, fontWeight: 300, color: '#0F172A', lineHeight: 1 }}>{stats.graded}</Typography>
            <Typography sx={{ fontSize: 12, fontWeight: 600, color: '#64748B', textTransform: 'uppercase', mt: 0.5 }}>Graded</Typography>
          </Box>
        </Box>

        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={fetchSubmissions}
            sx={{ textTransform: 'none', borderRadius: 2, fontWeight: 600, color: '#475569', borderColor: '#E2E8F0' }}
          >
            Refresh
          </Button>
          <IconButton>
            <FilterIcon />
          </IconButton>
        </Box>
      </Box>

      {/* ── Main Content Area ────────────────────────────────────── */}
      <Box sx={{ display: 'flex', flex: 1, overflow: 'hidden' }}>

        {/* LEFT SIDEBAR: Student List */}
        {!isMobile && (
          <Box sx={{ width: 320, borderRight: '1px solid #E2E8F0', display: 'flex', flexDirection: 'column' }}>
            <Box sx={{ p: 2 }}>
              <TextField
                fullWidth
                size="small"
                placeholder="Search students..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon sx={{ color: '#94A3B8', fontSize: 20 }} />
                    </InputAdornment>
                  ),
                  sx: { borderRadius: 2, bgcolor: '#F1F5F9', border: 'none', '& fieldset': { border: 'none' } }
                }}
              />
            </Box>
            <List sx={{ flex: 1, overflowY: 'auto', py: 0 }}>
              {students.map((student) => (
                <ListItem
                  key={student.id}
                  button
                  selected={selectedStudentId === student.id}
                  onClick={() => setSelectedStudentId(student.id)}
                  sx={{
                    borderBottom: '1px solid #F1F5F9',
                    '&.Mui-selected': { bgcolor: '#F8FAFC', borderLeft: '4px solid #0F172A' },
                    py: 1.5,
                    px: 2
                  }}
                >
                  <Checkbox size="small" sx={{ ml: -1, mr: 1 }} />
                  <ListItemAvatar sx={{ minWidth: 48 }}>
                    <Avatar sx={{ width: 32, height: 32, fontSize: 14, bgcolor: '#0F172A' }}>
                      {student.name.charAt(0)}
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary={
                      <Typography sx={{ fontSize: 14, fontWeight: 600, color: '#1E293B' }}>
                        {student.name}
                      </Typography>
                    }
                    secondary={
                      <Typography sx={{ fontSize: 12, color: '#64748B' }}>
                        {(student.status || '').toLowerCase() === 'pending' ? 'Turned in' : 'Graded'}
                      </Typography>
                    }
                  />
                  <Select
                    size="small"
                    value={(student.status || '').toLowerCase()}
                    onChange={(e) => handleStatusChange(student.id, e.target.value as string)}
                    variant="standard"
                    disableUnderline
                    sx={{
                      fontSize: 12,
                      fontWeight: 700,
                      color: getStatusColor(student.status),
                      width: 80,
                      textAlign: 'right',
                      '& .MuiSelect-select': { pr: '16px !important' }
                    }}
                  >
                    <MenuItem value="pending">Awaiting</MenuItem>
                    <MenuItem value="approved">Approved</MenuItem>
                    <MenuItem value="rejected">Rejected</MenuItem>
                  </Select>
                </ListItem>
              ))}
            </List>
          </Box>
        )}

        {/* RIGHT AREA: Submission Cards Grid */}
        <Box sx={{ flex: 1, bgcolor: '#FFFFFF', p: 3, overflowY: 'auto' }}>
          <Grid container spacing={3}>
            {submissions
              .filter(s => {
                const sId = s.studentId?._id || s.userId?._id || s.student?._id;
                return !selectedStudentId || sId === selectedStudentId;
              })
              .map((sub) => {
                const subStatus = (sub.status || '').toLowerCase();
                const studentObj = sub.studentId || sub.userId || sub.student;
                const reqObj = sub.clearanceItemId || sub.clearanceRequirementId;

                return (
                  <Grid item xs={12} sm={6} md={4} lg={3} key={sub._id}>
                    <Card
                      elevation={0}
                      sx={{
                        height: '100%',
                        border: '1px solid #E2E8F0',
                        borderRadius: '12px',
                        transition: 'all 0.2s',
                        cursor: 'pointer',
                        '&:hover': {
                          transform: 'translateY(-2px)',
                          boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
                          borderColor: '#CBD5E1'
                        }
                      }}
                      onClick={() => handleReviewClick(sub)}
                    >
                      <CardContent sx={{ p: 2 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                          <Avatar sx={{ width: 28, height: 28, bgcolor: '#F1F5F9', color: '#64748B', mr: 1, fontSize: 12 }}>
                            {studentObj?.fullName?.charAt(0) || studentObj?.name?.charAt(0) || '?'}
                          </Avatar>
                          <Typography sx={{ fontSize: 13, fontWeight: 600, color: '#1E293B', listStyle: 'none', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {studentObj?.fullName || studentObj?.name || 'Unknown'}
                          </Typography>
                          <IconButton size="small" sx={{ ml: 'auto' }}>
                            <MoreIcon fontSize="small" />
                          </IconButton>
                        </Box>

                        <Box sx={{
                          height: 120,
                          bgcolor: '#F8FAFC',
                          borderRadius: '8px',
                          mb: 1.5,
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          justifyContent: 'center',
                          border: '1px dashed #E2E8F0'
                        }}>
                          <FileIcon sx={{ fontSize: 32, color: '#94A3B8', mb: 1 }} />
                          <Typography sx={{ fontSize: 11, color: '#64748B', fontWeight: 600 }}>
                            {sub.files?.length || 0} attachment{(sub.files?.length !== 1) ? 's' : ''}
                          </Typography>
                          {subStatus === 'pending' && (
                            <Typography sx={{ fontSize: 10, color: '#059669', fontWeight: 700, mt: 0.5 }}>
                              Turned in
                            </Typography>
                          )}
                        </Box>

                        <Typography sx={{ fontSize: 14, fontWeight: 700, color: '#334155', mb: 0.5 }}>
                          {reqObj?.title || 'Requirement'}
                        </Typography>

                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mt: 1.5 }}>
                          <Chip
                            label={subStatus.toUpperCase()}
                            size="small"
                            sx={{
                              height: 20,
                              fontSize: 10,
                              fontWeight: 800,
                              bgcolor: subStatus === 'approved' ? '#ECFDF5' : subStatus === 'rejected' ? '#FEF2F2' : '#F1F5F9',
                              color: getStatusColor(subStatus),
                              borderRadius: '6px'
                            }}
                          />
                          <Typography sx={{ fontSize: 11, color: '#94A3B8' }}>
                            {sub.submittedAt ? new Date(sub.submittedAt).toLocaleDateString() : 'N/A'}
                          </Typography>
                        </Box>
                      </CardContent>
                    </Card>
                  </Grid>
                );
              })}
          </Grid>
        </Box>
      </Box>

      {/* MODALS */}
      {selectedSubmission && (
        <ReviewSubmissionsModal
          open={reviewModalOpen}
          onClose={() => {
            setReviewModalOpen(false);
            fetchSubmissions();
          }}
          requirementId={selectedSubmission.clearanceRequirementId._id}
          requirementTitle={selectedSubmission.requirementTitle}
          onReviewComplete={fetchSubmissions}
        />
      )}
    </Box>
  );
}
