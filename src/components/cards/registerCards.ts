// 卡片批量注册 — 应用启动时调用一次
import { CardRegistry } from './CardRegistry';
import ArticleEditorCard from './templates/ArticleEditorCard';
import ContentOutlineCard from './templates/ContentOutlineCard';
import ContentCalendarCard from './templates/ContentCalendarCard';
import SocialPostCard from './templates/SocialPostCard';

let registered = false;

export function registerAllCards() {
  if (registered) return;
  registered = true;

  CardRegistry.register({
    name: 'article-editor',
    label: 'Article Editor',
    category: 'content',
    description: 'Edit articles with title, body, tags and platform preview',
    component: ArticleEditorCard,
  });

  CardRegistry.register({
    name: 'content-outline',
    label: 'Content Outline',
    category: 'content',
    description: 'Tree-style outline for reviewing and editing content structure',
    component: ContentOutlineCard,
  });

  CardRegistry.register({
    name: 'content-calendar',
    label: 'Content Calendar',
    category: 'content',
    description: 'Weekly calendar view for content planning and scheduling',
    component: ContentCalendarCard,
  });

  CardRegistry.register({
    name: 'social-post',
    label: 'Social Post',
    category: 'content',
    description: 'Social media post composer with image placeholders and hashtags',
    component: SocialPostCard,
  });
}
