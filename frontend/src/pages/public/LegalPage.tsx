import { Box, Typography, Container, IconButton, Drawer, Divider, useTheme, useMediaQuery, Grid } from "@mui/material";
import { useNavigate, useLocation } from "react-router-dom";
import { motion, LayoutGroup } from "framer-motion";
import MenuIcon from "@mui/icons-material/Menu";
import { useState, useEffect } from "react";

const C = {
  white: "#FFFFFF",
  black: "#000000",
  gray: "#F9FAFB",
  textHeader: "#0F172A",
  textSub: "#64748B",
  blueAccent: "#B0E0E6",
  fontStack: "'Inter', 'Plus Jakarta Sans', system-ui, sans-serif",
};

const fadeInUp = {
  initial: { y: 20, opacity: 0 },
  animate: { y: 0, opacity: 1 },
  transition: { duration: 0.6, ease: "easeOut" }
} as const;

/* ---------------- Icons (Sidebar Style) ---------------- */
function IconBase({ children, color }: any) {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      {children}
    </svg>
  );
}

const QuestionSIcon = ({ color }: any) => <IconBase color={color}><circle cx="12" cy="12" r="10" /><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" /><line x1="12" y1="17" x2="12.01" y2="17" /></IconBase>;
const InfoSIcon = ({ color }: any) => <IconBase color={color}><circle cx="12" cy="12" r="10" /><line x1="12" y1="16" x2="12" y2="12" /><line x1="12" y1="8" x2="12.01" y2="8" /></IconBase>;
const LoginSIcon = ({ color }: any) => <IconBase color={color}><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" /><polyline points="10 17 15 12 10 7" /><line x1="15" y1="12" x2="3" y2="12" /></IconBase>;

export default function LegalPage() {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const [mobileOpen, setMobileOpen] = useState(false);

  const type = pathname.substring(1); // 'terms', 'privacy', or 'cookies'

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  const navLinks = [
    { label: "How it Works", id: "how-it-works", icon: QuestionSIcon },
    { label: "About us", id: "about", icon: InfoSIcon },
    { label: "Login", path: "/login", icon: LoginSIcon },
  ];

  const handleNav = (link: { id?: string, path?: string }) => {
    if (link.id) {
      navigate(`/#${link.id}`);
    } else if (link.path) {
      navigate(link.path);
    }
  };

  const getContent = () => {
    switch (type) {
      case "terms":
        return {
          title: "Terms of Service",
          updated: "March 31, 2026",
          sections: [
            { h: "1. Acceptance of Terms", p: "By accessing and using ClearEd, you agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use our services." },
            { h: "2. Description of Service", p: "ClearEd is a digital clearance and record management platform for institutional use. We provide tools for processing, managing, and verifying academic and administrative clearances." },
            { h: "3. User Conduct", p: "Users are responsible for maintaining the confidentiality of their accounts and for all activities that occur under their accounts. You agree to provide accurate and complete information." },
            { h: "4. Intellectual Property", p: "All content, software, and designs on ClearEd are the intellectual property of our team and protected by applicable copyright laws." },
          ]
        };
      case "privacy":
        return {
          title: "Privacy Policy",
          updated: "March 31, 2026",
          sections: [
            { h: "1. Data Collection", p: "We collect information necessary to provide institutional clearance services, including names, institutional IDs, and academic records provided by your institution." },
            { h: "2. Use of Information", p: "Your data is used solely for processing clearances and maintaining institutional records. We do not sell or share your data with third parties for marketing purposes." },
            { h: "3. Data Security", p: "We implement robust security measures to protect your information from unauthorized access, alteration, or destruction." },
            { h: "4. Your Rights", p: "You have the right to access, correct, or request the deletion of your personal data, subject to institutional record-keeping policies." },
          ]
        };
      case "cookies":
        return {
          title: "Cookie Policy",
          updated: "March 31, 2026",
          sections: [
            { h: "1. What are Cookies?", p: "Cookies are small text files stored on your device to enhance your browsing experience. They help us remember your system preferences and login state." },
            { h: "2. How We Use Cookies", p: "We use essential cookies for authentication and security purposes. We may also use analytical cookies to understand how our platform is used." },
            { h: "3. Managing Cookies", p: "You can control or delete cookies through your browser settings. However, disabling essential cookies may affect the functionality of our services." },
          ]
        };
      default:
        return { title: "Legal", updated: "-", sections: [] };
    }
  };

  const content = getContent();

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
              <Box key={link.label} onClick={() => handleNav(link)} sx={{ cursor: "pointer" }}>
                <Typography sx={{ fontWeight: 600, fontSize: "14px", color: C.black, opacity: 0.6, transition: "opacity 0.3s ease", "&:hover": { opacity: 1 } }}>{link.label}</Typography>
              </Box>
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
            {content.title}
          </Typography>
          <Typography sx={{ color: C.textSub, fontSize: "14px", fontWeight: 700, mb: 10, letterSpacing: '0.05em' }}>
            LAST UPDATED: {content.updated}
          </Typography>

          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {content.sections.map((sec, i) => (
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
              <Typography variant="subtitle2" sx={{ fontWeight: 800, mb: 3, color: "#000", textTransform: 'uppercase', letterSpacing: "0.1em" }}>Product</Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {navLinks.map(l => (
                  <Typography key={l.label} onClick={() => handleNav(l)} sx={{ color: "#64748B", fontSize: "14px", cursor: 'pointer', fontWeight: 600, "&:hover": { color: "#000" } }}>{l.label}</Typography>
                ))}
              </Box>
            </Grid>

            <Grid item xs={12} sm={6} md={2}>
              <Typography variant="subtitle2" sx={{ fontWeight: 800, mb: 3, color: "#000", textTransform: 'uppercase', letterSpacing: "0.1em" }}>Legal</Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Typography onClick={() => navigate("/terms")} sx={{ color: type === 'terms' ? "#000" : "#64748B", fontSize: "14px", cursor: 'pointer', fontWeight: 600, "&:hover": { color: "#000" } }}>Terms of Service</Typography>
                <Typography onClick={() => navigate("/privacy")} sx={{ color: type === 'privacy' ? "#000" : "#64748B", fontSize: "14px", cursor: 'pointer', fontWeight: 600, "&:hover": { color: "#000" } }}>Privacy Policy</Typography>
                <Typography onClick={() => navigate("/cookies")} sx={{ color: type === 'cookies' ? "#000" : "#64748B", fontSize: "14px", cursor: 'pointer', fontWeight: 600, "&:hover": { color: "#000" } }}>Cookie Policy</Typography>
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
                <Typography key={l.label} onClick={() => { handleNav(l); setMobileOpen(false); }} sx={{ fontWeight: 600, fontSize: "16px", cursor: 'pointer' }}>{l.label}</Typography>
             ))}
           </Box>
        </Box>
      </Drawer>
    </Box>
  );
}
