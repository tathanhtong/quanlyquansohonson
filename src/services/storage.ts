import * as XLSX from 'xlsx';
import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  setDoc,
  Unsubscribe,
  writeBatch,
} from 'firebase/firestore';
import {
  INITIAL_COMMENDATIONS,
  INITIAL_EVALUATION,
  INITIAL_LEAVES,
  INITIAL_REPRIMANDS,
  INITIAL_REWARDS,
  INITIAL_SOLDIERS,
} from '../constants/ranksAndDepartments';
import {
  AppDatabase,
  AppUser,
  AuditLog,
  Commendation,
  DepartmentName,
  DutyStatus,
  LeaveRecord,
  MilitaryRank,
  MonthlyReportEvaluation,
  Reprimand,
  Reward,
  Soldier,
  UserRole,
} from '../types';
import { auth, firestoreDb, User } from './firebase';

const STORAGE_KEY = 'HON_SON_BORDER_GUARD_APP_DB_V1';

export const DEFAULT_UNIT_INFO = {
  unitName: 'ĐỒN BIÊN PHÒNG HÒN SƠN',
  parentUnit: 'BỘ CHỈ HUY BỘ ĐỘI BIÊN PHÒNG TỈNH KIÊN GIANG',
  superiorUnit: 'BỘ TƯ LỆNH BỘ ĐỘI BIÊN PHÒNG',
  stationLocation: 'Xã Lại Sơn, huyện Kiên Hải, tỉnh Kiên Giang',
};

export type SyncStatus = 'SAVED' | 'SAVING' | 'OFFLINE' | 'ERROR';

let currentSyncStatus: SyncStatus = 'SAVED';
const syncSubscribers: Set<(status: SyncStatus) => void> = new Set();

export function getSyncStatus(): SyncStatus {
  return currentSyncStatus;
}

export function subscribeSyncStatus(cb: (status: SyncStatus) => void): () => void {
  syncSubscribers.add(cb);
  cb(currentSyncStatus);
  return () => syncSubscribers.delete(cb);
}

function setSyncStatus(status: SyncStatus) {
  currentSyncStatus = status;
  syncSubscribers.forEach((cb) => cb(status));
}

// -------------------------------------------------------------
// DATABASE INITIALIZATION (CLEAN EMPTY FOR PRODUCTION)
// -------------------------------------------------------------

export function getEmptyDatabase(): AppDatabase {
  return {
    soldiers: [],
    commendations: [],
    reprimands: [],
    rewards: [],
    leaves: [],
    evaluations: [],
    auditLogs: [],
    unitInfo: DEFAULT_UNIT_INFO,
  };
}

export function getSampleDatabase(): AppDatabase {
  const now = new Date().toISOString();
  return {
    soldiers: INITIAL_SOLDIERS,
    commendations: INITIAL_COMMENDATIONS,
    reprimands: INITIAL_REPRIMANDS,
    rewards: INITIAL_REWARDS,
    leaves: INITIAL_LEAVES,
    evaluations: [INITIAL_EVALUATION],
    auditLogs: [
      {
        id: 'log-sample-' + Date.now(),
        timestamp: now,
        user: 'Hệ thống',
        action: 'HỆ THỐNG',
        targetType: 'Cài đặt',
        details: 'Khởi tạo bộ dữ liệu mẫu chuẩn Đồn Biên phòng Hòn Sơn',
      },
    ],
    unitInfo: DEFAULT_UNIT_INFO,
  };
}

// In production, default empty database
export function getInitialDatabase(): AppDatabase {
  return getEmptyDatabase();
}

let memoryDb: AppDatabase = getEmptyDatabase();

export function loadDatabase(): AppDatabase {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      const initial = getEmptyDatabase();
      saveToLocalCache(initial);
      memoryDb = initial;
      return initial;
    }
    const parsed = JSON.parse(raw) as AppDatabase;
    if (!parsed.soldiers || !Array.isArray(parsed.soldiers)) {
      const initial = getEmptyDatabase();
      saveToLocalCache(initial);
      memoryDb = initial;
      return initial;
    }
    if (!parsed.leaves || !Array.isArray(parsed.leaves)) {
      parsed.leaves = [];
      saveToLocalCache(parsed);
    }
    memoryDb = parsed;
    return parsed;
  } catch (err) {
    console.error('Error loading database, resetting to clean:', err);
    const initial = getEmptyDatabase();
    saveToLocalCache(initial);
    memoryDb = initial;
    return initial;
  }
}

function saveToLocalCache(db: AppDatabase): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(db));
    memoryDb = db;
    notifySubscribers();
  } catch (err) {
    console.error('Failed to save to localStorage:', err);
  }
}

export function saveDatabase(db: AppDatabase): void {
  saveToLocalCache(db);
}

export function resetMemoryDatabase(): void {
  memoryDb = getEmptyDatabase();
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (err) {
    console.error('Failed to clear storage:', err);
  }
  notifySubscribers();
}

// Subscription mechanism for reactivity across views
type Subscriber = (db: AppDatabase) => void;
const subscribers: Set<Subscriber> = new Set();

export function subscribeDatabase(cb: Subscriber): () => void {
  subscribers.add(cb);
  cb(memoryDb);
  return () => subscribers.delete(cb);
}

function notifySubscribers() {
  subscribers.forEach((cb) => cb(memoryDb));
}

// -------------------------------------------------------------
// USER ROLES & RBAC MANAGEMENT
// -------------------------------------------------------------

export const INITIAL_ADMIN_EMAILS = [
  'tathanhtong@gmail.com',
];

let currentUserProfile: AppUser | null = null;

export function getCurrentUserProfile(): AppUser | null {
  return currentUserProfile;
}

export function setCurrentUserProfileState(profile: AppUser | null): void {
  currentUserProfile = profile;
}

export function listenToCurrentUserProfile(
  uid: string,
  onProfileChange: (profile: AppUser) => void,
  onError?: (err: any) => void
): () => void {
  const userRef = doc(firestoreDb, 'users', uid);
  return onSnapshot(
    userRef,
    (snap) => {
      if (snap.exists()) {
        const data = snap.data() as AppUser;
        currentUserProfile = data;
        onProfileChange(data);
      }
    },
    (err) => {
      console.warn('Realtime user profile listener error:', err);
      if (onError) onError(err);
    }
  );
}

export function checkUserPermission(requiredRole: 'viewer' | 'editor' | 'admin' = 'editor') {
  if (!auth.currentUser) {
    throw new Error('Vui lòng đăng nhập bằng tài khoản Google để thực hiện.');
  }
  if (!currentUserProfile || !currentUserProfile.active) {
    throw new Error('Tài khoản chưa được kích hoạt hoặc chưa được cấp quyền thao tác dữ liệu.');
  }
  if (requiredRole === 'admin' && currentUserProfile.role !== 'admin') {
    throw new Error('Chỉ Quản trị viên mới có quyền thực hiện thao tác này.');
  }
  if (requiredRole === 'editor' && currentUserProfile.role === 'viewer') {
    throw new Error('Tài khoản ở chế độ chỉ xem, không có quyền thay đổi dữ liệu.');
  }
}

