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

  const copyToClipboard = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
      console.log('HTML copied to clipboard successfully!');
    } catch (error) {
      console.error('Failed to copy HTML to clipboard:', error);
    }
  };

  const onClick = async () => {
    const html = renderToStaticMarkup(document, { rootBlockId: 'root' });
    const minifiedHtml = minifyHTML(html);

    const baseUrl = `https://www.inspireyouthnj.org/admin/blastemail`;
    const prefillUrl = `${baseUrl}?prefill_html=${minifiedHtml}`;

    // Set safe limit for raw (unencoded) URL
    const MAX_URL_LENGTH = 1900;

    const fullUrlLength = prefillUrl.length;

    if (fullUrlLength > MAX_URL_LENGTH) {
      await copyToClipboard(minifiedHtml);
      alert('Your message was too large. The HTML code has been copied to your clipboard. Please paste it into the "Email Content" field on the site that will open in a new tab.');
      window.open(baseUrl, '_blank'); // Open page with no prefill
      return;
    }

    // Otherwise, proceed like normal
    window.open(prefillUrl, '_blank');
  };

  return (
    <Tooltip title="Send email">
      <IconButton onClick={onClick}>
        <SendIcon fontSize="small" />
      </IconButton>
    </Tooltip>
  );
}
