import React, { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import Divider from "@mui/material/Divider";
import IconButton from "@mui/material/IconButton";
import Drawer from "@mui/material/Drawer";
import { useTheme, useMediaQuery, Skeleton } from "@mui/material";
import { keyframes } from "@emotion/react";
import MobileSidebarContent from "./MobileSidebarContent";

/* ---------------- Icons ---------------- */

function IconBase({ children, color }: any) {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      {children}
    </svg>
  );
}

const HomeIcon = ({ color }: any) => <IconBase color={color}><path d="M3 12l9-9 9 9" /><path d="M5 10v10h14V10" /></IconBase>;
const FileIcon = ({ color }: any) => <IconBase color={color}><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><path d="M14 2v6h6" /></IconBase>;
const UsersIcon = ({ color }: any) => <IconBase color={color}><circle cx="9" cy="7" r="4" /><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /></IconBase>;
const ChartIcon = ({ color }: any) => <IconBase color={color}><path d="M3 3v18h18" /><path d="M7 14v4" /><path d="M12 10v8" /><path d="M17 6v12" /></IconBase>;
const BellIcon = ({ color }: any) => <IconBase color={color}><path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.7 21a2 2 0 0 1-3.4 0" /></IconBase>;
const SettingsIcon = ({ color }: any) => <IconBase color={color}><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09a1.65 1.65 0 0 0-1-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06A2 2 0 1 1 3.4 19l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H2a2 2 0 1 1 0-4h.09a1.65 1.65 0 0 0 1.51-1 1.65 1.65 0 0 0-.33-1.82L3.2 6.2A2 2 0 1 1 6.03 3.4l.06.06a1.65 1.65 0 0 0 1.82.33h.01A1.65 1.65 0 0 0 9 2.28V2a2 2 0 1 1 4 0v.09c0 .7.4 1.34 1.03 1.64.63.3 1.37.2 1.88-.3l.06-.06A2 2 0 1 1 20.6 6.03l-.06.06a1.65 1.65 0 0 0-.33 1.82v.01c.3.63.94 1.03 1.64 1.03H22a2 2 0 1 1 0 4h-.09c-.7 0-1.34.4-1.64 1.03z" /></IconBase>;
const LogoutIcon = ({ color }: any) => <IconBase color={color}><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><path d="M16 17l5-5-5-5" /><path d="M21 12H9" /></IconBase>;
const MenuIcon = ({ color }: any) => <IconBase color={color}><path d="M3 12h18M3 6h18M3 18h18" /></IconBase>;

/* ---------- Skeleton shimmer ---------- */
const shimmer = keyframes`
  0%   { opacity: 0.5; }
  50%  { opacity: 1;   }
  100% { opacity: 0.5; }
`;

const skeletonSx = {
  animation: `${shimmer} 1.5s ease-in-out infinite`,
  bgcolor: '#E2E8F0',
  borderRadius: '8px',
} as const;

const LABEL_WIDTHS = [100, 150, 120, 140, 110, 130] as const;

const SidebarSkeleton = () => (
  <Box
    sx={{
      width: 280,
      height: "100vh",
      backgroundColor: "#FFFFFF",
      borderRight: "1px solid #E5E7EB",
      px: 2.5,
      py: 2,
      display: "flex",
      flexDirection: "column",
    }}
  >
    {/* Logo */}
    <Box display="flex" alignItems="center" gap={1} mb={1} mt={1}>
      <Skeleton variant="rounded" width={32} height={32} sx={skeletonSx} />
      <Skeleton variant="rounded" width={110} height={22} sx={skeletonSx} />
    </Box>

    {/* Nav */}
    <Box flex={1}>
      <Divider sx={{ my: 2 }} />
      <Skeleton variant="rounded" width={72} height={14} sx={{ ...skeletonSx, mb: 1.5 }} />
      <Box display="flex" flexDirection="column" gap={0.5}>
        {LABEL_WIDTHS.map((w, i) => (
          <Box key={i} sx={{ display: 'flex', alignItems: 'center', gap: 1.5, px: 2, height: 40 }}>
            <Skeleton variant="rounded" width={20} height={20} sx={skeletonSx} />
            <Skeleton variant="rounded" width={w} height={14} sx={skeletonSx} />
          </Box>
        ))}
        {/* Logout row */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, px: 2, height: 40, mt: 0.5 }}>
          <Skeleton variant="rounded" width={20} height={20} sx={skeletonSx} />
          <Skeleton variant="rounded" width={60} height={14} sx={skeletonSx} />
        </Box>
      </Box>
    </Box>

    <Divider sx={{ my: 2 }} />

    {/* User */}
    <Box display="flex" alignItems="center" gap={1.5}>
      <Skeleton variant="circular" width={36} height={36} sx={skeletonSx} />
      <Box>
        <Skeleton variant="rounded" width={120} height={14} sx={{ ...skeletonSx, mb: 0.5 }} />
        <Skeleton variant="rounded" width={80} height={12} sx={skeletonSx} />
      </Box>
    </Box>
  </Box>
);

