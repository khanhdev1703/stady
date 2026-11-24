import { useEffect, useRef } from "react";

import { PartyPopper, X } from "lucide-react";

const CONFETTI_COLORS = [
  "#E89A00",
  "#FFC94A",
  "#C77700",
  "#FDE7BF",
  "#1C3766",
  "#5B8DEF",
];

const CONFETTI_DURATION_MS = 6500;
const CONFETTI_EMIT_MS = 3600;
const CONFETTI_FADE_START_MS = 4800;

// Pháo dây vẽ trên canvas độ phân giải 1x: hạt nhỏ nên vẫn nét,
// mà mỗi khung hình chỉ phải tô một phần tư số điểm ảnh so với 2x.
// Hạt được thả dần trong 2,4 giây đầu để hiệu ứng dài mà vẫn nhẹ.
const Confetti = () => {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;

    if (!canvas) return undefined;

    if (
      window.matchMedia(
        "(prefers-reduced-motion: reduce)"
      ).matches
    ) {
      return undefined;
    }

    const context = canvas.getContext("2d", {
      alpha: true,
    });

    if (!context) return undefined;

    const isSmall = window.innerWidth < 640;
    const maxParticles = isSmall ? 110 : 160;

    let frame = 0;
    let startedAt = 0;
    let lastAt = 0;
    let lastEmitAt = 0;
    let width = 0;
    let height = 0;

    const particles = [];

    const resize = () => {
      width = canvas.clientWidth;
      height = canvas.clientHeight;
      canvas.width = Math.max(1, Math.floor(width));
      canvas.height = Math.max(1, Math.floor(height));
    };

    resize();
    window.addEventListener("resize", resize);

    const spawn = (count) => {
      for (let index = 0; index < count; index += 1) {
        if (particles.length >= maxParticles) return;

        particles.push({
          x: Math.random() * width,
          y: -20 - Math.random() * 60,
          w: 5 + Math.random() * 6,
          h: 8 + Math.random() * 8,
          vx: (Math.random() - 0.5) * 70,
          vy: 30 + Math.random() * 70,
          rot: Math.random() * Math.PI,
          spin: (Math.random() - 0.5) * 5,
          color:
            CONFETTI_COLORS[
              (Math.random() * CONFETTI_COLORS.length) |
                0
            ],
          round: Math.random() < 0.35,
        });
      }
    };

    spawn(isSmall ? 35 : 55);

    const draw = (time) => {
      if (!startedAt) {
        startedAt = time;
        lastAt = time;
        lastEmitAt = time;
      }

      const elapsed = time - startedAt;
      const delta = Math.min(40, time - lastAt) / 1000;

      lastAt = time;

      if (
        elapsed < CONFETTI_EMIT_MS &&
        time - lastEmitAt >= 130
      ) {
        lastEmitAt = time;
        spawn(isSmall ? 3 : 4);
      }

      context.clearRect(0, 0, width, height);

      const fade =
        elapsed <= CONFETTI_FADE_START_MS
          ? 1
          : Math.max(
            0,
            1 -
            (elapsed - CONFETTI_FADE_START_MS) /
            (CONFETTI_DURATION_MS -
              CONFETTI_FADE_START_MS)
          );

      context.globalAlpha = fade;

      for (
        let index = particles.length - 1;
        index >= 0;
        index -= 1
      ) {
        const particle = particles[index];

        particle.vy += 95 * delta;
        particle.x += particle.vx * delta;
        particle.y += particle.vy * delta;
        particle.rot += particle.spin * delta;

        if (
          particle.y - 40 > height ||
          particle.x < -60 ||
          particle.x > width + 60
        ) {
          particles.splice(index, 1);
          continue;
        }

        context.save();
        context.translate(particle.x, particle.y);
        context.rotate(particle.rot);
        context.fillStyle = particle.color;

        if (particle.round) {
          context.beginPath();
          context.arc(
            0,
            0,
            particle.w / 2,
            0,
            Math.PI * 2
          );
          context.fill();
        } else {
          context.fillRect(
            -particle.w / 2,
            -particle.h / 2,
            particle.w,
            particle.h
          );
        }

        context.restore();
      }

      if (
        elapsed < CONFETTI_DURATION_MS ||
        particles.length > 0
      ) {
        frame = requestAnimationFrame(draw);
      } else {
        context.clearRect(0, 0, width, height);
      }
    };

    frame = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 h-full w-full"
    />
  );
};

// ==========================================
// Chúc mừng hoàn thành khóa học
//
// Modal không tự chuyển trang, đóng được bằng nút, phím Esc
// hoặc chạm nền; chỉ hiện sau khi không còn đề/video đang mở.
// ==========================================

