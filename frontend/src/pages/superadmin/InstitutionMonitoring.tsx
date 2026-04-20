import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Box, Typography, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, FormControl,
  Select, MenuItem, Button, Dialog, DialogTitle, DialogContent,
  DialogActions, Tooltip, IconButton, LinearProgress,
  Pagination, Avatar, useTheme, useMediaQuery, Skeleton,
  InputAdornment, TextField, Grid, Chip
} from '@mui/material';
import {
  Visibility, Business, Search,
  LocationOn, Phone, Email, Language, AdminPanelSettings,
  ChevronLeft, ChevronRight, History, Domain
} from '@mui/icons-material';
import { superAdminService } from '../../services';
import { motion, AnimatePresence, LayoutGroup } from "framer-motion";
import { getInitials } from "../../utils/avatarUtils";

const COLORS = {
  pageBg: '#F9FAFB',
  surface: '#FFFFFF',
  black: '#1E293B',
  textPrimary: '#1E293B',
  textSecondary: '#64748B',
  teal: '#0E7490',
  lavender: '#818CF8',
  orange: '#F59E0B',
  border: '#F1F5F9',
  cardRadius: '20px',
  pillRadius: '999px',
  tealLight: 'rgba(14, 116, 144, 0.15)',
};

const fontStack = '"Google Sans", "Product Sans", Roboto, sans-serif';

interface Institution {
  _id: string;
  name: string;
  domain: string;
  address: string;
  contactNumber: string;
  email: string;
  administratorName: string;
  administratorPosition: string;
  status: 'pending' | 'approved' | 'rejected' | 'suspended';
  createdAt: string;
}

interface InstitutionStats {
  totalInstitutions: number;
  approvedInstitutions: number;
  pendingInstitutions: number;
  suspendedInstitutions: number;
}

// ─── Bento Institution Card Sub-component ───────────────────────────
const InstitutionBentoCard = ({
  inst,
  onDetails,
  onManageUsers
}: {
  inst: Institution;
  onDetails: (inst: Institution) => void;
  onManageUsers: (inst: Institution) => void;
}) => {
  const statusStyle = (s: string) => {
    switch (s?.toLowerCase()) {
      case 'approved': return { color: '#0D9488', bg: 'rgba(13, 148, 136, 0.1)' };
      case 'pending': return { color: '#D97706', bg: 'rgba(217, 119, 6, 0.1)' };
      case 'suspended': return { color: '#DC2626', bg: 'rgba(220, 38, 38, 0.1)' };
      default: return { color: '#64748B', bg: '#F1F5F9' };
    }
  };

  const currentStatus = statusStyle(inst.status);

  return (
    <Box sx={{
      p: { xs: 2.5, sm: 3 }, borderRadius: COLORS.cardRadius, bgcolor: COLORS.surface,
      border: `1px solid ${COLORS.border}`,
      boxShadow: '0 10px 30px -10px rgba(0,0,0,0.04), 0 4px 6px -1px rgba(0,0,0,0.02)',
      position: 'relative',
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'space-between',
      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
      '&:hover': {
        transform: 'translateY(-4px)',
        boxShadow: '0 20px 40px -10px rgba(0,0,0,0.12), 0 10px 15px -5px rgba(0,0,0,0.05)',
        borderColor: 'rgba(14, 116, 144, 0.3)'
      }
    }}>
      <Box sx={{ mb: 2 }}>
        <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, justifyContent: 'space-between', alignItems: { xs: 'flex-start', sm: 'center' }, gap: 2, mb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Avatar sx={{
              width: { xs: 40, sm: 44 }, height: { xs: 40, sm: 44 },
              bgcolor: currentStatus.bg,
              color: currentStatus.color,
              fontWeight: 800, fontSize: { xs: 14, sm: 16 }
            }}>
              {getInitials(inst.name)}
            </Avatar>
            <Box sx={{ minWidth: 0, flex: 1 }}>
              <Typography sx={{
                fontWeight: 800,
                fontSize: { xs: 14, sm: 15 },
                color: COLORS.textPrimary,
                display: '-webkit-box',
                WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden',
                lineHeight: 1.2,
                mb: 0.2
              }}>
                {inst.name}
              </Typography>
              <Typography sx={{
                fontSize: { xs: 11, sm: 12 },
                color: COLORS.textSecondary,
                fontWeight: 500,
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis'
              }}>
                {inst.administratorName}
              </Typography>
            </Box>
          </Box>
          <Box sx={{ 
            px: 1.5, 
            py: 0.5, 
            borderRadius: '999px', 
            bgcolor: currentStatus.bg, 
            color: currentStatus.color,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            height: 'fit-content'
          }}>
            <Typography sx={{ 
              fontSize: 10, 
              fontWeight: 800, 
              fontFamily: fontStack,
              lineHeight: 1,
              letterSpacing: '0.02em'
            }}>
              {inst.status.charAt(0).toUpperCase() + inst.status.slice(1).toLowerCase()}
            </Typography>
          </Box>
        </Box>


        <Typography sx={{
          fontSize: { xs: 12, sm: 13 },
          fontWeight: 600,
          color: '#334155',
          mb: 2.5,
          fontStyle: 'italic',
          display: '-webkit-box',
          WebkitLineClamp: 3,
          WebkitBoxOrient: 'vertical',
          overflow: 'hidden',
          minHeight: '3.6em'
        }}>
          "{inst.address || "Institutional academic domain providing higher education services and integrated clearance workflows."}"
        </Typography>
      </Box>

      <Box sx={{ 
        pt: 2, 
        borderTop: '1px solid #F1F5F9', 
        display: 'flex', 
        flexDirection: { xs: 'column', sm: 'row' }, 
        justifyContent: 'space-between', 
        alignItems: { xs: 'flex-start', sm: 'center' }, 
        gap: 2 
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, color: COLORS.textSecondary }}>
          <Language sx={{ fontSize: 16 }} />
          <Typography sx={{ fontSize: 13, fontWeight: 700 }}>{inst.domain}</Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1, width: { xs: '100%', sm: 'auto' }, justifyContent: 'flex-end' }}>
          <Button
            onClick={() => onDetails(inst)}
            size="small"
            variant="text"
            sx={{
              textTransform: 'none', fontWeight: 800, color: COLORS.teal,
              fontSize: 12,
              minWidth: 'auto',
              '&:hover': {
                bgcolor: 'transparent',
                textDecoration: 'underline',
              },
              transition: 'all 0.2s'
            }}
          >
            Details
          </Button>
        </Box>
      </Box>
    </Box>
  );
};

