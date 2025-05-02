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
  Tooltip
} from '@mui/material';
import {
  Delete,
  Edit,
  FileCopy,
  Folder,
  InsertDriveFile,
  Image as ImageIcon
} from '@mui/icons-material';
import Lightbox from 'yet-another-react-lightbox';
import 'yet-another-react-lightbox/styles.css';

import { SAMPLES_DRAWER_WIDTH } from './App/SamplesDrawer';
import SamplesDrawer from './App/SamplesDrawer';
import { useSamplesDrawerOpen } from './documents/editor/EditorContext';
import theme from './theme';

function useDrawerTransition(cssProp: 'margin-left', open: boolean) {
  const { transitions } = useTheme();
  return transitions.create(cssProp, {
    easing: !open ? transitions.easing.sharp : transitions.easing.easeOut,
    duration: !open ? transitions.duration.leavingScreen : transitions.duration.enteringScreen,
  });
}

interface FileItem {
  name: string;
  type: 'file' | 'folder';
  url?: string;
  username?: string;
  creation_date?: string;
}

function FileManagerPage() {
  const [items, setItems] = useState<FileItem[]>([]);
  const [path, setPath] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [folderName, setFolderName] = useState('');
  const [renameTarget, setRenameTarget] = useState<string | null>(null);
  const [renameNew, setRenameNew] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [username, setUsername] = useState<string>('');

  // fetch current user
  useEffect(() => {
    fetch('/api/user.php')
      .then(res => res.json())
      .then(data => setUsername(data.username || ''))
      .catch(() => setUsername(''));
  }, []);

  // list files/folders
  const fetchFiles = async () => {
    setLoading(true);
    const res = await fetch(`/api/filemanager.php?action=list&path=${encodeURIComponent(path)}`);
    const data = await res.json();
    setItems(data.items || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchFiles();
  }, [path]);

  // upload
  const upload = async () => {
    if (!file || !username) return;
    const formData = new FormData();
    formData.append('file', file);
    formData.append('username', username);

    const res = await fetch(`/api/filemanager.php?action=upload&path=${encodeURIComponent(path)}`, {
      method: 'POST',
      body: formData,
    });
    const data = await res.json();
    setMessage(data.success ? 'Upload successful' : data.error || 'Upload failed');
    setFile(null);
    fetchFiles();
  };

  // delete
  const deleteItem = async (name: string) => {
    if (!window.confirm(`Delete ${name}?`)) return;
    const res = await fetch(`/api/filemanager.php?action=delete`, {
      method: 'POST',
      body: new URLSearchParams({ name: `${path}/${name}` }),
    });
    const data = await res.json();
    setMessage(data.success ? 'Deleted' : data.error);
    fetchFiles();
  };

  // rename
  const renameItem = async () => {
    if (!renameTarget || !renameNew) return;
    const res = await fetch(`/api/filemanager.php?action=rename`, {
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

  // mkdir
  const createFolder = async () => {
    if (!folderName) return;
    const res = await fetch(`/api/filemanager.php?action=mkdir`, {
      method: 'POST',
      body: new URLSearchParams({ path, name: folderName }),
    });
    const data = await res.json();
    setFolderName('');
    setMessage(data.success ? 'Folder created' : data.error);
    fetchFiles();
  };

  // copy link
  const copyLink = (url: string) => {
    navigator.clipboard.writeText(`${location.origin}${url}`);
    setMessage('Link copied!');
  };

  return (
    <Box sx={{ padding: 3 }}>
      <Typography variant="h5" fontWeight={600} mb={2}>
        Public File Manager
      </Typography>

      <Stack direction="row" spacing={2} alignItems="center" mb={2}>
        <TextField
          size="small"
          label="New Folder"
          value={folderName}
          onChange={(e) => setFolderName(e.target.value)}
        />
        <Button onClick={createFolder} variant="outlined">Create Folder</Button>
        <input type="file" onChange={(e) => setFile(e.target.files?.[0] || null)} />
        <Button onClick={upload} variant="contained" disabled={!file || !username}>
          Upload Image
        </Button>
      </Stack>

      {loading ? (
        <CircularProgress />
      ) : (
        <Stack spacing={2}>
          {items.map(item => (
            <Card key={item.name} variant="outlined">
              <CardContent>
                <Stack direction="row" justifyContent="space-between" alignItems="center">
                  <Stack direction="row" spacing={2} alignItems="center">
                    {item.type === 'folder' ? <Folder /> : (
                      item.url?.match(/\.(jpe?g|png|gif|webp)$/i)
                        ? <ImageIcon />
                        : <InsertDriveFile />
                    )}
                    <Typography
                      variant="body1"
                      sx={{ cursor: item.type === 'file' && item.url ? 'pointer' : 'default' }}
                      onClick={() =>
                        item.url?.match(/\.(jpe?g|png|gif|webp)$/i) &&
                        setLightboxUrl(item.url)
                      }
                    >
                      {item.name}
                    </Typography>
                  </Stack>
                  <Stack direction="row" spacing={1} alignItems="center">
                    {item.username && (
                      <Typography variant="caption" sx={{ color: '#555' }}>
                        uploaded by {item.username} on{' '}
                        {new Date(item.creation_date!).toLocaleString()}
                      </Typography>
                    )}
                    {item.url && (
                      <Tooltip title="Copy link">
                        <IconButton onClick={() => copyLink(item.url)}>
                          <FileCopy />
                        </IconButton>
                      </Tooltip>
                    )}
                    <Tooltip title="Rename">
                      <IconButton onClick={() => {
                        setRenameTarget(item.name);
                        setRenameNew(item.name);
                      }}>
                        <Edit />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Delete">
                      <IconButton onClick={() => deleteItem(item.name)}>
                        <Delete />
                      </IconButton>
                    </Tooltip>
                  </Stack>
                </Stack>
              </CardContent>
            </Card>
          ))}
        </Stack>
      )}

      <Dialog open={!!renameTarget} onClose={() => setRenameTarget(null)} fullWidth>
        <DialogTitle>Rename "{renameTarget}"</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            fullWidth
            label="New Name"
            value={renameNew}
            onChange={(e) => setRenameNew(e.target.value)}
            variant="outlined"
            size="small"
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
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      />
    </Box>
  );
}

function LayoutWrapper() {
  const samplesOpen = useSamplesDrawerOpen();
  const mlTransition = useDrawerTransition('margin-left', samplesOpen);

  return (
    <>
      <SamplesDrawer />
      <Stack
        sx={{
          marginLeft: samplesOpen ? `${SAMPLES_DRAWER_WIDTH}px` : 0,
          transition: mlTransition,
        }}
      >
        <FileManagerPage />
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
