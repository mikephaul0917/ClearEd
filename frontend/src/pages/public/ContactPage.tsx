import { Box, Typography, Container, Grid, TextField, Button, MenuItem, Checkbox, FormControlLabel, IconButton } from "@mui/material";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import axios from "axios";
import Swal from "sweetalert2";
import SuccessActionModal from "../../components/SuccessActionModal";


const C = {
  white: "#FFFFFF",
  black: "#3c4043",
  gray: "#F9FAFB",
  border: "#E2E8F0",
  fontStack: "'Inter', 'Plus Jakarta Sans', system-ui, sans-serif",
};

const fadeInUp = {
  initial: { y: 40, opacity: 0 },
  animate: { y: 0, opacity: 1 },
  transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1] as const }
};

export default function ContactPage() {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccessOpen, setIsSuccessOpen] = useState(false);
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    service: "",
    description: ""
  });

  const handleInputChange = (field: string) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({ ...prev, [field]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (isLoading) return;
    setIsLoading(true);

    try {
      const response = await axios.post('http://localhost:5000/api/contact/submit', formData);

      if (response.data.success) {
        setIsSuccessOpen(true);
        setFormData({
          firstName: "",
          lastName: "",
          email: "",
          service: "",
          description: ""
        });
      } else {
        throw new Error(response.data.message);
      }
    } catch (error: any) {
      console.error('Submission error:', error);
      window.dispatchEvent(new CustomEvent('app:show-modal', {
        detail: {
          title: "Submission Failed",
          description: error.response?.data?.message || 'Failed to send message. Please try again later.',
          mode: 'error'
        }
      }));
    } finally {
      setIsLoading(false);
    }
  };

  const inputSx = {
    "& .MuiInput-underline:before": { borderBottomColor: "#D1D5DB" },
    "& .MuiInput-underline:after": { borderBottomColor: C.black },
    "& .MuiInputLabel-root": { color: "#6B7280", fontWeight: 500, fontSize: "14px" },
    "& .MuiInputLabel-root.Mui-focused": { color: C.black },
    "& .MuiInputBase-input": { py: 1.5, fontSize: "16px", fontWeight: 500 },
    mb: { xs: 2.5, md: 4 }
  };

  return (
    <Box sx={{ backgroundColor: C.white, minHeight: "100vh", color: C.black, fontFamily: C.fontStack }}>
      <Container maxWidth="xl" sx={{ pt: { xs: 12, md: 18 }, pb: { xs: 12, md: 20 }, px: { xs: 3, md: 8 } }}>
        <motion.div initial={{ opacity: 0, y: 100 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] as const }}>
          <Typography
            variant="h1"
            sx={{
              fontSize: { xs: "52px", sm: "100px", md: "230px" },
              fontWeight: 620,
              letterSpacing: "-0.06em",
              lineHeight: 0.85,
              mb: { xs: 6, md: 15 },
              color: C.black
            }}
          >
            Contact me
          </Typography>
        </motion.div>

        <Grid container spacing={{ xs: 6, md: 10 }}>
          {/* Left Column: Info */}
          <Grid item xs={12} md={5}>
            <motion.div {...fadeInUp} transition={{ ...fadeInUp.transition, delay: 0.2 }}>
              <Box sx={{ mb: 8 }}>
                <Typography sx={{ fontSize: "16px", color: '#000', fontWeight: 500, mb: 0.5 }}>Lucena City, Quezon</Typography>
                <Typography sx={{ fontSize: "16px", color: "#6B7280", fontWeight: 500 }}>2026</Typography>
              </Box>

              <Box>
                <Typography sx={{ fontSize: "16px", color: '#000', fontWeight: 700, mb: 1 }}>Office hours</Typography>
                <Typography sx={{ fontSize: "16px", color: "#6B7280", fontWeight: 500, mb: 0.5 }}>Monday — Friday</Typography>
                <Typography sx={{ fontSize: "16px", color: "#6B7280", fontWeight: 500 }}>8 AM — 5 PM</Typography>
              </Box>
            </motion.div>
          </Grid>

          {/* Right Column: Form */}
          <Grid item xs={12} md={7}>
            <motion.div {...fadeInUp} transition={{ ...fadeInUp.transition, delay: 0.4 }}>
              <Box component="form" onSubmit={handleSubmit} sx={{ mb: 4 }}>
                <Typography sx={{ fontSize: "14px", fontWeight: 700, mb: 2 }}>Name (required)</Typography>
                <Grid container spacing={{ xs: 2, sm: 4 }}>
                  <Grid item xs={12} sm={6}>
                    <TextField fullWidth label="First Name" variant="standard" sx={inputSx} value={formData.firstName} onChange={handleInputChange("firstName")} disabled={isLoading} required />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField fullWidth label="Last Name" variant="standard" sx={inputSx} value={formData.lastName} onChange={handleInputChange("lastName")} disabled={isLoading} required />
                  </Grid>
                </Grid>

                <TextField
                  fullWidth
                  select
                  label="Service (optional)"
                  variant="standard"
                  value={formData.service}
                  onChange={handleInputChange("service")}
                  sx={inputSx}
                  disabled={isLoading}
                >
                  <MenuItem value="Institutional Access">Institutional Access</MenuItem>
                  <MenuItem value="Support">General Support</MenuItem>
                  <MenuItem value="Partnership">Partnership</MenuItem>
                  <MenuItem value="Other">Other</MenuItem>
                </TextField>

                <TextField fullWidth label="Email (required)" variant="standard" sx={inputSx} value={formData.email} onChange={handleInputChange("email")} disabled={isLoading} required placeholder="Your institutional email" />

                <TextField
                  fullWidth
                  multiline
                  rows={1}
                  label="Project description"
                  variant="standard"
                  sx={inputSx}
                  value={formData.description}
                  onChange={handleInputChange("description")}
                  disabled={isLoading}
                  required
                />

                <Button
                  variant="contained"
                  type="submit"
                  disabled={isLoading}
                  sx={{
                    bgcolor: C.black,
                    color: C.white,
                    borderRadius: "100px",
                    px: { xs: 6, md: 10 },
                    py: { xs: 1.8, md: 2.2 },
                    fontSize: { xs: "14px", md: "15px" },
                    fontWeight: 700,
                    textTransform: "none",
                    mt: 4,
                    width: { xs: "100%", sm: "auto" },
                    boxShadow: "0 15px 35px rgba(0,0,0,0.25)",
                    "&:hover": { bgcolor: "#1a1a1a", transform: "translateY(-2px)", boxShadow: "0 20px 45px rgba(0,0,0,0.3)" },
                    transition: "all 0.3s ease",
                    "&:disabled": { bgcolor: "#94a3b8" }
                  }}
                >
                  {isLoading ? "Sending..." : "Submit"}
                </Button>
              </Box>
            </motion.div>
          </Grid>
        </Grid>

        {/* Big Contact Details */}
        <Box sx={{ mt: { xs: 10, md: 25 }, pt: { xs: 10, md: 15 }, borderTop: `1px solid ${C.border}` }}>
          <Grid container spacing={4} alignItems="flex-end">
            <Grid item xs={12} md={7}>
              <Typography
                sx={{
                  fontSize: { xs: "22px", sm: "32px", md: "56px" },
                  fontWeight: { xs: 600, md: 800 },
                  letterSpacing: "-0.04em",
                  color: '#000',
                  wordBreak: "break-all",
                  textAlign: { xs: "left", md: "left" }
                }}
              >
                cleared.system@gmail.com
              </Typography>
            </Grid>
            <Grid item xs={12} md={5} textAlign={{ xs: "left", md: "right" }}>
              <Typography
                sx={{
                  fontSize: { xs: "22px", sm: "32px", md: "42px" },
                  fontWeight: { xs: 600, md: 800 },
                  letterSpacing: "-0.04em",
                  color: '#000'
                }}
              >
                (+63) 9152216815
              </Typography>
            </Grid>
          </Grid>
        </Box>

        {/* Footer info */}
        <Box sx={{ mt: { xs: 10, md: 15 }, display: "flex", justifyContent: "space-between", flexDirection: { xs: "column", md: "row" }, alignItems: { xs: "flex-start", md: "center" }, gap: 4 }}>
          <Box>
            <Typography sx={{ fontSize: "12px", fontWeight: 800, color: '#000', mb: 1 }}>LOCATION</Typography>
            <Typography sx={{ fontSize: "14px", color: "#6B7280", fontWeight: 500 }}>Lucena, Quezon 2026</Typography>
          </Box>
          <Box sx={{ display: "flex", gap: { xs: 2.5, sm: 4 }, flexWrap: "wrap", alignItems: "center" }}>
            <Typography sx={{ fontSize: "12px", fontWeight: 700, color: "#6B7280", "&:hover": { color: '#000' }, cursor: "pointer" }}>Facebook</Typography>
            <Typography sx={{ fontSize: "12px", fontWeight: 700, color: "#6B7280", "&:hover": { color: '#000' }, cursor: "pointer" }}>Instagram</Typography>
            <Typography sx={{ fontSize: "12px", fontWeight: 700, color: "#6B7280", "&:hover": { color: '#000' }, cursor: "pointer" }}>Twitter</Typography>
            <Typography
              onClick={() => navigate("/privacy")}
              sx={{ fontSize: "12px", fontWeight: 700, color: "#6B7280", "&:hover": { color: '#000' }, cursor: "pointer" }}
            >
              Privacy Policy
            </Typography>
          </Box>
        </Box>
      </Container>

      <SuccessActionModal
        open={isSuccessOpen}
        onClose={() => setIsSuccessOpen(false)}
        title="Message Sent Successfully"
        description="Thank you for reaching out! We've received your inquiry and will get back to you at your email address shortly."
      />
    </Box>
  );
}
