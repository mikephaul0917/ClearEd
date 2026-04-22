import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import Box from "@mui/material/Box";
import { motion, AnimatePresence } from "framer-motion";
import Skeleton from "@mui/material/Skeleton";
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
import Tabs from "@mui/material/Tabs";
import Tab from "@mui/material/Tab";
import { api, authService } from '../../services';
import { useEffect, useState, useMemo, useRef } from "react";
import { showGlobalModal } from "../../components/GlobalModal";
import DeanApprovalsSimple from "../../components/dean/DeanApprovalsSimple";
import DeanFAQPage from "./DeanFAQPage";
import SuccessActionModal from "../../components/SuccessActionModal";
import RevokeApprovalModal from "./components/RevokeApprovalModal";
import StudentListPopup from "./components/StudentListPopup";
import ExportConfirmModal from "./components/ExportConfirmModal";
import PasswordConfirmModal from "./components/PasswordConfirmModal";
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
import LinearProgress from "@mui/material/LinearProgress";
import Select from "@mui/material/Select";
import MenuItem from "@mui/material/MenuItem";
import Alert from "@mui/material/Alert";
import Snackbar from "@mui/material/Snackbar";
import Tooltip from "@mui/material/Tooltip";
import Menu from "@mui/material/Menu";
import ListItemIcon from "@mui/material/ListItemIcon";
import ListItemText from "@mui/material/ListItemText";
import { getAbsoluteUrl, getInitials, formatNameFromEmail } from "../../utils/avatarUtils";
import CircularProgress from "@mui/material/CircularProgress";
import CheckIcon from "@mui/icons-material/Check";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import UndoIcon from "@mui/icons-material/Undo";
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
  SettingsHeader,
  SettingsSkeleton
} from "../../components/layout/SettingsLayout";
import SuccessModal from "../../components/SuccessModal";
import GenericConfirmationModal from "../../components/modals/GenericConfirmationModal";
import { useTheme, useMediaQuery } from "@mui/material";

