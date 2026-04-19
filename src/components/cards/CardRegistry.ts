// 卡片注册表 — 平台级，跨员工共享
import type { CardTemplateInfo, CardProps } from './types';

class CardRegistryClass {
  private templates = new Map<string, CardTemplateInfo>();

  register(info: CardTemplateInfo) {
    this.templates.set(info.name, info);
  }

  get(name: string): CardTemplateInfo | undefined {
    return this.templates.get(name);
  }

  getAll(): CardTemplateInfo[] {
    return Array.from(this.templates.values());
  }

  getByCategory(category: CardTemplateInfo['category']): CardTemplateInfo[] {
    return this.getAll().filter((t) => t.category === category);
  }

  has(name: string): boolean {
    return this.templates.has(name);
  }
}

// 全局单例
export const CardRegistry = new CardRegistryClass();
