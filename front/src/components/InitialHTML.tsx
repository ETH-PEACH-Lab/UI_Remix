export function injectHighlighter(htmlContent: string): string {
    const highlightStyles = `
    <style>
      .specified_compo {
        transition: all 0.1s ease;
        cursor: grab;
      }
      
      .highlighted {
        box-shadow: 0 0 5px rgba(117, 8, 131, 1) !important;
        background: #ffe5ff !important;
      }
    </style>
    `;
  
    const scriptUrl = '/tag.js';
    const highlightScript = `<script src="${scriptUrl}"></script>`;
  
    if (htmlContent.includes('specified_compo')) {
      return htmlContent;
    }
  
    if (htmlContent.includes('</head>')) {
      htmlContent = htmlContent.replace('</head>', `${highlightStyles}</head>`);
    } else {
      htmlContent = htmlContent.replace('<body', `<head>${highlightStyles}</head><body`);
    }
  
    if (htmlContent.includes('</body>')) {
      htmlContent = htmlContent.replace('</body>', `${highlightScript}</body>`);
    } else {
      htmlContent = `${htmlContent}${highlightScript}`;
    }
  
    return htmlContent;
  }