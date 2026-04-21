# 📘 SMD Backend – API Documentation for Frontend Team

> **Phiên bản:** 1.0 | **Cập nhật:** 2026-04-19
> **Dành cho:** Team Frontend (Next.js / React)
> **Tác giả:** Technical Writer & Senior Backend Developer (AI-generated from source code)

---

## 📌 Quy định chung

### Base URL
```
http://43.207.156.116
```

### Authentication
Tất cả các API (trừ khi nêu rõ ngoại lệ) đều yêu cầu JWT token trong header:
```
Authorization: Bearer <your_jwt_token>
```

### Cấu trúc Response chuẩn
Mọi API đều trả về wrapper `ResponseObject<T>`:
```json
{
  "status": 1000,
  "message": "Mô tả kết quả",
  "data": { }
}
```

### Cấu trúc Paginated Response
Khi API trả danh sách có phân trang, trường `data` sẽ là `PagedResponse<T>`:
```json
{
  "content": [ { } ],
  "page": 0,
  "size": 10,
  "totalElements": 100,
  "totalPages": 10
}
```

### ⚠️ Quan trọng về UUID
> **Tất cả các trường `id` trong hệ thống này đều là kiểu `String` (định dạng UUID).**
> Ví dụ: `"curriculumId": "550e8400-e29b-41d4-a716-446655440000"`
> **Tuyệt đối KHÔNG** ép kiểu sang `Number` / `Integer` trên Frontend.

---

## 📋 Mục lục

