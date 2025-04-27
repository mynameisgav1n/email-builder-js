import { TEditorConfiguration } from '../../documents/editor/core';

const DEFAULT_TEMPLATE: TEditorConfiguration = {
  "root": {
    "type": "EmailLayout",
    "data": {
      "backdropColor": "#faefe9",
      "borderRadius": 0,
      "canvasColor": "#faefe9",
      "textColor": "#242424",
      "fontFamily": "MODERN_SANS",
      "childrenIds": [
        "block-1709571212684",
        "block-1709571234315",
        "block-1731012642335"
      ]
    }
  },
  "block-1709571212684": {
    "type": "Image",
    "data": {
      "style": {
        "padding": {
          "top": 24,
          "bottom": 24,
          "right": 24,
          "left": 24
        },
        "textAlign": "center"
      },
      "props": {
        "width": 300,
        "url": "https://static.iynj.org/fullLogo.png",
        "alt": "Inspire Youth NJ Logo",
        "linkHref": "https://inspireyouthnj.org/",
        "contentAlignment": "middle"
      }
    }
  },
  "block-1709571234315": {
    "type": "Text",
    "data": {
      "style": {
        "color": "#0A0A0A",
        "fontWeight": "normal",
        "padding": {
          "top": 0,
          "bottom": 0,
          "right": 24,
          "left": 24
        }
      },
      "props": {
        "markdown": true,
        "text": "Hey {{1.name}}! 👋\n\n"
      }
    }
  },
  "block-1731012642335": {
    "type": "Text",
    "data": {
      "style": {
        "fontSize": 12,
        "fontWeight": "normal",
        "textAlign": "center",
        "padding": {
          "top": 0,
          "bottom": 8,
          "right": 24,
          "left": 24
        }
      },
      "props": {
        "markdown": true,
        "text": "© 2025 Inspire Youth USA Inc. All Rights Reserved.\n<a href=\"https://www.inspireyouthnj.org/account/notifications\" style=\"color: #F47529;\"><b>Update Your Email Preferences</b></a>"
      }
    }
  }
};

export default DEFAULT_TEMPLATE;
