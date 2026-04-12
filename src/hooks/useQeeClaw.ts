import { useState, useEffect } from 'react';
import { qeeclawClient, globalRuntimeContext } from '../services/qeeclaw';

export function useQeeClawAgent(agentId: string) {
  const [loading, setLoading] = useState(false);

  // 发送消息
  const invokeModel = async (prompt: string, history?: any[]) => {
    setLoading(true);
    try {
      // 真实调用通常使用 invoke 或 conversations 模块
      // 这里以 models.invoke 演示
      const response = await qeeclawClient.models.invoke({
        model: "default", // 或者具体的模型名
        // @ts-ignore
        messages: [
          ...(history || []),
          { role: "user", content: prompt }
        ],
        // 如果有特定的 agent 绑定参数可以在这里传递
      });
      return response;
    } catch (error) {
      console.error("Invoke error:", error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  return {
    invokeModel,
    loading
  };
}
