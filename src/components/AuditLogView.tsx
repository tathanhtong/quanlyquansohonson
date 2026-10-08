import React, { useState, useMemo } from 'react';
import {
  History,
  Search,
  Filter,
  Clock,
  Shield,
  User,
  PlusCircle,
  Edit2,
  Trash2,
  Database,
  X,
} from 'lucide-react';
import { AuditLog } from '../types';
import { formatDateVN } from '../services/storage';

interface AuditLogViewProps {
  logs: AuditLog[];
}

export const AuditLogView: React.FC<AuditLogViewProps> = ({ logs }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [actionFilter, setActionFilter] = useState<string>('ALL');

  const filteredLogs = useMemo(() => {
    return logs.filter((l) => {
      if (actionFilter !== 'ALL' && l.action !== actionFilter) return false;
      if (searchTerm) {
        const term = searchTerm.toLowerCase();
        const matchUser = l.user.toLowerCase().includes(term);
        const matchType = l.targetType.toLowerCase().includes(term);
        const matchDetails = l.details.toLowerCase().includes(term);
        if (!matchUser && !matchType && !matchDetails) return false;
      }
      return true;
    });
  }, [logs, actionFilter, searchTerm]);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="bg-white rounded-xl p-4 shadow-xs border border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            <History className="w-5 h-5 text-emerald-700" />
            <span>NHẬT KÝ HOẠT ĐỘNG VÀ LỊCH SỬ THAY ĐỔI DỮ LIỆU</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Ghi nhận tự động mọi thao tác thêm mới, chỉnh sửa, xóa và sao lưu dữ liệu trong hệ thống
          </p>
        </div>

        <div className="text-xs text-slate-500 bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200">
          Tổng số bản ghi nhật ký: <strong>{logs.length}</strong>
        </div>
      </div>

      {/* Filter and Search */}
      <div className="bg-white rounded-xl p-3 shadow-xs border border-slate-200 flex flex-col sm:flex-row gap-2.5 items-center">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
          <input
            type="text"
            placeholder="Tìm theo người thực hiện, nội dung chi tiết..."
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

        <div className="w-full sm:w-48">
          <select
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
            className="w-full py-1.5 px-3 text-xs sm:text-sm rounded-lg border border-slate-300 bg-slate-50 focus:outline-none focus:ring-1 focus:ring-emerald-600"
          >
            <option value="ALL">Tất cả hành động</option>
            <option value="THÊM">Thêm mới</option>
            <option value="SỬA">Chỉnh sửa</option>
            <option value="XÓA">Xóa dữ liệu</option>
            <option value="SAO LƯU">Sao lưu dữ liệu</option>
            <option value="KHÔI PHỤC">Khôi phục</option>
          </select>
        </div>
      </div>

      {/* Logs Table */}
      <div className="bg-white rounded-xl shadow-xs border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs sm:text-sm">
            <thead>
              <tr className="bg-emerald-950 text-white text-xs font-bold uppercase tracking-wider">
                <th className="py-3 px-3 text-center w-12">STT</th>
                <th className="py-3 px-4 w-44">Thời gian</th>
                <th className="py-3 px-3 text-center w-28">Hành động</th>
                <th className="py-3 px-3 text-center w-28">Đối tượng</th>
                <th className="py-3 px-4 w-36">Người thực hiện</th>
                <th className="py-3 px-4">Nội dung thao tác</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400 italic text-xs">
                    Không có nhật ký nào phù hợp với điều kiện tìm kiếm.
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log, idx) => {
                  const dateObj = new Date(log.timestamp);
                  const timeFormatted = isNaN(dateObj.getTime())
                    ? log.timestamp
                    : `${dateObj.toLocaleTimeString('vi-VN')} - ${formatDateVN(
                        dateObj.toISOString().slice(0, 10)
                      )}`;

                  return (
                    <tr key={log.id} className="hover:bg-slate-50 transition-colors">
                      <td className="py-2.5 px-3 text-center text-slate-400 font-mono text-xs">
                        {idx + 1}
                      </td>

                      <td className="py-2.5 px-4 font-mono text-xs text-slate-600">
                        {timeFormatted}
                      </td>

                      <td className="py-2.5 px-3 text-center">
                        <span
                          className={`inline-block px-2 py-0.5 rounded text-[11px] font-bold border ${
                            log.action === 'THÊM'
                              ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                              : log.action === 'SỬA'
                              ? 'bg-blue-100 text-blue-800 border-blue-300'
                              : log.action === 'XÓA'
                              ? 'bg-rose-100 text-rose-800 border-rose-300'
                              : 'bg-amber-100 text-amber-800 border-amber-300'
                          }`}
                        >
                          {log.action}
                        </span>
                      </td>

                      <td className="py-2.5 px-3 text-center font-medium text-slate-700">
                        {log.targetType}
                      </td>

                      <td className="py-2.5 px-4 font-semibold text-slate-800">
                        {log.user}
                      </td>

                      <td className="py-2.5 px-4 text-slate-700 leading-snug">
                        {log.details}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
