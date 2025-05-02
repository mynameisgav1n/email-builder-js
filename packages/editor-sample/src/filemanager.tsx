import React, { useEffect, useState } from 'react';
import {
  Box, Grid, Card, CardContent, Typography,
  Button, IconButton, Snackbar, Dialog,
  DialogTitle, DialogContent, DialogActions,
  TextField, CircularProgress
} from '@mui/material';
import {
  Upload as UploadIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  ArrowUpward as UpIcon,
  Folder as FolderIcon,
  Image as ImageIcon
} from '@mui/icons-material';

interface Item {
  name: string;
  type: 'file' | 'dir';
}

export default function FileManager({ username }: { username: string }) {
  const [path, setPath] = useState('');
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [fileToUpload, setFileToUpload] = useState<File|null>(null);
  const [confirmDelete, setConfirmDelete] = useState<Item|null>(null);
  const [renameItem, setRenameItem] = useState<Item|null>(null);
  const [renameValue, setRenameValue] = useState('');
  const [snack, setSnack] = useState<{open:boolean;msg:string}>({open:false,msg:''});

  // fetch listing
  const fetchList = async () => {
    setLoading(true);
    const res = await fetch(`filemanager.php?action=list&path=${encodeURIComponent(path)}`);
    const json = await res.json();
    if (!json.error) setItems(json.items);
    setLoading(false);
  };
  useEffect(() => { fetchList() }, [path]);

  // upload
  const doUpload = async () => {
    if (!fileToUpload) return;
    setUploading(true);
    const fd = new FormData();
    fd.append('action','upload');
    fd.append('path', path);
    fd.append('username', username);
    fd.append('file', fileToUpload);
    const res = await fetch('filemanager.php', { method:'POST', body:fd });
    const j = await res.json();
    setUploading(false);
    if (j.success) {
      setSnack({open:true,msg:'Uploaded!'});
      setFileToUpload(null);
      fetchList();
    } else {
      setSnack({open:true,msg:`Upload failed: ${j.error}`});
    }
  };

  // delete
  const doDelete = async () => {
    if (!confirmDelete) return;
    const target = path + '/' + confirmDelete.name;
    const res = await fetch(`filemanager.php?action=delete&path=${encodeURIComponent(target)}`);
    const j = await res.json();
    if (j.success) {
      setSnack({open:true,msg:'Deleted!'});
      setConfirmDelete(null);
      fetchList();
    } else {
      setSnack({open:true,msg:`Delete failed: ${j.error}`});
    }
  };

  // rename
  const doRename = async () => {
    if (!renameItem) return;
    const fd = new FormData();
    fd.append('action','rename');
    fd.append('path', path + '/' + renameItem.name);
    fd.append('newName', renameValue);
    const res = await fetch('filemanager.php', { method:'POST', body:fd });
    const j = await res.json();
    if (j.success) {
      setSnack({open:true,msg:'Renamed!'});
      setRenameItem(null);
      fetchList();
    } else {
      setSnack({open:true,msg:`Rename failed: ${j.error}`});
    }
  };

  return (
    <Box p={2}>
      {/* Upload controls */}
      <Box display="flex" alignItems="center" mb={2} gap={1}>
        <Typography variant="h6">/ {path || ''}</Typography>
        <input
          type="file" accept="image/*"
          style={{ display: 'none' }}
          id="upload-input"
          onChange={e => setFileToUpload(e.target.files![0])}
        />
        <label htmlFor="upload-input">
          <Button variant="contained" startIcon={<UploadIcon />}>Choose File</Button>
        </label>
        <Button
          variant="contained" color="primary"
          disabled={!fileToUpload || uploading}
          onClick={doUpload}
        >
          {uploading ? <CircularProgress size={20}/> : 'Upload'}
        </Button>
      </Box>

      {/* File / Folder Grid */}
      {loading
        ? <CircularProgress />
        : <Grid container spacing={2}>
            {path && (
              <Grid item xs={3}>
                <Card
                  onClick={() => setPath(path.split('/').slice(0,-1).join('/'))}
                  sx={{ cursor:'pointer', textAlign:'center', p:2 }}
                >
                  <UpIcon fontSize="large" />
                  <Typography>Up</Typography>
                </Card>
              </Grid>
            )}
            {items.map(it => (
              <Grid item xs={3} key={it.name}>
                <Card sx={{ position:'relative', p:1 }}>
                  {/* Rename Icon */}
                  <IconButton
                    size="small"
                    sx={{ position:'absolute', top:4, left:4 }}
                    onClick={() => {
                      setRenameItem(it);
                      setRenameValue(it.name);
                    }}
                  >
                    <EditIcon fontSize="small"/>
                  </IconButton>

                  {/* Delete Icon */}
                  <IconButton
                    size="small"
                    sx={{ position:'absolute', top:4, right:4 }}
                    onClick={() => setConfirmDelete(it)}
                  >
                    <DeleteIcon fontSize="small"/>
                  </IconButton>

                  {/* Icon + Name */}
                  <CardContent
                    onClick={() => it.type==='dir' && setPath(path ? path + '/' + it.name : it.name)}
                    sx={{
                      cursor: it.type==='dir' ? 'pointer' : 'default',
                      textAlign:'center'
                    }}
                  >
                    {it.type==='dir'
                      ? <FolderIcon fontSize="large"/>
                      : <ImageIcon fontSize="large"/>
                    }
                    <Typography noWrap>{it.name}</Typography>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
      }

      {/* Delete Confirmation */}
      <Dialog open={!!confirmDelete} onClose={() => setConfirmDelete(null)}>
        <DialogTitle>Delete {confirmDelete?.name}?</DialogTitle>
        <DialogActions>
          <Button onClick={() => setConfirmDelete(null)}>Cancel</Button>
          <Button color="error" onClick={doDelete}>Delete</Button>
        </DialogActions>
      </Dialog>

      {/* Rename Dialog */}
      <Dialog open={!!renameItem} onClose={() => setRenameItem(null)}>
        <DialogTitle>Rename {renameItem?.name}</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="New name"
            value={renameValue}
            onChange={e => setRenameValue(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRenameItem(null)}>Cancel</Button>
          <Button
            disabled={!renameValue || renameValue === renameItem?.name}
            onClick={doRename}
          >
            Rename
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar */}
      <Snackbar
        open={snack.open}
        autoHideDuration={3000}
        message={snack.msg}
        onClose={() => setSnack(s => ({...s,open:false}))}
      />
    </Box>
  );
}
