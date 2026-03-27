import { Box, Typography, Button, Card, CardContent, Grid, Select, MenuItem, FormControl, InputLabel } from "@mui/material";
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";

interface UserAccount {
  email: string;
  roles: string[];
  fullName: string;
  avatarUrl?: string;
  currentRole?: string;
}

export default function RoleSelection() {
  const navigate = useNavigate();
  const [selectedAccount, setSelectedAccount] = useState<string>('');
  const [availableAccounts, setAvailableAccounts] = useState<UserAccount[]>([]);

  useEffect(() => {
    // Get all stored accounts
    const accounts = JSON.parse(localStorage.getItem('userAccounts') || '[]');

    if (accounts.length === 0) {
      navigate('/register');
      return;
    }

    setAvailableAccounts(accounts);

    // Set default selected account
    const lastUsedAccount = localStorage.getItem('lastUsedAccount');
    if (lastUsedAccount && accounts.find((acc: UserAccount) => acc.email === lastUsedAccount)) {
      setSelectedAccount(lastUsedAccount);
    } else if (accounts.length > 0) {
      setSelectedAccount(accounts[0].email);
    }
  }, [navigate]);

  const selectedAccountData = availableAccounts.find(acc => acc.email === selectedAccount) || availableAccounts[0];
  const availableRoles = selectedAccountData?.roles || ['student'];

  const getRoleInfo = (role: string) => {
    const roleInfo = {
      student: {
        title: "Student",
        description: "Submit clearance requests and track your progress",
        icon: "👨‍🎓",
        color: "#3b82f6",
        route: "/student"
      },
      officer: {
        title: "Clearance Officer",
        description: "Review and process student clearance requests",
        icon: "📋",
        color: "#10b981",
        route: "/officer"
      },
      dean: {
        title: "Dean",
        description: "Approve clearances and manage faculty requirements",
        icon: "👔",
        color: "#8b5cf6",
        route: "/dean"
      },
      admin: {
        title: "Administrator",
        description: "Manage users, organizations, and system settings",
        icon: "⚙️",
        color: "#f59e0b",
        route: "/admin"
      },
      super_admin: {
        title: "Super Admin",
        description: "Manage institutions and system-wide settings",
        icon: "🔐",
        color: "#ef4444",
        route: "/super-admin"
      }
    };
    return roleInfo[role as keyof typeof roleInfo] || roleInfo.student;
  };

  const handleAccountSelect = (email: string) => {
    setSelectedAccount(email);
    localStorage.setItem('lastUsedAccount', email);
  };

  const handleRoleSelect = (role: string) => {
    const roleInfo = getRoleInfo(role);

    // Update current role for selected account
    const updatedAccounts = availableAccounts.map(acc =>
      acc.email === selectedAccount ? { ...acc, currentRole: role } : acc
    );
    localStorage.setItem('userAccounts', JSON.stringify(updatedAccounts));

    // Set current session data
    localStorage.setItem('user', JSON.stringify({
      ...selectedAccountData,
      role: role,
      avatarUrl: selectedAccountData.avatarUrl || '' // Preserve avatarUrl
    }));
    localStorage.setItem('role', role);

    navigate(roleInfo.route);
  };

  const handleAddAccount = () => {
    navigate('/register');
  };

  return (
    <Box sx={{
      minHeight: '100vh',
      backgroundColor: '#f8fafc',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      p: 3
    }}>
      <Box sx={{ maxWidth: 1000, width: '100%' }}>
        <Typography
          variant="h3"
          align="center"
          sx={{
            fontWeight: 600,
            mb: 3,
            color: '#1e293b'
          }}
        >
          Choose Account and Role
        </Typography>

        {/* Account Selection */}
        <Card sx={{ mb: 4, p: 3 }}>
          <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
            Select Gmail Account
          </Typography>

          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel>Select Account</InputLabel>
            <Select
              value={selectedAccount}
              onChange={(e) => handleAccountSelect(e.target.value)}
              sx={{ textAlign: 'left' }}
            >
              {availableAccounts.map((account) => (
                <MenuItem key={account.email} value={account.email}>
                  <Box>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      {account.fullName}
                    </Typography>
                    <Typography variant="caption" sx={{ color: '#666' }}>
                      {account.email}
                    </Typography>
                    <Typography variant="caption" sx={{ color: '#0F172A', fontSize: '11px' }}>
                      Roles: {account.roles.join(', ')}
                    </Typography>
                  </Box>
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center' }}>
            <Button
              variant="outlined"
              onClick={handleAddAccount}
              sx={{
                borderColor: '#cbd5e1',
                color: '#64748b'
              }}
            >
              Add Another Account
            </Button>
          </Box>
        </Card>

        {/* Role Selection */}
        {selectedAccountData && (
          <>
            <Typography
              variant="h6"
              align="center"
              sx={{
                mb: 3,
                color: '#64748b',
                fontWeight: 400
              }}
            >
              Select Role for {selectedAccountData.email}
            </Typography>

            <Grid container spacing={3}>
              {availableRoles.map((role: string) => {
                const roleInfo = getRoleInfo(role);
                const isCurrentRole = selectedAccountData?.currentRole === role;

                return (
                  <Grid item xs={12} sm={6} md={3} key={role}>
                    <Card
                      sx={{
                        height: '100%',
                        cursor: 'pointer',
                        transition: 'all 0.3s ease',
                        border: isCurrentRole ? `2px solid ${roleInfo.color}` : '2px solid transparent',
                        '&:hover': {
                          transform: 'translateY(-4px)',
                          boxShadow: '0 12px 24px rgba(0,0,0,0.15)',
                          borderColor: roleInfo.color
                        }
                      }}
                      onClick={() => handleRoleSelect(role)}
                    >
                      <CardContent sx={{
                        textAlign: 'center',
                        p: 3,
                        height: '100%',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'center'
                      }}>
                        <Typography
                          variant="h1"
                          sx={{
                            fontSize: 48,
                            mb: 2,
                            color: roleInfo.color
                          }}
                        >
                          {roleInfo.icon}
                        </Typography>

                        <Typography
                          variant="h5"
                          sx={{
                            fontWeight: 600,
                            mb: 1,
                            color: '#1e293b'
                          }}
                        >
                          {roleInfo.title}
                        </Typography>

                        <Typography
                          variant="body2"
                          sx={{
                            color: '#64748b',
                            lineHeight: 1.5
                          }}
                        >
                          {roleInfo.description}
                        </Typography>

                        {isCurrentRole && (
                          <Typography
                            variant="caption"
                            sx={{
                              mt: 1,
                              color: roleInfo.color,
                              fontWeight: 600
                            }}
                          >
                            Currently Active
                          </Typography>
                        )}
                      </CardContent>
                    </Card>
                  </Grid>
                );
              })}
            </Grid>
          </>
        )}

        <Box sx={{ mt: 4, textAlign: 'center' }}>
          <Button
            variant="outlined"
            onClick={() => navigate('/register')}
            sx={{
              borderColor: '#cbd5e1',
              color: '#64748b',
              '&:hover': {
                borderColor: '#94a3b8',
                backgroundColor: '#f1f5f9'
              }
            }}
          >
            Back to Login
          </Button>
        </Box>
      </Box>
    </Box>
  );
}
