import React, { useEffect, useState } from 'react';
import ReactDOM from 'react-dom/client';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Link,
  Stack,
  CircularProgress,
  CssBaseline,
  ThemeProvider,
  useTheme,
  Button,
} from '@mui/material';

import { SAMPLES_DRAWER_WIDTH } from './App/SamplesDrawer';
import SamplesDrawer from './App/SamplesDrawer';
import { useSamplesDrawerOpen } from './documents/editor/EditorContext';
import theme from './theme';

interface SavedEmail {
  id: number;
  short_link: string;
  title: string;
  created_at: string;
}

function useDrawerTransition(cssProp: 'margin-left', open: boolean) {
  const { transitions } = useTheme();
  return transitions.create(cssProp, {
    easing: !open ? transitions.easing.sharp : transitions.easing.easeOut,
    duration: !open ? transitions.duration.leavingScreen : transitions.duration.enteringScreen,
  });
}

function MyEmailsPage() {
  const [emails, setEmails] = useState<SavedEmail[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/list-emails.php')
      .then((res) => res.json())
      .then((data) => {
        setEmails(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Failed to load emails:', err);
        setLoading(false);
      });
  }, []);

  const handleDelete = async (shortLink: string) => {
    const confirmDelete = confirm('Are you sure you want to delete this saved email?');
    if (!confirmDelete) return;

    try {
      const res = await fetch('/api/delete-email.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ short_link: shortLink }),
      });

      if (!res.ok) throw new Error('Delete failed');

      // Update state after deletion
      setEmails((prev) => prev.filter((e) => e.short_link !== shortLink));
    } catch (err) {
      console.error('Delete error:', err);
      alert('Failed to delete email. Please try again.');
    }
  };

  return (
    <Box sx={{ padding: 3 }}>
      <Typography variant="h5" fontWeight={600} mb={2}>
        My Saved Emails
      </Typography>

      {loading ? (
        <CircularProgress />
      ) : emails.length === 0 ? (
        <Typography>No saved emails found.</Typography>
      ) : (
        <Stack spacing={2}>
          {emails.map((email) => (
            <Card key={email.id} variant="outlined">
              <CardContent>
                <Typography variant="h6">{email.title}</Typography>
                <Typography variant="body2" color="text.secondary" mb={1}>
                  Saved on {new Date(email.created_at).toLocaleString()}
                </Typography>
                <Stack direction="row" spacing={2}>
                  <Link
                    href={`/${email.short_link}`}
                    target="_blank"
                    rel="noopener"
                    underline="hover"
                  >
                    View Email
                  </Link>
                  <Button
                    size="small"
                    color="error"
                    onClick={() => handleDelete(email.short_link)}
                  >
                    Delete
                  </Button>
                </Stack>
              </CardContent>
            </Card>
          ))}
        </Stack>
      )}
    </Box>
  );
}

function LayoutWrapper() {
  const samplesOpen = useSamplesDrawerOpen();
  const mlTransition = useDrawerTransition('margin-left', samplesOpen);

  return (
    <>
      <SamplesDrawer />
      <Stack
        sx={{
          marginLeft: samplesOpen ? `${SAMPLES_DRAWER_WIDTH}px` : 0,
          transition: mlTransition,
        }}
      >
        <MyEmailsPage />
      </Stack>
    </>
  );
}

const root = ReactDOM.createRoot(document.getElementById('root')!);
root.render(
  <React.StrictMode>
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <LayoutWrapper />
    </ThemeProvider>
  </React.StrictMode>
);