const CardSkeleton = () => (
  <Box sx={{
    p: 3, borderRadius: COLORS.cardRadius, bgcolor: COLORS.surface,
    border: `1px solid ${COLORS.border}`, boxShadow: '0 4px 6px -1px rgba(0,0,0,0.02)',
    height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between'
  }}>
    <Box sx={{ mb: 2 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Skeleton variant="circular" width={44} height={44} />
          <Box>
            <Skeleton variant="text" width={100} height={20} />
            <Skeleton variant="text" width={60} height={16} />
          </Box>
        </Box>
        <Skeleton variant="rectangular" width={50} height={20} sx={{ borderRadius: '10px' }} />
      </Box>
      <Skeleton variant="text" width="100%" height={16} />
      <Skeleton variant="text" width="90%" height={16} />
    </Box>
    <Box sx={{ pt: 2, borderTop: '1px solid #F1F5F9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <Skeleton variant="text" width={60} height={16} />
      <Box sx={{ display: 'flex', gap: 1 }}>
        <Skeleton variant="rectangular" width={60} height={32} sx={{ borderRadius: '10px' }} />
      </Box>
    </Box>
  </Box>
);

const StatsCardSkeleton = () => (
  <Box sx={{
    borderRadius: COLORS.cardRadius, p: 3,
    backgroundColor: COLORS.surface, border: `1px solid ${COLORS.border}`,
    minHeight: 125, display: 'flex', flexDirection: 'column', justifyContent: 'space-between'
  }}>
    <Box sx={{ mb: 2 }}>
      <Skeleton variant="text" width={100} height={16} sx={{ mb: 0.5 }} />
      <Skeleton variant="text" width={60} height={36} />
    </Box>
  </Box>
);

const ToolbarSkeleton = () => (
  <Box sx={{ p: { xs: 3, sm: 4 }, pb: 2 }}>
    <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, justifyContent: 'space-between', alignItems: { xs: 'flex-start', sm: 'center' }, gap: 2, mb: 3 }}>
      <Skeleton variant="text" width={180} height={32} />
    </Box>
    <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 2, mb: 2 }}>
      <Skeleton variant="rectangular" width="100%" height={44} sx={{ borderRadius: '12px', flex: 1 }} />
      <Skeleton variant="rectangular" width={200} height={44} sx={{ borderRadius: '12px', alignSelf: { xs: 'center', md: 'auto' } }} />
    </Box>
  </Box>
);

