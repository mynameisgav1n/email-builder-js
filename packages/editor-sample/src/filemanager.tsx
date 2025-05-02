// FileExplorer.tsx
import React, { useEffect, useState } from 'react';
import ReactDOM from 'react-dom/client';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Stack,
  CircularProgress,
  CssBaseline,
  ThemeProvider,
  useTheme,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Snackbar,
  IconButton,
} from '@mui/material';
import {
  Upload as UploadIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  ArrowUpward as UpIcon,
  Folder as FolderIcon,
  Add as AddIcon,
  Image as ImageIcon,
} from '@mui/icons-material';

import { SAMPLES_DRAWER_WIDTH } from './App/SamplesDrawer';
import SamplesDrawer from './App/SamplesDrawer';
import { useSamplesDrawerOpen } from './documents/editor/EditorContext';
import theme from './theme';

interface FileItem {
  name: string;
  type: 'folder' | 'file';
  url?: string;
  username?: string;
  creation_date?: string;
}

function useDrawerTransition(cssProp: 'margin-left', open: boolean) {
  const { transitions } = useTheme();
  return transitions.create(cssProp, {
    easing: !open ? transitions.easing.sharp : transitions.easing.easeOut,
    duration: !open
      ? transitions.duration.leavingScreen
      : transitions.duration.enteringScreen,
  });
}

