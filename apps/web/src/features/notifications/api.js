import apiClient from "@/lib/apiClient";

const notificationApi = {
    async getList({
        cursor,
        limit = 20,
        unreadOnly = false,
    } = {}) {
        const response = await apiClient.get(
            "/notifications",
            {
                params: {
                    limit,
                    ...(cursor ? { cursor } : {}),
                    ...(unreadOnly ? { unread: "true" } : {}),
                },
            }
        );

        return response.data;
    },

    async getUnreadCount() {
        const response = await apiClient.get(
            "/notifications/unread-count"
        );

        return response.data;
    },

    async markRead(notificationId) {
        const response = await apiClient.patch(
            `/notifications/${notificationId}/read`
        );

        return response.data;
    },

    async markAllRead() {
        const response = await apiClient.patch(
            "/notifications/read-all"
        );

        return response.data;
    },
};

export default notificationApi;
