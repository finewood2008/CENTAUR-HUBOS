import React, { useState, useEffect } from 'react';
import { FileText, Image as ImageIcon, Layout } from 'lucide-react';
import { lettaClient, initializeSpark, type LettaAgent } from '../../services/letta';

export default function Workspace() {
  const [activeTab, setActiveTab] = useState<'soul' | 'design' | 'brand'>('soul');
  const [sparkMemory, setSparkMemory] = useState<LettaAgent | null>(null);

  useEffect(() => {
    initializeSpark().then(id => {
        lettaClient.getAgentMemory(id).then(memory => {
            setSparkMemory(memory);
        });
    });
  }, []);

  return (
    <div className="w-full h-full bg-[#0A0C10] border-l border-slate-800 flex flex-col">
      <div className="h-16 border-b border-slate-800 flex items-center px-6 gap-6">
        <button 
            className={`font-medium text-sm h-full flex items-center gap-2 transition-colors ${activeTab === 'soul' ? 'text-orange-500 border-b-2 border-orange-500' : 'text-slate-500 hover:text-slate-300'}`}
            onClick={() => setActiveTab('soul')}
        >
           <FileText className="w-4 h-4" /> 员工档案 (SOUL)
        </button>
        <button 
            className={`font-medium text-sm h-full flex items-center gap-2 transition-colors ${activeTab === 'design' ? 'text-orange-500 border-b-2 border-orange-500' : 'text-slate-500 hover:text-slate-300'}`}
            onClick={() => setActiveTab('design')}
        >
           <ImageIcon className="w-4 h-4" /> 设计草稿
        </button>
         <button 
            className={`font-medium text-sm h-full flex items-center gap-2 transition-colors ${activeTab === 'brand' ? 'text-orange-500 border-b-2 border-orange-500' : 'text-slate-500 hover:text-slate-300'}`}
            onClick={() => setActiveTab('brand')}
        >
           <Layout className="w-4 h-4" /> 品牌库 (BRAND)
        </button>
      </div>

      <div className="flex-1 p-6 overflow-y-auto">
        {activeTab === 'soul' && (
            <div className="bg-[#11141A] border border-slate-800 rounded-xl p-6 font-mono text-xs text-slate-400 whitespace-pre-wrap">
              <div className="flex items-center justify-between mb-4 pb-4 border-b border-slate-800/50">
                 <span className="text-slate-300 font-bold">SOUL.md - Spark (火花)</span>
                 <span className="bg-orange-500/10 text-orange-500 px-2 py-1 rounded">Letta Persona Block</span>
              </div>
              {sparkMemory ? sparkMemory.personaBlock : 'Loading...'}
            </div>
        )}
        {activeTab === 'brand' && (
            <div className="bg-[#11141A] border border-slate-800 rounded-xl p-6 font-mono text-xs text-slate-400 whitespace-pre-wrap">
              <div className="flex items-center justify-between mb-4 pb-4 border-b border-slate-800/50">
                 <span className="text-slate-300 font-bold">BRAND.md</span>
                 <span className="bg-blue-500/10 text-blue-500 px-2 py-1 rounded">Letta Human Block</span>
              </div>
              {sparkMemory ? sparkMemory.humanBlock : 'Loading...'}
            </div>
        )}
        {activeTab === 'design' && (
             <div className="flex flex-col items-center justify-center h-full text-slate-500 space-y-4">
                 <ImageIcon className="w-12 h-12 opacity-20" />
                 <p className="text-sm">等待 Spark 生成设计稿...</p>
             </div>
        )}
      </div>
    </div>
  );
}
