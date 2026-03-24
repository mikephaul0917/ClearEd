/**
 * Super Admin main page with navigation and role-based access control
 * Handles routing for Super Admin specific features
 */

import { useEffect, useState, useMemo } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { authService } from "../../services";
import Swal from "sweetalert2";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import Divider from "@mui/material/Divider";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import TextField from "@mui/material/TextField";
import { useTheme, useMediaQuery, Skeleton } from "@mui/material";
import PersonIcon from "@mui/icons-material/Person";
import SecurityIcon from "@mui/icons-material/Security";

import SuperAdminInstitutionRequests from "./SuperAdminInstitutionRequests";
import InstitutionMonitoring from "./InstitutionMonitoring";
import SystemAnalytics from "./SystemAnalytics";
import AuditLogs from "./AuditLogs";
import SuperAdminAnnouncements from "./SuperAdminAnnouncements";
import RoleLayout from "../../components/layout/RoleLayout";

// --- MODERN BENTO DESIGN SYSTEM ---
const COLORS = {
  pageBg: '#FFFFFF',
  surface: '#FFFFFF',
  black: '#0a0a0a',
  textPrimary: '#000000',
  textSecondary: '#64748B',
  accent: '#0a0a0a',
  teal: '#5eead4',
  lavender: '#d8b4fe',
  yellow: '#FEF08A',
  orange: '#ff895d',
  border: '#E2E8F0',
  tableHead: '#F8FAFC',
  avatarBg: '#0F172A10',
  cardRadius: '16px',
  pillRadius: '999px',
};

const fontStack = "'Inter', 'Plus Jakarta Sans', 'Montserrat', sans-serif";

