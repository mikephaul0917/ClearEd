import { useEffect, useMemo, useState, useCallback } from "react";
import Swal from 'sweetalert2';
import { adminService } from "../services";
import {
  Box, Typography, Card, CardContent, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Paper, FormControl, InputLabel,
  Select, MenuItem, Chip, Button, Dialog, DialogTitle, DialogContent,
  DialogActions, Alert, Grid, IconButton, Tooltip, LinearProgress,
  Pagination, Avatar, SelectChangeEvent, useTheme, useMediaQuery, Skeleton,
  TextField, InputAdornment, Switch, FormControlLabel
} from "@mui/material";
import {
  Visibility, Lock, LockOpen, Email, Business, Person,
  AdminPanelSettings, School, Security, History, FilterList, Refresh,
  Search, PersonAdd, Key, People as PeopleIcon
} from '@mui/icons-material';

// ─── Modern Bento Design System ──────────────────────────────────────────────
const COLORS = {
  pageBg: '#FFFFFF',
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
  const rowsPerPage = 10;

  const loadData = async () => {
    setLoading(true);
    onLoadingChange?.(true);
    try {
      // Add a deliberate 1000ms delay for visual feedback
      await new Promise(resolve => setTimeout(resolve, 1000));

      const [userData, instData, orgData] = await Promise.all([
        adminService.getUsers(),
        adminService.getInstitution(),
        adminService.getOrganizations()
      ]);
      setRows(userData || []);
      setInstitution(instData);
      setOrganizations(orgData || []);
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
      setSelectedOrgId(manageUser.organizationId || "");

      if (manageUser._id && (r === 'student' || r === 'officer')) {
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
      } else {
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
    return rows.filter(r => {
      const q = query.trim().toLowerCase();
      const emailMatch = r.email?.toLowerCase().includes(q);
      const usernameMatch = r.username?.toLowerCase().includes(q);
      const fullNameMatch = r.fullName?.toLowerCase().includes(q);
      const matchesQuery = !q || (emailMatch || usernameMatch || fullNameMatch);
      const matchesRole = !filters.role || r.role === filters.role;
      const statusValue = r.enabled ? 'active' : 'locked';
      const matchesStatus = !filters.status || statusValue === filters.status;
      return matchesQuery && matchesRole && matchesStatus;
    });
  }, [rows, query, filters]);

  const totalPages = Math.ceil(filtered.length / rowsPerPage);
  const paginatedRows = filtered.slice((page - 1) * rowsPerPage, page * rowsPerPage);

  const stats = useMemo(() => ({
    total: rows.length,
    students: rows.filter(r => r.role === 'student').length,
    officers: rows.filter(r => r.role === 'officer').length,
    disabled: rows.filter(r => !r.enabled).length
  }), [rows]);

  const getStatusStyle = (enabled: boolean) => {
    return enabled
      ? { color: '#065f46', bg: `${COLORS.teal}30`, label: 'Active' }
      : { color: '#9a3412', bg: `${COLORS.orange}25`, label: 'Locked' };
  };

  const getRoleIcon = (roleName?: string) => {
    switch (roleName?.toLowerCase()) {
      case 'admin': return <Business sx={{ fontSize: 18, color: COLORS.teal }} />;
      case 'dean': return <School sx={{ fontSize: 18, color: COLORS.lavender }} />;
      case 'officer': return <Security sx={{ fontSize: 18, color: '#d97706' }} />;
      case 'super_admin': return <AdminPanelSettings sx={{ fontSize: 18, color: COLORS.orange }} />;
      default: return <Person sx={{ fontSize: 18, color: COLORS.black }} />;
    }
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
      {/* ── Stats Bento Row ────────────────────────────────────────── */}
      <Box sx={{
        display: 'grid',
        gridTemplateColumns: { xs: 'repeat(2, 1fr)', md: 'repeat(4, 1fr)' },
        gap: 2, mb: 3,
      }}>
        {loading ? (
          [1, 2, 3, 4].map((i) => <Skeleton key={i} variant="rounded" height={100} sx={{ borderRadius: COLORS.cardRadius }} />)
        ) : ([
          { label: 'Total Users', value: stats.total, accent: COLORS.teal },
          { label: 'Total Students', value: stats.students, accent: COLORS.lavender },
          { label: 'Total Officers', value: stats.officers, accent: COLORS.orange },
          { label: 'Locked / Disabled', value: stats.disabled, accent: COLORS.yellow },
        ].map((stat) => (
          <Box key={stat.label} sx={{
            borderRadius: COLORS.cardRadius, p: 2.5,
            backgroundColor: `${stat.accent}${stat.accent === COLORS.yellow ? '30' : '12'}`,
            border: `1px solid ${stat.accent}20`,
            position: 'relative',
            overflow: 'hidden',
          }}>
            <Box sx={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: stat.accent, mb: 1.5 }} />
            <Typography sx={{
              fontSize: 11, fontWeight: 700, textTransform: 'uppercase',
              color: COLORS.textSecondary, mb: 0.5, letterSpacing: '0.1em'
            }}>
              {stat.label}
            </Typography>
            <Typography sx={{ fontWeight: 800, fontSize: 28, letterSpacing: '-1px', color: COLORS.textPrimary }}>
              {stat.value}
            </Typography>
          </Box>
        )))}
      </Box>


      {/* ── Filters Card ───────────────────────────────────────────── */}
      <Box sx={{
        borderRadius: COLORS.cardRadius, p: isSmallMobile ? 2 : 3,
        backgroundColor: `${COLORS.lavender}08`,
        border: `1px solid ${COLORS.lavender}15`, mb: 3,
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2.5 }}>
          <Box sx={{
            width: 36, height: 36, borderRadius: '10px',
            backgroundColor: `${COLORS.lavender}18`,
            display: 'flex', alignItems: 'center', justifyContent: 'center', mr: 1.5,
          }}>
            {loading ? <Skeleton variant="circular" width={18} height={18} /> : <FilterList sx={{ fontSize: 18, color: COLORS.black }} />}
          </Box>
          <Box>
            {loading ? (
              <>
                <Skeleton variant="text" width={100} height={20} />
                <Skeleton variant="text" width={200} height={15} />
              </>
            ) : (
              <>
                <Typography sx={{ fontFamily: fontStack, fontSize: 15, fontWeight: 700, color: COLORS.textPrimary, mb: 0.25 }}>
                  Filter Users
                </Typography>
                <Typography sx={{ fontFamily: fontStack, fontSize: 12, color: COLORS.textSecondary }}>
                  Search name/email and refine by role or status
                </Typography>
              </>
            )}
          </Box>
        </Box>

        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap', flexDirection: isSmallMobile ? 'column' : 'row' }}>
          {loading ? (
            <>
              <Skeleton variant="rounded" sx={{ flex: 1, minWidth: 200, height: 40, borderRadius: '12px' }} />
              <Skeleton variant="rounded" sx={{ width: isSmallMobile ? '100%' : 150, height: 40, borderRadius: '12px' }} />
              <Skeleton variant="rounded" sx={{ width: isSmallMobile ? '100%' : 150, height: 40, borderRadius: '12px' }} />
              <Skeleton variant="rounded" sx={{ width: isSmallMobile ? '100%' : 130, height: 40, borderRadius: COLORS.pillRadius }} />
            </>
          ) : (
            <>
              <TextField
                fullWidth={isSmallMobile}
                placeholder="Search users..."
                value={query}
                size="small"
                onChange={(e) => { setQuery(e.target.value); setPage(1); }}
                InputProps={{
                  startAdornment: <InputAdornment position="start"><Search sx={{ fontSize: 20, color: COLORS.textSecondary }} /></InputAdornment>,
                  sx: { borderRadius: '12px', bgcolor: '#F8FAFC', fontSize: 14 }
                }}
                sx={{ flex: 1, minWidth: 200 }}
              />
              <FormControl size="small" sx={{ minWidth: isSmallMobile ? '100%' : 150 }}>
                <Select value={filters.role} displayEmpty onChange={handleRoleChange} sx={selectSx}>
                  <MenuItem value="">All Roles</MenuItem>
                  <MenuItem value="student">Student</MenuItem>
                  <MenuItem value="officer">Officer</MenuItem>
                  <MenuItem value="dean">Dean</MenuItem>
                  <MenuItem value="admin">Admin</MenuItem>
                </Select>
              </FormControl>
              <FormControl size="small" sx={{ minWidth: isSmallMobile ? '100%' : 150 }}>
                <Select value={filters.status} displayEmpty onChange={handleStatusChange} sx={selectSx}>
                  <MenuItem value="">All Status</MenuItem>
                  <MenuItem value="active">Active</MenuItem>
                  <MenuItem value="locked">Locked</MenuItem>
                </Select>
              </FormControl>
              <Button
                variant="contained"
                disableElevation
                fullWidth={isSmallMobile}
                startIcon={<PersonAdd />}
                onClick={() => {
                  setManageUser({
                    _id: "",
                    username: "",
                    fullName: "",
                    email: "",
                    isAdmin: false,
                    enabled: true,
                    accessKey: ""
                  });
                  setCreatePassword("");
                }}
                sx={{
                  borderRadius: COLORS.pillRadius, bgcolor: COLORS.black,
                  textTransform: 'none', px: 3, py: 1, fontWeight: 600,
                  fontSize: 13,
                  '&:hover': { bgcolor: '#222' }
                }}
              >
                Create User
              </Button>
            </>
          )}
        </Box>
      </Box>

      {/* ── Users Table ────────────────────────────────────────────── */}
      <Box sx={{
        borderRadius: COLORS.cardRadius, p: isSmallMobile ? 2 : 3,
        backgroundColor: `${COLORS.teal}06`,
        border: `1px solid ${COLORS.teal}12`,
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
          <Box sx={{
            width: 36, height: 36, borderRadius: '10px',
            backgroundColor: `${COLORS.teal}18`,
            display: 'flex', alignItems: 'center', justifyContent: 'center', mr: 1.5,
          }}>
            {loading ? <Skeleton variant="circular" width={18} height={18} /> : <PeopleIcon sx={{ fontSize: 18, color: COLORS.black }} />}
          </Box>
          <Box>
            {loading ? (
              <>
                <Skeleton variant="text" width={140} height={24} sx={{ mb: 0.5 }} />
                <Skeleton variant="text" width={220} height={16} />
              </>
            ) : (
              <>
                <Typography sx={{ fontFamily: fontStack, fontSize: 15, fontWeight: 700, color: COLORS.textPrimary, mb: 0.25 }}>
                  Users Overview
                </Typography>
                <Typography sx={{ fontFamily: fontStack, fontSize: 12, color: COLORS.textSecondary }}>
                  Manage and monitor all system users
                </Typography>
              </>
            )}
          </Box>
        </Box>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow sx={{ backgroundColor: '#F8FAFC' }}>
                {['User', 'Role', 'Status', 'Access Key', 'Actions'].map((h) => (
                  <TableCell key={h} sx={{
                    fontSize: 11, fontWeight: 700, color: COLORS.textSecondary,
                    textTransform: 'uppercase', letterSpacing: '0.08em', py: 2
                  }}>
                    {loading ? <Skeleton variant="text" width={h === 'Actions' ? "40%" : "60%"} height={20} sx={{ ml: h === 'Actions' ? 'auto' : 0 }} /> : h}
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                [1, 2, 3, 4, 5].map((i) => (
                  <TableRow key={i}>
                    {[1, 2, 3, 4, 5].map((c) => <TableCell key={c}><Skeleton variant="text" /></TableCell>)}
                  </TableRow>
                ))
              ) : (
                paginatedRows.map((user) => {
                  const status = getStatusStyle(user.enabled);
                  return (
                    <TableRow key={user._id} hover sx={{ '&:last-child td': { border: 0 } }}>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                          <Avatar sx={{ bgcolor: `${COLORS.lavender}25`, color: COLORS.black, fontWeight: 700, fontSize: 14 }}>
                            {(user.fullName || user.username)?.charAt(0)}
                          </Avatar>
                          <Box>
                            <Typography sx={{ fontWeight: 700, fontSize: 14 }}>{maskName(user.fullName || user.username || "")}</Typography>
                            <Typography sx={{ fontSize: 12, color: COLORS.textSecondary }}>{maskEmail(user.email)}</Typography>
                          </Box>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          {getRoleIcon(user.role || (user.isAdmin ? 'admin' : 'student'))}
                          <Typography sx={{ fontSize: 13, fontWeight: 500 }}>
                            {user.role || (user.isAdmin ? 'Admin' : 'Student')}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={status.label}
                          size="small"
                          sx={{
                            borderRadius: COLORS.pillRadius, fontWeight: 700, fontSize: 10,
                            bgcolor: status.bg, color: status.color, textTransform: 'uppercase',
                          }}
                        />
                      </TableCell>
                      <TableCell sx={{ fontSize: 13, color: COLORS.textSecondary, fontFamily: 'monospace' }}>
                        {user.accessKey}
                      </TableCell>
                      <TableCell align="right">
                        <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
                          <Tooltip title="View">
                            <IconButton size="small" onClick={() => setViewUser(user)}>
                              <Visibility fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Manage">
                            <IconButton size="small" onClick={() => setManageUser(user)}>
                              <Key fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title={user.enabled ? "Lock" : "Unlock"}>
                            <IconButton size="small" onClick={() => toggleStatus(user)} sx={{ color: user.enabled ? COLORS.orange : COLORS.teal }}>
                              {user.enabled ? <Lock fontSize="small" /> : <LockOpen fontSize="small" />}
                            </IconButton>
                          </Tooltip>
                        </Box>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </TableContainer>
        <Box sx={{ mt: 3, display: 'flex', justifyContent: 'center' }}>
          <Pagination count={totalPages} page={page} onChange={(_, v) => setPage(v)} />
        </Box>
      </Box>

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
                  <Typography sx={{ fontWeight: 700, color: viewUser.enabled ? COLORS.teal : COLORS.orange }}>{viewUser.enabled ? "Enabled" : "Disabled"}</Typography>
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
                <InputLabel>Assign to Organization</InputLabel>
                <Select
                  value={selectedOrgId}
                  label="Assign to Organization"
                  onChange={(e) => setSelectedOrgId(e.target.value as string)}
                  sx={{ borderRadius: '12px' }}
                >
                  <MenuItem value=""><em>None</em></MenuItem>
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
                        } catch(e) { console.error(e); }
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
                      } catch(error: any) {
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
                      } catch(e: any) {
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
                  await adminService.updateUserRole(manageUser._id, role, selectedOrgId ? selectedOrgId : undefined);
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
                    ...(selectedOrgId ? { organizationId: selectedOrgId } : {})
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
    </Box>
  );
}
