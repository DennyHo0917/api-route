import { mkdir, writeFile } from 'node:fs/promises';

const API_URL = process.env.PRICING_API_URL || 'https://www.api-route.com/api/dist/site/models';
const OUTPUT_URL = new URL('../src/content/pricingSnapshot.json', import.meta.url);
const preferredVendors = [
  ['OpenAI', [/^gpt-5\.6-sol$/i, /^gpt-/i]],
  ['Anthropic', [/^claude-sonnet/i, /^claude-/i]],
  ['Google', [/^gemini-.*pro/i, /^gemini-/i]],
  ['DeepSeek', [/^deepseek-/i, /deepseek/i]],
  ['xAI', [/^grok-/i, /grok/i]],
  ['阿里巴巴', [/^qwen/i, /qwen/i]],
];

const response = await fetch(API_URL, { signal: AbortSignal.timeout(30_000) });
if (!response.ok) throw new Error(`Pricing API returned HTTP ${response.status}`);
const payload = await response.json();
if (!payload?.success || !Array.isArray(payload.data)) throw new Error('Pricing API returned an invalid response');

const tokenModels = payload.data.filter((model) => (
  model.enabled !== false
  && model.billing_type === 'per_token'
  && !model.is_per_call
  && !String(model.model_name || '').includes(':batch')
  && Number.isFinite(Number(model.input_price))
  && Number.isFinite(Number(model.output_price))
));

function pickModel(vendor, patterns) {
  const candidates = tokenModels.filter((model) => model.vendor_name === vendor);
  for (const pattern of patterns) {
    const match = candidates.find((model) => pattern.test(String(model.model_name || '')));
    if (match) return match;
  }
  return candidates[0];
}

const models = preferredVendors
  .map(([vendor, patterns]) => pickModel(vendor, patterns))
  .filter(Boolean)
  .map((model) => ({
    vendor: model.vendor_name || '',
    model_name: model.model_name,
    display_name: model.display_name || model.model_name,
    input_price: Number(model.input_price) * 1000,
    output_price: Number(model.output_price) * 1000,
    cache_read_price: model.cache_read_price == null ? null : Number(model.cache_read_price) * 1000,
    cache_creation_price: model.cache_creation_price == null ? null : Number(model.cache_creation_price) * 1000,
    unit: 'USD per 1M tokens',
  }));

if (models.length < 4) throw new Error(`Only ${models.length} representative pricing models were found`);

await mkdir(new URL('../src/content/', import.meta.url), { recursive: true });
await writeFile(OUTPUT_URL, `${JSON.stringify({
  source: API_URL,
  refreshed_at: new Date().toISOString(),
  models,
}, null, 2)}\n`, 'utf8');

console.log(`Pricing snapshot refreshed with ${models.length} models.`);
