import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Chip,
  LinearProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Avatar,
  IconButton,
  Tooltip,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Tabs,
  Tab,
  Alert,
  useTheme,
  useMediaQuery,
  Skeleton
} from '@mui/material';
import {
  Business,
  People,
  Assignment,
  TrendingUp,
  TrendingDown,
  Schedule,
  CheckCircle,
  Pending,
  Error,
  Refresh,
  Download,
  School,
  AdminPanelSettings,
  Security,
  Assessment
} from '@mui/icons-material';
import { superAdminService } from '../../services';
import { FullPageSkeleton, StatsSkeleton, CardGridSkeleton, TableSkeleton } from '../../components/ui/SkeletonLoader';

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
  pendingClearanceRequests: number;
  loginActivity: {
    daily: number;
    monthly: number;
    weekly: number;
  };
  clearanceCompletionRates: InstitutionCompletionRate[];
}

interface InstitutionCompletionRate {
  institutionId: string;
  institutionName: string;
  totalRequests: number;
  completedRequests: number;
  completionRate: number;
  status: 'active' | 'suspended';
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
      id={`analytics-tabpanel-${index}`}
      aria-labelledby={`analytics-tab-${index}`}
      {...other}
      style={{ minHeight: '600px', display: value === index ? 'block' : 'none' }}
    >
      {value === index && <Box sx={{ p: { xs: 1, sm: 2, md: 3 } }}>{children}</Box>}
    </div>
  );
}

// ─── Glassmorphism card style ────────────────────────────────────────────────
const glassCard = {
  borderRadius: COLORS.cardRadius,
  backgroundColor: 'rgba(255,255,255,0.65)',
  backdropFilter: 'blur(12px)',
  WebkitBackdropFilter: 'blur(12px)',
  border: '1px solid #D1D5DB',
  boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
};

