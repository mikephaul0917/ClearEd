/**
 * Super Admin page for managing institution access requests
 * Displays pending requests and provides approve/reject actions
 * Modern Bento Theme
 */

import { useEffect, useState, useMemo } from "react";
import { superAdminService } from "../../services";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Chip from "@mui/material/Chip";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import Paper from "@mui/material/Paper";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import TextField from "@mui/material/TextField";
import Alert from "@mui/material/Alert";
import Snackbar from "@mui/material/Snackbar";
import { 
  useTheme, useMediaQuery, Skeleton, CircularProgress, Grid, 
  InputAdornment, Menu, MenuItem, Divider, ListItemText, ListItemIcon, 
  IconButton, Tooltip 
} from "@mui/material";
import Swal from "sweetalert2";
import "sweetalert2/dist/sweetalert2.min.css";
import CheckIcon from '@mui/icons-material/Check';
import SearchIcon from '@mui/icons-material/Search';
import FilterListIcon from '@mui/icons-material/FilterList';
import PeopleAltIcon from '@mui/icons-material/PeopleAlt';
import RefreshIcon from '@mui/icons-material/Refresh';
import SortIcon from '@mui/icons-material/Sort';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import AbcIcon from '@mui/icons-material/Abc';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import HourglassEmptyIcon from '@mui/icons-material/HourglassEmpty';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';

// ─── Modern Bento Design System ──────────────────────────────────────────────
const COLORS = {
  pageBg: '#F9FAFB',
  surface: '#FFFFFF',
  black: '#0a0a0a',
  textPrimary: '#000000',
  textSecondary: '#64748B',
  teal: '#5fcca0',
  lavender: '#cb9bfb',
  yellow: '#FEF08A',
  orange: '#ff895d',
  border: '#E2E8F0',
  cardRadius: '16px',
  pillRadius: '999px',
};

const fontStack = "'Inter', 'Plus Jakarta Sans', 'Montserrat', sans-serif";

interface InstitutionRequest {
  _id: string;
  institutionName: string;
  academicDomain: string;
  physicalAddress: string;
  contactNumber: string;
  administratorName: string;
  administratorPosition: string;
  administratorEmail: string;
  status: string;
  createdAt: string;
  reviewedAt?: string;
  reviewedBy?: string;
  rejectionReason?: string;
  notes?: string;
}

