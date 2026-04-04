import { useEffect, useMemo, useState, useCallback } from "react";
import Swal from 'sweetalert2';
import { adminService } from "../services";
import {
  Box, Typography, Card, CardContent, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Paper, FormControl, InputLabel,
  Select, MenuItem, Chip, Button, Dialog, DialogTitle, DialogContent,
  DialogActions, Alert, Grid, IconButton, Tooltip, LinearProgress,
  Pagination, Avatar, SelectChangeEvent, useTheme, useMediaQuery, Skeleton,
  TextField, InputAdornment, Switch, FormControlLabel, Menu, Divider, Checkbox
} from "@mui/material";
import { motion, AnimatePresence } from "framer-motion";
import {
  Visibility, Lock, LockOpen, Email, Business, Person,
  AdminPanelSettings, School, Delete as DeleteIcon,
  RestoreFromTrash as RestoreIcon,
  Search as SearchIcon,
  FilterList as FilterIcon,
  ChevronRight,
  ChevronLeft,
  PersonAdd,
  Security, History, Refresh,
  People as PeopleIcon, Settings as SettingsIcon, MoreVert as MoreVertIcon, Check
} from '@mui/icons-material';
import DirectoryModal from "./DirectoryModal";
import ConfirmationModal from "./ConfirmationModal";
import SuccessActionModal from "./SuccessActionModal";
import { getInitials, getAbsoluteUrl } from "../utils/avatarUtils";

// ─── Modern clean Design System ──────────────────────────────────────────────
const COLORS = {
  pageBg: '#F8FAFC',
  surface: '#FFFFFF',
  black: '#000000',
  textPrimary: '#1E293B',
  textSecondary: '#64748B',
  teal: '#0E7490',      // Sidebar Active Text Color
  tealLight: 'rgba(45, 212, 191, 0.15)', // Sidebar Active Indicator BG
  blue: '#0EA5E9',      // For "Verified" badge
  orange: '#F59E0B', // For "Disabled" or warnings
  yellow: '#EAB308', // For pending or highlights
  border: '#E2E8F0',
  cardRadius: '16px',
  pillRadius: '999px',
};

const fontStack = "'Inter', 'Plus Jakarta Sans', 'Montserrat', sans-serif";

interface UserRow {
  _id: string;
  username?: string;
  fullName?: string;
  email: string;
  isAdmin: boolean;
  enabled: boolean;
  accessKey: string;
  role?: string;
  organizationId?: string;
  organizationName?: string;
  organizationIds?: string[];
  avatarUrl?: string;
}

const maskEmail = (email: string) => {
  if (!email) return "—";
  const [local, domain] = email.split("@");
  if (!local || !domain) return email;
  const head = local.slice(0, 2);
  return `${head}${"*".repeat(Math.max(local.length - 2, 3))}@${domain}`;
};

const maskName = (name: string) => {
  if (!name) return "—";
  const head = name.slice(0, 2);
  return `${head}${"*".repeat(Math.max(name.length - 2, 3))}`;
};

