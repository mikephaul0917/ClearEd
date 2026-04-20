import { useEffect, useState, useMemo } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { authService } from "../../services";
import Swal from "sweetalert2";
import Divider from "@mui/material/Divider";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import { useTheme, useMediaQuery, Box, Typography, Button, TextField, Skeleton } from "@mui/material";
import { api } from "../../services/api";
import { showGlobalModal } from "../../components/GlobalModal";
import { getAbsoluteUrl, getInitials } from "../../utils/avatarUtils";
import PersonIcon from "@mui/icons-material/Person";
import SecurityIcon from "@mui/icons-material/Security";
import {
  SettingsContainer,
  SettingsSection,
  SettingsRow,
  SettingsField,
  ProfilePictureSection,
  SettingsHeader
} from "../../components/layout/SettingsLayout";
import SuccessModal from "../../components/SuccessModal";
import PasswordConfirmModal from "../dean/components/PasswordConfirmModal";

import SuperAdminInstitutionRequests from "./SuperAdminInstitutionRequests";
import InstitutionMonitoring from "./InstitutionMonitoring";
import SystemAnalytics from "./SystemAnalytics";
import AuditLogs from "./AuditLogs";
import SuperAdminAnnouncements from "./SuperAdminAnnouncements";

// --- MODERN BENTO DESIGN SYSTEM ---
const COLORS = {
  pageBg: '#F9FAFB',
  surface: '#FFFFFF',
  black: '#3c4043',
  textPrimary: '#3c4043',
  textSecondary: '#64748B',
  accent: '#3c4043',
  teal: '#5EEAD4',
  blue: '#B0E0E6',
  yellow: '#FEF08A',
  orange: '#FF895D',
  purple: '#C4B5FD',
  border: '#E2E8F0',
  tableHead: '#F8FAFC',
  avatarBg: '#0F172A10',
  cardRadius: '24px',
  pillRadius: '999px',
};

const fontStack = '"Google Sans", "Product Sans", Roboto, sans-serif';

const getGreetingTime = () => {
  const hour = new Date().getHours();
  if (hour < 12) return "Good Morning";
  if (hour < 17) return "Good Afternoon";
  return "Good Evening";
};

