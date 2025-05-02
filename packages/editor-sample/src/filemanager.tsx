import React, { useState, useEffect } from 'react';
import {
  Box, Typography, Button, Snackbar, TextField, IconButton,
  Dialog, DialogTitle, DialogContent, DialogActions,
  Card, CardContent, Stack, CircularProgress, Tooltip
} from '@mui/material';
import { Delete, Edit, FileCopy, Folder, InsertDriveFile, Image } from '@mui/icons-material';
import Lightbox from 'yet-another-react-lightbox';
import 'yet-another-react-lightbox/styles.css';

interface FileItem {
  name: string;
  type: 'file' | 'folder';
  url?: string;
  username?: string;
  creation_date?: string;
}

export default function FileManager() {
  const [items, setItems] = useState<FileItem[]>([]);
  const [path, setPath] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [folderName, setFolderName] = useState('');
  const [renameTarget, setRenameTarget] = useState<string | null>(null);
  const [renameNew, setRenameNew] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const username = 'gavin'; // TODO: replace with dynamic session-based user if needed

  const fetchFiles = async () => {
    setLoading(true);
    const res = await fetch(`/filemanager.php?action=list&path=${encodeURIComponent(path)}`);
    const data = await res.json();
    setItems(data.items || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchFiles();
  }, [path]);

  const upload = async () => {
    if (!file) return;
    const formData = new FormData();
    formData.append('file', file);
    formData.append('username', username);

    const res = await fetch(`/filemanager.php?action=upload&path=${encodeURIComponent(path)}`, {
      method: 'POST',
      body: formData,
    });
    const data = await res.json();
    setMessage(data.success ? 'Upload successful' : data.error || 'Upload failed');
    setFile(null);
    fetchFiles();
  };

  const deleteItem = async (name: string) => {
    if (!window.confirm(`Delete ${name}?`)) return;
    const res = await fetch(`/filemanager.php?action=delete`, {
      method: 'POST',
      body: new URLSearchParams({ name: `${path}/${name}` }),
    });
    const data = await res.json();
    setMessage(data.success ? 'Deleted' : data.error);
    fetchFiles();
  };

  const renameItem = async () => {
    if (!renameTarget || !renameNew) return;
    const res = await fetch(`/filemanager.php?action=rename`, {
      method: 'POST',
      body: new URLSearchParams({
        old: `${path}/${renameTarget}`,
        new: renameNew,
      }),
    });
    const data = await res.json();
    setRenameTarget(null);
    setRenameNew('');
    setMessage(data.success ? 'Renamed' : data.error);
    fetchFiles();
  };

  const createFolder = async () => {
    if (!folderName) return;
    const res = await fetch(`/filemanager.php?action=mkdir`, {
      method: 'POST',
      body: new URLSearchParams({ path, name: folderName }),
    });
    const data = await res.json();
    setFolderName('');
    setMessage(data.success ? 'Folder created' : data.error);
    fetchFiles();
  };

  const copyLink = (url: string) => {
    navigator.clipboard.writeText(`${location.origin}${url}`);
    setMessage('Link copied!');
  };

  return (
    <Box p={4}>
      <Typography variant="h4" gutterBottom>Public File Manager</Typography>

      <Stack direction="row" spacing={2} alignItems="center" mb={2}>
        <TextField
          size="small"
          label="New Folder"
          value={folderName}
          onChange={(e) => setFolderName(e.target.value)}
        />
        <Button onClick={createFolder} variant="outlined">Create Folder</Button>
        <input type="file" onChange={(e) => setFile(e.target.files?.[0] || null)} />
        <Button onClick={upload} variant="contained" disabled={!file}>Upload Image</Button>
      </Stack>

      {loading ? <CircularProgress /> : (
        <Stack spacing={2}>
          {items.map(item => (
            <Card key={item.name} variant="outlined">
              <CardContent>
                <Stack direction="row" justifyContent="space-between" alignItems="center">
                  <Stack direction="row" spacing={2} alignItems="center">
                    {item.type === 'folder' ? <Folder /> : (
                      item.url?.match(/\.(jpe?g|png|gif|webp)$/i) ? <Image /> : <InsertDriveFile />
                    )}
                    <Typography
                      variant="body1"
                      sx={{ cursor: item.type === 'file' && item.url ? 'pointer' : 'default' }}
                      onClick={() => item.url && item.url.match(/\.(jpe?g|png|gif|webp)$/i) && setLightboxUrl(item.url)}
                    >
                      {item.name}
                    </Typography>
                  </Stack>
                  <Stack direction="row" spacing={1} alignItems="center">
                    {item.username && (
                      <Typography variant="caption" sx={{ color: '#555' }}>
                        uploaded by {item.username} on {new Date(item.creation_date!).toLocaleString()}
                      </Typography>
                    )}
                    {item.url && (
                      <Tooltip title="Copy link">
                        <IconButton onClick={() => copyLink(item.url)}><FileCopy /></IconButton>
                      </Tooltip>
                    )}
                    <Tooltip title="Rename">
                      <IconButton onClick={() => { setRenameTarget(item.name); setRenameNew(item.name); }}><Edit /></IconButton>
                    </Tooltip>
                    <Tooltip title="Delete">
                      <IconButton onClick={() => deleteItem(item.name)}><Delete /></IconButton>
                    </Tooltip>
                  </Stack>
                </Stack>
              </CardContent>
            </Card>
          ))}
        </Stack>
      )}

      <Dialog open={!!renameTarget} onClose={() => setRenameTarget(null)}>
        <DialogTitle>Rename "{renameTarget}"</DialogTitle>
        <DialogContent>
          <TextField
            label="New name"
            fullWidth
            value={renameNew}
            onChange={(e) => setRenameNew(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRenameTarget(null)}>Cancel</Button>
          <Button onClick={renameItem} variant="contained">Rename</Button>
        </DialogActions>
      </Dialog>

      {lightboxUrl && (
        <Lightbox
          open
          close={() => setLightboxUrl(null)}
          slides={[{ src: lightboxUrl }]}
        />
      )}

      <Snackbar
        open={!!message}
        autoHideDuration={3000}
        onClose={() => setMessage(null)}
        message={message}
      />
    </Box>
  );
}
