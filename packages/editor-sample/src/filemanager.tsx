import React, { useEffect, useState } from 'react';
import ReactDOM from 'react-dom/client';
import {
  Box,
  Breadcrumbs,
  Link,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Typography,
  Stack,
  CircularProgress,
  CssBaseline,
  ThemeProvider,
  useTheme,
  Button,
  TextField,
  IconButton,
  Tooltip,
  Snackbar,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions
} from '@mui/material';
import {
  Folder as FolderIcon,
  InsertDriveFile as FileIcon,
  FileCopy,
  Edit,
  Delete,
  ArrowUpward
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
  const [path, setPath] = useState<string>('');
  const [file, setFile] = useState<File | null>(null);
  const [folderName, setFolderName] = useState<string>('');
  const [renameTarget, setRenameTarget] = useState<string | null>(null);
  const [renameNew, setRenameNew] = useState<string>('');
  const [message, setMessage] = useState<string | null>(null);
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [username, setUsername] = useState<string>('');

  useEffect(() => {
    fetch('/api/user.php')
      .then(res => res.json())
      .then(data => setUsername(data.username || ''))
      .catch(() => setUsername(''));
  }, []);

  const fetchFiles = async () => {
    setLoading(true);
    const res = await fetch(`/api/filemanager.php?action=list&path=${encodeURIComponent(path)}`);
    const data = await res.json();
    setItems((data.items || []).filter(item => !item.name.startsWith('.')));
    setLoading(false);
  };

  useEffect(() => {
    fetchFiles();
  }, [path]);

  const navigateUp = () => {
    const parts = path.split('/').filter(Boolean);
    parts.pop();
    setPath(parts.join('/'));
  };

  const navigateInto = (name: string) => {
    setPath(prev => prev ? `${prev}/${name}` : name);
  };

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

  const createFolder = async () => {
    if (!folderName) return;
    const res = await fetch(`/api/filemanager.php?action=mkdir`, {
      method: 'POST',
      body: new URLSearchParams({ path, name: folderName }),
    });
    const data = await res.json();
    setMessage(data.success ? 'Folder created' : data.error);
    setFolderName('');
    fetchFiles();
  };

  const deleteItem = async (name: string) => {
    if (!window.confirm(`Delete ${name}?`)) return;
    const res = await fetch(`/api/filemanager.php?action=delete`, {
      method: 'POST',
      body: new URLSearchParams({ name: path ? `${path}/${name}` : name }),
    });
    const data = await res.json();
    setMessage(data.success ? 'Deleted' : data.error);
    fetchFiles();
  };

  const renameItem = async () => {
    if (!renameTarget || !renameNew) return;
    const res = await fetch(`/api/filemanager.php?action=rename`, {
      method: 'POST',
      body: new URLSearchParams({
        old: path ? `${path}/${renameTarget}` : renameTarget,
        new: renameNew,
      }),
    });
    const data = await res.json();
    setMessage(data.success ? 'Renamed' : data.error);
    setRenameTarget(null);
    setRenameNew('');
    fetchFiles();
  };

  const copyLink = (url: string) => {
    navigator.clipboard.writeText(`${location.origin}${url}`);
    setMessage('Link copied!');
  };

  // breadcrumbs
  const parts = path.split('/').filter(Boolean);
  const crumbs = [{ label: 'Home', value: '' }, ...parts.map((p, i) => ({
    label: p,
    value: parts.slice(0, i + 1).join('/')
  }))];

  return (
    <Box sx={{ p: 3 }}>
      <Stack direction="row" alignItems="center" spacing={1} mb={2}>
        {path && (
          <IconButton size="small" onClick={navigateUp}>
            <ArrowUpward />
          </IconButton>
        )}
        <Breadcrumbs aria-label="breadcrumb">
          {crumbs.map(({ label, value }, i) => (
            <Link
              key={i}
              component="button"
              underline="hover"
              color={i === crumbs.length - 1 ? 'text.primary' : 'inherit'}
              onClick={() => setPath(value)}
            >
              {label}
            </Link>
          ))}
        </Breadcrumbs>
      </Stack>

      <Stack direction="row" spacing={2} alignItems="center" mb={2}>
        <TextField
          size="small"
          label="New Folder"
          value={folderName}
          onChange={e => setFolderName(e.target.value)}
        />
        <Button onClick={createFolder} variant="outlined">Create Folder</Button>
        <input
          type="file"
          accept="image/*"
          onChange={e => setFile(e.target.files?.[0] || null)}
        />
        <Button onClick={upload} variant="contained" disabled={!file || !username}>
          Upload Image
        </Button>
      </Stack>

      {loading ? (
        <CircularProgress />
      ) : (
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Name</TableCell>
              <TableCell>Uploaded By</TableCell>
              <TableCell>Date</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {items.map(item => (
              <TableRow key={item.name} hover>
                <TableCell>
                  <Stack direction="row" alignItems="center" spacing={1}>
                    {item.type === 'folder' ? <FolderIcon /> : <FileIcon />}
                    <Link
                      component="button"
                      underline="hover"
                      onClick={() => {
                        if (item.type === 'folder') navigateInto(item.name);
                        else if (item.url?.match(/\.(jpe?g|png|gif|webp)$/i)) {
                          setLightboxUrl(item.url);
                        }
                      }}
                    >
                      {item.name}
                    </Link>
                  </Stack>
                </TableCell>
                <TableCell>{item.username || '-'}</TableCell>
                <TableCell>
                  {item.creation_date
                    ? new Date(item.creation_date).toLocaleString()
                    : '-'}
                </TableCell>
                <TableCell align="right">
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
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      <Dialog open={!!renameTarget} onClose={() => setRenameTarget(null)} fullWidth>
        <DialogTitle>Rename "{renameTarget}"</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            fullWidth
            label="New Name"
            value={renameNew}
            onChange={e => setRenameNew(e.target.value)}
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
