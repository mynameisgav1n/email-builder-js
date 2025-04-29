import React, { useState } from 'react';
import {
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  TextField,
  DialogActions,
  Button,
  Tooltip,
} from '@mui/material';
import { CloudUploadOutlined } from '@mui/icons-material';
import { useDocument } from '../../documents/editor/EditorContext';

export default function SaveButton() {
  const document = useDocument();
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [saving, setSaving] = useState(false);

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
      // Call save-email.php with title only
      const res = await fetch('/api/save-email.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title }),
      });

      if (!res.ok) throw new Error('Save failed');
      const data = await res.json();

      alert(`Email saved! Your link: https://emailbuilder.iynj.org/${data.short}`);
      handleClose();
    } catch (err) {
      console.error(err);
      alert('Failed to save email. Try again.');
      setSaving(false);
    }
  };

  return (
    <>
      <Tooltip title="Save Email">
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
    </>
  );
}
