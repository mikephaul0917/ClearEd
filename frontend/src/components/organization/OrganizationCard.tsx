import React from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Paper from "@mui/material/Paper";
import Chip from "@mui/material/Chip";
import Avatar from "@mui/material/Avatar";

/**
 * OrganizationCard Component
 * Displays essential organization info in a card format (Google Classroom style).
 */
export interface OrganizationCardProps {
    id: string;
    name: string;
    description?: string;
    role: "member" | "officer";
    status: "active" | "archived";
    termName: string;
    institutionName: string;
    color?: string; // Optional brand color for the header
    headerImage?: string | null; // Optional header image banner
    onClick?: (id: string) => void;
}

const OrganizationCard: React.FC<OrganizationCardProps> = ({
    id,
    name,
    description,
    role,
    status,
    termName,
    institutionName,
    color = "#0F172A",
    headerImage,
    onClick
}) => {
    return (
        <Box
            onClick={() => onClick?.(id)}
            sx={{
                width: "100%",
                maxWidth: 320,
                aspectRatio: "1/1",
                cursor: "pointer",
                position: "relative",
                transition: "all 0.4s cubic-bezier(0.4, 0, 0.2, 1)",
                opacity: status === "archived" ? 0.7 : 1,
                "&:hover": {
                    transform: "translateY(-6px)",
                    "& .card-description": {
                        maxHeight: "100px",
                        opacity: 1,
                        mt: 2
                    }
                }
            }}
        >
            {/* Header Background Container (Rounded and Clipped) */}
            <Box
                sx={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    borderRadius: "32px",
                    overflow: "hidden",
                    bgcolor: "#FFFFFF",
                    boxShadow: "0 10px 30px rgba(0,0,0,0.04)",
                    border: "1px solid #F1F5F9",
                }}
            >
                {/* Header Section */}
                <Box
                    className="card-header"
                    sx={{
                        height: "100%",
                        bgcolor: color,
                        backgroundImage: headerImage ? `url(${headerImage})` : 'none',
                        backgroundSize: 'cover',
                        backgroundPosition: 'center',
                        display: 'flex',
                        alignItems: 'flex-start',
                        justifyContent: 'center',
                        pt: 6,
                    }}
                >
                    {/* Initial Container (Icon Box) */}
                    <Box
                        className="icon-box"
                        sx={{
                            width: 60,
                            height: 60,
                            bgcolor: "#FFFFFF",
                            borderRadius: "16px",
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            boxShadow: "0 8px 20px rgba(0,0,0,0.12)",
                            transition: "all 0.4s cubic-bezier(0.4, 0, 0.2, 1)",
                            zIndex: 2
                        }}
                    >
                        <Avatar
                            sx={{
                                width: 32,
                                height: 32,
                                bgcolor: "transparent",
                                color: color,
                                fontWeight: 800,
                                fontSize: 18,
                                fontFamily: "'Inter', sans-serif"
                            }}
                        >
                            {name.charAt(0)}
                        </Avatar>
                    </Box>
                </Box>
            </Box>

            {/* Sliding Content Overlay (Floating Panel - Wider than header) */}
            <Box
                className="content-overlay"
                sx={{
                    position: "absolute",
                    bottom: 0,
                    left: -6,
                    right: -6,
                    bgcolor: "#FFFFFF",
                    p: "20px",
                    borderRadius: "24px",
                    boxShadow: "0 12px 32px rgba(0,0,0,0.12)",
                    transition: "all 0.4s cubic-bezier(0.4, 0, 0.2, 1)",
                    display: "flex",
                    flexDirection: "column",
                    zIndex: 3
                }}
            >
                <Typography
                    sx={{
                        fontSize: "1.25rem",
                        fontWeight: 800,
                        color: "#1F2937",
                        fontFamily: "'Inter', sans-serif",
                        display: "-webkit-box",
                        WebkitLineClamp: 1,
                        WebkitBoxOrient: "vertical",
                        overflow: "hidden"
                    }}
                >
                    {name}
                </Typography>

                <Box 
                    className="card-description"
                    sx={{
                        maxHeight: 0,
                        opacity: 0,
                        transition: "all 0.4s cubic-bezier(0.4, 0, 0.2, 1)",
                        overflow: "hidden"
                    }}
                >
                    <Typography
                        sx={{
                            fontSize: "0.875rem",
                            color: "#6B7280",
                            lineHeight: 1.5,
                            fontFamily: "'Inter', sans-serif",
                            display: "-webkit-box",
                            WebkitLineClamp: 3,
                            WebkitBoxOrient: "vertical",
                            overflow: "hidden",
                        }}
                    >
                        {description || "Join this organization to access exclusive content and tools for your clearance process."}
                    </Typography>
                </Box>

                {/* Footer Section - Pills (Always visible) */}
                <Box sx={{ display: 'flex', gap: 1.5, mt: 2 }}>
                    <Box
                        sx={{
                            px: 3,
                            py: 1,
                            bgcolor: "#F3F4F6",
                            borderRadius: "20px",
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                        }}
                    >
                        <Typography sx={{ fontSize: "0.75rem", fontWeight: 700, color: "#4B5563", fontFamily: "'Inter', sans-serif", whiteSpace: 'nowrap' }}>
                            Learn more
                        </Typography>
                    </Box>
                    <Box
                        sx={{
                            px: 3,
                            py: 1,
                            flex: 1,
                            bgcolor: "#F3F4F6",
                            borderRadius: "20px",
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                        }}
                    >
                        <Typography sx={{ fontSize: "0.75rem", fontWeight: 700, color: "#4B5563", fontFamily: "'Inter', sans-serif", textTransform: 'capitalize' }}>
                            {role}
                        </Typography>
                    </Box>
                </Box>
            </Box>
        </Box>
    );
};

export default OrganizationCard;
