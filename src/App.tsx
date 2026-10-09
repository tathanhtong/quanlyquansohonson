/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { AppDatabase, AppUser, Commendation, LeaveRecord, Reprimand, Reward, Soldier } from './types';
import {
  addCommendation,
  addLeave,
  addReprimand,
  addReward,
  addSoldier,
  checkAndMigrateData,
  deleteCommendation,
  deleteLeave,
  deleteReprimand,
  deleteReward,
  deleteSoldier,
  deleteAllSoldiers,
  exportLeavesToExcel,
  exportToExcel,
  fetchAllFromFirestore,
  getEmptyDatabase,
  getSyncStatus,
  importSoldiersBatch,
  listenToCurrentUserProfile,
  loadDatabase,
  markLeaveReturned,
  resetMemoryDatabase,
  setCurrentUserProfileState,
  setupRealtimeListeners,
  stopRealtimeListeners,
  subscribeDatabase,
  subscribeSyncStatus,
  syncUserProfile,
  SyncStatus,
  updateCommendation,
  updateLeave,
  updateReprimand,
  updateReward,
  updateSoldier,
} from './services/storage';
import {
  auth,
  loginWithGoogle,
  logoutUser,
  onAuthStateChanged,
  User,
} from './services/firebase';

import { Header } from './components/Header';
import { NavTab, Sidebar } from './components/Sidebar';
import { Dashboard } from './components/Dashboard';
import { WeeklyTracker } from './components/WeeklyTracker';
import { SoldiersList } from './components/SoldiersList';
import { LeaveTracker } from './components/LeaveTracker';
import { CommendationsList } from './components/CommendationsList';
import { ReprimandsList } from './components/ReprimandsList';
import { RewardsList } from './components/RewardsList';
import { StatisticsView } from './components/StatisticsView';
import { MonthlyReportView } from './components/MonthlyReportView';
import { AuditLogView } from './components/AuditLogView';
import { BackupSettingsView } from './components/BackupSettingsView';
import { BorderGuardBadge } from './components/BorderGuardBadge';

import { SoldierModal } from './components/modals/SoldierModal';
import { ImportSoldiersModal } from './components/modals/ImportSoldiersModal';
import { CommendationModal } from './components/modals/CommendationModal';
import { ReprimandModal } from './components/modals/ReprimandModal';
import { RewardModal } from './components/modals/RewardModal';
import { LeaveModal } from './components/modals/LeaveModal';
import { ConfirmDeleteModal } from './components/modals/ConfirmDeleteModal';
import { SoldierProfileModal } from './components/SoldierProfileModal';
import { Toast } from './components/Toast';

import { ParsedSoldierCandidate } from './utils/soldierImporter';
import { Lock, LogIn, ShieldCheck } from 'lucide-react';

