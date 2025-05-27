// ImageSidebarPanel.tsx
import React, { useState, useEffect, useRef } from 'react';
import * as Zod from 'zod';
import {
  Stack,
  ToggleButton,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  Grid,
  Card,
  CardContent,
  Typography,
  Snackbar,
  Box,
} from '@mui/material';
import {
  VerticalAlignBottomOutlined,
  VerticalAlignCenterOutlined,
  VerticalAlignTopOutlined,
  ArrowUpwardOutlined as UpIcon,
  FolderOutlined as FolderIcon,
} from '@mui/icons-material';

import BaseSidebarPanel from './helpers/BaseSidebarPanel';
import RadioGroupInput from './helpers/inputs/RadioGroupInput';
import TextDimensionInput from './helpers/inputs/TextDimensionInput';
import TextInput from './helpers/inputs/TextInput';
import MultiStylePropertyPanel from './helpers/style-inputs/MultiStylePropertyPanel';

import { ImageProps, ImagePropsSchema } from '@usewaypoint/block-image';

type FileItem = {
  name: string;
  type: 'file' | 'folder';
  url: string;
  username: string | null;
  creation_date: string | null;
};

type ImageSidebarPanelProps = {
  data: ImageProps;
  setData: (v: ImageProps) => void;
};

export default function ImageSidebarPanel({ data, setData }: ImageSidebarPanelProps) {
  const [, setErrors] = useState<Zod.ZodError | null>(null);
  const [snack, setSnack] = useState<{ open: boolean; msg: string }>({ open: false, msg: '' });
  const [chooserOpen, setChooserOpen] = useState(false);
  const [dialogPath, setDialogPath] = useState('');
  const [dialogItems, setDialogItems] = useState<FileItem[]>([]);

  const sourceUrlRef = useRef<HTMLInputElement>(null); // ← input ref here

  const updateData = (d: unknown) => {
    const res = ImagePropsSchema.safeParse(d);
    if (res.success) {
      setData(res.data);
      setErrors(null);
    } else {
      setErrors(res.error);
    }
  };

  useEffect(() => {
    if (!chooserOpen) return;
    fetch(`/api/filemanager.php?action=list&path=${encodeURIComponent(dialogPath)}`)
      .then((r) => r.json())
      .then((json) => {
        if (Array.isArray(json.items)) {
          setDialogItems(json.items.filter((i: any) => !/\.html?$/i.test(i.name)));
        }
      })
      .catch((err) => {
        console.error(err);
        setSnack({ open: true, msg: 'Failed to load items' });
      });
  }, [chooserOpen, dialogPath]);

  const dialogFolders = dialogItems.filter((i) => i.type === 'folder');
  const dialogFiles = dialogItems.filter((i) => i.type === 'file');

  const chooseUrl = (item: FileItem) => {
    const full = `${window.location.origin}${item.url}`;
    updateData({ ...data, props: { ...data.props, url: full } });
    setChooserOpen(false);
    // blur the input after image is chosen
    setTimeout(() => {
      sourceUrlRef.current?.blur();
    }, 0);
  };

  return (
    <>
      <BaseSidebarPanel title="Image block">
        <Stack direction="row" spacing={1} alignItems="center" mb={2}>
          <TextInput
            key={data.props?.url || ''}
            label="Source URL"
            defaultValue={data.props?.url ?? ''}
            inputRef={sourceUrlRef} // ← attach ref
            onChange={(v) => {
              const url = v.trim() || null;
              updateData({ ...data, props: { ...data.props, url } });
            }}
            fullWidth
          />
          <Button
            variant="outlined"
            size="small"
            onClick={() => {
              setDialogPath('');
              setChooserOpen(true);
            }}
          >
            Choose Image
          </Button>
        </Stack>

        <TextInput
          label="Alt text"
          value={data.props?.alt ?? ''}
          onChange={(alt) => updateData({ ...data, props: { ...data.props, alt } })}
        />
        <TextInput
          label="Click through URL"
          value={data.props?.linkHref ?? ''}
          onChange={(v) => {
            const linkHref = v.trim() || null;
            updateData({ ...data, props: { ...data.props, linkHref } });
          }}
        />
        <Stack direction="row" spacing={2} my={2}>
          <TextDimensionInput
            label="Width"
            defaultValue={data.props?.width}
            onChange={(width) => updateData({ ...data, props: { ...data.props, width } })}
          />
          <TextDimensionInput
            label="Height"
            defaultValue={data.props?.height}
            onChange={(height) => updateData({ ...data, props: { ...data.props, height } })}
          />
        </Stack>

        <RadioGroupInput
          label="Alignment"
          defaultValue={data.props?.contentAlignment ?? 'middle'}
          onChange={(contentAlignment) =>
            updateData({ ...data, props: { ...data.props, contentAlignment } })
          }
        >
          <ToggleButton value="top">
            <VerticalAlignTopOutlined fontSize="small" />
          </ToggleButton>
          <ToggleButton value="middle">
            <VerticalAlignCenterOutlined fontSize="small" />
          </ToggleButton>
          <ToggleButton value="bottom">
            <VerticalAlignBottomOutlined fontSize="small" />
          </ToggleButton>
        </RadioGroupInput>

        <MultiStylePropertyPanel
          names={['backgroundColor', 'textAlign', 'padding']}
          value={data.style}
          onChange={(style) => updateData({ ...data, style })}
        />
      </BaseSidebarPanel>

      <Dialog open={chooserOpen} onClose={() => setChooserOpen(false)} fullWidth maxWidth="md">
        <DialogTitle>Select Image from Explorer</DialogTitle>
        <DialogContent dividers>
          {dialogFolders.length > 0 && (
            <Typography variant="subtitle1" gutterBottom>
              Folders
            </Typography>
          )}
          <Grid container spacing={2} mb={4}>
            {dialogPath && (
              <Grid item xs={3}>
                <Card
                  onClick={() => {
                    const parts = dialogPath.split('/');
                    parts.pop();
                    setDialogPath(parts.join('/'));
                  }}
                  sx={{ cursor: 'pointer', textAlign: 'center', p: 2 }}
                >
                  <UpIcon fontSize="large" />
                  <Typography>Up</Typography>
                </Card>
              </Grid>
            )}
            {dialogFolders.map((f) => (
              <Grid item xs={3} key={f.name}>
                <Card
                  onClick={() =>
                    setDialogPath(dialogPath ? `${dialogPath}/${f.name}` : f.name)
                  }
                  sx={{ cursor: 'pointer', textAlign: 'center', p: 2 }}
                >
                  <FolderIcon fontSize="large" />
                  <Typography noWrap mt={1}>
                    {f.name}
                  </Typography>
                </Card>
              </Grid>
            ))}
          </Grid>

          {dialogFiles.length > 0 && (
            <Typography variant="subtitle1" gutterBottom>
              Images
            </Typography>
          )}
          <Grid container spacing={2}>
            {dialogFiles.map((file) => (
              <Grid item xs={3} key={file.name}>
                <Card sx={{ cursor: 'pointer' }} onClick={() => chooseUrl(file)}>
                  <CardContent sx={{ p: 1, textAlign: 'center' }}>
                    <Box
                      component="img"
                      src={file.url}
                      sx={{
                        width: '100%',
                        height: 100,
                        objectFit: 'cover',
                        borderRadius: 1,
                      }}
                    />
                    <Typography noWrap mt={1}>{file.name}</Typography>
                    <Typography variant="caption" color="text.secondary" display="block">
                      {file.username} •{' '}
                      {file.creation_date
                        ? new Date(file.creation_date).toLocaleString()
                        : ''}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            ))}
            {!dialogFolders.length && !dialogFiles.length && (
              <Grid item xs={12}>
                <Typography>No items found.</Typography>
              </Grid>
            )}
          </Grid>
        </DialogContent>
      </Dialog>

      <Snackbar
        open={snack.open}
        autoHideDuration={3000}
        onClose={() => setSnack((s) => ({ ...s, open: false }))}
        message={snack.msg}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      />
    </>
  );
}
