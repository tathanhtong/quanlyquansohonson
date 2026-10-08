import React, { useState, useEffect } from 'react';
import { X, Award, Save } from 'lucide-react';
import { Reward, Soldier } from '../../types';

interface RewardModalProps {
  isOpen: boolean;
  soldiers: Soldier[];
  itemToEdit?: Reward | null;
  selectedYear: number;
  onClose: () => void;
  onSave: (data: Omit<Reward, 'id' | 'createdAt'>) => void | Promise<void>;
}

const COMMON_REWARD_TYPES = [
  'Chiến sĩ thi đua cơ sở',
  'Chiến sĩ tiên tiến',
  'Giấy khen Bộ Chỉ huy BĐBP Tỉnh',
  'Giấy khen UBND Huyện Kiên Hải',
  'Giấy khen UBND Tỉnh Kiên Giang',
  'Bằng khen Bộ Tư lệnh Bộ đội Biên phòng',
  'Bằng khen Bộ Quốc phòng',
  'Bằng khen Thủ tướng Chính phủ',
  'Huân chương Bảo vệ Tổ quốc',
  'Huy chương Chiến sĩ vẻ vang',
];

const COMMON_DECISION_LEVELS = [
  'Bộ Chỉ huy Bộ đội Biên phòng Tỉnh Kiên Giang',
  'Bộ Tư lệnh Bộ đội Biên phòng',
  'Bộ Quốc phòng',
  'UBND Huyện Kiên Hải',
  'UBND Tỉnh Kiên Giang',
  'Đồn Biên phòng Hòn Sơn',
];

