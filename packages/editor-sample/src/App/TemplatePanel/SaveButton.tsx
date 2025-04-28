import React, { useState } from 'react';
import { SaveOutlined } from '@mui/icons-material';
import { IconButton, Snackbar, Tooltip } from '@mui/material';

import { useDocument } from '../../documents/editor/EditorContext';

export default function SaveButton() {
  const document = useDocument();
  const [message, setMessage] = useState<string | null>(null);

  const onClick = async () => {
    try {
      const c = encodeURIComponent(JSON.stringify(document));
      const generatedUrl = `${window.location.origin}${window.location.pathname}#code/${btoa(c)}`;

      window.open(`https://inspireyouthnj.org/admin/myemails/submit?url=${encodeURIComponent(generatedUrl)}`, '_blank');
    } catch (error) {
      console.error('Failed to save:', error);
      setMessage('Failed to generate URL.');
    }
  };

  const onClose = () => {
    setMessage(null);
  };

  return (
    <>
      <Tooltip title="Save to My Emails">
        <IconButton onClick={onClick}>
          <SaveOutlined fontSize="small" />
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
