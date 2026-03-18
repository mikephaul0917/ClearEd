import AdminInstitutionRequests from "./AdminInstitutionRequests";
import AdminOrganizationsPage from "./AdminOrganizationsPage";
import AdminTermsPage from "./AdminTermsPage";
import AdminQuotesPage from "./AdminQuotesPage";
import AdminRecordsPage from "./AdminRecordsPage";
import UsersTable from "../../components/UsersTable";
import RoleLayout from "../../components/layout/RoleLayout";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import IconButton from "@mui/material/IconButton";
import Tooltip from "@mui/material/Tooltip";
import { useLocation, useNavigate } from "react-router-dom";
import React, { useEffect, useMemo, useState } from "react";
import SuccessMessage from "../../components/SuccessMessage";
import { api, authService } from '../../services';
import { Divider } from "@mui/material";
import TextField from "@mui/material/TextField";
import FormControl from "@mui/material/FormControl";
import FormLabel from "@mui/material/FormLabel";
import { useTheme, useMediaQuery, Skeleton, Card, CardContent } from "@mui/material";
import PersonIcon from "@mui/icons-material/Person";
import SecurityIcon from "@mui/icons-material/Security";
import DashboardIcon from "@mui/icons-material/Dashboard";
import PeopleIcon from "@mui/icons-material/People";
import PendingActionsIcon from "@mui/icons-material/PendingActions";
import ErrorOutlineIcon from "@mui/icons-material/ErrorOutline";
import BusinessIcon from "@mui/icons-material/Business";
import RefreshIcon from "@mui/icons-material/Refresh";

// --- MODERN BENTO DESIGN SYSTEM ---
const COLORS = {
  pageBg: '#FFFFFF',
  surface: '#FFFFFF',
  black: '#0a0a0a',
  textPrimary: '#000000',
  textSecondary: '#64748B',
  accent: '#0a0a0a',
  teal: '#5fcca0',
  lavender: '#cb9bfb',
  yellow: '#FEF08A',
  orange: '#ff895d',
  border: '#E2E8F0',
  tableHead: '#F8FAFC',
  avatarBg: '#0F172A10',
  cardRadius: '16px',
  pillRadius: '999px',
};

const fontStack = "'Inter', 'Plus Jakarta Sans', 'Montserrat', sans-serif";

