import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Chip,
  LinearProgress,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Alert,
  Snackbar,
  Grid
} from '@mui/material';
import MuiDescriptionIcon from '@mui/icons-material/Description';
import { api } from '../../services';

// Custom SVG Icons
const CloudUploadIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M7 10L12 5L17 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M12 5V15" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
    <path d="M20 13V19C20 20.1046 19.1046 21 18 21H6C4.89543 21 4 20.1046 4 19V13" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
  </svg>
);

const DownloadIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M21 15V19C21 20.1046 20.1046 21 19 21H5C3.89543 21 3 20.1046 3 19V15" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
    <path d="M7 10L12 15L17 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M12 15V3" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
  </svg>
);

const CheckCircleIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
    <path d="M9 12L11 14L15 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const PendingIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
    <path d="M12 6V12L16 14" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
  </svg>
);

const ErrorIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
    <path d="M15 9L9 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
    <path d="M9 9L15 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
  </svg>
);

const RefreshIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M23 4V10H17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M1 20V14H7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M3.51 9C4.30866 6.61305 5.92253 4.61718 8.09091 3.82646C10.2593 3.03573 12.6899 3.52522 14.4142 5.14903C16.1385 6.77285 16.7778 9.16672 16.0866 11.3846C15.3954 13.6025 13.474 15.2474 11.1705 15.5906C8.86697 15.9339 6.55909 14.9289 5.27248 13.0007" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const DescriptionIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M14 2H6C4.89543 2 4 2.89543 4 4V20C4 21.1046 4.89543 22 6 22H18C19.1046 22 20 21.1046 20 20V8L14 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M14 2V8H20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M16 13H8" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
    <path d="M16 17H8" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
    <path d="M10 9H8" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
  </svg>
);

const CloseIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
    <path d="M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
  </svg>
);

interface ClearanceItem {
  _id: string;
  title: string;
  description: string;
  requiredDocuments: string[];
  assignedOfficerId?: {
    fullName: string;
    email: string;
  };
  requiresDeanApproval: boolean;
  order: number;
  submission?: {
    id: string;
    status: 'pending' | 'approved' | 'rejected' | 'resubmission_required';
    submittedAt: string;
    files: Array<{
      filename: string;
      originalName: string;
      mimeType: string;
      size: number;
    }>;
    notes?: string;
    rejectionReason?: string;
    requiresResubmission?: boolean;
    resubmissionDeadline?: string;
  };
}

interface NotificationState {
  open: boolean;
  message: string;
  severity: 'success' | 'error' | 'warning' | 'info';
}

