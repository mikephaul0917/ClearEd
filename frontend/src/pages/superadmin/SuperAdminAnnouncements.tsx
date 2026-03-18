import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Typography,
  Button,
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
  FormControlLabel,
  InputLabel,
  Select,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Grid,
  LinearProgress,
  Skeleton,
  InputAdornment,
  FormHelperText,
  ToggleButton,
  ToggleButtonGroup,
  Checkbox,
  MenuItem
} from '@mui/material';
import {
  Notifications as NotificationsIcon,
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as VisibilityIcon,
  Schedule as ScheduleIcon,
  Warning as WarningIcon,
  Info as InfoIcon,
  Security as SecurityIcon,
  Build as BuildIcon,
  FilterList as FilterListIcon,
  Close as CloseIcon,
  Refresh as RefreshIcon,
  Preview as PreviewIcon,
  FormatBold as FormatBoldIcon,
  FormatItalic as FormatItalicIcon,
  FormatUnderlined as FormatUnderlinedIcon,
  Link as LinkIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  LocalOffer as LocalOfferIcon,
} from '@mui/icons-material';
import Swal from 'sweetalert2';
import { superAdminService } from '../../services';

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
interface Announcement {
  _id: string;
  title: string;
  content: string;
  type: 'maintenance' | 'policy' | 'security' | 'general' | 'urgent';
  priority: 'low' | 'medium' | 'high' | 'critical';
  targetAudience: 'all' | 'institutions' | 'students' | 'admins' | 'super_admin';
  targetInstitutions: any[];
  isActive: boolean;
  scheduledAt?: string;
  expiresAt?: string;
  createdBy: { _id: string; email: string; fullName: string };
  createdAt: string;
  updatedAt: string;
  viewCount: number;
  dismissCount: number;
  requiresAcknowledgment: boolean;
  attachments: string[];
  tags: string[];
  isCurrentlyActive?: boolean;
}

interface AnnouncementStats {
  total: number;
  active: number;
  scheduled: number;
  expired: number;
  byType: Array<{ _id: string; count: number }>;
  byPriority: Array<{ _id: string; count: number }>;
}

// ─── Priority helpers ────────────────────────────────────────────────────────
const getPriorityStyle = (p: Announcement['priority']) => {
  const map: Record<string, { bg: string; color: string; border: string }> = {
    critical: { bg: '#FEE2E2', color: '#991B1B', border: '#FCA5A5' },
    high: { bg: `${COLORS.orange}25`, color: '#9a3412', border: `${COLORS.orange}40` },
    medium: { bg: `${COLORS.yellow}60`, color: '#854D0E', border: `${COLORS.yellow}` },
    low: { bg: `${COLORS.teal}25`, color: '#065F46', border: `${COLORS.teal}40` },
  };
  return map[p] || { bg: '#F1F5F9', color: '#475569', border: '#D1D5DB' };
};

const getTypeIcon = (type: Announcement['type']) => {
  const iconSx = { fontSize: 16 };
  switch (type) {
    case 'maintenance': return <BuildIcon sx={{ ...iconSx, color: COLORS.lavender }} />;
    case 'policy': return <InfoIcon sx={{ ...iconSx, color: COLORS.teal }} />;
    case 'security': return <SecurityIcon sx={{ ...iconSx, color: COLORS.orange }} />;
    case 'urgent': return <WarningIcon sx={{ ...iconSx, color: '#dc2626' }} />;
    default: return <NotificationsIcon sx={{ ...iconSx, color: COLORS.textSecondary }} />;
  }
};

