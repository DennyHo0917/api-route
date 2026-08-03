const getPayload = (data) => data?.data || data || {};

export function createVideoRequest(model, prompt, {
  seconds = '4',
  ratio = '16:9',
  resolution = '720p',
} = {}) {
  return {
    model,
    prompt,
    seconds,
    metadata: { ratio, resolution },
  };
}

export async function readVideoResponse(response) {
  const body = await response.text();
  let data;
  try {
    data = body ? JSON.parse(body) : {};
  } catch {
    throw new Error(body || `HTTP ${response.status}`);
  }
  if (!response.ok || data?.success === false) {
    const error = new Error(
      data?.error?.message
      || (typeof data?.error === 'string' ? data.error : '')
      || data?.message
      || data?.code
      || `HTTP ${response.status}`,
    );
    error.code = data?.code || data?.error?.code || '';
    error.status = response.status;
    throw error;
  }
  return data;
}

export function getVideoTaskId(data) {
  const payload = getPayload(data);
  return String(payload.id || payload.task_id || '');
}

export function getVideoTaskState(data) {
  const status = String(getPayload(data).status || '').toLowerCase();
  if (['completed', 'succeeded', 'success'].includes(status)) return 'success';
  if (['failed', 'failure', 'cancelled', 'canceled'].includes(status)) return 'failure';
  if (['processing', 'in_progress'].includes(status)) return 'processing';
  return 'queued';
}

export function getVideoTaskError(data) {
  const payload = getPayload(data);
  return payload?.error?.message
    || (typeof payload?.error === 'string' ? payload.error : '')
    || payload?.fail_reason
    || data?.message
    || '';
}