export default function SystemAnalytics() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const isSmallMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [metrics, setMetrics] = useState<SystemMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [tabLoading, setTabLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [timeRange, setTimeRange] = useState('30d');
  const [tabValue, setTabValue] = useState(0);

  useEffect(() => {
    setTimeout(() => { fetchSystemMetrics(); }, 1000);
  }, [timeRange]);

  const fetchSystemMetrics = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await superAdminService.getSystemAnalytics({ timeRange });
      setMetrics(response.data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch system analytics');
      console.error('Error fetching system metrics:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (_: React.SyntheticEvent, newValue: number) => {
    setTabLoading(true);
    setTabValue(newValue);
    setTimeout(() => setTabLoading(false), 1000);
  };

  const formatNumber = (num: number) => new Intl.NumberFormat().format(num);
  const formatPercentage = (num: number) => `${num.toFixed(1)}%`;

  // ─── CSV Export ────────────────────────────────────────────────────────────
  const exportAnalytics = async () => {
    if (!metrics) return;
    try {
      const csvContent = generateCSVReport(metrics);
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      const timestamp = new Date().toISOString().split('T')[0];
      link.setAttribute('href', url);
      link.setAttribute('download', `system-analytics-${timeRange}-${timestamp}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error('Error exporting analytics:', error);
    }
  };

  const generateCSVReport = (data: SystemMetrics) => {
    const headers = ['Metric', 'Value', 'Percentage', 'Time Range'];
    const rows = [
      ['Total Users', data.totalUsers?.toString() || '0', '', timeRange],
      ['Students', data.userBreakdown?.students?.toString() || '0', data.totalUsers ? `${((data.userBreakdown.students / data.totalUsers) * 100).toFixed(1)}%` : '0%', timeRange],
      ['Officers', data.userBreakdown?.officers?.toString() || '0', data.totalUsers ? `${((data.userBreakdown.officers / data.totalUsers) * 100).toFixed(1)}%` : '0%', timeRange],
      ['Admins', data.userBreakdown?.admins?.toString() || '0', data.totalUsers ? `${((data.userBreakdown.admins / data.totalUsers) * 100).toFixed(1)}%` : '0%', timeRange],
      ['Deans', data.userBreakdown?.deans?.toString() || '0', data.totalUsers ? `${((data.userBreakdown.deans / data.totalUsers) * 100).toFixed(1)}%` : '0%', timeRange],
      ['Super Admins', data.userBreakdown?.super_admins?.toString() || '0', data.totalUsers ? `${((data.userBreakdown.super_admins / data.totalUsers) * 100).toFixed(1)}%` : '0%', timeRange],
      ['Total Institutions', data.totalInstitutions?.toString() || '0', '', timeRange],
      ['Active Institutions', data.activeInstitutions?.toString() || '0', data.totalInstitutions ? `${((data.activeInstitutions / data.totalInstitutions) * 100).toFixed(1)}%` : '0%', timeRange],
      ['Suspended Institutions', data.suspendedInstitutions?.toString() || '0', data.totalInstitutions ? `${((data.suspendedInstitutions / data.totalInstitutions) * 100).toFixed(1)}%` : '0%', timeRange],
      ['Total Clearance Requests', data.totalClearanceRequests?.toString() || '0', '', timeRange],
      ['Processed Requests', data.processedClearanceRequests?.toString() || '0', data.totalClearanceRequests ? `${((data.processedClearanceRequests / data.totalClearanceRequests) * 100).toFixed(1)}%` : '0%', timeRange],
      ['Pending Requests', data.pendingClearanceRequests?.toString() || '0', data.totalClearanceRequests ? `${((data.pendingClearanceRequests / data.totalClearanceRequests) * 100).toFixed(1)}%` : '0%', timeRange],
      ['Daily Logins', data.loginActivity?.daily?.toString() || '0', '', timeRange],
      ['Weekly Logins', data.loginActivity?.weekly?.toString() || '0', '', timeRange],
      ['Monthly Logins', data.loginActivity?.monthly?.toString() || '0', '', timeRange],
    ];
    return [headers.join(','), ...rows.map(row => row.map(cell => `"${cell}"`).join(','))].join('\n');
  };

  // ─── Custom Skeleton Components ──────────────────────────────────────────
  const StatCardSkeleton = ({ tint }: { tint?: string }) => (
    <Box sx={{ ...glassCard, p: isSmallMobile ? 2 : 2.5, backgroundColor: tint || 'rgba(255,255,255,0.65)', border: `1px solid ${COLORS.border}40` }}>
      <Skeleton variant="circular" width={8} height={8} sx={{ mb: 1.5, opacity: 0.5 }} />
      <Skeleton variant="text" width="40%" height={14} sx={{ mb: 0.5 }} />
      <Skeleton variant="text" width="60%" height={36} />
      <Skeleton variant="text" width="55%" height={14} sx={{ mt: 0.5 }} />
    </Box>
  );

  const SectionHeaderSkeleton = () => (
    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2.5 }}>
      <Skeleton variant="rectangular" width={36} height={36} sx={{ borderRadius: '10px', mr: 1.5, opacity: 0.4 }} />
      <Box sx={{ flex: 1 }}>
        <Skeleton variant="text" width="50%" height={22} />
        <Skeleton variant="text" width="35%" height={14} />
      </Box>
    </Box>
  );

  const OverviewSkeleton = () => (
    <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}>
      {/* Institutions Card Skeleton */}
      <Box sx={{ ...glassCard, p: isSmallMobile ? 2 : 3, border: `1px solid ${COLORS.border}60` }}>
        <SectionHeaderSkeleton />
        <Grid container spacing={2}>
          {[80, 60, 40].map((w, i) => (
            <Grid item xs={4} key={i}>
              <Skeleton variant="text" width={`${w}%`} height={36} />
              <Skeleton variant="text" width="50%" height={14} />
            </Grid>
          ))}
        </Grid>
        <Box sx={{ mt: 2 }}>
          <Skeleton variant="rectangular" height={8} sx={{ borderRadius: 4 }} />
          <Skeleton variant="text" width="30%" height={14} sx={{ mt: 1 }} />
        </Box>
      </Box>

      {/* Users Card Skeleton */}
      <Box sx={{ ...glassCard, p: isSmallMobile ? 2 : 3, border: `1px solid ${COLORS.border}60` }}>
        <SectionHeaderSkeleton />
        <Skeleton variant="text" width="25%" height={42} sx={{ mb: 2 }} />
        <Grid container spacing={1.5}>
          {[...Array(4)].map((_, i) => (
            <Grid item xs={6} key={i}>
              <Box sx={{ p: 1, borderRadius: '10px', border: `1px solid ${COLORS.border}40`, display: 'flex', alignItems: 'center', gap: 1 }}>
                <Skeleton variant="circular" width={14} height={14} />
                <Box sx={{ flex: 1 }}>
                  <Skeleton variant="text" width="60%" height={18} />
                  <Skeleton variant="text" width="40%" height={12} />
                </Box>
              </Box>
            </Grid>
          ))}
        </Grid>
      </Box>

      {/* Clearance Requests Card Skeleton */}
      <Box sx={{ ...glassCard, p: isSmallMobile ? 2 : 3, border: `1px solid ${COLORS.border}60` }}>
        <SectionHeaderSkeleton />
        <Grid container spacing={2}>
          {[70, 55, 45].map((w, i) => (
            <Grid item xs={4} key={i}>
              <Skeleton variant="text" width={`${w}%`} height={36} />
              <Skeleton variant="text" width="50%" height={14} />
            </Grid>
          ))}
        </Grid>
        <Box sx={{ mt: 2 }}>
          <Skeleton variant="rectangular" height={8} sx={{ borderRadius: 4 }} />
          <Skeleton variant="text" width="30%" height={14} sx={{ mt: 1 }} />
        </Box>
      </Box>

      {/* Login Activity Card Skeleton */}
      <Box sx={{ ...glassCard, p: isSmallMobile ? 2 : 3, border: `1px solid ${COLORS.border}60` }}>
        <SectionHeaderSkeleton />
        <Grid container spacing={1.5}>
          {[...Array(3)].map((_, i) => (
            <Grid item xs={4} key={i}>
              <Box sx={{ textAlign: 'center', p: 1.5, borderRadius: '12px', border: `1px solid ${COLORS.border}40` }}>
                <Skeleton variant="circular" width={6} height={6} sx={{ mx: 'auto', mb: 1 }} />
                <Skeleton variant="text" width="60%" height={32} sx={{ mx: 'auto' }} />
                <Skeleton variant="text" width="40%" height={14} sx={{ mx: 'auto' }} />
              </Box>
            </Grid>
          ))}
        </Grid>
      </Box>
    </Box>
  );

  const InstitutionTableSkeleton = () => (
    <Box sx={{ ...glassCard, p: isSmallMobile ? 2 : 3 }}>
      <SectionHeaderSkeleton />
      {!isMobile ? (
        <TableContainer component={Paper} sx={{ borderRadius: '12px', border: `1px solid ${COLORS.border}`, boxShadow: 'none' }}>
          <Table>
            <TableHead>
              <TableRow sx={{ backgroundColor: '#F8FAFC' }}>
                {[...Array(6)].map((_, i) => (
                  <TableCell key={i}><Skeleton variant="text" width="100%" /></TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {[...Array(5)].map((_, i) => (
                <TableRow key={i}>
                  {[...Array(6)].map((_, j) => (
                    <TableCell key={j}><Skeleton variant="text" width="100%" /></TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      ) : (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {[...Array(3)].map((_, i) => (
            <Box key={i} sx={{ p: 2, borderRadius: '12px', border: `1px solid ${COLORS.border}`, backgroundColor: 'rgba(255,255,255,0.5)' }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1.5 }}>
                <Skeleton variant="text" width="40%" height={24} />
                <Skeleton variant="rectangular" width={60} height={20} sx={{ borderRadius: 10 }} />
              </Box>
              <Grid container spacing={1.5}>
                {[...Array(4)].map((_, j) => (
                  <Grid item xs={6} key={j}>
                    <Skeleton variant="rectangular" height={45} sx={{ borderRadius: '10px' }} />
                  </Grid>
                ))}
              </Grid>
            </Box>
          ))}
        </Box>
      )}
    </Box>
  );

  const UserActivitySkeleton = () => (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      <Box sx={{ ...glassCard, p: isSmallMobile ? 2 : 3 }}>
        <SectionHeaderSkeleton />
        <Skeleton variant="text" width="20%" height={32} sx={{ mb: 2 }} />
        <Grid container spacing={2}>
          {[COLORS.teal, COLORS.orange, COLORS.lavender, '#d97706'].map((accent, i) => (
            <Grid item xs={6} sm={3} key={i}>
              <Box sx={{
                textAlign: 'center', p: isSmallMobile ? 2 : 3,
                borderRadius: '12px', backgroundColor: `${accent}05`,
                border: `1px solid ${accent}10`,
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1
              }}>
                <Skeleton variant="circular" width={isSmallMobile ? 28 : 36} height={isSmallMobile ? 28 : 36} sx={{ opacity: 0.3 }} />
                <Box>
                  <Skeleton variant="text" width={40} height={18} sx={{ mx: 'auto' }} />
                  <Skeleton variant="text" width={60} height={12} sx={{ mx: 'auto' }} />
                </Box>
              </Box>
            </Grid>
          ))}
        </Grid>
      </Box>
      <Box sx={{ ...glassCard, p: isSmallMobile ? 2 : 3 }}>
        <SectionHeaderSkeleton />
        <Grid container spacing={1.5}>
          {[...Array(3)].map((_, i) => (
            <Grid item xs={4} key={i}>
              <Box sx={{ p: 2, borderRadius: '12px', border: `1px solid ${COLORS.border}40` }}>
                <Skeleton variant="text" width="60%" height={22} sx={{ mx: 'auto' }} />
                <Skeleton variant="text" width="40%" height={14} sx={{ mx: 'auto' }} />
              </Box>
            </Grid>
          ))}
        </Grid>
      </Box>
    </Box>
  );

  const ClearanceSkeleton = () => (
    <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 2 }}>
      <Box sx={{ ...glassCard, p: 3, border: `1px solid ${COLORS.border}60` }}>
        <SectionHeaderSkeleton />
        <Grid container spacing={2}>
          {[...Array(3)].map((_, i) => (
            <Grid item xs={4} key={i}>
              <Skeleton variant="text" width="70%" height={32} />
              <Skeleton variant="text" width="50%" height={14} />
            </Grid>
          ))}
        </Grid>
        <Box sx={{ mt: 3, pt: 2, borderTop: `1px solid ${COLORS.border}40` }}>
          <Skeleton variant="rectangular" height={8} sx={{ borderRadius: 4 }} />
          <Skeleton variant="text" width="40%" height={14} sx={{ mt: 1 }} />
        </Box>
      </Box>
      <Box sx={{ ...glassCard, p: 3, border: `1px solid ${COLORS.border}60` }}>
        <SectionHeaderSkeleton />
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, mt: 1 }}>
          {[...Array(3)].map((_, i) => (
            <Box key={i}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Skeleton variant="text" width="30%" />
                <Skeleton variant="text" width="15%" />
              </Box>
              <Skeleton variant="rectangular" height={8} sx={{ borderRadius: 4 }} />
            </Box>
          ))}
        </Box>
      </Box>
    </Box>
  );

  const renderTabSkeleton = () => {
    if (tabValue === 0) return <OverviewSkeleton />;
    if (tabValue === 1) return <InstitutionTableSkeleton />;
    if (tabValue === 2) return <UserActivitySkeleton />;
    if (tabValue === 3) return <ClearanceSkeleton />;
    return <CardGridSkeleton cards={4} height={200} />;
  };

  // ─── Section header helper ─────────────────────────────────────────────────
  const SectionHeader = ({ icon, title, desc, accent }: { icon: React.ReactNode; title: string; desc: string; accent: string }) => (
    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2.5 }}>
      <Box sx={{
        width: 36, height: 36, borderRadius: '10px',
        backgroundColor: `${accent}0A`,
        display: 'flex', alignItems: 'center', justifyContent: 'center', mr: 1.5,
      }}>
        {icon}
      </Box>
      <Box>
        <Typography sx={{ fontFamily: fontStack, fontSize: 15, fontWeight: 700, color: COLORS.textPrimary, mb: 0.25 }}>
          {title}
        </Typography>
        <Typography sx={{ fontFamily: fontStack, fontSize: 12, color: COLORS.textSecondary }}>
          {desc}
        </Typography>
      </Box>
    </Box>
  );

  // ─── Metric cell helper ────────────────────────────────────────────────────
  const MetricCell = ({ value, label, color }: { value: string | number; label: string; color?: string }) => (
    <Box>
      <Typography sx={{ fontFamily: fontStack, fontSize: isSmallMobile ? 20 : 26, fontWeight: 800, color: color || COLORS.textPrimary, letterSpacing: '-1px' }}>
        {value}
      </Typography>
      <Typography sx={{ fontFamily: fontStack, fontSize: 11, color: COLORS.textSecondary, fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase' }}>
        {label}
      </Typography>
    </Box>
  );

  // ═══════════════════════════════════════════════════════════════════════════
  // SKELETON LOADER
  // ═══════════════════════════════════════════════════════════════════════════
  if (loading) {
    return (
      <Box sx={{ p: isSmallMobile ? 2 : 4, backgroundColor: COLORS.pageBg, minHeight: '100vh' }}>
        {/* Header Skeleton */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
          <Box>
            <Skeleton variant="text" width={250} height={48} />
            <Skeleton variant="text" width={350} height={20} />
          </Box>
          <Box sx={{ display: 'flex', gap: 1.5 }}>
            <Skeleton variant="rectangular" width={130} height={40} sx={{ borderRadius: '12px' }} />
            <Skeleton variant="rectangular" width={40} height={40} sx={{ borderRadius: '10px' }} />
            <Skeleton variant="rectangular" width={40} height={40} sx={{ borderRadius: '10px' }} />
          </Box>
        </Box>

        {/* Stats Grid Skeleton */}
        <Box sx={{
          display: 'grid',
          gridTemplateColumns: { xs: 'repeat(2, 1fr)', md: 'repeat(4, 1fr)' },
          gap: 2, mb: 3,
        }}>
          <StatCardSkeleton tint={`${COLORS.teal}06`} />
          <StatCardSkeleton tint={`${COLORS.lavender}06`} />
          <StatCardSkeleton tint={`${COLORS.yellow}08`} />
          <StatCardSkeleton tint={`${COLORS.orange}06`} />
        </Box>

        {/* Tabs Skeleton */}
        <Box sx={{ borderBottom: `1px solid ${COLORS.border}`, mb: 2 }}>
          <Box sx={{ display: 'flex', gap: 3, px: 1 }}>
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} variant="text" width={80} height={48} />
            ))}
          </Box>
        </Box>

        {/* Tab Content Skeleton */}
        {renderTabSkeleton()}
      </Box>
    );
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // ERROR STATE
  // ═══════════════════════════════════════════════════════════════════════════
  if (error) {
    return (
      <Box sx={{
        p: isSmallMobile ? 2 : 4, backgroundColor: COLORS.pageBg, minHeight: '100vh', fontFamily: fontStack,
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      }}>
        <Box sx={{ ...glassCard, maxWidth: 480, textAlign: 'center', p: 4 }}>
          <Box sx={{
            width: 56, height: 56, borderRadius: '50%', backgroundColor: `${COLORS.orange}20`,
            display: 'flex', alignItems: 'center', justifyContent: 'center', mx: 'auto', mb: 2,
          }}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke={COLORS.orange} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
          </Box>
          <Typography sx={{ fontFamily: fontStack, fontWeight: 700, fontSize: 18, color: COLORS.textPrimary, mb: 1 }}>
            Failed to load analytics
          </Typography>
          <Typography sx={{ fontFamily: fontStack, fontSize: 14, color: COLORS.textSecondary, mb: 3 }}>{error}</Typography>
          <IconButton onClick={fetchSystemMetrics} sx={{
            backgroundColor: COLORS.black, color: '#FFFFFF', borderRadius: '12px', px: 3,
            '&:hover': { backgroundColor: '#222' },
          }}>
            <Refresh />
          </IconButton>
        </Box>
      </Box>
    );
  }

  if (!metrics) {
    return (
      <Box sx={{ p: isSmallMobile ? 2 : 4, backgroundColor: COLORS.pageBg, minHeight: '100vh', fontFamily: fontStack }}>
        <Typography sx={{ fontFamily: fontStack, fontWeight: 800, fontSize: '2.25rem', color: COLORS.textPrimary, mb: 3 }}>
          System Analytics
        </Typography>
        <Alert severity="info" sx={{ fontFamily: fontStack, borderRadius: '12px' }}>No analytics data available</Alert>
      </Box>
    );
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // MAIN RENDER
  // ═══════════════════════════════════════════════════════════════════════════
  return (
    <Box sx={{ p: isSmallMobile ? 2 : 4, backgroundColor: COLORS.pageBg, minHeight: '100vh', fontFamily: fontStack }}>

      {/* ── Header ──────────────────────────────────────────────────── */}
      <Box sx={{
        display: 'flex', justifyContent: 'space-between',
        alignItems: isSmallMobile ? 'flex-start' : 'center',
        mb: 3, flexDirection: isSmallMobile ? 'column' : 'row',
        gap: isSmallMobile ? 2 : 0,
      }}>
        <Box>
          <Typography sx={{
            fontFamily: fontStack, fontWeight: 800,
            fontSize: isSmallMobile ? '1.5rem' : '2.25rem',
            letterSpacing: '-0.03em', color: COLORS.textPrimary, lineHeight: 1.15,
          }}>
            System Analytics
          </Typography>
          <Typography sx={{ fontFamily: fontStack, fontSize: isSmallMobile ? 13 : 16, color: COLORS.textSecondary, mt: 0.5 }}>
            Monitor system performance, user activity, and institutional metrics
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center', flexDirection: isSmallMobile ? 'column' : 'row', width: isSmallMobile ? '100%' : 'auto' }}>
          <FormControl size="small" sx={{ minWidth: isSmallMobile ? '100%' : 130 }}>
            <Select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value)}
              sx={{
                fontFamily: fontStack, borderRadius: '12px',
                '& .MuiOutlinedInput-notchedOutline': { borderColor: COLORS.border },
                '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#94A3B8' },
                '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: COLORS.black },
              }}
              MenuProps={{ PaperProps: { sx: { borderRadius: '12px', mt: 1, fontFamily: fontStack } } }}
            >
              <MenuItem value="7d">Last 7 Days</MenuItem>
              <MenuItem value="30d">Last 30 Days</MenuItem>
              <MenuItem value="90d">Last 90 Days</MenuItem>
              <MenuItem value="1y">Last Year</MenuItem>
            </Select>
          </FormControl>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <IconButton
              onClick={fetchSystemMetrics}
              sx={{
                backgroundColor: COLORS.black, color: '#FFFFFF',
                borderRadius: '10px', width: 40, height: 40,
                '&:hover': { backgroundColor: '#222' },
              }}
            >
              <Refresh sx={{ fontSize: 20 }} />
            </IconButton>
            <Tooltip title="Export CSV">
              <IconButton
                onClick={exportAnalytics}
                sx={{
                  border: `1.5px solid ${COLORS.black}`, color: COLORS.black,
                  borderRadius: '10px', width: 40, height: 40,
                  '&:hover': { backgroundColor: '#f5f5f5' },
                }}
              >
                <Download sx={{ fontSize: 20 }} />
              </IconButton>
            </Tooltip>
          </Box>
        </Box>
      </Box>

      {/* ── Top Stats Bento Row ─────────────────────────────────────── */}
      <Box sx={{
        display: 'grid',
        gridTemplateColumns: { xs: 'repeat(2, 1fr)', md: 'repeat(4, 1fr)' },
        gap: 2, mb: 3,
      }}>
        {[
          { label: 'Institutions', value: formatNumber(metrics.totalInstitutions), accent: COLORS.teal, tint: `${COLORS.teal}06`, sub: `${metrics.activeInstitutions} active` },
          { label: 'Total Users', value: formatNumber(metrics.totalUsers), accent: COLORS.lavender, tint: `${COLORS.lavender}06`, sub: `${formatNumber(metrics.userBreakdown.students)} students` },
          { label: 'Clearance Requests', value: formatNumber(metrics.totalClearanceRequests), accent: COLORS.yellow, tint: `${COLORS.yellow}08`, sub: `${formatNumber(metrics.processedClearanceRequests)} processed` },
          { label: 'Monthly Logins', value: formatNumber(metrics.loginActivity.monthly), accent: COLORS.orange, tint: `${COLORS.orange}06`, sub: `${formatNumber(metrics.loginActivity.daily)} today` },
        ].map((stat) => (
          <Box key={stat.label} sx={{ ...glassCard, p: isSmallMobile ? 2 : 2.5, backgroundColor: stat.tint, border: `1px solid ${stat.accent}12` }}>
            <Box sx={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: stat.accent, mb: 1.5 }} />
            <Box sx={{ fontFamily: fontStack, fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: COLORS.textSecondary, mb: 0.5 }}>
              {stat.label}
            </Box>
            <Typography sx={{ fontFamily: fontStack, fontWeight: 800, fontSize: isSmallMobile ? 22 : 28, color: COLORS.textPrimary, letterSpacing: '-1px' }}>
              {stat.value}
            </Typography>
            <Typography sx={{ fontFamily: fontStack, fontSize: 11, color: COLORS.textSecondary, mt: 0.5 }}>
              {stat.sub}
            </Typography>
          </Box>
        ))}
      </Box>

      {/* ── Tabs ────────────────────────────────────────────────────── */}
      <Box sx={{
        borderBottom: `1px solid ${COLORS.border}`, mb: 2,
        overflowX: 'auto', minHeight: 48,
        '&::-webkit-scrollbar': { height: '4px' },
        '&::-webkit-scrollbar-thumb': { backgroundColor: COLORS.border, borderRadius: '2px' },
      }}>
        <Tabs
          value={tabValue}
          onChange={handleTabChange}
          variant={isSmallMobile ? "scrollable" : "standard"}
          scrollButtons={isSmallMobile ? "auto" : false}
          allowScrollButtonsMobile
          sx={{
            '& .MuiTab-root': {
              fontFamily: fontStack, textTransform: 'none', fontWeight: 600,
              color: COLORS.textSecondary, minWidth: isSmallMobile ? 'auto' : '90px',
              px: isSmallMobile ? 2 : 3,
            },
            '& .Mui-selected': { color: `${COLORS.black} !important`, fontWeight: 800 },
            '& .MuiTabs-indicator': {
              height: '3px', backgroundColor: COLORS.black,
              borderRadius: '3px 3px 0 0',
            },
          }}
        >
          <Tab label="Overview" />
          <Tab label="Institutions" />
          <Tab label="User Activity" />
          <Tab label="Clearance Analytics" />
        </Tabs>
      </Box>

      {/* ═══ OVERVIEW TAB ═══════════════════════════════════════════ */}
      <TabPanel value={tabValue} index={0}>
        {tabLoading ? renderTabSkeleton() : (
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}>
            {/* Institutions Card */}
            <Box sx={{ ...glassCard, p: isSmallMobile ? 2 : 3, border: `1px solid ${COLORS.border}60` }}>
              <SectionHeader icon={<Business sx={{ fontSize: 18, color: COLORS.teal }} />} title="Institutions" desc="Total, Active, Suspended" accent={COLORS.teal} />
              <Grid container spacing={2}>
                <Grid item xs={4}><MetricCell value={formatNumber(metrics.totalInstitutions)} label="Total" /></Grid>
                <Grid item xs={4}><MetricCell value={formatNumber(metrics.activeInstitutions)} label="Active" color="#065f46" /></Grid>
                <Grid item xs={4}><MetricCell value={formatNumber(metrics.suspendedInstitutions)} label="Suspended" color={COLORS.orange} /></Grid>
              </Grid>
              <Box sx={{ mt: 2 }}>
                <LinearProgress variant="determinate" value={(metrics.activeInstitutions / metrics.totalInstitutions) * 100} sx={{
                  height: 8, borderRadius: 4, backgroundColor: COLORS.border,
                  '& .MuiLinearProgress-bar': { backgroundColor: COLORS.teal, borderRadius: 4 },
                }} />
                <Typography sx={{ fontFamily: fontStack, fontSize: 11, mt: 1, color: COLORS.textSecondary }}>
                  {formatPercentage((metrics.activeInstitutions / metrics.totalInstitutions) * 100)} active rate
                </Typography>
              </Box>
            </Box>

            {/* Users Card */}
            <Box sx={{ ...glassCard, p: isSmallMobile ? 2 : 3, border: `1px solid ${COLORS.border}60` }}>
              <SectionHeader icon={<People sx={{ fontSize: 18, color: COLORS.lavender }} />} title="Users" desc="Role distribution breakdown" accent={COLORS.lavender} />
              <Typography sx={{ fontFamily: fontStack, fontSize: isSmallMobile ? 20 : 26, fontWeight: 800, color: COLORS.textPrimary, letterSpacing: '-1px', mb: 2 }}>
                {formatNumber(metrics.totalUsers)}
              </Typography>
              <Grid container spacing={1.5}>
                {[
                  { icon: <School sx={{ fontSize: 14, color: COLORS.teal }} />, label: 'Students', count: formatNumber(metrics.userBreakdown.students), accent: COLORS.teal },
                  { icon: <Security sx={{ fontSize: 14, color: COLORS.orange }} />, label: 'Officers', count: formatNumber(metrics.userBreakdown.officers), accent: COLORS.orange },
                  { icon: <AdminPanelSettings sx={{ fontSize: 14, color: COLORS.lavender }} />, label: 'Admins', count: formatNumber(metrics.userBreakdown.admins), accent: COLORS.lavender },
                  { icon: <Assessment sx={{ fontSize: 14, color: '#d97706' }} />, label: 'Deans', count: formatNumber(metrics.userBreakdown.deans), accent: '#d97706' },
                ].map((item, i) => (
                  <Grid item xs={6} key={i}>
                    <Box sx={{
                      display: 'flex', alignItems: 'center', gap: 1,
                      p: 1, borderRadius: '10px',
                      backgroundColor: `${item.accent}10`,
                    }}>
                      {item.icon}
                      <Box>
                        <Typography sx={{ fontFamily: fontStack, fontSize: 13, fontWeight: 700, color: COLORS.textPrimary, lineHeight: 1.2 }}>{item.count}</Typography>
                        <Typography sx={{ fontFamily: fontStack, fontSize: 10, color: COLORS.textSecondary }}>{item.label}</Typography>
                      </Box>
                    </Box>
                  </Grid>
                ))}
              </Grid>
            </Box>

            {/* Clearance Requests Card */}
            <Box sx={{ ...glassCard, p: isSmallMobile ? 2 : 3, border: `1px solid ${COLORS.border}60` }}>
              <SectionHeader icon={<Assignment sx={{ fontSize: 18, color: '#d97706' }} />} title="Clearance Requests" desc="Total, Processed, Pending" accent={COLORS.yellow} />
              <Grid container spacing={2}>
                <Grid item xs={4}><MetricCell value={formatNumber(metrics.totalClearanceRequests)} label="Total" /></Grid>
                <Grid item xs={4}><MetricCell value={formatNumber(metrics.processedClearanceRequests)} label="Processed" color="#065f46" /></Grid>
                <Grid item xs={4}><MetricCell value={formatNumber(metrics.totalClearanceRequests - metrics.processedClearanceRequests)} label="Pending" color={COLORS.orange} /></Grid>
              </Grid>
              <Box sx={{ mt: 2 }}>
                <LinearProgress variant="determinate" value={(metrics.processedClearanceRequests / metrics.totalClearanceRequests) * 100} sx={{
                  height: 8, borderRadius: 4, backgroundColor: COLORS.border,
                  '& .MuiLinearProgress-bar': { backgroundColor: COLORS.teal, borderRadius: 4 },
                }} />
                <Typography sx={{ fontFamily: fontStack, fontSize: 11, mt: 1, color: COLORS.textSecondary }}>
                  {formatPercentage((metrics.processedClearanceRequests / metrics.totalClearanceRequests) * 100)} processed
                </Typography>
              </Box>
            </Box>

            {/* Login Activity Card */}
            <Box sx={{ ...glassCard, p: isSmallMobile ? 2 : 3, border: `1px solid ${COLORS.border}60` }}>
              <SectionHeader icon={<Schedule sx={{ fontSize: 18, color: COLORS.orange }} />} title="Login Activity" desc="Daily, Weekly, Monthly" accent={COLORS.orange} />
              <Grid container spacing={1.5}>
                {[
                  { value: formatNumber(metrics.loginActivity.daily), label: 'Daily', accent: COLORS.teal },
                  { value: formatNumber(metrics.loginActivity.weekly), label: 'Weekly', accent: COLORS.lavender },
                  { value: formatNumber(metrics.loginActivity.monthly), label: 'Monthly', accent: COLORS.orange },
                ].map((item, i) => (
                  <Grid item xs={4} key={i}>
                    <Box sx={{
                      textAlign: 'center', p: isSmallMobile ? 1.5 : 2,
                      borderRadius: '12px', backgroundColor: `${item.accent}10`,
                      border: `1px solid ${item.accent}18`,
                    }}>
                      <Box sx={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: item.accent, mx: 'auto', mb: 1 }} />
                      <MetricCell {...item} />
                    </Box>
                  </Grid>
                ))}
              </Grid>
            </Box>
          </Box>
        )}
      </TabPanel>

      {/* ═══ INSTITUTIONS TAB ══════════════════════════════════════ */}
      <TabPanel value={tabValue} index={1}>
        {tabLoading ? renderTabSkeleton() : (
          <Box sx={{ ...glassCard, p: isSmallMobile ? 2 : 3 }}>
            <SectionHeader icon={<Business sx={{ fontSize: 18, color: COLORS.teal }} />} title="Institution Performance" desc="Status, Requests, Completion Rates" accent={COLORS.teal} />
            {!isMobile ? (
              <TableContainer component={Paper} sx={{ borderRadius: '12px', border: `1px solid ${COLORS.border}`, boxShadow: 'none' }}>
                <Table>
                  <TableHead>
                    <TableRow sx={{ backgroundColor: '#F8FAFC' }}>
                      {['Institution', 'Status', 'Total Requests', 'Completed', 'Rate', 'Performance'].map((h) => (
                        <TableCell key={h} align={h === 'Institution' ? 'left' : 'center'} sx={{
                          fontFamily: fontStack, fontSize: 11, fontWeight: 700,
                          color: COLORS.textSecondary, textTransform: 'uppercase',
                          letterSpacing: '0.08em', borderBottom: `1px solid ${COLORS.border}`, py: 1.5,
                        }}>
                          {h}
                        </TableCell>
                      ))}
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {metrics.clearanceCompletionRates.map((inst) => (
                      <TableRow key={inst.institutionId} sx={{
                        transition: 'background-color 0.15s ease',
                        '&:hover': { backgroundColor: 'rgba(0,0,0,0.015)' },
                        '& td': { fontFamily: fontStack, fontSize: 14, borderBottom: `1px solid ${COLORS.border}`, py: 2 },
                      }}>
                        <TableCell sx={{ fontWeight: 600, color: COLORS.textPrimary }}>{inst.institutionName}</TableCell>
                        <TableCell align="center">
                          <Chip label={inst.status} sx={{
                            fontFamily: fontStack, borderRadius: COLORS.pillRadius, fontWeight: 700, fontSize: 10,
                            backgroundColor: inst.status === 'active' ? `${COLORS.teal}30` : `${COLORS.orange}25`,
                            color: inst.status === 'active' ? '#065f46' : '#9a3412',
                          }} />
                        </TableCell>
                        <TableCell align="center" sx={{ color: COLORS.textSecondary }}>{formatNumber(inst.totalRequests)}</TableCell>
                        <TableCell align="center" sx={{ color: COLORS.textSecondary }}>{formatNumber(inst.completedRequests)}</TableCell>
                        <TableCell align="center" sx={{ fontWeight: 600, color: COLORS.textPrimary }}>{formatPercentage(inst.completionRate)}</TableCell>
                        <TableCell align="center">
                          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 0.5 }}>
                            {inst.completionRate >= 90 ? <TrendingUp sx={{ fontSize: 16, color: COLORS.teal }} /> :
                              inst.completionRate >= 70 ? <TrendingUp sx={{ fontSize: 16, color: COLORS.orange }} /> :
                                <TrendingDown sx={{ fontSize: 16, color: '#dc2626' }} />}
                            <Typography sx={{ fontFamily: fontStack, fontSize: 12, color: COLORS.textSecondary }}>
                              {inst.completionRate >= 90 ? 'Excellent' : inst.completionRate >= 70 ? 'Good' : 'Low'}
                            </Typography>
                          </Box>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            ) : (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {metrics.clearanceCompletionRates.map((inst) => (
                  <Box key={inst.institutionId} sx={{ p: 2, borderRadius: '12px', border: `1px solid ${COLORS.border}`, backgroundColor: 'rgba(255,255,255,0.5)' }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
                      <Typography sx={{ fontFamily: fontStack, fontWeight: 700, fontSize: 14, color: COLORS.textPrimary }}>{inst.institutionName}</Typography>
                      <Chip label={inst.status} size="small" sx={{
                        fontFamily: fontStack, borderRadius: COLORS.pillRadius, fontWeight: 700, fontSize: 10,
                        backgroundColor: inst.status === 'active' ? `${COLORS.teal}30` : `${COLORS.orange}25`,
                        color: inst.status === 'active' ? '#065f46' : '#9a3412',
                      }} />
                    </Box>
                    <Grid container spacing={1.5}>
                      {[
                        { label: 'Total Requests', value: formatNumber(inst.totalRequests) },
                        { label: 'Completed', value: formatNumber(inst.completedRequests) },
                        { label: 'Rate', value: formatPercentage(inst.completionRate) },
                        { label: 'Performance', value: inst.completionRate >= 90 ? 'Excellent' : inst.completionRate >= 70 ? 'Good' : 'Low' },
                      ].map((f) => (
                        <Grid item xs={6} key={f.label}>
                          <Box sx={{ p: 1.5, borderRadius: '10px', backgroundColor: '#F8FAFC' }}>
                            <Typography sx={{ fontFamily: fontStack, fontSize: 10, fontWeight: 700, color: COLORS.textSecondary, letterSpacing: '0.08em', textTransform: 'uppercase', mb: 0.5 }}>{f.label}</Typography>
                            <Typography sx={{ fontFamily: fontStack, fontWeight: 600, fontSize: 14, color: COLORS.textPrimary }}>{f.value}</Typography>
                          </Box>
                        </Grid>
                      ))}
                    </Grid>
                  </Box>
                ))}
              </Box>
            )}
          </Box>
        )}
      </TabPanel>

      {/* ═══ USER ACTIVITY TAB ═════════════════════════════════════ */}
      <TabPanel value={tabValue} index={2}>
        {tabLoading ? renderTabSkeleton() : (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {/* User Distribution */}
            <Box sx={{ ...glassCard, p: isSmallMobile ? 2 : 3, border: `1px solid ${COLORS.border}60` }}>
              <SectionHeader icon={<People sx={{ fontSize: 18, color: COLORS.lavender }} />} title="User Distribution" desc="Students, Officers, Admins, Deans" accent={COLORS.lavender} />
              <Grid container spacing={2}>
                {[
                  { icon: <School sx={{ fontSize: isSmallMobile ? 28 : 36, color: COLORS.teal }} />, label: 'Students', value: metrics.userBreakdown.students, accent: COLORS.teal },
                  { icon: <Security sx={{ fontSize: isSmallMobile ? 28 : 36, color: COLORS.orange }} />, label: 'Officers', value: metrics.userBreakdown.officers, accent: COLORS.orange },
                  { icon: <AdminPanelSettings sx={{ fontSize: isSmallMobile ? 28 : 36, color: COLORS.lavender }} />, label: 'Admins', value: metrics.userBreakdown.admins, accent: COLORS.lavender },
                  { icon: <Assessment sx={{ fontSize: isSmallMobile ? 28 : 36, color: '#d97706' }} />, label: 'Deans', value: metrics.userBreakdown.deans, accent: '#d97706' },
                ].map((role) => (
                  <Grid item xs={6} sm={3} key={role.label}>
                    <Box sx={{
                      textAlign: 'center', p: isSmallMobile ? 2 : 3,
                      borderRadius: '12px',
                      border: `1px solid ${role.accent}20`,
                      backgroundColor: `${role.accent}08`,
                    }}>
                      <Box sx={{
                        width: 48, height: 48, borderRadius: '50%',
                        backgroundColor: `${role.accent}15`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        mx: 'auto', mb: 1,
                      }}>
                        {role.icon}
                      </Box>
                      <Typography sx={{ fontFamily: fontStack, fontSize: isSmallMobile ? 20 : 24, fontWeight: 800, color: COLORS.textPrimary, letterSpacing: '-1px' }}>
                        {formatNumber(role.value)}
                      </Typography>
                      <Typography sx={{ fontFamily: fontStack, fontSize: 12, fontWeight: 600, color: COLORS.textSecondary }}>{role.label}</Typography>
                      <Chip label={formatPercentage((role.value / metrics.totalUsers) * 100)} size="small" sx={{
                        fontFamily: fontStack, fontSize: 10, fontWeight: 700, mt: 0.75,
                        borderRadius: COLORS.pillRadius, height: 20,
                        backgroundColor: `${role.accent}18`,
                        color: COLORS.textPrimary,
                      }} />
                    </Box>
                  </Grid>
                ))}
              </Grid>
            </Box>

            {/* Login Activity Trends */}
            <Box sx={{ ...glassCard, p: isSmallMobile ? 2 : 3, border: `1px solid ${COLORS.border}60` }}>
              <SectionHeader icon={<Schedule sx={{ fontSize: 18, color: COLORS.orange }} />} title="Login Activity Trends" desc="Daily, Weekly, Monthly user activity" accent={COLORS.orange} />
              <Grid container spacing={1.5}>
                {[
                  { label: 'Daily Active', value: formatNumber(metrics.loginActivity.daily), accent: COLORS.teal },
                  { label: 'Weekly Active', value: formatNumber(metrics.loginActivity.weekly), accent: COLORS.lavender },
                  { label: 'Monthly Active', value: formatNumber(metrics.loginActivity.monthly), accent: COLORS.orange },
                ].map((item) => (
                  <Grid item xs={4} key={item.label}>
                    <Box sx={{
                      textAlign: 'center', p: isSmallMobile ? 1.5 : 2,
                      borderRadius: '12px',
                      backgroundColor: `${item.accent}10`,
                      border: `1px solid ${item.accent}18`,
                    }}>
                      <Box sx={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: item.accent, mx: 'auto', mb: 1 }} />
                      <Typography sx={{ fontFamily: fontStack, fontSize: isSmallMobile ? 18 : 22, fontWeight: 800, color: COLORS.textPrimary, letterSpacing: '-1px' }}>
                        {item.value}
                      </Typography>
                      <Typography sx={{ fontFamily: fontStack, fontSize: 10, color: COLORS.textSecondary, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        {item.label}
                      </Typography>
                    </Box>
                  </Grid>
                ))}
              </Grid>
            </Box>
          </Box>
        )}
      </TabPanel>

      {/* ═══ CLEARANCE ANALYTICS TAB ═══════════════════════════════ */}
      <TabPanel value={tabValue} index={3}>
        {tabLoading ? renderTabSkeleton() : (
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 2 }}>
            {/* Status Breakdown */}
            <Box sx={{ ...glassCard, p: isSmallMobile ? 2 : 3, border: `1px solid ${COLORS.border}60` }}>
              <SectionHeader icon={<Assignment sx={{ fontSize: 18, color: '#d97706' }} />} title="Request Status" desc="Processed, Pending, Total" accent={COLORS.yellow} />
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                {[
                  { icon: <CheckCircle sx={{ fontSize: 16, color: COLORS.teal }} />, label: 'Processed', value: formatNumber(metrics.processedClearanceRequests), color: '#065f46', accent: COLORS.teal },
                  { icon: <Pending sx={{ fontSize: 16, color: COLORS.orange }} />, label: 'Pending', value: formatNumber(metrics.totalClearanceRequests - metrics.processedClearanceRequests), color: COLORS.orange, accent: COLORS.orange },
                  { icon: <Assignment sx={{ fontSize: 16, color: COLORS.black }} />, label: 'Total Requests', value: formatNumber(metrics.totalClearanceRequests), color: COLORS.textPrimary, accent: COLORS.black },
                ].map((row) => (
                  <Box key={row.label} sx={{
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    p: 1.5, borderRadius: '12px',
                    backgroundColor: `${row.accent}08`,
                    border: `1px solid ${row.accent}10`,
                  }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      {row.icon}
                      <Typography sx={{ fontFamily: fontStack, fontSize: 14, fontWeight: 600, color: COLORS.textPrimary }}>{row.label}</Typography>
                    </Box>
                    <Typography sx={{ fontFamily: fontStack, fontSize: 22, fontWeight: 800, color: row.color, letterSpacing: '-1px' }}>{row.value}</Typography>
                  </Box>
                ))}
              </Box>
            </Box>

            {/* Performance Metrics */}
            <Box sx={{ ...glassCard, p: isSmallMobile ? 2 : 3, border: `1px solid ${COLORS.border}60` }}>
              <SectionHeader icon={<Assessment sx={{ fontSize: 18, color: COLORS.lavender }} />} title="Performance" desc="Completion and Activity Rates" accent={COLORS.lavender} />
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                <Box sx={{ p: 2, borderRadius: '12px', backgroundColor: `${COLORS.teal}08`, border: `1px solid ${COLORS.teal}12` }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
                    <Typography sx={{ fontFamily: fontStack, fontSize: 13, color: COLORS.textPrimary, fontWeight: 600 }}>
                      Completion Rate
                    </Typography>
                    <Typography sx={{ fontFamily: fontStack, fontSize: 20, fontWeight: 800, color: '#065f46', letterSpacing: '-0.5px' }}>
                      {formatPercentage((metrics.processedClearanceRequests / metrics.totalClearanceRequests) * 100)}
                    </Typography>
                  </Box>
                  <LinearProgress variant="determinate" value={(metrics.processedClearanceRequests / metrics.totalClearanceRequests) * 100} sx={{
                    height: 8, borderRadius: 4, backgroundColor: COLORS.border,
                    '& .MuiLinearProgress-bar': { backgroundColor: COLORS.teal, borderRadius: 4 },
                  }} />
                </Box>
                <Box sx={{ p: 2, borderRadius: '12px', backgroundColor: `${COLORS.lavender}08`, border: `1px solid ${COLORS.lavender}12` }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
                    <Typography sx={{ fontFamily: fontStack, fontSize: 13, color: COLORS.textPrimary, fontWeight: 600 }}>
                      User Activity Rate
                    </Typography>
                    <Typography sx={{ fontFamily: fontStack, fontSize: 20, fontWeight: 800, color: COLORS.lavender, letterSpacing: '-0.5px' }}>
                      {formatPercentage((metrics.loginActivity.monthly / metrics.totalUsers) * 100)}
                    </Typography>
                  </Box>
                  <LinearProgress variant="determinate" value={(metrics.loginActivity.monthly / metrics.totalUsers) * 100} sx={{
                    height: 8, borderRadius: 4, backgroundColor: COLORS.border,
                    '& .MuiLinearProgress-bar': { backgroundColor: COLORS.lavender, borderRadius: 4 },
                  }} />
                </Box>
              </Box>
            </Box>
          </Box>
        )}
      </TabPanel>
    </Box>
  );
}
