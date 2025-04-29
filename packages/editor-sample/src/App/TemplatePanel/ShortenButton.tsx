import React, { useState } from 'react';
import { IosShareOutlined } from '@mui/icons-material';
import { IconButton, Snackbar, Tooltip } from '@mui/material';

import { useDocument } from '../../documents/editor/EditorContext';

export default function ShortenButton() {
  const document = useDocument();
  const [message, setMessage] = useState<string | null>(null);

  const onClick = async () => {
    try {
      // Encode the current document state
      const doc = JSON.stringify(document);
      const encoded = btoa(encodeURIComponent(doc));
      const fullUrl = `https://emailbuilder.iynj.org/#code/${encoded}`;

      // Call the backend to shorten the URL
      const response = await fetch('https://emailbuilder.iynj.org/api/shorten.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: fullUrl })
      });

      const result = await response.json();

      if (response.ok && result.success) {
        await navigator.clipboard.writeText(result.shortened_url);
        setMessage('Shortened URL copied to clipboard!');
      } else {
        console.error('ShortenButton error:', result);
        setMessage('Failed to shorten URL.');
      }
    } catch (err) {
      console.error('ShortenButton error:', err);
      setMessage('An error occurred.');
    }
  };

  const onClose = () => {
    setMessage(null);
  };

  return (
    <>
      <Tooltip title="Shorten and Copy URL">
        <IconButton onClick={onClick}>
          <IosShareOutlined fontSize="small" />
        </IconButton>
      </Tooltip>
      <Snackbar
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
        open={message !== null}
        onClose={onClose}
        message={message}
      />
    </>
  );
}
