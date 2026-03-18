import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import "sweetalert2/dist/sweetalert2.min.css";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import Alert from "@mui/material/Alert";
import CircularProgress from "@mui/material/CircularProgress";
import Paper from "@mui/material/Paper";
import { api } from '../../services';

export default function VerifyInstitution() {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const [isVerifying, setIsVerifying] = useState(true);
  const [verificationStatus, setVerificationStatus] = useState<'loading' | 'success' | 'error' | 'invalid'>('loading');
  const [institutionName, setInstitutionName] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    const verifyRequest = async () => {
      if (!token) {
        setVerificationStatus('invalid');
        setErrorMessage('Verification token is missing');
        setIsVerifying(false);
        return;
      }

      try {
        const response = await api.get(`/institution-requests/verify/${token}`);

        if (response.data.success) {
          setVerificationStatus('success');
          setInstitutionName(response.data.data.institutionName);

          Swal.fire({
            icon: "success",
            title: "Email Verified Successfully!",
            html: `
              <div>
                <p>Your email for <strong>${response.data.data.institutionName}</strong> has been verified.</p>
                <p>Your request is now pending review by our administrators.</p>
                <p>You will receive another email once a decision has been made.</p>
              </div>
            `,
            confirmButtonText: "Got it!",
            confirmButtonColor: "#0F172A"
          });
        } else {
          setVerificationStatus('error');
          setErrorMessage(response.data.message || 'Verification failed');
        }
      } catch (error: any) {
        console.error('Verification error:', error);
        setVerificationStatus('error');

        if (error.response?.status === 400) {
          setErrorMessage(error.response.data.message || 'Invalid or expired verification token');
        } else {
          setErrorMessage('Failed to verify request. Please try again or contact support.');
        }
      } finally {
        setIsVerifying(false);
      }
    };

    verifyRequest();
  }, [token]);

  const handleGoHome = () => {
    navigate('/');
  };

  const handleRequestNew = () => {
    navigate('/request-institution-access');
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
          @keyframes pulse {
            0%, 100% {
              transform: scale(1);
            }
            50% {
              transform: scale(1.05);
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
            maxWidth: 600,
            width: "100%",
            p: 4,
            borderRadius: 2,
            backgroundColor: "#FFFFFF",
            textAlign: "center"
          }}
        >
          {isVerifying ? (
            <>
              <CircularProgress
                size={80}
                thickness={4}
                sx={{
                  color: "#0F172A",
                  mb: 3,
                  animation: "pulse 2s infinite"
                }}
              />
              <Typography
                variant="h5"
                sx={{
                  fontWeight: 600,
                  mb: 2,
                  color: "#0F172A"
                }}
              >
                Verifying Your Email...
              </Typography>
              <Typography
                variant="body1"
                sx={{
                  color: "#64748b",
                  mb: 3
                }}
              >
                Please wait while we verify your institution request.
              </Typography>
            </>
          ) : verificationStatus === 'success' ? (
            <>
              <Typography
                variant="h1"
                sx={{
                  fontSize: 80,
                  color: "#10b981",
                  mb: 3
                }}
              >
                ✅
              </Typography>
              <Typography
                variant="h5"
                sx={{
                  fontWeight: 600,
                  mb: 2,
                  color: "#0F172A"
                }}
              >
                Email Verified Successfully!
              </Typography>
              <Typography
                variant="body1"
                sx={{
                  color: "#64748b",
                  mb: 1
                }}
              >
                Thank you for verifying your email for <strong>{institutionName}</strong>.
              </Typography>
              <Typography
                variant="body1"
                sx={{
                  color: "#64748b",
                  mb: 3
                }}
              >
                Your request is now under review by our administrators. You'll receive an email once a decision has been made.
              </Typography>

              <Alert
                severity="info"
                sx={{ mb: 3, textAlign: 'left' }}
              >
                <strong>What happens next?</strong>
                <ul style={{ margin: '8px 0 0 0', paddingLeft: '20px' }}>
                  <li>Our team will review your institution request</li>
                  <li>You'll receive an email with the decision</li>
                  <li>If approved, your institution can start using E-Clearance</li>
                </ul>
              </Alert>

              <Button
                variant="contained"
                onClick={handleGoHome}
                sx={{
                  backgroundColor: "#0F172A",
                  color: "#FFFFFF",
                  px: 4,
                  py: 1.5,
                  "&:hover": {
                    backgroundColor: "#111827"
                  }
                }}
              >
                Go to Homepage
              </Button>
            </>
          ) : (
            <>
              <Typography
                variant="h1"
                sx={{
                  fontSize: 80,
                  color: "#dc2626",
                  mb: 3
                }}
              >
                ❌
              </Typography>
              <Typography
                variant="h5"
                sx={{
                  fontWeight: 600,
                  mb: 2,
                  color: "#dc2626"
                }}
              >
                Verification Failed
              </Typography>

              <Alert
                severity="error"
                sx={{ mb: 3, textAlign: 'left' }}
              >
                {errorMessage}
              </Alert>

              <Typography
                variant="body1"
                sx={{
                  color: "#64748b",
                  mb: 3
                }}
              >
                The verification link may have expired or is invalid. Please submit a new request if needed.
              </Typography>

              <Box sx={{ display: "flex", gap: 2, justifyContent: "center", flexWrap: "wrap" }}>
                <Button
                  variant="outlined"
                  onClick={handleRequestNew}
                  sx={{
                    color: "#0F172A",
                    borderColor: "#0F172A",
                    "&:hover": {
                      borderColor: "#111827",
                      backgroundColor: "#f8fafc"
                    }
                  }}
                >
                  Submit New Request
                </Button>

                <Button
                  variant="contained"
                  onClick={handleGoHome}
                  sx={{
                    backgroundColor: "#0F172A",
                    color: "#FFFFFF",
                    "&:hover": {
                      backgroundColor: "#111827"
                    }
                  }}
                >
                  Go to Homepage
                </Button>
              </Box>
            </>
          )}
        </Paper>
      </Box>
    </>
  );
}
