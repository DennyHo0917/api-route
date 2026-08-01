const IMAGE_INPUT_MODEL_PATTERN = /(^|\/)(gpt-|claude-|gemini-|kimi-|grok-)/;
const WEB_CHAT_EXCLUDED_MODEL_PATTERN = /(^|\/)gpt-5\.(?:3|4)(?:[-.]|$)/;

const normalizeModelName = (name) => String(name || '').toLowerCase();
const compareModelNames = (a, b) => {
  const aName = normalizeModelName(a).split('/').pop();
  const bName = normalizeModelName(b).split('/').pop();
  return aName.localeCompare(bName, 'en', { numeric: true, sensitivity: 'base' })
    || normalizeModelName(a).localeCompare(normalizeModelName(b), 'en', {
      numeric: true,
      sensitivity: 'base',
    });
};

const getWebChatFamily = (model) => {
  const name = normalizeModelName(model?.model_name);

  if (/(^|\/)gpt-/.test(name)) return 0;
  if (/(^|\/)claude-/.test(name)) return 1;
  if (/(^|\/)gemini-/.test(name)) return 2;
  if (/(^|\/)deepseek-/.test(name)) return 3;
  if (/(^|\/)kimi-/.test(name)) return 4;
  if (/(^|\/)glm-/.test(name)) return 5;
  if (/(^|\/)grok-/.test(name)) return 6;
  return -1;
};

export const modelSupportsImageUpload = (name) => (
  IMAGE_INPUT_MODEL_PATTERN.test(normalizeModelName(name))
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

function intersectListedModels(groups, siteModels, chatOnly = false) {
  const listedModels = chatOnly
    ? siteModels.filter(
      (model) => String(model?.category || '').toLowerCase() === 'chat',
    )
    : siteModels;
  const availableNames = new Set(
    listedModels.map((model) => normalizeModelName(model?.model_name)),
  );
  const siteModelsByName = new Map(
    listedModels.map((model) => [normalizeModelName(model?.model_name), model]),
  );
  const seen = new Set();
  const models = [];

  groups.flat().forEach((model) => {
    const name = normalizeModelName(model.name);
    if (!availableNames.has(name) || seen.has(name)) return;
    seen.add(name);
    models.push(model);
  });

  return { models, siteModelsByName };
}

export function filterAvailableModels(groups, siteModels) {
  const { models, siteModelsByName } = intersectListedModels(
    groups,
    siteModels,
    true,
  );
  const seenDisplayNames = new Set();

  return models
    .filter((model) => (
      getWebChatFamily(siteModelsByName.get(normalizeModelName(model.name))) >= 0
    ))
    .filter((model) => !WEB_CHAT_EXCLUDED_MODEL_PATTERN.test(normalizeModelName(model.name)))
    .sort((a, b) => {
      const aName = normalizeModelName(a.name);
      const bName = normalizeModelName(b.name);
      const familyDiff = getWebChatFamily(siteModelsByName.get(aName))
        - getWebChatFamily(siteModelsByName.get(bName));
      return familyDiff || compareModelNames(a.name, b.name);
    })
    .filter((model) => {
      const displayName = normalizeModelName(model.name).split('/').pop();
      if (seenDisplayNames.has(displayName)) return false;
      seenDisplayNames.add(displayName);
      return true;
    });
}

export function filterAvailableModelsByCategory(groups, siteModels, category) {
  const { models } = intersectListedModels(
    groups,
    siteModels.filter(
      (model) => String(model?.category || '').toLowerCase() === category,
    ),
  );
  const seenDisplayNames = new Set();

  return models
    .sort((a, b) => compareModelNames(a.name, b.name))
    .filter((model) => {
      const displayName = normalizeModelName(model.name).split('/').pop();
      if (seenDisplayNames.has(displayName)) return false;
      seenDisplayNames.add(displayName);
      return true;
    });
}

export function filterListedModels(groups, siteModels) {
  const { models } = intersectListedModels(groups, siteModels);
  return models.sort((a, b) => compareModelNames(a.name, b.name));
}
