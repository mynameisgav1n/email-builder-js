// FileExplorer.tsx
import React, { useEffect, useState } from 'react';
import ReactDOM from 'react-dom/client';
import {
  Box,
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
  Image as ImageIcon,
} from '@mui/icons-material';

import { SAMPLES_DRAWER_WIDTH } from './App/SamplesDrawer';
import SamplesDrawer from './App/SamplesDrawer';
import { useSamplesDrawerOpen } from './documents/editor/EditorContext';
import theme from './theme';

interface FileItem {
  name: string;
  type: 'file' | 'dir';
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

  const [fileToUpload, setFileToUpload] = useState<File | null>(null);
  const [uploading, setUploading] = useState<boolean>(false);

  const [confirmDelete, setConfirmDelete] = useState<FileItem | null>(null);
  const [renameItem, setRenameItem] = useState<FileItem | null>(null);
  const [renameValue, setRenameValue] = useState<string>('');

  const [snack, setSnack] = useState<{ open: boolean; msg: string }>({
    open: false,
    msg: '',
  });

  // Fetch directory listing
  const fetchList = async () => {
    setLoading(true);
    try {
      const res = await fetch(
        `filemanager.php?action=list&path=${encodeURIComponent(path)}`
      );
      const json = await res.json();
      if (!json.error && Array.isArray(json.items)) {
        setItems(json.items);
      } else {
        setSnack({ open: true, msg: json.error || 'List failed' });
      }
    } catch (e) {
      setSnack({ open: true, msg: 'Could not fetch files' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchList();
  }, [path]);

  // Upload handler
  const doUpload = async () => {
    if (!fileToUpload) return;
    setUploading(true);
    const fd = new FormData();
    fd.append('action', 'upload');
    fd.append('path', path);
    fd.append('username', '<?= $usernameFromSession ?>'); // adjust as needed
    fd.append('file', fileToUpload);

    try {
      const res = await fetch('filemanager.php', { method: 'POST', body: fd });
      const j = await res.json();
      if (j.success) {
        setSnack({ open: true, msg: 'Uploaded!' });
        setFileToUpload(null);
        fetchList();
      } else {
        setSnack({ open: true, msg: j.error || 'Upload failed' });
      }
    } catch {
      setSnack({ open: true, msg: 'Upload error' });
    } finally {
      setUploading(false);
    }
  };

  // Delete handler
  const doDelete = async () => {
    if (!confirmDelete) return;
    const target = path + '/' + confirmDelete.name;
    try {
      const res = await fetch(
        `filemanager.php?action=delete&path=${encodeURIComponent(target)}`
      );
      const j = await res.json();
      if (j.success) {
        setSnack({ open: true, msg: 'Deleted!' });
        setConfirmDelete(null);
        fetchList();
      } else {
        setSnack({ open: true, msg: j.error || 'Delete failed' });
      }
    } catch {
      setSnack({ open: true, msg: 'Delete error' });
    }
  };

  // Rename handler
  const doRename = async () => {
    if (!renameItem) return;
    const fd = new FormData();
    fd.append('action', 'rename');
    fd.append('path', path + '/' + renameItem.name);
    fd.append('newName', renameValue);

    try {
      const res = await fetch('filemanager.php', { method: 'POST', body: fd });
      const j = await res.json();
      if (j.success) {
        setSnack({ open: true, msg: 'Renamed!' });
        setRenameItem(null);
        fetchList();
      } else {
        setSnack({ open: true, msg: j.error || 'Rename failed' });
      }
    } catch {
      setSnack({ open: true, msg: 'Rename error' });
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      {/* Breadcrumb + Upload */}
      <Stack direction="row" spacing={2} alignItems="center" mb={2}>
        <Typography variant="h6">/ {path || ''}</Typography>
        <input
          type="file"
          accept="*/*"
          style={{ display: 'none' }}
          id="file-upload"
          onChange={(e) => setFileToUpload(e.target.files?.[0] || null)}
        />
        <label htmlFor="file-upload">
          <Button variant="contained" startIcon={<UploadIcon />}>
            Choose File
          </Button>
        </label>
        <Button
          variant="contained"
          disabled={!fileToUpload || uploading}
          onClick={doUpload}
        >
          {uploading ? <CircularProgress size={18} /> : 'Upload'}
        </Button>
      </Stack>

      {/* File / Folder Grid */}
      {loading ? (
        <CircularProgress />
      ) : (
        <Grid container spacing={2}>
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

          {items.map((it) => (
            <Grid item xs={3} key={it.name}>
              <Card sx={{ position: 'relative', p: 1 }}>
                {/* Rename */}
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

                {/* Delete */}
                <IconButton
                  size="small"
                  sx={{ position: 'absolute', top: 4, right: 4 }}
                  onClick={() => setConfirmDelete(it)}
                >
                  <DeleteIcon fontSize="small" />
                </IconButton>

                {/* Icon + Name */}
                <CardContent
                  onClick={() => {
                    if (it.type === 'dir') {
                      setPath(path ? path + '/' + it.name : it.name);
                    }
                  }}
                  sx={{
                    cursor: it.type === 'dir' ? 'pointer' : 'default',
                    textAlign: 'center',
                  }}
                >
                  {it.type === 'dir' ? (
                    <FolderIcon fontSize="large" />
                  ) : (
                    <ImageIcon fontSize="large" />
                  )}
                  <Typography noWrap>{it.name}</Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {/* Delete Dialog */}
      <Dialog
        open={!!confirmDelete}
        onClose={() => setConfirmDelete(null)}
        maxWidth="xs"
        fullWidth
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
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>Rename “{renameItem?.name}”</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            variant="outlined"
            size="small"
            label="New name"
            value={renameValue}
            onChange={(e) => setRenameValue(e.target.value)}
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

      {/* Snackbar */}
      <Snackbar
        open={snack.open}
        autoHideDuration={3000}
        onClose={() => setSnack((s) => ({ ...s, open: false }))}
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
