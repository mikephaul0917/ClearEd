import React from "react";
import { useLocation, useNavigate } from "react-router-dom";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import Divider from "@mui/material/Divider";

/* ---------------- Icons ---------------- */

function IconBase({ children, color }: any) {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      {children}
    </svg>
  );
}

const HomeIcon = ({ color }: any) => <IconBase color={color}><path d="M3 12l9-9 9 9" /><path d="M5 10v10h14V10" /></IconBase>;
const UsersIcon = ({ color }: any) => <IconBase color={color}><circle cx="9" cy="7" r="4" /><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /></IconBase>;
const OrganizationsIcon = ({ color }: any) => <IconBase color={color}><path d="M4 6h16v4H4zM4 14h16v4H4z" /></IconBase>;
const RequirementsIcon = ({ color }: any) => <IconBase color={color}><path d="M6 4h12v16H6z" /><path d="M9 8h6M9 12h6M9 16h6" /></IconBase>;
const TermsIcon = ({ color }: any) => <IconBase color={color}><path d="M3 4h18v4H3zM3 12h18v8H3z" /></IconBase>;
const QuotesIcon = ({ color }: any) => <IconBase color={color}><path d="M3 7l9-9 9 9" /><path d="M5 12v8h14v-8" /></IconBase>;
const RecordsIcon = ({ color }: any) => <IconBase color={color}><path d="M4 6h10l4 4v8H4z" /></IconBase>;
const InstitutionRequestsIcon = ({ color }: any) => <IconBase color={color}><path d="M12 2L2 7v10c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V7l-10-5z" /></IconBase>;
const SettingsIcon = ({ color }: any) => <IconBase color={color}><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09a1.65 1.65 0 0 0-1-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06A2 2 0 1 1 3.4 19l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H2a2 2 0 1 1 0-4h.09a1.65 1.65 0 0 0 1.51-1 1.65 1.65 0 0 0-.33-1.82L3.2 6.2A2 2 0 1 1 6.03 3.4l.06.06a1.65 1.65 0 0 0 1.82.33h.01A1.65 1.65 0 0 0 9 2.28V2a2 2 0 1 1 4 0v.09c0 .7.4 1.34 1.03 1.64.63.3 1.37.2 1.88-.3l.06-.06A2 2 0 1 1 20.6 6.03l-.06.06a1.65 1.65 0 0 0-.33 1.82v.01c.3.63.94 1.03 1.64 1.03H22a2 2 0 1 1 0 4h-.09c-.7 0-1.34.4-1.64 1.03z" /></IconBase>;
const LogoutIcon = ({ color }: any) => <IconBase color={color}><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><path d="M16 17l5-5-5-5" /><path d="M21 12H9" /></IconBase>;

interface SidebarProps {
  systemName: string;
  fullName: string;
  initials: string;
  logout: () => void;
}

const navItems = [
  { key: "dashboard", label: "Dashboard", path: "/admin/dashboard", icon: HomeIcon },
  { key: "users", label: "Manage Users", path: "/admin/users", icon: UsersIcon },
  { key: "organizations", label: "Organizations", path: "/admin/organizations", icon: OrganizationsIcon },
  { key: "requirements", label: "Requirements", path: "/admin/requirements", icon: RequirementsIcon },
  { key: "terms", label: "Terms", path: "/admin/terms", icon: TermsIcon },
  { key: "quotes", label: "Quotes", path: "/admin/quotes", icon: QuotesIcon },
  { key: "records", label: "Records", path: "/admin/records", icon: RecordsIcon },
  { key: "institution-requests", label: "Institution Requests", path: "/admin/institution-requests", icon: InstitutionRequestsIcon },
  { key: "settings", label: "Settings", path: "/admin/settings", icon: SettingsIcon },
];

const Sidebar: React.FC<SidebarProps> = ({
  systemName,
  fullName,
  initials,
  logout,
}) => {
  const location = useLocation();
  const nav = useNavigate();

  const isActive = (path: string) => {
    if (path === "/admin/dashboard") {
      return location.pathname === "/admin" || location.pathname === "/admin/dashboard";
    }
    return location.pathname.includes(path);
  };

  return (
    <Box
      sx={{
        width: 280,
        backgroundColor: "#FFFFFF",
        borderRight: "1px solid #E5E7EB",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <br />
      {/* Logo / System Name */}
      <Box display="flex" alignItems="center" gap={1.5} mb={3}>
        <Box
          sx={{
            width: 40,
            height: 40,
            borderRadius: "50%",
            backgroundColor: "#0F172A",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#FFFFFF",
            fontWeight: 700,
            fontSize: 16,
          }}
        >
          {initials}
        </Box>
        <Box>
          <Typography variant="h6" sx={{ fontWeight: 700, color: "#0F172A", fontSize: 18 }}>
            {systemName}
          </Typography>
          <Typography sx={{ fontSize: 12, color: "#64748B" }}>
            Institutional Admin
          </Typography>
        </Box>
      </Box>

      {/* Navigation */}
      <Box flex={1}>
        <hr />
        <Typography fontSize={12} color="#94A3B8" mb={1}>
          Navigation
        </Typography>
        <Box display="flex" flexDirection="column" gap={0.5}>
          {navItems.map((item) => {
            const active = isActive(item.path);
            const Icon = item.icon;
            return (
              <Button
                key={item.key}
                onClick={() => nav(item.path)}
                sx={{
                  position: "relative",
                  zIndex: 1,
                  justifyContent: "flex-start",
                  textTransform: "none",
                  fontSize: 14,
                  fontWeight: 500,
                  px: 2,
                  height: 40,
                  borderRadius: "999px",
                  color: active ? "#FFFFFF" : "#0F172A",
                  "&:hover": {
                    backgroundColor: active ? "transparent" : "#F1F5F9",
                  },
                }}
              >
                <Icon color={active ? "#FFFFFF" : "#0F172A"} />
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
              borderRadius: "999px",
              color: "#0F172A",
              "&:hover": { backgroundColor: "#F1F5F9" },
            }}
          >
            <LogoutIcon color="#0F172A" />
            <Box ml={1.5}>Logout</Box>
          </Button>
        </Box>
      </Box>

      {/* User Info */}
      <Box p={2} borderTop="1px solid #E5E7EB">
        <Box display="flex" alignItems="center" gap={2}>
          <Box
            sx={{
              width: 36,
              height: 36,
              borderRadius: "50%",
              backgroundColor: "#F1F5F9",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontWeight: 600,
              color: "#0F172A",
              fontSize: 14,
            }}
          >
            {initials}
          </Box>
          <Box flex={1}>
            <Typography sx={{ fontSize: 14, fontWeight: 600, color: "#0F172A", lineHeight: 1.2 }}>
              {fullName}
            </Typography>
            <Typography sx={{ fontSize: 12, color: "#64748B" }}>
              Administrator
            </Typography>
          </Box>
        </Box>
      </Box>
    </Box>
  );
};

export default Sidebar;
