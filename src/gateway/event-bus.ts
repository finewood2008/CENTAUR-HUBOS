// 多智能体协作的底层事件总线
type EventHandler = (payload: any) => void;

class EventBus {
  private listeners: Record<string, EventHandler[]> = {};

  subscribe(event: string, handler: EventHandler) {
    if (!this.listeners[event]) this.listeners[event] = [];
    this.listeners[event].push(handler);
  }

  publish(event: string, payload: any) {
    console.log(`[EventBus] 发送事件: ${event}`, payload);
    if (this.listeners[event]) {
      this.listeners[event].forEach(h => h(payload));
    }
  }
}

export const eventBus = new EventBus();
