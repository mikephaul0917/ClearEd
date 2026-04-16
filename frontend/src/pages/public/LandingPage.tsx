import { useState, useEffect } from "react";
import { Box, Typography, Container, Grid, Button, IconButton, Drawer, List, ListItem, ListItemText, useTheme, useMediaQuery } from "@mui/material";
import { useNavigate, Link as RouterLink } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import MenuIcon from "@mui/icons-material/Menu";
import CloseIcon from "@mui/icons-material/Close";
import { FaFacebookF, FaInstagram, FaTiktok } from "react-icons/fa";
import { fetchLandingStats, LandingStats } from "../../services/public.service";
import Avatar from "@mui/material/Avatar";
import Divider from "@mui/material/Divider";
import { LayoutGroup } from "framer-motion";
import { useAuth } from "../../hooks/useAuth";

/* ---------------- Icons (Sidebar Style) ---------------- */
function IconBase({ children, color }: any) {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      {children}
    </svg>
  );
}

const HomeSIcon = ({ color }: any) => <IconBase color={color}><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /><polyline points="9 22 9 12 15 12 15 22" /></IconBase>;
const QuestionSIcon = ({ color }: any) => <IconBase color={color}><circle cx="12" cy="12" r="10" /><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" /><line x1="12" y1="17" x2="12.01" y2="17" /></IconBase>;
const InfoSIcon = ({ color }: any) => <IconBase color={color}><circle cx="12" cy="12" r="10" /><line x1="12" y1="16" x2="12" y2="12" /><line x1="12" y1="8" x2="12.01" y2="8" /></IconBase>;
const LoginSIcon = ({ color }: any) => <IconBase color={color}><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" /><polyline points="10 17 15 12 10 7" /><line x1="15" y1="12" x2="3" y2="12" /></IconBase>;


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
  initial: { y: 60, opacity: 0 },
  whileInView: { y: 0, opacity: 1 },
  viewport: { once: true },
  transition: { duration: 0.8, ease: "easeOut" }
} as const;

