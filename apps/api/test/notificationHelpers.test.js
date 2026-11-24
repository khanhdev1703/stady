import test from "node:test";
import assert from "node:assert/strict";

import {
    EXPIRING_WINDOW_DAYS,
    buildExpiryBody,
    formatDateVN,
    getDaysLeft,
    isExpiringSoon,
} from "../src/modules/notifications/notification.helpers.js";

const now = new Date("2026-11-24T03:00:00.000Z");

test("tính đúng số ngày còn lại của khóa học", () => {
    assert.equal(
        getDaysLeft(
            new Date("2026-11-27T03:00:00.000Z"),
            now
        ),
        3
    );

    assert.equal(
        getDaysLeft(
            new Date("2026-11-24T15:00:00.000Z"),
            now
        ),
        1
    );
});

test("chỉ cảnh báo khóa hết hạn trong vòng 7 ngày", () => {
    assert.equal(EXPIRING_WINDOW_DAYS, 7);

    assert.equal(
        isExpiringSoon(
            new Date("2026-12-01T03:00:00.000Z"),
            now
        ),
        true
    );

    assert.equal(
        isExpiringSoon(
            new Date("2026-12-02T03:00:00.000Z"),
            now
        ),
        false
    );

    assert.equal(
        isExpiringSoon(
            new Date("2026-11-23T03:00:00.000Z"),
            now
        ),
        false
    );
});

test("nội dung cảnh báo hết hạn đọc được", () => {
    assert.equal(
        buildExpiryBody("Toán 12", 0),
        'Khóa "Toán 12" hết hạn hôm nay. Liên hệ giáo viên để gia hạn.'
    );

    assert.equal(
        buildExpiryBody("Toán 12", 3),
        'Khóa "Toán 12" còn 3 ngày. Liên hệ giáo viên để gia hạn.'
    );
});

test("ngày hiển thị theo múi giờ Việt Nam", () => {
    assert.equal(
        formatDateVN("2026-11-24T16:30:00.000Z"),
        "24/11/2026"
    );
});
