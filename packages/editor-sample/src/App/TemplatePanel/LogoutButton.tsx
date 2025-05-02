import React, { useState } from 'react';
import { Button, Snackbar } from '@mui/material';

export default function Trigger401Button() {
  const [open, setOpen] = useState(false);
  const [statusCode, setStatusCode] = useState<number | null>(null);

  const handleClick = async () => {
    try {
      const response = await fetch('/api/protected-test', {
        method: 'GET',
        // No credentials or headers on purpose to trigger 401
      });

      setStatusCode(response.status);
      if (response.status === 401) {
        setOpen(true);
      } else {
        alert(`Unexpected status: ${response.status}`);
      }
    } catch (error) {
      alert('Request failed: ' + error);
    }
  };

  return (
    <>
      <Button variant="contained" color="error" onClick={handleClick}>
        Logout
      </Button>
      <Snackbar
        open={open}
        autoHideDuration={3000}
        onClose={() => setOpen(false)}
        message="401 Unauthorized triggered"
      />
    </>
  );
}
