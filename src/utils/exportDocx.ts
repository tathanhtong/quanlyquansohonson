import {
  AlignmentType,
  BorderStyle,
  Document,
  HeightRule,
  Packer,
  Paragraph,
  ShadingType,
  Table,
  TableCell,
  TableRow,
  TextRun,
  VerticalAlign,
  WidthType,
} from 'docx';
import {
  Commendation,
  LeaveRecord,
  MonthlyReportEvaluation,
  Reprimand,
  Reward,
  Soldier,
} from '../types';
import { formatDateVN } from '../services/storage';
import { getFilteredReportData, ReportType } from './reportHelpers';

interface ExportDocxOptions {
  reportType: ReportType;
  month: number;
  year: number;
  soldiers: Soldier[];
  commendations: Commendation[];
  reprimands: Reprimand[];
  rewards: Reward[];
  leaves?: LeaveRecord[];
  evaluation: MonthlyReportEvaluation;
  unitInfo: {
    unitName: string;
    parentUnit: string;
    superiorUnit: string;
    stationLocation: string;
  };
}

export async function exportMonthlyReportToDocx(options: ExportDocxOptions): Promise<void> {
  const {
    reportType,
    month,
    year,
    soldiers,
    commendations,
    reprimands,
    rewards,
    leaves = [],
    evaluation,
    unitInfo,
  } = options;

  const data = getFilteredReportData(
    reportType,
    month,
    year,
    soldiers,
    commendations,
    reprimands,
    rewards,
    leaves
  );

  const today = new Date();
  const dayStr = String(today.getDate()).padStart(2, '0');
  const monthStr = String(today.getMonth() + 1).padStart(2, '0');
  const yearStr = today.getFullYear();

  const font = 'Times New Roman';

  const cellBorderNone = {
    top: { style: BorderStyle.NONE, size: 0, color: 'auto' },
    bottom: { style: BorderStyle.NONE, size: 0, color: 'auto' },
    left: { style: BorderStyle.NONE, size: 0, color: 'auto' },
    right: { style: BorderStyle.NONE, size: 0, color: 'auto' },
  };

  const cellBorderThin = {
    top: { style: BorderStyle.SINGLE, size: 4, color: '000000' },
    bottom: { style: BorderStyle.SINGLE, size: 4, color: '000000' },
    left: { style: BorderStyle.SINGLE, size: 4, color: '000000' },
    right: { style: BorderStyle.SINGLE, size: 4, color: '000000' },
  };

  // Header Table (Unit Branding + National Motto)
  const headerTable = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: cellBorderNone,
    rows: [
      new TableRow({
        children: [
          new TableCell({
            width: { size: 50, type: WidthType.PERCENTAGE },
            borders: cellBorderNone,
            children: [
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [
                  new TextRun({ text: unitInfo.superiorUnit.toUpperCase(), font, size: 18 }),
                ],
              }),
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [
                  new TextRun({ text: unitInfo.parentUnit.toUpperCase(), font, size: 18 }),
                ],
              }),
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [
                  new TextRun({ text: unitInfo.unitName.toUpperCase(), bold: true, font, size: 20 }),
                ],
              }),
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [
                  new TextRun({ text: '————————', bold: true, font, size: 16 }),
                ],
              }),
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [
                  new TextRun({ text: 'Số:        /BC-ĐBP', font, size: 20 }),
                ],
              }),
            ],
          }),
          new TableCell({
            width: { size: 50, type: WidthType.PERCENTAGE },
            borders: cellBorderNone,
            children: [
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [
                  new TextRun({ text: 'CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM', bold: true, font, size: 20 }),
                ],
              }),
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [
                  new TextRun({ text: 'Độc lập - Tự do - Hạnh phúc', bold: true, font, size: 22 }),
                ],
              }),
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [
                  new TextRun({ text: '————————', bold: true, font, size: 16 }),
                ],
              }),
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [
                  new TextRun({
                    text: `Hòn Sơn, ngày ${dayStr} tháng ${monthStr} năm ${yearStr}`,
                    italics: true,
                    font,
                    size: 20,
                  }),
                ],
              }),
            ],
          }),
        ],
      }),
    ],
  });

  // Summary Table Rows
  const summaryRows: TableRow[] = [
    new TableRow({
      tableHeader: true,
      children: [
        new TableCell({
          borders: cellBorderThin,
          shading: { type: ShadingType.CLEAR, fill: 'E2E8F0' },
          children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: 'STT', bold: true, font, size: 20 })] })],
          width: { size: 8, type: WidthType.PERCENTAGE },
        }),
        new TableCell({
          borders: cellBorderThin,
          shading: { type: ShadingType.CLEAR, fill: 'E2E8F0' },
          children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: 'Nội dung chỉ tiêu theo dõi', bold: true, font, size: 20 })] })],
          width: { size: 52, type: WidthType.PERCENTAGE },
        }),
        new TableCell({
          borders: cellBorderThin,
          shading: { type: ShadingType.CLEAR, fill: 'E2E8F0' },
          children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: 'Số lượng', bold: true, font, size: 20 })] })],
          width: { size: 20, type: WidthType.PERCENTAGE },
        }),
        new TableCell({
          borders: cellBorderThin,
          shading: { type: ShadingType.CLEAR, fill: 'E2E8F0' },
          children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: 'Ghi chú', bold: true, font, size: 20 })] })],
          width: { size: 20, type: WidthType.PERCENTAGE },
        }),
      ],
    }),
    new TableRow({
      children: [
        new TableCell({ borders: cellBorderThin, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: '1', font, size: 20 })] })] }),
        new TableCell({ borders: cellBorderThin, children: [new Paragraph({ children: [new TextRun({ text: 'Tổng quân số đơn vị quản lý', font, size: 20 })] })] }),
        new TableCell({ borders: cellBorderThin, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: `${soldiers.length} đồng chí`, bold: true, font, size: 20 })] })] }),
        new TableCell({ borders: cellBorderThin, children: [new Paragraph({ children: [new TextRun({ text: 'Biên chế hiện diện', font, size: 20 })] })] }),
      ],
    }),
    new TableRow({
      children: [
        new TableCell({ borders: cellBorderThin, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: '2', font, size: 20 })] })] }),
        new TableCell({ borders: cellBorderThin, children: [new Paragraph({ children: [new TextRun({ text: 'Tổng số lượt biểu dương', font, size: 20 })] })] }),
        new TableCell({ borders: cellBorderThin, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: `${data.activeComms.length} lượt`, bold: true, font, size: 20 })] })] }),
        new TableCell({ borders: cellBorderThin, children: [new Paragraph({ children: [new TextRun({ text: reportType === 'MONTH' ? 'Trong tháng' : 'Trong toàn năm', font, size: 20 })] })] }),
      ],
    }),
    new TableRow({
      children: [
        new TableCell({ borders: cellBorderThin, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: '3', font, size: 20 })] })] }),
        new TableCell({ borders: cellBorderThin, children: [new Paragraph({ children: [new TextRun({ text: 'Tổng số cán bộ, chiến sĩ được biểu dương', font, size: 20 })] })] }),
        new TableCell({ borders: cellBorderThin, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: `${data.uniqueCommsSoldiersCount} đồng chí`, bold: true, font, size: 20 })] })] }),
        new TableCell({ borders: cellBorderThin, children: [new Paragraph({ children: [new TextRun({ text: `Tỷ lệ: ${soldiers.length > 0 ? ((data.uniqueCommsSoldiersCount / soldiers.length) * 100).toFixed(1) : 0}% quân số`, font, size: 20 })] })] }),
      ],
    }),
    new TableRow({
      children: [
        new TableCell({ borders: cellBorderThin, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: '4', font, size: 20 })] })] }),
        new TableCell({ borders: cellBorderThin, children: [new Paragraph({ children: [new TextRun({ text: 'Tổng số lượt phê bình, nhắc nhở', font, size: 20 })] })] }),
        new TableCell({ borders: cellBorderThin, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: `${data.activeReps.length} lượt`, bold: true, font, size: 20 })] })] }),
        new TableCell({ borders: cellBorderThin, children: [new Paragraph({ children: [new TextRun({ text: 'Chấn chỉnh tác phong', font, size: 20 })] })] }),
      ],
    }),
    new TableRow({
      children: [
        new TableCell({ borders: cellBorderThin, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: '5', font, size: 20 })] })] }),
        new TableCell({ borders: cellBorderThin, children: [new Paragraph({ children: [new TextRun({ text: 'Tổng số cá nhân bị phê bình, nhắc nhở', font, size: 20 })] })] }),
        new TableCell({ borders: cellBorderThin, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: `${data.uniqueRepsSoldiersCount} đồng chí`, bold: true, font, size: 20 })] })] }),
        new TableCell({ borders: cellBorderThin, children: [new Paragraph({ children: [new TextRun({ text: `Tỷ lệ: ${soldiers.length > 0 ? ((data.uniqueRepsSoldiersCount / soldiers.length) * 100).toFixed(1) : 0}% quân số`, font, size: 20 })] })] }),
      ],
    }),
  ];

  const summaryTable = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: cellBorderThin,
    rows: summaryRows,
  });

  // Commendations Table
  const commRows: TableRow[] = [
    new TableRow({
      tableHeader: true,
      children: [
        new TableCell({ borders: cellBorderThin, shading: { type: ShadingType.CLEAR, fill: 'E2E8F0' }, width: { size: 6, type: WidthType.PERCENTAGE }, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: 'STT', bold: true, font, size: 19 })] })] }),
        new TableCell({ borders: cellBorderThin, shading: { type: ShadingType.CLEAR, fill: 'E2E8F0' }, width: { size: 12, type: WidthType.PERCENTAGE }, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: 'Cấp bậc', bold: true, font, size: 19 })] })] }),
        new TableCell({ borders: cellBorderThin, shading: { type: ShadingType.CLEAR, fill: 'E2E8F0' }, width: { size: 18, type: WidthType.PERCENTAGE }, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: 'Họ và tên', bold: true, font, size: 19 })] })] }),
        new TableCell({ borders: cellBorderThin, shading: { type: ShadingType.CLEAR, fill: 'E2E8F0' }, width: { size: 18, type: WidthType.PERCENTAGE }, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: 'Chức vụ - Đội/Trạm', bold: true, font, size: 19 })] })] }),
        new TableCell({ borders: cellBorderThin, shading: { type: ShadingType.CLEAR, fill: 'E2E8F0' }, width: { size: 12, type: WidthType.PERCENTAGE }, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: 'Thời gian', bold: true, font, size: 19 })] })] }),
        new TableCell({ borders: cellBorderThin, shading: { type: ShadingType.CLEAR, fill: 'E2E8F0' }, width: { size: 34, type: WidthType.PERCENTAGE }, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: 'Nội dung & Thành tích biểu dương', bold: true, font, size: 19 })] })] }),
      ],
    }),
  ];

  if (data.activeComms.length === 0) {
    commRows.push(
      new TableRow({
        children: [
          new TableCell({
            borders: cellBorderThin,
            columnSpan: 6,
            children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: 'Không có dữ liệu biểu dương trong kỳ báo cáo', italics: true, font, size: 19 })] })],
          }),
        ],
      })
    );
  } else {
    data.activeComms.forEach((c, idx) => {
      commRows.push(
        new TableRow({
          children: [
            new TableCell({ borders: cellBorderThin, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: String(idx + 1), font, size: 19 })] })] }),
            new TableCell({ borders: cellBorderThin, children: [new Paragraph({ children: [new TextRun({ text: c.rank, font, size: 19 })] })] }),
            new TableCell({ borders: cellBorderThin, children: [new Paragraph({ children: [new TextRun({ text: c.fullName, bold: true, font, size: 19 })] })] }),
            new TableCell({ borders: cellBorderThin, children: [new Paragraph({ children: [new TextRun({ text: `${c.position} - ${c.department}`, font, size: 19 })] })] }),
            new TableCell({ borders: cellBorderThin, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: `Tuần ${c.weekNumber} (T${c.month})`, font, size: 19 })] })] }),
            new TableCell({ borders: cellBorderThin, children: [new Paragraph({ children: [new TextRun({ text: `${c.content}. ${c.achievement ? 'Thành tích: ' + c.achievement : ''}`, font, size: 19 })] })] }),
          ],
        })
      );
    });
  }

  const commendationsTable = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: cellBorderThin,
    rows: commRows,
  });

  // Reprimands Table
  const repRows: TableRow[] = [
    new TableRow({
      tableHeader: true,
      children: [
        new TableCell({ borders: cellBorderThin, shading: { type: ShadingType.CLEAR, fill: 'E2E8F0' }, width: { size: 6, type: WidthType.PERCENTAGE }, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: 'STT', bold: true, font, size: 19 })] })] }),
        new TableCell({ borders: cellBorderThin, shading: { type: ShadingType.CLEAR, fill: 'E2E8F0' }, width: { size: 12, type: WidthType.PERCENTAGE }, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: 'Cấp bậc', bold: true, font, size: 19 })] })] }),
        new TableCell({ borders: cellBorderThin, shading: { type: ShadingType.CLEAR, fill: 'E2E8F0' }, width: { size: 18, type: WidthType.PERCENTAGE }, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: 'Họ và tên', bold: true, font, size: 19 })] })] }),
        new TableCell({ borders: cellBorderThin, shading: { type: ShadingType.CLEAR, fill: 'E2E8F0' }, width: { size: 18, type: WidthType.PERCENTAGE }, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: 'Chức vụ - Đội/Trạm', bold: true, font, size: 19 })] })] }),
        new TableCell({ borders: cellBorderThin, shading: { type: ShadingType.CLEAR, fill: 'E2E8F0' }, width: { size: 12, type: WidthType.PERCENTAGE }, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: 'Thời gian', bold: true, font, size: 19 })] })] }),
        new TableCell({ borders: cellBorderThin, shading: { type: ShadingType.CLEAR, fill: 'E2E8F0' }, width: { size: 34, type: WidthType.PERCENTAGE }, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: 'Nội dung khuyết điểm & Khắc phục', bold: true, font, size: 19 })] })] }),
      ],
    }),
  ];

  if (data.activeReps.length === 0) {
    repRows.push(
      new TableRow({
        children: [
          new TableCell({
            borders: cellBorderThin,
            columnSpan: 6,
            children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: 'Không có quân nhân bị phê bình, nhắc nhở trong kỳ báo cáo', italics: true, font, size: 19 })] })],
          }),
        ],
      })
    );
  } else {
    data.activeReps.forEach((r, idx) => {
      repRows.push(
        new TableRow({
          children: [
            new TableCell({ borders: cellBorderThin, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: String(idx + 1), font, size: 19 })] })] }),
            new TableCell({ borders: cellBorderThin, children: [new Paragraph({ children: [new TextRun({ text: r.rank, font, size: 19 })] })] }),
            new TableCell({ borders: cellBorderThin, children: [new Paragraph({ children: [new TextRun({ text: r.fullName, bold: true, font, size: 19 })] })] }),
            new TableCell({ borders: cellBorderThin, children: [new Paragraph({ children: [new TextRun({ text: `${r.position} - ${r.department}`, font, size: 19 })] })] }),
            new TableCell({ borders: cellBorderThin, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: `Tuần ${r.weekNumber} (T${r.month})`, font, size: 19 })] })] }),
            new TableCell({ borders: cellBorderThin, children: [new Paragraph({ children: [new TextRun({ text: `${r.content}. Khắc phục: ${r.remediationPlan || 'N/A'} (${r.remediationStatus})`, font, size: 19 })] })] }),
          ],
        })
      );
    });
  }

  const reprimandsTable = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: cellBorderThin,
    rows: repRows,
  });

  // Signatures Table
  const signaturesTable = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: cellBorderNone,
    rows: [
      new TableRow({
        children: [
          new TableCell({
            borders: cellBorderNone,
            width: { size: 50, type: WidthType.PERCENTAGE },
            children: [
              new Paragraph({
                children: [
                  new TextRun({ text: 'Nơi nhận:', bold: true, italics: true, font, size: 20 }),
                ],
              }),
              new Paragraph({
                children: [
                  new TextRun({ text: '- Phòng Chính trị BĐBP Tỉnh (b/c);', font, size: 18 }),
                ],
              }),
              new Paragraph({
                children: [
                  new TextRun({ text: '- Ban Chỉ huy Đồn;', font, size: 18 }),
                ],
              }),
              new Paragraph({
                children: [
                  new TextRun({ text: '- Lưu: VT, ĐBP.', font, size: 18 }),
                ],
              }),
            ],
          }),
          new TableCell({
            borders: cellBorderNone,
            width: { size: 50, type: WidthType.PERCENTAGE },
            children: [
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [
                  new TextRun({ text: evaluation.commanderPosition.toUpperCase(), bold: true, font, size: 20 }),
                ],
              }),
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [
                  new TextRun({ text: '(Ký, ghi rõ họ tên và đóng dấu)', italics: true, font, size: 18 }),
                ],
              }),
              new Paragraph({ children: [new TextRun({ text: '\n\n\n' })] }),
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [
                  new TextRun({ text: evaluation.commanderName, bold: true, font, size: 22 }),
                ],
              }),
            ],
          }),
        ],
      }),
    ],
  });

  const doc = new Document({
    sections: [
      {
        properties: {
          page: {
            margin: {
              top: 1134, // 20mm
              bottom: 1134, // 20mm
              left: 1417, // 25mm
              right: 1134, // 20mm
            },
          },
        },
        children: [
          headerTable,
          new Paragraph({ children: [new TextRun({ text: '' })], spacing: { after: 200 } }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { before: 100, after: 60 },
            children: [
              new TextRun({
                text: 'BÁO CÁO',
                bold: true,
                font,
                size: 32,
              }),
            ],
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { after: 60 },
            children: [
              new TextRun({
                text: data.subTitle.toUpperCase(),
                bold: true,
                font,
                size: 26,
              }),
            ],
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { after: 300 },
            children: [
              new TextRun({
                text: data.cutoffText,
                italics: true,
                font,
                size: 20,
              }),
            ],
          }),

          // Part I
          new Paragraph({
            spacing: { before: 200, after: 100 },
            children: [
              new TextRun({
                text: 'I. TỔNG HỢP SỐ LIỆU QUÂN SỐ VÀ THI ĐUA',
                bold: true,
                font,
                size: 24,
              }),
            ],
          }),
          summaryTable,

          // Part II
          new Paragraph({
            spacing: { before: 300, after: 100 },
            children: [
              new TextRun({
                text: 'II. DANH SÁCH CÁN BỘ, CHIẾN SĨ ĐƯỢC BIỂU DƯƠNG',
                bold: true,
                font,
                size: 24,
              }),
            ],
          }),
          commendationsTable,

          // Part III
          new Paragraph({
            spacing: { before: 300, after: 100 },
            children: [
              new TextRun({
                text: 'III. DANH SÁCH CÁN BỘ, CHIẾN SĨ BỊ PHÊ BÌNH, NHẮC NHỞ',
                bold: true,
                font,
                size: 24,
              }),
            ],
          }),
          reprimandsTable,

          // Part IV
          new Paragraph({
            spacing: { before: 300, after: 100 },
            children: [
              new TextRun({
                text: 'IV. NHẬN XÉT, ĐÁNH GIÁ VÀ PHƯƠNG HƯỚNG CÔNG TÁC',
                bold: true,
                font,
                size: 24,
              }),
            ],
          }),
          new Paragraph({
            spacing: { after: 80 },
            children: [
              new TextRun({ text: '1. Đánh giá chung: ', bold: true, font, size: 21 }),
              new TextRun({ text: evaluation.generalReview || 'Đơn vị duy trì nghiêm túc nền nếp, kỷ luật quân đội và điều lệnh CAND/BĐBP.', font, size: 21 }),
            ],
          }),
          new Paragraph({
            spacing: { after: 80 },
            children: [
              new TextRun({ text: '2. Ưu điểm nổi bật: ', bold: true, font, size: 21 }),
              new TextRun({ text: evaluation.advantages || 'Cán bộ, chiến sĩ an tâm tư tưởng, đoàn kết nội bộ tốt, hoàn thành tốt nhiệm vụ tuần tra kiểm soát.', font, size: 21 }),
            ],
          }),
          new Paragraph({
            spacing: { after: 80 },
            children: [
              new TextRun({ text: '3. Hạn chế, tồn tại: ', bold: true, font, size: 21 }),
              new TextRun({ text: evaluation.disadvantages || 'Một số đồng chí chiến sĩ trẻ còn thiếu tập trung trong giao ban và xưng hô chào hỏi.', font, size: 21 }),
            ],
          }),
          new Paragraph({
            spacing: { after: 200 },
            children: [
              new TextRun({ text: '4. Phương hướng, biện pháp khắc phục: ', bold: true, font, size: 21 }),
              new TextRun({ text: evaluation.solutions || 'Tăng cường công tác kiểm tra, đôn đốc của chỉ huy đội/trạm; gắn kết quả thi đua với bình xét cuối năm.', font, size: 21 }),
            ],
          }),

          new Paragraph({ children: [new TextRun({ text: '' })], spacing: { after: 200 } }),
          signaturesTable,
        ],
      },
    ],
  });

  const blob = await Packer.toBlob(doc);
  const fileName =
    reportType === 'MONTH'
      ? `BAO_CAO_DON_BP_HON_SON_THANG_${month}_${year}.docx`
      : `BAO_CAO_DON_BP_HON_SON_NAM_${year}.docx`;

  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// Export Soldier Profile to DOCX
