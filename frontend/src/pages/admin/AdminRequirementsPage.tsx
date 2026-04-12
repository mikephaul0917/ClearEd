import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Paper from "@mui/material/Paper";
import TextField from "@mui/material/TextField";
import Button from "@mui/material/Button";
import IconButton from "@mui/material/IconButton";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import FormControl from "@mui/material/FormControl";
import FormLabel from "@mui/material/FormLabel";
import Chip from "@mui/material/Chip";
import Switch from "@mui/material/Switch";
import InputAdornment from "@mui/material/InputAdornment";
import Skeleton from "@mui/material/Skeleton";
import Tooltip from "@mui/material/Tooltip";
import { AddCircle, Delete } from "@mui/icons-material";
import { adminService } from "../../services";
import { useEffect, useMemo, useState, useCallback } from "react";
import Swal from "sweetalert2";

type DeptWithReqs = { _id: string; name: string; requirements: { _id: string; name: string; description?: string; uploadRequired?: boolean; isActive?: boolean }[] };

export default function AdminRequirementsPage({
  refreshTrigger = 0,
  onLoadingChange
}: {
  refreshTrigger?: number;
  onLoadingChange?: (loading: boolean) => void;
}) {
  const [rows, setRows] = useState<DeptWithReqs[]>([]);
  const [deletedRows, setDeletedRows] = useState<DeptWithReqs[]>([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [dialogMode, setDialogMode] = useState<"add" | "edit" | null>(null);
  const [activeDept, setActiveDept] = useState<DeptWithReqs | null>(null);
  const [activeReq, setActiveReq] = useState<{ _id?: string; name: string; description: string; uploadRequired: boolean }>({ name: "", description: "", uploadRequired: true });
  const [cardMenuAnchor, setCardMenuAnchor] = useState<null | HTMLElement>(null);
  const [cardMenuDept, setCardMenuDept] = useState<DeptWithReqs | null>(null);
  const [reqMenuAnchor, setReqMenuAnchor] = useState<null | HTMLElement>(null);
  const [reqMenuDept, setReqMenuDept] = useState<DeptWithReqs | null>(null);
  const [reqMenuItem, setReqMenuItem] = useState<{ _id: string; name: string; description?: string; uploadRequired?: boolean } | null>(null);
  const [saving, setSaving] = useState(false);

  // Bento tokens
  const COLORS = {
    black: '#0a0a0a',
    textSecondary: '#64748B',
    border: '#E2E8F0',
    cardRadius: '16px',
    pageBg: '#F9FAFB',
    teal: '#5fcca0',
  };
  const fontStack = '"Google Sans", "Product Sans", Roboto, sans-serif';

  const fetchAll = useCallback(async () => {
    setLoading(true);
    onLoadingChange?.(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      const [data, delData] = await Promise.all([
        adminService.getRequirements(),
        adminService.getDeletedRequirements()
      ]);
      setRows(data || []);
      setDeletedRows(delData || []);
    } catch (error) {
      setRows([]);
      setDeletedRows([]);
    } finally {
      setLoading(false);
      onLoadingChange?.(false);
    }
  }, [onLoadingChange]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  useEffect(() => {
    if (refreshTrigger > 0) {
      fetchAll();
    }
  }, [refreshTrigger, fetchAll]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return rows;
    return rows.map(d => ({
      ...d,
      requirements: d.requirements.filter(r => (d.name.toLowerCase().includes(q) || (r.name || "").toLowerCase().includes(q)))
    })).filter(d => (d.name.toLowerCase().includes(q) || (d.requirements || []).length > 0));
  }, [rows, query]);

  const filteredDeleted = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return deletedRows;
    return deletedRows.map(d => ({
      ...d,
      requirements: d.requirements.filter(r => (d.name.toLowerCase().includes(q) || (r.name || "").toLowerCase().includes(q)))
    })).filter(d => (d.name.toLowerCase().includes(q) || (d.requirements || []).length > 0));
  }, [deletedRows, query]);

  const openAdd = (dept: DeptWithReqs) => { setActiveDept(dept); setActiveReq({ name: "", description: "", uploadRequired: true }); setDialogMode("add"); };
  const openEdit = (dept: DeptWithReqs, req: any) => { setActiveDept(dept); setActiveReq({ _id: req._id, name: req.name || "", description: req.description || "", uploadRequired: !!req.uploadRequired }); setDialogMode("edit"); };
  const closeDialog = () => { setDialogMode(null); setActiveDept(null); setActiveReq({ name: "", description: "", uploadRequired: true }); };
  const openCardMenu = (evt: React.MouseEvent<HTMLButtonElement>, dept: DeptWithReqs) => { setCardMenuAnchor(evt.currentTarget); setCardMenuDept(dept); };
  const closeCardMenu = () => { setCardMenuAnchor(null); setCardMenuDept(null); };
  const openReqMenu = (evt: React.MouseEvent<HTMLButtonElement>, dept: DeptWithReqs, req: any) => { setReqMenuAnchor(evt.currentTarget); setReqMenuDept(dept); setReqMenuItem(req); };
  const closeReqMenu = () => { setReqMenuAnchor(null); setReqMenuDept(null); setReqMenuItem(null); };

  const saveReq = async () => {
    if (!activeDept || !activeReq.name.trim()) {
      Swal.fire("Required", "Please provide a requirement name", "warning");
      return;
    }
    setSaving(true);
    try {
      if (dialogMode === "add") {
        await adminService.createRequirement({ organizationId: activeDept._id, name: activeReq.name, description: activeReq.description, uploadRequired: activeReq.uploadRequired });
        Swal.fire("Success", "Requirement added successfully", "success");
      } else if (dialogMode === "edit" && activeReq._id) {
        await adminService.updateRequirement(activeReq._id, { name: activeReq.name, description: activeReq.description, uploadRequired: activeReq.uploadRequired });
        Swal.fire("Success", "Requirement updated successfully", "success");
      }
      closeDialog();
      fetchAll();
    } catch (error: any) {
      Swal.fire("Error", "Failed to save requirement", "error");
    } finally {
      setSaving(false);
    }
  };

  const removeReq = async (reqId: string) => {
    try {
      const res = await Swal.fire({
        title: "Remove Requirement?",
        text: "This will move it to delete history.",
        icon: "warning",
        showCancelButton: true,
        confirmButtonText: "Remove",
        confirmButtonColor: "#EF4444"
      });
      if (res.isConfirmed) {
        await adminService.deleteRequirement(reqId);
        Swal.fire("Removed", "Requirement moved to history", "success");
        fetchAll();
      }
    } catch (error) {
      Swal.fire("Error", "Failed to remove requirement", "error");
    }
  };

  const restoreReq = async (reqId: string) => {
    try {
      await adminService.restoreRequirement(reqId);
      Swal.fire("Restored", "Requirement is now active", "success");
      fetchAll();
    } catch (error) {
      Swal.fire("Error", "Failed to restore requirement", "error");
    }
  };

  const permanentDeleteReq = async (reqId: string) => {
    try {
      const res = await Swal.fire({
        title: "Delete Permanently?",
        text: "This action cannot be undone.",
        icon: "warning",
        showCancelButton: true,
        confirmButtonText: "Delete",
        confirmButtonColor: "#EF4444"
      });
      if (res.isConfirmed) {
        await adminService.permanentDeleteRequirement(reqId);
        Swal.fire("Deleted", "Requirement removed permanently", "success");
        fetchAll();
      }
    } catch (error) {
      Swal.fire("Error", "Failed to delete requirement", "error");
    }
  };

  return (
    <Box sx={{ fontFamily: fontStack }}>
      <Paper sx={{ p: 3, borderRadius: COLORS.cardRadius, boxShadow: "none", border: `1px solid ${COLORS.border}` }}>
        <Box display="flex" alignItems="center" justifyContent="space-between" flexWrap="wrap" gap={1.5} mb={3}>
          {loading ? (
            <Skeleton variant="rounded" width={360} height={40} sx={{ borderRadius: '12px' }} />
          ) : (
            <TextField
              placeholder="Search organizations or requirements"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Box aria-hidden sx={{ width: 16, height: 16 }}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <circle cx="11" cy="11" r="7" stroke="#64748B" strokeWidth="2" />
                        <path d="M20 20l-3.5-3.5" stroke="#64748B" strokeWidth="2" strokeLinecap="round" />
                      </svg>
                    </Box>
                  </InputAdornment>
                )
              }}
              sx={{
                width: { xs: "100%", sm: 360 },
                '& .MuiOutlinedInput-root': { borderRadius: '12px' }
              }}
            />
          )}
        </Box>

        <Box display="grid" gridTemplateColumns={{ xs: "1fr", md: "repeat(2, 1fr)", lg: "repeat(3, 1fr)" }} gap={3} alignItems="stretch">
          {loading ? (
            [1, 2, 3, 4, 5, 6].map((i) => (
              <Box key={i} sx={{ backgroundColor: "#FFFFFF", border: `1px solid ${COLORS.border}`, borderRadius: COLORS.cardRadius, p: 3, display: "flex", flexDirection: "column" }}>
                <Box display="flex" alignItems="center" justifyContent="space-between" mb={1}>
                  <Skeleton width="60%" height={32} />
                  <Skeleton variant="circular" width={24} height={24} />
                </Box>
                <Skeleton width="40%" height={20} sx={{ mb: 2 }} />
                <Box display="flex" flexDirection="column" gap={1}>
                  <Skeleton variant="rounded" height={40} sx={{ borderRadius: '8px' }} />
                  <Skeleton variant="rounded" height={40} sx={{ borderRadius: '8px' }} />
                </Box>
              </Box>
            ))
          ) : filtered.length === 0 ? (
            <Box sx={{ gridColumn: '1 / -1', textAlign: 'center', py: 8 }}>
              <Typography color="textSecondary">No requirements found matching your search.</Typography>
            </Box>
          ) : (
            filtered.map((dept) => (
              <Box
                key={dept._id}
                sx={{
                  backgroundColor: "#FFFFFF",
                  border: `1px solid ${COLORS.border}`,
                  borderRadius: COLORS.cardRadius,
                  p: 3,
                  display: "flex",
                  flexDirection: "column",
                  transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                  '&:hover': {
                    transform: 'translateY(-2px)',
                    boxShadow: '0 12px 24px rgba(0,0,0,0.04)',
                    borderColor: '#CBD5E1'
                  }
                }}
              >
                <Box display="flex" alignItems="center" justifyContent="space-between" mb={1.5}>
                  <Typography variant="h6" sx={{ fontWeight: 800, color: '#0F172A' }}>{dept.name}</Typography>
                  <Tooltip title="Add Requirement">
                    <IconButton
                      size="small"
                      onClick={() => openAdd(dept)}
                      sx={{
                        backgroundColor: '#F1F5F9',
                        color: COLORS.black,
                        '&:hover': { backgroundColor: '#E2E8F0' }
                      }}
                    >
                      <AddCircle sx={{ fontSize: 20 }} />
                    </IconButton>
                  </Tooltip>
                </Box>
                <Typography variant="caption" sx={{ color: "#64748B", fontWeight: 700, mb: 1.5, letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                  Requirements
                </Typography>
                <Box display="flex" flexDirection="column" gap={1.5}>
                  {(dept.requirements || []).length ? (
                    dept.requirements.map((r) => (
                      <Box
                        key={r._id}
                        display="flex"
                        alignItems="center"
                        justifyContent="space-between"
                        sx={{
                          border: `1px solid ${COLORS.border}`,
                          borderRadius: '12px',
                          p: 1.5,
                          backgroundColor: '#F8FAFC'
                        }}
                      >
                        <Box display="flex" flexDirection="column">
                          <Box display="flex" alignItems="center" gap={1} mb={0.5}>
                            <Typography sx={{ fontWeight: 600, fontSize: '0.925rem' }}>{r.name}</Typography>
                            {r.uploadRequired && (
                              <Chip
                                size="small"
                                label="Upload Req"
                                sx={{
                                  fontSize: 9,
                                  height: 18,
                                  backgroundColor: '#DCFCE7',
                                  color: '#166534',
                                  fontWeight: 700
                                }}
                              />
                            )}
                          </Box>
                          {r.description && (
                            <Typography sx={{ color: "#64748B", fontSize: 12, lineHeight: 1.4 }}>
                              {r.description}
                            </Typography>
                          )}
                        </Box>
                        <IconButton
                          size="small"
                          onClick={(e) => openReqMenu(e, dept, r)}
                          sx={{ color: '#94A3B8', '&:hover': { color: '#475569' } }}
                        >
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <circle cx="12" cy="5" r="2" fill="currentColor" />
                            <circle cx="12" cy="12" r="2" fill="currentColor" />
                            <circle cx="12" cy="19" r="2" fill="currentColor" />
                          </svg>
                        </IconButton>
                      </Box>
                    ))
                  ) : (
                    <Typography sx={{ color: "#94A3B8", fontSize: 13, fontStyle: 'italic', py: 1 }}>
                      No requirements yet
                    </Typography>
                  )}
                </Box>
              </Box>
            ))
          )}
        </Box>
      </Paper>

      {loading ? (
        <Paper sx={{ mt: 4, p: 4, borderRadius: COLORS.cardRadius, boxShadow: "none", border: `1px solid ${COLORS.border}`, backgroundColor: '#F8FAFC' }}>
          <Box mb={3}>
            <Skeleton width="200px" height={32} sx={{ mb: 1 }} />
            <Skeleton width="300px" height={20} />
          </Box>
          <Box display="grid" gridTemplateColumns={{ xs: "1fr", md: "repeat(2, 1fr)", lg: "repeat(3, 1fr)" }} gap={3}>
            {[1, 2, 3].map((i) => (
              <Box key={i} sx={{ backgroundColor: "#FFFFFF", border: `1px solid ${COLORS.border}`, borderRadius: '12px', p: 2.5 }}>
                <Skeleton width="70%" height={24} sx={{ mb: 2 }} />
                <Skeleton variant="rounded" height={80} sx={{ borderRadius: '10px' }} />
              </Box>
            ))}
          </Box>
        </Paper>
      ) : filteredDeleted.length > 0 && (
        <Paper sx={{ mt: 4, p: 4, borderRadius: COLORS.cardRadius, boxShadow: "none", border: `1px solid #FCA5A5`, backgroundColor: '#FFF5F5' }}>
          <Box mb={3}>
            <Typography variant="h6" sx={{ fontWeight: 800, color: "#991B1B" }}>Delete History</Typography>
            <Typography sx={{ color: "#B91C1C", fontSize: 13, opacity: 0.8 }}>Archived requirements can be restored or permanently removed</Typography>
          </Box>
          <Box display="grid" gridTemplateColumns={{ xs: "1fr", md: "repeat(2, 1fr)", lg: "repeat(3, 1fr)" }} gap={3}>
            {filteredDeleted.map((dept) => (
              <Box
                key={dept._id}
                sx={{
                  backgroundColor: "#FFFFFF",
                  border: "1px solid #FECACA",
                  borderRadius: '12px',
                  p: 2.5,
                  display: "flex",
                  flexDirection: "column"
                }}
              >
                <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1.5, color: '#991B1B' }}>{dept.name}</Typography>
                <Box display="flex" flexDirection="column" gap={1.5}>
                  {(dept.requirements || []).length ? (
                    dept.requirements.map((r) => (
                      <Box
                        key={r._id}
                        sx={{
                          border: "1px solid #FEE2E2",
                          borderRadius: '10px',
                          p: 2,
                          backgroundColor: '#FFF'
                        }}
                      >
                        <Box mb={2}>
                          <Typography sx={{ fontWeight: 600, fontSize: '0.9rem', mb: 0.5 }}>{r.name}</Typography>
                          {r.description && <Typography sx={{ fontSize: 11, color: '#666' }}>{r.description}</Typography>}
                        </Box>
                        <Box display="flex" gap={1}>
                          <Button
                            fullWidth
                            size="small"
                            variant="outlined"
                            onClick={() => restoreReq(r._id)}
                            sx={{
                              borderColor: '#DC2626',
                              color: '#DC2626',
                              textTransform: 'none',
                              fontWeight: 600,
                              borderRadius: '8px',
                              '&:hover': { backgroundColor: '#FEF2F2', borderColor: '#B91C1C' }
                            }}
                          >
                            Restore
                          </Button>
                          <IconButton
                            size="small"
                            color="error"
                            onClick={() => permanentDeleteReq(r._id)}
                            sx={{ backgroundColor: '#FEF2F2', borderRadius: '8px' }}
                          >
                            <Delete sx={{ fontSize: 18 }} />
                          </IconButton>
                        </Box>
                      </Box>
                    ))
                  ) : (
                    <Typography sx={{ color: "#EF4444", fontSize: 12, fontStyle: 'italic' }}>No archived items</Typography>
                  )}
                </Box>
              </Box>
            ))}
          </Box>
        </Paper>
      )}

      <Menu
        anchorEl={reqMenuAnchor}
        open={!!reqMenuAnchor}
        onClose={closeReqMenu}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
        transformOrigin={{ vertical: "top", horizontal: "right" }}
        PaperProps={{
          sx: {
            borderRadius: '12px',
            mt: 1,
            boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
            minWidth: 140
          }
        }}
      >
        <MenuItem onClick={() => { if (reqMenuDept && reqMenuItem) openEdit(reqMenuDept, reqMenuItem); closeReqMenu(); }}>
          <Typography sx={{ fontWeight: 600, fontSize: 13, fontFamily: fontStack }}>Edit</Typography>
        </MenuItem>
        <MenuItem onClick={() => { if (reqMenuItem) removeReq(reqMenuItem._id); closeReqMenu(); }} sx={{ color: "#EF4444" }}>
          <Typography sx={{ fontWeight: 600, fontSize: 13, fontFamily: fontStack }}>Delete</Typography>
        </MenuItem>
      </Menu>

      <Dialog
        open={!!dialogMode}
        onClose={closeDialog}
        fullWidth
        maxWidth="sm"
        PaperProps={{
          sx: { borderRadius: '20px', p: 1 }
        }}
      >
        <DialogTitle sx={{ fontWeight: 800, fontSize: '1.25rem', fontFamily: fontStack }}>
          {dialogMode === "add" ? "Add New Requirement" : "Edit Requirement"}
        </DialogTitle>
        <DialogContent>
          <Box display="flex" flexDirection="column" gap={3} sx={{ mt: 1 }}>
            <Box>
              <Typography variant="caption" sx={{ fontWeight: 700, color: COLORS.textSecondary, mb: 1, display: 'block' }}>
                REQUIREMENT NAME
              </Typography>
              <TextField
                fullWidth
                placeholder="e.g., Validated Library Card"
                value={activeReq.name}
                onChange={(e) => setActiveReq(v => ({ ...v, name: e.target.value }))}
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px' } }}
              />
            </Box>
            <Box>
              <Typography variant="caption" sx={{ fontWeight: 700, color: COLORS.textSecondary, mb: 1, display: 'block' }}>
                DESCRIPTION (OPTIONAL)
              </Typography>
              <TextField
                fullWidth
                multiline
                rows={2}
                placeholder="Short instructions for students"
                value={activeReq.description}
                onChange={(e) => setActiveReq(v => ({ ...v, description: e.target.value }))}
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px' } }}
              />
            </Box>
            <Box display="flex" alignItems="center" justifyContent="space-between" sx={{ p: 2, backgroundColor: '#F8FAFC', borderRadius: '12px' }}>
              <Box>
                <Typography sx={{ fontWeight: 600, fontSize: '0.9rem' }}>Upload Required</Typography>
                <Typography sx={{ fontSize: '0.75rem', color: '#64748B' }}>Students must upload a document for this</Typography>
              </Box>
              <Switch
                checked={activeReq.uploadRequired}
                onChange={(e) => setActiveReq(v => ({ ...v, uploadRequired: e.target.checked }))}
                sx={{
                  '& .MuiSwitch-switchBase.Mui-checked': { color: COLORS.black },
                  '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': { backgroundColor: COLORS.black }
                }}
              />
            </Box>
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 3, gap: 1 }}>
          <Button
            onClick={closeDialog}
            sx={{
              color: '#64748B',
              textTransform: 'none',
              fontWeight: 600,
              fontFamily: fontStack
            }}
          >
            Cancel
          </Button>
          <Button
            onClick={saveReq}
            variant="contained"
            disabled={saving}
            sx={{
              backgroundColor: COLORS.black,
              borderRadius: '12px',
              px: 4,
              py: 1,
              textTransform: 'none',
              fontWeight: 600,
              fontFamily: fontStack,
              '&:hover': { backgroundColor: '#222' }
            }}
          >
            {saving ? "Saving..." : "Save Requirement"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
