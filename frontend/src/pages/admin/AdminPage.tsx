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
import SuccessMessage from "../../components/SuccessMessage";
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
  black: '#000000',
  textPrimary: '#000000',
  textSecondary: '#64748B',
  accent: '#000000',
  teal: '#5EEAD4',
  tealDark: '#0D9488',
  blue: '#B0E0E6',
  blueDark: '#0369A1',
  yellow: '#FEF08A',
  yellowDark: '#B45309',
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
      const savedUsername = localStorage.getItem("username") || fullUser?.fullName || fullUser?.firstName || "";
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
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', lg: 'repeat(4, 1fr)' }, gap: 2 }}>
              {[1, 2, 3, 4].map((i) => <Skeleton key={i} variant="rounded" height={160} sx={{ borderRadius: COLORS.cardRadius }} />)}
            </Box>
          </Box>
        ) : (
          <Box sx={{ px: isSmallMobile ? 2 : 2.5, pt: isSmallMobile ? 2 : 2.5, pb: isSmallMobile ? 2 : 4, backgroundColor: COLORS.pageBg, minHeight: '100vh', fontFamily: fontStack }}>
            {/* ── Dashboard Header ────────────────────────────────────────── */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
              <Typography
                sx={{
                  fontFamily: fontStack,
                  fontWeight: 800,
                  fontSize: isSmallMobile ? '1.75rem' : '2.5rem',
                  letterSpacing: '-0.04em',
                  color: COLORS.textPrimary,
                }}
              >
                Overview
              </Typography>
              <Button
                variant="contained"
                onClick={() => nav("/admin/users")}
                sx={{
                  backgroundColor: COLORS.black,
                  color: '#FFFFFF',
                  borderRadius: COLORS.pillRadius,
                  textTransform: 'none',
                  fontWeight: 800,
                  fontSize: 14,
                  px: 4,
                  py: 1.5,
                  display: 'flex',
                  alignItems: 'center',
                  boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.4), 0 4px 6px -2px rgba(0, 0, 0, 0.1)',
                  '&:hover': { 
                    backgroundColor: '#111',
                    boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.5), 0 10px 10px -5px rgba(0, 0, 0, 0.1)',
                    transform: 'translateY(-1px)'
                  },
                  transition: 'all 0.2s ease'
                }}
              >
                New student
              </Button>
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
                { label: 'Approved Clearances', value: completedRequests, color: COLORS.tealDark, trend: '+12%' },
                { label: 'Rejected Clearances', value: rejectedRequests, color: '#000000', trend: '-2%' },
                { label: 'Pending Clearances', value: pendingRequests, color: COLORS.yellowDark, trend: '+5%' },
                { label: 'New Students', value: studentCount, color: COLORS.blueDark, trend: '+18%' },
              ].map((s) => (
                <Box
                  key={s.label}
                  sx={{
                    p: 3,
                    borderRadius: '16px',
                    border: '1px solid #F1F5F9',
                    backgroundColor: '#FFFFFF',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    minHeight: 120,
                    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.03), 0 1px 2px rgba(0, 0, 0, 0.02)',
                    '&:hover': {
                      boxShadow: '0 10px 30px rgba(0, 0, 0, 0.04)',
                      transform: 'translateY(-2px)'
                    },
                    transition: 'all 0.3s ease'
                  }}
                >
                  <Typography sx={{ fontSize: 13, fontWeight: 600, color: COLORS.textSecondary, mb: 1 }}>{s.label}</Typography>
                  <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 1.5 }}>
                    <Typography sx={{ fontSize: 28, fontWeight: 800, color: COLORS.textPrimary, letterSpacing: '-0.02em' }}>
                      {s.value.toLocaleString()}
                    </Typography>
                    <Typography sx={{ fontSize: 13, fontWeight: 700, color: s.color }}>
                      ↑ {s.trend}
                    </Typography>
                  </Box>
                </Box>
              ))}
            </Box>

            {/* ── Analytics & Volume ───────────────────────────────────────── */}
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: '2fr 1fr' }, gap: 2, mb: 4 }}>
              {/* Clearance Volume Chart */}
              <Box sx={{ p: 4, borderRadius: '16px', border: '1px solid #E2E8F0', backgroundColor: '#FFFFFF' }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                  <Typography sx={{ fontWeight: 800, fontSize: 18 }}>Clearance Volume</Typography>
                  <Box sx={{ display: 'flex', border: '1px solid #E2E8F0', borderRadius: '10px', p: 0.5, bgcolor: '#F8FAFC' }}>
                    {['day', 'week', 'month'].map(r => (
                      <Button
                        key={r}
                        onClick={() => setRange(r as any)}
                        sx={{
                          fontSize: 11, fontWeight: 700, px: 2, py: 0.5, borderRadius: '8px', textTransform: 'none',
                          color: range === r ? '#FFF' : COLORS.textSecondary,
                          bgcolor: range === r ? COLORS.black : 'transparent',
                          '&:hover': { bgcolor: range === r ? COLORS.black : '#F1F5F9' }
                        }}
                      >
                        {r.charAt(0).toUpperCase() + r.slice(1)}
                      </Button>
                    ))}
                  </Box>
                </Box>
                
                {/* Volume visualization (True SVG Line Chart) */}
                <Box sx={{ height: 220, width: '100%', pt: 4, position: 'relative' }}>
                  {(() => {
                    const data = volume[range] || [];
                    if (data.length < 2) return (
                      <Box sx={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Typography sx={{ color: COLORS.textSecondary, fontSize: 13, fontWeight: 500 }}>Gathering data points...</Typography>
                      </Box>
                    );
                    
                    const maxV = Math.max(...data, 10);
                    const width = 1000;
                    const height = 180;
                    const gap = width / (data.length - 1);
                    
                    // Generate points for the smooth line
                    const points = data.map((v, i) => `${i * gap},${height - (v / maxV * height)}`).join(' ');
                    const areaPoints = `0,${height} ${points} ${width},${height}`;

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
                          <polyline points={areaPoints} fill="url(#chartGradient)" />
                          
                          {/* Smooth Line */}
                          <polyline
                            points={points}
                            fill="none"
                            stroke={COLORS.blue}
                            strokeWidth="3"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            style={{ filter: `drop-shadow(0 4px 8px ${COLORS.blue}88)` }}
                          />

                          {/* Data Points */}
                          {data.map((v, i) => (
                            <circle
                              key={i}
                              cx={i * gap}
                              cy={height - (v / maxV * height)}
                              r={i === data.length - 1 ? 5 : 0}
                              fill={COLORS.blue}
                              stroke="#FFFFFF"
                              strokeWidth="2"
                            />
                          ))}
                        </svg>
                        
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
                <Box sx={{ p: 3, borderRadius: '16px', border: '2px dashed #94A3B880', backgroundColor: '#FFFFFF', flex: 1 }}>
                  <Typography sx={{ fontSize: 11, fontWeight: 700, color: COLORS.textSecondary, textTransform: 'uppercase', letterSpacing: '0.05em', mb: 1 }}>Most Delayed Responder</Typography>
                  <Typography sx={{ fontSize: 24, fontWeight: 800 }}>{delayedOrg.name}</Typography>
                  <Typography sx={{ fontSize: 14, fontWeight: 700, color: COLORS.yellowDark, mt: 1 }}>{delayedOrg.avgDays} days average</Typography>
                </Box>
                <Box sx={{ p: 3, borderRadius: '16px', border: '2px dashed #94A3B880', backgroundColor: '#FFFFFF', flex: 1 }}>
                  <Typography sx={{ fontSize: 11, fontWeight: 700, color: COLORS.textSecondary, textTransform: 'uppercase', letterSpacing: '0.05em', mb: 1 }}>Fastest Organization</Typography>
                  <Typography sx={{ fontSize: 24, fontWeight: 800 }}>{fastestOrg.name}</Typography>
                  <Typography sx={{ fontSize: 14, fontWeight: 700, color: COLORS.tealDark, mt: 1 }}>{fastestOrg.avgDays} days average</Typography>
                </Box>
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

            <Box sx={{ display: 'flex', gap: 2, mt: 4 }}>
              <Button
                variant="contained"
                onClick={(e) => { e.preventDefault(); updateProfile(); }}
                sx={{
                  backgroundColor: '#000', color: '#FFF', py: 1.5, px: 4, borderRadius: '8px', textTransform: 'none', fontWeight: 600,
                  '&:hover': { backgroundColor: '#111' }
                }}
              >
                Save Profile
              </Button>
              <Button
                variant="outlined"
                onClick={updatePassword}
                sx={{
                  color: '#000', borderColor: '#D1D5DB', py: 1.5, px: 4, borderRadius: '8px', textTransform: 'none', fontWeight: 600,
                  '&:hover': { borderColor: '#9CA3AF', bgcolor: '#F9FAFB' }
                }}
              >
                Update Password
              </Button>
            </Box>
          </SettingsContainer>
        )
      ) : (
        <Box sx={{ px: isSmallMobile ? 2 : 2.5, pt: isSmallMobile ? 2 : 2.5, pb: isSmallMobile ? 2 : 4, backgroundColor: COLORS.pageBg, minHeight: '100vh', fontFamily: fontStack }}>
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
    </>
  );
}
