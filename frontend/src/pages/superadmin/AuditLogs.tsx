import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Chip,
  IconButton,
  Tooltip,
  TextField,
  Button,
  Alert,
  Skeleton,
  Badge,
  Divider,
  Avatar,
  useTheme,
  useMediaQuery,
  Menu,
  MenuItem,
  CircularProgress,
  Dialog,
  DialogContent
} from '@mui/material';
import { motion, AnimatePresence } from 'framer-motion';
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
  ChevronRight,
  ChevronLeft,
  LocationOn,
  AccessTime,
  MoreHoriz,
  FilterList as FilterIcon,
  Business
} from '@mui/icons-material';
import { superAdminService } from '../../services';

// --- DESIGN TOKENS ---
const COLORS = {
  black: '#0a0a0a',
  textPrimary: '#000000',
  textSecondary: '#64748B',
  accent: '#0a0a0a',
  teal: '#5eead4',
  lavender: '#d8b4fe',
  yellow: '#FEF08A',
  orange: '#ff895d',
  yellowDark: '#854d0e',
  darkTeal: '#0D9488',
  border: '#E2E8F0',
  cardRadius: '24px', // Larger radius for Super Admin "Premium" feel
};

const fontStack = "'Inter', 'Plus Jakarta Sans', 'Montserrat', sans-serif";

interface AuditLog {
  _id: string;
  userId: string;
  userName?: string;
  userEmail?: string;
  institutionId?: string;
  institutionName?: string;
  action: string;
  resource: string;
  details: string;
  ipAddress: string;
  userAgent: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  category: string;
  createdAt: string;
}

interface Institution {
  _id: string;
  name: string;
}

