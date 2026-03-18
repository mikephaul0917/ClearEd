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

export default function OfficerReviewSimple() {
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [reviewDialog, setReviewDialog] = useState<{ open: boolean; submission: Submission | null }>({ open: false, submission: null });
  const [reviewNotes, setReviewNotes] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');
  const [reviewing, setReviewing] = useState(false);
  const [notification, setNotification] = useState<NotificationState>({ open: false, message: '', severity: 'info' });

  useEffect(() => {
    fetchSubmissions();
  }, []);

  const fetchSubmissions = async () => {
    try {
      const response = await api.get('/clearance/officer/submissions');
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

  const handleReview = async (action: 'approve' | 'reject') => {
    if (!reviewDialog.submission) return;

    setReviewing(true);
    try {
      await api.post('/clearance/officer/review', {
        submissionId: reviewDialog.submission._id,
        action,
        notes: reviewNotes,
        rejectionReason: action === 'reject' ? rejectionReason : undefined
      });
      
      showNotification(`Submission ${action}d successfully`, 'success');
      setReviewDialog({ open: false, submission: null });
      setReviewNotes('');
      setRejectionReason('');
      fetchSubmissions();
    } catch (error: any) {
      showNotification(error.response?.data?.message || 'Review failed', 'error');
    } finally {
      setReviewing(false);
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
        Pending Submissions
      </Typography>
      
      {submissions.length === 0 ? (
        <Card>
          <CardContent sx={{ textAlign: 'center', py: 4 }}>
            <Typography variant="h6" color="text.secondary">
              No pending submissions
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
                  border: '2px solid #4CAF50'
                }}
              >
                <CardContent sx={{ flexGrow: 1 }}>
                  <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
                    <Typography variant="h6" sx={{ fontWeight: 700 }}>
                      {submission.clearanceItemId.title}
                    </Typography>
                    <Chip 
                      label="APPROVED"
                      size="small"
                      color="success"
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

                  <Box sx={{ mt: 2, p: 2, borderTop: '1px solid #e0e0e0' }}>
                    <Button
                      fullWidth
                      variant="contained"
                      onClick={() => setReviewDialog({ open: true, submission })}
                    >
                      Review Submission
                    </Button>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {/* Review Dialog */}
      <Dialog 
        open={reviewDialog.open} 
        onClose={() => setReviewDialog({ open: false, submission: null })}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          <Typography variant="h6">
            Review Submission - {reviewDialog.submission?.clearanceItemId.title}
          </Typography>
        </DialogTitle>
        
        <DialogContent>
          <Typography variant="body2" sx={{ mb: 2 }}>
            Student: {reviewDialog.submission?.studentId.fullName}
          </Typography>
          
          <TextField
            fullWidth
            multiline
            rows={3}
            label="Review Notes"
            value={reviewNotes}
            onChange={(e) => setReviewNotes(e.target.value)}
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
          <Button onClick={() => setReviewDialog({ open: false, submission: null })}>
            Cancel
          </Button>
          <Button 
            onClick={() => handleReview('reject')}
            variant="outlined"
            color="error"
            disabled={reviewing}
          >
            Reject
          </Button>
          <Button 
            onClick={() => handleReview('approve')}
            variant="contained"
            color="success"
            disabled={reviewing}
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
          sx={{ width: '100%' }}
        >
          {notification.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}
