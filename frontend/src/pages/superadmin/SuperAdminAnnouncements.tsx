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

const fontStack = "'Inter', 'Plus Jakarta Sans', 'Montserrat', sans-serif";

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
  
  if (isToday) {
    return { part1: 'Today', part2: date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }) };
  }
  
  return { 
    part1: date.toLocaleDateString('en-US', { month: 'short', day: '2-digit' }), 
    part2: date.getFullYear().toString() 
  };
};

const getTypeIcon = (type: Announcement['type']) => {
  const iconSx = { fontSize: 16 };
  switch (type) {
    case 'maintenance': return <BuildIcon sx={{ ...iconSx, color: COLORS.lavender }} />;
    case 'policy': return <InfoIcon sx={{ ...iconSx, color: COLORS.teal }} />;
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
  return (
    <Box sx={{ p: isMobile ? 2 : 4, backgroundColor: COLORS.pageBg, minHeight: '100vh', fontFamily: fontStack }}>
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
            fontSize: isMobile ? '1.5rem' : '2.25rem',
            letterSpacing: '-0.03em', color: COLORS.textPrimary, lineHeight: 1.15,
          }}>
            System Announcements
          </Typography>
          <Typography sx={{ fontFamily: fontStack, fontSize: isMobile ? 12 : 14, color: COLORS.textSecondary, mt: 0.5 }}>
            Manage platform-wide communications
          </Typography>
        </Box>
        <Button
          disableElevation startIcon={<AddIcon />}
          onClick={() => { resetForm(); setShowModal(true); }}
          fullWidth={isMobile}
          sx={{
            fontFamily: fontStack, fontWeight: 700, fontSize: 13,
            borderRadius: COLORS.pillRadius, textTransform: 'none',
            bgcolor: COLORS.black, color: '#FFFFFF', px: 3, py: 1.2,
            '&:hover': { bgcolor: '#222' },
          }}
        >
          {isMobile ? 'Create' : 'Create Announcement'}
        </Button>
      </Box>

      {/* ── Tabs Navigation ────────────────────────────────────────── */}
      <Box sx={{ borderBottom: `1px solid ${COLORS.border}`, mb: 5, display: 'flex', gap: { xs: 2.5, sm: 4 }, overflowX: 'auto', px: { xs: 1, sm: 0 }, '&::-webkit-scrollbar': { display: 'none' } }}>
        {[
          { label: 'All', value: '' },
          { label: 'News', value: 'general' },
          { label: 'Policy', value: 'policy' },
          { label: 'Maintenance', value: 'maintenance' },
        ].map((tab) => {
          const active = filters.type === tab.value;
          return (
            <Box
              key={tab.label}
              onClick={() => setFilters({ ...filters, type: tab.value })}
              sx={{
                position: 'relative',
                pb: 1.5,
                cursor: 'pointer',
                transition: 'color 0.2s ease',
                color: active ? COLORS.black : '#94A3B8',
                '&:hover': { color: COLORS.black }
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
                    height: '2px',
                    backgroundColor: COLORS.black,
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
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {[1, 2, 3, 4, 5].map((i) => (
                <Box key={i} sx={{ display: 'flex', gap: { xs: 2, sm: 5 } }}>
                  <Box sx={{ width: { xs: 50, sm: 80 }, flexShrink: 0 }}>
                  <Skeleton variant="text" width="90%" height={16} />
                  <Skeleton variant="text" width="80%" height={16} />
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
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {announcements.map((a) => {
              const { part1, part2 } = getAnnouncementDate(a.createdAt);
              return (
                <Box 
                  key={a._id}
                  sx={{ 
                    display: 'flex', 
                    gap: { xs: 3, sm: 6 },
                    position: 'relative',
                    transition: 'opacity 0.2s ease',
                    '&:hover .action-buttons': { opacity: 1 }
                  }}
                >
                    {/* Date Block */}
                    <Box sx={{ 
                      width: { xs: 50, sm: 80 }, 
                      flexShrink: 0,
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'flex-start',
                      pt: 0.5
                    }}>
                    <Typography sx={{ 
                      fontFamily: fontStack, 
                      fontSize: 12, 
                      fontWeight: 700, 
                      color: '#94A3B8',
                      lineHeight: 1.2
                    }}>
                      {part1}
                    </Typography>
                    <Typography sx={{ 
                      fontFamily: fontStack, 
                      fontSize: 12, 
                      fontWeight: 700, 
                      color: '#94A3B8' 
                    }}>
                      {part2}
                    </Typography>
                  </Box>

                  {/* Content Block */}
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                      <Typography sx={{ 
                        fontFamily: fontStack, 
                        fontSize: { xs: 16, sm: 18 }, 
                        fontWeight: 800, 
                        color: COLORS.black,
                        lineHeight: 1.3
                      }}>
                        {a.title}
                      </Typography>
                    </Box>
                    <Typography sx={{ 
                      fontFamily: fontStack, 
                      fontSize: 13, 
                      color: '#64748B', 
                      lineHeight: 1.6,
                      display: '-webkit-box',
                      WebkitLineClamp: 3,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden',
                      mb: 1
                    }}>
                      {a.content}
                    </Typography>
                    
                    {/* Meta info & Chips */}
                    <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center', mt: 2 }}>
                       <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          {getTypeIcon(a.type)}
                          <Typography sx={{ fontFamily: fontStack, fontSize: 11, color: COLORS.textSecondary, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                            {a.type}
                          </Typography>
                       </Box>
                       <Box sx={{ width: 4, height: 4, borderRadius: '50%', bgcolor: '#CBD5E1' }} />
                       <Typography sx={{ fontFamily: fontStack, fontSize: 11, color: COLORS.textSecondary, fontWeight: 500 }}>
                          {(a.targetAudience === 'all' ? 'All Users' : a.targetAudience?.replace('_', ' ')).toUpperCase()}
                       </Typography>
                    </Box>
                  </Box>

                  {/* Hover Action Buttons */}
                  <Box className="action-buttons" sx={{ 
                    position: 'absolute', 
                    top: -4, 
                    right: -40, 
                    opacity: 0, 
                    display: { xs: 'none', md: 'flex' },
                    flexDirection: 'column',
                    gap: 0.5,
                    transition: 'all 0.2s ease',
                  }}>
                    <Tooltip title="Edit">
                      <IconButton size="small" onClick={() => openEditModal(a)} sx={{ color: COLORS.black, bgcolor: '#FFF', border: `1px solid ${COLORS.border}`, '&:hover': { bgcolor: '#F8FAFC' } }}>
                        <EditIcon sx={{ fontSize: 16 }} />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Delete">
                      <IconButton size="small" onClick={() => handleDelete(a._id)} sx={{ color: '#DC2626', bgcolor: '#FFF', border: `1px solid ${COLORS.border}`, '&:hover': { bgcolor: '#FEE2E2' } }}>
                        <DeleteIcon sx={{ fontSize: 16 }} />
                      </IconButton>
                    </Tooltip>
                  </Box>

                  {/* Mobile Actions */}
                  <Box sx={{ display: { xs: 'flex', md: 'none' }, gap: 1, position: 'absolute', top: 0, right: 0 }}>
                    <IconButton size="small" onClick={() => openEditModal(a)} sx={{ color: COLORS.black }}><EditIcon sx={{ fontSize: 16 }} /></IconButton>
                    <IconButton size="small" onClick={() => handleDelete(a._id)} sx={{ color: '#DC2626' }}><DeleteIcon sx={{ fontSize: 16 }} /></IconButton>
                  </Box>
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
        maxWidth="md" fullWidth fullScreen={isMobile}
        PaperProps={{
          component: 'form', onSubmit: handleSubmit,
          sx: { 
            borderRadius: isMobile ? 0 : '24px', 
            maxHeight: isMobile ? '100vh' : '90vh', 
            m: isMobile ? 0 : 2,
            boxShadow: '0 25px 50px -12px rgba(0,0,0,0.15)',
            overflow: 'hidden'
          },
        }}
      >
        {/* Modal Header */}
        <Box sx={{ p: 4, pb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
              <Typography sx={{ fontFamily: fontStack, fontWeight: 800, fontSize: 32, color: COLORS.textPrimary, letterSpacing: '-0.04em' }}>
                {formData.title || (editingAnnouncement ? 'Edit Announcement' : 'New Announcement')}
              </Typography>
              <Chip 
                label={formData.isActive ? 'Live' : 'Draft'} 
                size="small"
                sx={{ 
                  fontFamily: fontStack, fontWeight: 700, fontSize: 11, 
                  bgcolor: formData.isActive ? '#f1f5f9' : '#fff7ed',
                  color: formData.isActive ? '#475569' : '#c2410c',
                  border: '1px solid currentColor',
                  borderRadius: '6px', height: 22
                }}
              />
            </Box>
            <Typography sx={{ fontFamily: fontStack, fontSize: 13, color: '#94a3b8', fontWeight: 500 }}>
              Created: {editingAnnouncement ? new Date(editingAnnouncement.createdAt).toLocaleDateString() : new Date().toLocaleDateString()}
              {formData.expiresAt && `  •  Due: ${new Date(formData.expiresAt).toLocaleDateString()}`}
            </Typography>
          </Box>
          <IconButton onClick={() => setShowModal(false)} sx={{ color: '#94a3b8', mt: -1 }}><CloseIcon /></IconButton>
        </Box>

        <DialogContent sx={{ px: 4, py: 1, '&::-webkit-scrollbar': { display: 'none' } }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            
            <Grid container spacing={3}>
              <Grid item xs={12} sm={6}>
                <Typography sx={{ fontFamily: fontStack, fontWeight: 700, fontSize: 14, color: COLORS.textPrimary, mb: 1.5 }}>
                  Title
                </Typography>
                <TextField 
                  fullWidth label="Announcement Title" required 
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Enter title..."
                  variant="outlined"
                  sx={{ 
                    '& .MuiOutlinedInput-root': { borderRadius: '12px', fontFamily: fontStack, bgcolor: '#fcfcfc' },
                    '& .MuiInputLabel-root': { fontFamily: fontStack, fontSize: 13 }
                  }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography sx={{ fontFamily: fontStack, fontWeight: 700, fontSize: 14, color: COLORS.textPrimary, mb: 1.5 }}>
                  Category
                </Typography>
                <FormControl fullWidth size="small">
                  <Select 
                    value={formData.type} 
                    onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
                    sx={selectSx}
                  >
                    <MenuItem value="general">News & Updates</MenuItem>
                    <MenuItem value="policy">Policy & Rules</MenuItem>
                    <MenuItem value="maintenance">Maintenance</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
            </Grid>

            {/* 2. Recipients Section */}
            <Box sx={{ 
              p: 2.5, borderRadius: '16px', border: `1px solid ${COLORS.border}`, 
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              bgcolor: '#ffffff', transition: 'all 0.2s ease',
              '&:hover': { borderColor: COLORS.black, bgcolor: '#fafafa' }
            }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2.5 }}>
                <Box sx={{ 
                  width: 48, height: 48, borderRadius: '14px', bgcolor: '#f1f5f9', 
                  display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b' 
                }}>
                  <PeopleAltIcon />
                </Box>
                <Box>
                  <Typography sx={{ fontFamily: fontStack, fontWeight: 700, fontSize: 15, color: COLORS.textPrimary }}>
                    {formData.targetAudience === 'all' ? 'Add Recipients' : `Target: ${formData.targetAudience}`}
                  </Typography>
                  <Typography sx={{ fontFamily: fontStack, fontSize: 13, color: '#94a3b8', fontWeight: 500 }}>
                    {formData.targetInstitutions.length > 0 
                      ? `${formData.targetInstitutions.length} Specific Institutions selected`
                      : 'Select to whom you need to send this announcement'}
                  </Typography>
                </Box>
              </Box>
              
              <Box sx={{ display: 'flex', gap: 1 }}>
                <FormControl size="small" sx={{ minWidth: 150 }}>
                  <Select
                    multiple
                    displayEmpty
                    value={formData.targetInstitutions}
                    onChange={(e) => setFormData({ ...formData, targetInstitutions: typeof e.target.value === 'string' ? e.target.value.split(',') : e.target.value })}
                    renderValue={(selected) => selected.length === 0 ? 'All Institutions' : `${selected.length} Institutions`}
                    sx={{ ...selectSx, height: 40, bgcolor: '#fff' }}
                  >
                    {institutions.map((inst) => (
                      <MenuItem key={inst._id} value={inst._id}>
                        <Checkbox checked={formData.targetInstitutions.indexOf(inst._id) > -1} size="small" />
                        <Typography sx={{ fontFamily: fontStack, fontSize: 13 }}>{inst.name}</Typography>
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
                <Button 
                  startIcon={<AddIcon />}
                  sx={{ 
                    bgcolor: '#2563eb', color: '#fff', borderRadius: '10px', px: 2, py: 1,
                    textTransform: 'none', fontWeight: 700, fontFamily: fontStack,
                    '&:hover': { bgcolor: '#1d4ed8' }
                  }}
                >
                  Add
                </Button>
              </Box>
            </Box>

            {/* 3. Priority & Timing */}
            <Grid container spacing={3}>
              <Grid item xs={12} sm={4}>
                <Typography sx={{ fontFamily: fontStack, fontWeight: 700, fontSize: 14, color: COLORS.textPrimary, mb: 1.5 }}>
                  Priority Level
                </Typography>
                <FormControl fullWidth size="small">
                  <Select 
                    value={formData.priority} 
                    onChange={(e) => setFormData({ ...formData, priority: e.target.value as any })}
                    sx={selectSx}
                    startAdornment={
                      <InputAdornment position="start">
                        <Box sx={{ 
                          width: 8, height: 8, borderRadius: '50%', mr: 1,
                          bgcolor: formData.priority === 'urgent' ? '#dc2626' : formData.priority === 'high' ? '#ea580c' : '#059669' 
                        }} />
                      </InputAdornment>
                    }
                  >
                    <MenuItem value="low">Low Priority</MenuItem>
                    <MenuItem value="medium">Medium Priority</MenuItem>
                    <MenuItem value="high">High Priority</MenuItem>
                    <MenuItem value="urgent">Urgent</MenuItem>
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12} sm={4}>
                <Typography sx={{ fontFamily: fontStack, fontWeight: 700, fontSize: 14, color: COLORS.textPrimary, mb: 1.5 }}>
                  Send On
                </Typography>
                <TextField 
                  fullWidth type="datetime-local" size="small" 
                  value={formData.scheduledAt}
                  onChange={(e) => setFormData({ ...formData, scheduledAt: e.target.value })}
                  InputLabelProps={{ shrink: true }}
                  sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px', fontFamily: fontStack, bgcolor: '#fcfcfc' } }}
                />
              </Grid>

              <Grid item xs={12} sm={4}>
                <Typography sx={{ fontFamily: fontStack, fontWeight: 700, fontSize: 14, color: COLORS.textPrimary, mb: 1.5 }}>
                  Due On
                </Typography>
                <TextField 
                  fullWidth type="datetime-local" size="small" 
                  value={formData.expiresAt}
                  onChange={(e) => setFormData({ ...formData, expiresAt: e.target.value })}
                  InputLabelProps={{ shrink: true }}
                  sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px', fontFamily: fontStack, bgcolor: '#fcfcfc' } }}
                />
              </Grid>
            </Grid>

            {/* 4. Notes Section */}
            <Box>
              <Typography sx={{ fontFamily: fontStack, fontWeight: 700, fontSize: 14, color: COLORS.textPrimary, mb: 1.5 }}>
                Notes
              </Typography>
              <Box sx={{ border: `1px solid ${COLORS.border}`, borderRadius: '16px', overflow: 'hidden' }}>
                <Box sx={{ px: 2, py: 1, borderBottom: `1px solid ${COLORS.border}`, bgcolor: '#fafafa', display: 'flex', gap: 1 }}>
                  <IconButton size="small" onClick={(e) => handleFormatText('bold', e)}><FormatBoldIcon sx={{ fontSize: 18 }} /></IconButton>
                  <IconButton size="small" onClick={(e) => handleFormatText('italic', e)}><FormatItalicIcon sx={{ fontSize: 18 }} /></IconButton>
                  <IconButton size="small" onClick={(e) => handleFormatText('underline', e)}><FormatUnderlinedIcon sx={{ fontSize: 18 }} /></IconButton>
                  <Box sx={{ width: 1, height: 18, bgcolor: '#e2e8f0', mx: 1, alignSelf: 'center' }} />
                  <IconButton size="small" component="label">
                    <input type="file" multiple hidden onChange={handleFileAttachment} />
                    <LinkIcon sx={{ fontSize: 18 }} />
                  </IconButton>
                </Box>
                <TextField 
                  fullWidth multiline rows={4}
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  placeholder="Write your message here..."
                  sx={{ 
                    '& .MuiOutlinedInput-root': { border: 'none', borderRadius: 0, '& fieldset': { border: 'none' } },
                    '& .MuiInputBase-input': { fontFamily: fontStack, fontSize: 15, p: 2.5 }
                  }}
                />
              </Box>
            </Box>

            {/* 5. Delivery Methods */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 3, pt: 1 }}>
              <Typography sx={{ fontFamily: fontStack, fontWeight: 700, fontSize: 14, color: COLORS.textPrimary }}>
                Send Announcement as:
              </Typography>
              <FormControlLabel
                control={<Checkbox checked={formData.isActive} onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })} />}
                label={<Typography sx={{ fontFamily: fontStack, fontSize: 14, fontWeight: 600 }}>In-app Popup</Typography>}
              />
              <FormControlLabel
                control={<Checkbox checked={formData.sendEmail} onChange={(e) => setFormData({ ...formData, sendEmail: e.target.checked })} />}
                label={<Typography sx={{ fontFamily: fontStack, fontSize: 14, fontWeight: 600 }}>Email Notification</Typography>}
              />
            </Box>
          </Box>
        </DialogContent>

        <DialogActions sx={{ p: 4, pt: 2 }}>
          <Button 
            onClick={() => setShowModal(false)}
            sx={{ 
              fontFamily: fontStack, fontWeight: 700, color: '#64748b', textTransform: 'none',
              fontSize: 14, mr: 1
            }}
          >
            Cancel
          </Button>
          <Button 
            type="submit" disableElevation
            disabled={!formData.title.trim() || !formData.content.trim()}
            sx={{ 
              bgcolor: '#2563eb', color: '#fff', borderRadius: '10px', px: 4, py: 1.5,
              textTransform: 'none', fontWeight: 800, fontFamily: fontStack, fontSize: 15,
              '&:hover': { bgcolor: '#1d4ed8' },
              '&.Mui-disabled': { bgcolor: '#e2e8f0', color: '#94a3b8' }
            }}
          >
            {editingAnnouncement ? 'Update Announcement' : 'Send Announcement'}
          </Button>
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
    </Box>
  );
};

export default SuperAdminAnnouncements;
