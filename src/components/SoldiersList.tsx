import React, { useState, useMemo } from 'react';
import {
  Search,
  Plus,
  Upload,
  Edit2,
  Trash2,
  Eye,
  ArrowUpDown,
  Filter,
  FileSpreadsheet,
  X,
  ChevronLeft,
  ChevronRight,
  Shield,
  UserCheck,
} from 'lucide-react';
import { Soldier, MilitaryRank, DepartmentName } from '../types';
import { DEPARTMENTS, MILITARY_RANKS } from '../constants/ranksAndDepartments';
import { formatDateVN } from '../services/storage';

interface SoldiersListProps {
  soldiers: Soldier[];
  onAddSoldier: () => void;
  onEditSoldier: (soldier: Soldier) => void;
  onDeleteSoldier: (soldier: Soldier) => void;
  onDeleteAllSoldiers: () => void;
  isAdmin: boolean;
  onSelectSoldier: (soldier: Soldier) => void;
  onExportExcel: () => void;
  onOpenImportModal: () => void;
}

export const SoldiersList: React.FC<SoldiersListProps> = ({
  soldiers,
  onAddSoldier,
  onEditSoldier,
  onDeleteSoldier,
  onDeleteAllSoldiers,
  isAdmin,
  onSelectSoldier,
  onExportExcel,
  onOpenImportModal,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDept, setSelectedDept] = useState('ALL');
  const [selectedRank, setSelectedRank] = useState('ALL');
  const [selectedStatus, setSelectedStatus] = useState('ALL');
  const [sortAlphabetical, setSortAlphabetical] = useState<'NONE' | 'ASC' | 'DESC'>('NONE');

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 12;

  // Filter and sort
  const filteredSoldiers = useMemo(() => {
    let list = soldiers.filter((s) => {
      const matchSearch =
        s.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.position.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.rank.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (s.notes && s.notes.toLowerCase().includes(searchTerm.toLowerCase()));
      const matchDept = selectedDept === 'ALL' || s.department === selectedDept;
      const matchRank = selectedRank === 'ALL' || s.rank === selectedRank;
      const matchStatus = selectedStatus === 'ALL' || s.status === selectedStatus;
      return matchSearch && matchDept && matchRank && matchStatus;
    });

    if (sortAlphabetical === 'ASC') {
      list = [...list].sort((a, b) => {
        // Vietnamese name sort usually by the last word (Tên) then full name
        const nameA = a.fullName.trim().split(' ').slice(-1)[0] || a.fullName;
        const nameB = b.fullName.trim().split(' ').slice(-1)[0] || b.fullName;
        return nameA.localeCompare(nameB, 'vi');
      });
    } else if (sortAlphabetical === 'DESC') {
      list = [...list].sort((a, b) => {
        const nameA = a.fullName.trim().split(' ').slice(-1)[0] || a.fullName;
        const nameB = b.fullName.trim().split(' ').slice(-1)[0] || b.fullName;
        return nameB.localeCompare(nameA, 'vi');
      });
    }

    return list;
  }, [soldiers, searchTerm, selectedDept, selectedRank, selectedStatus, sortAlphabetical]);

  // Paginated chunk
  const totalPages = Math.ceil(filteredSoldiers.length / pageSize) || 1;
  const paginatedSoldiers = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredSoldiers.slice(start, start + pageSize);
  }, [filteredSoldiers, currentPage, pageSize]);

  const toggleSort = () => {
    if (sortAlphabetical === 'NONE') setSortAlphabetical('ASC');
    else if (sortAlphabetical === 'ASC') setSortAlphabetical('DESC');
    else setSortAlphabetical('NONE');
  };

  return (
    <div className="space-y-4">
      {/* Top Banner */}
      <div className="bg-white rounded-xl p-4 shadow-xs border border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            <Shield className="w-5 h-5 text-emerald-700" />
            <span>DANH SÁCH QUÂN SỐ CÁN BỘ, CHIẾN SĨ</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Quản lý biên chế, thông tin cấp bậc, chức vụ và quá trình công tác tại Đồn BP Hòn Sơn
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={onOpenImportModal}
            className="flex items-center space-x-1.5 px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-900 font-bold text-xs rounded-lg border border-blue-300 transition-colors shadow-xs"
            title="Nhập danh sách từ file Word (.docx) hoặc file JSON"
          >
            <Upload className="w-4 h-4 text-blue-700" />
            <span>📥 Nhập từ file Word / JSON</span>
          </button>

          <button
            onClick={onExportExcel}
            className="flex items-center space-x-1.5 px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-semibold text-xs rounded-lg border border-emerald-300 transition-colors"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-700" />
            <span>Xuất Excel</span>
          </button>

          {isAdmin && (
            <button
              onClick={onDeleteAllSoldiers}
              className="flex items-center space-x-1.5 px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-700 font-semibold text-xs rounded-lg border border-red-300 transition-colors"
            >
              <Trash2 className="w-4 h-4" />
              <span>Xóa tất cả</span>
            </button>
          )}

          <button
            onClick={onAddSoldier}
            className="flex items-center space-x-1.5 px-3.5 py-1.5 bg-emerald-700 hover:bg-emerald-600 active:scale-95 text-white font-semibold text-xs sm:text-sm rounded-lg shadow transition-all border border-emerald-500"
          >
            <Plus className="w-4 h-4 text-amber-300" />
            <span>+ Thêm cán bộ, chiến sĩ</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-xl p-3 shadow-xs border border-slate-200 flex flex-col lg:flex-row gap-2.5 items-center">
        {/* Search */}
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
          <input
            type="text"
            placeholder="Tìm theo họ tên, chức vụ, cấp bậc..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
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

        {/* Department Filter */}
        <div className="w-full sm:w-56">
          <select
            value={selectedDept}
            onChange={(e) => {
              setSelectedDept(e.target.value);
              setCurrentPage(1);
            }}
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

        {/* Rank Filter */}
        <div className="w-full sm:w-44">
          <select
            value={selectedRank}
            onChange={(e) => {
              setSelectedRank(e.target.value);
              setCurrentPage(1);
            }}
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

        {/* Status Filter */}
        <div className="w-full sm:w-40">
          <select
            value={selectedStatus}
            onChange={(e) => {
              setSelectedStatus(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full py-1.5 px-3 text-xs sm:text-sm rounded-lg border border-slate-300 bg-slate-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-emerald-600"
          >
            <option value="ALL">Tất cả Trạng thái</option>
            <option value="Đang công tác">Đang công tác</option>
            <option value="Tăng cường">Tăng cường</option>
            <option value="Nghỉ phép">Nghỉ phép</option>
            <option value="Đi học">Đi học</option>
            <option value="Đi viện">Đi viện</option>
          </select>
        </div>

        {/* Sort ABC Button */}
        <button
          onClick={toggleSort}
          className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg border text-xs font-semibold transition-colors shrink-0 ${
            sortAlphabetical !== 'NONE'
              ? 'bg-amber-100 text-amber-900 border-amber-300'
              : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-300'
          }`}
          title="Sắp xếp theo thứ tự bảng chữ cái ABC"
        >
          <ArrowUpDown className="w-3.5 h-3.5" />
          <span>
            {sortAlphabetical === 'NONE'
              ? 'Xếp ABC'
              : sortAlphabetical === 'ASC'
              ? 'ABC (A-Z)'
              : 'ABC (Z-A)'}
          </span>
        </button>
      </div>

      {/* Soldiers Table */}
      <div className="bg-white rounded-xl shadow-xs border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[840px]">
            <thead>
              <tr className="bg-emerald-950 text-white text-xs font-bold uppercase tracking-wider">
                <th className="py-3 px-3 text-center w-12">STT</th>
                <th className="py-3 px-4">Họ và tên</th>
                <th className="py-3 px-3 text-center w-32">Cấp bậc</th>
                <th className="py-3 px-4">Chức vụ</th>
                <th className="py-3 px-4">Đội / Trạm / Bộ phận</th>
                <th className="py-3 px-3 text-center w-28">Ngày sinh</th>
                <th className="py-3 px-3 text-center w-32">Trạng thái</th>
                <th className="py-3 px-4">Ghi chú</th>
                <th className="py-3 px-3 text-center w-28">Thao tác</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-200 text-xs sm:text-sm">
              {paginatedSoldiers.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400 italic">
                    Không có quân nhân nào phù hợp với bộ lọc tìm kiếm.
                  </td>
                </tr>
              ) : (
                paginatedSoldiers.map((soldier, idx) => {
                  const actualStt = (currentPage - 1) * pageSize + idx + 1;
                  return (
                    <tr
                      key={soldier.id}
                      className="hover:bg-slate-50/80 transition-colors group"
                    >
                      {/* STT */}
                      <td className="py-3 px-3 text-center text-slate-500 font-mono text-xs">
                        {soldier.stt || actualStt}
                      </td>

                      {/* Họ và tên */}
                      <td className="py-3 px-4 font-bold text-slate-900">
                        <button
                          onClick={() => onSelectSoldier(soldier)}
                          className="hover:text-emerald-700 hover:underline flex items-center gap-1.5 text-left"
                          title="Bấm để xem hồ sơ cá nhân"
                        >
                          <span>{soldier.fullName}</span>
                          <Eye className="w-3.5 h-3.5 text-slate-400 group-hover:text-emerald-700" />
                        </button>
                      </td>

                      {/* Cấp bậc */}
                      <td className="py-3 px-3 text-center">
                        <span className="inline-block px-2.5 py-0.5 rounded text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
                          {soldier.rank}
                        </span>
                      </td>

                      {/* Chức vụ */}
                      <td className="py-3 px-4 font-medium text-slate-800">
                        {soldier.position}
                      </td>

                      {/* Bộ phận */}
                      <td className="py-3 px-4 text-slate-600">
                        {soldier.department}
                      </td>

                      {/* Ngày sinh */}
                      <td className="py-3 px-3 text-center text-slate-600 font-mono text-xs">
                        {formatDateVN(soldier.birthDate) || '-'}
                      </td>

                      {/* Trạng thái */}
                      <td className="py-3 px-3 text-center">
                        <span
                          className={`inline-block px-2 py-0.5 rounded-full text-[11px] font-semibold border ${
                            soldier.status === 'Đang công tác'
                              ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                              : soldier.status === 'Nghỉ phép'
                              ? 'bg-blue-100 text-blue-800 border-blue-300'
                              : 'bg-amber-100 text-amber-800 border-amber-300'
                          }`}
                        >
                          {soldier.status}
                        </span>
                      </td>

                      {/* Ghi chú */}
                      <td className="py-3 px-4 text-xs text-slate-500 max-w-sm" title={soldier.notes}>
                        {soldier.notes || '-'}
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-3 text-center">
                        <div className="flex items-center justify-center space-x-1.5">
                          <button
                            onClick={() => onEditSoldier(soldier)}
                            className="p-1 rounded hover:bg-slate-100 text-slate-600 hover:text-emerald-700 transition-colors"
                            title="Sửa thông tin"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => onDeleteSoldier(soldier)}
                            className="p-1 rounded hover:bg-rose-50 text-slate-400 hover:text-rose-600 transition-colors"
                            title="Xóa khỏi danh sách"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        <div className="bg-slate-50 px-4 py-3 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-600">
          <div>
            Hiển thị <strong>{filteredSoldiers.length > 0 ? (currentPage - 1) * pageSize + 1 : 0}</strong> -{' '}
            <strong>{Math.min(currentPage * pageSize, filteredSoldiers.length)}</strong> trong tổng số{' '}
            <strong>{filteredSoldiers.length}</strong> cán bộ, chiến sĩ
          </div>

          {totalPages > 1 && (
            <div className="flex items-center space-x-1.5">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="p-1 rounded border border-slate-300 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-white"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                <button
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  className={`w-7 h-7 rounded font-medium text-xs transition-colors ${
                    currentPage === page
                      ? 'bg-emerald-700 text-white font-bold'
                      : 'hover:bg-slate-200 text-slate-700'
                  }`}
                >
                  {page}
                </button>
              ))}

              <button
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="p-1 rounded border border-slate-300 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-white"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
