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
        <iframe
          src="/publicfiles/403.html"
          style={{ width: '100%', height: '100vh', border: 'none' }}
        />
      </LayoutWrapper>
    );
  }

  return (
    <Box sx={{ padding: 3 }}>
      <Typography variant="h5" fontWeight={600} mb={2}>
        .htpasswd User Manager
      </Typography>

      <Button variant="contained" startIcon={<Add />} onClick={() => { setNewUserDialog(true); setValue(''); }}>
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

      {/* New User Dialog */}
      <Dialog open={newUserDialog} onClose={() => { setNewUserDialog(false); setValue(''); }}>
        <DialogTitle>Create New User</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            label="Username"
            value={value}
            onChange={e => setValue(e.target.value)}
            fullWidth
            size="small"
            margin="normal"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => { setNewUserDialog(false); setValue(''); }}>Cancel</Button>
          <Button onClick={handleCreate} disabled={!value.trim()}>Create</Button>
        </DialogActions>
      </Dialog>

      {/* Password Reset Dialog */}
      <Dialog open={!!passwordDialog} onClose={() => { setPasswordDialog(null); setValue(''); setGenerated(''); }}>
        <DialogTitle>Set Password for {passwordDialog?.username}</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            label="New Password"
            value={value}
            onChange={e => setValue(e.target.value)}
            fullWidth
            size="small"
            margin="normal"
            type="text"
          />
          <Button onClick={generateRandomPassword} sx={{ mt: 1 }}>Generate Password</Button>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => { setPasswordDialog(null); setValue(''); setGenerated(''); }}>Cancel</Button>
          <Button onClick={handlePasswordChange} disabled={!value}>Save</Button>
        </DialogActions>
      </Dialog>

      {/* Rename Dialog */}
      <Dialog open={!!renameDialog} onClose={() => { setRenameDialog(null); setValue(''); }}>
        <DialogTitle>Rename User {renameDialog?.username}</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            label="New Username"
            value={value}
            onChange={e => setValue(e.target.value)}
            fullWidth
            size="small"
            margin="normal"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => { setRenameDialog(null); setValue(''); }}>Cancel</Button>
          <Button onClick={handleRename} disabled={!value.trim() || value === renameDialog?.username}>Rename</Button>
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
              <Stack direction="row" alignItems="center">
                <Box component="code" sx={{ p: 1, bgcolor: '#f5f5f5', borderRadius: 1 }}>{resultDialog.username}</Box>
                <IconButton onClick={() => handleCopy(resultDialog.username)}><ContentCopy fontSize="small" /></IconButton>
              </Stack>
            </>
          )}
          <Typography variant="subtitle2" mt={2}>Password:</Typography>
          <Stack direction="row" alignItems="center">
            <Box component="code" sx={{ p: 1, bgcolor: '#f5f5f5', borderRadius: 1 }}>{resultDialog?.password}</Box>
            <IconButton onClick={() => handleCopy(resultDialog!.password)}><ContentCopy fontSize="small" /></IconButton>
          </Stack>
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
  );
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

const root = ReactDOM.createRoot(document.getElementById('root')!);
root.render(
  <React.StrictMode>
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <LayoutWrapper>
        <UserAdminPage />
      </LayoutWrapper>
    </ThemeProvider>
  </React.StrictMode>
);
