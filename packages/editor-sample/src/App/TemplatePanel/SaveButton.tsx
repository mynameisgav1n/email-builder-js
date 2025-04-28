import React, { useState } from 'react';
import { IconButton, Tooltip, CircularProgress } from '@mui/material';
import SaveAltOutlinedIcon from '@mui/icons-material/SaveAltOutlined'; // ✅ correct icon
import { useDocument } from '../../documents/editor/EditorContext';
import { renderToStaticMarkup } from '@usewaypoint/email-builder';
import { toPng } from 'html-to-image';

export default function SaveButton() {
  const emailDocument = useDocument(); // Renamed to avoid conflict with window.document
  const [loading, setLoading] = useState(false);

  const onClick = async () => {
    setLoading(true);
    try {
      // Step 1: Create Share URL (same way ShareButton does)
      const encodedJson = encodeURIComponent(JSON.stringify(emailDocument));
      const shareUrl = `https://emailbuilder.iynj.org/#code/${btoa(encodedJson)}`;

      // Step 2: Render the email to raw HTML
      const htmlString = renderToStaticMarkup(emailDocument, { rootBlockId: 'root' });

      // Step 3: Create a hidden div for html-to-image
      const tempDiv = document.createElement('div');
      tempDiv.style.position = 'fixed';
      tempDiv.style.top = '-10000px';
      tempDiv.style.left = '-10000px';
      tempDiv.style.width = '600px'; // standard email width
      tempDiv.innerHTML = htmlString;
      document.body.appendChild(tempDiv);

      // Step 4: Convert to PNG
      const pngDataUrl = await toPng(tempDiv, { cacheBust: true });

      // Step 5: Clean up the temporary div
      document.body.removeChild(tempDiv);

      // Step 6: Open new tab with pre-filled submission link
      const finalUrl = `https://inspireyouthnj.org/admin/myemails/submit?png=${encodeURIComponent(pngDataUrl)}&url=${encodeURIComponent(shareUrl)}`;
      window.open(finalUrl, '_blank');
    } catch (error) {
      console.error('SaveButton error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Tooltip title="Save email">
      <span>
        <IconButton onClick={onClick} disabled={loading}>
          {loading ? (
            <CircularProgress size={20} />
          ) : (
            <SaveAltOutlinedIcon fontSize="small" />
          )}
        </IconButton>
      </span>
    </Tooltip>
  );
}
