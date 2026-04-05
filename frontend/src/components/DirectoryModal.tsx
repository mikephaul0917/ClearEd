import React, { useState } from 'react';
import {
  Dialog, Box, Typography, TextField, InputAdornment, IconButton,
  Avatar, Chip, Button, IconButton as MuiIconButton, Checkbox,
  FormControlLabel, Menu, MenuItem, Divider, CircularProgress
} from '@mui/material';
import {
  Close, Search, FileDownload,
  Person as PersonIcon, CheckCircle, DoNotDisturb, Edit, ArrowDropDown, Delete, Check
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import { getInitials, getAbsoluteUrl } from '../utils/avatarUtils';

interface User {
  _id: string;
  fullName?: string;
  username?: string;
  email: string;
  role: string;
  enabled: boolean;
  avatarUrl?: string;
}

interface DirectoryModalProps {
  open: boolean;
  onClose: () => void;
  roleLabel: string;
  users: User[];
  onExport: () => void;
  onRefresh: () => void;
  organizations: any[];
  onBulkUpdateStatus: (userIds: string[], enabled: boolean) => Promise<void>;
  onBulkUpdateRole: (userIds: string[], role: string, orgIds: string[]) => Promise<void>;
  isManageMode?: boolean;
}

const DirectoryModal: React.FC<DirectoryModalProps> = ({
  open,
  onClose,
  roleLabel,
  users,
  onExport,
  onRefresh,
  organizations,
  onBulkUpdateStatus,
  onBulkUpdateRole,
  isManageMode = false
}) => {
  const [search, setSearch] = useState("");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isUpdating, setIsUpdating] = useState(false);
  const [bulkAnchorEl, setBulkAnchorEl] = useState<null | HTMLElement>(null);
  const [roleMenuAnchor, setRoleMenuAnchor] = useState<null | HTMLElement>(null);
  const [targetRole, setTargetRole] = useState<string | null>(null);
  const [orgMenuAnchor, setOrgMenuAnchor] = useState<null | HTMLElement>(null);
  const [selectedBulkOrgIds, setSelectedBulkOrgIds] = useState<string[]>([]);

  const filteredUsers = users.filter(u =>
    (u.fullName || '').toLowerCase().includes(search.toLowerCase()) ||
    (u.username || '').toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase())
  );

  const getRoleColor = (role: string) => {
    switch (role.toLowerCase()) {
      case 'student': return { bg: '#FEF9C3', text: '#854D0E' }; // Yellow
      case 'admin': return { bg: '#DBEAFE', text: '#1E40AF' }; // Blue
      case 'dean': return { bg: '#F3E8FF', text: '#6B21A8' }; // Purple
      case 'officer': return { bg: '#DCFCE7', text: '#166534' }; // Green
      default: return { bg: '#F1F5F9', text: '#475569' };
    }
  };

  const roleColors = getRoleColor(roleLabel);

  const toggleSelectAll = () => {
    if (selectedIds.length === filteredUsers.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredUsers.map(u => u._id));
    }
  };

  const toggleSelect = (id: string) => {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const handleBulkStatus = async (enabled: boolean) => {
    setIsUpdating(true);
    try {
      await onBulkUpdateStatus(selectedIds, enabled);
      setSelectedIds([]);
      onRefresh();
    } finally {
      setIsUpdating(false);
      setBulkAnchorEl(null);
    }
  };

  const handleBulkRole = async (role: string, orgIds: string[]) => {
    setIsUpdating(true);
    try {
      await onBulkUpdateRole(selectedIds, role, orgIds);
      setSelectedIds([]);
      onRefresh();
    } finally {
      setIsUpdating(false);
      setRoleMenuAnchor(null);
      setOrgMenuAnchor(null);
      setBulkAnchorEl(null);
      setTargetRole(null);
      setSelectedBulkOrgIds([]);
    }
  };

  const onRoleSelect = (role: string) => {
    if (role === 'officer' || role === 'dean') {
      setTargetRole(role);
      // We'll show the organization menu
    } else {
      handleBulkRole(role, []);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: '14px',
          padding: 0,
          overflow: 'hidden',
          bgcolor: '#FFF',
          boxShadow: '0 25px 50px -12px rgba(0,0,0,0.15)'
        }
      }}
    >
      <Box p={4} sx={{ position: 'relative' }}>
        {/* Header */}
        <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={3}>
          <Box>
            <Typography variant="h5" sx={{ fontWeight: 800, color: '#0F172A', mb: 1, letterSpacing: '-0.02em' }}>
              {roleLabel} Directory
            </Typography>
            <Typography variant="body2" sx={{ color: '#64748B', fontWeight: 500, lineHeight: 1.5, maxWidth: '90%' }}>
              View and manage {roleLabel.toLowerCase()}s currently active in the clearance system. Review their progress and profiles.
            </Typography>
          </Box>
          <MuiIconButton onClick={onClose} sx={{ color: '#94A3B8' }}>
            <Close />
          </MuiIconButton>
        </Box>

        {/* Search Section */}
        <Box mb={4}>
          <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#334155', mb: 1.5 }}>
            Search for {roleLabel.toLowerCase()}s
          </Typography>
          <TextField
            fullWidth
            placeholder="Search..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Search sx={{ color: '#94A3B8', fontSize: 20 }} />
                </InputAdornment>
              ),
              sx: {
                borderRadius: '6px',
                bgcolor: '#F8FAFC',
                fontFamily: "'Inter', sans-serif",
                '& .MuiOutlinedInput-notchedOutline': {
                  border: '1px solid transparent',
                  transition: 'border-color 0.2s'
                },
                '&:hover .MuiOutlinedInput-notchedOutline': {
                  borderColor: '#E2E8F0'
                },
                '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                  borderColor: '#0E7490',
                  borderWidth: '1.5px'
                }
              }
            }}
          />
        </Box>

        {/* Directory List */}
        <Box mb={4}>
          <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#334155', mb: 2 }}>
            In this directory
          </Typography>
          <Box sx={{ maxHeight: '320px', overflowY: 'auto', pr: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
            {filteredUsers.length > 0 ? filteredUsers.map((user) => (
              <Box key={user._id} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', p: 1 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                  {isManageMode && (
                    <Checkbox
                      size="small"
                      checked={selectedIds.includes(user._id)}
                      onChange={() => toggleSelect(user._id)}
                      sx={{ color: '#CBD5E1', '&.Mui-checked': { color: '#0F172A' } }}
                    />
                  )}
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Box sx={{ position: 'relative' }}>
                      <Avatar
                        src={getAbsoluteUrl(user.avatarUrl)}
                        sx={{
                          width: 44,
                          height: 44,
                          bgcolor: '#020617', // Dark background
                          color: '#FFFFFF',
                          fontWeight: 800,
                          fontSize: '1.1rem',
                          textShadow: '-0.5px 0 0 rgba(0,255,255,0.4), 0.5px 0 0 rgba(255,165,0,0.4)',
                        }}>
                        {getInitials(user.fullName || user.username)}
                      </Avatar>
                      {user.enabled && (
                        <Box sx={{ position: 'absolute', bottom: -2, right: -2, bgcolor: '#FFF', borderRadius: '50%', p: '2px', zIndex: 2 }}>
                          <Box sx={{
                            width: 14,
                            height: 14,
                            bgcolor: '#0E7490', // Deep Teal matching sidebar
                            borderRadius: '50%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                          }}>
                            <Check sx={{ fontSize: 10, color: '#FFF', fontWeight: 950 }} />
                          </Box>
                        </Box>
                      )}
                    </Box>
                    <Box>
                      <Typography sx={{ fontWeight: 800, color: '#0F172A', fontSize: '0.95rem', lineHeight: 1.2 }}>
                        {user.fullName || user.username}
                      </Typography>
                      <Typography sx={{ color: '#94A3B8', fontSize: '0.85rem', fontWeight: 500 }}>
                        @{user.username || user.email.split('@')[0]}
                      </Typography>
                    </Box>
                  </Box>
                </Box>
                <Chip
                  label={roleLabel}
                  sx={{
                    bgcolor: roleColors.bg,
                    color: roleColors.text,
                    fontWeight: 700,
                    fontSize: '0.75rem',
                    borderRadius: '6px',
                    height: '24px'
                  }}
                />
              </Box>
            )) : (
              <Typography sx={{ color: '#94A3B8', fontSize: '0.9rem', textAlign: 'center', py: 4, fontStyle: 'italic' }}>
                No {roleLabel.toLowerCase()}s found matching your search.
              </Typography>
            )}
          </Box>
        </Box>

        {/* Bulk Selection Header */}
        {isManageMode && filteredUsers.length > 0 && (
          <Box sx={{
            mb: 2,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            bgcolor: '#F8FAFC',
            p: 1.5,
            borderRadius: '6px',
            border: '1px solid #F1F5F9'
          }}>
            <FormControlLabel
              control={
                <Checkbox
                  size="small"
                  checked={selectedIds.length === filteredUsers.length && filteredUsers.length > 0}
                  indeterminate={selectedIds.length > 0 && selectedIds.length < filteredUsers.length}
                  onChange={toggleSelectAll}
                  sx={{ color: '#CBD5E1', '&.Mui-checked': { color: '#0F172A' } }}
                />
              }
              label={
                <Typography sx={{ fontSize: '0.85rem', fontWeight: 700, color: '#334155' }}>
                  {selectedIds.length > 0 ? `${selectedIds.length} Selected` : 'Select All'}
                </Typography>
              }
            />

            <AnimatePresence>
              {selectedIds.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                >
                  <Button
                    size="small"
                    variant="contained"
                    disableElevation
                    onClick={(e) => setBulkAnchorEl(e.currentTarget)}
                    endIcon={<ArrowDropDown />}
                    disabled={isUpdating}
                    sx={{
                      bgcolor: '#F1F5F9',
                      color: '#0F172A',
                      borderRadius: '8px',
                      textTransform: 'none',
                      fontWeight: 700,
                      px: 2,
                      border: 'none',
                      boxShadow: 'none',
                      '&:hover': {
                        bgcolor: '#E2E8F0',
                        boxShadow: 'none'
                      }
                    }}
                  >
                    Bulk Actions
                  </Button>
                </motion.div>
              )}
            </AnimatePresence>
          </Box>
        )}

        <Menu
          anchorEl={bulkAnchorEl}
          open={Boolean(bulkAnchorEl)}
          onClose={() => setBulkAnchorEl(null)}
          PaperProps={{
            sx: {
              mt: 1,
              borderRadius: '6px',
              minWidth: 180,
              boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)',
              '& .MuiMenuItem-root': {
                fontSize: '0.85rem',
                fontWeight: 600,
                gap: 1.5,
                py: 1
              }
            }
          }}
        >
          <MenuItem onClick={() => handleBulkStatus(true)}>
            <CheckCircle sx={{ fontSize: 18, color: '#10B981' }} />
            Enable Accounts
          </MenuItem>
          <MenuItem onClick={() => handleBulkStatus(false)}>
            <DoNotDisturb sx={{ fontSize: 18, color: '#EF4444' }} />
            Disable Accounts
          </MenuItem>
          <Divider />
          <MenuItem onClick={(e) => setRoleMenuAnchor(e.currentTarget)}>
            <Edit sx={{ fontSize: 18, color: '#3B82F6' }} />
            Change Role
          </MenuItem>
        </Menu>

        <Menu
          anchorEl={roleMenuAnchor}
          open={Boolean(roleMenuAnchor)}
          onClose={() => setRoleMenuAnchor(null)}
          anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
          transformOrigin={{ vertical: 'top', horizontal: 'left' }}
          PaperProps={{
            sx: {
              ml: 1,
              borderRadius: '6px',
              minWidth: 160,
              boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)',
              '& .MuiMenuItem-root': {
                fontSize: '0.85rem',
                fontWeight: 600,
                py: 1
              }
            }
          }}
        >
          {['Student', 'Officer', 'Dean', 'Admin'].map(r => (
            <MenuItem
              key={r}
              onClick={(e) => {
                const roleLower = r.toLowerCase();
                if (roleLower === 'officer' || roleLower === 'dean') {
                  setTargetRole(roleLower);
                  setOrgMenuAnchor(e.currentTarget);
                } else {
                  handleBulkRole(roleLower, []);
                }
              }}
            >
              {r} {(r === 'Officer' || r === 'Dean') && "..."}
            </MenuItem>
          ))}
        </Menu>

        <Menu
          anchorEl={orgMenuAnchor}
          open={Boolean(orgMenuAnchor)}
          onClose={() => setOrgMenuAnchor(null)}
          anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
          transformOrigin={{ vertical: 'top', horizontal: 'left' }}
          PaperProps={{
            sx: {
              ml: 1,
              borderRadius: '6px',
              minWidth: 200,
              maxHeight: 300,
              boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)',
              '& .MuiMenuItem-root': {
                fontSize: '0.85rem',
                fontWeight: 600,
                py: 1
              }
            }
          }}
        >
          <Typography sx={{ px: 2, py: 1, fontSize: '0.75rem', fontWeight: 800, color: '#94A3B8', textTransform: 'uppercase' }}>
            Select Organization
          </Typography>
          <Divider />
          <MenuItem onClick={() => handleBulkRole(targetRole!, [])}>
            <em>No Organization</em>
          </MenuItem>
          {organizations.map(org => (
            <MenuItem key={org._id} onClick={() => handleBulkRole(targetRole!, [org._id])}>
              {org.name}
            </MenuItem>
          ))}
        </Menu>

        {isUpdating && (
          <Box sx={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, bgcolor: 'rgba(255,255,255,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10, borderRadius: '10px' }}>
            <CircularProgress size={32} color="inherit" />
          </Box>
        )}

        {/* Footer Action */}
        {!isManageMode && (
          <Box mt={2}>
            <Button
              fullWidth
              onClick={onExport}
              sx={{
                borderRadius: '8px',
                bgcolor: '#0F172A',
                color: '#FFFFFF',
                py: 1.5,
                fontWeight: 800,
                fontSize: '0.95rem',
                textTransform: 'none',
                border: 'none',
                boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.2), 0 4px 6px -2px rgba(0, 0, 0, 0.1)',
                '&:hover': {
                  bgcolor: '#1E293B',
                  transform: 'translateY(-2px)',
                  boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.3), 0 10px 10px -5px rgba(0, 0, 0, 0.1)'
                },
                transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)'
              }}
            >
              Export List
            </Button>
          </Box>
        )}
      </Box>
    </Dialog>
  );
};

export default DirectoryModal;
