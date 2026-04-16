import React, { useState } from 'react';
import { Send, User, Bot } from 'lucide-react';

export default function ChatArea() {
  const [input, setInput] = useState('');

  return (
    <div className="w-full h-full flex flex-col relative overflow-hidden">
      {/* 柔和背景光晕 */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
         <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-terracotta/5 blur-[100px]"></div>
      </div>

      {/* Header */}
      <div className="h-16 border-b border-border-cream flex items-center px-6 bg-ivory/60 backdrop-blur-md z-10">
        <div>
          <h2 className="text-near-black font-medium font-serif">架构师面谈区</h2>
          <p className="text-xs text-stone-gray">正在与 Spark (火花) 对话</p>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6 z-10">
        <div className="flex gap-4">
          <div className="w-8 h-8 rounded-full bg-warm-sand flex items-center justify-center shrink-0">
             <User className="w-4 h-4 text-stone-gray" />
          </div>
          <div className="bg-warm-sand rounded-2xl rounded-tl-sm p-4 text-sm text-near-black max-w-[80%]">
            你好，Spark。我们需要准备下半年的品牌物料。
          </div>
        </div>

        <div className="flex gap-4 flex-row-reverse">
          <div className="w-8 h-8 rounded-full bg-terracotta/15 border border-terracotta/25 flex items-center justify-center shrink-0">
             <Bot className="w-4 h-4 text-terracotta" />
          </div>
          <div className="bg-terracotta/10 border border-terracotta/15 rounded-2xl rounded-tr-sm p-4 text-sm text-near-black max-w-[80%]">
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
            className="input-warm w-full rounded-xl py-3 pl-4 pr-12 text-sm focus:border-terracotta/50 transition-colors"
          />
          <button className="absolute right-2 p-2 bg-terracotta hover:bg-coral text-ivory rounded-lg transition-colors">
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