export default function UsersTable({
  refreshTrigger = 0,
  onLoadingChange,
  institutionId
}: {
  refreshTrigger?: number;
  onLoadingChange?: (loading: boolean) => void;
  institutionId?: string;
}) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const isSmallMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const [rows, setRows] = useState<UserRow[]>([]);
  const [institution, setInstitution] = useState<any>(null);
  const [query, setQuery] = useState("");
  const [filters, setFilters] = useState({ role: '', status: '' });
  const [viewUser, setViewUser] = useState<UserRow | null>(null);
  const [manageUser, setManageUser] = useState<UserRow | null>(null);
  const [role, setRole] = useState("student");
  const [selectedOrgId, setSelectedOrgId] = useState("");
  const [selectedOrgIds, setSelectedOrgIds] = useState<string[]>([]);
  const [organizations, setOrganizations] = useState<any[]>([]);
  const [createPassword, setCreatePassword] = useState("");
  const [deanAssignments, setDeanAssignments] = useState<any[]>([]);
  const [newCourse, setNewCourse] = useState("");
  const [newYearLevel, setNewYearLevel] = useState("All");

  const [isStudentMode, setIsStudentMode] = useState(false);
  const [studentCourse, setStudentCourse] = useState("");
  const [studentYear, setStudentYear] = useState("First Year");

  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [activeTab, setActiveTab] = useState("All");
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [sortAnchorEl, setSortAnchorEl] = useState<null | HTMLElement>(null);
  const [sortConfig, setSortConfig] = useState<{ key: 'fullName' | 'email' | 'enabled', direction: 'asc' | 'desc' } | null>(null);
  const [menuUser, setMenuUser] = useState<UserRow | null>(null);
  const [viewingDirectoryRole, setViewingDirectoryRole] = useState<string | null>(null);
  const [isManagingDirectory, setIsManagingDirectory] = useState(false);
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const [isBulkUpdating, setIsBulkUpdating] = useState(false);
  const [bulkMenuAnchor, setBulkMenuAnchor] = useState<null | HTMLElement>(null);
  const [bulkRoleAnchor, setBulkRoleAnchor] = useState<null | HTMLElement>(null);
  const [targetBulkRole, setTargetBulkRole] = useState<string | null>(null);
  const [orgBulkAnchor, setOrgBulkAnchor] = useState<null | HTMLElement>(null);
  const [accessRequests, setAccessRequests] = useState<any[]>([]);
  const [isApproveModalOpen, setIsApproveModalOpen] = useState(false);
  const [requestToApprove, setRequestToApprove] = useState<any>(null);
  const [isApproving, setIsApproving] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const rowsPerPage = 10;

  const loadData = async () => {
    setLoading(true);
    onLoadingChange?.(true);
    try {
      // Add a deliberate 1000ms delay for visual feedback
      await new Promise(resolve => setTimeout(resolve, 1000));

      const [userData, instData, orgData, requestsData] = await Promise.all([
        adminService.getUsers(),
        adminService.getInstitution(),
        adminService.getOrganizations(),
        adminService.getAccessRequests().catch(() => [])
      ]);
      setRows(userData || []);
      setInstitution(instData);
      setOrganizations(orgData || []);
      setAccessRequests(requestsData || []);
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
      onLoadingChange?.(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (refreshTrigger > 0) {
      loadData();
    }
  }, [refreshTrigger]);

  useEffect(() => {
    if (manageUser) {
      const r = manageUser.role || (manageUser.isAdmin ? "admin" : "student");
      setRole(r);

      if (manageUser._id) {
        // Fetch full user details to get all organization IDs
        adminService.getUser(manageUser._id).then((details: any) => {
          const ids = details.organizationIds || (details.organizationId ? [details.organizationId] : []);
          setSelectedOrgIds(ids);
          if (ids.length > 0) setSelectedOrgId(ids[0]);
        }).catch(console.error);

        if (r === 'student' || r === 'officer') {
          adminService.getStudentProfile(manageUser._id).then(profile => {
            if (profile) {
              setIsStudentMode(true);
              setStudentCourse(profile.course || "");
              setStudentYear(profile.year || "First Year");
            } else {
              setIsStudentMode(r === 'student');
              setStudentCourse("");
              setStudentYear("First Year");
            }
          }).catch(console.error);
        }
      } else {
        setSelectedOrgIds([]);
        setSelectedOrgId("");
        setIsStudentMode(r === 'student');
        setStudentCourse("");
        setStudentYear("First Year");
      }
    } else {
      setDeanAssignments([]);
      setNewCourse("");
      setNewYearLevel("All");
      setIsStudentMode(false);
      setStudentCourse("");
      setStudentYear("First Year");
    }
  }, [manageUser]);

  useEffect(() => {
    if (manageUser?._id && role === 'dean') {
      adminService.getDeanAssignments(manageUser._id)
        .then(setDeanAssignments)
        .catch(console.error);
    }
  }, [manageUser, role]);

  const filtered = useMemo(() => {
    let result = rows.filter(r => {
      const q = query.trim().toLowerCase();
      const emailMatch = r.email?.toLowerCase().includes(q);
      const usernameMatch = r.username?.toLowerCase().includes(q);
      const fullNameMatch = r.fullName?.toLowerCase().includes(q);
      const matchesQuery = !q || (emailMatch || usernameMatch || fullNameMatch);

      // Role mapping for tabs
      const userRole = r.role || (r.isAdmin ? "admin" : "student");
      const mappedTab = (role: string) => {
        if (role === 'admin' || role === 'super_admin') return 'Admin';
        if (role === 'dean') return 'Dean';
        if (role === 'officer') return 'Officer';
        if (role === 'student') return 'Student';
        return 'Other';
      };

      const matchesTab = activeTab === "All" || mappedTab(userRole) === activeTab;
      const statusValue = r.enabled ? 'active' : 'locked';
      const matchesStatus = !filters.status || statusValue === filters.status;

      return matchesQuery && matchesTab && matchesStatus;
    });

    if (sortConfig) {
      result.sort((a, b) => {
        let aVal: any = (sortConfig.key === 'fullName' ? (a.fullName || a.username) : a[sortConfig.key]) || '';
        let bVal: any = (sortConfig.key === 'fullName' ? (b.fullName || b.username) : b[sortConfig.key]) || '';

        if (typeof aVal === 'string' && typeof bVal === 'string') {
          return sortConfig.direction === 'asc'
            ? aVal.localeCompare(bVal)
            : bVal.localeCompare(aVal);
        }

        if (typeof aVal === 'boolean' && typeof bVal === 'boolean') {
          return sortConfig.direction === 'asc'
            ? (aVal === bVal ? 0 : aVal ? 1 : -1)
            : (aVal === bVal ? 0 : bVal ? 1 : -1);
        }

        return 0;
      });
    }

    return result;
  }, [rows, query, filters, activeTab, sortConfig]);

  const totalPages = Math.ceil(filtered.length / rowsPerPage);
  const paginatedRows = filtered.slice((page - 1) * rowsPerPage, page * rowsPerPage);

  const stats = useMemo(() => ({
    total: rows.length,
    students: rows.filter(r => r.role === 'student').length,
    officers: rows.filter(r => r.role === 'officer').length,
    disabled: rows.filter(r => !r.enabled).length
  }), [rows]);

  const getRoleDisplay = (roleName?: string) => {
    const r = roleName?.toLowerCase() || 'student';
    if (r === 'admin' || r === 'super_admin') return 'Admin';
    if (r === 'dean') return 'Dean';
    if (r === 'officer') return 'Officer';
    return 'Student';
  };

  const getAccessLevel = (roleName?: string) => {
    const r = roleName?.toLowerCase() || 'student';
    if (r === 'admin' || r === 'super_admin') return 'Full Access';
    if (r === 'dean') return 'College Access';
    if (r === 'officer') return 'Signatory Access';
    return 'Student Access';
  };

  const handleRoleChange = (event: SelectChangeEvent<string>) => {
    setFilters(prev => ({ ...prev, role: event.target.value }));
    setPage(1);
  };

  const handleStatusChange = (event: SelectChangeEvent<string>) => {
    setFilters(prev => ({ ...prev, status: event.target.value }));
    setPage(1);
  };


  const toggleStatus = async (user: UserRow) => {
    await adminService.updateUserStatus(user._id, !user.enabled);
    loadData();
  };

  const handleApproveConfirm = async () => {
    if (!requestToApprove) return;
    setIsApproving(true);
    try {
      await adminService.approveAccessRequest(requestToApprove._id, 'student');
      setIsApproveModalOpen(false);
      setSuccessMsg(`Access request for ${requestToApprove.fullName} has been approved. They can now sign in.`);
      setShowSuccessModal(true);
      loadData();
    } catch (err) {
      console.error(err);
      Swal.fire('Error', 'Failed to approve request', 'error');
    } finally {
      setIsApproving(false);
      setRequestToApprove(null);
    }
  };

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, user: UserRow) => {
    setAnchorEl(event.currentTarget);
    setMenuUser(user);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setMenuUser(null);
  };

  const handleMenuManage = () => {
    if (menuUser) setManageUser(menuUser);
    handleMenuClose();
  };

  const handleMenuToggle = async () => {
    if (menuUser) await toggleStatus(menuUser);
    handleMenuClose();
  };

  const handleBulkUpdateStatus = async (userIds: string[], enabled: boolean) => {
    setIsBulkUpdating(true);
    try {
      await adminService.updateBulkStatus(userIds, enabled);
      loadData();
      setSelectedUserIds([]);
    } catch (error) {
      console.error('Bulk status update failed:', error);
      Swal.fire('Error', 'Failed to update users status', 'error');
    } finally {
      setIsBulkUpdating(false);
      setBulkMenuAnchor(null);
    }
  };

  const handleBulkUpdateRole = async (userIds: string[], role: string, orgIds: string[]) => {
    setIsBulkUpdating(true);
    try {
      await adminService.updateBulkRole(userIds, role, orgIds);
      loadData();
      setSelectedUserIds([]);
    } catch (error) {
      console.error('Bulk role update failed:', error);
      Swal.fire('Error', 'Failed to update users roles', 'error');
    } finally {
      setIsBulkUpdating(false);
      setBulkRoleAnchor(null);
      setBulkMenuAnchor(null);
    }
  };

  const toggleSelectAll = () => {
    if (selectedUserIds.length === paginatedRows.length) {
      setSelectedUserIds([]);
    } else {
      setSelectedUserIds(paginatedRows.map(u => u._id));
    }
  };

  const toggleSelectUser = (id: string) => {
    setSelectedUserIds(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const selectSx = {
    fontFamily: fontStack,
    borderRadius: '12px',
    bgcolor: '#F8FAFC',
    '& .MuiOutlinedInput-notchedOutline': { borderColor: COLORS.border },
    '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#94A3B8' },
    '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: COLORS.black },
  };

  return (
    <Box sx={{ fontFamily: fontStack }}>
      {/* ── Administrators Header ───────────────────────────────────── */}
      <Box sx={{
        display: 'flex',
        flexDirection: isSmallMobile ? 'column' : 'row',
        justifyContent: 'space-between',
        alignItems: isSmallMobile ? 'flex-start' : 'center',
        gap: 3,
        mb: 4
      }}>
        <Box>
          {loading ? (
            <>
              <Skeleton variant="text" width={250} height={40} sx={{ mb: 1, borderRadius: '4px' }} />
              <Skeleton variant="text" width={400} height={20} sx={{ borderRadius: '4px' }} />
            </>
          ) : (
            <>
              <Typography
                sx={{
                  fontFamily: fontStack,
                  fontWeight: 850,
                  fontSize: isSmallMobile ? '1.75rem' : '2.1rem',
                  letterSpacing: '-0.04em',
                  color: COLORS.textPrimary,
                  lineHeight: 1,
                  mb: 0.8
                }}
              >
                Account Management
              </Typography>
              <Typography
                sx={{
                  fontFamily: fontStack,
                  fontSize: 15,
                  fontWeight: 500,
                  color: '#64748B',
                  maxWidth: 600,
                  letterSpacing: '-0.01em'
                }}
              >
                Centrally manage institutional roles, account status, and platform permissions.
              </Typography>
            </>
          )}
        </Box>
        {loading ? (
          <Skeleton variant="rounded" width={isSmallMobile ? '100%' : 160} height={48} sx={{ borderRadius: '999px' }} />
        ) : (
          <Button
            variant="contained"
            disableElevation
            fullWidth={isSmallMobile}
            onClick={() => {
              setManageUser({
                _id: "", username: "", fullName: "", email: "",
                isAdmin: false, enabled: true, accessKey: ""
              });
              setCreatePassword("");
            }}
            sx={{
              borderRadius: '999px',
              bgcolor: COLORS.black,
              color: '#FFFFFF',
              textTransform: 'none',
              px: isSmallMobile ? 2 : 4,
              py: 1.2,
              fontWeight: 800,
              fontSize: '14px',
              fontFamily: fontStack,
              boxShadow: '0 4px 14px 0 rgba(0,0,0,0.39)',
              '&:hover': {
                bgcolor: '#222222',
                transform: 'translateY(-2px)',
                boxShadow: '0 10px 30px rgba(0,0,0,0.45)'
              },
              transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)'
            }}
          >
            Add member
          </Button>
        )}
      </Box>

      {/* ── Role Summary Cards ────────────────────────────────────────── */}
      <Box sx={{
        display: 'grid',
        gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', lg: 'repeat(4, 1fr)' },
        gap: { xs: 2, sm: 3 }, mb: 6,
      }}>
        {loading ? (
          [1, 2, 3, 4].map((i) => (
            <Card key={i} sx={{ borderRadius: '16px', border: '1px solid #F1F5F9', boxShadow: '0 10px 25px -3px rgba(0,0,0,0.02)' }}>
              <CardContent sx={{ p: 2.5 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
                  <Skeleton variant="text" width={80} height={24} sx={{ borderRadius: '4px' }} />
                  <Skeleton variant="rounded" width={60} height={24} sx={{ borderRadius: '8px' }} />
                </Box>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mb: 3 }}>
                  {[1, 2, 3].map((j) => (
                    <Box key={j} sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                      <Skeleton variant="circular" width={40} height={40} />
                      <Box sx={{ flexGrow: 1 }}>
                        <Skeleton variant="text" width="70%" sx={{ mb: 0.5 }} />
                        <Skeleton variant="text" width="50%" />
                      </Box>
                    </Box>
                  ))}
                </Box>
                <Skeleton variant="rounded" width="100%" height={36} sx={{ borderRadius: '8px', mt: 'auto' }} />
              </CardContent>
            </Card>
          ))
        ) : (
          ['Admin', 'Dean', 'Officer', 'Student'].map((roleLabel) => {
            const roleUsers = rows.filter(r => {
              const rName = r.role || (r.isAdmin ? 'admin' : 'student');
              return getRoleDisplay(rName) === roleLabel;
            }).slice(0, 3);

            return (
              <Card
                key={roleLabel}
                sx={{
                  borderRadius: '16px',
                  border: '1px solid #F1F5F9',
                  boxShadow: '0 10px 25px -5px rgba(0,0,0,0.04), 0 8px 10px -6px rgba(0,0,0,0.04)',
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column'
                }}
              >
                <CardContent sx={{ p: 2.5, display: 'flex', flexDirection: 'column', flexGrow: 1 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                    <Typography sx={{ fontSize: 14, fontWeight: 800 }}>{roleLabel}</Typography>
                    <Button
                      size="small"
                      variant="outlined"
                      onClick={() => {
                        setViewingDirectoryRole(roleLabel);
                        setIsManagingDirectory(false);
                      }}
                      sx={{
                        textTransform: 'none',
                        fontSize: 12,
                        fontWeight: 700,
                        color: '#0F172A',
                        bgcolor: '#F1F5F9',
                        borderRadius: '8px',
                        px: 1.5,
                        height: 28,
                        minWidth: 'auto',
                        boxShadow: 'none',
                        border: 'none',
                        '&:hover': {
                          bgcolor: '#E2E8F0',
                          boxShadow: 'none'
                        }
                      }}
                    >
                      See All
                    </Button>
                  </Box>

                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, mb: 3 }}>
                    {roleUsers.length > 0 ? roleUsers.map(u => (
                      <Box key={u._id} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                          <Box sx={{ position: 'relative' }}>
                            <Avatar
                              src={getAbsoluteUrl(u.avatarUrl)}
                              sx={{
                                width: 40,
                                height: 40,
                                fontSize: 14,
                                bgcolor: '#020617', // Dark background like Sidebar
                                color: '#FFFFFF',
                                fontWeight: 800,
                                textShadow: '-0.5px 0 0 rgba(0,255,255,0.4), 0.5px 0 0 rgba(255,165,0,0.4)',
                              }}
                            >
                              {getInitials(u.fullName || u.username)}
                            </Avatar>
                            {u.enabled && (
                              <Box sx={{ position: 'absolute', bottom: -2, right: -2, bgcolor: '#FFF', borderRadius: '50%', p: '2px', zIndex: 2 }}>
                                <Box sx={{
                                  width: 14,
                                  height: 14,
                                  bgcolor: COLORS.teal, // Use better teal
                                  borderRadius: '50%',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                                }}>
                                  <Check sx={{ fontSize: 10, color: '#FFF', fontWeight: 900 }} />
                                </Box>
                              </Box>
                            )}
                          </Box>
                          <Box>
                            <Typography sx={{ fontSize: 14.5, fontWeight: 800, lineHeight: 1.2, color: COLORS.textPrimary }}>{u.fullName || u.username}</Typography>
                            <Typography sx={{ fontSize: 12.5, fontWeight: 500, color: COLORS.textSecondary }}>{u.email}</Typography>
                          </Box>
                        </Box>
                      </Box>
                    )) : (
                      <Typography sx={{ fontSize: 11, color: COLORS.textSecondary, fontStyle: 'italic', textAlign: 'center', py: 1 }}>No users found</Typography>
                    )}
                  </Box>

                  <Button
                    fullWidth
                    startIcon={<SettingsIcon sx={{ fontSize: 18 }} />}
                    onClick={() => {
                      setViewingDirectoryRole(roleLabel);
                      setIsManagingDirectory(true);
                    }}
                    sx={{
                      mt: 'auto',
                      bgcolor: '#F1F5F9',
                      color: '#0F172A',
                      textTransform: 'none',
                      fontSize: 13,
                      fontWeight: 700,
                      borderRadius: '8px',
                      py: 1,
                      border: 'none',
                      boxShadow: 'none',
                      '&:hover': {
                        bgcolor: '#E2E8F0',
                        boxShadow: 'none'
                      }
                    }}
                  >
                    Manage
                  </Button>
                </CardContent>
              </Card>
            );
          })
        )}
      </Box>

      {/* ── Administrator Accounts Table Section ─────────────────── */}
      <Box sx={{ mb: 3, display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, justifyContent: 'space-between', alignItems: { xs: 'flex-start', sm: 'center' }, gap: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          {loading ? (
            <Skeleton variant="circular" width={20} height={20} />
          ) : (
            <PeopleIcon sx={{ fontSize: 20, color: COLORS.textSecondary }} />
          )}
          {loading ? <Skeleton variant="text" width={100} /> : <Typography sx={{ fontSize: 16, fontWeight: 800 }}>Accounts</Typography>}
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, width: { xs: '100%', sm: 'auto' }, flexDirection: { xs: 'column', sm: 'row' } }}>
          {loading ? (
            <>
              <Skeleton variant="rounded" width={240} height={36} sx={{ borderRadius: '8px' }} />
              <Skeleton variant="rounded" width={120} height={36} sx={{ borderRadius: '8px' }} />
            </>
          ) : (
            <>
              <TextField
                size="small"
                placeholder="Search..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                InputProps={{
                  startAdornment: <SearchIcon sx={{ fontSize: 18, color: COLORS.textSecondary, mr: 1 }} />,
                  sx: {
                    borderRadius: '8px',
                    bgcolor: '#FFF',
                    fontSize: 13,
                    height: 36,
                    minWidth: { xs: '100%', sm: 240 },
                  }
                }}
                sx={{
                  width: { xs: '100%', sm: 'auto' },
                  '& .MuiOutlinedInput-notchedOutline': {
                    border: '1px solid transparent',
                    transition: 'border-color 0.2s'
                  },
                  '& .MuiOutlinedInput-root:hover .MuiOutlinedInput-notchedOutline': {
                    borderColor: '#E2E8F0'
                  },
                  '& .MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline': {
                    borderColor: COLORS.teal,
                    borderWidth: '1.5px'
                  }
                }}
              />
              <Button
                variant="outlined"
                endIcon={<FilterIcon />}
                onClick={(e) => setSortAnchorEl(e.currentTarget)}
                sx={{
                  borderColor: (sortConfig || filters.status) ? COLORS.teal : '#E2E8F0',
                  bgcolor: (sortConfig || filters.status) ? `${COLORS.teal}08` : 'transparent',
                  color: (sortConfig || filters.status) ? COLORS.teal : COLORS.textPrimary,
                  textTransform: 'none',
                  fontWeight: 700,
                  px: 2,
                  height: 36,
                  borderRadius: '10px',
                  fontSize: 13,
                  width: { xs: '100%', sm: 'auto' },
                  '&:hover': { borderColor: COLORS.teal, bgcolor: `${COLORS.teal}15` }
                }}
              >
                {filters.status ? (filters.status === 'active' ? 'Active' : 'Disabled') : 'Sort & Filter'}
                {sortConfig && !filters.status && ` (${sortConfig.key === 'fullName' ? 'Name' : sortConfig.key === 'enabled' ? 'Status' : 'Email'})`}
              </Button>
              {(sortConfig || filters.status || query) && (
                <IconButton
                  size="small"
                  onClick={() => { setSortConfig(null); setFilters({ role: '', status: '' }); setQuery(""); }}
                  sx={{ color: '#EF4444', bgcolor: '#FEF2F2', '&:hover': { bgcolor: '#FEE2E2' } }}
                >
                  <Refresh sx={{ fontSize: 18 }} />
                </IconButton>
              )}
            </>
          )}
        </Box>
      </Box>

      <Box sx={{ backgroundColor: '#FFF', borderRadius: '16px', border: '1px solid #F1F5F9', overflow: 'hidden' }}>
        {/* Tabs */}
        <Box sx={{
          px: 2,
          borderBottom: '1px solid #F1F5F9',
          display: 'flex',
          gap: { xs: 2.5, sm: 4 },
          overflowX: 'auto',
          msOverflowStyle: 'none',
          scrollbarWidth: 'none',
          '&::-webkit-scrollbar': { display: 'none' },
          whiteSpace: 'nowrap'
        }}>
          {loading ? (
            [1, 2, 3, 4, 5].map(i => (
              <Box key={i} sx={{ py: 2 }}>
                <Skeleton variant="text" width={60} />
              </Box>
            ))
          ) : (
            ['All', 'Admin', 'Dean', 'Officer', 'Student', 'Requests'].map((tab) => {
              const pendingRequestsCount = accessRequests.filter(r => r.status === 'pending').length;
              const count = tab === 'All' ? rows.length : tab === 'Requests' ? pendingRequestsCount : rows.filter(r => {
                const rName = r.role || (r.isAdmin ? 'admin' : 'student');
                return getRoleDisplay(rName) === tab;
              }).length;

              const active = activeTab === tab;
              return (
                <Box
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  sx={{
                    py: 2,
                    cursor: 'pointer',
                    position: 'relative',
                    '&::after': active ? {
                      content: '""', position: 'absolute', bottom: 0, left: 0, right: 0, height: 3, bgcolor: tab === 'Requests' ? COLORS.orange : COLORS.teal
                    } : {}
                  }}
                >
                  <Typography sx={{ fontSize: 13, fontWeight: 700, color: active ? COLORS.textPrimary : COLORS.textSecondary, display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    {tab}
                    {tab === 'Requests' && pendingRequestsCount > 0 ? (
                      <Box component="span" sx={{
                        bgcolor: COLORS.orange, color: '#FFF', fontSize: 10, fontWeight: 800,
                        borderRadius: '6px', px: 0.8, py: 0.2, ml: 0.5, minWidth: 18, textAlign: 'center', lineHeight: 1.5
                      }}>{pendingRequestsCount}</Box>
                    ) : (
                      <Box component="span" sx={{ opacity: 0.6, ml: 0.5 }}>({count})</Box>
                    )}
                  </Typography>
                </Box>
              );
            })
          )}
        </Box>

        {activeTab === 'Requests' ? (
          /* ── Access Requests Panel ──────────────────────────────── */
          <Box sx={{ p: { xs: 2, sm: 3 } }}>
            {accessRequests.filter(r => r.status === 'pending').length === 0 ? (
              <Box sx={{ textAlign: 'center', py: 8 }}>
                <Box sx={{
                  width: 64,
                  height: 64,
                  borderRadius: '20px',
                  bgcolor: '#F8FAFC',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  mx: 'auto',
                  mb: 2.5,
                  border: '1px solid #E2E8F0'
                }}>
                  <PersonAdd sx={{ fontSize: 28, color: '#94A3B8' }} />
                </Box>
                <Typography sx={{ fontSize: 16, fontWeight: 800, color: COLORS.textPrimary, mb: 0.5 }}>No pending requests</Typography>
                <Typography sx={{ fontSize: 14, color: COLORS.textSecondary, maxWidth: 300, mx: 'auto' }}>
                  New access requests from Google Sign-in will appear here for your approval.
                </Typography>
              </Box>
            ) : (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {accessRequests.filter(r => r.status === 'pending').map((req: any) => (
                  <Box
                    key={req._id}
                    sx={{
                      display: 'flex',
                      flexDirection: { xs: 'column', sm: 'row' },
                      alignItems: { xs: 'flex-start', sm: 'center' },
                      justifyContent: 'space-between',
                      gap: 2,
                      p: 2.5,
                      borderRadius: '16px',
                      border: '1px solid #F1F5F9',
                      bgcolor: '#FAFBFC',
                      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                      '&:hover': {
                        borderColor: '#E2E8F0',
                        bgcolor: '#FFFFFF',
                        boxShadow: '0 12px 24px -8px rgba(0,0,0,0.08)',
                        transform: 'translateY(-2px)'
                      }
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <Avatar
                        src={req.avatarUrl}
                        sx={{
                          width: 48,
                          height: 48,
                          fontSize: 16,
                          bgcolor: '#020617',
                          color: '#FFF',
                          fontWeight: 800,
                          textShadow: '-0.5px 0 0 rgba(0,255,255,0.4), 0.5px 0 0 rgba(255,165,0,0.4)',
                        }}
                      >
                        {getInitials(req.fullName)}
                      </Avatar>
                      <Box>
                        <Typography sx={{ fontSize: 15, fontWeight: 800, color: COLORS.textPrimary, lineHeight: 1.2, mb: 0.3 }}>
                          {req.fullName}
                        </Typography>
                        <Typography sx={{ fontSize: 13, fontWeight: 500, color: COLORS.textSecondary, mb: 0.5 }}>
                          {req.email}
                        </Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Typography sx={{
                            fontSize: 11,
                            fontWeight: 700,
                            color: '#64748B',
                            bgcolor: '#F1F5F9',
                            px: 1,
                            py: 0.2,
                            borderRadius: '4px'
                          }}>
                            GOOGLE SIGN-IN
                          </Typography>
                          <Typography sx={{ fontSize: 11, fontWeight: 500, color: '#94A3B8' }}>
                            {new Date(req.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                          </Typography>
                        </Box>
                      </Box>
                    </Box>
                    <Box sx={{ display: 'flex', gap: 1.5, width: { xs: '100%', sm: 'auto' } }}>
                      <Button
                        variant="contained"
                        disableElevation
                        fullWidth={isSmallMobile}
                        onClick={() => {
                          setRequestToApprove(req);
                          setIsApproveModalOpen(true);
                        }}
                        sx={{
                          bgcolor: COLORS.black,
                          color: '#FFF',
                          textTransform: 'none',
                          fontWeight: 800,
                          fontSize: 13,
                          borderRadius: '12px',
                          px: 3,
                          py: 1,
                          '&:hover': { bgcolor: '#222' }
                        }}
                      >
                        Approve
                      </Button>
                      <Button
                        variant="outlined"
                        fullWidth={isSmallMobile}
                        onClick={async () => {
                          const result = await Swal.fire({
                            title: 'Reject Request?',
                            text: 'Are you sure you want to reject this access request?',
                            icon: 'warning',
                            showCancelButton: true,
                            confirmButtonColor: '#DC2626',
                            confirmButtonText: 'Yes, Reject',
                            cancelButtonText: 'Cancel'
                          });

                          if (result.isConfirmed) {
                            try {
                              await adminService.rejectAccessRequest(req._id);
                              loadData();
                            } catch (err) {
                              Swal.fire('Error', 'Failed to reject request', 'error');
                            }
                          }
                        }}
                        sx={{
                          borderColor: '#E2E8F0',
                          color: '#DC2626',
                          textTransform: 'none',
                          fontWeight: 700,
                          fontSize: 13,
                          borderRadius: '12px',
                          px: 3,
                          py: 1,
                          '&:hover': { bgcolor: '#FEF2F2', borderColor: '#FECACA' }
                        }}
                      >
                        Reject
                      </Button>
                    </Box>
                  </Box>
                ))}
              </Box>
            )}
          </Box>
        ) : (
          <>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow sx={{ bgcolor: '#F8FAFC' }}>
                    <TableCell sx={{ py: 1.5, width: 48 }}>
                      <Checkbox
                        size="small"
                        checked={selectedUserIds.length === paginatedRows.length && paginatedRows.length > 0}
                        indeterminate={selectedUserIds.length > 0 && selectedUserIds.length < paginatedRows.length}
                        onChange={toggleSelectAll}
                        sx={{ color: '#CBD5E1', '&.Mui-checked': { color: COLORS.black } }}
                      />
                    </TableCell>
                    {['Account', 'Email Address', 'Role', 'Access', 'Status', ''].map((h, i) => (
                      <TableCell
                        key={i}
                        sx={{
                          py: 1.5,
                          fontSize: 11,
                          fontWeight: 800,
                          color: COLORS.textSecondary,
                          textTransform: 'uppercase',
                          display: (i === 1 || i === 3) ? { xs: 'none', md: 'table-cell' } : 'table-cell'
                        }}
                      >
                        {loading ? <Skeleton variant="text" width={i === 5 ? 0 : 60 + (i * 10)} /> : h}
                      </TableCell>
                    ))}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {loading ? (
                    [1, 2, 3, 4, 5].map((i) => (
                      <TableRow key={i}>
                        <TableCell><Skeleton variant="rectangular" width={20} height={20} /></TableCell>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                            <Box sx={{ position: 'relative' }}>
                              <Skeleton variant="circular" width={38} height={38} />
                              <Skeleton variant="circular" width={14} height={14}
                                sx={{
                                  position: 'absolute',
                                  top: -2,
                                  right: -2,
                                  bgcolor: '#FFF',
                                  border: '2px solid #FFF'
                                }}
                              />
                            </Box>
                            <Skeleton variant="text" width={120} />
                          </Box>
                        </TableCell>
                        <TableCell sx={{ display: { xs: 'none', md: 'table-cell' } }}><Skeleton variant="text" width={150} /></TableCell>
                        <TableCell><Skeleton variant="text" width={80} /></TableCell>
                        <TableCell sx={{ display: { xs: 'none', md: 'table-cell' } }}><Skeleton variant="text" width={100} /></TableCell>
                        <TableCell>
                          <Skeleton variant="rounded" width={80} height={24} sx={{ borderRadius: '99px' }} />
                        </TableCell>
                        <TableCell align="right"><Skeleton variant="circular" width={24} height={24} /></TableCell>
                      </TableRow>
                    ))
                  ) : (
                    paginatedRows.length > 0 ? paginatedRows.map((user) => (
                      <TableRow key={user._id} hover sx={{ '&:last-child td': { border: 0 } }}>
                        <TableCell>
                          <Checkbox
                            size="small"
                            checked={selectedUserIds.includes(user._id)}
                            onChange={() => toggleSelectUser(user._id)}
                            sx={{ color: '#E2E8F0', '&.Mui-checked': { color: COLORS.black } }}
                          />
                        </TableCell>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                            <Box sx={{ position: 'relative' }}>
                              <Avatar
                                src={getAbsoluteUrl(user.avatarUrl)}
                                sx={{
                                  width: 38,
                                  height: 38,
                                  fontSize: 13,
                                  bgcolor: '#020617',
                                  color: '#FFFFFF',
                                  fontWeight: 800,
                                  textShadow: '-0.5px 0 0 rgba(0,255,255,0.4), 0.5px 0 0 rgba(255,165,0,0.4)',
                                }}>
                                {getInitials(user.fullName || user.username)}
                              </Avatar>
                              {user.enabled && (
                                <Box sx={{ position: 'absolute', bottom: -3, right: -3, bgcolor: '#FFF', borderRadius: '50%', p: '2.5px', zIndex: 2 }}>
                                  <Box sx={{
                                    width: 14,
                                    height: 14,
                                    bgcolor: COLORS.teal,
                                    borderRadius: '50%',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                                  }}>
                                    <Check sx={{ fontSize: 10, color: '#FFF', fontWeight: 950 }} />
                                  </Box>
                                </Box>
                              )}
                            </Box>
                            <Typography sx={{ fontSize: 13, fontWeight: 700 }}>{maskName(user.fullName || user.username || "")}</Typography>
                          </Box>
                        </TableCell>
                        <TableCell sx={{ fontSize: 13, color: COLORS.textSecondary, display: { xs: 'none', md: 'table-cell' } }}>{user.email}</TableCell>
                        <TableCell sx={{ fontSize: 13, fontWeight: 600 }}>{getRoleDisplay(user.role || (user.isAdmin ? 'admin' : 'student'))}</TableCell>
                        <TableCell sx={{ fontSize: 13, color: COLORS.textSecondary, display: { xs: 'none', md: 'table-cell' } }}>{getAccessLevel(user.role || (user.isAdmin ? 'admin' : 'student'))}</TableCell>
                        <TableCell>
                          <Box sx={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 1,
                            px: 1.5,
                            py: 0.5,
                            borderRadius: '99px',
                            bgcolor: user.enabled ? COLORS.tealLight : '#F1F5F9',
                            border: user.enabled ? `1px solid ${COLORS.teal}20` : 'none'
                          }}>
                            <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: user.enabled ? COLORS.teal : '#64748B' }} />
                            <Typography sx={{ fontSize: 12, fontWeight: 800, color: user.enabled ? COLORS.teal : '#64748B' }}>
                              {user.enabled ? 'Enabled' : 'Disabled'}
                            </Typography>
                          </Box>
                        </TableCell>
                        <TableCell align="right">
                          <IconButton size="small" onClick={(e) => handleMenuOpen(e, user)}>
                            <MoreVertIcon sx={{ fontSize: 20, color: COLORS.textSecondary }} />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    )) : (
                      <TableRow>
                        <TableCell colSpan={7} align="center" sx={{ py: 8 }}>
                          <Typography sx={{ color: COLORS.textSecondary, fontSize: 14 }}>No accounts found in this category</Typography>
                        </TableCell>
                      </TableRow>
                    )
                  )}
                </TableBody>
              </Table>
            </TableContainer>
            <Box sx={{ p: 2, display: 'flex', justifyContent: 'center', borderTop: '1px solid #F1F5F9' }}>
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
                    <ChevronLeft sx={{ fontSize: 20 }} />
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
                    <ChevronRight sx={{ fontSize: 20 }} />
                  </IconButton>
                </Box>
              )}
            </Box>
          </>
        )}
      </Box>

      {/* Approval Confirmation Modal */}
      <ConfirmationModal
        open={isApproveModalOpen}
        loading={isApproving}
        onClose={() => setIsApproveModalOpen(false)}
        onConfirm={handleApproveConfirm}
        title="Are You Sure Want To Approve?"
        description={
          <>
            You are about to approve the access request for <strong>{requestToApprove?.fullName}</strong>.
            <br />
            This user will be registered in the system.
          </>
        }
        confirmText="Yes, Approve"
        cancelText="Not Now"
      />

      {/* Success Modal */}
      <SuccessActionModal
        open={showSuccessModal}
        onClose={() => setShowSuccessModal(false)}
        title="Approval Success"
        description={successMsg}
      />

      {/* Main Table Bulk Actions Overlay */}
      <AnimatePresence>
        {selectedUserIds.length > 0 && (
          <Box
            component={motion.div}
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            sx={{
              position: 'fixed',
              bottom: { xs: 0, sm: 32 },
              left: '50%',
              transform: 'translateX(-50%)',
              width: { xs: '100%', sm: 'auto' },
              maxWidth: { xs: '100%', sm: 'calc(100% - 64px)' },
              bgcolor: COLORS.black,
              color: '#FFF',
              py: { xs: 2.5, sm: 2 },
              px: { xs: 2, sm: 3 },
              borderRadius: { xs: '20px 20px 0 0', sm: '20px' },
              display: 'flex',
              flexDirection: { xs: 'column', sm: 'row' },
              alignItems: 'center',
              gap: { xs: 2, sm: 3 },
              boxShadow: '0 -10px 40px rgba(0,0,0,0.3)',
              zIndex: 1000
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, width: { xs: '100%', sm: 'auto' }, justifyContent: { xs: 'space-between', sm: 'flex-start' } }}>
              <Typography sx={{ fontWeight: 800, fontSize: 14 }}>
                {selectedUserIds.length} users selected
              </Typography>
              <Button
                size="small"
                onClick={() => setSelectedUserIds([])}
                sx={{ color: 'rgba(255,255,255,0.5)', textTransform: 'none', fontSize: 12, display: { xs: 'block', sm: 'none' } }}
              >
                Clear
              </Button>
            </Box>
            <Divider orientation={isSmallMobile ? "horizontal" : "vertical"} flexItem sx={{ bgcolor: 'rgba(255,255,255,0.1)', display: { xs: 'none', sm: 'block' } }} />
            <Box sx={{
              display: 'flex',
              gap: 1,
              width: { xs: '100%', sm: 'auto' },
              overflowX: 'auto',
              pb: { xs: 0.5, sm: 0 },
              '&::-webkit-scrollbar': { display: 'none' }
            }}>
              <Button
                variant="text"
                size="small"
                onClick={() => handleBulkUpdateStatus(selectedUserIds, true)}
                sx={{ color: '#FFF', textTransform: 'none', fontWeight: 700, '&:hover': { bgcolor: 'rgba(255,255,255,0.1)' } }}
                startIcon={<LockOpen />}
              >
                Enable
              </Button>
              <Button
                variant="text"
                size="small"
                onClick={() => handleBulkUpdateStatus(selectedUserIds, false)}
                sx={{ color: '#FFF', textTransform: 'none', fontWeight: 700, '&:hover': { bgcolor: 'rgba(255,255,255,0.1)' } }}
                startIcon={<Lock />}
              >
                Disable
              </Button>
              <Button
                variant="text"
                size="small"
                onClick={(e) => setBulkMenuAnchor(e.currentTarget)}
                sx={{ color: '#FFF', textTransform: 'none', fontWeight: 700, '&:hover': { bgcolor: 'rgba(255,255,255,0.1)' } }}
                startIcon={<AdminPanelSettings />}
              >
                Change Role
              </Button>
            </Box>
          </Box>
        )}
      </AnimatePresence>

      <Menu
        anchorEl={bulkMenuAnchor}
        open={Boolean(bulkMenuAnchor)}
        onClose={() => setBulkMenuAnchor(null)}
        PaperProps={{ sx: { borderRadius: '12px', mt: 1, boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' } }}
      >
        {['Student', 'Officer', 'Dean', 'Admin'].map(r => (
          <MenuItem
            key={r}
            onClick={(e) => {
              const roleLower = r.toLowerCase();
              if (roleLower === 'officer' || roleLower === 'dean') {
                setTargetBulkRole(roleLower);
                setOrgBulkAnchor(e.currentTarget);
              } else {
                handleBulkUpdateRole(selectedUserIds, roleLower, []);
              }
            }}
            sx={{ fontSize: 13, fontWeight: 600, px: 3, py: 1.2 }}
          >
            {r} {(r === 'Officer' || r === 'Dean') && "..."}
          </MenuItem>
        ))}
      </Menu>

      <Menu
        anchorEl={orgBulkAnchor}
        open={Boolean(orgBulkAnchor)}
        onClose={() => setOrgBulkAnchor(null)}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'left' }}
        PaperProps={{ sx: { borderRadius: '12px', mt: 1, boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)', minWidth: 200 } }}
      >
        <MenuItem onClick={() => handleBulkUpdateRole(selectedUserIds, targetBulkRole!, [])} sx={{ fontSize: 13, fontWeight: 600 }}>
          <em>No Organization</em>
        </MenuItem>
        {organizations.map(org => (
          <MenuItem
            key={org._id}
            onClick={() => handleBulkUpdateRole(selectedUserIds, targetBulkRole!, [org._id])}
            sx={{ fontSize: 13, fontWeight: 600 }}
          >
            {org.name}
          </MenuItem>
        ))}
      </Menu>

      {/* ── Sort Menu ──────────────────────────────────────────────── */}
      <Menu
        anchorEl={sortAnchorEl}
        open={Boolean(sortAnchorEl)}
        onClose={() => setSortAnchorEl(null)}
        PaperProps={{
          sx: {
            mt: 0.5,
            borderRadius: '12px',
            boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)',
            minWidth: 200,
            '& .MuiMenuItem-root': {
              fontSize: 13,
              fontWeight: 600,
              py: 1.2,
              px: 2,
              '&:hover': { bgcolor: '#F8FAFC' }
            }
          }
        }}
      >
        <Typography sx={{ px: 2, py: 1, fontSize: 11, fontWeight: 800, color: COLORS.textSecondary, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          Sort by
        </Typography>
        <MenuItem onClick={() => { setSortConfig({ key: 'fullName', direction: 'asc' }); setSortAnchorEl(null); }}>
          Name (A-Z)
        </MenuItem>
        <MenuItem onClick={() => { setSortConfig({ key: 'fullName', direction: 'desc' }); setSortAnchorEl(null); }}>
          Name (Z-A)
        </MenuItem>
        <Divider sx={{ my: 0.5, opacity: 0.6 }} />
        <MenuItem onClick={() => { setSortConfig({ key: 'email', direction: 'asc' }); setSortAnchorEl(null); }}>
          Email (A-Z)
        </MenuItem>
        <MenuItem onClick={() => { setSortConfig({ key: 'email', direction: 'desc' }); setSortAnchorEl(null); }}>
          Email (Z-A)
        </MenuItem>
        <Divider sx={{ my: 0.5, opacity: 0.6 }} />
        <MenuItem onClick={() => { setSortConfig({ key: 'enabled', direction: 'desc' }); setSortAnchorEl(null); }}>
          Status (Enabled First)
        </MenuItem>
        <MenuItem onClick={() => { setSortConfig({ key: 'enabled', direction: 'asc' }); setSortAnchorEl(null); }}>
          Status (Disabled First)
        </MenuItem>
        {sortConfig && (
          <>
            <Divider sx={{ borderStyle: 'dashed', my: 0.5 }} />
            <MenuItem
              onClick={() => { setSortConfig(null); setSortAnchorEl(null); }}
              sx={{ color: '#EF4444', '&:hover': { bgcolor: '#FEF2F2' } }}
            >
              Reset Sorting
            </MenuItem>
          </>
        )}

        <Divider sx={{ my: 1 }} />
        <Typography sx={{ px: 2, py: 1, fontSize: 11, fontWeight: 800, color: COLORS.textSecondary, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          Filter by Status
        </Typography>
        <MenuItem
          onClick={() => { setFilters(prev => ({ ...prev, status: '' })); setSortAnchorEl(null); }}
          selected={filters.status === ''}
        >
          All Statuses
        </MenuItem>
        <MenuItem
          onClick={() => { setFilters(prev => ({ ...prev, status: 'active' })); setSortAnchorEl(null); }}
          selected={filters.status === 'active'}
        >
          Active Only
        </MenuItem>
        <MenuItem
          onClick={() => { setFilters(prev => ({ ...prev, status: 'locked' })); setSortAnchorEl(null); }}
          selected={filters.status === 'locked'}
        >
          Disabled Only
        </MenuItem>
      </Menu>

      {/* ── Action Menu ────────────────────────────────────────────── */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
        PaperProps={{
          sx: {
            mt: 0.5,
            borderRadius: '10px',
            boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
            border: '1px solid #F1F5F9',
            minWidth: 160,
            '& .MuiMenuItem-root': {
              fontFamily: fontStack,
              fontSize: 13,
              fontWeight: 600,
              gap: 1.5,
              py: 1.2,
              px: 2,
              '&:hover': { bgcolor: '#F8FAFC' }
            }
          }
        }}
      >
        <MenuItem onClick={handleMenuManage}>
          <SettingsIcon sx={{ fontSize: 18, color: COLORS.textSecondary }} />
          Manage
        </MenuItem>
        <MenuItem onClick={handleMenuToggle} sx={{ color: menuUser?.enabled ? '#EF4444' : COLORS.blue }}>
          {menuUser?.enabled ? <Lock sx={{ fontSize: 18 }} /> : <LockOpen sx={{ fontSize: 18 }} />}
          {menuUser?.enabled ? 'Disable Account' : 'Enable Account'}
        </MenuItem>
      </Menu>

      {/* ── Dialogs ────────────────────────────────────────────────── */}
      <Dialog open={!!viewUser} onClose={() => setViewUser(null)} fullWidth maxWidth="sm" PaperProps={{ sx: { borderRadius: COLORS.cardRadius } }}>
        <DialogTitle sx={{ fontWeight: 800 }}>User Details</DialogTitle>
        <DialogContent>
          {viewUser && (
            <Box display="flex" flexDirection="column" gap={2} sx={{ mt: 1 }}>
              <Box sx={{ p: 2, borderRadius: '12px', bgcolor: '#F8FAFC' }}>
                <Typography sx={{ fontSize: 11, fontWeight: 700, color: COLORS.textSecondary, textTransform: 'uppercase', mb: 0.5 }}>Full Name</Typography>
                <Typography sx={{ fontWeight: 700 }}>{viewUser.fullName || viewUser.username || "—"}</Typography>
              </Box>
              <Box sx={{ p: 2, borderRadius: '12px', bgcolor: '#F8FAFC' }}>
                <Typography sx={{ fontSize: 11, fontWeight: 700, color: COLORS.textSecondary, textTransform: 'uppercase', mb: 0.5 }}>Email Address</Typography>
                <Typography sx={{ fontWeight: 700 }}>{viewUser.email}</Typography>
              </Box>
              <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
                <Box sx={{ p: 2, borderRadius: '12px', bgcolor: '#F8FAFC' }}>
                  <Typography sx={{ fontSize: 11, fontWeight: 700, color: COLORS.textSecondary, textTransform: 'uppercase', mb: 0.5 }}>Role</Typography>
                  <Typography sx={{ fontWeight: 700 }}>{viewUser.role?.replace('_', ' ') || (viewUser.isAdmin ? "Admin" : "Student")}</Typography>
                </Box>
                <Box sx={{ p: 2, borderRadius: '12px', bgcolor: '#F8FAFC' }}>
                  <Typography sx={{ fontSize: 11, fontWeight: 700, color: COLORS.textSecondary, textTransform: 'uppercase', mb: 0.5 }}>Status</Typography>
                  <Box sx={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 1,
                    px: 1.5,
                    py: 0.5,
                    borderRadius: '99px',
                    bgcolor: viewUser.enabled ? COLORS.tealLight : '#F1F5F9',
                    border: viewUser.enabled ? `1px solid ${COLORS.teal}20` : 'none',
                    mt: 0.5
                  }}>
                    <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: viewUser.enabled ? COLORS.teal : '#64748B' }} />
                    <Typography sx={{ fontWeight: 800, fontSize: 13, color: viewUser.enabled ? COLORS.teal : '#64748B' }}>
                      {viewUser.enabled ? "Enabled" : "Disabled"}
                    </Typography>
                  </Box>
                </Box>
              </Box>
              <Box sx={{ p: 2, borderRadius: '12px', bgcolor: '#0F172A', color: '#FFF' }}>
                <Typography sx={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', mb: 0.5 }}>Access Key</Typography>
                <Typography sx={{ fontWeight: 800, fontFamily: 'monospace', fontSize: 16 }}>{viewUser.accessKey}</Typography>
              </Box>
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
          <Button onClick={() => setViewUser(null)} sx={{ color: COLORS.textSecondary, textTransform: 'none', fontWeight: 600 }}>Close</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={!!manageUser} onClose={() => setManageUser(null)} fullWidth maxWidth="sm" PaperProps={{ sx: { borderRadius: COLORS.cardRadius } }}>
        <DialogTitle sx={{ fontWeight: 800 }}>{manageUser?._id ? "Manage User" : "Create New User"}</DialogTitle>
        <DialogContent>
          <Box display="flex" flexDirection="column" gap={3} sx={{ mt: 2 }}>
            <TextField
              label="Full Name"
              fullWidth
              value={manageUser?.fullName || ""}
              onChange={(e) => setManageUser(prev => prev ? { ...prev, fullName: e.target.value } : null)}
              InputProps={{ sx: { borderRadius: '12px' } }}
            />
            {!manageUser?._id && (
              <>
                <TextField
                  label="Email Address"
                  fullWidth
                  value={manageUser?.email.split('@')[0] || ""}
                  autoComplete="off"
                  onChange={(e) => {
                    const value = e.target.value.split('@')[0];
                    setManageUser(prev => prev ? { ...prev, email: value + (institution?.domain ? `@${institution.domain}` : "") } : null);
                  }}
                  InputProps={{
                    sx: { borderRadius: '12px' },
                    endAdornment: institution?.domain ? (
                      <InputAdornment position="end">
                        <Typography sx={{ color: COLORS.textSecondary, fontSize: 13, fontWeight: 600 }}>
                          @{institution.domain}
                        </Typography>
                      </InputAdornment>
                    ) : null
                  }}
                />
                <TextField
                  label="Password"
                  type="password"
                  fullWidth
                  value={createPassword}
                  autoComplete="new-password"
                  onChange={(e) => setCreatePassword(e.target.value)}
                  InputProps={{ sx: { borderRadius: '12px' } }}
                />
              </>
            )}
            <FormControl fullWidth>
              <InputLabel>Role</InputLabel>
              <Select
                value={role}
                label="Role"
                onChange={(e) => setRole(e.target.value as string)}
                sx={{ borderRadius: '12px' }}
              >
                <MenuItem value="student">Student</MenuItem>
                <MenuItem value="officer">Officer / Signatory</MenuItem>
                <MenuItem value="dean">College Dean</MenuItem>
                <MenuItem value="admin">Institutional Admin</MenuItem>
              </Select>
            </FormControl>

            {(role === 'officer') && (
              <FormControl fullWidth>
                <InputLabel>Assign to Organizations</InputLabel>
                <Select
                  multiple
                  value={selectedOrgIds}
                  label="Assign to Organizations"
                  onChange={(e) => {
                    const value = e.target.value as string[];
                    setSelectedOrgIds(value);
                  }}
                  renderValue={(selected) => (
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                      {selected.map((value) => (
                        <Chip
                          key={value}
                          label={organizations.find(o => o._id === value)?.name || value}
                          size="small"
                          sx={{ borderRadius: '6px', bgcolor: `${COLORS.teal}15`, fontWeight: 600 }}
                        />
                      ))}
                    </Box>
                  )}
                  sx={{ borderRadius: '12px' }}
                >
                  {organizations.map(org => (
                    <MenuItem key={org._id} value={org._id}>{org.name}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            )}

            {manageUser?._id && role === 'dean' && (
              <Box sx={{ p: 2, borderRadius: '12px', bgcolor: '#F8FAFC', border: '1px solid #E2E8F0', mt: 1 }}>
                <Typography sx={{ fontSize: 12, fontWeight: 700, color: COLORS.textSecondary, textTransform: 'uppercase', mb: 2 }}>Assigned Courses</Typography>

                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 3 }}>
                  {deanAssignments.map(da => (
                    <Chip
                      key={da._id}
                      label={`${da.course} - Year: ${da.yearLevel}`}
                      onDelete={async () => {
                        try {
                          await adminService.removeDeanAssignment(manageUser._id, da._id);
                          setDeanAssignments(prev => prev.filter(p => p._id !== da._id));
                        } catch (e) { console.error(e); }
                      }}
                      sx={{ borderRadius: '8px', bgcolor: '#FFF', border: '1px solid #E2E8F0', fontWeight: 600 }}
                    />
                  ))}
                  {deanAssignments.length === 0 && (
                    <Typography sx={{ fontSize: 13, color: '#94A3B8', fontStyle: 'italic' }}>No courses assigned yet.</Typography>
                  )}
                </Box>

                <Box sx={{ display: 'flex', gap: 1 }}>
                  <TextField
                    size="small"
                    placeholder="Course (e.g. BSCS)"
                    value={newCourse}
                    onChange={e => setNewCourse(e.target.value)}
                    sx={{ flex: 2, '& .MuiOutlinedInput-root': { borderRadius: '8px', bgcolor: '#FFF' } }}
                  />
                  <FormControl size="small" sx={{ flex: 1 }}>
                    <Select
                      value={newYearLevel}
                      onChange={e => setNewYearLevel(e.target.value as string)}
                      sx={{ borderRadius: '8px', bgcolor: '#FFF' }}
                    >
                      <MenuItem value="All">All Years</MenuItem>
                      <MenuItem value="1">1st Year</MenuItem>
                      <MenuItem value="2">2nd Year</MenuItem>
                      <MenuItem value="3">3rd Year</MenuItem>
                      <MenuItem value="4">4th Year</MenuItem>
                      <MenuItem value="5">5th Year</MenuItem>
                    </Select>
                  </FormControl>
                  <Button
                    variant="contained"
                    disableElevation
                    disabled={!newCourse.trim()}
                    onClick={async () => {
                      try {
                        const newAssignment = await adminService.addDeanAssignment(manageUser._id, { course: newCourse.trim().toUpperCase(), yearLevel: newYearLevel });
                        setDeanAssignments(prev => [...prev, newAssignment.assignment]);
                        setNewCourse("");
                        setNewYearLevel("All");
                      } catch (error: any) {
                        Swal.fire({ icon: 'error', title: 'Error', text: error.response?.data?.message || error.message });
                      }
                    }}
                    sx={{ borderRadius: '8px', bgcolor: COLORS.black, textTransform: 'none', px: 2, '&:hover': { bgcolor: '#222' } }}
                  >
                    Add
                  </Button>
                </Box>
              </Box>
            )}

            {(!manageUser?._id && role === 'dean') && (
              <Alert severity="info" sx={{ borderRadius: '12px', mt: 1 }}>
                You can assign specific courses and year levels to this Dean after creating their account.
              </Alert>
            )}

            {manageUser?._id && (role === 'student' || role === 'officer') && (
              <Box sx={{ p: 2, borderRadius: '12px', bgcolor: '#F8FAFC', border: '1px solid #E2E8F0', mt: 1 }}>
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                  <Typography sx={{ fontSize: 12, fontWeight: 700, color: COLORS.textSecondary, textTransform: 'uppercase' }}>
                    Student Profile
                  </Typography>
                  {role === 'officer' && (
                    <FormControlLabel
                      control={<Switch size="small" checked={isStudentMode} onChange={e => setIsStudentMode(e.target.checked)} />}
                      label={<Typography fontSize={13} fontWeight={600}>Also a Student</Typography>}
                      sx={{ m: 0 }}
                    />
                  )}
                </Box>

                {isStudentMode ? (
                  <Box display="flex" gap={1.5}>
                    <TextField
                      size="small" label="Course (e.g. BSCS)"
                      value={studentCourse} onChange={e => setStudentCourse(e.target.value)}
                      sx={{ flex: 2, bgcolor: '#FFF', '& .MuiOutlinedInput-root': { borderRadius: '8px' } }}
                    />
                    <FormControl size="small" sx={{ flex: 1.5, bgcolor: '#FFF' }}>
                      <InputLabel>Year Level</InputLabel>
                      <Select value={studentYear} label="Year Level" onChange={e => setStudentYear(e.target.value as string)} sx={{ borderRadius: '8px' }}>
                        <MenuItem value="First Year">1st Year</MenuItem>
                        <MenuItem value="Second Year">2nd Year</MenuItem>
                        <MenuItem value="Third Year">3rd Year</MenuItem>
                        <MenuItem value="Fourth Year">4th Year</MenuItem>
                        <MenuItem value="Fifth Year">5th Year</MenuItem>
                      </Select>
                    </FormControl>
                  </Box>
                ) : (
                  <Typography fontSize={13} color="#64748B" fontStyle="italic">This officer is not tracking any student clearance.</Typography>
                )}

                <Box mt={2} display="flex" justifyContent="flex-end">
                  <Button
                    size="small" variant="contained" disableElevation
                    disabled={isStudentMode && (!studentCourse.trim() || !studentYear)}
                    onClick={async () => {
                      try {
                        await adminService.updateStudentProfile(manageUser._id, { isStudent: isStudentMode, course: studentCourse.trim(), yearLevel: studentYear });
                        Swal.fire({ icon: 'success', title: 'Profile Updated', timer: 1500, showConfirmButton: false });
                      } catch (e: any) {
                        Swal.fire({ icon: 'error', title: 'Error', text: e.response?.data?.message || 'Update failed' });
                      }
                    }}
                    sx={{ borderRadius: '8px', textTransform: 'none', fontWeight: 600, bgcolor: COLORS.black, '&:hover': { bgcolor: '#222' } }}
                  >
                    Save Profile
                  </Button>
                </Box>
              </Box>
            )}

            {(!manageUser?._id && (role === 'student' || role === 'officer')) && (
              <Alert severity="info" sx={{ borderRadius: '12px', mt: 1 }}>
                You can assign the specific course for this user after creating their account.
              </Alert>
            )}

            {manageUser?._id && (
              <Box sx={{ p: 2, borderRadius: '12px', bgcolor: '#F8FAFC', border: '1px dashed #E2E8F0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Box>
                  <Typography sx={{ fontSize: 11, fontWeight: 700, color: COLORS.textSecondary, textTransform: 'uppercase' }}>Security Key</Typography>
                  <Typography sx={{ fontWeight: 700, fontFamily: 'monospace' }}>{manageUser.accessKey}</Typography>
                </Box>
                <Button
                  size="small"
                  variant="outlined"
                  onClick={async () => { await adminService.regenerateAccessKey(manageUser._id); loadData(); }}
                  sx={{ borderRadius: '8px', textTransform: 'none', fontWeight: 600 }}
                >
                  Regenerate
                </Button>
              </Box>
            )}
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
          <Button onClick={() => setManageUser(null)} sx={{ color: COLORS.textSecondary, textTransform: 'none', fontWeight: 600 }}>Cancel</Button>
          <Button
            variant="contained"
            disableElevation
            onClick={async () => {
              if (manageUser?._id) {
                try {
                  await adminService.updateUserRole(manageUser._id, role, selectedOrgIds);
                  await adminService.updateUserProfile(manageUser._id, { fullName: manageUser.fullName, username: manageUser.username });
                  Swal.fire({ icon: 'success', title: 'User Updated', timer: 1500, showConfirmButton: false });
                } catch (error: any) {
                  Swal.fire({ icon: 'error', title: 'Update Failed', text: error.response?.data?.message || error.message });
                  return;
                }
              } else if (manageUser) {
                if (!manageUser.fullName?.trim() || !manageUser.email?.trim() || !createPassword?.trim()) {
                  Swal.fire({ icon: 'error', title: 'Validation Error', text: 'All fields are required' });
                  return;
                }

                try {
                  await adminService.createUser({
                    fullName: manageUser.fullName,
                    email: manageUser.email,
                    password: createPassword,
                    isAdmin: role === "admin",
                    role,
                    ...(selectedOrgIds.length > 0 ? { organizationIds: selectedOrgIds } : {})
                  });
                  Swal.fire({ icon: 'success', title: 'User Created', timer: 1500, showConfirmButton: false });
                  setCreatePassword("");
                } catch (error: any) {
                  Swal.fire({ icon: 'error', title: 'Creation Failed', text: error.response?.data?.message || error.message });
                  return;
                }
              }
              loadData();
              setManageUser(null);
            }}
            sx={{ borderRadius: COLORS.pillRadius, bgcolor: COLORS.black, textTransform: 'none', px: 4, fontWeight: 600, '&:hover': { bgcolor: '#222' } }}
          >
            {manageUser?._id ? "Save Changes" : "Create User"}
          </Button>
        </DialogActions>
      </Dialog>
      <DirectoryModal
        open={Boolean(viewingDirectoryRole)}
        onClose={() => setViewingDirectoryRole(null)}
        roleLabel={viewingDirectoryRole || ""}
        users={rows.filter(r => {
          const rName = r.role || (r.isAdmin ? 'admin' : 'student');
          return getRoleDisplay(rName) === viewingDirectoryRole;
        }).map(r => ({
          ...r,
          role: r.role || (r.isAdmin ? 'admin' : 'student')
        }))}
        onExport={() => {
          // Placeholder for export functionality
          const event = new CustomEvent('app:show-modal', {
            detail: {
              title: "Export Success",
              description: `${viewingDirectoryRole} list has been prepared for download.`,
              mode: 'success'
            }
          });
          window.dispatchEvent(event);
        }}
        onRefresh={loadData}
        organizations={organizations}
        onBulkUpdateStatus={handleBulkUpdateStatus}
        onBulkUpdateRole={handleBulkUpdateRole}
        isManageMode={isManagingDirectory}
      />
    </Box>
  );
}
