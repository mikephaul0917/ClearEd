import React, { ReactNode } from "react";
import Box from "@mui/material/Box";
import { useAuth } from "../../hooks/useAuth";
import Sidebar from "./Sidebar";
import { NAV_CONFIG } from "../../config/navConfig";

interface RoleLayoutProps {
    children: ReactNode;
}

const RoleLayout: React.FC<RoleLayoutProps> = ({ children }) => {
    const { user, logout, loading } = useAuth();

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
                <Box flex={1} p={4} sx={{ backgroundColor: "#FBFBFB" }}>
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
    const fullName = fullUser?.fullName || user.username || (user.email ? user.email.split('@')[0] : "User");
    
    let initials = "U";
    if (fullName) {
        const parts = fullName.trim().split(/\s+/);
        if (parts.length === 1) {
            initials = parts[0].charAt(0).toUpperCase();
        } else {
            initials = (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
        }
    }

    return (
        <Box display="flex" minHeight="100vh" flexDirection={{ xs: "column", md: "row" }}>
            <Sidebar
                fullName={fullName}
                initials={initials}
                role={user.role}
                logout={logout}
                navItems={navItems}
            />
            <Box
                component="main"
                flex={1}
                sx={{
                    backgroundColor: "#FBFBFB",
                    p: { xs: 2, md: 4 },
                    mt: { xs: "64px", md: 0 }, // Offset for fixed mobile header
                    overflowX: "hidden"
                }}
            >
                {children}
            </Box>
        </Box>
    );
};

export default RoleLayout;
