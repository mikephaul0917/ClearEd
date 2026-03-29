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
import { getAbsoluteUrl, getInitials } from "../../utils/avatarUtils";
import StudentClearanceSlip from "./StudentClearanceSlip";
import ClearanceRequirements from "../../components/student/ClearanceRequirements";
import StudentProgress from "./StudentProgress";
import StudentCertificate from "./StudentCertificate";
import RoleLayout from "../../components/layout/RoleLayout";
import TodoPage from "../todo/TodoPage";
import LeaderboardPage from "./LeaderboardPage";
import { Skeleton, Card, CardContent, useTheme, useMediaQuery, Dialog, DialogTitle, DialogContent, DialogActions, IconButton } from "@mui/material";
import { clearanceService } from "../../services/clearance.service";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import PendingIcon from "@mui/icons-material/Pending";
import ErrorIcon from "@mui/icons-material/Error";
import BusinessIcon from "@mui/icons-material/Business";
import RefreshIcon from "@mui/icons-material/Refresh";
import PersonIcon from "@mui/icons-material/Person";
import SecurityIcon from "@mui/icons-material/Security";
import CloseIcon from "@mui/icons-material/Close";
import {
  SettingsContainer,
  SettingsSection,
  SettingsRow,
  SettingsField,
  ProfilePictureSection,
  SettingsHeader
} from "../../components/layout/SettingsLayout";

