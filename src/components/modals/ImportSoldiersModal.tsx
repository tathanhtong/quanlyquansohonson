import React, { useState, useRef } from 'react';
import {
  X,
  Upload,
  FileText,
  FileCode,
  CheckCircle2,
  AlertTriangle,
  Download,
  ClipboardPaste,
  Trash2,
  Users,
  Shield,
  RefreshCw,
} from 'lucide-react';
import {
  ParsedSoldierCandidate,
  generateSampleDocxTemplate,
  generateSampleJsonTemplate,
  parseDocxFile,
  parseHtmlTableFromWord,
  parseSoldiersFromJson,
  parseTextLines,
} from '../../utils/soldierImporter';
import { Soldier } from '../../types';

interface ImportSoldiersModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (newSoldiers: ParsedSoldierCandidate[], mode: 'append' | 'replace') => Promise<void> | void;
  currentCount: number;
}

export const ImportSoldiersModal: React.FC<ImportSoldiersModalProps> = ({
  isOpen,
  onClose,
  onImport,
  currentCount,
}) => {
  const [activeTab, setActiveTab] = useState<'upload' | 'paste'>('upload');
  const [importMode, setImportMode] = useState<'append' | 'replace'>('append');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Parsed candidates preview
  const [candidates, setCandidates] = useState<ParsedSoldierCandidate[]>([]);
  const [pastedText, setPastedText] = useState('');
  const [fileName, setFileName] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);
    setFileName(file.name);

    try {
      const ext = file.name.split('.').pop()?.toLowerCase();
      let parsed: ParsedSoldierCandidate[] = [];

      if (ext === 'docx') {
        parsed = await parseDocxFile(file);
      } else if (ext === 'doc') {
        throw new Error('Định dạng Word .doc cũ chưa được hỗ trợ. Vui lòng mở file bằng Microsoft Word và lưu lại dưới dạng .docx.');
      } else if (ext === 'json') {
        const text = await file.text();
        parsed = parseSoldiersFromJson(text);
      } else if (ext === 'txt' || ext === 'csv') {
        const text = await file.text();
        parsed = parseTextLines(text);
      } else {
        throw new Error('Định dạng tệp không được hỗ trợ. Vui lòng chọn tệp .docx, .json, .csv hoặc .txt');
      }

      if (parsed.length === 0) {
        throw new Error('Không trích xuất được danh sách quân nhân từ tệp. Vui lòng kiểm tra lại cấu trúc bảng biểu hoặc định dạng JSON.');
      }

      setCandidates(parsed);
      setSuccessMsg(`Đã trích xuất thành công ${parsed.length} cán bộ, chiến sĩ từ tệp "${file.name}"!`);
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || 'Lỗi khi đọc tệp. Vui lòng thử lại.');
      setCandidates([]);
    } finally {
      setLoading(false);
    }
  };

  const handleParsePastedText = () => {
    if (!pastedText.trim()) {
      setErrorMsg('Vui lòng dán nội dung danh sách trước khi phân tích.');
      return;
    }

    setLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      let parsed: ParsedSoldierCandidate[] = [];
      const trimmed = pastedText.trim();

      // Check if it's JSON
      if ((trimmed.startsWith('[') && trimmed.endsWith(']')) || (trimmed.startsWith('{') && trimmed.endsWith('}'))) {
        try {
          parsed = parseSoldiersFromJson(trimmed);
        } catch {
          parsed = parseTextLines(trimmed);
        }
      } else {
        parsed = parseTextLines(trimmed);
      }

      if (parsed.length === 0) {
        throw new Error('Không phân tích được danh sách quân nhân từ nội dung đã dán. Hãy đảm bảo mỗi dòng gồm: STT, Cấp bậc, Họ và tên, Chức vụ, Đội/Trạm...');
      }

      setCandidates(parsed);
      setSuccessMsg(`Đã phân tích thành công ${parsed.length} cán bộ, chiến sĩ từ nội dung đã dán!`);
    } catch (err: any) {
      setErrorMsg(err.message || 'Lỗi khi xử lý nội dung. Vui lòng kiểm tra lại định dạng.');
      setCandidates([]);
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveCandidate = (index: number) => {
    setCandidates((prev) => prev.filter((_, i) => i !== index));
  };

  const handleDownloadSampleJson = () => {
    const jsonStr = generateSampleJsonTemplate();
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'mau_danh_sach_quan_so_BP_Hon_Son.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleDownloadSampleWord = async () => {
    try {
      const blob = await generateSampleDocxTemplate();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'mau_danh_sach_quan_so_BP_Hon_Son.docx';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Failed to download sample docx:', err);
    }
  };

  const handleConfirmImport = async () => {
    if (candidates.length === 0) return;
    try {
      await onImport(candidates, importMode);
      onClose();
    } catch {
      // Error is caught and displayed by onImport toast
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full my-auto overflow-hidden border border-slate-200 animate-in fade-in zoom-in duration-150 flex flex-col max-h-[92vh]">
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-emerald-950 via-emerald-900 to-emerald-950 text-white px-6 py-4 flex items-center justify-between border-b-2 border-amber-500/50">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-xl bg-emerald-800 text-amber-400 border border-amber-500/30">
              <Upload className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold font-serif text-amber-400 uppercase tracking-wide">
                Nhập danh sách quân số từ File Word hoặc JSON
              </h3>
              <p className="text-xs text-emerald-200">
                Đưa danh sách cán bộ, chiến sĩ vào hệ thống nhanh chóng mà không cần nhập thủ công
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-emerald-300 hover:text-white hover:bg-emerald-800/80 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-6 overflow-y-auto flex-1 space-y-5">
          {/* Method Tabs */}
          <div className="flex items-center space-x-2 border-b border-slate-200 pb-3">
            <button
              onClick={() => setActiveTab('upload')}
              className={`px-4 py-2 rounded-lg text-xs sm:text-sm font-bold flex items-center space-x-2 transition-all ${
                activeTab === 'upload'
                  ? 'bg-emerald-800 text-white shadow-sm'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              <FileText className="w-4 h-4 text-amber-300" />
              <span>Tải lên tệp (.docx, .json, .txt, .csv)</span>
            </button>

            <button
              onClick={() => setActiveTab('paste')}
              className={`px-4 py-2 rounded-lg text-xs sm:text-sm font-bold flex items-center space-x-2 transition-all ${
                activeTab === 'paste'
                  ? 'bg-emerald-800 text-white shadow-sm'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              <ClipboardPaste className="w-4 h-4 text-amber-300" />
              <span>Dán trực tiếp từ bảng Word / Excel</span>
            </button>

            <div className="ml-auto flex items-center space-x-2">
              <button
                onClick={handleDownloadSampleWord}
                className="text-xs px-2.5 py-1.5 rounded bg-blue-50 text-blue-800 hover:bg-blue-100 border border-blue-200 font-semibold flex items-center gap-1 transition-colors"
                title="Tải mẫu bảng Word chuẩn (.docx) để điền danh sách"
              >
                <Download className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Mẫu Word (.docx)</span>
              </button>

              <button
                onClick={handleDownloadSampleJson}
                className="text-xs px-2.5 py-1.5 rounded bg-amber-50 text-amber-900 hover:bg-amber-100 border border-amber-300 font-semibold flex items-center gap-1 transition-colors"
                title="Tải tệp JSON mẫu để nhập tự động"
              >
                <Download className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Mẫu JSON</span>
              </button>
            </div>
          </div>

          {/* Tab 1: Upload File */}
          {activeTab === 'upload' && (
            <div className="space-y-4">
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-emerald-600/40 hover:border-emerald-600 bg-emerald-50/40 hover:bg-emerald-50 rounded-2xl p-8 text-center cursor-pointer transition-all flex flex-col items-center justify-center space-y-3"
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".docx,.json,.txt,.csv"
                  className="hidden"
                  onChange={handleFileChange}
                />

                <div className="w-14 h-14 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center shadow-inner">
                  {loading ? (
                    <RefreshCw className="w-7 h-7 animate-spin text-emerald-700" />
                  ) : (
                    <Upload className="w-7 h-7 text-emerald-700" />
                  )}
                </div>

                <div>
                  <h4 className="text-sm sm:text-base font-bold text-slate-800">
                    Bấm để chọn tệp hoặc kéo thả tệp vào đây
                  </h4>
                  <p className="text-xs text-slate-500 mt-1">
                    Hỗ trợ file Microsoft Word (<strong>.docx</strong>), file dữ liệu (<strong>.json</strong>) hoặc bảng tính text
                  </p>
                </div>

                {fileName && (
                  <div className="px-3 py-1.5 rounded-lg bg-white border border-emerald-300 text-xs text-emerald-900 font-semibold flex items-center gap-1.5 shadow-xs">
                    <FileText className="w-4 h-4 text-emerald-700" />
                    <span>Tệp đã chọn: {fileName}</span>
                  </div>
                )}
              </div>

              <div className="text-xs text-slate-500 bg-slate-50 p-3 rounded-xl border border-slate-200 leading-relaxed">
                <strong>💡 Lưu ý cấu trúc bảng Word:</strong> Bảng trong Word nên có các cột tiêu đề quen thuộc:
                <span className="font-semibold text-slate-700"> STT, Cấp bậc, Họ và tên, Chức vụ, Đội / Trạm / Bộ phận, Ngày sinh, Trạng thái công tác</span>.
                Hệ thống sẽ tự động nhận diện và trích xuất từng quân nhân vào phần mềm.
              </div>
            </div>
          )}

          {/* Tab 2: Paste directly from Word */}
          {activeTab === 'paste' && (
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center justify-between">
                  <span>Dán nội dung bảng từ Word hoặc Excel vào ô dưới đây (Ctrl + V):</span>
                  <span className="text-[11px] text-emerald-700 font-normal">Hỗ trợ định dạng phân cách Tab hoặc Dấu gạch nối</span>
                </label>
                <textarea
                  rows={6}
                  value={pastedText}
                  onChange={(e) => setPastedText(e.target.value)}
                  placeholder={`Ví dụ sao chép bảng từ Word rồi dán vào đây:&#10;1	Trung tá	Trần Đình Trọng	Đồn trưởng	Ban Chỉ huy Đồn	1982-04-15	Đang công tác&#10;2	Trung tá	Lê Hoàng Nam	Chính trị viên	Ban Chỉ huy Đồn	1983-08-22	Đang công tác&#10;3	Đại úy	Nguyễn Văn Minh	Đội trưởng	Đội Vũ trang	1989-11-10	Đang công tác`}
                  className="w-full p-3 font-mono text-xs bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:bg-white leading-relaxed text-slate-800"
                />
              </div>

              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={handleParsePastedText}
                  disabled={loading || !pastedText.trim()}
                  className="px-4 py-2 bg-emerald-700 hover:bg-emerald-600 active:scale-95 disabled:opacity-50 text-white font-bold text-xs sm:text-sm rounded-lg shadow transition-all flex items-center space-x-1.5"
                >
                  <RefreshCw className={`w-4 h-4 text-amber-300 ${loading ? 'animate-spin' : ''}`} />
                  <span>Phân tích dữ liệu đã dán</span>
                </button>
              </div>
            </div>
          )}

          {/* Notification Messages */}
          {errorMsg && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 flex items-start space-x-2">
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-center space-x-2 font-medium">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Preview Section if candidates found */}
          {candidates.length > 0 && (
            <div className="space-y-3 pt-2 border-t border-slate-200">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center space-x-2">
                  <span className="font-bold text-slate-800 text-sm flex items-center gap-1.5">
                    <Users className="w-4 h-4 text-emerald-700" />
                    <span>Xem trước danh sách trích xuất ({candidates.length} cán bộ, chiến sĩ)</span>
                  </span>
                  <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                    Sẵn sàng lưu
                  </span>
                </div>

                {/* Import Mode selection */}
                <div className="flex items-center space-x-2 text-xs">
                  <span className="text-slate-600 font-semibold">Chế độ nhập:</span>
                  <select
                    value={importMode}
                    onChange={(e) => setImportMode(e.target.value as 'append' | 'replace')}
                    className="px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs font-semibold text-slate-800 focus:outline-none focus:ring-1 focus:ring-emerald-600"
                  >
                    <option value="append">Thêm vào danh sách hiện tại (Quân số hiện có: {currentCount})</option>
                    <option value="replace">Thay thế toàn bộ danh sách cũ (Xóa quân số cũ)</option>
                  </select>
                </div>
              </div>

              {/* Preview Table */}
              <div className="border border-slate-200 rounded-xl overflow-hidden shadow-xs max-h-60 overflow-y-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead className="sticky top-0 bg-slate-100 border-b border-slate-200 text-slate-700 uppercase font-semibold">
                    <tr>
                      <th className="py-2 px-2.5 text-center w-12">STT</th>
                      <th className="py-2 px-2.5 text-center w-24">Cấp bậc</th>
                      <th className="py-2 px-3">Họ và tên</th>
                      <th className="py-2 px-3">Chức vụ</th>
                      <th className="py-2 px-3">Đội / Trạm</th>
                      <th className="py-2 px-2.5 text-center">Ngày sinh</th>
                      <th className="py-2 px-2.5 text-center">Trạng thái</th>
                      <th className="py-2 px-2 text-center w-10">Xóa</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {candidates.map((c, idx) => (
                      <tr key={idx} className="hover:bg-slate-50">
                        <td className="py-2 px-2.5 text-center font-mono text-slate-500">{c.stt || idx + 1}</td>
                        <td className="py-2 px-2.5 text-center font-semibold text-slate-700">{c.rank}</td>
                        <td className="py-2 px-3 font-bold text-slate-900">{c.fullName}</td>
                        <td className="py-2 px-3 text-slate-700">{c.position}</td>
                        <td className="py-2 px-3 text-slate-600">{c.department}</td>
                        <td className="py-2 px-2.5 text-center text-slate-500">{c.birthDate || '-'}</td>
                        <td className="py-2 px-2.5 text-center">
                          <span className="inline-block px-2 py-0.5 rounded text-[11px] font-medium bg-emerald-100 text-emerald-800">
                            {c.status || 'Đang công tác'}
                          </span>
                        </td>
                        <td className="py-2 px-2 text-center">
                          <button
                            type="button"
                            onClick={() => handleRemoveCandidate(idx)}
                            className="p-1 text-slate-400 hover:text-rose-600 rounded transition-colors"
                            title="Xóa dòng này"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="bg-slate-50 px-6 py-3.5 border-t border-slate-200 flex items-center justify-between">
          <div className="text-xs text-slate-500">
            {candidates.length > 0 ? (
              <span>
                Đang chọn: <strong>{candidates.length}</strong> quân nhân để nhập vào Đồn BP Hòn Sơn.
              </span>
            ) : (
              <span>Vui lòng tải lên tệp hoặc dán danh sách để bắt đầu.</span>
            )}
          </div>

          <div className="flex items-center space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-white hover:bg-slate-100 text-slate-700 text-xs sm:text-sm font-semibold rounded-lg border border-slate-300 transition-colors"
            >
              Hủy bỏ
            </button>

            <button
              type="button"
              onClick={handleConfirmImport}
              disabled={candidates.length === 0}
              className="px-5 py-2 bg-emerald-700 hover:bg-emerald-600 active:scale-95 disabled:opacity-50 disabled:pointer-events-none text-white font-bold text-xs sm:text-sm rounded-lg shadow-md transition-all flex items-center space-x-1.5"
            >
              <CheckCircle2 className="w-4 h-4 text-amber-300" />
              <span>XÁC NHẬN NHẬP ({candidates.length}) QUÂN NHÂN</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
