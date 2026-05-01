// spark-ai.ts — Hub OS 统一模型调用适配层
// 所有员工工作台都通过 QeeClaw SDK 进入平台模型路由、计费和审计链路。
import { getClientAsync } from '../services/qeeclaw';
import { extractModelText } from './model-response';

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

function formatPrompt(messages: ChatMessage[]): string {
  return messages
    .map((message) => {
      const label = message.role === 'system'
        ? '系统'
        : message.role === 'assistant'
          ? '助手'
          : '用户';
      return `${label}：${message.content}`;
    })
    .join('\n\n');
}

// ── 前端分块输出（非流式 API + 逐块推送）──────────
async function emitChunkedText(
  fullText: string,
  onDelta: (text: string) => void,
  onDone: () => void,
) {
  // 按句子/标点切分，逐块推送
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
    const client = await getClientAsync();
    const result = await client.models.invoke({
      prompt: formatPrompt(allMessages),
    });
    const content = extractModelText(result);

    if (!content) {
      throw new Error('平台模型 API 未返回文本');
    }

    await emitChunkedText(content, onDelta, onDone);
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
