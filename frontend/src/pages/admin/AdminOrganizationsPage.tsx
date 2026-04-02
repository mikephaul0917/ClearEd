import { useEffect, useMemo, useState, useCallback } from "react";
import {
  Box, Typography, Card, CardContent, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Paper, FormControl, InputLabel,
  Select, Menu, MenuItem, Chip, Button, Dialog, DialogTitle, DialogContent,
  DialogActions, Alert, Grid, IconButton, Tooltip, LinearProgress,
  Pagination, Avatar, SelectChangeEvent, useTheme, useMediaQuery, Skeleton,
  TextField, InputAdornment, FormLabel, Switch
} from "@mui/material";
import {
  Visibility, Business, FilterList, Search, AddCircle,
  Delete, RestoreFromTrash, DeleteForever, History, Security, CorporateFare,
  MoreVert, CheckCircleRounded
} from '@mui/icons-material';
import { adminService } from "../../services";

// ─── Modern Bento Design System ──────────────────────────────────────────────
const COLORS = {
  pageBg: '#F8F9FE',
  surface: '#FFFFFF',
  black: '#1E293B',
  textPrimary: '#1E293B',
  textSecondary: '#64748B',
  teal: '#0E7490',      // Deep professional tone
  lavender: '#818CF8',   // Modern Indigo/Blue
  orange: '#F59E0B',
  border: '#F1F5F9',
  cardRadius: '20px',
  pillRadius: '999px',
  accentBlue: '#0E7490',
  accentGreen: '#10B981',
  tealLight: 'rgba(45, 212, 191, 0.15)',
};

const fontStack = "'Inter', 'Plus Jakarta Sans', 'Montserrat', sans-serif";

interface OrganizationRow {
  _id: string;
  name: string;
  description?: string;
  joinCode: string;
  signatoryName?: string;
  isFinal?: boolean;
}

