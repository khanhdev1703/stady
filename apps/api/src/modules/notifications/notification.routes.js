import { Router } from "express";

import auth from "../../middlewares/auth.js";
import authorize from "../../middlewares/authorize.js";

import notificationController from "./notification.controller.js";

const router = Router();

router.use(auth);
router.use(authorize("STUDENT"));

router.get(
    "/stream",
    notificationController.stream
);

router.get(
    "/",
    notificationController.getMyNotifications
);

router.get(
    "/unread-count",
    notificationController.getUnreadCount
);

router.patch(
    "/read-all",
    notificationController.markAllRead
);

router.patch(
    "/:notificationId/read",
    notificationController.markRead
);

export default router;
