import React, { useState, useEffect } from 'react';
import { X, CalendarCheck, Save, Clock, MapPin, ShieldCheck, UserCheck, AlertCircle } from 'lucide-react';
import { LeaveCategory, LeaveRecord, LeaveStatus, LeaveType, Soldier } from '../../types';
import { LEAVE_CATEGORIES, LEAVE_TYPES_BY_CATEGORY } from '../../constants/ranksAndDepartments';

interface LeaveModalProps {
  isOpen: boolean;
  soldiers: Soldier[];
  itemToEdit?: LeaveRecord | null;
  onClose: () => void;
  onSave: (data: Omit<LeaveRecord, 'id' | 'createdAt'>) => void | Promise<void>;
}

const COMMON_REASONS = [
  'Nghỉ phép năm định kỳ theo chế độ tiêu chuẩn sĩ quan, QNCN',
  'Nghỉ tranh thủ cuối tuần về thăm gia đình tại địa phương',
  'Giải quyết việc riêng gia đình (việc hiếu, hỷ, người thân ốm)',
  'Nghỉ phép bù sau thời gian trực cao điểm sẵn sàng chiến đấu, phòng chống thiên tai',
  'Nghỉ tranh thủ 24 giờ giải quyết công việc cá nhân có lý do chính đáng',
];

const COMMON_APPROVERS = [
  'Trung tá Võ Thanh Vàng - Đồn trưởng',
  'Trung tá Nguyễn Nguyên Bá - Chính trị viên',
  'Thrung tá Lâm Anh Đoàn - Phó Đồn trưởng QS',
  'Thrung tá Trần Văn Diện - Phó Đồn trưởng NV',
  'Đại uý Lê Thanh Nhàn - Chính trị viên phó',
];

