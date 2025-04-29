import React, { useState } from 'react';
import {
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  TextField,
  DialogActions,
  Button,
  Snackbar,
  Tooltip,
} from '@mui/material';
import { CloudUploadOutlined } from '@mui/icons-material';
import { useDocument } from '../../documents/editor/EditorContext';

export default function SaveButton() {
  const document = useDocument();
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const handleClickOpen = () => setOpen(true);
  const handleClose = () => {
    setOpen(false);
    setTitle('');
    setSaving(false);
  };

  const handleSave = async () => {
    if (!title) return;
    setSaving(true);

    try {
      // Step 1: Encode the full URL
      const encoded = encodeURIComponent(JSON.stringify(document));
      const fullUrl = `https://emailbuilder.iynj.org/email-builder-js#code/${btoa(encoded)}`;

      // Step 2: Get a shortened code
      const shortenRes = await fetch('/api/shorten.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ full_url: fullUrl }),
      });

      if (!shortenRes.ok) throw new Error('Failed to shorten URL');
      const { short } = await shortenRes.json();

      // Step 3: Save it to saved_emails with title
      const saveRes = await fetch('/api/save-email.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, short_link: short }),
      });

      if (!saveRes.ok) throw new Error('Failed to save to My Emails');

      setMessage('Saved to My Emails!');
      handleClose();
    } catch (err) {
      console.error(err);
      setMessage('Failed to save email.');
      setSaving(false);
    }
  };

  return (
    <>
      <Tooltip title="Save to My Emails">
        <IconButton onClick={handleClickOpen} color="primary">
          <CloudUploadOutlined />
        </IconButton>
      </Tooltip>

      <Dialog open={open} onClose={handleClose}>
        <DialogTitle>Save Email</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Title"
            fullWidth
            variant="outlined"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            disabled={saving}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose} disabled={saving}>Cancel</Button>
          <Button onClick={handleSave} disabled={!title || saving}>
            {saving ? 'Saving...' : 'Save'}
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
        open={!!message}
        autoHideDuration={4000}
        onClose={() => setMessage(null)}
        message={message}
      />
    </>
  );
}
