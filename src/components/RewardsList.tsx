import React, { useState, useMemo } from 'react';
import {
  Search,
  Plus,
  Award,
  Edit2,
  Trash2,
  Calendar,
  X,
  FileSpreadsheet,
  FileCheck2,
} from 'lucide-react';
import { Reward } from '../types';
import { formatDateVN } from '../services/storage';

interface RewardsListProps {
  rewards: Reward[];
  selectedYear: number;
  onOpenAddModal: () => void;
  onEditReward: (item: Reward) => void;
  onDeleteReward: (item: Reward) => void;
  onSelectSoldierById: (soldierId: string) => void;
  onExportExcel: () => void;
}

export const RewardsList: React.FC<RewardsListProps> = ({
  rewards,
  selectedYear,
  onOpenAddModal,
  onEditReward,
  onDeleteReward,
  onSelectSoldierById,
  onExportExcel,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [yearFilter, setYearFilter] = useState<number | 'ALL'>(selectedYear);

  const filteredRewards = useMemo(() => {
    return rewards.filter((rw) => {
      if (yearFilter !== 'ALL' && rw.year !== Number(yearFilter)) {
        return false;
      }
      if (searchTerm) {
        const term = searchTerm.toLowerCase();
        const matchName = rw.fullName.toLowerCase().includes(term);
        const matchRank = rw.rank.toLowerCase().includes(term);
        const matchType = rw.rewardType.toLowerCase().includes(term);
        const matchAchieve = rw.achievement.toLowerCase().includes(term);
        const matchDec = rw.decisionNumber.toLowerCase().includes(term);
        const matchLevel = rw.decisionLevel.toLowerCase().includes(term);
        if (!matchName && !matchRank && !matchType && !matchAchieve && !matchDec && !matchLevel) {
          return false;
        }
      }
      return true;
    });
  }, [rewards, yearFilter, searchTerm]);

  return (
    <div className="space-y-4">
      {/* Header Bar */}
      <div className="bg-white rounded-xl p-4 shadow-xs border border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            <Award className="w-5 h-5 text-amber-500" />
            <span>DANH SÁCH KHEN THƯỞNG CHÍNH THỨC</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Các hình thức khen thưởng cấp trên trao tặng: Chiến sĩ thi đua, Bằng khen, Giấy khen, Huân huy chương
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Year selector */}
          <select
            value={yearFilter}
            onChange={(e) => setYearFilter(e.target.value === 'ALL' ? 'ALL' : Number(e.target.value))}
            className="py-1.5 px-3 text-xs sm:text-sm rounded-lg border border-slate-300 bg-slate-50 font-semibold focus:outline-none focus:ring-1 focus:ring-amber-500"
          >
            <option value="ALL">Tất cả các năm</option>
            <option value={2026}>Năm 2026</option>
            <option value={2025}>Năm 2025</option>
            <option value={2024}>Năm 2024</option>
          </select>

          <button
            onClick={onExportExcel}
            className="flex items-center space-x-1.5 px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-semibold text-xs rounded-lg border border-emerald-300 transition-colors"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-700" />
            <span>Xuất Excel</span>
          </button>

          <button
            onClick={onOpenAddModal}
            className="flex items-center space-x-1.5 px-3.5 py-1.5 bg-amber-600 hover:bg-amber-500 active:scale-95 text-white font-semibold text-xs sm:text-sm rounded-lg shadow transition-all border border-amber-400"
          >
            <Plus className="w-4 h-4" />
            <span>+ Thêm khen thưởng</span>
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="bg-white rounded-xl p-3 shadow-xs border border-slate-200">
        <div className="relative w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
          <input
            type="text"
            placeholder="Tìm theo họ tên, danh hiệu khen thưởng, số quyết định, cấp ký..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs sm:text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-1 focus:ring-amber-500 bg-slate-50 focus:bg-white"
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
      </div>

      {/* Rewards Table */}
      <div className="bg-white rounded-xl shadow-xs border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[900px]">
            <thead>
              <tr className="bg-emerald-950 text-white text-xs font-bold uppercase tracking-wider">
                <th className="py-3 px-3 text-center w-12">STT</th>
                <th className="py-3 px-4 w-48">Cán bộ, chiến sĩ</th>
                <th className="py-3 px-4 w-44">Chức vụ & Đơn vị</th>
                <th className="py-3 px-4 w-52">Hình thức khen thưởng</th>
                <th className="py-3 px-4">Thành tích đạt được</th>
                <th className="py-3 px-4 w-48">Số & Cấp quyết định</th>
                <th className="py-3 px-3 text-center w-24">Thao tác</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-200 text-xs sm:text-sm">
              {filteredRewards.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400 italic">
                    Chưa có quyết định khen thưởng nào phù hợp với bộ lọc tìm kiếm.
                  </td>
                </tr>
              ) : (
                filteredRewards.map((item, idx) => (
                  <tr key={item.id} className="hover:bg-amber-50/30 transition-colors">
                    <td className="py-3 px-3 text-center text-slate-500 font-mono text-xs">
                      {idx + 1}
                    </td>

                    <td className="py-3 px-4">
                      <button
                        onClick={() => onSelectSoldierById(item.soldierId)}
                        className="font-bold text-slate-900 hover:text-emerald-700 hover:underline text-left block"
                      >
                        {item.rank} {item.fullName}
                      </button>
                    </td>

                    <td className="py-3 px-4 text-xs text-slate-700">
                      <div className="font-semibold text-slate-800">{item.position}</div>
                      <div className="text-[11px] text-slate-500">{item.department}</div>
                    </td>

                    <td className="py-3 px-4">
                      <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-amber-100 text-amber-900 border border-amber-300 font-bold text-xs">
                        <Award className="w-3.5 h-3.5 text-amber-700 shrink-0" />
                        <span>{item.rewardType}</span>
                      </div>
                      <div className="text-[11px] text-slate-500 mt-1">Năm khen thưởng: {item.year}</div>
                    </td>

                    <td className="py-3 px-4 text-slate-800">
                      <p className="leading-snug">{item.achievement}</p>
                      {item.notes && (
                        <div className="text-[11px] text-slate-400 italic mt-0.5">
                          Ghi chú: {item.notes}
                        </div>
                      )}
                    </td>

                    <td className="py-3 px-4 text-xs">
                      <div className="font-semibold text-slate-800">
                        Số: {item.decisionNumber || 'Chưa cập nhật'}
                      </div>
                      <div className="text-[11px] text-slate-500">
                        Ngày ký: {formatDateVN(item.decisionDate) || '-'}
                      </div>
                      <div className="text-[11px] text-emerald-800 font-medium mt-0.5">
                        {item.decisionLevel}
                      </div>
                    </td>

                    <td className="py-3 px-3 text-center">
                      <div className="flex items-center justify-center space-x-1.5">
                        <button
                          onClick={() => onEditReward(item)}
                          className="p-1 rounded hover:bg-slate-100 text-slate-600 hover:text-emerald-700"
                          title="Sửa khen thưởng"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => onDeleteReward(item)}
                          className="p-1 rounded hover:bg-rose-50 text-slate-400 hover:text-rose-600"
                          title="Xóa khen thưởng"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
