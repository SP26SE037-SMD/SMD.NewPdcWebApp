export function translateAssessmentType(type: string): string {
    if (!type) return type;
    const t = type.toLowerCase();
    if (t.includes("trắc nghiệm khách quan") || t.includes("trắc nghiệm")) return "Multiple Choice";
    if (t.includes("tự luận ngắn")) return "Short Essay";
    if (t.includes("tự luận dài") || t.includes("tự luận")) return "Essay";
    if (t.includes("phân tích mô hình tổng hợp") || t.includes("tổng hợp")) return "Comprehensive Analysis";
    if (t.includes("thực hành")) return "Practical";
    if (t.includes("vấn đáp")) return "Oral Exam";
    if (t.includes("đồ án") || t.includes("dự án")) return "Project";
    if (t.includes("bài tập lớn")) return "Assignment";
    return type;
}
