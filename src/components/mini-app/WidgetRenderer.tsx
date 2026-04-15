// Mini App - Widget 渲染路由器
// 根据 widget.type 分发到对应组件
import type { WidgetConfig } from '../../types/mini-app';
import ChatPanel from './widgets/ChatPanel';
import DataTable from './widgets/DataTable';
import DataList from './widgets/DataList';
import DynamicForm from './widgets/DynamicForm';
import StatCards from './widgets/StatCards';
import TabsPanel from './widgets/TabsPanel';
import {
  Card, Progress, TagCloud, Timeline,
  ButtonGroup, MarkdownBlock, Empty,
} from './widgets/SmallWidgets';

interface Props {
  widget: WidgetConfig;
  dataStore: Record<string, unknown>;
  onAction: (actionId: string, payload?: unknown) => void;
  chatProps?: {
    messages: { role: 'user' | 'ai'; content: string }[];
    onSend: (msg: string) => void;
    isLoading: boolean;
  };
}

export default function WidgetRenderer({ widget, dataStore, onAction, chatProps }: Props) {
  if (widget.visible === false) return null;

  // 从 dataStore 取绑定数据
  const boundData = widget.bindDataSource
    ? (dataStore[widget.bindDataSource] as Record<string, unknown>[] | undefined)
    : undefined;

  switch (widget.type) {
    case 'chat':
      if (!chatProps) return null;
      return (
        <ChatPanel
          config={widget}
          messages={chatProps.messages}
          onSend={chatProps.onSend}
          isLoading={chatProps.isLoading}
        />
      );

    case 'table':
      return (
        <DataTable
          config={widget}
          data={(boundData as Record<string, unknown>[]) || widget.data || []}
        />
      );

    case 'list':
      return (
        <DataList
          config={widget}
          data={(boundData as Record<string, unknown>[]) || widget.data || []}
        />
      );

    case 'form':
      return (
        <DynamicForm
          config={widget}
          onSubmit={(data) => onAction(widget.onSubmitAction || 'form_submit', data)}
        />
      );

    case 'stat':
      return <StatCards config={widget} />;

    case 'tabs':
      return (
        <TabsPanel
          config={widget}
          dataStore={dataStore}
          onAction={onAction}
          chatProps={chatProps}
        />
      );

    case 'card':
      return (
        <Card
          config={widget}
          dataStore={dataStore}
          onAction={onAction}
          chatProps={chatProps}
        />
      );

    case 'progress':
      return <Progress config={widget} />;

    case 'tag-cloud':
      return <TagCloud config={widget} />;

    case 'timeline':
      return <Timeline config={widget} />;

    case 'button-group':
      return <ButtonGroup config={widget} onAction={onAction} />;

    case 'markdown':
      return <MarkdownBlock config={widget} />;

    case 'empty':
      return <Empty config={widget} onAction={onAction} />;

    default:
      return (
        <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-xs text-red-400">
          未知组件类型: {(widget as { type: string }).type}
        </div>
      );
  }
}