const MobileSidebarSkeleton = () => (
  <Box
    sx={{
      position: 'fixed',
      top: 0, left: 0, right: 0,
      height: 64,
      backgroundColor: '#FFFFFF',
      borderBottom: '1px solid #E5E7EB',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      px: 2,
      zIndex: 1200,
    }}
  >
    <Box display="flex" alignItems="center" gap={1}>
      <Skeleton variant="rounded" width={32} height={32} sx={skeletonSx} />
      <Skeleton variant="rounded" width={80} height={20} sx={skeletonSx} />
    </Box>
    <Skeleton variant="rounded" width={32} height={32} sx={skeletonSx} />
  </Box>
);

interface SidebarProps {
  systemName?: string;
  fullName: string;
  initials: string;
  logout: () => void;
  isLoading?: boolean;
}

const navItems = [
  { key: "dashboard", label: "Dashboard", path: "/super-admin/dashboard", icon: HomeIcon },
  { key: "institution-requests", label: "Institution Requests", path: "/super-admin/institution-requests", icon: FileIcon },
  { key: "user-monitoring", label: "User Monitoring", path: "/super-admin/user-monitoring", icon: UsersIcon },
  { key: "system-analytics", label: "System Analytics", path: "/super-admin/system-analytics", icon: ChartIcon },
  { key: "announcements", label: "Announcements", path: "/super-admin/announcements", icon: BellIcon },
  { key: "settings", label: "Settings", path: "/super-admin/settings", icon: SettingsIcon },
];

