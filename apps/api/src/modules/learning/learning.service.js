// src/modules/learning/learning.service.js

import learningRepository from "./learning.repository.js";
import {
  buildCertificateCode,
  buildFreeEnrollmentWindow,
  getCourseCompletionDate,
  getLessonStudySeconds,
  getStudyDateKey,
  getWeekDateKeys,
  isSelfEnrollableCourse,
  sortByRecentStudy,
} from "./learning.helpers.js";

// ==========================================
// Kiểm tra học sinh được phép học bài này
// Dùng chung cho truy cập bài học và làm trắc nghiệm
// ==========================================

const assertLessonAccess = async ({
  lessonId,
  studentId,
}) => {
  const lesson =
    await learningRepository.findLessonById(lessonId);

  if (!lesson) {
    const error = new Error(
      "Không tìm thấy bài học."
    );
    error.statusCode = 404;
    throw error;
  }

  const course = lesson.course;

  if (!course) {
    const error = new Error(
      "Không tìm thấy khóa học của bài học."
    );
    error.statusCode = 404;
    throw error;
  }

  if (course.isDelete) {
    const error = new Error(
      "Khóa học đã bị xóa."
    );
    error.statusCode = 404;
    throw error;
  }

  if (!course.status) {
    const error = new Error(
      "Khóa học hiện đang tạm khóa."
    );
    error.statusCode = 403;
    throw error;
  }

  const enrollment =
    await learningRepository.findEnrollment({
      studentId,
      courseId: course.id,
    });

  // ------------------------------------------
  // Bài miễn phí: học sinh chưa đăng ký vẫn xem được.
  // Các bài còn lại bắt buộc phải tham gia khóa học.
  // ------------------------------------------

  // Bài miễn phí luôn xem được, kể cả khi chưa đăng ký
  // hoặc khóa học đã hết hạn.
  if (lesson.isFree) {
    return { lesson, course, enrollment };
  }

  if (!enrollment) {
    const error = new Error(
      "Bạn cần đăng ký khóa học để xem bài học này."
    );
    error.statusCode = 403;
    throw error;
  }

  if (enrollment.expiresAt <= new Date()) {
    const error = new Error(
      "Thời hạn học khóa học đã hết."
    );
    error.statusCode = 403;
    throw error;
  }

  return { lesson, course, enrollment };
};

// ==========================================
// Quy tắc hoàn thành bài học
//
// - Có video: xem >= 90% thời lượng.
// - Không có video: ở lại bài >= 10 giây.
// - Nếu giáo viên bật bắt buộc ôn tập:
//   phải có lượt làm đạt điểm của đề đã publish.
// ==========================================

const VIDEO_COMPLETION_RATIO = 0.9;
const READING_COMPLETION_SECONDS = 10;

const hasWatchedVideo = (progress) =>
  Boolean(
    progress &&
      progress.videoDurationSeconds > 0 &&
      progress.videoPositionSeconds >=
        Math.floor(
          progress.videoDurationSeconds *
            VIDEO_COMPLETION_RATIO
        )
  );

const hasReadLesson = (progress) =>
  Boolean(
    progress?.lastAccessedAt &&
      Date.now() -
        new Date(progress.lastAccessedAt).getTime() >=
        READING_COMPLETION_SECONDS * 1000
  );

const buildCompletionState = ({
  lesson,
  progress,
  quiz,
  quizPassed,
}) => {
  const quizRequired = Boolean(
    quiz?.requiresPassForCompletion &&
      quiz?._count?.questions > 0
  );

  const videoRequired = Boolean(lesson.video);

  return {
    isCompleted: Boolean(progress?.completedAt),
    completedAt: progress?.completedAt ?? null,
    videoRequired,
    videoCompleted: videoRequired
      ? hasWatchedVideo(progress)
      : null,
    videoPositionSeconds:
      progress?.videoPositionSeconds ?? 0,
    videoDurationSeconds:
      progress?.videoDurationSeconds ?? 0,
    quizRequired,
    quizPassed: quizRequired ? quizPassed : null,
    passingScore: quiz?.passingScore ?? null,
  };
};