export default function App() {
  const [db, setDb] = useState<AppDatabase>(() => getEmptyDatabase());

  // Auth & Sync State
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [currentUserProfile, setCurrentUserProfile] = useState<AppUser | null>(null);
  const currentUserProfileRef = useRef<AppUser | null>(null);
  useEffect(() => {
    currentUserProfileRef.current = currentUserProfile;
  }, [currentUserProfile]);

  const [authLoading, setAuthLoading] = useState<boolean>(true);
  const [syncStatus, setSyncStatus] = useState<SyncStatus>(getSyncStatus());

  // Period state: default to current real local month/year
  const [selectedMonth, setSelectedMonth] = useState<number>(
    () => new Date().getMonth() + 1
  );
  const [selectedYear, setSelectedYear] = useState<number>(
    () => new Date().getFullYear()
  );

  // Active navigation tab
  const [currentTab, setCurrentTab] = useState<NavTab>('dashboard');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Toast notification
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
  }, []);

  // Modals state
  const [soldierModalOpen, setSoldierModalOpen] = useState(false);
  const [editingSoldier, setEditingSoldier] = useState<Soldier | null>(null);

  const [commendationModalOpen, setCommendationModalOpen] = useState(false);
  const [editingCommendation, setEditingCommendation] = useState<Commendation | null>(null);
  const [defaultCommendationSoldierId, setDefaultCommendationSoldierId] = useState<string | undefined>();
  const [defaultCommendationWeek, setDefaultCommendationWeek] = useState<number | undefined>();

  const [reprimandModalOpen, setReprimandModalOpen] = useState(false);
  const [editingReprimand, setEditingReprimand] = useState<Reprimand | null>(null);
  const [defaultReprimandSoldierId, setDefaultReprimandSoldierId] = useState<string | undefined>();
  const [defaultReprimandWeek, setDefaultReprimandWeek] = useState<number | undefined>();

  const [rewardModalOpen, setRewardModalOpen] = useState(false);
  const [editingReward, setEditingReward] = useState<Reward | null>(null);

  const [leaveModalOpen, setLeaveModalOpen] = useState(false);
  const [editingLeave, setEditingLeave] = useState<LeaveRecord | null>(null);

  const [importModalOpen, setImportModalOpen] = useState(false);

  // Profile Modal
  const [viewingSoldierProfile, setViewingSoldierProfile] = useState<Soldier | null>(null);

  // Confirm Delete Modal
  const [deleteModalConfig, setDeleteModalConfig] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    itemName: string;
    onConfirm: () => void | Promise<void>;
  }>({
    isOpen: false,
    title: '',
    message: '',
    itemName: '',
    onConfirm: () => {},
  });

  const closeAllModals = useCallback(() => {
    setSoldierModalOpen(false);
    setEditingSoldier(null);
    setCommendationModalOpen(false);
    setEditingCommendation(null);
    setDefaultCommendationSoldierId(undefined);
    setDefaultCommendationWeek(undefined);
    setReprimandModalOpen(false);
    setEditingReprimand(null);
    setDefaultReprimandSoldierId(undefined);
    setDefaultReprimandWeek(undefined);
    setRewardModalOpen(false);
    setEditingReward(null);
    setLeaveModalOpen(false);
    setEditingLeave(null);
    setImportModalOpen(false);
    setViewingSoldierProfile(null);
    setDeleteModalConfig((prev) => ({ ...prev, isOpen: false }));
  }, []);

  const userProfileUnsubRef = useRef<(() => void) | null>(null);
  const businessListenersActiveRef = useRef<boolean>(false);

  // Subscribe to persistent storage, auth, and cloud sync
  useEffect(() => {
    const unsubSync = subscribeSyncStatus((s) => {
      setSyncStatus(s);
    });

    const unsubDb = subscribeDatabase((updatedDb) => {
      if (currentUserProfileRef.current?.active) {
        setDb(updatedDb);
      }
    });

    const unsubAuth = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);

      if (userProfileUnsubRef.current) {
        userProfileUnsubRef.current();
        userProfileUnsubRef.current = null;
      }

      if (user) {
        try {
          const profile = await syncUserProfile(user);
          setCurrentUserProfile(profile);
          setCurrentUserProfileState(profile);
        } catch (err) {
          console.error('Error during initial auth sync:', err);
        }

        // Realtime listener for users/{currentUser.uid}
        userProfileUnsubRef.current = listenToCurrentUserProfile(user.uid, async (updatedProfile) => {
          setCurrentUserProfile(updatedProfile);
          setCurrentUserProfileState(updatedProfile);
          setAuthLoading(false);

          if (!updatedProfile.active) {
            // Stop business realtime listeners
            stopRealtimeListeners();
            businessListenersActiveRef.current = false;
            // Do not display database
            resetMemoryDatabase();
            setDb(getEmptyDatabase());
            // Close all open modals
            closeAllModals();
          } else {
            // User is active: start business listeners and sync data
            if (!businessListenersActiveRef.current) {
              businessListenersActiveRef.current = true;
              await checkAndMigrateData();
              const remoteDb = await fetchAllFromFirestore();
              if (remoteDb) {
                setDb(remoteDb);
              }
              setupRealtimeListeners((updated) => {
                setDb({ ...updated });
              });
            }
          }
        });
      } else {
        stopRealtimeListeners();
        businessListenersActiveRef.current = false;
        setCurrentUser(null);
        setCurrentUserProfile(null);
        setCurrentUserProfileState(null);
        resetMemoryDatabase();
        setDb(getEmptyDatabase());
        closeAllModals();
        setAuthLoading(false);
      }
    });

    return () => {
      unsubSync();
      unsubDb();
      unsubAuth();
      if (userProfileUnsubRef.current) {
        userProfileUnsubRef.current();
        userProfileUnsubRef.current = null;
      }
      stopRealtimeListeners();
    };
  }, [closeAllModals]);

  const handleLogin = async () => {
    try {
      const user = await loginWithGoogle();
      showToast(`Đăng nhập thành công: ${user.displayName || user.email}`);
    } catch (err: any) {
      console.error('Login error:', err);
      if (err?.code !== 'auth/popup-closed-by-user') {
        showToast('Lỗi đăng nhập: ' + (err.message || 'Không thể xác thực'));
      }
    }
  };

  const handleLogout = async () => {
    try {
      closeAllModals();
      if (userProfileUnsubRef.current) {
        userProfileUnsubRef.current();
        userProfileUnsubRef.current = null;
      }
      stopRealtimeListeners();
      businessListenersActiveRef.current = false;
      await logoutUser();
      setCurrentUser(null);
      setCurrentUserProfile(null);
      setCurrentUserProfileState(null);
      resetMemoryDatabase();
      setDb(getEmptyDatabase());
      showToast('Đã đăng xuất tài khoản thành công!');
    } catch (err) {
      console.error('Logout error:', err);
    }
  };

  // Handler for Soldier CRUD
  const handleOpenAddSoldier = () => {
    if (currentUserProfile?.role === 'viewer') {
      showToast('Tài khoản ở chế độ chỉ xem, không thể thêm quân nhân.');
      return;
    }
    setEditingSoldier(null);
    setSoldierModalOpen(true);
  };

  const handleOpenEditSoldier = (s: Soldier) => {
    if (currentUserProfile?.role === 'viewer') {
      showToast('Tài khoản ở chế độ chỉ xem, không thể sửa quân nhân.');
      return;
    }
    setEditingSoldier(s);
    setSoldierModalOpen(true);
  };

  const handleSaveSoldier = async (data: Omit<Soldier, 'id' | 'createdAt' | 'updatedAt' | 'stt'>) => {
    try {
      if (editingSoldier) {
        await updateSoldier(editingSoldier.id, data);
        showToast('Đã lưu thành công thông tin cán bộ, chiến sĩ!');
      } else {
        await addSoldier(data);
        showToast('Đã thêm mới thành công cán bộ, chiến sĩ vào quân số!');
      }
      setSoldierModalOpen(false);
      setEditingSoldier(null);
    } catch (err: any) {
      showToast('Lỗi lưu dữ liệu: ' + (err?.message || 'Không thể lưu vào Firestore'));
      throw err;
    }
  };

  const handleDeleteSoldier = (s: Soldier) => {
    if (currentUserProfile?.role !== 'admin') {
      showToast('Chỉ Quản trị viên mới có quyền xóa quân nhân khỏi hệ thống!');
      return;
    }
    setDeleteModalConfig({
      isOpen: true,
      title: 'Xóa cán bộ, chiến sĩ khỏi danh sách',
      message: `Bạn có chắc chắn muốn xóa quân nhân ${s.rank} ${s.fullName} (${s.position})? Tất cả dữ liệu biểu dương, phê bình và khen thưởng của quân nhân này cũng sẽ được loại bỏ khỏi hệ thống.`,
      itemName: `${s.rank} ${s.fullName} - ${s.position}`,
      onConfirm: async () => {
        try {
          await deleteSoldier(s.id);
          showToast(`Đã xóa thành công quân nhân ${s.fullName}!`);
          if (viewingSoldierProfile?.id === s.id) {
            setViewingSoldierProfile(null);
          }
        } catch (err: any) {
          showToast('Lỗi xóa quân nhân: ' + (err?.message || 'Thao tác thất bại'));
          throw err;
        }
      },
    });
  };

  const handleDeleteAllSoldiers = () => {
    if (currentUserProfile?.role !== 'admin') {
      showToast('Chỉ Quản trị viên mới có quyền xóa toàn bộ danh sách quân số!');
      return;
    }
    setDeleteModalConfig({
      isOpen: true,
      title: 'Xóa toàn bộ danh sách quân số',
      message:
        'Bạn có chắc chắn muốn xóa toàn bộ danh sách cán bộ, chiến sĩ?\n\nThao tác này cũng sẽ xóa toàn bộ biểu dương, phê bình, khen thưởng và đi phép/tranh thủ liên quan.\n\nThao tác không thể hoàn tác.',
      itemName: `Toàn bộ ${db.soldiers.length} cán bộ, chiến sĩ`,
      onConfirm: async () => {
        try {
          await deleteAllSoldiers();
          showToast('Đã xóa toàn bộ danh sách quân số.');
          if (viewingSoldierProfile) {
            setViewingSoldierProfile(null);
          }
        } catch (err: any) {
          showToast('Lỗi xóa quân số: ' + (err?.message || 'Thao tác thất bại'));
          throw err;
        }
      },
    });
  };

  const handleImportSoldiers = async (
    newSoldiers: ParsedSoldierCandidate[],
    mode: 'append' | 'replace'
  ) => {
    try {
      await importSoldiersBatch(newSoldiers, mode);
      showToast(
        mode === 'replace'
          ? `Đã thay thế toàn bộ danh sách bằng ${newSoldiers.length} cán bộ, chiến sĩ mới!`
          : `Đã nhập bổ sung ${newSoldiers.length} cán bộ, chiến sĩ vào danh sách quân số!`
      );
      setImportModalOpen(false);
    } catch (err: any) {
      const msg = err?.message || 'Không thể lưu vào Firestore';
      showToast(
        msg.startsWith('Không thể') || msg.startsWith('Chỉ')
          ? msg
          : 'Lỗi nhập dữ liệu: ' + msg
      );
      throw err;
    }
  };

  // Handler for Commendation CRUD
  const handleOpenAddCommendation = (preSoldier?: Soldier, week?: number) => {
    if (currentUserProfile?.role === 'viewer') {
      showToast('Tài khoản ở chế độ chỉ xem, không thể thêm biểu dương.');
      return;
    }
    setEditingCommendation(null);
    setDefaultCommendationSoldierId(preSoldier?.id);
    setDefaultCommendationWeek(week);
    setCommendationModalOpen(true);
  };

  const handleOpenEditCommendation = (item: Commendation) => {
    if (currentUserProfile?.role === 'viewer') {
      showToast('Tài khoản ở chế độ chỉ xem, không thể sửa biểu dương.');
      return;
    }
    setEditingCommendation(item);
    setDefaultCommendationSoldierId(undefined);
    setDefaultCommendationWeek(undefined);
    setCommendationModalOpen(true);
  };

  const handleSaveCommendation = async (data: Omit<Commendation, 'id' | 'createdAt'>) => {
    try {
      if (editingCommendation) {
        await updateCommendation(editingCommendation.id, data);
        showToast('Đã lưu thành công nội dung biểu dương!');
      } else {
        await addCommendation(data);
        showToast('Đã lưu biểu dương thành công!');
      }
      setCommendationModalOpen(false);
      setEditingCommendation(null);
    } catch (err: any) {
      showToast('Lỗi lưu biểu dương: ' + (err?.message || 'Không thể ghi vào Firestore'));
      throw err;
    }
  };

  const handleDeleteCommendation = (item: Commendation) => {
    if (currentUserProfile?.role !== 'admin') {
      showToast('Chỉ Quản trị viên mới có quyền xóa bản ghi biểu dương!');
      return;
    }
    setDeleteModalConfig({
      isOpen: true,
      title: 'Xóa bản ghi biểu dương',
      message: `Bạn có chắc chắn muốn xóa lượt biểu dương tuần ${item.weekNumber} của ${item.rank} ${item.fullName}?`,
      itemName: `${item.rank} ${item.fullName} - Tuần ${item.weekNumber}`,
      onConfirm: async () => {
        try {
          await deleteCommendation(item.id);
          showToast('Đã xóa bản ghi biểu dương thành công!');
        } catch (err: any) {
          showToast('Lỗi khi xóa biểu dương: ' + (err?.message || 'Thao tác thất bại'));
          throw err;
        }
      },
    });
  };

  // Handler for Reprimand CRUD
  const handleOpenAddReprimand = (preSoldier?: Soldier, week?: number) => {
    if (currentUserProfile?.role === 'viewer') {
      showToast('Tài khoản ở chế độ chỉ xem, không thể thêm phê bình.');
      return;
    }
    setEditingReprimand(null);
    setDefaultReprimandSoldierId(preSoldier?.id);
    setDefaultReprimandWeek(week);
    setReprimandModalOpen(true);
  };

  const handleOpenEditReprimand = (item: Reprimand) => {
    if (currentUserProfile?.role === 'viewer') {
      showToast('Tài khoản ở chế độ chỉ xem, không thể sửa phê bình.');
      return;
    }
    setEditingReprimand(item);
    setDefaultReprimandSoldierId(undefined);
    setDefaultReprimandWeek(undefined);
    setReprimandModalOpen(true);
  };

  const handleSaveReprimand = async (data: Omit<Reprimand, 'id' | 'createdAt'>) => {
    try {
      if (editingReprimand) {
        await updateReprimand(editingReprimand.id, data);
        showToast('Đã lưu thành công nội dung phê bình!');
      } else {
        await addReprimand(data);
        showToast('Đã lưu phê bình thành công!');
      }
      setReprimandModalOpen(false);
      setEditingReprimand(null);
    } catch (err: any) {
      showToast('Lỗi lưu phê bình: ' + (err?.message || 'Không thể ghi vào Firestore'));
      throw err;
    }
  };

  const handleDeleteReprimand = (item: Reprimand) => {
    if (currentUserProfile?.role !== 'admin') {
      showToast('Chỉ Quản trị viên mới có quyền xóa bản ghi phê bình!');
      return;
    }
    setDeleteModalConfig({
      isOpen: true,
      title: 'Xóa bản ghi phê bình',
      message: `Bạn có chắc chắn muốn xóa bản ghi phê bình tuần ${item.weekNumber} của ${item.rank} ${item.fullName}?`,
      itemName: `${item.rank} ${item.fullName} - Tuần ${item.weekNumber}`,
      onConfirm: async () => {
        try {
          await deleteReprimand(item.id);
          showToast('Đã xóa bản ghi phê bình thành công!');
        } catch (err: any) {
          showToast('Lỗi khi xóa phê bình: ' + (err?.message || 'Thao tác thất bại'));
          throw err;
        }
      },
    });
  };

  // Handler for Reward CRUD
  const handleOpenAddReward = () => {
    if (currentUserProfile?.role === 'viewer') {
      showToast('Tài khoản ở chế độ chỉ xem, không thể thêm khen thưởng.');
      return;
    }
    setEditingReward(null);
    setRewardModalOpen(true);
  };

  const handleOpenEditReward = (item: Reward) => {
    if (currentUserProfile?.role === 'viewer') {
      showToast('Tài khoản ở chế độ chỉ xem, không thể sửa khen thưởng.');
      return;
    }
    setEditingReward(item);
    setRewardModalOpen(true);
  };

  const handleSaveReward = async (data: Omit<Reward, 'id' | 'createdAt'>) => {
    try {
      if (editingReward) {
        await updateReward(editingReward.id, data);
        showToast('Đã lưu thành công thông tin khen thưởng!');
      } else {
        await addReward(data);
        showToast('Đã lưu khen thưởng thành công!');
      }
      setRewardModalOpen(false);
      setEditingReward(null);
    } catch (err: any) {
      showToast('Lỗi lưu khen thưởng: ' + (err?.message || 'Không thể ghi vào Firestore'));
      throw err;
    }
  };

  const handleDeleteReward = (item: Reward) => {
    if (currentUserProfile?.role !== 'admin') {
      showToast('Chỉ Quản trị viên mới có quyền xóa bản ghi khen thưởng!');
      return;
    }
    setDeleteModalConfig({
      isOpen: true,
      title: 'Xóa bản ghi khen thưởng',
      message: `Bạn có chắc chắn muốn xóa danh hiệu khen thưởng "${item.rewardType}" của ${item.rank} ${item.fullName}?`,
      itemName: `${item.rewardType} - ${item.fullName}`,
      onConfirm: async () => {
        try {
          await deleteReward(item.id);
          showToast('Đã xóa bản ghi khen thưởng thành công!');
        } catch (err: any) {
          showToast('Lỗi khi xóa khen thưởng: ' + (err?.message || 'Thao tác thất bại'));
          throw err;
        }
      },
    });
  };

  // Handler for Leave CRUD
  const handleOpenAddLeave = () => {
    if (currentUserProfile?.role === 'viewer') {
      showToast('Tài khoản ở chế độ chỉ xem, không thể đăng ký đi phép / tranh thủ.');
      return;
    }
    setEditingLeave(null);
    setLeaveModalOpen(true);
  };

  const handleOpenEditLeave = (item: LeaveRecord) => {
    if (currentUserProfile?.role === 'viewer') {
      showToast('Tài khoản ở chế độ chỉ xem, không thể sửa thông tin đi phép.');
      return;
    }
    setEditingLeave(item);
    setLeaveModalOpen(true);
  };

  const handleSaveLeave = async (data: Omit<LeaveRecord, 'id' | 'createdAt'>) => {
    try {
      if (editingLeave) {
        await updateLeave(editingLeave.id, data);
        showToast('Đã cập nhật thông tin đi phép / tranh thủ thành công!');
      } else {
        await addLeave(data);
        showToast('Đã lưu lượt đi phép / tranh thủ thành công!');
      }
      setLeaveModalOpen(false);
      setEditingLeave(null);
    } catch (err: any) {
      showToast('Lỗi lưu đi phép: ' + (err?.message || 'Không thể ghi vào Firestore'));
      throw err;
    }
  };

  const handleDeleteLeave = (item: LeaveRecord) => {
    if (currentUserProfile?.role !== 'admin') {
      showToast('Chỉ Quản trị viên mới có quyền xóa bản ghi đi phép!');
      return;
    }
    setDeleteModalConfig({
      isOpen: true,
      title: 'Xóa bản ghi đi phép / tranh thủ',
      message: `Bạn có chắc chắn muốn xóa bản ghi ${item.category} (${item.leaveType}) của ${item.rank} ${item.fullName}?`,
      itemName: `${item.category} - ${item.fullName}`,
      onConfirm: async () => {
        try {
          await deleteLeave(item.id);
          showToast('Đã xóa bản ghi đi phép / tranh thủ thành công!');
        } catch (err: any) {
          showToast('Lỗi khi xóa đi phép: ' + (err?.message || 'Thao tác thất bại'));
          throw err;
        }
      },
    });
  };

  const handleMarkLeaveReturned = async (id: string, returnDate: string) => {
    try {
      await markLeaveReturned(id, returnDate);
      showToast('Đã xác nhận cán bộ, chiến sĩ về đơn vị đúng hạn!');
    } catch (err: any) {
      showToast('Lỗi xác nhận: ' + (err?.message || 'Không thể cập nhật'));
    }
  };

  const handleExportLeavesExcel = () => {
    exportLeavesToExcel(db.leaves || [], selectedMonth, selectedYear);
    showToast('Đã xuất danh sách đi phép & tranh thủ ra file Excel thành công!');
  };

  // Helper to open soldier profile by ID
  const handleSelectSoldierById = (soldierId: string) => {
    const found = db.soldiers.find((s) => s.id === soldierId);
    if (found) {
      setViewingSoldierProfile(found);
    }
  };

  const handleExportExcelGeneral = () => {
    exportToExcel('MONTH', selectedMonth, selectedYear);
    showToast('Đã xuất file bảng tính Excel thành công!');
  };

  // Count items for sidebar badges
  const monthCommsCount = db.commendations.filter(
    (c) => c.month === selectedMonth && c.year === selectedYear
  ).length;
  const monthRepsCount = db.reprimands.filter(
    (r) => r.month === selectedMonth && r.year === selectedYear
  ).length;
  const activeLeavesCount = (db.leaves || []).filter(
    (l) => l.status === 'Đang nghỉ'
  ).length;

  // 1. Loading screen while Firebase checks authentication
  if (authLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-100 p-4">
        <div className="flex flex-col items-center justify-center py-12 px-8 bg-white rounded-2xl shadow-xl border border-slate-200 space-y-4 max-w-md w-full text-center">
          <BorderGuardBadge size={56} className="mx-auto" />
          <div className="w-10 h-10 border-4 border-emerald-700 border-t-amber-400 rounded-full animate-spin"></div>
          <div>
            <h3 className="text-base font-bold text-slate-800 uppercase tracking-wide">Đang xác thực hệ thống...</h3>
            <p className="text-xs text-slate-500 mt-1">Đang kiểm tra trạng thái phiên làm việc và bảo mật</p>
          </div>
        </div>
      </div>
    );
  }

  // 2. Unauthenticated screen: Only Login Screen (NO Sidebar, NO Header, NO Management data)
  if (!currentUser) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-100 p-4 sm:p-6">
        <div className="max-w-2xl w-full bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden text-center">
          <div className="bg-gradient-to-r from-emerald-950 via-emerald-900 to-emerald-950 p-8 text-white">
            <BorderGuardBadge size={64} className="mx-auto mb-3 hover:scale-105 transition-transform" />
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 tracking-widest uppercase">
              Quân đội Nhân dân Việt Nam &bull; BĐBP Kiên Giang
            </span>
            <h2 className="text-xl font-bold uppercase tracking-wider text-amber-400 font-serif mt-2.5">
              ĐỒN BIÊN PHÒNG HÒN SƠN
            </h2>
            <p className="text-xs text-emerald-100 mt-1 tracking-wide">
              HỆ THỐNG THEO DÕI BIỂU DƯƠNG – KHEN THƯỞNG – PHÊ BÌNH
            </p>
          </div>

          <div className="p-8 sm:p-10 space-y-6">
            <div className="space-y-3">
              <div className="inline-flex p-3 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                <Lock className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-bold text-slate-800 uppercase tracking-wide">
                Yêu cầu xác thực tài khoản đơn vị
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 max-w-md mx-auto leading-relaxed">
                Dữ liệu quân số, biểu dương, phê bình và đi phép đã được đồng bộ trên hệ thống đám mây. Vui lòng đăng nhập Google để xem và cập nhật dữ liệu.
              </p>
            </div>

            <div className="pt-2">
              <button
                onClick={handleLogin}
                className="inline-flex items-center space-x-2.5 px-6 py-3.5 rounded-xl bg-emerald-700 hover:bg-emerald-600 active:scale-95 text-white font-bold text-sm shadow-md transition-all cursor-pointer"
              >
                <LogIn className="w-5 h-5 text-amber-300" />
                <span>Đồng chí hãy Đăng nhập bằng tài khoản Google</span>
              </button>
            </div>

            <div className="text-xs text-slate-500 border-t border-slate-100 pt-4 flex items-center justify-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-700" />
              <span>Cơ sở dữ liệu an toàn &bull; Tác giả: Tạ Thanh Tòng</span>
            </div>
          </div>
        </div>

        <Toast message={toastMessage} onClose={() => setToastMessage(null)} />
      </div>
    );
  }

  // 3. User authenticated but waiting for approval or deactivated/locked
  if (!currentUserProfile || !currentUserProfile.active) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-100 p-4 sm:p-6">
        <div className="max-w-2xl w-full bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden text-center animate-in fade-in duration-200">
          <div className="bg-gradient-to-r from-emerald-950 via-emerald-900 to-emerald-950 p-8 text-white">
            <BorderGuardBadge size={64} className="mx-auto mb-3" />
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 tracking-widest uppercase">
              Quân đội Nhân dân Việt Nam &bull; BĐBP An Giang
            </span>
            <h2 className="text-xl font-bold uppercase tracking-wider text-amber-400 font-serif mt-2.5">
              ĐỒN BIÊN PHÒNG HÒN SƠN
            </h2>
            <p className="text-xs text-emerald-100 mt-1 tracking-wide">
              HỆ THỐNG THEO DÕI BIỂU DƯƠNG – KHEN THƯỞNG – PHÊ BÌNH
            </p>
          </div>

          <div className="p-8 sm:p-10 space-y-6">
            <div className="space-y-3">
              <div className="inline-flex p-3 rounded-full bg-amber-50 text-amber-600 border border-amber-200">
                <Lock className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-bold text-slate-800 uppercase tracking-wide">
                Tài khoản đang chờ phê duyệt truy cập
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 max-w-md mx-auto leading-relaxed">
                Đồng chí <strong>{currentUser.displayName || currentUser.email}</strong> ({currentUser.email}) đã đăng nhập thành công. Để đảm bảo an toàn thông tin nội bộ của đơn vị, tài khoản mới hoặc tài khoản chưa kích hoạt cần được Quản trị viên (Chỉ huy Đồn) kích hoạt và phân quyền trước khi truy cập cơ sở dữ liệu.
              </p>
            </div>

            <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
              <button
                onClick={async () => {
                  if (currentUser) {
                    try {
                      const prof = await syncUserProfile(currentUser);
                      setCurrentUserProfile(prof);
                      if (prof.active) {
                        showToast('Tài khoản đã được kích hoạt thành công!');
                        await checkAndMigrateData();
                        const r = await fetchAllFromFirestore();
                        if (r) setDb(r);
                      } else {
                        showToast('Tài khoản vẫn đang trong trạng thái chờ duyệt hoặc bị khóa.');
                      }
                    } catch (err: any) {
                      showToast('Lỗi kiểm tra quyền: ' + (err?.message || 'Không thể kết nối'));
                    }
                  }
                }}
                className="w-full sm:w-auto inline-flex items-center justify-center space-x-2 px-5 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-600 active:scale-95 text-white font-bold text-xs shadow transition-all cursor-pointer"
              >
                <span>Kiểm tra lại quyền truy cập</span>
              </button>
              <button
                onClick={handleLogout}
                className="w-full sm:w-auto inline-flex items-center justify-center space-x-2 px-5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs border border-slate-200 transition-colors cursor-pointer"
              >
                <span>Đăng xuất tài khoản</span>
              </button>
            </div>

            <div className="text-xs text-slate-500 border-t border-slate-100 pt-4 flex items-center justify-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-700" />
              <span>Vui lòng liên hệ Quản trị viên hệ thống để được kích hoạt</span>
            </div>
          </div>
        </div>

        <Toast message={toastMessage} onClose={() => setToastMessage(null)} />
      </div>
    );
  }

  // 4. Main Application Viewport: Rendered ONLY when currentUser != null && currentUserProfile != null && currentUserProfile.active === true
  return (
    <div className="min-h-screen flex flex-col bg-slate-100 text-slate-900">
      {/* Top Application Header */}
      <Header
        selectedMonth={selectedMonth}
        selectedYear={selectedYear}
        onMonthChange={setSelectedMonth}
        onYearChange={setSelectedYear}
        onOpenAddCommendation={() => handleOpenAddCommendation()}
        onOpenAddReprimand={() => handleOpenAddReprimand()}
        onOpenAddReward={() => handleOpenAddReward()}
        onToggleMobileMenu={() => setMobileMenuOpen(!mobileMenuOpen)}
        user={currentUser}
        userProfile={currentUserProfile}
        syncStatus={syncStatus}
        onLogin={handleLogin}
        onLogout={handleLogout}
      />

      <div className="flex-1 flex w-full">
        {/* Left Sidebar */}
        <Sidebar
          currentTab={currentTab}
          onSelectTab={setCurrentTab}
          counts={{
            soldiers: db.soldiers.length,
            activeLeaves: activeLeavesCount,
            monthComms: monthCommsCount,
            monthReps: monthRepsCount,
            rewards: db.rewards.length,
          }}
          mobileOpen={mobileMenuOpen}
          onCloseMobile={() => setMobileMenuOpen(false)}
        />

        {/* Main Content Viewport */}
        <main className="flex-1 p-3.5 sm:p-6 lg:p-7 min-w-0 overflow-x-hidden">
          {currentTab === 'dashboard' && (
            <Dashboard
              month={selectedMonth}
              year={selectedYear}
              soldiers={db.soldiers}
              commendations={db.commendations}
              reprimands={db.reprimands}
              rewards={db.rewards}
              onOpenAddCommendation={() => handleOpenAddCommendation()}
              onOpenAddReprimand={() => handleOpenAddReprimand()}
              onNavigateTab={setCurrentTab}
              onSelectSoldier={setViewingSoldierProfile}
            />
          )}

          {currentTab === 'weekly' && (
            <WeeklyTracker
              month={selectedMonth}
              year={selectedYear}
              soldiers={db.soldiers}
              commendations={db.commendations}
              reprimands={db.reprimands}
              onSelectSoldier={setViewingSoldierProfile}
              onAddCommendationForSoldier={(s, w) => handleOpenAddCommendation(s, w)}
              onAddReprimandForSoldier={(s, w) => handleOpenAddReprimand(s, w)}
              onExportExcel={handleExportExcelGeneral}
              onOpenReport={() => setCurrentTab('reports')}
            />
          )}

          {currentTab === 'soldiers' && (
            <SoldiersList
              soldiers={db.soldiers}
              onAddSoldier={handleOpenAddSoldier}
              onEditSoldier={handleOpenEditSoldier}
              onDeleteSoldier={handleDeleteSoldier}
              onDeleteAllSoldiers={handleDeleteAllSoldiers}
              isAdmin={currentUserProfile?.role === 'admin'}
              onSelectSoldier={setViewingSoldierProfile}
              onExportExcel={handleExportExcelGeneral}
              onOpenImportModal={() => setImportModalOpen(true)}
            />
          )}

          {currentTab === 'leave' && (
            <LeaveTracker
              leaves={db.leaves || []}
              soldiers={db.soldiers}
              selectedMonth={selectedMonth}
              selectedYear={selectedYear}
              onOpenAddLeave={handleOpenAddLeave}
              onOpenEditLeave={handleOpenEditLeave}
              onDeleteLeave={handleDeleteLeave}
              onMarkReturned={handleMarkLeaveReturned}
              onExportExcel={handleExportLeavesExcel}
              onSelectSoldier={setViewingSoldierProfile}
            />
          )}

          {currentTab === 'commendations' && (
            <CommendationsList
              commendations={db.commendations}
              selectedMonth={selectedMonth}
              selectedYear={selectedYear}
              onOpenAddModal={() => handleOpenAddCommendation()}
              onEditCommendation={handleOpenEditCommendation}
              onDeleteCommendation={handleDeleteCommendation}
              onSelectSoldierById={handleSelectSoldierById}
              onExportExcel={handleExportExcelGeneral}
            />
          )}

          {currentTab === 'reprimands' && (
            <ReprimandsList
              reprimands={db.reprimands}
              selectedMonth={selectedMonth}
              selectedYear={selectedYear}
              onOpenAddModal={() => handleOpenAddReprimand()}
              onEditReprimand={handleOpenEditReprimand}
              onDeleteReprimand={handleDeleteReprimand}
              onSelectSoldierById={handleSelectSoldierById}
              onExportExcel={handleExportExcelGeneral}
            />
          )}

          {currentTab === 'rewards' && (
            <RewardsList
              rewards={db.rewards}
              selectedYear={selectedYear}
              onOpenAddModal={handleOpenAddReward}
              onEditReward={handleOpenEditReward}
              onDeleteReward={handleDeleteReward}
              onSelectSoldierById={handleSelectSoldierById}
              onExportExcel={handleExportExcelGeneral}
            />
          )}

          {currentTab === 'statistics' && (
            <StatisticsView
              year={selectedYear}
              soldiers={db.soldiers}
              commendations={db.commendations}
              reprimands={db.reprimands}
              rewards={db.rewards}
              onSelectSoldier={setViewingSoldierProfile}
            />
          )}

          {currentTab === 'reports' && (
            <MonthlyReportView
              month={selectedMonth}
              year={selectedYear}
              soldiers={db.soldiers}
              commendations={db.commendations}
              reprimands={db.reprimands}
              rewards={db.rewards}
              leaves={db.leaves}
              unitInfo={db.unitInfo}
              onExportExcel={handleExportExcelGeneral}
              onToast={showToast}
            />
          )}

          {currentTab === 'audit' && <AuditLogView logs={db.auditLogs} />}

          {currentTab === 'backup' && (
            <BackupSettingsView
              unitInfo={db.unitInfo}
              currentUserProfile={currentUserProfile}
              onToast={showToast}
              onRefreshData={() => setDb(loadDatabase())}
            />
          )}
        </main>
      </div>

      {/* Global Modals */}
      {soldierModalOpen && (
        <SoldierModal
          isOpen={soldierModalOpen}
          soldierToEdit={editingSoldier}
          onClose={() => setSoldierModalOpen(false)}
          onSave={handleSaveSoldier}
        />
      )}

      {importModalOpen && (
        <ImportSoldiersModal
          isOpen={importModalOpen}
          onClose={() => setImportModalOpen(false)}
          onImport={handleImportSoldiers}
          currentCount={db.soldiers.length}
        />
      )}

      {commendationModalOpen && (
        <CommendationModal
          isOpen={commendationModalOpen}
          soldiers={db.soldiers}
          itemToEdit={editingCommendation}
          defaultSoldierId={defaultCommendationSoldierId}
          defaultWeek={defaultCommendationWeek}
          selectedMonth={selectedMonth}
          selectedYear={selectedYear}
          onClose={() => setCommendationModalOpen(false)}
          onSave={handleSaveCommendation}
        />
      )}

      {reprimandModalOpen && (
        <ReprimandModal
          isOpen={reprimandModalOpen}
          soldiers={db.soldiers}
          itemToEdit={editingReprimand}
          defaultSoldierId={defaultReprimandSoldierId}
          defaultWeek={defaultReprimandWeek}
          selectedMonth={selectedMonth}
          selectedYear={selectedYear}
          onClose={() => setReprimandModalOpen(false)}
          onSave={handleSaveReprimand}
        />
      )}

      {rewardModalOpen && (
        <RewardModal
          isOpen={rewardModalOpen}
          soldiers={db.soldiers}
          itemToEdit={editingReward}
          selectedYear={selectedYear}
          onClose={() => setRewardModalOpen(false)}
          onSave={handleSaveReward}
        />
      )}

      {leaveModalOpen && (
        <LeaveModal
          isOpen={leaveModalOpen}
          soldiers={db.soldiers}
          itemToEdit={editingLeave}
          onClose={() => setLeaveModalOpen(false)}
          onSave={handleSaveLeave}
        />
      )}

      {viewingSoldierProfile && (
        <SoldierProfileModal
          soldier={viewingSoldierProfile}
          commendations={db.commendations}
          reprimands={db.reprimands}
          rewards={db.rewards}
          leaves={db.leaves || []}
          unitInfo={db.unitInfo}
          onClose={() => setViewingSoldierProfile(null)}
        />
      )}

      {deleteModalConfig.isOpen && (
        <ConfirmDeleteModal
          isOpen={deleteModalConfig.isOpen}
          title={deleteModalConfig.title}
          message={deleteModalConfig.message}
          itemName={deleteModalConfig.itemName}
          onClose={() => setDeleteModalConfig((prev) => ({ ...prev, isOpen: false }))}
          onConfirm={deleteModalConfig.onConfirm}
        />
      )}

      {/* Toast Notification */}
      <Toast message={toastMessage} onClose={() => setToastMessage(null)} />
    </div>
  );
}
