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
} from '@mui/material';
import SamplesDrawer, { SAMPLES_DRAWER_WIDTH } from './App/SamplesDrawer';
import { useSamplesDrawerOpen } from './documents/editor/EditorContext';
import theme from './theme';

interface PublicTemplate {
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

function TemplatesPage() {
  const [templates, setTemplates] = useState<PublicTemplate[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/list-public-templates.php')
      .then((res) => res.json())
      .then((data) => {
        setTemplates(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Failed to load public templates:', err);
        setLoading(false);
      });
  }, []);

  return (
    <Box sx={{ padding: 3 }}>
      <Typography variant="h5" fontWeight={600} mb={2}>
        Public Templates
      </Typography>

      {loading ? (
        <CircularProgress />
      ) : templates.length === 0 ? (
        <Typography>No public templates found.</Typography>
      ) : (
        <Stack spacing={2}>
          {templates.map((template) => (
            <Card key={template.id} variant="outlined">
              <CardContent>
                <Typography variant="h6">{template.title}</Typography>
                <Typography variant="body2" color="text.secondary" mb={1}>
                  Published on {new Date(template.created_at).toLocaleString()}
                </Typography>
                <Stack direction="row" spacing={2} alignItems="center">
                  <Link
                    href={`/${template.short_link}`}
                    target="_blank"
                    rel="noopener"
                    underline="hover"
                  >
                    View Email
                  </Link>
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
        <TemplatesPage />
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
