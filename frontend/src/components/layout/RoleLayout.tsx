import React, { ReactNode } from "react";
import Box from "@mui/material/Box";
import { Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import Sidebar from "./Sidebar";
import Footer from "./Footer";
import { NAV_CONFIG } from "../../config/navConfig";
import { getInitials, formatNameFromEmail } from "../../utils/avatarUtils";

interface RoleLayoutProps {
    children?: ReactNode;
    bgcolor?: string;
}

const RoleLayout: React.FC<RoleLayoutProps> = ({ children, bgcolor }) => {
    const { user, logout, loading } = useAuth();
    const location = useLocation();
    const isFullPageDocument = ["/slip", "/certificate", "/progress"].some(p => location.pathname.includes(p));

    if (loading) {
        return (
            <Box display="flex" height="100vh">
                <Sidebar
                    fullName=""
                    initials=""
                    role=""
                    logout={() => { }}
                    isLoading={true}
                    navItems={[]}
                />
                <Box flex={1} p={4} sx={{ backgroundColor: "#F9FAFB" }}>
                    {/* Main content loading state could be here */}
                </Box>
            </Box>
        );
    }

    if (!user) return null;

    const navItems = NAV_CONFIG[user.role] || [];

    // Extract initials from fullName or email
    const storedUser = localStorage.getItem('user');
    const fullUser = storedUser ? JSON.parse(storedUser) : null;
    const fullName = user.fullName || fullUser?.fullName || user.username || formatNameFromEmail(user.email || "");
    const avatarUrl = user.avatarUrl || fullUser?.avatarUrl || "";

    const initials = getInitials(fullName);

    return (
        <Box display="flex" minHeight="100vh" flexDirection={{ xs: "column", md: "row" }}>
            <Sidebar
                fullName={fullName}
                initials={initials}
                avatarUrl={avatarUrl}
                email={user.email || ""}
                role={user.role}
                logout={logout}
                navItems={navItems}
            />
            <Box
                component="main"
                flex={1}
                sx={{
                    backgroundColor: bgcolor || "#F9FAFB",
                    p: { xs: 2, md: 4 },
                    pt: isFullPageDocument ? 0 : { xs: 2, md: 4 },
                    pb: { xs: 2, md: 8 }, // Removed large padding on mobile as footer is hidden
                    mt: { xs: "64px", md: 0 }, // Offset for fixed mobile header
                    overflowX: "hidden"
                }}
            >
                {children || <Outlet />}
            </Box>
            <Footer />
        </Box>
    );
};

export default RoleLayout;
