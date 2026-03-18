import React, { useState, useEffect, useCallback } from 'react';
import {
  Box, Typography, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, FormControl,
  Select, MenuItem, Button, Dialog, DialogTitle, DialogContent,
  DialogActions, Tooltip, IconButton, LinearProgress,
  Pagination, Avatar, useTheme, useMediaQuery, Skeleton,
  InputAdornment, TextField
} from '@mui/material';
import {
  Visibility, Business, FilterList, Refresh, Search, 
  LocationOn, Phone, Email, Language, Domain, AdminPanelSettings
} from '@mui/icons-material';
import { superAdminService } from '../../services';

const COLORS = {
  pageBg: '#ffffff',
  surface: '#ffffff',
  black: '#0a0a0a',
  textPrimary: '#1a1a1a',
  textSecondary: '#64748B',
  teal: '#5fcca0',
  lavender: '#cb9bfb',
  yellow: '#fde047',
  orange: '#fb923c',
  border: '#f1f5f9',
  cardRadius: '16px',
  pillRadius: '999px',
};

const fontStack = "'Inter', 'Plus Jakarta Sans', 'Montserrat', sans-serif";

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
      <Box sx={{ p: isSmallMobile ? 2 : 5, bgcolor: COLORS.pageBg, minHeight: '100vh', fontFamily: fontStack }}>
        <Skeleton variant="rounded" width={250} height={38} sx={{ mb: 4 }} />
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr 1fr', md: 'repeat(4, 1fr)' }, gap: 2.5, mb: 4 }}>
          {[1, 2, 3, 4].map((_, i) => (
            <Skeleton key={i} variant="rounded" height={100} sx={{ borderRadius: COLORS.cardRadius }} />
          ))}
        </Box>
        <Skeleton variant="rounded" height={400} sx={{ borderRadius: COLORS.cardRadius }} />
      </Box>
    );
  }

  return (
    <Box sx={{ p: isSmallMobile ? 2 : 5, bgcolor: COLORS.pageBg, minHeight: '100vh', fontFamily: fontStack }}>
      
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4, flexDirection: isSmallMobile ? 'column' : 'row', gap: 2 }}>
        <Box>
          <Typography sx={{ fontFamily: fontStack, fontWeight: 800, fontSize: isSmallMobile ? '28px' : '32px', color: COLORS.black, letterSpacing: '-1px' }}>
            Institution Monitoring
          </Typography>
          <Typography sx={{ fontFamily: fontStack, color: COLORS.textSecondary, fontSize: '15px', mt: 0.5 }}>
            Overview of all academic institutions in the system
          </Typography>
        </Box>
        <Button 
          startIcon={<Refresh sx={{ fontSize: 18 }} />} 
          onClick={() => fetchData(true)} 
          sx={{ 
            borderRadius: COLORS.pillRadius, 
            bgcolor: COLORS.black, 
            color: '#ffffff',
            textTransform: 'none',
            fontFamily: fontStack,
            fontWeight: 600,
            px: 3,
            py: 1,
            '&:hover': { bgcolor: '#333333' }
          }}
        >
          Refresh
        </Button>
      </Box>

      {/* Stat Cards */}
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr 1fr', md: 'repeat(4, 1fr)' }, gap: 2.5, mb: 4 }}>
        {[
          { label: 'TOTAL INSTITUTIONS', value: stats.totalInstitutions, accent: COLORS.black, bg: '#f8fafc' },
          { label: 'APPROVED', value: stats.approvedInstitutions, accent: COLORS.teal, bg: '#f0fdf4' },
          { label: 'PENDING', value: stats.pendingInstitutions, accent: COLORS.yellow, bg: '#fefce8' },
          { label: 'SUSPENDED', value: stats.suspendedInstitutions, accent: COLORS.orange, bg: '#fff7ed' },
        ].map(s => (
          <Box key={s.label} sx={{ p: 3, borderRadius: COLORS.cardRadius, bgcolor: s.bg, display: 'flex', flexDirection: 'column', gap: 1 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
              <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: s.accent }} />
              <Typography sx={{ fontSize: 10, fontWeight: 700, color: COLORS.textSecondary, letterSpacing: '0.5px' }}>
                {s.label}
              </Typography>
            </Box>
            <Typography sx={{ fontWeight: 800, fontSize: '32px', color: COLORS.black, lineHeight: 1 }}>
              {s.value}
            </Typography>
          </Box>
        ))}
      </Box>

      {/* Filter Bar */}
      <Box sx={{ p: 3, bgcolor: '#fafafa', borderRadius: COLORS.cardRadius, border: `1px solid ${COLORS.border}`, borderBottomLeftRadius: 0, borderBottomRightRadius: 0 }}>
        <Box sx={{ display: 'flex', gap: 2, flexDirection: isMobile ? 'column' : 'row' }}>
          <TextField
            fullWidth
            placeholder="Search name, domain, or email..."
            variant="outlined"
            size="small"
            value={filters.search}
            onChange={(e) => handleFilterChange('search', e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Search sx={{ color: COLORS.textSecondary, fontSize: 20 }} />
                </InputAdornment>
              ),
              sx: { bgcolor: '#ffffff', borderRadius: '8px', '& fieldset': { borderColor: COLORS.border } }
            }}
          />
          
          <Select
            value={filters.status}
            onChange={(e) => handleFilterChange('status', e.target.value)}
            size="small"
            sx={{ width: isMobile ? '100%' : '200px', bgcolor: '#ffffff', borderRadius: '8px', '& fieldset': { borderColor: COLORS.border } }}
            displayEmpty
          >
            <MenuItem value="">All Status</MenuItem>
            <MenuItem value="approved">Approved</MenuItem>
            <MenuItem value="pending">Pending</MenuItem>
            <MenuItem value="suspended">Suspended</MenuItem>
          </Select>
        </Box>
      </Box>

      {/* Table */}
      <Box sx={{ bgcolor: '#fafafa', borderRadius: COLORS.cardRadius, border: `1px solid ${COLORS.border}`, borderTopLeftRadius: 0, borderTopRightRadius: 0, borderTop: 'none', overflow: 'hidden', mb: 8 }}>
        {filterLoading && <LinearProgress sx={{ height: 2, bgcolor: 'transparent', '& .MuiLinearProgress-bar': { bgcolor: COLORS.black } }} />}
        <TableContainer sx={{ px: 2, pb: 2 }}>
          <Table sx={{ minWidth: 800 }}>
            <TableHead>
              <TableRow sx={{ '& th': { borderBottom: `1px solid ${COLORS.border}`, color: COLORS.textSecondary, fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', py: 2 } }}>
                <TableCell>Institution</TableCell>
                <TableCell>Domain & Contact</TableCell>
                <TableCell>Admin</TableCell>
                <TableCell>Status</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {institutions.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} align="center" sx={{ py: 6, color: COLORS.textSecondary }}>No institutions found.</TableCell>
                </TableRow>
              ) : institutions.map(i => (
                <TableRow key={i._id} sx={{ '& td': { borderBottom: `1px solid ${COLORS.border}`, py: 1.5 }, '&:last-child td': { borderBottom: 'none' } }}>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <Avatar sx={{ bgcolor: '#f1f5f9', color: COLORS.black, fontWeight: 700 }} variant="rounded">
                        <Business />
                      </Avatar>
                      <Box>
                        <Typography sx={{ fontWeight: 700, fontSize: '14px', color: COLORS.black }}>{i.name}</Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt:0.2 }}>
                          <LocationOn sx={{ fontSize: 14, color: COLORS.textSecondary }} />
                          <Typography sx={{ fontSize: '12px', color: COLORS.textSecondary }}>{i.address}</Typography>
                        </Box>
                      </Box>
                    </Box>
                  </TableCell>
                  
                  <TableCell>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.2 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <Language sx={{ fontSize: 13, color: COLORS.teal }} />
                        <Typography sx={{ fontSize: '13px', fontWeight: 600 }}>{i.domain}</Typography>
                      </Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <Email sx={{ fontSize: 13, color: COLORS.textSecondary }} />
                        <Typography sx={{ fontSize: '12px', color: COLORS.textSecondary }}>{i.email}</Typography>
                      </Box>
                    </Box>
                  </TableCell>

                  <TableCell>
                    <Box>
                      <Typography sx={{ fontWeight: 600, fontSize: '13px' }}>{i.administratorName}</Typography>
                      <Typography sx={{ fontSize: '11px', color: COLORS.textSecondary }}>{i.administratorPosition}</Typography>
                    </Box>
                  </TableCell>
                  
                  <TableCell>
                    <Box sx={{
                      display: 'inline-flex', px: 1.5, py: 0.5, borderRadius: COLORS.pillRadius,
                      ...getStatusStyle(i.status), fontSize: '10px', fontWeight: 800, textTransform: 'uppercase'
                    }}>
                      {i.status}
                    </Box>
                  </TableCell>
                  
                  <TableCell align="right">
                    <Tooltip title="View Details">
                      <IconButton onClick={() => { setSelectedInstitution(i); setShowDetails(true); }}>
                        <Visibility sx={{ fontSize: 18 }} />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>

        {totalPages > 1 && (
          <Box sx={{ p: 2, borderTop: `1px solid ${COLORS.border}`, display: 'flex', justifyContent: 'center' }}>
            <Pagination count={totalPages} page={page} onChange={(_, v) => setPage(v)} shape="rounded" />
          </Box>
        )}
      </Box>

      {/* Details Dialog */}
      <Dialog open={showDetails} onClose={() => setShowDetails(false)} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: '16px' } }}>
        <DialogTitle sx={{ fontWeight: 800 }}>Institution Profile</DialogTitle>
        <DialogContent dividers>
          {selectedInstitution && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, pt: 1 }}>
              <Box>
                <Typography variant="overline" color="text.secondary">Basic Information</Typography>
                <Typography variant="h6" fontWeight={700}>{selectedInstitution.name}</Typography>
                <Typography variant="body2">{selectedInstitution.address}</Typography>
              </Box>
              <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
                <Box>
                  <Typography variant="overline" color="text.secondary">Contact Number</Typography>
                  <Typography variant="body2" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Phone sx={{ fontSize: 16 }} /> {selectedInstitution.contactNumber}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="overline" color="text.secondary">Official Email</Typography>
                  <Typography variant="body2" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Email sx={{ fontSize: 16 }} /> {selectedInstitution.email}
                  </Typography>
                </Box>
              </Box>
              <Box>
                <Typography variant="overline" color="text.secondary">System Administrator</Typography>
                <Box sx={{ p: 2, bgcolor: '#f8fafc', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Avatar sx={{ bgcolor: COLORS.black }}><AdminPanelSettings/></Avatar>
                  <Box>
                    <Typography fontWeight={700}>{selectedInstitution.administratorName}</Typography>
                    <Typography variant="caption">{selectedInstitution.administratorPosition}</Typography>
                  </Box>
                </Box>
              </Box>
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2.5 }}>
          <Button onClick={() => setShowDetails(false)} sx={{ textTransform: 'none', fontWeight: 700, color: COLORS.black }}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
