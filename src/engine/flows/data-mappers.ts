// data-mappers.ts — 从 AI 回复中提取结构化数据供卡片组件使用

/**
 * 大纲数据结构（与 ContentOutlineCard 的 OutlineData 对齐）
 */
export interface OutlineItem {
  id: string;
  title: string;
  children?: OutlineItem[];
}

export interface OutlineData {
  title: string;
  items: OutlineItem[];
  status?: 'draft' | 'confirmed';
}

/**
 * 文章数据结构（与 ArticleEditorCard 的 ArticleData 对齐）
 */
export interface ArticleData {
  title: string;
  content: string;
  tags: string[];
  platform: 'wechat' | 'xiaohongshu' | 'douyin';
  wordCount?: number;
}

// ---------------------------------------------------------------------------
// mapOutlineData — 从 AI 回复中解析 JSON 大纲
// AI 被提示将 JSON 包裹在 ```json``` 代码块中
// ---------------------------------------------------------------------------
export function mapOutlineData(aiResponse: string): OutlineData {
  // 尝试从 ```json ... ``` 代码块中提取 JSON
  const codeBlockMatch = aiResponse.match(/```json\s*([\s\S]*?)```/);
  let jsonStr = codeBlockMatch ? codeBlockMatch[1].trim() : '';

  // 如果代码块匹配失败，尝试直接查找 JSON 对象
  if (!jsonStr) {
    const rawMatch = aiResponse.match(/\{[\s\S]*"title"[\s\S]*"items"[\s\S]*\}/);
    jsonStr = rawMatch ? rawMatch[0] : '';
  }

  if (!jsonStr) {
    // 回退：构建一个最小大纲
    return {
      title: '文章大纲',
      items: [{ id: 'fallback-1', title: aiResponse.slice(0, 80) }],
      status: 'draft',
    };
  }

  try {
    const parsed = JSON.parse(jsonStr);

    // 规范化：确保每个 item 有 id
    const normalizeItems = (items: any[], prefix = 'sec'): OutlineItem[] =>
      (items || []).map((item: any, idx: number) => ({
        id: item.id || `${prefix}-${idx + 1}`,
        title: item.title || `第 ${idx + 1} 节`,
        children: item.children
          ? normalizeItems(item.children, `${prefix}-${idx + 1}`)
          : undefined,
      }));

    return {
      title: parsed.title || '文章大纲',
      items: normalizeItems(parsed.items),
      status: 'draft',
    };
  } catch {
    return {
      title: '文章大纲',
      items: [{ id: 'parse-err-1', title: '(大纲解析失败，请重新生成)' }],
      status: 'draft',
    };
  }
}

// ---------------------------------------------------------------------------
// mapArticleData — 从 AI 回复中提取标题、正文、标签
// AI 被提示输出格式：第一行标题，空行后正文，最后带 # 标签
// ---------------------------------------------------------------------------
export function mapArticleData(aiResponse: string): ArticleData {
  const lines = aiResponse.trim().split('\n');

  // 提取标题：取第一行非空内容（去掉可能的 # 前缀）
  let title = '';
  let contentStartIdx = 0;
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (line) {
      title = line.replace(/^#+\s*/, '');
      contentStartIdx = i + 1;
      break;
    }
  }

  // 跳过标题后的空行
  while (contentStartIdx < lines.length && !lines[contentStartIdx].trim()) {
    contentStartIdx++;
  }

  // 提取标签：从末尾查找以 # 开头的标签行
  const tags: string[] = [];
  let contentEndIdx = lines.length;

  for (let i = lines.length - 1; i >= contentStartIdx; i--) {
    const line = lines[i].trim();
    if (!line) continue;

    // 检查是否为标签行（包含多个 #xxx 格式）
    const tagMatches = line.match(/#[\u4e00-\u9fa5a-zA-Z0-9_]+/g);
    if (tagMatches && tagMatches.length >= 2) {
      tags.push(...tagMatches.map((t) => t.replace(/^#/, '')));
      contentEndIdx = i;
    } else {
      break;
    }
  }

  // 正文：标题行之后到标签行之前
  const content = lines
    .slice(contentStartIdx, contentEndIdx)
    .join('\n')
    .trim();

  // 如果没有解析到标签，尝试从正文中提取内联标签
  if (tags.length === 0) {
    const inlineTags = content.match(/#[\u4e00-\u9fa5a-zA-Z0-9_]+/g);
    if (inlineTags) {
      tags.push(
        ...inlineTags.slice(0, 8).map((t) => t.replace(/^#/, ''))
      );
    }
  }

  // 回退默认标签
  if (tags.length === 0) {
    tags.push('内容创作', '品牌');
  }

  return {
    title: title || '未命名文章',
    content: content || aiResponse,
    tags,
    platform: 'wechat',
    wordCount: content.length,
  };
}

// ---------------------------------------------------------------------------
// mapSocialPostData — 从 AI 回复中提取小红书/社媒帖子数据
// ---------------------------------------------------------------------------
export interface SocialPostData {
  content: string;
  platform: 'xiaohongshu' | 'douyin' | 'moments';
  images?: string[];
  hashtags?: string[];
}

export function mapSocialPostData(aiResponse: string): SocialPostData {
  const lines = aiResponse.trim().split('\n');

  // 提取 hashtag
  const hashtags: string[] = [];
  let contentEndIdx = lines.length;

  for (let i = lines.length - 1; i >= 0; i--) {
    const line = lines[i].trim();
    if (!line) continue;
    const tagMatches = line.match(/#[\u4e00-\u9fa5a-zA-Z0-9_]+/g);
    if (tagMatches && tagMatches.length >= 2) {
      hashtags.push(...tagMatches.map((t) => t.replace(/^#/, '')));
      contentEndIdx = i;
    } else {
      break;
    }
  }

  const content = lines.slice(0, contentEndIdx).join('\n').trim();

  if (hashtags.length === 0) {
    const inlineTags = content.match(/#[\u4e00-\u9fa5a-zA-Z0-9_]+/g);
    if (inlineTags) {
      hashtags.push(...inlineTags.slice(0, 8).map((t) => t.replace(/^#/, '')));
    }
  }

  return {
    content: content || aiResponse,
    platform: 'xiaohongshu',
    hashtags: hashtags.length > 0 ? hashtags : ['种草', '好物分享'],
  };
}
