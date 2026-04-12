import Box from "@mui/material/Box";
import Container from "@mui/material/Container";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import Swal from "sweetalert2";
import React, { useState } from "react";
import "sweetalert2/dist/sweetalert2.min.css";
import { Link as RouterLink, useLocation, useNavigate } from "react-router-dom";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import { authService } from "../../services";

export default function Header() {
  const location = useLocation();
  const nav = useNavigate();
  const inProtected = location.pathname.startsWith("/admin") || location.pathname.startsWith("/user");
  const isToggled = location.pathname === '/how-it-works';
  const confirmLogout = () => { authService.logout(); nav("/register", { state: { banner: { message: "Logged out successfully!", variant: "success" } } }); };
  const promptLogout = async () => {
    const res = await Swal.fire({
      icon: "question",
      title: "Are you sure?",
      text: "This action cannot be undone. You will be logged out immediately.",
      showCancelButton: true,
      confirmButtonText: "Logout",
      cancelButtonText: "Cancel",
      confirmButtonColor: "#000000",
      focusCancel: true,
      didOpen: () => {
        const container = Swal.getContainer();
        if (container) container.style.zIndex = "3000";
        const popup = Swal.getPopup();
        if (popup) popup.style.borderRadius = "2px";
        const cancelBtn = Swal.getCancelButton();
        if (cancelBtn) {
          cancelBtn.style.backgroundColor = "#FFFFFF";
          cancelBtn.style.color = "#0F172A";
          cancelBtn.style.border = "1px solid #000000";
          cancelBtn.style.borderRadius = "6px";
        }
        const confirmBtn = Swal.getConfirmButton();
        if (confirmBtn) {
          confirmBtn.style.backgroundColor = "#000000";
          confirmBtn.style.color = "#FFFFFF";
          confirmBtn.style.borderRadius = "6px";
        }
      }
    });
    if (res.isConfirmed) confirmLogout();
  };
  return (
    <Box sx={{
      position: "fixed",
      top: 0,
      left: 0,
      right: 0,
      height: "60px",
      display: "flex",
      alignItems: "center",
      zIndex: 1100,
      borderBottom: "1px solid #E2E8F0",
      backgroundColor: "rgba(255,255,255,0.7)",
      backdropFilter: "saturate(180%) blur(8px)",
      boxShadow: "none"
    }}>
      <Container maxWidth="lg">
        <Box display="flex" alignItems="center" justifyContent="space-between">
          <Box
            component={RouterLink}
            to="/"
            display="flex"
            alignItems="center"
            gap={1.5}
            sx={{ textDecoration: "none" }}
          >
            <Box aria-hidden sx={{
              width: 24,
              height: 24,
              borderRadius: 6,
              display: "flex",
              alignItems: "center",
              justifyContent: "center"
            }}>
              <img
                src="/logo/logo.png"
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'contain',
                  transform: 'scale(2.8)',
                }}
                alt="logo"
              />
            </Box>
            <Typography
              variant="h6"
              sx={{
                fontWeight: 600,
                color: "#0F172A",
                textDecoration: "none",
                cursor: "pointer"
              }}
            >
              ClearEd
            </Typography>
          </Box>
          <Box display="flex" alignItems="center" gap={2}>
            {inProtected ? (
              <Button variant="contained" color="primary" onClick={promptLogout}>
                Logout
              </Button>
            ) : (
              <Box
                onClick={() => {
                  // Small delay to let animation play
                  setTimeout(() => {
                    nav(isToggled ? "/register" : "/how-it-works");
                  }, 400);
                }}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1.5,
                  bgcolor: '#F2F4F7',
                  borderRadius: '100px',
                  p: '4px',
                  pr: isToggled ? 0.5 : 2.25,
                  pl: isToggled ? 2.25 : 0.5,
                  flexDirection: isToggled ? 'row-reverse' : 'row',
                  textDecoration: 'none',
                  cursor: 'pointer',
                  transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                  '&:hover': {
                    bgcolor: '#E5E7EB',
                    '& .inner-pill': { boxShadow: '0 4px 6px rgba(0,0,0,0.08)' },
                    '& .arrow-icon': { transform: isToggled ? 'translateX(-2px)' : 'translateX(2px)' }
                  }
                }}
              >
                <Box
                  className="inner-pill"
                  sx={{
                    bgcolor: isToggled ? '#FFFFFF' : '#3c4043',
                    borderRadius: '100px',
                    px: 3,
                    py: 1.25,
                    color: isToggled ? '#3c4043' : '#FFFFFF',
                    fontWeight: 700,
                    fontSize: '0.875rem',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
                    transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)'
                  }}
                >
                  {isToggled ? "Get Started" : "How It Works"}
                </Box>
                <ArrowForwardIcon
                  className="arrow-icon"
                  sx={{
                    color: '#000000',
                    fontSize: '1.2rem',
                    transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                    transform: isToggled ? 'rotate(180deg)' : 'none'
                  }}
                />
              </Box>
            )}
          </Box>
        </Box>
      </Container>
    </Box>
  );
}
