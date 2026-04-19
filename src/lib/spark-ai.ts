// spark-ai.ts — Gemini 流式客户端 (OpenAI 兼容格式)
// 代理地址: Cloudflare Worker → Gemini 2.5 Flash

const PROXY_URL = 'https://spark-gemini-proxy.finewood2008.workers.dev/v1/chat/completions';
const MODEL = 'gemini-2.5-flash';

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

// ── SSE 流式解析 ──────────────────────────────
async function processSSEStream(
  resp: Response,
  onDelta: (text: string) => void,
  onDone: () => void,
) {
  if (!resp.body) { onDone(); return; }
  const reader = resp.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  let streamDone = false;

  while (!streamDone) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });

    let newlineIdx: number;
    while ((newlineIdx = buffer.indexOf('\n')) !== -1) {
      let line = buffer.slice(0, newlineIdx);
      buffer = buffer.slice(newlineIdx + 1);
      if (line.endsWith('\r')) line = line.slice(0, -1);
      if (line.startsWith(':') || line.trim() === '') continue;
      if (!line.startsWith('data: ')) continue;
      const jsonStr = line.slice(6).trim();
      if (jsonStr === '[DONE]') { streamDone = true; break; }
      try {
        const parsed = JSON.parse(jsonStr);
        const content = parsed.choices?.[0]?.delta?.content as string | undefined;
        if (content) onDelta(content);
      } catch {
        buffer = line + '\n' + buffer;
        break;
      }
    }
  }
  onDone();
}

// ── 流式对话 ──────────────────────────────
export async function streamChat({
  messages,
  systemPrompt,
  onDelta,
  onDone,
  onError,
}: {
  messages: ChatMessage[];
  systemPrompt?: string;
  onDelta: (text: string) => void;
  onDone: () => void;
  onError?: (err: Error) => void;
}) {
  const allMessages: ChatMessage[] = [];
  if (systemPrompt) {
    allMessages.push({ role: 'system', content: systemPrompt });
  }
  allMessages.push(...messages);

  try {
    const resp = await fetch(PROXY_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: MODEL,
        messages: allMessages,
        stream: true,
        temperature: 0.8,
        max_tokens: 4096,
      }),
    });

    if (!resp.ok) {
      const errText = await resp.text();
      throw new Error(`API error ${resp.status}: ${errText}`);
    }

    await processSSEStream(resp, onDelta, onDone);
  } catch (err) {
    const error = err instanceof Error ? err : new Error(String(err));
    if (onError) onError(error);
    else console.error('[spark-ai] streamChat error:', error);
  }
}

// ── 一次性生成文章（内部使用流式，拼合完整结果）──
export async function generateArticle({
  topic,
  platform,
  systemPrompt,
}: {
  topic: string;
  platform: string;
  systemPrompt: string;
}): Promise<string> {
  return new Promise((resolve, reject) => {
    let result = '';
    streamChat({
      messages: [
        { role: 'user', content: `请为「${topic}」创作一篇${platform}内容。` },
      ],
      systemPrompt,
      onDelta: (text) => { result += text; },
      onDone: () => resolve(result),
      onError: reject,
    });
  });
}
