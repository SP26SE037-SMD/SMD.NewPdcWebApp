# 📋 Frontend Integration Guide — Feedback Form Module

> **Base URL:** `http://<host>/api/v1/forms`  
> **Auth:** Bearer Token (JWT) — gửi trong header `Authorization: Bearer <token>`

---

## 📐 Tổng quan kiến trúc

```
Curriculum (1)
  └── GoogleFormRecord / Form (N)          ← "Form" chứa metadata
        └── FeedbackFormSection (N)         ← "Section" = trang/nhóm câu hỏi
              └── FeedbackFormQuestion (N)  ← "Question" = câu hỏi
                    └── FeedbackFormOption (N) ← "Option" = lựa chọn (nếu có)
```

**Luồng tạo form hoàn chỉnh:**
1. **Tạo Form** → 2. **Thêm Section(s)** → 3. **Thêm Question(s) vào từng Section** → 4. **Trigger Build** (tạo Google Form thật) → 5. **Xem Submissions / Report**

---

## 1️⃣ Tạo Form mới

### `POST /api/v1/forms`

**Request Body:**
```json
{
  "curriculumId": "uuid-của-curriculum",
  "formType": "MIDTERM"
}
```

| Field | Type | Bắt buộc | Mô tả |
|-------|------|----------|-------|
| `curriculumId` | UUID | ✅ | ID của curriculum cần thu thập feedback |
| `formType` | String | ✅ | Loại form (tự do đặt tên, ví dụ: `MIDTERM`, `FINAL`, `GENERAL`) |

**Response `201`:**
```json
{
  "id": "uuid-form",
  "curriculumId": "uuid-curriculum",
  "googleFormId": null,
  "formUrl": null,
  "formType": "MIDTERM",
  "isActive": false,
  "createdAt": "2026-04-10T11:00:00Z"
}
```

> ⚠️ `isActive = false` và `googleFormId = null` vì Google Form chưa được tạo. Chúng sẽ được cập nhật sau khi **Trigger Build** thành công.

---

## 2️⃣ Danh sách Forms theo Curriculum

### `GET /api/v1/forms?curriculumId={uuid}`

**Query Params:**

| Param | Bắt buộc | Mô tả |
|-------|----------|-------|
| `curriculumId` | ✅ | UUID của curriculum |

**Response `200`:** _(Array)_
```json
[
  {
    "id": "uuid-form-1",
    "curriculumId": "uuid-curriculum",
    "googleFormId": "1BxzV...",
    "formUrl": "https://docs.google.com/forms/d/...",
    "formType": "MIDTERM",
    "isActive": true,
    "createdAt": "2026-04-10T11:00:00Z"
  }
]
```

---

## 3️⃣ Chi tiết Form (có danh sách Section)

### `GET /api/v1/forms/{formId}`

**Response `200`:**
```json
{
  "id": "uuid-form",
  "googleFormId": "1BxzV...",
  "formUrl": "https://docs.google.com/forms/d/.../viewform",
  "isActive": true,
  "sections": [
    {
      "sectionId": "uuid-section-1",
      "title": "Thông tin chung",
      "orderIndex": 1,
      "afterSectionAction": "NEXT"
    },
    {
      "sectionId": "uuid-section-2",
      "title": "Đánh giá nội dung",
      "orderIndex": 2,
      "afterSectionAction": "SUBMIT"
    }
  ]
}
```

---

## 4️⃣ Full Schema Form (Section + Question + Option)

> **Dùng khi cần render toàn bộ cấu trúc form để preview hoặc build Google Form.**

### `GET /api/v1/forms/{formId}/full`

