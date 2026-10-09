import React, { useState, useEffect } from 'react';
import { X, Star, Save, Sparkles, UserCheck } from 'lucide-react';
import { Commendation, CommendationType, Soldier } from '../../types';
import { COMMENDATION_TEMPLATES } from '../../constants/ranksAndDepartments';
import { calculateWeekNumberFromDate } from '../../services/storage';

interface CommendationModalProps {
  isOpen: boolean;
  soldiers: Soldier[];
  itemToEdit?: Commendation | null;
  defaultSoldierId?: string;
  defaultWeek?: number;
  selectedMonth: number;
  selectedYear: number;
  onClose: () => void;
  onSave: (data: Omit<Commendation, 'id' | 'createdAt'>) => void | Promise<void>;
}

const COMMENDATION_TYPES: CommendationType[] = [
  'Biểu dương trước toàn đồn',
  'Biểu dương trong giao ban tuần',
  'Biểu dương trên bảng tin thi đua',
  'Biểu dương đột xuất trong thực hiện nhiệm vụ',
  'Đề nghị cấp trên khen thưởng',
];

export const CommendationModal: React.FC<CommendationModalProps> = ({
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
  const [achievement, setAchievement] = useState('');
  const [proposedBy, setProposedBy] = useState('Chỉ huy Đội / Trạm');
  const [commendationType, setCommendationType] = useState<CommendationType>(
    COMMENDATION_TYPES[1]
  );
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Selected soldier object
  const selectedSoldier = soldiers.find((s) => s.id === soldierId);

  useEffect(() => {
    if (itemToEdit) {
      setSoldierId(itemToEdit.soldierId);
      setDate(itemToEdit.date);
      setWeekNumber(itemToEdit.weekNumber);
      setContent(itemToEdit.content);
      setAchievement(itemToEdit.achievement || '');
      setProposedBy(itemToEdit.proposedBy);
      setCommendationType(itemToEdit.commendationType);
      setNotes(itemToEdit.notes || '');
    } else {
      if (defaultSoldierId) setSoldierId(defaultSoldierId);
      if (defaultWeek) setWeekNumber(defaultWeek);
      // Auto-set week from date if not specified
      if (!defaultWeek) {
        setWeekNumber(calculateWeekNumberFromDate(date));
      }
    }
  }, [itemToEdit, defaultSoldierId, defaultWeek, isOpen]);

  const handleDateChange = (newDate: string) => {
    setDate(newDate);
    // Auto-calculate week
    setWeekNumber(calculateWeekNumberFromDate(newDate));
  };

  const handleApplyTemplate = (tmpl: { title: string; content: string; achievement: string }) => {
    setContent(tmpl.content);
    setAchievement(tmpl.achievement);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSoldier) {
      alert('Vui lòng chọn cán bộ, chiến sĩ được biểu dương!');
      return;
    }
    if (!content.trim()) {
      alert('Vui lòng nhập nội dung biểu dương!');
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
        achievement: achievement.trim(),
        proposedBy: proposedBy.trim(),
        commendationType,
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-2 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full my-auto overflow-hidden border border-slate-200 animate-in fade-in zoom-in duration-150 flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="bg-emerald-950 text-white p-3.5 sm:p-4 flex items-center justify-between border-b border-amber-500/40 shrink-0">
          <div className="flex items-center space-x-2">
            <Star className="w-5 h-5 text-amber-400 fill-amber-400" />
            <h3 className="font-bold text-sm sm:text-base">
              {itemToEdit ? 'Chỉnh sửa biểu dương' : 'Thêm mới biểu dương cán bộ, chiến sĩ'}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-emerald-900 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-5 space-y-3.5 sm:space-y-4 text-xs sm:text-sm overflow-y-auto">
          {/* Select Soldier */}
          <div>
            <label className="block font-bold text-slate-700 mb-1">
              Chọn Cán bộ, chiến sĩ được biểu dương <span className="text-rose-500">*</span>:
            </label>
            <select
              value={soldierId}
              onChange={(e) => setSoldierId(e.target.value)}
              className="w-full p-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-1 focus:ring-emerald-600 bg-white font-medium"
            >
              {soldiers.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.rank} {s.fullName} - {s.position} ({s.department})
                </option>
              ))}
            </select>
          </div>

          {/* Auto-filled Soldier Summary Card */}
          {selectedSoldier && (
            <div className="bg-emerald-50/80 p-3 rounded-xl border border-emerald-200 flex items-center justify-between text-xs">
              <div>
                <span className="font-bold text-emerald-950 text-sm">
                  {selectedSoldier.rank} {selectedSoldier.fullName}
                </span>
                <div className="text-emerald-800 mt-0.5">
                  Chức vụ: <strong>{selectedSoldier.position}</strong> &bull; Đơn vị:{' '}
                  <strong>{selectedSoldier.department}</strong>
                </div>
              </div>
              <span className="px-2 py-0.5 rounded bg-emerald-200 text-emerald-900 font-bold text-[11px]">
                {selectedSoldier.status}
              </span>
            </div>
          )}

          {/* Date & Week number */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Ngày biểu dương: <span className="text-rose-500">*</span>
              </label>
              <input
                type="date"
                required
                value={date}
                onChange={(e) => handleDateChange(e.target.value)}
                className="w-full p-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-1 focus:ring-emerald-600"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Thuộc tuần thứ mấy trong tháng: <span className="text-rose-500">*</span>
              </label>
              <select
                value={weekNumber}
                onChange={(e) => setWeekNumber(Number(e.target.value))}
                className="w-full p-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-1 focus:ring-emerald-600 bg-white font-semibold text-emerald-900"
              >
                <option value={1}>Tuần 1 (Ngày 1 - 7)</option>
                <option value={2}>Tuần 2 (Ngày 8 - 14)</option>
                <option value={3}>Tuần 3 (Ngày 15 - 21)</option>
                <option value={4}>Tuần 4 (Ngày 22 - 28)</option>
                <option value={5}>Tuần 5 (Ngày 29 - cuối tháng)</option>
              </select>
            </div>
          </div>

          {/* Quick template suggestion pills */}
          <div>
            <div className="flex items-center space-x-1.5 text-xs text-slate-600 mb-1.5 font-semibold">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span>Gợi ý mẫu nội dung biểu dương chuẩn:</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {COMMENDATION_TEMPLATES.map((tmpl, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleApplyTemplate(tmpl)}
                  className="px-2.5 py-1 rounded-md bg-slate-100 hover:bg-emerald-100 hover:text-emerald-900 text-[11px] font-medium text-slate-700 border border-slate-200 transition-colors"
                >
                  + {tmpl.title}
                </button>
              ))}
            </div>
          </div>

          {/* Nội dung biểu dương */}
          <div>
            <label className="block font-bold text-slate-700 mb-1">
              Nội dung biểu dương <span className="text-rose-500">*</span>:
            </label>
            <textarea
              required
              rows={3}
              placeholder="Có tinh thần trách nhiệm cao trong thực hiện nhiệm vụ, tích cực tham gia xây dựng đơn vị, hoàn thành tốt nhiệm vụ được giao..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="w-full p-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-1 focus:ring-emerald-600 font-medium"
            />
          </div>

          {/* Thành tích/lý do được biểu dương */}
          <div>
            <label className="block font-bold text-slate-700 mb-1">
              Thành tích / Lý do được biểu dương:
            </label>
            <input
              type="text"
              placeholder="Ví dụ: Cứu hộ thành công ngư dân, tuần tra ngăn chặn tàu cá vi phạm IUU..."
              value={achievement}
              onChange={(e) => setAchievement(e.target.value)}
              className="w-full p-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-1 focus:ring-emerald-600"
            />
          </div>

          {/* Hình thức & Người đề xuất */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Hình thức biểu dương:
              </label>
              <select
                value={commendationType}
                onChange={(e) => setCommendationType(e.target.value)}
                className="w-full p-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-1 focus:ring-emerald-600 bg-white"
              >
                {COMMENDATION_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Người đề xuất biểu dương:
              </label>
              <input
                type="text"
                placeholder="Ví dụ: Đội trưởng Đội Vũ trang, Chính trị viên..."
                value={proposedBy}
                onChange={(e) => setProposedBy(e.target.value)}
                className="w-full p-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-1 focus:ring-emerald-600"
              />
            </div>
          </div>

          {/* Ghi chú */}
          <div>
            <label className="block font-bold text-slate-700 mb-1">Ghi chú thêm:</label>
            <input
              type="text"
              placeholder="Thông tin bổ sung nếu có..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full p-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-1 focus:ring-emerald-600"
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
              className="px-6 py-2 rounded-lg text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-600 transition-colors flex items-center space-x-1.5 shadow uppercase tracking-wide disabled:opacity-50 cursor-pointer"
            >
              <Save className="w-4 h-4 text-amber-300" />
              <span>{isSubmitting ? 'ĐANG LƯU...' : 'LƯU BIỂU DƯƠNG'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
