import React, { useEffect, useRef, useState } from 'react';
import {
  Database,
  Download,
  Upload,
  RefreshCw,
  Trash2,
  Shield,
  FileSpreadsheet,
  CheckCircle2,
  AlertTriangle,
  Info,
  Users,
  UserCheck,
  UserX,
  Lock,
} from 'lucide-react';
import {
  clearAllData,
  deleteAppUser,
  exportDatabaseToJson,
  exportToExcel,
  getAppUsers,
  loadDatabase,
  resetToSampleData,
  restoreDatabaseFromJson,
  updateAppUserRole,
  updateUnitInfo,
} from '../services/storage';
import { AppUser, UserRole } from '../types';

interface BackupSettingsViewProps {
  unitInfo: {
    unitName: string;
    parentUnit: string;
    superiorUnit: string;
    stationLocation: string;
  };
  currentUserProfile?: AppUser | null;
  onToast: (msg: string) => void;
  onRefreshData: () => void;
}

export const BackupSettingsView: React.FC<BackupSettingsViewProps> = ({
  unitInfo,
  currentUserProfile,
  onToast,
  onRefreshData,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [currentUnitInfo, setCurrentUnitInfo] = useState(unitInfo);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingText, setProcessingText] = useState('');

  // User management state (Admin only)
  const [appUsers, setAppUsers] = useState<AppUser[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);

  const isAdmin = currentUserProfile?.role === 'admin';

  const fetchUsers = async () => {
    if (!isAdmin) return;
    setLoadingUsers(true);
    try {
      const users = await getAppUsers();
      setAppUsers(users);
    } catch (err) {
      console.warn('Could not load users list:', err);
    } finally {
      setLoadingUsers(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [isAdmin]);

  const handleExportJson = () => {
    if (!isAdmin) {
      onToast('Chỉ Quản trị viên mới có quyền sao lưu toàn bộ cơ sở dữ liệu.');
      return;
    }
    try {
      exportDatabaseToJson();
      onToast('Đã tạo và tải file sao lưu toàn hệ thống (.json)!');
    } catch (err: any) {
      onToast('Lỗi sao lưu: ' + (err?.message || String(err)));
    }
  };

  const handleExportExcel = () => {
    if (!isAdmin) {
      onToast('Chỉ Quản trị viên mới có quyền xuất toàn bộ cơ sở dữ liệu.');
      return;
    }
    try {
      exportToExcel('ALL');
      onToast('Đã xuất file bảng tính Excel toàn bộ cơ sở dữ liệu!');
    } catch (err: any) {
      onToast('Lỗi xuất Excel: ' + (err?.message || String(err)));
    }
  };

  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!isAdmin) {
      onToast('Chỉ Quản trị viên mới có quyền khôi phục cơ sở dữ liệu.');
      return;
    }

    const reader = new FileReader();
    reader.onload = async (event) => {
      const content = event.target?.result as string;
      if (content) {
        setIsProcessing(true);
        setProcessingText('Đang kiểm tra và khôi phục dữ liệu lên Firestore...');
        try {
          const result = await restoreDatabaseFromJson(content);
          if (result.success) {
            onToast(result.message);
            onRefreshData();
          } else {
            onToast(result.message);
          }
        } catch (err: any) {
          onToast('Lỗi khôi phục: ' + (err?.message || String(err)));
        } finally {
          setIsProcessing(false);
        }
      }
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSaveUnitInfo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdmin) {
      onToast('Chỉ Quản trị viên mới có quyền thay đổi thông tin đơn vị.');
      return;
    }
    setIsProcessing(true);
    setProcessingText('Đang lưu thông tin đơn vị...');
    try {
      await updateUnitInfo(currentUnitInfo);
      onToast('Đã lưu thông tin đơn vị thành công!');
      onRefreshData();
    } catch (err: any) {
      onToast('Lỗi khi lưu thông tin đơn vị: ' + (err?.message || String(err)));
    } finally {
      setIsProcessing(false);
    }
  };

  const handleResetSample = async () => {
    if (!isAdmin) {
      onToast('Chỉ Quản trị viên mới có quyền đặt lại dữ liệu mẫu.');
      return;
    }
    setIsProcessing(true);
    setProcessingText('Đang nạp lại bộ dữ liệu mẫu lên Firestore...');
    try {
      await resetToSampleData();
      setShowResetConfirm(false);
      onToast('Đã khôi phục toàn bộ bộ dữ liệu mẫu chuẩn của Đồn BP Hòn Sơn!');
      onRefreshData();
    } catch (err: any) {
      onToast('Lỗi nạp dữ liệu mẫu: ' + (err?.message || String(err)));
    } finally {
      setIsProcessing(false);
    }
  };

  const handleClearAll = async () => {
    if (!isAdmin) {
      onToast('Chỉ Quản trị viên mới có quyền làm trống cơ sở dữ liệu.');
      return;
    }
    setIsProcessing(true);
    setProcessingText('Đang làm trống toàn bộ dữ liệu trên Firestore...');
    try {
      await clearAllData();
      setShowClearConfirm(false);
      onToast('Đã làm trống toàn bộ dữ liệu thành công!');
      onRefreshData();
    } catch (err: any) {
      onToast('Lỗi khi xóa dữ liệu: ' + (err?.message || String(err)));
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRoleChange = async (uid: string, newRole: UserRole, currentActive: boolean) => {
    try {
      await updateAppUserRole(uid, newRole, currentActive);
      onToast('Đã cập nhật vai trò người dùng thành công!');
      fetchUsers();
    } catch (err: any) {
      onToast('Lỗi cập nhật vai trò: ' + (err?.message || String(err)));
    }
  };

  const handleToggleActive = async (uid: string, currentRole: UserRole, newActive: boolean) => {
    try {
      await updateAppUserRole(uid, currentRole, newActive);
      onToast(newActive ? 'Đã kích hoạt tài khoản thành công!' : 'Đã khóa tài khoản thành công!');
      fetchUsers();
    } catch (err: any) {
      onToast('Lỗi cập nhật trạng thái: ' + (err?.message || String(err)));
    }
  };

  const handleDeleteUser = async (user: AppUser) => {
    if (!window.confirm(`Xác nhận xóa tài khoản ${user.displayName} (${user.email}) khỏi hệ thống?`)) {
      return;
    }
    try {
      await deleteAppUser(user.uid);
      onToast(`Đã xóa tài khoản ${user.displayName} thành công!`);
      fetchUsers();
    } catch (err: any) {
      onToast('Lỗi xóa tài khoản: ' + (err?.message || String(err)));
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white rounded-xl p-4 shadow-xs border border-slate-200">
        <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
          <Database className="w-5 h-5 text-emerald-700" />
          <span>SAO LƯU, KHÔI PHỤC VÀ CÀI ĐẶT HỆ THỐNG</span>
        </h2>
        <p className="text-xs text-slate-500 mt-0.5">
          Bảo đảm an toàn dữ liệu cơ sở dữ liệu đám mây Firebase Cloud Firestore, tải về bản sao lưu dự phòng hoặc quản lý tài khoản đơn vị
        </p>
      </div>

      {/* Processing State Indicator */}
      {isProcessing && (
        <div className="p-3 bg-amber-50 border border-amber-300 rounded-xl flex items-center gap-3 text-amber-900 text-xs sm:text-sm font-semibold animate-pulse">
          <RefreshCw className="w-4 h-4 text-amber-700 animate-spin" />
          <span>{processingText || 'Đang đồng bộ cơ sở dữ liệu đám mây...'}</span>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Backup & Restore Box */}
        <div className="bg-white rounded-xl p-6 shadow-xs border border-slate-200 space-y-5">
          <div className="flex items-center space-x-2 text-emerald-900 border-b border-slate-100 pb-3">
            <Download className="w-5 h-5 text-emerald-700" />
            <h3 className="font-bold text-base">Sao lưu & Xuất dữ liệu</h3>
          </div>

          <p className="text-xs text-slate-600 leading-relaxed">
            Dữ liệu được lưu trữ trực tuyến an toàn trên Firebase Cloud Firestore. Cán bộ quản lý có thể xuất bản sao lưu định kỳ dạng file JSON hoặc Excel về máy tính cá nhân để phục vụ lưu trữ nghiệp vụ.
          </p>

          <div className="space-y-3">
            <button
              onClick={handleExportJson}
              disabled={isProcessing || !isAdmin}
              className={`w-full flex items-center justify-between p-3.5 rounded-xl border text-sm font-bold transition-all ${
                isAdmin
                  ? 'bg-emerald-50 hover:bg-emerald-100 border-emerald-300 text-emerald-950 cursor-pointer'
                  : 'bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed'
              } disabled:opacity-60`}
            >
              <div className="flex items-center space-x-3">
                <Download className={`w-5 h-5 ${isAdmin ? 'text-emerald-700' : 'text-slate-400'}`} />
                <div className="text-left">
                  <div>Tải file sao lưu toàn vẹn (.JSON)</div>
                  <div className={`text-xs font-normal ${isAdmin ? 'text-emerald-700' : 'text-slate-400'}`}>
                    Bao gồm toàn bộ quân số, biểu dương, phê bình, khen thưởng và đi phép
                  </div>
                </div>
              </div>
              <span className={`text-xs px-2 py-1 rounded ${isAdmin ? 'bg-emerald-700 text-white' : 'bg-slate-200 text-slate-500'}`}>
                {isAdmin ? 'Tải về' : 'Chỉ Quản trị viên'}
              </span>
            </button>

            <button
              onClick={handleExportExcel}
              disabled={isProcessing || !isAdmin}
              className={`w-full flex items-center justify-between p-3.5 rounded-xl border text-sm font-bold transition-all ${
                isAdmin
                  ? 'bg-slate-50 hover:bg-slate-100 border-slate-300 text-slate-900 cursor-pointer'
                  : 'bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed'
              } disabled:opacity-60`}
            >
              <div className="flex items-center space-x-3">
                <FileSpreadsheet className={`w-5 h-5 ${isAdmin ? 'text-emerald-700' : 'text-slate-400'}`} />
                <div className="text-left">
                  <div>Xuất toàn bộ ra file Excel (.XLSX)</div>
                  <div className="text-xs text-slate-400 font-normal">
                    Chia thành các sheet riêng: Quân số, Biểu dương, Phê bình, Khen thưởng
                  </div>
                </div>
              </div>
              <span className={`text-xs px-2 py-1 rounded ${isAdmin ? 'bg-slate-700 text-white' : 'bg-slate-200 text-slate-500'}`}>
                {isAdmin ? 'Tải Excel' : 'Chỉ Quản trị viên'}
              </span>
            </button>
          </div>

          {/* Restore Section */}
          <div className="border-t border-slate-100 pt-5 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2 text-slate-800 font-bold text-sm">
                <Upload className="w-4 h-4 text-emerald-700" />
                <span>Khôi phục dữ liệu từ file sao lưu</span>
              </div>
              {!isAdmin && (
                <span className="text-[10px] bg-slate-100 text-slate-500 px-2 py-0.5 rounded border border-slate-200">
                  Chỉ Quản trị viên
                </span>
              )}
            </div>

            <p className="text-xs text-slate-500">
              Chọn file sao lưu định dạng <strong>.json</strong> đã xuất để phục hồi lại hệ thống (xóa sạch tài liệu cũ và đồng bộ mới):
            </p>

            <input
              type="file"
              ref={fileInputRef}
              accept=".json"
              onChange={handleImportFile}
              className="hidden"
            />

            <button
              onClick={() => {
                if (!isAdmin) {
                  onToast('Chỉ Quản trị viên (Admin) mới có quyền khôi phục cơ sở dữ liệu!');
                  return;
                }
                fileInputRef.current?.click();
              }}
              disabled={isProcessing || !isAdmin}
              className={`w-full py-2.5 px-4 font-semibold text-xs sm:text-sm rounded-xl transition-colors flex items-center justify-center space-x-2 ${
                isAdmin
                  ? 'bg-slate-800 hover:bg-slate-700 text-white cursor-pointer'
                  : 'bg-slate-200 text-slate-400 cursor-not-allowed'
              }`}
            >
              <Upload className="w-4 h-4 text-amber-300" />
              <span>{isProcessing ? 'Đang xử lý...' : 'Chọn file JSON để khôi phục'}</span>
            </button>
          </div>
        </div>

        {/* Unit Info & Danger Zone */}
        <div className="space-y-6">
          {/* Unit Info Config */}
          <div className="bg-white rounded-xl p-6 shadow-xs border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
              <div className="flex items-center space-x-2 text-emerald-900">
                <Shield className="w-5 h-5 text-emerald-700" />
                <h3 className="font-bold text-base">Thông tin đơn vị áp dụng trong báo cáo</h3>
              </div>
              {!isAdmin && (
                <span className="text-[10px] bg-slate-100 text-slate-500 px-2 py-0.5 rounded border border-slate-200">
                  Chỉ Quản trị viên
                </span>
              )}
            </div>

            <form onSubmit={handleSaveUnitInfo} className="space-y-3 text-xs sm:text-sm">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Tên đơn vị:</label>
                <input
                  type="text"
                  disabled={isProcessing || !isAdmin}
                  value={currentUnitInfo.unitName}
                  onChange={(e) =>
                    setCurrentUnitInfo({ ...currentUnitInfo, unitName: e.target.value })
                  }
                  className="w-full p-2 border border-slate-300 rounded-lg text-xs disabled:bg-slate-50 disabled:text-slate-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Đơn vị chủ quản cấp tỉnh:</label>
                <input
                  type="text"
                  disabled={isProcessing || !isAdmin}
                  value={currentUnitInfo.parentUnit}
                  onChange={(e) =>
                    setCurrentUnitInfo({ ...currentUnitInfo, parentUnit: e.target.value })
                  }
                  className="w-full p-2 border border-slate-300 rounded-lg text-xs disabled:bg-slate-50 disabled:text-slate-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Cấp trên trực tiếp:</label>
                <input
                  type="text"
                  disabled={isProcessing || !isAdmin}
                  value={currentUnitInfo.superiorUnit}
                  onChange={(e) =>
                    setCurrentUnitInfo({ ...currentUnitInfo, superiorUnit: e.target.value })
                  }
                  className="w-full p-2 border border-slate-300 rounded-lg text-xs disabled:bg-slate-50 disabled:text-slate-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Địa bàn đóng quân:</label>
                <input
                  type="text"
                  disabled={isProcessing || !isAdmin}
                  value={currentUnitInfo.stationLocation}
                  onChange={(e) =>
                    setCurrentUnitInfo({ ...currentUnitInfo, stationLocation: e.target.value })
                  }
                  className="w-full p-2 border border-slate-300 rounded-lg text-xs disabled:bg-slate-50 disabled:text-slate-500"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isProcessing || !isAdmin}
                  className={`w-full py-2 font-bold text-xs rounded-lg transition-colors ${
                    isAdmin
                      ? 'bg-emerald-700 hover:bg-emerald-600 text-white cursor-pointer'
                      : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                  } disabled:opacity-50`}
                >
                  {isAdmin ? 'Lưu thay đổi thông tin đơn vị' : 'Chỉ Quản trị viên mới có quyền sửa thông tin đơn vị'}
                </button>
              </div>
            </form>
          </div>

          {/* Reset / Clear Data */}
          <div className="bg-white rounded-xl p-5 shadow-xs border border-slate-200">
            <h4 className="font-bold text-sm text-slate-800 mb-2 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Info className="w-4 h-4 text-amber-600" />
                <span>Khởi tạo & Quản trị dữ liệu</span>
              </span>
              {!isAdmin && (
                <span className="text-[10px] bg-slate-100 text-slate-500 px-2 py-0.5 rounded border border-slate-200">
                  Chỉ Quản trị viên
                </span>
              )}
            </h4>
            <p className="text-xs text-slate-600 mb-3">
              Chỉ huy đơn vị có thể làm sạch toàn bộ cơ sở dữ liệu để bắt đầu nhập thực tế, hoặc nạp lại bộ dữ liệu mẫu chuẩn Đồn BP Hòn Sơn khi cần đào tạo, huấn luyện.
            </p>

            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => {
                  if (!isAdmin) {
                    onToast('Chỉ Quản trị viên (Admin) mới có quyền nạp lại dữ liệu mẫu!');
                    return;
                  }
                  setShowResetConfirm(true);
                }}
                disabled={isProcessing || !isAdmin}
                className={`p-2 rounded-lg border font-semibold text-xs flex items-center justify-center gap-1 ${
                  isAdmin
                    ? 'bg-amber-50 hover:bg-amber-100 border-amber-300 text-amber-900 cursor-pointer'
                    : 'bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed'
                }`}
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Nạp lại dữ liệu mẫu</span>
              </button>

              <button
                onClick={() => {
                  if (!isAdmin) {
                    onToast('Chỉ Quản trị viên (Admin) mới có quyền làm trống toàn bộ dữ liệu!');
                    return;
                  }
                  setShowClearConfirm(true);
                }}
                disabled={isProcessing || !isAdmin}
                className={`p-2 rounded-lg border font-semibold text-xs flex items-center justify-center gap-1 ${
                  isAdmin
                    ? 'bg-rose-50 hover:bg-rose-100 border-rose-300 text-rose-800 cursor-pointer'
                    : 'bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed'
                }`}
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Xóa trắng nhập thật</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Admin User Management Section */}
      {isAdmin && (
        <div className="bg-white rounded-xl p-6 shadow-xs border border-slate-200 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center space-x-2 text-emerald-950 font-bold text-base">
              <Users className="w-5 h-5 text-emerald-700" />
              <span>DANH SÁCH TÀI KHOẢN & PHÂN QUYỀN TRUY CẬP</span>
            </div>
            <button
              onClick={fetchUsers}
              className="text-xs text-emerald-700 hover:text-emerald-800 font-semibold flex items-center gap-1 p-1"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loadingUsers ? 'animate-spin' : ''}`} />
              <span>Tải lại</span>
            </button>
          </div>

          <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 text-xs text-slate-600 space-y-1">
            <p>
              <strong>Quy tắc phân quyền:</strong>
            </p>
            <ul className="list-disc list-inside space-y-0.5 text-slate-600">
              <li>
                <strong className="text-emerald-800">Quản trị viên (Admin):</strong> Toàn quyền xem, thêm, sửa, xóa, sao lưu, khôi phục, quản lý tài khoản.
              </li>
              <li>
                <strong className="text-blue-800">Biên tập viên (Editor):</strong> Xem, thêm, cập nhật dữ liệu quân số, biểu dương, phê bình, đi phép. Không xóa cơ sở dữ liệu.
              </li>
              <li>
                <strong className="text-slate-700">Người xem (Viewer):</strong> Chỉ tra cứu số liệu và xuất báo cáo Word / Excel / Print. Không được sửa đổi.
              </li>
              <li>
                <strong>Tài khoản chưa kích hoạt (Khóa/Chờ duyệt):</strong> Không có quyền truy cập cơ sở dữ liệu.
              </li>
            </ul>
          </div>

          <div className="overflow-x-auto border border-slate-200 rounded-xl">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-100 text-slate-700 uppercase font-bold border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-3">Cán bộ / Email</th>
                  <th className="py-2.5 px-3">Vai trò phân quyền</th>
                  <th className="py-2.5 px-3 text-center">Trạng thái</th>
                  <th className="py-2.5 px-3 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {appUsers.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="text-center py-6 text-slate-500">
                      {loadingUsers ? 'Đang tải danh sách tài khoản...' : 'Chưa có tài khoản nào được ghi nhận.'}
                    </td>
                  </tr>
                ) : (
                  appUsers.map((u) => {
                    const isSelf = u.uid === currentUserProfile?.uid;
                    return (
                      <tr key={u.uid} className="hover:bg-slate-50 transition-colors">
                        <td className="py-2.5 px-3">
                          <div className="font-bold text-slate-900">{u.displayName || 'Cán bộ'}</div>
                          <div className="text-[11px] text-slate-500">{u.email}</div>
                        </td>
                        <td className="py-2.5 px-3">
                          <select
                            value={u.role}
                            disabled={isSelf}
                            onChange={(e) =>
                              handleRoleChange(u.uid, e.target.value as UserRole, u.active)
                            }
                            className="bg-white border border-slate-300 rounded px-2 py-1 text-xs font-semibold text-slate-800 disabled:opacity-60"
                          >
                            <option value="admin">Quản trị viên (Admin)</option>
                            <option value="editor">Biên tập viên (Editor)</option>
                            <option value="viewer">Người xem (Viewer)</option>
                          </select>
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          <button
                            onClick={() => handleToggleActive(u.uid, u.role, !u.active)}
                            disabled={isSelf}
                            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold transition-colors ${
                              u.active
                                ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                                : 'bg-rose-100 text-rose-800 hover:bg-rose-200'
                            } ${isSelf ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'}`}
                          >
                            {u.active ? (
                              <>
                                <UserCheck className="w-3 h-3 text-emerald-700" />
                                <span>Kích hoạt</span>
                              </>
                            ) : (
                              <>
                                <UserX className="w-3 h-3 text-rose-700" />
                                <span>Chờ duyệt / Khóa</span>
                              </>
                            )}
                          </button>
                        </td>
                        <td className="py-2.5 px-3 text-right">
                          {!isSelf && (
                            <button
                              onClick={() => handleDeleteUser(u)}
                              title="Xóa tài khoản khỏi hệ thống"
                              className="text-rose-600 hover:text-rose-800 p-1 hover:bg-rose-50 rounded transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Confirmation Modal: Reset */}
      {showResetConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="bg-white rounded-xl max-w-sm w-full p-5 space-y-4 border border-slate-300 shadow-xl">
            <div className="flex items-center space-x-2 text-amber-600 font-bold">
              <AlertTriangle className="w-5 h-5" />
              <span>Xác nhận nạp dữ liệu mẫu?</span>
            </div>
            <p className="text-xs text-slate-600">
              Thao tác này sẽ ghi đè cơ sở dữ liệu hiện tại bằng bộ danh sách cán bộ, chiến sĩ và các lượt biểu dương, phê bình mẫu của Đồn BP Hòn Sơn.
            </p>
            <div className="flex justify-end space-x-2 pt-2">
              <button
                onClick={() => setShowResetConfirm(false)}
                disabled={isProcessing}
                className="px-3 py-1.5 rounded text-xs font-semibold bg-slate-100 hover:bg-slate-200"
              >
                Hủy bỏ
              </button>
              <button
                onClick={handleResetSample}
                disabled={isProcessing}
                className="px-3 py-1.5 rounded text-xs font-bold bg-amber-600 hover:bg-amber-500 text-white flex items-center gap-1"
              >
                {isProcessing && <RefreshCw className="w-3 h-3 animate-spin" />}
                <span>{isProcessing ? 'Đang nạp...' : 'Đồng ý nạp lại'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal: Clear */}
      {showClearConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="bg-white rounded-xl max-w-sm w-full p-5 space-y-4 border border-rose-300 shadow-xl">
            <div className="flex items-center space-x-2 text-rose-600 font-bold">
              <AlertTriangle className="w-5 h-5" />
              <span>Xác nhận xóa trắng toàn bộ dữ liệu?</span>
            </div>
            <p className="text-xs text-slate-600">
              Bạn có chắc chắn muốn làm sạch toàn bộ danh sách quân nhân, biểu dương, phê bình và đi phép trên Firebase để bắt đầu nhập số liệu thực tế của đơn vị?
            </p>
            <div className="flex justify-end space-x-2 pt-2">
              <button
                onClick={() => setShowClearConfirm(false)}
                disabled={isProcessing}
                className="px-3 py-1.5 rounded text-xs font-semibold bg-slate-100 hover:bg-slate-200"
              >
                Hủy bỏ
              </button>
              <button
                onClick={handleClearAll}
                disabled={isProcessing}
                className="px-3 py-1.5 rounded text-xs font-bold bg-rose-600 hover:bg-rose-500 text-white flex items-center gap-1"
              >
                {isProcessing && <RefreshCw className="w-3 h-3 animate-spin" />}
                <span>{isProcessing ? 'Đang xóa...' : 'Xóa tất cả'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
