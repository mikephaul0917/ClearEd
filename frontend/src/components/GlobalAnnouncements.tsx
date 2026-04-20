import React, { useState, useEffect } from 'react';
import {
  Notifications,
  Warning,
  Info,
  Security,
  Build,
  Close,
  CheckCircle,
  Schedule,
  AccessTime
} from '@mui/icons-material';
import {
  Alert,
  AlertTitle,
  IconButton,
  Box,
  Typography,
  Chip,
  Button,
  Collapse,
  useTheme
} from '@mui/material';
import { api } from '../services';

interface Announcement {
  _id: string;
  title: string;
  content: string;
  type: 'maintenance' | 'policy' | 'security' | 'general' | 'urgent';
  priority: 'low' | 'medium' | 'high' | 'critical';
  targetAudience: 'all' | 'institutions' | 'students' | 'admins' | 'super_admin';
  scheduledAt?: string;
  expiresAt?: string;
  requiresAcknowledgment: boolean;
  isAcknowledged: boolean;
  createdAt: string;
  tags: string[];
}

interface GlobalAnnouncementsProps {
  user?: any;
}

const GlobalAnnouncements: React.FC<GlobalAnnouncementsProps> = ({ user }) => {
  const theme = useTheme();
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [dismissedAnnouncements, setDismissedAnnouncements] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [expandedAnnouncements, setExpandedAnnouncements] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetchAnnouncements();

    // Load dismissed announcements from localStorage
    const dismissed = localStorage.getItem('dismissedAnnouncements');
    if (dismissed) {
      setDismissedAnnouncements(new Set(JSON.parse(dismissed)));
    }
  }, [user]);

  const fetchAnnouncements = async () => {
    try {
      setLoading(true);
      const response = await api.get('/announcements/public/active');
      setAnnouncements(response.data.data);
    } catch (error: any) {
      console.error('Error fetching announcements:', error);
      // Don't show error to user, just log it and set empty announcements
      setAnnouncements([]);
      // If it's a 403 or 404, the endpoint might not exist or require auth
      if (error.response?.status === 403 || error.response?.status === 404) {
        console.log('Announcements endpoint not available or requires authentication');
      } else if (error.code === 'NETWORK_ERROR' || error.message?.includes('Network Error')) {
        console.log('Network error - announcements will be retried on next refresh');
      } else {
        console.log('Unexpected error fetching announcements:', error.message);
      }
    } finally {
      setLoading(false);
    }
  };

  const dismissAnnouncement = (announcementId: string) => {
    const newDismissed = new Set(dismissedAnnouncements).add(announcementId);
    setDismissedAnnouncements(newDismissed);
    localStorage.setItem('dismissedAnnouncements', JSON.stringify([...newDismissed]));
  };

  const acknowledgeAnnouncement = async (announcementId: string) => {
    try {
      await api.post(`/announcements/${announcementId}/acknowledge`);

      // Update local state
      setAnnouncements(prev =>
        prev.map(ann =>
          ann._id === announcementId
            ? { ...ann, isAcknowledged: true }
            : ann
        )
      );

      // Also dismiss it
      dismissAnnouncement(announcementId);
    } catch (error) {
      console.error('Error acknowledging announcement:', error);
    }
  };

  const toggleExpanded = (announcementId: string) => {
    const newExpanded = new Set(expandedAnnouncements);
    if (newExpanded.has(announcementId)) {
      newExpanded.delete(announcementId);
    } else {
      newExpanded.add(announcementId);
    }
    setExpandedAnnouncements(newExpanded);
  };

  const getAlertSeverity = (type: Announcement['type'], priority: Announcement['priority']) => {
    // Priority takes precedence over type for severity
    switch (priority) {
      case 'critical': return 'error';
      case 'high': return 'warning';
      case 'medium': return 'info';
      case 'low': return 'success';
      default: return 'info';
    }
  };

  const getTypeIcon = (type: Announcement['type']) => {
    switch (type) {
      case 'maintenance': return <Build />;
      case 'policy': return <Info />;
      case 'security': return <Security />;
      case 'urgent': return <Warning />;
      default: return <Notifications />;
    }
  };

  const getTypeColor = (type: Announcement['type']) => {
    switch (type) {
      case 'maintenance': return '#0D9488';
      case 'policy': return '#0F766E';
      case 'security': return '#DC2626';
      case 'urgent': return '#EA580C';
      default: return '#64748B';
    }
  };

  const getPriorityLabel = (priority: Announcement['priority']) => {
    switch (priority) {
      case 'critical': return 'Critical';
      case 'high': return 'High';
      case 'medium': return 'Medium';
      case 'low': return 'Low';
      default: return 'Medium';
    }
  };

  const formatDateTime = (dateString?: string) => {
    if (!dateString) return null;
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  const isExpired = (expiresAt?: string) => {
    if (!expiresAt) return false;
    return new Date(expiresAt) < new Date();
  };

  const visibleAnnouncements = announcements.filter(announcement =>
    !dismissedAnnouncements.has(announcement._id) && !isExpired(announcement.expiresAt)
  );

  if (loading) {
    return null;
  }

  if (visibleAnnouncements.length === 0) {
    return null;
  }

  return (
    <Box sx={{ mb: 2 }}>
      {visibleAnnouncements.map((announcement) => {
        const isExpanded = expandedAnnouncements.has(announcement._id);
        const severity = getAlertSeverity(announcement.type, announcement.priority);

        return (
          <Alert
            key={announcement._id}
            severity={severity}
            icon={getTypeIcon(announcement.type)}
            sx={{
              mb: 1,
              borderRadius: '14px',
              border: `1px solid ${severity === 'info' ? '#CCFBF1' : 'transparent'}`,
              bgcolor: severity === 'info' ? '#F0FDFA' : undefined,
              '& .MuiAlert-icon': {
                color: severity === 'info' ? '#0D9488' : undefined
              },
              '& .MuiAlert-message': {
                width: '100%'
              }
            }}
            action={
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                {announcement.scheduledAt && (
                  <Chip
                    icon={<Schedule sx={{ fontSize: 14 }} />}
                    label="Scheduled"
                    size="small"
                    variant="outlined"
                    sx={{
                      borderColor: '#CCFBF1',
                      color: '#0D9488',
                      '& .MuiChip-icon': { color: '#0D9488' }
                    }}
                  />
                )}
                <Chip
                  label={getPriorityLabel(announcement.priority)}
                  size="small"
                  sx={{
                    bgcolor: severity === 'info' ? '#0D9488' :
                      severity === 'error' ? '#FEE2E2' :
                        severity === 'warning' ? '#FEF3C7' : '#DCFCE7',
                    color: severity === 'info' ? '#FFFFFF' :
                      severity === 'error' ? '#991B1B' :
                        severity === 'warning' ? '#92400E' : '#166534',
                    fontWeight: 700,
                    fontSize: 10,
                    height: 22,
                    textTransform: 'uppercase'
                  }}
                />
                <IconButton
                  size="small"
                  onClick={() => toggleExpanded(announcement._id)}
                  sx={{ transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s', color: severity === 'info' ? '#0D9488' : undefined }}
                >
                  <ExpandMoreIcon />
                </IconButton>
                <IconButton
                  size="small"
                  onClick={() => dismissAnnouncement(announcement._id)}
                  sx={{ color: severity === 'info' ? '#0D9488' : undefined }}
                >
                  <Close />
                </IconButton>
              </Box>
            }
          >
            <AlertTitle sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
              <Typography variant="subtitle2" component="span" sx={{ fontWeight: 800, color: severity === 'info' ? '#042F2E' : 'inherit' }}>
                {announcement.title}
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <Box
                  sx={{
                    width: 7,
                    height: 7,
                    borderRadius: '50%',
                    backgroundColor: getTypeColor(announcement.type)
                  }}
                />
                <Typography variant="caption" sx={{ textTransform: 'uppercase', fontWeight: 600, letterSpacing: '0.02em', color: severity === 'info' ? '#0D9488' : 'text.secondary' }}>
                  {announcement.type}
                </Typography>
              </Box>
            </AlertTitle>

            <Collapse in={isExpanded} timeout="auto" unmountOnExit>
              <Box sx={{ mt: 1 }}>
                <Typography variant="body2" sx={{ mb: 2 }}>
                  {announcement.content}
                </Typography>

                {announcement.tags.length > 0 && (
                  <Box sx={{ mb: 2, display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                    {announcement.tags.map((tag, index) => (
                      <Chip
                        key={index}
                        label={tag}
                        size="small"
                        variant="outlined"
                        sx={{ fontSize: '0.7rem', height: 20 }}
                      />
                    ))}
                  </Box>
                )}

                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 2 }}>
                  <Typography variant="caption" color="text.secondary">
                    {announcement.createdAt && (
                      <>
                        <AccessTime sx={{ fontSize: 12, mr: 0.5, verticalAlign: 'middle' }} />
                        Posted {formatDateTime(announcement.createdAt)}
                      </>
                    )}
                    {announcement.expiresAt && (
                      <>
                        <br />
                        Expires {formatDateTime(announcement.expiresAt)}
                      </>
                    )}
                  </Typography>

                  {announcement.requiresAcknowledgment && !announcement.isAcknowledged && (
                    <Button
                      size="small"
                      variant="contained"
                      startIcon={<CheckCircle />}
                      onClick={() => acknowledgeAnnouncement(announcement._id)}
                      sx={{ minWidth: 'auto' }}
                    >
                      Acknowledge
                    </Button>
                  )}
                </Box>
              </Box>
            </Collapse>
          </Alert>
        );
      })}
    </Box>
  );
};

// ExpandMoreIcon component
const ExpandMoreIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
    <path d="M16.59 8.59L12 13.17 7.41 8.59 6 10l6 6 6-6z" />
  </svg>
);

export default GlobalAnnouncements;
