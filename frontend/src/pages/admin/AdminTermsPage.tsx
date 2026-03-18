import React, { useEffect, useState, useCallback } from "react";
import {
  Box, Typography, Card, CardContent, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Paper, Button, Grid, IconButton,
  Tooltip, TextField, Chip, Skeleton, useTheme, useMediaQuery
} from "@mui/material";
import {
  AddCircle, Delete, CheckCircle, EventNote, History, Refresh
} from '@mui/icons-material';
import { adminService } from "../../services";
import Swal from "sweetalert2";

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

interface Term {
  _id: string;
  academicYear: string;
  semester: string;
  isActive: boolean;
  createdAt: string;
}

export default function AdminTermsPage({
  refreshTrigger = 0,
  onLoadingChange
}: {
  refreshTrigger?: number;
  onLoadingChange?: (loading: boolean) => void;
}) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const [terms, setTerms] = useState<Term[]>([]);
  const [loading, setLoading] = useState(true);
  const [ay, setAy] = useState("");
  const [sem, setSem] = useState("");
  const [saving, setSaving] = useState(false);

  const fetchTerms = useCallback(async () => {
    setLoading(true);
    onLoadingChange?.(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      const data = await adminService.getTerms();
      setTerms(data || []);
    } catch (error) {
      console.error('Failed to fetch terms:', error);
    } finally {
      setLoading(false);
      onLoadingChange?.(false);
    }
  }, [onLoadingChange]);

  useEffect(() => {
    fetchTerms();
  }, [fetchTerms]);

  useEffect(() => {
    if (refreshTrigger > 0) {
      fetchTerms();
    }
  }, [refreshTrigger, fetchTerms]);

  const handleSave = async () => {
    if (!ay || !sem) {
      Swal.fire("Required", "Please fill in all fields", "warning");
      return;
    }
    setSaving(true);
    try {
      await adminService.createTerm({ academicYear: ay, semester: sem });
      Swal.fire("Success", "Academic term created", "success");
      setAy("");
      setSem("");
      fetchTerms();
    } catch (error: any) {
      Swal.fire("Error", error.response?.data?.message || "Failed to create term", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleActivate = async (id: string) => {
    const result = await Swal.fire({
      title: "Activate Term?",
      text: "This will deactivate all other terms. Active terms control join visibility and other academic constraints.",
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "Yes, activate",
      confirmButtonColor: COLORS.black
    });

    if (result.isConfirmed) {
      try {
        await adminService.activateTerm(id);
        Swal.fire("Activated", "Term is now the system primary", "success");
        fetchTerms();
      } catch (error: any) {
        Swal.fire("Error", "Failed to activate term", "error");
      }
    }
  };

  const handleDelete = async (id: string) => {
    const result = await Swal.fire({
      title: "Delete Term?",
      text: "This action cannot be undone.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Delete",
      confirmButtonColor: "#EF4444"
    });

    if (result.isConfirmed) {
      try {
        await adminService.deleteTerm(id);
        Swal.fire("Deleted", "Term removed", "success");
        fetchTerms();
      } catch (error: any) {
        Swal.fire("Error", "Failed to delete term", "error");
      }
    }
  };

  const activeTerm = terms.find(t => t.isActive);

  return (
    <Box sx={{ fontFamily: fontStack }}>
      {/* ─── Top Stats ─── */}
      <Grid container spacing={3} mb={5}>
        <Grid item xs={12} md={6}>
          <Card sx={{ height: '100%', borderRadius: COLORS.cardRadius, boxShadow: 'none', border: `1px solid ${COLORS.border}` }}>
            <CardContent>
              <Box display="flex" alignItems="center" gap={2} mb={1}>
                {loading ? <Skeleton variant="circular" width={24} height={24} /> : <EventNote sx={{ color: COLORS.teal }} />}
                <Typography variant="subtitle2" sx={{ fontWeight: 700, color: COLORS.textSecondary }}>
                  {loading ? <Skeleton width={80} /> : "Total Cycles"}
                </Typography>
              </Box>
              <Typography variant="h4" sx={{ fontWeight: 800 }}>
                {loading ? <Skeleton width={40} height={40} /> : terms.length}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={6}>
          <Card sx={{ height: '100%', borderRadius: COLORS.cardRadius, boxShadow: 'none', border: `1px solid ${COLORS.border}`, backgroundColor: !loading && activeTerm ? '#f0fdf4' : COLORS.surface }}>
            <CardContent>
              <Box display="flex" alignItems="center" gap={2} mb={1}>
                {loading ? <Skeleton variant="circular" width={24} height={24} /> : <CheckCircle sx={{ color: COLORS.teal }} />}
                <Typography variant="subtitle2" sx={{ fontWeight: 700, color: COLORS.textSecondary }}>
                  {loading ? <Skeleton width={100} /> : "Current Active"}
                </Typography>
              </Box>
              <Typography variant="h6" sx={{ fontWeight: 800 }}>
                {loading ? <Skeleton width={120} height={32} /> : (activeTerm ? `${activeTerm.academicYear} ${activeTerm.semester}` : 'None Set')}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Grid container spacing={4}>
        {/* ─── Create Form ─── */}
        <Grid item xs={12} lg={5}>
          <Card sx={{ height: '100%', borderRadius: COLORS.cardRadius, boxShadow: '0 4px 20px rgba(0,0,0,0.05)', border: `1px solid ${COLORS.border}` }}>
            <CardContent sx={{ p: 4 }}>
              <Typography variant="h6" sx={{ fontWeight: 800, mb: 3 }}>
                {loading ? <Skeleton width={100} /> : "New Term"}
              </Typography>
              <Box display="flex" flexDirection="column" gap={3}>
                <Box>
                  <Typography variant="caption" sx={{ fontWeight: 700, color: COLORS.textSecondary, mb: 1, display: 'block' }}>
                    {loading ? <Skeleton width={120} /> : "ACADEMIC YEAR"}
                  </Typography>
                  {loading ? (
                    <Skeleton variant="rounded" height={56} sx={{ borderRadius: '12px' }} />
                  ) : (
                    <TextField
                      fullWidth
                      placeholder="e.g., 2025-2026"
                      value={ay}
                      onChange={(e) => setAy(e.target.value)}
                      variant="outlined"
                      sx={{
                        '& .MuiOutlinedInput-root': { borderRadius: '12px' },
                        '& .MuiOutlinedInput-input': { fontWeight: 500 }
                      }}
                    />
                  )}
                </Box>
                <Box>
                  <Typography variant="caption" sx={{ fontWeight: 700, color: COLORS.textSecondary, mb: 1, display: 'block' }}>
                    {loading ? <Skeleton width={80} /> : "SEMESTER"}
                  </Typography>
                  {loading ? (
                    <Skeleton variant="rounded" height={56} sx={{ borderRadius: '12px' }} />
                  ) : (
                    <TextField
                      fullWidth
                      placeholder="e.g., 1st Semester"
                      value={sem}
                      onChange={(e) => setSem(e.target.value)}
                      variant="outlined"
                      sx={{
                        '& .MuiOutlinedInput-root': { borderRadius: '12px' },
                        '& .MuiOutlinedInput-input': { fontWeight: 500 }
                      }}
                    />
                  )}
                </Box>
                {loading ? (
                  <Skeleton variant="rounded" height={48} sx={{ borderRadius: '12px', mt: 2 }} />
                ) : (
                  <Button
                    fullWidth
                    variant="contained"
                    startIcon={<AddCircle />}
                    onClick={handleSave}
                    disabled={saving}
                    sx={{
                      mt: 2,
                      py: 1.5,
                      borderRadius: '12px',
                      backgroundColor: COLORS.black,
                      textTransform: 'none',
                      fontWeight: 600,
                      '&:hover': { backgroundColor: '#222' }
                    }}
                  >
                    Create Term
                  </Button>
                )}
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* ─── Terms Table ─── */}
        <Grid item xs={12} lg={7}>
          <TableContainer component={Paper} sx={{ height: '100%', borderRadius: COLORS.cardRadius, boxShadow: 'none', border: `1px solid ${COLORS.border}`, overflow: 'hidden' }}>
            <Table>
              <TableHead sx={{ backgroundColor: '#F8FAFC' }}>
                <TableRow>
                  <TableCell sx={{ fontWeight: 700, color: COLORS.textSecondary }}>
                    {loading ? <Skeleton width={60} /> : "STATUS"}
                  </TableCell>
                  <TableCell sx={{ fontWeight: 700, color: COLORS.textSecondary }}>
                    {loading ? <Skeleton width={120} /> : "ACADEMIC YEAR"}
                  </TableCell>
                  <TableCell sx={{ fontWeight: 700, color: COLORS.textSecondary }}>
                    {loading ? <Skeleton width={100} /> : "SEMESTER"}
                  </TableCell>
                  <TableCell align="right" sx={{ fontWeight: 700, color: COLORS.textSecondary }}>
                    {loading ? <Skeleton width={80} sx={{ ml: 'auto' }} /> : "ACTIONS"}
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loading ? (
                  [1, 2, 3].map((i) => (
                    <TableRow key={i}>
                      <TableCell><Skeleton width={80} /></TableCell>
                      <TableCell><Skeleton width={120} /></TableCell>
                      <TableCell><Skeleton width={100} /></TableCell>
                      <TableCell align="right"><Skeleton width={80} sx={{ ml: 'auto' }} /></TableCell>
                    </TableRow>
                  ))
                ) : terms.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} align="center" sx={{ py: 8 }}>
                      <History sx={{ fontSize: 40, color: COLORS.border, mb: 1 }} />
                      <Typography variant="body2" sx={{ color: COLORS.textSecondary }}>No terms found. Create your first one to get started.</Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  terms.map((term) => (
                    <TableRow key={term._id} hover>
                      <TableCell>
                        <Chip
                          label={term.isActive ? "ACTIVE" : "INACTIVE"}
                          size="small"
                          sx={{
                            fontWeight: 700,
                            fontSize: '10px',
                            backgroundColor: term.isActive ? '#DCFCE7' : '#F1F5F9',
                            color: term.isActive ? '#166534' : '#64748B',
                            borderRadius: '6px'
                          }}
                        />
                      </TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>{term.academicYear}</TableCell>
                      <TableCell sx={{ color: COLORS.textSecondary }}>{term.semester}</TableCell>
                      <TableCell align="right">
                        <Box display="flex" justifyContent="flex-end" gap={1}>
                          {!term.isActive && (
                            <Tooltip title="Set as Active">
                              <IconButton size="small" onClick={() => handleActivate(term._id)} sx={{ color: COLORS.teal }}>
                                <CheckCircle />
                              </IconButton>
                            </Tooltip>
                          )}
                          <Tooltip title="Delete">
                            <IconButton size="small" onClick={() => handleDelete(term._id)} sx={{ color: '#EF4444' }}>
                              <Delete />
                            </IconButton>
                          </Tooltip>
                        </Box>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Grid>
      </Grid>
    </Box>
  );
}
