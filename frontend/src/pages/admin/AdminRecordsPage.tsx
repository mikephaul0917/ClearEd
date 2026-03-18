import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  IconButton,
  Tooltip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Button,
  Alert,
  Skeleton,
  Badge,
  Tabs,
  Tab,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Divider,
  Avatar,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import {
  Security,
  Refresh,
  Download,
  Search,
  Visibility,
  Person,
  Schedule,
  AdminPanelSettings,
  Assessment,
  PriorityHigh,
  Info,
  History,
  Error as ErrorIcon,
} from '@mui/icons-material';
import { adminService } from '../../services';

// --- DESIGN TOKENS (Matching AdminPage) ---
const COLORS = {
  black: '#0a0a0a',
  textPrimary: '#000000',
  textSecondary: '#64748B',
  accent: '#0a0a0a',
  teal: '#5fcca0',
  lavender: '#cb9bfb',
  yellow: '#FEF08A',
  orange: '#ff895d',
  border: '#E2E8F0',
  cardRadius: '16px',
};

const fontStack = "'Inter', 'Plus Jakarta Sans', 'Montserrat', sans-serif";

interface AuditLog {
  _id: string;
  userId: string;
  userName?: string;
  userEmail?: string;
  action: string;
  resource: string;
  details: string;
  ipAddress: string;
  userAgent: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  category: string;
  createdAt: string;
}

