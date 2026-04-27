// personaStore.ts — Unified persona + memory store for CENTAUR-HUBOS
// Replaces sparkMemoryStore.ts and xiaokeMemoryStore.ts
// Zustand v5 + persist middleware → localStorage key 'hubos-persona'
// OpenClaw-aligned v2

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// ─── Types ───────────────────────────────────────────────────────────

export interface MemoryEntry {
  id: string;
  content: string;
  source: 'auto' | 'manual' | 'onboarding' | 'conversation';
  category: 'preference' | 'fact' | 'lesson' | 'correction';
  target: 'memory' | 'user';
  confidence: number; // 0-1
  relatedTo?: string[];
  createdAt: string;
  updatedAt: string;
}

export interface PendingMemoryOperation {
  opId: string;
  employeeId: string;
  type: 'add' | 'delete';
  createdAt: string;
  entry?: MemoryEntry;
  memoryId?: string;
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
  charLimit: number;
}

export interface SystemLog {
  id: string;
  timestamp: string;
  action: 'memory_added' | 'memory_removed' | 'memory_updated' | 'soul_edited' | 'shared_updated' | 'initialized';
  employeeId?: string;
  detail: string;
}

export interface PersonaStats {
  totalMemories: number;
  totalChars: number;
  activeEmployees: number;
  todayAdded: number;
}

export interface TimelineEntry extends MemoryEntry {
  employeeId: string;
}

export interface GraphNode {
  id: string;
  type: 'employee' | 'memory' | 'category';
  label: string;
}

export interface GraphLink {
  source: string;
  target: string;
  type: string;
}

export interface GraphData {
  nodes: GraphNode[];
  links: GraphLink[];
}

export interface PersonaState {
  employees: Record<string, EmployeePersona>;
  shared: SharedKnowledge;
  logs: SystemLog[];
  pendingMemoryOps: PendingMemoryOperation[];

  // Employee persona actions
  getSoul: (employeeId: string) => string;
  setSoul: (employeeId: string, content: string) => void;
  getCachedMemories: (employeeId: string) => MemoryEntry[];
  replaceCachedMemories: (employeeId: string, entries: MemoryEntry[]) => void;
  addLocalMemory: (employeeId: string, entry: Omit<MemoryEntry, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateLocalMemory: (employeeId: string, memoryId: string, content: string) => void;
  removeLocalMemory: (employeeId: string, memoryId: string) => void;
  getMemories: (employeeId: string) => MemoryEntry[];
  replaceMemories: (employeeId: string, entries: MemoryEntry[]) => void;
  queuePendingMemoryAdd: (employeeId: string, entry: Omit<MemoryEntry, 'id' | 'createdAt' | 'updatedAt'>) => MemoryEntry | null;
  queuePendingMemoryDelete: (employeeId: string, memoryId: string) => void;
  getPendingMemoryOps: (employeeId: string) => PendingMemoryOperation[];
  resolvePendingMemoryOp: (opId: string) => void;
  addMemory: (employeeId: string, entry: Omit<MemoryEntry, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateMemory: (employeeId: string, memoryId: string, content: string) => void;
  removeMemory: (employeeId: string, memoryId: string) => void;
  getMemoryText: (employeeId: string) => string;

  // Shared knowledge actions
  getShared: () => SharedKnowledge;
  updateShared: (key: 'boss' | 'company' | 'team', content: string) => void;

  // System log
  getLogs: () => SystemLog[];
  appendSystemLog: (action: SystemLog['action'], detail: string, employeeId?: string) => void;

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

  // OpenClaw analytics
  getStats: () => PersonaStats;
  getTimeline: () => TimelineEntry[];
  getGraphData: () => GraphData;
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
      memoryCharLimit: employeeId === 'leader' ? 3000 : 2200,
    },
  };
}

function totalMemoryChars(memories: MemoryEntry[]): number {
  return memories.reduce((sum, m) => sum + m.content.length, 0);
}

function mergeWithPendingOperations(
  serverEntries: MemoryEntry[],
  pendingOps: PendingMemoryOperation[],
): MemoryEntry[] {
  const pendingDeleteIds = new Set(
    pendingOps
      .filter((op) => op.type === 'delete' && op.memoryId)
      .map((op) => op.memoryId as string),
  );

  const pendingAdds = pendingOps
    .filter((op): op is PendingMemoryOperation & { entry: MemoryEntry } => op.type === 'add' && Boolean(op.entry))
    .map((op) => op.entry);

  const merged = [
    ...serverEntries.filter((entry) => !pendingDeleteIds.has(entry.id)),
    ...pendingAdds,
  ];

  const unique = new Map<string, MemoryEntry>();
  for (const entry of merged) {
    unique.set(entry.id, entry);
  }

  return Array.from(unique.values()).sort(
    (left, right) => new Date(left.createdAt).getTime() - new Date(right.createdAt).getTime(),
  );
}

