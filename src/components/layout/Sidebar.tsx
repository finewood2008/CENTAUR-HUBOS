// Hub OS - 侧边导航栏
import { LayoutDashboard, Users, Radio, Database, Settings } from 'lucide-react';
import { motion } from 'framer-motion';
import type { NavTab } from '../../types';

const navItems: { key: NavTab; icon: typeof LayoutDashboard; label: string }[] = [
  { key: 'dashboard', icon: LayoutDashboard, label: '控制台' },
  { key: 'agents', icon: Users, label: '员工' },
  { key: 'channels', icon: Radio, label: '通讯' },
  { key: 'knowledge', icon: Database, label: '知识库' },
];

interface SidebarProps {
  active: NavTab;
  onNav: (tab: NavTab) => void;
}

export default function Sidebar({ active, onNav }: SidebarProps) {
  return (
    <div className="w-[68px] h-full bg-gray-950 flex flex-col items-center py-5 gap-1 border-r border-white/5">
      {/* Logo */}
      <div className="mb-6 flex flex-col items-center">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-amber-500 flex items-center justify-center text-lg font-bold text-white shadow-lg shadow-orange-500/20">
          H
        </div>
        <span className="text-[9px] text-gray-500 mt-1 tracking-widest">HUB OS</span>
      </div>

      {/* Nav */}
      {navItems.map((item) => {
        const isActive = active === item.key;
        const Icon = item.icon;
        return (
          <button
            key={item.key}
            onClick={() => onNav(item.key)}
            className="relative w-12 h-12 flex flex-col items-center justify-center rounded-xl transition-colors group"
          >
            {isActive && (
              <motion.div
                layoutId="nav-pill"
                className="absolute inset-0 bg-orange-500/15 rounded-xl border border-orange-500/20"
                transition={{ type: 'spring', stiffness: 350, damping: 30 }}
              />
            )}
            <Icon
              size={20}
              className={isActive ? 'text-orange-400 relative z-10' : 'text-gray-500 group-hover:text-gray-300 relative z-10'}
            />
            <span
              className={`text-[9px] mt-0.5 relative z-10 ${isActive ? 'text-orange-400' : 'text-gray-600 group-hover:text-gray-400'}`}
            >
              {item.label}
            </span>
          </button>
        );
      })}

      {/* 底部设置 */}
      <div className="mt-auto">
        <button className="w-12 h-12 flex flex-col items-center justify-center rounded-xl group">
          <Settings size={18} className="text-gray-600 group-hover:text-gray-400" />
          <span className="text-[9px] mt-0.5 text-gray-700 group-hover:text-gray-500">设置</span>
        </button>
      </div>
    </div>
  );
}
