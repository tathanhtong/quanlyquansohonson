import { Commendation, LeaveRecord, Reprimand, Reward, Soldier } from '../types';

export type ReportType = 'MONTH' | 'YEAR';

export interface FilteredReportData {
  reportType: ReportType;
  month: number;
  year: number;
  title: string;
  subTitle: string;
  cutoffText: string;
  activeComms: Commendation[];
  activeReps: Reprimand[];
  activeRewards: Reward[];
  activeLeaves: LeaveRecord[];
  uniqueCommsSoldiersCount: number;
  uniqueRepsSoldiersCount: number;
  totalSoldiers: number;
  weeklyBreakdown: Array<{
    week: number;
    comms: Commendation[];
    reps: Reprimand[];
  }>;
  monthBreakdown: Array<{
    month: number;
    comms: Commendation[];
    reps: Reprimand[];
    rewards: Reward[];
  }>;
}

export function getFilteredReportData(
  reportType: ReportType,
  month: number,
  year: number,
  soldiers: Soldier[],
  commendations: Commendation[],
  reprimands: Reprimand[],
  rewards: Reward[],
  leaves: LeaveRecord[] = []
): FilteredReportData {
  const isMonth = reportType === 'MONTH';

  // Commendations
  const activeComms = isMonth
    ? commendations.filter((c) => c.month === month && c.year === year)
    : commendations.filter((c) => c.year === year);

  // Reprimands
  const activeReps = isMonth
    ? reprimands.filter((r) => r.month === month && r.year === year)
    : reprimands.filter((r) => r.year === year);

  // Rewards
  const activeRewards = isMonth
    ? rewards.filter((rw) => rw.year === year && (rw.month === undefined || rw.month === month))
    : rewards.filter((rw) => rw.year === year);

  // Leaves
  const activeLeaves = isMonth
    ? leaves.filter((l) => {
        if (!l.startDate) return false;
        const d = new Date(l.startDate);
        return d.getFullYear() === year && d.getMonth() + 1 === month;
      })
    : leaves.filter((l) => {
        if (!l.startDate) return false;
        const d = new Date(l.startDate);
        return d.getFullYear() === year;
      });

  const uniqueCommsSoldiersCount = new Set(activeComms.map((c) => c.soldierId)).size;
  const uniqueRepsSoldiersCount = new Set(activeReps.map((r) => r.soldierId)).size;

  const title = isMonth
    ? `KẾT QUẢ BIỂU DƯƠNG, PHÊ BÌNH THÁNG ${month} NĂM ${year}`
    : `KẾT QUẢ BIỂU DƯƠNG, PHÊ BÌNH NĂM ${year}`;

  const subTitle = isMonth
    ? `Kết quả biểu dương, phê bình tháng ${month} năm ${year}`
    : `Kết quả biểu dương, phê bình năm ${year}`;

  const cutoffText = isMonth
    ? `(Thời điểm chốt số liệu: Tuần 1 đến Tuần 5 tháng ${month} năm ${year})`
    : `(Thời điểm chốt số liệu: Từ tháng 01 đến tháng 12 năm ${year})`;

  // Weekly breakdown (1 to 5) for monthly view
  const weeklyBreakdown = [1, 2, 3, 4, 5].map((w) => ({
    week: w,
    comms: activeComms.filter((c) => c.weekNumber === w),
    reps: activeReps.filter((r) => r.weekNumber === w),
  }));

  // Month breakdown (1 to 12) for yearly view
  const monthBreakdown = Array.from({ length: 12 }, (_, i) => i + 1).map((m) => ({
    month: m,
    comms: activeComms.filter((c) => c.month === m),
    reps: activeReps.filter((r) => r.month === m),
    rewards: activeRewards.filter((rw) => rw.month === m),
  }));

  return {
    reportType,
    month,
    year,
    title,
    subTitle,
    cutoffText,
    activeComms,
    activeReps,
    activeRewards,
    activeLeaves,
    uniqueCommsSoldiersCount,
    uniqueRepsSoldiersCount,
    totalSoldiers: soldiers.length,
    weeklyBreakdown,
    monthBreakdown,
  };
}
