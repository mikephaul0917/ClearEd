import { useEffect, useMemo, useState } from "react";
import { useAuth } from "../../hooks/useAuth";
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
import { getInitials, formatNameFromEmail, getAbsoluteUrl } from "../../utils/avatarUtils";
import GenericConfirmationModal from "../../components/modals/GenericConfirmationModal";
import SuccessMessage from "../../components/SuccessMessage";
import { showGlobalModal } from "../../components/GlobalModal";
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
  SettingsHeader,
  SettingsActions,
  SettingsSkeleton
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
  pageBg: '#F9FAFB',
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

const fontStack = '"Google Sans", "Product Sans", Roboto, sans-serif';

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
  const { updateUser } = useAuth();
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
  const [isShuffling, setIsShuffling] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeletingAvatar, setIsDeletingAvatar] = useState(false);
  const [settingsLoading, setSettingsLoading] = useState(false);
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
    if (active === 'settings') {
      setSettingsLoading(true);
      const timer = setTimeout(() => setSettingsLoading(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [active]);

  useEffect(() => {
    (async () => {
      try {
        const storedUserStr = localStorage.getItem("user");
        const fullUser = storedUserStr ? JSON.parse(storedUserStr) : null;
        const savedUsername = localStorage.getItem("username") || fullUser?.fullName || fullUser?.firstName || "";
        const baseName = savedUsername || formatNameFromEmail(email || "");
        const parts = baseName.split(" ");
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

  const handleDeleteAvatar = async () => {
    setIsDeletingAvatar(true);
    try {
      await api.put("/auth/profile", { avatarUrl: "" });
      setAvatarUrl("");
      updateUser({ avatarUrl: "" });
      updateLocalAvatar("");
      setShowDeleteConfirm(false);
    } catch (err) {
      console.error("Delete failed:", err);
    } finally {
      setIsDeletingAvatar(false);
    }
  };

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
    const name = formatNameFromEmail(email || "", "Officer");
    return name;
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
      ) : active === "settings" ? (
        settingsLoading ? (
          <SettingsSkeleton />
        ) : (
          <SettingsContainer>
            <SettingsHeader
              title="Account Information"
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
                    updateUser({ avatarUrl: res.data.avatarUrl });
                    updateLocalAvatar(res.data.avatarUrl);
                  } catch (err: any) {
                    console.error("Upload failed:", err);
                  }
                }}
                onDelete={() => setShowDeleteConfirm(true)}
              />

              <GenericConfirmationModal
                open={showDeleteConfirm}
                onClose={() => setShowDeleteConfirm(false)}
                onConfirm={handleDeleteAvatar}
                loading={isDeletingAvatar}
                title={
                  <>
                    Are You Sure <br /> Want To Remove?
                  </>
                }
                description={
                  <>
                    You are about to remove your profile picture. <br />
                    This action <strong>cannot be undone</strong>.
                  </>
                }
                confirmText="Yes, Remove"
              />
            </SettingsSection>

            <SettingsSection>
              <SettingsRow>
                <SettingsField
                  label="First Name"
                >
                  <TextField
                    fullWidth
                    name="first-name"
                    autoComplete="given-name"
                    value={draftFirst}
                    onChange={(e) => setDraftFirst(e.target.value)}
                    sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px', bgcolor: '#F8FAFC', border: '1px solid #E2E8F0', '& fieldset': { border: 'none' } } }}
                  />
                </SettingsField>
                <SettingsField
                  label="Last Name"
                >
                  <TextField
                    fullWidth
                    name="last-name"
                    autoComplete="family-name"
                    value={draftLast}
                    onChange={(e) => setDraftLast(e.target.value)}
                    sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px', bgcolor: '#F8FAFC', border: '1px solid #E2E8F0', '& fieldset': { border: 'none' } } }}
                  />
                </SettingsField>
              </SettingsRow>
            </SettingsSection>

            <SettingsSection>
              <SettingsRow>
                <SettingsField
                  label="Email"
                >
                  <TextField
                    fullWidth
                    name="real-email"
                    autoComplete="email"
                    value={email}
                    disabled
                    sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px', bgcolor: '#F1F5F9', border: '1px solid #E2E8F0', '& fieldset': { border: 'none' } } }}
                  />
                </SettingsField>
                <SettingsField label="Account Type">
                  <TextField
                    fullWidth
                    value="Organization Officer"
                    disabled
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
                    sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px', bgcolor: '#F8FAFC', border: '1px solid #E2E8F0', '& fieldset': { border: 'none' } } }}
                  />
                </SettingsField>
              </SettingsRow>
            </SettingsSection>

            <SettingsActions>
              <Button
                variant="contained"
                onClick={(e) => { e.preventDefault(); updateProfile(); }}
                fullWidth={isSmallMobile}
                sx={{
                  backgroundColor: '#3c4043',
                  color: '#FFF',
                  padding: '12px 16px',
                  borderRadius: '8px',
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
                fullWidth={isSmallMobile}
                sx={{
                  color: '#000',
                  borderColor: '#000',
                  borderWidth: '1.2px',
                  padding: '12px 16px',
                  borderRadius: '8px',
                  textTransform: 'none',
                  fontWeight: 700,
                  fontSize: '1rem',
                  backgroundColor: '#FFF',
                  boxShadow: '0 4px 10px rgba(0,0,0,0.15)',
                  '&:hover': {
                    borderColor: '#000',
                    bgcolor: '#F8FAFC',
                    transform: 'translateY(-1px)',
                    boxShadow: '0 6px 15px rgba(0,0,0,0.2)'
                  },
                  transition: 'all 0.2s ease'
                }}
              >
                Update Password
              </Button>
            </SettingsActions>
          </SettingsContainer>
        )) : null}
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
