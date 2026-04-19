// flows/index.ts — 流程注册表
// 集中导出所有 Harness 流程定义，供引擎按 id 查找

export { SPARK_ARTICLE_FLOW } from './spark-article';
export type { FlowDefinition, FlowStep, StepType } from './spark-article';
export { mapOutlineData, mapArticleData } from './data-mappers';
export type { OutlineData, OutlineItem, ArticleData } from './data-mappers';

// ---------------------------------------------------------------------------
// FLOWS_REGISTRY — 按流程 id 索引的全局注册表
// ---------------------------------------------------------------------------
import { SPARK_ARTICLE_FLOW } from './spark-article';
import type { FlowDefinition } from './spark-article';

export const FLOWS_REGISTRY: Map<string, FlowDefinition> = new Map([
  [SPARK_ARTICLE_FLOW.id, SPARK_ARTICLE_FLOW],
]);

// ---------------------------------------------------------------------------
// DATA_MAPPERS — 按名称索引的数据映射函数注册表
// confirm 类型步骤通过 dataMapper 字段引用这些函数
// ---------------------------------------------------------------------------
import { mapOutlineData, mapArticleData } from './data-mappers';

export const DATA_MAPPERS: Record<string, (aiResponse: string) => any> = {
  mapOutlineData,
  mapArticleData,
};
