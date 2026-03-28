import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import IconButton from "@mui/material/IconButton";
import FullscreenIcon from "@mui/icons-material/Fullscreen";
import CloseIcon from "@mui/icons-material/Close";
import Skeleton from "@mui/material/Skeleton";
import { useEffect, useMemo, useState } from "react";
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
      setLoading(false);
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
      {/* Subtle Pattern Background Overlay */}
      <Box sx={{
        position: "absolute",
        inset: 0,
        opacity: 0.05,
        pointerEvents: "none",
        background: "radial-gradient(#000 0.5px, transparent 0.5px)",
        backgroundSize: "20px 20px"
      }} />

      {/* Left Vertical Banner */}
      <Box sx={{
        width: 70,
        bgcolor: "#0d9488",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 2,
        position: "relative"
      }}>
        <Typography
          sx={{
            color: "white",
            whiteSpace: "nowrap",
            fontSize: "2.8rem",
            fontWeight: 800,
            letterSpacing: "4px",
            fontFamily: "'Playfair Display', serif",
            textTransform: "uppercase",
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%) rotate(-90deg)",
            zIndex: 3,
            width: "max-content",
            userSelect: "none"
          }}
        >
          Certificate
        </Typography>
      </Box>

      {/* Main Content Area */}
      <Box sx={{ flex: 1, p: 2, display: "flex", flexDirection: "column", alignItems: "center", position: "relative", zIndex: 1 }}>
        <Typography sx={{ fontSize: "1rem", fontStyle: "italic", mb: 2, color: "#475569" }}>
          This is to certify that
        </Typography>

        <Typography
          variant="h3"
          sx={{
            fontWeight: 800,
            color: "#0d9488",
            mb: 1,
            textAlign: "center",
            fontFamily: "'Lora', serif",
            textTransform: "uppercase"
          }}
        >
          {profile.firstName || ""} {profile.familyName || ""}
        </Typography>

        <Typography sx={{ fontSize: "1rem", mb: 2, color: "#475569", textAlign: "center", maxWidth: 500 }}>
          {profile.studentNumber || "N/A"} • {profile.course || "General Student"}
        </Typography>

        <Typography sx={{ fontSize: "1.1rem", textAlign: "center", lineHeight: 1.6, color: "#1e293b", mt: 2, mb: 2, px: 4 }}>
          Is hereby cleared of any responsibilities from his organizations for the Academic Year <strong>{aySem.ay || "2025-2026"}</strong>, and is now ready for the Dean’s approval.
        </Typography>

        <Box sx={{ width: "100%", mt: "auto" }}>
          <Typography sx={{ fontWeight: 700, fontSize: "0.875rem", letterSpacing: "2px", mb: 3, color: "#64748b", textTransform: "uppercase" }}>
            Verified By
          </Typography>

          <Box sx={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 2, width: "100%" }}>
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
                      <Typography sx={{ color: "#10b981", fontWeight: 700, fontStyle: "italic", fontSize: "0.75rem" }}>
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

        <Box sx={{ display: "flex", justifyContent: "flex-end", width: "100%", mt: 2 }}>
          <Box sx={{ display: "flex", flexDirection: "column", position: "relative", width: 250 }}>
            <Box sx={{ height: 40, position: "relative", display: "flex", justifyContent: "center", alignItems: "flex-end" }}>
              {finalClearance?.signatureUrl ? (
                <img
                  src={finalClearance.signatureUrl}
                  alt="Dean Signature"
                  onClick={() => setZoomedSignature(finalClearance.signatureUrl)}
                  style={{ maxHeight: "60px", maxWidth: "120px", position: "absolute", bottom: -5, filter: "contrast(1.2)", cursor: "pointer" }}
                />
              ) : finalClearance?.status === "approved" && (
                <Typography sx={{ color: "#10b981", fontWeight: 700, fontStyle: "italic", fontSize: "0.75rem" }}>[ DEAN APPROVED ]</Typography>
              )}
            </Box>
            <Box sx={{ borderBottom: "1.5px solid #0d9488", mt: 1, mb: 0.5 }} />
            <Typography sx={{ fontSize: "0.75rem", color: "#0d9488", fontWeight: 800, textAlign: "center" }}>Dean's Signature</Typography>
          </Box>
        </Box>
      </Box>

      {/* Badge Overlay */}
      <Box sx={{ position: "absolute", top: 40, right: 40, width: 120, height: 120, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <Box sx={{ position: "relative", width: 100, height: 100 }}>
          <Box sx={{ position: "absolute", inset: 0, borderRadius: "50%", bgcolor: "#94a3b8", border: "4px double white", boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)", display: "flex", alignItems: "center", justifyContent: "center", textAlign: "center", p: 1 }}>
            <Typography sx={{ color: "white", fontWeight: 800, fontSize: "0.7rem", textTransform: "uppercase" }}>Pending Clearance</Typography>
          </Box>
          <Box sx={{ position: "absolute", bottom: -15, left: -5, width: 30, height: 50, bgcolor: "#64748b", clipPath: "polygon(0 0, 100% 0, 100% 100%, 50% 80%, 0 100%)", transform: "rotate(15deg)", zIndex: -1 }} />
          <Box sx={{ position: "absolute", bottom: -15, right: -5, width: 30, height: 50, bgcolor: "#64748b", clipPath: "polygon(0 0, 100% 0, 100% 100%, 50% 80%, 0 100%)", transform: "rotate(-15deg)", zIndex: -1 }} />
        </Box>
      </Box>
    </>
  );
  
  const renderSkeleton = () => (
    <Box sx={{ flex: 1, display: "flex", minHeight: 600, bgcolor: "#fff", position: "relative" }}>
      {/* Left Skeleton Banner */}
      <Skeleton 
        variant="rectangular" 
        width={70} 
        height="100%" 
        sx={{ bgcolor: "#f1f5f9", animationDuration: "1.5s" }} 
      />
      
      {/* Main Content Skeleton Area */}
      <Box sx={{ flex: 1, p: 2, display: "flex", flexDirection: "column", alignItems: "center" }}>
        <Skeleton width="30%" height={24} sx={{ mb: 2, borderRadius: "4px" }} />
        <Skeleton width="60%" height={80} sx={{ mb: 0.5, borderRadius: "8px" }} />
        <Skeleton width="40%" height={32} sx={{ mb: 2, borderRadius: "6px" }} />
        
        <Skeleton width="85%" height={80} sx={{ mb: 2, borderRadius: "8px" }} />
        
        <Box sx={{ width: "100%", mt: "auto" }}>
          <Skeleton width="20%" height={20} sx={{ mb: 1.5, borderRadius: "4px" }} />
          <Box sx={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 2, width: "100%" }}>
            {[1, 2, 3].map((i) => (
              <Box key={i} sx={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                <Skeleton variant="rectangular" width="80%" height={40} sx={{ mb: 1, borderRadius: "4px" }} />
                <Box sx={{ borderBottom: "1.5px solid #f1f5f9", width: "100%", mb: 0.5 }} />
                <Skeleton width="70%" height={16} sx={{ borderRadius: "2px" }} />
              </Box>
            ))}
          </Box>
        </Box>
      </Box>

      {/* Badge Skeleton Placeholder */}
      <Box sx={{ position: "absolute", top: 40, right: 40 }}>
        <Skeleton variant="circular" width={100} height={100} />
      </Box>
    </Box>
  );

  return (
    <Box sx={{
      position: "relative",
      flex: 1,
      minHeight: "100vh",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "flex-start",
      overflow: "auto",
      pt: 0,
      pb: 4
    }}>
      <style>{`
        body { overflow: hidden !important; }
        main { overflow: hidden !important; height: 100vh !important; }

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
            -webkit-print-color-adjust: exact;
          }
        }
      `}</style>

      {/* Standard View */}
      <Box sx={{ width: "100%", maxWidth: 850, position: "relative", mt: -4 }}>
        <Box
          id="slip"
          sx={{
            position: "relative",
            width: 850,
            minHeight: 600,
            bgcolor: "#fff",
            borderRadius: "4px",
            boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)",
            overflow: "hidden",
            display: "flex",
            border: "12px solid #fff",
            outline: "1px solid #e2e8f0"
          }}
        >
          {loading ? renderSkeleton() : renderCertificateContent()}

          {/* Maximize Button - ICON ONLY AS REQUESTED */}
          {!showMaximized && (
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

      {/* Bottom Button Group */}
      <Box sx={{ mt: 1, display: 'flex', justifyContent: 'center', gap: 2 }} className="no-print">
        {loading ? (
          <>
            <Skeleton variant="rectangular" width={180} height={40} sx={{ borderRadius: '8px' }} />
            <Skeleton variant="rectangular" width={180} height={40} sx={{ borderRadius: '8px' }} />
          </>
        ) : (
          <>
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
            <Button
              variant="contained"
              onClick={printSlip}
              sx={{ bgcolor: '#000', color: '#FFF', borderRadius: '8px', fontWeight: 700, px: 3, '&:hover': { bgcolor: '#222' } }}
            >
              Print Clearance Slip
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

        <Box sx={{ position: "relative", transform: "scale(1.3)", transformOrigin: "center" }}>
          {/* We repeat the slip content here but scaled up. 
              The transform property makes it 30% larger as requested. */}
          <Box
            sx={{
              position: "relative",
              width: 850,
              minHeight: 600,
              bgcolor: "#fff",
              borderRadius: "4px",
              boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)",
              overflow: "hidden",
              display: "flex",
              border: "12px solid #fff",
              outline: "1px solid #e2e8f0"
            }}
          >
            {renderCertificateContent()}
          </Box>
        </Box>
      </Dialog>
    </Box>
  );
}
