import { useEffect } from "react";

import useAuthStore from "@/stores/authStore";
import useNotificationStore from "@/stores/notificationStore";

const API_BASE = `${import.meta.env.VITE_API_URL || ""}/api`;
const RECONNECT_DELAYS = [
    1000,
    2000,
    5000,
    10000,
    30000,
];

const useNotificationStream = () => {
    useEffect(() => {
        let cancelled = false;
        let controller = null;
        let retryTimer = null;
        let attempt = 0;

        const handleChunk = (chunk) => {
            let eventName = "message";
            const dataLines = [];

            for (const line of chunk.split("\n")) {
                if (line.startsWith(":")) {
                    continue;
                }

                if (line.startsWith("event:")) {
                    eventName = line
                        .slice(6)
                        .trim();
                } else if (line.startsWith("data:")) {
                    dataLines.push(
                        line.slice(5).trim()
                    );
                }
            }

            if (
                eventName !== "notification" ||
                dataLines.length === 0
            ) {
                return;
            }

            try {
                const payload = JSON.parse(
                    dataLines.join("\n")
                );

                if (payload?.notification) {
                    useNotificationStore
                        .getState()
                        .receiveNotification(
                            payload.notification
                        );
                }
            } catch {
                // Bỏ qua frame hỏng, giữ kết nối.
            }
        };

        const scheduleRetry = () => {
            if (cancelled) {
                return;
            }

            const delay =
                RECONNECT_DELAYS[
                    Math.min(
                        attempt,
                        RECONNECT_DELAYS.length - 1
                    )
                ];

            attempt += 1;
            retryTimer = setTimeout(connect, delay);
        };

        const connect = async () => {
            const token =
                useAuthStore.getState().accessToken;

            if (!token || cancelled) {
                return;
            }

            controller = new AbortController();

            try {
                const response = await fetch(
                    `${API_BASE}/notifications/stream`,
                    {
                        headers: {
                            Authorization: `Bearer ${token}`,
                            Accept: "text/event-stream",
                        },
                        signal: controller.signal,
                    }
                );

                if (response.status === 401) {
                    useAuthStore.getState().logout();
                    return;
                }

                if (!response.ok || !response.body) {
                    throw new Error(
                        `SSE ${response.status}`
                    );
                }

                attempt = 0;

                useNotificationStore
                    .getState()
                    .fetchUnreadCount();

                const reader =
                    response.body.getReader();
                const decoder = new TextDecoder();
                let buffer = "";

                while (!cancelled) {
                    const { value, done } =
                        await reader.read();

                    if (done) {
                        break;
                    }

                    buffer += decoder.decode(value, {
                        stream: true,
                    });

                    let boundary =
                        buffer.indexOf("\n\n");

                    while (boundary !== -1) {
                        handleChunk(
                            buffer.slice(0, boundary)
                        );
                        buffer = buffer.slice(
                            boundary + 2
                        );
                        boundary =
                            buffer.indexOf("\n\n");
                    }
                }

                if (!cancelled) {
                    throw new Error("SSE closed");
                }
            } catch (error) {
                if (
                    cancelled ||
                    error?.name === "AbortError"
                ) {
                    return;
                }

                scheduleRetry();
            }
        };

        connect();

        return () => {
            cancelled = true;
            controller?.abort();
            clearTimeout(retryTimer);
        };
    }, []);
};

export default useNotificationStream;
