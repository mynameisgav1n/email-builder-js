import React, { useState } from 'react';
import {
  IconButton,
  Snackbar,
  Tooltip,
} from '@mui/material';
import { LinkOutlined } from '@mui/icons-material';
import { useDocument } from '../../documents/editor/EditorContext';

export default function ShortenButton() {
  const document = useDocument();
  const [message, setMessage] = useState<string | null>(null);

  const handleClick = async () => {
    try {
      const encoded = encodeURIComponent(JSON.stringify(document));
      const fullUrl = `https://emailbuilder.iynj.org/email-builder-js#code/${btoa(encoded)}`;

      const res = await fetch('/api/shorten.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ full_url: fullUrl }),
      });

      if (!res.ok) throw new Error('Shortening failed');

      const data = await res.json();
      const shortLink = `https://emailbuilder.iynj.org/${data.short}`;

      await navigator.clipboard.writeText(shortLink);
      setMessage(`Short link copied! ${shortLink}`);
    } catch (err) {
      console.error(err);
      setMessage('Failed to generate short link.');
    }
  };

  return (
    <>
      <Tooltip title="Shorten and copy link">
        <IconButton onClick={handleClick} color="primary">
          <LinkOutlined />
        </IconButton>
      </Tooltip>
      <Snackbar
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
        open={!!message}
        autoHideDuration={4000}
        onClose={() => setMessage(null)}
        message={message}
      />
    </>
  );
}