export const RewardModal: React.FC<RewardModalProps> = ({
  isOpen,
  soldiers,
  itemToEdit,
  selectedYear,
  onClose,
  onSave,
}) => {
  const [soldierId, setSoldierId] = useState(soldiers[0]?.id || '');
  const [rewardType, setRewardType] = useState(COMMON_REWARD_TYPES[0]);
  const [achievement, setAchievement] = useState('');
  const [decisionNumber, setDecisionNumber] = useState('');
  const [decisionDate, setDecisionDate] = useState(`${selectedYear}-06-15`);
  const [decisionLevel, setDecisionLevel] = useState(COMMON_DECISION_LEVELS[0]);
  const [year, setYear] = useState(selectedYear);
  const [month, setMonth] = useState<number>(6);
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const selectedSoldier = soldiers.find((s) => s.id === soldierId);

  useEffect(() => {
    if (itemToEdit) {
      setSoldierId(itemToEdit.soldierId);
      setRewardType(itemToEdit.rewardType);
      setAchievement(itemToEdit.achievement);
      setDecisionNumber(itemToEdit.decisionNumber || '');
      setDecisionDate(itemToEdit.decisionDate || `${itemToEdit.year}-06-15`);
      setDecisionLevel(itemToEdit.decisionLevel);
      setYear(itemToEdit.year);
      setMonth(itemToEdit.month || 6);
      setNotes(itemToEdit.notes || '');
    } else {
      setYear(selectedYear);
    }
  }, [itemToEdit, selectedYear, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSoldier) {
      alert('Vui lòng chọn cán bộ, chiến sĩ được khen thưởng!');
      return;
    }
    if (!rewardType.trim()) {
      alert('Vui lòng chọn hình thức khen thưởng!');
      return;
    }
    if (!achievement.trim()) {
      alert('Vui lòng nhập thành tích được khen thưởng!');
      return;
    }

    try {
      setIsSubmitting(true);
      await onSave({
        soldierId: selectedSoldier.id,
        fullName: selectedSoldier.fullName,
        rank: selectedSoldier.rank,
        position: selectedSoldier.position,
        department: selectedSoldier.department,
        rewardType: rewardType.trim(),
        achievement: achievement.trim(),
        decisionNumber: decisionNumber.trim(),
        decisionDate,
        decisionLevel: decisionLevel.trim(),
        year,
        month,
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
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full my-auto overflow-hidden border border-slate-200 animate-in fade-in zoom-in duration-150">
        {/* Header */}
        <div className="bg-amber-950 text-white p-4 flex items-center justify-between border-b border-amber-500/40">
          <div className="flex items-center space-x-2">
            <Award className="w-5 h-5 text-amber-400" />
            <h3 className="font-bold text-base">
              {itemToEdit ? 'Chỉnh sửa khen thưởng' : 'Thêm mới khen thưởng chính thức'}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-300 hover:text-white hover:bg-amber-900"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4 text-xs sm:text-sm">
          {/* Select Soldier */}
          <div>
            <label className="block font-bold text-slate-700 mb-1">
              Chọn Cán bộ, chiến sĩ được khen thưởng <span className="text-rose-500">*</span>:
            </label>
            <select
              value={soldierId}
              onChange={(e) => setSoldierId(e.target.value)}
              className="w-full p-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-1 focus:ring-amber-500 bg-white font-medium"
            >
              {soldiers.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.rank} {s.fullName} - {s.position} ({s.department})
                </option>
              ))}
            </select>
          </div>

          {/* Hình thức khen thưởng */}
          <div>
            <label className="block font-bold text-slate-700 mb-1">
              Hình thức / Danh hiệu khen thưởng <span className="text-rose-500">*</span>:
            </label>
            <input
              type="text"
              required
              list="rewards-list"
              placeholder="Chiến sĩ thi đua, Bằng khen..."
              value={rewardType}
              onChange={(e) => setRewardType(e.target.value)}
              className="w-full p-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-1 focus:ring-amber-500"
            />
            <datalist id="rewards-list">
              {COMMON_REWARD_TYPES.map((t) => (
                <option key={t} value={t} />
              ))}
            </datalist>
          </div>

          {/* Thành tích */}
          <div>
            <label className="block font-bold text-slate-700 mb-1">
              Thành tích đạt được <span className="text-rose-500">*</span>:
            </label>
            <textarea
              required
              rows={2}
              placeholder="Có thành tích xuất sắc trong công tác cứu nạn cứu hộ ngư dân, đấu tranh phòng chống tội phạm..."
              value={achievement}
              onChange={(e) => setAchievement(e.target.value)}
              className="w-full p-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-1 focus:ring-amber-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            {/* Số quyết định */}
            <div>
              <label className="block font-bold text-slate-700 mb-1">Số quyết định:</label>
              <input
                type="text"
                placeholder="VD: 125/QĐ-BCH"
                value={decisionNumber}
                onChange={(e) => setDecisionNumber(e.target.value)}
                className="w-full p-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-1 focus:ring-amber-500"
              />
            </div>

            {/* Ngày quyết định */}
            <div>
              <label className="block font-bold text-slate-700 mb-1">Ngày quyết định:</label>
              <input
                type="date"
                value={decisionDate}
                onChange={(e) => setDecisionDate(e.target.value)}
                className="w-full p-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-1 focus:ring-amber-500"
              />
            </div>
          </div>

          {/* Cấp quyết định */}
          <div>
            <label className="block font-bold text-slate-700 mb-1">Cấp quyết định khen thưởng:</label>
            <input
              type="text"
              list="decision-levels"
              placeholder="Bộ Chỉ huy BĐBP Kiên Giang..."
              value={decisionLevel}
              onChange={(e) => setDecisionLevel(e.target.value)}
              className="w-full p-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-1 focus:ring-amber-500"
            />
            <datalist id="decision-levels">
              {COMMON_DECISION_LEVELS.map((l) => (
                <option key={l} value={l} />
              ))}
            </datalist>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Năm khen thưởng:</label>
              <input
                type="number"
                value={year}
                onChange={(e) => setYear(Number(e.target.value))}
                className="w-full p-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-1 focus:ring-amber-500"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">Ghi chú:</label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Ghi chú thêm nếu có..."
                className="w-full p-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-1 focus:ring-amber-500"
              />
            </div>
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
              className="px-6 py-2 rounded-lg text-xs font-bold text-white bg-amber-600 hover:bg-amber-500 transition-colors flex items-center space-x-1.5 shadow uppercase tracking-wide disabled:opacity-50 cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>{isSubmitting ? 'ĐANG LƯU...' : 'LƯU KHEN THƯỞNG'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