const Sidebar: React.FC<SidebarProps> = ({
  systemName,
  fullName,
  initials,
  logout,
  isLoading = false,
}) => {
  const location = useLocation();
  const nav = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [mobileOpen, setMobileOpen] = useState(false);

  const activeIndex = navItems.findIndex(item =>
    location.pathname.includes(item.key)
  );

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleNavClick = (path: string) => {
    nav(path);
    if (isMobile) {
      setMobileOpen(false);
    }
  };

  // Loading state
  if (isLoading) {
    return isMobile ? <MobileSidebarSkeleton /> : <SidebarSkeleton />;
  }

  // Mobile view - Hamburger menu
  if (isMobile) {
    return (
      <>
        {/* Mobile Header with Hamburger */}
        <Box
          sx={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            height: 64,
            backgroundColor: '#FFFFFF',
            borderBottom: '1px solid #E5E7EB',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            px: 2,
            zIndex: 1200,
          }}
        >
          <Box display="flex" alignItems="center" gap={1}>

            <Box
              sx={{
                width: 28,
                height: 28,
                borderRadius: 1.5,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                overflow: 'hidden',
                flexShrink: 0,
              }}
            >
              <img
                src="/logo/logo.png"
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'contain',
                  transform: 'scale(2)',
                }}
                alt="logo"
              />
            </Box>

            <Typography fontSize={16} fontWeight={700}>
              {systemName || "ClearEd"}
            </Typography>
          </Box>

          <IconButton onClick={handleDrawerToggle}>
            <MenuIcon color="#0F172A" />
          </IconButton>
        </Box>

        {/* Mobile Drawer */}
        <Drawer
          variant="temporary"
          anchor="left"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{
            keepMounted: true,
          }}
          sx={{
            '& .MuiDrawer-paper': {
              width: 280,
              boxSizing: 'border-box',
            },
          }}
        >
          <MobileSidebarContent
            systemName={systemName}
            fullName={fullName}
            initials={initials}
            logout={logout}
            navItems={navItems}
            activeIndex={activeIndex}
            handleNavClick={handleNavClick}
          />
        </Drawer>
      </>
    );
  }

  // Desktop view - Original sidebar
  return (
    <Box
      sx={{
        width: 280,
        height: "100vh",
        backgroundColor: "#FFFFFF",
        borderRight: "1px solid #E5E7EB",
        px: 2.5,
        py: 2,
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* Logo / System Name */}
      <Box display="flex" alignItems="center" gap={1} mb={1} mt={1}>
        <Box
          sx={{
            width: 32,
            height: 32,
            borderRadius: 2, // 8px radius
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            overflow: "hidden", // Clips the image to the border radius
          }}
        >
          <img
            src="/logo/logo.png"
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'contain',
              transform: 'scale(2)', // 1.4 makes it 40% larger than its natural "contain" size
            }}
            alt="logo"
          />
        </Box>
        <Typography fontSize={20} fontWeight={700}>
          {systemName || "ClearEd"}
        </Typography>
      </Box>

      {/* Navigation */}
      <Box flex={1}>
        <Divider sx={{ my: 2 }} />
        <Typography fontSize={12} color="#94A3B8" mb={1}>
          Navigation
        </Typography>

        <Box position="relative">
          {/* Active pill */}
          {activeIndex !== -1 && (
            <Box
              sx={{
                position: "absolute",
                top: activeIndex * 44,
                left: 0,
                right: 0,
                height: 40,
                borderRadius: "10px",
                backgroundColor: "#0F172A",
                transition: "top 0.25s ease",
                zIndex: 0,
              }}
            />
          )}

          <Box display="flex" flexDirection="column" gap={0.5}>
            {navItems.map((item, index) => {
              const isActive = index === activeIndex;
              const Icon = item.icon;

              return (
                <Button
                  key={item.key}
                  onClick={() => handleNavClick(item.path)}
                  sx={{
                    position: "relative",
                    zIndex: 1,
                    justifyContent: "flex-start",
                    textTransform: "none",
                    fontSize: 14,
                    fontWeight: 500,
                    px: 2,
                    height: 40,
                    borderRadius: "10px",
                    color: isActive ? "#FFFFFF" : "#0F172A",
                    "&:hover": {
                      backgroundColor: isActive ? "transparent" : "#F1F5F9",
                    },
                  }}
                >
                  <Icon color={isActive ? "#FFFFFF" : "#0F172A"} />
                  <Box ml={1.5}>{item.label}</Box>
                </Button>
              );
            })}

            {/* Logout */}
            <Button
              onClick={() => {
                logout();
                if (isMobile) {
                  setMobileOpen(false);
                }
              }}
              sx={{
                justifyContent: "flex-start",
                textTransform: "none",
                fontSize: 14,
                fontWeight: 500,
                px: 2,
                height: 40,
                borderRadius: "10px",
                color: "#0F172A",
                "&:hover": { backgroundColor: "#F1F5F9" },
              }}
            >
              <LogoutIcon color="#0F172A" />
              <Box ml={1.5}>Logout</Box>
            </Button>
          </Box>
        </Box>
      </Box>

      <Divider sx={{ my: 2 }} />

      {/* User (Bottom) */}
      <Box display="flex" alignItems="center" gap={1.5}>
        {isLoading ? (
          <>
            <Skeleton variant="circular" width={36} height={36} />
            <Box>
              <Skeleton variant="text" width={120} height={18} />
              <Skeleton variant="text" width={80} height={14} />
            </Box>
          </>
        ) : (
          <>
            <Box
              sx={{
                width: 36,
                height: 36,
                borderRadius: "50%",
                backgroundColor: "#0F172A",
                color: "#FFFFFF",
                fontWeight: 600,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              {initials}
            </Box>
            <Box>
              <Typography fontSize={14} fontWeight={600}>
                {fullName}
              </Typography>
              <Typography fontSize={12} color="#6B7280">
                Super Admin
              </Typography>
            </Box>
          </>
        )}
      </Box>
    </Box>
  );
};

export default Sidebar;