export default function ClearanceRequirements() {
  const [clearanceItems, setClearanceItems] = useState<ClearanceItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploadDialog, setUploadDialog] = useState<{ open: boolean; item: ClearanceItem | null }>({ open: false, item: null });
  const [selectedFiles, setSelectedFiles] = useState<FileList | null>(null);
  const [studentNotes, setStudentNotes] = useState('');
  const [uploading, setUploading] = useState(false);
  const [notification, setNotification] = useState<NotificationState>({ open: false, message: '', severity: 'info' });

  useEffect(() => {
    fetchClearanceItems();
  }, []);

  const fetchClearanceItems = async () => {
    try {
      const response = await api.get('/clearance/items');
      setClearanceItems(response.data.data);
    } catch (error) {
      showNotification('Failed to load clearance items', 'error');
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'success';
      case 'rejected': return 'error';
      case 'resubmission_required': return 'warning';
      case 'pending': return 'info';
      default: return 'default';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved': return <Box sx={{ color: 'success.main' }}><CheckCircleIcon /></Box>;
      case 'rejected': return <Box sx={{ color: 'error.main' }}><ErrorIcon /></Box>;
      case 'resubmission_required': return <Box sx={{ color: 'warning.main' }}><RefreshIcon /></Box>;
      case 'pending': return <Box sx={{ color: 'info.main' }}><PendingIcon /></Box>;
      default: return <MuiDescriptionIcon />;
    }
  };

  const handleUpload = async () => {
    if (!uploadDialog.item || !selectedFiles) return;

    setUploading(true);
    const formData = new FormData();
    formData.append('clearanceItemId', uploadDialog.item._id);
    formData.append('studentNotes', studentNotes);
    
    Array.from(selectedFiles).forEach(file => {
      formData.append('files', file);
    });

    try {
      await api.post('/clearance/submit', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      
      showNotification('Documents uploaded successfully', 'success');
      setUploadDialog({ open: false, item: null });
      setSelectedFiles(null);
      setStudentNotes('');
      fetchClearanceItems();
    } catch (error: any) {
      showNotification(error.response?.data?.message || 'Upload failed', 'error');
    } finally {
      setUploading(false);
    }
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
        Clearance Requirements
      </Typography>
      
      <Grid container spacing={3}>
        {clearanceItems.map((item) => (
          <Grid item xs={12} md={6} lg={4} key={item._id}>
            <Card 
              sx={{ 
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                position: 'relative',
                border: item.submission ? `2px solid` : '1px solid #e0e0e0',
                borderColor: item.submission ? getStatusColor(item.submission.status) : 'inherit'
              }}
            >
              <CardContent sx={{ flexGrow: 1 }}>
                <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
                  <Typography variant="h6" sx={{ fontWeight: 700 }}>
                    {item.title}
                  </Typography>
                  {item.submission && getStatusIcon(item.submission.status)}
                </Box>

                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  {item.description}
                </Typography>

                {item.assignedOfficerId && (
                  <Typography variant="caption" color="text.secondary" sx={{ mb: 1 }}>
                    Assigned to: {item.assignedOfficerId.fullName}
                  </Typography>
                )}

                {item.requiresDeanApproval && (
                  <Chip 
                    label="Requires Dean Approval" 
                    size="small" 
                    color="secondary" 
                    sx={{ mb: 2 }}
                  />
                )}

                <Typography variant="subtitle2" sx={{ mb: 1 }}>
                  Required Documents:
                </Typography>
                <List dense>
                  {item.requiredDocuments.map((doc, index) => (
                    <ListItem key={index} sx={{ py: 0 }}>
                      <ListItemIcon sx={{ minWidth: 24 }}>
                        <MuiDescriptionIcon fontSize="small" />
                      </ListItemIcon>
                      <ListItemText primary={doc} />
                    </ListItem>
                  ))}
                </List>

                {item.submission && (
                  <Box mt={2}>
                    <Chip 
                      label={item.submission.status.replace('_', ' ').toUpperCase()}
                      color={getStatusColor(item.submission.status) as any}
                      size="small"
                      sx={{ mb: 1 }}
                    />
                    
                    {item.submission.files.length > 0 && (
                      <Box>
                        <Typography variant="subtitle2" sx={{ mb: 1 }}>
                          Uploaded Files:
                        </Typography>
                        {item.submission.files.map((file, index) => (
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
                      </Box>
                    )}

                    {item.submission.rejectionReason && (
                      <Alert severity="error" sx={{ mt: 1, borderRadius: '14px' }}>
                        <Typography variant="caption">
                          {item.submission.rejectionReason}
                        </Typography>
                      </Alert>
                    )}

                    {item.submission.notes && (
                      <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                        Officer Notes: {item.submission.notes}
                      </Typography>
                    )}
                  </Box>
                )}
              </CardContent>

              <Box sx={{ p: 2, borderTop: '1px solid #e0e0e0' }}>
                <Button
                  fullWidth
                  variant={item.submission ? "outlined" : "contained"}
                  startIcon={<CloudUploadIcon />}
                  onClick={() => setUploadDialog({ open: true, item })}
                  disabled={item.submission?.status === 'approved'}
                  sx={{ borderRadius: '8px' }}
                >
                  {item.submission ? 'Resubmit Documents' : 'Submit Documents'}
                </Button>
              </Box>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Upload Dialog */}
      <Dialog 
        open={uploadDialog.open} 
        onClose={() => setUploadDialog({ open: false, item: null })}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          <Box display="flex" alignItems="center" justifyContent="space-between">
            <Typography variant="h6">
              Upload Documents - {uploadDialog.item?.title}
            </Typography>
            <IconButton onClick={() => setUploadDialog({ open: false, item: null })}>
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>
        
        <DialogContent>
          <TextField
            fullWidth
            multiline
            rows={3}
            label="Notes (Optional)"
            value={studentNotes}
            onChange={(e) => setStudentNotes(e.target.value)}
            sx={{ mb: 2 }}
          />
          
          <Button
            variant="outlined"
            component="label"
            fullWidth
            sx={{ mb: 2, borderRadius: '8px' }}
          >
            Select Files
            <input
              type="file"
              multiple
              hidden
              onChange={(e) => setSelectedFiles(e.target.files)}
            />
          </Button>
          
          {selectedFiles && (
            <Box>
              <Typography variant="subtitle2" sx={{ mb: 1 }}>
                Selected Files:
              </Typography>
              {Array.from(selectedFiles).map((file, index) => (
                <Typography key={index} variant="caption" sx={{ display: 'block' }}>
                  {file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)
                </Typography>
              ))}
            </Box>
          )}
        </DialogContent>
        
        <DialogActions>
          <Button onClick={() => setUploadDialog({ open: false, item: null })}>
            Cancel
          </Button>
          <Button 
            onClick={handleUpload} 
            variant="contained"
            disabled={!selectedFiles || uploading}
          >
            {uploading ? 'Uploading...' : 'Upload'}
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
