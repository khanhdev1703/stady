import notificationRepository from "./notification.repository.js";
import { emitNotification } from "./notification.events.js";

import {
    EXPIRING_WINDOW_DAYS,
    buildExpiryBody,
    formatDateVN,
    getDaysLeft,
} from "./notification.helpers.js";

const logNotificationError = (action, error) => {
    console.error(
        `[notification] ${action} failed:`,
        error
    );
};

const toNotificationItem = (notification) => ({
    id: notification.id,
    type: notification.type,
    title: notification.title,
    body: notification.body,
    data: notification.data || null,
    isRead: notification.isRead,
    readAt: notification.readAt,
    createdAt: notification.createdAt,
});

const notificationService = {
    // ==========================================
    // Enrollment created by teacher
    // ==========================================

    async notifyEnrollmentCreated({
        studentId,
        course,
        enrollment,
    }) {
        try {
            const created =
                await notificationRepository.create({
                    recipientId: studentId,
                    type: "COURSE_ENROLLED",
                    title: "Bạn đã được thêm vào khóa học",
                    body: `Giáo viên đã thêm bạn vào khóa "${course.title}". Thời hạn đến ${formatDateVN(enrollment.expiresAt)}.`,
                    data: {
                        courseId: course.id,
                        courseTitle: course.title,
                        enrollmentId: enrollment.id,
                        expiresAt: enrollment.expiresAt,
                    },
                    dedupeKey: `enroll:${enrollment.id}`,
                });

            emitNotification(
                studentId,
                toNotificationItem(created)
            );
        } catch (error) {
            logNotificationError(
                "notifyEnrollmentCreated",
                error
            );
        }
    },

    // ==========================================
    // Enrollment extended by teacher
    // ==========================================

    async notifyEnrollmentRenewed({
        studentId,
        course,
        enrollment,
    }) {
        try {
            const created =
                await notificationRepository.create({
                    recipientId: studentId,
                    type: "ENROLLMENT_RENEWED",
                    title: "Khóa học đã được gia hạn",
                    body: `Khóa "${course.title}" được gia hạn đến ${formatDateVN(enrollment.expiresAt)}.`,
                    data: {
                        courseId: course.id,
                        courseTitle: course.title,
                        enrollmentId: enrollment.id,
                        expiresAt: enrollment.expiresAt,
                    },
                    dedupeKey: `renew:${enrollment.id}:${new Date(enrollment.expiresAt).toISOString()}`,
                });

            emitNotification(
                studentId,
                toNotificationItem(created)
            );
        } catch (error) {
            logNotificationError(
                "notifyEnrollmentRenewed",
                error
            );
        }
    },

    // ==========================================
    // Enrollment removed by teacher
    // ==========================================

    async notifyEnrollmentRemoved({
        studentId,
        course,
        enrollmentId,
    }) {
        try {
            const created =
                await notificationRepository.create({
                    recipientId: studentId,
                    type: "ENROLLMENT_REMOVED",
                    title: "Bạn đã được xoá khỏi khóa học",
                    body: `Bạn không còn quyền truy cập khóa "${course.title}".`,
                    data: {
                        courseId: course.id,
                        courseTitle: course.title,
                    },
                    dedupeKey: `remove:${enrollmentId}`,
                });

            emitNotification(
                studentId,
                toNotificationItem(created)
            );
        } catch (error) {
            logNotificationError(
                "notifyEnrollmentRemoved",
                error
            );
        }
    },

    // ==========================================
    // New lesson added to a course
    // ==========================================

    async notifyLessonAdded({ course, lesson }) {
        if (!course.status) {
            return;
        }

        try {
            const enrollments =
                await notificationRepository.findActiveStudentIdsByCourse(
                    course.id
                );

            const results = await Promise.allSettled(
                enrollments.map((enrollment) =>
                    notificationRepository.create({
                        recipientId: enrollment.studentId,
                        type: "LESSON_ADDED",
                        title: `Bài học mới: ${lesson.title}`,
                        body: `Khóa "${course.title}" vừa có bài học mới.`,
                        data: {
                            courseId: course.id,
                            courseTitle: course.title,
                            lessonId: lesson.id,
                            lessonTitle: lesson.title,
                        },
                        dedupeKey: `lesson:${lesson.id}`,
                    })
                )
            );

            results.forEach((result, index) => {
                if (result.status !== "fulfilled") {
                    return;
                }

                emitNotification(
                    enrollments[index].studentId,
                    toNotificationItem(result.value)
                );
            });
        } catch (error) {
            logNotificationError(
                "notifyLessonAdded",
                error
            );
        }
    },

    // ==========================================
    // Notification list for student
    // ==========================================

    async listForStudent({
        studentId,
        cursor = null,
        limit = 20,
        unreadOnly = false,
    }) {
        const now = new Date();
        const until = new Date(
            now.getTime() +
                EXPIRING_WINDOW_DAYS * 24 * 60 * 60 * 1000
        );

        const [rows, unreadCount, expiringEnrollments] =
            await Promise.all([
                notificationRepository.findByRecipient({
                    recipientId: studentId,
                    cursor,
                    limit,
                    unreadOnly,
                }),
                notificationRepository.countUnread(studentId),
                notificationRepository.findExpiringEnrollments({
                    studentId,
                    now,
                    until,
                }),
            ]);

        const hasMore = rows.length > limit;
        const pageRows = hasMore
            ? rows.slice(0, limit)
            : rows;

        const warnings = expiringEnrollments.map(
            (enrollment) => {
                const daysLeft = getDaysLeft(
                    enrollment.expiresAt,
                    now
                );

                return {
                    id: `expiring:${enrollment.id}`,
                    type: "ENROLLMENT_EXPIRING",
                    title: "Khóa học sắp hết hạn",
                    body: buildExpiryBody(
                        enrollment.course.title,
                        daysLeft
                    ),
                    data: {
                        courseId: enrollment.courseId,
                        courseTitle:
                            enrollment.course.title,
                        enrollmentId: enrollment.id,
                        expiresAt: enrollment.expiresAt,
                    },
                    daysLeft,
                    isRead: false,
                    readAt: null,
                    createdAt: null,
                };
            }
        );

        return {
            items: pageRows.map(toNotificationItem),
            warnings,
            nextCursor: hasMore
                ? pageRows[pageRows.length - 1].id
                : null,
            unreadCount,
        };
    },

    // ==========================================
    // Unread count
    // ==========================================

    async getUnreadCount(studentId) {
        const unreadCount =
            await notificationRepository.countUnread(
                studentId
            );

        return { unreadCount };
    },

    // ==========================================
    // Mark read
    // ==========================================

    async markRead({ notificationId, studentId }) {
        const updated =
            await notificationRepository.markRead({
                id: notificationId,
                recipientId: studentId,
            });

        return { updated };
    },

    async markAllRead(studentId) {
        const updated =
            await notificationRepository.markAllRead(
                studentId
            );

        return { updated };
    },
};

export default notificationService;