**Response `200`:**
```json
{
  "formId": "uuid-form",
  "title": "CNTT K2024 - Feedback MIDTERM",
  "description": "Phan hoi cho chuong trinh dao tao: CNTT K2024",
  "sections": [
    {
      "sectionId": "uuid-section-1",
      "title": "Thông tin chung",
      "actionAfter": "NEXT",
      "targetSectionId": null,
      "questions": [
        {
          "questionId": "uuid-q1",
          "type": "TEXT",
          "content": "Họ và tên của bạn?",
          "isRequired": true,
          "options": []
        },
        {
          "questionId": "uuid-q2",
          "type": "RADIO",
          "content": "Bạn học năm mấy?",
          "isRequired": true,
          "options": [
            { "optionId": "uuid-opt1", "text": "Năm 1", "goToSectionId": null },
            { "optionId": "uuid-opt2", "text": "Năm 2", "goToSectionId": null },
            { "optionId": "uuid-opt3", "text": "Năm 3", "goToSectionId": null }
          ]
        }
      ]
    }
  ]
}
```

---

## 5️⃣ Thêm Section vào Form

### `POST /api/v1/forms/{formId}/sections`

**Request Body:**
```json
{
  "title": "Đánh giá giảng viên",
  "afterSectionAction": "NEXT",
  "targetSectionId": null
}
```

| Field | Type | Bắt buộc | Mô tả |
|-------|------|----------|-------|
| `title` | String | ❌ | Tiêu đề section (có thể để trống) |
| `afterSectionAction` | String | ❌ | Hành động sau section (xem bảng bên dưới). Mặc định: `"NEXT"` |
| `targetSectionId` | UUID | ❌ | UUID section đích (chỉ dùng khi `afterSectionAction = "GO_TO_SECTION"`) |

### 🔀 Giá trị `afterSectionAction`

| Giá trị | Ý nghĩa |
|---------|---------|
| `NEXT` | Sang section tiếp theo (mặc định) |
| `SUBMIT` | Nộp form sau section này |
| `GO_TO_SECTION` | Nhảy đến section cụ thể (cần điền `targetSectionId`) |

**Response `201`:**
```json
{
  "sectionId": "uuid-section-mới",
  "title": "Đánh giá giảng viên",
  "orderIndex": 2,
  "afterSectionAction": "NEXT"
}
```

> 💡 `orderIndex` được tự động tăng, không cần truyền thủ công.

---

## 6️⃣ Thêm Question vào Section

### `POST /api/v1/forms/sections/{sectionId}/questions`

**Request Body:**
```json
{
  "content": "Bạn đánh giá chất lượng giảng dạy như thế nào?",
  "type": "RADIO",
  "isRequired": true,
  "options": [
    { "optionText": "Rất tốt", "nextSectionId": null },
    { "optionText": "Tốt", "nextSectionId": null },
    { "optionText": "Bình thường", "nextSectionId": null },
    { "optionText": "Kém", "nextSectionId": null }
  ]
}
```

| Field | Type | Bắt buộc | Mô tả |
|-------|------|----------|-------|
| `content` | String | ✅ | Nội dung câu hỏi |
| `type` | String | ✅ | Loại câu hỏi (xem bảng type bên dưới) |
| `isRequired` | Boolean | ❌ | Bắt buộc trả lời hay không (mặc định `false`) |
| `options` | Array | ❌ | Danh sách lựa chọn — **chỉ dùng cho RADIO, CHECKBOX, DROPDOWN** |

### 🧩 Các loại Question Type

| Type | Tên hiển thị | Có Options | Mô tả |
|------|-------------|-----------|-------|
| `TEXT` | Văn bản ngắn | ❌ | Nhập text tự do, 1 dòng |
| `PARAGRAPH` | Văn bản dài | ❌ | Nhập text nhiều dòng |
| `RADIO` | Chọn một | ✅ | Chọn 1 trong N lựa chọn (dạng radio button) |
| `CHECKBOX` | Chọn nhiều | ✅ | Chọn nhiều trong N lựa chọn |
| `DROPDOWN` | Danh sách thả | ✅ | Chọn 1 trong dropdown list |
| `SCALE` | Thang điểm | ❌ | Đánh giá dạng số (Linear scale, ví dụ 1–5) |
| `DATE` | Ngày | ❌ | Chọn ngày |
| `TIME` | Giờ | ❌ | Chọn giờ |

