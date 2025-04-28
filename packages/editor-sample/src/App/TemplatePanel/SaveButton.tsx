import React, { useState } from 'react';
import { IconButton, Tooltip, CircularProgress } from '@mui/material';
import CloudUploadOutlinedIcon from '@mui/icons-material/CloudUploadOutlined'; // 🆕 New, better icon
import { useDocument } from '../../documents/editor/EditorContext';
import { renderToStaticMarkup } from '@usewaypoint/email-builder';
import { toPng } from 'html-to-image';

export default function SaveButton() {
  const emailDocument = useDocument();
  const [loading, setLoading] = useState(false);

  const onClick = async () => {
    setLoading(true);
    try {
      // Step 1: Create share URL
      const encodedJson = encodeURIComponent(JSON.stringify(emailDocument));
      const shareUrl = `https://emailbuilder.iynj.org/#code/${btoa(encodedJson)}`;

      // Step 2: Render email to static HTML
      const htmlString = renderToStaticMarkup(emailDocument, { rootBlockId: 'root' });

      // Step 3: Create a hidden div
      const tempDiv = document.createElement('div');
      tempDiv.style.position = 'fixed';
      tempDiv.style.top = '-10000px';
      tempDiv.style.left = '-10000px';
      tempDiv.style.width = '600px'; // Standard email width
      tempDiv.innerHTML = htmlString;

      // Fix CORS for images
      tempDiv.querySelectorAll('img').forEach((img) => {
        img.setAttribute('crossorigin', 'anonymous');
      });

      document.body.appendChild(tempDiv);

      // Step 4: Convert to PNG safely
      const pngDataUrl = await toPng(tempDiv, {
        cacheBust: true,
        skipFonts: true,
      });

      // Step 5: Cleanup
      document.body.removeChild(tempDiv);

      // Step 6: Open final submit page
      const finalUrl = `https://inspireyouthnj.org/admin/myemails/submit?png=${encodeURIComponent(pngDataUrl)}&url=${encodeURIComponent(shareUrl)}`;
      window.open(finalUrl, '_blank');
    } catch (error) {
      console.error('SaveButton error:', error);
      alert('An error occurred while saving. Please try again.');
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
            <CloudUploadOutlinedIcon fontSize="small" /> // ✅ New Icon
          )}
        </IconButton>
      </span>
    </Tooltip>
  );
}
