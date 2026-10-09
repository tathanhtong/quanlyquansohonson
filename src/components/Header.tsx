import React, { useEffect, useState } from 'react';
import { BorderGuardBadge } from './BorderGuardBadge';
import {
  Calendar,
  Clock,
  Menu,
  PlusCircle,
  AlertTriangle,
  Award,
  ChevronDown,
  LogOut,
  LogIn,
  User as UserIcon,
  CheckCircle2,
  RefreshCw,
  WifiOff,
} from 'lucide-react';
import { User } from '../services/firebase';
import { SyncStatus } from '../services/storage';
import { AppUser } from '../types';

interface HeaderProps {
  selectedMonth: number;
  selectedYear: number;
  onMonthChange: (month: number) => void;
  onYearChange: (year: number) => void;
  onOpenAddCommendation: () => void;
  onOpenAddReprimand: () => void;
  onOpenAddReward?: () => void;
  onToggleMobileMenu: () => void;
  user?: User | null;
  userProfile?: AppUser | null;
  syncStatus?: SyncStatus;
  onLogin?: () => void;
  onLogout?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  selectedMonth,
  selectedYear,
  onMonthChange,
  onYearChange,
  onOpenAddCommendation,
  onOpenAddReprimand,
  onOpenAddReward,
  onToggleMobileMenu,
  user,
  userProfile,
  syncStatus = 'SAVED',
  onLogin,
  onLogout,
}) => {
  const [currentDateTime, setCurrentDateTime] = useState<Date>(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentDateTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const daysOfWeek = ['Chủ Nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy'];
  const dayName = daysOfWeek[currentDateTime.getDay()];
  const dayStr = String(currentDateTime.getDate()).padStart(2, '0');
  const monthStr = String(currentDateTime.getMonth() + 1).padStart(2, '0');
  const yearStr = currentDateTime.getFullYear();
  const timeStr = currentDateTime.toLocaleTimeString('vi-VN', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });

  const availableYears = [2024, 2025, 2026, 2027, 2028];

  return (
    <header className="bg-gradient-to-r from-emerald-950 via-emerald-900 to-emerald-950 text-white shadow-xl border-b-2 border-amber-500/40 sticky top-0 z-30">
      {/* Top Banner Ribbon */}
      <div className="bg-emerald-950/90 border-b border-emerald-800/60 px-2 sm:px-4 py-1 flex items-center justify-between text-xs text-amber-200/90 font-medium">
        <div className="flex items-center space-x-1.5 sm:space-x-2 tracking-wide truncate max-w-[55%] sm:max-w-none">
          <span className="inline-block w-2 h-2 rounded-full bg-amber-400 animate-pulse shrink-0"></span>
          <span className="hidden sm:inline">TÒNG CYBER &bull; ZALO: 0939909468</span>
          <span className="sm:hidden font-semibold truncate text-[11px]">BĐBP AN GIANG</span>
          <span className="text-emerald-400 hidden xs:inline">|</span>
          <span className="text-emerald-200 hidden xs:inline truncate">ấp Bãi Nhà A, Đặc khu Kiên Hải</span>
        </div>

        {/* Real-time Clock, Cloud Sync & User Profile */}
        <div className="flex items-center space-x-2 sm:space-x-3 text-emerald-100 shrink-0">
          {/* Sync Status Badge */}
          <div className="flex items-center gap-1.5 px-1.5 sm:px-2 py-0.5 rounded bg-emerald-900/80 border border-emerald-700/60 text-[10px] sm:text-[11px] font-sans">
            {syncStatus === 'SAVED' && (
              <>
                <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                <span className="text-emerald-300 hidden sm:inline">Đã lưu</span>
              </>
            )}
            {syncStatus === 'SAVING' && (
              <>
                <RefreshCw className="w-3 h-3 text-amber-300 animate-spin" />
                <span className="text-amber-300">Đang lưu...</span>
              </>
            )}
            {syncStatus === 'OFFLINE' && (
              <>
                <WifiOff className="w-3 h-3 text-slate-400" />
                <span className="text-slate-300 hidden sm:inline">Không thể kết nối</span>
              </>
            )}
            {syncStatus === 'ERROR' && (
              <>
                <AlertTriangle className="w-3 h-3 text-rose-400" />
                <span className="text-rose-300">Đồng bộ thất bại</span>
              </>
            )}
          </div>

          {/* User Account / Auth */}
          {user ? (
            <div className="flex items-center space-x-2 pl-1 border-l border-emerald-800">
              {user.photoURL ? (
                <img
                  src={user.photoURL}
                  alt={user.displayName || 'User'}
                  className="w-5 h-5 rounded-full border border-amber-400 object-cover"
                />
              ) : (
                <UserIcon className="w-4 h-4 text-amber-300" />
              )}
              <span className="text-amber-200 font-sans font-medium text-[11px] max-w-[120px] truncate hidden md:inline">
                {user.displayName || user.email?.split('@')[0]}
              </span>
              {userProfile?.role === 'admin' && (
                <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-500/25 text-amber-300 border border-amber-400/40 font-bold uppercase tracking-wider hidden sm:inline">
                  Quản trị
                </span>
              )}
              {userProfile?.role === 'editor' && (
                <span className="text-[10px] px-1.5 py-0.2 rounded bg-sky-500/25 text-sky-200 border border-sky-400/40 font-bold uppercase tracking-wider hidden sm:inline">
                  Biên tập
                </span>
              )}
              {userProfile?.role === 'viewer' && (
                <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-500/25 text-slate-300 border border-slate-400/40 font-bold uppercase tracking-wider hidden sm:inline">
                  Chỉ xem
                </span>
              )}
              {onLogout && (
                <button
                  onClick={onLogout}
                  title="Đăng xuất khỏi hệ thống"
                  className="p-1 text-emerald-300 hover:text-amber-300 hover:bg-emerald-800/80 rounded transition-colors"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          ) : (
            onLogin && (
              <button
                onClick={onLogin}
                className="flex items-center space-x-1 px-2 py-0.5 rounded bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-400/40 font-sans text-[11px] font-semibold transition-colors"
              >
                <LogIn className="w-3 h-3" />
                <span>Đăng nhập Google</span>
              </button>
            )
          )}

          {/* Real-time Clock */}
          <div className="hidden lg:flex items-center space-x-1.5 font-mono text-emerald-200 pl-1 border-l border-emerald-800">
            <Clock className="w-3.5 h-3.5 text-amber-400" />
            <span>
              {dayName}, {dayStr}/{monthStr}/{yearStr} &bull;{' '}
              <strong className="text-amber-300 font-bold">{timeStr}</strong>
            </span>
          </div>
        </div>
      </div>

      {/* Main Header Bar */}
      <div className="px-3 py-2 sm:px-6 sm:py-3 flex flex-col md:flex-row md:items-center md:justify-between gap-2.5 sm:gap-3">
        {/* Left: Emblem & Unit Brand */}
        <div className="flex items-center space-x-2.5 sm:space-x-3.5">
          <button
            onClick={onToggleMobileMenu}
            className="lg:hidden p-2 rounded-lg bg-emerald-800/80 hover:bg-emerald-700 active:bg-emerald-600 text-amber-300 transition-colors focus:outline-none shrink-0"
            aria-label="Mở menu điều hướng"
          >
            <Menu className="w-5 h-5" />
          </button>

          <BorderGuardBadge size={44} className="hover:scale-105 transition-transform shrink-0" />

          <div className="min-w-0">
            <div className="flex items-center space-x-2">
              <span className="text-[10px] sm:text-xs font-semibold px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 tracking-widest uppercase truncate">
                Quân đội Nhân dân Việt Nam
              </span>
            </div>
            <h1 className="text-base sm:text-xl font-extrabold text-amber-400 tracking-wide uppercase font-serif drop-shadow-sm leading-tight mt-0.5 truncate">
              ĐỒN BIÊN PHÒNG HÒN SƠN
            </h1>
            <p className="text-[11px] sm:text-sm font-medium text-emerald-100 tracking-normal text-balance line-clamp-1 sm:line-clamp-none">
              HỆ THỐNG THEO DÕI BIỂU DƯƠNG – KHEN THƯỞNG – PHÊ BÌNH
            </p>
          </div>
        </div>

        {/* Right: Period Selector & Quick Actions */}
        <div className="flex flex-wrap items-center justify-between sm:justify-start gap-2 sm:gap-3 w-full md:w-auto self-stretch md:self-center">
          {/* Month / Year Selector Badge */}
          <div className="flex items-center bg-emerald-800/90 border border-amber-500/30 rounded-lg p-1 shadow-inner text-xs sm:text-sm">
            <div className="flex items-center px-1.5 sm:px-2 py-1 text-amber-300 font-semibold gap-1 text-[11px] sm:text-xs">
              <Calendar className="w-3.5 h-3.5" />
              <span className="hidden xs:inline">Thời gian:</span>
            </div>

            {/* Month Select */}
            <div className="relative">
              <select
                value={selectedMonth}
                onChange={(e) => onMonthChange(Number(e.target.value))}
                className="bg-emerald-950 text-white font-medium text-xs sm:text-sm py-1 pl-2 sm:pl-2.5 pr-5 sm:pr-6 rounded border border-emerald-700 hover:border-amber-400 focus:outline-none focus:ring-1 focus:ring-amber-400 appearance-none cursor-pointer"
              >
                {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                  <option key={m} value={m} className="bg-emerald-950 text-white">
                    Tháng {m < 10 ? `0${m}` : m}
                  </option>
                ))}
              </select>
              <ChevronDown className="w-3 h-3 text-amber-300 pointer-events-none absolute right-1.5 top-2" />
            </div>

            <span className="mx-1 text-emerald-400">/</span>

            {/* Year Select */}
            <div className="relative">
              <select
                value={selectedYear}
                onChange={(e) => onYearChange(Number(e.target.value))}
                className="bg-emerald-950 text-white font-medium text-xs sm:text-sm py-1 pl-2 sm:pl-2.5 pr-5 sm:pr-6 rounded border border-emerald-700 hover:border-amber-400 focus:outline-none focus:ring-1 focus:ring-amber-400 appearance-none cursor-pointer"
              >
                {availableYears.map((y) => (
                  <option key={y} value={y} className="bg-emerald-950 text-white">
                    {y}
                  </option>
                ))}
              </select>
              <ChevronDown className="w-3 h-3 text-amber-300 pointer-events-none absolute right-1.5 top-2" />
            </div>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2 ml-auto md:ml-0">
            {/* Quick Action: Add Commendation */}
            <button
              onClick={onOpenAddCommendation}
              className="flex items-center space-x-1 sm:space-x-1.5 px-2.5 sm:px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white rounded-lg font-semibold text-xs sm:text-sm shadow-md transition-all border border-emerald-400/40"
              title="Thêm mới biểu dương trong tuần"
            >
              <PlusCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-300" />
              <span>+ Biểu dương</span>
            </button>

            {/* Quick Action: Add Reprimand */}
            <button
              onClick={onOpenAddReprimand}
              className="flex items-center space-x-1 sm:space-x-1.5 px-2.5 sm:px-3 py-1.5 bg-rose-800 hover:bg-rose-700 active:scale-95 text-white rounded-lg font-semibold text-xs sm:text-sm shadow-md transition-all border border-rose-400/30"
              title="Thêm mới phê bình, nhắc nhở"
            >
              <AlertTriangle className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-300" />
              <span>+ Phê bình</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
