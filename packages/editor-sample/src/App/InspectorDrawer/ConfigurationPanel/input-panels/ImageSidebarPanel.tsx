// ImageSidebarPanel.tsx
import React, { useState, useEffect } from 'react';
import * as Zod from 'zod';
import {
  Stack,
  ToggleButton,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  List,
  ListItem,
  ListItemText,
} from '@mui/material';
import {
  VerticalAlignBottomOutlined,
  VerticalAlignCenterOutlined,
  VerticalAlignTopOutlined,
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

export default function ImageSidebarPanel({
  data,
  setData,
}: ImageSidebarPanelProps) {
  const [, setErrors] = useState<Zod.ZodError | null>(null);

  // Local state for the picker
  const [chooserOpen, setChooserOpen] = useState(false);
  const [available, setAvailable] = useState<FileItem[]>([]);

  // Validate & commit
  const updateData = (d: unknown) => {
    const res = ImagePropsSchema.safeParse(d);
    if (res.success) {
      setData(res.data);
      setErrors(null);
    } else {
      setErrors(res.error);
    }
  };

  // When dialog opens, fetch the public images
  useEffect(() => {
    if (!chooserOpen) return;
    fetch('/api/filemanager.php?action=list&path=')
      .then((res) => res.json())
      .then((json) => {
        if (Array.isArray(json.items)) {
          setAvailable(
            json.items.filter(
              (i: any) =>
                i.type === 'file' &&
                /\.(jpe?g|png|gif|webp)$/i.test(i.name)
            )
          );
        }
      })
      .catch(console.error);
  }, [chooserOpen]);

  // Set URL and close dialog
  const chooseUrl = (item: FileItem) => {
    const full = `${window.location.origin}${item.url}`;
    updateData({
      ...data,
      props: { ...data.props, url: full },
    });
    setChooserOpen(false);
  };

  return (
    <BaseSidebarPanel title="Image block">
      {/* Source URL + Choose */}
      <Stack direction="row" spacing={1} alignItems="center" mb={2}>
        <TextInput
          label="Source URL"
          defaultValue={data.props?.url ?? ''}
          onChange={(v) => {
            const url = v.trim().length ? v.trim() : null;
            updateData({ ...data, props: { ...data.props, url } });
          }}
          fullWidth
        />
        <Button
          variant="outlined"
          size="small"
          onClick={() => setChooserOpen(true)}
        >
          Choose Image
        </Button>
      </Stack>

      {/* Other fields */}
      <TextInput
        label="Alt text"
        defaultValue={data.props?.alt ?? ''}
        onChange={(alt) => updateData({ ...data, props: { ...data.props, alt } })}
      />
      <TextInput
        label="Click through URL"
        defaultValue={data.props?.linkHref ?? ''}
        onChange={(v) => {
          const linkHref = v.trim().length ? v.trim() : null;
          updateData({ ...data, props: { ...data.props, linkHref } });
        }}
      />

      <Stack direction="row" spacing={2} my={2}>
        <TextDimensionInput
          label="Width"
          defaultValue={data.props?.width}
          onChange={(width) =>
            updateData({ ...data, props: { ...data.props, width } })
          }
        />
        <TextDimensionInput
          label="Height"
          defaultValue={data.props?.height}
          onChange={(height) =>
            updateData({ ...data, props: { ...data.props, height } })
          }
        />
      </Stack>

      <RadioGroupInput
        label="Alignment"
        defaultValue={data.props?.contentAlignment ?? 'middle'}
        onChange={(contentAlignment) =>
          updateData({
            ...data,
            props: { ...data.props, contentAlignment },
          })
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

      {/* —— Image Chooser Dialog —— */}
      <Dialog
        open={chooserOpen}
        onClose={() => setChooserOpen(false)}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle>Select an image</DialogTitle>
        <DialogContent dividers>
          <List>
            {available.map((item) => (
              <ListItem
                button
                key={item.name}
                onClick={() => chooseUrl(item)}
              >
                <ListItemText
                  primary={item.name}
                  secondary={
                    item.username
                      ? `Uploaded by ${item.username}`
                      : undefined
                  }
                />
              </ListItem>
            ))}
            {!available.length && (
              <ListItem>
                <ListItemText primary="No images found." />
              </ListItem>
            )}
          </List>
        </DialogContent>
      </Dialog>
    </BaseSidebarPanel>
  );
}
