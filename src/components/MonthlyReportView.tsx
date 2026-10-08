import React, { useState, useEffect, useMemo } from 'react';
import {
  FileText,
  FileDown,
  Printer,
  Save,
  CheckCircle2,
  Calendar,
  Shield,
  FileSpreadsheet,
  Edit3,
  RefreshCw,
} from 'lucide-react';
import {
  Commendation,
  LeaveRecord,
  MonthlyReportEvaluation,
  Reprimand,
  Reward,
  Soldier,
} from '../types';
import {
  formatDateVN,
  getMonthlyEvaluation,
  getAnnualEvaluation,
  saveMonthlyEvaluation,
  exportToExcel,
} from '../services/storage';
import { exportMonthlyReportToDocx } from '../utils/exportDocx';
import { getFilteredReportData, ReportType } from '../utils/reportHelpers';

interface MonthlyReportViewProps {
  month: number;
  year: number;
  soldiers: Soldier[];
  commendations: Commendation[];
  reprimands: Reprimand[];
  rewards: Reward[];
  leaves?: LeaveRecord[];
  unitInfo: {
    unitName: string;
    parentUnit: string;
    superiorUnit: string;
    stationLocation: string;
  };
  onExportExcel: () => void;
  onToast: (msg: string) => void;
}

export const MonthlyReportView: React.FC<MonthlyReportViewProps> = ({
  month,
  year,
  soldiers,
  commendations,
  reprimands,
  rewards,
  leaves = [],
  unitInfo,
  onExportExcel,
  onToast,
}) => {
  const [reportType, setReportType] = useState<ReportType>('MONTH');
  const [evaluation, setEvaluation] = useState<MonthlyReportEvaluation>(() =>
    getMonthlyEvaluation(month, year)
  );
  const [isEditingNotes, setIsEditingNotes] = useState(false);

  // Load evaluation whenever month, year, or reportType changes
  useEffect(() => {
    if (reportType === 'YEAR') {
      setEvaluation(getAnnualEvaluation(year));
    } else {
      setEvaluation(getMonthlyEvaluation(month, year));
    }
    setIsEditingNotes(false);
  }, [reportType, month, year]);

  // Unified report calculation
  const reportData = useMemo(() => {
    return getFilteredReportData(
      reportType,
      month,
      year,
      soldiers,
      commendations,
      reprimands,
      rewards,
      leaves
    );
  }, [reportType, month, year, soldiers, commendations, reprimands, rewards, leaves]);

  const {
    activeComms,
    activeReps,
    activeRewards,
    uniqueCommsSoldiersCount,
    uniqueRepsSoldiersCount,
    cutoffText,
    subTitle,
    weeklyBreakdown,
  } = reportData;

  const [isSavingEvaluation, setIsSavingEvaluation] = useState(false);

  const handleSaveEvaluation = async () => {
    try {
      setIsSavingEvaluation(true);
      await saveMonthlyEvaluation(evaluation);
      setIsEditingNotes(false);
      onToast('Đã lưu thành công nhận xét và đánh giá báo cáo!');
    } catch (err: any) {
      console.error('Save evaluation failed:', err);
      onToast('Lỗi lưu nhận xét: ' + (err?.message || 'Không thể ghi vào Firestore'));
    } finally {
      setIsSavingEvaluation(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleExportWord = async () => {
    try {
      await exportMonthlyReportToDocx({
        reportType,
        month,
        year,
        soldiers,
        commendations,
        reprimands,
        rewards,
        leaves,
        evaluation,
        unitInfo,
      });
      onToast('Đã tạo và tải file Word (.docx) thành công!');
    } catch (err) {
      console.error('Word export error:', err);
      onToast('Lỗi khi xuất file Word: ' + (err instanceof Error ? err.message : String(err)));
    }
  };

  const handleExportExcelWithReportType = () => {
    exportToExcel(reportType, month, year);
    onToast(`Đã xuất báo cáo Excel ${reportType === 'MONTH' ? `tháng ${month}/${year}` : `năm ${year}`} thành công!`);
  };

  return (
    <div className="space-y-6">
      {/* Action and Control Bar (Hidden when printing) */}
      <div className="print:hidden bg-white rounded-xl p-4 shadow-xs border border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            <FileText className="w-5 h-5 text-emerald-700" />
            <span>MẪU BÁO CÁO KẾT QUẢ BIỂU DƯƠNG – PHÊ BÌNH</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Trình bày theo thể thức văn bản hành chính Quân đội nhân dân Việt Nam, chuẩn khổ giấy A4
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Toggle Month / Year Report */}
          <div className="inline-flex rounded-lg border border-slate-300 p-0.5 bg-slate-100 text-xs font-semibold">
            <button
              onClick={() => setReportType('MONTH')}
              className={`px-3 py-1 rounded-md transition-colors ${
                reportType === 'MONTH'
                  ? 'bg-white text-emerald-800 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Báo cáo Tháng {month}/{year}
            </button>
            <button
              onClick={() => setReportType('YEAR')}
              className={`px-3 py-1 rounded-md transition-colors ${
                reportType === 'YEAR'
                  ? 'bg-white text-emerald-800 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Báo cáo Năm {year}
            </button>
          </div>

          <button
            onClick={handleExportWord}
            className="flex items-center space-x-1.5 px-3 py-1.5 bg-blue-700 hover:bg-blue-600 active:scale-95 text-white font-semibold text-xs sm:text-sm rounded-lg shadow-sm transition-all"
            title="Tải văn bản Word hoàn chỉnh có bảng và Quốc hiệu"
          >
            <FileDown className="w-4 h-4" />
            <span>XUẤT WORD/DOCX</span>
          </button>

          <button
            onClick={handlePrint}
            className="flex items-center space-x-1.5 px-3 py-1.5 bg-emerald-700 hover:bg-emerald-600 active:scale-95 text-white font-semibold text-xs sm:text-sm rounded-lg shadow-sm transition-all"
            title="In trực tiếp ra máy in hoặc Lưu dưới dạng PDF chuẩn khổ A4"
          >
            <Printer className="w-4 h-4" />
            <span>XUẤT PDF / IN BÁO CÁO</span>
          </button>

          <button
            onClick={handleExportExcelWithReportType}
            className="flex items-center space-x-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold text-xs rounded-lg border border-slate-300 transition-colors"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-700" />
            <span>Xuất Excel</span>
          </button>
        </div>
      </div>

      {/* A4 Document Paper Container */}
      <div className="bg-white rounded-xl shadow-lg border border-slate-300 p-8 sm:p-12 max-w-4xl mx-auto print:shadow-none print:border-none print:p-0 print:m-0 font-serif text-slate-900 print:text-black">
        {/* National and Unit Header */}
        <div className="grid grid-cols-2 gap-4 pb-4 border-b border-transparent">
          {/* Left: Unit Branding */}
          <div className="text-center space-y-0.5">
            <div className="text-xs uppercase tracking-wide font-normal">
              {unitInfo.superiorUnit}
            </div>
            <div className="text-xs uppercase tracking-wide font-normal">
              {unitInfo.parentUnit}
            </div>
            <div className="text-sm font-bold uppercase tracking-wider text-emerald-950 print:text-black">
              {unitInfo.unitName}
            </div>
            <div className="w-24 h-0.5 bg-slate-900 mx-auto my-1"></div>
            <div className="text-xs font-normal">Số: &nbsp; &nbsp; &nbsp; /BC-ĐBP</div>
          </div>

          {/* Right: National Motto */}
          <div className="text-center space-y-0.5">
            <div className="text-xs uppercase font-bold tracking-wide">
              CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM
            </div>
            <div className="text-sm font-bold">
              Độc lập - Tự do - Hạnh phúc
            </div>
            <div className="w-32 h-0.5 bg-slate-900 mx-auto my-1"></div>
            <div className="text-xs italic pt-1">
              Hòn Sơn, ngày {new Date().getDate()} tháng {new Date().getMonth() + 1} năm {new Date().getFullYear()}
            </div>
          </div>
        </div>

        {/* Report Main Title */}
        <div className="text-center my-6 space-y-1">
          <h1 className="text-xl sm:text-2xl font-extrabold uppercase tracking-wide text-slate-900 print:text-black">
            BÁO CÁO
          </h1>
          <h2 className="text-base sm:text-lg font-bold">
            {subTitle}
          </h2>
          <div className="text-xs italic text-slate-600 print:text-black">
            {cutoffText}
          </div>
        </div>

        {/* Part I: Summary Stat Table */}
        <div className="space-y-2 mt-6">
          <h3 className="text-sm font-bold uppercase tracking-wide">
            I. TỔNG HỢP SỐ LIỆU QUÂN SỐ VÀ THI ĐUA
          </h3>

          <div className="overflow-x-auto">
            <table className="w-full border-collapse border border-slate-900 text-xs sm:text-sm">
              <thead>
                <tr className="bg-slate-100 print:bg-slate-200">
                  <th className="border border-slate-900 p-2 text-center w-12 font-bold">STT</th>
                  <th className="border border-slate-900 p-2 text-left font-bold">Nội dung chỉ tiêu theo dõi</th>
                  <th className="border border-slate-900 p-2 text-center w-32 font-bold">Số lượng</th>
                  <th className="border border-slate-900 p-2 text-left w-48 font-bold">Ghi chú</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="border border-slate-900 p-2 text-center font-mono">1</td>
                  <td className="border border-slate-900 p-2">Tổng quân số đơn vị quản lý</td>
                  <td className="border border-slate-900 p-2 text-center font-bold">{soldiers.length} đồng chí</td>
                  <td className="border border-slate-900 p-2">Biên chế hiện diện</td>
                </tr>
                <tr>
                  <td className="border border-slate-900 p-2 text-center font-mono">2</td>
                  <td className="border border-slate-900 p-2">Tổng số lượt biểu dương</td>
                  <td className="border border-slate-900 p-2 text-center font-bold text-emerald-800 print:text-black">
                    {activeComms.length} lượt
                  </td>
                  <td className="border border-slate-900 p-2">Trong {reportType === 'MONTH' ? '5 tuần công tác' : 'toàn năm'}</td>
                </tr>
                <tr>
                  <td className="border border-slate-900 p-2 text-center font-mono">3</td>
                  <td className="border border-slate-900 p-2">Tổng số cán bộ, chiến sĩ được biểu dương</td>
                  <td className="border border-slate-900 p-2 text-center font-bold">
                    {uniqueCommsSoldiersCount} đồng chí
                  </td>
                  <td className="border border-slate-900 p-2">
                    Tỷ lệ: {soldiers.length > 0 ? ((uniqueCommsSoldiersCount / soldiers.length) * 100).toFixed(1) : 0}% quân số
                  </td>
                </tr>
                <tr>
                  <td className="border border-slate-900 p-2 text-center font-mono">4</td>
                  <td className="border border-slate-900 p-2">Tổng số lượt phê bình, nhắc nhở</td>
                  <td className="border border-slate-900 p-2 text-center font-bold text-rose-800 print:text-black">
                    {activeReps.length} lượt
                  </td>
                  <td className="border border-slate-900 p-2">Chấn chỉnh lễ tiết, tác phong</td>
                </tr>
                <tr>
                  <td className="border border-slate-900 p-2 text-center font-mono">5</td>
                  <td className="border border-slate-900 p-2">Tổng số cá nhân bị phê bình, nhắc nhở</td>
                  <td className="border border-slate-900 p-2 text-center font-bold">
                    {uniqueRepsSoldiersCount} đồng chí
                  </td>
                  <td className="border border-slate-900 p-2">
                    Tỷ lệ: {soldiers.length > 0 ? ((uniqueRepsSoldiersCount / soldiers.length) * 100).toFixed(1) : 0}% quân số
                  </td>
                </tr>
                <tr>
                  <td className="border border-slate-900 p-2 text-center font-mono">6</td>
                  <td className="border border-slate-900 p-2">Khen thưởng cấp trên trao tặng</td>
                  <td className="border border-slate-900 p-2 text-center font-bold text-amber-700 print:text-black">
                    {activeRewards.length} quyết định
                  </td>
                  <td className="border border-slate-900 p-2">Ghi nhận năm {year}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Part II: Weekly Breakdown */}
        {reportType === 'MONTH' && (
          <div className="space-y-2 mt-6">
            <h3 className="text-sm font-bold uppercase tracking-wide">
              II. LIỆT KÊ CHI TIẾT THEO TỪNG TUẦN CÔNG TÁC
            </h3>

            <div className="overflow-x-auto">
              <table className="w-full border-collapse border border-slate-900 text-xs sm:text-sm">
                <thead>
                  <tr className="bg-slate-100 print:bg-slate-200">
                    <th className="border border-slate-900 p-2 text-center w-24 font-bold">Tuần</th>
                    <th className="border border-slate-900 p-2 text-center w-28 font-bold">Biểu dương</th>
                    <th className="border border-slate-900 p-2 text-center w-28 font-bold">Phê bình</th>
                    <th className="border border-slate-900 p-2 text-left font-bold">
                      Danh sách và tóm tắt nội dung chính
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {weeklyBreakdown.map((w) => (
                    <tr key={w.week}>
                      <td className="border border-slate-900 p-2 text-center font-bold">
                        Tuần {w.week}
                      </td>
                      <td className="border border-slate-900 p-2 text-center font-bold text-emerald-800 print:text-black">
                        {w.comms.length} lượt
                      </td>
                      <td className="border border-slate-900 p-2 text-center font-bold text-rose-800 print:text-black">
                        {w.reps.length} lượt
                      </td>
                      <td className="border border-slate-900 p-2 space-y-1">
                        {w.comms.length > 0 && (
                          <div>
                            <strong className="text-emerald-900 print:text-black">Biểu dương: </strong>
                            {w.comms.map((c) => `${c.rank} ${c.fullName}`).join('; ')}
                          </div>
                        )}
                        {w.reps.length > 0 && (
                          <div>
                            <strong className="text-rose-900 print:text-black">Phê bình: </strong>
                            {w.reps.map((r) => `${r.rank} ${r.fullName}`).join('; ')}
                          </div>
                        )}
                        {w.comms.length === 0 && w.reps.length === 0 && (
                          <span className="italic text-slate-500">Duy trì nề nếp ổn định.</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Part III: Commendations List */}
        <div className="space-y-2 mt-6">
          <h3 className="text-sm font-bold uppercase tracking-wide">
            {reportType === 'MONTH'
              ? 'III. DANH SÁCH CHI TIẾT CÁC LƯỢT BIỂU DƯƠNG TRONG THÁNG'
              : 'III. DANH SÁCH CÁC LƯỢT BIỂU DƯƠNG TRONG NĂM'}
          </h3>

          {activeComms.length === 0 ? (
            <p className="text-xs italic text-slate-500 py-1">
              Không có trường hợp biểu dương trong khoảng thời gian này.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse border border-slate-900 text-xs">
                <thead>
                  <tr className="bg-slate-100 print:bg-slate-200">
                    <th className="border border-slate-900 p-2 text-center w-10 font-bold">STT</th>
                    <th className="border border-slate-900 p-2 text-left w-36 font-bold">Họ và tên</th>
                    <th className="border border-slate-900 p-2 text-center w-24 font-bold">Cấp bậc</th>
                    <th className="border border-slate-900 p-2 text-left w-32 font-bold">Chức vụ / Đơn vị</th>
                    <th className="border border-slate-900 p-2 text-center w-20 font-bold">Thời gian</th>
                    <th className="border border-slate-900 p-2 text-left font-bold">Nội dung biểu dương & Thành tích</th>
                  </tr>
                </thead>
                <tbody>
                  {activeComms.map((c, i) => (
                    <tr key={c.id}>
                      <td className="border border-slate-900 p-2 text-center font-mono">{i + 1}</td>
                      <td className="border border-slate-900 p-2 font-bold">{c.fullName}</td>
                      <td className="border border-slate-900 p-2 text-center">{c.rank}</td>
                      <td className="border border-slate-900 p-2">
                        {c.position}<br /><span className="text-[10px] text-slate-600">{c.department}</span>
                      </td>
                      <td className="border border-slate-900 p-2 text-center font-mono">
                        Tuần {c.weekNumber}<br />{formatDateVN(c.date)}
                      </td>
                      <td className="border border-slate-900 p-2">
                        <div className="font-semibold">{c.content}</div>
                        {c.achievement && (
                          <div className="text-[11px] italic mt-0.5">Thành tích: {c.achievement}</div>
                        )}
                        <div className="text-[10px] text-slate-600 mt-0.5">
                          Hình thức: {c.commendationType} &bull; Đề xuất: {c.proposedBy}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Part IV: Reprimands List */}
        <div className="space-y-2 mt-6">
          <h3 className="text-sm font-bold uppercase tracking-wide">
            {reportType === 'MONTH'
              ? 'IV. DANH SÁCH CHI TIẾT CÁC LƯỢT PHÊ BÌNH TRONG THÁNG'
              : 'IV. DANH SÁCH CÁC LƯỢT PHÊ BÌNH TRONG NĂM'}
          </h3>

          {activeReps.length === 0 ? (
            <p className="text-xs italic text-slate-500 py-1">
              Toàn đơn vị chấp hành nghiêm kỷ luật, không có trường hợp bị phê bình, nhắc nhở.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse border border-slate-900 text-xs">
                <thead>
                  <tr className="bg-slate-100 print:bg-slate-200">
                    <th className="border border-slate-900 p-2 text-center w-10 font-bold">STT</th>
                    <th className="border border-slate-900 p-2 text-left w-36 font-bold">Họ và tên</th>
                    <th className="border border-slate-900 p-2 text-center w-24 font-bold">Cấp bậc</th>
                    <th className="border border-slate-900 p-2 text-left w-32 font-bold">Chức vụ / Đơn vị</th>
                    <th className="border border-slate-900 p-2 text-center w-20 font-bold">Thời gian</th>
                    <th className="border border-slate-900 p-2 text-left font-bold">Khuyết điểm & Yêu cầu khắc phục</th>
                    <th className="border border-slate-900 p-2 text-center w-28 font-bold">Kết quả khắc phục</th>
                  </tr>
                </thead>
                <tbody>
                  {activeReps.map((r, i) => (
                    <tr key={r.id}>
                      <td className="border border-slate-900 p-2 text-center font-mono">{i + 1}</td>
                      <td className="border border-slate-900 p-2 font-bold">{r.fullName}</td>
                      <td className="border border-slate-900 p-2 text-center">{r.rank}</td>
                      <td className="border border-slate-900 p-2">
                        {r.position}<br /><span className="text-[10px] text-slate-600">{r.department}</span>
                      </td>
                      <td className="border border-slate-900 p-2 text-center font-mono">
                        Tuần {r.weekNumber}<br />{formatDateVN(r.date)}
                      </td>
                      <td className="border border-slate-900 p-2">
                        <div className="font-semibold text-rose-950 print:text-black">{r.content}</div>
                        {r.remediationPlan && (
                          <div className="text-[11px] mt-0.5"><em>Yêu cầu:</em> {r.remediationPlan}</div>
                        )}
                        <div className="text-[10px] text-slate-600 mt-0.5">
                          Nhắc nhở: {r.reviewedBy} &bull; Hình thức: {r.reprimandType}
                        </div>
                      </td>
                      <td className="border border-slate-900 p-2 text-center font-semibold text-[11px]">
                        {r.remediationStatus}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Part V: Evaluation & Comments by Leadership (Editable) */}
        <div className="space-y-3 mt-6 pt-2">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold uppercase tracking-wide">
              V. NHẬN XÉT – ĐÁNH GIÁ CỦA CHỈ HUY ĐƠN VỊ
            </h3>
            <div className="print:hidden">
              {isEditingNotes ? (
                <button
                  onClick={handleSaveEvaluation}
                  className="flex items-center space-x-1 px-3 py-1 bg-emerald-700 hover:bg-emerald-600 text-white rounded text-xs font-sans font-semibold"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>Lưu đánh giá</span>
                </button>
              ) : (
                <button
                  onClick={() => setIsEditingNotes(true)}
                  className="flex items-center space-x-1 px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-xs font-sans font-semibold border border-slate-300"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>Chỉnh sửa nội dung</span>
                </button>
              )}
            </div>
          </div>

          {isEditingNotes ? (
            <div className="space-y-3 text-xs font-sans bg-slate-50 p-4 rounded-xl border border-slate-300">
              <div>
                <label className="font-bold text-slate-800 block mb-1">
                  1. Đánh giá tình hình chung:
                </label>
                <textarea
                  rows={3}
                  value={evaluation.generalReview}
                  onChange={(e) => setEvaluation({ ...evaluation, generalReview: e.target.value })}
                  className="w-full p-2 border border-slate-300 rounded text-xs focus:ring-1 focus:ring-emerald-600"
                  placeholder="Nhập đánh giá tình hình thi đua chung..."
                />
              </div>

              <div>
                <label className="font-bold text-emerald-900 block mb-1">
                  2. Ưu điểm nổi bật:
                </label>
                <textarea
                  rows={3}
                  value={evaluation.advantages}
                  onChange={(e) => setEvaluation({ ...evaluation, advantages: e.target.value })}
                  className="w-full p-2 border border-slate-300 rounded text-xs focus:ring-1 focus:ring-emerald-600"
                  placeholder="Nhập ưu điểm nổi bật..."
                />
              </div>

              <div>
                <label className="font-bold text-rose-900 block mb-1">
                  3. Hạn chế, tồn tại:
                </label>
                <textarea
                  rows={2}
                  value={evaluation.disadvantages}
                  onChange={(e) => setEvaluation({ ...evaluation, disadvantages: e.target.value })}
                  className="w-full p-2 border border-slate-300 rounded text-xs focus:ring-1 focus:ring-emerald-600"
                  placeholder="Nhập những mặt còn hạn chế cần chấn chỉnh..."
                />
              </div>

              <div>
                <label className="font-bold text-slate-800 block mb-1">
                  4. Phương hướng, biện pháp trọng tâm tháng tới:
                </label>
                <textarea
                  rows={3}
                  value={evaluation.solutions}
                  onChange={(e) => setEvaluation({ ...evaluation, solutions: e.target.value })}
                  className="w-full p-2 border border-slate-300 rounded text-xs focus:ring-1 focus:ring-emerald-600"
                  placeholder="Nhập phương hướng công tác tuần/tháng tới..."
                />
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2">
                <div>
                  <label className="font-semibold text-slate-700 block mb-0.5">Người lập báo cáo:</label>
                  <input
                    type="text"
                    value={evaluation.reporterName}
                    onChange={(e) => setEvaluation({ ...evaluation, reporterName: e.target.value })}
                    className="w-full p-1.5 border border-slate-300 rounded text-xs"
                  />
                  <input
                    type="text"
                    value={evaluation.reporterPosition}
                    onChange={(e) => setEvaluation({ ...evaluation, reporterPosition: e.target.value })}
                    className="w-full p-1.5 border border-slate-300 rounded text-xs mt-1"
                    placeholder="Chức vụ người lập"
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-0.5">Chỉ huy phê duyệt:</label>
                  <input
                    type="text"
                    value={evaluation.commanderName}
                    onChange={(e) => setEvaluation({ ...evaluation, commanderName: e.target.value })}
                    className="w-full p-1.5 border border-slate-300 rounded text-xs"
                  />
                  <input
                    type="text"
                    value={evaluation.commanderPosition}
                    onChange={(e) => setEvaluation({ ...evaluation, commanderPosition: e.target.value })}
                    className="w-full p-1.5 border border-slate-300 rounded text-xs mt-1"
                    placeholder="Chức vụ chỉ huy"
                  />
                </div>
              </div>

              <div className="text-right pt-2">
                <button
                  disabled={isSavingEvaluation}
                  onClick={handleSaveEvaluation}
                  className="px-4 py-1.5 bg-emerald-700 hover:bg-emerald-600 disabled:opacity-50 text-white rounded font-bold text-xs flex items-center gap-1.5 transition-colors"
                >
                  {isSavingEvaluation && <RefreshCw className="w-3 h-3 animate-spin" />}
                  <span>{isSavingEvaluation ? 'Đang lưu...' : 'Lưu thay đổi'}</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-3 text-xs sm:text-sm text-slate-800 print:text-black leading-relaxed">
              <div>
                <strong>1. Đánh giá tình hình chung:</strong>
                <p className="mt-1 text-justify indent-6">
                  {evaluation.generalReview || 'Chưa cập nhật nội dung đánh giá.'}
                </p>
              </div>

              <div>
                <strong>2. Ưu điểm nổi bật:</strong>
                <p className="mt-1 text-justify whitespace-pre-line">
                  {evaluation.advantages || 'Chưa cập nhật.'}
                </p>
              </div>

              <div>
                <strong>3. Hạn chế, tồn tại:</strong>
                <p className="mt-1 text-justify whitespace-pre-line">
                  {evaluation.disadvantages || 'Chưa có ghi nhận tồn tại.'}
                </p>
              </div>

              <div>
                <strong>4. Phương hướng, biện pháp trọng tâm tháng tới:</strong>
                <p className="mt-1 text-justify whitespace-pre-line">
                  {evaluation.solutions || 'Chưa cập nhật.'}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Signatures Footer */}
        <div className="grid grid-cols-2 gap-4 mt-12 pt-4 text-center text-xs sm:text-sm">
          <div>
            <div className="font-bold uppercase tracking-wide">NGƯỜI LẬP BÁO CÁO</div>
            <div className="italic text-slate-500 print:text-black text-xs">(Ký, ghi rõ họ tên)</div>
            <div className="h-20"></div>
            <div className="font-bold text-slate-900 print:text-black">{evaluation.reporterName}</div>
            <div className="text-xs text-slate-600 print:text-black">{evaluation.reporterPosition}</div>
          </div>

          <div>
            <div className="font-bold uppercase tracking-wide">CHÍNH TRỊ VIÊN / ĐỒN TRƯỞNG</div>
            <div className="italic text-slate-500 print:text-black text-xs">(Ký, đóng dấu)</div>
            <div className="h-20"></div>
            <div className="font-bold text-slate-900 print:text-black">{evaluation.commanderName}</div>
            <div className="text-xs text-slate-600 print:text-black">{evaluation.commanderPosition}</div>
          </div>
        </div>
      </div>
    </div>
  );
};
