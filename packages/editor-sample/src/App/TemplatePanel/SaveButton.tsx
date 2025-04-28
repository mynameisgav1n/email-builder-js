import React, { useState } from 'react';
import { IconButton, Tooltip, CircularProgress } from '@mui/material';
import SaveIcon from '@mui/icons-material/Save';

import { useDocument } from '../../documents/editor/EditorContext';
import { renderToStaticMarkup } from '@usewaypoint/email-builder';
import { toPng } from 'html-to-image';

export default function SaveButton() {
  const document = useDocument();
  const [loading, setLoading] = useState(false);

  const onClick = async () => {
    setLoading(true); // Show spinner
    try {
      // Step 1: Create the Share URL (same as ShareButton logic)
      const encodedJson = encodeURIComponent(JSON.stringify(document));
      const shareUrl = `https://emailbuilder.iynj.org/#code/${btoa(encodedJson)}`;

      // Step 2: Render email to HTML
      const html = renderToStaticMarkup(document, { rootBlockId: 'root' });

      // Step 3: Create a hidden div to render the HTML
      const hiddenDiv = document.createElement('div');
      hiddenDiv.style.position = 'fixed';
      hiddenDiv.style.top = '-10000px';
      hiddenDiv.style.left = '-10000px';
      hiddenDiv.style.width = '600px'; // typical email width
      hiddenDiv.innerHTML = html;
      document.body.appendChild(hiddenDiv);

      // Step 4: Convert hidden div to PNG
      const pngDataUrl = await toPng(hiddenDiv, { cacheBust: true });

      // Step 5: Clean up
      document.body.removeChild(hiddenDiv);

      // Step 6: Open the new tab with png and url
      const fullUrl = `https://inspireyouthnj.org/admin/myemails/submit?png=${encodeURIComponent(pngDataUrl)}&url=${encodeURIComponent(shareUrl)}`;
      window.open(fullUrl, '_blank');
    } catch (error) {
      console.error('SaveButton error:', error);
    } finally {
      setLoading(false); // Always reset loading, even if there's an error
    }
  };

  return (
    <Tooltip title="Save email">
      <span>
        <IconButton onClick={onClick} disabled={loading}>
          {loading ? (
            <CircularProgress size={20} /> // Show spinner while saving
          ) : (
            <SaveIcon fontSize="small" /> // Otherwise show save icon
          )}
        </IconButton>
      </span>
    </Tooltip>
  );
}
