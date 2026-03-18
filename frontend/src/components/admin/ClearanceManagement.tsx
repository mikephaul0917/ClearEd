import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
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
  Grid,
  IconButton,
  LinearProgress,
  Chip,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Switch,
  FormControlLabel
} from '@mui/material';
import { api } from '../../services';
import { CardGridSkeleton, LoadingSpinner } from '../../components/ui';
import { formatErrorForDisplay } from '../../utils/errorMessages';

// Custom SVG Icons
const AddIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 5V19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    <path d="M5 12H19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
  </svg>
);

const EditIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M11 4H4C3.44772 4 3 4.44772 3 5V19C3 19.5523 3.44772 20 4 20H18C18.5523 20 19 19.5523 19 19V12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    <path d="M18.5 2.5C19.3284 1.67157 20.6716 1.67157 21.5 2.5C22.3284 3.32843 22.3284 4.67157 21.5 5.5L12 15L8 16L9 12L18.5 2.5Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const DeleteIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M3 6H5H21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    <path d="M19 6V20C19 21.1046 18.1046 22 17 22H7C5.89543 22 5 21.1046 5 20V6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    <path d="M8 6V4C8 3.44772 8.44772 3 9 3H15C15.5523 3 16 3.44772 16 4V6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
  </svg>
);

const DescriptionIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M14 2H6C4.89543 2 4 2.89543 4 4V20C4 21.1046 4.89543 22 6 22H18C19.1046 22 20 21.1046 20 20V8L14 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M14 2V8H20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M16 13H8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    <path d="M16 17H8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    <path d="M10 9H8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
  </svg>
);

interface ClearanceItem {
  _id: string;
  title: string;
  description: string;
  requiredDocuments: string[];
  assignedOfficerId?: {
    _id: string;
    fullName: string;
    email: string;
  };
  requiresDeanApproval: boolean;
  isActive: boolean;
  order: number;
  createdBy?: {
    fullName: string;
    email: string;
  };
  stats?: {
    total: number;
    pending: number;
    approved: number;
    rejected: number;
    resubmission_required: number;
  };
}

interface Officer {
  _id: string;
  fullName: string;
  email: string;
}

interface NotificationState {
  open: boolean;
  message: string;
  severity: 'success' | 'error' | 'warning' | 'info';
}