- [1. Major Management](#1-major-management-apimajors)
- [2. Curriculum Management](#2-curriculum-management-apicurriculums)
- [3. Task Management](#3-task-management-apitasks)
- [4. Request Management](#4-request-management-apirequests)
- [5. Mã lỗi & Xử lý lỗi](#5-mã-lỗi--xử-lý-lỗi)

---

---

# 1. Major Management (`/api/majors`)

---

## 1.1. Lấy danh sách Major

**`GET /api/majors`**

**Mô tả:** Lấy danh sách tất cả chuyên ngành có phân trang, hỗ trợ tìm kiếm theo tên/mã, lọc theo trạng thái, và lọc các major được cập nhật trong 24 giờ qua.

**Request Headers:**
| Header | Giá trị |
| :--- | :--- |
| `Authorization` | `Bearer <token>` |

**Query Parameters:**
| Tham số | Kiểu | Bắt buộc | Mặc định | Mô tả |
| :--- | :--- | :--- | :--- | :--- |
| `search` | String | Không | — | Từ khóa tìm kiếm theo mã hoặc tên |
| `searchBy` | String | Không | `all` | Lọc theo: `code`, `name`, `all` |
| `status` | String | Không | — | `DRAFT`, `INTERNAL_REVIEW`, `PUBLISHED`, `ARCHIVED` |
| `updatedYesterday` | Boolean | Không | `false` | `true` → Chỉ lấy các major cập nhật trong 24h qua |
| `page` | Integer | Không | `0` | Số trang (0-indexed) |
| `size` | Integer | Không | `10` | Số bản ghi mỗi trang |
| `sort` | String[] | Không | `majorCode,asc` | Định dạng: `field,asc\|desc`. Vd: `majorName,desc` |

**Response (200 OK):**
```json
{
  "status": 1000,
  "message": "Get all majors successfully",
  "data": {
    "content": [
      {
        "majorId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
        "majorCode": "SE",
        "majorName": "Software Engineering",
        "description": "Chuyên ngành Kỹ thuật phần mềm",
        "status": "PUBLISHED",
        "createdAt": "2024-01-15 08:00:00",
        "updatedAt": "2024-06-20 14:30:00"
      }
    ],
    "page": 0,
    "size": 10,
    "totalElements": 5,
    "totalPages": 1
  }
}
```

**Mã lỗi có thể xảy ra:**
| HTTP | Custom Code | Mô tả |
| :--- | :--- | :--- |
| 401 | 1001 | Token không hợp lệ hoặc hết hạn |
| 500 | 9999 | Lỗi hệ thống không xác định |

**Code Example (TypeScript/Axios):**
```typescript
import axios from 'axios';

interface MajorListParams {
  search?: string;
  searchBy?: 'code' | 'name' | 'all';
  status?: 'DRAFT' | 'INTERNAL_REVIEW' | 'PUBLISHED' | 'ARCHIVED';
  updatedYesterday?: boolean;
  page?: number;
  size?: number;
  sort?: string;
}

const getMajors = async (params: MajorListParams = {}, token: string) => {
  const { data } = await axios.get('/api/majors', {
    headers: { Authorization: `Bearer ${token}` },
    params: {
      page: 0,
      size: 10,
      sort: 'majorCode,asc',
      ...params,
    },
  });
  return data; // { status, message, data: PagedResponse<MajorResponse> }
};
```

---

## 1.2. Tạo mới Major

**`POST /api/majors`**

**Mô tả:** Tạo một chuyên ngành mới. Yêu cầu quyền `MAJOR_CREATE`.

**Request Headers:**
| Header | Giá trị |
| :--- | :--- |
| `Authorization` | `Bearer <token>` |
| `Content-Type` | `application/json` |

**Request Body:**
```json
{
  "majorCode": "AI",
  "majorName": "Artificial Intelligence",
  "description": "Chuyên ngành Trí tuệ nhân tạo"
}
```

| Trường | Kiểu | Bắt buộc | Ràng buộc | Mô tả |
| :--- | :--- | :--- | :--- | :--- |
| `majorCode` | String | **Có** | Tối đa 20 ký tự, phải duy nhất | Mã chuyên ngành |
| `majorName` | String | **Có** | Tối đa 100 ký tự | Tên chuyên ngành |
| `description` | String | Không | — | Mô tả ngắn |

**Response (200 OK):**
```json
{
  "status": 1000,
  "message": "Major created successfully",
  "data": {
    "majorId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "majorCode": "AI",
    "majorName": "Artificial Intelligence",
    "description": "Chuyên ngành Trí tuệ nhân tạo",
    "status": "DRAFT",
    "createdAt": "2024-07-01 09:00:00",
    "updatedAt": "2024-07-01 09:00:00"
  }
}
```

**Mã lỗi có thể xảy ra:**
| HTTP | Custom Code | Mô tả |
| :--- | :--- | :--- |
| 400 | 5002 | Mã major đã tồn tại trong hệ thống |
| 400 | 5003 | Thiếu trường `majorCode` |
| 400 | 5004 | Thiếu trường `majorName` |
| 400 | 5005 | `majorCode` vượt quá 20 ký tự |
| 403 | 1002 | Không có quyền `MAJOR_CREATE` |
| 500 | 9999 | Lỗi hệ thống không xác định |

**Code Example:**
```typescript
const createMajor = async (payload: { majorCode: string; majorName: string; description?: string }, token: string) => {
  const { data } = await axios.post('/api/majors', payload, {
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });
  return data;
};
```

---

## 1.3. Lấy chi tiết Major theo ID

**`GET /api/majors/{id}`**

**Mô tả:** Lấy thông tin đầy đủ của một chuyên ngành theo UUID của nó.

**Path Variables:**
| Tham số | Kiểu | Bắt buộc | Mô tả |
| :--- | :--- | :--- | :--- |
| `id` | **String (UUID)** | **Có** | UUID của Major. ⚠️ Không phải Integer! |

**Response (200 OK):**
```json
{
  "status": 1000,
  "message": "Major details retrieved successfully",
  "data": {
    "majorId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "majorCode": "SE",
    "majorName": "Software Engineering",
    "description": "Mô tả...",
    "status": "PUBLISHED",
    "createdAt": "2024-01-15 08:00:00",
    "updatedAt": "2024-06-20 14:30:00"
  }
}
```

**Mã lỗi:**
| HTTP | Custom Code | Mô tả |
| :--- | :--- | :--- |
| 404 | 5001 | Không tìm thấy Major với ID này |
| 401 | 1001 | Chưa xác thực |

**Code Example:**
```typescript
const getMajorById = async (majorId: string, token: string) => {
  const { data } = await axios.get(`/api/majors/${majorId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return data;
};
```

---

## 1.4. Lấy chi tiết Major theo Mã Code

**`GET /api/majors/code/{majorCode}`**

**Mô tả:** Lấy thông tin chuyên ngành qua mã code độc nhất (ví dụ: `SE`, `AI`, `CS`). Tiện lợi hơn khi biết mã code thay vì UUID.

**Path Variables:**
| Tham số | Kiểu | Bắt buộc | Mô tả |
| :--- | :--- | :--- | :--- |
| `majorCode` | String | **Có** | Mã code chuyên ngành (không phải UUID) |

**Response (200 OK):**
```json
{
  "status": 1000,
  "message": "Get major details successfully",
  "data": {
    "majorId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "majorCode": "SE",
    "majorName": "Software Engineering",
    "description": "Mô tả...",
    "status": "PUBLISHED",
    "createdAt": "2024-01-15 08:00:00",
    "updatedAt": "2024-06-20 14:30:00"
  }
}
```

**Mã lỗi:**
| HTTP | Custom Code | Mô tả |
| :--- | :--- | :--- |
| 404 | 5001 | Không tìm thấy Major với mã code này |

**Code Example:**
```typescript
const getMajorByCode = async (majorCode: string, token: string) => {
  const { data } = await axios.get(`/api/majors/code/${majorCode}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return data;
};
```

---

## 1.5. Cập nhật thông tin Major

**`PUT /api/majors/{id}`**

**Mô tả:** Cập nhật tên, mô tả của một Major. Yêu cầu quyền `MAJOR_UPDATE`. Lưu ý: chỉ có thể sửa khi Major ở trạng thái `DRAFT`.

**Path Variables:**
| Tham số | Kiểu | Bắt buộc | Mô tả |
| :--- | :--- | :--- | :--- |
| `id` | **String (UUID)** | **Có** | UUID của Major cần cập nhật |

**Request Body:** *(Tương tự API Tạo mới)*
```json
{
  "majorCode": "SE",
  "majorName": "Software Engineering (Updated)",
  "description": "Mô tả đã cập nhật"
}
```

**Response (200 OK):**
```json
{
  "status": 1000,
  "message": "Major updated successfully",
  "data": {
    "majorId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "majorCode": "SE",
    "majorName": "Software Engineering (Updated)",
    "description": "Mô tả đã cập nhật",
    "status": "DRAFT",
    "createdAt": "2024-01-15 08:00:00",
    "updatedAt": "2024-07-01 10:30:00"
  }
}
```

**Mã lỗi:**
| HTTP | Custom Code | Mô tả |
| :--- | :--- | :--- |
| 400 | 5007 | Major không ở trạng thái DRAFT, không thể chỉnh sửa |
| 404 | 5001 | Không tìm thấy Major |
| 403 | 1002 | Không có quyền `MAJOR_UPDATE` |

**Code Example:**
```typescript
const updateMajor = async (majorId: string, payload: { majorCode: string; majorName: string; description?: string }, token: string) => {
  const { data } = await axios.put(`/api/majors/${majorId}`, payload, {
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
  });
  return data;
};
```

---

## 1.6. Cập nhật trạng thái Major (Lifecycle)

**`PATCH /api/majors/{id}/status`**

**Mô tả:** Chuyển đổi trạng thái vòng đời của Major. Yêu cầu quyền `MAJOR_UPDATE_STATUS`.

**Vòng đời Major:**
| Trạng thái | Ý nghĩa |
| :--- | :--- |
| `DRAFT` | Đang soạn thảo, ẩn với public |
| `INTERNAL_REVIEW` | Đang chờ Hội đồng học thuật kiểm duyệt |
| `PUBLISHED` | Đã công bố, đang tuyển sinh |
| `ARCHIVED` | Đã lưu trữ, không còn tuyển sinh mới |

**Path Variables:**
| Tham số | Kiểu | Bắt buộc | Mô tả |
| :--- | :--- | :--- | :--- |
| `id` | String (UUID) | **Có** | UUID của Major |

**Query Parameters:**
| Tham số | Kiểu | Bắt buộc | Mô tả |
| :--- | :--- | :--- | :--- |
| `newStatus` | String | **Có** | Trạng thái mới: `DRAFT`, `INTERNAL_REVIEW`, `PUBLISHED`, `ARCHIVED` |

**Response (200 OK):**
```json
{
  "status": 1000,
  "message": "Cập nhật trạng thái Major thành công",
  "data": {
    "majorId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "majorCode": "SE",
    "majorName": "Software Engineering",
    "status": "PUBLISHED",
    "updatedAt": "2024-07-01 11:00:00"
  }
}
```

**Mã lỗi:**
| HTTP | Custom Code | Mô tả |
| :--- | :--- | :--- |
| 400 | 5006 | Trạng thái chuyển đổi không hợp lệ |
| 404 | 5001 | Không tìm thấy Major |
| 403 | 1002 | Không có quyền `MAJOR_UPDATE_STATUS` |

**Code Example:**
```typescript
const updateMajorStatus = async (majorId: string, newStatus: string, token: string) => {
  const { data } = await axios.patch(`/api/majors/${majorId}/status`, null, {
    headers: { Authorization: `Bearer ${token}` },
    params: { newStatus },
  });
  return data;
};
```

---

## 1.7. Xóa Major (Soft Delete)

**`DELETE /api/majors/{id}`**

**Mô tả:** Xóa mềm Major – dữ liệu vẫn tồn tại trong DB nhưng sẽ không hiển thị trong danh sách. Yêu cầu quyền `MAJOR_DELETE`.

**Path Variables:**
| Tham số | Kiểu | Bắt buộc | Mô tả |
| :--- | :--- | :--- | :--- |
| `id` | **String (UUID)** | **Có** | UUID của Major cần xóa |

**Response (200 OK):**
```json
{
  "status": 1000,
  "message": "Major deleted successfully"
}
```
> 💡 Lưu ý: Trường `data` sẽ là `null` hoặc không xuất hiện trong response của API xóa.

**Mã lỗi:**
| HTTP | Custom Code | Mô tả |
| :--- | :--- | :--- |
| 404 | 5001 | Không tìm thấy Major |
| 403 | 1002 | Không có quyền `MAJOR_DELETE` |

**Code Example:**
```typescript
const deleteMajor = async (majorId: string, token: string) => {
  const { data } = await axios.delete(`/api/majors/${majorId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return data;
};
```

---

---

# 2. Curriculum Management (`/api/curriculums`)

---

## 2.1. Lấy danh sách Curriculum

**`GET /api/curriculums`**

**Mô tả:** Lấy danh sách Khung chương trình đào tạo có phân trang, hỗ trợ tìm kiếm theo mã/tên và lọc theo trạng thái vòng đời.

**Query Parameters:**
| Tham số | Kiểu | Bắt buộc | Mặc định | Mô tả |
| :--- | :--- | :--- | :--- | :--- |
| `search` | String | Không | — | Tìm kiếm theo mã hoặc tên curriculum |
| `searchBy` | String | Không | — | `code`, `name`, hoặc `all` |
| `status` | String | Không | — | Xem bảng vòng đời bên dưới |
| `page` | Integer | Không | `0` | Số trang (0-indexed) |
| `size` | Integer | Không | `10` | Số bản ghi mỗi trang |
| `sort` | String[] | Không | `curriculumCode,asc` | Vd: `sort=curriculumName,desc` |

**Trạng thái vòng đời Curriculum:**
| Status | Ý nghĩa |
| :--- | :--- |
| `DRAFT` | HoCFDC đang khởi tạo cấu trúc khung |
| `STRUCTURE_REVIEWED` | Đang chờ VP xem xét |
| `STRUCTURE_APPROVED` | VP đã duyệt, bàn giao cho HoPDC |
| `SYLLABUS_DEVELOP` | Các Bộ môn đang soạn Syllabus |
| `FINAL_REVIEW` | Thẩm định toàn bộ nội dung |
| `SIGNED` | Đã ký ban hành |
| `PUBLISHED` | Đã công bố cho sinh viên |
| `ARCHIVED` | Phiên bản cũ, không còn áp dụng |

**Response (200 OK):**
```json
{
  "status": 1000,
  "message": "Get all curriculums successfully",
  "data": {
    "content": [
      {
        "curriculumId": "550e8400-e29b-41d4-a716-446655440000",
        "curriculumCode": "SE_2024",
        "curriculumName": "Software Engineering 2024",
        "startYear": 2024,
        "endYear": 2028,
        "status": "PUBLISHED",
        "major": {
          "majorId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
          "majorCode": "SE",
          "majorName": "Software Engineering"
        }
      }
    ],
    "page": 0,
    "size": 10,
    "totalElements": 3,
    "totalPages": 1
  }
}
```

**Code Example:**
```typescript
interface CurriculumListParams {
  search?: string;
  searchBy?: 'code' | 'name' | 'all';
  status?: string;
  page?: number;
  size?: number;
  sort?: string;
}

const getCurriculums = async (params: CurriculumListParams = {}, token: string) => {
  const { data } = await axios.get('/api/curriculums', {
    headers: { Authorization: `Bearer ${token}` },
    params: { page: 0, size: 10, ...params },
  });
  return data;
};
```

---

## 2.2. Tạo mới Curriculum

**`POST /api/curriculums`**

**Mô tả:** Tạo một khung chương trình đào tạo mới. Yêu cầu quyền `CURRICULUM_CREATE`.

**Request Body:**
```json
{
  "curriculumCode": "SE_2025",
  "curriculumName": "Software Engineering 2025",
  "startYear": 2025,
  "majorId": "3fa85f64-5717-4562-b3fc-2c963f66afa6"
}
```

| Trường | Kiểu | Bắt buộc | Ràng buộc | Mô tả |
| :--- | :--- | :--- | :--- | :--- |
| `curriculumCode` | String | **Có** | Tối đa 20 ký tự, duy nhất | Mã Khung CTĐT |
| `curriculumName` | String | **Có** | Tối đa 100 ký tự | Tên Khung CTĐT |
| `startYear` | Integer | Không | — | Năm bắt đầu áp dụng |
| `majorId` | **String (UUID)** | **Có** | Phải là UUID hợp lệ của Major | ID của Chuyên ngành |

**Response (200 OK):**
```json
{
  "status": 1000,
  "message": "Curriculum created successfully",
  "data": {
    "curriculumId": "c7f1e2a0-1234-4abc-9def-567890abcdef",
    "curriculumCode": "SE_2025",
    "curriculumName": "Software Engineering 2025",
    "startYear": 2025,
    "endYear": null,
    "status": "DRAFT",
    "major": {
      "majorId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
      "majorCode": "SE",
      "majorName": "Software Engineering"
    }
  }
}
```

**Mã lỗi:**
| HTTP | Custom Code | Mô tả |
| :--- | :--- | :--- |
| 400 | 10002 | Mã curriculum đã tồn tại |
| 400 | 10003 | Thiếu `curriculumCode` |
| 400 | 10004 | Thiếu `curriculumName` |
| 400 | 10007 | Thiếu `majorId` |
| 400 | 10012 | Không thể tạo Curriculum cho Major đang ở trạng thái ARCHIVED hoặc DRAFT |
| 403 | 1002 | Không có quyền `CURRICULUM_CREATE` |

**Code Example:**
```typescript
interface CreateCurriculumPayload {
  curriculumCode: string;
  curriculumName: string;
  startYear?: number;
  majorId: string; // UUID
}

const createCurriculum = async (payload: CreateCurriculumPayload, token: string) => {
  const { data } = await axios.post('/api/curriculums', payload, {
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
  });
  return data;
};
```

---

## 2.3. Lấy chi tiết Curriculum theo ID

**`GET /api/curriculums/{id}`**

**Mô tả:** Lấy toàn bộ thông tin của một Curriculum, bao gồm cả thông tin Major liên kết.

**Path Variables:**
| Tham số | Kiểu | Bắt buộc | Mô tả |
| :--- | :--- | :--- | :--- |
| `id` | **String (UUID)** | **Có** | UUID của Curriculum. ⚠️ Là String, không phải Integer! |

**Response (200 OK):**
```json
{
  "status": 1000,
  "message": "Get curriculum detail successfully",
  "data": {
    "curriculumId": "550e8400-e29b-41d4-a716-446655440000",
    "curriculumCode": "SE_2024",
    "curriculumName": "Software Engineering 2024",
    "startYear": 2024,
    "endYear": 2028,
    "status": "PUBLISHED",
    "major": {
      "majorId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
      "majorCode": "SE",
      "majorName": "Software Engineering"
    }
  }
}
```

**Mã lỗi:**
| HTTP | Custom Code | Mô tả |
| :--- | :--- | :--- |
| 404 | 10001 | Không tìm thấy Curriculum với ID này |

**Code Example:**
```typescript
const getCurriculumById = async (curriculumId: string, token: string) => {
  const { data } = await axios.get(`/api/curriculums/${curriculumId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return data;
};
```

---

## 2.4. Lấy danh sách Curriculum theo Major

**`GET /api/curriculums/major/{majorId}`**

**Mô tả:** Lấy toàn bộ Curriculum thuộc về một Major cụ thể. Trả về danh sách rút gọn `CurriculumShortResponse` (không có thông tin Major lồng nhau). Dùng khi cần dropdown chọn phiên bản chương trình.

> ⚠️ API này **không yêu cầu JWT** (không có `@AuthenticationPrincipal Jwt jwt` trong method signature).

**Path Variables:**
| Tham số | Kiểu | Bắt buộc | Mô tả |
| :--- | :--- | :--- | :--- |
| `majorId` | **String (UUID)** | **Có** | UUID của Major. ⚠️ Là String, không phải Integer! |

**Response (200 OK):**
```json
{
  "status": 1000,
  "message": "Get curriculums by major successfully",
  "data": [
    {
      "curriculumId": "550e8400-e29b-41d4-a716-446655440000",
      "curriculumCode": "SE_2023",
      "curriculumName": "Software Engineering 2023",
      "startYear": 2023,
      "endYear": 2027,
      "status": "ARCHIVED"
    },
    {
      "curriculumId": "c7f1e2a0-1234-4abc-9def-567890abcdef",
      "curriculumCode": "SE_2024",
      "curriculumName": "Software Engineering 2024",
      "startYear": 2024,
      "endYear": null,
      "status": "PUBLISHED"
    }
  ]
}
```
> 💡 `data` ở đây là một **Array**, không phải PagedResponse.

**Code Example:**
```typescript
const getCurriculumsByMajor = async (majorId: string, token: string) => {
  const { data } = await axios.get(`/api/curriculums/major/${majorId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  // data.data là Array<CurriculumShortResponse>
  return data.data as Array<{
    curriculumId: string;
    curriculumCode: string;
    curriculumName: string;
    startYear: number;
    endYear: number | null;
    status: string;
  }>;
};
```

---

## 2.5. Lấy chi tiết Curriculum theo Code

**`GET /api/curriculums/code/{code}`**

**Mô tả:** Tìm kiếm Curriculum bằng mã code duy nhất (ví dụ: `SE_2024`).

**Path Variables:**
| Tham số | Kiểu | Bắt buộc | Mô tả |
| :--- | :--- | :--- | :--- |
| `code` | String | **Có** | Mã code của Curriculum (không phải UUID) |

**Response (200 OK):** *(Cấu trúc giống 2.3)*

**Code Example:**
```typescript
const getCurriculumByCode = async (code: string, token: string) => {
  const { data } = await axios.get(`/api/curriculums/code/${code}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return data;
};
```

---

## 2.6. Cập nhật Curriculum

**`PUT /api/curriculums/{id}`**

**Mô tả:** Cập nhật thông tin của Curriculum. Yêu cầu quyền `CURRICULUM_UPDATE`. Chỉ có thể sửa khi Curriculum ở trạng thái `DRAFT`.

**Path Variables:**
| Tham số | Kiểu | Bắt buộc | Mô tả |
| :--- | :--- | :--- | :--- |
| `id` | **String (UUID)** | **Có** | UUID của Curriculum |

**Request Body:** *(Tương tự API Tạo mới – 2.2)*
```json
{
  "curriculumCode": "SE_2025_UPDATED",
  "curriculumName": "Software Engineering 2025 (Revised)",
  "startYear": 2025,
  "majorId": "3fa85f64-5717-4562-b3fc-2c963f66afa6"
}
```

**Mã lỗi:**
| HTTP | Custom Code | Mô tả |
| :--- | :--- | :--- |
| 400 | 10011 | Curriculum không ở trạng thái DRAFT |
| 404 | 10001 | Không tìm thấy Curriculum |
| 403 | 1002 | Không có quyền `CURRICULUM_UPDATE` |

**Code Example:**
```typescript
const updateCurriculum = async (curriculumId: string, payload: CreateCurriculumPayload, token: string) => {
  const { data } = await axios.put(`/api/curriculums/${curriculumId}`, payload, {
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
  });
  return data;
};
```

---

## 2.7. Cập nhật trạng thái Curriculum (Lifecycle)

**`PATCH /api/curriculums/{id}/status`**

**Mô tả:** Chuyển đổi trạng thái vòng đời của Curriculum. Yêu cầu quyền `CURRICULUM_UPDATE`.

**Path Variables:**
| Tham số | Kiểu | Bắt buộc | Mô tả |
| :--- | :--- | :--- | :--- |
| `id` | **String (UUID)** | **Có** | UUID của Curriculum |

**Query Parameters:**
| Tham số | Kiểu | Bắt buộc | Mô tả |
| :--- | :--- | :--- | :--- |
| `status` | String | **Có** | Trạng thái mới (xem bảng vòng đời ở 2.1) |

**Response (200 OK):**
```json
{
  "status": 1000,
  "message": "Curriculum status updated successfully",
  "data": {
    "curriculumId": "550e8400-e29b-41d4-a716-446655440000",
    "curriculumCode": "SE_2024",
    "curriculumName": "Software Engineering 2024",
    "startYear": 2024,
    "endYear": 2028,
    "status": "STRUCTURE_REVIEWED",
    "major": { ... }
  }
}
```

**Mã lỗi:**
| HTTP | Custom Code | Mô tả |
| :--- | :--- | :--- |
| 400 | 10010 | Chuyển trạng thái không hợp lệ |
| 404 | 10001 | Không tìm thấy Curriculum |
| 403 | 1002 | Không có quyền |

**Code Example:**
```typescript
const updateCurriculumStatus = async (curriculumId: string, status: string, token: string) => {
  const { data } = await axios.patch(`/api/curriculums/${curriculumId}/status`, null, {
    headers: { Authorization: `Bearer ${token}` },
    params: { status },
  });
  return data;
};
```

---

## 2.8. Cập nhật năm kết thúc (End Year)

**`PATCH /api/curriculums/{id}/end-year`**

**Mô tả:** Cập nhật năm kết thúc của Curriculum. Năm kết thúc phải lớn hơn hoặc bằng năm bắt đầu. Yêu cầu quyền `CURRICULUM_UPDATE`.

**Path Variables:**
| Tham số | Kiểu | Bắt buộc | Mô tả |
| :--- | :--- | :--- | :--- |
| `id` | **String (UUID)** | **Có** | UUID của Curriculum |

**Query Parameters:**
| Tham số | Kiểu | Bắt buộc | Mô tả |
| :--- | :--- | :--- | :--- |
| `endYear` | Integer | **Có** | Năm kết thúc (phải ≥ startYear) |

**Mã lỗi:**
| HTTP | Custom Code | Mô tả |
| :--- | :--- | :--- |
| 400 | 10008 | End year phải lớn hơn hoặc bằng Start year |
| 404 | 10001 | Không tìm thấy Curriculum |

**Code Example:**
```typescript
const updateCurriculumEndYear = async (curriculumId: string, endYear: number, token: string) => {
  const { data } = await axios.patch(`/api/curriculums/${curriculumId}/end-year`, null, {
    headers: { Authorization: `Bearer ${token}` },
    params: { endYear },
  });
  return data;
};
```

---

## 2.9. Xóa Curriculum (Soft Delete)

**`DELETE /api/curriculums/{id}`**

**Mô tả:** Xóa mềm Curriculum. Yêu cầu quyền `CURRICULUM_DELETE`.

**Path Variables:**
| Tham số | Kiểu | Bắt buộc | Mô tả |
| :--- | :--- | :--- | :--- |
| `id` | **String (UUID)** | **Có** | UUID của Curriculum cần xóa |

**Response (200 OK):**
```json
{
  "status": 1000,
  "message": "Curriculum deleted successfully"
}
```

**Mã lỗi:**
| HTTP | Custom Code | Mô tả |
| :--- | :--- | :--- |
| 409 | 10009 | Curriculum đang chứa các Subject, không thể xóa |
| 404 | 10001 | Không tìm thấy Curriculum |
| 403 | 1002 | Không có quyền `CURRICULUM_DELETE` |

**Code Example:**
```typescript
const deleteCurriculum = async (curriculumId: string, token: string) => {
  const { data } = await axios.delete(`/api/curriculums/${curriculumId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return data;
};
```

---

---

# 3. Task Management (`/api/tasks`)

---

## 3.1. Tạo Task mới (Dành cho HoPDC/Manager)

**`POST /api/tasks`**

**Mô tả:** Tạo một nhiệm vụ mới trong một Sprint cụ thể. `taskName` và `sprintId` là bắt buộc.

**Request Body:**
```json
{
  "subjectId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "sprintId": "b2c3d4e5-f6a7-8901-bcde-f12345678901",
  "taskName": "Soạn thảo Syllabus môn Lập trình Web",
  "description": "Biên soạn đề cương chi tiết môn Web Programming.",
  "priority": "HIGH",
  "type": "SYLLABUS_DEVELOPMENT"
}
```

| Trường | Kiểu | Bắt buộc | Ràng buộc | Mô tả |
| :--- | :--- | :--- | :--- | :--- |
| `subjectId` | **String (UUID)** | Không | — | ID môn học liên quan |
| `sprintId` | **String (UUID)** | **Có** | — | ID Sprint thuộc |
| `taskName` | String | **Có** | Tối đa 150 ký tự | Tên nhiệm vụ |
| `description` | String | Không | — | Mô tả chi tiết |
| `priority` | String | Không | Tối đa 20 ký tự | Ví dụ: `LOW`, `MEDIUM`, `HIGH`, `URGENT` |
| `type` | String | Không | Tối đa 50 ký tự | Loại nhiệm vụ |

**Response (200 OK):**
```json
{
  "status": 1000,
  "message": "Task created successfully",
  "data": {
    "taskId": "d4e5f6a7-b8c9-0123-defg-456789012345",
    "sprintId": "b2c3d4e5-f6a7-8901-bcde-f12345678901",
    "accountId": null,
    "syllabusId": null,
    "subjectId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    "taskName": "Soạn thảo Syllabus môn Lập trình Web",
    "description": "Biên soạn đề cương chi tiết môn Web Programming.",
    "subjectStatus": "WAITING_SYLLABUS",
    "status": "TO_DO",
    "priority": "HIGH",
    "type": "SYLLABUS_DEVELOPMENT",
    "deadline": null,
    "completedAt": null,
    "createdAt": "2024-07-01"
  }
}
```

**Mã lỗi:**
| HTTP | Custom Code | Mô tả |
| :--- | :--- | :--- |
| 400 | 25002 | Thiếu `taskName` |
| 400 | 25004 | Thiếu `sprintId` |
| 400 | 25010 | Curriculum chưa được APPROVED, không thể tạo task |
| 404 | 23001 | Không tìm thấy Sprint |

**Code Example:**
```typescript
interface CreateTaskPayload {
  sprintId: string;      // UUID
  taskName: string;
  subjectId?: string;    // UUID
  description?: string;
  priority?: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  type?: string;
}

const createTask = async (payload: CreateTaskPayload, token: string) => {
  const { data } = await axios.post('/api/tasks', payload, {
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
  });
  return data;
};
```

---

## 3.2. Tạo hàng loạt Task theo Sprint (Batch Create)

**`POST /api/tasks/batch/{sprintId}`**

**Mô tả:** Tự động tạo Task cho tất cả các môn học trong Sprint (dựa trên Curriculum và Bộ môn liên kết). Không cần Request Body.

**Path Variables:**
| Tham số | Kiểu | Bắt buộc | Mô tả |
| :--- | :--- | :--- | :--- |
| `sprintId` | **String (UUID)** | **Có** | UUID của Sprint cần tạo batch task |

**Response (200 OK):**
```json
{
  "status": 1000,
  "message": "Tasks created successfully",
  "data": true
}
```

**Mã lỗi:**
| HTTP | Custom Code | Mô tả |
| :--- | :--- | :--- |
| 404 | 23001 | Không tìm thấy Sprint |
| 400 | 25010 | Curriculum chưa sẵn sàng để tạo Task |

**Code Example:**
```typescript
const batchCreateTasks = async (sprintId: string, token: string) => {
  const { data } = await axios.post(`/api/tasks/batch/${sprintId}`, null, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return data;
};
```

---

## 3.3. Lấy danh sách Task

**`GET /api/tasks`**

**Mô tả:** Lấy danh sách Task có phân trang với nhiều bộ lọc linh hoạt.

**Query Parameters:**
| Tham số | Kiểu | Bắt buộc | Mặc định | Mô tả |
| :--- | :--- | :--- | :--- | :--- |
| `search` | String | Không | — | Tìm theo tên Task |
| `status` | String | Không | — | `DRAFT`, `TO_DO`, `IN_PROGRESS`, `DONE`, `CANCELLED` |
| `sprintId` | **String (UUID)** | Không | — | Lọc theo Sprint |
| `accountId` | **String (UUID)** | Không | — | Lọc theo người được giao |
| `departmentId` | **String (UUID)** | Không | — | Lọc theo Bộ môn |
| `syllabusId` | **String (UUID)** | Không | — | Lọc theo Đề cương |
| `page` | Integer | Không | `0` | Số trang (0-indexed) |
| `size` | Integer | Không | `10` | Số bản ghi mỗi trang |
| `sortBy` | String | Không | `deadline` | Tên trường sắp xếp |
| `direction` | String | Không | `asc` | `asc` hoặc `desc` |

**Response (200 OK):**
```json
{
  "status": 1000,
  "message": "Tasks retrieved successfully",
  "data": {
    "content": [
      {
        "taskId": "d4e5f6a7-b8c9-0123-defg-456789012345",
        "sprintId": "b2c3d4e5-f6a7-8901-bcde-f12345678901",
        "account": {
          "accountId": "acc11111-aaaa-bbbb-cccc-dddddddddddd",
          "email": "lecturer@fpt.edu.vn",
          "fullName": "Nguyen Van A"
        },
        "syllabus": {
          "syllabusId": "syl22222-aaaa-bbbb-cccc-dddddddddddd",
          "syllabusName": "Web Programming Syllabus"
        },
        "subjectId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
        "subjectStatus": "WAITING_SYLLABUS",
        "taskName": "Soạn thảo Syllabus môn Lập trình Web",
        "description": "...",
        "status": "IN_PROGRESS",
        "priority": "HIGH",
        "type": "SYLLABUS_DEVELOPMENT",
        "deadline": "2024-09-30",
        "completedAt": null,
        "createdAt": "2024-07-01"
      }
    ],
    "page": 0,
    "size": 10,
    "totalElements": 1,
    "totalPages": 1
  }
}
```

**Code Example:**
```typescript
interface TaskListParams {
  search?: string;
  status?: string;
  sprintId?: string;
  accountId?: string;
  departmentId?: string;
  syllabusId?: string;
  page?: number;
  size?: number;
  sortBy?: string;
  direction?: 'asc' | 'desc';
}

const getTasks = async (params: TaskListParams = {}, token: string) => {
  const { data } = await axios.get('/api/tasks', {
    headers: { Authorization: `Bearer ${token}` },
    params: { page: 0, size: 10, sortBy: 'deadline', direction: 'asc', ...params },
  });
  return data;
};
```

---

## 3.4. Lấy chi tiết Task

**`GET /api/tasks/{id}`**

**Mô tả:** Xem thông tin đầy đủ của một Task.

**Path Variables:**
| Tham số | Kiểu | Bắt buộc | Mô tả |
| :--- | :--- | :--- | :--- |
| `id` | **String (UUID)** | **Có** | UUID của Task |

**Response (200 OK):** *(Tương tự item trong mảng của 3.3 nhưng dùng `TaskResponse` – các ID là flat UUID thay vì nested object)*
```json
{
  "status": 1000,
  "message": "Task detail retrieved successfully",
  "data": {
    "taskId": "d4e5f6a7-b8c9-0123-defg-456789012345",
    "sprintId": "b2c3d4e5-f6a7-8901-bcde-f12345678901",
    "accountId": "acc11111-aaaa-bbbb-cccc-dddddddddddd",
    "syllabusId": "syl22222-aaaa-bbbb-cccc-dddddddddddd",
    "subjectId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    "taskName": "Soạn thảo Syllabus môn Lập trình Web",
    "description": "...",
    "subjectStatus": "WAITING_SYLLABUS",
    "status": "IN_PROGRESS",
    "priority": "HIGH",
    "type": "SYLLABUS_DEVELOPMENT",
    "deadline": "2024-09-30",
    "completedAt": null,
    "createdAt": "2024-07-01"
  }
}
```

**Mã lỗi:**
| HTTP | Custom Code | Mô tả |
| :--- | :--- | :--- |
| 404 | 25001 | Không tìm thấy Task |

**Code Example:**
```typescript
const getTaskById = async (taskId: string, token: string) => {
  const { data } = await axios.get(`/api/tasks/${taskId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return data;
};
```

---

## 3.5. Cập nhật Task

**`PUT /api/tasks/{id}`**

**Mô tả:** Cập nhật thông tin Task (người thực hiện, syllabus, deadline...). Chỉ có thể sửa khi Task ở trạng thái `TO_DO`.

**Path Variables:**
| Tham số | Kiểu | Bắt buộc | Mô tả |
| :--- | :--- | :--- | :--- |
| `id` | **String (UUID)** | **Có** | UUID của Task cần cập nhật |

**Request Body:**
```json
{
  "accountId": "acc11111-aaaa-bbbb-cccc-dddddddddddd",
  "syllabusId": "syl22222-aaaa-bbbb-cccc-dddddddddddd",
  "taskName": "Soạn thảo Syllabus môn Lập trình Web (v2)",
  "description": "Cập nhật lại nội dung.",
  "priority": "URGENT",
  "deadline": "2024-10-15",
  "type": "REVISION"
}
```

| Trường | Kiểu | Bắt buộc | Mô tả |
| :--- | :--- | :--- | :--- |
| `accountId` | **String (UUID)** | Không | Gán người thực hiện |
| `syllabusId` | **String (UUID)** | Không | Liên kết Syllabus |
| `taskName` | String | **Có** | Tên nhiệm vụ |
| `description` | String | Không | Mô tả |
| `priority` | String | Không | Độ ưu tiên |
| `deadline` | String | Không | Định dạng `yyyy-MM-dd` |
| `type` | String | Không | Loại nhiệm vụ |

**Mã lỗi:**
| HTTP | Custom Code | Mô tả |
| :--- | :--- | :--- |
| 400 | 25011 | Task không ở trạng thái TO_DO, không thể sửa |
| 404 | 25001 | Không tìm thấy Task |

**Code Example:**
```typescript
interface UpdateTaskPayload {
  taskName: string;
  accountId?: string;
  syllabusId?: string;
  description?: string;
  priority?: string;
  deadline?: string;  // yyyy-MM-dd
  type?: string;
}

const updateTask = async (taskId: string, payload: UpdateTaskPayload, token: string) => {
  const { data } = await axios.put(`/api/tasks/${taskId}`, payload, {
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
  });
  return data;
};
```

---

## 3.6. Cập nhật trạng thái Task (Workflow)

**`PATCH /api/tasks/{id}/status`**

**Mô tả:** Cập nhật trạng thái công việc của Task theo quy trình.

**Vòng đời Task:**
| Trạng thái | Ý nghĩa | Lưu ý |
| :--- | :--- | :--- |
| `DRAFT` | Bản nháp, chưa ban hành | Assignee chưa thấy |
| `TO_DO` | Đã giao, chưa bắt đầu | Có thể đổi Assignee |
| `IN_PROGRESS` | Đang thực hiện | Khóa chức năng xóa |
| `DONE` | Hoàn thành | Tự động cập nhật `completedAt` |
| `CANCELLED` | Đã hủy | Lưu lại để thống kê |

**Path Variables:**
| Tham số | Kiểu | Bắt buộc | Mô tả |
| :--- | :--- | :--- | :--- |
| `id` | **String (UUID)** | **Có** | UUID của Task |

**Query Parameters:**
| Tham số | Kiểu | Bắt buộc | Mô tả |
| :--- | :--- | :--- | :--- |
| `status` | String | **Có** | Trạng thái mới (xem bảng trên) |

**Response (200 OK):**
```json
{
  "status": 1000,
  "message": "Task status updated successfully",
  "data": {
    "taskId": "d4e5f6a7-b8c9-0123-defg-456789012345",
    "status": "DONE",
    "completedAt": "2024-09-15",
    ...
  }
}
```

**Mã lỗi:**
| HTTP | Custom Code | Mô tả |
| :--- | :--- | :--- |
| 400 | 25007 | Giá trị status không hợp lệ |
| 404 | 25001 | Không tìm thấy Task |

**Code Example:**
```typescript
type TaskStatus = 'DRAFT' | 'TO_DO' | 'IN_PROGRESS' | 'DONE' | 'CANCELLED';

const updateTaskStatus = async (taskId: string, status: TaskStatus, token: string) => {
  const { data } = await axios.patch(`/api/tasks/${taskId}/status`, null, {
    headers: { Authorization: `Bearer ${token}` },
    params: { status },
  });
  return data;
};
```

---

## 3.7. Xóa Task

**`DELETE /api/tasks/{id}`**

**Mô tả:** Xóa một Task. Không thể xóa khi Task đang ở trạng thái `IN_PROGRESS`.

**Path Variables:**
| Tham số | Kiểu | Bắt buộc | Mô tả |
| :--- | :--- | :--- | :--- |
| `id` | **String (UUID)** | **Có** | UUID của Task cần xóa |

**Response (200 OK):**
```json
{
  "status": 1000,
  "message": "Task deleted successfully"
}
```

**Code Example:**
```typescript
const deleteTask = async (taskId: string, token: string) => {
  const { data } = await axios.delete(`/api/tasks/${taskId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return data;
};
```

---

## 3.8. Tạo Task (Dành cho Vice President)

**`POST /api/tasks/byVP`**

**Mô tả:** VP tạo task nhanh cho toàn bộ một Chuyên ngành (Major). Hệ thống tự động assign task cho tài khoản có role `HoCFDC`.

**Request Body:**
```json
{
  "majorId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "taskName": "Rà soát tổng thể Khung CTĐT ngành SE",
  "description": "Kiểm tra tất cả PLO, PO và Syllabus trước thẩm định.",
  "priority": "HIGH",
  "deadline": "2024-12-31",
  "type": "REVIEW"
}
```

| Trường | Kiểu | Bắt buộc | Mô tả |
| :--- | :--- | :--- | :--- |
| `majorId` | **String (UUID)** | Không | UUID của Major |
| `taskName` | String | Không | Tên nhiệm vụ |
| `description` | String | Không | Mô tả |
| `priority` | String | Không | Ví dụ: `HIGH`, `URGENT` |
| `deadline` | String | Không | Định dạng `yyyy-MM-dd` |
| `type` | String | Không | Loại nhiệm vụ |

**Response (200 OK):**
```json
{
  "status": 1000,
  "message": "Task created successfully (VP)",
  "data": {
    "taskId": "e5f6a7b8-c9d0-1234-efgh-567890123456",
    "accountId": "hocf1111-aaaa-bbbb-cccc-dddddddddddd",
    "majorId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "taskName": "Rà soát tổng thể Khung CTĐT ngành SE",
    "description": "...",
    "status": "TO_DO",
    "priority": "HIGH",
    "type": "REVIEW",
    "deadline": "2024-12-31",
    "completedAt": null,
    "createdAt": "2024-07-01"
  }
}
```

**Code Example:**
```typescript
interface TaskVPPayload {
  majorId?: string;
  taskName?: string;
  description?: string;
  priority?: string;
  deadline?: string;  // yyyy-MM-dd
  type?: string;
}

const createTaskByVP = async (payload: TaskVPPayload, token: string) => {
  const { data } = await axios.post('/api/tasks/byVP', payload, {
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
  });
  return data;
};
```

---

## 3.9. Cập nhật Task (Dành cho Vice President)

**`PUT /api/tasks/{id}/byVP`**

**Mô tả:** VP cập nhật một Task đã tạo theo quy trình VP.

**Path Variables:**
| Tham số | Kiểu | Bắt buộc | Mô tả |
| :--- | :--- | :--- | :--- |
| `id` | **String (UUID)** | **Có** | UUID của Task cần cập nhật |

**Request Body:** *(Giống 3.8)*

**Code Example:**
```typescript
const updateTaskByVP = async (taskId: string, payload: TaskVPPayload, token: string) => {
  const { data } = await axios.put(`/api/tasks/${taskId}/byVP`, payload, {
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
  });
  return data;
};
```

---

---

# 4. Request Management (`/api/requests`)

---

## 4.1. Tạo Request mới

**`POST /api/requests`**

**Mô tả:** Gửi một yêu cầu mới (ví dụ: yêu cầu chỉnh sửa Syllabus, điều chỉnh Khung CTĐT...).

**Request Body:**
```json
{
  "title": "Yêu cầu cập nhật Syllabus môn Web Programming",
  "content": "Cần bổ sung nội dung về React 18 và Next.js 14 vào đề cương.",
  "comment": "Tham khảo thêm syllabus của ĐH FPT Đà Nẵng.",
  "status": "PENDING",
  "createdById": "acc11111-aaaa-bbbb-cccc-dddddddddddd",
  "curriculumId": "550e8400-e29b-41d4-a716-446655440000",
  "majorId": "3fa85f64-5717-4562-b3fc-2c963f66afa6"
}
```

| Trường | Kiểu | Bắt buộc | Ràng buộc | Mô tả |
| :--- | :--- | :--- | :--- | :--- |
| `title` | String | **Có** | Tối đa 50 ký tự | Tiêu đề yêu cầu |
| `content` | String | Không | — | Nội dung chi tiết |
| `comment` | String | Không | — | Ghi chú bổ sung |
| `status` | String | Không | Tối đa 50 ký tự | Trạng thái ban đầu |
| `createdById` | **String (UUID)** | Không | UUID của Account | Người tạo |
| `curriculumId` | **String (UUID)** | Không | UUID của Curriculum | Curriculum liên quan |
| `majorId` | **String (UUID)** | Không | UUID của Major | Major liên quan |

**Response (200 OK):**
```json
{
  "status": 1000,
  "message": "Request created successfully",
  "data": {
    "requestId": "f6a7b8c9-d0e1-2345-fghi-678901234567",
    "title": "Yêu cầu cập nhật Syllabus môn Web Programming",
    "content": "Cần bổ sung nội dung về React 18...",
    "comment": "Tham khảo thêm syllabus của ĐH FPT Đà Nẵng.",
    "status": "PENDING",
    "createdBy": {
      "accountId": "acc11111-aaaa-bbbb-cccc-dddddddddddd",
      "email": "lecturer@fpt.edu.vn",
      "fullName": "Nguyen Van A",
      ...
    },
    "curriculum": {
      "curriculumId": "550e8400-e29b-41d4-a716-446655440000",
      "curriculumCode": "SE_2024",
      ...
    },
    "major": {
      "majorId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
      "majorCode": "SE",
      ...
    },
    "createdAt": "2024-07-01 09:00:00",
    "updatedAt": "2024-07-01 09:00:00"
  }
}
```

**Mã lỗi:**
| HTTP | Custom Code | Mô tả |
| :--- | :--- | :--- |
| 400 | 31002 | Thiếu `title` |
| 400 | 31003 | `title` vượt quá 50 ký tự |

**Code Example:**
```typescript
interface CreateRequestPayload {
  title: string;
  content?: string;
  comment?: string;
  status?: string;
  createdById?: string;   // UUID
  curriculumId?: string;  // UUID
  majorId?: string;       // UUID
}

const createRequest = async (payload: CreateRequestPayload, token: string) => {
  const { data } = await axios.post('/api/requests', payload, {
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
  });
  return data;
};
```

---

## 4.2. Lấy danh sách Request

**`GET /api/requests`**

**Mô tả:** Lấy danh sách tất cả yêu cầu có phân trang và bộ lọc.

**Query Parameters:**
| Tham số | Kiểu | Bắt buộc | Mặc định | Mô tả |
| :--- | :--- | :--- | :--- | :--- |
| `search` | String | Không | — | Tìm theo tiêu đề |
| `status` | String | Không | — | Lọc theo trạng thái |
| `curriculumId` | **String (UUID)** | Không | — | Lọc theo Curriculum |
| `majorId` | **String (UUID)** | Không | — | Lọc theo Major |
| `page` | Integer | Không | `0` | Số trang |
| `size` | Integer | Không | `10` | Số bản ghi mỗi trang |
| `sortBy` | String | Không | `createdAt` | Trường sắp xếp |
| `direction` | String | Không | `desc` | `asc` hoặc `desc` |

**Response (200 OK):**
```json
{
  "status": 1000,
  "message": "Requests retrieved successfully",
  "data": {
    "content": [
      {
        "requestId": "f6a7b8c9-d0e1-2345-fghi-678901234567",
        "title": "Yêu cầu cập nhật Syllabus môn Web Programming",
        "content": "...",
        "comment": "...",
        "status": "PENDING",
        "createdBy": { ... },
        "curriculum": { ... },
        "major": { ... },
        "createdAt": "2024-07-01 09:00:00",
        "updatedAt": "2024-07-01 09:00:00"
      }
    ],
    "page": 0,
    "size": 10,
    "totalElements": 1,
    "totalPages": 1
  }
}
```

**Code Example:**
```typescript
interface RequestListParams {
  search?: string;
  status?: string;
  curriculumId?: string;
  majorId?: string;
  page?: number;
  size?: number;
  sortBy?: string;
  direction?: 'asc' | 'desc';
}

const getRequests = async (params: RequestListParams = {}, token: string) => {
  const { data } = await axios.get('/api/requests', {
    headers: { Authorization: `Bearer ${token}` },
    params: { page: 0, size: 10, sortBy: 'createdAt', direction: 'desc', ...params },
  });
  return data;
};
```

---

## 4.3. Lấy chi tiết Request

**`GET /api/requests/{id}`**

**Mô tả:** Lấy toàn bộ nội dung của một Request, bao gồm thông tin người tạo, Curriculum và Major liên quan.

**Path Variables:**
| Tham số | Kiểu | Bắt buộc | Mô tả |
| :--- | :--- | :--- | :--- |
| `id` | **String (UUID)** | **Có** | UUID của Request |

**Response (200 OK):** *(Tương tự item trong mảng của 4.2)*

**Mã lỗi:**
| HTTP | Custom Code | Mô tả |
| :--- | :--- | :--- |
| 404 | 31001 | Không tìm thấy Request |

**Code Example:**
```typescript
const getRequestById = async (requestId: string, token: string) => {
  const { data } = await axios.get(`/api/requests/${requestId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return data;
};
```

---

## 4.4. Cập nhật Request

**`PUT /api/requests/{id}`**

**Mô tả:** Chỉnh sửa nội dung của một Request đã tạo.

**Path Variables:**
| Tham số | Kiểu | Bắt buộc | Mô tả |
| :--- | :--- | :--- | :--- |
| `id` | **String (UUID)** | **Có** | UUID của Request cần cập nhật |

**Request Body:** *(Tương tự 4.1)*

**Mã lỗi:**
| HTTP | Custom Code | Mô tả |
| :--- | :--- | :--- |
| 404 | 31001 | Không tìm thấy Request |
| 400 | 31002 | Thiếu `title` |

**Code Example:**
```typescript
const updateRequest = async (requestId: string, payload: CreateRequestPayload, token: string) => {
  const { data } = await axios.put(`/api/requests/${requestId}`, payload, {
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
  });
  return data;
};
```

---

## 4.5. Xóa Request

**`DELETE /api/requests/{id}`**

**Mô tả:** Xóa một Request.

**Path Variables:**
| Tham số | Kiểu | Bắt buộc | Mô tả |
| :--- | :--- | :--- | :--- |
| `id` | **String (UUID)** | **Có** | UUID của Request cần xóa |

**Response (200 OK):**
```json
{
  "status": 1000,
  "message": "Request deleted successfully"
}
```

**Code Example:**
```typescript
const deleteRequest = async (requestId: string, token: string) => {
  const { data } = await axios.delete(`/api/requests/${requestId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return data;
};
```

---

## 4.6. Cập nhật trạng thái Request

**`PATCH /api/requests/{id}/status`**

**Mô tả:** Phê duyệt hoặc từ chối một Request.

**Path Variables:**
| Tham số | Kiểu | Bắt buộc | Mô tả |
| :--- | :--- | :--- | :--- |
| `id` | **String (UUID)** | **Có** | UUID của Request |

**Query Parameters:**
| Tham số | Kiểu | Bắt buộc | Mô tả |
| :--- | :--- | :--- | :--- |
| `status` | String | **Có** | Trạng thái mới (ví dụ: `APPROVED`, `REJECTED`, `PENDING`) |

**Response (200 OK):**
```json
{
  "status": 1000,
  "message": "Request status updated successfully",
  "data": {
    "requestId": "f6a7b8c9-d0e1-2345-fghi-678901234567",
    "status": "APPROVED",
    "updatedAt": "2024-07-05 14:30:00",
    ...
  }
}
```

**Mã lỗi:**
| HTTP | Custom Code | Mô tả |
| :--- | :--- | :--- |
| 404 | 31001 | Không tìm thấy Request |

**Code Example:**
```typescript
const updateRequestStatus = async (requestId: string, status: string, token: string) => {
  const { data } = await axios.patch(`/api/requests/${requestId}/status`, null, {
    headers: { Authorization: `Bearer ${token}` },
    params: { status },
  });
  return data;
};
```

---

---

# 5. Mã lỗi & Xử lý lỗi

### Cấu trúc Response khi lỗi
```json
{
  "status": 10001,
  "message": "Curriculum not found"
}
```

### Bảng mã lỗi toàn hệ thống

| HTTP Status | Custom Code | Tên lỗi | Mô tả |
| :--- | :--- | :--- | :--- |
| **401** | 1001 | UNAUTHENTICATED | Token không hợp lệ hoặc hết hạn |
| **403** | 1002 | UNAUTHORIZED | Không đủ quyền thực hiện hành động này |
| **400** | 1003 | INVALID_CREDENTIALS | Sai username hoặc password |
| **404** | 2001 | ACCOUNT_NOT_FOUND | Không tìm thấy tài khoản |
| **400** | 2002 | ACCOUNT_EXISTS | Tài khoản đã tồn tại |
| **404** | 5001 | MAJOR_NOT_FOUND | Không tìm thấy Major |
| **400** | 5002 | MAJOR_CODE_EXISTS | Mã Major đã tồn tại |
| **400** | 5006 | INVALID_MAJOR_STATUS | Chuyển trạng thái Major không hợp lệ |
| **400** | 5007 | MAJOR_NOT_DRAFT | Chỉ sửa được Major ở trạng thái DRAFT |
| **404** | 10001 | CURRICULUM_NOT_FOUND | Không tìm thấy Curriculum |
| **400** | 10002 | CURRICULUM_CODE_EXISTS | Mã Curriculum đã tồn tại |
| **400** | 10008 | INVALID_YEAR_RANGE | End year phải ≥ Start year |
| **409** | 10009 | CURRICULUM_HAS_SUBJECTS | Không thể xóa Curriculum đang chứa Subjects |
| **400** | 10010 | INVALID_CURRICULUM_STATUS | Chuyển trạng thái Curriculum không hợp lệ |
| **400** | 10011 | CURRICULUM_NOT_DRAFT | Chỉ sửa được Curriculum ở trạng thái DRAFT |
| **400** | 10012 | CURRICULUM_NOT_CREATE | Không tạo được Curriculum cho Major ARCHIVED/DRAFT |
| **404** | 23001 | SPRINT_NOT_FOUND | Không tìm thấy Sprint |
| **404** | 25001 | TASK_NOT_FOUND | Không tìm thấy Task |
| **400** | 25007 | INVALID_TASK_STATUS | Trạng thái Task không hợp lệ |
| **400** | 25011 | TASK_NOT_EDITABLE | Task không ở trạng thái TO_DO, không thể sửa |
| **404** | 31001 | REQUEST_NOT_FOUND | Không tìm thấy Request |
| **400** | 31002 | REQUEST_TITLE_REQUIRED | Tiêu đề Request là bắt buộc |
| **403** | 8888 | ACCESS_DENIED_FOR_ROLE | Vai trò không có quyền xem nội dung này |
| **500** | 9999 | UNCATEGORIZED_EXCEPTION | Lỗi hệ thống chưa xác định |

---

## Axios Instance Mẫu (Khuyến nghị dùng cho toàn dự án)

```typescript
// lib/api.ts
import axios, { AxiosError, AxiosResponse } from 'axios';

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

const api = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 10000,
});

// Tự động gắn token vào mọi request
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Xử lý lỗi tập trung
api.interceptors.response.use(
  (response: AxiosResponse) => response,
  (error: AxiosError<{ status: number; message: string }>) => {
    if (error.response?.status === 401) {
      // Token hết hạn → redirect về login
      window.location.href = '/login';
    }
    if (error.response?.status === 403) {
      console.error('Không có quyền thực hiện hành động này');
    }
    return Promise.reject(error);
  }
);

export default api;
```

> **Sử dụng:**
> ```typescript
> import api from '@/lib/api';
> const { data } = await api.get('/api/majors');
> ```
