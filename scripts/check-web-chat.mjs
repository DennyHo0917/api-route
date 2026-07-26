import assert from 'node:assert/strict';
import { readChatResponse } from '../src/utils/chatResponse.js';

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
