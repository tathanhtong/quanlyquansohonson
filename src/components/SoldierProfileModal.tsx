import React, { useState, useMemo } from 'react';
import {
  X,
  Star,
  AlertTriangle,
  Award,
  Calendar,
  CalendarCheck,
  FileDown,
  Printer,
  Shield,
  User,
  CheckCircle2,
  Clock,
  Filter,
} from 'lucide-react';
import { Commendation, LeaveRecord, Reprimand, Reward, Soldier } from '../types';
import { exportSoldierProfileToWord } from '../utils/exportDocx';
import { formatDateVN } from '../services/storage';

interface SoldierProfileModalProps {
  soldier: Soldier | null;
  commendations: Commendation[];
  reprimands: Reprimand[];
  rewards: Reward[];
  leaves?: LeaveRecord[];
  onClose: () => void;
  unitInfo: { unitName: string; parentUnit: string; superiorUnit: string };
}

export const SoldierProfileModal: React.FC<SoldierProfileModalProps> = ({
  soldier,
  commendations,
  reprimands,
  rewards,
  leaves = [],
  onClose,
  unitInfo,
}) => {
  const [filterYear, setFilterYear] = useState<number | 'ALL'>('ALL');
  const [filterType, setFilterType] = useState<'ALL' | 'COMM' | 'REP' | 'REW' | 'LEAVE'>('ALL');

  // Filter soldier's records
  const soldierComms = useMemo(
    () => (soldier ? commendations.filter((c) => c.soldierId === soldier.id) : []),
    [commendations, soldier]
  );
  const soldierReps = useMemo(
    () => (soldier ? reprimands.filter((r) => r.soldierId === soldier.id) : []),
    [reprimands, soldier]
  );
  const soldierRewards = useMemo(
    () => (soldier ? rewards.filter((rw) => rw.soldierId === soldier.id) : []),
    [rewards, soldier]
  );
  const soldierLeaves = useMemo(
    () => (soldier ? leaves.filter((l) => l.soldierId === soldier.id) : []),
    [leaves, soldier]
  );

  // Combine into timeline
  const timelineItems = useMemo(() => {
    const list: Array<{
      type: 'COMM' | 'REP' | 'REW' | 'LEAVE';
      id: string;
      date: string;
      title: string;
      subtitle: string;
      details: string;
      statusBadge?: string;
      extraInfo?: string;
      year: number;
    }> = [];

    soldierComms.forEach((c) => {
      list.push({
        type: 'COMM',
        id: c.id,
        date: c.date,
        title: `BIỂU DƯƠNG - TUẦN ${c.weekNumber} (Tháng ${c.month}/${c.year})`,
        subtitle: c.commendationType,
        details: c.content,
        extraInfo: c.achievement
          ? `Thành tích: ${c.achievement} • Người đề xuất: ${c.proposedBy}`
          : `Người đề xuất: ${c.proposedBy}`,
        year: c.year,
      });
    });

    soldierReps.forEach((r) => {
      list.push({
        type: 'REP',
        id: r.id,
        date: r.date,
        title: `PHÊ BÌNH - TUẦN ${r.weekNumber} (Tháng ${r.month}/${r.year})`,
        subtitle: r.reprimandType,
        details: r.content,
        statusBadge: r.remediationStatus,
        extraInfo: `Yêu cầu khắc phục: ${r.remediationPlan} • Người nhận xét: ${r.reviewedBy}`,
        year: r.year,
      });
    });

    soldierRewards.forEach((rw) => {
      list.push({
        type: 'REW',
        id: rw.id,
        date: rw.decisionDate || `${rw.year}-01-01`,
        title: `KHEN THƯỞNG - ${rw.rewardType.toUpperCase()}`,
        subtitle: `Số QĐ: ${rw.decisionNumber || 'Chưa cập nhật'} • Cấp ký: ${rw.decisionLevel}`,
        details: rw.achievement,
        year: rw.year,
      });
    });

    soldierLeaves.forEach((l) => {
      list.push({
        type: 'LEAVE',
        id: l.id,
        date: l.startDate,
        title: `${l.category.toUpperCase()} - ${l.leaveType.toUpperCase()} (${l.daysCount} ngày)`,
        subtitle: `Từ ${formatDateVN(l.startDate)} đến ${formatDateVN(l.endDate)} • Số GP: ${l.licenseNumber || 'Không có'}`,
        details: `Nơi đến: ${l.destination} • Lý do: ${l.reason}`,
        statusBadge: l.status,
        extraInfo: `Người phê duyệt: ${l.approver}${l.actualReturnDate ? ` • Ngày về: ${formatDateVN(l.actualReturnDate)}` : ''}`,
        year: new Date(l.startDate).getFullYear(),
      });
    });

    // Sort descending by date
    list.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    return list.filter((item) => {
      if (filterYear !== 'ALL' && item.year !== Number(filterYear)) return false;
      if (filterType !== 'ALL' && item.type !== filterType) return false;
      return true;
    });
  }, [soldierComms, soldierReps, soldierRewards, soldierLeaves, filterYear, filterType]);

  const handleExportWord = () => {
    if (!soldier) return;
    exportSoldierProfileToWord(soldier, soldierComms, soldierReps, soldierRewards, unitInfo);
  };

  const handlePrint = () => {
    window.print();
  };

  if (!soldier) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-2 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full my-auto overflow-hidden border border-slate-200 animate-in fade-in zoom-in duration-200 flex flex-col max-h-[92vh]">
        {/* Modal Top Banner */}
        <div className="bg-gradient-to-r from-emerald-950 via-emerald-900 to-emerald-950 text-white p-3.5 sm:p-5 flex items-start justify-between border-b-2 border-amber-500/40 shrink-0 gap-2">
          <div className="flex items-center space-x-2.5 sm:space-x-3.5 min-w-0">
            <div className="w-11 h-11 sm:w-14 sm:h-14 rounded-xl bg-emerald-800/80 border-2 border-amber-400 flex items-center justify-center text-amber-300 font-bold text-lg sm:text-xl shadow-md shrink-0">
              {soldier.fullName.trim().split(' ').slice(-1)[0]?.charAt(0) || 'Đ'}
            </div>

            <div className="min-w-0">
              <div className="flex items-center space-x-1.5 sm:space-x-2">
                <span className="text-[10px] sm:text-xs font-bold px-1.5 sm:px-2 py-0.5 rounded bg-amber-400/20 text-amber-300 border border-amber-400/30 truncate">
                  {soldier.rank}
                </span>
                <span className="text-[10px] sm:text-xs text-emerald-200 font-medium truncate">
                  {soldier.status}
                </span>
              </div>

              <h2 className="text-base sm:text-2xl font-bold font-serif text-white tracking-wide uppercase mt-0.5 truncate">
                {soldier.fullName}
              </h2>

              <p className="text-[11px] sm:text-sm text-emerald-100 truncate">
                <strong>{soldier.position}</strong> &bull; {soldier.department}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-1 sm:space-x-2 shrink-0">
            <button
              onClick={handleExportWord}
              className="p-1.5 sm:p-2 rounded-lg bg-emerald-800 hover:bg-emerald-700 text-amber-300 text-xs font-semibold flex items-center gap-1.5 transition-colors border border-emerald-600"
              title="Xuất file Word trích lục hồ sơ"
            >
              <FileDown className="w-4 h-4" />
              <span className="hidden sm:inline">Xuất Word</span>
            </button>

            <button
              onClick={onClose}
              className="p-1.5 sm:p-2 rounded-lg text-slate-300 hover:text-white hover:bg-emerald-900 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Soldier Info & Key Stats Grid */}
        <div className="p-4 bg-slate-50 border-b border-slate-200">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            {/* Stat: Commendations */}
            <div className="bg-white rounded-xl p-3 border border-emerald-200 shadow-xs flex items-center space-x-3">
              <div className="p-2 rounded-lg bg-emerald-100 text-emerald-800">
                <Star className="w-5 h-5 text-emerald-700 fill-emerald-600" />
              </div>
              <div>
                <span className="text-[11px] uppercase font-bold text-slate-500 block">
                  Biểu dương
                </span>
                <span className="text-xl font-extrabold text-emerald-800">
                  {soldierComms.length} lượt
                </span>
              </div>
            </div>

            {/* Stat: Reprimands */}
            <div className="bg-white rounded-xl p-3 border border-rose-200 shadow-xs flex items-center space-x-3">
              <div className="p-2 rounded-lg bg-rose-100 text-rose-800">
                <AlertTriangle className="w-5 h-5 text-rose-700" />
              </div>
              <div>
                <span className="text-[11px] uppercase font-bold text-slate-500 block">
                  Phê bình
                </span>
                <span className="text-xl font-extrabold text-rose-800">
                  {soldierReps.length} lượt
                </span>
              </div>
            </div>

            {/* Stat: Rewards */}
            <div className="bg-white rounded-xl p-3 border border-amber-200 shadow-xs flex items-center space-x-3">
              <div className="p-2 rounded-lg bg-amber-100 text-amber-800">
                <Award className="w-5 h-5 text-amber-700" />
              </div>
              <div>
                <span className="text-[11px] uppercase font-bold text-slate-500 block">
                  Khen thưởng
                </span>
                <span className="text-xl font-extrabold text-amber-700">
                  {soldierRewards.length} danh hiệu
                </span>
              </div>
            </div>

            {/* Stat: Personal info info */}
            <div className="bg-white rounded-xl p-3 border border-slate-200 shadow-xs text-xs">
              <div className="text-[11px] text-slate-400 font-bold uppercase">Ngày sinh & Quê quán</div>
              <div className="font-semibold text-slate-800 mt-0.5">
                {formatDateVN(soldier.birthDate) || 'Chưa cập nhật'}
              </div>
              <div className="text-[11px] text-slate-500 truncate" title={soldier.notes}>
                {soldier.notes || 'Không có ghi chú'}
              </div>
            </div>
          </div>
        </div>

        {/* Filter bar for Timeline */}
        <div className="px-5 py-2.5 bg-white border-b border-slate-200 flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="font-bold text-slate-700 flex items-center gap-1.5 uppercase tracking-wide">
            <Clock className="w-4 h-4 text-emerald-700" />
            <span>DÒNG THỜI GIAN THEO DÕI THI ĐUA ({timelineItems.length})</span>
          </div>

          <div className="flex items-center space-x-2">
            {/* Filter type */}
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value as any)}
              className="py-1 px-2.5 rounded border border-slate-300 text-xs font-medium bg-slate-50"
            >
              <option value="ALL">Tất cả sự kiện</option>
              <option value="COMM">Chỉ Biểu dương</option>
              <option value="REP">Chỉ Phê bình</option>
              <option value="REW">Chỉ Khen thưởng</option>
              <option value="LEAVE">Chỉ Đi phép & Tranh thủ</option>
            </select>

            {/* Filter year */}
            <select
              value={filterYear}
              onChange={(e) => setFilterYear(e.target.value === 'ALL' ? 'ALL' : Number(e.target.value))}
              className="py-1 px-2.5 rounded border border-slate-300 text-xs font-medium bg-slate-50"
            >
              <option value="ALL">Tất cả năm</option>
              <option value={2026}>Năm 2026</option>
              <option value={2025}>Năm 2025</option>
            </select>
          </div>
        </div>

        {/* Timeline Content */}
        <div className="p-5 overflow-y-auto flex-1 space-y-4">
          {timelineItems.length === 0 ? (
            <div className="text-center py-12 text-slate-400 italic text-sm">
              Không có sự kiện ghi nhận thi đua nào theo bộ lọc đã chọn.
            </div>
          ) : (
            <div className="relative border-l-2 border-emerald-300 ml-3 pl-5 space-y-5">
              {timelineItems.map((item) => (
                <div key={`${item.type}-${item.id}`} className="relative group">
                  {/* Timeline bullet icon */}
                  <div
                    className={`absolute -left-[29px] top-0.5 w-6 h-6 rounded-full flex items-center justify-center text-white shadow-xs ${
                      item.type === 'COMM'
                        ? 'bg-emerald-600 ring-4 ring-emerald-100'
                        : item.type === 'REP'
                        ? 'bg-rose-600 ring-4 ring-rose-100'
                        : item.type === 'REW'
                        ? 'bg-amber-500 ring-4 ring-amber-100'
                        : 'bg-blue-600 ring-4 ring-blue-100'
                    }`}
                  >
                    {item.type === 'COMM' ? (
                      <Star className="w-3.5 h-3.5 fill-white" />
                    ) : item.type === 'REP' ? (
                      <AlertTriangle className="w-3.5 h-3.5" />
                    ) : item.type === 'REW' ? (
                      <Award className="w-3.5 h-3.5" />
                    ) : (
                      <CalendarCheck className="w-3.5 h-3.5" />
                    )}
                  </div>

                  {/* Card Content */}
                  <div
                    className={`rounded-xl p-3.5 border transition-all ${
                      item.type === 'COMM'
                        ? 'bg-emerald-50/60 border-emerald-200 group-hover:border-emerald-400'
                        : item.type === 'REP'
                        ? 'bg-rose-50/60 border-rose-200 group-hover:border-rose-400'
                        : item.type === 'REW'
                        ? 'bg-amber-50/60 border-amber-200 group-hover:border-amber-400'
                        : 'bg-blue-50/60 border-blue-200 group-hover:border-blue-400'
                    }`}
                  >
                    <div className="flex flex-wrap items-center justify-between gap-1 mb-1">
                      <span
                        className={`text-xs font-bold uppercase tracking-wide ${
                          item.type === 'COMM'
                            ? 'text-emerald-900'
                            : item.type === 'REP'
                            ? 'text-rose-900'
                            : item.type === 'REW'
                            ? 'text-amber-900'
                            : 'text-blue-900'
                        }`}
                      >
                        {formatDateVN(item.date)} &bull; {item.title}
                      </span>

                      {item.statusBadge && (
                        <span
                          className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border ${
                            item.statusBadge === 'Đã khắc phục sửa chữa' || item.statusBadge === 'Đã về đơn vị'
                              ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                              : item.statusBadge === 'Đang nghỉ'
                              ? 'bg-amber-100 text-amber-800 border-amber-300'
                              : item.statusBadge === 'Quá hạn'
                              ? 'bg-rose-100 text-rose-800 border-rose-300'
                              : 'bg-blue-100 text-blue-800 border-blue-300'
                          }`}
                        >
                          {item.statusBadge}
                        </span>
                      )}
                    </div>

                    <div className="text-xs font-semibold text-slate-600 mb-1">
                      {item.subtitle}
                    </div>

                    <p className="text-xs sm:text-sm text-slate-800 leading-relaxed font-medium">
                      {item.details}
                    </p>

                    {item.extraInfo && (
                      <div className="mt-2 text-xs text-slate-600 border-t border-slate-200/60 pt-1.5 italic">
                        {item.extraInfo}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="bg-slate-100 px-5 py-3 border-t border-slate-200 flex justify-between items-center text-xs">
          <span className="text-slate-500">
            Hồ sơ lưu trữ chính quy &bull; Đồn Biên phòng Hòn Sơn
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white font-semibold rounded-lg transition-colors"
          >
            Đóng hồ sơ
          </button>
        </div>
      </div>
    </div>
  );
};
