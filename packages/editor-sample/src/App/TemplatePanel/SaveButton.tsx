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
  Stack,
} from '@mui/material';
import { CloudUploadOutlined } from '@mui/icons-material';
import { useDocument } from '../../documents/editor/EditorContext';

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

      if (!res.ok) throw new Error('Save failed');
      const data = await res.json();
      const shortUrl = `https://emailbuilder.iynj.org/email/${data.short_link}`;
      setMessage(`Saved! Link: ${shortUrl}`);
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

      if (!res.ok) throw new Error('Update failed');
      const data = await res.json();
      const shortUrl = `https://emailbuilder.iynj.org/email/${data.short_link}`;
      setMessage(`Updated! Link: ${shortUrl}`);
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

      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
        PaperProps={{
          elevation: 4,
          sx: { mt: 1, boxShadow: '0px 4px 12px rgba(0,0,0,0.15)' },
        }}
      >
        <MenuItem onClick={handleSaveNew}>Save as New</MenuItem>
        <MenuItem onClick={handleSaveUpdate}>Update Existing</MenuItem>
      </Menu>

      {/* Dialog for New Email Title */}
      <Dialog open={titleDialogOpen} onClose={() => setTitleDialogOpen(false)}>
        <DialogTitle>Save as New Email</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            fullWidth
            label="Title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            sx={{ mt: 1 }}
          />
        </DialogContent>
        <DialogActions>
          <Button variant="outlined" onClick={() => setTitleDialogOpen(false)}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleSaveNewSubmit}
            disabled={!title.trim()}
          >
            Save
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog for Updating Existing Email */}
      <Dialog open={updateDialogOpen} onClose={() => setUpdateDialogOpen(false)}>
        <DialogTitle>Update Saved Email</DialogTitle>
        <DialogContent>
          <FormControl fullWidth sx={{ mt: 2 }}>
            <InputLabel>Select Email</InputLabel>
            <Select
              value={selectedId}
              label="Select Email"
              onChange={(e) => setSelectedId(e.target.value)}
              MenuProps={{
                PaperProps: {
                  elevation: 4,
                  sx: {
                    boxShadow: '0px 4px 12px rgba(0,0,0,0.15)',
                  },
                },
              }}
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
          <Button variant="outlined" onClick={() => setUpdateDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleUpdateSubmit} disabled={!selectedId}>
            Update
          </Button>
        </DialogActions>
      </Dialog>

      {/* Confirmation Snackbar */}
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