> **Lưu ý về `options`:**
> - Chỉ cần truyền `options` khi `type` là `RADIO`, `CHECKBOX`, hoặc `DROPDOWN`.
> - Mỗi option có thể gắn `nextSectionId` (UUID) để tạo **conditional branching** (nhảy đến section khác tùy chọn đáp án).

### Option với Conditional Branching

```json
{
  "content": "Bạn có hài lòng với môn học không?",
  "type": "RADIO",
  "isRequired": true,
  "options": [
    { "optionText": "Có", "nextSectionId": null },
    { "optionText": "Không", "nextSectionId": "uuid-section-complaint" }
  ]
}
```

**Response `201`:**
```json
{
  "questionId": "uuid-question-mới",
  "content": "Bạn đánh giá chất lượng giảng dạy như thế nào?",
  "type": "RADIO",
  "isRequired": true
}
```

---

## 7️⃣ Trigger Build — Tạo Google Form thật

> Sau khi đã tạo đủ section và question, gọi API này để kích hoạt App Script tự động tạo Google Form.

### `POST /api/v1/forms/{formId}/trigger-build`

**Không cần Request Body.**

**Response `200`:**
```json
{
  "success": true,
  "message": "App Script dang xay dung Google Form"
}
```

> ⏳ Quá trình build diễn ra **bất đồng bộ**. Sau khi App Script hoàn thành, nó sẽ callback về `/{formId}/google-form-created` và cập nhật `googleFormId`, `formUrl`, `isActive = true`.
>
> Frontend nên **polling** `GET /api/v1/forms/{formId}` mỗi vài giây và chờ `isActive = true` để lấy link form.

---

## 8️⃣ Xem danh sách Submissions

### `GET /api/v1/forms/{formId}/submissions`

**Response `200`:** _(Array)_
```json
[
  {
    "id": "uuid-submission",
    "accountId": "uuid-account",
    "curriculumId": "uuid-curriculum",
    "submittedAt": "2026-04-10T10:30:00Z",
    "answers": [
      {
        "id": "uuid-answer",
        "questionId": "uuid-q1",
        "questionText": "Họ và tên của bạn?",
        "selectedOptionId": null,
        "selectedOptionText": null,
        "answerText": "Nguyễn Văn A"
      },
      {
        "id": "uuid-answer-2",
        "questionId": "uuid-q2",
        "questionText": "Bạn đánh giá chất lượng giảng dạy?",
        "selectedOptionId": "uuid-opt1",
        "selectedOptionText": "Rất tốt",
        "answerText": null
      }
    ]
  }
]
```

---

## 9️⃣ Báo cáo tổng hợp Feedback

### `GET /api/v1/forms/{formId}/report`

**Response `200`:**
```json
{
  "formId": "uuid-form",
  "totalSubmissions": 42,
  "questions": [
    {
      "questionId": "uuid-q2",
      "questionText": "Bạn đánh giá chất lượng giảng dạy?",
      "type": "RADIO",
      "optionCounts": {
        "Rất tốt": 20,
        "Tốt": 15,
        "Bình thường": 5,
        "Kém": 2
      },
      "textAnswers": [],
      "averageRating": null
    },
    {
      "questionId": "uuid-q3",
      "questionText": "Điểm bạn chấm cho môn học (1-5)?",
      "type": "SCALE",
      "optionCounts": {},
      "textAnswers": ["4", "5", "3", "4"],
      "averageRating": 4.0
    }
  ]
}
```

| Field | Mô tả |
|-------|-------|
| `optionCounts` | Map đếm số lần chọn mỗi option — hiển thị dạng **biểu đồ cột/bánh** |
| `textAnswers` | Danh sách câu trả lời text — hiển thị dạng **danh sách** hoặc **word cloud** |
| `averageRating` | Điểm trung bình (chỉ có khi type = `SCALE` và có giá trị số) |

