import assert from 'node:assert/strict';
import {
  filterAvailableModels,
  modelSupportsImageUpload,
  toChatCompletionMessage,
} from '../src/utils/chatModels.js';
import { readChatResponse } from '../src/utils/chatResponse.js';

assert.deepEqual(
  filterAvailableModels(
    [
      [
        { name: 'gpt-5.5', tokenId: 1 },
        { name: 'gpt-image-2', tokenId: 1 },
        { name: 'retired-model', tokenId: 1 },
      ],
      [{ name: 'GPT-5.5', tokenId: 2 }, { name: 'claude-opus-4-8', tokenId: 2 }],
    ],
    [
      { model_name: 'gpt-5.5', category: 'chat' },
      { model_name: 'gpt-image-2', category: 'image' },
      { model_name: 'claude-opus-4-8', category: 'chat' },
    ],
  ),
  [
    { name: 'gpt-5.5', tokenId: 1 },
    { name: 'claude-opus-4-8', tokenId: 2 },
  ],
);

assert.equal(modelSupportsImageUpload('gpt-5.6-sol'), true);
assert.equal(modelSupportsImageUpload('claude-opus-4-8'), true);
assert.equal(modelSupportsImageUpload('google/gemini-3.5-flash'), true);
assert.equal(modelSupportsImageUpload('DeepSeek-V3.2'), false);
assert.deepEqual(
  toChatCompletionMessage({
    role: 'user',
    content: 'What is in this image?',
    attachment: { dataUrl: 'data:image/png;base64,dGVzdA==' },
  }),
  {
    role: 'user',
    content: [
      { type: 'text', text: 'What is in this image?' },
      {
        type: 'image_url',
        image_url: { url: 'data:image/png;base64,dGVzdA==' },
      },
    ],
  },
);

const encoder = new TextEncoder();
const chunks = [
  'data: {"choices":[{"delta":{"content":"你"}}]}\n',
  'data: {"choices":[{"delta":{"content":"好"}}]}',
];
const response = new Response(new ReadableStream({
  start(controller) {
    chunks.forEach((chunk) => controller.enqueue(encoder.encode(chunk)));
    controller.close();
  },
}), {
  headers: { 'content-type': 'text/event-stream' },
});

let content = '';
await readChatResponse(response, (chunk) => {
  content += chunk;
});
assert.equal(content, '你好');

const jsonResponse = new Response(JSON.stringify({
  choices: [{ message: { content: 'ok' } }],
}), {
  headers: { 'content-type': 'application/json' },
});
content = '';
await readChatResponse(jsonResponse, (chunk) => {
  content += chunk;
});
assert.equal(content, 'ok');
