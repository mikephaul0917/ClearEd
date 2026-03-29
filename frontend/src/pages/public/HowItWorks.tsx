import { Box, Typography, Button, Container } from "@mui/material";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";

// ─── Color Tokens ────────────────────────────────────────────────────────────
const C = {
  white: "#FFFFFF",
  black: "#000000",
  teal: "#5EEAD4",
  blue: "#B0E0E6",
  yellow: "#FEF08A",
  cardRadius: "20px",
  pillRadius: "999px",
};

// ─── Shared Styles ────────────────────────────────────────────────────────────
const fontStack = "'Inter', 'Plus Jakarta Sans', 'Montserrat', sans-serif";

const cardBase = {
  borderRadius: C.cardRadius,
  p: 4,
  position: "relative" as const,
  overflow: "hidden",
  display: "flex",
  flexDirection: "column" as const,
  gap: 2,
};

// Small circular arrow button (bottom-right corner of interactive cards)
function ArrowButton({ onClick, variant = 'black' }: { onClick?: () => void, variant?: 'black' | 'white' }) {
  const isWhite = variant === 'white';

  return (
    <Box
      component="button"
      onClick={onClick}
      sx={{
        position: "absolute",
        bottom: 20,
        right: 20,
        width: 42,
        height: 42,
        borderRadius: "50%",
        backgroundColor: isWhite ? C.white : C.black,
        border: "none",
        cursor: "pointer",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: isWhite ? C.black : C.white,
        fontSize: 20,
        lineHeight: 1,
        boxShadow: isWhite
          ? '0 10px 25px rgba(255,255,255,0.25), 0 4px 10px rgba(255,255,255,0.1)'
          : '0 10px 20px -5px rgba(0,0,0,0.4), 0 8px 10px -6px rgba(0,0,0,0.2)',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        "&:hover": {
          transform: "scale(1.1) translateY(-2px)",
          boxShadow: isWhite
            ? '0 15px 35px rgba(255,255,255,0.4), 0 8px 15px rgba(255,255,255,0.2)'
            : '0 20px 25px -5px rgba(0,0,0,0.5), 0 10px 10px -5px rgba(0,0,0,0.3)',
        },
        "&:active": {
          transform: "scale(0.95)",
        }
      }}
    >
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ display: 'block' }}>
        <line x1="5" y1="12" x2="19" y2="12"></line>
        <polyline points="12 5 19 12 12 19"></polyline>
      </svg>
    </Box>
  );
}

// Tag / Badge pill
function Tag({ label, color = "rgba(0,0,0,0.45)" }: { label: string; color?: string }) {
  return (
    <Box
      sx={{
        display: "inline-block",
        fontFamily: fontStack,
        fontSize: "11px",
        fontWeight: 700,
        color,
        letterSpacing: "0.1em",
        textTransform: "uppercase",
        mb: 1,
        width: "fit-content",
      }}
    >
      {label}
    </Box>
  );
}

