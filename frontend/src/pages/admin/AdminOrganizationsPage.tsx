import { useEffect, useMemo, useState, useCallback } from "react";
import {
  Box, Typography, Card, CardContent, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Paper, FormControl, InputLabel,
  Select, MenuItem, Chip, Button, Dialog, DialogTitle, DialogContent,
  DialogActions, Alert, Grid, IconButton, Tooltip, LinearProgress,
  Pagination, Avatar, SelectChangeEvent, useTheme, useMediaQuery, Skeleton,
  TextField, InputAdornment, FormLabel
} from "@mui/material";
import {
  Visibility, Business, FilterList, Refresh, Search, AddCircle,
  Delete, RestoreFromTrash, DeleteForever, History
} from '@mui/icons-material';
import { adminService } from "../../services";

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
  const [page, setPage] = useState(1);
  const rowsPerPage = 10;

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

      {/* ── Stats Bento Row ────────────────────────────────────────── */}
      <Box sx={{
        display: 'grid',
        gridTemplateColumns: { xs: 'repeat(1, 1fr)', md: 'repeat(3, 1fr)' },
        gap: 2, mb: 3,
      }}>
        {loading ? (
          [1, 2, 3].map((i) => <Skeleton key={i} variant="rounded" height={100} sx={{ borderRadius: COLORS.cardRadius }} />)
        ) : ([
          { label: 'Total Organizations', value: stats.total, accent: COLORS.teal },
          { label: 'Active', value: stats.active, accent: COLORS.lavender },
          { label: 'In Trash', value: stats.inTrash, accent: COLORS.orange },
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
          <Box sx={{ flex: 1 }}>
            {loading ? (
              <>
                <Skeleton variant="text" width={160} height={24} sx={{ mb: 0.5 }} />
                <Skeleton variant="text" width={isSmallMobile ? 240 : 350} height={16} />
              </>
            ) : (
              <>
                <Typography sx={{ fontFamily: fontStack, fontSize: 15, fontWeight: 700, color: COLORS.textPrimary, mb: 0.25 }}>
                  Manage & Search
                </Typography>
                <Typography sx={{ fontFamily: fontStack, fontSize: 12, color: COLORS.textSecondary }}>
                  Search organizations or switch between active and deleted views
                </Typography>
              </>
            )}
          </Box>
          {loading ? (
            <Skeleton variant="rounded" width={140} height={32} sx={{ borderRadius: 9999 }} />
          ) : (
            <Box sx={{ display: "inline-flex", borderRadius: 9999, border: "1px solid #E5E7EB", backgroundColor: "#F9FAFB", p: 0.25 }}>
              <Button
                variant={view === "active" ? "contained" : "text"}
                onClick={() => { setView("active"); setPage(1); }}
                sx={{
                  textTransform: "none", fontSize: 12, px: 2, py: 0.5, borderRadius: 9999, minWidth: 0,
                  backgroundColor: view === "active" ? "#0F172A" : "transparent",
                  color: view === "active" ? "#FFFFFF" : "#0F172A",
                  fontWeight: 600,
                  '&:hover': { backgroundColor: view === "active" ? "#111827" : "#E5E7EB" },
                }}
              >
                Active
              </Button>
              <Button
                variant={view === "deleted" ? "contained" : "text"}
                onClick={() => { setView("deleted"); setPage(1); }}
                sx={{
                  textTransform: "none", fontSize: 12, px: 2, py: 0.5, borderRadius: 9999, minWidth: 0,
                  backgroundColor: view === "deleted" ? "#0F172A" : "transparent",
                  color: view === "deleted" ? "#FFFFFF" : "#0F172A",
                  fontWeight: 600,
                  '&:hover': { backgroundColor: view === "deleted" ? "#111827" : "#E5E7EB" },
                }}
              >
                Trash
              </Button>
            </Box>
          )}
        </Box>

        {loading ? (
          <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap', flexDirection: isSmallMobile ? 'column' : 'row' }}>
            <Skeleton variant="rounded" height={40} sx={{ flex: 1, minWidth: 200, borderRadius: '12px', width: isSmallMobile ? '100%' : 'auto' }} />
            <Skeleton variant="rounded" height={40} width={isSmallMobile ? '100%' : 160} sx={{ borderRadius: COLORS.pillRadius }} />
          </Box>
        ) : (
          <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap', flexDirection: isSmallMobile ? 'column' : 'row' }}>
            <TextField
              fullWidth={isSmallMobile}
              placeholder="Search organizations..."
              value={query}
              size="small"
              onChange={(e) => { setQuery(e.target.value); setPage(1); }}
              InputProps={{
                startAdornment: <InputAdornment position="start"><Search sx={{ fontSize: 20, color: COLORS.textSecondary }} /></InputAdornment>,
                sx: { borderRadius: '12px', bgcolor: '#F8FAFC', fontSize: 14 }
              }}
              sx={{ flex: 1, minWidth: 200 }}
            />
            <Button
              variant="contained"
              disableElevation
              fullWidth={isSmallMobile}
              startIcon={<AddCircle />}
              onClick={() => setManageOrg({ _id: "", name: "", signatoryName: "", description: "", joinCode: "", isFinal: false })}
              sx={{
                borderRadius: COLORS.pillRadius, bgcolor: COLORS.black,
                textTransform: 'none', px: 3, py: 1, fontWeight: 600,
                fontSize: 13,
                '&:hover': { bgcolor: '#222' }
              }}
            >
              Create Organization
            </Button>
          </Box>
        )}
      </Box>

      {/* ── Table Container ────────────────────────────────────────── */}
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
            {loading ? <Skeleton variant="circular" width={18} height={18} /> : <Business sx={{ fontSize: 18, color: COLORS.black }} />}
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
                  {view === 'active' ? 'Active Organizations' : 'Deleted Organizations'}
                </Typography>
                <Typography sx={{ fontFamily: fontStack, fontSize: 12, color: COLORS.textSecondary }}>
                  {view === 'active' ? 'Monitor and manage institutional organizations' : 'Restore or permanently delete removed records'}
                </Typography>
              </>
            )}
          </Box>
        </Box>

        <TableContainer>
          <Table>
            <TableHead>
              <TableRow sx={{ backgroundColor: '#F8FAFC' }}>
                {['Organization', 'Description', 'Join Code', 'Signatory', 'Actions'].map((h, i) => (
                  <TableCell
                    key={h}
                    align={h === 'Actions' ? 'right' : 'left'}
                    sx={{
                      fontFamily: fontStack, fontSize: 11, fontWeight: 700,
                      color: COLORS.textSecondary, textTransform: 'uppercase',
                      letterSpacing: '0.08em', py: 2
                    }}
                  >
                    {loading ? <Skeleton variant="text" width={h === 'Actions' ? "40%" : "60%"} height={20} sx={{ ml: h === 'Actions' ? 'auto' : 0 }} /> : h}
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
                  <TableRow key={org._id} hover sx={{ '&:last-child td': { border: 0 } }}>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Avatar sx={{ bgcolor: `${COLORS.lavender}25`, color: COLORS.black, fontWeight: 700, fontSize: 14 }}>
                          {org.name?.charAt(0)}
                        </Avatar>
                        <Box>
                          <Typography sx={{ fontWeight: 700, fontSize: 14 }}>{org.name}</Typography>
                          {org.isFinal && <Chip label="Final Signatory" size="small" sx={{ height: 16, fontSize: 10, bgcolor: COLORS.orange + '20', color: COLORS.orange, fontWeight: 700 }} />}
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Typography sx={{ fontSize: 13, fontWeight: 600, color: COLORS.textPrimary }}>
                        {org.description || "—"}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Typography sx={{ fontSize: 13, fontWeight: 700, color: COLORS.teal, fontStyle: 'italic', letterSpacing: '0.05em' }}>
                          {org.joinCode || "—"}
                        </Typography>
                        {org.joinCode && (
                          <Tooltip title="Copy to Clipboard">
                            <IconButton
                              size="small"
                              onClick={() => {
                                navigator.clipboard.writeText(org.joinCode);
                                // Optional alert could go here
                              }}
                              sx={{ ml: 0.5, p: 0.5, color: COLORS.teal }}
                            >
                              <History fontSize="inherit" sx={{ transform: 'rotate(90deg)', fontSize: 14 }} />
                            </IconButton>
                          </Tooltip>
                        )}
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Typography sx={{ fontSize: 13, fontWeight: 500, color: COLORS.textSecondary }}>
                        {org.signatoryName || "—"}
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
                        {view === "active" ? (
                          <>
                            <Tooltip title="Edit">
                              <IconButton size="small" onClick={() => setManageOrg(org)} sx={{ color: COLORS.black, '&:hover': { backgroundColor: `${COLORS.lavender}20` } }}>
                                <Visibility fontSize="small" />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Move to Trash">
                              <IconButton size="small"
                                onClick={async () => {
                                  if (window.confirm("Move this organization to trash?")) {
                                    await adminService.deleteOrganization(org._id);
                                    fetchData();
                                  }
                                }}
                                sx={{ color: COLORS.orange, '&:hover': { backgroundColor: `${COLORS.orange}15` } }}
                              >
                                <Delete fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          </>
                        ) : (
                          <>
                            <Tooltip title="Restore">
                              <IconButton size="small"
                                onClick={async () => {
                                  await adminService.restoreOrganization(org._id);
                                  fetchData();
                                }}
                                sx={{ color: COLORS.teal, '&:hover': { backgroundColor: `${COLORS.teal}15` } }}
                              >
                                <RestoreFromTrash fontSize="small" />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Delete Permanently">
                              <IconButton size="small"
                                onClick={async () => {
                                  if (window.confirm("Permanently delete this organization? This cannot be undone.")) {
                                    await adminService.permanentDeleteOrganization(org._id);
                                    fetchData();
                                  }
                                }}
                                sx={{ color: '#EF4444', '&:hover': { backgroundColor: '#FEF2F2' } }}
                              >
                                <DeleteForever fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          </>
                        )}
                      </Box>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
        <Box sx={{ mt: 3, display: 'flex', justifyContent: 'center' }}>
          <Pagination
            count={totalPages}
            page={page}
            onChange={(_, v) => setPage(v)}
            sx={{
              '& .MuiPaginationItem-root': {
                fontFamily: fontStack, borderRadius: '10px', fontWeight: 600,
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
        PaperProps={{ sx: { borderRadius: COLORS.cardRadius, p: 1 } }}
      >
        <DialogTitle sx={{ fontWeight: 800, fontFamily: fontStack }}>
          {manageOrg?._id ? "Edit Organization" : "Create New Organization"}
        </DialogTitle>
        <DialogContent>
          <Box display="flex" flexDirection="column" gap={3} sx={{ mt: 2 }}>
            <Box>
              <FormLabel sx={{ fontFamily: fontStack, fontWeight: 700, fontSize: 13, color: COLORS.textPrimary, mb: 1, display: 'block' }}>
                Organization Name
              </FormLabel>
              <TextField
                fullWidth
                placeholder="e.g. Registrar"
                value={name}
                onChange={(e) => setName(e.target.value)}
                InputProps={{ sx: { borderRadius: '12px', bgcolor: '#F8FAFC' } }}
              />
            </Box>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <FormLabel sx={{ fontFamily: fontStack, fontWeight: 700, fontSize: 13, color: COLORS.textPrimary, mb: 1, display: 'block' }}>
                  Short Description
                </FormLabel>
                <TextField
                  fullWidth
                  placeholder="e.g. Office of the Registrar"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  InputProps={{ sx: { borderRadius: '12px', bgcolor: '#F8FAFC' } }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormLabel sx={{ fontFamily: fontStack, fontWeight: 700, fontSize: 13, color: COLORS.textPrimary, mb: 1, display: 'block' }}>
                  Join Code (System Generated)
                </FormLabel>
                <TextField
                  fullWidth
                  value={joinCode}
                  disabled
                  InputProps={{
                    sx: { borderRadius: '12px', bgcolor: '#F1F5F9', fontWeight: 800, color: COLORS.teal, textAlign: 'center' },
                  }}
                />
              </Grid>
              <Grid item xs={12} sm={12}>
                <FormLabel sx={{ fontFamily: fontStack, fontWeight: 700, fontSize: 13, color: COLORS.textPrimary, mb: 1, display: 'block' }}>
                  Signatory Name
                </FormLabel>
                <TextField
                  fullWidth
                  placeholder="e.g. John Doe"
                  value={signatoryName}
                  onChange={(e) => setSignatoryName(e.target.value)}
                  InputProps={{ sx: { borderRadius: '12px', bgcolor: '#F8FAFC' } }}
                />
              </Grid>
            </Grid>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, p: 2, borderRadius: '12px', bgcolor: '#F8FAFC', border: `1px solid ${COLORS.border}` }}>
              <Box sx={{ flex: 1 }}>
                <Typography sx={{ fontWeight: 700, fontSize: 14 }}>Final Signatory</Typography>
                <Typography sx={{ fontSize: 12, color: COLORS.textSecondary }}>Is this the last step in the clearance workflow?</Typography>
              </Box>
              <Button
                variant={isFinal ? "contained" : "outlined"}
                onClick={() => setIsFinal(!isFinal)}
                size="small"
                sx={{
                  borderRadius: '8px', textTransform: 'none', fontWeight: 600,
                  bgcolor: isFinal ? COLORS.black : 'transparent',
                  color: isFinal ? '#FFF' : COLORS.black,
                  borderColor: COLORS.black,
                  '&:hover': { bgcolor: isFinal ? '#222' : 'transparent', borderColor: COLORS.black }
                }}
              >
                {isFinal ? "Enabled" : "Disabled"}
              </Button>
            </Box>
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 3, gap: 1 }}>
          <Button
            onClick={() => setManageOrg(null)}
            sx={{ color: COLORS.textSecondary, textTransform: 'none', fontWeight: 600, fontFamily: fontStack }}
          >
            Cancel
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

                  await adminService.createOrganization({
                    name,
                    description,
                    signatoryName,
                    isFinal,
                    termId: activeTerm?._id
                  });
                }
                fetchData();
                setManageOrg(null);
                setName(""); setDescription(""); setSignatoryName(""); setIsFinal(false);
              } catch (err: any) {
                console.error("Failed to save organization:", err);
                const msg = err.response?.data?.message || err.message || "An error occurred";
                alert(msg);
              }
            }}
            sx={{
              borderRadius: COLORS.pillRadius, bgcolor: COLORS.black,
              textTransform: 'none', px: 4, fontWeight: 600,
              fontFamily: fontStack,
              '&:hover': { bgcolor: '#222' }
            }}
          >
            {manageOrg?._id ? "Save Changes" : "Create Organization"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
