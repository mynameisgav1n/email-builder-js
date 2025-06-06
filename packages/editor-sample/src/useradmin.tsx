// useradmin.tsx
import React, { useEffect, useState } from 'react';
import ReactDOM from 'react-dom/client';
import {
  Box, Typography, Button, Stack, Dialog, DialogTitle,
  DialogContent, DialogActions, TextField, Snackbar, CircularProgress,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper,
  CssBaseline, useTheme, IconButton, Chip
} from '@mui/material';
import { Add, ContentCopy } from '@mui/icons-material';
import { ThemeProvider } from '@mui/material/styles';

import { SAMPLES_DRAWER_WIDTH } from './App/SamplesDrawer';
import SamplesDrawer from './App/SamplesDrawer';
import { useSamplesDrawerOpen } from './documents/editor/EditorContext';
import theme from './theme';

interface HtpasswdUser {
  username: string;
  last_online?: string;
  reset_required?: boolean;
}

function useDrawerTransition(cssProp: 'margin-left', open: boolean) {
  const { transitions } = useTheme();
  return transitions.create(cssProp, {
    easing: !open ? transitions.easing.sharp : transitions.easing.easeOut,
    duration: !open ? transitions.duration.leavingScreen : transitions.duration.enteringScreen,
  });
}

function LayoutWrapper({ children }: { children?: React.ReactNode }) {
  const samplesOpen = useSamplesDrawerOpen();
  const ml = useDrawerTransition('margin-left', samplesOpen);
  return (
    <>
      <SamplesDrawer />
      <Stack sx={{ marginLeft: samplesOpen ? `${SAMPLES_DRAWER_WIDTH}px` : 0, transition: ml }}>
        {children}
      </Stack>
    </>
  );
}

