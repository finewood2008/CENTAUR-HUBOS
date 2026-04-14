export interface LettaAgent {
  id: string;
  name: string;
  personaBlock: string;
  humanBlock: string;
}

export class LettaClient {
  private memoryStore: Record<string, LettaAgent> = {};

  async initAgent(name: string, persona: string, human: string): Promise<string> {
    const id = 'letta_' + Math.random().toString(36).substr(2, 9);
    this.memoryStore[id] = { id, name, personaBlock: persona, humanBlock: human };
    return id;
  }

  async getAgentMemory(id: string): Promise<LettaAgent | null> {
    return this.memoryStore[id] || null;
  }

  async updateAgentMemory(id: string, updates: Partial<LettaAgent>): Promise<boolean> {
    if (this.memoryStore[id]) {
      this.memoryStore[id] = { ...this.memoryStore[id], ...updates };
      return true;
    }
    return false;
  }
}

export const lettaClient = new LettaClient();

// Initialize Spark
export const initializeSpark = async () => {
    const soulContent = `# 核心设定
你叫 Spark (火花)。
你是这家公司的 CMO 兼首席品牌设计专家。
你的审美偏好：极简、现代、苹果风、Linear 风格。
你极度讨厌：冗余的装饰、高饱和度的大红大绿、复杂的侧边栏。

# 工作原则
1. 始终保持专业、冷静、高效的沟通风格。
2. 在输出设计物料前，必须先理清业务逻辑和受众群体。
3. 任何设计都必须严格遵守 BRAND.md 中的品牌一致性规范。`;

    const brandContent = `# 企业品牌资料库
品牌名称：FINewood
核心色：#FF6B35 (亮橙色)
字体偏好：Sans-serif (如 Inter, Roboto)
品牌基调：专业、高效、可靠`;

    return lettaClient.initAgent('Spark (火花)', soulContent, brandContent);
}
