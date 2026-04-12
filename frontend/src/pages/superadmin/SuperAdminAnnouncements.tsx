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
  CalendarMonth as CalendarMonthIcon,
  PeopleAlt as PeopleAltIcon,
  Email as EmailIcon,
  History as HistoryIcon,
  Tune as TuneIcon,
  Badge as BadgeIcon,
  AttachFile as AttachFileIcon,
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import Swal from 'sweetalert2';
import { superAdminService } from '../../services';

// ─── Modern Bento Design System ──────────────────────────────────────────────
const COLORS = {
  pageBg: '#F9FAFB',
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

const fontStack = '"Google Sans", "Product Sans", Roboto, sans-serif';

// ─── Types ───────────────────────────────────────────────────────────────────
interface Announcement {
  _id: string;
  title: string;
  content: string;
  type: 'maintenance' | 'policy' | 'security' | 'general' | 'urgent';
  priority: 'low' | 'medium' | 'high' | 'critical' | 'urgent';
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

const getAnnouncementDate = (d: string) => {
  const date = new Date(d);
  const today = new Date();
  const isToday = date.toDateString() === today.toDateString();

  const month = date.toLocaleDateString('en-US', { month: 'short' }).toUpperCase();
  const day = date.toLocaleDateString('en-US', { day: '2-digit' });
  const year = date.getFullYear().toString();
  const time = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });

  if (isToday) {
    return { day: 'Today', month: time, year: '', isToday: true };
  }

  return { day, month, year, isToday: false };
};

