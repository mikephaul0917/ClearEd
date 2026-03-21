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
import CircularProgress from "@mui/material/CircularProgress";
import CheckIcon from "@mui/icons-material/Check";
import { EmptyState } from "../../components/layout/EmptyState";
import SignatureModal from "../../components/stream/SignatureModal";

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
  const [notice, setNotice] = useState<{ message: string, variant: 'success' | 'error' | 'info' } | null>((location.state as any)?.banner ?? null);
  const [query, setQuery] = useState("");
  const [filterCourse, setFilterCourse] = useState<string>("");
  const [filterYear, setFilterYear] = useState<string>("");
  const [filterDate, setFilterDate] = useState<string>("");
  const [sortOrder, setSortOrder] = useState<"newest" | "oldest">("newest");
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [selected, setSelected] = useState<any>(null);
  
  const [signatureModalOpen, setSignatureModalOpen] = useState(false);
  const [studentToApprove, setStudentToApprove] = useState<any>(null);
  const [actionState, setActionState] = useState<'idle' | 'loading' | 'success'>('idle');
  const [actionRowId, setActionRowId] = useState<string | null>(null);

  const [readyRows, setReadyRows] = useState<any[]>([]);
  const [orgRows, setOrgRows] = useState<any[]>([]);

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
      const res = await api.get("/dean/final-ready");
      const items = (res.data.rows || []).map((r: any, idx: number) => ({
        id: r.id || String(idx + 1),
        name: r.name || r.studentName || "Unknown",
        studentId: r.studentId || `S-${(idx + 1).toString().padStart(5, "0")}`,
        course: r.course || "BSCS",
        year: r.year || "4th Year",
        dateSubmitted: r.dateSubmitted || new Date().toISOString().slice(0, 10),
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
  }, []);

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
    if (filterDate) list = list.filter(r => (r.dateSubmitted || "").startsWith(filterDate));
    list = [...list].sort((a, b) => {
      const da = (a.dateSubmitted || "");
      const db = (b.dateSubmitted || "");
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
          <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
            <Box>
              <Typography variant="h5" sx={{ fontWeight: 800, color: "#0F172A" }}>Dean Dashboard</Typography>
              <Typography sx={{ color: "#6B7280", fontSize: 13 }}>Final Approval</Typography>
            </Box>
            <IconButton onClick={() => nav("/dean/settings")}>
              <Box aria-hidden sx={{ width: 24, height: 24 }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 8a4 4 0 100 8 4 4 0 000-8z" stroke="#0F172A" strokeWidth="2" />
                  <path d="M2 12h4M18 12h4M12 2v4M12 18v4" stroke="#0F172A" strokeWidth="2" strokeLinecap="round" />
                </svg>
              </Box>
            </IconButton>
          </Box>

          <Box display="grid" gridTemplateColumns={{ xs: "1fr", sm: "1fr 1fr", lg: "repeat(4, 1fr)" }} gap={2} mb={3}>
            {[
              {
                label: "Ready for Final Approval", value: readyCount, color: "#2563EB", icon: (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M4 7h16M4 12h16M4 17h10" stroke="#2563EB" strokeWidth="2" /></svg>
                )
              },
              {
                label: "Finalized Today", value: finalizedToday, color: "#16A34A", icon: (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M20 6L9 17l-5-5" stroke="#16A34A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
                )
              },
              {
                label: "Rejected Today", value: rejectedToday, color: "#DC2626", icon: (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M7 7l10 10M17 7L7 17" stroke="#DC2626" strokeWidth="2" strokeLinecap="round" /></svg>
                )
              },
              {
                label: "Pending Organizations", value: orgRows.length, color: "#F59E0B", icon: (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12 8v4l3 3" stroke="#F59E0B" strokeWidth="2" strokeLinecap="round" /></svg>
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
            <Typography variant="h4" sx={{ fontWeight: 800, mb: 2 }}>Students Ready for Final Approval</Typography>
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
                {paginatedReady.map((r) => (
                  <TableRow key={r.id} hover sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                    <TableCell sx={{ py: 1.5, fontWeight: 600, color: "#0F172A" }}>{r.name}</TableCell>
                    <TableCell sx={{ py: 1.5, color: "#64748B", fontSize: "0.875rem" }}>{r.course} – {r.year}</TableCell>
                    <TableCell align="center" sx={{ py: 1.5 }}>
                      <Chip label="Ready" size="small" sx={{ bgcolor: "#ECFDF5", color: "#10B981", fontWeight: 700, fontSize: "0.75rem", height: 24 }} />
                    </TableCell>
                    <TableCell align="center" sx={{ py: 1.5, fontWeight: 500, color: "#475569", fontSize: "0.875rem" }}>{(r.reqCompleted || 0)} / {(r.reqTotal || 0)}</TableCell>
                    <TableCell align="right" sx={{ py: 1.5 }}>
                      <Box display="flex" justifyContent="flex-end" gap={1}>
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
                        <Button
                          onClick={() => { setStudentToApprove(r); setSignatureModalOpen(true); }}
                          disabled={actionState !== 'idle'}
                          sx={{
                            fontFamily: "'Inter', 'Plus Jakarta Sans', 'Montserrat', sans-serif",
                            fontWeight: 600,
                            textTransform: 'none',
                            borderRadius: '8px',
                            backgroundColor: actionState === 'success' && actionRowId === r.id ? '#10b981' : '#0a0a0a',
                            color: '#FFFFFF',
                            px: 2,
                            py: 0.5,
                            fontSize: '0.8125rem',
                            display: 'flex', gap: 1, alignItems: 'center',
                            transition: 'all 0.2s ease',
                            '&:hover': { backgroundColor: actionState === 'success' && actionRowId === r.id ? '#10b981' : '#222' },
                            '&.Mui-disabled': { backgroundColor: actionState === 'success' && actionRowId === r.id ? '#10b981' : '#E2E8F0', color: actionState === 'success' && actionRowId === r.id ? '#fff' : '#94A3B8' }
                          }}
                        >
                          {actionState === 'loading' && actionRowId === r.id && <CircularProgress size={14} color="inherit" />}
                          {actionState === 'success' && actionRowId === r.id && <CheckIcon fontSize="small" />}
                          {actionRowId === r.id ? (
                            actionState === 'idle' ? 'Approve Final' : actionState === 'loading' ? 'Approving...' : 'Approved!'
                          ) : 'Approve Final'}
                        </Button>
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
            <TablePagination component="div" count={filteredReady.length} page={page} onPageChange={(_, newPage) => setPage(newPage)} rowsPerPage={rowsPerPage} onRowsPerPageChange={(e) => { setRowsPerPage(parseInt(e.target.value, 10)); setPage(0); }} rowsPerPageOptions={[5, 10, 25]} />
          </Paper>
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
        <Box maxWidth={720} mx="auto">
          <Box mb={3} display="flex" alignItems="center" gap={1.5}>
            <Box aria-hidden sx={{ width: 40, height: 40, borderRadius: 1, backgroundColor: "#E5E7EB", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 6a6 6 0 100 12 6 6 0 000-12z" stroke="#111827" strokeWidth="2" />
                <path d="M12 2v3M12 19v3M2 12h3M19 12h3" stroke="#111827" strokeWidth="2" strokeLinecap="round" />
              </svg>
            </Box>
            <Typography variant="h4" sx={{ fontWeight: 800, color: "#111827" }}>Account Settings</Typography>
          </Box>
          <Box display="flex" flexDirection="column" gap={3}>
            <Box sx={{ backgroundColor: "#FFFFFF", border: "1px solid #E5E7EB", borderRadius: 1, boxShadow: "0 8px 24px rgba(0,0,0,0.06)", p: 4 }}>
              <Box display="flex" alignItems="center" gap={1.5} mb={3}>
                <Box aria-hidden sx={{ width: 32, height: 32, borderRadius: 1, backgroundColor: "#F3F4F6", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <circle cx="12" cy="8" r="4" stroke="#111827" strokeWidth="2" />
                    <path d="M4 20c0-4 4-6 8-6s8 2 8 6" stroke="#111827" strokeWidth="2" strokeLinecap="round" />
                  </svg>
                </Box>
                <Typography variant="h6" sx={{ fontWeight: 800, color: "#111827" }}>Profile</Typography>
              </Box>
              <Box display="flex" flexDirection="column" gap={3}>
                <FormControl>
                  <FormLabel sx={{ fontSize: 13, color: "#374151", mb: 0.5 }}>First Name</FormLabel>
                  <TextField placeholder="First name" value={draftFirst} onChange={(e) => setDraftFirst(e.target.value)} fullWidth sx={{ '& .MuiOutlinedInput-root': { borderRadius: 1 }, '& .MuiInputBase-input::placeholder': { color: '#9CA3AF' } }} />
                </FormControl>
                <FormControl>
                  <FormLabel sx={{ fontSize: 13, color: "#374151", mb: 0.5 }}>Last Name</FormLabel>
                  <TextField placeholder="Last name" value={draftLast} onChange={(e) => setDraftLast(e.target.value)} fullWidth sx={{ '& .MuiOutlinedInput-root': { borderRadius: 1 }, '& .MuiInputBase-input::placeholder': { color: '#9CA3AF' } }} />
                </FormControl>
                <FormControl>
                  <FormLabel sx={{ fontSize: 13, color: "#374151", mb: 0.5 }}>Email</FormLabel>
                  <TextField placeholder="Email" value={email} disabled fullWidth sx={{ '& .MuiOutlinedInput-root': { borderRadius: 1, backgroundColor: '#F3F4F6' }, '& .MuiInputBase-input::placeholder': { color: '#9CA3AF' } }} />
                  <Typography sx={{ fontSize: 12, color: "#6B7280", mt: 0.75, fontStyle: "italic" }}>Email cannot be changed</Typography>
                </FormControl>
              </Box>
              <Button variant="contained" color="primary" onClick={updateProfile} fullWidth sx={{ mt: 3, borderRadius: 1, height: 52, backgroundColor: "#000", '&:hover': { backgroundColor: "#111" } }}>update your profile</Button>
            </Box>
            <Box sx={{ backgroundColor: "#FFFFFF", border: "1px solid #E5E7EB", borderRadius: 1, boxShadow: "0 8px 24px rgba(0,0,0,0.06)", p: 4 }}>
              <Box display="flex" alignItems="center" gap={1.5} mb={3}>
                <Box aria-hidden sx={{ width: 32, height: 32, borderRadius: 1, backgroundColor: "#F3F4F6", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M12 3l2 2 3-3 3 3-3 3 2 2-2 2 2 2-2 2 3 3-3 3-3-3-2 2-2-2-2 2-3-3 3-3-2-2 2-2-2-2 2-2-2-2 3-3 3 3 2-2z" stroke="#111827" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </Box>
                <Typography variant="h6" sx={{ fontWeight: 800, color: "#111827" }}>Security</Typography>
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
              <Button variant="contained" color="primary" onClick={updatePassword} fullWidth sx={{ mt: 3, borderRadius: 1, height: 52, backgroundColor: "#000", '&:hover': { backgroundColor: "#111" } }}>Update Password</Button>
            </Box>
          </Box>
        </Box>
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
