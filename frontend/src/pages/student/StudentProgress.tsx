import { useEffect, useState, useMemo } from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Paper from "@mui/material/Paper";
import { clearanceService, api } from "../../services";
import Table from "@mui/material/Table";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import TableCell from "@mui/material/TableCell";
import TableBody from "@mui/material/TableBody";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import Grid from "@mui/material/Grid";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import BusinessIcon from "@mui/icons-material/Business";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import ErrorIcon from "@mui/icons-material/Error";
import PendingIcon from "@mui/icons-material/Pending";
import { useNavigate } from "react-router-dom";
import Skeleton from "@mui/material/Skeleton";
import Dialog from "@mui/material/Dialog";

const COLORS = {
  black: '#0a0a0a',
  textSecondary: '#64748B',
  teal: '#5fcca0',
  lavender: '#cb9bfb',
  orange: '#ff895d',
  border: '#E2E8F0',
};

export default function StudentProgress({ organizationId, studentId, studentInfo, readOnly }: { organizationId?: string | null, studentId?: string | null, studentInfo?: any, readOnly?: boolean }) {
  const navigate = useNavigate();
  const [items, setItems] = useState<any[]>([]);
  const [orgInfo, setOrgInfo] = useState<any>(null);
  const [myClearances, setMyClearances] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTerm, setActiveTerm] = useState<any>(null);
  const [institutionInfo, setInstitutionInfo] = useState<any>(null);
  const [finalClearance, setFinalClearance] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [submittingDean, setSubmittingDean] = useState(false);
  const [zoomedSignature, setZoomedSignature] = useState<string | null>(null);

  const isOverview = !organizationId;

  const fetchData = async () => {
    setLoading(true);
    try {
      if (isOverview) {
        const res = await clearanceService.getMyClearances(studentId || undefined);
        setMyClearances(res.organizations || []);
        setActiveTerm(res.term || null);
        setInstitutionInfo(res.institution || null);
        setFinalClearance(res.finalClearance || null);
      } else {
        const url = studentId ? `/clearance/timeline/${organizationId}?studentId=${studentId}` : `/clearance/timeline/${organizationId}`;
        const response = await api.get(url);
        setItems(response.data.items || []);
        setOrgInfo(response.data);
        // Also fetch active term if not already fetched
        if (!activeTerm) {
          const res = await clearanceService.getMyClearances();
          setActiveTerm(res.term || null);
          setInstitutionInfo(res.institution || null);
        }
      }

      // Display profile information
      try {
        if (studentInfo) {
           setProfile(studentInfo);
        } else if (!studentId) {
          const p = await api.get("/student/profile");
          setProfile(p.data || null);
        }
      } catch (err) {
        console.error("Failed to fetch profile:", err);
      }
    } catch (err) {
      console.error("Failed to fetch data:", err);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, [organizationId]);

  const stats = useMemo(() => {
    if (isOverview) {
      const approved = myClearances.filter(c => c.status === "completed" || c.status === "officer_cleared").length;
      const total = myClearances.length;
      return {
        total,
        approved,
        pending: myClearances.filter(c => c.status === "pending" || c.status === "in_progress").length,
        notStarted: myClearances.filter(c => c.status === "not_started").length,
        percent: Math.round((approved / (total || 1)) * 100)
      };
    } else {
      const approved = items.filter(i => i.status === "approved").length;
      const total = items.length;
      return {
        total,
        approved,
        pending: items.filter(i => i.status === "pending").length,
        rejected: items.filter(i => i.status === "rejected").length,
        percent: Math.round((approved / (total || 1)) * 100)
      };
    }
  }, [isOverview, myClearances, items]);

  const statsRejected = stats.rejected || 0;

  const resubmitAll = async () => {
    try {
      const data = await clearanceService.resubmitClearance();
      if (!isOverview) {
        // If we're in detail mode, we might need to refresh local items
        // but resubmitAll usually affects the global state.
        // For now, let's just refresh the data.
        fetchData();
      }
    } catch { }
  };

  const handleSubmitToDean = async () => {
    setSubmittingDean(true);
    try {
      await clearanceService.submitToDean();
      alert("Successfully submitted clearance to the Dean!");
      fetchData(); // Refresh to get the new status
    } catch (err: any) {
      alert(err.response?.data?.message || "Failed to submit clearance to Dean.");
    } finally {
      setSubmittingDean(false);
    }
  };

  const renderOverview = () => (
    <Box sx={{ maxWidth: 850, mx: "auto", py: 4 }}>
      <Paper elevation={0} sx={{
        p: { xs: 3, md: 6 },
        border: "1px solid #000",
        borderRadius: 0,
        backgroundColor: "#FFF",
        fontFamily: "'Times New Roman', Times, serif",
        color: "#000",
        position: 'relative'
      }}>
        {/* Header Section */}
        <Box textAlign="center" mb={4}>
          <Typography variant="h5" sx={{ fontWeight: 800, textTransform: "uppercase", mb: 0.5, letterSpacing: '0.05em' }}>
            STUDENT'S CLEARANCE
          </Typography>
          <Typography sx={{ fontSize: 16, fontWeight: 700, mt: 0.5, textTransform: "uppercase" }}>
            {institutionInfo?.name || "STA. CRUZ HIGH SCHOOL"}
          </Typography>
        </Box>

        {/* Student Info Section */}
        <Box sx={{ mb: 4 }}>
          <Box sx={{ display: 'flex', alignItems: 'flex-end', mb: 2 }}>
            <Typography sx={{ fontSize: 14, fontWeight: 700, mr: 1, minWidth: 60 }}>Name:</Typography>
            <Box sx={{ flex: 1, borderBottom: "1px solid #000", pb: 0.2 }}>
              <Typography sx={{ fontSize: 16, textAlign: "center", fontWeight: 600 }}>
                {(() => {
                  const fallbackName = studentInfo?.fullName || (localStorage.getItem("user") ? JSON.parse(localStorage.getItem("user")!)?.fullName : "Student Name");
                  
                  if (!profile) return fallbackName;

                  const fName = (profile.firstName || "").trim();
                  const lName = (profile.familyName || "").trim();
                  const mName = (profile.middleName || "").trim();
                  
                  // Scrub the literal string "undefined" if it exists
                  const scrub = (s: string) => s.toLowerCase() === "undefined" ? "" : s;
                  const first = scrub(fName);
                  const last = scrub(lName);
                  const middle = scrub(mName);
                  
                  if (first || last) {
                    return `${first} ${middle ? middle + ' ' : ''}${last}`.trim() || fallbackName;
                  }
                  
                  return fallbackName;
                })()}
              </Typography>
            </Box>
          </Box>
          <Box sx={{ display: 'flex', gap: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'flex-end', flex: 1.5 }}>
              <Typography sx={{ fontSize: 14, fontWeight: 700, mr: 1, minWidth: 60 }}>Course/Year:</Typography>
              <Box sx={{ flex: 1, borderBottom: "1px solid #000", pb: 0.2 }}>
                <Typography sx={{ fontSize: 16, textAlign: "center" }}>
                  {profile?.course || profile?.year ? `${profile.course || ''}${profile.course && profile.year ? ' / ' : ''}${profile.year || ''}${profile.section ? ' - ' + profile.section : ''}`.trim() : "—"}
                </Typography>
              </Box>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'flex-end', flex: 1 }}>
              <Typography sx={{ fontSize: 14, fontWeight: 700, mr: 1 }}>School Year</Typography>
              <Box sx={{ flex: 1, borderBottom: "1px solid #000", pb: 0.2 }}>
                <Typography sx={{ fontSize: 16, textAlign: "center" }}>{activeTerm?.academicYear || "—"}</Typography>
              </Box>
            </Box>
          </Box>
        </Box>

        {/* Table Header */}
        <Box sx={{ display: 'grid', gridTemplateColumns: '1.5fr 2fr 1fr', borderTop: '2px solid #000', borderBottom: '2px solid #000', py: 1, mb: 1 }}>
          <Typography sx={{ fontWeight: 800, textAlign: "center", fontSize: 14 }}>SUBJECT</Typography>
          <Typography sx={{ fontWeight: 800, textAlign: "center", fontSize: 14 }}>OFFICER'S SIGNATURES</Typography>
          <Typography sx={{ fontWeight: 800, textAlign: "center", fontSize: 14 }}>DATE</Typography>
        </Box>

        {/* Subjects/Organizations List */}
        <Box>
          {myClearances.map((org) => (
            <Box
              key={org._id}
              onClick={() => navigate(`/student/progress/${org._id}`)}
              sx={{
                display: 'grid',
                gridTemplateColumns: '1.5fr 2fr 1fr',
                alignItems: 'center',
                py: 1,
                cursor: 'pointer',
                '&:hover': { bgcolor: 'rgba(0,0,0,0.02)' }
              }}
            >
              <Typography sx={{ fontSize: 14, px: 1 }}>{org.name}</Typography>
              <Box sx={{ px: 2, display: 'flex', justifyContent: 'center' }}>
                <Box sx={{ width: '100%', borderBottom: "1px solid #CCC", minHeight: 40, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {org.status === 'completed' || org.status === 'officer_cleared' ? (
                    org.signatureUrl ? (
                      <img 
                        src={org.signatureUrl} 
                        alt="Signature" 
                        onClick={(e) => { e.stopPropagation(); setZoomedSignature(org.signatureUrl); }}
                        style={{ maxHeight: '35px', maxWidth: '100%', objectFit: 'contain', cursor: 'pointer' }} 
                      />
                    ) : (
                      <Typography sx={{ fontFamily: 'cursive', fontSize: 18, color: '#1a365d' }}>Signed Digitally</Typography>
                    )
                  ) : (
                    <Typography sx={{ fontSize: 11, color: '#999', letterSpacing: '0.1em' }}>PENDING</Typography>
                  )}
                </Box>
              </Box>
              <Box sx={{ px: 1, borderBottom: "1px solid #CCC", minHeight: 40, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Typography sx={{ fontSize: 13 }}>
                  {org.submittedAt && (org.status === 'completed' || org.status === 'officer_cleared') ? new Date(org.submittedAt).toLocaleDateString() : "—"}
                </Typography>
              </Box>
            </Box>
          ))}
          {/* Empty dynamic space logic removed to allow the form to natively shrink/expand */}
        </Box>

        <Box sx={{ mt: 8, display: 'flex', justifyContent: 'flex-end' }}>
          <Box sx={{ width: 220, textAlign: 'center', position: 'relative' }}>
            {finalClearance?.signatureUrl ? (
              <img 
                src={finalClearance.signatureUrl} 
                alt="Dean Signature" 
                onClick={(e) => { e.stopPropagation(); setZoomedSignature(finalClearance.signatureUrl); }}
                style={{ 
                  position: 'absolute', 
                  bottom: '24px', 
                  left: '50%', 
                  transform: 'translateX(-50%)', 
                  maxHeight: '70px', 
                  maxWidth: '100%',
                  mixBlendMode: 'multiply',
                  zIndex: 1,
                  cursor: 'pointer'
                }} 
              />
            ) : (
              finalClearance?.status === 'approved' && (
                <Typography sx={{ position: 'absolute', bottom: '24px', left: 0, right: 0, fontFamily: 'cursive', fontSize: 18, color: '#10B981', zIndex: 1 }}>Approved by Dean</Typography>
              )
            )}
            <Box sx={{ borderBottom: "1px solid #000", minHeight: 30, display: 'flex', alignItems: 'end', justifyContent: 'center', position: 'relative', zIndex: 2 }} />
            <Typography sx={{ fontSize: 13, fontWeight: 700, mt: 0.5 }}>Dean's Signature</Typography>
          </Box>
        </Box>
      </Paper>

      <Dialog open={!!zoomedSignature} onClose={() => setZoomedSignature(null)} maxWidth="md">
        <Box sx={{ p: 2, display: 'flex', flexDirection: 'column', alignItems: 'center', bgcolor: '#FFF' }}>
          <img src={zoomedSignature || ''} alt="Zoomed Signature" style={{ maxWidth: '100%', maxHeight: '80vh', objectFit: 'contain' }} />
          <Button onClick={() => setZoomedSignature(null)} sx={{ mt: 2, color: '#000', borderColor: '#000', '&:hover': { bgcolor: '#f5f5f5', borderColor: '#000' } }} variant="outlined">Close</Button>
        </Box>
      </Dialog>

      <Box sx={{ mt: 2, display: 'flex', justifyContent: 'center', gap: 2 }}>
        {!readOnly && (
          <Button 
            variant="outlined" 
            disabled={submittingDean || finalClearance !== null}
            onClick={handleSubmitToDean} 
            sx={{ 
              borderRadius: '8px', 
              color: '#000', 
              borderColor: '#000', 
              bgcolor: '#FFF', 
              fontWeight: 700,
              '&:hover': { bgcolor: '#f5f5f5', borderColor: '#000' },
              '&.Mui-disabled': { color: '#000', borderColor: '#000', bgcolor: '#FFF', opacity: 0.7 }
            }}
          >
            {submittingDean ? 'Submitting...' : finalClearance?.status === 'approved' ? 'DEAN APPROVED' : finalClearance ? 'SUBMITTED TO DEAN' : 'SUBMIT TO DEAN'}
          </Button>
        )}
        <Button variant="contained" color="inherit" onClick={() => window.print()} sx={{ bgcolor: '#000', color: '#FFF' }}>Print Clearance Slip</Button>
      </Box>
    </Box>
  );

  const renderDetail = () => (
    <Box>
      <Box sx={{ mb: 4 }}>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate('/student/progress')}
          sx={{ mb: 2, color: COLORS.textSecondary, fontWeight: 700, textTransform: 'none', '&:hover': { bgcolor: 'transparent', color: COLORS.black } }}
        >
          Back to Overview
        </Button>
        <Typography variant="h4" sx={{ fontWeight: 800, mb: 0.5, letterSpacing: '-0.02em', color: COLORS.black }}>
          {orgInfo?.name || "Organization Progress"}
        </Typography>
        <Typography sx={{ color: COLORS.textSecondary, fontWeight: 500 }}>
          Detailed requirement status for {orgInfo?.name}
        </Typography>
      </Box>

      <Paper sx={{ p: 4, borderRadius: "24px", border: "1px solid rgba(0,0,0,0.06)", mb: 4 }}>
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={6} sm={3}>
            <Typography sx={{ color: COLORS.textSecondary, fontSize: 12, fontWeight: 700, textTransform: 'uppercase', mb: 1 }}>Total Requirements</Typography>
            <Typography sx={{ fontWeight: 800, fontSize: 24 }}>{stats.total}</Typography>
          </Grid>
          <Grid item xs={6} sm={3}>
            <Typography sx={{ color: COLORS.textSecondary, fontSize: 12, fontWeight: 700, textTransform: 'uppercase', mb: 1 }}>Approved</Typography>
            <Typography sx={{ fontWeight: 800, fontSize: 24, color: COLORS.teal }}>{stats.approved}</Typography>
          </Grid>
          <Grid item xs={6} sm={3}>
            <Typography sx={{ color: COLORS.textSecondary, fontSize: 12, fontWeight: 700, textTransform: 'uppercase', mb: 1 }}>Pending Review</Typography>
            <Typography sx={{ fontWeight: 800, fontSize: 24, color: COLORS.lavender }}>{stats.pending}</Typography>
          </Grid>
          <Grid item xs={6} sm={3}>
            <Typography sx={{ color: COLORS.textSecondary, fontSize: 12, fontWeight: 700, textTransform: 'uppercase', mb: 1 }}>Requirement Progress</Typography>
            <Box sx={{ mt: 1, backgroundColor: "#F3F4F6", height: 10, borderRadius: 5 }}>
              <Box sx={{ width: `${stats.percent}%`, height: 10, backgroundColor: COLORS.black, borderRadius: 5 }} />
            </Box>
            <Typography sx={{ fontSize: 12, fontWeight: 700, mt: 1, color: COLORS.textSecondary }}>{stats.percent}% Completed</Typography>
          </Grid>
        </Grid>

        <Box sx={{ overflowX: 'auto' }}>
          <Table sx={{ minWidth: 600 }}>
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: 700, color: COLORS.textSecondary, borderBottom: '2px solid' + COLORS.border }}>Requirement</TableCell>
                <TableCell sx={{ fontWeight: 700, color: COLORS.textSecondary, borderBottom: '2px solid' + COLORS.border }}>Status</TableCell>
                <TableCell sx={{ fontWeight: 700, color: COLORS.textSecondary, borderBottom: '2px solid' + COLORS.border }}>Officer Remarks</TableCell>
                <TableCell sx={{ fontWeight: 700, color: COLORS.textSecondary, borderBottom: '2px solid' + COLORS.border }}>Review Date</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {items.map((i, idx) => (
                <TableRow key={i.requirementId || idx} sx={{ '&:last-child td': { border: 0 } }}>
                  <TableCell sx={{ py: 3 }}>
                    <Typography sx={{ fontWeight: 700, fontSize: 15, mb: 0.5 }}>{i.title}</Typography>
                    <Typography sx={{ fontSize: 12, color: COLORS.textSecondary }}>{i.description}</Typography>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={i.status === "approved" ? "Approved" : i.status === "rejected" ? "Rejected" : "Pending"}
                      size="small"
                      sx={{
                        fontWeight: 800, borderRadius: "8px", px: 1, fontSize: 11,
                        bgcolor: i.status === "approved" ? COLORS.teal + '15' : i.status === "rejected" ? COLORS.orange + '15' : "#FEF3C7",
                        color: i.status === "approved" ? "#059669" : i.status === "rejected" ? COLORS.orange : "#B45309"
                      }}
                    />
                  </TableCell>
                  <TableCell sx={{ color: COLORS.textSecondary, fontWeight: 500 }}>{i.notes || "No remarks yet"}</TableCell>
                  <TableCell sx={{ color: COLORS.textSecondary, fontSize: 14 }}>
                    {i.reviewedAt ? new Date(i.reviewedAt).toLocaleDateString() : "—"}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Box>

        {!readOnly && statsRejected > 0 && (
          <Box sx={{ mt: 4, p: 3, bgcolor: COLORS.orange + '08', borderRadius: "16px", border: `1px dashed ${COLORS.orange}40`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Box>
              <Typography sx={{ fontWeight: 800, color: COLORS.orange }}>Requirements Rejected</Typography>
              <Typography sx={{ fontSize: 13, color: COLORS.textSecondary }}>You have {statsRejected} requirement(s) that need your attention.</Typography>
            </Box>
            <Button
              variant="contained"
              disableElevation
              onClick={resubmitAll}
              sx={{ bgcolor: COLORS.orange, borderRadius: '12px', fontWeight: 700, textTransform: 'none', px: 3, '&:hover': { bgcolor: '#f45' } }}
            >
              Resubmit Rejected
            </Button>
          </Box>
        )}
      </Paper>
    </Box>
  );

  if (loading) {
    return (
      <Box sx={{ p: { xs: 2, md: 4 } }}>
        <Skeleton variant="text" width={300} height={60} sx={{ mb: 2 }} />
        <Skeleton variant="rounded" height={200} sx={{ borderRadius: "24px", mb: 4 }} />
        <Grid container spacing={2}>
          {[1, 2, 3].map(i => (
            <Grid item xs={12} sm={4} key={i}>
              <Skeleton variant="rounded" height={100} sx={{ borderRadius: "20px" }} />
            </Grid>
          ))}
        </Grid>
      </Box>
    );
  }

  return (
    <Box sx={{ p: { xs: 2, md: 4, lg: 6 }, minHeight: '100vh', bgcolor: '#FFFFFF', fontFamily: "'Plus Jakarta Sans', 'Inter', sans-serif" }}>
      {isOverview ? renderOverview() : renderDetail()}
    </Box>
  );
}
