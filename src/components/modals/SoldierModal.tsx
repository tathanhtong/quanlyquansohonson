import React, { useState, useEffect } from 'react';
import { X, UserPlus, Save, Shield } from 'lucide-react';
import { Soldier, MilitaryRank, DepartmentName, DutyStatus } from '../../types';
import { COMMON_POSITIONS, DEPARTMENTS, MILITARY_RANKS } from '../../constants/ranksAndDepartments';

interface SoldierModalProps {
  isOpen: boolean;
  soldierToEdit?: Soldier | null;
  onClose: () => void;
  onSave: (data: Omit<Soldier, 'id' | 'createdAt' | 'updatedAt' | 'stt'>) => void | Promise<void>;
}

export const SoldierModal: React.FC<SoldierModalProps> = ({
  isOpen,
  soldierToEdit,
  onClose,
  onSave,
}) => {
  const [fullName, setFullName] = useState('');
  const [rank, setRank] = useState<MilitaryRank>('Trung úy');
  const [position, setPosition] = useState('');
  const [department, setDepartment] = useState<DepartmentName>(DEPARTMENTS[0]);
  const [birthDate, setBirthDate] = useState('1995-01-01');
  const [status, setStatus] = useState<DutyStatus>('Đang công tác');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (soldierToEdit) {
      setFullName(soldierToEdit.fullName || '');
      setRank(soldierToEdit.rank || 'Trung úy');
      setPosition(soldierToEdit.position || '');
      setDepartment(soldierToEdit.department || DEPARTMENTS[0]);
      setBirthDate(soldierToEdit.birthDate || '1995-01-01');
      setStatus(soldierToEdit.status || 'Đang công tác');
      setNotes(soldierToEdit.notes || '');
    } else {
      setFullName('');
      setRank('Trung úy');
      setPosition('');
      setDepartment(DEPARTMENTS[0]);
      setBirthDate('1996-01-01');
      setStatus('Đang công tác');
      setNotes('');
    }
  }, [soldierToEdit, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim()) {
      alert('Vui lòng nhập họ và tên cán bộ, chiến sĩ!');
      return;
    }
    if (!position.trim()) {
      alert('Vui lòng nhập chức vụ công tác!');
      return;
    }

    try {
      setIsSubmitting(true);
      await onSave({
        fullName: fullName.trim(),
        rank,
        position: position.trim(),
        department,
        birthDate,
        status,
        notes: notes.trim(),
      });
    } catch (err) {
      console.error(err);
      // Keep modal open so data is preserved!
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-2 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full my-auto overflow-hidden border border-slate-200 animate-in fade-in zoom-in duration-150 flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="bg-emerald-950 text-white p-3.5 sm:p-4 flex items-center justify-between border-b border-amber-500/40 shrink-0">
          <div className="flex items-center space-x-2">
            <Shield className="w-5 h-5 text-amber-400" />
            <h3 className="font-bold text-sm sm:text-base">
              {soldierToEdit ? 'Chỉnh sửa thông tin quân nhân' : 'Thêm mới cán bộ, chiến sĩ'}
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
          {/* Họ và tên */}
          <div>
            <label className="block font-bold text-slate-700 mb-1">
              Họ và tên cán bộ, chiến sĩ <span className="text-rose-500">*</span>:
            </label>
            <input
              type="text"
              required
              placeholder="Ví dụ: Nguyễn Văn An"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full p-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-1 focus:ring-emerald-600 font-medium"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Cấp bậc */}
            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Cấp bậc <span className="text-rose-500">*</span>:
              </label>
              <select
                value={rank}
                onChange={(e) => setRank(e.target.value as MilitaryRank)}
                className="w-full p-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-1 focus:ring-emerald-600 bg-white"
              >
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

            {/* Chức vụ */}
            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Chức vụ <span className="text-rose-500">*</span>:
              </label>
              <input
                type="text"
                required
                list="positions-list"
                placeholder="Ví dụ: Đội trưởng, Chiến sĩ..."
                value={position}
                onChange={(e) => setPosition(e.target.value)}
                className="w-full p-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-1 focus:ring-emerald-600"
              />
              <datalist id="positions-list">
                {COMMON_POSITIONS.map((p) => (
                  <option key={p} value={p} />
                ))}
              </datalist>
            </div>
          </div>

          {/* Đội/Trạm/Bộ phận */}
          <div>
            <label className="block font-bold text-slate-700 mb-1">
              Đội / Trạm / Bộ phận <span className="text-rose-500">*</span>:
            </label>
            <select
              value={department}
              onChange={(e) => setDepartment(e.target.value as DepartmentName)}
              className="w-full p-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-1 focus:ring-emerald-600 bg-white"
            >
              {DEPARTMENTS.map((dept) => (
                <option key={dept} value={dept}>
                  {dept}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Ngày sinh */}
            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Ngày sinh:
              </label>
              <input
                type="date"
                value={birthDate}
                onChange={(e) => setBirthDate(e.target.value)}
                className="w-full p-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-1 focus:ring-emerald-600"
              />
            </div>

            {/* Trạng thái công tác */}
            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Trạng thái công tác:
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as DutyStatus)}
                className="w-full p-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-1 focus:ring-emerald-600 bg-white"
              >
                <option value="Đang công tác">Đang công tác</option>
                <option value="Tăng cường">Tăng cường</option>
                <option value="Nghỉ phép">Nghỉ phép</option>
                <option value="Đi học">Đi học</option>
                <option value="Đi viện">Đi viện</option>
              </select>
            </div>
          </div>

          {/* Ghi chú */}
          <div>
            <label className="block font-bold text-slate-700 mb-1">Ghi chú thêm:</label>
            <textarea
              rows={2}
              placeholder="Nhiệm vụ đặc thù, số hiệu quân nhân hoặc lưu ý khác..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full p-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-1 focus:ring-emerald-600"
            />
          </div>

          {/* Footer Buttons */}
          <div className="pt-2 flex justify-end space-x-2 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 rounded-lg text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-600 transition-colors flex items-center space-x-1.5 shadow disabled:opacity-50 cursor-pointer"
            >
              <Save className="w-4 h-4 text-amber-300" />
              <span>{isSubmitting ? 'Đang lưu...' : (soldierToEdit ? 'Cập nhật quân nhân' : 'Lưu quân nhân')}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
