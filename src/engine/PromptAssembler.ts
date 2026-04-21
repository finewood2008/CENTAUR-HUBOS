import { usePersonaStore } from '../stores/personaStore';

interface AssembledPrompt {
  systemPrompt: string;
  contextSummary: {
    hasSoul: boolean;
    memoryCount: number;
    hasBossProfile: boolean;
    hasCompanyProfile: boolean;
  };
}

/**
 * Assembles a complete system prompt for a digital employee.
 * Layers (in order):
 * 1. SOUL - who the employee is
 * 2. COMPANY - enterprise context
 * 3. BOSS - knowledge about the user/boss
 * 4. TEAM - team dynamics knowledge
 * 5. MEMORY - accumulated memories (§ separated)
 * 6. Optional: additional instructions (harness step, platform-specific, etc.)
 */
export function assemblePrompt(
  employeeId: string,
  additionalInstructions?: string
): AssembledPrompt {
  const store = usePersonaStore.getState();
  const ctx = store.getFullContext(employeeId);
  
  const sections: string[] = [];
  
  // Layer 1: Soul (identity)
  if (ctx.soul) {
    sections.push(ctx.soul);
  }
  
  // Layer 2: Company context
  if (ctx.company) {
    sections.push(`## 企业背景\n${ctx.company}`);
  }
  
  // Layer 3: Boss profile
  if (ctx.boss) {
    sections.push(`## 关于老板\n${ctx.boss}`);
  }
  
  // Layer 4: Team knowledge
  if (ctx.team) {
    sections.push(`## 团队认知\n${ctx.team}`);
  }
  
  // Layer 5: Persistent memory
  if (ctx.memory) {
    sections.push(`## 我的记忆\n以下是我从过往工作中积累的认知，请在工作中参考：\n${ctx.memory}`);
  }
  
  // Layer 6: Additional instructions
  if (additionalInstructions) {
    sections.push(additionalInstructions);
  }
  
  const systemPrompt = sections.join('\n\n---\n\n');
  
  const contextSummary = {
    hasSoul: !!ctx.soul,
    memoryCount: store.getMemories(employeeId).length,
    hasBossProfile: !!ctx.boss,
    hasCompanyProfile: !!ctx.company,
  };
  
  return { systemPrompt, contextSummary };
}

/**
 * Quick helper to get just the system prompt string.
 */
export function getSystemPrompt(
  employeeId: string,
  additionalInstructions?: string
): string {
  return assemblePrompt(employeeId, additionalInstructions).systemPrompt;
}

/**
 * Memory extraction helper.
 * Given an AI response and the conversation context,
 * determines if any memories should be saved.
 * Returns suggested memory entries.
 * 
 * This is called after each AI response to check for memorizable content.
 */
export interface MemorySuggestion {
  content: string;
  category: 'preference' | 'fact' | 'lesson' | 'correction';
  target: 'employee' | 'boss' | 'company';
}

export function buildMemoryExtractionPrompt(
  employeeId: string,
  userMessage: string,
  aiResponse: string
): string {
  return `你是一个记忆管理助手。分析以下对话，判断是否有值得长期记住的信息。

记忆三问：
1. 长期有价值吗？（不是临时任务细节）
2. 稳定事实吗？（不会明天就变）
3. 难以重新推导吗？（不是显而易见的）

如果有值得记忆的内容，返回JSON数组。如果没有，返回空数组 []。

格式：
[{"content": "记忆内容", "category": "preference|fact|lesson|correction", "target": "employee|boss|company"}]

category说明：
- preference: 用户偏好（喜欢/不喜欢某种风格）
- fact: 事实信息（品牌色、公司名、产品信息）
- lesson: 工作经验（某种方法效果好/不好）
- correction: 纠正（用户纠正了错误认知）

target说明：
- employee: 存入员工${employeeId}的个人记忆
- boss: 存入对老板的共享认知
- company: 存入企业画像

---
用户说：${userMessage}

AI回复：${aiResponse}
---

返回JSON数组（仅返回JSON，不要其他文字）：`;
}