const COLORS = {
  black: '#0a0a0a',
  textSecondary: '#64748B',
  cardRadius: '16px',
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




const DeanDashboardSkeleton = () => {
  return (
    <Box sx={{ width: '100%', animation: 'fadeIn 0.5s ease-in-out' }}>
      {/* Stats Grid Skeleton */}
      <Box display="grid" gridTemplateColumns={{ xs: "1fr", sm: "1fr 1fr", lg: "repeat(3, 1fr)" }} gap={3} mb={4}>
        {/* Card 1: Total Students */}
        <Box sx={{ p: 3, bgcolor: '#FFF', border: '1px solid #E5E7EB', borderRadius: '16px', minHeight: { xs: 140, sm: 180 }, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', boxShadow: '0 8px 16px rgba(0,0,0,0.04)' }}>
          <Box>
            <Skeleton variant="text" width="60%" height={24} sx={{ mb: 1 }} />
            <Skeleton variant="text" width="30%" height={48} />
          </Box>
          <Box display="flex" alignItems="center" gap={1}>
            <Skeleton variant="rectangular" width={22} height={22} sx={{ borderRadius: '6px' }} />
            <Skeleton variant="text" width={120} height={20} />
          </Box>
        </Box>

        {/* Card 2: Pending */}
        <Box sx={{ p: 3, bgcolor: '#FFF', border: '1px solid #E5E7EB', borderRadius: '16px', minHeight: { xs: 140, sm: 180 }, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', boxShadow: '0 8px 16px rgba(0,0,0,0.04)' }}>
          <Box>
            <Skeleton variant="text" width="60%" height={24} sx={{ mb: 1 }} />
            <Skeleton variant="text" width="30%" height={48} />
          </Box>
          <Box display="flex" alignItems="flex-end" justifyContent="space-between">
            <Skeleton variant="rectangular" width={80} height={24} sx={{ borderRadius: '999px' }} />
            <Skeleton variant="rectangular" width={100} height={40} sx={{ borderRadius: '4px' }} />
          </Box>
        </Box>

        {/* Card 3: Active Recently */}
        <Box sx={{ p: 3, bgcolor: '#FFF', border: '1px solid #E5E7EB', borderRadius: '16px', minHeight: { xs: 140, sm: 180 }, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', boxShadow: '0 8px 16px rgba(0,0,0,0.04)' }}>
          <Box>
            <Skeleton variant="text" width="60%" height={24} sx={{ mb: 1 }} />
            <Skeleton variant="text" width="30%" height={48} />
          </Box>
          <Box display="flex" justifyContent="space-between" alignItems="flex-end">
            <Box display="flex">
              {[1, 2, 3].map(n => (
                <Skeleton key={n} variant="circular" width={36} height={36} sx={{ ml: n > 1 ? -1 : 0, border: '2px solid #FFF' }} />
              ))}
            </Box>
            <Skeleton variant="circular" width={42} height={42} />
          </Box>
        </Box>
      </Box>

      {/* Table Section Skeleton */}
      <Box sx={{ backgroundColor: "#FAFAFA", borderRadius: '16px', p: 3, mb: 4, position: 'relative', minHeight: '400px', display: 'flex', flexDirection: 'column' }}>
        <Box display="flex" alignItems="center" gap={1.5} mb={3}>
          <Skeleton variant="rectangular" width={36} height={36} sx={{ borderRadius: '8px' }} />
          <Box>
            <Skeleton variant="text" width={150} height={20} />
            <Skeleton variant="text" width={200} height={16} />
          </Box>
        </Box>

        <Box display="flex" flexDirection={{ xs: 'column', lg: 'row' }} gap={2} alignItems={{ xs: 'stretch', lg: 'center' }} mb={3} justifyContent="space-between">
          <Box display="flex" gap={1.5} flexWrap="wrap">
            <Skeleton variant="rectangular" sx={{ width: { xs: '100%', sm: 100 }, height: 36, borderRadius: '8px' }} />
            <Skeleton variant="rectangular" sx={{ width: { xs: '100%', sm: 140 }, height: 36, borderRadius: '8px' }} />
            <Skeleton variant="rectangular" sx={{ width: { xs: '100%', sm: 120 }, height: 36, borderRadius: '8px' }} />
          </Box>
          <Skeleton variant="rectangular" sx={{ width: { xs: '100%', lg: 280 }, height: 40, borderRadius: '12px' }} />
        </Box>


        <Box sx={{ border: '1px solid #E5E7EB', borderRadius: '12px', overflow: 'hidden', bgcolor: '#FFF' }}>
          <Box sx={{ p: 2, bgcolor: '#F9FAFB', borderBottom: '1px solid #E5E7EB', display: 'flex', alignItems: 'center', gap: 2 }}>
            <Skeleton variant="rectangular" width={22} height={22} sx={{ borderRadius: '6px' }} />
            <Skeleton variant="text" sx={{ width: { xs: '60%', md: '26%' } }} height={20} />
            <Skeleton variant="text" sx={{ width: '12%' }} height={20} />
            <Skeleton variant="text" sx={{ display: { xs: 'none', md: 'block' }, width: '18%' }} height={20} />
            <Skeleton variant="text" sx={{ display: { xs: 'none', sm: 'block' }, width: '14%' }} height={20} />
            <Skeleton variant="text" sx={{ display: { xs: 'none', lg: 'block' }, width: '14%' }} height={20} />
            <Skeleton variant="text" sx={{ width: '12%' }} height={20} />
            <Skeleton variant="text" sx={{ width: '4%' }} height={20} />
          </Box>
          {[1, 2, 3, 4, 5].map(i => (
            <Box key={i} sx={{ p: 2, display: 'flex', alignItems: 'center', gap: 2, borderBottom: '1px solid #F3F4F6' }}>
              <Skeleton variant="rectangular" width={22} height={22} sx={{ borderRadius: '6px' }} />

              {/* Student */}
              <Box display="flex" alignItems="center" gap={1.5} sx={{ width: { xs: '60%', md: '26%' } }}>
                <Skeleton variant="circular" width={40} height={40} />
                <Box sx={{ width: '100%' }}>
                  <Skeleton variant="text" width="100%" />
                  <Skeleton variant="text" width="60%" />
                </Box>
              </Box>

              {/* Status */}
              <Box sx={{ width: '12%', display: 'flex', justifyContent: 'center' }}>
                <Skeleton variant="rectangular" width={60} height={24} sx={{ borderRadius: '999px' }} />
              </Box>

              {/* Timestamp */}
              <Box sx={{ display: { xs: 'none', md: 'flex' }, width: '18%', justifyContent: 'center' }}>
                <Skeleton variant="text" width={100} />
              </Box>

              {/* Course & Year */}
              <Box sx={{ display: { xs: 'none', sm: 'block' }, width: '14%' }}>
                <Skeleton variant="text" width="100%" />
                <Skeleton variant="text" width="60%" />
              </Box>

              {/* Signatures */}
              <Box sx={{ display: { xs: 'none', lg: 'flex' }, width: '14%', justifyContent: 'center' }}>
                {[1, 2, 3].map(n => (
                  <Skeleton key={n} variant="circular" width={32} height={32} sx={{ ml: n > 1 ? -1.25 : 0, border: '2px solid #FFF' }} />
                ))}
              </Box>

              {/* Progress */}
              <Box sx={{ width: '12%', display: 'flex', alignItems: 'center', gap: 1 }}>
                <Skeleton variant="rectangular" sx={{ width: { xs: 40, sm: 60, md: 80 }, borderRadius: 3 }} height={6} />
                <Skeleton variant="text" width={24} />
              </Box>

              {/* Action */}
              <Box sx={{ width: '4%', display: 'flex', justifyContent: 'flex-end' }}>
                <Skeleton variant="circular" width={32} height={32} />
              </Box>
            </Box>
          ))}
        </Box>

      </Box>
    </Box>
  );
};

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
  const { updateUser } = useAuth();
  const isApprovals = location.pathname.includes("/approvals");
  const isSettings = location.pathname.includes("/settings");
  const isFAQs = location.pathname.includes("/faqs");
  const isFinal = !isApprovals && !isSettings && !isFAQs;
  const active = isSettings ? "settings" : isApprovals ? "approvals" : isFAQs ? "faqs" : "final";
  const [settingsLoading, setSettingsLoading] = useState(false);
  const email = typeof localStorage !== "undefined" ? (localStorage.getItem("email") || "dean@example.com") : "dean@example.com";
  const storedRole = (() => { try { return localStorage.getItem("role") || ""; } catch { return ""; } })();
  const roleText = storedRole || "Dean";
  const [profileFirst, setProfileFirst] = useState("");
  const [profileLast, setProfileLast] = useState("");
  const [draftFirst, setDraftFirst] = useState("");
  const [draftLast, setDraftLast] = useState("");
  const [newPass, setNewPass] = useState("");
  const [confirmPass, setConfirmPass] = useState("");
  const [passwordModalOpen, setPasswordModalOpen] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeletingAvatar, setIsDeletingAvatar] = useState(false);
  const [passwordUpdateLoading, setPasswordUpdateLoading] = useState(false);
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
  const [filterStatus, setFilterStatus] = useState<"pending" | "approved">("pending");
  const [isShuffling, setIsShuffling] = useState(false);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [selected, setSelected] = useState<any>(null);
  const [detailsTab, setDetailsTab] = useState<'info' | 'progress'>('info');
  const [zoomedSignature, setZoomedSignature] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const [signatureModalOpen, setSignatureModalOpen] = useState(false);
  const [studentToApprove, setStudentToApprove] = useState<any>(null);
  const [actionState, setActionState] = useState<'idle' | 'loading' | 'success'>('idle');
  const [actionRowId, setActionRowId] = useState<string | null>(null);

  const [signatureUrl, setSignatureUrl] = useState<string | null>(null);
  const [moreAnchor, setMoreAnchor] = useState<null | HTMLElement>(null);
  const dateInputRef = useRef<HTMLInputElement>(null);
  const [orgRows, setOrgRows] = useState<any[]>([]);
  const [readyRows, setReadyRows] = useState<any[]>([]);
  const [finalizedTodayCount, setFinalizedTodayCount] = useState(0);
  const [studentListOpen, setStudentListOpen] = useState(false);
  const [successModalOpen, setSuccessModalOpen] = useState(false);
  const [successModalTitle, setSuccessModalTitle] = useState("");
  const [successModalDescription, setSuccessModalDescription] = useState("");
  const [popupSearch, setPopupSearch] = useState("");
  const [courseMenuAnchor, setCourseMenuAnchor] = useState<null | HTMLElement>(null);
  const [revokeModalOpen, setRevokeModalOpen] = useState(false);
  const [isBulkRevokeModalOpen, setIsBulkRevokeModalOpen] = useState(false);
  const [exportModalOpen, setExportModalOpen] = useState(false);
  const [studentToRevoke, setStudentToRevoke] = useState<any>(null);
  const [revokeLoading, setRevokeLoading] = useState(false);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);

  const [rowActionAnchor, setRowActionAnchor] = useState<null | HTMLElement>(null);
  const [rowActionRow, setRowActionRow] = useState<any>(null);

  const handleRowActionClick = (e: React.MouseEvent<HTMLElement>, row: any) => {
    e.stopPropagation();
    setRowActionAnchor(e.currentTarget);
    setRowActionRow(row);
  };

  const handleRowActionClose = () => {
    setRowActionAnchor(null);
    setRowActionRow(null);
  };


  const theme = useTheme();
  const isSmallMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

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

  useEffect(() => {
    if (active === 'settings') {
      setSettingsLoading(true);
      const timer = setTimeout(() => setSettingsLoading(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [active]);

  useEffect(() => {
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
    const name = formatNameFromEmail(email || "", "Dean");
    return name;
  }, [profileFirst, profileLast, email]);

  const initials = useMemo(() => {
    return getInitials(fullName);
  }, [fullName]);

  const draftFullName = useMemo(() => {
    return `${draftFirst.trim()} ${draftLast.trim()}`.trim() || fullName;
  }, [draftFirst, draftLast, fullName]);

  const loadData = async () => {
    setIsShuffling(true);
    try {
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
      // await minDelay;
    } finally {
      setIsShuffling(false);
      setIsInitialLoad(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [filterStatus]);

  useEffect(() => {
    setSelectedIds([]);
  }, [filterStatus, query, filterCourse, filterYear, filterDate, page]);

  const handleExport = () => {
    const isFiltered = selectedIds.length === 0;
    const dataToExport = isFiltered ? filteredReady : readyRows.filter(r => selectedIds.includes(r.id));

    if (dataToExport.length === 0) {
      setNotice({ message: "No data to export", variant: "info" });
      return;
    }

    if (isFiltered) {
      setExportModalOpen(true);
    } else {
      generateCsv(dataToExport);
    }
  };

  const generateCsv = (dataToExport: any[]) => {
    const timestamp = new Date().toLocaleString();
    const fileTimestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    const headers = ["Name", "Student ID", "Course", "Year", "Status", "Date"];
    const csvContent = [
      `"Clearance Export Report"`,
      `"Generated At: ${timestamp}"`,
      `""`, // empty row
      headers.join(","),
      ...dataToExport.map(r => {
        const date = filterStatus === "approved" ? r.dateApproved : r.dateSubmitted;
        return [
          `"${r.name}"`,
          `"${r.studentId}"`,
          `"${r.course}"`,
          `"${r.year}"`,
          `"${filterStatus === "approved" ? "Approved" : "Pending"}"`,
          `"${date || ""}"`
        ].join(",");
      })
    ].join("\n");

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `clearance_export_${filterStatus}_${fileTimestamp}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

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
    // Instead of direct update, open confirmation modal
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

  const handleBulkApprove = () => {
    setStudentToApprove(null);
    setSignatureModalOpen(true);
  };

  const finalize = async (signatureData: string) => {
    const isBulk = !studentToApprove && selectedIds.length > 0;
    if (!studentToApprove && !isBulk) return;

    try {
      if (isBulk) {
        setActionState('loading');
        setSignatureModalOpen(false);

        // Sequential API calls for bulk approval
        const currentSelected = [...selectedIds];
        let processedCount = 0;

        for (const id of currentSelected) {
          const student = readyRows.find(r => r.id === id);
          if (student) {
            try {
              await api.post("/dean/final-approval", {
                studentId: student.studentId,
                signatureUrl: signatureData
              });
              processedCount++;
            } catch (e) {
              console.error(`Failed to approve student ${id}`, e);
            }
          }
        }

        setActionState('success');
        setTimeout(() => {
          setSuccessModalTitle("Bulk Approval Complete");
          setSuccessModalDescription(`Final clearances for ${processedCount} students have been successfully recorded.`);
          setSuccessModalOpen(true);
          setReadyRows(prev => prev.filter(r => !currentSelected.includes(r.id)));
          setSelectedIds([]);
          setActionState('idle');
        }, 800);

      } else {
        setActionRowId(studentToApprove.id);
        setActionState('loading');
        setSignatureModalOpen(false);

        const payload = studentToApprove?.studentId ? { studentId: studentToApprove.studentId, signatureUrl: signatureData } : {};
        await api.post("/dean/final-approval", payload);

        setActionState('success');

        setTimeout(() => {
          setSuccessModalTitle("Student Approved Successfully");
          setSuccessModalDescription(`Final clearance for ${studentToApprove.name} has been successfully recorded and finalized.`);
          setSuccessModalOpen(true);
          setReadyRows(prev => prev.filter(r => r.id !== studentToApprove.id));
          if (selected?.id === studentToApprove.id) setSelected(null);
          setActionState('idle');
          setActionRowId(null);
          setStudentToApprove(null);
        }, 800);
      }
    } catch (err: any) {
      setActionState('idle');
      setActionRowId(null);
      const msg = err.response?.data?.message || "Failed to process approval";
      setNotice({ message: msg, variant: "error" });
    }
  };

  const handleRevoke = (student: any) => {
    setStudentToRevoke(student);
    setRevokeModalOpen(true);
  };

  const confirmRevoke = async () => {
    if (!studentToRevoke) return;
    try {
      setRevokeLoading(true);
      setActionRowId(studentToRevoke.id);
      setActionState('loading');

      await api.post("/dean/revoke-final-approval", { studentId: studentToRevoke.studentId });

      setActionState('success');
      setRevokeModalOpen(false);
      setRevokeLoading(false);

      setTimeout(() => {
        setSuccessModalTitle("Approval Revoked Successfully");
        setSuccessModalDescription(`The final clearance approval for ${studentToRevoke.name} has been successfully revoked.`);
        setSuccessModalOpen(true);
        loadData(); // Re-fetch all to sync perfectly
        setActionState('idle');
        setActionRowId(null);
        setStudentToRevoke(null);
      }, 800);
    } catch (err: any) {
      setActionState('idle');
      setActionRowId(null);
      setRevokeModalOpen(false);
      setRevokeLoading(false);
      const msg = err.response?.data?.message || "Failed to revoke approval";
      setNotice({ message: msg, variant: "error" });
    }
  };

  useEffect(() => {
    const handleClear = () => setSelectedIds([]);
    window.addEventListener('clear-bulk-selections', handleClear);
    return () => window.removeEventListener('clear-bulk-selections', handleClear);
  }, []);

  const handleBulkRevoke = () => {
    if (selectedIds.length === 0) return;
    setIsBulkRevokeModalOpen(true);
  };

  const confirmBulkRevoke = async () => {
    setIsBulkRevokeModalOpen(false);
      try {
        setActionState('loading');
        const currentSelected = [...selectedIds];
        let processedCount = 0;

        for (const id of currentSelected) {
          const student = readyRows.find(r => r.id === id);
          if (student) {
            try {
              await api.post("/dean/revoke-final-approval", { studentId: student.studentId });
              processedCount++;
            } catch (e) {
              console.error(`Failed to revoke student ${id}`, e);
            }
          }
        }

        setActionState('success');
        setTimeout(() => {
          setSuccessModalTitle("Bulk Revocation Complete");
          setSuccessModalDescription(`Final clearances for ${processedCount} students have been successfully revoked.`);
          setSuccessModalOpen(true);
          loadData();
          setSelectedIds([]);
          setActionState('idle');
        }, 800);
      } catch (err: any) {
        setActionState('idle');
        const msg = err.response?.data?.message || "Failed to process bulk revocation";
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
  const completionPercent = (readyCount + finalizedToday) > 0 ? Math.round((finalizedToday / (readyCount + finalizedToday)) * 100) : 0;

  const currentTotal = readyRows.length + finalizedToday;
  // A simplistic dynamic derivation based on current data volume
  const lastWeekTotal = Math.max(1, currentTotal > 5 ? currentTotal - Math.floor(currentTotal * 0.2) : currentTotal);
  const studentGrowthPercent = currentTotal > lastWeekTotal ? Math.round(((currentTotal - lastWeekTotal) / lastWeekTotal) * 100) : 0;

  return (
    <Box sx={{ bgcolor: "#F9FAFB", minHeight: '100vh' }}>
      {notice && (
        <Snackbar open={!!notice} autoHideDuration={6000} onClose={() => setNotice(null)} anchorOrigin={{ vertical: 'top', horizontal: 'right' }}>
          <Alert onClose={() => setNotice(null)} severity={notice.variant || 'info'} sx={{ width: '100%', borderRadius: '14px' }}>
            {notice.message}
          </Alert>
        </Snackbar>
      )}
      {active === "final" ? (
        <>
          <Box
            display="flex"
            flexDirection={{ xs: 'column', md: 'row' }}
            alignItems={{ xs: 'flex-start', md: 'center' }}
            justifyContent="space-between"
            gap={2}
            mb={4}
            sx={{
              px: { xs: 0, md: 0 },
              pb: { xs: 1, sm: 0 }
            }}
          >
            <Box sx={{ borderBottom: 1, borderColor: "divider", width: '100%', mb: { xs: 2, md: 4 } }}>
              <Tabs
                value={filterStatus === 'approved' ? 1 : 0}
                onChange={(_, v) => {
                  setFilterStatus(v === 1 ? 'approved' : 'pending');
                  setPage(0);
                }}
                textColor="primary"
                variant="scrollable"
                scrollButtons="auto"
                TabIndicatorProps={{ sx: { bgcolor: "#0D9488", height: 3, borderTopLeftRadius: 3, borderTopRightRadius: 3 } }}
                sx={{
                  px: { xs: 0, md: 0 },
                  minHeight: "auto",
                  mb: "-1px",
                  "& .MuiTabs-indicator": {
                    bottom: 0,
                  },
                  "& .MuiTab-root": {
                    textTransform: "none",
                    fontWeight: 600,
                    fontSize: { xs: "0.8rem", sm: "0.875rem" },
                    minWidth: { xs: 80, sm: 120 },
                    px: { xs: 1.5, sm: 3 },
                    py: 2,
                    color: "#5f6368",
                    opacity: 1,
                    transition: 'all 0.2s ease',
                    '&.Mui-selected': {
                      color: "#0D9488 !important",
                      fontWeight: 800
                    }
                  }
                }}
              >
                <Tab label="Pending" />
                <Tab label="Approved" />
              </Tabs>
            </Box>
          </Box>

          {isShuffling && isInitialLoad ? (
            <DeanDashboardSkeleton />
          ) : (
            <>

              <Box display="grid" gridTemplateColumns={{ xs: "1fr", sm: "1fr 1fr", lg: "repeat(3, 1fr)" }} gap={3} mb={4}>
                {[
                  { label: "Total Students", value: currentTotal, trend: `+${studentGrowthPercent}%`, trendUp: true, isTotalStudents: true, lastWeekValue: lastWeekTotal },
                  { label: "Pending", value: readyCount, isPendingFinal: true },
                  { label: "Active Recently", value: filteredReady.length, efficiency: true }
                ].map((card) => (
                  <Box
                    key={card.label}
                    sx={{
                      p: { xs: 2.5, sm: 3 },
                      bgcolor: '#FFFFFF',
                      border: '1px solid #E5E7EB',
                      borderRadius: '16px',
                      minHeight: { xs: 140, sm: 180 },
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      transition: 'all 0.3s ease',
                      boxShadow: '0 8px 16px rgba(0,0,0,0.04)',
                      '&:hover': { transform: 'translateY(-4px)', boxShadow: '0 16px 32px rgba(0,0,0,0.08)' }
                    }}
                  >
                    <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={1}>
                      <Box>
                        <Typography sx={{ color: '#111827', fontSize: '1rem', fontWeight: 700, mb: 0.5 }}>
                          {card.efficiency ? (filterCourse ? getCourseLabel(filterCourse) : (isMobile ? "Active" : "Active Students")) : (card.isPendingFinal ? <Box component="span">{isMobile ? "" : "Tasks this week "}<Box component="span" sx={{ color: '#94A3B8', fontWeight: 500, fontSize: '0.875rem' }}>/ Approvals</Box></Box> : (isMobile ? card.label.replace("Total ", "") : card.label))}
                        </Typography>
                        {card.efficiency && (
                          <Box display="flex" alignItems="center" gap={0.75} sx={{ color: '#6B7280' }}>
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
                            <Typography sx={{ fontSize: '0.75rem', fontWeight: 500 }}>08:30 AM - 05:00 PM</Typography>
                          </Box>
                        )}
                      </Box>
                    </Box>
                    <Box display="flex" alignItems="flex-end" justifyContent="space-between">
                      {card.isPendingFinal ? (
                        <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', gap: { xs: 0.5, sm: 1 } }}>
                          <Typography sx={{ fontWeight: 700, fontSize: { xs: '1.75rem', sm: '2.5rem' }, color: '#111827', lineHeight: 1 }}>{card.value}</Typography>
                          <Box sx={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 0.5,
                            bgcolor: '#FFFBEB',
                            px: 1.25,
                            py: 0.5,
                            borderRadius: '999px',
                            border: '1px solid rgba(217, 119, 6, 0.2)',
                            width: 'fit-content'
                          }}>
                            <Box sx={{ width: 14, height: 14, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#854d0e" strokeWidth="3"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"></polyline><polyline points="17 6 23 6 23 12"></polyline></svg>
                            </Box>
                            <Typography sx={{ color: '#854d0e', fontSize: '0.75rem', fontWeight: 700 }}>{completionPercent > 0 ? '+' : ''}{completionPercent}% <Box component="span" sx={{ color: '#854d0e', fontWeight: 500 }}>completed</Box></Typography>
                          </Box>
                        </Box>
                      ) : card.isTotalStudents ? (
                        <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', gap: { xs: 0.5, sm: 1 } }}>
                          <Typography sx={{ fontWeight: 700, fontSize: { xs: '1.75rem', sm: '2.5rem' }, color: '#111827', lineHeight: 1 }}>{card.value}</Typography>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 22, height: 22, borderRadius: '6px', border: '1.5px solid #0D9488', bgcolor: '#ECFDF5' }}>
                              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#0D9488" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"></polyline><polyline points="17 6 23 6 23 12"></polyline></svg>
                            </Box>
                            <Typography sx={{ fontSize: '0.8125rem', fontWeight: 700, color: '#0D9488' }}>
                              {card.trend} <Box component="span" sx={{ color: '#94A3B8', fontWeight: 500, ml: 0.5 }}>{card.lastWeekValue} last week</Box>
                            </Typography>
                          </Box>
                        </Box>
                      ) : (
                        <Typography sx={{ fontWeight: 700, fontSize: { xs: '1.75rem', sm: '2.5rem' }, color: '#111827', lineHeight: 1 }}>{card.value}</Typography>
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
                            <text x="100" y="32" fontSize="10" fontWeight="700" fill="#111827" textAnchor="middle">{completionPercent}%</text>
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
                                  fontSize: '0.8125rem',
                                  fontWeight: 800,
                                  bgcolor: '#5f6368',
                                  color: '#FFF',
                                  boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)'
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
                          <Tooltip title="View Student List" arrow>
                            <IconButton
                              onClick={() => setStudentListOpen(true)}
                              sx={{
                                width: 42,
                                height: 42,
                                bgcolor: '#3c4043',
                                color: '#FFF',
                                borderRadius: '50%',
                                boxShadow: '0 10px 20px -5px rgba(0,0,0,0.3), 0 8px 10px -6px rgba(0,0,0,0.15)',
                                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                                '&:hover': {
                                  bgcolor: '#3c4043',
                                  boxShadow: '0 20px 25px -5px rgba(0,0,0,0.4), 0 10px 10px -5px rgba(0,0,0,0.2)',
                                  transform: 'scale(1.1) translateY(-2px)'
                                },
                                '&:active': { transform: 'scale(0.95)' }
                              }}
                            >
                              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>
                            </IconButton>
                          </Tooltip>
                        </Box>
                      </Box>
                    )}
                  </Box>
                ))}
              </Box>

              <Box sx={{ backgroundColor: "#FAFAFA", borderRadius: '16px', p: { xs: 2, sm: 3 }, mb: 4, position: 'relative', minHeight: '400px', display: 'flex', flexDirection: 'column' }}>
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

                <Box display="flex" flexDirection={{ xs: 'column', lg: 'row' }} gap={2} alignItems={{ xs: 'stretch', lg: 'center' }} mb={3} justifyContent="space-between">
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
                      sx={{
                        textTransform: 'none',
                        borderRadius: '8px',
                        bgcolor: filterDate ? 'rgba(176, 224, 230, 0.2)' : 'transparent',
                        color: filterDate ? '#0E7490' : '#64748B',
                        borderColor: filterDate ? '#9cd2d9' : '#D1D5DB',
                        fontWeight: 600,
                        fontSize: '0.8125rem',
                        px: 2,
                        height: 36,
                        '&:hover': {
                          bgcolor: filterDate ? 'rgba(176, 224, 230, 0.35)' : '#F9FAFB',
                          borderColor: '#9cd2d9'
                        }
                      }}
                    >
                      {filterDate || "All time"}
                      <input
                        type="date"
                        ref={dateInputRef}
                        style={{
                          opacity: 0,
                          position: 'absolute',
                          top: 0, left: 0, right: 0, bottom: 0,
                          width: '100%', height: '100%',
                          pointerEvents: 'none',
                          border: 'none', padding: 0, margin: 0
                        }}
                        onChange={(e) => { setFilterDate(e.target.value); setPage(0); }}
                      />
                    </Button>
                    <Select
                      variant="outlined"
                      displayEmpty
                      value={filterCourse}
                      onChange={(e) => { setFilterCourse(e.target.value as string); setPage(0); }}
                      sx={{
                        minWidth: { xs: '100%', sm: 140 }, height: 36, bgcolor: 'rgba(176, 224, 230, 0.2)', borderRadius: '8px', fontSize: '0.8125rem', fontWeight: 600, color: '#0E7490',
                        '& .MuiOutlinedInput-notchedOutline': { borderColor: '#9cd2d9' },
                        '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#9cd2d9' },
                        '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: '#9cd2d9' },
                        '& .MuiSvgIcon-root': { color: '#0E7490' }
                      }}
                    >
                      <MenuItem value="" sx={{ fontSize: '0.8125rem', fontWeight: 600 }}>All Courses</MenuItem>
                      {availableCourses.map(c => (<MenuItem key={c} value={c} sx={{ fontSize: '0.8125rem' }}>{getCourseLabel(c)}</MenuItem>))}
                    </Select>
                    <Button
                      variant="outlined"
                      onClick={(e) => setMoreAnchor(e.currentTarget)}
                      startIcon={<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="4" y1="6" x2="20" y2="6"></line><line x1="8" y1="12" x2="16" y2="12"></line><line x1="10" y1="18" x2="14" y2="18"></line></svg>}
                      sx={{
                        textTransform: 'none',
                        borderRadius: '8px',
                        color: filterYear ? '#0E7490' : '#374151',
                        bgcolor: filterYear ? 'rgba(176, 224, 230, 0.2)' : 'transparent',
                        borderColor: filterYear ? '#9cd2d9' : '#D1D5DB',
                        fontWeight: 600,
                        fontSize: '0.8125rem',
                        px: 2,
                        height: 36,
                        '&:hover': {
                          borderColor: '#9cd2d9',
                          bgcolor: filterYear ? 'rgba(176, 224, 230, 0.35)' : '#F9FAFB'
                        }
                      }}
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
                    sx={{
                      width: { xs: '100%', lg: 280 },
                      flexShrink: 0,
                      '& .MuiOutlinedInput-root': {
                        borderRadius: '8px',
                        bgcolor: '#FFF',
                        height: 40,
                        '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: '#0D9488', borderWidth: '2px' },
                        '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#0D9488' }
                      }
                    }}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#6B7280" strokeWidth="2"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
                        </InputAdornment>
                      )
                    }}
                  />
                </Box>

                <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid #E5E7EB', borderRadius: '12px', overflowX: 'auto', bgcolor: '#FFF' }}>
                  <Table>
                    <TableHead sx={{ bgcolor: '#F9FAFB' }}>
                      <TableRow sx={{ borderBottom: '1px solid #E5E7EB' }}>
                        <TableCell padding="checkbox" sx={{ py: 2, pl: 2 }}>
                          <Checkbox
                            size="small"
                            checked={paginatedReady.length > 0 && paginatedReady.every(r => selectedIds.includes(r.id))}
                            indeterminate={selectedIds.length > 0 && !paginatedReady.every(r => selectedIds.includes(r.id))}
                            onChange={(e) => {
                              if (e.target.checked) {
                                const newIds = [...new Set([...selectedIds, ...paginatedReady.map(r => r.id)])];
                                setSelectedIds(newIds);
                              } else {
                                const idsToRemove = paginatedReady.map(r => r.id);
                                setSelectedIds(selectedIds.filter(id => !idsToRemove.includes(id)));
                              }
                            }}
                            icon={
                              <Box sx={{
                                width: 22, height: 22, borderRadius: '6px',
                                border: '2px solid #E5E7EB',
                                bgcolor: '#F9FAFB',
                                transition: 'all 0.2s ease'
                              }} />
                            }
                            checkedIcon={
                              <Box sx={{
                                width: 22, height: 22, borderRadius: '6px',
                                bgcolor: '#0D9488',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                transition: 'all 0.2s ease'
                              }}>
                                <CheckIcon sx={{ fontSize: 16, color: '#FFF' }} />
                              </Box>
                            }
                            indeterminateIcon={
                              <Box sx={{
                                width: 22, height: 22, borderRadius: '6px',
                                bgcolor: '#0D9488',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                transition: 'all 0.2s ease'
                              }}>
                                <Box sx={{ width: 10, height: 2, bgcolor: '#FFF', borderRadius: 1 }} />
                              </Box>
                            }
                            sx={{ p: 0 }}
                          />
                        </TableCell>
                        <TableCell sx={{ width: { xs: '60%', md: '26%' }, fontWeight: 600, color: "#6B7280", fontSize: '0.75rem', py: 2, borderBottom: 'none' }}>STUDENT</TableCell>
                        <TableCell align="center" sx={{ width: '12%', fontWeight: 600, color: "#6B7280", fontSize: '0.75rem', py: 2, borderBottom: 'none' }}>STATUS</TableCell>
                        <TableCell sx={{ display: { xs: 'none', md: 'table-cell' }, width: '18%', fontWeight: 600, color: "#6B7280", fontSize: '0.75rem', py: 2, borderBottom: 'none' }}>TIMESTAMP</TableCell>
                        <TableCell align="center" sx={{ display: { xs: 'none', sm: 'table-cell' }, width: '14%', fontWeight: 600, color: "#6B7280", fontSize: '0.75rem', py: 2, borderBottom: 'none', whiteSpace: 'nowrap' }}>COURSE & YEAR</TableCell>
                        <TableCell align="center" sx={{ display: { xs: 'none', lg: 'table-cell' }, width: '14%', fontWeight: 600, color: "#6B7280", fontSize: '0.75rem', py: 2, borderBottom: 'none', whiteSpace: 'nowrap' }}>SIGNATURES</TableCell>
                        <TableCell align="center" sx={{ width: '12%', fontWeight: 600, color: "#6B7280", fontSize: '0.75rem', py: 2, borderBottom: 'none', whiteSpace: 'nowrap' }}>PROGRESS</TableCell>
                        <TableCell align="right" sx={{ width: '4%', fontWeight: 600, color: "#6B7280", fontSize: '0.75rem', py: 2, borderBottom: 'none' }}></TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {paginatedReady.map((r) => (
                        <TableRow key={r.id} hover sx={{ '& td': { borderBottom: '1px solid #F3F4F6' }, '&:last-child td': { borderBottom: 0 } }}>
                          <TableCell padding="checkbox" sx={{ pl: 2 }}>
                            <Checkbox
                              size="small"
                              checked={selectedIds.includes(r.id)}
                              onChange={() => {
                                setSelectedIds(prev =>
                                  prev.includes(r.id)
                                    ? prev.filter(id => id !== r.id)
                                    : [...prev, r.id]
                                );
                              }}
                              icon={
                                <Box sx={{
                                  width: 22, height: 22, borderRadius: '6px',
                                  border: '2px solid #E5E7EB',
                                  bgcolor: '#FFF',
                                  transition: 'all 0.2s ease'
                                }} />
                              }
                              checkedIcon={
                                <Box sx={{
                                  width: 22, height: 22, borderRadius: '6px',
                                  bgcolor: '#0D9488',
                                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                                  transition: 'all 0.2s ease'
                                }}>
                                  <CheckIcon sx={{ fontSize: 16, color: '#FFF' }} />
                                </Box>
                              }
                              sx={{ p: 0 }}
                            />
                          </TableCell>
                          <TableCell sx={{ py: 2, verticalAlign: 'middle' }}>
                            <Box display="flex" alignItems="center" gap={2}>
                              <Avatar
                                src={getAbsoluteUrl(r.avatarUrl)}
                                sx={{ width: 40, height: 40, bgcolor: '#5f6368', color: '#FFF', fontWeight: 800, fontSize: '0.875rem' }}
                              >
                                {getInitials(r.name)}
                              </Avatar>
                              <Box>
                                <Typography sx={{ fontWeight: 600, color: "#111827", fontSize: '0.875rem' }}>{r.name}</Typography>
                                <Typography sx={{ color: "#6B7280", fontSize: '0.8125rem' }}>{r.studentId}</Typography>
                              </Box>
                            </Box>
                          </TableCell>
                          <TableCell align="center" sx={{ py: 2, verticalAlign: 'middle' }}>
                            <Box sx={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              px: 1.5,
                              py: 0.5,
                              borderRadius: '999px',
                              bgcolor: filterStatus === "approved" ? '#F0FDFA' : '#FFFBEB',
                              color: filterStatus === "approved" ? '#0D9488' : '#D97706',
                              fontSize: '0.75rem',
                              fontWeight: 700,
                              letterSpacing: '0.01em',
                              border: `1px solid ${filterStatus === "approved" ? '#0D9488' : '#D97706'}20`,
                              transition: 'all 0.2s ease'
                            }}>
                              {filterStatus === "approved" ? "Cleared" : "In Progress"}
                            </Box>
                          </TableCell>
                          <TableCell sx={{ display: { xs: 'none', md: 'table-cell' }, py: 2, verticalAlign: 'middle' }}>
                            <Typography sx={{ color: "#64748B", fontSize: '0.75rem', fontWeight: 500 }}>
                              {new Date(r.dateApproved || r.dateSubmitted).toLocaleString('en-US', {
                                month: 'short',
                                day: 'numeric',
                                year: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </Typography>
                          </TableCell>
                          <TableCell align="center" sx={{ display: { xs: 'none', md: 'table-cell' }, py: 2, verticalAlign: 'middle' }}>
                            <Box>
                              <Typography sx={{ fontWeight: 500, color: "#111827", fontSize: '0.875rem' }}>{r.course}</Typography>
                              <Typography sx={{ color: "#6B7280", fontSize: '0.8125rem' }}>{r.year}</Typography>
                            </Box>
                          </TableCell>
                          <TableCell align="center" sx={{ display: { xs: 'none', lg: 'table-cell' }, py: 2, verticalAlign: 'middle' }}>
                            <Box display="flex" alignItems="center" justifyContent="center">
                              {(r.organizations || []).filter((o: any) => o.status === 'completed' || o.status === 'officer_cleared').slice(0, 3).map((org: any, idx: number) => (
                                <Tooltip key={idx} title={org.name} arrow>
                                  <Avatar
                                    src={org.signatureUrl}
                                    imgProps={{ sx: { objectFit: 'contain', p: '2px' } }}
                                    onClick={() => setZoomedSignature(org.signatureUrl)}
                                    sx={{
                                      width: 32,
                                      height: 32,
                                      ml: idx > 0 ? -1.25 : 0,
                                      border: '2px solid #FFF',
                                      bgcolor: '#F3F4F6',
                                      color: '#64748B',
                                      fontSize: '0.65rem',
                                      fontWeight: 800,
                                      boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
                                      cursor: 'pointer',
                                      transition: 'all 0.2s ease',
                                      '&:hover': { transform: 'translateY(-2px) scale(1.1)', zIndex: 10 }
                                    }}
                                  >
                                    {org.name ? org.name[0] : '?'}
                                  </Avatar>
                                </Tooltip>
                              ))}
                              {(r.organizations || []).filter((o: any) => o.status === 'completed' || o.status === 'officer_cleared').length > 3 && (
                                <Typography sx={{ color: '#64748B', fontSize: '0.75rem', fontWeight: 700, ml: 1, letterSpacing: '0.02em' }}>
                                  +{(r.organizations || []).filter((o: any) => o.status === 'completed' || o.status === 'officer_cleared').length - 3}
                                </Typography>
                              )}
                              {(r.organizations || []).filter((o: any) => o.status === 'completed' || o.status === 'officer_cleared').length === 0 && (
                                <Typography sx={{ color: '#94A3B8', fontSize: '0.875rem', fontWeight: 600 }}>
                                  —
                                </Typography>
                              )}
                            </Box>
                          </TableCell>

                          <TableCell align="center" sx={{ py: 2, verticalAlign: 'middle' }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, minWidth: 100 }}>
                              <Box sx={{ flexGrow: 1 }}>
                                <LinearProgress
                                  variant="determinate"
                                  value={(r.reqCompleted / r.reqTotal) * 100}
                                  sx={{
                                    height: 6,
                                    borderRadius: 3,
                                    bgcolor: '#F1F5F9',
                                    '& .MuiLinearProgress-bar': { bgcolor: '#0D9488' }
                                  }}
                                />
                              </Box>
                              <Typography sx={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748B', fontFamily: '"Google Sans", "Product Sans", Roboto, sans-serif' }}>
                                {r.reqCompleted}/{r.reqTotal}
                              </Typography>
                            </Box>
                          </TableCell>
                          <TableCell align="right" sx={{ py: 2, verticalAlign: 'middle' }}>
                            <Box display="flex" justifyContent="flex-end">
                              <IconButton
                                size="small"
                                onClick={(e) => handleRowActionClick(e, r)}
                                sx={{ color: '#94A3B8', '&:hover': { color: '#0F172A', bgcolor: '#F1F5F9' } }}
                              >
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                  <circle cx="12" cy="12" r="1.5" fill="currentColor" stroke="none" />
                                  <circle cx="12" cy="5" r="1.5" fill="currentColor" stroke="none" />
                                  <circle cx="12" cy="19" r="1.5" fill="currentColor" stroke="none" />
                                </svg>
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
                <Box mt={3} pt={3} display="flex" justifyContent="center" alignItems="center" sx={{ borderTop: '1px solid #E5E7EB' }}>
                  <Box sx={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 0.5,
                    bgcolor: '#F3F4F6',
                    borderRadius: '16px',
                    p: '6px',
                  }}>
                    {/* Previous Arrow */}
                    <Box
                      component="button"
                      onClick={() => setPage(p => Math.max(0, p - 1))}
                      disabled={page === 0}
                      sx={{
                        width: 36, height: 36,
                        borderRadius: '10px',
                        border: 'none',
                        bgcolor: 'transparent',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        cursor: page === 0 ? 'not-allowed' : 'pointer',
                        color: page === 0 ? '#D1D5DB' : '#374151',
                        transition: 'all 0.2s ease',
                        '&:hover': page === 0 ? {} : { bgcolor: '#E5E7EB' }
                      }}
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="15 18 9 12 15 6"></polyline>
                      </svg>
                    </Box>

                    {/* Page Numbers */}
                    {Array.from({ length: Math.ceil(filteredReady.length / rowsPerPage) || 1 }, (_, i) => i).map((pageNum) => (
                      <Box
                        key={pageNum}
                        component="button"
                        onClick={() => setPage(pageNum)}
                        sx={{
                          width: 36, height: 36,
                          borderRadius: '10px',
                          border: 'none',
                          bgcolor: page === pageNum ? '#3c4043' : 'transparent',
                          color: page === pageNum ? '#FFFFFF' : '#6B7280',
                          fontWeight: page === pageNum ? 700 : 500,
                          fontSize: '0.875rem',
                          cursor: 'pointer',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          boxShadow: page === pageNum ? '0 4px 12px rgba(60, 64, 67, 0.25)' : 'none',
                          transition: 'all 0.2s ease',
                          '&:hover': page === pageNum ? {} : { bgcolor: '#E5E7EB', color: '#3c4043' }
                        }}
                      >
                        {pageNum + 1}
                      </Box>
                    ))}

                    {/* Next Arrow */}
                    <Box
                      component="button"
                      onClick={() => setPage(p => p + 1)}
                      disabled={(page + 1) * rowsPerPage >= filteredReady.length}
                      sx={{
                        width: 36, height: 36,
                        borderRadius: '10px',
                        border: 'none',
                        bgcolor: 'transparent',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        cursor: (page + 1) * rowsPerPage >= filteredReady.length ? 'not-allowed' : 'pointer',
                        color: (page + 1) * rowsPerPage >= filteredReady.length ? '#D1D5DB' : '#374151',
                        transition: 'all 0.2s ease',
                        '&:hover': (page + 1) * rowsPerPage >= filteredReady.length ? {} : { bgcolor: '#E5E7EB' }
                      }}
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="9 18 15 12 9 6"></polyline>
                      </svg>
                    </Box>
                  </Box>
                </Box>

              </Box>
            </>
          )}
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
                  sx: { bgcolor: '#F8FAFC', borderRadius: '8px', px: 2, py: 1, fontSize: '0.875rem', border: '1px solid #E2E8F0', transition: 'all 0.2s', '&:hover': { borderColor: '#0D9488' }, '&:focus-within': { borderColor: '#0D9488' } }
                }}
              />
              <Select
                variant="standard"
                displayEmpty
                value={filterCourse}
                onChange={(e) => { setFilterCourse(e.target.value as string); setPage(0); }}
                disableUnderline
                sx={{ minWidth: 200, bgcolor: 'rgba(176, 224, 230, 0.2)', borderRadius: '8px', px: 2, py: 1, fontSize: '0.875rem', color: '#0E7490', fontWeight: 600, border: '1px solid #9cd2d9', transition: 'all 0.2s', '&:hover': { borderColor: '#8bcbd4', bgcolor: 'rgba(176, 224, 230, 0.35)' }, '& .MuiSelect-select': { py: 0, '&:focus': { bgcolor: 'transparent' } }, '& .MuiSvgIcon-root': { color: '#0E7490' } }}
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
                sx={{ minWidth: 160, bgcolor: 'rgba(176, 224, 230, 0.2)', borderRadius: '8px', px: 2, py: 1, fontSize: '0.875rem', color: '#0E7490', fontWeight: 600, border: '1px solid #9cd2d9', transition: 'all 0.2s', '&:hover': { borderColor: '#8bcbd4', bgcolor: 'rgba(176, 224, 230, 0.35)' }, '& .MuiSelect-select': { py: 0, '&:focus': { bgcolor: 'transparent' } }, '& .MuiSvgIcon-root': { color: '#0E7490' } }}
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
                  sx: { bgcolor: 'rgba(176, 224, 230, 0.2)', borderRadius: '8px', px: 2, py: 1, fontSize: '0.875rem', color: '#0E7490', fontWeight: 600, border: '1px solid #9cd2d9', transition: 'all 0.2s', '&:hover': { borderColor: '#8bcbd4', bgcolor: 'rgba(176, 224, 230, 0.35)' } }
                }}
              />
              <Select
                variant="standard"
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value as any)}
                disableUnderline
                sx={{ minWidth: 140, bgcolor: 'rgba(176, 224, 230, 0.2)', borderRadius: '8px', px: 2, py: 1, fontSize: '0.875rem', color: '#0E7490', fontWeight: 600, border: '1px solid #9cd2d9', transition: 'all 0.2s', '&:hover': { borderColor: '#8bcbd4', bgcolor: 'rgba(176, 224, 230, 0.35)' }, '& .MuiSelect-select': { py: 0, '&:focus': { bgcolor: 'transparent' } }, '& .MuiSvgIcon-root': { color: '#0E7490' } }}
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
                          ...(r.status === "Approved" ? { bgcolor: "rgba(176, 224, 230, 0.2)", color: "#0E7490" } :
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
                <SettingsField label="Role Status">
                  <TextField
                    fullWidth
                    value="Dean of College"
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

            <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, gap: 2, mt: 6, pt: 4, borderTop: '1px solid #F1F5F9' }}>
              <Button
                variant="contained"
                onClick={(e) => { e.preventDefault(); updateProfile(); }}
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
        )) : null}

      <Dialog
        open={!!selected && (isApprovals || isFinal)}
        onClose={() => setSelected(null)}
        fullWidth
        maxWidth="xs"
        PaperProps={{
          sx: {
            borderRadius: '32px',
            padding: '24px',
            position: 'relative',
            boxShadow: '0 25px 50px -12px rgba(0,0,0,0.15)',
            bgcolor: '#FFF'
          }
        }}
      >
        {/* Header */}
        <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2.5}>
          <Box>
            <Typography variant="h5" sx={{ fontWeight: 800, color: '#0F172A', mb: 0.5 }}>
              Student Status Overview
            </Typography>
            <Typography sx={{ color: '#64748B', fontSize: '0.875rem', lineHeight: 1.4 }}>
              Detailed record and organizational clearance tracking
            </Typography>
          </Box>
          <IconButton
            onClick={() => setSelected(null)}
            size="small"
            sx={{ color: '#94A3B8', '&:hover': { color: '#0F172A', bgcolor: '#F1F5F9' } }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
          </IconButton>
        </Box>

        {/* Segmented Control / Toggle */}
        <Box sx={{
          display: 'flex',
          p: '4px',
          bgcolor: '#F1F5F9',
          borderRadius: '16px',
          mb: 3,
          position: 'relative',
          overflow: 'hidden'
        }}>
          {/* Sliding Indicator - Matched with Dashboard Filter Style */}
          <Box
            sx={{
              position: 'absolute',
              top: '4px',
              bottom: '4px',
              left: detailsTab === 'info' ? '4px' : 'calc(50% + 2px)',
              width: 'calc(50% - 6px)',
              bgcolor: '#FFF',
              borderRadius: '12px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
              transition: 'left 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
              zIndex: 1
            }}
          />
          <Button
            fullWidth
            onClick={() => setDetailsTab('info')}
            sx={{
              textTransform: 'none',
              borderRadius: '12px',
              py: 1,
              fontWeight: 700,
              fontSize: '0.875rem',
              position: 'relative',
              zIndex: 2,
              color: detailsTab === 'info' ? '#0F172A' : '#64748B',
              bgcolor: 'transparent',
              transition: 'color 0.4s ease',
              '&:hover': { bgcolor: 'transparent' }
            }}
          >
            Student Info
          </Button>
          <Button
            fullWidth
            onClick={() => setDetailsTab('progress')}
            sx={{
              textTransform: 'none',
              borderRadius: '12px',
              py: 1,
              fontWeight: 700,
              fontSize: '0.875rem',
              position: 'relative',
              zIndex: 2,
              color: detailsTab === 'progress' ? '#0F172A' : '#64748B',
              bgcolor: 'transparent',
              transition: 'color 0.4s ease',
              '&:hover': { bgcolor: 'transparent' }
            }}
          >
            Clearance
          </Button>
        </Box>

        {/* Content Area */}
        <Box sx={{
          minHeight: '320px',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          position: 'relative'
        }}>
          <AnimatePresence mode="wait">
            {selected && (
              detailsTab === 'info' ? (
                <motion.div
                  key="info"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
                >
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <Box sx={{ p: 2, bgcolor: '#FAFAFA', borderRadius: '16px', border: '1px solid #F1F5F9' }}>
                      <Typography sx={{ color: '#94A3B8', fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', mb: 0.5 }}>Full Name</Typography>
                      <Typography sx={{ fontWeight: 700, color: '#0F172A' }}>{selected.name}</Typography>
                    </Box>
                    <Box sx={{ p: 2, bgcolor: '#FAFAFA', borderRadius: '16px', border: '1px solid #F1F5F9' }}>
                      <Typography sx={{ color: '#94A3B8', fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', mb: 0.5 }}>Student ID No.</Typography>
                      <Typography sx={{ fontWeight: 700, color: '#0F172A' }}>{selected.studentId}</Typography>
                    </Box>
                    <Box sx={{ p: 2, bgcolor: '#FAFAFA', borderRadius: '16px', border: '1px solid #F1F5F9' }}>
                      <Typography sx={{ color: '#94A3B8', fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', mb: 0.5 }}>Course & Year</Typography>
                      <Typography sx={{ fontWeight: 700, color: '#0F172A' }}>{selected.course} — {selected.year}</Typography>
                    </Box>
                    <Box sx={{ p: 2, bgcolor: '#FAFAFA', borderRadius: '16px', border: '1px solid #F1F5F9' }}>
                      <Typography sx={{ color: '#94A3B8', fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', mb: 0.5 }}>Submission Status</Typography>
                      <Typography sx={{ fontWeight: 700, color: '#0F172A' }}>
                        {filterStatus === 'approved' ? 'Finalized Approval' : 'Pending Dean Signature'}
                      </Typography>
                    </Box>
                  </Box>
                </motion.div>
              ) : (
                <motion.div
                  key="progress"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
                >
                  <Box sx={{ p: 1, display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                    {selected.organizations && selected.organizations.length > 0 ? (
                      selected.organizations.map((org: any, idx: number) => {
                        const isCleared = org.status === 'completed' || org.status === 'officer_cleared';
                        const label = isCleared ? 'Cleared' : 'Pending';

                        return (
                          <Box key={idx} sx={{
                            p: 2,
                            bgcolor: '#FAFAFA',
                            borderRadius: '16px',
                            border: '1px solid #F1F5F9',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: 1,
                            boxShadow: '0 2px 4px rgba(0,0,0,0.02)'
                          }}>
                            <Box display="flex" alignItems="center" justifyContent="space-between">
                              <Typography sx={{ fontWeight: 700, color: '#0F172A', fontSize: '0.9rem' }}>
                                {org.name}
                              </Typography>
                              <Chip
                                size="small"
                                label={label}
                                sx={{
                                  height: 24,
                                  fontSize: '0.75rem',
                                  fontWeight: 700,
                                  bgcolor: isCleared ? '#F0FDFA' : '#FFFBEB',
                                  color: isCleared ? '#0D9488' : '#D97706',
                                  border: `1px solid ${isCleared ? '#0D9488' : '#D97706'}20`,
                                  borderRadius: '999px'
                                }}
                              />
                            </Box>

                            {/* Decorative Dashed Divider */}
                            <Box sx={{ my: 1, borderBottom: '1px dashed #E2E8F0' }} />

                            {/* Signature Display */}
                            <Box sx={{ mt: 0.5 }}>
                              <Typography sx={{ fontSize: '0.65rem', color: '#94A3B8', fontWeight: 800, mb: 1.5, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                Officer Signature
                              </Typography>
                              <Box sx={{
                                bgcolor: '#F8FAFC',
                                borderRadius: '12px',
                                p: 1.5,
                                display: 'inline-flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                minWidth: 120,
                                minHeight: 60,
                                border: '1px solid #F1F5F9'
                              }}>
                                {org.signatureUrl ? (
                                  <img
                                    src={org.signatureUrl}
                                    alt="Signature"
                                    onClick={() => setZoomedSignature(org.signatureUrl)}
                                    style={{
                                      height: 40,
                                      maxHeight: 40,
                                      objectFit: 'contain',
                                      filter: 'contrast(1.1) brightness(0.95)',
                                      opacity: 0.9,
                                      cursor: 'zoom-in',
                                      transition: 'all 0.2s ease'
                                    }}
                                    onMouseEnter={(e) => {
                                      e.currentTarget.style.transform = 'scale(1.05)';
                                      e.currentTarget.style.opacity = '1';
                                    }}
                                    onMouseLeave={(e) => {
                                      e.currentTarget.style.transform = 'scale(1)';
                                      e.currentTarget.style.opacity = '0.9';
                                    }}
                                  />
                                ) : (
                                  <Typography sx={{ fontSize: '0.7rem', color: '#94A3B8', fontStyle: 'italic' }}>
                                    Signature Pending
                                  </Typography>
                                )}
                              </Box>
                            </Box>
                          </Box>
                        );
                      })
                    ) : (
                      <Box sx={{ py: 6, textAlign: 'center' }}>
                        <Typography sx={{ color: '#94A3B8', fontSize: '0.875rem', fontStyle: 'italic' }}>
                          No organizational clearances found for this student.
                        </Typography>
                      </Box>
                    )}
                  </Box>
                </motion.div>
              )
            )}
          </AnimatePresence>
        </Box>

        {/* Footer Action - Only show if it's the 'Finalize Now' button */}
        {(filterStatus === 'pending' && detailsTab === 'progress') && (
          <Box mt={4}>
            <Button
              fullWidth
              onClick={() => {
                setStudentToApprove(selected);
                setSignatureModalOpen(true);
              }}
              variant="contained"
              sx={{
                borderRadius: '20px',
                py: 2,
                bgcolor: '#3c4043',
                color: '#FFF',
                textTransform: 'none',
                fontWeight: 700,
                fontSize: '1rem',
                boxShadow: '0 10px 15px -3px rgba(60,64,67,0.3)',
                transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
                '&:hover': {
                  bgcolor: '#2d3034',
                  boxShadow: '0 20px 25px -5px rgba(60,64,67,0.4)',
                  transform: 'translateY(-2px)'
                },
                '&:active': {
                  transform: 'translateY(0)'
                }
              }}
            >
              Finalize Now
            </Button>
          </Box>
        )}
      </Dialog>

      <SignatureModal
        open={signatureModalOpen}
        onClose={() => setSignatureModalOpen(false)}
        onConfirm={finalize}
      />

      <GenericConfirmationModal
        open={isBulkRevokeModalOpen}
        onClose={() => setIsBulkRevokeModalOpen(false)}
        onConfirm={confirmBulkRevoke}
        title="Revoke Approvals?"
        description={`Are you sure you want to revoke final approval for ${selectedIds.length} selected students? This will return their registration to the pending state.`}
        confirmText="Yes, Revoke"
        loading={actionState === 'loading'}
      />
      <StudentListPopup
        open={studentListOpen}
        onClose={() => setStudentListOpen(false)}
        students={readyRows.filter(s => s.name.toLowerCase().includes(popupSearch.toLowerCase()))}
        searchQuery={popupSearch}
        onSearchChange={setPopupSearch}
      />
      {/* Signature Zoom Lightbox */}
      <Dialog
        open={!!zoomedSignature}
        onClose={() => setZoomedSignature(null)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: '24px',
            p: 4,
            bgcolor: '#FFF',
            overflow: 'hidden',
            boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)'
          }
        }}
      >
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
          <Typography variant="h6" sx={{ fontWeight: 800, color: '#0F172A' }}>
            Officer Signature Preview
          </Typography>
          <IconButton onClick={() => setZoomedSignature(null)} size="small" sx={{ color: '#94A3B8' }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
          </IconButton>
        </Box>
        <Box
          sx={{
            bgcolor: '#FAFAFA',
            borderRadius: '16px',
            p: 4,
            display: 'flex',
            justifyContent: 'center',
            border: '1px solid #F1F5F9'
          }}
        >
          {zoomedSignature && (
            <img
              src={zoomedSignature}
              alt="Zoomed Signature"
              style={{
                maxWidth: '100%',
                maxHeight: '400px',
                objectFit: 'contain',
                filter: 'contrast(1.1) brightness(0.95)'
              }}
            />
          )}
        </Box>
      </Dialog>
      <SuccessActionModal
        open={successModalOpen}
        onClose={() => setSuccessModalOpen(false)}
        title={successModalTitle}
        description={successModalDescription}
      />
      <RevokeApprovalModal
        open={revokeModalOpen}
        onClose={() => setRevokeModalOpen(false)}
        onConfirm={confirmRevoke}
        studentName={studentToRevoke?.name}
        loading={revokeLoading}
      />
      <ExportConfirmModal
        open={exportModalOpen}
        onClose={() => setExportModalOpen(false)}
        onConfirm={() => {
          setExportModalOpen(false);
          generateCsv(filteredReady);
        }}
        count={filteredReady.length}
      />
      <PasswordConfirmModal
        open={passwordModalOpen}
        onClose={() => setPasswordModalOpen(false)}
        onConfirm={handleConfirmPasswordUpdate}
        loading={passwordUpdateLoading}
      />

      <Menu
        anchorEl={rowActionAnchor}
        open={Boolean(rowActionAnchor)}
        onClose={handleRowActionClose}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
        PaperProps={{
          elevation: 0,
          sx: {
            minWidth: 200,
            borderRadius: '16px',
            mt: 1,
            border: '1px solid #E2E8F0',
            boxShadow: '0 10px 15px -3px rgba(0,0,0,0.05), 0 4px 6px -2px rgba(0,0,0,0.02)'
          }
        }}
      >
        <MenuItem
          onClick={() => {
            setSelected(rowActionRow);
            handleRowActionClose();
          }}
          sx={{ gap: 1.5, py: 1.5 }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#64748B" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
          <Typography sx={{ fontSize: '0.875rem', fontWeight: 600, color: '#1E293B' }}>View Full Record</Typography>
        </MenuItem>

        {filterStatus === "approved" ? (
          <MenuItem
            onClick={() => {
              handleRevoke(rowActionRow);
              handleRowActionClose();
            }}
            sx={{ gap: 1.5, py: 1.5, color: '#EF4444' }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="1 4 1 10 7 10"></polyline><path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"></path></svg>
            <Typography sx={{ fontSize: '0.875rem', fontWeight: 600 }}>Revoke Approval</Typography>
          </MenuItem>
        ) : (
          <MenuItem
            onClick={() => {
              setStudentToApprove(rowActionRow);
              setSignatureModalOpen(true);
              handleRowActionClose();
            }}
            sx={{ gap: 1.5, py: 1.5, color: '#0D9488' }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 20h9"></path><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path></svg>
            <Typography sx={{ fontSize: '0.875rem', fontWeight: 600 }}>Approve Final</Typography>
          </MenuItem>
        )}
      </Menu>

      {/* Bulk Actions Overlay - Root Level for Viewport Centering */}
      <AnimatePresence>
        {selectedIds.length > 0 && (
          <Box
            component={motion.div}
            initial={{ y: 100, opacity: 0, x: '-40%' }}
            animate={{ y: 0, opacity: 1, x: '-40%' }}
            exit={{ y: 100, opacity: 0, x: '-40%' }}
            sx={{
              position: 'fixed',
              bottom: { xs: 24, sm: 80 },
              left: '50%',
              width: { xs: 'calc(100% - 32px)', sm: 'auto' },
              maxWidth: '95vw',
              bgcolor: '#3c4043',
              color: '#FFF',
              py: { xs: 1.25, sm: 2 },
              px: { xs: 2.5, sm: 3 },
              borderRadius: '20px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: { xs: 1, sm: 3 },
              boxShadow: '0 10px 40px rgba(0,0,0,0.3)',
              zIndex: 9999
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexShrink: 0 }}>
              <Typography sx={{ fontWeight: 800, fontSize: { xs: 11, sm: 13 }, letterSpacing: '0.01em', whiteSpace: 'nowrap' }}>
                {selectedIds.length} {selectedIds.length === 1 ? 'student' : 'students'}
                <Box component="span" sx={{ display: { xs: 'none', sm: 'inline' } }}> selected</Box>
              </Typography>
            </Box>
            <Divider orientation="vertical" flexItem sx={{ bgcolor: 'rgba(255,255,255,0.15)', height: 20, my: 'auto' }} />
            <Box sx={{ display: 'flex', gap: { xs: 0, sm: 1 } }}>
              <Button
                variant="text"
                size="small"
                onClick={handleBulkApprove}
                disabled={filterStatus === 'approved'}
                sx={{
                  color: filterStatus === 'pending' ? '#FFF' : 'rgba(255,255,255,0.3)',
                  textTransform: 'none',
                  fontWeight: 700,
                  fontSize: '0.8125rem',
                  bgcolor: 'transparent',
                  px: { xs: 0.75, sm: 1.5 },
                  minWidth: { xs: 0, sm: 'auto' },
                  borderRadius: '8px',
                  '&:hover': { bgcolor: 'rgba(255,255,255,0.08)' },
                  '&.Mui-disabled': { color: 'rgba(255,255,255,0.2)' }
                }}
              >
                <CheckCircleIcon sx={{ fontSize: 18 }} />
                <Box component="span" sx={{ display: { xs: 'none', sm: 'block' }, ml: 1 }}>Mark as Cleared</Box>
              </Button>
              <Button
                variant="text"
                size="small"
                onClick={handleBulkRevoke}
                disabled={filterStatus === 'pending'}
                sx={{
                  color: filterStatus === 'approved' ? '#FFF' : 'rgba(255,255,255,0.3)',
                  textTransform: 'none',
                  fontWeight: 700,
                  fontSize: '0.8125rem',
                  bgcolor: 'transparent',
                  px: { xs: 0.75, sm: 1.5 },
                  minWidth: { xs: 0, sm: 'auto' },
                  borderRadius: '8px',
                  '&:hover': { bgcolor: 'rgba(255,255,255,0.08)' },
                  '&.Mui-disabled': { color: 'rgba(255,255,255,0.2)' }
                }}
              >
                <UndoIcon sx={{ fontSize: 18 }} />
                <Box component="span" sx={{ display: { xs: 'none', sm: 'block' }, ml: 1 }}>Revoke</Box>
              </Button>
              <Button
                variant="text"
                size="small"
                onClick={handleExport}
                sx={{
                  color: '#FFF',
                  textTransform: 'none',
                  fontWeight: 700,
                  fontSize: '0.8125rem',
                  bgcolor: 'transparent',
                  px: { xs: 0.75, sm: 1.5 },
                  minWidth: { xs: 0, sm: 'auto' },
                  borderRadius: '8px',
                  '&:hover': { bgcolor: 'rgba(255,255,255,0.08)' }
                }}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
                <Box component="span" sx={{ display: { xs: 'none', sm: 'block' }, ml: 1 }}>Export</Box>
              </Button>
            </Box>
          </Box>
        )}
      </AnimatePresence>
    </Box>
  );
}
