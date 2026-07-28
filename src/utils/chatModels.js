const CHAT_MODEL_ALLOWLIST = new Set([
  'gpt-5.5',
  'gpt-5.5-pro',
  'gpt-5.6-luna',
  'gpt-5.6-sol',
  'gpt-5.6-terra',
  'claude-sonnet-4-6',
  'claude-opus-4-7',
  'claude-opus-4-8',
  'google/gemini-3.1-flash-lite',
  'google/gemini-3.1-pro-preview',
  'google/gemini-3.5-flash',
  'google/gemini-3.5-flash-lite',
  'deepseek-v3.2',
  'deepseek/deepseek-v4-pro',
  'x-ai/grok-4.3',
  'x-ai/grok-4.5',
  'glm-5.1',
  'glm-5.2',
  'kimi-k2.5',
  'kimi-k3',
  'qwen3.5-plus',
]);

const IMAGE_INPUT_MODEL_ALLOWLIST = new Set([
  'gpt-5.5',
  'gpt-5.5-pro',
  'gpt-5.6-luna',
  'gpt-5.6-sol',
  'gpt-5.6-terra',
  'claude-sonnet-4-6',
  'claude-opus-4-7',
  'claude-opus-4-8',
  'google/gemini-3.1-flash-lite',
  'google/gemini-3.1-pro-preview',
  'google/gemini-3.5-flash',
  'google/gemini-3.5-flash-lite',
]);

const normalizeModelName = (name) => String(name || '').toLowerCase();

export const modelSupportsImageUpload = (name) => (
  IMAGE_INPUT_MODEL_ALLOWLIST.has(normalizeModelName(name))
);

export function toChatCompletionMessage(message, includeImage = true) {
  const { role, content, attachment } = message;
  if (!includeImage || !attachment?.dataUrl) return { role, content };

  return {
    role,
    content: [
      { type: 'text', text: content },
      { type: 'image_url', image_url: { url: attachment.dataUrl } },
    ],
  };
}

export function filterAvailableModels(groups, siteModels) {
  const availableNames = new Set(
    siteModels
      .filter((model) => String(model?.category || '').toLowerCase() === 'chat')
      .map((model) => normalizeModelName(model?.model_name))
      .filter((name) => CHAT_MODEL_ALLOWLIST.has(name)),
  );
  const seen = new Set();
  const models = [];

  groups.flat().forEach((model) => {
    const name = normalizeModelName(model.name);
    if (!availableNames.has(name) || seen.has(name)) return;
    seen.add(name);
    models.push(model);
  });

  return models;
}
