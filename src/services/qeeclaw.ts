// Mock QeeClaw Client for now since the local paths failed
export const qeeclawClient = {
  models: {
    listAvailable: async () => ["default", "gemini-pro"],
    invoke: async (params: any) => ({ content: "Mock response" })
  },
  memory: {
    store: async (params: any) => ({ success: true })
  }
};

export const globalRuntimeContext = {
  teamId: 1,
  runtimeType: "hermes" as const,
};

export async function checkConnection() {
  return { connected: true, models: ["default", "gemini-pro"] };
}

export async function storeAgentMemory(agentId: string, content: string, category: string = "system") {
  return { success: true };
}
