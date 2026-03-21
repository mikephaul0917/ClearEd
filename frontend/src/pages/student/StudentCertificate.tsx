import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
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

  useEffect(() => {
    (async () => {
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
    })();
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
      
      // Center the receipt inside the A4 page roughly
      const yOffset = 40; 
      // Margin top 40 points
      
      pdf.addImage(imgData, "PNG", 0, yOffset, pdfWidth, pdfHeight);
      pdf.save("Clearance_Receipt.pdf");
    } catch (error) {
      console.error("Error generating PDF", error);
    }
    setDownloading(false);
  };

  if (loading) return null;

  if (!isApproved) {
    return (
      <Box p={4} textAlign="center">
        <Typography variant="h5" sx={{ fontWeight: 600, mb: 2 }}>Clearance Receipt Not Available</Typography>
        <Typography color="text.secondary">Your Clearance Receipt will be available here once the College Dean has approved your final clearance.</Typography>
      </Box>
    );
  }

  return (
    <Box p={4} sx={{ display: "flex", justifyContent: "center", flexDirection: "column", alignItems: "center" }}>
      <style>{`
        @media print {
          body * { visibility: hidden; }
          #receipt, #receipt * { visibility: visible; }
          #receipt { position: absolute; left: 0; top: 0; width: 100%; margin-top: 0 !important; }
        }
      `}</style>
      <Box sx={{ width: "100%", maxWidth: 880, mb: 3 }}>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Typography variant="h4" sx={{ fontWeight: 800 }}>Clearance Receipt</Typography>
          <Box display="flex" gap={2}>
            <Button variant="outlined" onClick={downloadPdf} disabled={downloading} sx={{ borderRadius: '8px', color: '#000', borderColor: '#000', bgcolor: '#FFF', '&:hover': { bgcolor: '#f5f5f5', borderColor: '#000' } }}>
              {downloading ? "Generating..." : "DOWNLOAD PDF"}
            </Button>
            <Button variant="contained" color="inherit" onClick={printReceipt} sx={{ bgcolor: '#000', color: '#FFF', borderRadius: '8px' }}>
              PRINT RECEIPT
            </Button>
          </Box>
        </Box>
      </Box>
      <Box id="receipt" sx={{ width: "100%", maxWidth: 880, p: 6, fontFamily: "Times New Roman, Georgia, serif", backgroundColor: "#FFFFFF", border: "1px solid #000", mt: 2 }}>
        <Box textAlign="center" mb={6}>
          <Typography sx={{ fontWeight: 800, fontSize: 18 }}>HIGHER EDUCATION DEPARTMENT</Typography>
          <Typography sx={{ fontWeight: 800, fontSize: 18, mt: 0.5 }}>STUDENT'S CLEARANCE SLIP</Typography>
        </Box>

        <Box display="flex" justifyContent="flex-end" mb={6}>
          <Box textAlign="center" sx={{ width: 250 }}>
            <Box sx={{ borderBottom: "1px solid #000", minHeight: 24, mb: 0.5 }}>
              <Typography sx={{ fontSize: 16 }}>{new Date().toLocaleDateString()}</Typography>
            </Box>
            <Typography sx={{ fontSize: 14 }}>Date</Typography>
          </Box>
        </Box>

        <Box mt={2} sx={{ lineHeight: 2.2 }}>
          <Typography component="span" sx={{ fontSize: 16 }}>This is to certify that </Typography>
          <Box component="span" sx={{ borderBottom: "1px solid #000", display: "inline-block", minWidth: 280, textAlign: "center", px: 2, mx: 1, verticalAlign: "bottom", lineHeight: 1 }}>
            <Typography component="span" sx={{ fontSize: 16, fontWeight: 600 }}>
              {`${profile.firstName || ""} ${profile.familyName || ""}`.trim() || 
               (localStorage.getItem("user") ? JSON.parse(localStorage.getItem("user")!).fullName : "Student Name")}
            </Typography>
          </Box>
          <Typography component="span" sx={{ fontSize: 16 }}> is cleared of any responsibility from the College of </Typography>
          <Box component="span" sx={{ borderBottom: "1px solid #000", display: "inline-block", minWidth: 200, textAlign: "center", px: 2, mx: 1, verticalAlign: "bottom", lineHeight: 1 }}>
            <Typography component="span" sx={{ fontSize: 16, fontWeight: 600 }}>{profile.course || ""}</Typography>
          </Box>
          <Typography component="span" sx={{ fontSize: 16 }}> for the </Typography>
          <Box component="span" sx={{ borderBottom: "1px solid #000", display: "inline-block", minWidth: 80, textAlign: "center", px: 2, mx: 1, verticalAlign: "bottom", lineHeight: 1 }}>
            <Typography component="span" sx={{ fontSize: 16, fontWeight: 600 }}>{profile.semester || ""}</Typography>
          </Box>
          <Typography component="span" sx={{ fontSize: 16 }}> Semester, Academic Year </Typography>
          <Box component="span" sx={{ borderBottom: "1px solid #000", display: "inline-block", minWidth: 120, textAlign: "center", px: 2, mx: 1, verticalAlign: "bottom", lineHeight: 1 }}>
            <Typography component="span" sx={{ fontSize: 16, fontWeight: 600 }}>{profile.academicYear || ""}</Typography>
          </Box>
          <Typography component="span" sx={{ fontSize: 16 }}>.</Typography>
        </Box>

        <Box mt={12} display="flex" justifyContent="flex-end">
          <Box textAlign="center" sx={{ width: 300, position: 'relative' }}>
            {signatureUrl && (
              <img 
                src={signatureUrl} 
                alt="Dean Signature" 
                style={{ 
                  position: 'absolute', 
                  bottom: '24px', 
                  left: '50%', 
                  transform: 'translateX(-50%)', 
                  maxHeight: '70px', 
                  maxWidth: '100%',
                  mixBlendMode: 'multiply',
                  zIndex: 1
                }} 
              />
            )}
            <Box sx={{ borderBottom: "1px solid #000", minHeight: 24, mb: 0.5, position: "relative", zIndex: 2 }} />
            <Typography sx={{ fontSize: 14 }}>College Dean</Typography>
          </Box>
        </Box>

      </Box>
    </Box>
  );
}
