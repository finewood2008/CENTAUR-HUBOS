// CENTAUR - 侧边导航栏 (Warm Anthropic Style)
import { LayoutDashboard, Users, Radio, Database, Settings, Wallet } from 'lucide-react';
import { motion } from 'framer-motion';
import type { NavTab } from '../../types';

const navItems: { key: NavTab; icon: typeof LayoutDashboard; label: string }[] = [
  { key: 'dashboard', icon: LayoutDashboard, label: '信息流' },
  { key: 'team', icon: Users, label: '团队' },
  { key: 'channels', icon: Radio, label: '通讯' },
  { key: 'knowledge', icon: Database, label: '知识库' },
  { key: 'finance', icon: Wallet, label: '财务' },
];

interface SidebarProps {
  active: NavTab;
  onNav: (tab: NavTab) => void;
}

export default function Sidebar({ active, onNav }: SidebarProps) {
  return (
    <div
      className="w-[68px] h-full flex flex-col items-center pt-10 pb-5 gap-1 bg-deep-dark border-r border-border-dark"
      style={{ WebkitAppRegion: 'drag' } as React.CSSProperties}
    >
      {/* Logo */}
      <div className="mb-6 flex flex-col items-center">
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center text-lg font-bold bg-terracotta text-ivory"
          style={{ boxShadow: 'var(--shadow-ring-terracotta)' }}
        >
          C
        </div>
        <span className="text-[9px] mt-1 tracking-widest text-stone-gray">
          CENTAUR
        </span>
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
            style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}
          >
            {isActive && (
              <motion.div
                layoutId="nav-pill"
                className="absolute inset-0 nav-pill-active"
                transition={{ type: 'spring', stiffness: 350, damping: 30 }}
              />
            )}
            <Icon
              size={20}
              className={`relative z-10 transition-colors ${
                isActive
                  ? 'text-coral'
                  : 'text-stone-gray group-hover:text-warm-silver'
              }`}
            />
            <span
              className={`text-[9px] mt-0.5 relative z-10 transition-colors ${
                isActive
                  ? 'text-coral'
                  : 'text-stone-gray group-hover:text-warm-silver'
              }`}
            >
              {item.label}
            </span>
          </button>
        );
      })}

      {/* 底部设置 */}
      <div className="mt-auto">
        <button
          onClick={() => onNav('settings')}
          className="relative w-12 h-12 flex flex-col items-center justify-center rounded-xl transition-colors group"
          style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}
        >
          {active === 'settings' && (
            <motion.div
              layoutId="nav-pill"
              className="absolute inset-0 nav-pill-active"
              transition={{ type: 'spring', stiffness: 350, damping: 30 }}
            />
          )}
          <Settings
            size={18}
            className={`relative z-10 transition-colors ${
              active === 'settings'
                ? 'text-coral'
                : 'text-stone-gray group-hover:text-warm-silver'
            }`}
          />
          <span
            className={`text-[9px] mt-0.5 relative z-10 transition-colors ${
              active === 'settings'
                ? 'text-coral'
                : 'text-stone-gray group-hover:text-warm-silver'
            }`}
          >
            设置
          </span>
        </button>
      </div>
    </div>
  );
}
