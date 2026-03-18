import { useEffect, useMemo, useState } from "react";
import React from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import Paper from "@mui/material/Paper";
import TextField from "@mui/material/TextField";
import FormControl from "@mui/material/FormControl";
import FormLabel from "@mui/material/FormLabel";
import Divider from "@mui/material/Divider";
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
import { useLocation, useNavigate } from "react-router-dom";
import { api, authService } from '../../services';
import SuccessMessage from "../../components/SuccessMessage";
import OfficerClassroomView from "../../components/officer/OfficerClassroomView";
import RoleLayout from "../../components/layout/RoleLayout";
import TodoPage from "../todo/TodoPage";
import { EmptyState } from "../../components/layout/EmptyState";
import { Skeleton, useTheme, useMediaQuery } from "@mui/material";
import BusinessIcon from "@mui/icons-material/Business";
import PeopleIcon from "@mui/icons-material/People";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import ErrorIcon from "@mui/icons-material/Error";
import PendingIcon from "@mui/icons-material/PendingActions";
import SearchIcon from "@mui/icons-material/Search";
import RefreshIcon from "@mui/icons-material/Refresh";
import FilterListIcon from "@mui/icons-material/FilterList";

type PendingRow = {
  id: string;
  name: string;
  course: string;
  year?: string;
  status?: "Pending" | "For Review" | "Approved" | "Rejected";
  reqCompleted?: number;
  reqTotal?: number;
  dateSubmitted?: string;
  studentId?: string;
  approvedAt?: string | null;
  rejectedAt?: string | null;
};

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
  border: '1px solid rgba(0,0,0,0.06)',
  boxShadow: 'none',
};

