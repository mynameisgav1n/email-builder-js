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
  FormControl,
  InputLabel,
  Select,
  Snackbar,
  Stack,
  MenuProps,
} from '@mui/material';
import { CloudUploadOutlined } from '@mui/icons-material';
import { useDocument } from '../../documents/editor/EditorContext';

export default function SaveButton() {
  const document = useDocument();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [emails, setEmails] = useState([]);
  const [selectedId, setSelectedId] = useState('');
  const [message, setMessage] = useState<string | null>(null);

  const encoded = btoa(encodeURIComponent(JSON.stringify(document)));
  const fullUrl = `https://emailbuilder.iynj.org/email-builder-js#code/${encoded}`;

  const handleOpenMenu = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleCloseMenu = () => {
    setAnchorEl(null);
  };

  const handleSaveNew = async () => {
    handleCloseMenu();

    const title = prompt('Enter a title for your email:');
    if (!title) return;

    try {
      const res = await fetch('/api/save-email.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, full_url: fullUrl }),
      });
      if (!res.ok) throw new Error('Save failed.');
      setMessage('Email saved!');
    } catch (err) {
      setMessage('Failed to save. Please try again.');
    }
  };

  const handleUpdateExisting = () => {
    handleCloseMenu();
    setDialogOpen(true);
    fetch('/api/list-emails.php')
      .then((res) => res.json())
      .then((data) => setEmails(data))
      .catch((err) => console.error('Failed to fetch emails:', err));
  };

  const handleUpdate = async () => {
    try {
      const res = await fetch('/api/update-email.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: selectedId, full_url: fullUrl }),
      });
      if (!res.ok) throw new Error('Update failed.');
      setMessage('Email updated!');
      setDialogOpen(false);
      setSelectedId('');
    } catch (err) {
      setMessage('Failed to update. Please try again.');
    }
  };

  return (
    <>
      <Tooltip title="Save email">
        <IconButton onClick={handleOpenMenu}>
          <CloudUploadOutlined fontSize="small" />
        </IconButton>
      </Tooltip>

      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleCloseMenu}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        transformOrigin={{ vertical: 'top', horizontal: 'center' }}
        MenuListProps={{ disablePadding: true }}
        PaperProps={{ style: { minWidth: 180 } } as MenuProps['PaperProps']}
      >
        <MenuItem onClick={handleSaveNew}>Save as New</MenuItem>
        <MenuItem onClick={handleUpdateExisting}>Update Existing</MenuItem>
      </Menu>

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)}>
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
          <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleUpdate} disabled={!selectedId}>
            Update
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
    </>
  );
}
