import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import IconButton from "@mui/material/IconButton";
import FullscreenIcon from "@mui/icons-material/Fullscreen";
import CloseIcon from "@mui/icons-material/Close";
import Skeleton from "@mui/material/Skeleton";
import { useEffect, useMemo, useState, useRef } from "react";
import { api, clearanceService } from '../../services';

type DeptStatus = {
  name: string;
  status: "pending" | "in_progress" | "not_started" | "approved" | "rejected" | "completed" | "officer_cleared" | "Pending" | "Approved" | "Rejected";
  updatedAt?: string;
  signatureUrl?: string;
  submittedAt?: string;
};



export default function StudentClearanceSlip() {
  const [profile, setProfile] = useState<any>({});
  const [timeline, setTimeline] = useState<DeptStatus[]>([]);
  const [finalClearance, setFinalClearance] = useState<any>(null);
  const slipRef = useRef<HTMLDivElement>(null);
  const [submittingDean, setSubmittingDean] = useState(false);
  const [zoomedSignature, setZoomedSignature] = useState<string | null>(null);
  const [showMaximized, setShowMaximized] = useState(false);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    const fetchData = async () => {
      try {
        const p = await api.get("/student/profile");
        setProfile(p.data || {});
      } catch {
        try { setProfile(JSON.parse(localStorage.getItem("studentProfile") || "{}")); } catch { }
      }
      try {
        const res = await clearanceService.getMyClearances();
        setTimeline(res.organizations || []);
        setFinalClearance(res.finalClearance || null);
      } catch {
        setTimeline([]);
        setFinalClearance(null);
      }
      setTimeout(() => {
      setLoading(false);
    }, 2000);
    };

    setTimeout(fetchData, 1000);
  }, []);



  const aySem = useMemo(() => {
    const sem = profile.semester || "2nd";
    const ay = profile.academicYear || "";
    return { sem, ay };
  }, [profile.semester, profile.academicYear]);

  const handleSubmitToDean = async () => {
    setSubmittingDean(true);
    try {
      await clearanceService.submitToDean();
      alert("Successfully submitted clearance to the Dean!");
      // Refresh timeline/finalClearance
      const res = await clearanceService.getMyClearances();
      setTimeline(res.organizations || []);
      setFinalClearance(res.finalClearance || null);
    } catch (err: any) {
      alert(err.response?.data?.message || "Failed to submit clearance to Dean.");
    } finally {
      setSubmittingDean(false);
    }
  };

  const printSlip = () => { window.print(); };

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
      <Box sx={{ flex: 1, p: { xs: 1.5, sm: 2, md: 2 }, display: "flex", flexDirection: "column", alignItems: "center", position: "relative", zIndex: 1, width: "100%" }}>
        <Typography sx={{ fontSize: "1rem", fontStyle: "italic", mb: 2, color: "#475569" }}>
          This is to certify that
        </Typography>

        {(() => {
          const fullName = `${profile.firstName || ""} ${profile.familyName || ""}`.trim();
          const nameLength = fullName.length;
          let fontSize = "3rem"; // Default h3-like size

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
              {fullName || "Student Name"}
            </Typography>
          );
        })()}

        <Typography sx={{ fontSize: { xs: "0.85rem", md: "1rem" }, mb: 1, color: "#475569", textAlign: "center", maxWidth: 500 }}>
          {profile.studentNumber || "N/A"} • {profile.course || "General Student"}
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

        <Typography sx={{ fontSize: { xs: "0.95rem", md: "1.1rem" }, textAlign: "center", lineHeight: 1.6, color: "#1e293b", mt: 1, mb: 2, px: 4 }}>
          Is hereby cleared of any responsibilities from his organizations for the Academic Year <strong>{aySem.ay || "2025-2026"}</strong>, and is now ready for the Dean’s approval.
        </Typography>

        <Box sx={{ width: "100%", mt: { xs: 3, md: "auto" } }}>
          <Typography sx={{ fontWeight: 700, fontSize: "0.875rem", letterSpacing: "2px", mb: 3, color: "#64748b", textTransform: "uppercase" }}>
            Verified By
          </Typography>

          <Box sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr", sm: "repeat(2, 1fr)", md: "repeat(3, 1fr)" },
            gap: { xs: 3, md: 2 },
            width: "100%"
          }}>
            {timeline.map((it: any) => {
              const isApproved = it?.status === "completed" || it?.status === "officer_cleared";
              return (
                <Box key={it.name} sx={{ display: "flex", flexDirection: "column", position: "relative" }}>
                  <Box sx={{ height: 40, position: "relative", display: "flex", justifyContent: "center", alignItems: "flex-end" }}>
                    {it?.signatureUrl && isApproved ? (
                      <img
                        src={it.signatureUrl}
                        alt="Signature"
                        onClick={() => setZoomedSignature(it.signatureUrl!)}
                        style={{ maxHeight: "60px", maxWidth: "120px", position: "absolute", bottom: -5, filter: "contrast(1.2)", cursor: "pointer" }}
                      />
                    ) : isApproved && (
                      <Typography sx={{ color: "#5EEAD4", fontWeight: 700, fontStyle: "italic", fontSize: "0.75rem" }}>
                        [ DIGITALLY CLEARED ]
                      </Typography>
                    )}
                  </Box>
                  <Box sx={{ borderBottom: "1.5px solid #cbd5e1", mt: 1, mb: 0.5 }} />
                  <Typography sx={{ fontSize: "0.75rem", color: "#475569", fontWeight: 600, textAlign: "center" }}>{it.name}</Typography>
                  {!isApproved && (
                    <Typography sx={{ fontSize: "0.65rem", color: "#ef4444", fontStyle: "italic", textAlign: "center" }}>Pending Approval</Typography>
                  )}
                </Box>
              );
            })}
          </Box>
        </Box>

        <Box sx={{ display: "flex", justifyContent: "flex-end", width: "100%", mt: { xs: 3, md: "auto" } }}>
          <Box sx={{ display: "flex", flexDirection: "column", position: "relative", width: 250 }}>
            <Box sx={{ height: 40, position: "relative", display: "flex", justifyContent: "center", alignItems: "flex-end" }}>
              {finalClearance?.signatureUrl ? (
                <img
                  src={finalClearance.signatureUrl}
                  alt="Final Signature"
                  onClick={() => setZoomedSignature(finalClearance.signatureUrl)}
                  style={{ maxHeight: "70px", maxWidth: "160px", position: "absolute", bottom: -5, filter: "contrast(1.2)", cursor: "pointer" }}
                />
              ) : (
                <Typography sx={{ color: "#0d9488", fontWeight: 700, fontStyle: "italic", fontSize: "0.85rem" }}>
                  [ {finalClearance?.status === 'approved' ? 'DEAN APPROVED' : 'PENDING'} ]
                </Typography>
              )}
            </Box>
            <Box sx={{ borderBottom: "1.5px solid #0d9488", mt: 1, mb: 0.5 }} />
            <Typography sx={{ fontSize: "0.85rem", color: "#0d9488", fontWeight: 800, textAlign: "center", textTransform: "uppercase", letterSpacing: "1px" }}>College Dean</Typography>
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
      <Box sx={{ flex: 1, p: { xs: 1.5, sm: 2, md: 2 }, display: "flex", flexDirection: "column", alignItems: "center", width: "100%" }}>
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
            gap: { xs: 3, md: 2 },
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

        {/* Dean Signature Skeleton */}
        <Box sx={{ display: "flex", justifyContent: "flex-end", width: "100%", mt: { xs: 3, md: "auto" } }}>
          <Box sx={{ display: "flex", flexDirection: "column", width: 250 }}>
            <Box sx={{ height: 40, display: "flex", justifyContent: "center", alignItems: "flex-end" }}>
              <Skeleton width="50%" height={30} sx={{ borderRadius: "4px", bgcolor: "#eaebec" }} />
            </Box>
            <Box sx={{ borderBottom: "1.5px solid #eaebec", width: "100%", mt: 1, mb: 0.5 }} />
            <Skeleton width="60%" height={20} sx={{ mx: "auto", borderRadius: "2px", bgcolor: "#eaebec" }} />
          </Box>
        </Box>
      </Box>
    </Box>
  );

  return (
    <Box sx={{
      position: "relative",
      flex: 1,
      minHeight: { xs: "auto", md: "100vh" },
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "flex-start",
      mt: 0,
      bgcolor: "#F9FAFB",
      pt: 0,
      pb: 2,
      px: { xs: 0, md: 0 }
    }}>
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
          body { overflow: visible !important; }
          main { overflow: visible !important; height: auto !important; }
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

      {/* Fluid View Container */}
      <Box sx={{
        width: "100%",
        maxWidth: 850,
        position: "relative",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "flex-start",
        overflow: "visible",
        mt: 0,
        mb: 0,
        px: { xs: 1.5, sm: 2, md: 0 }
      }}>
        <Box
          id="slip"
          ref={slipRef}
          sx={{
            position: "relative",
            width: "100%",
            maxWidth: 850,
            minHeight: { xs: "auto", md: 600 },
            bgcolor: "#F9FAFB",
            display: "flex",
            flexDirection: { xs: "column", md: "row" },
            boxShadow: { xs: "0 10px 40px rgba(0,0,0,0.1)", md: "none" },
            borderRadius: { xs: "12px", md: "0" },
            overflow: "hidden",
          }}
        >
          {loading ? renderSkeleton() : renderCertificateContent()}

          {/* Maximize Button - Desktop Only */}
          {/* Maximize Button - Desktop Only */}
          {!loading && !showMaximized && (
            <IconButton
              onClick={() => setShowMaximized(true)}
              data-html2canvas-ignore
              sx={{
                position: "absolute",
                top: 20,
                right: 20,
                zIndex: 9999,
                bgcolor: "rgba(255,255,255,0.7)",
                color: "#000",
                boxShadow: "0 2px 10px rgba(0,0,0,0.1)",
                display: { xs: 'none', sm: 'none', md: 'flex' },
                "&:hover": { bgcolor: "rgba(255,255,255,0.9)", transform: "scale(1.1)" },
                transition: "all 0.2s"
              }}
              className="no-print"
            >
              <FullscreenIcon fontSize="large" />
            </IconButton>
          )}
        </Box>
      </Box>

      {/* Action Buttons - OUTSIDE the scaling container */}
      <Box
        data-html2canvas-ignore
        className="no-print"
        sx={{
          mt: 4,
          display: 'flex',
          justifyContent: 'center',
          gap: { xs: 1.5, sm: 2 },
          width: "100%",
          px: { xs: 2, sm: 3 },
          flexDirection: { xs: 'column', sm: 'row' },
          alignItems: 'center'
        }}
      >
        {loading ? (
          <>
            <Skeleton variant="rectangular" sx={{ width: "100%", maxWidth: { sm: 210 }, height: 44, borderRadius: "100px" }} />
            <Skeleton variant="rectangular" sx={{ width: "100%", maxWidth: { sm: 210 }, height: 44, borderRadius: "100px" }} />
          </>
        ) : (
          <>
            <Button
              variant="contained"
              onClick={printSlip}
              fullWidth
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
                boxShadow: '0 10px 25px rgba(0,0,0,0.1)',
                '&:hover': { bgcolor: '#222', transform: 'translateY(-1px)', boxShadow: '0 12px 30px rgba(0,0,0,0.15)' },
                transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)'
              }}
            >
              Print Clearance Slip
            </Button>
            <Button
              variant="outlined"
              disabled={submittingDean || finalClearance !== null}
              onClick={handleSubmitToDean}
              fullWidth
              sx={{
                borderRadius: '100px',
                color: '#000',
                borderColor: '#E2E8F0',
                bgcolor: '#FFF',
                fontWeight: 700,
                fontSize: { xs: '0.9rem', sm: '0.95rem' },
                px: 4,
                py: 1.2,
                maxWidth: { sm: 210 },
                textTransform: 'none',
                boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
                '&:hover': { bgcolor: '#f9fafb', borderColor: '#CBD5E1', transform: 'translateY(-1px)', boxShadow: '0 6px 16px rgba(0,0,0,0.08)' },
                '&.Mui-disabled': { color: '#94A3B8', borderColor: '#F1F5F9', bgcolor: '#F8FAFC', opacity: 0.8 },
                transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)'
              }}
            >
              {submittingDean ? 'Submitting...' : finalClearance?.status === 'approved' ? 'Dean Approved' : finalClearance ? 'Submitted to Dean' : 'Submit to Dean'}
            </Button>
          </>
        )}
      </Box>

      {/* Zoomed Signature Dialog */}
      <Dialog open={!!zoomedSignature} onClose={() => setZoomedSignature(null)} maxWidth="md">
        <Box sx={{ p: 2, display: 'flex', flexDirection: 'column', alignItems: 'center', bgcolor: '#FFF' }}>
          <img src={zoomedSignature || ''} alt="Zoomed Signature" style={{ maxWidth: '100%', maxHeight: '80vh', objectFit: 'contain' }} />
          <Button
            onClick={() => setZoomedSignature(null)}
            sx={{ mt: 2, color: '#000', borderColor: '#000', '&:hover': { bgcolor: '#f5f5f5', borderColor: '#000' } }}
            variant="outlined"
          >
            Close
          </Button>
        </Box>
      </Dialog>

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
          transform: { xs: "scale(0.4)", sm: "scale(0.7)", md: "scale(1)", lg: "scale(1.3)" },
          transformOrigin: "center"
        }}>
          {/* We repeat the slip content here but scaled up. 
              The transform property makes it 30% larger as requested on desktop. */}

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
