import React, { useEffect, useState, useCallback, useMemo } from "react";
import {
  Box, Typography, Button, Grid, IconButton,
  Tooltip, TextField, Chip, Skeleton, useTheme, useMediaQuery,
  Dialog, DialogTitle, DialogContent, DialogActions, ClickAwayListener,
  Popover
} from "@mui/material";
import {
  AddCircle, Delete, CheckCircle, ArrowForward, AccessTime,
  FileDownload, BeachAccess, CalendarToday, ChevronLeft, ChevronRight,
  Settings, InfoOutlined, MoreVert
} from '@mui/icons-material';
import { motion, AnimatePresence } from "framer-motion";
import { adminService } from "../../services";
import Swal from "sweetalert2";
import { Switch, Menu, MenuItem } from "@mui/material";

// ─── Modern Dashboard Design System ──────────────────────────────────────────
const COLORS = {
  pageBg: '#F9FAFB',
  surface: '#FFFFFF',
  black: '#1E293B',
  textPrimary: '#1E293B',
  textSecondary: '#64748B',
  teal: '#0E7490',      // Sidebar Active Text Color
  tealDark: '#0D9488',  // Sidebar Shadow/Accents Color
  tealLight: 'rgba(45, 212, 191, 0.15)', // Sidebar Active Indicator BG
  blue: '#0EA5E9',
  orange: '#F59E0B',
  border: '#F1F5F9',
  cardRadius: '24px',
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

// ─── SKELETON LOADER COMPONENT ──────────────────────────────────────────────
const AdminTermsPageSkeleton = ({ isMobile }: { isMobile: boolean }) => (
  <Box sx={{ px: { xs: 2, sm: 3, md: 4 }, pt: 2, pb: 8, bgcolor: COLORS.pageBg, minHeight: '100vh', fontFamily: fontStack }}>
    {/* Header Skeleton */}
    <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 1.5, sm: 2.5 }, mb: 5, maxWidth: 1000, mx: 'auto' }}>
      <Skeleton variant="rounded" width={isMobile ? 48 : 56} height={isMobile ? 48 : 56} sx={{ borderRadius: '14px' }} />
      <Box sx={{ flex: 1 }}>
        <Skeleton variant="text" width={isMobile ? "70%" : "40%"} height={32} sx={{ mb: 1 }} />
        <Skeleton variant="text" width={isMobile ? "90%" : "60%"} height={20} />
      </Box>
    </Box>

    {/* Main Card Skeleton */}
    <Box sx={{ maxWidth: 1000, mx: 'auto', borderRadius: COLORS.cardRadius, bgcolor: '#FFF', border: `1px solid ${COLORS.border}`, overflow: 'hidden' }}>
      <Grid container>
        {/* Left: Calendar Skeleton */}
        <Grid item xs={12} md={6.5} sx={{ p: { xs: 2, sm: 4 }, borderRight: { md: `1px solid ${COLORS.border}` } }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 4 }}>
            <Skeleton variant="circular" width={32} height={32} />
            <Skeleton variant="text" width="30%" height={32} />
            <Skeleton variant="circular" width={32} height={32} />
          </Box>
          <Grid container spacing={1}>
            {[...Array(42)].map((_, i) => (
              <Grid item xs={1.7} key={i} sx={{ display: 'flex', justifyContent: 'center' }}>
                <Skeleton variant="circular" width={isMobile ? 30 : 36} height={isMobile ? 30 : 36} />
              </Grid>
            ))}
          </Grid>
        </Grid>
        {/* Right: Form Skeleton */}
        <Grid item xs={12} md={5.5} sx={{ p: { xs: 2.5, sm: 4 }, bgcolor: '#FAFAFA' }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {[1, 2].map(i => (
              <Box key={i}>
                <Skeleton variant="text" width="30%" height={20} sx={{ mb: 1.5 }} />
                <Skeleton variant="rounded" height={56} sx={{ borderRadius: '12px' }} />
              </Box>
            ))}
          </Box>
        </Grid>
      </Grid>
    </Box>
  </Box>
);

