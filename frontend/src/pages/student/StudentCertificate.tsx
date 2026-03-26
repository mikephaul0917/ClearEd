import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import IconButton from "@mui/material/IconButton";
import FullscreenIcon from "@mui/icons-material/Fullscreen";
import CloseIcon from "@mui/icons-material/Close";
import Skeleton from "@mui/material/Skeleton";
import { useEffect, useState } from "react";
import { api, clearanceService } from "../../services";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";

export default function StudentCertificate() {
  const [profile, setProfile] = useState<any>({});
  const [isApproved, setIsApproved] = useState(false);
  const [signatureUrl, setSignatureUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);
  const [zoomedSignature, setZoomedSignature] = useState<string | null>(null);
  const [showMaximized, setShowMaximized] = useState(false);

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
        setIsApproved(res.finalClearance?.status === 'approved');
        setSignatureUrl(res.finalClearance?.signatureUrl || null);
      } catch { }

      setLoading(false);
    };

    setTimeout(fetchData, 1000);
  }, []);

  const printReceipt = () => { window.print(); };

  const downloadPdf = async () => {
    const input = document.getElementById("receipt");
    if (!input) return;
    setDownloading(true);
    try {
      const canvas = await html2canvas(input, { scale: 2, useCORS: true });
      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF({ orientation: "portrait", unit: "pt", format: "a4" });
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

      const yOffset = 40;
      pdf.addImage(imgData, "PNG", 0, yOffset, pdfWidth, pdfHeight);
      pdf.save("Clearance_Receipt.pdf");
    } catch (error) {
      console.error("Error generating PDF", error);
    }
    setDownloading(false);
  };

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
        bgcolor: "#f59e0b",
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
      <Box sx={{ flex: 1, p: 4, display: "flex", flexDirection: "column", alignItems: "center", position: "relative", zIndex: 1 }}>
        <Typography sx={{ fontSize: "1rem", fontStyle: "italic", mb: 2, color: "#475569" }}>
          This is to certify that
        </Typography>

        <Typography
          variant="h3"
          sx={{
            fontWeight: 800,
            color: "#f59e0b",
            mb: 1,
            textAlign: "center",
            fontFamily: "'Lora', serif",
            textTransform: "uppercase"
          }}
        >
          {`${profile.firstName || ""} ${profile.familyName || ""}`.trim() ||
            (localStorage.getItem("user") ? JSON.parse(localStorage.getItem("user")!).fullName : "Student Name")}
        </Typography>

        <Typography sx={{ fontSize: "1rem", mb: 4, color: "#475569", textAlign: "center", maxWidth: 500 }}>
          ID: {profile.studentNumber || "N/A"} • {profile.course || "General Student"}
        </Typography>

        <Typography sx={{ fontSize: "1.1rem", textAlign: "center", lineHeight: 1.8, color: "#1e293b", mb: 4, px: 4 }}>
          is cleared of any responsibility from the College of <strong>{profile.college || profile.course || "Education"}</strong> for the
          <strong> {profile.semester || "First"} </strong> Semester, Academic Year <strong> {profile.academicYear || "2025-2026"} </strong>.
        </Typography>        <Box sx={{ display: "flex", justifyContent: "flex-end", width: "100%", mt: "auto", pr: 4 }}>
          <Box sx={{ display: "flex", flexDirection: "column", position: "relative", width: 250 }}>
            <Box sx={{ height: 60, position: "relative", display: "flex", justifyContent: "center", alignItems: "flex-end" }}>
              {signatureUrl ? (
                <img
                  src={signatureUrl}
                  alt="Dean Signature"
                  onClick={() => setZoomedSignature(signatureUrl)}
                  style={{ maxHeight: "80px", maxWidth: "160px", position: "absolute", bottom: -5, filter: "contrast(1.2)", cursor: "pointer" }}
                />
              ) : (
                <Typography sx={{ color: "#10b981", fontWeight: 700, fontStyle: "italic", fontSize: "0.85rem" }}>[ DEAN APPROVED ]</Typography>
              )}
            </Box>
            <Box sx={{ borderBottom: "1.5px solid #f59e0b", mt: 1, mb: 0.5 }} />
            <Typography sx={{ fontSize: "0.85rem", color: "#f59e0b", fontWeight: 800, textAlign: "center", textTransform: "uppercase", letterSpacing: "1px" }}>College Dean</Typography>
          </Box>
        </Box>
      </Box>

      {/* Gold Badge Overlay */}
      <Box sx={{ position: "absolute", top: 40, right: 40, width: 120, height: 120, display: "flex", alignItems: "center", justifyContent: "center", zIndex: 5 }}>
        <Box sx={{ position: "relative", width: 100, height: 100 }}>
          <Box sx={{ position: "absolute", inset: 0, borderRadius: "50%", bgcolor: "#f59e0b", border: "4px double white", boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)", display: "flex", alignItems: "center", justifyContent: "center", textAlign: "center", p: 1, zIndex: 2 }}>
            <Typography sx={{ color: "white", fontWeight: 800, fontSize: "0.7rem", textTransform: "uppercase" }}>Clearance Approved</Typography>
          </Box>
          <Box sx={{ position: "absolute", bottom: -15, left: -5, width: 30, height: 50, bgcolor: "#d97706", clipPath: "polygon(0 0, 100% 0, 100% 100%, 50% 80%, 0 100%)", transform: "rotate(15deg)", zIndex: 1 }} />
          <Box sx={{ position: "absolute", bottom: -15, right: -5, width: 30, height: 50, bgcolor: "#d97706", clipPath: "polygon(0 0, 100% 0, 100% 100%, 50% 80%, 0 100%)", transform: "rotate(-15deg)", zIndex: 1 }} />
        </Box>
      </Box>

      {/* Maximize Button - ICON ONLY */}
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
    </>
  );

  const renderSkeleton = () => (
    <Box sx={{ flex: 1, display: "flex", minHeight: 600, bgcolor: "#fff", position: "relative" }}>

      {/* Main Content Skeleton Area */}
      <Box sx={{ flex: 1, p: 2, display: "flex", flexDirection: "column", alignItems: "center" }}>
        <Skeleton width="30%" height={24} sx={{ mb: 2, borderRadius: "4px" }} />
        <Skeleton width="60%" height={80} sx={{ mb: 0.5, borderRadius: "8px" }} />
        <Skeleton width="40%" height={32} sx={{ mb: 4, borderRadius: "6px" }} />

        <Skeleton width="85%" height={80} sx={{ mb: 4, borderRadius: "8px" }} />

        <Box sx={{ display: "flex", justifyContent: "flex-end", width: "100%", mt: "auto", pr: 4 }}>
          <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", width: 250 }}>
            <Skeleton variant="rectangular" width="80%" height={60} sx={{ mb: 1, borderRadius: "4px" }} />
            <Box sx={{ borderBottom: "1.5px solid #f1f5f9", width: "100%", mb: 0.5 }} />
            <Skeleton width="70%" height={16} sx={{ borderRadius: "2px" }} />
          </Box>
        </Box>
      </Box>

      {/* Badge Skeleton Placeholder */}
      <Box sx={{ position: "absolute", top: 40, right: 40 }}>
        <Skeleton variant="circular" width={100} height={100} />
      </Box>
    </Box>
  );


  if (!isApproved && !loading) {
    return (
      <Box p={4} textAlign="center">
        <Typography variant="h5" sx={{ fontWeight: 600, mb: 2 }}>Clearance Receipt Not Available</Typography>
        <Typography color="text.secondary">Your Clearance Receipt will be available here once the College Dean has approved your final clearance.</Typography>
      </Box>
    );
  }

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
      pt: 2,
      pb: 4
    }}>
      <style>{`
        body { overflow: hidden !important; }
        main { overflow: hidden !important; height: 100vh !important; }

        @media print {
          body { overflow: visible !important; }
          main { overflow: visible !important; height: auto !important; }
          body * { visibility: hidden; }
          #receipt, #receipt * { visibility: visible; }
          #receipt { 
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

      <Box sx={{ width: "100%", maxWidth: 850, position: "relative", mt: 0 }}>
        <Box
          id="receipt"
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
        </Box>
      </Box>

      {/* Action Buttons at the Bottom */}
      <Box sx={{ mt: 3, display: 'flex', justifyContent: 'center', gap: 2 }} className="no-print">
        {loading ? (
          <>
            <Skeleton variant="rectangular" width={180} height={40} sx={{ borderRadius: '8px' }} />
            <Skeleton variant="rectangular" width={180} height={40} sx={{ borderRadius: '8px' }} />
          </>
        ) : (
          <>
            <Button
              variant="outlined"
              onClick={downloadPdf}
              disabled={downloading}
              sx={{
                borderRadius: '8px',
                color: '#000',
                borderColor: '#000',
                bgcolor: '#FFF',
                fontWeight: 700,
                px: 3,
                '&:hover': { bgcolor: '#f5f5f5', borderColor: '#000' }
              }}
            >
              {downloading ? "DOWNLOADING..." : "DOWNLOAD PDF"}
            </Button>
            <Button
              variant="contained"
              onClick={printReceipt}
              sx={{ bgcolor: '#000', color: '#FFF', borderRadius: '8px', fontWeight: 700, px: 3, '&:hover': { bgcolor: '#222' } }}
            >
              PRINT RECEIPT
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

        <Box sx={{ position: "relative", transform: "scale(1.2)", transformOrigin: "center" }}>
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
