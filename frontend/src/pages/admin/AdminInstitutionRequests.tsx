import { useState, useEffect } from "react";
import Swal from "sweetalert2";
import "sweetalert2/dist/sweetalert2.min.css";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Paper from "@mui/material/Paper";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import IconButton from "@mui/material/IconButton";
import Tooltip from "@mui/material/Tooltip";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import TextField from "@mui/material/TextField";
import FormControl from "@mui/material/FormControl";
import InputLabel from "@mui/material/InputLabel";
import Select from "@mui/material/Select";
import MenuItem from "@mui/material/MenuItem";
import Pagination from "@mui/material/Pagination";
import CircularProgress from "@mui/material/CircularProgress";
import Divider from "@mui/material/Divider";
import Skeleton from "@mui/material/Skeleton";
import CheckIcon from '@mui/icons-material/Check';
import { adminService } from "../../services";

interface InstitutionRequest {
  _id: string;
  institutionName: string;
  academicDomain: string;
  physicalAddress: string;
  contactNumber: string;
  administratorName: string;
  administratorPosition: string;
  administratorEmail: string;
  status: 'PENDING_VERIFICATION' | 'PENDING_APPROVAL' | 'APPROVED' | 'REJECTED' | 'RETURNED_FOR_CLARIFICATION';
  createdAt: string;
  verifiedAt?: string;
  reviewedAt?: string;
  reviewedBy?: any;
  rejectionReason?: string;
  clarificationRequest?: string;
  notes?: string;
  ipAddress?: string;
  userAgent?: string;
}

interface RequestStats {
  byStatus: Record<string, number>;
  total: number;
  thisMonth: number;
}

const STATUS_COLORS = {
  PENDING_VERIFICATION: '#f59e0b',
  PENDING_APPROVAL: '#3b82f6',
  APPROVED: '#5EEAD4',
  REJECTED: '#ef4444',
  RETURNED_FOR_CLARIFICATION: '#8b5cf6'
};

const STATUS_LABELS = {
  PENDING_VERIFICATION: 'Pending Verification',
  PENDING_APPROVAL: 'Pending Approval',
  APPROVED: 'Approved',
  REJECTED: 'Rejected',
  RETURNED_FOR_CLARIFICATION: 'Returned for Clarification'
};

