---
name: frontend-design
description: Kỹ năng thiết kế UI/UX và phát triển giao diện cho dự án Next.js. Dùng khi cần tạo component mới hoặc sửa layout.
---

## Hướng dẫn thiết kế Frontend

1. **Tech Stack**: Ưu tiên sử dụng Next.js App Router (`app/`), Tailwind CSS và Server Components. Chỉ dùng `'use client'` ở những nơi bắt buộc cần state hoặc event listener.
2. **UI/UX**: Thiết kế theo chuẩn Mobile-first. Bám sát các biến màu đã định nghĩa trong `tailwind.config.ts`.
3. **Quy trình Kiểm thử (Antigravity Workflow)**:
   - Sau khi hoàn thành code giao diện, hãy đảm bảo `localhost:3000` đang chạy.
   - Dùng trình duyệt nội bộ của Antigravity để mở trang vừa tạo.
   - Luôn chụp lại ảnh màn hình (screenshot) hoặc tạo Visual Artifact để tôi (user) review trước khi chuyển sang task khác.