export default function AdminRecordsPage({
  refreshTrigger = 0,
  onLoadingChange
}: {
  refreshTrigger?: number;
  onLoadingChange?: (loading: boolean) => void;
}) {
  const theme = useTheme();
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tabValue, setTabValue] = useState(0);
  const [filters, setFilters] = useState({
    action: '',
    severity: '',
    category: '',
    dateRange: '7d'
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalLogs, setTotalLogs] = useState(0);
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);

  const fetchAuditLogs = useCallback(async (isFullLoad: boolean = false) => {
    setLoading(true);
    if (isFullLoad) {
      onLoadingChange?.(true);
    }
    setError(null);
    try {
      const params = {
        page: page.toString(),
        limit: '50',
        ...(filters.action && { action: filters.action }),
        ...(filters.severity && { severity: filters.severity }),
        ...(filters.category && { category: filters.category }),
        ...(filters.dateRange && { dateRange: filters.dateRange }),
        ...(searchTerm && { search: searchTerm })
      };

      const response = await adminService.getAuditLogs(params);
      if (response.success) {
        setLogs(response.data.logs);
        setTotalPages(response.data.pagination.totalPages);
        setTotalLogs(response.data.pagination.total);
      } else {
        throw new Error(response.message || 'Failed to fetch audit logs');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Failed to fetch audit logs');
      console.error('Error fetching audit logs:', err);
    } finally {
      // Small artificial delay for premium feel
      setTimeout(() => {
        setLoading(false);
        setIsInitialLoad(false);
        onLoadingChange?.(false);
      }, 500);
    }
  }, [filters, page, searchTerm, onLoadingChange]);

  useEffect(() => {
    const isFull = refreshTrigger > 0 || isInitialLoad;
    if (isFull) setIsInitialLoad(true);
    fetchAuditLogs(isFull);
  }, [fetchAuditLogs, refreshTrigger]);

  const handleTabChange = (_: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
    // Filter categories based on tabs
    let category = '';
    if (newValue === 1) category = 'security';
    if (newValue === 3) category = 'admin';

    setFilters(prev => ({ ...prev, category }));
    setPage(1);
  };

  const handleFilterChange = (field: string, value: string) => {
    setFilters(prev => ({ ...prev, [field]: value }));
    setPage(1);
  };

  const handleExport = async () => {
    try {
      const params = {
        ...(filters.action && { action: filters.action }),
        ...(filters.severity && { severity: filters.severity }),
        ...(filters.category && { category: filters.category }),
        ...(filters.dateRange && { dateRange: filters.dateRange }),
        ...(searchTerm && { search: searchTerm })
      };

      const response = await adminService.exportAuditLogs(params);
      if (response.success) {
        const blob = new Blob([JSON.stringify(response.data, null, 2)], { type: 'application/json' });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `audit-logs-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
      }
    } catch (err: any) {
      console.error('Error exporting audit logs:', err);
    }
  };

  const getActionIcon = (action: string) => {
    const iconMap: { [key: string]: React.ReactNode } = {
      'LOGIN_SUCCESS': <Person />,
      'LOGIN_FAILED': <ErrorIcon color="error" />,
      'CLEARANCE_SUBMITTED': <Assessment />,
      'CLEARANCE_APPROVED': <Assessment sx={{ color: '#d97706' }} />,
      'CLEARANCE_REJECTED': <ErrorIcon color="error" />,
      'USER_CREATED': <Person />,
      'USER_CREATED_BY_ADMIN': <AdminPanelSettings />,
      'USER_DISABLED': <Security color="error" />,
      'ADMIN_ACTION': <AdminPanelSettings />,
      'SECURITY_ALERT': <PriorityHigh color="error" />,
    };
    return iconMap[action] || <History />;
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'error';
      case 'high': return 'error';
      case 'medium': return 'warning';
      case 'low': return 'warning';
      default: return 'default';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  const filterLogsByTab = (logsToFilter: AuditLog[]) => {
    if (tabValue === 0) return logsToFilter;
    if (tabValue === 1) return logsToFilter.filter(l => l.category === 'security' || l.action.includes('FAILED') || l.severity === 'critical');
    if (tabValue === 2) return logsToFilter.filter(l => l.action.includes('LOGIN'));
    if (tabValue === 3) return logsToFilter.filter(l => l.category === 'admin' || l.category === 'user_management');
    return logsToFilter;
  };

  const filteredLogs = filterLogsByTab(logs);

  // --- Custom Skeleton Components ---
  const StatCardSkeleton = ({
    bg, textColor, accentOpacity = 0.6, isDark = false,
    titleWidth = "40%", valueWidth = "25%", subWidth = "50%",
    height = 140
  }: {
    bg: string, textColor: string, accentOpacity?: number, isDark?: boolean,
    titleWidth?: string | number, valueWidth?: string | number, subWidth?: string | number,
    height?: number | string
  }) => (
    <Box sx={{
      p: 3, borderRadius: COLORS.cardRadius, backgroundColor: '#FFFFFF', color: textColor,
      minHeight: height, display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
      position: 'relative', overflow: 'hidden', border: `1px solid ${COLORS.border}`
    }}>
      {isDark && <Box sx={{ position: 'absolute', top: -20, right: -20, width: 100, height: 100, borderRadius: '50%', backgroundColor: COLORS.teal, opacity: 0.1, filter: 'blur(30px)' }} />}
      <Box>
        <Skeleton
          variant="text" width={titleWidth} height={14}
          sx={{ opacity: accentOpacity, bgcolor: isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.08)' }}
        />
        <Skeleton
          variant="text" width={valueWidth} height={48}
          sx={{ mt: 1, bgcolor: isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.06)' }}
        />
      </Box>
      <Skeleton
        variant="text" width={subWidth} height={16}
        sx={{ opacity: 0.5, bgcolor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)' }}
      />
    </Box>
  );

  const isSmallMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const LogCard = ({ log }: { log: AuditLog }) => {
    const s = getSeverityColor(log.severity);
    return (
      <Box sx={{ p: 2, borderRadius: '12px', bgcolor: '#FFF', border: `1px solid ${COLORS.border}`, mb: 1.5 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {getActionIcon(log.action)}
            <Typography sx={{ fontWeight: 700, fontSize: 13, textTransform: 'lowercase' }}>{log.action.replace(/_/g, ' ')}</Typography>
          </Box>
          <Chip
            label={log.severity}
            size="small"
            sx={{
              height: 18, fontSize: 10, fontWeight: 700, textTransform: 'uppercase', borderRadius: '4px',
              ...(log.severity === 'low' ? { bgcolor: COLORS.yellow, color: '#854d0e' } : {
                bgcolor: s === 'error' ? '#fee2e2' : s === 'warning' ? '#ffedd5' : '#f1f5f9',
                color: s === 'error' ? '#991b1b' : s === 'warning' ? '#9a3412' : '#475569'
              })
            }}
          />
        </Box>
        <Typography sx={{ fontSize: 12, color: COLORS.textSecondary, mb: 0.5 }}>{log.resource}</Typography>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', mt: 1 }}>
          <Box>
            <Typography sx={{ fontSize: 12, fontWeight: 600 }}>{log.userName || 'System'}</Typography>
            <Typography sx={{ fontSize: 10, color: COLORS.textSecondary }}>{formatDate(log.createdAt)}</Typography>
          </Box>
          <IconButton size="small" onClick={() => { setSelectedLog(log); setDetailsOpen(true); }} sx={{ border: `1px solid ${COLORS.border}`, borderRadius: '6px' }}>
            <Visibility sx={{ fontSize: 14 }} />
          </IconButton>
        </Box>
      </Box>
    );
  };

  const LogCardSkeleton = () => (
    <Box sx={{ p: 2, borderRadius: '12px', bgcolor: '#FFF', border: `1px solid ${COLORS.border}`, mb: 1.5 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Skeleton variant="rectangular" width={20} height={20} sx={{ borderRadius: '4px', opacity: 0.5 }} />
          <Skeleton variant="text" width={80} height={14} />
        </Box>
        <Skeleton variant="rectangular" width={50} height={18} sx={{ borderRadius: '4px', opacity: 0.4 }} />
      </Box>
      <Skeleton variant="text" width="60%" height={12} sx={{ mb: 1.5 }} />
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <Box>
          <Skeleton variant="text" width={70} height={14} />
          <Skeleton variant="text" width={100} height={10} />
        </Box>
        <Skeleton variant="circular" width={28} height={28} />
      </Box>
    </Box>
  );

  return (
    <Box sx={{ mt: 2 }}>


      {error && (
        <Alert severity="error" sx={{ mb: 3, borderRadius: '12px' }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}
      {/* --- Bento Grid Stats --- */}
      <Grid container spacing={2} sx={{ mb: 4 }}>
        <Grid item xs={12} md={8}>
          {loading && isInitialLoad ? (
            <StatCardSkeleton
              bg="#FFFFFF" textColor={COLORS.textPrimary}
              titleWidth={110} valueWidth={210} subWidth={320}
              height={220}
            />
          ) : (
            <Box sx={{
              p: 3, borderRadius: COLORS.cardRadius, backgroundColor: COLORS.black, color: '#fff',
              minHeight: 220, display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
              position: 'relative', overflow: 'hidden'
            }}>
              <Box sx={{ position: 'absolute', top: -20, right: -20, width: 140, height: 140, borderRadius: '50%', backgroundColor: COLORS.teal, opacity: 0.15, filter: 'blur(40px)' }} />
              <Box>
                <Typography sx={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', opacity: 0.6, textTransform: 'uppercase' }}>System Overview</Typography>
                <Typography sx={{ fontSize: 32, fontWeight: 800, mt: 1 }}>{totalLogs.toLocaleString()} Records</Typography>
              </Box>
              <Typography sx={{ fontSize: 13, opacity: 0.5 }}>Real-time interactions recorded across the entire clearance ecosystem. All systems operational.</Typography>
            </Box>
          )}
        </Grid>
        <Grid item xs={12} md={4}>
          <Box sx={{ display: 'grid', gridTemplateRows: '1fr 1fr', gap: 2, height: '100%' }}>
            {loading && isInitialLoad ? (
              <StatCardSkeleton
                bg="#FFFFFF" textColor={COLORS.textPrimary}
                titleWidth={110} valueWidth={60} subWidth={180}
                height={102}
              />
            ) : (
              <Box sx={{
                p: 2.5, borderRadius: COLORS.cardRadius, backgroundColor: COLORS.teal, color: COLORS.black,
                minHeight: 102, display: 'flex', flexDirection: 'column', justifyContent: 'space-between'
              }}>
                <Box>
                  <Typography sx={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', opacity: 0.6, textTransform: 'uppercase' }}>Security Events</Typography>
                  <Typography sx={{ fontSize: 28, fontWeight: 800 }}>{logs.filter(l => l.category === 'security' || l.severity === 'high').length}</Typography>
                </Box>
                <Typography sx={{ fontSize: 12, fontWeight: 600 }}>Active monitoring enabled</Typography>
              </Box>
            )}

            {loading && isInitialLoad ? (
              <StatCardSkeleton
                bg="#FFFFFF" textColor={COLORS.textPrimary}
                titleWidth={100} valueWidth={140} subWidth={100}
                height={102}
              />
            ) : (
              <Box sx={{
                p: 2.5, borderRadius: COLORS.cardRadius, backgroundColor: COLORS.lavender, color: COLORS.black,
                minHeight: 102, display: 'flex', flexDirection: 'column', justifyContent: 'space-between'
              }}>
                <Box>
                  <Typography sx={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', opacity: 0.6, textTransform: 'uppercase' }}>Last Activity</Typography>
                  <Typography sx={{ fontSize: 18, fontWeight: 800 }}>{logs[0] ? formatDate(logs[0].createdAt).split(',')[1] : '—'}</Typography>
                </Box>
                <Typography sx={{ fontSize: 12, fontWeight: 600 }}>Real-time trail</Typography>
              </Box>
            )}
          </Box>
        </Grid>
      </Grid>

      {/* --- Filter Bar --- */}
      <Card sx={{ borderRadius: COLORS.cardRadius, border: '1px solid ' + COLORS.border, boxShadow: 'none', mb: 3 }}>
        <CardContent sx={{ p: 2 }}>
          {loading && isInitialLoad ? (
            <Grid container spacing={2} alignItems="center">
              <Grid item xs={12} md={4}>
                <Skeleton variant="rectangular" height={40} sx={{ borderRadius: '12px' }} />
              </Grid>
              <Grid item xs={6} md={2}>
                <Skeleton variant="rectangular" height={40} sx={{ borderRadius: '12px' }} />
              </Grid>
              <Grid item xs={6} md={2}>
                <Skeleton variant="rectangular" height={40} sx={{ borderRadius: '12px' }} />
              </Grid>
              <Grid item xs={12} md={4} sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
                <Skeleton variant="circular" width={40} height={40} />
                <Skeleton variant="rectangular" width={130} height={40} sx={{ borderRadius: '12px' }} />
              </Grid>
            </Grid>
          ) : (
            <Grid container spacing={2} alignItems="center">
              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  size="small"
                  placeholder="Search by action, resource, or details..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  InputProps={{
                    startAdornment: <Search sx={{ color: COLORS.textSecondary, mr: 1, fontSize: 20 }} />,
                    sx: { borderRadius: '12px' }
                  }}
                />
              </Grid>
              <Grid item xs={6} md={2}>
                <FormControl fullWidth size="small">
                  <InputLabel>Date Range</InputLabel>
                  <Select
                    value={filters.dateRange}
                    label="Date Range"
                    onChange={(e) => handleFilterChange('dateRange', e.target.value)}
                    sx={{ borderRadius: '12px' }}
                  >
                    <MenuItem value="1d">Last 24 Hours</MenuItem>
                    <MenuItem value="7d">Last 7 Days</MenuItem>
                    <MenuItem value="30d">Last 30 Days</MenuItem>
                    <MenuItem value="90d">Last 90 Days</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={6} md={2}>
                <FormControl fullWidth size="small">
                  <InputLabel>Severity</InputLabel>
                  <Select
                    value={filters.severity}
                    label="Severity"
                    onChange={(e) => handleFilterChange('severity', e.target.value)}
                    sx={{ borderRadius: '12px' }}
                  >
                    <MenuItem value="">All Severities</MenuItem>
                    <MenuItem value="critical">Critical</MenuItem>
                    <MenuItem value="high">High</MenuItem>
                    <MenuItem value="medium">Medium</MenuItem>
                    <MenuItem value="low">Low</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={4} sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
                <Tooltip title="Refresh Logs">
                  <IconButton 
                    onClick={() => {
                      setIsInitialLoad(true);
                      fetchAuditLogs(true);
                    }} 
                    sx={{ border: '1px solid ' + COLORS.border }}
                  >
                    <Refresh />
                  </IconButton>
                </Tooltip>
                <Button
                  variant="outlined"
                  startIcon={<Download />}
                  onClick={handleExport}
                  sx={{
                    borderRadius: '12px', textTransform: 'none', fontWeight: 700,
                    borderColor: COLORS.yellow, backgroundColor: COLORS.yellow + '15',
                    color: COLORS.black,
                    '&:hover': { borderColor: '#EAB308', backgroundColor: COLORS.yellow + '30' }
                  }}
                >
                  Export JSON
                </Button>
              </Grid>
            </Grid>
          )}
        </CardContent>
      </Card>

      {/* --- Tabs & Table --- */}
      <Card sx={{ borderRadius: COLORS.cardRadius, border: '1px solid ' + COLORS.border, boxShadow: 'none', overflow: 'hidden' }}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider', px: 2, pt: 1, backgroundColor: '#FAFAFA' }}>
          <Tabs
            value={tabValue}
            onChange={handleTabChange}
            sx={{
              '& .MuiTab-root': {
                textTransform: 'none',
                fontWeight: 600,
                fontSize: 14,
                minHeight: 48,
              },
              '& .Mui-selected': { color: COLORS.black + ' !important' },
              '& .MuiTabs-indicator': { backgroundColor: (loading && isInitialLoad) ? 'rgba(0,0,0,0.08)' : COLORS.black, height: 3, borderRadius: '3px 3px 0 0' }
            }}
          >
            <Tab label={(loading && isInitialLoad) ? <Skeleton width={100} height={20} /> : "System Records"} />
            <Tab label={(loading && isInitialLoad) ? <Skeleton width={110} height={20} /> : "Security & Alerts"} />
            <Tab label={(loading && isInitialLoad) ? <Skeleton width={80} height={20} /> : "Access Logs"} />
            <Tab label={(loading && isInitialLoad) ? <Skeleton width={100} height={20} /> : "Admin Actions"} />
          </Tabs>
        </Box>

        {isSmallMobile ? (
          <Box sx={{ p: 2, backgroundColor: '#FAFAFA' }}>
            {loading ? (
              [...Array(5)].map((_, i) => <LogCardSkeleton key={i} />)
            ) : filteredLogs.length > 0 ? (
              filteredLogs.map(log => <LogCard key={log._id} log={log} />)
            ) : (
              <Box sx={{ py: 6, textAlign: 'center' }}>
                <History sx={{ fontSize: 48, color: COLORS.border, mb: 1 }} />
                <Typography color="textSecondary">No activity records found.</Typography>
              </Box>
            )}
          </Box>
        ) : (
          <TableContainer>
            <Table sx={{ minWidth: 650 }}>
              <TableHead sx={{ backgroundColor: '#F8FAFC' }}>
                <TableRow>
                  <TableCell sx={{ fontWeight: 700, color: COLORS.textSecondary, fontSize: 12, textTransform: 'uppercase' }}>
                    {loading ? <Skeleton width={80} /> : "Timestamp"}
                  </TableCell>
                  <TableCell sx={{ fontWeight: 700, color: COLORS.textSecondary, fontSize: 12, textTransform: 'uppercase' }}>
                    {loading ? <Skeleton width={60} /> : "Initiator"}
                  </TableCell>
                  <TableCell sx={{ fontWeight: 700, color: COLORS.textSecondary, fontSize: 12, textTransform: 'uppercase' }}>
                    {loading ? <Skeleton width={60} /> : "Action"}
                  </TableCell>
                  <TableCell sx={{ fontWeight: 700, color: COLORS.textSecondary, fontSize: 12, textTransform: 'uppercase' }}>
                    {loading ? <Skeleton width={70} /> : "Resource"}
                  </TableCell>
                  <TableCell sx={{ fontWeight: 700, color: COLORS.textSecondary, fontSize: 12, textTransform: 'uppercase' }}>
                    {loading ? <Skeleton width={60} /> : "Severity"}
                  </TableCell>
                  <TableCell align="right" sx={{ fontWeight: 700, color: COLORS.textSecondary, fontSize: 12, textTransform: 'uppercase' }}>
                    {loading ? <Skeleton width={40} /> : "View"}
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loading ? (
                  [...Array(6)].map((_, i) => (
                    <TableRow key={i}>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Schedule sx={{ fontSize: 16, border: 'none', color: '#E2E8F0' }} />
                          <Skeleton variant="text" width={140} />
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                          <Skeleton variant="circular" width={32} height={32} />
                          <Box>
                            <Skeleton variant="text" width={100} height={20} />
                            <Skeleton variant="text" width={140} height={16} />
                          </Box>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Skeleton variant="rectangular" width={20} height={20} sx={{ borderRadius: '4px', opacity: 0.5 }} />
                          <Skeleton variant="text" width={80} />
                        </Box>
                      </TableCell>
                      <TableCell><Skeleton variant="text" width={100} /></TableCell>
                      <TableCell>
                        <Skeleton variant="rectangular" width={60} height={20} sx={{ borderRadius: '6px', opacity: 0.6 }} />
                      </TableCell>
                      <TableCell align="right">
                        <Skeleton variant="circular" width={32} height={32} />
                      </TableCell>
                    </TableRow>
                  ))
                ) : filteredLogs.length > 0 ? (
                  filteredLogs.map((log) => (
                    <TableRow key={log._id} hover sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                      <TableCell sx={{ fontSize: 13, color: COLORS.textPrimary }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Schedule sx={{ fontSize: 16, color: COLORS.textSecondary }} />
                          {formatDate(log.createdAt)}
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                          <Avatar sx={{ width: 32, height: 32, bgcolor: `${COLORS.lavender}25`, color: '#000', fontSize: 14 }}>{log.userName?.[0] || 'S'}</Avatar>
                          <Box>
                            <Typography sx={{ fontSize: 14, fontWeight: 700 }}>{log.userName || 'System'}</Typography>
                            <Typography sx={{ fontSize: 12, color: COLORS.textSecondary }}>{log.userEmail}</Typography>
                          </Box>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          {getActionIcon(log.action)}
                          <Typography sx={{ fontSize: 13, fontWeight: 600, textTransform: 'lowercase' }}>
                            {log.action.replace(/_/g, ' ')}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell sx={{ fontSize: 13, fontWeight: 500 }}>{log.resource}</TableCell>
                      <TableCell>
                        <Chip
                          label={log.severity}
                          size="small"
                          sx={{
                            fontWeight: 700, fontSize: 10, textTransform: 'uppercase', height: 20, borderRadius: '6px',
                            ...({
                              low: { backgroundColor: COLORS.yellow, color: '#854d0e' },
                              critical: { backgroundColor: '#fee2e2', color: '#991b1b' },
                              high: { backgroundColor: '#fee2e2', color: '#991b1b' },
                              medium: { backgroundColor: '#ffedd5', color: '#9a3412' }
                            }[log.severity] || { backgroundColor: '#f1f5f9', color: '#475569' })
                          }}
                        />
                      </TableCell>
                      <TableCell align="right">
                        <IconButton
                          size="small"
                          onClick={() => {
                            setSelectedLog(log);
                            setDetailsOpen(true);
                          }}
                          sx={{ border: '1px solid ' + COLORS.border, borderRadius: '8px' }}
                        >
                          <Visibility fontSize="small" />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={6} align="center" sx={{ py: 8 }}>
                      <History sx={{ fontSize: 48, color: COLORS.border, mb: 1 }} />
                      <Typography color="textSecondary">No activity records found matching your filters.</Typography>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        )}

        {/* --- Pagination --- */}
        <Box sx={{ p: 2, display: 'flex', justifyContent: 'center', borderTop: '1px solid ' + COLORS.border }}>
          {loading ? (
            <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
              <Skeleton variant="rectangular" width={80} height={32} sx={{ borderRadius: '8px' }} />
              <Skeleton variant="text" width={100} height={24} />
              <Skeleton variant="rectangular" width={80} height={32} sx={{ borderRadius: '8px' }} />
            </Box>
          ) : (
            <>
              <Button
                size="small"
                disabled={page === 1}
                onClick={() => setPage(page - 1)}
                sx={{ mr: 1, textTransform: 'none', fontWeight: 600, borderRadius: '8px' }}
              >
                ← Previous
              </Button>
              <Typography sx={{ mx: 2, fontSize: 13, color: COLORS.textSecondary, display: 'flex', alignItems: 'center' }}>
                Page {page} of {totalPages}
              </Typography>
              <Button
                size="small"
                disabled={page === totalPages}
                onClick={() => setPage(page + 1)}
                sx={{ ml: 1, textTransform: 'none', fontWeight: 600, borderRadius: '8px' }}
              >
                Next →
              </Button>
            </>
          )}
        </Box>
      </Card>

      {/* --- Details Dialog --- */}
      <Dialog
        open={detailsOpen}
        onClose={() => setDetailsOpen(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{ sx: { borderRadius: COLORS.cardRadius } }}
      >
        <DialogTitle sx={{ fontWeight: 800, pb: 1 }}>Log Details</DialogTitle>
        <DialogContent>
          {selectedLog && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, mt: 1 }}>
              <Box>
                <Typography variant="overline" sx={{ color: COLORS.textSecondary, fontWeight: 700 }}>Action Context</Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mt: 1, p: 2, borderRadius: '12px', border: '1px solid ' + COLORS.border, backgroundColor: '#F8FAFC' }}>
                  {getActionIcon(selectedLog.action)}
                  <Box>
                    <Typography sx={{ fontWeight: 800, fontSize: 16 }}>{selectedLog.action}</Typography>
                    <Typography sx={{ fontSize: 13, color: COLORS.textSecondary }}>{selectedLog.resource}</Typography>
                  </Box>
                  <Box sx={{ ml: 'auto' }}>
                    <Chip
                      label={selectedLog.severity.toUpperCase()}
                      size="small"
                      color={getSeverityColor(selectedLog.severity) as any}
                      sx={{ fontWeight: 800, fontSize: 10 }}
                    />
                  </Box>
                </Box>
              </Box>

              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <Typography variant="overline" sx={{ color: COLORS.textSecondary, fontWeight: 700 }}>Initiator</Typography>
                  <Typography sx={{ fontWeight: 600 }}>{selectedLog.userName}</Typography>
                  <Typography sx={{ fontSize: 12, color: COLORS.textSecondary }}>{selectedLog.userEmail}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="overline" sx={{ color: COLORS.textSecondary, fontWeight: 700 }}>Network</Typography>
                  <Typography sx={{ fontWeight: 600, fontFamily: 'monospace', fontSize: 13 }}>{selectedLog.ipAddress}</Typography>
                  <Typography sx={{ fontSize: 12, color: COLORS.textSecondary }}>Source IP</Typography>
                </Grid>
              </Grid>

              <Divider />

              <Box>
                <Typography variant="overline" sx={{ color: COLORS.textSecondary, fontWeight: 700 }}>Activity Payload</Typography>
                <Box sx={{
                  mt: 1, p: 2, borderRadius: '12px', backgroundColor: '#F1F5F9',
                  fontFamily: 'monospace', fontSize: 12, overflowX: 'auto',
                  border: '1px solid ' + COLORS.border
                }}>
                  {selectedLog.details}
                </Box>
              </Box>

              <Box>
                <Typography variant="overline" sx={{ color: COLORS.textSecondary, fontWeight: 700 }}>User Agent</Typography>
                <Typography sx={{ fontSize: 11, color: COLORS.textSecondary, mt: 0.5 }}>{selectedLog.userAgent}</Typography>
              </Box>
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
          <Button
            fullWidth
            variant="contained"
            onClick={() => setDetailsOpen(false)}
            sx={{ backgroundColor: COLORS.black, color: '#fff', borderRadius: '12px', py: 1.5, fontWeight: 700, '&:hover': { backgroundColor: '#222' } }}
          >
            Close Details
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
