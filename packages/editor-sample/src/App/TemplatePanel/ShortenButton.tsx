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

      const res = await fetch('/api/shorten.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ encoded }),
      });

      if (!res.ok) {
        throw new Error('Shorten failed');
      }

      const data = await res.json();
      const fullLink = `https://emailbuilder.iynj.org/${data.short}`;

      await navigator.clipboard.writeText(fullLink);
      setMessage(`Short link copied! ${fullLink}`);
    } catch (err) {
      console.error(err);
      setMessage('Failed to generate short link.');
    }
  };

  return (
    <>
      <Tooltip title="Shorten and Copy URL">
        <IconButton onClick={handleClick} color="primary">
          <LinkOutlined />
        </IconButton>
      </Tooltip>
      <Snackbar
        open={!!message}
        autoHideDuration={4000}
        onClose={() => setMessage(null)}
        message={message}
      />
    </>
  );
}