export default function AdminInstitutionRequests({
  refreshTrigger = 0,
  onLoadingChange
}: {
  refreshTrigger?: number;
  onLoadingChange?: (loading: boolean) => void;
}) {
  const [requests, setRequests] = useState<InstitutionRequest[]>([]);
  const [stats, setStats] = useState<RequestStats>({ byStatus: {}, total: 0, thisMonth: 0 });
  const [loading, setLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState<InstitutionRequest | null>(null);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [actionDialogOpen, setActionDialogOpen] = useState(false);
  const [actionType, setActionType] = useState<'approve' | 'reject' | 'clarify' | null>(null);
  const [actionForm, setActionForm] = useState({ reason: '', notes: '' });
  const [actionState, setActionState] = useState<'idle' | 'loading' | 'success'>('idle');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    fetchRequests();
    fetchStats();
  }, [statusFilter, page]);

  useEffect(() => {
    if (refreshTrigger > 0) {
      fetchRequests();
      fetchStats();
    }
  }, [refreshTrigger]);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      onLoadingChange?.(true);
      await new Promise(resolve => setTimeout(resolve, 1000));
      const params = new URLSearchParams();
      if (statusFilter !== 'all') params.append('status', statusFilter);
      params.append('page', page.toString());
      params.append('limit', '10');

      const data = await adminService.getInstitutionRequests(statusFilter, page, 10);

      if (data.success) {
        setRequests(data.data.requests);
        setTotalPages(data.data.pagination.pages);
      }
    } catch (error) {
      console.error('Failed to fetch requests:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Failed to fetch institution requests'
      });
    } finally {
      setLoading(false);
      onLoadingChange?.(false);
    }
  };

  const fetchStats = async () => {
    try {
      const data = await adminService.getInstitutionRequestStats();

      if (data.success) {
        setStats(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    }
  };

  const handleViewDetails = async (request: InstitutionRequest) => {
    try {
      const data = await adminService.getInstitutionRequestDetails(request._id);

      if (data.success) {
        setSelectedRequest(data.data);
        setDetailsDialogOpen(true);
      }
    } catch (error) {
      console.error('Failed to fetch request details:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Failed to fetch request details'
      });
    }
  };

  const handleAction = (request: InstitutionRequest, action: 'approve' | 'reject' | 'clarify') => {
    setSelectedRequest(request);
    setActionType(action);
    setActionForm({ reason: '', notes: '' });
    setActionState('idle');
    setActionDialogOpen(true);
  };

  const executeAction = async () => {
    if (!selectedRequest || !actionType) return;
    setActionState('loading');

    try {
      let data;
      switch (actionType) {
        case 'approve':
          data = await adminService.approveInstitutionRequest(selectedRequest._id, actionForm.notes);
          break;
        case 'reject':
          data = await adminService.rejectInstitutionRequest(selectedRequest._id, actionForm.reason);
          break;
        case 'clarify':
          data = await adminService.requestClarification(selectedRequest._id, actionForm.reason);
          break;
      }

      if (data.success) {
        setActionState('success');

        // Hold success state briefly
        setTimeout(() => {
          Swal.fire({
            icon: 'success',
            title: 'Success',
            text: `Request ${actionType}d successfully`
          });

          setActionDialogOpen(false);
          setDetailsDialogOpen(false);
          setActionState('idle');
          fetchRequests();
          fetchStats();
        }, 800);
      } else {
        throw new Error(data.message || 'Action failed');
      }
    } catch (error: any) {
      console.error('Action failed:', error);
      setActionState('idle');
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: error.response?.data?.message || 'Failed to execute action'
      });
    }
  };

  const getStatusChip = (status: string) => (
    <Chip
      label={STATUS_LABELS[status as keyof typeof STATUS_LABELS]}
      size="small"
      sx={{
        backgroundColor: STATUS_COLORS[status as keyof typeof STATUS_COLORS],
        color: 'white',
        fontWeight: 500
      }}
    />
  );

  return (
    <Box>

      {/* Statistics Cards */}
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(4, 1fr)' }, gap: 2, mb: 3 }}>
        {[
          { label: 'Total Requests', value: stats.total, color: '#0F172A' },
          { label: 'Pending Verification', value: stats.byStatus.PENDING_VERIFICATION || 0, color: '#f59e0b' },
          { label: 'Pending Approval', value: stats.byStatus.PENDING_APPROVAL || 0, color: '#3b82f6' },
          { label: 'This Month', value: stats.thisMonth, color: '#5EEAD4' }
        ].map((s) => (
          <Paper key={s.label} sx={{ p: 2, textAlign: 'center' }}>
            {loading ? (
              <Skeleton variant="text" width="40%" height={40} sx={{ mx: 'auto' }} />
            ) : (
              <Typography variant="h4" sx={{ color: s.color, fontWeight: 600 }}>{s.value}</Typography>
            )}
            <Typography variant="body2" sx={{ color: '#64748b' }}>{s.label}</Typography>
          </Paper>
        ))}
      </Box>

      {/* Filters */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <FormControl size="small" sx={{ minWidth: 200 }}>
          <InputLabel>Status Filter</InputLabel>
          <Select
            value={statusFilter}
            label="Status Filter"
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
          >
            <MenuItem value="all">All Status</MenuItem>
            <MenuItem value="PENDING_VERIFICATION">Pending Verification</MenuItem>
            <MenuItem value="PENDING_APPROVAL">Pending Approval</MenuItem>
            <MenuItem value="APPROVED">Approved</MenuItem>
            <MenuItem value="REJECTED">Rejected</MenuItem>
            <MenuItem value="RETURNED_FOR_CLARIFICATION">Returned for Clarification</MenuItem>
          </Select>
        </FormControl>
      </Box>

      {/* Requests Table */}
      <Paper sx={{ overflow: 'hidden' }}>
        <TableContainer>
          <Table size="small">
            <TableHead sx={{ backgroundColor: '#F8FAFC' }}>
              <TableRow>
                <TableCell sx={{ fontWeight: 600, color: '#475569', py: 1.5 }}>Institution</TableCell>
                <TableCell sx={{ fontWeight: 600, color: '#475569', py: 1.5 }}>Domain</TableCell>
                <TableCell sx={{ fontWeight: 600, color: '#475569', py: 1.5 }}>Administrator</TableCell>
                <TableCell align="center" sx={{ fontWeight: 600, color: '#475569', py: 1.5 }}>Status</TableCell>
                <TableCell align="center" sx={{ fontWeight: 600, color: '#475569', py: 1.5 }}>Submitted</TableCell>
                <TableCell align="right" sx={{ fontWeight: 600, color: '#475569', py: 1.5 }}>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                [1, 2, 3, 4, 5].map((i) => (
                  <TableRow key={i}>
                    <TableCell><Skeleton variant="text" /></TableCell>
                    <TableCell><Skeleton variant="text" /></TableCell>
                    <TableCell><Skeleton variant="text" /></TableCell>
                    <TableCell align="center"><Skeleton variant="text" width="60%" sx={{ mx: 'auto' }} /></TableCell>
                    <TableCell align="center"><Skeleton variant="text" width="40%" sx={{ mx: 'auto' }} /></TableCell>
                    <TableCell align="right"><Skeleton variant="circular" width={32} height={32} sx={{ ml: 'auto' }} /></TableCell>
                  </TableRow>
                ))
              ) : requests.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} sx={{ textAlign: 'center', py: 4 }}>
                    <Typography color="textSecondary">No requests found</Typography>
                  </TableCell>
                </TableRow>
              ) : (
                requests.map((request) => (
                  <TableRow key={request._id} hover sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                    <TableCell sx={{ py: 1.5 }}>
                      <Box>
                        <Typography variant="body2" sx={{ fontWeight: 600, color: '#0F172A' }}>
                          {request.institutionName}
                        </Typography>
                        <Typography variant="caption" sx={{ color: '#64748B' }}>
                          {request.physicalAddress}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell sx={{ py: 1.5 }}>
                      <Typography variant="body2" sx={{ fontFamily: '"Google Sans", "Product Sans", Roboto, sans-serif', color: '#475569', fontSize: '0.8125rem' }}>
                        {request.academicDomain}
                      </Typography>
                    </TableCell>
                    <TableCell sx={{ py: 1.5 }}>
                      <Box>
                        <Typography variant="body2" sx={{ fontWeight: 500, color: '#1E293B' }}>
                          {request.administratorName}
                        </Typography>
                        <Typography variant="caption" sx={{ color: '#64748B' }}>
                          {request.administratorPosition}
                        </Typography>
                        <Typography variant="caption" sx={{ color: '#64748B', display: 'block' }}>
                          {request.administratorEmail}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell align="center" sx={{ py: 1.5 }}>
                      {getStatusChip(request.status)}
                    </TableCell>
                    <TableCell align="center" sx={{ py: 1.5 }}>
                      <Typography variant="body2" sx={{ color: '#475569', fontSize: '0.8125rem' }}>
                        {new Date(request.createdAt).toLocaleDateString()}
                      </Typography>
                      <Typography variant="caption" sx={{ color: '#94A3B8', display: 'block' }}>
                        {new Date(request.createdAt).toLocaleTimeString()}
                      </Typography>
                    </TableCell>
                    <TableCell align="right" sx={{ py: 1.5 }}>
                      <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
                        <Tooltip title="View Details">
                          <IconButton
                            size="small"
                            onClick={() => handleViewDetails(request)}
                            sx={{ color: '#64748B', '&:hover': { color: '#0F172A', bgcolor: '#F1F5F9' } }}
                          >
                            👁️
                          </IconButton>
                        </Tooltip>

                        {request.status === 'PENDING_APPROVAL' && (
                          <>
                            <Tooltip title="Approve">
                              <IconButton
                                size="small"
                                onClick={() => handleAction(request, 'approve')}
                                sx={{ color: '#10B981', '&:hover': { bgcolor: '#ECFDF5' } }}
                              >
                                ✅
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Reject">
                              <IconButton
                                size="small"
                                onClick={() => handleAction(request, 'reject')}
                                sx={{ color: '#EF4444', '&:hover': { bgcolor: '#FEF2F2' } }}
                              >
                                ❌
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Request Clarification">
                              <IconButton
                                size="small"
                                onClick={() => handleAction(request, 'clarify')}
                                sx={{ color: '#8B5CF6', '&:hover': { bgcolor: '#F5F3FF' } }}
                              >
                                ❓
                              </IconButton>
                            </Tooltip>
                          </>
                        )}
                      </Box>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>

        {totalPages > 1 && (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
            <Pagination
              count={totalPages}
              page={page}
              onChange={(_, newPage) => setPage(newPage)}
              color="primary"
            />
          </Box>
        )}
      </Paper>

      {/* Details Dialog */}
      <Dialog
        open={detailsDialogOpen}
        onClose={() => setDetailsDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Request Details</DialogTitle>
        <DialogContent>
          {selectedRequest && (
            <Box sx={{ display: 'grid', gap: 2 }}>
              <Typography variant="h6" sx={{ color: '#0F172A' }}>
                {selectedRequest.institutionName}
              </Typography>

              <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
                <Box>
                  <Typography variant="subtitle2" color="textSecondary">Academic Domain</Typography>
                  <Typography variant="body2">{selectedRequest.academicDomain}</Typography>
                </Box>
                <Box>
                  <Typography variant="subtitle2" color="textSecondary">Contact Number</Typography>
                  <Typography variant="body2">{selectedRequest.contactNumber}</Typography>
                </Box>
                <Box sx={{ gridColumn: '1 / -1' }}>
                  <Typography variant="subtitle2" color="textSecondary">Physical Address</Typography>
                  <Typography variant="body2">{selectedRequest.physicalAddress}</Typography>
                </Box>
              </Box>

              <Divider />

              <Typography variant="h6">Administrator Information</Typography>
              <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
                <Box>
                  <Typography variant="subtitle2" color="textSecondary">Name</Typography>
                  <Typography variant="body2">{selectedRequest.administratorName}</Typography>
                </Box>
                <Box>
                  <Typography variant="subtitle2" color="textSecondary">Position</Typography>
                  <Typography variant="body2">{selectedRequest.administratorPosition}</Typography>
                </Box>
                <Box sx={{ gridColumn: '1 / -1' }}>
                  <Typography variant="subtitle2" color="textSecondary">Email</Typography>
                  <Typography variant="body2">{selectedRequest.administratorEmail}</Typography>
                </Box>
              </Box>

              <Divider />

              <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
                <Box>
                  <Typography variant="subtitle2" color="textSecondary">Status</Typography>
                  {getStatusChip(selectedRequest.status)}
                </Box>
                <Box>
                  <Typography variant="subtitle2" color="textSecondary">Submitted</Typography>
                  <Typography variant="body2">
                    {new Date(selectedRequest.createdAt).toLocaleString()}
                  </Typography>
                </Box>
                {selectedRequest.verifiedAt && (
                  <Box>
                    <Typography variant="subtitle2" color="textSecondary">Verified</Typography>
                    <Typography variant="body2">
                      {new Date(selectedRequest.verifiedAt).toLocaleString()}
                    </Typography>
                  </Box>
                )}
                {selectedRequest.reviewedAt && (
                  <Box>
                    <Typography variant="subtitle2" color="textSecondary">Reviewed</Typography>
                    <Typography variant="body2">
                      {new Date(selectedRequest.reviewedAt).toLocaleString()}
                    </Typography>
                  </Box>
                )}
              </Box>

              {selectedRequest.rejectionReason && (
                <>
                  <Divider />
                  <Box>
                    <Typography variant="subtitle2" color="textSecondary">Rejection Reason</Typography>
                    <Typography variant="body2">{selectedRequest.rejectionReason}</Typography>
                  </Box>
                </>
              )}

              {selectedRequest.clarificationRequest && (
                <>
                  <Divider />
                  <Box>
                    <Typography variant="subtitle2" color="textSecondary">Clarification Request</Typography>
                    <Typography variant="body2">{selectedRequest.clarificationRequest}</Typography>
                  </Box>
                </>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDetailsDialogOpen(false)}>Close</Button>
          {selectedRequest?.status === 'PENDING_APPROVAL' && (
            <>
              <Button
                variant="outlined"
                onClick={() => {
                  setDetailsDialogOpen(false);
                  handleAction(selectedRequest, 'clarify');
                }}
                sx={{
                  fontFamily: '"Google Sans", "Product Sans", Roboto, sans-serif',
                  fontWeight: 600,
                  textTransform: 'none',
                  borderRadius: '999px',
                  borderColor: '#E2E8F0',
                  color: '#64748B',
                  '&:hover': { backgroundColor: '#F8FAFC', borderColor: '#CBD5E1' }
                }}
              >
                Request Clarification
              </Button>
              <Button
                variant="outlined"
                onClick={() => {
                  setDetailsDialogOpen(false);
                  handleAction(selectedRequest, 'reject');
                }}
                sx={{
                  fontFamily: '"Google Sans", "Product Sans", Roboto, sans-serif',
                  fontWeight: 600,
                  textTransform: 'none',
                  borderRadius: '999px',
                  border: '1.5px solid #EF4444',
                  color: '#EF4444',
                  backgroundColor: 'transparent',
                  '&:hover': { backgroundColor: '#FEF2F2', borderColor: '#DC2626' }
                }}
              >
                Reject
              </Button>
              <Button
                onClick={() => {
                  setDetailsDialogOpen(false);
                  handleAction(selectedRequest, 'approve');
                }}
                sx={{
                  fontFamily: '"Google Sans", "Product Sans", Roboto, sans-serif',
                  fontWeight: 600,
                  textTransform: 'none',
                  borderRadius: '999px',
                  backgroundColor: '#0a0a0a',
                  color: '#FFFFFF',
                  px: 3,
                  '&:hover': { backgroundColor: '#222' }
                }}
              >
                Approve
              </Button>
            </>
          )}
        </DialogActions>
      </Dialog>

      {/* Action Dialog */}
      <Dialog
        open={actionDialogOpen}
        onClose={() => setActionDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          {actionType === 'approve' && 'Approve Request'}
          {actionType === 'reject' && 'Reject Request'}
          {actionType === 'clarify' && 'Request Clarification'}
        </DialogTitle>
        <DialogContent>
          {actionType === 'approve' && (
            <Box>
              <Typography variant="body2" sx={{ mb: 2 }}>
                Approve this institution request? This will create a new institution record and enable user registration.
              </Typography>
              <TextField
                fullWidth
                label="Notes (optional)"
                multiline
                rows={3}
                value={actionForm.notes}
                onChange={(e) => setActionForm(prev => ({ ...prev, notes: e.target.value }))}
              />
            </Box>
          )}

          {actionType === 'reject' && (
            <Box>
              <Typography variant="body2" sx={{ mb: 2 }}>
                Please provide a reason for rejecting this request:
              </Typography>
              <TextField
                fullWidth
                label="Rejection Reason"
                multiline
                rows={3}
                required
                value={actionForm.reason}
                onChange={(e) => setActionForm(prev => ({ ...prev, reason: e.target.value }))}
              />
            </Box>
          )}

          {actionType === 'clarify' && (
            <Box>
              <Typography variant="body2" sx={{ mb: 2 }}>
                What information do you need from the institution?
              </Typography>
              <TextField
                fullWidth
                label="Clarification Request"
                multiline
                rows={3}
                required
                value={actionForm.reason}
                onChange={(e) => setActionForm(prev => ({ ...prev, reason: e.target.value }))}
              />
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => setActionDialogOpen(false)}
            disabled={actionState !== 'idle'}
            sx={{
              fontFamily: '"Google Sans", "Product Sans", Roboto, sans-serif',
              fontWeight: 600,
              textTransform: 'none',
              borderRadius: '999px',
              color: '#64748B'
            }}
          >
            Cancel
          </Button>
          <Button
            onClick={executeAction}
            disabled={(actionType !== 'approve' && !actionForm.reason.trim()) || actionState !== 'idle'}
            sx={{
              fontFamily: '"Google Sans", "Product Sans", Roboto, sans-serif',
              fontWeight: 600,
              textTransform: 'none',
              borderRadius: '999px',
              px: 3,
              transition: 'all 0.2s ease',
              display: 'flex', gap: 1, alignItems: 'center',
              ...(actionType === 'approve' ? {
                backgroundColor: actionState === 'success' ? '#5EEAD4' : '#0a0a0a',
                color: '#FFFFFF',
                '&:hover': { backgroundColor: actionState === 'success' ? '#5EEAD4' : '#222' }
              } : actionType === 'reject' ? {
                ...(actionState === 'success' ? {
                  backgroundColor: '#EF4444',
                  color: '#FFFFFF',
                  border: '1.5px solid #EF4444'
                } : {
                  border: '1.5px solid #EF4444',
                  color: '#EF4444',
                  backgroundColor: 'transparent',
                  '&:hover': { backgroundColor: '#FEF2F2', borderColor: '#DC2626' }
                })
              } : {
                backgroundColor: actionState === 'success' ? '#5EEAD4' : '#0a0a0a',
                color: '#FFFFFF',
                '&:hover': { backgroundColor: actionState === 'success' ? '#5EEAD4' : '#222' }
              }),
              '&.Mui-disabled': {
                backgroundColor: actionState === 'success' ? (actionType === 'reject' ? '#EF4444' : '#5EEAD4') : (actionType === 'approve' || actionType === 'clarify' ? '#E2E8F0' : 'transparent'),
                color: actionState === 'success' ? '#FFFFFF' : '#94A3B8',
                border: actionState === 'success' ? 'none' : (actionType === 'reject' ? '1.5px solid #E2E8F0' : 'none')
              }
            }}
          >
            {actionState === 'loading' && <CircularProgress size={16} color="inherit" />}
            {actionState === 'success' && <CheckIcon fontSize="small" />}
            {actionState === 'idle' ? (
              actionType === 'approve' ? 'Approve' : actionType === 'reject' ? 'Reject' : 'Request Clarification'
            ) : actionState === 'loading' ? (
              actionType === 'approve' ? 'Approving...' : actionType === 'reject' ? 'Rejecting...' : 'Requesting...'
            ) : (
              actionType === 'approve' ? 'Approved!' : actionType === 'reject' ? 'Rejected' : 'Requested!'
            )}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
