// spark-flows.ts — 火花(Spark) 全部 Harness 流程定义
// 使用 engine/types.ts 的统一类型，与 HarnessRunner 兼容

import type { HarnessFlow } from '../types';

// ── 写公众号文章流程 ─────────────────────────────
export const SPARK_WRITE_ARTICLE: HarnessFlow = {
  id: 'spark-write-article',
  name: '写公众号文章',
  description: '引导完成微信公众号文章创作：理解需求 → 大纲 → 确认 → 全文 → 确认',
  trigger: '写文章|写公众号|公众号文章|帮我写一篇',
  employeeId: 'spark',
  steps: [
    {
      id: 'understand',
      type: 'ai',
      label: '理解需求',
      waitForUser: true,
      prompt:
        '你是一位资深内容创意总监，正在分析用户的内容创作需求。' +
        '请针对用户的请求，简短提出 1-2 个澄清问题，' +
        '帮助你更好了解目标受众、核心信息和写作调性。' +
        '保持简洁、对话式的风格。用中文回复。',
      next: 'outline',
    },
    {
      id: 'outline',
      type: 'ai',
      label: '生成大纲',
      prompt:
        '根据前面的对话内容，为微信公众号文章生成一份结构化大纲，包含 3-5 个主要章节。\n' +
        '请以 JSON 格式输出大纲，格式如下：\n' +
        '{ "title": "文章标题", "items": [{ "id": "sec-1", "title": "章节标题", "children": [{ "id": "sec-1-1", "title": "子章节标题" }] }] }\n' +
        '将 JSON 包裹在 ```json``` 代码块中。\n' +
        '同时在 JSON 之外用中文简要说明大纲的设计思路。',
      next: 'confirm-outline',
    },
    {
      id: 'confirm-outline',
      type: 'confirm',
      label: '确认大纲',
      card: {
        template: 'content-outline',
        dataMapper: 'mapOutlineData',
      },
      next: 'write',
    },
    {
      id: 'write',
      type: 'ai',
      label: '撰写全文',
      prompt:
        '根据已确认的大纲，撰写一篇完整的微信公众号文章。要求：\n' +
        '- 全文使用中文\n' +
        '- 风格生动有趣、结构清晰\n' +
        '- 字数控制在 1500-2000 字\n' +
        '- 使用恰当的标题层级（用 ## 和 ### 标记）\n' +
        '- 重点内容适当加粗\n' +
        '- 开头引人入胜，结尾引导互动\n' +
        '- 最后一行附上 3-5 个话题标签（#xxx 格式）',
      next: 'confirm-article',
    },
    {
      id: 'confirm-article',
      type: 'confirm',
      label: '确认文章',
      card: {
        template: 'article-editor',
        dataMapper: 'mapArticleData',
      },
      next: 'done',
    },
    {
      id: 'done',
      type: 'ai',
      label: '完成',
      prompt:
        '文章已确认完成！请用中文简要总结本次创作内容，包括：\n' +
        '- 文章主题和字数\n' +
        '- 目标受众\n' +
        '- 建议下一步操作（发布到公众号、生成小红书版本、创建配图等）\n' +
        '保持简洁友好的语气。',
    },
  ],
};

// ── 写小红书笔记流程 ─────────────────────────────
export const SPARK_WRITE_XIAOHONGSHU: HarnessFlow = {
  id: 'spark-write-xiaohongshu',
  name: '写小红书笔记',
  description: '创作小红书种草笔记',
  trigger: '小红书|种草|笔记',
  employeeId: 'spark',
  steps: [
    {
      id: 'understand',
      type: 'ai',
      label: '理解需求',
      waitForUser: false,  // 跳过追问，直接推进到 write（让演示更流畅）
      prompt:
        '你是一位温暖专业的小红书内容专家。认真阅读用户的需求，简要总结你理解到的关键信息（产品/话题、受众、风格），然后直接进入创作环节，不要提问。用简洁友好的语气，中文回复。',
      next: 'write',
    },
    {
      id: 'write',
      type: 'ai',
      label: '撰写笔记',
      prompt:
        '根据对话内容，创作一篇小红书笔记。要求：\n' +
        '- 直接输出笔记内容，开头即正文，不要加任何引导语、问候语或署名\n' +
        '- 标题吸引眼球（可用 emoji）\n' +
        '- 正文 300-600 字，生活化口吻\n' +
        '- 分段清晰，重点用 emoji 标注\n' +
        '- 开头有代入感，结尾有行动号召\n' +
        '- 末尾加 5-8 个热门话题标签（#xxx 格式）',
      next: 'confirm-post',
    },
    {
      id: 'confirm-post',
      type: 'confirm',
      label: '确认笔记',
      card: {
        template: 'social-post',
        dataMapper: 'mapSocialPostData',
      },
    },
  ],
};

// ── 所有火花流程注册表 ───────────────────────────
export const SPARK_FLOWS: HarnessFlow[] = [
  SPARK_WRITE_ARTICLE,
  SPARK_WRITE_XIAOHONGSHU,
];

/**
 * 根据用户输入匹配触发的流程
 * 返回匹配的第一个 flow，无匹配返回 null
 */
export function matchSparkFlow(userInput: string): HarnessFlow | null {
  for (const flow of SPARK_FLOWS) {
    const patterns = flow.trigger.split('|');
    for (const pattern of patterns) {
      if (userInput.includes(pattern)) {
        return flow;
      }
    }
  }
  return null;
}
