import type { SidebarView } from '../../hooks/useUIState';

interface SidebarProps {
  activeView: SidebarView | null;
  onViewChange: (view: SidebarView) => void;
}

interface SidebarItem {
  id: SidebarView;
  icon: string;
  label: string;
}

const sidebarItems: SidebarItem[] = [
  { id: 'connection', icon: 'wifi', label: 'Connection' },
  { id: 'profiles', icon: 'person', label: 'Profiles' },
  { id: 'macros', icon: 'play_arrow', label: 'Macros' },
  { id: 'logs', icon: 'description', label: 'Logs' },
  { id: 'files', icon: 'folder', label: 'Files' },
];

const bottomItems: SidebarItem[] = [
  { id: 'settings', icon: 'settings', label: 'Settings' },
];

export function Sidebar({ activeView, onViewChange }: SidebarProps) {
  return (
    <nav className="w-12 bg-panel-dark border-r border-border-dark flex flex-col items-center py-4 gap-4 shrink-0 z-20">
      {/* Main navigation items */}
      {sidebarItems.map((item) => (
        <button
          key={item.id}
          onClick={() => onViewChange(item.id)}
          className={`group relative flex items-center justify-center w-10 h-10 rounded transition-colors ${
            activeView === item.id
              ? 'bg-primary/20 text-primary'
              : 'hover:bg-white/5 text-slate-400 hover:text-white'
          }`}
        >
          {/* Active indicator */}
          {activeView === item.id && (
            <div className="absolute left-0 w-1 h-6 bg-primary rounded-r" />
          )}

          {/* Icon */}
          <span className="material-symbols-outlined text-[24px]">{item.icon}</span>

          {/* Tooltip */}
          <div className="absolute left-12 bg-black text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-50 transition-opacity">
            {item.label}
          </div>
        </button>
      ))}

      {/* Spacer */}
      <div className="flex-1" />

      {/* Bottom items */}
      {bottomItems.map((item) => (
        <button
          key={item.id}
          onClick={() => onViewChange(item.id)}
          className={`group relative flex items-center justify-center w-10 h-10 rounded transition-colors ${
            activeView === item.id
              ? 'bg-primary/20 text-primary'
              : 'hover:bg-white/5 text-slate-400 hover:text-white'
          }`}
        >
          {activeView === item.id && (
            <div className="absolute left-0 w-1 h-6 bg-primary rounded-r" />
          )}

          <span className="material-symbols-outlined text-[24px]">{item.icon}</span>

          <div className="absolute left-12 bg-black text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-50 transition-opacity">
            {item.label}
          </div>
        </button>
      ))}
    </nav>
  );
}
