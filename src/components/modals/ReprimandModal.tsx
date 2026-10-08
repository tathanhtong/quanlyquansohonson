import React, { useState, useEffect } from 'react';
import { X, AlertTriangle, Save, Sparkles } from 'lucide-react';
import { RemediationStatus, Reprimand, ReprimandType, Soldier } from '../../types';
import { REPRIMAND_TEMPLATES } from '../../constants/ranksAndDepartments';
import { calculateWeekNumberFromDate } from '../../services/storage';

interface ReprimandModalProps {
  isOpen: boolean;
  soldiers: Soldier[];
  itemToEdit?: Reprimand | null;
  defaultSoldierId?: string;
  defaultWeek?: number;
  selectedMonth: number;
  selectedYear: number;
  onClose: () => void;
  onSave: (data: Omit<Reprimand, 'id' | 'createdAt'>) => void | Promise<void>;
}

const REPRIMAND_TYPES: ReprimandType[] = [
  'Nhắc nhở tại giao ban tuần',
  'Phê bình trước toàn đồn',
  'Kiểm điểm trước cấp ủy, chỉ huy đội/trạm',
  'Kiểm điểm trước chi bộ',
  'Hạ bậc xếp loại thi đua tuần',
];

const REMEDIATION_STATUSES: RemediationStatus[] = [
  'Chưa khắc phục',
  'Đang chuyển biến tốt',
  'Đã khắc phục sửa chữa',
];