export const LeaveModal: React.FC<LeaveModalProps> = ({
  isOpen,
  soldiers,
  itemToEdit,
  onClose,
  onSave,
}) => {
  const today = new Date().toISOString().split('T')[0];

  const [soldierId, setSoldierId] = useState(soldiers[0]?.id || '');
  const [category, setCategory] = useState<LeaveCategory>('Đi phép');
  const [leaveType, setLeaveType] = useState<LeaveType>('Phép năm');
  const [startDate, setStartDate] = useState(today);
  const [endDate, setEndDate] = useState(today);
  const [daysCount, setDaysCount] = useState<number>(1);
  const [destination, setDestination] = useState('');
  const [reason, setReason] = useState(COMMON_REASONS[0]);
  const [approver, setApprover] = useState(COMMON_APPROVERS[0]);
  const [licenseNumber, setLicenseNumber] = useState('');
  const [status, setStatus] = useState<LeaveStatus>('Đang nghỉ');
  const [actualReturnDate, setActualReturnDate] = useState('');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const selectedSoldier = soldiers.find((s) => s.id === soldierId);

  // Recalculate days count whenever dates change
  useEffect(() => {
    if (startDate && endDate) {
      const start = new Date(startDate).getTime();
      const end = new Date(endDate).getTime();
      if (!isNaN(start) && !isNaN(end) && end >= start) {
        const diffDays = Math.round((end - start) / (1000 * 60 * 60 * 24)) + 1;
        setDaysCount(diffDays);
      }
    }
  }, [startDate, endDate]);

  // Update default leave type when category changes
  const handleCategoryChange = (newCat: LeaveCategory) => {
    setCategory(newCat);
    const types = LEAVE_TYPES_BY_CATEGORY[newCat];
    if (types && types.length > 0) {
      setLeaveType(types[0]);
    }
    if (newCat === 'Tranh thủ') {
      setReason('Nghỉ tranh thủ cuối tuần về thăm gia đình tại địa phương');
      // default 2 days
      const endD = new Date(startDate);
      endD.setDate(endD.getDate() + 1);
      setEndDate(endD.toISOString().split('T')[0]);
    } else {
      setReason('Nghỉ phép năm định kỳ theo chế độ tiêu chuẩn sĩ quan, QNCN');
      // default 10 days
      const endD = new Date(startDate);
      endD.setDate(endD.getDate() + 9);
      setEndDate(endD.toISOString().split('T')[0]);
    }
  };

  useEffect(() => {
    if (itemToEdit) {
      setSoldierId(itemToEdit.soldierId);
      setCategory(itemToEdit.category);
      setLeaveType(itemToEdit.leaveType);
      setStartDate(itemToEdit.startDate);
      setEndDate(itemToEdit.endDate);
      setDaysCount(itemToEdit.daysCount);
      setDestination(itemToEdit.destination);
      setReason(itemToEdit.reason);
      setApprover(itemToEdit.approver);
      setLicenseNumber(itemToEdit.licenseNumber || '');
      setStatus(itemToEdit.status);
      setActualReturnDate(itemToEdit.actualReturnDate || '');
      setNotes(itemToEdit.notes || '');
    } else {
      // Default new entry
      setSoldierId(soldiers[0]?.id || '');
      setCategory('Đi phép');
      setLeaveType('Phép năm');
      setStartDate(today);
      const endD = new Date();
      endD.setDate(endD.getDate() + 9);
      setEndDate(endD.toISOString().split('T')[0]);
      setDestination('');
      setReason(COMMON_REASONS[0]);
      setApprover(COMMON_APPROVERS[0]);
      setLicenseNumber(`GP-${Math.floor(10 + Math.random() * 90)}/ĐBP`);
      setStatus('Đang nghỉ');
      setActualReturnDate('');
      setNotes('');
    }
  }, [itemToEdit, isOpen, soldiers]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSoldier) return;

    try {
      setIsSubmitting(true);
      const leaveData: any = {
        soldierId: selectedSoldier.id,
        fullName: selectedSoldier.fullName,
        rank: selectedSoldier.rank,
        position: selectedSoldier.position,
        department: selectedSoldier.department,
        category,
        leaveType,
        startDate,
        endDate,
        daysCount: Number(daysCount) || 1,
        destination: destination.trim() || 'Gia đình',
        reason: reason.trim() || 'Giải quyết việc riêng',
        approver: approver.trim() || 'Chỉ huy Đồn',
        status,
      };

      if (licenseNumber.trim()) {
        leaveData.licenseNumber = licenseNumber.trim();
      }
      if (status === 'Đã về đơn vị') {
        leaveData.actualReturnDate = actualReturnDate || endDate;
      }
      if (notes.trim()) {
        leaveData.notes = notes.trim();
      }

      await onSave(leaveData);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full my-auto overflow-hidden border border-slate-200 animate-in fade-in zoom-in duration-150 flex flex-col max-h-[92vh]">
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-emerald-950 via-emerald-900 to-emerald-950 text-white px-4 py-3 sm:px-6 sm:py-4 flex items-center justify-between border-b-2 border-amber-500/50 shrink-0">
          <div className="flex items-center space-x-2 sm:space-x-2.5">
            <div className="p-1.5 sm:p-2 rounded-lg bg-emerald-800 text-amber-400 border border-amber-500/30">
              <CalendarCheck className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div>
              <h3 className="text-sm sm:text-lg font-bold font-serif text-amber-400 uppercase tracking-wide">
                {itemToEdit ? 'Chỉnh sửa lượt đi phép / tranh thủ' : 'Đăng ký lượt đi phép / tranh thủ'}
              </h3>
              <p className="text-[11px] sm:text-xs text-emerald-200 line-clamp-1 sm:line-clamp-none">
                Quản lý quân số vắng mặt, bảo đảm quân số trực SSCĐ tại Đồn BP Hòn Sơn
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-emerald-300 hover:text-white hover:bg-emerald-800/80 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-3.5 sm:space-y-4 overflow-y-auto">
          {/* Soldier Selector */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              1. Chọn cán bộ, chiến sĩ <span className="text-rose-600">*</span>
            </label>
            <select
              value={soldierId}
              onChange={(e) => setSoldierId(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:bg-white transition-all font-medium"
              required
            >
              {soldiers.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.rank} {s.fullName} — {s.position} ({s.department})
                </option>
              ))}
            </select>
          </div>

          {/* Selected Soldier Card Overview */}
          {selectedSoldier && (
            <div className="p-3 bg-emerald-50/70 border border-emerald-200 rounded-lg flex items-center justify-between text-xs text-slate-700">
              <div className="flex items-center space-x-2">
                <span className="font-bold text-emerald-950 text-sm">{selectedSoldier.fullName}</span>
                <span className="px-2 py-0.5 rounded bg-emerald-100 font-semibold text-emerald-800 border border-emerald-300">
                  {selectedSoldier.rank}
                </span>
                <span className="text-slate-600">{selectedSoldier.position}</span>
              </div>
              <span className="text-slate-500 italic">{selectedSoldier.department}</span>
            </div>
          )}

          {/* Category Toggle: Đi phép vs Tranh thủ */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              2. Phân loại hình thức vắng mặt <span className="text-rose-600">*</span>
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => handleCategoryChange('Đi phép')}
                className={`py-2.5 px-4 rounded-xl border text-sm font-bold flex items-center justify-center space-x-2 transition-all ${
                  category === 'Đi phép'
                    ? 'bg-blue-700 text-white border-blue-800 shadow-md ring-2 ring-blue-400/40'
                    : 'bg-slate-50 text-slate-700 border-slate-300 hover:bg-slate-100'
                }`}
              >
                <CalendarCheck className="w-4 h-4 text-blue-300" />
                <span>ĐI PHÉP (Phép năm, đặc biệt, bù...)</span>
              </button>

              <button
                type="button"
                onClick={() => handleCategoryChange('Tranh thủ')}
                className={`py-2.5 px-4 rounded-xl border text-sm font-bold flex items-center justify-center space-x-2 transition-all ${
                  category === 'Tranh thủ'
                    ? 'bg-amber-600 text-white border-amber-700 shadow-md ring-2 ring-amber-400/40'
                    : 'bg-slate-50 text-slate-700 border-slate-300 hover:bg-slate-100'
                }`}
              >
                <Clock className="w-4 h-4 text-amber-200" />
                <span>ĐI TRANH THỦ (Cuối tuần, việc gia đình...)</span>
              </button>
            </div>
          </div>

          {/* Detailed Leave Type */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              3. Hình thức cụ thể <span className="text-rose-600">*</span>
            </label>
            <div className="flex flex-wrap gap-1.5 mb-2">
              {(LEAVE_TYPES_BY_CATEGORY[category] || []).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setLeaveType(t)}
                  className={`text-xs px-2.5 py-1 rounded-full border transition-all ${
                    leaveType === t
                      ? 'bg-emerald-800 text-white border-emerald-900 font-semibold shadow-xs'
                      : 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
            <input
              type="text"
              value={leaveType}
              onChange={(e) => setLeaveType(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:bg-white"
              placeholder="Nhập hình thức cụ thể..."
              required
            />
          </div>

          {/* Time & Duration: Start Date, End Date, Days Count */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-slate-50 p-3.5 rounded-xl border border-slate-200">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Từ ngày <span className="text-rose-600">*</span>
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-600 font-medium"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Đến ngày <span className="text-rose-600">*</span>
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                min={startDate}
                className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-600 font-medium"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Số ngày nghỉ
              </label>
              <div className="flex items-center space-x-1.5">
                <input
                  type="number"
                  min="1"
                  max="45"
                  value={daysCount}
                  onChange={(e) => setDaysCount(Number(e.target.value))}
                  className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-600 font-bold text-center"
                  required
                />
                <span className="text-xs text-slate-600 font-medium">ngày</span>
              </div>
            </div>
          </div>

          {/* Destination & License Number */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1 flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-emerald-700" />
                <span>Nơi đến / Địa chỉ gia đình</span> <span className="text-rose-600">*</span>
              </label>
              <input
                type="text"
                value={destination}
                onChange={(e) => setDestination(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:bg-white"
                placeholder="VD: TP. Rạch Giá, Kiên Giang / Xã Lại Sơn"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Số giấy phép / Công văn
              </label>
              <input
                type="text"
                value={licenseNumber}
                onChange={(e) => setLicenseNumber(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:bg-white font-mono"
                placeholder="VD: GP-18/ĐBP hoặc TT-05/ĐBP"
              />
            </div>
          </div>

          {/* Reason */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Lý do nghỉ / Mục đích <span className="text-rose-600">*</span>
            </label>
            <div className="flex flex-wrap gap-1.5 mb-2">
              {COMMON_REASONS.slice(0, 3).map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setReason(r)}
                  className="text-[11px] px-2.5 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 text-left transition-colors"
                >
                  &bull; {r}
                </button>
              ))}
            </div>
            <textarea
              rows={2}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:bg-white leading-relaxed"
              placeholder="Nhập lý do nghỉ cụ thể..."
              required
            />
          </div>

          {/* Approver & Status */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1 flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-700" />
                <span>Cấp / Người phê duyệt</span> <span className="text-rose-600">*</span>
              </label>
              <select
                value={approver}
                onChange={(e) => setApprover(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:bg-white font-medium"
              >
                {COMMON_APPROVERS.map((app) => (
                  <option key={app} value={app}>
                    {app}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1 flex items-center gap-1">
                <UserCheck className="w-3.5 h-3.5 text-emerald-700" />
                <span>Trạng thái hiện tại</span> <span className="text-rose-600">*</span>
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as LeaveStatus)}
                className={`w-full px-3 py-2 border rounded-lg text-sm font-bold focus:outline-none focus:ring-2 focus:ring-emerald-600 ${
                  status === 'Đang nghỉ'
                    ? 'bg-amber-50 text-amber-800 border-amber-300'
                    : status === 'Đã về đơn vị'
                    ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                    : status === 'Quá hạn'
                    ? 'bg-rose-50 text-rose-800 border-rose-300'
                    : 'bg-blue-50 text-blue-800 border-blue-300'
                }`}
              >
                <option value="Đang nghỉ">Đang nghỉ (Hiện vắng mặt)</option>
                <option value="Đã về đơn vị">Đã về đơn vị (Đúng hạn)</option>
                <option value="Sắp đi">Sắp đi (Chờ ngày khởi hành)</option>
                <option value="Quá hạn">Quá hạn (Chưa có mặt theo quy định)</option>
              </select>
            </div>
          </div>

          {/* Actual return date if returned */}
          {status === 'Đã về đơn vị' && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg flex items-center gap-3">
              <label className="text-xs font-bold text-emerald-900 whitespace-nowrap">
                Ngày thực tế về đơn vị:
              </label>
              <input
                type="date"
                value={actualReturnDate || endDate}
                onChange={(e) => setActualReturnDate(e.target.value)}
                className="px-3 py-1 bg-white border border-emerald-300 rounded-md text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-600 font-semibold"
              />
            </div>
          )}

          {/* Notes */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Ghi chú thêm (Bàn giao nhiệm vụ, số điện thoại liên lạc...)
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:bg-white"
              placeholder="VD: Đã bàn giao ca trực, duy trì liên lạc điện thoại 24/24..."
            />
          </div>

          {/* Action Buttons */}
          <div className="pt-3 border-t border-slate-200 flex items-center justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-semibold rounded-lg transition-colors"
            >
              Hủy bỏ
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 bg-emerald-700 hover:bg-emerald-600 text-white font-bold text-sm rounded-lg shadow-md hover:shadow-lg transition-all flex items-center space-x-1.5 disabled:opacity-50 cursor-pointer"
            >
              <Save className="w-4 h-4 text-amber-300" />
              <span>{isSubmitting ? 'ĐANG LƯU...' : (itemToEdit ? 'LƯU CẬP NHẬT' : 'LƯU LƯỢT ĐI PHÉP / TRANH THỦ')}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
