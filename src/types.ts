export type MilitaryRank =
  | 'Đại tá'
  | 'Thượng tá'
  | 'Trung tá'
  | 'Thiếu tá'
  | 'Đại úy'
  | 'Thượng úy'
  | 'Trung úy'
  | 'Thiếu úy'
  | 'Thượng tá QNCN'
  | 'Trung tá QNCN'
  | 'Thiếu tá QNCN'
  | 'Đại úy QNCN'
  | 'Thượng úy QNCN'
  | 'Trung úy QNCN'
  | 'Thiếu úy QNCN'
  | 'Thượng sĩ'
  | 'Trung sĩ'
  | 'Hạ sĩ'
  | 'Binh nhất'
  | 'Binh nhì'
  | string;

export type DepartmentName =
  | 'Ban Chỉ huy Đồn'
  | 'Đội Vũ trang'
  | 'Đội Vận động quần chúng'
  | 'Đội Phòng chống ma túy và tội phạm'
  | 'Đội Kiểm soát hành chính'
  | 'Đội Trinh sát'
  | 'Trạm Kiểm soát Biên phòng Bãi Nhà'
  | 'Trạm Kiểm soát Biên phòng Bãi Bấc'
  | 'Bộ phận Hậu cần - Kỹ thuật'
  | 'Bộ phận Thông tin - Cơ yếu'
  | string;

export type DutyStatus = 'Đang công tác' | 'Tăng cường' | 'Nghỉ phép' | 'Đi học' | 'Đi viện' | string;

export type UserRole = 'admin' | 'editor' | 'viewer';

