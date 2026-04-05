import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Alert,
  Snackbar,
  Grid,
  IconButton,
  LinearProgress
} from '@mui/material';
import { api } from '../../services';

// Custom SVG Icons
const CheckCircleIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
    <path d="M9 12L11 14L15 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const ErrorIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
    <path d="M15 9L9 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
    <path d="M9 9L15 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
  </svg>
);

const DownloadIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M21 15V19C21 20.1046 20.1046 21 19 21H5C3.89543 21 3 20.1046 3 19V15" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
    <path d="M7 10L12 15L17 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M12 15V3" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
  </svg>
);

const DescriptionIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M14 2H6C4.89543 2 4 4V20C4 21.1046 4.89543 22 6 22H18C19.1046 22 20 20V8L14 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M14 2V8H20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M16 13H8" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
    <path d="M16 17H8" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
    <path d="M10 9H8" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
  </svg>
);

interface Submission {
  _id: string;
  studentId: {
    _id: string;
    fullName: string;
    email: string;
    studentNumber?: string;
    course?: string;
  };
  clearanceItemId: {
    _id: string;
    title: string;
    description: string;
    requiredDocuments: string[];
  };
  reviewedBy?: {
    fullName: string;
    email: string;
  };
  files: Array<{
    filename: string;
    originalName: string;
    mimeType: string;
    size: number;
  }>;
  status: 'approved';
  submittedAt: string;
  reviewedAt: string;
  notes?: string;
  finalApprovalAt?: string;
}

interface NotificationState {
  open: boolean;
  message: string;
  severity: 'success' | 'error' | 'warning' | 'info';
}

