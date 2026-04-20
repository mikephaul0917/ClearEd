import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import IconButton from "@mui/material/IconButton";
import FullscreenIcon from "@mui/icons-material/Fullscreen";
import CloseIcon from "@mui/icons-material/Close";
import Skeleton from "@mui/material/Skeleton";
import { useEffect, useState, useRef } from "react";
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
  const certRef = useRef<HTMLDivElement>(null);

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

      setTimeout(() => {
        setLoading(false);
      }, 2000);
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
      {/* Vertical/Horizontal Banner */}
      <Box className="banner-strip" sx={{
        width: { xs: "100%", md: 70 },
        height: { xs: 50, md: "auto" },
        bgcolor: "#f59e0b",
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
      <Box sx={{ flex: 1, px: { xs: 2, md: 4 }, pb: 4, pt: 2, display: "flex", flexDirection: "column", alignItems: "center", position: "relative", zIndex: 1, width: "100%" }}>
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
            textTransform: "uppercase",
            fontSize: { xs: '1.5rem', md: '3rem' }
          }}
        >
          {`${profile.firstName || ""} ${profile.familyName || ""}`.trim() ||
            (localStorage.getItem("user") ? JSON.parse(localStorage.getItem("user")!).fullName : "Student Name")}
        </Typography>

        <Typography sx={{ fontSize: { xs: "0.85rem", md: "1rem" }, mb: 4, color: "#475569", textAlign: "center", maxWidth: 500 }}>
          ID: {profile.studentNumber || "N/A"} • {profile.course || "General Student"}
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
          zIndex: 5,
          my: { xs: 2, md: 0 }
        }}>
          <Box sx={{ position: "relative", width: 100, height: 100, transform: { xs: "scale(0.8)", md: "none" } }}>
            <Box sx={{ position: "absolute", inset: 0, borderRadius: "50%", bgcolor: "#f59e0b", border: "4px double white", boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)", display: "flex", alignItems: "center", justifyContent: "center", textAlign: "center", p: 1, zIndex: 2 }}>
              <Typography sx={{ color: "white", fontWeight: 800, fontSize: "0.7rem", textTransform: "uppercase" }}>Pending Clearance</Typography>
            </Box>
            <Box sx={{ position: "absolute", bottom: -15, left: -5, width: 30, height: 50, bgcolor: "#d97706", clipPath: "polygon(0 0, 100% 0, 100% 100%, 50% 80%, 0 100%)", transform: "rotate(15deg)", zIndex: 1 }} />
            <Box sx={{ position: "absolute", bottom: -15, right: -5, width: 30, height: 50, bgcolor: "#d97706", clipPath: "polygon(0 0, 100% 0, 100% 100%, 50% 80%, 0 100%)", transform: "rotate(-15deg)", zIndex: 1 }} />
          </Box>
        </Box>

        <Typography sx={{ fontSize: { xs: "0.95rem", md: "1.1rem" }, textAlign: "center", lineHeight: 1.8, color: "#1e293b", mb: 4, px: 4 }}>
          is cleared of any responsibility from the College of <strong>{profile.college || profile.course || "Education"}</strong> for the
          <strong> {profile.semester || "First"} </strong> Semester, Academic Year <strong> {profile.academicYear || "2025-2026"} </strong>.
        </Typography>
        <Box sx={{ display: "flex", justifyContent: { xs: "center", md: "flex-end" }, width: "100%", mt: { xs: 3, md: "auto" }, pr: { xs: 0, md: 4 } }}>
          <Box sx={{ display: "flex", flexDirection: "column", position: "relative", width: 250 }}>
            <Box sx={{ height: 60, position: "relative", display: "flex", justifyContent: "center", alignItems: "flex-end" }}>
              {signatureUrl ? (
                <img
                  src={signatureUrl}
                  alt="Dean Signature"
                  style={{ maxHeight: "80px", maxWidth: "160px", position: "absolute", bottom: -5, filter: "contrast(1.2)", pointerEvents: "none", userSelect: "none" }}
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

    </>
  );

  const renderSkeleton = () => (
    <Box sx={{
      flex: 1,
      display: "flex",
      flexDirection: { xs: "column", md: "row" },
      minHeight: 600,
      bgcolor: "#F9FAFB",
      position: "relative"
    }}>
      {/* Main Content Skeleton Area */}
      <Box sx={{ flex: 1, p: { xs: 1.5, sm: 2, md: 4 }, pb: 4, pt: 2, display: "flex", flexDirection: "column", alignItems: "center", position: "relative", zIndex: 1, width: "100%" }}>
        <Skeleton width="30%" height={24} sx={{ mb: 2, borderRadius: "4px", bgcolor: "#eaebec" }} />
        <Skeleton
          sx={{
            width: { xs: "60%", md: "50%" },
            height: { xs: 40, md: 80 },
            mb: 1,
            borderRadius: "8px",
            bgcolor: "#eaebec"
          }}
        />
        <Skeleton width="40%" height={32} sx={{ mb: 4, borderRadius: "6px", bgcolor: "#eaebec" }} />

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

        <Skeleton width="85%" height={80} sx={{ mb: 4, borderRadius: "8px", bgcolor: "#eaebec" }} />

        <Box sx={{ display: "flex", justifyContent: { xs: "center", md: "flex-end" }, width: "100%", mt: { xs: 3, md: "auto" }, pr: { xs: 0, md: 4 } }}>
          <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", width: 250 }}>
            <Skeleton variant="rectangular" width="80%" height={60} sx={{ mb: 1, borderRadius: "4px", bgcolor: "#eaebec" }} />
            <Box sx={{ borderBottom: "1.5px solid #eaebec", width: "100%", mb: 0.5 }} />
            <Skeleton width="70%" height={16} sx={{ borderRadius: "2px", bgcolor: "#eaebec" }} />
          </Box>
        </Box>
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
      minHeight: { xs: "auto", md: "100vh" },
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "flex-start",
      overflowX: "hidden",
      mt: 0,
      bgcolor: "#F9FAFB",
      pt: 0,
      pb: 2
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
          #receipt, #receipt * { visibility: visible; }
          #receipt { 
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
          id="receipt"
          ref={certRef}
          sx={{
            position: "relative",
            width: "100%",
            maxWidth: 850,
            minHeight: { xs: "auto", md: 600 },
            bgcolor: "#F9FAFB",
            overflow: "hidden",
            display: "flex",
            flexDirection: { xs: "column", md: "row" },
            boxShadow: { xs: "0 10px 40px rgba(0,0,0,0.1)", md: "none" },
            borderRadius: { xs: "12px", md: "0" }
          }}
        >
          {loading ? renderSkeleton() : renderCertificateContent()}

          {/* Maximize Button - Desktop Only */}
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
            <Skeleton variant="rectangular" sx={{ width: "100%", maxWidth: { sm: 210 }, height: 44, borderRadius: "6px" }} />
            <Skeleton variant="rectangular" sx={{ width: "100%", maxWidth: { sm: 210 }, height: 44, borderRadius: "6px" }} />
          </>
        ) : (
          <>
            <Button
              variant="contained"
              onClick={printReceipt}
              fullWidth
              sx={{
                bgcolor: '#3c4043',
                color: '#FFF',
                borderRadius: '6px',
                fontWeight: 700,
                fontSize: { xs: '0.9rem', sm: '0.95rem' },
                px: 4,
                py: 1.2,
                maxWidth: { sm: 210 },
                textTransform: 'none',
                boxShadow: '0 10px 25px rgba(0,0,0,0.1)',
                '&:hover': { bgcolor: '#3c4043', transform: 'translateY(-1px)', boxShadow: '0 12px 30px rgba(0,0,0,0.15)' },
                transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)'
              }}
            >
              Print Receipt
            </Button>
            <Button
              variant="outlined"
              onClick={downloadPdf}
              disabled={downloading}
              fullWidth
              sx={{
                borderRadius: '6px',
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
              {downloading ? "Downloading..." : "Download PDF"}
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
              bgcolor: "#F9FAFB",
              overflow: "hidden",
              display: "flex",
            }}
          >
            {renderCertificateContent()}
          </Box>
        </Box>
      </Dialog>
    </Box>
  );
}
