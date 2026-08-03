const MARKDOWN_IMAGE_SOURCE = String.raw`!\[([^\]]*)\]\((data:image\/(?:png|jpe?g|webp|gif|avif);base64,[a-z0-9+/=\r\n]+|https?:\/\/[^\s)]+)\)`;

export function parseChatContent(content) {
  const value = typeof content === 'string' ? content : String(content || '');
  const parts = [];
  let cursor = 0;

  for (const match of value.matchAll(new RegExp(MARKDOWN_IMAGE_SOURCE, 'gi'))) {
    if (match.index > cursor) {
      parts.push({ type: 'text', text: value.slice(cursor, match.index) });
    }
    parts.push({ type: 'image', alt: match[1], url: match[2] });
    cursor = match.index + match[0].length;
  }

  if (cursor < value.length || parts.length === 0) {
    parts.push({ type: 'text', text: value.slice(cursor) });
  }

  return parts;
}
