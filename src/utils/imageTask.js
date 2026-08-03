export function createImageRequest(model, prompt, options = {}) {
  const request = { model, prompt, n: Number(options.n) || 1 };
  if (options.size) request.size = options.size;
  if (options.quality) request.quality = options.quality;
  return request;
}

export async function createImageEditRequest(model, prompt, attachment, options = {}) {
  const form = new FormData();
  const image = await fetch(attachment.dataUrl).then((response) => response.blob());
  form.append('model', model);
  form.append('prompt', prompt);
  form.append('image', image, attachment.name || 'reference.png');
  form.append('n', String(Number(options.n) || 1));
  if (options.size) form.append('size', options.size);
  if (options.quality) form.append('quality', options.quality);
  return form;
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