export default function SuperAdminInstitutionRequests() {
  const theme = useTheme();
  const isSmallMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const [requests, setRequests] = useState<InstitutionRequest[]>([]);
  const [approvedInstitutions, setApprovedInstitutions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'pending' | 'approved'>('pending');
  const [approveDialogOpen, setApproveDialogOpen] = useState(false);
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<InstitutionRequest | null>(null);
  const [notes, setNotes] = useState("");
  const [rejectionReason, setRejectionReason] = useState("");
  const [actionState, setActionState] = useState<'idle' | 'loading' | 'success'>('idle');
  const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "success" as "success" | "error" });
  const [searchQuery, setSearchQuery] = useState("");
  const [sortAnchorEl, setSortAnchorEl] = useState<null | HTMLElement>(null);
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [sortConfig, setSortConfig] = useState<{ key: string, direction: 'asc' | 'desc' } | null>(null);
  const [page, setPage] = useState(1);
  const rowsPerPage = 10;

  // ─── Filter & Sort Logic ──────────────────────────────────────────────
  const displayedData = useMemo(() => {
    let result = activeTab === 'pending' ? [...requests] : [...approvedInstitutions];

    // 1. Search Query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(r => 
        r.institutionName.toLowerCase().includes(q) ||
        r.academicDomain.toLowerCase().includes(q) ||
        r.administratorName.toLowerCase().includes(q)
      );
    }

    // 2. Status Filter (Only for Pending tab)
    if (activeTab === 'pending' && statusFilter !== 'ALL') {
      result = result.filter(r => r.status === statusFilter);
    }

    // 3. Sorting
    if (sortConfig) {
      result.sort((a, b) => {
        let aVal = a[sortConfig.key as keyof typeof a] || '';
        let bVal = b[sortConfig.key as keyof typeof b] || '';

        if (sortConfig.key === 'createdAt') {
          return sortConfig.direction === 'asc' 
            ? new Date(aVal as string).getTime() - new Date(bVal as string).getTime()
            : new Date(bVal as string).getTime() - new Date(aVal as string).getTime();
        }

        if (typeof aVal === 'string' && typeof bVal === 'string') {
          return sortConfig.direction === 'asc' 
            ? aVal.localeCompare(bVal)
            : bVal.localeCompare(aVal);
        }
        return 0;
      });
    }

    return result;
  }, [requests, approvedInstitutions, activeTab, searchQuery, statusFilter, sortConfig]);

  const paginatedData = useMemo(() => {
    return displayedData.slice((page - 1) * rowsPerPage, page * rowsPerPage);
  }, [displayedData, page]);

  const totalPages = Math.ceil(displayedData.length / rowsPerPage);

  // Reset to first page when filtering
  useEffect(() => {
    setPage(1);
  }, [searchQuery, statusFilter, activeTab, sortConfig]);

  const clearFilters = () => {
    setSearchQuery("");
    setStatusFilter("ALL");
    setSortConfig(null);
  };

  const handleSortClick = (event: React.MouseEvent<HTMLElement>) => {
    setSortAnchorEl(event.currentTarget);
  };

  const handleSortClose = () => {
    setSortAnchorEl(null);
  };

  useEffect(() => {
    // Simulate initial loading delay for better UX
    setTimeout(() => {
      fetchData();
    }, 1000);
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [pendingRes, approvedRes] = await Promise.all([
        superAdminService.getPendingInstitutionRequests(),
        superAdminService.getInstitutions()
      ]);
      
      setRequests(Array.isArray(pendingRes) ? pendingRes : (pendingRes?.requests || []));
      setApprovedInstitutions(((approvedRes.institutions || []) as any[]).map(inst => ({
        _id: inst._id,
        institutionName: inst.name,
        academicDomain: inst.domain,
        physicalAddress: inst.address,
        contactNumber: inst.contactNumber,
        administratorName: inst.administratorName,
        administratorPosition: inst.administratorPosition,
        administratorEmail: inst.email,
        status: (inst.status || "approved").toUpperCase(),
        createdAt: inst.createdAt
      })));
      setError(null);
    } catch (err: any) {
      console.error("Error fetching data:", err);
      setError(err.response?.data?.message || "Failed to fetch data");
      if (err.response?.status === 403) {
        setError("Access denied. Super Admin privileges required. If you believe this is an error, please contact support.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async () => {
    if (!selectedRequest) return;
    setActionState('loading');

    try {
      await superAdminService.approveInstitutionRequest(selectedRequest._id, {
        notes: notes.trim() || undefined
      });

      setActionState('success');

      // Hold success state briefly before closing
      setTimeout(() => {
        setSnackbar({
          open: true,
          message: `Approved ${selectedRequest.institutionName} successfully`,
          severity: "success"
        });

        setApproveDialogOpen(false);
        setNotes("");
        setSelectedRequest(null);
        setActionState('idle');
        fetchData();
      }, 800);

    } catch (err: any) {
      console.error("Error approving request:", err);
      setActionState('idle');
      setSnackbar({
        open: true,
        message: err.response?.data?.message || "Failed to approve request",
        severity: "error"
      });
    }
  };

  const handleReject = async () => {
    if (!selectedRequest || !rejectionReason.trim()) return;
    setActionState('loading');

    try {
      await superAdminService.rejectInstitutionRequest(selectedRequest._id, {
        rejectionReason: rejectionReason.trim()
      });

      setActionState('success');

      setTimeout(() => {
        setSnackbar({
          open: true,
          message: `Rejected ${selectedRequest.institutionName} successfully`,
          severity: "success"
        });

        setRejectDialogOpen(false);
        setRejectionReason("");
        setSelectedRequest(null);
        setActionState('idle');
        fetchData();
      }, 800);

    } catch (err: any) {
      console.error("Error rejecting request:", err);
      setActionState('idle');
      setSnackbar({
        open: true,
        message: err.response?.data?.message || "Failed to reject request",
        severity: "error"
      });
    }
  };

  const openApproveDialog = (request: InstitutionRequest) => {
    setSelectedRequest(request);
    setNotes("");
    setActionState('idle');
    setApproveDialogOpen(true);
  };

  const openRejectDialog = (request: InstitutionRequest) => {
    setSelectedRequest(request);
    setRejectionReason("");
    setActionState('idle');
    setRejectDialogOpen(true);
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'PENDING_VERIFICATION':
        return 'Pending Email Verification';
      case 'PENDING_APPROVAL':
        return 'Pending Approval';
      case 'APPROVED':
        return 'Approved';
      case 'REJECTED':
        return 'Rejected';
      case 'RETURNED_FOR_CLARIFICATION':
        return 'Returned for Clarification';
      default:
        return status;
    }
  };

  const getStatusChipSx = (status: string) => {
    switch (status) {
      case 'PENDING_APPROVAL':
        return { backgroundColor: `${COLORS.yellow}80`, color: COLORS.black };
      case 'APPROVED':
        return { backgroundColor: `${COLORS.teal}30`, color: '#065f46' };
      case 'REJECTED':
        return { backgroundColor: `${COLORS.orange}25`, color: '#9a3412' };
      case 'PENDING_VERIFICATION':
        return { backgroundColor: COLORS.yellow, color: '#854d0e' };
      default:
        return { backgroundColor: '#F1F5F9', color: '#475569' };
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  // ── Skeleton Loader ──────────────────────────────────────────────────────
  if (loading) {
    return (
      <Box sx={{
        p: isSmallMobile ? 2 : 4,
        backgroundColor: COLORS.pageBg,
        minHeight: '100vh',
        fontFamily: fontStack,
      }}>
        {/* Header skeleton */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: isMobile ? 'flex-start' : 'center', mb: 3, flexDirection: isMobile ? 'column' : 'row', gap: isMobile ? 2 : 0 }}>
          <Box>
            <Skeleton variant="rounded" width={isMobile ? 180 : 320} height={isMobile ? 32 : 48} sx={{ mb: 1, borderRadius: '8px' }} />
            <Skeleton variant="rounded" width={isMobile ? 220 : 380} height={20} sx={{ borderRadius: '8px' }} />
          </Box>
        </Box>

        {/* Stats row skeleton */}
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: 'repeat(2, 1fr)', md: 'repeat(3, 1fr)' }, gap: 2, mb: 3 }}>
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} variant="rounded" height={isSmallMobile ? 85 : 105} sx={{ borderRadius: COLORS.cardRadius }} />
          ))}
        </Box>

        {/* Table/Card skeleton */}
        <Box sx={{ borderRadius: COLORS.cardRadius, p: isMobile ? 2 : 3, backgroundColor: 'rgba(0,0,0,0.02)', border: `1px solid ${COLORS.border}` }}>
          {!isMobile ? (
            <TableContainer component={Paper} sx={{ borderRadius: '12px', border: `1px solid ${COLORS.border}`, boxShadow: 'none' }}>
              <Table size="small">
                <TableHead>
                  <TableRow sx={{ backgroundColor: '#F8FAFC' }}>
                    {[...Array(7)].map((_, i) => (
                      <TableCell key={i}><Skeleton variant="text" width="100%" height={24} /></TableCell>
                    ))}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {[...Array(5)].map((_, i) => (
                    <TableRow key={i}>
                      <TableCell><Skeleton variant="text" width="80%" height={20} /></TableCell>
                      <TableCell><Skeleton variant="text" width={100} /></TableCell>
                      <TableCell><Skeleton variant="text" width={140} /></TableCell>
                      <TableCell><Skeleton variant="text" width={100} /></TableCell>
                      <TableCell align="center"><Skeleton variant="text" width={60} sx={{ mx: 'auto' }} /></TableCell>
                      <TableCell align="center"><Skeleton variant="rectangular" width={60} height={20} sx={{ borderRadius: '8px', mx: 'auto' }} /></TableCell>
                      <TableCell align="right">
                        <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
                          <Skeleton variant="rectangular" width={80} height={32} sx={{ borderRadius: '8px' }} />
                          <Skeleton variant="rectangular" width={80} height={32} sx={{ borderRadius: '8px' }} />
                        </Box>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          ) : (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {[...Array(3)].map((_, i) => (
                <Box key={i} sx={{ p: 2, borderRadius: '12px', border: `1px solid ${COLORS.border}`, backgroundColor: 'rgba(255,255,255,0.4)' }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                    <Box sx={{ flex: 1 }}><Skeleton variant="text" width="70%" height={24} /><Skeleton variant="text" width="40%" /></Box>
                    <Skeleton variant="rectangular" width={60} height={24} sx={{ borderRadius: 10 }} />
                  </Box>
                  <Grid container spacing={1} sx={{ mb: 2 }}>
                    <Grid item xs={6}><Skeleton variant="rectangular" height={50} sx={{ borderRadius: '10px' }} /></Grid>
                    <Grid item xs={6}><Skeleton variant="rectangular" height={50} sx={{ borderRadius: '10px' }} /></Grid>
                  </Grid>
                  <Box sx={{ display: 'flex', gap: 1 }}><Skeleton variant="rectangular" width="100%" height={40} sx={{ borderRadius: '10px' }} /><Skeleton variant="rectangular" width="100%" height={40} sx={{ borderRadius: '10px' }} /></Box>
                </Box>
              ))}
            </Box>
          )}
        </Box>
      </Box>
    );
  }

  // ── Error State ──────────────────────────────────────────────────────────
  if (error) {
    return (
      <Box sx={{
        p: isSmallMobile ? 2 : 4,
        backgroundColor: COLORS.pageBg,
        minHeight: '100vh',
        fontFamily: fontStack,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
      }}>
        <Box sx={{
          maxWidth: 480,
          textAlign: 'center',
          p: 4,
          borderRadius: COLORS.cardRadius,
          border: `1px solid ${COLORS.border}`,
          backgroundColor: 'rgba(255,255,255,0.65)',
          backdropFilter: 'blur(12px)',
        }}>
          {/* Error icon */}
          <Box sx={{
            width: 56, height: 56, borderRadius: '50%',
            backgroundColor: `${COLORS.orange}20`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            mx: 'auto', mb: 2,
          }}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke={COLORS.orange} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
          </Box>
          <Typography sx={{ fontFamily: fontStack, fontWeight: 700, fontSize: 18, color: COLORS.textPrimary, mb: 1 }}>
            Something went wrong
          </Typography>
          <Typography sx={{ fontFamily: fontStack, fontSize: 14, color: COLORS.textSecondary, mb: 3, lineHeight: 1.6 }}>
            {error}
          </Typography>
          <Box display="flex" gap={1.5} justifyContent="center" flexWrap="wrap">
            <Button
              onClick={fetchData}
              sx={{
                fontFamily: fontStack, fontWeight: 600, fontSize: 14,
                textTransform: 'none', borderRadius: COLORS.pillRadius,
                px: 3, py: 1.2,
                backgroundColor: COLORS.black, color: '#FFFFFF',
                '&:hover': { backgroundColor: '#222' },
              }}
            >
              Try Again
            </Button>
            <Button
              onClick={() => window.location.href = '/super-admin'}
              sx={{
                fontFamily: fontStack, fontWeight: 600, fontSize: 14,
                textTransform: 'none', borderRadius: COLORS.pillRadius,
                px: 3, py: 1.2,
                border: `1.5px solid ${COLORS.black}`, color: COLORS.black,
                backgroundColor: 'transparent',
                '&:hover': { backgroundColor: '#f5f5f5' },
              }}
            >
              Back to Dashboard
            </Button>
          </Box>
        </Box>
      </Box>
    );
  }

  // ── Main Content ─────────────────────────────────────────────────────────
  return (
    <Box sx={{
      px: isSmallMobile ? 2 : 4,
      pb: isSmallMobile ? 2 : 4,
      pt: 0,
      backgroundColor: COLORS.pageBg,
      minHeight: '100vh',
      fontFamily: fontStack,
    }}>
      {/* ── Toggle Switch ─────────────────────────────────────────── */}
      <Box sx={{ 
        display: 'inline-flex', 
        bgcolor: '#FFFFFF', 
        p: 0.5, 
        borderRadius: COLORS.pillRadius,
        border: '1px solid rgba(0,0,0,0.08)',
        mb: 4,
        boxShadow: '0 2px 10px rgba(0,0,0,0.03)'
      }}>
        <Button
          onClick={() => setActiveTab('pending')}
          sx={{
            px: 3,
            py: 1,
            borderRadius: COLORS.pillRadius,
            textTransform: 'none',
            fontWeight: 700,
            fontSize: '14px',
            color: activeTab === 'pending' ? '#FFFFFF' : '#64748B',
            bgcolor: activeTab === 'pending' ? '#1E1E1E' : 'transparent',
            '&:hover': {
              bgcolor: activeTab === 'pending' ? '#1E1E1E' : 'rgba(0,0,0,0.04)',
            },
            transition: 'all 0.2s',
          }}
        >
          Pending
        </Button>
        <Button
          onClick={() => setActiveTab('approved')}
          sx={{
            px: 3,
            py: 1,
            borderRadius: COLORS.pillRadius,
            textTransform: 'none',
            fontWeight: 700,
            fontSize: '14px',
            color: activeTab === 'approved' ? '#FFFFFF' : '#64748B',
            bgcolor: activeTab === 'approved' ? '#1E1E1E' : 'transparent',
            '&:hover': {
              bgcolor: activeTab === 'approved' ? '#1E1E1E' : 'rgba(0,0,0,0.04)',
            },
            transition: 'all 0.2s',
          }}
        >
          Approved
        </Button>
      </Box>

      {/* ── Stats Row ──────────────────────────────────────────────── */}
      <Box sx={{
        display: 'grid',
        gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(3, 1fr)' },
        gap: 2.5,
        mb: 4,
      }}>
        {/* Total Pending */}
        <Box sx={{
          backgroundColor: '#FFFFFF',
          borderRadius: COLORS.cardRadius,
          p: 3,
          border: '1px solid rgba(0,0,0,0.06)',
          boxShadow: '0 4px 20px rgba(0,0,0,0.02)',
          display: 'flex',
          flexDirection: 'column',
          gap: 2,
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <Box sx={{
                width: 40, height: 40, borderRadius: '12px',
                backgroundColor: '#F1F5F9',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: COLORS.black
              }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                  <polyline points="14 2 14 8 20 8" />
                  <line x1="16" y1="13" x2="8" y2="13" />
                  <line x1="16" y1="17" x2="8" y2="17" />
                  <polyline points="10 9 9 9 8 9" />
                </svg>
              </Box>
              <Typography sx={{ fontFamily: fontStack, fontWeight: 700, fontSize: 15, color: COLORS.textPrimary }}>
                Total Pending
              </Typography>
            </Box>
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 1 }}>
            <Typography sx={{
              fontFamily: fontStack, fontWeight: 800,
              fontSize: isSmallMobile ? 28 : 34, color: COLORS.textPrimary,
              letterSpacing: '-1px',
            }}>
              {requests.length}
            </Typography>
            <Typography sx={{ fontSize: 12, fontWeight: 700, color: COLORS.textPrimary, display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="18 15 12 9 6 15" />
              </svg>
              Real-time
            </Typography>
          </Box>

          <Typography sx={{ fontFamily: fontStack, fontSize: 13, color: COLORS.textSecondary, lineHeight: 1.5 }}>
            Applications submitted but not yet reviewed.
          </Typography>
        </Box>

        {/* Ready to Review */}
        <Box sx={{
          backgroundColor: '#FFFFFF',
          borderRadius: COLORS.cardRadius,
          p: 3,
          border: '1px solid rgba(0,0,0,0.06)',
          boxShadow: '0 4px 20px rgba(0,0,0,0.02)',
          display: 'flex',
          flexDirection: 'column',
          gap: 2,
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <Box sx={{
                width: 40, height: 40, borderRadius: '12px',
                backgroundColor: '#F1F5F9',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: COLORS.black
              }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
                  <rect x="8" y="2" width="8" height="4" rx="1" ry="1" />
                  <path d="M9 14l2 2 4-4" />
                </svg>
              </Box>
              <Typography sx={{ fontFamily: fontStack, fontWeight: 700, fontSize: 15, color: COLORS.textPrimary }}>
                Ready to Review
              </Typography>
            </Box>
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 1 }}>
            <Typography sx={{
              fontFamily: fontStack, fontWeight: 800,
              fontSize: isSmallMobile ? 28 : 34, color: COLORS.textPrimary,
              letterSpacing: '-1px',
            }}>
              {requests.filter(r => r.status === 'PENDING_APPROVAL').length}
            </Typography>
            <Typography sx={{ fontSize: 12, fontWeight: 700, color: COLORS.textPrimary, display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="18 15 12 9 6 15" />
              </svg>
              Active
            </Typography>
          </Box>

          <Typography sx={{ fontFamily: fontStack, fontSize: 13, color: COLORS.textSecondary, lineHeight: 1.5 }}>
            Verified applications waiting for approval.
          </Typography>
        </Box>

        {/* Awaiting Verification */}
        <Box sx={{
          backgroundColor: '#FFFFFF',
          borderRadius: COLORS.cardRadius,
          p: 3,
          border: '1px solid rgba(0,0,0,0.06)',
          boxShadow: '0 4px 20px rgba(0,0,0,0.02)',
          display: 'flex',
          flexDirection: 'column',
          gap: 2,
          gridColumn: { xs: 'auto', sm: 'span 2', md: 'auto' }
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <Box sx={{
                width: 40, height: 40, borderRadius: '12px',
                backgroundColor: '#F1F5F9',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: COLORS.black
              }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                  <polyline points="22,6 12,13 2,6" />
                </svg>
              </Box>
              <Typography sx={{ fontFamily: fontStack, fontWeight: 700, fontSize: 15, color: COLORS.textPrimary }}>
                Awaiting Verification
              </Typography>
            </Box>
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 1 }}>
            <Typography sx={{
              fontFamily: fontStack, fontWeight: 800,
              fontSize: isSmallMobile ? 28 : 34, color: COLORS.textPrimary,
              letterSpacing: '-1px',
            }}>
              {requests.filter(r => r.status === 'PENDING_VERIFICATION').length}
            </Typography>
            <Typography sx={{ fontSize: 12, fontWeight: 700, color: COLORS.textPrimary, display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              Action Required
            </Typography>
          </Box>

          <Typography sx={{ fontFamily: fontStack, fontSize: 13, color: COLORS.textSecondary, lineHeight: 1.5 }}>
             Institutions that need to confirm their email access.
          </Typography>
        </Box>
      </Box>

      {/* ── Toolbar (Institution, Search, Filter) ────────────────────────── */}
      <Box sx={{
        display: 'flex',
        flexDirection: isMobile ? 'column' : 'row',
        justifyContent: 'space-between',
        alignItems: isMobile ? 'flex-start' : 'center',
        gap: 2,
        mb: 3,
        px: 0.5,
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <PeopleAltIcon sx={{ color: COLORS.textSecondary, fontSize: 20 }} />
          <Typography sx={{ 
            fontFamily: fontStack, 
            fontWeight: 800, 
            fontSize: 16, 
            color: COLORS.textPrimary,
          }}>
            Institution
          </Typography>
        </Box>

        <Box sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: 1, 
          width: isMobile ? '100%' : 'auto' 
        }}>
          <TextField
            variant="outlined"
            size="small"
            placeholder="Search institutions..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon sx={{ color: COLORS.textSecondary, fontSize: 18 }} />
                </InputAdornment>
              ),
              sx: {
                borderRadius: '8px',
                bgcolor: '#FFFFFF',
                fontSize: 13,
                height: 36,
              }
            }}
            sx={{
              '& .MuiOutlinedInput-root': {
                '& fieldset': { borderColor: 'rgba(0,0,0,0.08)' },
                '&:hover fieldset': { borderColor: 'rgba(0,0,0,0.12)' },
                '&.Mui-focused fieldset': { borderColor: COLORS.black, borderWidth: '1px' },
              },
              width: isMobile ? '100%' : 240
            }}
          />
          <Button
            variant="outlined"
            endIcon={<FilterListIcon />}
            onClick={handleSortClick}
            sx={{
              textTransform: 'none',
              borderRadius: '10px',
              borderColor: (statusFilter !== 'ALL' || sortConfig) ? COLORS.black : 'rgba(0,0,0,0.08)',
              color: COLORS.textPrimary,
              fontWeight: 700,
              fontSize: 13,
              px: 2,
              height: 36,
              whiteSpace: 'nowrap',
              backgroundColor: (statusFilter !== 'ALL' || sortConfig) ? '#F1F5F9' : '#FFFFFF',
              boxShadow: '0 2px 4px rgba(0,0,0,0.02)',
              '&:hover': {
                borderColor: 'rgba(0,0,0,0.15)',
                backgroundColor: '#F8FAFC',
                boxShadow: '0 4px 6px rgba(0,0,0,0.04)',
              },
              transition: 'all 0.2s ease'
            }}
          >
            Sort & Filter
          </Button>

          {(searchQuery || statusFilter !== 'ALL' || sortConfig) && (
            <Tooltip title="Clear all filters">
              <IconButton 
                onClick={clearFilters}
                size="small"
                sx={{ 
                  bgcolor: '#FEE2E2', 
                  color: '#EF4444',
                  '&:hover': { bgcolor: '#FECACA' }
                }}
              >
                <RefreshIcon sx={{ fontSize: 18 }} />
              </IconButton>
            </Tooltip>
          )}
        </Box>
      </Box>

      {/* ── Filter Menu ──────────────────────────────────────────── */}
      <Menu
        anchorEl={sortAnchorEl}
        open={Boolean(sortAnchorEl)}
        onClose={handleSortClose}
        PaperProps={{
          sx: {
            borderRadius: '12px',
            mt: 1,
            boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1), 0 8px 10px -6px rgba(0,0,0,0.1)',
            minWidth: 200,
          }
        }}
      >
        <Typography sx={{ px: 2, py: 1, fontSize: 11, fontWeight: 700, color: COLORS.textSecondary, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          Sort By
        </Typography>
        <MenuItem onClick={() => { setSortConfig({ key: 'createdAt', direction: 'desc' }); handleSortClose(); }}>
          <ListItemIcon><CalendarTodayIcon fontSize="small" /></ListItemIcon>
          <ListItemText primary="Newest First" primaryTypographyProps={{ fontSize: 14 }} />
        </MenuItem>
        <MenuItem onClick={() => { setSortConfig({ key: 'createdAt', direction: 'asc' }); handleSortClose(); }}>
          <ListItemIcon><CalendarTodayIcon fontSize="small" /></ListItemIcon>
          <ListItemText primary="Oldest First" primaryTypographyProps={{ fontSize: 14 }} />
        </MenuItem>
        <MenuItem onClick={() => { setSortConfig({ key: 'institutionName', direction: 'asc' }); handleSortClose(); }}>
          <ListItemIcon><AbcIcon fontSize="small" /></ListItemIcon>
          <ListItemText primary="Institution Name (A-Z)" primaryTypographyProps={{ fontSize: 14 }} />
        </MenuItem>

        {activeTab === 'pending' && (
          <>
            <Divider sx={{ my: 1 }} />
            <Typography sx={{ px: 2, py: 1, fontSize: 11, fontWeight: 700, color: COLORS.textSecondary, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Filter Status
            </Typography>
            <MenuItem onClick={() => { setStatusFilter('ALL'); handleSortClose(); }} selected={statusFilter === 'ALL'}>
              <ListItemIcon><FilterListIcon fontSize="small" /></ListItemIcon>
              <ListItemText primary="Show All" primaryTypographyProps={{ fontSize: 14 }} />
            </MenuItem>
            <MenuItem onClick={() => { setStatusFilter('PENDING_VERIFICATION'); handleSortClose(); }} selected={statusFilter === 'PENDING_VERIFICATION'}>
              <ListItemIcon><HourglassEmptyIcon fontSize="small" /></ListItemIcon>
              <ListItemText primary="Pending Verification" primaryTypographyProps={{ fontSize: 14 }} />
            </MenuItem>
            <MenuItem onClick={() => { setStatusFilter('PENDING_APPROVAL'); handleSortClose(); }} selected={statusFilter === 'PENDING_APPROVAL'}>
              <ListItemIcon><CheckCircleOutlineIcon fontSize="small" /></ListItemIcon>
              <ListItemText primary="Ready for Review" primaryTypographyProps={{ fontSize: 14 }} />
            </MenuItem>
          </>
        )}
      </Menu>

      {/* ── Empty State ──────────────────────────────────────────── */}
      {displayedData.length === 0 ? (
        <Box sx={{
          borderRadius: COLORS.cardRadius,
          border: `2px dashed ${COLORS.border}`,
          backgroundColor: 'rgba(255,255,255,0.65)',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
          textAlign: 'center',
          py: isSmallMobile ? 6 : 8,
          px: 3,
        }}>
          {/* Empty icon */}
          <Box sx={{
            width: 56, height: 56, borderRadius: '50%',
            backgroundColor: `${COLORS.teal}20`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            mx: 'auto', mb: 2,
          }}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke={COLORS.black} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
              <polyline points="22 4 12 14.01 9 11.01" />
            </svg>
          </Box>
          <Typography sx={{
            fontFamily: fontStack, fontWeight: 700,
            fontSize: 18, color: COLORS.textPrimary, mb: 0.5,
          }}>
            {activeTab === 'pending' ? "All caught up!" : "No institutions yet"}
          </Typography>
          <Typography sx={{
            fontFamily: fontStack, fontSize: 14,
            color: COLORS.textSecondary, lineHeight: 1.6,
          }}>
            {activeTab === 'pending' 
              ? "No pending institution requests. Check back later for new applications."
              : "There are currently no approved institutions in the system."}
          </Typography>
        </Box>
      ) : (
        <>
          {/* ── Request Cards (Mobile) / Table (Desktop) ──────────────── */}
          {isMobile ? (
          // Mobile: card-based layout
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {paginatedData.map((request) => (
              <Box
                key={request._id}
                sx={{
                  borderRadius: COLORS.cardRadius,
                  backgroundColor: 'rgba(255,255,255,0.65)',
                  backdropFilter: 'blur(12px)',
                  WebkitBackdropFilter: 'blur(12px)',
                  border: '1px solid rgba(0,0,0,0.06)',
                  p: 2.5,
                  overflow: 'hidden',
                }}
              >
                <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={1.5}>
                  <Box>
                    <Typography sx={{ fontFamily: fontStack, fontWeight: 700, fontSize: 15, color: COLORS.textPrimary }}>
                      {request.institutionName}
                    </Typography>
                    <Typography sx={{ fontFamily: fontStack, fontSize: 12, color: COLORS.textSecondary, mt: 0.25 }}>
                      {request.academicDomain}
                    </Typography>
                  </Box>
                  <Chip
                    label={getStatusText(request.status)}
                    size="small"
                    sx={{
                      fontFamily: fontStack,
                      fontSize: 11,
                      fontWeight: 600,
                      borderRadius: COLORS.pillRadius,
                      height: 24,
                      ...getStatusChipSx(request.status),
                    }}
                  />
                </Box>

                <Box sx={{
                  display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1, mb: 2,
                  '& > div': { p: 1.5, borderRadius: '10px', backgroundColor: '#F8FAFC' },
                }}>
                  <Box>
                    <Typography sx={{ fontFamily: fontStack, fontSize: 10, fontWeight: 700, color: COLORS.textSecondary, letterSpacing: '0.08em', textTransform: 'uppercase', mb: 0.5 }}>
                      Admin
                    </Typography>
                    <Typography sx={{ fontFamily: fontStack, fontSize: 13, fontWeight: 600, color: COLORS.textPrimary }}>
                      {request.administratorName}
                    </Typography>
                  </Box>
                  <Box>
                    <Typography sx={{ fontFamily: fontStack, fontSize: 10, fontWeight: 700, color: COLORS.textSecondary, letterSpacing: '0.08em', textTransform: 'uppercase', mb: 0.5 }}>
                      Submitted
                    </Typography>
                    <Typography sx={{ fontFamily: fontStack, fontSize: 13, fontWeight: 600, color: COLORS.textPrimary }}>
                      {formatDate(request.createdAt)}
                    </Typography>
                  </Box>
                </Box>

                <Box display="flex" gap={1}>
                  {activeTab === 'pending' ? (
                    <>
                      <Button
                        fullWidth
                        onClick={() => openApproveDialog(request)}
                        disabled={request.status === "PENDING_VERIFICATION"}
                        sx={{
                          fontFamily: fontStack, fontWeight: 600, fontSize: 13,
                          textTransform: 'none', borderRadius: '10px',
                          py: 1.2,
                          backgroundColor: COLORS.black, color: '#FFFFFF',
                          '&:hover': { backgroundColor: '#222' },
                          '&.Mui-disabled': { backgroundColor: '#E2E8F0', color: '#94A3B8' },
                        }}
                      >
                        Approve
                      </Button>
                      <Button
                        fullWidth
                        onClick={() => openRejectDialog(request)}
                        disabled={request.status === "PENDING_VERIFICATION"}
                        sx={{
                          fontFamily: fontStack, fontWeight: 600, fontSize: 13,
                          textTransform: 'none', borderRadius: '10px',
                          py: 1.2,
                          border: `1.5px solid ${COLORS.black}`, color: COLORS.black,
                          backgroundColor: 'transparent',
                          '&:hover': { backgroundColor: '#f5f5f5' },
                          '&.Mui-disabled': { borderColor: '#E2E8F0', color: '#94A3B8' },
                        }}
                      >
                        Reject
                      </Button>
                    </>
                  ) : (
                    <Button
                      fullWidth
                      sx={{
                        fontFamily: fontStack, fontWeight: 600, fontSize: 13,
                        textTransform: 'none', borderRadius: '10px',
                        py: 1.2,
                        backgroundColor: COLORS.black, color: '#FFFFFF',
                        '&:hover': { backgroundColor: '#222' },
                      }}
                      onClick={() => window.location.href = `/super-admin/institution-monitoring/${request._id}`}
                    >
                      View Analytics
                    </Button>
                  )}
                </Box>
              </Box>
            ))}
          </Box>
        ) : (
          // Desktop: table layout with glassmorphism
          <TableContainer
            component={Paper}
            sx={{
              borderRadius: COLORS.cardRadius,
              border: '1px solid rgba(0,0,0,0.06)',
              boxShadow: 'none',
              backgroundColor: 'rgba(255,255,255,0.65)',
              backdropFilter: 'blur(12px)',
              WebkitBackdropFilter: 'blur(12px)',
              overflow: 'hidden',
            }}
          >
            <Table size="small">
              <TableHead>
                <TableRow sx={{ backgroundColor: '#F8FAFC' }}>
                  {[
                    "Institution Name",
                    "Domain",
                    "Contact Email",
                    "Admin",
                    "Submitted",
                    "Status",
                    "Actions",
                  ].map((label) => (
                    <TableCell
                      key={label}
                      align={label === 'Status' || label === 'Submitted' ? 'center' : label === 'Actions' ? 'right' : 'left'}
                      sx={{
                        fontFamily: fontStack,
                        fontSize: 11,
                        fontWeight: 700,
                        color: COLORS.textSecondary,
                        textTransform: 'uppercase',
                        letterSpacing: '0.08em',
                        borderBottom: `1px solid ${COLORS.border}`,
                        py: 1.5,
                      }}
                    >
                      {label}
                    </TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {paginatedData.map((request) => (
                  <TableRow
                    key={request._id}
                    sx={{
                      transition: 'background-color 0.15s ease',
                      '&:hover': { backgroundColor: 'rgba(0,0,0,0.015)' },
                      '& td': {
                        fontFamily: fontStack,
                        fontSize: 14,
                        color: COLORS.textPrimary,
                        borderBottom: `1px solid ${COLORS.border}`,
                        py: 2,
                      },
                    }}
                  >
                    <TableCell sx={{ fontWeight: 600 }}>{request.institutionName}</TableCell>
                    <TableCell>{request.academicDomain}</TableCell>
                    <TableCell sx={{ fontSize: '13px !important', color: `${COLORS.textSecondary} !important` }}>
                      {request.administratorEmail}
                    </TableCell>
                    <TableCell>{request.administratorName}</TableCell>
                    <TableCell align="center">{formatDate(request.createdAt)}</TableCell>
                    <TableCell align="center">
                      <Chip
                        label={getStatusText(request.status)}
                        size="small"
                        sx={{
                          fontFamily: fontStack,
                          fontSize: 11,
                          fontWeight: 600,
                          borderRadius: '8px',
                          height: 24,
                          ...getStatusChipSx(request.status),
                        }}
                      />
                    </TableCell>
                    <TableCell align="right">
                      <Box display="flex" gap={1} justifyContent="flex-end">
                        {activeTab === 'pending' ? (
                          <>
                            <Button
                              size="small"
                              onClick={() => openApproveDialog(request)}
                              disabled={request.status === "PENDING_VERIFICATION"}
                              sx={{
                                fontFamily: fontStack, fontWeight: 600, fontSize: 12,
                                textTransform: 'none', borderRadius: '8px',
                                px: 2, py: 0.6,
                                backgroundColor: COLORS.black, color: '#FFFFFF',
                                '&:hover': { backgroundColor: '#222' },
                                '&.Mui-disabled': { backgroundColor: '#E2E8F0', color: '#94A3B8' },
                              }}
                            >
                              Approve
                            </Button>
                            <Button
                              size="small"
                              onClick={() => openRejectDialog(request)}
                              disabled={request.status === "PENDING_VERIFICATION"}
                              sx={{
                                fontFamily: fontStack, fontWeight: 600, fontSize: 12,
                                textTransform: 'none', borderRadius: '8px',
                                px: 2, py: 0.6,
                                border: `1.5px solid ${COLORS.black}`, color: COLORS.black,
                                backgroundColor: 'transparent',
                                '&:hover': { backgroundColor: '#f5f5f5' },
                                '&.Mui-disabled': { borderColor: '#E2E8F0', color: '#94A3B8' },
                              }}
                            >
                              Reject
                            </Button>
                          </>
                        ) : (
                          <Button
                            size="small"
                            sx={{
                              fontFamily: fontStack, fontWeight: 600, fontSize: 12,
                              textTransform: 'none', borderRadius: '8px',
                              px: 2, py: 0.6,
                              backgroundColor: COLORS.black, color: '#FFFFFF',
                              '&:hover': { backgroundColor: '#222' },
                            }}
                            onClick={() => window.location.href = `/super-admin/institution-monitoring/${request._id}`}
                          >
                            View Analytics
                          </Button>
                        )}
                      </Box>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
          )}

          {/* ── Custom Pill Pagination ────────────────────────────────── */}
          {totalPages > 1 && (
            <Box sx={{ p: 2, display: 'flex', justifyContent: 'center', mt: 1 }}>
              {loading ? (
                <Skeleton variant="rounded" width={240} height={44} sx={{ borderRadius: '40px' }} />
              ) : (
                <Box sx={{
                  display: 'flex',
                  gap: 1.5,
                  alignItems: 'center',
                  bgcolor: '#F1F5F9',
                  px: 1,
                  py: 0.5,
                  borderRadius: '40px'
                }}>
                  <IconButton
                    disabled={page === 1}
                    onClick={() => setPage(page - 1)}
                    sx={{ color: page === 1 ? '#CBD5E1' : COLORS.textSecondary }}
                  >
                    <ChevronLeftIcon sx={{ fontSize: 20 }} />
                  </IconButton>

                  {(() => {
                    const range = [];
                    let start = Math.max(1, page - 1);
                    let end = Math.min(totalPages, start + 2);

                    if (end - start < 2 && start > 1) {
                      start = Math.max(1, end - 2);
                    }

                    for (let i = start; i <= end; i++) {
                      range.push(i);
                    }

                    return range.map((p) => {
                      const isActive = p === page;
                      return (
                        <Box
                          key={p}
                          onClick={() => setPage(p)}
                          sx={{
                            width: 36,
                            height: 36,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: 'pointer',
                            borderRadius: '12px',
                            bgcolor: isActive ? COLORS.black : 'transparent',
                            color: isActive ? '#FFFFFF' : COLORS.textSecondary,
                            fontWeight: 800,
                            fontSize: 14,
                            transition: 'all 0.2s ease',
                            boxShadow: isActive ? '0 8px 16px -4px rgba(0,0,0,0.2)' : 'none',
                            '&:hover': {
                              bgcolor: isActive ? COLORS.black : 'rgba(0,0,0,0.04)'
                            }
                          }}
                        >
                          {p}
                        </Box>
                      );
                    });
                  })()}

                  <IconButton
                    disabled={page === totalPages}
                    onClick={() => setPage(page + 1)}
                    sx={{ color: page === totalPages ? '#CBD5E1' : COLORS.textSecondary }}
                  >
                    <ChevronRightIcon sx={{ fontSize: 20 }} />
                  </IconButton>
                </Box>
              )}
            </Box>
          )}
        </>
      )}

      {/* ── Approve Dialog ─────────────────────────────────────────── */}
      <Dialog
        open={approveDialogOpen}
        onClose={() => setApproveDialogOpen(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: COLORS.cardRadius,
            fontFamily: fontStack,
            p: 1,
          },
        }}
      >
        <DialogTitle sx={{
          fontFamily: fontStack, fontWeight: 700, fontSize: 20,
          color: COLORS.textPrimary, pb: 0,
        }}>
          Approve Institution
        </DialogTitle>
        <DialogContent>
          {selectedRequest && (
            <Box sx={{ mt: 1 }}>
              <Typography sx={{ fontFamily: fontStack, fontSize: 14, color: COLORS.textSecondary, mb: 2 }}>
                Are you sure you want to approve access for:
              </Typography>

              {/* Request summary card */}
              <Box sx={{
                p: 2.5, borderRadius: '12px',
                backgroundColor: `${COLORS.teal}12`,
                border: `1px solid ${COLORS.teal}30`,
                mb: 3,
              }}>
                <Typography sx={{ fontFamily: fontStack, fontWeight: 700, fontSize: 16, color: COLORS.textPrimary, mb: 0.5 }}>
                  {selectedRequest.institutionName}
                </Typography>
                <Typography sx={{ fontFamily: fontStack, fontSize: 13, color: COLORS.textSecondary, lineHeight: 1.6 }}>
                  Domain: {selectedRequest.academicDomain}<br />
                  Admin: {selectedRequest.administratorName} ({selectedRequest.administratorEmail})
                </Typography>
              </Box>

              <TextField
                label="Approval Notes (Optional)"
                multiline
                rows={3}
                fullWidth
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    fontFamily: fontStack,
                    borderRadius: '12px',
                    '& fieldset': { borderColor: COLORS.border },
                    '&:hover fieldset': { borderColor: '#94A3B8' },
                    '&.Mui-focused fieldset': { borderColor: COLORS.black },
                  },
                  '& .MuiInputLabel-root': { fontFamily: fontStack },
                }}
              />
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5, gap: 1 }}>
          <Button
            onClick={() => setApproveDialogOpen(false)}
            disabled={actionState !== 'idle'}
            sx={{
              fontFamily: fontStack, fontWeight: 600, fontSize: 14,
              textTransform: 'none', borderRadius: COLORS.pillRadius,
              px: 3, color: COLORS.textSecondary,
            }}
          >
            Cancel
          </Button>
          <Button
            onClick={handleApprove}
            disabled={actionState !== 'idle'}
            sx={{
              fontFamily: fontStack, fontWeight: 600, fontSize: 14,
              textTransform: 'none', borderRadius: COLORS.pillRadius,
              px: 3, py: 1,
              backgroundColor: actionState === 'success' ? '#10b981' : COLORS.black,
              color: '#FFFFFF',
              transition: 'all 0.2s ease',
              display: 'flex', gap: 1, alignItems: 'center',
              '&:hover': { backgroundColor: actionState === 'success' ? '#10b981' : '#222' },
              '&.Mui-disabled': { backgroundColor: actionState === 'success' ? '#10b981' : '#E2E8F0', color: actionState === 'success' ? '#fff' : '#94A3B8' }
            }}
          >
            {actionState === 'loading' && <CircularProgress size={16} color="inherit" />}
            {actionState === 'success' && <CheckIcon fontSize="small" />}
            {actionState === 'idle' ? 'Approve Request' : actionState === 'loading' ? 'Approving...' : 'Approved!'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* ── Reject Dialog ──────────────────────────────────────────── */}
      <Dialog
        open={rejectDialogOpen}
        onClose={() => setRejectDialogOpen(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: COLORS.cardRadius,
            fontFamily: fontStack,
            p: 1,
          },
        }}
      >
        <DialogTitle sx={{
          fontFamily: fontStack, fontWeight: 700, fontSize: 20,
          color: COLORS.textPrimary, pb: 0,
        }}>
          Reject Institution
        </DialogTitle>
        <DialogContent>
          {selectedRequest && (
            <Box sx={{ mt: 1 }}>
              <Typography sx={{ fontFamily: fontStack, fontSize: 14, color: COLORS.textSecondary, mb: 2 }}>
                Are you sure you want to reject the request for:
              </Typography>

              {/* Request summary card */}
              <Box sx={{
                p: 2.5, borderRadius: '12px',
                backgroundColor: `${COLORS.orange}12`,
                border: `1px solid ${COLORS.orange}30`,
                mb: 3,
              }}>
                <Typography sx={{ fontFamily: fontStack, fontWeight: 700, fontSize: 16, color: COLORS.textPrimary }}>
                  {selectedRequest.institutionName}
                </Typography>
              </Box>

              <TextField
                label="Rejection Reason *"
                multiline
                rows={4}
                fullWidth
                required
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                helperText="Please provide a reason for rejection"
                sx={{
                  '& .MuiOutlinedInput-root': {
                    fontFamily: fontStack,
                    borderRadius: '12px',
                    '& fieldset': { borderColor: COLORS.border },
                    '&:hover fieldset': { borderColor: '#94A3B8' },
                    '&.Mui-focused fieldset': { borderColor: COLORS.black },
                  },
                  '& .MuiInputLabel-root': { fontFamily: fontStack },
                  '& .MuiFormHelperText-root': { fontFamily: fontStack },
                }}
              />
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5, gap: 1 }}>
          <Button
            onClick={() => setRejectDialogOpen(false)}
            disabled={actionState !== 'idle'}
            sx={{
              fontFamily: fontStack, fontWeight: 600, fontSize: 14,
              textTransform: 'none', borderRadius: COLORS.pillRadius,
              px: 3, color: COLORS.textSecondary,
            }}
          >
            Cancel
          </Button>
          <Button
            onClick={handleReject}
            disabled={!rejectionReason.trim() || actionState !== 'idle'}
            sx={{
              fontFamily: fontStack, fontWeight: 600, fontSize: 14,
              textTransform: 'none', borderRadius: COLORS.pillRadius,
              px: 3, py: 1,
              transition: 'all 0.2s ease',
              display: 'flex', gap: 1, alignItems: 'center',
              ...(actionState === 'success' ? {
                backgroundColor: '#EF4444',
                color: '#FFFFFF',
                border: '1.5px solid #EF4444'
              } : {
                border: '1.5px solid #EF4444',
                color: '#EF4444',
                backgroundColor: 'transparent',
                '&:hover': { backgroundColor: '#FEF2F2', borderColor: '#DC2626' },
              }),
              '&.Mui-disabled': {
                borderColor: actionState === 'success' ? '#EF4444' : '#E2E8F0',
                color: actionState === 'success' ? '#FFFFFF' : '#94A3B8',
                backgroundColor: actionState === 'success' ? '#EF4444' : 'transparent',
              },
            }}
          >
            {actionState === 'loading' && <CircularProgress size={16} color="inherit" />}
            {actionState === 'success' && <CheckIcon fontSize="small" />}
            {actionState === 'idle' ? 'Reject Request' : actionState === 'loading' ? 'Rejecting...' : 'Rejected'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* ── Snackbar ───────────────────────────────────────────────── */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert
          severity={snackbar.severity}
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          sx={{ fontFamily: fontStack, borderRadius: '12px' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}
