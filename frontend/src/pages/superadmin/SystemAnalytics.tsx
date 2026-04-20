import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Card,
  Grid,
  Chip,
  LinearProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Avatar,
  IconButton,
  Tooltip,
  Select,
  MenuItem,
  FormControl,
  useTheme,
  useMediaQuery,
  Skeleton,
  Button,
  Paper
} from '@mui/material';
import {
  Business,
  People,
  Assignment,
  TrendingUp,
  TrendingDown,
  TrendingFlat,
  Schedule,
  CheckCircle,
  Pending,
  Download,
  School,
  AdminPanelSettings,
  Security,
  Assessment,
  MoreVert,
  ArrowForward,
  Close,
  ChevronLeft,
  ChevronRight
} from '@mui/icons-material';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  LineChart,
  Line
} from 'recharts';
import { motion, AnimatePresence } from 'framer-motion';
import { superAdminService } from '../../services';

// ─── Refined Design System ──────────────────────────────────────────────
const COLORS = {
  pageBg: '#F9FAFB',
  surface: '#FFFFFF',
  black: '#3c4043',
  textPrimary: '#3c4043',
  textSecondary: '#64748B',
  accentBlue: '#B0E0E6',
  accentBlueDeep: '#4682B4', // Steel Blue for contrast
  accentBlueSoft: '#E0F2FE',
  accentTeal: '#5EEAD4',
  accentTealDeep: '#0F766E', // Deep Teal for contrast
  accentTealSoft: '#CCFBF1',
  accentOrange: '#FBF4C2', // Requested cream yellow
  accentOrangeDeep: '#1E293B', // Dark slate for contrast
  accentOrangeSoft: '#FBF4C2',
  accentIcon: '#0A4F5E', // Deep slate teal icon color
  accentIconBg: '#E8F6F8', // Extremely pale cyan for icon boxes
  chartColor: '#86D2D9', // Soft Cyan from reference image
  border: '#E2E8F0',
  softBg: '#F8FAFC',
};

const fontStack = '"Google Sans", "Product Sans", Roboto, sans-serif';

const cardShadow = '0 10px 25px -5px rgba(0, 0, 0, 0.05), 0 8px 10px -6px rgba(0, 0, 0, 0.05)';
const interactiveShadow = '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)';

// ─── Types ───────────────────────────────────────────────────────────────────
interface SystemMetrics {
  totalInstitutions: number;
  activeInstitutions: number;
  suspendedInstitutions: number;
  totalUsers: number;
  userBreakdown: {
    students: number;
    officers: number;
    admins: number;
    deans: number;
    super_admins: number;
  };
  totalClearanceRequests: number;
  processedClearanceRequests: number;
  loginActivity: {
    daily: number;
  };
  clearanceCompletionRates: InstitutionCompletionRate[];
  timelineData?: { _id: string; processed: number; pending: number; }[];
}

interface InstitutionCompletionRate {
  institutionId: string;
  institutionName: string;
  totalRequests: number;
  completedRequests: number;
  completionRate: number;
  trend?: number;
  status: string;
}

