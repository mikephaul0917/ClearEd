import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import "sweetalert2/dist/sweetalert2.min.css";
import SuccessActionModal from "../../components/SuccessActionModal";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import TextField from "@mui/material/TextField";
import Button from "@mui/material/Button";
import Alert from "@mui/material/Alert";
import CircularProgress from "@mui/material/CircularProgress";
import Paper from "@mui/material/Paper";
import Divider from "@mui/material/Divider";
import { api } from '../../services';
import axios from "axios";

const FREE_EMAIL_DOMAINS = [
  'gmail.com', 'yahoo.com', 'outlook.com', 'hotmail.com', 'aol.com',
  'icloud.com', 'protonmail.com', 'tutanota.com', 'zoho.com', 'yandex.com',
  'mail.com', 'gmx.com', 'inbox.com', 'mail.ru', 'qq.com', '163.com',
  'sina.com', 'sohu.com', '126.com', 'yeah.net', 'foxmail.com'
];

const ACADEMIC_DOMAIN_PATTERNS = [
  /\.edu\./,
  /\.ac\./,
  /\.sch\./,
  /\.gov\./,
  /\.edu$/,
  /\.ac$/,
  /\.sch$/,
  /\.gov$/,
  /university/,
  /college/,
  /school/,
  /institute/,
  /academy/
];

