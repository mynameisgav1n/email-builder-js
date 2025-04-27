import React from 'react';
import { IconButton, Tooltip } from '@mui/material';
import SendIcon from '@mui/icons-material/Send'; // Choose any icon you want
import { useDocument } from '../../documents/editor/EditorContext';

export default function SendButton() {
  const document = useDocument();

  const onClick = async () => {
    const c = encodeURIComponent(JSON.stringify(document)); // 👈 Same as ShareButton
    const encoded = btoa(c); // 👈 Same
    window.open(`https://inspireyouthnj.org/admin/blastemail?code=${encoded}`, '_blank'); // 👈 Open new tab
  };

  return (
    <Tooltip title="Send email">
      <IconButton onClick={onClick}>
        <SendIcon fontSize="small" />
      </IconButton>
    </Tooltip>
  );
}
