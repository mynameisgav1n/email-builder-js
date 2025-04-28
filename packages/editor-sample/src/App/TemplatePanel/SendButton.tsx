import React from 'react';
import { IconButton, Tooltip } from '@mui/material';
import SendIcon from '@mui/icons-material/Send';

import { useDocument } from '../../documents/editor/EditorContext';
import { renderToStaticMarkup } from '@usewaypoint/email-builder'; // ✅ Same as HtmlPanel

export default function SendButton() {
  const document = useDocument();

  // Minify HTML to reduce size
  const minifyHTML = (html) => {
    return html
      .replace(/\n/g, '')
      .replace(/\s\s+/g, ' ')
      .replace(/>\s+</g, '><')
      .replace(/<!--.*?-->/g, '');
  };

  // Copy to clipboard helper
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
    const encodedHtml = encodeURIComponent(minifiedHtml);

    const baseUrl = `https://www.inspireyouthnj.org/admin/blastemail`;
    const prefillUrl = `${baseUrl}?prefill_html=${encodedHtml}`;

    const MAX_URL_LENGTH = 1900; // Safe limit

    if (prefillUrl.length > MAX_URL_LENGTH) {
      await copyToClipboard(minifiedHtml); // Copy raw (unencoded) HTML for easy pasting
      alert(
        'Your message was too large.\n\nThe HTML code has been copied to your clipboard.\n\nPlease paste it into the "Email Content" field on the site that will open in a new tab.'
      );
      window.open(baseUrl, '_blank'); // Open the page without prefill
      return;
    }

    // Otherwise, safe to send with prefill
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