export async function syncUserProfile(user: User): Promise<AppUser> {
  const emailLower = (user.email || '').toLowerCase();
  const isInitialAdmin = INITIAL_ADMIN_EMAILS.includes(emailLower);
  const userRef = doc(firestoreDb, 'users', user.uid);

  try {
    const snap = await getDoc(userRef);
    let appUser: AppUser;

    if (!snap.exists()) {
      appUser = {
        uid: user.uid,
        email: user.email || '',
        displayName: user.displayName || user.email?.split('@')[0] || 'Cán bộ',
        photoURL: user.photoURL || undefined,
        role: isInitialAdmin ? 'admin' : 'viewer',
        active: isInitialAdmin ? true : false, // non-admin users must be approved by admin
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      await setDoc(userRef, appUser);
    } else {
      const existing = snap.data() as AppUser;
      if (isInitialAdmin && (!existing.active || existing.role !== 'admin')) {
        existing.active = true;
        existing.role = 'admin';
        await setDoc(userRef, existing);
      }
      appUser = existing;
    }

    currentUserProfile = appUser;
    return appUser;
  } catch (err) {
    console.error('syncUserProfile error:', err);
    // Fallback for offline or permission check
    const fallback: AppUser = {
      uid: user.uid,
      email: user.email || '',
      displayName: user.displayName || 'Cán bộ',
      role: isInitialAdmin ? 'admin' : 'viewer',
      active: isInitialAdmin ? true : false,
    };
    currentUserProfile = fallback;
    return fallback;
  }
}

export async function getAppUsers(): Promise<AppUser[]> {
  checkUserPermission('admin');
  try {
    const snap = await getDocs(collection(firestoreDb, 'users'));
    const list: AppUser[] = [];
    snap.forEach((d) => list.push(d.data() as AppUser));
    return list;
  } catch (err) {
    console.error('getAppUsers error:', err);
    return [];
  }
}

export async function updateAppUserRole(
  uid: string,
  role: UserRole,
  active: boolean
): Promise<void> {
  checkUserPermission('admin');
  setSyncStatus('SAVING');
  try {
    const userRef = doc(firestoreDb, 'users', uid);
    await setDoc(
      userRef,
      {
        role,
        active,
        updatedAt: new Date().toISOString(),
      },
      { merge: true }
    );
    await addAuditLog(
      'SỬA',
      'Người dùng',
      `Phân quyền tài khoản (${uid}) -> Vai trò: ${role}, Trạng thái: ${active ? 'Kích hoạt' : 'Khóa'}`
    );
    setSyncStatus('SAVED');
  } catch (err) {
    console.error('updateAppUserRole error:', err);
    setSyncStatus('ERROR');
    throw err;
  }
}

export async function deleteAppUser(uid: string): Promise<void> {
  checkUserPermission('admin');
  if (auth.currentUser?.uid === uid) {
    throw new Error('Không thể tự xóa tài khoản Quản trị viên đang đăng nhập.');
  }
  setSyncStatus('SAVING');
  try {
    const userRef = doc(firestoreDb, 'users', uid);
    await deleteDoc(userRef);
    await addAuditLog('XÓA', 'Người dùng', `Xóa tài khoản người dùng (${uid}) khỏi hệ thống`);
    setSyncStatus('SAVED');
  } catch (err) {
    console.error('deleteAppUser error:', err);
    setSyncStatus('ERROR');
    throw err;
  }
}

function getActorMetadata() {
  const user = auth.currentUser;
  return {
    uid: user?.uid,
    name: user?.displayName || user?.email?.split('@')[0] || 'Cán bộ',
    email: user?.email || '',
  };
}

/**
 * Recursively removes undefined fields from an object so Firestore setDoc / updateDoc does not throw:
 * "FirebaseError: Function setDoc() called with invalid data. Unsupported field value: undefined"
 */
export function cleanFirestoreData<T extends Record<string, any>>(obj: T): Record<string, any> {
  if (obj === null || typeof obj !== 'object') return obj;
  if (Array.isArray(obj)) {
    return obj.map((item) => (typeof item === 'object' && item !== null ? cleanFirestoreData(item) : item));
  }
  const result: Record<string, any> = {};
  for (const key of Object.keys(obj)) {
    const val = obj[key];
    if (val !== undefined) {
      if (val !== null && typeof val === 'object' && !Array.isArray(val) && !(val instanceof Date)) {
        result[key] = cleanFirestoreData(val);
      } else if (Array.isArray(val)) {
        result[key] = val.map((item) => (typeof item === 'object' && item !== null ? cleanFirestoreData(item) : item));
      } else {
        result[key] = val;
      }
    }
  }
  return result;
}

export async function safeSetDoc(docRef: any, data: Record<string, any>, options?: any): Promise<void> {
  const cleaned = cleanFirestoreData(data);
  return options ? setDoc(docRef, cleaned, options) : setDoc(docRef, cleaned);
}

// -------------------------------------------------------------
// FIRESTORE CLEAN DELETION & RESTORE ENGINE
// -------------------------------------------------------------

export async function clearFirestoreCollections(
  collectionsToClear: string[] = [
    'soldiers',
    'commendations',
    'reprimands',
    'rewards',
    'leaves',
    'evaluations',
  ]
): Promise<number> {
  let deletedCount = 0;
  for (const colName of collectionsToClear) {
    const snap = await getDocs(collection(firestoreDb, colName));
    if (snap.empty) continue;

    const docs = snap.docs;
    for (let i = 0; i < docs.length; i += 400) {
      const chunk = docs.slice(i, i + 400);
      const batch = writeBatch(firestoreDb);
      chunk.forEach((d) => batch.delete(d.ref));
      await batch.commit();
      deletedCount += chunk.length;
    }
  }
  return deletedCount;
}

async function batchWriteCollection(
  colName: string,
  items: Array<{ id: string; [key: string]: any }>
): Promise<void> {
  if (!items || items.length === 0) return;
  for (let i = 0; i < items.length; i += 400) {
    const chunk = items.slice(i, i + 400);
    const batch = writeBatch(firestoreDb);
    chunk.forEach((item) => {
      const ref = doc(firestoreDb, colName, item.id);
      batch.set(ref, cleanFirestoreData(item));
    });
    await batch.commit();
  }
}

// -------------------------------------------------------------
// FIRESTORE SYNC & MIGRATION ENGINE
// -------------------------------------------------------------

export async function fetchAllFromFirestore(): Promise<AppDatabase | null> {
  if (!auth.currentUser) {
    return null;
  }

  setSyncStatus('SAVING');
  try {
    const [
      soldiersSnap,
      commsSnap,
      repsSnap,
      rewardsSnap,
      leavesSnap,
      evalsSnap,
      logsSnap,
      unitInfoSnap,
    ] = await Promise.all([
      getDocs(collection(firestoreDb, 'soldiers')),
      getDocs(collection(firestoreDb, 'commendations')),
      getDocs(collection(firestoreDb, 'reprimands')),
      getDocs(collection(firestoreDb, 'rewards')),
      getDocs(collection(firestoreDb, 'leaves')),
      getDocs(collection(firestoreDb, 'evaluations')),
      getDocs(collection(firestoreDb, 'auditLogs')),
      getDoc(doc(firestoreDb, 'settings', 'unitInfo')),
    ]);

    const soldiers: Soldier[] = [];
    soldiersSnap.forEach((d) => soldiers.push(d.data() as Soldier));
    soldiers.sort((a, b) => (a.stt || 0) - (b.stt || 0));

    const commendations: Commendation[] = [];
    commsSnap.forEach((d) => commendations.push(d.data() as Commendation));

    const reprimands: Reprimand[] = [];
    repsSnap.forEach((d) => reprimands.push(d.data() as Reprimand));

    const rewards: Reward[] = [];
    rewardsSnap.forEach((d) => rewards.push(d.data() as Reward));

    const leavesMap = new Map<string, LeaveRecord>();
    leavesSnap.forEach((d) => {
      const item = d.data() as LeaveRecord;
      if (item && item.id) leavesMap.set(item.id, item);
    });
    const leaves = Array.from(leavesMap.values());

    const evaluations: MonthlyReportEvaluation[] = [];
    evalsSnap.forEach((d) => evaluations.push(d.data() as MonthlyReportEvaluation));

    const auditLogs: AuditLog[] = [];
    logsSnap.forEach((d) => auditLogs.push(d.data() as AuditLog));
    auditLogs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    const unitInfo = unitInfoSnap.exists()
      ? (unitInfoSnap.data() as typeof DEFAULT_UNIT_INFO)
      : memoryDb.unitInfo || DEFAULT_UNIT_INFO;

    const firestoreDbData: AppDatabase = {
      soldiers,
      commendations,
      reprimands,
      rewards,
      leaves,
      evaluations,
      auditLogs,
      unitInfo,
    };

    saveToLocalCache(firestoreDbData);
    setSyncStatus('SAVED');
    return firestoreDbData;
  } catch (error) {
    console.error('Error fetching data from Firestore:', error);
    if (!navigator.onLine) {
      setSyncStatus('OFFLINE');
    } else {
      setSyncStatus('ERROR');
    }
    return null;
  }
}

// Realtime listeners for multi-device sync
let activeRealtimeUnsubscribes: Unsubscribe[] = [];

export function setupRealtimeListeners(onUpdate?: (db: AppDatabase) => void): () => void {
  activeRealtimeUnsubscribes.forEach((unsub) => unsub());
  activeRealtimeUnsubscribes = [];

  if (!auth.currentUser) {
    return () => {};
  }

  const unsubSoldiers = onSnapshot(
    collection(firestoreDb, 'soldiers'),
    (snapshot) => {
      const soldiers: Soldier[] = [];
      snapshot.forEach((d) => soldiers.push(d.data() as Soldier));
      soldiers.sort((a, b) => (a.stt || 0) - (b.stt || 0));
      memoryDb.soldiers = soldiers;
      saveToLocalCache(memoryDb);
      if (onUpdate) onUpdate(memoryDb);
    },
    (err) => console.warn('Realtime soldiers err:', err)
  );

  const unsubComms = onSnapshot(
    collection(firestoreDb, 'commendations'),
    (snapshot) => {
      const comms: Commendation[] = [];
      snapshot.forEach((d) => comms.push(d.data() as Commendation));
      memoryDb.commendations = comms;
      saveToLocalCache(memoryDb);
      if (onUpdate) onUpdate(memoryDb);
    },
    (err) => console.warn('Realtime comms err:', err)
  );

  const unsubReps = onSnapshot(
    collection(firestoreDb, 'reprimands'),
    (snapshot) => {
      const reps: Reprimand[] = [];
      snapshot.forEach((d) => reps.push(d.data() as Reprimand));
      memoryDb.reprimands = reps;
      saveToLocalCache(memoryDb);
      if (onUpdate) onUpdate(memoryDb);
    },
    (err) => console.warn('Realtime reps err:', err)
  );

  const unsubRewards = onSnapshot(
    collection(firestoreDb, 'rewards'),
    (snapshot) => {
      const rewards: Reward[] = [];
      snapshot.forEach((d) => rewards.push(d.data() as Reward));
      memoryDb.rewards = rewards;
      saveToLocalCache(memoryDb);
      if (onUpdate) onUpdate(memoryDb);
    },
    (err) => console.warn('Realtime rewards err:', err)
  );

  const unsubLeaves = onSnapshot(
    collection(firestoreDb, 'leaves'),
    (snapshot) => {
      const leavesMap = new Map<string, LeaveRecord>();
      snapshot.forEach((d) => {
        const item = d.data() as LeaveRecord;
        if (item && item.id) {
          leavesMap.set(item.id, item);
        }
      });
      memoryDb.leaves = Array.from(leavesMap.values());
      saveToLocalCache(memoryDb);
      if (onUpdate) onUpdate(memoryDb);
    },
    (err) => console.warn('Realtime leaves err:', err)
  );

  const unsubEvals = onSnapshot(
    collection(firestoreDb, 'evaluations'),
    (snapshot) => {
      const evals: MonthlyReportEvaluation[] = [];
      snapshot.forEach((d) => evals.push(d.data() as MonthlyReportEvaluation));
      memoryDb.evaluations = evals;
      saveToLocalCache(memoryDb);
      if (onUpdate) onUpdate(memoryDb);
    },
    (err) => console.warn('Realtime evals err:', err)
  );

  const unsubUnit = onSnapshot(
    doc(firestoreDb, 'settings', 'unitInfo'),
    (snapshot) => {
      if (snapshot.exists()) {
        memoryDb.unitInfo = snapshot.data() as typeof DEFAULT_UNIT_INFO;
        saveToLocalCache(memoryDb);
        if (onUpdate) onUpdate(memoryDb);
      }
    },
    (err) => console.warn('Realtime unitInfo err:', err)
  );

  activeRealtimeUnsubscribes = [
    unsubSoldiers,
    unsubComms,
    unsubReps,
    unsubRewards,
    unsubLeaves,
    unsubEvals,
    unsubUnit,
  ];

  return () => {
    activeRealtimeUnsubscribes.forEach((unsub) => unsub());
    activeRealtimeUnsubscribes = [];
  };
}

export function stopRealtimeListeners(): void {
  activeRealtimeUnsubscribes.forEach((unsub) => unsub());
  activeRealtimeUnsubscribes = [];
}

// Migration check: only migrate if user actually has real local data and not previously cleared
export async function checkAndMigrateData(): Promise<{ migrated: boolean; count: number }> {
  if (!auth.currentUser) {
    return { migrated: false, count: 0 };
  }

  try {
    setSyncStatus('SAVING');
    const systemStatusRef = doc(firestoreDb, 'settings', 'systemStatus');
    const systemStatusSnap = await getDoc(systemStatusRef);

    // 1. If Firestore already has soldiers, fetch directly
    const soldiersSnap = await getDocs(collection(firestoreDb, 'soldiers'));
    if (!soldiersSnap.empty) {
      await fetchAllFromFirestore();
      setSyncStatus('SAVED');
      return { migrated: false, count: soldiersSnap.size };
    }

    // 2. If Firestore was already explicitly initialized or cleared, respect empty state
    if (systemStatusSnap.exists() && systemStatusSnap.data()?.isInitialized) {
      await fetchAllFromFirestore();
      setSyncStatus('SAVED');
      return { migrated: false, count: 0 };
    }

    // 3. If local data was marked as cleared by the user, don't migrate
    const wasCleared = localStorage.getItem('HON_SON_DATA_CLEARED') === 'true';
    if (wasCleared) {
      await setDoc(systemStatusRef, {
        isInitialized: true,
        lastClearedAt: new Date().toISOString(),
      });
      await fetchAllFromFirestore();
      setSyncStatus('SAVED');
      return { migrated: false, count: 0 };
    }

    // 4. Check localStorage for real existing data
    const localDb = loadDatabase();
    if (!localDb || !localDb.soldiers || localDb.soldiers.length === 0) {
      // In production, brand new database starts completely empty!
      // Do NOT push sample data! Only initialize unitInfo and system status
      await setDoc(doc(firestoreDb, 'settings', 'unitInfo'), DEFAULT_UNIT_INFO);
      await setDoc(systemStatusRef, {
        isInitialized: true,
        createdAt: new Date().toISOString(),
      });
      setSyncStatus('SAVED');
      return { migrated: false, count: 0 };
    }

    // 5. Migrate real local records to Firestore
    const backupKey = `HON_SON_BORDER_GUARD_APP_DB_V1_BACKUP_${Date.now()}`;
    localStorage.setItem(backupKey, JSON.stringify(localDb));

    await clearFirestoreCollections();
    await batchWriteCollection('soldiers', localDb.soldiers);
    await batchWriteCollection('commendations', localDb.commendations);
    await batchWriteCollection('reprimands', localDb.reprimands);
    await batchWriteCollection('rewards', localDb.rewards);
    await batchWriteCollection('leaves', localDb.leaves || []);
    await batchWriteCollection('evaluations', (localDb.evaluations || []).map((e) => ({
      ...e,
      id: e.id || `eval_${e.year}_${e.month}`,
    })));

    await setDoc(doc(firestoreDb, 'settings', 'unitInfo'), localDb.unitInfo || DEFAULT_UNIT_INFO);
    await setDoc(systemStatusRef, {
      isInitialized: true,
      migratedAt: new Date().toISOString(),
      migratedBy: auth.currentUser?.email || 'admin',
      soldiersCount: localDb.soldiers.length,
      status: 'COMPLETED',
    });

    await addAuditLog(
      'HỆ THỐNG',
      'Cài đặt',
      `Di chuyển an toàn ${localDb.soldiers.length} quân nhân từ lưu trữ cũ lên Firestore`
    );

    await fetchAllFromFirestore();
    setSyncStatus('SAVED');
    return { migrated: true, count: localDb.soldiers.length };
  } catch (err) {
    console.error('Migration failed:', err);
    setSyncStatus('ERROR');
    return { migrated: false, count: 0 };
  }
}

// -------------------------------------------------------------
// AUDIT LOGGING (ATOMIC FIRESTORE WRITES)
// -------------------------------------------------------------

export async function addAuditLog(
  action: AuditLog['action'],
  targetType: AuditLog['targetType'],
  details: string,
  user?: string
): Promise<void> {
  const actor = getActorMetadata();
  const currentUser = user || actor.name;

  const log: AuditLog = {
    id: 'log-' + Date.now() + '-' + Math.random().toString(36).substring(2, 7),
    timestamp: new Date().toISOString(),
    user: currentUser,
    uid: actor.uid,
    email: actor.email,
    action,
    targetType,
    details,
  };

  memoryDb.auditLogs.unshift(log);
  if (memoryDb.auditLogs.length > 500) {
    memoryDb.auditLogs = memoryDb.auditLogs.slice(0, 500);
  }
  saveToLocalCache(memoryDb);

  if (auth.currentUser) {
    try {
      await safeSetDoc(doc(firestoreDb, 'auditLogs', log.id), log);
    } catch (err) {
      console.warn('Failed to write audit log to Firestore:', err);
    }
  }
}

// -------------------------------------------------------------
// ASYNCHRONOUS CRUD SOLDIERS
// -------------------------------------------------------------

export async function addSoldier(
  data: Omit<Soldier, 'id' | 'createdAt' | 'updatedAt' | 'stt'>
): Promise<Soldier> {
  checkUserPermission('editor');
  setSyncStatus('SAVING');
  try {
    const nextStt =
      memoryDb.soldiers.length > 0
        ? Math.max(...memoryDb.soldiers.map((s) => s.stt || 0)) + 1
        : 1;
    const now = new Date().toISOString();
    const actor = getActorMetadata();

    const newSoldier: Soldier = {
      ...data,
      id: 's-' + Date.now(),
      stt: nextStt,
      createdAt: now,
      updatedAt: now,
      createdByUid: actor.uid,
      createdByName: actor.name,
      createdByEmail: actor.email,
      updatedByUid: actor.uid,
      updatedByName: actor.name,
      updatedByEmail: actor.email,
    };

    if (auth.currentUser) {
      await safeSetDoc(doc(firestoreDb, 'soldiers', newSoldier.id), newSoldier);
    }

    memoryDb.soldiers.push(newSoldier);
    saveToLocalCache(memoryDb);
    await addAuditLog(
      'THÊM',
      'Quân số',
      `Thêm quân nhân: ${newSoldier.rank} ${newSoldier.fullName} (${newSoldier.position})`
    );
    setSyncStatus('SAVED');
    return newSoldier;
  } catch (err) {
    console.error('addSoldier failed:', err);
    setSyncStatus('ERROR');
    throw err;
  }
}

export async function updateSoldier(id: string, data: Partial<Soldier>): Promise<void> {
  checkUserPermission('editor');
  setSyncStatus('SAVING');
  try {
    const index = memoryDb.soldiers.findIndex((s) => s.id === id);
    if (index === -1) throw new Error('Không tìm thấy bản ghi quân nhân');

    const old = memoryDb.soldiers[index];
    const actor = getActorMetadata();
    const updated: Soldier = {
      ...old,
      ...data,
      updatedAt: new Date().toISOString(),
      updatedByUid: actor.uid,
      updatedByName: actor.name,
      updatedByEmail: actor.email,
    };

    if (auth.currentUser) {
      await safeSetDoc(doc(firestoreDb, 'soldiers', id), updated);
    }

    memoryDb.soldiers[index] = updated;

    // Sync denormalized name/rank across collections
    if (data.fullName || data.rank || data.position || data.department) {
      memoryDb.commendations.forEach((c) => {
        if (c.soldierId === id) {
          c.fullName = updated.fullName;
          c.rank = updated.rank;
          c.position = updated.position;
          c.department = updated.department;
          if (auth.currentUser) safeSetDoc(doc(firestoreDb, 'commendations', c.id), c).catch(console.error);
        }
      });
      memoryDb.reprimands.forEach((r) => {
        if (r.soldierId === id) {
          r.fullName = updated.fullName;
          r.rank = updated.rank;
          r.position = updated.position;
          r.department = updated.department;
          if (auth.currentUser) safeSetDoc(doc(firestoreDb, 'reprimands', r.id), r).catch(console.error);
        }
      });
      memoryDb.rewards.forEach((rw) => {
        if (rw.soldierId === id) {
          rw.fullName = updated.fullName;
          rw.rank = updated.rank;
          rw.position = updated.position;
          rw.department = updated.department;
          if (auth.currentUser) safeSetDoc(doc(firestoreDb, 'rewards', rw.id), rw).catch(console.error);
        }
      });
      (memoryDb.leaves || []).forEach((l) => {
        if (l.soldierId === id) {
          l.fullName = updated.fullName;
          l.rank = updated.rank;
          l.position = updated.position;
          l.department = updated.department;
          if (auth.currentUser) safeSetDoc(doc(firestoreDb, 'leaves', l.id), l).catch(console.error);
        }
      });
    }

    saveToLocalCache(memoryDb);
    await addAuditLog(
      'SỬA',
      'Quân số',
      `Cập nhật thông tin cán bộ/chiến sĩ: ${updated.fullName}`
    );
    setSyncStatus('SAVED');
  } catch (err) {
    console.error('updateSoldier failed:', err);
    setSyncStatus('ERROR');
    throw err;
  }
}

export async function deleteSoldier(id: string): Promise<void> {
  checkUserPermission('admin');
  setSyncStatus('SAVING');
  try {
    const soldier = memoryDb.soldiers.find((s) => s.id === id);
    if (!soldier) return;

    if (auth.currentUser) {
      await deleteDoc(doc(firestoreDb, 'soldiers', id));

      // Cascade delete related records in Firestore
      const commsToDelete = memoryDb.commendations.filter((c) => c.soldierId === id);
      const repsToDelete = memoryDb.reprimands.filter((r) => r.soldierId === id);
      const rewardsToDelete = memoryDb.rewards.filter((rw) => rw.soldierId === id);
      const leavesToDelete = (memoryDb.leaves || []).filter((l) => l.soldierId === id);

      await Promise.all([
        ...commsToDelete.map((c) => deleteDoc(doc(firestoreDb, 'commendations', c.id))),
        ...repsToDelete.map((r) => deleteDoc(doc(firestoreDb, 'reprimands', r.id))),
        ...rewardsToDelete.map((rw) => deleteDoc(doc(firestoreDb, 'rewards', rw.id))),
        ...leavesToDelete.map((l) => deleteDoc(doc(firestoreDb, 'leaves', l.id))),
      ]);
    }

    memoryDb.soldiers = memoryDb.soldiers.filter((s) => s.id !== id);
    memoryDb.soldiers.forEach((s, idx) => {
      s.stt = idx + 1;
    });
    memoryDb.commendations = memoryDb.commendations.filter((c) => c.soldierId !== id);
    memoryDb.reprimands = memoryDb.reprimands.filter((r) => r.soldierId !== id);
    memoryDb.rewards = memoryDb.rewards.filter((rw) => rw.soldierId !== id);
    memoryDb.leaves = (memoryDb.leaves || []).filter((l) => l.soldierId !== id);

    saveToLocalCache(memoryDb);
    await addAuditLog(
      'XÓA',
      'Quân số',
      `Xóa quân nhân ${soldier.rank} ${soldier.fullName} và toàn bộ bản ghi liên quan`
    );
    setSyncStatus('SAVED');
  } catch (err) {
    console.error('deleteSoldier failed:', err);
    setSyncStatus('ERROR');
    throw err;
  }
}

export async function deleteAllSoldiers(): Promise<void> {
  checkUserPermission('admin');
  setSyncStatus('SAVING');
  try {
    const soldierCount = memoryDb.soldiers ? memoryDb.soldiers.length : 0;
    if (soldierCount === 0 && (!memoryDb.commendations || memoryDb.commendations.length === 0)) {
      setSyncStatus('SAVED');
      return;
    }

    if (auth.currentUser) {
      await clearFirestoreCollections([
        'soldiers',
        'commendations',
        'reprimands',
        'rewards',
        'leaves',
      ]);
    }

    memoryDb.soldiers = [];
    memoryDb.commendations = [];
    memoryDb.reprimands = [];
    memoryDb.rewards = [];
    memoryDb.leaves = [];

    saveToLocalCache(memoryDb);

    await addAuditLog(
      'XÓA',
      'Quân số',
      'Xóa toàn bộ danh sách quân số và dữ liệu nghiệp vụ liên quan'
    );
    setSyncStatus('SAVED');
  } catch (err) {
    console.error('deleteAllSoldiers failed:', err);
    setSyncStatus('ERROR');
    throw err;
  }
}

export async function importSoldiersBatch(
  newSoldiers: Array<{
    stt?: number;
    fullName: string;
    rank: MilitaryRank;
    position: string;
    department: DepartmentName;
    birthDate?: string;
    status?: DutyStatus;
    notes?: string;
    phoneNumber?: string;
  }>,
  mode: 'append' | 'replace'
): Promise<void> {
  checkUserPermission(mode === 'replace' ? 'admin' : 'editor');
  setSyncStatus('SAVING');
  try {
    const now = new Date().toISOString();
    const actor = getActorMetadata();

    const formatted: Soldier[] = newSoldiers.map((s, idx) => ({
      id: 's-' + Date.now() + '-' + idx,
      stt: s.stt || idx + 1,
      fullName: s.fullName,
      rank: s.rank,
      position: s.position,
      department: s.department,
      birthDate: s.birthDate || '1995-01-01',
      status: s.status || 'Đang công tác',
      notes: s.notes || undefined,
      phoneNumber: s.phoneNumber || undefined,
      createdAt: now,
      updatedAt: now,
      createdByUid: actor.uid,
      createdByName: actor.name,
      createdByEmail: actor.email,
    }));

    if (mode === 'replace') {
      const hasBusinessData =
        (memoryDb.commendations && memoryDb.commendations.length > 0) ||
        (memoryDb.reprimands && memoryDb.reprimands.length > 0) ||
        (memoryDb.rewards && memoryDb.rewards.length > 0) ||
        (memoryDb.leaves && memoryDb.leaves.length > 0);

      if (hasBusinessData) {
        setSyncStatus('SAVED');
        throw new Error(
          'Không thể thay thế toàn bộ quân số khi hệ thống đã có dữ liệu biểu dương, phê bình, khen thưởng hoặc đi phép. Vui lòng sử dụng chức năng Nhập bổ sung hoặc xử lý dữ liệu liên quan trước.'
        );
      }

      if (auth.currentUser) {
        await clearFirestoreCollections(['soldiers']);
        await batchWriteCollection('soldiers', formatted);
      }
      memoryDb.soldiers = formatted;
      saveToLocalCache(memoryDb);
      await addAuditLog(
        'THÊM',
        'Quân số',
        `Thay thế toàn bộ danh sách quân số bằng ${formatted.length} cán bộ, chiến sĩ từ tệp nhập tự động`
      );
    } else {
      const startStt = memoryDb.soldiers.length;
      formatted.forEach((item, i) => {
        item.stt = startStt + i + 1;
      });
      if (auth.currentUser) {
        await batchWriteCollection('soldiers', formatted);
      }
      memoryDb.soldiers = [...memoryDb.soldiers, ...formatted];
      saveToLocalCache(memoryDb);
      await addAuditLog(
        'THÊM',
        'Quân số',
        `Nhập bổ sung ${formatted.length} cán bộ, chiến sĩ vào danh sách quân số từ tệp tự động`
      );
    }

    setSyncStatus('SAVED');
  } catch (err) {
    console.error('importSoldiersBatch failed:', err);
    setSyncStatus('ERROR');
    throw err;
  }
}

// -------------------------------------------------------------
// ASYNCHRONOUS CRUD COMMENDATIONS
// -------------------------------------------------------------

export async function addCommendation(
  data: Omit<Commendation, 'id' | 'createdAt'>
): Promise<Commendation> {
  checkUserPermission('editor');
  setSyncStatus('SAVING');
  try {
    const actor = getActorMetadata();
    const newCom: Commendation = {
      ...data,
      id: 'com-' + Date.now(),
      createdAt: new Date().toISOString(),
    };

    if (auth.currentUser) {
      await safeSetDoc(doc(firestoreDb, 'commendations', newCom.id), {
        ...newCom,
        createdByUid: actor.uid,
        createdByName: actor.name,
        createdByEmail: actor.email,
      });
    }

    memoryDb.commendations.unshift(newCom);
    saveToLocalCache(memoryDb);
    await addAuditLog(
      'THÊM',
      'Biểu dương',
      `Thêm biểu dương tuần ${newCom.weekNumber}/${newCom.month}/${newCom.year} cho: ${newCom.rank} ${newCom.fullName}`
    );
    setSyncStatus('SAVED');
    return newCom;
  } catch (err) {
    console.error('addCommendation failed:', err);
    setSyncStatus('ERROR');
    throw err;
  }
}

export async function updateCommendation(id: string, data: Partial<Commendation>): Promise<void> {
  checkUserPermission('editor');
  setSyncStatus('SAVING');
  try {
    const idx = memoryDb.commendations.findIndex((c) => c.id === id);
    if (idx === -1) throw new Error('Không tìm thấy bản ghi biểu dương');

    const actor = getActorMetadata();
    const updated = {
      ...memoryDb.commendations[idx],
      ...data,
      updatedByUid: actor.uid,
      updatedByName: actor.name,
      updatedByEmail: actor.email,
    };

    if (auth.currentUser) {
      await safeSetDoc(doc(firestoreDb, 'commendations', id), updated);
    }

    memoryDb.commendations[idx] = updated;
    saveToLocalCache(memoryDb);
    await addAuditLog(
      'SỬA',
      'Biểu dương',
      `Sửa biểu dương của: ${updated.fullName} (Tuần ${updated.weekNumber})`
    );
    setSyncStatus('SAVED');
  } catch (err) {
    console.error('updateCommendation failed:', err);
    setSyncStatus('ERROR');
    throw err;
  }
}

export async function deleteCommendation(id: string): Promise<void> {
  checkUserPermission('admin');
  setSyncStatus('SAVING');
  try {
    const item = memoryDb.commendations.find((c) => c.id === id);
    if (!item) return;

    if (auth.currentUser) {
      await deleteDoc(doc(firestoreDb, 'commendations', id));
    }

    memoryDb.commendations = memoryDb.commendations.filter((c) => c.id !== id);
    saveToLocalCache(memoryDb);
    await addAuditLog('XÓA', 'Biểu dương', `Xóa biểu dương của: ${item.fullName} (Tuần ${item.weekNumber})`);
    setSyncStatus('SAVED');
  } catch (err) {
    console.error('deleteCommendation failed:', err);
    setSyncStatus('ERROR');
    throw err;
  }
}

// -------------------------------------------------------------
// ASYNCHRONOUS CRUD REPRIMANDS
// -------------------------------------------------------------

export async function addReprimand(data: Omit<Reprimand, 'id' | 'createdAt'>): Promise<Reprimand> {
  checkUserPermission('editor');
  setSyncStatus('SAVING');
  try {
    const actor = getActorMetadata();
    const newRep: Reprimand = {
      ...data,
      id: 'rep-' + Date.now(),
      createdAt: new Date().toISOString(),
    };

    if (auth.currentUser) {
      await safeSetDoc(doc(firestoreDb, 'reprimands', newRep.id), {
        ...newRep,
        createdByUid: actor.uid,
        createdByName: actor.name,
        createdByEmail: actor.email,
      });
    }

    memoryDb.reprimands.unshift(newRep);
    saveToLocalCache(memoryDb);
    await addAuditLog(
      'THÊM',
      'Phê bình',
      `Thêm phê bình tuần ${newRep.weekNumber}/${newRep.month}/${newRep.year} cho: ${newRep.rank} ${newRep.fullName}`
    );
    setSyncStatus('SAVED');
    return newRep;
  } catch (err) {
    console.error('addReprimand failed:', err);
    setSyncStatus('ERROR');
    throw err;
  }
}

export async function updateReprimand(id: string, data: Partial<Reprimand>): Promise<void> {
  checkUserPermission('editor');
  setSyncStatus('SAVING');
  try {
    const idx = memoryDb.reprimands.findIndex((r) => r.id === id);
    if (idx === -1) throw new Error('Không tìm thấy bản ghi phê bình');

    const actor = getActorMetadata();
    const updated = {
      ...memoryDb.reprimands[idx],
      ...data,
      updatedByUid: actor.uid,
      updatedByName: actor.name,
      updatedByEmail: actor.email,
    };

    if (auth.currentUser) {
      await safeSetDoc(doc(firestoreDb, 'reprimands', id), updated);
    }

    memoryDb.reprimands[idx] = updated;
    saveToLocalCache(memoryDb);
    await addAuditLog(
      'SỬA',
      'Phê bình',
      `Cập nhật phê bình của: ${updated.fullName} - Trạng thái: ${updated.remediationStatus}`
    );
    setSyncStatus('SAVED');
  } catch (err) {
    console.error('updateReprimand failed:', err);
    setSyncStatus('ERROR');
    throw err;
  }
}

export async function deleteReprimand(id: string): Promise<void> {
  checkUserPermission('admin');
  setSyncStatus('SAVING');
  try {
    const item = memoryDb.reprimands.find((r) => r.id === id);
    if (!item) return;

    if (auth.currentUser) {
      await deleteDoc(doc(firestoreDb, 'reprimands', id));
    }

    memoryDb.reprimands = memoryDb.reprimands.filter((r) => r.id !== id);
    saveToLocalCache(memoryDb);
    await addAuditLog('XÓA', 'Phê bình', `Xóa bản ghi phê bình của: ${item.fullName} (Tuần ${item.weekNumber})`);
    setSyncStatus('SAVED');
  } catch (err) {
    console.error('deleteReprimand failed:', err);
    setSyncStatus('ERROR');
    throw err;
  }
}

// -------------------------------------------------------------
// ASYNCHRONOUS CRUD REWARDS
// -------------------------------------------------------------

export async function addReward(data: Omit<Reward, 'id' | 'createdAt'>): Promise<Reward> {
  checkUserPermission('editor');
  setSyncStatus('SAVING');
  try {
    const actor = getActorMetadata();
    const newReward: Reward = {
      ...data,
      id: 'rew-' + Date.now(),
      createdAt: new Date().toISOString(),
    };

    if (auth.currentUser) {
      await safeSetDoc(doc(firestoreDb, 'rewards', newReward.id), {
        ...newReward,
        createdByUid: actor.uid,
        createdByName: actor.name,
        createdByEmail: actor.email,
      });
    }

    memoryDb.rewards.unshift(newReward);
    saveToLocalCache(memoryDb);
    await addAuditLog(
      'THÊM',
      'Khen thưởng',
      `Thêm khen thưởng cho ${newReward.rank} ${newReward.fullName}: ${newReward.rewardType} (Số: ${newReward.decisionNumber})`
    );
    setSyncStatus('SAVED');
    return newReward;
  } catch (err) {
    console.error('addReward failed:', err);
    setSyncStatus('ERROR');
    throw err;
  }
}

export async function updateReward(id: string, data: Partial<Reward>): Promise<void> {
  checkUserPermission('editor');
  setSyncStatus('SAVING');
  try {
    const idx = memoryDb.rewards.findIndex((r) => r.id === id);
    if (idx === -1) throw new Error('Không tìm thấy bản ghi khen thưởng');

    const actor = getActorMetadata();
    const updated = {
      ...memoryDb.rewards[idx],
      ...data,
      updatedByUid: actor.uid,
      updatedByName: actor.name,
      updatedByEmail: actor.email,
    };

    if (auth.currentUser) {
      await safeSetDoc(doc(firestoreDb, 'rewards', id), updated);
    }

    memoryDb.rewards[idx] = updated;
    saveToLocalCache(memoryDb);
    await addAuditLog('SỬA', 'Khen thưởng', `Sửa thông tin khen thưởng của: ${updated.fullName}`);
    setSyncStatus('SAVED');
  } catch (err) {
    console.error('updateReward failed:', err);
    setSyncStatus('ERROR');
    throw err;
  }
}

export async function deleteReward(id: string): Promise<void> {
  checkUserPermission('admin');
  setSyncStatus('SAVING');
  try {
    const item = memoryDb.rewards.find((r) => r.id === id);
    if (!item) return;

    if (auth.currentUser) {
      await deleteDoc(doc(firestoreDb, 'rewards', id));
    }

    memoryDb.rewards = memoryDb.rewards.filter((r) => r.id !== id);
    saveToLocalCache(memoryDb);
    await addAuditLog('XÓA', 'Khen thưởng', `Xóa khen thưởng: ${item.rewardType} của ${item.fullName}`);
    setSyncStatus('SAVED');
  } catch (err) {
    console.error('deleteReward failed:', err);
    setSyncStatus('ERROR');
    throw err;
  }
}

// -------------------------------------------------------------
// ASYNCHRONOUS CRUD LEAVES (ĐI PHÉP & TRANH THỦ)
// -------------------------------------------------------------

export async function addLeave(data: Omit<LeaveRecord, 'id' | 'createdAt'>): Promise<LeaveRecord> {
  checkUserPermission('editor');
  setSyncStatus('SAVING');
  try {
    const actor = getActorMetadata();
    const newLeave: LeaveRecord = {
      ...data,
      id: 'leave-' + Date.now(),
      createdAt: new Date().toISOString(),
    };

    if (auth.currentUser) {
      await safeSetDoc(doc(firestoreDb, 'leaves', newLeave.id), {
        ...newLeave,
        createdByUid: actor.uid,
        createdByName: actor.name,
        createdByEmail: actor.email,
      });
    }

    if (!memoryDb.leaves) memoryDb.leaves = [];
    memoryDb.leaves = [newLeave, ...memoryDb.leaves.filter((l) => l.id !== newLeave.id)];
    saveToLocalCache(memoryDb);
    await addAuditLog(
      'THÊM',
      'Đi phép - Tranh thủ',
      `Giải quyết ${newLeave.category} (${newLeave.leaveType}) cho ${newLeave.rank} ${newLeave.fullName} (${newLeave.startDate} đến ${newLeave.endDate})`
    );
    setSyncStatus('SAVED');
    return newLeave;
  } catch (err) {
    console.error('addLeave failed:', err);
    setSyncStatus('ERROR');
    throw err;
  }
}

export async function updateLeave(id: string, data: Partial<LeaveRecord>): Promise<void> {
  checkUserPermission('editor');
  setSyncStatus('SAVING');
  try {
    if (!memoryDb.leaves) memoryDb.leaves = [];
    const idx = memoryDb.leaves.findIndex((l) => l.id === id);
    if (idx === -1) throw new Error('Không tìm thấy bản ghi nghỉ phép');

    const actor = getActorMetadata();
    const updated = {
      ...memoryDb.leaves[idx],
      ...data,
      updatedByUid: actor.uid,
      updatedByName: actor.name,
      updatedByEmail: actor.email,
    };

    if (auth.currentUser) {
      await safeSetDoc(doc(firestoreDb, 'leaves', id), updated);
    }

    memoryDb.leaves[idx] = updated;
    saveToLocalCache(memoryDb);
    await addAuditLog(
      'SỬA',
      'Đi phép - Tranh thủ',
      `Cập nhật thông tin ${updated.category} của: ${updated.fullName} - Trạng thái: ${updated.status}`
    );
    setSyncStatus('SAVED');
  } catch (err) {
    console.error('updateLeave failed:', err);
    setSyncStatus('ERROR');
    throw err;
  }
}

export async function deleteLeave(id: string): Promise<void> {
  checkUserPermission('admin');
  setSyncStatus('SAVING');
  try {
    if (!memoryDb.leaves) memoryDb.leaves = [];
    const item = memoryDb.leaves.find((l) => l.id === id);
    if (!item) return;

    if (auth.currentUser) {
      await deleteDoc(doc(firestoreDb, 'leaves', id));
    }

    memoryDb.leaves = memoryDb.leaves.filter((l) => l.id !== id);
    saveToLocalCache(memoryDb);
    await addAuditLog('XÓA', 'Đi phép - Tranh thủ', `Xóa bản ghi ${item.category} của: ${item.fullName}`);
    setSyncStatus('SAVED');
  } catch (err) {
    console.error('deleteLeave failed:', err);
    setSyncStatus('ERROR');
    throw err;
  }
}

export async function markLeaveReturned(id: string, actualReturnDate: string): Promise<void> {
  checkUserPermission('editor');
  setSyncStatus('SAVING');
  try {
    if (!memoryDb.leaves) memoryDb.leaves = [];
    const idx = memoryDb.leaves.findIndex((l) => l.id === id);
    if (idx === -1) throw new Error('Không tìm thấy bản ghi nghỉ phép');

    const actor = getActorMetadata();
    const item = {
      ...memoryDb.leaves[idx],
      status: 'Đã về đơn vị' as const,
      actualReturnDate,
      updatedByUid: actor.uid,
      updatedByName: actor.name,
      updatedByEmail: actor.email,
    };

    if (auth.currentUser) {
      await safeSetDoc(doc(firestoreDb, 'leaves', id), item);
    }

    memoryDb.leaves[idx] = item;
    saveToLocalCache(memoryDb);
    await addAuditLog(
      'SỬA',
      'Đi phép - Tranh thủ',
      `Xác nhận ${item.rank} ${item.fullName} đã về đơn vị vào ngày ${formatDateVN(actualReturnDate)}`
    );
    setSyncStatus('SAVED');
  } catch (err) {
    console.error('markLeaveReturned failed:', err);
    setSyncStatus('ERROR');
    throw err;
  }
}

// -------------------------------------------------------------
// MONTHLY EVALUATION & UNIT INFO
// -------------------------------------------------------------

export async function saveMonthlyEvaluation(evalData: MonthlyReportEvaluation): Promise<void> {
  checkUserPermission('editor');
  setSyncStatus('SAVING');
  try {
    const isAnnual = evalData.id?.startsWith('eval_year_') || evalData.month === 0;
    const docId = isAnnual
      ? (evalData.id || `eval_year_${evalData.year}`)
      : (evalData.id || `eval_${evalData.year}_${evalData.month}`);

    const updatedData: MonthlyReportEvaluation = {
      ...evalData,
      id: docId,
      month: isAnnual ? 0 : evalData.month,
      updatedAt: new Date().toISOString(),
    };

    if (auth.currentUser) {
      await safeSetDoc(doc(firestoreDb, 'evaluations', docId), updatedData);
    }

    const idx = memoryDb.evaluations.findIndex(
      (e) =>
        e.id === docId ||
        (isAnnual
          ? e.year === evalData.year && e.month === 0
          : e.month === evalData.month && e.year === evalData.year)
    );

    if (idx !== -1) {
      memoryDb.evaluations[idx] = updatedData;
    } else {
      memoryDb.evaluations.push(updatedData);
    }

    saveToLocalCache(memoryDb);
    await addAuditLog(
      'SỬA',
      'Báo cáo',
      isAnnual
        ? `Lưu nội dung nhận xét, đánh giá báo cáo năm ${evalData.year}`
        : `Lưu nội dung nhận xét, đánh giá báo cáo tháng ${evalData.month}/${evalData.year}`
    );
    setSyncStatus('SAVED');
  } catch (err) {
    console.error('saveMonthlyEvaluation failed:', err);
    setSyncStatus('ERROR');
    throw err;
  }
}

export function getMonthlyEvaluation(month: number, year: number): MonthlyReportEvaluation {
  const found = memoryDb.evaluations.find((e) => e.month === month && e.year === year);
  if (found) return found;
  return {
    id: `eval_${year}_${month}`,
    month,
    year,
    generalReview: '',
    advantages: '',
    disadvantages: '',
    solutions: '',
    reporterName: '',
    reporterPosition: '',
    commanderName: '',
    commanderPosition: '',
    updatedAt: new Date().toISOString(),
  };
}

export function getAnnualEvaluation(year: number): MonthlyReportEvaluation {
  const targetId = `eval_year_${year}`;
  const found = memoryDb.evaluations.find(
    (e) => e.id === targetId || (e.year === year && e.month === 0)
  );
  if (found) return found;
  return {
    id: targetId,
    month: 0,
    year,
    generalReview: '',
    advantages: '',
    disadvantages: '',
    solutions: '',
    reporterName: '',
    reporterPosition: '',
    commanderName: '',
    commanderPosition: '',
    updatedAt: new Date().toISOString(),
  };
}

export async function updateUnitInfo(unitInfo: typeof DEFAULT_UNIT_INFO): Promise<void> {
  checkUserPermission('admin');
  setSyncStatus('SAVING');
  try {
    memoryDb.unitInfo = unitInfo;
    saveToLocalCache(memoryDb);
    if (auth.currentUser) {
      await safeSetDoc(doc(firestoreDb, 'settings', 'unitInfo'), unitInfo);
    }
    await addAuditLog('SỬA', 'Cài đặt', `Cập nhật thông tin đơn vị: ${unitInfo.unitName}`);
    setSyncStatus('SAVED');
  } catch (err) {
    console.error('updateUnitInfo failed:', err);
    setSyncStatus('ERROR');
    throw err;
  }
}

// -------------------------------------------------------------
// BACKUP, RESTORE & SYSTEM CLEAR
// -------------------------------------------------------------

export function exportDatabaseToJson(): void {
  checkUserPermission('admin');
  const jsonStr = JSON.stringify(memoryDb, null, 2);
  const blob = new Blob([jsonStr], { type: 'application/json;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  const nowStr = new Date().toISOString().slice(0, 10);
  a.href = url;
  a.download = `SAO_LUU_DON_BIEN_PHONG_HON_SON_${nowStr}.json`;
  a.click();
  URL.revokeObjectURL(url);
  addAuditLog('SAO LƯU', 'Cài đặt', 'Xuất bản sao lưu dữ liệu toàn hệ thống định dạng JSON');
}

export async function restoreDatabaseFromJson(
  jsonString: string
): Promise<{ success: boolean; message: string }> {
  checkUserPermission('admin');
  setSyncStatus('SAVING');
  try {
    let parsed: any;
    try {
      parsed = JSON.parse(jsonString);
    } catch {
      setSyncStatus('ERROR');
      return { success: false, message: 'Tệp không phải định dạng JSON hợp lệ.' };
    }

    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
      setSyncStatus('ERROR');
      return { success: false, message: 'Cấu trúc tệp sao lưu không đúng định dạng đối tượng hệ thống.' };
    }

    if (!Array.isArray(parsed.soldiers)) {
      setSyncStatus('ERROR');
      return { success: false, message: 'Tệp không hợp lệ: Không tìm thấy danh sách quân số.' };
    }

    // Validate each soldier record
    for (let i = 0; i < parsed.soldiers.length; i++) {
      const s = parsed.soldiers[i];
      if (!s || typeof s !== 'object' || !s.fullName || !s.rank || !s.position || !s.department) {
        setSyncStatus('ERROR');
        return {
          success: false,
          message: `Dữ liệu quân nhân thứ ${i + 1} không hợp lệ (thiếu họ tên, cấp bậc, chức vụ hoặc bộ phận).`,
        };
      }
    }

    // Validate collections arrays if present
    if (parsed.commendations && !Array.isArray(parsed.commendations)) {
      setSyncStatus('ERROR');
      return { success: false, message: 'Dữ liệu biểu dương trong tệp không phải danh sách hợp lệ.' };
    }
    if (parsed.reprimands && !Array.isArray(parsed.reprimands)) {
      setSyncStatus('ERROR');
      return { success: false, message: 'Dữ liệu phê bình trong tệp không phải danh sách hợp lệ.' };
    }
    if (parsed.rewards && !Array.isArray(parsed.rewards)) {
      setSyncStatus('ERROR');
      return { success: false, message: 'Dữ liệu khen thưởng trong tệp không phải danh sách hợp lệ.' };
    }
    if (parsed.leaves && !Array.isArray(parsed.leaves)) {
      setSyncStatus('ERROR');
      return { success: false, message: 'Dữ liệu đi phép trong tệp không phải danh sách hợp lệ.' };
    }
    if (parsed.evaluations && !Array.isArray(parsed.evaluations)) {
      setSyncStatus('ERROR');
      return { success: false, message: 'Dữ liệu đánh giá tháng trong tệp không phải danh sách hợp lệ.' };
    }

    // Safety backup of current database in localStorage before clearing
    try {
      const currentDb = loadDatabase();
      localStorage.setItem(`HON_SON_PRE_RESTORE_BACKUP_${Date.now()}`, JSON.stringify(currentDb));
    } catch (bErr) {
      console.warn('Backup before restore warning:', bErr);
    }

    const validatedDb: AppDatabase = {
      soldiers: (parsed.soldiers || []).map((s: any, idx: number) => ({
        ...s,
        id: s.id || `s-${Date.now()}-${idx}`,
        stt: s.stt || idx + 1,
      })),
      commendations: (parsed.commendations || []).map((c: any, idx: number) => ({
        ...c,
        id: c.id || `com-${Date.now()}-${idx}`,
      })),
      reprimands: (parsed.reprimands || []).map((r: any, idx: number) => ({
        ...r,
        id: r.id || `rep-${Date.now()}-${idx}`,
      })),
      rewards: (parsed.rewards || []).map((rw: any, idx: number) => ({
        ...rw,
        id: rw.id || `rw-${Date.now()}-${idx}`,
      })),
      leaves: (parsed.leaves || []).map((l: any, idx: number) => ({
        ...l,
        id: l.id || `leave-${Date.now()}-${idx}`,
      })),
      evaluations: (parsed.evaluations || []).map((e: any) => ({
        ...e,
        id: e.id || `eval_${e.year}_${e.month}`,
      })),
      auditLogs: memoryDb.auditLogs || [],
      unitInfo: parsed.unitInfo || memoryDb.unitInfo || DEFAULT_UNIT_INFO,
    };

    // 1. Truly clear old documents from business collections in Firestore
    await clearFirestoreCollections();

    // 2. Batch write new records safely (in chunks of <= 400)
    await batchWriteCollection('soldiers', validatedDb.soldiers);
    await batchWriteCollection('commendations', validatedDb.commendations);
    await batchWriteCollection('reprimands', validatedDb.reprimands);
    await batchWriteCollection('rewards', validatedDb.rewards);
    await batchWriteCollection('leaves', validatedDb.leaves);
    await batchWriteCollection('evaluations', validatedDb.evaluations);

    // 3. Update unitInfo & mark system as initialized in Firestore
    await setDoc(doc(firestoreDb, 'settings', 'unitInfo'), validatedDb.unitInfo);
    await setDoc(doc(firestoreDb, 'settings', 'systemStatus'), {
      isInitialized: true,
      lastRestoredAt: new Date().toISOString(),
      restoredBy: auth.currentUser?.email || 'admin',
    });

    // 4. Update local cache
    localStorage.removeItem('HON_SON_DATA_CLEARED');
    saveToLocalCache(validatedDb);

    // 5. Add audit log
    await addAuditLog(
      'KHÔI PHỤC',
      'Cài đặt',
      `Khôi phục thành công cơ sở dữ liệu (${validatedDb.soldiers.length} quân nhân, ${validatedDb.commendations.length} biểu dương, ${validatedDb.reprimands.length} phê bình)`
    );

    setSyncStatus('SAVED');
    return {
      success: true,
      message: `Khôi phục thành công cơ sở dữ liệu (${validatedDb.soldiers.length} quân nhân, ${validatedDb.commendations.length} biểu dương, ${validatedDb.reprimands.length} phê bình)!`,
    };
  } catch (err: any) {
    console.error('restoreDatabaseFromJson failed:', err);
    setSyncStatus('ERROR');
    return {
      success: false,
      message: 'Lỗi khi khôi phục cơ sở dữ liệu: ' + (err?.message || String(err)),
    };
  }
}

export async function resetToSampleData(): Promise<void> {
  checkUserPermission('admin');
  setSyncStatus('SAVING');
  try {
    const sampleDb = getSampleDatabase();
    await clearFirestoreCollections();

    await batchWriteCollection('soldiers', sampleDb.soldiers);
    await batchWriteCollection('commendations', sampleDb.commendations);
    await batchWriteCollection('reprimands', sampleDb.reprimands);
    await batchWriteCollection('rewards', sampleDb.rewards);
    await batchWriteCollection('leaves', sampleDb.leaves);
    await batchWriteCollection(
      'evaluations',
      sampleDb.evaluations.map((e) => ({
        ...e,
        id: `eval_${e.year}_${e.month}`,
      }))
    );

    await setDoc(doc(firestoreDb, 'settings', 'unitInfo'), sampleDb.unitInfo);
    await setDoc(doc(firestoreDb, 'settings', 'systemStatus'), {
      isInitialized: true,
      lastResetAt: new Date().toISOString(),
      resetBy: auth.currentUser?.email || 'admin',
    });

    localStorage.removeItem('HON_SON_DATA_CLEARED');
    saveToLocalCache(sampleDb);
    await addAuditLog('HỆ THỐNG', 'Cài đặt', 'Đặt lại toàn bộ dữ liệu mẫu chuẩn Đồn Biên phòng Hòn Sơn');
    setSyncStatus('SAVED');
  } catch (err) {
    console.error('resetToSampleData failed:', err);
    setSyncStatus('ERROR');
    throw err;
  }
}

export async function clearAllData(): Promise<void> {
  checkUserPermission('admin');
  setSyncStatus('SAVING');
  try {
    // 1. Safety backup of local data
    try {
      const current = loadDatabase();
      if (current.soldiers.length > 0) {
        localStorage.setItem(`HON_SON_PRE_CLEAR_BACKUP_${Date.now()}`, JSON.stringify(current));
      }
    } catch (bErr) {
      console.warn('Backup before clear warning:', bErr);
    }

    // 2. Clear all business collections from Firestore
    await clearFirestoreCollections();

    // 3. Mark Firestore system status as cleared
    await setDoc(doc(firestoreDb, 'settings', 'systemStatus'), {
      isInitialized: true,
      lastClearedAt: new Date().toISOString(),
      clearedBy: auth.currentUser?.email || 'admin',
    });

    // 4. Mark local storage as cleared
    localStorage.setItem('HON_SON_DATA_CLEARED', 'true');

    // 5. Clear local cache
    const emptyDb = getEmptyDatabase();
    emptyDb.unitInfo = memoryDb.unitInfo || DEFAULT_UNIT_INFO;
    emptyDb.auditLogs = memoryDb.auditLogs || [];
    saveToLocalCache(emptyDb);
    memoryDb = emptyDb;

    // 6. Audit log
    await addAuditLog(
      'HỆ THỐNG',
      'Cài đặt',
      'Đã làm trống toàn bộ dữ liệu nghiệp vụ trên cơ sở dữ liệu đám mây'
    );

    setSyncStatus('SAVED');
  } catch (err) {
    console.error('clearAllData failed:', err);
    setSyncStatus('ERROR');
    throw err;
  }
}

// -------------------------------------------------------------
// EXCEL EXPORTS
// -------------------------------------------------------------

export function exportToExcel(
  reportType: 'MONTH' | 'YEAR' | 'ALL' = 'MONTH',
  month?: number,
  year?: number
): void {
  if (reportType === 'ALL') {
    checkUserPermission('admin');
  } else {
    checkUserPermission('viewer');
  }

  const wb = XLSX.utils.book_new();
  const currentYear = year || new Date().getFullYear();
  const currentMonth = month || new Date().getMonth() + 1;

  // Sheet 1: Quân số
  const soldiersData = memoryDb.soldiers.map((s, idx) => ({
    STT: s.stt || idx + 1,
    'Họ và tên': s.fullName,
    'Cấp bậc': s.rank,
    'Chức vụ': s.position,
    'Đội / Trạm / Bộ phận': s.department,
    'Ngày sinh': s.birthDate,
    'Trạng thái': s.status,
    'Ghi chú': s.notes || '',
  }));
  const wsSoldiers = XLSX.utils.json_to_sheet(soldiersData);
  XLSX.utils.book_append_sheet(wb, wsSoldiers, 'Quân số');

  // Sheet 2: Biểu dương
  const commsFiltered =
    reportType === 'MONTH' && month && year
      ? memoryDb.commendations.filter((c) => c.month === month && c.year === year)
      : memoryDb.commendations.filter((c) => c.year === currentYear);

  const commsData = commsFiltered.map((c, idx) => ({
    STT: idx + 1,
    'Họ và tên': c.fullName,
    'Cấp bậc': c.rank,
    'Chức vụ': c.position,
    'Bộ phận': c.department,
    Ngày: c.date,
    Tuần: `Tuần ${c.weekNumber}`,
    Tháng: c.month,
    Năm: c.year,
    'Hình thức': c.commendationType,
    'Nội dung biểu dương': c.content,
    'Thành tích / Lý do': c.achievement,
    'Người đề xuất': c.proposedBy,
    'Ghi chú': c.notes || '',
  }));
  const wsComms = XLSX.utils.json_to_sheet(commsData);
  XLSX.utils.book_append_sheet(wb, wsComms, 'Biểu dương');

  // Sheet 3: Phê bình
  const repsFiltered =
    reportType === 'MONTH' && month && year
      ? memoryDb.reprimands.filter((r) => r.month === month && r.year === year)
      : memoryDb.reprimands.filter((r) => r.year === currentYear);

  const repsData = repsFiltered.map((r, idx) => ({
    STT: idx + 1,
    'Họ và tên': r.fullName,
    'Cấp bậc': r.rank,
    'Chức vụ': r.position,
    'Bộ phận': r.department,
    Ngày: r.date,
    Tuần: `Tuần ${r.weekNumber}`,
    Tháng: r.month,
    Năm: r.year,
    'Hình thức': r.reprimandType,
    'Nội dung khuyết điểm': r.content,
    'Nguyên nhân': r.defectCause,
    'Yêu cầu khắc phục': r.remediationPlan,
    'Người phê bình / nhận xét': r.reviewedBy,
    'Kết quả khắc phục': r.remediationStatus,
    'Ghi chú': r.notes || '',
  }));
  const wsReps = XLSX.utils.json_to_sheet(repsData);
  XLSX.utils.book_append_sheet(wb, wsReps, 'Phê bình');

  // Sheet 4: Khen thưởng
  const rewardsFiltered =
    reportType === 'MONTH'
      ? memoryDb.rewards.filter(
          (rw) => rw.year === currentYear && (rw.month === undefined || rw.month === currentMonth)
        )
      : memoryDb.rewards.filter((rw) => rw.year === currentYear);
  const rewardsData = rewardsFiltered.map((rw, idx) => ({
    STT: idx + 1,
    'Họ và tên': rw.fullName,
    'Cấp bậc': rw.rank,
    'Chức vụ': rw.position,
    'Bộ phận': rw.department,
    'Danh hiệu / Hình thức': rw.rewardType,
    'Thành tích': rw.achievement,
    'Số quyết định': rw.decisionNumber,
    'Ngày quyết định': rw.decisionDate,
    'Cấp quyết định': rw.decisionLevel,
    Năm: rw.year,
    'Ghi chú': rw.notes || '',
  }));
  const wsRewards = XLSX.utils.json_to_sheet(rewardsData);
  XLSX.utils.book_append_sheet(wb, wsRewards, 'Khen thưởng');

  // Sheet 5: Đi phép - Tranh thủ
  const leavesFiltered = (memoryDb.leaves || []).filter((l) => {
    if (!l.startDate) return false;
    const d = new Date(l.startDate);
    if (reportType === 'MONTH' && month && year) {
      return d.getFullYear() === year && d.getMonth() + 1 === month;
    }
    return d.getFullYear() === currentYear;
  });

  const leavesData = leavesFiltered.map((l, idx) => ({
    STT: idx + 1,
    'Cấp bậc': l.rank,
    'Họ và tên': l.fullName,
    'Chức vụ': l.position,
    'Đơn vị': l.department,
    'Phân loại': l.category,
    'Hình thức nghỉ': l.leaveType,
    'Từ ngày': formatDateVN(l.startDate),
    'Đến ngày': formatDateVN(l.endDate),
    'Số ngày': l.daysCount,
    'Nơi đến / Địa chỉ': l.destination,
    'Lý do nghỉ': l.reason,
    'Cấp phê duyệt': l.approver,
    'Số giấy phép': l.licenseNumber || '',
    'Trạng thái': l.status,
    'Ngày về thực tế': l.actualReturnDate ? formatDateVN(l.actualReturnDate) : '',
    'Ghi chú': l.notes || '',
  }));
  const wsLeaves = XLSX.utils.json_to_sheet(leavesData);
  XLSX.utils.book_append_sheet(wb, wsLeaves, 'Đi phép - Tranh thủ');

  const fileName =
    reportType === 'ALL'
      ? `CO_SO_DU_LIEU_BP_HON_SON_${currentYear}.xlsx`
      : reportType === 'MONTH' && month && year
      ? `BAO_CAO_TĐKT_HON_SON_THANG_${currentMonth}_${currentYear}.xlsx`
      : `BAO_CAO_TĐKT_HON_SON_NAM_${currentYear}.xlsx`;

  XLSX.writeFile(wb, fileName);
  addAuditLog('SAO LƯU', 'Cài đặt', `Xuất file bảng tính Excel: ${fileName}`);
}

export function exportLeavesToExcel(
  leaves: LeaveRecord[],
  month?: number,
  year?: number,
  reportType: 'MONTH' | 'YEAR' = 'MONTH'
): void {
  const headers = [
    'STT',
    'Cấp bậc',
    'Họ và tên',
    'Chức vụ',
    'Đội / Trạm / Bộ phận',
    'Phân loại',
    'Hình thức nghỉ',
    'Từ ngày',
    'Đến ngày',
    'Số ngày',
    'Nơi đến / Địa chỉ gia đình',
    'Lý do nghỉ',
    'Cấp phê duyệt',
    'Số giấy phép',
    'Trạng thái',
    'Ngày về thực tế',
    'Ghi chú',
  ];

  const rows = leaves.map((l, idx) => [
    idx + 1,
    l.rank,
    l.fullName,
    l.position,
    l.department,
    l.category,
    l.leaveType,
    formatDateVN(l.startDate),
    formatDateVN(l.endDate),
    l.daysCount,
    l.destination,
    l.reason,
    l.approver,
    l.licenseNumber || '',
    l.status,
    l.actualReturnDate ? formatDateVN(l.actualReturnDate) : '',
    l.notes || '',
  ]);

  const worksheet = XLSX.utils.aoa_to_sheet([headers, ...rows]);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Di_Phep_Tranh_Thu');

  const titleSuffix =
    reportType === 'MONTH' && month && year
      ? `Thang_${month}_${year}`
      : `Nam_${year || new Date().getFullYear()}`;
  XLSX.writeFile(workbook, `Danh_Sach_Di_Phep_Tranh_Thu_BP_Hon_Son_${titleSuffix}.xlsx`);
}

export function calculateWeekNumberFromDate(dateStr: string): number {
  if (!dateStr) return 1;
  const d = new Date(dateStr);
  const day = d.getDate();
  if (day <= 7) return 1;
  if (day <= 14) return 2;
  if (day <= 21) return 3;
  if (day <= 28) return 4;
  return 5;
}

export function formatDateVN(dateStr?: string): string {
  if (!dateStr) return '';
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(dateStr)) return dateStr;
  const parts = dateStr.split('-');
  if (parts.length === 3) {
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
  }
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  return `${day}/${month}/${year}`;
}
