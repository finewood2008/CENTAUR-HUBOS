// CENTAUR - 侧边导航栏 (Warm Anthropic Style + Dark Theme Support)
import { LayoutDashboard, Users, Radio, Database, Settings, Wallet, UserCircle, Brain, Building2 } from 'lucide-react';
import { motion } from 'framer-motion';
import type { NavTab } from '../../types';
import { useOrg } from '../../stores/useAppStore';

const navItems: { key: NavTab; icon: typeof LayoutDashboard; label: string }[] = [
  { key: 'team', icon: Users, label: '团队' },
  { key: 'employees', icon: UserCircle, label: '员工' },
  { key: 'channels', icon: Radio, label: '通讯' },
  { key: 'memory', icon: Brain, label: '记忆' },
  { key: 'knowledge', icon: Database, label: '知识库' },
  { key: 'finance', icon: Wallet, label: '财务' },
  { key: 'office', icon: Building2, label: '办公室' },
];

interface SidebarProps {
  active: NavTab;
  onNav: (tab: NavTab) => void;
}

export default function Sidebar({ active, onNav }: SidebarProps) {
  const { org } = useOrg();
  const orgName = org.name;

  // Display name: truncate to 6 characters max
  const displayName = orgName.length > 6 ? orgName.slice(0, 6) + '…' : orgName;
  // First character for the logo circle
  const logoChar = orgName.charAt(0).toUpperCase();

  return (
    <div
      className="w-[68px] h-full flex flex-col items-center pt-10 pb-5 gap-1 bg-deep-dark dark:bg-deep-dark border-r border-border-dark dark:border-border-dark"
      style={{ WebkitAppRegion: 'drag' } as React.CSSProperties}
    >
      {/* Logo */}
      <div className="mb-6 flex flex-col items-center">
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center text-lg font-bold bg-terracotta dark:bg-terracotta text-ivory dark:text-ivory"
          style={{ boxShadow: 'var(--shadow-ring-terracotta)' }}
        >
          {logoChar}
        </div>
        <span className="text-[9px] mt-1 tracking-widest text-stone-gray dark:text-stone-gray">
          {displayName}
        </span>
        <span className="text-[7px] mt-0.5 text-stone-gray/60 dark:text-stone-gray/50 tracking-wide">
          OPC 超级工作台
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
                  ? 'text-coral dark:text-coral'
                  : 'text-stone-gray dark:text-stone-gray group-hover:text-warm-silver dark:group-hover:text-warm-silver'
              }`}
            />
            <span
              className={`text-[9px] mt-0.5 relative z-10 transition-colors ${
                isActive
                  ? 'text-coral dark:text-coral'
                  : 'text-stone-gray dark:text-stone-gray group-hover:text-warm-silver dark:group-hover:text-warm-silver'
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
                ? 'text-coral dark:text-coral'
                : 'text-stone-gray dark:text-stone-gray group-hover:text-warm-silver dark:group-hover:text-warm-silver'
            }`}
          />
          <span
            className={`text-[9px] mt-0.5 relative z-10 transition-colors ${
              active === 'settings'
                ? 'text-coral dark:text-coral'
                : 'text-stone-gray dark:text-stone-gray group-hover:text-warm-silver dark:group-hover:text-warm-silver'
            }`}
          >
            设置
          </span>
        </button>
      </div>
    </div>
  );
}
