import { usePersonaStore } from '../../stores/personaStore';

export type SharedContextKey = 'boss' | 'company' | 'team';

export function useSharedContext() {
  const shared = usePersonaStore((state) => state.shared);
  const updateShared = usePersonaStore((state) => state.updateShared);

  return {
    shared,
    updateSharedContext: (key: SharedContextKey, content: string) => updateShared(key, content),
  };
}