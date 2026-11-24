import { BookOpen, Check, Clock3 } from "lucide-react";

const WEEKDAY_LABELS = ["T2", "T3", "T4", "T5", "T6", "T7", "CN"];

const formatStudyTime = (seconds) => {
    const totalMinutes = Math.round(
        Math.max(0, seconds || 0) / 60
    );

    if (totalMinutes < 1) return "0 phút";

    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;

    if (hours === 0) return `${minutes} phút`;

    return minutes === 0
        ? `${hours} giờ`
        : `${hours} giờ ${minutes} phút`;
};

const StudentProgressSummary = ({ progress }) => {
    if (!progress) return null;

    const {
        studySeconds = 0,
        completedLessons = 0,
        weekActivity = [],
        today,
    } = progress;

    return (
        <section className="rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-4 shadow-sm sm:p-5">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between sm:gap-6">
                <div className="min-w-0 sm:flex-1">
                    <h2 className="text-[14px] font-semibold text-[var(--ink)]">
                        Tiến độ của tôi
                    </h2>

                    <div className="mt-3 flex items-center gap-3">
                        <div className="flex min-w-0 flex-1 items-center gap-2.5">
                            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[var(--brand-soft)] text-[var(--brand-text)]">
                                <Clock3
                                    size={17}
                                    strokeWidth={1.9}
                                />
                            </span>

                            <div className="min-w-0">
                                <p className="truncate text-[15px] font-bold leading-tight tracking-tight text-[var(--ink)] sm:text-[16px]">
                                    {formatStudyTime(
                                        studySeconds
                                    )}
                                </p>

                                <p className="mt-0.5 text-[12px] font-medium text-[var(--muted)]">
                                    Thời gian học
                                </p>
                            </div>
                        </div>

                        <span className="h-9 w-px shrink-0 bg-[var(--line)]" />

                        <div className="flex min-w-0 flex-1 items-center gap-2.5">
                            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[var(--success-soft)] text-[var(--success)]">
                                <BookOpen
                                    size={17}
                                    strokeWidth={1.9}
                                />
                            </span>

                            <div className="min-w-0">
                                <p className="text-[15px] font-bold leading-tight tracking-tight text-[var(--ink)] sm:text-[16px]">
                                    {completedLessons}
                                </p>

                                <p className="mt-0.5 text-[12px] font-medium text-[var(--muted)]">
                                    bài hoàn thành
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="border-t border-[var(--line)] pt-3 sm:w-[360px] sm:shrink-0 sm:border-l sm:border-t-0 sm:pl-6 sm:pt-0">
                    <p className="text-[12px] font-medium text-[var(--muted)]">
                        Tuần này
                    </p>

                    <div className="mt-2 grid grid-cols-7 gap-1.5">
                        {WEEKDAY_LABELS.map((label, index) => {
                            const day = weekActivity[index];
                            const isToday = day?.date === today;
                            const studied = Boolean(day?.studied);

                            return (
                                <div
                                    key={label}
                                    className="flex flex-col items-center gap-1"
                                >
                                    <span
                                        aria-hidden="true"
                                        className={[
                                            "flex h-7 w-7 items-center justify-center rounded-full transition-colors",
                                            studied
                                                ? "bg-[var(--brand-solid)] text-white"
                                                : "bg-[var(--surface-2)]",
                                            isToday
                                                ? "ring-2 ring-[var(--brand)]/30 ring-offset-1 ring-offset-[var(--surface)]"
                                                : "",
                                        ].join(" ")}
                                    >
                                        {studied && (
                                            <Check
                                                size={12}
                                                strokeWidth={2.6}
                                            />
                                        )}
                                    </span>

                                    <span
                                        className={[
                                            "text-[12px] font-medium",
                                            isToday
                                                ? "text-[var(--brand-text)]"
                                                : studied
                                                    ? "text-[var(--ink-2)]"
                                                    : "text-[var(--muted)]",
                                        ].join(" ")}
                                    >
                                        {label}
                                    </span>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        </section>
    );
};

export default StudentProgressSummary;
