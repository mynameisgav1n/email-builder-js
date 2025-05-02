import React, { useState } from 'react';
import { Button, Snackbar, Typography, Stack } from '@mui/material';

export default function LogoutButton() {
  const [open, setOpen] = useState(false);

  const handleLogout = () => {
    // Make a fetch request with fake credentials to overwrite saved ones
    fetch('/api/protected-test.php', {
      method: 'GET',
      headers: {
        Authorization: 'Basic ' + btoa('logout:logout'), // invalid credentials
      },
    }).finally(() => {
      setOpen(true);
    });
  };

  return (
    <Stack spacing={1} alignItems="flex-start">
      <Button variant="contained" color="error" onClick={handleLogout}>
        Log Out
      </Button>
      <Typography variant="body2" color="text.secondary">
        Logging out will prompt for login again the next time you access a protected page.
      </Typography>
      <Snackbar
        open={open}
        autoHideDuration={3000}
        onClose={() => setOpen(false)}
        message="You have been logged out"
      />
    </Stack>
  );
}
