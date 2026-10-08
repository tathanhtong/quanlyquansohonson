import React, { useState, useMemo } from 'react';
import {
  BarChart3,
  TrendingUp,
  Star,
  AlertTriangle,
  Award,
  Users,
  Calendar,
  Filter,
} from 'lucide-react';
import { Commendation, Reprimand, Reward, Soldier } from '../types';

interface StatisticsViewProps {
  year: number;
  soldiers: Soldier[];
  commendations: Commendation[];
  reprimands: Reprimand[];
  rewards: Reward[];
  onSelectSoldier: (soldier: Soldier) => void;
}

export const StatisticsView: React.FC<StatisticsViewProps> = ({
  year,
  soldiers,
  commendations,
  reprimands,
  rewards,
  onSelectSoldier,
}) => {
  const [timeScope, setTimeScope] = useState<'MONTH_BY_MONTH' | 'QUARTER' | 'HALF_YEAR' | 'YEAR'>('MONTH_BY_MONTH');
  const [selectedStatYear, setSelectedStatYear] = useState<number>(year);

  // Filter items by selectedStatYear
  const yearComms = useMemo(
    () => commendations.filter((c) => c.year === selectedStatYear),
    [commendations, selectedStatYear]
  );
  const yearReps = useMemo(
    () => reprimands.filter((r) => r.year === selectedStatYear),
    [reprimands, selectedStatYear]
  );
  const yearRewards = useMemo(
    () => rewards.filter((rw) => rw.year === selectedStatYear),
    [rewards, selectedStatYear]
  );

  // Monthly stats (months 1 to 12)
  const monthlyData = useMemo(() => {
    return Array.from({ length: 12 }, (_, i) => i + 1).map((m) => {
      const commCount = yearComms.filter((c) => c.month === m).length;
      const repCount = yearReps.filter((r) => r.month === m).length;
      const rewCount = yearRewards.filter((rw) => rw.month === m).length;
      return {
        label: `Tháng ${m}`,
        shortLabel: `T${m}`,
        comms: commCount,
        reps: repCount,
        rewards: rewCount,
      };
    });
  }, [yearComms, yearReps, yearRewards]);

  // Quarterly stats
  const quarterlyData = useMemo(() => {
    return [
      { label: 'Quý I (T1-T3)', months: [1, 2, 3] },
      { label: 'Quý II (T4-T6)', months: [4, 5, 6] },
      { label: 'Quý III (T7-T9)', months: [7, 8, 9] },
      { label: 'Quý IV (T10-T12)', months: [10, 11, 12] },
    ].map((q) => {
      const commCount = yearComms.filter((c) => q.months.includes(c.month)).length;
      const repCount = yearReps.filter((r) => q.months.includes(r.month)).length;
      return {
        label: q.label,
        comms: commCount,
        reps: repCount,
      };
    });
  }, [yearComms, yearReps]);

  // 6 months stats
  const halfYearData = useMemo(() => {
    return [
      { label: '6 tháng đầu năm (T1 - T6)', months: [1, 2, 3, 4, 5, 6] },
      { label: '6 tháng cuối năm (T7 - T12)', months: [7, 8, 9, 10, 11, 12] },
    ].map((h) => {
      const commCount = yearComms.filter((c) => h.months.includes(c.month)).length;
      const repCount = yearReps.filter((r) => h.months.includes(r.month)).length;
      return {
        label: h.label,
        comms: commCount,
        reps: repCount,
      };
    });
  }, [yearComms, yearReps]);

  // Top 10 commended soldiers
  const topCommendedSoldiers = useMemo(() => {
    const counts: Record<string, number> = {};
    yearComms.forEach((c) => {
      counts[c.soldierId] = (counts[c.soldierId] || 0) + 1;
    });

    return Object.entries(counts)
      .map(([id, count]) => {
        const soldier = soldiers.find((s) => s.id === id);
        return {
          soldier,
          count,
        };
      })
      .filter((item): item is { soldier: Soldier; count: number } => item.soldier !== undefined)
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
  }, [yearComms, soldiers]);

  // Department breakdown
  const departmentStats = useMemo(() => {
    const stats: Record<string, { comms: number; reps: number; soldiers: number }> = {};
    soldiers.forEach((s) => {
      if (!stats[s.department]) {
        stats[s.department] = { comms: 0, reps: 0, soldiers: 0 };
      }
      stats[s.department].soldiers += 1;
    });

    yearComms.forEach((c) => {
      if (stats[c.department]) stats[c.department].comms += 1;
    });

    yearReps.forEach((r) => {
      if (stats[r.department]) stats[r.department].reps += 1;
    });

    return Object.entries(stats).map(([name, data]) => ({
      department: name,
      ...data,
    }));
  }, [soldiers, yearComms, yearReps]);

  const maxMonthlyVal = Math.max(
    ...monthlyData.map((d) => Math.max(d.comms, d.reps, 1)),
    5
  );

  return (
    <div className="space-y-6">
      {/* Top Filter Bar */}
      <div className="bg-white rounded-xl p-4 shadow-xs border border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-emerald-700" />
            <span>THỐNG KÊ & PHÂN TÍCH TỔNG HỢP THI ĐUA</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Phân tích số liệu biểu dương, phê bình theo Tháng, Quý, 6 tháng và cả Năm {selectedStatYear}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Year selector */}
          <select
            value={selectedStatYear}
            onChange={(e) => setSelectedStatYear(Number(e.target.value))}
            className="py-1.5 px-3 rounded-lg border border-slate-300 text-xs sm:text-sm font-semibold bg-slate-50"
          >
            {[2024, 2025, 2026, 2027, 2028].map((y) => (
              <option key={y} value={y}>
                Năm {y}
              </option>
            ))}
          </select>

          {/* Time Scope Toggle */}
          <div className="inline-flex rounded-lg border border-slate-300 p-0.5 bg-slate-100 text-xs font-semibold">
            <button
              onClick={() => setTimeScope('MONTH_BY_MONTH')}
              className={`px-2.5 py-1 rounded-md transition-colors ${
                timeScope === 'MONTH_BY_MONTH'
                  ? 'bg-white text-emerald-800 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Theo Tháng
            </button>
            <button
              onClick={() => setTimeScope('QUARTER')}
              className={`px-2.5 py-1 rounded-md transition-colors ${
                timeScope === 'QUARTER'
                  ? 'bg-white text-emerald-800 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Theo Quý
            </button>
            <button
              onClick={() => setTimeScope('HALF_YEAR')}
              className={`px-2.5 py-1 rounded-md transition-colors ${
                timeScope === 'HALF_YEAR'
                  ? 'bg-white text-emerald-800 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              6 Tháng
            </button>
          </div>
        </div>
      </div>

      {/* Main Bar Chart: Commendations vs Reprimands Comparison */}
      <div className="bg-white rounded-xl p-5 shadow-xs border border-slate-200">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-slate-100">
          <div>
            <h3 className="font-bold text-base text-slate-800 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-emerald-700" />
              <span>
                {timeScope === 'MONTH_BY_MONTH'
                  ? `So sánh Biểu dương và Phê bình qua 12 tháng (Năm ${selectedStatYear})`
                  : timeScope === 'QUARTER'
                  ? `So sánh Biểu dương và Phê bình theo 4 Quý (Năm ${selectedStatYear})`
                  : `So sánh 6 tháng đầu năm và 6 tháng cuối năm (${selectedStatYear})`}
              </span>
            </h3>
            <p className="text-xs text-slate-500">
              Đánh giá biến động tình hình thi đua và chuyển biến nề nếp kỷ luật tại đơn vị
            </p>
          </div>

          <div className="flex items-center space-x-4 text-xs font-semibold">
            <div className="flex items-center space-x-1.5">
              <span className="w-3 h-3 rounded bg-emerald-600"></span>
              <span className="text-emerald-900">Biểu dương</span>
            </div>
            <div className="flex items-center space-x-1.5">
              <span className="w-3 h-3 rounded bg-rose-600"></span>
              <span className="text-rose-900">Phê bình</span>
            </div>
          </div>
        </div>

        {/* Visual Bar Chart */}
        {timeScope === 'MONTH_BY_MONTH' && (
          <div className="pt-8 pb-4">
            <div className="grid grid-cols-12 gap-1.5 sm:gap-3 items-end h-56">
              {monthlyData.map((d, idx) => {
                const commHeight = Math.round((d.comms / maxMonthlyVal) * 100);
                const repHeight = Math.round((d.reps / maxMonthlyVal) * 100);

                return (
                  <div key={idx} className="flex flex-col items-center h-full justify-end group">
                    <div className="w-full flex items-end justify-center space-x-0.5 sm:space-x-1 h-44">
                      {/* Comm bar */}
                      <div
                        style={{ height: `${Math.max(commHeight, 4)}%` }}
                        className="w-1/2 max-w-[18px] bg-emerald-600 rounded-t-sm group-hover:bg-emerald-500 transition-all flex items-start justify-center pt-0.5"
                        title={`${d.label}: ${d.comms} biểu dương`}
                      >
                        {d.comms > 0 && (
                          <span className="text-[10px] text-white font-bold hidden sm:inline">
                            {d.comms}
                          </span>
                        )}
                      </div>

                      {/* Rep bar */}
                      <div
                        style={{ height: `${Math.max(repHeight, 4)}%` }}
                        className="w-1/2 max-w-[18px] bg-rose-600 rounded-t-sm group-hover:bg-rose-500 transition-all flex items-start justify-center pt-0.5"
                        title={`${d.label}: ${d.reps} phê bình`}
                      >
                        {d.reps > 0 && (
                          <span className="text-[10px] text-white font-bold hidden sm:inline">
                            {d.reps}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="text-[11px] font-bold text-slate-700 mt-2 text-center">
                      <span className="hidden sm:inline">{d.shortLabel}</span>
                      <span className="sm:hidden">{idx + 1}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {timeScope === 'QUARTER' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 py-6">
            {quarterlyData.map((q, idx) => (
              <div key={idx} className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                <span className="font-bold text-sm text-slate-800 block mb-3 uppercase">
                  {q.label}
                </span>
                <div className="space-y-2">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-emerald-800 font-semibold">Biểu dương:</span>
                    <span className="font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded">
                      {q.comms} lượt
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-rose-800 font-semibold">Phê bình:</span>
                    <span className="font-bold text-rose-700 bg-rose-100 px-2 py-0.5 rounded">
                      {q.reps} lượt
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {timeScope === 'HALF_YEAR' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-6">
            {halfYearData.map((h, idx) => (
              <div key={idx} className="bg-slate-50 p-5 rounded-xl border border-slate-200">
                <h4 className="font-bold text-base text-slate-800 mb-4">{h.label}</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-emerald-100/60 p-3 rounded-xl border border-emerald-300 text-center">
                    <span className="text-xs font-bold text-emerald-800 uppercase block">
                      Tổng biểu dương
                    </span>
                    <span className="text-3xl font-extrabold text-emerald-900 mt-1 block">
                      {h.comms}
                    </span>
                  </div>
                  <div className="bg-rose-100/60 p-3 rounded-xl border border-rose-300 text-center">
                    <span className="text-xs font-bold text-rose-800 uppercase block">
                      Tổng phê bình
                    </span>
                    <span className="text-3xl font-extrabold text-rose-900 mt-1 block">
                      {h.reps}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Grid: Top 10 Individuals & Department Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top 10 Individuals */}
        <div className="bg-white rounded-xl p-5 shadow-xs border border-slate-200">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h3 className="font-bold text-base text-slate-800 flex items-center gap-2">
              <Star className="w-5 h-5 text-amber-500 fill-amber-500" />
              <span>Top cá nhân được biểu dương nhiều nhất ({selectedStatYear})</span>
            </h3>
            <span className="text-xs font-semibold px-2 py-0.5 rounded bg-amber-100 text-amber-900">
              Điển hình tiên tiến
            </span>
          </div>

          <div className="divide-y divide-slate-100 mt-2">
            {topCommendedSoldiers.length === 0 ? (
              <div className="py-8 text-center text-slate-400 italic text-xs">
                Chưa có dữ liệu biểu dương trong năm {selectedStatYear}.
              </div>
            ) : (
              topCommendedSoldiers.map((item, idx) => (
                <div
                  key={item.soldier.id}
                  onClick={() => onSelectSoldier(item.soldier)}
                  className="py-2.5 flex items-center justify-between hover:bg-slate-50 px-2 rounded-lg cursor-pointer transition-colors"
                >
                  <div className="flex items-center space-x-3">
                    <span
                      className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs ${
                        idx === 0
                          ? 'bg-amber-400 text-amber-950 ring-2 ring-amber-300'
                          : idx === 1
                          ? 'bg-slate-300 text-slate-800'
                          : idx === 2
                          ? 'bg-amber-600 text-white'
                          : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      {idx + 1}
                    </span>

                    <div>
                      <div className="font-bold text-xs sm:text-sm text-slate-900">
                        {item.soldier.rank} {item.soldier.fullName}
                      </div>
                      <div className="text-[11px] text-slate-500">
                        {item.soldier.position} &bull; {item.soldier.department}
                      </div>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="inline-block px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold text-xs">
                      {item.count} lượt
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Department Breakdown */}
        <div className="bg-white rounded-xl p-5 shadow-xs border border-slate-200">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h3 className="font-bold text-base text-slate-800 flex items-center gap-2">
              <Users className="w-5 h-5 text-emerald-700" />
              <span>Phân bố theo Đội / Trạm / Bộ phận</span>
            </h3>
            <span className="text-xs text-slate-500">Tổng kết năm {selectedStatYear}</span>
          </div>

          <div className="overflow-x-auto mt-2">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 text-slate-700 font-bold uppercase border-b border-slate-200">
                  <th className="py-2 px-3">Đơn vị / Bộ phận</th>
                  <th className="py-2 px-2 text-center">Quân số</th>
                  <th className="py-2 px-2 text-center text-emerald-700">Biểu dương</th>
                  <th className="py-2 px-2 text-center text-rose-700">Phê bình</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {departmentStats.map((dept, i) => (
                  <tr key={i} className="hover:bg-slate-50">
                    <td className="py-2 px-3 font-semibold text-slate-800">
                      {dept.department}
                    </td>
                    <td className="py-2 px-2 text-center text-slate-600 font-medium">
                      {dept.soldiers}
                    </td>
                    <td className="py-2 px-2 text-center font-bold text-emerald-800 bg-emerald-50/50">
                      {dept.comms}
                    </td>
                    <td className="py-2 px-2 text-center font-bold text-rose-800 bg-rose-50/50">
                      {dept.reps}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
