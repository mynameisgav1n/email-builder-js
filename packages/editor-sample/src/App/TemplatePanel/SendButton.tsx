import React from 'react';
import { IconButton, Tooltip } from '@mui/material';
import SendIcon from '@mui/icons-material/Send';

import { useDocument } from '../../documents/editor/EditorContext';
import { renderToStaticMarkup } from '@usewaypoint/email-builder'; // ✅ Same as HtmlPanel

export default function SendButton() {
  const document = useDocument();

  const minifyHTML = (html) => {
    return html
      .replace(/\n/g, '')
      .replace(/\s\s+/g, ' ')
      .replace(/>\s+</g, '><')
      .replace(/<!--.*?-->/g, '');
  };

  const onClick = async () => {
    const html = renderToStaticMarkup(document, { rootBlockId: 'root' });
    const minifiedHtml = minifyHTML(html);
    const encodedHtml = encodeURIComponent(minifiedHtml); // ❌ No btoa, only URL encode

    window.open(`https://inspireyouthnj.org/admin/blastemail?prefill_html=${encodedHtml}`, '_blank');
  };

  return (
    <Tooltip title="Send email">
      <IconButton onClick={onClick}>
        <SendIcon fontSize="small" />
      </IconButton>
    </Tooltip>
  );
}
