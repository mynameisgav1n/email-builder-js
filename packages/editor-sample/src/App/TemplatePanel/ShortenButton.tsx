import React, { useState } from 'react';
import { IosShareOutlined } from '@mui/icons-material';
import { IconButton, Snackbar, Tooltip } from '@mui/material';

import { useDocument } from '../../documents/editor/EditorContext';

export default function ShortenButton() {
  const document = useDocument();
  const [message, setMessage] = useState<string | null>(null);

  const onClick = async () => {
    // Exactly your original logic
    const encodedDoc = encodeURIComponent(JSON.stringify(document));
    const base64Encoded = btoa(encodedDoc);
    const longUrl = `https://emailbuilder.iynj.org/#code/${base64Encoded}`;

    // Now send it to the shortener
    const response = await fetch('/api/shorten.php', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url: longUrl }),
    });

    const data = await response.json();

    if (data.success) {
      const shortUrl = `https://emailbuilder.iynj.org/email/${data.code}`;
      await navigator.clipboard.writeText(shortUrl);
      setMessage('Short URL copied to clipboard!');
    } else {
      console.error('Failed to shorten URL', data);
      setMessage('Something went wrong generating short link.');
    }
  };

  const onClose = () => {
    setMessage(null);
  };

  return (
    <>
      <IconButton onClick={onClick}>
        <Tooltip title="Shorten and copy link">
          <IosShareOutlined fontSize="small" />
        </Tooltip>
      </IconButton>
      <Snackbar
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
        open={message !== null}
        onClose={onClose}
        message={message}
      />
    </>
  );
}
