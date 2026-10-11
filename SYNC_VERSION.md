# THÔNG TIN PHIÊN BẢN ĐỒNG BỘ GITHUB (SYNC VERSION)

- **Dự án**: Quản lý quân số Đồn Biên phòng Hòn Sơn
- **Repository**: `tathanhtong/quanlyquansohonson`
- **Nhánh**: `main`
- **Phiên bản đồng bộ**: `v1.3.0` (Build 2026-10-11)
- **Cấu hình Base URL**: `/quanlyquansohonson/` (Chuẩn GitHub Pages)

---

## 1. PHẠM VI RÀ SOÁT & KIỂM THỬ MÃ NGUỒN

Toàn bộ hệ thống mã nguồn trong Google AI Studio đã được rà soát, kiểm thử cú pháp, kiểu dữ liệu TypeScript và xác nhận hoàn thiện 100% trước khi đồng bộ:

### A. Giao diện & Nhận diện
- **Logo chính thức**: Sử dụng `src/assets/logobp.svg` và `public/logobp.svg` qua component `BorderGuardBadge.tsx`, hiển thị chuẩn xác tại Header và Màn hình Đăng nhập.
- **Favicon trình duyệt**: File `public/favicon.svg` được sao chép nguyên bản từ `logobp.svg`, tích hợp vào `index.html` qua thẻ `<link rel="icon" type="image/svg+xml" href="%BASE_URL%favicon.svg" />`.
- **Responsive**: Tối ưu hiển thị đa thiết bị (máy tính để bàn, máy tính bảng và các độ phân giải điện thoại thông dụng).

### B. Nghiệp vụ & Dữ liệu
- **Đăng nhập & Phân quyền**: Google Authentication kết hợp phân quyền 3 cấp (Admin, Editor, Viewer) trên Firebase Firestore (`/users` và `/firestore.rules`).
- **Quản lý quân số**: Bảng danh sách cán bộ, chiến sĩ, hồ sơ quân nhân, bộ lọc theo Đội/Trạm, thêm/sửa/xóa và nhập khẩu từ Excel.
- **Biểu dương & Phê bình**: Theo dõi thi đua theo tuần, tháng, năm với đầy đủ tiêu chí, lý do và kế hoạch khắc phục.
- **Khen thưởng**: Quản lý danh hiệu thi đua, quyết định khen thưởng theo cấp và niên hạn.
- **Đi phép & Tranh thủ**: Theo dõi quân số vắng mặt SSCĐ, ngày đi, ngày về, lý do, cấp phê duyệt và xác nhận về đơn vị.
- **Quản lý Ban Chỉ huy đơn vị**: Khu vực cấu hình trong tab *Sao lưu & Cài đặt*, cho phép Admin tự do thêm/sửa/xóa/đổi thứ tự Ban Chỉ huy và lưu lên Firestore (`settings/commanders`), tự động liên kết vào trường phê duyệt của *Đi phép / Tranh thủ* và *Báo cáo*.
- **Thống kê & Báo cáo**: Biểu đồ trực quan, mẫu báo cáo hành chính Quân đội theo chuẩn khổ A4, xuất Word (.docx), Excel (.xlsx) và in PDF.
- **Lịch sử hoạt động & Sao lưu**: Ghi nhật ký thao tác (Audit Logs), xuất sao lưu JSON toàn hệ thống và khôi phục khi cần thiết.

---

## 2. KẾT QUẢ KIỂM THỬ KỸ THUẬT

- **TypeScript Typecheck (`tsc --noEmit`)**: 0 lỗi (Passed).
- **Vite Build (`vite build`)**: Thành công, toàn bộ bundle JS/CSS và assets được đóng gói hoàn chỉnh trong thư mục `dist/`.
- **Bun Build (`bun run build`)**: Thành công, tương thích hoàn toàn với workflow `.github/workflows/main.yml` trên GitHub Actions.
- **Đường dẫn tài nguyên**: Tiền tố `/quanlyquansohonson/` được nhúng chính xác vào các thẻ script, style, logo và favicon.

---

*Tài liệu này được tạo tự động để ghi nhận trạng thái đồng bộ và sẵn sàng cho thao tác GitHub Sync.*
