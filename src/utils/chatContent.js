const MARKDOWN_IMAGE_SOURCE = String.raw`!\[([^\]]*)\]\((data:image\/(?:png|jpe?g|webp|gif|avif);base64,[a-z0-9+/=\r\n]+|https?:\/\/[^\s)]+)\)`;
const CODE_FENCE = '```';

function appendTextAndImages(parts, value) {
  let cursor = 0;

  for (const match of value.matchAll(new RegExp(MARKDOWN_IMAGE_SOURCE, 'gi'))) {
    if (match.index > cursor) {
      parts.push({ type: 'text', text: value.slice(cursor, match.index) });
    }
    parts.push({ type: 'image', alt: match[1], url: match[2] });
    cursor = match.index + match[0].length;
  }

  if (cursor < value.length) {
    parts.push({ type: 'text', text: value.slice(cursor) });
  }
}

export function parseChatContent(content) {
  const value = typeof content === 'string' ? content : String(content || '');
  const parts = [];
  let cursor = 0;

  while (cursor < value.length) {
    const fenceStart = value.indexOf(CODE_FENCE, cursor);
    if (fenceStart === -1) {
      appendTextAndImages(parts, value.slice(cursor));
      break;
    }

    const headerEnd = value.indexOf('\n', fenceStart + CODE_FENCE.length);
    if (headerEnd === -1) {
      appendTextAndImages(parts, value.slice(cursor));
      break;
    }

    appendTextAndImages(parts, value.slice(cursor, fenceStart));
    const fenceEnd = value.indexOf(CODE_FENCE, headerEnd + 1);
    parts.push({
      type: 'code',
      language: value.slice(fenceStart + CODE_FENCE.length, headerEnd).trim(),
      text: value.slice(headerEnd + 1, fenceEnd === -1 ? value.length : fenceEnd),
    });

    if (fenceEnd === -1) break;
    cursor = fenceEnd + CODE_FENCE.length;
  }

  if (parts.length === 0) parts.push({ type: 'text', text: '' });

  return parts;
}
