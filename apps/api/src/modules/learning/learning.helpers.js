// src/modules/learning/learning.helpers.js

import { randomBytes } from "node:crypto";

const DEFAULT_FREE_COURSE_MONTHS = 6;
const STUDY_TIME_ZONE = "Asia/Ho_Chi_Minh";

const studyDateFormatter = new Intl.DateTimeFormat("en-GB", {
  timeZone: STUDY_TIME_ZONE,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

export const isSelfEnrollableCourse = (course) =>
  Boolean(
    course &&
      !course.isDelete &&
      course.status &&
      Number(course.price || 0) <= 0
  );

export const buildFreeEnrollmentWindow = ({
  now = new Date(),
  durationMonths,
} = {}) => {
  const months =
    Number(durationMonths) > 0
      ? Number(durationMonths)
      : DEFAULT_FREE_COURSE_MONTHS;

  const expiresAt = new Date(now);
  expiresAt.setMonth(expiresAt.getMonth() + months);

  return { enrolledAt: now, expiresAt };
};

const toTime = (value) => {
  const time = value ? new Date(value).getTime() : 0;

  return Number.isFinite(time) ? time : 0;
};

export const sortByRecentStudy = (courses = []) =>
  [...courses].sort((a, b) => {
    const studiedDiff =
      toTime(b.lastStudiedAt) - toTime(a.lastStudiedAt);

    if (studiedDiff !== 0) return studiedDiff;

    return toTime(b.enrolledAt) - toTime(a.enrolledAt);
  });

export const buildCertificateCode = () =>
  `STADY-${randomBytes(4).toString("hex").toUpperCase()}`;

export const getCourseCompletionDate = (progresses = []) =>
  progresses.reduce((latest, progress) => {
    if (!progress.completedAt) return latest;
    if (!latest) return progress.completedAt;

    return progress.completedAt > latest
      ? progress.completedAt
      : latest;
  }, null);

export const getStudyDateKey = (value) => {
  if (value === null || value === undefined) {
    return null;
  }

  const date = value instanceof Date ? value : new Date(value);

  if (Number.isNaN(date.getTime())) return null;

  const parts = studyDateFormatter.formatToParts(date);
  const part = (type) =>
    parts.find((item) => item.type === type)?.value;

  return `${part("year")}-${part("month")}-${part("day")}`;
};

export const shiftDateKey = (key, days) => {
  const [year, month, day] = (key || "")
    .split("-")
    .map(Number);

  if (!year || !month || !day) return null;

  const date = new Date(Date.UTC(year, month - 1, day));
  date.setUTCDate(date.getUTCDate() + days);

  return date.toISOString().slice(0, 10);
};

export const getWeekStartKey = (key) => {
  const [year, month, day] = (key || "")
    .split("-")
    .map(Number);

  if (!year || !month || !day) return null;

  const weekday = new Date(
    Date.UTC(year, month - 1, day)
  ).getUTCDay();

  return shiftDateKey(key, -((weekday + 6) % 7));
};

export const getWeekDateKeys = (key) => {
  const startKey = getWeekStartKey(key);

  if (!startKey) return [];

  return Array.from({ length: 7 }, (_, index) =>
    shiftDateKey(startKey, index)
  );
};

export const getLessonStudySeconds = (progress) => {
  if (!progress) return 0;

  const tracked = Number(progress.timeSpentSeconds) || 0;

  if (tracked > 0) return tracked;

  const duration = Number(progress.videoDurationSeconds) || 0;
  const position = Number(progress.videoPositionSeconds) || 0;

  return progress.completedAt
    ? duration || position
    : position;
};