// --- MODERN BENTO DESIGN SYSTEM ---
const COLORS = {
  pageBg: '#F9FAFB',
  surface: '#F9FAFB',
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
  const [avatarUrl, setAvatarUrl] = useState(() => {
    try {
      const u = JSON.parse(localStorage.getItem("user") || "{}");
      return u.avatarUrl || "";
    } catch { return ""; }
  });
  const updateLocalAvatar = (url: string) => {
    try {
      const u = JSON.parse(localStorage.getItem("user") || "{}");
      u.avatarUrl = url;
      localStorage.setItem("user", JSON.stringify(u));
      window.dispatchEvent(new Event("storage")); // Trigger RoleLayout re-render
    } catch { }
  };
  const [spFamilyName, setSpFamilyName] = useState("");
  const [spFirstName, setSpFirstName] = useState("");
  const [spMiddleName, setSpMiddleName] = useState("");
  const [spStudentNumber, setSpStudentNumber] = useState("");
  const [spCourse, setSpCourse] = useState("");
  const [spYear, setSpYear] = useState("");
  const [viewingOrg, setViewingOrg] = useState<any>(null);
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
          if (p.avatarUrl) {
            setAvatarUrl(p.avatarUrl);
            updateLocalAvatar(p.avatarUrl);
          }
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
    return getInitials(fullName);
  }, [fullName]);

  const draftFullName = useMemo(() => {
    return `${draftFirst.trim()} ${draftLast.trim()}`.trim() || fullName;
  }, [draftFirst, draftLast, fullName]);

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

  const filteredClearances = myClearances.filter(c => c.orgStatus === 'active');

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
    <RoleLayout bgcolor="#F9FAFB">
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
                      bgcolor: "#F9FAFB",
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
                          bgcolor: "#F9FAFB",
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
                      bgcolor: "#F9FAFB",
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
                        onClick={(e) => { e.stopPropagation(); setViewingOrg(org); }}
                        sx={{
                          px: 2,
                          py: 1,
                          bgcolor: "#F3F4F6",
                          borderRadius: "20px",
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          cursor: 'pointer',
                          '&:hover': { bgcolor: '#E2E8F0' }
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

            {/* Modal for Full Description (Student Dashboard) */}
            <Dialog
              open={!!viewingOrg}
              onClose={() => setViewingOrg(null)}
              onClick={(e) => e.stopPropagation()}
              PaperProps={{
                sx: {
                  borderRadius: "24px",
                  padding: "8px",
                  maxWidth: "500px",
                  width: "100%"
                }
              }}
            >
              <DialogTitle sx={{ m: 0, p: 2, pr: 6, fontWeight: 800, fontSize: "1.5rem", fontFamily: fontStack }}>
                {viewingOrg?.name}
                <IconButton
                  onClick={() => setViewingOrg(null)}
                  sx={{
                    position: "absolute",
                    right: 16,
                    top: 16,
                    color: (theme) => theme.palette.grey[500],
                  }}
                >
                  <CloseIcon />
                </IconButton>
              </DialogTitle>
              <DialogContent sx={{ p: 2 }}>
                <Typography sx={{ color: "#4B5563", lineHeight: 1.6, fontFamily: fontStack }}>
                  {viewingOrg?.description || viewingOrg?.signatoryName || "Join this organization to access exclusive content and tools for your clearance process."}
                </Typography>
                <Box sx={{ mt: 3, display: 'flex', gap: 2 }}>
                  <Box sx={{ p: 1.5, bgcolor: "#F8FAFC", borderRadius: "12px", flex: 1 }}>
                    <Typography sx={{ fontSize: 11, fontWeight: 700, color: "#94A3B8", textTransform: 'uppercase', mb: 0.5 }}>Signatory</Typography>
                    <Typography sx={{ fontWeight: 700 }}>{viewingOrg?.signatoryName || 'Representative'}</Typography>
                  </Box>
                  <Box sx={{ p: 1.5, bgcolor: "#F8FAFC", borderRadius: "12px", flex: 1 }}>
                    <Typography sx={{ fontSize: 11, fontWeight: 700, color: "#94A3B8", textTransform: 'uppercase', mb: 0.5 }}>Status</Typography>
                    <Typography sx={{ fontWeight: 700, textTransform: 'capitalize' }}>
                      {viewingOrg?.status === 'completed' ? 'Cleared' : viewingOrg?.status === 'not_started' ? 'Pending' : 'Reviewing'}
                    </Typography>
                  </Box>
                </Box>
              </DialogContent>
              <DialogActions sx={{ p: 2, pt: 0 }}>
                <Button
                  fullWidth
                  onClick={() => setViewingOrg(null)}
                  variant="contained"
                  sx={{
                    borderRadius: "12px",
                    bgcolor: COLORS.black,
                    textTransform: "none",
                    fontWeight: 700,
                    py: 1.5,
                    '&:hover': { bgcolor: COLORS.black, opacity: 0.8 }
                  }}
                >
                  Close
                </Button>
              </DialogActions>
            </Dialog>

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
                <SettingsSection>
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
                </SettingsSection>
              </Box>
            </Box>
          </Box>
        </Box>
      ) : active === "settings" ? (
        <SettingsContainer>
          <SettingsHeader
            title="Account Settings"
            subtitle="Manage your profile information and security preferences"
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
                  // Update profile with empty avatarUrl
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
                  value={draftFirst}
                  onChange={(e) => setDraftFirst(e.target.value)}
                  sx={{ '& .MuiOutlinedInput-root': { borderRadius: '8px', bgcolor: '#FFF' } }}
                />
              </SettingsField>
              <SettingsField label="Last name">
                <TextField
                  fullWidth
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
              <SettingsField label="Student Number">
                <TextField fullWidth value={spStudentNumber} disabled sx={{ '& .MuiOutlinedInput-root': { borderRadius: '8px', bgcolor: '#F8FAFC' } }} />
              </SettingsField>
              <SettingsField label="Course">
                <TextField fullWidth value={spCourse} disabled sx={{ '& .MuiOutlinedInput-root': { borderRadius: '8px', bgcolor: '#F8FAFC' } }} />
              </SettingsField>
            </SettingsRow>
            <SettingsRow>
              <SettingsField label="Year Level">
                <TextField fullWidth value={`${spYear} Year`} disabled sx={{ '& .MuiOutlinedInput-root': { borderRadius: '8px', bgcolor: '#F8FAFC' } }} />
              </SettingsField>
              <SettingsField label="Academic Period">
                <TextField fullWidth value={`${spSemester} • ${spAcademicYear}`} disabled sx={{ '& .MuiOutlinedInput-root': { borderRadius: '8px', bgcolor: '#F8FAFC' } }} />
              </SettingsField>
            </SettingsRow>
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