export interface AppUser {
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string;
  role: UserRole;
  active: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface Soldier {
  id: string;
  stt?: number;
  fullName: string;
  rank: MilitaryRank;
  position: string; // Chức vụ: Đồn trưởng, Chính trị viên, Phó Đồn trưởng, Đội trưởng, Trạm trưởng, Nhân viên, Chiến sĩ...
  department: DepartmentName;
  birthDate: string; // YYYY-MM-DD or DD/MM/YYYY
  status: DutyStatus;
  notes?: string;
  enlistmentDate?: string;
  phoneNumber?: string;
  createdAt: string;
  updatedAt: string;
  createdByUid?: string;
  createdByName?: string;
  createdByEmail?: string;
  updatedByUid?: string;
  updatedByName?: string;
  updatedByEmail?: string;
}

export type CommendationType =
  | 'Biểu dương trước toàn đồn'
  | 'Biểu dương trong giao ban tuần'
  | 'Biểu dương trên bảng tin thi đua'
  | 'Biểu dương đột xuất trong thực hiện nhiệm vụ'
  | 'Đề nghị cấp trên khen thưởng'
  | string;

export interface Commendation {
  id: string;
  soldierId: string;
  fullName: string;
  rank: MilitaryRank;
  position: string;
  department: DepartmentName;
  date: string; // YYYY-MM-DD
  weekNumber: number; // 1 | 2 | 3 | 4 | 5
  month: number; // 1..12
  year: number; // e.g. 2026
  content: string; // Nội dung biểu dương
  achievement: string; // Thành tích/lý do được biểu dương
  proposedBy: string; // Người đề xuất
  commendationType: CommendationType; // Hình thức biểu dương
  notes?: string;
  createdAt: string;
}

export type ReprimandType =
  | 'Nhắc nhở tại giao ban tuần'
  | 'Phê bình trước toàn đồn'
  | 'Kiểm điểm trước cấp ủy, chỉ huy đội/trạm'
  | 'Kiểm điểm trước chi bộ'
  | 'Hạ bậc xếp loại thi đua tuần'
  | string;

export type RemediationStatus = 'Chưa khắc phục' | 'Đang chuyển biến tốt' | 'Đã khắc phục sửa chữa';

export interface Reprimand {
  id: string;
  soldierId: string;
  fullName: string;
  rank: MilitaryRank;
  position: string;
  department: DepartmentName;
  date: string; // YYYY-MM-DD
  weekNumber: number; // 1 | 2 | 3 | 4 | 5
  month: number; // 1..12
  year: number; // e.g. 2026
  content: string; // Nội dung khuyết điểm
  defectCause: string; // Nguyên nhân
  reprimandType: ReprimandType; // Hình thức phê bình/nhắc nhở
  remediationPlan: string; // Yêu cầu khắc phục
  reviewedBy: string; // Người nhận xét/phê bình
  remediationStatus: RemediationStatus; // Kết quả khắc phục
  notes?: string;
  createdAt: string;
}

export interface Reward {
  id: string;
  soldierId: string;
  fullName: string;
  rank: MilitaryRank;
  position: string;
  department: DepartmentName;
  rewardType: string; // Hình thức khen thưởng (Chiến sĩ thi đua cơ sở, Giấy khen, Bằng khen...)
  achievement: string; // Thành tích
  decisionNumber: string; // Số quyết định
  decisionDate: string; // Ngày quyết định
  decisionLevel: string; // Cấp quyết định (BCH BĐBP Tỉnh, Bộ Tư lệnh BĐBP, UBND Tỉnh/Huyện...)
  year: number;
  month?: number;
  notes?: string;
  createdAt: string;
}

export type LeaveCategory = 'Đi phép' | 'Tranh thủ';

export type LeaveType =
  | 'Phép năm'
  | 'Phép đặc biệt'
  | 'Phép việc riêng'
  | 'Phép bù'
  | 'Tranh thủ cuối tuần'
  | 'Tranh thủ giải quyết việc riêng'
  | 'Tranh thủ 24 giờ'
  | 'Tranh thủ 48 giờ'
  | string;

export type LeaveStatus = 'Đang nghỉ' | 'Đã về đơn vị' | 'Sắp đi' | 'Quá hạn';

export interface LeaveRecord {
  id: string;
  soldierId: string;
  fullName: string;
  rank: MilitaryRank;
  position: string;
  department: DepartmentName;
  category: LeaveCategory; // 'Đi phép' | 'Tranh thủ'
  leaveType: LeaveType;
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  daysCount: number; // Số ngày nghỉ
  destination: string; // Nơi đến / Địa chỉ nghỉ (quê quán, gia đình...)
  reason: string; // Lý do nghỉ
  approver: string; // Cấp/Người phê duyệt (Chỉ huy Đồn)
  licenseNumber?: string; // Số giấy phép (VD: GP-08/ĐBP)
  actualReturnDate?: string; // Ngày thực tế về đơn vị
  status: LeaveStatus; // 'Đang nghỉ' | 'Đã về đơn vị' | 'Sắp đi' | 'Quá hạn'
  notes?: string;
  createdAt: string;
}

export interface AuditLog {
  id: string;
  timestamp: string;
  user: string;
  uid?: string;
  email?: string;
  action: 'THÊM' | 'SỬA' | 'XÓA' | 'SAO LƯU' | 'KHÔI PHỤC' | 'HỆ THỐNG';
  targetType: 'Quân số' | 'Biểu dương' | 'Phê bình' | 'Khen thưởng' | 'Đi phép - Tranh thủ' | 'Báo cáo' | 'Cài đặt' | 'Người dùng';
  details: string;
}

export interface MonthlyReportEvaluation {
  id: string;
  month: number;
  year: number;
  generalReview: string; // Nhận xét chung
  advantages: string; // Ưu điểm nổi bật
  disadvantages: string; // Hạn chế, tồn tại
  solutions: string; // Biện pháp khắc phục và phương hướng tuần/tháng tới
  reporterName: string; // Người lập báo cáo
  reporterPosition: string;
  commanderName: string; // Chỉ huy duyệt
  commanderPosition: string;
  updatedAt: string;
}

export interface AppDatabase {
  soldiers: Soldier[];
  commendations: Commendation[];
  reprimands: Reprimand[];
  rewards: Reward[];
  leaves: LeaveRecord[];
  evaluations: MonthlyReportEvaluation[];
  auditLogs: AuditLog[];
  unitInfo: {
    unitName: string;
    parentUnit: string;
    superiorUnit: string;
    stationLocation: string;
  };
}
