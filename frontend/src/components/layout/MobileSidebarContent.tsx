import React from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import Divider from "@mui/material/Divider";
import { NavItem } from "../../config/navConfig";

/* ---------------- Icons ---------------- */
function IconBase({ children, color }: any) {
    return (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            {children}
        </svg>
    );
}

const LogoutIcon = ({ color }: any) => (
    <IconBase color={color}>
        <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
        <path d="M16 17l5-5-5-5" />
        <path d="M21 12H9" />
    </IconBase>
);
const FolderIcon = ({ color }: any) => <IconBase color={color}><path d="M22 19a2 2 0 0 1-2-2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" /><path d="M9 14h6" /><path d="M9 10h6" /></IconBase>;
const ChevronUpIcon = ({ color }: any) => <IconBase color={color}><polyline points="18 15 12 9 6 15" /></IconBase>;
const ChevronDownIcon = ({ color }: any) => <IconBase color={color}><polyline points="6 9 12 15 18 9" /></IconBase>;

import Collapse from "@mui/material/Collapse";
import Avatar from "@mui/material/Avatar";
import { useLocation } from "react-router-dom";

interface MobileSidebarContentProps {
    systemName?: string;
    fullName: string;
    initials: string;
    role: string;
    logout: () => void;
    navItems: NavItem[];
    activeIndex: number;
    handleNavClick: (path: string) => void;
    officerOrgs?: any[];
    memberOrgs?: any[];
    isOfficerOpen?: boolean;
    setIsOfficerOpen?: (open: boolean) => void;
    isStudentOpen?: boolean;
    setIsStudentOpen?: (open: boolean) => void;
}

const MobileSidebarContent: React.FC<MobileSidebarContentProps> = ({
    systemName,
    fullName,
    initials,
    role,
    logout,
    navItems,
    activeIndex,
    handleNavClick,
    officerOrgs = [],
    memberOrgs = [],
    isOfficerOpen = false,
    setIsOfficerOpen = () => {},
    isStudentOpen = false,
    setIsStudentOpen = () => {},
}) => {
    const location = useLocation();
    
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

                    <Box display="flex" flexDirection="column" gap={0.5}>
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
                                return null;
                            }

                            if (item.key === 'dashboard') {
                                return (
                                    <React.Fragment key="home-group">
                                        {buttonEl}
                                        
                                        {/* "As an officer" Section */}
                                        {officerOrgs.length > 0 && (
                                            <Box mt={1} mb={0.5}>
                                                <Divider sx={{ my: 1 }} />
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
                                                        <IconBase color="#64748b"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></IconBase>
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

                                                        {officerOrgs.map((org: any) => {
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
                                                {officerOrgs.length === 0 && <Divider sx={{ my: 1 }} />}
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
                                                        <IconBase color="#64748b"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></IconBase>
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

                                                        {memberOrgs.map((org: any) => {
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
                                        <Divider sx={{ my: 1 }} />
                                    </React.Fragment>
                                );
                            }

                            return buttonEl;
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
                    <Typography fontSize={12} color="#6B7280" sx={{ textTransform: 'capitalize' }}>
                        {role.replace('_', ' ')}
                    </Typography>
                </Box>
            </Box>
        </Box>
    );
};

export default MobileSidebarContent;
