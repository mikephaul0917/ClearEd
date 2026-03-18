import Box from "@mui/material/Box";
import Container from "@mui/material/Container";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import Swal from "sweetalert2";
import "sweetalert2/dist/sweetalert2.min.css";
import { Link as RouterLink, useLocation, useNavigate } from "react-router-dom";
import { authService } from "../../services";

export default function Header() {
  const location = useLocation();
  const nav = useNavigate();
  const inProtected = location.pathname.startsWith("/admin") || location.pathname.startsWith("/user");
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
      zIndex: 1200,
      borderBottom: "1px solid #E2E8F0",
      backgroundColor: "rgba(255,255,255,0.7)",
      backdropFilter: "saturate(180%) blur(8px)"
    }}>
      <Container maxWidth="lg" sx={{ py: 1 }}>
        <Box display="flex" alignItems="center" justifyContent="space-between">
          <Box display="flex" alignItems="center" gap={1.5}>
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
                  transform: 'scale(3)', // 1.4 makes it 40% larger than its natural "contain" size
                }}
                alt="logo"
              />

            </Box>
            <Typography
              component={RouterLink}
              to="/register"
              variant="h5"
              sx={{
                fontWeight: 700,
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
              <Button component={RouterLink} to="/how-it-works" variant="contained" sx={{ backgroundColor: "#000000", color: "#FFFFFF", "&:hover": { backgroundColor: "#333333" }, borderRadius: 2, padding: 1.5 }}>
                How It Works
              </Button>
            )}
          </Box>
        </Box>
      </Container>
    </Box>
  );
}
