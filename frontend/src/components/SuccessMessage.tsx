import { useEffect } from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Swal from "sweetalert2";
import "sweetalert2/dist/sweetalert2.min.css";

type Variant = "success" | "error";

export default function SuccessMessage({ message, variant = "success", onClose }: { message: string; variant?: Variant; onClose?: () => void }) {
  const styles = variant === "success"
    ? { bg: "#F0FDF4", border: "#86EFAC", color: "#166534" }
    : { bg: "#FEF2F2", border: "#FCA5A5", color: "#7F1D1D" };

  useEffect(() => {
    if (!onClose) return;
    const len = (message || "").length;
    const duration = Math.min(8000, Math.max(3000, len * 80));
    const t = setTimeout(() => onClose(), duration);
    return () => clearTimeout(t);
  }, [message, onClose]);

  useEffect(() => {
    if (variant !== "success") return;
    const Toast = Swal.mixin({
      toast: true,
      position: "top-end",
      showConfirmButton: false,
      timer: 3000,
      timerProgressBar: true,
      didOpen: (toast: HTMLElement) => {
        toast.onmouseenter = Swal.stopTimer as any;
        toast.onmouseleave = Swal.resumeTimer as any;
        toast.style.border = "1px solid #86EFAC";
        toast.style.borderRadius = "12px";
        if (toast.parentElement) {
          (toast.parentElement as HTMLElement).style.zIndex = "3000";
        }
      }
    });
    Toast.fire({
      icon: "success",
      title: message,
      background: "rgba(240, 253, 244, 0.98)",
      color: "#166534",
      iconColor: "#166534"
    });
  }, [variant, message]);

  return (
    variant === "error" ? (
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          borderRadius: 2,
          gap: 1,
          px: 5,
          py: 3,
          border: `1px solid ${styles.border}`,
          backgroundColor: styles.bg,
          color: styles.color,
          mb: 2,
          position: "fixed",
          top: 16,
          left: "50%",
          transform: "translateX(-50%)",
          zIndex: 2000
        }}
      >
        <Box aria-hidden sx={{ width: 24, height: 24, borderRadius: '50%', backgroundColor: '#FEE2E2', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M7 7l10 10M17 7L7 17" stroke="#7F1D1D" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </Box>
        <Typography variant="body1" sx={{ fontWeight: 600 }}>{message}</Typography>
      </Box>
    ) : null
  );
}