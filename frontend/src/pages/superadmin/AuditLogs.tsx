import React, { useState, useEffect, useCallback } from 'react';
import { getInitials } from '../../utils/avatarUtils';
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
  DialogTitle,
  DialogContent,
  Tabs,
  Tab
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

// --- DESIGN TOKENS (Matching AdminPage/AdminRecordsPage) ---
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
  cardRadius: '16px',
};

const fontStack = '"Google Sans", "Product Sans", Roboto, sans-serif';

interface AuditLog {
  _id: string;
  userId: string;
  userName?: string;
  userEmail?: string;
  institutionId?: string;
  institutionName?: string;
  action: string;
  resource: string;
  details: string | any;
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
    dateRange: 'all'
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalLogs, setTotalLogs] = useState(0);
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [filterAnchorEl, setFilterAnchorEl] = useState<null | HTMLElement>(null);
  const [stats, setStats] = useState<any>(null);
  const [statsLoading, setStatsLoading] = useState(true);

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
      setLoading(false);
      setIsInitialLoad(false);
    }
  }, [filters, page, searchTerm]);

  const fetchInstitutions = useCallback(async () => {
    try {
      const response = await superAdminService.getInstitutions();
      // Handle different possible response structures
      const fetchedInstitutions = response?.data || response?.institutions || (Array.isArray(response) ? response : []);
      setInstitutions(Array.isArray(fetchedInstitutions) ? fetchedInstitutions : []);
    } catch (err: any) {
      console.error('Error fetching institutions:', err);
      setInstitutions([]);
    }
  }, []);

  const fetchAuditStats = useCallback(async () => {
    setStatsLoading(true);
    try {
      const response = await superAdminService.getAuditStats({ dateRange: 'all' });
      const data = response.data || response;
      setStats(data);
    } catch (err) {
      console.error('Error fetching audit stats:', err);
    } finally {
      setStatsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchInstitutions();
    fetchAuditStats();
  }, [fetchAuditStats, fetchInstitutions]);

  useEffect(() => {
    fetchAuditLogs(isInitialLoad);
  }, [fetchAuditLogs]);

  const handleTabChange = (newValue: number) => {
    setTabValue(newValue);
    let category = '';
    let severity = '';

    if (newValue === 1) {
      category = ''; // Treat all high/critical severity items as alerts
      severity = 'high,critical';
    } else if (newValue === 2) {
      category = 'auth';
    } else if (newValue === 3) {
      category = 'user_management,organization_management,institution_management';
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

  // --- SKELETONS (Matching Actual Component Layout) ---
  const TabSkeleton = () => (
    <Box sx={{
      borderBottom: 1,
      borderColor: "divider",
      mb: 4,
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      width: '100%'
    }}>
      <Box sx={{ display: 'flex', gap: 1 }}>
        {[1, 2, 3].map((i) => (
          <Box key={i} sx={{ px: { xs: 1.5, sm: 3 }, py: 2 }}>
            <Skeleton variant="text" width={isMobile ? 60 : 80} height={20} />
          </Box>
        ))}
      </Box>
      <Skeleton variant="rectangular" width={isMobile ? 44 : 48} height={isMobile ? 44 : 48} sx={{ borderRadius: '14px', mb: 1, flexShrink: 0 }} />
    </Box>
  );

  const FilterBarSkeleton = () => (
    <Box sx={{
      mb: 3,
      display: 'flex',
      flexDirection: { xs: 'column', sm: 'row' },
      justifyContent: 'space-between',
      alignItems: 'center',
      gap: 2
    }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
        <Skeleton variant="circular" width={24} height={24} />
        <Skeleton variant="text" width={140} height={28} />
      </Box>
      <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center', width: { xs: '100%', sm: 'auto' } }}>
        <Skeleton variant="rectangular" width={240} height={44} sx={{ borderRadius: '12px', flex: 1 }} />
        <Skeleton variant="rectangular" width={140} height={44} sx={{ borderRadius: '12px' }} />
      </Box>
    </Box>
  );

  const OverviewSkeleton = () => (
    <Box sx={{
      p: 3, borderRadius: COLORS.cardRadius, bgcolor: '#FFFFFF',
      border: `1px solid ${COLORS.border}`, mb: 3
    }}>
      <Box sx={{
        display: 'grid',
        gridTemplateColumns: { xs: 'repeat(2, 1fr)', sm: 'repeat(3, 1fr)', md: 'repeat(5, 1fr)' },
        gap: 1.5, mb: 3
      }}>
        {[1, 2, 3, 4, 5].map((i) => (
          <Box key={i} sx={{
            p: 2.5, bgcolor: '#F8FAFC', borderRadius: '14px', minHeight: 85,
            gridColumn: { xs: i === 5 ? 'span 2' : 'span 1', sm: 'span 1' }
          }}>
            <Skeleton variant="text" width="60%" height={28} />
            <Skeleton variant="text" width="40%" height={16} sx={{ mt: 1 }} />
          </Box>
        ))}
      </Box>
      <Box sx={{
        display: 'grid',
        gridTemplateColumns: { xs: '1fr 1fr', sm: 'repeat(3, 1fr)', md: 'repeat(5, 1fr)' },
        gap: 3, px: 2
      }}>
        {[1, 2, 3, 4, 5].map((i) => (
          <Box key={i}>
            <Skeleton variant="text" width={60} height={14} />
            <Skeleton variant="text" width={100} height={22} sx={{ mt: 0.5 }} />
          </Box>
        ))}
      </Box>
    </Box>
  );

  const LogRowSkeleton = () => (
    <Box sx={{
      display: 'flex', alignItems: 'center', p: { xs: 1.5, sm: 3 }, mb: 1.5,
      bgcolor: '#FFF', borderRadius: '16px', border: '1px solid #F1F5F9',
      gap: { xs: 1.5, sm: 4 }
    }}>
      <Box sx={{ width: { xs: 45, sm: 60 }, textAlign: 'center' }}>
        <Skeleton variant="text" width={25} height={14} sx={{ mx: 'auto' }} />
        <Skeleton variant="text" width={35} height={32} sx={{ mx: 'auto' }} />
      </Box>
      <Box sx={{ flexDirection: 'column', gap: 1, width: 140, display: { xs: 'none', sm: 'flex' } }}>
        <Skeleton variant="text" width={100} height={20} />
        <Skeleton variant="text" width={80} height={16} />
      </Box>
      <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', gap: { xs: 1.5, sm: 2 } }}>
        <Skeleton variant="circular" width={44} height={44} />
        <Box sx={{ flex: 1 }}>
          <Skeleton variant="text" width="60%" height={22} />
          <Skeleton variant="text" width="40%" height={18} />
        </Box>
      </Box>
      <Skeleton variant="rectangular" width={100} height={42} sx={{ borderRadius: '12px', display: { xs: 'none', md: 'block' } }} />
      <Skeleton variant="circular" width={40} height={40} sx={{ display: { xs: 'block', md: 'none' } }} />
    </Box>
  );

  const LogRow = ({ log }: { log: AuditLog }) => {
    const { day, weekday } = getDayAndWeekday(log.createdAt);
    return (
      <Box sx={{
        display: 'flex', alignItems: 'center', p: { xs: 1.5, sm: 3 }, mb: 1,
        bgcolor: '#FFF', borderRadius: '16px', border: '1px solid #F1F5F9',
        gap: { xs: 1.5, sm: 4 },
        transition: 'all 0.2s ease',
        '&:hover': {
          borderColor: COLORS.black,
          boxShadow: '0 4px 20px -5px rgba(0,0,0,0.05)',
          transform: 'translateY(-1px)'
        }
      }}>
        {/* Date Column */}
        <Box sx={{ width: { xs: 45, sm: 60 }, textAlign: 'center' }}>
          <Typography sx={{ fontSize: { xs: 11, sm: 13 }, fontWeight: 700, color: COLORS.darkTeal, textTransform: 'capitalize' }}>
            {weekday}
          </Typography>
          <Typography sx={{ fontSize: { xs: 22, sm: 28 }, fontWeight: 800, color: '#1E293B', lineHeight: 1 }}>
            {day}
          </Typography>
        </Box>

        {/* Time Column (Desktop/Tablet Only) */}
        <Box sx={{ flexDirection: 'column', gap: 0.5, width: { sm: 140 }, display: { xs: 'none', sm: 'flex' } }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, color: COLORS.textSecondary }}>
            <AccessTime sx={{ fontSize: 16 }} />
            <Typography sx={{ fontSize: 13, fontWeight: 700 }}>{formatDate(log.createdAt)}</Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, color: COLORS.textSecondary }}>
            <LocationOn sx={{ fontSize: 16 }} />
            <Typography sx={{ fontSize: 12, fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {log.ipAddress}
            </Typography>
          </Box>
        </Box>

        {/* Action & Participant Column */}
        <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', gap: { xs: 1.5, sm: 2 }, minWidth: 0 }}>
          <Box sx={{ position: 'relative', flexShrink: 0 }}>
            <Avatar
              sx={{ 
                width: { xs: 38, sm: 44 }, 
                height: { xs: 38, sm: 44 }, 
                bgcolor: '#5f6368', // Matching Sidebar
                color: '#FFF', 
                fontSize: { xs: 13, sm: 14 }, // Matching Sidebar profile font size
                fontWeight: 800 
              }}
            >
              {getInitials(log.userName || log.userEmail)}
            </Avatar>
            <Box sx={{
              position: 'absolute', bottom: -2, right: -2, bgcolor: '#FFF', borderRadius: '50%', p: 0.3,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
            }}>
              {getActionIcon(log.action)}
            </Box>
          </Box>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography sx={{
              fontWeight: 800, fontSize: { xs: 13, sm: 15 }, color: '#1E293B', lineHeight: 1.2,
              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'
            }}>
              {log.action.replace(/_/g, ' ').toLowerCase()}
            </Typography>
            <Typography sx={{
              fontSize: { xs: 11, sm: 13 }, color: COLORS.textSecondary, fontWeight: 500, mt: 0.5,
              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'
            }}>
              {log.userName || 'System'} • {log.institutionName || log.resource}
            </Typography>
          </Box>
        </Box>

        {/* Action Button */}
        <Button
          variant="contained"
          disableElevation
          onClick={() => { setSelectedLog(log); setDetailsOpen(true); }}
          endIcon={<ChevronRight />}
          sx={{
            bgcolor: '#F1F5F9', color: '#0F172A', borderRadius: '12px',
            textTransform: 'none', fontWeight: 800, fontSize: 13, px: 3, py: 1,
            '&:hover': { bgcolor: '#E2E8F0' },
            display: { xs: 'none', md: 'flex' }
          }}
        >
          Details
        </Button>
        <IconButton
          sx={{ display: { xs: 'flex', md: 'none' }, bgcolor: '#F1F5F9', p: 1 }}
          onClick={() => { setSelectedLog(log); setDetailsOpen(true); }}
        >
          <MoreHoriz sx={{ fontSize: 20 }} />
        </IconButton>
      </Box>
    );
  };

  return (
    <Box sx={{
      px: { xs: 2, sm: 4, md: 5 },
      pb: { xs: 2, sm: 4, md: 5 },
      pt: 0,
      bgcolor: '#F9FAFB',
      minHeight: '100vh',
      fontFamily: fontStack
    }}>
      {error && (
        <Alert severity="error" sx={{ mb: 3, borderRadius: '14px' }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* --- Tabs & Actions --- */}
      <Box sx={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-end',
        borderBottom: 1,
        borderColor: "divider",
        mb: 4,
        gap: { xs: 1.5, sm: 2 },
        width: '100%'
      }}>
        <Tabs
          value={tabValue}
          onChange={(_, v) => handleTabChange(v)}
          textColor="primary"
          variant="scrollable"
          scrollButtons="auto"
          TabIndicatorProps={{ sx: { bgcolor: "#0D9488", height: 3, borderTopLeftRadius: 3, borderTopRightRadius: 3 } }}
          sx={{
            mb: "-1px", 
            "& .MuiTabs-indicator": {
              bottom: 0,
            },
            "& .MuiTab-root": {
              textTransform: "none",
              fontWeight: 600,
              fontSize: { xs: "0.8rem", sm: "0.875rem" },
              color: "#5f6368",
              minWidth: { xs: 80, sm: 120 },
              px: { xs: 1.5, sm: 3 },
              py: 2,
            },
            "& .Mui-selected": {
              color: "#0D9488 !important",
              fontWeight: 800
            }
          }}
        >
          <Tab label={isMobile ? "System" : "System Records"} />
          <Tab label={isMobile ? "Security" : "Security & Alerts"} />
          <Tab label={isMobile ? "Access" : "Access Logs"} />
          <Tab label={isMobile ? "Actions" : "Admin Actions"} />
        </Tabs>

        <Tooltip title="Export Logs">
          <IconButton
            onClick={handleExport}
            sx={{
              mb: 1,
              border: `1px solid ${COLORS.border}`,
              borderRadius: '14px',
              bgcolor: '#FFF',
              width: { xs: 44, sm: 48 },
              height: { xs: 44, sm: 48 },
              flexShrink: 0,
              boxShadow: '0 2px 10px rgba(0,0,0,0.03)',
              '&:hover': { bgcolor: '#F8FAFC', transform: 'translateY(-1px)' },
              transition: 'all 0.2s'
            }}
          >
            <Download sx={{ fontSize: { xs: 20, sm: 22 }, color: COLORS.textPrimary }} />
          </IconButton>
        </Tooltip>
      </Box>


      {/* --- Consolidated Overview Card --- */}
      <Card sx={{
        borderRadius: COLORS.cardRadius, border: `1px solid ${COLORS.border}`,
        boxShadow: 'none', mb: 3, overflow: 'visible'
      }}>
        <CardContent sx={{ p: 3 }}>
          {/* Top Row: Metrics */}
          <Box sx={{
            display: 'grid',
            gridTemplateColumns: {
              xs: 'repeat(2, 1fr)',
              sm: 'repeat(3, 1fr)',
              md: 'repeat(5, 1fr)'
            },
            gap: 1.5,
            mb: 3
          }}>
            {[
              { label: 'TOTAL PLATFORM LOGS', value: statsLoading ? '...' : (stats?.totalLogs || 0).toLocaleString() },
              { label: 'SECURITY ALERTS', value: statsLoading ? '...' : (stats?.securityEvents || 0).toLocaleString() },
              { label: 'ACTIVE INSTITUTIONS', value: institutions.length },
              { label: 'CRITICAL ERRORS', value: statsLoading ? '...' : (stats?.criticalEvents || 0).toLocaleString() },
              { 
                label: 'SYSTEM HEALTH', 
                value: statsLoading ? '...' : (Math.max(0, 100 - ((stats?.criticalEvents || 0) * 5)) + '%'),
                color: (stats?.criticalEvents || 0) > 0 ? '#ef4444' : '#1E293B'
              }
            ].map((stat, idx, arr) => (
              <Box
                key={stat.label}
                sx={{
                  p: { xs: 2, sm: 2.5 }, bgcolor: '#F8FAFC', borderRadius: '14px',
                  display: 'flex', flexDirection: 'column', gap: 0.2,
                  position: 'relative',
                  border: '1px solid transparent',
                  transition: 'all 0.2s ease',
                  '&:hover': { bgcolor: '#F1F5F9', borderColor: COLORS.border },
                  gridColumn: { xs: idx === 4 ? 'span 2' : 'span 1', sm: 'span 1' }
                }}
              >
                {loading && isInitialLoad ? (
                  <Skeleton variant="text" width="60%" height={28} />
                ) : (
                  <Typography sx={{ fontSize: { xs: 18, sm: 24 }, fontWeight: 800, color: stat.color || '#1E293B' }}>
                    {stat.value}
                  </Typography>
                )}
                {loading && isInitialLoad ? (
                  <Skeleton variant="text" width="40%" height={14} />
                ) : (
                  <Typography sx={{ fontSize: { xs: 9, sm: 10 }, fontWeight: 700, color: COLORS.textSecondary, letterSpacing: '0.05em' }}>
                    {stat.label}
                  </Typography>
                )}
                {/* Vertical Divider for desktop only */}
                {idx < arr.length - 1 && (
                  <Box sx={{
                    display: { xs: 'none', md: 'block' },
                    position: 'absolute', right: -6, top: '20%', bottom: '20%',
                    width: '1px', bgcolor: COLORS.border, zIndex: 1
                  }} />
                )}
              </Box>
            ))}
          </Box>

          {/* Bottom Row: Context */}
          <Box sx={{
            display: 'grid',
            gridTemplateColumns: {
              xs: '1fr 1fr',
              sm: 'repeat(3, 1fr)',
              md: 'repeat(5, 1fr)'
            },
            px: { xs: 1, md: 2 },
            gap: 3
          }}>
            {[
              { 
                label: 'MONITORING', 
                value: loading ? 'SYNCING' : (error ? 'OFFLINE' : 'ACTIVE'),
                color: error ? '#ef4444' : (loading ? '#f59e0b' : '#1E293B')
              },
              { label: 'LAST ACTIVITY', value: logs[0] ? formatDate(logs[0].createdAt) + ', Today' : '—' },
              { label: 'DATABASE', value: 'MONGODB' },
              { label: 'ENVIRONMENT', value: 'PRODUCTION' },
              { label: 'ADMINISTRATOR', value: 'SUPER ADMIN' }
            ].map((item) => (
              <Box key={item.label}>
                {loading && isInitialLoad ? (
                  <Skeleton variant="text" width="50%" height={14} sx={{ mb: 0.5 }} />
                ) : (
                  <Typography sx={{ fontSize: 10, fontWeight: 700, color: COLORS.textSecondary, mb: 0.5 }}>
                    {item.label}
                  </Typography>
                )}
                {loading && isInitialLoad ? (
                  <Skeleton variant="text" width={80} height={20} />
                ) : (
                  <Typography sx={{ fontSize: 14, fontWeight: 700, color: item.color || '#1E293B' }}>
                    {item.value}
                  </Typography>
                )}
              </Box>
            ))}
          </Box>
        </CardContent>
      </Card>

      {/* --- Search & Sort/Filter Bar --- */}
      {loading && isInitialLoad ? (
        <FilterBarSkeleton />
      ) : (
        <Box sx={{
          mb: 3,
          display: 'flex',
          flexDirection: { xs: 'column', sm: 'row' },
          justifyContent: 'space-between',
          alignItems: { xs: 'stretch', sm: 'center' },
          gap: 2
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <History sx={{ fontSize: 20, color: COLORS.textSecondary }} />
            <Typography sx={{ fontSize: 16, fontWeight: 800 }}>Activity Logs</Typography>
          </Box>

          <Box sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1.5,
            width: { xs: '100%', sm: 'auto' }
          }}>
            <TextField
              size="small"
              placeholder="Search records..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: <Search sx={{ fontSize: 18, color: COLORS.textSecondary, mr: 1 }} />,
                sx: {
                  borderRadius: '10px',
                  bgcolor: '#FFF',
                  fontSize: 13,
                  height: 36,
                  minWidth: { xs: 'none', sm: 240 },
                  flex: 1
                }
              }}
              sx={{
                flex: 1,
                width: 'auto',
                '& .MuiOutlinedInput-notchedOutline': {
                  border: '1px solid transparent',
                  transition: 'border-color 0.2s',
                  borderColor: '#E2E8F0'
                },
                '& .MuiOutlinedInput-root:hover .MuiOutlinedInput-notchedOutline': {
                  borderColor: '#CBD5E1'
                },
                '& .MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline': {
                  borderColor: COLORS.black,
                  borderWidth: '1.5px'
                }
              }}
            />

            <Button
              variant="outlined"
              onClick={(e) => setFilterAnchorEl(e.currentTarget)}
              endIcon={<FilterIcon sx={{ fontSize: 18 }} />}
              sx={{
                height: 36,
                borderRadius: '10px',
                px: { xs: 1.5, sm: 2 },
                fontSize: 13,
                textTransform: 'none',
                fontWeight: 800,
                color: (filters.severity || filters.dateRange !== '7d' || filters.institution) ? COLORS.black : COLORS.textPrimary,
                borderColor: (filters.severity || filters.dateRange !== '7d' || filters.institution) ? COLORS.black : '#E2E8F0',
                bgcolor: (filters.severity || filters.dateRange !== '7d' || filters.institution) ? '#F8FAFC' : '#FFF',
                borderWidth: (filters.severity || filters.dateRange !== '7d' || filters.institution) ? '1.5px' : '1px',
                width: 'auto',
                minWidth: 'fit-content',
                '&:hover': { borderColor: COLORS.black, bgcolor: '#F8FAFC' }
              }}
            >
              {isSmallMobile ? null : "Sort & Filter"}
            </Button>

            {/* --- Filter Menu --- */}
            <Menu
              anchorEl={filterAnchorEl}
              open={Boolean(filterAnchorEl)}
              onClose={() => setFilterAnchorEl(null)}
              PaperProps={{
                sx: {
                  mt: 1,
                  p: 1.5,
                  borderRadius: '16px',
                  boxShadow: '0 10px 40px -10px rgba(0,0,0,0.1)',
                  minWidth: '240px',
                  border: '1px solid #F1F5F9'
                }
              }}
              transformOrigin={{ horizontal: 'right', vertical: 'top' }}
              anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
            >
              <Typography sx={{ px: 2, py: 1, fontSize: 11, fontWeight: 800, color: COLORS.textSecondary, letterSpacing: '0.1em' }}>INSTITUTION</Typography>
              <MenuItem onClick={() => { handleFilterChange('institution', ''); setFilterAnchorEl(null); }} sx={{ borderRadius: '10px', fontSize: 13, fontWeight: filters.institution === '' ? 800 : 500, bgcolor: filters.institution === '' ? '#F1F5F9' : 'transparent', mb: 0.5 }}>All Institutions</MenuItem>
              {(Array.isArray(institutions) ? institutions : []).slice(0, 8).map(inst => (
                <MenuItem
                  key={inst._id}
                  onClick={() => { handleFilterChange('institution', inst._id); setFilterAnchorEl(null); }}
                  sx={{ borderRadius: '10px', fontSize: 13, fontWeight: filters.institution === inst._id ? 800 : 500, bgcolor: filters.institution === inst._id ? '#F1F5F9' : 'transparent', mb: 0.5 }}
                >
                  {inst.name}
                </MenuItem>
              ))}

              <Divider sx={{ my: 1.5, opacity: 0.5 }} />

              <Typography sx={{ px: 2, py: 1, fontSize: 11, fontWeight: 800, color: COLORS.textSecondary, letterSpacing: '0.1em' }}>DATE RANGE</Typography>
              {['1d', '7d', '30d', 'all'].map(range => (
                <MenuItem
                  key={range}
                  onClick={() => { handleFilterChange('dateRange', range); setFilterAnchorEl(null); }}
                  sx={{ borderRadius: '10px', fontSize: 13, fontWeight: filters.dateRange === range ? 800 : 500, bgcolor: filters.dateRange === range ? '#F1F5F9' : 'transparent', mb: 0.5 }}
                >
                  {range === 'all' ? 'All Time' : `Last ${range === '1d' ? '24 Hours' : range === '7d' ? '7 Days' : '30 Days'}`}
                </MenuItem>
              ))}
            </Menu>
          </Box>
        </Box>
      )}

      {/* --- Logs Timeline --- */}
      <Box sx={{ mb: 4 }}>
        {loading && isInitialLoad ? (
          [1, 2, 3, 4, 5].map((i) => <LogRowSkeleton key={i} />)
        ) : logs.length > 0 ? (
          (() => {
            let lastMonth = "";
            return logs.map((log) => {
              const currentMonth = getMonthHeader(log.createdAt);
              const showMonth = currentMonth !== lastMonth;
              lastMonth = currentMonth;
              return (
                <React.Fragment key={log._id}>
                  {showMonth && (
                    <Typography sx={{
                      fontSize: 14, fontWeight: 800, color: COLORS.textSecondary,
                      mt: 4, mb: 2, px: 1, textTransform: 'capitalize'
                    }}>
                      {currentMonth}
                    </Typography>
                  )}
                  <LogRow log={log} />
                </React.Fragment>
              );
            });
          })()
        ) : (
          <Box sx={{
            textAlign: 'center', py: 15, bgcolor: '#FFF', borderRadius: '24px',
            border: '1px dashed #E2E8F0', mt: 2
          }}>
            <History sx={{ fontSize: 48, color: '#E2E8F0', mb: 2 }} />
            <Typography sx={{ fontWeight: 700, color: COLORS.textPrimary, mb: 1 }}>
              No platform logs found matching your selection.
            </Typography>
            <Typography sx={{ fontSize: 13, color: COLORS.textSecondary, maxWidth: 400, mx: 'auto', px: 3 }}>
              Try adjusting your filters (Currently showing: <b>{tabValue === 0 ? 'All Records' : tabValue === 1 ? 'Security' : tabValue === 2 ? 'Access' : 'Admin Actions'}</b> from <b>{filters.dateRange === 'all' ? 'All Time' : filters.dateRange === '1d' ? 'Last 24h' : `Last ${filters.dateRange}`}</b>).
            </Typography>
          </Box>
        )}
      </Box>

      {/* --- Pagination --- */}
      <Box sx={{ p: 4, display: 'flex', justifyContent: 'center' }}>
        {loading && isInitialLoad ? (
          <Skeleton variant="rectangular" width={240} height={44} sx={{ borderRadius: '40px' }} />
        ) : (
          <Box sx={{
            display: 'flex', gap: 1.5, alignItems: 'center', bgcolor: '#F1F5F9', px: 1, py: 0.5, borderRadius: '40px'
          }}>
            <IconButton disabled={page === 1} onClick={() => setPage(page - 1)} sx={{ color: page === 1 ? '#CBD5E1' : COLORS.textSecondary }}>
              <ChevronLeft sx={{ fontSize: 20 }} />
            </IconButton>
            
            {(() => {
              // Calculate a sliding window of 3 pages
              // When user clicks 3, start becomes 3, showing 3, 4, 5
              const start = Math.max(1, Math.min(page, totalPages - 2));
              const visiblePages = [0, 1, 2].map(v => start + v).filter(p => p <= totalPages);
              
              return visiblePages.map((p) => (
                <Box key={p} onClick={() => setPage(p)} sx={{
                  width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
                  borderRadius: '12px', bgcolor: page === p ? COLORS.black : 'transparent', color: page === p ? '#FFF' : COLORS.textSecondary,
                  fontWeight: 800, fontSize: 13, transition: 'all 0.2s ease', '&:hover': { bgcolor: page === p ? COLORS.black : 'rgba(0,0,0,0.04)' }
                }}>
                  {p}
                </Box>
              ));
            })()}

            <IconButton disabled={page === totalPages} onClick={() => setPage(page + 1)} sx={{ color: page === totalPages ? '#CBD5E1' : COLORS.textSecondary }}>
              <ChevronRight sx={{ fontSize: 20 }} />
            </IconButton>
          </Box>
        )}
      </Box>

      {/* --- Details Dialog --- */}
      <Dialog
        open={detailsOpen}
        onClose={() => setDetailsOpen(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{ sx: { borderRadius: '12px' } }}
      >
        <DialogTitle sx={{ fontWeight: 700, pb: 1 }}>Log Details</DialogTitle>
        <DialogContent>
          {selectedLog && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, mt: 1 }}>
              <Box>
                <Typography variant="overline" sx={{ color: COLORS.textSecondary, fontWeight: 600 }}>Action Context</Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mt: 1, p: 2, borderRadius: '8px', border: '1px solid ' + COLORS.border, backgroundColor: '#F8FAFC' }}>
                  {getActionIcon(selectedLog.action)}
                  <Box>
                    <Typography sx={{ fontWeight: 700, fontSize: 16 }}>{selectedLog.action.replace(/_/g, ' ')}</Typography>
                    <Typography sx={{ fontSize: 13, color: COLORS.textSecondary }}>{selectedLog.resource}</Typography>
                  </Box>
                  <Box sx={{ ml: 'auto' }}>
                    <Chip 
                      size="small" 
                      label={selectedLog.severity.toUpperCase()} 
                      sx={{ 
                        fontWeight: 700, 
                        fontSize: 10, 
                        height: 20,
                        bgcolor: selectedLog.severity === 'low' ? '#FEF9C3' : selectedLog.severity === 'medium' ? '#FCD34D' : undefined,
                        color: selectedLog.severity === 'low' ? '#854D0E' : selectedLog.severity === 'medium' ? '#92400E' : undefined,
                      }}
                      color={selectedLog.severity !== 'low' && selectedLog.severity !== 'medium' ? getSeverityColor(selectedLog.severity) as any : undefined}
                    />
                  </Box>
                </Box>
              </Box>

              <Grid container spacing={3}>
                <Grid item xs={6}>
                  <Typography variant="overline" sx={{ color: COLORS.textSecondary, fontWeight: 600 }}>Institution</Typography>
                  <Typography sx={{ fontWeight: 700, fontSize: 14 }}>{selectedLog.institutionName || 'Platform Level'}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="overline" sx={{ color: COLORS.textSecondary, fontWeight: 600 }}>Network</Typography>
                  <Typography sx={{ fontWeight: 700, fontSize: 14, fontFamily: '"Google Sans", "Product Sans", Roboto, sans-serif' }}>{selectedLog.ipAddress}</Typography>
                  <Typography sx={{ fontSize: 12, color: COLORS.textSecondary }}>Source IP</Typography>
                </Grid>
              </Grid>

              <Divider />

              <Box>
                <Typography variant="overline" sx={{ color: COLORS.textSecondary, fontWeight: 600 }}>Activity Payload</Typography>
                <Box sx={{
                  mt: 1.5, p: 3, borderRadius: '12px', backgroundColor: '#F1F5F9',
                  fontFamily: '"Google Sans", "Product Sans", Roboto, sans-serif', fontSize: 12, overflowX: 'auto',
                  border: '1px solid ' + COLORS.border,
                  minHeight: 60,
                  display: 'flex',
                  alignItems: 'center'
                }}>
                  {typeof selectedLog.details === 'object' 
                    ? <pre style={{ margin: 0, whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>{JSON.stringify(selectedLog.details, null, 2)}</pre>
                    : (selectedLog.details || <Typography sx={{ fontSize: 12, color: '#94A3B8', fontStyle: 'italic' }}>No additional payload data available.</Typography>)
                  }
                </Box>
              </Box>

              <Box sx={{ mt: 1 }}>
                <Typography variant="overline" sx={{ color: COLORS.textSecondary, fontWeight: 600 }}>User Agent</Typography>
                <Typography sx={{ fontSize: 11, color: COLORS.textSecondary, mt: 1, lineHeight: 1.5 }}>
                  {selectedLog.userAgent || 'Unknown User Agent'}
                </Typography>
              </Box>

              <Button
                fullWidth
                variant="contained"
                onClick={() => setDetailsOpen(false)}
                sx={{
                  mt: 2,
                  bgcolor: COLORS.black,
                  color: '#fff',
                  borderRadius: '8px',
                  py: 1.5,
                  fontWeight: 600,
                  '&:hover': { bgcolor: '#222' }
                }}
              >
                Close Details
              </Button>
            </Box>
          )}
        </DialogContent>
      </Dialog>
    </Box>
  );
}
