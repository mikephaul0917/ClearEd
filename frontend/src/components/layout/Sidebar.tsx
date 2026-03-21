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
import Collapse from "@mui/material/Collapse";
import Avatar from "@mui/material/Avatar";
import MobileSidebarContent from "./MobileSidebarContent";
import { NavItem } from "../../config/navConfig";
import { organizationService } from "../../services";

/* ---------------- Icons ---------------- */

function IconBase({ children, color }: any) {
    return (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            {children}
        </svg>
    );
}

const LogoutIcon = ({ color }: any) => <IconBase color={color}><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><path d="M16 17l5-5-5-5" /><path d="M21 12H9" /></IconBase>;
const MenuIcon = ({ color }: any) => <IconBase color={color}><path d="M3 12h18M3 6h18M3 18h18" /></IconBase>;
const FolderIcon = ({ color }: any) => <IconBase color={color}><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" /><path d="M9 14h6" /><path d="M9 10h6" /></IconBase>;
const ChevronUpIcon = ({ color }: any) => <IconBase color={color}><polyline points="18 15 12 9 6 15" /></IconBase>;
const ChevronDownIcon = ({ color }: any) => <IconBase color={color}><polyline points="6 9 12 15 18 9" /></IconBase>;

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
    role: string;
    logout: () => void;
    isLoading?: boolean;
    navItems: NavItem[];
}

