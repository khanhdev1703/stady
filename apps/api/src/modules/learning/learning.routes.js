// src/modules/learning/learning.routes.js

import { Router } from "express";

import auth from "../../middlewares/auth.js";
import authorize from "../../middlewares/authorize.js";

import learningController from "./learning.controller.js";

const router = Router();

// ==========================================
// Authentication
// ==========================================

router.use(auth);

// ==========================================
// Student learning
// ==========================================
// ==========================================
// STUDENT
// ==========================================

// GET /enrollment/my-courses
router.get(
  "/my-courses",
  authorize("STUDENT"),
  learningController.getMyCourses
);

// Get my learning progress
// GET /learning/my-progress
router.get(
  "/my-progress",
  authorize("STUDENT"),
  learningController.getMyProgress
);

// Get course for learning
// GET /learning/courses/:courseId
router.get(
  "/courses/:courseId",
  authorize("STUDENT"),
  learningController.getCourseForLearning
);

// Enroll in a free course
// POST /learning/courses/:courseId/enroll
router.post(
  "/courses/:courseId/enroll",
  authorize("STUDENT"),
  learningController.enrollFreeCourse
);

// Issue a course completion certificate
// POST /learning/courses/:courseId/certificate
router.post(
  "/courses/:courseId/certificate",
  authorize("STUDENT"),
  learningController.issueCertificate
);

// Get course progress
// GET /learning/courses/:courseId/progress
router.get(
  "/courses/:courseId/progress",
  authorize("STUDENT"),
  learningController.getCourseProgress
);

// Access lesson
// POST /learning/lessons/:lessonId/access
router.post(
  "/lessons/:lessonId/access",
  authorize("STUDENT"),
  learningController.accessLesson
);

// Accumulate study time while a lesson is open
// POST /learning/lessons/:lessonId/time
router.post(
  "/lessons/:lessonId/time",
  authorize("STUDENT"),
  learningController.addLessonTime
);

// Update video progress
// PATCH /learning/lessons/:lessonId/progress
router.patch(
  "/lessons/:lessonId/progress",
  authorize("STUDENT"),
  learningController.updateVideoProgress
);

// Reading timer (quy tắc ngầm 10 giây)
// POST /learning/lessons/:lessonId/reading
router.post(
  "/lessons/:lessonId/reading",
  authorize("STUDENT"),
  learningController.markReadingComplete
);

// Get lesson progress
// GET /learning/lessons/:lessonId/progress
router.get(
  "/lessons/:lessonId/progress",
  authorize("STUDENT"),
  learningController.getLessonProgress
);

export default router;
