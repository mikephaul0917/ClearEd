import { useEffect, useMemo, useState, useCallback } from "react";
import {
  Box, Typography, Card, CardContent, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Paper, FormControl, InputLabel,
  Select, Menu, MenuItem, Chip, Button, Dialog, DialogTitle, DialogContent,
  DialogActions, Alert, Grid, IconButton, Tooltip, LinearProgress, CircularProgress,
  Pagination, Avatar, SelectChangeEvent, useTheme, useMediaQuery, Skeleton,
  TextField, InputAdornment, FormLabel, Switch
} from "@mui/material";
import {
  Visibility, Business, FilterList, Search, AddCircle,
  Delete, RestoreFromTrash, DeleteForever, History, Security, CorporateFare,
  MoreVert, CheckCircleRounded, Close, ChevronRight, ChevronLeft
} from '@mui/icons-material';
import { adminService, organizationService } from "../../services";
import { getAbsoluteUrl, getInitials } from "../../utils/avatarUtils";
import { motion } from "framer-motion";

// ─── Modern Bento Design System ──────────────────────────────────────────────
const COLORS = {
  pageBg: '#F9FAFB',
  surface: '#FFFFFF',
  black: '#3c4043',
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

const fontStack = '"Google Sans", "Product Sans", Roboto, sans-serif';

interface OrganizationRow {
  _id: string;
  name: string;
  description?: string;
  joinCode: string;
  signatoryName?: string;
  isFinal?: boolean;
}

// ─── Bento Organization Card Sub-component ───────────────────────────
const OrgBentoCard = ({
  org,
  onDetails,
  onRestore,
  onMenuOpen,
  isArchived = false
}: {
  org: OrganizationRow;
  onDetails: (org: OrganizationRow) => void;
  onRestore?: (org: OrganizationRow) => void;
  onMenuOpen: (event: React.MouseEvent<HTMLElement>, org: OrganizationRow) => void;
  isArchived?: boolean;
}) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(org.joinCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Box sx={{
      p: 3, borderRadius: COLORS.cardRadius, bgcolor: COLORS.surface,
      border: isArchived ? '1px solid #EF444430' : `1px solid ${COLORS.border}`,
      boxShadow: '0 4px 6px -1px rgba(0,0,0,0.02)',
      position: 'relative',
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'space-between',
      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
      '&:hover': {
        transform: 'translateY(-4px)',
        boxShadow: '0 12px 20px -5px rgba(0,0,0,0.08), 0 10px 10px -5px rgba(0,0,0,0.01)',
        borderColor: isArchived ? '#EF444480' : COLORS.teal + '50'
      }
    }}>
      <Box sx={{ mb: 2 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Avatar sx={{
              width: 44, height: 44,
              bgcolor: '#5f6368',
              color: '#FFFFFF',
              fontWeight: 800, fontSize: 16, borderRadius: '12px'
            }}>
              {org.name?.charAt(0)}
            </Avatar>
            <Box>
              <Typography sx={{ fontWeight: 800, fontSize: 15, color: COLORS.textPrimary }}>{org.name}</Typography>
              <Typography sx={{ fontSize: 12, color: COLORS.textSecondary, fontWeight: 500 }}>{org.signatoryName || "No Signatory"}</Typography>
            </Box>
          </Box>
          <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
            <Box sx={{
              display: 'inline-flex',
              alignItems: 'center',
              px: 1.5,
              py: 0.5,
              borderRadius: '99px',
              bgcolor: isArchived ? '#FEE2E2' : COLORS.tealLight,
              border: isArchived ? '1px solid #EF444420' : `1px solid ${COLORS.teal}20`,
              height: 22
            }}>
              <Typography sx={{
                fontSize: 12,
                fontWeight: 800,
                color: isArchived ? '#EF4444' : COLORS.teal,
                lineHeight: 1
              }}>
                {isArchived ? "Archived" : "Active"}
              </Typography>
            </Box>
            <IconButton
              size="small"
              onClick={(e) => onMenuOpen(e, org)}
              sx={{ color: COLORS.textSecondary, borderRadius: '8px', '&:hover': { bgcolor: '#F1F5F9' } }}
            >
              <MoreVert sx={{ fontSize: 20 }} />
            </IconButton>
          </Box>
        </Box>

        <Typography sx={{
          fontSize: 13,
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
          "{org.description || "Institutional organization for official documentation and signatory processes."}"
        </Typography>
      </Box>

      <Box sx={{ pt: 2, borderTop: '1px solid #F1F5F9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography sx={{ fontSize: 12, color: COLORS.textSecondary, fontWeight: 500 }}>
          Code:{" "}
          <Tooltip title={copied ? "Copied!" : "Click to copy"} arrow placement="top">
            <Box
              component="span"
              onClick={handleCopy}
              sx={{
                fontWeight: 800,
                color: COLORS.teal,
                cursor: 'pointer',
                '&:hover': { textDecoration: 'underline' },
                transition: 'all 0.2s'
              }}
            >
              {org.joinCode}
            </Box>
          </Tooltip>
        </Typography>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            onClick={(e) => { e.stopPropagation(); onDetails(org); }}
            size="small"
            variant="text"
            sx={{
              textTransform: 'none', fontWeight: 800, color: COLORS.teal,
              fontSize: 14,
              '&:hover': {
                bgcolor: 'transparent',
                textDecoration: 'underline',
              },
              transition: 'all 0.2s'
            }}
          >
            Modify
          </Button>
          {isArchived && (
            <Button
              onClick={(e) => { e.stopPropagation(); onRestore?.(org); }}
              size="small"
              variant="contained"
              disableElevation
              sx={{
                textTransform: 'none', fontWeight: 800, borderRadius: '10px',
                bgcolor: COLORS.teal, color: '#FFF', px: 2,
                '&:hover': { bgcolor: '#08657A' }
              }}
            >
              Restore
            </Button>
          )}
        </Box>
      </Box>
    </Box>
  );
};

// ─── Bento Skeleton Loaders ──────────────────────────────────────────
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

const OrgBentoCardSkeleton = () => (
  <Box sx={{
    p: { xs: 2, sm: 3 }, borderRadius: COLORS.cardRadius, bgcolor: COLORS.surface,
    border: `1px solid ${COLORS.border}`, boxShadow: '0 4px 6px -1px rgba(0,0,0,0.02)',
    height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between'
  }}>
    <Box sx={{ mb: 2 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 1.5, sm: 2 } }}>
          <Skeleton variant="rounded" width={44} height={44} sx={{ borderRadius: '12px' }} />
          <Box>
            <Skeleton variant="text" width={100} height={20} />
            <Skeleton variant="text" width={60} height={16} />
          </Box>
        </Box>
        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
          <Skeleton variant="rectangular" width={50} height={20} sx={{ borderRadius: '10px' }} />
        </Box>
      </Box>
      <Skeleton variant="text" width="100%" height={16} />
      <Skeleton variant="text" width="90%" height={16} />
      <Skeleton variant="text" width="80%" height={16} />
    </Box>
    <Box sx={{ pt: 2, borderTop: '1px solid #F1F5F9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <Skeleton variant="text" width={60} height={16} />
      <Box sx={{ display: 'flex', gap: 1 }}>
        <Skeleton variant="rectangular" width={60} height={32} sx={{ borderRadius: '10px' }} />
      </Box>
    </Box>
  </Box>
);

const MemberItemSkeleton = () => (
  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, p: 1.5 }}>
    <Skeleton variant="circular" width={44} height={44} />
    <Box sx={{ flex: 1 }}>
      <Skeleton variant="text" width="60%" height={20} />
      <Skeleton variant="text" width="40%" height={16} />
    </Box>
    <Skeleton variant="rectangular" width={60} height={24} sx={{ borderRadius: '8px' }} />
  </Box>
);

const ToolbarSkeleton = () => (
  <Box sx={{ p: { xs: 3, sm: 4 }, pb: 2 }}>
    <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, justifyContent: 'space-between', alignItems: { xs: 'flex-start', sm: 'center' }, gap: 2, mb: 3 }}>
      <Skeleton variant="text" width={180} height={32} />
      <Skeleton variant="rectangular" width={140} height={44} sx={{ borderRadius: COLORS.pillRadius, width: { xs: '100%', sm: 140 } }} />
    </Box>
    <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 2, mb: 2 }}>
      <Skeleton variant="rectangular" width="100%" height={44} sx={{ borderRadius: '12px', flex: 1 }} />
      <Skeleton variant="rectangular" width={200} height={44} sx={{ borderRadius: '12px', alignSelf: { xs: 'center', md: 'auto' } }} />
    </Box>
  </Box>
);


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
  const rowsPerPage = 9;

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
    onConfirm: () => { },
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

  // --- Member Directory State ---
  const [memberListOpen, setMemberListOpen] = useState(false);
  const [members, setMembers] = useState<any[]>([]);
  const [memberSearch, setMemberSearch] = useState("");
  const [loadingMembers, setLoadingMembers] = useState(false);
  const [targetOrgName, setTargetOrgName] = useState("");
  const [isExporting, setIsExporting] = useState(false);

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
      <Box sx={{ mb: { xs: 4, sm: 6 } }}>
        {loading ? (
          <>
            <Skeleton variant="text" width={280} height={48} sx={{ mb: 1 }} />
            <Skeleton variant="text" width="100%" height={24} />
          </>
        ) : (
          <>
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
                Institutional Organizations
              </Typography>
            </Box>
            <Typography sx={{
              fontFamily: fontStack,
              fontSize: { xs: '0.8rem', sm: '0.95rem' },
              fontWeight: 400,
              color: '#6B7280',
              maxWidth: 600,
              lineHeight: 1.5
            }}>
              Manage institutional departments, signatories, and official access codes.
            </Typography>
          </>
        )}
      </Box>

      {/* ── Stats Bento Row ────────────────────────────────────────── */}
      <Box sx={{
        display: 'grid',
        gridTemplateColumns: { xs: 'repeat(1, 1fr)', sm: 'repeat(2, 1fr)', md: 'repeat(4, 1fr)' },
        gap: 3, mb: 4,
      }}>
        {loading ? (
          [1, 2, 3, 4].map((i) => <StatsCardSkeleton key={i} />)
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




      {/* ── Organization Directory (Team Activity Style) ──────────── */}
      <Box sx={{
        borderRadius: COLORS.cardRadius,
        backgroundColor: COLORS.surface,
        border: `1px solid ${COLORS.border}`,
        boxShadow: '0 4px 6px -1px rgba(0,0,0,0.02)',
        overflow: 'hidden'
      }}>
        {/* Table Header / Toolbar */}
        {loading ? (
          <ToolbarSkeleton />
        ) : (
          <Box sx={{ p: { xs: 3, sm: 4 }, pb: 2 }}>
            <Box sx={{
              display: 'flex',
              flexDirection: { xs: 'column', sm: 'row' },
              justifyContent: 'space-between',
              alignItems: { xs: 'flex-start', sm: 'center' },
              gap: 2, mb: 3
            }}>
              <Box>
                <Typography sx={{ fontWeight: 900, fontSize: { xs: 18, sm: 20 }, color: COLORS.textPrimary, letterSpacing: '-0.5px' }}>
                  Organization Directory
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', width: { xs: '100%', sm: 'auto' } }}>
                <Button
                  variant="contained"
                  disableElevation
                  fullWidth={isSmallMobile}
                  startIcon={<AddCircle />}
                  onClick={() => setManageOrg({ _id: "", name: "", signatoryName: "", description: "", joinCode: "", isFinal: false })}
                  sx={{
                    borderRadius: COLORS.pillRadius, bgcolor: COLORS.black,
                    textTransform: 'none', px: { xs: 2, sm: 4 }, py: 1.2, fontWeight: 800,
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

            <Box sx={{
              display: 'flex',
              flexDirection: { xs: 'column', md: 'row' },
              gap: 2, mb: 2,
              alignItems: 'center'
            }}>
              <TextField
                placeholder="Search..."
                value={query}
                onChange={(e) => { setQuery(e.target.value); setPage(1); }}
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
                p: 0.5,
                borderRadius: '12px',
                width: { xs: '100%', md: 'auto' },
                justifyContent: 'center'
              }}>
                <Button
                  disableRipple
                  onClick={() => { setView('active'); setPage(1); }}
                  sx={{
                    flex: { xs: 1, md: 'none' },
                    textTransform: 'none', px: 2, py: 1, borderRadius: '10px', fontSize: 13, fontWeight: 700,
                    color: view === 'active' ? COLORS.textPrimary : COLORS.textSecondary,
                    position: 'relative',
                    zIndex: 1,
                    transition: 'color 0.2s ease',
                    minWidth: { xs: 0, sm: 100 },
                    '&:hover': {
                      color: view === 'active' ? COLORS.textPrimary : COLORS.black,
                      bgcolor: 'transparent'
                    },
                    backgroundColor: 'transparent !important',
                  }}
                >
                  {view === 'active' && (
                    <motion.div
                      layoutId="activeOrgTab"
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
                      transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                    />
                  )}
                  Active
                </Button>
                <Button
                  disableRipple
                  onClick={() => { setView('deleted'); setPage(1); }}
                  sx={{
                    flex: { xs: 1, md: 'none' },
                    textTransform: 'none', px: 2, py: 1, borderRadius: '10px', fontSize: 13, fontWeight: 700,
                    color: view === 'deleted' ? COLORS.textPrimary : COLORS.textSecondary,
                    position: 'relative',
                    zIndex: 1,
                    transition: 'color 0.2s ease',
                    minWidth: { xs: 0, sm: 100 },
                    '&:hover': {
                      color: view === 'deleted' ? COLORS.textPrimary : COLORS.black,
                      bgcolor: 'transparent'
                    },
                    backgroundColor: 'transparent !important',
                  }}
                >
                  {view === 'deleted' && (
                    <motion.div
                      layoutId="activeOrgTab"
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
                      transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                    />
                  )}
                  Archived
                </Button>
              </Box>
            </Box>
          </Box>
        )}



        <Box sx={{ p: 4, pt: 0 }}>
          {loading ? (
            <Grid container spacing={3}>
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <Grid item xs={12} sm={6} lg={4} key={i}>
                  <OrgBentoCardSkeleton />
                </Grid>
              ))}
            </Grid>
          ) : paginatedRows.length === 0 ? (
            <Box sx={{ py: 12, textAlign: 'center' }}>
              <Business sx={{ fontSize: 48, color: '#CBD5E1', mb: 2 }} />
              <Typography sx={{ color: COLORS.textSecondary, fontFamily: fontStack, fontSize: 16, fontWeight: 600 }}>
                No organizations found in this directory.
              </Typography>
            </Box>
          ) : (
            <Grid container spacing={3}>
              {paginatedRows.map((org) => (
                <Grid item xs={12} sm={6} lg={4} key={org._id}>
                  <OrgBentoCard
                    org={org}
                    isArchived={view === 'deleted'}
                    onDetails={(org) => setManageOrg(org)}
                    onRestore={(org) => {
                      setConfirmDialog({
                        open: true,
                        title: "Restore Member?",
                        message: `You are about to restore "${org.name}" to the active directory.`,
                        confirmText: "Yes, Restore",
                        onConfirm: () => adminService.restoreOrganization(org._id).then(() => {
                          fetchData();
                          setSuccessDialog({
                            open: true,
                            title: "Restoration Successful",
                            message: `"${org.name}" has been successfully restored.`
                          });
                        })
                      });
                    }}
                    onMenuOpen={(e, org) => {
                      setMenuAnchorEl(e.currentTarget);
                      setActiveMenuOrg(org);
                    }}
                  />
                </Grid>
              ))}
            </Grid>
          )}
        </Box>
        <Box sx={{ p: 3, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, borderTop: `1px solid ${COLORS.border}` }}>
          {loading ? (
            <Skeleton variant="rounded" width={240} height={44} sx={{ borderRadius: '40px' }} />
          ) : (
            <>
              <Typography sx={{ fontSize: 13, color: COLORS.textSecondary, fontWeight: 600, mb: 2 }}>
                Showing <Box component="span" sx={{ color: COLORS.textPrimary }}>{paginatedRows.length}</Box> of <Box component="span" sx={{ color: COLORS.textPrimary }}>{filtered.length}</Box> entries
              </Typography>
              <Box sx={{
                display: 'flex',
                gap: 1.5,
                alignItems: 'center',
                bgcolor: '#F1F5F9',
                px: 1,
                py: 0.5,
                borderRadius: '40px'
              }}>
                <IconButton
                  disabled={page === 1}
                  onClick={() => setPage(page - 1)}
                  sx={{ color: page === 1 ? '#CBD5E1' : COLORS.textSecondary }}
                >
                  <ChevronLeft sx={{ fontSize: 20 }} />
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
                          width: 36,
                          height: 36,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          cursor: 'pointer',
                          borderRadius: '12px',
                          bgcolor: isActive ? COLORS.black : 'transparent',
                          color: isActive ? '#FFFFFF' : COLORS.textSecondary,
                          fontWeight: 800,
                          fontSize: 14,
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
                  sx={{ color: page === totalPages ? '#CBD5E1' : COLORS.textSecondary }}
                >
                  <ChevronRight sx={{ fontSize: 20 }} />
                </IconButton>
              </Box>
            </>
          )}
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
            borderRadius: 3, p: 1, boxShadow: '0 25px 50px -12px rgba(0,0,0,0.15)',
            border: `1px solid ${COLORS.border}`
          }
        }}
      >
        <DialogTitle sx={{ p: 4, pb: 1 }}>
          <Typography sx={{ fontFamily: fontStack, fontWeight: 700, fontSize: 22, color: COLORS.textPrimary, letterSpacing: '-0.5px' }}>
            {manageOrg?._id ? "Organization Settings" : "New Organization"}
          </Typography>
          <Typography sx={{ fontFamily: fontStack, fontSize: 13, color: COLORS.textSecondary, fontWeight: 400, mt: 0.5 }}>
            {manageOrg?._id ? "Update department details and signatory configurations." : "Establish a new institutional office for the clearance workflow."}
          </Typography>
        </DialogTitle>
        <DialogContent sx={{ p: 4 }}>
          <Box display="flex" flexDirection="column" gap={3.5}>
            <Box>
              <FormLabel sx={{ fontFamily: fontStack, fontWeight: 600, fontSize: 13, color: COLORS.textPrimary, mb: 1.5, display: 'block' }}>
                Full Name
              </FormLabel>
              <TextField
                fullWidth
                placeholder="e.g. Registrar's Office"
                value={name}
                onChange={(e) => setName(e.target.value)}
                InputProps={{ sx: { fontFamily: fontStack, borderRadius: 2, bgcolor: '#F8FAFC', border: 'none', px: 0.5 } }}
                sx={{ '& .MuiOutlinedInput-notchedOutline': { border: '1px solid #E2E8F0' } }}
              />
            </Box>
            <Box>
              <FormLabel sx={{ fontFamily: fontStack, fontWeight: 600, fontSize: 13, color: COLORS.textPrimary, mb: 1.5, display: 'block' }}>
                Internal Description
              </FormLabel>
              <TextField
                fullWidth
                multiline
                rows={2}
                placeholder="Briefly describe the purpose of this organization..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                InputProps={{ sx: { fontFamily: fontStack, borderRadius: 2, bgcolor: '#F8FAFC' } }}
                sx={{ '& .MuiOutlinedInput-notchedOutline': { border: '1px solid #E2E8F0' } }}
              />
            </Box>
            <Grid container spacing={3}>
              <Grid item xs={12} sm={6}>
                <FormLabel sx={{ fontFamily: fontStack, fontWeight: 600, fontSize: 13, color: COLORS.textPrimary, mb: 1.5, display: 'block' }}>
                  System Signatory
                </FormLabel>
                <TextField
                  fullWidth
                  placeholder="e.g. Juan Dela Cruz"
                  value={signatoryName}
                  onChange={(e) => setSignatoryName(e.target.value)}
                  InputProps={{ sx: { fontFamily: fontStack, borderRadius: 2, bgcolor: '#F8FAFC' } }}
                  sx={{ '& .MuiOutlinedInput-notchedOutline': { border: '1px solid #E2E8F0' } }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormLabel sx={{ fontFamily: fontStack, fontWeight: 600, fontSize: 13, color: COLORS.textPrimary, mb: 1.5, display: 'block' }}>
                  Access Code
                </FormLabel>
                <TextField
                  fullWidth
                  value={joinCode || "AUTO-GEN"}
                  disabled
                  InputProps={{
                    sx: {
                      fontFamily: fontStack, borderRadius: 2, bgcolor: '#F1F5F9', fontWeight: 700,
                      color: COLORS.accentBlue, textAlign: 'center', fontSize: 14
                    },
                  }}
                />
              </Grid>
            </Grid>
            <Box sx={{
              display: 'flex', alignItems: 'center', gap: 2, p: 2.5, borderRadius: 2,
              bgcolor: isFinal ? '#F0FDFA' : '#F8FAFC', border: `1px solid ${isFinal ? '#CCFBF1' : '#E2E8F0'}`,
              transition: '0.3s'
            }}>
              <Box sx={{ flex: 1 }}>
                <Typography sx={{ fontFamily: fontStack, fontWeight: 600, fontSize: 14, color: COLORS.textPrimary }}>Final Milestone</Typography>
                <Typography sx={{ fontFamily: fontStack, fontSize: 11, color: COLORS.textSecondary, fontWeight: 400 }}>
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
            sx={{ fontFamily: fontStack, color: COLORS.textSecondary, textTransform: 'none', fontWeight: 600, fontSize: 14 }}
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
              fontFamily: fontStack, borderRadius: '8px', bgcolor: COLORS.black,
              textTransform: 'none', px: 4, py: 1.2, fontWeight: 600, fontSize: 14,
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
          sx: {
            borderRadius: 3,
            mt: 1.5,
            minWidth: 180,
            boxShadow: '0 20px 25px -5px rgba(0,0,0,0.05), 0 10px 10px -5px rgba(0,0,0,0.02)',
            border: `1px solid ${COLORS.border}`,
            '& .MuiMenuItem-root': {
              fontSize: 14,
              fontWeight: 700,
              py: 1.5,
              px: 2.5,
              borderRadius: 2,
              mx: 1,
              my: 0.5,
              color: COLORS.textPrimary,
              '&:hover': { bgcolor: '#F8FAFC' }
            }
          }
        }}
      >
        <MenuItem onClick={async () => {
          if (!activeMenuOrg) return;
          setTargetOrgName(activeMenuOrg.name);
          setMemberListOpen(true);
          setLoadingMembers(true);
          setMenuAnchorEl(null);
          try {
            const data = await organizationService.getMembers(activeMenuOrg._id);
            setMembers(data.data || []);
          } catch (error) {
            console.error("Failed to fetch members:", error);
          } finally {
            setLoadingMembers(false);
          }
        }}>
          <Visibility sx={{ fontSize: 18, mr: 1.5, opacity: 0.8 }} />
          View Members
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
          >
            <RestoreFromTrash sx={{ fontSize: 18, mr: 1.5, opacity: 0.8 }} />
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
          sx={{ color: '#EF4444 !important' }}
        >
          {view === 'deleted' ? (
            <>
              <DeleteForever sx={{ fontSize: 18, mr: 1.5, opacity: 1, color: 'inherit' }} />
              Delete Permanently
            </>
          ) : (
            <>
              <Delete sx={{ fontSize: 18, mr: 1.5, opacity: 0.8 }} />
              Archive
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
            borderRadius: 3,
            padding: '48px 32px',
            maxWidth: '440px',
            boxShadow: '0 25px 70px -12px rgba(0,0,0,0.18)',
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
            mb: 0.5,
            px: 2,
            fontFamily: fontStack
          }}>
            {confirmDialog.title}
          </Typography>
          <Typography sx={{
            fontSize: '16px',
            color: COLORS.textSecondary,
            fontWeight: 500,
            lineHeight: 1.5,
            mb: 5,
            px: 2,
            fontFamily: fontStack
          }}>
            {confirmDialog.message}
          </Typography>

          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
            <Button
              variant="contained"
              disableElevation
              onClick={() => {
                confirmDialog.onConfirm();
                setConfirmDialog(prev => ({ ...prev, open: false }));
              }}
              sx={{
                borderRadius: '8px',
                bgcolor: '#3c4043',
                color: '#FFF',
                textTransform: 'none',
                width: '100%',
                py: 2.2,
                fontSize: '18px',
                fontWeight: 900,
                letterSpacing: '-0.01em',
                boxShadow: '0 12px 24px -6px rgba(15, 23, 42, 0.3)',
                '&:hover': {
                  bgcolor: '#202124',
                  transform: 'translateY(-2px)',
                  boxShadow: '0 20px 35px -10px rgba(15, 23, 42, 0.4)',
                },
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                fontFamily: fontStack
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
                '&:hover': { color: COLORS.textPrimary, bgcolor: 'transparent', transform: 'scale(1.02)' },
                transition: 'all 0.2s ease',
                fontFamily: fontStack
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
            borderRadius: 3,
            p: 4,
            maxWidth: '440px',
            boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)',
            textAlign: 'center'
          }
        }}
      >
        <DialogContent sx={{ p: 0, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          {/* Animated Checkmark Icon with Glow (SuccessActionModal Style) */}
          <Box display="flex" flexDirection="column" alignItems="center" gap={4} sx={{ mb: 2, pt: 2 }}>
            <Box sx={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', width: 160, height: 160 }}>
              <motion.div
                initial={{ opacity: 0, scale: 0.7 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.1, duration: 0.6 }}
              >
                <Box
                  sx={{
                    width: 160,
                    height: 160,
                    borderRadius: '50%',
                    background: `radial-gradient(circle, rgba(176, 224, 230, 0.4) 0%, rgba(176, 224, 230, 0) 70%)`,
                    filter: 'blur(16px)',
                    zIndex: 1
                  }}
                />
              </motion.div>

              <Box
                sx={{
                  position: 'absolute',
                  width: 110,
                  height: 110,
                  borderRadius: '50%',
                  bgcolor: 'rgba(176, 224, 230, 0.1)',
                  border: `1px solid rgba(176, 224, 230, 0.2)`,
                  zIndex: 2
                }}
              />

              <Box
                sx={{
                  position: 'absolute',
                  width: 78,
                  height: 78,
                  borderRadius: '50%',
                  bgcolor: '#B0E0E6',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: '3px solid rgba(255, 255, 255, 0.3)',
                  boxShadow: `
                    0 10px 25px rgba(176, 224, 230, 0.4),
                    inset 0 -4px 6px rgba(0, 0, 0, 0.05)
                  `,
                  zIndex: 3
                }}
              >
                <svg
                  width="42"
                  height="42"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#FFFFFF"
                  strokeWidth="3.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  style={{ filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.15))' }}
                >
                  <motion.path
                    d="M20 6L9 17L4 12"
                    initial={{ pathLength: 0, opacity: 0 }}
                    animate={successDialog.open ? { pathLength: 1, opacity: 1 } : { pathLength: 0, opacity: 0 }}
                    transition={{ delay: 0.5, duration: 0.8, ease: [0.4, 0, 0.2, 1] }}
                  />
                </svg>
              </Box>
            </Box>
          </Box>

          <Typography sx={{
            fontFamily: fontStack,
            fontWeight: 750,
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
            fontFamily: fontStack,
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
              fontFamily: fontStack,
              borderRadius: '8px',
              bgcolor: '#F1F5F9',
              color: COLORS.textPrimary,
              textTransform: 'none',
              width: '100%',
              py: 2.2,
              fontSize: '18px',
              fontWeight: 700,
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
      {/* ── Member Directory Modal ─────────────────────────────────────── */}
      <Dialog
        open={memberListOpen}
        onClose={() => setMemberListOpen(false)}
        fullWidth
        maxWidth="xs"
        PaperProps={{
          sx: {
            borderRadius: 3,
            p: 0,
            maxHeight: '90vh',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
            overflow: 'hidden'
          }
        }}
      >
        <DialogContent sx={{ p: 0, display: 'flex', flexDirection: 'column' }}>
          {/* Header Section */}
          <Box sx={{ p: 3, pt: 4, position: 'relative', bgcolor: '#FFF' }}>
            <IconButton
              onClick={() => setMemberListOpen(false)}
              sx={{
                position: 'absolute',
                top: 16,
                right: 16,
                color: '#98A2B3',
                '&:hover': {
                  color: '#667085',
                  bgcolor: '#F9FAFB'
                }
              }}
            >
              <Close sx={{ fontSize: '1.25rem' }} />
            </IconButton>
            <Box>
              <Typography sx={{ fontWeight: 800, fontSize: '1.25rem', color: '#101828', fontFamily: fontStack, mb: 0.5 }}>
                {targetOrgName} Member Directory
              </Typography>
              <Typography sx={{ fontSize: '0.8125rem', color: '#475467', fontFamily: fontStack, lineHeight: 1.3 }}>
                View and manage members currently active in this organization. Review their roles and profiles.
              </Typography>
            </Box>
          </Box>

          {/* Search Bar Section */}
          <Box sx={{ px: 3, pb: 1, mt: 1 }}>
            <Typography sx={{ fontSize: '0.875rem', fontWeight: 600, color: '#344054', mb: 1.5 }}>
              Search for members
            </Typography>
            <Box sx={{ display: 'flex' }}>
              <TextField
                fullWidth
                placeholder="Search..."
                value={memberSearch}
                onChange={(e) => setMemberSearch(e.target.value)}
                variant="outlined"
                size="small"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Search sx={{ color: '#667085', fontSize: '1.25rem' }} />
                    </InputAdornment>
                  ),
                  sx: {
                    borderRadius: 2,
                    bgcolor: '#FFF',
                    fontFamily: fontStack,
                    color: '#101828',
                    boxShadow: '0 1px 2px rgba(16, 24, 40, 0.05)',
                    '& fieldset': { borderColor: '#D0D5DD' },
                  }
                }}
              />
            </Box>
          </Box>

          {/* Member List Label */}
          <Box sx={{ px: 3, py: 2 }}>
            <Typography sx={{ fontSize: '0.875rem', fontWeight: 700, color: '#344054' }}>
              In this directory
            </Typography>
          </Box>

          {/* List Section */}
          <Box sx={{
            px: 1.5,
            pb: 2,
            maxHeight: '400px',
            overflowY: 'auto',
            '&::-webkit-scrollbar': { width: '8px' },
            '&::-webkit-scrollbar-track': { bgcolor: 'transparent' },
            '&::-webkit-scrollbar-thumb': { bgcolor: '#F2F4F7', borderRadius: '10px', border: '2px solid #FFF' }
          }}>
            {loadingMembers ? (
              <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                {[1, 2, 3, 4, 5].map((i) => <MemberItemSkeleton key={i} />)}
              </Box>
            ) : (
              members.filter(m => {
                const user = m.userId;
                if (!user) return false;
                return (user.fullName || '').toLowerCase().includes(memberSearch.toLowerCase()) ||
                  (user.email || '').toLowerCase().includes(memberSearch.toLowerCase());
              }).length === 0 ? (
                <Box sx={{ textAlign: 'center', py: 4 }}>
                  <Typography sx={{ color: '#667085', fontFamily: fontStack }}>No members found</Typography>
                </Box>
              ) : (
                members.filter(m => {
                  const user = m.userId;
                  if (!user) return false;
                  return (user.fullName || '').toLowerCase().includes(memberSearch.toLowerCase()) ||
                    (user.email || '').toLowerCase().includes(memberSearch.toLowerCase());
                }).map((member) => {
                  const user = member.userId;
                  if (!user) return null;
                  return (
                    <Box
                      key={member._id}
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1.5,
                        p: 1.5,
                        borderRadius: 2,
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                        '&:hover': {
                          bgcolor: '#F9FAFB',
                        }
                      }}
                    >
                      <Avatar
                        src={getAbsoluteUrl(user.avatarUrl)}
                        sx={{
                          width: 44,
                          height: 44,
                          borderRadius: '50%',
                          bgcolor: COLORS.black,
                          color: '#FFFFFF',
                          fontSize: '0.875rem',
                          fontWeight: 700,
                          fontFamily: fontStack,
                          border: 'none'
                        }}
                      >
                        {getInitials(user.fullName || '')}
                      </Avatar>

                      <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Typography noWrap sx={{ fontWeight: 600, fontSize: '0.925rem', color: '#101828', fontFamily: fontStack }}>
                          {user.fullName}
                        </Typography>
                        <Typography noWrap sx={{ fontSize: '0.875rem', color: '#667085', fontFamily: fontStack }}>
                          @{user.email?.split('@')[0] || user.fullName.split(' ')[0].toLowerCase()}
                        </Typography>
                      </Box>

                      <Box
                        sx={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          px: 1.5,
                          py: 0.5,
                          borderRadius: '99px',
                          bgcolor: member.role === 'officer' ? '#E0F2FE' : '#FEF9C3',
                          border: `1px solid ${member.role === 'officer' ? '#0369A120' : '#854D0E20'}`
                        }}
                      >
                        <Typography sx={{
                          fontSize: 12,
                          fontWeight: 800,
                          color: member.role === 'officer' ? '#0369A1' : '#854D0E',
                          fontFamily: fontStack,
                          textTransform: 'capitalize'
                        }}>
                          {member.role === 'officer' ? 'Officer' : 'Student'}
                        </Typography>
                      </Box>
                    </Box>
                  );
                })
              )
            )}
          </Box>

          {/* Footer Section */}
          <Box sx={{ p: 2, px: 3, borderTop: '1px solid #F2F4F7', display: 'flex', gap: 1.5, bgcolor: '#FFF' }}>
            <Button
              fullWidth
              variant="contained"
              disabled={isExporting || loadingMembers || members.length === 0}
              onClick={() => {
                setIsExporting(true);
                const headers = ["Full Name", "Email", "Role", "Joined Date"];
                const csvRows = [
                  headers.join(","),
                  ...members.map(m => {
                    const user = m.userId || {};
                    return [
                      `"${user.fullName || ''}"`,
                      `"${user.email || ''}"`,
                      `"${m.role || 'Student'}"`,
                      `"${m.joinedAt ? new Date(m.joinedAt).toLocaleDateString() : ''}"`
                    ].join(",");
                  })
                ].join("\n");

                try {
                  const blob = new Blob([csvRows], { type: 'text/csv;charset=utf-8;' });
                  const url = URL.createObjectURL(blob);
                  const link = document.body.appendChild(document.createElement("a"));
                  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
                  link.setAttribute("href", url);
                  link.setAttribute("download", `${targetOrgName.replace(/\s+/g, '_')}_Members_${timestamp}.csv`);
                  link.style.display = "none";
                  link.click();
                  document.body.removeChild(link);
                  URL.revokeObjectURL(url);
                } catch (error) {
                  console.error("Export failed:", error);
                } finally {
                  setTimeout(() => setIsExporting(false), 800);
                }
              }}
              sx={{
                bgcolor: COLORS.black,
                color: '#FFFFFF',
                borderRadius: '8px',
                textTransform: 'none',
                fontWeight: 700,
                fontSize: '0.95rem',
                fontFamily: fontStack,
                py: 1.5,
                px: 4,
                boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
                transition: 'all 0.3s ease',
                '&:hover': {
                  bgcolor: '#000',
                  transform: 'translateY(-2px)',
                },
                '&.Mui-disabled': {
                  bgcolor: COLORS.black,
                  opacity: 0.5,
                  color: '#FFFFFF'
                }
              }}
            >
              {isExporting ? (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                  <CircularProgress size={18} thickness={6} sx={{ color: '#FFF' }} />
                  <span>Exporting...</span>
                </Box>
              ) : (
                'Export List'
              )}
            </Button>
          </Box>
        </DialogContent>
      </Dialog>
    </Box>
  );
}
