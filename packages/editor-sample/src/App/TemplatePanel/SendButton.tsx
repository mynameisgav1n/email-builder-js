import React from 'react';
import { IconButton, Tooltip } from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import { useDocument } from '../../documents/editor/EditorContext';

// Simple basic renderer (mock)
function simpleRenderDocumentToHtml(document: any, rootBlockId: string): string {
  if (!document || !document[rootBlockId]) {
    return '<p>No content.</p>';
  }

  const root = document[rootBlockId];
  const children = root.data.childrenIds || [];

  let html = '';

  for (const childId of children) {
    const child = document[childId];
    if (!child) continue;

    switch (child.type) {
      case 'Text':
        html += `<p>${child.data?.props?.text || ''}</p>`;
        break;
      case 'Heading':
        html += `<h1>${child.data?.props?.text || ''}</h1>`;
        break;
      case 'Image':
        html += `<img src="${child.data?.props?.url}" alt="${child.data?.props?.alt || ''}" style="width: 100%; max-width: 300px;" />`;
        break;
      case 'Button':
        html += `<a href="${child.data?.props?.url}" style="display: inline-block; padding: 10px 20px; background-color: #F47529; color: white; text-decoration: none;">${child.data?.props?.text || 'Button'}</a>`;
        break;
      case 'Divider':
        html += `<hr />`;
        break;
      default:
        html += `<div>Unknown block</div>`;
        break;
    }
  }

  // Wrap the output
  return `
    <html>
      <body style="font-family: Arial, sans-serif;">
        ${html}
      </body>
    </html>
  `;
}

export default function SendButton() {
  const document = useDocument();

  const onClick = async () => {
    const html = simpleRenderDocumentToHtml(document, 'root'); // Render simple HTML
    const encodedHtml = btoa(encodeURIComponent(html)); // Base64 encode
    window.open(`https://inspireyouthnj.org/admin/blastemail?code=${encodedHtml}`, '_blank'); // Open new tab
  };

  return (
    <Tooltip title="Send email">
      <IconButton onClick={onClick}>
        <SendIcon fontSize="small" />
      </IconButton>
    </Tooltip>
  );
}
