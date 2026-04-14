import React from 'react';
import Roster from './components/roster/Roster';
import ChatArea from './components/chat/ChatArea';
import Workspace from './components/workspace/Workspace';

export default function App() {
  return (
    <div className="w-screen h-screen bg-[#0A0C10] text-slate-300 font-sans flex overflow-hidden select-none">
      {/* 比例调整： 1 : 2 : 1.5 左右 */}
      <div className="w-[20%] min-w-[240px] max-w-[320px]">
        <Roster />
      </div>
      
      <div className="flex-1 min-w-[400px]">
        <ChatArea />
      </div>

      <div className="w-[35%] min-w-[360px] max-w-[500px]">
        <Workspace />
      </div>
    </div>
  );
}
