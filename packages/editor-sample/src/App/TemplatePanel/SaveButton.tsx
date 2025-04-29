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

  const handleClickOpen = () => setOpen(true);
  const handleClose = () => setOpen(false);

  const handleSave = async () => {
    const encoded = encodeURIComponent(JSON.stringify(document));

    const shortenRes = await fetch('/shorten.php', {
      method: 'POST',
      body: JSON.stringify({ encoded }),
      headers: { 'Content-Type': 'application/json' },
    });

    const { short } = await shortenRes.json();

    await fetch('/api/save-email.php', {
      method: 'POST',
      body: JSON.stringify({ title, short_link: short }),
      headers: { 'Content-Type': 'application/json' },
    });

    alert('Email saved!');
    handleClose();
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
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>Cancel</Button>
          <Button onClick={handleSave} disabled={!title}>Save</Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