function isToday(isoString: string): boolean {
  const d = new Date(isoString);
  const t = new Date();
  return (
    d.getFullYear() === t.getFullYear() &&
    d.getMonth() === t.getMonth() &&
    d.getDate() === t.getDate()
  );
}

// ─── Default state ───────────────────────────────────────────────────

const DEFAULT_SHARED: SharedKnowledge = {
  boss: '',
  company: '',
  team: '',
  charLimit: 1375,
};

// ─── Store ───────────────────────────────────────────────────────────

export const usePersonaStore = create<PersonaState>()(
  persist(
    (set, get) => ({
      employees: {},
      shared: { ...DEFAULT_SHARED },
      logs: [],
      pendingMemoryOps: [],

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

      getCachedMemories: (employeeId: string): MemoryEntry[] => {
        const emp = get().employees[employeeId];
        return emp?.memories ?? [];
      },

      getMemories: (employeeId: string): MemoryEntry[] => {
        return get().getCachedMemories(employeeId);
      },

      replaceCachedMemories: (employeeId: string, entries: MemoryEntry[]): void => {
        set((s) => {
          const employees = ensureEmployee(s.employees, employeeId);
          const persona = employees[employeeId];
          const employeePendingOps = s.pendingMemoryOps.filter((op) => op.employeeId === employeeId);

          return {
            employees: {
              ...employees,
              [employeeId]: {
                ...persona,
                memories: mergeWithPendingOperations(entries, employeePendingOps),
              },
            },
          };
        });
      },

      replaceMemories: (employeeId: string, entries: MemoryEntry[]): void => {
        get().replaceCachedMemories(employeeId, entries);
      },

      queuePendingMemoryAdd: (
        employeeId: string,
        entry: Omit<MemoryEntry, 'id' | 'createdAt' | 'updatedAt'>,
      ): MemoryEntry | null => {
        let createdEntry: MemoryEntry | null = null;

        set((s) => {
          const employees = ensureEmployee(s.employees, employeeId);
          const persona = employees[employeeId];
          const currentChars = totalMemoryChars(persona.memories);

          if (currentChars + entry.content.length > persona.memoryCharLimit) {
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
          createdEntry = {
            ...entry,
            id: `pending-${generateId()}`,
            createdAt: timestamp,
            updatedAt: timestamp,
          };

          return {
            employees: {
              ...employees,
              [employeeId]: {
                ...persona,
                memories: [...persona.memories, createdEntry],
              },
            },
            pendingMemoryOps: [
              ...s.pendingMemoryOps,
              {
                opId: generateId(),
                employeeId,
                type: 'add',
                createdAt: timestamp,
                entry: createdEntry,
              },
            ],
            logs: appendLog(
              s.logs,
              'memory_added',
              `Memory queued locally for ${employeeId}: [${entry.category}] ${entry.content.slice(0, 60)}`,
              employeeId,
            ),
          };
        });

        return createdEntry;
      },

      queuePendingMemoryDelete: (employeeId: string, memoryId: string): void => {
        set((s) => {
          const persona = s.employees[employeeId];
          if (!persona) return s;

          const remainingOps = [...s.pendingMemoryOps];
          const pendingAddIndex = remainingOps.findIndex(
            (op) => op.employeeId === employeeId && op.type === 'add' && op.entry?.id === memoryId,
          );

          if (pendingAddIndex >= 0) {
            remainingOps.splice(pendingAddIndex, 1);
            return {
              employees: {
                ...s.employees,
                [employeeId]: {
                  ...persona,
                  memories: persona.memories.filter((memory) => memory.id !== memoryId),
                },
              },
              pendingMemoryOps: remainingOps,
              logs: appendLog(
                s.logs,
                'memory_removed',
                `Pending local memory ${memoryId} removed for ${employeeId}`,
                employeeId,
              ),
            };
          }

          const hasPendingDelete = remainingOps.some(
            (op) => op.employeeId === employeeId && op.type === 'delete' && op.memoryId === memoryId,
          );

          return {
            employees: {
              ...s.employees,
              [employeeId]: {
                ...persona,
                memories: persona.memories.filter((memory) => memory.id !== memoryId),
              },
            },
            pendingMemoryOps: hasPendingDelete
              ? remainingOps
              : [
                  ...remainingOps,
                  {
                    opId: generateId(),
                    employeeId,
                    type: 'delete',
                    createdAt: now(),
                    memoryId,
                  },
                ],
            logs: appendLog(
              s.logs,
              'memory_removed',
              `Memory queued for deletion for ${employeeId}: ${memoryId}`,
              employeeId,
            ),
          };
        });
      },

      getPendingMemoryOps: (employeeId: string): PendingMemoryOperation[] => {
        return get().pendingMemoryOps.filter((op) => op.employeeId === employeeId);
      },

      resolvePendingMemoryOp: (opId: string): void => {
        set((s) => ({
          pendingMemoryOps: s.pendingMemoryOps.filter((op) => op.opId !== opId),
        }));
      },

      addLocalMemory: (
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
              `Local memory cached for ${employeeId}: [${entry.category}] ${entry.content.slice(0, 60)}`,
              employeeId,
            ),
          };
        });
      },

      addMemory: (
        employeeId: string,
        entry: Omit<MemoryEntry, 'id' | 'createdAt' | 'updatedAt'>,
      ): void => {
        get().addLocalMemory(employeeId, entry);
      },

      updateLocalMemory: (employeeId: string, memoryId: string, content: string): void => {
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
              `Local memory cache updated for ${employeeId}: ${memoryId}`,
              employeeId,
            ),
          };
        });
      },

      updateMemory: (employeeId: string, memoryId: string, content: string): void => {
        get().updateLocalMemory(employeeId, memoryId, content);
      },

      removeLocalMemory: (employeeId: string, memoryId: string): void => {
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
              `Local memory cache removed for ${employeeId}: ${memoryId}`,
              employeeId,
            ),
          };
        });
      },

      removeMemory: (employeeId: string, memoryId: string): void => {
        get().removeLocalMemory(employeeId, memoryId);
      },

      getMemoryText: (employeeId: string): string => {
        const memories = get().getCachedMemories(employeeId);
        if (memories.length === 0) return '';
        return memories.map((m) => m.content).join('\n§\n');
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

      appendSystemLog: (action: SystemLog['action'], detail: string, employeeId?: string): void => {
        set((s) => ({
          logs: appendLog(s.logs, action, detail, employeeId),
        }));
      },

      // ── Full Context Assembly ──────────────────────────────────

      getFullContext: (employeeId: string) => {
        const state = get();
        const emp = state.employees[employeeId];
        return {
          soul: emp?.soul ?? '',
          memory: emp && emp.memories.length > 0
            ? emp.memories.map((m) => m.content).join('\n§\n')
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
                memoryCharLimit: employeeId === 'leader' ? 3000 : 2200,
              },
            },
            logs: appendLog(
              s.logs,
              'initialized',
              `Employee ${employeeId} initialized with default soul`,
              employeeId,
            ),
          };
        });
      },

      // ── OpenClaw Analytics ─────────────────────────────────────

      getStats: (): PersonaStats => {
        const state = get();
        const employeeIds = Object.keys(state.employees);
        let totalMemories = 0;
        let totalChars = 0;
        let todayAdded = 0;

        for (const id of employeeIds) {
          const emp = state.employees[id];
          totalMemories += emp.memories.length;
          totalChars += totalMemoryChars(emp.memories);
          todayAdded += emp.memories.filter((m) => isToday(m.createdAt)).length;
        }

        return {
          totalMemories,
          totalChars,
          activeEmployees: employeeIds.length,
          todayAdded,
        };
      },

      getTimeline: (): TimelineEntry[] => {
        const state = get();
        const all: TimelineEntry[] = [];

        for (const [employeeId, emp] of Object.entries(state.employees)) {
          for (const mem of emp.memories) {
            all.push({ ...mem, employeeId });
          }
        }

        // Sort newest first
        all.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
        return all;
      },

      getGraphData: (): GraphData => {
        const state = get();
        const nodes: GraphNode[] = [];
        const links: GraphLink[] = [];
        const categorySet = new Set<string>();

        for (const [employeeId, emp] of Object.entries(state.employees)) {
          // Employee node
          nodes.push({
            id: employeeId,
            type: 'employee',
            label: employeeId,
          });

          for (const mem of emp.memories) {
            // Memory node
            nodes.push({
              id: mem.id,
              type: 'memory',
              label: mem.content.slice(0, 40),
            });

            // Employee -> Memory link
            links.push({
              source: employeeId,
              target: mem.id,
              type: 'has_memory',
            });

            // Category node (deduplicated)
            if (!categorySet.has(mem.category)) {
              categorySet.add(mem.category);
              nodes.push({
                id: `cat:${mem.category}`,
                type: 'category',
                label: mem.category,
              });
            }

            // Memory -> Category link
            links.push({
              source: mem.id,
              target: `cat:${mem.category}`,
              type: 'categorized_as',
            });

            // relatedTo links
            if (mem.relatedTo) {
              for (const relId of mem.relatedTo) {
                links.push({
                  source: mem.id,
                  target: relId,
                  type: 'related_to',
                });
              }
            }
          }
        }

        return { nodes, links };
      },
    }),
    {
      name: 'hubos-persona',
    },
  ),
);
