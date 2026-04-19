import { useCallback, useRef } from 'react';
import type { ChatMsg } from '../components/chat-engine/types';

const MAX_MESSAGES = 100;
const DEBOUNCE_MS = 500;
const MAX_FIELD_LEN = 5000;

function storageKey(employeeId: string): string {
  return `hubos-chat-${employeeId}`;
}

/** 深拷贝消息并截断 card.data 中超长字段 */
function sanitize(msgs: ChatMsg[]): ChatMsg[] {
  const recent = msgs.slice(-MAX_MESSAGES);
  return recent.map((msg) => {
    if (!msg.card?.data) return { ...msg };
    const cleanedData: Record<string, any> = {};
    for (const [k, v] of Object.entries(msg.card.data)) {
      if (typeof v === 'string' && v.length > MAX_FIELD_LEN) {
        cleanedData[k] = v.slice(0, MAX_FIELD_LEN) + '…';
      } else {
        cleanedData[k] = v;
      }
    }
    return {
      ...msg,
      card: { ...msg.card, data: cleanedData },
    };
  });
}

export function useChatPersistence(employeeId: string) {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const loadMessages = useCallback((): ChatMsg[] => {
    try {
      const raw = localStorage.getItem(storageKey(employeeId));
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }, [employeeId]);

  const saveImmediate = useCallback(
    (msgs: ChatMsg[]) => {
      try {
        const cleaned = sanitize(msgs);
        localStorage.setItem(storageKey(employeeId), JSON.stringify(cleaned));
      } catch {
        // localStorage quota exceeded or unavailable — silently ignore
      }
    },
    [employeeId],
  );

  const saveMessages = useCallback(
    (msgs: ChatMsg[]) => {
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => {
        saveImmediate(msgs);
        timerRef.current = null;
      }, DEBOUNCE_MS);
    },
    [saveImmediate],
  );

  return { saveMessages, loadMessages };
}
