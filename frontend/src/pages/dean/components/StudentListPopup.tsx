import React from 'react';
import {
  Dialog,
  DialogContent,
  Box,
  Typography,
  TextField,
  InputAdornment,
  Avatar,
  IconButton,
  Button,
  Badge,
  CircularProgress,
  useTheme,
  useMediaQuery,
  styled
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import CloseIcon from '@mui/icons-material/Close';
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown';
import { getAbsoluteUrl, getInitials } from "../../../utils/avatarUtils";

interface Student {
  id: string | number;
  name: string;
  studentId?: string;
  avatarUrl?: string;
  dateSubmitted?: string;
  reqCompleted?: number;
  reqTotal?: number;
}

interface StudentListPopupProps {
  open: boolean;
  onClose: () => void;
  students: Student[];
  searchQuery: string;
  onSearchChange: (q: string) => void;
}

const fontStack = "'Inter', 'Plus Jakarta Sans', sans-serif";

const StyledBadge = styled(Badge)(({ theme }) => ({
  '& .MuiBadge-badge': {
    backgroundColor: '#10B981',
    color: '#10B981',
    boxShadow: `0 0 0 2px ${theme.palette.background.paper}`,
    width: '10px',
    height: '10px',
    borderRadius: '50%',
  },
}));

export default function StudentListPopup({ open, onClose, students, searchQuery, onSearchChange }: StudentListPopupProps) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [isExporting, setIsExporting] = React.useState(false);

  const handleExport = () => {
    if (students.length === 0) return;
    
    setIsExporting(true);
    
    const headers = ["Student ID", "Full Name", "Status"];
    const csvRows = [
      headers.join(","),
      ...students.map(s => [
        `"${s.studentId || s.id}"`,
        `"${s.name}"`,
        `"Active"`
      ].join(","))
    ].join("\n");

    try {
      const blob = new Blob([csvRows], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.body.appendChild(document.createElement("a"));
      
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
      link.setAttribute("href", url);
      link.setAttribute("download", `student_directory_export_${timestamp}.csv`);
      link.style.display = "none";
      link.click();
      
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Export failed:", error);
    }

    setTimeout(() => {
      setIsExporting(false);
    }, 800);
  };

  const illustrationUrl = "/studentlist.png";

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth="xs"
      PaperProps={{
        sx: {
          borderRadius: '24px',
          p: 0,
          maxHeight: '90vh',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
          overflow: 'hidden'
        }
      }}
    >
      <DialogContent sx={{ p: 0, display: 'flex', flexDirection: 'column' }}>
        {/* Header Section */}
        <Box sx={{ p: 3, pt: 4, position: 'relative', bgcolor: '#FFF' }}>
          <IconButton
            onClick={onClose}
            sx={{
              position: 'absolute',
              top: 16,
              right: 16,
              color: '#98A2B3',
              '&:hover': {
                color: '#667085',
                bgcolor: '#F9FAFB'
              }
            }}
          >
            <CloseIcon sx={{ fontSize: '1.25rem' }} />
          </IconButton>
          <Box>
            <Typography sx={{ fontWeight: 800, fontSize: '1.25rem', color: '#101828', fontFamily: fontStack, mb: 0.5 }}>
              Student Directory
            </Typography>
            <Typography sx={{ fontSize: '0.8125rem', color: '#475467', fontFamily: fontStack, lineHeight: 1.3 }}>
              View and manage students currently active in the clearance system. Review their progress and profiles.
            </Typography>
          </Box>
        </Box>

        {/* Search Bar Section */}
        <Box sx={{ px: 3, pb: 1, mt: 1 }}>
          <Typography sx={{ fontSize: '0.875rem', fontWeight: 600, color: '#344054', mb: 1.5 }}>
            Search for students
          </Typography>
          <Box sx={{ display: 'flex' }}>
            <TextField
              fullWidth
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              variant="outlined"
              size="small"
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon sx={{ color: '#667085', fontSize: '1.25rem' }} />
                  </InputAdornment>
                ),
                sx: {
                  borderRadius: '12px',
                  bgcolor: '#FFF',
                  fontFamily: fontStack,
                  color: '#101828',
                  boxShadow: '0 1px 2px rgba(16, 24, 40, 0.05)',
                  '& fieldset': { borderColor: '#D0D5DD' },
                }
              }}
            />
          </Box>
        </Box>

        {/* Student List Label */}
        <Box sx={{ px: 3, py: 2 }}>
          <Typography sx={{ fontSize: '0.875rem', fontWeight: 700, color: '#344054' }}>
            In this directory
          </Typography>
        </Box>

        {/* List Section */}
        <Box sx={{
          px: 1.5,
          pb: 2,
          maxHeight: '400px',
          overflowY: 'auto',
          '&::-webkit-scrollbar': { width: '8px' },
          '&::-webkit-scrollbar-track': { bgcolor: 'transparent' },
          '&::-webkit-scrollbar-thumb': { bgcolor: '#F2F4F7', borderRadius: '10px', border: '2px solid #FFF' }
        }}>
          {students.length === 0 ? (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <Typography sx={{ color: '#667085', fontFamily: fontStack }}>No students found</Typography>
            </Box>
          ) : (
            students.map((student) => (
              <Box
                key={student.id}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1.5,
                  p: 1.5,
                  borderRadius: '12px',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  '&:hover': {
                    bgcolor: '#F9FAFB',
                    '& .student-role-btn': { borderColor: '#D0D5DD' }
                  }
                }}
              >
                <StyledBadge
                  overlap="circular"
                  anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                  variant="dot"
                >
                  <Avatar
                    src={getAbsoluteUrl(student.avatarUrl)}
                    sx={{ width: 44, height: 44, borderRadius: '50%', bgcolor: '#F2F4F7', color: '#667085', border: '1px solid #F2F4F7' }}
                  >
                    {getInitials(student.name)}
                  </Avatar>
                </StyledBadge>

                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Typography noWrap sx={{ fontWeight: 600, fontSize: '0.925rem', color: '#101828', fontFamily: fontStack }}>
                    {student.name}
                  </Typography>
                  <Typography noWrap sx={{ fontSize: '0.875rem', color: '#667085', fontFamily: fontStack }}>
                    @{student.name.toLowerCase().replace(/\s+/g, '')}
                  </Typography>
                </Box>

                <Box
                  sx={{
                    bgcolor: '#FEF9C3', // Paler yellow
                    color: '#854D0E',
                    px: 1.5,
                    py: 0.5,
                    borderRadius: '8px',
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    fontFamily: fontStack,
                    letterSpacing: '0.025em'
                  }}
                >
                  Student
                </Box>
              </Box>
            ))
          )}
        </Box>

        {/* Footer Section */}
        <Box sx={{ p: 2, px: 3, borderTop: '1px solid #F2F4F7', display: 'flex', gap: 1.5, bgcolor: '#FFF' }}>
          <Button
            fullWidth
            variant="contained"
            disabled={isExporting}
            onClick={handleExport}
            sx={{
              bgcolor: '#0E1217',
              color: '#FFFFFF',
              borderRadius: '100px',
              textTransform: 'none',
              fontWeight: 700,
              fontSize: '0.95rem',
              fontFamily: fontStack,
              py: 1.5,
              px: 4,
              boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              '&:hover': { 
                bgcolor: '#1C2127',
                transform: 'translateY(-2px)',
                boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.15), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
              },
              '&:active': {
                transform: 'translateY(0)',
                boxShadow: '0 5px 10px -3px rgba(0, 0, 0, 0.1)'
              },
              '&.Mui-disabled': {
                bgcolor: '#0E1217',
                opacity: 0.8,
                color: '#FFFFFF'
              }
            }}
          >
            {isExporting ? (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                <CircularProgress size={18} sx={{ color: '#FFFFFF' }} thickness={6} />
                <span>Exporting...</span>
              </Box>
            ) : (
              'Export List'
            )}
          </Button>
        </Box>
      </DialogContent>
    </Dialog>
  );
}
