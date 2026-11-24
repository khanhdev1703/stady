import {
    Bell,
    BookOpen,
    Compass,
    UserRound,
} from "lucide-react";

const studentMenuItems = [
    {
        label: "Học tập",
        path: "/student/courses",
        icon: BookOpen,
        end: false,
    },
    {
        label: "Khám phá",
        path: "/student/explore",
        icon: Compass,
        end: false,
    },
    {
        label: "Thông báo",
        path: "/student/notifications",
        icon: Bell,
        end: true,
        showBadge: true,
    },
    {
        label: "Hồ sơ",
        path: "/student/profile",
        icon: UserRound,
        end: false,
    },
];

export default studentMenuItems;
