import React from 'react';
import { Button, TextField, Dialog, DialogActions, DialogContent, DialogTitle } from '@mui/material';
import { useDocument } from '../../documents/editor/EditorContext';

export default function SaveButton() {
  const document = useDocument();
  const [open, setOpen] = React.useState(false);
  const [title, setTitle] = React.useState('');

  const handleClickOpen = () => setOpen(true);
  const handleClose = () => setOpen(false);

  const handleSave = async () => {
    const encoded = encodeURIComponent(JSON.stringify(document));
    const shortRes = await fetch('/shorten.php', {
      method: 'POST',
      body: JSON.stringify({ encoded }),
      headers: { 'Content-Type': 'application/json' },
    });
    const { short } = await shortRes.json();

    await fetch('/api/save-email.php', {
      method: 'POST',
      body: JSON.stringify({ title, short_link: short }),
      headers: { 'Content-Type': 'application/json' },
    });

    handleClose();
    alert('Email saved!');
  };

  return (
    <>
      <Button variant="outlined" onClick={handleClickOpen}>Save</Button>
      <Dialog open={open} onClose={handleClose}>
        <DialogTitle>Save Email</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
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
