// useradmin.tsx — Admin Panel for .htpasswd User Management
import React, { useEffect, useState } from 'react';
import {
  Box, Typography, Button, Stack, Dialog, DialogTitle,
  DialogContent, DialogActions, TextField, Snackbar, CircularProgress,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper
} from '@mui/material';
import { Delete, Edit, Add } from '@mui/icons-material';

interface HtpasswdUser {
  username: string;
  last_online?: string;
}

export default function HtpasswdPanel() {
  const [users, setUsers] = useState<HtpasswdUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [snack, setSnack] = useState<{ open: boolean; msg: string }>({ open: false, msg: '' });

  const [newUserDialog, setNewUserDialog] = useState(false);
  const [renameDialog, setRenameDialog] = useState<HtpasswdUser | null>(null);
  const [passwordDialog, setPasswordDialog] = useState<HtpasswdUser | null>(null);
  const [value, setValue] = useState('');

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/htpasswd.php?action=list');
      const json = await res.json();
      if (!res.ok || json.error) throw new Error(json.error || 'Failed to load users');
      setUsers(json.users);
    } catch (err: any) {
      setSnack({ open: true, msg: err.message });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchUsers(); }, []);

  const handleDelete = async (username: string) => {
    if (!confirm(`Delete user "${username}"? This won't delete their saved emails.`)) return;
    try {
      const res = await fetch('/api/htpasswd.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'delete', username }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error || 'Delete failed');
      setSnack({ open: true, msg: 'User deleted' });
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
      setSnack({ open: true, msg: `User created. Password: ${json.password}` });
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
      setSnack({ open: true, msg: 'Password updated' });
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

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" fontWeight={600} gutterBottom>
        .htpasswd User Manager
      </Typography>
      <Button variant="contained" startIcon={<Add />} onClick={() => setNewUserDialog(true)}>
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
                      <Button size="small" onClick={() => { setPasswordDialog(user); setValue(''); }}>Password</Button>
                      <Button size="small" onClick={() => { setRenameDialog(user); setValue(user.username); }}>Rename</Button>
                      <Button size="small" color="error" onClick={() => handleDelete(user.username)}>Delete</Button>
                    </Stack>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Create User Dialog */}
      <Dialog open={newUserDialog} onClose={() => setNewUserDialog(false)}>
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
          <Button onClick={() => setNewUserDialog(false)}>Cancel</Button>
          <Button onClick={handleCreate} disabled={!value.trim()}>Create</Button>
        </DialogActions>
      </Dialog>

      {/* Change Password Dialog */}
      <Dialog open={!!passwordDialog} onClose={() => setPasswordDialog(null)}>
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
            type="password"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPasswordDialog(null)}>Cancel</Button>
          <Button onClick={handlePasswordChange} disabled={!value}>Save</Button>
        </DialogActions>
      </Dialog>

      {/* Rename Dialog */}
      <Dialog open={!!renameDialog} onClose={() => setRenameDialog(null)}>
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
          <Button onClick={() => setRenameDialog(null)}>Cancel</Button>
          <Button onClick={handleRename} disabled={!value.trim() || value === renameDialog?.username}>Rename</Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar */}
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
