import React, { useState } from 'react';
import { agentRegistry } from './gateway/auth';
import { Server, Users, Key, Zap, ShieldAlert, Cpu } from 'lucide-react';

export default function App() {
  const [agents, setAgents] = useState(agentRegistry);

  return (
    <div className="min-h-screen bg-[#0A0C10] text-slate-300 font-sans p-8 select-none">
      <header className="mb-10 border-b border-slate-800 pb-6 flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold text-white flex items-center gap-3">
            <Server className="w-8 h-8 text-blue-500" />
            Centaur Hub OS
            <span className="text-xs font-mono bg-blue-500/10 text-blue-400 border border-blue-500/20 px-2 py-0.5 rounded-full">v3.0 Edge</span>
          </h1>
          <p className="text-slate-500 mt-2 text-sm">企业级数字员工中枢 · 算力网关控制台</p>
        </div>
        <div className="text-right">
          <div className="text-xs text-slate-500 mb-1">Device_Key</div>
          <div className="font-mono text-xs text-slate-400 bg-slate-900 px-3 py-1 rounded border border-slate-800">
            dk_fc8a9...b41
          </div>
        </div>
      </header>

      {/* 算力与网关监控 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
        <div className="bg-[#11141A] border border-slate-800/60 rounded-2xl p-6 shadow-xl">
          <div className="flex items-center gap-3 mb-4 text-emerald-400">
            <Cpu className="w-5 h-5" /> <h3 className="font-medium text-sm">整机剩余电量 (Credits)</h3>
          </div>
          <div className="text-4xl font-bold text-white mb-2">
            864,200 <span className="text-xs text-slate-500 font-normal">Tokens</span>
          </div>
          <div className="w-full bg-slate-800/50 rounded-full h-1.5 mt-4">
            <div className="bg-emerald-500 h-1.5 rounded-full" style={{width: '75%'}}></div>
          </div>
        </div>

        <div className="bg-[#11141A] border border-slate-800/60 rounded-2xl p-6 shadow-xl">
          <div className="flex items-center gap-3 mb-4 text-purple-400">
            <Users className="w-5 h-5" /> <h3 className="font-medium text-sm">在线沙盒 Agents</h3>
          </div>
          <div className="text-4xl font-bold text-white mb-2">
            {agents.length} <span className="text-xs text-slate-500 font-normal">个数字员工</span>
          </div>
          <p className="text-xs text-slate-500 mt-4 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-purple-500 animate-pulse"></span> Event Bus 路由正常
          </p>
        </div>

        <div className="bg-[#11141A] border border-slate-800/60 rounded-2xl p-6 shadow-xl">
          <div className="flex items-center gap-3 mb-4 text-rose-400">
            <ShieldAlert className="w-5 h-5" /> <h3 className="font-medium text-sm">网关安全拦截</h3>
          </div>
          <div className="text-4xl font-bold text-white mb-2">
            12 <span className="text-xs text-slate-500 font-normal">次越权调用拦截</span>
          </div>
          <p className="text-xs text-rose-500/80 mt-4">基于 Agent_Key 权限隔离保护中</p>
        </div>
      </div>

      <div className="flex justify-between items-center mb-6 mt-12">
        <h2 className="text-xl font-semibold text-white">沙盒隔离区 (Sandboxed Agents)</h2>
        <button className="bg-blue-600 hover:bg-blue-500 text-white text-sm px-4 py-2 rounded-lg transition-colors shadow-lg shadow-blue-500/20">
          + 安装新数字员工
        </button>
      </div>

      {/* 数字员工列表 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {agents.map(a => (
          <div key={a.id} className="bg-[#11141A] border border-slate-800 rounded-2xl p-6 relative overflow-hidden group hover:border-slate-700 transition-colors">
            <h3 className="text-lg font-bold text-white mb-1 flex items-center gap-2">
              {a.name}
              <span className="text-[10px] bg-slate-800 text-slate-400 px-2 py-0.5 rounded uppercase tracking-wider">Active</span>
            </h3>
            <p className="text-xs text-slate-500 mb-6 font-mono border-b border-slate-800/50 pb-4">沙盒实例 ID: {a.id}</p>
            
            <div className="space-y-3">
              <div className="flex items-center justify-between bg-[#0A0C10] p-3 rounded-lg border border-slate-800/50">
                <span className="flex items-center gap-2 text-xs text-slate-400"><Key className="w-3.5 h-3.5"/> 对内接口凭证 (Agent_Key)</span>
                <span className="font-mono text-emerald-400 text-xs bg-emerald-400/10 border border-emerald-500/20 px-2 py-1 rounded select-all cursor-text">{a.key}</span>
              </div>
              <div className="flex items-center justify-between bg-[#0A0C10] p-3 rounded-lg border border-slate-800/50">
                <span className="flex items-center gap-2 text-xs text-slate-400"><Zap className="w-3.5 h-3.5"/> 算力预算 (Quota)</span>
                <span className="text-blue-400 text-xs font-medium bg-blue-500/10 px-2 py-1 rounded">{a.quota}% 本机算力池</span>
              </div>
            </div>
            
            <div className="mt-6 flex gap-3">
              <button className="flex-1 bg-slate-800/50 hover:bg-slate-700 text-slate-300 px-4 py-2 rounded-lg text-xs transition border border-slate-700/50">配置工具权限</button>
              <button className="flex-1 bg-slate-800/50 hover:bg-slate-700 text-slate-300 px-4 py-2 rounded-lg text-xs transition border border-slate-700/50">清空私有知识库</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
