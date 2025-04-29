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
  useTheme,
  Paper,
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
  const [selectedCode, setSelectedCode] = useState('');
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const theme = useTheme();

  const encoded = btoa(encodeURIComponent(JSON.stringify(document)));
  const longUrl = `https://emailbuilder.iynj.org/email-builder-js#code/${encoded}`;

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
        body: JSON.stringify({ title, short_link: longUrl }),
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
        body: JSON.stringify({ id: selectedId, short_link: selectedCode, full_url: longUrl }),
      });

      if (!res.ok) throw new Error('Update failed');
      const data = await res.json();
      const shortUrl = `https://emailbuilder.iynj.org/email/${selectedCode}`;
      setMessage(`Updated! Link: ${shortUrl}`);
    } catch (err) {
      console.error(err);
      setMessage('An error occurred while updating.');
    } finally {
      setUpdateDialogOpen(false);
      setSelectedId('');
      setSelectedCode('');
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
          elevation: 6,
          sx: {
            mt: 1.5,
            borderRadius: 2,
            minWidth: 200,
            boxShadow: '0px 8px 24px rgba(0,0,0,0.2)',
            '& .MuiMenuItem-root': {
              padding: '10px 16px',
            },
          },
        }}
      >
        <MenuItem onClick={handleSaveNew}>💾 Save as New</MenuItem>
        <MenuItem onClick={handleSaveUpdate}>✏️ Update Existing</MenuItem>
      </Menu>

      {/* New Email Dialog */}
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
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button variant="outlined" onClick={() => setTitleDialogOpen(false)}>
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleSaveNewSubmit}
            disabled={!title.trim()}
          >
            Save
          </Button>
        </DialogActions>
      </Dialog>

      {/* Update Email Dialog */}
      <Dialog open={updateDialogOpen} onClose={() => setUpdateDialogOpen(false)}>
        <DialogTitle>Update Existing</DialogTitle>
        <DialogContent>
          <FormControl fullWidth sx={{ mt: 2 }}>
            <InputLabel>Email</InputLabel>
            <Select
              value={selectedId}
              label="Email"
              onChange={(e) => {
                const id = e.target.value;
                setSelectedId(id);
                const email = emails.find((em: any) => em.id === id);
                setSelectedCode(email?.short_link || '');
              }}
              MenuProps={{
                PaperProps: {
                  elevation: 5,
                  sx: {
                    boxShadow: '0 4px 20px rgba(0,0,0,0.2)',
                    borderRadius: 1.5,
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
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button variant="outlined" onClick={() => setUpdateDialogOpen(false)}>
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleUpdateSubmit}
            disabled={!selectedId || !selectedCode}
          >
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
