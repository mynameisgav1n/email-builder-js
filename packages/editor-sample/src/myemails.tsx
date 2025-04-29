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
  useTheme,
  ThemeProvider,
} from '@mui/material';

import { INSPECTOR_DRAWER_WIDTH } from './App/InspectorDrawer';
import { SAMPLES_DRAWER_WIDTH } from './App/SamplesDrawer';
import InspectorDrawer from './App/InspectorDrawer';
import SamplesDrawer from './App/SamplesDrawer';
import { EditorProvider, useInspectorDrawerOpen, useSamplesDrawerOpen } from './documents/editor/EditorContext';
import theme from './theme';

interface SavedEmail {
  id: number;
  short_link: string;
  title: string;
  created_at: string;
}

function useDrawerTransition(cssProperty: 'margin-left' | 'margin-right', open: boolean) {
  const { transitions } = useTheme();
  return transitions.create(cssProperty, {
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
                <Link
                  href={`/${email.short_link}`}
                  target="_blank"
                  rel="noopener"
                  underline="hover"
                >
                  View Email
                </Link>
              </CardContent>
            </Card>
          ))}
        </Stack>
      )}
    </Box>
  );
}

function MyEmailsWithLayout() {
  const inspectorDrawerOpen = useInspectorDrawerOpen();
  const samplesDrawerOpen = useSamplesDrawerOpen();

  const marginLeftTransition = useDrawerTransition('margin-left', samplesDrawerOpen);
  const marginRightTransition = useDrawerTransition('margin-right', inspectorDrawerOpen);

  return (
    <>
      <InspectorDrawer />
      <SamplesDrawer />

      <Stack
        sx={{
          marginRight: inspectorDrawerOpen ? `${INSPECTOR_DRAWER_WIDTH}px` : 0,
          marginLeft: samplesDrawerOpen ? `${SAMPLES_DRAWER_WIDTH}px` : 0,
          transition: [marginLeftTransition, marginRightTransition].join(', '),
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
      <EditorProvider>
        <CssBaseline />
        <MyEmailsWithLayout />
      </EditorProvider>
    </ThemeProvider>
  </React.StrictMode>
);
