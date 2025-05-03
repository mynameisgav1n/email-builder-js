import React, { useEffect, useState } from 'react';
import ReactDOM from 'react-dom/client';
import {
  Box, Typography, Button, Stack, Dialog, DialogTitle,
  DialogContent, DialogActions, TextField, Snackbar, CircularProgress,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper,
  CssBaseline, useTheme, IconButton
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
      <Stack
        sx={{
          marginLeft: samplesOpen ? `${SAMPLES_DRAWER_WIDTH}px` : 0,
          transition: ml,
        }}
      >
        {children}
      </Stack>
    </>
  );
}

function UserAdminPage() {
  const [users, setUsers] = useState<HtpasswdUser[]>([]);
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
      const res = await fetch('/api/htpasswd.php?action=list');
      const json = await res.json();
      if (res.status === 403 || json.error === 'unauthorized') {
        setUnauthorized(true);
        return;
      }
      if (!res.ok || json.error) throw new Error(json.error || 'Failed to load users');
      setUsers(json.users);
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
      const res = await fetch('/api/htpasswd.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'set_password', username: passwordDialog.username, password: value }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error || 'Password update failed');
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
            <Box sx={{ fontSize: 64, color: '#e53935', mb: 2 }}>
              ❌
            </Box>
            <Typography variant="h4" color="error" gutterBottom>
              Access Denied
            </Typography>
            <Typography>You do not have permission to view this page.</Typography>
          </Box>
        </Box>
      </LayoutWrapper>
    );
  }

  return (
    <LayoutWrapper>
      <Box sx={{ p: 3 }}>
        <Typography variant="h5" fontWeight={600} mb={2}>
          .htpasswd User Manager
        </Typography>
        <Button variant="contained" startIcon={<Add />} onClick={() => { setNewUserDialog(true); setValue(''); setGenerated(''); }}>
          Create New User
        </Button>

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
                    <TableCell>{user.username}</TableCell>
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

        {/* Confirm Delete Dialog */}
        <Dialog open={!!confirmDeleteUser} onClose={() => setConfirmDeleteUser(null)}>
          <DialogTitle>Delete User</DialogTitle>
          <DialogContent>
            Are you sure you want to delete user "{confirmDeleteUser}"? This won't delete their saved emails.
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setConfirmDeleteUser(null)}>Cancel</Button>
            <Button color="error" onClick={handleDelete}>Delete</Button>
          </DialogActions>
        </Dialog>

        {/* Result Dialog */}
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
