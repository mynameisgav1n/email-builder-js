import React from 'react';
import { IconButton, Tooltip } from '@mui/material';
import SendIcon from '@mui/icons-material/Send'; // You can choose any icon you want!

import { useDocument } from '../../documents/editor/EditorContext';
import { renderDocumentToHtml } from '../../documents/reader/renderDocumentToHtml'; // (assuming this exists based on Waypoint's repo structure)

export default function SendButton() {
  const document = useDocument();

  const onClick = async () => {
    const html = renderDocumentToHtml(document, 'root'); // Render full HTML
    const encodedHtml = btoa(encodeURIComponent(html)); // URL-safe base64
    window.open(`https://inspireyouthnj.org/admin/blastemail?code=${encodedHtml}`, '_blank'); // Open new tab
  };

  return (
    <Tooltip title="Send email">
      <IconButton onClick={onClick}>
        <SendIcon fontSize="small" />
      </IconButton>
    </Tooltip>
  );
}