// --- GEOMETRIC CARD COMPONENT ---
const GeometricCard = ({ title, desc, icon, pattern, color, onClick, variant = "standard" }: any) => {
  const isSolid = variant === "solid";

  return (
    <motion.div
      whileHover={{ y: -8, scale: 1.01 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      style={{
        position: 'relative',
        backgroundColor: isSolid ? color : '#FFFFFF',
        borderRadius: COLORS.cardRadius,
        padding: '32px',
        minHeight: '260px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        cursor: 'pointer',
        boxShadow: isSolid
          ? `0 20px 40px ${color}33`
          : '0 4px 20px rgba(0,0,0,0.03)',
        border: isSolid ? 'none' : '1px solid #F1F5F9',
        overflow: 'hidden',
        fontFamily: fontStack,
      }}
    >
      {/* Decorative Pattern Layer */}
      <Box sx={{
        position: 'absolute',
        bottom: -20,
        right: -20,
        width: '180px',
        height: '180px',
        pointerEvents: 'none',
        opacity: isSolid ? 0.4 : 1,
        transition: 'all 0.4s ease'
      }}>
        {pattern}
      </Box>

      {/* Header Layer */}
      <Box sx={{ position: 'relative', zIndex: 2, display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'flex-start' }}>
        <Box sx={{ maxWidth: '70%', flex: 1 }}>
          <Typography sx={{
            fontSize: '24px',
            fontWeight: 800,
            color: isSolid ? '#FFFFFF' : COLORS.textPrimary,
            letterSpacing: '-0.03em',
            mb: 1
          }}>
            {title}
          </Typography>
          <Typography sx={{
            fontSize: '14px',
            fontWeight: 500,
            color: isSolid ? 'rgba(255,255,255,0.7)' : COLORS.textSecondary,
            lineHeight: 1.5
          }}>
            {desc}
          </Typography>
        </Box>
        <Box sx={{
          width: 56,
          height: 56,
          borderRadius: '16px',
          backgroundColor: isSolid ? 'rgba(255,255,255,0.15)' : `${color}15`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: isSolid ? '#FFFFFF' : color,
        }}>
          {icon}
        </Box>
      </Box>

      {/* Footer Arrow */}
      <Box sx={{
        position: 'relative',
        zIndex: 2,
        mt: 'auto'
      }}>
        <Box sx={{
          width: 32,
          height: 32,
          borderRadius: '50%',
          border: `1.5px solid ${isSolid ? 'rgba(255,255,255,0.3)' : '#E2E8F0'}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: isSolid ? '#FFFFFF' : COLORS.textPrimary,
        }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="5" y1="12" x2="19" y2="12"></line>
            <polyline points="12 5 19 12 12 19"></polyline>
          </svg>
        </Box>
      </Box>
    </motion.div>
  );
};

const Patterns: any = {
  Grid: (color: string) => (
    <svg width="180" height="180" viewBox="0 0 180 180" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="140" y="20" width="12" height="12" rx="2" fill={color} opacity="0.3" />
      <rect x="156" y="20" width="12" height="12" rx="2" fill={color} opacity="0.3" />
      <rect x="140" y="36" width="12" height="12" rx="2" fill={color} opacity="0.3" />
      <rect x="156" y="36" width="12" height="12" rx="2" fill={color} opacity="0.3" />
      <circle cx="150" cy="140" r="40" fill={color} opacity="0.1" />
      <circle cx="110" cy="160" r="25" fill={color} opacity="0.2" />
      <rect x="60" y="150" width="40" height="40" rx="4" fill={color} opacity="0.15" transform="rotate(15, 80, 170)" />
    </svg>
  ),
  Curves: (color: string) => (
    <svg width="180" height="180" viewBox="0 0 180 180" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M100 180C100 135.817 135.817 100 180 100" stroke={color} strokeWidth="40" strokeLinecap="round" opacity="0.2" />
      <path d="M140 180C140 157.909 157.909 140 180 140" stroke={color} strokeWidth="20" strokeLinecap="round" opacity="0.3" />
      <circle cx="160" cy="160" r="20" fill={color} opacity="0.4" />
    </svg>
  ),
  Arches: (color: string) => (
    <svg width="180" height="180" viewBox="0 0 180 180" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="60" y="100" width="80" height="100" rx="40" fill={color} opacity="0.1" />
      <rect x="100" y="130" width="60" height="80" rx="30" fill={color} opacity="0.2" />
      <rect x="140" y="150" width="40" height="60" rx="20" fill={color} opacity="0.3" />
    </svg>
  ),
  Lines: (color: string) => (
    <svg width="180" height="180" viewBox="0 0 180 180" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="80" y="140" width="100" height="12" rx="6" fill={color} opacity="0.1" />
      <rect x="60" y="160" width="120" height="12" rx="6" fill={color} opacity="0.2" />
      <rect x="40" y="180" width="140" height="12" rx="6" fill={color} opacity="0.3" />
      <circle cx="150" cy="110" r="30" fill={color} opacity="0.15" />
    </svg>
  ),
  Waves: (color: string) => (
    <svg width="180" height="180" viewBox="0 0 180 180" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M40 180 Q80 120 120 180 Q160 120 200 180" stroke={color} strokeWidth="12" fill="none" opacity="0.2" />
      <path d="M20 200 Q60 140 100 200 Q140 140 180 200" stroke={color} strokeWidth="12" fill="none" opacity="0.3" />
      <circle cx="160" cy="150" r="20" fill={color} opacity="0.2" />
    </svg>
  ),
  Blocks: (color: string) => (
    <svg width="180" height="180" viewBox="0 0 180 180" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="120" y="120" width="60" height="60" rx="12" fill={color} opacity="0.2" />
      <rect x="80" y="150" width="30" height="30" rx="8" fill={color} opacity="0.3" />
      <circle cx="150" cy="100" r="20" fill={color} opacity="0.2" />
      <path d="M100 100 L140 140" stroke={color} strokeWidth="8" strokeLinecap="round" opacity="0.1" />
    </svg>
  )
};

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
  const [passwordModalOpen, setPasswordModalOpen] = useState(false);
  const [passwordUpdateLoading, setPasswordUpdateLoading] = useState(false);
  const [successModalOpen, setSuccessModalOpen] = useState(false);
  const [successModalTitle, setSuccessModalTitle] = useState("");
  const [successModalDescription, setSuccessModalDescription] = useState("");
  const [avatarUrl, setAvatarUrl] = useState(() => {
    try {
      const u = JSON.parse(localStorage.getItem("user") || "{}");
      return u.avatarUrl || "";
    } catch { return ""; }
  });
  const updateLocalAvatar = (url: string) => {
    try {
      const u = JSON.parse(localStorage.getItem("user") || "{}");
      u.avatarUrl = url;
      localStorage.setItem("user", JSON.stringify(u));
      window.dispatchEvent(new Event("storage"));
    } catch { }
  };
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
      (async () => {
        try {
          const res = await api.get("/auth/profile");
          if (res.data.avatarUrl) setAvatarUrl(res.data.avatarUrl);
        } catch { }
      })();
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
    return getInitials(fullName);
  }, [fullName]);

  const draftFullName = useMemo(() => {
    return `${draftFirst.trim()} ${draftLast.trim()}`.trim() || fullName;
  }, [draftFirst, draftLast, fullName]);

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
        showGlobalModal(
          "Password Mismatch",
          "New password and confirmation do not match. Please ensure both fields are identical.",
          "error"
        );
        return;
      }
      setPasswordModalOpen(true);
    } catch (error: any) {
      console.error("Password change failed:", error);
    }
  };

  const handleConfirmPasswordUpdate = async (currentPassword: string) => {
    setPasswordUpdateLoading(true);
    try {
      await api.put("/auth/password", { currentPassword, newPassword: newPass });
      setSuccessModalTitle("Password Updated Successfully");
      setSuccessModalDescription("Your super administrative password has been securely updated.");
      setSuccessModalOpen(true);
      setNewPass("");
      setConfirmPass("");
      setPasswordModalOpen(false);
    } catch (err: any) {
      const msg = err.response?.data?.message || "Failed to update password";
      setPasswordModalOpen(false);
      showGlobalModal("Incorrect Current Password", msg, "error");
    } finally {
      setPasswordUpdateLoading(false);
    }
  };

  // Handle unauthorized access with modern modal
  useEffect(() => {
    if (!isSuperAdmin && token) {
      window.dispatchEvent(new CustomEvent('app:show-modal', {
        detail: {
          title: 'Access Denied',
          description: 'Super Admin privileges required. If you believe this is an error, please contact support.',
          mode: 'denied',
          onClose: () => nav('/register')
        }
      }));
    }
  }, [isSuperAdmin, token, nav]);

  // Redirect non-super-admin users
  if (!isSuperAdmin) {
    return null;
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
          <SettingsContainer>
            <SettingsHeader
              title={<Skeleton variant="text" width={180} height={40} />}
              subtitle={<Skeleton variant="text" width={320} height={20} />}
            />

            <SettingsSection>
              <Box sx={{ mb: 4 }}>
                <Skeleton variant="circular" width={80} height={80} />
              </Box>
            </SettingsSection>

            <SettingsSection>
              <SettingsRow>
                <SettingsField label={<Skeleton variant="text" width={80} />}>
                  <Skeleton variant="rectangular" height={56} sx={{ borderRadius: '8px' }} />
                </SettingsField>
                <SettingsField label={<Skeleton variant="text" width={80} />}>
                  <Skeleton variant="rectangular" height={56} sx={{ borderRadius: '8px' }} />
                </SettingsField>
              </SettingsRow>
            </SettingsSection>

            <SettingsSection>
              <SettingsField label={<Skeleton variant="text" width={40} />}>
                <Skeleton variant="rectangular" height={56} sx={{ borderRadius: '8px' }} />
              </SettingsField>
            </SettingsSection>

            <SettingsSection>
              <SettingsRow>
                <SettingsField label={<Skeleton variant="text" width={100} />}>
                  <Skeleton variant="rectangular" height={56} sx={{ borderRadius: '8px' }} />
                </SettingsField>
                <SettingsField label={<Skeleton variant="text" width={120} />}>
                  <Skeleton variant="rectangular" height={56} sx={{ borderRadius: '8px' }} />
                </SettingsField>
              </SettingsRow>
            </SettingsSection>

            <Box sx={{ display: 'flex', gap: 2, mt: 4 }}>
              <Skeleton variant="rectangular" width={140} height={48} sx={{ borderRadius: '8px' }} />
              <Skeleton variant="rectangular" width={160} height={48} sx={{ borderRadius: '8px' }} />
            </Box>
          </SettingsContainer>
        );
      }

      return (
        <SettingsContainer>
          <SettingsHeader
            title="Settings"
            subtitle="Manage your administrative account settings"
          />

          <SettingsSection>
            <ProfilePictureSection
              avatarUrl={getAbsoluteUrl(avatarUrl)}
              initials={getInitials(draftFullName)}
              onFileSelect={async (file) => {
                try {
                  const formData = new FormData();
                  formData.append('avatar', file);
                  const res = await api.post("/auth/avatar", formData, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                  });
                  setAvatarUrl(res.data.avatarUrl);
                  updateLocalAvatar(res.data.avatarUrl);
                } catch (err: any) {
                  console.error("Upload failed:", err);
                }
              }}
              onDelete={async () => {
                try {
                  await api.put("/auth/profile", { avatarUrl: "" });
                  setAvatarUrl("");
                  updateLocalAvatar("");
                } catch (err) {
                  console.error("Delete failed:", err);
                }
              }}
            />
          </SettingsSection>

          <SettingsSection>
            <SettingsRow>
              <SettingsField label="First name">
                <TextField
                  fullWidth
                  name="first-name"
                  autoComplete="given-name"
                  value={draftFirst}
                  onChange={(e) => setDraftFirst(e.target.value)}
                  sx={{ '& .MuiOutlinedInput-root': { borderRadius: '8px', bgcolor: '#FFF' } }}
                />
              </SettingsField>
              <SettingsField label="Last name">
                <TextField
                  fullWidth
                  name="last-name"
                  autoComplete="family-name"
                  value={draftLast}
                  onChange={(e) => setDraftLast(e.target.value)}
                  sx={{ '& .MuiOutlinedInput-root': { borderRadius: '8px', bgcolor: '#FFF' } }}
                />
              </SettingsField>
            </SettingsRow>
          </SettingsSection>

          <SettingsSection>
            <SettingsField label="Email">
              <TextField
                fullWidth
                name="real-email"
                autoComplete="email"
                value={email}
                disabled
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: '8px',
                    backgroundColor: '#F8FAFC'
                  }
                }}
              />
            </SettingsField>
          </SettingsSection>

          <SettingsSection>
            <SettingsRow>
              <SettingsField label="New password">
                <TextField
                  type="password"
                  fullWidth
                  placeholder="Enter new password"
                  autoComplete="new-password"
                  value={newPass}
                  onChange={(e) => setNewPass(e.target.value)}
                  sx={{ '& .MuiOutlinedInput-root': { borderRadius: '8px', bgcolor: '#FFF' } }}
                />
              </SettingsField>
              <SettingsField label="Confirm password">
                <TextField
                  type="password"
                  fullWidth
                  placeholder="Confirm new password"
                  autoComplete="new-password"
                  value={confirmPass}
                  onChange={(e) => setConfirmPass(e.target.value)}
                  sx={{ '& .MuiOutlinedInput-root': { borderRadius: '8px', bgcolor: '#FFF' } }}
                />
              </SettingsField>
            </SettingsRow>
          </SettingsSection>

          <Box sx={{ display: 'flex', gap: 2, mt: 4 }}>
            <Button
              variant="contained"
              onClick={(e) => { e.preventDefault(); updateProfile(); }}
              sx={{
                backgroundColor: '#3c4043',
                color: '#FFF',
                padding: '12px 16px',
                borderRadius: '8px',
                textTransform: 'none',
                fontWeight: 700,
                fontSize: '1rem',
                boxShadow: '0 4px 10px rgba(0,0,0,0.15)',
                '&:hover': {
                  backgroundColor: '#202124',
                  transform: 'translateY(-1px)',
                  boxShadow: '0 6px 15px rgba(0,0,0,0.2)',
                },
                transition: 'all 0.2s ease'
              }}
            >
              Save Profile
            </Button>
            <Button
              variant="outlined"
              onClick={changePassword}
              sx={{
                color: '#000',
                borderColor: '#000',
                borderWidth: '1.2px',
                padding: '12px 16px',
                borderRadius: '8px',
                textTransform: 'none',
                fontWeight: 700,
                fontSize: '1rem',
                backgroundColor: '#FFF',
                boxShadow: '0 4px 10px rgba(0,0,0,0.15)',
                '&:hover': {
                  borderColor: '#000',
                  bgcolor: '#F8FAFC',
                  transform: 'translateY(-1px)',
                  boxShadow: '0 6px 15px rgba(0,0,0,0.2)'
                },
                transition: 'all 0.2s ease'
              }}
            >
              Update Password
            </Button>
          </Box>
        </SettingsContainer>
      );
    }

    // Default dashboard
    if (loadingDashboard) {
      return (
        <Box sx={{
          p: isSmallMobile ? 3 : 5,
          backgroundColor: COLORS.pageBg,
          minHeight: '100vh',
          fontFamily: fontStack,
        }}>
          {/* Header skeleton */}
          <Box sx={{ mb: 4 }}>
            <Skeleton variant="text" width={280} height={isSmallMobile ? 32 : 44} sx={{ mb: 1, borderRadius: '8px' }} />
          </Box>

          {/* Grid skeleton */}
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: {
                xs: '1fr',
                sm: 'repeat(2, 1fr)',
                lg: 'repeat(3, 1fr)'
              },
              gap: 3,
            }}
          >
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Skeleton
                key={i}
                variant="rounded"
                height={260}
                sx={{ borderRadius: COLORS.cardRadius, bgcolor: 'rgba(0,0,0,0.03)' }}
              />
            ))}
          </Box>
        </Box>
      );
    }

    // ── Nav‑card data ──────────────────────────────────────────────────────
    const navCards = [
      {
        title: 'Institution Requests',
        desc: 'Approve or manage new institution applications.',
        path: '/super-admin/institution-requests',
        accent: COLORS.yellow,
        patternColor: '#F59E0B', // Darker yellow/amber
        patternName: 'Curves',
        icon: <><rect x="4" y="4" width="16" height="16" rx="2" /><path d="M4 10h16M10 4v16" /></>,
      },
      {
        title: 'Institution Management',
        desc: 'Review, monitor, and manage registered institutions.',
        path: '/super-admin/institution-monitoring',
        accent: COLORS.teal,
        patternColor: '#0D9488', // Darker teal
        patternName: 'Arches',
        icon: <><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></>,
      },
      {
        title: 'Platform Analytics',
        desc: 'Deep dive into system performance metrics.',
        path: '/super-admin/system-analytics',
        accent: COLORS.blue,
        patternColor: '#3B82F6', // Darker blue
        patternName: 'Lines',
        icon: <><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></>,
      },
      {
        title: 'System Records',
        desc: 'Review global activity and institutional audit logs.',
        path: '/super-admin/audit-logs',
        accent: COLORS.blue,
        patternColor: '#1D4ED8', // Richer blue
        patternName: 'Blocks',
        icon: <><rect x="4" y="2" width="16" height="20" rx="2" /><path d="M8 6h8M8 10h8M8 14h8M8 18h4" /></>,
      },
      {
        title: 'Broadcasts',
        desc: 'Send system notifications and announcements.',
        path: '/super-admin/announcements',
        accent: COLORS.yellow,
        patternColor: '#B45309', // Dark amber/orange version of yellow
        patternName: 'Waves',
        icon: <><path d="M11 5L6 9H2v6h4l5 4V5z" /><path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07" /></>,
      },
    ];

    return (
      <Box sx={{
        p: isSmallMobile ? 3 : 5,
        backgroundColor: COLORS.pageBg,
        minHeight: '100vh',
        fontFamily: fontStack,
      }}>
        {/* ── Header ──────────────────────────────────────────────────── */}
        <Box sx={{ mb: 4 }}>
          <Typography
            sx={{
              fontFamily: fontStack,
              fontWeight: 800,
              fontSize: isSmallMobile ? '1.5rem' : '2.25rem',
              letterSpacing: '-0.03em',
              color: COLORS.textPrimary,
              lineHeight: 1.1,
            }}
          >
            {getGreetingTime()}, {profileFirst}!
          </Typography>
        </Box>

        {/* ── Geometric Card Grid ────────────────────────────────────── */}
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: {
              xs: '1fr',
              sm: 'repeat(2, 1fr)',
              lg: 'repeat(3, 1fr)'
            },
            gap: 3,
          }}
        >
          {navCards.map((item, idx) => (
            <GeometricCard
              key={item.title}
              variant="standard"
              title={item.title}
              desc={item.desc}
              color={item.accent}
              onClick={() => nav(item.path)}
              icon={
                <svg
                  width={28}
                  height={28}
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  {item.icon}
                </svg>
              }
              pattern={Patterns[item.patternName](item.patternColor || item.accent)}
            />
          ))}
        </Box>
      </Box>
    );
  };

  return (
    <>
      {renderContent()}
      <SuccessModal
        open={successModalOpen}
        onClose={() => setSuccessModalOpen(false)}
        title={successModalTitle}
        description={successModalDescription}
      />
      <PasswordConfirmModal
        open={passwordModalOpen}
        onClose={() => setPasswordModalOpen(false)}
        onConfirm={handleConfirmPasswordUpdate}
        loading={passwordUpdateLoading}
      />
    </>
  );
}
