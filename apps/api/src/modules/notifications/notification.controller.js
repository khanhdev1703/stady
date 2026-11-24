import notificationService from "./notification.service.js";
import { addClient } from "./notification.events.js";

const HEARTBEAT_INTERVAL = 25000;

const parseLimit = (value) => {
    const parsed = Number.parseInt(value, 10);

    if (Number.isNaN(parsed)) {
        return 20;
    }

    return Math.min(Math.max(parsed, 1), 50);
};

const notificationController = {
    // ==========================================
    // GET /notifications/stream
    // ==========================================

    stream(req, res) {
        res.status(200);
        res.set({
            "Content-Type":
                "text/event-stream; charset=utf-8",
            "Cache-Control": "no-cache, no-transform",
            Connection: "keep-alive",
            "X-Accel-Buffering": "no",
        });
        res.flushHeaders();

        res.write(": connected\n\n");

        const removeClient = addClient(
            req.user.id,
            res
        );

        const heartbeat = setInterval(() => {
            if (!res.writableEnded) {
                res.write(": ping\n\n");
            }
        }, HEARTBEAT_INTERVAL);

        req.on("close", () => {
            clearInterval(heartbeat);
            removeClient();

            if (!res.writableEnded) {
                res.end();
            }
        });
    },

    // ==========================================
    // GET /notifications
    // ==========================================

    async getMyNotifications(req, res, next) {
        try {
            const data =
                await notificationService.listForStudent({
                    studentId: req.user.id,
                    cursor: req.query.cursor || null,
                    limit: parseLimit(req.query.limit),
                    unreadOnly:
                        req.query.unread === "true",
                });

            return res.status(200).json({
                success: true,
                message: "Lấy thông báo thành công.",
                data,
            });
        } catch (error) {
            next(error);
        }
    },

    // ==========================================
    // GET /notifications/unread-count
    // ==========================================

    async getUnreadCount(req, res, next) {
        try {
            const data =
                await notificationService.getUnreadCount(
                    req.user.id
                );

            return res.status(200).json({
                success: true,
                message: "Lấy số thông báo chưa đọc thành công.",
                data,
            });
        } catch (error) {
            next(error);
        }
    },

    // ==========================================
    // PATCH /notifications/:notificationId/read
    // ==========================================

    async markRead(req, res, next) {
        try {
            const data =
                await notificationService.markRead({
                    notificationId: req.params.notificationId,
                    studentId: req.user.id,
                });

            return res.status(200).json({
                success: true,
                message: "Đã đánh dấu thông báo là đã đọc.",
                data,
            });
        } catch (error) {
            next(error);
        }
    },

    // ==========================================
    // PATCH /notifications/read-all
    // ==========================================

    async markAllRead(req, res, next) {
        try {
            const data =
                await notificationService.markAllRead(
                    req.user.id
                );

            return res.status(200).json({
                success: true,
                message: "Đã đánh dấu tất cả thông báo là đã đọc.",
                data,
            });
        } catch (error) {
            next(error);
        }
    },
};

export default notificationController;