function UserAdminPage() {
  const [users, setUsers] = useState<HtpasswdUser[]>([]);
  const [admins, setAdmins] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [snack, setSnack] = useState<{ open: boolean; msg: string }>({ open: false, msg: '' });
  const [unauthorized, setUnauthorized] = useState(false);

  const [newUserDialog, setNewUserDialog] = useState(false);
  const [renameDialog, setRenameDialog] = useState<HtpasswdUser | null>(null);
  const [passwordDialog, setPasswordDialog] = useState<HtpasswdUser | null>(null);
  const [value, setValue] = useState('');
  const [generated, setGenerated] = useState<string>('');

  const [confirmDeleteUser, setConfirmDeleteUser] = useState<string | null>(null);
  const [resultDialog, setResultDialog] = useState<null | { type: 'create' | 'reset'; username: string; password: string }>(null);

const fetchUsers = async () => {
  setLoading(true);
  try {
    const [userRes, adminRes] = await Promise.all([
      fetch('/api/user.php'),
      fetch('/api/user.php?action=admins'),
    ]);

    const userJson = await userRes.json();
    const adminJson = await adminRes.json();

    if (!userRes.ok || userJson.error || !userJson.username) {
      setUnauthorized(true);
      return;
    }

    const currentUsername = userJson.username;
    const isAdmin = Array.isArray(adminJson.admins) && adminJson.admins.includes(currentUsername);

    if (!isAdmin) {
      setUnauthorized(true);
      return;
    }

    const usersRes = await fetch('/api/htpasswd.php?action=list');
    const usersJson = await usersRes.json();
    if (!usersRes.ok || usersJson.error) throw new Error(usersJson.error || 'Failed to load users');

    setUsers(usersJson.users);
    setAdmins(adminJson.admins || []);
  } catch (err: any) {
    setSnack({ open: true, msg: err.message });
  } finally {
    setLoading(false);
  }
};


  useEffect(() => { fetchUsers(); }, []);

  const handleDelete = async () => {
    if (!confirmDeleteUser) return;
    try {
      const res = await fetch('/api/htpasswd.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'delete', username: confirmDeleteUser }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error || 'Delete failed');
      setSnack({ open: true, msg: 'User deleted' });
      setConfirmDeleteUser(null);
      fetchUsers();
    } catch (err: any) {
      setSnack({ open: true, msg: err.message });
    }
  };

  const handleCreate = async () => {
    try {
      const res = await fetch('/api/htpasswd.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'create', username: value }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error || 'Create failed');
      setResultDialog({ type: 'create', username: value, password: json.password });
      setValue('');
      setGenerated('');
      setNewUserDialog(false);
      fetchUsers();
    } catch (err: any) {
      setSnack({ open: true, msg: err.message });
    }
  };

const handlePasswordChange = async () => {
  if (!passwordDialog) return;
  try {
    // Step 1: Reset the user's password
    const res = await fetch('/api/htpasswd.php', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'set_password', username: passwordDialog.username, password: value }),
    });
    const json = await res.json();
    if (!json.success) throw new Error(json.error || 'Password update failed');

    // Step 2: Mark the user as needing to reset their password on next login
    const markRes = await fetch('/api/user.php', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'mark_reset', username: passwordDialog.username }),
    });
    const markJson = await markRes.json();
    if (!markJson.success) throw new Error(markJson.error || 'Failed to mark password reset flag');

    // Step 3: Show success dialog
    setResultDialog({ type: 'reset', username: passwordDialog.username, password: json.password || value });
    setPasswordDialog(null);
    setValue('');
    setGenerated('');
  } catch (err: any) {
    setSnack({ open: true, msg: err.message });
  }
};


  const handleRename = async () => {
    if (!renameDialog) return;
    try {
      const res = await fetch('/api/htpasswd.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'rename', old: renameDialog.username, new: value }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error || 'Rename failed');
      setSnack({ open: true, msg: 'Username updated' });
      setRenameDialog(null);
      setValue('');
      fetchUsers();
    } catch (err: any) {
      setSnack({ open: true, msg: err.message });
    }
  };

  const generateRandomPassword = () => {
    const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < 10; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setValue(result);
    setGenerated(result);
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setSnack({ open: true, msg: 'Copied to clipboard!' });
  };

  if (unauthorized) {
    return (
      <LayoutWrapper>
        <Box sx={{ width: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', py: 5 }}>
          <Box sx={{ maxWidth: 450, textAlign: 'center', backgroundColor: '#fff', p: 4, borderRadius: 2, boxShadow: 3 }}>
            <Box sx={{ fontSize: 64, color: '#e53935', mb: 2 }}>❌</Box>
            <Typography variant="h4" color="error" gutterBottom>Access Denied</Typography>
            <Typography>You do not have permission to view this page.</Typography>
          </Box>
        </Box>
      </LayoutWrapper>
    );
  }

  return (
    <LayoutWrapper>
      <Box sx={{ p: 3 }}>
        <Typography variant="h5" fontWeight={600} mb={2}>User Management</Typography>
        <Button variant="contained" startIcon={<Add />} onClick={() => { setNewUserDialog(true); setValue(''); setGenerated(''); }}>Create New User</Button>

        {loading ? (
          <CircularProgress sx={{ mt: 4 }} />
        ) : (
          <TableContainer component={Paper} sx={{ mt: 3 }}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Username</TableCell>
                  <TableCell>Last Online</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {users.map(user => (
                  <TableRow key={user.username}>
                    <TableCell>
                      <Stack direction="row" spacing={1} alignItems="center">
                        <Typography>{user.username}</Typography>
                        {admins.includes(user.username) && (
                          <Chip label="Admin" size="small" color="primary" sx={{ fontSize: '0.7rem', height: 20 }} />
                        )}
                        {user.reset_required && (
                          <Chip label="Password Reset Required" size="small" color="warning" sx={{ fontSize: '0.7rem', height: 20, opacity: 0.8 }} />
                        )}
                      </Stack>
                    </TableCell>
                    <TableCell>{user.last_online || 'N/A'}</TableCell>
                    <TableCell align="right">
                      <Stack direction="row" spacing={1} justifyContent="flex-end">
                        <Button size="small" onClick={() => { setPasswordDialog(user); setValue(''); setGenerated(''); }}>Password</Button>
                        <Button size="small" onClick={() => { setRenameDialog(user); setValue(user.username); }}>Rename</Button>
                        <Button size="small" color="error" onClick={() => setConfirmDeleteUser(user.username)}>Delete</Button>
                      </Stack>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}

        {/* Dialogs remain unchanged */}
        {/* New, Rename, Password, Confirm Delete, Result, Snackbar */}

        {/* New User Dialog */}
        <Dialog open={newUserDialog} onClose={() => { setNewUserDialog(false); setValue(''); setGenerated(''); }}>
          <DialogTitle>Create New User</DialogTitle>
          <DialogContent>
            <TextField autoFocus label="Username" value={value} onChange={e => setValue(e.target.value)} fullWidth size="small" margin="normal" />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => { setNewUserDialog(false); setValue(''); setGenerated(''); }}>Cancel</Button>
            <Button onClick={handleCreate} disabled={!value.trim()}>Create</Button>
          </DialogActions>
        </Dialog>

        <Dialog open={!!passwordDialog} onClose={() => { setPasswordDialog(null); setValue(''); setGenerated(''); }}>
          <DialogTitle>Set Password for {passwordDialog?.username}</DialogTitle>
          <DialogContent>
            <TextField autoFocus label="New Password" value={value} onChange={e => setValue(e.target.value)} fullWidth size="small" margin="normal" />
            <Button onClick={generateRandomPassword} sx={{ mt: 1 }}>Generate Password</Button>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => { setPasswordDialog(null); setValue(''); setGenerated(''); }}>Cancel</Button>
            <Button onClick={handlePasswordChange} disabled={!value}>Save</Button>
          </DialogActions>
        </Dialog>

        <Dialog open={!!renameDialog} onClose={() => { setRenameDialog(null); setValue(''); }}>
          <DialogTitle>Rename User {renameDialog?.username}</DialogTitle>
          <DialogContent>
            <TextField autoFocus label="New Username" value={value} onChange={e => setValue(e.target.value)} fullWidth size="small" margin="normal" />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => { setRenameDialog(null); setValue(''); }}>Cancel</Button>
            <Button onClick={handleRename} disabled={!value.trim() || value === renameDialog?.username}>Rename</Button>
          </DialogActions>
        </Dialog>

        <Dialog open={!!confirmDeleteUser} onClose={() => setConfirmDeleteUser(null)}>
          <DialogTitle>Delete User</DialogTitle>
          <DialogContent>Are you sure you want to delete user "{confirmDeleteUser}"?</DialogContent>
          <DialogActions>
            <Button onClick={() => setConfirmDeleteUser(null)}>Cancel</Button>
            <Button color="error" onClick={handleDelete}>Delete</Button>
          </DialogActions>
        </Dialog>

        <Dialog open={!!resultDialog} onClose={() => setResultDialog(null)}>
          <DialogTitle>
            {resultDialog?.type === 'create' ? 'New User Created' : `Password Reset for "${resultDialog?.username}"`}
          </DialogTitle>
          <DialogContent>
            {resultDialog?.type === 'create' && (
              <>
                <Typography variant="subtitle2">Username:</Typography>
                <Box display="flex" alignItems="center" mb={1}>
                  <code style={{ backgroundColor: '#eee', padding: '4px 8px', borderRadius: 4 }}>{resultDialog.username}</code>
                  <IconButton onClick={() => handleCopy(resultDialog.username)}><ContentCopy fontSize="small" /></IconButton>
                </Box>
              </>
            )}
            <Typography variant="subtitle2">Password:</Typography>
            <Box display="flex" alignItems="center">
              <code style={{ backgroundColor: '#eee', padding: '4px 8px', borderRadius: 4 }}>{resultDialog?.password}</code>
              <IconButton onClick={() => handleCopy(resultDialog!.password)}><ContentCopy fontSize="small" /></IconButton>
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setResultDialog(null)}>Close</Button>
          </DialogActions>
        </Dialog>

        <Snackbar
          open={snack.open}
          autoHideDuration={4000}
          onClose={() => setSnack(s => ({ ...s, open: false }))}
          message={snack.msg}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        />
      </Box>
    </LayoutWrapper>
  );
}

const root = ReactDOM.createRoot(document.getElementById('root')!);
root.render(
  <React.StrictMode>
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <UserAdminPage />
    </ThemeProvider>
  </React.StrictMode>
);