export default function ClearanceManagement() {
  const [clearanceItems, setClearanceItems] = useState<ClearanceItem[]>([]);
  const [officers, setOfficers] = useState<Officer[]>([]);
  const [loading, setLoading] = useState(true);
  const [itemDialog, setItemDialog] = useState<{ open: boolean; item: ClearanceItem | null }>({ open: false, item: null });
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    requiredDocuments: [''],
    assignedOfficerId: '',
    requiresDeanApproval: false,
    isActive: true
  });
  const [saving, setSaving] = useState(false);
  const [notification, setNotification] = useState<NotificationState>({ open: false, message: '', severity: 'info' });

  useEffect(() => {
    fetchClearanceItems();
    fetchOfficers();
  }, []);

  const fetchClearanceItems = async () => {
    try {
      const response = await api.get('/clearance/admin/items');
      setClearanceItems(response.data.data);
    } catch (error: any) {
      const errorInfo = formatErrorForDisplay(error);
      showNotification(errorInfo.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const fetchOfficers = async () => {
    try {
      const response = await api.get('/clearance/admin/officers');
      setOfficers(response.data.data);
    } catch (error) {
      console.error('Failed to load officers:', error);
    }
  };

  const showNotification = (message: string, severity: 'success' | 'error' | 'warning' | 'info') => {
    setNotification({ open: true, message, severity });
  };

  const handleCloseNotification = () => {
    setNotification(prev => ({ ...prev, open: false }));
  };

  const handleCreateItem = () => {
    setItemDialog({ open: true, item: null });
    setFormData({
      title: '',
      description: '',
      requiredDocuments: [''],
      assignedOfficerId: '',
      requiresDeanApproval: false,
      isActive: true
    });
  };

  const handleEditItem = (item: ClearanceItem) => {
    setItemDialog({ open: true, item });
    setFormData({
      title: item.title,
      description: item.description,
      requiredDocuments: item.requiredDocuments.length > 0 ? item.requiredDocuments : [''],
      assignedOfficerId: item.assignedOfficerId?._id || '',
      requiresDeanApproval: item.requiresDeanApproval,
      isActive: item.isActive
    });
  };

  const handleSaveItem = async () => {
    setSaving(true);
    try {
      const payload = {
        ...formData,
        requiredDocuments: formData.requiredDocuments.filter(doc => doc.trim() !== '')
      };

      if (itemDialog.item) {
        await api.put(`/clearance/admin/items/${itemDialog.item._id}`, payload);
        showNotification('Clearance item updated successfully', 'success');
      } else {
        await api.post('/clearance/admin/items', payload);
        showNotification('Clearance item created successfully', 'success');
      }

      setItemDialog({ open: false, item: null });
      fetchClearanceItems();
    } catch (error: any) {
      const errorInfo = formatErrorForDisplay(error);
      showNotification(errorInfo.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteItem = async (itemId: string) => {
    if (!window.confirm('Are you sure you want to delete this clearance item?')) return;

    try {
      await api.delete(`/clearance/admin/items/${itemId}`);
      showNotification('Clearance item deleted successfully', 'success');
      fetchClearanceItems();
    } catch (error: any) {
      const errorInfo = formatErrorForDisplay(error);
      showNotification(errorInfo.message, 'error');
    }
  };

  const addRequiredDocument = () => {
    setFormData(prev => ({
      ...prev,
      requiredDocuments: [...prev.requiredDocuments, '']
    }));
  };

  const updateRequiredDocument = (index: number, value: string) => {
    setFormData(prev => ({
      ...prev,
      requiredDocuments: prev.requiredDocuments.map((doc, i) => i === index ? value : doc)
    }));
  };

  const removeRequiredDocument = (index: number) => {
    setFormData(prev => ({
      ...prev,
      requiredDocuments: prev.requiredDocuments.filter((_, i) => i !== index)
    }));
  };

  if (loading) {
    return (
      <Box>
        <Box display="flex" alignItems="center" justifyContent="space-between" mb={3}>
          <Typography variant="h4" sx={{ fontWeight: 800 }}>
            Clearance Management
          </Typography>
          <Button variant="contained" disabled>
            Add Clearance Item
          </Button>
        </Box>
        <CardGridSkeleton cards={6} height={250} />
      </Box>
    );
  }

  return (
    <Box>
      <Box display="flex" alignItems="center" justifyContent="space-between" mb={3}>
        <Typography variant="h4" sx={{ fontWeight: 800 }}>
          Clearance Management
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleCreateItem}
        >
          Add Clearance Item
        </Button>
      </Box>

      <Grid container spacing={3}>
        {clearanceItems.map((item) => (
          <Grid item xs={12} md={6} lg={4} key={item._id}>
            <Card
              sx={{
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                opacity: item.isActive ? 1 : 0.6
              }}
            >
              <CardContent sx={{ flexGrow: 1 }}>
                <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
                  <Typography variant="h6" sx={{ fontWeight: 700 }}>
                    {item.title}
                  </Typography>
                  <Box>
                    <IconButton
                      size="small"
                      onClick={() => handleEditItem(item)}
                    >
                      <EditIcon />
                    </IconButton>
                    <IconButton
                      size="small"
                      onClick={() => handleDeleteItem(item._id)}
                    >
                      <DeleteIcon />
                    </IconButton>
                  </Box>
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
                        <DescriptionIcon />
                      </ListItemIcon>
                      <ListItemText primary={doc} />
                    </ListItem>
                  ))}
                </List>

                {item.stats && (
                  <Box mt={2}>
                    <Typography variant="subtitle2" sx={{ mb: 1 }}>
                      Statistics:
                    </Typography>
                    <Grid container spacing={1}>
                      <Grid item xs={6}>
                        <Typography variant="caption">Total: {item.stats.total}</Typography>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography variant="caption">Pending: {item.stats.pending}</Typography>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography variant="caption">Approved: {item.stats.approved}</Typography>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography variant="caption">Rejected: {item.stats.rejected}</Typography>
                      </Grid>
                    </Grid>
                  </Box>
                )}
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Create/Edit Dialog */}
      <Dialog
        open={itemDialog.open}
        onClose={() => setItemDialog({ open: false, item: null })}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          <Typography variant="h6">
            {itemDialog.item ? 'Edit Clearance Item' : 'Create Clearance Item'}
          </Typography>
        </DialogTitle>

        <DialogContent>
          <TextField
            fullWidth
            label="Title"
            value={formData.title}
            onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
            sx={{ mb: 2 }}
          />

          <TextField
            fullWidth
            multiline
            rows={3}
            label="Description"
            value={formData.description}
            onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
            sx={{ mb: 2 }}
          />

          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel>Assigned Officer</InputLabel>
            <Select
              value={formData.assignedOfficerId}
              label="Assigned Officer"
              onChange={(e) => setFormData(prev => ({ ...prev, assignedOfficerId: e.target.value }))}
            >
              <MenuItem value="">None</MenuItem>
              {officers.map((officer) => (
                <MenuItem key={officer._id} value={officer._id}>
                  {officer.fullName} ({officer.email})
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <Typography variant="subtitle2" sx={{ mb: 1 }}>
            Required Documents:
          </Typography>
          {formData.requiredDocuments.map((doc, index) => (
            <Box key={index} display="flex" gap={1} mb={1}>
              <TextField
                fullWidth
                value={doc}
                onChange={(e) => updateRequiredDocument(index, e.target.value)}
                placeholder="Document name"
              />
              {formData.requiredDocuments.length > 1 && (
                <Button
                  variant="outlined"
                  color="error"
                  onClick={() => removeRequiredDocument(index)}
                >
                  Remove
                </Button>
              )}
            </Box>
          ))}
          <Button
            variant="outlined"
            onClick={addRequiredDocument}
            sx={{ mb: 2 }}
          >
            Add Document
          </Button>

          <FormControlLabel
            control={
              <Switch
                checked={formData.requiresDeanApproval}
                onChange={(e) => setFormData(prev => ({ ...prev, requiresDeanApproval: e.target.checked }))}
              />
            }
            label="Requires Dean Approval"
            sx={{ mb: 2 }}
          />

          <FormControlLabel
            control={
              <Switch
                checked={formData.isActive}
                onChange={(e) => setFormData(prev => ({ ...prev, isActive: e.target.checked }))}
              />
            }
            label="Active"
          />
        </DialogContent>

        <DialogActions>
          <Button onClick={() => setItemDialog({ open: false, item: null })}>
            Cancel
          </Button>
          <Button
            onClick={handleSaveItem}
            variant="contained"
            disabled={saving || !formData.title || !formData.description}
            startIcon={saving ? <LoadingSpinner size="small" color="inherit" /> : null}
          >
            {saving ? 'Saving...' : 'Save'}
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
