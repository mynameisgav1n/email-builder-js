import React, { useState } from 'react';
import { IconButton, Tooltip, CircularProgress } from '@mui/material';
import CloudUploadOutlinedIcon from '@mui/icons-material/CloudUploadOutlined';
import { useDocument } from '../../documents/editor/EditorContext';
import { renderToStaticMarkup } from '@usewaypoint/email-builder';
import { toPng } from 'html-to-image';

export default function SaveButton() {
  const emailDocument = useDocument();
  const [loading, setLoading] = useState(false);

  const onClick = async () => {
    setLoading(true);
    try {
      // Step 1: Create shareable URL for the editor
      const encodedJson = encodeURIComponent(JSON.stringify(emailDocument));
      const shareUrl = `https://emailbuilder.iynj.org/#code/${btoa(encodedJson)}`;

      // Step 2: Render email to static HTML
      const htmlString = renderToStaticMarkup(emailDocument, { rootBlockId: 'root' });

      // Step 3: Create hidden div
      const tempDiv = document.createElement('div');
      tempDiv.style.position = 'fixed';
      tempDiv.style.top = '-10000px';
      tempDiv.style.left = '-10000px';
      tempDiv.style.width = '600px'; // Standard email width
      tempDiv.innerHTML = htmlString;

      // Step 4: Fix image CORS
      tempDiv.querySelectorAll('img').forEach((img) => {
        img.setAttribute('crossorigin', 'anonymous');
      });

      document.body.appendChild(tempDiv);

      // Step 5: Convert to PNG safely
      const pngDataUrl = await toPng(tempDiv, {
        cacheBust: true,
        skipFonts: true,
        imagePlaceholder:
          'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABAQMAAAAl21bKAAAAA1BMVEUAAACnej3aAAAAAXRSTlMAQObYZgAAAApJREFUCNdjYAAAAAIAAeIhvDMAAAAASUVORK5CYII=', // 1x1 transparent pixel fallback
      });

      // Step 6: Clean up the temp div
      document.body.removeChild(tempDiv);

      // Step 7: Open final submit page
      const finalUrl = `https://inspireyouthnj.org/admin/myemails/submit?png=${encodeURIComponent(
        pngDataUrl
      )}&url=${encodeURIComponent(shareUrl)}`;
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
          {loading ? <CircularProgress size={20} /> : <CloudUploadOutlinedIcon fontSize="small" />}
        </IconButton>
      </span>
    </Tooltip>
  );
}
