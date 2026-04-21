import AdminInstitutionRequests from "./AdminInstitutionRequests";
import AdminOrganizationsPage from "./AdminOrganizationsPage";
import AdminTermsPage from "./AdminTermsPage";
import AdminQuotesPage from "./AdminQuotesPage";
import AdminRecordsPage from "./AdminRecordsPage";
import UsersTable from "../../components/UsersTable";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import IconButton from "@mui/material/IconButton";
import Tooltip from "@mui/material/Tooltip";
import { useLocation, useNavigate } from "react-router-dom";
import React, { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import SuccessMessage from "../../components/SuccessMessage";
import { showGlobalModal } from "../../components/GlobalModal";
import { api, authService, adminService } from '../../services';
import { getAbsoluteUrl, getInitials } from "../../utils/avatarUtils";
import { Divider } from "@mui/material";
import TextField from "@mui/material/TextField";
import FormControl from "@mui/material/FormControl";
import FormLabel from "@mui/material/FormLabel";
import { useTheme, useMediaQuery, Skeleton, Card, CardContent, Table, TableBody, TableCell, TableContainer, TableHead, TableRow } from "@mui/material";
import PersonIcon from "@mui/icons-material/Person";
import SecurityIcon from "@mui/icons-material/Security";
import {
  SettingsContainer,
  SettingsSection,
  SettingsRow,
  SettingsField,
  ProfilePictureSection,
  SettingsHeader
} from "../../components/layout/SettingsLayout";
import SuccessModal from "../../components/SuccessModal";
import PasswordConfirmModal from "../dean/components/PasswordConfirmModal";
import DashboardIcon from "@mui/icons-material/Dashboard";
import PeopleIcon from "@mui/icons-material/People";
import PendingActionsIcon from "@mui/icons-material/PendingActions";
import ErrorOutlineIcon from "@mui/icons-material/ErrorOutline";
import BusinessIcon from "@mui/icons-material/Business";
import RefreshIcon from "@mui/icons-material/Refresh";

// --- MODERN BENTO DESIGN SYSTEM ---
const COLORS = {
  pageBg: '#F9FAFB',
  surface: '#FFFFFF',
  black: '#3c4043',
  textPrimary: '#3c4043',
  textSecondary: '#64748B',
  accent: '#3c4043',
  teal: '#0D9488',
  tealDark: '#0D9488',
  blue: '#B0E0E6',
  blueDark: '#0369A1',
  yellow: '#FEF08A',
  yellowDark: '#B45309',
  orange: '#C2410C',
  tealLight: '#F0FDFA',
  border: '#E2E8F0',
  tableHead: '#F8FAFC',
  avatarBg: '#0F172A10',
  cardRadius: '16px',
  pillRadius: '999px',
};

const fontStack = '"Google Sans", "Product Sans", Roboto, sans-serif';

const glassCard = {
  borderRadius: COLORS.cardRadius,
  backgroundColor: 'rgba(255,255,255,0.65)',
  backdropFilter: 'blur(12px)',
  WebkitBackdropFilter: 'blur(12px)',
  border: '1px solid #D1D5DB',
  boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
};

export default function AdminPage() {
  const location = useLocation();
  const nav = useNavigate();
  const [notice, setNotice] = useState<any>((location.state as any)?.banner ?? null);
  const isSettings = location.pathname.includes("/settings");
  const isUsers = location.pathname.includes("/users");
  const isOrganizations = location.pathname.includes("/organizations") || location.pathname.includes("/departments");
  const isTerms = location.pathname.includes("/terms");
  const isRecords = location.pathname.includes("/records");
  const isQuotes = location.pathname.includes("/quotes");
  const isInstitutionRequests = location.pathname.includes("/institution-requests");
  const isFAQs = location.pathname.includes("/faqs");
  const active: "dashboard" | "settings" | "users" | "organizations" | "terms" | "records" | "quotes" | "institution-requests" | "faqs" =
    isSettings ? "settings" :
      isUsers ? "users" :
        isOrganizations ? "organizations" :
          isTerms ? "terms" :
            isRecords ? "records" :
              isQuotes ? "quotes" :
                isInstitutionRequests ? "institution-requests" :
                  isFAQs ? "faqs" :
                    "dashboard";

  const token = typeof localStorage !== "undefined" ? localStorage.getItem("token") : null;
  const email = typeof localStorage !== "undefined" ? (localStorage.getItem("email") || "admin@example.com") : "admin@example.com";
  const isAdmin = useMemo(() => {
    if (!token) return false;
    try {
      const base64 = token.split(".")[1];
      const json = JSON.parse(atob(base64.replace(/-/g, "+").replace(/_/g, "/")));
      return !!json.isAdmin;
    } catch {
      return false;
    }
  }, [token]);

  const [profileFirst, setProfileFirst] = useState("");
  const [profileLast, setProfileLast] = useState("");
  const [draftFirst, setDraftFirst] = useState("");
  const [draftLast, setDraftLast] = useState("");
  const [newPass, setNewPass] = useState("");
  const [confirmPass, setConfirmPass] = useState("");
  const [passwordModalOpen, setPasswordModalOpen] = useState(false);
  const [passwordUpdateLoading, setPasswordUpdateLoading] = useState(false);
  const [successModalOpen, setSuccessModalOpen] = useState(false);
  const [successModalTitle, setSuccessModalTitle] = useState("");
  const [successModalDescription, setSuccessModalDescription] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const updateLocalAvatar = (url: string) => {
    try {
      const u = JSON.parse(localStorage.getItem("user") || "{}");
      u.avatarUrl = url;
      localStorage.setItem("user", JSON.stringify(u));
      window.dispatchEvent(new Event("storage"));
    } catch { }
  };


  useEffect(() => {
    if (location.pathname === "/admin") {
      nav("/admin/dashboard", { replace: true });
    }
  }, [location.pathname, nav]);

  useEffect(() => {
    try {
      const storedUserStr = localStorage.getItem("user");
      const fullUser = storedUserStr ? JSON.parse(storedUserStr) : null;
      // Prioritize the actual user profile data over potentially stale standalone username key
      const savedUsername = fullUser?.fullName || localStorage.getItem("username") || "";
      const base = savedUsername || (email || "").split("@")[0];
      const parts = base.replace(/[._-]+/g, " ").split(" ").filter(Boolean);
      const first = parts[0] || "";
      const last = parts.slice(1).join(" ") || "";
      setProfileFirst(first);
      setProfileLast(last);
      setDraftFirst(first);
      setDraftLast(last);
      (async () => {
        try {
          const res = await api.get("/auth/profile");
          if (res.data.avatarUrl) setAvatarUrl(res.data.avatarUrl);
        } catch { }
      })();
    } catch { }
  }, [email]);



  const fullName = useMemo(() => {
    const cap = (s: string) => s ? s.charAt(0).toUpperCase() + s.slice(1) : "";
    const composed = [cap(profileFirst.trim()), cap(profileLast.trim())].filter(Boolean).join(" ");
    if (composed) return composed;
    const local = (email || "").split("@")[0];
    const parts = local.replace(/[._-]+/g, " ").split(" ").filter(Boolean);
    const name = parts.map(cap).join(" ");
    return name || "Guest User";
  }, [profileFirst, profileLast, email]);

  const initials = useMemo(() => {
    return getInitials(fullName);
  }, [fullName]);

  const draftFullName = useMemo(() => {
    return `${draftFirst.trim()} ${draftLast.trim()}`.trim() || fullName;
  }, [draftFirst, draftLast, fullName]);

  const [users, setUsers] = useState<any[]>([]);
  const roleOf = (u: any) => {
    const r = String(u?.role || "").toLowerCase();
    if (!r) return "student";
    // Check for enum values first
    if (["student", "officer", "dean", "admin", "super_admin"].includes(r)) return r;
    // Fallback for legacy data or fuzzy matching
    if (r.includes("admin")) return "admin";
    if (r.includes("dean")) return "dean";
    if (r.includes("officer") || r.includes("signatory")) return "officer";
    return "student";
  };
  const studentCount = useMemo(() => users.filter(u => roleOf(u) === "student").length, [users]);
  const officerCount = useMemo(() => users.filter(u => roleOf(u) === "officer").length, [users]);
  const deanCount = useMemo(() => users.filter(u => roleOf(u) === "dean").length, [users]);
  const [totalRequests, setTotalRequests] = useState(0);
  const [pendingRequests, setPendingRequests] = useState(0);
  const [completedRequests, setCompletedRequests] = useState(0);
  const [rejectedRequests, setRejectedRequests] = useState(0);

  const [range, setRange] = useState<"day" | "week" | "month">("week");
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [orgApprovals, setOrgApprovals] = useState<{ name: string; count: number }[]>([]);
  const [delayedOrg, setDelayedOrg] = useState<{ name: string; avgDays: number }>({ name: "—", avgDays: 0 });
  const [fastestOrg, setFastestOrg] = useState<{ name: string; avgDays: number }>({ name: "—", avgDays: 0 });
  const [volume, setVolume] = useState<{ day: number[]; week: number[]; month: number[] }>({ day: [], week: [], month: [] });
  const [loadingDashboard, setLoadingDashboard] = useState(true);
  const [loadingSettings, setLoadingSettings] = useState(true);
  const [childLoading, setChildLoading] = useState(false);
  const [recentLogs, setRecentLogs] = useState<any[]>([]);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Dashboard skeleton loader
  useEffect(() => {
    if (active === "dashboard") {
      setLoadingDashboard(true);
      const timer = setTimeout(() => setLoadingDashboard(false), 800);
      return () => clearTimeout(timer);
    }
  }, [active]);

  // Settings skeleton loader
  useEffect(() => {
    if (active === "settings") {
      setLoadingSettings(true);
      const timer = setTimeout(() => setLoadingSettings(false), 1000);
      return () => clearTimeout(timer);
    }
  }, [active]);

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const isSmallMobile = useMediaQuery(theme.breakpoints.down('sm'));

  // --- Custom Skeleton Component ---
  const StatCardSkeleton = () => (
    <Box sx={{
      p: { xs: 2.5, sm: 3 },
      borderRadius: '16px',
      backgroundColor: 'rgba(0,0,0,0.03)',
      border: '1px solid #E2E8F0',
      minHeight: { xs: 100, sm: 120 },
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'space-between',
    }}>
      <Skeleton variant="text" width="50%" height={14} sx={{ mb: 1, bgcolor: 'rgba(0,0,0,0.05)' }} />
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
        <Skeleton variant="text" width="30%" height={40} sx={{ bgcolor: 'rgba(0,0,0,0.04)' }} />
        <Skeleton variant="rounded" width="20%" height={20} sx={{ borderRadius: '999px', bgcolor: 'rgba(0,0,0,0.03)' }} />
      </Box>
    </Box>
  );

  useEffect(() => {
    (async () => {
      try {
        const res = await api.get("/admin/users");
        setUsers(res.data || []);
      } catch { }
    })();
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const res = await api.get("/admin/clearance-stats");
        const d = res.data || {};
        setTotalRequests(Number(d.totalRequests || 0));
        setPendingRequests(Number(d.pendingRequests || 0));
        setCompletedRequests(Number(d.completedRequests || 0));
        setRejectedRequests(Number(d.rejectedRequests || 0));
        setOrgApprovals(Array.isArray(d.organizationApprovals) || Array.isArray(d.departmentApprovals) ? (d.organizationApprovals || d.departmentApprovals) : []);
        setDelayedOrg(d.mostDelayed || { name: "—", avgDays: 0 });
        setFastestOrg(d.fastest || { name: "—", avgDays: 0 });
        setVolume(d.volume || { day: [], week: [], month: [] });
      } catch { }
    })();
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const res = await adminService.getAuditLogs({ limit: 10 });
        if (res.success) {
          // Filter for clearance or user related logs for the "Activity" table
          setRecentLogs(res.data.logs || []);
        }
      } catch { }
    })();
  }, []);

  const logout = () => {
    authService.logout();
    nav("/", { state: { banner: { message: "Logged out successfully!", variant: "success" } } });
  };

  const updateProfile = async () => {
    const username = `${draftFirst} ${draftLast}`.trim();
    try {
      await api.put("/auth/profile", { username });
      try { localStorage.setItem("username", username); } catch { }
      setProfileFirst(draftFirst.trim());
      setProfileLast(draftLast.trim());
      setNotice({ message: "Profile updated", variant: "success" });
    } catch (err: any) {
      const msg = err.response?.data?.message || "Failed to update profile";
      setNotice({ message: msg, variant: "error" });
    }
  };



  const updatePassword = async () => {
    if (!newPass || !confirmPass) {
      setNotice({ message: "Please fill all password fields", variant: "error" });
      return;
    }
    if (newPass !== confirmPass) {
      showGlobalModal(
        "Password Mismatch",
        "New password and confirmation do not match. Please ensure both fields are identical.",
        "error"
      );
      return;
    }
    setPasswordModalOpen(true);
  };

  const handleConfirmPasswordUpdate = async (currentPassword: string) => {
    setPasswordUpdateLoading(true);
    try {
      await api.put("/auth/password", { currentPassword, newPassword: newPass });
      setSuccessModalTitle("Password Updated Successfully");
      setSuccessModalDescription("Your administrative password has been securely updated.");
      setSuccessModalOpen(true);
      setNewPass("");
      setConfirmPass("");
      setPasswordModalOpen(false);
    } catch (err: any) {
      const msg = err.response?.data?.message || "Failed to update password";
      setPasswordModalOpen(false);
      showGlobalModal("Incorrect Current Password", msg, "error");
    } finally {
      setPasswordUpdateLoading(false);
    }
  };

  return (
    <>
      {notice && (
        <SuccessMessage
          message={notice.message}
          variant={notice.variant}
          onClose={() => setNotice(null)}
        />
      )}
      {active === "dashboard" ? (
        loadingDashboard ? (
          <Box sx={{ px: isSmallMobile ? 2 : 2.5, pt: isSmallMobile ? 2 : 2.5, pb: isSmallMobile ? 2 : 4, backgroundColor: COLORS.pageBg, minHeight: '100vh', fontFamily: fontStack }}>
            {/* Header Skeleton */}
            <Box sx={{
              display: 'flex',
              flexDirection: { xs: 'column', sm: 'row' },
              justifyContent: 'space-between',
              alignItems: { xs: 'flex-start', sm: 'center' },
              gap: 2,
              mb: 4
            }}>
              <Skeleton variant="text" width={200} height={60} sx={{ borderRadius: '8px' }} />
            </Box>

            {/* Stat Row Skeleton */}
            <Box sx={{
              display: 'grid',
              gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', lg: 'repeat(4, 1fr)' },
              gap: 2,
              mb: 4
            }}>
              {[1, 2, 3, 4].map((i) => <StatCardSkeleton key={i} />)}
            </Box>

            {/* Analytics Grid Skeleton */}
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: '2fr 1fr' }, gap: 2, mb: 4 }}>
              <Skeleton variant="rounded" height={360} sx={{ borderRadius: '16px', bgcolor: 'rgba(0,0,0,0.03)' }} />
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Skeleton variant="rounded" height={160} sx={{ borderRadius: '16px', bgcolor: 'rgba(0,0,0,0.03)' }} />
                <Skeleton variant="rounded" height={160} sx={{ borderRadius: '16px', bgcolor: 'rgba(0,0,0,0.03)' }} />
              </Box>
            </Box>
          </Box>
        ) : (
          <Box sx={{ px: isSmallMobile ? 2 : 2.5, pt: 0, pb: isSmallMobile ? 2 : 4, backgroundColor: COLORS.pageBg, minHeight: '100vh', fontFamily: fontStack }}>
            {/* ── Dashboard Header ────────────────────────────────────────── */}
            <Box sx={{
              display: 'flex',
              flexDirection: { xs: 'column', sm: 'row' },
              justifyContent: 'space-between',
              alignItems: { xs: 'flex-start', sm: 'center' },
              gap: 2,
              mb: 4
            }}>
              <Box>
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
                    <BusinessIcon sx={{ fontSize: { xs: 24, sm: 28 } }} />
                  </Box>
                  <Typography
                    variant="h4"
                    sx={{
                      fontFamily: fontStack,
                      fontWeight: 600,
                      color: '#000',
                      letterSpacing: { xs: '-0.5px', sm: '-1.5px' },
                      fontSize: { xs: '1.25rem', sm: '1.75rem', md: '1.875rem' },
                      lineHeight: 1.2
                    }}
                  >
                    Overview
                  </Typography>
                </Box>
                <Typography
                  variant="body1"
                  sx={{
                    fontFamily: fontStack,
                    fontSize: { xs: '0.8rem', sm: '0.95rem' },
                    color: '#6B7280',
                    mt: 0.5,
                  }}
                >
                  Get a comprehensive view of clearance progress, trends, and recent activities.
                </Typography>
              </Box>
            </Box>

            {/* ── Stat Row (4 Cards) ──────────────────────────────────────── */}
            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', lg: 'repeat(4, 1fr)' },
                gap: 2,
                mb: 4,
              }}
            >
              {[
                { label: 'Approved Clearances', value: completedRequests, trend: '+12%' },
                { label: 'Rejected Clearances', value: rejectedRequests, trend: '-2%' },
                { label: 'Pending Clearances', value: pendingRequests, trend: '+5%' },
                { label: 'New Students', value: studentCount, trend: '+18%' },
              ].map((s) => {
                const isPositive = s.trend.startsWith('+');
                const trendColor = isPositive ? COLORS.teal : COLORS.orange;
                const trendBg = isPositive ? COLORS.tealLight : 'rgba(255, 137, 93, 0.1)';
                return (
                  <Box
                    key={s.label}
                    sx={{
                      p: { xs: 2.5, sm: 3 },
                      borderRadius: '16px',
                      border: '1px solid #F1F5F9',
                      backgroundColor: '#FFFFFF',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      minHeight: { xs: 100, sm: 120 },
                      boxShadow: '0 10px 40px rgba(0, 0, 0, 0.05), 0 2px 4px rgba(0, 0, 0, 0.02)',
                      '&:hover': {
                        boxShadow: '0 20px 50px rgba(0, 0, 0, 0.08)',
                        transform: 'translateY(-2px)'
                      },
                      transition: 'all 0.3s ease'
                    }}
                  >
                    <Typography sx={{ fontSize: { xs: 12, sm: 13 }, fontWeight: 600, color: COLORS.textSecondary, mb: 1 }}>{s.label}</Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 1, sm: 1.5 } }}>
                      <Typography sx={{ fontSize: { xs: 24, sm: 28 }, fontWeight: 800, color: COLORS.textPrimary, letterSpacing: '-0.02em' }}>
                        {s.value.toLocaleString()}
                      </Typography>
                      <Box sx={{
                        display: 'flex',
                        alignItems: 'center',
                        px: { xs: 0.75, sm: 1 },
                        py: 0.25,
                        borderRadius: '999px',
                        backgroundColor: trendBg,
                        border: `1px solid ${trendColor}20`
                      }}>
                        <Typography sx={{ fontSize: { xs: 10, sm: 11 }, fontWeight: 800, color: trendColor }}>
                          {isPositive ? '↑' : '↓'} {s.trend}
                        </Typography>
                      </Box>
                    </Box>
                  </Box>
                );
              })}
            </Box>

            {/* ── Analytics & Volume ───────────────────────────────────────── */}
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: '2fr 1fr' }, gap: 2, mb: 4 }}>
              {/* Clearance Volume Chart */}
              <Box sx={{ p: { xs: 2.5, sm: 4 }, borderRadius: '16px', border: '1px solid #E2E8F0', backgroundColor: '#FFFFFF', boxShadow: '0 10px 40px rgba(0, 0, 0, 0.05)' }}>
                <Box sx={{
                  display: 'flex',
                  flexDirection: { xs: 'column', sm: 'row' },
                  justifyContent: 'space-between',
                  alignItems: { xs: 'flex-start', sm: 'center' },
                  gap: 2,
                  mb: { xs: 4, sm: 3 }
                }}>
                  <Typography sx={{ fontWeight: 800, fontSize: { xs: 16, sm: 18 } }}>Clearance Volume</Typography>
                  <Box sx={{
                    display: 'flex',
                    border: '1px solid #E2E8F0',
                    borderRadius: '10px',
                    p: 0.5,
                    bgcolor: '#F8FAFC',
                    position: 'relative',
                    width: { xs: '100%', sm: 'auto' }
                  }}>
                    {['day', 'week', 'month'].map(r => (
                      <Button
                        key={r}
                        onClick={() => setRange(r as any)}
                        sx={{
                          fontSize: { xs: 10, sm: 11 },
                          fontWeight: 700,
                          px: { xs: 0, sm: 2 },
                          py: 0.5,
                          borderRadius: '8px',
                          textTransform: 'none',
                          color: range === r ? '#FFF' : COLORS.textSecondary,
                          position: 'relative',
                          zIndex: 1,
                          flex: { xs: 1, sm: 'none' },
                          minWidth: { xs: 0, sm: 80 },
                          transition: 'color 0.2s ease',
                          '&:hover': {
                            color: range === r ? '#FFF' : COLORS.black,
                            bgcolor: 'transparent'
                          },
                          // Remove default MUI button background
                          backgroundColor: 'transparent !important',
                        }}
                      >
                        {range === r && (
                          <motion.div
                            layoutId="activeRange"
                            style={{
                              position: 'absolute',
                              top: 0,
                              left: 0,
                              right: 0,
                              bottom: 0,
                              backgroundColor: COLORS.black,
                              borderRadius: '8px',
                              zIndex: -1,
                            }}
                            transition={{
                              type: "spring",
                              stiffness: 400,
                              damping: 30
                            }}
                          />
                        )}
                        {r.charAt(0).toUpperCase() + r.slice(1)}
                      </Button>
                    ))}
                  </Box>
                </Box>

                {/* Volume visualization (True SVG Line Chart) */}
                <Box
                  sx={{
                    height: { xs: 180, sm: 220 },
                    width: '100%',
                    pt: 4,
                    position: 'relative',
                    cursor: 'crosshair'
                  }}
                  onMouseLeave={() => setHoveredIndex(null)}
                  onMouseMove={(e) => {
                    const rect = e.currentTarget.getBoundingClientRect();
                    const x = e.clientX - rect.left;
                    const dataLen = volume[range]?.length || 0;
                    if (dataLen < 2) return;
                    const idx = Math.round((x / rect.width) * (dataLen - 1));
                    setHoveredIndex(Math.max(0, Math.min(idx, dataLen - 1)));
                  }}
                >
                  {(() => {
                    const data = volume[range] || [];
                    const getTooltipLabel = (idx: number) => {
                      if (range === 'week') {
                        const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
                        return days[idx] || "";
                      }
                      if (range === 'month') {
                        const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
                        return months[idx] || "";
                      }
                      // Day range (24 hours)
                      const hour = idx % 24;
                      return `${hour}:00`;
                    };
                    if (data.length < 2) return (
                      <Box sx={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Typography sx={{ color: COLORS.textSecondary, fontSize: 13, fontWeight: 500 }}>Gathering data points...</Typography>
                      </Box>
                    );

                    const maxV = Math.max(...data, 10);
                    const width = 1000;
                    const height = 180;
                    const gap = width / (data.length - 1);

                    // Generate SVG Path for the line
                    const pathD = data.map((v, i) => `${i === 0 ? 'M' : 'L'} ${i * gap} ${height - (v / maxV * height)}`).join(' ');
                    const areaPathD = `${pathD} L ${width} ${height} L 0 ${height} Z`;

                    return (
                      <Box sx={{ width: '100%', height: '100%' }}>
                        <svg viewBox={`0 0 ${width} ${height + 20}`} preserveAspectRatio="none" style={{ width: '100%', height: '100%', overflow: 'visible' }}>
                          {/* Grid Lines */}
                          {[0, 0.25, 0.5, 0.75, 1].map((p, i) => (
                            <line key={i} x1="0" y1={height * p} x2={width} y2={height * p} stroke="#F1F5F9" strokeWidth="1" />
                          ))}

                          {/* Gradient Fill */}
                          <defs>
                            <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="0%" stopColor={COLORS.blue} stopOpacity="0.4" />
                              <stop offset="100%" stopColor={COLORS.blue} stopOpacity="0" />
                            </linearGradient>
                          </defs>

                          {/* Area Fill */}
                          <motion.path
                            key={`area-${range}`}
                            d={areaPathD}
                            fill="url(#chartGradient)"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ duration: 1, delay: 0.5 }}
                          />

                          {/* Smooth Line (Drawing Animation) */}
                          <motion.path
                            key={`line-${range}`}
                            d={pathD}
                            fill="none"
                            stroke={COLORS.blue}
                            strokeWidth="3"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            style={{ filter: `drop-shadow(0 4px 8px ${COLORS.blue}88)` }}
                            initial={{ pathLength: 0 }}
                            animate={{ pathLength: 1 }}
                            transition={{ duration: 1.5, ease: "easeInOut" }}
                          />

                          {/* Interactive Guideline */}
                          {hoveredIndex !== null && (
                            <line
                              x1={hoveredIndex * gap}
                              y1="0"
                              x2={hoveredIndex * gap}
                              y2={height}
                              stroke={COLORS.blue}
                              strokeWidth="1"
                              strokeDasharray="4 4"
                              opacity="0.5"
                            />
                          )}

                          {/* Data Points */}
                          {data.map((v, i) => (
                            <circle
                              key={i}
                              cx={i * gap}
                              cy={height - (v / maxV * height)}
                              r={i === data.length - 1 || i === hoveredIndex ? 6 : 0}
                              fill={i === hoveredIndex ? COLORS.blue : COLORS.blue}
                              stroke="#FFFFFF"
                              strokeWidth={i === hoveredIndex ? 3 : 2}
                              style={{
                                transition: 'all 0.2s ease',
                                filter: i === hoveredIndex ? `drop-shadow(0 0 8px ${COLORS.blue}aa)` : 'none'
                              }}
                            />
                          ))}
                        </svg>

                        {/* Floating Tooltip */}
                        <AnimatePresence>
                          {hoveredIndex !== null && (
                            <motion.div
                              initial={{ opacity: 0, y: 10, scale: 0.95 }}
                              animate={{
                                opacity: 1,
                                y: 0,
                                scale: 1,
                                left: `${(hoveredIndex / (data.length - 1)) * 100}%`
                              }}
                              exit={{ opacity: 0, y: 10, scale: 0.95 }}
                              style={{
                                position: 'absolute',
                                top: -20,
                                transform: 'translateX(-50%)',
                                zIndex: 10,
                                pointerEvents: 'none'
                              }}
                            >
                              <Box sx={{
                                bgcolor: COLORS.black,
                                color: '#FFF',
                                px: 1.5,
                                py: 1,
                                borderRadius: '12px',
                                boxShadow: '0 10px 25px rgba(0,0,0,0.2)',
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                minWidth: 100,
                                position: 'relative',
                                '&::after': {
                                  content: '""',
                                  position: 'absolute',
                                  bottom: -6,
                                  left: '50%',
                                  transform: 'translateX(-50%)',
                                  borderLeft: '6px solid transparent',
                                  borderRight: '6px solid transparent',
                                  borderTop: `6px solid ${COLORS.black}`
                                }
                              }}>
                                <Typography sx={{ fontSize: 10, fontWeight: 700, opacity: 0.7, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                  {getTooltipLabel(hoveredIndex)}
                                </Typography>
                                <Typography sx={{ fontSize: 14, fontWeight: 800 }}>
                                  {data[hoveredIndex]} <Box component="span" sx={{ fontSize: 10, opacity: 0.8 }}>Students</Box>
                                </Typography>
                              </Box>
                            </motion.div>
                          )}
                        </AnimatePresence>

                        {/* X-Axis Labels */}
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1, px: 0.5 }}>
                          {(() => {
                            const labels: Record<string, string[]> = {
                              day: ["12am", "6am", "12pm", "6pm", "11pm"],
                              week: ["Mon", "Wed", "Fri", "Sun"],
                              month: ["Jan", "Mar", "May", "Jul", "Sep", "Nov"]
                            };
                            return (labels[range] || []).map(l => (
                              <Typography key={l} sx={{ fontSize: 10, fontWeight: 700, color: COLORS.textSecondary }}>{l}</Typography>
                            ));
                          })()}
                        </Box>
                      </Box>
                    );
                  })()}
                </Box>
              </Box>

              {/* Response Efficiency Stats */}
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Box sx={{ p: 3, borderRadius: '16px', border: '2px dashed #94A3B880', backgroundColor: '#FFFFFF', flex: 1, boxShadow: '0 10px 40px rgba(0, 0, 0, 0.05)' }}>
                  <Typography sx={{ fontSize: 11, fontWeight: 700, color: COLORS.textSecondary, textTransform: 'uppercase', letterSpacing: '0.05em', mb: 1 }}>Most Delayed Responder</Typography>
                  <Typography sx={{ fontSize: 24, fontWeight: 800 }}>{delayedOrg.name}</Typography>
                  <Box sx={{
                    display: 'inline-flex',
                    mt: 1.5,
                    px: 1.5,
                    py: 0.5,
                    borderRadius: '99px',
                    backgroundColor: '#F1F5F9',
                    border: '1px solid #64748B20'
                  }}>
                    <Typography sx={{ fontSize: 12, fontWeight: 800, color: COLORS.black }}>
                      {delayedOrg.avgDays} days average
                    </Typography>
                  </Box>
                </Box>
                <Box sx={{ p: 3, borderRadius: '16px', border: '2px dashed #94A3B880', backgroundColor: '#FFFFFF', flex: 1, boxShadow: '0 10px 40px rgba(0, 0, 0, 0.05)' }}>
                  <Typography sx={{ fontSize: 11, fontWeight: 700, color: COLORS.textSecondary, textTransform: 'uppercase', letterSpacing: '0.05em', mb: 1 }}>Fastest Organization</Typography>
                  <Typography sx={{ fontSize: 24, fontWeight: 800 }}>{fastestOrg.name}</Typography>
                  <Box sx={{
                    display: 'inline-flex',
                    mt: 1.5,
                    px: 1.5,
                    py: 0.5,
                    borderRadius: '99px',
                    backgroundColor: '#FEF08A',
                    border: '1px solid #a1620720'
                  }}>
                    <Typography sx={{ fontSize: 12, fontWeight: 800, color: '#a16207' }}>
                      {fastestOrg.avgDays} days average
                    </Typography>
                  </Box>
                </Box>
              </Box>
            </Box>


          </Box>
        )
      ) : active === "settings" ? (
        loadingSettings ? (
          <SettingsContainer>
            {/* Header Skeleton */}
            <Box sx={{ mb: 4 }}>
              <Skeleton variant="text" width={180} height={40} sx={{ mb: 1, borderRadius: '4px' }} />
              <Skeleton variant="text" width={320} height={20} sx={{ borderRadius: '4px' }} />
            </Box>

            {/* Profile Picture Section Skeleton */}
            <Box sx={{ 
              mb: 6, 
              display: 'flex', 
              flexDirection: { xs: 'column', sm: 'row' }, 
              alignItems: 'center', 
              gap: { xs: 2.5, sm: 4 },
              textAlign: { xs: 'center', sm: 'left' }
            }}>
              <Skeleton variant="circular" width={100} height={100} />
              <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: { xs: 'center', sm: 'flex-start' } }}>
                <Skeleton variant="text" width={150} height={24} sx={{ mb: 1 }} />
                <Box sx={{ display: 'flex', gap: 2 }}>
                  <Skeleton variant="rectangular" width={100} height={36} sx={{ borderRadius: '8px' }} />
                  <Skeleton variant="rectangular" width={80} height={36} sx={{ borderRadius: '8px' }} />
                </Box>
              </Box>
            </Box>

            {/* Form Fields Skeletons */}
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              {/* Row 1: Names */}
              <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, gap: 3 }}>
                <Box sx={{ flex: 1 }}>
                  <Skeleton variant="text" width={80} height={20} sx={{ mb: 1 }} />
                  <Skeleton variant="rectangular" height={45} sx={{ borderRadius: '8px' }} />
                </Box>
                <Box sx={{ flex: 1 }}>
                  <Skeleton variant="text" width={80} height={20} sx={{ mb: 1 }} />
                  <Skeleton variant="rectangular" height={45} sx={{ borderRadius: '8px' }} />
                </Box>
              </Box>

              {/* Row 2: Email */}
              <Box>
                <Skeleton variant="text" width={80} height={20} sx={{ mb: 1 }} />
                <Skeleton variant="rectangular" height={45} sx={{ borderRadius: '8px' }} />
              </Box>

              {/* Row 3: Passwords */}
              <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, gap: 3 }}>
                <Box sx={{ flex: 1 }}>
                  <Skeleton variant="text" width={100} height={20} sx={{ mb: 1 }} />
                  <Skeleton variant="rectangular" height={45} sx={{ borderRadius: '8px' }} />
                </Box>
                <Box sx={{ flex: 1 }}>
                  <Skeleton variant="text" width={120} height={20} sx={{ mb: 1 }} />
                  <Skeleton variant="rectangular" height={45} sx={{ borderRadius: '8px' }} />
                </Box>
              </Box>
            </Box>

            {/* Footer Buttons */}
            <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, gap: 2, mt: 6 }}>
              <Skeleton variant="rectangular" height={45} sx={{ borderRadius: '8px', width: { xs: '100%', sm: 140 } }} />
              <Skeleton variant="rectangular" height={45} sx={{ borderRadius: '8px', width: { xs: '100%', sm: 160 } }} />
            </Box>
          </SettingsContainer>
        ) : (
          <SettingsContainer>
            <SettingsHeader
              title="Settings"
              subtitle="Manage your administrative account settings"
            />

            <SettingsSection>
              <ProfilePictureSection
                avatarUrl={getAbsoluteUrl(avatarUrl)}
                initials={getInitials(draftFullName)}
                onFileSelect={async (file) => {
                  try {
                    const formData = new FormData();
                    formData.append('avatar', file);
                    const res = await api.post("/auth/avatar", formData, {
                      headers: { 'Content-Type': 'multipart/form-data' }
                    });
                    setAvatarUrl(res.data.avatarUrl);
                    updateLocalAvatar(res.data.avatarUrl);
                  } catch (err: any) {
                    console.error("Upload failed:", err);
                  }
                }}
                onDelete={async () => {
                  try {
                    await api.put("/auth/profile", { avatarUrl: "" });
                    setAvatarUrl("");
                    updateLocalAvatar("");
                  } catch (err) {
                    console.error("Delete failed:", err);
                  }
                }}
              />
            </SettingsSection>

            <SettingsSection>
              <SettingsRow>
                <SettingsField label="First name">
                  <TextField
                    fullWidth
                    name="first-name"
                    autoComplete="given-name"
                    value={draftFirst}
                    onChange={(e) => setDraftFirst(e.target.value)}
                    sx={{ '& .MuiOutlinedInput-root': { borderRadius: '8px', bgcolor: '#FFF' } }}
                  />
                </SettingsField>
                <SettingsField label="Last name">
                  <TextField
                    fullWidth
                    name="last-name"
                    autoComplete="family-name"
                    value={draftLast}
                    onChange={(e) => setDraftLast(e.target.value)}
                    sx={{ '& .MuiOutlinedInput-root': { borderRadius: '8px', bgcolor: '#FFF' } }}
                  />
                </SettingsField>
              </SettingsRow>
            </SettingsSection>

            <SettingsSection>
              <SettingsField label="Email">
                <TextField
                  fullWidth
                  name="real-email"
                  autoComplete="email"
                  value={email}
                  disabled
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: '8px',
                      backgroundColor: '#F8FAFC'
                    }
                  }}
                />
              </SettingsField>
            </SettingsSection>

            <SettingsSection>
              <SettingsRow>
                <SettingsField label="New password">
                  <TextField
                    type="password"
                    fullWidth
                    placeholder="Enter new password"
                    autoComplete="new-password"
                    value={newPass}
                    onChange={(e) => setNewPass(e.target.value)}
                    sx={{ '& .MuiOutlinedInput-root': { borderRadius: '8px', bgcolor: '#FFF' } }}
                  />
                </SettingsField>
                <SettingsField label="Confirm password">
                  <TextField
                    type="password"
                    fullWidth
                    placeholder="Confirm new password"
                    autoComplete="new-password"
                    value={confirmPass}
                    onChange={(e) => setConfirmPass(e.target.value)}
                    sx={{ '& .MuiOutlinedInput-root': { borderRadius: '8px', bgcolor: '#FFF' } }}
                  />
                </SettingsField>
              </SettingsRow>
            </SettingsSection>

            <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, gap: 2, mt: 4 }}>
              <Button
                variant="contained"
                onClick={(e) => { e.preventDefault(); updateProfile(); }}
                sx={{
                  backgroundColor: '#3c4043',
                  color: '#FFF',
                  padding: '12px 16px',
                  borderRadius: '8px',
                  width: { xs: '100%', sm: 'auto' },
                  textTransform: 'none',
                  fontWeight: 700,
                  fontSize: '1rem',
                  boxShadow: '0 4px 10px rgba(0,0,0,0.15)',
                  '&:hover': {
                    backgroundColor: '#202124',
                    transform: 'translateY(-1px)',
                    boxShadow: '0 6px 15px rgba(0,0,0,0.2)',
                  },
                  transition: 'all 0.2s ease'
                }}
              >
                Save Profile
              </Button>
              <Button
                variant="outlined"
                onClick={updatePassword}
                sx={{
                  color: '#000',
                  borderColor: '#000',
                  borderWidth: '1.2px',
                  padding: '12px 16px',
                  borderRadius: '8px',
                  width: { xs: '100%', sm: 'auto' },
                  textTransform: 'none',
                  fontWeight: 700,
                  fontSize: '1rem',
                  backgroundColor: '#FFF',
                  boxShadow: '0 4px 10px rgba(0,0,0,0.15)',
                  '&:hover': {
                    borderColor: '#CBD5E1',
                    bgcolor: '#F8FAFC',
                    transform: 'translateY(-1px)',
                    boxShadow: '0 6px 15px rgba(0,0,0,0.2)'
                  },
                  transition: 'all 0.2s ease'
                }}
              >
                Update Password
              </Button>
            </Box>
          </SettingsContainer>
        )
      ) : (
        <Box sx={{ px: isSmallMobile ? 1 : 2, pt: 0, pb: isSmallMobile ? 2 : 4, backgroundColor: COLORS.pageBg, minHeight: '100vh', fontFamily: fontStack }}>
          {(() => {
            const config: Record<string, { title: string; desc: string; }> = {
              users: { title: "User Management", desc: "Manage students and officers" },
              organizations: { title: "Institutional Organizations", desc: "Manage signatory entities & codes" },
              terms: { title: "Academic Terms", desc: "Active configuration" },
              records: { title: "System Records", desc: "Activity and audit logs" },
              quotes: { title: "Dashboard Quotes", desc: "Manage motivational quotes" },
              "institution-requests": { title: "Institution Profile", desc: "Manage your institution details" }
            };
            const item = config[active as keyof typeof config];
            if (!item || active === "users" || active === "terms" || active === "organizations" || active === "records") return null;

            return (
              <Box mb={3} sx={{
                p: 0,
                display: 'flex',
                flexDirection: isSmallMobile ? 'column' : 'row',
                justifyContent: 'space-between',
                alignItems: isSmallMobile ? 'flex-start' : 'center',
                gap: isSmallMobile ? 2 : 0
              }}>
                <Box>
                  {childLoading ? (
                    <>
                      <Skeleton variant="text" width={isSmallMobile ? 200 : 300} height={isSmallMobile ? 36 : 48} sx={{ borderRadius: '8px' }} />
                      <Skeleton variant="text" width={isSmallMobile ? 240 : 350} height={isSmallMobile ? 18 : 22} sx={{ mt: 1, borderRadius: '8px' }} />
                    </>
                  ) : (
                    <>
                      <Typography variant={isSmallMobile ? "h5" : "h3"} sx={{
                        fontFamily: fontStack,
                        fontWeight: 800,
                        fontSize: isSmallMobile ? '1.5rem' : '2.25rem',
                        letterSpacing: '-0.03em',
                        color: COLORS.textPrimary,
                        lineHeight: 1.15,
                      }}>
                        {item.title}
                      </Typography>
                      <Typography sx={{
                        fontFamily: fontStack,
                        fontSize: isSmallMobile ? 13 : 16,
                        color: COLORS.textSecondary,
                        mt: 0.5,
                      }}>
                        {item.desc}
                      </Typography>
                    </>
                  )}
                </Box>

              </Box>
            );
          })()}
          {active === "users" && <UsersTable refreshTrigger={refreshTrigger} onLoadingChange={setChildLoading} />}
          {active === "organizations" && <AdminOrganizationsPage refreshTrigger={refreshTrigger} onLoadingChange={setChildLoading} />}

          {active === "terms" && <AdminTermsPage refreshTrigger={refreshTrigger} onLoadingChange={setChildLoading} />}
          {active === "quotes" && <AdminQuotesPage refreshTrigger={refreshTrigger} onLoadingChange={setChildLoading} />}
          {active === "records" && <AdminRecordsPage refreshTrigger={refreshTrigger} onLoadingChange={setChildLoading} />}
          {active === "institution-requests" && <AdminInstitutionRequests refreshTrigger={refreshTrigger} onLoadingChange={setChildLoading} />}
        </Box>
      )}
      <SuccessModal
        open={successModalOpen}
        onClose={() => setSuccessModalOpen(false)}
        title={successModalTitle}
        description={successModalDescription}
      />
      <PasswordConfirmModal
        open={passwordModalOpen}
        onClose={() => setPasswordModalOpen(false)}
        onConfirm={handleConfirmPasswordUpdate}
        loading={passwordUpdateLoading}
      />
    </>
  );
}