function FileExplorerPage() {
  const [path, setPath] = useState<string>('');
  const [items, setItems] = useState<FileItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // current user
  const [username, setUsername] = useState<string>('');
  const [usernameLoading, setUsernameLoading] = useState<boolean>(true);

  // upload
  const [fileToUpload, setFileToUpload] = useState<File | null>(null);
  const [uploading, setUploading] = useState<boolean>(false);

  // delete
  const [confirmDelete, setConfirmDelete] = useState<FileItem | null>(null);

  // rename
  const [renameItem, setRenameItem] = useState<FileItem | null>(null);
  const [renameValue, setRenameValue] = useState<string>('');

  // new folder
  const [newFolderDialog, setNewFolderDialog] = useState<boolean>(false);
  const [newFolderName, setNewFolderName] = useState<string>('');

  // lightbox
  const [lightboxOpen, setLightboxOpen] = useState<boolean>(false);
  const [lightboxUrl, setLightboxUrl] = useState<string>('');

  // snackbar
  const [snack, setSnack] = useState<{ open: boolean; msg: string }>({
    open: false,
    msg: '',
  });

  // fetch current username
  useEffect(() => {
    fetch('/api/user.php', { headers: { Accept: 'application/json' } })
      .then(res => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then(json => {
        setUsername(json.username ?? '');
      })
      .catch(err => {
        console.error('User fetch error:', err);
        setSnack({ open: true, msg: 'Failed to load user' });
      })
      .finally(() => setUsernameLoading(false));
  }, []);

  // fetch file list
  const fetchList = async () => {
    setLoading(true);
    try {
      const res = await fetch(
        `/api/filemanager.php?action=list&path=${encodeURIComponent(path)}`,
        { headers: { Accept: 'application/json' } }
      );
      if (!res.ok) throw new Error(`HTTP ${res.status} ${res.statusText}`);
      const json = await res.json();
      if (json.error) throw new Error(json.error);
      if (!Array.isArray(json.items)) throw new Error('Malformed response');
      setItems(json.items);
    } catch (err: any) {
      console.error('List error:', err);
      setSnack({ open: true, msg: err.message });
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    if (!usernameLoading) fetchList();
  }, [path, usernameLoading]);

  // upload handler
  const doUpload = async () => {
    if (!fileToUpload || !username) return;
    setUploading(true);
    const fd = new FormData();
    fd.append('action', 'upload');
    fd.append('path', path);
    fd.append('username', username);
    fd.append('file', fileToUpload);
    try {
      const res = await fetch('/api/filemanager.php', { method: 'POST', body: fd });
      const j = await res.json();
      if (!j.success) throw new Error(j.error || 'Upload failed');
      setSnack({ open: true, msg: 'Uploaded!' });
      setFileToUpload(null);
      fetchList();
    } catch (err: any) {
      console.error('Upload error:', err);
      setSnack({ open: true, msg: err.message });
    } finally {
      setUploading(false);
    }
  };

  // delete handler
  const doDelete = async () => {
    if (!confirmDelete) return;
    try {
      const res = await fetch('/api/filemanager.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'delete',
          name: path ? `${path}/${confirmDelete.name}` : confirmDelete.name,
        }),
      });
      const j = await res.json();
      if (!j.success) throw new Error(j.error || 'Delete failed');
      setSnack({ open: true, msg: 'Deleted!' });
      setConfirmDelete(null);
      fetchList();
    } catch (err: any) {
      console.error('Delete error:', err);
      setSnack({ open: true, msg: err.message });
    }
  };

  // rename handler
  const doRename = async () => {
    if (!renameItem) return;
    try {
      const res = await fetch('/api/filemanager.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'rename',
          old: path ? `${path}/${renameItem.name}` : renameItem.name,
          new: renameValue,
        }),
      });
      const j = await res.json();
      if (!j.success) throw new Error(j.error || 'Rename failed');
      setSnack({ open: true, msg: 'Renamed!' });
      setRenameItem(null);
      fetchList();
    } catch (err: any) {
      console.error('Rename error:', err);
      setSnack({ open: true, msg: err.message });
    }
  };

  // create folder handler
  const doCreateFolder = async () => {
    if (!newFolderName.trim()) return;
    try {
      const res = await fetch('/api/filemanager.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'mkdir',
          path,
          name: newFolderName.trim(),
        }),
      });
      const j = await res.json();
      if (!j.success) throw new Error(j.error || 'Create folder failed');
      setSnack({ open: true, msg: 'Folder created!' });
      setNewFolderDialog(false);
      setNewFolderName('');
      fetchList();
    } catch (err: any) {
      console.error('MkDir error:', err);
      setSnack({ open: true, msg: err.message });
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      {/* Upload & New Folder */}
      <Stack direction="row" spacing={2} alignItems="center" mb={2}>
        <Typography variant="h6">/ {path}</Typography>

        <Button component="label" variant="contained" startIcon={<UploadIcon />}>
          Choose File
          <input
            hidden
            type="file"
            accept="image/*"
            onChange={e => setFileToUpload(e.target.files?.[0] ?? null)}
          />
        </Button>
        <Button
          variant="contained"
          disabled={!fileToUpload || uploading}
          onClick={doUpload}
        >
          {uploading ? <CircularProgress size={18} /> : 'Upload'}
        </Button>

        <Button
          variant="outlined"
          startIcon={<AddIcon />}
          onClick={() => setNewFolderDialog(true)}
        >
          New Folder
        </Button>
      </Stack>

      {/* Grid */}
      {loading ? (
        <CircularProgress />
      ) : (
        <Grid container spacing={2}>
          {path && (
            <Grid item xs={3}>
              <Card
                onClick={() => setPath(path.split('/').slice(0, -1).join('/'))}
                sx={{ cursor: 'pointer', textAlign: 'center', p: 2 }}
              >
                <UpIcon fontSize="large" />
                <Typography>Up</Typography>
              </Card>
            </Grid>
          )}

          {items.map(it => (
            <Grid item xs={3} key={it.name}>
              <Card sx={{ position: 'relative', p: 1 }}>
                <IconButton
                  size="small"
                  sx={{ position: 'absolute', top: 4, left: 4 }}
                  onClick={() => {
                    setRenameItem(it);
                    setRenameValue(it.name);
                  }}
                >
                  <EditIcon fontSize="small" />
                </IconButton>
                <IconButton
                  size="small"
                  sx={{ position: 'absolute', top: 4, right: 4 }}
                  onClick={() => setConfirmDelete(it)}
                >
                  <DeleteIcon fontSize="small" />
                </IconButton>

                <CardContent
                  sx={{ cursor: 'pointer', textAlign: 'center', pt: 2 }}
                  onClick={() => {
                    if (it.type === 'folder') {
                      setPath(path ? `${path}/${it.name}` : it.name);
                    } else {
                      setLightboxUrl(it.url!);
                      setLightboxOpen(true);
                    }
                  }}
                >
                  {it.type === 'folder' ? (
                    <FolderIcon fontSize="large" />
                  ) : (
                    <Box
                      component="img"
                      src={it.url}
                      sx={{
                        width: '100%',
                        height: 120,
                        objectFit: 'cover',
                        borderRadius: 1,
                      }}
                    />
                  )}
                  <Typography noWrap mt={1}>{it.name}</Typography>
                  {it.type === 'file' && (
                    <Typography variant="caption" color="text.secondary" display="block">
                      {it.username} • {new Date(it.creation_date!).toLocaleString()}
                    </Typography>
                  )}
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {/* Delete Dialog */}
      <Dialog open={!!confirmDelete} onClose={() => setConfirmDelete(null)} fullWidth maxWidth="xs">
        <DialogTitle>Delete “{confirmDelete?.name}”?</DialogTitle>
        <DialogActions>
          <Button onClick={() => setConfirmDelete(null)}>Cancel</Button>
          <Button color="error" onClick={doDelete}>
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      {/* Rename Dialog */}
      <Dialog open={!!renameItem} onClose={() => setRenameItem(null)} fullWidth maxWidth="xs">
        <DialogTitle>Rename “{renameItem?.name}”</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            fullWidth
            size="small"
            label="New Name"
            value={renameValue}
            onChange={e => setRenameValue(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRenameItem(null)}>Cancel</Button>
          <Button disabled={!renameValue.trim() || renameValue === renameItem?.name} onClick={doRename}>
            Save
          </Button>
        </DialogActions>
      </Dialog>

      {/* New Folder Dialog */}
      <Dialog open={newFolderDialog} onClose={() => setNewFolderDialog(false)} fullWidth maxWidth="xs">
        <DialogTitle>New Folder</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            fullWidth
            size="small"
            label="Folder Name"
            value={newFolderName}
            onChange={e => setNewFolderName(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setNewFolderDialog(false)}>Cancel</Button>
          <Button onClick={doCreateFolder} disabled={!newFolderName.trim()}>
            Create
          </Button>
        </DialogActions>
      </Dialog>

      {/* Image Lightbox */}
      <Dialog open={lightboxOpen} onClose={() => setLightboxOpen(false)} fullWidth maxWidth="lg">
        <Box
          component="img"
          src={lightboxUrl}
          sx={{
            maxWidth: '90vw',
            maxHeight: '90vh',
            objectFit: 'contain',
            display: 'block',
            m: 'auto',
          }}
        />
      </Dialog>

      {/* Snackbar */}
      <Snackbar
        open={snack.open}
        autoHideDuration={3000}
        onClose={() => setSnack(s => ({ ...s, open: false }))}
        message={snack.msg}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      />
    </Box>
  );
}

function LayoutWrapper() {
  const samplesOpen = useSamplesDrawerOpen();
  const ml = useDrawerTransition('margin-left', samplesOpen);

  return (
    <>
      <SamplesDrawer />
      <Stack
        sx={{
          marginLeft: samplesOpen ? `${SAMPLES_DRAWER_WIDTH}px` : 0,
          transition: ml,
        }}
      >
        <FileExplorerPage />
      </Stack>
    </>
  );
}

const root = ReactDOM.createRoot(document.getElementById('root')!);
root.render(
  <React.StrictMode>
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <LayoutWrapper />
    </ThemeProvider>
  </React.StrictMode>
);
