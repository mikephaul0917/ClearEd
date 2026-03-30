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
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
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
import { getInitials } from "../../utils/avatarUtils";
import SuccessMessage from "../../components/SuccessMessage";
import OfficerClassroomView from "../../components/officer/OfficerClassroomView";
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
  border: '1px solid #D1D5DB',
  boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
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
  const [avatarUrl, setAvatarUrl] = useState("");
  const updateLocalAvatar = (url: string) => {
    try {
      const u = JSON.parse(localStorage.getItem("user") || "{}");
      u.avatarUrl = url;
      localStorage.setItem("user", JSON.stringify(u));
      window.dispatchEvent(new Event("storage"));
    } catch { }
  };
  const [notice, setNotice] = useState<any>((location.state as any)?.banner ?? null);
  const [signatureUrl, setSignatureUrl] = useState<string | null>(null);
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
  const [successModalOpen, setSuccessModalOpen] = useState(false);
  const [successModalTitle, setSuccessModalTitle] = useState("");
  const [successModalDescription, setSuccessModalDescription] = useState("");
  const [passwordModalOpen, setPasswordModalOpen] = useState(false);
  const [passwordUpdateLoading, setPasswordUpdateLoading] = useState(false);


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
    (async () => {
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

        // Fetch avatar and profile
        try {
          const profileRes = await api.get("/auth/profile");
          if (profileRes.data.avatarUrl) {
            setAvatarUrl(profileRes.data.avatarUrl);
            updateLocalAvatar(profileRes.data.avatarUrl);
          }
        } catch (err) {
          console.error("Failed to fetch profile:", err);
        }

        // Fetch pending submissions
        try {
          const pendingRes = await api.get("/signatory/pending");
          const pendingRows: PendingRow[] = (pendingRes.data.rows || []).map((r: any, idx: number) => ({
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
          setRows(pendingRows);
        } catch (err) {
          console.error("Failed to fetch pending:", err);
          setRows([
            { id: "1", name: "Juan Dela Cruz", course: "BSIT", year: "3rd Year", status: "Pending", reqCompleted: 2, reqTotal: 3, dateSubmitted: new Date().toISOString().slice(0, 10), studentId: "S-00001", approvedAt: null, rejectedAt: null },
            { id: "2", name: "Maria Santos", course: "BSCS", year: "4th Year", status: "For Review", reqCompleted: 3, reqTotal: 3, dateSubmitted: new Date().toISOString().slice(0, 10), studentId: "S-00002", approvedAt: null, rejectedAt: null }
          ]);
        }
      } catch (err) {
        console.error("Initialization error:", err);
      }
    })();
  }, [email]);

  useEffect(() => {
    if (isSettings) {
      (async () => {
        try {
          const res = await api.get("/auth/profile");
          const p = res.data;
          setSignatureUrl(p.signatureUrl || null);
          if (p.fullName) {
            const parts = p.fullName.split(" ");
            setDraftFirst(parts[0] || "");
            setDraftLast(parts.slice(1).join(" ") || "");
          }
        } catch { }
      })();
    }
  }, [isSettings]);

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
    return getInitials(fullName);
  }, [fullName]);

  const draftFullName = useMemo(() => {
    return `${draftFirst.trim()} ${draftLast.trim()}`.trim() || fullName;
  }, [draftFirst, draftLast, fullName]);



  const logout = () => { authService.logout(); nav("/", { state: { banner: { message: "Logged out successfully!", variant: "success" } } }); };

  const updateProfile = async () => {
    const fullName = `${draftFirst} ${draftLast}`.trim();
    try {
      await api.put("/auth/profile", { fullName, signatureUrl });
      setProfileFirst(draftFirst.trim());
      setProfileLast(draftLast.trim());
      setSuccessModalTitle("Profile Updated Successfully");
      setSuccessModalDescription("Your administrative account details have been successfully saved.");
      setSuccessModalOpen(true);
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
      setNotice({ message: msg, variant: "error" });
    } finally {
      setPasswordUpdateLoading(false);
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
    <>
      {notice && (
        <SuccessMessage message={notice.message} variant={notice.variant} onClose={() => setNotice(null)} />
      )}
      {active === "review" ? (
        <OfficerClassroomView />
      ) : active === "todo" ? (
        <TodoPage />
      ) : (
        <SettingsContainer>
          <SettingsHeader 
            title="Account Information" 
            subtitle="Manage your administrative account settings" 
          />

          <SettingsSection>
            <ProfilePictureSection
              avatarUrl={avatarUrl ? (avatarUrl.startsWith('http') ? avatarUrl : `http://localhost:5000${avatarUrl}`) : undefined}
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
              <SettingsField 
                label="First Name"
                labelAction={
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, cursor: 'pointer', opacity: 0.8, '&:hover': { opacity: 1 } }}>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                    <Typography sx={{ fontSize: '0.75rem', fontWeight: 700 }}>Edit</Typography>
                  </Box>
                }
              >
                <TextField
                  fullWidth
                  name="first-name"
                  autoComplete="given-name"
                  value={draftFirst}
                  onChange={(e) => setDraftFirst(e.target.value)}
                  InputProps={{
                    endAdornment: (
                      <Box sx={{ color: '#94A3B8', display: 'flex' }}>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
                      </Box>
                    )
                  }}
                  sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px', bgcolor: '#F8FAFC', border: '1px solid #E2E8F0', '& fieldset': { border: 'none' } } }}
                />
              </SettingsField>
              <SettingsField 
                label="Last Name"
                labelAction={
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, cursor: 'pointer', color: '#64748B' }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#5EEAD4" strokeWidth="3"><polyline points="20 6 9 17 4 12"></polyline></svg>
                    <Typography sx={{ fontSize: '0.75rem', fontWeight: 700 }}>Save</Typography>
                  </Box>
                }
              >
                <TextField
                  fullWidth
                  name="last-name"
                  autoComplete="family-name"
                  value={draftLast}
                  onChange={(e) => setDraftLast(e.target.value)}
                  InputProps={{
                    endAdornment: (
                      <Box sx={{ color: '#94A3B8', display: 'flex' }}>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
                      </Box>
                    )
                  }}
                  sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px', bgcolor: '#F8FAFC', border: '1px solid #E2E8F0', '& fieldset': { border: 'none' } } }}
                />
              </SettingsField>
            </SettingsRow>
          </SettingsSection>

          <SettingsSection>
            <SettingsRow>
              <SettingsField 
                label="Email"
                labelAction={
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, bgcolor: 'rgba(176, 224, 230, 0.2)', px: 1.2, py: 0.5, borderRadius: '999px' }}>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#0E7490" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12"></polyline>
                    </svg>
                    <Typography sx={{ fontSize: '0.75rem', fontWeight: 700, color: '#0E7490' }}>Verified</Typography>
                  </Box>
                }
              >
                <TextField
                  fullWidth
                  name="real-email"
                  autoComplete="email"
                  value={email}
                  disabled
                  InputProps={{
                    endAdornment: (
                      <Box sx={{ color: '#94A3B8', display: 'flex' }}>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path><polyline points="22,6 12,13 2,6"></polyline></svg>
                      </Box>
                    )
                  }}
                  sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px', bgcolor: '#F1F5F9', border: '1px solid #E2E8F0', '& fieldset': { border: 'none' } } }}
                />
              </SettingsField>
              <SettingsField label="Account Type" labelAction={
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, bgcolor: 'rgba(176, 224, 230, 0.2)', px: 1.2, py: 0.5, borderRadius: '999px' }}>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#0E7490" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12"></polyline>
                    </svg>
                    <Typography sx={{ fontSize: '0.75rem', fontWeight: 700, color: '#0E7490' }}>Active</Typography>
                  </Box>
                }>
                <TextField
                  fullWidth
                  value="Organization Officer"
                  disabled
                  InputProps={{
                    endAdornment: (
                      <Box sx={{ color: '#94A3B8', display: 'flex' }}>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg>
                      </Box>
                    )
                  }}
                  sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px', bgcolor: '#F1F5F9', border: '1px solid #E2E8F0', '& fieldset': { border: 'none' } } }}
                />
              </SettingsField>
            </SettingsRow>
          </SettingsSection>



          <SettingsSection>
            <SettingsRow>
              <SettingsField label="New Password">
                <TextField
                  type="password"
                  fullWidth
                  placeholder="Enter new password"
                  autoComplete="new-password"
                  value={newPass}
                  onChange={(e) => setNewPass(e.target.value)}
                  InputProps={{
                    endAdornment: (
                      <Box sx={{ color: '#94A3B8', display: 'flex' }}>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
                      </Box>
                    )
                  }}
                  sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px', bgcolor: '#F8FAFC', border: '1px solid #E2E8F0', '& fieldset': { border: 'none' } } }}
                />
              </SettingsField>
              <SettingsField label="Confirm Password">
                <TextField
                  type="password"
                  fullWidth
                  placeholder="Confirm new password"
                  autoComplete="new-password"
                  value={confirmPass}
                  onChange={(e) => setConfirmPass(e.target.value)}
                  InputProps={{
                    endAdornment: (
                      <Box sx={{ color: '#94A3B8', display: 'flex' }}>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
                      </Box>
                    )
                  }}
                  sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px', bgcolor: '#F8FAFC', border: '1px solid #E2E8F0', '& fieldset': { border: 'none' } } }}
                />
              </SettingsField>
            </SettingsRow>
          </SettingsSection>

          <Box sx={{ display: 'flex', gap: 2, mt: 6, pt: 4, borderTop: '1px solid #F1F5F9' }}>
            <Button
              variant="contained"
              onClick={(e) => { e.preventDefault(); updateProfile(); }}
              startIcon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>}
              sx={{
                backgroundColor: '#000', color: '#FFF', py: 1.2, px: 4, borderRadius: '100px', textTransform: 'none', fontWeight: 800, fontSize: '0.875rem',
                boxShadow: '0 10px 20px -5px rgba(0,0,0,0.3)',
                '&:hover': { backgroundColor: '#111', transform: 'translateY(-2px)', boxShadow: '0 12px 24px -5px rgba(0,0,0,0.4)' },
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
              }}
            >
              Update Profile Info
            </Button>
            <Button
              variant="outlined"
              onClick={updatePassword}
              startIcon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3m-3-3l-2.25-2.25"></path></svg>}
              sx={{
                color: '#0F172A', borderColor: '#E2E8F0', py: 1.2, px: 4, borderRadius: '100px', textTransform: 'none', fontWeight: 800, fontSize: '0.875rem',
                bgcolor: '#FFF',
                boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
                '&:hover': { borderColor: '#CBD5E1', bgcolor: '#F8FAFC', transform: 'translateY(-2px)', boxShadow: '0 8px 16px rgba(0,0,0,0.08)' },
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
              }}
            >
              Update Password
            </Button>
          </Box>
        </SettingsContainer>
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
