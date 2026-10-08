import React, { useState, useMemo } from 'react';
import {
  Search,
  Plus,
  Star,
  Edit2,
  Trash2,
  Calendar,
  Filter,
  X,
  FileSpreadsheet,
  CheckCircle,
} from 'lucide-react';
import { Commendation, Soldier } from '../types';
import { DEPARTMENTS } from '../constants/ranksAndDepartments';
import { formatDateVN } from '../services/storage';

interface CommendationsListProps {
  commendations: Commendation[];
  selectedMonth: number;
  selectedYear: number;
  onOpenAddModal: () => void;
  onEditCommendation: (item: Commendation) => void;
  onDeleteCommendation: (item: Commendation) => void;
  onSelectSoldierById: (soldierId: string) => void;
  onExportExcel: () => void;
}

export const CommendationsList: React.FC<CommendationsListProps> = ({
  commendations,
  selectedMonth,
  selectedYear,
  onOpenAddModal,
  onEditCommendation,
  onDeleteCommendation,
  onSelectSoldierById,
  onExportExcel,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterWeek, setFilterWeek] = useState<string>('ALL');
  const [filterDept, setFilterDept] = useState<string>('ALL');
  const [viewScope, setViewScope] = useState<'MONTH' | 'ALL'>('MONTH');

  const filteredList = useMemo(() => {
    return commendations.filter((c) => {
      if (viewScope === 'MONTH' && (c.month !== selectedMonth || c.year !== selectedYear)) {
        return false;
      }
      if (filterWeek !== 'ALL' && c.weekNumber !== Number(filterWeek)) {
        return false;
      }
      if (filterDept !== 'ALL' && c.department !== filterDept) {
        return false;
      }
      if (searchTerm) {
        const term = searchTerm.toLowerCase();
        const matchName = c.fullName.toLowerCase().includes(term);
        const matchRank = c.rank.toLowerCase().includes(term);
        const matchPos = c.position.toLowerCase().includes(term);
        const matchContent = c.content.toLowerCase().includes(term);
        const matchAchieve = c.achievement.toLowerCase().includes(term);
        const matchProp = c.proposedBy.toLowerCase().includes(term);
        if (!matchName && !matchRank && !matchPos && !matchContent && !matchAchieve && !matchProp) {
          return false;
        }
      }
      return true;
    });
  }, [commendations, viewScope, selectedMonth, selectedYear, filterWeek, filterDept, searchTerm]);

  return (
    <div className="space-y-4">
      {/* Header Bar */}
      <div className="bg-white rounded-xl p-4 shadow-xs border border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            <Star className="w-5 h-5 text-amber-500 fill-amber-500" />
            <span>DANH SÁCH BIỂU DƯƠNG CÁN BỘ, CHIẾN SĨ</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            {viewScope === 'MONTH'
              ? `Tháng ${selectedMonth}/${selectedYear} • Tổng cộng: ${filteredList.length} lượt biểu dương`
              : `Toàn bộ dữ liệu • Tổng cộng: ${filteredList.length} lượt biểu dương`}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Scope toggle */}
          <div className="inline-flex rounded-lg border border-slate-300 p-0.5 bg-slate-100 text-xs font-semibold">
            <button
              onClick={() => setViewScope('MONTH')}
              className={`px-3 py-1 rounded-md transition-colors ${
                viewScope === 'MONTH'
                  ? 'bg-white text-emerald-800 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Tháng {selectedMonth}/{selectedYear}
            </button>
            <button
              onClick={() => setViewScope('ALL')}
              className={`px-3 py-1 rounded-md transition-colors ${
                viewScope === 'ALL'
                  ? 'bg-white text-emerald-800 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Tất cả thời gian
            </button>
          </div>

          <button
            onClick={onExportExcel}
            className="flex items-center space-x-1.5 px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-semibold text-xs rounded-lg border border-emerald-300 transition-colors"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-700" />
            <span>Xuất Excel</span>
          </button>

          <button
            onClick={onOpenAddModal}
            className="flex items-center space-x-1.5 px-3.5 py-1.5 bg-emerald-700 hover:bg-emerald-600 active:scale-95 text-white font-semibold text-xs sm:text-sm rounded-lg shadow transition-all border border-emerald-500"
          >
            <Plus className="w-4 h-4 text-amber-300" />
            <span>+ Thêm biểu dương</span>
          </button>
        </div>
      </div>

      {/* Filter and Search */}
      <div className="bg-white rounded-xl p-3 shadow-xs border border-slate-200 flex flex-col md:flex-row gap-2.5 items-center">
        {/* Search */}
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
          <input
            type="text"
            placeholder="Tìm theo họ tên, nội dung, thành tích, người đề xuất..."
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

        {/* Filter Week */}
        <div className="w-full sm:w-44">
          <select
            value={filterWeek}
            onChange={(e) => setFilterWeek(e.target.value)}
            className="w-full py-1.5 px-3 text-xs sm:text-sm rounded-lg border border-slate-300 bg-slate-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-emerald-600"
          >
            <option value="ALL">Tất cả các tuần</option>
            <option value="1">Tuần 1</option>
            <option value="2">Tuần 2</option>
            <option value="3">Tuần 3</option>
            <option value="4">Tuần 4</option>
            <option value="5">Tuần 5</option>
          </select>
        </div>

        {/* Filter Department */}
        <div className="w-full sm:w-56">
          <select
            value={filterDept}
            onChange={(e) => setFilterDept(e.target.value)}
            className="w-full py-1.5 px-3 text-xs sm:text-sm rounded-lg border border-slate-300 bg-slate-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-emerald-600"
          >
            <option value="ALL">Tất cả Đội / Trạm</option>
            {DEPARTMENTS.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Commendations Table */}
      <div className="bg-white rounded-xl shadow-xs border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[900px]">
            <thead>
              <tr className="bg-emerald-950 text-white text-xs font-bold uppercase tracking-wider">
                <th className="py-3 px-3 text-center w-12">STT</th>
                <th className="py-3 px-3 text-center w-24">Thời gian</th>
                <th className="py-3 px-4 w-48">Cán bộ, chiến sĩ</th>
                <th className="py-3 px-4 w-44">Chức vụ & Đơn vị</th>
                <th className="py-3 px-4">Nội dung biểu dương & Thành tích</th>
                <th className="py-3 px-4 w-44">Hình thức & Đề xuất</th>
                <th className="py-3 px-3 text-center w-24">Thao tác</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-200 text-xs sm:text-sm">
              {filteredList.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400 italic">
                    Chưa có lượt biểu dương nào phù hợp với điều kiện tìm kiếm.
                  </td>
                </tr>
              ) : (
                filteredList.map((item, idx) => (
                  <tr key={item.id} className="hover:bg-amber-50/30 transition-colors">
                    <td className="py-3 px-3 text-center text-slate-500 font-mono text-xs">
                      {idx + 1}
                    </td>

                    <td className="py-3 px-3 text-center">
                      <span className="inline-block px-2 py-0.5 rounded text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                        Tuần {item.weekNumber}
                      </span>
                      <div className="text-[11px] text-slate-500 mt-1">
                        {formatDateVN(item.date)}
                      </div>
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
                      <div className="font-semibold text-slate-900 leading-snug">
                        {item.content}
                      </div>
                      {item.achievement && (
                        <div className="mt-1 text-xs text-slate-600 bg-slate-50 p-1.5 rounded border border-slate-200/80">
                          <strong className="text-emerald-800">Thành tích:</strong> {item.achievement}
                        </div>
                      )}
                      {item.notes && (
                        <div className="mt-1 text-[11px] text-slate-400 italic">
                          Ghi chú: {item.notes}
                        </div>
                      )}
                    </td>

                    <td className="py-3 px-4 text-xs">
                      <span className="inline-block px-2 py-0.5 rounded bg-emerald-50 text-emerald-900 border border-emerald-200 font-semibold mb-1">
                        {item.commendationType}
                      </span>
                      <div className="text-[11px] text-slate-500">
                        Đề xuất: <strong className="text-slate-700">{item.proposedBy}</strong>
                      </div>
                    </td>

                    <td className="py-3 px-3 text-center">
                      <div className="flex items-center justify-center space-x-1.5">
                        <button
                          onClick={() => onEditCommendation(item)}
                          className="p-1 rounded hover:bg-slate-100 text-slate-600 hover:text-emerald-700"
                          title="Sửa biểu dương"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => onDeleteCommendation(item)}
                          className="p-1 rounded hover:bg-rose-50 text-slate-400 hover:text-rose-600"
                          title="Xóa biểu dương"
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