export default function SuperAdminPage() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const isSmallMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const location = useLocation();
  const nav = useNavigate();
  const [profileFirst, setProfileFirst] = useState("");
  const [profileLast, setProfileLast] = useState("");
  const [draftFirst, setDraftFirst] = useState("");
  const [draftLast, setDraftLast] = useState("");
  const [newPass, setNewPass] = useState("");
  const [confirmPass, setConfirmPass] = useState("");
  const [loadingDashboard, setLoadingDashboard] = useState(true);
  const [loadingSettings, setLoadingSettings] = useState(true);
  const [sidebarLoading, setSidebarLoading] = useState(true);

  // Clear password fields on component mount and force reset on every render
  useEffect(() => {
    setNewPass("");
    setConfirmPass("");
    // Also clear any localStorage password data
    localStorage.removeItem("tempPassword");
    localStorage.removeItem("tempNewPassword");
  }, []);

  // Additional force reset on every render to prevent browser autofill
  useEffect(() => {
    setNewPass("");
    setConfirmPass("");
  }, [location.pathname]); // Reset when navigating to settings page

  const token = typeof localStorage !== "undefined" ? localStorage.getItem("token") : null;
  const email = typeof localStorage !== "undefined" ? (localStorage.getItem("email") || "superadmin@example.com") : "superadmin@example.com";

  const isSuperAdmin = useMemo(() => {
    if (!token) return false;
    try {
      const base64 = token.split(".")[1];
      if (!base64) return false;
      const json = JSON.parse(atob(base64.replace(/-/g, "+").replace(/_/g, "/")));
      return json.role === "super_admin";
    } catch {
      return false;
    }
  }, [token]);

  const isInstitutionRequests = location.pathname.includes("/institution-requests");
  const isInstitutionMonitoring = location.pathname.includes("/institution-monitoring");
  const isSystemAnalytics = location.pathname.includes("/system-analytics");
  const isAuditLogs = location.pathname.includes("/audit-logs");
  const isAnnouncements = location.pathname.includes("/announcements");
  const isSettings = location.pathname.includes("/settings");
  const active = isInstitutionRequests ? "institution-requests" : isInstitutionMonitoring ? "institution-monitoring" : isSystemAnalytics ? "system-analytics" : isAuditLogs ? "audit-logs" : isAnnouncements ? "announcements" : isSettings ? "settings" : "dashboard";

  useEffect(() => {
    if (location.pathname === "/super-admin") {
      nav("/super-admin/dashboard", { replace: true });
    }
  }, [location.pathname, nav]);

  // Simple skeleton loader for dashboard view
  useEffect(() => {
    if (location.pathname.includes("/dashboard") || location.pathname === "/super-admin") {
      setLoadingDashboard(true);
      const timer = setTimeout(() => setLoadingDashboard(false), 600);
      return () => clearTimeout(timer);
    }
    setLoadingDashboard(false);
  }, [location.pathname]);

  // Skeleton loader for settings view
  useEffect(() => {
    if (location.pathname.includes("/settings")) {
      setLoadingSettings(true);
      const timer = setTimeout(() => setLoadingSettings(false), 1000);
      return () => clearTimeout(timer);
    }
    setLoadingSettings(false);
  }, [location.pathname]);

  useEffect(() => {
    try {
      const storedUserStr = localStorage.getItem("user");
      const fullUser = storedUserStr ? JSON.parse(storedUserStr) : null;
      const savedUsername = localStorage.getItem("username") || fullUser?.fullName || fullUser?.firstName || "";
      const base = savedUsername || (email || "").split("@")[0];
      const parts = base.replace(/[._-]+/g, " ").split(" ").filter(Boolean);
      const first = parts[0] || "";
      const last = parts.slice(1).join(" ") || "";
      setProfileFirst(first);
      setProfileLast(last);
      setDraftFirst(first);
      setDraftLast(last);
    } catch { }
    setSidebarLoading(false);
  }, [email]);

  const fullName = useMemo(() => {
    const cap = (s: string) => s ? s.charAt(0).toUpperCase() + s.slice(1) : "";
    const composed = [cap(profileFirst.trim()), cap(profileLast.trim())].filter(Boolean).join(" ");
    if (composed) return composed;
    const local = (email || "").split("@")[0];
    const parts = local.replace(/[._-]+/g, " ").split(" ").filter(Boolean);
    const name = parts.map(cap).join(" ");
    return name || "Super Admin";
  }, [profileFirst, profileLast, email]);

  const initials = useMemo(() => {
    const words = fullName.split(" ").filter(Boolean);
    return words.length >= 2
      ? words[0][0] + words[1][0]
      : words[0] ? words[0].slice(0, 2) : "SA";
  }, [fullName]);

  const logout = () => {
    authService.logout();
    nav("/register");
  };

  const updateProfile = async () => {
    try {
      const newUsername = `${draftFirst.trim()} ${draftLast.trim()}`.trim();
      if (!newUsername) {
        return;
      }

      await authService.updateProfile(newUsername);

      // Persist and update local state based on the new username
      localStorage.setItem("username", newUsername);

      const parts = newUsername.replace(/[._-]+/g, " ").split(" ").filter(Boolean);
      const first = parts[0] || "";
      const last = parts.slice(1).join(" ") || "";

      setProfileFirst(first);
      setProfileLast(last);
      setDraftFirst(first);
      setDraftLast(last);
      Swal.fire("Success", "Profile updated successfully", "success");
    } catch (error: any) {
      console.error("Profile update failed:", error);
      Swal.fire(
        "Error",
        error?.response?.data?.message || "Failed to update profile",
        "error"
      );
    }
  };

  const changePassword = async () => {
    try {
      if (!newPass.trim() || !confirmPass.trim()) {
        Swal.fire("Error", "Please fill in all required password fields", "error");
        return;
      }

      if (newPass !== confirmPass) {
        Swal.fire("Error", "New password and confirmation do not match", "error");
        return;
      }

      await authService.updatePassword({
        newPassword: newPass
      });
      setNewPass("");
      setConfirmPass("");
      Swal.fire("Success", "Password updated successfully", "success");
    } catch (error: any) {
      console.error("Password change failed:", error);
      Swal.fire(
        "Error",
        error?.response?.data?.message || "Failed to change password",
        "error"
      );
    }
  };

  // Redirect non-super-admin users
  if (!isSuperAdmin) {
    return (
      <Box p={3}>
        <Typography variant="h6" color="error" sx={{ mb: 2 }}>
          Access Denied: Super Admin privileges required. If you believe this is an error, please contact support.
        </Typography>
        <Button
          variant="outlined"
          href="mailto:support@eclearance.app"
          sx={{ borderColor: '#0F172A', color: '#0F172A' }}
        >
          Contact Support
        </Button>
      </Box>
    );
  }

  const renderContent = () => {
    if (isInstitutionRequests) {
      return <SuperAdminInstitutionRequests />;
    }

    if (isInstitutionMonitoring) {
      return <InstitutionMonitoring />;
    }

    if (isSystemAnalytics) {
      return <SystemAnalytics />;
    }

    if (isAuditLogs) {
      return <AuditLogs />;
    }

    if (isAnnouncements) {
      return <SuperAdminAnnouncements />;
    }

    if (isSettings) {
      if (loadingSettings) {
        return (
          <Box sx={{
            backgroundColor: '#FAFAFA',
            minHeight: '100vh',
            py: isSmallMobile ? 2 : 4,
            px: isSmallMobile ? 1 : 0
          }}>
            <Box sx={{ maxWidth: '800px', mx: 'auto', px: isSmallMobile ? 2 : 4, mb: isSmallMobile ? 4 : 6 }}>
              <Skeleton variant="text" width={220} height={isSmallMobile ? 32 : 40} sx={{ mb: 1 }} />
              <Skeleton variant="text" width={320} height={isSmallMobile ? 18 : 22} />
            </Box>

            <Box sx={{ maxWidth: '800px', mx: 'auto', px: isSmallMobile ? 2 : 4, display: 'flex', flexDirection: 'column', gap: isSmallMobile ? 2 : 3 }}>
              <Card sx={{ borderRadius: '12px', border: '1px solid #D1D5DB', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                <CardContent sx={{ p: isSmallMobile ? 3 : 6 }}>
                  <Skeleton variant="rectangular" height={40} width="50%" sx={{ mb: 3, borderRadius: 2 }} />
                  <Skeleton variant="text" width="30%" height={18} sx={{ mb: 1 }} />
                  <Skeleton variant="rectangular" height={48} sx={{ mb: 2, borderRadius: 1 }} />
                  <Skeleton variant="text" width="30%" height={18} sx={{ mb: 1 }} />
                  <Skeleton variant="rectangular" height={48} sx={{ mb: 3, borderRadius: 1 }} />
                  <Skeleton variant="rectangular" height={40} width={140} sx={{ borderRadius: 2 }} />
                </CardContent>
              </Card>

              <Card sx={{ borderRadius: '12px', border: '1px solid #D1D5DB', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                <CardContent sx={{ p: isSmallMobile ? 3 : 6 }}>
                  <Skeleton variant="rectangular" height={40} width="40%" sx={{ mb: 3, borderRadius: 2 }} />
                  {[1, 2, 3].map((i) => (
                    <Box key={i} sx={{ mb: 2 }}>
                      <Skeleton variant="text" width="30%" height={18} sx={{ mb: 1 }} />
                      <Skeleton variant="rectangular" height={48} sx={{ borderRadius: 1 }} />
                    </Box>
                  ))}
                  <Skeleton variant="rectangular" height={40} width={160} sx={{ mt: 1, borderRadius: 2 }} />
                </CardContent>
              </Card>
            </Box>
          </Box>
        );
      }

      return (
        <Box sx={{
          backgroundColor: '#FAFAFA',
          minHeight: '100vh',
          py: isSmallMobile ? 2 : 4,
          px: isSmallMobile ? 1 : 0
        }}>
          {/* Header Section */}
          <Box sx={{
            maxWidth: '800px',
            mx: 'auto',
            px: isSmallMobile ? 2 : 4,
            mb: isSmallMobile ? 4 : 6
          }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1 }}>
              <Typography variant="h4" sx={{ fontWeight: 800, color: '#000' }}>
                Settings
              </Typography>
            </Box>
            <Typography variant="body1" sx={{ color: '#6B7280', fontSize: '1.05rem', mb: 3 }}>
              Manage your account settings and preferences
            </Typography>
          </Box>

          {/* Cards Container */}
          <Box sx={{
            maxWidth: '800px',
            mx: 'auto',
            px: isSmallMobile ? 2 : 4,
            display: 'flex',
            flexDirection: 'column',
            gap: isSmallMobile ? 2 : 3
          }}>

            {/* Profile Card */}
            <Card sx={{
              backgroundColor: '#FFFFFF',
              border: '1px solid #D1D5DB',
              borderRadius: '12px',
              boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
              p: 0
            }}>
              <CardContent sx={{ p: isSmallMobile ? 3 : 6 }}>
                <Box sx={{ mb: 4, display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Box sx={{
                    width: isSmallMobile ? 40 : 48,
                    height: isSmallMobile ? 40 : 48,
                    borderRadius: '12px',
                    backgroundColor: '#F3F4F6',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <PersonIcon sx={{ fontSize: isSmallMobile ? 20 : 24, color: '#374151' }} />
                  </Box>
                  <Box>
                    <Typography
                      variant={isSmallMobile ? "h6" : "h5"}
                      sx={{
                        fontWeight: 600,
                        fontSize: isSmallMobile ? '1.125rem' : '1.25rem',
                        color: '#000000',
                        mb: 0.5
                      }}
                    >
                      Profile Information
                    </Typography>
                    <style>{`
                      input:-webkit-autofill,
                      input:-webkit-autofill:hover,
                      input:-webkit-autofill:focus {
                        -webkit-box-shadow: 0 0 0px 1000px #FFFFFF inset !important;
                        -webkit-text-fill-color: #000000 !important;
                        transition: background-color 5000s ease-in-out 0s;
                      }
                    `}</style>
                    <Typography
                      variant="body2"
                      sx={{
                        color: '#6B7280',
                        fontSize: isSmallMobile ? '0.75rem' : '0.875rem'
                      }}
                    >
                      Update your personal information and profile details
                    </Typography>
                  </Box>
                </Box>

                <Box component="form" autoComplete="off" sx={{ display: "flex", flexDirection: "column", gap: isSmallMobile ? 3 : 4 }}>
                  {/* Honey-pot fields to catch aggressive autofill */}
                  <input type="text" name="email" style={{ display: 'none' }} tabIndex={-1} />
                  <input type="password" name="password" style={{ display: 'none' }} tabIndex={-1} />

                  <Box>
                    <Typography
                      variant="body2"
                      sx={{
                        mb: 1.5,
                        color: '#374151',
                        fontWeight: 500,
                        fontSize: '0.875rem'
                      }}
                    >
                      First Name
                    </Typography>
                    <TextField
                      fullWidth
                      name="first-name"
                      autoComplete="given-name"
                      value={draftFirst}
                      onChange={(e) => setDraftFirst(e.target.value)}
                      variant="outlined"
                      placeholder="Enter your first name"
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          borderRadius: '8px',
                          backgroundColor: '#FFFFFF',
                          '& fieldset': {
                            borderColor: '#D1D5DB',
                          },
                          '&:hover fieldset': {
                            borderColor: '#9CA3AF',
                          },
                          '&.Mui-focused fieldset': {
                            borderColor: '#000000',
                          },
                        },
                        '& .MuiInputBase-input': {
                          fontSize: isSmallMobile ? '0.875rem' : '1rem',
                          color: '#000000',
                        }
                      }}
                    />
                  </Box>

                  <Box>
                    <Typography
                      variant="body2"
                      sx={{
                        mb: 1.5,
                        color: '#374151',
                        fontWeight: 500,
                        fontSize: '0.875rem'
                      }}
                    >
                      Last Name
                    </Typography>
                    <TextField
                      fullWidth
                      name="last-name"
                      autoComplete="family-name"
                      value={draftLast}
                      onChange={(e) => setDraftLast(e.target.value)}
                      variant="outlined"
                      placeholder="Enter your last name"
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          borderRadius: '8px',
                          backgroundColor: '#FFFFFF',
                          '& fieldset': {
                            borderColor: '#D1D5DB',
                          },
                          '&:hover fieldset': {
                            borderColor: '#9CA3AF',
                          },
                          '&.Mui-focused fieldset': {
                            borderColor: '#000000',
                          },
                        },
                        '& .MuiInputBase-input': {
                          fontSize: isSmallMobile ? '0.875rem' : '1rem',
                          color: '#000000',
                        }
                      }}
                    />
                  </Box>

                  <Box>
                    <Typography
                      variant="body2"
                      sx={{
                        mb: 1.5,
                        color: '#374151',
                        fontWeight: 500,
                        fontSize: '0.875rem'
                      }}
                    >
                      Email Address
                    </Typography>
                    <TextField
                      fullWidth
                      name="real-email"
                      autoComplete="email"
                      value={email}
                      variant="outlined"
                      placeholder="Enter your email address"
                      disabled
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          borderRadius: '8px',
                          backgroundColor: '#FFFFFF',
                          '& fieldset': {
                            borderColor: '#D1D5DB',
                          },
                          '&:hover fieldset': {
                            borderColor: '#9CA3AF',
                          },
                          '&.Mui-focused fieldset': {
                            borderColor: '#000000',
                          },
                        },
                        '& .MuiInputBase-input': {
                          fontSize: isSmallMobile ? '0.875rem' : '1rem',
                          color: '#000000',
                        }
                      }}
                    />
                  </Box>

                  <Box sx={{ mt: 2 }}>
                    <Button
                      variant="contained"
                      onClick={(e) => { e.preventDefault(); updateProfile(); }}
                      type="submit"
                      sx={{
                        backgroundColor: '#000000',
                        color: '#FFFFFF',
                        fontWeight: 500,
                        fontSize: isSmallMobile ? '0.75rem' : '0.875rem',
                        py: isSmallMobile ? 1.5 : 2,
                        px: isSmallMobile ? 3 : 4,
                        borderRadius: '8px',
                        textTransform: 'none',
                        '&:hover': {
                          backgroundColor: '#111111',
                        },
                        '&:active': {
                          backgroundColor: '#000000',
                        }
                      }}
                    >
                      Update Profile
                    </Button>
                  </Box>
                </Box>
              </CardContent>
            </Card>

            {/* Security Card */}
            <Card sx={{
              backgroundColor: '#FFFFFF',
              border: '1px solid #D1D5DB',
              borderRadius: '12px',
              boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
              p: 0
            }}>
              <CardContent sx={{ p: 6 }}>
                <Box sx={{ mb: 4, display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Box sx={{
                    width: 48,
                    height: 48,
                    borderRadius: '12px',
                    backgroundColor: '#F3F4F6',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <SecurityIcon sx={{ fontSize: 24, color: '#374151' }} />
                  </Box>
                  <Box>
                    <Typography
                      variant="h5"
                      sx={{
                        fontWeight: 600,
                        fontSize: '1.25rem',
                        color: '#000000',
                        mb: 0.5
                      }}
                    >
                      Security
                    </Typography>
                    <Typography
                      variant="body2"
                      sx={{
                        color: '#6B7280',
                        fontSize: '0.875rem'
                      }}
                    >
                      Manage your password and security preferences
                    </Typography>
                  </Box>
                </Box>

                <Box sx={{ display: "flex", flexDirection: "column", gap: isSmallMobile ? 3 : 4 }}>

                  <Box>
                    <Typography
                      variant="body2"
                      sx={{
                        mb: 1.5,
                        color: '#374151',
                        fontWeight: 500,
                        fontSize: '0.875rem'
                      }}
                    >
                      New Password
                    </Typography>
                    <TextField
                      type="password"
                      fullWidth
                      value={newPass}
                      onChange={(e) => setNewPass(e.target.value)}
                      variant="outlined"
                      placeholder="Enter new password"
                      key="new-password-field"
                      autoComplete="new-password"
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          borderRadius: '8px',
                          backgroundColor: '#FFFFFF',
                          '& fieldset': {
                            borderColor: '#D1D5DB',
                          },
                          '&:hover fieldset': {
                            borderColor: '#9CA3AF',
                          },
                          '&.Mui-focused fieldset': {
                            borderColor: '#000000',
                          },
                        },
                        '& .MuiInputBase-input': {
                          fontSize: isSmallMobile ? '0.875rem' : '1rem',
                          color: '#000000',
                        }
                      }}
                    />
                  </Box>

                  <Box>
                    <Typography
                      variant="body2"
                      sx={{
                        mb: 1.5,
                        color: '#374151',
                        fontWeight: 500,
                        fontSize: '0.875rem'
                      }}
                    >
                      Confirm New Password
                    </Typography>
                    <TextField
                      type="password"
                      fullWidth
                      value={confirmPass}
                      onChange={(e) => setConfirmPass(e.target.value)}
                      variant="outlined"
                      placeholder="Confirm new password"
                      key="confirm-password-field"
                      autoComplete="new-password"
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          borderRadius: '8px',
                          backgroundColor: '#FFFFFF',
                          '& fieldset': {
                            borderColor: '#D1D5DB',
                          },
                          '&:hover fieldset': {
                            borderColor: '#9CA3AF',
                          },
                          '&.Mui-focused fieldset': {
                            borderColor: '#000000',
                          },
                        },
                        '& .MuiInputBase-input': {
                          fontSize: isSmallMobile ? '0.875rem' : '1rem',
                          color: '#000000',
                        }
                      }}
                    />
                  </Box>

                  <Box sx={{ mt: 2 }}>
                    <Button
                      variant="contained"
                      onClick={changePassword}
                      sx={{
                        backgroundColor: '#000000',
                        color: '#FFFFFF',
                        fontWeight: 500,
                        fontSize: isSmallMobile ? '0.75rem' : '0.875rem',
                        py: isSmallMobile ? 1.5 : 2,
                        px: isSmallMobile ? 3 : 4,
                        borderRadius: '8px',
                        textTransform: 'none',
                        '&:hover': {
                          backgroundColor: '#111111',
                        },
                        '&:active': {
                          backgroundColor: '#000000',
                        }
                      }}
                    >
                      Change Password
                    </Button>
                  </Box>
                </Box>
              </CardContent>
            </Card>

          </Box>
        </Box>
      );
    }

    // Default dashboard
    if (loadingDashboard) {
      return (
        <Box sx={{
          p: isSmallMobile ? 2 : 4,
          backgroundColor: COLORS.pageBg,
          minHeight: '100vh',
          fontFamily: fontStack,
        }}>
          {/* Header skeleton */}
          <Skeleton variant="text" width={240} height={isSmallMobile ? 36 : 48} sx={{ mb: 0.5, borderRadius: '8px' }} />
          <Skeleton variant="text" width={300} height={isSmallMobile ? 18 : 22} sx={{ mb: 3, borderRadius: '8px' }} />

          {/* Bento Row 1 skeleton */}
          <Box sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', md: '2fr 1fr' },
            gap: 2,
            mb: 2,
          }}>
            <Skeleton variant="rounded" height={isSmallMobile ? 180 : 220} sx={{ borderRadius: COLORS.cardRadius }} />
            <Box sx={{ display: 'grid', gridTemplateRows: '1fr 1fr', gap: 2 }}>
              <Skeleton variant="rounded" height="100%" sx={{ borderRadius: COLORS.cardRadius }} />
              <Skeleton variant="rounded" height="100%" sx={{ borderRadius: COLORS.cardRadius }} />
            </Box>
          </Box>

          {/* Bento Row 2 skeleton */}
          <Skeleton variant="text" width={140} height={20} sx={{ mb: 1.5, mt: 3, borderRadius: '8px' }} />
          <Box sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(3, 1fr)' },
            gap: 2,
          }}>
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Skeleton key={i} variant="rounded" height={isSmallMobile ? 140 : 160} sx={{ borderRadius: COLORS.cardRadius }} />
            ))}
          </Box>
        </Box>
      );
    }

    // ── Nav‑card data ──────────────────────────────────────────────────────
    const navCards = [
      {
        title: 'Institution Requests',
        desc: 'Review and approve new institution applications',
        path: '/super-admin/institution-requests',
        accent: COLORS.teal,
        icon: <path d="M3 21h18M5 21V7l7-4 7 4v14M9 21v-6h6v6" />,
      },
      {
        title: 'Institution Monitoring',
        desc: 'Track institution activity and manage system tenants',
        path: '/super-admin/institution-monitoring',
        accent: COLORS.lavender,
        icon: <><rect x="2" y="10" width="20" height="12" rx="2" /><path d="M6 10V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v6" /><path d="M10 10h4" /></>,
      },
      {
        title: 'System Analytics',
        desc: 'Performance metrics and usage insights',
        path: '/super-admin/system-analytics',
        accent: COLORS.yellow,
        icon: <><path d="M3 3v18h18" /><path d="M7 14v4M12 10v8M17 6v12" /></>,
      },
      {
        title: 'Announcements',
        desc: 'Publish system-wide updates to all users',
        path: '/super-admin/announcements',
        accent: COLORS.orange,
        icon: <><path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.7 21a2 2 0 0 1-3.4 0" /></>,
      },
      {
        title: 'Audit Logs',
        desc: 'Full administrative activity history',
        path: '/super-admin/audit-logs',
        accent: COLORS.teal,
        icon: <><circle cx="12" cy="12" r="9" /><path d="M12 8v4l3 3" /></>,
      },
      {
        title: 'Settings',
        desc: 'Account and system preferences',
        path: '/super-admin/settings',
        accent: COLORS.lavender,
        icon: <><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09a1.65 1.65 0 0 0-1-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06A2 2 0 1 1 3.4 19l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H2a2 2 0 1 1 0-4h.09a1.65 1.65 0 0 0 1.51-1 1.65 1.65 0 0 0-.33-1.82L3.2 6.2A2 2 0 1 1 6.03 3.4l.06.06a1.65 1.65 0 0 0 1.82.33h.01A1.65 1.65 0 0 0 9 2.28V2a2 2 0 1 1 4 0v.09c0 .7.4 1.34 1.03 1.64.63.3 1.37.2 1.88-.3l.06-.06A2 2 0 1 1 20.6 6.03l-.06.06a1.65 1.65 0 0 0-.33 1.82v.01c.3.63.94 1.03 1.64 1.03H22a2 2 0 1 1 0 4h-.09c-.7 0-1.34.4-1.64 1.03z" /></>,
      },
    ];

    return (
      <Box sx={{
        p: isSmallMobile ? 2 : 4,
        backgroundColor: COLORS.pageBg,
        minHeight: '100vh',
        fontFamily: fontStack,
      }}>
        {/* ── Header ──────────────────────────────────────────────────── */}
        <Typography
          sx={{
            fontFamily: fontStack,
            fontWeight: 800,
            fontSize: isSmallMobile ? '1.5rem' : '2.25rem',
            letterSpacing: '-0.03em',
            color: COLORS.textPrimary,
            lineHeight: 1.15,
          }}
        >
          Dashboard
        </Typography>
        <Typography
          sx={{
            fontFamily: fontStack,
            fontSize: isSmallMobile ? 13 : 16,
            color: COLORS.textSecondary,
            mb: 3,
            mt: 0.5,
          }}
        >
          System overview and administration tools
        </Typography>

        {/* ── Bento Row 1 — Hero Stats ────────────────────────────────── */}
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', md: '2fr 1fr' },
            gap: 2,
            mb: 2,
          }}
        >
          {/* Hero Card — Black */}
          <Box
            sx={{
              position: 'relative',
              backgroundColor: COLORS.black,
              borderRadius: COLORS.cardRadius,
              p: isSmallMobile ? 3 : 4,
              minHeight: isSmallMobile ? 180 : 220,
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              overflow: 'hidden',
            }}
          >
            {/* Decorative blurred accent circles */}
            <Box sx={{
              position: 'absolute', top: -40, right: -40, width: 160, height: 160,
              borderRadius: '50%', backgroundColor: COLORS.teal, opacity: 0.12,
              filter: 'blur(50px)', pointerEvents: 'none',
            }} />
            <Box sx={{
              position: 'absolute', bottom: -30, left: -30, width: 120, height: 120,
              borderRadius: '50%', backgroundColor: COLORS.lavender, opacity: 0.10,
              filter: 'blur(40px)', pointerEvents: 'none',
            }} />

            <Box sx={{ position: 'relative', zIndex: 1 }}>
              <Box sx={{
                display: 'inline-block',
                fontFamily: fontStack, fontSize: 11, fontWeight: 700,
                letterSpacing: '0.1em', textTransform: 'uppercase',
                color: 'rgba(255,255,255,0.45)', mb: 1.5,
              }}>
                Overview
              </Box>
              <Typography sx={{
                fontFamily: fontStack, fontWeight: 800,
                fontSize: isSmallMobile ? '1.35rem' : '1.75rem',
                letterSpacing: '-0.5px', color: '#FFFFFF', lineHeight: 1.2, mb: 1,
              }}>
                Welcome back, {fullName}
              </Typography>
              <Typography sx={{
                fontFamily: fontStack, fontSize: isSmallMobile ? 13 : 15,
                color: 'rgba(255,255,255,0.6)', lineHeight: 1.7,
              }}>
                Your system is running smoothly. All services operational.
              </Typography>
            </Box>

            {/* Bottom stats row */}
            <Box sx={{
              position: 'relative', zIndex: 1,
              display: 'flex', gap: isSmallMobile ? 3 : 5, mt: 2,
              flexWrap: 'wrap',
            }}>
              {[
                { label: 'Institutions', value: '6' },
                { label: 'Uptime', value: '24/7' },
              ].map((s) => (
                <Box key={s.label}>
                  <Typography sx={{ fontFamily: fontStack, fontSize: 11, color: 'rgba(255,255,255,0.4)', fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                    {s.label}
                  </Typography>
                  <Typography sx={{ fontFamily: fontStack, fontSize: isSmallMobile ? 22 : 28, fontWeight: 800, color: '#FFFFFF', letterSpacing: '-1px' }}>
                    {s.value}
                  </Typography>
                </Box>
              ))}
            </Box>
          </Box>

          {/* Right column — two stacked accent cards */}
          <Box sx={{ display: 'grid', gridTemplateRows: '1fr 1fr', gap: 2 }}>
            {/* System Status — Teal */}
            <Box
              sx={{
                backgroundColor: COLORS.teal,
                borderRadius: COLORS.cardRadius,
                p: isSmallMobile ? 2.5 : 3,
                display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
                position: 'relative', overflow: 'hidden',
              }}
            >
              <Box sx={{
                display: 'inline-block', fontFamily: fontStack,
                fontSize: 11, fontWeight: 700, letterSpacing: '0.1em',
                textTransform: 'uppercase', color: '#064E3B', mb: 1,
              }}>
                System Status
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                {/* Pulse dot */}
                <Box sx={{
                  width: 12, height: 12, borderRadius: '50%', backgroundColor: '#064E3B',
                  opacity: 0.8,
                  boxShadow: '0 0 0 4px rgba(6,78,59,0.2)',
                  animation: 'pulse 2s ease-in-out infinite',
                }} />
                <Typography sx={{
                  fontFamily: fontStack, fontWeight: 800,
                  fontSize: isSmallMobile ? 18 : 22, color: '#000000',
                  letterSpacing: '-0.5px',
                }}>
                  Operational
                </Typography>
              </Box>
            </Box>

            {/* Security — Lavender */}
            <Box
              sx={{
                backgroundColor: COLORS.lavender,
                borderRadius: COLORS.cardRadius,
                p: isSmallMobile ? 2.5 : 3,
                display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
                position: 'relative', overflow: 'hidden',
              }}
            >
              <Box sx={{
                display: 'inline-block', fontFamily: fontStack,
                fontSize: 11, fontWeight: 700, letterSpacing: '0.1em',
                textTransform: 'uppercase', color: '#4C1D95', mb: 1,
              }}>
                Security
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#000000" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                </svg>
                <Typography sx={{
                  fontFamily: fontStack, fontWeight: 800,
                  fontSize: isSmallMobile ? 18 : 22, color: '#000000',
                  letterSpacing: '-0.5px',
                }}>
                  Stable
                </Typography>
              </Box>
            </Box>
          </Box>
        </Box>

        {/* ── Section Label ────────────────────────────────────────────── */}
        <Box sx={{
          fontFamily: fontStack, fontSize: 11, fontWeight: 700,
          letterSpacing: '0.1em', textTransform: 'uppercase',
          color: COLORS.textSecondary, mt: isSmallMobile ? 3 : 4, mb: 2,
        }}>
          Quick Access
        </Box>

        {/* ── Bento Row 2 — Navigation Cards ──────────────────────────── */}
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(3, 1fr)' },
            gap: 2,
          }}
        >
          {navCards.map((item) => (
            <Box
              key={item.title}
              onClick={() => nav(item.path)}
              sx={{
                position: 'relative',
                p: isSmallMobile ? 2.5 : 3,
                borderRadius: '12px',
                backgroundColor: '#FFFFFF',
                border: '1px solid #D1D5DB',
                cursor: 'pointer',
                overflow: 'hidden',
                transition: 'all 0.3s cubic-bezier(0.4,0,0.2,1)',
                display: 'flex',
                flexDirection: 'column',
                minHeight: 140,
                '&:hover': {
                  transform: 'translateY(-2px)',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03)',
                  borderColor: '#D1D5DB',
                },
              }}
            >
              {/* Icon and Title Row */}
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1 }}>
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <svg
                    width={isSmallMobile ? 20 : 24}
                    height={isSmallMobile ? 20 : 24}
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke={item.accent}
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    {item.icon}
                  </svg>
                </Box>
                <Typography sx={{
                  fontFamily: fontStack,
                  fontWeight: 600,
                  fontSize: isSmallMobile ? 14 : 15,
                  color: '#4B5563',
                }}>
                  {item.title}
                </Typography>
              </Box>

              {/* Description */}
              <Typography sx={{
                fontFamily: fontStack,
                fontSize: isSmallMobile ? 13 : 14,
                color: '#9CA3AF',
                lineHeight: 1.5,
                mt: 1,
                pr: 4, // Leave space for arrow
              }}>
                {item.desc}
              </Typography>

              {/* Arrow button */}
              <Box sx={{
                position: 'absolute',
                bottom: isSmallMobile ? 12 : 16,
                right: isSmallMobile ? 12 : 16,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: '#000000', fontSize: 24, lineHeight: 1,
                transition: 'transform 0.2s ease, color 0.2s ease',
              }}>
                →
              </Box>
            </Box>
          ))}
        </Box>
      </Box>
    );
  };

  return (
    <RoleLayout>
      {renderContent()}
    </RoleLayout>
  );
}
