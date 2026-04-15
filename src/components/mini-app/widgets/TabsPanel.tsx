// Mini App Widget: Tabs 切换
import { useState } from 'react';
import type { TabsWidget as TabsWidgetConfig } from '../../../types/mini-app';
import WidgetRenderer from '../WidgetRenderer';

interface Props {
  config: TabsWidgetConfig;
  dataStore: Record<string, unknown>;
  onAction: (actionId: string, payload?: unknown) => void;
  chatProps?: {
    messages: { role: 'user' | 'ai'; content: string }[];
    onSend: (msg: string) => void;
    isLoading: boolean;
  };
}

export default function TabsPanel({ config, dataStore, onAction, chatProps }: Props) {
  const [activeTab, setActiveTab] = useState(config.defaultTab || config.items[0]?.key || '');

  const current = config.items.find((t) => t.key === activeTab);

  return (
    <div className="space-y-3">
      {/* Tab 头 */}
      <div className="flex gap-1 border-b border-white/5 pb-0">
        {config.items.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-3 py-2 text-xs transition-colors border-b-2 -mb-px ${
              activeTab === tab.key
                ? 'text-orange-400 border-orange-400'
                : 'text-gray-500 border-transparent hover:text-gray-300'
            }`}
          >
            {tab.icon && <span className="mr-1">{tab.icon}</span>}
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab 内容 */}
      {current && (
        <div>
          {current.children.map((widget) => (
            <WidgetRenderer
              key={widget.id}
              widget={widget}
              dataStore={dataStore}
              onAction={onAction}
              chatProps={chatProps}
            />
          ))}
        </div>
      )}
    </div>
  );
}
