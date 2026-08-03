import assert from 'node:assert/strict';
import {
  filterAvailableModels,
  filterAvailableModelsByCategory,
  filterListedModels,
  modelSupportsImageUpload,
  toChatCompletionMessage,
} from '../src/utils/chatModels.js';
import { readChatResponse } from '../src/utils/chatResponse.js';
import {
  createImageEditRequest,
  createImageRequest,
  readImageResponse,
} from '../src/utils/imageTask.js';
import {
  createVideoRequest,
  getVideoTaskError,
  getVideoTaskId,
  getVideoTaskState,
  readVideoResponse,
} from '../src/utils/videoTask.js';

const webChatModels = filterAvailableModels(
    [
      [
        { name: 'claude-opus-4-8', tokenId: 2 },
        { name: 'gpt-5.5', tokenId: 1 },
        { name: 'gpt-5.7', tokenId: 1 },
        { name: 'gpt-5.3-codex-spark', tokenId: 1 },
        { name: 'gpt-5.4-pro', tokenId: 1 },
        { name: 'google/gemini-3.6-flash', tokenId: 1 },
        { name: 'deepseek/deepseek-v4-pro', tokenId: 1 },
        { name: 'moonshotai/kimi-k3', tokenId: 1 },
        { name: 'glm-5.3', tokenId: 1 },
        { name: 'x-ai/grok-4.6', tokenId: 1 },
        { name: 'grok-4.6', tokenId: 2 },
        { name: 'openai/o1-pro', tokenId: 1 },
        { name: 'qwen/qwen3.5-plus-20260420', tokenId: 1 },
        { name: 'gpt-image-2', tokenId: 1 },
        { name: 'retired-model', tokenId: 1 },
      ],
      [{ name: 'GPT-5.5', tokenId: 2 }],
    ],
    [
      { model_name: 'gpt-5.5', category: 'chat', vendor_name: 'OpenAI' },
      { model_name: 'gpt-5.7', category: 'chat', vendor_name: 'OpenAI' },
      { model_name: 'gpt-5.3-codex-spark', category: 'chat', vendor_name: 'OpenAI' },
      { model_name: 'gpt-5.4-pro', category: 'chat', vendor_name: 'OpenAI' },
      { model_name: 'gpt-image-2', category: 'image', vendor_name: 'OpenAI' },
      { model_name: 'claude-opus-4-8', category: 'chat', vendor_name: 'Anthropic' },
      { model_name: 'google/gemini-3.6-flash', category: 'chat', vendor_name: 'Google' },
      { model_name: 'deepseek/deepseek-v4-pro', category: 'chat', vendor_name: 'DeepSeek' },
      { model_name: 'moonshotai/kimi-k3', category: 'chat', vendor_name: 'Moonshot' },
      { model_name: 'glm-5.3', category: 'chat', vendor_name: '智谱' },
      { model_name: 'x-ai/grok-4.6', category: 'chat', vendor_name: 'xAI' },
      { model_name: 'grok-4.6', category: 'chat', vendor_name: 'xAI' },
      { model_name: 'openai/o1-pro', category: 'chat', vendor_name: 'OpenAI' },
      { model_name: 'qwen/qwen3.5-plus-20260420', category: 'chat', vendor_name: '阿里巴巴' },
    ],
  );

assert.deepEqual(
  webChatModels.map((model) => model.name),
  [
    'gpt-5.5',
    'gpt-5.7',
    'claude-opus-4-8',
    'google/gemini-3.6-flash',
    'deepseek/deepseek-v4-pro',
    'moonshotai/kimi-k3',
    'glm-5.3',
    'grok-4.6',
  ],
);

assert.deepEqual(
  filterAvailableModelsByCategory(
    [[
      { name: 'gpt-image-2', tokenId: 1 },
      { name: 'sora-2', tokenId: 1 },
      { name: 'retired-model', tokenId: 1 },
    ]],
    [
      { model_name: 'gpt-image-2', category: 'image' },
      { model_name: 'sora-2', category: 'video' },
    ],
    'image',
  ).map((model) => model.name),
  ['gpt-image-2'],
);

assert.deepEqual(
  filterAvailableModelsByCategory(
    [[{ name: 'sora-2', tokenId: 1 }]],
    [{ model_name: 'sora-2', category: 'video' }],
    'video',
  ).map((model) => model.name),
  ['sora-2'],
);