const evaluateLessonCompletion = async ({
  lesson,
  studentId,
  progress,
}) => {
  const quiz =
    await learningRepository.findPublishedQuizByLesson(
      lesson.id
    );

  const quizRequired = Boolean(
    quiz?.requiresPassForCompletion &&
      quiz?._count?.questions > 0
  );

  const quizPassed = quizRequired
    ? await learningRepository.hasPassedQuizAttempt({
        quizId: quiz.id,
        studentId,
        passingScore: quiz.passingScore,
      })
    : false;

  let current = progress;

  if (current && !current.completedAt) {
    // Bài có video: phải xem đủ 90% và (nếu bật) đạt đề.
    // Bài không có video: đọc 10 giây; nếu bắt buộc đề
    // thì đạt đề là đủ, không cần chờ thêm.
    const canComplete = lesson.video
      ? hasWatchedVideo(current) &&
        (!quizRequired || quizPassed)
      : quizRequired
        ? quizPassed
        : hasReadLesson(current);

    if (canComplete) {
      current =
        await learningRepository.updateLessonProgress({
          studentId,
          lessonId: lesson.id,
          data: {
            completedAt: new Date(),
          },
        });
    }
  }

  return {
    progress: current,
    completion: buildCompletionState({
      lesson,
      progress: current,
      quiz,
      quizPassed,
    }),
  };
};

// ==========================================
// Gắn tiến độ và lần học gần nhất vào từng
// ghi danh, dùng chung cho khóa còn hạn và
// khóa đã hết hạn.
// ==========================================

const buildCourseSummaries = async ({
  enrollments,
  studentId,
}) => {
  if (enrollments.length === 0) return [];

  const courseIds = [
    ...new Set(enrollments.map((enrollment) => enrollment.courseId)),
  ];

  const [lessons, progressList] = await Promise.all([
    learningRepository.findLessonsByCourseIds(courseIds),
    learningRepository.findProgressByCourseIds({
      studentId,
      courseIds,
    }),
  ]);

  const totalByCourse = new Map();
  const completedByCourse = new Map();
  const lastStudiedByCourse = new Map();

  const increment = (map, courseId) => {
    map.set(courseId, (map.get(courseId) ?? 0) + 1);
  };

  lessons.forEach((lesson) => {
    increment(totalByCourse, lesson.courseId);
  });

  progressList.forEach((progress) => {
    const courseId = progress.lesson.courseId;
    const previous = lastStudiedByCourse.get(courseId);

    if (progress.completedAt) {
      increment(completedByCourse, courseId);
    }

    if (!previous || progress.lastAccessedAt > previous) {
      lastStudiedByCourse.set(
        courseId,
        progress.lastAccessedAt
      );
    }
  });

  return enrollments.map((enrollment) => {
    const totalLessons =
      totalByCourse.get(enrollment.courseId) ?? 0;

    const completedLessons =
      completedByCourse.get(enrollment.courseId) ?? 0;

    const progress =
      totalLessons > 0
        ? Math.round(
            (completedLessons / totalLessons) * 100
          )
        : 0;

    return {
      ...enrollment,
      lastStudiedAt:
        lastStudiedByCourse.get(enrollment.courseId) ??
        null,
      course: {
        ...enrollment.course,
        totalLessons,
        completedLessons,
        progress,
      },
    };
  });
};

