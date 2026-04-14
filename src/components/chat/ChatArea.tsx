import React, { useState } from 'react';
import { Send, User, Bot } from 'lucide-react';

export default function ChatArea() {
  const [input, setInput] = useState('');

  return (
    <div className="w-full h-full bg-[#11141A] flex flex-col relative overflow-hidden">
      {/* 磨砂玻璃背景特效 */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
         <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-orange-500/5 blur-[100px]"></div>
      </div>

      {/* Header */}
      <div className="h-16 border-b border-slate-800 flex items-center px-6 backdrop-blur-md bg-[#11141A]/80 z-10">
        <div>
          <h2 className="text-white font-medium">架构师面谈区</h2>
          <p className="text-xs text-slate-500">正在与 Spark (火花) 对话</p>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6 z-10">
        <div className="flex gap-4">
          <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center shrink-0">
             <User className="w-4 h-4 text-slate-400" />
          </div>
          <div className="bg-slate-800/50 rounded-2xl rounded-tl-sm p-4 text-sm text-slate-300 max-w-[80%]">
            你好，Spark。我们需要准备下半年的品牌物料。
          </div>
        </div>

        <div className="flex gap-4 flex-row-reverse">
          <div className="w-8 h-8 rounded-full bg-orange-500/20 border border-orange-500/30 flex items-center justify-center shrink-0">
             <Bot className="w-4 h-4 text-orange-500" />
          </div>
          <div className="bg-orange-500/10 border border-orange-500/20 rounded-2xl rounded-tr-sm p-4 text-sm text-slate-200 max-w-[80%] backdrop-blur-sm">
            收到，老板。我已经准备好了。您想先看品牌海报还是重新梳理下产品定位手册？
          </div>
        </div>
      </div>

      {/* Input */}
      <div className="p-6 pt-2 z-10">
        <div className="relative flex items-center">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="输入对话内容..."
            className="w-full bg-[#0A0C10] border border-slate-700 rounded-xl py-3 pl-4 pr-12 text-sm text-white focus:outline-none focus:border-orange-500/50 transition-colors placeholder-slate-600"
          />
          <button className="absolute right-2 p-2 bg-orange-500 hover:bg-orange-400 text-white rounded-lg transition-colors">
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