---

## 🗺️ Tóm tắt tất cả Endpoints

| Method | Endpoint | Mô tả |
|--------|----------|-------|
| `POST` | `/api/v1/forms` | Tạo form mới |
| `GET` | `/api/v1/forms?curriculumId={}` | Danh sách forms theo curriculum |
| `GET` | `/api/v1/forms/{formId}` | Chi tiết form + danh sách section |
| `GET` | `/api/v1/forms/{formId}/full` | Full schema (section + question + option) |
| `POST` | `/api/v1/forms/{formId}/sections` | Thêm section vào form |
| `POST` | `/api/v1/forms/sections/{sectionId}/questions` | Thêm question vào section |
| `POST` | `/api/v1/forms/{formId}/trigger-build` | Kích hoạt tạo Google Form |
| `GET` | `/api/v1/forms/{formId}/submissions` | Danh sách submissions |
| `GET` | `/api/v1/forms/{formId}/report` | Báo cáo tổng hợp |

> **Các endpoint sau là internal (dành cho App Script/Webhook), frontend KHÔNG gọi trực tiếp:**
> - `GET /api/v1/forms/{formId}/schema` — App Script lấy schema để build form
> - `POST /api/v1/forms/{formId}/google-form-created` — Callback sau khi Google Form được tạo
> - `POST /api/v1/forms/webhook/submit` — Webhook nhận dữ liệu submit từ Google Form

---

## 💡 Gợi ý UI/UX

### Trang quản lý Form (Form List Page)
- Hiển thị danh sách form theo curriculum đang chọn.
- Badge `Active` / `Draft` dựa trên `isActive`.
- Nút **"Xem Form"** → mở `formUrl` trong tab mới (khi `isActive = true`).
- Nút **"Tạo Form mới"** → mở modal `formType`.

### Trang thiết kế Form (Form Builder Page)
- Layout 2 cột: **Danh sách Section** (trái) | **Editor câu hỏi** (phải).
- Kéo thả để sắp xếp section (dùng `orderIndex` làm reference).
- Khi chọn section → hiển thị danh sách question của section đó.
- Nút **"+ Thêm Section"** → gọi `POST /sections`.
- Nút **"+ Thêm Câu hỏi"** → mở drawer/modal với dropdown chọn `type`.
- Chỉ hiển thị ô nhập **Options** khi `type = RADIO | CHECKBOX | DROPDOWN`.
- Nút **"🚀 Publish"** → gọi `trigger-build`, sau đó polling `isActive`.

### Trang xem báo cáo (Report Page)
- Hiển thị `totalSubmissions` ở đầu trang.
- Mỗi câu hỏi hiển thị theo loại:
  - `RADIO / DROPDOWN` → **Biểu đồ bánh (Pie Chart)** hoặc **cột (Bar Chart)** từ `optionCounts`.
  - `CHECKBOX` → **Bar Chart** từ `optionCounts`.
  - `SCALE` → **Average Score** + thanh tiến trình.
  - `TEXT / PARAGRAPH` → **Danh sách câu trả lời** (expandable).

---

## ⚠️ Lưu ý quan trọng

1. **`formType`** là chuỗi tự do — nên cho người dùng chọn từ danh sách gợi ý như `MIDTERM`, `FINAL`, `GENERAL`, `WEEKLY`.
2. **`afterSectionAction`** cần được validate: nếu chọn `GO_TO_SECTION` phải kèm `targetSectionId`.
3. **Option `nextSectionId`** chỉ có ý nghĩa với RADIO/DROPDOWN (chọn 1 đáp án điều hướng). CHECKBOX không hỗ trợ branching.
4. Sau `trigger-build`, cần **polling** để detect khi `isActive` đổi thành `true`.
5. Submissions được liên kết với **curriculum** chứ không chỉ form — nên report sẽ tổng hợp tất cả submissions cùng curriculum.