export default function OfficerPage() {
  const location = useLocation();
  const nav = useNavigate();
  const isReview = location.pathname.includes("/review");
  const isSettings = location.pathname.includes("/settings");
  const isTodo = location.pathname.includes("/todo");
  const active: "review" | "settings" | "todo" =
    isSettings ? "settings" : isTodo ? "todo" : "review";
  const [rows, setRows] = useState<PendingRow[]>([]);
  const [signature, setSignature] = useState<File | null>(null);
  const [remarks, setRemarks] = useState("");
  const token = typeof localStorage !== "undefined" ? localStorage.getItem("token") : null;
  const email = typeof localStorage !== "undefined" ? (localStorage.getItem("email") || "officer@example.com") : "officer@example.com";
  const storedRole = (() => { try { return localStorage.getItem("role") || ""; } catch { return ""; } })();
  const roleText = storedRole || "Officer";
  const [profileFirst, setProfileFirst] = useState("");
  const [profileLast, setProfileLast] = useState("");
  const [draftFirst, setDraftFirst] = useState("");
  const [draftLast, setDraftLast] = useState("");
  const [currentPass, setCurrentPass] = useState("");
  const [newPass, setNewPass] = useState("");
  const [confirmPass, setConfirmPass] = useState("");
  const [notice, setNotice] = useState<any>((location.state as any)?.banner ?? null);
  const [query, setQuery] = useState("");
  const [filterCourse, setFilterCourse] = useState<string>("");
  const [filterYear, setFilterYear] = useState<string>("");
  const [filterDate, setFilterDate] = useState<string>("");
  const [selected, setSelected] = useState<PendingRow | null>(null);
  const [myOrgs, setMyOrgs] = useState<any[]>([]);
  const [loadingOrgs, setLoadingOrgs] = useState(true);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [sortOrder, setSortOrder] = useState<"newest" | "oldest">("newest");
  const [uploaded, setUploaded] = useState<{ organization: string; files: { url: string; name?: string; type?: string }[] }[]>([]);
  const [sigMode, setSigMode] = useState<"upload" | "draw">("upload");
  const [sigDrawData, setSigDrawData] = useState<string>("");
  const canvasRef = (typeof document !== "undefined") ? (document.createElement("canvas") as HTMLCanvasElement) : null;

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

  const getCourseLabel = (c: string) => {
    const match = c.match(/\(([^)]+)\)/);
    return match ? `${match[1]} - ${c.split(' (')[0].replace(/BACHELOR OF (SCIENCE IN |ARTS IN |)?/i, '')}` : c;
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

  const friendlyOrg = (dep: string) => {
    const s = (dep || "").toLowerCase();
    if (s.includes("imc") || s.includes("library") || s === "avr") return "IMC / Library";
    if (s.includes("student development") || s.includes("sdo") || s.includes("student dev")) return "Student Development Office";
    return dep || "Organization";
  };

  const friendlyType = (t: string) => {
    const s = (t || "").toLowerCase();
    if (s === "library_card") return "Validated library card";
    if (s === "pre_enrollment") return "Pre-enrollment screenshot";
    if (s === "student_id") return "Validated student ID";
    return "Requirement";
  };

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
    (async () => {
      try {
        const res = await api.get("/signatory/pending");
        const base: PendingRow[] = (res.data.rows || []).map((r: any, idx: number) => ({
          id: r.id || String(idx + 1),
          name: r.name || r.studentName || "Unknown",
          course: r.course || "BSCS",
          year: r.year || "3rd Year",
          status: r.status || "Pending",
          reqCompleted: r.reqCompleted ?? 2,
          reqTotal: r.reqTotal ?? 3,
          dateSubmitted: r.dateSubmitted || new Date().toISOString().slice(0, 10),
          studentId: r.studentId || `S-${(idx + 1).toString().padStart(5, "0")}`,
          approvedAt: null,
          rejectedAt: null
        }));
        setRows(base);
      } catch {
        setRows([
          { id: "1", name: "Juan Dela Cruz", course: "BSIT", year: "3rd Year", status: "Pending", reqCompleted: 2, reqTotal: 3, dateSubmitted: new Date().toISOString().slice(0, 10), studentId: "S-00001", approvedAt: null, rejectedAt: null },
          { id: "2", name: "Maria Santos", course: "BSCS", year: "4th Year", status: "For Review", reqCompleted: 3, reqTotal: 3, dateSubmitted: new Date().toISOString().slice(0, 10), studentId: "S-00002", approvedAt: null, rejectedAt: null }
        ]);
      }
    })();
  }, [email]);

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const isSmallMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const refreshData = async () => {
    setLoadingOrgs(true);
    try {
      const pendingRes = await api.get("/signatory/pending");
      const base: PendingRow[] = (pendingRes.data.rows || []).map((r: any, idx: number) => ({
        id: r.id || String(idx + 1),
        name: r.name || r.studentName || "Unknown",
        course: r.course || "BSCS",
        year: r.year || "3rd Year",
        status: r.status || "Pending",
        reqCompleted: r.reqCompleted ?? 2,
        reqTotal: r.reqTotal ?? 3,
        dateSubmitted: r.dateSubmitted || new Date().toISOString().slice(0, 10),
        studentId: r.studentId || `S-${(idx + 1).toString().padStart(5, "0")}`,
        approvedAt: null,
        rejectedAt: null
      }));
      setRows(base);

      const orgsRes = await api.get("/organizations/my-organizations");
      setMyOrgs(orgsRes.data.organizations || []);
    } catch { }
    setLoadingOrgs(false);
  };

  useEffect(() => {
    refreshData();
  }, []);

  useEffect(() => {
    if (isReview) {
      const st = (location.state as any)?.student || null;
      if (st) setSelected(st);
    }
  }, [isReview, location.state]);

  useEffect(() => {
    (async () => {
      try {
        if (selected?.studentId) {
          const res = await api.get("/signatory/files", { params: { studentId: selected.studentId } });
          setUploaded(res.data.items || []);
        } else {
          setUploaded([]);
        }
      } catch { }
    })();
  }, [selected]);

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
    return name || "Officer";
  }, [profileFirst, profileLast, email]);

  const initials = useMemo(() => {
    const words = fullName.split(" ").filter(Boolean);
    const first = words[0]?.[0] || "O";
    const second = words[1]?.[0] || "F";
    return (first + second).toUpperCase();
  }, [fullName]);

  const approve = async () => {
    if (!selected) { setNotice({ message: "Select a student first", variant: "error" }); return; }
    try {
      let signaturePayload: any = undefined;
      if (sigMode === "upload" && signature) {
        const content = await toBase64(signature);
        signaturePayload = { mode: "upload", file: { name: signature.name, content } };
      } else if (sigMode === "draw" && sigDrawData) {
        signaturePayload = { mode: "draw", dataUrl: sigDrawData };
      }
      await api.post("/signatory/approve", { studentId: selected.studentId, signature: signaturePayload });
      setNotice({ message: "Approval submitted", variant: "success" });
      if (selected) {
        setRows(prev => prev.map(r => r.id === selected.id ? { ...r, status: "Approved", approvedAt: new Date().toISOString() } : r));
        setSelected(null);
      }
    } catch (err: any) {
      const msg = err.response?.data?.message || "Failed to submit approval";
      setNotice({ message: msg, variant: "error" });
    }
  };

  const reject = async () => {
    try {
      if (!selected) { setNotice({ message: "Select a student first", variant: "error" }); return; }
      await api.post("/signatory/remarks", { remarks, studentId: selected.studentId });
      setNotice({ message: "Remarks saved", variant: "success" });
      if (selected) {
        setRows(prev => prev.map(r => r.id === selected.id ? { ...r, status: "Rejected", rejectedAt: new Date().toISOString() } : r));
        setSelected(null);
      }
    } catch (err: any) {
      const msg = err.response?.data?.message || "Failed to save remarks";
      setNotice({ message: msg, variant: "error" });
    }
  };

  const logout = () => { authService.logout(); nav("/", { state: { banner: { message: "Logged out successfully!", variant: "success" } } }); };

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

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    let list = rows;
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
  }, [rows, query, filterCourse, filterYear, filterDate, sortOrder]);

  const paginated = useMemo(() => {
    const start = page * rowsPerPage;
    return filtered.slice(start, start + rowsPerPage);
  }, [filtered, page, rowsPerPage]);

  const totalReceived = rows.length;
  const approvedToday = useMemo(() => rows.filter(r => r.approvedAt && r.approvedAt.slice(0, 10) === new Date().toISOString().slice(0, 10)).length, [rows]);
  const rejectedToday = useMemo(() => rows.filter(r => r.rejectedAt && r.rejectedAt.slice(0, 10) === new Date().toISOString().slice(0, 10)).length, [rows]);
  const pendingWaiting = useMemo(() => rows.filter(r => (r.status || "Pending") === "Pending").length, [rows]);

  return (
    <RoleLayout>
      {notice && (
        <SuccessMessage message={notice.message} variant={notice.variant} onClose={() => setNotice(null)} />
      )}
      {active === "review" ? (
        <OfficerClassroomView />
      ) : active === "todo" ? (
        <TodoPage />
      ) : (
        <Box maxWidth={720} mx="auto">
          <Box mb={3} display="flex" alignItems="center" gap={1.5}>
            <Box aria-hidden sx={{ width: 40, height: 40, borderRadius: 1, backgroundColor: "#E5E7EB", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 6a6 6 0 100 12 6 6 0 000-12z" stroke="#111827" strokeWidth="2" />
                <path d="M12 2v3M12 19v3M2 12h3M19 12h3" stroke="#111827" strokeWidth="2" strokeLinecap="round" />
              </svg>
            </Box>
            <Typography variant="h6" sx={{ fontWeight: 800, color: "#111827" }}>Security Settings</Typography>
          </Box>
          <Box display="flex" flexDirection="column" gap={3}>
            <FormControl>
              <FormLabel sx={{ fontSize: 13, color: "#374151", mb: 0.5 }}>Current Password</FormLabel>
              <TextField type="password" placeholder="Enter current password" value={currentPass} onChange={(e) => setCurrentPass(e.target.value)} fullWidth sx={{ '& .MuiOutlinedInput-root': { borderRadius: 1 }, '& .MuiInputBase-input::placeholder': { color: '#9CA3AF' } }} />
            </FormControl>
            <FormControl>
              <FormLabel sx={{ fontSize: 13, color: "#374151", mb: 0.5 }}>New Password</FormLabel>
              <TextField type="password" placeholder="Enter new password" value={newPass} onChange={(e) => setNewPass(e.target.value)} fullWidth sx={{ '& .MuiOutlinedInput-root': { borderRadius: 1 }, '& .MuiInputBase-input::placeholder': { color: '#9CA3AF' } }} />
            </FormControl>
            <FormControl>
              <FormLabel sx={{ fontSize: 13, color: "#374151", mb: 0.5 }}>Confirm New Password</FormLabel>
              <TextField type="password" placeholder="Confirm new password" value={confirmPass} onChange={(e) => setConfirmPass(e.target.value)} fullWidth sx={{ '& .MuiOutlinedInput-root': { borderRadius: 1 }, '& .MuiInputBase-input::placeholder': { color: '#9CA3AF' } }} />
            </FormControl>
          </Box>
          <Button variant="contained" color="primary" onClick={updatePassword} fullWidth sx={{ mt: 3, borderRadius: 2, height: 52, backgroundColor: "#000", '&:hover': { backgroundColor: "#111" } }}>Update Password</Button>
        </Box>
      )}
    </RoleLayout>
  );
}
