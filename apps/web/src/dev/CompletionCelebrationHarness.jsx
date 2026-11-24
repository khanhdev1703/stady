import { useState } from "react";
import { createRoot } from "react-dom/client";

import "@/styles/index.css";

import CourseCompletionCelebration from "@/features/learning/components/CourseCompletionCelebration.jsx";

// Trang dev để xem pháo dây mà không cần hoàn thành một khóa học.
// Mở /completion-harness.html, bấm "Chạy lại pháo dây" để xem lại.
const Demo = () => {
  const [runId, setRunId] = useState(1);
  const [open, setOpen] = useState(true);

  const replay = () => {
    setOpen(true);
    setRunId((current) => current + 1);
  };

  return (
    <div className="min-h-dvh bg-[var(--surface-3)] p-4 sm:p-6">
      {/* Nằm trên modal (z-60) để bấm lại được trong lúc modal mở. */}
      <div className="fixed inset-x-0 top-0 z-[70] flex justify-center p-3">
        <div className="flex w-full max-w-md flex-col gap-2 rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-3 shadow-lg">
          <p className="text-[12px] font-semibold text-[var(--ink)]">
            Harness · pháo dây (modal thật)
          </p>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={replay}
              className="inline-flex h-10 items-center justify-center rounded-full bg-[var(--brand-solid)] px-4 text-[13px] font-semibold text-white transition hover:bg-[var(--brand-solid-hover)]"
            >
              Chạy lại pháo dây
            </button>

            <button
              type="button"
              onClick={() => setOpen((current) => !current)}
              className="inline-flex h-10 items-center justify-center rounded-full border border-[var(--line)] px-4 text-[13px] font-medium text-[var(--muted)] transition hover:bg-[var(--surface-3)]"
            >
              {open ? "Đóng modal" : "Mở modal"}
            </button>
          </div>
        </div>
      </div>

      <div className="mx-auto mt-32 max-w-md rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-4 sm:p-5">
        <h1 className="text-base font-semibold text-[var(--ink)]">
          Pháo dây hoàn thành khóa học
        </h1>

        <p className="mt-1.5 text-[13px] leading-6 text-[var(--muted)]">
          Đây là modal và hiệu ứng thật dùng trong trang học. Bấm
          “Chạy lại pháo dây” để xem lại từ đầu.
        </p>

        <p className="mt-3 text-[12px] leading-5 text-[var(--faint)]">
          Lần chạy hiện tại: {runId}
        </p>
      </div>

      <CourseCompletionCelebration
        key={runId}
        open={open}
        courseTitle="Tiếng Lào giao tiếp cho người mới"
        onClose={() => setOpen(false)}
        onViewCourses={() => setOpen(false)}
        onViewCertificate={() => setOpen(false)}
      />
    </div>
  );
};

createRoot(document.getElementById("root")).render(<Demo />);
