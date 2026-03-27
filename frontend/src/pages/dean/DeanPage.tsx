import { useLocation, useNavigate } from "react-router-dom";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import Paper from "@mui/material/Paper";
import TextField from "@mui/material/TextField";
import FormControl from "@mui/material/FormControl";
import FormLabel from "@mui/material/FormLabel";
import Divider from "@mui/material/Divider";
import Checkbox from "@mui/material/Checkbox";
import Avatar from "@mui/material/Avatar";
import TableContainer from "@mui/material/TableContainer";
import { api, authService } from '../../services';
import { useEffect, useState, useMemo, useRef } from "react";
import DeanApprovalsSimple from "../../components/dean/DeanApprovalsSimple";
import DeanFAQPage from "./DeanFAQPage";
import StudentListPopup from "./components/StudentListPopup";
import InputAdornment from "@mui/material/InputAdornment";
import Chip from "@mui/material/Chip";
import IconButton from "@mui/material/IconButton";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import Table from "@mui/material/Table";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import TableCell from "@mui/material/TableCell";
import TableBody from "@mui/material/TableBody";
import TablePagination from "@mui/material/TablePagination";
import Select from "@mui/material/Select";
import MenuItem from "@mui/material/MenuItem";
import Alert from "@mui/material/Alert";
import Snackbar from "@mui/material/Snackbar";
import Menu from "@mui/material/Menu";
import ListItemIcon from "@mui/material/ListItemIcon";
import ListItemText from "@mui/material/ListItemText";
import RoleLayout from "../../components/layout/RoleLayout";
import { getAbsoluteUrl, getInitials } from "../../utils/avatarUtils";
import CircularProgress from "@mui/material/CircularProgress";
import CheckIcon from "@mui/icons-material/Check";
import { EmptyState } from "../../components/layout/EmptyState";
import SignatureModal from "../../components/stream/SignatureModal";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
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
import { useTheme, useMediaQuery } from "@mui/material";

const COLORS = {
  black: '#0a0a0a',
  textSecondary: '#64748B',
  cardRadius: '16px',
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

const COURSES = [
  "BACHELOR OF ARTS IN COMMUNICATION (ABComm)",
  "BACHELOR OF SCIENCE IN MANAGEMENT ACCOUNTING (BSMA)",
  "BACHELOR OF SCIENCE IN ACCOUNTANCY (BSA)",
  "BACHELOR OF SCIENCE IN PSYCHOLOGY (BSP)",
  "BACHELOR OF SCIENCE IN COMPUTER SCIENCE (BSCS)",
  "BACHELOR OF SCIENCE IN NURSING (BSN)",
  "BACHELOR OF SCIENCE IN PHARMACY (BS PHARMA)",
  "BACHELOR OF SCIENCE IN BUSINESS ADMINISTRATION - Financial Management (FM)",
  "BACHELOR OF SCIENCE IN BUSINESS ADMINISTRATION - Marketing Management (MM)",
  "BACHELOR OF SCIENCE IN SOCIAL WORK (BSSW)",
  "BACHELOR OF ELEMENTARY EDUCATION (BEED)",
  "BACHELOR OF SECONDARY EDUCATION - English",
  "BACHELOR OF SECONDARY EDUCATION - Science",
  "BACHELOR OF SECONDARY EDUCATION - Mathematics",
  "BACHELOR OF SECONDARY EDUCATION - Filipino",
  "BACHELOR OF SECONDARY EDUCATION - Social Studies"
];

const YEAR_LEVELS = [
  "First Year",
  "Second Year",
  "Third Year",
  "Fourth Year"
];

const normalizeCourse = (c: string) => {
  const s = (c || "").trim().toUpperCase();
  const map: Record<string, string> = {
    "BSCS": "BACHELOR OF SCIENCE IN COMPUTER SCIENCE (BSCS)",
    "BSIT": "BACHELOR OF SCIENCE IN INFORMATION TECHNOLOGY (BSIT)",
    "BSA": "BACHELOR OF SCIENCE IN ACCOUNTANCY (BSA)",
    "BSMA": "BACHELOR OF SCIENCE IN MANAGEMENT ACCOUNTING (BSMA)",
    "BSP": "BACHELOR OF SCIENCE IN PSYCHOLOGY (BSP)",
    "BSN": "BACHELOR OF SCIENCE IN NURSING (BSN)",
    "BS PHARMA": "BACHELOR OF SCIENCE IN PHARMACY (BS PHARMA)",
    "BSSW": "BACHELOR OF SCIENCE IN SOCIAL WORK (BSSW)",
    "BEED": "BACHELOR OF ELEMENTARY EDUCATION (BEED)"
  };
  const found = COURSES.find(x => x.toUpperCase() === s);
  if (found) return found;
  if (map[s]) return map[s];
  return c;
};

const normalizeYear = (y: string) => {
  const s = (y || "").trim().toLowerCase();
  const map: Record<string, string> = {
    "1st year": "First Year",
    "first year": "First Year",
    "2nd year": "Second Year",
    "second year": "Second Year",
    "3rd year": "Third Year",
    "third year": "Third Year",
    "4th year": "Fourth Year",
    "fourth year": "Fourth Year"
  };
  return map[s] || y;
};

const getCourseLabel = (c: string) => {
  const match = c.match(/\(([^)]+)\)/);
  return match ? `${match[1]} - ${c.split(' (')[0].replace(/BACHELOR OF (SCIENCE IN |ARTS IN |)?/i, '')}` : c;
};

