import { redirect } from "next/navigation";

export default function DeprecatedFeedbackPage() {
  redirect("/dashboard/hopdc/feedback");
}
