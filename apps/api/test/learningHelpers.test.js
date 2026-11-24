import test from "node:test";
import assert from "node:assert/strict";

import {
    buildCertificateCode,
    buildFreeEnrollmentWindow,
    getCourseCompletionDate,
    getLessonStudySeconds,
    getStudyDateKey,
    getWeekDateKeys,
    getWeekStartKey,
    isSelfEnrollableCourse,
    shiftDateKey,
    sortByRecentStudy,
} from "../src/modules/learning/learning.helpers.js";

const course = {
    price: 0,
    status: true,
    isDelete: false,
    durationMonths: 3,
};

test("chỉ khóa miễn phí đang mở và chưa xóa mới tự ghi danh được", () => {
    assert.equal(isSelfEnrollableCourse(course), true);
    assert.equal(isSelfEnrollableCourse({ ...course, price: 299 }), false);
    assert.equal(isSelfEnrollableCourse({ ...course, status: false }), false);
    assert.equal(isSelfEnrollableCourse({ ...course, isDelete: true }), false);
    assert.equal(isSelfEnrollableCourse(null), false);
});

test("khóa miễn phí có thời hạn theo durationMonths", () => {
    const now = new Date("2026-01-15T08:00:00.000Z");
    const window = buildFreeEnrollmentWindow({
        now,
        durationMonths: 3,
    });

    assert.equal(window.enrolledAt, now);
    assert.equal(
        window.expiresAt.toISOString(),
        "2026-04-15T08:00:00.000Z"
    );
});

test("thời hạn mặc định là 6 tháng khi khóa không khai báo", () => {
    const now = new Date("2026-01-15T08:00:00.000Z");
    const window = buildFreeEnrollmentWindow({
        now,
        durationMonths: 0,
    });

    assert.equal(
        window.expiresAt.toISOString(),
        "2026-07-15T08:00:00.000Z"
    );
});

test("khóa học xếp theo lần học gần nhất, khóa chưa học xuống cuối", () => {
    const sorted = sortByRecentStudy([
        {
            id: "never-studied-new",
            enrolledAt: "2026-03-01T00:00:00.000Z",
            lastStudiedAt: null,
        },
        {
            id: "studied-old",
            enrolledAt: "2026-01-01T00:00:00.000Z",
            lastStudiedAt: "2026-02-01T00:00:00.000Z",
        },
        {
            id: "never-studied-old",
            enrolledAt: "2026-01-15T00:00:00.000Z",
            lastStudiedAt: null,
        },
        {
            id: "studied-recent",
            enrolledAt: "2026-02-01T00:00:00.000Z",
            lastStudiedAt: "2026-03-05T00:00:00.000Z",
        },
    ]);

    assert.deepEqual(
        sorted.map((item) => item.id),
        [
            "studied-recent",
            "studied-old",
            "never-studied-new",
            "never-studied-old",
        ]
    );
});

test("ngày hoàn thành khóa học là lần hoàn thành muộn nhất", () => {
    const completedAt = getCourseCompletionDate([
        { completedAt: new Date("2026-03-01T10:00:00.000Z") },
        { completedAt: null },
        { completedAt: new Date("2026-03-05T09:30:00.000Z") },
        { completedAt: new Date("2026-03-03T08:00:00.000Z") },
    ]);

    assert.equal(
        completedAt.toISOString(),
        "2026-03-05T09:30:00.000Z"
    );
});

test("chưa hoàn thành bài nào thì chưa có ngày hoàn thành", () => {
    assert.equal(
        getCourseCompletionDate([
            { completedAt: null },
            { completedAt: null },
        ]),
        null
    );

    assert.equal(getCourseCompletionDate(), null);
});

test("mã chứng nhận có tiền tố STADY và 8 ký tự hex", () => {
    const code = buildCertificateCode();

    assert.match(code, /^STADY-[0-9A-F]{8}$/);
    assert.notEqual(code, buildCertificateCode());
});

test("ngày học tính theo múi giờ Việt Nam", () => {
    assert.equal(
        getStudyDateKey(
            new Date("2026-11-24T18:30:00.000Z")
        ),
        "2026-11-25"
    );

    assert.equal(
        getStudyDateKey(
            new Date("2026-11-24T16:59:00.000Z")
        ),
        "2026-11-24"
    );

    assert.equal(getStudyDateKey(null), null);
    assert.equal(getStudyDateKey(undefined), null);
});

test("dịch ngày qua ranh giới tháng", () => {
    assert.equal(
        shiftDateKey("2026-03-01", -1),
        "2026-02-28"
    );

    assert.equal(
        shiftDateKey("2026-12-31", 1),
        "2027-01-01"
    );
});

test("tuần bắt đầu từ thứ Hai", () => {
    assert.equal(
        getWeekStartKey("2026-11-24"),
        "2026-11-23"
    );

    assert.equal(
        getWeekStartKey("2026-11-23"),
        "2026-11-23"
    );

    assert.equal(
        getWeekStartKey("2026-11-29"),
        "2026-11-23"
    );
});

test("tuần trả đủ 7 ngày từ thứ Hai tới Chủ nhật", () => {
    assert.deepEqual(getWeekDateKeys("2026-11-24"), [
        "2026-11-23",
        "2026-11-24",
        "2026-11-25",
        "2026-11-26",
        "2026-11-27",
        "2026-11-28",
        "2026-11-29",
    ]);
});

test("thời gian học ưu tiên số đo thực tế, chưa có thì lấy mốc video", () => {
    const base = {
        completedAt: new Date("2026-11-24T00:00:00.000Z"),
        timeSpentSeconds: 0,
        videoDurationSeconds: 240,
        videoPositionSeconds: 220,
    };

    assert.equal(getLessonStudySeconds(base), 240);

    assert.equal(
        getLessonStudySeconds({
            ...base,
            completedAt: null,
            videoPositionSeconds: 120,
        }),
        120
    );

    assert.equal(
        getLessonStudySeconds({
            ...base,
            timeSpentSeconds: 300,
        }),
        300
    );

    assert.equal(getLessonStudySeconds(null), 0);

    assert.equal(
        getLessonStudySeconds({
            completedAt: null,
            timeSpentSeconds: 0,
            videoDurationSeconds: 0,
            videoPositionSeconds: 0,
        }),
        0
    );
});
