// src/modules/learning/learning.repository.js

import { prisma } from "../../config/database.js";

const learningRepository = {

  // ==========================================
  // Get all enrollments of a student
  // ==========================================

  async findByStudentId(studentId) {
    return prisma.enrollment.findMany({
      where: {
        studentId,
        expiresAt: {
          gt: new Date(),
        },
        course: {
          isDelete: false,
          status: true,
        },
      },
      include: {
        course: true,
      },
      orderBy: {
        enrolledAt: "desc",
      },
    });
  },

  async findExpiredByStudentId(studentId) {
    return prisma.enrollment.findMany({
      where: {
        studentId,
        expiresAt: {
          lte: new Date(),
        },
        course: {
          isDelete: false,
        },
      },
      include: {
        course: true,
      },
      orderBy: {
        expiresAt: "desc",
      },
    });
  },

  async findLessonsByCourseIds(courseIds) {
    if (courseIds.length === 0) return [];

    return prisma.lesson.findMany({
      where: {
        courseId: {
          in: courseIds,
        },
      },
      select: {
        id: true,
        courseId: true,
      },
    });
  },

  async findProgressByCourseIds({
    studentId,
    courseIds,
  }) {
    if (courseIds.length === 0) return [];

    return prisma.lessonProgress.findMany({
      where: {
        studentId,
        lesson: {
          courseId: {
            in: courseIds,
          },
        },
      },
      select: {
        lessonId: true,
        completedAt: true,
        lastAccessedAt: true,
        lesson: {
          select: {
            courseId: true,
          },
        },
      },
    });
  },
  // ==========================================
  // Course
  // ==========================================

  async findCourseById(courseId) {
    return prisma.course.findUnique({
      where: {
        id: courseId,
      },
    });
  },

  async findCourseWithTeacher(courseId) {
    return prisma.course.findUnique({
      where: {
        id: courseId,
      },
      include: {
        teacher: {
          select: {
            name: true,
          },
        },
      },
    });
  },

  // ==========================================
  // Enrollment
  // ==========================================

  async findEnrollment({
    studentId,
    courseId,
  }) {
    return prisma.enrollment.findUnique({
      where: {
        studentId_courseId: {
          studentId,
          courseId,
        },
      },
    });
  },

  async createEnrollment(data) {
    return prisma.enrollment.create({
      data,
    });
  },

  async updateEnrollment(id, data) {
    return prisma.enrollment.update({
      where: {
        id,
      },
      data,
    });
  },

  // ==========================================
  // Certificate
  // ==========================================

  async findCertificate({
    studentId,
    courseId,
  }) {
    return prisma.certificate.findUnique({
      where: {
        studentId_courseId: {
          studentId,
          courseId,
        },
      },
    });
  },

  async createCertificate(data) {
    return prisma.certificate.create({
      data,
    });
  },

  async findCertificateCourseIds({
    studentId,
    courseIds,
  }) {
    if (courseIds.length === 0) return [];

    const certificates = await prisma.certificate.findMany({
      where: {
        studentId,
        courseId: {
          in: courseIds,
        },
      },
      select: {
        courseId: true,
      },
    });

    return certificates.map(
      (certificate) => certificate.courseId
    );
  },

  async findStudentById(studentId) {
    return prisma.user.findUnique({
      where: {
        id: studentId,
      },
      select: {
        id: true,
        name: true,
      },
    });
  },

  // ==========================================
  // Lesson
  // ==========================================

  async findLessonsByCourseId(courseId) {
    return prisma.lesson.findMany({
      where: {
        courseId,
      },
      include: {
        documents: true,
        quiz: {
          select: {
            id: true,
            title: true,
            passingScore: true,
            isPublished: true,
            requiresPassForCompletion: true,
            _count: {
              select: {
                questions: true,
              },
            },
          },
        },
      },
      orderBy: {
        order: "asc",
      },
    });
  },

  async findQuizAttemptScores({
    quizIds,
    studentId,
  }) {
    if (quizIds.length === 0) return [];

    return prisma.quizAttempt.findMany({
      where: {
        studentId,
        quizId: {
          in: quizIds,
        },
        submittedAt: {
          not: null,
        },
      },
      select: {
        quizId: true,
        score: true,
      },
    });
  },

  async findQuizAttemptsForStats(studentId) {
    return prisma.quizAttempt.findMany({
      where: {
        studentId,
      },
      select: {
        startedAt: true,
        submittedAt: true,
      },
    });
  },

  async findPublishedQuizByLesson(lessonId) {
    return prisma.quiz.findFirst({
      where: {
        lessonId,
        isPublished: true,
      },
      select: {
        id: true,
        passingScore: true,
        requiresPassForCompletion: true,
        _count: {
          select: {
            questions: true,
          },
        },
      },
    });
  },

  async hasPassedQuizAttempt({
    quizId,
    studentId,
    passingScore,
  }) {
    const attempt = await prisma.quizAttempt.findFirst({
      where: {
        quizId,
        studentId,
        submittedAt: {
          not: null,
        },
        score: {
          gte: passingScore,
        },
      },
      select: {
        id: true,
      },
    });

    return Boolean(attempt);
  },

  async findLessonById(lessonId) {
    return prisma.lesson.findUnique({
      where: {
        id: lessonId,
      },
      include: {
        course: true,
      },
    });
  },

  // ==========================================
  // Lesson Progress
  // ==========================================

  async findLessonProgress({
    studentId,
    lessonId,
  }) {
    return prisma.lessonProgress.findUnique({
      where: {
        studentId_lessonId: {
          studentId,
          lessonId,
        },
      },
    });
  },

  async findLessonProgressByCourse({
    studentId,
    courseId,
  }) {
    return prisma.lessonProgress.findMany({
      where: {
        studentId,
        lesson: {
          courseId,
        },
      },
    });
  },

  async findProgressForStats(studentId) {
    return prisma.lessonProgress.findMany({
      where: {
        studentId,
      },
      select: {
        lastAccessedAt: true,
        completedAt: true,
        timeSpentSeconds: true,
        videoPositionSeconds: true,
        videoDurationSeconds: true,
      },
    });
  },

  async createLessonProgress(data) {
    return prisma.lessonProgress.create({
      data,
    });
  },

  async updateLessonProgress({
    studentId,
    lessonId,
    data,
  }) {
    return prisma.lessonProgress.update({
      where: {
        studentId_lessonId: {
          studentId,
          lessonId,
        },
      },
      data,
    });
  },
};

export default learningRepository;