export const ReprimandModal: React.FC<ReprimandModalProps> = ({
  isOpen,
  soldiers,
  itemToEdit,
  defaultSoldierId,
  defaultWeek,
  selectedMonth,
  selectedYear,
  onClose,
  onSave,
}) => {
  const [soldierId, setSoldierId] = useState(defaultSoldierId || (soldiers[0]?.id || ''));
  const [date, setDate] = useState(
    new Date(selectedYear, selectedMonth - 1, Math.min(new Date().getDate(), 28))
      .toISOString()
      .slice(0, 10)
  );
  const [weekNumber, setWeekNumber] = useState(defaultWeek || 1);
  const [content, setContent] = useState('');
  const [defectCause, setDefectCause] = useState('');
  const [reprimandType, setReprimandType] = useState<ReprimandType>(REPRIMAND_TYPES[0]);
  const [remediationPlan, setRemediationPlan] = useState('');
  const [reviewedBy, setReviewedBy] = useState('Chỉ huy Đồn / Chính trị viên');
  const [remediationStatus, setRemediationStatus] = useState<RemediationStatus>(
    REMEDIATION_STATUSES[0]
  );
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const selectedSoldier = soldiers.find((s) => s.id === soldierId);

  useEffect(() => {
    if (itemToEdit) {
      setSoldierId(itemToEdit.soldierId);
      setDate(itemToEdit.date);
      setWeekNumber(itemToEdit.weekNumber);
      setContent(itemToEdit.content);
      setDefectCause(itemToEdit.defectCause || '');
      setReprimandType(itemToEdit.reprimandType);
      setRemediationPlan(itemToEdit.remediationPlan || '');
      setReviewedBy(itemToEdit.reviewedBy);
      setRemediationStatus(itemToEdit.remediationStatus);
      setNotes(itemToEdit.notes || '');
    } else {
      if (defaultSoldierId) setSoldierId(defaultSoldierId);
      if (defaultWeek) setWeekNumber(defaultWeek);
      if (!defaultWeek) {
        setWeekNumber(calculateWeekNumberFromDate(date));
      }
    }
  }, [itemToEdit, defaultSoldierId, defaultWeek, isOpen]);

  const handleDateChange = (newDate: string) => {
    setDate(newDate);
    setWeekNumber(calculateWeekNumberFromDate(newDate));
  };

  const handleApplyTemplate = (tmpl: {
    title: string;
    content: string;
    defectCause: string;
    remediationPlan: string;
  }) => {
    setContent(tmpl.content);
    setDefectCause(tmpl.defectCause);
    setRemediationPlan(tmpl.remediationPlan);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSoldier) {
      alert('Vui lòng chọn cán bộ, chiến sĩ bị phê bình / nhắc nhở!');
      return;
    }
    if (!content.trim()) {
      alert('Vui lòng nhập nội dung khuyết điểm!');
      return;
    }

    const dateObj = new Date(date);
    const month = dateObj.getMonth() + 1;
    const year = dateObj.getFullYear();

    try {
      setIsSubmitting(true);
      await onSave({
        soldierId: selectedSoldier.id,
        fullName: selectedSoldier.fullName,
        rank: selectedSoldier.rank,
        position: selectedSoldier.position,
        department: selectedSoldier.department,
        date,
        weekNumber,
        month,
        year,
        content: content.trim(),
        defectCause: defectCause.trim(),
        reprimandType,
        remediationPlan: remediationPlan.trim(),
        reviewedBy: reviewedBy.trim(),
        remediationStatus,
        notes: notes.trim(),
      });
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full my-auto overflow-hidden border border-slate-200 animate-in fade-in zoom-in duration-150">
        {/* Header */}
        <div className="bg-rose-950 text-white p-4 flex items-center justify-between border-b border-rose-500/40">
          <div className="flex items-center space-x-2">
            <AlertTriangle className="w-5 h-5 text-amber-400" />
            <h3 className="font-bold text-base">
              {itemToEdit ? 'Chỉnh sửa nội dung phê bình' : 'Nhập nội dung phê bình, nhắc nhở'}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-300 hover:text-white hover:bg-rose-900"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4 text-xs sm:text-sm max-h-[85vh] overflow-y-auto">
          {/* Select Soldier */}
          <div>
            <label className="block font-bold text-slate-700 mb-1">
              Chọn Cán bộ, chiến sĩ cần phê bình / nhắc nhở <span className="text-rose-500">*</span>:
            </label>
            <select
              value={soldierId}
              onChange={(e) => setSoldierId(e.target.value)}
              className="w-full p-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-1 focus:ring-rose-600 bg-white font-medium"
            >
              {soldiers.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.rank} {s.fullName} - {s.position} ({s.department})
                </option>
              ))}
            </select>
          </div>

          {/* Soldier Summary Card */}
          {selectedSoldier && (
            <div className="bg-rose-50/70 p-3 rounded-xl border border-rose-200 flex items-center justify-between text-xs">
              <div>
                <span className="font-bold text-rose-950 text-sm">
                  {selectedSoldier.rank} {selectedSoldier.fullName}
                </span>
                <div className="text-rose-800 mt-0.5">
                  Chức vụ: <strong>{selectedSoldier.position}</strong> &bull; Đơn vị:{' '}
                  <strong>{selectedSoldier.department}</strong>
                </div>
              </div>
              <span className="px-2 py-0.5 rounded bg-rose-200 text-rose-900 font-bold text-[11px]">
                {selectedSoldier.status}
              </span>
            </div>
          )}

          {/* Date & Week number */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Ngày phê bình, nhắc nhở: <span className="text-rose-500">*</span>
              </label>
              <input
                type="date"
                required
                value={date}
                onChange={(e) => handleDateChange(e.target.value)}
                className="w-full p-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-1 focus:ring-rose-600"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Thuộc tuần thứ mấy trong tháng: <span className="text-rose-500">*</span>
              </label>
              <select
                value={weekNumber}
                onChange={(e) => setWeekNumber(Number(e.target.value))}
                className="w-full p-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-1 focus:ring-rose-600 bg-white font-semibold text-rose-900"
              >
                <option value={1}>Tuần 1 (Ngày 1 - 7)</option>
                <option value={2}>Tuần 2 (Ngày 8 - 14)</option>
                <option value={3}>Tuần 3 (Ngày 15 - 21)</option>
                <option value={4}>Tuần 4 (Ngày 22 - 28)</option>
                <option value={5}>Tuần 5 (Ngày 29 - cuối tháng)</option>
              </select>
            </div>
          </div>

          {/* Templates */}
          <div>
            <div className="flex items-center space-x-1.5 text-xs text-slate-600 mb-1.5 font-semibold">
              <Sparkles className="w-3.5 h-3.5 text-rose-600" />
              <span>Gợi ý mẫu nội dung khuyết điểm thường gặp:</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {REPRIMAND_TEMPLATES.map((tmpl, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleApplyTemplate(tmpl)}
                  className="px-2.5 py-1 rounded-md bg-slate-100 hover:bg-rose-100 hover:text-rose-900 text-[11px] font-medium text-slate-700 border border-slate-200 transition-colors"
                >
                  + {tmpl.title}
                </button>
              ))}
            </div>
          </div>

          {/* Nội dung khuyết điểm */}
          <div>
            <label className="block font-bold text-slate-700 mb-1">
              Nội dung khuyết điểm <span className="text-rose-500">*</span>:
            </label>
            <textarea
              required
              rows={2}
              placeholder="Chấp hành lễ tiết tác phong chưa nghiêm, vắng mặt chưa báo cáo..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="w-full p-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-1 focus:ring-rose-600 font-medium"
            />
          </div>

          {/* Nguyên nhân */}
          <div>
            <label className="block font-bold text-slate-700 mb-1">Nguyên nhân:</label>
            <input
              type="text"
              placeholder="Ý thức rèn luyện chưa cao, chưa tập trung trong ca trực..."
              value={defectCause}
              onChange={(e) => setDefectCause(e.target.value)}
              className="w-full p-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-1 focus:ring-rose-600"
            />
          </div>

          {/* Hình thức & Người nhận xét */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Hình thức phê bình / nhắc nhở:
              </label>
              <select
                value={reprimandType}
                onChange={(e) => setReprimandType(e.target.value)}
                className="w-full p-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-1 focus:ring-rose-600 bg-white"
              >
                {REPRIMAND_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Người nhận xét / phê bình:
              </label>
              <input
                type="text"
                placeholder="Ví dụ: Đồn trưởng, Chính trị viên, Trạm trưởng..."
                value={reviewedBy}
                onChange={(e) => setReviewedBy(e.target.value)}
                className="w-full p-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-1 focus:ring-rose-600"
              />
            </div>
          </div>

          {/* Yêu cầu khắc phục */}
          <div>
            <label className="block font-bold text-slate-700 mb-1">Yêu cầu khắc phục:</label>
            <textarea
              rows={2}
              placeholder="Nghiêm túc tự kiểm điểm, chấn chỉnh ngay lễ tiết tác phong..."
              value={remediationPlan}
              onChange={(e) => setRemediationPlan(e.target.value)}
              className="w-full p-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-1 focus:ring-rose-600"
            />
          </div>

          {/* Kết quả khắc phục */}
          <div>
            <label className="block font-bold text-slate-700 mb-1">
              Kết quả khắc phục: <span className="text-rose-500">*</span>
            </label>
            <div className="grid grid-cols-3 gap-2">
              {REMEDIATION_STATUSES.map((status) => (
                <button
                  key={status}
                  type="button"
                  onClick={() => setRemediationStatus(status)}
                  className={`p-2 rounded-lg text-xs font-semibold border transition-all text-center ${
                    remediationStatus === status
                      ? status === 'Đã khắc phục sửa chữa'
                        ? 'bg-emerald-600 text-white border-emerald-700 ring-2 ring-emerald-300'
                        : status === 'Đang chuyển biến tốt'
                        ? 'bg-amber-500 text-white border-amber-600 ring-2 ring-amber-300'
                        : 'bg-rose-600 text-white border-rose-700 ring-2 ring-rose-300'
                      : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  {status}
                </button>
              ))}
            </div>
          </div>

          {/* Ghi chú */}
          <div>
            <label className="block font-bold text-slate-700 mb-1">Ghi chú thêm:</label>
            <input
              type="text"
              placeholder="Lưu ý theo dõi thêm trong tuần tới..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full p-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-1 focus:ring-rose-600"
            />
          </div>

          {/* Footer Buttons */}
          <div className="pt-3 flex justify-end space-x-2 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2 rounded-lg text-xs font-bold text-white bg-rose-700 hover:bg-rose-600 transition-colors flex items-center space-x-1.5 shadow uppercase tracking-wide disabled:opacity-50 cursor-pointer"
            >
              <Save className="w-4 h-4 text-amber-300" />
              <span>{isSubmitting ? 'ĐANG LƯU...' : 'LƯU PHÊ BÌNH'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