const Sidebar: React.FC<SidebarProps> = ({
    systemName,
    fullName,
    initials,
    role,
    logout,
    isLoading = false,
    navItems,
}) => {
    const location = useLocation();
    const nav = useNavigate();
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('md'));
    const [mobileOpen, setMobileOpen] = useState(false);

    // Officer orgs feature
    const [officerOrgs, setOfficerOrgs] = useState<any[]>([]);
    const [isOfficerOpen, setIsOfficerOpen] = useState(true);

    // Student orgs feature
    const [memberOrgs, setMemberOrgs] = useState<any[]>([]);
    const [isStudentOpen, setIsStudentOpen] = useState(true);

    React.useEffect(() => {
        // Fetch orgs where user is officer
        organizationService.getMyOrganizations().then(res => {
            if (res && res.organizations) {
                const officers = res.organizations.filter((org: any) => org.membership?.role === 'officer');
                const members = res.organizations.filter((org: any) => org.membership?.role === 'member');
                setOfficerOrgs(officers);
                setMemberOrgs(members);
            }
        }).catch(err => console.error("Failed to fetch officer orgs for Nav", err));
    }, []);

    let activeIndex = -1;
    let maxLen = -1;

    navItems.forEach((item, index) => {
        const isMatch = location.pathname === item.path || 
            (item.path !== '/' && item.path !== '/home' && location.pathname.startsWith(item.path + '/'));

        // Prevent matching Home/dashboard for officer sub-routes which handle their own active styling
        if (item.key === 'dashboard' && (location.pathname.startsWith('/officer/to-review') || location.pathname.startsWith('/organization/'))) {
            return;
        }

        if (isMatch && item.path.length > maxLen) {
            maxLen = item.path.length;
            activeIndex = index;
        }
    });

    const handleDrawerToggle = () => {
        setMobileOpen(!mobileOpen);
    };

    const handleNavClick = (path: string) => {
        nav(path);
        if (isMobile) {
            setMobileOpen(false);
        }
    };

    if (isLoading) {
        return isMobile ? <MobileSidebarSkeleton /> : <SidebarSkeleton />;
    }

    if (isMobile) {
        return (
            <>
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
                        role={role}
                        logout={logout}
                        navItems={navItems}
                        activeIndex={activeIndex}
                        handleNavClick={handleNavClick}
                        officerOrgs={officerOrgs}
                        memberOrgs={memberOrgs}
                        isOfficerOpen={isOfficerOpen}
                        setIsOfficerOpen={setIsOfficerOpen}
                        isStudentOpen={isStudentOpen}
                        setIsStudentOpen={setIsStudentOpen}
                    />
                </Drawer>
            </>
        );
    }

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
                position: "sticky",
                top: 0,
            }}
        >
            <Box display="flex" alignItems="center" gap={1} mb={1} mt={1}>
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
                <Typography fontSize={20} fontWeight={700}>
                    {systemName || "ClearEd"}
                </Typography>
            </Box>

            <Box flex={1}>
                <Divider sx={{ my: 2 }} />
                <Typography fontSize={12} color="#94A3B8" mb={1}>
                    Navigation
                </Typography>

                <Box position="relative">

                    <Box display="flex" flexDirection="column" gap={0.5}>
                        {/* Split navItems into Home and others to insert the collapsible section */}
                        {navItems.map((item, index) => {
                            const isActive = index === activeIndex && !location.pathname.startsWith('/officer/to-review') && !location.pathname.startsWith('/organization/');
                            const Icon = item.icon;

                            const buttonEl = (
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
                                        color: isActive ? "#0891b2" : "#0F172A",
                                        backgroundColor: isActive ? "#ecfeff" : "transparent",
                                        "&:hover": {
                                            backgroundColor: isActive ? "#cffafe" : "#F1F5F9",
                                        },
                                    }}
                                >
                                    <Icon color={isActive ? "#0891b2" : "#0F172A"} />
                                    <Box ml={1.5}>{item.label}</Box>
                                </Button>
                            );

                            if (item.key === 'todo') {
                                return null; // We render it inside the "As a student" section instead
                            }

                            if (item.key === 'dashboard') {
                                return (
                                    <React.Fragment key="home-group">
                                        {buttonEl}

                                        {/* "As an officer" Section */}
                                        {officerOrgs.length > 0 && (
                                            <Box mt={1} mb={0.5}>
                                                <Box
                                                    display="flex"
                                                    alignItems="center"
                                                    justifyContent="space-between"
                                                    px={2}
                                                    py={1}
                                                    mb={0.5}
                                                    sx={{ cursor: 'pointer', "&:hover": { opacity: 0.8 } }}
                                                    onClick={() => setIsOfficerOpen(!isOfficerOpen)}
                                                >
                                                    <Box display="flex" alignItems="center" gap={1.5}>
                                                        <IconBase color="#64748b"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></IconBase>
                                                        <Typography fontSize={14} fontWeight={600} color="#0F172A">As an officer</Typography>
                                                    </Box>
                                                    {isOfficerOpen ? <ChevronUpIcon color="#64748b" /> : <ChevronDownIcon color="#64748b" />}
                                                </Box>

                                                <Collapse in={isOfficerOpen}>
                                                    <Box display="flex" flexDirection="column" gap={0.5} pl={0}>
                                                        <Button
                                                            onClick={() => handleNavClick('/officer/to-review')}
                                                            sx={{
                                                                justifyContent: "flex-start",
                                                                textTransform: "none",
                                                                fontSize: 14,
                                                                fontWeight: 500,
                                                                px: 2,
                                                                height: 40,
                                                                borderRadius: "10px",
                                                                color: location.pathname === '/officer/to-review' ? "#0891b2" : "#0F172A",
                                                                backgroundColor: location.pathname === '/officer/to-review' ? "#ecfeff" : "transparent",
                                                                "&:hover": { backgroundColor: location.pathname === '/officer/to-review' ? "#cffafe" : "#F1F5F9" },
                                                            }}
                                                        >
                                                            <FolderIcon color={location.pathname === '/officer/to-review' ? "#0891b2" : "#0F172A"} />
                                                            <Box ml={1.5}>To review</Box>
                                                        </Button>

                                                        {officerOrgs.map(org => {
                                                            const isOrgActive = location.pathname.startsWith(`/organization/${org._id}`);
                                                            return (
                                                                <Button
                                                                    key={org._id}
                                                                    onClick={() => handleNavClick(`/organization/${org._id}`)}
                                                                    sx={{
                                                                        justifyContent: "flex-start",
                                                                        textTransform: "none",
                                                                        fontSize: 14,
                                                                        fontWeight: 500,
                                                                        px: 2,
                                                                        height: 40,
                                                                        borderRadius: "10px",
                                                                        color: isOrgActive ? "#0891b2" : "#0F172A",
                                                                        backgroundColor: isOrgActive ? "#ecfeff" : "transparent",
                                                                        "&:hover": { backgroundColor: isOrgActive ? "#cffafe" : "#F1F5F9" },
                                                                    }}
                                                                >
                                                                    <Avatar sx={{ width: 24, height: 24, fontSize: '0.75rem', bgcolor: org.color || '#e2e8f0', color: '#1e293b' }}>
                                                                        {org.name.charAt(0).toUpperCase()}
                                                                    </Avatar>
                                                                    <Box ml={1.5} sx={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                                                        {org.name}
                                                                    </Box>
                                                                </Button>
                                                            );
                                                        })}
                                                    </Box>
                                                </Collapse>
                                            </Box>
                                        )}

                                        {/* "As a student" Section */}
                                        {(memberOrgs.length > 0 || navItems.some(i => i.key === 'todo')) && (
                                            <Box mt={1} mb={0.5}>
                                                <Box
                                                    display="flex"
                                                    alignItems="center"
                                                    justifyContent="space-between"
                                                    px={2}
                                                    py={1}
                                                    mb={0.5}
                                                    sx={{ cursor: 'pointer', "&:hover": { opacity: 0.8 } }}
                                                    onClick={() => setIsStudentOpen(!isStudentOpen)}
                                                >
                                                    <Box display="flex" alignItems="center" gap={1.5}>
                                                        <IconBase color="#64748b"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></IconBase>
                                                        <Typography fontSize={14} fontWeight={600} color="#0F172A">As a student</Typography>
                                                    </Box>
                                                    {isStudentOpen ? <ChevronUpIcon color="#64748b" /> : <ChevronDownIcon color="#64748b" />}
                                                </Box>

                                                <Collapse in={isStudentOpen}>
                                                    <Box display="flex" flexDirection="column" gap={0.5} pl={0}>
                                                        {navItems.find(i => i.key === 'todo') && (() => {
                                                            const todoNav = navItems.find(i => i.key === 'todo')!;
                                                            const isTodoActive = location.pathname === todoNav.path;
                                                            return (
                                                                <Button
                                                                    onClick={() => handleNavClick(todoNav.path)}
                                                                    sx={{
                                                                        justifyContent: "flex-start",
                                                                        textTransform: "none",
                                                                        fontSize: 14,
                                                                        fontWeight: 500,
                                                                        px: 2,
                                                                        height: 40,
                                                                        borderRadius: "10px",
                                                                        color: isTodoActive ? "#0891b2" : "#0F172A",
                                                                        backgroundColor: isTodoActive ? "#ecfeff" : "transparent",
                                                                        "&:hover": { backgroundColor: isTodoActive ? "#cffafe" : "#F1F5F9" },
                                                                    }}
                                                                >
                                                                    {React.createElement(todoNav.icon, { color: isTodoActive ? "#0891b2" : "#0F172A" })}
                                                                    <Box ml={1.5}>To-Do</Box>
                                                                </Button>
                                                            );
                                                        })()}

                                                        {role === 'officer' && (
                                                            <>
                                                                <Button
                                                                    onClick={() => handleNavClick('/student/progress')}
                                                                    sx={{
                                                                        justifyContent: "flex-start",
                                                                        textTransform: "none",
                                                                        fontSize: 14,
                                                                        fontWeight: 500,
                                                                        px: 2,
                                                                        height: 40,
                                                                        borderRadius: "10px",
                                                                        color: location.pathname === '/student/progress' ? "#0891b2" : "#0F172A",
                                                                        backgroundColor: location.pathname === '/student/progress' ? "#ecfeff" : "transparent",
                                                                        "&:hover": { backgroundColor: location.pathname === '/student/progress' ? "#cffafe" : "#F1F5F9" },
                                                                    }}
                                                                >
                                                                    <IconBase color={location.pathname === '/student/progress' ? "#0891b2" : "#0F172A"} >
                                                                        <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
                                                                        <rect x="8" y="2" width="8" height="4" rx="1" ry="1" />
                                                                    </IconBase>
                                                                    <Box ml={1.5}>My Clearance</Box>
                                                                </Button>
                                                                <Button
                                                                    onClick={() => handleNavClick('/student/certificate')}
                                                                    sx={{
                                                                        justifyContent: "flex-start",
                                                                        textTransform: "none",
                                                                        fontSize: 14,
                                                                        fontWeight: 500,
                                                                        px: 2,
                                                                        height: 40,
                                                                        borderRadius: "10px",
                                                                        color: location.pathname === '/student/certificate' ? "#0891b2" : "#0F172A",
                                                                        backgroundColor: location.pathname === '/student/certificate' ? "#ecfeff" : "transparent",
                                                                        "&:hover": { backgroundColor: location.pathname === '/student/certificate' ? "#cffafe" : "#F1F5F9" },
                                                                    }}
                                                                >
                                                                    <IconBase color={location.pathname === '/student/certificate' ? "#0891b2" : "#0F172A"} >
                                                                        <circle cx="12" cy="8" r="7" />
                                                                        <polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88" />
                                                                    </IconBase>
                                                                    <Box ml={1.5}>Clearance Receipt</Box>
                                                                </Button>
                                                            </>
                                                        )}

                                                        {memberOrgs.map(org => {
                                                            const isOrgActive = location.pathname.startsWith(`/organization/${org._id}`);
                                                            return (
                                                                <Button
                                                                    key={org._id}
                                                                    onClick={() => handleNavClick(`/organization/${org._id}`)}
                                                                    sx={{
                                                                        justifyContent: "flex-start",
                                                                        textTransform: "none",
                                                                        fontSize: 14,
                                                                        fontWeight: 500,
                                                                        px: 2,
                                                                        height: 40,
                                                                        borderRadius: "10px",
                                                                        color: isOrgActive ? "#0891b2" : "#0F172A",
                                                                        backgroundColor: isOrgActive ? "#ecfeff" : "transparent",
                                                                        "&:hover": { backgroundColor: isOrgActive ? "#cffafe" : "#F1F5F9" },
                                                                    }}
                                                                >
                                                                    <Avatar sx={{ width: 24, height: 24, fontSize: '0.75rem', bgcolor: org.color || '#e2e8f0', color: '#1e293b' }}>
                                                                        {org.name.charAt(0).toUpperCase()}
                                                                    </Avatar>
                                                                    <Box ml={1.5} sx={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                                                        {org.name}
                                                                    </Box>
                                                                </Button>
                                                            );
                                                        })}
                                                    </Box>
                                                </Collapse>
                                            </Box>
                                        )}
                                    </React.Fragment>
                                );
                            }

                            return buttonEl;
                        })}

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
                    <Typography fontSize={12} color="#6B7280" sx={{ textTransform: 'capitalize' }}>
                        {role.replace('_', ' ')}
                    </Typography>
                </Box>
            </Box>
        </Box>
    );
};

export default Sidebar;
