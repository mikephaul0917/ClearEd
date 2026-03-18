import { Box, Typography, Button, Container } from "@mui/material";
import { useNavigate } from "react-router-dom";

// ─── Color Tokens ────────────────────────────────────────────────────────────
const C = {
  white: "#FFFFFF",
  black: "#000000",
  teal: "#5EEAD4",
  lavender: "#D8B4FE",
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
function ArrowButton({ onClick }: { onClick?: () => void }) {
  return (
    <Box
      component="button"
      onClick={onClick}
      sx={{
        position: "absolute",
        bottom: 20,
        right: 20,
        width: 36,
        height: 36,
        borderRadius: "50%",
        backgroundColor: C.black,
        border: "none",
        cursor: "pointer",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: C.white,
        fontSize: 18,
        lineHeight: 1,
        transition: "transform 0.2s ease",
        "&:hover": { transform: "scale(1.12)" },
      }}
    >
      →
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
            <ArrowButton onClick={() => navigate("/register")} />
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

          {/* Card 3 — Lavender (Approval process) */}
          <Box sx={{ ...cardBase, backgroundColor: C.lavender, minHeight: 280 }}>
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
                  px: 4,
                  py: 1.5,
                  backgroundColor: C.black,
                  color: C.white,
                  "&:hover": { backgroundColor: "#222" },
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
                  px: 4,
                  py: 1.5,
                  backgroundColor: C.white,
                  color: C.black,
                  border: `2px solid ${C.black}`,
                  "&:hover": { backgroundColor: "#f5f5f5" },
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
