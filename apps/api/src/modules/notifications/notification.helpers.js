const EXPIRING_WINDOW_DAYS = 7;
const MS_PER_DAY = 24 * 60 * 60 * 1000;

const toDate = (value) =>
    value instanceof Date ? value : new Date(value);

const formatDateVN = (value) => {
    if (!value) {
        return "";
    }

    return new Intl.DateTimeFormat("vi-VN", {
        timeZone: "Asia/Ho_Chi_Minh",
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
    }).format(toDate(value));
};

const getDaysLeft = (expiresAt, now = new Date()) => {
    return Math.ceil(
        (toDate(expiresAt).getTime() - toDate(now).getTime()) /
            MS_PER_DAY
    );
};

const isExpiringSoon = (expiresAt, now = new Date()) => {
    const daysLeft = getDaysLeft(expiresAt, now);

    return daysLeft >= 0 && daysLeft <= EXPIRING_WINDOW_DAYS;
};

const buildExpiryBody = (courseTitle, daysLeft) => {
    if (daysLeft <= 0) {
        return `Khóa "${courseTitle}" hết hạn hôm nay. Liên hệ giáo viên để gia hạn.`;
    }

    return `Khóa "${courseTitle}" còn ${daysLeft} ngày. Liên hệ giáo viên để gia hạn.`;
};

export {
    EXPIRING_WINDOW_DAYS,
    buildExpiryBody,
    formatDateVN,
    getDaysLeft,
    isExpiringSoon,
};
