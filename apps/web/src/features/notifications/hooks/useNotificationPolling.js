import { useEffect } from "react";

import useNotificationStore from "@/stores/notificationStore";

const POLL_INTERVAL = 60000;

const useNotificationPolling = () => {
    const fetchUnreadCount = useNotificationStore(
        (state) => state.fetchUnreadCount
    );

    useEffect(() => {
        fetchUnreadCount({ force: true });

        const handleFocus = () => {
            fetchUnreadCount({ force: true });
        };

        const handleVisibilityChange = () => {
            if (
                document.visibilityState === "visible"
            ) {
                fetchUnreadCount({ force: true });
            }
        };

        window.addEventListener("focus", handleFocus);
        document.addEventListener(
            "visibilitychange",
            handleVisibilityChange
        );

        const interval = setInterval(() => {
            if (
                document.visibilityState === "visible"
            ) {
                fetchUnreadCount();
            }
        }, POLL_INTERVAL);

        return () => {
            window.removeEventListener(
                "focus",
                handleFocus
            );
            document.removeEventListener(
                "visibilitychange",
                handleVisibilityChange
            );
            clearInterval(interval);
        };
    }, [fetchUnreadCount]);
};

export default useNotificationPolling;