const learningService = {
  assertLessonAccess,

  async getMyCourses({ studentId }) {
    const [enrollments, expiredEnrollments] =
      await Promise.all([
        learningRepository.findByStudentId(studentId),
        learningRepository.findExpiredByStudentId(studentId),
      ]);

    const activeIds = new Set(
      enrollments.map((enrollment) => enrollment.id)
    );

    const expiredIds = new Set(
      expiredEnrollments.map((enrollment) => enrollment.id)
    );

    const summaries = await buildCourseSummaries({
      enrollments: [...enrollments, ...expiredEnrollments],
      studentId,
    });

    const certificateCourseIds =
      await learningRepository.findCertificateCourseIds({
        studentId,
        courseIds: summaries.map(
          (summary) => summary.courseId
        ),
      });

    const certificateIdSet = new Set(
      certificateCourseIds
    );

    const summariesWithCertificate = summaries.map(
      (summary) => ({
        ...summary,
        hasCertificate: certificateIdSet.has(
          summary.courseId
        ),
      })
    );

    const expiredCourses = summariesWithCertificate.filter(
      (summary) => expiredIds.has(summary.id)
    );

    return {
      courses: sortByRecentStudy(
        summariesWithCertificate.filter((summary) =>
          activeIds.has(summary.id)
        )
      ),
      expiredCourses,
      expiredCount: expiredCourses.length,
    };
  },

  // ==========================================
  // Get my learning progress
  // ==========================================

  async getMyProgress({ studentId }) {
    const now = new Date();
    const todayKey = getStudyDateKey(now);
    const weekKeys = getWeekDateKeys(todayKey);

    const [progressRows, attemptRows] = await Promise.all([
      learningRepository.findProgressForStats(studentId),
      learningRepository.findQuizAttemptsForStats(studentId),
    ]);

    const activityKeys = new Set();

    const addActivity = (value) => {
      const key = getStudyDateKey(value);

      if (key) {
        activityKeys.add(key);
      }

      return key;
    };

    let studySeconds = 0;
    let completedLessons = 0;

    progressRows.forEach((progress) => {
      addActivity(progress.lastAccessedAt);
      addActivity(progress.completedAt);

      if (progress.completedAt) {
        completedLessons += 1;
      }

      studySeconds += getLessonStudySeconds(progress);
    });

    attemptRows.forEach((attempt) => {
      addActivity(attempt.startedAt);
      addActivity(attempt.submittedAt);
    });

    return {
      studySeconds,
      completedLessons,
      today: todayKey,
      weekActivity: weekKeys.map((date) => ({
        date,
        studied: activityKeys.has(date),
      })),
    };
  },

  // ==========================================
  // Student self-enrollment for free courses
  // ==========================================

  async enrollFreeCourse({ courseId, studentId }) {
    const course =
      await learningRepository.findCourseById(courseId);

    if (!course || course.isDelete) {
      const error = new Error(
        "Không tìm thấy khóa học."
      );
      error.statusCode = 404;
      throw error;
    }

    if (!course.status) {
      const error = new Error(
        "Khóa học hiện đang tạm khóa."
      );
      error.statusCode = 403;
      throw error;
    }

    if (!isSelfEnrollableCourse(course)) {
      const error = new Error(
        "Khóa học trả phí cần giáo viên ghi danh. Hãy gửi mã học sinh của bạn cho giáo viên."
      );
      error.statusCode = 400;
      throw error;
    }

    const now = new Date();

    const existing =
      await learningRepository.findEnrollment({
        studentId,
        courseId,
      });

    if (existing && existing.expiresAt > now) {
      return existing;
    }

    const window = buildFreeEnrollmentWindow({
      now,
      durationMonths: course.durationMonths,
    });

    if (existing) {
      return learningRepository.updateEnrollment(
        existing.id,
        window
      );
    }

    return learningRepository.createEnrollment({
      studentId,
      courseId,
      ...window,
    });
  },

  // ==========================================
  // Issue a course completion certificate
  // ==========================================

  async issueCertificate({ courseId, studentId }) {
    const course =
      await learningRepository.findCourseWithTeacher(
        courseId
      );

    if (!course || course.isDelete) {
      const error = new Error(
        "Không tìm thấy khóa học."
      );
      error.statusCode = 404;
      throw error;
    }

    const existing =
      await learningRepository.findCertificate({
        studentId,
        courseId,
      });

    if (existing) return existing;

    const lessons =
      await learningRepository.findLessonsByCourseIds([
        courseId,
      ]);

    if (lessons.length === 0) {
      const error = new Error(
        "Khóa học chưa có bài học."
      );
      error.statusCode = 400;
      throw error;
    }

    const progresses =
      await learningRepository.findProgressByCourseIds({
        studentId,
        courseIds: [courseId],
      });

    const completedLessons = progresses.filter(
      (progress) => progress.completedAt
    ).length;

    if (completedLessons < lessons.length) {
      const error = new Error(
        "Bạn cần hoàn thành 100% khóa học để nhận chứng nhận."
      );
      error.statusCode = 403;
      throw error;
    }

    const student =
      await learningRepository.findStudentById(
        studentId
      );

    if (!student) {
      const error = new Error(
        "Không tìm thấy học sinh."
      );
      error.statusCode = 404;
      throw error;
    }

    const completedAt =
      getCourseCompletionDate(progresses);

    for (let attempt = 0; attempt < 3; attempt += 1) {
      try {
        return await learningRepository.createCertificate({
          studentId,
          courseId,
          studentName: student.name,
          courseTitle: course.title,
          teacherName: course.teacher?.name ?? null,
          completedAt: completedAt ?? new Date(),
          code: buildCertificateCode(),
        });
      } catch (error) {
        // Mã chứng nhận trùng hoặc hai tab cùng cấp một lúc:
        // dùng bản đã có, nếu chưa có thì thử mã khác.
        if (error?.code !== "P2002") throw error;

        const raced =
          await learningRepository.findCertificate({
            studentId,
            courseId,
          });

        if (raced) return raced;
      }
    }

    const error = new Error(
      "Không thể cấp chứng nhận. Vui lòng thử lại."
    );
    error.statusCode = 500;
    throw error;
  },

  // ==========================================
  // Get course for learning
  // ==========================================

  async getCourseForLearning({
    courseId,
    studentId,
  }) {
    // ------------------------------------------
    // 1. Find course
    // ------------------------------------------

    const course =
      await learningRepository.findCourseById(
        courseId
      );

    if (!course) {
      const error = new Error(
        "Không tìm thấy khóa học."
      );
      error.statusCode = 404;
      throw error;
    }

    // ------------------------------------------
    // 2. Check soft delete
    // ------------------------------------------

    if (course.isDelete) {
      const error = new Error(
        "Khóa học đã bị xóa."
      );
      error.statusCode = 404;
      throw error;
    }

    // ------------------------------------------
    // 3. Check course status
    // true  = đang mở
    // false = tạm khóa
    // ------------------------------------------

    if (!course.status) {
      const error = new Error(
        "Khóa học hiện đang tạm khóa."
      );
      error.statusCode = 403;
      throw error;
    }

    // ------------------------------------------
    // 4. Check enrollment
    //
    // Không bắt buộc: học sinh chưa đăng ký vẫn
    // xem được các bài miễn phí.
    // ------------------------------------------

    const enrollment =
      await learningRepository.findEnrollment({
        studentId,
        courseId,
      });

    // ------------------------------------------
    // 5. Check enrollment expiration
    // ------------------------------------------

    const now = new Date();

    const hasFullAccess = Boolean(
      enrollment && enrollment.expiresAt > now
    );

    // ------------------------------------------
    // 6. Get lessons
    // ------------------------------------------

    const lessons =
      await learningRepository.findLessonsByCourseId(
        courseId
      );

    // ------------------------------------------
    // 7. Get student's progress
    // ------------------------------------------

    const progressList =
      await learningRepository.findLessonProgressByCourse({
        studentId,
        courseId,
      });

    // ------------------------------------------
    // 8. Create progress map
    // ------------------------------------------

    const progressMap = new Map(
      progressList.map((progress) => [
        progress.lessonId,
        progress,
      ])
    );

    // ------------------------------------------
    // 9. Best quiz score per lesson
    // ------------------------------------------

    const publishedQuizIds = lessons
      .filter(
        (lesson) =>
          lesson.quiz?.isPublished &&
          lesson.quiz._count.questions > 0
      )
      .map((lesson) => lesson.quiz.id);

    const quizAttempts =
      await learningRepository.findQuizAttemptScores({
        quizIds: publishedQuizIds,
        studentId,
      });

    const bestScoreMap = new Map();

    quizAttempts.forEach((attempt) => {
      const current = bestScoreMap.get(attempt.quizId);

      if (
        attempt.score !== null &&
        (current === undefined || attempt.score > current)
      ) {
        bestScoreMap.set(attempt.quizId, attempt.score);
      }
    });

    // ------------------------------------------
    // 10. Merge lesson + progress + quiz summary
    // ------------------------------------------

    const lessonsWithProgress =
      lessons.map((lesson) => {
        const progress =
          progressMap.get(lesson.id);

        // Bài không miễn phí chỉ mở khi học sinh
        // đã đăng ký khóa học.
        const isLocked =
          !hasFullAccess && !lesson.isFree;

        const quiz =
          lesson.quiz?.isPublished &&
          lesson.quiz._count.questions > 0
            ? {
              id: lesson.quiz.id,
              title: lesson.quiz.title,
              passingScore:
                lesson.quiz.passingScore,
              totalQuestions:
                lesson.quiz._count.questions,
              bestScore:
                bestScoreMap.get(lesson.quiz.id) ??
                null,
              requiresPassForCompletion: Boolean(
                lesson.quiz
                  .requiresPassForCompletion
              ),
              quizPassed:
                (bestScoreMap.get(lesson.quiz.id) ??
                  null) !== null &&
                bestScoreMap.get(lesson.quiz.id) >=
                  lesson.quiz.passingScore,
            }
            : null;

        return {
          ...lesson,
          quiz,

          isLocked,

          // Không trả link video/tài liệu của bài
          // bị khóa cho học sinh chưa đăng ký.
          video: isLocked ? null : lesson.video,
          documents: isLocked
            ? []
            : lesson.documents,

          // completedAt có giá trị
          // => bài học đã hoàn thành
          isCompleted:
            progress?.completedAt !== null &&
            progress?.completedAt !== undefined,

          completedAt:
            progress?.completedAt ?? null,

          lastAccessedAt:
            progress?.lastAccessedAt ?? null,

          videoPositionSeconds:
            progress?.videoPositionSeconds ?? 0,

          videoDurationSeconds:
            progress?.videoDurationSeconds ?? 0,
        };
      });

    // ------------------------------------------
    // 11. Find continue lesson
    // ------------------------------------------

    const accessibleLessons =
      lessonsWithProgress.filter(
        (lesson) => !lesson.isLocked
      );

    const continueLesson =
      accessibleLessons.find(
        (lesson) => !lesson.isCompleted
      );

    return {
      course,
      lessons: lessonsWithProgress,

      continueLessonId:
        continueLesson?.id ??
        accessibleLessons[0]?.id ??
        null,

      enrollment: hasFullAccess
        ? {
          enrolledAt:
            enrollment.enrolledAt,

          expiresAt:
            enrollment.expiresAt,
        }
        : null,

      enrollmentExpired: Boolean(
        enrollment && enrollment.expiresAt <= now
      ),
    };
  },

  // ==========================================
  // Access lesson
  // ==========================================

  // ==========================================
  // Accumulate active study time for a lesson
  // (video, reading and quiz while the page is open)
  // ==========================================

  async addLessonTime({
    lessonId,
    studentId,
    seconds,
  }) {
    const numericSeconds = Math.floor(Number(seconds));

    if (
      !Number.isFinite(numericSeconds) ||
      numericSeconds < 1
    ) {
      const error = new Error(
        "Thời gian học không hợp lệ."
      );
      error.statusCode = 400;
      throw error;
    }

    const cappedSeconds = Math.min(numericSeconds, 120);

    await learningService.assertLessonAccess({
      lessonId,
      studentId,
    });

    const progress =
      await learningRepository.findLessonProgress({
        studentId,
        lessonId,
      });

    const nextSeconds =
      getLessonStudySeconds(progress) + cappedSeconds;

    if (progress) {
      return learningRepository.updateLessonProgress({
        studentId,
        lessonId,
        data: {
          timeSpentSeconds: nextSeconds,
        },
      });
    }

    return learningRepository.createLessonProgress({
      studentId,
      lessonId,
      timeSpentSeconds: cappedSeconds,
    });
  },

  async accessLesson({
    lessonId,
    studentId,
  }) {
    await learningService.assertLessonAccess({
      lessonId,
      studentId,
    });

    const now = new Date();

    // ------------------------------------------
    // 5. Find existing progress
    // ------------------------------------------

    const existingProgress =
      await learningRepository.findLessonProgress({
        studentId,
        lessonId,
      });

    // ------------------------------------------
    // 6. Progress already exists
    // ------------------------------------------

    if (existingProgress) {
      return learningRepository.updateLessonProgress({
        studentId,
        lessonId,
        data: {
          lastAccessedAt: now,
        },
      });
    }

    // ------------------------------------------
    // 7. Create progress
    // ------------------------------------------

    return learningRepository.createLessonProgress({
      studentId,
      lessonId,
      lastAccessedAt: now,
    });
  },

  // ==========================================
  // Complete lesson
  // ==========================================

  // ==========================================
  // Video progress
  // PATCH /learning/lessons/:lessonId/progress
  // ==========================================

  async updateVideoProgress({
    lessonId,
    studentId,
    positionSeconds,
    durationSeconds,
  }) {
    const { lesson } =
      await learningService.assertLessonAccess({
        lessonId,
        studentId,
      });

    const existingProgress =
      await learningRepository.findLessonProgress({
        studentId,
        lessonId,
      });

    const reportedDuration = Math.max(
      0,
      Math.floor(Number(durationSeconds) || 0)
    );

    // Thời lượng lưu trong bài học là nguồn chuẩn;
    // không tin thời lượng do client gửi lên.
    const lessonDuration = Math.max(
      0,
      Math.floor(Number(lesson.duration) || 0)
    );

    const effectiveDuration =
      lessonDuration > 0
        ? lessonDuration
        : reportedDuration > 0
          ? reportedDuration
          : existingProgress?.videoDurationSeconds ?? 0;

    const rawPosition = Math.max(
      0,
      Math.floor(Number(positionSeconds) || 0)
    );

    const safePosition =
      effectiveDuration > 0
        ? Math.min(rawPosition, effectiveDuration)
        : rawPosition;

    let progress;

    if (!existingProgress) {
      progress =
        await learningRepository.createLessonProgress({
          studentId,
          lessonId,
          lastAccessedAt: new Date(),
          videoPositionSeconds: safePosition,
          videoDurationSeconds: effectiveDuration,
        });
    } else {
      progress =
        await learningRepository.updateLessonProgress({
          studentId,
          lessonId,
          data: {
            videoPositionSeconds: safePosition,
            videoDurationSeconds: effectiveDuration,
          },
        });
    }

    const { completion } =
      await evaluateLessonCompletion({
        lesson,
        studentId,
        progress,
      });

    return completion;
  },

  // ==========================================
  // Reading timer (quy tắc ngầm 10 giây)
  // POST /learning/lessons/:lessonId/reading
  // ==========================================

  async markReadingComplete({
    lessonId,
    studentId,
  }) {
    const { lesson } =
      await learningService.assertLessonAccess({
        lessonId,
        studentId,
      });

    const progress =
      await learningRepository.findLessonProgress({
        studentId,
        lessonId,
      });

    if (!progress) {
      return buildCompletionState({
        lesson,
        progress: null,
        quiz: null,
        quizPassed: false,
      });
    }

    const { completion } =
      await evaluateLessonCompletion({
        lesson,
        studentId,
        progress,
      });

    return completion;
  },

  // ==========================================
  // Đồng bộ hoàn thành sau khi học sinh làm đề
  // ==========================================

  async refreshLessonCompletion({
    lessonId,
    studentId,
  }) {
    const lesson =
      await learningRepository.findLessonById(lessonId);

    if (!lesson) return null;

    const progress =
      await learningRepository.findLessonProgress({
        studentId,
        lessonId,
      });

    if (!progress) return null;

    const { completion } =
      await evaluateLessonCompletion({
        lesson,
        studentId,
        progress,
      });

    return completion;
  },

  // ==========================================
  // Get course progress
  // ==========================================

  async getCourseProgress({
    courseId,
    studentId,
  }) {
    // ------------------------------------------
    // 1. Find course
    // ------------------------------------------

    const course =
      await learningRepository.findCourseById(
        courseId
      );

    if (!course) {
      const error = new Error(
        "Không tìm thấy khóa học."
      );
      error.statusCode = 404;
      throw error;
    }

    if (course.isDelete) {
      const error = new Error(
        "Khóa học đã bị xóa."
      );
      error.statusCode = 404;
      throw error;
    }

    // ------------------------------------------
    // 2. Check enrollment
    // ------------------------------------------

    const enrollment =
      await learningRepository.findEnrollment({
        studentId,
        courseId,
      });

    if (!enrollment) {
      const error = new Error(
        "Bạn chưa tham gia khóa học này."
      );
      error.statusCode = 403;
      throw error;
    }

    // ------------------------------------------
    // 3. Check expiration
    // ------------------------------------------

    const now = new Date();

    if (enrollment.expiresAt <= now) {
      const error = new Error(
        "Thời hạn học khóa học đã hết."
      );
      error.statusCode = 403;
      throw error;
    }

    // ------------------------------------------
    // 4. Get lessons
    // ------------------------------------------

    const lessons =
      await learningRepository.findLessonsByCourseId(
        courseId
      );

    // ------------------------------------------
    // 5. Get progress
    // ------------------------------------------

    const progressList =
      await learningRepository.findLessonProgressByCourse({
        studentId,
        courseId,
      });

    // ------------------------------------------
    // 6. Calculate progress
    // ------------------------------------------

    const completedLessonIds = new Set(
      progressList
        .filter(
          (progress) =>
            progress.completedAt !== null
        )
        .map(
          (progress) =>
            progress.lessonId
        )
    );

    const totalLessons = lessons.length;

    const completedLessons =
      completedLessonIds.size;

    const progress =
      totalLessons > 0
        ? Math.round(
          (completedLessons /
            totalLessons) *
          100
        )
        : 0;

    return {
      courseId,
      totalLessons,
      completedLessons,
      progress,
    };
  },

  // ==========================================
  // Get lesson progress
  // ==========================================

  async getLessonProgress({
    lessonId,
    studentId,
  }) {
    // ------------------------------------------
    // 1. Find lesson
    // ------------------------------------------

    const lesson =
      await learningRepository.findLessonById(
        lessonId
      );

    if (!lesson) {
      const error = new Error(
        "Không tìm thấy bài học."
      );
      error.statusCode = 404;
      throw error;
    }

    const course = lesson.course;

    // ------------------------------------------
    // 2. Check course
    // ------------------------------------------

    if (!course) {
      const error = new Error(
        "Không tìm thấy khóa học của bài học."
      );
      error.statusCode = 404;
      throw error;
    }

    if (course.isDelete) {
      const error = new Error(
        "Khóa học đã bị xóa."
      );
      error.statusCode = 404;
      throw error;
    }

    // ------------------------------------------
    // 3. Check enrollment
    // ------------------------------------------

    const enrollment =
      await learningRepository.findEnrollment({
        studentId,
        courseId: course.id,
      });

    if (!lesson.isFree && !enrollment) {
      const error = new Error(
        "Bạn chưa tham gia khóa học này."
      );
      error.statusCode = 403;
      throw error;
    }

    // ------------------------------------------
    // 4. Check expiration
    // ------------------------------------------

    const now = new Date();

    if (
      !lesson.isFree &&
      enrollment &&
      enrollment.expiresAt <= now
    ) {
      const error = new Error(
        "Thời hạn học khóa học đã hết."
      );
      error.statusCode = 403;
      throw error;
    }

    // ------------------------------------------
    // 5. Get progress
    // ------------------------------------------

    const progress =
      await learningRepository.findLessonProgress({
        studentId,
        lessonId,
      });

    return {
      lessonId,

      isCompleted:
        progress?.completedAt !== null &&
        progress?.completedAt !== undefined,

      completedAt:
        progress?.completedAt ?? null,

      lastAccessedAt:
        progress?.lastAccessedAt ?? null,
    };
  },
};

export default learningService;