export default function InstitutionMonitoring() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const isSmallMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const [institutions, setInstitutions] = useState<Institution[]>([]);
  const [stats, setStats] = useState<InstitutionStats>({
    totalInstitutions: 0, approvedInstitutions: 0, pendingInstitutions: 0, suspendedInstitutions: 0
  });

  const [filters, setFilters] = useState({ status: '', search: '' });
  const [loading, setLoading] = useState(true);
  const [filterLoading, setFilterLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedInstitution, setSelectedInstitution] = useState<Institution | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const prevStatusRef = useRef(filters.status);
  const [direction, setDirection] = useState(0);

  const statusOrder = ['', 'approved', 'pending', 'suspended'];


  const fetchData = useCallback(async (initial = false) => {
    if (initial) setLoading(true);
    else setFilterLoading(true);
    try {
      // For now we use getInstitutions which returns all
      const iRes = await superAdminService.getInstitutions();
      const allInstitutions = iRes.institutions || [];

      // Calculate local stats since we don't have a dedicated endpoint yet
      const calculatedStats = {
        totalInstitutions: allInstitutions.length,
        approvedInstitutions: allInstitutions.filter((i: any) => i.status === 'approved').length,
        pendingInstitutions: allInstitutions.filter((i: any) => i.status === 'pending').length,
        suspendedInstitutions: allInstitutions.filter((i: any) => i.status === 'suspended').length,
      };
      setStats(calculatedStats);

      // Local filtering and pagination for now as the current service doesn't support them
      let filtered = allInstitutions;
      if (filters.search) {
        const s = filters.search.toLowerCase();
        filtered = filtered.filter((i: any) =>
          i.name.toLowerCase().includes(s) ||
          i.domain.toLowerCase().includes(s) ||
          i.email.toLowerCase().includes(s)
        );
      }
      if (filters.status) {
        filtered = filtered.filter((i: any) => i.status === filters.status);
      }

      const limit = 20;
      setTotalPages(Math.ceil(filtered.length / limit) || 1);
      setInstitutions(filtered.slice((page - 1) * limit, page * limit));

      // Artificial delay for better UX if initial
      if (initial) await new Promise(resolve => setTimeout(resolve, 800));
    } catch (e) { console.error(e); }
    finally { setLoading(false); setFilterLoading(false); }
  }, [page, filters]);

  useEffect(() => { fetchData(true); }, []);
  useEffect(() => { if (!loading) fetchData(); }, [filters, page]);

  const handleFilterChange = (field: string, value: string) => {
    if (field === 'status') {
      const prevIndex = statusOrder.indexOf(filters.status);
      const nextIndex = statusOrder.indexOf(value);
      setDirection(nextIndex > prevIndex ? 1 : -1);
    }
    setFilters(prev => ({ ...prev, [field]: value }));
    setPage(1);
  };

  const getStatusStyle = (s: string) => {
    switch (s?.toLowerCase()) {
      case 'approved': return { color: '#065f46', bg: '#dcfce7' };
      case 'pending': return { color: '#92400e', bg: '#fef3c7' };
      case 'suspended': return { color: '#991b1b', bg: '#fee2e2' };
      case 'rejected': return { color: '#991b1b', bg: '#fee2e2' };
      default: return { color: COLORS.textSecondary, bg: '#f1f5f9' };
    }
  };

  if (loading) {
    return (
      <Box sx={{ px: isSmallMobile ? 3 : 5, pb: isSmallMobile ? 3 : 5, pt: 2, bgcolor: COLORS.pageBg, minHeight: '100vh', fontFamily: fontStack }}>
        {/* Header Skeleton */}
        <Box sx={{ mb: { xs: 4, sm: 6 } }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 0.5 }}>
            <Skeleton variant="rounded" width={44} height={44} sx={{ borderRadius: 2, bgcolor: '#eaebec' }} />
            <Skeleton variant="text" width={280} height={48} />
          </Box>
          <Skeleton variant="text" width="60%" height={24} sx={{ mt: 1 }} />
        </Box>

        {/* Stats Skeleton */}
        <Box sx={{
          display: 'grid',
          gridTemplateColumns: { xs: 'repeat(1, 1fr)', sm: 'repeat(2, 1fr)', md: 'repeat(4, 1fr)' },
          gap: 3, mb: 4,
        }}>
          {[1, 2, 3, 4].map((i) => <StatsCardSkeleton key={i} />)}
        </Box>

        {/* Directory Skeleton */}
        <Box sx={{
          borderRadius: COLORS.cardRadius,
          backgroundColor: COLORS.surface,
          border: `1px solid ${COLORS.border}`,
          boxShadow: '0 4px 6px -1px rgba(0,0,0,0.02)',
          overflow: 'hidden'
        }}>
          <ToolbarSkeleton />
          <Box sx={{ p: 4, pt: 0 }}>
            <Grid container spacing={3}>
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <Grid item xs={12} sm={6} lg={4} key={i}>
                  <CardSkeleton />
                </Grid>
              ))}
            </Grid>
          </Box>
        </Box>
      </Box>
    );
  }

  return (
    <Box sx={{
      px: { xs: 2.5, sm: 4, md: 5 },
      pb: { xs: 4, sm: 5, md: 6 },
      pt: 2,
      bgcolor: COLORS.pageBg,
      minHeight: '100vh',
      fontFamily: fontStack
    }}>

      {/* ── Page Header ────────────────────────────────────────────── */}
      <Box sx={{ mb: { xs: 4, sm: 6 } }}>
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
            <Business sx={{ fontSize: { xs: 24, sm: 28 } }} />
          </Box>
          <Typography sx={{
            fontFamily: fontStack,
            fontWeight: 600,
            fontSize: { xs: '1.25rem', sm: '1.75rem', md: '1.875rem' },
            color: '#000',
            lineHeight: 1.2,
          }}>
            Institution Monitoring
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
          Comprehensive oversight and administrative management of all integrated academic domains.
        </Typography>
      </Box>

      {/* ── Stats Bento Row ────────────────────────────────────────── */}
      <Box sx={{
        display: 'grid',
        gridTemplateColumns: { xs: 'repeat(1, 1fr)', sm: 'repeat(2, 1fr)', md: 'repeat(4, 1fr)' },
        gap: 3, mb: 4,
      }}>
        {[
          { label: "Total Institutions", value: stats.totalInstitutions, sub: "System Count", icon: <Business sx={{ fontSize: 18 }} /> },
          { label: "Approved Access", value: stats.approvedInstitutions, sub: "Active Domains", icon: <Visibility sx={{ fontSize: 18 }} /> },
          { label: "Pending Review", value: stats.pendingInstitutions, sub: "Awaiting Action", icon: <History sx={{ fontSize: 18 }} /> },
          { label: "Suspended Status", value: stats.suspendedInstitutions, sub: "Inactive Access", icon: <Domain sx={{ fontSize: 18 }} /> },
        ].map((stat) => (
          <Box key={stat.label} sx={{
            borderRadius: COLORS.cardRadius,
            p: { xs: 2.5, sm: 3 },
            backgroundColor: COLORS.surface,
            border: `1px solid ${COLORS.border}`,
            minHeight: { xs: 110, sm: 125 },
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            boxShadow: '0 10px 15px -3px rgba(0,0,0,0.03), 0 4px 6px -2px rgba(0,0,0,0.01)',
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            '&:hover': {
              transform: 'translateY(-5px)',
              boxShadow: '0 20px 25px -5px rgba(0,0,0,0.08), 0 10px 10px -5px rgba(0,0,0,0.01)',
            }
          }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <Box>
                <Typography sx={{ fontSize: { xs: 11, sm: 12, md: 13 }, fontWeight: 700, color: COLORS.textSecondary, mb: 0.5 }}>
                  {stat.label}
                </Typography>
                <Typography sx={{
                  fontWeight: 900,
                  fontSize: { xs: 24, sm: 28, md: 32 },
                  color: COLORS.textPrimary,
                  letterSpacing: '-1.5px',
                  lineHeight: 1
                }}>
                  {stat.value}
                </Typography>
              </Box>
              <Box sx={{
                p: { xs: 0.75, sm: 1 },
                borderRadius: '10px',
                bgcolor: 'rgba(14, 116, 144, 0.08)',
                color: COLORS.teal,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}>
                {stat.icon}
              </Box>
            </Box>
            <Typography sx={{ fontSize: { xs: 10, sm: 11, md: 12 }, color: COLORS.textSecondary, fontWeight: 600, mt: 1.5 }}>
              {stat.sub}
            </Typography>
          </Box>
        ))}
      </Box>

      {/* ── Institution Directory (Card View) ─────────────────────────── */}
      <Box sx={{
        borderRadius: COLORS.cardRadius,
        backgroundColor: COLORS.surface,
        border: `1px solid ${COLORS.border}`,
        boxShadow: '0 4px 6px -1px rgba(0,0,0,0.02)',
        overflow: 'hidden'
      }}>
        {/* Toolbar Section */}
        <Box sx={{ p: { xs: 3, sm: 4 }, pb: 2 }}>
          <Box sx={{
            display: 'flex',
            flexDirection: { xs: 'column', sm: 'row' },
            justifyContent: 'space-between',
            alignItems: { xs: 'flex-start', sm: 'center' },
            gap: 2.5, mb: 4
          }}>
            <Box>
              <Typography sx={{ fontWeight: 700, fontSize: { xs: 18, sm: 22 }, color: COLORS.textPrimary, letterSpacing: '-0.25px' }}>
                Institution Directory
              </Typography>
            </Box>
          </Box>

          <Box sx={{
            display: 'flex',
            flexDirection: { xs: 'column', md: 'row' },
            gap: 2, mb: 2,
            alignItems: 'center'
          }}>
            <TextField
              placeholder="Search name, domain, or email..."
              value={filters.search}
              onChange={(e) => handleFilterChange('search', e.target.value)}
              size="small"
              InputProps={{
                startAdornment: <InputAdornment position="start"><Search sx={{ fontSize: 20, color: COLORS.textSecondary }} /></InputAdornment>,
                sx: {
                  borderRadius: '12px',
                  bgcolor: '#F8FAFC',
                  height: 44,
                }
              }}
              sx={{
                flex: 1,
                width: '100%',
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

            <Box sx={{
              display: 'flex',
              bgcolor: '#F8FAFC',
              p: 0.75,
              borderRadius: '14px',
              width: { xs: '100%', md: 'auto' },
              justifyContent: { xs: 'flex-start', md: 'center' },
              overflowX: 'auto',
              msOverflowStyle: 'none',  /* IE and Edge */
              scrollbarWidth: 'none',  /* Firefox */
              '&::-webkit-scrollbar': { display: 'none' }, /* Chrome, Safari and Opera */
              gap: 0.5
            }}>
              <LayoutGroup id="status-tabs">
                {(['', 'approved', 'pending', 'suspended'] as const).map((status) => (
                  <Button
                    key={status}
                    onClick={() => handleFilterChange('status', status)}
                    sx={{
                      flex: { xs: 1, md: 'none' },
                      textTransform: 'none', 
                      px: { xs: 1, sm: 2.5 }, 
                      py: 1.25, 
                      borderRadius: '12px', 
                      fontSize: { xs: 12, sm: 13 }, 
                      fontWeight: 700,
                      bgcolor: 'transparent',
                      color: filters.status === status ? COLORS.textPrimary : COLORS.textSecondary,
                      whiteSpace: 'nowrap',
                      position: 'relative',
                      zIndex: 1,
                      minWidth: { xs: 0, md: 'max-content' },
                      transition: 'color 0.4s ease-in-out',
                      '&:hover': { bgcolor: 'transparent' }
                    }}
                  >
                    {filters.status === status && (
                      <motion.div
                        layoutId="activeStatusTab"
                        style={{
                          position: 'absolute',
                          top: 0,
                          left: 0,
                          right: 0,
                          bottom: 0,
                          backgroundColor: '#FFF',
                          borderRadius: '10px',
                          zIndex: -1,
                          boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)'
                        }}
                        transition={{ type: 'spring', stiffness: 80, damping: 18, mass: 1 }}
                      />
                    )}
                    {status === '' ? 'All' : status.charAt(0).toUpperCase() + status.slice(1)}
                  </Button>
                ))}
              </LayoutGroup>
            </Box>
          </Box>
        </Box>

        <Box sx={{ p: { xs: 2, sm: 4 }, pt: 0 }}>
          {institutions.length === 0 && !filterLoading ? (
            <Box sx={{ py: 12, textAlign: 'center' }}>
              <Business sx={{ fontSize: 48, color: '#CBD5E1', mb: 2 }} />
              <Typography sx={{ color: COLORS.textSecondary, fontFamily: fontStack, fontSize: 16, fontWeight: 600 }}>
                No institutions found matching your criteria.
              </Typography>
            </Box>
          ) : (
            <AnimatePresence mode="wait" custom={direction}>
              <motion.div
                key={filters.status}
                custom={direction}
                variants={{
                  enter: {
                    opacity: 0
                  },
                  center: {
                    opacity: 1
                  },
                  exit: {
                    opacity: 0
                  }
                }}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{
                  opacity: { duration: 0.3 }
                }}
              >
                <Grid container spacing={{ xs: 2.5, sm: 3 }}>
                  {institutions.map((inst) => (
                    <Grid item xs={12} sm={6} lg={4} key={inst._id}>
                      <InstitutionBentoCard
                        inst={inst}
                        onDetails={(i) => { setSelectedInstitution(i); setShowDetails(true); }}
                        onManageUsers={(i) => { window.location.href = `/super-admin/institution-monitoring/${i._id}`; }}
                      />
                    </Grid>
                  ))}
                </Grid>
              </motion.div>

              {totalPages > 1 && (
                <Box sx={{ mt: 6, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, pt: 4, borderTop: `1px solid ${COLORS.border}` }}>
                  <Typography sx={{ fontSize: 13, color: COLORS.textSecondary, fontWeight: 600 }}>
                    Showing page <Box component="span" sx={{ color: COLORS.textPrimary }}>{page}</Box> of <Box component="span" sx={{ color: COLORS.textPrimary }}>{totalPages}</Box>
                  </Typography>
                  <Box sx={{
                    display: 'flex',
                    gap: { xs: 0.5, sm: 1.5 },
                    alignItems: 'center',
                    bgcolor: '#F1F5F9',
                    px: { xs: 0.5, sm: 1 },
                    py: 0.5,
                    borderRadius: '40px'
                  }}>
                    <IconButton
                      disabled={page === 1}
                      onClick={() => setPage(page - 1)}
                      sx={{ color: page === 1 ? '#CBD5E1' : COLORS.textSecondary, p: { xs: 0.75, sm: 1 } }}
                    >
                      <ChevronLeft sx={{ fontSize: { xs: 18, sm: 20 } }} />
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
                              width: { xs: 32, sm: 36 },
                              height: { xs: 32, sm: 36 },
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              cursor: 'pointer',
                              borderRadius: '12px',
                              bgcolor: isActive ? COLORS.black : 'transparent',
                              color: isActive ? '#FFFFFF' : COLORS.textSecondary,
                              fontWeight: 800,
                              fontSize: { xs: 13, sm: 14 },
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
                      sx={{ color: page === totalPages ? '#CBD5E1' : COLORS.textSecondary, p: { xs: 0.75, sm: 1 } }}
                    >
                      <ChevronRight sx={{ fontSize: { xs: 18, sm: 20 } }} />
                    </IconButton>
                  </Box>
                </Box>
              )}
            </AnimatePresence>
          )}
        </Box>
      </Box>

      <Dialog
        open={showDetails}
        onClose={() => setShowDetails(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: '16px',
            p: { xs: 0, sm: 1 },
            margin: { xs: 1, sm: 4 },
            fontFamily: fontStack,
            maxHeight: { xs: '90vh', sm: 'auto' }
          }
        }}
      >
        <DialogTitle sx={{ p: { xs: 2.5, sm: 4 }, pb: 1 }}>
          <Typography sx={{ fontWeight: 600, fontSize: { xs: '1.15rem', sm: '1.5rem' }, color: COLORS.textPrimary, letterSpacing: '-0.2px', fontFamily: fontStack }}>
            Institution Profile
          </Typography>
          <Typography sx={{ fontSize: { xs: 11, sm: 13 }, color: COLORS.textSecondary, fontWeight: 400, mt: 0.5, fontFamily: fontStack }}>
            Detailed overview of organizational and administrative information.
          </Typography>
        </DialogTitle>
        <DialogContent sx={{ p: { xs: 2.5, sm: 4 }, py: { xs: 1, sm: 0 } }}>
          {selectedInstitution && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: { xs: 2, sm: 3.5 } }}>
              <Box>
                <Typography sx={{ fontWeight: 600, fontSize: 11, color: COLORS.textSecondary, mb: 1, textTransform: 'uppercase', letterSpacing: '0.05em', fontFamily: fontStack }}>
                  School Information
                </Typography>
                <Typography sx={{ fontWeight: 600, fontSize: { xs: 15, sm: 17 }, color: COLORS.textPrimary, mb: 0.5, fontFamily: fontStack }}>
                  {selectedInstitution.name}
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <LocationOn sx={{ fontSize: 16, color: COLORS.teal }} />
                  <Typography sx={{ fontSize: 13, color: COLORS.textSecondary, fontWeight: 400, fontFamily: fontStack }}>
                    {selectedInstitution.address}
                  </Typography>
                </Box>
              </Box>

              <Grid container spacing={{ xs: 2.5, sm: 3 }}>
                <Grid item xs={12} sm={6}>
                  <Typography sx={{ fontWeight: 600, fontSize: 11, color: COLORS.textSecondary, mb: 1, textTransform: 'uppercase', letterSpacing: '0.05em', fontFamily: fontStack }}>
                    Access Domain
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Language sx={{ fontSize: 16, color: COLORS.teal }} />
                    <Typography sx={{ fontSize: 13, fontWeight: 600, fontFamily: fontStack }}>{selectedInstitution.domain}</Typography>
                  </Box>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography sx={{ fontWeight: 600, fontSize: 11, color: COLORS.textSecondary, mb: 1, textTransform: 'uppercase', letterSpacing: '0.05em', fontFamily: fontStack }}>
                    Contact Number
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Phone sx={{ fontSize: 16, color: COLORS.teal }} />
                    <Typography sx={{ fontSize: 13, fontWeight: 600, fontFamily: fontStack }}>{selectedInstitution.contactNumber}</Typography>
                  </Box>
                </Grid>
              </Grid>

              <Box>
                <Typography sx={{ fontWeight: 600, fontSize: 11, color: COLORS.textSecondary, mb: 1, textTransform: 'uppercase', letterSpacing: '0.05em', fontFamily: fontStack }}>
                  Administrative Authority
                </Typography>
                <Box sx={{ p: 2, bgcolor: '#f8fafc', borderRadius: '8px', border: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Avatar sx={{
                    bgcolor: '#5f6368',
                    width: { xs: 40, sm: 48 },
                    height: { xs: 40, sm: 48 },
                    fontSize: { xs: 14, sm: 16 },
                    fontWeight: 800,
                    borderRadius: '8px'
                  }}>
                    {getInitials(selectedInstitution.administratorName)}
                  </Avatar>
                  <Box>
                    <Typography sx={{ fontWeight: 600, fontSize: 14, color: COLORS.textPrimary, fontFamily: fontStack }}>
                      {selectedInstitution.administratorName}
                    </Typography>
                    <Typography sx={{ fontSize: 12, color: COLORS.textSecondary, fontWeight: 400, fontFamily: fontStack }}>
                      {selectedInstitution.administratorPosition}
                    </Typography>
                  </Box>
                </Box>
              </Box>

              <Box sx={{ mt: 0.5 }}>
                <Typography sx={{ fontWeight: 600, fontSize: 11, color: COLORS.textSecondary, mb: 1, textTransform: 'uppercase', letterSpacing: '0.05em', fontFamily: fontStack }}>
                  Official Email
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, p: 2, bgcolor: '#F0FDFA', borderRadius: '8px', border: '1px solid #CCFBF1' }}>
                  <Email sx={{ fontSize: 20, color: COLORS.teal }} />
                  <Typography sx={{ fontSize: 13, fontWeight: 600, color: '#115E59', fontFamily: fontStack }}>
                    {selectedInstitution.email}
                  </Typography>
                </Box>
              </Box>
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ p: { xs: 2.5, sm: 4 }, pt: 1 }}>
          <Button
            onClick={() => setShowDetails(false)}
            fullWidth
            sx={{
              textTransform: 'none',
              fontWeight: 600,
              color: '#FFF',
              bgcolor: '#3c4043',
              borderRadius: '8px',
              py: { xs: 1.25, sm: 1.5 },
              fontSize: '15px',
              fontFamily: fontStack,
              '&:hover': { bgcolor: '#2d2e30' }
            }}
          >
            Close Profile
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
