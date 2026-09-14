# DnD2024

Character Sheet tiếng Việt cho D&D 2024: website tĩnh, không tài khoản người chơi, không backend, lưu trên trình duyệt.

Website: https://trangduythong1994.github.io/DnD2024/

## Sử dụng

1. Nhập tên, level, chọn Class / Subclass / Species / Background / Origin Feat.
2. Nhập **ability scores cuối cùng**: đã gồm bonus background, feat và mọi thay đổi. Không có bonus nguồn nào tự cộng.
3. Các tab trái và phải độc lập. Bấm tên/chỉ số để mở tham chiếu; bấm Thêm/Sửa để thay đổi mục. Popup tìm theo tên, xem trước và hỗ trợ custom.
4. Gán proficiency/expertise, nhập combat, inventory, spell slots và prepared spells. Không tự tiêu hao slot khi thêm phép.
5. Tự lưu mỗi lần nhập hợp lệ. Xuất JSON thường xuyên để sao lưu/chuyển máy. Nhập file hoặc dán JSON sẽ được kiểm tra và yêu cầu xác nhận thay thế.

Escape đóng popup; bản nháp editor được giữ để khôi phục lần mở cùng loại mục tiếp theo. Escape đóng panel tham chiếu. Dùng phím mũi tên/Home/End trong mỗi tablist. Không có đồng bộ đám mây; xóa dữ liệu trình duyệt có thể xóa nhân vật.

## Tự động và thủ công

Tự tính ability modifier, PB theo tổng level 1–20, skill/save bonus (expertise chỉ cho skills), Initiative = DEX modifier + bổ sung, passive Perception, spell attack/DC, tổng trọng lượng vật phẩm. Các ô bổ sung chấp nhận bonus/penalty.

Nhập thủ công AC, HP, Hit Dice, death saves, Heroic Inspiration, rest, conditions, lợi ích class/species/background/feat, tool proficiencies (Origin notes), languages, spell slots, prepared limit và nguồn phép phụ/Pact Magic. Không có character builder hoặc multiclass automation. Trang bị/attunement không tự tăng AC hay chỉ số. Trọng lượng không tính tiền hoặc hiệu ứng đặc biệt.

Đổi lựa chọn chỉ thay mục tham chiếu, hiển thị nhắc rà soát. Không tự cấp hoặc gỡ benefits, không giữ lợi ích ẩn. Người chơi chịu trách nhiệm sửa những giá trị thủ công từng áp dụng. Origin Feat chính ở phần thông tin; các feat bổ sung (ví dụ Human) ở Đặc tính.

Heroic Inspiration 2024: tiêu hao để roll lại một die bất kỳ ngay sau khi roll, phải dùng kết quả mới; tối đa một. Human nhận sau Long Rest. Công cụ chỉ đánh dấu thủ công.

## Phạm vi thư viện

Tập con **SRD 5.2.1**, đối chiếu bản chính thức tại https://www.dndbeyond.com/srd:

- 12 class + 12 subclass: tên và liên kết trang nguồn; không nhập toàn bộ feature tables.
- Species: Human.
- Backgrounds: Acolyte, Criminal, Sage, Soldier.
- Origin Feats: Alert, Magic Initiate, Savage Attacker, Skilled; General Feat: Ability Score Improvement.
- Feature: Potent Cantrip; trait: Resourceful.
- Vật phẩm: Dagger, Club (có Mastery 2024).
- Phép: Fire Bolt, Cure Wounds (Abjuration, hồi 2d8 ở cấp 1 theo 2024).

Không phải thư viện đầy đủ. Bản tiếng Việt được tóm tắt; mở nguồn tiếng Anh để đọc luật đầy đủ. Mọi nhóm đều hỗ trợ custom.

## Chạy local và sửa code

Cần Node.js hiện đại (20+). Không cần cài dependencies:

```sh
npm start
# Mở http://127.0.0.1:4173/DnD2024/
npm test
```

- `index.html`: khung trang và dialogs.
- `styles.css`: màu, typography, desktop/mobile.
- `app.js`: UI, popup, tham chiếu, lưu/nhập/xuất.
- `model.js`: schema version 1, validation, công thức.
- `rules.js`: thư viện dữ liệu, nguồn và attribution, không có UI.
- `tests/model.test.mjs`: kiểm thử công thức và JSON.

Không mở HTML qua `file://` vì JavaScript modules cần HTTP. Asset dùng đường dẫn tương đối để chạy dưới `/DnD2024/`.

## GitHub Pages

Repository dùng Pages “Deploy from a branch”, nhánh `main`, thư mục `/ (root)`. Mỗi push lên main tự chạy Pages build/deployment. `.nojekyll` giữ nguyên các static assets. Không có secrets trong source và không cần build front-end.

## Dữ liệu và an toàn

`localStorage` key `dnd2024.character.v1`; editor draft có key riêng. JSON cần schema version 1 và các trường đầy đủ. Nhập lỗi không thay trạng thái hiện tại; bản lưu bị lỗi được giữ nguyên cho tới khi người dùng chủ động tạo mới/nhập bản hợp lệ. File giới hạn 5 MB. Schema whitelist loại trường lạ; nội dung người dùng dùng text nodes, không thực thi HTML. Nguồn custom hiển thị như văn bản.

## Attribution

This work includes material from the System Reference Document 5.2.1 (“SRD 5.2.1”) by Wizards of the Coast LLC, available at https://www.dndbeyond.com/srd. The SRD 5.2.1 is licensed under the Creative Commons Attribution 4.0 International License, available at https://creativecommons.org/licenses/by/4.0/legalcode.

Descriptions in Vietnamese are abridged adaptations. This is an independent character-sheet tool.
