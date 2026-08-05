export function createImageRequest(model, prompt, options = {}) {
  const request = { model, prompt, n: Number(options.n) || 1 };
  if (options.size) request.size = options.size;
  if (options.quality) request.quality = options.quality;
  return request;
}

export async function readImageResponse(response) {
  const body = await response.text();
  let payload;
  try {
    payload = JSON.parse(body);
  } catch {
    if (!response.ok) throw new Error(body || `HTTP ${response.status}`);
    throw new Error('Invalid image response');
  }

  if (!response.ok) {
    throw new Error(payload?.error?.message || payload?.message || `HTTP ${response.status}`);
  }

  return (Array.isArray(payload?.data) ? payload.data : []).flatMap((image) => {
    if (image?.url) return [image.url];
    if (!image?.b64_json) return [];
    return [image.b64_json.startsWith('data:image/')
      ? image.b64_json
      : `data:image/png;base64,${image.b64_json}`];
  });
}
