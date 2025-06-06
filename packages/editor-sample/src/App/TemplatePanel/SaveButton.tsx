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
import { CloudUploadOutlined, FolderOpenOutlined } from '@mui/icons-material';
import {
  useDocument,
  setDocument,
  setLoadedEmail,
  setLoadedEmailTitle,
  setLoadedEmailId,
  useLoadedEmailId,
  useLoadedEmailTitle,
} from '../../documents/editor/EditorContext';

export default function SaveButton() {
  const document = useDocument();
  const loadedEmailId = useLoadedEmailId();
  const loadedEmailTitle = useLoadedEmailTitle();

  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [titleDialogOpen, setTitleDialogOpen] = useState(false);
  const [updateDialogOpen, setUpdateDialogOpen] = useState(false);
  const [loadDialogOpen, setLoadDialogOpen] = useState(false);
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

  const handleLoadEmail = () => {
    setLoadDialogOpen(true);
    fetch('/api/list-emails.php')
      .then((res) => res.json())
      .then((data) => setEmails(data))
      .catch((err) => console.error('Failed to load emails:', err));
  };

  const handleSaveToCurrent = async () => {
    try {
      const res = await fetch('/api/update-email.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: loadedEmailId, full_url: fullUrl }),
      });

      const data = await res.json();
      if (!data.success) throw new Error('Update failed');

      const now = new Date().toLocaleString('en-US', {
        timeZone: 'America/New_York',
        hour12: true,
      });

      setLoadedEmail(now);
      setMessage('Saved to current email!');
    } catch (err) {
      console.error(err);
      setMessage('Failed to save to current email.');
    } finally {
      setAnchorEl(null);
    }
  };

  const handleSaveNewSubmit = async () => {
    try {
      const res = await fetch('/api/save-email.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, full_url: fullUrl }),
      });

      const data = await res.json();
      if (!data.short_link || !data.id) throw new Error('Save response missing data');

      const now = new Date().toLocaleString('en-US', {
        timeZone: 'America/New_York',
        hour12: true,
      });

      setLoadedEmail(now);
      setLoadedEmailTitle(title);
      setLoadedEmailId(data.id); // ✅ Enables "Save to Current Email"
      setMessage('Saved!');
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

      const now = new Date().toLocaleString('en-US', {
        timeZone: 'America/New_York',
        hour12: true,
      });

      setLoadedEmail(now);
      setLoadedEmailId(selectedId);
      const selected = emails.find((email) => email.id === selectedId);
      if (selected) setLoadedEmailTitle(selected.title);

      setMessage('Updated!');
    } catch (err) {
      console.error(err);
      setMessage('An error occurred while updating.');
    } finally {
      setUpdateDialogOpen(false);
      setSelectedId('');
    }
  };

  const handleLoadSubmit = async () => {
    try {
      const selected = emails.find((e: any) => e.id === selectedId);
      if (!selected || !selected.short_link) throw new Error('No short_link');

      const shortCode = selected.short_link.replace(/^email\//, '');

      const res = await fetch('/api/get-url.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: shortCode }),
      });

      const { full_url } = await res.json();
      if (!full_url) throw new Error('No full_url returned');

      const hashMatch = full_url.match(/#code\/([A-Za-z0-9+/=]+)/);
      if (!hashMatch) throw new Error('No code found in full_url');

      const decoded = JSON.parse(decodeURIComponent(atob(hashMatch[1])));
      setDocument(decoded);
      setLoadedEmailTitle(selected.title);
      setLoadedEmailId(selected.id); // ✅ Track the ID for future "save to current"
      setMessage('Email loaded!');
    } catch (err) {
      console.error(err);
      setMessage('Failed to load email.');
    } finally {
      setLoadDialogOpen(false);
      setSelectedId('');
    }
  };

  return (
    <>
      <Tooltip title="Save email">
        <IconButton onClick={handleMenuOpen} color="primary">
          <CloudUploadOutlined fontSize="small" />
        </IconButton>
      </Tooltip>

      <Tooltip title="Load saved email">
        <IconButton onClick={handleLoadEmail} color="primary">
          <FolderOpenOutlined fontSize="small" />
        </IconButton>
      </Tooltip>

      <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={handleMenuClose}>
        {loadedEmailId && (
          <MenuItem onClick={handleSaveToCurrent}>Save to Current Email</MenuItem>
        )}
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

      <Dialog open={loadDialogOpen} onClose={() => setLoadDialogOpen(false)}>
        <DialogTitle>Load Saved Email</DialogTitle>
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
          <Button onClick={() => setLoadDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleLoadSubmit} disabled={!selectedId}>
            Load
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
