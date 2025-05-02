import React, { useState } from 'react';
import {
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Typography,
  Backdrop,
  Box,
} from '@mui/material';

export default function LogoutButton() {
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [showLogoutMessage, setShowLogoutMessage] = useState(false);

  const handleLogout = async () => {
    setShowLogoutMessage(true);

    // Wait a moment so user can see the message
    setTimeout(async () => {
      await fetch('/api/protected-test.php', {
        method: 'GET',
        headers: {
          Authorization: 'Basic ' + btoa('logout:logout'), // force browser to forget credentials
        },
      });

      // Optional: reload the page to prompt login again
      window.location.reload();
    }, 1500); // 1.5 seconds to display message
  };

  return (
    <>
      <Button size="small" onClick={() => setConfirmOpen(true)}>
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

      <Backdrop
        open={showLogoutMessage}
        sx={{ color: '#fff', zIndex: (theme) => theme.zIndex.modal + 1 }}
      >
        <Box textAlign="center">
          <Typography variant="h5" fontWeight="bold">
            You’ve been logged out!
          </Typography>
        </Box>
      </Backdrop>
    </>
  );
}
