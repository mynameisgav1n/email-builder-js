import React from 'react';
import { IconButton, Tooltip } from '@mui/material';
import SendIcon from '@mui/icons-material/Send';

import { useDocument } from '../../documents/editor/EditorContext';
import { renderToStaticMarkup } from '@usewaypoint/email-builder'; // ✅ Same as HtmlPanel

export default function SendButton() {
  const document = useDocument();

  const onClick = async () => {
    const html = renderToStaticMarkup(document, { rootBlockId: 'root' }); // ✅ Render full real HTML
    const encodedHtml = btoa(encodeURIComponent(html)); // ✅ Encode safely for URL
    window.open(`https://inspireyouthnj.org/admin/blastemail?prefill_html=${encodedHtml}`, '_blank'); // ✅ Open the new tab
  };

  return (
    <Tooltip title="Send email">
      <IconButton onClick={onClick}>
        <SendIcon fontSize="small" />
      </IconButton>
    </Tooltip>
  );
}
