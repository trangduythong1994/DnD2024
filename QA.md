# Kiểm tra bản 1.0

Ngày kiểm tra: 2026-09-14.

- 8 bài kiểm thử tự động trong `tests/model.test.mjs`: modifier âm/lẻ, mốc PB, proficiency/expertise và bonus bổ sung, spell attack/DC, JSON round-trip, JSON lỗi/phiên bản sai, schema/range/ID trùng, chuỗi HTML và loại trường lạ. Tất cả đạt.
- Trình duyệt: tab trái/phải độc lập; chọn tab bằng ArrowRight; Escape đóng popup; focus và label của input.
- Popup: tìm Dagger, xem trước rồi thêm, xem tham chiếu, đổi tên thành Dagger bạc, tạo custom, lưu và khôi phục bản nháp bằng Escape, hủy/xác nhận xóa.
- Chuỗi `<img src=x onerror=alert(1)>` hiển thị nguyên văn trong tham chiếu, không tạo HTML.
- Đổi background Sage → Criminal hiển thị nhắc rà soát; không thay ability scores.
- Spellcasting: thêm Cure Wounds, đánh dấu prepared, đổi số slot và dùng 1 slot. Trạng thái nút cập nhật ngay khi nhập.
- Công thức UI: level 5, DEX 16, Acrobatics expertise + bổ sung 1 = +10. INT 18, level 5: spell attack +7, DC 15.
- Tên và vật phẩm khôi phục sau reload. JSON sai báo lỗi; JSON hợp lệ có xác nhận thay thế và cho phép hủy.
- Xuất JSON tạo file thực tế trong Downloads, đã đọc kiểm tra version/level. Kiểm thử nhập qua textarea đạt. Kiểm thử file picker bị trình duyệt từ chối quyền chọn file, chưa xác minh trọn luồng này trong phiên tự động.
- Responsive 390 × 844: hai panel xếp một cột, chiều rộng nội dung không vượt viewport. Desktop: hai panel song song. Không có lỗi console JavaScript trong phiên kiểm tra.

Tham khảo `README.md` về cơ chế nhập thủ công và phạm vi thư viện. Đây không phải trình tạo nhân vật tự động hoàn chỉnh.
