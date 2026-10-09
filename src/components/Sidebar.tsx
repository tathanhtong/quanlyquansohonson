import React from 'react';
import {
  LayoutDashboard,
  Users,
  CalendarDays,
  CalendarCheck,
  Star,
  AlertTriangle,
  Award,
  BarChart3,
  FileText,
  History,
  Database,
  Shield,
  X,
} from 'lucide-react';

export type NavTab =
  | 'dashboard'
  | 'soldiers'
  | 'leave'
  | 'weekly'
  | 'commendations'
  | 'reprimands'
  | 'rewards'
  | 'statistics'
  | 'reports'
  | 'audit'
  | 'backup';

interface SidebarProps {
  currentTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  counts: {
    soldiers: number;
    activeLeaves?: number;
    monthComms: number;
    monthReps: number;
    rewards: number;
  };
  mobileOpen: boolean;
  onCloseMobile: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onSelectTab,
  counts,
  mobileOpen,
  onCloseMobile,
}) => {
  const navItems = [
    {
      id: 'dashboard' as NavTab,
      label: 'Tổng quan',
      icon: LayoutDashboard,
      badge: null,
    },
    {
      id: 'soldiers' as NavTab,
      label: 'Quân số',
      icon: Users,
      badge: counts.soldiers,
      badgeColor: 'bg-emerald-100 text-emerald-800 border-emerald-300',
    },
    {
      id: 'leave' as NavTab,
      label: 'Đi phép & Tranh thủ',
      icon: CalendarCheck,
      badge: counts.activeLeaves ?? null,
      badgeColor: 'bg-amber-100 text-amber-900 border-amber-300',
    },
    {
      id: 'weekly' as NavTab,
      label: 'Theo dõi theo tuần',
      icon: CalendarDays,
      badge: null,
      highlight: true,
    },
    {
      id: 'commendations' as NavTab,
      label: 'Biểu dương',
      icon: Star,
      badge: counts.monthComms,
      badgeColor: 'bg-emerald-100 text-emerald-800 border-emerald-300',
    },
    {
      id: 'reprimands' as NavTab,
      label: 'Phê bình',
      icon: AlertTriangle,
      badge: counts.monthReps,
      badgeColor: 'bg-rose-100 text-rose-800 border-rose-300',
    },
    {
      id: 'rewards' as NavTab,
      label: 'Khen thưởng',
      icon: Award,
      badge: counts.rewards,
      badgeColor: 'bg-amber-100 text-amber-800 border-amber-300',
    },
    {
      id: 'statistics' as NavTab,
      label: 'Thống kê',
      icon: BarChart3,
      badge: null,
    },
    {
      id: 'reports' as NavTab,
      label: 'Báo cáo',
      icon: FileText,
      badge: null,
    },
    {
      id: 'audit' as NavTab,
      label: 'Lịch sử hoạt động',
      icon: History,
      badge: null,
    },
    {
      id: 'backup' as NavTab,
      label: 'Sao lưu & Cài đặt',
      icon: Database,
      badge: null,
    },
  ];

  const handleSelect = (tab: NavTab) => {
    onSelectTab(tab);
    onCloseMobile();
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {mobileOpen && (
        <div
          onClick={onCloseMobile}
          className="fixed inset-0 bg-black/60 z-40 lg:hidden backdrop-blur-xs transition-opacity"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed lg:sticky top-0 lg:top-[98px] left-0 h-screen lg:h-[calc(100vh-98px)] w-[min(82vw,300px)] lg:w-64 bg-slate-900 text-slate-200 border-r border-slate-800 z-50 lg:z-10 flex flex-col justify-between transition-transform duration-300 ease-in-out ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Mobile Header in Drawer */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between lg:hidden bg-emerald-950">
          <div className="flex items-center space-x-2">
            <Shield className="w-5 h-5 text-amber-400" />
            <span className="font-bold text-sm tracking-wider uppercase text-amber-300">
              ĐỒN BP HÒN SƠN
            </span>
          </div>
          <button
            onClick={onCloseMobile}
            className="p-1.5 rounded-md text-slate-300 hover:text-white hover:bg-emerald-900"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation List */}
        <div className="flex-1 overflow-y-auto py-3 px-2 space-y-1">
          <div className="px-3 py-1.5 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
            Menu Quản lý
          </div>

          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleSelect(item.id)}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-emerald-700 text-white shadow-md font-semibold ring-1 ring-emerald-500/50'
                    : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
                }`}
              >
                <div className="flex items-center space-x-3 truncate">
                  <Icon
                    className={`w-4 h-4 shrink-0 ${
                      isActive
                        ? 'text-amber-300'
                        : item.id === 'commendations'
                        ? 'text-amber-400'
                        : item.id === 'reprimands'
                        ? 'text-rose-400'
                        : 'text-slate-400'
                    }`}
                  />
                  <span className="truncate">{item.label}</span>
                </div>

                {item.badge !== null && item.badge !== undefined && (
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full font-bold border ${
                      item.badgeColor || 'bg-slate-800 text-slate-300 border-slate-700'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Footer info box */}
        <div className="p-3 border-t border-slate-800 bg-slate-950/70 text-xs text-slate-400">
          <div className="flex items-center space-x-2 text-emerald-400 font-medium">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
            <span>Hệ thống trực ban sẵn sàng</span>
          </div>
          <div className="mt-1 text-[11px] text-slate-400 leading-tight">
            Đồn BP Hòn Sơn &bull; Kiên Hải, Kiên Giang
          </div>
        </div>
      </aside>
    </>
  );
};
