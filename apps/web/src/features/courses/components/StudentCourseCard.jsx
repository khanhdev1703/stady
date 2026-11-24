// src/pages/student/courses/StudentCourseCard.jsx

import {
  ArrowRight,
  Award,
  BookOpen,
  CircleHelp,
  LockKeyhole,
  Play,
} from "lucide-react";

import { Link } from "react-router-dom";

import formatDate from "@/lib/format/formatDate.js";
import getUrl from "@/lib/getUrl.js";

const getRemainingDays = (expiresAt) => {
  if (!expiresAt) return null;

  const expiry = new Date(expiresAt);

  if (Number.isNaN(expiry.getTime())) return null;

  return Math.ceil(
    (expiry.getTime() - Date.now()) / (1000 * 60 * 60 * 24)
  );
};

const StudentCourseCard = ({ enrollment }) => {
  const course = enrollment?.course;

  if (!course) {
    return null;
  }

  // Course status:
  // true  = đang mở
  // false = tạm khoá
  const isLocked = !course.status;

  const completedLessons = course.completedLessons ?? 0;

  const totalLessons = course.totalLessons ?? 0;

  const progress =
    totalLessons > 0
      ? Math.min(
        100,
        Math.round((completedLessons / totalLessons) * 100)
      )
      : 0;

  const hasStarted = completedLessons > 0;

  const isCompleted =
    totalLessons > 0 && completedLessons >= totalLessons;

  const remainingDays = getRemainingDays(enrollment?.expiresAt);

  const isExpired =
    remainingDays !== null && remainingDays <= 0;

  const canOpen = !isLocked && !isExpired;

  const hasCertificate = Boolean(enrollment?.hasCertificate);

  // Khóa đã học xong thì luôn có đường vào chứng nhận:
  // chứng nhận chỉ được tạo khi học sinh mở trang này.
  const canViewCertificate = hasCertificate || isCompleted;

  const actionLabel = isCompleted
    ? "Xem lại"
    : hasStarted
      ? "Tiếp tục"
      : "Bắt đầu";

  const statusLabel = isExpired
    ? "Đã hết hạn"
    : isCompleted
      ? "Hoàn thành"
      : hasStarted
        ? "Đang học"
        : "Chưa bắt đầu";

  const statusTone = isExpired
    ? "text-[var(--accent)]"
    : isCompleted
      ? "text-[var(--success)]"
      : hasStarted
        ? "text-[var(--brand-text)]"
        : "text-[var(--muted)]";

  const expiringSoon =
    !isExpired &&
    remainingDays !== null &&
    remainingDays <= 7;

  const courseUrl = `/student/courses/${course.id}`;

  return (
    <article className="flex gap-3 rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-3 shadow-sm transition-colors hover:border-[var(--brand)] sm:gap-4 sm:p-4">
      <Link
        to={canOpen ? courseUrl : "#"}
        onClick={(event) => {
          if (!canOpen) {
            event.preventDefault();
          }
        }}
        aria-hidden="true"
        tabIndex={-1}
        className="relative h-[88px] w-[108px] shrink-0 overflow-hidden rounded-xl bg-[var(--brand-soft)] sm:h-[104px] sm:w-[136px]"
      >
        {course.thumbnail ? (
          <>
            <img
              src={getUrl(course.thumbnail)}
              alt=""
              loading="lazy"
              className="h-full w-full object-cover"
            />

            {!canOpen && (
              <span className="absolute inset-0 bg-black/40" />
            )}
          </>
        ) : (
          <span
            className={[
              "flex h-full w-full items-center justify-center",
              canOpen
                ? "text-[var(--brand-text)]"
                : "text-[var(--muted)]",
            ].join(" ")}
          >
            {canOpen ? (
              <BookOpen size={28} strokeWidth={1.4} />
            ) : (
              <LockKeyhole size={28} strokeWidth={1.4} />
            )}
          </span>
        )}

        {!canOpen && (
          <span className="absolute inset-0 flex items-center justify-center">
            <span className="flex items-center gap-1 rounded-full bg-[var(--surface)]/95 px-2 py-1 text-[12px] font-semibold text-[var(--muted)] shadow-sm">
              <LockKeyhole size={11} strokeWidth={2} />

              {isExpired ? "Hết hạn" : "Tạm khoá"}
            </span>
          </span>
        )}
      </Link>

      <div className="flex min-w-0 flex-1 flex-col">
        <Link
          to={canOpen ? courseUrl : "#"}
          onClick={(event) => {
            if (!canOpen) {
              event.preventDefault();
            }
          }}
          className="min-w-0"
        >
          <h2
            className={[
              "line-clamp-2 text-[14px] font-semibold leading-5 tracking-tight text-[var(--ink)] sm:text-[15px]",
              canOpen
                ? "transition-colors hover:text-[var(--brand-text)]"
                : "",
            ].join(" ")}
            title={course.title}
          >
            {course.title}
          </h2>
        </Link>

        <div className="mt-1.5 flex items-center justify-between gap-2 text-[12px] font-medium">
          <span className="text-[var(--muted)]">
            {completedLessons}/{totalLessons} bài
          </span>

          <span
            className={[
              "tabular-nums",
              isCompleted
                ? "text-[var(--success)]"
                : "text-[var(--brand-text)]",
            ].join(" ")}
          >
            {progress}%
          </span>
        </div>

        <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-[var(--brand-soft)]">
          <div
            className={[
              "h-full rounded-full transition-all duration-300",
              isCompleted
                ? "bg-[var(--success)]"
                : "bg-[var(--brand-solid)]",
            ].join(" ")}
            style={{ width: `${progress}%` }}
          />
        </div>

        <p className="mt-1.5 flex flex-wrap items-center gap-x-1.5 gap-y-0.5 text-[12px] leading-5">
          <span className={["font-medium", statusTone].join(" ")}>
            {statusLabel}
          </span>

          {enrollment?.expiresAt && (
            <span
              className={
                isExpired || expiringSoon
                  ? "text-[var(--accent)]"
                  : "text-[var(--muted)]"
              }
            >
              ·{" "}
              {isExpired
                ? formatDate(enrollment.expiresAt)
                : `Hạn ${formatDate(enrollment.expiresAt)}`}
              {expiringSoon
                ? ` (còn ${remainingDays} ngày)`
                : ""}
            </span>
          )}
        </p>

        <div className="mt-auto flex items-center gap-2 pt-2">
          {isExpired ? (
            <Link
              to="/student/profile/help"
              className="inline-flex h-11 min-w-0 flex-1 items-center justify-center gap-1.5 rounded-full border border-[var(--accent)]/30 bg-[var(--accent-soft)] px-3 text-[13px] font-semibold text-[var(--accent)]"
            >
              <CircleHelp size={14} />

              <span className="truncate">
                Liên hệ gia hạn
              </span>
            </Link>
          ) : isLocked ? (
            <span className="inline-flex h-11 min-w-0 flex-1 items-center justify-center rounded-full bg-[var(--surface-2)] px-3 text-[13px] font-semibold text-[var(--muted)]">
              Tạm khoá
            </span>
          ) : (
            <Link
              to={courseUrl}
              className={[
                "inline-flex h-11 min-w-0 flex-1 items-center justify-center gap-1.5 rounded-full px-3 text-[13px] font-semibold transition",
                isCompleted
                  ? "bg-[var(--success-soft)] text-[var(--success)] hover:bg-[var(--success-soft)]"
                  : "bg-[var(--brand-solid)] text-white hover:bg-[var(--brand-solid-hover)]",
              ].join(" ")}
            >
              {!isCompleted && (
                <Play
                  size={13}
                  strokeWidth={2.2}
                  fill="currentColor"
                />
              )}

              <span className="truncate">{actionLabel}</span>

              <ArrowRight size={14} strokeWidth={2.2} />
            </Link>
          )}

          {canViewCertificate && (
            <Link
              to={`${courseUrl}/certificate`}
              aria-label="Xem chứng nhận"
              title="Xem chứng nhận"
              className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-[var(--brand-soft)] bg-[var(--brand-tint)] text-[var(--brand-text)] transition hover:bg-[var(--brand-soft)]"
            >
              <Award size={17} strokeWidth={2} />
            </Link>
          )}
        </div>
      </div>
    </article>
  );
};

export default StudentCourseCard;
