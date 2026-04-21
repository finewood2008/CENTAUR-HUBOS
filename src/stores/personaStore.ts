// personaStore.ts — Unified persona + memory store for CENTAUR-HUBOS
// Replaces sparkMemoryStore.ts and xiaokeMemoryStore.ts
// Zustand v5 + persist middleware → localStorage key 'hubos-persona'

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// ─── Types ───────────────────────────────────────────────────────────

export interface MemoryEntry {
  id: string;
  content: string;
  source: 'auto' | 'manual' | 'onboarding';
  category: 'preference' | 'fact' | 'lesson' | 'correction';
  createdAt: string;
  updatedAt: string;
}

export interface EmployeePersona {
  employeeId: string;
  soul: string;
  memories: MemoryEntry[];
  memoryCharLimit: number;
}

export interface SharedKnowledge {
  boss: string;
  company: string;
  team: string;
}

export interface SystemLog {
  id: string;
  timestamp: string;
  action: 'memory_added' | 'memory_removed' | 'memory_updated' | 'soul_edited' | 'shared_updated';
  employeeId?: string;
  detail: string;
}

export interface PersonaState {
  employees: Record<string, EmployeePersona>;
  shared: SharedKnowledge;
  logs: SystemLog[];

  // Employee persona actions
  getSoul: (employeeId: string) => string;
  setSoul: (employeeId: string, content: string) => void;
  getMemories: (employeeId: string) => MemoryEntry[];
  addMemory: (employeeId: string, entry: Omit<MemoryEntry, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateMemory: (employeeId: string, memoryId: string, content: string) => void;
  removeMemory: (employeeId: string, memoryId: string) => void;
  getMemoryText: (employeeId: string) => string;

  // Shared knowledge actions
  getShared: () => SharedKnowledge;
  updateShared: (key: 'boss' | 'company' | 'team', content: string) => void;

  // System log
  getLogs: () => SystemLog[];

  // Full context assembly (for prompt building)
  getFullContext: (employeeId: string) => {
    soul: string;
    memory: string;
    boss: string;
    company: string;
    team: string;
  };

  // Init with default data if empty
  initializeEmployee: (employeeId: string, defaultSoul: string) => void;
}

// ─── Helpers ─────────────────────────────────────────────────────────

const generateId = (): string =>
  Date.now().toString(36) + Math.random().toString(36).slice(2, 8);

const now = (): string => new Date().toISOString();

const MAX_LOGS = 100;

function appendLog(
  logs: SystemLog[],
  action: SystemLog['action'],
  detail: string,
  employeeId?: string,
): SystemLog[] {
  const entry: SystemLog = {
    id: generateId(),
    timestamp: now(),
    action,
    employeeId,
    detail,
  };
  const next = [...logs, entry];
  // FIFO cap at MAX_LOGS
  if (next.length > MAX_LOGS) {
    return next.slice(next.length - MAX_LOGS);
  }
  return next;
}

function ensureEmployee(
  employees: Record<string, EmployeePersona>,
  employeeId: string,
): Record<string, EmployeePersona> {
  if (employees[employeeId]) return employees;
  return {
    ...employees,
    [employeeId]: {
      employeeId,
      soul: '',
      memories: [],
      memoryCharLimit: 2000,
    },
  };
}

function totalMemoryChars(memories: MemoryEntry[]): number {
  return memories.reduce((sum, m) => sum + m.content.length, 0);
}

// ─── Default state ───────────────────────────────────────────────────

const DEFAULT_SHARED: SharedKnowledge = {
  boss: '',
  company: '',
  team: '',
};

// ─── Store ───────────────────────────────────────────────────────────

export const usePersonaStore = create<PersonaState>()(
  persist(
    (set, get) => ({
      employees: {},
      shared: { ...DEFAULT_SHARED },
      logs: [],

      // ── Soul ────────────────────────────────────────────────────

      getSoul: (employeeId: string): string => {
        const emp = get().employees[employeeId];
        return emp?.soul ?? '';
      },

      setSoul: (employeeId: string, content: string): void => {
        set((s) => {
          const employees = ensureEmployee(s.employees, employeeId);
          return {
            employees: {
              ...employees,
              [employeeId]: {
                ...employees[employeeId],
                soul: content,
              },
            },
            logs: appendLog(s.logs, 'soul_edited', `Soul updated for ${employeeId}`, employeeId),
          };
        });
      },

      // ── Memories ────────────────────────────────────────────────

      getMemories: (employeeId: string): MemoryEntry[] => {
        const emp = get().employees[employeeId];
        return emp?.memories ?? [];
      },

      addMemory: (
        employeeId: string,
        entry: Omit<MemoryEntry, 'id' | 'createdAt' | 'updatedAt'>,
      ): void => {
        set((s) => {
          const employees = ensureEmployee(s.employees, employeeId);
          const persona = employees[employeeId];
          const currentChars = totalMemoryChars(persona.memories);

          // Respect char limit — reject if adding would exceed
          if (currentChars + entry.content.length > persona.memoryCharLimit) {
            // Still log the attempt, but don't add the memory
            return {
              logs: appendLog(
                s.logs,
                'memory_added',
                `REJECTED: Memory for ${employeeId} would exceed char limit (${currentChars + entry.content.length}/${persona.memoryCharLimit})`,
                employeeId,
              ),
            };
          }

          const timestamp = now();
          const newEntry: MemoryEntry = {
            ...entry,
            id: generateId(),
            createdAt: timestamp,
            updatedAt: timestamp,
          };

          return {
            employees: {
              ...employees,
              [employeeId]: {
                ...persona,
                memories: [...persona.memories, newEntry],
              },
            },
            logs: appendLog(
              s.logs,
              'memory_added',
              `Memory added for ${employeeId}: [${entry.category}] ${entry.content.slice(0, 60)}`,
              employeeId,
            ),
          };
        });
      },

      updateMemory: (employeeId: string, memoryId: string, content: string): void => {
        set((s) => {
          const persona = s.employees[employeeId];
          if (!persona) return s;

          const memIdx = persona.memories.findIndex((m) => m.id === memoryId);
          if (memIdx < 0) return s;

          const oldMemory = persona.memories[memIdx];
          const otherChars = totalMemoryChars(
            persona.memories.filter((m) => m.id !== memoryId),
          );

          // Respect char limit for updated content
          if (otherChars + content.length > persona.memoryCharLimit) {
            return {
              logs: appendLog(
                s.logs,
                'memory_updated',
                `REJECTED: Updated memory for ${employeeId} would exceed char limit`,
                employeeId,
              ),
            };
          }

          const updatedMemories = [...persona.memories];
          updatedMemories[memIdx] = {
            ...oldMemory,
            content,
            updatedAt: now(),
          };

          return {
            employees: {
              ...s.employees,
              [employeeId]: {
                ...persona,
                memories: updatedMemories,
              },
            },
            logs: appendLog(
              s.logs,
              'memory_updated',
              `Memory ${memoryId} updated for ${employeeId}`,
              employeeId,
            ),
          };
        });
      },

      removeMemory: (employeeId: string, memoryId: string): void => {
        set((s) => {
          const persona = s.employees[employeeId];
          if (!persona) return s;

          return {
            employees: {
              ...s.employees,
              [employeeId]: {
                ...persona,
                memories: persona.memories.filter((m) => m.id !== memoryId),
              },
            },
            logs: appendLog(
              s.logs,
              'memory_removed',
              `Memory ${memoryId} removed for ${employeeId}`,
              employeeId,
            ),
          };
        });
      },

      getMemoryText: (employeeId: string): string => {
        const emp = get().employees[employeeId];
        if (!emp || emp.memories.length === 0) return '';
        return emp.memories.map((m) => m.content).join(' § ');
      },

      // ── Shared Knowledge ───────────────────────────────────────

      getShared: (): SharedKnowledge => {
        return get().shared;
      },

      updateShared: (key: 'boss' | 'company' | 'team', content: string): void => {
        set((s) => ({
          shared: {
            ...s.shared,
            [key]: content,
          },
          logs: appendLog(
            s.logs,
            'shared_updated',
            `Shared knowledge [${key}] updated (${content.length} chars)`,
          ),
        }));
      },

      // ── System Logs ────────────────────────────────────────────

      getLogs: (): SystemLog[] => {
        return get().logs;
      },

      // ── Full Context Assembly ──────────────────────────────────

      getFullContext: (employeeId: string) => {
        const state = get();
        const emp = state.employees[employeeId];
        return {
          soul: emp?.soul ?? '',
          memory: emp && emp.memories.length > 0
            ? emp.memories.map((m) => m.content).join(' § ')
            : '',
          boss: state.shared.boss,
          company: state.shared.company,
          team: state.shared.team,
        };
      },

      // ── Initialize Employee ────────────────────────────────────

      initializeEmployee: (employeeId: string, defaultSoul: string): void => {
        set((s) => {
          // Don't overwrite existing employee
          if (s.employees[employeeId]) return s;

          return {
            employees: {
              ...s.employees,
              [employeeId]: {
                employeeId,
                soul: defaultSoul,
                memories: [],
                memoryCharLimit: 2000,
              },
            },
            logs: appendLog(
              s.logs,
              'soul_edited',
              `Employee ${employeeId} initialized with default soul`,
              employeeId,
            ),
          };
        });
      },
    }),
    {
      name: 'hubos-persona',
    },
  ),
);
