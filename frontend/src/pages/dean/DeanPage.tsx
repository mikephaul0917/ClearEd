import { useLocation, useNavigate } from "react-router-dom";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import Paper from "@mui/material/Paper";
import TextField from "@mui/material/TextField";
import FormControl from "@mui/material/FormControl";
import FormLabel from "@mui/material/FormLabel";
import Divider from "@mui/material/Divider";
import { api, authService } from '../../services';
import { useEffect, useState } from "react";
import DeanApprovalsSimple from "../../components/dean/DeanApprovalsSimple";
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
import RoleLayout from "../../components/layout/RoleLayout";
import ToggleButton from "@mui/material/ToggleButton";
import ToggleButtonGroup from "@mui/material/ToggleButtonGroup";
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
  const isFinal = !isApprovals && !isSettings;
  const active = isSettings ? "settings" : isApprovals ? "approvals" : "final";
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
    } catch {}
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

  const [readyRows, setReadyRows] = useState<any[]>([]);
  const [orgRows, setOrgRows] = useState<any[]>([]);

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

  const fullName = (() => {
    const cap = (s: string) => s ? s.charAt(0).toUpperCase() + s.slice(1) : "";
    const composed = [cap(profileFirst.trim()), cap(profileLast.trim())].filter(Boolean).join(" ");
    if (composed) return composed;
    const local = (email || "").split("@")[0];
    const parts = local.replace(/[._-]+/g, " ").split(" ").filter(Boolean);
    const name = parts.map(cap).join(" ");
    return name || "Dean";
  })();

  const loadData = async () => {
    try {
      const res = await api.get("/dean/courses");
      setAvailableCourses(res.data.courses || []);
    } catch {
      setAvailableCourses(COURSES);
    }
    try {
      const res = await api.get("/dean/final-ready", { params: { status: filterStatus } });
      const items = (res.data.rows || []).map((r: any, idx: number) => ({
        id: r.id || String(idx + 1),
        status: filterStatus,
        name: r.name || r.studentName || "Unknown",
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
    if (filterCourse) list = list.filter(r => normalizeCourse(r.course) === filterCourse);
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
    if (filterCourse) list = list.filter(r => normalizeCourse(r.course) === filterCourse);
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
  const finalizedToday = 0;
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
      {isFinal ? (
        <>
          <Box display="flex" alignItems="center" justifyContent="space-between" mb={4}>
            <Box>
              <Typography variant="h4" sx={{ fontWeight: 800, color: "#000", fontFamily: fontStack, letterSpacing: '-0.02em', mb: 0.5 }}>Final Approval</Typography>
              <Typography sx={{ color: "#64748B", fontSize: '0.95rem' }}>Manage and approve finalized student clearances</Typography>
            </Box>
          </Box>

          <Box display="grid" gridTemplateColumns={{ xs: "1fr", sm: "1fr 1fr", lg: "repeat(4, 1fr)" }} gap={3} mb={4}>
            {[
              {
                label: "READY FOR APPROVAL", value: readyCount, dotColor: "#10B981", bgColor: "#F4FDF8"
              },
              {
                label: "FINALIZED TODAY", value: finalizedToday, dotColor: "#A855F7", bgColor: "#FAF5FF"
              },
              {
                label: "REJECTED TODAY", value: rejectedToday, dotColor: "#EF4444", bgColor: "#FFF5F5"
              },
              {
                label: "PENDING ORGANIZATIONS", value: orgRows.length, dotColor: "#EAB308", bgColor: "#FFFFF0"
              }
            ].map((card) => (
              <Box key={card.label} sx={{ borderRadius: '16px', backgroundColor: card.bgColor, p: 3, display: 'flex', flexDirection: 'column', position: 'relative', overflow: 'hidden' }}>
                <Box sx={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: card.dotColor, mb: 2 }} />
                <Typography sx={{ color: "#64748B", fontSize: '0.7rem', fontWeight: 800, letterSpacing: '0.05em', mb: 1.5 }}>{card.label}</Typography>
                <Typography sx={{ fontWeight: 800, fontSize: '2rem', color: '#000', lineHeight: 1 }}>{card.value}</Typography>
              </Box>
            ))}
          </Box>

          <Box sx={{ backgroundColor: "#FAFAFA", borderRadius: '16px', p: 3, mb: 4 }}>
            <Box display="flex" alignItems="center" gap={1.5} mb={3}>
              <Box sx={{ width: 36, height: 36, borderRadius: '8px', backgroundColor: '#F1F5F9', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#000" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="4" y1="6" x2="20" y2="6"></line><line x1="8" y1="12" x2="16" y2="12"></line><line x1="10" y1="18" x2="14" y2="18"></line></svg>
              </Box>
              <Box>
                <Typography sx={{ fontWeight: 700, color: '#000', fontSize: '0.95rem' }}>Filter Clearances</Typography>
                <Typography sx={{ color: '#64748B', fontSize: '0.8rem' }}>Search name/ID and refine by course, year or date</Typography>
              </Box>
            </Box>

            <Box display="flex" flexWrap="wrap" gap={2} alignItems="center">
              <TextField
                variant="outlined"
                placeholder="Search students..."
                value={query}
                onChange={(e) => { setQuery(e.target.value); setPage(0); }}
                sx={{ flex: 1, minWidth: 240, '& .MuiOutlinedInput-root': { borderRadius: '999px', bgcolor: '#FFF', height: 44 } }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Box aria-hidden sx={{ width: 16, height: 16 }}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="11" cy="11" r="7" stroke="#64748B" strokeWidth="2" /><path d="M20 20l-3.5-3.5" stroke="#64748B" strokeWidth="2" strokeLinecap="round" /></svg>
                      </Box>
                    </InputAdornment>
                  )
                }}
              />
              <Select
                variant="outlined"
                displayEmpty
                value={filterCourse}
                onChange={(e) => { setFilterCourse(e.target.value as string); setPage(0); }}
                sx={{ minWidth: 200, bgcolor: '#FFF', borderRadius: '999px', height: 44, fontSize: '0.875rem' }}
              >
                <MenuItem value="" sx={{ fontSize: '0.875rem' }}><em>All Courses</em></MenuItem>
                {availableCourses.map(c => (<MenuItem key={c} value={c} sx={{ fontSize: '0.875rem' }}>{getCourseLabel(c)}</MenuItem>))}
              </Select>
              <Select
                variant="outlined"
                displayEmpty
                value={filterYear}
                onChange={(e) => { setFilterYear(e.target.value as string); setPage(0); }}
                sx={{ minWidth: 160, bgcolor: '#FFF', borderRadius: '999px', height: 44, fontSize: '0.875rem' }}
              >
                <MenuItem value="" sx={{ fontSize: '0.875rem' }}><em>All Year Levels</em></MenuItem>
                {YEAR_LEVELS.map(y => (<MenuItem key={y} value={y} sx={{ fontSize: '0.875rem' }}>{y}</MenuItem>))}
              </Select>
              <TextField
                variant="outlined"
                type="date"
                value={filterDate}
                onChange={(e) => { setFilterDate(e.target.value); setPage(0); }}
                sx={{ minWidth: 160, '& .MuiOutlinedInput-root': { borderRadius: '999px', bgcolor: '#FFF', height: 44 } }}
              />
              <Select
                variant="outlined"
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value as any)}
                sx={{ minWidth: 140, bgcolor: '#FFF', borderRadius: '999px', height: 44, fontSize: '0.875rem' }}
              >
                <MenuItem value="newest" sx={{ fontSize: '0.875rem' }}>Newest First</MenuItem>
                <MenuItem value="oldest" sx={{ fontSize: '0.875rem' }}>Oldest First</MenuItem>
              </Select>
              {(query || filterCourse || filterYear || filterDate) && (
                <Button
                  variant="text"
                  onClick={() => { setQuery(""); setFilterCourse(""); setFilterYear(""); setFilterDate(""); setPage(0); }}
                  sx={{ textTransform: 'none', color: '#64748B', fontWeight: 600, borderRadius: '999px', px: 2, height: 44 }}
                >
                  Clear filters
                </Button>
              )}
            </Box>
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

              <ToggleButtonGroup
                value={filterStatus}
                exclusive
                onChange={(_, val) => val && setFilterStatus(val)}
                aria-label="clearance status"
                sx={{
                  bgcolor: '#F8FAFC',
                  borderRadius: '999px',
                  p: 0.5,
                  border: '1px solid #E2E8F0',
                  height: 38,
                  '& .MuiToggleButton-root': {
                    px: 3,
                    py: 0,
                    borderRadius: '999px',
                    border: 'none',
                    textTransform: 'none',
                    fontWeight: 700,
                    fontSize: '0.8rem',
                    color: '#64748B',
                    transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                    '&.Mui-selected': {
                      bgcolor: '#0F172A',
                      color: '#FFF',
                      boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                      '&:hover': { bgcolor: '#1e293b' }
                    },
                    '&:hover': {
                      bgcolor: 'rgba(0,0,0,0.04)'
                    }
                  }
                }}
              >
                <ToggleButton value="pending">
                  Pending
                </ToggleButton>
                <ToggleButton value="approved">
                  Approved
                </ToggleButton>
              </ToggleButtonGroup>
            </Box>

            <Table size="small">
              <TableHead>
                <TableRow sx={{ borderBottom: '1px solid #E2E8F0' }}>
                  <TableCell sx={{ fontWeight: 800, color: "#94A3B8", fontSize: '0.7rem', letterSpacing: '0.05em', py: 2, borderBottom: 'none' }}>STUDENT</TableCell>
                  <TableCell sx={{ fontWeight: 800, color: "#94A3B8", fontSize: '0.7rem', letterSpacing: '0.05em', py: 2, borderBottom: 'none' }}>COURSE / YEAR</TableCell>
                  <TableCell align="center" sx={{ fontWeight: 800, color: "#94A3B8", fontSize: '0.7rem', letterSpacing: '0.05em', py: 2, borderBottom: 'none' }}>STATUS</TableCell>
                  <TableCell align="center" sx={{ fontWeight: 800, color: "#94A3B8", fontSize: '0.7rem', letterSpacing: '0.05em', py: 2, borderBottom: 'none' }}>PROGRESS</TableCell>
                  <TableCell align="center" sx={{ fontWeight: 800, color: "#94A3B8", fontSize: '0.7rem', letterSpacing: '0.05em', py: 2, borderBottom: 'none' }}>{filterStatus === "approved" ? "APPROVED" : "SUBMITTED"}</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 800, color: "#94A3B8", fontSize: '0.7rem', letterSpacing: '0.05em', py: 2, borderBottom: 'none' }}>ACTIONS</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {paginatedReady.map((r) => (
                  <TableRow key={r.id} hover sx={{ '& td': { borderBottom: '1px solid #F1F5F9' }, '&:last-child td': { borderBottom: 0 } }}>
                    <TableCell sx={{ py: 2 }}>
                      <Box display="flex" alignItems="center" gap={2}>
                        <Box sx={{ width: 36, height: 36, borderRadius: '50%', backgroundColor: '#F8FAFC', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#000', fontWeight: 700, fontSize: '0.8rem' }}>
                          {r.name.charAt(0).toUpperCase()}
                        </Box>
                        <Box>
                          <Typography sx={{ fontWeight: 700, color: "#000", fontSize: '0.85rem' }}>{r.name}</Typography>
                          <Typography sx={{ color: "#64748B", fontSize: '0.75rem' }}>{r.studentId}</Typography>
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell sx={{ py: 2, color: "#64748B", fontSize: "0.85rem", fontWeight: 500 }}>{r.course} – {r.year}</TableCell>
                    <TableCell align="center" sx={{ py: 2 }}>
                      <Chip
                        label={filterStatus === "approved" ? "APPROVED" : "READY"}
                        size="small"
                        sx={{
                          bgcolor: filterStatus === "approved" ? "#DBEAFE" : "#ECFDF5",
                          color: filterStatus === "approved" ? "#2563EB" : "#10B981",
                          fontWeight: 800,
                          fontSize: "0.65rem",
                          height: 22,
                          letterSpacing: '0.05em'
                        }}
                      />
                    </TableCell>
                    <TableCell align="center" sx={{ py: 2, fontWeight: 600, color: "#475569", fontSize: "0.85rem" }}>{(r.reqCompleted || 0)} / {(r.reqTotal || 0)}</TableCell>
                    <TableCell align="center" sx={{ py: 2, color: "#64748B", fontSize: "0.85rem", fontWeight: 500 }}>{filterStatus === "approved" ? r.dateApproved : r.dateSubmitted}</TableCell>
                    <TableCell align="right" sx={{ py: 2 }}>
                      <Box display="flex" justifyContent="flex-end" gap={1}>
                        <IconButton
                          size="small"
                          onClick={() => setSelected(r)}
                          sx={{ color: '#64748B', '&:hover': { color: '#000', bgcolor: '#F1F5F9' } }}
                        >
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
                        </IconButton>
                        {filterStatus === "pending" ? (
                          <Button
                            disableElevation
                            variant="contained"
                            onClick={() => { setStudentToApprove(r); setSignatureModalOpen(true); }}
                            disabled={actionState !== 'idle'}
                            sx={{
                              fontFamily: fontStack,
                              fontWeight: 700,
                              textTransform: 'none',
                              borderRadius: '999px',
                              backgroundColor: actionState === 'success' && actionRowId === r.id ? '#10b981' : '#000',
                              color: '#FFFFFF',
                              px: 2,
                              py: 0.5,
                              fontSize: '0.75rem',
                              display: 'flex', gap: 1, alignItems: 'center',
                              transition: 'all 0.2s ease',
                              '&:hover': { backgroundColor: actionState === 'success' && actionRowId === r.id ? '#10b981' : '#222' },
                              '&.Mui-disabled': { backgroundColor: actionState === 'success' && actionRowId === r.id ? '#10b981' : '#E2E8F0', color: actionState === 'success' && actionRowId === r.id ? '#fff' : '#94A3B8' }
                            }}
                          >
                            {actionState === 'loading' && actionRowId === r.id && <CircularProgress size={12} color="inherit" />}
                            {actionState === 'success' && actionRowId === r.id && <CheckIcon sx={{ fontSize: 16 }} />}
                            {actionRowId === r.id ? (
                              actionState === 'idle' ? 'Approve' : actionState === 'loading' ? 'Approving...' : 'Approved!'
                            ) : 'Approve'}
                          </Button>
                        ) : (
                          <Button
                            variant="outlined"
                            size="small"
                            onClick={() => setSelected(r)}
                            sx={{
                              fontFamily: fontStack,
                              fontWeight: 700,
                              textTransform: 'none',
                              borderRadius: '999px',
                              borderColor: '#E2E8F0',
                              color: '#64748B',
                              px: 2,
                              fontSize: '0.75rem',
                              '&:hover': { bgcolor: '#F1F5F9', borderColor: '#CBD5E1' }
                            }}
                          >
                            View
                          </Button>
                        )}
                      </Box>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            {paginatedReady.length === 0 && (
              <EmptyState
                icon={<svg width="40" height="40" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2" /><path d="M20 20l-3.5-3.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg>}
                title="No students found"
                description={query || filterCourse || filterYear || filterDate ? "Try adjusting your filters to find what you're looking for." : "There are currently no students ready for final approval."}
              />
            )}
            <Box mt={2} display="flex" justifyContent="flex-end">
              <TablePagination component="div" count={filteredReady.length} page={page} onPageChange={(_, newPage) => setPage(newPage)} rowsPerPage={rowsPerPage} onRowsPerPageChange={(e) => { setRowsPerPage(parseInt(e.target.value, 10)); setPage(0); }} rowsPerPageOptions={[5, 10, 25]} sx={{ borderBottom: 'none', '.MuiTablePagination-selectLabel, .MuiTablePagination-displayedRows': { fontSize: '0.8rem', color: '#64748B' } }} />
            </Box>
          </Box>
        </>
      ) : isApprovals ? (
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
          <Paper sx={{ p: 3 }}>
            <Typography variant="h4" sx={{ fontWeight: 800, mb: 2 }}>Pending Clearances</Typography>
            <Table size="small">
              <TableHead sx={{ bgcolor: "#F8FAFC" }}>
                <TableRow>
                  <TableCell sx={{ fontWeight: 600, color: "#475569", py: 1.5 }}>Student</TableCell>
                  <TableCell sx={{ fontWeight: 600, color: "#475569", py: 1.5 }}>Course / Year</TableCell>
                  <TableCell align="center" sx={{ fontWeight: 600, color: "#475569", py: 1.5 }}>Status</TableCell>
                  <TableCell align="center" sx={{ fontWeight: 600, color: "#475569", py: 1.5 }}>Progress</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 600, color: "#475569", py: 1.5 }}>Action</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {paginatedOrg.map((r) => (
                  <TableRow key={r.id} hover sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                    <TableCell sx={{ py: 1.5, fontWeight: 600, color: "#0F172A" }}>{r.name}</TableCell>
                    <TableCell sx={{ py: 1.5, color: "#64748B", fontSize: "0.875rem" }}>{r.course} – {r.year}</TableCell>
                    <TableCell align="center" sx={{ py: 1.5 }}>
                      <Chip
                        label={r.status || "Pending"}
                        size="small"
                        sx={{
                          fontWeight: 700, fontSize: "0.75rem", height: 24,
                          ...(r.status === "Approved" ? { bgcolor: "#ECFDF5", color: "#10B981" } :
                            r.status === "Rejected" ? { bgcolor: "#FEF2F2", color: "#EF4444" } :
                              { bgcolor: "#F8FAFC", color: "#64748B", border: "1px solid #E2E8F0" })
                        }}
                      />
                    </TableCell>
                    <TableCell align="center" sx={{ py: 1.5, fontWeight: 500, color: "#475569", fontSize: "0.875rem" }}>{(r.reqCompleted || 0)} / {(r.reqTotal || 0)}</TableCell>
                    <TableCell align="right" sx={{ py: 1.5 }}>
                      <Button
                        variant="outlined"
                        size="small"
                        onClick={() => setSelected(r)}
                        sx={{
                          fontFamily: "'Inter', 'Plus Jakarta Sans', 'Montserrat', sans-serif",
                          fontWeight: 600,
                          textTransform: 'none',
                          borderRadius: '8px',
                          borderColor: '#E2E8F0',
                          color: '#64748B',
                          '&:hover': { backgroundColor: '#F8FAFC', borderColor: '#CBD5E1' }
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
            <TablePagination component="div" count={filteredOrg.length} page={page} onPageChange={(_, newPage) => setPage(newPage)} rowsPerPage={rowsPerPage} onRowsPerPageChange={(e) => { setRowsPerPage(parseInt(e.target.value, 10)); setPage(0); }} rowsPerPageOptions={[5, 10, 25]} />
          </Paper>
        </>
      ) : (
          <SettingsContainer>
            <SettingsHeader 
              title="Settings" 
              subtitle="Manage your administrative account settings" 
            />

            <SettingsSection>
              <ProfilePictureSection 
                avatarUrl={avatarUrl ? (avatarUrl.startsWith('http') ? avatarUrl : `http://localhost:5000${avatarUrl}`) : undefined}
                initials={fullName.split(' ').map(n=>n[0]).join('')} 
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
    </RoleLayout>
  );
}
