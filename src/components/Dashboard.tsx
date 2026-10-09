import React from 'react';
import {
  Users,
  Star,
  AlertTriangle,
  Award,
  UserCheck,
  TrendingUp,
  ArrowRight,
  ShieldCheck,
  Calendar,
  CheckCircle2,
} from 'lucide-react';
import { Commendation, Reprimand, Reward, Soldier } from '../types';
import { formatDateVN } from '../services/storage';

interface DashboardProps {
  month: number;
  year: number;
  soldiers: Soldier[];
  commendations: Commendation[];
  reprimands: Reprimand[];
  rewards: Reward[];
  onOpenAddCommendation: () => void;
  onOpenAddReprimand: () => void;
  onNavigateTab: (tab: any) => void;
  onSelectSoldier: (soldier: Soldier) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({
  month,
  year,
  soldiers,
  commendations,
  reprimands,
  rewards,
  onOpenAddCommendation,
  onOpenAddReprimand,
  onNavigateTab,
  onSelectSoldier,
}) => {
  // Filter by selected month & year
  const monthComms = commendations.filter((c) => c.month === month && c.year === year);
  const monthReps = reprimands.filter((r) => r.month === month && r.year === year);
  const yearRewards = rewards.filter((rw) => rw.year === year);

  // Active soldier IDs involved in month
  const soldierIdsWithComms = new Set(monthComms.map((c) => c.soldierId));
  const soldierIdsWithReps = new Set(monthReps.map((r) => r.soldierId));
  const activeIdsThisMonth = new Set([...soldierIdsWithComms, ...soldierIdsWithReps]);

  // Soldiers without any comm or rep in this month
  const untouchedCount = Math.max(0, soldiers.length - activeIdsThisMonth.size);

  // Find top commended individual
  const commCountsMap: Record<string, number> = {};
  monthComms.forEach((c) => {
    commCountsMap[c.soldierId] = (commCountsMap[c.soldierId] || 0) + 1;
  });

  let topSoldierId = '';
  let maxComms = 0;
  Object.entries(commCountsMap).forEach(([id, count]) => {
    if (count > maxComms) {
      maxComms = count;
      topSoldierId = id;
    }
  });

  const topSoldier = soldiers.find((s) => s.id === topSoldierId);

  // Weekly breakdown
  const weeks = [1, 2, 3, 4, 5].map((w) => {
    const wComms = monthComms.filter((c) => c.weekNumber === w).length;
    const wReps = monthReps.filter((r) => r.weekNumber === w).length;
    return { week: w, comms: wComms, reps: wReps };
  });

  // Recent 5 entries
  const recentActivities = [
    ...monthComms.map((c) => ({
      type: 'COMM' as const,
      id: c.id,
      date: c.date,
      soldierId: c.soldierId,
      name: c.fullName,
      rank: c.rank,
      position: c.position,
      title: c.content,
      badge: `Tuần ${c.weekNumber}`,
      createdAt: c.createdAt,
    })),
    ...monthReps.map((r) => ({
      type: 'REP' as const,
      id: r.id,
      date: r.date,
      soldierId: r.soldierId,
      name: r.fullName,
      rank: r.rank,
      position: r.position,
      title: r.content,
      badge: `Tuần ${r.weekNumber}`,
      createdAt: r.createdAt,
    })),
  ]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 6);

