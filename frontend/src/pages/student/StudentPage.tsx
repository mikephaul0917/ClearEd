import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import TextField from "@mui/material/TextField";
import FormControl from "@mui/material/FormControl";
import FormLabel from "@mui/material/FormLabel";
import { useLocation, useNavigate } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import SuccessMessage from "../../components/SuccessMessage";
import { api, authService } from '../../services';
import { Divider } from "@mui/material";
import StudentClearanceSlip from "./StudentClearanceSlip";
import ClearanceRequirements from "../../components/student/ClearanceRequirements";
import StudentProgress from "./StudentProgress";
import StudentCertificate from "./StudentCertificate";
import RoleLayout from "../../components/layout/RoleLayout";
import TodoPage from "../todo/TodoPage";
import LeaderboardPage from "./LeaderboardPage";
import { Skeleton, Card, CardContent, useTheme, useMediaQuery } from "@mui/material";
import { clearanceService } from "../../services/clearance.service";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import PendingIcon from "@mui/icons-material/Pending";
import ErrorIcon from "@mui/icons-material/Error";
import BusinessIcon from "@mui/icons-material/Business";
import RefreshIcon from "@mui/icons-material/Refresh";
import PersonIcon from "@mui/icons-material/Person";
import SecurityIcon from "@mui/icons-material/Security";

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

