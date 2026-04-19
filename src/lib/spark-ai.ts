// spark-ai.ts — Gemini 客户端 (OpenAI 兼容格式)
// 代理地址: Cloudflare Worker → Gemini 2.5 Flash
// 注意：CF Worker 代理暂不支持 SSE 流式，使用非流式 + 模拟逐字输出

const PROXY_URL = 'https://spark-gemini-proxy.finewood2008.workers.dev/v1/chat/completions';
const MODEL = 'gemini-2.5-flash';

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

// ── 模拟流式输出（非流式 API + 逐字推送）──────────
async function simulateStream(
  fullText: string,
  onDelta: (text: string) => void,
  onDone: () => void,
) {
  // 按句子/标点切分，逐块推送，模拟流式效果
  const chunks: string[] = [];
  let current = '';
  for (const char of fullText) {
    current += char;
    // 在标点或每 3-8 字推送一次
    if (/[。！？，；：、\n.!?,;:]/.test(char) || current.length >= 5) {
      chunks.push(current);
      current = '';
    }
  }
  if (current) chunks.push(current);

  for (const chunk of chunks) {
    onDelta(chunk);
    // 每块之间加 30-60ms 延迟
    await new Promise(r => setTimeout(r, 30 + Math.random() * 30));
  }
  onDone();
}

// ── 对话调用 ──────────────────────────────
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
        stream: false,
        temperature: 0.8,
        max_tokens: 4096,
      }),
    });

    if (!resp.ok) {
      const errText = await resp.text();
      throw new Error(`API error ${resp.status}: ${errText}`);
    }

    const data = await resp.json();
    const content = data.choices?.[0]?.message?.content || '';

    if (!content) {
      throw new Error('API returned empty content');
    }

    // 模拟流式输出
    await simulateStream(content, onDelta, onDone);
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
