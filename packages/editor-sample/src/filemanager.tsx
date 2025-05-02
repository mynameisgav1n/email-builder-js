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
  Link as LinkIcon,
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
  const [path, setPath] = useState('');
  const [items, setItems] = useState<FileItem[]>([]);
  const [loading, setLoading] = useState(true);

  const [username, setUsername] = useState('');
  const [usernameLoading, setUsernameLoading] = useState(true);

  const [filesToUpload, setFilesToUpload] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);

  const [confirmDelete, setConfirmDelete] = useState<FileItem | null>(null);
  const [renameItem, setRenameItem]       = useState<FileItem | null>(null);
  const [renameValue, setRenameValue]     = useState('');

  const [newFolderDialog, setNewFolderDialog] = useState(false);
  const [newFolderName, setNewFolderName]     = useState('');

  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxUrl, setLightboxUrl]   = useState('');

  const [snack, setSnack] = useState<{ open: boolean; msg: string }>({
    open: false,
    msg: '',
  });

  // fetch current user
  useEffect(() => {
    fetch('/api/user.php', { headers: { Accept: 'application/json' } })
      .then(res => { if (!res.ok) throw new Error(`HTTP ${res.status}`); return res.json(); })
      .then(json => setUsername(json.username || ''))
      .catch(err => {
        console.error(err);
        setSnack({ open: true, msg: 'Failed to load user' });
      })
      .finally(() => setUsernameLoading(false));
  }, []);

  // fetch list
  const fetchList = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/filemanager.php?action=list&path=${encodeURIComponent(path)}`, {
        headers: { Accept: 'application/json' },
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      if (json.error) throw new Error(json.error);
      setItems(json.items);
    } catch (err: any) {
      console.error(err);
      setSnack({ open: true, msg: err.message });
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    if (!usernameLoading) fetchList();
  }, [path, usernameLoading]);

  // upload
  const doUpload = async () => {
    if (!username || filesToUpload.length === 0) return;
    setUploading(true);
    try {
      for (const file of filesToUpload) {
        const fd = new FormData();
        fd.append('action', 'upload');
        fd.append('path', path);
        fd.append('username', username);
        fd.append('file', file);
        const res = await fetch('/api/filemanager.php', { method: 'POST', body: fd });
        const j = await res.json();
        if (!j.success) throw new Error(j.error || 'Upload failed');
      }
      setSnack({ open: true, msg: 'Uploaded!' });
      setFilesToUpload([]);
      fetchList();
    } catch (err: any) {
      console.error(err);
      setSnack({ open: true, msg: err.message });
    } finally {
      setUploading(false);
    }
  };

  // delete
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
      console.error(err);
      setSnack({ open: true, msg: err.message });
    }
  };

  // rename
  const doRename = async () => {
    if (!renameItem) return;
    try {
      const res = await fetch('/api/filemanager.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'rename',
          old:  path ? `${path}/${renameItem.name}` : renameItem.name,
          new: renameValue,
        }),
      });
      const j = await res.json();
      if (!j.success) throw new Error(j.error || 'Rename failed');
      setSnack({ open: true, msg: 'Renamed!' });
      setRenameItem(null);
      fetchList();
    } catch (err: any) {
      console.error(err);
      setSnack({ open: true, msg: err.message });
    }
  };

  // mkdir
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
      console.error(err);
      setSnack({ open: true, msg: err.message });
    }
  };

  // group
  const folders = items.filter(i => i.type === 'folder');
  const files   = items.filter(i => i.type === 'file');

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" fontWeight={600} mb={2}>
        File Manager
      </Typography>
      <Typography variant="subtitle2" gutterBottom>
        Upload images here to use in emails. Once uploaded, click <strong>Copy Link</strong> to get the image URL.
        <strong>Note:</strong> These files are publicly accessible and do not require a password to view. Please be cautious in what you upload.
      </Typography>
      {/* Upload & New Folder */}
      <Stack direction="row" spacing={2} alignItems="center" mb={2}>
        <Typography variant="h6">/ {path}</Typography>
        <Button
          component="label"
          variant="contained"
          startIcon={<UploadIcon />}
          disabled={uploading}
        >
          Choose Files
          <input
            hidden
            multiple
            type="file"
            accept="image/*"
            onChange={e => setFilesToUpload(Array.from(e.target.files || []))}
          />
        </Button>
        <Button
          variant="contained"
          disabled={!filesToUpload.length || uploading}
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
      {filesToUpload.length > 0 && (
        <Typography variant="body2" mb={2}>
          {filesToUpload.map(f => f.name).join(', ')}
        </Typography>
      )}

      {/* Folders */}
      {folders.length > 0 && <Typography variant="h6">Folders</Typography>}
      <Grid container spacing={2} mb={4}>
        {path && (
          <Grid item xs={3}>
            <Card
              onClick={() =>
                setPath(path.split('/').slice(0, -1).join('/'))
              }
              sx={{ cursor: 'pointer', textAlign: 'center', p: 2 }}
            >
              <UpIcon fontSize="large" />
              <Typography>Up</Typography>
            </Card>
          </Grid>
        )}
        {folders.map(it => (
          <Grid item xs={3} key={it.name}>
            <Card>
              <CardContent
                sx={{ cursor: 'pointer', textAlign: 'center' }}
                onClick={() =>
                  setPath(path ? `${path}/${it.name}` : it.name)
                }
              >
                <FolderIcon fontSize="large" />
                <Typography noWrap mt={1}>
                  {it.name}
                </Typography>
              </CardContent>
              <Box sx={{ p: 1 }}>
                <Stack direction="row" spacing={1} justifyContent="center">
                  <Button
                    size="small"
                    startIcon={<EditIcon />}
                    onClick={() => {
                      setRenameItem(it);
                      setRenameValue(it.name);
                    }}
                  >
                    Rename
                  </Button>
                  <Button
                    size="small"
                    color="error"
                    startIcon={<DeleteIcon />}
                    onClick={() => setConfirmDelete(it)}
                  >
                    Delete
                  </Button>
                </Stack>
              </Box>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Files */}
      {files.length > 0 && <Typography variant="h6">Files</Typography>}
      <Grid container spacing={2}>
        {files.map(it => (
          <Grid item xs={3} key={it.name}>
            <Card>
              <CardContent
                sx={{ cursor: 'pointer', textAlign: 'center', p: 1 }}
                onClick={() => {
                  setLightboxUrl(it.url!);
                  setLightboxOpen(true);
                }}
              >
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
                <Typography noWrap mt={1}>
                  {it.name}
                </Typography>
                <Typography
                  variant="caption"
                  color="text.secondary"
                  display="block"
                >
                  {it.username} •{' '}
                  {new Date(it.creation_date!).toLocaleString()}
                </Typography>
              </CardContent>
              <Box sx={{ p: 1 }}>
                <Stack direction="row" spacing={1} justifyContent="center">
                  <Button
                    size="small"
                    startIcon={<LinkIcon />}
                    onClick={() => {
                      const link = `${window.location.protocol}//${window.location.host}${it.url}`;
                      navigator.clipboard.writeText(link);
                      setSnack({ open: true, msg: 'Link copied!' });
                    }}
                  >
                    Copy Link
                  </Button>
                  <Button
                    size="small"
                    startIcon={<EditIcon />}
                    onClick={() => {
                      setRenameItem(it);
                      setRenameValue(it.name);
                    }}
                  >
                    Rename
                  </Button>
                  <Button
                    size="small"
                    color="error"
                    startIcon={<DeleteIcon />}
                    onClick={() => setConfirmDelete(it)}
                  >
                    Delete
                  </Button>
                </Stack>
              </Box>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Delete Dialog */}
      <Dialog
        open={!!confirmDelete}
        onClose={() => setConfirmDelete(null)}
        fullWidth
        maxWidth="xs"
      >
        <DialogTitle>Delete “{confirmDelete?.name}”?</DialogTitle>
        <DialogActions>
          <Button onClick={() => setConfirmDelete(null)}>Cancel</Button>
          <Button color="error" onClick={doDelete}>
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      {/* Rename Dialog */}
      <Dialog
        open={!!renameItem}
        onClose={() => setRenameItem(null)}
        fullWidth
        maxWidth="xs"
      >
        <DialogTitle>Rename “{renameItem?.name}”</DialogTitle>
        <DialogContent dividers>
          <TextField
            autoFocus
            margin="normal"
            fullWidth
            size="small"
            label="New Name"
            value={renameValue}
            onChange={e => setRenameValue(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRenameItem(null)}>Cancel</Button>
          <Button
            disabled={!renameValue.trim() || renameValue === renameItem?.name}
            onClick={doRename}
          >
            Save
          </Button>
        </DialogActions>
      </Dialog>

      {/* New Folder Dialog */}
      <Dialog
        open={newFolderDialog}
        onClose={() => setNewFolderDialog(false)}
        fullWidth
        maxWidth="xs"
      >
        <DialogTitle>New Folder</DialogTitle>
        <DialogContent dividers>
          <TextField
            autoFocus
            margin="normal"
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

      {/* Lightbox */}
      <Dialog
        open={lightboxOpen}
        onClose={() => setLightboxOpen(false)}
        fullScreen
        BackdropProps={{
          sx: { backgroundColor: 'rgba(0,0,0,0.8)' },
          onClick: () => setLightboxOpen(false),
        }}
        PaperProps={{
          sx: { pointerEvents: 'none', backgroundColor: 'transparent', boxShadow: 'none', m: 0 },
        }}
      >
        <Box
          component="img"
          src={lightboxUrl}
          sx={{
            maxWidth: '90vw',
            maxHeight: '90vh',
            objectFit: 'contain',
            display: 'block',
            m: 'auto',
            pointerEvents: 'auto',
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
