# Phân tích & Hợp nhất Quy trình (Curriculum Workflow Analysis)

Chào bạn, dựa trên những thông tin bạn cung cấp, mình đã phân tích cấu trúc của **Luồng Cũ (Manual)** và **Luồng Mới (Automation)**. Sự xung đột lớn nhất ở đây nằm ở **Điểm bắt đầu** và **Cách tạo dữ liệu**.

Dưới đây là bảng phân tích và đề xuất hướng đi để "lai tạo" (hybrid) hai luồng này, nhằm tận dụng tối đa UI cũ và API Task, đồng thời tích hợp sức mạnh của luồng mới (Extract PDF & Import Excel).

---

## 1. Phân tích Xung đột cốt lõi

| Đặc điểm | Luồng Cũ (Đang có UI) | Luồng Mới (Đang hướng tới) | Xung đột / Vấn đề cần giải quyết |
| :--- | :--- | :--- | :--- |
| **Khởi tạo Major** | VP tự gõ tay tạo Major (DRAFT) -> Giao Task. | Backend tự động bóc tách từ PDF để tạo Major. | Điểm giao việc dời từ "Sau khi có Major" sang "Khi mới chỉ có File PDF (Document)". |
| **Tạo Curriculum** | HoCFDC nhập tay từng PO, PLO, Mapping qua các Tabs. | HoCFDC ném 1 file Excel lên, hệ thống tự Validate và Import toàn bộ. | Các Tab UI cũ (PO, PLO, Mapping) trở nên thừa thãi cho việc "Tạo mới", nhưng lại cần thiết để "Xem lại/Sửa lỗi". |

---

## 2. Đề xuất Hướng đi (Unified Workflow)

Để giữ lại kiến trúc Task cũ (`/api/tasks/byVP`) và tiến tới giai đoạn giao việc cho HoPDC một cách trơn tru, mình đề xuất một luồng đi mới gồm **4 Bước (Phases)** như sau:

### Phase 1: VP khởi tạo & Giao việc (Tận dụng UI Document vừa làm)
1. **Upload:** VP upload file Đề án (PDF) tại tab *Pending Processing* (Hoàn tất). `Document` được tạo với `majorId = null`.
2. **Assign Task:** Tại mỗi dòng Document Pending, ta thêm nút **"Assign to HoCFDC"**.
3. **Logic:** Khi bấm nút này, UI sẽ gọi `/api/tasks/byVP` để tạo một Task mới cho HoCFDC. Task này sẽ đính kèm `documentId` (Thay vì đính kèm `majorId` như luồng cũ).
4. *Lúc này: VP xong việc, bóng được chuyền sang sân HoCFDC.*

### Phase 2: HoCFDC Xử lý Đề án & Tinh chỉnh Regulation (Tạo Major)
1. HoCFDC vào `/dashboard/hocfdc/tasks` (Giao diện cũ).
2. Nhìn thấy Task mới. Bấm **"Start Task"**.
3. **UI Mới cần làm:** Thay vì nhảy vào `/tasks/[taskId]?majorId=...` như cũ, hệ thống sẽ điều hướng sang `/tasks/[taskId]?documentId=...`.
4. Tại UI này, HoCFDC xem được file PDF. Sẽ có 1 nút **"Extract Major & Regulations"**.
5. Bấm nút -> Gọi API Backend (AI) bóc tách PDF -> Trả về thông tin (Code, Name, Regulations).
6. **Bước Kiểm duyệt (Human-in-the-loop):** HoCFDC xem xét lại toàn bộ các Regulation do AI bóc tách. HoCFDC có toàn quyền **chỉnh sửa, thêm, xóa** để đảm bảo bộ quy chế (Regulations) chuẩn xác 100% so với bản gốc PDF.
7. HoCFDC bấm **"Confirm & Create Major"**. Backend tạo Major cùng bộ Regulations đã được soát xét, cập nhật `majorId` vào bảng Document.
8. *Lúc này: Major đã ra đời. Task tự động chuyển sang Phase 3.*

### Phase 3: HoCFDC Import Curriculum (Thay thế các Tab nhập tay cũ)
1. Khi đã có `MajorId`, giao diện của HoCFDC chuyển sang màn hình **Curriculum Builder** (Giống luồng cũ nhưng thay đổi ruột).
2. Thay vì hiện các Tab nhập tay (PO, PLO...), ta hiển thị một giao diện **"Import Curriculum từ Excel"**.
3. HoCFDC tải file `Full_Curriculum.xlsx` lên.
4. **Validation UI:** Giao diện hiển thị bảng kết quả Validate (Lỗi mềm/Lỗi cứng) dựa trên JSON Backend trả về.
   - Nếu lỗi: Hiện rõ dòng nào sai, quy định nào vi phạm. HoCFDC sửa file Excel và up lại.
   - Nếu xanh hết (Pass): Bấm **"Execute Import"**.
5. *Lúc này: Curriculum (DRAFT) ra đời cùng toàn bộ Mapping, Subjects.*

### Phase 4: Review nội bộ & Tự động Chuyển giao (Bypass VP Approval)
1. Khi Import thành công, do nội dung Excel đã vượt qua được toàn bộ "Hard Validation" của các Regulations ở Phase 2 (Đã được VP duyệt ngầm qua PDF bản cứng), Curriculum này coi như **đạt chuẩn tuyệt đối**.
2. HoCFDC có thể dùng lại các Tab UI cũ (PO, PLO, Mapping) nhưng ở chế độ **Read-only** để dò lại lần cuối (nếu cần).
3. HoCFDC **KHÔNG CẦN** gửi yêu cầu `STRUCTURE_REVIEW` lên VP nữa.
4. Từ trạng thái `DRAFT`, HoCFDC đổi thẳng status Curriculum sang `SYLLABUS_DEVELOP`.
5. Bắt đầu chia Task cho các HoPDC để biên soạn đề cương chi tiết môn học (Syllabus).
6. *Lúc này: Luồng mới và luồng cũ đã chính thức hội tụ với tốc độ tối ưu nhất!*

---

## 3. Các hạng mục UI/UX cần làm (Nếu bạn đồng ý)

> [!IMPORTANT]
> Dựa trên đề xuất trên, dưới đây là những phần việc Frontend chúng ta cần làm tiếp theo:
> 
> 1. **Màn hình VP:** Thêm logic/nút "Assign Task" ở Tab Pending để gọi `/api/tasks/byVP`.
> 2. **Màn hình HoCFDC Task:** Xây dựng màn hình `Task Detail` mới cho việc "Đọc PDF -> Xác nhận tạo Major".
> 3. **Màn hình HoCFDC Import:** Xây dựng UI Upload Excel & Bảng hiển thị lỗi Validation.

Bạn xem qua phân tích này xem đã "gãi đúng chỗ ngứa" và khớp với ý đồ kiến trúc của bạn chưa nhé. Nếu có chỗ nào chưa chuẩn với logic Backend, bạn cứ phản hồi để mình điều chỉnh, trước khi chúng ta bắt tay vào code!
