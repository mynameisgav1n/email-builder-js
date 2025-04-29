// SaveButton.tsx
import React, { useEffect, useState } from 'react';
import {
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Snackbar,
  Stack,
} from '@mui/material';
import { CloudUploadOutlined } from '@mui/icons-material';
import { useDocument } from '../../documents/editor/EditorContext';

export default function SaveButton() {
  const document = useDocument();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [mode, setMode] = useState<'new' | 'update' | null>(null);
  const [emails, setEmails] = useState<{ id: string; title: string }[]>([]);
  const [selectedId, setSelectedId] = useState('');
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState<string | null>(null);

  const encoded = btoa(encodeURIComponent(JSON.stringify(document)));
  const fullUrl = `https://emailbuilder.iynj.org/email-builder-js#code/${encoded}`;

  useEffect(() => {
    if (dialogOpen && mode === 'update') {
      fetch('/api/list-emails.php')
        .then(res => res.json())
        .then(data => setEmails(data))
        .catch(err => console.error('Failed to fetch emails:', err));
    }
  }, [dialogOpen, mode]);

  const handleSave = async () => {
    try {
      const endpoint = mode === 'new' ? '/api/save-email.php' : '/api/update-email.php';
      const payload =
        mode === 'new'
          ? { title, full_url: fullUrl }
          : { id: selectedId, full_url: fullUrl };

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error('Save failed');

      const data = await res.json();
      const shortUrl = `https://emailbuilder.iynj.org/${data.short_link}`;

      setMessage(
        mode === 'new'
          ? `Saved! Link: ${shortUrl}`
          : `Updated! Link: ${shortUrl}`
      );

      setDialogOpen(false);
      setMode(null);
      setTitle('');
      setSelectedId('');
    } catch (err) {
      console.error(err);
      setMessage('An error occurred while saving.');
    }
  };

  return (
    <>
      <Tooltip title="Save email">
        <IconButton onClick={() => setDialogOpen(true)}>
          <CloudUploadOutlined fontSize="small" />
        </IconButton>
      </Tooltip>

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)}>
        <DialogTitle>Save Email</DialogTitle>
        <DialogContent>
          {!mode && (
            <Stack spacing={2} mt={1}>
              <Button variant="contained" onClick={() => setMode('new')}>Save as New</Button>
              <Button variant="outlined" onClick={() => setMode('update')}>Update Existing</Button>
            </Stack>
          )}

          {mode === 'new' && (
            <TextField
              autoFocus
              fullWidth
              label="Title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              sx={{ mt: 2 }}
            />
          )}

          {mode === 'update' && (
            <FormControl fullWidth sx={{ mt: 2 }}>
              <InputLabel>Select Email</InputLabel>
              <Select
                value={selectedId}
                label="Select Email"
                onChange={(e) => setSelectedId(e.target.value)}
              >
                {emails.map((email) => (
                  <MenuItem key={email.id} value={email.id}>
                    {email.title}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          )}
        </DialogContent>

        {mode && (
          <DialogActions>
            <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button
              onClick={handleSave}
              disabled={
                (mode === 'new' && !title.trim()) ||
                (mode === 'update' && !selectedId)
              }
            >
              Save
            </Button>
          </DialogActions>
        )}
      </Dialog>

      <Snackbar
        open={!!message}
        autoHideDuration={6000}
        onClose={() => setMessage(null)}
        message={message}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      />
    </>
  );
}