export default function DeanPage() {
  const location = useLocation();
  const nav = useNavigate();
  const isApprovals = location.pathname.includes("/approvals");
  const isSettings = location.pathname.includes("/settings");
  const isFAQs = location.pathname.includes("/faqs");
  const isFinal = !isApprovals && !isSettings && !isFAQs;
  const active = isSettings ? "settings" : isApprovals ? "approvals" : isFAQs ? "faqs" : "final";
  const email = typeof localStorage !== "undefined" ? (localStorage.getItem("email") || "dean@example.com") : "dean@example.com";
  const storedRole = (() => { try { return localStorage.getItem("role") || ""; } catch { return ""; } })();
  const roleText = storedRole || "Dean";
  const [profileFirst, setProfileFirst] = useState("");
  const [profileLast, setProfileLast] = useState("");
  const [draftFirst, setDraftFirst] = useState("");
  const [draftLast, setDraftLast] = useState("");
  const [currentPass, setCurrentPass] = useState("");
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
  const [notice, setNotice] = useState<{ message: string, variant: 'success' | 'error' | 'info' } | null>((location.state as any)?.banner ?? null);
  const [query, setQuery] = useState("");
  const [filterCourse, setFilterCourse] = useState<string>("");
  const [availableCourses, setAvailableCourses] = useState<string[]>([]);
  const [filterYear, setFilterYear] = useState<string>("");
  const [filterDate, setFilterDate] = useState<string>("");
  const [sortOrder, setSortOrder] = useState<"newest" | "oldest">("newest");
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [filterStatus, setFilterStatus] = useState<"pending" | "approved">("pending");
  const [selected, setSelected] = useState<any>(null);

  const [signatureModalOpen, setSignatureModalOpen] = useState(false);
  const [studentToApprove, setStudentToApprove] = useState<any>(null);
  const [actionState, setActionState] = useState<'idle' | 'loading' | 'success'>('idle');
  const [actionRowId, setActionRowId] = useState<string | null>(null);
  const [sigMode, setSigMode] = useState<"upload" | "draw">("upload");
  const [sigDrawData, setSigDrawData] = useState<string>("");
  const [signatureUrl, setSignatureUrl] = useState<string | null>(null);
  const [moreAnchor, setMoreAnchor] = useState<null | HTMLElement>(null);
  const dateInputRef = useRef<HTMLInputElement>(null);
  const [orgRows, setOrgRows] = useState<any[]>([]);
  const [readyRows, setReadyRows] = useState<any[]>([]);
  const [finalizedTodayCount, setFinalizedTodayCount] = useState(0);
  const [studentListOpen, setStudentListOpen] = useState(false);
  const [popupSearch, setPopupSearch] = useState("");
  const [courseMenuAnchor, setCourseMenuAnchor] = useState<null | HTMLElement>(null);


  const theme = useTheme();
  const isSmallMobile = useMediaQuery(theme.breakpoints.down('sm'));

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
    } catch { }
  }, [email]);

  useEffect(() => {
    if (isSettings) {
      (async () => {
        try {
          const res = await api.get("/auth/profile");
          const p = res.data;
          setSignatureUrl(p.signatureUrl || null);
          if (p.avatarUrl) setAvatarUrl(p.avatarUrl);
          if (p.fullName) {
            const parts = p.fullName.split(" ");
            setDraftFirst(parts[0] || "");
            setDraftLast(parts.slice(1).join(" ") || "");
          }
        } catch { }
      })();
    }
  }, [isSettings]);

  const toBase64 = (file: File) => new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

  const fullName = useMemo(() => {
    const cap = (s: string) => s ? s.charAt(0).toUpperCase() + s.slice(1) : "";
    const composed = [cap(profileFirst.trim()), cap(profileLast.trim())].filter(Boolean).join(" ");
    if (composed) return composed;
    const local = (email || "").split("@")[0];
    const parts = local.replace(/[._-]+/g, " ").split(" ").filter(Boolean);
    const name = parts.map(cap).join(" ");
    return name || "Dean";
  }, [profileFirst, profileLast, email]);

  const initials = useMemo(() => {
    return getInitials(fullName);
  }, [fullName]);

  const draftFullName = useMemo(() => {
    return `${draftFirst.trim()} ${draftLast.trim()}`.trim() || fullName;
  }, [draftFirst, draftLast, fullName]);

  const loadData = async () => {
    try {
      const res = await api.get("/dean/courses");
      setAvailableCourses(res.data.courses || []);
    } catch {
      setAvailableCourses(COURSES);
    }
    try {
      const pendingRes = await api.get("/dean/final-ready", { params: { status: 'pending' } });
      const approvedRes = await api.get("/dean/final-ready", { params: { status: 'approved' } });

      const today = new Date().toISOString().slice(0, 10);
      const approvedToday = (approvedRes.data.rows || []).filter((r: any) => (r.dateApproved || "").startsWith(today));
      setFinalizedTodayCount(approvedToday.length);

      const res = filterStatus === 'approved' ? approvedRes : pendingRes;
      const items = (res.data.rows || []).map((r: any, idx: number) => ({
        id: r.id || String(idx + 1),
        status: filterStatus,
        name: r.name || r.studentName || "Unknown",
        avatarUrl: r.avatarUrl,
        studentId: r.studentId || `S-${(idx + 1).toString().padStart(5, "0")}`,
        course: r.course || "BSCS",
        year: r.year || "4th Year",
        dateSubmitted: r.dateSubmitted || new Date().toISOString().slice(0, 10),
        dateApproved: r.dateApproved,
        reqCompleted: r.reqCompleted ?? 3,
        reqTotal: r.reqTotal ?? 3,
        organizations: r.organizations || []
      }));
      setReadyRows(items);
    } catch {
      setReadyRows([
        { id: "1", name: "Juan Dela Cruz", studentId: "S-00011", course: "BSIT", year: "4th Year", dateSubmitted: new Date().toISOString().slice(0, 10), reqCompleted: 3, reqTotal: 3 },
        { id: "2", name: "Maria Santos", studentId: "S-00012", course: "BSCS", year: "4th Year", dateSubmitted: new Date().toISOString().slice(0, 10), reqCompleted: 3, reqTotal: 3 }
      ]);
    }
    try {
      const res = await api.get("/dean/organization-pending");
      const items = (res.data.rows || []).map((r: any, idx: number) => ({
        id: r.id || `D-${idx + 1}`,
        name: r.name || r.studentName || "Unknown",
        studentId: r.studentId || `S-${(idx + 1).toString().padStart(5, "0")}`,
        course: r.course || "BSCS",
        year: r.year || "3rd Year",
        dateSubmitted: r.dateSubmitted || new Date().toISOString().slice(0, 10),
        status: r.status || "Pending",
        reqCompleted: r.reqCompleted ?? 2,
        reqTotal: r.reqTotal ?? 3,
        organizations: r.organizations || []
      }));
      setOrgRows(items);
    } catch {
      setOrgRows([
        { id: "D-1", name: "Pedro Cruz", studentId: "S-00021", course: "BSCS", year: "3rd Year", dateSubmitted: new Date().toISOString().slice(0, 10), status: "Pending", reqCompleted: 2, reqTotal: 3 },
        { id: "D-2", name: "Ana Reyes", studentId: "S-00022", course: "BSIT", year: "2nd Year", dateSubmitted: new Date().toISOString().slice(0, 10), status: "Pending", reqCompleted: 1, reqTotal: 3 }
      ]);
    }
  };

  useEffect(() => {
    loadData();
  }, [filterStatus]);

  const updateProfile = async () => {
    const fullName = `${draftFirst} ${draftLast}`.trim();
    try {
      await api.put("/auth/profile", { fullName, signatureUrl: sigDrawData || signatureUrl });
      setProfileFirst(draftFirst.trim());
      setProfileLast(draftLast.trim());
      setSignatureUrl(sigDrawData || signatureUrl);
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

  const finalize = async (signatureData: string) => {
    if (!studentToApprove) return;
    try {
      setActionRowId(studentToApprove.id);
      setActionState('loading');
      setSignatureModalOpen(false);

      const payload = studentToApprove?.studentId ? { studentId: studentToApprove.studentId, signatureUrl: signatureData } : {};
      await api.post("/dean/final-approval", payload);

      setActionState('success');

      setTimeout(() => {
        setNotice({ message: "Final clearance approved", variant: "success" });
        setReadyRows(prev => prev.filter(r => r.id !== studentToApprove.id));
        if (selected?.id === studentToApprove.id) setSelected(null);
        setActionState('idle');
        setActionRowId(null);
        setStudentToApprove(null);
      }, 800);

    } catch (err: any) {
      setActionState('idle');
      setActionRowId(null);
      const msg = err.response?.data?.message || "Failed to approve final clearance";
      setNotice({ message: msg, variant: "error" });
    }
  };

  const filteredReady = (() => {
    const q = query.trim().toLowerCase();
    let list = readyRows;
    if (q) list = list.filter(r => (r.name.toLowerCase().includes(q) || (r.studentId || "").toLowerCase().includes(q)));
    if (filterCourse) list = list.filter(r => normalizeCourse(r.course) === normalizeCourse(filterCourse));
    if (filterYear) list = list.filter(r => normalizeYear(r.year || "") === filterYear);
    if (filterDate) {
      list = list.filter(r => {
        const d = filterStatus === "approved" ? r.dateApproved : r.dateSubmitted;
        return (d || "").startsWith(filterDate);
      });
    }
    list = [...list].sort((a, b) => {
      const da = filterStatus === "approved" ? (a.dateApproved || "") : (a.dateSubmitted || "");
      const db = filterStatus === "approved" ? (b.dateApproved || "") : (b.dateSubmitted || "");
      return sortOrder === "newest" ? db.localeCompare(da) : da.localeCompare(db);
    });
    return list;
  })();
  const paginatedReady = (() => {
    const start = page * rowsPerPage;
    return filteredReady.slice(start, start + rowsPerPage);
  })();

  const filteredOrg = (() => {
    const q = query.trim().toLowerCase();
    let list = orgRows;
    if (q) list = list.filter(r => (r.name.toLowerCase().includes(q) || (r.studentId || "").toLowerCase().includes(q)));
    if (filterCourse) list = list.filter(r => normalizeCourse(r.course) === normalizeCourse(filterCourse));
    if (filterYear) list = list.filter(r => normalizeYear(r.year || "") === filterYear);
    if (filterDate) list = list.filter(r => (r.dateSubmitted || "").startsWith(filterDate));
    list = [...list].sort((a, b) => {
      const da = (a.dateSubmitted || "");
      const db = (b.dateSubmitted || "");
      return sortOrder === "newest" ? db.localeCompare(da) : da.localeCompare(db);
    });
    return list;
  })();
  const paginatedOrg = (() => {
    const start = page * rowsPerPage;
    return filteredOrg.slice(start, start + rowsPerPage);
  })();

  const readyCount = readyRows.length;
  const finalizedToday = finalizedTodayCount;
  const rejectedToday = 0;

  return (
    <RoleLayout>
      {notice && (
        <Snackbar open={!!notice} autoHideDuration={6000} onClose={() => setNotice(null)} anchorOrigin={{ vertical: 'top', horizontal: 'right' }}>
          <Alert onClose={() => setNotice(null)} severity={notice.variant || 'info'} sx={{ width: '100%' }}>
            {notice.message}
          </Alert>
        </Snackbar>
      )}
      {active === "final" ? (
        <>
          <Box display="flex" alignItems="flex-start" justifyContent="space-between" mb={4}>
            <Box sx={{ mb: 2 }}>
              <Typography variant="h4" sx={{ fontWeight: 700, color: "#111827", fontFamily: fontStack, letterSpacing: '-0.02em', mb: 1 }}>Final Clearances</Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 3, mt: 2, borderBottom: '1px solid #E5E7EB', pb: 0.5 }}>
                {["Pending", "Approved"].map((tab) => {
                  const val = tab.toLowerCase();
                  const isActive = filterStatus === val;
                  return (
                    <Typography
                      key={tab}
                      onClick={() => setFilterStatus(val as any)}
                      sx={{
                        fontSize: '0.875rem',
                        fontWeight: isActive ? 600 : 500,
                        color: isActive ? '#000000' : '#6B7280',
                        cursor: 'pointer',
                        pb: 1,
                        position: 'relative',
                        '&:after': isActive ? {
                          content: '""',
                          position: 'absolute',
                          bottom: -1,
                          left: 0,
                          right: 0,
                          height: '2px',
                          bgcolor: '#000000'
                        } : {},
                        '&:hover': { color: '#111827' }
                      }}
                    >
                      {tab}
                    </Typography>
                  );
                })}
              </Box>
            </Box>
            <Box display="flex" gap={1.5}>
              <Button
                variant="outlined"
                startIcon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>}
                sx={{ textTransform: 'none', borderRadius: '8px', color: '#374151', borderColor: '#D1D5DB', fontWeight: 600, fontSize: '0.875rem', px: 2 }}
              >
                Export
              </Button>
              <Button
                variant="contained"
                startIcon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>}
                sx={{ textTransform: 'none', borderRadius: '8px', bgcolor: '#000000', '&:hover': { bgcolor: '#333333' }, color: '#FFFFFF', fontWeight: 600, fontSize: '0.875rem', px: 2, boxShadow: 'none' }}
              >
                Approve All
              </Button>
            </Box>
          </Box>

          <Box display="grid" gridTemplateColumns={{ xs: "1fr", sm: "1fr 1fr", lg: "repeat(3, 1fr)" }} gap={3} mb={4}>
            {[
              { label: "Total Students", value: readyRows.length + finalizedToday, trend: "+20%", trendUp: true, isTotalStudents: true },
              { label: "Pending Final", value: readyCount, isPendingFinal: true },
              { label: "Active Recently", value: filteredReady.length, efficiency: true }
            ].map((card) => (
              <Box
                key={card.label}
                sx={{
                  p: 3,
                  bgcolor: card.efficiency ? '#f3f5f2' : '#FFF',
                  border: '1px solid #E5E7EB',
                  borderRadius: '16px',
                  minHeight: 180,
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  transition: 'all 0.3s ease',
                  '&:hover': { transform: 'translateY(-4px)', boxShadow: '0 12px 24px rgba(0,0,0,0.06)' }
                }}
              >
                <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={1}>
                  <Box>
                    <Typography sx={{ color: '#111827', fontSize: '1rem', fontWeight: 700, mb: 0.5 }}>
                      {card.efficiency ? (filterCourse ? getCourseLabel(filterCourse) : "All Students") : (card.isPendingFinal ? <Box component="span">Tasks this week <Box component="span" sx={{ color: '#94A3B8', fontWeight: 500, fontSize: '0.875rem' }}>/ Approvals</Box></Box> : card.label)}
                    </Typography>
                    {card.efficiency && (
                      <Box display="flex" alignItems="center" gap={0.75} sx={{ color: '#6B7280' }}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
                        <Typography sx={{ fontSize: '0.75rem', fontWeight: 500 }}>08:30 AM - 05:00 PM</Typography>
                      </Box>
                    )}
                  </Box>

                  {!card.efficiency && (
                    <IconButton size="small" sx={{ p: 0.5 }}><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#6B7280" strokeWidth="2"><circle cx="12" cy="12" r="1" /><circle cx="12" cy="5" r="1" /><circle cx="12" cy="19" r="1" /></svg></IconButton>
                  )}
                </Box>
                <Box display="flex" alignItems="flex-end" justifyContent="space-between">
                  {card.isPendingFinal ? (
                    <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 1 }}>
                      <Typography sx={{ fontWeight: 700, fontSize: '2.5rem', color: '#111827', lineHeight: 1 }}>{card.value}</Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, bgcolor: '#FEF2F2', px: 1, py: 0.5, borderRadius: '8px', width: 'fit-content' }}>
                        <Box sx={{ width: 14, height: 14, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#DC2626" strokeWidth="3"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"></polyline><polyline points="17 6 23 6 23 12"></polyline></svg>
                        </Box>
                        <Typography sx={{ color: '#DC2626', fontSize: '0.75rem', fontWeight: 700 }}>+18% <Box component="span" sx={{ color: '#94A3B8', fontWeight: 500 }}>last week</Box></Typography>
                      </Box>
                    </Box>
                  ) : card.isTotalStudents ? (
                    <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 1 }}>
                      <Typography sx={{ fontWeight: 700, fontSize: '2.5rem', color: '#111827', lineHeight: 1 }}>{card.value}</Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 22, height: 22, borderRadius: '6px', border: '1.5px solid #22C55E' }}>
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#22C55E" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"></polyline><polyline points="17 6 23 6 23 12"></polyline></svg>
                        </Box>
                        <Typography sx={{ fontSize: '0.8125rem', fontWeight: 700, color: '#22C55E' }}>
                          {card.trend} <Box component="span" sx={{ color: '#94A3B8', fontWeight: 500, ml: 0.5 }}>25 last week</Box>
                        </Typography>
                      </Box>
                    </Box>
                  ) : (
                    <Typography sx={{ fontWeight: 700, fontSize: '2.5rem', color: '#111827', lineHeight: 1 }}>{card.value}</Typography>
                  )}
                  
                  {card.isPendingFinal ? (
                    <Box sx={{ position: 'relative', width: 120, height: 60, mb: -1 }}>
                      <svg width="120" height="60" viewBox="0 0 120 60" style={{ overflow: 'visible' }}>
                        <defs>
                          <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#FACC15" stopOpacity="0.2" />
                            <stop offset="100%" stopColor="#FACC15" stopOpacity="0" />
                          </linearGradient>
                        </defs>
                        <path
                          d="M0 40 C 20 40, 30 20, 50 20 C 70 20, 80 45, 100 45 C 110 45, 115 35, 120 35"
                          fill="none"
                          stroke="#FACC15"
                          strokeWidth="3"
                          strokeLinecap="round"
                        />
                        <path
                          d="M0 40 C 20 40, 30 20, 50 20 C 70 20, 80 45, 100 45 C 110 45, 115 35, 120 35 V 60 H 0 Z"
                          fill="url(#chartGradient)"
                        />
                        <circle cx="100" cy="45" r="4" fill="#FACC15" />
                        <text x="100" y="32" fontSize="10" fontWeight="700" fill="#111827" textAnchor="middle">18%</text>
                      </svg>
                    </Box>
                  ) : (card.trend && !card.isTotalStudents) && (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, bgcolor: card.trendUp ? '#fef08a' : '#FEF2F2', px: 1, py: 0.25, borderRadius: '999px' }}>
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={card.trendUp ? '#000000' : '#EF4444'} strokeWidth="3"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"></polyline><polyline points="17 6 23 6 23 12"></polyline></svg>
                      <Typography sx={{ color: card.trendUp ? '#000000' : '#DC2626', fontSize: '0.75rem', fontWeight: 700 }}>{card.trend}</Typography>
                    </Box>
                  )}
                </Box>
                {card.efficiency && (
                  <Box sx={{ width: '100%', mt: 'auto', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                    <Box display="flex" alignItems="center">
                      <Box display="flex">
                        {filteredReady.slice(0, 3).map((r, i) => (
                          <Avatar
                            key={i}
                            src={getAbsoluteUrl(r.avatarUrl)}
                            sx={{
                              width: 36,
                              height: 36,
                              border: '2px solid #FFF',
                              ml: i === 0 ? 0 : -1,
                              zIndex: 3 - i,
                              fontSize: '0.75rem',
                              bgcolor: '#374151'
                            }}
                          >
                            {getInitials(r.name || "User")}
                          </Avatar>
                        ))}
                      </Box>
                      {filteredReady.length > 3 && (
                        <Typography sx={{ ml: 1, fontSize: '0.875rem', fontWeight: 600, color: '#111827' }}>
                          +{filteredReady.length - 3}
                        </Typography>
                      )}
                    </Box>
                    <Box>
                      <IconButton
                        onClick={() => setStudentListOpen(true)}
                        sx={{
                          bgcolor: '#FFF',
                          boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
                          border: '1px solid #E5E7EB',
                          '&:hover': { bgcolor: '#F9FAFB' }
                        }}
                      >
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#4F46E5" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>
                      </IconButton>
                    </Box>
                  </Box>
                )}
                  </Box>
            ))}
          </Box>

          <Box display="flex" flexWrap="wrap" gap={2} alignItems="center" mb={3} justifyContent="space-between">
            <Box display="flex" gap={1.5} flexWrap="wrap">
              <Button
                variant="outlined"
                startIcon={filterDate ? <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg> : <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>}
                onClick={() => {
                  if (filterDate) {
                    setFilterDate("");
                    setPage(0);
                  } else {
                    dateInputRef.current?.showPicker();
                  }
                }}
                sx={{ textTransform: 'none', borderRadius: '8px', bgcolor: filterDate ? '#ecfeff' : 'transparent', color: filterDate ? '#0891b2' : '#64748B', borderColor: filterDate ? '#cffafe' : '#D1D5DB', fontWeight: 600, fontSize: '0.8125rem', px: 2, height: 36, '&:hover': { bgcolor: filterDate ? '#cffafe' : '#F9FAFB' } }}
              >
                {filterDate || "All time"}
                <input
                  type="date"
                  ref={dateInputRef}
                  style={{ opacity: 0, position: 'absolute', width: 0, height: 0 }}
                  onChange={(e) => { setFilterDate(e.target.value); setPage(0); }}
                />
              </Button>
              <Select
                variant="outlined"
                displayEmpty
                value={filterCourse}
                onChange={(e) => { setFilterCourse(e.target.value as string); setPage(0); }}
                sx={{
                  minWidth: 140, height: 36, bgcolor: '#ecfeff', borderRadius: '8px', fontSize: '0.8125rem', fontWeight: 600, color: '#0891b2',
                  '& .MuiOutlinedInput-notchedOutline': { borderColor: '#cffafe' },
                  '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#cffafe' },
                  '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: '#cffafe' }
                }}
              >
                <MenuItem value="" sx={{ fontSize: '0.8125rem', fontWeight: 600 }}>All Courses</MenuItem>
                {availableCourses.map(c => (<MenuItem key={c} value={c} sx={{ fontSize: '0.8125rem' }}>{getCourseLabel(c)}</MenuItem>))}
              </Select>
              <Button
                variant="outlined"
                onClick={(e) => setMoreAnchor(e.currentTarget)}
                startIcon={<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="4" y1="6" x2="20" y2="6"></line><line x1="8" y1="12" x2="16" y2="12"></line><line x1="10" y1="18" x2="14" y2="18"></line></svg>}
                sx={{ textTransform: 'none', borderRadius: '8px', color: filterYear ? '#0891b2' : '#374151', bgcolor: filterYear ? '#ecfeff' : 'transparent', borderColor: filterYear ? '#cffafe' : '#D1D5DB', fontWeight: 600, fontSize: '0.8125rem', px: 2, height: 36 }}
              >
                {filterYear || "More filters"}
              </Button>
              <Menu
                anchorEl={moreAnchor}
                open={Boolean(moreAnchor)}
                onClose={() => setMoreAnchor(null)}
                PaperProps={{ sx: { borderRadius: '12px', mt: 1, minWidth: 180, boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' } }}
              >
                <MenuItem disabled sx={{ fontSize: '0.75rem', fontWeight: 700, opacity: 0.5, color: '#64748B' }}>YEAR LEVEL</MenuItem>
                <MenuItem
                  selected={filterYear === ""}
                  onClick={() => { setFilterYear(""); setPage(0); setMoreAnchor(null); }}
                  sx={{ fontSize: '0.875rem' }}
                >
                  All Years
                </MenuItem>
                {YEAR_LEVELS.map(y => (
                  <MenuItem
                    key={y}
                    selected={filterYear === y}
                    onClick={() => { setFilterYear(y); setPage(0); setMoreAnchor(null); }}
                    sx={{ fontSize: '0.875rem' }}
                  >
                    {y}
                  </MenuItem>
                ))}
                {filterYear && (
                  <>
                    <Divider />
                    <MenuItem
                      onClick={() => { setFilterYear(""); setPage(0); setMoreAnchor(null); }}
                      sx={{ fontSize: '0.875rem', color: '#EF4444' }}
                    >
                      Clear Year Filter
                    </MenuItem>
                  </>
                )}
              </Menu>
            </Box>

            <TextField
              variant="outlined"
              placeholder="Search..."
              size="small"
              value={query}
              onChange={(e) => { setQuery(e.target.value); setPage(0); }}
              sx={{ width: 280, '& .MuiOutlinedInput-root': { borderRadius: '8px', bgcolor: '#FFF', height: 40 } }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#6B7280" strokeWidth="2"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
                  </InputAdornment>
                )
              }}
            />
          </Box>

          <Box sx={{ backgroundColor: "#FAFAFA", borderRadius: '16px', p: 3, mb: 4 }}>
            <Box display="flex" alignItems="center" justifyContent="space-between" gap={1.5} mb={3}>
              <Box display="flex" alignItems="center" gap={1.5}>
                <Box sx={{ width: 36, height: 36, borderRadius: '8px', backgroundColor: '#F1F5F9', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#000" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
                </Box>
                <Box>
                  <Typography sx={{ fontWeight: 700, color: '#000', fontSize: '0.95rem' }}>Clearances Overview</Typography>
                  <Typography sx={{ color: '#64748B', fontSize: '0.8rem' }}>Manage and execute actions on final clearances</Typography>
                </Box>
              </Box>
            </Box>

            <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid #E5E7EB', borderRadius: '12px', overflow: 'hidden', bgcolor: '#FFF' }}>
              <Table>
                <TableHead sx={{ bgcolor: '#F9FAFB' }}>
                  <TableRow sx={{ borderBottom: '1px solid #E5E7EB' }}>
                    <TableCell padding="checkbox" sx={{ py: 2 }}><Checkbox size="small" /></TableCell>
                    <TableCell sx={{ fontWeight: 600, color: "#6B7280", fontSize: '0.75rem', py: 2, borderBottom: 'none' }}>STUDENT</TableCell>
                    <TableCell sx={{ fontWeight: 600, color: "#6B7280", fontSize: '0.75rem', py: 2, borderBottom: 'none' }}>STATUS</TableCell>
                    <TableCell sx={{ fontWeight: 600, color: "#6B7280", fontSize: '0.75rem', py: 2, borderBottom: 'none' }}>COURSE & YEAR</TableCell>
                    <TableCell sx={{ fontWeight: 600, color: "#6B7280", fontSize: '0.75rem', py: 2, borderBottom: 'none' }}>ORGANIZATION SIGNATURES</TableCell>
                    <TableCell sx={{ fontWeight: 600, color: "#6B7280", fontSize: '0.75rem', py: 2, borderBottom: 'none' }}>CLEARANCE PROGRESS</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 600, color: "#6B7280", fontSize: '0.75rem', py: 2, borderBottom: 'none' }}></TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {paginatedReady.map((r) => (
                    <TableRow key={r.id} hover sx={{ '& td': { borderBottom: '1px solid #F3F4F6' }, '&:last-child td': { borderBottom: 0 } }}>
                      <TableCell padding="checkbox"><Checkbox size="small" checked={selected?.id === r.id} /></TableCell>
                      <TableCell sx={{ py: 2 }}>
                        <Box display="flex" alignItems="center" gap={1.5}>
                          <Avatar
                            src={getAbsoluteUrl(r.avatarUrl)}
                            sx={{ width: 40, height: 40, bgcolor: '#020617', color: '#FFF', fontWeight: 800, fontSize: '0.875rem', textShadow: '-0.5px 0 0 rgba(0,255,255,0.4), 0.5px 0 0 rgba(255,165,0,0.4)' }}
                          >
                            {r.name.substring(0, 2).toUpperCase()}
                          </Avatar>
                          <Box>
                            <Typography sx={{ fontWeight: 600, color: "#111827", fontSize: '0.875rem' }}>{r.name}</Typography>
                            <Typography sx={{ color: "#6B7280", fontSize: '0.8125rem' }}>{r.studentId}</Typography>
                          </Box>
                        </Box>
                      </TableCell>
                      <TableCell sx={{ py: 2 }}>
                        <Box sx={{
                          display: 'inline-flex', alignItems: 'center', gap: 0.5, px: 1, py: 0.25, borderRadius: '999px',
                          bgcolor: filterStatus === "approved" ? "#ECFDF5" : "#F0F9FF"
                        }}>
                          <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: filterStatus === "approved" ? "#10B981" : "#0EA5E9" }} />
                          <Typography sx={{ color: filterStatus === "approved" ? "#047857" : "#0369A1", fontSize: '0.75rem', fontWeight: 600 }}>
                            {filterStatus === "approved" ? "Approved" : "Pending Final"}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell sx={{ py: 2 }}>
                        <Box>
                          <Typography sx={{ fontWeight: 500, color: "#111827", fontSize: '0.875rem' }}>{r.course}</Typography>
                          <Typography sx={{ color: "#6B7280", fontSize: '0.8125rem' }}>{r.year}</Typography>
                        </Box>
                      </TableCell>
                      <TableCell sx={{ py: 2 }}>
                        <Box display="flex">
                          {[1, 2, 3].map(n => (
                            <Avatar
                              key={n}
                              sx={{ width: 24, height: 24, ml: n > 1 ? -0.75 : 0, border: '2px solid #FFF', bgcolor: '#F1F5F9', color: '#6B7280', fontSize: '0.65rem' }}
                            >
                              {n}+
                            </Avatar>
                          ))}
                          <Typography sx={{ color: '#6B7280', fontSize: '0.75rem', fontWeight: 600, ml: 1, alignSelf: 'center' }}>+2</Typography>
                        </Box>
                      </TableCell>
                      <TableCell sx={{ py: 2 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, width: '100%', maxWidth: 120 }}>
                          <Box sx={{ flex: 1, height: 8, bgcolor: '#F3F4F6', borderRadius: '4px', overflow: 'hidden' }}>
                            <Box sx={{ width: `${(r.reqCompleted / r.reqTotal) * 100}%`, height: '100%', bgcolor: '#008080', borderRadius: '4px' }} />
                          </Box>
                        </Box>
                      </TableCell>
                      <TableCell align="right" sx={{ py: 2 }}>
                        <Box display="flex" justifyContent="flex-end" gap={0.5}>
                          <IconButton
                            size="small"
                            sx={{ color: '#6B7280' }}
                            onClick={() => { setStudentToApprove(r); setSignatureModalOpen(true); }}
                            disabled={actionState !== 'idle' && actionRowId === r.id}
                          >
                            {actionState === 'loading' && actionRowId === r.id ?
                              <CircularProgress size={16} color="inherit" /> :
                              (actionState === 'success' && actionRowId === r.id ?
                                <CheckIcon sx={{ fontSize: 18, color: '#10B981' }} /> :
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 20h9"></path><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path></svg>
                              )
                            }
                          </IconButton>
                          <IconButton size="small" sx={{ color: '#6B7280' }} onClick={() => setSelected(r)}>
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
                          </IconButton>
                        </Box>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
            {paginatedReady.length === 0 && (
              <EmptyState
                icon={<svg width="40" height="40" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2" /><path d="M20 20l-3.5-3.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg>}
                title="No students found"
                description={query || filterCourse || filterYear || filterDate ? "Try adjusting your filters to find what you're looking for." : "There are currently no students ready for final approval."}
              />
            )}
            <Box mt={3} pt={3} display="flex" justifyContent="space-between" alignItems="center" sx={{ borderTop: '1px solid #E5E7EB' }}>
              <Button
                variant="outlined"
                disabled={page === 0}
                onClick={() => setPage(p => Math.max(0, p - 1))}
                sx={{ textTransform: 'none', borderRadius: '8px', color: '#374151', borderColor: '#D1D5DB', fontWeight: 600, fontSize: '0.875rem', px: 2 }}
              >
                Previous
              </Button>
              <Typography sx={{ color: "#374151", fontSize: '0.875rem', fontWeight: 500 }}>
                Page {page + 1} of {Math.ceil(filteredReady.length / rowsPerPage) || 1}
              </Typography>
              <Button
                variant="outlined"
                disabled={(page + 1) * rowsPerPage >= filteredReady.length}
                onClick={() => setPage(p => p + 1)}
                sx={{ textTransform: 'none', borderRadius: '8px', color: '#374151', borderColor: '#D1D5DB', fontWeight: 600, fontSize: '0.875rem', px: 2 }}
              >
                Next
              </Button>
            </Box>
          </Box>
        </>
      ) : active === "approvals" ? (
        <>
          <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
            <Box>
              <Typography variant="h5" sx={{ fontWeight: 800, color: "#0F172A" }}>Organization Approvals</Typography>
              <Typography sx={{ color: "#6B7280", fontSize: 13 }}>Pre-dean approvals</Typography>
            </Box>
          </Box>
          <Box display="grid" gridTemplateColumns={{ xs: "1fr", sm: "1fr 1fr", lg: "repeat(4, 1fr)" }} gap={2} mb={3}>
            {[
              {
                label: "Total Received", value: orgRows.length, color: "#2563EB", icon: (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M4 7h16M4 12h16M4 17h10" stroke="#2563EB" strokeWidth="2" /></svg>
                )
              },
              {
                label: "Pending", value: orgRows.filter(r => (r.status || "Pending") === "Pending").length, color: "#F59E0B", icon: (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12 8v4l3 3" stroke="#F59E0B" strokeWidth="2" strokeLinecap="round" /></svg>
                )
              },
              {
                label: "Approved Today", value: 0, color: "#16A34A", icon: (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M20 6L9 17l-5-5" stroke="#16A34A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
                )
              },
              {
                label: "Rejected Today", value: 0, color: "#DC2626", icon: (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M7 7l10 10M17 7L7 17" stroke="#DC2626" strokeWidth="2" strokeLinecap="round" /></svg>
                )
              }
            ].map((card) => (
              <Box key={card.label} sx={{ border: "1px solid #E5E7EB", borderRadius: 1, backgroundColor: "#FFFFFF", p: 3 }}>
                <Box display="flex" alignItems="center" gap={1.5}>
                  <Box aria-hidden sx={{ width: 28, height: 28, borderRadius: 9999, backgroundColor: `${card.color}22`, display: "flex", alignItems: "center", justifyContent: "center" }}>{card.icon}</Box>
                  <Box>
                    <Typography sx={{ fontWeight: 800, fontSize: 20 }}>{card.value}</Typography>
                    <Typography sx={{ color: "#6B7280", fontSize: 12 }}>{card.label}</Typography>
                  </Box>
                </Box>
              </Box>
            ))}
          </Box>
          <Box sx={{ mb: 3 }}>
            <Box display="flex" flexWrap="wrap" gap={2} alignItems="center">
              <TextField
                variant="standard"
                placeholder="Search by name or ID"
                value={query}
                onChange={(e) => { setQuery(e.target.value); setPage(0); }}
                sx={{ flex: 1, minWidth: 240 }}
                InputProps={{
                  disableUnderline: true,
                  startAdornment: (
                    <InputAdornment position="start">
                      <Box aria-hidden sx={{ width: 16, height: 16 }}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="11" cy="11" r="7" stroke="#64748B" strokeWidth="2" /><path d="M20 20l-3.5-3.5" stroke="#64748B" strokeWidth="2" strokeLinecap="round" /></svg>
                      </Box>
                    </InputAdornment>
                  ),
                  sx: { bgcolor: '#F8FAFC', borderRadius: '8px', px: 2, py: 1, fontSize: '0.875rem', border: '1px solid #E2E8F0', transition: 'all 0.2s', '&:hover': { borderColor: '#CBD5E1' } }
                }}
              />
              <Select
                variant="standard"
                displayEmpty
                value={filterCourse}
                onChange={(e) => { setFilterCourse(e.target.value as string); setPage(0); }}
                disableUnderline
                sx={{ minWidth: 200, bgcolor: '#F8FAFC', borderRadius: '8px', px: 2, py: 1, fontSize: '0.875rem', border: '1px solid #E2E8F0', transition: 'all 0.2s', '&:hover': { borderColor: '#CBD5E1' }, '& .MuiSelect-select': { py: 0, '&:focus': { bgcolor: 'transparent' } } }}
              >
                <MenuItem value="" sx={{ fontSize: '0.875rem' }}><em>All Courses</em></MenuItem>
                {COURSES.map(c => (<MenuItem key={c} value={c} sx={{ fontSize: '0.875rem' }}>{getCourseLabel(c)}</MenuItem>))}
              </Select>
              <Select
                variant="standard"
                displayEmpty
                value={filterYear}
                onChange={(e) => { setFilterYear(e.target.value as string); setPage(0); }}
                disableUnderline
                sx={{ minWidth: 160, bgcolor: '#F8FAFC', borderRadius: '8px', px: 2, py: 1, fontSize: '0.875rem', border: '1px solid #E2E8F0', transition: 'all 0.2s', '&:hover': { borderColor: '#CBD5E1' }, '& .MuiSelect-select': { py: 0, '&:focus': { bgcolor: 'transparent' } } }}
              >
                <MenuItem value="" sx={{ fontSize: '0.875rem' }}><em>All Year Levels</em></MenuItem>
                {YEAR_LEVELS.map(y => (<MenuItem key={y} value={y} sx={{ fontSize: '0.875rem' }}>{y}</MenuItem>))}
              </Select>
              <TextField
                variant="standard"
                type="date"
                value={filterDate}
                onChange={(e) => { setFilterDate(e.target.value); setPage(0); }}
                sx={{ minWidth: 160 }}
                InputProps={{
                  disableUnderline: true,
                  sx: { bgcolor: '#F8FAFC', borderRadius: '8px', px: 2, py: 1, fontSize: '0.875rem', border: '1px solid #E2E8F0', transition: 'all 0.2s', '&:hover': { borderColor: '#CBD5E1' } }
                }}
              />
              <Select
                variant="standard"
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value as any)}
                disableUnderline
                sx={{ minWidth: 140, bgcolor: '#F8FAFC', borderRadius: '8px', px: 2, py: 1, fontSize: '0.875rem', border: '1px solid #E2E8F0', transition: 'all 0.2s', '&:hover': { borderColor: '#CBD5E1' }, '& .MuiSelect-select': { py: 0, '&:focus': { bgcolor: 'transparent' } } }}
              >
                <MenuItem value="newest" sx={{ fontSize: '0.875rem' }}>Newest First</MenuItem>
                <MenuItem value="oldest" sx={{ fontSize: '0.875rem' }}>Oldest First</MenuItem>
              </Select>
              {(query || filterCourse || filterYear || filterDate) && (
                <Button
                  variant="text"
                  onClick={() => { setQuery(""); setFilterCourse(""); setFilterYear(""); setFilterDate(""); setPage(0); }}
                  sx={{ textTransform: 'none', color: '#64748B', fontWeight: 600, '&:hover': { bgcolor: '#F1F5F9', color: '#0F172A' } }}
                >
                  Clear filters
                </Button>
              )}
            </Box>
          </Box>
          <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid #E5E7EB', borderRadius: '12px', overflow: 'hidden', bgcolor: '#FFF' }}>
            <Table size="small">
              <TableHead sx={{ bgcolor: "#F9FAFB" }}>
                <TableRow sx={{ borderBottom: '1px solid #E5E7EB' }}>
                  <TableCell sx={{ fontWeight: 600, color: "#6B7280", fontSize: '0.75rem', py: 2, borderBottom: 'none' }}>STUDENT</TableCell>
                  <TableCell sx={{ fontWeight: 600, color: "#6B7280", fontSize: '0.75rem', py: 2, borderBottom: 'none' }}>COURSE / YEAR</TableCell>
                  <TableCell align="center" sx={{ fontWeight: 600, color: "#6B7280", fontSize: '0.75rem', py: 2, borderBottom: 'none' }}>STATUS</TableCell>
                  <TableCell align="center" sx={{ fontWeight: 600, color: "#6B7280", fontSize: '0.75rem', py: 2, borderBottom: 'none' }}>PROGRESS</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 600, color: "#6B7280", fontSize: '0.75rem', py: 2, borderBottom: 'none' }}>ACTION</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {paginatedOrg.map((r) => (
                  <TableRow key={r.id} hover sx={{ '& td': { borderBottom: '1px solid #F3F4F6' }, '&:last-child td': { borderBottom: 0 } }}>
                    <TableCell sx={{ py: 2, fontWeight: 600, color: "#111827", fontSize: '0.875rem' }}>{r.name}</TableCell>
                    <TableCell sx={{ py: 2, color: "#6B7280", fontSize: "0.8125rem" }}>{r.course} – {r.year}</TableCell>
                    <TableCell align="center" sx={{ py: 2 }}>
                      <Chip
                        label={r.status || "Pending"}
                        size="small"
                        sx={{
                          fontWeight: 700, fontSize: "0.65rem", height: 22,
                          ...(r.status === "Approved" ? { bgcolor: "#ECFDF5", color: "#10B981" } :
                            r.status === "Rejected" ? { bgcolor: "#FEF2F2", color: "#EF4444" } :
                              { bgcolor: "#F8FAFC", color: "#64748B", border: "1px solid #E2E8F0" })
                        }}
                      />
                    </TableCell>
                    <TableCell align="center" sx={{ py: 2, fontWeight: 600, color: "#475569", fontSize: "0.8125rem" }}>{(r.reqCompleted || 0)} / {(r.reqTotal || 0)}</TableCell>
                    <TableCell align="right" sx={{ py: 2 }}>
                      <Button
                        variant="outlined"
                        size="small"
                        onClick={() => setSelected(r)}
                        sx={{
                          fontFamily: fontStack,
                          fontWeight: 600,
                          textTransform: 'none',
                          borderRadius: '8px',
                          borderColor: '#D1D5DB',
                          color: '#374151',
                          fontSize: '0.75rem',
                          '&:hover': { backgroundColor: '#F9FAFB', borderColor: '#CBD5E1' }
                        }}
                      >
                        View
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            {paginatedOrg.length === 0 && (
              <EmptyState
                icon={<svg width="40" height="40" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2" /><path d="M20 20l-3.5-3.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg>}
                title="No organization clearances found"
                description={query || filterCourse || filterYear || filterDate ? "Try adjusting your filters to find what you're looking for." : "There are currently no pre-dean approvals to review."}
              />
            )}
            <Box mt={3} pt={3} display="flex" justifyContent="space-between" alignItems="center" sx={{ borderTop: '1px solid #E5E7EB', p: 2 }}>
              <Button variant="outlined" disabled={page === 0} onClick={() => setPage(p => Math.max(0, p - 1))} sx={{ textTransform: 'none', borderRadius: '8px', color: '#374151', borderColor: '#D1D5DB', fontWeight: 600, fontSize: '0.875rem', px: 2 }}>Previous</Button>
              <Typography sx={{ color: "#374151", fontSize: '0.875rem', fontWeight: 500 }}>Page {page + 1} of {Math.ceil(filteredOrg.length / rowsPerPage) || 1}</Typography>
              <Button variant="outlined" disabled={(page + 1) * rowsPerPage >= filteredOrg.length} onClick={() => setPage(p => p + 1)} sx={{ textTransform: 'none', borderRadius: '8px', color: '#374151', borderColor: '#D1D5DB', fontWeight: 600, fontSize: '0.875rem', px: 2 }}>Next</Button>
            </Box>
          </TableContainer>
        </>
      ) : active === "faqs" ? (
        <DeanFAQPage />
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
            {signatureUrl && !sigDrawData && (
              <Box sx={{ p: 2, border: '1px solid #E2E8F0', borderRadius: '8px', mb: 2, textAlign: 'center', backgroundColor: '#FFF' }}>
                <Typography variant="caption" sx={{ display: 'block', mb: 1, color: '#64748B' }}>Current Saved Signature:</Typography>
                <img src={signatureUrl} alt="Last Saved Signature" style={{ maxHeight: 80, maxWidth: '100%' }} />
              </Box>
            )}

            <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
              <Button
                size="small"
                variant={sigMode === "draw" ? "contained" : "outlined"}
                onClick={() => setSigMode("draw")}
                sx={{ textTransform: 'none', borderRadius: '8px', bgcolor: sigMode === "draw" ? '#000' : 'transparent', color: sigMode === "draw" ? '#FFF' : '#000' }}
              >
                Draw Signature
              </Button>
              <Button
                size="small"
                variant={sigMode === "upload" ? "contained" : "outlined"}
                onClick={() => setSigMode("upload")}
                sx={{ textTransform: 'none', borderRadius: '8px', bgcolor: sigMode === "upload" ? '#000' : 'transparent', color: sigMode === "upload" ? '#FFF' : '#000' }}
              >
                Upload Image
              </Button>
            </Box>

            {sigMode === "draw" && (
              <Box sx={{ border: '1px dashed #CBD5E1', borderRadius: '8px', p: 1, backgroundColor: '#FFF' }}>
                <Typography variant="caption" sx={{ display: 'block', textAlign: 'center', mb: 1, color: '#94A3B8' }}>Draw your signature in the box below</Typography>
                <Box sx={{ height: 150, width: '100%', position: 'relative', border: '1px solid #F1F5F9', borderRadius: '4px' }}>
                  <canvas
                    width={700}
                    height={150}
                    onMouseDown={(e) => {
                      const canvas = e.currentTarget;
                      const ctx = canvas.getContext('2d');
                      if (!ctx) return;
                      ctx.beginPath();
                      ctx.lineWidth = 2;
                      ctx.lineCap = 'round';
                      ctx.strokeStyle = '#000';
                      const rect = canvas.getBoundingClientRect();
                      const x = e.clientX - rect.left;
                      const y = e.clientY - rect.top;
                      ctx.moveTo(x, y);
                      (canvas as any).isDrawing = true;
                    }}
                    onMouseMove={(e) => {
                      const canvas = e.currentTarget;
                      if (!(canvas as any).isDrawing) return;
                      const ctx = canvas.getContext('2d');
                      if (!ctx) return;
                      const rect = canvas.getBoundingClientRect();
                      const x = e.clientX - rect.left;
                      const y = e.clientY - rect.top;
                      ctx.lineTo(x, y);
                      ctx.stroke();
                    }}
                    onMouseUp={(e) => {
                      const canvas = e.currentTarget;
                      (canvas as any).isDrawing = false;
                      setSigDrawData(canvas.toDataURL());
                    }}
                    style={{ width: '100%', height: '100%', cursor: 'crosshair', touchAction: 'none' }}
                  />
                </Box>
                <Button size="small" fullWidth sx={{ mt: 1, textTransform: 'none' }} onClick={() => {
                  setSigDrawData("");
                  const canvas = document.querySelector('canvas');
                  if (canvas) {
                    const ctx = canvas.getContext('2d');
                    if (ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
                  }
                }}>Clear Canvas</Button>
              </Box>
            )}

            {sigMode === "upload" && (
              <Box sx={{ border: '1px dashed #CBD5E1', borderRadius: '8px', p: 3, textAlign: 'center', backgroundColor: '#FFF' }}>
                <Button variant="outlined" component="label" sx={{ textTransform: 'none', borderRadius: '8px', color: '#000', borderColor: '#000' }}>
                  Select Signature Image
                  <input type="file" hidden accept="image/*" onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      const base64 = await toBase64(file);
                      setSigDrawData(base64);
                    }
                  }} />
                </Button>
                {sigDrawData && sigMode === "upload" && (
                  <Box sx={{ mt: 2 }}>
                    <Typography variant="caption" sx={{ display: 'block', mb: 1 }}>Preview:</Typography>
                    <img src={sigDrawData} alt="Upload Preview" style={{ maxHeight: 80 }} />
                  </Box>
                )}
              </Box>
            )}
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
      )}

      <Dialog open={!!selected && (isApprovals || isFinal)} onClose={() => setSelected(null)} fullWidth maxWidth="md">
        <DialogTitle>View Details</DialogTitle>
        <DialogContent>
          {selected && (
            <Box display="grid" gridTemplateColumns={{ xs: "1fr", md: "1fr 1fr" }} gap={3}>
              <Box>
                <Typography sx={{ fontWeight: 700, mb: 1 }}>Student Information</Typography>
                <Box display="flex" flexDirection="column" gap={0.5}>
                  <Typography>Name: {selected.name}</Typography>
                  <Typography>ID: {selected.studentId}</Typography>
                  <Typography>Course/Year: {selected.course} – {selected.year}</Typography>
                  <Typography>Date submitted: {selected.dateSubmitted}</Typography>
                  <Typography>Requirements: {(selected.reqCompleted || 0)}/{(selected.reqTotal || 0)}</Typography>
                </Box>
              </Box>
              <Box>
                <Typography sx={{ fontWeight: 700, mb: 1 }}>Organization Clearances</Typography>
                <Box display="flex" flexDirection="column" gap={1}>
                  {selected.organizations && selected.organizations.length > 0 ? (
                    selected.organizations.map((org: any, idx: number) => (
                      <Box key={idx} display="flex" flexDirection="column" gap={1} sx={{ border: "1px solid #E5E7EB", borderRadius: 1, p: 1.5 }}>
                        <Box display="flex" alignItems="center" justifyContent="space-between">
                          <Typography sx={{ fontWeight: 600, fontSize: "0.875rem" }}>{org.name}</Typography>
                          <Chip size="small" label={org.status === 'completed' || org.status === 'officer_cleared' ? 'Cleared' : org.status} sx={{ height: 20, fontSize: "0.7rem", fontWeight: 700, bgcolor: org.status === 'completed' || org.status === 'officer_cleared' ? '#ECFDF5' : '#F1F5F9', color: org.status === 'completed' || org.status === 'officer_cleared' ? '#10B981' : '#64748B' }} />
                        </Box>
                        <Divider sx={{ my: 0.5 }} />
                        {org.signatureUrl ? (
                          <Box display="flex" alignItems="center" gap={1.5}>
                            <Typography sx={{ fontSize: '0.75rem', color: '#64748B' }}>Officer Signature:</Typography>
                            <img src={org.signatureUrl} alt="Signature" style={{ height: 35, objectFit: 'contain' }} />
                          </Box>
                        ) : (
                          <Typography sx={{ fontSize: '0.75rem', color: '#94A3B8', fontStyle: 'italic' }}>No signature provided yet</Typography>
                        )}
                      </Box>
                    ))
                  ) : (
                    ["Valid ID", "Adviser form", "Organization form"].map((req, idx) => (
                      <Box key={idx} display="flex" alignItems="center" justifyContent="space-between" sx={{ border: "1px solid #E5E7EB", borderRadius: 1, p: 1.5 }}>
                        <Typography>{req}</Typography>
                        <Box display="flex" alignItems="center" gap={1}>
                          <IconButton size="small">
                            <Box aria-hidden sx={{ width: 18, height: 18 }}>
                              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12 5v8M8 9l4-4 4 4" stroke="#0F172A" strokeWidth="2" strokeLinecap="round" /></svg>
                            </Box>
                          </IconButton>
                        </Box>
                      </Box>
                    ))
                  )}
                </Box>
              </Box>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => setSelected(null)}
            sx={{
              fontFamily: "'Inter', 'Plus Jakarta Sans', 'Montserrat', sans-serif",
              fontWeight: 600,
              textTransform: 'none',
              borderRadius: '999px',
              color: '#64748B'
            }}
          >
            Close
          </Button>
        </DialogActions>
      </Dialog>

      <SignatureModal
        open={signatureModalOpen}
        onClose={() => setSignatureModalOpen(false)}
        onConfirm={finalize}
      />
      <StudentListPopup
        open={studentListOpen}
        onClose={() => setStudentListOpen(false)}
        students={readyRows.filter(s => s.name.toLowerCase().includes(popupSearch.toLowerCase()))}
        searchQuery={popupSearch}
        onSearchChange={setPopupSearch}
      />
    </RoleLayout>
  );
}
