import React, { useState } from 'react';
import { IconButton, Snackbar, Tooltip } from '@mui/material';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import { useDocument } from '../../documents/editor/EditorContext';

function generateRandomCode(length = 6) {
  const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

export default function ShortenButton() {
  const document = useDocument();
  const [message, setMessage] = useState(null);
  const [shortenedUrl, setShortenedUrl] = useState(null);

  const onClick = async () => {
    const doc = JSON.stringify(document);
    const fullUrl = `https://emailbuilder.iynj.org/#code/${btoa(encodeURIComponent(doc))}`;
    const code = generateRandomCode(6);

    try {
      const res = await fetch("https://emailbuilder.iynj.org/api/shorten.php", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ full_url: fullUrl, code })
      });

      const text = await res.text();
      console.log("Response:", text);

      if (!res.ok) {
        throw new Error(`HTTP ${res.status}: ${text}`);
      }

      const shortUrl = `https://emailbuilder.iynj.org/email/${code}`;
      await navigator.clipboard.writeText(shortUrl);
      setShortenedUrl(shortUrl);
      setMessage("Short URL copied to clipboard!");
    } catch (error) {
      console.error("ShortenButton error:", error);
      setMessage("Error occurred. See console for details.");
    }
  };

  const onClose = () => {
    setMessage(null);
  };

  return (
    <>
      <Tooltip title="Shorten URL">
        <IconButton onClick={onClick}>
          <ContentCopyIcon fontSize="small" />
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
