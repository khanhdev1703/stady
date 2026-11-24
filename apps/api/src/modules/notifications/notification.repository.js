import { prisma } from "../../config/database.js";

const notificationRepository = {
    // ==========================================
    // Create notification, skip when dedupeKey exists
    // ==========================================

    async create(data) {
        return prisma.notification.upsert({
            where: {
                recipientId_dedupeKey: {
                    recipientId: data.recipientId,
                    dedupeKey: data.dedupeKey,
                },
            },
            update: {},
            create: data,
        });
    },

    // ==========================================
    // Notifications of one student
    // ==========================================

    async findByRecipient({
        recipientId,
        cursor,
        limit,
        unreadOnly,
    }) {
        return prisma.notification.findMany({
            where: {
                recipientId,
                ...(unreadOnly ? { isRead: false } : {}),
            },
            orderBy: [{ createdAt: "desc" }, { id: "desc" }],
            take: limit + 1,
            ...(cursor
                ? {
                    cursor: { id: cursor },
                    skip: 1,
                }
                : {}),
        });
    },

    // ==========================================
    // Unread count
    // ==========================================

    async countUnread(recipientId) {
        return prisma.notification.count({
            where: {
                recipientId,
                isRead: false,
            },
        });
    },

    // ==========================================
    // Mark one notification as read
    // ==========================================

    async markRead({ id, recipientId }) {
        const result = await prisma.notification.updateMany({
            where: {
                id,
                recipientId,
            },
            data: {
                isRead: true,
                readAt: new Date(),
            },
        });

        return result.count;
    },

    // ==========================================
    // Mark every notification as read
    // ==========================================

    async markAllRead(recipientId) {
        const result = await prisma.notification.updateMany({
            where: {
                recipientId,
                isRead: false,
            },
            data: {
                isRead: true,
                readAt: new Date(),
            },
        });

        return result.count;
    },

    // ==========================================
    // Students who can still study the course
    // ==========================================

    async findActiveStudentIdsByCourse(courseId) {
        return prisma.enrollment.findMany({
            where: {
                courseId,
                expiresAt: {
                    gt: new Date(),
                },
                student: {
                    isDelete: false,
                },
            },
            select: {
                studentId: true,
            },
        });
    },

    // ==========================================
    // Enrollments that expire within the window
    // ==========================================

    async findExpiringEnrollments({
        studentId,
        now,
        until,
    }) {
        return prisma.enrollment.findMany({
            where: {
                studentId,
                expiresAt: {
                    gt: now,
                    lte: until,
                },
                course: {
                    status: true,
                    isDelete: false,
                },
            },
            include: {
                course: {
                    select: {
                        id: true,
                        title: true,
                    },
                },
            },
            orderBy: {
                expiresAt: "asc",
            },
        });
    },
};

export default notificationRepository;
