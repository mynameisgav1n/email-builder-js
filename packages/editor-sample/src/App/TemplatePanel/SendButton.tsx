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

  const rawLength = minifiedHtml.length;
  const MAX_RAW_HTML_LENGTH = 1400; // Safe limit for unencoded minified HTML

  const baseUrl = `https://www.inspireyouthnj.org/admin/blastemail`;
  
  if (rawLength > MAX_RAW_HTML_LENGTH) {
    await copyToClipboard(minifiedHtml); // Copy raw HTML
    alert(
      'The HTML code has been copied to your clipboard.\n\nPlease paste it into the "Email Content" field on the Blast Email form that will open in a new tab.'
    );
    window.open(baseUrl, '_blank');
    return;
  }

  // Otherwise safe to encode and open
  const encodedHtml = encodeURIComponent(minifiedHtml);
  const prefillUrl = `${baseUrl}?prefill_html=${encodedHtml}`;
  window.open(prefillUrl, '_blank');
};


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
