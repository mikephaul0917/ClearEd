import { Box, Typography, Container, Grid, useTheme, useMediaQuery, Divider, Drawer, IconButton } from "@mui/material";
import { useNavigate, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import MenuIcon from "@mui/icons-material/Menu";
import { useState, useEffect } from "react";

const C = {
  white: "#FFFFFF",
  black: "#000000",
  gray: "#F9FAFB",
  textHeader: "#0F172A",
  textSub: "#64748B",
  blueAccent: "#B0E0E6",
  fontStack: '"Google Sans", "Product Sans", Roboto, sans-serif',
};

const fadeInUp = {
  initial: { y: 20, opacity: 0 },
  animate: { y: 0, opacity: 1 },
  transition: { duration: 0.6, ease: "easeOut" }
} as const;

export default function ProcessOverviewPage() {
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const navLinks = [
    { label: "How it Works", path: "/how-it-works" },
    { label: "Overview", path: "/overview" },
    { label: "Students", path: "/guides/student" },
    { label: "Institutions", path: "/guides/institution" },
    { label: "Approval", path: "/guides/approval" },
    { label: "Email Policy", path: "/guides/email-policy" },
  ];

  const sections = [
    {
      h: "1. The Digital Clearance Ecosystem",
      p: "E-Clearance is a modern, digital-first framework designed to move institutional workflows away from fragmented paper trails and towards a centralized, immutable digital ledger. Our system focuses on three core pillars: security, transparency, and speed."
    },
    {
      h: "2. Role-Based Stakeholders",
      p: "The platform is built on a precise role-based access control system. Students manage their own clearance paths, Institutional Officers verify requirements, Deans oversee departmental progress, and Super Admins ensure the security and compliance of the entire network."
    },
    {
      h: "3. The End-to-End Workflow",
      p: "From initial institutional requests to the final generation of electronic clearance slips, every step is captured digitally. This ensures that a complete audit trail exists for every approval, providing peace of mind for both the institution and the student body."
    },
    {
      h: "4. Future-Proofing Compliance",
      p: "By standardizing clearance processes into a digital format, we enable institutions to easily audit their records, ensure regulatory compliance, and provide a significantly improved user experience that respects the time and effort of all participants."
    }
  ];

  return (
    <Box sx={{ backgroundColor: C.white, minHeight: "100vh", fontFamily: C.fontStack }}>
      {/* Integrated Header */}
      <Box
        component="header"
        sx={{
          position: "fixed", top: 0, left: 0, right: 0, height: "64px",
          display: "flex", alignItems: "center", justifyContent: "space-between",
          px: { xs: 2.5, md: 8 }, zIndex: 1100,
          backgroundColor: "rgba(255, 255, 255, 0.8)", backdropFilter: "blur(12px)",
          borderBottom: "1px solid rgba(0,0,0,0.05)"
        }}
      >
        <Box 
          onClick={() => navigate("/")} 
          sx={{ display: "flex", alignItems: "center", gap: 1.5, cursor: 'pointer' }}
        >
          <Box sx={{ width: 24, height: 24 }}>
            <img src="/logo/logo.png" alt="Logo" style={{ width: "100%", height: "100%", objectFit: "contain", transform: "scale(2.8)" }} />
          </Box>
          <Typography variant="h6" sx={{ fontWeight: 700, color: C.black, fontSize: "18px", letterSpacing: "-0.02em" }}>ClearEd</Typography>
        </Box>

        {!isMobile ? (
          <Box display="flex" alignItems="center" gap={5}>
            {navLinks.map((link) => (
              <Typography 
                key={link.label}
                onClick={() => navigate(link.path)}
                sx={{ 
                  fontWeight: 600, fontSize: "14px", color: C.black, opacity: 0.6, cursor: "pointer",
                  "&:hover": { opacity: 1 }
                }}
              >
                {link.label}
              </Typography>
            ))}
          </Box>
        ) : (
          <IconButton onClick={() => setMobileOpen(true)}><MenuIcon /></IconButton>
        )}
      </Box>

      {/* Main Content */}
      <Container maxWidth="md" sx={{ pt: 20, pb: 20 }}>
        <motion.div {...fadeInUp}>
          <Typography variant="h1" sx={{ fontSize: { xs: "40px", md: "72px" }, fontWeight: 800, letterSpacing: "-0.04em", mb: 2, color: C.black }}>
            System Overview
          </Typography>
          <Typography sx={{ color: C.textSub, fontSize: "14px", fontWeight: 700, mb: 10, letterSpacing: '0.05em' }}>
            LAST UPDATED: APRIL 20, 2026
          </Typography>

          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {sections.map((sec, i) => (
              <Box key={i}>
                <Typography variant="h5" sx={{ fontWeight: 700, mb: 2, color: C.textHeader, fontSize: '24px' }}>
                  {sec.h}
                </Typography>
                <Typography sx={{ color: C.textSub, fontSize: "16px", lineHeight: 1.8, fontWeight: 450 }}>
                  {sec.p}
                </Typography>
              </Box>
            ))}
          </Box>
        </motion.div>
      </Container>

      {/* Footer */}
      <Box sx={{ bgcolor: "#FFFFFF", py: 10, px: { xs: 4, md: 10 }, borderTop: "1px solid #F1F5F9" }}>
        <Container maxWidth="xl">
          <Grid container spacing={6} justifyContent="space-between">
            <Grid item xs={12} md={4}>
              <Box display="flex" alignItems="center" gap={1.5} mb={3} onClick={() => navigate("/")} sx={{ cursor: 'pointer' }}>
                <img src="/logo/logo.png" alt="Logo" style={{ width: 28, height: 28, objectFit: 'contain', transform: 'scale(2)' }} />
                <Typography variant="h6" sx={{ fontWeight: 800, color: "#000", letterSpacing: "-0.02em" }}>ClearEd</Typography>
              </Box>
              <Typography sx={{ color: "#64748B", fontSize: "14px", lineHeight: 1.6, maxWidth: 320, mb: 4 }}>
                The ultimate digital framework for modern institutional clearance and record management.
              </Typography>
            </Grid>

            <Grid item xs={12} sm={6} md={2}>
              <Typography variant="subtitle2" sx={{ fontWeight: 800, mb: 3, color: "#000", textTransform: 'uppercase', letterSpacing: "0.1em" }}>Guides</Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {navLinks.map(l => (
                  <Typography key={l.label} onClick={() => navigate(l.path)} sx={{ color: "#64748B", fontSize: "14px", cursor: 'pointer', fontWeight: 600, "&:hover": { color: "#000" } }}>{l.label}</Typography>
                ))}
              </Box>
            </Grid>

            <Grid item xs={12} sm={6} md={2}>
              <Typography variant="subtitle2" sx={{ fontWeight: 800, mb: 3, color: "#000", textTransform: 'uppercase', letterSpacing: "0.1em" }}>Legal</Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Typography onClick={() => navigate("/terms")} sx={{ color: "#64748B", fontSize: "14px", cursor: 'pointer', fontWeight: 600 }}>Terms of Service</Typography>
                <Typography onClick={() => navigate("/privacy")} sx={{ color: "#64748B", fontSize: "14px", cursor: 'pointer', fontWeight: 600 }}>Privacy Policy</Typography>
              </Box>
            </Grid>
          </Grid>
          
          <Box sx={{ borderTop: "1px solid #F1F5F9", mt: 10, pt: 4 }}>
            <Typography sx={{ color: "#94A3B8", fontSize: "11px", fontWeight: 700, letterSpacing: '0.05em' }}>© 2026 CLEARED. ALL RIGHTS RESERVED.</Typography>
          </Box>
        </Container>
      </Box>

      {/* Mobile Drawer */}
      <Drawer anchor="left" open={mobileOpen} onClose={() => setMobileOpen(false)}>
        <Box sx={{ width: 280, p: 3 }}>
           <Typography variant="h6" sx={{ fontWeight: 800, mb: 4 }}>ClearEd</Typography>
           <Divider sx={{ mb: 4 }} />
           <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
             {navLinks.map(l => (
                <Typography key={l.label} onClick={() => { navigate(l.path); setMobileOpen(false); }} sx={{ fontWeight: 600, fontSize: "16px", cursor: 'pointer' }}>{l.label}</Typography>
             ))}
           </Box>
        </Box>
      </Drawer>
    </Box>
  );
}
