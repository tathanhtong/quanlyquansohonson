import React, { useState, useMemo } from 'react';
import {
  CalendarCheck,
  Search,
  Filter,
  PlusCircle,
  FileSpreadsheet,
  Printer,
  Clock,
  MapPin,
  CheckCircle2,
  AlertTriangle,
  Users,
  ShieldCheck,
  Edit2,
  Trash2,
  Eye,
  Calendar,
  Sparkles,
} from 'lucide-react';
import { DepartmentName, LeaveCategory, LeaveRecord, LeaveStatus, Soldier } from '../types';
import { DEPARTMENTS } from '../constants/ranksAndDepartments';
import { formatDateVN } from '../services/storage';

interface LeaveTrackerProps {
  leaves: LeaveRecord[];
  soldiers: Soldier[];
  selectedMonth: number;
  selectedYear: number;
  onOpenAddLeave: () => void;
  onOpenEditLeave: (item: LeaveRecord) => void;
  onDeleteLeave: (item: LeaveRecord) => void;
  onMarkReturned: (id: string, returnDate: string) => void;
  onExportExcel: () => void;
  onSelectSoldier: (soldier: Soldier) => void;
}

export const LeaveTracker: React.FC<LeaveTrackerProps> = ({
  leaves,
  soldiers,
  selectedMonth,
  selectedYear,
  onOpenAddLeave,
  onOpenEditLeave,
  onDeleteLeave,
  onMarkReturned,
  onExportExcel,
  onSelectSoldier,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('ALL');
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [filterDept, setFilterDept] = useState<string>('ALL');
  const [filterPeriod, setFilterPeriod] = useState<'MONTH' | 'YEAR' | 'ALL'>('MONTH');

  // Deduplicate leaves by id to prevent duplicate keys across rapid syncs
  const uniqueLeaves = useMemo(() => {
    const map = new Map<string, LeaveRecord>();
    (leaves || []).forEach((item) => {
      if (item && item.id) {
        map.set(item.id, item);
      }
    });
    return Array.from(map.values());
  }, [leaves]);

  // Filter leaves based on period and search filters
  const filteredLeaves = useMemo(() => {
    return uniqueLeaves.filter((item) => {
      // Period filter
      if (filterPeriod === 'MONTH') {
        const itemDate = new Date(item.startDate);
        const itemMonth = itemDate.getMonth() + 1;
        const itemYear = itemDate.getFullYear();
        if (itemMonth !== selectedMonth || itemYear !== selectedYear) return false;
      } else if (filterPeriod === 'YEAR') {
        const itemYear = new Date(item.startDate).getFullYear();
        if (itemYear !== selectedYear) return false;
      }

      // Search keyword
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        const matchName = item.fullName.toLowerCase().includes(q);
        const matchRank = item.rank.toLowerCase().includes(q);
        const matchPos = item.position.toLowerCase().includes(q);
        const matchDest = item.destination.toLowerCase().includes(q);
        const matchReason = item.reason.toLowerCase().includes(q);
        const matchLicense = item.licenseNumber?.toLowerCase().includes(q) || false;
        if (!matchName && !matchRank && !matchPos && !matchDest && !matchReason && !matchLicense) {
          return false;
        }
      }

      // Category filter
      if (filterCategory !== 'ALL' && item.category !== filterCategory) {
        return false;
      }

      // Status filter
      if (filterStatus !== 'ALL' && item.status !== filterStatus) {
        return false;
      }

      // Department filter
      if (filterDept !== 'ALL' && item.department !== filterDept) {
        return false;
      }

      return true;
    });
  }, [uniqueLeaves, filterPeriod, selectedMonth, selectedYear, searchTerm, filterCategory, filterStatus, filterDept]);

  // Key Statistics
  const stats = useMemo(() => {
    const totalInPeriod = filteredLeaves.length;
    const currentlyOnLeave = leaves.filter((l) => l.status === 'Đang nghỉ').length;
    const phepCount = leaves.filter((l) => l.category === 'Đi phép' && l.status === 'Đang nghỉ').length;
    const tranhThuCount = leaves.filter((l) => l.category === 'Tranh thủ' && l.status === 'Đang nghỉ').length;
    const returnedCount = filteredLeaves.filter((l) => l.status === 'Đã về đơn vị').length;
    const overdueCount = leaves.filter((l) => l.status === 'Quá hạn').length;

    const totalSoldiers = soldiers.length || 1;
    const presentCount = Math.max(0, totalSoldiers - currentlyOnLeave);
    const presentPercentage = ((presentCount / totalSoldiers) * 100).toFixed(1);

    return {
      totalInPeriod,
      currentlyOnLeave,
      phepCount,
      tranhThuCount,
      returnedCount,
      overdueCount,
      presentCount,
      totalSoldiers,
      presentPercentage,
    };
  }, [leaves, filteredLeaves, soldiers]);

  const handlePrint = () => {
    window.print();
  };

  const handleQuickReturn = (item: LeaveRecord) => {
    const today = new Date().toISOString().split('T')[0];
    onMarkReturned(item.id, today);
  };

  return (
    <div className="space-y-5">
      {/* Top Banner & Header */}
      <div className="bg-gradient-to-r from-emerald-950 via-emerald-900 to-teal-950 rounded-xl p-5 sm:p-6 text-white shadow-md border-l-4 border-amber-400 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-amber-300 text-xs sm:text-sm font-semibold tracking-wide uppercase">
            <ShieldCheck className="w-4 h-4" />
            <span>Đồn Biên phòng Hòn Sơn &bull; Quản lý quân số sẵn sàng chiến đấu (SSSCĐ)</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold font-serif text-white mt-1">
            Theo dõi quân số Đi phép & Tranh thủ
          </h2>
          <p className="text-emerald-100 text-xs sm:text-sm mt-1 max-w-3xl leading-relaxed">
            Quản lý, tổng hợp danh sách cán bộ, chiến sĩ đi nghỉ phép năm, phép đặc biệt, phép bù và nghỉ tranh thủ;
            theo dõi thời gian đi, ngày về thực tế, địa điểm và bảo đảm quân số trực sẵn sàng chiến đấu theo quy định.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2.5 self-start md:self-auto">
          <button
            onClick={onOpenAddLeave}
            className="px-4 py-2.5 bg-amber-400 hover:bg-amber-300 active:scale-95 text-slate-900 font-bold text-xs sm:text-sm rounded-lg shadow-md transition-all flex items-center space-x-1.5"
          >
            <PlusCircle className="w-4 h-4 text-slate-900" />
            <span>+ Thêm lượt đi phép / tranh thủ</span>
          </button>

          <button
            onClick={onExportExcel}
            className="px-3.5 py-2.5 bg-emerald-800 hover:bg-emerald-700 text-white font-medium text-xs sm:text-sm rounded-lg shadow border border-emerald-600 transition-colors flex items-center space-x-1.5"
            title="Xuất danh sách ra file Excel"
          >
            <FileSpreadsheet className="w-4 h-4 text-amber-300" />
            <span className="hidden sm:inline">Xuất Excel</span>
          </button>

          <button
            onClick={handlePrint}
            className="px-3 py-2.5 bg-slate-800 hover:bg-slate-700 text-white font-medium text-xs sm:text-sm rounded-lg shadow border border-slate-700 transition-colors flex items-center space-x-1.5"
            title="In danh sách (A4)"
          >
            <Printer className="w-4 h-4 text-emerald-300" />
            <span className="hidden sm:inline">In</span>
          </button>
        </div>
      </div>

      {/* KPI Stat Cards (6 Cards) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-3">
        {/* Stat 1: Hiện đang nghỉ (Vắng mặt) */}
        <div className="bg-white rounded-xl p-4 shadow-sm border-t-4 border-amber-500 border border-slate-200">
          <div className="flex items-center justify-between text-xs text-slate-600 font-semibold mb-1">
            <span>Hiện đang vắng mặt</span>
            <Clock className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-2xl font-black text-amber-700 font-serif">
            {stats.currentlyOnLeave}
            <span className="text-xs font-normal text-slate-500 ml-1">đ/c</span>
          </div>
          <div className="text-[11px] text-slate-500 mt-1">Đang nghỉ phép / tranh thủ</div>
        </div>

        {/* Stat 2: Đang đi phép */}
        <div className="bg-white rounded-xl p-4 shadow-sm border-t-4 border-blue-600 border border-slate-200">
          <div className="flex items-center justify-between text-xs text-slate-600 font-semibold mb-1">
            <span>Đang đi phép</span>
            <CalendarCheck className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-2xl font-black text-blue-700 font-serif">
            {stats.phepCount}
            <span className="text-xs font-normal text-slate-500 ml-1">đ/c</span>
          </div>
          <div className="text-[11px] text-slate-500 mt-1">Phép năm, đặc biệt, bù</div>
        </div>

        {/* Stat 3: Đang đi tranh thủ */}
        <div className="bg-white rounded-xl p-4 shadow-sm border-t-4 border-teal-600 border border-slate-200">
          <div className="flex items-center justify-between text-xs text-slate-600 font-semibold mb-1">
            <span>Đang tranh thủ</span>
            <Users className="w-4 h-4 text-teal-600" />
          </div>
          <div className="text-2xl font-black text-teal-700 font-serif">
            {stats.tranhThuCount}
            <span className="text-xs font-normal text-slate-500 ml-1">đ/c</span>
          </div>
          <div className="text-[11px] text-slate-500 mt-1">Tranh thủ cuối tuần/việc riêng</div>
        </div>

        {/* Stat 4: Quân số có mặt tại Đồn */}
        <div className="bg-white rounded-xl p-4 shadow-sm border-t-4 border-emerald-600 border border-slate-200">
          <div className="flex items-center justify-between text-xs text-slate-600 font-semibold mb-1">
            <span>Có mặt tại Đồn</span>
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-black text-emerald-800 font-serif">
            {stats.presentCount} / {stats.totalSoldiers}
          </div>
          <div className="text-[11px] text-emerald-700 font-semibold mt-1">
            Tỷ lệ SSCĐ: {stats.presentPercentage}%
          </div>
        </div>

        {/* Stat 5: Đã về đơn vị đúng hạn */}
        <div className="bg-white rounded-xl p-4 shadow-sm border-t-4 border-emerald-700 border border-slate-200">
          <div className="flex items-center justify-between text-xs text-slate-600 font-semibold mb-1">
            <span>Đã trả phép/về Đồn</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-black text-emerald-700 font-serif">
            {stats.returnedCount}
            <span className="text-xs font-normal text-slate-500 ml-1">lượt</span>
          </div>
          <div className="text-[11px] text-slate-500 mt-1">Chấp hành nghiêm thời gian</div>
        </div>

        {/* Stat 6: Quá hạn */}
        <div className="bg-white rounded-xl p-4 shadow-sm border-t-4 border-rose-500 border border-slate-200">
          <div className="flex items-center justify-between text-xs text-slate-600 font-semibold mb-1">
            <span>Chậm / Quá hạn</span>
            <AlertTriangle className="w-4 h-4 text-rose-600" />
          </div>
          <div className="text-2xl font-black text-rose-700 font-serif">
            {stats.overdueCount}
            <span className="text-xs font-normal text-slate-500 ml-1">đ/c</span>
          </div>
          <div className="text-[11px] text-slate-500 mt-1">Cần liên hệ chấn chỉnh ngay</div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Search Box */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Tìm theo họ tên, cấp bậc, chức vụ, nơi đến, số giấy phép, lý do..."
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs sm:text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:bg-white transition-all"
            />
          </div>

          {/* Period Selector Tabs */}
          <div className="flex items-center bg-slate-100 p-1 rounded-lg border border-slate-200 self-start md:self-auto text-xs font-semibold">
            <button
              onClick={() => setFilterPeriod('MONTH')}
              className={`px-3 py-1.5 rounded-md transition-all ${
                filterPeriod === 'MONTH'
                  ? 'bg-emerald-800 text-white shadow-xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Tháng {selectedMonth}/{selectedYear}
            </button>
            <button
              onClick={() => setFilterPeriod('YEAR')}
              className={`px-3 py-1.5 rounded-md transition-all ${
                filterPeriod === 'YEAR'
                  ? 'bg-emerald-800 text-white shadow-xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Cả năm {selectedYear}
            </button>
            <button
              onClick={() => setFilterPeriod('ALL')}
              className={`px-3 py-1.5 rounded-md transition-all ${
                filterPeriod === 'ALL'
                  ? 'bg-emerald-800 text-white shadow-xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Tất cả các năm
            </button>
          </div>
        </div>

        {/* Filters Row */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-2 border-t border-slate-100">
          {/* Category Filter */}
          <div className="flex items-center space-x-2">
            <span className="text-xs font-semibold text-slate-600 whitespace-nowrap">Phân loại:</span>
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="flex-1 px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-md text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-emerald-600"
            >
              <option value="ALL">Tất cả (Đi phép & Tranh thủ)</option>
              <option value="Đi phép">Chỉ Đi phép</option>
              <option value="Tranh thủ">Chỉ Đi tranh thủ</option>
            </select>
          </div>

          {/* Status Filter */}
          <div className="flex items-center space-x-2">
            <span className="text-xs font-semibold text-slate-600 whitespace-nowrap">Trạng thái:</span>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="flex-1 px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-md text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-emerald-600 font-medium"
            >
              <option value="ALL">Tất cả trạng thái</option>
              <option value="Đang nghỉ">Đang nghỉ (Hiện vắng mặt)</option>
              <option value="Đã về đơn vị">Đã về đơn vị (Đúng hạn)</option>
              <option value="Sắp đi">Sắp đi</option>
              <option value="Quá hạn">Quá hạn</option>
            </select>
          </div>

          {/* Department Filter */}
          <div className="flex items-center space-x-2">
            <span className="text-xs font-semibold text-slate-600 whitespace-nowrap">Đội / Trạm:</span>
            <select
              value={filterDept}
              onChange={(e) => setFilterDept(e.target.value)}
              className="flex-1 px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-md text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-emerald-600"
            >
              <option value="ALL">Tất cả đội, trạm, bộ phận</option>
              {DEPARTMENTS.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Main Table Card */}
      <div className="bg-white rounded-xl shadow-md border border-slate-300 overflow-hidden">
        {/* Table Title Bar */}
        <div className="bg-gradient-to-r from-emerald-950 via-emerald-900 to-emerald-950 text-white px-5 py-3 border-b-2 border-amber-500/40 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center space-x-2.5">
            <CalendarCheck className="w-5 h-5 text-amber-400" />
            <h3 className="font-bold font-serif text-amber-400 uppercase tracking-wide text-sm sm:text-base">
              BẢNG THEO DÕI QUÂN SỐ ĐI PHÉP & TRANH THỦ &bull; ĐỒN BP HÒN SƠN
            </h3>
          </div>
          <span className="text-xs text-emerald-200">
            Tổng cộng: <strong className="text-amber-300 font-bold">{filteredLeaves.length}</strong> lượt hiển thị
          </span>
        </div>

        {/* Responsive Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[1000px]">
            <thead>
              <tr className="bg-emerald-900/90 text-white text-xs uppercase font-semibold border-b border-emerald-950 tracking-wider">
                <th className="py-3 px-3 text-center w-12 border-r border-emerald-800">STT</th>
                <th className="py-3 px-3 text-center w-28 border-r border-emerald-800">Cấp bậc</th>
                <th className="py-3 px-4 min-w-[170px] border-r border-emerald-800">Họ và tên</th>
                <th className="py-3 px-3 min-w-[150px] border-r border-emerald-800">Chức vụ / Đơn vị</th>
                <th className="py-3 px-3 text-center w-28 border-r border-emerald-800">Phân loại</th>
                <th className="py-3 px-3 min-w-[140px] border-r border-emerald-800">Hình thức nghỉ</th>
                <th className="py-3 px-3 min-w-[160px] border-r border-emerald-800 text-center">Thời gian nghỉ</th>
                <th className="py-3 px-3 min-w-[150px] border-r border-emerald-800">Nơi đến</th>
                <th className="py-3 px-3 min-w-[160px] border-r border-emerald-800">Lý do & Người duyệt</th>
                <th className="py-3 px-3 text-center w-32 border-r border-emerald-800">Trạng thái</th>
                <th className="py-3 px-3 text-center w-28">Thao tác</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-200 text-xs sm:text-sm">
              {filteredLeaves.length === 0 ? (
                <tr>
                  <td colSpan={11} className="py-12 text-center text-slate-400 italic">
                    Không có lượt đi phép hoặc tranh thủ nào phù hợp với điều kiện tìm kiếm.
                  </td>
                </tr>
              ) : (
                filteredLeaves.map((item, idx) => {
                  const soldierObj = soldiers.find((s) => s.id === item.soldierId);

                  return (
                    <tr
                      key={item.id ? `${item.id}-${idx}` : `leave-${idx}`}
                      className="hover:bg-amber-50/40 transition-colors group"
                    >
                      {/* STT */}
                      <td className="py-3 px-3 text-center text-slate-500 font-mono text-xs border-r border-slate-100">
                        {idx + 1}
                      </td>

                      {/* Cấp bậc */}
                      <td className="py-3 px-3 text-center border-r border-slate-100">
                        <span className="inline-block px-2 py-0.5 rounded text-xs font-semibold bg-slate-100 text-slate-800 border border-slate-200">
                          {item.rank}
                        </span>
                      </td>

                      {/* Họ và tên */}
                      <td className="py-3 px-4 font-bold text-slate-900 border-r border-slate-100">
                        <button
                          onClick={() => soldierObj && onSelectSoldier(soldierObj)}
                          className="hover:text-emerald-700 hover:underline text-left font-bold flex items-center gap-1 group-hover:text-emerald-800"
                          title="Bấm để xem hồ sơ cá nhân"
                        >
                          <span>{item.fullName}</span>
                          <Eye className="w-3.5 h-3.5 text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                        </button>
                        {item.licenseNumber && (
                          <div className="text-[11px] font-mono text-emerald-800 font-medium">
                            {item.licenseNumber}
                          </div>
                        )}
                      </td>

                      {/* Chức vụ & Đơn vị */}
                      <td className="py-3 px-3 text-slate-600 border-r border-slate-100 text-xs">
                        <div className="font-semibold text-slate-800">{item.position}</div>
                        <div className="text-[11px] text-slate-500">{item.department}</div>
                      </td>

                      {/* Phân loại Badge */}
                      <td className="py-3 px-3 text-center border-r border-slate-100">
                        {item.category === 'Đi phép' ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold bg-blue-100 text-blue-800 border border-blue-300">
                            Đi phép
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-900 border border-amber-300">
                            Tranh thủ
                          </span>
                        )}
                      </td>

                      {/* Hình thức nghỉ */}
                      <td className="py-3 px-3 text-slate-800 font-medium border-r border-slate-100 text-xs">
                        {item.leaveType}
                      </td>

                      {/* Thời gian */}
                      <td className="py-3 px-3 border-r border-slate-100 text-center">
                        <div className="text-xs font-semibold text-slate-900">
                          {formatDateVN(item.startDate)} &rarr; {formatDateVN(item.endDate)}
                        </div>
                        <div className="text-[11px] text-emerald-800 font-bold mt-0.5">
                          ({item.daysCount} ngày)
                        </div>
                        {item.actualReturnDate && item.status === 'Đã về đơn vị' && (
                          <div className="text-[11px] text-slate-500 mt-0.5">
                            Về: {formatDateVN(item.actualReturnDate)}
                          </div>
                        )}
                      </td>

                      {/* Nơi đến */}
                      <td className="py-3 px-3 text-slate-700 border-r border-slate-100 text-xs">
                        <div className="flex items-center gap-1 font-medium">
                          <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span>{item.destination}</span>
                        </div>
                      </td>

                      {/* Lý do & Người duyệt */}
                      <td className="py-3 px-3 border-r border-slate-100 text-xs">
                        <div className="text-slate-800 leading-snug line-clamp-2" title={item.reason}>
                          {item.reason}
                        </div>
                        <div className="text-[11px] text-slate-500 mt-1 italic">
                          Duyệt: {item.approver}
                        </div>
                      </td>

                      {/* Trạng thái Badge */}
                      <td className="py-3 px-3 text-center border-r border-slate-100">
                        {item.status === 'Đang nghỉ' ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-300 animate-pulse">
                            Đang nghỉ
                          </span>
                        ) : item.status === 'Đã về đơn vị' ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                            Đã về đơn vị
                          </span>
                        ) : item.status === 'Quá hạn' ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold bg-rose-100 text-rose-800 border border-rose-300">
                            Quá hạn
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold bg-blue-100 text-blue-800 border border-blue-300">
                            Sắp đi
                          </span>
                        )}

                        {/* Quick Action: Mark Returned if currently on leave */}
                        {item.status === 'Đang nghỉ' && (
                          <button
                            onClick={() => handleQuickReturn(item)}
                            className="mt-1 block mx-auto text-[11px] text-emerald-700 hover:text-emerald-900 hover:underline font-semibold"
                            title="Xác nhận đồng chí đã có mặt tại đơn vị"
                          >
                            ✓ Trả phép ngay
                          </button>
                        )}
                      </td>

                      {/* Thao tác */}
                      <td className="py-3 px-3 text-center">
                        <div className="flex items-center justify-center space-x-1.5">
                          <button
                            onClick={() => onOpenEditLeave(item)}
                            className="p-1 rounded hover:bg-slate-100 text-slate-600 hover:text-emerald-700 transition-colors"
                            title="Chỉnh sửa thông tin"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => onDeleteLeave(item)}
                            className="p-1 rounded hover:bg-rose-50 text-slate-400 hover:text-rose-600 transition-colors"
                            title="Xóa bản ghi"
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

        {/* Footer Note */}
        <div className="bg-slate-50 px-5 py-3 border-t border-slate-200 text-xs text-slate-500 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center space-x-2">
            <span className="inline-block w-2 h-2 rounded-full bg-emerald-600"></span>
            <span>Quân số đi phép, tranh thủ phải có giấy phép và được Chỉ huy Đồn ký duyệt theo đúng quy định điều lệnh.</span>
          </div>
          <div>Bảo đảm quân số trực sẵn sàng chiến đấu 24/24 tại Đồn BP Hòn Sơn.</div>
        </div>
      </div>
    </div>
  );
};
