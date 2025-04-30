import React, { useEffect, useState } from 'react';
import {
  IconButton,
  Tooltip,
  Menu,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  Snackbar,
} from '@mui/material';
import { CloudUploadOutlined } from '@mui/icons-material';
import { useDocument } from '../../documents/editor/EditorContext';
import { setLoadedEmail } from '../../documents/editor/EditorContext';

export default function SaveButton() {
  const document = useDocument();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [titleDialogOpen, setTitleDialogOpen] = useState(false);
  const [updateDialogOpen, setUpdateDialogOpen] = useState(false);
  const [emails, setEmails] = useState([]);
  const [selectedId, setSelectedId] = useState('');
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState<string | null>(null);

  const encoded = btoa(encodeURIComponent(JSON.stringify(document)));
  const fullUrl = `https://emailbuilder.iynj.org/email-builder-js#code/${encoded}`;

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleSaveNew = () => {
    setAnchorEl(null);
    setTitle('');
    setTitleDialogOpen(true);
  };

  const handleSaveUpdate = () => {
    setAnchorEl(null);
    setUpdateDialogOpen(true);
    fetch('/api/list-emails.php')
      .then((res) => res.json())
      .then((data) => setEmails(data))
      .catch((err) => console.error('Failed to load emails:', err));
  };

  const handleSaveNewSubmit = async () => {
    try {
      const res = await fetch('/api/save-email.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, full_url: fullUrl }),
      });

      const data = await res.json();
      if (!data.short_link) throw new Error('Short link not returned');
      const shortUrl = `https://emailbuilder.iynj.org/email/${data.short_link}`;
      setLoadedEmail(now);
      setMessage(`Saved!`);
      const now = new Date().toLocaleString('en-US', {
        timeZone: 'America/New_York',
        hour12: true,
      });
    } catch (err) {
      console.error(err);
      setMessage('An error occurred while saving.');
    } finally {
      setTitleDialogOpen(false);
    }
  };

  const handleUpdateSubmit = async () => {
    try {
      const res = await fetch('/api/update-email.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: selectedId, full_url: fullUrl }),
      });

      const data = await res.json();
      if (!data.short_link) throw new Error('Short link not returned');
      const shortUrl = `https://emailbuilder.iynj.org/${data.short_link}`;
      setMessage(`Updated!`);
      const now = new Date().toLocaleString('en-US', {
        timeZone: 'America/New_York',
        hour12: true,
      });
setLoadedEmail(now);

    } catch (err) {
      console.error(err);
      setMessage('An error occurred while updating.');
    } finally {
      setUpdateDialogOpen(false);
      setSelectedId('');
    }
  };

  return (
    <>
      <Tooltip title="Save email">
        <IconButton onClick={handleMenuOpen}>
          <CloudUploadOutlined fontSize="small" />
        </IconButton>
      </Tooltip>

      <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={handleMenuClose}>
        <MenuItem onClick={handleSaveNew}>Save as New</MenuItem>
        <MenuItem onClick={handleSaveUpdate}>Update Existing</MenuItem>
      </Menu>

      <Dialog open={titleDialogOpen} onClose={() => setTitleDialogOpen(false)}>
        <DialogTitle>Save as New</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            fullWidth
            label="Email Title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            sx={{ mt: 1 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setTitleDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleSaveNewSubmit} disabled={!title.trim()}>
            Save
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={updateDialogOpen} onClose={() => setUpdateDialogOpen(false)}>
        <DialogTitle>Update Existing Email</DialogTitle>
        <DialogContent>
          <FormControl fullWidth sx={{ mt: 2 }}>
            <InputLabel>Select Email</InputLabel>
            <Select
              value={selectedId}
              label="Select Email"
              onChange={(e) => setSelectedId(e.target.value)}
            >
              {emails.map((email: any) => (
                <MenuItem key={email.id} value={email.id}>
                  {email.title}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setUpdateDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleUpdateSubmit} disabled={!selectedId}>
            Update
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={!!message}
        autoHideDuration={5000}
        onClose={() => setMessage(null)}
        message={message}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      />
    </>
  );
}