export default function SystemAnalytics() {
  const theme = useTheme();
  const navigate = useNavigate();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const isSmallMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const [metrics, setMetrics] = useState<SystemMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timeRange, setTimeRange] = useState('30d');
  const [page, setPage] = useState(1);
  const rowsPerPage = 10;

  // Daily Activity Timeline (Real + Zero-filled Skeleton)
  const timelineData = useMemo(() => {
    const days = timeRange === '7d' ? 7 : 30;
    const data = [];
    const now = new Date();
    
    // Create a map of existing data for quick lookup
    const dataMap = new Map();
    if (metrics?.timelineData) {
      metrics.timelineData.forEach(d => {
        dataMap.set(d._id, { processed: d.processed, pending: d.pending });
      });
    }

    // Generate full range (today back to 7/30 days ago)
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date();
      d.setDate(now.getDate() - i);
      const dateKey = d.toISOString().split('T')[0]; // Matches backend %Y-%m-%d
      const formattedDate = d.toLocaleDateString('en-US', { day: '2-digit', month: 'short' });
      
      const record = dataMap.get(dateKey);
      data.push({
        date: formattedDate,
        processed: record ? record.processed : 0,
        pending: record ? record.pending : 0
      });
    }
    
    return data;
  }, [metrics, timeRange]);

  useEffect(() => {
    fetchSystemMetrics();
    setPage(1); // Reset page on timeRange change
  }, [timeRange]);

  const paginatedInstitutions = useMemo(() => {
    if (!metrics) return [];
    const start = (page - 1) * rowsPerPage;
    return metrics.clearanceCompletionRates.slice(start, start + rowsPerPage);
  }, [metrics, page, rowsPerPage]);

  const totalPages = Math.ceil((metrics?.clearanceCompletionRates?.length || 0) / rowsPerPage);

  const fetchSystemMetrics = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await superAdminService.getSystemAnalytics({ timeRange });
      setMetrics(response.data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch system analytics');
    } finally {
      setLoading(false);
    }
  };

  const formatNumber = (num: number) => new Intl.NumberFormat().format(num);
  const formatPercentage = (num: number) => `${num.toFixed(1)}%`;

  const exportAnalytics = async () => {
    if (!metrics) return;
    try {
      const csvContent = generateCSVReport(metrics);
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `system-analytics-${new Date().toISOString().split('T')[0]}.csv`;
      link.click();
    } catch (err) {
      console.error('Error exporting analytics:', err);
    }
  };

  const generateCSVReport = (data: SystemMetrics) => {
    const headers = ['Metric', 'Value', 'Percentage', 'Time Range'];
    const rows = [
      ['Total Users', data.totalUsers?.toString() || '0', '', timeRange],
      ['Total Institutions', data.totalInstitutions?.toString() || '0', '', timeRange],
      ['Total Requests', data.totalClearanceRequests?.toString() || '0', '', timeRange],
      ['Processed Requests', data.processedClearanceRequests?.toString() || '0', data.totalClearanceRequests ? `${((data.processedClearanceRequests / data.totalClearanceRequests) * 100).toFixed(1)}%` : '0%', timeRange],
      ['Daily Active', data.loginActivity?.daily?.toString() || '0', '', timeRange],
    ];
    return [headers.join(','), ...rows.map(row => row.map(cell => `"${cell}"`).join(','))].join('\n');
  };

  if (loading) return (
    <Box sx={{ 
      px: { xs: 2.5, sm: 4, md: 5 }, 
      pt: 1.5, 
      pb: { xs: 4, sm: 5, md: 6 }, 
      bgcolor: COLORS.pageBg, 
      minHeight: '100vh', 
      fontFamily: fontStack 
    }}>
      {/* ── Page Header Skeleton ────────────────────────────────────────────── */}
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: { xs: 'flex-start', md: 'center' }, 
        mb: { xs: 4, sm: 6 },
        flexDirection: { xs: 'column', md: 'row' }, 
        gap: 2.5 
      }}>
        <Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 0.5 }}>
            <Skeleton variant="rectangular" width={40} height={40} sx={{ borderRadius: 2 }} />
            <Skeleton variant="text" width="220px" height={36} sx={{ borderRadius: '4px' }} />
          </Box>
          <Skeleton variant="text" width="340px" height={20} sx={{ mt: 0.5, borderRadius: '4px' }} />
        </Box>
        <Skeleton variant="rectangular" width={160} height={48} sx={{ borderRadius: '8px' }} />
      </Box>

      {/* Top Stats Row Skeleton */}
      <Grid container spacing={2.5} sx={{ mb: 4 }}>
        {[...Array(4)].map((_, i) => (
          <Grid item xs={12} sm={6} md={3} key={i}>
            <Skeleton variant="rectangular" height={140} sx={{ borderRadius: '24px' }} />
          </Grid>
        ))}
      </Grid>

      {/* Main Charts Row Skeleton */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} lg={8.5}>
          <Skeleton variant="rectangular" height={420} sx={{ borderRadius: '24px' }} />
        </Grid>
        <Grid item xs={12} lg={3.5}>
          <Skeleton variant="rectangular" height={420} sx={{ borderRadius: '24px' }} />
        </Grid>
      </Grid>

      {/* Bottom Table Skeleton */}
      <Skeleton variant="rectangular" height={400} sx={{ borderRadius: '24px' }} />
    </Box>
  );

  if (error || !metrics) return (
    <Box sx={{ p: 4, textAlign: 'center', height: '100vh', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
      <Typography color="error" sx={{ mb: 2, fontWeight: 700 }}>{error || 'No metrics available'}</Typography>
      <Button variant="contained" onClick={fetchSystemMetrics} sx={{ bgcolor: COLORS.black }}>Retry Load</Button>
    </Box>
  );

  return (
    <Box sx={{ 
      px: { xs: 2.5, sm: 4, md: 5 }, 
      pt: 1.5, 
      pb: { xs: 4, sm: 5, md: 6 }, 
      bgcolor: COLORS.pageBg, 
      minHeight: '100vh', 
      fontFamily: fontStack 
    }}>

      {/* ── Page Header ────────────────────────────────────────────── */}
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: { xs: 'flex-start', md: 'center' }, 
        mb: { xs: 4, sm: 6 },
        flexDirection: { xs: 'column', md: 'row' }, 
        gap: 2.5 
      }}>
        <Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 0.5 }}>
            <Box sx={{
              bgcolor: '#F1F5F9',
              color: '#475569',
              p: { xs: 0.5, sm: 1 },
              borderRadius: 2,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <TrendingUp sx={{ fontSize: { xs: 24, sm: 28 } }} />
            </Box>
            <Typography sx={{ 
              fontFamily: fontStack,
              fontWeight: 600, 
              fontSize: { xs: '1.25rem', sm: '1.75rem', md: '1.875rem' },
              color: '#000',
              lineHeight: 1.2,
            }}>
              System Analytics
            </Typography>
          </Box>
          <Typography sx={{ 
            fontFamily: fontStack,
            fontSize: { xs: '0.8rem', sm: '0.95rem' },
            fontWeight: 400,
            color: '#6B7280',
            maxWidth: 800,
            lineHeight: 1.5
          }}>
            A deep-dive into system-wide performance and administrative telemetry.
          </Typography>
        </Box>

        <Box sx={{ 
          display: 'flex', 
          gap: 1.5, 
          width: { xs: '100%', md: 'auto' },
          flexDirection: { xs: 'column', sm: 'row' }
        }}>
          <Button 
            startIcon={<Download />} 
            onClick={exportAnalytics} 
            sx={{ 
              bgcolor: COLORS.black, 
              color: 'white', 
              px: 3, 
              py: 1.25, 
              borderRadius: '8px', 
              textTransform: 'none', 
              fontWeight: 600, 
              flex: { xs: 1, md: 'none' }, 
              boxShadow: '0 4px 14px 0 rgba(0,0,0,0.25)',
              transition: 'all 0.2s ease-in-out',
              '&:hover': { 
                bgcolor: '#1A1A1A',
                boxShadow: '0 6px 20px rgba(0,0,0,0.35)',
                transform: 'translateY(-2px)'
              },
              '&:active': {
                transform: 'translateY(0)'
              }
            }}
          >
            Create Report
          </Button>
        </Box>
      </Box>

      {/* ── Top Stats row ────────────────────────────────────────────── */}
      <Grid container spacing={2.5} sx={{ mb: 4 }}>
        {[
          {
            label: 'Total Institutions',
            value: formatNumber(metrics.totalInstitutions),
            subLabel: 'System Count',
            icon: <Business sx={{ color: COLORS.accentIcon, fontSize: 20 }} />,
          },
          {
            label: 'Approved Access',
            value: formatNumber(metrics.activeInstitutions),
            subLabel: 'Active Domains',
            icon: <Security sx={{ color: COLORS.accentIcon, fontSize: 20 }} />,
          },
          {
            label: 'Pending Review',
            value: '0',
            subLabel: 'Awaiting Action',
            icon: <Schedule sx={{ color: COLORS.accentIcon, fontSize: 20 }} />,
          },
          {
            label: 'Suspended Status',
            value: formatNumber(metrics.suspendedInstitutions),
            subLabel: 'Inactive Access',
            icon: <Business sx={{ color: COLORS.accentIcon, fontSize: 20 }} />,
          },
        ].map((stat) => (
          <Grid item xs={12} sm={6} md={3} key={stat.label}>
            <Card sx={{
              p: 2.5,
              borderRadius: '24px',
              boxShadow: cardShadow,
              border: `1px solid ${COLORS.border}`,
              bgcolor: 'white',
              position: 'relative',
              minHeight: 140,
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between'
            }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <Typography sx={{ fontSize: 13, fontWeight: 600, color: COLORS.textSecondary, fontFamily: fontStack }}>
                  {stat.label}
                </Typography>
                <Box sx={{
                  width: 40,
                  height: 40,
                  borderRadius: '12px',
                  bgcolor: COLORS.accentIconBg,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  {stat.icon}
                </Box>
              </Box>

              <Box>
                <Typography sx={{ fontSize: 32, fontWeight: 700, color: COLORS.textPrimary, fontFamily: fontStack, lineHeight: 1 }}>
                  {stat.value}
                </Typography>
                <Typography sx={{ fontSize: 13, fontWeight: 600, color: COLORS.textSecondary, mt: 1, fontFamily: fontStack }}>
                  {stat.subLabel}
                </Typography>
              </Box>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* ── Main Dashboard Content ──────────────────────────────────── */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {/* Left Column: Charts */}
        <Grid item xs={12} lg={8.5}>
          <Card sx={{ p: 3, borderRadius: '24px', boxShadow: cardShadow, border: '1px solid #F1F5F9', height: '100%' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 4 }}>
              <Box>
                <Typography sx={{ fontSize: 18, fontWeight: 700, color: COLORS.textPrimary, fontFamily: fontStack }}>Clearance Activity</Typography>
                <Typography sx={{ fontSize: 13, color: COLORS.textSecondary, mt: 0.5, fontFamily: fontStack }}>Processed vs Pending Volume Over Time</Typography>
              </Box>
              <FormControl size="small" sx={{ minWidth: 120 }}>
                <Select
                  value={timeRange}
                  onChange={(e) => setTimeRange(e.target.value)}
                  sx={{ borderRadius: '10px', fontFamily: fontStack, fontSize: 13, fontWeight: 600 }}
                >
                  <MenuItem value="7d">Last 7 Days</MenuItem>
                  <MenuItem value="30d">Last 30 Days</MenuItem>
                </Select>
              </FormControl>
            </Box>

            <Box sx={{ 
              height: isSmallMobile ? 240 : 320, 
              width: '100%',
              '& .recharts-cartesian-axis-tick-text': {
                fontSize: isSmallMobile ? '10px' : '12px'
              }
            }}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={timelineData}>
                  <defs>
                    <linearGradient id="colorVolume" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={COLORS.chartColor} stopOpacity={0.2} />
                      <stop offset="95%" stopColor={COLORS.chartColor} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={COLORS.border} />
                  <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: COLORS.textSecondary, fontWeight: 600 }} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: COLORS.textSecondary, fontWeight: 600 }} />
                  <RechartsTooltip 
                    content={({ active, payload, label }) => {
                      if (active && payload && payload.length) {
                        return (
                          <Box sx={{ 
                            bgcolor: 'white', 
                            p: 2, 
                            borderRadius: '16px', 
                            boxShadow: interactiveShadow,
                            border: '1px solid #F1F5F9'
                          }}>
                            <Typography sx={{ fontSize: 13, fontWeight: 800, color: COLORS.textPrimary, mb: 1 }}>{label}</Typography>
                            {payload.map((entry: any) => (
                              <Box key={entry.name} sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
                                <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: entry.color }} />
                                <Typography sx={{ fontSize: 12, fontWeight: 700, color: COLORS.textSecondary, textTransform: 'capitalize' }}>
                                  {entry.name}: 
                                </Typography>
                                <Typography sx={{ fontSize: 13, fontWeight: 900, color: COLORS.textPrimary }}>
                                  {formatNumber(entry.value)}
                                </Typography>
                              </Box>
                            ))}
                          </Box>
                        );
                      }
                      return null;
                    }}
                  />
                  <Area type="monotone" dataKey="processed" stroke={COLORS.chartColor} strokeWidth={3} fillOpacity={1} fill="url(#colorVolume)" />
                  <Area type="monotone" dataKey="pending" stroke={COLORS.border} strokeWidth={2} fill="transparent" />
                </AreaChart>
              </ResponsiveContainer>
            </Box>
          </Card>
        </Grid>

        {/* Right Column: Sidebar Breakdown */}
        <Grid item xs={12} lg={3.5}>
          <Card sx={{ p: 3, borderRadius: '24px', boxShadow: cardShadow, border: '1px solid #F1F5F9', height: '100%' }}>
            <Typography sx={{ fontSize: 18, fontWeight: 700, color: COLORS.textPrimary, mb: 1, fontFamily: fontStack }}>Summary Health</Typography>
            <Typography sx={{ fontSize: 13, color: COLORS.textSecondary, mb: 3, fontFamily: fontStack }}>Completion overview via category</Typography>

            <Box sx={{ mb: 4 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', mb: 1 }}>
                <Typography sx={{ fontSize: 28, fontWeight: 700, color: COLORS.textPrimary, letterSpacing: '-0.02em', fontFamily: fontStack }}>
                  {formatPercentage(metrics.totalClearanceRequests > 0 ? (metrics.processedClearanceRequests / metrics.totalClearanceRequests) * 100 : 0)}
                </Typography>
                <Typography sx={{ fontSize: 13, fontWeight: 700, color: '#0F766E' }}>Overall Rate</Typography>
              </Box>
              <Box sx={{ height: 60, width: '100%' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={timelineData.slice(-10)}>
                    <Line type="monotone" dataKey="processed" stroke="#0F766E" strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </Box>
            </Box>

            <Typography sx={{ fontSize: 13, fontWeight: 600, color: COLORS.textPrimary, mb: 2, textTransform: 'uppercase', letterSpacing: '0.05em', fontFamily: fontStack }}>
              Volume by User Role
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
              {[
                { label: 'Students', value: metrics.userBreakdown.students, color: '#0D9488' }, // Deep Teal
                { label: 'Officers', value: metrics.userBreakdown.officers, color: '#2DD4BF' }, // Medium Teal
                { label: 'Deans', value: metrics.userBreakdown.deans, color: '#5EEAD4' },    // Main Teal
                { label: 'Admins', value: metrics.userBreakdown.admins, color: '#99F6E4' },   // Light Teal
              ].map((role) => (
                <Box key={role.label}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.75 }}>
                    <Typography sx={{ fontSize: 13, fontWeight: 600, color: COLORS.textSecondary }}>{role.label}</Typography>
                    <Typography sx={{ fontSize: 13, fontWeight: 700, color: COLORS.textPrimary }}>{formatNumber(role.value)}</Typography>
                  </Box>
                  <LinearProgress
                    variant="determinate"
                    value={(role.value / metrics.totalUsers) * 100}
                    sx={{ height: 6, borderRadius: 3, bgcolor: COLORS.softBg, '& .MuiLinearProgress-bar': { bgcolor: role.color, borderRadius: 3 } }}
                  />
                </Box>
              ))}
            </Box>
          </Card>
        </Grid>
      </Grid>

      {/* ── Recent Institutional Activity ──────────────────────────── */}
      <Card sx={{ p: 0, borderRadius: '24px', boxShadow: cardShadow, border: '1px solid #F1F5F9', overflow: 'hidden' }}>
        <Box sx={{ 
          p: 3, 
          borderBottom: '1px solid #F1F5F9', 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: { xs: 'flex-start', sm: 'center' },
          flexDirection: { xs: 'column', sm: 'row' },
          gap: 2
        }}>
          <Box>
            <Typography sx={{ fontSize: { xs: 16, sm: 18 }, fontWeight: 700, color: COLORS.textPrimary, fontFamily: fontStack }}>Institution Performance</Typography>
            <Typography sx={{ fontSize: 12, color: COLORS.textSecondary, fontFamily: fontStack }}>Real-time completion tracking across partners</Typography>
          </Box>
          <Button
            endIcon={<ArrowForward />}
            onClick={() => navigate('/super-admin/institution-monitoring')}
            sx={{
              color: COLORS.black,
              textTransform: 'none',
              fontWeight: 600,
              fontFamily: fontStack,
              '&:hover': {
                textDecoration: 'underline',
                bgcolor: 'transparent'
              }
            }}
          >
            View All
          </Button>
        </Box>
        <TableContainer sx={{ 
          overflowX: 'auto',
          '&::-webkit-scrollbar': { height: 6 },
          '&::-webkit-scrollbar-thumb': { bgcolor: '#E2E8F0', borderRadius: 3 }
        }}>
          <Table sx={{ minWidth: isMobile ? 800 : 'auto' }}>
            <TableHead>
              <TableRow sx={{ bgcolor: COLORS.softBg }}>
                {['Institution Name', 'Status', 'Total Volume', 'Completion Rate', 'Trend'].map((h) => (
                  <TableCell key={h} sx={{ color: COLORS.textSecondary, fontWeight: 600, fontSize: 12, py: 2, fontFamily: fontStack }}>{h}</TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {paginatedInstitutions.map((inst) => (
                <TableRow key={inst.institutionId} sx={{ '&:hover': { bgcolor: '#F8FAFC' } }}>
                  <TableCell sx={{ fontWeight: 600, color: COLORS.textPrimary, fontFamily: fontStack }}>{inst.institutionName}</TableCell>
                  <TableCell>
                    <Box sx={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      px: '10px',
                      py: '4px',
                      borderRadius: '20px',
                      bgcolor: inst.status === 'active' ? '#E6FFFA' : '#FFFBEB',
                      border: `1px solid ${inst.status === 'active' ? '#B2F5EA' : '#FEFCBF'}`,
                    }}>
                      <Box sx={{
                        width: 8,
                        height: 8,
                        borderRadius: '50%',
                        bgcolor: inst.status === 'active' ? COLORS.accentTealDeep : COLORS.accentOrangeDeep
                      }} />
                      <Typography sx={{
                        fontSize: '11px',
                        fontWeight: 700,
                        color: inst.status === 'active' ? COLORS.accentTealDeep : COLORS.accentOrangeDeep,
                        textTransform: 'capitalize',
                        fontFamily: fontStack
                      }}>
                        {inst.status}
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell sx={{ color: COLORS.textSecondary, fontWeight: 600 }}>{formatNumber(inst.totalRequests)}</TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                      <Box sx={{ flex: 1, minWidth: 100 }}>
                        <LinearProgress variant="determinate" value={inst.completionRate} sx={{ height: 6, borderRadius: 3, bgcolor: COLORS.softBg, '& .MuiLinearProgress-bar': { bgcolor: inst.completionRate > 80 ? COLORS.accentTealDeep : COLORS.accentOrangeDeep, borderRadius: 3 } }} />
                      </Box>
                      <Typography sx={{ fontSize: 13, fontWeight: 700, color: COLORS.textPrimary, fontFamily: fontStack }}>{formatPercentage(inst.completionRate)}</Typography>
                    </Box>
                  </TableCell>
                  <TableCell align="center">
                    <Box sx={{ 
                      display: 'flex', 
                      justifyContent: 'center',
                      color: !inst.trend || inst.trend === 0 ? COLORS.textSecondary : inst.trend > 0 ? COLORS.accentTealDeep : COLORS.accentOrangeDeep 
                    }}>
                      {!inst.trend || inst.trend === 0 ? (
                        <TrendingFlat sx={{ fontSize: 18 }} />
                      ) : inst.trend > 0 ? (
                        <TrendingUp sx={{ fontSize: 18 }} />
                      ) : (
                        <TrendingDown sx={{ fontSize: 18 }} />
                      )}
                    </Box>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>

        {/* ── Custom Pagination ──────────────────────────────────────── */}
        {metrics.clearanceCompletionRates.length > rowsPerPage && (
          <Box sx={{ 
            p: 3, 
            display: 'flex', 
            justifyContent: 'center',
            borderTop: `1px solid ${COLORS.border}` 
          }}>
            <Box sx={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: 1,
              bgcolor: '#F1F5F9',
              p: 0.75,
              borderRadius: '100px',
              border: `1px solid ${COLORS.border}`
            }}>
              <IconButton 
                size="small"
                disabled={page === 1}
                onClick={() => setPage(p => Math.max(1, p - 1))}
                sx={{ 
                  color: COLORS.textSecondary,
                  '&.Mui-disabled': { color: '#CBD5E1' }
                }}
              >
                <ChevronLeft fontSize="small" />
              </IconButton>

              {[...Array(totalPages)].map((_, i) => {
                const pageNum = i + 1;
                const isActive = pageNum === page;
                return (
                  <Box
                    key={pageNum}
                    onClick={() => setPage(pageNum)}
                    sx={{
                      width: 32,
                      height: 32,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      borderRadius: '10px',
                      cursor: 'pointer',
                      bgcolor: isActive ? COLORS.black : 'transparent',
                      color: isActive ? 'white' : COLORS.textSecondary,
                      fontWeight: isActive ? 800 : 700,
                      fontSize: 13,
                      transition: 'all 0.2s ease',
                      '&:hover': {
                        bgcolor: isActive ? COLORS.black : 'rgba(0,0,0,0.05)'
                      }
                    }}
                  >
                    {pageNum}
                  </Box>
                );
              })}

              <IconButton 
                size="small"
                disabled={page === totalPages}
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                sx={{ 
                  color: COLORS.textSecondary,
                  '&.Mui-disabled': { color: '#CBD5E1' }
                }}
              >
                <ChevronRight fontSize="small" />
              </IconButton>
            </Box>
          </Box>
        )}
      </Card>
    </Box>
  );
}
