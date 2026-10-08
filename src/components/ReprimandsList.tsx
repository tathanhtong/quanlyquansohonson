import React, { useState, useMemo } from 'react';
import {
  Search,
  Plus,
  AlertTriangle,
  Edit2,
  Trash2,
  Calendar,
  Filter,
  X,
  FileSpreadsheet,
  CheckCircle2,
  Clock,
  AlertCircle,
} from 'lucide-react';
import { Reprimand } from '../types';
import { DEPARTMENTS } from '../constants/ranksAndDepartments';
import { formatDateVN } from '../services/storage';

interface ReprimandsListProps {
  reprimands: Reprimand[];
  selectedMonth: number;
  selectedYear: number;
  onOpenAddModal: () => void;
  onEditReprimand: (item: Reprimand) => void;
  onDeleteReprimand: (item: Reprimand) => void;
  onSelectSoldierById: (soldierId: string) => void;
  onExportExcel: () => void;
}

export const ReprimandsList: React.FC<ReprimandsListProps> = ({
  reprimands,
  selectedMonth,
  selectedYear,
  onOpenAddModal,
  onEditReprimand,
  onDeleteReprimand,
  onSelectSoldierById,
  onExportExcel,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterWeek, setFilterWeek] = useState<string>('ALL');
  const [filterDept, setFilterDept] = useState<string>('ALL');
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [viewScope, setViewScope] = useState<'MONTH' | 'ALL'>('MONTH');

  const filteredList = useMemo(() => {
    return reprimands.filter((r) => {
      if (viewScope === 'MONTH' && (r.month !== selectedMonth || r.year !== selectedYear)) {
        return false;
      }
      if (filterWeek !== 'ALL' && r.weekNumber !== Number(filterWeek)) {
        return false;
      }
      if (filterDept !== 'ALL' && r.department !== filterDept) {
        return false;
      }
      if (filterStatus !== 'ALL' && r.remediationStatus !== filterStatus) {
        return false;
      }
      if (searchTerm) {
        const term = searchTerm.toLowerCase();
        const matchName = r.fullName.toLowerCase().includes(term);
        const matchRank = r.rank.toLowerCase().includes(term);
        const matchPos = r.position.toLowerCase().includes(term);
        const matchContent = r.content.toLowerCase().includes(term);
        const matchCause = r.defectCause.toLowerCase().includes(term);
        const matchReviewer = r.reviewedBy.toLowerCase().includes(term);
        if (!matchName && !matchRank && !matchPos && !matchContent && !matchCause && !matchReviewer) {
          return false;
        }
      }
      return true;
    });
  }, [reprimands, viewScope, selectedMonth, selectedYear, filterWeek, filterDept, filterStatus, searchTerm]);

  return (
    <div className="space-y-4">
      {/* Header Bar */}
      <div className="bg-white rounded-xl p-4 shadow-xs border border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-rose-600" />
            <span>DANH SÁCH PHÊ BÌNH & NHẮC NHỞ CÁN BỘ, CHIẾN SĨ</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            {viewScope === 'MONTH'
              ? `Tháng ${selectedMonth}/${selectedYear} • Tổng cộng: ${filteredList.length} lượt phê bình`
              : `Toàn bộ dữ liệu • Tổng cộng: ${filteredList.length} lượt phê bình`}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Scope toggle */}
          <div className="inline-flex rounded-lg border border-slate-300 p-0.5 bg-slate-100 text-xs font-semibold">
            <button
              onClick={() => setViewScope('MONTH')}
              className={`px-3 py-1 rounded-md transition-colors ${
                viewScope === 'MONTH'
                  ? 'bg-white text-rose-800 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Tháng {selectedMonth}/{selectedYear}
            </button>
            <button
              onClick={() => setViewScope('ALL')}
              className={`px-3 py-1 rounded-md transition-colors ${
                viewScope === 'ALL'
                  ? 'bg-white text-rose-800 shadow-xs'
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
            className="flex items-center space-x-1.5 px-3.5 py-1.5 bg-rose-700 hover:bg-rose-600 active:scale-95 text-white font-semibold text-xs sm:text-sm rounded-lg shadow transition-all border border-rose-500"
          >
            <Plus className="w-4 h-4 text-amber-300" />
            <span>+ Thêm phê bình</span>
          </button>
        </div>
      </div>

      {/* Filter and Search */}
      <div className="bg-white rounded-xl p-3 shadow-xs border border-slate-200 flex flex-col lg:flex-row gap-2.5 items-center">
        {/* Search */}
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
          <input
            type="text"
            placeholder="Tìm theo họ tên, nội dung khuyết điểm, người nhắc nhở..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs sm:text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-1 focus:ring-rose-500 bg-slate-50 focus:bg-white"
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
        <div className="w-full sm:w-40">
          <select
            value={filterWeek}
            onChange={(e) => setFilterWeek(e.target.value)}
            className="w-full py-1.5 px-3 text-xs sm:text-sm rounded-lg border border-slate-300 bg-slate-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-rose-500"
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
        <div className="w-full sm:w-52">
          <select
            value={filterDept}
            onChange={(e) => setFilterDept(e.target.value)}
            className="w-full py-1.5 px-3 text-xs sm:text-sm rounded-lg border border-slate-300 bg-slate-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-rose-500"
          >
            <option value="ALL">Tất cả Đội / Trạm</option>
            {DEPARTMENTS.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
        </div>

        {/* Filter Remediation Status */}
        <div className="w-full sm:w-48">
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="w-full py-1.5 px-3 text-xs sm:text-sm rounded-lg border border-slate-300 bg-slate-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-rose-500"
          >
            <option value="ALL">Tất cả trạng thái khắc phục</option>
            <option value="Chưa khắc phục">Chưa khắc phục</option>
            <option value="Đang chuyển biến tốt">Đang chuyển biến tốt</option>
            <option value="Đã khắc phục sửa chữa">Đã khắc phục sửa chữa</option>
          </select>
        </div>
      </div>

      {/* Reprimands Table */}
      <div className="bg-white rounded-xl shadow-xs border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[960px]">
            <thead>
              <tr className="bg-emerald-950 text-white text-xs font-bold uppercase tracking-wider">
                <th className="py-3 px-3 text-center w-12">STT</th>
                <th className="py-3 px-3 text-center w-24">Thời gian</th>
                <th className="py-3 px-4 w-48">Cán bộ, chiến sĩ</th>
                <th className="py-3 px-4 w-44">Chức vụ & Đơn vị</th>
                <th className="py-3 px-4">Khuyết điểm & Yêu cầu khắc phục</th>
                <th className="py-3 px-3 text-center w-36">Kết quả khắc phục</th>
                <th className="py-3 px-3 text-center w-24">Thao tác</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-200 text-xs sm:text-sm">
              {filteredList.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400 italic">
                    Không có lượt phê bình nào phù hợp với điều kiện tìm kiếm. Toàn đơn vị chấp hành nghiêm kỷ luật!
                  </td>
                </tr>
              ) : (
                filteredList.map((item, idx) => (
                  <tr key={item.id} className="hover:bg-rose-50/20 transition-colors">
                    <td className="py-3 px-3 text-center text-slate-500 font-mono text-xs">
                      {idx + 1}
                    </td>

                    <td className="py-3 px-3 text-center">
                      <span className="inline-block px-2 py-0.5 rounded text-xs font-bold bg-rose-100 text-rose-800 border border-rose-300">
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
                      <div className="font-semibold text-rose-950 leading-snug">
                        {item.content}
                      </div>

                      {item.defectCause && (
                        <div className="mt-1 text-xs text-slate-600">
                          <strong className="text-slate-700">Nguyên nhân:</strong> {item.defectCause}
                        </div>
                      )}

                      {item.remediationPlan && (
                        <div className="mt-1 text-xs text-slate-700 bg-amber-50/70 p-1.5 rounded border border-amber-200">
                          <strong className="text-amber-900">Yêu cầu khắc phục:</strong> {item.remediationPlan}
                        </div>
                      )}

                      <div className="mt-1 text-[11px] text-slate-500 flex items-center gap-3">
                        <span>Hình thức: <strong className="text-slate-700">{item.reprimandType}</strong></span>
                        <span>Người nhận xét: <strong className="text-slate-700">{item.reviewedBy}</strong></span>
                      </div>
                    </td>

                    <td className="py-3 px-3 text-center">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold border ${
                          item.remediationStatus === 'Đã khắc phục sửa chữa'
                            ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                            : item.remediationStatus === 'Đang chuyển biến tốt'
                            ? 'bg-amber-100 text-amber-800 border-amber-300'
                            : 'bg-rose-100 text-rose-800 border-rose-300'
                        }`}
                      >
                        {item.remediationStatus === 'Đã khắc phục sửa chữa' ? (
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        ) : item.remediationStatus === 'Đang chuyển biến tốt' ? (
                          <Clock className="w-3.5 h-3.5 text-amber-600" />
                        ) : (
                          <AlertCircle className="w-3.5 h-3.5 text-rose-600" />
                        )}
                        <span>{item.remediationStatus}</span>
                      </span>
                    </td>

                    <td className="py-3 px-3 text-center">
                      <div className="flex items-center justify-center space-x-1.5">
                        <button
                          onClick={() => onEditReprimand(item)}
                          className="p-1 rounded hover:bg-slate-100 text-slate-600 hover:text-emerald-700"
                          title="Sửa bản ghi phê bình"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => onDeleteReprimand(item)}
                          className="p-1 rounded hover:bg-rose-50 text-slate-400 hover:text-rose-600"
                          title="Xóa bản ghi"
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
