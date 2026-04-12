import React, { useState, useEffect } from "react";
import { Box, Typography, Avatar, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, CircularProgress, Skeleton } from "@mui/material";
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import WorkspacePremiumIcon from '@mui/icons-material/WorkspacePremium';
import { studentService } from "../../services/student.service";
import { useAuth } from "../../contexts/AuthContext";
import { getAbsoluteUrl, getInitials } from "../../utils/avatarUtils";

// Define the precise Trophy Icon matching the sidebar/header mapping
const CustomTrophyIcon = ({ color }: { color?: string }) => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={color || "currentColor"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" >
        <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" />
        <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" />
        <path d="M4 22h16" />
        <path d="M10 14.66V17c0 .55-.47.98-1 1.15V22h6v-3.85c-.53-.17-1-.6-1-1.15v-2.34" />
        <path d="M8 4l14 0" />
        <path d="M16 4v5C16 11.21 14.21 13 12 13s-4-1.79-4-4V4z" />
    </svg>
);

interface LeaderboardUser {
    _id: string;
    rank: number;
    user: {
        name: string;
        avatarUrl?: string;
    };
    certifications: number;
    clearanceTime: string;
    status: string;
}

export default function LeaderboardPage() {
    const [leaderboard, setLeaderboard] = useState<LeaderboardUser[]>([]);
    const [loading, setLoading] = useState(true);
    const { user } = useAuth();
    const userId = user?.id || null;
    const [fullUser, setFullUser] = useState<any>(() => {
        const str = localStorage.getItem("user");
        return str ? JSON.parse(str) : null;
    });

    useEffect(() => {
        const handleStorageChange = (e: StorageEvent) => {
            if (e.key === 'user' && e.newValue) {
                setFullUser(JSON.parse(e.newValue));
            }
        };
        window.addEventListener('storage', handleStorageChange);
        return () => window.removeEventListener('storage', handleStorageChange);
    }, []);


    useEffect(() => {
        const fetchLeaderboard = async () => {
            setLoading(true);
            try {
                const data = await studentService.getLeaderboardStats();
                if (data.success) {
                    setLeaderboard(data.leaderboard);
                }
            } catch (error) {
                console.error("Error fetching leaderboard:", error);
            } finally {
                // Ensure skeleton is visible for a premium feel
                setTimeout(() => {
                    setLoading(false);
                }, 2000);
            }
        };
        fetchLeaderboard();
    }, []);

    const currentUserRank = leaderboard.find(u => u._id === userId)?.rank || "-";

    const renderSkeleton = () => (
        <Box sx={{ px: { xs: 2, md: 4 }, pt: 0, pb: { xs: 2, md: 4 }, maxWidth: 1200, mx: 'auto' }}>
            {/* Header Skeleton */}
            <Box sx={{ mb: 6 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1 }}>
                    <Skeleton variant="rectangular" width={40} height={40} sx={{ borderRadius: 2, bgcolor: "#eaebec" }} />
                    <Skeleton variant="text" width={200} height={40} sx={{ bgcolor: "#eaebec" }} />
                </Box>
                <Skeleton variant="text" width={250} height={20} sx={{ bgcolor: "#eaebec" }} />
            </Box>

            {/* Personal Rank Banner Skeleton */}
            <Box sx={{
                bgcolor: '#FEFCE8',
                borderRadius: '16px',
                p: { xs: 2, md: 3 },
                mb: 4,
                display: 'flex',
                alignItems: 'center',
                gap: 2
            }}>
                <Skeleton variant="circular" width={48} height={48} sx={{ bgcolor: "#eaebec" }} />
                <Box sx={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
                    <Skeleton variant="text" width={80} height={16} sx={{ mb: 0.5, bgcolor: "#eaebec" }} />
                    <Skeleton variant="text" width="40%" height={24} sx={{ bgcolor: "#eaebec" }} />
                </Box>
            </Box>

            {/* Table Skeleton */}
            <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid #E5E7EB', borderRadius: '16px', overflow: 'hidden' }}>
            <Table>
                <TableHead sx={{ bgcolor: '#F9FAFB' }}>
                    <TableRow>
                        {['RANK', 'USER', 'ORGS CLEARED', 'CLEARANCE TIME', 'STATUS'].map((head) => (
                            <TableCell key={head} sx={{ py: 2 }}>
                                <Skeleton variant="text" width={60} height={16} sx={{ bgcolor: "#eaebec" }} />
                            </TableCell>
                        ))}
                    </TableRow>
                </TableHead>
                <TableBody>
                    {[1, 2, 3, 4, 5].map((i) => (
                        <TableRow key={i}>
                            <TableCell>
                                <Skeleton variant="rectangular" width={24} height={24} sx={{ borderRadius: 1, bgcolor: "#eaebec" }} />
                            </TableCell>
                            <TableCell>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                                    <Skeleton variant="circular" width={32} height={32} sx={{ bgcolor: "#eaebec" }} />
                                    <Skeleton variant="text" width={120} height={20} sx={{ bgcolor: "#eaebec" }} />
                                </Box>
                            </TableCell>
                            <TableCell>
                                <Skeleton variant="text" width={40} height={20} sx={{ bgcolor: "#eaebec" }} />
                            </TableCell>
                            <TableCell>
                                <Skeleton variant="text" width={80} height={20} sx={{ bgcolor: "#eaebec" }} />
                            </TableCell>
                            <TableCell>
                                <Skeleton variant="rectangular" width={70} height={24} sx={{ borderRadius: '999px', bgcolor: "#eaebec" }} />
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </TableContainer>
        </Box >
    );

    if (loading) {
        return renderSkeleton();
    }

    return (
        <Box sx={{ px: { xs: 2, md: 4 }, pt: 0, pb: { xs: 2, md: 4 }, maxWidth: 1200, mx: 'auto', fontFamily: '"Google Sans", "Product Sans", Roboto, sans-serif' }}>

            {/* Header Content */}
            <Box sx={{ mb: 6 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1 }}>
                    <Box sx={{
                        bgcolor: '#FFF8E1',
                        color: '#F59E0B',
                        p: { xs: 0.5, sm: 1 },
                        borderRadius: 2,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                    }}>
                        <CustomTrophyIcon color="#F59E0B" />
                    </Box>
                    <Typography variant="h4" sx={{
                        fontWeight: 600,
                        color: '#000',
                        fontFamily: '"Google Sans", "Product Sans", Roboto, sans-serif',
                        letterSpacing: { xs: '-0.5px', sm: '-1.5px' },
                        fontSize: { xs: '1.25rem', sm: '1.75rem', md: '1.875rem' },
                        lineHeight: 1.2
                    }}>
                        Leaderboard
                    </Typography>
                </Box>
                <Typography variant="body1" sx={{
                    color: '#6B7280',
                    fontSize: { xs: '0.8rem', sm: '0.95rem' },
                    fontFamily: '"Google Sans", "Product Sans", Roboto, sans-serif'
                }}>
                    See how you rank among other students
                </Typography>
            </Box>

            {/* Personal Ranking Banner */}
            <Box sx={{
                bgcolor: '#FEFCE8', // Yellow tint matching the mockup
                borderRadius: '16px',
                p: { xs: 2, md: 3 },
                mb: 4,
                display: 'flex',
                alignItems: 'center',
                gap: 2
            }}>
                <Box sx={{
                    bgcolor: '#FEF3C7',
                    color: '#D97706',
                    p: 1.5,
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                }}>
                    <CustomTrophyIcon color="#D97706" />
                </Box>
                <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                    <Typography sx={{ color: '#B45309', fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase', mb: 0.5 }}>
                        Your Ranking
                    </Typography>
                    <Typography sx={{ color: '#1F2937', fontSize: '1.1rem' }}>
                        You are currently <Box component="span" sx={{ fontWeight: 700, color: '#D97706' }}>#{currentUserRank}</Box> on the leaderboard.
                    </Typography>
                </Box>
            </Box>

            {/* Leaderboard Table Container */}
            <TableContainer component={Paper} elevation={0} sx={{
                border: '1px solid #E5E7EB',
                borderRadius: '16px',
                overflow: 'hidden'
            }}>
                <Table sx={{ minWidth: 650 }}>
                    <TableHead sx={{ bgcolor: '#F9FAFB' }}>
                        <TableRow>
                            <TableCell sx={{ color: '#9CA3AF', fontWeight: 600, fontSize: '0.75rem', letterSpacing: '0.05em', borderBottom: '1px solid #E5E7EB' }}>RANK</TableCell>
                            <TableCell sx={{ color: '#9CA3AF', fontWeight: 600, fontSize: '0.75rem', letterSpacing: '0.05em', borderBottom: '1px solid #E5E7EB' }}>USER</TableCell>
                            <TableCell sx={{ color: '#9CA3AF', fontWeight: 600, fontSize: '0.75rem', letterSpacing: '0.05em', borderBottom: '1px solid #E5E7EB' }}>ORGS CLEARED</TableCell>
                            <TableCell sx={{ color: '#9CA3AF', fontWeight: 600, fontSize: '0.75rem', letterSpacing: '0.05em', borderBottom: '1px solid #E5E7EB' }}>CLEARANCE TIME</TableCell>
                            <TableCell sx={{ color: '#9CA3AF', fontWeight: 600, fontSize: '0.75rem', letterSpacing: '0.05em', borderBottom: '1px solid #E5E7EB' }}>STATUS</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {leaderboard.map((row, index) => {
                            // Determine rank Icon (using raw SVG mapping for the exact color/style matching graphic)
                            let rankDisplay;
                            if (row.rank === 1) {
                                rankDisplay = <CustomTrophyIcon color="#F59E0B" />; // Gold
                            } else if (row.rank === 2) {
                                rankDisplay = <CustomTrophyIcon color="#9CA3AF" />; // Silver
                            } else if (row.rank === 3) {
                                rankDisplay = <CustomTrophyIcon color="#D97706" />; // Bronze
                            } else {
                                rankDisplay = <Typography sx={{ fontWeight: 700, color: '#4B5563', fontSize: '1.1rem' }}>#{row.rank}</Typography>;
                            }

                            return (
                                <TableRow key={row._id} sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                                    <TableCell sx={{ borderBottom: '1px solid #F3F4F6' }}>
                                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 32 }}>
                                            {rankDisplay}
                                        </Box>
                                    </TableCell>
                                    <TableCell sx={{ borderBottom: '1px solid #F3F4F6' }}>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                                            {(() => {
                                                // Robust ID comparison for reactive leaderboard updates
                                                const currentId = user?.id || fullUser?._id || fullUser?.id;
                                                const rowUserId = row._id; // Leaderboard rows _id is the User ID
                                                const isCurrentUser = !!currentId && currentId === rowUserId;

                                                const leaderboardUser = isCurrentUser ? { ...row.user, ...fullUser } : row.user;

                                                // Consistently use the same fallback logic as comments/submissions
                                                const avatarSrc = leaderboardUser?.avatarUrl ||
                                                    leaderboardUser?.avatarUrl || ""

                                                return (
                                                    <>
                                                        <Avatar
                                                            src={getAbsoluteUrl(avatarSrc)}
                                                            sx={{
                                                                width: 32,
                                                                height: 32,
                                                                bgcolor: "#5f6368",
                                                                color: "#FFFFFF",
                                                                fontSize: "0.75rem",
                                                                fontWeight: 700
                                                            }}
                                                        >
                                                            {getInitials(leaderboardUser?.name || leaderboardUser?.fullName, leaderboardUser?.email)}
                                                        </Avatar>
                                                        <Typography sx={{ fontWeight: 500, color: '#111827', fontSize: '0.95rem' }}>
                                                            {leaderboardUser?.name || leaderboardUser?.fullName}
                                                        </Typography>
                                                    </>
                                                );
                                            })()}
                                        </Box>
                                    </TableCell>
                                    <TableCell sx={{ borderBottom: '1px solid #F3F4F6' }}>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                            <WorkspacePremiumIcon sx={{ fontSize: 18, color: '#0D9488' }} />
                                            <Typography sx={{ color: '#374151', fontSize: '0.95rem', fontWeight: 500 }}>
                                                {row.certifications}
                                            </Typography>
                                        </Box>
                                    </TableCell>
                                    <TableCell sx={{ borderBottom: '1px solid #F3F4F6' }}>
                                        <Typography sx={{ color: '#374151', fontSize: '0.95rem', fontWeight: 500 }}>
                                            {row.clearanceTime}
                                        </Typography>
                                    </TableCell>
                                    <TableCell sx={{ borderBottom: '1px solid #F3F4F6' }}>
                                        <Box sx={{
                                            display: 'inline-flex',
                                            alignItems: 'center',
                                            px: 1.5,
                                            py: 0.5,
                                            borderRadius: '999px',
                                            bgcolor: row.status === 'Cleared' ? '#F0FDFA' : '#FFFBEB',
                                            color: row.status === 'Cleared' ? '#0D9488' : '#D97706',
                                            fontSize: '0.75rem',
                                            fontWeight: 700,
                                            letterSpacing: '0.01em',
                                            border: `1px solid ${row.status === 'Cleared' ? '#0D9488' : '#D97706'}20`
                                        }}>
                                            {row.status}
                                        </Box>
                                    </TableCell>
                                </TableRow>
                            );
                        })}
                        {leaderboard.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={5} align="center" sx={{ py: 6, color: '#6B7280' }}>
                                    No students have earned points or clearances yet!
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </TableContainer>

        </Box>
    );
}
