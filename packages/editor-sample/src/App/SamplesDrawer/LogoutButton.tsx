import React, { useState } from 'react';
import {
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Typography,
} from '@mui/material';

export default function LogoutButton() {
  const [confirmOpen, setConfirmOpen] = useState(false);

  const handleLogout = async () => {
    setConfirmOpen(false); // Close dialog first
    alert("You've been logged out!"); // Show alert

    await fetch('/api/protected-test.php', {
      method: 'GET',
      headers: {
        Authorization: 'Basic ' + btoa('logout:logout'),
      },
    });

    window.location.reload(); // Optional: reload to prompt login
  };

  return (
    <>
      <Button
        size="small"
        color="error"
        variant="contained" // or "outlined" if you prefer a border only
        onClick={() => setConfirmOpen(true)}
      >
        Log Out
      </Button>

      <Dialog open={confirmOpen} onClose={() => setConfirmOpen(false)}>
        <DialogTitle>Confirm Logout</DialogTitle>
        <DialogContent>
          <Typography>Are you sure you want to log out?</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmOpen(false)}>Cancel</Button>
          <Button onClick={handleLogout} color="error" variant="contained">
            Log Out
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