assert.deepEqual(
  filterListedModels(
    [[
      { name: 'new-provider/new-chat-model', tokenId: 1 },
      { name: 'qwen/qwen3.5-plus-20260420', tokenId: 1 },
      { name: 'gpt-image-2', tokenId: 1 },
      { name: 'retired-model', tokenId: 1 },
    ]],
    [
      { model_name: 'qwen/qwen3.5-plus-20260420', category: 'chat' },
      { model_name: 'new-provider/new-chat-model', category: 'chat' },
      { model_name: 'gpt-image-2', category: 'image' },
    ],
  ),
  [
    { name: 'gpt-image-2', tokenId: 1 },
    { name: 'new-provider/new-chat-model', tokenId: 1 },
    { name: 'qwen/qwen3.5-plus-20260420', tokenId: 1 },
  ],
);

assert.equal(modelSupportsImageUpload('gpt-5.6-sol'), true);
assert.equal(modelSupportsImageUpload('claude-fable-5'), true);
assert.equal(modelSupportsImageUpload('google/gemini-3.6-flash'), true);
assert.equal(modelSupportsImageUpload('moonshotai/kimi-k3'), true);
assert.equal(modelSupportsImageUpload('x-ai/grok-4.5'), true);
assert.equal(modelSupportsImageUpload('x-ai/grok-4.20-multi-agent-beta-0309'), true);
assert.equal(modelSupportsImageUpload('deepseek/deepseek-v4-pro'), false);
assert.equal(modelSupportsImageUpload('glm-5.2'), false);
assert.equal(modelSupportsImageUpload('unknown/model'), false);
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

assert.deepEqual(
  createImageRequest('gpt-image-2', 'A red fox', {
    size: '1536x1024',
    quality: 'high',
    n: '2',
  }),
  {
    model: 'gpt-image-2',
    prompt: 'A red fox',
    n: 2,
    size: '1536x1024',
    quality: 'high',
  },
);
const imageEditRequest = await createImageEditRequest(
  'gpt-image-2',
  'Keep the fox, change the background',
  {
    name: 'fox.png',
    dataUrl: 'data:image/png;base64,dGVzdA==',
  },
  { size: '1024x1024', quality: 'high', n: '2' },
);
assert.equal(imageEditRequest.get('model'), 'gpt-image-2');
assert.equal(imageEditRequest.get('prompt'), 'Keep the fox, change the background');
assert.equal(imageEditRequest.get('image').name, 'fox.png');
assert.equal(imageEditRequest.get('size'), '1024x1024');
assert.equal(imageEditRequest.get('quality'), 'high');
assert.equal(imageEditRequest.get('n'), '2');
assert.deepEqual(
  await readImageResponse(new Response(JSON.stringify({
    data: [
      { url: 'https://example.com/image.png' },
      { b64_json: 'dGVzdA==' },
    ],
  }))),
  [
    'https://example.com/image.png',
    'data:image/png;base64,dGVzdA==',
  ],
);
await assert.rejects(
  readImageResponse(new Response(JSON.stringify({
    error: { message: 'image failed' },
  }), { status: 400 })),
  /image failed/,
);

assert.deepEqual(
  createVideoRequest('Doubao-Seedance-2.0', 'A running dog', {
    seconds: '8',
    ratio: '9:16',
    resolution: '1080p',
  }),
  {
    model: 'Doubao-Seedance-2.0',
    prompt: 'A running dog',
    seconds: '8',
    metadata: {
      ratio: '9:16',
      resolution: '1080p',
    },
  },
);
assert.equal(getVideoTaskId({ id: 'task-1' }), 'task-1');
assert.equal(getVideoTaskId({ data: { task_id: 'task-2' } }), 'task-2');
assert.equal(getVideoTaskState({ status: 'queued' }), 'queued');
assert.equal(getVideoTaskState({ status: 'IN_PROGRESS' }), 'processing');
assert.equal(getVideoTaskState({ status: 'completed' }), 'success');
assert.equal(getVideoTaskState({ data: { status: 'FAILURE' } }), 'failure');
assert.equal(getVideoTaskError({ error: { message: 'upstream failed' } }), 'upstream failed');
assert.deepEqual(
  await readVideoResponse(new Response(JSON.stringify({ id: 'task-3', status: 'queued' }))),
  { id: 'task-3', status: 'queued' },
);
await assert.rejects(
  readVideoResponse(new Response(JSON.stringify({ error: { message: 'bad request' } }), {
    status: 400,
  })),
  /bad request/,
);
await assert.rejects(
  readVideoResponse(new Response(JSON.stringify({
    code: 'fail_to_fetch_task',
    message: '',
    data: null,
  }), { status: 502 })),
  (error) => error.message === 'fail_to_fetch_task'
    && error.code === 'fail_to_fetch_task'
    && error.status === 502,
);