export default function AdminTermsPage({
  refreshTrigger = 0,
  onLoadingChange
}: {
  refreshTrigger?: number;
  onLoadingChange?: (loading: boolean) => void;
}) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const isSmall = useMediaQuery(theme.breakpoints.down('sm'));

  const [terms, setTerms] = useState<Term[]>([]);
  const [loading, setLoading] = useState(true);
  const [ay, setAy] = useState("");
  const [sem, setSem] = useState("");
  const [saving, setSaving] = useState(false);
  const [openAddModal, setOpenAddModal] = useState(false);
  const [isEditingMonth, setIsEditingMonth] = useState(false);
  const [startDate, setStartDate] = useState<string | null>(null);
  const [endDate, setEndDate] = useState<string | null>(null);
  const [startTime, setStartTime] = useState("08:00");
  const [endTime, setEndTime] = useState("17:00");
  const [startAnchorEl, setStartAnchorEl] = useState<null | HTMLElement>(null);
  const [endAnchorEl, setEndAnchorEl] = useState<null | HTMLElement>(null);
  const [activateImmediately, setActivateImmediately] = useState(true);

  const formatDisplayTime = (timeStr: string) => {
    const [h, m] = timeStr.split(':');
    const hour = parseInt(h);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour.toString().padStart(2, '0')}:${m} ${ampm}`;
  };

  // --- Menu State for History ---
  const [menuAnchor, setMenuAnchor] = useState<null | HTMLElement>(null);
  const [activeMenuTerm, setActiveMenuTerm] = useState<Term | null>(null);

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, term: Term) => {
    setMenuAnchor(event.currentTarget);
    setActiveMenuTerm(term);
  };

  const handleMenuClose = () => {
    setMenuAnchor(null);
    setActiveMenuTerm(null);
  };



  const handleMonthChange = (newMonth: number) => {
    setCurrentDate(prev => new Date(prev.getFullYear(), newMonth, 1));
  };

  const handleYearChange = (newYear: number) => {
    setCurrentDate(prev => new Date(newYear, prev.getMonth(), 1));
  };

  const onDateClick = (dateStr: string) => {
    if (!startDate || (startDate && endDate)) {
      setStartDate(dateStr);
      setEndDate(null);
    } else {
      if (dateStr < startDate) {
        setStartDate(dateStr);
        setEndDate(startDate);
      } else {
        setEndDate(dateStr);
      }
    }
  };

  const handleDownloadReport = (term: Term) => {
    const csvContent = `data:text/csv;charset=utf-8,Student Name,ID,Status,Signatures\n` +
      `Juan Dela Cruz,2021-0001,Cleared,15/15\n` +
      `Maria Clara,2021-0002,Pending,12/15\n` +
      `Jose Rizal,2021-0003,Cleared,15/15`;
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Report_${term.academicYear}_${term.semester}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    Swal.fire({
      title: "Generating Report...",
      text: "CSV download has been initiated.",
      icon: "success",
      timer: 1500,
      showConfirmButton: false
    });
  };

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
      setOpenAddModal(false);
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
      text: "This will deactivate all other terms.",
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "Activate",
      confirmButtonColor: COLORS.black
    });

    if (result.isConfirmed) {
      try {
        await adminService.activateTerm(id);
        Swal.fire("Activated", "Term is now active", "success");
        fetchTerms();
      } catch (error: any) {
        Swal.fire("Error", "Failed to activate term", "error");
      }
    }
  };

  const handleDelete = async (id: string) => {
    const result = await Swal.fire({
      title: "Delete?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Delete",
      confirmButtonColor: "#EF4444"
    });

    if (result.isConfirmed) {
      try {
        await adminService.deleteTerm(id);
        fetchTerms();
      } catch (error: any) {
        Swal.fire("Error", "Failed to delete", "error");
      }
    }
  };

  const [currentDate, setCurrentDate] = useState(new Date(2025, 11, 1)); // December 2025
  const currentMonth = currentDate.toLocaleString('default', { month: 'long', year: 'numeric' });

  const handleNextMonth = () => {
    setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  };

  const days = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];

  // --- Dynamic Calendar Generation Logic ---
  const calendarDays = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    const firstDayOfMonth = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const daysInPrevMonth = new Date(year, month, 0).getDate();

    const calendar = [];

    // 1. Previous month's bleeding days
    for (let i = firstDayOfMonth - 1; i >= 0; i--) {
      const d = daysInPrevMonth - i;
      const date = new Date(year, month - 1, d);
      calendar.push({
        d,
        dateStr: date.toISOString().split('T')[0],
        current: false,
        active: false
      });
    }

    // 2. Current month's days
    const today = new Date();
    for (let d = 1; d <= daysInMonth; d++) {
      const date = new Date(year, month, d);
      const isToday = today.toDateString() === date.toDateString();
      calendar.push({
        d,
        dateStr: date.toISOString().split('T')[0],
        current: true,
        active: isToday,
        event: d % 7 === 0 // Placeholder for deterministic events
      });
    }

    // 3. Next month's bleeding days (to fill 6 rows, 42 days)
    const remainingSlots = 42 - calendar.length;
    for (let d = 1; d <= remainingSlots; d++) {
      const date = new Date(year, month + 1, d);
      calendar.push({
        d,
        dateStr: date.toISOString().split('T')[0],
        current: false,
        active: false
      });
    }

    return calendar;
  }, [currentDate]);

  const cardStyle = {
    borderRadius: COLORS.cardRadius,
    bgcolor: COLORS.surface,
    boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.05), 0 10px 10px -5px rgba(0, 0, 0, 0.01)',
    border: `1px solid ${COLORS.border}`,
    overflow: 'hidden'
  };

  const isSelected = (dateStr: string) => dateStr === startDate || dateStr === endDate;
  const isInRange = (dateStr: string) => {
    if (!startDate || !endDate) return false;
    return dateStr > startDate && dateStr < endDate;
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return "Select date";
    return new Date(dateStr).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
  };

  if (loading && terms.length === 0) {
    return <AdminTermsPageSkeleton isMobile={isMobile} />;
  }

  return (
    <Box sx={{ px: { xs: 2, sm: 3, md: 4 }, pt: 2, pb: 8, bgcolor: COLORS.pageBg, minHeight: '100vh', fontFamily: fontStack }}>
      {/* ─── Page Header ────────────────────────────────────────────────── */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 2, sm: 2.5 }, mb: { xs: 3, sm: 5 }, maxWidth: 1000, mx: 'auto' }}>
        <Box sx={{
          width: { xs: 48, sm: 56 }, height: { xs: 48, sm: 56 }, borderRadius: '14px', border: `1px solid ${COLORS.border}`,
          display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: '#f1f5f9'
        }}>
          <CalendarToday sx={{ color: COLORS.textPrimary, fontSize: { xs: 20, sm: 24 } }} />
        </Box>
        <Box>
          <Typography sx={{ fontWeight: 800, fontSize: { xs: 19, sm: 24 }, color: COLORS.textPrimary, letterSpacing: '-0.02em', lineHeight: 1.2 }}>
            Schedule Academic Term
          </Typography>
          <Typography sx={{ color: COLORS.textSecondary, fontWeight: 500, fontSize: { xs: 13, sm: 15 }, mt: 0.5 }}>
            Define and activate your next academic period easily.
          </Typography>
        </Box>
      </Box>

      {/* ─── MAIN SCHEDULER CARD ────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        style={{ maxWidth: 1000, margin: '0 auto' }}
      >
        <Box sx={cardStyle}>
          <Grid container>
            {/* LEFT: CALENDAR SECTION */}
            <Grid item xs={12} md={6.5} sx={{ p: { xs: 2, sm: 4 }, borderRight: { md: `1px solid ${COLORS.border}` }, borderBottom: { xs: `1px solid ${COLORS.border}`, md: 'none' } }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: { xs: 3, sm: 4 }, px: 0.5 }}>
                <IconButton size="small" onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1))}>
                  <ChevronLeft />
                </IconButton>

                {isEditingMonth ? (
                  <ClickAwayListener onClickAway={() => setIsEditingMonth(false)}>
                    <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                      <TextField
                        select
                        size="small"
                        value={currentDate.getMonth()}
                        onChange={(e) => handleMonthChange(Number(e.target.value))}
                        SelectProps={{ native: true }}
                        sx={{
                          '& .MuiOutlinedInput-root': { borderRadius: '8px', fontSize: 13, fontWeight: 700 },
                          '& .MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: COLORS.teal }
                        }}
                      >
                        {["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"].map((m, idx) => (
                          <option key={m} value={idx}>{m}</option>
                        ))}
                      </TextField>
                      <TextField
                        size="small"
                        type="number"
                        value={currentDate.getFullYear()}
                        onChange={(e) => handleYearChange(Number(e.target.value))}
                        onKeyDown={(e) => e.key === 'Enter' && setIsEditingMonth(false)}
                        sx={{
                          width: 80,
                          '& .MuiOutlinedInput-root': { borderRadius: '8px', fontSize: 13, fontWeight: 700 },
                          '& .MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: COLORS.teal }
                        }}
                      />
                    </Box>
                  </ClickAwayListener>
                ) : (
                  <Typography
                    onClick={() => setIsEditingMonth(true)}
                    sx={{ fontWeight: 800, fontSize: { xs: 15, sm: 17 }, color: COLORS.textPrimary, cursor: 'pointer', '&:hover': { color: COLORS.teal } }}
                  >
                    {currentMonth}
                  </Typography>
                )}

                <IconButton size="small" onClick={handleNextMonth}>
                  <ChevronRight />
                </IconButton>
              </Box>

              <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', mb: 2 }}>
                {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map(d => (
                  <Typography key={d} align="center" sx={{ fontSize: { xs: 11, sm: 13 }, fontWeight: 600, color: COLORS.textSecondary }}>{d}</Typography>
                ))}
              </Box>

              <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', rowGap: 0.5 }}>
                {calendarDays.map((day) => {
                  const selected = isSelected(day.dateStr);
                  const inRange = isInRange(day.dateStr);

                  return (
                    <Box
                      key={day.dateStr}
                      onClick={() => day.current && onDateClick(day.dateStr)}
                      sx={{
                        height: { xs: 40, sm: 48 },
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: day.current ? 'pointer' : 'default',
                        position: 'relative',
                        transition: '0.2s',
                        borderRadius: (selected && day.dateStr === startDate && endDate) ? '50% 0 0 50%' :
                          (selected && day.dateStr === endDate) ? '0 50% 50% 0' :
                            inRange ? '0' : '50%',
                        bgcolor: selected ? COLORS.teal : inRange ? COLORS.tealLight : 'transparent',
                        color: selected ? '#FFF' : inRange ? COLORS.teal : day.current ? COLORS.textPrimary : '#CBD5E1',
                        '&:hover': { bgcolor: selected ? COLORS.teal : day.current ? '#F1F5F9' : 'transparent' }
                      }}
                    >
                      <Typography sx={{ fontWeight: selected ? 800 : 700, fontSize: { xs: 13, sm: 15 } }}>{day.d}</Typography>

                      {day.active && !selected && (
                        <Box sx={{ width: 4, height: 4, borderRadius: '50%', bgcolor: COLORS.textPrimary, position: 'absolute', bottom: { xs: 4, sm: 8 } }} />
                      )}
                    </Box>
                  );
                })}
              </Box>

              <Box sx={{ mt: { xs: 3, sm: 4 }, display: 'flex', gap: 3, px: 0.5 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: COLORS.teal }} />
                  <Typography sx={{ fontSize: 11, fontWeight: 600, color: COLORS.textSecondary }}>Selection</Typography>
                </Box>
              </Box>
            </Grid>

            {/* RIGHT: CONFIGURATION FORM */}
            <Grid item xs={12} md={5.5} sx={{ p: { xs: 2.5, sm: 4 }, bgcolor: '#FAFAFA' }}>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: { xs: 3, sm: 4 } }}>
                <Box>
                  <Typography sx={{ fontWeight: 700, fontSize: 13, color: COLORS.textPrimary, mb: 1.2 }}>
                    Academic Year*
                  </Typography>
                  <TextField
                    fullWidth placeholder="e.g., 2025-2026"
                    value={ay} onChange={(e) => setAy(e.target.value)}
                    variant="outlined" size="small"
                    sx={{
                      '& .MuiOutlinedInput-root': { borderRadius: '12px', bgcolor: '#FFF' },
                      '& .MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: COLORS.teal }
                    }}
                  />
                </Box>

                <Box>
                  <Typography sx={{ fontWeight: 700, fontSize: 13, color: COLORS.textPrimary, mb: 1.2 }}>
                    Semester*
                  </Typography>
                  <TextField
                    fullWidth placeholder="e.g., 1st Semester"
                    value={sem} onChange={(e) => setSem(e.target.value)}
                    variant="outlined" size="small"
                    sx={{
                      '& .MuiOutlinedInput-root': { borderRadius: '12px', bgcolor: '#FFF' },
                      '& .MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: COLORS.teal }
                    }}
                  />
                </Box>

                <Box>
                  <Typography sx={{ fontWeight: 700, fontSize: 13, color: COLORS.textPrimary, mb: 1.2 }}>
                    Start date*
                  </Typography>
                  <Box sx={{
                    display: 'flex', border: `1px solid ${COLORS.border}`, borderRadius: '12px', overflow: 'hidden', bgcolor: '#FFF'
                  }}>
                    <Box sx={{ flex: 1, p: 1.5, borderRight: `1px solid ${COLORS.border}`, display: 'flex', alignItems: 'center' }}>
                      <Typography sx={{ fontSize: { xs: 13, sm: 15 }, color: startDate ? COLORS.textPrimary : '#94A3B8', fontWeight: 600 }}>
                        {formatDate(startDate)}
                      </Typography>
                    </Box>
                    <Box sx={{ width: { xs: 90, sm: 110 }, p: 0.5, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Typography
                        onClick={(e) => setStartAnchorEl(e.currentTarget)}
                        sx={{
                          fontSize: { xs: '12px', sm: '14px' }, fontWeight: 700, color: COLORS.textSecondary,
                          cursor: 'pointer', '&:hover': { color: COLORS.teal }
                        }}
                      >
                        {formatDisplayTime(startTime)}
                      </Typography>
                    </Box>
                  </Box>
                </Box>

                <Box>
                  <Typography sx={{ fontWeight: 700, fontSize: 13, color: COLORS.textPrimary, mb: 1.2 }}>
                    End date*
                  </Typography>
                  <Box sx={{
                    display: 'flex', border: `1px solid ${COLORS.border}`, borderRadius: '12px', overflow: 'hidden', bgcolor: '#FFF'
                  }}>
                    <Box sx={{ flex: 1, p: 1.5, borderRight: `1px solid ${COLORS.border}`, display: 'flex', alignItems: 'center' }}>
                      <Typography sx={{ fontSize: { xs: 13, sm: 15 }, color: endDate ? COLORS.textPrimary : '#94A3B8', fontWeight: 600 }}>
                        {formatDate(endDate)}
                      </Typography>
                    </Box>
                    <Box sx={{ width: { xs: 90, sm: 110 }, p: 0.5, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Typography
                        onClick={(e) => setEndAnchorEl(e.currentTarget)}
                        sx={{
                          fontSize: { xs: '12px', sm: '14px' }, fontWeight: 700, color: COLORS.textSecondary,
                          cursor: 'pointer', '&:hover': { color: COLORS.teal }
                        }}
                      >
                        {formatDisplayTime(endTime)}
                      </Typography>
                    </Box>
                  </Box>
                </Box>

                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mt: 1 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <Typography sx={{ fontWeight: 700, fontSize: { xs: 14, sm: 15 }, color: COLORS.textPrimary }}>
                      Activate immediately
                    </Typography>
                    <Tooltip title="If enabled, this will become the active term for all students upon creation.">
                      <InfoOutlined sx={{ fontSize: 18, color: COLORS.textSecondary }} />
                    </Tooltip>
                  </Box>
                  <Switch
                    checked={activateImmediately}
                    onChange={(e) => setActivateImmediately(e.target.checked)}
                    size={isMobile ? "small" : "medium"}
                    sx={{
                      '& .MuiSwitch-switchBase.Mui-checked': { color: COLORS.teal },
                      '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': { backgroundColor: COLORS.teal },
                    }}
                  />
                </Box>
              </Box>
            </Grid>
          </Grid>

          {/* CARD FOOTER */}
          <Box sx={{
            p: { xs: 2.5, sm: 3 }, px: { xs: 2.5, sm: 4 }, display: 'flex', flexDirection: { xs: 'column', sm: 'row' },
            alignItems: { xs: 'stretch', sm: 'center' }, justifyContent: 'space-between', gap: 3,
            borderTop: `1px solid ${COLORS.border}`, bgcolor: '#FFF'
          }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Typography sx={{ fontWeight: 600, color: COLORS.textSecondary, fontSize: { xs: 13, sm: 14 } }}>
                <Box component="span" sx={{ color: COLORS.textPrimary, fontWeight: 700 }}>Event:</Box> {ay || '...'} {sem || '...'}
              </Typography>
              {startDate && endDate && !isMobile && (
                <Typography sx={{ fontWeight: 600, color: COLORS.textSecondary, fontSize: 14 }}>
                  • {new Date(startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - {new Date(endDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                </Typography>
              )}
            </Box>
            <Box sx={{ display: 'flex', gap: 2, flexDirection: { xs: 'column-reverse', mobile: 'row' } }}>
              <Button
                onClick={() => { setAy(""); setSem(""); setStartDate(null); setEndDate(null); }}
                fullWidth={isMobile}
                sx={{
                  textTransform: 'none', px: 4, py: 1.2, borderRadius: COLORS.pillRadius, fontWeight: 700,
                  color: COLORS.textPrimary, border: `1px solid ${COLORS.border}`,
                  '&:hover': { bgcolor: '#F9FBFF' }
                }}
              >
                Cancel
              </Button>
              <Button
                variant="contained"
                onClick={handleSave}
                fullWidth={isMobile}
                disabled={saving || !ay || !sem || !startDate || !endDate}
                sx={{
                  textTransform: 'none', px: 5, py: 1.5, borderRadius: COLORS.pillRadius, fontWeight: 800,
                  bgcolor: COLORS.black, color: '#FFF',
                  boxShadow: '0 10px 20px -5px rgba(0, 0, 0, 0.3)',
                  '&:hover': { bgcolor: '#27272A', transform: 'translateY(-1px)' },
                  '&:disabled': { bgcolor: '#E2E8F0', color: '#94A3B8' },
                  transition: '0.2s'
                }}
              >
                {saving ? 'Creating...' : 'Schedule Cycle'}
              </Button>
            </Box>
          </Box>
        </Box>
      </motion.div>

      {/* ─── CYCLE HISTORY SECTION ──────────────────────────────────────── */}
      <Box sx={{ mt: 8, maxWidth: 1000, mx: 'auto' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 4, px: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Settings sx={{ color: COLORS.textSecondary, fontSize: 20 }} />
            <Typography sx={{ fontWeight: 800, fontSize: 19, color: COLORS.textPrimary }}>Academic Cycle History</Typography>
          </Box>
          <Button
            onClick={fetchTerms}
            startIcon={<AccessTime />}
            sx={{ textTransform: 'none', fontWeight: 700, color: COLORS.teal, fontSize: 14 }}
          >
            Refresh History
          </Button>
        </Box>

        <Grid container spacing={2.5}>
          <AnimatePresence mode="popLayout">
            {loading ? (
              [1, 2, 3].map(i => (
                <Grid item xs={12} key={i}>
                  <Skeleton variant="rounded" height={100} sx={{ borderRadius: '20px' }} />
                </Grid>
              ))
            ) : terms.length === 0 ? (
              <Box sx={{ width: '100%', py: 8, textAlign: 'center' }}>
                <Typography sx={{ color: COLORS.textSecondary, fontWeight: 600 }}>No academic cycles found.</Typography>
              </Box>
            ) : (
              terms.map(term => (
                <Grid item xs={12} key={term._id}>
                  <motion.div
                    layout
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                  >
                    <Box sx={{
                      p: { xs: 2, sm: 3 }, px: { xs: 2, sm: 4 }, borderRadius: '24px', bgcolor: '#FFF', border: `1px solid ${COLORS.border}`,
                      display: 'flex', flexDirection: { xs: 'column', sm: 'row' },
                      alignItems: { xs: 'flex-start', sm: 'center' }, justifyContent: 'space-between', gap: { xs: 2, sm: 0 },
                      '&:hover': { boxShadow: '0 10px 30px rgba(0,0,0,0.03)', borderColor: COLORS.teal + '44' },
                      transition: '0.3s'
                    }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 2.5, sm: 4 } }}>
                        <Box sx={{
                          width: 50, height: 50, borderRadius: '16px', bgcolor: term.isActive ? COLORS.tealLight : '#F8FAFC',
                          display: 'flex', flexShrink: 0, alignItems: 'center', justifyContent: 'center'
                        }}>
                          <Typography sx={{ fontWeight: 800, color: term.isActive ? COLORS.teal : COLORS.textSecondary, fontSize: 18 }}>
                            {term.academicYear.split('-')[0].slice(-2)}
                          </Typography>
                        </Box>
                        <Box>
                          <Typography sx={{ fontWeight: 800, fontSize: { xs: 15.5, sm: 17 }, mb: 0.5 }}>{term.academicYear} {term.semester}</Typography>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'wrap' }}>
                            <Chip
                              label={term.isActive ? "ACTIVE" : "EXPIRED"}
                              size="small"
                              sx={{
                                fontWeight: 800, fontSize: 10, borderRadius: '6px',
                                bgcolor: term.isActive ? COLORS.tealLight : '#F1F5F9',
                                color: term.isActive ? COLORS.teal : '#64748B',
                                border: term.isActive ? `1px solid ${COLORS.teal}20` : 'none'
                              }}
                            />
                            <Typography sx={{ fontSize: 12, fontWeight: 600, color: COLORS.textSecondary }}>
                              Created on {new Date(term.createdAt).toLocaleDateString()}
                            </Typography>
                          </Box>
                        </Box>
                      </Box>
                      <Box sx={{ display: 'flex', gap: 1, alignSelf: { xs: 'flex-end', sm: 'center' } }}>
                        {!term.isActive && (
                          <Tooltip title="Set as Active">
                            <IconButton onClick={() => handleActivate(term._id)} sx={{ color: COLORS.teal }}><CheckCircle /></IconButton>
                          </Tooltip>
                        )}
                        <IconButton
                          onClick={(e) => handleMenuOpen(e, term)}
                          sx={{ color: COLORS.textSecondary }}
                        >
                          <MoreVert />
                        </IconButton>
                      </Box>
                    </Box>
                  </motion.div>
                </Grid>
              ))
            )}
          </AnimatePresence>
        </Grid>
      </Box>

      {/* --- ELLIPSIS MENU --- */}
      <Menu
        anchorEl={menuAnchor}
        open={Boolean(menuAnchor)}
        onClose={handleMenuClose}
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
              '&:hover': { bgcolor: COLORS.tealLight, color: COLORS.teal }
            }
          }
        }}
      >
        <MenuItem onClick={() => { activeMenuTerm && handleDownloadReport(activeMenuTerm); handleMenuClose(); }}>
          <FileDownload sx={{ fontSize: 18, mr: 1.5 }} />
          Download Report
        </MenuItem>
        <MenuItem onClick={() => { activeMenuTerm && handleDelete(activeMenuTerm._id); handleMenuClose(); }} sx={{ color: '#EF4444' }}>
          <Delete sx={{ fontSize: 18, mr: 1.5 }} />
          Delete Cycle
        </MenuItem>
      </Menu>

      {/* --- CUSTOM TEAL TIME PICKER POPOVER --- */}
      {(() => {
        const renderTimePicker = (
          anchorEl: HTMLElement | null,
          onClose: () => void,
          currentTime: string,
          onSelect: (newTime: string) => void
        ) => {
          const [h, m] = currentTime.split(':');
          const hour24 = parseInt(h);
          const currentHour = hour24 % 12 || 12;
          const currentMin = m;
          const currentPeriod = hour24 >= 12 ? 'PM' : 'AM';

          const setTime = (newH: number, newM: string, newP: string) => {
            let h24 = newH % 12;
            if (newP === 'PM') h24 += 12;
            onSelect(`${h24.toString().padStart(2, '0')}:${newM}`);
          };

          return (
            <Popover
              open={Boolean(anchorEl)}
              anchorEl={anchorEl}
              onClose={onClose}
              anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
              transformOrigin={{ vertical: 'top', horizontal: 'center' }}
              PaperProps={{
                sx: {
                  p: 2, borderRadius: '20px', mt: 1.5, boxShadow: '0 10px 40px rgba(0,0,0,0.1)',
                  display: 'flex', gap: 2
                }
              }}
            >
              {/* Hours */}
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5, maxHeight: 200, overflowY: 'auto', pr: 1, alignItems: 'center' }}>
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(hNum => (
                  <Button
                    key={hNum} size="small"
                    onClick={() => setTime(hNum, currentMin, currentPeriod)}
                    sx={{
                      minWidth: 45, fontWeight: 700, borderRadius: '8px',
                      bgcolor: currentHour === hNum ? COLORS.teal : 'transparent',
                      color: currentHour === hNum ? '#FFF' : COLORS.textPrimary,
                      '&:hover': { bgcolor: currentHour === hNum ? COLORS.teal : COLORS.tealLight }
                    }}
                  >
                    {hNum.toString().padStart(2, '0')}
                  </Button>
                ))}
              </Box>
              {/* Minutes */}
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5, maxHeight: 200, overflowY: 'auto', pr: 1, alignItems: 'center' }}>
                {['00', '05', '10', '15', '20', '25', '30', '35', '40', '45', '50', '55'].map(mVal => (
                  <Button
                    key={mVal} size="small"
                    onClick={() => setTime(currentHour, mVal.toString(), currentPeriod)}
                    sx={{
                      minWidth: 45, fontWeight: 700, borderRadius: '8px',
                      bgcolor: currentMin === mVal.toString() ? COLORS.teal : 'transparent',
                      color: currentMin === mVal.toString() ? '#FFF' : COLORS.textPrimary,
                      '&:hover': { bgcolor: currentMin === mVal.toString() ? COLORS.teal : COLORS.tealLight }
                    }}
                  >
                    {mVal}
                  </Button>
                ))}
              </Box>
              {/* Period */}
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5, alignItems: 'center' }}>
                {['AM', 'PM'].map(pVal => (
                  <Button
                    key={pVal} size="small"
                    onClick={() => setTime(currentHour, currentMin, pVal)}
                    sx={{
                      minWidth: 55, fontWeight: 800, borderRadius: '8px',
                      bgcolor: currentPeriod === pVal ? COLORS.teal : 'transparent',
                      color: currentPeriod === pVal ? '#FFF' : COLORS.textPrimary,
                      '&:hover': { bgcolor: currentPeriod === pVal ? COLORS.teal : COLORS.tealLight }
                    }}
                  >
                    {pVal}
                  </Button>
                ))}
              </Box>
            </Popover>
          );
        };

        return (
          <>
            {renderTimePicker(startAnchorEl, () => setStartAnchorEl(null), startTime, setStartTime)}
            {renderTimePicker(endAnchorEl, () => setEndAnchorEl(null), endTime, setEndTime)}
          </>
        );
      })()}

      {/* Original Dialog removed - Integrated into main UI */}
    </Box>
  );
}
