import React, { useState } from 'react';
import { IconButton, Tooltip } from '@mui/material';
import LinkIcon from '@mui/icons-material/Link';
import { useDocument } from '../../documents/editor/EditorContext';

export default function ShortenButton() {
  const document = useDocument();
  const [message, setMessage] = useState<string | null>(null);

  const onClick = async () => {
    const c = encodeURIComponent(JSON.stringify(document));
    const fullUrl = `https://emailbuilder.iynj.org/#code/${btoa(c)}`;

    const vanity = prompt("Custom code? (optional, leave blank for random)");

    try {
      const response = await fetch('/api/shorten.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ full_url: fullUrl, vanity: vanity || undefined }),
      });
      const data = await response.json();

      if (data.success) {
        await navigator.clipboard.writeText(data.short_url);
        alert(`Shortened link copied to clipboard!\n\n${data.short_url}`);
      } else {
        alert(`Error: ${data.error}`);
      }
    } catch (err) {
      alert('Something went wrong.');
    }
  };

  return (
    <Tooltip title="Create Short Link">
      <IconButton onClick={onClick}>
        <LinkIcon fontSize="small" />
      </IconButton>
    </Tooltip>
  );
}