export async function exportSoldierProfileToWord(
  soldier: Soldier,
  commendations: Commendation[],
  reprimands: Reprimand[],
  rewards: Reward[],
  unitInfo: { unitName: string; parentUnit: string; superiorUnit: string }
): Promise<void> {
  const font = 'Times New Roman';
  const cellBorderThin = {
    top: { style: BorderStyle.SINGLE, size: 4, color: '000000' },
    bottom: { style: BorderStyle.SINGLE, size: 4, color: '000000' },
    left: { style: BorderStyle.SINGLE, size: 4, color: '000000' },
    right: { style: BorderStyle.SINGLE, size: 4, color: '000000' },
  };

  const doc = new Document({
    sections: [
      {
        properties: {
          page: {
            margin: { top: 1134, bottom: 1134, left: 1417, right: 1134 },
          },
        },
        children: [
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [
              new TextRun({ text: 'CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM', bold: true, font, size: 22 }),
            ],
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [
              new TextRun({ text: 'Độc lập - Tự do - Hạnh phúc', bold: true, font, size: 24 }),
            ],
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { after: 300 },
            children: [new TextRun({ text: '————————', bold: true, font, size: 16 })],
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { after: 200 },
            children: [
              new TextRun({
                text: 'HỒ SƠ THEO DÕI QUÂN NHÂN VÀ THI ĐUA KHEN THƯỞNG',
                bold: true,
                font,
                size: 28,
              }),
            ],
          }),
          new Paragraph({
            spacing: { after: 80 },
            children: [
              new TextRun({ text: 'Họ và tên: ', bold: true, font, size: 22 }),
              new TextRun({ text: soldier.fullName.toUpperCase(), bold: true, font, size: 24 }),
            ],
          }),
          new Paragraph({
            spacing: { after: 80 },
            children: [
              new TextRun({ text: 'Cấp bậc: ', bold: true, font, size: 22 }),
              new TextRun({ text: soldier.rank, font, size: 22 }),
              new TextRun({ text: '   |   Chức vụ: ', bold: true, font, size: 22 }),
              new TextRun({ text: soldier.position, font, size: 22 }),
            ],
          }),
          new Paragraph({
            spacing: { after: 80 },
            children: [
              new TextRun({ text: 'Đơn vị: ', bold: true, font, size: 22 }),
              new TextRun({ text: `${soldier.department} - ${unitInfo.unitName}`, font, size: 22 }),
            ],
          }),
          new Paragraph({
            spacing: { after: 80 },
            children: [
              new TextRun({ text: 'Ngày sinh: ', bold: true, font, size: 22 }),
              new TextRun({ text: formatDateVN(soldier.birthDate), font, size: 22 }),
              new TextRun({ text: '   |   Trạng thái công tác: ', bold: true, font, size: 22 }),
              new TextRun({ text: soldier.status, font, size: 22 }),
            ],
          }),
          new Paragraph({
            spacing: { before: 200, after: 100 },
            children: [
              new TextRun({
                text: `I. THÀNH TÍCH BIỂU DƯƠNG (${commendations.length} lượt)`,
                bold: true,
                font,
                size: 22,
              }),
            ],
          }),
          ...commendations.map(
            (c, i) =>
              new Paragraph({
                spacing: { after: 60 },
                children: [
                  new TextRun({ text: `${i + 1}. Tuần ${c.weekNumber}/${c.month}/${c.year}: `, bold: true, font, size: 20 }),
                  new TextRun({ text: `${c.content} (Thành tích: ${c.achievement || 'N/A'})`, font, size: 20 }),
                ],
              })
          ),
          new Paragraph({
            spacing: { before: 200, after: 100 },
            children: [
              new TextRun({
                text: `II. NHẮC NHỞ, PHÊ BÌNH (${reprimands.length} lượt)`,
                bold: true,
                font,
                size: 22,
              }),
            ],
          }),
          ...reprimands.map(
            (r, i) =>
              new Paragraph({
                spacing: { after: 60 },
                children: [
                  new TextRun({ text: `${i + 1}. Tuần ${r.weekNumber}/${r.month}/${r.year}: `, bold: true, font, size: 20 }),
                  new TextRun({ text: `${r.content} (Khắc phục: ${r.remediationStatus})`, font, size: 20 }),
                ],
              })
          ),
          new Paragraph({
            spacing: { before: 200, after: 100 },
            children: [
              new TextRun({
                text: `III. KHEN THƯỞNG DANH HIỆU (${rewards.length} quyết định)`,
                bold: true,
                font,
                size: 22,
              }),
            ],
          }),
          ...rewards.map(
            (rw, i) =>
              new Paragraph({
                spacing: { after: 60 },
                children: [
                  new TextRun({ text: `${i + 1}. Năm ${rw.year}: `, bold: true, font, size: 20 }),
                  new TextRun({ text: `${rw.rewardType} - QĐ số ${rw.decisionNumber}`, font, size: 20 }),
                ],
              })
          ),
        ],
      },
    ],
  });

  const blob = await Packer.toBlob(doc);
  const fileName = `HO_SO_${soldier.fullName.replace(/\s+/g, '_').toUpperCase()}.docx`;
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// Backward compatible export function alias
export function exportMonthlyReportToWord(
  month: number,
  year: number,
  soldiers: Soldier[],
  commendations: Commendation[],
  reprimands: Reprimand[],
  rewards: Reward[],
  evaluation: MonthlyReportEvaluation,
  unitInfo: { unitName: string; parentUnit: string; superiorUnit: string; stationLocation: string },
  reportType: ReportType = 'MONTH',
  leaves?: LeaveRecord[]
): void {
  exportMonthlyReportToDocx({
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
  }).catch((err) => {
    console.error('Failed to export DOCX:', err);
  });
}
