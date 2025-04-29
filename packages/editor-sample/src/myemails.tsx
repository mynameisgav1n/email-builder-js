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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Snackbar,
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
  const [renameDialog, setRenameDialog] = useState<null | SavedEmail>(null);
  const [renameTitle, setRenameTitle] = useState('');
  const [confirmDelete, setConfirmDelete] = useState<null | string>(null);
  const [confirmDeleteAll, setConfirmDeleteAll] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

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
    try {
      const res = await fetch('/api/delete-email.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ short_link: shortLink }),
      });

      if (!res.ok) throw new Error('Delete failed');
      setEmails((prev) => prev.filter((e) => e.short_link !== shortLink));
      setMessage('Email deleted.');
    } catch (err) {
      console.error('Delete error:', err);
      setMessage('Failed to delete email.');
    }
  };

  const handleDeleteAll = async () => {
    try {
      const res = await fetch('/api/delete-all-emails.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!res.ok) throw new Error('Delete all failed');
      setEmails([]);
      setMessage('All saved emails deleted.');
    } catch (err) {
      console.error('Delete all error:', err);
      setMessage('Failed to delete all emails.');
    }
  };

  const handleRename = async () => {
    try {
      const res = await fetch('/api/rename-email.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ short_link: renameDialog?.short_link, title: renameTitle }),
      });

      if (!res.ok) throw new Error('Rename failed');

      setEmails((prev) =>
        prev.map((e) =>
          e.short_link === renameDialog?.short_link ? { ...e, title: renameTitle } : e
        )
      );
      setMessage('Email renamed.');
      setRenameDialog(null);
    } catch (err) {
      console.error('Rename error:', err);
      setMessage('Failed to rename email.');
    }
  };

  return (
    <Box sx={{ padding: 3 }}>
      <Typography variant="h5" fontWeight={600} mb={2}>
        My Saved Emails
      </Typography>

      {emails.length > 0 && (
        <Button
          variant="outlined"
          color="error"
          size="small"
          onClick={() => setConfirmDeleteAll(true)}
          sx={{ mb: 2 }}
        >
          Delete All
        </Button>
      )}

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
                <Stack direction="row" spacing={2} alignItems="center">
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
                    onClick={() => {
                      setRenameDialog(email);
                      setRenameTitle(email.title);
                    }}
                  >
                    Rename
                  </Button>
                  <Button
                    size="small"
                    color="error"
                    onClick={() => setConfirmDelete(email.short_link)}
                  >
                    Delete
                  </Button>
                </Stack>
              </CardContent>
            </Card>
          ))}
        </Stack>
      )}

      {/* Rename Dialog */}
      <Dialog open={!!renameDialog} onClose={() => setRenameDialog(null)}>
        <DialogTitle>Rename Email</DialogTitle>
        <DialogContent sx={{ minWidth: 300 }}>
          <TextField
            autoFocus
            fullWidth
            label="New Title"
            value={renameTitle}
            onChange={(e) => setRenameTitle(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRenameDialog(null)}>Cancel</Button>
          <Button onClick={handleRename} disabled={!renameTitle.trim()}>
            Save
          </Button>
        </DialogActions>
      </Dialog>

      {/* Confirm Delete Dialog */}
      <Dialog open={!!confirmDelete} onClose={() => setConfirmDelete(null)}>
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent>
          Are you sure you want to delete this saved email?
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmDelete(null)}>Cancel</Button>
          <Button color="error" onClick={() => {
            handleDelete(confirmDelete!);
            setConfirmDelete(null);
          }}>
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      {/* Confirm Delete All Dialog */}
      <Dialog open={confirmDeleteAll} onClose={() => setConfirmDeleteAll(false)}>
        <DialogTitle>Confirm Delete All</DialogTitle>
        <DialogContent>
          Are you sure you want to delete <strong>all</strong> your saved emails? This cannot be undone.
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmDeleteAll(false)}>Cancel</Button>
          <Button color="error" onClick={() => {
            handleDeleteAll();
            setConfirmDeleteAll(false);
          }}>
            Delete All
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={!!message}
        autoHideDuration={4000}
        onClose={() => setMessage(null)}
        message={message}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      />
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
