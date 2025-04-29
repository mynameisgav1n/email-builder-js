import React, { useState } from 'react';
import { IconButton, Tooltip } from '@mui/material';
import LinkIcon from '@mui/icons-material/Link'; // or any icon you want

import { useDocument } from '../../documents/editor/EditorContext';

export default function ShortenButton() {
  const document = useDocument();
  const [message, setMessage] = useState<string | null>(null);

  const onClick = async () => {
    try {
      // 1. Grab the CURRENT document
      const encoded = encodeURIComponent(JSON.stringify(document));
      const base64 = btoa(encoded);
      const longUrl = `https://emailbuilder.iynj.org/#code/${base64}`;

      // 2. POST it to the shortener
      const response = await fetch('/api/shorten.php', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url: longUrl }),
      });

      const result = await response.json();

      if (result.success && result.code) {
        const shortUrl = `https://emailbuilder.iynj.org/email/${result.code}`;
        await navigator.clipboard.writeText(shortUrl);
        setMessage('Shortened URL copied to clipboard!');
      } else {
        setMessage('Error: Could not shorten URL');
      }
    } catch (error) {
      console.error(error);
      setMessage('Error occurred');
    }
  };

  const onClose = () => {
    setMessage(null);
  };

  return (
    <>
      <Tooltip title="Shorten and Copy URL">
        <IconButton onClick={onClick}>
          <LinkIcon fontSize="small" />
        </IconButton>
      </Tooltip>
    </>
  );
}