export default function StudentPage() {
  const location = useLocation();
  const nav = useNavigate();
  const [notice, setNotice] = useState<any>((location.state as any)?.banner ?? null);
  const isSettings = location.pathname.includes("/settings");
  const isSlip = location.pathname.includes("/slip");
  const isReq = location.pathname.includes("/requirements");
  const isProg = location.pathname.includes("/progress");
  const progOrgId = isProg ? location.pathname.split("/progress/")[1] : null;
  const isCert = location.pathname.includes("/certificate");
  const isTodo = location.pathname.includes("/todo");
  const isLeaderboard = location.pathname.includes("/leaderboard");
  const isDashboard = location.pathname.includes("/dashboard") || (!isSettings && !isSlip && !isReq && !isProg && !isCert && !isTodo && !isLeaderboard && location.pathname.endsWith("/student"));
  const active: "dashboard" | "settings" | "slip" | "requirements" | "progress" | "certificate" | "todo" | "leaderboard" =
    isSettings ? "settings" : isSlip ? "slip" : isReq ? "requirements" : isProg ? "progress" : isCert ? "certificate" : isTodo ? "todo" : isLeaderboard ? "leaderboard" : "dashboard";
  const token = typeof localStorage !== "undefined" ? localStorage.getItem("token") : null;
  const email = typeof localStorage !== "undefined" ? (localStorage.getItem("email") || "student@example.com") : "student@example.com";
  const storedRole = (() => { try { return localStorage.getItem("role") || ""; } catch { return ""; } })();
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
  const [currentPass, setCurrentPass] = useState("");
  const [newPass, setNewPass] = useState("");
  const [confirmPass, setConfirmPass] = useState("");
  const [spFamilyName, setSpFamilyName] = useState("");
  const [spFirstName, setSpFirstName] = useState("");
  const [spMiddleName, setSpMiddleName] = useState("");
  const [spStudentNumber, setSpStudentNumber] = useState("");
  const [spCourse, setSpCourse] = useState("");
  const [spYear, setSpYear] = useState("");
  const [spSemester, setSpSemester] = useState("");
  const [spAcademicYear, setSpAcademicYear] = useState("");

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
          const res = await api.get("/student/profile");
          const p = res.data || {};
          const scrub = (s: any) => (s === undefined || s === null || String(s).toLowerCase() === "undefined") ? "" : String(s);
          setSpFamilyName(scrub(p.familyName));
          setSpFirstName(scrub(p.firstName));
          setSpMiddleName(scrub(p.middleName));
          setSpStudentNumber(scrub(p.studentNumber));
          setSpCourse(scrub(p.course));
          setSpYear(scrub(p.year));
          setSpSemester(scrub(p.semester));
          setSpAcademicYear(scrub(p.academicYear));
          // Sync with general profile states to avoid stale 'admin' data
          const fName = scrub(p.firstName) || first;
          const lName = scrub(p.familyName) || last;
          setProfileFirst(fName);
          setProfileLast(lName);
          setDraftFirst(fName);
          setDraftLast(lName);
          try { localStorage.setItem("studentProfile", JSON.stringify(p)); } catch { }
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
    return name || "Guest Student";
  }, [profileFirst, profileLast, email]);

  const initials = useMemo(() => {
    const words = fullName.split(" ").filter(Boolean);
    const first = words[0]?.[0] || "S";
    const second = words[1]?.[0] || "T";
    return (first + second).toUpperCase();
  }, [fullName]);

  const logout = () => { authService.logout(); nav("/", { state: { banner: { message: "Logged out successfully!", variant: "success" } } }); };

  useEffect(() => {
    if (location.pathname === "/student") {
      nav("/student/dashboard", { replace: true });
    }
  }, [location.pathname, nav]);

  const updateProfile = async () => {
    const username = `${draftFirst} ${draftLast}`.trim();
    try {
      // Update Auth Profile (Username)
      await api.put("/auth/profile", { username });

      // Sync with Student Profile for document consistency
      try {
        await api.put("/student/profile", {
          firstName: draftFirst.trim(),
          familyName: draftLast.trim()
        });
      } catch (e) {
        console.error("Failed to sync student profile name:", e);
      }

      try { localStorage.setItem("username", username); } catch { }
      setProfileFirst(draftFirst.trim());
      setProfileLast(draftLast.trim());

      // Update sp states too
      setSpFirstName(draftFirst.trim());
      setSpFamilyName(draftLast.trim());

      setNotice({ message: "Profile updated successfully", variant: "success" });
    } catch (err: any) {
      const msg = err.response?.data?.message || "Failed to update profile";
      setNotice({ message: msg, variant: "error" });
    }
  };

  const updatePassword = async () => {
    if (!currentPass || !newPass || !confirmPass) {
      setNotice({ message: "Please fill all password fields", variant: "error" });
      return;
    }
    if (newPass !== confirmPass) {
      setNotice({ message: "Passwords do not match", variant: "error" });
      return;
    }
    try {
      await api.put("/auth/password", { currentPassword: currentPass, newPassword: newPass });
      setNotice({ message: "Password updated", variant: "success" });
      setCurrentPass("");
      setNewPass("");
      setConfirmPass("");
    } catch (err: any) {
      const msg = err.response?.data?.message || "Failed to update password";
      setNotice({ message: msg, variant: "error" });
    }
  };

  const saveStudentProfile = async () => {
    try {
      const payload = {
        familyName: spFamilyName,
        firstName: spFirstName,
        middleName: spMiddleName,
        studentNumber: spStudentNumber,
        course: spCourse,
        year: spYear,
        semester: spSemester,
        academicYear: spAcademicYear,
      };
      await api.put("/student/profile", payload);
      try { localStorage.setItem("studentProfile", JSON.stringify(payload)); } catch { }
      setNotice({ message: "Student profile saved", variant: "success" });
    } catch (err: any) {
      const msg = err.response?.data?.message || "Failed to save student profile";
      setNotice({ message: msg, variant: "error" });
    }
  };

  const submitClearanceRequest = async () => {
    try {
      const payload = {
        familyName: spFamilyName,
        firstName: spFirstName,
        middleName: spMiddleName,
        studentNumber: spStudentNumber,
        course: spCourse,
        year: spYear,
        semester: spSemester,
        academicYear: spAcademicYear,
      };
      await api.post("/clearance/start", payload);
      setNotice({ message: "Clearance request submitted", variant: "success" });
    } catch (err: any) {
      const msg = err.response?.data?.message || "Failed to start clearance";
      setNotice({ message: msg, variant: "error" });
    }
  };

  const [myClearances, setMyClearances] = useState<any[]>([]);
  const [loadingClearances, setLoadingClearances] = useState(true);
  const [activeTerm, setActiveTerm] = useState<{ name: string; academicYear: string } | null>(null);
  const [timeline, setTimeline] = useState<any[]>([]);

  const filteredClearances = myClearances;

  const approvedCount = useMemo(() => filteredClearances.filter(c => c.status === "completed").length, [filteredClearances]);
  const pendingCount = useMemo(() => filteredClearances.filter(c => c.status === "pending" || c.status === "in_progress").length, [filteredClearances]);
  const notStartedCount = useMemo(() => filteredClearances.filter(c => c.status === "not_started").length, [filteredClearances]);
  const progressPercent = useMemo(() => Math.round((approvedCount / (filteredClearances.length || 1)) * 100), [approvedCount, filteredClearances.length]);

  const fetchClearances = async () => {
    setLoadingClearances(true);
    try {
      const res = await clearanceService.getMyClearances();
      setMyClearances(res.organizations || []);
      setActiveTerm(res.term || null);
    } catch { }
    setLoadingClearances(false);
  };

  useEffect(() => {
    fetchClearances();
  }, []);

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const isSmallMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const refreshTimeline = async () => {
    try {
      const res = await api.get("/clearance/timeline");
      setTimeline(res.data.items || []);
      setNotice({ message: "Progress refreshed", variant: "success" });
    } catch (err: any) {
      const msg = err.response?.data?.message || "Failed to refresh progress";
      setNotice({ message: msg, variant: "error" });
    }
  };

  const reqValidId = (() => { try { const p = JSON.parse(localStorage.getItem("studentProfile") || "{}"); return !!p.reqValidId; } catch { return false; } })();
  const reqAdviser = (() => { try { const p = JSON.parse(localStorage.getItem("studentProfile") || "{}"); return !!p.reqAdviserForm; } catch { return false; } })();
  const reqOrg = (() => { try { const p = JSON.parse(localStorage.getItem("studentProfile") || "{}"); return !!p.reqOrgForm; } catch { return false; } })();

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
        <Box sx={{ p: isSmallMobile ? 2 : 4, backgroundColor: COLORS.pageBg, minHeight: '100vh', fontFamily: fontStack }}>
          {/* ── Header ──────────────────────────────────────────────────── */}
          <Box sx={{ display: 'flex', flexDirection: isSmallMobile ? 'column' : 'row', justifyContent: 'space-between', alignItems: isSmallMobile ? 'flex-start' : 'center', mb: isSmallMobile ? 3 : 4, gap: 2 }}>
            <Box>
              <Typography variant={isSmallMobile ? "h4" : "h3"} sx={{ fontWeight: 800, letterSpacing: '-0.03em', color: COLORS.black }}>
                Student Dashboard
              </Typography>
              <Typography sx={{ color: COLORS.textSecondary, fontSize: isSmallMobile ? 14 : 16, mt: 0.5 }}>
                {activeTerm ? `${activeTerm.name} • ${activeTerm.academicYear}` : 'Overview of your clearance status'}
              </Typography>
            </Box>
            <Button
              variant="contained"
              disableElevation
              startIcon={<RefreshIcon />}
              onClick={fetchClearances}
              sx={{
                borderRadius: COLORS.pillRadius, bgcolor: COLORS.black, textTransform: 'none', px: 3, fontWeight: 600,
                '&:hover': { bgcolor: '#222' }
              }}
            >
              Refresh Status
            </Button>
          </Box>

          <Box sx={{ maxWidth: 1400, mx: 'auto' }}>
            {/* ── Stats Bento Row ────────────────────────────────────────── */}
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '2fr 1.2fr' }, gap: 2, mb: 2 }}>
              {/* Main Progress Card */}
              <Box sx={{
                ...glassCard, p: isSmallMobile ? 3 : 4,
                bgcolor: COLORS.black, color: '#FFF',
                display: 'flex', flexDirection: 'column', justifyContent: 'center',
                position: 'relative', overflow: 'hidden'
              }}>
                <Box sx={{ position: 'absolute', top: -20, right: -20, width: 140, height: 140, borderRadius: '50%', bgcolor: 'rgba(255,255,255,0.05)' }} />
                <Typography sx={{ fontSize: 13, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', opacity: 0.7, mb: 2 }}>Overall Clearance Progress</Typography>
                <Box sx={{ display: 'flex', alignItems: 'flex-end', gap: 2, mb: 1 }}>
                  <Typography sx={{ fontSize: isSmallMobile ? 48 : 64, fontWeight: 800, lineHeight: 1 }}>{progressPercent}%</Typography>
                  <Typography sx={{ mb: 1.5, fontWeight: 600, opacity: 0.7 }}>Approved</Typography>
                </Box>
                <Box sx={{ width: '100%', height: 10, bgcolor: 'rgba(255,255,255,0.15)', borderRadius: 5, overflow: 'hidden', mb: 1 }}>
                  <Box sx={{ width: `${progressPercent}%`, height: '100%', bgcolor: COLORS.teal, borderRadius: 5, transition: 'width 1s cubic-bezier(0.4, 0, 0.2, 1)' }} />
                </Box>
                <Typography sx={{ fontSize: 12, fontWeight: 600, opacity: 0.6 }}>{approvedCount} of {filteredClearances.length} organizations completed</Typography>
              </Box>

              {/* Status Breakdown Grid */}
              <Box sx={{ display: 'grid', gridTemplateRows: '1fr 1fr', gap: 2 }}>
                <Box sx={{ ...glassCard, p: 3, bgcolor: COLORS.lavender + '15', display: 'flex', alignItems: 'center', gap: 3 }}>
                  <Box sx={{ width: 50, height: 50, borderRadius: '14px', bgcolor: COLORS.lavender, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <PendingIcon sx={{ color: '#FFF' }} />
                  </Box>
                  <Box>
                    <Typography sx={{ fontWeight: 800, fontSize: 24 }}>{pendingCount}</Typography>
                    <Typography sx={{ color: COLORS.textSecondary, fontSize: 13, fontWeight: 600 }}>In Review</Typography>
                  </Box>
                </Box>
                <Box sx={{ ...glassCard, p: 3, bgcolor: COLORS.orange + '15', display: 'flex', alignItems: 'center', gap: 3 }}>
                  <Box sx={{ width: 50, height: 50, borderRadius: '14px', bgcolor: COLORS.orange, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <ErrorIcon sx={{ color: '#FFF' }} />
                  </Box>
                  <Box>
                    <Typography sx={{ fontWeight: 800, fontSize: 24 }}>{notStartedCount}</Typography>
                    <Typography sx={{ color: COLORS.textSecondary, fontSize: 13, fontWeight: 600 }}>Not Started</Typography>
                  </Box>
                </Box>
              </Box>
            </Box>

            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 4, mb: 2 }}>
              <Typography sx={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase', color: COLORS.textSecondary }}>
                Institutional Organizations
              </Typography>
            </Box>

            <Box sx={{
              display: 'grid',
              gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(3, 1fr)', lg: 'repeat(4, 1fr)' },
              gap: 5,
              mb: 4
            }}>
              {loadingClearances ? (
                [1, 2, 3, 4, 5, 6, 7, 8].map(i => <Skeleton key={i} variant="rounded" height={220} sx={{ borderRadius: '32px' }} />)
              ) : filteredClearances.map((org) => (
                <Box
                  key={org._id}
                  onClick={() => nav(`/student/progress/${org._id}`)}
                  sx={{
                    width: "100%",
                    maxWidth: 320,
                    aspectRatio: "1/1",
                    cursor: "pointer",
                    position: "relative",
                    transition: "all 0.4s cubic-bezier(0.4, 0, 0.2, 1)",
                    opacity: org.orgStatus === 'archived' ? 0.7 : 1,
                    "&:hover": {
                      transform: "translateY(-6px)",
                      "& .card-description": {
                        maxHeight: "100px",
                        opacity: 1,
                        mt: 1,
                      }
                    }
                  }}
                >
                  {/* Header Background Container (Rounded and Clipped) */}
                  <Box
                    sx={{
                      position: "absolute",
                      top: 0,
                      left: 0,
                      right: 0,
                      bottom: 0,
                      borderRadius: "32px",
                      overflow: "hidden",
                      bgcolor: "#FFFFFF",
                      boxShadow: "0 10px 30px rgba(0,0,0,0.04)",
                      border: "1px solid #F1F5F9",
                    }}
                  >
                    {/* Header Section */}
                    <Box
                      className="card-header"
                      sx={{
                        height: "100%",
                        bgcolor: org.themeColor || COLORS.black,
                        backgroundImage: org.headerImage ? `url(${org.headerImage})` : 'none',
                        backgroundSize: 'cover',
                        backgroundPosition: 'center',
                        display: 'flex',
                        alignItems: 'flex-start',
                        justifyContent: 'center',
                        pt: 5,
                      }}
                    >
                      {/* Centered Icon Container */}
                      <Box
                        className="icon-box"
                        sx={{
                          width: 60,
                          height: 60,
                          bgcolor: "#FFFFFF",
                          borderRadius: "16px",
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          boxShadow: "0 8px 20px rgba(0,0,0,0.12)",
                          transition: "all 0.4s cubic-bezier(0.4, 0, 0.2, 1)",
                          zIndex: 2
                        }}
                      >
                        <BusinessIcon sx={{ color: org.themeColor || COLORS.black, fontSize: 28 }} />
                      </Box>
                    </Box>
                  </Box>

                  {/* Sliding Content Overlay (Floating Panel - Wider than header) */}
                  <Box
                    className="content-overlay"
                    sx={{
                      position: "absolute",
                      bottom: 0,
                      left: -6,
                      right: -6,
                      bgcolor: "#FFFFFF",
                      p: "20px",
                      borderRadius: "24px",
                      boxShadow: "0 12px 32px rgba(0,0,0,0.12)",
                      transition: "all 0.4s cubic-bezier(0.4, 0, 0.2, 1)",
                      display: "flex",
                      flexDirection: "column",
                      zIndex: 3
                    }}
                  >
                    <Typography
                      sx={{
                        fontSize: "1.25rem",
                        fontWeight: 800,
                        color: "#111",
                        fontFamily: "'Inter', sans-serif",
                        display: "-webkit-box",
                        WebkitLineClamp: 1,
                        WebkitBoxOrient: "vertical",
                        overflow: "hidden"
                      }}
                    >
                      {org.name}
                    </Typography>

                    <Box 
                      className="card-description"
                      sx={{
                        maxHeight: 0,
                        opacity: 0,
                        transition: "all 0.4s cubic-bezier(0.4, 0, 0.2, 1)",
                        overflow: "hidden"
                      }}
                    >
                      <Typography
                        sx={{
                          fontSize: "0.875rem",
                          color: "#6B7280",
                          lineHeight: 1.5,
                          fontFamily: "'Inter', sans-serif",
                          display: "-webkit-box",
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: "vertical",
                          overflow: "hidden",
                          mt: 1
                        }}
                      >
                        {org.signatoryName || 'Signatory Representative'}
                      </Typography>
                    </Box>

                    {/* Footer Section - Pills (Always visible) */}
                    <Box sx={{ pt: 1, display: 'flex', gap: 1.5, mt: 1 }}>
                      <Box
                        sx={{
                          px: 2,
                          py: 1,
                          bgcolor: "#F3F4F6",
                          borderRadius: "20px",
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <Typography sx={{ fontSize: "0.75rem", fontWeight: 700, color: "#4B5563", fontFamily: "'Inter', sans-serif", whiteSpace: 'nowrap' }}>
                          Learn more
                        </Typography>
                      </Box>
                      <Box
                        sx={{
                          px: 2,
                          py: 1,
                          flex: 1,
                          bgcolor: org.status === 'completed' ? COLORS.teal + '15' : "#F3F4F6",
                          borderRadius: "20px",
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <Typography sx={{
                          fontSize: "0.725rem",
                          fontWeight: 800,
                          color: org.status === 'completed' ? '#059669' : "#4B5563",
                          fontFamily: "'Inter', sans-serif",
                          textTransform: 'uppercase',
                          letterSpacing: '0.02em'
                        }}>
                          {org.status === 'completed' ? 'Cleared' : org.status === 'not_started' ? 'Pending' : 'Reviewing'}
                        </Typography>
                      </Box>
                    </Box>
                  </Box>
                </Box>
              ))}
            </Box>

            {/* ── Requirements & Profile Quick View ───────────────────────── */}
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: '1fr 1fr' }, gap: 3, mb: 4 }}>
              {/* Profile Overview */}
              <Box sx={{ ...glassCard, p: 4 }}>
                <Typography sx={{ fontWeight: 800, fontSize: 18, mb: 3 }}>Student Profile</Typography>
                <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 3 }}>
                  <Box>
                    <Typography sx={{ fontSize: 11, fontWeight: 700, color: COLORS.textSecondary, textTransform: 'uppercase', mb: 0.5 }}>Full Name</Typography>
                    <Typography sx={{ fontWeight: 700, fontSize: 15 }}>{fullName}</Typography>
                  </Box>
                  <Box>
                    <Typography sx={{ fontSize: 11, fontWeight: 700, color: COLORS.textSecondary, textTransform: 'uppercase', mb: 0.5 }}>Student ID</Typography>
                    <Typography sx={{ fontWeight: 700, fontSize: 15 }}>{spStudentNumber || '—'}</Typography>
                  </Box>
                  <Box>
                    <Typography sx={{ fontSize: 11, fontWeight: 700, color: COLORS.textSecondary, textTransform: 'uppercase', mb: 0.5 }}>Course</Typography>
                    <Typography sx={{ fontWeight: 700, fontSize: 15 }}>{spCourse || '—'}</Typography>
                  </Box>
                  <Box>
                    <Typography sx={{ fontSize: 11, fontWeight: 700, color: COLORS.textSecondary, textTransform: 'uppercase', mb: 0.5 }}>Year Level</Typography>
                    <Typography sx={{ fontWeight: 700, fontSize: 15 }}>{spYear || '—'}</Typography>
                  </Box>
                </Box>
                <Button variant="text" size="small" onClick={() => nav("/student/settings")} sx={{ mt: 3, textTransform: 'none', fontWeight: 700, color: COLORS.black }}>Edit Profile Details →</Button>
              </Box>

              {/* Requirements Status */}
              <Box sx={{ ...glassCard, p: 4 }}>
                <Typography sx={{ fontWeight: 800, fontSize: 18, mb: 3 }}>Core Requirements</Typography>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  {[
                    { label: 'Validated School ID', status: reqValidId },
                    { label: 'Adviser-signed form', status: reqAdviser },
                    { label: 'Organization form', status: reqOrg }
                  ].map(req => (
                    <Box key={req.label} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', p: 1.5, borderRadius: '12px', bgcolor: req.status ? COLORS.teal + '08' : '#F8FAFC' }}>
                      <Typography sx={{ fontSize: 14, fontWeight: 600 }}>{req.label}</Typography>
                      <Box sx={{
                        px: 1.2, py: 0.4, borderRadius: COLORS.pillRadius,
                        bgcolor: req.status ? COLORS.teal : '#E2E8F0',
                        color: req.status ? '#FFF' : '#64748B',
                        fontSize: 10, fontWeight: 800, textTransform: 'uppercase'
                      }}>
                        {req.status ? 'Uploaded' : 'Missing'}
                      </Box>
                    </Box>
                  ))}
                </Box>
                <Button variant="text" size="small" onClick={() => nav("/student/requirements")} sx={{ mt: 2, textTransform: 'none', fontWeight: 700, color: COLORS.black }}>Upload Requirements →</Button>
              </Box>
            </Box>
          </Box>
        </Box>
      ) : active === "settings" ? (
        <Box sx={{ p: isSmallMobile ? 2 : 4, backgroundColor: COLORS.pageBg, minHeight: '100vh', fontFamily: fontStack }}>
          <Box sx={{ maxWidth: '800px', mx: 'auto', px: isSmallMobile ? 2 : 4, mb: isSmallMobile ? 4 : 6 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1 }}>
              <Typography variant="h4" sx={{ fontWeight: 800, color: '#000' }}>
                Account Settings
              </Typography>
            </Box>
            <Typography variant="body1" sx={{ color: '#6B7280', fontSize: '1.05rem' }}>
              Manage your profile information and security preferences
            </Typography>
          </Box>

          <Box sx={{ maxWidth: '800px', mx: 'auto', display: 'flex', flexDirection: 'column', gap: 3 }}>
            {/* Account Profile Card - Matches Admin Style Table/Image */}
            <Card sx={glassCard}>
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
                  <Box>
                    <Typography sx={{ mb: 1, fontWeight: 500, fontSize: '0.875rem' }}>First Name</Typography>
                    <TextField
                      fullWidth
                      value={draftFirst}
                      onChange={(e) => setDraftFirst(e.target.value)}
                      sx={{ '& .MuiOutlinedInput-root': { borderRadius: '8px' } }}
                    />
                  </Box>
                  <Box>
                    <Typography sx={{ mb: 1, fontWeight: 500, fontSize: '0.875rem' }}>Last Name</Typography>
                    <TextField
                      fullWidth
                      value={draftLast}
                      onChange={(e) => setDraftLast(e.target.value)}
                      sx={{ '& .MuiOutlinedInput-root': { borderRadius: '8px' } }}
                    />
                  </Box>
                  <Box>
                    <Typography sx={{ mb: 1, fontWeight: 500, fontSize: '0.875rem', color: COLORS.textSecondary }}>Email Address (Locked)</Typography>
                    <TextField
                      fullWidth
                      value={email}
                      disabled
                      sx={{ '& .MuiOutlinedInput-root': { borderRadius: '8px', backgroundColor: '#F8FAFC' } }}
                    />
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
            <Card sx={glassCard}>
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
      ) : active === "slip" ? (
        <StudentClearanceSlip />
      ) : active === "requirements" ? (
        <ClearanceRequirements />
      ) : active === "progress" ? (
        <StudentProgress organizationId={progOrgId} />
      ) : active === "todo" ? (
        <TodoPage />
      ) : active === "leaderboard" ? (
        <LeaderboardPage />
      ) : (
        <StudentCertificate />
      )}
    </RoleLayout>
  );
}