// ═════════════════════════════════════════════════════════════════════════════
// COMPONENT
// ═════════════════════════════════════════════════════════════════════════════
const SuperAdminAnnouncements: React.FC = () => {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [stats, setStats] = useState<AnnouncementStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [initialLoading, setInitialLoading] = useState(true);
  const [filterLoading, setFilterLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [filters, setFilters] = useState({ type: '', priority: '', status: '', targetAudience: '', search: '' });
  const [editingAnnouncement, setEditingAnnouncement] = useState<Announcement | null>(null);

  const [isMobile, setIsMobile] = useState(false);
  const [isTablet, setIsTablet] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 600);
      setIsTablet(window.innerWidth >= 600 && window.innerWidth < 960);
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Form data
  const [formData, setFormData] = useState({
    title: '', content: '',
    type: 'general' as Announcement['type'],
    priority: 'medium' as Announcement['priority'],
    targetAudience: 'all' as Announcement['targetAudience'],
    targetInstitutions: [] as string[],
    isActive: true, scheduledAt: '', expiresAt: '',
    requiresAcknowledgment: false, tags: [] as string[],
  });
  const [showPreview, setShowPreview] = useState(false);
  const [attachments, setAttachments] = useState<File[]>([]);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleFormatText = (format: 'bold' | 'italic' | 'underline', event?: React.MouseEvent) => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    if (event) event.preventDefault();
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selected = formData.content.substring(start, end);
    const wrap = format === 'bold' ? '**' : format === 'italic' ? '*' : '__';
    const formatted = `${wrap}${selected}${wrap}`;
    const newContent = formData.content.substring(0, start) + formatted + formData.content.substring(end);
    setFormData({ ...formData, content: newContent });
    setTimeout(() => { textarea.focus(); textarea.setSelectionRange(start + formatted.length, start + formatted.length); }, 50);
  };

  const handleFileAttachment = (event: React.ChangeEvent<HTMLInputElement>) => {
    setAttachments([...attachments, ...Array.from(event.target.files || [])]);
  };

  const removeAttachment = (index: number) => setAttachments(attachments.filter((_, i) => i !== index));

  // ─── Data fetching ─────────────────────────────────────────────────────────
  useEffect(() => { setTimeout(() => { fetchAnnouncements(); fetchStats(); }, 1000); }, []);
  useEffect(() => { setFilterLoading(true); setTimeout(() => { fetchAnnouncements(); }, 1000); }, [filters]);

  const fetchAnnouncements = async () => {
    try {
      const params: any = {};
      Object.entries(filters).forEach(([k, v]) => { if (v) params[k] = v; });
      const response = await superAdminService.getAnnouncements(params);
      setAnnouncements(response.data.announcements);
    } catch (error) {
      console.error('Error fetching announcements:', error);
      Swal.fire('Error', 'Failed to fetch announcements', 'error');
    } finally { setLoading(false); setInitialLoading(false); setFilterLoading(false); }
  };

  const fetchStats = async () => {
    try { const response = await superAdminService.getAnnouncementStats(); setStats(response.data); }
    catch (error) { console.error('Error fetching stats:', error); }
    finally { setInitialLoading(false); }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim()) { Swal.fire('Validation Error', 'Announcement title is required', 'error'); return; }
    if (!formData.content.trim()) { Swal.fire('Validation Error', 'Announcement content is required', 'error'); return; }
    try {
      const fd = new FormData();
      fd.append('title', formData.title); fd.append('content', formData.content);
      fd.append('type', formData.type); fd.append('priority', formData.priority);
      fd.append('targetAudience', formData.targetAudience); fd.append('isActive', formData.isActive.toString());
      if (formData.targetInstitutions.length > 0) fd.append('targetInstitutions', JSON.stringify(formData.targetInstitutions));
      if (formData.scheduledAt) fd.append('scheduledAt', formData.scheduledAt);
      if (formData.expiresAt) fd.append('expiresAt', formData.expiresAt);
      if (formData.tags.length > 0) fd.append('tags', JSON.stringify(formData.tags));
      fd.append('requiresAcknowledgment', formData.requiresAcknowledgment.toString());
      attachments.forEach((file) => { fd.append('files', file); });

      if (editingAnnouncement) {
        await superAdminService.updateAnnouncement(editingAnnouncement._id, fd);
        Swal.fire('Success', 'Announcement updated successfully', 'success');
      } else {
        await superAdminService.createAnnouncement(fd);
        Swal.fire('Success', 'Announcement created successfully', 'success');
      }
      setShowModal(false); resetForm(); fetchAnnouncements(); fetchStats();
    } catch (error: any) { Swal.fire('Error', error.response?.data?.message || 'Failed to save announcement', 'error'); }
  };

  const handleDelete = async (id: string) => {
    const result = await Swal.fire({ title: 'Are you sure?', text: 'This announcement will be permanently deleted.', icon: 'warning', showCancelButton: true, confirmButtonColor: '#d33', cancelButtonColor: '#3085d6', confirmButtonText: 'Delete' });
    if (result.isConfirmed) {
      try { await superAdminService.deleteAnnouncement(id); Swal.fire('Success', 'Announcement deleted', 'success'); fetchAnnouncements(); fetchStats(); }
      catch (error: any) { Swal.fire('Error', error.response?.data?.message || 'Failed to delete', 'error'); }
    }
  };

  const resetForm = () => {
    setFormData({ title: '', content: '', type: 'general', priority: 'medium', targetAudience: 'all', targetInstitutions: [], isActive: true, scheduledAt: '', expiresAt: '', requiresAcknowledgment: false, tags: [] });
    setAttachments([]); setEditingAnnouncement(null);
  };

  const openEditModal = (a: Announcement) => {
    setEditingAnnouncement(a);
    setFormData({ title: a.title, content: a.content, type: a.type, priority: a.priority, targetAudience: a.targetAudience, targetInstitutions: a.targetInstitutions.map((inst: any) => inst._id), isActive: a.isActive, scheduledAt: a.scheduledAt ? new Date(a.scheduledAt).toISOString().slice(0, 16) : '', expiresAt: a.expiresAt ? new Date(a.expiresAt).toISOString().slice(0, 16) : '', requiresAcknowledgment: a.requiresAcknowledgment, tags: a.tags });
    setShowModal(true);
  };

  const formatDate = (d?: string) => d ? new Date(d).toLocaleString() : 'Not set';

  // ─── Shared styles ─────────────────────────────────────────────────────────
  const selectSx = {
    fontFamily: fontStack, borderRadius: '12px',
    '& .MuiOutlinedInput-notchedOutline': { borderColor: COLORS.border },
    '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#94A3B8' },
    '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: COLORS.black },
  };

  // ═══════════════════════════════════════════════════════════════════════════
  // SKELETON
  // ═══════════════════════════════════════════════════════════════════════════
  if (initialLoading) {
    return (
      <Box sx={{ p: isMobile ? 2 : 4, backgroundColor: COLORS.pageBg, minHeight: '100vh', fontFamily: fontStack }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: isMobile ? 'flex-start' : 'center', mb: 3, flexDirection: isMobile ? 'column' : 'row', gap: isMobile ? 2 : 0 }}>
          <Box>
            <Skeleton variant="rounded" width={isMobile ? 180 : 320} height={isMobile ? 32 : 48} sx={{ mb: 1, borderRadius: '8px' }} />
            <Skeleton variant="rounded" width={isMobile ? 220 : 380} height={20} sx={{ borderRadius: '8px' }} />
          </Box>
          <Box sx={{ display: 'flex', gap: 1.5, width: isMobile ? '100%' : 'auto' }}>
            <Skeleton variant="rounded" width={isMobile ? '100%' : 160} height={42} sx={{ borderRadius: COLORS.pillRadius }} />
          </Box>
        </Box>

        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: 'repeat(2, 1fr)', md: 'repeat(4, 1fr)' }, gap: 2, mb: 3 }}>
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} variant="rounded" height={105} sx={{ borderRadius: COLORS.cardRadius }} />
          ))}
        </Box>

        <Box sx={{ borderRadius: COLORS.cardRadius, p: 3, backgroundColor: 'rgba(0,0,0,0.02)', border: `1px solid ${COLORS.border}`, mb: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <Skeleton variant="rounded" width={36} height={36} sx={{ borderRadius: '10px', mr: 1.5 }} />
            <Box><Skeleton variant="text" width={100} /><Skeleton variant="text" width={180} /></Box>
          </Box>
          <Box sx={{ display: 'flex', gap: 2 }}>
            {[1, 2, 3, 4].map((i) => <Skeleton key={i} variant="rounded" width={140} height={40} sx={{ borderRadius: '12px' }} />)}
          </Box>
        </Box>

        <Skeleton variant="rounded" height={400} sx={{ borderRadius: COLORS.cardRadius }} />
      </Box>
    );
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // MAIN RENDER
  // ═══════════════════════════════════════════════════════════════════════════
  return (
    <Box sx={{ p: isMobile ? 2 : 4, backgroundColor: COLORS.pageBg, minHeight: '100vh', fontFamily: fontStack }}>

      {/* ── Header ──────────────────────────────────────────────────── */}
      <Box sx={{
        display: 'flex', justifyContent: 'space-between',
        alignItems: isMobile ? 'flex-start' : 'center', mb: 3,
        flexDirection: isMobile ? 'column' : 'row', gap: isMobile ? 2 : 0,
      }}>
        <Box>
          <Typography sx={{
            fontFamily: fontStack, fontWeight: 800,
            fontSize: isMobile ? '1.5rem' : '2.25rem',
            letterSpacing: '-0.03em', color: COLORS.textPrimary, lineHeight: 1.15,
          }}>
            System Announcements
          </Typography>
          <Typography sx={{ fontFamily: fontStack, fontSize: isMobile ? 13 : 16, color: COLORS.textSecondary, mt: 0.5 }}>
            Manage platform-wide communications
          </Typography>
        </Box>
        <Button
          disableElevation startIcon={<AddIcon />}
          onClick={() => { resetForm(); setShowModal(true); }}
          fullWidth={isMobile}
          sx={{
            fontFamily: fontStack, fontWeight: 600, fontSize: 13,
            borderRadius: COLORS.pillRadius, textTransform: 'none',
            bgcolor: COLORS.black, color: '#FFFFFF', px: 3, py: 1.2,
            '&:hover': { bgcolor: '#222' },
          }}
        >
          {isMobile ? 'Create' : 'Create Announcement'}
        </Button>
      </Box>

      {/* ── Stats Bento Row ─────────────────────────────────────────── */}
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: 'repeat(2, 1fr)', md: 'repeat(4, 1fr)' }, gap: 2, mb: 3 }}>
        {[
          { label: 'Total', value: stats?.total || 0, accent: COLORS.teal, sub: 'All communications' },
          { label: 'Active', value: stats?.active || 0, accent: COLORS.lavender, sub: 'Live now' },
          { label: 'Scheduled', value: stats?.scheduled || 0, accent: COLORS.yellow, sub: 'Upcoming' },
          { label: 'Expired', value: stats?.expired || 0, accent: COLORS.orange, sub: 'Past' },
        ].map((stat) => (
          <Box key={stat.label} sx={{
            borderRadius: COLORS.cardRadius, p: isMobile ? 2 : 2.5,
            backgroundColor: `${stat.accent}${stat.accent === COLORS.yellow ? '30' : '12'}`,
            border: `1px solid ${stat.accent}20`,
          }}>
            <Box sx={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: stat.accent, mb: 1.5 }} />
            <Box sx={{ fontFamily: fontStack, fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: COLORS.textSecondary, mb: 0.5 }}>
              {stat.label}
            </Box>
            <Typography sx={{ fontFamily: fontStack, fontWeight: 800, fontSize: isMobile ? 22 : 28, color: COLORS.textPrimary, letterSpacing: '-1px' }}>
              {stat.value}
            </Typography>
            <Typography sx={{ fontFamily: fontStack, fontSize: 11, color: COLORS.textSecondary, mt: 0.5 }}>
              {stat.sub}
            </Typography>
          </Box>
        ))}
      </Box>

      {/* ── Filters ─────────────────────────────────────────────────── */}
      <Box sx={{
        borderRadius: COLORS.cardRadius, p: isMobile ? 2 : 3,
        backgroundColor: `${COLORS.lavender}08`, border: `1px solid ${COLORS.lavender}15`, mb: 3,
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <Box sx={{ width: 36, height: 36, borderRadius: '10px', backgroundColor: `${COLORS.lavender}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', mr: 1.5 }}>
            <FilterListIcon sx={{ fontSize: 18, color: COLORS.black }} />
          </Box>
          <Box>
            <Typography sx={{ fontFamily: fontStack, fontSize: 15, fontWeight: 700, color: COLORS.textPrimary, mb: 0.25 }}>Filters</Typography>
            <Typography sx={{ fontFamily: fontStack, fontSize: 12, color: COLORS.textSecondary }}>Filter by type, priority, or status</Typography>
          </Box>
        </Box>
        <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap', flexDirection: isMobile ? 'column' : 'row' }}>
          {[
            { label: 'Type', key: 'type', options: ['', 'maintenance', 'policy', 'security', 'general', 'urgent'], labels: ['All Types', 'Maintenance', 'Policy', 'Security', 'General', 'Urgent'] },
            { label: 'Priority', key: 'priority', options: ['', 'low', 'medium', 'high', 'critical'], labels: ['All Priorities', 'Low', 'Medium', 'High', 'Critical'] },
            { label: 'Status', key: 'status', options: ['', 'active', 'scheduled', 'expired'], labels: ['All Status', 'Active', 'Scheduled', 'Expired'] },
          ].map((f) => (
            <FormControl key={f.key} size="small" sx={{ minWidth: isMobile ? '100%' : 130 }}>
              <InputLabel sx={{ fontFamily: fontStack }}>{f.label}</InputLabel>
              <Select
                value={(filters as any)[f.key]}
                label={f.label}
                onChange={(e) => setFilters({ ...filters, [f.key]: e.target.value })}
                sx={selectSx}
                MenuProps={{ PaperProps: { sx: { borderRadius: '12px', mt: 1, fontFamily: fontStack } } }}
              >
                {f.options.map((o, i) => <MenuItem key={o} value={o}>{f.labels[i]}</MenuItem>)}
              </Select>
            </FormControl>
          ))}
          <Button
            onClick={() => setFilters({ type: '', priority: '', status: '', targetAudience: '', search: '' })}
            fullWidth={isMobile}
            sx={{
              fontFamily: fontStack, fontWeight: 600, fontSize: 13,
              textTransform: 'none', borderRadius: '12px',
              border: `1.5px solid ${COLORS.black}`, color: COLORS.black,
              ml: isMobile ? 0 : 'auto',
              '&:hover': { backgroundColor: '#f5f5f5' },
            }}
          >
            Clear
          </Button>
        </Box>
      </Box>

      {/* ── Announcements Table / Cards ─────────────────────────────── */}
      <Box sx={{
        borderRadius: COLORS.cardRadius, p: isMobile ? 2 : 3,
        backgroundColor: `${COLORS.teal}06`, border: `1px solid ${COLORS.teal}12`,
      }}>
        {filterLoading && !loading && <LinearProgress sx={{ mb: 2, borderRadius: 1 }} />}

        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2.5 }}>
          <Box sx={{ width: 36, height: 36, borderRadius: '10px', backgroundColor: `${COLORS.teal}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', mr: 1.5 }}>
            <NotificationsIcon sx={{ fontSize: 18, color: COLORS.black }} />
          </Box>
          <Box>
            <Typography sx={{ fontFamily: fontStack, fontSize: 15, fontWeight: 700, color: COLORS.textPrimary, mb: 0.25 }}>Announcements</Typography>
            <Typography sx={{ fontFamily: fontStack, fontSize: 12, color: COLORS.textSecondary }}>Manage all system announcements</Typography>
          </Box>
        </Box>

        {loading ? (
          <Box>
            {!isMobile ? (
              <TableContainer component={Paper} sx={{ borderRadius: '12px', border: `1px solid ${COLORS.border}`, boxShadow: 'none' }}>
                <Table>
                  <TableHead>
                    <TableRow sx={{ backgroundColor: '#F8FAFC' }}>
                      {[80, 60, 60, 80, 60, 80, 60].map((w, i) => (
                        <TableCell key={i}><Skeleton variant="rounded" width={`${w}%`} height={18} sx={{ borderRadius: '6px' }} /></TableCell>
                      ))}
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {[1, 2, 3, 4, 5].map((i) => (
                      <TableRow key={i}>
                        <TableCell>
                          <Skeleton variant="text" width="80%" height={20} />
                          <Skeleton variant="text" width="60%" height={16} />
                        </TableCell>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Skeleton variant="circular" width={16} height={16} sx={{ opacity: 0.5 }} />
                            <Skeleton variant="text" width={60} />
                          </Box>
                        </TableCell>
                        <TableCell><Skeleton variant="rectangular" width={60} height={20} sx={{ borderRadius: COLORS.pillRadius }} /></TableCell>
                        <TableCell><Skeleton variant="text" width={80} /></TableCell>
                        <TableCell><Skeleton variant="rectangular" width={60} height={20} sx={{ borderRadius: COLORS.pillRadius }} /></TableCell>
                        <TableCell><Skeleton variant="text" width={100} /></TableCell>
                        <TableCell align="right">
                          <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
                            <Skeleton variant="circular" width={28} height={28} />
                            <Skeleton variant="circular" width={28} height={28} />
                          </Box>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            ) : (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {[1, 2, 3].map((i) => (
                  <Box key={i} sx={{ p: 2, borderRadius: '12px', border: `1px solid ${COLORS.border}`, backgroundColor: 'rgba(255,255,255,0.4)' }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                      <Box sx={{ flex: 1 }}><Skeleton variant="text" width="70%" height={24} /><Skeleton variant="text" width="90%" /></Box>
                      <Box sx={{ display: 'flex', gap: 1 }}><Skeleton variant="circular" width={24} height={24} /><Skeleton variant="circular" width={24} height={24} /></Box>
                    </Box>
                    <Box sx={{ display: 'flex', gap: 1 }}><Skeleton variant="rectangular" width={60} height={20} sx={{ borderRadius: 10 }} /><Skeleton variant="rectangular" width={60} height={20} sx={{ borderRadius: 10 }} /></Box>
                  </Box>
                ))}
              </Box>
            )}
          </Box>
        ) : (
          <>
            {/* Desktop Table */}
            {!isMobile && (
              <TableContainer component={Paper} sx={{ borderRadius: '12px', border: `1px solid ${COLORS.border}`, boxShadow: 'none' }}>
                <Table>
                  <TableHead>
                    <TableRow sx={{ backgroundColor: '#F8FAFC' }}>
                      {['Title', 'Type', 'Priority', 'Audience', 'Status', 'Created', 'Actions'].map((h) => (
                        <TableCell key={h} align={h === 'Actions' ? 'right' : 'left'} sx={{
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
                    {announcements.map((a) => {
                      const ps = getPriorityStyle(a.priority);
                      return (
                        <TableRow key={a._id} sx={{
                          transition: 'background-color 0.15s ease',
                          '&:hover': { backgroundColor: 'rgba(0,0,0,0.015)' },
                          '& td': { fontFamily: fontStack, fontSize: 14, borderBottom: `1px solid ${COLORS.border}`, py: 2 },
                        }}>
                          <TableCell>
                            <Typography sx={{ fontFamily: fontStack, fontWeight: 600, fontSize: 14, color: COLORS.textPrimary }}>{a.title}</Typography>
                            <Typography sx={{ fontFamily: fontStack, fontSize: 12, color: COLORS.textSecondary }}>{a.content.substring(0, 80)}...</Typography>
                          </TableCell>
                          <TableCell>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                              {getTypeIcon(a.type)}
                              <Typography sx={{ fontFamily: fontStack, fontSize: 13, color: COLORS.textPrimary, textTransform: 'capitalize' }}>{a.type}</Typography>
                            </Box>
                          </TableCell>
                          <TableCell>
                            <Chip label={a.priority} size="small" sx={{
                              fontFamily: fontStack, borderRadius: COLORS.pillRadius, fontWeight: 700, fontSize: 10, textTransform: 'uppercase',
                              backgroundColor: ps.bg, color: ps.color, border: `1px solid ${ps.border}`,
                            }} />
                          </TableCell>
                          <TableCell>
                            <Typography sx={{ fontFamily: fontStack, fontSize: 13, color: COLORS.textPrimary, textTransform: 'capitalize' }}>
                              {a.targetAudience === 'all' ? 'All Users' : a.targetAudience?.replace('_', ' ')}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Chip label={a.isActive ? 'Active' : 'Inactive'} size="small" sx={{
                              fontFamily: fontStack, borderRadius: COLORS.pillRadius, fontWeight: 700, fontSize: 10, textTransform: 'uppercase',
                              backgroundColor: a.isActive ? `${COLORS.teal}25` : '#F1F5F9',
                              color: a.isActive ? '#065f46' : COLORS.textSecondary,
                              border: `1px solid ${a.isActive ? `${COLORS.teal}40` : COLORS.border}`,
                            }} />
                          </TableCell>
                          <TableCell>
                            <Typography sx={{ fontFamily: fontStack, fontSize: 13, color: COLORS.textSecondary }}>{formatDate(a.createdAt)}</Typography>
                          </TableCell>
                          <TableCell align="right">
                            <Box sx={{ display: 'flex', gap: 0.5, justifyContent: 'flex-end' }}>
                              <IconButton size="small" onClick={() => openEditModal(a)} sx={{ color: COLORS.black }}><EditIcon fontSize="small" /></IconButton>
                              <IconButton size="small" onClick={() => handleDelete(a._id)} sx={{ color: '#DC2626' }}><DeleteIcon fontSize="small" /></IconButton>
                            </Box>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </TableContainer>
            )}

            {/* Mobile Cards */}
            {isMobile && (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {announcements.map((a) => {
                  const ps = getPriorityStyle(a.priority);
                  return (
                    <Box key={a._id} sx={{
                      p: 2, borderRadius: '12px',
                      backgroundColor: 'rgba(255,255,255,0.6)', border: `1px solid ${COLORS.border}`,
                    }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1.5 }}>
                        <Box sx={{ flex: 1, minWidth: 0, mr: 1 }}>
                          <Typography sx={{ fontFamily: fontStack, fontWeight: 700, fontSize: 14, color: COLORS.textPrimary, mb: 0.5, lineHeight: 1.3 }}>{a.title}</Typography>
                          <Typography sx={{ fontFamily: fontStack, fontSize: 12, color: COLORS.textSecondary, lineHeight: 1.3 }}>{a.content.substring(0, 80)}...</Typography>
                        </Box>
                        <Box sx={{ display: 'flex', gap: 0.5, flexShrink: 0 }}>
                          <IconButton size="small" onClick={() => openEditModal(a)} sx={{ color: COLORS.black, p: 0.5 }}><EditIcon sx={{ fontSize: 16 }} /></IconButton>
                          <IconButton size="small" onClick={() => handleDelete(a._id)} sx={{ color: '#DC2626', p: 0.5 }}><DeleteIcon sx={{ fontSize: 16 }} /></IconButton>
                        </Box>
                      </Box>
                      <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', flexWrap: 'wrap' }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          {getTypeIcon(a.type)}
                          <Typography sx={{ fontFamily: fontStack, fontSize: 11, color: COLORS.textPrimary, textTransform: 'capitalize' }}>{a.type}</Typography>
                        </Box>
                        <Chip label={a.priority} size="small" sx={{
                          fontFamily: fontStack, borderRadius: COLORS.pillRadius, fontWeight: 700, fontSize: 9, textTransform: 'uppercase', height: 20,
                          backgroundColor: ps.bg, color: ps.color, border: `1px solid ${ps.border}`,
                        }} />
                        <Chip label={a.isActive ? 'Active' : 'Inactive'} size="small" sx={{
                          fontFamily: fontStack, borderRadius: COLORS.pillRadius, fontWeight: 700, fontSize: 9, textTransform: 'uppercase', height: 20,
                          backgroundColor: a.isActive ? `${COLORS.teal}25` : '#F1F5F9',
                          color: a.isActive ? '#065f46' : COLORS.textSecondary,
                        }} />
                      </Box>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1.5 }}>
                        <Typography sx={{ fontFamily: fontStack, fontSize: 11, color: COLORS.textPrimary, textTransform: 'capitalize' }}>
                          {a.targetAudience === 'all' ? 'All Users' : a.targetAudience?.replace('_', ' ')}
                        </Typography>
                        <Typography sx={{ fontFamily: fontStack, fontSize: 11, color: COLORS.textSecondary }}>
                          {new Date(a.createdAt).toLocaleDateString()}
                        </Typography>
                      </Box>
                    </Box>
                  );
                })}
              </Box>
            )}
          </>
        )}
      </Box>

      {/* ═══ CREATE / EDIT DIALOG ═════════════════════════════════════ */}
      <Dialog
        open={showModal} onClose={() => setShowModal(false)}
        maxWidth={isMobile ? 'sm' : 'lg'} fullWidth fullScreen={isMobile}
        PaperProps={{
          component: 'form', onSubmit: handleSubmit,
          sx: { borderRadius: isMobile ? 0 : COLORS.cardRadius, maxHeight: isMobile ? '100vh' : '90vh', m: isMobile ? 0 : 2 },
        }}
      >
        <DialogTitle sx={{ pb: 2, px: isMobile ? 2 : 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <Box sx={{ width: 36, height: 36, borderRadius: '10px', backgroundColor: editingAnnouncement ? `${COLORS.lavender}18` : `${COLORS.teal}18`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {editingAnnouncement ? <EditIcon sx={{ fontSize: 18, color: COLORS.lavender }} /> : <AddIcon sx={{ fontSize: 18, color: COLORS.teal }} />}
              </Box>
              <Typography sx={{ fontFamily: fontStack, fontWeight: 800, fontSize: isMobile ? 18 : 22, color: COLORS.textPrimary, letterSpacing: '-0.02em' }}>
                {editingAnnouncement ? 'Edit Announcement' : 'Create Announcement'}
              </Typography>
            </Box>
            <IconButton onClick={() => setShowModal(false)} sx={{ color: COLORS.textSecondary }}><CloseIcon /></IconButton>
          </Box>
        </DialogTitle>

        <DialogContent sx={{ pt: 1, px: isMobile ? 2 : 3 }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
            <Grid container spacing={2.5}>
              {/* Title */}
              <Grid item xs={12}>
                <TextField fullWidth label="Announcement Title" required value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Enter a clear, descriptive title"
                  error={!formData.title.trim()} helperText={!formData.title.trim() ? 'Required' : ''}
                  sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px', fontFamily: fontStack }, '& .MuiInputLabel-root': { fontFamily: fontStack, backgroundColor: '#FFFFFF', px: 0.5 } }}
                />
              </Grid>

              {/* Content */}
              <Grid item xs={12}>
                <TextField inputRef={textareaRef} fullWidth label="Content" required multiline rows={5}
                  value={formData.content} onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  placeholder="Provide detailed information..."
                  error={!formData.content.trim()} helperText={!formData.content.trim() ? 'Required' : ''}
                  sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px', fontFamily: fontStack }, '& .MuiInputLabel-root': { fontFamily: fontStack, backgroundColor: '#FFFFFF', px: 0.5 } }}
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end" sx={{ alignSelf: 'flex-start', mt: 2 }}>
                        <Box sx={{ display: 'flex', gap: 0.5 }}>
                          <IconButton size="small" onClick={(e) => handleFormatText('bold', e)} title="Bold"><FormatBoldIcon sx={{ fontSize: 16 }} /></IconButton>
                          <IconButton size="small" onClick={(e) => handleFormatText('italic', e)} title="Italic"><FormatItalicIcon sx={{ fontSize: 16 }} /></IconButton>
                          <IconButton size="small" onClick={(e) => handleFormatText('underline', e)} title="Underline"><FormatUnderlinedIcon sx={{ fontSize: 16 }} /></IconButton>
                          <IconButton size="small" component="label" title="Attach"><input type="file" multiple hidden onChange={handleFileAttachment} /><LinkIcon sx={{ fontSize: 16 }} /></IconButton>
                        </Box>
                      </InputAdornment>
                    )
                  }}
                />
                <FormHelperText sx={{ fontFamily: fontStack, ml: 2 }}>**bold**, *italic*, __underline__</FormHelperText>
                {attachments.length > 0 && (
                  <Box sx={{ mt: 1.5, p: 2, backgroundColor: `${COLORS.teal}08`, borderRadius: '12px', border: `1px solid ${COLORS.teal}15` }}>
                    <Typography sx={{ fontFamily: fontStack, fontWeight: 700, fontSize: 12, color: COLORS.textPrimary, mb: 1 }}>Attached ({attachments.length})</Typography>
                    {attachments.map((file, i) => (
                      <Box key={i} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', p: 1, borderRadius: '8px', backgroundColor: '#fff', mb: 0.5 }}>
                        <Typography sx={{ fontFamily: fontStack, fontSize: 12, color: COLORS.textPrimary }}>{file.name} ({(file.size / 1024).toFixed(1)} KB)</Typography>
                        <IconButton size="small" onClick={() => removeAttachment(i)} sx={{ color: '#DC2626' }}><CloseIcon sx={{ fontSize: 14 }} /></IconButton>
                      </Box>
                    ))}
                  </Box>
                )}
              </Grid>

              {/* Type */}
              <Grid item xs={12} sm={6}>
                <Typography sx={{ fontFamily: fontStack, fontWeight: 700, fontSize: 13, color: COLORS.textPrimary, mb: 1 }}>Type</Typography>
                <ToggleButtonGroup value={formData.type} exclusive onChange={(_, v) => v && setFormData({ ...formData, type: v })}
                  sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, '& .MuiToggleButtonGroup-grouped': { m: 0, border: 0, borderRadius: COLORS.pillRadius, '&.Mui-selected': { backgroundColor: COLORS.black, color: '#FFFFFF', '&:hover': { backgroundColor: '#222' } } } }}
                >
                  {['general', 'maintenance', 'policy', 'security', 'urgent'].map((t) => (
                    <ToggleButton key={t} value={t} sx={{ fontFamily: fontStack, fontSize: 11, px: 1.5, py: 0.5, border: `1px solid ${COLORS.border}`, textTransform: 'capitalize' }}>{t}</ToggleButton>
                  ))}
                </ToggleButtonGroup>
              </Grid>

              {/* Priority */}
              <Grid item xs={12} sm={6}>
                <Typography sx={{ fontFamily: fontStack, fontWeight: 700, fontSize: 13, color: COLORS.textPrimary, mb: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
                  Priority
                  <Box sx={{ width: 10, height: 10, borderRadius: '50%', backgroundColor: formData.priority === 'critical' ? '#DC2626' : formData.priority === 'high' ? COLORS.orange : formData.priority === 'medium' ? '#d97706' : COLORS.teal }} />
                </Typography>
                <ToggleButtonGroup value={formData.priority} exclusive onChange={(_, v) => v && setFormData({ ...formData, priority: v })}
                  sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, '& .MuiToggleButtonGroup-grouped': { m: 0, border: 0, borderRadius: COLORS.pillRadius } }}
                >
                  {[
                    { v: 'low', bg: COLORS.teal }, { v: 'medium', bg: '#d97706' }, { v: 'high', bg: COLORS.orange }, { v: 'critical', bg: '#DC2626' },
                  ].map((p) => (
                    <ToggleButton key={p.v} value={p.v} sx={{
                      fontFamily: fontStack, fontSize: 11, px: 1.5, py: 0.5, border: `1px solid ${COLORS.border}`, textTransform: 'capitalize',
                      '&.Mui-selected': { backgroundColor: p.bg, color: '#FFFFFF', '&:hover': { backgroundColor: p.bg, filter: 'brightness(0.9)' } },
                    }}>{p.v}</ToggleButton>
                  ))}
                </ToggleButtonGroup>
              </Grid>

              {/* Audience + Status */}
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth size="small">
                  <InputLabel sx={{ fontFamily: fontStack }}>Target Audience</InputLabel>
                  <Select value={formData.targetAudience} label="Target Audience" onChange={(e) => setFormData({ ...formData, targetAudience: e.target.value as Announcement['targetAudience'] })} sx={selectSx}>
                    <MenuItem value="all">All Users</MenuItem><MenuItem value="institutions">Institutions</MenuItem><MenuItem value="students">Students</MenuItem><MenuItem value="admins">Admins</MenuItem><MenuItem value="super_admin">Super Admin</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth size="small">
                  <InputLabel sx={{ fontFamily: fontStack }}>Publication Status</InputLabel>
                  <Select value={formData.isActive ? 'active' : 'inactive'} label="Publication Status" onChange={(e) => setFormData({ ...formData, isActive: e.target.value === 'active' })} sx={selectSx}>
                    <MenuItem value="active">Active — Publish Now</MenuItem><MenuItem value="inactive">Inactive — Draft</MenuItem>
                  </Select>
                </FormControl>
              </Grid>

              {/* Schedule + Expiry */}
              <Grid item xs={12} sm={6}>
                <TextField fullWidth type="datetime-local" label="Schedule (Optional)" size="small" value={formData.scheduledAt}
                  onChange={(e) => setFormData({ ...formData, scheduledAt: e.target.value })} helperText="Leave empty for immediate"
                  InputLabelProps={{ shrink: true, sx: { fontFamily: fontStack, backgroundColor: '#fff', px: 0.5 } }}
                  sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px', fontFamily: fontStack } }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField fullWidth type="datetime-local" label="Expires (Optional)" size="small" value={formData.expiresAt}
                  onChange={(e) => setFormData({ ...formData, expiresAt: e.target.value })} helperText="Leave empty for no expiry"
                  InputLabelProps={{ shrink: true, sx: { fontFamily: fontStack, backgroundColor: '#fff', px: 0.5 } }}
                  sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px', fontFamily: fontStack } }}
                />
              </Grid>

              {/* Tags */}
              <Grid item xs={12}>
                <TextField fullWidth label="Tags (Optional)" size="small" value={formData.tags.join(', ')}
                  onChange={(e) => setFormData({ ...formData, tags: e.target.value.split(',').map(t => t.trim()).filter(t => t) })}
                  placeholder="maintenance, update, important" helperText="Comma-separated"
                  sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px', fontFamily: fontStack }, '& .MuiInputLabel-root': { fontFamily: fontStack } }}
                />
              </Grid>

              {/* Acknowledgment */}
              <Grid item xs={12}>
                <Box sx={{ p: 2, borderRadius: '12px', backgroundColor: `${COLORS.yellow}20`, border: `1px solid ${COLORS.yellow}40`, cursor: 'pointer', '&:hover': { backgroundColor: `${COLORS.yellow}30` } }}>
                  <FormControlLabel
                    control={<Checkbox checked={formData.requiresAcknowledgment} onChange={(e) => setFormData({ ...formData, requiresAcknowledgment: e.target.checked })} sx={{ mr: 1 }} />}
                    label="Require User Acknowledgment"
                    sx={{ '& .MuiFormControlLabel-label': { fontFamily: fontStack, fontWeight: 600, fontSize: 13, color: COLORS.textPrimary } }}
                  />
                  <Typography sx={{ fontFamily: fontStack, fontSize: 11, color: COLORS.textSecondary, ml: 4 }}>Users must acknowledge before dismissing</Typography>
                </Box>
              </Grid>
            </Grid>
          </Box>
        </DialogContent>

        <DialogActions sx={{ px: 3, py: 2.5, borderTop: `1px solid ${COLORS.border}` }}>
          <Button onClick={() => setShowPreview(true)} startIcon={<PreviewIcon />}
            sx={{ fontFamily: fontStack, fontWeight: 600, fontSize: 13, textTransform: 'none', borderRadius: '12px', border: `1.5px solid ${COLORS.black}`, color: COLORS.black, mr: 'auto', '&:hover': { backgroundColor: '#f5f5f5' } }}
          >Preview</Button>
          <Button onClick={() => setShowModal(false)}
            sx={{ fontFamily: fontStack, fontWeight: 600, fontSize: 13, textTransform: 'none', borderRadius: '12px', border: `1.5px solid ${COLORS.border}`, color: COLORS.textSecondary, '&:hover': { backgroundColor: '#f5f5f5' } }}
          >Cancel</Button>
          <Button type="submit" disableElevation disabled={!formData.title.trim() || !formData.content.trim()}
            sx={{
              fontFamily: fontStack, fontWeight: 600, fontSize: 13, textTransform: 'none',
              borderRadius: COLORS.pillRadius, bgcolor: COLORS.black, color: '#FFFFFF', px: 3,
              '&:hover': { bgcolor: '#222' }, '&.Mui-disabled': { bgcolor: '#d1d5db', color: '#9ca3af' },
            }}
          >{editingAnnouncement ? 'Update' : 'Publish'}</Button>
        </DialogActions>
      </Dialog>

      {/* ═══ PREVIEW DIALOG ═══════════════════════════════════════════ */}
      <Dialog open={showPreview} onClose={() => setShowPreview(false)} maxWidth="md" fullWidth
        PaperProps={{ sx: { borderRadius: COLORS.cardRadius, maxHeight: '80vh', m: 2 } }}
      >
        <DialogTitle sx={{ pb: 2, px: 3, borderBottom: `1px solid ${COLORS.border}` }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <Box sx={{ width: 36, height: 36, borderRadius: '10px', backgroundColor: `${COLORS.lavender}18`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <PreviewIcon sx={{ fontSize: 18, color: COLORS.lavender }} />
              </Box>
              <Typography sx={{ fontFamily: fontStack, fontWeight: 800, fontSize: 20, color: COLORS.textPrimary, letterSpacing: '-0.02em' }}>Preview</Typography>
            </Box>
            <IconButton onClick={() => setShowPreview(false)} sx={{ color: COLORS.textSecondary }}><CloseIcon /></IconButton>
          </Box>
        </DialogTitle>
        <DialogContent sx={{ px: 3, py: 3 }}>
          <Box sx={{ p: 3, borderRadius: '12px', border: `1px solid ${COLORS.border}`, backgroundColor: '#FAFBFC' }}>
            <Typography sx={{ fontFamily: fontStack, fontWeight: 800, fontSize: 22, color: COLORS.textPrimary, mb: 1.5, letterSpacing: '-0.02em' }}>
              {formData.title || 'Untitled Announcement'}
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'wrap', mb: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>{getTypeIcon(formData.type)}<Typography sx={{ fontFamily: fontStack, fontSize: 12, color: COLORS.textSecondary, textTransform: 'capitalize' }}>{formData.type}</Typography></Box>
              {(() => { const ps = getPriorityStyle(formData.priority); return <Chip label={formData.priority} size="small" sx={{ fontFamily: fontStack, borderRadius: COLORS.pillRadius, fontWeight: 700, fontSize: 10, textTransform: 'uppercase', backgroundColor: ps.bg, color: ps.color, border: `1px solid ${ps.border}` }} />; })()}
              <Typography sx={{ fontFamily: fontStack, fontSize: 12, color: COLORS.textSecondary }}>Target: {formData.targetAudience === 'all' ? 'All Users' : formData.targetAudience?.replace('_', ' ')}</Typography>
            </Box>
            <Typography sx={{ fontFamily: fontStack, fontSize: 14, lineHeight: 1.7, color: COLORS.textPrimary, whiteSpace: 'pre-wrap', mb: 3 }}>
              {formData.content || 'No content provided...'}
            </Typography>
            <Box sx={{ pt: 2, borderTop: `1px solid ${COLORS.border}`, display: 'flex', flexDirection: 'column', gap: 0.5 }}>
              {formData.scheduledAt && <Typography sx={{ fontFamily: fontStack, fontSize: 12, color: COLORS.textSecondary }}>📅 Scheduled: {formatDate(formData.scheduledAt)}</Typography>}
              {formData.expiresAt && <Typography sx={{ fontFamily: fontStack, fontSize: 12, color: COLORS.textSecondary }}>⏰ Expires: {formatDate(formData.expiresAt)}</Typography>}
              {formData.requiresAcknowledgment && <Typography sx={{ fontFamily: fontStack, fontSize: 12, color: COLORS.textSecondary }}>✅ Requires acknowledgment</Typography>}
              {formData.tags.length > 0 && <Typography sx={{ fontFamily: fontStack, fontSize: 12, color: COLORS.textSecondary }}>🏷️ {formData.tags.join(', ')}</Typography>}
              {attachments.length > 0 && <Typography sx={{ fontFamily: fontStack, fontSize: 12, color: COLORS.textSecondary }}>📎 {attachments.length} file(s)</Typography>}
            </Box>
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2, borderTop: `1px solid ${COLORS.border}` }}>
          <Button onClick={() => setShowPreview(false)} disableElevation
            sx={{ fontFamily: fontStack, fontWeight: 600, fontSize: 13, textTransform: 'none', borderRadius: COLORS.pillRadius, bgcolor: COLORS.black, color: '#FFFFFF', px: 3, '&:hover': { bgcolor: '#222' } }}
          >Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default SuperAdminAnnouncements;
