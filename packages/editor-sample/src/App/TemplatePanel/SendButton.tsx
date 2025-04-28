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

  const minimalEscape = (str) => {
    return str
      .replace(/%/g, '%25')
      .replace(/#/g, '%23')
      .replace(/&/g, '%26')
      .replace(/</g, '%3C')
      .replace(/>/g, '%3E')
      .replace(/"/g, '%22');
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
    const escapedHtml = minimalEscape(minifiedHtml); // ✅ Only escape necessary characters

    const baseUrl = `https://www.inspireyouthnj.org/admin/blastemail`;
    const prefillUrl = `${baseUrl}?prefill_html=${escapedHtml}`;

    const MAX_URL_LENGTH = 7000; // Safe

    if (prefillUrl.length > MAX_URL_LENGTH) {
      await copyToClipboard(minifiedHtml);
      alert(
        'The HTML code has been copied to your clipboard.\n\nPlease paste it into the "Email Content" field on the Blast Email form that will open in a new tab.'
      );
      window.open(baseUrl, '_blank');
      return;
    }

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