export default function DeanApprovalsSimple() {
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [approvalDialog, setApprovalDialog] = useState<{ open: boolean; submission: Submission | null }>({ open: false, submission: null });
  const [approvalNotes, setApprovalNotes] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');
  const [approving, setApproving] = useState(false);
  const [notification, setNotification] = useState<NotificationState>({ open: false, message: '', severity: 'info' });

  useEffect(() => {
    fetchSubmissions();
  }, []);

  const fetchSubmissions = async () => {
    try {
      const response = await api.get('/clearance/dean/submissions');
      setSubmissions(response.data.data);
    } catch (error) {
      showNotification('Failed to load submissions', 'error');
    } finally {
      setLoading(false);
    }
  };

  const showNotification = (message: string, severity: 'success' | 'error' | 'warning' | 'info') => {
    setNotification({ open: true, message, severity });
  };

  const handleCloseNotification = () => {
    setNotification(prev => ({ ...prev, open: false }));
  };

  const downloadFile = async (filename: string, originalName: string) => {
    try {
      const response = await api.get(`/clearance/download/${filename}`, {
        responseType: 'blob',
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', originalName);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      showNotification('Failed to download file', 'error');
    }
  };

  const handleFinalApproval = async (action: 'approve' | 'reject') => {
    if (!approvalDialog.submission) return;

    setApproving(true);
    try {
      await api.post('/clearance/dean/final-approval', {
        submissionId: approvalDialog.submission._id,
        action,
        notes: action === 'approve' ? approvalNotes : rejectionReason
      });
      
      showNotification(`Final ${action} completed successfully`, 'success');
      setApprovalDialog({ open: false, submission: null });
      setApprovalNotes('');
      setRejectionReason('');
      fetchSubmissions();
    } catch (error: any) {
      showNotification(error.response?.data?.message || 'Approval failed', 'error');
    } finally {
      setApproving(false);
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
        <LinearProgress sx={{ width: '50%' }} />
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h4" sx={{ fontWeight: 800, mb: 3 }}>
        Final Approvals Required
      </Typography>
      
      {submissions.length === 0 ? (
        <Card>
          <CardContent sx={{ textAlign: 'center', py: 4 }}>
            <Typography variant="h6" color="text.secondary">
              No pending final approvals
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              All submissions have been reviewed.
            </Typography>
          </CardContent>
        </Card>
      ) : (
        <Grid container spacing={3}>
          {submissions.map((submission) => (
            <Grid item xs={12} md={6} lg={4} key={submission._id}>
              <Card 
                sx={{ 
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  border: submission.finalApprovalAt ? '2px solid #4CAF50' : '2px solid #FF9800'
                }}
              >
                <CardContent sx={{ flexGrow: 1 }}>
                  <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
                    <Typography variant="h6" sx={{ fontWeight: 700 }}>
                      {submission.clearanceItemId.title}
                    </Typography>
                    <Chip 
                      label={submission.finalApprovalAt ? "FINAL APPROVED" : "PENDING FINAL APPROVAL"}
                      color={submission.finalApprovalAt ? "success" : "warning" as any}
                      size="small"
                    />
                  </Box>

                  <Typography variant="subtitle2" sx={{ mb: 1 }}>
                    Student: {submission.studentId.fullName}
                  </Typography>
                  
                  {submission.studentId.studentNumber && (
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                      Student No: {submission.studentId.studentNumber}
                    </Typography>
                  )}
                  
                  {submission.studentId.course && (
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                      Course: {submission.studentId.course}
                    </Typography>
                  )}

                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                      Email: {submission.studentId.email}
                    </Typography>

                  <Typography variant="body2" sx={{ mb: 1 }}>
                    {submission.clearanceItemId.description}
                  </Typography>

                  {submission.reviewedBy && (
                    <Box mb={2}>
                      <Typography variant="subtitle2">Reviewed By:</Typography>
                      <Typography variant="body2" color="text.secondary">
                        {submission.reviewedBy.fullName} ({submission.reviewedBy.email})
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Reviewed on: {new Date(submission.reviewedAt).toLocaleDateString()}
                      </Typography>
                    </Box>
                  )}

                  {submission.notes && (
                    <Box mb={2}>
                      <Typography variant="subtitle2">Officer Notes:</Typography>
                      <Typography variant="body2" color="text.secondary">
                        {submission.notes}
                      </Typography>
                    </Box>
                  )}

                  <Typography variant="subtitle2" sx={{ mb: 1 }}>
                    Submitted Files:
                  </Typography>
                  {submission.files.map((file, index) => (
                    <Box key={index} display="flex" alignItems="center" gap={1} mb={1}>
                      <IconButton 
                        size="small"
                        onClick={() => downloadFile(file.filename, file.originalName)}
                      >
                        <DownloadIcon />
                      </IconButton>
                      <Typography variant="caption">
                        {file.originalName}
                      </Typography>
                    </Box>
                  ))}

                  {submission.finalApprovalAt && (
                    <Alert severity="success" sx={{ mt: 2, borderRadius: '14px' }}>
                      <Typography variant="caption">
                        Final approval granted on {new Date(submission.finalApprovalAt).toLocaleDateString()}
                      </Typography>
                    </Alert>
                  )}
                </CardContent>

                {!submission.finalApprovalAt && (
                  <Box sx={{ mt: 2, p: 2, borderTop: '1px solid #e0e0e0' }}>
                    <Button
                      fullWidth
                      variant="contained"
                      onClick={() => setApprovalDialog({ open: true, submission })}
                      sx={{ borderRadius: '8px' }}
                    >
                      Review Final Approval
                    </Button>
                  </Box>
                )}
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {/* Final Approval Dialog */}
      <Dialog 
        open={approvalDialog.open} 
        onClose={() => setApprovalDialog({ open: false, submission: null })}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          <Typography variant="h6">
            Final Approval - {approvalDialog.submission?.clearanceItemId.title}
          </Typography>
        </DialogTitle>
        
        <DialogContent>
          <Typography variant="body2" sx={{ mb: 2 }}>
            Student: {approvalDialog.submission?.studentId.fullName}
          </Typography>
          
          <TextField
            fullWidth
            multiline
            rows={3}
            label="Approval Notes (if approving)"
            value={approvalNotes}
            onChange={(e) => setApprovalNotes(e.target.value)}
            sx={{ mb: 2 }}
          />
          
          <TextField
            fullWidth
            multiline
            rows={2}
            label="Rejection Reason (if rejecting)"
            value={rejectionReason}
            onChange={(e) => setRejectionReason(e.target.value)}
            sx={{ mb: 2 }}
          />
        </DialogContent>
        
        <DialogActions>
          <Button onClick={() => setApprovalDialog({ open: false, submission: null })} sx={{ borderRadius: '8px' }}>
            Cancel
          </Button>
          <Button 
            onClick={() => handleFinalApproval('reject')}
            variant="outlined"
            color="error"
            disabled={approving}
            sx={{ borderRadius: '8px' }}
          >
            Reject
          </Button>
          <Button 
            onClick={() => handleFinalApproval('approve')}
            variant="contained"
            color="success"
            disabled={approving}
            sx={{ borderRadius: '8px' }}
          >
            Approve
          </Button>
        </DialogActions>
      </Dialog>

      {/* Notification Snackbar */}
      <Snackbar
        open={notification.open}
        autoHideDuration={6000}
        onClose={handleCloseNotification}
      >
        <Alert 
          onClose={handleCloseNotification} 
          severity={notification.severity}
          sx={{ width: '100%', borderRadius: '14px' }}
        >
          {notification.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}
