import React, { useState, useEffect } from "react";
import { Box, Typography, Avatar, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, CircularProgress } from "@mui/material";
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import WorkspacePremiumIcon from '@mui/icons-material/WorkspacePremium';
import { studentService } from "../../services/student.service";
import { useAuth } from "../../contexts/AuthContext";

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
        avatar?: string;
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

    useEffect(() => {
        const fetchLeaderboard = async () => {
            try {
                const data = await studentService.getLeaderboardStats();
                if (data.success) {
                    setLeaderboard(data.leaderboard);
                }
            } catch (error) {
                console.error("Error fetching leaderboard:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchLeaderboard();
    }, []);

    const currentUserRank = leaderboard.find(u => u._id === userId)?.rank || "-";

    if (loading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
                <CircularProgress sx={{ color: '#0a0a0a' }} />
            </Box>
        );
    }

    return (
        <Box sx={{ p: { xs: 2, md: 4 }, maxWidth: 1200, mx: 'auto', fontFamily: "'Inter', sans-serif" }}>

            {/* Header Content */}
            <Box sx={{ mb: 4 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1 }}>
                    <Box sx={{
                        bgcolor: '#FFF8E1',
                        color: '#F59E0B',
                        p: 1,
                        borderRadius: 2,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                    }}>
                        <CustomTrophyIcon color="#F59E0B" />
                    </Box>
                    <Typography variant="h4" sx={{ fontWeight: 800, color: '#000' }}>
                        Leaderboard
                    </Typography>
                </Box>
                <Typography variant="body1" sx={{ color: '#6B7280', fontSize: '1.05rem' }}>
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
                                            <Avatar src={row.user.avatar} sx={{ width: 32, height: 32, bgcolor: '#F3F4F6', color: '#6B7280', fontSize: '0.9rem' }}>
                                                {row.user.name.charAt(0).toUpperCase()}
                                            </Avatar>
                                            <Typography sx={{ fontWeight: 500, color: '#111827', fontSize: '0.95rem' }}>
                                                {row.user.name}
                                            </Typography>
                                        </Box>
                                    </TableCell>
                                    <TableCell sx={{ borderBottom: '1px solid #F3F4F6' }}>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                            <WorkspacePremiumIcon sx={{ fontSize: 18, color: '#cb9bfb' }} />
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
                                            bgcolor: row.status === 'Cleared' ? '#DCFCE7' : '#FEF3C7',
                                            color: row.status === 'Cleared' ? '#166534' : '#92400E',
                                            px: 1.5,
                                            py: 0.5,
                                            borderRadius: 2,
                                            display: 'inline-block',
                                            fontSize: '0.85rem',
                                            fontWeight: 600
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
