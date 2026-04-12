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
import MoreVertIcon from '@mui/icons-material/MoreVert';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import BlockIcon from '@mui/icons-material/Block';
import RestoreIcon from '@mui/icons-material/Restore';
import CloseIcon from '@mui/icons-material/Close';

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

const fontStack = '"Google Sans", "Product Sans", Roboto, sans-serif';

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
  suspendedAt?: string;
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
  const [suspendedInstitutions, setSuspendedInstitutions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'pending' | 'approved' | 'suspended'>('pending');
  const [isTabLoading, setIsTabLoading] = useState(false);
  const [approveDialogOpen, setApproveDialogOpen] = useState(false);
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [revokeDialogOpen, setRevokeDialogOpen] = useState(false);
  const [reactivateDialogOpen, setReactivateDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [permanentDeleteDialogOpen, setPermanentDeleteDialogOpen] = useState(false);
  const [permanentDeleteConfirmText, setPermanentDeleteConfirmText] = useState("");
  const [selectedRequest, setSelectedRequest] = useState<InstitutionRequest | any | null>(null);
  const [notes, setNotes] = useState("");
  const [rejectionReason, setRejectionReason] = useState("");
  const [revokeReason, setRevokeReason] = useState("");
  const [actionState, setActionState] = useState<'idle' | 'loading' | 'success'>('idle');
  const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "success" as "success" | "error" });
  const [searchQuery, setSearchQuery] = useState("");
  const [sortAnchorEl, setSortAnchorEl] = useState<null | HTMLElement>(null);
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [sortConfig, setSortConfig] = useState<{ key: string, direction: 'asc' | 'desc' } | null>(null);
  const [page, setPage] = useState(1);
  const rowsPerPage = 10;

  // ── Menu State ──────────────────────────────────────────────────────
  const [menuAnchorEl, setMenuAnchorEl] = useState<null | HTMLElement>(null);
  const [currentMenuRequest, setCurrentMenuRequest] = useState<any | null>(null);

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, request: any) => {
    setMenuAnchorEl(event.currentTarget);
    setCurrentMenuRequest(request);
  };

  const handleMenuClose = () => {
    setMenuAnchorEl(null);
    setCurrentMenuRequest(null);
  };

  // ─── Filter & Sort Logic ──────────────────────────────────────────────
  const displayedData = useMemo(() => {
    let result = activeTab === 'pending'
      ? [...requests]
      : activeTab === 'approved'
        ? [...approvedInstitutions]
        : [...suspendedInstitutions];

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

  useEffect(() => {
    if (!loading) {
      setIsTabLoading(true);
      const timer = setTimeout(() => setIsTabLoading(false), 400);
      return () => clearTimeout(timer);
    }
  }, [activeTab, loading]);

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
      const [pendingRes, approvedRes, suspendedRes] = await Promise.all([
        superAdminService.getPendingInstitutionRequests(),
        superAdminService.getInstitutions('approved'),
        superAdminService.getInstitutions('suspended')
      ]);

      setRequests(Array.isArray(pendingRes) ? pendingRes : (pendingRes?.requests || []));

      const mapInstitution = (inst: any) => ({
        _id: inst._id,
        institutionName: inst.name,
        academicDomain: inst.domain,
        physicalAddress: inst.address,
        contactNumber: inst.contactNumber,
        administratorName: inst.administratorName,
        administratorPosition: inst.administratorPosition,
        administratorEmail: inst.email,
        status: (inst.status || "approved").toUpperCase(),
        createdAt: inst.createdAt,
        suspendedAt: inst.suspendedAt
      });

      setApprovedInstitutions(((approvedRes.institutions || []) as any[]).map(mapInstitution));
      setSuspendedInstitutions(((suspendedRes.institutions || []) as any[]).map(mapInstitution));
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

  const handleRevoke = async () => {
    if (!selectedRequest) {
      console.error("No institution selected for revocation");
      return;
    }

    setActionState('loading');
    try {
      console.log(`Revoking access for: ${selectedRequest.institutionName} (${selectedRequest._id})`);
      await superAdminService.revokeInstitution(selectedRequest._id, {
        reason: revokeReason.trim() || "No reason provided"
      });

      setActionState('success');
      setTimeout(() => {
        setSnackbar({
          open: true,
          message: `Revoked access for ${selectedRequest.institutionName}`,
          severity: "success"
        });
        setRevokeDialogOpen(false);
        setRevokeReason("");
        setSelectedRequest(null);
        setActionState('idle');
        fetchData();
      }, 800);
    } catch (err: any) {
      console.error("Error revoking access:", err);
      setActionState('idle');
      setSnackbar({
        open: true,
        message: err.response?.data?.message || "Failed to revoke access",
        severity: "error"
      });
    }
  };

  const handleReactivate = async () => {
    if (!selectedRequest) return;
    setActionState('loading');
    try {
      await superAdminService.reactivateInstitution(selectedRequest._id);
      setActionState('success');
      setTimeout(() => {
        setSnackbar({ open: true, message: `Reactivated access for ${selectedRequest.institutionName}`, severity: "success" });
        setReactivateDialogOpen(false);
        setSelectedRequest(null);
        setActionState('idle');
        fetchData();
      }, 800);
    } catch (err: any) {
      console.error("Error reactivating access:", err);
      setActionState('idle');
      setSnackbar({ open: true, message: err.response?.data?.message || "Failed to reactivate access", severity: "error" });
    }
  };

  const handleDelete = async () => {
    if (!selectedRequest) return;
    setActionState('loading');
    try {
      await superAdminService.deleteInstitution(selectedRequest._id);
      setActionState('success');
      setTimeout(() => {
        setSnackbar({ open: true, message: `Institution marked for deletion`, severity: "success" });
        setDeleteDialogOpen(false);
        setSelectedRequest(null);
        setActionState('idle');
        fetchData();
      }, 800);
    } catch (err: any) {
      console.error("Error deleting institution:", err);
      setActionState('idle');
      setSnackbar({ open: true, message: err.response?.data?.message || "Failed to delete institution", severity: "error" });
    }
  };

  const handlePermanentDelete = async () => {
    if (!selectedRequest) return;
    
    if (permanentDeleteConfirmText !== selectedRequest.institutionName) {
      setSnackbar({ open: true, message: "The typed name did not match the institution name.", severity: "error" });
      return;
    }
    
    setActionState('loading');
    try {
      await superAdminService.permanentDeleteInstitution(selectedRequest._id);
      setActionState('success');
      setTimeout(() => {
        setSnackbar({ open: true, message: `${selectedRequest.institutionName} has been permanently deleted.`, severity: "success" });
        setPermanentDeleteDialogOpen(false);
        setSelectedRequest(null);
        setPermanentDeleteConfirmText("");
        setActionState('idle');
        fetchData();
      }, 800);
    } catch (err: any) {
      console.error('Error permanently deleting institution:', err);
      setActionState('idle');
      setSnackbar({ open: true, message: err.response?.data?.message || 'Failed to permanently delete institution', severity: "error" });
    }
  };

  const openPermanentDeleteDialog = (request: any) => {
    handleMenuClose();
    setSelectedRequest(request);
    setPermanentDeleteConfirmText("");
    setActionState('idle');
    setPermanentDeleteDialogOpen(true);
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

  const openRevokeDialog = (inst: any) => {
    setSelectedRequest(inst);
    setRevokeReason("");
    setActionState('idle');
    setRevokeDialogOpen(true);
  };

  const openReactivateDialog = (inst: any) => {
    setSelectedRequest(inst);
    setActionState('idle');
    setReactivateDialogOpen(true);
  };

  const openDeleteDialog = (inst: any) => {
    setSelectedRequest(inst);
    setActionState('idle');
    setDeleteDialogOpen(true);
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
        return { backgroundColor: '#B0E0E6', color: '#000000' };
      case 'REJECTED':
        return { backgroundColor: `${COLORS.orange}25`, color: '#9a3412' };
      case 'PENDING_VERIFICATION':
        return { backgroundColor: `${COLORS.yellow}80`, color: COLORS.black };
      default:
        return { backgroundColor: '#F1F5F9', color: '#475569' };
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const renderToggleSwitch = () => (
    <Box sx={{
      display: 'flex',
      width: { xs: '100%', md: 'max-content' },
      position: 'relative',
      bgcolor: '#FFFFFF',
      p: 0.5,
      borderRadius: COLORS.pillRadius,
      border: '1px solid rgba(0,0,0,0.08)',
      mb: 4,
      boxShadow: '0 2px 10px rgba(0,0,0,0.03)',
      isolation: 'isolate'
    }}>
      <Box sx={{
        position: 'absolute',
        top: 4,
        bottom: 4,
        left: 4,
        width: 'calc(33.33% - 2.66px)',
        bgcolor: '#1E1E1E',
        borderRadius: COLORS.pillRadius,
        transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        transform: activeTab === 'pending' ? 'translateX(0%)' :
          activeTab === 'approved' ? 'translateX(100.5%)' :
            'translateX(201%)',
        zIndex: -1
      }} />

      {(['pending', 'approved', 'suspended'] as const).map((tab) => (
        <Button
          key={tab}
          onClick={() => setActiveTab(tab)}
          sx={{
            flex: 1,
            width: { xs: 'auto', sm: 120 },
            py: 1,
            px: { xs: 1, sm: 2 },
            borderRadius: COLORS.pillRadius,
            textTransform: 'none',
            fontWeight: 700,
            fontSize: { xs: '12px', sm: '14px' },
            color: activeTab === tab ? '#FFFFFF' : '#64748B',
            bgcolor: 'transparent',
            transition: 'color 0.3s ease',
            '&:hover': {
              bgcolor: activeTab === tab ? 'transparent' : 'rgba(0,0,0,0.04)',
            },
          }}
        >
          {tab.charAt(0).toUpperCase() + tab.slice(1)}
        </Button>
      ))}
    </Box>
  );

  if (loading || isTabLoading) {
    return (
      <Box sx={{ 
        px: isSmallMobile ? 2 : 4, 
        pb: isSmallMobile ? 2 : 4, 
        pt: 0, 
        backgroundColor: COLORS.pageBg, 
        minHeight: '100vh', 
        fontFamily: fontStack 
      }}>
        {renderToggleSwitch()}

        {/* Metric Cards Skeleton */}
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(3, 1fr)' }, gap: 2.5, mb: 4 }}>
          {[1, 2, 3].map(i => (
            <Box key={i} sx={{ p: 3, bgcolor: '#FFFFFF', borderRadius: COLORS.cardRadius, border: '1px solid rgba(0,0,0,0.06)', boxShadow: '0 10px 40px rgba(0,0,0,0.04)', display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                <Skeleton variant="rounded" width={40} height={40} sx={{ borderRadius: '12px' }} />
                <Skeleton variant="text" width={100} height={20} />
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 1 }}>
                <Skeleton variant="text" width={40} height={48} />
                <Skeleton variant="rounded" width={60} height={20} sx={{ borderRadius: '6px' }} />
              </Box>
              <Skeleton variant="text" width="90%" height={20} />
            </Box>
          ))}
        </Box>

        {/* Table Header & Controls Skeleton */}
        <Box sx={{ mb: 3, display: 'flex', gap: 2, flexDirection: { xs: 'column', sm: 'row' }, alignItems: 'center', justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Skeleton variant="circular" width={24} height={24} />
            <Skeleton variant="text" width={120} height={32} />
          </Box>
          <Box sx={{ display: 'flex', gap: 2, width: { xs: '100%', sm: 'auto' } }}>
            <Skeleton variant="rounded" width={250} height={40} sx={{ borderRadius: '8px' }} />
            <Skeleton variant="rounded" width={120} height={40} sx={{ borderRadius: COLORS.pillRadius }} />
          </Box>
        </Box>

        {/* Table Skeleton */}
        <Box sx={{ bgcolor: '#FFFFFF', borderRadius: COLORS.cardRadius, border: '1px solid rgba(0,0,0,0.06)', overflow: 'hidden' }}>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow sx={{ bgcolor: '#F8FAFC' }}>
                  {[1, 2, 3, 4, 5, 6, 7].map(i => (
                    <TableCell key={i} sx={{ py: 2 }}><Skeleton variant="text" width="60%" /></TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {[1, 2, 3, 4, 5].map(row => (
                  <TableRow key={row}>
                    {[1, 2, 3, 4, 5, 6, 7].map(col => (
                      <TableCell key={col} sx={{ py: 2 }}>
                        {col === 6 ? <Skeleton variant="rounded" width={80} height={24} sx={{ borderRadius: COLORS.pillRadius }} /> : <Skeleton variant="text" width="80%" />}
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
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
      {renderToggleSwitch()}

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
          boxShadow: '0 10px 40px rgba(0,0,0,0.04)',
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
            <Typography sx={{
              fontSize: 10, fontWeight: 800, color: '#000000',
              display: 'flex', alignItems: 'center', gap: 0.5,
              bgcolor: '#B0E0E6', px: 1, py: 0.3, borderRadius: '6px',
              textTransform: 'uppercase'
            }}>
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round">
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
          boxShadow: '0 10px 40px rgba(0,0,0,0.04)',
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
            <Typography sx={{
              fontSize: 10, fontWeight: 800, color: '#000000',
              display: 'flex', alignItems: 'center', gap: 0.5,
              bgcolor: '#B0E0E6', px: 1, py: 0.3, borderRadius: '6px',
              textTransform: 'uppercase'
            }}>
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round">
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
          boxShadow: '0 10px 40px rgba(0,0,0,0.04)',
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
            <Typography sx={{ fontSize: 12, fontWeight: 700, color: '#dc2626', display: 'flex', alignItems: 'center', gap: 0.5 }}>
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
          flexDirection: { xs: 'column', sm: 'row' },
          alignItems: { xs: 'stretch', sm: 'center' },
          gap: 1,
          width: { xs: '100%', md: 'auto' }
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
                '&.Mui-focused fieldset': { borderColor: '#0F766E', borderWidth: '2px' },
              },
              width: { xs: '100%', md: 240 }
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
            {activeTab === 'pending'
              ? "All caught up!"
              : activeTab === 'approved'
                ? "No institutions yet"
                : "No suspended institutions"}
          </Typography>
          <Typography sx={{
            fontFamily: fontStack, fontSize: 14,
            color: COLORS.textSecondary, lineHeight: 1.6,
          }}>
            {activeTab === 'pending'
              ? "New institution applications will appear here for your review."
              : activeTab === 'approved'
                ? "There are currently no approved institutions in the system."
                : "Institutions with revoked access will be listed here."}
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
                      {activeTab === 'suspended' && request.suspendedAt && (
                        <Box component="span" sx={{ display: 'block', mt: 0.5, fontSize: 11, fontWeight: 700, color: '#dc2626' }}>
                          Deleting permanently in {Math.max(0, 30 - Math.floor((new Date().getTime() - new Date(request.suspendedAt).getTime()) / (1000 * 3600 * 24)))} days
                        </Box>
                      )}
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
                    ) : activeTab === 'approved' ? (
                      <Button
                        fullWidth
                        sx={{
                          fontFamily: fontStack, fontWeight: 600, fontSize: 13,
                          textTransform: 'none', borderRadius: '10px',
                          py: 1.2,
                          backgroundColor: '#ef4444', color: '#FFFFFF',
                          '&:hover': { backgroundColor: '#dc2626' },
                        }}
                        onClick={() => openRevokeDialog(request)}
                      >
                        Revoke
                      </Button>
                    ) : (
                      <>
                        <Button
                          fullWidth
                          sx={{
                            fontFamily: fontStack, fontWeight: 600, fontSize: 13,
                            textTransform: 'none', borderRadius: '10px',
                            py: 1.2,
                            backgroundColor: '#10b981', color: '#FFFFFF',
                            '&:hover': { backgroundColor: '#059669' },
                          }}
                          onClick={() => openReactivateDialog(request)}
                        >
                          Reactivate
                        </Button>
                        <Button
                          fullWidth
                          sx={{
                            fontFamily: fontStack, fontWeight: 600, fontSize: 13,
                            textTransform: 'none', borderRadius: '10px',
                            py: 1.2,
                            border: `1.5px solid #64748B`, color: '#64748B',
                            backgroundColor: 'transparent',
                            '&:hover': { backgroundColor: '#f1f5f9' },
                          }}
                          onClick={() => openDeleteDialog(request)}
                        >
                          Delete
                        </Button>
                      </>
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
                      ...(activeTab === 'suspended' ? ["Deletion In"] : []),
                      "Actions",
                    ].map((label) => (
                      <TableCell
                        key={label}
                        align={label === 'Status' || label === 'Submitted' || label === 'Deletion In' ? 'center' : label === 'Actions' ? 'right' : 'left'}
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
                      <TableCell sx={{ fontWeight: 600 }}>
                        {request.institutionName}
                      </TableCell>
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
                      {activeTab === 'suspended' && (
                        <TableCell align="center" sx={{ fontWeight: 700, color: '#dc2626' }}>
                          {request.suspendedAt ? `${Math.max(0, 30 - Math.floor((new Date().getTime() - new Date(request.suspendedAt).getTime()) / (1000 * 3600 * 24)))} days` : 'N/A'}
                        </TableCell>
                      )}
                      <TableCell align="right">
                        <IconButton
                          size="small"
                          disabled={request.status === "PENDING_VERIFICATION"}
                          onClick={(e) => handleMenuOpen(e, request)}
                          sx={{
                            color: COLORS.textSecondary,
                            '&:hover': { backgroundColor: 'rgba(0,0,0,0.04)', color: COLORS.black },
                            '&.Mui-disabled': { color: '#CBD5E1', opacity: 0.5 }
                          }}
                        >
                          <MoreVertIcon fontSize="small" />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}

          {/* ── Action Menu ────────────────────────────────────────── */}
          <Menu
            anchorEl={menuAnchorEl}
            open={Boolean(menuAnchorEl)}
            onClose={handleMenuClose}
            elevation={2}
            PaperProps={{
              sx: {
                borderRadius: '14px',
                minWidth: 160,
                mt: 1,
                boxShadow: '0 10px 30px -5px rgba(0,0,0,0.1)',
                border: '1px solid rgba(0,0,0,0.05)',
                '& .MuiMenuItem-root': {
                  px: 2,
                  py: 1.2,
                  fontFamily: fontStack,
                  fontSize: 14,
                  fontWeight: 600,
                  display: 'flex',
                  gap: 1.5,
                  '&:hover': { backgroundColor: '#F8FAFC' }
                }
              }
            }}
          >
            {activeTab === 'pending' && currentMenuRequest?.status !== "PENDING_VERIFICATION" && (
              <>
                <MenuItem onClick={() => { openApproveDialog(currentMenuRequest); handleMenuClose(); }}>
                  <ListItemIcon sx={{ minWidth: 'auto !important' }}><CheckCircleOutlineIcon fontSize="small" sx={{ color: '#10b981' }} /></ListItemIcon>
                  <ListItemText primary="Approve Request" />
                </MenuItem>
                <MenuItem onClick={() => { openRejectDialog(currentMenuRequest); handleMenuClose(); }}>
                  <ListItemIcon sx={{ minWidth: 'auto !important' }}><CloseIcon fontSize="small" sx={{ color: '#ef4444' }} /></ListItemIcon>
                  <ListItemText primary="Reject Request" />
                </MenuItem>
              </>
            )}

            {activeTab === 'pending' && currentMenuRequest?.status === "PENDING_VERIFICATION" && (
              <MenuItem disabled sx={{ opacity: 0.6 }}>
                <ListItemIcon sx={{ minWidth: 'auto !important' }}><HourglassEmptyIcon fontSize="small" /></ListItemIcon>
                <ListItemText primary="Waiting for Verify" />
              </MenuItem>
            )}

            {activeTab === 'approved' && (
              <MenuItem onClick={() => { openRevokeDialog(currentMenuRequest); handleMenuClose(); }} sx={{ color: '#ef4444' }}>
                <ListItemIcon sx={{ minWidth: 'auto !important' }}><BlockIcon fontSize="small" color="error" /></ListItemIcon>
                <ListItemText primary="Revoke Access" />
              </MenuItem>
            )}

            {activeTab === 'suspended' && (
              <>
                <MenuItem onClick={() => { openReactivateDialog(currentMenuRequest); handleMenuClose(); }} sx={{ color: '#44838b' }}>
                  <ListItemIcon sx={{ minWidth: 'auto !important' }}><RestoreIcon fontSize="small" sx={{ color: '#44838b' }} /></ListItemIcon>
                  <ListItemText primary="Reactivate" />
                </MenuItem>
                <MenuItem onClick={() => openPermanentDeleteDialog(currentMenuRequest)} sx={{ color: '#dc2626' }}>
                  <ListItemIcon sx={{ minWidth: 'auto !important' }}><DeleteOutlineIcon fontSize="small" sx={{ color: '#dc2626' }} /></ListItemIcon>
                  <ListItemText primary="Delete Permanently" />
                </MenuItem>
              </>
            )}
          </Menu>

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

      {/* ── Revoke Dialog ─────────────────────────────────────────── */}
      <Dialog
        open={revokeDialogOpen}
        onClose={() => setRevokeDialogOpen(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: { borderRadius: COLORS.cardRadius, fontFamily: fontStack, p: 1 },
        }}
      >
        <DialogTitle sx={{ fontFamily: fontStack, fontWeight: 700, fontSize: 20, color: COLORS.textPrimary, pb: 0 }}>
          Revoke Institution Access
        </DialogTitle>
        <DialogContent>
          {selectedRequest && (
            <Box sx={{ mt: 1 }}>
              <Typography sx={{ fontFamily: fontStack, fontSize: 14, color: COLORS.textSecondary, mb: 2 }}>
                Are you sure you want to revoke access for:
              </Typography>
              <Box sx={{ p: 2.5, borderRadius: '12px', backgroundColor: '#FEE2E2', border: '1px solid #FECACA', mb: 3 }}>
                <Typography sx={{ fontFamily: fontStack, fontWeight: 700, fontSize: 16, color: '#991B1B' }}>
                  {selectedRequest.institutionName}
                </Typography>
              </Box>
              <TextField
                label="Reason for Revocation (Optional)"
                multiline
                rows={3}
                fullWidth
                value={revokeReason}
                onChange={(e) => setRevokeReason(e.target.value)}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    fontFamily: fontStack,
                    borderRadius: '12px',
                    '&.Mui-focused fieldset': { borderColor: '#ef4444' },
                  },
                }}
              />
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5, gap: 1 }}>
          <Button onClick={() => setRevokeDialogOpen(false)} sx={{ fontFamily: fontStack, textTransform: 'none', color: COLORS.textSecondary }}>
            Cancel
          </Button>
          <Button
            onClick={handleRevoke}
            disabled={actionState !== 'idle'}
            sx={{
              fontFamily: fontStack, fontWeight: 600, textTransform: 'none', borderRadius: COLORS.pillRadius,
              px: 3, py: 1, backgroundColor: '#ef4444', color: '#FFFFFF',
              '&:hover': { backgroundColor: '#dc2626' },
            }}
          >
            {actionState === 'loading' ? <CircularProgress size={16} color="inherit" /> : 'Revoke Access'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* ── Reactivate Dialog ─────────────────────────────────────── */}
      <Dialog
        open={reactivateDialogOpen}
        onClose={() => setReactivateDialogOpen(false)}
        maxWidth="xs"
        fullWidth
        PaperProps={{
          sx: { borderRadius: COLORS.cardRadius, fontFamily: fontStack, p: 1 },
        }}
      >
        <DialogTitle sx={{ fontFamily: fontStack, fontWeight: 700, fontSize: 20, color: COLORS.textPrimary }}>
          Reactivate Institution
        </DialogTitle>
        <DialogContent>
          <Typography sx={{ fontFamily: fontStack, fontSize: 14, color: COLORS.textSecondary }}>
            This will restore full access for <strong>{selectedRequest?.institutionName}</strong> and all its users.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5, gap: 1 }}>
          <Button onClick={() => setReactivateDialogOpen(false)} sx={{ fontFamily: fontStack, textTransform: 'none', color: COLORS.textSecondary }}>
            Cancel
          </Button>
          <Button
            onClick={handleReactivate}
            disabled={actionState !== 'idle'}
            sx={{
              fontFamily: fontStack, fontWeight: 600, textTransform: 'none', borderRadius: COLORS.pillRadius,
              px: 3, py: 1, backgroundColor: '#B0E0E6', color: '#000000',
              '&:hover': { backgroundColor: '#9AC0C6' },
            }}
          >
            {actionState === 'loading' ? <CircularProgress size={16} color="inherit" /> : 'Reactivate Now'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* ── Delete Dialog ─────────────────────────────────────────── */}
      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        maxWidth="xs"
        fullWidth
        PaperProps={{
          sx: { borderRadius: COLORS.cardRadius, fontFamily: fontStack, p: 1 },
        }}
      >
        <DialogTitle sx={{ fontFamily: fontStack, fontWeight: 700, fontSize: 20, color: '#1E293B' }}>
          Mark for Deletion
        </DialogTitle>
        <DialogContent>
          <Typography sx={{ fontFamily: fontStack, fontSize: 14, color: '#64748B', mb: 2 }}>
            Are you sure you want to delete <strong>{selectedRequest?.institutionName}</strong>?
          </Typography>
          <Box sx={{ p: 2, bgcolor: '#F8FAFC', borderRadius: '12px', border: '1px solid #E2E8F0' }}>
            <Typography sx={{ fontFamily: fontStack, fontSize: 13, color: '#475569', fontWeight: 600 }}>
              Notice: The institution will be hidden immediately and permanently deleted in 30 days.
            </Typography>
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5, gap: 1 }}>
          <Button onClick={() => setDeleteDialogOpen(false)} sx={{ fontFamily: fontStack, textTransform: 'none', color: COLORS.textSecondary }}>
            Cancel
          </Button>
          <Button
            onClick={handleDelete}
            disabled={actionState !== 'idle'}
            sx={{
              fontFamily: fontStack, fontWeight: 600, textTransform: 'none', borderRadius: COLORS.pillRadius,
              px: 3, py: 1, border: '1.5px solid #1E293B', color: '#1E293B',
              '&:hover': { backgroundColor: '#f1f5f9' },
            }}
          >
            {actionState === 'loading' ? <CircularProgress size={16} color="inherit" /> : 'Confirm Deletion'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* ── Permanent Delete Dialog ─────────────────────────────────── */}
      <Dialog
        open={permanentDeleteDialogOpen}
        onClose={() => setPermanentDeleteDialogOpen(false)}
        maxWidth="xs"
        fullWidth
        PaperProps={{
          sx: { borderRadius: COLORS.cardRadius, fontFamily: fontStack, p: 1 },
        }}
      >
        <DialogTitle sx={{ fontFamily: fontStack, fontWeight: 700, fontSize: 20, color: '#1E293B' }}>
          Are you absolutely sure?
        </DialogTitle>
        <DialogContent>
          <Typography sx={{ fontFamily: fontStack, fontSize: 14, color: '#64748B', mb: 2 }}>
            This will <b style={{color: '#991B1B'}}>PERMANENTLY destroy</b> <strong>{selectedRequest?.institutionName}</strong> and all associated user accounts.
          </Typography>
          <Box sx={{ p: 2, mb: 3, bgcolor: '#FEF2F2', borderRadius: '12px', border: '1px solid #FECACA' }}>
            <Typography sx={{ fontFamily: fontStack, fontSize: 13, color: '#991B1B', fontWeight: 600 }}>
              This action CANNOT be undone.
            </Typography>
          </Box>
          <Typography sx={{ fontFamily: fontStack, fontSize: 14, color: COLORS.textPrimary, mb: 1, fontWeight: 600 }}>
            Type to confirm:
          </Typography>
          <TextField
            fullWidth
            placeholder={selectedRequest?.institutionName || ""}
            value={permanentDeleteConfirmText}
            onChange={(e) => setPermanentDeleteConfirmText(e.target.value)}
            sx={{
              '& .MuiOutlinedInput-root': {
                fontFamily: fontStack,
                borderRadius: '12px',
                '&.Mui-focused fieldset': { borderColor: '#ef4444' },
              },
            }}
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5, gap: 1 }}>
          <Button onClick={() => setPermanentDeleteDialogOpen(false)} sx={{ fontFamily: fontStack, textTransform: 'none', color: COLORS.textSecondary }}>
            Cancel
          </Button>
          <Button
            onClick={handlePermanentDelete}
            disabled={permanentDeleteConfirmText !== selectedRequest?.institutionName || actionState !== 'idle'}
            sx={{
              fontFamily: fontStack, fontWeight: 600, textTransform: 'none', borderRadius: COLORS.pillRadius,
              px: 3, py: 1, backgroundColor: '#ef4444', color: '#FFFFFF',
              '&:hover': { backgroundColor: '#dc2626' },
              '&.Mui-disabled': { backgroundColor: '#FECACA', color: '#FFFFFF' }
            }}
          >
            {actionState === 'loading' ? <CircularProgress size={16} color="inherit" /> : 'Yes, permanently delete it!'}
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
