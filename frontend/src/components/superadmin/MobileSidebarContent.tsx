import React from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import Divider from "@mui/material/Divider";

// ---------------- Icons ---------------- */
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
const SettingsIcon = ({ color }: any) => <IconBase color={color}><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09a1.65 1.65 0 0 0-1-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06A2 2 0 1 1 3.4 19l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H2a2 2 0 1 1 0-4h.09a1.65 1.65 0 0 0 1.51-1 1.65 1.65 0 0 0-.33-1.82L3.2 6.2A2 2 0 1 1 6.03 3.4l.06.06A1.65 1.65 0 0 0 1.82.33h.01A1.65 1.65 0 0 0 9 2.28V2a2 2 0 1 1 4 0v.09c0 .7.4 1.34 1.03 1.64.63.3 1.37.2 1.88-.3l.06-.06A2 2 0 1 1 20.6 6.03l-.06.06a1.65 1.65 0 0 0-.33 1.82v.01c.3.63.94 1.03 1.64 1.03H22a2 2 0 1 1 0 4h-.09c-.7 0-1.34.4-1.64 1.03z" /></IconBase>;
const LogoutIcon = ({ color }: any) => <IconBase color={color}><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><path d="M16 17l5-5-5-5" /><path d="M21 12H9" /></IconBase>;

interface MobileSidebarContentProps {
  systemName?: string;
  fullName: string;
  initials: string;
  logout: () => void;
  navItems: any[];
  activeIndex: number;
  handleNavClick: (path: string) => void;
}

const MobileSidebarContent: React.FC<MobileSidebarContentProps> = ({
  systemName,
  fullName,
  initials,
  logout,
  navItems,
  activeIndex,
  handleNavClick,
}) => {
  return (
    <Box
      sx={{
        width: "100%",
        height: "100vh",
        px: 2.5,
        py: 2,
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* Logo / System Name */}
      <Box display="flex" alignItems="center" gap={1} mb={1} mt={1} sx={{ backgroundColor: "rgba(255,255,255,0.7)", backdropFilter: "saturate(180%) blur(8px)" }}>
        <Box
          sx={{
            width: 32,
            height: 32,
            borderRadius: 2,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            overflow: "hidden",
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
        <Typography fontSize={20} fontWeight={700} sx={{ opacity: 0.9 }}>
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
              onClick={logout}
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
      </Box>
    </Box>
  );
};

export default MobileSidebarContent;