export default function LandingPage() {
  const navigate = useNavigate();
  const { token } = useAuth();
  const [stats, setStats] = useState<LandingStats>({
    totalInstitutions: 0,
    studentsClearedCount: 0,
    successRate: 0,
    processingSpeed: "0x"
  });

  const [activeTab, setActiveTab] = useState("hero");
  const [hoveredTab, setHoveredTab] = useState<string | null>(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));

  const navLinks = [
    { label: "How it Works", id: "how-it-works", icon: QuestionSIcon },
    { label: "About us", id: "about", icon: InfoSIcon },
    {
      label: token ? "Home" : "Login",
      path: token ? "/home" : "/login",
      icon: LoginSIcon
    },
  ];



  useEffect(() => {
    const loadStats = async () => {
      const data = await fetchLandingStats();
      setStats(data);
    };
    loadStats();
  }, []);

  // Scroll Spy Logic
  useEffect(() => {
    const observerOptions = {
      root: null,
      rootMargin: "-40% 0px -40% 0px", // Trigger when section is in middle of viewport
      threshold: 0
    };

    const handleIntersect = (entries: IntersectionObserverEntry[]) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          setActiveTab(entry.target.id);
        }
      });
    };

    const observer = new IntersectionObserver(handleIntersect, observerOptions);
    const sections = ["how-it-works", "about"];
    sections.forEach(id => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });

    // Special check for "hero" state (at the top)
    const handleScrollTop = () => {
      if (window.scrollY < 300) {
        setActiveTab("hero");
      }
    };
    window.addEventListener("scroll", handleScrollTop);

    // Handle initial hash scroll
    if (window.location.hash) {
      const id = window.location.hash.substring(1);
      setTimeout(() => handleScroll(id), 100);
    }

    return () => {
      observer.disconnect();
      window.removeEventListener("scroll", handleScrollTop);
    };
  }, []);

  const handleScroll = (id: string) => {
    setActiveTab(id);
    const element = document.getElementById(id);
    if (element) {
      const headerOffset = 80;
      const elementPosition = element.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

      window.scrollTo({
        top: offsetPosition,
        behavior: "smooth"
      });
    }
  };

  const handleNav = (link: { id?: string, path?: string }) => {
    if (link.id) {
      if (window.location.pathname === '/') {
        handleScroll(link.id);
      } else {
        navigate(`/#${link.id}`);
      }
    } else if (link.path) {
      navigate(link.path);
    }
  };

  return (
    <Box sx={{ backgroundColor: C.white, minHeight: "100vh", fontFamily: C.fontStack, position: "relative", overflowX: "hidden" }}>
      {/* ── Custom Integrated Header ── */}
      <Box
        component="header"
        sx={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          height: "64px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          px: { xs: 2.5, md: 8 },
          zIndex: 1100,
          backgroundColor: "rgba(255, 255, 255, 0.8)",
          backdropFilter: "blur(12px)",
          borderBottom: isMobile ? "1px solid rgba(0,0,0,0.05)" : "none",
        }}
      >
        <Box display="flex" alignItems="center" gap={1.5}>
          <Box sx={{
            width: 24,
            height: 24,
            display: "flex",
            alignItems: "center",
            justifyContent: "center"
          }}>
            <img
              src="/logo/logo.png"
              alt="ClearEd Logo"
              style={{
                width: "100%",
                height: "100%",
                objectFit: "contain",
                transform: "scale(2.8)"
              }}
            />
          </Box>
          <Typography
            variant="h6"
            sx={{
              fontWeight: 700,
              color: C.black,
              fontSize: "18px",
              letterSpacing: "-0.02em"
            }}
          >
            ClearEd
          </Typography>
        </Box>

        {/* Desktop Nav */}
        {!isMobile ? (
          <Box display="flex" alignItems="center" gap={5}>
            {navLinks.map((link) => {
              const linkId = link.id || link.label;
              const isIndicatorActive = (hoveredTab ?? activeTab) === linkId;

              return (
                <Box
                  key={link.label}
                  onClick={() => handleNav(link)}
                  onMouseEnter={() => setHoveredTab(linkId)}
                  onMouseLeave={() => setHoveredTab(null)}
                  sx={{
                    position: "relative",
                    cursor: "pointer",
                    py: 0.5
                  }}
                >
                  <Typography
                    sx={{
                      fontWeight: 600,
                      fontSize: "14px",
                      color: C.black,
                      opacity: activeTab === link.id ? 1 : 0.6,
                      transition: "opacity 0.3s ease"
                    }}
                  >
                    {link.label}
                  </Typography>
                  {isIndicatorActive && (
                    <motion.div
                      layoutId="activeUnderline"
                      style={{
                        position: "absolute",
                        bottom: -4,
                        left: 0,
                        right: 0,
                        height: "2px",
                        backgroundColor: C.black,
                        borderRadius: "2px"
                      }}
                      transition={{ type: "spring", stiffness: 380, damping: 30 }}
                    />
                  )}
                </Box>
              );
            })}
          </Box>
        ) : (
          <IconButton
            onClick={() => setMobileOpen(true)}
            sx={{ color: C.black, p: 1 }}
          >
            <MenuIcon />
          </IconButton>
        )}
      </Box>

      {/* Mobile Drawer */}
      <Drawer
        anchor="left"
        open={mobileOpen}
        onClose={() => setMobileOpen(false)}
        PaperProps={{
          sx: {
            width: "280px",
            height: "100%",
            backgroundColor: C.white,
            display: "flex",
            flexDirection: "column",
            borderRight: "1px solid #E5E7EB",
            boxShadow: "none"
          }
        }}
      >
        {/* Drawer Header (Logo + Name) */}
        <Box sx={{ p: 2, display: "flex", alignItems: "center", gap: 1.5, mb: 1, mt: 1 }}>
          <Box sx={{ width: 28, height: 28, borderRadius: 1.5, display: "flex", alignItems: "center", justifyContent: "center", overflow: 'hidden' }}>
            <img src="/logo/logo.png" alt="Logo" style={{ width: "100%", height: "100%", objectFit: "contain", transform: "scale(2)" }} />
          </Box>
          <Typography fontSize={18} fontWeight={700} color="#0F172A">
            ClearEd
          </Typography>
        </Box>

        <Divider sx={{ mx: 2, mb: 2, borderColor: "#F1F5F9" }} />

        {/* Section Label */}
        <Box sx={{ px: 3, mb: 1 }}>
          <Typography sx={{ fontSize: "12px", fontWeight: 700, color: "#94A3B8", textTransform: "uppercase", letterSpacing: "0.05em" }}>
            Navigation
          </Typography>
        </Box>

        <Box flex={1} sx={{ display: 'flex', flexDirection: 'column', minHeight: 0 }}>
          <LayoutGroup id="mobile-sidebar-nav">
            <Box display="flex" flexDirection="column" gap={0.5} sx={{ px: 1.5 }}>
              {navLinks.map((link) => {
                const isActive = activeTab === link.id || (link.path === "/login" && activeTab === "login");
                const Icon = link.icon;

                return (
                  <Button
                    key={link.label}
                    onClick={() => {
                      handleNav(link);
                      setMobileOpen(false);
                    }}
                    sx={{
                      position: "relative",
                      zIndex: 1,
                      justifyContent: "flex-start",
                      textTransform: "none",
                      fontSize: 14,
                      px: 2,
                      height: 40,
                      borderRadius: "10px",
                      backgroundColor: "transparent",
                    }}
                  >
                    {isActive && (
                      <motion.div
                        layoutId="activeNavIndicatorMobile"
                        style={{
                          position: "absolute",
                          inset: 0,
                          backgroundColor: "rgba(176, 224, 230, 0.2)",
                          borderRadius: "10px",
                          zIndex: 0
                        }}
                        transition={{ type: "spring", bounce: 0.15, duration: 0.5 }}
                      />
                    )}
                    <motion.div
                      style={{ position: "relative", zIndex: 1, display: "flex", alignItems: "center", width: "100%" }}
                      initial={false}
                      animate={{ color: isActive ? "#0E7490" : "#0F172A" }}
                      transition={{ duration: 0.5 }}
                    >
                      <Icon color={isActive ? "#0E7490" : "#64748B"} />
                      <Box ml={1.5} sx={{ fontWeight: 600 }}>{link.label}</Box>
                    </motion.div>
                  </Button>
                );
              })}
            </Box>
          </LayoutGroup>
        </Box>

        {/* Bottom Section (Guest Profile) */}
        <Box sx={{ p: 2, mt: "auto", borderTop: "1px solid #F1F5F9" }}>
          <Box display="flex" alignItems="center" gap={1.5}>
            <Avatar sx={{ width: 36, height: 36, bgcolor: "#F1F5F9", color: "#64748B", fontSize: "14px", fontWeight: 700 }}>?</Avatar>
            <Box>
              <Typography sx={{ fontSize: "14px", fontWeight: 700, color: "#0F172A" }}>Guest User</Typography>
              <Typography sx={{ fontSize: "12px", color: "#64748B" }}>Public Access</Typography>
            </Box>
          </Box>
        </Box>
      </Drawer>



      {/* ── Hero Headline (Mimicking the reference) ── */}
      <Container maxWidth={false} sx={{ px: { xs: 3, md: 8 }, pt: { xs: 15, md: 25 }, pb: 10 }}>
        <motion.div
          initial={{ opacity: 0, y: 100 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] as const }}
        >
          <Typography
            sx={{
              fontSize: { xs: "36px", sm: "60px", md: "140px" },
              fontWeight: 800,
              lineHeight: { xs: 1.1, md: 0.85 },
              letterSpacing: "-0.04em",
              textAlign: "center",
              color: C.black,
              mb: { xs: 6, md: 10 },
              px: { xs: 2, md: 0 }
            }}
          >
            A Path <br /> for Seamless Approval
          </Typography>
        </motion.div>

        {/* ── Visual Mockup Section (Bento Blue Box) ── */}
        <Box
          component={motion.div}
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1.2, delay: 0.3 }}
          sx={{
            width: "100%",
            height: { xs: "480px", sm: "400px", md: "550px" },
            backgroundColor: C.blueAccent,
            borderRadius: { xs: "32px", md: "60px" },
            position: "relative",
            display: "flex",
            flexDirection: { xs: 'column', md: 'row' },
            alignItems: "center",
            justifyContent: "center",
            mb: { xs: 10, md: 18 },
            boxShadow: "0 40px 100px rgba(176, 224, 230, 0.4)",
            overflow: 'visible'
          }}
        >
          {/* Mockup Overlay (Floating Phone) */}
          <Box
            component={motion.img}
            src="/mobile.png"
            alt="Mobile Mockup"
            initial={{ y: 200, opacity: 0, rotate: -5, x: "-50%" }}
            whileInView={{ y: isMobile ? 60 : -60, opacity: 1, rotate: -5, x: "-50%" }}
            viewport={{ once: true }}
            transition={{
              type: "spring",
              stiffness: 40,
              damping: 20,
              mass: 1.2,
              duration: 1.5
            }}
            sx={{
              position: "absolute",
              left: "50%",
              width: { xs: "170%", sm: "90%", md: "1100px" },
              maxWidth: { xs: "none", sm: "600px", md: "none" },
              height: "auto",
              filter: "drop-shadow(0 60px 80px rgba(0,0,0,0.45))",
              zIndex: 2,
              userSelect: 'none',
              pointerEvents: 'none',
              willChange: "transform, opacity, filter",

              backfaceVisibility: "hidden"
            }}
          />

          <Box sx={{
            position: "absolute",
            top: { xs: 30, md: 'auto' },
            bottom: { xs: 'auto', md: 60 },
            left: { xs: 30, md: 60 },
            color: "#0d6b63",
            zIndex: 3,
            pr: 4
          }}>
            <Typography variant="h3" sx={{
              fontWeight: 900,
              mb: 1,
              letterSpacing: "-0.02em",
              fontSize: { xs: "28px", md: "48px" }
            }}>
              ClearEd
            </Typography>
            <Typography sx={{
              opacity: 0.9,
              maxWidth: { xs: "260px", md: "300px" },
              fontSize: { xs: "13px", md: "14px" },
              fontWeight: 600,
              lineHeight: 1.5
            }}>
              A digital record-keeping project to support seamless institutional workflows.
            </Typography>
          </Box>
        </Box>
      </Container>
      {/* ── Sub Content Section (Two Columns) ── */}
      <Box sx={{ px: { xs: 3, md: 8 }, pb: { xs: 10, md: 20 } }}>
        <Grid container spacing={{ xs: 6, md: 10 }}>
          <Grid item xs={12} md={5}>
            <motion.div {...fadeInUp}>
              <Typography
                sx={{
                  fontSize: { xs: "24px", sm: "32px", md: "48px" },
                  fontWeight: 700,
                  lineHeight: { xs: 1.2, md: 1.1 },
                  letterSpacing: "-0.03em",
                  color: C.black,
                  textAlign: { xs: 'center', md: 'left' }
                }}
              >
                ClearEd is Institutional <br />
                Workflow designed for <br />
                Integrity and Speed.
              </Typography>
            </motion.div>
          </Grid>
          <Grid item xs={12} md={7}>
            <motion.div {...fadeInUp} transition={{ ...fadeInUp.transition, delay: 0.2 }}>
              <Box sx={{ display: "flex", justifyContent: "space-between", borderTop: "1px solid #ddd", pt: 4, flexDirection: { xs: "column", sm: "row" }, gap: 3 }}>
                <Typography sx={{ fontWeight: 700, fontSize: "12px", color: C.black }}>[OVERVIEW]</Typography>
                <Typography
                  sx={{
                    maxWidth: 450,
                    fontSize: { xs: "14px", md: "15px" },
                    lineHeight: 1.6,
                    color: C.textSub,
                  }}
                >
                  E-Clearance streamlines academic clearance through an immutable digital platform.
                  Plus Institutional Access ensures every request is verified based on official domains,
                  reducing the burden on staff and the anxiety of students returning to campus life.
                  We aim to present a new paradigm centered around the user.
                </Typography>
              </Box>
            </motion.div>
          </Grid>
        </Grid>
      </Box>

      {/* ── Simple Detailed Sections for Scroll ── */}
      <Box id="how-it-works" sx={{ py: { xs: 10, md: 20 }, bgcolor: C.gray }}>
        <Container maxWidth="lg">
          <motion.div {...fadeInUp}>
            <Typography variant="h2" sx={{ fontWeight: 900, mb: { xs: 4, md: 5 }, letterSpacing: "-0.04em", fontSize: { xs: "28px", md: "60px" }, textAlign: { xs: 'center', md: 'left' } }}>
              The Workflow
            </Typography>
          </motion.div>
          <Grid container spacing={3}>
            {["Verify Official Domain", "Digital Clearance Path", "One-Click Approval"].map((step, i) => (
              <Grid item xs={12} sm={6} md={4} key={i}>
                <motion.div
                  {...fadeInUp}
                  transition={{ ...fadeInUp.transition, delay: i * 0.1 }}
                  style={{ height: '100%' }}
                >
                  <Box sx={{ p: { xs: 3, md: 4 }, bgcolor: C.white, borderRadius: "24px", height: "100%" }}>
                    <Typography sx={{ fontWeight: 800, fontSize: "12px", mb: 1.5, color: '#94A3B8' }}>STEP 0{i + 1}</Typography>
                    <Typography variant="h5" sx={{ fontWeight: 700, mb: 1, fontSize: { xs: '1.1rem', md: '1.5rem' } }}>{step}</Typography>
                    <Typography sx={{ fontSize: "14px", color: C.textSub }}>Institutional security meets user-centric speed.</Typography>
                  </Box>
                </motion.div>
              </Grid>
            ))}
          </Grid>
        </Container>
      </Box>

      {/* ── Redesigned Impact Section & CTA ── */}
      <Box sx={{ py: { xs: 8, md: 18 }, bgcolor: "#FFFFFF" }}>
        <Container maxWidth="lg">
          <Grid container spacing={{ xs: 6, md: 8 }} alignItems="flex-start">
            {/* Left Header */}
            <Grid item xs={12} md={7}>
              <motion.div {...fadeInUp}>
                <Typography
                  variant="h1"
                  sx={{
                    fontWeight: 800,
                    fontSize: { xs: "28px", sm: "36px", md: "48px" },
                    lineHeight: 1.2,
                    textTransform: 'none',
                    letterSpacing: "-0.055em",
                    color: "#000000",
                    mb: { xs: 1, md: 0 },
                    textAlign: { xs: 'center', md: 'left' },
                    fontFamily: '"Google Sans", "Product Sans", Roboto, sans-serif'
                  }}
                >
                  We Turn Clearance <br /> Into Seamless <br /> Flow
                </Typography>
              </motion.div>
            </Grid>

            {/* Right Meta */}
            <Grid item xs={12} md={5}>
              <motion.div {...fadeInUp} transition={{ ...fadeInUp.transition, delay: 0.2 }}>
                <Typography
                  sx={{
                    fontSize: { xs: "14px", md: "15px" },
                    color: "#475569",
                    mb: 4,
                    lineHeight: 1.7,
                    maxWidth: 420,
                    textAlign: { xs: 'center', md: 'left' },
                    mx: { xs: 'auto', md: 0 },
                    fontFamily: '"Google Sans", "Product Sans", Roboto, sans-serif',
                    fontWeight: 450
                  }}
                >
                  Whether it's an institution-wide migration or single department audits,
                  we bring the ultimate digital framework for speed and accuracy
                  to every administrative project.
                </Typography>
                <Box sx={{ textAlign: { xs: 'center', md: 'left' } }}>
                  <Button
                    component={RouterLink}
                    to="/how-it-works"
                    variant="contained"
                    sx={{
                      bgcolor: "#3c4043",
                      color: "#FFFFFF",
                      borderRadius: "100px",
                      px: { xs: 4, md: 5 },
                      py: { xs: 1.5, md: 1.8 },
                      fontSize: "14px",
                      fontWeight: 700,
                      textTransform: "none",
                      boxShadow: "0 20px 40px rgba(0, 0, 0, 0.2)",
                      fontFamily: '"Google Sans", "Product Sans", Roboto, sans-serif',
                      "&:hover": {
                        bgcolor: "#3c4043",
                        boxShadow: "0 15px 30px rgba(0, 0, 0, 0.2)",
                        transform: 'translateY(-2px)'
                      },
                      transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)'
                    }}
                  >
                    Know More About Us
                  </Button>
                </Box>
              </motion.div>
            </Grid>

            {/* Bottom Statistics Row */}
            <Grid item xs={12} sx={{ mt: { xs: 4, md: 12 } }}>
              <Grid container spacing={{ xs: 2, md: 6 }}>
                {[
                  { label: "INSTITUTIONS VERIFIED", value: stats.totalInstitutions > 0 ? `${stats.totalInstitutions}+` : '---' },
                  {
                    label: "STUDENTS CLEARED",
                    value: stats.studentsClearedCount > 0
                      ? (stats.studentsClearedCount >= 1000
                        ? `${(stats.studentsClearedCount / 1000).toFixed(1)}k+`
                        : `${stats.studentsClearedCount}+`)
                      : '---'
                  },
                  { label: "SUCCESS RATE", value: stats.successRate > 0 ? `${stats.successRate}%` : '---' },
                  { label: "PROCESSING SPEED", value: stats.processingSpeed !== "0x" ? stats.processingSpeed : '---' }
                ].map((stat, i) => (
                  <Grid item xs={6} md={3} key={i}>
                    <motion.div
                      {...fadeInUp}
                      transition={{ ...fadeInUp.transition, delay: 0.3 + (i * 0.1) }}
                    >
                      <Typography
                        sx={{
                          fontSize: { xs: "9px", md: "11px" },
                          fontWeight: 800,
                          color: "#64748B",
                          letterSpacing: "0.1em",
                          mb: 1,
                          textTransform: 'uppercase',
                          fontFamily: '"Google Sans", "Product Sans", Roboto, sans-serif'
                        }}
                      >
                        {stat.label}
                      </Typography>
                      <Typography
                        variant="h2"
                        sx={{
                          fontWeight: 800,
                          fontSize: { xs: "28px", md: "52px" },
                          color: "#000000",
                          letterSpacing: "-0.055em",
                          fontFamily: '"Google Sans", "Product Sans", Roboto, sans-serif'
                        }}
                      >
                        {stat.value}
                      </Typography>
                    </motion.div>
                  </Grid>
                ))}
              </Grid>
            </Grid>
          </Grid>
        </Container>
      </Box>

      {/* ── About Section ── */}
      <Box id="about" sx={{ py: { xs: 10, md: 20 }, px: { xs: 3, md: 0 } }}>
        <Container maxWidth="lg">
          <motion.div {...fadeInUp}>
            <Typography variant="h2" sx={{ fontWeight: 900, mb: { xs: 3, md: 5 }, letterSpacing: "-0.04em", textAlign: 'center', fontSize: { xs: "32px", md: "60px" } }}>
              About ClearEd
            </Typography>
          </motion.div>
          <Box display="flex" justifyContent="center">
            <motion.div {...fadeInUp} transition={{ ...fadeInUp.transition, delay: 0.2 }}>
              <Typography sx={{ maxWidth: 700, fontSize: { xs: "15px", md: "18px" }, color: C.textSub, textAlign: 'center', mx: 'auto', lineHeight: 1.8 }}>
                Born out of necessity, ClearEd re-imagines how institutions manage administrative data.
                Our mission is to replace manual paper trails with verified digital record-keeping,
                ensuring compliance while respecting the time of every individual.
              </Typography>
            </motion.div>
          </Box>
        </Container>
      </Box>

      {/* ── Redesigned Footer ── */}
      <Box sx={{ bgcolor: "#FFFFFF", color: "#000000", py: { xs: 8, md: 10 }, px: { xs: 3, md: 10 }, borderTop: "1px solid #F1F5F9" }}>
        <Container maxWidth="xl">
          <Grid container spacing={6} justifyContent="space-between">
            {/* Column 1: Brand */}
            <Grid item xs={12} md={4} sx={{ textAlign: { xs: 'center', md: 'left' } }}>
              <Box display="flex" alignItems="center" gap={1.5} mb={3}>
                <img src="/logo/logo.png" alt="Logo" style={{ width: 28, height: 28, objectFit: 'contain', transform: 'scale(2)' }} />
                <Typography variant="h6" sx={{ fontWeight: 800, color: "#000", letterSpacing: "-0.02em" }}>ClearEd</Typography>
              </Box>
              <Typography sx={{ color: "#64748B", fontSize: "14px", lineHeight: 1.6, maxWidth: 320, mb: 4 }}>
                The ultimate digital framework for modern institutional clearance and record management.
              </Typography>
              <Box sx={{ display: 'flex', gap: 3 }}>
                <Box component="a" href="#" sx={{ color: "#000000", opacity: 0.6, transition: 'all 0.2s', "&:hover": { opacity: 1, transform: 'translateY(-2px)' } }}>
                  <FaFacebookF size={18} />
                </Box>
                <Box component="a" href="#" sx={{ color: "#000000", opacity: 0.6, transition: 'all 0.2s', "&:hover": { opacity: 1, transform: 'translateY(-2px)' } }}>
                  <FaInstagram size={18} />
                </Box>
                <Box component="a" href="#" sx={{ color: "#000000", opacity: 0.6, transition: 'all 0.2s', "&:hover": { opacity: 1, transform: 'translateY(-2px)' } }}>
                  <FaTiktok size={18} />
                </Box>
              </Box>
            </Grid>

            {/* Column 2: Links */}
            <Grid item xs={6} md={2}>
              <Typography variant="subtitle2" sx={{ fontWeight: 800, mb: 3, color: "#000", textTransform: 'uppercase', letterSpacing: "0.1em" }}>Product</Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {navLinks.map((link) => (
                  <Typography
                    key={link.label}
                    onClick={() => handleNav(link)}
                    sx={{
                      color: "#64748B",
                      fontSize: "14px",
                      textDecoration: 'none',
                      fontWeight: 600,
                      cursor: 'pointer',
                      transition: 'color 0.2s',
                      "&:hover": { color: "#000" }
                    }}
                  >
                    {link.label}
                  </Typography>
                ))}
              </Box>
            </Grid>

            {/* Column 3: Legal */}
            <Grid item xs={6} md={2}>
              <Typography variant="subtitle2" sx={{ fontWeight: 800, mb: 3, color: "#000", textTransform: 'uppercase', letterSpacing: "0.1em" }}>Legal</Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {[
                  { label: 'Terms', path: '/terms' },
                  { label: 'Privacy', path: '/privacy' },
                  { label: 'Cookies', path: '/cookies' }
                ].map((link) => (
                  <Typography
                    key={link.label}
                    onClick={() => navigate(link.path)}
                    sx={{
                      color: "#64748B",
                      fontSize: "14px",
                      textDecoration: 'none',
                      fontWeight: 600,
                      cursor: 'pointer',
                      transition: 'color 0.2s',
                      "&:hover": { color: "#000" }
                    }}
                  >
                    {link.label}
                  </Typography>
                ))}
              </Box>
            </Grid>
          </Grid>

          <Box sx={{ borderTop: "1px solid #F1F5F9", mt: 6, pt: 4, display: 'flex', justifyContent: 'space-between', flexDirection: { xs: 'column', sm: 'row' }, gap: 3 }}>
            <Typography sx={{ color: "#94A3B8", fontSize: "11px", fontWeight: 700, letterSpacing: '0.05em', textAlign: { xs: 'center', sm: 'left' } }}>
              © 2026 CLEARED. ALL RIGHTS RESERVED.
            </Typography>
            <Typography sx={{ color: "#94A3B8", fontSize: "10px", textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.05em', textAlign: { xs: 'center', sm: 'right' }, maxWidth: { xs: '100%', sm: 400 } }}>
              DEVELOPED BY MIKE PHAUL BANDERADA, ERROLLE ARDIENTE, AND BRAD DEL MORO
            </Typography>
          </Box>
        </Container>
      </Box>
    </Box>
  );
}
