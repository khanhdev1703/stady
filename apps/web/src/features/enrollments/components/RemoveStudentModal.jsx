import { useState } from "react";

import { Trash2, X } from "lucide-react";

import appToast from "@/lib/toast.js";
import formatDate from "@/lib/format/formatDate.js";
import enrollmentApi from "@/features/enrollments/api.js";

const RemoveStudentModal = ({
    open,
    enrollment,
    onClose,
    onRemoved,
}) => {
    const [submitting, setSubmitting] = useState(false);

    if (!open || !enrollment) {
        return null;
    }

    const studentName =
        enrollment.student?.name ||
        enrollment.studentName ||
        "học sinh";

    const studentCode =
        enrollment.student?.studentCode ||
        enrollment.studentCode ||
        "";

    const handleClose = () => {
        if (submitting) return;

        onClose();
    };

    const handleSubmit = async () => {
        if (submitting) return;

        try {
            setSubmitting(true);

            await enrollmentApi.remove(enrollment.id);

            onRemoved?.(enrollment.id);

            appToast.success(
                "Đã xóa học sinh khỏi khóa học."
            );

            onClose();
        } catch (error) {
            console.error("Remove enrollment error:", error);

            appToast.error(
                error?.response?.data?.message ||
                "Không thể xóa học sinh khỏi khóa học."
            );
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="remove-enrollment-title"
            className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 backdrop-blur-[2px] sm:items-center sm:px-3"
            onMouseDown={(event) => {
                if (event.target === event.currentTarget) {
                    handleClose();
                }
            }}
        >
            <div
                className="w-full max-w-[420px] rounded-t-3xl border border-[var(--line)] bg-[var(--surface)] shadow-xl sm:rounded-3xl"
                onMouseDown={(event) => event.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-center justify-between border-b border-[var(--line)] px-4 py-3">
                    <div className="flex min-w-0 items-center gap-2">
                        <Trash2
                            size={17}
                            strokeWidth={1.9}
                            className="shrink-0 text-[var(--danger)]"
                        />

                        <h2
                            id="remove-enrollment-title"
                            className="truncate text-sm font-semibold text-[var(--ink)]"
                        >
                            Xóa khỏi khóa học
                        </h2>
                    </div>

                    <button
                        type="button"
                        onClick={handleClose}
                        disabled={submitting}
                        aria-label="Đóng"
                        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-[var(--faint)] transition hover:bg-[var(--surface-2)] hover:text-[var(--ink-2)] disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        <X size={18} />
                    </button>
                </div>

                {/* Body */}
                <div className="px-4 py-4">
                    <div className="rounded-xl bg-[var(--surface-3)] px-3.5 py-3">
                        <p className="truncate text-[13px] font-semibold text-[var(--ink)]">
                            {studentName}
                        </p>

                        <p className="mt-0.5 truncate text-[12px] text-[var(--muted)]">
                            {studentCode}

                            {enrollment.expiresAt
                                ? ` · Hết hạn ${formatDate(enrollment.expiresAt)}`
                                : ""}
                        </p>
                    </div>

                    <div className="mt-4 rounded-xl border border-[var(--danger)]/20 bg-[var(--danger-soft)] px-3.5 py-3">
                        <p className="text-[13px] font-medium text-[var(--danger)]">
                            Học sinh sẽ mất quyền truy cập khóa
                            học ngay lập tức.
                        </p>

                        <p className="mt-1.5 text-[12px] leading-5 text-[var(--ink-2)]">
                            Thao tác này không thể hoàn tác. Tiến
                            độ học và kết quả bài kiểm tra của học
                            sinh vẫn được giữ lại, nên nếu thêm
                            lại sau này bạn sẽ thấy lại dữ liệu
                            cũ.
                        </p>
                    </div>
                </div>

                {/* Footer */}
                <div className="flex gap-2 border-t border-[var(--line)] px-4 py-3 pb-[calc(0.75rem_+_env(safe-area-inset-bottom))] sm:pb-3">
                    <button
                        type="button"
                        onClick={handleClose}
                        disabled={submitting}
                        className="h-11 flex-1 rounded-full border border-[var(--line)] bg-[var(--surface)] text-[13px] font-medium text-[var(--muted)] transition hover:bg-[var(--surface-3)] disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        Hủy
                    </button>

                    <button
                        type="button"
                        onClick={handleSubmit}
                        disabled={submitting}
                        className="h-11 flex-[1.4] rounded-full bg-[var(--danger-solid)] text-[13px] font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                        {submitting
                            ? "Đang xóa..."
                            : "Xóa khỏi khóa"}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default RemoveStudentModal;