export default function AuditLogs() {
  const theme = useTheme();
  const isSmallMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [institutions, setInstitutions] = useState<Institution[]>([]);
  const [loading, setLoading] = useState(true);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tabValue, setTabValue] = useState(0);
  const [filters, setFilters] = useState({
    institution: '',
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
  const [filterAnchorEl, setFilterAnchorEl] = useState<null | HTMLElement>(null);

  const fetchAuditLogs = useCallback(async (isFullLoad: boolean = false) => {
    setLoading(true);
    if (isFullLoad) setIsInitialLoad(true);
    setError(null);
    try {
      const params = {
        page: page.toString(),
        limit: '15',
        ...(filters.institution && { institutionId: filters.institution }),
        ...(filters.action && { action: filters.action }),
        ...(filters.severity && { severity: filters.severity }),
        ...(filters.category && { category: filters.category }),
        ...(filters.dateRange && { dateRange: filters.dateRange }),
        ...(searchTerm && { search: searchTerm })
      };

      const response = await superAdminService.getAuditLogs(params);
      // Ensure we match the backend response shape
      const fetchedLogs = response.data?.logs || response.logs || [];
      const pagination = response.data?.pagination || response.pagination || { totalPages: 1, total: 0 };
      
      setLogs(fetchedLogs);
      setTotalPages(pagination.totalPages);
      setTotalLogs(pagination.total);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch audit logs');
      console.error('Error fetching audit logs:', err);
    } finally {
      setTimeout(() => {
        setLoading(false);
        setIsInitialLoad(false);
      }, 600);
    }
  }, [filters, page, searchTerm]);

  const fetchInstitutions = async () => {
    try {
      const response = await superAdminService.getInstitutions();
      // Handle different possible response structures
      const fetchedInstitutions = response?.data || response?.institutions || (Array.isArray(response) ? response : []);
      setInstitutions(Array.isArray(fetchedInstitutions) ? fetchedInstitutions : []);
    } catch (err: any) {
      console.error('Error fetching institutions:', err);
      setInstitutions([]);
    }
  };

  useEffect(() => {
    fetchInstitutions();
  }, []);

  useEffect(() => {
    fetchAuditLogs(isInitialLoad);
  }, [fetchAuditLogs]);

  const handleTabChange = (newValue: number) => {
    setTabValue(newValue);
    let category = '';
    let severity = '';
    
    if (newValue === 1) {
      category = 'security';
      severity = 'high,critical';
    } else if (newValue === 2) {
      category = 'authentication';
    } else if (newValue === 3) {
      category = 'admin,user_management,institution_management';
    }

    setFilters(prev => ({ ...prev, category, severity }));
    setPage(1);
  };

  const handleFilterChange = (field: string, value: string) => {
    setFilters(prev => ({ ...prev, [field]: value }));
    setPage(1);
  };

  const handleExport = async () => {
    try {
      const params = {
        ...(filters.institution && { institutionId: filters.institution }),
        ...(filters.action && { action: filters.action }),
        ...(filters.severity && { severity: filters.severity }),
        ...(filters.category && { category: filters.category }),
        ...(filters.dateRange && { dateRange: filters.dateRange }),
        ...(searchTerm && { search: searchTerm })
      };

      const response = await superAdminService.exportAuditLogs(params);
      const blob = new Blob([JSON.stringify(response.data || response, null, 2)], { type: 'application/json' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `audit-logs-platform-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err: any) {
      console.error('Error exporting audit logs:', err);
    }
  };

  const getActionIcon = (action: string) => {
    const iconMap: { [key: string]: React.ReactNode } = {
      'LOGIN_SUCCESS': <Person sx={{ fontSize: 18 }} />,
      'LOGIN_FAILED': <ErrorIcon color="error" sx={{ fontSize: 18 }} />,
      'CLEARANCE_SUBMITTED': <Assessment sx={{ fontSize: 18 }} />,
      'CLEARANCE_APPROVED': <Assessment sx={{ color: '#d97706', fontSize: 18 }} />,
      'CLEARANCE_REJECTED': <ErrorIcon color="error" sx={{ fontSize: 18 }} />,
      'USER_CREATED': <Person sx={{ fontSize: 18 }} />,
      'INSTITUTION_APPROVED': <Business sx={{ color: COLORS.darkTeal, fontSize: 18 }} />,
      'INSTITUTION_REJECTED': <ErrorIcon color="error" sx={{ fontSize: 18 }} />,
      'ADMIN_ACTION': <AdminPanelSettings sx={{ fontSize: 18 }} />,
      'SECURITY_ALERT': <PriorityHigh color="error" sx={{ fontSize: 18 }} />,
    };
    return iconMap[action] || <History sx={{ fontSize: 18 }} />;
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'error';
      case 'high': return 'error';
      case 'medium': return 'warning';
      case 'low': return 'info';
      default: return 'default';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });
  };

  const getDayAndWeekday = (dateString: string) => {
    const d = new Date(dateString);
    return {
      day: d.getDate(),
      weekday: d.toLocaleDateString('en-US', { weekday: 'short' })
    };
  };

  const getMonthHeader = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  };

  const OverviewSkeleton = () => (
    <Box sx={{ mb: 5 }}>
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: 'repeat(2, 1fr)', md: 'repeat(5, 1fr)' }, gap: 2, mb: 3 }}>
        {[1, 2, 3, 4, 5].map((i) => (
          <Card key={i} sx={{ borderRadius: COLORS.cardRadius, boxShadow: 'none', border: `1px solid ${COLORS.border}` }}>
            <CardContent sx={{ p: 3 }}>
              <Skeleton variant="text" width="60%" height={12} sx={{ mb: 1.5 }} />
              <Skeleton variant="text" width="40%" height={32} />
            </CardContent>
          </Card>
        ))}
      </Box>
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: 'repeat(2, 1fr)', md: 'repeat(5, 1fr)' }, gap: 3, px: 1 }}>
        {[1, 2, 3, 4, 5].map((i) => (
          <Box key={i}>
            <Skeleton variant="text" width="50%" height={10} sx={{ mb: 0.5 }} />
            <Skeleton variant="text" width="80%" height={16} sx={{ mb: 0.25 }} />
            <Skeleton variant="text" width="30%" height={11} />
          </Box>
        ))}
      </Box>
    </Box>
  );

  const LogRow = ({ log }: { log: AuditLog }) => {
    const { day, weekday } = getDayAndWeekday(log.createdAt);
    return (
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
        <Box sx={{
          display: 'flex', alignItems: 'center', p: { xs: 2, sm: 3 }, mb: 1.5,
          bgcolor: '#FFF', borderRadius: '20px', border: '1px solid #F1F5F9',
          gap: { xs: 2, sm: 4 },
          transition: 'all 0.25s ease',
          '&:hover': {
            borderColor: COLORS.black,
            boxShadow: '0 8px 30px rgba(0,0,0,0.04)',
            transform: 'translateY(-2px)'
          }
        }}>
          <Box sx={{ width: { xs: 45, sm: 60 }, textAlign: 'center', borderRight: { sm: `1.5px solid ${COLORS.border}` }, pr: { sm: 2 } }}>
            <Typography sx={{ fontSize: 11, fontWeight: 800, color: COLORS.darkTeal, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{weekday}</Typography>
            <Typography sx={{ fontSize: 26, fontWeight: 900, color: '#1E293B', lineHeight: 1 }}>{day}</Typography>
          </Box>
          <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', gap: 2.5, minWidth: 0 }}>
            <Box sx={{ position: 'relative', flexShrink: 0 }}>
              <Avatar sx={{ width: 48, height: 48, bgcolor: '#1E293B', fontWeight: 900, fontSize: 16 }}>
                {log.userName?.[0] || 'S'}
              </Avatar>
              <Box sx={{ position: 'absolute', bottom: -2, right: -2, bgcolor: '#FFF', borderRadius: '50%', p: 0.5, boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
                {getActionIcon(log.action)}
              </Box>
            </Box>
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 0.5 }}>
                <Typography sx={{ fontWeight: 800, fontSize: 15, color: '#1E293B', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {log.action.replace(/_/g, ' ').toLowerCase()}
                </Typography>
                {log.institutionName && (
                  <Chip 
                    label={log.institutionName} 
                    size="small" 
                    variant="outlined"
                    sx={{ height: 18, fontSize: 10, fontWeight: 700, borderRadius: '6px', color: COLORS.textSecondary, borderColor: COLORS.border }} 
                  />
                )}
              </Box>
              <Typography sx={{ fontSize: 13, color: COLORS.textSecondary, fontWeight: 500, display: 'flex', alignItems: 'center', gap: 1 }}>
                <Person sx={{ fontSize: 14 }} /> {log.userName || 'System'} • <AccessTime sx={{ fontSize: 14 }} /> {formatDate(log.createdAt)} 
              </Typography>
            </Box>
          </Box>
          <Box sx={{ display: { xs: 'none', md: 'flex' }, flexDirection: 'column', alignItems: 'flex-end', gap: 0.5 }}>
             <Typography sx={{ fontSize: 11, fontWeight: 700, color: COLORS.textSecondary, fontFamily: 'monospace' }}>{log.ipAddress}</Typography>
             <Chip label={log.severity.toUpperCase()} size="small" color={getSeverityColor(log.severity) as any} sx={{ height: 20, fontSize: 9, fontWeight: 900, borderRadius: '6px' }} />
          </Box>
          <IconButton onClick={() => { setSelectedLog(log); setDetailsOpen(true); }} sx={{ bgcolor: '#F8FAFC', color: COLORS.black, '&:hover': { bgcolor: '#F1F5F9' } }}>
            <ChevronRight />
          </IconButton>
        </Box>
      </motion.div>
    );
  };

  return (
    <Box sx={{ p: { xs: 2, sm: 4 }, backgroundColor: '#FAFAFA', minHeight: '100vh' }}>
      {/* Header */}
      <Box sx={{ mb: 5, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <Box>
          <Typography sx={{ fontWeight: 900, fontSize: '2.25rem', letterSpacing: '-0.04em', color: '#000', lineHeight: 1 }}>System Records</Typography>
          <Typography sx={{ color: COLORS.textSecondary, mt: 1, fontWeight: 500 }}>Global activity monitoring and platform audit logs.</Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1.5 }}>
          <Tooltip title="Export JSON">
            <IconButton onClick={handleExport} sx={{ border: `1px solid ${COLORS.border}`, borderRadius: '12px' }}><Download /></IconButton>
          </Tooltip>
          <Button 
            variant="contained" 
            disableElevation 
            onClick={() => fetchAuditLogs(true)} 
            startIcon={<Refresh />}
            sx={{ bgcolor: '#000', color: '#fff', borderRadius: '12px', fontWeight: 700, px: 3, '&:hover': { bgcolor: '#222' } }}
          >
            Refresh records
          </Button>
        </Box>
      </Box>

      {/* Stats Summary */}
      {loading && isInitialLoad ? <OverviewSkeleton /> : (
        <Box sx={{ mb: 5 }}>
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: 'repeat(2, 1fr)', md: 'repeat(5, 1fr)' }, gap: 2, mb: 3 }}>
            {[
              { label: 'Total Platform Logs', value: totalLogs.toLocaleString(), icon: <History /> },
              { label: 'Security Alerts', value: logs.filter(l => l.category === 'security').length, icon: <Security />, color: COLORS.orange },
              { label: 'Active Institutions', value: institutions.length, icon: <Business />, color: COLORS.darkTeal },
              { label: 'Critical Errors', value: logs.filter(l => l.severity === 'critical').length, icon: <PriorityHigh />, color: 'error.main' },
              { label: 'System Health', value: '100%', icon: <Assessment />, color: COLORS.darkTeal }
            ].map((stat, i) => (
              <Card key={i} sx={{ borderRadius: COLORS.cardRadius, boxShadow: 'none', border: `1px solid ${COLORS.border}` }}>
                <CardContent sx={{ p: 3 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, color: COLORS.textSecondary, mb: 1.5 }}>
                    {stat.icon}
                    <Typography sx={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.05em', textTransform: 'uppercase' }}>{stat.label}</Typography>
                  </Box>
                  <Typography sx={{ fontSize: 28, fontWeight: 900, color: stat.color || '#000' }}>{stat.value}</Typography>
                </CardContent>
              </Card>
            ))}
          </Box>

          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: 'repeat(2, 1fr)', md: 'repeat(5, 1fr)' }, gap: 3, px: 1 }}>
             {[
               { label: 'MONITORING', value: 'SYSTEM LEVEL', sub: 'Active' },
               { label: 'DATE RANGE', value: filters.dateRange === '7d' ? 'Last 7 Days' : filters.dateRange, sub: 'Filtered' },
               { label: 'LAST ACTIVITY', value: logs[0] ? formatDate(logs[0].createdAt) : 'None', sub: 'Today' },
               { label: 'DATABASE', value: 'PLATFORM_METRICS', sub: 'MongoDB' },
               { label: 'ADMINISTRATOR', value: 'SUPER ADMIN', sub: 'Primary' }
             ].map((item, i) => (
               <Box key={i}>
                 <Typography sx={{ fontSize: 10, fontWeight: 800, color: COLORS.textSecondary }}>{item.label}</Typography>
                 <Typography sx={{ fontSize: 14, fontWeight: 700, mt: 0.25 }}>{item.value}</Typography>
                 <Typography sx={{ fontSize: 11, color: COLORS.textSecondary }}>{item.sub}</Typography>
               </Box>
             ))}
          </Box>
        </Box>
      )}

      {/* Search & Filter Bar */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 4, gap: 2, flexWrap: 'wrap' }}>
        <Box sx={{ display: 'flex', bgcolor: '#F1F5F9', p: 0.6, borderRadius: '16px', overflowX: 'auto', maxWidth: '100%' }}>
          {['All Records', 'Security', 'Logins', 'Admin'].map((label, i) => (
            <Button
              key={label}
              onClick={() => handleTabChange(i)}
              sx={{
                px: 3, py: 1, borderRadius: '12px', fontSize: 13, fontWeight: 800, textTransform: 'none',
                color: tabValue === i ? '#000' : '#64748B',
                bgcolor: tabValue === i ? '#FFF' : 'transparent',
                boxShadow: tabValue === i ? '0 4px 12px rgba(0,0,0,0.05)' : 'none',
                '&:hover': { bgcolor: tabValue === i ? '#FFF' : 'rgba(0,0,0,0.05)' }
              }}
            >
              {label}
            </Button>
          ))}
        </Box>

        <Box sx={{ display: 'flex', gap: 1.5, flex: { xs: 1, md: 'none' } }}>
          <TextField
            size="small"
            placeholder="Search records..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            InputProps={{ startAdornment: <Search sx={{ fontSize: 18, mr: 1, color: COLORS.textSecondary }} /> }}
            sx={{ flex: 1, minWidth: { md: 280 }, '& .MuiOutlinedInput-root': { borderRadius: '14px', bgcolor: '#FFF' } }}
          />
          <Button 
            variant="outlined" 
            onClick={(e) => setFilterAnchorEl(e.currentTarget)}
            startIcon={<FilterIcon />}
            sx={{ borderRadius: '14px', textTransform: 'none', fontWeight: 800, borderColor: COLORS.border, color: '#000', px: 3 }}
          >
            Sort & Filter
          </Button>
        </Box>
      </Box>

      {/* Filter Menu */}
      <Menu
        anchorEl={filterAnchorEl}
        open={Boolean(filterAnchorEl)}
        onClose={() => setFilterAnchorEl(null)}
        PaperProps={{ sx: { p: 1.5, borderRadius: '20px', minWidth: 260, mt: 1, boxShadow: '0 15px 40px rgba(0,0,0,0.1)' } }}
      >
        <Typography sx={{ px: 2, py: 1, fontSize: 10, fontWeight: 900, color: COLORS.textSecondary }}>INSTITUTION</Typography>
        <MenuItem onClick={() => { handleFilterChange('institution', ''); setFilterAnchorEl(null); }} sx={{ borderRadius: '10px', fontSize: 13, fontWeight: 700 }}>All Institutions</MenuItem>
        {(Array.isArray(institutions) ? institutions : []).slice(0, 5).map(inst => (
          <MenuItem 
            key={inst._id} 
            onClick={() => { handleFilterChange('institution', inst._id); setFilterAnchorEl(null); }}
            sx={{ borderRadius: '10px', fontSize: 13, fontWeight: 500 }}
          >
            {inst.name}
          </MenuItem>
        ))}

        <Divider sx={{ my: 1.5 }} />
        
        <Typography sx={{ px: 2, py: 1, fontSize: 10, fontWeight: 900, color: COLORS.textSecondary }}>DATE RANGE</Typography>
        <MenuItem onClick={() => { handleFilterChange('dateRange', '1d'); setFilterAnchorEl(null); }} sx={{ borderRadius: '10px', fontSize: 13, fontWeight: 500 }}>Last 24 Hours</MenuItem>
        <MenuItem onClick={() => { handleFilterChange('dateRange', '7d'); setFilterAnchorEl(null); }} sx={{ borderRadius: '10px', fontSize: 13, fontWeight: 500 }}>Last 7 Days</MenuItem>
        <MenuItem onClick={() => { handleFilterChange('dateRange', '30d'); setFilterAnchorEl(null); }} sx={{ borderRadius: '10px', fontSize: 13, fontWeight: 500 }}>Last 30 Days</MenuItem>
      </Menu>

      {/* Logs Timeline */}
      <Box sx={{ mb: 6 }}>
        {loading && isInitialLoad ? [1, 2, 3, 4, 5, 6].map(i => <Skeleton key={i} variant="rounded" height={85} sx={{ mb: 1.5, borderRadius: '20px' }} />) : (
          logs.length > 0 ? (
            (() => {
              let lastMonth = "";
              return logs.map((log) => {
                const currentMonth = getMonthHeader(log.createdAt);
                const showHeader = currentMonth !== lastMonth;
                lastMonth = currentMonth;
                return (
                  <Box key={log._id}>
                    {showHeader && (
                      <Typography sx={{ fontSize: 14, fontWeight: 900, color: COLORS.textSecondary, mt: 5, mb: 2.5, px: 1, textTransform: 'capitalize' }}>
                        {currentMonth}
                      </Typography>
                    )}
                    <LogRow log={log} />
                  </Box>
                );
              });
            })()
          ) : (
            <Box sx={{ py: 12, textAlign: 'center', bgcolor: '#FFF', borderRadius: '32px', border: `2px dashed ${COLORS.border}` }}>
              <History sx={{ fontSize: 64, color: COLORS.border, mb: 2 }} />
              <Typography sx={{ fontWeight: 800, color: COLORS.textSecondary }}>No audit records found matching your selection.</Typography>
            </Box>
          )
        )}
      </Box>

      {/* Pagination */}
      <Box sx={{ display: 'flex', justifyContent: 'center', pb: 10 }}>
        <Box sx={{ display: 'flex', gap: 1, bgcolor: '#F1F5F9', p: 0.8, borderRadius: '40px' }}>
          <IconButton disabled={page === 1} onClick={() => setPage(page - 1)}><ChevronLeft /></IconButton>
          {[...Array(totalPages)].slice(0, 5).map((_, i) => (
            <Box 
              key={i} 
              onClick={() => setPage(i + 1)}
              sx={{
                width: 38, height: 38, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
                borderRadius: '12px', bgcolor: page === i + 1 ? '#000' : 'transparent', color: page === i + 1 ? '#FFF' : '#64748B',
                fontWeight: 800, fontSize: 14, transition: '0.2s'
              }}
            >
              {i + 1}
            </Box>
          ))}
          <IconButton disabled={page === totalPages} onClick={() => setPage(page + 1)}><ChevronRight /></IconButton>
        </Box>
      </Box>

      {/* Details Dialog */}
      <Dialog open={detailsOpen} onClose={() => setDetailsOpen(false)} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: '28px', p: 1 } }}>
        <DialogContent>
          {selectedLog && (
            <Box sx={{ pt: 2 }}>
              <Typography sx={{ fontWeight: 900, fontSize: 22, letterSpacing: '-0.02em', mb: 3 }}>Record Activity</Typography>
              <Box sx={{ p: 3, borderRadius: '20px', bgcolor: '#F8FAFC', border: `1px solid ${COLORS.border}`, mb: 4 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                  {getActionIcon(selectedLog.action)}
                  <Box>
                    <Typography sx={{ fontWeight: 900, fontSize: 16 }}>{selectedLog.action.replace(/_/g, ' ')}</Typography>
                    <Typography sx={{ fontSize: 13, color: COLORS.textSecondary }}>Resource: {selectedLog.resource}</Typography>
                  </Box>
                </Box>
                <Divider sx={{ my: 2 }} />
                <Grid container spacing={3}>
                  <Grid item xs={6}>
                    <Typography sx={{ fontSize: 10, fontWeight: 800, color: COLORS.textSecondary }}>INSTITUTION</Typography>
                    <Typography sx={{ fontWeight: 700, fontSize: 14 }}>{selectedLog.institutionName || 'System Level'}</Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography sx={{ fontSize: 10, fontWeight: 800, color: COLORS.textSecondary }}>NETWORK ID</Typography>
                    <Typography sx={{ fontWeight: 700, fontSize: 14, fontFamily: 'monospace' }}>{selectedLog.ipAddress}</Typography>
                  </Grid>
                </Grid>
              </Box>
              <Box sx={{ mb: 4 }}>
                <Typography sx={{ fontSize: 10, fontWeight: 800, color: COLORS.textSecondary, mb: 1 }}>PAYLOAD DATA</Typography>
                <Box sx={{ p: 2, borderRadius: '16px', bgcolor: '#1E293B', color: '#5eead4', fontSize: 12, fontFamily: 'monospace', whiteSpace: 'pre-wrap' }}>
                  {selectedLog.details}
                </Box>
              </Box>
              <Button fullWidth onClick={() => setDetailsOpen(false)} sx={{ bgcolor: '#000', color: '#fff', py: 2, borderRadius: '16px', fontWeight: 800, '&:hover': { bgcolor: '#222' } }}>
                Dismiss
              </Button>
            </Box>
          )}
        </DialogContent>
      </Dialog>
    </Box>
  );
}
