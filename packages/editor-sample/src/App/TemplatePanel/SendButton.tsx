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

    const rawLength = minifiedHtml.length;
    const MAX_RAW_HTML_LENGTH = 1400; // Safe limit for raw HTML size

    const baseUrl = `https://www.inspireyouthnj.org/admin/blastemail`;

    if (rawLength > MAX_RAW_HTML_LENGTH) {
      await copyToClipboard(minifiedHtml);
      alert(
        'Your message was too large.\n\nThe HTML code has been copied to your clipboard.\n\nPlease paste it into the "Email Content" field on the site that will open in a new tab.'
      );
      window.open(baseUrl, '_blank');
      return;
    }

    const encodedHtml = encodeURIComponent(minifiedHtml);
    const prefillUrl = `${baseUrl}?prefill_html=${encodedHtml}`;
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