export default function HowItWorks() {
  const navigate = useNavigate();

  return (
    <Box
      component={motion.div}
      initial={{ x: '100%', opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: '-100%', opacity: 0 }}
      transition={{ duration: 0.4, ease: "easeInOut" }}
      sx={{
        backgroundColor: C.white,
        minHeight: "100vh",
        fontFamily: fontStack,
        py: { xs: 8, md: 12 },
      }}
    >
      <Container maxWidth="lg">
        {/* ── Hero Headline ── */}
        <Box sx={{ mb: { xs: 8, md: 10 }, textAlign: "center" }}>
          <Typography
            sx={{
              fontFamily: fontStack,
              fontWeight: 800,
              fontSize: { xs: "40px", md: "60px" },
              letterSpacing: "-2px",
              lineHeight: 1.1,
              color: C.black,
              mb: 3,
            }}
          >
            How E-Clearance Works
          </Typography>
          <Typography
            sx={{
              fontFamily: fontStack,
              fontSize: "18px",
              color: "#555",
              lineHeight: 1.7,
              maxWidth: 560,
              mx: "auto",
            }}
          >
            A digital-first clearance platform built for students and
            institutions — fast, transparent, and paperless.
          </Typography>
        </Box>

        {/* ── Bento Grid ── */}
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr", md: "1fr 1fr", lg: "2fr 1fr 1fr" },
            gap: "16px",
            mb: "16px",
          }}
        >
          {/* Card 1 — Black anchor card (For Students) */}
          <Box
            sx={{
              ...cardBase,
              backgroundColor: C.black,
              minHeight: 280,
              gridColumn: { xs: "1", md: "1 / 3", lg: "1" },
            }}
          >
            <Tag label="For Students" color="rgba(255,255,255,0.45)" />
            <Typography
              sx={{
                fontFamily: fontStack,
                fontWeight: 800,
                fontSize: "28px",
                letterSpacing: "-0.5px",
                color: C.white,
                lineHeight: 1.2,
              }}
            >
              Submit, track &amp; receive approvals — all in one place
            </Typography>
            <Typography
              sx={{
                fontFamily: fontStack,
                fontSize: "15px",
                color: "rgba(255,255,255,0.65)",
                lineHeight: 1.75,
                mt: "auto",
                pr: "48px",
              }}
            >
              E-Clearance streamlines your academic clearance through a digital
              platform. Submit requests, monitor their progress in real-time, and
              receive approvals electronically — no more queuing in offices.
            </Typography>
            <ArrowButton variant="white" onClick={() => navigate("/register")} />
          </Box>

          {/* Card 2 — Teal (Strategic / Institutions) */}
          <Box sx={{ ...cardBase, backgroundColor: C.teal, minHeight: 280 }}>
            <Tag label="For Institutions" />
            <Typography
              sx={{
                fontFamily: fontStack,
                fontWeight: 800,
                fontSize: "22px",
                letterSpacing: "-0.3px",
                color: C.black,
                lineHeight: 1.3,
              }}
            >
              Role-based workflows &amp; digital record-keeping
            </Typography>
            <Typography
              sx={{
                fontFamily: fontStack,
                fontSize: "14px",
                color: "rgba(0,0,0,0.65)",
                lineHeight: 1.75,
                mt: "auto",
                pr: "48px",
              }}
            >
              Manage clearance requests efficiently with configurable roles.
              Track every student's progress and maintain immutable digital
              records.
            </Typography>
            <ArrowButton />
          </Box>

          {/* Card 3 — Blue (Approval process) */}
          <Box sx={{ ...cardBase, backgroundColor: C.blue, minHeight: 280 }}>
            <Tag label="Approval Process" />
            <Typography
              sx={{
                fontFamily: fontStack,
                fontWeight: 800,
                fontSize: "22px",
                letterSpacing: "-0.3px",
                color: C.black,
                lineHeight: 1.3,
              }}
            >
              Super Admin review &amp; compliance
            </Typography>
            <Typography
              sx={{
                fontFamily: fontStack,
                fontSize: "14px",
                color: "rgba(0,0,0,0.65)",
                lineHeight: 1.75,
                mt: "auto",
                pr: "48px",
              }}
            >
              All institution access requests are reviewed by system admins to
              ensure compliance and security before activation.
            </Typography>
            <ArrowButton />
          </Box>
        </Box>

        {/* ── Second Row ── */}
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr", md: "1fr 2fr" },
            gap: "16px",
            mb: "16px",
          }}
        >
          {/* Card 4 — Yellow (Email policy) */}
          <Box sx={{ ...cardBase, backgroundColor: C.yellow, minHeight: 220 }}>
            <Tag label="Email Policy" />
            <Typography
              sx={{
                fontFamily: fontStack,
                fontWeight: 800,
                fontSize: "22px",
                letterSpacing: "-0.3px",
                color: C.black,
                lineHeight: 1.3,
              }}
            >
              Official domains only
            </Typography>
            <Typography
              sx={{
                fontFamily: fontStack,
                fontSize: "14px",
                color: "rgba(0,0,0,0.65)",
                lineHeight: 1.75,
                pr: "48px",
              }}
            >
              Personal email domains (gmail, yahoo, outlook) are automatically
              blocked to protect institutional integrity.
            </Typography>
            <ArrowButton />
          </Box>

          {/* Card 5 — White / Get Started CTA */}
          <Box
            sx={{
              ...cardBase,
              backgroundColor: C.white,
              border: `2px solid ${C.black}`,
              minHeight: 220,
              alignItems: "flex-start",
              justifyContent: "center",
            }}
          >
            <Tag label="Getting Started" />
            <Typography
              sx={{
                fontFamily: fontStack,
                fontWeight: 800,
                fontSize: "26px",
                letterSpacing: "-0.5px",
                color: C.black,
                lineHeight: 1.25,
                maxWidth: 420,
              }}
            >
              Ready to bring E-Clearance to your institution?
            </Typography>
            <Typography
              sx={{
                fontFamily: fontStack,
                fontSize: "14px",
                color: "#555",
                lineHeight: 1.75,
                maxWidth: 460,
              }}
            >
              Institutions must request access before use. Once approved, your
              staff and students can immediately start using the platform.
            </Typography>

            {/* CTA Buttons */}
            <Box
              sx={{
                display: "flex",
                flexWrap: "wrap",
                gap: 2,
                mt: 2,
              }}
            >
              <Button
                onClick={() => navigate("/request-institution-access")}
                sx={{
                  fontFamily: fontStack,
                  fontWeight: 700,
                  fontSize: "14px",
                  textTransform: "none",
                  borderRadius: C.pillRadius,
                  px: 5,
                  py: 2,
                  backgroundColor: C.black,
                  color: C.white,
                  boxShadow: '0 20px 30px -10px rgba(0,0,0,0.35), 0 10px 15px -5px rgba(0,0,0,0.15)',
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  "&:hover": {
                    backgroundColor: "#111",
                    boxShadow: '0 30px 45px -12px rgba(0,0,0,0.45), 0 15px 20px -8px rgba(0,0,0,0.25)',
                    transform: 'translateY(-3px)'
                  },
                }}
              >
                Request Institution Access
              </Button>

              <Button
                href="mailto:support@eclearance.app"
                sx={{
                  fontFamily: fontStack,
                  fontWeight: 700,
                  fontSize: "14px",
                  textTransform: "none",
                  borderRadius: C.pillRadius,
                  px: 5,
                  py: 2,
                  backgroundColor: C.white,
                  color: C.black,
                  border: '1px solid #E5E7EB',
                  boxShadow: '0 20px 30px -10px rgba(0,0,0,0.1), 0 10px 15px -5px rgba(0,0,0,0.05)',
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  "&:hover": {
                    backgroundColor: "#F9FAFB",
                    boxShadow: '0 30px 45px -12px rgba(0,0,0,0.15), 0 15px 20px -8px rgba(0,0,0,0.08)',
                    transform: 'translateY(-3px)'
                  },
                }}
              >
                Contact Support
              </Button>
            </Box>
          </Box>
        </Box>
      </Container>
    </Box>
  );
}
