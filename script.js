// Helper function to parse data URLs
function parseDataUrl(url) {
  if (!url.startsWith('data:')) {
    return null;
  }
  
  const match = url.match(/^data:([^;]+)(;base64)?,(.*)$/);
  if (!match) {
    throw new Error('Invalid data URL');
  }
  
  const mime = match[1];
  const isBase64 = !!match[2];
  const payload = match[3];
  
  let text = '';
  if (isBase64) {
    try {
      const binary = atob(payload);
      const bytes = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) {
        bytes[i] = binary.charCodeAt(i);
      }
      text = new TextDecoder().decode(bytes);
    } catch (e) {
      throw new Error('Failed to decode base64 data');
    }
  } else {
    try {
      text = decodeURIComponent(payload);
    } catch (e) {
      throw new Error('Failed to decode URL-encoded data');
    }
  }
  
  return { mime, isBase64, text };
}

// Process markdown content
async function processMarkdown() {
  const outputElement = document.getElementById('markdown-output');
  
  try {
    // Get the attachment URL from the context
    const attachments = [
      {
        "name": "input.md",
        "url": "data:text/markdown;base64,aGVsbG8KIyBUaXRsZQ=="
      }
    ];
    
    if (!attachments || attachments.length === 0) {
      throw new Error('No attachments provided');
    }
    
    // Find the markdown file
    const markdownAttachment = attachments.find(att => 
      att.name === 'input.md' || att.url.includes('markdown')
    ) || attachments[0];
    
    let markdownText = '';
    
    // Handle data URLs
    if (markdownAttachment.url.startsWith('data:')) {
      const parsed = parseDataUrl(markdownAttachment.url);
      if (parsed && parsed.mime.includes('markdown')) {
        markdownText = parsed.text;
      } else {
        throw new Error('Invalid markdown data URL');
      }
    } 
    // Handle HTTP URLs
    else if (markdownAttachment.url.startsWith('http')) {
      const response = await fetch(markdownAttachment.url);
      if (!response.ok) {
        throw new Error(`Failed to fetch markdown: ${response.status}`);
      }
      markdownText = await response.text();
    } else {
      throw new Error('Unsupported URL format');
    }
    
    // Configure Marked.js
    marked.setOptions({
      highlight: function(code, lang) {
        if (lang && hljs.getLanguage(lang)) {
          return hljs.highlight(code, { language: lang }).value;
        } else {
          return hljs.highlightAuto(code).value;
        }
      },
      breaks: true,
      gfm: true
    });
    
    // Convert markdown to HTML
    const htmlContent = marked.parse(markdownText);
    
    // Render in the output element
    outputElement.innerHTML = htmlContent;
    
  } catch (error) {
    console.error('Error processing markdown:', error);
    outputElement.innerHTML = `<p class="error">Error: ${error.message}</p>`;
  }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', processMarkdown);