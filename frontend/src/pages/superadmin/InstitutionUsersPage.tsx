import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Box, Typography, Button, IconButton } from '@mui/material';
import { ArrowBack } from '@mui/icons-material';
import UsersTable from '../../components/UsersTable';
import { api } from '../../services/api';

const COLORS = {
  pageBg: '#F9FAFB',
  black: '#0a0a0a',
  textSecondary: '#64748B',
  border: '#E2E8F0',
};

const fontStack = '"Google Sans", "Product Sans", Roboto, sans-serif';

export default function InstitutionUsersPage() {
  const { institutionId } = useParams<{ institutionId: string }>();
  const navigate = useNavigate();
  const [institutionName, setInstitutionName] = useState<string>('Institution');
  const [isSessionReady, setIsSessionReady] = useState<boolean>(false);

  useEffect(() => {
    // Lock the session context to this institution for the internal interceptors
    if (institutionId) {
      sessionStorage.setItem('targetInstitutionId', institutionId);
      setIsSessionReady(true);

      api.get(`/admin/institution?institutionId=${institutionId}`).then(res => {
        if (res.data?.name) {
          setInstitutionName(res.data.name);
        }
      }).catch(console.error);
    }

    // Clear context on dismount so superadmin returns to root domain
    return () => {
      sessionStorage.removeItem('targetInstitutionId');
      setIsSessionReady(false);
    };
  }, [institutionId]);

  return (
    <Box sx={{ p: { xs: 2, md: 5 }, bgcolor: COLORS.pageBg, minHeight: '100vh', fontFamily: fontStack }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 4, gap: 2 }}>
        <IconButton
          onClick={() => navigate('/super-admin/institution-monitoring')}
          sx={{ border: `1px solid ${COLORS.border}`, borderRadius: '12px', bgcolor: '#f8fafc' }}
        >
          <ArrowBack sx={{ color: COLORS.black }} />
        </IconButton>
        <Box>
          <Typography sx={{ fontFamily: fontStack, fontWeight: 800, fontSize: { xs: '24px', md: '28px' }, color: COLORS.black, letterSpacing: '-0.5px' }}>
            {institutionName} Users
          </Typography>
          <Typography sx={{ fontFamily: fontStack, color: COLORS.textSecondary, fontSize: '14px', mt: 0.5 }}>
            Manage and provision active accounts exclusively isolated to this academic domain.
          </Typography>
        </Box>
      </Box>

      {/* Render the standard UsersTable ONLY when the interceptor is synchronized */}
      {isSessionReady && institutionId && (
        <UsersTable institutionId={institutionId} />
      )}
    </Box>
  );
}