const getTypeStyle = (type: Announcement['type']) => {
  const iconSx = { fontSize: 13 };
  const styles: Record<string, { bg: string, color: string, icon: any, label: string }> = {
    maintenance: { bg: '#F5F3FF', color: '#7E22CE', icon: <BuildIcon sx={iconSx} />, label: 'Maintenance' },
    policy: { bg: '#F0FDFA', color: '#0F766E', icon: <InfoIcon sx={iconSx} />, label: 'Policy' },
    general: { bg: '#F8FAFC', color: '#444', icon: <NotificationsIcon sx={iconSx} />, label: 'News' },
  };
  return styles[type] || styles.general;
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
  const [institutions, setInstitutions] = useState<any[]>([]);

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
    sendEmail: false,
  });
  const [showPreview, setShowPreview] = useState(false);
  const [attachments, setAttachments] = useState<File[]>([]);
  const contentRef = useRef<HTMLTextAreaElement>(null);

  const handleFormatText = (type: 'bold' | 'italic', e: React.MouseEvent) => {
    e.preventDefault();
    const textarea = contentRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = formData.content;
    const before = text.substring(0, start);
    const selection = text.substring(start, end);
    const after = text.substring(end);

    const wrapper = type === 'bold' ? '**' : '*';
    const wrapped = `${wrapper}${selection}${wrapper}`;
    const newContent = before + wrapped + after;

    setFormData({ ...formData, content: newContent });

    // Re-focus and keep selection
    setTimeout(() => {
      textarea.focus();
      const offset = wrapper.length;
      textarea.setSelectionRange(start + offset, end + offset);
    }, 0);
  };

  const renderContent = (text: string) => {
    if (!text) return 'No content provided.';
    let html = text
      .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
      .replace(/\*\*(.*?)\*\*/g, '<b>$1</b>')
      .replace(/\*(.*?)\*/g, '<i>$1</i>')
      .replace(/\n/g, '<br/>');
    return <span dangerouslySetInnerHTML={{ __html: html }} />;
  };

  const handleFileAttachment = (event: React.ChangeEvent<HTMLInputElement>) => {
    setAttachments([...attachments, ...Array.from(event.target.files || [])]);
  };

  const removeAttachment = (index: number) => setAttachments(attachments.filter((_, i) => i !== index));

  // ─── Data fetching ─────────────────────────────────────────────────────────
  useEffect(() => {
    setTimeout(() => {
      fetchAnnouncements();
      fetchStats();
      fetchInstitutions();
    }, 1000);
  }, []);
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

  const fetchInstitutions = async () => {
    try {
      const response = await superAdminService.getInstitutions('approved');
      setInstitutions(response.institutions || []);
    } catch (error) {
      console.error('Error fetching institutions:', error);
    }
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
      fd.append('sendEmail', formData.sendEmail.toString());
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
    setFormData({ title: '', content: '', type: 'general', priority: 'medium', targetAudience: 'all', targetInstitutions: [], isActive: true, scheduledAt: '', expiresAt: '', requiresAcknowledgment: false, tags: [], sendEmail: false });
    setAttachments([]); setEditingAnnouncement(null);
  };

  const openEditModal = (a: Announcement) => {
    setEditingAnnouncement(a);
    setFormData({ title: a.title, content: a.content, type: a.type, priority: a.priority, targetAudience: a.targetAudience, targetInstitutions: a.targetInstitutions.map((inst: any) => inst._id), isActive: a.isActive, scheduledAt: a.scheduledAt ? new Date(a.scheduledAt).toISOString().slice(0, 16) : '', expiresAt: a.expiresAt ? new Date(a.expiresAt).toISOString().slice(0, 16) : '', requiresAcknowledgment: a.requiresAcknowledgment, tags: a.tags, sendEmail: false });
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
      <Box sx={{ px: isMobile ? 2 : 4, pb: isMobile ? 2 : 4, pt: isMobile ? 1 : 2, backgroundColor: COLORS.pageBg, minHeight: '100vh', fontFamily: fontStack }}>
        <Box sx={{ maxWidth: '900px', mx: 'auto', width: '100%' }}>
          {/* Header Skeleton */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: isMobile ? 'flex-start' : 'center', mb: 3, flexDirection: isMobile ? 'column' : 'row', gap: isMobile ? 2 : 0 }}>
            <Box>
              <Skeleton variant="rounded" width={isMobile ? 180 : 320} height={isMobile ? 32 : 48} sx={{ mb: 1.5, borderRadius: '8px' }} />
              <Skeleton variant="rounded" width={isMobile ? 140 : 240} height={20} sx={{ borderRadius: '8px' }} />
            </Box>
            <Skeleton variant="rounded" width={isMobile ? '100%' : 180} height={42} sx={{ borderRadius: COLORS.pillRadius }} />
          </Box>

          {/* Tabs Skeleton */}
          <Box sx={{ display: 'flex', gap: 4, mb: 5, pb: 1.5, borderBottom: `1px solid ${COLORS.border}` }}>
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} variant="rounded" width={60} height={20} sx={{ borderRadius: '4px' }} />
            ))}
          </Box>

          {/* List Skeleton */}
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: { xs: 2.5, sm: 4 } }}>
            {[1, 2, 3, 4, 5].map((i) => (
              <Box key={i} sx={{
                display: 'flex',
                flexDirection: { xs: 'column', sm: 'row' },
                gap: { xs: 1.5, sm: 5 },
                p: { xs: 2.5, sm: 3 },
                borderRadius: '24px',
                bgcolor: '#FFFFFF',
                border: `1px solid #f1f5f9`,
                boxShadow: '0 4px 15px rgba(0,0,0,0.03)',
              }}>
                {/* Mobile Header Row Skeleton */}
                {isMobile && (
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Skeleton variant="text" width={100} height={18} />
                    <Skeleton variant="circular" width={24} height={24} />
                  </Box>
                )}

                {/* Simulated Date Block (Desktop Only) */}
                {!isMobile && (
                  <Box sx={{ width: 70, flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <Skeleton variant="text" width="60%" height={12} />
                    <Skeleton variant="text" width="80%" height={32} />
                  </Box>
                )}

                {/* Simulated Content Block */}
                <Box sx={{ flex: 1 }}>
                  <Skeleton variant="text" width="60%" height={24} sx={{ mb: 1.5 }} />
                  <Skeleton variant="text" width="95%" height={16} />
                  <Skeleton variant="text" width="85%" height={16} />

                  {/* Pills Shimmer */}
                  <Box sx={{ display: 'flex', gap: 1, mt: 2.5 }}>
                    <Skeleton variant="rounded" width={80} height={24} sx={{ borderRadius: '8px' }} />
                    <Skeleton variant="rounded" width={100} height={24} sx={{ borderRadius: '8px' }} />
                  </Box>
                </Box>
              </Box>
            ))}
          </Box>
        </Box>
      </Box>
    );
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // MAIN RENDER
  return (
    <Box sx={{ px: isMobile ? 2 : 4, pb: isMobile ? 2 : 4, pt: isMobile ? 1 : 2, backgroundColor: COLORS.pageBg, minHeight: '100vh', fontFamily: fontStack }}>
      <Box sx={{ maxWidth: '900px', mx: 'auto', width: '100%' }}>

        {/* ── Header ──────────────────────────────────────────────────── */}
        <Box sx={{
          display: 'flex', justifyContent: 'space-between',
          alignItems: isMobile ? 'flex-start' : 'center', mb: 3,
          flexDirection: isMobile ? 'column' : 'row', gap: isMobile ? 2 : 0,
        }}>
          <Box>
            <Typography sx={{
              fontFamily: fontStack, fontWeight: 800,
              fontSize: isMobile ? '1.25rem' : '2.25rem',
              letterSpacing: '-0.03em', color: COLORS.textPrimary, lineHeight: 1.15,
            }}>
              System Announcements
            </Typography>
            <Typography sx={{ fontFamily: fontStack, fontSize: isMobile ? 11 : 14, color: COLORS.textSecondary, mt: 0.5 }}>
              Manage platform-wide communications
            </Typography>
          </Box>
          <Button
            disableElevation startIcon={<AddIcon sx={{ fontSize: 18 }} />}
            onClick={() => { resetForm(); setShowModal(true); }}
            sx={{
              fontFamily: fontStack, fontWeight: 700, fontSize: 13,
              borderRadius: '100px', textTransform: 'none',
              bgcolor: COLORS.black, color: '#FFFFFF', px: isMobile ? 2.5 : 3, py: 1.5,
              minWidth: isMobile ? 'auto' : 160,
              boxShadow: '0 10px 25px rgba(0,0,0,0.12)',
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              '&:hover': {
                bgcolor: '#111',
                transform: 'translateY(-2px)',
                boxShadow: '0 15px 35px rgba(0,0,0,0.2)',
              },
              '&:active': {
                transform: 'translateY(0)',
                boxShadow: '0 5px 15px rgba(0,0,0,0.1)',
              }
            }}
          >
            {isMobile ? 'Create' : 'Create Announcement'}
          </Button>
        </Box>

        {/* ── Tabs Navigation ────────────────────────────────────────── */}
        <Box sx={{ borderBottom: `1px solid ${COLORS.border}`, mb: 5, display: 'flex', gap: { xs: 2.5, sm: 4 }, overflowX: 'auto', px: { xs: 1, sm: 0 }, '&::-webkit-scrollbar': { display: 'none' } }}>
          {[
            { label: 'All', value: '', color: COLORS.black },
            { label: 'News', value: 'general', color: getTypeStyle('general').color },
            { label: 'Policy', value: 'policy', color: getTypeStyle('policy').color },
            { label: 'Maintenance', value: 'maintenance', color: getTypeStyle('maintenance').color },
          ].map((tab) => {
            const active = filters.type === tab.value;
            const activeColor = tab.color;
            return (
              <Box
                key={tab.label}
                onClick={() => setFilters({ ...filters, type: tab.value })}
                sx={{
                  position: 'relative',
                  pb: 1.5,
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  color: active ? activeColor : '#94A3B8',
                  '&:hover': { color: activeColor }
                }}
              >
                <Typography sx={{ fontFamily: fontStack, fontWeight: active ? 700 : 500, fontSize: 13, whiteSpace: 'nowrap' }}>
                  {tab.label}
                </Typography>
                {active && (
                  <motion.div
                    layoutId="tabUnderline"
                    style={{
                      position: 'absolute',
                      bottom: 0,
                      left: 0,
                      right: 0,
                      height: '2.5px',
                      backgroundColor: activeColor,
                      borderRadius: '2px'
                    }}
                  />
                )}
              </Box>
            );
          })}
        </Box>

        {/* ── Main List ───────────────────────────────────────────────── */}
        <Box sx={{ width: '100%' }}>
          {loading || filterLoading ? (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              {[1, 2, 3, 4, 5].map((i) => (
                <Box key={i} sx={{ display: 'flex', gap: { xs: 2.5, sm: 5 }, p: 2 }}>
                  <Box sx={{ width: { xs: 60, sm: 70 }, flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <Skeleton variant="text" width="60%" height={12} />
                    <Skeleton variant="text" width="80%" height={32} />
                    <Skeleton variant="text" width="40%" height={10} />
                  </Box>
                  <Box sx={{ flex: 1 }}>
                    <Skeleton variant="text" width="60%" height={24} sx={{ mb: 1.5 }} />
                    <Skeleton variant="text" width="95%" height={16} />
                    <Skeleton variant="text" width="85%" height={16} />
                    <Box sx={{ display: 'flex', gap: 1, mt: 2.5 }}>
                      <Skeleton variant="rounded" width={80} height={24} sx={{ borderRadius: '8px' }} />
                      <Skeleton variant="rounded" width={100} height={24} sx={{ borderRadius: '8px' }} />
                    </Box>
                  </Box>
                </Box>
              ))}
            </Box>
          ) : announcements.length === 0 ? (
            <Box sx={{ textAlign: 'center', py: 10 }}>
              <NotificationsIcon sx={{ fontSize: 48, color: '#E2E8F0', mb: 2 }} />
              <Typography sx={{ fontFamily: fontStack, color: COLORS.textSecondary, fontWeight: 600 }}>No announcements found</Typography>
            </Box>
          ) : (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              {announcements.map((a) => {
                const { day, month, year, isToday } = getAnnouncementDate(a.createdAt);
                const typeStyle = getTypeStyle(a.type);

                return (
                  <Box
                    key={a._id}
                    sx={{
                      display: 'flex',
                      flexDirection: { xs: 'column', sm: 'row' },
                      gap: { xs: 2.5, sm: 5 },
                      position: 'relative',
                      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                      p: { xs: 2.5, sm: 3 },
                      borderRadius: '24px',
                      bgcolor: '#FFFFFF',
                      border: `1px solid #f1f5f9`,
                      boxShadow: '0 4px 15px rgba(0,0,0,0.02)',
                      '&:hover': {
                        boxShadow: '0 12px 30px rgba(0,0,0,0.06)',
                        transform: 'translateY(-2px)'
                      }
                    }}
                  >
                    {/* Mobile Card Header (Date + Actions) */}
                    {isMobile && (
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                            <Typography sx={{ fontFamily: fontStack, fontSize: 10, fontWeight: 800, color: '#94A3B8', textTransform: 'uppercase' }}>{month}</Typography>
                            <Typography sx={{ fontFamily: fontStack, fontSize: 13, fontWeight: 900, color: COLORS.black }}>{day}</Typography>
                          </Box>
                          <Box sx={{ width: 4, height: 4, borderRadius: '50%', bgcolor: '#E2E8F0' }} />
                          <Box sx={{
                            display: 'flex', alignItems: 'center', gap: 0.5, px: 1, py: 0.25,
                            borderRadius: '6px', bgcolor: typeStyle.bg, color: typeStyle.color,
                            border: `1px solid ${typeStyle.color}15`
                          }}>
                            {typeStyle.icon}
                            <Typography sx={{ fontFamily: fontStack, fontSize: 10, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.02em' }}>
                              {typeStyle.label}
                            </Typography>
                          </Box>
                        </Box>
                        <Box sx={{ display: 'flex', gap: 1 }}>
                          <IconButton size="small" onClick={() => openEditModal(a)} sx={{ bgcolor: '#fff', border: '1px solid #f1f5f9', boxShadow: '0 2px 6px rgba(0,0,0,0.04)', color: '#64748B' }}><EditIcon sx={{ fontSize: 14 }} /></IconButton>
                          <IconButton size="small" onClick={() => handleDelete(a._id)} sx={{ bgcolor: '#fff', border: '1px solid #f1f5f9', boxShadow: '0 2px 6px rgba(0,0,0,0.04)', color: '#64748B' }}><DeleteIcon sx={{ fontSize: 14 }} /></IconButton>
                        </Box>
                      </Box>
                    )}

                    {/* Desktop Date Block */}
                    {!isMobile && (
                      <Box sx={{
                        width: 70,
                        flexShrink: 0,
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'flex-start',
                        pt: 0.5
                      }}>
                        <Typography sx={{
                          fontFamily: fontStack,
                          fontSize: isToday ? 11 : 12,
                          fontWeight: 800,
                          color: isToday ? '#2563EB' : '#94A3B8',
                          textTransform: 'uppercase',
                          letterSpacing: '0.05em',
                          lineHeight: 1
                        }}>
                          {month}
                        </Typography>
                        <Typography sx={{
                          fontFamily: fontStack,
                          fontSize: isToday ? 15 : 28,
                          fontWeight: 900,
                          color: isToday ? '#2563EB' : COLORS.black,
                          lineHeight: 1.1,
                          mt: 0.5
                        }}>
                          {day}
                        </Typography>
                        {!isToday && (
                          <Typography sx={{
                            fontFamily: fontStack,
                            fontSize: 11,
                            fontWeight: 700,
                            color: '#CBD5E1',
                            mt: 0.2
                          }}>
                            {year}
                          </Typography>
                        )}
                      </Box>
                    )}

                    {/* Vertical Timeline Divider */}
                    <Box sx={{
                      width: '1px',
                      bgcolor: COLORS.border,
                      my: 1,
                      display: { xs: 'none', sm: 'block' },
                      opacity: 0.6
                    }} />

                    {/* Content Block */}
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Box sx={{ mb: isMobile ? 1 : 1.5 }}>
                        <Typography sx={{
                          fontFamily: fontStack,
                          fontSize: { xs: 17, sm: 19 },
                          fontWeight: 800,
                          color: COLORS.black,
                          lineHeight: 1.3,
                          letterSpacing: '-0.01em',
                          mb: 0.25
                        }}>
                          {a.title}
                        </Typography>
                        <Typography sx={{
                          fontFamily: fontStack,
                          fontSize: isMobile ? 13 : 14,
                          color: COLORS.textSecondary,
                          lineHeight: isMobile ? 1.5 : 1.6,
                          display: '-webkit-box',
                          WebkitLineClamp: isMobile ? 2 : 3,
                          WebkitBoxOrient: 'vertical',
                          overflow: 'hidden'
                        }}>
                          {a.content}
                        </Typography>
                      </Box>

                      {/* Meta info Pills */}
                      <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', flexWrap: 'wrap' }}>
                        {/* Type Pill - Desktop Only (Mobile integrated in header) */}
                        {!isMobile && (
                          <Box sx={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 0.75,
                            px: 1.25,
                            py: 0.5,
                            borderRadius: '8px',
                            bgcolor: typeStyle.bg,
                            color: typeStyle.color,
                            border: `1px solid ${typeStyle.color}15`
                          }}>
                            {typeStyle.icon}
                            <Typography sx={{
                              fontFamily: fontStack,
                              fontSize: 10,
                              fontWeight: 800,
                              textTransform: 'uppercase',
                              letterSpacing: '0.03em'
                            }}>
                              {typeStyle.label}
                            </Typography>
                          </Box>
                        )}

                        {/* Audience Pill */}
                        <Box sx={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 0.75,
                          px: 1.25,
                          py: 0.5,
                          borderRadius: '8px',
                          bgcolor: '#F8FAFC',
                          color: '#64748B',
                          border: '1px solid #E2E8F0'
                        }}>
                          <PeopleAltIcon sx={{ fontSize: 13 }} />
                          <Typography sx={{
                            fontFamily: fontStack,
                            fontSize: 10,
                            fontWeight: 700,
                            textTransform: 'uppercase',
                            letterSpacing: '0.03em'
                          }}>
                            {a.targetAudience === 'all' ? 'All Users' : a.targetAudience?.replace('_', ' ')}
                          </Typography>
                        </Box>

                        {/* Status/Priority if needed */}
                        {a.priority === 'urgent' && (
                          <Box sx={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 0.5,
                            px: 1,
                            py: 0.25,
                            borderRadius: '4px',
                            bgcolor: '#FEF2F2',
                            color: '#DC2626'
                          }}>
                            <Typography sx={{ fontFamily: fontStack, fontSize: 9, fontWeight: 900, textTransform: 'uppercase' }}>
                              Urgent
                            </Typography>
                          </Box>
                        )}
                      </Box>
                    </Box>

                    {/* Action Buttons */}
                    <Box sx={{
                      position: 'absolute',
                      top: 24,
                      right: 24,
                      display: { xs: 'none', md: 'flex' },
                      gap: 1.5,
                    }}>
                      <Tooltip title="Edit">
                        <IconButton
                          size="small"
                          onClick={() => openEditModal(a)}
                          sx={{
                            color: '#64748B',
                            bgcolor: '#FFF',
                            boxShadow: '0 4px 12px rgba(0,0,0,0.06)',
                            border: `1px solid #f1f5f9`,
                            p: 1.25,
                            '&:hover': { bgcolor: '#F8FAFC', color: '#2563EB', transform: 'translateY(-2px)' },
                            transition: 'all 0.2s ease'
                          }}
                        >
                          <EditIcon sx={{ fontSize: 16 }} />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Delete">
                        <IconButton
                          size="small"
                          onClick={() => handleDelete(a._id)}
                          sx={{
                            color: '#64748B',
                            bgcolor: '#FFF',
                            boxShadow: '0 4px 12px rgba(0,0,0,0.06)',
                            border: `1px solid #f1f5f9`,
                            p: 1.25,
                            '&:hover': { bgcolor: '#FEF2F2', color: '#EF4444', border: '1px solid #FEE2E2', transform: 'translateY(-2px)' },
                            transition: 'all 0.2s ease'
                          }}
                        >
                          <DeleteIcon sx={{ fontSize: 18 }} />
                        </IconButton>
                      </Tooltip>
                    </Box>

                    {/* Mobile Actions (Removed from absolute to integrated in Card Header) */}
                  </Box>
                );
              })}
            </Box>
          )}
        </Box>

        {/* ═══ CREATE / EDIT DIALOG ═════════════════════════════════════ */}
        {/* ═══ CREATE / EDIT DIALOG (PREMIUM BENTO REDESIGN) ══════════════ */}
        <Dialog
          open={showModal} onClose={() => setShowModal(false)}
          maxWidth="sm" fullWidth fullScreen={isMobile}
          PaperProps={{
            component: 'form', onSubmit: handleSubmit,
            sx: {
              borderRadius: isMobile ? 0 : '32px',
              maxWidth: isMobile ? '100%' : '720px !important',
              maxHeight: isMobile ? '100vh' : '90vh',
              m: isMobile ? 0 : 2,
              boxShadow: '0 25px 50px -12px rgba(0,0,0,0.15)',
              overflow: 'hidden'
            },
          }}
        >
          {/* Modal Header (Minimalist) */}
          <Box sx={{ p: isMobile ? 2.5 : 4, pb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <Box>
              <Typography sx={{ fontFamily: fontStack, fontWeight: 800, fontSize: isMobile ? 24 : 32, color: COLORS.textPrimary, letterSpacing: '-0.04em', lineHeight: 1.1 }}>
                {editingAnnouncement ? 'Edit Announcement' : 'New Announcement'}
              </Typography>
              <Typography sx={{ fontFamily: fontStack, fontSize: 13, color: '#94a3b8', fontWeight: 400, mt: 0.5 }}>
                Configure system alerts and broadcast notifications.
              </Typography>
            </Box>
            <IconButton onClick={() => setShowModal(false)} sx={{ color: '#94a3b8', mt: -1, '&:hover': { bgcolor: '#f1f5f9' } }}><CloseIcon /></IconButton>
          </Box>

          <DialogContent sx={{ px: isMobile ? 2.5 : 4, py: 1, '&::-webkit-scrollbar': { width: '4px' }, '&::-webkit-scrollbar-thumb': { backgroundColor: '#f1f5f9', borderRadius: '10px' } }}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>

              {/* 1. CORE Section */}
              <Box>
                <Typography sx={{ fontFamily: fontStack, fontWeight: 700, fontSize: 10, color: '#94a3b8', textTransform: 'uppercase', mb: 2 }}>
                  Basic Details
                </Typography>
                <Grid container spacing={3}>
                  <Grid item xs={12} sm={6}>
                    <Typography sx={{ fontFamily: fontStack, fontWeight: 600, fontSize: 13, color: COLORS.textPrimary, mb: 1.25 }}>
                      Headline
                    </Typography>
                    <TextField
                      fullWidth required
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      placeholder="Announcement title"
                      variant="outlined"
                      sx={{
                        '& .MuiOutlinedInput-root': { borderRadius: '10px', fontFamily: fontStack, border: '1px solid #f1f5f9' },
                        '& .MuiInputBase-input': { p: 1.5, fontSize: 14 }
                      }}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography sx={{ fontFamily: fontStack, fontWeight: 600, fontSize: 13, color: COLORS.textPrimary, mb: 1.25 }}>
                      Category
                    </Typography>
                    <FormControl fullWidth size="small">
                      <Select
                        value={formData.type}
                        onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
                        sx={{ ...selectSx, height: 42, borderRadius: '10px', border: '1px solid #f1f5f9' }}
                      >
                        <MenuItem value="general">News</MenuItem>
                        <MenuItem value="policy">Policy</MenuItem>
                        <MenuItem value="maintenance">Maintenance</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                </Grid>
              </Box>

              {/* 2. RECIPIENTS Minimalist Section */}
              <Box>
                <Typography sx={{ fontFamily: fontStack, fontWeight: 700, fontSize: 10, color: '#94a3b8', textTransform: 'uppercase', mb: 2 }}>
                  Target Recipients
                </Typography>
                <Box sx={{
                  p: 2.5, borderRadius: '14px', border: '1px solid #f1f5f9',
                  bgcolor: '#ffffff', display: 'flex', alignItems: 'center', gap: 3
                }}>
                  <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', gap: 2 }}>
                    <PeopleAltIcon sx={{ color: '#94a3b8', fontSize: 20 }} />
                    <Box>
                      <Typography sx={{ fontFamily: fontStack, fontWeight: 700, fontSize: 15, color: COLORS.textPrimary }}>
                        {formData.targetAudience === 'all' ? 'All Institutions' : `Target: ${formData.targetAudience?.replace('_', ' ')}`}
                      </Typography>
                      <Typography sx={{ fontFamily: fontStack, fontSize: 12, color: '#CBD5E1' }}>
                        Notification will be visible to selected targets.
                      </Typography>
                    </Box>
                  </Box>
                  <FormControl size="small" sx={{ minWidth: 160 }}>
                    <Select
                      multiple displayEmpty
                      value={formData.targetInstitutions}
                      onChange={(e) => setFormData({ ...formData, targetInstitutions: typeof e.target.value === 'string' ? e.target.value.split(',') : e.target.value })}
                      renderValue={(selected) => selected.length === 0 ? 'All' : `${selected.length} Institutions`}
                      sx={{ ...selectSx, height: 38, borderRadius: '8px' }}
                    >
                      {institutions.map((inst) => (
                        <MenuItem key={inst._id} value={inst._id}>
                          <Checkbox checked={formData.targetInstitutions.indexOf(inst._id) > -1} size="small" />
                          <Typography sx={{ fontFamily: fontStack, fontSize: 13 }}>{inst.name}</Typography>
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Box>
              </Box>

              {/* 3. SCHEDULING Section */}
              <Box>
                <Typography sx={{ fontFamily: fontStack, fontWeight: 700, fontSize: 10, color: '#94a3b8', textTransform: 'uppercase', mb: 2 }}>
                  Schedule & Importance
                </Typography>
                <Grid container spacing={3}>
                  <Grid item xs={12} sm={4}>
                    <Typography sx={{ fontFamily: fontStack, fontWeight: 600, fontSize: 13, color: COLORS.textPrimary, mb: 1.25 }}>
                      Priority
                    </Typography>
                    <FormControl fullWidth size="small">
                      <Select
                        value={formData.priority}
                        onChange={(e) => setFormData({ ...formData, priority: e.target.value as any })}
                        sx={{ ...selectSx, height: 42, borderRadius: '10px' }}
                      >
                        <MenuItem value="low">Low</MenuItem>
                        <MenuItem value="medium">Medium</MenuItem>
                        <MenuItem value="high">High</MenuItem>
                        <MenuItem value="urgent">Urgent</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>

                  <Grid item xs={12} sm={4}>
                    <Typography sx={{ fontFamily: fontStack, fontWeight: 600, fontSize: 13, color: COLORS.textPrimary, mb: 1.25 }}>
                      Post On
                    </Typography>
                    <TextField
                      fullWidth type="datetime-local" size="small"
                      value={formData.scheduledAt}
                      onChange={(e) => setFormData({ ...formData, scheduledAt: e.target.value })}
                      InputLabelProps={{ shrink: true }}
                      sx={{ '& .MuiOutlinedInput-root': { borderRadius: '10px', fontFamily: fontStack } }}
                    />
                  </Grid>

                  <Grid item xs={12} sm={4}>
                    <Typography sx={{ fontFamily: fontStack, fontWeight: 600, fontSize: 13, color: COLORS.textPrimary, mb: 1.25 }}>
                      Expire On
                    </Typography>
                    <TextField
                      fullWidth type="datetime-local" size="small"
                      value={formData.expiresAt}
                      onChange={(e) => setFormData({ ...formData, expiresAt: e.target.value })}
                      InputLabelProps={{ shrink: true }}
                      sx={{ '& .MuiOutlinedInput-root': { borderRadius: '10px', fontFamily: fontStack } }}
                    />
                  </Grid>
                </Grid>
              </Box>

              {/* 4. CONTENT Minimalist Section */}
              <Box>
                <Typography sx={{ fontFamily: fontStack, fontWeight: 700, fontSize: 10, color: '#94a3b8', textTransform: 'uppercase', mb: 2 }}>
                  Message Content
                </Typography>
                <Box sx={{ border: '1px solid #f1f5f9', borderRadius: '14px', overflow: 'hidden' }}>
                  <Box sx={{ px: 2, py: 1, borderBottom: '1px solid #f1f5f9', display: 'flex', gap: 1 }}>
                    <IconButton size="small" onClick={(e) => handleFormatText('bold', e)}><FormatBoldIcon sx={{ fontSize: 16 }} /></IconButton>
                    <IconButton size="small" onClick={(e) => handleFormatText('italic', e)}><FormatItalicIcon sx={{ fontSize: 16 }} /></IconButton>
                    <Box sx={{ width: 1, height: 14, bgcolor: '#f1f5f9', mx: 0.5, alignSelf: 'center' }} />
                    <IconButton size="small" component="label">
                      <input type="file" multiple hidden onChange={handleFileAttachment} />
                      <AttachFileIcon sx={{ fontSize: 16 }} />
                    </IconButton>
                  </Box>
                  <TextField
                    fullWidth multiline rows={4}
                    inputRef={contentRef}
                    value={formData.content}
                    onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                    placeholder="Main message content..."
                    sx={{
                      '& .MuiOutlinedInput-root': { border: 'none', '& fieldset': { border: 'none' } },
                      '& .MuiInputBase-input': { fontFamily: fontStack, fontSize: 14, p: 2.5 }
                    }}
                  />
                </Box>
              </Box>

              {/* 5. DELIVERY Minimalist Section */}
              <Box sx={{ mb: 1 }}>
                <Typography sx={{ fontFamily: fontStack, fontWeight: 700, fontSize: 10, color: '#94a3b8', textTransform: 'uppercase', mb: 2 }}>
                  Delivery Channels
                </Typography>
                <Box sx={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', gap: isMobile ? 1 : 5 }}>
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={formData.isActive}
                        onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                        size="small" sx={{ color: '#94a3b8', '&.Mui-checked': { color: '#0E7490' } }}
                      />
                    }
                    label={<Typography sx={{ fontFamily: fontStack, fontSize: 13, fontWeight: 600, color: formData.isActive ? '#0E7490' : '#475569' }}>In-app Popup</Typography>}
                  />
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={formData.sendEmail}
                        onChange={(e) => setFormData({ ...formData, sendEmail: e.target.checked })}
                        size="small" sx={{ color: '#94a3b8', '&.Mui-checked': { color: '#0E7490' } }}
                      />
                    }
                    label={<Typography sx={{ fontFamily: fontStack, fontSize: 13, fontWeight: 600, color: formData.sendEmail ? '#0E7490' : '#475569' }}>Email Notification</Typography>}
                  />
                </Box>
              </Box>
            </Box>
          </DialogContent>

          <DialogActions sx={{ p: isMobile ? 2.5 : 4, pt: 1, display: 'flex', flexDirection: isMobile ? 'column-reverse' : 'row', gap: 2 }}>
            <Button
              onClick={() => setShowModal(false)}
              fullWidth={isMobile}
              sx={{
                fontFamily: fontStack, fontWeight: 600, color: '#94a3b8', textTransform: 'none',
                fontSize: 14, py: 1.5, borderRadius: '12px', flex: 1,
                '&:hover': { bgcolor: '#F8FAFC' }
              }}
            >
              Cancel
            </Button>
            <Button
              type="submit" disableElevation
              fullWidth={isMobile}
              disabled={!formData.title.trim() || !formData.content.trim()}
              sx={{
                bgcolor: '#1E293B', color: '#fff', borderRadius: '12px', py: 1.5, flex: 2,
                textTransform: 'none', fontWeight: 700, fontFamily: fontStack, fontSize: 14,
                '&:hover': { bgcolor: '#0F172A' },
                '&.Mui-disabled': { bgcolor: '#f1f5f9', color: '#CBD5E1' }
              }}
            >
              {editingAnnouncement ? 'Finalize & Update' : 'Broadcast Announcement'}
            </Button>
          </DialogActions>
        </Dialog>

        {/* ═══ PREVIEW DIALOG ═══════════════════════════════════════════ */}
        <Dialog open={showPreview} onClose={() => setShowPreview(false)} maxWidth="sm" fullWidth
          fullScreen={isMobile}
          PaperProps={{
            sx: {
              borderRadius: isMobile ? 0 : '32px',
              maxWidth: isMobile ? '100%' : '720px !important',
              maxHeight: isMobile ? '100vh' : '85vh',
              m: isMobile ? 0 : 2,
              overflow: 'hidden'
            }
          }}
        >
          <Box sx={{ p: isMobile ? 2.5 : 4, pb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <Box>
              <Typography sx={{ fontFamily: fontStack, fontWeight: 800, fontSize: isMobile ? 22 : 28, color: COLORS.textPrimary, letterSpacing: '-0.03em' }}>
                Quick Preview
              </Typography>
              <Typography sx={{ fontFamily: fontStack, fontSize: 13, color: '#94a3b8', fontWeight: 400 }}>
                Live appearance for recipients.
              </Typography>
            </Box>
            <IconButton onClick={() => setShowPreview(false)} sx={{ color: '#94a3b8', '&:hover': { bgcolor: '#f1f5f9' } }}><CloseIcon /></IconButton>
          </Box>

          <DialogContent sx={{ px: isMobile ? 2.5 : 4, py: 2 }}>
            <Box sx={{ p: isMobile ? 2.5 : 3.5, borderRadius: isMobile ? '0' : '20px', border: isMobile ? 'none' : '1px solid #f1f5f9', backgroundColor: '#FFFFFF' }}>
              <Typography sx={{ fontFamily: fontStack, fontWeight: 800, fontSize: isMobile ? 20 : 24, color: COLORS.textPrimary, mb: 2, letterSpacing: '-0.03em', lineHeight: 1.2 }}>
                {formData.title || 'Untitled Announcement'}
              </Typography>

              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'wrap', mb: 4 }}>
                {/* Type Pill */}
                <Box sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 0.75,
                  px: 1.25,
                  py: 0.5,
                  borderRadius: '8px',
                  bgcolor: getTypeStyle(formData.type).bg,
                  color: getTypeStyle(formData.type).color,
                  border: `1px solid ${getTypeStyle(formData.type).color}15`
                }}>
                  {getTypeStyle(formData.type).icon}
                  <Typography sx={{ fontFamily: fontStack, fontSize: 10, fontWeight: 800, textTransform: 'uppercase' }}>
                    {getTypeStyle(formData.type).label}
                  </Typography>
                </Box>

                {/* Priority Pill */}
                {(() => {
                  const ps = getPriorityStyle(formData.priority);
                  return (
                    <Chip
                      label={formData.priority}
                      size="small"
                      sx={{
                        fontFamily: fontStack,
                        borderRadius: '8px',
                        fontWeight: 700,
                        fontSize: 10,
                        textTransform: 'uppercase',
                        backgroundColor: ps.bg,
                        color: ps.color,
                        border: `1px solid ${ps.border}`
                      }}
                    />
                  );
                })()}

                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, px: 1.25, py: 0.5, borderRadius: '8px', bgcolor: '#F8FAFC', color: '#64748B', border: '1px solid #E2E8F0' }}>
                  <PeopleAltIcon sx={{ fontSize: 13 }} />
                  <Typography sx={{ fontFamily: fontStack, fontSize: 10, fontWeight: 700, textTransform: 'uppercase' }}>
                    Target: {formData.targetAudience === 'all' ? 'All Users' : formData.targetAudience?.replace('_', ' ')}
                  </Typography>
                </Box>
              </Box>

              <Typography sx={{
                fontFamily: fontStack, fontSize: 15, color: COLORS.textSecondary,
                lineHeight: 1.7, whiteSpace: 'pre-wrap', mb: 4
              }}>
                {renderContent(formData.content)}
              </Typography>

              <Box sx={{ pt: 3, borderTop: `1px solid ${COLORS.border}`, display: 'flex', flexDirection: 'column', gap: 1 }}>
                {formData.scheduledAt && (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <CalendarMonthIcon sx={{ fontSize: 14, color: '#94a3b8' }} />
                    <Typography sx={{ fontFamily: fontStack, fontSize: 12, color: COLORS.textSecondary }}>Planned for {formatDate(formData.scheduledAt)}</Typography>
                  </Box>
                )}
                {formData.expiresAt && (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <HistoryIcon sx={{ fontSize: 14, color: '#94a3b8' }} />
                    <Typography sx={{ fontFamily: fontStack, fontSize: 12, color: COLORS.textSecondary }}>Expires on {formatDate(formData.expiresAt)}</Typography>
                  </Box>
                )}
              </Box>
            </Box>
          </DialogContent>

          <DialogActions sx={{ p: isMobile ? 2.5 : 4, pt: 1, pb: isMobile ? 3 : 4 }}>
            <Button
              fullWidth onClick={() => setShowPreview(false)} disableElevation
              sx={{
                bgcolor: '#1E293B', color: '#fff', borderRadius: '12px', py: 1.5,
                textTransform: 'none', fontWeight: 700, fontFamily: fontStack, fontSize: 14,
                '&:hover': { bgcolor: '#0F172A' }
              }}
            >
              Close Preview
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </Box>
  );
};

export default SuperAdminAnnouncements;