const CourseCompletionCelebration = ({
  open,
  courseTitle,
  onClose,
  onViewCourses,
  onViewCertificate,
}) => {
  const primaryRef = useRef(null);
  const dialogRef = useRef(null);

  useEffect(() => {
    if (!open) return undefined;

    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        onClose();
        return;
      }

      if (event.key !== "Tab") return;

      const focusable = dialogRef.current?.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );

      if (!focusable?.length) return;

      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (
        !event.shiftKey &&
        document.activeElement === last
      ) {
        event.preventDefault();
        first.focus();
      }
    };

    const focusTimer = setTimeout(
      () => primaryRef.current?.focus(),
      80
    );

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener(
        "keydown",
        handleKeyDown
      );
      clearTimeout(focusTimer);
    };
  }, [open, onClose]);

  // Khoá cuộn nền trong lúc hiện modal.
  useEffect(() => {
    if (!open) return undefined;

    const scroller = document.querySelector("main");
    const previous = scroller?.style.overflow;

    if (scroller) {
      scroller.style.overflow = "hidden";
    }

    return () => {
      if (scroller) {
        scroller.style.overflow = previous || "";
      }
    };
  }, [open]);

  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="course-completed-title"
      className="completion-dialog fixed inset-0 z-[60] flex items-end justify-center bg-black/50 sm:items-center sm:px-4"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
    >
      <Confetti />

      <div
        ref={dialogRef}
        onMouseDown={(event) => event.stopPropagation()}
        className="completion-card relative z-10 w-full max-w-[420px] overflow-hidden rounded-t-3xl border border-[var(--line)] bg-[var(--surface)] shadow-xl sm:rounded-3xl"
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Đóng"
          className="absolute right-2 top-2 z-20 flex h-11 w-11 items-center justify-center rounded-full text-[var(--faint)] transition hover:bg-[var(--surface-2)] hover:text-[var(--ink-2)]"
        >
          <X size={18} />
        </button>

        <div className="relative overflow-hidden bg-[var(--brand-tint)] px-5 pb-5 pt-8 text-center">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 overflow-hidden"
          >
            <span className="absolute -left-8 top-5 h-20 w-20 rounded-full border border-[var(--brand-soft)]" />
            <span className="absolute -right-6 top-1 h-16 w-16 rounded-full border border-[var(--brand-soft)]" />
            <span className="absolute bottom-2 left-1/2 h-24 w-24 -translate-x-1/2 rounded-full border border-[var(--brand-soft)]" />
          </div>

          <div className="relative mx-auto flex h-16 w-16 items-center justify-center rounded-2xl border border-[var(--brand-soft)] bg-[var(--surface)] text-[var(--brand-solid)] shadow-sm">
            <PartyPopper size={28} strokeWidth={1.7} />
          </div>
        </div>

        <div className="px-5 pb-5 pt-4 text-center">
          <h2
            id="course-completed-title"
            className="text-lg font-semibold tracking-tight text-[var(--ink)]"
          >
            Chúc mừng bạn đã hoàn thành khóa học!
          </h2>

          {courseTitle && (
            <p className="mt-2 text-[13px] font-semibold leading-6 text-[var(--brand-text)]">
              {courseTitle}
            </p>
          )}

          <p className="mt-1.5 text-[13px] leading-6 text-[var(--muted)]">
            Toàn bộ bài học đã hoàn thành. Bạn có thể nhận
            chứng nhận của khóa học này.
          </p>
        </div>

        <div className="flex flex-col gap-2 border-t border-[var(--line)] px-5 py-4 pb-[calc(1rem_+_env(safe-area-inset-bottom))] sm:flex-row-reverse sm:pb-4">
          <button
            ref={primaryRef}
            type="button"
            onClick={onViewCertificate}
            className="inline-flex h-11 w-full items-center justify-center rounded-full bg-[var(--brand-solid)] px-5 text-[13px] font-semibold text-white transition hover:bg-[var(--brand-solid-hover)] sm:w-auto sm:flex-1"
          >
            Nhận chứng nhận
          </button>

          <button
            type="button"
            onClick={onViewCourses}
            className="inline-flex h-11 w-full items-center justify-center rounded-full border border-[var(--line)] px-5 text-[13px] font-medium text-[var(--muted)] transition hover:bg-[var(--surface-3)] sm:w-auto sm:flex-1"
          >
            Khóa học của tôi
          </button>
        </div>
      </div>
    </div>
  );
};

export default CourseCompletionCelebration;
