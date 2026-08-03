import assert from 'node:assert/strict';
import { parseChatContent } from '../src/utils/chatContent.js';

assert.deepEqual(
  parseChatContent('before\n![image](data:image/png;base64,aGVsbG8=)\nafter'),
  [
    { type: 'text', text: 'before\n' },
    { type: 'image', alt: 'image', url: 'data:image/png;base64,aGVsbG8=' },
    { type: 'text', text: '\nafter' },
  ],
);
assert.deepEqual(
  parseChatContent('![preview](https://example.com/image.png)'),
  [{ type: 'image', alt: 'preview', url: 'https://example.com/image.png' }],
);
assert.deepEqual(
  parseChatContent('![unsafe](javascript:alert(1))'),
  [{ type: 'text', text: '![unsafe](javascript:alert(1))' }],
);
assert.deepEqual(
  parseChatContent('![unsafe](data:image/svg+xml;base64,PHN2Zz4=)'),
  [{ type: 'text', text: '![unsafe](data:image/svg+xml;base64,PHN2Zz4=)' }],
);

console.log('chat content parser check passed');