  return (
    <div className="space-y-6">
      {/* Title & Welcome Header */}
      <div className="bg-gradient-to-r from-emerald-900 via-emerald-800 to-teal-900 rounded-xl p-5 sm:p-6 text-white shadow-md border-l-4 border-amber-400 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-amber-300 text-xs sm:text-sm font-semibold tracking-wide uppercase">
            <ShieldCheck className="w-4 h-4" />
            <span>Khu vực đảo Hòn Sơn &bull; Vùng biển Kiên Hải</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold font-serif text-white mt-1">
            Bảng điều khiển thi đua – Tháng {month}/{year}
          </h2>
          <p className="text-emerald-100 text-xs sm:text-sm mt-1 max-w-2xl">
            Theo dõi, đánh giá kết quả thực hiện nhiệm vụ, động viên kịp thời các điển hình tiên tiến
            và chấn chỉnh lễ tiết tác phong cán bộ, chiến sĩ toàn Đồn.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 self-start md:self-auto">
          <button
            onClick={() => onNavigateTab('weekly')}
            className="px-4 py-2 bg-amber-400 hover:bg-amber-300 text-slate-900 font-bold text-xs sm:text-sm rounded-lg shadow transition-all flex items-center space-x-1.5"
          >
            <span>Bảng theo dõi tuần</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 6 Key Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3 sm:gap-4">
        {/* Total Soldiers */}
        <div
          onClick={() => onNavigateTab('soldiers')}
          className="bg-white rounded-xl p-4 shadow-xs border border-slate-200 hover:border-emerald-500 hover:shadow-md transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold uppercase tracking-wider">Tổng quân số</span>
            <div className="p-2 rounded-lg bg-emerald-50 text-emerald-700 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-slate-800 mt-2">
            {soldiers.length}
          </div>
          <div className="text-[11px] text-slate-500 mt-1 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
            <span>Biên chế chính thức</span>
          </div>
        </div>

        {/* Month Commendations */}
        <div
          onClick={() => onNavigateTab('commendations')}
          className="bg-white rounded-xl p-4 shadow-xs border border-slate-200 hover:border-emerald-500 hover:shadow-md transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold uppercase tracking-wider">Biểu dương tháng</span>
            <div className="p-2 rounded-lg bg-amber-50 text-amber-700 group-hover:bg-amber-500 group-hover:text-white transition-colors">
              <Star className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-emerald-700 mt-2">
            {monthComms.length}
            <span className="text-xs font-medium text-slate-500 ml-1">lượt</span>
          </div>
          <div className="text-[11px] text-emerald-700 font-medium mt-1">
            {soldierIdsWithComms.size} cán bộ, chiến sĩ
          </div>
        </div>

        {/* Month Reprimands */}
        <div
          onClick={() => onNavigateTab('reprimands')}
          className="bg-white rounded-xl p-4 shadow-xs border border-slate-200 hover:border-rose-400 hover:shadow-md transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold uppercase tracking-wider">Phê bình tháng</span>
            <div className="p-2 rounded-lg bg-rose-50 text-rose-700 group-hover:bg-rose-600 group-hover:text-white transition-colors">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-rose-600 mt-2">
            {monthReps.length}
            <span className="text-xs font-medium text-slate-500 ml-1">lượt</span>
          </div>
          <div className="text-[11px] text-rose-700 font-medium mt-1">
            {soldierIdsWithReps.size} cá nhân nhắc nhở
          </div>
        </div>

        {/* Month/Year Rewards */}
        <div
          onClick={() => onNavigateTab('rewards')}
          className="bg-white rounded-xl p-4 shadow-xs border border-slate-200 hover:border-amber-400 hover:shadow-md transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold uppercase tracking-wider">Khen thưởng {year}</span>
            <div className="p-2 rounded-lg bg-amber-50 text-amber-700 group-hover:bg-amber-600 group-hover:text-white transition-colors">
              <Award className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-amber-600 mt-2">
            {yearRewards.length}
            <span className="text-xs font-medium text-slate-500 ml-1">quyết định</span>
          </div>
          <div className="text-[11px] text-slate-500 mt-1">Khen thưởng cấp trên</div>
        </div>

        {/* Untouched Individuals */}
        <div
          onClick={() => onNavigateTab('weekly')}
          className="bg-white rounded-xl p-4 shadow-xs border border-slate-200 hover:border-slate-400 hover:shadow-md transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold uppercase tracking-wider">Chưa BD/PB</span>
            <div className="p-2 rounded-lg bg-slate-100 text-slate-600 group-hover:bg-slate-700 group-hover:text-white transition-colors">
              <UserCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-slate-700 mt-2">
            {untouchedCount}
            <span className="text-xs font-medium text-slate-500 ml-1">đồng chí</span>
          </div>
          <div className="text-[11px] text-slate-500 mt-1">Nhiệm vụ bình thường</div>
        </div>

        {/* Top Commended Individual */}
        <div
          onClick={() => {
            if (topSoldier) onSelectSoldier(topSoldier);
          }}
          className="bg-gradient-to-br from-amber-50 to-emerald-50 rounded-xl p-4 shadow-xs border border-amber-300 hover:shadow-md transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between text-amber-800">
            <span className="text-xs font-bold uppercase tracking-wider">Biểu dương nhiều nhất</span>
            <div className="p-1.5 rounded-lg bg-amber-400 text-amber-950 font-bold">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          {topSoldier ? (
            <div className="mt-2">
              <div className="font-bold text-sm text-slate-900 group-hover:text-emerald-700 truncate">
                {topSoldier.rank} {topSoldier.fullName}
              </div>
              <div className="text-xs font-semibold text-emerald-800 mt-0.5">
                {maxComms} lượt biểu dương
              </div>
            </div>
          ) : (
            <div className="text-xs text-slate-500 mt-3 italic">Chưa có ghi nhận</div>
          )}
        </div>
      </div>

      {/* Grid: Weekly Flow & Latest Activities */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Weekly Matrix Flow */}
        <div className="lg:col-span-2 bg-white rounded-xl p-5 shadow-xs border border-slate-200">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100">
            <div>
              <h3 className="font-bold text-base text-slate-800 flex items-center gap-2">
                <Calendar className="w-5 h-5 text-emerald-700" />
                <span>Tiến độ thi đua qua 5 tuần – Tháng {month}/{year}</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                So sánh số lượt biểu dương và phê bình trong từng tuần công tác
              </p>
            </div>
            <button
              onClick={() => onNavigateTab('weekly')}
              className="text-xs font-semibold text-emerald-700 hover:text-emerald-800 flex items-center gap-1"
            >
              <span>Xem bảng chi tiết</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="flex sm:grid sm:grid-cols-5 gap-2 sm:gap-3 py-4 sm:py-6 overflow-x-auto pb-3 sm:pb-6">
            {weeks.map((w) => (
              <div
                key={w.week}
                className="min-w-[100px] sm:min-w-0 flex-1 flex flex-col items-center bg-slate-50 rounded-xl p-2.5 sm:p-3 border border-slate-200/80 hover:border-emerald-400 transition-colors"
              >
                <span className="text-xs font-bold text-slate-700 mb-2 uppercase">
                  Tuần {w.week}
                </span>

                <div className="w-full space-y-2">
                  {/* Commendation mini-pill */}
                  <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-2 text-center">
                    <span className="text-[10px] uppercase font-bold text-emerald-700 block">
                      Biểu dương
                    </span>
                    <span className="text-lg font-extrabold text-emerald-800">{w.comms}</span>
                  </div>

                  {/* Reprimand mini-pill */}
                  <div className="bg-rose-50 border border-rose-200 rounded-lg p-2 text-center">
                    <span className="text-[10px] uppercase font-bold text-rose-700 block">
                      Phê bình
                    </span>
                    <span className="text-lg font-extrabold text-rose-800">{w.reps}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Quick Shortcuts Bar */}
          <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3 text-xs">
            <span className="text-slate-500">Thao tác nhanh cho trực ban và chỉ huy:</span>
            <div className="flex items-center gap-2">
              <button
                onClick={onOpenAddCommendation}
                className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-semibold rounded-lg border border-emerald-300 transition-colors"
              >
                + Ghi biểu dương tuần
              </button>
              <button
                onClick={onOpenAddReprimand}
                className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-800 font-semibold rounded-lg border border-rose-300 transition-colors"
              >
                + Ghi phê bình tuần
              </button>
            </div>
          </div>
        </div>

        {/* Right 1 Col: Latest Events Feed */}
        <div className="bg-white rounded-xl p-5 shadow-xs border border-slate-200 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-base text-slate-800 flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-amber-600" />
                <span>Hoạt động ghi nhận mới</span>
              </h3>
              <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 font-semibold">
                Tháng {month}
              </span>
            </div>

            <div className="divide-y divide-slate-100 mt-2 max-h-[360px] overflow-y-auto pr-1">
              {recentActivities.length === 0 ? (
                <div className="py-8 text-center text-slate-400 text-xs italic">
                  Chưa có biểu dương hoặc phê bình nào trong tháng {month}/{year}.
                </div>
              ) : (
                recentActivities.map((act) => {
                  const soldier = soldiers.find((s) => s.id === act.soldierId);
                  return (
                    <div
                      key={act.id}
                      onClick={() => {
                        if (soldier) onSelectSoldier(soldier);
                      }}
                      className="py-2.5 flex items-start space-x-3 cursor-pointer hover:bg-slate-50 rounded-lg p-1.5 transition-colors"
                    >
                      <div className="mt-0.5">
                        {act.type === 'COMM' ? (
                          <div className="p-1 rounded-full bg-emerald-100 text-emerald-700">
                            <Star className="w-3.5 h-3.5" />
                          </div>
                        ) : (
                          <div className="p-1 rounded-full bg-rose-100 text-rose-700">
                            <AlertTriangle className="w-3.5 h-3.5" />
                          </div>
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-slate-800 truncate">
                            {act.rank} {act.name}
                          </span>
                          <span
                            className={`text-[10px] font-semibold px-1.5 py-0.2 rounded border ${
                              act.type === 'COMM'
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                : 'bg-rose-50 text-rose-700 border-rose-200'
                            }`}
                          >
                            {act.badge}
                          </span>
                        </div>
                        <p className="text-xs text-slate-600 line-clamp-2 mt-0.5">
                          {act.title}
                        </p>
                        <div className="text-[10px] text-slate-400 mt-1">
                          {formatDateVN(act.date)} &bull; {act.position}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 text-center">
            <button
              onClick={() => onNavigateTab('reports')}
              className="text-xs font-semibold text-emerald-700 hover:text-emerald-800"
            >
              Xem dự thảo báo cáo tháng &rarr;
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
