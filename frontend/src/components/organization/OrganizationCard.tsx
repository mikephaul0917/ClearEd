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
        <Paper
            elevation={0}
            onClick={() => onClick?.(id)}
            sx={{
                width: "100%",
                maxWidth: 320,
                borderRadius: "16px", // SuperAdmin cardRadius
                overflow: "hidden",
                border: "1px solid rgba(0,0,0,0.12)", // Increased border visibility
                cursor: "pointer",
                transition: "all 0.3s cubic-bezier(0.4,0,0.2,1)", // SuperAdmin transition
                opacity: status === "archived" ? 0.65 : 1,
                filter: status === "archived" ? "grayscale(40%)" : "none",
                "&:hover": {
                    boxShadow: "0 12px 32px rgba(0,0,0,0.08)", // SuperAdmin hover shadow
                    transform: "translateY(-4px)", // SuperAdmin hover lift
                    border: "1px solid rgba(0,0,0,0.20)", // Increased hover border visibility
                    opacity: status === "archived" ? 0.85 : 1,
                    filter: status === "archived" ? "grayscale(20%)" : "none"
                }
            }}
        >
            {/* Header / Banner */}
            <Box
                sx={{
                    height: 100,
                    backgroundColor: color,
                    backgroundImage: headerImage ? `url(${headerImage})` : 'none',
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    p: 2,
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "space-between",
                    position: "relative"
                }}
            >
                <Box>
                    <Typography
                        variant="h6"
                        sx={{
                            color: "#FFFFFF",
                            fontFamily: "'Inter', 'Plus Jakarta Sans', 'Montserrat', sans-serif",
                            fontWeight: 800, // SuperAdmin ExtraBold
                            fontSize: "1.25rem", // SuperAdmin Card Title
                            letterSpacing: "-0.5px",
                            lineHeight: 1.2,
                            mb: 0.5,
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap"
                        }}
                    >
                        {name}
                    </Typography>
                    <Typography
                        variant="caption"
                        sx={{
                            color: "rgba(255,255,255,0.8)",
                            fontFamily: "'Inter', 'Plus Jakarta Sans', 'Montserrat', sans-serif",
                            fontWeight: 600,
                            fontSize: "0.8125rem", // SuperAdmin Body Large (Mobile)
                            letterSpacing: "0.05em",
                            textTransform: "uppercase"
                        }}
                    >
                        {termName}
                    </Typography>
                </Box>

                <Box display="flex" justifyContent="space-between" alignItems="flex-end">
                    <Typography
                        variant="caption"
                        sx={{
                            color: "rgba(255,255,255,0.7)",
                            fontFamily: "'Inter', 'Plus Jakarta Sans', 'Montserrat', sans-serif",
                            fontWeight: 500,
                            fontSize: "0.75rem" // SuperAdmin Body Default (Mobile)
                        }}
                    >
                        {institutionName}
                    </Typography>
                </Box>

                {/* Avatar overlapping the divider */}
                <Avatar
                    sx={{
                        position: "absolute",
                        bottom: -30,
                        right: 24, // SuperAdmin padding standard
                        width: 60,
                        height: 60,
                        border: "4px solid #FFFFFF",
                        bgcolor: role === "officer" ? "#0a0a0a" : "#5fcca0", // SuperAdmin Black/Teal
                        fontSize: 24,
                        fontFamily: "'Inter', 'Plus Jakarta Sans', 'Montserrat', sans-serif",
                        fontWeight: 800,
                        boxShadow: "0 4px 12px rgba(0,0,0,0.12)"
                    }}
                >
                    {name.charAt(0)}
                </Avatar>
            </Box>

            {/* Content Body */}
            <Box sx={{ p: 3, pt: 4, minHeight: 100 }}> {/* SuperAdmin p:3 */}
                <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{
                        display: "-webkit-box",
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: "vertical",
                        overflow: "hidden",
                        mb: 2,
                        fontFamily: "'Inter', 'Plus Jakarta Sans', 'Montserrat', sans-serif",
                        fontSize: "0.875rem", // SuperAdmin Body Default
                        lineHeight: 1.6,
                        color: "#64748B" // SuperAdmin textSecondary
                    }}
                >
                    {description || "No description provided."}
                </Typography>

                <Box display="flex" gap={1} flexWrap="wrap">
                    <Chip
                        label={role === "officer" ? "Officer" : "Student"}
                        size="small"
                        sx={{
                            height: 20,
                            fontFamily: "'Inter', 'Plus Jakarta Sans', 'Montserrat', sans-serif",
                            fontSize: "0.625rem", // SuperAdmin Label (Mobile)
                            fontWeight: 700,
                            letterSpacing: "0.1em",
                            textTransform: "uppercase",
                            bgcolor: role === "officer" ? "#0a0a0a18" : "#5fcca018", // SuperAdmin Accents 12-15%
                            color: role === "officer" ? "#0a0a0a" : "#065f46", // Darker teal text for contrast
                            border: "none",
                            borderRadius: "4px" // SuperAdmin smallRadius
                        }}
                    />
                    {status === "archived" && (
                        <Chip
                            label="Archived"
                            size="small"
                            sx={{
                                height: 20,
                                fontFamily: "'Inter', 'Plus Jakarta Sans', 'Montserrat', sans-serif",
                                fontSize: "0.625rem",
                                fontWeight: 700,
                                letterSpacing: "0.1em",
                                textTransform: "uppercase",
                                bgcolor: "#F1F5F9",
                                color: "#64748B",
                                borderRadius: "4px"
                            }}
                        />
                    )}
                </Box>
            </Box>

            {/* Footer Actions */}
            <Box
                sx={{
                    px: 3, // Match body padding
                    py: 2,
                    borderTop: "1px solid rgba(0,0,0,0.06)", // SuperAdmin subtle border
                    display: "flex",
                    justifyContent: "flex-end",
                    gap: 1
                }}
            >
                {role === "officer" ? (
                    <Box display="flex" alignItems="center" gap={1}> {/* Increased gap */}
                        <Box aria-hidden sx={{ width: 16, height: 16, display: 'flex' }}>
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#64748B" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                            </svg>
                        </Box>
                        <Typography sx={{
                            fontFamily: "'Inter', 'Plus Jakarta Sans', 'Montserrat', sans-serif",
                            fontSize: "0.75rem",
                            fontWeight: 600,
                            color: "#64748B"
                        }}>
                            Review Mode
                        </Typography>
                    </Box>
                ) : (
                    <Typography sx={{
                        fontFamily: "'Inter', 'Plus Jakarta Sans', 'Montserrat', sans-serif",
                        fontSize: "0.75rem",
                        fontWeight: 600,
                        color: "#64748B"
                    }}>
                        Ready to clear
                    </Typography>
                )}
            </Box>
        </Paper>
    );
};

export default OrganizationCard;