export default function AdminOrganizationsPage({
  refreshTrigger = 0,
  onLoadingChange
}: {
  refreshTrigger?: number;
  onLoadingChange?: (loading: boolean) => void;
}) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const isSmallMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const [rows, setRows] = useState<OrganizationRow[]>([]);
  const [deletedRows, setDeletedRows] = useState<OrganizationRow[]>([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<"active" | "deleted">("active");
  const [manageOrg, setManageOrg] = useState<OrganizationRow | null>(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [joinCode, setJoinCode] = useState(""); // Added joinCode state
  const [signatoryName, setSignatoryName] = useState("");
  const [isFinal, setIsFinal] = useState(false);
  const [menuAnchorEl, setMenuAnchorEl] = useState<null | HTMLElement>(null);
  const [activeMenuOrg, setActiveMenuOrg] = useState<any>(null);
  const [page, setPage] = useState(1);
  const rowsPerPage = 10;

  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
    confirmText?: string;
  }>({
    open: false,
    title: "",
    message: "",
    onConfirm: () => {},
  });

  const [successDialog, setSuccessDialog] = useState<{
    open: boolean;
    title: string;
    message: string;
  }>({
    open: false,
    title: "",
    message: "",
  });

  const fetchData = useCallback(async () => {
    setLoading(true);
    onLoadingChange?.(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      const [orgData, deletedData] = await Promise.all([
        adminService.getOrganizations(),
        adminService.getDeletedOrganizations()
      ]);
      setRows(orgData || []);
      setDeletedRows(deletedData || []);
    } catch (error) {
      console.error('Failed to fetch organizations:', error);
    } finally {
      setLoading(false);
      onLoadingChange?.(false);
    }
  }, [onLoadingChange]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    if (refreshTrigger > 0) {
      fetchData();
    }
  }, [refreshTrigger, fetchData]);

  useEffect(() => {
    if (manageOrg) {
      setName(manageOrg.name || "");
      setDescription(manageOrg.description || "");
      setJoinCode(manageOrg.joinCode || ""); // Populate joinCode
      setSignatoryName(manageOrg.signatoryName || "");
      setIsFinal(manageOrg.isFinal || false);
    } else {
      setName("");
      setDescription("");
      setJoinCode(""); // Reset joinCode
      setSignatoryName("");
      setIsFinal(false);
    }
  }, [manageOrg]);

  const stats = useMemo(() => ({
    total: rows.length,
    active: rows.length,
    inTrash: deletedRows.length
  }), [rows, deletedRows]);

  const filtered = useMemo(() => {
    const activeRows = view === "active" ? rows : deletedRows;
    const q = query.trim().toLowerCase();
    if (!q) return activeRows;
    return activeRows.filter(r => (
      r.name.toLowerCase().includes(q) ||
      (r.description || "").toLowerCase().includes(q) ||
      (r.joinCode || "").toLowerCase().includes(q) || // Added joinCode search
      (r.signatoryName || "").toLowerCase().includes(q)
    ));
  }, [rows, deletedRows, query, view]);

  const totalPages = Math.ceil(filtered.length / rowsPerPage);
  const paginatedRows = filtered.slice((page - 1) * rowsPerPage, page * rowsPerPage);

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

      {/* ── Page Header ────────────────────────────────────────────── */}
      <Box sx={{ mb: 6 }}>
        <Typography sx={{ fontWeight: 700, fontSize: '2.25rem', color: COLORS.textPrimary, letterSpacing: '-0.05em', lineHeight: 1 }}>
          Institutional Organizations
        </Typography>
        <Typography sx={{ fontSize: 15, color: COLORS.textSecondary, mt: 0.75, fontWeight: 500 }}>
          Manage institutional departments, signatories, and official access codes.
        </Typography>
      </Box>

      {/* ── Stats Bento Row ────────────────────────────────────────── */}
      <Box sx={{
        display: 'grid',
        gridTemplateColumns: { xs: 'repeat(1, 1fr)', sm: 'repeat(2, 1fr)', md: 'repeat(4, 1fr)' },
        gap: 3, mb: 4,
      }}>
        {loading ? (
          [1, 2, 3, 4].map((i) => <Skeleton key={i} variant="rounded" height={110} sx={{ borderRadius: COLORS.cardRadius }} />)
        ) : ([
          { label: "Total Organizations", value: stats.total, sub: "Institutional Count", icon: <Business sx={{ fontSize: 18 }} /> },
          { label: "Active Directory", value: stats.active, sub: "Currently Active", icon: <Visibility sx={{ fontSize: 18 }} /> },
          { label: "Final Signatories", value: rows.filter(r => r.isFinal).length, sub: "Completion Cycle", icon: <History sx={{ fontSize: 18 }} /> },
          { label: "Archived Assets", value: stats.inTrash, sub: "In Trash Bin", icon: <RestoreFromTrash sx={{ fontSize: 18 }} /> },
        ].map((stat) => (
          <Box key={stat.label} sx={{
            borderRadius: COLORS.cardRadius, p: 3,
            backgroundColor: COLORS.surface,
            border: `1px solid ${COLORS.border}`,
            minHeight: 125,
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
            <Box sx={{ mb: 2 }}>
              <Box>
                <Typography sx={{ fontSize: 13, fontWeight: 700, color: COLORS.textSecondary, mb: 0.5 }}>
                  {stat.label}
                </Typography>
                <Typography sx={{ fontWeight: 900, fontSize: 28, color: COLORS.textPrimary, letterSpacing: '-1px', lineHeight: 1 }}>
                  {stat.value}
                </Typography>
              </Box>
            </Box>
          </Box>
        )))}
      </Box>

      {/* ── Notification/Alert Bar ──────────────────────────────────── */}


      {/* ── Recent Organizations (Approval Style) ────────────────── */}
      {!loading && rows.length > 0 && (
        <Box sx={{
          display: 'grid',
          gridTemplateColumns: { xs: 'repeat(1, 1fr)', md: 'repeat(2, 1fr)' },
          gap: 3, mb: 4,
        }}>
          {rows.slice(0, 2).map((org, idx) => (
            <Box key={org._id} sx={{
              p: 3, borderRadius: COLORS.cardRadius, bgcolor: COLORS.surface,
              border: `1px solid ${COLORS.border}`,
              boxShadow: '0 4px 6px -1px rgba(0,0,0,0.02)',
              position: 'relative'
            }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Avatar sx={{
                    width: 44, height: 44, bgcolor: COLORS.tealLight,
                    color: COLORS.teal,
                    fontWeight: 800, fontSize: 16, borderRadius: '12px'
                  }}>
                    {org.name?.charAt(0)}
                  </Avatar>
                  <Box>
                    <Typography sx={{ fontWeight: 800, fontSize: 15, color: COLORS.textPrimary }}>{org.name}</Typography>
                    <Typography sx={{ fontSize: 12, color: COLORS.textSecondary, fontWeight: 500 }}>{org.signatoryName || "No Signatory"}</Typography>
                  </Box>
                </Box>
                <Box sx={{ display: 'flex', gap: 1 }}>

                  <Chip label="Active" size="small" sx={{ fontWeight: 700, fontSize: 10, bgcolor: COLORS.tealLight, color: COLORS.teal }} />
                </Box>
              </Box>

              <Typography sx={{ fontSize: 13, fontWeight: 600, color: '#334155', mb: 2.5, fontStyle: 'italic' }}>
                "{org.description || "Institutional organization for official documentation and signatory processes."}"
              </Typography>

              <Box sx={{ pt: 2, borderTop: '1px solid #F1F5F9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography sx={{ fontSize: 12, color: COLORS.textSecondary, fontWeight: 500 }}>
                  Code: <Box component="span" sx={{ fontWeight: 800, color: COLORS.teal }}>{org.joinCode}</Box>
                </Typography>
                <Box sx={{ display: 'flex', gap: 1.5 }}>
                  <Button
                    onClick={() => setManageOrg(org)}
                    size="small"
                    variant="text"
                    sx={{ textTransform: 'none', fontWeight: 800, color: COLORS.textSecondary, fontSize: 13 }}
                  >
                    Details
                  </Button>
                  <Button
                    onClick={() => setManageOrg(org)}
                    size="small"
                    variant="contained"
                    disableElevation
                    sx={{
                      textTransform: 'none', fontWeight: 800, borderRadius: '10px',
                      bgcolor: COLORS.tealLight, color: COLORS.teal, px: 2,
                      '&:hover': { bgcolor: 'rgba(45, 212, 191, 0.25)' }
                    }}
                  >
                    Modify
                  </Button>
                </Box>
              </Box>
            </Box>
          ))}
        </Box>
      )}

      {/* ── Organization Directory (Team Activity Style) ──────────── */}
      <Box sx={{
        borderRadius: COLORS.cardRadius,
        backgroundColor: COLORS.surface,
        border: `1px solid ${COLORS.border}`,
        boxShadow: '0 4px 6px -1px rgba(0,0,0,0.02)',
        overflow: 'hidden'
      }}>
        {/* Table Header / Toolbar */}
        <Box sx={{ p: 4, pb: 2 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Box>
              <Typography sx={{ fontWeight: 900, fontSize: 20, color: COLORS.textPrimary, letterSpacing: '-0.5px' }}>
                Organization Directory
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', gap: 1.5 }}>

              <Button
                variant="contained"
                disableElevation
                startIcon={<AddCircle />}
                onClick={() => setManageOrg({ _id: "", name: "", signatoryName: "", description: "", joinCode: "", isFinal: false })}
                sx={{
                  borderRadius: COLORS.pillRadius, bgcolor: COLORS.black,
                  textTransform: 'none', px: 4, py: 1.2, fontWeight: 800,
                  fontSize: 13, boxShadow: '0 10px 25px -5px rgba(0,0,0,0.3)',
                  '&:hover': { 
                    bgcolor: '#000', 
                    transform: 'translateY(-2px)',
                    boxShadow: '0 15px 30px -5px rgba(0,0,0,0.4)'
                  },
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
                }}
              >
                Create New
              </Button>
            </Box>
          </Box>

          <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', mb: 2, flexWrap: 'wrap' }}>
            <TextField
              placeholder="Search by name, code or signatory..."
              value={query}
              onChange={(e) => { setQuery(e.target.value); setPage(1); }}
              size="small"
              InputProps={{
                startAdornment: <InputAdornment position="start"><Search sx={{ fontSize: 20, color: COLORS.textSecondary }} /></InputAdornment>,
                sx: { borderRadius: '12px', bgcolor: '#F8FAFC', border: 'none', height: 44 }
              }}
              sx={{ flex: 1, minWidth: 260, '& .MuiOutlinedInput-notchedOutline': { border: 'none' } }}
            />

            <Box sx={{ display: 'flex', bgcolor: '#F8FAFC', p: 0.5, borderRadius: '12px' }}>
              <Button
                onClick={() => { setView('active'); setPage(1); }}
                sx={{
                  textTransform: 'none', px: 2, py: 0.5, borderRadius: '10px', fontSize: 13, fontWeight: 700,
                  bgcolor: view === 'active' ? '#FFF' : 'transparent',
                  color: view === 'active' ? COLORS.textPrimary : COLORS.textSecondary,
                  boxShadow: view === 'active' ? '0 4px 6px -1px rgba(0,0,0,0.05)' : 'none',
                  '&:hover': { bgcolor: view === 'active' ? '#FFF' : '#F1F5F9' }
                }}
              >
                All Organizations
              </Button>
              <Button
                onClick={() => { setView('deleted'); setPage(1); }}
                sx={{
                  textTransform: 'none', px: 2, py: 0.5, borderRadius: '10px', fontSize: 13, fontWeight: 700,
                  bgcolor: view === 'deleted' ? '#FFF' : 'transparent',
                  color: view === 'deleted' ? COLORS.textPrimary : COLORS.textSecondary,
                  boxShadow: view === 'deleted' ? '0 4px 6px -1px rgba(0,0,0,0.05)' : 'none',
                  '&:hover': { bgcolor: view === 'deleted' ? '#FFF' : '#F1F5F9' }
                }}
              >
                Archived
              </Button>
            </Box>
          </Box>
        </Box>



        <TableContainer>
          <Table>
            <TableHead>
              <TableRow sx={{ borderBottom: `1px solid ${COLORS.border}` }}>
                {['Organization', 'Description', 'Join Code', 'Signatory', ''].map((h, i) => (
                  <TableCell
                    key={h}
                    align={h === 'Actions' ? 'right' : 'left'}
                    sx={{
                      fontFamily: fontStack, fontSize: 13, fontWeight: 700,
                      color: COLORS.textSecondary, py: 2, px: 3, borderBottom: 'none'
                    }}
                  >
                    {loading ? <Skeleton variant="text" width={h === '' ? "40%" : "60%"} height={20} sx={{ ml: h === '' ? 'auto' : 0 }} /> : h}
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                [1, 2, 3, 4, 5].map((i) => (
                  <TableRow key={i}>
                    <TableCell><Skeleton variant="text" /></TableCell>
                    <TableCell><Skeleton variant="text" /></TableCell>
                    <TableCell><Skeleton variant="text" /></TableCell>
                    <TableCell><Skeleton variant="text" /></TableCell>
                    <TableCell align="right"><Skeleton variant="circular" width={32} height={32} sx={{ ml: 'auto' }} /></TableCell>
                  </TableRow>
                ))
              ) : paginatedRows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} align="center" sx={{ py: 8 }}>
                    <Typography sx={{ color: COLORS.textSecondary, fontFamily: fontStack, fontSize: 14 }}>
                      No organizations found
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                paginatedRows.map((org) => (
                  <TableRow
                    key={org._id}
                    hover
                    sx={{
                      '&:last-child td': { border: 0 },
                      bgcolor: org.isFinal ? '#F0FDFA' : 'transparent',
                      '&:hover': { bgcolor: org.isFinal ? '#F0FDFA !important' : '#F8FAFC !important' }
                    }}
                  >
                    <TableCell sx={{ px: 3, py: 2.5, borderBottom: `1px solid ${COLORS.border}` }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Avatar sx={{
                          width: 32, height: 32, bgcolor: org.isFinal ? '#0D9488' : COLORS.teal,
                          color: '#FFF', fontWeight: 800, fontSize: 13, borderRadius: '8px'
                        }}>
                          {org.name?.charAt(0)}
                        </Avatar>
                        <Box>
                          <Typography sx={{ fontWeight: 800, fontSize: 14, color: COLORS.textPrimary }}>{org.name}</Typography>
                          <Typography sx={{ fontSize: 11, color: COLORS.textSecondary, fontWeight: 500 }}>ID: {org._id.slice(-6).toUpperCase()}</Typography>
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell sx={{ px: 3, borderBottom: `1px solid ${COLORS.border}` }}>
                      <Typography sx={{ fontSize: 13, fontWeight: 600, color: '#475569' }}>
                        {org.description || "Institutional Office"}
                      </Typography>
                    </TableCell>
                    <TableCell sx={{ px: 3, borderBottom: `1px solid ${COLORS.border}` }}>
                      <Box sx={{ display: 'inline-flex', px: 1.5, py: 0.5, borderRadius: '6px', bgcolor: '#F1F5F9' }}>
                        <Typography sx={{ fontSize: 12, fontWeight: 800, color: COLORS.accentBlue, fontStyle: 'italic' }}>
                          {org.joinCode || "—"}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell sx={{ px: 3, borderBottom: `1px solid ${COLORS.border}` }}>
                      {org.isFinal ? (
                        <Chip
                          label="Final Reviewer"
                          size="small"
                          sx={{
                            height: 24, fontSize: 11, fontWeight: 800,
                            bgcolor: '#CCFBF1', color: '#0F766E', borderRadius: '6px'
                          }}
                        />
                      ) : (
                        <Typography sx={{ fontSize: 13, fontWeight: 600, color: COLORS.textSecondary }}>
                          {org.signatoryName || "No Signatory"}
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell align="right" sx={{ px: 3, borderBottom: `1px solid ${COLORS.border}` }}>
                      <IconButton
                        size="small"
                        onClick={(e) => {
                          setMenuAnchorEl(e.currentTarget);
                          setActiveMenuOrg(org);
                        }}
                        sx={{ color: COLORS.textSecondary, borderRadius: '8px', '&:hover': { bgcolor: '#F1F5F9' } }}
                      >
                        <MoreVert sx={{ fontSize: 20 }} />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
        <Box sx={{ p: 3, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, borderTop: `1px solid ${COLORS.border}` }}>
          <Typography sx={{ fontSize: 13, color: COLORS.textSecondary, fontWeight: 600 }}>
            Showing <Box component="span" sx={{ color: COLORS.textPrimary }}>{paginatedRows.length}</Box> of <Box component="span" sx={{ color: COLORS.textPrimary }}>{filtered.length}</Box> entries
          </Typography>
          <Pagination
            count={totalPages}
            page={page}
            onChange={(_, v) => setPage(v)}
            sx={{
              '& .MuiPaginationItem-root': {
                fontFamily: fontStack, borderRadius: '8px', fontWeight: 800, fontSize: 13,
                color: COLORS.textSecondary,
                '&.Mui-selected': { bgcolor: COLORS.black, color: '#FFF', '&:hover': { bgcolor: '#000' } }
              }
            }}
          />
        </Box>
      </Box>

      {/* ── Manage Organization Dialog ────────────────────────────────── */}
      <Dialog
        open={!!manageOrg}
        onClose={() => setManageOrg(null)}
        fullWidth
        maxWidth="sm"
        PaperProps={{
          sx: {
            borderRadius: '24px', p: 1, boxShadow: '0 25px 50px -12px rgba(0,0,0,0.15)',
            border: `1px solid ${COLORS.border}`
          }
        }}
      >
        <DialogTitle sx={{ p: 4, pb: 1 }}>
          <Typography sx={{ fontWeight: 900, fontSize: 22, color: COLORS.textPrimary, letterSpacing: '-0.5px' }}>
            {manageOrg?._id ? "Organization Settings" : "New Organization"}
          </Typography>
          <Typography sx={{ fontSize: 13, color: COLORS.textSecondary, fontWeight: 500, mt: 0.5 }}>
            {manageOrg?._id ? "Update department details and signatory configurations." : "Establish a new institutional office for the clearance workflow."}
          </Typography>
        </DialogTitle>
        <DialogContent sx={{ p: 4 }}>
          <Box display="flex" flexDirection="column" gap={3.5}>
            <Box>
              <FormLabel sx={{ fontWeight: 800, fontSize: 13, color: COLORS.textPrimary, mb: 1.5, display: 'block' }}>
                Full Name
              </FormLabel>
              <TextField
                fullWidth
                placeholder="e.g. Registrar's Office"
                value={name}
                onChange={(e) => setName(e.target.value)}
                InputProps={{ sx: { borderRadius: '12px', bgcolor: '#F8FAFC', border: 'none', px: 0.5 } }}
                sx={{ '& .MuiOutlinedInput-notchedOutline': { border: '1px solid #E2E8F0' } }}
              />
            </Box>
            <Box>
              <FormLabel sx={{ fontWeight: 800, fontSize: 13, color: COLORS.textPrimary, mb: 1.5, display: 'block' }}>
                Internal Description
              </FormLabel>
              <TextField
                fullWidth
                multiline
                rows={2}
                placeholder="Briefly describe the purpose of this organization..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                InputProps={{ sx: { borderRadius: '12px', bgcolor: '#F8FAFC' } }}
                sx={{ '& .MuiOutlinedInput-notchedOutline': { border: '1px solid #E2E8F0' } }}
              />
            </Box>
            <Grid container spacing={3}>
              <Grid item xs={12} sm={6}>
                <FormLabel sx={{ fontWeight: 800, fontSize: 13, color: COLORS.textPrimary, mb: 1.5, display: 'block' }}>
                  System Signatory
                </FormLabel>
                <TextField
                  fullWidth
                  placeholder="e.g. Juan Dela Cruz"
                  value={signatoryName}
                  onChange={(e) => setSignatoryName(e.target.value)}
                  InputProps={{ sx: { borderRadius: '12px', bgcolor: '#F8FAFC' } }}
                  sx={{ '& .MuiOutlinedInput-notchedOutline': { border: '1px solid #E2E8F0' } }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormLabel sx={{ fontWeight: 800, fontSize: 13, color: COLORS.textPrimary, mb: 1.5, display: 'block' }}>
                  Access Code
                </FormLabel>
                <TextField
                  fullWidth
                  value={joinCode || "AUTO-GEN"}
                  disabled
                  InputProps={{
                    sx: {
                      borderRadius: '12px', bgcolor: '#F1F5F9', fontWeight: 900,
                      color: COLORS.accentBlue, textAlign: 'center', fontSize: 14
                    },
                  }}
                />
              </Grid>
            </Grid>
            <Box sx={{
              display: 'flex', alignItems: 'center', gap: 2, p: 2.5, borderRadius: '16px',
              bgcolor: isFinal ? '#F0FDFA' : '#F8FAFC', border: `1px solid ${isFinal ? '#CCFBF1' : '#E2E8F0'}`,
              transition: '0.3s'
            }}>
              <Box sx={{ flex: 1 }}>
                <Typography sx={{ fontWeight: 800, fontSize: 14, color: COLORS.textPrimary }}>Final Milestone</Typography>
                <Typography sx={{ fontSize: 11, color: COLORS.textSecondary, fontWeight: 500 }}>
                  Mark this as the final required signatory in the sequence.
                </Typography>
              </Box>
              <Switch
                checked={isFinal}
                onChange={() => setIsFinal(!isFinal)}
                sx={{
                  '& .MuiSwitch-switchBase.Mui-checked': { color: '#0D9488' },
                  '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': { backgroundColor: '#0D9488' },
                }}
              />
            </Box>
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 4, pt: 1, gap: 1.5 }}>
          <Button
            onClick={() => setManageOrg(null)}
            sx={{ color: COLORS.textSecondary, textTransform: 'none', fontWeight: 800, fontSize: 14 }}
          >
            Go Back
          </Button>
          <Button
            variant="contained"
            disableElevation
            onClick={async () => {
              if (!name.trim()) return;
              try {
                if (manageOrg?._id) {
                  await adminService.updateOrganization(manageOrg._id, { name, description, signatoryName, isFinal });
                } else {
                  const terms = await adminService.getTerms();
                  const activeTerm = terms.data?.find((t: any) => t.isActive) || terms.data?.[0];
                  await adminService.createOrganization({ name, description, signatoryName, isFinal, termId: activeTerm?._id });
                }
                fetchData();
                setManageOrg(null);
                setSuccessDialog({
                  open: true,
                  title: manageOrg?._id ? "Update Successful" : "Creation Successful",
                  message: manageOrg?._id 
                    ? `The organization "${name}" has been successfully updated.`
                    : `The organization "${name}" has been successfully established and added to the directory.`
                });
                setName(""); setDescription(""); setSignatoryName(""); setIsFinal(false);
              } catch (err: any) {
                console.error("Failed to save organization:", err);
                alert(err.response?.data?.message || err.message || "An error occurred");
              }
            }}
            sx={{
              borderRadius: COLORS.pillRadius, bgcolor: COLORS.black,
              textTransform: 'none', px: 4, py: 1.2, fontWeight: 800, fontSize: 14,
              boxShadow: '0 10px 25px -5px rgba(0,0,0,0.3)',
              '&:hover': { 
                bgcolor: '#000', 
                transform: 'translateY(-2px)',
                boxShadow: '0 15px 30px -5px rgba(0,0,0,0.4)'
              },
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
            }}
          >
            {manageOrg?._id ? "Update Changes" : "Confirm Creation"}
          </Button>
        </DialogActions>
      </Dialog>
      {/* --- ELLIPSIS MENU --- */}
      <Menu
        anchorEl={menuAnchorEl}
        open={Boolean(menuAnchorEl)}
        onClose={() => setMenuAnchorEl(null)}
        PaperProps={{
          elevation: 2,
          sx: {
            borderRadius: '16px',
            mt: 1.5,
            minWidth: 160,
            '& .MuiMenuItem-root': {
              fontSize: 14,
              fontWeight: 600,
              py: 1.2,
              px: 2,
              borderRadius: '8px',
              mx: 1,
              '&:hover': { bgcolor: '#F1F5F9', color: COLORS.teal }
            }
          }
        }}
      >
        <MenuItem onClick={() => {
          setManageOrg(activeMenuOrg);
          setMenuAnchorEl(null);
        }}>
          <Visibility sx={{ fontSize: 18, mr: 1.5, color: '#64748B' }} />
          View Details
        </MenuItem>

        {view === 'deleted' && (
          <MenuItem
            onClick={() => {
              if (activeMenuOrg) {
                setConfirmDialog({
                  open: true,
                  title: "Are You Sure Want To Restore?",
                  message: `You are about to restore "${activeMenuOrg.name}" to the active organizational directory.`,
                  confirmText: "Yes, Restore",
                  onConfirm: () => adminService.restoreOrganization(activeMenuOrg._id).then(() => {
                    fetchData();
                    setSuccessDialog({
                      open: true,
                      title: "Restoration Successful",
                      message: `"${activeMenuOrg.name}" has been successfully restored to the active directory.`
                    });
                  })
                });
              }
              setMenuAnchorEl(null);
            }}
            sx={{ color: COLORS.teal }}
          >
            <RestoreFromTrash sx={{ fontSize: 18, mr: 1.5 }} />
            Restore Organization
          </MenuItem>
        )}

        <MenuItem
          onClick={() => {
            if (!activeMenuOrg) return;
            
            const isTrash = view === 'deleted';
            const title = isTrash ? "Are You Sure Want To Delete Permanently?" : "Are You Sure Want To Archive?";
            const message = isTrash 
              ? `You are about to permanently delete "${activeMenuOrg.name}". This action is irreversible and cannot be undone.`
              : `You are about to move "${activeMenuOrg.name}" to the archive bin. It can be recovered later if needed.`;
            const confirmText = isTrash ? "Yes, Delete Forever" : "Yes, Archive";
            
            setConfirmDialog({
              open: true,
              title,
              message,
              confirmText,
              onConfirm: () => {
                const action = isTrash 
                  ? adminService.permanentDeleteOrganization(activeMenuOrg._id)
                  : adminService.deleteOrganization(activeMenuOrg._id);
                action.then(() => {
                  fetchData();
                  setSuccessDialog({
                    open: true,
                    title: isTrash ? "Permanent Deletion Successful" : "Selection Archived Successfully",
                    message: isTrash 
                      ? `"${activeMenuOrg.name}" has been permanently removed from the system.`
                      : `"${activeMenuOrg.name}" has been successfully moved to the archive bin.`
                  });
                });
              }
            });
            setMenuAnchorEl(null);
          }}
          sx={{ color: '#EF4444' }}
        >
          {view === 'deleted' ? (
            <>
              <DeleteForever sx={{ fontSize: 18, mr: 1.5 }} />
              Delete Permanently
            </>
          ) : (
            <>
              <Delete sx={{ fontSize: 18, mr: 1.5 }} />
              Delete
            </>
          )}
        </MenuItem>
      </Menu>

      {/* --- CUSTOM CONFIRMATION DIALOG --- */}
      <Dialog
        open={confirmDialog.open}
        onClose={() => setConfirmDialog(prev => ({ ...prev, open: false }))}
        PaperProps={{
          sx: {
            borderRadius: '40px',
            p: 4,
            maxWidth: '440px',
            boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)',
            textAlign: 'center'
          }
        }}
      >
        <DialogContent sx={{ p: 0 }}>
          <Typography sx={{ 
            fontWeight: 900, 
            fontSize: '28px', 
            color: COLORS.textPrimary, 
            letterSpacing: '-0.03em',
            lineHeight: 1.2,
            mb: 2,
            px: 2
          }}>
            {confirmDialog.title}
          </Typography>
          <Typography sx={{ 
            fontSize: '16px', 
            color: COLORS.textSecondary, 
            fontWeight: 500,
            lineHeight: 1.5,
            mb: 5,
            px: 2
          }}>
            {confirmDialog.message}
          </Typography>

          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1.5 }}>
            <Button
              variant="contained"
              disableElevation
              onClick={() => {
                confirmDialog.onConfirm();
                setConfirmDialog(prev => ({ ...prev, open: false }));
              }}
              sx={{
                borderRadius: COLORS.pillRadius,
                bgcolor: COLORS.black,
                color: '#FFF',
                textTransform: 'none',
                width: '100%',
                py: 2.2,
                fontSize: '18px',
                fontWeight: 900,
                letterSpacing: '-0.01em',
                boxShadow: '0 10px 25px -5px rgba(0,0,0,0.3)',
                '&:hover': {
                  bgcolor: '#000',
                  transform: 'translateY(-2px)',
                  boxShadow: '0 15px 35px -5px rgba(0,0,0,0.4)',
                },
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
              }}
            >
              {confirmDialog.confirmText || "Yes, Confirm"}
            </Button>
            <Button
              onClick={() => setConfirmDialog(prev => ({ ...prev, open: false }))}
              sx={{
                textTransform: 'none',
                color: COLORS.textSecondary,
                fontSize: '16px',
                fontWeight: 800,
                py: 1,
                '&:hover': { color: COLORS.textPrimary, bgcolor: 'transparent' }
              }}
            >
              Not Now
            </Button>
          </Box>
        </DialogContent>
      </Dialog>

      {/* --- CUSTOM SUCCESS ALERT DIALOG --- */}
      <Dialog
        open={successDialog.open}
        onClose={() => setSuccessDialog(prev => ({ ...prev, open: false }))}
        PaperProps={{
          sx: {
            borderRadius: '40px',
            p: 4,
            maxWidth: '440px',
            boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)',
            textAlign: 'center'
          }
        }}
      >
        <DialogContent sx={{ p: 0, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <Box sx={{ 
            width: 100, 
            height: 100, 
            borderRadius: '50%', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center', 
            mb: 3,
            background: 'radial-gradient(circle, rgba(14, 116, 144, 0.1) 0%, rgba(14, 116, 144, 0) 70%)',
            border: '1px solid rgba(14, 116, 144, 0.1)'
          }}>
            <Box sx={{ 
              width: 64, 
              height: 64, 
              borderRadius: '50%', 
              bgcolor: 'rgba(14, 116, 144, 0.1)', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center'
            }}>
              <CheckCircleRounded sx={{ fontSize: 36, color: COLORS.teal }} />
            </Box>
          </Box>

          <Typography sx={{ 
            fontWeight: 900, 
            fontSize: '28px', 
            color: COLORS.textPrimary, 
            letterSpacing: '-0.03em',
            lineHeight: 1.2,
            mb: 2,
            px: 2
          }}>
            {successDialog.title}
          </Typography>
          <Typography sx={{ 
            fontSize: '16px', 
            color: COLORS.textSecondary, 
            fontWeight: 500,
            lineHeight: 1.5,
            mb: 5,
            px: 2
          }}>
            {successDialog.message}
          </Typography>

          <Button
            disableElevation
            onClick={() => setSuccessDialog(prev => ({ ...prev, open: false }))}
            sx={{
              borderRadius: COLORS.pillRadius,
              bgcolor: '#F1F5F9',
              color: COLORS.textPrimary,
              textTransform: 'none',
              width: '100%',
              py: 2.2,
              fontSize: '18px',
              fontWeight: 900,
              letterSpacing: '-0.01em',
              '&:hover': {
                bgcolor: '#E2E8F0',
                transform: 'translateY(-2px)',
              },
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
            }}
          >
            Close
          </Button>
        </DialogContent>
      </Dialog>
    </Box>
  );
}
