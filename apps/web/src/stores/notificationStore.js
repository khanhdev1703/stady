import { create } from "zustand";

import notificationApi from "@/features/notifications/api";

const MIN_REFRESH_INTERVAL = 15000;

const useNotificationStore = create((set, get) => ({
    unreadCount: 0,
    lastFetchedAt: 0,
    isFetching: false,
    incomingEvent: null,
    incomingNonce: 0,
    recentEventIds: [],

    fetchUnreadCount: async ({ force = false } = {}) => {
        const { isFetching, lastFetchedAt } = get();

        if (isFetching) {
            return;
        }

        if (
            !force &&
            Date.now() - lastFetchedAt <
                MIN_REFRESH_INTERVAL
        ) {
            return;
        }

        set({ isFetching: true });

        try {
            const response =
                await notificationApi.getUnreadCount();

            set({
                unreadCount:
                    response?.data?.unreadCount ?? 0,
                lastFetchedAt: Date.now(),
            });
        } catch {
            // Badge không được làm phiền người dùng khi mất mạng.
        } finally {
            set({ isFetching: false });
        }
    },

    setUnreadCount: (value) => {
        set({
            unreadCount: Math.max(0, value ?? 0),
        });
    },

    markReadLocally: (count = 1) => {
        set((state) => ({
            unreadCount: Math.max(
                0,
                state.unreadCount - count
            ),
        }));
    },

    receiveNotification: (notification) => {
        if (!notification?.id) {
            return;
        }

        set((state) => {
            if (
                state.recentEventIds.includes(
                    notification.id
                )
            ) {
                return state;
            }

            const incomingNonce =
                state.incomingNonce + 1;

            return {
                unreadCount: notification.isRead
                    ? state.unreadCount
                    : state.unreadCount + 1,
                incomingEvent: {
                    notification,
                    nonce: incomingNonce,
                },
                incomingNonce,
                recentEventIds: [
                    notification.id,
                    ...state.recentEventIds,
                ].slice(0, 50),
            };
        });
    },
}));

export default useNotificationStore;
