import React, { useState } from 'react';
import {
  ListItem,
  ListItemText,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Snackbar,
  Typography
} from '@mui/material';

export default function LogoutLink() {
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [snackbarOpen, setSnackbarOpen] = useState(false);

  const triggerLogout = async () => {
    // Overwrite saved credentials with bogus ones
    await fetch('/api/protected-test.php', {
      method: 'GET',
      headers: {
        Authorization: 'Basic ' + btoa('logout:logout'),
      },
    });
    setSnackbarOpen(true);
  };

  const handleLogoutClick = () => {
    setConfirmOpen(true);
  };

  const handleConfirm = () => {
    setConfirmOpen(false);
    triggerLogout();
  };

  return (
    <>
      <ListItem button onClick={handleLogoutClick}>
        <ListItemText primary="Log Out" />
      </ListItem>

      <Dialog open={confirmOpen} onClose={() => setConfirmOpen(false)}>
        <DialogTitle>Confirm Logout</DialogTitle>
        <DialogContent>
          <Typography>Are you sure you want to log out?</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmOpen(false)}>Cancel</Button>
          <Button onClick={handleConfirm} color="error" variant="contained">
            Log Out
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={snackbarOpen}
        autoHideDuration={4000}
        onClose={() => setSnackbarOpen(false)}
        message="You've been logged out!"
      />
    </>
  );
}
