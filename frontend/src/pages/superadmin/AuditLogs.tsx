import React, { useState, useEffect } from 'react';
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
  LinearProgress,
  Avatar,
  Badge,
  Tabs,
  Tab,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Skeleton
} from '@mui/material';
import {
  Security,
  Warning,
  Error,
  CheckCircle,
  Refresh,
  Download,
  Search,
  FilterList,
  Visibility,
  Person,
  Business,
  Schedule,
  Block,
  Gavel,
  AdminPanelSettings,
  Assessment,
  Lock,
  PriorityHigh,
  Info,
  History
} from '@mui/icons-material';
import { superAdminService } from '../../services';

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

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`audit-tabpanel-${index}`}
      aria-labelledby={`audit-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

export default function AuditLogs() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [institutions, setInstitutions] = useState<Institution[]>([]);
  const [loading, setLoading] = useState(true);
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
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);

  useEffect(() => {
    fetchAuditLogs();
    fetchInstitutions();
  }, [filters, page]);

  const fetchAuditLogs = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = {
        page: page.toString(),
        limit: '50',
        ...(filters.institution && { institutionId: filters.institution }),
        ...(filters.action && { action: filters.action }),
        ...(filters.severity && { severity: filters.severity }),
        ...(filters.category && { category: filters.category }),
        ...(filters.dateRange && { dateRange: filters.dateRange }),
        ...(searchTerm && { search: searchTerm })
      };

      const response = await superAdminService.getAuditLogs(params);
      setLogs(response.data.logs);
      setTotalPages(response.data.pagination.totalPages);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch audit logs');
      console.error('Error fetching audit logs:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchInstitutions = async () => {
    try {
      const response = await superAdminService.getInstitutions();
      setInstitutions(response.data);
    } catch (err: any) {
      console.error('Error fetching institutions:', err);
    }
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleFilterChange = (field: string, value: string) => {
    setFilters({ ...filters, [field]: value });
    setPage(1);
  };

  const handleSearch = () => {
    setPage(1);
    fetchAuditLogs();
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

      // Create download link
      const blob = new Blob([JSON.stringify(response.data, null, 2)], { type: 'application/json' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `audit-logs-${new Date().toISOString().split('T')[0]}.json`;
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
      'LOGIN': <Person />,
      'LOGIN_FAILED': <Block />,
      'CLEARANCE_SUBMITTED': <Assessment />,
      'CLEARANCE_APPROVED': <CheckCircle />,
      'CLEARANCE_REJECTED': <Error />,
      'USER_CREATED': <Person />,
      'USER_DISABLED': <Lock />,
      'INSTITUTION_APPROVED': <Business />,
      'INSTITUTION_REJECTED': <Gavel />,
      'ADMIN_ACTION': <AdminPanelSettings />,
      'SECURITY_ALERT': <PriorityHigh />,
      'SYSTEM_ERROR': <Error />
    };
    return iconMap[action] || <History />;
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical': return <PriorityHigh color="error" />;
      case 'high': return <Warning color="error" />;
      case 'medium': return <Warning color="warning" />;
      case 'low': return <Info color="info" />;
      default: return <Info />;
    }
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

  const getCategoryIcon = (category: string) => {
    const iconMap: { [key: string]: React.ReactNode } = {
      'authentication': <Person />,
      'user_management': <AdminPanelSettings />,
      'clearance_management': <Assessment />,
      'institution_management': <Business />,
      'security': <Security />,
      'system': <Schedule />
    };
    return iconMap[category] || <History />;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const formatAction = (action: string) => {
    return action.replace(/_/g, ' ').toLowerCase();
  };

  const formatCategory = (category: string) => {
    return category.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  if (loading) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography variant="h4" sx={{ mb: 3 }}>Audit Logs</Typography>
        <LinearProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography variant="h4" sx={{ mb: 3 }}>Audit Logs</Typography>
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
        <IconButton onClick={fetchAuditLogs}>
          <Refresh />
        </IconButton>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" sx={{ fontWeight: 600, color: '#0F172A' }}>
          Platform Audit Logs
        </Typography>
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
          <IconButton onClick={fetchAuditLogs}>
            <Refresh />
          </IconButton>
          <Tooltip title="Export Audit Logs">
            <IconButton onClick={handleExport}>
              <Download />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      {/* Filters */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" sx={{ mb: 2 }}>Filters</Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} md={3}>
              <TextField
                fullWidth
                label="Search"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                InputProps={{
                  startAdornment: <Search />
                }}
                placeholder="Search by user, action, or details..."
              />
            </Grid>
            <Grid item xs={12} md={2}>
              <FormControl fullWidth>
                <InputLabel>Institution</InputLabel>
                <Select
                  value={filters.institution}
                  label="Institution"
                  onChange={(e) => handleFilterChange('institution', e.target.value)}
                >
                  <MenuItem value="">All Institutions</MenuItem>
                  {institutions.map((inst) => (
                    <MenuItem key={inst._id} value={inst._id}>
                      {inst.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={2}>
              <FormControl fullWidth>
                <InputLabel>Action Type</InputLabel>
                <Select
                  value={filters.action}
                  label="Action Type"
                  onChange={(e) => handleFilterChange('action', e.target.value)}
                >
                  <MenuItem value="">All Actions</MenuItem>
                  <MenuItem value="LOGIN">Login</MenuItem>
                  <MenuItem value="LOGIN_FAILED">Failed Login</MenuItem>
                  <MenuItem value="CLEARANCE_SUBMITTED">Clearance Submitted</MenuItem>
                  <MenuItem value="CLEARANCE_APPROVED">Clearance Approved</MenuItem>
                  <MenuItem value="CLEARANCE_REJECTED">Clearance Rejected</MenuItem>
                  <MenuItem value="USER_CREATED">User Created</MenuItem>
                  <MenuItem value="USER_DISABLED">User Disabled</MenuItem>
                  <MenuItem value="ADMIN_ACTION">Admin Action</MenuItem>
                  <MenuItem value="SECURITY_ALERT">Security Alert</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={2}>
              <FormControl fullWidth>
                <InputLabel>Severity</InputLabel>
                <Select
                  value={filters.severity}
                  label="Severity"
                  onChange={(e) => handleFilterChange('severity', e.target.value)}
                >
                  <MenuItem value="">All Severities</MenuItem>
                  <MenuItem value="critical">Critical</MenuItem>
                  <MenuItem value="high">High</MenuItem>
                  <MenuItem value="medium">Medium</MenuItem>
                  <MenuItem value="low">Low</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={2}>
              <FormControl fullWidth>
                <InputLabel>Date Range</InputLabel>
                <Select
                  value={filters.dateRange}
                  label="Date Range"
                  onChange={(e) => handleFilterChange('dateRange', e.target.value)}
                >
                  <MenuItem value="1d">Last 24 Hours</MenuItem>
                  <MenuItem value="7d">Last 7 Days</MenuItem>
                  <MenuItem value="30d">Last 30 Days</MenuItem>
                  <MenuItem value="90d">Last 90 Days</MenuItem>
                  <MenuItem value="1y">Last Year</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={1}>
              <Button
                variant="outlined"
                onClick={() => {
                  setFilters({
                    institution: '',
                    action: '',
                    severity: '',
                    category: '',
                    dateRange: '7d'
                  });
                  setSearchTerm('');
                  setPage(1);
                }}
                sx={{ height: '56px' }}
              >
                Clear Filters
              </Button>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={tabValue} onChange={handleTabChange}>
          <Tab label="All Logs" />
          <Tab label="Security Events" />
          <Tab label="Failed Logins" />
          <Tab label="Admin Actions" />
        </Tabs>
      </Box>

      {/* All Logs Tab */}
      <TabPanel value={tabValue} index={0}>
        <Card>
          <CardContent>
            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Date & Time</TableCell>
                    <TableCell>User</TableCell>
                    <TableCell>Institution</TableCell>
                    <TableCell>Action</TableCell>
                    <TableCell>Resource</TableCell>
                    <TableCell>Severity</TableCell>
                    <TableCell>IP Address</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {loading ? (
                    [...Array(10)].map((_, i) => (
                      <TableRow key={i}>
                        <TableCell><Skeleton variant="text" width={120} /></TableCell>
                        <TableCell>
                          <Box>
                            <Skeleton variant="text" width={100} height={20} />
                            <Skeleton variant="text" width={140} height={16} />
                          </Box>
                        </TableCell>
                        <TableCell><Skeleton variant="text" width={100} /></TableCell>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Skeleton variant="circular" width={18} height={18} sx={{ opacity: 0.5 }} />
                            <Skeleton variant="text" width={80} />
                          </Box>
                        </TableCell>
                        <TableCell><Skeleton variant="text" width={120} /></TableCell>
                        <TableCell>
                          <Skeleton variant="rectangular" width={70} height={24} sx={{ borderRadius: '16px', opacity: 0.6 }} />
                        </TableCell>
                        <TableCell><Skeleton variant="text" width={100} sx={{ fontFamily: 'monospace' }} /></TableCell>
                        <TableCell align="center">
                          <Skeleton variant="circular" width={32} height={32} />
                        </TableCell>
                      </TableRow>
                    ))
                  ) : logs.length > 0 ? (
                    logs.map((log) => (
                      <TableRow key={log._id} hover>
                        <TableCell>
                          <Typography variant="body2" sx={{ fontSize: '12px' }}>
                            {formatDate(log.createdAt)}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Box>
                            <Typography variant="body2" sx={{ fontWeight: 500 }}>
                              {log.userName || 'Unknown User'}
                            </Typography>
                            <Typography variant="caption" color="textSecondary">
                              {log.userEmail || ''}
                            </Typography>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">
                            {log.institutionName || 'N/A'}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            {getActionIcon(log.action)}
                            <Typography variant="body2">
                              {formatAction(log.action)}
                            </Typography>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">
                            {log.resource}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Chip
                            icon={getSeverityIcon(log.severity)}
                            label={log.severity.toUpperCase()}
                            color={getSeverityColor(log.severity) as any}
                            size="small"
                          />
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" sx={{ fontFamily: 'monospace', fontSize: '11px' }}>
                            {log.ipAddress}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Tooltip title="View Details">
                            <IconButton
                              size="small"
                              onClick={() => {
                                setSelectedLog(log);
                                setDetailsOpen(true);
                              }}
                            >
                              <Visibility />
                            </IconButton>
                          </Tooltip>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={8} align="center" sx={{ py: 4 }}>
                        <Typography color="textSecondary">No logs found</Typography>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>
      </TabPanel>

      {/* Security Events Tab */}
      <TabPanel value={tabValue} index={1}>
        <Card>
          <CardContent>
            <Alert severity="info" sx={{ mb: 2 }}>
              <Typography variant="body2">
                <strong>Security Events</strong> - Failed login attempts, suspicious activities, and security-related events.
              </Typography>
            </Alert>
            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Date & Time</TableCell>
                    <TableCell>User</TableCell>
                    <TableCell>Event</TableCell>
                    <TableCell>IP Address</TableCell>
                    <TableCell>Details</TableCell>
                    <TableCell>Severity</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {logs
                    .filter(log => log.category === 'security' || log.severity === 'critical')
                    .map((log) => (
                      <TableRow key={log._id} hover>
                        <TableCell>
                          <Typography variant="body2" sx={{ fontSize: '12px' }}>
                            {formatDate(log.createdAt)}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Box>
                            <Typography variant="body2" sx={{ fontWeight: 500 }}>
                              {log.userName || 'Unknown User'}
                            </Typography>
                            <Typography variant="caption" color="textSecondary">
                              {log.userEmail || ''}
                            </Typography>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            {getActionIcon(log.action)}
                            <Typography variant="body2">
                              {formatAction(log.action)}
                            </Typography>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" sx={{ fontFamily: 'monospace', fontSize: '11px' }}>
                            {log.ipAddress}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" sx={{ maxWidth: 200, wordBreak: 'break-word' }}>
                            {log.details}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Chip
                            icon={getSeverityIcon(log.severity)}
                            label={log.severity.toUpperCase()}
                            color={getSeverityColor(log.severity) as any}
                            size="small"
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>
      </TabPanel>

      {/* Failed Logins Tab */}
      <TabPanel value={tabValue} index={2}>
        <Card>
          <CardContent>
            <Alert severity="warning" sx={{ mb: 2 }}>
              <Typography variant="body2">
                <strong>Failed Login Attempts</strong> - Monitor for potential security threats and brute force attacks.
              </Typography>
            </Alert>
            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Date & Time</TableCell>
                    <TableCell>User</TableCell>
                    <TableCell>IP Address</TableCell>
                    <TableCell>Attempts</TableCell>
                    <TableCell>Location</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {logs
                    .filter(log => log.action === 'LOGIN_FAILED')
                    .map((log) => (
                      <TableRow key={log._id} hover>
                        <TableCell>
                          <Typography variant="body2" sx={{ fontSize: '12px' }}>
                            {formatDate(log.createdAt)}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Box>
                            <Typography variant="body2" sx={{ fontWeight: 500 }}>
                              {log.userName || 'Unknown User'}
                            </Typography>
                            <Typography variant="caption" color="textSecondary">
                              {log.userEmail || ''}
                            </Typography>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" sx={{ fontFamily: 'monospace', fontSize: '11px' }}>
                            {log.ipAddress}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Badge badgeContent={log.details.match(/attempt (\d+)/)?.[1] || 1} color="error">
                            <Typography variant="body2">
                              Multiple attempts detected
                            </Typography>
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">
                            {log.details.includes('suspicious') ? 'Suspicious Activity' : 'Normal Failed Login'}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Tooltip title="View Details">
                            <IconButton
                              size="small"
                              onClick={() => {
                                setSelectedLog(log);
                                setDetailsOpen(true);
                              }}
                            >
                              <Visibility />
                            </IconButton>
                          </Tooltip>
                        </TableCell>
                      </TableRow>
                    ))}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>
      </TabPanel>

      {/* Admin Actions Tab */}
      <TabPanel value={tabValue} index={3}>
        <Card>
          <CardContent>
            <Alert severity="info" sx={{ mb: 2 }}>
              <Typography variant="body2">
                <strong>Admin Actions</strong> - Administrative changes, user management, and system configuration updates.
              </Typography>
            </Alert>
            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Date & Time</TableCell>
                    <TableCell>Admin</TableCell>
                    <TableCell>Action</TableCell>
                    <TableCell>Target</TableCell>
                    <TableCell>Institution</TableCell>
                    <TableCell>Details</TableCell>
                    <TableCell>Severity</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {logs
                    .filter(log => log.category === 'admin' || log.category === 'user_management')
                    .map((log) => (
                      <TableRow key={log._id} hover>
                        <TableCell>
                          <Typography variant="body2" sx={{ fontSize: '12px' }}>
                            {formatDate(log.createdAt)}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Box>
                            <Typography variant="body2" sx={{ fontWeight: 500 }}>
                              {log.userName || 'Unknown Admin'}
                            </Typography>
                            <Typography variant="caption" color="textSecondary">
                              {log.userEmail || ''}
                            </Typography>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            {getActionIcon(log.action)}
                            <Typography variant="body2">
                              {formatAction(log.action)}
                            </Typography>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">
                            {log.resource}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">
                            {log.institutionName || 'System Level'}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" sx={{ maxWidth: 200, wordBreak: 'break-word' }}>
                            {log.details}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Chip
                            icon={getSeverityIcon(log.severity)}
                            label={log.severity.toUpperCase()}
                            color={getSeverityColor(log.severity) as any}
                            size="small"
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>
      </TabPanel>

      {/* Pagination */}
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
        <Button
          disabled={page === 1}
          onClick={() => setPage(page - 1)}
          sx={{ mr: 1 }}
        >
          Previous
        </Button>
        <Typography variant="body2" sx={{ mx: 2 }}>
          Page {page} of {totalPages}
        </Typography>
        <Button
          disabled={page === totalPages}
          onClick={() => setPage(page + 1)}
          sx={{ ml: 1 }}
        >
          Next
        </Button>
      </Box>

      {/* Log Details Dialog */}
      <Dialog open={detailsOpen} onClose={() => setDetailsOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>Audit Log Details</DialogTitle>
        <DialogContent>
          {selectedLog && (
            <Box>
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" color="textSecondary">
                    Date & Time
                  </Typography>
                  <Typography variant="body1">
                    {formatDate(selectedLog.createdAt)}
                  </Typography>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" color="textSecondary">
                    Severity
                  </Typography>
                  <Chip
                    icon={getSeverityIcon(selectedLog.severity)}
                    label={selectedLog.severity.toUpperCase()}
                    color={getSeverityColor(selectedLog.severity) as any}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" color="textSecondary">
                    Category
                  </Typography>
                  <Typography variant="body1">
                    {formatCategory(selectedLog.category)}
                  </Typography>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" color="textSecondary">
                    Action
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    {getActionIcon(selectedLog.action)}
                    <Typography variant="body1">
                      {formatAction(selectedLog.action)}
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" color="textSecondary">
                    User
                  </Typography>
                  <Typography variant="body1">
                    {selectedLog.userName || 'Unknown User'}
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    {selectedLog.userEmail}
                  </Typography>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" color="textSecondary">
                    Institution
                  </Typography>
                  <Typography variant="body1">
                    {selectedLog.institutionName || 'System Level'}
                  </Typography>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" color="textSecondary">
                    IP Address
                  </Typography>
                  <Typography variant="body1" sx={{ fontFamily: 'monospace' }}>
                    {selectedLog.ipAddress}
                  </Typography>
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="subtitle2" color="textSecondary">
                    Details
                  </Typography>
                  <Typography variant="body1" sx={{ wordBreak: 'break-word' }}>
                    {selectedLog.details}
                  </Typography>
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="subtitle2" color="textSecondary">
                    User Agent
                  </Typography>
                  <Typography variant="body2" sx={{ fontSize: '12px', wordBreak: 'break-all' }}>
                    {selectedLog.userAgent}
                  </Typography>
                </Grid>
              </Grid>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDetailsOpen(false)}>
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
