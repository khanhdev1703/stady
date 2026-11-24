import { useEffect } from "react";

import learningApi from "@/features/learning/api.js";

const TICK_MS = 1000;
const FLUSH_MS = 15000;

// Đếm thời gian thực tế khi trang bài học đang mở và tab
// đang hiển thị. Quiz là modal trong trang này nên thời gian
// làm quiz cũng được cộng vào bài.
const useLessonStudyTimer = (lessonId) => {
    useEffect(() => {
        if (!lessonId) return undefined;

        let seconds = 0;
        let flushing = false;

        const tick = window.setInterval(() => {
            if (document.visibilityState === "visible") {
                seconds += 1;
            }
        }, TICK_MS);

        const flush = async () => {
            if (seconds < 1 || flushing) return;

            const payload = seconds;
            seconds = 0;
            flushing = true;

            try {
                await learningApi.addLessonTime(
                    lessonId,
                    payload
                );
            } catch (error) {
                const status = error?.response?.status;

                console.error(
                    "Update lesson study time error:",
                    error
                );

                // Mất quyền học thì dừng đếm, không thử lại.
                if (status !== 401 && status !== 403) {
                    seconds += payload;
                }
            } finally {
                flushing = false;
            }
        };

        const flushTimer = window.setInterval(
            flush,
            FLUSH_MS
        );

        const handleVisibility = () => {
            if (document.visibilityState === "hidden") {
                flush();
            }
        };

        document.addEventListener(
            "visibilitychange",
            handleVisibility
        );
        window.addEventListener("pagehide", flush);

        return () => {
            window.clearInterval(tick);
            window.clearInterval(flushTimer);
            document.removeEventListener(
                "visibilitychange",
                handleVisibility
            );
            window.removeEventListener("pagehide", flush);
            flush();
        };
    }, [lessonId]);
};

export default useLessonStudyTimer;