const glassCard = {
  borderRadius: COLORS.cardRadius,
  backgroundColor: 'rgba(255,255,255,0.65)',
  backdropFilter: 'blur(12px)',
  WebkitBackdropFilter: 'blur(12px)',
  border: '1px solid rgba(0,0,0,0.06)',
  boxShadow: 'none',
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
  const active: "dashboard" | "settings" | "users" | "organizations" | "terms" | "records" | "quotes" | "institution-requests" =
    isSettings ? "settings" :
      isUsers ? "users" :
        isOrganizations ? "organizations" :
          isTerms ? "terms" :
            isRecords ? "records" :
              isQuotes ? "quotes" :
                isInstitutionRequests ? "institution-requests" :
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


  useEffect(() => {
    if (location.pathname === "/admin") {
      nav("/admin/dashboard", { replace: true });
    }
  }, [location.pathname, nav]);

  useEffect(() => {
    try {
      const savedUsername = localStorage.getItem("username") || "";
      const base = savedUsername || (email || "").split("@")[0];
      const parts = base.replace(/[._-]+/g, " ").split(" ").filter(Boolean);
      const first = parts[0] || "";
      const last = parts.slice(1).join(" ") || "";
      setProfileFirst(first);
      setProfileLast(last);
      setDraftFirst(first);
      setDraftLast(last);
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
    const words = fullName.split(" ").filter(Boolean);
    const first = words[0]?.[0] || "A";
    const second = words[1]?.[0] || "D";
    return (first + second).toUpperCase();
  }, [fullName]);

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
  const [orgApprovals, setOrgApprovals] = useState<{ name: string; count: number }[]>([]);
  const [delayedOrg, setDelayedOrg] = useState<{ name: string; avgDays: number }>({ name: "—", avgDays: 0 });
  const [fastestOrg, setFastestOrg] = useState<{ name: string; avgDays: number }>({ name: "—", avgDays: 0 });
  const [volume, setVolume] = useState<{ day: number[]; week: number[]; month: number[] }>({ day: [], week: [], month: [] });
  const [loadingDashboard, setLoadingDashboard] = useState(true);
  const [loadingSettings, setLoadingSettings] = useState(true);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [childLoading, setChildLoading] = useState(false);

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
  const StatCardSkeleton = ({
    height = 140,
    titleWidth = "30%", valueWidth = "40%", subWidth = "60%"
  }: {
    height?: number | string,
    titleWidth?: string | number, valueWidth?: string | number, subWidth?: string | number
  }) => (
    <Box sx={{
      p: 4, borderRadius: COLORS.cardRadius,
      backgroundColor: 'rgba(0,0,0,0.03)',
      border: `1px solid ${COLORS.border}`,
      minHeight: height, display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
      position: 'relative', overflow: 'hidden',
    }}>
      <Box>
        <Skeleton variant="text" width={titleWidth} height={14} sx={{ mb: 1.5, bgcolor: 'rgba(0,0,0,0.05)' }} />
        <Skeleton variant="text" width={valueWidth} height={42} sx={{ bgcolor: 'rgba(0,0,0,0.04)' }} />
      </Box>
      <Skeleton variant="text" width={subWidth} height={16} sx={{ bgcolor: 'rgba(0,0,0,0.03)' }} />
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
      setNotice({ message: "Passwords do not match", variant: "error" });
      return;
    }
    try {
      await api.put("/auth/password", { newPassword: newPass });
      setNotice({ message: "Password updated", variant: "success" });
      setNewPass("");
      setConfirmPass("");
    } catch (err: any) {
      const msg = err.response?.data?.message || "Failed to update password";
      setNotice({ message: msg, variant: "error" });
    }
  };

  return (
    <RoleLayout>
      {notice && (
        <SuccessMessage
          message={notice.message}
          variant={notice.variant}
          onClose={() => setNotice(null)}
        />
      )}
      {active === "dashboard" ? (
        loadingDashboard ? (
          <Box sx={{ p: isSmallMobile ? 2 : 4, backgroundColor: COLORS.pageBg, minHeight: '100vh', fontFamily: fontStack }}>
            <Skeleton variant="text" width={240} height={isSmallMobile ? 36 : 48} sx={{ mb: 0.5, borderRadius: '8px' }} />
            <Skeleton variant="text" width={300} height={isSmallMobile ? 18 : 22} sx={{ mb: 3, borderRadius: '8px' }} />
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '2fr 1fr' }, gap: 2, mb: 2 }}>
              <Skeleton variant="rounded" height={isSmallMobile ? 180 : 220} sx={{ borderRadius: COLORS.cardRadius }} />
              <Box sx={{ display: 'grid', gridTemplateRows: '1fr 1fr', gap: 2 }}>
                <Skeleton variant="rounded" height="100%" sx={{ borderRadius: COLORS.cardRadius }} />
                <Skeleton variant="rounded" height="100%" sx={{ borderRadius: COLORS.cardRadius }} />
              </Box>
            </Box>
            <Skeleton variant="text" width={140} height={20} sx={{ mb: 1.5, mt: 3, borderRadius: '8px' }} />
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(3, 1fr)' }, gap: 2 }}>
              {[1, 2, 3, 4, 5, 6].map((i) => <Skeleton key={i} variant="rounded" height={160} sx={{ borderRadius: COLORS.cardRadius }} />)}
            </Box>
          </Box>
        ) : (
          <Box sx={{ p: isSmallMobile ? 2 : 4, backgroundColor: COLORS.pageBg, minHeight: '100vh', fontFamily: fontStack }}>
            {/* ── Header ──────────────────────────────────────────────────── */}
            <Typography
              sx={{
                fontFamily: fontStack,
                fontWeight: 800,
                fontSize: isSmallMobile ? '1.5rem' : '2.25rem',
                letterSpacing: '-0.03em',
                color: COLORS.textPrimary,
                lineHeight: 1.15,
              }}
            >
              Admin Dashboard
            </Typography>
            <Typography
              sx={{
                fontFamily: fontStack,
                fontSize: isSmallMobile ? 13 : 16,
                color: COLORS.textSecondary,
                mb: 3,
                mt: 0.5,
              }}
            >
              Institutional overview and administration tools
            </Typography>

            {/* ── Bento Row 1 — Hero Stats ────────────────────────────────── */}
            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: { xs: '1fr', md: '2fr 1fr' },
                gap: 2,
                mb: 2,
              }}
            >
              {/* Hero Card — Black */}
              <Box
                sx={{
                  position: 'relative',
                  backgroundColor: COLORS.black,
                  borderRadius: COLORS.cardRadius,
                  p: isSmallMobile ? 3 : 4,
                  minHeight: isSmallMobile ? 180 : 220,
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  overflow: 'hidden',
                }}
              >
                {/* Decorative blurred accent circles */}
                <Box sx={{
                  position: 'absolute', top: -40, right: -40, width: 160, height: 160,
                  borderRadius: '50%', backgroundColor: COLORS.teal, opacity: 0.12,
                  filter: 'blur(50px)', pointerEvents: 'none',
                }} />
                <Box sx={{
                  position: 'absolute', bottom: -30, left: -30, width: 120, height: 120,
                  borderRadius: '50%', backgroundColor: COLORS.lavender, opacity: 0.10,
                  filter: 'blur(40px)', pointerEvents: 'none',
                }} />

                <Box sx={{ position: 'relative', zIndex: 1 }}>
                  <Box sx={{
                    display: 'inline-block',
                    fontFamily: fontStack, fontSize: 11, fontWeight: 700,
                    letterSpacing: '0.1em', textTransform: 'uppercase',
                    color: 'rgba(255,255,255,0.45)', mb: 1.5,
                  }}>
                    Overview
                  </Box>
                  <Typography sx={{
                    fontFamily: fontStack, fontWeight: 800,
                    fontSize: isSmallMobile ? '1.35rem' : '1.75rem',
                    letterSpacing: '-0.5px', color: '#FFFFFF', lineHeight: 1.2, mb: 1,
                  }}>
                    Welcome back, {fullName}
                  </Typography>
                  <Typography sx={{
                    fontFamily: fontStack, fontSize: isSmallMobile ? 13 : 15,
                    color: 'rgba(255,255,255,0.6)', lineHeight: 1.7,
                  }}>
                    Your institution is running smoothly. All services operational.
                  </Typography>
                </Box>

                {/* Bottom stats row */}
                <Box sx={{
                  position: 'relative', zIndex: 1,
                  display: 'flex', gap: isSmallMobile ? 3 : 5, mt: 2,
                  flexWrap: 'wrap',
                }}>
                  {[
                    { label: 'Students', value: studentCount },
                    { label: 'Officers', value: officerCount },
                  ].map((s) => (
                    <Box key={s.label}>
                      <Typography sx={{ fontFamily: fontStack, fontSize: 11, color: 'rgba(255,255,255,0.4)', fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                        {s.label}
                      </Typography>
                      <Typography sx={{ fontFamily: fontStack, fontSize: isSmallMobile ? 22 : 28, fontWeight: 800, color: '#FFFFFF', letterSpacing: '-1px' }}>
                        {s.value}
                      </Typography>
                    </Box>
                  ))}
                </Box>
              </Box>

              {/* Right column — two stacked accent cards */}
              <Box sx={{ display: 'grid', gridTemplateRows: '1fr 1fr', gap: 2 }}>
                {/* System Status — Teal */}
                <Box
                  sx={{
                    backgroundColor: COLORS.teal,
                    borderRadius: COLORS.cardRadius,
                    p: isSmallMobile ? 2.5 : 3,
                    display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
                    position: 'relative', overflow: 'hidden',
                  }}
                >
                  <Box sx={{
                    display: 'inline-block', fontFamily: fontStack,
                    fontSize: 11, fontWeight: 700, letterSpacing: '0.1em',
                    textTransform: 'uppercase', color: 'rgba(0,0,0,0.4)', mb: 1,
                  }}>
                    Requests
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Typography sx={{
                      fontFamily: fontStack, fontWeight: 800,
                      fontSize: isSmallMobile ? 24 : 32, color: COLORS.black,
                      letterSpacing: '-1px',
                    }}>
                      {totalRequests}
                    </Typography>
                    <Typography sx={{
                      fontFamily: fontStack, fontWeight: 600,
                      fontSize: 12, color: 'rgba(0,0,0,0.5)', mt: 1
                    }}>
                      Total submissions
                    </Typography>
                  </Box>
                </Box>

                {/* Security — Lavender */}
                <Box
                  sx={{
                    backgroundColor: COLORS.lavender,
                    borderRadius: COLORS.cardRadius,
                    p: isSmallMobile ? 2.5 : 3,
                    display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
                    position: 'relative', overflow: 'hidden',
                  }}
                >
                  <Box sx={{
                    display: 'inline-block', fontFamily: fontStack,
                    fontSize: 11, fontWeight: 700, letterSpacing: '0.1em',
                    textTransform: 'uppercase', color: 'rgba(0,0,0,0.4)', mb: 1,
                  }}>
                    Pending Issues
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Typography sx={{
                      fontFamily: fontStack, fontWeight: 800,
                      fontSize: isSmallMobile ? 24 : 32, color: COLORS.black,
                      letterSpacing: '-1px',
                    }}>
                      {pendingRequests}
                    </Typography>
                    <Typography sx={{
                      fontFamily: fontStack, fontWeight: 600,
                      fontSize: 12, color: 'rgba(0,0,0,0.5)', mt: 1
                    }}>
                      Requires attention
                    </Typography>
                  </Box>
                </Box>
              </Box>
            </Box>

            {/* ── Section Label ────────────────────────────────────────────── */}
            <Box sx={{
              fontFamily: fontStack, fontSize: 11, fontWeight: 700,
              letterSpacing: '0.1em', textTransform: 'uppercase',
              color: COLORS.textSecondary, mt: isSmallMobile ? 3 : 4, mb: 2,
            }}>
              Quick Access
            </Box>

            {/* ── Bento Row 2 — Quick Management Cards ────────────────────── */}
            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(3, 1fr)' },
                gap: 2,
              }}
            >
              {[
                { title: "Manage Users", onClick: () => nav("/admin/users"), desc: "Add students and staff", color: COLORS.teal },
                { title: "Organizations", onClick: () => nav("/admin/organizations"), desc: "Signatory structure & codes", color: COLORS.lavender },
                { title: "AY & Term", onClick: () => nav("/admin/terms"), desc: "Active configuration", color: COLORS.orange },
                { title: "System Records", onClick: () => nav("/admin/records"), desc: "View activity logs", color: '#94A3B8' },
                { title: "Institution Info", onClick: () => nav("/admin/institution-requests"), desc: "Manage profile", color: COLORS.lavender }
              ].map((tile) => (
                <Box
                  key={tile.title}
                  onClick={tile.onClick}
                  sx={{
                    position: 'relative',
                    p: isSmallMobile ? 2.5 : 3,
                    borderRadius: COLORS.cardRadius,
                    backgroundColor: 'rgba(255,255,255,0.65)',
                    backdropFilter: 'blur(12px)',
                    WebkitBackdropFilter: 'blur(12px)',
                    border: '1px solid rgba(0,0,0,0.06)',
                    cursor: 'pointer',
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    minHeight: isSmallMobile ? 140 : 160,
                    '&:hover': {
                      backgroundColor: 'rgba(255,255,255,0.95)',
                      transform: 'translateY(-5px) scale(1.01)',
                      boxShadow: '0 20px 40px -12px rgba(0,0,0,0.08)',
                      borderColor: 'rgba(0,0,0,0.12)',
                      '& .accent-bar': { height: 24 }
                    }
                  }}
                >
                  <Box sx={{
                    position: 'absolute', top: 0, left: 0, right: 0, height: 6,
                    backgroundColor: tile.color, opacity: 0.15,
                    borderTopLeftRadius: COLORS.cardRadius, borderTopRightRadius: COLORS.cardRadius,
                  }} />

                  <Box>
                    <Typography sx={{
                      fontFamily: fontStack, fontWeight: 800,
                      fontSize: isSmallMobile ? '1.05rem' : '1.15rem', color: COLORS.textPrimary,
                      letterSpacing: '-0.3px', mb: 0.5,
                    }}>
                      {tile.title}
                    </Typography>
                    <Typography sx={{
                      fontFamily: fontStack, fontSize: isSmallMobile ? 12 : 13,
                      color: COLORS.textSecondary, fontWeight: 500, lineHeight: 1.5,
                    }}>
                      {tile.desc}
                    </Typography>
                  </Box>

                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mt: 2 }}>
                    <Box className="accent-bar" sx={{
                      width: 4, height: 16, borderRadius: 2, backgroundColor: tile.color,
                      transition: 'height 0.3s'
                    }} />
                    <Typography sx={{
                      fontFamily: fontStack, fontSize: 11, fontWeight: 700,
                      color: COLORS.black, textTransform: 'uppercase', letterSpacing: '0.05em'
                    }}>
                      Open Module →
                    </Typography>
                  </Box>
                </Box>
              ))}
            </Box>

            {/* ── Analytics Panels Section ────────────────────────────────── */}
            <Typography sx={{
              fontFamily: fontStack, fontSize: 11, fontWeight: 700,
              letterSpacing: '0.1em', textTransform: 'uppercase',
              color: COLORS.textSecondary, mt: isSmallMobile ? 3 : 4, mb: 2,
            }}>
              Detailed Analytics
            </Typography>
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: '2fr 1fr' }, gap: 2, mb: 3 }}>
              {/* Dept Approvals Card */}
              <Box sx={{ ...glassCard, p: 4, backgroundColor: COLORS.teal + '05' }}>
                <Typography sx={{ fontWeight: 700, mb: 3, fontSize: 18, fontFamily: fontStack }}>Approvals per Organization</Typography>
                <Box display="flex" flexDirection="column" gap={2}>
                  {orgApprovals.map((d) => (
                    <Box key={d.name}>
                      <Box display="flex" justifyContent="space-between" mb={0.5}>
                        <Typography sx={{ fontSize: 14, fontWeight: 600, fontFamily: fontStack }}>{d.name}</Typography>
                        <Typography sx={{ fontSize: 14, fontWeight: 700, fontFamily: fontStack }}>{d.count}</Typography>
                      </Box>
                      <Box sx={{ width: '100%', height: 6, backgroundColor: '#E2E8F0', borderRadius: 3, overflow: 'hidden' }}>
                        <Box sx={{ width: `${Math.min(100, (d.count / (totalRequests || 1)) * 100)}%`, height: '100%', backgroundColor: COLORS.teal, borderRadius: 3 }} />
                      </Box>
                    </Box>
                  ))}
                </Box>
              </Box>

              {/* Speed Metrics Card */}
              <Box display="flex" flexDirection="column" gap={2}>
                <Box sx={{ ...glassCard, p: 3, backgroundColor: COLORS.lavender + '08' }}>
                  <Typography sx={{ fontWeight: 600, fontSize: 11, color: COLORS.textSecondary, textTransform: 'uppercase', mb: 1, fontFamily: fontStack, letterSpacing: '0.05em' }}>Most Delayed</Typography>
                  <Typography sx={{ fontSize: 20, fontWeight: 800, fontFamily: fontStack }}>{delayedOrg.name}</Typography>
                  <Typography sx={{ color: COLORS.orange, fontWeight: 700, fontSize: 14, fontFamily: fontStack }}>{delayedOrg.avgDays} days avg</Typography>
                </Box>
                <Box sx={{ ...glassCard, p: 3, backgroundColor: COLORS.teal + '08' }}>
                  <Typography sx={{ fontWeight: 600, fontSize: 11, color: COLORS.textSecondary, textTransform: 'uppercase', mb: 1, fontFamily: fontStack, letterSpacing: '0.05em' }}>Fastest Response</Typography>
                  <Typography sx={{ fontSize: 20, fontWeight: 800, fontFamily: fontStack }}>{fastestOrg.name}</Typography>
                  <Typography sx={{ color: '#059669', fontWeight: 700, fontSize: 14, fontFamily: fontStack }}>{fastestOrg.avgDays} days avg</Typography>
                </Box>
              </Box>
            </Box>

            {/* Row 3: Volume Chart */}
            <Box sx={{ ...glassCard, p: 4, mb: 4 }}>
              <Box display="flex" alignItems="center" justifyContent="space-between" mb={4}>
                <Typography sx={{ fontWeight: 800, fontSize: 18, fontFamily: fontStack }}>Clearance Volume Over Time</Typography>
                <Box sx={{ display: 'inline-flex', borderRadius: 9999, border: "1px solid #E5E7EB", p: 0.5, backgroundColor: '#F8FAFC' }}>
                  {(["day", "week", "month"] as const).map(r => (
                    <Button
                      key={r}
                      variant={range === r ? "contained" : "text"}
                      onClick={() => setRange(r)}
                      sx={{
                        borderRadius: 9999,
                        textTransform: 'none',
                        fontSize: 12,
                        px: 2,
                        backgroundColor: range === r ? COLORS.black : 'transparent',
                        color: range === r ? '#FFF' : COLORS.textSecondary,
                        fontFamily: fontStack,
                        fontWeight: 600,
                        '&:hover': { backgroundColor: range === r ? COLORS.black : '#F1F5F9' }
                      }}
                    >
                      {r.charAt(0).toUpperCase() + r.slice(1)}
                    </Button>
                  ))}
                </Box>
              </Box>
              <Box display="flex" alignItems="flex-end" gap={1.5} sx={{ height: 120, px: 2 }}>
                {(volume[range] || []).map((v, idx) => (
                  <Box key={idx} sx={{
                    flex: 1,
                    backgroundColor: COLORS.teal,
                    borderRadius: '4px 4px 0 0',
                    height: `${Math.max(10, Math.min(100, v * 10))}%`,
                    opacity: 0.8,
                    transition: 'height 0.3s'
                  }} />
                ))}
              </Box>
            </Box>
          </Box>
        )
      ) : active === "settings" ? (
        loadingSettings ? (
          <Box sx={{ backgroundColor: '#FAFAFA', minHeight: '100vh', py: 4 }}>
            <Box sx={{ maxWidth: '800px', mx: 'auto', px: 4, mb: 6 }}>
              <Skeleton variant="text" width={220} height={40} sx={{ mb: 1 }} />
              <Skeleton variant="text" width={320} height={22} />
            </Box>
            <Box sx={{ maxWidth: '800px', mx: 'auto', px: 4, display: 'flex', flexDirection: 'column', gap: 3 }}>
              <Skeleton variant="rounded" height={400} sx={{ borderRadius: '12px' }} />
              <Skeleton variant="rounded" height={400} sx={{ borderRadius: '12px' }} />
            </Box>
          </Box>
        ) : (
          <Box sx={{ backgroundColor: '#FAFAFA', minHeight: '100vh', py: isSmallMobile ? 2 : 4, fontFamily: fontStack }}>
            <Box sx={{ maxWidth: '800px', mx: 'auto', px: isSmallMobile ? 2 : 4, mb: isSmallMobile ? 4 : 6 }}>
              <Typography variant={isSmallMobile ? "h5" : "h3"} sx={{ fontWeight: 800, color: '#000000', fontSize: isSmallMobile ? '1.25rem' : '1.875rem' }}>
                Settings
              </Typography>
              <Typography variant="body1" sx={{ color: '#6B7280', fontSize: isSmallMobile ? '0.875rem' : '1rem' }}>
                Manage your administrative account settings
              </Typography>
              <style>{`
                input:-webkit-autofill,
                input:-webkit-autofill:hover,
                input:-webkit-autofill:focus {
                  -webkit-box-shadow: 0 0 0px 1000px #FFFFFF inset !important;
                  -webkit-text-fill-color: #000000 !important;
                  transition: background-color 5000s ease-in-out 0s;
                }
              `}</style>
            </Box>

            <Box sx={{ maxWidth: '800px', mx: 'auto', px: isSmallMobile ? 2 : 4, display: 'flex', flexDirection: 'column', gap: 3 }}>
              {/* Profile Card */}
              <Card sx={{ ...glassCard, borderRadius: '12px' }}>
                <CardContent sx={{ p: isSmallMobile ? 3 : 6 }}>
                  <Box sx={{ mb: 4, display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Box sx={{ width: 44, height: 44, borderRadius: '12px', backgroundColor: '#F3F4F6', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <PersonIcon sx={{ color: '#374151' }} />
                    </Box>
                    <Box>
                      <Typography variant="h6" sx={{ fontWeight: 700 }}>Profile Information</Typography>
                      <Typography sx={{ color: '#6B7280', fontSize: '0.875rem' }}>Update your personal details</Typography>
                    </Box>
                  </Box>

                  <Box component="form" autoComplete="off" display="flex" flexDirection="column" gap={3}>
                    {/* Honey-pot fields to catch aggressive autofill */}
                    <input type="text" name="email" style={{ display: 'none' }} tabIndex={-1} />
                    <input type="password" name="password" style={{ display: 'none' }} tabIndex={-1} />
                    
                    <Box>
                      <Typography sx={{ mb: 1, fontWeight: 500, fontSize: '0.875rem' }}>First Name</Typography>
                      <TextField
                        fullWidth
                        name="first-name"
                        autoComplete="given-name"
                        value={draftFirst}
                        onChange={(e) => setDraftFirst(e.target.value)}
                        sx={{ '& .MuiOutlinedInput-root': { borderRadius: '8px' } }}
                      />
                    </Box>
                    <Box>
                      <Typography sx={{ mb: 1, fontWeight: 500, fontSize: '0.875rem' }}>Last Name</Typography>
                      <TextField
                        fullWidth
                        name="last-name"
                        autoComplete="family-name"
                        value={draftLast}
                        onChange={(e) => setDraftLast(e.target.value)}
                        sx={{ '& .MuiOutlinedInput-root': { borderRadius: '8px' } }}
                      />
                    </Box>
                    <Box>
                      <Typography sx={{ mb: 1, fontWeight: 500, fontSize: '0.875rem', color: COLORS.textSecondary }}>Email Address (Locked)</Typography>
                      <TextField fullWidth name="real-email" autoComplete="email" value={email} disabled sx={{ '& .MuiOutlinedInput-root': { borderRadius: '8px', backgroundColor: '#F8FAFC' } }} />
                    </Box>
                    <Button
                      variant="contained"
                      onClick={(e) => { e.preventDefault(); updateProfile(); }}
                      type="submit"
                      sx={{
                        backgroundColor: '#000', color: '#FFF', py: 2, borderRadius: '8px', textTransform: 'none', fontWeight: 600,
                        '&:hover': { backgroundColor: '#111' }
                      }}
                    >
                      Save Changes
                    </Button>
                  </Box>
                </CardContent>
              </Card>

              {/* Security Card */}
              <Card sx={{ ...glassCard, borderRadius: '12px' }}>
                <CardContent sx={{ p: isSmallMobile ? 3 : 6 }}>
                  <Box sx={{ mb: 4, display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Box sx={{ width: 44, height: 44, borderRadius: '12px', backgroundColor: '#F3F4F6', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <SecurityIcon sx={{ color: '#374151' }} />
                    </Box>
                    <Box>
                      <Typography variant="h6" sx={{ fontWeight: 700 }}>Security</Typography>
                      <Typography sx={{ color: '#6B7280', fontSize: '0.875rem' }}>Change your password</Typography>
                    </Box>
                  </Box>

                  <Box display="flex" flexDirection="column" gap={3}>
                    <Box>
                      <Typography sx={{ mb: 1, fontWeight: 500, fontSize: '0.875rem' }}>New Password</Typography>
                      <TextField
                        type="password"
                        fullWidth
                        placeholder="Enter new password"
                        value={newPass}
                        onChange={(e) => setNewPass(e.target.value)}
                        sx={{ '& .MuiOutlinedInput-root': { borderRadius: '8px' } }}
                      />
                    </Box>
                    <Box>
                      <Typography sx={{ mb: 1, fontWeight: 500, fontSize: '0.875rem' }}>Confirm New Password</Typography>
                      <TextField
                        type="password"
                        fullWidth
                        placeholder="Confirm new password"
                        value={confirmPass}
                        onChange={(e) => setConfirmPass(e.target.value)}
                        sx={{ '& .MuiOutlinedInput-root': { borderRadius: '8px' } }}
                      />
                    </Box>
                    <Button
                      variant="contained"
                      onClick={updatePassword}
                      sx={{
                        backgroundColor: '#000', color: '#FFF', py: 2, borderRadius: '8px', textTransform: 'none', fontWeight: 600,
                        '&:hover': { backgroundColor: '#111' }
                      }}
                    >
                      Update Password
                    </Button>
                  </Box>
                </CardContent>
              </Card>
            </Box>
          </Box>
        )
      ) : (
        <Box sx={{ p: isSmallMobile ? 2 : 4, backgroundColor: COLORS.pageBg, minHeight: '100vh', fontFamily: fontStack }}>
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
            if (!item) return null;

            return (
              <Box mb={4} sx={{
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

                <Box sx={{ display: 'flex', gap: 1.5, width: isSmallMobile ? '100%' : 'auto' }}>
                  {childLoading ? (
                    <Skeleton
                      variant="rounded"
                      width={100}
                      height={36}
                      sx={{ borderRadius: COLORS.pillRadius }}
                    />
                  ) : (
                    <Button
                      disableElevation
                      startIcon={<RefreshIcon />}
                      onClick={() => setRefreshTrigger(prev => prev + 1)}
                      sx={{
                        fontFamily: fontStack, fontWeight: 600, fontSize: 13,
                        borderRadius: COLORS.pillRadius,
                        bgcolor: COLORS.black, color: '#FFFFFF',
                        textTransform: 'none', px: 3, py: 1,
                        '&:hover': { bgcolor: '#222' }
                      }}
                    >
                      Refresh
                    </Button>
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
    </RoleLayout>
  );
}
