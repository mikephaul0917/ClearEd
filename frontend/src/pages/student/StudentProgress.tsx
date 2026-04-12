import { useEffect, useState, useMemo } from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Paper from "@mui/material/Paper";
import RefreshIcon from "@mui/icons-material/Refresh";
import FullscreenIcon from "@mui/icons-material/Fullscreen";
import CloseIcon from "@mui/icons-material/Close";
import IconButton from "@mui/material/IconButton";
import { clearanceService } from "../../services/clearance.service";
import { api } from "../../services";
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
  const [openModal, setOpenModal] = useState(false);
  const [selectedRequirement, setSelectedRequirement] = useState<any>(null);
  const [showMaximized, setShowMaximized] = useState(false);
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
    // Ensure skeleton is visible for a premium feel
    setTimeout(() => {
      setLoading(false);
    }, 2000);
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchData();
    }, 1000);
    return () => clearTimeout(timer);
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
      const filteredItems = items.filter(i => !i.isAnnouncement && i.type !== 'announcement' && i.type !== 'material');
      const approved = filteredItems.filter(i => i.status === "approved").length;
      const total = filteredItems.length;
      return {
        total,
        approved,
        pending: filteredItems.filter(i => i.status === "pending").length,
        rejected: filteredItems.filter(i => i.status === "rejected").length,
        percent: Math.round((approved / (total || 1)) * 100)
      };
    }
  }, [isOverview, myClearances, items]);

  const statsRejected = stats.rejected || 0;

  const resubmitAll = async () => {
    try {
      await clearanceService.resubmitClearance();
      if (!isOverview) {
        fetchData();
      }
    } catch { }
  };

  const handleSubmitToDean = async () => {
    setSubmittingDean(true);
    try {
      await clearanceService.submitToDean();
      alert("Successfully submitted clearance to the Dean!");
      fetchData();
    } catch (err: any) {
      alert(err.response?.data?.message || "Failed to submit clearance to Dean.");
    } finally {
      setSubmittingDean(false);
    }
  };

  const renderCertificateContent = () => (
    <>
      {/* Vertical/Horizontal Banner */}
      <Box className="banner-strip" sx={{
        width: { xs: "100%", md: 70 },
        height: { xs: 50, md: "auto" },
        bgcolor: "#0d9488",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 2,
        position: "relative",
        p: { xs: 1, md: 0 }
      }}>
        <Typography
          className="banner-text"
          sx={{
            color: "white",
            whiteSpace: "nowrap",
            fontSize: { xs: "1.2rem", sm: "1.8rem", md: "2.8rem" },
            fontWeight: 800,
            letterSpacing: { xs: "2px", md: "4px" },
            fontFamily: "'Playfair Display', serif",
            textTransform: "uppercase",
            zIndex: 3,
            width: "max-content",
            userSelect: "none"
          }}
        >
          Clearance
        </Typography>
      </Box>

      {/* Main Content Area */}
      <Box sx={{ flex: 1, p: { xs: 1.5, md: 2 }, display: "flex", flexDirection: "column", alignItems: "center", position: "relative", zIndex: 1, width: "100%" }}>
        <Typography sx={{ fontSize: "1rem", fontStyle: "italic", mb: 2, color: "#475569" }}>
          This is to certify that
        </Typography>

        {(() => {
          const fallbackName = studentInfo?.fullName || (localStorage.getItem("user") ? JSON.parse(localStorage.getItem("user")!)?.fullName : "Student Name");

          let fullName = fallbackName;
          if (profile) {
            const scrub = (s: any) => {
              if (!s) return "";
              const val = String(s).trim();
              return val.toLowerCase() === "undefined" ? "" : val;
            };
            const first = scrub(profile.firstName);
            const last = scrub(profile.familyName);
            const middle = scrub(profile.middleName);

            if (first || last) {
              fullName = `${first} ${middle ? middle + ' ' : ''}${last}`.trim() || fallbackName;
            }
          }

          const nameLength = fullName.length;
          let fontSize = "3rem";
          if (nameLength > 40) fontSize = "1.4rem";
          else if (nameLength > 30) fontSize = "1.6rem";
          else if (nameLength > 20) fontSize = "2.0rem";

          return (
            <Typography
              sx={{
                fontWeight: 800,
                color: "#0d9488",
                mb: 1,
                textAlign: "center",
                fontFamily: "'Lora', serif",
                textTransform: "uppercase",
                fontSize: { xs: `calc(${fontSize} * 0.55)`, md: fontSize },
                maxWidth: 580,
                mx: "auto",
                lineHeight: 1.1,
                transition: "font-size 0.2s ease"
              }}
            >
              {fullName}
            </Typography>
          );
        })()}

        <Typography sx={{ fontSize: { xs: "0.85rem", md: "1rem" }, mb: 2, color: "#475569", textAlign: "center", maxWidth: 500 }}>
          ID: {profile?.studentNumber || "N/A"} • {profile?.course || "General Student"}
        </Typography>

        {/* Badge Overlay - Moved above 'hereby' for mobile */}
        <Box sx={{
          position: { xs: "static", md: "absolute" },
          top: 40,
          right: 40,
          width: { xs: "100%", md: 120 },
          height: { xs: "auto", md: 120 },
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          my: { xs: 2, md: 0 },
          zIndex: 5
        }}>
          <Box sx={{ position: "relative", width: 100, height: 100, transform: { xs: "scale(0.8)", md: "none" } }}>
            <Box sx={{ position: "absolute", inset: 0, borderRadius: "50%", bgcolor: "#94a3b8", border: "4px double white", boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)", display: "flex", alignItems: "center", justifyContent: "center", textAlign: "center", p: 1 }}>
              <Typography sx={{ color: "white", fontWeight: 800, fontSize: "0.7rem", textTransform: "uppercase" }}>Pending Clearance</Typography>
            </Box>
            <Box sx={{ position: "absolute", bottom: -15, left: -5, width: 30, height: 50, bgcolor: "#64748b", clipPath: "polygon(0 0, 100% 0, 100% 100%, 50% 80%, 0 100%)", transform: "rotate(15deg)", zIndex: -1 }} />
            <Box sx={{ position: "absolute", bottom: -15, right: -5, width: 30, height: 50, bgcolor: "#64748b", clipPath: "polygon(0 0, 100% 0, 100% 100%, 50% 80%, 0 100%)", transform: "rotate(-15deg)", zIndex: -1 }} />
          </Box>
        </Box>

        <Typography sx={{ fontSize: { xs: "0.95rem", md: "1.1rem" }, textAlign: "center", lineHeight: 1.6, color: "#1e293b", mt: 2, mb: 2, px: { xs: 1, sm: 4 } }}>
          Is hereby cleared of any responsibilities from his organizations for the Academic Year <strong>{activeTerm?.academicYear || "2025–2026"}</strong>, and is now ready for the Dean’s approval.
        </Typography>

        {/* Signature Section */}
        <Box sx={{ width: "100%", mt: 4 }}>
          <Typography sx={{ fontWeight: 700, fontSize: "0.875rem", letterSpacing: "2px", mb: 3, color: "#64748b", textTransform: "uppercase" }}>
            Verified By
          </Typography>

          <Box sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr", sm: "repeat(2, 1fr)", md: "repeat(3, 1fr)" },
            gap: 2,
            width: "100%",
            mb: 2
          }}>
            {myClearances.map((org) => {
              const isApproved = org.status === 'completed' || org.status === 'officer_cleared';
              return (
                <Box
                  key={org._id}
                  onClick={() => navigate(`/student/progress/${org._id}`)}
                  sx={{ display: "flex", flexDirection: "column", position: "relative", cursor: "pointer" }}
                >
                  <Box sx={{ height: 40, position: "relative", display: "flex", justifyContent: "center", alignItems: "flex-end" }}>
                    {org.signatureUrl && isApproved ? (
                      <img
                        src={org.signatureUrl}
                        alt="Signature"
                        style={{ maxHeight: "60px", maxWidth: "120px", position: "absolute", bottom: -5, filter: "contrast(1.2)" }}
                      />
                    ) : isApproved && (
                      <Typography sx={{ color: "#5EEAD4", fontWeight: 700, fontStyle: "italic", fontSize: "0.75rem" }}>
                        [ DIGITALLY CLEARED ]
                      </Typography>
                    )}
                  </Box>
                  <Box sx={{ borderBottom: "1.5px solid #f1f5f9", mt: 1, mb: 0.5 }} />
                  <Typography sx={{ fontSize: "0.75rem", color: "#475569", fontWeight: 600, textAlign: "center" }}>{org.name}</Typography>
                  {!isApproved && (
                    <Typography sx={{ fontSize: "0.65rem", color: "#ef4444", fontStyle: "italic", textAlign: "center" }}>Pending</Typography>
                  )}
                </Box>
              );
            })}
          </Box>

          {/* Final/Dean Signature Block - Isolated at the bottom/right */}
          <Box sx={{ display: "flex", justifyContent: { xs: "center", md: "flex-end" }, width: "100%", mt: { xs: 3, md: 2 } }}>
            <Box sx={{ display: "flex", flexDirection: "column", position: "relative", width: 250 }}>
              <Box sx={{ height: 40, position: "relative", display: "flex", justifyContent: "center", alignItems: "flex-end" }}>
                {finalClearance?.signatureUrl ? (
                  <img
                    src={finalClearance.signatureUrl}
                    alt="Dean Signature"
                    style={{ maxHeight: "60px", maxWidth: "120px", position: "absolute", bottom: -5, filter: "contrast(1.2)" }}
                  />
                ) : finalClearance?.status === 'approved' && (
                  <Typography sx={{ color: "#5EEAD4", fontWeight: 700, fontStyle: "italic", fontSize: "0.75rem" }}>[ DEAN APPROVED ]</Typography>
                )}
              </Box>
              <Box sx={{ borderBottom: "1.5px solid #0d9488", mt: 1, mb: 0.5 }} />
              <Typography sx={{ fontSize: "0.75rem", color: "#0d9488", fontWeight: 800, textAlign: "center" }}>Dean's Signature</Typography>
            </Box>
          </Box>
        </Box>

      </Box>
    </>
  );

  const renderSkeleton = () => (
    <Box sx={{
      flex: 1,
      display: "flex",
      flexDirection: { xs: "column", md: "row" },
      minHeight: { xs: "auto", md: 600 },
      bgcolor: "#F9FAFB",
      position: "relative"
    }}>
      {/* Left Skeleton Banner */}
      <Skeleton
        variant="rectangular"
        sx={{
          width: { xs: "100%", md: 70 },
          height: { xs: 50, md: "100%" },
          bgcolor: "#eaebec",
          animationDuration: "1.5s",
          display: "flex",
          zIndex: 2
        }}
      />

      {/* Main Content Skeleton Area */}
      <Box sx={{ flex: 1, p: { xs: 1.5, md: 2 }, display: "flex", flexDirection: "column", alignItems: "center", width: "100%" }}>
        <Skeleton width="30%" height={24} sx={{ mb: 2, borderRadius: "4px", bgcolor: "#eaebec" }} />
        <Skeleton width="60%" height={80} sx={{ mb: 1, borderRadius: "8px", bgcolor: "#eaebec" }} />
        <Skeleton width="40%" height={32} sx={{ mb: 2, borderRadius: "6px", bgcolor: "#eaebec" }} />

        {/* Badge Skeleton Placeholder */}
        <Box sx={{
          position: { xs: "static", md: "absolute" },
          top: 40,
          right: 40,
          width: { xs: "100%", md: 120 },
          height: { xs: "auto", md: 120 },
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          my: { xs: 2, md: 0 },
          zIndex: 5
        }}>
          <Skeleton variant="circular" width={100} height={100} sx={{ bgcolor: "#eaebec" }} />
        </Box>

        <Skeleton width="85%" height={60} sx={{ mb: 4, borderRadius: "8px", bgcolor: "#eaebec" }} />

        <Box sx={{ width: "100%", mt: { xs: 3, md: "auto" } }}>
          <Skeleton width="20%" height={20} sx={{ mb: 3, borderRadius: "4px", bgcolor: "#eaebec" }} />
          <Box sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr", sm: "repeat(2, 1fr)", md: "repeat(3, 1fr)" },
            gap: 2,
            width: "100%"
          }}>
            {[1, 2, 3].map((i) => (
              <Box key={i} sx={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                <Box sx={{ height: 40, width: "100%", display: "flex", justifyContent: "center", alignItems: "flex-end" }}>
                  <Skeleton width="60%" height={30} sx={{ borderRadius: "4px", bgcolor: "#eaebec" }} />
                </Box>
                <Box sx={{ borderBottom: "1.5px solid #eaebec", width: "100%", mt: 1, mb: 0.5 }} />
                <Skeleton width="70%" height={16} sx={{ borderRadius: "2px", bgcolor: "#eaebec" }} />
              </Box>
            ))}
          </Box>
        </Box>

        {/* Final/Dean Signature Skeleton */}
        <Box sx={{ display: "flex", justifyContent: { xs: "center", md: "flex-end" }, width: "100%", mt: { xs: 3, md: 2 } }}>
          <Box sx={{ display: "flex", flexDirection: "column", width: 250 }}>
            <Box sx={{ height: 40, display: "flex", justifyContent: "center", alignItems: "flex-end" }}>
              <Skeleton width="50%" height={30} sx={{ borderRadius: "4px", bgcolor: "#eaebec" }} />
            </Box>
            <Box sx={{ borderBottom: "1.5px solid #eaebec", mt: 1, mb: 0.5 }} />
            <Skeleton width="60%" height={20} sx={{ mx: "auto", borderRadius: "2px", bgcolor: "#eaebec" }} />
          </Box>
        </Box>
      </Box>
    </Box>
  );

  const renderOverview = () => (
    <Box sx={{ maxWidth: 850, mx: "auto", pt: { xs: 6, md: 0 }, pb: 4, position: "relative" }}>
      <style>{`
        .banner-text {
          position: relative;
          transform: none;
        }

        @media (min-width: 900px) {
          .banner-strip { flex-direction: column !important; }
          .banner-text {
            position: absolute !important;
            top: 50% !important;
            left: 50% !important;
            transform: translate(-50%, -50%) rotate(-90deg) !important;
          }
        }

        @media print {
          body * { visibility: hidden; }
          #slip, #slip * { visibility: visible; }
          #slip { 
            position: absolute; 
            left: 0; 
            top: 0; 
            width: 100%; 
            height: 100%;
            margin: 0;
            padding: 0;
            display: flex !important;
            flex-direction: row !important;
            -webkit-print-color-adjust: exact;
          }
          .banner-strip { width: 70px !important; height: 100% !important; flex-direction: column !important; }
          .banner-text {
            position: absolute !important;
            top: 50% !important;
            left: 50% !important;
            transform: translate(-50%, -50%) rotate(-90deg) !important;
            font-size: 2.8rem !important;
          }
        }
      `}</style>

      <Paper
        id="slip"
        elevation={0}
        sx={{
          position: "relative",
          mt: 0,
          minHeight: { xs: 400, sm: 600 },
          bgcolor: "#F9FAFB",
          overflow: { xs: "visible", sm: "hidden" },
          display: "flex",
          justifyContent: "center",
          fontFamily: '"Google Sans", "Product Sans", Roboto, sans-serif'
        }}
      >
        <Box sx={{
          width: "100%",
          maxWidth: 850,
          minHeight: { xs: "auto", md: 600 },
          display: "flex",
          flexDirection: { xs: "column", md: "row" },
          position: "relative",
          bgcolor: "#F9FAFB",
          boxShadow: { xs: "0 10px 40px rgba(0,0,0,0.1)", md: "none" },
          borderRadius: { xs: "12px", md: "0" },
          overflow: "hidden",
        }}>
          {renderCertificateContent()}

          {/* Maximize Button - ICON ONLY AS REQUESTED */}
          {!loading && !showMaximized && (
            <IconButton
              onClick={() => setShowMaximized(true)}
              data-html2canvas-ignore
              sx={{
                position: "absolute",
                top: 20,
                right: 20,
                zIndex: 10,
                bgcolor: "rgba(255,255,255,0.7)",
                color: "#000",
                boxShadow: "0 2px 10px rgba(0,0,0,0.1)",
                display: { xs: 'none', md: 'flex' },
                "&:hover": { bgcolor: "rgba(255,255,255,0.9)", transform: "scale(1.1)" },
                transition: "all 0.2s"
              }}
              className="no-print"
            >
              <FullscreenIcon fontSize="large" />
            </IconButton>
          )}
        </Box>
      </Paper>

      <Dialog open={!!zoomedSignature} onClose={() => setZoomedSignature(null)} maxWidth="md">
        <Box sx={{ p: 2, display: 'flex', flexDirection: 'column', alignItems: 'center', bgcolor: '#FFF' }}>
          <img src={zoomedSignature || ''} alt="Zoomed Signature" style={{ maxWidth: '100%', maxHeight: '80vh', objectFit: 'contain' }} />
          <Button onClick={() => setZoomedSignature(null)} sx={{ mt: 2, color: '#000', borderColor: '#000', '&:hover': { bgcolor: '#f5f5f5', borderColor: '#000' } }} variant="outlined">Close</Button>
        </Box>
      </Dialog>

      <Box sx={{
        mt: { xs: 20, sm: 2 },
        display: 'flex',
        justifyContent: 'center',
        gap: 2,
        flexDirection: { xs: 'column', sm: 'row' },
        width: { xs: "100%", sm: "auto" },
        maxWidth: { xs: 400, sm: "none" },
        mx: "auto"
      }}>
        <Button
          variant="contained"
          onClick={() => window.print()}
          fullWidth={window.innerWidth < 640}
          sx={{
            bgcolor: '#000',
            color: '#FFF',
            borderRadius: '100px',
            fontWeight: 700,
            fontSize: { xs: '0.9rem', sm: '0.95rem' },
            px: 4,
            py: 1.2,
            maxWidth: { sm: 210 },
            textTransform: 'none',
            boxShadow: '0 10px 20px rgba(0,0,0,0.1)',
            '&:hover': { bgcolor: '#222', transform: 'translateY(-1px)' },
            transition: 'all 0.2s'
          }}
        >
          Print Clearance Slip
        </Button>
        {!readOnly && (
          <Button
            variant="outlined"
            disabled={submittingDean || finalClearance !== null}
            onClick={handleSubmitToDean}
            sx={{
              borderRadius: '100px',
              color: '#000',
              borderColor: '#E2E8F0',
              bgcolor: '#FFF',
              fontWeight: 700,
              px: 4,
              py: 1.5,
              textTransform: 'none',
              boxShadow: '0 4px 10px rgba(0,0,0,0.05)',
              '&:hover': { bgcolor: '#f9fafb', borderColor: '#CBD5E1', transform: 'translateY(-2px)' },
              '&.Mui-disabled': { color: '#64748B', borderColor: '#E2E8F0', bgcolor: '#FFF', opacity: 0.8 },
              transition: 'all 0.2s'
            }}
          >
            {submittingDean ? 'Submitting...' : finalClearance?.status === 'approved' ? 'Dean Approved' : finalClearance ? 'Submitted to Dean' : 'Submit to Dean'}
          </Button>
        )}
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
            <Box sx={{ mt: 1, backgroundColor: "rgba(176, 224, 230, 0.2)", height: 10, borderRadius: 5 }}>
              <Box sx={{ width: `${stats.percent}%`, height: 10, backgroundColor: "#B0E0E6", borderRadius: 5 }} />
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
      <Box sx={{ mt: 0, pt: 0, px: { xs: 2, md: 4 }, pb: 4, minHeight: '100vh', bgcolor: '#F9FAFB' }}>
        {isOverview ? (
          <Box sx={{ maxWidth: 850, mx: "auto", pt: 0, pb: 4 }}>
            <Paper elevation={0} sx={{ overflow: "hidden", borderRadius: "4px", bgcolor: "#F9FAFB" }}>
              {renderSkeleton()}
            </Paper>
            <Box sx={{
              mt: { xs: 20, sm: 2 },
              display: 'flex',
              justifyContent: 'center',
              gap: 2,
              flexDirection: { xs: 'column', sm: 'row' },
              width: { xs: "100%", sm: "auto" },
              maxWidth: { xs: 400, sm: "none" },
              mx: "auto"
            }}>
              <Skeleton variant="rectangular" sx={{ width: "100%", maxWidth: { sm: 210 }, height: 44, borderRadius: "100px" }} />
              <Skeleton variant="rectangular" sx={{ width: "100%", maxWidth: { sm: 210 }, height: 44, borderRadius: "100px" }} />
            </Box>
          </Box>
        ) : (
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
        )}
      </Box>
    );
  }

  return (
    <Box sx={{ mt: 0, pt: 0, px: { xs: 2, md: 4 }, pb: 4, minHeight: '100vh', bgcolor: '#F9FAFB', fontFamily: '"Google Sans", "Product Sans", Roboto, sans-serif' }}>
      {isOverview ? renderOverview() : renderDetail()}
      {/* Maximized View Dialog */}
      <Dialog
        open={showMaximized}
        onClose={() => setShowMaximized(false)}
        maxWidth="xl"
        fullWidth
        PaperProps={{
          sx: {
            bgcolor: "transparent",
            boxShadow: "none",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            overflow: "visible"
          }
        }}
      >
        {/* Close Button on Maximized View - Fixed position on screen for visibility */}
        <IconButton
          onClick={() => setShowMaximized(false)}
          sx={{
            position: "fixed",
            top: 24,
            right: 24,
            zIndex: 11000,
            bgcolor: "rgba(255,255,255,0.9)",
            color: "#000",
            boxShadow: "0 4px 20px rgba(0,0,0,0.3)",
            "&:hover": { bgcolor: "#fff", transform: "scale(1.1)" },
            transition: "all 0.2s"
          }}
        >
          <CloseIcon fontSize="large" sx={{ fontWeight: 800 }} />
        </IconButton>

        <Box sx={{
          position: "relative",
          transform: { xs: "scale(0.4)", sm: "scale(0.7)", md: "scale(1.1)", lg: "scale(1.3)" },
          transformOrigin: "center"
        }}>
          <Box
            sx={{
              position: "relative",
              width: 850,
              minHeight: 600,
              bgcolor: "#F9FAFB",
              overflow: "hidden",
              display: "flex",
              borderRadius: "8px",
              boxShadow: "0 30px 60px rgba(0,0,0,0.2)"
            }}
          >
            {renderCertificateContent()}
          </Box>
        </Box>
      </Dialog>
    </Box>
  );
}