export default function RequestInstitutionAccess() {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccessOpen, setIsSuccessOpen] = useState(false);
  const [formData, setFormData] = useState({
    institutionName: "",
    academicDomain: "",
    physicalAddress: "",
    contactNumber: "",
    administratorName: "",
    administratorPosition: "",
    administratorEmail: ""
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateField = (name: string, value: string): string => {
    switch (name) {
      case 'institutionName':
        if (!value.trim()) return "Institution name is required";
        if (value.length > 200) return "Institution name cannot exceed 200 characters";
        return "";

      case 'academicDomain':
        if (!value.trim()) return "Academic domain is required";
        const cleanDomain = value.toLowerCase().trim().replace(/^\.+|\.+$/g, '');

        // Check if it's a free email domain
        if (FREE_EMAIL_DOMAINS.includes(cleanDomain)) {
          return "Free email domains are not allowed. Please use your institutional domain.";
        }

        // Check if domain looks academic
        const isAcademicDomain = ACADEMIC_DOMAIN_PATTERNS.some(pattern => pattern.test(cleanDomain));
        if (!isAcademicDomain) {
          return "Please provide a valid academic domain (e.g., university.edu.ph)";
        }

        return "";

      case 'physicalAddress':
        if (!value.trim()) return "Physical address is required";
        if (value.length > 500) return "Physical address cannot exceed 500 characters";
        return "";

      case 'contactNumber':
        if (!value.trim()) return "Contact number is required";
        const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
        if (!phoneRegex.test(value.replace(/[\s\-\(\)]/g, ''))) {
          return "Please enter a valid contact number";
        }
        return "";

      case 'administratorName':
        if (!value.trim()) return "Administrator name is required";
        if (value.length > 100) return "Administrator name cannot exceed 100 characters";
        return "";

      case 'administratorPosition':
        if (!value.trim()) return "Administrator position is required";
        if (value.length > 100) return "Administrator position cannot exceed 100 characters";
        return "";

      case 'administratorEmail':
        if (!value.trim()) return "Administrator email is required";
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(value)) {
          return "Please enter a valid email address";
        }

        // Check if email domain matches academic domain
        const emailDomain = value.toLowerCase().split('@')[1];
        const academicDomain = formData.academicDomain.toLowerCase().trim().replace(/^\.+|\.+$/g, '');
        if (emailDomain !== academicDomain) {
          return "Administrator email must match the declared academic domain";
        }

        return "";

      default:
        return "";
    }
  };

  const handleInputChange = (field: string) => (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setFormData(prev => ({ ...prev, [field]: value }));

    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: "" }));
    }
  };

  const handleBlur = (field: string) => (e: React.FocusEvent<HTMLInputElement>) => {
    const value = e.target.value;
    const error = validateField(field, value);
    setErrors(prev => ({ ...prev, [field]: error }));
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    let isValid = true;

    Object.keys(formData).forEach(field => {
      const error = validateField(field, formData[field as keyof typeof formData]);
      if (error) {
        newErrors[field] = error;
        isValid = false;
      }
    });

    setErrors(newErrors);
    return isValid;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      window.dispatchEvent(new CustomEvent('app:show-modal', {
        detail: {
          title: "Validation Error",
          description: "Please fix the errors in the form before submitting.",
          mode: 'error'
        }
      }));
      return;
    }

    if (isLoading) {
      return;
    }

    setIsLoading(true);

    // Create a separate axios instance for public requests (no authentication)
    const publicApi = axios.create({
      baseURL: "http://localhost:5000/api"
    });



    try {
      const response = await publicApi.post('/institution-requests/submit', formData);

      if (response.data.success) {
        setIsSuccessOpen(true);
      } else {
        throw new Error(response.data.message || 'Failed to submit request');
      }
    } catch (error: any) {
      console.error('Submission error:', error);
      console.error('Error response:', error.response);
      console.error('Error status:', error.response?.status);
      console.error('Error data:', error.response?.data);

      let errorMessage = error.response?.data?.message || 'Failed to submit institution request. Please try again.';

      window.dispatchEvent(new CustomEvent('app:show-modal', {
        detail: {
          title: "Submission Failed",
          description: errorMessage,
          mode: 'error'
        }
      }));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <style>
        {`
          @keyframes fadeIn {
            from {
              opacity: 0;
              transform: translateY(20px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }
        `}
      </style>

      <Box sx={{
        minHeight: "100vh",
        backgroundColor: "#f9f9f9ff",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        p: 2,
        animation: "fadeIn 0.5s ease-in-out"
      }}>
        <Paper
          elevation={3}
          sx={{
            maxWidth: 800,
            width: "100%",
            p: 4,
            borderRadius: 2,
            backgroundColor: "#FFFFFF"
          }}
        >
          <Typography
            variant="h4"
            align="center"
            sx={{
              fontWeight: 600,
              mb: 1,
              color: "#0F172A"
            }}
          >
            Request Institution Access
          </Typography>

          <Typography
            variant="body1"
            align="center"
            sx={{
              mb: 4,
              color: "#64748b",
              maxWidth: 600,
              mx: "auto"
            }}
          >
            Join the E-Clearance platform! Complete the form below to request access for your academic institution.
          </Typography>

          <Alert
            severity="info"
            sx={{ mb: 3 }}
          >
            <strong>Important:</strong> You must use an official institutional email address.
            Free email services (Gmail, Yahoo, etc.) are not accepted.
          </Alert>

          <form onSubmit={handleSubmit}>
            <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" }, gap: 3 }}>
              {/* Institution Information */}
              <Box sx={{ gridColumn: { xs: "1 / -1", md: "1 / -1" } }}>
                <Typography variant="h6" sx={{ mb: 2, color: "#0F172A" }}>
                  Institution Information
                </Typography>
              </Box>

              <TextField
                fullWidth
                label="Institution Name"
                value={formData.institutionName}
                onChange={handleInputChange("institutionName")}
                onBlur={handleBlur("institutionName")}
                error={!!errors.institutionName}
                helperText={errors.institutionName}
                disabled={isLoading}
                required
                sx={{ gridColumn: { xs: "1 / -1", md: "1 / -1" } }}
              />

              <TextField
                fullWidth
                label="Official Academic Domain"
                value={formData.academicDomain}
                onChange={handleInputChange("academicDomain")}
                onBlur={handleBlur("academicDomain")}
                error={!!errors.academicDomain}
                helperText={errors.academicDomain || "e.g., university.edu.ph"}
                disabled={isLoading}
                required
                placeholder="university.edu.ph"
              />

              <TextField
                fullWidth
                label="Physical Address"
                value={formData.physicalAddress}
                onChange={handleInputChange("physicalAddress")}
                onBlur={handleBlur("physicalAddress")}
                error={!!errors.physicalAddress}
                helperText={errors.physicalAddress}
                disabled={isLoading}
                required
                multiline
                rows={2}
              />

              <TextField
                fullWidth
                label="Official Contact Number"
                value={formData.contactNumber}
                onChange={handleInputChange("contactNumber")}
                onBlur={handleBlur("contactNumber")}
                error={!!errors.contactNumber}
                helperText={errors.contactNumber || "e.g., +63212345678"}
                disabled={isLoading}
                required
              />

              {/* Administrator Information */}
              <Box sx={{ gridColumn: { xs: "1 / -1", md: "1 / -1" }, mt: 2 }}>
                <Typography variant="h6" sx={{ mb: 2, color: "#0F172A" }}>
                  Administrator Information
                </Typography>
              </Box>

              <TextField
                fullWidth
                label="Administrator Full Name"
                value={formData.administratorName}
                onChange={handleInputChange("administratorName")}
                onBlur={handleBlur("administratorName")}
                error={!!errors.administratorName}
                helperText={errors.administratorName}
                disabled={isLoading}
                required
              />

              <TextField
                fullWidth
                label="Administrator Position"
                value={formData.administratorPosition}
                onChange={handleInputChange("administratorPosition")}
                onBlur={handleBlur("administratorPosition")}
                error={!!errors.administratorPosition}
                helperText={errors.administratorPosition || "e.g., IT Director, Dean, etc."}
                disabled={isLoading}
                required
              />

              <TextField
                fullWidth
                label="Institutional Email Address"
                value={formData.administratorEmail}
                onChange={handleInputChange("administratorEmail")}
                onBlur={handleBlur("administratorEmail")}
                error={!!errors.administratorEmail}
                helperText={errors.administratorEmail || `Must match domain: @${formData.academicDomain || "your.domain"}`}
                disabled={isLoading}
                required
                type="email"
                sx={{ gridColumn: { xs: "1 / -1", md: "1 / -1" } }}
              />
            </Box>

            <Divider sx={{ my: 3 }} />

            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mt: 3 }}>
              <Button
                variant="outlined"
                onClick={() => navigate('/')}
                disabled={isLoading}
                sx={{
                  color: "#0F172A",
                  borderColor: "#E2E8F0",
                  borderRadius: '999px',
                  textTransform: 'none',
                  px: 5,
                  py: 1.5,
                  fontWeight: 700,
                  boxShadow: '0 20px 30px -10px rgba(0,0,0,0.1), 0 10px 15px -5px rgba(0,0,0,0.05)',
                  backgroundColor: '#FFF',
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  "&:hover": {
                    borderColor: "#D1D5DB",
                    backgroundColor: "#f8fafc",
                    boxShadow: '0 30px 45px -12px rgba(0,0,0,0.15), 0 15px 20px -8px rgba(0,0,0,0.08)',
                    transform: 'translateY(-3px)'
                  }
                }}
              >
                Cancel
              </Button>

              <Button
                type="submit"
                variant="contained"
                disabled={isLoading}
                startIcon={isLoading ? <CircularProgress size={20} /> : null}
                sx={{
                  backgroundColor: "#3c4043",
                  color: "#FFFFFF",
                  px: 5,
                  py: 1.5,
                  borderRadius: '999px',
                  textTransform: 'none',
                  fontWeight: 700,
                  boxShadow: '0 20px 30px -10px rgba(15,23,42,0.35), 0 10px 15px -5px rgba(15,23,42,0.15)',
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  "&:hover": {
                    backgroundColor: "#3c4043",
                    boxShadow: '0 30px 45px -12px rgba(15,23,42,0.45), 0 15px 20px -8px rgba(15,23,42,0.25)',
                    transform: 'translateY(-3px)'
                  },
                  "&:disabled": {
                    backgroundColor: "#94a3b8"
                  }
                }}
              >
                {isLoading ? "Submitting..." : "Submit Request"}
              </Button>
            </Box>
          </form>

          <Box sx={{ mt: 3, textAlign: "center" }}>
            <Typography variant="caption" sx={{ color: "#64748b" }}>
              By submitting this request, you confirm that you are authorized to represent this institution
              and that all provided information is accurate.
            </Typography>
          </Box>
        </Paper>
      </Box>

      <SuccessActionModal
        open={isSuccessOpen}
        onClose={() => navigate('/')}
        title="Email Confirmation"
        description={`We have sent an email to ${formData.administratorEmail} to confirm the validity of your administrative request. Please follow the link provided in that mail to complete your registration.`}
      />
    </>
  );
}
