export async function readChatResponse(response, onContent) {
  if (!response.ok) {
    const body = await response.text();
    try {
      const parsed = JSON.parse(body);
      throw new Error(parsed?.error?.message || parsed?.message || body);
    } catch (error) {
      if (error instanceof SyntaxError) throw new Error(body || `HTTP ${response.status}`);
      throw error;
    }
  }

  const contentType = response.headers.get('content-type') || '';
  if (!contentType.includes('text/event-stream')) {
    const data = await response.json();
    const content = data?.choices?.[0]?.message?.content;
    if (content) onContent(content);
    return;
  }

  const reader = response.body?.getReader();
  if (!reader) throw new Error('Streaming response is unavailable');

  const consumeLine = (line) => {
    const payload = line.startsWith('data:') ? line.slice(5).trim() : '';
    if (!payload || payload === '[DONE]') return;
    try {
      const data = JSON.parse(payload);
      const content = data?.choices?.[0]?.delta?.content;
      if (content) onContent(content);
    } catch {
      // Ignore keep-alives or non-JSON SSE events.
    }
  };

  const decoder = new TextDecoder();
  let buffer = '';
  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split(/\r?\n/);
    buffer = lines.pop() || '';
    lines.forEach(consumeLine);
  }
  buffer += decoder.decode();
  if (buffer) consumeLine(buffer);
}
