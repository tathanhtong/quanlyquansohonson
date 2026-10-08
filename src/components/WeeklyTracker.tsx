import React, { useState, useMemo } from 'react';
import {
  Search,
  Filter,
  Check,
  AlertCircle,
  Eye,
  Plus,
  Users,
  Award,
  ChevronRight,
  FileSpreadsheet,
  Printer,
  Sparkles,
  X,
} from 'lucide-react';
import { Commendation, DepartmentName, MilitaryRank, Reprimand, Soldier } from '../types';
import { DEPARTMENTS, MILITARY_RANKS } from '../constants/ranksAndDepartments';
import { formatDateVN } from '../services/storage';

interface WeeklyTrackerProps {
  month: number;
  year: number;
  soldiers: Soldier[];
  commendations: Commendation[];
  reprimands: Reprimand[];
  onSelectSoldier: (soldier: Soldier) => void;
  onAddCommendationForSoldier: (soldier: Soldier, week: number) => void;
  onAddReprimandForSoldier: (soldier: Soldier, week: number) => void;
  onExportExcel: () => void;
  onOpenReport: () => void;
}

interface CellDetailModalData {
  soldier: Soldier;
  week: number;
  comms: Commendation[];
  reps: Reprimand[];
}

export const WeeklyTracker: React.FC<WeeklyTrackerProps> = ({
  month,
  year,
  soldiers,
  commendations,
  reprimands,
  onSelectSoldier,
  onAddCommendationForSoldier,
  onAddReprimandForSoldier,
  onExportExcel,
  onOpenReport,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDept, setSelectedDept] = useState<string>('ALL');
  const [selectedRank, setSelectedRank] = useState<string>('ALL');
  const [activeCellModal, setActiveCellModal] = useState<CellDetailModalData | null>(null);

  // Filter comms & reps for this month & year
  const monthComms = useMemo(
    () => commendations.filter((c) => c.month === month && c.year === year),
    [commendations, month, year]
  );
  const monthReps = useMemo(
    () => reprimands.filter((r) => r.month === month && r.year === year),
    [reprimands, month, year]
  );

  // Build lookup index: soldierId -> weekNumber -> { comms: Commendation[], reps: Reprimand[] }
  const matrixLookup = useMemo(() => {
    const lookup: Record<
      string,
      Record<number, { comms: Commendation[]; reps: Reprimand[] }>
    > = {};

    soldiers.forEach((s) => {
      lookup[s.id] = {
        1: { comms: [], reps: [] },
        2: { comms: [], reps: [] },
        3: { comms: [], reps: [] },
        4: { comms: [], reps: [] },
        5: { comms: [], reps: [] },
      };
    });

    monthComms.forEach((c) => {
      if (lookup[c.soldierId] && lookup[c.soldierId][c.weekNumber]) {
        lookup[c.soldierId][c.weekNumber].comms.push(c);
      }
    });

    monthReps.forEach((r) => {
      if (lookup[r.soldierId] && lookup[r.soldierId][r.weekNumber]) {
        lookup[r.soldierId][r.weekNumber].reps.push(r);
      }
    });

    return lookup;
  }, [soldiers, monthComms, monthReps]);

  // Filter soldiers
  const filteredSoldiers = useMemo(() => {
    return soldiers.filter((s) => {
      const matchSearch =
        s.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.position.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.rank.toLowerCase().includes(searchTerm.toLowerCase());
      const matchDept = selectedDept === 'ALL' || s.department === selectedDept;
      const matchRank = selectedRank === 'ALL' || s.rank === selectedRank;
      return matchSearch && matchDept && matchRank;
    });
  }, [soldiers, searchTerm, selectedDept, selectedRank]);

  // Total summary for columns
  const weekTotals = [1, 2, 3, 4, 5].map((w) => {
    const commTotal = monthComms.filter((c) => c.weekNumber === w).length;
    const repTotal = monthReps.filter((r) => r.weekNumber === w).length;
    return { week: w, commTotal, repTotal };
  });

  return (
    <div className="space-y-4">
      {/* Top Filter and Actions Bar */}
      <div className="bg-white rounded-xl p-4 shadow-xs border border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-600"></span>
            <span>BẢNG THEO DÕI BIỂU DƯƠNG – PHÊ BÌNH THEO TUẦN</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Tháng {month} năm {year} &bull; Đồn Biên phòng Hòn Sơn &bull; Quân số:{' '}
            <strong>{soldiers.length}</strong> đồng chí
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={onExportExcel}
            className="flex items-center space-x-1.5 px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-semibold text-xs rounded-lg border border-emerald-300 transition-colors"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-700" />
            <span>Xuất Excel</span>
          </button>
          <button
            onClick={onOpenReport}
            className="flex items-center space-x-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold text-xs rounded-lg border border-slate-300 transition-colors"
          >
            <Printer className="w-3.5 h-3.5 text-slate-600" />
            <span>Mẫu báo cáo A4</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Controls */}
      <div className="bg-white rounded-xl p-3 shadow-xs border border-slate-200 flex flex-col sm:flex-row gap-2.5 items-center">
        {/* Search */}
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
          <input
            type="text"
            placeholder="Tìm theo họ tên, cấp bậc, chức vụ..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs sm:text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-1 focus:ring-emerald-600 bg-slate-50 focus:bg-white"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Filter by Department */}
        <div className="w-full sm:w-56">
          <select
            value={selectedDept}
            onChange={(e) => setSelectedDept(e.target.value)}
            className="w-full py-1.5 px-3 text-xs sm:text-sm rounded-lg border border-slate-300 bg-slate-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-emerald-600"
          >
            <option value="ALL">Tất cả Đội / Trạm / Bộ phận</option>
            {DEPARTMENTS.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
        </div>

        {/* Filter by Rank */}
        <div className="w-full sm:w-44">
          <select
            value={selectedRank}
            onChange={(e) => setSelectedRank(e.target.value)}
            className="w-full py-1.5 px-3 text-xs sm:text-sm rounded-lg border border-slate-300 bg-slate-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-emerald-600"
          >
            <option value="ALL">Tất cả Cấp bậc</option>
            {MILITARY_RANKS.map((group) => (
              <optgroup key={group.category} label={group.category}>
                {group.ranks.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </optgroup>
            ))}
          </select>
        </div>
      </div>

      {/* Main Weekly Tracker Matrix Table */}
      <div className="bg-white rounded-xl shadow-xs border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[980px]">
            <thead>
              {/* Header row 1: Groups */}
              <tr className="bg-emerald-950 text-white text-xs font-bold uppercase tracking-wider border-b border-emerald-900">
                <th rowSpan={2} className="py-3 px-3 text-center w-12 border-r border-emerald-900/60">
                  STT
                </th>
                <th rowSpan={2} className="py-3 px-3 text-center w-28 border-r border-emerald-900/60">
                  Cấp bậc
                </th>
                <th rowSpan={2} className="py-3 px-4 min-w-[170px] border-r border-emerald-900/60">
                  Họ và tên
                </th>
                <th rowSpan={2} className="py-3 px-3 min-w-[150px] border-r border-emerald-900/60">
                  Chức vụ / Đơn vị
                </th>

                {/* Week Columns 1 to 5 */}
                {[1, 2, 3, 4, 5].map((w) => (
                  <th
                    key={w}
                    colSpan={2}
                    className="py-2 px-2 text-center border-r border-emerald-900/60 bg-emerald-900/80"
                  >
                    Tuần {w}
                  </th>
                ))}

                {/* Totals */}
                <th
                  colSpan={2}
                  className="py-2 px-2 text-center bg-emerald-950 text-amber-300 font-extrabold"
                >
                  Tổng tháng {month}
                </th>
              </tr>

              {/* Header row 2: Sub-headers for BD and PB */}
              <tr className="bg-emerald-900 text-emerald-100 text-[11px] font-semibold uppercase tracking-wider border-b border-slate-300">
                {[1, 2, 3, 4, 5].map((w) => (
                  <React.Fragment key={w}>
                    <th className="py-1 px-1.5 text-center bg-emerald-800/80 text-emerald-200 w-16 border-r border-emerald-700/50">
                      BD
                    </th>
                    <th className="py-1 px-1.5 text-center bg-rose-950/70 text-rose-200 w-16 border-r border-emerald-800/60">
                      PB
                    </th>
                  </React.Fragment>
                ))}
                <th className="py-1 px-2 text-center bg-emerald-900 text-amber-300 w-16 border-r border-emerald-800">
                  Tổng BD
                </th>
                <th className="py-1 px-2 text-center bg-rose-950 text-rose-300 w-16">
                  Tổng PB
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-200 text-xs sm:text-sm">
              {filteredSoldiers.length === 0 ? (
                <tr>
                  <td colSpan={16} className="py-12 text-center text-slate-400 italic">
                    Không tìm thấy cán bộ, chiến sĩ phù hợp với tiêu chí lọc.
                  </td>
                </tr>
              ) : (
                filteredSoldiers.map((soldier, idx) => {
                  const soldierMatrix = matrixLookup[soldier.id] || {
                    1: { comms: [], reps: [] },
                    2: { comms: [], reps: [] },
                    3: { comms: [], reps: [] },
                    4: { comms: [], reps: [] },
                    5: { comms: [], reps: [] },
                  };

                  let totalComms = 0;
                  let totalReps = 0;
                  [1, 2, 3, 4, 5].forEach((w) => {
                    totalComms += soldierMatrix[w]?.comms.length || 0;
                    totalReps += soldierMatrix[w]?.reps.length || 0;
                  });

                  return (
                    <tr
                      key={soldier.id}
                      className="hover:bg-amber-50/40 transition-colors group"
                    >
                      {/* STT */}
                      <td className="py-2.5 px-3 text-center text-slate-500 font-mono text-xs border-r border-slate-100">
                        {soldier.stt || idx + 1}
                      </td>

                      {/* Cấp bậc */}
                      <td className="py-2.5 px-3 text-center border-r border-slate-100">
                        <span className="inline-block px-2 py-0.5 rounded text-xs font-semibold bg-slate-100 text-slate-800 border border-slate-200">
                          {soldier.rank}
                        </span>
                      </td>

                      {/* Họ và tên */}
                      <td className="py-2.5 px-4 font-bold text-slate-900 border-r border-slate-100">
                        <button
                          onClick={() => onSelectSoldier(soldier)}
                          className="hover:text-emerald-700 hover:underline text-left font-bold flex items-center gap-1 group-hover:text-emerald-800"
                          title="Bấm để xem hồ sơ cá nhân"
                        >
                          <span>{soldier.fullName}</span>
                          <Eye className="w-3.5 h-3.5 text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                        </button>
                      </td>

                      {/* Chức vụ / Bộ phận */}
                      <td className="py-2.5 px-3 text-slate-600 border-r border-slate-100 text-xs">
                        <div className="font-medium text-slate-800">{soldier.position}</div>
                        <div className="text-[11px] text-slate-500">
                          {soldier.department}
                        </div>
                      </td>

                      {/* Weeks 1 through 5 cells */}
                      {[1, 2, 3, 4, 5].map((w) => {
                        const cellData = soldierMatrix[w] || { comms: [], reps: [] };
                        const commCount = cellData.comms.length;
                        const repCount = cellData.reps.length;

                        return (
                          <React.Fragment key={w}>
                            {/* Commendation Sub-cell */}
                            <td
                              onClick={() =>
                                setActiveCellModal({
                                  soldier,
                                  week: w,
                                  comms: cellData.comms,
                                  reps: cellData.reps,
                                })
                              }
                              className={`py-2 px-1 text-center cursor-pointer border-r border-slate-100 transition-colors ${
                                commCount > 0
                                  ? 'bg-emerald-50/90 hover:bg-emerald-100 text-emerald-800 font-bold'
                                  : 'hover:bg-slate-100/70 text-slate-300'
                              }`}
                              title={`Bấm xem chi tiết Tuần ${w} của ${soldier.fullName}`}
                            >
                              {commCount > 0 ? (
                                <div className="inline-flex items-center justify-center space-x-1 px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-900 border border-emerald-300 text-xs">
                                  <Check className="w-3 h-3 text-emerald-700 stroke-[3]" />
                                  <span>{commCount < 10 ? `0${commCount}` : commCount}</span>
                                </div>
                              ) : (
                                <span className="text-slate-300 text-xs">-</span>
                              )}
                            </td>

                            {/* Reprimand Sub-cell */}
                            <td
                              onClick={() =>
                                setActiveCellModal({
                                  soldier,
                                  week: w,
                                  comms: cellData.comms,
                                  reps: cellData.reps,
                                })
                              }
                              className={`py-2 px-1 text-center cursor-pointer border-r border-slate-200 transition-colors ${
                                repCount > 0
                                  ? 'bg-rose-50/90 hover:bg-rose-100 text-rose-800 font-bold'
                                  : 'hover:bg-slate-100/70 text-slate-300'
                              }`}
                              title={`Bấm xem chi tiết Tuần ${w} của ${soldier.fullName}`}
                            >
                              {repCount > 0 ? (
                                <div className="inline-flex items-center justify-center space-x-1 px-1.5 py-0.5 rounded bg-rose-100 text-rose-900 border border-rose-300 text-xs">
                                  <AlertCircle className="w-3 h-3 text-rose-700 stroke-[2.5]" />
                                  <span>{repCount < 10 ? `0${repCount}` : repCount}</span>
                                </div>
                              ) : (
                                <span className="text-slate-300 text-xs">-</span>
                              )}
                            </td>
                          </React.Fragment>
                        );
                      })}

                      {/* Total Commendations */}
                      <td className="py-2.5 px-2 text-center font-bold text-emerald-800 bg-emerald-50/50 border-r border-slate-100">
                        {totalComms > 0 ? (
                          <span className="px-2 py-0.5 rounded-full bg-emerald-600 text-white text-xs">
                            {totalComms}
                          </span>
                        ) : (
                          <span className="text-slate-400">0</span>
                        )}
                      </td>

                      {/* Total Reprimands */}
                      <td className="py-2.5 px-2 text-center font-bold text-rose-800 bg-rose-50/40">
                        {totalReps > 0 ? (
                          <span className="px-2 py-0.5 rounded-full bg-rose-600 text-white text-xs">
                            {totalReps}
                          </span>
                        ) : (
                          <span className="text-slate-400">0</span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>

            {/* Table Footer Totals */}
            <tfoot>
              <tr className="bg-slate-100 text-slate-800 font-bold text-xs uppercase border-t-2 border-slate-300">
                <td colSpan={4} className="py-3 px-4 text-right">
                  Tổng lượt toàn đơn vị theo tuần:
                </td>
                {weekTotals.map((wt) => (
                  <React.Fragment key={wt.week}>
                    <td className="py-3 px-1 text-center text-emerald-700 bg-emerald-100/60 border-r border-slate-200">
                      {wt.commTotal}
                    </td>
                    <td className="py-3 px-1 text-center text-rose-700 bg-rose-100/60 border-r border-slate-200">
                      {wt.repTotal}
                    </td>
                  </React.Fragment>
                ))}
                <td className="py-3 px-2 text-center text-emerald-800 bg-emerald-100 border-r border-slate-200">
                  {monthComms.length}
                </td>
                <td className="py-3 px-2 text-center text-rose-800 bg-rose-100">
                  {monthReps.length}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>

        {/* Legend */}
        <div className="bg-slate-50 px-4 py-2.5 border-t border-slate-200 flex flex-wrap items-center justify-between text-xs text-slate-600 gap-3">
          <div className="flex items-center space-x-4">
            <span className="font-semibold text-slate-700">Ghi chú ký hiệu:</span>
            <div className="flex items-center space-x-1.5">
              <span className="inline-flex items-center justify-center w-5 h-5 rounded bg-emerald-100 text-emerald-800 border border-emerald-300">
                <Check className="w-3.5 h-3.5 text-emerald-700" />
              </span>
              <span>Biểu dương trong tuần</span>
            </div>
            <div className="flex items-center space-x-1.5">
              <span className="inline-flex items-center justify-center w-5 h-5 rounded bg-rose-100 text-rose-800 border border-rose-300">
                <AlertCircle className="w-3.5 h-3.5 text-rose-700" />
              </span>
              <span>Phê bình / nhắc nhở</span>
            </div>
          </div>

          <div className="text-slate-500 italic">
            * Nhấp vào ô bất kỳ để xem danh sách nội dung hoặc thêm mới cho cán bộ, chiến sĩ.
          </div>
        </div>
      </div>

      {/* Week Cell Detail Popover Modal */}
      {activeCellModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-200 animate-in fade-in zoom-in duration-150">
            {/* Modal Header */}
            <div className="bg-emerald-950 text-white p-4 flex items-center justify-between">
              <div>
                <span className="text-xs text-amber-300 font-semibold uppercase tracking-wider">
                  Chi tiết thi đua &bull; Tuần {activeCellModal.week} (Tháng {month}/{year})
                </span>
                <h3 className="text-base font-bold mt-0.5">
                  {activeCellModal.soldier.rank} {activeCellModal.soldier.fullName}
                </h3>
                <p className="text-xs text-emerald-200">
                  {activeCellModal.soldier.position} &bull; {activeCellModal.soldier.department}
                </p>
              </div>
              <button
                onClick={() => setActiveCellModal(null)}
                className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-emerald-900"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-4 max-h-[60vh] overflow-y-auto space-y-4 text-xs sm:text-sm">
              {/* Commendations Section */}
              <div>
                <div className="flex items-center justify-between pb-1.5 border-b border-emerald-200 text-emerald-800 font-bold">
                  <span className="flex items-center gap-1.5">
                    <Check className="w-4 h-4 text-emerald-700" />
                    <span>Lượt biểu dương ({activeCellModal.comms.length})</span>
                  </span>
                  <button
                    onClick={() => {
                      const s = activeCellModal.soldier;
                      const w = activeCellModal.week;
                      setActiveCellModal(null);
                      onAddCommendationForSoldier(s, w);
                    }}
                    className="text-xs font-semibold text-emerald-700 hover:text-emerald-900 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 hover:bg-emerald-100"
                  >
                    + Thêm biểu dương
                  </button>
                </div>

                {activeCellModal.comms.length === 0 ? (
                  <p className="text-xs text-slate-400 italic py-2">
                    Không có lượt biểu dương trong tuần {activeCellModal.week}.
                  </p>
                ) : (
                  <div className="space-y-2 mt-2">
                    {activeCellModal.comms.map((c) => (
                      <div
                        key={c.id}
                        className="bg-emerald-50/80 rounded-lg p-2.5 border border-emerald-200 text-xs"
                      >
                        <div className="flex justify-between items-start text-emerald-950 font-bold">
                          <span>{formatDateVN(c.date)}</span>
                          <span className="text-[11px] px-1.5 py-0.2 bg-emerald-200/70 text-emerald-900 rounded">
                            {c.commendationType}
                          </span>
                        </div>
                        <p className="text-slate-800 mt-1">{c.content}</p>
                        {c.achievement && (
                          <div className="mt-1 text-slate-600 italic">
                            Thành tích: {c.achievement}
                          </div>
                        )}
                        <div className="mt-1 text-[11px] text-slate-500">
                          Đề xuất: {c.proposedBy}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Reprimands Section */}
              <div>
                <div className="flex items-center justify-between pb-1.5 border-b border-rose-200 text-rose-800 font-bold">
                  <span className="flex items-center gap-1.5">
                    <AlertCircle className="w-4 h-4 text-rose-700" />
                    <span>Lượt phê bình / nhắc nhở ({activeCellModal.reps.length})</span>
                  </span>
                  <button
                    onClick={() => {
                      const s = activeCellModal.soldier;
                      const w = activeCellModal.week;
                      setActiveCellModal(null);
                      onAddReprimandForSoldier(s, w);
                    }}
                    className="text-xs font-semibold text-rose-700 hover:text-rose-900 bg-rose-50 px-2 py-0.5 rounded border border-rose-200 hover:bg-rose-100"
                  >
                    + Thêm phê bình
                  </button>
                </div>

                {activeCellModal.reps.length === 0 ? (
                  <p className="text-xs text-slate-400 italic py-2">
                    Không có phê bình trong tuần {activeCellModal.week}. Tác phong tốt!
                  </p>
                ) : (
                  <div className="space-y-2 mt-2">
                    {activeCellModal.reps.map((r) => (
                      <div
                        key={r.id}
                        className="bg-rose-50/80 rounded-lg p-2.5 border border-rose-200 text-xs"
                      >
                        <div className="flex justify-between items-start text-rose-950 font-bold">
                          <span>{formatDateVN(r.date)}</span>
                          <span className="text-[11px] px-1.5 py-0.2 bg-rose-200/70 text-rose-900 rounded">
                            {r.reprimandType}
                          </span>
                        </div>
                        <p className="text-slate-800 mt-1">{r.content}</p>
                        {r.remediationPlan && (
                          <div className="mt-1 text-slate-600">
                            <strong>Khắc phục:</strong> {r.remediationPlan}
                          </div>
                        )}
                        <div className="mt-1 flex items-center justify-between text-[11px]">
                          <span className="text-slate-500">Người nhắc: {r.reviewedBy}</span>
                          <span className="font-semibold text-rose-800 px-1.5 py-0.2 rounded bg-rose-100">
                            {r.remediationStatus}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="bg-slate-50 p-3 border-t border-slate-200 flex justify-between items-center">
              <button
                onClick={() => {
                  const s = activeCellModal.soldier;
                  setActiveCellModal(null);
                  onSelectSoldier(s);
                }}
                className="text-xs font-semibold text-emerald-800 hover:underline flex items-center gap-1"
              >
                <span>Xem toàn bộ hồ sơ cá nhân</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setActiveCellModal(null)}
                className="px-3 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-800 font-semibold text-xs rounded-lg transition-colors"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
